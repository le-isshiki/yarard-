import type { WASocket } from '@whiskeysockets/baileys';
import { logger } from '../logger.js';

export function registerCallRejection(sock: WASocket): void {
  sock.ev.on('call', async (events) => {
    for (const e of events) {
      if (e.status === 'offer') {
        try {
          await sock.rejectCall(e.id, e.from);
          logger.info({ from: e.from, callId: e.id }, 'rejected call');
        } catch (err) {
          logger.warn({ err, callId: e.id }, 'failed to reject call');
        }
      }
    }
  });
}
