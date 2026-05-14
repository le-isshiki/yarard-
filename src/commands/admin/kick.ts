import { register } from '../index.js';
import { targetFromCtx, ensureBotIsGroupAdmin, fmtJid } from '../../lib/format.js';

register({
  name: 'kick',
  description: 'Remove a user from the group',
  category: 'admin',
  permission: 'group-admin',
  usage: '.kick @user (or reply to their message)',
  async run(ctx) {
    if (!ctx.msg.isGroup) {
      await ctx.reply('Group only.');
      return;
    }
    const target = targetFromCtx(ctx);
    if (!target) {
      await ctx.reply('Tag a user or reply to their message.');
      return;
    }
    if (!(await ensureBotIsGroupAdmin(ctx.sock, ctx.msg.jid))) {
      await ctx.reply('I need to be a group admin to do that.');
      return;
    }
    await ctx.sock.groupParticipantsUpdate(ctx.msg.jid, [target], 'remove');
    await ctx.reply(`Kicked ${fmtJid(target)}`, { mentions: [target] });
  },
});
