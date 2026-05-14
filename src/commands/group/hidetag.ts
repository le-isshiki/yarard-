import { register } from '../index.js';

register({
  name: 'hidetag',
  description: 'Silently ping all group members',
  category: 'group',
  permission: 'group-admin',
  usage: '.hidetag [message]',
  async run(ctx) {
    if (!ctx.msg.isGroup) {
      await ctx.reply('Group only.');
      return;
    }
    const meta = await ctx.sock.groupMetadata(ctx.msg.jid);
    const jids = meta.participants.map((p) => p.id);
    const note = ctx.args.join(' ') || '';
    await ctx.sock.sendMessage(ctx.msg.jid, { text: note, mentions: jids });
  },
});
