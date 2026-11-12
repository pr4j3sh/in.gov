import { describe, expect, it } from 'vitest'
import { gstFullYears, latestGstGrowth, nonCorpShare, genderBudgetDelta, type GstRow, type DirectTaxRow, type GenderBudgetRow } from './finmin'

const gst: GstRow[] = [
  { year: '2017-18', amountCr: 678036, growthPct: null },
  { year: '2022-23', amountCr: 1679395, growthPct: 22 },
  { year: '2024-25', amountCr: 2055558, growthPct: 10 },
  { year: '2024-25 (Till December)', amountCr: 1519797, growthPct: 0 },
  { year: '2025-26 (Till December)', amountCr: 1650038, growthPct: 9 },
]
const directTax: DirectTaxRow[] = [
  { year: '2024-25', nonCorporateCr: 1235161, corporateCr: 986767, nonCorporateGrowthPct: 18.23, corporateGrowthPct: 8.31 },
]
const gender: GenderBudgetRow[] = [
  { year: '2021-22', amountCrore: 153326.28 },
  { year: '2024-25', amountCrore: 327158.44 },
]

describe('finmin adapters', () => {
  it('gstFullYears excludes partial years', () => {
    expect(gstFullYears(gst).map((r) => r.year)).toEqual(['2017-18', '2022-23', '2024-25'])
  })
  it('latestGstGrowth reads FY25 growth', () => {
    expect(latestGstGrowth(gst)).toBe(10)
  })
  it('nonCorpShare computes FY25 share', () => {
    expect(nonCorpShare(directTax)).toBeCloseTo(55.6, 0)
  })
  it('genderBudgetDelta computes growth FY22→FY25', () => {
    expect(genderBudgetDelta(gender)).toBeCloseTo(113.4, 0)
  })
})
