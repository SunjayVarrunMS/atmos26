import * as THREE from 'three';
import type { ChamberSpec } from '../chamber';
import { shared, type ChamberUniforms } from '../materials';

/**
 * 1950s. The board's layout is drawn from above, spreading out from the
 * plated ring at its centre, then the packages pour up into a skyline.
 * Once the board is built, signal runs along its copper: small bright packets
 * travel every trace, most of them into the ring at the centre.
 */

const PULSE_VERT = /* glsl */ `
  attribute float aDist;
  attribute float aLen;
  attribute float aSeed;
  varying float vDist;
  varying float vLen;
  varying float vSeed;
  void main() {
    vDist = aDist;
    vLen = aLen;
    vSeed = aSeed;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;

const PULSE_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uCast;
  uniform float uExit;
  varying float vDist;
  varying float vLen;
  varying float vSeed;
  void main() {
    // one packet per trace, looping with a pause, each on its own clock
    float speed = 1.6 + vSeed * 1.4;
    float period = vLen / speed + 1.2 + vSeed * 2.0;
    float t = mod(uTime + vSeed * 17.0, period) * speed;
    float d = t - vDist;
    float head = exp(-d * d * 60.0) + step(0.0, d) * exp(-d * 5.0) * 0.35;
    head *= step(d, vLen);
    float on = smoothstep(0.9, 1.0, uCast) * (1.0 - uExit);
    float a = head * on;
    if (a < 0.01) discard;
    vec3 warm = vec3(3.2, 2.2, 1.1);
    gl_FragColor = vec4(warm * a, 1.0);
  }`;

function pulses(root: THREE.Object3D, u: ChamberUniforms) {
  const found: { tracePts?: number[]; traceCounts?: number[] } = {};
  root.traverse((o) => {
    if (o.userData.chamber === 'silicon') Object.assign(found, o.userData);
  });
  const pts = found.tracePts;
  const counts = found.traceCounts;
  if (!pts || !counts) return;

  const pos: number[] = [];
  const dist: number[] = [];
  const len: number[] = [];
  const seed: number[] = [];
  let at = 0;
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  for (const n of counts) {
    // Blender z-up → web y-up, lifted a hair above the copper
    const P = Array.from({ length: n }, (_, i) =>
      new THREE.Vector3(pts[(at + i) * 3], pts[(at + i) * 3 + 2] + 0.012, -pts[(at + i) * 3 + 1]),
    );
    at += n;
    let total = 0;
    for (let i = 1; i < n; i++) total += P[i].distanceTo(P[i - 1]);
    const s = Math.random();
    let run = 0;
    for (let i = 1; i < n; i++) {
      a.copy(P[i - 1]);
      b.copy(P[i]);
      const l = a.distanceTo(b);
      pos.push(a.x, a.y, a.z, b.x, b.y, b.z);
      dist.push(run, run + l);
      len.push(total, total);
      seed.push(s, s);
      run += l;
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('aDist', new THREE.Float32BufferAttribute(dist, 1));
  geo.setAttribute('aLen', new THREE.Float32BufferAttribute(len, 1));
  geo.setAttribute('aSeed', new THREE.Float32BufferAttribute(seed, 1));
  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: shared.uTime, uCast: u.uCast, uExit: u.uExit },
    vertexShader: PULSE_VERT,
    fragmentShader: PULSE_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const lines = new THREE.LineSegments(geo, mat);
  lines.frustumCulled = false;
  lines.renderOrder = 4;
  root.add(lines);
  return {
    dispose() {
      geo.dispose();
      mat.dispose();
    },
  };
}

export const silicon: ChamberSpec = {
  id: 'silicon',
  url: '/world/silicon.glb',
  span: [-3.2, 3.2],
  drawFrom: 'radial',
  portrait: 1.2,
  backdrop: { pos: [13.0, 9.0, 14.0], look: [0.0, -1.5, 0] },
  setup: pulses,
  camera: [
    // level with the board as its dots arrive
    { t: 0.0, pos: [0.6, -2.0, 17.0], look: [0.0, -3.0, 0] },
    // rising over it while the drawing spreads out from the ring
    { t: 0.14, pos: [0.4, 6.5, 10.5], look: [0.0, -3.0, 0] },
    // the layout, seen from above as it is drawn
    { t: 0.34, pos: [0.3, 14.5, 1.4], look: [0.0, -3.0, 0] },
    // the skyline pours up out of the board
    { t: 0.56, pos: [11.0, 6.5, 11.0], look: [0.0, -2.0, 0] },
    { t: 0.72, pos: [7.5, 2.2, 7.5], look: [-0.5, -1.2, -0.5] },
    { t: 0.86, pos: [-3.0, 3.5, 8.0], look: [0.0, 0.0, 0] },
    { t: 1.0, pos: [0.0, 13.0, 12.0], look: [0.0, 19.0, 0] },
  ],
};
