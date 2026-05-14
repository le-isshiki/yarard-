import { register } from '../index.js';
import * as gs from '../../db/repositories/group-settings.js';

register({
  name: 'antilink',
  description: 'Auto-delete + warn on links from non-admins',
  category: 'group',
  permission: 'group-admin',
  usage: '.antilink on | off',
  async run(ctx) {
    if (!ctx.msg.isGroup) {
      await ctx.reply('Group only.');
      return;
    }
    const arg = ctx.args[0]?.toLowerCase();
    if (arg !== 'on' && arg !== 'off') {
      await ctx.reply('Usage: .antilink on | off');
      return;
    }
    await gs.setKey(ctx.msg.jid, 'antilink', arg === 'on');
    await ctx.reply(`Antilink ${arg}.`);
  },
});
