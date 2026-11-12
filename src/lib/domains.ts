export type DomainStatus = 'active' | 'standby'

export interface Domain {
  slug: string
  index: string
  codename: string
  title: string
  tagline: string
  description: string
  accent: string
  icon: 'wheat' | 'chart' | 'bolt' | 'cloud' | 'ship' | 'train' | 'heart' | 'bank' | 'gavel'
  status: DomainStatus
}

export const DOMAINS: Domain[] = [
  {
    slug: 'agriculture',
    index: '01',
    codename: 'ANNAPURNA',
    title: 'Agriculture',
    tagline: 'Mandi intelligence',
    description:
      'Daily wholesale (APMC mandi) prices across 2,000+ markets — compare commodities, track state-wise modal prices and spot price dispersion.',
    accent: '#34d399',
    icon: 'wheat',
    status: 'active',
  },
  {
    slug: 'economy',
    index: '02',
    codename: 'ARTHVYAVASTHA',
    title: 'Economy',
    tagline: 'Inflation & industry',
    description:
      'CPI inflation — the index that moves the nation’s mortgage, ration and interest decisions. Trend, pressure points and the full print history.',
    accent: '#f5c15c',
    icon: 'chart',
    status: 'active',
  },
  {
    slug: 'energy',
    index: '03',
    codename: 'URJA',
    title: 'Energy',
    tagline: 'Power grid telemetry',
    description:
      'Generation and consumption by source — thermal, hydro, solar, wind — across states and regions.',
    accent: '#fde047',
    icon: 'bolt',
    status: 'standby',
  },
  {
    slug: 'weather',
    index: '04',
    codename: 'VAYUMANDAL',
    title: 'Weather & Rainfall',
    tagline: 'Monsoon watch',
    description:
      'IMD district-wise rainfall, monsoon progress and extreme-weather bulletins across India.',
    accent: '#7dd3fc',
    icon: 'cloud',
    status: 'standby',
  },
  {
    slug: 'trade',
    index: '05',
    codename: 'VYAPAAR',
    title: 'Trade',
    tagline: 'Imports & exports',
    description:
      'DGCI&S foreign trade statistics by HS code and country — what India sells and buys.',
    accent: '#f0abfc',
    icon: 'ship',
    status: 'standby',
  },
  {
    slug: 'railways',
    index: '06',
    codename: 'RAILNIKH',
    title: 'Railways',
    tagline: 'Iron arteries',
    description:
      'Zone-wise freight and passenger movement — the steel network that hauls the economy.',
    accent: '#fda4af',
    icon: 'train',
    status: 'standby',
  },
  {
    slug: 'health',
    index: '07',
    codename: 'AROGYA',
    title: 'Health',
    tagline: 'Public health signals',
    description:
      'Immunization coverage, hospital statistics and disease-surveillance indicators nationwide.',
    accent: '#5eead4',
    icon: 'heart',
    status: 'standby',
  },
  {
    slug: 'budget',
    index: '08',
    codename: 'KOSHAKAR',
    title: 'Budget & FinMin',
    tagline: 'Where every rupee flows',
    description:
      'Union budget expenditure, receipts and scheme-wise allocations — open books, real time.',
    accent: '#c4b5fd',
    icon: 'bank',
    status: 'standby',
  },
  {
    slug: 'crime',
    index: '09',
    codename: 'RAKSHAK',
    title: 'Crime & Order',
    tagline: 'The law and order ledger',
    description:
      'Cognizable crimes nationally and in metros — 2022→2024 trends, crime-head rankings, the complaint→FIR funnel and the cyber surge.',
    accent: '#fb7185',
    icon: 'gavel' as Domain['icon'],
    status: 'active',
  },
]
