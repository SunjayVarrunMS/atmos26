import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { motion, useMotionValueEvent, useScroll, useTransform } from 'framer-motion';
import type { MotionValue } from 'framer-motion';
import { FEST } from '../../data/fest';
import { TITLE_SPONSOR } from '../../data/sponsors';
import { intro, useIntroPhase } from '../../lib/intro';
import { useFinePointer, useReducedMotion } from '../../lib/hooks';
import { PassesButton } from '../PassesButton';
import { FilmScratches } from '../FilmScratches';
import { Countdown } from './Countdown';
import { LogoStage } from './LogoStage';

const EXPO = [0.16, 1, 0.3, 1] as const;

// the logo is a 1080 px raster: never show it larger than that in device pixels
const LOGO_MAX = typeof window === 'undefined' ? undefined : 1080 / window.devicePixelRatio;

type Fx = {
  stageScale: MotionValue<number>;
  stageY: MotionValue<string>;
  copyOpacity: MotionValue<number>;
  copyY: MotionValue<string>;
  cueOpacity: MotionValue<number>;
};

/**
 * First screen, one centred column: the official logo and the title sponsor,
 * with the dates, venue, countdown and actions docked along the bottom.
 * With `exit` it is the opening of the ascent: it sits inside the pinned
 * stage over the shaft and leaves as `exit` runs 0 to 1. Without it, it is a
 * standalone section (the no-WebGL page).
 */
export function Hero({ exit }: { exit?: MotionValue<number> }) {
  return exit ? <PinnedHero exit={exit} /> : <StandaloneHero />;
}

function PinnedHero({ exit }: { exit: MotionValue<number> }) {
  const [live, setLive] = useState(true);
  const fx: Fx = {
    stageScale: useTransform(exit, [0, 1], [1, 1.12]),
    stageY: useTransform(exit, [0, 1], ['0%', '14%']),
    copyOpacity: useTransform(exit, [0, 0.5], [1, 0]),
    copyY: useTransform(exit, [0, 0.5], ['0%', '12%']),
    cueOpacity: useTransform(exit, [0, 0.3], [1, 0]),
  };
  const layerOpacity = useTransform(exit, [0.7, 1], [1, 0]);

  // once it is mostly gone, the layer stops catching clicks meant for the world
  useMotionValueEvent(exit, 'change', (v) => setLive(v <= 0.6));

  return (
    <motion.div className="absolute inset-0 isolate flex flex-col items-center pt-16" style={{ opacity: layerOpacity }}>
      <HeroBody fx={fx} exit={exit} live={live} />
    </motion.div>
  );
}

function StandaloneHero() {
  const section = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: section, offset: ['start start', 'end start'] });
  const fx: Fx = {
    stageScale: useTransform(scrollYProgress, [0, 1], [1, 1.12]),
    stageY: useTransform(scrollYProgress, [0, 1], ['0%', '14%']),
    // the copy drifts a little and is gone before it reaches the section's edge
    copyOpacity: useTransform(scrollYProgress, [0, 0.25], [1, 0]),
    copyY: useTransform(scrollYProgress, [0, 0.25], ['0%', '24%']),
    cueOpacity: useTransform(scrollYProgress, [0, 0.3], [1, 0]),
  };

  return (
    <section
      ref={section}
      className="relative isolate flex min-h-svh flex-col items-center overflow-x-clip bg-void pt-16"
      aria-labelledby="hero-title"
    >
      <img src="/world/stills/top.webp" alt="" className="absolute inset-0 -z-10 size-full object-cover opacity-50" />
      <HeroBody fx={fx} exit={scrollYProgress} live />
    </section>
  );
}

