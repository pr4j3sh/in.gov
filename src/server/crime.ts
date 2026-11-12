import { parseCrimeSnapshot, type CrimeParsed } from '@/lib/crime'
import crimeSnapshot from '@/lib/snapshots/crime.json'

export interface CrimeResponse extends CrimeParsed {
  source: 'archived'
  fetchedAt: string
  metroCount: number
}

let cache: CrimeResponse | null = null

export async function getCrimeData(): Promise<CrimeResponse> {
  if (cache) return cache
  const parsed = parseCrimeSnapshot(
    (crimeSnapshot as { raw: Parameters<typeof parseCrimeSnapshot>[0] }).raw,
  )
  cache = {
    ...parsed,
    source: 'archived',
    fetchedAt: new Date().toISOString(),
    metroCount: parsed.metros.length,
  }
  return cache
}
