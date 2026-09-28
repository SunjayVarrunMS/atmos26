import * as THREE from 'three';
import { FLOOR } from './timeline';

/**
 * The architecture of the ascent: a machined collar between every floor (the
 * one object that stays with you all the way up), iron columns rising out of
 * the dark, and light that always falls from above: the future is up.
 */

// the camera works 12-22 units from the axis, so the shaft is wider still:
// you rise inside the collars, never beside them
const COLLAR_R = 25;
const COLUMN_R = 28;

function collarGeometry() {
  // turned profile (radius, height): a heavy ring with a stepped lip and a bead
  const p: [number, number][] = [
    [COLLAR_R - 0.9, -0.34],
    [COLLAR_R + 0.55, -0.34],
    [COLLAR_R + 0.62, -0.28],
    [COLLAR_R + 0.62, -0.1],
    [COLLAR_R + 0.78, -0.06],
    [COLLAR_R + 0.78, 0.06],
    [COLLAR_R + 0.62, 0.1],
    [COLLAR_R + 0.62, 0.26],
    [COLLAR_R + 0.5, 0.34],
    [COLLAR_R - 0.72, 0.34],
    [COLLAR_R - 0.82, 0.28],
    [COLLAR_R - 0.9, 0.12],
    [COLLAR_R - 1.02, 0.08],
    [COLLAR_R - 1.02, -0.08],
    [COLLAR_R - 0.9, -0.12],
    [COLLAR_R - 0.9, -0.34],
  ];
  const g = new THREE.LatheGeometry(
    p.map(([r, h]) => new THREE.Vector2(r, h * 1.8)),
    256,
  );
  g.computeVertexNormals();
  return g;
}

function columnGeometry(height: number) {
  // an I-beam, flanges facing the shaft
  const s = new THREE.Shape();
  const w = 0.55, t = 0.07, d = 0.42, web = 0.06;
  s.moveTo(-w / 2, -d / 2);
  s.lineTo(w / 2, -d / 2);
  s.lineTo(w / 2, -d / 2 + t);
  s.lineTo(web / 2, -d / 2 + t);
  s.lineTo(web / 2, d / 2 - t);
  s.lineTo(w / 2, d / 2 - t);
  s.lineTo(w / 2, d / 2);
  s.lineTo(-w / 2, d / 2);
  s.lineTo(-w / 2, d / 2 - t);
  s.lineTo(-web / 2, d / 2 - t);
  s.lineTo(-web / 2, -d / 2 + t);
  s.lineTo(-w / 2, -d / 2 + t);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: height, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 1 });
  g.rotateX(-Math.PI / 2);
  return g;
}

// soft cone of light falling from the collar above onto each machine
const BEAM_VERT = /* glsl */ `
  varying vec3 vPos;
  varying vec3 vN;
  varying vec3 vView;
  void main() {
    vPos = position;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vN = normalize(mat3(modelMatrix) * normal);
    vView = normalize(cameraPosition - wp.xyz);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }`;
const BEAM_FRAG = /* glsl */ `
  uniform float uHeight;
  uniform float uStrength;
  uniform float uTime;
  varying vec3 vPos;
  varying vec3 vN;
  varying vec3 vView;
  void main() {
    float h = vPos.y / uHeight + 0.5;               // 0 bottom .. 1 top
    float edge = pow(abs(dot(normalize(vN), vView)), 1.6);  // soft sides
    float fall = smoothstep(0.0, 0.35, h) * (1.0 - smoothstep(0.85, 1.0, h));
    // the air in the beam moves a little
    float breathe = 0.93 + 0.07 * sin(uTime * 0.35 + vPos.y * 0.15);
    float alpha = edge * edge * fall * breathe * uStrength;
    gl_FragColor = vec4(vec3(1.0, 0.78, 0.5) * alpha, 1.0);
  }`;

export class Shaft {
  readonly group = new THREE.Group();
  private beams: THREE.Mesh[] = [];
  private beamMat: THREE.ShaderMaterial;
  private disposables: { dispose(): void }[] = [];

  constructor(floors: number, surfaces: { collar: THREE.Material; iron: THREE.Material }) {
    const collar = collarGeometry();
    // bolt heads standing on the collar's top face
    const bolt = new THREE.CylinderGeometry(0.07, 0.08, 0.1, 10);
    this.disposables.push(collar, bolt);

    // collars below the first floor, between floors and at the summit gate
    const levels: number[] = [];
    for (let i = -1; i < floors; i++) levels.push(i * FLOOR + FLOOR / 2);
    const bolts = new THREE.InstancedMesh(bolt, surfaces.collar, levels.length * 128);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    let b = 0;
    for (const y of levels) {
      const c = new THREE.Mesh(collar, surfaces.collar);
      c.position.y = y;
      c.name = 'collar';
      this.group.add(c);
      for (let k = 0; k < 128; k++) {
        const a = (k / 128) * Math.PI * 2;
        m.makeTranslation(Math.cos(a) * (COLLAR_R + 0.1), y + 0.66, Math.sin(a) * (COLLAR_R + 0.1));
        bolts.setMatrixAt(b++, m);
      }
    }
    this.group.add(bolts);

    // columns the full height of the shaft
    // up to the top collar only: above it is open dark, the summit
    const bottom = -FLOOR, top = (floors - 1) * FLOOR + FLOOR / 2 + 0.4;
    const col = columnGeometry(top - bottom);
    this.disposables.push(col);
    // only behind the machines: the camera works on the near side of the shaft
    const cols = new THREE.InstancedMesh(col, surfaces.iron, 7);
    for (let k = 0; k < 7; k++) {
      const a = Math.PI * 1.1 + (k / 6) * Math.PI * 0.8;
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -a);
      m.compose(new THREE.Vector3(Math.cos(a) * COLUMN_R, bottom, Math.sin(a) * COLUMN_R), q, new THREE.Vector3(1, 1, 1));
      cols.setMatrixAt(k, m);
    }
    this.group.add(cols);

    // a beam of light under every collar
    this.beamMat = new THREE.ShaderMaterial({
      uniforms: { uHeight: { value: FLOOR * 0.9 }, uStrength: { value: 0.022 }, uTime: { value: 0 } },
      vertexShader: BEAM_VERT,
      fragmentShader: BEAM_FRAG,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
    });
    const cone = new THREE.CylinderGeometry(2.6, 6.8, FLOOR * 0.9, 64, 1, true);
    this.disposables.push(cone, this.beamMat);
    for (let i = 0; i < floors; i++) {
      const beam = new THREE.Mesh(cone, this.beamMat);
      beam.position.y = i * FLOOR + FLOOR / 2 - (FLOOR * 0.9) / 2;
      beam.renderOrder = 1;
      this.beams.push(beam);
      this.group.add(beam);
    }
  }

  update(time: number) {
    this.beamMat.uniforms.uTime.value = time;
  }

  dispose() {
    this.disposables.forEach((d) => d.dispose());
  }
}
