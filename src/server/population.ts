import {
  populationOfIndia,
  densestState,
  largestState,
  type CensusResponse,
  type StateRow,
  type SexRatioRow,
  type WorkerRow,
  type CensusSeriesPoint,
} from '@/lib/census'
import censusSnapshot from '@/lib/snapshots/census.json'
import { fetchOgdRecords, ttlCache, ogdNum as num, ogdStr as str } from '@/server/ogd'

const RES = {
  series: 'e00c5fab-ad0a-420a-b1e3-d499b244c99f',
  states: '463d908b-c03b-47d3-b5bb-33d584d27f65',
  sexRatio: '2320f4d4-85b6-46bb-86b6-36824b87cd08',
  workers: '64d4bcb5-945d-48e8-84ec-995558785336',
} as const
const LIVE_TTL_MS = 6 * 60 * 60 * 1000
const liveCache = ttlCache<CensusResponse>(LIVE_TTL_MS)


type RawSeries = CensusSeriesPoint

function parseSeries(records: Record<string, unknown>[]): RawSeries[] {
  return records.map((r) => ({
    year: num(r.year) ?? 0,
    populationMillions: num(r.population__in_million_),
    decadalVariationPct: num(r.percentage_decadal_variation),
    annualGrowthPct: num(r.average_annual_exponential_growth_rate__percent_),
    crudeBirthRate: num(r.crude_birth_rate),
    crudeDeathRate: num(r.crude_death_rate),
    sexRatioFemalesPer1000Males: num(r.sex_ratio__females_per_1000_males_),
  })).filter((r) => r.year > 0).sort((a, b) => a.year - b.year)
}
function parseStates(records: Record<string, unknown>[]): StateRow[] {
  return records.map((r) => ({
    name: str(r.india_state_union_territory),
    category: str(r.category),
    population2011: num(r.population_2011),
    decadalGrowthPct: num(r.decadal_population_growth_rate___2001_2011),
    densityPerSqKm: num(r.population_density_per_sq_km___2011),
  })).filter((r) => r.name)
}
function parseSexRatio(records: Record<string, unknown>[]): SexRatioRow[] {
  return records.map((r) => ({
    name: str(r.state_union_territory),
    population2011: num(r.percent_female_population___2011___persons),
    femalePct2011: num(r.percent_female_population___2011_____female),
    sexRatio: num(r.sex_ratio___2011),
    annualGrowthPct: num(r.average_annual_exponential_growth_rate_______2001_2011),
  })).filter((r) => r.name)
}
function parseWorkers(records: Record<string, unknown>[]): WorkerRow[] {
  return records.map((r) => ({
    name: str(r.india_state_union_territory),
    totalPopulation: num(r.total_population_persons),
    mainWorkers: num(r.main_workers_persons),
    mainWorkersPct2001: num(r.percentage_of_main_workers_to_total_population_2001_persons),
    mainWorkersPct2011: num(r.percentage_of_main_workers_to_total_population_2011_persons),
    maleWorkersPct2011: num(r.percentage_of_main_workers_to_total_population_2011_males),
    femaleWorkersPct2011: num(r.percentage_of_main_workers_to_total_population_2011_females),
  })).filter((r) => r.name)
}

function buildResponse(source: CensusResponse['source'], series: CensusSeriesPoint[], states: StateRow[], sexRatio: SexRatioRow[], workers: WorkerRow[]): CensusResponse {
  const population2011 = populationOfIndia(states)
  const [india] = states.filter((s) => /^india$/i.test(s.name))
  const sex2011 = sexRatio.find((s) => /^india$/i.test(s.name))
  return {
    source,
    fetchedAt: new Date().toISOString(),
    asOf: '2011',
    summary: {
      population2011,
      indiaNCr: population2011 == null ? null : Math.round((population2011 / 1e7) * 10) / 10,
      decadalGrowthPct: india?.decadalGrowthPct ?? null,
      densityPerSqKm: india?.densityPerSqKm ?? null,
      sexRatio2011: sex2011?.sexRatio ?? null,
      largestState: largestState(states),
      densestState: densestState(states),
    },
    series,
    states,
    sexRatio,
    workers,
  }
}

type SnapshotShape = {
  series: CensusSeriesPoint[]
  states: StateRow[]
  sexRatio: SexRatioRow[]
  workers: WorkerRow[]
}

export async function getPopulationData(): Promise<CensusResponse> {
  const apiKey = process.env.DATA_GOV_IN_API_KEY?.trim()
  const cached = liveCache.get()
  if (cached) return cached
  if (apiKey) {
    try {
      const [seriesRaw, statesRaw, sexRatioRaw, workersRaw] = await Promise.all([
        fetchOgdRecords(apiKey, RES.series),
        fetchOgdRecords(apiKey, RES.states),
        fetchOgdRecords(apiKey, RES.sexRatio),
        fetchOgdRecords(apiKey, RES.workers),
      ])
      const series = parseSeries(seriesRaw)
      const states = parseStates(statesRaw)
      const sexRatio = parseSexRatio(sexRatioRaw)
      const workers = parseWorkers(workersRaw)
      if (series.length && states.length && sexRatio.length) {
        const resp = buildResponse('live', series, states, sexRatio, workers)
        liveCache.set(resp)
        return resp
      }
      throw new Error('incomplete live payload')
    } catch (err) {
      console.error('[population] live fetch failed, falling back to snapshot:', err instanceof Error ? err.message : err)
    }
  }
  const s = censusSnapshot as unknown as SnapshotShape
  return buildResponse('snapshot', s.series, s.states, s.sexRatio, s.workers)
}
