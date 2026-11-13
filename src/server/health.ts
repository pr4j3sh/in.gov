import {
  totalColumn,
  worstVacancyState,
  sortVacanciesByTotal,
  type HealthResponse,
  type FicStateRow,
  type FicYearRow,
  type VacancyRow,
} from '@/lib/health'
import healthSnapshot from '@/lib/snapshots/health.json'
import { fetchOgdRecords, ttlCache, ogdNum as num, ogdStr as str } from '@/server/ogd'

const RES = {
  ficByState: '808b9b9c-8720-4fe8-8d52-7de613f2c5a3',
  ficYearwise: 'aee4a2c3-a126-4e80-b151-6274d514ee1d',
  vacancies: '782c19ad-5833-4745-95b2-31656af47bed',
} as const
const LIVE_TTL_MS = 6 * 60 * 60 * 1000
const liveCache = ttlCache<HealthResponse>(LIVE_TTL_MS)


function parseFicByState(records: Record<string, unknown>[]): FicStateRow[] {
  return records.map((r) => ({ state: str(r.state_ut), ficPct: num(r._2023_24) })).filter((r) => r.state)
}
function parseFicYearwise(records: Record<string, unknown>[]): FicYearRow[] {
  return records.map((r) => ({ year: str(r._year), ficPct: num(r.india_) })).filter((r) => r.year)
}
function parseVacancies(records: Record<string, unknown>[]): VacancyRow[] {
  return records.map((r) => ({
    state: str(r.state_ut),
    doctors: num(r.doctors__dh_and_below_),
    specialists: num(r.specialist___physician__chc_),
    labTechnicians: num(r.lab_technicians__chc_and_below_),
    radiographers: num(r.radiographer__chc_),
    pharmacists: num(r.pharmacists__chc_and_below_),
    nurses: num(r.staff_nurses__chc_and_below_),
    mpw: num(r.mpw__m___f__at_phc_and_below),
    paramedical: num(r.paramedical_staff__dh_and_sdh_),
  })).filter((r) => r.state)
}

function buildResponse(source: HealthResponse['source'], ficByState: FicStateRow[], ficYearwise: FicYearRow[], vacancies: VacancyRow[]): HealthResponse {
  const india = ficByState.find((r) => /^india$/i.test(r.state))
  const trend = ficYearwise.length >= 2
    ? Math.round(((ficYearwise[ficYearwise.length - 1].ficPct ?? 0) - (ficYearwise[0].ficPct ?? 0)) * 10) / 10
    : null
  return {
    source,
    fetchedAt: new Date().toISOString(),
    asOf: '2023-24',
    summary: {
      indiaFicPct: india?.ficPct ?? null,
      ficTrend2019_24: trend,
      totalDoctorsVacant: totalColumn(vacancies, 'doctors'),
      totalNursesVacant: totalColumn(vacancies, 'nurses'),
      worstVacancyState: worstVacancyState(vacancies),
      statesCovered: vacancies.length,
    },
    ficByState,
    ficYearwise,
    vacancies: sortVacanciesByTotal(vacancies),
  }
}

type SnapshotShape = { ficByState: FicStateRow[]; ficYearwise: FicYearRow[]; vacancies: VacancyRow[] }

export async function getHealthData(): Promise<HealthResponse> {
  const apiKey = process.env.DATA_GOV_IN_API_KEY?.trim()
  const cached = liveCache.get()
  if (cached) return cached
  if (apiKey) {
    try {
      const [ficRaw, ficYearsRaw, vacRaw] = await Promise.all([
        fetchOgdRecords(apiKey, RES.ficByState),
        fetchOgdRecords(apiKey, RES.ficYearwise),
        fetchOgdRecords(apiKey, RES.vacancies),
      ])
      const ficByState = parseFicByState(ficRaw)
      const ficYearwise = parseFicYearwise(ficYearsRaw)
      const vacancies = parseVacancies(vacRaw)
      if (ficByState.length && ficYearwise.length && vacancies.length) {
        const resp = buildResponse('live', ficByState, ficYearwise, vacancies)
        liveCache.set(resp)
        return resp
      }
      throw new Error('incomplete live payload')
    } catch (err) {
      console.error('[health] live fetch failed, falling back to snapshot:', err instanceof Error ? err.message : err)
    }
  }
  const s = healthSnapshot as unknown as SnapshotShape
  return buildResponse('snapshot', s.ficByState, s.ficYearwise, s.vacancies)
}
