import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { getPool } from './client.js';
import { logger } from '../logger.js';

const here = dirname(fileURLToPath(import.meta.url));

export async function migrate(): Promise<void> {
  const sql = await readFile(join(here, 'schema.sql'), 'utf-8');
  const pool = getPool();
  await pool.query(sql);
  logger.info('db migrations applied');
}
