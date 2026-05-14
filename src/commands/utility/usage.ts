import { register } from '../index.js';
import { getState } from '../../lib/ratelimit.js';

register({
  name: 'usage',
  description: 'Your token usage today',
  category: 'utility',
  permission: 'anyone',
  async run(ctx) {
    const s = await getState(ctx.msg.sender);
    if (s.remaining === Infinity) {
      await ctx.reply('You have no cap (owner/sudo).');
      return;
    }
    await ctx.reply(
      `Today: ${s.used} / ${s.cap} tokens used. ${s.remaining} remaining (resets 00:00 UTC).`,
    );
  },
});
