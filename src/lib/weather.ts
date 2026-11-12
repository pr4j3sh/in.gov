/** Pure adapter for the IMD/OGD archived rainfall series. */

export interface JjasPoint {
  year: number
  jun: number | null
  jul: number | null
  aug: number | null
  sep: number | null
  total: number | null
}

export interface CmzRow {
  year: number
  actual: number | null
  forecast: string
  remark: 'Accurate' | 'Inaccurate' | 'NA' | string
}

export interface HeavyRow {
  year: number
  heavy: number | null
  veryHeavy: number | null
  extreme: number | null
}

export interface NormalRow {
  subdivision: string
  jan: number | null; feb: number | null; mar: number | null; apr: number | null
  may: number | null; jun: number | null; jul: number | null; aug: number | null
  sep: number | null; oct: number | null; nov: number | null; dec: number | null
  annual: number | null; jjas: number | null; ond: number | null
}

export interface WeatherResponse {
  source: 'live' | 'snapshot'
  fetchedAt: string
  asOf: string
  summary: {
    latestAllIndiaJjas: number | null
    allIndiaAverage: number | null
    latestCmzYear: number | null
    latestCmzActual: number | null
    cmzAccurateCount: number
    cmzTotalIssued: number
    heavyTotal2022: number | null
  }
  jjasAllIndia: JjasPoint[]
  jjasNEIndia: JjasPoint[]
  cmz: CmzRow[]
  heavy: HeavyRow[]
  heavyAverage: { heavy: number | null; veryHeavy: number | null; extreme: number | null } | null
  normals: NormalRow[]
}

const num = (v: unknown): number | null => {
  if (v == null) return null
  const n = Number(String(v).trim())
  return Number.isFinite(n) ? n : null
}

export function parseTabJoinedJjas(line: string): JjasPoint | null {
  const parts = line.split('\t')
  if (parts.length < 6) return null
  const year = num(parts[0])
  if (!year) return null
  return {
    year,
    jun: num(parts[1]), jul: num(parts[2]), aug: num(parts[3]), sep: num(parts[4]),
    total: num(parts[5]),
  }
}

export function movingAverage(series: number[], window = 10): (number | null)[] {
  return series.map((_, i) => {
    if (i < window - 1) return null
    const slice = series.slice(i - window + 1, i + 1).filter((v): v is number => v != null)
    if (slice.length < window) return null
    return Math.round((slice.reduce((a, b) => a + b, 0) / slice.length) * 10) / 10
  })
}

export function cmzScorecard(rows: CmzRow[]): { correct: number; issued: number } {
  let correct = 0, issued = 0
  for (const r of rows) {
    if (!r.forecast || /not issued/i.test(r.forecast)) continue
    issued += 1
    if (r.remark.toLowerCase() === 'accurate') correct += 1
  }
  return { correct, issued }
}

/** Sort subdivision normals by JJAS rainfall descending (wettest first). */
export function normalsByJjas(rows: NormalRow[]): NormalRow[] {
  return [...rows].sort((a, b) => (b.jjas ?? 0) - (a.jjas ?? 0))
}

export function latestJjasTotal(points: JjasPoint[]): number | null {
  return points.length ? points[points.length - 1].total : null
}

export function averageJjas(points: JjasPoint[], fromYear?: number): number | null {
  const vals = points.filter((p) => fromYear == null || p.year >= fromYear).map((p) => p.total).filter((v): v is number => v != null)
  if (vals.length === 0) return null
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10
}
