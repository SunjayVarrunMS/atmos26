import { PageHeader } from '../components/PageHeader';
import { CONTACT } from '../data/fest';

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
          <div className="group relative aspect-[16/10] overflow-hidden border border-stone/12 bg-void">
            {/* dark and grey to sit in the page; colour comes back on hover, like the photos */}
            <iframe
              src={CONTACT.mapsEmbed}
              title="Map of BITS Pilani, Hyderabad Campus"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="size-full border-0 [filter:invert(0.9)_hue-rotate(180deg)_grayscale(1)_contrast(0.9)] transition-[filter] duration-500 group-hover:[filter:invert(0.9)_hue-rotate(180deg)_grayscale(0)_contrast(0.9)]"
            />
          </div>
        </div>
      </section>
    </>
  );
}
