import * as THREE from 'three';
import type { CameraKey, Floor } from '../chamber';
import { chamberUniforms, makePoints } from '../materials';
import { smooth, type Beats } from '../timeline';
import { COUNT, loadShape } from '../../components/particles/shapes';

/**
 * The top of the ascent. The dust of every era streams up out of the last
 * collar and gathers into the logo's brass ring (points sampled from the
 * ring layer of the official artwork, never from the letters or hands). Once
 * it holds, the page lays the untouched artwork over it, aligned to the ring
 * the engine projects, and the dots give way to it.
 */

// the ring's radius in world units
export const SUMMIT_RING = 4.2;

const CAMERA: CameraKey[] = [
  { t: 0.0, pos: [0.0, -14.0, 13.0], look: [0.0, -8.0, 0] },
  { t: 0.3, pos: [0.0, -1.2, 21.0], look: [0.0, 0.0, 0] },
  { t: 1.0, pos: [0.0, 0.0, 19.5], look: [0.0, 0.0, 0] },
];

export class Summit implements Floor {
  readonly group = new THREE.Group();
  readonly u = chamberUniforms();
  readonly spec = { id: 'summit', camera: CAMERA };
  loaded = false;
  /** 0..1, how far the artwork has taken over from the dots */
  logo = 0;
  private points: THREE.Points | null = null;
  private mat = makePoints(this.u, 2.6);
  private loading: Promise<void> | null = null;

  constructor(origin: THREE.Vector3) {
    this.group.position.copy(origin);
    this.u.uOrigin.value.copy(origin);
    this.group.visible = false;
  }

  load() {
    this.loading ??= loadShape('halo').then((cloud) => {
      // stored at 1/1.05 of the ring radius (scripts/halo_points.py)
      const s = SUMMIT_RING * 1.05;
      const pos = new Float32Array(COUNT * 3);
      for (let i = 0; i < pos.length; i++) pos[i] = cloud[i] * s;
      const rand = new Float32Array(COUNT * 4).map(() => Math.random());
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('aRand', new THREE.BufferAttribute(rand, 4));
      this.points = new THREE.Points(geo, this.mat);
      this.points.frustumCulled = false;
      this.group.add(this.points);
      this.loaded = true;
    });
    return this.loading;
  }

  setBeats(b: Beats, t = 0) {
    // the generic beats don't fit the finale; it runs on its own local time
    void b;
    this.u.uArrive.value = smooth(0.0, 0.34, t);
    this.u.uExit.value = 0;
    // the ring stays empty for the title sponsor (0.34–0.52), then the artwork lands
    this.logo = smooth(0.54, 0.7, t);
    this.u.uSee.value = 1 - smooth(0.64, 0.78, t);
  }

  update() {}

  dispose() {
    this.points?.geometry.dispose();
    this.mat.dispose();
  }
}
