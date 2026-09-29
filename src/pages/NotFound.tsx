import { lazy, Suspense, useEffect } from 'react';
import { Link } from 'react-router';
import { particles } from '../components/particles/store';

const ParticleField = lazy(() => import('../components/particles/ParticleField').then((m) => ({ default: m.ParticleField })));

// Lost pages: the brass rings form, then lose their signal and scatter.
export default function NotFound() {
  useEffect(() => {
    particles.set({ shape: 'rings', size: 0.9, rx: 0.2, spin: 0.1, opacity: 0.8 });
    const t = setTimeout(() => particles.set({ shape: 'dust', opacity: 0.45, spin: 0.02 }), 1600);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="relative flex h-svh min-h-[560px] items-center justify-center overflow-hidden px-4 sm:px-8" aria-labelledby="nf-title">
      <Suspense fallback={null}>
        <ParticleField className="z-0" />
      </Suspense>
      <div className="relative z-10 text-center">
        <h1 id="nf-title" data-text="Signal lost" className="stencil glitch-text glitch-run text-[clamp(3.6rem,13vw,11rem)] text-stone">
          Signal lost
        </h1>
        <p className="mx-auto mt-5 max-w-[38ch] text-[1.05rem] text-stone-dim">
          This page never made it through the convergence.
        </p>
        <Link
          to="/"
          className="mt-9 inline-flex h-12 items-center bg-stone px-7 font-semibold text-void transition-colors hover:bg-brass-hi"
        >
          Back to ATMOS ’26
        </Link>
      </div>
    </section>
  );
}
