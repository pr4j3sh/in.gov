'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ShieldCheck, ArrowDownRight, ArrowUpRight, BookOpenText, Coins } from 'lucide-react'
import { HudPanel } from '@/components/hud/hud-panel'
import { Chip } from '@/components/hud/chip'
import { ManifestStrip } from '@/components/hud/manifest-strip'
import { SourceLink } from '@/components/hud/source-link'
import { StatusPill } from '@/components/hud/status-pill'
import { ChartSkeleton, TickerSkeleton } from '@/components/hud/skeleton'
import { NeonChart } from '@/components/charts/neon-chart'
import {
  MONO_FONT,
  ROSE_BAR,
  GOLD_BAR,
  categoryAxis,
  glowTooltip,
  monoLabel,
  valueAxis,
} from '@/lib/chart-theme'
import type { CpiResponse, CpiSectorKey } from '@/lib/cpi'
import { escapeHtml } from '@/lib/format'

const SECTORS: { key: CpiSectorKey; label: string }[] = [
  { key: 'rural', label: 'Rural' },
  { key: 'urban', label: 'Urban' },
  { key: 'combined', label: 'Combined' },
]

const WINDOWS = [
  { key: '5y', label: '5Y', months: 60 },
  { key: '10y', label: '10Y', months: 120 },
  { key: 'max', label: 'MAX', months: Number.MAX_SAFE_INTEGER },
] as const
type WindowKey = (typeof WINDOWS)[number]['key']

const inr = (n: number | null | undefined) => (n == null ? '—' : n.toFixed(1))

