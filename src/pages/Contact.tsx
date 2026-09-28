import { PageHeader } from '../components/PageHeader';
import { ArrowUpRight } from 'lucide-react';
import { CONTACT, FEST } from '../data/fest';

// A halftone field with the campus pinned at its centre, pulsing in brass.
function LocationDots() {
  const cols = 48;
  const rows = 30;
  const dots = [];
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++) {
      const dx = (x - cols / 2) / cols;
      const dy = (y - rows / 2) / rows;
      const d = Math.hypot(dx * 1.6, dy);
      const n = Math.sin(x * 0.7 + y * 0.35) * Math.cos(y * 0.5 - x * 0.2);
      const r = Math.max(0.4, 2.6 * (1 - d * 1.6) + n * 0.6);
      dots.push(<circle key={`${x}-${y}`} cx={x * 10 + 5} cy={y * 10 + 5} r={r} opacity={0.25 + (1 - d) * 0.5} />);
    }
  return (
    <svg viewBox={`0 0 ${cols * 10} ${rows * 10}`} className="size-full" aria-hidden>
      <g className="fill-brass/70">{dots}</g>
      <circle cx={cols * 5} cy={rows * 5} r="7" className="fill-signal" />
      <circle cx={cols * 5} cy={rows * 5} r="7" className="origin-center animate-ping fill-none stroke-signal [transform-box:fill-box]" strokeWidth="1.5" />
    </svg>
  );
}

export default function Contact() {
  const rows = [
    {
      label: 'Write',
      // break only after the @, never at the address's own hyphen
      value: (
        <>
          atmos@
          <wbr />
          {CONTACT.email.split('@')[1]}
        </>
      ),
      href: `mailto:${CONTACT.email}`,
    },
    { label: 'Follow', value: CONTACT.instagram, href: CONTACT.instagramHref, external: true },
    { label: 'Find us', value: 'Open in Google Maps', href: CONTACT.mapsHref, external: true },
  ];
  return (
    <>
      <PageHeader floor="genome" title="Contact">Questions about events, passes, stays or sponsorship. Someone from the team will answer.</PageHeader>

      <section className="px-4 pb-24 sm:px-8" aria-label="Ways to reach us">
        <ul className="mx-auto max-w-[1440px] border-b border-stone/12">
          {rows.map((r) => (
            <li key={r.label} className="border-t border-stone/12">
              <a
                href={r.href}
                {...(r.external ? { target: '_blank', rel: 'noreferrer' } : {})}
                className="group grid gap-2 py-7 md:grid-cols-[14rem_1fr] md:items-baseline"
              >
                <span className="text-stone-mute">{r.label}</span>
                <span className="text-[clamp(1.25rem,2.6vw,2.4rem)] font-semibold text-stone [hyphens:none] transition-colors duration-300 group-hover:text-brass-hi">
                  {r.value}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="px-4 pb-28 sm:px-8" aria-label="Map">
        <div className="mx-auto grid max-w-[1440px] gap-8 md:grid-cols-[1fr_2fr]">
          <address className="not-italic leading-relaxed text-stone-dim">
            <span className="block text-stone">BITS Pilani, Hyderabad Campus</span>
            {CONTACT.address.replace('BITS Pilani, Hyderabad Campus, ', '')}
          </address>
          <a
            href={CONTACT.mapsHref}
            target="_blank"
            rel="noreferrer"
            className="group relative block aspect-[16/10] overflow-hidden border border-stone/12"
            aria-label="Open BITS Pilani Hyderabad Campus in Google Maps"
          >
            <LocationDots />
            <span className="absolute bottom-5 left-5 flex items-center gap-2 bg-void/80 px-4 py-2.5 text-stone backdrop-blur transition-colors group-hover:text-brass-hi">
              Open in Google Maps <ArrowUpRight className="size-4" strokeWidth={1.5} aria-hidden />
            </span>
            <span className="absolute right-5 top-5 text-sm text-stone-mute tabular">
              {FEST.coordinates.lat.toFixed(4)}° N, {FEST.coordinates.lng.toFixed(4)}° E
            </span>
          </a>
        </div>
      </section>
    </>
  );
}
