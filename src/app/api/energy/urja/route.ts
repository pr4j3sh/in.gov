import { NextResponse } from 'next/server'
import { getEnergyData } from '@/server/energy'

export const maxDuration = 60

export async function GET() {
  try {
    const data = await getEnergyData()
    return NextResponse.json(data, {
      headers: {
        'x-data-source': data.source,
        'cache-control': 'public, s-maxage=21600, stale-while-revalidate=86400',
      },
    })
  } catch (err) {
    console.error('[api/energy/urja] error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Failed to load energy data' }, { status: 502 })
  }
}
