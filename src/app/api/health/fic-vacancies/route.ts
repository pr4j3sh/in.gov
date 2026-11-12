import { NextResponse } from 'next/server'
import { getHealthData } from '@/server/health'

export const maxDuration = 60

export async function GET() {
  try {
    const data = await getHealthData()
    return NextResponse.json(data, {
      headers: {
        'x-data-source': data.source,
        'cache-control': 'public, s-maxage=21600, stale-while-revalidate=86400',
      },
    })
  } catch (err) {
    console.error('[api/health/fic-vacancies] error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Failed to load health data' }, { status: 502 })
  }
}
