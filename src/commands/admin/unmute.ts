import { register } from '../index.js';

register({
  name: 'unmute',
  description: 'Set group to all-members can send',
  category: 'admin',
  permission: 'group-admin',
  async run(ctx) {
    if (!ctx.msg.isGroup) {
      await ctx.reply('Group only.');
      return;
    }
    await ctx.sock.groupSettingUpdate(ctx.msg.jid, 'not_announcement');
    await ctx.reply('Group unmuted.');
  },
});
