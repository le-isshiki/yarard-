import type {
  WASocket,
  WAMessage,
  WAMessageUpdate,
  proto,
} from '@whiskeysockets/baileys';
import * as gs from '../db/repositories/group-settings.js';
import { isGroup, normalize } from '../lib/jid.js';
import { logger } from '../logger.js';

const cache = new Map<string, WAMessage>();
const MAX_CACHE = 5000;

function cacheKey(jid: string, id: string): string {
  return `${jid}:${id}`;
}

export function registerAntidelete(sock: WASocket): void {
  sock.ev.on('messages.upsert', ({ messages }) => {
    for (const m of messages) {
      if (!m.key.remoteJid || !m.key.id) continue;
      cache.set(cacheKey(normalize(m.key.remoteJid), m.key.id), m);
      if (cache.size > MAX_CACHE) {
        const first = cache.keys().next().value;
        if (first) cache.delete(first);
      }
    }
  });

  sock.ev.on('messages.update', async (updates) => {
    for (const u of updates) await handleUpdate(sock, u);
  });
}

async function handleUpdate(sock: WASocket, u: WAMessageUpdate): Promise<void> {
  const update = u.update as {
    message?: proto.IMessage | null;
    messageStubType?: number;
  };
  const isRevoke = update.message === null || update.messageStubType !== undefined;
  if (!u.key.remoteJid || !u.key.id || !isRevoke) return;

  const jid = normalize(u.key.remoteJid);
  if (!isGroup(jid)) return;
  const settings = await gs.get(jid);
  if (!settings.antidelete) return;

  const cached = cache.get(cacheKey(jid, u.key.id));
  if (!cached || !cached.message) return;

  try {
    const text =
      cached.message.conversation ??
      cached.message.extendedTextMessage?.text ??
      '(media)';
    const sender = cached.key.participant ?? cached.key.remoteJid ?? '';
    await sock.sendMessage(jid, {
      text: `Deleted message restored:\nFrom: @${sender.split('@')[0] ?? ''}\n${text}`,
      mentions: [sender],
    });
  } catch (err) {
    logger.warn({ err }, 'antidelete repost failed');
  }
}
