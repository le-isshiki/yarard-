import { register, list } from '../index.js';
import { getConfig } from '../../config.js';

register({
  name: 'help',
  description: 'Show available commands',
  category: 'utility',
  permission: 'anyone',
  usage: '.help [category]',
  async run(ctx) {
    const cfg = getConfig();
    const all = list();
    const want = ctx.args[0]?.toLowerCase();
    const filtered = want ? all.filter((c) => c.category === want) : all;
    const byCat = new Map<string, string[]>();
    for (const c of filtered) {
      const arr = byCat.get(c.category) ?? [];
      arr.push(`${cfg.PREFIX}${c.name} — ${c.description}`);
      byCat.set(c.category, arr);
    }
    const sections = Array.from(byCat.entries()).map(
      ([cat, lines]) => `*${cat.toUpperCase()}*\n${lines.join('\n')}`,
    );
    await ctx.reply(`*${cfg.BOT_NAME} commands*\n\n${sections.join('\n\n')}`);
  },
});
