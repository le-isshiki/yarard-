import { register } from '../index.js';
import { query } from '../../db/client.js';

register({
  name: 'broadcast',
  description: 'DM all contacts you have chatted with (owner only)',
  category: 'owner',
  permission: 'owner',
  usage: '.broadcast <text>',
  async run(ctx) {
    const text = ctx.args.join(' ');
    if (!text) {
      await ctx.reply('Usage: .broadcast <text>');
      return;
    }
    const { rows } = await query<{ jid: string }>(
      `SELECT DISTINCT jid FROM conversations WHERE jid LIKE '%@s.whatsapp.net'`,
    );
    let sent = 0;
    for (const r of rows) {
      try {
        await ctx.sock.sendMessage(r.jid, { text });
        sent++;
      } catch {
        // per-recipient failure ignored
      }
      await new Promise((res) => setTimeout(res, 500));
    }
    await ctx.reply(`Broadcast sent to ${sent}/${rows.length} contacts.`);
  },
});
