import { describe, expect, it } from 'vitest'
import { worstStatesByFic, topStatesByFic, totalColumn, worstVacancyState, sortVacanciesByTotal, type FicStateRow, type VacancyRow } from './health'

const fic: FicStateRow[] = [
  { state: 'India', ficPct: 93.5 },
  { state: 'Andaman and Nicobar Islands', ficPct: 79.79 },
  { state: 'Arunachal Pradesh', ficPct: 79.41 },
  { state: 'Andhra Pradesh', ficPct: 101.26 },
  { state: 'Punjab', ficPct: 99.1 },
]
const vac: VacancyRow[] = [
  { state: 'Bihar', doctors: 3321, specialists: 199, labTechnicians: 3362, radiographers: null, pharmacists: 3113, nurses: 11230, mpw: 29560, paramedical: 8532 },
  { state: 'Assam', doctors: 427, specialists: 28, labTechnicians: 141, radiographers: 16, pharmacists: 62, nurses: 486, mpw: 741, paramedical: null },
  { state: 'Arunachal Pradesh', doctors: 0, specialists: 0, labTechnicians: 5, radiographers: 0, pharmacists: 0, nurses: 0, mpw: 0, paramedical: 0 },
]

describe('fic aggregates', () => {
  it('worstStatesByFic excludes India and sorts ascending', () => {
    expect(worstStatesByFic(fic, 2).map((r) => r.state)).toEqual(['Arunachal Pradesh', 'Andaman and Nicobar Islands'])
  })
  it('topStatesByFic excludes India and sorts descending', () => {
    expect(topStatesByFic(fic, 2).map((r) => r.state)).toEqual(['Andhra Pradesh', 'Punjab'])
  })
})
describe('vacancy aggregates', () => {
  it('totalColumn sums numeric column, null-aware', () => {
    expect(totalColumn(vac, 'doctors')).toBe(3748)
    expect(totalColumn([vac[2]], 'paramedical')).toBe(0)
  })
  it('worstVacancyState picks the biggest composite gap', () => {
    expect(worstVacancyState(vac)).toBe('Bihar')
  })
  it('sortVacanciesByTotal orders by doctors+nurses+mpw+specialists', () => {
    expect(sortVacanciesByTotal(vac).map((r) => r.state)).toEqual(['Bihar', 'Assam', 'Arunachal Pradesh'])
  })
})
