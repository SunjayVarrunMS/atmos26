import { motion } from 'framer-motion';
import { PageHeader } from '../components/PageHeader';
import { PROSHOWS } from '../data/proshows';
import { CONTACT } from '../data/fest';

const EXPO = [0.16, 1, 0.3, 1] as const;

export default function Proshows() {
  return (
    <>
      <PageHeader floor="intelligence" title="Proshows">
        Three nights on the main stage. The line-up stays sealed until the team reveals it on{' '}
        <a href={CONTACT.instagramHref} target="_blank" rel="noreferrer" className="text-stone underline decoration-brass/60">
          {CONTACT.instagram}
        </a>
        .
      </PageHeader>

      <section className="px-4 pb-28 sm:px-8" aria-label="Proshow nights">
        <ol className="mx-auto max-w-[1440px] space-y-3">
          {PROSHOWS.map((p, i) => (
            <motion.li
              key={p.night}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-10% 0px' }}
              transition={{ duration: 1, ease: EXPO }}
              className="glitch-hover relative overflow-hidden border border-stone/12"
            >
              <img
                src="/gallery/proshow.jpg"
                alt=""
                loading="lazy"
                className="duotone absolute inset-0 size-full object-cover opacity-25 blur-[2px]"
                style={{ objectPosition: `${20 + i * 30}% 50%` }}
              />
              <div className="relative grid gap-10 p-6 sm:p-10 md:grid-cols-[1fr_1.4fr] md:items-end">
                <div>
                  <p className="text-stone-dim">
                    {p.night} · {p.date}
                  </p>
                  <p className="stencil glitch-text mt-10 text-[clamp(2.8rem,6.5vw,6rem)] text-stone" data-text={p.codename}>
                    {p.codename}
                  </p>
                </div>
                <dl className="grid grid-cols-2 gap-6 border-t border-stone/12 pt-6 md:border-l md:border-t-0 md:pl-10 md:pt-0">
                  <div>
                    <dt className="text-stone-mute">Act</dt>
                    <dd className="mt-1 text-xl text-stone">{p.artist ?? 'Sealed'}</dd>
                  </div>
                  <div>
                    <dt className="text-stone-mute">Genre</dt>
                    <dd className="mt-1 text-xl text-stone">{p.genre}</dd>
                  </div>
                  <div>
                    <dt className="text-stone-mute">Where</dt>
                    <dd className="mt-1 text-xl text-stone">{p.venue}</dd>
                  </div>
                  <div>
                    <dt className="text-stone-mute">Clue</dt>
                    <dd className="mt-1 text-xl text-brass-hi">{p.clue}</dd>
                  </div>
                </dl>
              </div>
            </motion.li>
          ))}
        </ol>
      </section>
    </>
  );
}
