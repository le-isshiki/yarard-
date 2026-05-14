import { query } from '../client.js';

export type Role = 'user' | 'assistant' | 'system';

export interface ConversationRow {
  jid: string;
  message_id: number;
  role: Role;
  content: string;
  sender_jid: string | null;
  created_at: Date;
}

export async function append(
  jid: string,
  role: Role,
  content: string,
  senderJid: string | null = null,
): Promise<number> {
  const { rows } = await query<{ message_id: number }>(
    `INSERT INTO conversations (jid, role, content, sender_jid)
     VALUES ($1, $2, $3, $4) RETURNING message_id`,
    [jid, role, content, senderJid],
  );
  return rows[0]!.message_id;
}

export async function latest(jid: string, n: number): Promise<ConversationRow[]> {
  const { rows } = await query<ConversationRow>(
    `SELECT jid, message_id, role, content, sender_jid, created_at
     FROM conversations WHERE jid = $1
     ORDER BY message_id DESC LIMIT $2`,
    [jid, n],
  );
  return rows.reverse();
}

export async function countFor(jid: string): Promise<number> {
  const { rows } = await query<{ c: string }>(
    `SELECT COUNT(*)::text AS c FROM conversations WHERE jid = $1`,
    [jid],
  );
  return Number(rows[0]!.c);
}

export async function deleteUpTo(jid: string, maxMessageId: number): Promise<number> {
  const res = await query(
    `DELETE FROM conversations WHERE jid = $1 AND message_id <= $2`,
    [jid, maxMessageId],
  );
  return res.rowCount;
}
