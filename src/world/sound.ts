/**
 * The ascent's sound, synthesised in the browser (no recordings, nothing to
 * license). Off until the visitor turns it on, and the choice is remembered.
 *
 *  drone     a low pad that opens up as you rise; the future is brighter
 *  clockwork tick and tock on the escapement's own seconds
 *  steam     a chuff on every quarter turn of the drivers, and a hiss
 *  silicon   faint data blips over a mains hum
 *  genome    a struck bell each time a base pair is rewritten
 *  thought   a rising swell through the network, a chime at the apex
 *  summit    a chord as the artwork lands
 */

type Layer = 'clockwork' | 'steam' | 'silicon' | 'genome' | 'intelligence' | 'summit';

export interface SoundFrame {
  /** 0..1 how much of the world is on screen */
  presence: number;
  /** journey progress 0..1 */
  progress: number;
  /** 0..1 level for each floor */
  layers: Partial<Record<Layer, number>>;
  /** the locomotive's driver angle (radians) and speed (rad/s) */
  steamAngle: number;
  steamSpeed: number;
}

const KEY = 'atmos:sound';
const D = 73.42; // D2

class Sound {
  enabled = false;
  private subs = new Set<() => void>();
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private meterNode: AnalyserNode | null = null;
  private dry!: GainNode;
  private wet!: GainNode;
  private noise!: AudioBuffer;
  private droneFilter!: BiquadFilterNode;
  private droneGain!: GainNode;
  private hiss!: GainNode;
  private hum!: GainNode;
  private levels: Record<Layer, number> = { clockwork: 0, steam: 0, silicon: 0, genome: 0, intelligence: 0, summit: 0 };
  private lastSecond = 0;
  private lastChuff = 0;
  private nextBlip = 0;
  private onVis = () => {
    if (!this.ctx) return;
    if (document.hidden) this.ctx.suspend();
    else if (this.enabled) this.ctx.resume();
  };

  constructor() {
    try {
      this.enabled = localStorage.getItem(KEY) === 'on';
    } catch {
      this.enabled = false;
    }
    // a remembered "on" still needs a gesture before audio may start
    if (this.enabled && typeof window !== 'undefined') {
      const wake = () => {
        window.removeEventListener('pointerdown', wake);
        window.removeEventListener('keydown', wake);
        if (this.enabled) this.start();
      };
      window.addEventListener('pointerdown', wake);
      window.addEventListener('keydown', wake);
    }
  }

  subscribe(fn: () => void) {
    this.subs.add(fn);
    return () => {
      this.subs.delete(fn);
    };
  }

  toggle() {
    this.enabled = !this.enabled;
    try {
      localStorage.setItem(KEY, this.enabled ? 'on' : 'off');
    } catch {
      /* private mode: the choice lasts this visit */
    }
    if (this.enabled) this.start();
    else this.stop();
    this.subs.forEach((s) => s());
  }

  private start() {
    if (!this.ctx) this.build();
    const ctx = this.ctx!;
    ctx.resume();
    const t = ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(0.9, t, 0.6);
  }

  private stop() {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(0, t, 0.25);
    const ctx = this.ctx;
    setTimeout(() => {
      if (!this.enabled) ctx.suspend();
    }, 1200);
  }

