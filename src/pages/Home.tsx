import { lazy, Suspense, useState } from 'react';
import { Hero } from '../components/hero/Hero';
import { Preloader } from '../components/hero/Preloader';
import { Journey } from '../components/home/Journey';
import { Numbers } from '../components/home/Numbers';
import { Categories } from '../components/home/Categories';
import { ProshowTeaser } from '../components/home/ProshowTeaser';
import { GalleryStrip } from '../components/home/GalleryStrip';
import { Manifesto } from '../components/home/Manifesto';
import { shouldShowPreloader } from '../lib/intro';

// the ascent's world: the heavy part of the page, fetched after the hero
const World = lazy(() => import('../world/World'));

export default function Home() {
  const [boot] = useState(shouldShowPreloader);
  return (
    <>
      {boot && <Preloader />}
      <Suspense fallback={null}>
        <World />
      </Suspense>
      <div className="relative z-[1]">
        <Hero />
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
