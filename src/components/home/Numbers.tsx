import { motion } from 'framer-motion';
import { STATS } from '../../data/fest';

const EXPO = [0.16, 1, 0.3, 1] as const;

function Figure({ to, prefix = '', suffix = '' }: { to: number; prefix?: string; suffix?: string }) {
  return (
    <span className="tabular">
      {prefix}
      {to.toLocaleString('en-IN')}
      {suffix}
    </span>
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
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-10% 0px' }}
              transition={{ duration: 1, ease: EXPO, delay: i * 0.05 }}
              className="grid grid-cols-1 items-end gap-2 border-t border-stone/12 py-6 sm:grid-cols-[1fr_auto] md:py-8"
            >
              <dd className="display order-2 text-[clamp(3rem,7vw,6.8rem)] text-stone sm:order-1">
                <Figure to={s.value} prefix={'prefix' in s ? s.prefix : ''} suffix={s.suffix} />
              </dd>
              <dt className="text-lift order-1 text-[clamp(1.05rem,1.5vw,1.35rem)] sm:order-2 sm:pb-4 sm:text-right">
                <span className="text-brass-hi">{s.label}</span>
                <span className="block text-stone-mute">{s.note}</span>
              </dt>
            </motion.div>
          ))}
        </dl>
      </div>
    </section>
  );
}
