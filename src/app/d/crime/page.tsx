import { ArrowLeft, Gavel, ShieldHalf } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { NavBar } from '@/components/hud/nav-bar'
import { MetaRail } from '@/components/hud/meta-rail'
import { CrimeDashboard } from '@/components/crime/dashboard'

export const metadata: Metadata = {
  title: 'Crime & Order — Rakshak · in.gov',
  description:
    'NCRB Crime in India 2024 distilled: cognizable crimes nationally and in metros, crime-head rankings, the complaint→FIR funnel and the cyber surge.',
}

export default function CrimePage() {
  return (
    <main data-domain="crime" className="relative min-h-screen">
      <div className="dossier-bg" aria-hidden />
      <div className="dossier-grid" aria-hidden />
      <NavBar />

      <div className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
        {/* sector header */}
        <div className="relative flex flex-wrap items-end justify-between gap-4 border-b border-rose-400/15 pb-6 pt-8">
          <div>
            <Link href="/" className="flex w-fit items-center gap-2 font-mono text-[9px] tracking-[0.3em] text-text-dim transition-colors hover:text-danger">
              <ArrowLeft size={12} aria-hidden /> MISSION CONTROL / SECTOR SELECT
            </Link>
            <p className="mt-3 flex w-fit items-center gap-2 font-mono text-[10px] tracking-[0.34em] text-danger">
              <Gavel size={12} aria-hidden /> SECTOR 09 // RAKSHAK — THE LAW AND ORDER LEDGER
            </p>
            <h1 className="mt-2 font-display text-4xl font-bold leading-none tracking-tight text-text sm:text-5xl">
              THE <span className="glow-text text-rose-400">RAKSHAK</span> LEDGER
            </h1>
          </div>
          <MetaRail
            icon={ShieldHalf}
            title="SECTOR FEED"
            lines={['FEED — NCRB 2024 PRINT', 'SOURCE — NCRB · opencity.in', 'STATUS — ARCHIVED EDITION']}
          />
        </div>

        <CrimeDashboard />
      </div>
    </main>
  )
}
