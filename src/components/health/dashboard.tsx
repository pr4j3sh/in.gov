'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ArrowDownRight, ArrowUpRight, ShieldCheck, BookOpenText, Stethoscope } from 'lucide-react'
import { HudPanel } from '@/components/hud/hud-panel'
import { Chip } from '@/components/hud/chip'
import { HudSearch } from '@/components/hud/hud-search'
import { ManifestStrip } from '@/components/hud/manifest-strip'
import { SourceLink } from '@/components/hud/source-link'
import { StatusPill } from '@/components/hud/status-pill'
import { ChartSkeleton, StatTileSkeleton, TickerSkeleton } from '@/components/hud/skeleton'
import { NeonChart } from '@/components/charts/neon-chart'
import { MONO_FONT, TEAL_BAR, ROSE_BAR, categoryAxis, glowTooltip, monoLabel, valueAxis } from '@/lib/chart-theme'
import type { HealthResponse } from '@/lib/health'

const inr = (n: number | null) => (n == null ? '—' : n.toLocaleString('en-IN'))

export function HealthDashboard() {
  const [data, setData] = useState<HealthResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [query, setQuery] = useState('')

  const load = useCallback(async () => {
    setSyncing(true)
    setError(null)
    try {
      const res = await fetch('/api/health/fic-vacancies')
      if (!res.ok) throw new Error(`UPLINK FAULT ${res.status}`)
      setData((await res.json()) as HealthResponse)
      setHasLoaded(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'UPLINK FAULT')
    } finally {
      setSyncing(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const loading = syncing || !hasLoaded

  const trendChart = useMemo(() => {
    if (!data) return null
    const labels = data.ficYearwise.map((r) => r.year)
    const values = data.ficYearwise.map((r) => r.ficPct)
    return {
      grid: { left: 8, right: 8, top: 20, bottom: 0, containLabel: true },
      tooltip: {
        ...glowTooltip('rgba(45,212,191,0.45)', '#ccfbf1', { color: 'rgba(45,212,191,0.09)' }),
        formatter: (params: Array<{ name: string; value: number | null }>) =>
          `<b style="color:#2dd4bf">${params[0].name}</b><br/>Full Immunization: <b>${params[0].value?.toFixed(1) ?? '—'}%</b>`,
      },
      xAxis: categoryAxis(labels, { interval: 0 }),
      yAxis: valueAxis({ min: 88, max: 100, axisLabel: monoLabel({ formatter: (v: number) => `${v}%` }) }),
      series: [{
        name: 'FIC',
        type: 'line' as const,
        smooth: 0.35,
        symbol: 'circle',
        symbolSize: 6,
        lineStyle: { width: 2.2, shadowBlur: 14, shadowColor: 'rgba(45,212,191,0.55)', color: '#2dd4bf' },
        itemStyle: { color: '#5eead4' },
        areaStyle: {
          color: {
            type: 'linear' as const, x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(45,212,191,0.32)' },
              { offset: 1, color: 'rgba(45,212,191,0.01)' },
            ],
          },
        },
        data: values,
      }],
    }
  }, [data])

  const underCoverageChart = useMemo(() => {
    if (!data) return null
    const worst = [...data.ficByState]
      .filter((r) => r.state !== 'India' && r.ficPct != null)
      .sort((a, b) => (a.ficPct ?? 0) - (b.ficPct ?? 0))
      .slice(0, 10)
      .reverse()
    return {
      grid: { left: 8, right: 34, top: 26, bottom: 0, containLabel: true },
      tooltip: {
        ...glowTooltip('rgba(251,113,133,0.4)', '#fecdd3', { color: 'rgba(251,113,133,0.08)' }),
        formatter: (params: Array<{ name: string; value: number }>) =>
          `<b style="color:#fb7185">${params[0].name}</b><br/>FIC 2023-24: <b>${params[0].value.toFixed(1)}%</b>`,
      },
      xAxis: valueAxis({ min: 0, max: 110, axisLabel: monoLabel({ formatter: (v: number) => `${v}%` }) }),
      yAxis: categoryAxis(worst.map((r) => r.state), { width: 150, overflow: 'truncate' as const }),
      series: [{
        type: 'bar' as const,
        barWidth: 11,
        data: worst.map((r) => r.ficPct ?? 0),
        itemStyle: ROSE_BAR,
        markLine: {
          silent: true, symbol: 'none',
          lineStyle: { type: 'dashed' as const, width: 1, color: 'rgba(253,186,116,0.7)' },
          label: { formatter: 'UHC FLOOR 80%', position: 'end' as const, color: '#fdba74', fontFamily: MONO_FONT, fontSize: 8 },
          data: [{ xAxis: 80 }],
        },
      }],
    }
  }, [data])

  const vacancyRows = useMemo(() => {
    if (!data) return []
    const q = query.trim().toLowerCase()
    return q ? data.vacancies.filter((v) => v.state.toLowerCase().includes(q)) : data.vacancies
  }, [data, query])

  if (error && !data) {
    return (
      <HudPanel title="UPLINK STATUS" className="mt-6" info="Health data could not be reached and no snapshot was available.">
        <p className="font-mono text-sm text-danger">▲ {error}</p>
        <button onClick={load} className="mt-4 inline-flex items-center gap-2 rounded-sm border border-teal-400/40 bg-teal-400/10 px-4 py-2 font-mono text-[10px] tracking-[0.25em] text-teal-300">
          RETRY UPLINK
        </button>
      </HudPanel>
    )
  }

  const india = data?.summary.indiaFicPct ?? null
  const trend = data?.summary.ficTrend2019_24 ?? null
  const trendUp = (trend ?? 0) >= 0

  return (
    <div>
      {/* status strip */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <StatusPill source={data?.source ?? 'live'} note={`FIC 2023-24 · RHS 2021`} />
          <span className="font-mono text-[10px] tracking-[0.2em] text-text-dim">
            {data ? `${data.summary.statesCovered} STATES/UTs · 4-YEAR TREND 2019-20 → 2023-24` : '—'}
          </span>
        </div>
        {syncing && <span className="font-mono text-[9px] tracking-[0.3em] text-teal-300/80">SYNCING…</span>}
      </div>

      {/* hero row */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* the one number */}
        <HudPanel
          title="The One Number — FIC 2023-24"
          info="Share of children (12–23 months) who received full immunization in 2023-24. National Health Mission reports 93.5% — above the NFHS-5 baseline but below universal coverage's 100%."
          infoSource="MoHFW / RHS via data.gov.in"
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
              <p className="hud-title">FULL IMMUNIZATION — 2023-24</p>
              <p className="mt-2 font-mono text-6xl font-bold leading-none tracking-tighter text-teal-300 glow-text">
                {india?.toFixed(1) ?? '—'}<span className="text-3xl align-top">%</span>
              </p>
              <p className="mt-1.5 inline-flex items-center gap-2 font-mono text-[10px] text-text-dim">
                <span>NATIONAL FIC · 12–23 MONTHS</span>
                <span className={`inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 ${trendUp ? 'border-emerald-400/30 bg-emerald-400/10 text-leaf' : 'border-rose-400/30 bg-rose-400/10 text-danger'}`}>
                  {trendUp ? <ArrowUpRight size={10} aria-hidden /> : <ArrowDownRight size={10} aria-hidden />}
                  {trend == null ? '—' : `${trend >= 0 ? '+' : ''}${trend.toFixed(1)} pp since 2019-20`}
                </span>
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3 font-mono">
                <div className="border-t border-teal-400/10 pt-2">
                  <p className="text-lg text-text">{inr(data.summary.totalDoctorsVacant)}</p>
                  <p className="text-[8px] uppercase tracking-[0.18em] text-text-dim">Doctors vacant (DH↓)</p>
                </div>
                <div className="border-t border-teal-400/10 pt-2">
                  <p className="text-lg text-text">{inr(data.summary.totalNursesVacant)}</p>
                  <p className="text-[8px] uppercase tracking-[0.18em] text-text-dim">Staff nurses vacant</p>
                </div>
              </div>
              <div className="mt-auto pt-4 border-t border-teal-400/10">
                <p className="hud-title">Worst staffed</p>
                <p className="mt-1 font-display text-lg font-semibold text-teal-300">{data.summary.worstVacancyState ?? '—'}</p>
                <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-text-dim">RHS 2021 · doctors + specialists + nurses + MPW + paramedical</p>
              </div>
            </div>
          )}
        </HudPanel>

        {/* trend */}
        <HudPanel
          title="The Immune Curve · 2019-20 → 2023-24"
          info="Full Immunization Coverage nationally across the last five reporting cohorts. 2019-20 → 2023-24 gained ~1.9 pp. The curve is shallow; universal coverage is not yet within reach."
          infoSource="MoHFW / RHS via data.gov.in"
          className="lg:col-span-8"
          right={<Chip tone="cyan">2023-24 = 93.5%</Chip>}
        >
          {loading || !trendChart ? (
            <ChartSkeleton height={330} />
          ) : (
            <NeonChart option={trendChart} height={330} />
          )}
        </HudPanel>
      </div>

      {/* under-coverage + vacancy board */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
        <HudPanel
          title="The Under-Covered — 10 Worst States/UTs"
          info="States/UTs with the lowest FIC in 2023-24. The dashed line marks 80% — the practical UHC floor. Several of these fall below NFHS estimates because they use different denominators; read as reported."
          infoSource="MoHFW / RHS via data.gov.in"
          className="lg:col-span-7"
          right={<Chip tone="amber">2023-24</Chip>}
        >
          {loading || !underCoverageChart ? (
            <ChartSkeleton height={330} />
          ) : (
            <NeonChart option={underCoverageChart} height={330} />
          )}
        </HudPanel>

        {/* quick national gap tiles */}
        <HudPanel
          title="National Gap — Staff"
          info="Sum of reported vacancies across all states/UTs in RHS 2021. Not annual losses — one-off shortfall at the time of measurement. Nurses dominate the gap."
          infoSource="MoHFW / RHS 2021"
          className="lg:col-span-5"
        >
          {loading || !data ? (
            <div className="grid grid-cols-2 gap-2 py-1">
              {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-16 w-full" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {[
                ['Doctors', data.vacancies.reduce((a, v) => a + (v.doctors ?? 0), 0)],
                ['Specialists', data.vacancies.reduce((a, v) => a + (v.specialists ?? 0), 0)],
                ['Nurses', data.vacancies.reduce((a, v) => a + (v.nurses ?? 0), 0)],
                ['MPW', data.vacancies.reduce((a, v) => a + (v.mpw ?? 0), 0)],
                ['Lab Techs', data.vacancies.reduce((a, v) => a + (v.labTechnicians ?? 0), 0)],
                ['Paramedical', data.vacancies.reduce((a, v) => a + (v.paramedical ?? 0), 0)],
              ].map(([label, value]) => (
                <div key={label as string} className="rounded-sm border border-teal-400/15 bg-teal-400/5 px-3 py-2.5">
                  <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-text-dim">{label}</p>
                  <p className="mt-0.5 font-mono text-xl font-semibold text-teal-300">{inr(value as number)}</p>
                </div>
              ))}
            </div>
          )}
        </HudPanel>
      </div>

      {/* staffing ledger */}
      <HudPanel
        title="The Staffing Ledger — RHS 2021"
        info="Reported vacancies by cadre, per state/UT, sorted by doctors+specialists+nurses+MPW. Search any state to filter."
        infoSource="MoHFW / RHS 2021"
        className="mt-4"
        pad={false}
        right={
          <span className="flex items-center gap-2">
            <HudSearch value={query} onChange={setQuery} placeholder="state / UT…" ariaLabel="Filter states" width="w-36" />
            <span className="font-mono text-[9px] tracking-[0.2em] text-text-dim">{loading || !data ? '—' : `${vacancyRows.length}/${data.vacancies.length} ROWS`}</span>
          </span>
        }
      >
        {loading || !data ? <TickerSkeleton /> : (
          <div className="max-h-[440px] overflow-auto">
            <table className="metro-table hud-table w-full min-w-[860px] text-left font-mono text-[10px]">
              <thead className="sticky top-0 z-10 bg-panel-3/95 backdrop-blur-sm">
                <tr className="hud-title">
                  <th className="px-4 py-2.5 font-medium">STATE / UT</th>
                  <th className="px-4 py-2.5 font-medium text-right">DOCTORS</th>
                  <th className="px-4 py-2.5 font-medium text-right">SPECIALISTS</th>
                  <th className="px-4 py-2.5 font-medium text-right">NURSES</th>
                  <th className="px-4 py-2.5 font-medium text-right">MPW</th>
                  <th className="px-4 py-2.5 font-medium text-right">LAB TECHS</th>
                  <th className="px-4 py-2.5 font-medium text-right">PHARMACISTS</th>
                </tr>
              </thead>
              <tbody>
                {vacancyRows.map((v) => (
                  <tr key={v.state}>
                    <td className="px-4 py-2 text-text">{v.state}</td>
                    <td className="px-4 py-2 text-right text-rose-400">{inr(v.doctors)}</td>
                    <td className="px-4 py-2 text-right text-text-dim">{inr(v.specialists)}</td>
                    <td className="px-4 py-2 text-right text-rose-400">{inr(v.nurses)}</td>
                    <td className="px-4 py-2 text-right text-amber">{inr(v.mpw)}</td>
                    <td className="px-4 py-2 text-right text-text-dim">{inr(v.labTechnicians)}</td>
                    <td className="px-4 py-2 text-right text-text-dim">{inr(v.pharmacists)}</td>
                  </tr>
                ))}
                {vacancyRows.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-text-dim">NO STATE MATCHES “{query.toUpperCase()}”</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </HudPanel>

      {/* manifest */}
      <ManifestStrip
        items={[
          <span key="lic" className="inline-flex items-center gap-1.5 text-hud/80"><ShieldCheck size={11} aria-hidden /> GODL-INDIA LICENSE</span>,
          <SourceLink key="src" href="https://www.data.gov.in" label="SOURCE — data.gov.in (MoHFW)" className="hover:text-teal-300" />,
          <span key="rhs" className="inline-flex items-center gap-1.5"><Stethoscope size={11} aria-hidden /> RHS 2021 · FIC 2023-24</span>,
          <span key="nhs" className="inline-flex items-center gap-1.5 text-amber/80"><BookOpenText size={11} aria-hidden /> NATIONAL HEALTH MISSION</span>,
          <span key="note" className="text-text-dim/60">REPORTED VACANCIES ≠ NEW POSTS NEEDED</span>,
        ]}
      />
    </div>
  )
}
