import * as THREE from 'three';
import type { CameraKey, Floor } from '../chamber';
import { chamberUniforms, makePoints } from '../materials';
import type { Beats } from '../timeline';
import { COUNT, loadShape, type ShapeName } from '../../components/particles/shapes';

/**
 * A floor whose machine isn't modelled yet: it shows the era's point cloud
 * from the old dot field (machine view only), so the ascent can be judged end
 * to end while the chamber is being built.
 */

const CAMERA: CameraKey[] = [
  { t: 0.0, pos: [0.5, -9, 15], look: [0.3, -5, 0] },
  { t: 0.3, pos: [-1.5, 0.5, 18], look: [0, 0.5, 0] },
  { t: 0.62, pos: [-4.5, 2, 13], look: [0, 1, 0] },
  { t: 0.88, pos: [-1.5, 5, 11], look: [0.4, 3.5, 0] },
  { t: 1.0, pos: [0, 13, 12], look: [0, 19, 0] },
];

export class SketchChamber implements Floor {
  readonly group = new THREE.Group();
  readonly u = chamberUniforms();
  readonly spec: { id: string; camera: CameraKey[] };
  loaded = false;
  private points: THREE.Points | null = null;
  private mat = makePoints(this.u, 3.2);
  private loading: Promise<void> | null = null;

  private shape: ShapeName;
  private size: number;

  constructor(id: string, shape: ShapeName, origin: THREE.Vector3, size = 6.5) {
    this.shape = shape;
    this.size = size;
    this.spec = { id, camera: CAMERA };
    this.group.position.copy(origin);
    this.u.uOrigin.value.copy(origin);
    this.group.visible = false;
  }

  load() {
    this.loading ??= loadShape(this.shape).then((cloud) => {
      const pos = new Float32Array(COUNT * 3);
      for (let i = 0; i < pos.length; i++) pos[i] = cloud[i] * this.size;
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

  setBeats(b: Beats) {
    this.u.uArrive.value = b.arrive;
    this.u.uExit.value = b.exit;
    this.u.uSee.value = 1;
  }

  update(time: number) {
    if (this.points) this.points.rotation.y = time * 0.06;
  }

  dispose() {
    this.points?.geometry.dispose();
    this.mat.dispose();
  }
}
