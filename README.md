# Theseus-Yarard

A WhatsApp bot that replies to your messages like ChatGPT and manages WhatsApp groups when granted admin. Built with Baileys + TypeScript, deployed on Koyeb, backed by Neon Postgres.

- **DMs** — replies to every incoming direct message using a Groq-hosted LLM (Llama 3.3 70B), with rolling conversation memory + running summary per contact.
- **Groups** — silent by default, replies only when @mentioned or when someone replies to one of its own messages.
- **Admin commands** — 30 commands across admin / group / media / utility / automation / AI / owner categories.
- **Voice notes in DM** — transcribed via Groq Whisper, replied to as text.
- **Calls** — auto-rejected silently.
- **Image generation** — `.imagine <prompt>` via OpenAI gpt-image-1.

Modeled structurally on [Knightbot-MD](https://github.com/mruniquehacker/Knightbot-MD).

---

## Prerequisites

1. **A dedicated WhatsApp account** for the bot (separate phone number — do not use your personal account).
2. **A Neon Postgres database** (free at [neon.tech](https://neon.tech)) — used for session storage, conversation memory, group settings, sudo list.
3. **A Groq API key** (free at [console.groq.com](https://console.groq.com)) — used for chat replies and voice transcription.
4. **An OpenAI API key** (~$5 deposit at [platform.openai.com](https://platform.openai.com)) — used only for `.imagine` and `.tts` commands. Note: ChatGPT Plus / Pro subscriptions do **not** include API access; you need separate API credits.
5. **A Koyeb account** (free at [koyeb.com](https://www.koyeb.com)) — for hosting.

---

## Local development

```bash
git clone <this-repo>
cd theseus-yarard
npm install
cp .env.example .env       # fill in real values
npm run build
node --env-file=.env dist/index.js
```

On first launch the logs print an 8-digit pairing code. On the bot's phone go to:

**WhatsApp → Settings → Linked Devices → Link a Device → Link with phone number** → enter the code.

Session is persisted in Neon. Restart the bot and it reconnects without re-pairing.

---

## Deploying to Koyeb

1. Push this repo to GitHub.
2. In the Koyeb dashboard: **Create App → GitHub → pick this repo → Builder: Dockerfile**.
3. Add environment secrets:
   - `DATABASE_URL` (Neon Postgres connection string with `?sslmode=require`)
   - `GROQ_API_KEY`
   - `OPENAI_API_KEY`
   - `OWNER_NUMBER` — **your personal WhatsApp number**, the account that gets `.broadcast` / `.sudo` permissions (digits only, international, no `+`, e.g. `2348012345678`).
   - `BOT_NUMBER` — *(only if different from `OWNER_NUMBER`)* the bot's dedicated WhatsApp number, the phone you'll enter the pairing code on. If your bot's account *is* your personal number, leave this unset.
   - Optional: `BOT_PERSONA`, `REMOVEBG_API_KEY`, `DAILY_TOKEN_CAP`, `IMAGE_DAILY_CAP`, `MEMORY_WINDOW`, `MEMORY_COMPRESS_AT`, `BOT_NAME`, `PREFIX`
4. **Service config**: instance type `nano`, region nearest you, scaling **1 instance fixed** (do not autoscale — Baileys is single-session), health check at `/healthz`.
5. Deploy. Watch the build + runtime logs. When the bot prints `=== PAIRING CODE: XXXXXXXX ===`, pair it via WhatsApp → Linked Devices.

After that the bot runs autonomously. Redeploys reuse the existing session in Neon — no re-pairing.

---

## Environment variables

| Var | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | yes | — | Neon Postgres URL |
| `GROQ_API_KEY` | yes | — | Groq API key |
| `OPENAI_API_KEY` | yes | — | OpenAI API key (`.imagine`, `.tts` only) |
| `OWNER_NUMBER` | yes | — | Your personal number — gets owner permissions. Digits only, no `+`. |
| `BOT_NUMBER` | no | `OWNER_NUMBER` | The bot's dedicated WhatsApp number — phone you'll pair on. Set only if different from `OWNER_NUMBER`. |
| `BOT_NAME` | no | `Theseus-Yarard` | Display name |
| `PREFIX` | no | `.` | Command prefix |
| `DAILY_TOKEN_CAP` | no | `50000` | Per-contact daily token cap |
| `IMAGE_DAILY_CAP` | no | `5` | Per-contact daily `.imagine` cap |
| `MEMORY_WINDOW` | no | `20` | Verbatim turns kept per jid |
| `MEMORY_COMPRESS_AT` | no | `30` | Compress when row count exceeds this |
| `BOT_PERSONA` | no | (built-in) | System prompt override |
| `REMOVEBG_API_KEY` | no | unset | `.removebg` is disabled when unset |
| `LOG_LEVEL` | no | `info` | `pino` level |
| `PORT` | no | `8080` | Health endpoint port |

---

## Commands

Prefix is `.` (configurable). All in-group commands run permission checks against WhatsApp's live group metadata.

### Admin (group-admin, owner, or sudo)
`.kick @user` `.ban @user` `.unban @user` `.promote @user` `.demote @user` `.mute` `.unmute` `.warn @user [reason]` `.warnings @user`

### Group utility
`.tagall [text]` `.hidetag [text]` `.groupinfo` `.antilink on|off` `.antibadword on|off|+word` `.antidelete on|off`

### Media
`.sticker` `.tts <text>` `.removebg`

### Utility
`.alive` `.ping` `.help [category]` `.translate <lang> <text>` `.weather <city>` `.usage`

### Automation
`.autoread on|off` (owner/sudo) `.viewonce`

### AI
`.ai <prompt>` (no memory) `.imagine <prompt>`

### Owner / sudo
`.sudo add|remove|list [@user]` (owner only) `.broadcast <text>` (owner only)

---

## How the AI behavior works

- **DM**: every incoming text or voice message → transcribe if needed → look up the last 20 turns + running summary from Neon → Groq Llama 3.3 70B → reply. Voice notes are transcribed with Groq Whisper.
- **Group**: silent unless the bot is `@`-mentioned or someone replies to a previous bot message. When triggered, it uses the same memory pipeline scoped to the group jid.
- **Memory compression**: once a conversation row count exceeds 30, the older rows are summarized into a single running summary row and deleted. Each contact's memory stays bounded regardless of total volume.
- **Daily token cap**: when a non-owner/sudo contact uses more than `DAILY_TOKEN_CAP` tokens in a UTC day, the bot replies with a cap notice and ignores further messages until UTC midnight.

---

## Troubleshooting

- **"PAIRING CODE" line missing**: check `OWNER_NUMBER` is digits only, no `+`, international format.
- **Bot doesn't reply in groups**: bot only responds to mentions or replies to its messages. To get AI in a group, `@`-mention it.
- **`.kick` "I need to be a group admin"**: WhatsApp group admin (the bot's WhatsApp account) is separate from bot-owner. Make the bot's account a WA admin of the group.
- **Cap message keeps appearing for a friendly user**: raise `DAILY_TOKEN_CAP` or add them to sudo via `.sudo add @user` (owner only).
- **Need to re-pair**: in Neon SQL editor, run `TRUNCATE auth_state`. Restart the Koyeb service. New pairing code appears in logs.
- **Calls won't reject**: this is normal — caller sees "user unavailable" rather than a specific reject. The bot does not pick up.

---

## Tests

```bash
npm test
```

Unit tests run against in-memory mocks. Integration tests (DB repos, `useNeonAuthState`) need a `TEST_DATABASE_URL` pointing at a throwaway Neon branch.

---

## Project layout

See `docs/superpowers/specs/2026-05-13-theseus-yarard-design.md` for the full design spec, and `docs/superpowers/plans/2026-05-13-theseus-yarard.md` for the build plan.
