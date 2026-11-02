// SH4 web — FeniXVOID · Project Ravenlight
import { texturasDeParte, crearRand } from "./comun.js";

import { coeficientesNiebla as coefSala, escalarNiebla, alCambiarNiebla } from "../lib/sala.js";

import { NIEBLA_RADIAL, PROF_NIEBLA, DECL_NIEBLA } from "../lib/niebla_radial.js";

export function coeficientesNiebla(n) {
  return escalarNiebla(coefSala(n));
}

export function cantidadNiebla(co, z) {
  return co ? 1 - Math.min(1, Math.max(0, co.c0 + co.c1 / Math.max(z, .001))) : 0;
}

export const GLSL_NIEBLA = `\nuniform vec4 uSh4Niebla; // c0, c1, 1/ESCALA, activa\nuniform vec3 uSh4NieblaColor;\nfloat sh4Visibilidad(float zMetros) { return clamp(uSh4Niebla.x + uSh4Niebla.y / max(zMetros * uSh4Niebla.z, 1e-3), 0.0, 1.0); }\n`;

export function crearNieblaSala({THREE: THREE, escala: escala}) {
  const uniforms = {
    uSh4Niebla: {
      value: new THREE.Vector4(1, 0, 1 / escala, 0)
    },
    uSh4NieblaColor: {
      value: new THREE.Color(0)
    }
  };
  const parchados = new WeakSet;
  function parchar(mat) {
    if (!mat || parchados.has(mat) || mat.isShaderMaterial) return;
    parchados.add(mat);
    const previo = mat.onBeforeCompile;
    mat.onBeforeCompile = (sh, r) => {
      previo?.call(mat, sh, r);
      Object.assign(sh.uniforms, uniforms, {
        uNieblaRadial: NIEBLA_RADIAL
      });
      sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying float vSh4Prof;\n" + DECL_NIEBLA).replace("#include <project_vertex>", "#include <project_vertex>\n\tvSh4Prof = " + PROF_NIEBLA + ";");
      sh.fragmentShader = sh.fragmentShader.replace("#include <common>", "#include <common>\nvarying float vSh4Prof;\n" + GLSL_NIEBLA).replace("#include <fog_fragment>", "#include <fog_fragment>\n\tif (uSh4Niebla.w > 0.5) gl_FragColor.rgb = mix(uSh4NieblaColor, gl_FragColor.rgb, sh4Visibilidad(vSh4Prof));");
    };
    const clave = mat.customProgramCacheKey?.bind(mat);
    mat.customProgramCacheKey = () => (clave ? clave() : "") + "|sh4niebla";
    mat.needsUpdate = true;
  }
  let ultima = null;
  const api = {
    uniforms: uniforms,
    parchar: parchar,
    poner(n, activa = true) {
      ultima = [ n, activa ];
      const co = coeficientesNiebla(n);
      if (!co) {
        uniforms.uSh4Niebla.value.w = 0;
        return null;
      }
      uniforms.uSh4Niebla.value.set(co.c0, co.c1, 1 / escala, activa ? 1 : 0);
      uniforms.uSh4NieblaColor.value.setRGB(...co.color);
      return co;
    },
    activar(si) {
      uniforms.uSh4Niebla.value.w = si ? 1 : 0;
    }
  };
  alCambiarNiebla(() => {
    if (ultima && uniforms.uSh4Niebla.value.w > .5) api.poner(...ultima);
  });
  return api;
}

const P = (n, banderas, alfa, borde, cerca, vel, min, max, radio, alto, omega, texS) => ({
  n: n,
  banderas: banderas,
  alfa: alfa,
  borde: borde,
  cerca: cerca,
  vel: vel,
  min: min,
  max: max,
  radio: radio,
  alto: alto,
  omega: omega,
  texS: texS
});

