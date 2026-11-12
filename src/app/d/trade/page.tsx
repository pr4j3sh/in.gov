import { ArrowLeft, Container, Ship } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { NavBar } from '@/components/hud/nav-bar'
import { MetaRail } from '@/components/hud/meta-rail'
import { TradeDashboard } from '@/components/trade/dashboard'

export const metadata: Metadata = {
  title: 'Trade — The Vyapaar Ledger · in.gov',
  description:
    'Merchandise trade balance FY21-25, India–EU ledger and chemicals exports — PIB-reply prints, honestly labeled.',
}

export default function TradePage() {
  return (
    <main data-domain="trade" className="relative min-h-screen">
      <div className="consignment-bg" aria-hidden />
      <div className="consignment-grid" aria-hidden />
      <NavBar />

      <div className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
        <div className="relative flex flex-wrap items-end justify-between gap-4 border-b border-fuchsia-400/15 pb-6 pt-8">
          <div>
            <Link href="/" className="flex w-fit items-center gap-2 font-mono text-[9px] tracking-[0.3em] text-text-dim transition-colors hover:text-fuchsia-400">
              <ArrowLeft size={12} aria-hidden /> MISSION CONTROL / SECTOR SELECT
            </Link>
            <p className="mt-3 flex w-fit items-center gap-2 font-mono text-[10px] tracking-[0.34em] text-fuchsia-400">
              <Container size={12} aria-hidden /> SECTOR 05 // VYAPAAR — THE TRADE LEDGER
            </p>
            <h1 className="mt-2 font-display text-4xl font-bold leading-none tracking-tight text-text sm:text-5xl">
              THE <span className="glow-text text-fuchsia-400">VYAPAAR</span> LEDGER
            </h1>
          </div>
          <MetaRail
            icon={Ship}
            title="SECTOR FEED"
            lines={['FEED — OGD PLATFORM v2', 'SOURCE — Rajya Sabha · MoC&I', 'AS OF — FY 2024-25']}
          />
        </div>

        <TradeDashboard />
      </div>
    </main>
  )
}
