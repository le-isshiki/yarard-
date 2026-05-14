import { query } from '../client.js';

export type GroupSettings = Record<string, unknown> & {
  antilink?: boolean;
  antibadword?: boolean;
  antidelete?: boolean;
  autoread?: boolean;
  badwords?: string[];
};

export async function get(groupJid: string): Promise<GroupSettings> {
  const { rows } = await query<{ settings: GroupSettings }>(
    `SELECT settings FROM group_settings WHERE group_jid = $1`,
    [groupJid],
  );
  return rows[0]?.settings ?? {};
}

export async function setKey<K extends keyof GroupSettings>(
  groupJid: string,
  key: K,
  value: GroupSettings[K],
): Promise<void> {
  await query(
    `INSERT INTO group_settings (group_jid, settings, updated_at)
     VALUES ($1, jsonb_build_object($2::text, $3::jsonb), NOW())
     ON CONFLICT (group_jid) DO UPDATE SET
       settings = group_settings.settings || jsonb_build_object($2::text, $3::jsonb),
       updated_at = NOW()`,
    [groupJid, String(key), JSON.stringify(value)],
  );
}
