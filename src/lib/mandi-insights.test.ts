import { describe, expect, it } from 'vitest'
import {
  placeholderStats,
  arbitrageSpread,
  outliers,
  topMarkets,
  thresholdAlerts,
  coverageByState,
} from './mandi-insights'
import type { MandiRecord } from './types'

const r = (state: string, market: string, commodity: string, price: number): MandiRecord => ({
  state, market, commodity,
  district: 'X', variety: 'Y', grade: 'Z',
  arrivalDate: '2026-11-12',
  minPrice: price,
  maxPrice: price,
  modalPrice: price,
})

describe('placeholderStats', () => {
  it('flags rows at or below 5 paise', () => {
    const rows = [r('A', 'M1', 'X', 0.01), r('A', 'M2', 'X', 2500), r('B', 'M1', 'X', 0.02)]
    const s = placeholderStats(rows)
    expect(s.placeholderRows).toBe(2)
    expect(s.severity).toBe('low')
    expect(s.affectedMarkets).toContain('M1')
  })
  it('reports clean when no placeholder rows', () => {
    expect(placeholderStats([r('A', 'M1', 'X', 2500)]).severity).toBe('clean')
  })
})

describe('arbitrageSpread', () => {
  it('returns national/north/south medians for configured commodities', () => {
    const rows = [
      r('Punjab', 'F', 'Tomato', 1000), r('Punjab', 'F2', 'Tomato', 1000), r('Punjab', 'F3', 'Tomato', 2000),
      r('Tamil Nadu', 'S', 'Tomato', 5000), r('Kerala', 'S', 'Tomato', 6000), r('Tamil Nadu', 'S', 'Tomato', 7000),
      r('Uttar Pradesh', 'N', 'Tomato', 800), r('Rajasthan', 'N', 'Tomato', 1200),
    ]
    const o = arbitrageSpread(rows, ['Tomato'])[0]
    expect(o.commodity).toBe('Tomato')
    expect(o.nationalMedian).toBeGreaterThan(0)
    expect(o.northMedian).toBeLessThan(o.southMedian)
    expect(o.southCheaper).toBe(false)
  })
})

describe('outliers', () => {
  const commodityPrices = Array.from({ length: 30 }, () => r('A', 'M1', 'X', 100))
  it('flags 5x+ commodity rows', () => {
    const rows = [...commodityPrices, r('A', 'M2', 'X', 10000)]
    const o = outliers(rows, 5, 5)
    expect(o.length).toBe(1)
    expect(o[0].modalPrice).toBe(10000)
  })
})

describe('topMarkets', () => {
  it('returns top-N markets for a commodity with relative spread', () => {
    const rows = [
      ...Array.from({ length: 15 }, () => r('A', 'M1', 'Tomato', 1500)),
      ...Array.from({ length: 5 }, () => r('A', 'M2', 'Tomato', 9000)),
      r('A', 'M3', 'Tomato', 3000),
    ]
    const t = topMarkets(rows, 'Tomato', 3)
    expect(t.rows[0].market).toBe('M2')
    expect(t.commodityMedian).toBeGreaterThan(0)
  })
})

describe('thresholdAlerts', () => {
  it('alerts Tomato above 5000', () => {
    const rows = [
      ...Array.from({ length: 8 }, () => r('A', 'M', 'Tomato', 6000)),
      r('B', 'N', 'Tomato', 3000),
    ]
    const a = thresholdAlerts(rows).find((x) => x.commodity === 'Tomato')
    expect(a).toBeDefined()
    expect(a!.marketsAbove).toBe(8)
    expect(a!.pctAbove).toBeCloseTo((8 / 9) * 100, 0)
  })
})

describe('coverageByState', () => {
  it('computes quotes per million for known states', () => {
    const rows = Array.from({ length: 100 }, () => r('Uttar Pradesh', 'M', 'X', 100))
    const c = coverageByState(rows).find((x) => x.state === 'Uttar Pradesh')
    expect(c).toBeDefined()
    expect(c!.quotes).toBe(100)
    expect(c!.quotesPerMillion).toBeCloseTo(100 / 199.8, 1)
  })
})
