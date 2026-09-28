import { useEffect, useRef, useState } from 'react';
import { Backdrop } from './backdrop';
import type { FloorId } from './chambers';
import { guessTier, type Tier } from './quality';

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
    const b = new Backdrop(el, floor, tier);
    return () => b.dispose();
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
