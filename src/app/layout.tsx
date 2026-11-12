import { Space_Grotesk, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'in.gov — India Open Data, Mission Control',
  description:
    'in.gov — a futuristic command deck for India’s open government data (data.gov.in): live mandi prices, and curated domain dashboards for agriculture, economy, energy and more.',
  keywords: ['India', 'open data', 'data.gov.in', 'mandi prices', 'dashboard', 'OGD'],
}

export const viewport: Viewport = {
  themeColor: '#04090f',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen antialiased">
        <div className="hud-bg" aria-hidden />
        <div className="hud-grid" aria-hidden />
        <div className="hud-scanlines" aria-hidden />
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
