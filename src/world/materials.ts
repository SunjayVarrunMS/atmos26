import * as THREE from 'three';

/**
 * The three states of every machine, as materials:
 *  surface  lit metal (PBR + baked AO) that pours into the drawing bottom-up
 *           with a molten front, and is cut away inside the lens
 *  lines    the blueprint: edges drawn part by part, eaten by the pour
 *  points   the machine view: brass dots in the open, signal light inside
 *           the lens (the lens is a ring, so teal stays inside a ring)
 */

// ---------------------------------------------------------------- shared uniforms
/** lens centre and radius in drawing-buffer pixels (y up), radius 0 = off */
export const shared = {
  uLens: { value: new THREE.Vector3(0, 0, 0) },
  uRes: { value: new THREE.Vector2(1, 1) },
  uTime: { value: 0 },
  uPixelRatio: { value: 1 },
};

/** per-chamber beat uniforms, one object per chamber */
export function chamberUniforms() {
  return {
    uArrive: { value: 0 },
    uDraw: { value: 0 },
    uCast: { value: 0 },
    uExit: { value: 0 },
    /** how much of the machine view shows outside the lens */
    uSee: { value: 1 },
    /** chamber origin (world) and its vertical extent (local), for fill order */
    uOrigin: { value: new THREE.Vector3() },
    uSpan: { value: new THREE.Vector2(-8, 8) },
  };
}
export type ChamberUniforms = ReturnType<typeof chamberUniforms>;

// ---------------------------------------------------------------- GLSL helpers
// 3D simplex noise, Ashima Arts / Stefan Gustavson (MIT)
const NOISE = /* glsl */ `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+10.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0);const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy));vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz);vec3 l=1.0-g;vec3 i1=min(g.xyz,l.zxy);vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx;vec3 x2=x0-i2+C.yyy;vec3 x3=x0-D.yyy;
  i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857;vec3 ns=n_*D.wyz-D.xzx;
  vec4 j=p-49.0*floor(p*ns.z*ns.z);vec4 x_=floor(j*ns.z);vec4 y_=floor(j-7.0*x_);
  vec4 x=x_*ns.x+ns.yyyy;vec4 y=y_*ns.x+ns.yyyy;vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy);vec4 b1=vec4(x.zw,y.zw);
  vec4 s0=floor(b0)*2.0+1.0;vec4 s1=floor(b1)*2.0+1.0;vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy;vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x);vec3 p1=vec3(a0.zw,h.y);vec3 p2=vec3(a1.xy,h.z);vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3)));
  p0*=norm.x;p1*=norm.y;p2*=norm.z;p3*=norm.w;
  vec4 m=max(0.5-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0);m=m*m;
  return 105.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}
`;

// fill order of a world point inside its chamber: mostly height, broken up
// by noise so the pour front is ragged like real metal
const FILL = /* glsl */ `
float fillOrder(vec3 wp){
  float h = clamp((wp.y - uOrigin.y - uSpan.x) / (uSpan.y - uSpan.x), 0.0, 1.0);
  float n = snoise(wp * 2.3) * 0.5 + 0.5;
  float n2 = snoise(wp * 7.0) * 0.5 + 0.5;
  return h * 0.86 + n * 0.1 + n2 * 0.04;
}
`;

const LENS = /* glsl */ `
float lensMask(vec2 px){
  if (uLens.z < 0.5) return 0.0;
  float d = length(px - uLens.xy);
  return 1.0 - smoothstep(uLens.z - 1.5, uLens.z + 0.5, d);
}
`;

// ---------------------------------------------------------------- palette
// Real metals are defined by their reflections; base colours are the F0 tints.
const METALS: Record<string, THREE.MeshStandardMaterialParameters & { ao?: number }> = {
  brass: { color: '#d9a653', metalness: 1, roughness: 0.3, envMapIntensity: 1.0 },
  brass_dark: { color: '#9c7031', metalness: 1, roughness: 0.42, envMapIntensity: 0.9 },
  iron: { color: '#2b2926', metalness: 0.7, roughness: 0.58, envMapIntensity: 0.8 },
  steel: { color: '#c3c7cc', metalness: 1, roughness: 0.2, envMapIntensity: 1.0 },
  rope: { color: '#6b5238', metalness: 0, roughness: 0.92, envMapIntensity: 0.4 },
};

