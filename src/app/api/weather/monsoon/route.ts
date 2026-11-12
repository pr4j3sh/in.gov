import { NextResponse } from 'next/server'
import { getWeatherData } from '@/server/weather'

export const maxDuration = 60

export async function GET() {
  try {
    const data = await getWeatherData()
    return NextResponse.json(data, {
      headers: {
        'x-data-source': data.source,
        'cache-control': 'public, s-maxage=21600, stale-while-revalidate=86400',
      },
    })
  } catch (err) {
    console.error('[api/weather/monsoon] error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Failed to load weather data' }, { status: 502 })
  }
}
