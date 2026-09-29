import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { STATS } from '../../data/fest';

const EXPO = [0.16, 1, 0.3, 1] as const;

// the figure carries the countdown's red/cyan channel split: once as it lands,
// and again whenever its row is hovered
function Figure({ to, prefix = '', suffix = '', glitch }: { to: number; prefix?: string; suffix?: string; glitch: boolean }) {
  const text = `${prefix}${to.toLocaleString('en-IN')}${suffix}`;
  return (
    <span data-text={text} className={`tabular glitch-text inline-block ${glitch ? 'glitch-run' : ''}`}>
      {text}
    </span>
  );
}

function Stat({ s, i }: { s: (typeof STATS)[number]; i: number }) {
  // on while the landing glitch plays, then off so a hover can play it again
  const [glitch, setGlitch] = useState(false);
  const [landed, setLanded] = useState(false);
  useEffect(() => {
    if (!landed) return;
    // rows that land together glitch one after another, top to bottom
    const at = 350 + i * 140;
    const on = window.setTimeout(() => setGlitch(true), at);
    const off = window.setTimeout(() => setGlitch(false), at + 500);
    return () => {
      clearTimeout(on);
      clearTimeout(off);
    };
  }, [landed, i]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10% 0px' }}
      onViewportEnter={() => setLanded(true)}
      transition={{ duration: 1, ease: EXPO, delay: i * 0.05 }}
      className="glitch-hover grid grid-cols-1 items-end gap-2 border-t border-stone/12 py-6 sm:grid-cols-[1fr_auto] md:py-8"
    >
      <dd className="display order-2 text-[clamp(3rem,7vw,6.8rem)] text-stone sm:order-1">
        <Figure to={s.value} prefix={'prefix' in s ? s.prefix : ''} suffix={s.suffix} glitch={glitch} />
      </dd>
      <dt className="text-lift order-1 text-[clamp(1.05rem,1.5vw,1.35rem)] sm:order-2 sm:pb-4 sm:text-right">
        <span className="text-brass-hi">{s.label}</span>
        <span className="block text-stone-mute">{s.note}</span>
      </dt>
    </motion.div>
  );
}

// What previous editions add up to, set as large as the screen allows.
export function Numbers() {
  return (
    <section className="relative px-4 py-[18svh] sm:px-8" aria-labelledby="numbers-title">
      <div className="mx-auto max-w-[1440px]">
        <h2 id="numbers-title" className="max-w-[28ch] text-[clamp(1.05rem,1.4vw,1.3rem)] text-stone-dim">
          Past editions of ATMOS, counted.
        </h2>
        <dl className="mt-12">
          {STATS.map((s, i) => (
            <Stat key={s.label} s={s} i={i} />
          ))}
        </dl>
      </div>
    </section>
  );
}
