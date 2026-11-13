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
import { fetchOgdRecords, ttlCache } from '@/server/ogd'

// Lightweight re-fetch — same endpoint serves one day; cached in-process.
const RES = '9ef84268-d588-465a-a308-a864a43d0070'
const LIVE_TTL_MS = 30 * 60 * 1000
const cache = ttlCache<Record<string, unknown>[]>(LIVE_TTL_MS)

async function loadRecords(): Promise<{ records: Record<string, unknown>[]; source: 'live' | 'snapshot' }> {
  const apiKey = process.env.DATA_GOV_IN_API_KEY?.trim()
  const cached = cache.get()
  if (cached) return { records: cached, source: 'live' }

  if (apiKey) {
    try {
      const records = await fetchOgdRecords(apiKey, RES)
      cache.set(records)
      return { records, source: 'live' }
    } catch (err) {
      console.error('[insights] live fetch failed, falling back to snapshot:', err instanceof Error ? err.message : err)
    }
  }
  // Fallback to bundled snapshot
  const snap = mandiSnapshot as unknown as { records: Record<string, unknown>[] }
  return { records: snap.records, source: 'snapshot' }
}

const num = (v: unknown) => { const n = Number(String(v ?? '0').trim()); return Number.isFinite(n) ? n : 0 }
const str = (v: unknown) => (v == null ? '' : String(v).trim())

export async function GET() {
  try {
    const { records: raw, source } = await loadRecords()
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
      headers: { 'x-data-source': source, 'cache-control': 'public, s-maxage=1800, stale-while-revalidate=3600' },
    })
  } catch (err) {
    console.error('[api/agriculture/insights] error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Failed to load insights' }, { status: 502 })
  }
}
export const maxDuration = 60