export const TEXFOG = {
  fr13: P(40, 7, 25, [ 50, 50, 58 ], [ 35, 32, 37, 20 ], [ 800, 600, 0 ], [ -2400, -800, -2400 ], [ 2400, 600, 2400 ], 1400, .8, .349, 2),
  mz31: P(80, 7, 25, [ 30, 0, 50 ], [ 160, 160, 170, 55 ], [ 1e3, 0, 0 ], [ -2400, -1200, -2400 ], [ 2400, 1600, 2400 ], 1e3, .6, .349, 1),
  mz31b: P(80, 7, 7, [ 30, 30, 60 ], [ 70, 70, 90, 95 ], [ 1400, 0, 0 ], [ -2400, -1200, -2400 ], [ 2400, 1600, 2400 ], 1600, .6, .349, 2),
  mz33a: P(80, 0, 35, [ 100, 80, 150 ], [ 135, 135, 140, 55 ], [ 600, 200, 0 ], [ -1800, -1e3, -3200 ], [ 1700, -600, 300 ], 800, .6, .349, 1),
  mz33ab: P(80, 0, 35, [ 100, 80, 150 ], [ 90, 90, 100, 85 ], [ 1600, 600, 0 ], [ -1800, -1300, -3200 ], [ 1700, -800, 300 ], 1400, .5, .436, 2),
  mz33c: P(80, 0, 25, [ 100, 80, 150 ], [ 135, 135, 140, 40 ], [ 600, 200, 0 ], [ -1800, -1e3, -3200 ], [ 1700, -600, 300 ], 1400, .6, .349, 1),
  mz33cb: P(80, 7, 25, [ 20, 20, 30 ], [ 70, 60, 80, 85 ], [ 660, 0, 0 ], [ -1600, -1400, -1600 ], [ 1600, 3e3, 1600 ], 1300, .7, .436, 1),
  edificio: P(40, 7, 35, [ 12, 12, 12 ], [ 28, 26, 26, 90 ], [ 0, 0, 0 ], [ -2e3, -600, -2e3 ], [ 2e3, 1e3, 2e3 ], 1400, .6, .524, 1.3),
  bd04: P(15, 2, 55, [ 34, 34, 37 ], [ 30, 34, 38, 40 ], [ 700, 300, -860 ], [ -400, -600, -800 ], [ 1700, 600, 1600 ], 1200, .6, .698, 1.8),
  ls: P(40, 5, 85, [ 60, 45, 40 ], [ 34, 29, 26, 70 ], [ 0, 140, 3e3 ], [ -2e3, -1200, -2e3 ], [ 2e3, -300, 2e3 ], 1200, .75, .087, .7)
};

const BOSQUE = [ null, [ 40, 4800, 20, 30, 1600, 500 ], [ 40, 4800, 20, 30, 1600, 500 ], [ 40, 4800, 25, 30, 1600, 500 ], [ 40, 4800, 25, 30, 1600, 500 ], [ 40, 4800, 20, 30, 1600, 500 ], null, [ 40, 4800, 25, 53, 1600, 500 ], [ 40, 4800, 32, 60, 1600, 500 ], [ 40, 4800, 40, 90, 1200, 500 ], [ 40, 4800, 40, 90, 1600, 500 ], [ 40, 3840, 45, 80, 1100, 300 ], [ 40, 4800, 35, 80, 1600, 500 ], [ 40, 4800, 28, 65, 1600, 500 ], [ 40, 4800, 30, 70, 1600, 500 ], [ 40, 4800, 27, 50, 1600, 500 ], [ 80, 4e3, 40, 105, 1160, 500 ], [ 40, 4800, 30, 65, 1600, 500 ], [ 40, 4800, 25, 40, 1600, 500 ], [ 40, 4800, 30, 30, 1600, 500 ] ];

function deBosque(f) {
  const [n, L, alfa, cerca, radio, vel] = f, ang = -1.3962634;
  return P(n, 7, alfa, [ 40, 37, 42 ], [ 35, 32, 37, cerca ], [ Math.sin(ang) * vel, 0, Math.cos(ang) * vel ], [ -L / 2, -1200, -L / 2 ], [ L / 2, 800, L / 2 ], radio, .6, .349, .7);
}

const EDIFICIO_VIENTO = {
  1: [ 2.0943952, 0, 1.3 ],
  2: [ 2.792527, 1500, 1.3 ],
  3: [ 2.3561945, 500, 1.3 ],
  4: [ 2.792527, 1e3, 1.3 ],
  5: [ 2.443461, 400, 1.3 ],
  18: [ -2.0943952, 100, .3 ]
};

export function texFogDeSala(sala, mitad = 1) {
  const mu = sala.slice(0, 2), esc = parseInt(sala.slice(2, 4), 10);
  const r = [];
  if (mu === "fr") {
    if (mitad === 2 && BOSQUE[esc]) r.push(deBosque(BOSQUE[esc])); else if (esc === 13) r.push(TEXFOG.fr13);
  } else if (mu === "mz" && esc === 31) {
    const t = mitad === 2 ? TEXFOG.mz31b : TEXFOG.mz31;
    r.push(t, t);
  } else if (mu === "mz" && esc === 33) r.push(mitad === 2 ? TEXFOG.mz33ab : TEXFOG.mz33a, mitad === 2 ? TEXFOG.mz33cb : TEXFOG.mz33c); else if (mu === "bd" && mitad === 2 && EDIFICIO_VIENTO[esc]) {
    const [a, y, texS] = EDIFICIO_VIENTO[esc];
    r.push({
      ...TEXFOG.edificio,
      vel: [ Math.sin(a) * 1e3, y, Math.cos(a) * 1e3 ],
      texS: texS
    });
    if (esc === 4) r.push(TEXFOG.bd04);
  } else if (mu === "ls" && esc === 2) r.push(TEXFOG.ls);
  return r;
}

