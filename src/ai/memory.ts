import { getConfig, DEFAULT_PERSONA } from '../config.js';
import * as convo from '../db/repositories/conversations.js';
import * as summaries from '../db/repositories/summaries.js';
import { groq, CHAT_MODEL } from './groq.js';
import { logger } from '../logger.js';

export interface ChatTurn {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const SUMMARIZE_PROMPT =
  'You will receive an existing running summary plus a new chunk of conversation. ' +
  'Produce an UPDATED summary in 6 bullet points maximum. ' +
  'Keep: names, decisions, ongoing topics, user preferences. ' +
  'Drop pleasantries and small talk. ' +
  'Respond with ONLY the summary, no preamble.';

export async function buildContext(jid: string): Promise<ChatTurn[]> {
  const cfg = getConfig();
  const persona = cfg.BOT_PERSONA ?? DEFAULT_PERSONA;
  const summary = await summaries.get(jid);
  const recent = await convo.latest(jid, cfg.MEMORY_WINDOW);

  const turns: ChatTurn[] = [{ role: 'system', content: persona }];
  if (summary) {
    turns.push({
      role: 'system',
      content: `Conversation summary so far (use this as background):\n${summary.summary}`,
    });
  }
  for (const row of recent) {
    if (row.role === 'system') continue;
    const prefix = row.sender_jid ? `[${row.sender_jid}] ` : '';
    turns.push({ role: row.role, content: prefix + row.content });
  }
  return turns;
}

export async function maybeCompress(jid: string): Promise<void> {
  const cfg = getConfig();
  const count = await convo.countFor(jid);
  if (count <= cfg.MEMORY_COMPRESS_AT) return;

  const recent10 = await convo.latest(jid, 10);
  if (recent10.length === 0) return;
  const cutoff = recent10[0]!.message_id - 1;
  if (cutoff < 0) return;

  const allButRecent = (await convo.latest(jid, 1000)).filter(
    (r) => r.message_id <= cutoff,
  );
  if (allButRecent.length === 0) return;

  const existing = await summaries.get(jid);
  const blob = allButRecent.map((r) => `${r.role}: ${r.content}`).join('\n');
  const prompt = existing
    ? `Existing summary:\n${existing.summary}\n\nNew conversation:\n${blob}`
    : `Conversation:\n${blob}`;

  try {
    const c = groq();
    const completion = await c.chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        { role: 'system', content: SUMMARIZE_PROMPT },
        { role: 'user', content: prompt },
      ],
      max_tokens: 400,
      temperature: 0.2,
    });
    const newSummary =
      completion.choices[0]?.message?.content?.trim() ?? existing?.summary ?? '';
    if (newSummary) {
      await summaries.upsert(jid, newSummary, cutoff);
      await convo.deleteUpTo(jid, cutoff);
      logger.info({ jid, deleted: allButRecent.length }, 'memory compressed');
    }
  } catch (err) {
    logger.warn({ err, jid }, 'memory compress failed — keeping rows');
  }
}
