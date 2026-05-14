import { startHealthServer } from './server.js';
import { logger } from './logger.js';

async function main(): Promise<void> {
  startHealthServer();
  logger.info('theseus-yarard booting');
}

main().catch((err) => {
  logger.fatal({ err }, 'fatal boot error');
  process.exit(1);
});
