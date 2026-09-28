import { useEffect, useRef } from 'react';
import { useFinePointer, useReducedMotion } from '../lib/hooks';

// Brass reticle for mouse users: a dot that tracks exactly and a ring that
// trails it, opening up over anything clickable.
export function Cursor() {
  const fine = useFinePointer();
  const still = useReducedMotion();
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!fine) return;
    document.documentElement.classList.add('has-reticle');
    let x = -100, y = -100, rx = -100, ry = -100;
    let hot = false, down = false, visible = false;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      x = e.clientX;
      y = e.clientY;
      if (!visible) {
        visible = true;
        rx = x;
        ry = y;
        ring.current?.style.setProperty('opacity', '1');
        dot.current?.style.setProperty('opacity', '1');
      }
      const t = e.target as Element | null;
      hot = !!t?.closest('a,button,[role="button"],input,select,textarea,label,[data-cursor="hot"]');
    };
    const onLeave = () => {
      visible = false;
      ring.current?.style.setProperty('opacity', '0');
      dot.current?.style.setProperty('opacity', '0');
    };
    const onDown = () => (down = true);
    const onUp = () => (down = false);

    const loop = () => {
      const k = still ? 1 : 0.2;
      rx += (x - rx) * k;
      ry += (y - ry) * k;
      const s = (hot ? 1.75 : 1) * (down ? 0.8 : 1);
      if (dot.current) dot.current.style.transform = `translate3d(${x}px,${y}px,0)`;
      if (ring.current) {
        ring.current.style.transform = `translate3d(${rx}px,${ry}px,0) scale(${s})`;
        ring.current.dataset.hot = String(hot);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    window.addEventListener('pointerdown', onDown);
    window.addEventListener('pointerup', onUp);
    return () => {
      cancelAnimationFrame(raf);
      document.documentElement.classList.remove('has-reticle');
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointerup', onUp);
    };
  }, [fine, still]);

  if (!fine) return null;
  return (
    <>
      <div
        ref={ring}
        aria-hidden
        className="reticle-ring group pointer-events-none fixed left-0 top-0 z-[100] -ml-[15px] -mt-[15px] size-[30px] opacity-0 transition-opacity duration-300"
      >
        <svg viewBox="0 0 30 30" className="size-full overflow-visible text-brass transition-colors duration-300 group-data-[hot=true]:text-signal">
          <circle cx="15" cy="15" r="11" fill="none" stroke="currentColor" strokeWidth="1" />
          <path d="M15 0v5M15 25v5M0 15h5M25 15h5" stroke="currentColor" strokeWidth="1" />
        </svg>
      </div>
      <div
        ref={dot}
        aria-hidden
        className="pointer-events-none fixed left-0 top-0 z-[100] -ml-[2px] -mt-[2px] size-[4px] rounded-full bg-brass-hi opacity-0 mix-blend-screen"
      />
    </>
  );
}
