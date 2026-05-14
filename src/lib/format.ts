import type { WASocket } from '@whiskeysockets/baileys';
import { normalize } from './jid.js';

export interface TargetCtx {
  msg: {
    mentions: string[];
    quoted: { sender: string } | null;
  };
}

export function targetFromCtx(ctx: TargetCtx): string | null {
  if (ctx.msg.mentions.length > 0) return ctx.msg.mentions[0]!;
  if (ctx.msg.quoted) return normalize(ctx.msg.quoted.sender);
  return null;
}

export function fmtJid(jid: string): string {
  const user = jid.split('@')[0]?.split(':')[0] ?? jid;
  return `@${user}`;
}

export async function ensureBotIsGroupAdmin(
  sock: WASocket,
  groupJid: string,
): Promise<boolean> {
  try {
    const meta = await sock.groupMetadata(groupJid);
    const me = normalize(sock.user?.id ?? '');
    const p = meta.participants.find((p) => normalize(p.id) === me);
    return p?.admin === 'admin' || p?.admin === 'superadmin';
  } catch {
    return false;
  }
}
