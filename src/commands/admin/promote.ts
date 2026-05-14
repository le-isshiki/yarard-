import { register } from '../index.js';
import { targetFromCtx, ensureBotIsGroupAdmin, fmtJid } from '../../lib/format.js';

register({
  name: 'promote',
  description: 'Make a user a group admin',
  category: 'admin',
  permission: 'group-admin',
  usage: '.promote @user',
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
    await ctx.sock.groupParticipantsUpdate(ctx.msg.jid, [target], 'promote');
    await ctx.reply(`Promoted ${fmtJid(target)} to admin.`, { mentions: [target] });
  },
});
