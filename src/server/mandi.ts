import mandiSnapshot from '@/lib/snapshots/mandi.json'
import {
  byCommodity,
  byState,
  filterRecords,
  focusCommodity,
  latestArrivalDate,
  listCommodities,
  listStates,
  marketSpread,
  normalizeRecords,
  summarize,
} from '@/lib/mandi'
import { fetchOgdRecords, ttlCache } from '@/server/ogd'
import type { MandiRawRecord, MandiResponse } from '@/lib/types'

const RESOURCE_ID = '9ef84268-d588-465a-a308-a864a43d0070' // daily mandi prices
const LIVE_TTL_MS = 30 * 60 * 1000 // 30 min in-process cache — upstream payload exceeds Next's 2MB data-cache limit

// In-process cache. Survives between requests on a long-lived server and
// across warm serverless invocations; never logs the keyed upstream URL.
const rawCache = ttlCache<MandiRawRecord[]>(LIVE_TTL_MS)
let snapshotRawCache: MandiRawRecord[] | null = null

interface SnapshotFile {
  meta: { asOf: string; generatedAt: string }
  records: MandiRawRecord[]
}

async function loadSnapshot(): Promise<MandiRawRecord[]> {
  if (snapshotRawCache) return snapshotRawCache
  snapshotRawCache = (mandiSnapshot as unknown as SnapshotFile).records
  return snapshotRawCache
}

export async function getMandiData(filters: {
  state?: string | null
  commodity?: string | null
  q?: string | null
}): Promise<MandiResponse> {
  const apiKey = process.env.DATA_GOV_IN_API_KEY?.trim()
  let raw: MandiRawRecord[] | null = null
  let source: MandiResponse['source'] = 'live'

  if (apiKey) {
    const cached = rawCache.get()
    if (cached) {
      raw = cached
    } else {
      try {
        raw = (await fetchOgdRecords(apiKey, RESOURCE_ID)) as unknown as MandiRawRecord[]
        rawCache.set(raw)
      } catch (err) {
        console.error('[mandi] live fetch failed, falling back to snapshot:', err instanceof Error ? err.message : err)
      }
    }
  }
  if (!raw) {
    source = 'snapshot'
    raw = await loadSnapshot()
  }

  const records = normalizeRecords(raw)
  const state = filters.state?.trim() || null
  const commodityParam = filters.commodity?.trim() || null
  const focus = commodityParam || focusCommodity(records, state)

  const filtered = filterRecords(records, { state, commodity: commodityParam })

  // Full-dataset text search for the ticker — never limited by the 150-row page.
  const q = filters.q?.trim().toLowerCase() || ''
  const searched = q
    ? filtered.filter((r) =>
        [r.state, r.district, r.market, r.commodity, r.variety, r.grade]
          .join(' ')
          .toLowerCase()
          .includes(q),
      )
    : filtered
  const table = [...searched].sort(
    (a, b) => a.state.localeCompare(b.state) || a.market.localeCompare(b.market),
  )

  return {
    source,
    asOf: latestArrivalDate(records),
    fetchedAt: new Date().toISOString(),
    filters: { state, commodity: commodityParam },
    focusCommodity: focus,
    summary: summarize(records),
    filterOptions: {
      states: listStates(records),
      commodities: listCommodities(records, state),
    },
    byCommodity: byCommodity(records, state, 12),
    byState: byState(records, focus),
    marketSpread: marketSpread(records, focus, 10),
    table: table.slice(0, 150),
    tableCount: table.length,
  }
}
