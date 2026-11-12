import { yoy, coalLatest, type RailwaysResponse, type FreightRow, type TrainTypeRow, type CoalFreightRow } from '@/lib/railways'
import railwaysSnapshot from '@/lib/snapshots/railways.json'

const RES = {
  freight: '4cb9673d-44e5-476b-8faf-47196db99bf8',
  trains: '10b38365-5fe4-459d-880b-cda4b26458b2',
  coal: '8002f953-737e-4e88-b593-b52ea512329f',
} as const
const LIVE_TTL_MS = 6 * 60 * 60 * 1000
let liveCache: RailwaysResponse | null = null

const num = (v: unknown): number | null => {
  if (v == null) return null
  const s = String(v).trim()
  if (!s || s.toUpperCase() === 'NA') return null
  const n = Number(s.replace(/[^0-9.\-]/g, ''))
  return Number.isFinite(n) ? n : null
}
const str = (v: unknown) => (v == null ? '' : String(v).trim())

async function fetchAll(apiKey: string, id: string): Promise<Record<string, unknown>[]> {
  const url = new URL(`https://api.data.gov.in/resource/${id}`)
  url.searchParams.set('api-key', apiKey)
  url.searchParams.set('format', 'json')
  url.searchParams.set('limit', '5000')
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) throw new Error(`data.gov.in HTTP ${res.status}`)
  const d = (await res.json()) as { status: string; records: Record<string, unknown>[] }
  if (d.status !== 'ok') throw new Error(`data.gov.in status=${d.status}`)
  return d.records
}

function parseFreight(records: Record<string, unknown>[]): FreightRow[] {
  return records.map((r) => ({
    year: str(r._year),
    loadingMnt: num(r.freight_loading__in_million_tonnes_),
    revenueCrore: num(r.freight_revenue__rs__in_crore_),
  })).filter((r) => r.year)
}
function parseTrains(records: Record<string, unknown>[]): TrainTypeRow[] {
  return records.map((r) => ({
    year: str(r.type_of_train),
    mailExpress: num(r.mail_express),
    ordinary: num(r.ordinary),
    goods: num(r.goods),
  })).filter((r) => r.year)
}
function parseCoal(records: Record<string, unknown>[]): CoalFreightRow[] {
  return records.map((r) => ({
    year: str(r._year).replace(/\s*\(.*?\)\.?\s*$/, ''),
    revenueCrore: num(r.freight_revenue_from_coal),
  })).filter((r) => r.year && r.revenueCrore != null)
}

function buildResponse(source: RailwaysResponse['source'], freight: FreightRow[], trains: TrainTypeRow[], coal: CoalFreightRow[]): RailwaysResponse {
  const latestLoading = freight[freight.length - 1]?.loadingMnt ?? null
  const latestRevenue = freight[freight.length - 1]?.revenueCrore ?? null
  return {
    source,
    fetchedAt: new Date().toISOString(),
    asOf: 'FY2024-25',
    summary: {
      latestLoadingMnt: latestLoading,
      latestRevenueCrore: latestRevenue,
      yoyLoadingPct: yoy(freight, 'loadingMnt'),
      yoyRevenuePct: yoy(freight, 'revenueCrore'),
      coalRevenue2021_22: coalLatest(coal),
    },
    freight,
    trains,
    coal,
  }
}

type SnapshotShape = { freight: FreightRow[]; trains: TrainTypeRow[]; coal: CoalFreightRow[] }

export async function getRailwaysData(): Promise<RailwaysResponse> {
  const apiKey = process.env.DATA_GOV_IN_API_KEY?.trim()
  if (liveCache) return liveCache
  if (apiKey) {
    try {
      const [freightRaw, trainsRaw, coalRaw] = await Promise.all([
        fetchAll(apiKey, RES.freight),
        fetchAll(apiKey, RES.trains),
        fetchAll(apiKey, RES.coal),
      ])
      const freight = parseFreight(freightRaw)
      const trains = parseTrains(trainsRaw)
      const coal = parseCoal(coalRaw)
      if (freight.length && trains.length && coal.length) {
        liveCache = buildResponse('live', freight, trains, coal)
        return liveCache
      }
      throw new Error('incomplete live payload')
    } catch (err) {
      console.error('[railways] live fetch failed, falling back to snapshot:', err instanceof Error ? err.message : err)
    }
  }
  const s = railwaysSnapshot as unknown as SnapshotShape
  return buildResponse('snapshot', s.freight, s.trains, s.coal)
}
