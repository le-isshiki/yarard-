import type { WASocket } from '@whiskeysockets/baileys';
import type { ParsedMessage } from './parser.js';
import type { CommandContext } from '../commands/types.js';

export function makeCtx(
  sock: WASocket,
  msg: ParsedMessage,
  args: string[],
): CommandContext {
  return {
    sock,
    msg,
    args,
    reply: (text, extra) =>
      sock.sendMessage(
        msg.jid,
        { text, mentions: extra?.mentions ?? [] },
        { quoted: msg.raw },
      ),
    react: async (emoji) => {
      await sock.sendMessage(msg.jid, {
        react: { text: emoji, key: msg.raw.key },
      });
    },
  };
}
