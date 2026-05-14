import { register } from '../index.js';

register({
  name: 'ping',
  description: 'Latency check',
  category: 'utility',
  permission: 'anyone',
  async run(ctx) {
    const t = Date.now();
    await ctx.reply(`pong (${Date.now() - t}ms)`);
  },
});
