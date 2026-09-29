import { Fragment, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from 'framer-motion';
import { PageHeader } from '../components/PageHeader';
import { PassesButton } from '../components/PassesButton';
import { CATEGORIES, CLUBS, EVENTS, clubUrl, formatPrize, isCategory, type Category } from '../data/events';

const EXPO = [0.16, 1, 0.3, 1] as const;

export default function Events() {
  const [params, setParams] = useSearchParams();
  const raw = params.get('c');
  const active: Category | 'all' = isCategory(raw) ? raw : 'all';
  const list = useMemo(() => (active === 'all' ? EVENTS : EVENTS.filter((e) => e.category === active)), [active]);
  const blurb = CATEGORIES.find((c) => c.id === active)?.blurb;
  // the row under the pointer (or focus) shows its photo, as on the home page's category rows
  const [hot, setHot] = useState<string | null>(null);
  const still = useReducedMotion();

  const pick = (c: Category | 'all') => {
    const next = new URLSearchParams(params);
    if (c === 'all') next.delete('c');
    else next.set('c', c);
    setParams(next, { replace: true, preventScrollReset: true });
  };

  return (
    <>
      <PageHeader floor="silicon" title="Events">
        Competitions, workshops and experiences across three days on campus. Fees and prize pools are as
        announced; days and team sizes are confirmed as each event opens.
      </PageHeader>

      <section className="px-4 pb-24 sm:px-8" aria-label="Events">
        <div className="mx-auto max-w-[1440px]">
          {/* filter */}
          <LayoutGroup>
            <div role="tablist" aria-label="Category" className="flex flex-wrap gap-2 border-b border-stone/12 pb-6">
              {(['all', ...CATEGORIES.map((c) => c.id)] as const).map((c) => {
                const on = c === active;
                const label = c === 'all' ? 'All' : CATEGORIES.find((x) => x.id === c)!.label;
                const n = c === 'all' ? EVENTS.length : EVENTS.filter((e) => e.category === c).length;
                return (
                  <button
                    key={c}
                    role="tab"
                    aria-selected={on}
                    onClick={() => pick(c)}
                    className={`relative h-11 px-5 text-[0.95rem] font-medium transition-colors ${on ? 'text-void' : 'text-stone-dim hover:text-stone'}`}
                  >
                    {on && <motion.span layoutId="evt-pill" className="absolute inset-0 bg-stone" transition={{ duration: 0.5, ease: EXPO }} />}
                    <span className="relative">
                      {label} <span className={on ? 'text-void/60' : 'text-stone-mute'}>{n}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </LayoutGroup>
          {blurb && <p className="mt-6 max-w-[60ch] text-stone-dim">{blurb}</p>}

          {/* re-mounted per filter: a quick fade-in beats 50 rows animating out */}
          <ul
            key={active}
            className="mt-10 border-b border-stone/12"
            onMouseLeave={() => setHot(null)}
            onBlur={(ev) => !ev.currentTarget.contains(ev.relatedTarget) && setHot(null)}
          >
            {list.map((e, i) => {
              const meta = [
                active === 'all' && CATEGORIES.find((c) => c.id === e.category)!.label,
                e.team && `Team size ${e.team}`,
                e.note,
              ].filter(Boolean);
              return (
                <motion.li
                  key={e.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: EXPO, delay: Math.min(i, 8) * 0.03 }}
                  onMouseEnter={() => setHot(e.id)}
                  onFocus={() => setHot(e.id)}
                  className={`group relative border-t border-stone/12 ${hot === e.id ? 'z-10' : ''}`}
                >
                  <AnimatePresence>
                    {hot === e.id && e.image && (
                      <motion.img
                        src={e.image}
                        alt=""
                        width={960}
                        height={720}
                        className="duotone pointer-events-none absolute right-[27rem] top-1/2 hidden aspect-[4/3] w-[min(20vw,300px)] -translate-y-1/2 object-cover lg:block"
                        initial={still ? { opacity: 0 } : { opacity: 0, scale: 0.9, rotate: -3, clipPath: 'inset(50% 0 50% 0)' }}
                        animate={{ opacity: 1, scale: 1, rotate: 0, clipPath: 'inset(0% 0 0% 0)' }}
                        exit={still ? { opacity: 0 } : { opacity: 0, scale: 0.96, clipPath: 'inset(50% 0 50% 0)' }}
                        transition={{ duration: still ? 0.2 : 0.55, ease: EXPO }}
                      />
                    )}
                  </AnimatePresence>
                  <article className="grid gap-4 py-6 md:grid-cols-[minmax(0,1fr)_26rem] md:items-baseline md:gap-10 md:py-7">
                    <div className="flex items-start gap-4">
                      {/* phones and tablets have no hover, so the poster sits in the row */}
                      {e.image && (
                        <img
                          src={e.image}
                          alt=""
                          width={960}
                          height={720}
                          loading="lazy"
                          className="duotone mt-1 aspect-[4/3] w-24 shrink-0 bg-soot object-cover transition-[filter] duration-700 ease-out-expo group-hover:[filter:none] group-focus-within:[filter:none] sm:w-28 lg:hidden"
                        />
                      )}
                      <div className="min-w-0">
                        <h2 className="display text-[clamp(1.4rem,2.2vw,2rem)] text-stone transition-colors duration-500 ease-out-expo group-hover:text-brass-hi">
                          <Link to={`/events/${e.id}`} className="underline-offset-[0.15em] focus-visible:underline">
                            {e.title}
                          </Link>
                        </h2>
                        {meta.length > 0 && <p className="mt-2 text-stone-dim">{meta.join(' · ')}</p>}
                        {e.clubs && (
                          <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-2 text-stone-dim">
                            {e.clubs.map((slug, j) => (
                              <Fragment key={slug}>
                                {j > 0 && <span aria-hidden="true">×</span>}
                                <a
                                  href={clubUrl(slug)}
                                  target="_blank"
                                  rel="noopener"
                                  className="inline-flex items-center gap-2 text-stone underline-offset-4 hover:underline focus-visible:underline"
                                >
                                  {CLUBS[slug].logo && (
                                    // colour comes back when the row is hovered, like the gallery photos
                                    <img
                                      src={CLUBS[slug].logo}
                                      alt=""
                                      width={28}
                                      height={28}
                                      loading="lazy"
                                      className="duotone size-7 shrink-0 rounded-full transition-[filter] duration-700 ease-out-expo group-hover:[filter:none]"
                                    />
                                  )}
                                  {CLUBS[slug].name}
                                </a>
                              </Fragment>
                            ))}
                            {e.clubs.length === 1 && (
                              <span className="basis-full sm:basis-auto">
                                <span className="hidden sm:inline">· </span>
                                {CLUBS[e.clubs[0]].tagline}
                              </span>
                            )}
                          </p>
                        )}
                      </div>
                    </div>
                    <dl className="grid grid-cols-[8rem_minmax(0,1fr)] gap-6 text-[0.95rem]">
                      <div>
                        <dt className="text-stone-mute">Prize pool</dt>
                        <dd className="mt-1 text-stone">{formatPrize(e.prize)}</dd>
                      </div>
                      <div>
                        <dt className="text-stone-mute">Entry</dt>
                        <dd className="mt-1 text-stone">{e.fee}</dd>
                      </div>
                    </dl>
                  </article>
                </motion.li>
              );
            })}
          </ul>

          <div className="mt-24 flex flex-col items-start gap-6 border-t border-stone/12 pt-10 md:flex-row md:items-center md:justify-between">
            <p className="display max-w-[20ch] text-[clamp(1.7rem,2.6vw,2.2rem)] text-stone">
              One pass. <span className="text-brass-hi">Every arena.</span>
            </p>
            <PassesButton />
          </div>
        </div>
      </section>
    </>
  );
}
