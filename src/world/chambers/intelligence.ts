import * as THREE from 'three';
import type { ChamberSpec } from '../chamber';
import { shared, type ChamberUniforms } from '../materials';

/**
 * 2026. A network strung by hand: every unit on a hoop is wired to five on
 * the hoop above, at angles that twist each gap into a ruled surface, up to
 * a single unit at the top. The wires are strung layer by layer while the
 * blueprint is drawn. Once built, signal climbs them in cascades; a click or
 * a tap sends one bright thought up through the whole net to the apex.
 */

const WIRE_VERT = /* glsl */ `
  attribute float aT;
  attribute float aLayer;
  attribute float aSeed;
  varying float vT;
  varying float vLayer;
  varying float vSeed;
  void main() {
    vT = aT;
    vLayer = aLayer;
    vSeed = aSeed;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;

const WIRE_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uFire;
  uniform float uDraw;
  uniform float uCast;
  uniform float uExit;
  uniform float uLayers;
  varying float vT;
  varying float vLayer;
  varying float vSeed;
  void main() {
    float along = (vLayer + vT) / uLayers;          // 0 at the bottom hoop, 1 at the apex
    // strung with the drawing, bottom up
    float strung = 1.0 - smoothstep(uDraw * 1.02 - 0.02, uDraw * 1.02, along);
    // resting wire: fine brass thread
    vec3 thread = vec3(0.62, 0.46, 0.2) * (0.22 + 0.18 * uCast);
    // ambient signal: packets climbing each gap in cascades
    float ph = fract(uTime * 0.32 - vLayer * 0.21 + vSeed * 0.9);
    float head = ph * 1.6 - 0.3;
    float pk = exp(-pow((vT - head) * 9.0, 2.0)) * smoothstep(0.85, 1.0, uCast);
    vec3 col = thread + vec3(1.9, 1.35, 0.7) * pk * 0.55;
    // a thought: one bright front rising through every layer after a click
    float since = uTime - uFire;
    float front = since * 1.7;
    float wave = exp(-pow((vLayer + vT - front) * 2.6, 2.0)) * exp(-since * 0.25) * step(0.0, since);
    col += vec3(0.5, 2.1, 2.4) * wave * smoothstep(0.85, 1.0, uCast);
    float a = strung * (1.0 - uExit);
    if (a < 0.01) discard;
    gl_FragColor = vec4(col * a, 1.0);
  }`;

const APEX_FRAG = /* glsl */ `
  uniform float uTime;
  uniform float uFire;
  uniform float uCast;
  uniform float uExit;
  uniform float uLayers;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float since = uTime - uFire;
    // the thought arrives at the apex when the front reaches the top layer
    float arrive = exp(-pow((since * 1.7 - uLayers) * 1.4, 2.0)) * step(0.0, since);
    float idle = 0.25 + 0.1 * sin(uTime * 1.3);
    float g = smoothstep(0.5, 0.0, d) * (idle + arrive * 3.0) * smoothstep(0.85, 1.0, uCast) * (1.0 - uExit);
    if (g < 0.01) discard;
    gl_FragColor = vec4(vec3(1.0, 0.8, 0.5) * g + vec3(0.4, 1.6, 1.8) * arrive * g, 1.0);
  }`;

function wires(root: THREE.Object3D, u: ChamberUniforms) {
  const found: { nodes?: number[]; layers?: number[] } = {};
  root.traverse((o) => {
    if (o.userData.chamber === 'intelligence') Object.assign(found, o.userData);
  });
  const { nodes, layers } = found;
  if (!nodes || !layers) return;

  // Blender z-up → web y-up
  const units: { p: THREE.Vector3; layer: number; angle: number }[] = [];
  for (let i = 0; i < nodes.length; i += 4) {
    const p = new THREE.Vector3(nodes[i], nodes[i + 2], -nodes[i + 1]);
    units.push({ p, layer: nodes[i + 3], angle: Math.atan2(p.z, p.x) });
  }
  const byLayer = layers.map((_, l) => units.filter((n) => n.layer === l));
  const nearest = (list: typeof units, angle: number) =>
    list.reduce((best, n) => {
      const d = Math.abs(Math.atan2(Math.sin(n.angle - angle), Math.cos(n.angle - angle)));
      return d < best.d ? { n, d } : best;
    }, { n: list[0], d: Infinity }).n;

  const pos: number[] = [];
  const t: number[] = [];
  const layer: number[] = [];
  const seed: number[] = [];
  const twists = [-0.9, -0.45, 0, 0.45, 0.9];
  for (let l = 0; l < byLayer.length - 1; l++) {
    const above = byLayer[l + 1];
    for (const a of byLayer[l]) {
      const targets = above.length === 1 ? above : twists.map((k) => nearest(above, a.angle + k));
      const s = Math.random();
      for (const b of new Set(targets)) {
        pos.push(a.p.x, a.p.y, a.p.z, b.p.x, b.p.y, b.p.z);
        t.push(0, 1);
        layer.push(l, l);
        seed.push(s, s);
      }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('aT', new THREE.Float32BufferAttribute(t, 1));
  geo.setAttribute('aLayer', new THREE.Float32BufferAttribute(layer, 1));
  geo.setAttribute('aSeed', new THREE.Float32BufferAttribute(seed, 1));
  const uniforms = {
    uTime: shared.uTime,
    uFire: shared.uFire,
    uDraw: u.uDraw,
    uCast: u.uCast,
    uExit: u.uExit,
    uLayers: { value: layers.length - 1 },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: WIRE_VERT,
    fragmentShader: WIRE_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const lines = new THREE.LineSegments(geo, mat);
  lines.frustumCulled = false;
  lines.renderOrder = 4;
  root.add(lines);

  // the apex, where a thought arrives
  const apex = units[units.length - 1].p;
  const apexGeo = new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute([apex.x, apex.y, apex.z], 3));
  const apexMat = new THREE.ShaderMaterial({
    uniforms: { ...uniforms, uPixelRatio: shared.uPixelRatio },
    vertexShader: /* glsl */ `
      uniform float uPixelRatio;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = 90.0 * uPixelRatio / max(1.0, -mv.z * 0.12);
      }`,
    fragmentShader: APEX_FRAG,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const glow = new THREE.Points(apexGeo, apexMat);
  glow.frustumCulled = false;
  glow.renderOrder = 5;
  root.add(glow);

  return {
    dispose() {
      geo.dispose();
      mat.dispose();
      apexGeo.dispose();
      apexMat.dispose();
    },
  };
}

export const intelligence: ChamberSpec = {
  id: 'intelligence',
  url: '/world/intelligence.glb',
  span: [-7.4, 7.8],
  setup: wires,
  backdrop: { pos: [5.0, -1.5, 19.0], look: [0.0, 0.6, 0] },
  camera: [
    { t: 0.0, pos: [1.0, -11.0, 15.0], look: [0.0, -6.0, 0] },
    { t: 0.14, pos: [1.5, -4.0, 20.0], look: [0.0, -1.5, 0] },
    // the whole net, head on, while it is strung
    { t: 0.34, pos: [0.4, 0.4, 22.0], look: [0.0, 0.4, 0] },
    // under the cone, looking up the wires
    { t: 0.56, pos: [7.0, -7.5, 8.0], look: [0.0, -1.0, 0] },
    { t: 0.74, pos: [0.8, -5.5, 1.2], look: [0.0, 6.4, 0] },
    { t: 0.88, pos: [3.5, 9.5, 7.0], look: [0.0, 5.0, 0] },
    { t: 1.0, pos: [0.0, 13.0, 12.0], look: [0.0, 19.0, 0] },
  ],
};
