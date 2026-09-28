import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { PageHeader } from '../components/PageHeader';
import { GALLERY } from '../data/fest';
import { useLenis } from '../components/SmoothScroll';

const EXPO = [0.16, 1, 0.3, 1] as const;

export default function Gallery() {
  const [open, setOpen] = useState<number | null>(null);
  const lenis = useLenis();
  const close = useCallback(() => setOpen(null), []);
  const step = useCallback((d: number) => setOpen((o) => (o === null ? o : (o + d + GALLERY.length) % GALLERY.length)), []);

  useEffect(() => {
    if (open === null) {
      lenis?.start();
      return;
    }
    lenis?.stop();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, lenis, close, step]);

  return (
    <>
      <PageHeader floor="clockwork" title="Gallery">Moments from past editions of ATMOS. Click any photo to see it in colour.</PageHeader>

      <section className="px-4 pb-28 sm:px-8" aria-label="Photos">
        <ul className="mx-auto max-w-[1440px] columns-1 gap-4 sm:columns-2 lg:columns-3">
          {GALLERY.map((g, i) => (
            <motion.li
              key={g.src}
              className="mb-4 break-inside-avoid"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-5% 0px' }}
              transition={{ duration: 0.9, ease: EXPO, delay: (i % 3) * 0.06 }}
            >
              <button type="button" onClick={() => setOpen(i)} className="group block w-full text-left" aria-label={`Open ${g.caption}`}>
                <div className="overflow-hidden">
                  <motion.img
                    layoutId={`g-${i}`}
                    src={g.src}
                    alt={g.caption}
                    loading="lazy"
                    className="duotone w-full transition-[filter] duration-700 ease-out-expo group-hover:[filter:none]"
                  />
                </div>
              </button>
            </motion.li>
          ))}
        </ul>
      </section>

      <AnimatePresence>
        {open !== null && (
          <motion.div
            className="fixed inset-0 z-[85] flex flex-col bg-void/95 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label={GALLERY[open].caption}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            onClick={close}
          >
            <div className="flex items-center justify-between px-4 py-4 sm:px-8">
              <p className="text-stone-dim">
                {open + 1} / {GALLERY.length}
              </p>
              <button type="button" onClick={close} className="flex h-11 items-center gap-2 px-4 text-stone-dim hover:text-stone" autoFocus>
                <X className="size-5" strokeWidth={1.5} aria-hidden /> Close
              </button>
            </div>
            <div className="relative flex flex-1 items-center justify-center px-4 pb-8 sm:px-16" onClick={(e) => e.stopPropagation()}>
              <motion.img
                key={open}
                layoutId={`g-${open}`}
                src={GALLERY[open].src}
                alt={GALLERY[open].caption}
                className="max-h-[80svh] max-w-full object-contain"
                transition={{ duration: 0.6, ease: EXPO }}
              />
              <button type="button" onClick={() => step(-1)} className="absolute left-2 top-1/2 flex size-12 -translate-y-1/2 items-center justify-center text-stone-dim hover:text-stone sm:left-4" aria-label="Previous photo">
                <ArrowLeft className="size-6" strokeWidth={1.5} />
              </button>
              <button type="button" onClick={() => step(1)} className="absolute right-2 top-1/2 flex size-12 -translate-y-1/2 items-center justify-center text-stone-dim hover:text-stone sm:right-4" aria-label="Next photo">
                <ArrowRight className="size-6" strokeWidth={1.5} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
