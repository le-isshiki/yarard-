import { Pool } from '@neondatabase/serverless';
import { readFile } from 'node:fs/promises';

const SCHEMA_PATH = new URL('../../src/db/schema.sql', import.meta.url);

export async function getTestPool(): Promise<Pool> {
  const url = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error('TEST_DATABASE_URL or DATABASE_URL must be set for integration tests');
  const pool = new Pool({ connectionString: url });
  const sql = await readFile(SCHEMA_PATH, 'utf-8');
  await pool.query(sql);
  return pool;
}

export async function truncateAll(pool: Pool): Promise<void> {
  await pool.query(
    `TRUNCATE auth_state, conversations, conversation_summaries, group_settings,
              warns, sudo_users, token_usage, blocked_jids
     RESTART IDENTITY CASCADE`,
  );
}
