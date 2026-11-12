import { describe, expect, it } from 'vitest'
import { nonFossilShare, totalYoY, yoyShareDelta, topSolar, solarTotal, type MixRow, type SolarRow } from './energy'

const mix: MixRow[] = [
  { source: 'Thermal Generation (including Coal) in BUs', fy2023: 1206.2, fy2024: 1326.5, fy2025: 1363.9 },
  { source: 'Non-Fossil Generation in BUs', fy2023: 418.3, fy2024: 412.5, fy2025: 465.8 },
  { source: 'Total Generation in BUs', fy2023: 1624.5, fy2024: 1739.0, fy2025: 1829.7 },
]
const solar: SolarRow[] = [
  { state: 'Rajasthan', generationGWh: 34474.43 },
  { state: 'Uttar Pradesh', generationGWh: 3674.02 },
  { state: 'Punjab', generationGWh: 2778.66 },
  { state: 'No Data', generationGWh: null },
]

describe('energy adapters', () => {
  it('nonFossilShare computes FY25 share', () => {
    expect(nonFossilShare(mix, 'fy2025')).toBeCloseTo(25.5, 1)
    expect(nonFossilShare(mix, 'fy2024')).toBeCloseTo(23.7, 1)
    expect(nonFossilShare(mix, 'fy2023')).toBeCloseTo(25.7, 1)
  })
  it('totalYoY computes FY25 growth', () => {
    expect(totalYoY(mix)).toBeCloseTo(5.2, 1)
  })
  it('yoyShareDelta is FY25 minus FY24 share', () => {
    expect(yoyShareDelta(mix)).toBeCloseTo(1.8, 1)
  })
  it('topSolar returns top N ascending sorted', () => {
    expect(topSolar(solar, 2).map((s) => s.state)).toEqual(['Uttar Pradesh', 'Rajasthan'])
  })
  it('solarTotal sums valid values', () => {
    expect(solarTotal(solar)).toBeCloseTo(40927.11, 1)
  })
})
