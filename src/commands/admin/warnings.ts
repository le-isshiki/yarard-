import { register } from '../index.js';
import * as warns from '../../db/repositories/warns.js';
import { targetFromCtx, fmtJid } from '../../lib/format.js';

register({
  name: 'warnings',
  description: "List a user's warns",
  category: 'admin',
  permission: 'group-admin',
  usage: '.warnings @user',
  async run(ctx) {
    if (!ctx.msg.isGroup) {
      await ctx.reply('Group only.');
      return;
    }
    const target = targetFromCtx(ctx);
    if (!target) {
      await ctx.reply('Tag a user or reply.');
      return;
    }
    const list = await warns.list(ctx.msg.jid, target);
    if (list.length === 0) {
      await ctx.reply(`${fmtJid(target)} has no warns.`, { mentions: [target] });
      return;
    }
    const body = list
      .map(
        (w, i) =>
          `${i + 1}. ${w.reason ?? '(no reason)'} — by ${fmtJid(w.warned_by)}`,
      )
      .join('\n');
    await ctx.reply(`Warns for ${fmtJid(target)}:\n${body}`, {
      mentions: [target, ...list.map((w) => w.warned_by)],
    });
  },
});
