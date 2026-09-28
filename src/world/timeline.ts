import { ERAS, type EraId } from '../data/eras';

/**
 * One timeline for the whole ascent. Scroll progress through the journey
 * (0..1) maps to segments; each era segment runs the same five beats, so the
 * camera, the materials, the copy and the sound all read from one place.
 */

export type SegmentId = 'dive' | EraId | 'summit';

export interface Segment {
  id: SegmentId;
  /** scroll length in viewport heights */
  vh: number;
  /** index of the floor this segment belongs to (dive sits above the top) */
  floor: number;
}

export const SEGMENTS: Segment[] = [
  { id: 'dive', vh: 1.6, floor: ERAS.length },
  ...ERAS.map((e, i) => ({ id: e.id, vh: 2.4, floor: i })),
  { id: 'summit', vh: 2.2, floor: ERAS.length },
];

export const TOTAL_VH = SEGMENTS.reduce((s, x) => s + x.vh, 0);

// global progress at which each segment starts and ends
export const BOUNDS = SEGMENTS.reduce<[number, number][]>((acc, s) => {
  const start = acc.length ? acc[acc.length - 1][1] : 0;
  acc.push([start, start + s.vh / TOTAL_VH]);
  return acc;
}, []);

export function locate(p: number) {
  const clamped = Math.min(0.99999, Math.max(0, p));
  const i = BOUNDS.findIndex(([a, b]) => clamped >= a && clamped < b);
  const [a, b] = BOUNDS[i];
  return { index: i, segment: SEGMENTS[i], local: (clamped - a) / (b - a) };
}

// world units between floors of the shaft
export const FLOOR = 30;

export const smooth = (a: number, b: number, t: number) => {
  const x = Math.min(1, Math.max(0, (t - a) / (b - a)));
  return x * x * (3 - 2 * x);
};

/**
 * The beats of an era, from its local progress:
 *  arrive  the machine's points rise into place (what the machine sees first)
 *  draw    the blueprint is drawn, part by part (the human intention)
 *  cast    metal pours into the drawing from the bottom up
 *  exit    the built machine breaks back into points that stream upwards
 * Copy is readable between `textIn` and `textOut`.
 */
export function beats(t: number) {
  return {
    arrive: smooth(0.0, 0.12, t),
    draw: smooth(0.06, 0.36, t),
    cast: smooth(0.34, 0.56, t),
    exit: smooth(0.86, 1.0, t),
    text: t > 0.1 && t < 0.9,
  };
}

export type Beats = ReturnType<typeof beats>;
