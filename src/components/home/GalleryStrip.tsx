import { useRef } from 'react';
import { Link } from 'react-router';
import { motion, useScroll, useTransform } from 'framer-motion';
import { GALLERY } from '../../data/fest';
import { useReducedMotion } from '../../lib/hooks';

// Past editions in duotone, sliding sideways as you scroll down. Colour comes
// back on hover.
export function GalleryStrip() {
  const ref = useRef<HTMLDivElement>(null);
  const still = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const x = useTransform(scrollYProgress, [0, 1], ['4%', '-38%']);

  return (
    <section className="relative overflow-hidden py-[14svh]" aria-labelledby="gal-title">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-end justify-between gap-6 px-4 sm:px-8">
        <h2 id="gal-title" className="display text-[clamp(2rem,3.6vw,3.4rem)] text-stone">
          Been here <span className="text-brass-hi">before?</span>
        </h2>
        <Link to="/gallery" className="text-[1.05rem] text-stone-dim underline decoration-brass/60 hover:text-stone">
          Full gallery
        </Link>
      </div>
      <div ref={ref} className="mt-14">
        <motion.ul className="flex w-max gap-4 px-4 sm:gap-6 sm:px-8" style={still ? undefined : { x }}>
          {GALLERY.slice(0, 9).map((g, i) => (
            <li key={g.src} className={`group shrink-0 ${i % 2 ? 'mt-16' : ''}`}>
              <div className="overflow-hidden">
                <img
                  src={g.src}
                  alt={g.caption}
                  loading="lazy"
                  className="duotone h-[clamp(240px,42svh,460px)] w-auto object-cover transition-[filter] duration-700 ease-out-expo group-hover:[filter:none]"
                />
              </div>
            </li>
          ))}
        </motion.ul>
      </div>
    </section>
  );
}
