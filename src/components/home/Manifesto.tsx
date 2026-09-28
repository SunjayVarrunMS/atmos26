import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { PassesButton } from '../PassesButton';

const EXPO = [0.16, 1, 0.3, 1] as const;
const LINES = [
  { t: 'The human hand.', hi: false },
  { t: 'The machine hand.', hi: false },
  { t: 'One campus,', hi: true },
  { t: '23 — 25 October.', hi: true },
];

/**
 * The close. The summit already landed the artwork in its ring, so the page
 * ends plainly: the statement, and the two ways in.
 */
export function Manifesto() {
  return (
    <section className="relative px-4 py-[20svh] sm:px-8" aria-labelledby="close-title">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col">
        <h2 id="close-title" className="display text-[clamp(2.2rem,4.6vw,4.4rem)]">
          {LINES.map((l, i) => (
            <motion.span
              key={l.t}
              className={`block ${l.hi ? 'text-brass-hi' : 'text-stone'}`}
              initial={{ opacity: 0, y: '0.5em', filter: 'blur(10px)' }}
              whileInView={{ opacity: 1, y: '0em', filter: 'blur(0px)' }}
              viewport={{ once: true, margin: '-15% 0px' }}
              transition={{ duration: 1.1, ease: EXPO, delay: i * 0.1 }}
            >
              {l.t}
            </motion.span>
          ))}
        </h2>
        <motion.div
          className="mt-10 flex flex-col gap-3 sm:flex-row md:mt-14"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10% 0px' }}
          transition={{ duration: 1, ease: EXPO, delay: 0.45 }}
        >
          <Link
            to="/events"
            className="inline-flex h-12 items-center justify-center bg-stone px-7 text-[0.95rem] font-semibold text-void transition-colors hover:bg-brass-hi"
          >
            Explore events
          </Link>
          <PassesButton />
        </motion.div>
      </div>
    </section>
  );
}
