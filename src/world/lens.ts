import * as THREE from 'three';

/**
 * The loupe the visitor looks through. With a mouse it rides the pointer
 * (trailing slightly, like the reticle it replaces) whenever the pointer is
 * over the world rather than over a control. On touch it opens where you tap
 * and closes on its own, and it drifts across the machine by itself while the
 * machine is on show, so phone visitors see what it does without being told.
 */
export class Lens {
  /** css px, y down */
  private target = new THREE.Vector2(-999, -999);
  private pos = new THREE.Vector2(-999, -999);
  private radius = 0;
  private want = false;
  private tapUntil = 0;
  private lastTouch = -1e9;
  private fine: boolean;
  private enabled = false;
  private cleanup: () => void;

  private maxRadius: () => number;

  constructor(maxRadius: () => number) {
    this.maxRadius = maxRadius;
    this.fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      this.target.set(e.clientX, e.clientY);
      const el = e.target as Element | null;
      // controls and copy keep the normal cursor; the world gets the loupe
      this.want = !el?.closest('a,button,input,select,textarea,label,[data-no-lens],header,nav');
      if (this.pos.x < -900) this.pos.copy(this.target);
    };
    const onLeave = () => (this.want = false);
    const onTap = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') return;
      const el = e.target as Element | null;
      if (el?.closest('a,button,input,select,textarea,label,[data-no-lens],header,nav')) return;
      this.target.set(e.clientX, e.clientY);
      this.pos.copy(this.target);
      this.tapUntil = performance.now() + 2600;
      this.lastTouch = performance.now();
    };
    const onTouchScroll = () => (this.lastTouch = performance.now());
    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    window.addEventListener('pointerup', onTap, { passive: true });
    window.addEventListener('touchmove', onTouchScroll, { passive: true });
    this.cleanup = () => {
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('pointerup', onTap);
      window.removeEventListener('touchmove', onTouchScroll);
    };
  }

  /** the world is on screen and the machine is built (lens has something to show) */
  setEnabled(on: boolean) {
    this.enabled = on;
  }

  /**
   * @param focus where the machine sits on screen (css px), for the idle drift
   */
  update(dt: number, now: number, W: number, H: number, focus: THREE.Vector2) {
    let open = false;
    if (this.fine) {
      open = this.want && this.enabled;
    } else if (this.enabled) {
      if (now < this.tapUntil) open = true;
      else if (now - this.lastTouch > 2500) {
        // idle drift: a slow figure-of-eight over the machine
        const t = now / 1000;
        this.target.set(
          focus.x + Math.sin(t * 0.45) * W * 0.16,
          focus.y + Math.sin(t * 0.9) * H * 0.1,
        );
        if (this.pos.x < -900) this.pos.copy(this.target);
        open = true;
      }
    }
    const k = 1 - Math.exp(-dt * (this.fine ? 14 : 3));
    this.pos.lerp(this.target, k);
    const goal = open ? this.maxRadius() : 0;
    this.radius += (goal - this.radius) * (1 - Math.exp(-dt * (open ? 9 : 12)));
    if (this.radius < 0.5 && !open) this.radius = 0;
    document.documentElement.toggleAttribute('data-lens', this.radius > 4 && this.fine);
  }

  /** uniform value: drawing-buffer px, y up */
  write(out: THREE.Vector3, H: number, dpr: number) {
    out.set(this.pos.x * dpr, (H - this.pos.y) * dpr, this.radius * dpr);
  }

  dispose() {
    this.cleanup();
    document.documentElement.removeAttribute('data-lens');
  }
}
