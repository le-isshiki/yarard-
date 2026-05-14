import { jidNormalizedUser, jidDecode } from '@whiskeysockets/baileys';

export function normalize(jid: string | undefined | null): string {
  if (!jid) return '';
  return jidNormalizedUser(jid);
}

export function userOf(jid: string): string {
  const decoded = jidDecode(jid);
  return decoded?.user ?? '';
}

export function sameJid(a: string | undefined | null, b: string | undefined | null): boolean {
  if (!a || !b) return false;
  return normalize(a) === normalize(b);
}

export function isGroup(jid: string | undefined | null): boolean {
  return !!jid && jid.endsWith('@g.us');
}

export function isDm(jid: string | undefined | null): boolean {
  return !!jid && (jid.endsWith('@s.whatsapp.net') || jid.endsWith('@c.us'));
}

export function ownerToJid(ownerNumber: string): string {
  return `${ownerNumber}@s.whatsapp.net`;
}
