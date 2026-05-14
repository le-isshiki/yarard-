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

  const state: AuthenticationState = {
    creds,
    keys: {
      get: async <T extends keyof SignalDataTypeMap>(type: T, ids: string[]) => {
        const keys = ids.map((id) => `${type}-${id}`);
        const rows = await readKeys<unknown>(keys);
        const out: Record<string, SignalDataTypeMap[T]> = {};
        for (const id of ids) {
          const v = rows[`${type}-${id}`];
          if (v) {
            if (type === 'app-state-sync-key') {
              out[id] = proto.Message.AppStateSyncKeyData.fromObject(
                v as object,
              ) as unknown as SignalDataTypeMap[T];
            } else {
              out[id] = v as SignalDataTypeMap[T];
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
            const key = `${category}-${id}`;
            const v = inner[id];
            if (v == null) deletes.push(key);
            else upserts.push({ key, value: v });
          }
        }
        await Promise.all([writeKeys(upserts), deleteKeys(deletes)]);
      },
    },
  };

  return {
    state,
    saveCreds: async () => {
      await writeKey('creds', state.creds);
    },
    clear: async () => {
      await query(`TRUNCATE auth_state`);
      logger.warn('auth_state truncated');
    },
  };
}
