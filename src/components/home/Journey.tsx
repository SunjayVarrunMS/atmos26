import { useEffect, useRef } from 'react';
import manifest from '../../data/logoLayers.json';
import { AnimatePresence, motion } from 'framer-motion';
import { ERAS } from '../../data/eras';
import { FEST } from '../../data/fest';
import { useFinePointer } from '../../lib/hooks';
import { FloorDial } from './FloorDial';
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
  const { segment, text, ready, landed } = useWorld();
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
        <SummitArtwork />
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
          {landed && (
            <motion.p
              key="landed"
              className="text-lift absolute inset-x-0 bottom-[9svh] px-4 text-center text-[1.05rem] text-stone-dim"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, ease: EXPO, delay: 0.3 }}
            >
              <span className="text-stone">Fri 23 – Sun 25 October</span>
              <span className="mx-2 text-brass" aria-hidden>
                /
              </span>
              {FEST.college}, {FEST.campus}
            </motion.p>
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
              <div aria-hidden className="absolute inset-x-0 bottom-0 h-[52svh] bg-linear-to-t from-void via-void/75 to-transparent md:hidden" />
              {/* wide screens: a soft shade on the copy's side, so drawings behind it stay quiet */}
              <div aria-hidden className="absolute inset-y-0 left-0 hidden w-[48%] bg-linear-to-r from-void/75 via-void/40 to-transparent md:block" />
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
                  {era.id === 'intelligence' && ready && (
                    <p className="text-lift mt-8 max-w-[34ch] text-[0.95rem] text-stone-mute">
                      {fine ? 'Click anywhere to send a thought up through it.' : 'Tap to send a thought up through it.'}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <FloorDial active={eraIndex} />
      </div>
    </section>
  );
}

const SIZE = manifest.size[0];
const RING = manifest.ring;

/**
 * The official artwork, untouched, laid over the summit ring. The engine
 * reports where the ring sits on screen every frame; this sizes and places
 * the JPEG so its own ring lands exactly on the dots, then fades it in.
 */
function SummitArtwork() {
  const img = useRef<HTMLImageElement>(null);
  useEffect(
    () =>
      world.onRing(({ x, y, r, opacity }) => {
        const el = img.current;
        if (!el) return;
        if (opacity <= 0.001 || r <= 0) {
          el.style.opacity = '0';
          return;
        }
        const w = (r * SIZE) / RING.r;
        el.style.width = `${w}px`;
        el.style.transform = `translate3d(${x - (w * RING.cx) / SIZE}px, ${y - (w * RING.cy) / SIZE}px, 0)`;
        el.style.opacity = opacity.toFixed(3);
      }),
    [],
  );
  return (
    <img
      ref={img}
      src="/logo/atmos-website.jpg"
      alt="ATMOS ’26 official artwork: a human hand and a machine hand meeting inside a brass ring"
      width={SIZE}
      height={SIZE}
      loading="lazy"
      decoding="async"
      className="absolute left-0 top-0 aspect-square max-w-none opacity-0 mix-blend-lighten"
    />
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
            <li key={e.id} id={`ascent-${e.id}`} className="grid items-center gap-6 border-b border-stone/12 py-8 md:grid-cols-12 md:gap-8 md:py-10">
              <img
                src={`/world/stills/${e.id}.webp`}
                alt={e.scene}
                width={1280}
                height={800}
                loading="lazy"
                decoding="async"
                className="aspect-[16/10] w-full bg-soot object-cover md:col-span-7"
              />
              <div className="md:col-span-5">
                <p className="stencil text-[clamp(1.3rem,2vw,1.8rem)] text-brass" style={{ textTransform: 'none' }}>
                  {e.when}
                </p>
                <h3 className="display mt-2 text-[clamp(1.9rem,3.4vw,3rem)] text-stone">{e.name}</h3>
                <p className="mt-4 max-w-[40ch] text-[1.05rem] leading-relaxed text-stone-dim">{e.line}</p>
              </div>
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
