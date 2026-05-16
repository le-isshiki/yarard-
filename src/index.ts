import makeWASocket, { Browsers, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import { startHealthServer } from './server.js';
import { logger } from './logger.js';
import { getConfig } from './config.js';
import { migrate } from './db/migrate.js';
import { useNeonAuthState, flushAuthState } from './auth/neon-auth-state.js';
import { registerCallRejection } from './handlers/calls.js';
import {
  registerConnectionHandler,
  type ConnectionState,
} from './handlers/connection.js';
import { registerAntidelete } from './handlers/antidelete.js';
import { backoffMs } from './lib/retry.js';
import { handleUpsert, setBotJid } from './dispatcher/index.js';
import { loadAll } from './commands/index.js';

const cfg = getConfig();
const connState: ConnectionState = { consecutiveFails: 0 };

async function makeSocket(): Promise<void> {
  const { state, saveCreds } = await useNeonAuthState();
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger: logger.child({ component: 'baileys' }) as never,
    browser: Browsers.macOS('Safari'),
    syncFullHistory: false,
    markOnlineOnConnect: false,
    defaultQueryTimeoutMs: 120_000,
    keepAliveIntervalMs: 15_000,
  });

  if (!state.creds.registered) {
    const pairNumber = cfg.BOT_NUMBER ?? cfg.OWNER_NUMBER;
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(pairNumber);
        logger.info(
          { code, phone: pairNumber },
          'PAIRING CODE — open WhatsApp on the phone whose number matches `phone` above → Linked Devices → Link with phone number',
        );
        process.stdout.write(
          `\n=== PAIRING CODE: ${code}  (enter on +${pairNumber}) ===\n\n`,
        );
      } catch (err) {
        logger.error({ err }, 'failed to request pairing code');
      }
    }, 3000);
  }

  registerCallRejection(sock);
  registerAntidelete(sock);

  sock.ev.on('messages.upsert', (m) => {
    handleUpsert(sock, m).catch((err) =>
      logger.error({ err }, 'dispatcher handleUpsert crashed'),
    );
  });

  sock.ev.on('connection.update', (u) => {
    if (u.connection === 'open' && sock.user?.id) setBotJid(sock.user.id);
  });

  registerConnectionHandler(
    sock,
    saveCreds,
    connState,
    async () => {
      // Do NOT auto-truncate auth_state here. WhatsApp returns 401 for
      // BOTH a real device-removal logout AND transient noise-handshake
      // "Connection Failure"s (common on flaky/cold hosts). Wiping the
      // session on the first ambiguous 401 destroys a recoverable
      // session and forces a full re-pair. Preserve creds and exit: a
      // spurious 401 self-heals on the next boot via pull login; a
      // genuine logout needs a deliberate manual `TRUNCATE auth_state`.
      logger.fatal(
        'WhatsApp closed the connection with 401. NOT wiping the saved session automatically (a transient handshake 401 would self-heal on restart). If the bot keeps booting and immediately getting 401 with pull:true, the device was genuinely logged out — then, and only then, run `TRUNCATE auth_state;` in Neon and redeploy to re-pair.',
      );
      await flushAuthState();
      process.exit(1);
    },
    async () => {
      const delay = backoffMs(connState.consecutiveFails - 1);
      logger.info({ delay }, 'reconnecting…');
      await new Promise((r) => setTimeout(r, delay));
      await makeSocket();
    },
  );
}

async function main(): Promise<void> {
  await migrate();
  startHealthServer();
  await loadAll();
  await makeSocket();
  logger.info('theseus-yarard online');
}

main().catch((err) => {
  logger.fatal({ err }, 'fatal boot error');
  process.exit(1);
});
