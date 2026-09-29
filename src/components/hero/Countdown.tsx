import { Fragment, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FEST } from '../../data/fest';
import { useNow, useReducedMotion } from '../../lib/hooks';

const EXPO = [0.16, 1, 0.3, 1] as const;

// whole calendar days between today and the opening day, counted in IST
function daysUntil(now: number, when: Date) {
  const ist = (t: number) => {
    const d = new Date(t + 5.5 * 3_600_000);
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  };
  return Math.round((ist(when.getTime()) - ist(now)) / 86_400_000);
}

// one stencil digit that rolls up to its new value, like a mechanical counter.
// The window is clipped to the glyphs' own height (Stardos digits fill about
// 0.08–0.8em of the line), so a rolling digit never shows below the row.
function RollDigit({ d, glitch, still }: { d: string; glitch: boolean; still: boolean }) {
  return (
    <span
      data-text={d}
      className={`glitch-text relative inline-block h-[1em] w-[0.6em] overflow-hidden text-center leading-none [clip-path:inset(0.04em_0_0.18em)] ${glitch ? 'glitch-run' : ''}`}
    >
      {still ? (
        <span className="absolute inset-0">{d}</span>
      ) : (
        <AnimatePresence initial={false}>
          <motion.span
            key={d}
            className="absolute inset-0"
            initial={{ y: '100%', filter: 'blur(4px)' }}
            animate={{ y: '0%', filter: 'blur(0px)' }}
            exit={{ y: '-100%', filter: 'blur(4px)' }}
            transition={{ duration: 0.55, ease: EXPO }}
          >
            {d}
          </motion.span>
        </AnimatePresence>
      )}
    </span>
  );
}

// The countdown reel's title card, live to the second: days, hours, minutes and
// seconds rolling in the reel's stencil, with its red glitch firing now and then.
export function Countdown({ className = '', glitch = true }: { className?: string; glitch?: boolean }) {
  const now = useNow(1000);
  const still = useReducedMotion();
  const [run, setRun] = useState(0);

  useEffect(() => {
    if (!glitch || still) return;
    let t = 0;
    const next = () => {
      t = window.setTimeout(() => {
        setRun((r) => r + 1);
        next();
      }, 5000 + Math.random() * 7000);
    };
    // first one right after the hero lands
    t = window.setTimeout(() => {
      setRun(1);
      next();
    }, 900);
    return () => clearTimeout(t);
  }, [glitch, still]);

  const start = FEST.startsAt.getTime();
  const end = FEST.endsAt.getTime();

  if (now >= start) {
    let text: string;
    let label: string;
    if (now >= end) {
      text = 'See you in ’27';
      label = 'ATMOS 2026 has ended. See you next year.';
    } else {
      const day = Math.min(3, Math.floor((now - start) / 86_400_000) + 1);
      text = `Day ${day} is live`;
      label = `ATMOS 2026 is live, day ${day} of 3.`;
    }
    return (
      <p
        key={run}
        aria-label={label}
        data-text={text}
        className={`stencil glitch-text origin-center scale-x-[0.74] whitespace-nowrap text-stone ${run ? 'glitch-run' : ''} ${className}`}
      >
        {text}
      </p>
    );
  }

  const left = Math.max(0, Math.floor((start - now) / 1000));
  const groups = [
    { value: String(Math.floor(left / 86_400)).padStart(2, '0'), unit: 'days' },
    { value: String(Math.floor(left / 3600) % 24).padStart(2, '0'), unit: 'hrs' },
    { value: String(Math.floor(left / 60) % 60).padStart(2, '0'), unit: 'min' },
    { value: String(left % 60).padStart(2, '0'), unit: 'sec' },
  ];
  // announced once a day, not every second
  const days = daysUntil(now, FEST.startsAt);
  const label = `${days} ${days === 1 ? 'day' : 'days'} to go until ATMOS 2026.`;

  return (
    <div className={className}>
      <p className="sr-only">{label}</p>
      <div
        key={run}
        aria-hidden
        className="stencil flex origin-center scale-x-[0.74] items-start justify-center whitespace-nowrap text-stone"
      >
        {groups.map((g, i) => (
          <Fragment key={g.unit}>
            {i > 0 && (
              <span data-text=":" className={`glitch-text h-[1em] px-[0.06em] leading-none text-stone-mute ${run ? 'glitch-run' : ''}`}>
                :
              </span>
            )}
            <span className="flex flex-col items-center">
              <span className="flex">
                {g.value.split('').map((d, j, all) => (
                  <RollDigit key={all.length - j} d={d} glitch={run > 0} still={still} />
                ))}
              </span>
              <span className="text-lift mt-1 inline-block scale-x-[1.35] font-sans text-[0.95rem] font-normal normal-case tracking-normal text-stone-dim sm:mt-3">
                {g.unit}
              </span>
            </span>
          </Fragment>
        ))}
      </div>
    </div>
  );
}
