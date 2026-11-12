import {
  nonFossilShare, totalYoY, yoyShareDelta, solarTotal, type EnergyResponse, type MixRow, type NuclearRow, type SolarRow,
} from '@/lib/energy'
import energySnapshot from '@/lib/snapshots/energy.json'

const RES = {
  mix: '75e31856-e00b-4de9-970e-987442936958',
  nuclear: '09c4ff3d-6d68-4bfa-9eca-7ec38ded9cd9',
  solar: '3056d949-7e94-4e2a-ad7f-9bf3dd82e530',
} as const
const LIVE_TTL_MS = 6 * 60 * 60 * 1000
let liveCache: EnergyResponse | null = null

const num = (v: unknown): number | null => {
  if (v == null) return null
  const n = Number(String(v).trim().replace(/,/g, ''))
  return Number.isFinite(n) ? n : null
}
const str = (v: unknown) => (v == null ? '' : String(v).trim())
const isAggregate = (name: unknown) => /total|region|all india|india/i.test(String(name ?? ''))

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

function parseMix(records: Record<string, unknown>[]): MixRow[] {
  return records.map((r) => ({
    source: str(r.electricity_generation_by_source),
    fy2023: num(r._2022_23),
    fy2024: num(r._2023_24),
    fy2025: num(r._2024_25),
  })).filter((r) => r.source)
}
function parseNuclear(records: Record<string, unknown>[]): NuclearRow[] {
  return records.map((r) => ({ year: str(r._year), generationMU: num(r.gross_generation__million_units_) })).filter((r) => r.year && r.generationMU != null)
}
function parseSolar(records: Record<string, unknown>[]): SolarRow[] {
  return records.filter((r) => !isAggregate(r.state_ut))
    .map((r) => ({ state: str(r.state_ut), generationGWh: num(r.solar_electricity_generation_in_2022_2023_) }))
    .filter((r) => r.state && r.generationGWh != null)
    .sort((a, b) => (b.generationGWh ?? 0) - (a.generationGWh ?? 0))
}

function buildResponse(source: EnergyResponse['source'], mix: MixRow[], nuclear: NuclearRow[], solar: SolarRow[]): EnergyResponse {
  const totalRow = mix.find((m) => /total/i.test(m.source))
  return {
    source,
    fetchedAt: new Date().toISOString(),
    asOf: 'FY2024-25',
    summary: {
      totalGenerationFy25: totalRow?.fy2025 ?? null,
      yoyTotalPct: totalYoY(mix),
      nonFossilShareFy25: nonFossilShare(mix, 'fy2025'),
      nonFossilShareDelta: yoyShareDelta(mix),
      nuclearLatestMU: nuclear[nuclear.length - 1]?.generationMU ?? null,
      solarFy23TotalGWh: solarTotal(solar),
    },
    mix,
    nuclear,
    solar,
  }
}

type SnapshotShape = { mix: MixRow[]; nuclear: NuclearRow[]; solar: SolarRow[] }

export async function getEnergyData(): Promise<EnergyResponse> {
  const apiKey = process.env.DATA_GOV_IN_API_KEY?.trim()
  if (liveCache) return liveCache
  if (apiKey) {
    try {
      const [mixRaw, nuclearRaw, solarRaw] = await Promise.all([
        fetchAll(apiKey, RES.mix),
        fetchAll(apiKey, RES.nuclear),
        fetchAll(apiKey, RES.solar),
      ])
      const mix = parseMix(mixRaw)
      const nuclear = parseNuclear(nuclearRaw)
      const solar = parseSolar(solarRaw)
      if (mix.length && nuclear.length && solar.length) {
        liveCache = buildResponse('live', mix, nuclear, solar)
        return liveCache
      }
      throw new Error('incomplete live payload')
    } catch (err) {
      console.error('[energy] live fetch failed, falling back to snapshot:', err instanceof Error ? err.message : err)
    }
  }
  const s = energySnapshot as unknown as SnapshotShape
  return buildResponse('snapshot', s.mix, s.nuclear, s.solar)
}
