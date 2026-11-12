import { NextResponse } from 'next/server'
import {
  placeholderStats,
  arbitrageSpread,
  outliers,
  topMarkets,
  thresholdAlerts,
  coverageByState,
} from '@/lib/mandi-insights'
import mandiSnapshot from '@/lib/snapshots/mandi.json'
import type { MandiResponse } from '@/lib/types'

// Lightweight re-fetch — same endpoint serves one day; cached in-process.
// We re-use the main mandi page cache when it exists.
const RES = '9ef84268-d588-465a-a308-a864a43d0070'
const PAGE = 5000
const LIVE_TTL_MS = 30 * 60 * 1000
let cache: { records: Record<string, unknown>[]; fetchedAt: number } | null = null

async function loadRecords(): Promise<Array<Record<string, unknown>>> {
  const apiKey = process.env.DATA_GOV_IN_API_KEY?.trim()
  if (cache && Date.now() - cache.fetchedAt < LIVE_TTL_MS) return cache.records

  if (apiKey) {
    try {
      const fetchPage = async (offset: number) => {
        const url = new URL(`https://api.data.gov.in/resource/${RES}`)
        url.searchParams.set('api-key', apiKey)
        url.searchParams.set('format', 'json')
        url.searchParams.set('offset', String(offset))
        url.searchParams.set('limit', String(PAGE))
        const res = await fetch(url, { cache: 'no-store' })
        if (!res.ok) throw new Error(`data.gov.in HTTP ${res.status}`)
        const d = (await res.json()) as { status: string; total: string | number; records: Record<string, unknown>[] }
        if (d.status !== 'ok') throw new Error(`data.gov.in status=${d.status}`)
        return d
      }
      const first = await fetchPage(0)
      const total = Number(first.total)
      const pageCount = Math.min(8, Math.ceil(total / PAGE))
      const rest = await Promise.all(Array.from({ length: pageCount - 1 }, (_, i) => fetchPage((i + 1) * PAGE)))
      const records = [first, ...rest].flatMap((p) => p.records)
      cache = { records, fetchedAt: Date.now() }
      return records
    } catch (err) {
      console.error('[insights] live fetch failed:', err instanceof Error ? err.message : err)
    }
  }
  // Fallback to bundled snapshot
  const snap = mandiSnapshot as unknown as { records: Record<string, unknown>[] }
  return snap.records
}

const num = (v: unknown) => { const n = Number(String(v ?? '0').trim()); return Number.isFinite(n) ? n : 0 }
const str = (v: unknown) => (v == null ? '' : String(v).trim())

export async function GET() {
  try {
    const raw = await loadRecords()
    const records = raw.map((r) => ({
      state: str(r.state),
      district: str(r.district),
      market: str(r.market).replace(/\s+/g, ' ').trim(),
      commodity: str(r.commodity),
      variety: str(r.variety),
      grade: str(r.grade),
      arrivalDate: str(r.arrival_date),
      minPrice: num(r.min_price),
      maxPrice: num(r.max_price),
      modalPrice: num(r.modal_price),
    })).filter((r) => r.modalPrice > 0)

    const insights = {
      quality: placeholderStats(records),
      arbitrage: arbitrageSpread(records, ['Tomato', 'Onion', 'Potato']),
      outliers: outliers(records, 8, 5),
      bestMarket: { tomato: topMarkets(records, 'Tomato', 5), onion: topMarkets(records, 'Onion', 5), potato: topMarkets(records, 'Potato', 5) },
      thresholds: thresholdAlerts(records),
      coverage: coverageByState(records),
    }
    return NextResponse.json(insights, {
      headers: { 'x-data-source': 'live', 'cache-control': 'public, s-maxage=1800, stale-while-revalidate=3600' },
    })
  } catch (err) {
    console.error('[api/agriculture/insights] error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Failed to load insights' }, { status: 502 })
  }
}
export const maxDuration = 60
