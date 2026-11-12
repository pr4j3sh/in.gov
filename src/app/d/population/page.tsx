import { ArrowLeft, UsersRound, UserSquare2 } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { NavBar } from '@/components/hud/nav-bar'
import { MetaRail } from '@/components/hud/meta-rail'
import { PopulationDashboard } from '@/components/population/dashboard'

export const metadata: Metadata = {
  title: 'Population — The People\u2019s Ledger · in.gov',
  description:
    'Census 2011 distilled: 1901–2011 arc, state split, sex ratio, workforce participation, density and growth — India, state by state.',
}

export default function PopulationPage() {
  return (
    <main data-domain="population" className="relative min-h-screen">
      <div className="terrazzo-bg" aria-hidden />
      <div className="terrazzo-grid" aria-hidden />
      <NavBar />

      <div className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
        <div className="relative flex flex-wrap items-end justify-between gap-4 border-b border-orange-400/15 pb-6 pt-8">
          <div>
            <Link href="/" className="flex w-fit items-center gap-2 font-mono text-[9px] tracking-[0.3em] text-text-dim transition-colors hover:text-orange-400">
              <ArrowLeft size={12} aria-hidden /> MISSION CONTROL / SECTOR SELECT
            </Link>
            <p className="mt-3 flex w-fit items-center gap-2 font-mono text-[10px] tracking-[0.34em] text-orange-400">
              <UsersRound size={12} aria-hidden /> SECTOR 10 // JANSANKHYA — THE PEOPLE'S LEDGER
            </p>
            <h1 className="mt-2 font-display text-4xl font-bold leading-none tracking-tight text-text sm:text-5xl">
              THE PEOPLE'S <span className="glow-text text-orange-400">LEDGER</span>
            </h1>
          </div>
          <MetaRail
            icon={UserSquare2}
            title="SECTOR FEED"
            lines={['FEED — OGD PLATFORM v2', 'SOURCE — censusindia.gov.in', 'AS OF — CENSUS 2011']}
          />
        </div>

        <PopulationDashboard />
      </div>
    </main>
  )
}
