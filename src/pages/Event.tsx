import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeft, Share2 } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { PassesButton } from '../components/PassesButton';
import { CATEGORIES, CLUBS, clubUrl, formatPrize } from '../data/events';
import { useEvent } from '../data/eventEdits';
import { FEST } from '../data/fest';
import NotFound from './NotFound';

// One event, on its own link, so clubs and ambassadors can share exactly the
// event they're pushing. The share card for this URL is written at build time
// (see eventPages in vite.config.ts).
export default function Event() {
  const { id } = useParams();
  const event = useEvent(id);
  const [copied, setCopied] = useState(false);

  if (!event) return <NotFound />;

  const category = CATEGORIES.find((c) => c.id === event.category)!.label;
  const facts = [
    { label: 'Prize pool', value: formatPrize(event.prize) },
    { label: 'Entry', value: event.fee },
    { label: 'Team size', value: event.team ?? 'TBA' },
    { label: 'When', value: event.when ?? `${FEST.days[0].date}–${FEST.days[2].date} Oct, day TBA` },
    { label: 'Venue', value: event.venue ?? 'TBA' },
  ];

  const share = async () => {
    const url = `${FEST.url}/events/${event.id}`;
    try {
      if (navigator.share) await navigator.share({ title: `${event.title} · ATMOS ’26`, url });
      else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
      }
    } catch {
      // the share sheet was dismissed
    }
  };

  return (
    <>
      <PageHeader title={event.title}>
        {[category, event.note].filter(Boolean).join(' · ')}. At ATMOS ’26, {FEST.college}, {FEST.campus}.
      </PageHeader>

      <section className="px-4 pb-24 sm:px-8" aria-label="Details">
        <div className="mx-auto max-w-[1440px]">
          <dl className="grid grid-cols-2 gap-x-6 gap-y-8 border-y border-stone/12 py-8 md:grid-cols-3 lg:grid-cols-5">
            {facts.map((f) => (
              <div key={f.label}>
                <dt className="text-stone-mute">{f.label}</dt>
                <dd className="mt-1 text-[1.15rem] text-stone">{f.value}</dd>
              </div>
            ))}
          </dl>

          <div className={event.image ? 'md:grid md:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] md:gap-16' : ''}>
            <div>
              {event.about && <p className="mt-10 max-w-[60ch] text-[1.05rem] leading-relaxed text-stone-dim">{event.about}</p>}

              {event.clubs && (
                <div className="mt-10">
                  <h2 className="text-stone-mute">Organised by</h2>
                  <ul className="mt-4 flex flex-col gap-4">
                    {event.clubs.map((slug) => (
                      <li key={slug}>
                        <a
                          href={clubUrl(slug)}
                          target="_blank"
                          rel="noopener"
                          className="group inline-flex items-center gap-3 text-stone underline-offset-4 hover:underline focus-visible:underline"
                        >
                          {CLUBS[slug].logo && (
                            <img
                              src={CLUBS[slug].logo}
                              alt=""
                              width={40}
                              height={40}
                              className="duotone size-10 shrink-0 rounded-full transition-[filter] duration-700 ease-out-expo group-hover:[filter:none]"
                            />
                          )}
                          <span>
                            {CLUBS[slug].name}
                            <span className="block text-stone-dim">{CLUBS[slug].tagline}</span>
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-14 flex flex-wrap items-center gap-3">
                <PassesButton />
                <button
                  type="button"
                  onClick={share}
                  aria-live="polite"
                  className="inline-flex h-12 items-center justify-center gap-2 px-4 text-[0.95rem] font-semibold text-stone-dim transition-colors hover:text-stone"
                >
                  <Share2 className="size-4" strokeWidth={1.5} aria-hidden />
                  {copied ? 'Link copied' : 'Share'}
                </button>
              </div>
            </div>

            {event.image && (
              <div className="group mt-14 max-w-[24rem] md:mt-10">
                <img
                  src={event.image}
                  alt={`${event.title} poster`}
                  width={900}
                  height={1200}
                  className="duotone h-auto w-full transition-[filter] duration-700 ease-out-expo group-hover:[filter:none]"
                />
              </div>
            )}
          </div>

          <Link
            to="/events"
            className="mt-16 inline-flex items-center gap-2 text-stone-dim underline-offset-4 transition-colors hover:text-stone hover:underline"
          >
            <ArrowLeft className="size-4" strokeWidth={1.5} aria-hidden />
            All events
          </Link>
        </div>
      </section>
    </>
  );
}
