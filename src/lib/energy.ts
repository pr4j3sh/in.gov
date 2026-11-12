/** Pure adapter for the energy (URJA) PIB-reply prints. */

export interface MixRow { source: string; fy2023: number | null; fy2024: number | null; fy2025: number | null }
export interface NuclearRow { year: string; generationMU: number | null }
export interface SolarRow { state: string; generationGWh: number | null }

export interface EnergyResponse {
  source: 'live' | 'snapshot'
  fetchedAt: string
  asOf: string
  summary: {
    totalGenerationFy25: number | null
    yoyTotalPct: number | null
    nonFossilShareFy25: number | null
    nonFossilShareDelta: number | null
    nuclearLatestMU: number | null
    solarFy23TotalGWh: number | null
  }
  mix: MixRow[]
  nuclear: NuclearRow[]
  solar: SolarRow[]
}

const num = (v: unknown): number | null => {
  if (v == null) return null
  const n = Number(String(v).trim().replace(/,/g, ''))
  return Number.isFinite(n) ? n : null
}

export function nonFossilShare(mix: MixRow[], fy: 'fy2023' | 'fy2024' | 'fy2025'): number | null {
  const nonFossil = mix.find((m) => /non-fossil/i.test(m.source))
  const total = mix.find((m) => /total/i.test(m.source))
  if (!nonFossil?.[fy] || !total?.[fy] || total[fy] === 0) return null
  return Math.round((nonFossil[fy]! / total[fy]!) * 1000) / 10
}

export function yoyShareDelta(mix: MixRow[]): number | null {
  const s24 = nonFossilShare(mix, 'fy2024')
  const s25 = nonFossilShare(mix, 'fy2025')
  if (s24 == null || s25 == null) return null
  return Math.round((s25 - s24) * 10) / 10
}

export function totalYoY(mix: MixRow[]): number | null {
  const total = mix.find((m) => /total/i.test(m.source))
  if (!total?.fy2024 || !total?.fy2025 || total.fy2024 === 0) return null
  return Math.round(((total.fy2025 - total.fy2024) / total.fy2024) * 1000) / 10
}

export function solarTotal(solar: SolarRow[]): number | null {
  const vals = solar.map((s) => s.generationGWh).filter((v): v is number => v != null)
  if (vals.length === 0) return null
  return Math.round(vals.reduce((a, b) => a + b, 0) * 10) / 10
}

export function topSolar(solar: SolarRow[], n = 15): SolarRow[] {
  return [...solar].sort((a, b) => (b.generationGWh ?? 0) - (a.generationGWh ?? 0)).slice(0, n).reverse()
}
