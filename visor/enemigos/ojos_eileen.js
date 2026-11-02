// SH4 web — FeniXVOID · Project Ravenlight
import * as THREE from "three";

import { armarClusters } from "../lib/clusters.js";

import { muestrearPista } from "../lib/animacion.js";

export const CO = {
  ANIM_BOCA: 45,
  HUESO_BOCA: 23,
  CLUSTER_PARPADO: 0,
  PARPADEO_MIN: 60,
  PARPADEO_AZAR: 120,
  CIERRA: .5,
  ABRE: 1 / 3,
  COJEA: .22,
  NUBLADO: .8,
  LECHE: [ 222, 224, 226 ],
  ROJO: .35
};

const Q = typeof location !== "undefined" ? new URLSearchParams(location.search) : new URLSearchParams;

const FORZADO = Q.has("ojosvivos") ? Q.get("ojosvivos") !== "0" : null;

export const extrasPrendidos = () => FORZADO ?? (() => {
  try {
    return !!globalThis.sh4?.mejorado?.estado?.activo;
  } catch {
    return false;
  }
})();

export function crearOjos(pj, modelo, anims) {
  const cl = pj.clustersCara !== undefined ? pj.clustersCara : pj.clustersCara = armarClusters(pj, modelo);
  const ojo = pj.ojoMaldito !== undefined ? pj.ojoMaldito : pj.ojoMaldito = prepararOjo(pj, modelo);
  const boca = anims?.[CO.ANIM_BOCA]?.pistas?.find(p => p.clase === "rot" && p.hueso === CO.HUESO_BOCA) || null;
  const durBoca = Math.max(1, anims?.[CO.ANIM_BOCA]?.duracion || 30);
  const est = {
    peso: 0,
    hablando: false,
    tBoca: 0,
    extras: false,
    falta: CO.PARPADEO_MIN,
    fase: 0,
    maldicion: 0
  };
  const q = new Float32Array(4);
  function tick(s) {
    est.hablando = !!s.hablando;
    est.tBoca = est.hablando ? (est.tBoca + 1) % durBoca : 0;
    est.extras = extrasPrendidos();
    est.maldicion = s.maldicion || 0;
    if (!est.extras) {
      est.peso = 0;
      est.fase = 0;
      return;
    }
    if (est.fase === 0 && --est.falta <= 0) est.fase = 1;
    let p = est.peso;
    if (est.fase === 1) {
      p += CO.CIERRA;
      if (p >= 1) {
        p = 1;
        est.fase = 2;
      }
    } else if (est.fase === 2) est.fase = 3; else if (est.fase === 3) {
      p -= CO.ABRE;
      if (p <= 0) {
        p = 0;
        est.fase = 0;
        est.falta = CO.PARPADEO_MIN + Math.floor(Math.random() * CO.PARPADEO_AZAR);
      }
    }
    const base = s.danio ? 1 : s.cojea ? CO.COJEA : 0;
    if (est.fase) est.peso = Math.max(p, base); else est.peso += (base - est.peso) * .3;
  }
  function aplicar(pose) {
    cl?.poner(CO.CLUSTER_PARPADO, est.peso);
    ojo?.poner(est.extras ? est.maldicion : 0);
    if (!est.hablando || !boca || !pose) return false;
    const h = CO.HUESO_BOCA, p = pose.padres[h];
    if (p == null || p < 0) return false;
    muestrearPista(boca, est.tBoca, q, 0);
    pose.rot.set(q, h * 4);
    qmul(pose.absRot, p * 4, q, 0, pose.absRot, h * 4);
    return true;
  }
  return {
    tick: tick,
    aplicar: aplicar,
    est: est,
    get clusters() {
      return cl;
    },
    get ojo() {
      return ojo;
    }
  };
}

function qmul(a, ia, b, ib, out, io) {
  const ax = a[ia], ay = a[ia + 1], az = a[ia + 2], aw = a[ia + 3], bx = b[ib], by = b[ib + 1], bz = b[ib + 2], bw = b[ib + 3];
  out[io] = aw * bx + ax * bw + ay * bz - az * by;
  out[io + 1] = aw * by - ax * bz + ay * bw + az * bx;
  out[io + 2] = aw * bz + ax * by - ay * bx + az * bw;
  out[io + 3] = aw * bw - ax * bx - ay * by - az * bz;
}

