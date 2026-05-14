import type { WASocket, WAMessage } from '@whiskeysockets/baileys';
import type { ParsedMessage } from '../dispatcher/parser.js';
import type { Permission } from '../dispatcher/permissions.js';

export interface CommandContext {
  sock: WASocket;
  msg: ParsedMessage;
  args: string[];
  reply: (
    text: string,
    extra?: { mentions?: string[] },
  ) => Promise<WAMessage | undefined>;
  react: (emoji: string) => Promise<void>;
}

export type Category =
  | 'admin'
  | 'group'
  | 'media'
  | 'utility'
  | 'automation'
  | 'ai'
  | 'owner';

export interface Command {
  name: string;
  aliases?: string[];
  description: string;
  category: Category;
  permission: Permission;
  usage?: string;
  run: (ctx: CommandContext) => Promise<void>;
}
