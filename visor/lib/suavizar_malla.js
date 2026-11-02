// SH4 web — FeniXVOID · Project Ravenlight
import * as THREE from "three";

const q = typeof location !== "undefined" ? new URLSearchParams(location.search) : new URLSearchParams;

const FORZADO = q.has("redondear") ? q.get("redondear") !== "0" : null;

const DIVISIONES = Math.min(4, Math.max(2, +q.get("redondeo") || 2));

const ORIENTAR = !q.has("sinorientar");

const UMBRAL_SOLDAR = .35;

const UMBRAL_PLIEGUE = .995;

const claveP = (p, i) => Math.round(p[i * 3] * 4) + "," + Math.round(p[i * 3 + 1] * 4) + "," + Math.round(p[i * 3 + 2] * 4);

function claveH(si, sw, i) {
  const l = [];
  for (let k = 0; k < 4; k++) if (sw[i * 4 + k] > 1e-4) l.push(si[i * 4 + k]);
  return l.sort((a, b) => a - b).join("/");
}

const norm3 = v => {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  v[0] /= l;
  v[1] /= l;
  v[2] /= l;
  return v;
};

const mzB = new Int32Array(12), mzW = new Float64Array(12);

function mezclarPesos(lista, outI, outW, o) {
  let n = 0;
  for (const [si, sw, ii, f] of lista) for (let k = 0; k < 4; k++) {
    const w = sw[ii * 4 + k] * f;
    if (w <= 0) continue;
    const b = si[ii * 4 + k];
    let j = 0;
    while (j < n && mzB[j] !== b) j++;
    if (j === n) {
      mzB[n] = b;
      mzW[n++] = w;
    } else mzW[j] += w;
  }
  for (let i = 1; i < n; i++) for (let j = i; j > 0 && (mzW[j] > mzW[j - 1] || mzW[j] === mzW[j - 1] && mzB[j] < mzB[j - 1]); j--) {
    const tb = mzB[j];
    mzB[j] = mzB[j - 1];
    mzB[j - 1] = tb;
    const tw = mzW[j];
    mzW[j] = mzW[j - 1];
    mzW[j - 1] = tw;
  }
  const m = Math.min(4, n);
  let suma = 0;
  for (let k = 0; k < m; k++) suma += mzW[k];
  for (let k = 0; k < 4; k++) {
    outI[o * 4 + k] = k < m ? mzB[k] : 0;
    outW[o * 4 + k] = k < m ? mzW[k] / (suma || 1) : k === 0 && !m ? 1 : 0;
  }
}

function control(P1, N1, P2, N2, recta, out) {
  const dx = P2[0] - P1[0], dy = P2[1] - P1[1], dz = P2[2] - P1[2];
  const w12 = recta ? 0 : dx * N1[0] + dy * N1[1] + dz * N1[2];
  const w21 = recta ? 0 : -(dx * N2[0] + dy * N2[1] + dz * N2[2]);
  for (let c = 0; c < 3; c++) {
    out[c] = (2 * P1[c] + P2[c] - w12 * N1[c]) / 3;
    out[3 + c] = (2 * P2[c] + P1[c] - w21 * N2[c]) / 3;
  }
  return out;
}

function normalMedia(P1, N1, P2, N2, recta, out) {
  const d = [ P2[0] - P1[0], P2[1] - P1[1], P2[2] - P1[2] ];
  let s = [ N1[0] + N2[0], N1[1] + N2[1], N1[2] + N2[2] ];
  if (N1[0] * N2[0] + N1[1] * N2[1] + N1[2] * N2[2] < 0) s = [ N1[0] - N2[0], N1[1] - N2[1], N1[2] - N2[2] ];
  const dd = d[0] * d[0] + d[1] * d[1] + d[2] * d[2];
  const v = recta || dd < 1e-12 ? 0 : 2 * (d[0] * s[0] + d[1] * s[1] + d[2] * s[2]) / dd;
  out[0] = s[0] - v * d[0];
  out[1] = s[1] - v * d[1];
  out[2] = s[2] - v * d[2];
  return norm3(out);
}

const v3 = (a, i) => [ a[i * 3], a[i * 3 + 1], a[i * 3 + 2] ];

