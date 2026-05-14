import { register } from '../index.js';
import * as warns from '../../db/repositories/warns.js';
import { targetFromCtx, ensureBotIsGroupAdmin, fmtJid } from '../../lib/format.js';

register({
  name: 'warn',
  description: 'Warn a user; auto-kick at 3 warns',
  category: 'admin',
  permission: 'group-admin',
  usage: '.warn @user [reason]',
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
    const reason = ctx.args.filter((a) => !a.startsWith('@')).join(' ') || null;
    const count = await warns.add(ctx.msg.jid, target, ctx.msg.sender, reason);
    if (count >= 3) {
      if (await ensureBotIsGroupAdmin(ctx.sock, ctx.msg.jid)) {
        await ctx.sock.groupParticipantsUpdate(ctx.msg.jid, [target], 'remove');
        await warns.clear(ctx.msg.jid, target);
        await ctx.reply(
          `${fmtJid(target)} reached 3 warns and has been kicked.`,
          { mentions: [target] },
        );
      } else {
        await ctx.reply(
          `${fmtJid(target)} has 3 warns — make me admin to auto-kick.`,
          { mentions: [target] },
        );
      }
      return;
    }
    await ctx.reply(
      `Warned ${fmtJid(target)} (${count}/3)${reason ? ` — ${reason}` : ''}.`,
      { mentions: [target] },
    );
  },
});
