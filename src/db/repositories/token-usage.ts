import { query } from '../client.js';

export async function add(
  userJid: string,
  day: string,
  tokens: number,
): Promise<number> {
  const { rows } = await query<{ tokens: number }>(
    `INSERT INTO token_usage (user_jid, day, tokens) VALUES ($1, $2::date, $3)
     ON CONFLICT (user_jid, day) DO UPDATE SET tokens = token_usage.tokens + EXCLUDED.tokens
     RETURNING tokens`,
    [userJid, day, tokens],
  );
  return rows[0]!.tokens;
}

export async function getToday(userJid: string, day: string): Promise<number> {
  const { rows } = await query<{ tokens: number }>(
    `SELECT tokens FROM token_usage WHERE user_jid = $1 AND day = $2::date`,
    [userJid, day],
  );
  return rows[0]?.tokens ?? 0;
}
