import { useEffect, useRef } from 'react';
import { NavLink } from 'react-router';
import { motion } from 'framer-motion';
import { CONTACT, NAV } from '../data/fest';
import { PassesButton } from '../components/PassesButton';

const EASE = [0.16, 1, 0.3, 1] as const;

// Full-screen ring overlay. The menu opens as an iris from the menu button.
export function MobileMenu({ onClose }: { onClose: () => void }) {
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    panel.current?.querySelector<HTMLElement>('a,button')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key !== 'Tab' || !panel.current) return;
      const items = [...panel.current.querySelectorAll<HTMLElement>('a,button')];
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      prev?.focus();
    };
  }, [onClose]);

  return (
    <motion.div
      ref={panel}
      id="mobile-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      className="fixed inset-0 z-[80] overflow-hidden bg-void"
      initial={{ clipPath: 'circle(0% at calc(100% - 38px) 32px)' }}
      animate={{ clipPath: 'circle(150% at calc(100% - 38px) 32px)' }}
      exit={{ clipPath: 'circle(0% at calc(100% - 38px) 32px)' }}
      transition={{ duration: 0.7, ease: EASE }}
      data-lenis-prevent
    >
      {/* the portal ring behind the links */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 aspect-square w-[140vmin] -translate-x-1/2 -translate-y-1/2 rounded-full border border-brass/40"
        initial={{ scale: 0.6, rotate: -30, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ duration: 1.1, ease: EASE, delay: 0.1 }}
      >
        <div className="absolute inset-[6%] rounded-full bg-[radial-gradient(circle,rgb(47_163_168/0.22)_0%,rgb(18_62_68/0.18)_40%,transparent_70%)]" />
      </motion.div>

      <div className="relative flex h-full flex-col px-6 pb-8 pt-5">
        <div className="flex items-center justify-between">
          <span className="stencil text-[1.35rem]">
            ATMOS <span className="text-brass">’26</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="flex size-11 items-center justify-center rounded-full border border-brass-line text-stone"
            aria-label="Close menu"
          >
            <span aria-hidden className="relative block size-4">
              <span className="absolute left-0 top-1/2 h-px w-full rotate-45 bg-current" />
              <span className="absolute left-0 top-1/2 h-px w-full -rotate-45 bg-current" />
            </span>
          </button>
        </div>

        <nav aria-label="Mobile" className="flex flex-1 flex-col justify-center gap-1">
          <MenuLink to="/" label="Home" i={0} />
          {NAV.map((item, i) => (
            <MenuLink key={item.to} to={item.to} label={item.label} i={i + 1} />
          ))}
        </nav>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE, delay: 0.45 }}
          className="space-y-5"
        >
          <PassesButton className="w-full" />
          <p className="text-stone-dim">Fri 23 – Sun 25 October · {CONTACT.instagram}</p>
        </motion.div>
      </div>
    </motion.div>
  );
}

function MenuLink({ to, label, i }: { to: string; label: string; i: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -24 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.7, ease: EASE, delay: 0.12 + i * 0.05 }}
    >
      <NavLink
        to={to}
        end={to === '/'}
        className={({ isActive }) =>
          `stencil block py-1 text-[clamp(2.6rem,12vw,4.5rem)] transition-colors ${
            isActive ? 'text-brass' : 'text-stone hover:text-brass-hi'
          }`
        }
      >
        {label}
      </NavLink>
    </motion.div>
  );
}
