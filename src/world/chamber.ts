import * as THREE from 'three';
import type { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';
import { chamberUniforms, makeLines, makePoints, makeSurface, type ChamberUniforms } from './materials';
import type { Beats } from './timeline';

export interface CameraKey {
  /** local progress through the segment, 0..1 */
  t: number;
  pos: [number, number, number];
  look: [number, number, number];
}

export interface ChamberSpec {
  id: string;
  /** packed GLB in /public/world */
  url: string;
  /** camera path through the chamber, relative to its origin */
  camera: CameraKey[];
  /** per-frame motion (the machine running) */
  animate?: (root: THREE.Object3D, time: number, dt: number) => void;
  /** vertical extent used for the pour order; defaults to the model bounds */
  span?: [number, number];
}

/** anything the engine can stack in the shaft */
export interface Floor {
  readonly group: THREE.Group;
  readonly u: ChamberUniforms;
  readonly spec: Pick<ChamberSpec, 'id' | 'camera'>;
  loaded: boolean;
  load(loader: GLTFLoader): Promise<void>;
  setBeats(b: Beats): void;
  update(time: number, dt: number): void;
  dispose(): void;
}

const PIVOTS = new Set(['arbor', 'anchor', 'pendulum', 'spin']);

// hand the main thread back between heavy steps
const idle = () =>
  new Promise<void>((r) =>
    'requestIdleCallback' in window ? requestIdleCallback(() => r(), { timeout: 120 }) : setTimeout(r, 16),
  );

/**
 * One floor of the shaft: a Blender model with its three states (surface,
 * blueprint lines, machine-view points), driven by the timeline's beats.
 */
export class Chamber implements Floor {
  readonly group = new THREE.Group();
  readonly u: ChamberUniforms = chamberUniforms();
  root: THREE.Object3D | null = null;
  loaded = false;
  private loading: Promise<void> | null = null;
  private surfaces = new Map<string, THREE.MeshStandardMaterial>();
  private lineMat = makeLines(this.u);
  private pointMat: THREE.ShaderMaterial;
  private disposables: { dispose(): void }[] = [];

  readonly spec: ChamberSpec;
  readonly origin: THREE.Vector3;
  private pointBudget: number;

  constructor(spec: ChamberSpec, origin: THREE.Vector3, pointBudget: number) {
    this.spec = spec;
    this.origin = origin;
    this.pointBudget = pointBudget;
    this.group.position.copy(origin);
    this.group.name = `chamber:${spec.id}`;
    this.u.uOrigin.value.copy(origin);
    this.pointMat = makePoints(this.u);
    this.group.visible = false;
  }

  load(loader: GLTFLoader) {
    this.loading ??= this.build(loader);
    return this.loading;
  }

  private async build(loader: GLTFLoader) {
    const gltf = await loader.loadAsync(this.spec.url);
    const root = gltf.scene;
    this.root = root;
    root.updateMatrixWorld(true);

    const meshes: THREE.Mesh[] = [];
    root.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) meshes.push(o as THREE.Mesh);
    });

    // swap Blender's materials for ours, by name
    for (const m of meshes) {
      const src = m.material as THREE.Material;
      let mat = this.surfaces.get(src.name);
      if (!mat) {
        mat = makeSurface(src.name, this.u);
        this.surfaces.set(src.name, mat);
      }
      src.dispose();
      m.material = mat;
      m.frustumCulled = true;
    }

    // chamber-local bounds for the pour order
    const box = new THREE.Box3().setFromObject(root);
    const [y0, y1] = this.spec.span ?? [box.min.y, box.max.y];
    this.u.uSpan.value.set(y0, y1);

    await idle();
    this.buildLines(meshes, y0, y1);
    await idle();
    this.buildPoints(meshes);

    this.group.add(root);
    this.loaded = true;
  }

  /** Blueprint: hard edges of every part, ordered so each part is drawn like
   *  a draughtsman would: round parts swept by a compass, the rest along
   *  their length, lower parts first. */
  private buildLines(meshes: THREE.Mesh[], y0: number, y1: number) {
    const inv = new THREE.Matrix4();
    const toPivot = new THREE.Matrix4();
    const v = new THREE.Vector3();
    const centre = new THREE.Vector3();
    const rootInv = new THREE.Matrix4().copy(this.root!.matrixWorld).invert();

    for (const mesh of meshes) {
      const edges = new THREE.EdgesGeometry(mesh.geometry, 26);
      const pos = edges.getAttribute('position') as THREE.BufferAttribute;
      if (pos.count < 2) {
        edges.dispose();
        continue;
      }
      const order = new Float32Array(pos.count);

      // which moving node carries this part (its axis is the compass point)
      let pivot: THREE.Object3D | null = mesh.parent;
      while (pivot && !PIVOTS.has(pivot.userData.role)) pivot = pivot.parent;
      const frame = pivot ?? mesh;
      toPivot.copy(inv.copy(frame.matrixWorld).invert()).multiply(mesh.matrixWorld);

      // part bounds in its pivot frame
      const bb = new THREE.Box3();
      for (let i = 0; i < pos.count; i++) bb.expandByPoint(v.fromBufferAttribute(pos, i).applyMatrix4(toPivot));
      const size = bb.getSize(new THREE.Vector3());
      const round = !!pivot && Math.abs(size.x - size.y) / Math.max(size.x, size.y, 1e-3) < 0.2 && Math.max(size.x, size.y) > 0.25;
      const axis = size.x >= size.y ? (size.x >= size.z ? 0 : 2) : size.y >= size.z ? 1 : 2;

      // lower parts start first; each part takes 40% of the drawing time
      centre.set(0, 0, 0);
      mesh.localToWorld(centre).applyMatrix4(rootInv);
      const h = THREE.MathUtils.clamp((centre.y - y0) / (y1 - y0), 0, 1);
      const start = h * 0.6;

      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i).applyMatrix4(toPivot);
        let local: number;
        if (round) local = (Math.atan2(v.y, v.x) / (Math.PI * 2) + 1) % 1;
        else local = (v.getComponent(axis) - bb.min.getComponent(axis)) / Math.max(1e-4, size.getComponent(axis));
        order[i] = start + local * 0.4;
      }
      edges.setAttribute('aOrder', new THREE.BufferAttribute(order, 1));
      const lines = new THREE.LineSegments(edges, this.lineMat);
      lines.frustumCulled = false;
      lines.renderOrder = 2;
      mesh.add(lines);
      this.disposables.push(edges);
    }
  }

  /** Machine view: surface samples of every part, weighted by area, riding
   *  on the parts so they turn with the machine. */
  private buildPoints(meshes: THREE.Mesh[]) {
    const areas = meshes.map((m) => surfaceArea(m));
    const total = areas.reduce((a, b) => a + b, 0) || 1;
    const p = new THREE.Vector3();
    for (let k = 0; k < meshes.length; k++) {
      const mesh = meshes[k];
      const n = Math.round((areas[k] / total) * this.pointBudget);
      if (n < 8) continue;
      const sampler = new MeshSurfaceSampler(mesh).build();
      const pos = new Float32Array(n * 3);
      const rand = new Float32Array(n * 4);
      for (let i = 0; i < n; i++) {
        sampler.sample(p);
        pos[i * 3] = p.x;
        pos[i * 3 + 1] = p.y;
        pos[i * 3 + 2] = p.z;
        rand[i * 4] = Math.random();
        rand[i * 4 + 1] = Math.random();
        rand[i * 4 + 2] = Math.random();
        rand[i * 4 + 3] = Math.random();
      }
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('aRand', new THREE.BufferAttribute(rand, 4));
      const pts = new THREE.Points(geo, this.pointMat);
      pts.frustumCulled = false;
      pts.renderOrder = 3;
      mesh.add(pts);
      this.disposables.push(geo);
    }
  }

  setBeats(b: Beats) {
    this.u.uArrive.value = b.arrive;
    this.u.uDraw.value = b.draw;
    this.u.uCast.value = b.cast;
    this.u.uExit.value = b.exit;
    // dots show while the machine is only perceived: before the metal pours
    // and again as it leaves
    this.u.uSee.value = Math.max(1 - b.draw, b.exit);
  }

  update(time: number, dt: number) {
    if (this.root && this.spec.animate) this.spec.animate(this.root, time, dt);
  }

  dispose() {
    this.disposables.forEach((d) => d.dispose());
    this.surfaces.forEach((m) => m.dispose());
    this.lineMat.dispose();
    this.pointMat.dispose();
    this.root?.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).geometry.dispose();
    });
  }
}

function surfaceArea(mesh: THREE.Mesh) {
  const g = mesh.geometry;
  const pos = g.getAttribute('position');
  const idx = g.getIndex();
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  const s = new THREE.Vector3();
  mesh.getWorldScale(s);
  const tri = new THREE.Triangle();
  let area = 0;
  const n = idx ? idx.count : pos.count;
  for (let i = 0; i < n; i += 3) {
    const i0 = idx ? idx.getX(i) : i, i1 = idx ? idx.getX(i + 1) : i + 1, i2 = idx ? idx.getX(i + 2) : i + 2;
    a.fromBufferAttribute(pos, i0).multiply(s);
    b.fromBufferAttribute(pos, i1).multiply(s);
    c.fromBufferAttribute(pos, i2).multiply(s);
    area += tri.set(a, b, c).getArea();
  }
  return area;
}
