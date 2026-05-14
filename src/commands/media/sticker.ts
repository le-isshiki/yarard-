import { register } from '../index.js';
import { downloadMediaMessage } from '@whiskeysockets/baileys';

register({
  name: 'sticker',
  description: 'Convert quoted image/video to sticker',
  category: 'media',
  permission: 'anyone',
  usage: '.sticker (reply to image/video)',
  async run(ctx) {
    const quoted = ctx.msg.quoted?.raw;
    const target = quoted ?? ctx.msg.raw.message;
    if (!target) {
      await ctx.reply('Reply to an image or video.');
      return;
    }
    const buf = (await downloadMediaMessage(
      { key: ctx.msg.raw.key, message: target } as never,
      'buffer',
      {},
    )) as Buffer;
    if (!buf || buf.length === 0) {
      await ctx.reply('Could not download media.');
      return;
    }
    await ctx.sock.sendMessage(
      ctx.msg.jid,
      { sticker: buf },
      { quoted: ctx.msg.raw },
    );
  },
});
