import { register } from '../index.js';
import { downloadMediaMessage } from '@whiskeysockets/baileys';
import { getConfig } from '../../config.js';

register({
  name: 'removebg',
  description: 'Remove background from quoted image (needs REMOVEBG_API_KEY)',
  category: 'media',
  permission: 'anyone',
  usage: '.removebg (reply to image)',
  async run(ctx) {
    const cfg = getConfig();
    if (!cfg.REMOVEBG_API_KEY) {
      await ctx.reply('removebg is not configured.');
      return;
    }
    const quoted = ctx.msg.quoted?.raw;
    const target = quoted ?? ctx.msg.raw.message;
    if (!target?.imageMessage) {
      await ctx.reply('Reply to an image.');
      return;
    }
    const buf = (await downloadMediaMessage(
      { key: ctx.msg.raw.key, message: target } as never,
      'buffer',
      {},
    )) as Buffer;
    const form = new FormData();
    form.append('image_file', new Blob([new Uint8Array(buf)]), 'in.png');
    form.append('size', 'auto');
    const r = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: { 'X-Api-Key': cfg.REMOVEBG_API_KEY },
      body: form,
    });
    if (!r.ok) {
      await ctx.reply(`removebg failed: ${r.status}`);
      return;
    }
    const out = Buffer.from(await r.arrayBuffer());
    await ctx.sock.sendMessage(
      ctx.msg.jid,
      { image: out },
      { quoted: ctx.msg.raw },
    );
  },
});