export const MOLTEN = new THREE.Color(4.0, 2.0, 0.7);

export function makeSurface(name: string, u: ChamberUniforms) {
  const spec = METALS[name] ?? METALS.iron;
  const mat = new THREE.MeshStandardMaterial({ ...spec });
  mat.name = name;
  const uAo = { value: spec.ao ?? 0.9 };
  const uMolten = { value: MOLTEN };

  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, u, shared, { uAo, uMolten });
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        attribute vec4 color;
        varying float vAoV;
        varying vec3 vWPos;`,
      )
      .replace(
        '#include <project_vertex>',
        `#include <project_vertex>
        vAoV = color.r;
        vWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;`,
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform float uCast, uExit, uAo, uTime;
        uniform vec3 uOrigin, uLens, uMolten;
        uniform vec2 uSpan;
        varying float vAoV;
        varying vec3 vWPos;
        ${NOISE}
        ${FILL}
        ${LENS}`,
      )
      .replace(
        '#include <clipping_planes_fragment>',
        `#include <clipping_planes_fragment>
        float fo = fillOrder(vWPos);
        float fillTo = uCast * 1.3 - 0.15;
        if (fo > fillTo) discard;
        float goneTo = uExit * 1.3 - 0.15;
        if (fo < goneTo) discard;
        if (lensMask(gl_FragCoord.xy) > 0.5) discard;
        // 1 right at the pour front, fading into cooled metal behind it
        float pour = (1.0 - smoothstep(0.0, 0.022, fillTo - fo)) * step(0.001, uCast) * (1.0 - step(0.999, uCast));
        float leave = (1.0 - smoothstep(0.0, 0.02, fo - goneTo)) * step(0.001, uExit);`,
      )
      .replace(
        '#include <roughnessmap_fragment>',
        `#include <roughnessmap_fragment>
        // hand-finished metal: roughness drifts across the surface
        roughnessFactor = clamp(roughnessFactor * (0.82 + 0.36 * (snoise(vWPos * 3.1) * 0.5 + 0.5)), 0.05, 1.0);`,
      )
      .replace(
        '#include <aomap_fragment>',
        `float ambientOcclusion = mix(1.0, vAoV, uAo);
        reflectedLight.indirectDiffuse *= ambientOcclusion;
        float dotNVao = saturate(dot(geometryNormal, geometryViewDir));
        reflectedLight.indirectSpecular *= computeSpecularOcclusion(dotNVao, ambientOcclusion, material.roughness);
        reflectedLight.directDiffuse *= mix(1.0, ambientOcclusion, 0.6);
        reflectedLight.directSpecular *= mix(1.0, ambientOcclusion, 0.6);`,
      )
      .replace(
        '#include <emissivemap_fragment>',
        `#include <emissivemap_fragment>
        totalEmissiveRadiance += uMolten * pour * (0.7 + 0.3 * snoise(vWPos * 6.0 + uTime));
        totalEmissiveRadiance += vec3(0.35, 1.6, 1.8) * leave;`,
      );
  };
  mat.customProgramCacheKey = () => 'atmos-surface';
  return mat;
}

// ---------------------------------------------------------------- blueprint lines
export function makeLines(u: ChamberUniforms) {
  return new THREE.ShaderMaterial({
    uniforms: { ...u, ...shared, uColor: { value: new THREE.Color('#d9a654') } },
    vertexShader: /* glsl */ `
      attribute float aOrder;
      uniform vec3 uLens;
      uniform vec2 uRes;
      varying float vOrder;
      varying vec3 vWPos;
      varying float vLens;
      ${LENS}
      void main() {
        vOrder = aOrder;
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
        vec2 px = (gl_Position.xy / gl_Position.w * 0.5 + 0.5) * uRes;
        vLens = lensMask(px);
      }`,
    fragmentShader: /* glsl */ `
      uniform float uDraw, uCast, uExit;
      uniform vec3 uColor, uOrigin;
      uniform vec2 uSpan;
      varying float vOrder;
      varying vec3 vWPos;
      varying float vLens;
      ${NOISE}
      ${FILL}
      void main() {
        float drawn = 1.0 - smoothstep(uDraw - 0.004, uDraw, vOrder);
        // the pen tip: a hot point where the line is being drawn
        float tip = drawn * (1.0 - smoothstep(0.0, 0.03, uDraw - vOrder)) * step(uDraw, 0.999);
        // metal pouring into the drawing replaces it
        float fo = fillOrder(vWPos);
        float poured = step(fo, uCast * 1.3 - 0.15 + 0.02);
        float a = drawn * (1.0 - poured) * 0.8;
        a = max(a, vLens * 0.22);
        a *= 1.0 - uExit;
        if (a < 0.004) discard;
        vec3 col = mix(uColor, vec3(2.6, 2.1, 1.4), tip);
        // ink, not light: overlapping strokes stay brass instead of summing to white
        gl_FragColor = vec4(col, min(1.0, a + tip));
      }`,
    transparent: true,
    depthWrite: false,
  });
}

