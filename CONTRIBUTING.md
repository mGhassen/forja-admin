# Contributing to forja-admin

## Scope

This repo is the **Forja ops console** only — TanStack Start UI, Inngest scrape workers, and admin API routes.

| Lives here | Lives in Forja |
|------------|----------------|
| Admin UI + Inngest functions | Flutter host (`apps/forja`) |
| Vendored `@forja/auth` | Web portal (`apps/web`) |
| Vercel deploy for `admin.forjahq.xyz` | Supabase migrations (`apps/web/supabase`) |
| | Optional Rust `iptv-worker` |

Do **not** add Flutter, Rust engine, or user-portal marketing routes here.

## Layout

```
forja-admin/
├── src/                 App routes, pages, Inngest, server
├── packages/forja-auth/ Shared auth helpers (vendored from Forja)
├── public/brand/        Logo assets
├── vercel.json
└── vite.config.ts
```

## Auth package sync

`packages/forja-auth` mirrors Forja `packages/forja-auth`. If you change OAuth / MFA / captcha behavior for both surfaces, update **both** repos (or copy from Forja after the portal change lands).

## Local checklist

1. `cp .env.example .env` and set Supabase + service role
2. `pnpm install && pnpm lint && pnpm build`
3. For scrape: run Inngest CLI against `/api/inngest`
4. Sign in with `accounts.is_admin = true`

## PR checklist

- [ ] No secrets committed (`.env` is gitignored)
- [ ] `pnpm lint` clean
- [ ] `pnpm build` succeeds
- [ ] User-facing copy describes current product behavior (no migration notes)
- [ ] Schema changes go to Forja migrations — not hand-edited in Studio