export function suavizarGeometrias(geos, {divisiones: divisiones = DIVISIONES} = {}) {
  const K = Math.max(2, divisiones | 0);
  const P = geos.map(g => {
    const pos = g.attributes.position.array, n = pos.length / 3;
    const nor = g.attributes.normal ? g.attributes.normal.array : new Float32Array(n * 3);
    const si = g.attributes.skinIndex.array, sw = g.attributes.skinWeight.array;
    const idx = g.index ? g.index.array : Uint32Array.from({
      length: n
    }, (_, i) => i);
    const kp = new Array(n), kv = new Array(n);
    for (let i = 0; i < n; i++) {
      kp[i] = claveP(pos, i);
      kv[i] = kp[i] + "#" + claveH(si, sw, i);
    }
    return {
      g: g,
      pos: pos,
      nor: nor,
      si: si,
      sw: sw,
      idx: idx,
      n: n,
      kp: kp,
      kv: kv,
      np: new Float32Array(n * 3)
    };
  });
  const grupos = new Map;
  P.forEach((p, ip) => {
    for (let i = 0; i < p.n; i++) {
      let l = grupos.get(p.kv[i]);
      if (!l) grupos.set(p.kv[i], l = []);
      l.push(ip, i);
    }
  });
  for (const l of grupos.values()) for (let a = 0; a < l.length; a += 2) {
    const na = P[l[a]].nor, ia = l[a + 1] * 3;
    let x = 0, y = 0, z = 0;
    for (let b = 0; b < l.length; b += 2) {
      const nb = P[l[b]].nor, ib = l[b + 1] * 3;
      if (l.length > 2 && na[ia] * nb[ib] + na[ia + 1] * nb[ib + 1] + na[ia + 2] * nb[ib + 2] < UMBRAL_SOLDAR) continue;
      x += nb[ib];
      y += nb[ib + 1];
      z += nb[ib + 2];
    }
    const L = Math.hypot(x, y, z);
    const np = P[l[a]].np;
    if (L > 1e-9) {
      np[ia] = x / L;
      np[ia + 1] = y / L;
      np[ia + 2] = z / L;
    }
  }
  const pliegues = new Map, refs = new Map;
  for (const [ip, p] of P.entries()) {
    const {idx: idx, kp: kp, kv: kv, np: np} = p;
    for (let t = 0; t < idx.length; t += 3) for (let e = 0; e < 3; e++) {
      let a = idx[t + e], b = idx[t + (e + 1) % 3];
      if (kp[a] === kp[b]) continue;
      const [pa, pb] = kp[a] < kp[b] ? [ a, b ] : [ b, a ], ck = kp[pa] + "|" + kp[pb];
      const r = pliegues.get(ck);
      if (!r) pliegues.set(ck, {
        na: v3(np, pa),
        nb: v3(np, pb),
        duro: false
      }); else if (!r.duro) {
        const da = r.na[0] * np[pa * 3] + r.na[1] * np[pa * 3 + 1] + r.na[2] * np[pa * 3 + 2];
        const db = r.nb[0] * np[pb * 3] + r.nb[1] * np[pb * 3 + 1] + r.nb[2] * np[pb * 3 + 2];
        if (da < UMBRAL_PLIEGUE || db < UMBRAL_PLIEGUE) r.duro = true;
      }
      if (kv[a] > kv[b]) [a, b] = [ b, a ];
      const rk = kv[a] + "|" + kv[b];
      if (!refs.has(rk)) refs.set(rk, {
        ip: ip,
        a: a,
        b: b,
        ck: ck
      });
    }
  }
  const curvas = new Map;
  function curva(rk) {
    let c = curvas.get(rk);
    if (c) return c;
    const r = refs.get(rk), p = P[r.ip], recta = pliegues.get(r.ck).duro;
    const P1 = v3(p.pos, r.a), P2 = v3(p.pos, r.b), N1 = v3(p.np, r.a), N2 = v3(p.np, r.b);
    const cp = control(P1, N1, P2, N2, recta, new Array(6));
    const n = K - 1, pos = new Float32Array(n * 3), si = new Uint16Array(n * 4), sw = new Float32Array(n * 4);
    for (let j = 1; j <= n; j++) {
      const t = j / K, s = 1 - t, A = s * s * s, B = 3 * s * s * t, C = 3 * s * t * t, D = t * t * t;
      for (let k = 0; k < 3; k++) pos[(j - 1) * 3 + k] = A * P1[k] + B * cp[k] + C * cp[3 + k] + D * P2[k];
      mezclarPesos([ [ p.si, p.sw, r.a, s ], [ p.si, p.sw, r.b, t ] ], si, sw, j - 1);
    }
    c = {
      pos: pos,
      si: si,
      sw: sw,
      recta: recta,
      P1: P1,
      P2: P2
    };
    curvas.set(rk, c);
    return c;
  }
  return P.map(p => {
    const g = p.g, nTri = p.idx.length / 3;
    const otros = Object.keys(g.attributes).filter(k => ![ "position", "normal", "skinIndex", "skinWeight" ].includes(k));
    const nInt = (K - 1) * (K - 2) / 2;
    const cap = p.n + nTri * 3 * (K - 1) + nTri * nInt;
    const pos = new Float32Array(cap * 3), nor = new Float32Array(cap * 3), si = new Uint16Array(cap * 4), sw = new Float32Array(cap * 4);
    const ot = otros.map(k => {
      const at = g.attributes[k];
      return {
        k: k,
        at: at,
        n: at.itemSize,
        a: new at.array.constructor(cap * at.itemSize)
      };
    });
    pos.set(p.pos);
    nor.set(p.nor);
    si.set(p.si);
    sw.set(p.sw);
    for (const o of ot) o.a.set(o.at.array.subarray(0, p.n * o.n));
    let nv = p.n;
    const tris = [];
    const locales = new Map;
    const tmpN = [ 0, 0, 0 ];
    function puntosArista(a, b) {
      const lk = a < b ? a * 65536 + b : b * 65536 + a;
      let l = locales.get(lk);
      if (!l) {
        const lo = Math.min(a, b), hi = Math.max(a, b);
        l = new Array(K - 1);
        if (p.kp[lo] === p.kp[hi]) {
          for (let j = 1; j < K; j++) l[j - 1] = nuevoLineal([ [ lo, 1 - j / K ], [ hi, j / K ] ]);
        } else {
          let [r1, r2] = p.kv[lo] <= p.kv[hi] ? [ lo, hi ] : [ hi, lo ];
          const c = curva(p.kv[r1] + "|" + p.kv[r2]);
          const N1 = v3(p.nor, r1), N2 = v3(p.nor, r2), nm = normalMedia(c.P1, N1, c.P2, N2, c.recta, [ 0, 0, 0 ]);
          const orden = new Array(K - 1);
          for (let j = 1; j < K; j++) {
            const t = j / K, s = 1 - t, v = nv++;
            pos.set(c.pos.subarray((j - 1) * 3, j * 3), v * 3);
            si.set(c.si.subarray((j - 1) * 4, j * 4), v * 4);
            sw.set(c.sw.subarray((j - 1) * 4, j * 4), v * 4);
            for (let k = 0; k < 3; k++) tmpN[k] = s * s * N1[k] + 2 * s * t * nm[k] + t * t * N2[k];
            norm3(tmpN);
            nor.set(tmpN, v * 3);
            for (const o of ot) for (let k = 0; k < o.n; k++) o.a[v * o.n + k] = s * o.at.array[r1 * o.n + k] + t * o.at.array[r2 * o.n + k];
            orden[j - 1] = v;
          }
          for (let j = 0; j < K - 1; j++) l[j] = r1 === lo ? orden[j] : orden[K - 2 - j];
        }
        locales.set(lk, l);
      }
      return a < b ? l : [ ...l ].reverse();
    }
    function nuevoLineal(lista) {
      const v = nv++;
      tmpN[0] = tmpN[1] = tmpN[2] = 0;
      for (const [i, f] of lista) for (let k = 0; k < 3; k++) {
        pos[v * 3 + k] += f * p.pos[i * 3 + k];
        tmpN[k] += f * p.nor[i * 3 + k];
      }
      norm3(tmpN);
      nor.set(tmpN, v * 3);
      mezclarPesos(lista.map(([i, f]) => [ p.si, p.sw, i, f ]), si, sw, v);
      for (const o of ot) for (let k = 0; k < o.n; k++) {
        let x = 0;
        for (const [i, f] of lista) x += f * o.at.array[i * o.n + k];
        o.a[v * o.n + k] = x;
      }
      return v;
    }
    const cpA = new Array(6), cpB = new Array(6), cpC = new Array(6);
    for (let t = 0; t < p.idx.length; t += 3) {
      const V = [ p.idx[t], p.idx[t + 1], p.idx[t + 2] ];
      if (ORIENTAR) {
        const a = V[0] * 3, b = V[1] * 3, c = V[2] * 3, ps = p.pos, ns = p.nor;
        const ux = ps[b] - ps[a], uy = ps[b + 1] - ps[a + 1], uz = ps[b + 2] - ps[a + 2], wx = ps[c] - ps[a], wy = ps[c + 1] - ps[a + 1], wz = ps[c + 2] - ps[a + 2];
        const gx = uy * wz - uz * wy, gy = uz * wx - ux * wz, gz = ux * wy - uy * wx;
        if (gx * (ns[a] + ns[b] + ns[c]) + gy * (ns[a + 1] + ns[b + 1] + ns[c + 1]) + gz * (ns[a + 2] + ns[b + 2] + ns[c + 2]) < 0) [V[1], V[2]] = [ V[2], V[1] ];
      }
      const E01 = puntosArista(V[0], V[1]), E12 = puntosArista(V[1], V[2]), E20 = puntosArista(V[2], V[0]);
      const interior = new Map;
      if (K > 2) {
        const Pp = V.map(i => v3(p.pos, i)), Np = V.map(i => v3(p.np, i)), Ns = V.map(i => v3(p.nor, i));
        const duro = (i, j) => {
          const x = p.kp[V[i]], y = p.kp[V[j]];
          return x === y || pliegues.get(x < y ? x + "|" + y : y + "|" + x)?.duro;
        };
        control(Pp[0], Np[0], Pp[1], Np[1], duro(0, 1), cpA);
        control(Pp[1], Np[1], Pp[2], Np[2], duro(1, 2), cpB);
        control(Pp[2], Np[2], Pp[0], Np[0], duro(2, 0), cpC);
        const b111 = [ 0, 0, 0 ];
        for (let k = 0; k < 3; k++) {
          const E = (cpA[k] + cpA[3 + k] + cpB[k] + cpB[3 + k] + cpC[k] + cpC[3 + k]) / 6, M = (Pp[0][k] + Pp[1][k] + Pp[2][k]) / 3;
          b111[k] = E + (E - M) / 2;
        }
        const n01 = normalMedia(Pp[0], Ns[0], Pp[1], Ns[1], duro(0, 1), [ 0, 0, 0 ]), n12 = normalMedia(Pp[1], Ns[1], Pp[2], Ns[2], duro(1, 2), [ 0, 0, 0 ]), n20 = normalMedia(Pp[2], Ns[2], Pp[0], Ns[0], duro(2, 0), [ 0, 0, 0 ]);
        for (let c = 1; c < K; c++) for (let b = 1; b + c < K; b++) {
          const a = K - b - c, u = a / K, vv = b / K, w = c / K, v = nv++;
          for (let k = 0; k < 3; k++) {
            pos[v * 3 + k] = Pp[0][k] * u * u * u + Pp[1][k] * vv * vv * vv + Pp[2][k] * w * w * w + 3 * (cpA[k] * u * u * vv + cpA[3 + k] * u * vv * vv + cpB[k] * vv * vv * w + cpB[3 + k] * vv * w * w + cpC[k] * w * w * u + cpC[3 + k] * w * u * u) + 6 * b111[k] * u * vv * w;
            tmpN[k] = Ns[0][k] * u * u + Ns[1][k] * vv * vv + Ns[2][k] * w * w + 2 * (n01[k] * u * vv + n12[k] * vv * w + n20[k] * w * u);
          }
          norm3(tmpN);
          nor.set(tmpN, v * 3);
          mezclarPesos([ [ p.si, p.sw, V[0], u ], [ p.si, p.sw, V[1], vv ], [ p.si, p.sw, V[2], w ] ], si, sw, v);
          for (const o of ot) for (let k = 0; k < o.n; k++) o.a[v * o.n + k] = u * o.at.array[V[0] * o.n + k] + vv * o.at.array[V[1] * o.n + k] + w * o.at.array[V[2] * o.n + k];
          interior.set(b * 64 + c, v);
        }
      }
      const pt = (a, b, c) => {
        if (b === 0 && c === 0) return V[0];
        if (a === 0 && c === 0) return V[1];
        if (a === 0 && b === 0) return V[2];
        if (c === 0) return E01[b - 1];
        if (a === 0) return E12[c - 1];
        if (b === 0) return E20[a - 1];
        return interior.get(b * 64 + c);
      };
      for (let c = 0; c < K; c++) for (let b = 0; b < K - c; b++) {
        const a = K - b - c;
        tris.push(pt(a, b, c), pt(a - 1, b + 1, c), pt(a - 1, b, c + 1));
        if (a >= 2) tris.push(pt(a - 1, b + 1, c), pt(a - 2, b + 1, c + 1), pt(a - 1, b, c + 1));
      }
    }
    const ng = new THREE.BufferGeometry;
    ng.setAttribute("position", new THREE.BufferAttribute(pos.slice(0, nv * 3), 3));
    ng.setAttribute("normal", new THREE.BufferAttribute(nor.slice(0, nv * 3), 3));
    for (const o of ot) ng.setAttribute(o.k, new THREE.BufferAttribute(o.a.slice(0, nv * o.n), o.n, o.at.normalized));
    ng.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(si.slice(0, nv * 4), 4));
    ng.setAttribute("skinWeight", new THREE.Float32BufferAttribute(sw.slice(0, nv * 4), 4));
    ng.setIndex(new THREE.BufferAttribute(nv > 65535 ? Uint32Array.from(tris) : Uint16Array.from(tris), 1));
    ng.userData = {
      ...g.userData,
      redondeada: true
    };
    ng.name = (g.name || "parte") + "_redondeada";
    return ng;
  });
}