// ---------------------------------------------------------------- machine view
export function makePoints(u: ChamberUniforms, size = 2.2) {
  return new THREE.ShaderMaterial({
    uniforms: { ...u, ...shared, uSize: { value: size } },
    vertexShader: /* glsl */ `
      attribute vec4 aRand;
      uniform float uArrive, uExit, uSee, uSize, uPixelRatio, uTime;
      uniform vec3 uLens;
      uniform vec2 uRes;
      varying float vVis;
      varying float vLens;
      varying float vDepth;
      varying float vScan;
      varying vec4 vRand;
      ${LENS}
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        // arriving: each dot rises into place at its own moment
        float k = clamp(uArrive * 1.35 - aRand.x * 0.35, 0.0, 1.0);
        k = 1.0 - pow(1.0 - k, 3.0);
        wp.y -= (1.0 - k) * (3.0 + aRand.y * 9.0);
        // leaving: the dots stream up the shaft, fanning out
        float e = clamp(uExit * 1.45 - aRand.x * 0.45, 0.0, 1.0);
        e = e * e;
        wp.y += e * (5.0 + aRand.y * 26.0);
        wp.xz += e * (aRand.zw - 0.5) * 7.0;
        vec4 mv = viewMatrix * wp;
        gl_Position = projectionMatrix * mv;
        vec2 px = (gl_Position.xy / gl_Position.w * 0.5 + 0.5) * uRes;
        vLens = lensMask(px) * k;
        vVis = max(uSee * k * (1.0 - e * 0.85), vLens);
        vDepth = -mv.z;
        // a slow scan band climbing the machine, like a sensor sweep
        float s = fract(wp.y * 0.07 - uTime * 0.12);
        vScan = smoothstep(0.0, 0.04, s) * (1.0 - smoothstep(0.04, 0.16, s));
        vRand = aRand;
        gl_PointSize = uSize * uPixelRatio * (0.55 + aRand.w * 0.9) * (14.0 / max(1.0, -mv.z)) * (1.0 - vLens * 0.25);
      }`,
    fragmentShader: /* glsl */ `
      varying float vVis;
      varying float vLens;
      varying float vDepth;
      varying float vScan;
      varying vec4 vRand;
      const vec3 BRASS_HI = vec3(0.91, 0.757, 0.44);
      const vec3 BRASS = vec3(0.788, 0.588, 0.169);
      const vec3 SIGNAL = vec3(0.498, 0.965, 1.0);
      const vec3 TEAL = vec3(0.184, 0.639, 0.659);
      void main() {
        if (vVis < 0.004) discard;
        vec2 c = gl_PointCoord - 0.5;
        float a = smoothstep(0.5, 0.2, length(c));
        vec3 brass = mix(BRASS_HI, BRASS, vRand.x);
        if (vRand.w > 0.86) brass = mix(TEAL, SIGNAL, vRand.z);
        float near = 1.0 - smoothstep(6.0, 22.0, vDepth);
        vec3 machine = mix(TEAL * 0.55, SIGNAL * 0.8, near) + SIGNAL * vScan * 0.9;
        vec3 col = mix(brass, machine, vLens);
        float gain = mix(1.0, 0.42, vLens);
        gl_FragColor = vec4(col * a * vVis * gain, 1.0);
      }`,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
}
