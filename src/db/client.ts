import { neonConfig, Pool } from '@neondatabase/serverless';
import { getConfig } from '../config.js';
import { logger } from '../logger.js';

neonConfig.fetchConnectionCache = true;

let pool: Pool | null = null;

export function getPool(): Pool {
  if (pool) return pool;
  const cfg = getConfig();
  pool = new Pool({ connectionString: cfg.DATABASE_URL });
  pool.on('error', (err) => logger.error({ err }, 'pg pool error'));
  return pool;
}

export async function query<T = unknown>(
  text: string,
  params: unknown[] = [],
): Promise<{ rows: T[]; rowCount: number }> {
  const p = getPool();
  const res = await p.query(text, params);
  return { rows: res.rows as T[], rowCount: res.rowCount ?? 0 };
}

export async function close(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
