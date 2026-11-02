// SH4 web — FeniXVOID · Project Ravenlight
import { partesBin } from "../lib/sh4bin.js";

import { leerTexturas, aRGBA } from "../lib/texturas.js";

import { leerModelo } from "../lib/modelo.js";

import { crearPersonaje } from "../lib/personaje.js";

import { materialPS2, geometriaDinamica } from "./comun.js";

const DT = 1 / 30;

const DOS_PI = Math.PI * 2;

const envolver = a => {
  a %= DOS_PI;
  if (a > Math.PI) a -= DOS_PI; else if (a < -Math.PI) a += DOS_PI;
  return a;
};

function randMsvc(semilla = 1) {
  let s = semilla >>> 0;
  return () => {
    s = Math.imul(s, 214013) + 2531011 >>> 0;
    return s >>> 16 & 32767;
  };
}

function grupoJuego(THREE, escala) {
  const g = new THREE.Group;
  g.rotation.z = Math.PI;
  g.scale.setScalar(escala);
  return g;
}

async function texturaBin(THREE, bajar, archivo, parte, srgb = true) {
  const buf = await bajar("data/" + archivo);
  const p = partesBin(buf)[parte];
  const im = leerTexturas(buf, p.ofs, p.len)[0][0];
  const t = new THREE.DataTexture(new Uint8Array(aRGBA(im)), im.ancho, im.alto, THREE.RGBAFormat);
  t.flipY = false;
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.minFilter = t.magFilter = THREE.LinearFilter;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.needsUpdate = true;
  return t;
}

const CUADRO_LLAMA = k => {
  const j = k < 24 ? k : 47 - k;
  const c = j % 6, f = Math.floor(j / 6);
  return [ c * 32, f * 64, c * 32 + 32, f * 64 + 64 ];
};

const RESPLANDOR = [ [ 192, 0, 256, 64 ], [ 192, 64, 256, 128 ], [ 192, 128, 256, 192 ] ];

function siguienteCuadro(k, rnd) {
  const v = k % 48, r = rnd() % 3;
  if (v === 12) return r === 0 ? 37 : 12;
  if (v === 24) return r !== 0 ? 0 : 25;
  if (v === 36) return r === 0 ? 13 : 36;
  if (v === 0) return r !== 0 ? 24 : 0;
  return v;
}

const VERT_VELA = `\nattribute vec3 centro; attribute vec2 esquina; attribute float tipo;\nvarying vec2 vUv; varying float vDist;\nuniform float escala;\nvoid main() {\n  vUv = uv;\n  vec4 cw = modelMatrix * vec4(centro, 1.0);\n  if (tipo < 0.5) {\n    // llama (0x545ae0): cartel vertical que mira a la cámara solo en el giro (ancho ±10, alto ±20 del juego)\n    vec3 aCam = cameraPosition - cw.xyz; aCam.y = 0.0;\n    vec3 der = normalize(vec3(aCam.z, 0.0, -aCam.x) + vec3(1e-6, 0.0, 0.0));\n    vec3 p = cw.xyz + der * esquina.x * 10.0 * escala + vec3(0.0, 1.0, 0.0) * esquina.y * 20.0 * escala;\n    vec4 mv = viewMatrix * vec4(p, 1.0);\n    vDist = -mv.z;\n    gl_Position = projectionMatrix * mv;\n  } else {\n    // resplandor: cuadrado de pantalla de ±60 del juego (0x5b7d44) alrededor del centro\n    vec4 cv = viewMatrix * cw;\n    cv.xy += esquina * 60.0 * escala;\n    vDist = -cv.z;\n    gl_Position = projectionMatrix * cv;\n  }\n}`;

