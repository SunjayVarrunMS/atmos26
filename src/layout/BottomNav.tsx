import { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router';
import { CalendarDays, Handshake, Home, Images, Ticket } from 'lucide-react';
import { CONTACT, FEST } from '../data/fest';

const ITEMS = [
  { to: '/', label: 'Home', Icon: Home },
  { to: '/events', label: 'Events', Icon: CalendarDays },
  { to: '/gallery', label: 'Gallery', Icon: Images },
  { to: '/sponsors', label: 'Sponsors', Icon: Handshake },
];

// Phones and tablets: the main pages and passes under the thumb. Off on the
// home hero, which carries its own buttons, and while the menu is open.
export function BottomNav({ hidden }: { hidden: boolean }) {
  const { pathname } = useLocation();
  const [scrolledHero, setScrolledHero] = useState(false);
  const [pinged, setPinged] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolledHero(window.scrollY >= window.innerHeight * 0.8);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [pathname]);

  const onHomeHero = pathname === '/' && !scrolledHero;
  const visible = !hidden && !onHomeHero;

  return (
    <nav
      aria-label="Quick"
      aria-hidden={!visible}
      inert={!visible}
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-brass-line bg-void/95 pb-[env(safe-area-inset-bottom)] lg:hidden transition-transform duration-500 ease-out-expo ${
        visible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      <div className="flex h-14 items-stretch">
        {ITEMS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center justify-center gap-1 text-[0.72rem] font-medium transition-colors ${
                isActive ? 'text-brass-hi' : 'text-stone-dim'
              }`
            }
          >
            <Icon className="size-5" strokeWidth={1.5} aria-hidden />
            <span>{label}</span>
          </NavLink>
        ))}

        {FEST.registration.open && FEST.registration.url ? (
          <a
            href={FEST.registration.url}
            target="_blank"
            rel="noreferrer"
            className="flex w-24 shrink-0 flex-col items-center justify-center gap-1 bg-stone px-5 text-[0.72rem] font-medium text-void transition-colors hover:bg-brass-hi"
          >
            <Ticket className="size-5" strokeWidth={1.5} aria-hidden />
            <span>Register</span>
          </a>
        ) : (
          <button
            type="button"
            onClick={() => setPinged(true)}
            aria-live="polite"
            className="flex w-24 shrink-0 flex-col items-center justify-center gap-1 bg-stone px-1 text-[0.72rem] font-medium text-void transition-colors hover:bg-brass-hi"
          >
            <Ticket className="size-5" strokeWidth={1.5} aria-hidden />
            <span className="truncate">{pinged ? CONTACT.instagram : 'Passes'}</span>
          </button>
        )}
      </div>
    </nav>
  );
}
