import type { WASocket } from '@whiskeysockets/baileys';
import * as gs from '../db/repositories/group-settings.js';
import * as warns from '../db/repositories/warns.js';
import { checkPermission } from '../dispatcher/permissions.js';
import { ensureBotIsGroupAdmin, fmtJid } from '../lib/format.js';
import { logger } from '../logger.js';
import type { ParsedMessage } from '../dispatcher/parser.js';

const LINK_RE = /(https?:\/\/|wa\.me\/|chat\.whatsapp\.com\/|t\.me\/|discord\.gg\/)/i;

export async function maybeEnforceAntilink(
  sock: WASocket,
  msg: ParsedMessage,
): Promise<boolean> {
  if (!msg.isGroup) return false;
  const settings = await gs.get(msg.jid);
  if (!settings.antilink) return false;
  if (!LINK_RE.test(msg.text)) return false;

  const senderIsAdmin = await checkPermission('group-admin', {
    sock,
    senderJid: msg.sender,
    chatJid: msg.jid,
    isGroup: true,
  });
  if (senderIsAdmin) return false;

  if (!(await ensureBotIsGroupAdmin(sock, msg.jid))) {
    logger.warn({ group: msg.jid }, 'antilink wants to delete but bot is not admin');
    return false;
  }

  try {
    await sock.sendMessage(msg.jid, { delete: msg.raw.key });
    const count = await warns.add(msg.jid, msg.sender, 'antilink', 'posted a link');
    await sock.sendMessage(msg.jid, {
      text: `Link removed. ${fmtJid(msg.sender)} warned (${count}/3).`,
      mentions: [msg.sender],
    });
    return true;
  } catch (err) {
    logger.warn({ err }, 'antilink delete failed');
    return false;
  }
}
