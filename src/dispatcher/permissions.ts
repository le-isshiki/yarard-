import type { WASocket } from '@whiskeysockets/baileys';
import { sameJid, ownerToJid } from '../lib/jid.js';
import { isSudo } from '../db/repositories/sudo.js';
import { isBlocked } from '../db/repositories/blocked.js';
import { getConfig } from '../config.js';

export type Permission = 'anyone' | 'group-admin' | 'sudo' | 'owner';

export interface PermCtx {
  sock: WASocket;
  senderJid: string;
  chatJid: string;
  isGroup: boolean;
}

export async function isOwner(senderJid: string): Promise<boolean> {
  const cfg = getConfig();
  return sameJid(senderJid, ownerToJid(cfg.OWNER_NUMBER));
}

export async function isOwnerOrSudo(senderJid: string): Promise<boolean> {
  if (await isOwner(senderJid)) return true;
  return isSudo(senderJid);
}

export async function isGroupAdmin(ctx: PermCtx): Promise<boolean> {
  if (!ctx.isGroup) return false;
  try {
    const meta = await ctx.sock.groupMetadata(ctx.chatJid);
    const participant = meta.participants.find((p) => sameJid(p.id, ctx.senderJid));
    return participant?.admin === 'admin' || participant?.admin === 'superadmin';
  } catch {
    return false;
  }
}

export async function checkPermission(perm: Permission, ctx: PermCtx): Promise<boolean> {
  if (await isBlocked(ctx.senderJid)) return false;

  switch (perm) {
    case 'anyone':
      return true;
    case 'owner':
      return isOwner(ctx.senderJid);
    case 'sudo':
      return isOwnerOrSudo(ctx.senderJid);
    case 'group-admin': {
      if (await isOwnerOrSudo(ctx.senderJid)) return true;
      return isGroupAdmin(ctx);
    }
  }
}
