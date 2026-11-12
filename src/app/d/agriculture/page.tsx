import { ArrowLeft, SatelliteDish, Tractor } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { NavBar } from '@/components/hud/nav-bar'
import { MetaRail } from '@/components/hud/meta-rail'
import { AgricultureDashboard } from '@/components/agriculture/dashboard'

export const metadata: Metadata = {
  title: 'Agriculture — Mandi Intelligence · in.gov',
  description:
    'Live APMC mandi prices across India: commodity coverage, state-wise modal prices, price dispersion and a searchable ticker of today’s arrivals.',
}

export default function AgriculturePage() {
  return (
    <main data-domain="agriculture" className="relative min-h-screen">
      <NavBar />

      <div className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
        {/* sector header */}
        <div className="relative flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6 pt-8">
          <div>
            <Link href="/" className="flex w-fit items-center gap-2 font-mono text-[9px] tracking-[0.3em] text-text-dim transition-colors hover:text-hud">
              <ArrowLeft size={12} aria-hidden /> MISSION CONTROL / SECTOR SELECT
            </Link>
            <p className="mt-3 flex w-fit items-center gap-2 font-mono text-[10px] tracking-[0.34em] text-leaf">
              <Tractor size={12} aria-hidden /> SECTOR 01 // ANNAPURNA — AGRICULTURE & FARMER WELFARE
            </p>
            <h1 className="mt-2 font-display text-4xl font-bold leading-none tracking-tight text-text sm:text-5xl">
              MANDI <span className="glow-text text-leaf">INTELLIGENCE</span>
            </h1>
          </div>
          <MetaRail
            icon={SatelliteDish}
            title="SECTOR FEED"
            lines={['FEED — OGD PLATFORM v2', 'SOURCE — data.gov.in', 'UNIT — ₹ / QUINTAL']}
          />
        </div>

        <AgricultureDashboard />
      </div>
    </main>
  )
}
