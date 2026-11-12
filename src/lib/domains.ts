export type DomainStatus = 'active' | 'standby'

export interface Domain {
  slug: string
  index: string
  codename: string
  title: string
  tagline: string
  description: string
  accent: string
  icon: 'wheat' | 'chart' | 'bolt' | 'cloud' | 'ship' | 'train' | 'heart' | 'bank' | 'gavel' | 'landmark'
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
      '124 years of monsoon arc (1901–2019), NE India to 2021, heavy rainfall events 2017–2022, CMZ forecast scorecard and subdivision normals.',
    accent: '#38bdf8',
    icon: 'cloud',
    status: 'active',
  },
  {
    slug: 'trade',
    index: '05',
    codename: 'VYAPAAR',
    title: 'Trade',
    tagline: 'Imports & exports',
    description:
      'FY25 merchandise balance −$62.1B (vs −$238B FY24); India–EU surplus +$15B; chemistry exports ₹3.93 L-crore FY25.',
    accent: '#e879f9',
    icon: 'ship',
    status: 'active',
  },
  {
    slug: 'railways',
    index: '06',
    codename: 'RAILNIKH',
    title: 'Railways',
    tagline: 'Iron arteries',
    description:
      'FY25 freight 1,617 MT (+1.6%); ₹1.71 L-crore revenue. The FY21→FY25 recovery arc, the train mix, and the coal backbone.',
    accent: '#22c55e',
    icon: 'train',
    status: 'active',
  },
  {
    slug: 'health',
    index: '07',
    codename: 'SWASTH',
    title: 'Health',
    tagline: 'The health ledger',
    description:
      'Full Immunization Coverage 2019-24 and RHS 2021 staffing gaps — doctors, specialists, nurses and MPWs by state.',
    accent: '#2dd4bf',
    icon: 'heart',
    status: 'active',
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
  {
    slug: 'population',
    index: '10',
    codename: 'JANSANKHYA',
    title: 'Population',
    tagline: 'The people’s ledger',
    description:
      'Census 2011 distilled — the 1901–2011 arc, state splits, sex ratio, workforce participation, density and growth.',
    accent: '#f97316',
    icon: 'landmark',
    status: 'active',
  },
]
