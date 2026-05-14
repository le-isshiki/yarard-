import { register } from '../index.js';
import { downloadMediaMessage } from '@whiskeysockets/baileys';

register({
  name: 'viewonce',
  description: 'Re-send a view-once image/video as normal media',
  category: 'automation',
  permission: 'anyone',
  usage: '.viewonce (reply to view-once)',
  async run(ctx) {
    const q = ctx.msg.quoted?.raw;
    const v = q?.viewOnceMessage?.message ?? q?.viewOnceMessageV2?.message;
    if (!v) {
      await ctx.reply('Reply to a view-once message.');
      return;
    }
    const buf = (await downloadMediaMessage(
      { key: ctx.msg.raw.key, message: v } as never,
      'buffer',
      {},
    )) as Buffer;
    if (v.imageMessage) {
      await ctx.sock.sendMessage(
        ctx.msg.jid,
        { image: buf, caption: '(view-once revealed)' },
        { quoted: ctx.msg.raw },
      );
    } else if (v.videoMessage) {
      await ctx.sock.sendMessage(
        ctx.msg.jid,
        { video: buf, caption: '(view-once revealed)' },
        { quoted: ctx.msg.raw },
      );
    } else {
      await ctx.reply('Unsupported view-once kind.');
    }
  },
});
