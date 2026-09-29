import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { AnimatePresence } from 'framer-motion';
import { NAV } from '../data/fest';
import { useLenis } from '../components/SmoothScroll';
import { MobileMenu } from './MobileMenu';
import { SoundToggle } from './SoundToggle';
import { useWorld } from '../world/store';

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const lenis = useLenis();
  const { pathname } = useLocation();
  const { tier } = useWorld();
  // sound belongs to the ascent, so it is offered where the world is live
  const audible = pathname === '/' && tier !== null && tier !== 'still';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // close the menu on navigation (state reset keyed to the route, no effect needed)
  const [menuPath, setMenuPath] = useState(pathname);
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (open) lenis?.stop();
    else lenis?.start();
  }, [open, lenis]);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-500 ease-out-expo border-b ${
          scrolled ? 'bg-void/80 backdrop-blur-md border-brass-line' : 'bg-transparent border-transparent'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-6 px-4 sm:px-8">
          <Link to="/" className="flex items-center" aria-label="ATMOS 2026, home">
            <span className="stencil text-[1.35rem] text-stone">
              ATMOS <span className="text-brass">’26</span>
            </span>
          </Link>

          <nav aria-label="Primary" className="hidden items-center gap-9 lg:flex">
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `group relative py-2 text-[0.95rem] font-medium transition-colors duration-300 ${
                    isActive ? 'text-brass-hi' : 'text-stone-dim hover:text-stone'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {item.label}
                    <span
                      aria-hidden
                      className={`absolute inset-x-0 bottom-0.5 h-px origin-left bg-brass transition-transform duration-500 ease-out-expo ${
                        isActive ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                      }`}
                    />
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {audible && <SoundToggle />}
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="relative flex size-11 items-center justify-center rounded-full border border-brass-line text-stone transition-colors hover:border-brass lg:hidden"
              aria-label="Open menu"
              aria-expanded={open}
              aria-controls="mobile-menu"
            >
              <span aria-hidden className="flex w-4 flex-col gap-[5px]">
                <span className="h-px w-full bg-current" />
                <span className="h-px w-2/3 self-end bg-current" />
              </span>
            </button>
          </div>
        </div>
      </header>
      <AnimatePresence>{open && <MobileMenu onClose={() => setOpen(false)} />}</AnimatePresence>
    </>
  );
}
