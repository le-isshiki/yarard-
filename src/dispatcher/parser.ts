import type { proto, WAMessage } from '@whiskeysockets/baileys';
import { normalize, isGroup, isDm } from '../lib/jid.js';

export type MessageKind =
  | 'text'
  | 'image'
  | 'video'
  | 'audio'
  | 'sticker'
  | 'document'
  | 'view-once'
  | 'other';

export interface ParsedMessage {
  raw: WAMessage;
  jid: string;
  sender: string;
  isFromMe: boolean;
  kind: MessageKind;
  text: string;
  mentions: string[];
  quoted: {
    text: string;
    sender: string;
    raw: proto.IMessage | null;
  } | null;
  isGroup: boolean;
  isDm: boolean;
  messageId: string;
  pushName: string;
}

export function parseMessage(msg: WAMessage): ParsedMessage | null {
  if (!msg.message || !msg.key.remoteJid) return null;

  const jid = normalize(msg.key.remoteJid);
  const inGroup = isGroup(jid);
  const sender = inGroup ? normalize(msg.key.participant ?? '') : jid;

  const m = msg.message;
  const ctxInfo =
    m.extendedTextMessage?.contextInfo ??
    m.imageMessage?.contextInfo ??
    m.videoMessage?.contextInfo ??
    m.audioMessage?.contextInfo ??
    m.stickerMessage?.contextInfo ??
    m.documentMessage?.contextInfo ??
    undefined;

  const text =
    m.conversation ??
    m.extendedTextMessage?.text ??
    m.imageMessage?.caption ??
    m.videoMessage?.caption ??
    m.documentMessage?.caption ??
    '';

  let kind: MessageKind = 'other';
  if (m.imageMessage) kind = 'image';
  else if (m.videoMessage) kind = 'video';
  else if (m.audioMessage) kind = 'audio';
  else if (m.stickerMessage) kind = 'sticker';
  else if (m.documentMessage) kind = 'document';
  else if (m.viewOnceMessage || m.viewOnceMessageV2) kind = 'view-once';
  else if (m.conversation || m.extendedTextMessage) kind = 'text';

  const mentions = (ctxInfo?.mentionedJid ?? []).map((j) => normalize(j));

  let quoted: ParsedMessage['quoted'] = null;
  if (ctxInfo?.quotedMessage) {
    const qm = ctxInfo.quotedMessage;
    quoted = {
      text: qm.conversation ?? qm.extendedTextMessage?.text ?? '',
      sender: normalize(ctxInfo.participant ?? ''),
      raw: qm,
    };
  }

  return {
    raw: msg,
    jid,
    sender,
    isFromMe: !!msg.key.fromMe,
    kind,
    text: text ?? '',
    mentions,
    quoted,
    isGroup: inGroup,
    isDm: isDm(jid),
    messageId: msg.key.id ?? '',
    pushName: msg.pushName ?? '',
  };
}