  private build() {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    this.ctx = ctx;

    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 3;
    comp.attack.value = 0.01;
    comp.release.value = 0.3;
    this.master = ctx.createGain();
    this.master.gain.value = 0;
    this.master.connect(comp).connect(ctx.destination);
    this.meterNode = ctx.createAnalyser();
    this.meterNode.fftSize = 2048;
    comp.connect(this.meterNode);

    // a synthetic hall for the bells and swells
    const verb = ctx.createConvolver();
    verb.buffer = this.impulse(3.2);
    this.wet = ctx.createGain();
    this.wet.gain.value = 0.55;
    this.wet.connect(verb).connect(this.master);
    this.dry = ctx.createGain();
    this.dry.connect(this.master);

    this.noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const n = this.noise.getChannelData(0);
    for (let i = 0; i < n.length; i++) n[i] = Math.random() * 2 - 1;

    // drone: a sub, and a detuned fifth through a filter that opens with the ascent
    this.droneFilter = ctx.createBiquadFilter();
    this.droneFilter.type = 'lowpass';
    this.droneFilter.frequency.value = 280;
    this.droneFilter.Q.value = 0.7;
    this.droneGain = ctx.createGain();
    this.droneGain.gain.value = 0;
    this.droneFilter.connect(this.droneGain);
    this.droneGain.connect(this.dry);
    this.droneGain.connect(this.wet);
    const osc = (type: OscillatorType, f: number, g: number, detune = 0) => {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = f;
      o.detune.value = detune;
      const gain = ctx.createGain();
      gain.gain.value = g;
      o.connect(gain).connect(this.droneFilter);
      o.start();
    };
    osc('sine', D, 0.5);
    osc('triangle', D * 2, 0.22, -6);
    osc('triangle', D * 2, 0.22, 6);
    osc('triangle', D * 3, 0.14, -4);
    osc('sine', D * 4, 0.05, 3);
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 90;
    lfo.connect(lfoGain).connect(this.droneFilter.frequency);
    lfo.start();

    // steam hiss and silicon hum run continuously, gated by their floors
    const hissSrc = ctx.createBufferSource();
    hissSrc.buffer = this.noise;
    hissSrc.loop = true;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 3800;
    this.hiss = ctx.createGain();
    this.hiss.gain.value = 0;
    hissSrc.connect(hp).connect(this.hiss).connect(this.dry);
    hissSrc.start();

    this.hum = ctx.createGain();
    this.hum.gain.value = 0;
    this.hum.connect(this.dry);
    for (const [f, g] of [[100, 0.6], [200, 0.25], [300, 0.1]] as const) {
      const o = ctx.createOscillator();
      o.frequency.value = f;
      const gg = ctx.createGain();
      gg.gain.value = g;
      o.connect(gg).connect(this.hum);
      o.start();
    }

    document.addEventListener('visibilitychange', this.onVis);
  }

