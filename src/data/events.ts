// The ATMOS '26 line-up, from the events team's brochure sheet. Prize pools are
// as the sheet lists them and fees are the outside-participant price. Days, team
// sizes and details stay "TBA" until each event opens. Organising clubs are from
// the DEPP brochure, with names and taglines from SU Connect; no contacts.

export type Category = 'competitions' | 'workshops' | 'experiences';

export const CATEGORIES: { id: Category; label: string; blurb: string }[] = [
  { id: 'competitions', label: 'Competitions', blurb: 'Prize-pool events for teams and solo entrants.' },
  { id: 'workshops', label: 'Workshops', blurb: 'Hands-on sessions: AI, quantum, rocketry, PCBs and more.' },
  { id: 'experiences', label: 'Experiences', blurb: 'Escape rooms, stargazing, sim rigs and a rage room. Walk in and play.' },
];

// names, taglines and logos as SU Connect lists them (su-connect-bphc.vercel.app/clubs/<slug>).
// Alchemy has no logo: SU Connect currently shows E-Cell's in its place.
export interface Club {
  name: string;
  tagline: string;
  logo?: string;
}

const CLUB_LIST = {
  'ace': { name: 'Association of Chemical Engineers', tagline: 'The branch association for Chemical Engineering.', logo: '/clubs/ace.webp' },
  'acm': { name: 'ACM', tagline: 'Student chapter of the global ACM organisation.', logo: '/clubs/acm.webp' },
  'acm-w': { name: 'ACM-W', tagline: "The women's chapter of ACM BPHC.", logo: '/clubs/acm-w.webp' },
  'ad-astra': { name: 'Ad Astra', tagline: 'Astronomy and astrophysics on campus.', logo: '/clubs/ad-astra.webp' },
  'alchemy': { name: 'Alchemy', tagline: 'The branch association for Chemistry.' },
  'arc': { name: 'Automation and Robotics Club', tagline: 'Electronics, mechanics and programming, combined.', logo: '/clubs/arc.webp' },
  'axiom': { name: 'Axiom', tagline: 'The branch association for Mathematics.', logo: '/clubs/axiom.webp' },
  'bhcg': { name: 'BHCG', tagline: 'Hands-on consulting and product management.', logo: '/clubs/bhcg.webp' },
  'blocksoc': { name: 'BlockSoc', tagline: 'The blockchain society of BPHC.', logo: '/clubs/blocksoc.webp' },
  'cea': { name: 'Civil Engineering Association', tagline: 'The branch association for Civil Engineering.', logo: '/clubs/cea.webp' },
  'crux': { name: 'CRUX', tagline: 'The programming and computing club of BPHC.', logo: '/clubs/crux.webp' },
  'csa': { name: 'Computer Science Association', tagline: 'The branch association for Computer Science.', logo: '/clubs/csa.webp' },
  'economics-association': { name: 'Economics Association', tagline: 'The branch association for Economics.', logo: '/clubs/economics-association.webp' },
  'ieee': { name: 'IEEE', tagline: 'Student branch of the global IEEE organization.', logo: '/clubs/ieee.webp' },
  'mea': { name: 'Mechanical Engineering Association', tagline: 'The branch association for Mechanical Engineering.', logo: '/clubs/mea.webp' },
  'panacea': { name: 'Panacea', tagline: 'The branch association for Pharmacy.', logo: '/clubs/panacea.webp' },
  'phoenix': { name: 'PHoEnix Association', tagline: 'The branch association for EnI, EEE and ECE.', logo: '/clubs/phoenix.webp' },
  'seds': { name: 'SEDS', tagline: 'The aerospace club of BPHC.', logo: '/clubs/seds.webp' },
  'spectrum': { name: 'Spectrum', tagline: 'The branch association for Physics.', logo: '/clubs/spectrum.webp' },
  'synapsis': { name: 'Synapsis', tagline: 'The branch association for Biology.', logo: '/clubs/synapsis.webp' },
  'traders': { name: 'Traders@BPHC', tagline: 'Trading, finance and the stock market.', logo: '/clubs/traders.webp' },
  'wall-street': { name: 'The Wall Street Club', tagline: 'The finance and management club on campus.', logo: '/clubs/wall-street.webp' },
} satisfies Record<string, Club>;

export type ClubSlug = keyof typeof CLUB_LIST;
export const CLUBS: Record<ClubSlug, Club> = CLUB_LIST;

export const clubUrl = (slug: ClubSlug) => `https://su-connect-bphc.vercel.app/clubs/${slug}`;

export interface FestEvent {
  id: string;
  title: string;
  category: Category;
  /** rupees; null when there is none or it isn't announced */
  prize: number | null;
  /** outside-participant price: 'Free', '₹399', '₹250 per 10 min', 'TBA' … */
  fee: string;
  team?: string;
  note?: string;
  /** organising club(s), joint events list more than one */
  clubs?: ClubSlug[];
  /** 4:3 photo, /events/<id>.webp unless set. A generated stand-in until the club's
   * poster arrives, then the poster replaces that file (see design/ASSETS.md). */
  image?: string;
}

