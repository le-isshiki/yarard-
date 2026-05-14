import { register } from '../index.js';
import * as blocked from '../../db/repositories/blocked.js';
import { targetFromCtx, fmtJid } from '../../lib/format.js';

register({
  name: 'unban',
  description: 'Remove a user from the bot block list',
  category: 'admin',
  permission: 'group-admin',
  usage: '.unban @user',
  async run(ctx) {
    const target = targetFromCtx(ctx);
    if (!target) {
      await ctx.reply('Tag a user or reply.');
      return;
    }
    const removed = await blocked.remove(target);
    await ctx.reply(
      removed
        ? `Unbanned ${fmtJid(target)}.`
        : `${fmtJid(target)} was not banned.`,
      { mentions: [target] },
    );
  },
});