const vivos = new Set;

const estado = {
  activo: FORZADO ?? false,
  forzado: FORZADO,
  divisiones: DIVISIONES,
  ultimo: null
};

function ponerEn(pj, si) {
  si = !!si;
  if (si && !pj._redondeo) {
    const t0 = performance.now();
    const originales = pj.mallas.map(m => m.geometry);
    const suaves = suavizarGeometrias(originales, {
      divisiones: estado.divisiones
    });
    const tris = gs => gs.reduce((s, g) => s + (g.index ? g.index.count : g.attributes.position.count) / 3, 0);
    pj._redondeo = {
      originales: originales,
      suaves: suaves,
      ms: +(performance.now() - t0).toFixed(1),
      tris: tris(originales),
      trisRedondeados: tris(suaves),
      partes: originales.length
    };
    estado.ultimo = pj._redondeo;
  }
  if (!pj._redondeo) {
    pj.redondeado = false;
    return false;
  }
  const r = pj._redondeo;
  pj.mallas.forEach((m, i) => {
    const g = si ? r.suaves[i] : r.originales[i];
    if (m.geometry !== g) m.geometry = g;
  });
  pj.redondeado = si;
  return si;
}

function redibujar() {
  try {
    globalThis.sh4?.redibujar?.();
    globalThis.cine?.redibujar?.();
  } catch {}
}

