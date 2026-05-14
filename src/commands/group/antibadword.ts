import { register } from '../index.js';
import * as gs from '../../db/repositories/group-settings.js';

register({
  name: 'antibadword',
  description: 'Auto-delete + warn on profanity. Use +word to add a custom word.',
  category: 'group',
  permission: 'group-admin',
  usage: '.antibadword on | off | +<word>',
  async run(ctx) {
    if (!ctx.msg.isGroup) {
      await ctx.reply('Group only.');
      return;
    }
    const arg = ctx.args[0]?.toLowerCase();
    if (arg === 'on' || arg === 'off') {
      await gs.setKey(ctx.msg.jid, 'antibadword', arg === 'on');
      await ctx.reply(`Antibadword ${arg}.`);
      return;
    }
    if (arg?.startsWith('+') && arg.length > 1) {
      const word = arg.slice(1);
      const cur = await gs.get(ctx.msg.jid);
      const list = new Set(cur.badwords ?? []);
      list.add(word);
      await gs.setKey(ctx.msg.jid, 'badwords', Array.from(list));
      await ctx.reply(`Added "${word}" to badwords.`);
      return;
    }
    await ctx.reply('Usage: .antibadword on | off | +<word>');
  },
});
