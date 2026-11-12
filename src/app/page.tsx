import { Radar, Orbit, Database, ShieldCheck, CodeXml, Bug } from 'lucide-react'
import Link from 'next/link'
import { DomainGrid } from '@/components/home/domain-grid'
import { ManifestStrip } from '@/components/hud/manifest-strip'
import { MetaRail } from '@/components/hud/meta-rail'
import { NavBar } from '@/components/hud/nav-bar'
import { DOMAINS } from '@/lib/domains'

export default function HomePage() {
  return (
    <main className="relative">
      <NavBar />

      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* ---------- hero ---------- */}
        <section className="relative border-b border-line pb-10 pt-12 md:pt-16">
          <p className="font-mono text-[10px] tracking-[0.34em] text-hud">
            <span className="mr-2 inline-block h-px w-8 translate-y-[-3px] bg-hud/60" />
            NATIONAL OPEN GOVERNMENT DATA · data.gov.in
          </p>

          <h1 className="mt-4 font-display text-5xl font-bold leading-[0.95] tracking-tight text-text sm:text-6xl lg:text-7xl">
            MISSION
            <br />
            <span className="glow-text text-accent">CONTROL</span>
          </h1>

          <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-text-dim">
            India publishes thousands of datasets — and almost nobody can read them.
            in.gov turns raw government feeds into
            <span className="text-text"> curated, sector-grade intelligence decks</span>.
            Live mandi prices; CPI print history; 124 monsoons on tape; the rest of the republic — one sector at a time.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4 font-mono text-[10px] tracking-[0.2em] text-text-dim">
            <span><span className="text-text">10,000+</span> DATASETS ON MANIFEST</span>
            <span><span className="text-text">28</span> STATES + <span className="text-text">8</span> UTs</span>
            <span><span className="text-text">05/10</span> SECTORS ONLINE</span>
          </div>

          <MetaRail
            icon={Radar}
            title="ORDNANCE"
            lines={['FEED : OGD PLATFORM v2', 'LICENSE : NDSAP / GODL-India', 'REFRESH : CONTINUOUS']}
            className="pointer-events-none absolute right-0 top-10"
          />
        </section>

        {/* ---------- domain grid ---------- */}
        <section className="py-10">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="hud-title">SECTION // SECTOR SELECT</p>
              <h2 className="mt-1 font-display text-2xl font-semibold text-text">
                Choose your <span className="text-accent">sector</span>
              </h2>
            </div>
            <p className="hidden font-mono text-[9px] tracking-[0.25em] text-text-dim sm:block">
              5 OF 10 SECTORS ONLINE
            </p>
          </div>

          <DomainGrid domains={DOMAINS} />

          <ManifestStrip
            items={[
              <><Orbit size={12} className="text-hud" aria-hidden /> LIVE data.gov.in FEEDS · NORMALIZED SERVER-SIDE</>,
              <>SECTORS marked <b className="text-text">STANDBY</b> UNLOCK AS DATA CONTRACTS ARE VERIFIED</>,
              <><ShieldCheck size={12} className="text-leaf" aria-hidden /> GODL-INDIA LICENSE</>,
              <Link key="issue" href="https://github.com/pr4j3sh/in.gov/issues/new" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 transition-colors hover:text-text">
                <Bug size={12} className="text-amber" aria-hidden /> FOUND A GAP? <span className="text-amber underline underline-offset-2 decoration-dotted">OPEN AN ISSUE</span>
              </Link>,
            ]}
          />
        </section>

        {/* ---------- footer ---------- */}
        <footer className="flex flex-col gap-3 border-t border-line py-6 font-mono text-[8px] leading-5 tracking-[0.18em] text-text-dim sm:flex-row sm:items-center sm:justify-between sm:gap-2 sm:text-[9px] sm:tracking-[0.22em]">
          <span>IN.GOV · INDIA OPEN DATA MISSION CONTROL</span>
          <span className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="inline-flex items-center gap-2">
              <CodeXml size={12} className="text-hud" aria-hidden />
              <Link href="https://github.com/pr4j3sh/in.gov" target="_blank" rel="noreferrer" className="break-all text-hud hover:underline">github.com/pr4j3sh/in.gov</Link>
            </span>
            <span className="inline-flex items-center gap-2" title="Agri & Economy: live OGD API · Crime: NCRB via opencity.in (CKAN)">
              <Database size={12} className="shrink-0 text-hud" aria-hidden />
              <Link href="https://www.data.gov.in" target="_blank" rel="noreferrer" className="text-hud hover:underline">DATA.GOV.IN</Link>
              <span className="text-text-dim/70">· NCRB VIA <Link href="https://data.opencity.in" target="_blank" rel="noreferrer" className="text-hud hover:underline">OPENCITY.IN</Link></span>
            </span>
          </span>
        </footer>
      </div>
    </main>
  )
}
