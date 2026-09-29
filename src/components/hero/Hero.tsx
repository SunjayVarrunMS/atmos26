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
 * First screen, one centred column: the official logo, the title sponsor,
 * the dates and venue, the live countdown in the reel's stencil, then the
 * two actions. Nothing else.
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
        className="relative w-[min(100vw,600px)] sm:w-[min(88vw,calc(100svh-4rem-min(8vw,9svh)-19rem-4svh))]"
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
        className="relative z-10 -mt-[3%] flex w-full flex-col items-center px-4 text-center sm:px-8"
        style={still ? undefined : { opacity: textOpacity, y: textY }}
      >
        {TITLE_SPONSOR && (
          <motion.a
            {...reveal(2.4)}
            href={TITLE_SPONSOR.href}
            target="_blank"
            rel="noreferrer"
            className="group mt-5 flex flex-col items-center gap-2 sm:mt-[4svh]"
          >
            <img
              src={TITLE_SPONSOR.logo}
              alt={TITLE_SPONSOR.name}
              width={1192}
              height={264}
              className="h-9 w-auto sm:h-[clamp(2.25rem,5svh,2.75rem)]"
            />
            <span className="meta text-stone-dim transition-colors duration-300 group-hover:text-stone">Title sponsor</span>
          </motion.a>
        )}

        <motion.div {...reveal(2.55)} className="mt-6 sm:mt-[3svh]">
          <p className="display text-[clamp(1.75rem,min(4vw,5.5svh),3.2rem)] text-stone">23–25 October 2026</p>
          <p className="meta mt-2 text-stone-dim">
            {FEST.college}, {FEST.campus}
          </p>
        </motion.div>

        <motion.div {...reveal(2.7)} className="mt-5 sm:mt-[2.5svh]">
          <Countdown className="text-[13vw] sm:text-[min(8vw,9svh)]" />
        </motion.div>

        <motion.div
          {...reveal(2.85)}
          className="mt-6 flex w-full flex-col gap-3 sm:mt-[3svh] sm:w-auto sm:flex-row sm:justify-center"
        >
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
      </motion.div>

      <FilmScratches className="absolute inset-0 z-20 size-full opacity-80 mix-blend-screen" density={0.8} />
    </section>
  );
}
