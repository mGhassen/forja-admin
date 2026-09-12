import { adminDb } from '@/lib/admin-db'
import { fetchAllRows } from '@/lib/fetch-all-rows'

export type DeepRefPortalRow = {
  id: string
  platform: string
  type: string
  output: string
  url: string
  username: string
  was_existing: boolean
  portal_id: string | null
  created_at: string
}

export type DeepRefRow = {
  id: string
  post_id: string
  scrape_run_id: string | null
  base64: string
  paste_url: string
  ref_host: string
  payload_hash: string
  fetch_ok: boolean | null
  extract_count: number
  needs_recheck: boolean
  created_at: string
  /** Last collect/process upsert; falls back to created_at pre-migration. */
  updated_at: string | null
  iptv_scrape_runs: { started_at: string } | null
}

export type DeepRefFilterStatus =
  | 'all'
  | 'recheck'
  | 'ok'
  | 'has_portals'
  | 'existing_only'

export type DeepRefStats = {
  total: number
  recheck: number
  withPaste: number
  portalHits: number
  notPromoted: number
}

export type DeepRefsPageResult = {
  rows: DeepRefRow[]
  total: number
  stats: DeepRefStats
}

export type DeepRefsListParams = {
  q?: string
  status?: DeepRefFilterStatus
  limit?: number
  offset?: number
}

function errMessage(e: unknown, fallback: string): string {
  if (e && typeof e === 'object' && 'message' in e) {
    const m = (e as { message?: string }).message
    if (m) return m
  }
  return e instanceof Error ? e.message : fallback
}

export function deepRefLastAt(r: DeepRefRow): string {
  return r.updated_at || r.iptv_scrape_runs?.started_at || r.created_at
}

export async function fetchDeepRefsPage(
  opts: DeepRefsListParams,
): Promise<DeepRefsPageResult> {
  const { data, error } = await adminDb.rpc('admin_iptv_deep_refs_list', {
    p_q: opts.q?.trim() || null,
    p_status: opts.status ?? 'all',
    p_limit: opts.limit ?? 50,
    p_offset: opts.offset ?? 0,
  })
  if (error) throw new Error(errMessage(error, 'Deep refs list failed'))
  const raw = (data ?? {}) as Record<string, unknown>
  const list = Array.isArray(raw.rows) ? raw.rows : []
  const statsRaw =
    raw.stats && typeof raw.stats === 'object'
      ? (raw.stats as Record<string, unknown>)
      : {}
  const rows: DeepRefRow[] = list.map((row) => {
    const r = row as Record<string, unknown>
    const runStarted = r.run_started_at
    return {
      id: String(r.id ?? ''),
      post_id: String(r.post_id ?? ''),
      scrape_run_id: (r.scrape_run_id as string | null) ?? null,
      base64: String(r.base64 ?? ''),
      paste_url: String(r.paste_url ?? ''),
      ref_host: String(r.ref_host ?? ''),
      payload_hash: String(r.payload_hash ?? ''),
      fetch_ok: (r.fetch_ok as boolean | null) ?? null,
      extract_count: Number(r.extract_count ?? 0),
      needs_recheck: Boolean(r.needs_recheck),
      created_at: String(r.created_at ?? ''),
      updated_at: (r.updated_at as string | null) ?? null,
      iptv_scrape_runs:
        typeof runStarted === 'string' && runStarted
          ? { started_at: runStarted }
          : null,
    }
  })
  return {
    rows,
    total: Number(raw.total ?? rows.length),
    stats: {
      total: Number(statsRaw.total ?? 0),
      recheck: Number(statsRaw.recheck ?? 0),
      withPaste: Number(statsRaw.with_paste ?? 0),
      portalHits: Number(statsRaw.portal_hits ?? 0),
      notPromoted: Number(statsRaw.not_promoted ?? 0),
    },
  }
}

/** Portals for one deep ref — lazy on expand. */
export async function fetchDeepRefPortals(
  deepRefId: string,
): Promise<DeepRefPortalRow[]> {
  const id = deepRefId.trim()
  if (!id) return []
  return fetchAllRows<DeepRefPortalRow>(async (from, to) => {
    const { data, error } = await adminDb
      .from('iptv_scrape_deep_ref_portals')
      .select(
        'id, platform, type, output, url, username, was_existing, portal_id, created_at',
      )
      .eq('deep_ref_id', id)
      .order('created_at', { ascending: false })
      .range(from, to)
    if (error) throw new Error(errMessage(error, 'Deep ref portals failed'))
    return (data ?? []) as DeepRefPortalRow[]
  })
}
