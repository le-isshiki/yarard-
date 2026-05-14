import {
  initAuthCreds,
  proto,
  BufferJSON,
  type AuthenticationCreds,
  type AuthenticationState,
  type SignalDataTypeMap,
} from '@whiskeysockets/baileys';
import { query } from '../db/client.js';
import { logger } from '../logger.js';

const DELETED = Symbol('deleted');
type CacheEntry = unknown | typeof DELETED;

async function readKey<T>(key: string): Promise<T | null> {
  const { rows } = await query<{ value: unknown }>(
    `SELECT value FROM auth_state WHERE key = $1`,
    [key],
  );
  if (rows.length === 0) return null;
  return JSON.parse(JSON.stringify(rows[0]!.value), BufferJSON.reviver) as T;
}

async function readKeys<T>(keys: string[]): Promise<Record<string, T>> {
  if (keys.length === 0) return {};
  const { rows } = await query<{ key: string; value: unknown }>(
    `SELECT key, value FROM auth_state WHERE key = ANY($1::text[])`,
    [keys],
  );
  const out: Record<string, T> = {};
  for (const r of rows) {
    out[r.key] = JSON.parse(JSON.stringify(r.value), BufferJSON.reviver) as T;
  }
  return out;
}

async function writeKey(key: string, value: unknown): Promise<void> {
  const serialised = JSON.parse(JSON.stringify(value, BufferJSON.replacer));
  await query(
    `INSERT INTO auth_state (key, value, updated_at) VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    [key, JSON.stringify(serialised)],
  );
}

async function writeKeys(entries: { key: string; value: unknown }[]): Promise<void> {
  if (entries.length === 0) return;
  const params: unknown[] = [];
  const tuples: string[] = [];
  for (let i = 0; i < entries.length; i++) {
    const serialised = JSON.parse(JSON.stringify(entries[i]!.value, BufferJSON.replacer));
    params.push(entries[i]!.key, JSON.stringify(serialised));
    tuples.push(`($${i * 2 + 1}, $${i * 2 + 2}::jsonb, NOW())`);
  }
  await query(
    `INSERT INTO auth_state (key, value, updated_at) VALUES ${tuples.join(', ')}
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
    params,
  );
}

async function deleteKeys(keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  await query(`DELETE FROM auth_state WHERE key = ANY($1::text[])`, [keys]);
}

export async function useNeonAuthState(): Promise<{
  state: AuthenticationState;
  saveCreds: () => Promise<void>;
  clear: () => Promise<void>;
}> {
  const credsRow = await readKey<AuthenticationCreds>('creds');
  const creds = credsRow ?? initAuthCreds();

  // Write-through in-memory cache. Reads hit memory first (zero-latency,
  // consistent with the last write). Writes update memory synchronously,
  // then persist async. Without this, the signal protocol's tight
  // write→read sequences race against Neon round-trip latency and lose
  // pre-keys / sessions, producing PreKeyError / "No session record".
  const cache = new Map<string, CacheEntry>();
  let persistChain: Promise<unknown> = Promise.resolve();

  const queueWrite = (op: () => Promise<unknown>): void => {
    persistChain = persistChain
      .catch(() => {})
      .then(op)
      .catch((err) => logger.warn({ err }, 'auth_state persist failed'));
  };

  const state: AuthenticationState = {
    creds,
    keys: {
      get: async <T extends keyof SignalDataTypeMap>(type: T, ids: string[]) => {
        const out: Record<string, SignalDataTypeMap[T]> = {};
        const missing: string[] = [];
        for (const id of ids) {
          const dbKey = `${type}-${id}`;
          const cached = cache.get(dbKey);
          if (cached === DELETED) continue;
          if (cached !== undefined) {
            out[id] = hydrate(type, cached) as SignalDataTypeMap[T];
          } else {
            missing.push(id);
          }
        }
        if (missing.length > 0) {
          const dbKeys = missing.map((id) => `${type}-${id}`);
          const rows = await readKeys<unknown>(dbKeys);
          for (const id of missing) {
            const dbKey = `${type}-${id}`;
            const v = rows[dbKey];
            if (v !== undefined) {
              cache.set(dbKey, v);
              out[id] = hydrate(type, v) as SignalDataTypeMap[T];
            }
          }
        }
        return out;
      },
      set: async (data) => {
        const upserts: { key: string; value: unknown }[] = [];
        const deletes: string[] = [];
        for (const category of Object.keys(data) as (keyof typeof data)[]) {
          const inner = data[category] as Record<string, unknown> | undefined;
          if (!inner) continue;
          for (const id of Object.keys(inner)) {
            const dbKey = `${category}-${id}`;
            const v = inner[id];
            if (v == null) {
              cache.set(dbKey, DELETED);
              deletes.push(dbKey);
            } else {
              cache.set(dbKey, v);
              upserts.push({ key: dbKey, value: v });
            }
          }
        }
        queueWrite(() => Promise.all([writeKeys(upserts), deleteKeys(deletes)]));
      },
    },
  };

  return {
    state,
    saveCreds: async () => {
      queueWrite(() => writeKey('creds', state.creds));
    },
    clear: async () => {
      cache.clear();
      await query(`TRUNCATE auth_state`);
      logger.warn('auth_state truncated');
    },
  };
}

function hydrate(type: keyof SignalDataTypeMap, v: unknown): unknown {
  if (type === 'app-state-sync-key') {
    return proto.Message.AppStateSyncKeyData.fromObject(v as object);
  }
  return v;
}
