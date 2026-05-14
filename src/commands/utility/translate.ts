import { register } from '../index.js';
import { groq, CHAT_MODEL } from '../../ai/groq.js';

register({
  name: 'translate',
  description: 'Translate text to a target language',
  category: 'utility',
  permission: 'anyone',
  usage: '.translate <lang> <text>',
  async run(ctx) {
    const lang = ctx.args[0];
    const text = ctx.args.slice(1).join(' ');
    if (!lang || !text) {
      await ctx.reply('Usage: .translate <lang> <text>');
      return;
    }
    const r = await groq().chat.completions.create({
      model: CHAT_MODEL,
      messages: [
        {
          role: 'system',
          content: `Translate the user message to ${lang}. Reply with only the translation.`,
        },
        { role: 'user', content: text },
      ],
      temperature: 0.2,
      max_tokens: 800,
    });
    const out = r.choices[0]?.message?.content?.trim() ?? '(empty)';
    await ctx.reply(out);
  },
});
