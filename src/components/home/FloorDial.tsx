import { useEffect, useRef } from 'react';
import { ERAS } from '../../data/eras';
import { useLenis } from '../SmoothScroll';
import { journeyProgress, journeyRun, world } from '../../world/store';
import { BOUNDS, SEGMENTS } from '../../world/timeline';

// where each era sits on the journey, and where its machine stands built
const FLOORS = ERAS.map((e) => {
  const i = SEGMENTS.findIndex((s) => s.id === e.id);
  const [a, b] = BOUNDS[i];
  return { ...e, start: a, end: b, standing: a + (b - a) * 0.66 };
});
const FIRST = FLOORS[0].start;
const LAST = FLOORS[FLOORS.length - 1].end;

/**
 * The lift's floor indicator. On wide screens a brass track down the right
 * edge with a stop for every era and a needle that rides with the scroll;
 * choosing a stop rides the lift there (the world plays the way up or down).
 * On phones it is a single hairline that fills as you rise.
 */
export function FloorDial({ active }: { active: number }) {
  const lenis = useLenis();
  const needle = useRef<HTMLSpanElement>(null);
  const fill = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const p = journeyProgress();
      const k = Math.min(1, Math.max(0, (p - FIRST) / (LAST - FIRST)));
      // the lift rises: 1700s at the foot of the dial, 2026 at its head
      // `translate` (not transform) so the move happens before the diamond's 45° turn
      if (needle.current) needle.current.style.translate = `0 ${(1 - k) * 100}cqh`;
      if (fill.current) fill.current.style.transform = `scaleX(${Math.min(1, Math.max(0, p))})`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const ride = (to: number) => {
    const el = world.journey();
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY;
    const run = journeyRun(el);
    const y = top + to * run;
    if (lenis) lenis.scrollTo(y, { duration: 2.6, easing: (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2) });
    else window.scrollTo({ top: y });
  };

  const on = active >= 0;
  return (
    <>
      <nav
        aria-label="Eras of the ascent"
        className={`pointer-events-auto absolute right-5 top-1/2 hidden h-[52svh] -translate-y-1/2 transition-opacity duration-700 lg:block ${
          on ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <div className="relative h-full [container-type:size]">
          {/* the dial's shaft */}
          <span aria-hidden className="absolute right-[7px] top-0 h-full w-px bg-stone/15" />
          <span
            ref={needle}
            aria-hidden
            className="absolute right-[3px] top-0 -mt-[4.5px] block size-[9px] rotate-45 border border-brass-hi bg-void"
          />
          <ol className="absolute inset-0">
            {FLOORS.map((f, i) => {
              const y = (1 - (f.standing - FIRST) / (LAST - FIRST)) * 100;
              const here = i === active;
              return (
                <li key={f.id} className="absolute right-0 flex -translate-y-1/2 items-center" style={{ top: `${y}%` }}>
                  <button
                    type="button"
                    onClick={() => ride(f.standing)}
                    className={`group flex items-center gap-3 py-1.5 pl-3 text-right transition-colors duration-500 ${
                      here ? 'text-stone' : 'text-stone-mute hover:text-stone'
                    }`}
                    aria-current={here ? 'step' : undefined}
                  >
                    <span className="meta" style={{ textTransform: 'none' }}>
                      {f.when}
                      <span className="sr-only">, {f.name}</span>
                    </span>
                    <span
                      aria-hidden
                      className={`block h-px transition-all duration-500 ${here ? 'w-4 bg-brass-hi' : 'w-2.5 bg-stone/40 group-hover:bg-stone'}`}
                    />
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </nav>
      {/* phones: one hairline that fills as you rise */}
      <span
        aria-hidden
        className={`absolute inset-x-0 bottom-0 h-px bg-stone/10 transition-opacity duration-700 lg:hidden ${on ? 'opacity-100' : 'opacity-0'}`}
      >
        <span ref={fill} className="block h-full origin-left bg-brass" style={{ transform: 'scaleX(0)' }} />
      </span>
    </>
  );
}
