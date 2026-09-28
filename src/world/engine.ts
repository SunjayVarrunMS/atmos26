import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { ERAS } from '../data/eras';
import { Chamber, type Floor } from './chamber';
import { clockwork } from './chambers/clockwork';
import { steam } from './chambers/steam';
import { SketchChamber } from './chambers/sketch';
import { makeEnvironment } from './env';
import { Lens } from './lens';
import { shared } from './materials';
import { Post } from './post';
import { LOWER, TIERS, type Tier } from './quality';
import { Rig, type Key } from './rig';
import { Shaft } from './shaft';
import { journeyProgress, world } from './store';
import { beats, BOUNDS, FLOOR, locate, SEGMENTS, smooth, type Beats } from './timeline';

type LiveTier = Exclude<Tier, 'still'>;

const v3 = (a: [number, number, number]) => new THREE.Vector3(...a);
const GLIMPSE: Beats = { arrive: 1, draw: 0, cast: 0, exit: 0, text: false };

/**
 * The ascent's renderer: one WebGL canvas fixed behind the home page. It reads
 * the journey's scroll progress every frame and turns it into a camera
 * position, each floor's beats, the lens and the post chain.
 */
export class Engine {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(34, 1, 0.1, 400);
  private post: Post;
  private rig = new Rig();
  private lens: Lens;
  private shaft: Shaft;
  private floors: Floor[];
  private loader = new GLTFLoader();
  private envRT: THREE.WebGLRenderTarget;
  private key = new THREE.DirectionalLight(new THREE.Color(1.0, 0.84, 0.66), 2.6);
  private rim = new THREE.DirectionalLight(new THREE.Color(0.7, 0.86, 1.0), 1.4);
  private shaftMats: THREE.Material[] = [];
  private ro: ResizeObserver;
  private W = 1;
  private H = 1;
  private dpr = 1;
  private last = performance.now();
  private time = 0;
  private shiftX = 0;
  private shiftY = 0;
  private pointer = new THREE.Vector2();
  private parallax = new THREE.Vector2();
  private focus = new THREE.Vector2();
  private frames: number[] = [];
  private settle = 90;
  private disposed = false;
  private debug: HTMLElement | null = null;
  private tmp = new THREE.Vector3();
  private tmp2 = new THREE.Vector3();
  private lastP = 0;
  private velocity = 0;

  private host: HTMLElement;
  private tier: LiveTier;
  private onTier: (t: Tier) => void;

