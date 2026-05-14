import { register } from '../index.js';
import { uptimeStr } from '../../lib/time.js';
import { getConfig } from '../../config.js';

const START = Date.now();

register({
  name: 'alive',
  description: 'Bot status',
  category: 'utility',
  permission: 'anyone',
  async run(ctx) {
    const cfg = getConfig();
    await ctx.reply(`*${cfg.BOT_NAME}* is online.\nUptime: ${uptimeStr(START)}`);
  },
});
