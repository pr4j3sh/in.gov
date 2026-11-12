'use client'

import { motion } from 'framer-motion'
import {
  ArrowRight,
  ChartLine,
  CloudSun,
  HeartPulse,
  Landmark,
  Users,
  Gavel,
  Lock,
  Ship,
  TrainFront,
  Wheat,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import type { CSSProperties } from 'react'
import Link from 'next/link'
import { GhostNumeral } from '@/components/hud/ghost-numeral'
import type { Domain } from '@/lib/domains'

const ICONS: Record<Domain['icon'], LucideIcon> = {
  wheat: Wheat,
  chart: ChartLine,
  bolt: Zap,
  cloud: CloudSun,
  ship: Ship,
  train: TrainFront,
  heart: HeartPulse,
  bank: Landmark,
  gavel: Gavel,
  landmark: Users,
}

export function DomainGrid({ domains }: { domains: Domain[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {domains.map((d, i) => {
        const active = d.status === 'active'
        const Icon = ICONS[d.icon]
        const card = (
          <motion.div
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.06, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className={`standby-card ${active ? 'active-card' : 'standby-locked'} group relative flex h-full flex-col overflow-hidden rounded-md border p-5 ${
              active
                ? ''
                : 'border-indigo-300/15 bg-gradient-to-br from-panel-2/90 to-panel/70'
            }`}
            style={{ '--card-accent': d.accent } as CSSProperties}
          >
            <GhostNumeral value={d.index} active={active} />

            <div className="flex items-start justify-between gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-sm border"
                style={{
                  borderColor: `${d.accent}55`,
                  background: `${d.accent}17`,
                  boxShadow: active ? `0 0 26px ${d.accent}55, inset 0 0 12px ${d.accent}33` : 'inset 0 0 10px rgba(0,0,0,0.35)',
                }}
              >
                <Icon size={22} strokeWidth={1.7} color={active ? d.accent : '#7c829b'} aria-hidden />
              </div>
              {active ? (
                <span
                  className="inline-flex items-center gap-1.5 rounded-sm border px-2 py-0.5 font-mono text-[9px] tracking-[0.2em]"
                  style={{
                    borderColor: `${d.accent}66`,
                    background: `${d.accent}1f`,
                    color: d.accent,
                    boxShadow: `0 0 14px ${d.accent}44`,
                  }}
                >
                  <span className="status-dot h-1 w-1 rounded-full bg-current" />
                  ACTIVE
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-sm border border-indigo-300/20 px-2 py-0.5 font-mono text-[9px] tracking-[0.2em] text-text-dim">
                  <Lock size={9} strokeWidth={2.4} aria-hidden />
                  STANDBY
                </span>
              )}
            </div>

            <p className="mt-4 font-mono text-[9px] tracking-[0.3em] text-indigo-300/60">
              {d.codename} · SECTOR {d.index}
            </p>
            <h3 className="mt-1 font-display text-xl font-semibold text-text">
              {d.title}
              <span className="ml-2 align-middle font-mono text-[9px] font-normal tracking-[0.18em]" style={{ color: active ? d.accent : '#6d6d92' }}>
                / {d.tagline.toUpperCase()}
              </span>
            </h3>
            <p className="mt-2 text-[12px] leading-relaxed text-text-dim">{d.description}</p>

            <div className="mt-auto pt-4">
              {active ? (
                <span className="inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.26em]" style={{ color: d.accent }}>
                  ENTER DASHBOARD
                  <ArrowRight size={12} strokeWidth={2.2} aria-hidden className="transition-transform duration-300 group-hover:translate-x-1.5" />
                </span>
              ) : (
                <span className="font-mono text-[9px] tracking-[0.26em] text-text-dim/70">
                  ON THE MANIFEST · PENDING UPLINK
                </span>
              )}
            </div>
          </motion.div>
        )

        return active ? (
          <Link key={d.slug} href={`/d/${d.slug}`} aria-label={`Open ${d.title} dashboard`}>
            {card}
          </Link>
        ) : (
          <div key={d.slug} aria-disabled="true" title="Coming soon">
            {card}
          </div>
        )
      })}
    </div>
  )
}
