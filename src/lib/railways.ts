/** Pure adapter for the railways freight + trains + coal PIB prints. */

export interface FreightRow { year: string; loadingMnt: number | null; revenueCrore: number | null }
export interface TrainTypeRow { year: string; mailExpress: number | null; ordinary: number | null; goods: number | null }
export interface CoalFreightRow { year: string; revenueCrore: number | null }

export interface RailwaysResponse {
  source: 'live' | 'snapshot'
  fetchedAt: string
  asOf: string
  summary: {
    latestLoadingMnt: number | null
    latestRevenueCrore: number | null
    yoyLoadingPct: number | null
    yoyRevenuePct: number | null
    coalRevenue2021_22: number | null
  }
  freight: FreightRow[]
  trains: TrainTypeRow[]
  coal: CoalFreightRow[]
}

export function yoy(rows: FreightRow[], col: 'loadingMnt' | 'revenueCrore'): number | null {
  if (rows.length < 2) return null
  const a = rows[rows.length - 2][col]
  const b = rows[rows.length - 1][col]
  if (a == null || b == null || a === 0) return null
  return Math.round(((b - a) / a) * 1000) / 10
}

export function coalLatest(rows: CoalFreightRow[]): number | null {
  return rows[rows.length - 1]?.revenueCrore ?? null
}
