import { useState } from 'react';
import { Link } from 'react-router';
import { AnimatePresence, motion } from 'framer-motion';
import { CATEGORIES, EVENTS } from '../../data/events';

const EXPO = [0.16, 1, 0.3, 1] as const;

// the photo that best stands for each category
const COVER: Record<string, string> = {
  competitions: '/gallery/robo_soccer.jpg',
  workshops: '/gallery/womenInCode.jpg',
  experiences: '/gallery/puzzle_event.jpg',
  talks: '/gallery/actors_guest_talks.jpg',
  proshows: '/gallery/proshow.jpg',
};

interface Arena {
  id: string;
  label: string;
  blurb: string;
  to?: string;
  count?: number;
}

// the event categories, then the two arenas with nothing announced yet
const ARENAS: Arena[] = [
  ...CATEGORIES.map((c) => ({
    ...c,
    to: `/events?c=${c.id}`,
    count: EVENTS.filter((e) => e.category === c.id).length,
  })),
  { id: 'talks', label: 'Talks', blurb: 'Speakers are revealed closer to the fest.' },
  { id: 'proshows', label: 'Proshows', blurb: 'Three nights on the main stage. The line-up stays sealed.', to: '/proshows' },
];

// One row per category. Hovering one lights it and brings up its photo.
export function Categories() {
  const [hot, setHot] = useState<string | null>(null);
  return (
    <section className="relative px-4 py-[16svh] sm:px-8" aria-labelledby="cats-title">
      <div className="mx-auto max-w-[1440px]">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2 id="cats-title" className="display text-[clamp(3rem,7vw,6.8rem)] text-stone">
            Pick your <span className="text-brass-hi">arena</span>
          </h2>
          <Link to="/events" className="text-[1.05rem] text-stone-dim underline decoration-brass/60 hover:text-stone">
            All {EVENTS.length} events
          </Link>
        </div>

        <ul className="relative mt-14 border-b border-stone/12" onMouseLeave={() => setHot(null)}>
          {ARENAS.map((c) => {
            const on = hot === c.id;
            const row = 'group relative grid grid-cols-[1fr_auto] items-center gap-6 py-6 md:py-8';
            const inner = (
              <>
                <span
                  className={`display text-[clamp(1.75rem,4.6vw,4.25rem)] transition-[color,transform] duration-500 ease-out-expo ${
                    hot && !on ? 'text-stone/25' : 'text-stone'
                  } ${on ? 'translate-x-3 text-brass-hi' : ''}`}
                >
                  {c.label}
                </span>
                <span className="text-lift max-w-[26ch] text-right text-stone-dim">
                  {c.count === undefined ? (
                    <span className="block text-xl text-stone md:text-2xl">Coming soon</span>
                  ) : (
                    <span className="stencil block text-3xl text-stone">{String(c.count).padStart(2, '0')}</span>
                  )}
                  <span className="hidden md:block">{c.blurb}</span>
                </span>
              </>
            );
            return (
              <li key={c.id} className="border-t border-stone/12">
                {c.to ? (
                  <Link to={c.to} onMouseEnter={() => setHot(c.id)} onFocus={() => setHot(c.id)} className={row}>
                    {inner}
                  </Link>
                ) : (
                  <div onMouseEnter={() => setHot(c.id)} className={row}>
                    {inner}
                  </div>
                )}
              </li>
            );
          })}

          {/* the photo that follows the hovered row */}
          <AnimatePresence>
            {hot && (
              <motion.img
                key={hot}
                src={COVER[hot]}
                alt=""
                className="duotone pointer-events-none absolute right-[28%] top-1/2 hidden aspect-[4/5] w-[min(24vw,340px)] -translate-y-1/2 object-cover lg:block"
                initial={{ opacity: 0, scale: 0.9, rotate: -3, clipPath: 'inset(50% 0 50% 0)' }}
                animate={{ opacity: 1, scale: 1, rotate: 0, clipPath: 'inset(0% 0 0% 0)' }}
                exit={{ opacity: 0, scale: 0.96, clipPath: 'inset(50% 0 50% 0)' }}
                transition={{ duration: 0.55, ease: EXPO }}
              />
            )}
          </AnimatePresence>
        </ul>
      </div>
    </section>
  );
}
