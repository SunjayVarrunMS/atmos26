import * as THREE from 'three';
import type { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';
import { chamberUniforms, makeLines, makePoints, makeSurface, type ChamberUniforms } from './materials';
import type { Beats } from './timeline';

export interface CameraKey {
  /** local progress through the segment, 0..1 */
  t: number;
  pos: [number, number, number];
  look: [number, number, number];
}

/** what a running machine gets to know each frame */
export interface MotionContext {
  /** scroll speed, journey progress per second (signed) */
  velocity: number;
  /** 0..1, how built the machine is (motion can wait for the metal) */
  built: number;
}

export interface ChamberSpec {
  id: string;
  /** packed GLB in /public/world */
  url: string;
  /** camera path through the chamber, relative to its origin */
  camera: CameraKey[];
  /** per-frame motion (the machine running) */
  animate?: (root: THREE.Object3D, time: number, dt: number, ctx: MotionContext) => void;
  /** vertical extent used for the pour order; defaults to the model bounds */
  span?: [number, number];
  /** blueprint order: lower parts first (default), or outward from the axis */
  drawFrom?: 'height' | 'radial';
  /** extra pieces a floor builds for itself once its model is in */
  setup?: (root: THREE.Object3D, u: ChamberUniforms) => { dispose(): void } | void;
}

/** anything the engine can stack in the shaft */
export interface Floor {
  readonly group: THREE.Group;
  readonly u: ChamberUniforms;
  readonly spec: Pick<ChamberSpec, 'id' | 'camera'>;
  loaded: boolean;
  load(loader: GLTFLoader): Promise<void>;
  /** `t` is the floor's local progress, for floors that keep their own time */
  setBeats(b: Beats, t?: number): void;
  update(time: number, dt: number, ctx: MotionContext): void;
  dispose(): void;
}

// hand the main thread back between heavy steps
const idle = () =>
  new Promise<void>((r) =>
    'requestIdleCallback' in window ? requestIdleCallback(() => r(), { timeout: 120 }) : setTimeout(r, 16),
  );

// a node that moves on its own (anything Blender tagged with a role other than
// "static") carries the parts beneath it
const isCarrier = (o: THREE.Object3D) => typeof o.userData.role === 'string' && o.userData.role !== 'static';
// rotating carriers: their parts are drawn by compass
const COMPASS = new Set(['arbor', 'anchor', 'pendulum', 'wheel', 'link']);

interface Part {
  mesh: THREE.Mesh;
  carrier: THREE.Object3D;
  /** mesh space → carrier space */
  toCarrier: THREE.Matrix4;
  area: number;
}

/**
 * One floor of the shaft: a Blender model with its three states (surface,
 * blueprint lines, machine-view points), driven by the timeline's beats.
 * Parts that move together are merged into one mesh per material, with their
 * lines and points merged alongside, so a floor costs a few dozen draws.
 */
export class Chamber implements Floor {
  readonly group = new THREE.Group();
  readonly u: ChamberUniforms = chamberUniforms();
  root: THREE.Object3D | null = null;
  loaded = false;
  readonly spec: ChamberSpec;
  readonly origin: THREE.Vector3;
  private pointBudget: number;
  private loading: Promise<void> | null = null;
  private surfaces = new Map<string, THREE.MeshStandardMaterial>();
  private lineMat = makeLines(this.u);
  private pointMat: THREE.ShaderMaterial;
  private disposables: { dispose(): void }[] = [];

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

  private surface(name: string) {
    let mat = this.surfaces.get(name);
    if (!mat) {
      mat = makeSurface(name, this.u);
      this.surfaces.set(name, mat);
    }
    return mat;
  }

  private async build(loader: GLTFLoader) {
    const gltf = await loader.loadAsync(this.spec.url);
    const root = gltf.scene;
    this.root = root;
    root.updateMatrixWorld(true);

    // chamber-local bounds for the pour order
    const box = new THREE.Box3().setFromObject(root);
    const [y0, y1] = this.spec.span ?? [box.min.y, box.max.y];
    this.u.uSpan.value.set(y0, y1);

    const parts: Part[] = [];
    root.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      let carrier: THREE.Object3D = mesh.parent ?? root;
      while (carrier !== root && !isCarrier(carrier)) carrier = carrier.parent ?? root;
      const toCarrier = new THREE.Matrix4().copy(carrier.matrixWorld).invert().multiply(mesh.matrixWorld);
      parts.push({ mesh, carrier, toCarrier, area: surfaceArea(mesh) });
    });

    await idle();
    const lines = this.buildLines(parts, root, y0, y1);
    await idle();
    const points = this.buildPoints(parts);
    await idle();

    // merge surfaces per carrier and material
    const surfaceGroups = new Map<THREE.Object3D, Map<string, THREE.BufferGeometry[]>>();
    for (const p of parts) {
      const name = (p.mesh.material as THREE.Material).name;
      const geo = floatClone(p.mesh.geometry, ['position', 'normal', 'color']).applyMatrix4(p.toCarrier);
      let byMat = surfaceGroups.get(p.carrier);
      if (!byMat) surfaceGroups.set(p.carrier, (byMat = new Map()));
      const list = byMat.get(name) ?? [];
      list.push(geo);
      byMat.set(name, list);
    }
    for (const p of parts) {
      (p.mesh.material as THREE.Material).dispose();
      p.mesh.geometry.dispose();
      p.mesh.removeFromParent();
    }
    for (const [carrier, byMat] of surfaceGroups) {
      for (const [name, list] of byMat) {
        const merged = mergeGeometries(list, false);
        list.forEach((g) => g.dispose());
        if (!merged) continue;
        const mesh = new THREE.Mesh(merged, this.surface(name));
        mesh.name = `${carrier.name}:${name}`;
        carrier.add(mesh);
        this.disposables.push(merged);
      }
    }
    for (const [carrier, geo] of lines) {
      const ls = new THREE.LineSegments(geo, this.lineMat);
      ls.frustumCulled = false;
      ls.renderOrder = 2;
      carrier.add(ls);
      this.disposables.push(geo);
    }
    for (const [carrier, geo] of points) {
      const pts = new THREE.Points(geo, this.pointMat);
      pts.frustumCulled = false;
      pts.renderOrder = 3;
      carrier.add(pts);
      this.disposables.push(geo);
    }

    const extra = this.spec.setup?.(root, this.u);
    if (extra) this.disposables.push(extra);

    this.group.add(root);
    this.loaded = true;
  }

  /** Blueprint: hard edges of every part, ordered so each part is drawn like
   *  a draughtsman would: round parts swept by a compass, the rest along
   *  their length, lower parts first. Merged per carrier. */
  private buildLines(parts: Part[], root: THREE.Object3D, y0: number, y1: number) {
    const out = new Map<THREE.Object3D, THREE.BufferGeometry[]>();
    const bounds = new THREE.Box3().setFromObject(root);
    const reach = Math.max(1e-3, bounds.max.x, -bounds.min.x, bounds.max.z, -bounds.min.z);
    const v = new THREE.Vector3();
    const centre = new THREE.Vector3();
    const rootInv = new THREE.Matrix4().copy(root.matrixWorld).invert();

    for (const { mesh, carrier, toCarrier } of parts) {
      const edges = new THREE.EdgesGeometry(mesh.geometry, 26);
      const pos = edges.getAttribute('position') as THREE.BufferAttribute;
      if (pos.count < 2) {
        edges.dispose();
        continue;
      }
      edges.applyMatrix4(toCarrier);
      const order = new Float32Array(pos.count);

      const bb = new THREE.Box3().setFromBufferAttribute(pos);
      const size = bb.getSize(new THREE.Vector3());
      const compass =
        COMPASS.has(carrier.userData.role) &&
        Math.abs(size.x - size.y) / Math.max(size.x, size.y, 1e-3) < 0.25 &&
        Math.max(size.x, size.y) > 0.25;
      const axis = size.x >= size.y ? (size.x >= size.z ? 0 : 2) : size.y >= size.z ? 1 : 2;

      // lower (or inner) parts start first; each part takes 40% of the drawing time
      centre.set(0, 0, 0);
      mesh.localToWorld(centre).applyMatrix4(rootInv);
      const h =
        this.spec.drawFrom === 'radial'
          ? THREE.MathUtils.clamp(Math.hypot(centre.x, centre.z) / reach, 0, 1)
          : THREE.MathUtils.clamp((centre.y - y0) / (y1 - y0), 0, 1);
      const start = h * 0.6;

      // parts joined in Blender (a whole board) are drawn point by point instead
      const perVertex = carrier === root && size.length() > reach * 0.5;
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i);
        if (perVertex) {
          const hv =
            this.spec.drawFrom === 'radial'
              ? Math.hypot(v.x, v.z) / reach
              : (v.y - y0) / (y1 - y0);
          order[i] = 0.02 + 0.9 * THREE.MathUtils.clamp(hv, 0, 1);
          continue;
        }
        const local = compass
          ? (Math.atan2(v.y, v.x) / (Math.PI * 2) + 1) % 1
          : (v.getComponent(axis) - bb.min.getComponent(axis)) / Math.max(1e-4, size.getComponent(axis));
        order[i] = start + local * 0.4;
      }
      edges.setAttribute('aOrder', new THREE.BufferAttribute(order, 1));
      const list = out.get(carrier) ?? [];
      list.push(edges);
      out.set(carrier, list);
    }

    const merged = new Map<THREE.Object3D, THREE.BufferGeometry>();
    for (const [carrier, list] of out) {
      const g = mergeGeometries(list, false);
      list.forEach((e) => e.dispose());
      if (g) merged.set(carrier, g);
    }
    return merged;
  }

  /** Machine view: surface samples of every part, weighted by area, riding
   *  on their carrier so they turn with the machine. */
  private buildPoints(parts: Part[]) {
    const total = parts.reduce((a, p) => a + p.area, 0) || 1;
    const byCarrier = new Map<THREE.Object3D, { pos: number[]; rand: number[] }>();
    const p = new THREE.Vector3();
    for (const part of parts) {
      const n = Math.round((part.area / total) * this.pointBudget);
      if (n < 4) continue;
      const sampler = new MeshSurfaceSampler(part.mesh).build();
      let bucket = byCarrier.get(part.carrier);
      if (!bucket) byCarrier.set(part.carrier, (bucket = { pos: [], rand: [] }));
      for (let i = 0; i < n; i++) {
        sampler.sample(p);
        p.applyMatrix4(part.toCarrier);
        bucket.pos.push(p.x, p.y, p.z);
        bucket.rand.push(Math.random(), Math.random(), Math.random(), Math.random());
      }
    }
    const out = new Map<THREE.Object3D, THREE.BufferGeometry>();
    for (const [carrier, b] of byCarrier) {
      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.Float32BufferAttribute(b.pos, 3));
      geo.setAttribute('aRand', new THREE.Float32BufferAttribute(b.rand, 4));
      out.set(carrier, geo);
    }
    return out;
  }

  setBeats(b: Beats) {
    this.u.uArrive.value = b.arrive;
    this.u.uDraw.value = b.draw;
    this.u.uCast.value = b.cast;
    this.u.uExit.value = b.exit;
    // dots show while the machine is only perceived: before it is drawn and
    // again as it leaves
    this.u.uSee.value = Math.max(1 - b.draw, b.exit);
  }

  update(time: number, dt: number, ctx: MotionContext) {
    if (this.root && this.spec.animate) this.spec.animate(this.root, time, dt, ctx);
  }

  dispose() {
    this.disposables.forEach((d) => d.dispose());
    this.surfaces.forEach((m) => m.dispose());
    this.lineMat.dispose();
    this.pointMat.dispose();
  }
}

