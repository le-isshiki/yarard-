import { register } from '../index.js';

register({
  name: 'groupinfo',
  description: 'Show group info',
  category: 'group',
  permission: 'anyone',
  async run(ctx) {
    if (!ctx.msg.isGroup) {
      await ctx.reply('Group only.');
      return;
    }
    const meta = await ctx.sock.groupMetadata(ctx.msg.jid);
    const adminParticipants = meta.participants.filter((p) => p.admin);
    const admins = adminParticipants.map(
      (p) => `@${p.id.split('@')[0] ?? ''}`,
    );
    const body =
      `*${meta.subject}*\n` +
      (meta.desc ? `${meta.desc}\n\n` : '') +
      `Members: ${meta.participants.length}\nAdmins: ${admins.join(', ') || '(none)'}`;
    await ctx.reply(body, {
      mentions: adminParticipants.map((p) => p.id),
    });
  },
});
