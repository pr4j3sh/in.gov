import { describe, expect, it } from 'vitest'
import { averageJjas, cmzScorecard, movingAverage, normalsByJjas, parseTabJoinedJjas } from './weather'

describe('parseTabJoinedJjas', () => {
  it('parses OGD tab-separated lines', () => {
    expect(parseTabJoinedJjas('2019\t112.1\t192.8\t293.9\t239.4\t838.2')).toEqual({
      year: 2019, jun: 112.1, jul: 192.8, aug: 293.9, sep: 239.4, total: 838.2,
    })
  })
  it('returns null on malformed lines', () => {
    expect(parseTabJoinedJjas('2019\t100\t200\t300')).toBeNull()
    expect(parseTabJoinedJjas('')).toBeNull()
  })
})

describe('movingAverage', () => {
  it('computes a 10-year rolling mean with leading nulls', () => {
    const series = Array.from({ length: 15 }, (_, i) => 100 + i) // 100..114
    const ma = movingAverage(series, 10)
    expect(ma.slice(0, 9)).toEqual(Array(9).fill(null))
    expect(ma[9]).toBeCloseTo(104.5, 5) // mean(100..109) = 104.5
    expect(ma[14]).toBeCloseTo(109.5, 5)
  })
})

describe('cmzScorecard', () => {
  it('counts only issued forecasts and accurate calls', () => {
    const { correct, issued } = cmzScorecard([
      { year: 2020, actual: null, forecast: 'Forecast Not Issued', remark: 'NA' },
      { year: 2021, actual: 107, forecast: 'Above Normal (>106% of LPA)', remark: 'Accurate' },
      { year: 2022, actual: 121, forecast: 'Above Normal (>106% of LPA)', remark: 'Accurate' },
      { year: 2023, actual: 101, forecast: 'Normal (94-106% of LPA)', remark: 'Accurate' },
      { year: 2024, actual: 122, forecast: 'Above Normal (>106% of LPA)', remark: 'Accurate' },
    ])
    expect(issued).toBe(4)
    expect(correct).toBe(4)
  })
  it('marks inaccurate calls correctly', () => {
    const { correct, issued } = cmzScorecard([
      { year: 2021, actual: 90, forecast: 'Normal', remark: 'Inaccurate' },
    ])
    expect(issued).toBe(1)
    expect(correct).toBe(0)
  })
})

describe('normalsByJjas', () => {
  it('sorts subdivisions wettest-first', () => {
    const sorted = normalsByJjas([
      { subdivision: 'A', jan: 1, feb: 1, mar: 1, apr: 1, may: 1, jun: 1, jul: 1, aug: 1, sep: 1, oct: 1, nov: 1, dec: 1, annual: 100, jjas: 50, ond: 10 },
      { subdivision: 'B', jan: 1, feb: 1, mar: 1, apr: 1, may: 1, jun: 1, jul: 1, aug: 1, sep: 1, oct: 1, nov: 1, dec: 1, annual: 200, jjas: 400, ond: 10 },
      { subdivision: 'C', jan: 1, feb: 1, mar: 1, apr: 1, may: 1, jun: 1, jul: 1, aug: 1, sep: 1, oct: 1, nov: 1, dec: 1, annual: 150, jjas: 150, ond: 10 },
    ])
    expect(sorted.map((r) => r.subdivision)).toEqual(['B', 'C', 'A'])
  })
})

describe('averageJjas', () => {
  it('averages totals from a start year', () => {
    const series = [
      { year: 2000, jun: 1, jul: 1, aug: 1, sep: 1, total: 700 },
      { year: 2001, jun: 1, jul: 1, aug: 1, sep: 1, total: 800 },
      { year: 2002, jun: 1, jul: 1, aug: 1, sep: 1, total: 900 },
    ]
    expect(averageJjas(series, 2000)).toBe(800)
    expect(averageJjas(series, 2001)).toBe(850)
  })
})
