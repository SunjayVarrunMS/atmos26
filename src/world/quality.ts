/**
 * Render tiers. The first guess comes from the device; a governor in the
 * engine then watches real frame times and steps down if the guess was
 * optimistic. `still` means no WebGL at all: the journey shows rendered stills.
 */
export type Tier = 'high' | 'mid' | 'low' | 'still';

export interface TierSettings {
  /** cap on devicePixelRatio */
  dpr: number;
  /** MSAA samples on the scene target (0 → FXAA) */
  msaa: number;
  bloom: boolean;
  /** machine-view points per chamber */
  points: number;
}

export const TIERS: Record<Exclude<Tier, 'still'>, TierSettings> = {
  high: { dpr: 1.75, msaa: 4, bloom: true, points: 90000 },
  mid: { dpr: 1.25, msaa: 0, bloom: true, points: 45000 },
  low: { dpr: 0.9, msaa: 0, bloom: false, points: 22000 },
};

export const LOWER: Record<Tier, Tier> = { high: 'mid', mid: 'low', low: 'still', still: 'still' };

let guessed: Tier | null = null;

// the first guess is made once per page load (it creates a throwaway context)
export function guessTier(): Tier {
  guessed ??= detect();
  return guessed;
}

function detect(): Tier {
  if (typeof window === 'undefined') return 'still';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'still';
  if (new URLSearchParams(location.search).has('stills')) return 'still';
  const forced = new URLSearchParams(location.search).get('tier');
  if (forced === 'high' || forced === 'mid' || forced === 'low' || forced === 'still') return forced;

  let gl: WebGL2RenderingContext | null = null;
  try {
    gl = document.createElement('canvas').getContext('webgl2');
  } catch {
    gl = null;
  }
  if (!gl) return 'still';
  const dbg = gl.getExtension('WEBGL_debug_renderer_info');
  const gpu = (dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : '').toLowerCase();
  gl.getExtension('WEBGL_lose_context')?.loseContext();

  // software rasterisers can't carry the scene
  if (/swiftshader|llvmpipe|software|basic render/.test(gpu)) return 'still';

  const nav = navigator as Navigator & { deviceMemory?: number };
  const cores = nav.hardwareConcurrency ?? 4;
  const mem = nav.deviceMemory ?? 4;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const small = Math.min(screen.width, screen.height) < 820;

  if (coarse && small) {
    // phones: modern flagships get mid, the rest start low
    if (/apple gpu|adreno \(tm\) (7[3-9]\d|8\d\d)|mali-g(7[1-9]|[89]\d|7\d\d)|immortalis|xclipse/.test(gpu)) return 'mid';
    return cores >= 8 && mem >= 6 ? 'mid' : 'low';
  }
  if (/intel/.test(gpu) && !/arc/.test(gpu)) return cores >= 8 ? 'mid' : 'low';
  return 'high';
}
