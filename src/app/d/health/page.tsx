import { ArrowLeft, Stethoscope, ShieldPlus } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { NavBar } from '@/components/hud/nav-bar'
import { MetaRail } from '@/components/hud/meta-rail'
import { HealthDashboard } from '@/components/health/dashboard'

export const metadata: Metadata = {
  title: 'Health — The Swasth Ledger · in.gov',
  description:
    'Full Immunization Coverage 2019-20 → 2023-24 and the RHS 2021 staffing gaps — doctors, specialists, nurses, paramedical — across India.',
}

export default function HealthPage() {
  return (
    <main data-domain="health" className="relative min-h-screen">
      <div className="pulse-bg" aria-hidden />
      <div className="pulse-grid" aria-hidden />
      <NavBar />

      <div className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
        <div className="relative flex flex-wrap items-end justify-between gap-4 border-b border-teal-400/15 pb-6 pt-8">
          <div>
            <Link href="/" className="flex w-fit items-center gap-2 font-mono text-[9px] tracking-[0.3em] text-text-dim transition-colors hover:text-teal-300">
              <ArrowLeft size={12} aria-hidden /> MISSION CONTROL / SECTOR SELECT
            </Link>
            <p className="mt-3 flex w-fit items-center gap-2 font-mono text-[10px] tracking-[0.34em] text-teal-300">
              <Stethoscope size={12} aria-hidden /> SECTOR 07 // SWASTH — THE HEALTH LEDGER
            </p>
            <h1 className="mt-2 font-display text-4xl font-bold leading-none tracking-tight text-text sm:text-5xl">
              THE <span className="glow-text text-teal-300">SWASTH</span> LEDGER
            </h1>
          </div>
          <MetaRail
            icon={ShieldPlus}
            title="SECTOR FEED"
            lines={['FEED — OGD PLATFORM v2', 'SOURCE — MoHFW / RHS', 'AS OF — FIC 2023-24 · RHS 2021']}
          />
        </div>

        <HealthDashboard />
      </div>
    </main>
  )
}
