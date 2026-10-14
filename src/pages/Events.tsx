import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router';
import { LayoutGroup, motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRight, Search } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { PassesButton } from '../components/PassesButton';
import { CATEGORIES, CLUBS, EVENTS, feeValue, formatPrize, isCategory, type Category } from '../data/events';

const EXPO = [0.16, 1, 0.3, 1] as const;

type Sort = 'prize' | 'az' | 'fee';
const isSort = (v: string | null): v is Sort => v === 'prize' || v === 'az' || v === 'fee';

export default function Events() {
  const [params, setParams] = useSearchParams();
  const raw = params.get('c');
  const active: Category | 'all' = isCategory(raw) ? raw : 'all';
  const q = params.get('q') ?? '';
  const rawSort = params.get('s');
  const sort: Sort = isSort(rawSort) ? rawSort : 'prize';
  const blurb = CATEGORIES.find((c) => c.id === active)?.blurb;
  const still = useReducedMotion();

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const byTitle = (a: { title: string }, b: { title: string }) => a.title.localeCompare(b.title);
    const found = EVENTS.filter((e) => active === 'all' || e.category === active).filter(
      (e) =>
        !needle ||
        e.title.toLowerCase().includes(needle) ||
        (e.note?.toLowerCase().includes(needle) ?? false) ||
        (e.clubs?.some((slug) => CLUBS[slug].name.toLowerCase().includes(needle)) ?? false),
    );
    return [...found].sort((a, b) => {
      if (sort === 'az') return byTitle(a, b);
      if (sort === 'prize') return (b.prize ?? -1) - (a.prize ?? -1) || byTitle(a, b);
      const fa = feeValue(a.fee);
      const fb = feeValue(b.fee);
      return (fa === fb ? 0 : fa - fb) || byTitle(a, b);
    });
  }, [active, q, sort]);

  const update = (key: 'c' | 'q' | 's', value: string, fallback: string) => {
    const next = new URLSearchParams(params);
    if (value === fallback) next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true, preventScrollReset: true });
  };
  const pick = (c: Category | 'all') => update('c', c, 'all');

  return (
    <>
      <PageHeader floor="silicon" title="Events">
        Competitions, workshops and experiences across three days on campus. Fees and prize pools are as
        announced; days and team sizes are confirmed as each event opens.
      </PageHeader>

      <section className="px-4 pb-24 sm:px-8" aria-label="Events">
        <div className="mx-auto max-w-[1440px]">
          <div className="sticky top-16 z-30 -mx-4 border-b border-stone/12 bg-void/90 px-4 py-4 backdrop-blur-md sm:-mx-8 sm:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
              <LayoutGroup>
                <div role="group" aria-label="Filter by category" className="flex gap-2 overflow-x-auto [scrollbar-width:none] lg:overflow-visible">
                  {(['all', ...CATEGORIES.map((c) => c.id)] as const).map((c) => {
                    const on = c === active;
                    const label = c === 'all' ? 'All' : CATEGORIES.find((x) => x.id === c)!.label;
                    const n = c === 'all' ? EVENTS.length : EVENTS.filter((e) => e.category === c).length;
                    return (
                      <button
                        key={c}
                        type="button"
                        aria-pressed={on}
                        onClick={() => pick(c)}
                        className={`relative h-11 shrink-0 px-5 text-[0.95rem] font-medium transition-colors ${on ? 'text-void' : 'text-stone-dim hover:text-stone'}`}
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

              <div className="flex w-full gap-3 lg:w-auto">
                <label className="relative block min-w-0 flex-1 lg:flex-none">
                  <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-mute" strokeWidth={1.5} aria-hidden />
                  <input
                    type="search"
                    value={q}
                    onChange={(ev) => update('q', ev.target.value, '')}
                    placeholder="Search events"
                    aria-label="Search events or clubs"
                    className="h-11 w-full border border-stone/20 bg-transparent pl-9 pr-3 text-[0.95rem] text-stone placeholder:text-stone-mute focus:border-brass lg:w-72"
                  />
                </label>
                <label className="sr-only" htmlFor="evt-sort">
                  Sort
                </label>
                <select
                  id="evt-sort"
                  value={sort}
                  onChange={(ev) => update('s', ev.target.value, 'prize')}
                  className="h-11 shrink-0 border border-stone/20 bg-void px-3 text-[0.95rem] text-stone focus:border-brass"
                >
                  <option value="prize">Biggest prize</option>
                  <option value="az">A–Z</option>
                  <option value="fee">Lowest entry</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-6">
            {blurb && <p className="mb-2 max-w-[60ch] text-stone-dim">{blurb}</p>}
            <p className="text-stone-dim" aria-live="polite">
              {list.length} {list.length === 1 ? 'event' : 'events'}
              {q && <> for “{q}”</>}
            </p>
          </div>

          {list.length === 0 ? (
            <div className="mt-6 border border-stone/12 px-6 py-16 text-center">
              <p className="display text-[clamp(1.6rem,2.4vw,2.2rem)] text-stone">
                No events match <span className="text-brass-hi">“{q}”</span>
              </p>
              <button
                type="button"
                onClick={() => update('q', '', '')}
                className="mt-6 inline-flex h-11 items-center border border-stone/30 px-5 text-[0.95rem] font-medium text-stone hover:border-stone"
              >
                Clear search
              </button>
            </div>
          ) : (
            // re-mounted per category and sort only: typing in the search must not replay every card
            <ul key={`${active}-${sort}`} className="mt-6 grid border-l border-t border-stone/12 sm:grid-cols-2 xl:grid-cols-3">
              {list.map((e, i) => {
                const desc = e.about ?? e.note;
                return (
                  <motion.li
                    key={e.id}
                    className="border-b border-r border-stone/12"
                    initial={still ? { opacity: 0 } : { opacity: 0, y: 16, filter: 'blur(6px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ duration: 0.6, ease: EXPO, delay: Math.min(i, 8) * 0.03 }}
                  >
                    <Link
                      to={`/events/${e.id}`}
                      className="group flex h-full flex-col p-6 transition-colors duration-500 ease-out-expo hover:bg-soot sm:p-7"
                    >
                      {e.image && (
                        <img
                          src={e.image}
                          alt=""
                          width={900}
                          height={675}
                          loading="lazy"
                          className="duotone mb-6 aspect-[4/3] w-full object-cover object-top transition-[filter] duration-700 ease-out-expo group-hover:[filter:none]"
                        />
                      )}
                      <div className="flex items-start justify-between gap-4 text-[0.9rem] text-stone-dim">
                        {e.clubs ? (
                          <div className="flex min-w-0 items-start gap-2">
                            {e.clubs.some((slug) => CLUBS[slug].logo) && (
                              <span className="flex shrink-0 -space-x-1.5">
                                {e.clubs.map(
                                  (slug) =>
                                    CLUBS[slug].logo && (
                                      <img
                                        key={slug}
                                        src={CLUBS[slug].logo}
                                        alt=""
                                        width={24}
                                        height={24}
                                        loading="lazy"
                                        className="duotone size-6 rounded-full ring-1 ring-void transition-[filter] duration-700 ease-out-expo group-hover:[filter:none]"
                                      />
                                    ),
                                )}
                              </span>
                            )}
                            <span className="pt-0.5">{e.clubs.map((slug) => CLUBS[slug].name).join(' × ')}</span>
                          </div>
                        ) : (
                          <span />
                        )}
                        {active === 'all' && (
                          <span className="shrink-0 text-stone-mute">{CATEGORIES.find((c) => c.id === e.category)!.label}</span>
                        )}
                      </div>
                      <h2 className="display mt-5 text-[clamp(1.5rem,2vw,2rem)] text-stone transition-colors duration-500 ease-out-expo group-hover:text-brass-hi">
                        {e.title}
                      </h2>
                      {e.about && e.note && <p className="mt-2 text-[0.9rem] text-stone-mute">{e.note}</p>}
                      {desc && <p className="mt-3 line-clamp-2 text-stone-dim">{desc}</p>}
                      <div className="mt-auto pt-6">
                        <div className="flex items-end justify-between gap-4 border-t border-stone/12 pt-4">
                          <dl className="flex flex-wrap gap-x-8 gap-y-2">
                            <div>
                              <dt className="text-[0.85rem] text-stone-mute">Prize pool</dt>
                              {e.prize !== null ? (
                                <dd className="stencil mt-0.5 text-[1.6rem] text-brass-hi">{formatPrize(e.prize)}</dd>
                              ) : (
                                <dd className="mt-0.5 text-stone-dim">No prize pool</dd>
                              )}
                            </div>
                            <div>
                              <dt className="text-[0.85rem] text-stone-mute">Entry</dt>
                              <dd className="mt-0.5 text-[1.05rem] text-stone">{e.fee}</dd>
                            </div>
                            {e.when && (
                              <div>
                                <dt className="text-[0.85rem] text-stone-mute">When</dt>
                                <dd className="mt-0.5 text-[1.05rem] text-stone">{e.when}</dd>
                              </div>
                            )}
                          </dl>
                          <ArrowUpRight
                            className="size-5 shrink-0 text-stone-mute transition-[color,transform] duration-500 ease-out-expo group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brass-hi"
                            strokeWidth={1.5}
                            aria-hidden
                          />
                        </div>
                      </div>
                    </Link>
                  </motion.li>
                );
              })}
            </ul>
          )}

          <div className="mt-24 flex flex-col items-start gap-6 border-t border-stone/12 pt-10 md:flex-row md:items-center md:justify-between">
            <p className="display max-w-[20ch] text-[clamp(1.7rem,2.6vw,2.2rem)] text-stone">
              One link. <span className="text-brass-hi">Every event.</span>
            </p>
            <PassesButton />
          </div>
        </div>
      </section>
    </>
  );
}
