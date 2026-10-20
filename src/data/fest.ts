// Single source of truth for fest facts. Anything not confirmed by the team
// is marked as a placeholder where it is rendered, never invented.

export const FEST = {
  name: 'ATMOS',
  edition: '2026',
  theme: 'Augmented Ascension',
  subtheme: 'The Transitional Convergence',
  college: 'BITS Pilani',
  campus: 'Hyderabad Campus',
  // opening ceremony, IST
  startsAt: new Date('2026-10-23T09:00:00+05:30'),
  endsAt: new Date('2026-10-25T23:59:00+05:30'),
  days: [
    { date: '23', weekday: 'Fri', month: 'Oct' },
    { date: '24', weekday: 'Sat', month: 'Oct' },
    { date: '25', weekday: 'Sun', month: 'Oct' },
  ],
  // registration runs on Flemmingo, the "Registration link" in the fest's Instagram bio
  registration: { open: true, url: 'https://flemmingo.in/fests/cmv5ldlzu0000lb06f8nmef17' as string },
  coordinates: { lat: 17.5449, lng: 78.5718 },
  // absolute links for share cards; WhatsApp and Instagram ignore relative ones
  url: 'https://atmos-bits.com',
} as const;

export const CONTACT = {
  email: 'atmos@hyderabad.bits-pilani.ac.in',
  instagram: '@atmos_bitshyd',
  instagramHref: 'https://www.instagram.com/atmos_bitshyd/',
  address: 'BITS Pilani, Hyderabad Campus, Jawahar Nagar, Kapra Mandal, Medchal District, Telangana 500078',
  mapsHref: 'https://maps.google.com/?q=BITS+Pilani+Hyderabad+Campus',
  mapsEmbed: 'https://www.google.com/maps?q=17.5449,78.5718&z=15&output=embed',
} as const;

// figures from previous editions
export const STATS = [
  { value: 30000, suffix: '+', label: 'Footfall', note: 'across three days' },
  { value: 40, suffix: '+', label: 'Events', note: 'competitions, workshops, experiences' },
  { value: 12, prefix: '₹', suffix: 'L+', label: 'Prize pool', note: 'in lakhs of rupees' },
  { value: 150, suffix: '+', label: 'Colleges', note: 'from across India' },
] as const;

export const NAV = [
  { to: '/events', label: 'Events' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/sponsors', label: 'Sponsors' },
  { to: '/contact', label: 'Contact' },
] as const;

// w × h are the files' pixel sizes, so the page can reserve their space before they load;
// `small` is a 960 px wide copy for phones and the masonry grid (see design/ASSETS.md)
export const GALLERY = [
  { src: '/gallery/proshow.jpg', caption: 'Proshow night', w: 2048, h: 1366, small: '/gallery/proshow-960.jpg' },
  { src: '/gallery/robo_soccer.jpg', caption: 'Robo Soccer', w: 1440, h: 1800, small: '/gallery/robo_soccer-960.jpg' },
  { src: '/gallery/drone_league.jpg', caption: 'Drone League', w: 2048, h: 1638, small: '/gallery/drone_league-960.jpg' },
  { src: '/gallery/tech_expo.jpg', caption: 'Tech Expo', w: 2048, h: 1638, small: '/gallery/tech_expo-960.jpg' },
  { src: '/gallery/actors_guest_talks.jpg', caption: 'Guest talks', w: 2048, h: 1536, small: '/gallery/actors_guest_talks-960.jpg' },
  { src: '/gallery/ad_astra.jpg', caption: 'Ad Astra', w: 2048, h: 1365, small: '/gallery/ad_astra-960.jpg' },
  { src: '/gallery/comedy_night.jpg', caption: 'Comedy night', w: 2048, h: 1365, small: '/gallery/comedy_night-960.jpg' },
  { src: '/gallery/dota_events.jpg', caption: 'DoTA events', w: 2048, h: 1365, small: '/gallery/dota_events-960.jpg' },
  { src: '/gallery/puzzle_event.jpg', caption: 'Puzzle hunt', w: 800, h: 800 },
  { src: '/gallery/speed_cubing.jpg', caption: 'Speed cubing', w: 800, h: 800 },
  { src: '/gallery/womenInCode.jpg', caption: 'Women in Code', w: 2048, h: 1366, small: '/gallery/womenInCode-960.jpg' },
] as const;

// srcSet for a gallery photo: its 960 px copy where there is one, then the original
export const gallerySrcSet = (g: (typeof GALLERY)[number]) =>
  'small' in g ? `${g.small} 960w, ${g.src} ${g.w}w` : undefined;
