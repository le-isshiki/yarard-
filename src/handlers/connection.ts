import type { Boom } from '@hapi/boom';
import { DisconnectReason, type WASocket } from '@whiskeysockets/baileys';
import { logger } from '../logger.js';

export interface ConnectionState {
  consecutiveFails: number;
}

export function registerConnectionHandler(
  sock: WASocket,
  saveCreds: () => Promise<void>,
  state: ConnectionState,
  onLoggedOut: () => Promise<void>,
  onShouldReconnect: () => Promise<void>,
): void {
  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      logger.warn('QR code received — should not happen if pairing-code flow is active');
    }
    if (connection === 'open') {
      state.consecutiveFails = 0;
      logger.info({ user: sock.user?.id }, 'whatsapp connection open');
    }
    if (connection === 'close') {
      const code = (lastDisconnect?.error as Boom | undefined)?.output?.statusCode;
      const isLoggedOut = code === DisconnectReason.loggedOut;
      logger.warn(
        { code, isLoggedOut, fails: state.consecutiveFails },
        'whatsapp connection closed',
      );
      if (isLoggedOut) {
        await onLoggedOut();
        return;
      }
      state.consecutiveFails += 1;
      if (state.consecutiveFails >= 10) {
        logger.fatal(
          { fails: state.consecutiveFails },
          'too many consecutive disconnects — exiting',
        );
        process.exit(1);
      }
      await onShouldReconnect();
    }
  });
}
