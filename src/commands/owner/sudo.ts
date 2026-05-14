import { register } from '../index.js';
import * as sudo from '../../db/repositories/sudo.js';
import { normalize } from '../../lib/jid.js';
import { fmtJid } from '../../lib/format.js';

register({
  name: 'sudo',
  description: 'Manage sudo list (owner only)',
  category: 'owner',
  permission: 'owner',
  usage: '.sudo add|remove|list [@user]',
  async run(ctx) {
    const action = ctx.args[0]?.toLowerCase();
    if (action === 'list') {
      const all = await sudo.list();
      await ctx.reply(
        `Sudo list (${all.length}):\n${all.map(fmtJid).join('\n') || '(empty)'}`,
      );
      return;
    }
    const target =
      ctx.msg.mentions[0] ??
      (ctx.msg.quoted ? normalize(ctx.msg.quoted.sender) : null);
    if (!target) {
      await ctx.reply('Tag a user.');
      return;
    }
    if (action === 'add') {
      await sudo.add(target, ctx.msg.sender);
      await ctx.reply(`Added ${fmtJid(target)} to sudo.`, { mentions: [target] });
      return;
    }
    if (action === 'remove') {
      const ok = await sudo.remove(target);
      await ctx.reply(
        ok
          ? `Removed ${fmtJid(target)} from sudo.`
          : `${fmtJid(target)} was not in sudo.`,
        { mentions: [target] },
      );
      return;
    }
    await ctx.reply('Usage: .sudo add|remove|list [@user]');
  },
});
