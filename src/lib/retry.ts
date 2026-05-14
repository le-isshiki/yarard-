export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: { attempts: number; baseMs: number; capMs?: number } = { attempts: 3, baseMs: 250 },
): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < opts.attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i === opts.attempts - 1) break;
      const delay = Math.min(opts.baseMs * 2 ** i, opts.capMs ?? 60_000);
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw lastErr;
}

export function backoffMs(attempt: number, baseMs = 1000, capMs = 60_000): number {
  return Math.min(baseMs * 2 ** attempt, capMs);
}
