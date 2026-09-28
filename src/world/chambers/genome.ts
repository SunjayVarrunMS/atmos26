import type * as THREE from 'three';
import type { ChamberSpec } from '../chamber';

/**
 * 2000s. The 1953 model, grown to the height of a room. The helix turns
 * slowly on its stand (a little faster while you scroll); once it is built,
 * one base pair at a time lifts, turns over and settles back: the code,
 * read and then rewritten.
 */

interface Rig {
  helix?: THREE.Object3D;
  pairs: THREE.Object3D[];
  flipped: number[];
  current: number;
  started: number;
  /** the pair whose rewrite has already landed this round */
  landed: number;
  angle: number;
}

const FLIP = 1.5;   // seconds for one rewrite
const REST = 1.4;   // seconds between rewrites

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export const genome: ChamberSpec = {
  id: 'genome',
  url: '/world/genome.glb',
  span: [-8.2, 7.8],
  camera: [
    { t: 0.0, pos: [1.0, -11.0, 15.0], look: [0.0, -6.0, 0] },
    { t: 0.14, pos: [2.0, -4.0, 19.0], look: [0.0, -1.5, 0] },
    // the whole model, head on, while it is drawn
    { t: 0.34, pos: [0.6, 0.2, 22.0], look: [0.0, 0.2, 0] },
    { t: 0.56, pos: [8.5, -2.5, 10.5], look: [0.0, -0.4, 0] },
    // close along the helix, where the rewriting happens
    { t: 0.74, pos: [4.2, 1.5, 5.6], look: [0.0, 1.2, 0] },
    // up the spiral from beside the stand
    { t: 0.88, pos: [1.2, -2.5, 3.2], look: [0.0, 7.0, 0] },
    { t: 1.0, pos: [0.0, 13.0, 12.0], look: [0.0, 19.0, 0] },
  ],
  animate(root, time, dt, ctx) {
    let r = root.userData.rig as Rig | undefined;
    if (!r) {
      const rig: Rig = { pairs: [], flipped: [], current: -1, started: 0, landed: -1, angle: 0 };
      root.traverse((o) => {
        if (o.userData.role === 'spin') rig.helix = o;
        else if (o.userData.role === 'pair') rig.pairs.push(o);
      });
      rig.flipped = rig.pairs.map(() => 0);
      root.userData.rig = r = rig;
    }
    r.angle += dt * (0.16 + Math.min(1.2, Math.abs(ctx.velocity) * 18));
    if (r.helix) r.helix.rotation.y = r.angle;

    if (ctx.built < 0.9 || !r.pairs.length) return;
    // one rewrite at a time, round the pairs in turn
    if (r.current < 0 || time - r.started > FLIP + REST) {
      r.current = (r.current + 1) % r.pairs.length;
      r.started = time;
      r.landed = -1;
    }
    const k = Math.min(1, (time - r.started) / FLIP);
    r.pairs.forEach((p, i) => {
      const base = r!.flipped[i] * Math.PI;
      if (i !== r!.current || r!.landed === i) {
        p.rotation.y = base;
        return;
      }
      const e = ease(k);
      p.rotation.y = base + e * Math.PI;
      // lifted clear of its neighbours while it turns
      p.position.y = (p.userData.baseY ??= p.position.y) + Math.sin(e * Math.PI) * 0.22;
      if (k >= 1) {
        r!.flipped[i] = 1 - r!.flipped[i];
        r!.landed = i;
        p.rotation.y = r!.flipped[i] * Math.PI;
        p.position.y = p.userData.baseY;
      }
    });
  },
};
