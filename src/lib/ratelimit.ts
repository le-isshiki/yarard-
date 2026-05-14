import { getConfig } from '../config.js';
import { utcDay } from './time.js';
import * as tokens from '../db/repositories/token-usage.js';
import { isOwnerOrSudo } from '../dispatcher/permissions.js';

export interface CapState {
  capped: boolean;
  used: number;
  cap: number;
  remaining: number;
}

export async function getState(senderJid: string): Promise<CapState> {
  const cfg = getConfig();
  if (await isOwnerOrSudo(senderJid)) {
    return { capped: false, used: 0, cap: Infinity, remaining: Infinity };
  }
  const used = await tokens.getToday(senderJid, utcDay());
  return {
    capped: used >= cfg.DAILY_TOKEN_CAP,
    used,
    cap: cfg.DAILY_TOKEN_CAP,
    remaining: Math.max(0, cfg.DAILY_TOKEN_CAP - used),
  };
}

export async function recordUsage(senderJid: string, n: number): Promise<void> {
  if (n <= 0) return;
  if (await isOwnerOrSudo(senderJid)) return;
  await tokens.add(senderJid, utcDay(), n);
}
