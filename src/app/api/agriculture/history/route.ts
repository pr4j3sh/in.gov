import path from 'node:path'
import { NextResponse } from 'next/server'
import { readFileSync, existsSync, statSync } from 'node:fs'

export const maxDuration = 60

const MAX_BYTES = 1024 * 1024 // 1 MB cap — file accumulates via scripts/accumulate-mandi.mjs
const MAX_ENTRIES = 20000

interface HistoryEntry {
  date?: unknown
  [key: string]: unknown
}

export async function GET() {
  const file = path.join(process.cwd(), 'data', 'mandi-history.jsonl')
  if (!existsSync(file)) {
    return NextResponse.json({ entries: [], count: 0 })
  }
  try {
    if (statSync(file).size > MAX_BYTES) {
      console.error('[api/agriculture/history] file exceeds 1MB cap; refusing to serve unbounded payload')
      return NextResponse.json({ error: 'History too large' }, { status: 413 })
    }
    const raw = readFileSync(file, 'utf8')
    const entries: HistoryEntry[] = []
    for (const line of raw.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed) continue
      try {
        const parsed: unknown = JSON.parse(trimmed)
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          entries.push(parsed as HistoryEntry)
        }
      } catch {
        // skip corrupt lines rather than fail the whole feed
      }
      if (entries.length >= MAX_ENTRIES) break
    }
    return NextResponse.json({ entries, count: entries.length }, {
      headers: { 'cache-control': 'no-store' },
    })
  } catch (err) {
    console.error('[api/agriculture/history] error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Failed to read history' }, { status: 500 })
  }
}
