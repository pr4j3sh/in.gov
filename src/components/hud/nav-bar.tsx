'use client'

import { Clock3 } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const NAV = [
  { href: '/', label: 'MISSION CONTROL' },
  { href: '/d/agriculture', label: 'AGRICULTURE' },
  { href: '/d/economy', label: 'ECONOMY' },
  { href: '/d/crime', label: 'CRIME' },
  { href: '/d/weather', label: 'WEATHER' },
  { href: '/d/population', label: 'POPULATION' },
  { href: '/d/health', label: 'HEALTH' },
]

function useISTClock() {
  const [now, setNow] = useState<string>('')
  useEffect(() => {
    const tick = () =>
      setNow(
        new Date().toLocaleTimeString('en-IN', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZone: 'Asia/Kolkata',
        }),
      )
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

export function NavBar() {
  const pathname = usePathname()
  const clock = useISTClock()

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-[#04090f]/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <Link href="/" className="group flex min-w-0 items-center gap-3">
          <span className="leading-tight">
            <span className="block font-display text-[15px] font-semibold tracking-[0.3em] text-text">
              IN<span className="text-hud">.</span>GOV
            </span>
            <span className="hidden font-mono text-[8px] tracking-[0.32em] text-text-dim min-[420px]:block">
              INDIA OPEN DATA · MISSION CONTROL
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-sm px-3 py-1.5 font-mono text-[10px] tracking-[0.22em] transition-colors ${
                  active
                    ? 'bg-accent-soft text-accent'
                    : 'text-text-dim hover:text-text'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2 font-mono text-[10px] tracking-[0.18em] text-text-dim">
          <Clock3 size={12} className="text-hud" aria-hidden />
          <span className="hidden sm:inline">IST</span>
          <span className="tabular-nums text-hud">{clock || '--:--:--'}</span>
        </div>
      </div>

      {/* mobile sector strip — thumb-scrollable */}
      <div className="border-t border-line/60 md:hidden">
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-3 py-1.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {NAV.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`shrink-0 rounded-sm px-3 py-1.5 font-mono text-[9px] tracking-[0.22em] transition-colors ${
                  active ? 'bg-accent-soft text-accent' : 'text-text-dim hover:text-text'
                }`}
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </header>
  )
}
