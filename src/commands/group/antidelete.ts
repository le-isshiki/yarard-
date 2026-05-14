import { register } from '../index.js';
import * as gs from '../../db/repositories/group-settings.js';

register({
  name: 'antidelete',
  description: 'Re-post messages that get deleted',
  category: 'group',
  permission: 'group-admin',
  usage: '.antidelete on | off',
  async run(ctx) {
    if (!ctx.msg.isGroup) {
      await ctx.reply('Group only.');
      return;
    }
    const arg = ctx.args[0]?.toLowerCase();
    if (arg !== 'on' && arg !== 'off') {
      await ctx.reply('Usage: .antidelete on | off');
      return;
    }
    await gs.setKey(ctx.msg.jid, 'antidelete', arg === 'on');
    await ctx.reply(`Antidelete ${arg}.`);
  },
});
