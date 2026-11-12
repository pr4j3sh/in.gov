import { describe, expect, it } from 'vitest'
import { yoy, coalLatest, type FreightRow, type CoalFreightRow } from './railways'

const freight: FreightRow[] = [
  { year: '2020-21', loadingMnt: 1233, revenueCrore: 117232 },
  { year: '2021-22', loadingMnt: 1418, revenueCrore: 141096 },
  { year: '2024-25', loadingMnt: 1617, revenueCrore: 171163 },
]
const coal: CoalFreightRow[] = [
  { year: '2020-21', revenueCrore: 49578.45 },
  { year: '2021-22', revenueCrore: 60436.15 },
]

describe('railways adapters', () => {
  it('yoy computes last-vs-previous loading and revenue', () => {
    expect(yoy(freight, 'loadingMnt')).toBeCloseTo(((1617 - 1418) / 1418) * 100, 0)
    expect(yoy(freight, 'revenueCrore')).toBeCloseTo(((171163 - 141096) / 141096) * 100, 0)
  })
  it('coalLatest returns the newest coal revenue', () => {
    expect(coalLatest(coal)).toBeCloseTo(60436.15, 2)
  })
})