export function EconomyDashboard() {
  const [sector, setSector] = useState<CpiSectorKey>('combined')
  const [window5y, setWindow5y] = useState<WindowKey>('10y')
  const [data, setData] = useState<CpiResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)

  const load = useCallback(async (s: CpiSectorKey) => {
    setSyncing(true)
    setError(null)
    try {
      const res = await fetch(`/api/economy/cpi?sector=${s}`)
      if (!res.ok) throw new Error(`UPLINK FAULT ${res.status}`)
      setData((await res.json()) as CpiResponse)
      setHasLoaded(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'UPLINK FAULT')
    } finally {
      setSyncing(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(() => { void load(sector) }, 0)
    return () => clearTimeout(t)
  }, [sector, load])

  const loading = syncing || !hasLoaded

  const slice = useMemo(() => {
    if (!data) return null
    const months = WINDOWS.find((w) => w.key === window5y)!.months
    const n = data.series.labels.length
    const take = Math.min(months, n)
    return {
      labels: data.series.labels.slice(-take),
      general: data.series.general.slice(-take),
      yoy: data.series.yoy.slice(-take),
    }
  }, [data, window5y])

  const trajectoryChart = useMemo(() => {
    if (!slice) return null
    return {
      grid: { left: 8, right: 12, top: 24, bottom: 0, containLabel: true },
      tooltip: {
        ...glowTooltip('rgba(245,193,92,0.45)', '#fef3c7', { color: 'rgba(245,193,92,0.09)' }),
        formatter: (params: Array<{ name: string; value: number | null }>) => {
          const p = params[0]
          return `<b style="color:#f5c15c">${escapeHtml(p.name)}</b><br/>YoY inflation: <b>${p.value == null ? '—' : p.value.toFixed(1) + '%'}</b>`
        },
      },
      xAxis: categoryAxis(slice.labels, { interval: 'auto' as const, width: 46, overflow: 'truncate' as const }),
      yAxis: valueAxis({
        axisLabel: monoLabel({ formatter: (v: number) => `${v}%` }),
      }),
      series: [
        {
          name: 'YoY',
          type: 'line' as const,
          smooth: 0.35,
          symbol: 'circle',
          symbolSize: 4,
          lineStyle: {
            width: 2.2,
            shadowBlur: 16,
            shadowColor: 'rgba(245,193,92,0.5)',
            color: {
              type: 'linear' as const,
              x: 0, y: 0, x2: 1, y2: 0,
              colorStops: [
                { offset: 0, color: '#b45309' },
                { offset: 0.5, color: '#f5c15c' },
                { offset: 1, color: '#fde68a' },
              ],
            },
          },
          itemStyle: { color: '#f5c15c' },
          areaStyle: {
            color: {
              type: 'linear' as const,
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(245,193,92,0.3)' },
                { offset: 1, color: 'rgba(245,193,92,0.01)' },
              ],
            },
          },
          emphasis: { focus: 'series' as const },
          data: slice.yoy,
          markArea: {
            silent: true,
            itemStyle: { color: 'rgba(245,193,92,0.05)' },
            data: [[{ yAxis: 2 }, { yAxis: 6 }]],
          },
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: { type: 'dashed' as const, width: 1, color: 'rgba(251,113,133,0.65)' },
            label: {
              formatter: 'RBI CEILING 6%',
              position: 'insideEndTop' as const,
              color: '#fb7185',
              fontFamily: MONO_FONT,
              fontSize: 8,
            },
            data: [{ yAxis: 6 }],
          },
        },
      ],
    }
  }, [slice])

  const sparkChart = useMemo(() => {
    if (!data || data.sparkline.length === 0) return null
    return {
      grid: { left: 0, right: 0, top: 4, bottom: 0 },
      xAxis: { type: 'category' as const, show: false, data: data.sparkline.map((_, i) => i) },
      yAxis: { type: 'value' as const, show: false, min: 'dataMin' as const },
      tooltip: {
        trigger: 'axis' as const,
        backgroundColor: 'rgba(13,13,36,0.95)',
        borderColor: 'rgba(245,193,92,0.4)',
        textStyle: { color: '#fef3c7', fontFamily: MONO_FONT, fontSize: 10 },
        axisPointer: { type: 'none' as const },
        formatter: (params: Array<{ value: number }>) =>
          `<b style="color:#f5c15c">YoY</b>: ${params[0].value?.toFixed(1) ?? '—'}%`,
      },
      series: [
        {
          type: 'line' as const,
          smooth: 0.4,
          symbol: 'none',
          lineStyle: { width: 1.6, color: '#f5c15c', shadowBlur: 8, shadowColor: 'rgba(245,193,92,0.5)' },
          areaStyle: {
            color: {
              type: 'linear' as const,
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(245,193,92,0.35)' },
                { offset: 1, color: 'rgba(245,193,92,0.02)' },
              ],
            },
          },
          data: data.sparkline,
        },
      ],
    }
  }, [data])

  const pressureChart = useMemo(() => {
    if (!data) return null
    const rows = [...data.pressure].reverse()
    return {
      grid: { left: 8, right: 40, top: 8, bottom: 0, containLabel: true },
      tooltip: {
        ...glowTooltip('rgba(245,193,92,0.4)', '#fef3c7', { color: 'rgba(245,193,92,0.08)' }),
        formatter: (params: Array<{ name: string; value: number | null }>) => {
          const p = params[0]
          return `<b style="color:#f5c15c">${escapeHtml(p.name)}</b><br/>YoY inflation: <b>${p.value == null ? '—' : p.value.toFixed(1) + '%'}</b>`
        },
      },
      xAxis: valueAxis({ axisLabel: monoLabel({ formatter: (v: number) => `${v}%` }) }),
      yAxis: categoryAxis(rows.map((r) => r.label), { width: 130, overflow: 'truncate' as const }),
      series: [
        {
          type: 'bar' as const,
          barWidth: 11,
          data: rows.map((r) => ({
            value: r.yoy,
            itemStyle: (r.yoy ?? 0) >= 6 ? ROSE_BAR : GOLD_BAR,
          })),
          itemStyle: { borderRadius: [0, 3, 3, 0] },
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: { type: 'dashed' as const, width: 1, color: 'rgba(251,113,133,0.6)' },
            label: { formatter: '6%', position: 'end' as const, color: '#fb7185', fontFamily: MONO_FONT, fontSize: 8 },
            data: [{ xAxis: 6 }],
          },
        },
      ],
    }
  }, [data])

  if (error && !data) {
    return (
      <HudPanel title="UPLINK STATUS" className="mt-6" info="The dashboard could not reach the official CPI feed and no cached print was available.">
        <p className="font-mono text-sm text-danger">▲ {error}</p>
        <button
          onClick={() => load(sector)}
          className="mt-4 inline-flex items-center gap-2 rounded-sm border border-amber-400/40 bg-amber-400/10 px-4 py-2 font-mono text-[10px] tracking-[0.25em] text-amber transition-shadow hover:shadow-[0_0_18px_rgba(245,193,92,0.4)]"
        >
          RETRY UPLINK
        </button>
      </HudPanel>
    )
  }

  const focus = data?.summary.latestYoY ?? null
  const delta = data?.summary.deltaVsPrevMonth ?? null
  const deltaPositive = (delta ?? 0) >= 0

  return (
    <div>
      {/* status strip */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <StatusPill
            source="archived"
            note={`ARCHIVED PRINT · AS OF ${data ? data.asOf.slice(5, 7) + '/' + data.asOf.slice(0, 4) : '—'}`}
          />
          <span className="font-mono text-[10px] tracking-[0.2em] text-text-dim">
            {data ? `${data.summary.months} MONTHLY PRINTS PROCESSED` : '—'} · COMBINED = RURAL+URBAN
          </span>
        </div>
        <span className="inline-flex items-center gap-2 font-mono text-[9px] tracking-[0.28em] text-amber/80">
          FEED ENDED 2023-03 · STALE OFFICIAL PRINT
        </span>
      </div>

      {/* sector toggle */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="hud-title mr-1">SECTOR</span>
        {SECTORS.map((s) => (
          <button
            key={s.key}
            className="sector-chip"
            aria-pressed={sector === s.key}
            onClick={() => setSector(s.key)}
          >
            {s.label}
          </button>
        ))}
        {syncing && <span className="font-mono text-[9px] tracking-[0.3em] text-hud/80">SYNCING…</span>}
      </div>

      {/* hero row */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
        <HudPanel
          title="The One Number"
          info="YoY change in the CPI general index for the selected sector — the headline inflation figure. Positive = prices rising vs same month last year. The shaded band marks RBI's 2–6% medium-term target corridor."
          infoSource="MOSPI/CSO via data.gov.in"
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
              <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-text-dim">
                CPI INFLATION — {data.sectorLabel.toUpperCase()}
              </p>
              <p className="mt-1 inline-flex items-end gap-3">
                <span className="glow-text font-mono text-6xl font-bold leading-none tracking-tight text-amber xl:text-7xl">
                  {inr(focus)}
                  <span className="text-3xl align-top">%</span>
                </span>
                <span
                  className={`mb-1.5 inline-flex items-center gap-1 rounded-sm border px-1.5 py-1 font-mono text-[10px] tracking-widest ${
                    deltaPositive
                      ? 'border-rose-400/30 bg-rose-400/10 text-danger'
                      : 'border-emerald-400/30 bg-emerald-400/10 text-leaf'
                  }`}
                  title="Change in YoY vs previous month, in percentage points"
                >
                  {deltaPositive ? <ArrowUpRight size={11} aria-hidden /> : <ArrowDownRight size={11} aria-hidden />}
                  {delta == null ? '—' : `${Math.abs(delta).toFixed(1)} pp`}
                </span>
              </p>
              <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.2em] text-text-dim">
                YoY · index base 2012 = 100 · general index {inr(data.summary.latestGeneral)}
              </p>

              {sparkChart && (
                <div className="mt-4">
                  <p className="hud-title mb-1">Last 13 prints</p>
                  <NeonChart option={sparkChart} height={74} />
                </div>
              )}

              <div className="mt-auto pt-4">
                <div className="flex items-center justify-between border-t border-amber-400/15 pt-3 font-mono text-[8.5px] uppercase tracking-[0.16em] text-text-dim">
                  <span>RBI Target corridor</span>
                  <span className="text-amber/90">2.0% — 6.0%</span>
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-gradient-to-r from-emerald-400/60 via-amber-400/70 to-rose-400/70" />
                <div className="mt-1 flex justify-between font-mono text-[7px] text-text-dim/70">
                  <span>2%</span><span>4%</span><span>6%</span>
                </div>
              </div>
            </div>
          )}
        </HudPanel>

        <HudPanel
          title="Inflation Trajectory — YoY"
          info="Month-over-month CPI general index, rebased to YoY. The shaded band is RBI's 2–6% inflation corridor; the dashed rose line is the 6% ceiling from the flexible inflation targeting framework."
          infoSource="MOSPI/CSO via data.gov.in"
          className="lg:col-span-8"
          right={
            <span className="flex items-center gap-1.5">
              {WINDOWS.map((w) => (
                <button
                  key={w.key}
                  onClick={() => setWindow5y(w.key)}
                  className="sector-chip !px-2.5 !py-1"
                  aria-pressed={window5y === w.key}
                >
                  {w.label}
                </button>
              ))}
            </span>
          }
        >
          {loading || !trajectoryChart ? (
            <ChartSkeleton height={330} />
          ) : (
            <NeonChart option={trajectoryChart} height={330} />
          )}
        </HudPanel>
      </div>

      {/* pressure */}
      <HudPanel
        title="Where the Pressure Is — YoY by Basket"
        info="YoY change in each CPI component basket for the selected sector. Bars crossing the dashed line (6%) are driving inflation past RBI's ceiling; bars below the corridor (2%) are deflating components. Sorted warmest first."
        infoSource="MOSPI/CSO via data.gov.in"
        className="mt-4"
        right={<Chip tone="amber">{data?.sectorLabel.toUpperCase() ?? '—'} · YoY</Chip>}
      >
        {loading || !pressureChart ? (
          <ChartSkeleton height={330} />
        ) : (
          <NeonChart option={pressureChart} height={Math.max(280, (data?.pressure.length ?? 0) * 34)} />
        )}
      </HudPanel>

      {/* ledger */}
      <HudPanel
        title="The Ledger — 18 Monthly Prints"
        info="The raw monthly prints behind the charts. INDEX = CPI general index (2012=100). YoY = 12-month change. FOOD/FUEL/EDUC/MISC = component indices. Newest first; the highlighted row is the latest print in the feed."
        infoSource="MOSPI/CSO via data.gov.in"
        className="mt-4"
        pad={false}
        right={<span className="font-mono text-[9px] tracking-[0.2em] text-text-dim">{data ? `${data.ledger.length} ROWS · ${data.sectorLabel.toUpperCase()}` : '—'}</span>}
      >
        {loading || !data ? <TickerSkeleton /> : (
          <div className="max-h-[460px] overflow-auto">
            <table className="ledger-table hud-table w-full min-w-[720px] text-left font-mono text-[10.5px]">
              <thead className="sticky top-0 z-10 bg-panel-3/95 backdrop-blur-sm">
                <tr className="hud-title">
                  <th className="px-4 py-2.5 font-medium">MONTH</th>
                  <th className="px-4 py-2.5 font-medium text-right">INDEX</th>
                  <th className="px-4 py-2.5 font-medium text-right">YoY</th>
                  <th className="px-4 py-2.5 font-medium text-right">FOOD</th>
                  <th className="px-4 py-2.5 font-medium text-right">FUEL</th>
                  <th className="px-4 py-2.5 font-medium text-right">EDUC</th>
                  <th className="px-4 py-2.5 font-medium text-right">MISC</th>
                </tr>
              </thead>
              <tbody>
                {data.ledger.map((r, i) => (
                  <tr key={r.monthKey} className={i === 0 ? 'ledger-hero' : ''}>
                    <td className="px-4 py-2 text-text">{r.label}{i === 0 && <span className="ml-2 text-[8px] text-amber">LATEST</span>}</td>
                    <td className="ledger-num px-4 py-2 text-right text-amber">{r.general?.toFixed(1) ?? '—'}</td>
                    <td className={`ledger-num px-4 py-2 text-right ${r.yoy != null && r.yoy > 6 ? 'text-danger' : 'text-text'}`}>
                      {r.yoy == null ? '—' : `${r.yoy >= 0 ? '+' : ''}${r.yoy.toFixed(1)}%`}
                    </td>
                    <td className="ledger-num px-4 py-2 text-right text-text-dim">{r.food?.toFixed(1) ?? '—'}</td>
                    <td className="ledger-num px-4 py-2 text-right text-text-dim">{r.fuel?.toFixed(1) ?? '—'}</td>
                    <td className="ledger-num px-4 py-2 text-right text-text-dim">{r.education?.toFixed(1) ?? '—'}</td>
                    <td className="ledger-num px-4 py-2 text-right text-text-dim">{r.misc?.toFixed(1) ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </HudPanel>

      {/* manifest */}
      <ManifestStrip
        items={[
          <span key="lic" className="inline-flex items-center gap-1.5 text-hud/80"><ShieldCheck size={11} aria-hidden /> GODL-INDIA LICENSE</span>,
          <SourceLink key="src" href="https://www.data.gov.in" label="SOURCE — data.gov.in" className="hover:text-amber" />,
          <span key="mospi" className="inline-flex items-center gap-1.5"><BookOpenText size={11} aria-hidden /> MOSPI / CSO</span>,
          <span key="base" className="inline-flex items-center gap-1.5"><Coins size={11} aria-hidden /> BASE 2012 = 100</span>,
          <span key="stale" className="text-amber/90">ARCHIVED FEED — ENDED Feb 2024 · LATEST OFFICIAL PRINT</span>,
          <span key="comb" className="text-text-dim/60">COMBINED = RURAL+URBAN</span>,
        ]}
      />
    </div>
  )
}
