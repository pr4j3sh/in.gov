import { describe, expect, it } from 'vitest'
import {
  byCommodity,
  byState,
  focusCommodity,
  marketSpread,
  normalizeRecords,
  parseArrivalDate,
  summarize,
} from './mandi'

describe('parseArrivalDate', () => {
  it('parses DD/MM/YYYY into ISO', () => {
    expect(parseArrivalDate('12/11/2026')).toBe('2026-11-12')
    expect(parseArrivalDate('05-08-2025')).toBe('2025-08-05')
  })
  it('rejects garbage', () => {
    expect(parseArrivalDate('2026-11-12')).toBe('')
    expect(parseArrivalDate('32/13/2026')).toBe('')
    expect(parseArrivalDate('')).toBe('')
    expect(parseArrivalDate(undefined)).toBe('')
  })
})

describe('normalizeRecords', () => {
  it('coerces prices from strings and trims fields', () => {
    const [r] = normalizeRecords([
      {
        state: ' Odisha ',
        market: 'Baripada  APMC',
        commodity: 'Pumpkin',
        arrival_date: '12/11/2026',
        min_price: '1,000',
        max_price: 1500,
        modal_price: '1300',
      },
    ])
    expect(r).toMatchObject({
      state: 'Odisha',
      market: 'Baripada APMC',
      minPrice: 1000,
      maxPrice: 1500,
      modalPrice: 1300,
      arrivalDate: '2026-11-12',
    })
  })

  it('drops records with no state, commodity or modal price', () => {
    expect(
      normalizeRecords([
        { state: '', commodity: 'Onion', modal_price: 100 },
        { state: 'Odisha', commodity: '', modal_price: 100 },
        { state: 'Odisha', commodity: 'Onion', modal_price: 0 },
      ]),
    ).toHaveLength(0)
  })
})

const FIXTURE = normalizeRecords([
  { state: 'A', market: 'M1', commodity: 'Onion', arrival_date: '12/11/2026', min_price: 100, max_price: 200, modal_price: 150 },
  { state: 'A', market: 'M2', commodity: 'Onion', arrival_date: '12/11/2026', min_price: 120, max_price: 260, modal_price: 180 },
  { state: 'A', market: 'M1', commodity: 'Potato', arrival_date: '12/11/2026', min_price: 50, max_price: 90, modal_price: 70 },
  { state: 'B', market: 'M3', commodity: 'Onion', arrival_date: '12/11/2026', min_price: 200, max_price: 400, modal_price: 300 },
  { state: 'B', market: 'M4', commodity: 'Tomato', arrival_date: '12/11/2026', min_price: 900, max_price: 1500, modal_price: 1200 },
])

describe('aggregations', () => {
  it('summarize counts distinct markets/commodities/states', () => {
    expect(summarize(FIXTURE)).toEqual({ totalRecords: 5, markets: 4, commodities: 3, states: 2 })
  })

  it('byCommodity ranks by market coverage and respects state filter', () => {
    const all = byCommodity(FIXTURE)
    expect(all[0].commodity).toBe('Onion')
    expect(all[0].markets).toBe(3)
    expect(all[0].avgModal).toBe(210) // (150+180+300)/3
    const scoped = byCommodity(FIXTURE, 'A')
    expect(scoped.map((r) => r.commodity)).toEqual(['Onion', 'Potato'])
    expect(scoped[0].markets).toBe(2)
  })

  it('byState averages modal price for a commodity', () => {
    const rows = byState(FIXTURE, 'Onion')
    expect(rows.find((r) => r.state === 'A')?.avgModal).toBe(165)
    expect(rows.find((r) => r.state === 'B')?.avgModal).toBe(300)
  })

  it('marketSpread surfaces widest max-min markets first', () => {
    const rows = marketSpread(FIXTURE, 'Onion')
    expect(rows[0].market).toBe('M3') // spread 200
    expect(rows[0].spread).toBe(200)
  })

  it('focusCommodity picks the most-covered commodity', () => {
    expect(focusCommodity(FIXTURE)).toBe('Onion')
    expect(focusCommodity(FIXTURE, 'B')).toBe('Onion')
  })
})