function poner(si = !estado.activo) {
  estado.activo = !!si;
  for (const ref of [ ...vivos ]) {
    const pj = ref.deref();
    if (!pj) {
      vivos.delete(ref);
      continue;
    }
    ponerEn(pj, estado.activo);
  }
  redibujar();
  return info();
}

function info() {
  const l = [ ...vivos ].map(r => r.deref()).filter(Boolean);
  return {
    activo: estado.activo,
    forzado: estado.forzado,
    divisiones: estado.divisiones,
    personajes: l.length,
    armados: l.filter(p => p._redondeo).map(p => ({
      partes: p._redondeo.partes,
      tris: p._redondeo.tris,
      trisRedondeados: p._redondeo.trisRedondeados,
      ms: p._redondeo.ms
    }))
  };
}

function instalarAPI() {
  for (const o of [ globalThis.sh4, globalThis.cine ]) if (o && typeof o === "object" && !o.redondear) o.redondear = poner;
}

export const redondeo = {
  poner: poner,
  info: info,
  get activo() {
    return estado.activo;
  },
  seguirMejorado(si) {
    if (estado.forzado === null && !!si !== estado.activo) poner(si);
    return estado.activo;
  },
  suavizarGeometrias: suavizarGeometrias
};

globalThis.sh4Redondeo = redondeo;

export function registrarRedondeo(pj) {
  const ref = new WeakRef(pj);
  vivos.add(ref);
  pj.redondeado = false;
  pj.redondear = (si = !pj.redondeado) => {
    ponerEn(pj, si);
    redibujar();
    return pj.redondeado;
  };
  const liberar = pj.dispose;
  pj.dispose = function() {
    const r = pj._redondeo;
    if (r) for (const [i, m] of pj.mallas.entries()) (m.geometry === r.suaves[i] ? r.originales[i] : r.suaves[i]).dispose();
    vivos.delete(ref);
    return liberar.call(this);
  };
  if (estado.activo) queueMicrotask(() => {
    if (estado.activo && vivos.has(ref)) {
      ponerEn(pj, true);
      redibujar();
    }
  });
  instalarAPI();
  return pj;
}

if (typeof addEventListener !== "undefined" && typeof document !== "undefined") {
  addEventListener("keydown", e => {
    if (e.code !== "KeyU" || e.ctrlKey || e.altKey || e.metaKey || /^(INPUT|SELECT|TEXTAREA)$/.test(e.target?.tagName || "")) return;
    poner(!estado.activo);
  });
}
