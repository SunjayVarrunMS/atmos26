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
  /** the title sponsor holds the empty summit ring, between the statement and the artwork */
  sponsor: boolean;
  /** the official artwork has landed in the summit ring */
  landed: boolean;
}

let view: WorldView = { segment: -1, text: false, tier: null, ready: false, sponsor: false, landed: false };
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
  /** where the summit ring sits on screen (css px), for laying the artwork over it;
   *  called every frame, so listeners write styles directly */
  setRing(x: number, y: number, r: number, opacity: number) {
    ring = { x, y, r, opacity };
    ringSubs.forEach((s) => s(ring));
  },
  onRing(fn: (r: Ring) => void) {
    ringSubs.add(fn);
    fn(ring);
    return () => {
      ringSubs.delete(fn);
    };
  },
};

export interface Ring {
  x: number;
  y: number;
  r: number;
  opacity: number;
}
let ring: Ring = { x: 0, y: 0, r: 0, opacity: 0 };
const ringSubs = new Set<(r: Ring) => void>();

export const useWorld = () => useSyncExternalStore(world.subscribe, world.get, world.get);

/**
 * Scroll progress through the journey section: <0 while the hero is still on
 * screen, 0..1 across the pinned ascent, >1 after it.
 */
export function journeyProgress() {
  if (!journey) return -1;
  const r = journey.getBoundingClientRect();
  const run = journeyRun(journey);
  return run > 0 ? -r.top / run : -1;
}

/** scroll length of the pinned ascent. Measured against the pinned stage
 *  (small viewport height), not innerHeight, which changes as a phone's
 *  address bar hides and would make the progress jump */
export function journeyRun(el: HTMLElement) {
  const stage = el.querySelector<HTMLElement>('[data-stage]');
  return el.offsetHeight - (stage?.offsetHeight ?? window.innerHeight);
}
