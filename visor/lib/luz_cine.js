// SH4 web — FeniXVOID · Project Ravenlight
import * as THREE from "three";

export const ESCALA = .005;

const LUMA = [ .3, .6, .1 ];

const MAX_DIR = 3, MAX_PUNT = 4;

const AMBIENTE_INICIAL = [ .3, .3, .3 ];

export function crearUniformsLuz() {
  return {
    uLuzAmb: {
      value: new THREE.Vector3(...AMBIENTE_INICIAL)
    },
    uLuzDirDir: {
      value: Array.from({
        length: MAX_DIR
      }, () => new THREE.Vector3(0, -1, 0))
    },
    uLuzDirCol: {
      value: Array.from({
        length: MAX_DIR
      }, () => new THREE.Vector3)
    },
    uLuzPunPos: {
      value: Array.from({
        length: MAX_PUNT
      }, () => new THREE.Vector3)
    },
    uLuzPunCol: {
      value: Array.from({
        length: MAX_PUNT
      }, () => new THREE.Vector3)
    },
    uLuzPunAte: {
      value: Array.from({
        length: MAX_PUNT
      }, () => new THREE.Vector2(0, 0))
    },
    uLuzActiva: {
      value: 1
    }
  };
}

export function materialJuego(tex, subparte, uniforms) {
  const L = subparte?.luz;
  const dif = L ? L.dif.slice(0, 3).map(v => v / 128) : [ .8, .8, .8 ];
  const amb = L ? L.amb.slice(0, 3).map(v => v / 128) : [ .5, .5, .5 ];
  const m = new THREE.MeshBasicMaterial({
    map: tex,
    side: THREE.DoubleSide,
    alphaTest: .3,
    color: tex ? 16777215 : 8939093
  });
  m.onBeforeCompile = sh => {
    Object.assign(sh.uniforms, uniforms, {
      uMatDif: {
        value: new THREE.Vector3(...dif)
      },
      uMatAmb: {
        value: new THREE.Vector3(...amb)
      }
    });
    sh.vertexShader = sh.vertexShader.replace("#include <common>", `#include <common>\nuniform vec3 uLuzAmb; uniform vec3 uLuzDirDir[${MAX_DIR}]; uniform vec3 uLuzDirCol[${MAX_DIR}];\nuniform vec3 uLuzPunPos[${MAX_PUNT}]; uniform vec3 uLuzPunCol[${MAX_PUNT}]; uniform vec2 uLuzPunAte[${MAX_PUNT}];\nuniform vec3 uMatDif; uniform vec3 uMatAmb; uniform float uLuzActiva;\nvarying vec3 vLuzJuego;`).replace("#include <fog_vertex>", `#include <fog_vertex>\n{\n  // normal del archivo (hacia adentro) → hacia afuera; en el espacio del mundo de Three\n  vec3 nW = -normalize(mat3(modelMatrix) * objectNormal);\n  vec3 pW = (modelMatrix * vec4(transformed, 1.0)).xyz;\n  vec3 suma = vec3(0.0);\n  for (int i = 0; i < ${MAX_DIR}; i++) suma += max(dot(nW, -uLuzDirDir[i]), 0.0) * uLuzDirCol[i];\n  for (int i = 0; i < ${MAX_PUNT}; i++) {\n    vec3 d = pW - uLuzPunPos[i]; float dist = max(length(d), 1e-4);\n    float ate = clamp(uLuzPunAte[i].x / dist + uLuzPunAte[i].y, 0.0, 1.0);\n    suma += max(dot(nW, -d / dist), 0.0) * ate * uLuzPunCol[i];\n  }\n  vLuzJuego = uLuzActiva > 0.5 ? clamp(suma * uMatDif + uLuzAmb * uMatAmb, 0.0, 1.0) : vec3(1.0);\n}`);
    sh.fragmentShader = sh.fragmentShader.replace("#include <common>", `#include <common>\nvarying vec3 vLuzJuego;\nvec3 luzJuegoAGamma(vec3 c) { return mix(c * 12.92, 1.055 * pow(max(c, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c)); }\nvec3 luzJuegoALineal(vec3 c) { return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(vec3(0.04045), c)); }`).replace("#include <map_fragment>", `#include <map_fragment>\n  diffuseColor.rgb = luzJuegoALineal(luzJuegoAGamma(diffuseColor.rgb) * vLuzJuego);`);
  };
  m.customProgramCacheKey = () => "luz_cine_sh4";
  return m;
}

const _q = new THREE.Quaternion;

