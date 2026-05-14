import { register } from '../index.js';

register({
  name: 'tagall',
  description: 'Visibly tag all group members',
  category: 'group',
  permission: 'group-admin',
  usage: '.tagall [message]',
  async run(ctx) {
    if (!ctx.msg.isGroup) {
      await ctx.reply('Group only.');
      return;
    }
    const meta = await ctx.sock.groupMetadata(ctx.msg.jid);
    const jids = meta.participants.map((p) => p.id);
    const note = ctx.args.join(' ') || 'Heads up everyone';
    const body =
      `${note}\n\n` +
      jids
        .map((j) => `@${j.split('@')[0]?.split(':')[0] ?? ''}`)
        .join(' ');
    await ctx.sock.sendMessage(ctx.msg.jid, { text: body, mentions: jids });
  },
});