function prepararOjo(pj, modelo) {
  if (typeof document === "undefined" || !modelo?.partes) return null;
  const cl = pj.clustersCara;
  if (!cl) return null;
  const conCluster = new Set(cl.mallas);
  const caja = new THREE.Box3;
  for (const m of cl.mallas) {
    const a = m.geometry.morphAttributes.position?.[0]?.array, p = m.geometry.attributes.position.array;
    if (!a) continue;
    for (let i = 0; i < a.length; i += 3) if (a[i] || a[i + 1] || a[i + 2]) caja.expandByPoint(new THREE.Vector3(p[i], p[i + 1], p[i + 2]));
  }
  if (caja.isEmpty()) return null;
  caja.expandByScalar(2);
  const usos = new Map;
  modelo.partes.forEach(s => {
    const g = s.textura?.grupo;
    if (g != null) usos.set(g, (usos.get(g) || 0) + 1);
  });
  let elegido = -1;
  modelo.partes.forEach((s, i) => {
    if (elegido >= 0 || conCluster.has(pj.mallas[i])) return;
    const n = s.pos.length / 3;
    let dentro = 0, soloCabeza = true;
    for (let k = 0; k < n; k++) {
      if (caja.containsPoint(new THREE.Vector3(s.pos[k * 3], s.pos[k * 3 + 1], s.pos[k * 3 + 2]))) dentro++;
      for (let j = 0; j < 4; j++) if (s.peso[k * 4 + j] > 0 && s.hueso[k * 4 + j] !== 11) soloCabeza = false;
    }
    if (soloCabeza && dentro === n && usos.get(s.textura?.grupo) === 1) elegido = i;
  });
  const mat = pj.mallas[elegido]?.material, base = mat?.map;
  if (!base?.image?.data) return null;
  const {width: w, height: h, data: data} = base.image;
  const original = new Uint8Array(data);
  const tex = new THREE.DataTexture(new Uint8Array(original), w, h, THREE.RGBAFormat);
  tex.colorSpace = base.colorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.flipY = base.flipY;
  tex.magFilter = base.magFilter;
  tex.minFilter = base.minFilter;
  tex.anisotropy = base.anisotropy;
  tex.generateMipmaps = true;
  let dibujado = -1;
  return {
    parte: elegido,
    grupo: modelo.partes[elegido].textura?.grupo,
    poner(po) {
      const a = Math.round(Math.max(0, Math.min(1, po || 0)) * 20) / 20;
      if (a === dibujado) return;
      dibujado = a;
      if (a <= 0) {
        if (mat.map !== base) {
          mat.map = base;
          mat.needsUpdate = true;
        }
        return;
      }
      const d = tex.image.data, nub = a * CO.NUBLADO, roj = a * CO.ROJO;
      for (let i = 0; i < d.length; i += 4) {
        const r = original[i], g = original[i + 1], b = original[i + 2];
        const L = .299 * r + .587 * g + .114 * b, oscuro = 1 - L / 255;
        let R = r + (L - r) * nub, G = g + (L - g) * nub, B = b + (L - b) * nub;
        const k = nub * oscuro * .85;
        R += (CO.LECHE[0] - R) * k;
        G += (CO.LECHE[1] - G) * k;
        B += (CO.LECHE[2] - B) * k;
        const kr = roj * (1 - oscuro) * (1 - oscuro);
        R += (205 - R) * kr * .5;
        G -= G * kr * .3;
        B -= B * kr * .3;
        d[i] = R;
        d[i + 1] = G;
        d[i + 2] = B;
      }
      tex.needsUpdate = true;
      if (mat.map !== tex) {
        mat.map = tex;
        mat.needsUpdate = true;
      }
    },
    dispose() {
      if (mat.map === tex) {
        mat.map = base;
        mat.needsUpdate = true;
      }
      tex.dispose();
    }
  };
}
