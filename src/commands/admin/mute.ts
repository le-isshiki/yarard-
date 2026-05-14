import { register } from '../index.js';

register({
  name: 'mute',
  description: 'Set group to admins-only',
  category: 'admin',
  permission: 'group-admin',
  async run(ctx) {
    if (!ctx.msg.isGroup) {
      await ctx.reply('Group only.');
      return;
    }
    await ctx.sock.groupSettingUpdate(ctx.msg.jid, 'announcement');
    await ctx.reply('Group muted. Only admins can send messages.');
  },
});
