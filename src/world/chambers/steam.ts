import type * as THREE from 'three';
import type { ChamberSpec } from '../chamber';

/**
 * 1800s. The engine runs: the wheels turn and the track slides back under
 * them, faster while you scroll (scroll is steam), idling when you stop. The
 * rods and the Walschaerts valve gear are solved from the crank angle every
 * frame, both sides, the far side a quarter turn behind as on a real engine.
 */

interface Kin {
  crank: number;
  rod: number;
  axle: number;
  driverRadius: number;
  ret: number;
  linkX: number;
  linkY: number;
  linkTail: number;
  linkDie: number;
  ecc: number;
  clX: number;
  clTop: number;
  radiusRod: number;
}

interface Rig {
  k: Kin;
  wheels: THREE.Object3D[];
  bySide: Map<number, Record<string, THREE.Object3D>>;
  track?: THREE.Object3D;
  trackBase: number;
  angle: number;
  speed: number;
}

// where circle (a, ra) meets circle (b, rb), choosing the solution nearest `near`
function meet(ax: number, ay: number, ra: number, bx: number, by: number, rb: number, nx: number, ny: number) {
  const dx = bx - ax, dy = by - ay;
  const d = Math.max(1e-6, Math.hypot(dx, dy));
  const a = (ra * ra - rb * rb + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, ra * ra - a * a));
  const mx = ax + (dx * a) / d, my = ay + (dy * a) / d;
  const x1 = mx + (h * dy) / d, y1 = my - (h * dx) / d;
  const x2 = mx - (h * dy) / d, y2 = my + (h * dx) / d;
  return (x1 - nx) ** 2 + (y1 - ny) ** 2 < (x2 - nx) ** 2 + (y2 - ny) ** 2 ? [x1, y1] : [x2, y2];
}

function rig(root: THREE.Object3D): Rig {
  // the numbers ride on the Blender root node, one level inside the glTF scene
  let k = root.userData as Kin;
  root.traverse((o) => {
    if (o.userData.chamber === 'steam') k = o.userData as Kin;
  });
  const r: Rig = { k, wheels: [], bySide: new Map(), trackBase: 0, angle: 0, speed: 0 };
  root.traverse((o) => {
    const { role, side } = o.userData as { role?: string; side?: number };
    if (!role) return;
    if (role === 'wheel') r.wheels.push(o);
    else if (role === 'track') {
      r.track = o;
      r.trackBase = o.position.x;
    } else if (side) {
      const s = r.bySide.get(side) ?? {};
      s[role] = o;
      r.bySide.set(side, s);
    }
  });
  return r;
}

export const steam: ChamberSpec = {
  id: 'steam',
  url: '/world/steam.glb',
  span: [-3.6, 3.6],
  camera: [
    { t: 0.0, pos: [2.0, -9.5, 15.0], look: [1.0, -3.5, 0] },
    { t: 0.14, pos: [3.0, -2.0, 21.0], look: [1.0, -0.5, 0] },
    // a true side elevation while the blueprint is drawn
    { t: 0.34, pos: [1.2, 0.0, 24.5], look: [1.2, 0.0, 0] },
    { t: 0.56, pos: [12.5, -1.0, 12.5], look: [2.2, -0.8, 0] },
    { t: 0.74, pos: [6.2, -2.0, 7.0], look: [2.0, -1.5, 0] },
    { t: 0.88, pos: [-2.0, 0.8, 10.0], look: [0.5, 0.2, 0] },
    { t: 1.0, pos: [0.0, 13.0, 12.0], look: [0.0, 19.0, 0] },
  ],
  animate(root, _time, dt, ctx) {
    let s = root.userData.rig as Rig | undefined;
    if (!s) root.userData.rig = s = rig(root);
    const { k } = s;

    // idle on the rollers, open the regulator with the scroll
    const want = ctx.built < 0.5 ? 0 : 1.1 + Math.min(9, Math.abs(ctx.velocity) * 120);
    s.speed += (want - s.speed) * (1 - Math.exp(-dt * (want > s.speed ? 2.2 : 0.8)));
    // wheels roll forward (+x): clockwise seen from the near side
    s.angle -= s.speed * dt;
    const phi0 = s.angle;

    for (const w of s.wheels) {
      const radius = (w.userData.radius as number) ?? k.driverRadius;
      const phase = (w.userData.side as number) > 0 ? -Math.PI / 2 : 0;
      w.rotation.z = (phi0 * k.driverRadius) / radius + phase;
    }
    if (s.track) {
      const travel = -phi0 * k.driverRadius;
      const spacing = (s.track.userData.spacing as number) ?? 0.72;
      s.track.position.x = s.trackBase - (travel % spacing);
    }

    for (const [side, n] of s.bySide) {
      const phi = phi0 + (side > 0 ? -Math.PI / 2 : 0);
      const A = k.axle;
      // crankpin on the middle driver
      const px = k.crank * Math.cos(phi), py = A + k.crank * Math.sin(phi);
      if (n.coupling) {
        n.coupling.position.x = px;
        n.coupling.position.y = py;
      }
      const xc = px + Math.sqrt(Math.max(0, k.rod * k.rod - (py - A) ** 2));
      if (n.mainrod) {
        n.mainrod.position.x = px;
        n.mainrod.position.y = py;
        n.mainrod.rotation.z = Math.atan2(A - py, xc - px);
      }
      if (n.crosshead) n.crosshead.position.x = xc;

      // valve gear: return crank → eccentric rod → expansion link
      const ex = k.ret * Math.cos(phi + Math.PI / 2), ey = A + k.ret * Math.sin(phi + Math.PI / 2);
      const [kx, ky] = meet(k.linkX, k.linkY, k.linkTail, ex, ey, k.ecc, k.linkX, k.linkY - k.linkTail);
      const psi = Math.atan2(kx - k.linkX, -(ky - k.linkY));
      if (n.eccrod) {
        n.eccrod.position.x = ex;
        n.eccrod.position.y = ey;
        n.eccrod.rotation.z = Math.atan2(ky - ey, kx - ex);
      }
      if (n.link) n.link.rotation.z = psi;
      // die block → radius rod → top of the combination lever
      const dx = k.linkX - k.linkDie * Math.sin(psi), dy = k.linkY + k.linkDie * Math.cos(psi);
      const tx = dx + Math.sqrt(Math.max(0, k.radiusRod ** 2 - (k.clTop - dy) ** 2));
      if (n.radiusrod) {
        n.radiusrod.position.x = dx;
        n.radiusrod.position.y = dy;
        n.radiusrod.rotation.z = Math.atan2(k.clTop - dy, tx - dx);
      }
      // the lever's foot follows the crosshead
      const ux = xc + k.clX, uy = A - 0.34;
      if (n.comblever) {
        n.comblever.position.x = tx;
        n.comblever.rotation.z = Math.atan2(ux - tx, k.clTop - uy);
      }
      if (n.valvespindle) n.valvespindle.position.x = tx;
    }
  },
};
