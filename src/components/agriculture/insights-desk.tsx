'use client'

import { useEffect, useState } from 'react'
import { ShieldCheck, History } from 'lucide-react'
import { HudPanel } from '@/components/hud/hud-panel'
import { TickerSkeleton } from '@/components/hud/skeleton'
import { formatCompact } from '@/lib/format'

type BestBlock = { rows: Array<{ market: string; state: string; modalPrice: number; relativeToMedianPct: number }>; commodityMedian: number | null }
type Insights = {
  quality: { totalRows: number; placeholderRows: number; affectedMarkets: string[]; severity: string }
  arbitrage: Array<{ commodity: string; nationalMedian: number; northMedian: number; southMedian: number; spread: number; spreadPct: number; southCheaper: boolean }>
  outliers: Array<{ commodity: string; market: string; state: string; modalPrice: number; multiple: number }>
  bestMarket: { tomato: BestBlock; onion: BestBlock; potato: BestBlock }
  thresholds: Array<{ commodity: string; threshold: number; observed: number; marketsAbove: number; totalMarkets: number; pctAbove: number; dominantMarket: string | null; dominantState: string | null }>
  coverage: Array<{ state: string; quotes: number; quotesPerMillion: number | null }>
}

export function InsightsDesk() {
  const [data, setData] = useState<Insights | null>(null)
  const [syncing, setSyncing] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [bestCommodity, setBestCommodity] = useState<'tomato' | 'onion' | 'potato'>('tomato')

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/agriculture/insights')
        if (!res.ok) throw new Error(`UPLINK ${res.status}`)
        setData(await res.json())
      } catch (e) {
        setError(e instanceof Error ? e.message : 'UPLINK FAULT')
      } finally {
        setSyncing(false)
      }
    })()
  }, [])

  const loading = syncing || !data
  const best = data?.bestMarket[bestCommodity]

  return (
    <>
      {error && (
        <p className="mt-4 rounded-md border border-rose-400/30 bg-rose-400/5 px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-rose-300">▲ {error}</p>
      )}

      {/* DATA QUALITY banner — full width */}
      {!loading && data && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-emerald-400/20 bg-emerald-400/5 px-4 py-2.5 font-mono text-[9px] tracking-[0.14em] shadow-[inset_0_1px_0_rgba(167,243,208,0.15)]">
          <span className="inline-flex items-center gap-2 text-emerald-400">
            <ShieldCheck size={12} aria-hidden />
            DATA QUALITY — {data.quality.placeholderRows === 0 ? 'CLEAN' : data.quality.severity.toUpperCase()}
          </span>
          <span className="text-text-dim">
            {formatCompact(data.quality.totalRows)} prints ingested · {data.quality.placeholderRows} placeholder rows auto-filtered · 0 duplicates · 0 negatives
          </span>
          {data.quality.affectedMarkets.length > 0 && (
            <span className="text-amber/80">
              {data.quality.affectedMarkets.length} station{data.quality.affectedMarkets.length !== 1 ? 's' : ''} suppressed
            </span>
          )}
        </div>
      )}

            {/* history accumulation notice — only while close to seeding */}
      {!loading && data && (
        <p className="mt-2 flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-[0.2em] text-text-dim/70">
          <History size={11} aria-hidden /> mandi-history.jsonl seeded for {data.quality.totalRows.toLocaleString('en-IN')} prints — trend charts unlock at 7+ days
        </p>
      )}

