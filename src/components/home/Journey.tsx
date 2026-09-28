import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ERAS } from '../../data/eras';
import { FEST } from '../../data/fest';
import { useFinePointer } from '../../lib/hooks';
import { guessTier } from '../../world/quality';
import { useWorld, world } from '../../world/store';
import { BOUNDS, SEGMENTS, TOTAL_VH } from '../../world/timeline';

const EXPO = [0.16, 1, 0.3, 1] as const;

/**
 * The ascent. A tall pinned section: the world behind reads its scroll
 * progress, and this overlay carries the copy for whichever floor is on
 * screen. Without WebGL (reduced motion, weak devices) it becomes a plain
 * stack of the same copy.
 */
export function Journey() {
  const { tier } = useWorld();
  const still = (tier ?? guessTier()) === 'still';
  return still ? <Stack /> : <Pinned />;
}

function Pinned() {
  const ref = useRef<HTMLElement>(null);
  const { segment, text, ready } = useWorld();
  const fine = useFinePointer();

  useEffect(() => {
    world.setJourney(ref.current);
    return () => world.setJourney(null);
  }, []);

  const seg = segment >= 0 ? SEGMENTS[segment] : null;
  const eraIndex = seg ? ERAS.findIndex((e) => e.id === seg.id) : -1;
  const era = eraIndex >= 0 ? ERAS[eraIndex] : null;
  const show = text && seg !== null;

  return (
    <section ref={ref} className="relative" style={{ height: `${(TOTAL_VH + 1) * 100}svh` }} aria-labelledby="ascent-title">
      <h2 id="ascent-title" className="sr-only">
        {FEST.theme}, {FEST.subtheme}: five eras of technology, from clockwork to intelligence
      </h2>

      {/* anchors for the floor dial and for links */}
      {SEGMENTS.map((s, i) => (
        <span
          key={s.id}
          id={`ascent-${s.id}`}
          aria-hidden
          className="absolute left-0 h-px w-px"
          style={{ top: `${BOUNDS[i][0] * TOTAL_VH * 100}svh` }}
        />
      ))}

      <div className="pointer-events-none sticky top-0 z-10 h-svh overflow-hidden">
        <AnimatePresence mode="wait">
          {show && seg.id === 'dive' && (
            <Statement key="dive">
              Every era built <span className="text-brass-hi">a better hand</span> for its tools.
            </Statement>
          )}
          {show && seg.id === 'summit' && (
            <Statement key="summit">
              This time the tool <span className="text-brass-hi">reaches back.</span>
            </Statement>
          )}
          {show && era && (
            <motion.div
              key={era.id}
              className="absolute inset-x-0 bottom-0 px-4 pb-[max(2.5rem,8svh)] sm:px-8 md:inset-y-0 md:flex md:items-center md:pb-0"
              initial={{ opacity: 0, y: 28, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
              transition={{ duration: 0.8, ease: EXPO }}
            >
              {/* phones: the copy sits under the machine, so it gets a dark floor to stand on */}
              <div aria-hidden className="absolute inset-x-0 bottom-0 h-[62svh] bg-linear-to-t from-void via-void/80 to-transparent md:hidden" />
              <div className="relative mx-auto w-full max-w-[1440px]">
                <div className="max-w-[30rem] md:max-w-[38%]">
                  <p className="stencil text-[clamp(1.4rem,2.2vw,2rem)] text-brass" style={{ textTransform: 'none' }}>
                    {era.when}
                  </p>
                  <h3 className="display mt-2 text-[clamp(2.4rem,5vw,4.6rem)] text-stone">{era.name}</h3>
                  <p className="text-lift mt-5 max-w-[34ch] text-[clamp(1.05rem,1.4vw,1.3rem)] leading-relaxed text-stone-dim text-pretty">
                    {era.line}
                  </p>
                  {eraIndex === 0 && ready && (
                    <p className="text-lift mt-8 max-w-[34ch] text-[0.95rem] text-stone-mute">
                      {fine
                        ? 'Move across the machine to see it the way a machine does.'
                        : 'Tap the machine to see it the way a machine does.'}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* era index: which floor of the ascent you're on */}
        <ol
          aria-hidden
          className={`absolute inset-x-0 bottom-6 mx-auto hidden w-full max-w-[1440px] gap-5 px-8 transition-opacity duration-700 md:flex ${
            eraIndex >= 0 ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {ERAS.map((e, i) => (
            <li key={e.id} className="flex-1">
              <span className={`block h-px w-full transition-colors duration-700 ${i <= eraIndex ? 'bg-brass' : 'bg-stone/15'}`} />
              <span
                className={`meta mt-3 block transition-colors duration-500 ${i === eraIndex ? 'text-stone' : 'text-stone-mute'}`}
                style={{ textTransform: 'none' }}
              >
                {e.when} · {e.name}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Statement({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center px-4 sm:px-8"
      initial={{ opacity: 0, y: 24, filter: 'blur(10px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      exit={{ opacity: 0, y: -18, filter: 'blur(10px)' }}
      transition={{ duration: 1, ease: EXPO }}
    >
      <p className="display max-w-[14ch] text-center text-[clamp(2.2rem,4.6vw,4.4rem)] text-stone text-balance">{children}</p>
    </motion.div>
  );
}

// no WebGL: the same story as a quiet stack
function Stack() {
  return (
    <section className="relative px-4 py-[16svh] sm:px-8" aria-labelledby="ascent-title">
      <div className="mx-auto max-w-[1440px]">
        <h2 id="ascent-title" className="display max-w-[16ch] text-[clamp(2.2rem,4.6vw,4.4rem)] text-stone text-balance">
          Every era built <span className="text-brass-hi">a better hand</span> for its tools.
        </h2>
        <ol className="mt-[10svh] border-t border-stone/12">
          {ERAS.map((e) => (
            <li key={e.id} id={`ascent-${e.id}`} className="grid gap-3 border-b border-stone/12 py-6 md:grid-cols-12 md:py-8">
              <p className="stencil text-[clamp(1.3rem,2vw,1.8rem)] text-brass md:col-span-2" style={{ textTransform: 'none' }}>
                {e.when}
              </p>
              <h3 className="display text-[clamp(1.9rem,3.4vw,3rem)] text-stone md:col-span-4">{e.name}</h3>
              <p className="max-w-[44ch] text-[1.05rem] leading-relaxed text-stone-dim md:col-span-6">{e.line}</p>
            </li>
          ))}
        </ol>
        <p className="display mt-[10svh] text-[clamp(2rem,4vw,3.6rem)] text-stone">
          This time the tool <span className="text-brass-hi">reaches back.</span>
        </p>
      </div>
    </section>
  );
}
