import { describe, expect, it } from 'vitest'
import { topStates, sexRatioBoard, workersBottom, workersTop, largestState, densestState, type StateRow, type SexRatioRow, type WorkerRow } from './census'

const states: StateRow[] = [
  { name: 'India', category: 'India', population2011: 1210854977, decadalGrowthPct: 17.7, densityPerSqKm: 368 },
  { name: 'Uttar Pradesh', category: 'State', population2011: 199812341, decadalGrowthPct: 20.1, densityPerSqKm: 829 },
  { name: 'Bihar', category: 'State', population2011: 104099452, decadalGrowthPct: 25.1, densityPerSqKm: 1106 },
  { name: 'Maharashtra', category: 'State', population2011: 112372972, decadalGrowthPct: 15.9, densityPerSqKm: 365 },
]

const sex: SexRatioRow[] = [
  { name: 'Kerala', population2011: 33406061, femalePct2011: 51.7, sexRatio: 1084, annualGrowthPct: 0.9 },
  { name: 'Haryana', population2011: 25351308, femalePct2011: 43.8, sexRatio: 775, annualGrowthPct: 1.4 },
  { name: 'India', population2011: 1210854977, femalePct2011: 48.5, sexRatio: 943, annualGrowthPct: 1.63 },
]

const workers: WorkerRow[] = [
  { name: 'Himachal Pradesh', totalPopulation: 6864602, mainWorkers: 3000793, mainWorkersPct2001: 48.2, mainWorkersPct2011: 43.7, maleWorkersPct2011: 57.2, femaleWorkersPct2011: 29.5 },
  { name: 'Bihar', totalPopulation: 104099452, mainWorkers: 21359611, mainWorkersPct2001: 25.37, mainWorkersPct2011: 20.5, maleWorkersPct2011: 31.8, femaleWorkersPct2011: 8.2 },
  { name: 'Goa', totalPopulation: 1458545, mainWorkers: 525621, mainWorkersPct2001: 36, mainWorkersPct2011: 36, maleWorkersPct2011: 50.1, femaleWorkersPct2011: 21.8 },
]

describe('census aggregates', () => {
  it('topStates returns largest N by population, excluding nulls', () => {
    expect(topStates(states, 2).map((s) => s.name)).toEqual(['Uttar Pradesh', 'Maharashtra'])
  })
  it('sexRatioBoard sorts ascending (worst first)', () => {
    expect(sexRatioBoard(sex).map((s) => s.name)).toEqual(['Haryana', 'Kerala'])
  })
  it('workersTop/workersBottom pick by mainWorkersPct2011', () => {
    expect(workersTop(workers, 1)[0].name).toBe('Himachal Pradesh')
    expect(workersBottom(workers, 1)[0].name).toBe('Bihar')
  })
  it('largestState ignores India; densestState picks max density', () => {
    expect(largestState(states)).toBe('Uttar Pradesh')
    expect(densestState(states)).toBe('Bihar')
  })
})
