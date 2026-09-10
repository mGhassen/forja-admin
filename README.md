# forja-admin

Ops console for [Forja](https://github.com/mGhassen/Forja) — IPTV catalog scrape, account credits, plugin catalog, and installer download stats.

| | |
|--|--|
| **Host app** | [mGhassen/Forja](https://github.com/mGhassen/Forja) |
| **Web portal** | `apps/web` in Forja (user-facing) |
| **Schema** | `apps/web/supabase` in Forja (migrations stay there) |
| **Prod** | `https://admin.forjahq.xyz` |

This repo is **standalone**. It does not live under the Forja monorepo.

## Stack

- TanStack Start + Vite + React 19
- Supabase Auth (`accounts.is_admin`)
- Inngest (IPTV catalog scrape cron + manual events)
- Vercel (Nitro, `maxDuration: 300`)

Shared auth UI helpers are vendored at [`packages/forja-auth`](packages/forja-auth) (`@forja/auth`). Keep in sync with Forja’s `packages/forja-auth` when auth behavior changes.

## Setup

```bash
cp .env.example .env
# fill VITE_SUPABASE_* (+ Turnstile / Inngest / service role as needed)
pnpm install
pnpm dev   # http://127.0.0.1:4000
```

Sign in with an account where `accounts.is_admin = true`.

Optional local shortcut: clone next to Forja and leave keys in `../Forja/.env` — Vite bridges sibling `SUPABASE_*` / Turnstile / Inngest vars.

```text
Workspace/
├── Forja/          # Flutter host + web portal + Supabase migrations
└── forja-admin/    # this repo
```

**PostHog on Accounts (optional):** `POSTHOG_PERSONAL_API_KEY` + `POSTHOG_PROJECT_ID` (see `.env.example`).

## Inngest catalog scrape

```bash
# terminal 1
pnpm dev

# terminal 2
npx inngest-cli@latest dev -u http://127.0.0.1:4000/api/inngest
```

Needs `SUPABASE_SERVICE_ROLE_KEY` + Inngest keys. Inngest ticks every minute; schedule is `iptv_ops_settings.scrape_cron` (Scrape → Automation). Manual: event `iptv/catalog.scrape`.

**LLM hybrid extract (opt-in, off by default):** only when `IPTV_LLM_EXTRACT=1` **and** `ANTHROPIC_API_KEY`. Mechanical extract always runs first; agent only if mechanical returns **0**.

**Production (Vercel):** set `INNGEST_SERVE_ORIGIN=https://admin.forjahq.xyz` so Inngest syncs the custom domain. `*.vercel.app` is Deployment-Protected and returns 401 to Inngest.

## Routes

| Path | Page |
|------|------|
| `/login` | Auth + captcha |
| `/` | Dashboard |
| `/accounts` | Credits, feature flags, PostHog client runtime |
| `/pool` | Catalog candidates |
| `/scrape` | Scrape run history |
| `/plugins` | Plugin catalog + product bundles |
| `/downloads` | Installer download stats |
| `/api/inngest` | Inngest serve |

## Scripts

| Command | |
|---------|---|
| `pnpm dev` | Local server `:4000` |
| `pnpm build` | Production build |
| `pnpm lint` | oxlint |
| `pnpm preview` | Preview build |

## Related

- Supabase migrations / RLS: Forja `apps/web/supabase`
- Optional Rust scrape worker: Forja `crates/iptv` (`iptv-worker`)
- Packs published here land in ForjaHQ [forja-packs](https://github.com/mGhassen/forja-packs)
