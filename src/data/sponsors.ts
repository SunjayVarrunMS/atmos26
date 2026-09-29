// Synchrony is the confirmed 2026 title sponsor. The other tiers render open
// slots until their sponsors are announced.
export interface SponsorTier {
  tier: string;
  slots: number;
  sponsors: { name: string; logo: string; href: string }[];
}

export const SPONSOR_TIERS: SponsorTier[] = [
  {
    tier: 'Title',
    slots: 1,
    sponsors: [{ name: 'Synchrony', logo: '/sponsors/synchrony.webp', href: 'https://www.synchrony.com' }],
  },
  { tier: 'Associate', slots: 3, sponsors: [] },
  { tier: 'Partners', slots: 8, sponsors: [] },
];

// credited in the hero, under the logo
export const TITLE_SPONSOR = SPONSOR_TIERS.find((t) => t.tier === 'Title')?.sponsors[0];
