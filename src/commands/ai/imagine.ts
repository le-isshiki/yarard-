import { register } from '../index.js';
import { generateImage } from '../../ai/image.js';
import { getConfig } from '../../config.js';
import { utcDay } from '../../lib/time.js';
import * as tokens from '../../db/repositories/token-usage.js';
import { isOwnerOrSudo } from '../../dispatcher/permissions.js';

const IMAGINE_TAG_PREFIX = '__imagine__';

register({
  name: 'imagine',
  description: 'Generate an image from a text prompt',
  category: 'ai',
  permission: 'anyone',
  usage: '.imagine <prompt>',
  async run(ctx) {
    const prompt = ctx.args.join(' ');
    if (!prompt) {
      await ctx.reply('Usage: .imagine <prompt>');
      return;
    }
    const cfg = getConfig();

    if (!(await isOwnerOrSudo(ctx.msg.sender))) {
      const key = `${IMAGINE_TAG_PREFIX}:${ctx.msg.sender}`;
      const used = await tokens.getToday(key, utcDay());
      if (used >= cfg.IMAGE_DAILY_CAP) {
        await ctx.reply(
          `You've used today's ${cfg.IMAGE_DAILY_CAP} image generations. Resets 00:00 UTC.`,
        );
        return;
      }
      await tokens.add(key, utcDay(), 1);
    }

    await ctx.react('🎨').catch(() => {});
    try {
      const buf = await generateImage(prompt);
      await ctx.sock.sendMessage(
        ctx.msg.jid,
        { image: buf, caption: prompt },
        { quoted: ctx.msg.raw },
      );
    } catch {
      await ctx.reply('Image service is busy, try again.');
    }
  },
});
