import { ArrowLeft, CloudRainWind, Wind } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { NavBar } from '@/components/hud/nav-bar'
import { MetaRail } from '@/components/hud/meta-rail'
import { WeatherDashboard } from '@/components/weather/dashboard'

export const metadata: Metadata = {
  title: 'Weather & Rainfall — Monsoon Watch · in.gov',
  description:
    'The 124-year monsoon arc: JJAS rainfall 1901–2019, NE India to 2021, heavy rainfall events, CMZ forecast accuracy and subdivision normals.',
}

export default function WeatherPage() {
  return (
    <main data-domain="weather" className="relative min-h-screen">
      <div className="rain-bg" aria-hidden />
      <div className="rain-grid" aria-hidden />
      <NavBar />

      <div className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
        <div className="relative flex flex-wrap items-end justify-between gap-4 border-b border-sky-400/15 pb-6 pt-8">
          <div>
            <Link href="/" className="flex w-fit items-center gap-2 font-mono text-[9px] tracking-[0.3em] text-text-dim transition-colors hover:text-sky-400">
              <ArrowLeft size={12} aria-hidden /> MISSION CONTROL / SECTOR SELECT
            </Link>
            <p className="mt-3 flex w-fit items-center gap-2 font-mono text-[10px] tracking-[0.34em] text-sky-400">
              <CloudRainWind size={12} aria-hidden /> SECTOR 04 // VAYUMANDAL — THE MONSOON WATCH
            </p>
            <h1 className="mt-2 font-display text-4xl font-bold leading-none tracking-tight text-text sm:text-5xl">
              MONSOON <span className="glow-text text-sky-400">WATCH</span>
            </h1>
          </div>
          <MetaRail
            icon={Wind}
            title="SECTOR FEED"
            lines={['FEED — OGD PLATFORM v2', 'SOURCE — IMD / data.gov.in', 'AS OF — 1901–2024 SERIES']}
          />
        </div>

        <WeatherDashboard />
      </div>
    </main>
  )
}