const FRAG_VELA = `\nuniform sampler2D mapa; uniform vec4 uNiebla; uniform vec3 uNieblaColor; varying vec2 vUv; varying float vDist;\nvoid main() { vec4 c = texture2D(mapa, vUv); if (c.a < 0.004) discard;\n  if (uNiebla.w > 0.5) {\n    vec3 g = sRGBTransferOETF(vec4(c.rgb, 1.0)).rgb;\n    g = mix(uNieblaColor, g, clamp(uNiebla.x + uNiebla.y / max(vDist * uNiebla.z, 1e-3), 0.0, 1.0));\n    c.rgb = sRGBTransferEOTF(vec4(g, 1.0)).rgb;\n  }\n  gl_FragColor = c;\n#include <colorspace_fragment>\n}`;

const nieblaDelJuego = () => (globalThis.sh4juego?.ambiente?.fx ?? globalThis.sh4?.efectos)?.nieblaActual ?? null;

export async function crearVelasDemo({THREE: THREE, bajar: bajar, escala: escala = .005, posiciones: posiciones, semilla: semilla = 65, niebla: niebla = nieblaDelJuego}) {
  const tex = await texturaBin(THREE, bajar, "wp_model.bin", 83);
  const n = posiciones.length, nv = n * 8;
  const centro = new Float32Array(nv * 3), esquina = new Float32Array(nv * 2), tipo = new Float32Array(nv), uv = new Float32Array(nv * 2), pos = new Float32Array(nv * 3);
  const idx = [];
  const ESQ = [ [ -1, -1 ], [ 1, -1 ], [ -1, 1 ], [ 1, 1 ] ];
  posiciones.forEach((p, i) => {
    for (let q = 0; q < 8; q++) {
      const v = i * 8 + q;
      centro.set(p, v * 3);
      pos.set(p, v * 3);
      const [ex, ey] = ESQ[q % 4];
      esquina.set([ ex, -ey ], v * 2);
      tipo[v] = q < 4 ? 1 : 0;
    }
    for (const b of [ i * 8, i * 8 + 4 ]) idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3);
  });
  const g = new THREE.BufferGeometry;
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("centro", new THREE.BufferAttribute(centro, 3));
  g.setAttribute("esquina", new THREE.BufferAttribute(esquina, 2));
  g.setAttribute("tipo", new THREE.BufferAttribute(tipo, 1));
  g.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  g.setIndex(idx);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      mapa: {
        value: tex
      },
      escala: {
        value: escala
      },
      uNiebla: {
        value: new THREE.Vector4(1, 0, 1 / escala, 0)
      },
      uNieblaColor: {
        value: new THREE.Color(0)
      }
    },
    vertexShader: VERT_VELA,
    fragmentShader: FRAG_VELA,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const malla = new THREE.Mesh(g, mat);
  malla.frustumCulled = false;
  malla.renderOrder = 5;
  malla.name = "velas (0x545990)";
  malla.onBeforeRender = () => {
    let co = null;
    try {
      co = typeof niebla === "function" ? niebla() : niebla;
    } catch {}
    const u = mat.uniforms;
    if (!co) {
      u.uNiebla.value.w = 0;
      return;
    }
    u.uNiebla.value.set(co.c0, co.c1, 1 / escala, 1);
    u.uNieblaColor.value.setRGB(co.color[0], co.color[1], co.color[2]);
  };
  const grupo = grupoJuego(THREE, escala);
  grupo.add(malla);
  grupo.name = "velas de la demo";
  const rnd = randMsvc(semilla);
  const est = posiciones.map(() => ({
    cont: rnd() % 3,
    cuadro: rnd() % 24
  }));
  const ponerRect = (v, r) => {
    uv.set([ r[0] / 256, r[1] / 256, r[2] / 256, r[1] / 256, r[0] / 256, r[3] / 256, r[2] / 256, r[3] / 256 ], v * 2);
  };
  const pintar = () => {
    est.forEach((e, i) => {
      ponerRect(i * 8, RESPLANDOR[e.cont % 3]);
      ponerRect(i * 8 + 4, CUADRO_LLAMA(e.cuadro % 48));
    });
    g.attributes.uv.needsUpdate = true;
  };
  pintar();
  let acum = 0;
  return {
    grupo: grupo,
    actualizar(dt) {
      acum += dt;
      let k = 0;
      while (acum >= DT && k++ < 30) {
        acum -= DT;
        for (const e of est) {
          e.cont++;
          e.cuadro = siguienteCuadro(e.cuadro + 1, rnd);
        }
      }
      if (k) pintar();
    },
    dispose() {
      g.dispose();
      mat.dispose();
      tex.dispose();
    }
  };
}

