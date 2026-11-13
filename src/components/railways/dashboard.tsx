'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, ShieldCheck, TrainFront, BookOpenText } from 'lucide-react'
import { HudPanel } from '@/components/hud/hud-panel'
import { Chip } from '@/components/hud/chip'
import { ManifestStrip } from '@/components/hud/manifest-strip'
import { SourceLink } from '@/components/hud/source-link'
import { StatusPill } from '@/components/hud/status-pill'
import { ChartSkeleton } from '@/components/hud/skeleton'
import { NeonChart } from '@/components/charts/neon-chart'
import { MONO_FONT, GREEN_BAR, categoryAxis, glowTooltip, monoLabel, valueAxis } from '@/lib/chart-theme'
import type { RailwaysResponse } from '@/lib/railways'
import { escapeHtml } from '@/lib/format'

export function RailwaysDashboard() {
  const [data, setData] = useState<RailwaysResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)

  const load = useCallback(async () => {
    setSyncing(true)
    setError(null)
    try {
      const res = await fetch('/api/railways/freight')
      if (!res.ok) throw new Error(`UPLINK FAULT ${res.status}`)
      setData((await res.json()) as RailwaysResponse)
      setHasLoaded(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'UPLINK FAULT')
    } finally {
      setSyncing(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => { void load() }, 0)
    return () => clearTimeout(t)
  }, [load])

  const loading = syncing || !hasLoaded

  const freightChart = useMemo(() => {
    if (!data) return null
    return {
      grid: { left: 8, right: 8, top: 32, bottom: 0, containLabel: true },
      tooltip: {
        ...glowTooltip('rgba(34,197,94,0.45)', '#dcfce7', { color: 'rgba(34,197,94,0.09)' }),
        formatter: (params: Array<{ seriesName: string; name: string; value: number | null }>) =>
          `<b style="color:#22c55e">${escapeHtml(params[0].name)}</b><br/>${params.map((p) =>
            `${escapeHtml(p.seriesName)}: <b>${p.value == null ? '—' : p.value.toLocaleString('en-IN')}${p.seriesName.includes('Loading') ? ' MT' : ' Cr'}</b>`).join('<br/>')}`,
      },
      legend: { show: true, top: 0, right: 0, textStyle: { color: '#86efac', fontFamily: MONO_FONT, fontSize: 9 }, itemWidth: 14, itemHeight: 10 },
      xAxis: categoryAxis(data.freight.map((r) => r.year)),
      yAxis: [
        valueAxis({ name: 'MT', axisLabel: monoLabel() }),
        valueAxis({ name: '₹ Cr', position: 'right' as const, splitLine: { show: false }, axisLabel: monoLabel({ formatter: (v: number) => `${(v / 1000).toFixed(0)}k` }) }),
      ],
      series: [
        {
          name: 'Loading (MT)',
          type: 'bar' as const,
          barWidth: 26,
          data: data.freight.map((r) => r.loadingMnt),
          itemStyle: GREEN_BAR,
        },
        {
          name: 'Revenue (₹ Cr)',
          type: 'line' as const,
          yAxisIndex: 1,
          smooth: 0.35,
          symbol: 'circle',
          symbolSize: 7,
          lineStyle: { width: 2.2, shadowBlur: 14, shadowColor: 'rgba(34,197,94,0.55)', color: '#22c55e' },
          itemStyle: { color: '#bbf7d0' },
          areaStyle: {
            color: {
              type: 'linear' as const, x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(34,197,94,0.3)' },
                { offset: 1, color: 'rgba(34,197,94,0.01)' },
              ],
            },
          },
          data: data.freight.map((r) => r.revenueCrore),
        },
      ],
    }
  }, [data])

  const trainsChart = useMemo(() => {
    if (!data) return null
    // 2018-19 vs 2023-24 (COVID years were not reported)
    const labels = ['2018-19', '2023-24']
    const mailExp = data.trains.filter((t) => t.year === '2018-19' || t.year === '2023-24').map((t) => t.mailExpress ?? 0)
    const ordinary = data.trains.filter((t) => t.year === '2018-19' || t.year === '2023-24').map((t) => t.ordinary ?? 0)
    const goods = data.trains.filter((t) => t.year === '2018-19' || t.year === '2023-24').map((t) => t.goods ?? 0)
    return {
      grid: { left: 8, right: 8, top: 30, bottom: 0, containLabel: true },
      tooltip: glowTooltip('rgba(34,197,94,0.4)', '#dcfce7', { color: 'rgba(34,197,94,0.08)' }),
      legend: { show: true, top: 0, right: 0, textStyle: { color: '#86efac', fontFamily: MONO_FONT, fontSize: 9 }, itemWidth: 14, itemHeight: 10 },
      xAxis: categoryAxis(labels),
      yAxis: valueAxis({ axisLabel: monoLabel({ formatter: (v: number) => `${v}` }) }),
      series: [
        { name: 'Mail / Express (M km)', type: 'bar' as const, stack: 'total', data: mailExp, itemStyle: GREEN_BAR },
        { name: 'Ordinary (M km)', type: 'bar' as const, stack: 'total', data: ordinary, itemStyle: { ...GREEN_BAR, opacity: 0.6 } },
        { name: 'Goods (M km)', type: 'bar' as const, stack: 'total', data: goods, itemStyle: { color: '#166534', borderRadius: [0, 0, 0, 0] } },
      ],
    }
  }, [data])

  if (error && !data) {
    return (
      <HudPanel title="UPLINK STATUS" className="mt-6" info="Railways data could not be reached and no snapshot was available.">
        <p className="font-mono text-sm text-danger">▲ {error}</p>
        <button onClick={load} className="mt-4 inline-flex items-center gap-2 rounded-sm border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 font-mono text-[10px] tracking-[0.25em] text-emerald-400">
          RETRY UPLINK
        </button>
      </HudPanel>
    )
  }

  const yoyL = data?.summary.yoyLoadingPct
  const yoyR = data?.summary.yoyRevenuePct

  return (
    <div>
      {/* status strip */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <StatusPill source={data?.source ?? 'live'} note="PIB-REPLY PRINTS · FY 2024-25" />
          <span className="font-mono text-[10px] tracking-[0.2em] text-text-dim">
            {data ? `${data.freight.length} FREIGHT YEARS · ${data.trains.length} TRAIN-MIX YEARS · FY 2024-25` : '—'}
          </span>
        </div>
        {syncing && <span className="font-mono text-[9px] tracking-[0.3em] text-emerald-400/80">SYNCING…</span>}
      </div>

      {/* hero row */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* one number */}
        <HudPanel
          title="The One Number — Freight FY25"
          info="Total freight loading in FY 2024-25 (million tonnes) and freight revenue (₹ crore). YoY change vs FY24: +1.6% loading / +1.7% revenue. Peak of the COVID recovery trend (1,233 → 1,617 MT)."
          infoSource="Ministry of Railways · PIB"
          className="lg:col-span-4"
        >
          {loading || !data ? (
            <div className="space-y-3 py-2">
              <div className="skeleton h-4 w-40" />
              <div className="skeleton h-20 w-56" />
              <div className="skeleton h-16 w-full" />
            </div>
          ) : (
            <div className="flex h-full flex-col">
              <p className="hud-title">FREIGHT LOADING — FY 2024-25</p>
              <p className="mt-2 font-mono text-6xl font-bold leading-none tracking-tighter text-emerald-400 glow-text">
                {data.summary.latestLoadingMnt?.toLocaleString('en-IN') ?? '—'}<span className="text-2xl align-top"> MT</span>
              </p>
              <p className="mt-1.5 inline-flex items-center gap-2 font-mono text-[10px] text-text-dim">
                <span>FY25 FREIGHT</span>
                <span className="inline-flex items-center gap-1 rounded-sm border border-emerald-400/30 bg-emerald-400/10 px-1.5 py-0.5 text-leaf">
                  <ArrowUpRight size={10} aria-hidden /> {yoyL == null ? '—' : `+${yoyL.toFixed(1)}%`} vs FY24
                </span>
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3 font-mono">
                <div className="border-t border-emerald-500/10 pt-2">
                  <p className="text-lg text-text">₹{((data.summary.latestRevenueCrore ?? 0) / 1000).toFixed(1)}k</p>
                  <p className="text-[8px] uppercase tracking-[0.18em] text-text-dim">FY25 Revenue · ₹1.71 L-crore</p>
                </div>
                <div className="border-t border-emerald-500/10 pt-2">
                  <p className="text-lg text-text">+{yoyR == null ? '—' : yoyR.toFixed(1)}%</p>
                  <p className="text-[8px] uppercase tracking-[0.18em] text-text-dim">YoY revenue growth</p>
                </div>
              </div>
              <div className="mt-auto pt-4 border-t border-emerald-500/10">
                <p className="hud-title">Coal Freight Backbone</p>
                <p className="mt-1 font-display text-lg font-semibold text-emerald-400/95">₹60,436 Cr <span className="text-xs text-text-dim">FY22</span></p>
                <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-text-dim">Coal freight revenue — the last coal-specific print; ~35% of FY25 freight revenue is on coal</p>
              </div>
            </div>
          )}
        </HudPanel>

        {/* freight chart */}
        <HudPanel
          title="The Iron Curve · FY 2020-21 → FY 2024-25"
          info="Freight loading (bars, million tonnes) and freight revenue (line, ₹ crore) by financial year. COVID trough FY21 (1,233 MT) → FY25 recovery (1,617 MT, +31%). Revenue line tracks loading almost 1:1 — railway is the backbone of bulk cargo."
          infoSource="Ministry of Railways · PIB"
          className="lg:col-span-8"
          right={<Chip tone="cyan">FY25 · 1,617 MT</Chip>}
        >
          {loading || !freightChart ? (
            <ChartSkeleton height={330} />
          ) : (
            <NeonChart option={freightChart} height={330} />
          )}
        </HudPanel>
      </div>

      {/* train mix */}
      <HudPanel
        title="The Train Mix · 2018-19 vs 2023-24"
        info="Running kilometres by category — Mail/Express vs Ordinary passenger vs Goods. 2018-19: 107.7M km total; 2023-24: 109.8M km. COVID years were not reported. Goods trains grew share from 21.6% to 21.5% — broadly flat."
        infoSource="Ministry of Railways · PIB"
        className="mt-4"
        right={<Chip tone="amber">2018-19 → 2023-24</Chip>}
      >
        {loading || !trainsChart ? (
          <ChartSkeleton height={200} />
        ) : (
          <NeonChart option={trainsChart} height={200} />
        )}
      </HudPanel>

      {/* manifest */}
      <ManifestStrip
        items={[
          <span key="lic" className="inline-flex items-center gap-1.5 text-hud/80"><ShieldCheck size={11} aria-hidden /> GODL-INDIA LICENSE</span>,
          <SourceLink key="src" href="https://www.data.gov.in" label="SOURCE — data.gov.in (MoR)" className="hover:text-emerald-400" />,
          <span key="mor" className="inline-flex items-center gap-1.5"><TrainFront size={11} aria-hidden /> MoR · PIB ANSWERS</span>,
          <span key="covid" className="inline-flex items-center gap-1.5 text-amber/80"><BookOpenText size={11} aria-hidden /> COVID YEARS NOT REPORTED</span>,
          <span key="note" className="text-text-dim/60">FY20-21 FREIGHT LOADED = 1,233 MT (COVID TROUGH)</span>,
        ]}
      />
    </div>
  )
}
