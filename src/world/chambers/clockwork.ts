import type * as THREE from 'three';
import type { ChamberSpec } from '../chamber';

/**
 * 1700s. The going train runs on real time: the escape wheel steps once a
 * second (half a tooth, one turn a minute) and every other arbor follows at
 * its gear ratio, so the centre wheel really does turn once an hour. The
 * pendulum and anchor swing with a two-second period, passing the middle as
 * each second ticks, the same seconds the countdown shows.
 */

const TAU = Math.PI * 2;
const STEP = TAU / 60;

// the escape wheel's angle: a quick recoil-free step each second
function escapeAngle(ms: number) {
  const s = ms / 1000;
  const tick = Math.floor(s);
  const f = Math.min(1, (s - tick) / 0.09);
  const eased = 1 - Math.pow(1 - f, 3);
  // wrap on the great wheel's eight-hour turn, a whole number of turns for
  // every arbor, so the phase stays small without a visible jump
  return ((tick % 28800) + eased) * STEP;
}

interface Rig {
  arbors: THREE.Object3D[];
  anchor?: THREE.Object3D;
  pendulum?: THREE.Object3D;
}

export const clockwork: ChamberSpec = {
  id: 'clockwork',
  url: '/world/clockwork.glb',
  span: [-8.3, 7.9],
  camera: [
    { t: 0.0, pos: [0.6, -10.5, 15.5], look: [0.4, -6.0, 0] },
    { t: 0.14, pos: [-0.8, -3.2, 18.0], look: [0.0, -0.6, 0] },
    { t: 0.34, pos: [-2.0, 0.8, 20.5], look: [-0.1, 0.9, 0] },
    { t: 0.56, pos: [-5.2, 2.4, 12.8], look: [-0.3, 1.5, 0] },
    { t: 0.74, pos: [-3.8, 4.3, 8.6], look: [0.2, 3.0, 0] },
    { t: 0.88, pos: [-1.4, 6.4, 9.4], look: [0.5, 4.6, 0] },
    { t: 1.0, pos: [0.0, 13.0, 12.0], look: [0.0, 19.0, 0] },
  ],
  animate(root) {
    let nodes = root.userData.rig as Rig | undefined;
    if (!nodes) {
      const rig: Rig = { arbors: [] };
      root.traverse((o) => {
        const role = o.userData.role;
        if (role === 'arbor') rig.arbors.push(o);
        else if (role === 'anchor') rig.anchor = o;
        else if (role === 'pendulum') rig.pendulum = o;
      });
      root.userData.rig = nodes = rig;
    }
    const now = Date.now();
    const esc = escapeAngle(now);
    for (const a of nodes.arbors) {
      const { ratio = 0, dir = 1 } = a.userData as { ratio?: number; dir?: number };
      // clockwise on the dial face is negative about +Z
      a.rotation.z = -((esc * ratio) % TAU) * dir;
    }
    // the pendulum crosses the middle on every whole second
    const swing = Math.sin((now / 1000) * Math.PI);
    if (nodes.pendulum) nodes.pendulum.rotation.z = swing * (nodes.pendulum.userData.amp ?? 0.05);
    if (nodes.anchor) nodes.anchor.rotation.z = swing * (nodes.anchor.userData.amp ?? 0.07);
  },
};