/** a de-quantised, float copy of the listed attributes (meshopt ships int16) */
function floatClone(src: THREE.BufferGeometry, names: string[]) {
  const g = new THREE.BufferGeometry();
  const count = src.getAttribute('position').count;
  for (const name of names) {
    const a = src.getAttribute(name) as THREE.BufferAttribute | undefined;
    if (!a) {
      // parts without baked AO read as unoccluded
      if (name === 'color') g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(count * 4).fill(1), 4));
      continue;
    }
    const size = name === 'color' ? 4 : a.itemSize;
    const out = new Float32Array(a.count * size);
    for (let i = 0; i < a.count; i++) {
      out[i * size] = a.getX(i);
      if (size > 1) out[i * size + 1] = a.getY(i);
      if (size > 2) out[i * size + 2] = a.getZ(i);
      if (size > 3) out[i * size + 3] = a.itemSize > 3 ? a.getW(i) : 1;
    }
    g.setAttribute(name, new THREE.BufferAttribute(out, size));
  }
  // always indexed, so every part of a carrier can merge
  const index = src.index ? new Uint32Array(src.index.array as ArrayLike<number>) : Uint32Array.from({ length: count }, (_, i) => i);
  g.setIndex(new THREE.BufferAttribute(index, 1));
  return g;
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
