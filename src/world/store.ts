import { useSyncExternalStore } from 'react';
import type { Tier } from './quality';

/**
 * What the DOM needs to know about the world (and the other way round).
 * The engine writes, the overlays read; updates only fire when something the
 * page shows actually changes.
 */
export interface WorldView {
  /** index into SEGMENTS of the segment on screen, -1 before the journey */
  segment: number;
  /** whether that segment's copy is showing */
  text: boolean;
  /** render quality, null until decided */
  tier: Tier | null;
  /** the first chamber is loaded and compiled */
  ready: boolean;
}

let view: WorldView = { segment: -1, text: false, tier: null, ready: false };
const subs = new Set<() => void>();

// the journey section, measured by the engine every frame
let journey: HTMLElement | null = null;

export const world = {
  get: () => view,
  set(patch: Partial<WorldView>) {
    let changed = false;
    for (const k in patch) {
      const key = k as keyof WorldView;
      if (view[key] !== patch[key]) changed = true;
    }
    if (!changed) return;
    view = { ...view, ...patch };
    subs.forEach((s) => s());
  },
  subscribe(fn: () => void) {
    subs.add(fn);
    return () => {
      subs.delete(fn);
    };
  },
  setJourney(el: HTMLElement | null) {
    journey = el;
  },
  journey: () => journey,
};

export const useWorld = () => useSyncExternalStore(world.subscribe, world.get, world.get);

/**
 * Scroll progress through the journey section: <0 while the hero is still on
 * screen, 0..1 across the pinned ascent, >1 after it.
 */
export function journeyProgress() {
  if (!journey) return -1;
  const r = journey.getBoundingClientRect();
  const run = r.height - window.innerHeight;
  return run > 0 ? -r.top / run : -1;
}
