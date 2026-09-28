import { lazy, Suspense, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { FilmScratches } from './FilmScratches';
import type { FloorId } from '../world/chambers';

const EXPO = [0.16, 1, 0.3, 1] as const;

// the building's floors, fetched only on pages that stand on one
const FloorBackdrop = lazy(() => import('../world/FloorBackdrop'));

/**
 * Top of every inner page: one huge line, one plain sentence under it. Pages
 * that stand on a floor of the building get that floor's machine behind the
 * title, built as you arrive.
 */
export function PageHeader({
  title,
  accent,
  floor,
  children,
}: {
  title: string;
  accent?: string;
  floor?: FloorId;
  children?: ReactNode;
}) {
  return (
    <header
      className={`relative overflow-hidden px-4 pb-14 sm:px-8 ${
        floor ? 'flex min-h-[86svh] flex-col justify-end pt-[46svh] md:min-h-[82svh] md:pt-44' : 'pt-36 md:pt-44'
      }`}
    >
      {floor && (
        <>
          <Suspense fallback={null}>
            <FloorBackdrop floor={floor} />
          </Suspense>
          {/* the title's side stays dark enough to read, and the floor fades into the page */}
          <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 hidden w-[55%] bg-linear-to-r from-void/85 via-void/45 to-transparent md:block" />
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-[38%] bg-linear-to-t from-void via-void/70 to-transparent" />
        </>
      )}
      <div className="pointer-events-none relative mx-auto w-full max-w-[1440px]">
        <motion.h1
          className="display text-[clamp(3rem,11vw,11rem)] text-stone"
          initial={{ opacity: 0, y: '0.3em', filter: 'blur(10px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 1.1, ease: EXPO, delay: 0.25 }}
        >
          {title}
          {accent && <span className="text-brass-hi"> {accent}</span>}
        </motion.h1>
        {children && (
          <motion.div
            className="pointer-events-auto mt-8 max-w-[52ch] text-[clamp(1.05rem,1.4vw,1.3rem)] leading-relaxed text-stone-dim text-lift"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: EXPO, delay: 0.45 }}
          >
            {children}
          </motion.div>
        )}
      </div>
      <FilmScratches className="pointer-events-none absolute inset-0 size-full opacity-60" density={0.5} />
    </header>
  );
}
