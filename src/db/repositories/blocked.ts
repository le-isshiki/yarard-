import { query } from '../client.js';

export async function add(jid: string, blockedBy: string, reason: string | null): Promise<void> {
  await query(
    `INSERT INTO blocked_jids (jid, blocked_by, reason) VALUES ($1, $2, $3)
     ON CONFLICT (jid) DO NOTHING`,
    [jid, blockedBy, reason],
  );
}

export async function remove(jid: string): Promise<boolean> {
  const res = await query(`DELETE FROM blocked_jids WHERE jid = $1`, [jid]);
  return res.rowCount > 0;
}

export async function isBlocked(jid: string): Promise<boolean> {
  const { rows } = await query(`SELECT 1 FROM blocked_jids WHERE jid = $1`, [jid]);
  return rows.length > 0;
}
