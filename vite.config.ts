import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { nitro } from 'nitro/vite'
import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const adminRoot = path.dirname(fileURLToPath(import.meta.url))
const forjaAuthRoot = path.resolve(adminRoot, 'packages/forja-auth')
/** Optional sibling Forja checkout — share root `.env` for local Supabase keys. */
const siblingForjaRoot = path.resolve(adminRoot, '../Forja')

function bridgeEnv(mode: string) {
  const localEnv = loadEnv(mode, adminRoot, '')
  const siblingEnv = loadEnv(mode, siblingForjaRoot, '')
  const url =
    localEnv.VITE_SUPABASE_URL ||
    siblingEnv.VITE_SUPABASE_URL ||
    siblingEnv.SUPABASE_URL ||
    ''
  const key =
    localEnv.VITE_SUPABASE_PUBLISHABLE_KEY ||
    siblingEnv.VITE_SUPABASE_PUBLISHABLE_KEY ||
    siblingEnv.SUPABASE_PUBLISHABLE_KEY ||
    ''
  const turnstile =
    localEnv.VITE_TURNSTILE_SITE_KEY ||
    siblingEnv.VITE_TURNSTILE_SITE_KEY ||
    siblingEnv.TURNSTILE_SITE_KEY ||
    ''
  if (url && !process.env.VITE_SUPABASE_URL) {
    process.env.VITE_SUPABASE_URL = url
  }
  if (key && !process.env.VITE_SUPABASE_PUBLISHABLE_KEY) {
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY = key
  }
  if (turnstile && !process.env.VITE_TURNSTILE_SITE_KEY) {
    process.env.VITE_TURNSTILE_SITE_KEY = turnstile
  }
  const oauth =
    localEnv.VITE_AUTH_OAUTH_PROVIDERS ||
    siblingEnv.VITE_AUTH_OAUTH_PROVIDERS ||
    ''
  if (oauth && !process.env.VITE_AUTH_OAUTH_PROVIDERS) {
    process.env.VITE_AUTH_OAUTH_PROVIDERS = oauth
  }

  const serviceRole =
    localEnv.SUPABASE_SERVICE_ROLE_KEY ||
    siblingEnv.SUPABASE_SERVICE_ROLE_KEY ||
    ''
  if (serviceRole && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    process.env.SUPABASE_SERVICE_ROLE_KEY = serviceRole
  }
  if (url && !process.env.SUPABASE_URL) {
    process.env.SUPABASE_URL = url
  }
  const releaseCdn =
    localEnv.RELEASE_CDN_URL ||
    siblingEnv.RELEASE_CDN_URL ||
    localEnv.VITE_RELEASE_CDN_URL ||
    siblingEnv.VITE_RELEASE_CDN_URL ||
    ''
  if (releaseCdn && !process.env.RELEASE_CDN_URL) {
    process.env.RELEASE_CDN_URL = releaseCdn
  }
  for (const k of [
    'INNGEST_EVENT_KEY',
    'INNGEST_SIGNING_KEY',
    'INNGEST_DEV',
    'REDDIT_CLIENT_IDS',
    'ANTHROPIC_API_KEY',
    'IPTV_LLM_MODEL',
    'IPTV_LLM_EXTRACT',
    'R2_ACCOUNT_ID',
    'CLOUDFLARE_ACCOUNT_ID',
    'CLOUDFLARE_API_TOKEN',
    'CF_API_TOKEN',
    'R2_BUCKET',
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY',
    'R2_ENDPOINT',
    'RELEASE_CDN_URL',
    'POSTHOG_PERSONAL_API_KEY',
    'POSTHOG_PRIVATE_API_KEY',
    'POSTHOG_PROJECT_ID',
    'POSTHOG_PROJECT_API_ID',
    'POSTHOG_HOST',
    'POSTHOG_API_HOST',
  ] as const) {
    const v = localEnv[k] || siblingEnv[k] || ''
    // Prefer this repo's .env over a stale shell export
    if (v) process.env[k] = v
  }
  // Local vite serve only — never bake INNGEST_DEV=1 into a Vercel/prod build
  if (
    mode === 'development' &&
    !process.env.INNGEST_DEV &&
    !process.env.VERCEL
  ) {
    process.env.INNGEST_DEV = '1'
  }
}

export default defineConfig(({ mode }) => {
  bridgeEnv(mode)

  const defineEnv: Record<string, string> = {}
  for (const k of [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_PUBLISHABLE_KEY',
    'VITE_TURNSTILE_SITE_KEY',
    'VITE_AUTH_OAUTH_PROVIDERS',
  ] as const) {
    const v = process.env[k]
    if (v) defineEnv[`process.env.${k}`] = JSON.stringify(v)
  }

  return {
    define: defineEnv,
    server: {
      port: 4000,
      host: '127.0.0.1',
      fs: {
        allow: [adminRoot, forjaAuthRoot],
      },
    },
    resolve: {
      tsconfigPaths: true,
      alias: {
        '@forja/auth/react': path.resolve(forjaAuthRoot, 'src/react/index.ts'),
        '@forja/auth': path.resolve(forjaAuthRoot, 'src/index.ts'),
      },
    },
    plugins: [
      tanstackStart(),
      nitro({
        vercel: {
          functions: {
            maxDuration: 300,
          },
        },
      }),
      viteReact(),
      tailwindcss(),
    ],
  }
})
