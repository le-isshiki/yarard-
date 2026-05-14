CREATE TABLE IF NOT EXISTS auth_state (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversations (
  jid TEXT NOT NULL,
  message_id BIGSERIAL,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content TEXT NOT NULL,
  sender_jid TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (jid, message_id)
);
CREATE INDEX IF NOT EXISTS conversations_recent ON conversations (jid, message_id DESC);

CREATE TABLE IF NOT EXISTS conversation_summaries (
  jid TEXT PRIMARY KEY,
  summary TEXT NOT NULL,
  covers_through_message_id BIGINT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS group_settings (
  group_jid TEXT PRIMARY KEY,
  settings JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS warns (
  id BIGSERIAL PRIMARY KEY,
  group_jid TEXT NOT NULL,
  user_jid TEXT NOT NULL,
  warned_by TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS warns_lookup ON warns (group_jid, user_jid);

CREATE TABLE IF NOT EXISTS sudo_users (
  user_jid TEXT PRIMARY KEY,
  added_by TEXT NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS token_usage (
  user_jid TEXT NOT NULL,
  day DATE NOT NULL,
  tokens INT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_jid, day)
);

CREATE TABLE IF NOT EXISTS blocked_jids (
  jid TEXT PRIMARY KEY,
  blocked_by TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
