import { register } from '../index.js';
import * as gs from '../../db/repositories/group-settings.js';

const GLOBAL = '__global__';

register({
  name: 'autoread',
  description: 'Auto-mark DMs as read (owner/sudo only)',
  category: 'automation',
  permission: 'sudo',
  usage: '.autoread on | off',
  async run(ctx) {
    const arg = ctx.args[0]?.toLowerCase();
    if (arg !== 'on' && arg !== 'off') {
      await ctx.reply('Usage: .autoread on | off');
      return;
    }
    await gs.setKey(GLOBAL, 'autoread', arg === 'on');
    await ctx.reply(`Autoread ${arg}.`);
  },
});

export async function shouldAutoread(): Promise<boolean> {
  const cur = await gs.get(GLOBAL);
  return !!cur.autoread;
}
