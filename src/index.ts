import makeWASocket, { Browsers, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import { startHealthServer } from './server.js';
import { logger } from './logger.js';
import { getConfig } from './config.js';
import { migrate } from './db/migrate.js';
import { useNeonAuthState } from './auth/neon-auth-state.js';
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
  const { state, saveCreds, clear } = await useNeonAuthState();
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
    logger: logger.child({ component: 'baileys' }) as never,
    browser: Browsers.macOS('Safari'),
    syncFullHistory: false,
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
      logger.warn('logged out — clearing auth_state and exiting');
      await clear();
      process.exit(0);
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
