import {
  nonFossilShare, totalYoY, yoyShareDelta, solarTotal, type EnergyResponse, type MixRow, type NuclearRow, type SolarRow,
} from '@/lib/energy'
import energySnapshot from '@/lib/snapshots/energy.json'
import { fetchOgdRecords, ttlCache, ogdNum as num, ogdStr as str } from '@/server/ogd'

const RES = {
  mix: '75e31856-e00b-4de9-970e-987442936958',
  nuclear: '09c4ff3d-6d68-4bfa-9eca-7ec38ded9cd9',
  solar: '3056d949-7e94-4e2a-ad7f-9bf3dd82e530',
} as const
const LIVE_TTL_MS = 6 * 60 * 60 * 1000
const liveCache = ttlCache<EnergyResponse>(LIVE_TTL_MS)

const isAggregate = (name: unknown) => /total|region|all india|india/i.test(String(name ?? ''))

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
  const cached = liveCache.get()
  if (cached) return cached
  if (apiKey) {
    try {
      const [mixRaw, nuclearRaw, solarRaw] = await Promise.all([
        fetchOgdRecords(apiKey, RES.mix),
        fetchOgdRecords(apiKey, RES.nuclear),
        fetchOgdRecords(apiKey, RES.solar),
      ])
      const mix = parseMix(mixRaw)
      const nuclear = parseNuclear(nuclearRaw)
      const solar = parseSolar(solarRaw)
      if (mix.length && nuclear.length && solar.length) {
        const resp = buildResponse('live', mix, nuclear, solar)
        liveCache.set(resp)
        return resp
      }
      throw new Error('incomplete live payload')
    } catch (err) {
      console.error('[energy] live fetch failed, falling back to snapshot:', err instanceof Error ? err.message : err)
    }
  }
  const s = energySnapshot as unknown as SnapshotShape
  return buildResponse('snapshot', s.mix, s.nuclear, s.solar)
}
