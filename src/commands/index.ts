import type { Command } from './types.js';

const all: Command[] = [];
const byName = new Map<string, Command>();

export function register(cmd: Command): void {
  all.push(cmd);
  byName.set(cmd.name, cmd);
  for (const a of cmd.aliases ?? []) byName.set(a, cmd);
}

export function get(name: string): Command | undefined {
  return byName.get(name.toLowerCase());
}

export function list(): Command[] {
  return all.slice();
}

export function clear(): void {
  all.length = 0;
  byName.clear();
}

export async function loadAll(): Promise<void> {
  await import('./utility/ping.js');
  await import('./utility/alive.js');
  await import('./utility/help.js');
  await import('./utility/translate.js');
  await import('./utility/weather.js');
  await import('./utility/usage.js');
  await import('./ai/ai.js');
  await import('./ai/imagine.js');
  await import('./admin/kick.js');
  await import('./admin/ban.js');
  await import('./admin/unban.js');
  await import('./admin/promote.js');
  await import('./admin/demote.js');
  await import('./admin/mute.js');
  await import('./admin/unmute.js');
  await import('./admin/warn.js');
  await import('./admin/warnings.js');
  await import('./group/tagall.js');
  await import('./group/hidetag.js');
  await import('./group/groupinfo.js');
  await import('./group/antilink.js');
  await import('./group/antibadword.js');
  await import('./group/antidelete.js');
  await import('./media/sticker.js');
  await import('./media/tts.js');
  await import('./media/removebg.js');
  await import('./automation/autoread.js');
  await import('./automation/viewonce.js');
  await import('./owner/sudo.js');
  await import('./owner/broadcast.js');
}
