// The ATMOS '26 line-up, from the events on the Flemmingo registration page and
// the DEPP club sheet (14 Oct), plus days, venues, posters and prize pools from the fest's and clubs' Instagram posts
// (up to 20 Oct; a poster's prize beats the sheet's). Flemmingo's ticket prices are final; events it
// doesn't list keep the sheet's outside-participant price. Where these disagree
// with the printed brochure, they win: it was set from an older sheet. Days and team sizes stay "TBA" until the club
// confirms them. Club names and taglines are from SU Connect; no contacts.

export type Category = 'competitions' | 'workshops' | 'experiences';

export const CATEGORIES: { id: Category; label: string; blurb: string }[] = [
  { id: 'competitions', label: 'Competitions', blurb: 'Prize-pool events for teams and solo entrants.' },
  { id: 'workshops', label: 'Workshops', blurb: 'Hands-on sessions: AI, quantum, rocketry, PCBs and more.' },
  { id: 'experiences', label: 'Experiences', blurb: 'Escape rooms, stargazing, sim rigs and a rage room. Walk in and play.' },
];

// names, taglines and logos as SU Connect lists them (su-connect-bphc.vercel.app/clubs/<slug>).
// Alchemy has no logo: SU Connect currently shows E-Cell's in its place. SAE has none there either.
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
  'aeolus': { name: 'Aeolus', tagline: 'Aerial robotics and unmanned aerial systems.', logo: '/clubs/aeolus.webp' },
  'alchemy': { name: 'Alchemy', tagline: 'The branch association for Chemistry.' },
  'arc': { name: 'Automation and Robotics Club', tagline: 'Electronics, mechanics and programming, combined.', logo: '/clubs/arc.webp' },
  'axiom': { name: 'Axiom', tagline: 'The branch association for Mathematics.', logo: '/clubs/axiom.webp' },
  'bhcg': { name: 'BHCG', tagline: 'Hands-on consulting and product management.', logo: '/clubs/bhcg.webp' },
  'blocksoc': { name: 'BlockSoc', tagline: 'The blockchain society of BPHC.', logo: '/clubs/blocksoc.webp' },
  'cea': { name: 'Civil Engineering Association', tagline: 'The branch association for Civil Engineering.', logo: '/clubs/cea.webp' },
  'crux': { name: 'CRUX', tagline: 'The programming and computing club of BPHC.', logo: '/clubs/crux.webp' },
  'csa': { name: 'Computer Science Association', tagline: 'The branch association for Computer Science.', logo: '/clubs/csa.webp' },
  'designers-anonymous': { name: 'Designers Anonymous', tagline: 'Graphic design, UI/UX, posters and visuals.', logo: '/clubs/designers-anonymous.webp' },
  'e-cell': { name: 'E-Cell', tagline: 'The Entrepreneurship Cell.', logo: '/clubs/e-cell.webp' },
  'economics-association': { name: 'Economics Association', tagline: 'The branch association for Economics.', logo: '/clubs/economics-association.webp' },
  'embryo': { name: 'Embryo', tagline: 'Hosts distinguished speakers at campus events.', logo: '/clubs/embryo.webp' },
  'esports': { name: 'E-Sports', tagline: 'Campus-wide tournaments for Valorant, BGMI, FIFA and more.', logo: '/clubs/esports.webp' },
  'ieee': { name: 'IEEE', tagline: 'Student branch of the global IEEE organization.', logo: '/clubs/ieee.webp' },
  'mea': { name: 'Mechanical Engineering Association', tagline: 'The branch association for Mechanical Engineering.', logo: '/clubs/mea.webp' },
  'panacea': { name: 'Panacea', tagline: 'The branch association for Pharmacy.', logo: '/clubs/panacea.webp' },
  'phoenix': { name: 'PHoEnix Association', tagline: 'The branch association for EnI, EEE and ECE.', logo: '/clubs/phoenix.webp' },
  'quiz-club': { name: 'Quiz Club', tagline: 'The _ _ _ _ _ _ _ _ Club has a Quizzing Problem', logo: '/clubs/quiz-club.webp' },
  'sae': { name: 'SAE', tagline: 'Automotive engineering and vehicle design competitions.' },
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
  /** the event's poster in public/events/ (from the fest's Instagram, contacts cropped off); no picture until there is one */
  image?: string;
  /** day and time once confirmed, e.g. 'Sat 24 Oct, 10:00'; the page says "day TBA" until then */
  when?: string;
  /** where it happens, e.g. 'F-block, lecture hall 105'; set by the club on /manage */
  venue?: string;
  /** one or two plain sentences from the organisers about the event */
  about?: string;
}