export function lucesDelJuego(sqt, S) {
  const r = {
    amb: null,
    dir: [],
    pun: [],
    foco: []
  };
  S.luces.forEach((s, i) => {
    const id = sqt.luces[i]?.id;
    let tipo = s.tipo;
    if (id === 250) tipo = 6; else if (id === 251) tipo = 5;
    const col = [ s.color[0], s.color[1], s.color[2] ], luma = col[0] * LUMA[0] + col[1] * LUMA[1] + col[2] * LUMA[2];
    if (tipo === 1) {
      r.amb = col;
      return;
    }
    if (tipo === 2) {
      _q.set(s.rot[0], s.rot[1], s.rot[2], s.rot[3]);
      const d = new THREE.Vector3(0, 0, 1).applyQuaternion(_q);
      r.dir.push({
        dir: new THREE.Vector3(-d.x, -d.y, d.z).normalize(),
        col: col,
        luma: luma
      });
      return;
    }
    if (tipo === 3 || tipo === 4) {
      const p0 = s.params[0] || 0;
      const l = {
        pos: new THREE.Vector3(-s.pos[0] * ESCALA, -s.pos[1] * ESCALA, s.pos[2] * ESCALA),
        col: col,
        luma: luma,
        ini: p0 * 4e3 * ESCALA,
        fin: p0 * 8e3 * ESCALA,
        foco: tipo === 4
      };
      r.pun.push(l);
    }
  });
  return r;
}

export function aplicarLucesPersonaje(u, luces, centro, ambPrevia = null) {
  const amb = luces.amb || ambPrevia || AMBIENTE_INICIAL;
  u.uLuzAmb.value.set(amb[0], amb[1], amb[2]);
  const dirs = luces.dir.slice().sort((a, b) => b.luma - a.luma).slice(0, MAX_DIR);
  for (let i = 0; i < MAX_DIR; i++) {
    const d = dirs[i];
    if (d) {
      u.uLuzDirDir.value[i].copy(d.dir);
      u.uLuzDirCol.value[i].set(d.col[0], d.col[1], d.col[2]);
    } else u.uLuzDirCol.value[i].set(0, 0, 0);
  }
  const pesos = luces.pun.map(l => {
    const dist = centro ? l.pos.distanceTo(centro) : 0;
    const ate = l.fin > l.ini ? Math.min(1, Math.max(0, (l.fin - dist) / (l.fin - l.ini))) : 0;
    return {
      l: l,
      w: ate * l.luma
    };
  }).filter(x => x.w > 0).sort((a, b) => b.w - a.w).slice(0, MAX_PUNT).map(x => x.l).filter(l => !l.foco);
  for (let i = 0; i < MAX_PUNT; i++) {
    const l = pesos[i];
    if (l && l.fin > l.ini) {
      const f = 1 / (l.ini - l.fin);
      u.uLuzPunPos.value[i].copy(l.pos);
      u.uLuzPunCol.value[i].set(l.col[0], l.col[1], l.col[2]);
      u.uLuzPunAte.value[i].set(-f * l.ini * l.fin, f * l.ini);
    } else {
      u.uLuzPunCol.value[i].set(0, 0, 0);
      u.uLuzPunAte.value[i].set(0, 0);
    }
  }
}

export function luzEnPunto(luces, p, n, ambPrevia = null, dif = .8, ambMat = .5) {
  const u = crearUniformsLuz();
  aplicarLucesPersonaje(u, luces, p, ambPrevia);
  const suma = [ 0, 0, 0 ];
  for (let i = 0; i < MAX_DIR; i++) {
    const k = Math.max(0, -n.dot(u.uLuzDirDir.value[i]));
    suma[0] += k * u.uLuzDirCol.value[i].x;
    suma[1] += k * u.uLuzDirCol.value[i].y;
    suma[2] += k * u.uLuzDirCol.value[i].z;
  }
  for (let i = 0; i < MAX_PUNT; i++) {
    const d = p.clone().sub(u.uLuzPunPos.value[i]), dist = Math.max(d.length(), 1e-4);
    const ate = Math.min(1, Math.max(0, u.uLuzPunAte.value[i].x / dist + u.uLuzPunAte.value[i].y));
    const k = Math.max(0, -n.dot(d.divideScalar(dist))) * ate;
    suma[0] += k * u.uLuzPunCol.value[i].x;
    suma[1] += k * u.uLuzPunCol.value[i].y;
    suma[2] += k * u.uLuzPunCol.value[i].z;
  }
  const a = u.uLuzAmb.value;
  return [ suma[0] * dif + a.x * ambMat, suma[1] * dif + a.y * ambMat, suma[2] * dif + a.z * ambMat ].map(v => Math.min(1, v));
}
