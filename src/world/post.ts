import * as THREE from 'three';
import {
  BlendFunction,
  BloomEffect,
  Effect,
  EffectComposer,
  EffectPass,
  FXAAEffect,
  NoiseEffect,
  RenderPass,
  ToneMappingEffect,
  ToneMappingMode,
  VignetteEffect,
} from 'postprocessing';
import type { TierSettings } from './quality';

/**
 * The loupe. Inside the ring the surfaces are already cut away (the machine
 * view shows through); this pass magnifies what's inside a touch, bends the
 * rim like thick glass, and draws the brass ring with the four ticks of the
 * site's cursor reticle.
 */
class LensEffect extends Effect {
  constructor() {
    super(
      'LensEffect',
      /* glsl */ `
      uniform vec3 lens;
      uniform vec2 res;
      uniform float dpr;
      uniform vec3 ringColor;
      void mainUv(inout vec2 uv) {
        if (lens.z < 0.5) return;
        vec2 d = uv * res - lens.xy;
        float r = length(d) / lens.z;
        if (r < 1.0) {
          float k = mix(0.9, 1.0, r * r * r);
          uv = (lens.xy + d * k) / res;
        }
      }
      void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
        vec3 col = inputColor.rgb;
        if (lens.z > 0.5) {
          vec2 d = gl_FragCoord.xy - lens.xy;
          float dist = length(d);
          float w = 0.75 * dpr;
          float ring = 1.0 - smoothstep(w * 0.5, w * 1.5, abs(dist - lens.z));
          float out0 = lens.z + 5.0 * dpr, out1 = lens.z + 14.0 * dpr;
          float band = step(out0, dist) * step(dist, out1);
          float tick = band * max(1.0 - smoothstep(w * 0.5, w * 1.5, abs(d.x)), 1.0 - smoothstep(w * 0.5, w * 1.5, abs(d.y)));
          // a faint darkening just outside the glass, like its shadow
          float shade = smoothstep(lens.z, lens.z + 18.0 * dpr, dist) * 0.25 + 0.75;
          col *= mix(1.0, shade, step(lens.z, dist) * (1.0 - smoothstep(lens.z + 18.0 * dpr, lens.z + 40.0 * dpr, dist)));
          col += ringColor * (ring + tick * 0.8);
        }
        outputColor = vec4(col, inputColor.a);
      }`,
      {
        uniforms: new Map<string, THREE.Uniform>([
          ['lens', new THREE.Uniform(new THREE.Vector3())],
          ['res', new THREE.Uniform(new THREE.Vector2(1, 1))],
          ['dpr', new THREE.Uniform(1)],
          ['ringColor', new THREE.Uniform(new THREE.Color(0.95, 0.72, 0.36))],
        ]),
      },
    );
  }
}

export class Post {
  readonly composer: EffectComposer;
  readonly lens = new LensEffect();
  private bloom: BloomEffect | null = null;

  constructor(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera, tier: TierSettings) {
    this.composer = new EffectComposer(renderer, {
      frameBufferType: THREE.HalfFloatType,
      multisampling: tier.msaa,
    });
    this.composer.addPass(new RenderPass(scene, camera));

    const effects: Effect[] = [this.lens];
    if (tier.bloom) {
      this.bloom = new BloomEffect({
        mipmapBlur: true,
        luminanceThreshold: 1.0,
        luminanceSmoothing: 0.35,
        intensity: 0.85,
        radius: 0.72,
      });
      effects.push(this.bloom);
    }
    effects.push(new VignetteEffect({ offset: 0.28, darkness: 0.78 }));
    effects.push(new ToneMappingEffect({ mode: ToneMappingMode.AGX }));

    const grain = new NoiseEffect({ blendFunction: BlendFunction.SOFT_LIGHT, premultiply: false });
    grain.blendMode.opacity.value = 0.32;

    if (tier.msaa > 0) {
      effects.push(grain);
      this.composer.addPass(new EffectPass(camera, ...effects));
    } else {
      this.composer.addPass(new EffectPass(camera, ...effects));
      this.composer.addPass(new EffectPass(camera, new FXAAEffect(), grain));
    }
  }

  setSize(w: number, h: number, bufferW: number, bufferH: number, dpr: number) {
    this.composer.setSize(w, h, false);
    this.lens.uniforms.get('res')!.value.set(bufferW, bufferH);
    this.lens.uniforms.get('dpr')!.value = dpr;
  }

  setLens(v: THREE.Vector3) {
    this.lens.uniforms.get('lens')!.value.copy(v);
  }

  render(dt: number) {
    this.composer.render(dt);
  }

  dispose() {
    this.composer.dispose();
  }
}
