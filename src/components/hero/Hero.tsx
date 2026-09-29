import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { motion, useScroll, useTransform } from 'framer-motion';
import { FEST } from '../../data/fest';
import { TITLE_SPONSOR } from '../../data/sponsors';
import { intro, useIntroPhase } from '../../lib/intro';
import { useFinePointer, useReducedMotion } from '../../lib/hooks';
import { PassesButton } from '../PassesButton';
import { FilmScratches } from '../FilmScratches';
import { LogoStage } from './LogoStage';
import { Countdown } from './Countdown';

const EXPO = [0.16, 1, 0.3, 1] as const;

/**
 * First screen, set like the countdown reel's end card: the official logo
 * above, the title sponsor's credit, "N DAYS TO GO" in the reel's stencil
 * below, then the facts and the two actions. Nothing else.
 */
export function Hero() {
  const section = useRef<HTMLElement>(null);
  const phase = useIntroPhase();
  const still = useReducedMotion();
  const fine = useFinePointer();
  const [built, setBuilt] = useState(still);

  const { scrollYProgress } = useScroll({ target: section, offset: ['start start', 'end start'] });
  const stageScale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
  const stageY = useTransform(scrollYProgress, [0, 1], ['0%', '14%']);
  // the copy drifts a little and is gone before it reaches the section's edge
  const textOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0]);
  const textY = useTransform(scrollYProgress, [0, 0.25], ['0%', '24%']);

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
    <section
      ref={section}
      className="relative isolate flex min-h-svh flex-col items-center overflow-x-clip bg-void pb-10 pt-16"
      aria-labelledby="hero-title"
    >
      <h1 id="hero-title" className="sr-only">
        ATMOS ’26: {FEST.theme}, {FEST.subtheme}. The technical fest of {FEST.college}, {FEST.campus}, 23 to 25
        October 2026.
      </h1>

      <motion.div
        className="relative w-[min(100vw,600px)] sm:w-[min(88vw,calc(100svh-4rem-min(13vw,19svh)-9rem))]"
        style={still ? undefined : { scale: stageScale, y: stageY }}
        data-hero-stage
      >
        <LogoStage
          play={play}
          still={still}
          interactive={built}
          fine={fine}
          exit={scrollYProgress}
          skipRingDraw={intro.handedOff()}
          onBuilt={onBuilt}
        />
      </motion.div>

      <motion.div
        className="relative z-10 -mt-[3%] flex w-full flex-col items-center px-4 sm:px-8"
        style={still ? undefined : { opacity: textOpacity, y: textY }}
      >
        {TITLE_SPONSOR && (
          <motion.a
            {...reveal(2.4)}
            href={TITLE_SPONSOR.href}
            target="_blank"
            rel="noreferrer"
            className="text-lift mb-2 mt-2 flex items-center gap-3 text-[0.95rem] text-stone-dim transition-colors duration-300 hover:text-stone sm:mb-3 sm:mt-4"
          >
            Sponsored by
            <img src={TITLE_SPONSOR.logo} alt={TITLE_SPONSOR.name} width={1192} height={264} className="h-6 w-auto sm:h-7" />
          </motion.a>
        )}

        <motion.div {...reveal(2.5)}>
          <Countdown className="text-[18vw] sm:text-[min(15vw,17svh)]" />
        </motion.div>

        <motion.div
          {...reveal(2.75)}
          className="mt-5 flex w-full max-w-[min(92vw,68rem)] flex-col items-center gap-5 sm:mt-6 md:flex-row md:justify-between"
        >
          <p className="text-lift text-center text-[1.05rem] leading-snug text-stone-dim md:text-left">
            <span className="text-stone">Fri 23 – Sun 25 October</span>
            <span className="mx-2 text-brass" aria-hidden>/</span>
            BITS Pilani, Hyderabad Campus
          </p>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
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
          </div>
        </motion.div>
      </motion.div>

      <FilmScratches className="absolute inset-0 z-20 size-full opacity-80 mix-blend-screen" density={0.8} />
    </section>
  );
}
