import * as THREE from 'three';

export interface Key {
  /** global journey progress */
  p: number;
  pos: THREE.Vector3;
  look: THREE.Vector3;
}

/**
 * The camera's path: keys at journey progress values, interpolated with
 * Catmull-Rom tangents over uneven spacing (so slow and fast stretches of the
 * ascent both stay smooth), then followed by a critically damped spring so
 * the camera has weight rather than snapping to the scroll.
 */
export class Rig {
  private keys: Key[] = [];
  readonly pos = new THREE.Vector3();
  readonly look = new THREE.Vector3();
  private vPos = new THREE.Vector3();
  private vLook = new THREE.Vector3();
  private tPos = new THREE.Vector3();
  private tLook = new THREE.Vector3();
  private primed = false;

  setKeys(keys: Key[]) {
    this.keys = [...keys].sort((a, b) => a.p - b.p);
  }

  sample(p: number, outPos: THREE.Vector3, outLook: THREE.Vector3) {
    const k = this.keys;
    if (p <= k[0].p) {
      outPos.copy(k[0].pos);
      outLook.copy(k[0].look);
      return;
    }
    if (p >= k[k.length - 1].p) {
      outPos.copy(k[k.length - 1].pos);
      outLook.copy(k[k.length - 1].look);
      return;
    }
    let i = 0;
    while (i < k.length - 2 && p > k[i + 1].p) i++;
    const a = k[i], b = k[i + 1];
    const prev = k[Math.max(0, i - 1)], next = k[Math.min(k.length - 1, i + 2)];
    const dt = b.p - a.p;
    const t = (p - a.p) / dt;
    hermite(prev.pos, a.pos, b.pos, next.pos, prev.p, a.p, b.p, next.p, t, outPos);
    hermite(prev.look, a.look, b.look, next.look, prev.p, a.p, b.p, next.p, t, outLook);
  }

  /** advance towards the path at progress p; `smooth` is the spring time */
  update(p: number, dt: number, smooth = 0.18) {
    this.sample(p, this.tPos, this.tLook);
    if (!this.primed) {
      this.pos.copy(this.tPos);
      this.look.copy(this.tLook);
      this.primed = true;
      return;
    }
    spring(this.pos, this.vPos, this.tPos, smooth, dt);
    spring(this.look, this.vLook, this.tLook, smooth, dt);
  }

  snap() {
    this.primed = false;
  }
}

const tmpA = new THREE.Vector3();
const tmpB = new THREE.Vector3();

// cubic Hermite with Catmull-Rom tangents scaled for uneven key spacing
function hermite(
  p0: THREE.Vector3, p1: THREE.Vector3, p2: THREE.Vector3, p3: THREE.Vector3,
  t0: number, t1: number, t2: number, t3: number,
  t: number, out: THREE.Vector3,
) {
  const dt = t2 - t1;
  // tangents in "per unit of this interval"
  const m1 = tmpA.subVectors(p2, p0).multiplyScalar(dt / Math.max(1e-6, t2 - t0));
  const m2 = tmpB.subVectors(p3, p1).multiplyScalar(dt / Math.max(1e-6, t3 - t1));
  const t2_ = t * t, t3_ = t2_ * t;
  const h00 = 2 * t3_ - 3 * t2_ + 1;
  const h10 = t3_ - 2 * t2_ + t;
  const h01 = -2 * t3_ + 3 * t2_;
  const h11 = t3_ - t2_;
  out.set(
    h00 * p1.x + h10 * m1.x + h01 * p2.x + h11 * m2.x,
    h00 * p1.y + h10 * m1.y + h01 * p2.y + h11 * m2.y,
    h00 * p1.z + h10 * m1.z + h01 * p2.z + h11 * m2.z,
  );
}

// critically damped spring (Game Programming Gems 4, "Critically Damped Ease-In/Out Smoothing")
function spring(x: THREE.Vector3, v: THREE.Vector3, target: THREE.Vector3, smooth: number, dt: number) {
  const omega = 2 / Math.max(1e-4, smooth);
  const k = omega * dt;
  const exp = 1 / (1 + k + 0.48 * k * k + 0.235 * k * k * k);
  const cx = x.x - target.x, cy = x.y - target.y, cz = x.z - target.z;
  const tx = (v.x + omega * cx) * dt, ty = (v.y + omega * cy) * dt, tz = (v.z + omega * cz) * dt;
  v.set((v.x - omega * tx) * exp, (v.y - omega * ty) * exp, (v.z - omega * tz) * exp);
  x.set(target.x + (cx + tx) * exp, target.y + (cy + ty) * exp, target.z + (cz + tz) * exp);
}
