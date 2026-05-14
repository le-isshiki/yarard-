import { register } from '../index.js';
import { groq, CHAT_MODEL } from '../../ai/groq.js';
import { DEFAULT_PERSONA, getConfig } from '../../config.js';
import { recordUsage } from '../../lib/ratelimit.js';

register({
  name: 'ai',
  description: 'One-off AI prompt (no memory)',
  category: 'ai',
  permission: 'anyone',
  usage: '.ai <prompt>',
  async run(ctx) {
    const prompt = ctx.args.join(' ');
    if (!prompt) {
      await ctx.reply('Usage: .ai <prompt>');
      return;
    }
    const cfg = getConfig();
    const r = await groq().chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        { role: 'system', content: cfg.BOT_PERSONA ?? DEFAULT_PERSONA },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 800,
    });
    const out = r.choices[0]?.message?.content?.trim() ?? '(empty)';
    await ctx.reply(out);
    await recordUsage(ctx.msg.sender, r.usage?.total_tokens ?? 0);
  },
});
