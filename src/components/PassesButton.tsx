import { useState } from 'react';
import { CONTACT, FEST } from '../data/fest';

// Links to registration (FEST.registration). If it's ever closed again, the
// button says so instead of linking nowhere.
export function PassesButton({ className = '' }: { className?: string }) {
  const [pinged, setPinged] = useState(false);
  const cls = `inline-flex h-12 items-center justify-center gap-2 border border-stone/35 px-6 text-[0.95rem] font-semibold text-stone transition-colors duration-300 hover:border-brass hover:text-brass-hi ${className}`;

  if (FEST.registration.open && FEST.registration.url) {
    return (
      <a href={FEST.registration.url} target="_blank" rel="noreferrer" className={cls}>
        Register
      </a>
    );
  }
  return (
    <button type="button" className={cls} onClick={() => setPinged(true)} aria-live="polite">
      {pinged ? `Passes drop on ${CONTACT.instagram}` : 'Passes: opening soon'}
    </button>
  );
}
