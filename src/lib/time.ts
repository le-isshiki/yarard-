export function utcDay(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function uptimeStr(startMs: number, nowMs: number = Date.now()): string {
  let s = Math.floor((nowMs - startMs) / 1000);
  const d = Math.floor(s / 86400);
  s %= 86400;
  const h = Math.floor(s / 3600);
  s %= 3600;
  const m = Math.floor(s / 60);
  s %= 60;
  return `${d}d ${h}h ${m}m ${s}s`;
}
