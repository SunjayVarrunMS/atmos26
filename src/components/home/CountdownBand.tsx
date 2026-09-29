import { motion } from 'framer-motion';
import { Countdown } from '../hero/Countdown';
import { useReducedMotion } from '../../lib/hooks';

const EXPO = [0.16, 1, 0.3, 1] as const;

// The reel's live clock, on its own between the hero and the ascent: the
// first thing a scroll reaches, at the size it had as the hero's end card.
export function CountdownBand() {
  const still = useReducedMotion();
  return (
    <section className="relative flex justify-center overflow-x-clip px-4 py-[14svh] sm:px-8" aria-label="Countdown to ATMOS 2026">
      <motion.div
        initial={still ? false : { opacity: 0, y: 24, filter: 'blur(8px)' }}
        whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        viewport={{ once: true, margin: '-15% 0px' }}
        transition={{ duration: 1.2, ease: EXPO }}
      >
        <Countdown className="text-[18vw] sm:text-[min(15vw,17svh)]" />
      </motion.div>
    </section>
  );
}
