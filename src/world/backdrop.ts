import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { Chamber } from './chamber';
import { FLOORS, type FloorId } from './chambers';
import { makeEnvironment } from './env';
import { Lens } from './lens';
import { shared } from './materials';
import { Post } from './post';
import { TIERS, type Tier } from './quality';
import { beats, smooth } from './timeline';

type LiveTier = Exclude<Tier, 'still'>;

/**
 * One floor of the building behind an inner page's header: the machine is
 * perceived, drawn and cast as you arrive (a few seconds, not a scroll), then
 * stands and runs, with the lens under the pointer. Pauses off screen.
 */
export class Backdrop {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(34, 1, 0.1, 200);
  private post: Post;
  private lens: Lens;
  private chamber: Chamber;
  private envRT: THREE.WebGLRenderTarget;
  private key = new THREE.DirectionalLight(new THREE.Color(1.0, 0.84, 0.66), 2.6);
  private rim = new THREE.DirectionalLight(new THREE.Color(0.7, 0.86, 1.0), 1.4);
  private ro: ResizeObserver;
  private io: IntersectionObserver;
  private host: HTMLElement;
  private settings;
  private W = 1;
  private H = 1;
  private dpr = 1;
  private visible = true;
  private started = -1;
  private time = 0;
  private last = performance.now();
  private pointer = new THREE.Vector2();
  private parallax = new THREE.Vector2();
  private base: { pos: THREE.Vector3; look: THREE.Vector3 };
  private focus = new THREE.Vector2();
  private tmp = new THREE.Vector3();
  private disposed = false;

  constructor(host: HTMLElement, floor: FloorId, tier: LiveTier) {
    this.host = host;
    this.settings = TIERS[tier];
    this.renderer = new THREE.WebGLRenderer({ antialias: false, alpha: false, stencil: false, powerPreference: 'high-performance' });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.renderer.setClearColor(0x000000, 1);
    this.renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block';
    host.appendChild(this.renderer.domElement);

    this.envRT = makeEnvironment(this.renderer);
    this.scene.environment = this.envRT.texture;
    this.scene.fog = new THREE.FogExp2(0x000000, 0.027);
    this.scene.add(this.key, this.key.target, this.rim, this.rim.target);

    const spec = FLOORS[floor];
    this.chamber = new Chamber(spec, new THREE.Vector3(), this.settings.points);
    this.scene.add(this.chamber.group);
    // the floor's own header framing, or the camera key where the machine stands built
    const k = spec.backdrop ?? spec.camera.reduce((best, c) => (Math.abs(c.t - 0.6) < Math.abs(best.t - 0.6) ? c : best));
    this.base = { pos: new THREE.Vector3(...k.pos), look: new THREE.Vector3(...k.look) };

    this.post = new Post(this.renderer, this.scene, this.camera, this.settings);
    this.lens = new Lens(() => Math.min(130, Math.max(84, Math.min(this.W, this.H) * 0.14)));

    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(host);
    this.io = new IntersectionObserver(([e]) => {
      this.visible = e.isIntersecting;
      if (this.visible) this.last = performance.now();
    });
    this.io.observe(host);
    this.resize();
    window.addEventListener('pointermove', this.onPointer, { passive: true });

    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    this.chamber.load(loader).then(() => {
      if (this.disposed) return;
      this.chamber.group.visible = true;
      this.started = this.time;
    });
    this.renderer.setAnimationLoop(this.frame);
  }

  private resize = () => {
    const W = Math.max(1, this.host.clientWidth);
    const H = Math.max(1, this.host.clientHeight);
    this.W = W;
    this.H = H;
    this.dpr = Math.min(window.devicePixelRatio || 1, this.settings.dpr);
    this.renderer.setPixelRatio(this.dpr);
    this.renderer.setSize(W, H, false);
    const buf = this.renderer.getDrawingBufferSize(new THREE.Vector2());
    this.post.setSize(W, H, buf.x, buf.y, this.dpr);
    shared.uRes.value.copy(buf);
    shared.uPixelRatio.value = this.dpr;
    // the machine stands to the right of the title on wide screens, above it on tall ones
    const wide = W >= 900 && W / H >= 1;
    const sx = wide ? 0.2 : 0;
    const sy = !wide ? 0.16 : 0;
    const fullW = W * (1 + 2 * sx);
    const fullH = H * (1 + 2 * sy);
    this.camera.fov = W / H < 1 ? 48 : 34;
    this.camera.aspect = fullW / fullH;
    this.camera.setViewOffset(fullW, fullH, 0, fullH - H, W, H);
    this.camera.updateProjectionMatrix();
  };

  private onPointer = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    this.pointer.set((e.clientX / window.innerWidth) * 2 - 1, (e.clientY / window.innerHeight) * 2 - 1);
  };

  private frame = (now: number) => {
    if (this.disposed || !this.visible) return;
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    this.time += dt;
    shared.uTime.value = this.time;

    // arrival, played in time: perceived, drawn, cast, standing
    const since = this.started < 0 ? 0 : this.time - this.started;
    const local = this.started < 0 ? 0 : 0.02 + 0.62 * smooth(0, 5.2, since);
    const b = beats(Math.min(0.66, local));
    this.chamber.setBeats(b);
    this.chamber.update(this.time, dt, { velocity: 0, built: b.cast });

    // a slow drift round the machine, and the pointer's parallax
    this.parallax.lerp(this.pointer, 1 - Math.exp(-dt * 2.5));
    const drift = Math.sin(this.time * 0.12) * 0.6;
    this.camera.position.copy(this.base.pos);
    this.camera.position.x += drift;
    this.camera.lookAt(this.base.look);
    this.camera.translateX(this.parallax.x * 0.35);
    this.camera.translateY(-this.parallax.y * 0.22);
    this.camera.lookAt(this.base.look);
    const L = this.base.look;
    this.key.position.set(L.x + 6, L.y + 16, L.z + 9);
    this.key.target.position.copy(L);
    this.rim.position.set(L.x - 10, L.y + 5, L.z - 12);
    this.rim.target.position.copy(L);

    this.lens.setEnabled(b.cast > 0.6);
    this.tmp.set(0, 1, 0).project(this.camera);
    this.focus.set((this.tmp.x * 0.5 + 0.5) * this.W, (-this.tmp.y * 0.5 + 0.5) * this.H);
    this.lens.update(dt, now, this.W, this.H, this.focus, this.host.getBoundingClientRect());
    this.lens.write(shared.uLens.value, this.H, this.dpr);
    this.post.setLens(shared.uLens.value);
    this.chamber.cull(shared.uLens.value.z > 0.5);

    this.post.render(dt);
  };

  dispose() {
    this.disposed = true;
    this.renderer.setAnimationLoop(null);
    this.ro.disconnect();
    this.io.disconnect();
    window.removeEventListener('pointermove', this.onPointer);
    this.lens.dispose();
    this.chamber.dispose();
    this.envRT.dispose();
    this.post.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
