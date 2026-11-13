/**
 * Shared data.gov.in (OGD) client helpers — one implementation instead of
 * per-sector copies. Server-only: never import from client components.
 */

const OGD_BASE = 'https://api.data.gov.in/resource'
const DEFAULT_PAGE_SIZE = 5000
const DEFAULT_MAX_PAGES = 8 // hard cap — never trust upstream `total` unboundedly

export interface OgdFetchOptions {
  pageSize?: number
  maxPages?: number
}

interface RawPage {
  status: string
  total: string | number
  records: Record<string, unknown>[]
}

async function fetchPage(apiKey: string, resourceId: string, offset: number, limit: number): Promise<RawPage> {
  const url = new URL(`${OGD_BASE}/${resourceId}`)
  url.searchParams.set('api-key', apiKey)
  url.searchParams.set('format', 'json')
  url.searchParams.set('offset', String(offset))
  url.searchParams.set('limit', String(limit))
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`data.gov.in HTTP ${res.status}`)
  const data = (await res.json()) as RawPage
  if (data.status !== 'ok') throw new Error(`data.gov.in status=${data.status}`)
  return data
}

/** Fetch every page (capped) of an OGD resource. Throws on any failure — callers fall back to snapshot. */
export async function fetchOgdRecords(
  apiKey: string,
  resourceId: string,
  { pageSize = DEFAULT_PAGE_SIZE, maxPages = DEFAULT_MAX_PAGES }: OgdFetchOptions = {},
): Promise<Record<string, unknown>[]> {
  const first = await fetchPage(apiKey, resourceId, 0, pageSize)
  const total = Number(first.total)
  const pageCount = Number.isFinite(total) && total > 0
    ? Math.min(maxPages, Math.ceil(total / pageSize))
    : 1
  if (pageCount <= 1) return first.records
  const rest = await Promise.all(
    Array.from({ length: pageCount - 1 }, (_, i) => fetchPage(apiKey, resourceId, (i + 1) * pageSize, pageSize)),
  )
  return [first, ...rest].flatMap((p) => p.records)
}

/** Tolerant number parser for OGD string fields (strips commas, treats NA/blank as missing). */
export function ogdNum(v: unknown): number | null {
  if (v == null) return null
  const s = String(v).trim()
  if (!s || s.toUpperCase() === 'NA') return null
  const n = Number(s.replace(/,/g, '').replace(/[^0-9.\-]/g, ''))
  return Number.isFinite(n) ? n : null
}

/** Strict-ish number parser for fields where only commas/whitespace should be stripped. */
export function ogdNumPlain(v: unknown): number | null {
  if (v == null) return null
  const n = Number(String(v).trim().replace(/,/g, ''))
  return Number.isFinite(n) ? n : null
}

export function ogdStr(v: unknown): string {
  return v == null ? '' : String(v).trim()
}

/** Simple in-process TTL cache. Survives warm serverless invocations. */
export function ttlCache<T>(ttlMs: number) {
  let entry: { data: T; expires: number } | null = null
  return {
    get(): T | null {
      if (!entry) return null
      if (Date.now() >= entry.expires) {
        entry = null
        return null
      }
      return entry.data
    },
    set(data: T): void {
      entry = { data, expires: Date.now() + ttlMs }
    },
    clear(): void {
      entry = null
    },
  }
}
