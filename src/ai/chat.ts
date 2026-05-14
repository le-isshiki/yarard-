import type { WASocket } from '@whiskeysockets/baileys';
import { groq, CHAT_MODEL } from './groq.js';
import { buildContext, maybeCompress } from './memory.js';
import * as convo from '../db/repositories/conversations.js';
import { getState, recordUsage } from '../lib/ratelimit.js';
import { transcribe } from './voice.js';
import { logger } from '../logger.js';
import { withRetry } from '../lib/retry.js';
import type { ParsedMessage } from '../dispatcher/parser.js';

export async function handleAiReply(
  sock: WASocket,
  msg: ParsedMessage,
): Promise<void> {
  const cap = await getState(msg.sender);
  if (cap.capped) {
    await sock
      .sendMessage(
        msg.jid,
        {
          text: `You've hit today's chat limit (${cap.cap} tokens). Resets at 00:00 UTC.`,
        },
        { quoted: msg.raw },
      )
      .catch(() => {});
    return;
  }

  let userText = msg.text.trim();
  if (msg.kind === 'audio') {
    const t = await transcribe(msg.raw);
    if (!t) {
      await sock
        .sendMessage(
          msg.jid,
          {
            text: "I couldn't transcribe that voice note — could you type it instead?",
          },
          { quoted: msg.raw },
        )
        .catch(() => {});
      return;
    }
    userText = t;
  }
  if (!userText) return;

  const turns = await buildContext(msg.jid);
  const userContent = msg.isGroup
    ? `[${msg.pushName || msg.sender}]: ${userText}`
    : userText;
  turns.push({ role: 'user', content: userContent });

  let replyText = '';
  let usedTokens = 0;
  try {
    const completion = await withRetry(
      async () => {
        const c = groq();
        return c.chat.completions.create({
          model: CHAT_MODEL,
          messages: turns,
          temperature: 0.7,
          max_tokens: 800,
        });
      },
      { attempts: 2, baseMs: 2000 },
    );
    replyText = completion.choices[0]?.message?.content?.trim() ?? '';
    usedTokens = completion.usage?.total_tokens ?? 0;
  } catch (err) {
    logger.warn({ err }, 'groq chat failed after retries');
    await sock
      .sendMessage(
        msg.jid,
        { text: "I'm overloaded right now, try again in a minute." },
        { quoted: msg.raw },
      )
      .catch(() => {});
    return;
  }
  if (!replyText) return;

  await convo.append(msg.jid, 'user', userText, msg.isGroup ? msg.sender : null);
  await convo.append(msg.jid, 'assistant', replyText, null);
  await recordUsage(msg.sender, usedTokens);

  await sock.sendMessage(msg.jid, { text: replyText }, { quoted: msg.raw });

  maybeCompress(msg.jid).catch((err) =>
    logger.warn({ err }, 'compress error'),
  );
}