function HeroBody({ fx, exit, live }: { fx: Fx; exit: MotionValue<number>; live: boolean }) {
  const phase = useIntroPhase();
  const still = useReducedMotion();
  const fine = useFinePointer();
  const [built, setBuilt] = useState(still);

  const onBuilt = useCallback(() => {
    setBuilt(true);
    intro.set('done');
  }, []);

  // without a preloader (reduced motion, or already seen this session) the
  // hero starts building as soon as it mounts
  useEffect(() => {
    if (intro.get() === 'loading' && !document.querySelector('[data-preloader]')) intro.set('building');
  }, []);

  const play = phase === 'building' || phase === 'done';
  const reveal = (delay: number) => ({
    initial: still ? false : { opacity: 0, y: 24 },
    animate: play ? { opacity: 1, y: 0 } : undefined,
    transition: { duration: 1.2, ease: EXPO, delay },
  });

  return (
    <>
      <h1 id="hero-title" className="sr-only">
        ATMOS ’26: {FEST.theme}, {FEST.subtheme}. The technical fest of {FEST.college}, {FEST.campus}, 23 to 25
        October 2026.
      </h1>

      {/* the logo and the title sponsor side by side with a brass rule between, centred in the space above the dock */}
      <div className="flex w-full flex-1 flex-row items-center justify-center gap-3 pb-[19rem] sm:gap-6 md:gap-[clamp(2rem,4vw,4.5rem)] md:pb-36">
        <motion.div
          className="relative w-[min(50vw,34svh)] md:w-[min(46vw,calc(100svh-4rem-10rem))]"
          style={still ? { maxWidth: LOGO_MAX } : { maxWidth: LOGO_MAX, scale: fx.stageScale, y: fx.stageY }}
          data-hero-stage
        >
          <LogoStage
            play={play}
            still={still}
            interactive={built}
            fine={fine}
            exit={exit}
            skipRingDraw={intro.handedOff()}
            onBuilt={onBuilt}
          />
        </motion.div>

        <motion.div
          className="relative z-10 flex flex-row items-center gap-3 text-center sm:gap-6 md:gap-[clamp(2rem,4vw,4.5rem)]"
          style={still ? undefined : { opacity: fx.copyOpacity, y: fx.copyY }}
        >
          {TITLE_SPONSOR && (
            <>
              <motion.span {...reveal(2.3)} aria-hidden className="h-[min(18svh,8rem)] w-px bg-brass/50 md:h-[min(34svh,18rem)]" />
              <motion.a
                {...reveal(2.4)}
                href={TITLE_SPONSOR.href}
                target="_blank"
                rel="noreferrer"
                className={`group flex flex-col items-center gap-2 md:gap-3 ${live ? 'pointer-events-auto' : 'pointer-events-none'}`}
              >
                <img
                  src={TITLE_SPONSOR.logo}
                  alt={TITLE_SPONSOR.name}
                  width={1192}
                  height={264}
                  className="h-[clamp(1.5rem,7.5vw,2.25rem)] w-auto md:h-[clamp(3rem,min(6vw,10svh),5.5rem)]"
                />
                <span className="meta text-stone-dim transition-colors duration-300 group-hover:text-stone md:text-[0.95rem]">
                  Title sponsor
                </span>
              </motion.a>
            </>
          )}
        </motion.div>
      </div>

      <motion.div
        className="absolute inset-x-0 bottom-0 z-10 bg-linear-to-t from-void via-void/85 to-transparent pt-12"
        style={still ? undefined : { opacity: fx.copyOpacity }}
      >
        {/* the scroll cue rests just above the dock, clear of the sponsor */}
        <motion.div
          aria-hidden
          className="absolute bottom-full right-4 mb-2 sm:right-8"
          style={still ? undefined : { opacity: fx.cueOpacity }}
        >
          <motion.div
            className="flex flex-col items-center gap-1"
            animate={still ? undefined : { y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <span className="text-[0.8rem] text-stone-dim">Scroll</span>
            <span className="h-7 w-px bg-brass" />
          </motion.div>
        </motion.div>

        {/* from 1280px the countdown sits at the page's centre, between the dates and the actions */}
        <div
          className={`mx-auto grid max-w-[1440px] gap-4 border-t border-brass-line px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:px-8 md:grid-cols-[1fr_auto_auto] md:items-center md:gap-10 xl:grid-cols-[1fr_auto_1fr] ${
            live ? 'pointer-events-auto' : 'pointer-events-none'
          }`}
        >
          <motion.div {...reveal(2.55)}>
            <p className="display text-[clamp(1.4rem,2.2vw,2rem)] text-stone">23–25 October 2026</p>
            <p className="meta mt-1 text-stone-dim">
              {FEST.college}, {FEST.campus}
            </p>
          </motion.div>

          <motion.div {...reveal(2.6)}>
            <Countdown className="text-[clamp(2rem,4vw,3.2rem)]" />
          </motion.div>

          <motion.div {...reveal(2.7)} className="flex flex-col gap-2 sm:flex-row xl:justify-self-end">
            <Link
              to="/events"
              className="inline-flex h-12 items-center justify-center gap-3 bg-stone px-6 text-[0.95rem] font-semibold text-void transition-colors duration-300 hover:bg-brass-hi"
            >
              Explore events
              <svg viewBox="0 0 24 12" className="w-5" aria-hidden>
                <path d="M0 6h22M17 1l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.6" />
              </svg>
            </Link>
            <PassesButton />
          </motion.div>
        </div>
      </motion.div>

      <FilmScratches className="absolute inset-0 z-20 size-full opacity-80 mix-blend-screen" density={0.8} />
    </>
  );
}
