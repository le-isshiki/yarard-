import { query } from '../client.js';

export interface SummaryRow {
  jid: string;
  summary: string;
  covers_through_message_id: number;
  updated_at: Date;
}

export async function get(jid: string): Promise<SummaryRow | null> {
  const { rows } = await query<SummaryRow>(
    `SELECT jid, summary, covers_through_message_id, updated_at
     FROM conversation_summaries WHERE jid = $1`,
    [jid],
  );
  return rows[0] ?? null;
}

export async function upsert(
  jid: string,
  summary: string,
  coversThroughMessageId: number,
): Promise<void> {
  await query(
    `INSERT INTO conversation_summaries (jid, summary, covers_through_message_id, updated_at)
     VALUES ($1, $2, $3, NOW())
     ON CONFLICT (jid) DO UPDATE SET
       summary = EXCLUDED.summary,
       covers_through_message_id = EXCLUDED.covers_through_message_id,
       updated_at = NOW()`,
    [jid, summary, coversThroughMessageId],
  );
}
