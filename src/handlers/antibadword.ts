import type { WASocket } from '@whiskeysockets/baileys';
import * as gs from '../db/repositories/group-settings.js';
import * as warns from '../db/repositories/warns.js';
import { checkPermission } from '../dispatcher/permissions.js';
import { ensureBotIsGroupAdmin, fmtJid } from '../lib/format.js';
import type { ParsedMessage } from '../dispatcher/parser.js';

const DEFAULTS = ['fuck', 'shit', 'bitch', 'asshole'];

export async function maybeEnforceAntibadword(
  sock: WASocket,
  msg: ParsedMessage,
): Promise<boolean> {
  if (!msg.isGroup) return false;
  const settings = await gs.get(msg.jid);
  if (!settings.antibadword) return false;

  const list = [...DEFAULTS, ...(settings.badwords ?? [])];
  const lower = msg.text.toLowerCase();
  const hit = list.find((w) =>
    new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(lower),
  );
  if (!hit) return false;

  const senderIsAdmin = await checkPermission('group-admin', {
    sock,
    senderJid: msg.sender,
    chatJid: msg.jid,
    isGroup: true,
  });
  if (senderIsAdmin) return false;
  if (!(await ensureBotIsGroupAdmin(sock, msg.jid))) return false;

  await sock.sendMessage(msg.jid, { delete: msg.raw.key });
  const count = await warns.add(msg.jid, msg.sender, 'antibadword', `used: ${hit}`);
  await sock.sendMessage(msg.jid, {
    text: `Language. ${fmtJid(msg.sender)} warned (${count}/3).`,
    mentions: [msg.sender],
  });
  return true;
}
