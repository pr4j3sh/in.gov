import { ArrowLeft, BookOpenCheck, Scale } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { NavBar } from '@/components/hud/nav-bar'
import { MetaRail } from '@/components/hud/meta-rail'
import { EconomyDashboard } from '@/components/economy/dashboard'

export const metadata: Metadata = {
  title: 'Economy — The Ledger · in.gov',
  description:
    'CPI inflation distilled: the one number that moves the republic — trend, RBI corridor, basket-level pressure points and the full monthly print history.',
}

export default function EconomyPage() {
  return (
    <main data-domain="economy" className="relative min-h-screen">
      <div className="ledger-bg" aria-hidden />
      <div className="ledger-grid" aria-hidden />
      <NavBar />

      <div className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
        {/* sector header */}
        <div className="relative flex flex-wrap items-end justify-between gap-4 border-b border-amber-400/15 pb-6 pt-8">
          <div>
            <Link href="/" className="flex w-fit items-center gap-2 font-mono text-[9px] tracking-[0.3em] text-text-dim transition-colors hover:text-amber">
              <ArrowLeft size={12} aria-hidden /> MISSION CONTROL / SECTOR SELECT
            </Link>
            <p className="mt-3 flex w-fit items-center gap-2 font-mono text-[10px] tracking-[0.34em] text-amber">
              <Scale size={12} aria-hidden /> SECTOR 02 // ARTHVYAVASTHA — THE INDIAN ECONOMY
            </p>
            <h1 className="mt-2 font-display text-4xl font-bold leading-none tracking-tight text-text sm:text-5xl">
              THE <span className="glow-text text-amber">LEDGER</span>
            </h1>
          </div>
          <MetaRail
            icon={BookOpenCheck}
            title="SECTOR FEED"
            lines={['FEED — OGD PLATFORM v2', 'SOURCE — data.gov.in · MOSPI/CSO', 'UNIT — INDEX (2012=100)']}
          />
        </div>

        <EconomyDashboard />
      </div>
    </main>
  )
}
