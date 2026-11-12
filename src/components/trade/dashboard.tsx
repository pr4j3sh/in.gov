'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, ShieldCheck, Container, BookOpenText } from 'lucide-react'
import { HudPanel } from '@/components/hud/hud-panel'
import { Chip } from '@/components/hud/chip'
import { ManifestStrip } from '@/components/hud/manifest-strip'
import { SourceLink } from '@/components/hud/source-link'
import { StatusPill } from '@/components/hud/status-pill'
import { ChartSkeleton, StatTileSkeleton } from '@/components/hud/skeleton'
import { NeonChart } from '@/components/charts/neon-chart'
import { MONO_FONT, GOLD_BAR, categoryAxis, glowTooltip, monoLabel, valueAxis } from '@/lib/chart-theme'
import { fossilChemBars } from '@/lib/trade'
import type { TradeResponse } from '@/lib/trade'

const inr = (n: number | null) => (n == null ? '—' : `${n >= 0 ? '' : '−'}$${Math.abs(n).toFixed(1)}B`)
const inCr = (n: number | null) => (n == null ? '—' : `₹${n.toLocaleString('en-IN')} Cr`)

export function TradeDashboard() {
  const [data, setData] = useState<TradeResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)

  const load = useCallback(async () => {
    setSyncing(true)
    setError(null)
    try {
      const res = await fetch('/api/trade/vyapaar')
      if (!res.ok) throw new Error(`UPLINK FAULT ${res.status}`)
      setData((await res.json()) as TradeResponse)
      setHasLoaded(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'UPLINK FAULT')
    } finally {
      setSyncing(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const loading = syncing || !hasLoaded

  const balanceChart = useMemo(() => {
    if (!data) return null
    return {
      grid: { left: 8, right: 14, top: 20, bottom: 0, containLabel: true },
      tooltip: {
        ...glowTooltip('rgba(232,121,249,0.45)', '#fae8ff', { color: 'rgba(232,121,249,0.09)' }),
        formatter: (params: Array<{ name: string; value: number | null }>) =>
          `<b style="color:#e879f9">${params[0].name}</b><br/>merchandise balance: <b>${params[0].value == null ? '—' : `${params[0].value >= 0 ? '+' : ''}$${params[0].value.toFixed(1)}B`}</b>`,
      },
      xAxis: categoryAxis(data.balance.map((r) => r.year)),
      yAxis: valueAxis({ axisLabel: monoLabel({ formatter: (v: number) => `${v >= 0 ? '' : ''}${v}B` }) }),
      series: [{
        name: 'Balance',
        type: 'line' as const,
        smooth: 0.3,
        symbol: 'circle',
        symbolSize: 7,
        lineStyle: {
          width: 2.4,
          shadowBlur: 16,
          shadowColor: 'rgba(232,121,249,0.55)',
          color: {
            type: 'linear' as const, x: 0, y: 0, x2: 1, y2: 0,
            colorStops: [
              { offset: 0, color: '#701a75' },
              { offset: 0.5, color: '#c026d3' },
              { offset: 1, color: '#f0abfc' },
            ],
          },
        },
        itemStyle: { color: '#f0abfc' },
        areaStyle: {
          color: {
            type: 'linear' as const, x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(232,121,249,0.32)' },
              { offset: 1, color: 'rgba(232,121,249,0.01)' },
            ],
          },
        },
        data: data.balance.map((r) => r.balanceBn),
        markLine: {
          silent: true, symbol: 'none',
          lineStyle: { type: 'dashed' as const, width: 1, color: 'rgba(148,163,184,0.45)' },
          label: { formatter: 'ZERO', position: 'insideStartTop' as const, color: '#94a3b8', fontFamily: MONO_FONT, fontSize: 8 },
          data: [{ yAxis: 0 }],
        },
      }],
    }
  }, [data])

  const chemicalsChart = useMemo(() => {
    if (!data) return null
    const top = fossilChemBars(data.chemicals, 8)
    return {
      grid: { left: 8, right: 30, top: 8, bottom: 0, containLabel: true },
      tooltip: {
        ...glowTooltip('rgba(232,121,249,0.45)', '#fae8ff', { color: 'rgba(232,121,249,0.08)' }),
        formatter: (params: Array<{ name: string; value: number }>) =>
          `<b style="color:#e879f9">${params[0].name}</b><br/>FY25 exports: <b>${params[0].value.toLocaleString('en-IN')} ₹ Cr</b>`,
      },
      xAxis: valueAxis({ axisLabel: monoLabel() }),
      yAxis: categoryAxis(top.map((r) => r.commodity), { width: 190, overflow: 'truncate' as const }),
      series: [{
        type: 'bar' as const,
        barWidth: 11,
        data: top.map((r) => r.fy2025 ?? 0),
        itemStyle: GOLD_BAR,
      }],
    }
  }, [data])

  if (error && !data) {
    return (
      <HudPanel title="UPLINK STATUS" className="mt-6" info="Trade data could not be reached and no snapshot was available.">
        <p className="font-mono text-sm text-danger">▲ {error}</p>
        <button onClick={load} className="mt-4 inline-flex items-center gap-2 rounded-sm border border-fuchsia-400/40 bg-fuchsia-400/10 px-4 py-2 font-mono text-[10px] tracking-[0.25em] text-fuchsia-400">
          RETRY UPLINK
        </button>
      </HudPanel>
    )
  }

  const euLatest = data?.eu[data.eu.length - 1]
  const delta = data?.summary.deltaVs2024 ?? null

  return (
    <div>
      {/* status strip */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <StatusPill source={data?.source ?? 'live'} note="PIB-REPLY PRINTS · FY 2024-25" />
          <span className="font-mono text-[10px] tracking-[0.2em] text-text-dim">
            {data ? `${data.balance.length} TRADE BALANCES · ${data.eu.length} EU LEDGERS · ${data.chemicals.length} CHEMISTRY HS BASKETS` : '—'}
          </span>
        </div>
        {syncing && <span className="font-mono text-[9px] tracking-[0.3em] text-fuchsia-400/80">SYNCING…</span>}
      </div>

      {/* hero row */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* one number */}
        <HudPanel
          title="The One Number — Trade Balance FY25"
          info="India's merchandise trade balance (exports − imports) for FY 2024-25, in USD billion. 2021-22 FY baseline: −$191B; FY 2022-23: −$265B; FY 2023-24: −$238B; FY 2024-25: −$62.1B. Improvement of $176B year-on-year."
          infoSource="Rajya Sabha reply · OGD"
          className="lg:col-span-4"
        >
          {loading || !data ? (
            <div className="space-y-3 py-2">
              <div className="skeleton h-4 w-40" />
              <div className="skeleton h-20 w-52" />
              <div className="skeleton h-16 w-full" />
            </div>
          ) : (
            <div className="flex h-full flex-col">
              <p className="hud-title">MERCHANDISE BALANCE — FY 2024-25</p>
              <p className="mt-2 font-mono text-6xl font-bold leading-none tracking-tighter text-fuchsia-400 glow-text">
                −$62.1<span className="text-3xl align-top">B</span>
              </p>
              <p className="mt-1.5 inline-flex items-center gap-2 font-mono text-[10px] text-text-dim">
                <span>FY25 DEFICIT</span>
                <span className="inline-flex items-center gap-1 rounded-sm border border-emerald-400/30 bg-emerald-400/10 px-1.5 py-0.5 text-leaf">
                  <ArrowUpRight size={10} aria-hidden /> +$176.2B vs FY24
                </span>
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3 font-mono">
                <div className="border-t border-fuchsia-400/10 pt-2">
                  <p className="text-lg text-text">{data.balance[0]?.balanceBn?.toFixed(1) ?? '—'}B</p>
                  <p className="text-[8px] uppercase tracking-[0.18em] text-text-dim">FY22 deficit</p>
                </div>
                <div className="border-t border-fuchsia-400/10 pt-2">
                  <p className="text-lg text-text">{data.eu[data.eu.length - 1]?.balanceBn?.toFixed(1) ?? '—'}B</p>
                  <p className="text-[8px] uppercase tracking-[0.18em] text-text-dim">India–EU surplus FY25</p>
                </div>
              </div>
              <div className="mt-auto pt-4 border-t border-fuchsia-400/10">
                <p className="hud-title">Improvement path</p>
                <p className="mt-1 font-display text-sm font-semibold text-fuchsia-400/95">FY22 → FY25: deficit cut by two-thirds</p>
                <p className="font-mono text-[8.5px] uppercase tracking-[0.16em] text-text-dim">−191 → −265 → −238 → −62</p>
              </div>
            </div>
          )}
        </HudPanel>

        {/* balance line chart */}
        <HudPanel
          title="The Balance Ledger · FY 2021-22 → FY 2024-25"
          info="Merchandise trade balance by financial year, USD billion. Below zero = deficit. The FY25 trough is a sharp correction driven by lower oil imports and stronger exports of capital goods & chemicals — see the Chemistry Export panel."
          infoSource="Rajya Sabha reply · OGD"
          className="lg:col-span-8"
          right={<Chip tone="cyan">FY25 = −62.1B</Chip>}
        >
          {loading || !balanceChart ? (
            <ChartSkeleton height={330} />
          ) : (
            <NeonChart option={balanceChart} height={330} />
          )}
        </HudPanel>
      </div>

      {/* chemicals + EU ledger */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
        <HudPanel
          title="Chemistry Export — HS-2 Baskets (₹ Cr)"
          info="FY25 exports by HS-2 code, in ₹ crore (values as reported in the Rajya Sabha reply). Organic chemicals (HS 29) dominate at ₹1,70,243 Cr; total chemistry exports ₹3,92,769 Cr, +5.0% YoY vs FY24 (₹3,72,535 Cr)."
          infoSource="Rajya Sabha reply · OGD"
          className="lg:col-span-7"
          right={<Chip tone="amber">{data ? `FY25 · ₹${data.chemicalsTotal?.toLocaleString('en-IN') ?? '—'} Cr` : '—'}</Chip>}
        >
          {loading || !chemicalsChart ? (
            <ChartSkeleton height={330} />
          ) : (
            <NeonChart option={chemicalsChart} height={330} />
          )}
        </HudPanel>

        {/* EU 5-year ledger */}
        <HudPanel
          title="The EU Ledger · 5-Year Trend"
          info="India's merchandise trade with the European Union, FY 2020-21 → FY 2024-25. Exports climbed from $41.4B to $80.1B — a near-doubling; balance swung from +$1.6B to +$15.1B in India's favour."
          infoSource="Rajya Sabha reply · OGD"
          className="lg:col-span-5"
          pad={false}
        >
          {loading || !data ? (
            <div className="grid grid-cols-2 gap-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-16 w-full" />)}
            </div>
          ) : (
            <>
              <div className="px-4 pt-3 pb-2">
                <p className="hud-title">EU 5-YEAR ARC</p>
                <p className="mt-1 font-mono text-[10px] text-text-dim">India’s EU exports surged 2×; surplus became a structural surplus.</p>
              </div>
              <div className="overflow-auto">
                <table className="metro-table hud-table w-full text-left font-mono text-[10.5px]">
                  <thead className="bg-panel-3/60">
                    <tr className="hud-title">
                      <th className="px-4 py-2 font-medium">FY</th>
                      <th className="px-4 py-2 font-medium text-right">EXPORT $B</th>
                      <th className="px-4 py-2 font-medium text-right">IMPORT $B</th>
                      <th className="px-4 py-2 font-medium text-right">BAL $B</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.eu.map((r) => (
                      <tr key={r.year}>
                        <td className="px-4 py-2 text-text">{r.year}</td>
                        <td className="px-4 py-2 text-right text-text-dim">{r.exportBn?.toFixed(2) ?? '—'}</td>
                        <td className="px-4 py-2 text-right text-text-dim">{r.importBn?.toFixed(2) ?? '—'}</td>
                        <td className={`px-4 py-2 text-right font-semibold ${(r.balanceBn ?? 0) >= 0 ? 'text-leaf' : 'text-danger'}`}>
                          {r.balanceBn == null ? '—' : `${r.balanceBn >= 0 ? '+' : ''}${r.balanceBn.toFixed(2)}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-fuchsia-400/10 px-4 py-3">
                <div className="flex items-center justify-between font-mono text-[8.5px] uppercase tracking-[0.16em] text-text-dim">
                  <span>Latest India–EU balance</span>
                  <span className="text-leaf">+{data.eu[data.eu.length - 1]?.balanceBn?.toFixed(2)}B surplus</span>
                </div>
              </div>
            </>
          )}
        </HudPanel>
      </div>

      {/* manifest */}
      <ManifestStrip
        items={[
          <span key="lic" className="inline-flex items-center gap-1.5 text-hud/80"><ShieldCheck size={11} aria-hidden /> GODL-INDIA LICENSE</span>,
          <SourceLink key="src" href="https://www.data.gov.in" label="SOURCE — data.gov.in (Rajya Sabha)" className="hover:text-fuchsia-400" />,
          <span key="moc" className="inline-flex items-center gap-1.5"><Container size={11} aria-hidden /> MoC&I · PIB ANSWERS (NOT DGCI&S SERIES)</span>,
          <span key="scale" className="inline-flex items-center gap-1.5 text-amber/80"><BookOpenText size={11} aria-hidden /> FY 2020-21 → 2024-25</span>,
          <span key="note" className="text-text-dim/60">UNITS as reported: $B (balances, EU) · ₹ Cr (chemicals)</span>,
        ]}
      />
    </div>
  )
}
