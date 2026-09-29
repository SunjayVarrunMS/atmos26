import { Link } from 'react-router';
import { ArrowUpRight } from 'lucide-react';
import { CONTACT, FEST, NAV } from '../data/fest';

const card = 'border border-stone/12 bg-soot/60 p-6 sm:p-8';

export function Footer() {
  return (
    <footer className="relative bg-void px-4 pb-6 pt-24 sm:px-8">
      <div className="mx-auto grid max-w-[1440px] gap-3 md:grid-cols-12">
        <div className={`${card} md:col-span-4`}>
          <ul className="divide-y divide-stone/10">
            {NAV.map((n) => (
              <li key={n.to}>
                <Link to={n.to} className="flex items-center justify-between py-3 text-stone-dim transition-colors hover:text-stone">
                  {n.label}
                  <ArrowUpRight aria-hidden className="size-4 text-brass" strokeWidth={1.5} />
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className={`${card} flex flex-col justify-between gap-8 md:col-span-4`}>
          <div className="space-y-2 text-stone-dim">
            <a href={`mailto:${CONTACT.email}`} className="block break-all text-stone transition-colors hover:text-brass-hi">
              {CONTACT.email}
            </a>
            <a href={CONTACT.instagramHref} target="_blank" rel="noreferrer" className="block transition-colors hover:text-stone">
              Instagram {CONTACT.instagram}
            </a>
          </div>
          <address className="text-sm not-italic leading-relaxed text-stone-mute">{CONTACT.address}</address>
        </div>

        <div className={`${card} flex flex-col justify-between gap-10 md:col-span-4`}>
          <p className="stencil text-[clamp(2.4rem,4vw,3.6rem)] leading-none text-stone">
            ATMOS <span className="text-brass">’26</span>
          </p>
          <p className="text-stone-dim">
            {FEST.theme}. {FEST.subtheme}.
            <br />
            Fri 23 – Sun 25 October 2026.
          </p>
        </div>

        <div className="flex flex-col gap-2 px-1 pt-4 text-sm text-stone-mute sm:flex-row sm:justify-between md:col-span-12">
          <p>© 2026 ATMOS · BITS Pilani, Hyderabad Campus</p>
        </div>
      </div>
    </footer>
  );
}
