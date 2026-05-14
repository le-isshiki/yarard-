import { query } from '../client.js';

export interface WarnRow {
  id: number;
  group_jid: string;
  user_jid: string;
  warned_by: string;
  reason: string | null;
  created_at: Date;
}

export async function add(
  groupJid: string,
  userJid: string,
  warnedBy: string,
  reason: string | null,
): Promise<number> {
  await query(
    `INSERT INTO warns (group_jid, user_jid, warned_by, reason) VALUES ($1, $2, $3, $4)`,
    [groupJid, userJid, warnedBy, reason],
  );
  const { rows } = await query<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM warns WHERE group_jid = $1 AND user_jid = $2`,
    [groupJid, userJid],
  );
  return Number(rows[0]!.count);
}

export async function list(groupJid: string, userJid: string): Promise<WarnRow[]> {
  const { rows } = await query<WarnRow>(
    `SELECT * FROM warns WHERE group_jid = $1 AND user_jid = $2 ORDER BY id`,
    [groupJid, userJid],
  );
  return rows;
}

export async function clear(groupJid: string, userJid: string): Promise<number> {
  const res = await query(
    `DELETE FROM warns WHERE group_jid = $1 AND user_jid = $2`,
    [groupJid, userJid],
  );
  return res.rowCount;
}