export async function crearObjetoJefe({THREE: THREE, bajar: bajar, escala: escala = .005, materialOkimono: materialOkimono = null}) {
  const buf = await bajar("data/ls02.bin");
  const ps = partesBin(buf);
  const modelo = leerModelo(buf, ps[5].ofs, ps[5].len);
  const texs = ps[6]?.tipo === "texturas" ? leerTexturas(buf, ps[6].ofs, ps[6].len) : [];
  const mf = materialOkimono?.() || null;
  const pj = crearPersonaje(modelo, texs, mf ? {
    material: mf.material
  } : undefined);
  pj.grupo.name = "objeto de ls02 (0x4e4b10)";
  const nh = modelo.huesos.length;
  const abs = modelo.huesos.map(h => (new THREE.Matrix4).fromArray(h.matriz));
  const padres = modelo.huesos.map(h => h.padre);
  const local = abs.map((m, i) => padres[i] >= 0 ? (new THREE.Matrix4).copy(abs[padres[i]]).invert().multiply(m) : m.clone());
  const ang = new Float32Array(5), fase = new Float32Array(5);
  const nuevo = abs.map(() => new THREE.Matrix4), rx = new THREE.Matrix4;
  const aplicar = () => {
    for (let i = 0; i < nh; i++) {
      const m = nuevo[i].copy(local[i]);
      if (i % 2 === 0 && i < 10) m.multiply(rx.makeRotationX(ang[i / 2]));
      if (padres[i] >= 0) m.premultiply(nuevo[padres[i]]);
      pj.huesos[i].matrix.copy(m);
      pj.huesos[i].matrixWorldNeedsUpdate = true;
    }
  };
  aplicar();
  let acum = 0;
  return {
    grupo: pj.grupo,
    uniformsLuz: mf?.u || null,
    mallas: pj.mallas,
    actualizar(dt) {
      acum += dt;
      let k = 0;
      while (acum >= DT && k++ < 30) {
        acum -= DT;
        for (let i = 0; i < 5; i++) {
          let d;
          if (i === 0) d = -DT; else {
            fase[i] = envolver(DT * .5 / (i + 1) + fase[i]);
            d = Math.sin(fase[i]) * .0785;
          }
          ang[i] = envolver(d + ang[i]);
        }
      }
      if (k) aplicar();
    },
    dispose() {
      pj.dispose();
    }
  };
}

const ANILLOS = [ [ 250, .00195, 60, 6.2832 ], [ 340, .0847, 80, 10.053 ], [ 360, .00195, 60, 7.5398 ], [ 380, .0847, 34, 12.566 ], [ 440, .1667, 80, 8.1681 ], [ 480, .0847, 30, 11.31 ], [ 520, .00195, 90, 7.5398 ], [ 560, .1667, 40, 10.681 ], [ 700, .00195, 32, 6.2832 ], [ 760, .1667, 12, 10.053 ], [ 940, .25, 26, 10.053 ], [ 1120, .3333, 12, 10.053 ], [ 1280, .25, 26, 6.9115 ], [ 1440, .3333, 10, 6.9115 ] ];

const LUCES_CHARCO = [ {
  p: [ 0, 1384 * .75, -2218 ],
  k: 1
}, {
  p: [ 0, 844 * .75, 1400 ],
  k: .7
} ];

const NS = 16, NR = ANILLOS.length;

