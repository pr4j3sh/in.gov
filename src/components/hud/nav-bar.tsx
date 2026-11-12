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
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-3">
          <span className="leading-tight">
            <span className="block font-display text-[15px] font-semibold tracking-[0.3em] text-text">
              IN<span className="text-hud">.</span>GOV
            </span>
            <span className="block font-mono text-[8px] tracking-[0.32em] text-text-dim">
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

        <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.18em] text-text-dim">
          <Clock3 size={12} className="text-hud" aria-hidden />
          <span className="hidden sm:inline">IST</span>
          <span className="tabular-nums text-hud">{clock || '--:--:--'}</span>
        </div>
      </div>
    </header>
  )
}
