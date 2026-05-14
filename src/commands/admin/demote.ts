import { register } from '../index.js';
import { targetFromCtx, ensureBotIsGroupAdmin, fmtJid } from '../../lib/format.js';

register({
  name: 'demote',
  description: 'Remove a user from group admin',
  category: 'admin',
  permission: 'group-admin',
  usage: '.demote @user',
  async run(ctx) {
    if (!ctx.msg.isGroup) {
      await ctx.reply('Group only.');
      return;
    }
    const target = targetFromCtx(ctx);
    if (!target) {
      await ctx.reply('Tag a user or reply.');
      return;
    }
    if (!(await ensureBotIsGroupAdmin(ctx.sock, ctx.msg.jid))) {
      await ctx.reply('I need to be a group admin to do that.');
      return;
    }
    await ctx.sock.groupParticipantsUpdate(ctx.msg.jid, [target], 'demote');
    await ctx.reply(`Demoted ${fmtJid(target)}.`, { mentions: [target] });
  },
});
