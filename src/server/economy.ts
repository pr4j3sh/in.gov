import cpiSnapshot from '@/lib/snapshots/cpi.json'
import {
  CPI_SECTOR,
  latestAsOf,
  ledgerRows,
  monthLabel,
  normalizeCpiRecords,
  pressureByGroup,
  sectorSeries,
  type CpiRawRecord,
  type CpiResponse,
  type CpiSectorKey,
} from '@/lib/cpi'
import { fetchOgdRecords, ttlCache } from '@/server/ogd'

const RESOURCE_ID = 'cd73a2e7-f928-45de-ae61-f4e34fc9bb5c' // All India CPI (Rural/Urban)
const LIVE_TTL_MS = 30 * 60 * 1000

const rawCache = ttlCache<CpiRawRecord[]>(LIVE_TTL_MS)
let snapshotRawCache: CpiRawRecord[] | null = null
let snapshotLatestCache: Record<string, CpiRawRecord> | null = null

interface SnapshotFile {
  records: CpiRawRecord[]
  latestBySector: Record<string, CpiRawRecord>
}

async function loadSnapshot() {
  if (snapshotRawCache && snapshotLatestCache) {
    return { records: snapshotRawCache, latestBySector: snapshotLatestCache }
  }
  const data = cpiSnapshot as unknown as SnapshotFile
  snapshotRawCache = data.records
  snapshotLatestCache = data.latestBySector ?? {}
  return { records: snapshotRawCache, latestBySector: snapshotLatestCache }
}

export async function getEconomyData(sectorKey: CpiSectorKey = 'combined'): Promise<CpiResponse> {
  const apiKey = process.env.DATA_GOV_IN_API_KEY?.trim()
  let raw: CpiRawRecord[] | null = null
  let snapshotLatest: Record<string, CpiRawRecord> | null = null
  let source: CpiResponse['source'] = 'live'

  if (apiKey) {
    const cached = rawCache.get()
    if (cached) {
      raw = cached
    } else {
      try {
        raw = (await fetchOgdRecords(apiKey, RESOURCE_ID)) as unknown as CpiRawRecord[]
        rawCache.set(raw)
      } catch (err) {
        console.error('[economy] live fetch failed, falling back to snapshot:', err instanceof Error ? err.message : err)
      }
    }
  }

  if (!raw) {
    source = 'snapshot'
    const snap = await loadSnapshot()
    raw = snap.records
    snapshotLatest = snap.latestBySector
  }

  const points = normalizeCpiRecords(raw)
  const sectorLabel = CPI_SECTOR[sectorKey]
  const series = sectorSeries(points, sectorLabel)

  // YoY from the series (snapshot + live both carry full history here)
  const general = series.general
  const yoy = series.yoy
  const latestGeneral = [...general].reverse().find((v) => v != null) ?? null
  const latestYoy = [...yoy].reverse().find((v) => v != null) ?? null

  // Delta vs previous month (percentage points of YoY)
  const yoyValid = yoy.filter((v): v is number => v != null)
  const deltaVsPrevMonth = yoyValid.length >= 2
    ? Math.round((yoyValid[yoyValid.length - 1] - yoyValid[yoyValid.length - 2]) * 10) / 10
    : null

  const sparkline = yoy.filter((v): v is number => v != null).slice(-13)

  // Pressure chart — uses the snapshot's complete latest record when available,
  // else the latest in whatever data we have.
  let pressureSource = points
  if (source === 'snapshot' && snapshotLatest && snapshotLatest[sectorLabel]) {
    // Merge the full latest record so every component group is present.
    const extra = normalizeCpiRecords([snapshotLatest[sectorLabel]])[0]
    if (extra) {
      const existing = pressureSource.find(
        (p) => p.sector === sectorLabel && p.year === extra.year && p.month === extra.month,
      )
      if (existing) {
        pressureSource = [
          ...pressureSource.filter((p) => p !== existing),
          { ...extra, values: { ...extra.values, ...existing.values } },
        ]
      } else {
        pressureSource = [...pressureSource, extra]
      }
    }
  }
  const pressure = pressureByGroup(pressureSource, sectorLabel)

  const ledger = ledgerRows(points, sectorLabel, 18)

  return {
    source,
    asOf: latestAsOf(points),
    fetchedAt: new Date().toISOString(),
    sector: sectorKey,
    sectorLabel,
    summary: {
      months: series.points.length,
      latestGeneral,
      latestYoY: latestYoy,
      deltaVsPrevMonth,
    },
    series: {
      labels: series.points.map(monthLabel),
      general,
      yoy,
    },
    sparkline,
    pressure,
    ledger,
  }
}