const LIST: FestEvent[] = [
  // competitions
  {
    id: 'break-the-case', title: 'Break The Case', category: 'competitions', prize: 400000, fee: 'Free', note: 'Consulting case competition', team: '1–4', clubs: ['bhcg'], image: '/events/break-the-case.webp',
    about: 'One of India’s premier case competitions, with KPMG as knowledge partner. Three rounds of real-world business problems end with a pitch to a panel of industry leaders.',
  },
  {
    id: 'robowars', title: 'Robowars', category: 'competitions', prize: 195000, fee: '₹700', note: '15 kg, 8 kg and 1.5 kg classes', clubs: ['phoenix'], image: '/events/robowars.webp', when: 'Sat 24 – Sun 25 Oct',
    about: 'One-on-one combat between robots with active weapons, in a losers’-bracket format for each weight class. Winners take ₹57,500 (15 kg), ₹42,500 (8 kg) and ₹20,000 (1.5 kg).',
  },
  {
    id: 'robo-soccer', title: 'Robo Soccer', category: 'competitions', prize: 10000, fee: '₹200 per bot', note: '5 kg robots', clubs: ['phoenix'], image: '/events/robo-soccer.webp', when: 'Sat 24 – Sun 25 Oct',
    about: 'Robots play football: speed, precision and teamwork in a single-elimination bracket.',
  },
  {
    id: 'robo-sumo', title: 'Robo Sumo', category: 'competitions', prize: 10000, fee: '₹200 per bot', note: '5 kg robots', clubs: ['phoenix'], when: 'Sat 24 – Sun 25 Oct',
    about: 'Push your opponent out of the ring. A test of control, traction and smart manoeuvring, in a single-elimination bracket.',
  },
  {
    id: 'wall-street-business', title: 'Wall Street × EcoAssoc Case Competition', category: 'competitions', prize: 50000, fee: 'Free', note: 'Product case, with Signal Studios', clubs: ['economics-association', 'wall-street'],
    about: 'A product case from a real fintech problem, set with Signal Studios, an AI-powered fintech platform. Teams present a business strategy and product proposal.',
  },
  {
    id: 'astro-datathon', title: 'Ad Astra × CSA Datathon', category: 'competitions', prize: 50000, fee: '₹125', clubs: ['ad-astra', 'csa'],
    about: 'Space science meets machine learning. Train models on real astronomical datasets and go head-to-head on an unseen test set.',
  },
  {
    id: 'analytics-datathon', title: 'Datathon: Traffic Data to Smart Routes', category: 'competitions', prize: 50000, fee: '₹150', note: 'With Wall Street Mojo', clubs: ['bhcg'],
    about: 'An industry speaker session and an analytics workshop, then a 24-hour challenge: derive insights from traffic data, build predictive models and optimise routes.',
  },
  {
    id: 'pit-trading', title: 'Pit Trading', category: 'competitions', prize: 40000, fee: '₹249', clubs: ['traders'], image: '/events/pit-trading.webp', when: 'Fri 23 Oct, 12:00–15:00', venue: 'F102',
    about: 'A live virtual trading floor: same starting money, random stocks, and a stream of fake breaking news. Three 30-minute rounds; the top three portfolios win.',
  },
  {
    id: 'next-signal', title: 'Finding the Next Signal', category: 'competitions', prize: 40000, fee: '₹599', note: 'Quant research hackathon · Sponsored by Signal1', clubs: ['wall-street', 'economics-association'], image: '/events/next-signal.webp',
    about: 'Build an autonomous research agent that digs through a NIFTY 50 company’s filings and news to find a non-obvious, evidence-backed insight. Top teams get pre-placement interviews.',
  },
  {
    id: 'mech-ideathon', title: 'MEA Ideathon', category: 'competitions', prize: 35000, fee: '₹200', clubs: ['mea'], image: '/events/mech-ideathon.webp', when: 'Fri 23 – Sun 25 Oct, pitches Sun 13:00–15:00', venue: 'F208',
    about: 'An intensive brainstorming competition. Teams develop solutions to problems and pitch their concepts, business models or prototypes to a panel of judges.',
  },
  {
    id: 'wall-street-analytics', title: 'Wall Street Analytics Challenge', category: 'competitions', prize: 35000, fee: 'Free', clubs: ['wall-street'],
    about: 'A quant finance and algorithm design challenge. Analyse financial datasets, build models and trading strategies, and present your approach and results.',
  },
  {
    id: 'anatomy-of-murder', title: 'Anatomy of Murder', category: 'competitions', prize: 35000, fee: 'Free', clubs: ['synapsis'],
    about: 'Solve biology-themed clues and follow them around the academic block to crack a murder.',
  },
  {
    id: 'trick-of-trade', title: 'Trick of Trade', category: 'competitions', prize: 30000, fee: '₹49', note: 'Three winners', clubs: ['economics-association'],
    about: 'Run a rich, middle-income or poor country with limited resources: produce, trade, bargain and bid to grow your wealth, with an arts-and-crafts twist each round.',
  },
  {
    id: 'cruxipher', title: 'cruXipher', category: 'competitions', prize: 30000, fee: 'Free', team: 'Any size', note: 'Online jeopardy-style CTF', clubs: ['crux'], when: 'Sun 25 – Mon 26 Oct',
    about: 'A cybersecurity tournament across web, crypto, reversing, pwn and forensics. Open online; prize money is for registrants only.',
  },
  {
    id: 'coinquest', title: 'Coinquest', category: 'competitions', prize: 20000, fee: '₹99', clubs: ['blocksoc', 'traders'], when: 'Fri 23 – Sun 25 Oct',
    about: 'A beginner-friendly mock crypto trading competition with virtual funds, real market conditions and a live leaderboard.',
  },
  {
    id: 'arthasastra', title: 'Arthasastra', category: 'competitions', prize: 25000, fee: '₹200', team: '1–3', clubs: ['economics-association'], image: '/events/arthasastra.webp', when: 'Wed 21 Oct, 19:00–23:00', venue: 'F103',
    about: 'The Economics Association’s flagship quiz on economics, finance and current affairs. Three elimination rounds, open to every discipline.',
  },
  {
    id: 'enigma', title: 'Enigma', category: 'competitions', prize: 10000, fee: '₹200', team: '1–4', clubs: ['blocksoc'],
    about: 'A blockchain strategy simulation: build, secure and govern your own network through forks, attacks and governance dilemmas.',
  },
  {
    id: 'bulls-and-brains', title: 'Bulls & Brains', category: 'competitions', prize: 15000, fee: '₹199', clubs: ['traders'], image: '/events/bulls-and-brains.webp', when: 'Sat 24 Oct, 12:00–14:00', venue: 'F104',
    about: 'A beginner-friendly trading quiz played on your phone across four rounds, from warm-ups to a 5× survivor final. No finance background needed.',
  },
  {
    id: 'blitz-cup', title: 'Blitz Cup', category: 'competitions', prize: 20000, fee: 'Free', clubs: ['crux'],
    about: 'Competitive programming at speed. The top 16 from the qualifiers advance to a lockout-style 1v1 bracket with winners’ and losers’ sides.',
  },
  {
    id: 'velocity', title: 'Velocity', category: 'competitions', prize: 10000, fee: 'Free', note: 'Quiz', clubs: ['quiz-club', 'sae'],
    about: 'A quiz on everything engines: combustion and propulsion, iconic machines, motorsport history and the future of mobility.',
  },
  {
    id: 'flood-risk', title: 'Urban Flood Risk Prediction Challenge', category: 'competitions', prize: 10000, fee: '₹200', note: 'Online ML hackathon · Judged on Kaggle', clubs: ['cea'], image: '/events/flood-risk.webp', when: 'Sat 24 – Sun 25 Oct', venue: 'Online, on Kaggle',
    about: 'Predict flood risk for unseen locations from terrain, drainage, land-use and rainfall data, scored live on a Kaggle leaderboard.',
  },
  {
    id: 'agent-competition', title: 'Agent Showdown', category: 'competitions', prize: 9000, fee: '₹100', clubs: ['crux'],
    about: 'Program an autonomous agent (rule-based, heuristic or minimax, no pre-trained LLMs) and pit it against others in a multi-round strategy game tournament.',
  },
  {
    id: 'enigma-quiz', title: 'Enigma: The General Quiz', category: 'competitions', prize: 8000, fee: 'Free', note: 'With Factaco', clubs: ['quiz-club'],
    about: 'The Quiz Club’s flagship general quiz: history, pop culture, sports, literature, geography and everything in between.',
  },
  {
    id: 'fifa-auction', title: 'FUTBID: FIFA Auction', category: 'competitions', prize: 7500, fee: '₹199', team: 'Up to 3', clubs: ['ace'], image: '/events/fifa-auction.webp', when: 'Fri 23 Oct, 14:00–18:00', venue: 'F107',
    about: 'Enter a live FIFA player auction and build the best 5-a-side squad on a budget.',
  },
  {
    id: 'defuse-the-bomb', title: 'Defuse the Bomb', category: 'competitions', prize: 7000, fee: '₹180 per team', team: '2–4', note: 'Maths-themed game room', clubs: ['axiom'],
    about: 'Work together through maths puzzles to defuse the bomb.',
  },
  {
    id: 'concrete-bowling', title: 'Concrete Bowling', category: 'competitions', prize: 6000, fee: '₹200', note: 'At the Central Workshop', clubs: ['cea'], image: '/events/concrete-bowling.webp', when: 'Fri 23 – Sun 25 Oct', venue: 'Central Workshop',
    about: 'Standard bowling rules with cast concrete balls and pins. Scores are ranked through the fest; the highest win.',
  },
  {
    id: 'escape-room', title: 'Escape Room: All Eyes on You', category: 'competitions', prize: 5000, fee: '₹100 per head', team: '4–7', clubs: ['spectrum'], image: '/events/escape-room.webp', when: 'Fri 23 – Sun 25 Oct, 10:00–20:00', venue: 'J107',
    about: 'It’s 2030 and you’re trapped in a black site, with a corrupted AI sabotaging every move. Solve the ciphers and puzzles before the clock runs out.',
  },
  {
    id: 'acm-escape-room', title: 'ACM Escape Room', category: 'competitions', prize: 5000, fee: '₹300 per team', team: '2', clubs: ['acm'],
    about: 'A tech-based escape room for teams of two.',
  },
  {
    id: 'ecosnap', title: 'EcoSnap Contest', category: 'competitions', prize: 5000, fee: '₹60', clubs: ['synapsis'],
    about: 'A biology-themed photography competition.',
  },
  {
    id: 'ai-slop-slayer', title: 'AI Slop Slayer', category: 'competitions', prize: 5000, fee: '₹400', clubs: ['acm'],
    about: 'You get AI-generated code full of bugs. Fix it.',
  },
  {
    id: 'last-autopsy', title: 'The Last Autopsy', category: 'competitions', prize: 10000, fee: '₹250', clubs: ['panacea'], image: '/events/last-autopsy.webp', when: 'Fri 23 – Sat 24 Oct, 10:00–17:00', venue: 'J120',
    about: 'A murder scene, and a crime to solve.',
  },
  {
    id: 'arg', title: 'ARG', category: 'competitions', prize: 5000, fee: '₹50 per person', team: '3', note: 'Alternate reality game', clubs: ['crux', 'acm-w'],
    about: 'A BITSian researcher has vanished, leaving encrypted files, deleted repos and hidden logs. Solve challenges across ML, web, app and design to find out what happened.',
  },
  {
    id: 'martian-quiz', title: 'Are You Smarter Than a Martian?', category: 'competitions', prize: 2000, fee: 'Free', note: 'Space quiz', clubs: ['quiz-club', 'ad-astra'],
    about: 'Rocket launches, planetary missions, black holes, exoplanets and the strange corners of cosmology.',
  },
  {
    id: 'sbt-quiz', title: 'SBT', category: 'competitions', prize: 2000, fee: 'Free', note: 'Science, business and tech quiz', clubs: ['quiz-club'],
    about: 'The Quiz Club’s flagship quiz on breakthrough science, the rise and fall of companies, market moves and the technologies changing how we live.',
  },
  {
    id: 'cubing', title: 'CubingATMOS 2026', category: 'competitions', prize: null, fee: '₹900', note: 'WCA speedcubing · Two-day event', clubs: ['axiom'],
    about: 'The headliner: 100+ cubers from BITS and around the city compete across speedcubing categories over two days, under the World Cube Association.',
  },
  {
    id: 'deal-with-the-devil', title: 'Deal With The Devil', category: 'competitions', prize: 25000, fee: 'TBA', note: 'Coding competition', clubs: ['csa'], image: '/events/deal-with-the-devil.webp', when: 'Sat 24 Oct, 14:00–17:00', venue: 'D313 (CC lab)',
    about: 'Buy hints from an AI that gets more corrupted the deeper you go. Catch its confident nonsense, bid smart and debug harder.',
  },
  {
    id: 'speedcad', title: 'SpeedCAD', category: 'competitions', prize: 15000, fee: 'TBA', note: '1v1 knockout CAD competition', clubs: ['sae'], image: '/events/speedcad.webp', when: 'Sun 25 Oct, 14:00–17:00', venue: 'F107',
    about: 'Two designers get the same drawing and race to recreate it in CAD (SolidWorks or Fusion). Accuracy and speed decide who advances. Bring a laptop or use one provided.',
  },
  {
    id: 'accidental-overdose', title: 'Accidental Overdose', category: 'competitions', prize: 3000, fee: 'TBA', note: 'Drug trivia', clubs: ['panacea'], image: '/events/accidental-overdose.webp', when: 'Sun 25 Oct, 10:00–17:00', venue: 'G106',
    about: 'A trivia contest on drugs and medicines. Trust your instincts: one wrong answer could be an overdose of embarrassment.',
  },
  {
    id: 'valorant', title: 'Valorant Tournament', category: 'competitions', prize: 2500, fee: 'TBA', clubs: ['esports'], image: '/events/valorant.webp', when: 'Fri 23 Oct', venue: 'Online',
  },
  {
    id: 'f1-tournament', title: 'F1 Tournament', category: 'competitions', prize: 2500, fee: 'TBA', note: 'Formula 1 game', clubs: ['esports'], image: '/events/f1-tournament.webp', when: 'Fri 23 Oct', venue: 'F108 and F109',
  },
  {
    id: 'fifa-tournament', title: 'FIFA Tournament', category: 'competitions', prize: 2000, fee: 'TBA', note: 'EA FC 25', clubs: ['esports'], image: '/events/fifa-tournament.webp', when: 'Fri 23 Oct', venue: 'F108 and F109',
  },
  {
    id: 'smash-karts', title: 'Smash Karts Tournament', category: 'competitions', prize: 2000, fee: 'TBA', clubs: ['esports'], image: '/events/smash-karts.webp', when: 'Fri 23 Oct', venue: 'Online',
  },

  // workshops
  {
    id: 'prompt-lab', title: 'Beyond the Prompt', category: 'workshops', prize: 10000, fee: '₹749', note: 'Prompt Lab: AI workshop and hackathon', clubs: ['ace'], image: '/events/prompt-lab.webp', when: 'Sun 25 Oct, 10:00', venue: 'G101',
    about: 'Building trustworthy AI agents: test AI on real engineering problems and learn to catch its errors and verify results.',
  },
  {
    id: 'drone-counter-strike', title: 'Drone Counter Strike', category: 'workshops', prize: 10000, fee: '₹369 per person', team: '3–6', note: 'Workshop and hackathon · ₹5,000 / ₹3,000 / ₹2,000', clubs: ['aeolus'], image: '/events/drone-counter-strike.webp', when: 'Fri 23 – Sun 25 Oct', venue: 'D313 and the Embedded Systems Lab',
    about: 'Join S.H.I.E.L.D. @BPHC in securing Earth’s airspace: deploy a Raspberry Pi to detect incoming drones, then lock onto and track them in real time with YOLO-based detection and a gimbal. Workshops run on 23 Oct (14:00–16:00) and 24 Oct (13:00–15:00). The hackathon on 25 Oct is a two-hour slot plus a 15-minute finals slot of your choice, and one registration covers both.',
  },
  {
    id: 'card-counting', title: 'Card Counting Workshop & Showdown', category: 'workshops', prize: 5000, fee: '₹150', note: 'One-day event', clubs: ['axiom'],
    about: 'Learn the probability behind winning at poker, then play it out in a showdown.',
  },
  {
    id: 'ti-workshop', title: 'Texas Instruments Workshop', category: 'workshops', prize: null, fee: '₹1499', note: 'Two days, on the MSPM0 microcontroller', clubs: ['seds'],
    about: 'Day one: meet TI professionals and get introduced to the MSPM0. Day two: shortlisted students solve a problem statement with it, hands-on.',
  },
  {
    id: 'model-rocketry', title: 'Model Rocketry Workshop', category: 'workshops', prize: null, fee: '₹1499', clubs: ['seds'],
    about: 'Learn the ins and outs of rocketry and build your own model rocket, with motors and DAQ systems.',
  },
  {
    id: 'pcb-workshop', title: 'PCB Workshop', category: 'workshops', prize: null, fee: '₹1499', clubs: ['seds'], image: '/events/pcb-workshop.webp', when: 'Fri 23 – Sun 25 Oct, 09:00–12:00', venue: 'F207 and F208',
    about: 'The full design process, from schematics to assembling a PCB you designed yourself.',
  },
  {
    id: 'finance-workshop', title: 'Finance Workshop', category: 'workshops', prize: null, fee: '₹799', clubs: ['wall-street'],
    about: 'Financial markets and instruments, investment strategy and decision-making, with practical examples.',
  },
  {
    id: 'semiconductor', title: 'Semiconductor Workshop', category: 'workshops', prize: null, fee: '₹599', note: 'With CREST · Clean room visit', clubs: ['alchemy'], image: '/events/semiconductor.webp',
    about: 'An interactive, practical workshop hosted by a BITS professor, including a visit to the clean room.',
  },
  {
    id: 'etch-a-sketch', title: 'Etch-A-Sketch Workshop', category: 'workshops', prize: null, fee: '₹550', clubs: ['arc'], image: '/events/etch-a-sketch.webp', when: 'Sat 24 Oct',
    about: 'Wire up an Arduino and build a device that draws on a display. All resources provided.',
  },
  {
    id: 'quantum-computing', title: 'QuantumVerse 2026', category: 'workshops', prize: null, fee: '₹399', note: 'Quantum workshop and hackathon, with IBM', clubs: ['ieee'],
    about: 'A three-day hybrid event with IBM speakers: quantum computing fundamentals, programming, entanglement and error correction, then a hackathon.',
  },
  {
    id: 'machine-learning', title: 'Chatbot from Scratch', category: 'workshops', prize: null, fee: '₹399', note: 'Machine learning workshop', clubs: ['ieee'],
    about: 'Build a chatbot that answers questions about your own documents with a retrieval-augmented generation pipeline. Mostly hands-on, 2.5–3 hours.',
  },
  {
    id: 'analog-electronics', title: 'Op-Amp Workshop', category: 'workshops', prize: null, fee: '₹399', note: 'Analog electronics', clubs: ['ieee'],
    about: 'A hands-on workshop on operational amplifiers. Participants keep all the hardware used in the session.',
  },
  {
    id: 'aroma-workshop', title: 'Aroma Workshop', category: 'workshops', prize: null, fee: '₹300', note: 'Candles and perfumes', clubs: ['panacea'],
    about: 'Learn how scents work and make your own candles and perfumes.',
  },
  {
    id: 'digital-design', title: 'GPU Workshop', category: 'workshops', prize: null, fee: '₹299', note: 'Digital design', clubs: ['ieee'],
    about: 'An introduction to GPU architecture and NVIDIA’s CUDA platform. No prior experience needed.',
  },
  {
    id: 'exoplanet-detection', title: 'Exoplanet Detection Workshop', category: 'workshops', prize: null, fee: '₹249', clubs: ['ad-astra'], image: '/events/exoplanet-detection.webp', when: 'Sat 24 Oct, 14:00–18:00',
    about: 'Decode real mission data and build a detection pipeline to spot planets light-years away.',
  },
  {
    id: 'perfume', title: 'Make Your Own Perfume', category: 'workshops', prize: null, fee: '₹249', clubs: ['alchemy'], image: '/events/perfume.webp', when: 'Fri 23 – Sun 25 Oct', venue: 'G105',
    about: 'Pick from over 12 fragrances and take home your own 10 ml bottle.',
  },
  {
    id: 'code-the-chain', title: 'Code the Chain', category: 'workshops', prize: null, fee: '₹450', note: 'Web3 workshop', clubs: ['blocksoc'],
    about: 'Web3 from the ground up: smart contracts, wallets and dApps, then build and deploy a small project to a testnet with mentors on hand.',
  },
  {
    id: 'racecar-dynamics', title: 'Racecar Dynamics Workshop', category: 'workshops', prize: null, fee: 'TBA', note: 'Run by a Renault vehicle dynamics engineer', clubs: ['sae'], image: '/events/racecar-dynamics.webp', when: 'Fri 23 – Sat 24 Oct, 14:00–17:00', venue: 'F207',
    about: 'Two afternoons on vehicle simulation, the key vehicle parameters and tuning them for the optimum lap, with hands-on Simulink.',
  },
  {
    id: 'zenith', title: 'ZENITH: Hardware for AI/ML', category: 'workshops', prize: null, fee: 'TBA', clubs: ['phoenix'], image: '/events/zenith.webp', when: 'Fri 23 Oct, 11:00–13:00', venue: 'F107',
    about: 'How different hardware suits different AI/ML applications, and how software becomes hardware execution: live demos on SiLabs MCUs with an AI accelerator and a PYNQ-Z2 FPGA.',
  },

  // experiences
  {
    id: 'chemistry-casino', title: 'Chemistry Casino', category: 'experiences', prize: 30000, fee: '₹399', note: 'Leaderboard runs all three days', clubs: ['alchemy'], image: '/events/chemistry-casino.webp', when: 'Fri 23 – Sun 25 Oct', venue: 'I122',
    about: 'Poker, blackjack and roulette with a pinch of chemistry. Buy in for chips; the best balance after three days takes the prize pool.',
  },
  {
    id: 'stargazing', title: 'Stargazing', category: 'experiences', prize: null, fee: '₹149', clubs: ['ad-astra'], image: '/events/stargazing.webp', when: 'Fri 23 Oct, 22:00',
    about: 'Saturn’s rings, Jupiter’s moons, lunar craters and distant star clusters through a Celestron Schmidt-Cassegrain and an 8-inch Dobsonian.',
  },
  {
    id: 'solar-gazing', title: 'Solaris Surge', category: 'experiences', prize: null, fee: '₹99', note: 'Solar gazing', clubs: ['ad-astra'], image: '/events/solar-gazing.webp', when: 'Sat 24 Oct, 10:00–13:00',
    about: 'Observe the Sun safely through filtered telescopes and track sunspot clusters.',
  },
  {
    id: 'f1-simrig', title: 'F1 SimRig', category: 'experiences', prize: null, fee: '₹250 per 10 min', clubs: ['arc', 'sae'], image: '/events/f1-simrig.webp', when: 'Fri 23 – Sun 25 Oct', venue: 'LTC lobby',
    about: 'A 4D race car simulator built from scratch by ARC and SAE engineers, with VR and haptic feedback you feel through every drift and crash.',
  },
  {
    id: 'rage-room', title: 'Rage Room', category: 'experiences', prize: null, fee: '₹250', clubs: ['cea'], image: '/events/rage-room.webp', when: 'Fri 23 – Sun 25 Oct', venue: 'D123',
    about: 'Smash concrete and construction materials with real tools, safely and under supervision.',
  },
  {
    id: 'arcade-machine', title: 'Arcade', category: 'experiences', prize: null, fee: '₹150 per 15 min', clubs: ['arc'], image: '/events/arcade-machine.webp', when: 'Fri 23 – Sun 25 Oct', venue: 'LTC lobby',
    about: 'Golden-era games on arcade machines built by ARC, with tactile buttons and old-style displays.',
  },
  {
    id: 'period-pain-simulator', title: 'Period Pain Simulator', category: 'experiences', prize: null, fee: '₹100', clubs: ['synapsis'],
    about: 'A TENS machine simulates period cramps with mild electrical stimulation.',
  },
  {
    id: 'tech-tiranga', title: 'Tech Tiranga', category: 'experiences', prize: null, fee: 'Free', note: 'Space panel talk', clubs: ['seds', 'embryo', 'ad-astra'],
  },
  {
    id: 'auto-expo', title: 'Auto Expo', category: 'experiences', prize: null, fee: 'Free', clubs: ['mea'],
    about: 'A showcase of vehicles from modified cars to supercars. Walk through, see the machines up close and meet the drivers.',
  },
  {
    id: 'pixel-palette', title: 'Pixel Palette', category: 'experiences', prize: null, fee: 'TBA', note: 'With Date Bites by Farmley', clubs: ['designers-anonymous'], image: '/events/pixel-palette.webp', when: 'Fri 23 – Sat 24 Oct, 15:00–18:00', venue: 'LTC lobby',
    about: 'Make your own pixel art, whether you are a seasoned artist or have never touched a pixel.',
  },
  {
    id: 'pay-and-play', title: 'Pay and Play', category: 'experiences', prize: null, fee: 'TBA', note: 'Gaming room', clubs: ['esports'], when: 'Fri 23 – Sun 25 Oct',
    about: 'Your ultimate gaming room: pick up a controller or get on the sim rig and game away.',
  },
  {
    id: 'startup-talk', title: 'Talk: Srinivas Kollipara', category: 'experiences', prize: null, fee: 'TBA', note: 'Co-founder of T-Hub', clubs: ['embryo', 'e-cell'], image: '/events/startup-talk.webp', when: 'Fri 23 Oct, 11:00', venue: 'F103',
    about: 'Srinivas Kollipara is an angel investor and co-founder of T-Hub, and has played a key role in building India’s technology startup system.',
  },
  {
    id: 'space-talk', title: 'Talk: Awais Ahmed', category: 'experiences', prize: null, fee: 'TBA', note: 'Co-founder and CEO of Pixxel', clubs: ['embryo', 'seds'], image: '/events/space-talk.webp', when: 'Sat 24 Oct, 13:30', venue: 'F103',
    about: 'A masterclass from BITS alumnus Awais Ahmed, whose company Pixxel builds high-resolution hyperspectral Earth-imaging satellites, on scaling a global space company.',
  },
];

// by category, then biggest prize first; events without a prize keep list order
const order = CATEGORIES.map((c) => c.id);
export const EVENTS: FestEvent[] = [...LIST].sort(
  (a, b) => order.indexOf(a.category) - order.indexOf(b.category) || (b.prize ?? -1) - (a.prize ?? -1),
);

export const formatPrize = (p: number | null) => (p === null ? '—' : `₹${p.toLocaleString('en-IN')}`);

// entry fee as a number for sorting: Free is 0, '₹250 per 10 min' is 250, TBA sorts last
export const feeValue = (fee: string) => (fee === 'Free' ? 0 : Number(fee.match(/₹\s*([\d,]+)/)?.[1]?.replace(/,/g, '') ?? Infinity));

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
