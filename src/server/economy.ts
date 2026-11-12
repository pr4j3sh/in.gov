import { readFile } from 'node:fs/promises'
import path from 'node:path'
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

const RESOURCE_ID = 'cd73a2e7-f928-45de-ae61-f4e34fc9bb5c' // All India CPI (Rural/Urban)
const PAGE = 5000
const MAX_PAGES = 8
const LIVE_TTL_MS = 30 * 60 * 1000

let liveCache: { raw: CpiRawRecord[]; fetchedAt: number } | null = null
let snapshotRawCache: CpiRawRecord[] | null = null
let snapshotLatestCache: Record<string, CpiRawRecord> | null = null

interface RawPage {
  status: string
  total: string | number
  records: CpiRawRecord[]
}

async function fetchPage(apiKey: string, offset: number): Promise<RawPage> {
  const url = new URL(`https://api.data.gov.in/resource/${RESOURCE_ID}`)
  url.searchParams.set('api-key', apiKey)
  url.searchParams.set('format', 'json')
  url.searchParams.set('offset', String(offset))
  url.searchParams.set('limit', String(PAGE))
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`data.gov.in HTTP ${res.status}`)
  const data = (await res.json()) as RawPage
  if (data.status !== 'ok') throw new Error(`data.gov.in status=${data.status}`)
  return data
}

interface SnapshotFile {
  records: CpiRawRecord[]
  latestBySector: Record<string, CpiRawRecord>
}

async function loadSnapshot() {
  if (snapshotRawCache && snapshotLatestCache) {
    return { records: snapshotRawCache, latestBySector: snapshotLatestCache }
  }
  const file = path.join(process.cwd(), 'src/lib/snapshots/cpi.json')
  const data = JSON.parse(await readFile(file, 'utf8')) as SnapshotFile
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
    if (liveCache && Date.now() - liveCache.fetchedAt < LIVE_TTL_MS) {
      raw = liveCache.raw
    } else {
      try {
        const first = await fetchPage(apiKey, 0)
        const total = Number(first.total)
        const pageCount = Math.min(MAX_PAGES, Math.ceil((Number.isFinite(total) && total > 0 ? total : 0) / PAGE) || 1)
        const rest = await Promise.all(
          Array.from({ length: Math.max(0, pageCount - 1) }, (_, i) => fetchPage(apiKey, (i + 1) * PAGE)),
        )
        raw = [first, ...rest].flatMap((p) => p.records)
        liveCache = { raw, fetchedAt: Date.now() }
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
