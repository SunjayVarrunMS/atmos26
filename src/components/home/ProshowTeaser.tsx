import { Link } from 'react-router';
import { motion } from 'framer-motion';
import { PROSHOWS } from '../../data/proshows';

const EXPO = [0.16, 1, 0.3, 1] as const;

// Three nights as full-width bands, artists sealed until the team announces them.
export function ProshowTeaser() {
  return (
    <section className="relative overflow-hidden px-4 py-[16svh] sm:px-8" aria-labelledby="pro-title">
      <img src="/gallery/proshow.jpg" alt="" className="duotone absolute inset-0 -z-10 size-full object-cover opacity-40" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,#000_0%,rgb(0_0_0/0.4)_35%,rgb(0_0_0/0.4)_65%,#000_100%)]" />
      <div className="mx-auto max-w-[1440px]">
        <h2 id="pro-title" className="display text-[clamp(2rem,3.9vw,3.9rem)] text-stone">
          Three nights.
          <br />
          <span className="text-brass-hi">Names sealed.</span>
        </h2>
        <ol className="mt-14 border-b border-stone/15">
          {PROSHOWS.map((p, i) => (
            <motion.li
              key={p.night}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-10% 0px' }}
              transition={{ duration: 0.9, ease: EXPO, delay: i * 0.08 }}
              className="glitch-hover grid items-baseline gap-2 border-t border-stone/15 py-6 md:grid-cols-[12rem_1fr_auto] md:gap-8 md:py-8"
            >
              <p className="text-lift text-stone-dim">
                {p.night} · {p.date}
              </p>
              <p className="stencil glitch-text text-[clamp(2.4rem,5.8vw,5.2rem)] text-stone" data-text={p.codename}>
                {p.codename}
              </p>
              <p className="text-lift text-stone-dim md:text-right">
                {p.genre}
                <span className="block text-brass-hi">Act sealed</span>
              </p>
            </motion.li>
          ))}
        </ol>
        <Link to="/proshows" className="mt-10 inline-block text-[1.05rem] text-stone-dim underline decoration-brass/60 hover:text-stone">
          Proshow details
        </Link>
      </div>
    </section>
  );
}
