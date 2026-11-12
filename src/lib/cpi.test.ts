import { describe, expect, it } from 'vitest'
import {
  ledgerRows,
  monthLabel,
  normalizeCpiRecords,
  pressureByGroup,
  sectorSeries,
  yoySeries,
} from './cpi'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

/** Build synthetic records with a given (year, month) and general index. */
const point = (sector: string, year: number, monthIdx: number, general: string | number) => ({
  sector,
  year: String(year),
  month: MONTHS[monthIdx],
  general_index: general,
})

describe('normalizeCpiRecords', () => {
  it('keeps one row per (sector, year, month) and sorts ascending per sector', () => {
    const rows = normalizeCpiRecords([
      point('Rural', 2023, 11, 185),
      point('Rural', 2023, 11, 185), // duplicate
      point('Rural', 2023, 10, 180),
      point('Urban', 2023, 0, 100),
    ])
    expect(rows).toHaveLength(3)
    expect(rows.filter((p) => p.sector === 'Rural').map((p) => p.year * 100 + p.month)).toEqual([202311, 202312])
  })

  it('coerces numeric strings, maps NA to null, drops rows without keys', () => {
    const rows = normalizeCpiRecords([
      point('Rural', 2020, 0, 'NA'),
      point('Rural', 2020, 1, '107.5'),
      { sector: '', year: '2020', month: 'January', general_index: 100 },
      { sector: 'Rural', year: '2020', month: 'Smarch', general_index: 100 },
    ])
    expect(rows).toHaveLength(2)
    expect(rows[0].values.general_index).toBeUndefined()
    expect(rows[1].values.general_index).toBe(107.5)
  })
})

describe('yoySeries', () => {
  it('computes YoY against the entry 12 positions earlier', () => {
    const series = [100, 110, 120, 130, 140, 150, 160, 170, 180, 190, 200, 210, 220, 231]
    const yoy = yoySeries(series)
    expect(yoy.slice(0, 12)).toEqual(Array(12).fill(null))
    expect(yoy[12]).toBeCloseTo(((220 - 100) / 100) * 100, 5) // 220 vs series[0]
    expect(yoy[13]).toBeCloseTo(((231 - 110) / 110) * 100, 1)
  })

  it('returns null when the base is missing or zero', () => {
    expect(yoySeries([null, null, null, null, null, null, null, null, null, null, null, null, 100])[12]).toBeNull()
  })
})

describe('sectorSeries / pressureByGroup / ledgerRows', () => {
  // 13 months for Rural: general 100 → 113 over 12 months (+13% YoY)
  const rows = Array.from({ length: 13 }, (_, i) => {
    const month = i
    const year = 2023 + Math.floor(month / 12)
    return { ...point('Rural', year, month % 12, String(100 + i)), food_and_beverages: String(110 + i) }
  })
  const points = normalizeCpiRecords(rows)

  it('sectorSeries returns ascending points and aligned yoy array', () => {
    const s = sectorSeries(points, 'Rural')
    expect(s.points).toHaveLength(13)
    expect(s.general[12]).toBe(112)
    expect(s.yoy[12]).toBeCloseTo(12, 5)
  })

  it('pressureByGroup computes YoY per group for the latest month', () => {
    const p = pressureByGroup(points, 'Rural')
    const food = p.find((r) => r.group === 'food_and_beverages')!
    expect(food.latest).toBe(122)
    expect(food.yearAgo).toBe(110)
    expect(food.yoy).toBeCloseTo(10.9, 1)
  })

  it('ledgerRows returns newest-first rows with YoY', () => {
    const rows2 = ledgerRows(points, 'Rural', 5)
    expect(rows2).toHaveLength(5)
    expect(rows2[0].label).toBe('Jan 24')
    expect(rows2[0].yoy).toBeCloseTo(12, 5)
    expect(rows2.at(-1)!.label).toBe('Sep 23')
  })

  it('monthLabel formats short label', () => {
    expect(monthLabel({ year: 2024, month: 2 })).toBe('Feb 24')
  })
})