export function crearTexFog({THREE: THREE, lib: lib, raiz: raiz, camara: camara, escala: escala, rand: rand = crearRand(7)}) {
  const grupo = new THREE.Group;
  grupo.name = "niebla_textura";
  raiz.add(grupo);
  let tex = null, sistemas = [], colorNiebla = [ 0, 0, 0 ];
  const cargar = () => texturasDeParte(THREE, lib, "system_load.bin", 2).then(t => {
    tex = t[0][0];
    for (const s of sistemas) s.mat.uniforms.mapa.value = tex;
  });
  const base = new THREE.BufferGeometry;
  const ang = new Float32Array(7 * 2);
  ang.set([ 0, 0 ], 0);
  for (let k = 0; k <= 5; k++) ang.set([ 2 * Math.PI - k % 5 * 1.2566371, 1 ], (k + 1) * 2);
  base.setAttribute("position", new THREE.BufferAttribute(new Float32Array(7 * 3), 3));
  base.setAttribute("pent", new THREE.BufferAttribute(ang, 2));
  base.setIndex([ 0, 1, 2, 0, 2, 3, 0, 3, 4, 0, 4, 5, 0, 5, 6 ]);
  function crearSistema(p) {
    const n = Math.min(80, p.n);
    const g = new THREE.InstancedBufferGeometry;
    g.index = base.index;
    g.setAttribute("position", base.attributes.position);
    g.setAttribute("pent", base.attributes.pent);
    const iPos = new THREE.InstancedBufferAttribute(new Float32Array(n * 3), 3).setUsage(THREE.DynamicDrawUsage);
    const iDat = new THREE.InstancedBufferAttribute(new Float32Array(n * 4), 4).setUsage(THREE.DynamicDrawUsage);
    g.setAttribute("iPos", iPos);
    g.setAttribute("iDat", iDat);
    g.instanceCount = n;
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        mapa: {
          value: tex
        },
        uRadio: {
          value: p.radio * escala
        },
        uAlto: {
          value: p.alto
        },
        uAlfa: {
          value: p.alfa / 128
        },
        uCentro: {
          value: new THREE.Color
        },
        uBorde: {
          value: new THREE.Color(p.borde[0] / 128, p.borde[1] / 128, p.borde[2] / 128)
        }
      },
      vertexShader: `\n        attribute vec2 pent; attribute vec3 iPos; attribute vec4 iDat; // iDat: u, v, giro, alfa\n        uniform float uRadio, uAlto;\n        varying vec2 vUv; varying float vBorde, vAlfa;\n        void main() {\n          vec4 mv = modelViewMatrix * vec4(iPos, 1.0);\n          float d = -mv.z, a = pent.x + iDat.z * pent.y;\n          // se desvanece cerca de la cámara: < 0,3125·radio, y no se dibuja por debajo de 0,1625·radio\n          float cerca = clamp((d - uRadio * 0.1625) / (uRadio * 0.15), 0.0, 1.0);\n          mv.xy += pent.y * vec2(cos(a), sin(a) * uAlto) * uRadio;\n          vUv = vec2(clamp(iDat.x, 0.11, 0.3861), clamp(iDat.y, 0.86, 0.885)) + pent.y * 0.11 * vec2(cos(pent.x), sin(pent.x));\n          vBorde = pent.y; vAlfa = iDat.w * cerca;\n          gl_Position = projectionMatrix * mv;\n        }`,
      fragmentShader: `\n        uniform sampler2D mapa; uniform float uAlfa; uniform vec3 uCentro, uBorde;\n        varying vec2 vUv; varying float vBorde, vAlfa;\n        void main() {\n          vec4 t = texture2D(mapa, vUv);\n          vec3 c = mix(uCentro, uBorde, vBorde);\n          float a = mix(uAlfa * vAlfa, 0.0, vBorde) * t.a;\n          gl_FragColor = vec4(sRGBTransferEOTF(vec4(clamp(t.rgb * c, 0.0, 1.0), 1.0)).rgb, clamp(a, 0.0, 1.0));\n          #include <colorspace_fragment>\n        }`,
      transparent: true,
      depthWrite: false,
      side: THREE.DoubleSide
    });
    const malla = new THREE.Mesh(g, mat);
    malla.frustumCulled = false;
    malla.renderOrder = 40;
    malla.userData.sinSombra = true;
    grupo.add(malla);
    const part = [];
    for (let i = 0; i < n; i++) {
      const q = {
        p: [ 0, 0, 0 ],
        v: 1 - rand.f() * .3,
        u: .5 - rand.f(),
        w: .5 - rand.f(),
        giro: rand.f() * 2 * Math.PI,
        om: rand.f() * .7 + .3,
        borde: 1
      };
      for (let k = 0; k < 3; k++) {
        const f = (p.max[k] - p.min[k]) * (rand.f() - .5);
        q.p[k] = f + f + p.min[k];
      }
      if (rand() & 512) q.om = -q.om;
      part.push(q);
    }
    const s = {
      p: p,
      n: n,
      g: g,
      iPos: iPos,
      iDat: iDat,
      mat: mat,
      malla: malla,
      part: part,
      origen: null,
      cerca: 0,
      cercaTgt: .5
    };
    return s;
  }
  const cam = new THREE.Vector3;
  function actualizar(dt) {
    if (!sistemas.length) return;
    camara.getWorldPosition(cam);
    const cj = [ -cam.x / escala, -cam.y / escala, cam.z / escala ];
    for (const s of sistemas) {
      const {p: p} = s;
      const o = [ p.banderas & 1 ? cj[0] : 0, p.banderas & 2 ? cj[1] : 0, p.banderas & 4 ? cj[2] : 0 ];
      const d = s.origen ? [ o[0] - s.origen[0], o[1] - s.origen[1], o[2] - s.origen[2] ] : [ 0, 0, 0 ];
      s.origen = o;
      const L = [ 0, 1, 2 ].map(k => p.max[k] - p.min[k]);
      s.part.forEach((q, i) => {
        q.u += dt * p.texS * .04;
        if (q.u > 1) q.u -= 1;
        q.giro += dt * q.om * p.omega;
        for (let k = 0; k < 3; k++) {
          q.p[k] += dt * q.v * p.vel[k] - d[k];
          if (q.p[k] > p.max[k]) q.p[k] -= L[k];
          if (q.p[k] < p.min[k]) q.p[k] += L[k];
        }
        let f = (q.p[0] - p.min[0]) * (p.max[0] - q.p[0]) * 16 / (L[0] * L[0]);
        f = Math.min(f, (q.p[0] - p.min[0]) * (p.max[0] - q.p[0]) * 16 / (L[1] * L[1]));
        f = Math.min(f, (p.max[2] - q.p[2]) * (q.p[2] - p.min[2]) * 16 / (L[2] * L[2]));
        q.borde = Math.max(0, Math.min(1, f));
        s.iPos.array.set([ -(q.p[0] + o[0]) * escala, -(q.p[1] + o[1]) * escala, (q.p[2] + o[2]) * escala ], i * 3);
        s.iDat.array.set([ q.u, q.w, q.giro, q.borde ], i * 4);
      });
      s.iPos.needsUpdate = s.iDat.needsUpdate = true;
      const vel = .45;
      if (Math.abs(s.cercaTgt - s.cerca) <= vel * dt) {
        s.cerca = s.cercaTgt;
        s.cercaTgt = s.cerca * .4 + ((1 - rand.f() ** 2) * 1.05 + .15) * .6;
      } else s.cerca += Math.sign(s.cercaTgt - s.cerca) * vel * dt;
    }
  }
  return {
    grupo: grupo,
    cargar: cargar,
    actualizar: actualizar,
    capaCercana() {
      for (const s of sistemas) if (s.p.cerca[3]) return [ s.p.cerca[0] / 128, s.p.cerca[1] / 128, s.p.cerca[2] / 128, Math.min(1, s.p.cerca[3] / 128 * s.cerca) ];
      return null;
    },
    poner(lista, colorSala) {
      for (const s of sistemas) {
        grupo.remove(s.malla);
        s.g.dispose();
        s.mat.dispose();
      }
      colorNiebla = colorSala || [ 0, 0, 0 ];
      sistemas = lista.map(crearSistema);
      for (const s of sistemas) {
        s.mat.uniforms.mapa.value = tex;
        s.mat.uniforms.uCentro.value.setRGB(colorNiebla[0] / 128, colorNiebla[1] / 128, colorNiebla[2] / 128);
      }
      return sistemas.length;
    },
    get sistemas() {
      return sistemas;
    }
  };
}