const LIST: FestEvent[] = [
  // competitions
  { id: 'break-the-case', title: 'Break The Case', category: 'competitions', prize: 400000, fee: 'Free', note: 'Consulting case competition', clubs: ['bhcg'] },
  { id: 'robowars', title: 'Robowars', category: 'competitions', prize: 215000, fee: '₹900', note: 'With Robo Soccer and Robo Sumo', clubs: ['phoenix'] },
  { id: 'wall-street-business', title: 'Wall Street Business Challenge', category: 'competitions', prize: 60000, fee: 'TBA', note: 'Case competition', clubs: ['economics-association', 'wall-street'] },
  { id: 'astro-datathon', title: 'Astro ML Datathon', category: 'competitions', prize: 50000, fee: '₹125', clubs: ['ad-astra', 'csa'] },
  { id: 'analytics-datathon', title: 'Datathon: Data Analytics', category: 'competitions', prize: 50000, fee: '₹150', clubs: ['bhcg'] },
  { id: 'pit-trading', title: 'Pit Trading Competition', category: 'competitions', prize: 50000, fee: '₹249', clubs: ['traders'] },
  { id: 'hackathon', title: 'Hackathon', category: 'competitions', prize: 50000, fee: 'Free' },
  { id: 'mech-ideathon', title: 'Mechanical Ideathon', category: 'competitions', prize: 35000, fee: '₹200', clubs: ['mea'] },
  { id: 'wall-street-analytics', title: 'Wall Street Analytics Challenge', category: 'competitions', prize: 35000, fee: 'TBA', clubs: ['wall-street'] },
  { id: 'anatomy-of-murder', title: 'Anatomy of Murder', category: 'competitions', prize: 35000, fee: 'Free', clubs: ['synapsis'] },
  { id: 'trick-of-trade', title: 'Trick of Trade', category: 'competitions', prize: 30000, fee: '₹49', clubs: ['economics-association'] },
  { id: 'cruxipher', title: 'cruXipher', category: 'competitions', prize: 30000, fee: 'Free', clubs: ['crux'] },
  { id: 'coinquest', title: 'Coinquest', category: 'competitions', prize: 25000, fee: '₹99', clubs: ['blocksoc', 'traders'] },
  { id: 'arthasastra', title: 'Arthasastra', category: 'competitions', prize: 25000, fee: 'Free', clubs: ['economics-association'] },
  { id: 'coding-contest', title: 'Coding Contest', category: 'competitions', prize: 25000, fee: 'Free' },
  { id: 'enigma', title: 'Enigma', category: 'competitions', prize: 20000, fee: '₹400–800 per team', team: '1–4', clubs: ['blocksoc'] },
  { id: 'bulls-and-brains', title: 'Bulls & Brains', category: 'competitions', prize: 20000, fee: '₹199', clubs: ['traders'] },
  { id: 'blitz-cup', title: 'Blitz Cup', category: 'competitions', prize: 20000, fee: 'Free', clubs: ['crux'] },
  { id: 'defuse-the-bomb', title: 'Defuse the Bomb', category: 'competitions', prize: 10000, fee: '₹180 per team', team: '2–4', note: 'Maths-themed game room · Two-day event', clubs: ['axiom'] },
  { id: 'agent-competition', title: 'Agent Competition', category: 'competitions', prize: 9000, fee: '₹100', clubs: ['crux'] },
  { id: 'fifa-auction', title: 'FIFA Auction', category: 'competitions', prize: 8000, fee: '₹179', clubs: ['ace'] },
  { id: 'concrete-bowling', title: 'Concrete Bowling', category: 'competitions', prize: 6000, fee: '₹200', clubs: ['cea'] },
  { id: 'escape-room', title: 'Escape Room', category: 'competitions', prize: 5000, fee: '₹80 per head', team: '4–7', clubs: ['spectrum'] },
  { id: 'ecosnap', title: 'EcoSnap Contest', category: 'competitions', prize: 5000, fee: '₹60', clubs: ['synapsis'] },
  { id: 'ai-slop-slayer', title: 'AI Slop Slayer', category: 'competitions', prize: 5000, fee: '₹400', clubs: ['acm'] },
  { id: 'last-autopsy', title: 'The Last Autopsy', category: 'competitions', prize: 5000, fee: '₹250', clubs: ['panacea'] },
  { id: 'arg', title: 'ARG', category: 'competitions', prize: 5000, fee: '₹50 per person', team: '3', clubs: ['crux', 'acm-w'] },
  { id: 'cubing', title: 'CubingATMOS 2026', category: 'competitions', prize: null, fee: '₹900', note: 'Two-day event', clubs: ['axiom'] },

  // workshops
  { id: 'prompt-lab', title: 'Prompt Lab: AI Workshop', category: 'workshops', prize: 8000, fee: '₹799', clubs: ['ace'] },
  { id: 'card-counting', title: 'Card Counting Workshop & Showdown', category: 'workshops', prize: 6000, fee: '₹170', note: 'One-day event', clubs: ['axiom'] },
  { id: 'ti-workshop', title: 'TI Workshop', category: 'workshops', prize: null, fee: '₹1499', clubs: ['seds'] },
  { id: 'model-rocketry', title: 'Model Rocketry Workshop', category: 'workshops', prize: null, fee: '₹1499', clubs: ['seds'] },
  { id: 'pcb-workshop', title: 'PCB Workshop', category: 'workshops', prize: null, fee: '₹1499', clubs: ['seds'] },
  { id: 'quantum-computing', title: 'Quantum Computing Workshop', category: 'workshops', prize: null, fee: '₹399', clubs: ['ieee'] },
  { id: 'machine-learning', title: 'Machine Learning Workshop', category: 'workshops', prize: null, fee: '₹399', clubs: ['ieee'] },
  { id: 'analog-electronics', title: 'Analog Electronics Workshop', category: 'workshops', prize: null, fee: '₹399', clubs: ['ieee'] },
  { id: 'digital-design', title: 'Digital Design Workshop', category: 'workshops', prize: null, fee: '₹299', clubs: ['ieee'] },
  { id: 'exoplanet-detection', title: 'Exoplanet Detection Workshop', category: 'workshops', prize: null, fee: '₹249', clubs: ['ad-astra'] },
  { id: 'etch-a-sketch', title: 'Etch-A-Sketch Workshop', category: 'workshops', prize: null, fee: '₹600' },
  { id: 'aroma-workshop', title: 'Aroma Workshop', category: 'workshops', prize: null, fee: '₹350', note: 'Candles and perfumes', clubs: ['panacea'] },
  { id: 'semiconductor', title: 'Semiconductor Workshop', category: 'workshops', prize: null, fee: 'TBA', clubs: ['alchemy'] },
  { id: 'perfume', title: 'Make Your Own Perfume', category: 'workshops', prize: null, fee: 'TBA', clubs: ['alchemy'] },

  // experiences
  { id: 'stargazing', title: 'Stargazing', category: 'experiences', prize: null, fee: '₹149', clubs: ['ad-astra'] },
  { id: 'solar-gazing', title: 'Solar Gazing', category: 'experiences', prize: null, fee: '₹99', clubs: ['ad-astra'] },
  { id: 'f1-simrig', title: 'F1 SimRig', category: 'experiences', prize: null, fee: '₹250 per 10 min', clubs: ['arc'] },
  { id: 'rage-room', title: 'Rage Room', category: 'experiences', prize: null, fee: '₹250', clubs: ['cea'] },
  { id: 'arcade-machine', title: 'Arcade Machine', category: 'experiences', prize: null, fee: '₹150' },
  { id: 'period-pain-simulator', title: 'Period Pain Simulator', category: 'experiences', prize: null, fee: '₹100', clubs: ['synapsis'] },
  { id: 'chemistry-casino', title: 'Chemistry Casino', category: 'experiences', prize: null, fee: 'TBA', clubs: ['alchemy'] },
  { id: 'tech-tiranga', title: 'Tech Tiranga', category: 'experiences', prize: null, fee: 'TBA', clubs: ['seds'] },
  { id: 'auto-expo', title: 'Auto Expo', category: 'experiences', prize: null, fee: 'TBA', clubs: ['mea'] },
];

// by category, then biggest prize first; events without a prize keep list order
const order = CATEGORIES.map((c) => c.id);
export const EVENTS: (FestEvent & { image: string })[] = LIST.map((e) => ({ ...e, image: e.image ?? `/events/${e.id}.webp` })).sort(
  (a, b) => order.indexOf(a.category) - order.indexOf(b.category) || (b.prize ?? -1) - (a.prize ?? -1),
);

export const formatPrize = (p: number | null) => (p === null ? '—' : `₹${p.toLocaleString('en-IN')}`);

// one line for an event's share card and page: prize, entry, organisers
export function eventSummary(e: FestEvent) {
  const by = e.clubs?.map((c) => CLUBS[c].name).join(' × ');
  return [
    e.prize !== null && `${formatPrize(e.prize)} prize pool`,
    e.fee !== 'TBA' && `Entry ${e.fee === 'Free' ? 'free' : e.fee}`,
    by && `By ${by}`,
  ]
    .filter(Boolean)
    .join(' · ');
}

export const isCategory = (v: string | null): v is Category =>
  v === 'competitions' || v === 'workshops' || v === 'experiences';
