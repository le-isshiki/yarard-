import { register } from '../index.js';
import { tts } from '../../ai/tts.js';

register({
  name: 'tts',
  description: 'Convert text to a voice note',
  category: 'media',
  permission: 'anyone',
  usage: '.tts <text>',
  async run(ctx) {
    const text = ctx.args.join(' ');
    if (!text) {
      await ctx.reply('Usage: .tts <text>');
      return;
    }
    try {
      const buf = await tts(text);
      await ctx.sock.sendMessage(
        ctx.msg.jid,
        { audio: buf, mimetype: 'audio/ogg; codecs=opus', ptt: true },
        { quoted: ctx.msg.raw },
      );
    } catch {
      await ctx.reply('TTS failed — try shorter text.');
    }
  },
});
