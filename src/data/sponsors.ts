// Confirmed 2026 announcements and logo sources are recorded in design/ASSETS.md.
export interface Sponsor {
  name: string;
  logo?: string;
  href: string;
  role?: string;
}

export interface SponsorTier {
  tier: string;
  slots: number;
  sponsors: Sponsor[];
}

export const SPONSOR_TIERS: SponsorTier[] = [
  {
    tier: 'Title',
    slots: 1,
    sponsors: [{ name: 'Synchrony', logo: '/sponsors/synchrony.webp', href: 'https://www.synchrony.com', role: 'Title Sponsor' }],
  },
  {
    tier: 'Partners',
    slots: 5,
    sponsors: [
      { name: 'Coca-Cola', logo: '/sponsors/coca-cola.webp', href: 'https://www.coca-cola.com/in/en', role: 'Proshow, Comedy Night and Beverages Partner' },
      { name: 'realme', href: 'https://www.realme.com/in/', role: 'Pronite and Smartphone Partner' },
      { name: 'Wonderla', logo: '/sponsors/wonderla.webp', href: 'https://www.wonderla.com', role: 'Partner' },
      { name: 'White Heaven Entertainments', logo: '/sponsors/white-heaven-entertainments.webp', href: 'https://whiteheavenentertainments.in', role: 'Partner' },
      { name: 'Media Plus', logo: '/sponsors/media-plus.webp', href: 'https://mediaplusgroup.in', role: 'Official Media Partner' },
    ],
  },
  {
    tier: 'Event partners',
    slots: 11,
    sponsors: [
      { name: 'IBM', logo: '/sponsors/ibm.webp', href: 'https://www.ibm.com', role: 'QuantumVerse' },
      { name: 'Catalyst by Zoho', logo: '/sponsors/catalyst-by-zoho.webp', href: 'https://www.zoho.com/catalyst/', role: 'Powered by · Hacksphere 3.0' },
      { name: 'Texas Instruments', href: 'https://www.ti.com', role: 'Embedded Systems Workshop' },
      { name: 'Wall Street Mojo', logo: '/sponsors/wall-street-mojo.webp', href: 'https://www.wallstreetmojo.com', role: 'Data Tacticx' },
      { name: 'Date Bites by Farmley', logo: '/sponsors/date-bites-by-farmley.webp', href: 'https://www.farmley.com', role: 'Pixel Palette and Concrete Bowling' },
      { name: 'Signal1', href: 'https://www.instagram.com/eco_assoc.bphc/p/Deb02CQRUpZ/', role: 'Finding the Next Signal' },
      { name: 'Techobytes Technologies', logo: '/sponsors/techobytes.webp', href: 'https://techobytes.com', role: 'Agentic AI and Claude Workshop' },
      { name: 'German Gears India', logo: '/sponsors/german-gears-india.webp', href: 'https://germangearsindia.com', role: 'Auto Expo 2026' },
      { name: 'KPMG', logo: '/sponsors/kpmg.webp', href: 'https://kpmg.com/in/en.html', role: 'Title Partner · Break the Case' },
      { name: 'Unstop', logo: '/sponsors/unstop.webp', href: 'https://unstop.com', role: 'Powered by · Break the Case' },
      { name: 'CREST', href: 'https://crest.bits-pilani.ac.in/', role: 'Semiconductor Workshop' },
    ],
  },
];

// credited in the hero, under the logo
export const TITLE_SPONSOR = SPONSOR_TIERS.find((t) => t.tier === 'Title')?.sponsors[0];
