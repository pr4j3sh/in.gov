/** Pure adapter for the health (FIC + RHS vacancies) archived prints. */

export interface FicStateRow { state: string; ficPct: number | null }
export interface FicYearRow { year: string; ficPct: number | null }
export interface VacancyRow {
  state: string
  doctors: number | null
  specialists: number | null
  labTechnicians: number | null
  radiographers: number | null
  pharmacists: number | null
  nurses: number | null
  mpw: number | null
  paramedical: number | null
}

export interface HealthResponse {
  source: 'live' | 'snapshot'
  fetchedAt: string
  asOf: string
  summary: {
    indiaFicPct: number | null
    ficTrend2019_24: number | null // 2023-24 minus 2019-20
    totalDoctorsVacant: number | null
    totalNursesVacant: number | null
    worstVacancyState: string | null
    statesCovered: number | null
  }
  ficByState: FicStateRow[]
  ficYearwise: FicYearRow[]
  vacancies: VacancyRow[]
}

export function worstStatesByFic(rows: FicStateRow[], n = 10): FicStateRow[] {
  return [...rows].filter((r) => r.state !== 'India' && r.ficPct != null).sort((a, b) => (a.ficPct ?? 0) - (b.ficPct ?? 0)).slice(0, n)
}

export function topStatesByFic(rows: FicStateRow[], n = 5): FicStateRow[] {
  return [...rows].filter((r) => r.state !== 'India' && r.ficPct != null).sort((a, b) => (b.ficPct ?? 0) - (a.ficPct ?? 0)).slice(0, n)
}

export function totalColumn(rows: VacancyRow[], col: keyof Omit<VacancyRow, 'state'>): number | null {
  const vals = rows.map((r) => r[col]).filter((v): v is number => v != null)
  if (vals.length === 0) return null
  return vals.reduce((a, b) => a + b, 0)
}

export function worstVacancyState(rows: VacancyRow[]): string | null {
  const scored = rows.map((r) => ({
    state: r.state,
    score: (r.doctors ?? 0) + (r.specialists ?? 0) + (r.nurses ?? 0) + (r.mpw ?? 0) + (r.paramedical ?? 0),
  })).sort((a, b) => b.score - a.score)
  return scored[0]?.state ?? null
}

export function sortVacanciesByTotal(rows: VacancyRow[]): VacancyRow[] {
  return [...rows].sort((a, b) => {
    const sa = (a.doctors ?? 0) + (a.nurses ?? 0) + (a.mpw ?? 0) + (a.specialists ?? 0)
    const sb = (b.doctors ?? 0) + (b.nurses ?? 0) + (b.mpw ?? 0) + (b.specialists ?? 0)
    return sb - sa
  })
}