  constructor(host: HTMLElement, tier: LiveTier, onTier: (t: Tier) => void) {
    this.host = host;
    this.tier = tier;
    this.onTier = onTier;
    const settings = TIERS[tier];
    this.renderer = new THREE.WebGLRenderer({
      antialias: false,
      alpha: false,
      stencil: false,
      depth: true,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.renderer.setClearColor(0x000000, 1);
    const canvas = this.renderer.domElement;
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
    canvas.addEventListener('webglcontextlost', this.onLost, false);
    host.appendChild(canvas);

    this.envRT = makeEnvironment(this.renderer);
    this.scene.environment = this.envRT.texture;
    this.scene.fog = new THREE.FogExp2(0x000000, 0.027);

    this.scene.add(this.key, this.key.target, this.rim, this.rim.target);

    // the shaft's own metal: no pour, no lens cut (it's architecture)
    const collar = new THREE.MeshStandardMaterial({ color: '#b98a3e', metalness: 1, roughness: 0.38, envMapIntensity: 0.9 });
    const iron = new THREE.MeshStandardMaterial({ color: '#23211f', metalness: 0.7, roughness: 0.62, envMapIntensity: 0.7 });
    this.shaftMats.push(collar, iron);
    this.shaft = new Shaft(ERAS.length, { collar, iron });
    this.scene.add(this.shaft.group);

    this.loader.setMeshoptDecoder(MeshoptDecoder);
    const origin = (i: number) => new THREE.Vector3(0, i * FLOOR, 0);
    this.floors = [
      new Chamber(clockwork, origin(0), settings.points),
      new Chamber(steam, origin(1), settings.points),
      new SketchChamber('silicon', 'city', origin(2), 7.5),
      new SketchChamber('genome', 'dna', origin(3), 7),
      new SketchChamber('intelligence', 'brain', origin(4), 6),
    ];
    for (const f of this.floors) this.scene.add(f.group);
    this.rig.setKeys(this.buildKeys());

    this.post = new Post(this.renderer, this.scene, this.camera, settings);
    this.lens = new Lens(() => Math.min(150, Math.max(92, Math.min(this.W, this.H) * 0.13)));

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(host);
    this.resize();
    window.addEventListener('pointermove', this.onPointer, { passive: true });

    if (new URLSearchParams(location.search).has('debug')) {
      this.debug = document.createElement('div');
      this.debug.style.cssText =
        'position:fixed;left:8px;bottom:8px;z-index:200;font:12px/1.4 ui-monospace,monospace;color:#7ff6ff;background:#000c;padding:6px 8px;pointer-events:none;white-space:pre';
      document.body.appendChild(this.debug);
    }

    this.boot();
    this.renderer.setAnimationLoop(this.frame);
  }

  private async boot() {
    // the first chamber is the one that matters; the rest stream in behind it
    const first = this.floors[0];
    await first.load(this.loader);
    if (this.disposed) return;
    first.group.visible = true;
    first.setBeats({ arrive: 1, draw: 1, cast: 1, exit: 0, text: false });
    try {
      await this.renderer.compileAsync(this.scene, this.camera);
    } catch {
      /* compileAsync is an optimisation only */
    }
    if (this.disposed) return;
    world.set({ ready: true });
    for (const f of this.floors.slice(1)) {
      await f.load(this.loader);
      if (this.disposed) return;
    }
  }

  private buildKeys(): Key[] {
    const keys: Key[] = [];
    const top = ERAS.length * FLOOR;
    const [d0, d1] = BOUNDS[0];
    // the dive: from above the top collar, down the whole shaft to 1700
    keys.push({ p: d0, pos: new THREE.Vector3(0, top + 20, 3.5), look: new THREE.Vector3(0, top - 30, 0) });
    keys.push({ p: d0 + (d1 - d0) * 0.62, pos: new THREE.Vector3(0.3, FLOOR * 0.9, 7), look: new THREE.Vector3(0, -2, 0) });
    this.floors.forEach((f, i) => {
      const [a, b] = BOUNDS[i + 1];
      const o = new THREE.Vector3(0, i * FLOOR, 0);
      for (const k of f.spec.camera) {
        keys.push({ p: a + k.t * (b - a), pos: v3(k.pos).add(o), look: v3(k.look).add(o) });
      }
    });
    // the summit: out of the top collar into open dark
    const [s0, s1] = BOUNDS[BOUNDS.length - 1];
    keys.push({ p: s0 + (s1 - s0) * 0.3, pos: new THREE.Vector3(0, top + 2, 17), look: new THREE.Vector3(0, top + 4, 0) });
    keys.push({ p: s1, pos: new THREE.Vector3(0, top + 4, 14), look: new THREE.Vector3(0, top + 4, 0) });
    return keys;
  }

  private resize = () => {
    const W = Math.max(1, this.host.clientWidth);
    const H = Math.max(1, this.host.clientHeight);
    this.W = W;
    this.H = H;
    this.dpr = Math.min(window.devicePixelRatio || 1, TIERS[this.tier].dpr);
    this.renderer.setPixelRatio(this.dpr);
    this.renderer.setSize(W, H, false);
    const buf = this.renderer.getDrawingBufferSize(new THREE.Vector2());
    this.post.setSize(W, H, buf.x, buf.y, this.dpr);
    shared.uRes.value.copy(buf);
    shared.uPixelRatio.value = this.dpr;
    this.applyView();
  };

  // shift the picture so the machine clears the copy: right on wide screens,
  // up on tall ones (a view offset keeps the perspective honest)
  private applyView() {
    const W = this.W, H = this.H;
    const aspect = W / H;
    const portrait = aspect < 1;
    const t = THREE.MathUtils.clamp((1 - aspect) / 0.55, 0, 1);
    this.camera.fov = portrait ? THREE.MathUtils.lerp(34, 52, t) : 34;
    const fullW = W * (1 + 2 * this.shiftX);
    const fullH = H * (1 + 2 * this.shiftY);
    this.camera.aspect = fullW / fullH;
    this.camera.setViewOffset(fullW, fullH, 0, fullH - H, W, H);
    this.camera.updateProjectionMatrix();
  }

  private onPointer = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    this.pointer.set((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
  };

  private onLost = (e: Event) => {
    e.preventDefault();
    this.onTier('still');
  };

  private frame = (now: number) => {
    if (this.disposed) return;
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.time += dt;
    shared.uTime.value = this.time;

    // how much of the world is on screen: fades in as the hero leaves, out
    // once the ascent is over
    const el = world.journey();
    const p = journeyProgress();
    let fade = 0;
    if (el) {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      fade = Math.min(THREE.MathUtils.clamp((vh - r.top) / (vh * 0.85), 0, 1), THREE.MathUtils.clamp(r.bottom / (vh * 0.6), 0, 1));
    }
    this.host.style.opacity = fade.toFixed(3);
    if (fade <= 0.001) {
      world.set({ segment: -1, text: false });
      this.settle = 30;
      return;
    }

    const pc = THREE.MathUtils.clamp(p, 0, 1);
    // scroll speed, smoothed: some machines run on it
    if (dt > 0) this.velocity += ((pc - this.lastP) / dt - this.velocity) * (1 - Math.exp(-dt * 6));
    this.lastP = pc;
    const at = locate(pc);
    const seg = at.segment;
    const era = seg.id !== 'dive' && seg.id !== 'summit';
    const b = beats(at.local);
    world.set({
      segment: p < 0 ? -1 : at.index,
      text: p >= 0 && p <= 1 && (era ? b.text : at.local > 0.08 && at.local < 0.92),
    });

    // each floor's beats from its own slice of the journey; during the dive
    // the eras above the first are glimpsed as dust while you fall past them
    const diving = seg.id === 'dive' && p >= 0;
    this.floors.forEach((f, i) => {
      const [a, bb] = BOUNDS[i + 1];
      const t = THREE.MathUtils.clamp((pc - a) / (bb - a), 0, 1);
      if (diving && i > 0) {
        f.setBeats(GLIMPSE);
        f.u.uSee.value = 0.26 * smooth(0.0, 0.25, at.local);
        f.group.visible = f.loaded;
        if (f.group.visible) f.update(this.time, dt, { velocity: 0, built: 0 });
      } else {
        const fb = beats(t);
        f.setBeats(fb);
        f.group.visible = f.loaded && t > 0 && t < 1;
        if (f.group.visible) f.update(this.time, dt, { velocity: this.velocity, built: fb.cast });
      }
    });

    // camera
    this.rig.update(pc, dt, 0.16);
    const wide = this.W >= 900 && this.W / this.H >= 1;
    const tall = this.W / this.H < 0.9;
    const wantX = era && wide ? 0.16 : 0;
    const wantY = era && tall ? 0.2 : 0;
    const k = 1 - Math.exp(-dt * 3);
    if (Math.abs(wantX - this.shiftX) > 1e-4 || Math.abs(wantY - this.shiftY) > 1e-4) {
      this.shiftX += (wantX - this.shiftX) * k;
      this.shiftY += (wantY - this.shiftY) * k;
      this.applyView();
    }
    const dolly = tall ? 1 + 0.22 * THREE.MathUtils.clamp((1 - this.W / this.H) / 0.55, 0, 1) : 1;
    this.parallax.lerp(this.pointer, 1 - Math.exp(-dt * 2.5));
    this.tmp.subVectors(this.rig.pos, this.rig.look).multiplyScalar(dolly).add(this.rig.look);
    this.camera.position.copy(this.tmp);
    this.camera.lookAt(this.rig.look);
    this.camera.translateX(this.parallax.x * 0.35);
    this.camera.translateY(-this.parallax.y * 0.22);
    this.camera.lookAt(this.rig.look);

    // lights ride with the camera's floor: warm key from above-front, cool rim behind
    const L = this.rig.look;
    this.key.position.set(L.x + 6, L.y + 16, L.z + 9);
    this.key.target.position.copy(L);
    this.rim.position.set(L.x - 10, L.y + 5, L.z - 12);
    this.rim.target.position.copy(L);

    // the lens has something to show once a machine is standing
    const current = era ? this.floors[SEGMENTS[at.index].floor] : null;
    const standing = !!current && b.cast > 0.6 && b.exit < 0.3;
    this.lens.setEnabled(standing);
    if (current) {
      this.tmp2.copy(current.group.position).add(this.tmp.set(0, 2, 0)).project(this.camera);
      this.focus.set((this.tmp2.x * 0.5 + 0.5) * this.W, (-this.tmp2.y * 0.5 + 0.5) * this.H);
    }
    this.lens.update(dt, now, this.W, this.H, this.focus);
    this.lens.write(shared.uLens.value, this.H, this.dpr);
    this.post.setLens(shared.uLens.value);

    this.shaft.update(this.time);
    this.post.render(dt);
    this.govern(dt);
  };

  // step down a tier if the device can't hold the frame rate
  private govern(dt: number) {
    if (this.settle > 0) {
      this.settle--;
      return;
    }
    this.frames.push(dt);
    if (this.frames.length > 120) this.frames.shift();
    if (this.frames.length === 120) {
      const avg = this.frames.reduce((a, b) => a + b, 0) / 120;
      if (this.debug) {
        const info = this.renderer.info.render;
        this.debug.textContent = `tier ${this.tier}  ${(1 / avg).toFixed(0)} fps  dpr ${this.dpr.toFixed(2)}\ncalls ${info.calls}  tris ${(info.triangles / 1000).toFixed(0)}k`;
      }
      if (avg > 1 / 36 && !this.debug) {
        this.frames = [];
        this.onTier(LOWER[this.tier]);
      }
      if (this.debug) this.frames = this.frames.slice(60);
    }
  }

  dispose() {
    this.disposed = true;
    this.renderer.setAnimationLoop(null);
    this.ro.disconnect();
    window.removeEventListener('pointermove', this.onPointer);
    this.renderer.domElement.removeEventListener('webglcontextlost', this.onLost);
    this.lens.dispose();
    this.floors.forEach((f) => f.dispose());
    this.shaft.dispose();
    this.shaftMats.forEach((m) => m.dispose());
    this.envRT.dispose();
    this.post.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
    this.debug?.remove();
    world.set({ ready: false, segment: -1, text: false });
  }
}
