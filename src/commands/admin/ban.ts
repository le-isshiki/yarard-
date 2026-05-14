import { register } from '../index.js';
import * as blocked from '../../db/repositories/blocked.js';
import { targetFromCtx, fmtJid } from '../../lib/format.js';

register({
  name: 'ban',
  description: 'Bot will ignore all messages from this user globally',
  category: 'admin',
  permission: 'group-admin',
  usage: '.ban @user [reason]',
  async run(ctx) {
    const target = targetFromCtx(ctx);
    if (!target) {
      await ctx.reply('Tag a user or reply.');
      return;
    }
    const reason = ctx.args.filter((a) => !a.startsWith('@')).join(' ') || null;
    await blocked.add(target, ctx.msg.sender, reason);
    await ctx.reply(`Banned ${fmtJid(target)} from interacting with me.`, {
      mentions: [target],
    });
  },
});