export async function crearCharcoJefe({THREE: THREE, bajar: bajar, escala: escala = .005, centro: centro = [ 0, 50, 0 ], semilla: semilla = 69}) {
  const tex = await texturaBin(THREE, bajar, "last_boss_bg_eff.bin", 0, false);
  const nv = (NS + 1) * NR;
  const idx = [];
  const V = (s, r) => s * NR + r;
  for (let s = 0; s < NS; s++) for (let r = 0; r < NR - 1; r++) idx.push(V(s, r), V(s + 1, r), V(s, r + 1), V(s + 1, r), V(s + 1, r + 1), V(s, r + 1));
  const g0 = geometriaDinamica(THREE, nv, idx), g1 = geometriaDinamica(THREE, nv, idx);
  const m0 = materialPS2(THREE, {
    mezcla: 68,
    mapa: tex,
    region: new THREE.Vector4(0, .49609375, 0, .49609375)
  });
  const m1 = materialPS2(THREE, {
    mezcla: 72,
    mapa: tex
  });
  const s0 = new THREE.Mesh(g0, m0), s1 = new THREE.Mesh(g1, m1);
  s0.frustumCulled = s1.frustumCulled = false;
  s0.renderOrder = 3;
  s1.renderOrder = 4;
  s0.userData.sinSombra = s1.userData.sinSombra = true;
  const grupo = grupoJuego(THREE, escala);
  grupo.add(s0, s1);
  grupo.name = "charco del jefe (0x4319c0)";
  const P0 = g0.attributes.position.array, P1 = g1.attributes.position.array, U0 = g0.attributes.uvq.array, U1 = g1.attributes.uvq.array;
  const C0 = g0.attributes.color.array, C1 = g1.attributes.color.array;
  const rnd = randMsvc(semilla);
  const f5 = new Float32Array(nv), f6 = new Float32Array(nv);
  for (let s = 0; s < NS; s++) for (let r = 0; r < NR; r++) {
    f5[V(s, r)] = envolver(ANILLOS[r][0] * .02618);
    f6[V(s, r)] = (rnd() << 15 | rnd()) / 1073741823 * .99 * DOS_PI;
  }
  let camara = null;
  s0.onBeforeRender = (r, e, c) => {
    camara = c;
  };
  const camJ = new THREE.Vector3, inv = new THREE.Matrix4, tmp = new THREE.Vector3;
  function calcular() {
    grupo.updateWorldMatrix(true, false);
    if (camara) {
      camJ.setFromMatrixPosition(camara.matrixWorld);
      inv.copy(grupo.matrixWorld).invert();
      camJ.applyMatrix4(inv);
    } else camJ.set(centro[0], centro[1] - 2e3, centro[2] - 2e3);
    for (let s = 0; s <= NS; s++) {
      const s16 = s % NS, a = s16 * Math.PI / 8, sa = Math.sin(a), ca = Math.cos(a);
      for (let r = 0; r < NR; r++) {
        const [rad, v0, amp] = ANILLOS[r], i = V(s, r), j = V(s16, r);
        const x = rad * sa + centro[0], z = rad * ca + centro[2];
        const y = Math.sin(f5[j]) * 10 + Math.sin(f6[j]) * amp + centro[1];
        P0[i * 3] = P1[i * 3] = x;
        P0[i * 3 + 1] = P1[i * 3 + 1] = y;
        P0[i * 3 + 2] = P1[i * 3 + 2] = z;
        let vx = x - camJ.x, vy = y - camJ.y, vz = z - camJ.z;
        const lv = Math.hypot(vx, vy, vz) || 1;
        vx /= lv;
        vy /= lv;
        vz /= lv;
        let nx = sa * rad * 675e-6, ny = .8, nz = ca * rad * 675e-6;
        const ln = Math.hypot(nx, ny, nz);
        nx /= ln;
        ny /= ln;
        nz /= ln;
        let b = (vx * nx + vy * ny + vz * nz) * .3 + .7;
        b = b <= 0 ? 0 : r === 0 ? b * .4 : b;
        let br = 0;
        const ux = -vx, uy = -vy, uz = -vz;
        for (const L of LUCES_CHARCO) {
          const lx = L.p[0] - x, ly = L.p[1] - y, lz = L.p[2] - z, d = Math.hypot(lx, ly, lz) || 1;
          const nyl = ly / d, hz = (1 - nyl * nyl - .2) * 1.25;
          if (hz < 0) continue;
          const co = Math.cos(.34906587), cono = ((ux * lx + uy * ly + uz * lz) / d - co) / (1 - co);
          if (cono < 0) continue;
          const caida = 1 - d * 625e-7;
          if (caida < 0) continue;
          br += caida * L.k * cono * hz;
        }
        br = Math.min(1, br);
        const s5 = Math.sin(f5[j]), s6 = Math.sin(f6[j]), c6 = Math.cos(f6[j]), q = c6 * .7 + 1.2;
        const u0 = s === NS ? .998 : s * .0623 + .00195;
        U0[i * 3] = u0 * q;
        U0[i * 3 + 1] = v0 * q;
        U0[i * 3 + 2] = q;
        C0[i * 4] = Math.round(((s5 * .5 + s6) * 2.3 + 42) * b) / 128;
        C0[i * 4 + 1] = C0[i * 4 + 2] = Math.round(b * 13) / 128;
        C0[i * 4 + 3] = 1;
        tmp.set(s5 * sa + s6 * sa + c6 * ca, -2, s5 * ca + (s6 * ca - c6 * sa)).normalize();
        if (camara) {
          tmp.transformDirection(grupo.matrixWorld).transformDirection(camara.matrixWorldInverse);
          tmp.y = -tmp.y;
        }
        U1[i * 3] = (tmp.x * .118 + .621) * q;
        U1[i * 3 + 1] = (tmp.y * .118 + .125) * q;
        U1[i * 3 + 2] = q;
        C1[i * 4] = C1[i * 4 + 1] = C1[i * 4 + 2] = 1;
        C1[i * 4 + 3] = Math.min(1, Math.round((s6 * .2 + .8) * br * 50) / 128);
      }
    }
    for (const g of [ g0, g1 ]) for (const k of [ "position", "uvq", "color" ]) g.attributes[k].needsUpdate = true;
  }
  calcular();
  let acum = 0;
  return {
    grupo: grupo,
    get prendido() {
      return grupo.visible;
    },
    prender(si) {
      grupo.visible = !!si;
    },
    actualizar(dt) {
      if (!grupo.visible) return;
      acum += dt;
      let k = 0;
      while (acum >= DT && k++ < 30) {
        acum -= DT;
        for (let s = 0; s < NS; s++) for (let r = 0; r < NR; r++) {
          const i = V(s, r);
          f5[i] = envolver(f5[i] + DT * DOS_PI);
          f6[i] = envolver(f6[i] + DT * ANILLOS[r][3]);
        }
      }
      if (k || camara) calcular();
    },
    dispose() {
      g0.dispose();
      g1.dispose();
      m0.dispose();
      m1.dispose();
      tex.dispose();
    }
  };
}

export const VELAS_CM065 = [ [ -423.54, -180.58, -254.36 ], [ -651.82, -229.82, -318.69 ], [ 76.93, -65.66, 786.56 ], [ 77.67, -53.64, 1024.47 ], [ 76.93, -71.33, 1413.72 ], [ 385.31, -62.94, 1652.24 ], [ 384.57, -70.47, 1414.24 ], [ 385.31, -48.73, 1190.21 ], [ 385.31, -64.28, 786.56 ], [ 407.51, -73.76, 549.15 ], [ 493.05, -236.53, 1483.68 ], [ -819.43, -199.36, 36.79 ], [ -819.43, -171.46, 274.09 ], [ -735.06, -369.79, 442.71 ], [ -169.84, -269.14, 429.55 ], [ -572.8, -178.15, 442.71 ], [ 338.09, -242.7, 179.35 ], [ -366.31, -153.71, 69.84 ], [ 920.9, -253.12, -301.37 ], [ -423.54, -180.58, -254.36 ] ];
