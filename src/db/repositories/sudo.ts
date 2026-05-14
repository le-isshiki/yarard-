import { query } from '../client.js';

export async function add(userJid: string, addedBy: string): Promise<void> {
  await query(
    `INSERT INTO sudo_users (user_jid, added_by) VALUES ($1, $2)
     ON CONFLICT (user_jid) DO NOTHING`,
    [userJid, addedBy],
  );
}

export async function remove(userJid: string): Promise<boolean> {
  const res = await query(`DELETE FROM sudo_users WHERE user_jid = $1`, [userJid]);
  return res.rowCount > 0;
}

export async function isSudo(userJid: string): Promise<boolean> {
  const { rows } = await query(`SELECT 1 FROM sudo_users WHERE user_jid = $1`, [userJid]);
  return rows.length > 0;
}

export async function list(): Promise<string[]> {
  const { rows } = await query<{ user_jid: string }>(
    `SELECT user_jid FROM sudo_users ORDER BY added_at`,
  );
  return rows.map((r) => r.user_jid);
}
