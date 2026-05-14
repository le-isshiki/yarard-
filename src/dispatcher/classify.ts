import type { ParsedMessage } from './parser.js';
import { sameJid } from '../lib/jid.js';
import { getConfig } from '../config.js';

export interface Classification {
  commandName: string | null;
  args: string[];
  aiTrigger: boolean;
}

export function classify(msg: ParsedMessage, botJid: string): Classification {
  const cfg = getConfig();
  const prefix = cfg.PREFIX;

  let commandName: string | null = null;
  let args: string[] = [];
  if (msg.text.startsWith(prefix)) {
    const trimmed = msg.text.slice(prefix.length).trimStart();
    const parts = trimmed.split(/\s+/);
    const name = parts[0]?.toLowerCase() ?? '';
    if (name) {
      commandName = name;
      args = parts.slice(1);
    }
  }

  let aiTrigger = false;
  if (commandName === null) {
    if (msg.isDm) {
      aiTrigger = true;
    } else if (msg.isGroup) {
      const botMentioned = msg.mentions.some((m) => sameJid(m, botJid));
      const repliedToBot = !!msg.quoted && sameJid(msg.quoted.sender, botJid);
      aiTrigger = botMentioned || repliedToBot;
    }
  }

  return { commandName, args, aiTrigger };
}