  private impulse(seconds: number) {
    const ctx = this.ctx!;
    const len = Math.floor(ctx.sampleRate * seconds);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2);
    }
    return buf;
  }

  // ---------------------------------------------------------------- voices
  private burst(at: number, dur: number, type: BiquadFilterType, freq: number, q: number, gain: number, to?: number, wet = 0) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const f = ctx.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, at);
    if (to) f.frequency.exponentialRampToValueAtTime(to, at + dur);
    f.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(gain, at + Math.min(0.006, dur * 0.2));
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    src.connect(f).connect(g).connect(this.dry);
    if (wet) {
      const w = ctx.createGain();
      w.gain.value = wet;
      g.connect(w).connect(this.wet);
    }
    src.start(at, Math.random() * 1.5, dur + 0.05);
  }

  private tone(at: number, freq: number, dur: number, gain: number, type: OscillatorType = 'sine', to?: number, wet = 0.4) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, at);
    if (to) o.frequency.exponentialRampToValueAtTime(to, at + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(gain, at + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    o.connect(g).connect(this.dry);
    const w = ctx.createGain();
    w.gain.value = wet;
    g.connect(w).connect(this.wet);
    o.start(at);
    o.stop(at + dur + 0.05);
  }

  // a struck bell: FM with a decaying index
  private bell(at: number, freq: number, gain: number) {
    const ctx = this.ctx!;
    const car = ctx.createOscillator();
    const mod = ctx.createOscillator();
    const idx = ctx.createGain();
    car.frequency.value = freq;
    mod.frequency.value = freq * 3.5;
    idx.gain.setValueAtTime(freq * 2.2, at);
    idx.gain.exponentialRampToValueAtTime(1, at + 1.6);
    mod.connect(idx).connect(car.frequency);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(gain, at + 0.004);
    g.gain.exponentialRampToValueAtTime(0.0001, at + 2.4);
    car.connect(g).connect(this.dry);
    const w = ctx.createGain();
    w.gain.value = 0.9;
    g.connect(w).connect(this.wet);
    car.start(at);
    mod.start(at);
    car.stop(at + 2.5);
    mod.stop(at + 2.5);
  }

  /** output level in dBFS (peak and RMS over ~40 ms), for checking the mix */
  meter() {
    if (!this.meterNode) return null;
    const d = new Float32Array(this.meterNode.fftSize);
    this.meterNode.getFloatTimeDomainData(d);
    let peak = 0, sum = 0;
    for (const v of d) {
      peak = Math.max(peak, Math.abs(v));
      sum += v * v;
    }
    const db = (x: number) => (x > 0 ? 20 * Math.log10(x) : -120);
    return { peak: db(peak), rms: db(Math.sqrt(sum / d.length)) };
  }

  /** a moment in the world: a base pair rewritten, a thought, the landing */
  event(kind: 'flip' | 'fire' | 'land') {
    if (!this.enabled || !this.ctx || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime + 0.02;
    if (kind === 'flip' && this.levels.genome > 0.05) {
      const notes = [D * 8, D * 9, D * 10, D * 12, D * 13.5];
      this.bell(t, notes[Math.floor(Math.random() * notes.length)], 0.05 * this.levels.genome);
    } else if (kind === 'fire' && this.levels.intelligence > 0.05) {
      const l = this.levels.intelligence;
      this.burst(t, 2.6, 'bandpass', 260, 4, 0.05 * l, 3200, 0.8);
      this.tone(t, D * 3, 2.8, 0.025 * l, 'sine', D * 12, 0.8);
      // the thought reaches the apex
      this.bell(t + 2.9, D * 16, 0.045 * l);
    } else if (kind === 'land' && this.levels.summit > 0.05) {
      for (const [f, g] of [[D * 2, 0.03], [D * 3, 0.025], [D * 4, 0.022], [D * 5, 0.018], [D * 9, 0.012]] as const) {
        this.tone(t, f, 6.5, g, 'triangle', undefined, 0.9);
      }
    }
  }

  /** called by the engine every frame */
  update(f: SoundFrame) {
    if (!this.enabled || !this.ctx || this.ctx.state !== 'running') return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    for (const k of Object.keys(this.levels) as Layer[]) this.levels[k] = f.layers[k] ?? 0;
    const L = this.levels;

    this.droneGain.gain.setTargetAtTime(0.07 * f.presence, t, 0.4);
    this.droneFilter.frequency.setTargetAtTime(260 + 1300 * f.progress * f.progress, t, 0.8);
    this.hiss.gain.setTargetAtTime(0.012 * L.steam * Math.min(1, 0.3 + f.steamSpeed / 4), t, 0.3);
    this.hum.gain.setTargetAtTime(0.012 * L.silicon, t, 0.5);

    // clockwork: tick, tock, on the escapement's seconds
    const sec = Math.floor(Date.now() / 1000);
    if (sec !== this.lastSecond) {
      this.lastSecond = sec;
      if (L.clockwork > 0.05) {
        const tock = sec % 2 === 0;
        this.burst(t, 0.05, 'bandpass', tock ? 1500 : 3300, 7, 0.14 * L.clockwork, undefined, 0.35);
        this.tone(t, tock ? 190 : 260, 0.08, 0.05 * L.clockwork, 'sine', undefined, 0.2);
      }
    }
    // steam: a chuff on every quarter turn
    const chuff = Math.floor(-f.steamAngle / (Math.PI / 2));
    if (chuff !== this.lastChuff) {
      this.lastChuff = chuff;
      if (L.steam > 0.05) {
        const g = 0.15 * L.steam * Math.min(1, 0.35 + f.steamSpeed / 6);
        this.burst(t, 0.22, 'lowpass', 900, 1.2, g, 260, 0.25);
      }
    }
    // silicon: sparse blips
    if (L.silicon > 0.05 && t > this.nextBlip) {
      this.nextBlip = t + 0.12 + Math.random() * 0.6;
      this.tone(t, 1400 + Math.random() * 1400, 0.045, 0.012 * L.silicon, 'sine', undefined, 0.5);
    }
  }
}

export const sound = new Sound();
