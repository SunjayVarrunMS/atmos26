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
  // registration isn't open yet; flip this and set the url when it is
  registration: { open: false, url: '' as string },
  coordinates: { lat: 17.5449, lng: 78.5718 },
  // absolute links for share cards; WhatsApp and Instagram ignore relative ones
  url: 'https://atmos26.vercel.app',
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
  { to: '/proshows', label: 'Proshows' },
  { to: '/gallery', label: 'Gallery' },
  { to: '/sponsors', label: 'Sponsors' },
  { to: '/contact', label: 'Contact' },
] as const;

export const GALLERY = [
  { src: '/gallery/proshow.jpg', caption: 'Proshow night' },
  { src: '/gallery/robo_soccer.jpg', caption: 'Robo Soccer' },
  { src: '/gallery/drone_league.jpg', caption: 'Drone League' },
  { src: '/gallery/tech_expo.jpg', caption: 'Tech Expo' },
  { src: '/gallery/actors_guest_talks.jpg', caption: 'Guest talks' },
  { src: '/gallery/ad_astra.jpg', caption: 'Ad Astra' },
  { src: '/gallery/comedy_night.jpg', caption: 'Comedy night' },
  { src: '/gallery/dota_events.jpg', caption: 'DoTA events' },
  { src: '/gallery/puzzle_event.jpg', caption: 'Puzzle hunt' },
  { src: '/gallery/speed_cubing.jpg', caption: 'Speed cubing' },
  { src: '/gallery/womenInCode.jpg', caption: 'Women in Code' },
] as const;
