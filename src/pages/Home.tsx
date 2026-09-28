import { lazy, Suspense, useState } from 'react';
import { Hero } from '../components/hero/Hero';
import { Preloader } from '../components/hero/Preloader';
import { ShapeSection } from '../components/particles/ShapeSection';
import { Journey } from '../components/home/Journey';
import { Numbers } from '../components/home/Numbers';
import { Categories } from '../components/home/Categories';
import { ProshowTeaser } from '../components/home/ProshowTeaser';
import { GalleryStrip } from '../components/home/GalleryStrip';
import { Manifesto } from '../components/home/Manifesto';
import { shouldShowPreloader } from '../lib/intro';

// three.js is only needed below the hero, so it loads after first paint
const ParticleField = lazy(() => import('../components/particles/ParticleField').then((m) => ({ default: m.ParticleField })));
// the ascent's world: the heavy part of the page, fetched after the hero
const World = lazy(() => import('../world/World'));

export default function Home() {
  const [boot] = useState(shouldShowPreloader);
  return (
    <>
      {boot && <Preloader />}
      <Suspense fallback={null}>
        <World />
        <ParticleField className="z-0" />
      </Suspense>
      <div className="relative z-[1]">
        {/* the logo owns the first screen; the dots stay out of its way */}
        <ShapeSection pose={{ shape: 'dust', opacity: 0 }}>
          <Hero />
        </ShapeSection>
        <Journey />
        <Numbers />
        <Categories />
        <ProshowTeaser />
        <GalleryStrip />
        <Manifesto />
      </div>
    </>
  );
}
