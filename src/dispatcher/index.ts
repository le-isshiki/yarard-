import type { WASocket, WAMessage } from '@whiskeysockets/baileys';
import { logger } from '../logger.js';
import { parseMessage } from './parser.js';
import { classify } from './classify.js';
import { checkPermission } from './permissions.js';
import { get as getCommand } from '../commands/index.js';
import { makeCtx } from './ctx.js';
import { handleAiReply } from '../ai/chat.js';
import { normalize } from '../lib/jid.js';
import { isBlocked } from '../db/repositories/blocked.js';
import { maybeEnforceAntilink } from '../handlers/antilink.js';
import { maybeEnforceAntibadword } from '../handlers/antibadword.js';
import { shouldAutoread } from '../commands/automation/autoread.js';

let botJidCache: string | null = null;

export function setBotJid(jid: string): void {
  botJidCache = normalize(jid);
}

export async function handleUpsert(
  sock: WASocket,
  upsert: { messages: WAMessage[]; type: string },
): Promise<void> {
  if (upsert.type !== 'notify') return;
  for (const raw of upsert.messages) {
    try {
      await handleOne(sock, raw);
    } catch (err) {
      logger.error({ err, msgId: raw.key.id }, 'dispatcher: handler crashed');
    }
  }
}

async function handleOne(sock: WASocket, raw: WAMessage): Promise<void> {
  const msg = parseMessage(raw);
  if (!msg || msg.isFromMe) return;
  if (await isBlocked(msg.sender)) return;

  const stopped =
    (await maybeEnforceAntilink(sock, msg)) ||
    (await maybeEnforceAntibadword(sock, msg));
  if (stopped) return;

  const botJid = botJidCache ?? sock.user?.id ?? '';
  const c = classify(msg, botJid);

  if (c.commandName) {
    const cmd = getCommand(c.commandName);
    if (!cmd) return;
    const allowed = await checkPermission(cmd.permission, {
      sock,
      senderJid: msg.sender,
      chatJid: msg.jid,
      isGroup: msg.isGroup,
    });
    if (!allowed) {
      logger.info({ cmd: cmd.name, sender: msg.sender }, 'permission denied');
      return;
    }
    const ctx = makeCtx(sock, msg, c.args);
    try {
      await cmd.run(ctx);
    } catch (err) {
      logger.error({ err, cmd: cmd.name }, 'command threw');
      await ctx.react('❌').catch(() => {});
      await ctx.reply('Something went wrong running that command.').catch(() => {});
    }
    if (msg.isDm && (await shouldAutoread())) {
      await sock.readMessages([raw.key]).catch(() => {});
    }
    return;
  }

  if (c.aiTrigger) {
    await handleAiReply(sock, msg);
    if (msg.isDm && (await shouldAutoread())) {
      await sock.readMessages([raw.key]).catch(() => {});
    }
  }
}
