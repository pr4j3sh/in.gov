import { ArrowLeft, Zap, Activity } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { NavBar } from '@/components/hud/nav-bar'
import { MetaRail } from '@/components/hud/meta-rail'
import { EnergyDashboard } from '@/components/energy/dashboard'

export const metadata: Metadata = {
  title: 'Energy — The Urja Ledger · in.gov',
  description:
    'India’s power mix FY22-25: 1,829.7 BU generated, 25.5% non-fossil, nuclear decade +35%, solar leaderboard FY23.',
}

export default function EnergyPage() {
  return (
    <main data-domain="energy" className="relative min-h-screen">
      <div className="urja-bg" aria-hidden />
      <div className="urja-grid" aria-hidden />
      <NavBar />

      <div className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
        <div className="relative flex flex-wrap items-end justify-between gap-4 border-b border-yellow-400/15 pb-6 pt-8">
          <div>
            <Link href="/" className="flex w-fit items-center gap-2 font-mono text-[9px] tracking-[0.3em] text-text-dim transition-colors hover:text-yellow-400">
              <ArrowLeft size={12} aria-hidden /> MISSION CONTROL / SECTOR SELECT
            </Link>
            <p className="mt-3 flex w-fit items-center gap-2 font-mono text-[10px] tracking-[0.34em] text-yellow-400">
              <Zap size={12} aria-hidden /> SECTOR 03 // URJA — THE AMPERAGE LEDGER
            </p>
            <h1 className="mt-2 font-display text-4xl font-bold leading-none tracking-tight text-text sm:text-5xl">
              THE <span className="glow-text text-yellow-400">URJA</span> LEDGER
            </h1>
          </div>
          <MetaRail
            icon={Activity}
            title="SECTOR FEED"
            lines={['FEED — OGD PLATFORM v2', 'SOURCE — MoP · PIB', 'AS OF — FY 2024-25']}
          />
        </div>

        <EnergyDashboard />
      </div>
    </main>
  )
}