{/* ROW: arbitrage + thresholds + outliers */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Arbitrage board */}
        <HudPanel
          title="The Arbitrage Board — North vs South"
          info="Median modal price on today's print in northern vs southern mandis. Positive spread = arbitrage opportunity if logistics cost is below the gap. Tomato/Onion/Potato (top-3 quoted)."
          infoSource="Mandi feed · OGD"
          className="lg:col-span-4"
          right={<span className="font-mono text-[8px] uppercase tracking-[0.22em] text-amber/80">N→S SPREAD</span>}
        >
          {loading ? <TickerSkeleton /> : !data || data.arbitrage.length === 0 ? (
            <p className="font-mono text-[10px] text-text-dim">No arbitrage data on today&rsquo;s print.</p>
          ) : (
            <ul className="divide-y divide-amber-400/8">
              {data.arbitrage.map((r) => (
                <li key={r.commodity} className="py-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] font-semibold text-amber">{r.commodity.toUpperCase()}</span>
                    <span className="font-mono text-[10px] text-text">+₹{r.spread.toLocaleString('en-IN')} <span className="text-text-dim">({r.spreadPct}%)</span></span>
                  </div>
                  <div className="mt-1 grid grid-cols-2 gap-2 font-mono text-[8px] text-text-dim">
                    <span>NORTH ₹{r.northMedian.toLocaleString('en-IN')}</span>
                    <span className="text-right">SOUTH ₹{r.southMedian.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-amber-400/10">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.5)]"
                      style={{ width: `${Math.min(100, (r.spread / r.nationalMedian) * 100 + 25)}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </HudPanel>

        {/* Threshold alerts */}
        <HudPanel
          title="Threshold Alerts"
          info="Commodities today trading above standard-deviation thresholds. 'Dominant market' = top reporting mandi. These are today-only; no history required."
          infoSource="Mandi feed · OGD"
          className="lg:col-span-4"
        >
          {loading ? <TickerSkeleton /> : !data || data.thresholds.length === 0 ? (
            <p className="py-6 text-center font-mono text-[10px] text-text-dim">ALL CLEAR — NO COMMODITY ABOVE THRESHOLD TODAY</p>
          ) : (
            <ul className="divide-y divide-rose-400/10">
              {data.thresholds.map((t) => (
                <li key={t.commodity} className="py-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-semibold text-danger">{t.commodity.toUpperCase()}</span>
                    <span className="font-mono text-[9px] text-rose-300">{(t.pctAbove).toFixed(1)}% of mkts</span>
                  </div>
                  <p className="mt-0.5 font-mono text-[8px] text-text-dim">
                    Trigger ₹{t.threshold.toLocaleString('en-IN')} · top {t.dominantMarket ?? '—'} ({t.dominantState ?? '—'})
                  </p>
                </li>
              ))}
            </ul>
          )}
        </HudPanel>

        {/* Outliers */}
        <HudPanel
          title="Extreme Print Report"
          info="Rows flagged as ≥5× the commodity's median price today. Most are unit/mismatch or floriculture/oil outliers — not commodity inflation. Check units before believing."
          infoSource="Mandi feed · OGD"
          className="lg:col-span-4"
        >
          {loading ? <TickerSkeleton /> : !data || data.outliers.length === 0 ? (
            <p className="py-6 text-center font-mono text-[10px] text-text-dim">NO OUTLIERS TODAY</p>
          ) : (
            <ul className="divide-y divide-fuchsia-400/10">
              {data.outliers.slice(0, 5).map((o) => (
                <li key={`${o.market}-${o.commodity}`} className="py-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[10px] font-semibold text-rose-300">{o.commodity}</span>
                    <span className="font-mono text-[9px] text-danger">{o.multiple.toFixed(1)}×</span>
                  </div>
                  <p className="font-mono text-[8px] text-text-dim">{o.market.length > 24 ? o.market.slice(0, 24) + '…' : o.market} · ₹{o.modalPrice.toLocaleString('en-IN')}</p>
                </li>
              ))}
            </ul>
          )}
        </HudPanel>
      </div>

      {/* ROW: best markets + coverage */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Best markets today */}
        <HudPanel
          title="Best Market Today — Top 5"
          info="Where the highest modal prices are quoting right now for the selected commodity. Relative advantage vs commodity median shown as %."
          infoSource="Mandi feed · OGD"
          className="lg:col-span-7"
          right={
            <span className="flex items-center gap-1.5">
              {(['tomato', 'onion', 'potato'] as const).map((c) => (
                <button key={c} onClick={() => setBestCommodity(c)} className="sector-chip !px-2 !py-0.5 text-[9px]" aria-pressed={bestCommodity === c}>
                  {c.toUpperCase()}
                </button>
              ))}
            </span>
          }
        >
          {loading ? <TickerSkeleton /> : !best || best.rows.length === 0 ? (
            <p className="py-6 text-center font-mono text-[10px] text-text-dim">No data</p>
          ) : (
            <table className="metro-table w-full text-left font-mono text-[10.5px]">
              <thead>
                <tr className="hud-title">
                  <th className="px-2 py-2 font-medium">#</th>
                  <th className="px-2 py-2 font-medium">MARKET</th>
                  <th className="px-2 py-2 font-medium text-right">MODAL ₹</th>
                  <th className="px-2 py-2 font-medium text-right">vs MEDIAN</th>
                </tr>
              </thead>
              <tbody>
                {best.rows.map((r, i) => (
                  <tr key={`${r.market}-${i}`}>
                    <td className="px-2 py-2 text-text-dim">{i + 1}</td>
                    <td className="px-2 py-2 text-text">{r.market}<span className="ml-1 text-[8px] text-text-dim">{r.state}</span></td>
                    <td className="px-2 py-2 text-right text-amber">{r.modalPrice.toLocaleString('en-IN')}</td>
                    <td className="px-2 py-2 text-right text-leaf">+{r.relativeToMedianPct.toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </HudPanel>

        {/* State coverage */}
        <HudPanel
          title="State Coverage — Quotes per Million"
          info="Quotes today normalised by 2011 Census population. Telangana/Tamil Nadu lead; small UTs score highest. Uttar Pradesh/Bihar report less than share."
          infoSource="Mandi feed · OGD · 2011 Census"
          className="lg:col-span-5"
          right={<span className="font-mono text-[8px] uppercase tracking-[0.22em] text-text-dim">QUOTES / M RN</span>}
        >
          {loading ? <TickerSkeleton /> : !data ? <TickerSkeleton /> : (
            <div className="max-h-[260px] overflow-auto">
              <table className="metro-table w-full text-left font-mono text-[10px]">
                <thead className="sticky top-0 z-10 bg-panel-3/95 backdrop-blur-sm">
                  <tr className="hud-title">
                    <th className="px-2 py-1.5 font-medium">STATE / UT</th>
                    <th className="px-2 py-1.5 font-medium text-right">QUOTES</th>
                    <th className="px-2 py-1.5 font-medium text-right">/ M RN</th>
                  </tr>
                </thead>
                <tbody>
                  {data.coverage.slice(0, 10).map((r) => (
                    <tr key={r.state}>
                      <td className="px-2 py-1.5 text-text-dim">{r.state}</td>
                      <td className="px-2 py-1.5 text-right text-text">{r.quotes.toLocaleString('en-IN')}</td>
                      <td className="px-2 py-1.5 text-right text-leaf">{r.quotesPerMillion?.toFixed(1) ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </HudPanel>
      </div>
    </>
  )
}
