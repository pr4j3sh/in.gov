import { ArrowLeft, TrainFront, Signal } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { NavBar } from '@/components/hud/nav-bar'
import { MetaRail } from '@/components/hud/meta-rail'
import { RailwaysDashboard } from '@/components/railways/dashboard'

export const metadata: Metadata = {
  title: 'Railways — The Rajmarg Ledger · in.gov',
  description:
    'Indian Railways freight 2020-25: 1,617 MT loading, ₹1.71 lakh-crore revenue FY25 — loaded rails, the FY18-24 train mix, and the coal freight backbone.',
}

export default function RailwaysPage() {
  return (
    <main data-domain="railways" className="relative min-h-screen">
      <div className="rail-bg" aria-hidden />
      <div className="rail-grid" aria-hidden />
      <NavBar />

      <div className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
        <div className="relative flex flex-wrap items-end justify-between gap-4 border-b border-emerald-500/15 pb-6 pt-8">
          <div>
            <Link href="/" className="flex w-fit items-center gap-2 font-mono text-[9px] tracking-[0.3em] text-text-dim transition-colors hover:text-emerald-400">
              <ArrowLeft size={12} aria-hidden /> MISSION CONTROL / SECTOR SELECT
            </Link>
            <p className="mt-3 flex w-fit items-center gap-2 font-mono text-[10px] tracking-[0.34em] text-emerald-400">
              <TrainFront size={12} aria-hidden /> SECTOR 06 // RAJMARG — THE IRON LEDGER
            </p>
            <h1 className="mt-2 font-display text-4xl font-bold leading-none tracking-tight text-text sm:text-5xl">
              THE <span className="glow-text text-emerald-400">RAJMARG</span> LEDGER
            </h1>
          </div>
          <MetaRail
            icon={Signal}
            title="SECTOR FEED"
            lines={['FEED — OGD PLATFORM v2', 'SOURCE — MoR · PIB', 'AS OF — FY 2024-25']}
          />
        </div>

        <RailwaysDashboard />
      </div>
    </main>
  )
}
