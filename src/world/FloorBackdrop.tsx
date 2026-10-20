import { useEffect, useRef, useState } from 'react';
import type { Backdrop } from './backdrop';
import type { FloorId } from './chambers';
import { guessTier, PHONE, type Tier } from './quality';

/**
 * A floor of the building behind an inner page's header. Live where the
 * device can carry it; otherwise the floor's rendered still.
 */
export default function FloorBackdrop({ floor }: { floor: FloorId }) {
  const host = useRef<HTMLDivElement>(null);
  const [tier] = useState<Tier>(guessTier);

  useEffect(() => {
    const el = host.current;
    if (!el || tier === 'still') return;
    // three.js comes with the backdrop, so the still tier never downloads it
    let b: Backdrop | undefined;
    let gone = false;
    const start = () => {
      import('./backdrop').then((m) => {
        if (!gone) b = new m.Backdrop(el, floor, tier);
      });
    };
    // the page's title and words paint first; the machine boots once the browser is idle.
    // A phone also waits out the header's reveal (PageHeader: 0.45 s delay + 1 s), since
    // compiling the scene mid-reveal stalls the text on a slow CPU
    let idle: number | undefined;
    const wait = window.setTimeout(
      () => {
        if ('requestIdleCallback' in window) idle = window.requestIdleCallback(start, { timeout: 1500 });
        else start();
      },
      PHONE ? 1500 : 0,
    );
    return () => {
      gone = true;
      window.clearTimeout(wait);
      if (idle !== undefined) window.cancelIdleCallback(idle);
      b?.dispose();
    };
  }, [floor, tier]);

  if (tier === 'still') {
    return (
      <img
        src={`/world/stills/${floor}.webp`}
        alt=""
        aria-hidden
        className="absolute inset-0 size-full object-cover object-right opacity-70"
      />
    );
  }
  return <div ref={host} aria-hidden className="absolute inset-0" />;
}
