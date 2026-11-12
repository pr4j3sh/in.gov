/** Pure adapter for the Census-2011 archived prints (OGD). */

export interface CensusSeriesPoint {
  year: number
  populationMillions: number | null
  decadalVariationPct: number | null
  annualGrowthPct: number | null
  crudeBirthRate: number | null
  crudeDeathRate: number | null
  sexRatioFemalesPer1000Males: number | null
}

export interface StateRow {
  name: string
  category: string
  population2011: number | null
  decadalGrowthPct: number | null
  densityPerSqKm: number | null
}

export interface SexRatioRow {
  name: string
  population2011: number | null
  femalePct2011: number | null
  sexRatio: number | null
  annualGrowthPct: number | null
}

export interface WorkerRow {
  name: string
  totalPopulation: number | null
  mainWorkers: number | null
  mainWorkersPct2001: number | null
  mainWorkersPct2011: number | null
  maleWorkersPct2011: number | null
  femaleWorkersPct2011: number | null
}

const num = (v: unknown): number | null => {
  if (v == null) return null
  const n = Number(String(v).trim())
  return Number.isFinite(n) ? n : null
}

export interface CensusResponse {
  source: 'live' | 'snapshot'
  fetchedAt: string
  asOf: string
  summary: {
    population2011: number | null
    indiaNCr: number | null // crore
    decadalGrowthPct: number | null
    densityPerSqKm: number | null
    sexRatio2011: number | null
    literacyApproxNote?: never
    largestState: string | null
    densestState: string | null
  }
  series: CensusSeriesPoint[]
  states: StateRow[]
  sexRatio: SexRatioRow[]
  workers: WorkerRow[]
}

const isAggregate = (n: string) => /^(india|all india)$/i.test(n.trim())

export function topStates(states: StateRow[], n = 10): StateRow[] {
  return [...states].filter((s) => s.population2011 != null && !isAggregate(s.name)).sort((a, b) => (b.population2011 ?? 0) - (a.population2011 ?? 0)).slice(0, n)
}

export function sexRatioBoard(rows: SexRatioRow[]): SexRatioRow[] {
  return [...rows].filter((s) => s.sexRatio != null && !isAggregate(s.name)).sort((a, b) => (a.sexRatio ?? 0) - (b.sexRatio ?? 0))
}

export function populationOfIndia(states: StateRow[]): number | null {
  const row = states.find((s) => isAggregate(s.name))
  return row?.population2011 ?? null
}

export function workersBottom(rows: WorkerRow[], n = 5): WorkerRow[] {
  return [...rows].filter((s) => s.mainWorkersPct2011 != null).sort((a, b) => (a.mainWorkersPct2011 ?? 0) - (b.mainWorkersPct2011 ?? 0)).slice(0, n)
}

export function workersTop(rows: WorkerRow[], n = 5): WorkerRow[] {
  return [...rows].filter((s) => s.mainWorkersPct2011 != null).sort((a, b) => (b.mainWorkersPct2011 ?? 0) - (a.mainWorkersPct2011 ?? 0)).slice(0, n)
}

export function largestState(states: StateRow[]): string | null {
  const [top] = topStates(states, 1)
  return top?.name ?? null
}

export function densestState(states: StateRow[]): string | null {
  const [top] = [...states].filter((s) => s.name !== 'India' && s.densityPerSqKm != null).sort((a, b) => (b.densityPerSqKm ?? 0) - (a.densityPerSqKm ?? 0))
  return top?.name ?? null
}

export { num as toNumber }
