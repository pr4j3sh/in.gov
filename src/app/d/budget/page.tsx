import { ArrowLeft, Landmark, ScrollText } from 'lucide-react'
import Link from 'next/link'
import type { Metadata } from 'next'
import { NavBar } from '@/components/hud/nav-bar'
import { MetaRail } from '@/components/hud/meta-rail'
import { BudgetDashboard } from '@/components/finmin/dashboard'

export const metadata: Metadata = {
  title: 'Budget & FinMin — The Koshakar Ledger · in.gov',
  description:
    'GST FY25 collections ₹20.56 lakh-crore (+10%), direct tax mix, Union Budget at a glance, Gender Budget and the disinvestment slide.',
}

export default function BudgetPage() {
  return (
    <main data-domain="budgetfinmin" className="relative min-h-screen">
      <div className="koshakar-bg" aria-hidden />
      <div className="koshakar-grid" aria-hidden />
      <NavBar />

      <div className="mx-auto max-w-7xl px-4 pb-10 sm:px-6">
        <div className="relative flex flex-wrap items-end justify-between gap-4 border-b border-indigo-400/15 pb-6 pt-8">
          <div>
            <Link href="/" className="flex w-fit items-center gap-2 font-mono text-[9px] tracking-[0.3em] text-text-dim transition-colors hover:text-indigo-300">
              <ArrowLeft size={12} aria-hidden /> MISSION CONTROL / SECTOR SELECT
            </Link>
            <p className="mt-3 flex w-fit items-center gap-2 font-mono text-[10px] tracking-[0.34em] text-indigo-300">
              <Landmark size={12} aria-hidden /> SECTOR 08 // KOSHAKAR — THE LEDGER OF THE STATE
            </p>
            <h1 className="mt-2 font-display text-4xl font-bold leading-none tracking-tight text-text sm:text-5xl">
              THE <span className="glow-text text-indigo-300">KOSHAKAR</span> LEDGER
            </h1>
          </div>
          <MetaRail
            icon={ScrollText}
            title="SECTOR FEED"
            lines={['FEED — OGD PLATFORM v2', 'SOURCE — MoF · PIB', 'AS OF — FY 2024-25']}
          />
        </div>

        <BudgetDashboard />
      </div>
    </main>
  )
}
