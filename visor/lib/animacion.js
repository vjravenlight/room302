// SH4 web — FeniXVOID · Project Ravenlight
import { partesBin } from "./sh4bin.js";

export const FPS = 30;

export const TIPOS_CLAVE = {
  1: [ "RotQuatLinear", "rot", "f", 4 ],
  2: [ "RotQuatBoehm", "rot", "f", 8 ],
  3: [ "RotQuatSquad", "rot", "f", 12 ],
  4: [ "PositionLinear", "pos", "f", 4 ],
  5: [ "PositionHermite", "pos", "f", 12 ],
  6: [ "PositionBezier", "pos", "f", 12 ],
  7: [ "PositionCardinal", "pos", "f", 8 ],
  8: [ "FloatLinear", "float", "f", 1 ],
  9: [ "FloatCardinal", "float", "f", 2 ],
  10: [ "ScaleLinear", "esc", "f", 4 ],
  11: [ "ScaleCardinal", "esc", "f", 8 ],
  12: [ "FloatVectorStep", "vector", "f", 4 ],
  13: [ "RotQuatS15Linear", "rot", "s15", 4 ],
  14: [ "RotQuatS15Boehm", "rot", "s15", 8 ],
  15: [ "RotQuatS15Squad", "rot", "s15", 12 ],
  16: [ "PositionS4Linear", "pos", "s4", 4 ],
  17: [ "PositionS4Hermite", "pos", "s4", 12 ],
  18: [ "PositionS4Bezier", "pos", "s4", 12 ],
  19: [ "PositionS4Cardinal", "pos", "s4", 8 ],
  20: [ "ScaleS12Linear", "esc", "s12", 4 ],
  21: [ "ScaleS12Cardinal", "esc", "s12", 8 ]
};

const DIVISOR = {
  s15: 32767,
  s4: 16,
  s12: 4096
};

export function animacionesDeBin(buf) {
  return partesBin(buf).filter(p => p.tipo === "animacion");
}

export function leerAnimacion(buf, ofs, len) {
  const dv = new DataView(buf, ofs, len);
  if (dv.getUint32(0, true) !== 4278255617) return null;
  const anim = {
    duracion: dv.getInt16(4, true),
    loop: dv.getInt16(6, true) !== 0,
    conexiones: [],
    ik: [],
    pistas: [],
    relativa: false
  };
  for (let k = 16; k + 4 <= len; k += 4) {
    const o = dv.getUint32(k, true);
    if (!o || o >= len) break;
    const tipo = dv.getUint32(o, true);
    if (tipo === 4278255619) {
      const nC = dv.getInt16(o + 4, true), nIK = dv.getInt16(o + 6, true);
      const oC = o + dv.getInt32(o + 8, true), oIK = o + dv.getInt32(o + 12, true);
      for (let i = 0; i < nC; i++) anim.conexiones.push({
        hueso: dv.getUint8(oC + 2 * i),
        padre: dv.getInt8(oC + 2 * i + 1)
      });
      for (let i = 0; i < nIK; i++) {
        const b = oIK + 4 * i;
        anim.ik.push({
          manija: dv.getUint8(b),
          tipo: dv.getInt8(b + 1),
          inicio: dv.getInt8(b + 2),
          efector: dv.getInt8(b + 3)
        });
      }
    } else if (tipo === 4278255618) {
      anim.relativa = dv.getInt16(o + 6, true) !== 0;
      for (let j = o + 8; j + 4 <= len; j += 4) {
        const ko = dv.getUint32(j, true);
        if (!ko) break;
        const p = leerPista(dv, o + ko);
        if (p) anim.pistas.push(p);
      }
    }
  }
  return anim;
}

function leerPista(dv, b) {
  const tipo = dv.getInt16(b, true), n = dv.getInt16(b + 4, true);
  const def = TIPOS_CLAVE[tipo];
  if (!def || n <= 0) return null;
  const [nombre, clase, fmt, porClave] = def;
  const oT = b + dv.getUint32(b + 8, true), oK = b + dv.getUint32(b + 12, true);
  const tiempos = new Uint16Array(n);
  for (let i = 0; i < n; i++) tiempos[i] = dv.getUint16(oT + 2 * i, true);
  const valores = new Float32Array(n * porClave);
  if (fmt === "f") for (let i = 0; i < n * porClave; i++) valores[i] = dv.getFloat32(oK + 4 * i, true); else {
    const div = DIVISOR[fmt];
    for (let i = 0; i < n * porClave; i++) valores[i] = dv.getInt16(oK + 2 * i, true) / div;
  }
  if (clase === "rot") for (let i = 0; i < n * porClave; i += 4) normalizar(valores, i);
  return {
    tipo: tipo,
    nombre: nombre,
    clase: clase,
    hueso: dv.getInt8(b + 6),
    relativo: dv.getUint8(b + 7),
    tiempos: tiempos,
    valores: valores,
    porClave: porClave
  };
}

function normalizar(a, i) {
  const l = Math.hypot(a[i], a[i + 1], a[i + 2], a[i + 3]) || 1;
  a[i] /= l;
  a[i + 1] /= l;
  a[i + 2] /= l;
  a[i + 3] /= l;
}

function slerp(a, ia, b, ib, u, out, io) {
  let bx = b[ib], by = b[ib + 1], bz = b[ib + 2], bw = b[ib + 3];
  let c = a[ia] * bx + a[ia + 1] * by + a[ia + 2] * bz + a[ia + 3] * bw;
  if (c < 0) {
    c = -c;
    bx = -bx;
    by = -by;
    bz = -bz;
    bw = -bw;
  }
  let k0 = 1 - u, k1 = u;
  if (c < .9995) {
    const th = Math.acos(c), s = Math.sin(th);
    k0 = Math.sin(k0 * th) / s;
    k1 = Math.sin(k1 * th) / s;
  }
  out[io] = a[ia] * k0 + bx * k1;
  out[io + 1] = a[ia + 1] * k0 + by * k1;
  out[io + 2] = a[ia + 2] * k0 + bz * k1;
  out[io + 3] = a[ia + 3] * k0 + bw * k1;
  normalizar(out, io);
}

function qmul(a, ia, b, ib, out, io) {
  const ax = a[ia], ay = a[ia + 1], az = a[ia + 2], aw = a[ia + 3];
  const bx = b[ib], by = b[ib + 1], bz = b[ib + 2], bw = b[ib + 3];
  out[io] = aw * bx + ax * bw + ay * bz - az * by;
  out[io + 1] = aw * by - ax * bz + ay * bw + az * bx;
  out[io + 2] = aw * bz + ax * by - ay * bx + az * bw;
  out[io + 3] = aw * bw - ax * bx - ay * by - az * bz;
}

function qrot(q, iq, x, y, z, out, io) {
  const qx = q[iq], qy = q[iq + 1], qz = q[iq + 2], qw = q[iq + 3];
  const tx = 2 * (qy * z - qz * y), ty = 2 * (qz * x - qx * z), tz = 2 * (qx * y - qy * x);
  out[io] = x + qw * tx + qy * tz - qz * ty;
  out[io + 1] = y + qw * ty + qz * tx - qx * tz;
  out[io + 2] = z + qw * tz + qx * ty - qy * tx;
}

const T4 = new Float32Array(4), T4b = new Float32Array(4), T4c = new Float32Array(4);

function hermite(p0, t0, p1, t1, u) {
  const u2 = u * u, u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * p0 + (u3 - 2 * u2 + u) * t0 + (-2 * u3 + 3 * u2) * p1 + (u3 - u2) * t1;
}

export function muestrearPista(p, t, out, io = 0) {
  const T = p.tiempos, V = p.valores, n = T.length, k = p.porClave;
  let i = 0;
  if (t <= T[0] || n === 1) i = -1; else if (t >= T[n - 1]) i = -2; else {
    let lo = 0, hi = n - 1;
    while (hi - lo > 1) {
      const m = lo + hi >> 1;
      if (T[m] <= t) lo = m; else hi = m;
    }
    i = lo;
  }
  const ancho = p.clase === "float" ? 1 : 4;
  if (i < 0 || p.tipo === 12) {
    let j = i === -1 ? 0 : n - 1;
    if (p.tipo === 12 && i >= 0) j = i;
    for (let c = 0; c < ancho; c++) out[io + c] = V[j * k + c];
    return out;
  }
  const a = i * k, b = (i + 1) * k, u = (t - T[i]) / (T[i + 1] - T[i]);
  switch (p.tipo) {
   case 1:
   case 13:
   case 2:
   case 14:
    slerp(V, a, V, b, u, out, io);
    break;

   case 3:
   case 15:
    {
      slerp(V, a, V, b, u, T4, 0);
      slerp(V, a + 8, V, b + 4, u, T4b, 0);
      slerp(T4, 0, T4b, 0, 2 * u * (1 - u), out, io);
      break;
    }

   case 5:
   case 17:
    for (let c = 0; c < 4; c++) out[io + c] = hermite(V[a + c], V[a + 8 + c], V[b + c], V[b + 4 + c], u);
    break;

   case 6:
   case 18:
    {
      const s = 1 - u;
      for (let c = 0; c < 4; c++) out[io + c] = s * s * s * V[a + c] + 3 * s * s * u * V[a + 8 + c] + 3 * s * u * u * V[b + 4 + c] + u * u * u * V[b + c];
      break;
    }

   case 7:
   case 11:
   case 19:
   case 21:
    for (let c = 0; c < 4; c++) out[io + c] = hermite(V[a + c], V[a + 4 + c], V[b + c], V[b + 4 + c], u);
    break;

   case 9:
    out[io] = hermite(V[a], V[a + 1], V[b], V[b + 1], u);
    break;

   case 8:
    out[io] = V[a] + (V[b] - V[a]) * u;
    break;

   default:
    for (let c = 0; c < 4; c++) out[io + c] = V[a + c] + (V[b + c] - V[a + c]) * u;
  }
  return out;
}

export function crearEsqueleto(modelo) {
  const n = modelo.huesos.length;
  const padres = Int16Array.from(modelo.huesos, h => h.padre);
  const absRot = new Float32Array(n * 4), absPos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const m = modelo.huesos[i].matriz;
    matAQuat(m[0], m[4], m[8], m[1], m[5], m[9], m[2], m[6], m[10], absRot, i * 4);
    absPos[i * 3] = m[12];
    absPos[i * 3 + 1] = m[13];
    absPos[i * 3 + 2] = m[14];
  }
  const rot = new Float32Array(n * 4), pos = new Float32Array(n * 3), inv = new Float32Array(4), d = new Float32Array(3);
  for (let i = 0; i < n; i++) {
    const p = padres[i];
    if (p < 0) {
      rot.set(absRot.subarray(i * 4, i * 4 + 4), i * 4);
      pos.set(absPos.subarray(i * 3, i * 3 + 3), i * 3);
      continue;
    }
    inv[0] = -absRot[p * 4];
    inv[1] = -absRot[p * 4 + 1];
    inv[2] = -absRot[p * 4 + 2];
    inv[3] = absRot[p * 4 + 3];
    qmul(inv, 0, absRot, i * 4, rot, i * 4);
    qrot(inv, 0, absPos[i * 3] - absPos[p * 3], absPos[i * 3 + 1] - absPos[p * 3 + 1], absPos[i * 3 + 2] - absPos[p * 3 + 2], d, 0);
    pos.set(d, i * 3);
  }
  return {
    n: n,
    padres: padres,
    bindRot: rot,
    bindPos: pos,
    bindAbsRot: absRot,
    bindAbsPos: absPos
  };
}

function matAQuat(m00, m01, m02, m10, m11, m12, m20, m21, m22, out, o) {
  const tr = m00 + m11 + m22;
  let x, y, z, w;
  if (tr > 0) {
    const s = .5 / Math.sqrt(tr + 1);
    w = .25 / s;
    x = (m21 - m12) * s;
    y = (m02 - m20) * s;
    z = (m10 - m01) * s;
  } else if (m00 > m11 && m00 > m22) {
    const s = 2 * Math.sqrt(1 + m00 - m11 - m22);
    w = (m21 - m12) / s;
    x = .25 * s;
    y = (m01 + m10) / s;
    z = (m02 + m20) / s;
  } else if (m11 > m22) {
    const s = 2 * Math.sqrt(1 + m11 - m00 - m22);
    w = (m02 - m20) / s;
    x = (m01 + m10) / s;
    y = .25 * s;
    z = (m12 + m21) / s;
  } else {
    const s = 2 * Math.sqrt(1 + m22 - m00 - m11);
    w = (m10 - m01) / s;
    x = (m02 + m20) / s;
    y = (m12 + m21) / s;
    z = .25 * s;
  }
  out[o] = x;
  out[o + 1] = y;
  out[o + 2] = z;
  out[o + 3] = w;
  normalizar(out, o);
}

export function crearPose(esq) {
  const n = esq.n;
  return {
    rot: new Float32Array(n * 4),
    pos: new Float32Array(n * 3),
    esc: new Float32Array(n * 3),
    absRot: new Float32Array(n * 4),
    absPos: new Float32Array(n * 3),
    matrices: new Float32Array(n * 16),
    padres: Int16Array.from(esq.padres),
    orden: null,
    floats: new Map,
    vectores: new Map
  };
}

export function evaluar(esq, anim, t, pose, opciones = {}) {
  const n = esq.n, usarIK = opciones.ik !== false;
  pose.rot.set(esq.bindRot);
  pose.pos.set(esq.bindPos);
  pose.esc.fill(1);
  pose.padres.set(esq.padres);
  if (anim) {
    for (const c of anim.conexiones) if (c.hueso < n) pose.padres[c.hueso] = c.padre;
    const dur = Math.max(1, anim.duracion);
    const enLoop = opciones.loop ?? anim.loop;
    t = enLoop ? (t % dur + dur) % dur : Math.min(Math.max(t, 0), dur);
    for (const p of anim.pistas) {
      const h = p.hueso;
      if (p.clase === "rot" && h >= 0 && h < n) muestrearPista(p, t, pose.rot, h * 4); else if (p.clase === "pos" && h >= 0 && h < n) {
        muestrearPista(p, t, T4c, 0);
        pose.pos[h * 3] = T4c[0];
        pose.pos[h * 3 + 1] = T4c[1];
        pose.pos[h * 3 + 2] = T4c[2];
      } else if (p.clase === "esc" && h >= 0 && h < n) {
        muestrearPista(p, t, T4c, 0);
        pose.esc[h * 3] = T4c[0];
        pose.esc[h * 3 + 1] = T4c[1];
        pose.esc[h * 3 + 2] = T4c[2];
      } else if (p.clase === "float") pose.floats.set(h, muestrearPista(p, t, new Float32Array(1), 0)[0]); else if (p.clase === "vector") pose.vectores.set(h, muestrearPista(p, t, new Float32Array(4), 0));
    }
    if (opciones.enElLugar) {
      const r = raizDe(pose.padres);
      if (r >= 0) {
        pose.pos[r * 3] = esq.bindPos[r * 3];
        pose.pos[r * 3 + 2] = esq.bindPos[r * 3 + 2];
      }
    }
  }
  pose.orden = ordenTopologico(pose.padres, pose.orden);
  cinematica(pose);
  if (anim && usarIK) for (const c of anim.ik) if (c.tipo === 1) resolverIK2(pose, c);
  aMatrices(pose);
  return pose;
}

export function reiniciarPose(esq, pose) {
  pose.rot.set(esq.bindRot);
  pose.pos.set(esq.bindPos);
  pose.esc.fill(1);
  pose.padres.set(esq.padres);
  pose.floats.clear();
  pose.vectores.clear();
  return pose;
}

export function componer(esq, pose, {rotAbsolutas: rotAbsolutas = false, ik: ik = null} = {}) {
  pose.orden = ordenTopologico(pose.padres, pose.orden);
  if (rotAbsolutas) {
    const {pos: pos, absRot: absRot, absPos: absPos, padres: padres, orden: orden} = pose;
    for (let k = 0; k < orden.length; k++) {
      const i = orden[k], p = padres[i];
      if (p < 0) {
        absPos[i * 3] = pos[i * 3];
        absPos[i * 3 + 1] = pos[i * 3 + 1];
        absPos[i * 3 + 2] = pos[i * 3 + 2];
        continue;
      }
      qrot(absRot, p * 4, pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2], absPos, i * 3);
      absPos[i * 3] += absPos[p * 3];
      absPos[i * 3 + 1] += absPos[p * 3 + 1];
      absPos[i * 3 + 2] += absPos[p * 3 + 2];
    }
    for (let k = 0; k < orden.length; k++) {
      const i = orden[k], p = padres[i];
      if (p < 0) pose.rot.set(absRot.subarray(i * 4, i * 4 + 4), i * 4); else {
        conj(absRot, p * 4, QI);
        qmul(QI, 0, absRot, i * 4, pose.rot, i * 4);
      }
    }
  } else cinematica(pose);
  if (ik) for (const c of ik) if (c.tipo === 1) resolverIK2(pose, c);
  aMatrices(pose);
  return pose;
}

function raizDe(padres) {
  for (let i = 0; i < padres.length; i++) if (padres[i] < 0) return i;
  return -1;
}

function ordenTopologico(padres, previo) {
  const n = padres.length, orden = previo && previo.length === n ? previo : new Int16Array(n);
  const hecho = new Uint8Array(n);
  let k = 0;
  const visitar = (i, prof) => {
    if (hecho[i] || prof > n) return;
    const p = padres[i];
    if (p >= 0 && p < n && p !== i) visitar(p, prof + 1);
    if (!hecho[i]) {
      hecho[i] = 1;
      orden[k++] = i;
    }
  };
  for (let i = 0; i < n; i++) visitar(i, 0);
  return orden;
}

function cinematica(pose, desde = null) {
  const {rot: rot, pos: pos, absRot: absRot, absPos: absPos, padres: padres, orden: orden} = pose;
  for (let k = 0; k < orden.length; k++) {
    const i = orden[k], p = padres[i];
    if (desde && !desde[i]) continue;
    if (p < 0 || p >= padres.length) {
      absRot.set(rot.subarray(i * 4, i * 4 + 4), i * 4);
      absPos[i * 3] = pos[i * 3];
      absPos[i * 3 + 1] = pos[i * 3 + 1];
      absPos[i * 3 + 2] = pos[i * 3 + 2];
    } else {
      qmul(absRot, p * 4, rot, i * 4, absRot, i * 4);
      qrot(absRot, p * 4, pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2], absPos, i * 3);
      absPos[i * 3] += absPos[p * 3];
      absPos[i * 3 + 1] += absPos[p * 3 + 1];
      absPos[i * 3 + 2] += absPos[p * 3 + 2];
    }
  }
}

const V1 = new Float32Array(3), V2 = new Float32Array(3), VE = new Float32Array(3), Q = new Float32Array(4), QI = new Float32Array(4);

function resolverIK2(pose, cadena) {
  const {absRot: absRot, absPos: absPos, rot: rot, padres: padres} = pose;
  const s = cadena.inicio, e = cadena.efector, h = cadena.manija, n = padres.length;
  if (s < 0 || e < 0 || h >= n || e >= n || s >= n) return;
  const m = padres[e];
  if (m < 0 || padres[m] !== s) return;
  const P = (i, c) => absPos[i * 3 + c];
  const sm = [ P(m, 0) - P(s, 0), P(m, 1) - P(s, 1), P(m, 2) - P(s, 2) ];
  const me = [ P(e, 0) - P(m, 0), P(e, 1) - P(m, 1), P(e, 2) - P(m, 2) ];
  const l1 = Math.hypot(...sm), l2 = Math.hypot(...me);
  if (l1 < 1e-4 || l2 < 1e-4) return;
  const g = [ P(h, 0) - P(s, 0), P(h, 1) - P(s, 1), P(h, 2) - P(s, 2) ];
  let d = Math.hypot(...g);
  d = Math.min(Math.max(d, Math.abs(l1 - l2) + .001), l1 + l2 - .001);
  const ms = [ -sm[0], -sm[1], -sm[2] ];
  const cosAct = (ms[0] * me[0] + ms[1] * me[1] + ms[2] * me[2]) / (l1 * l2);
  const act = Math.acos(Math.min(1, Math.max(-1, cosAct)));
  const des = Math.acos(Math.min(1, Math.max(-1, (l1 * l1 + l2 * l2 - d * d) / (2 * l1 * l2))));
  let ax = [ ms[1] * me[2] - ms[2] * me[1], ms[2] * me[0] - ms[0] * me[2], ms[0] * me[1] - ms[1] * me[0] ];
  let la = Math.hypot(...ax);
  if (la < 1e-6) {
    qrot(absRot, m * 4, 1, 0, 0, V1, 0);
    ax = [ V1[0], V1[1], V1[2] ];
    la = Math.hypot(...ax);
  }
  ejeAngulo(ax[0] / la, ax[1] / la, ax[2] / la, des - act, Q);
  qmul(Q, 0, absRot, m * 4, absRot, m * 4);
  qrot(Q, 0, me[0], me[1], me[2], VE, 0);
  V1[0] = sm[0] + VE[0];
  V1[1] = sm[1] + VE[1];
  V1[2] = sm[2] + VE[2];
  desdeVectores(V1, g, Q);
  qmul(Q, 0, absRot, s * 4, absRot, s * 4);
  qmul(Q, 0, absRot, m * 4, absRot, m * 4);
  const ps = padres[s];
  if (ps >= 0) {
    conj(absRot, ps * 4, QI);
    qmul(QI, 0, absRot, s * 4, rot, s * 4);
  } else rot.set(absRot.subarray(s * 4, s * 4 + 4), s * 4);
  conj(absRot, s * 4, QI);
  qmul(QI, 0, absRot, m * 4, rot, m * 4);
  const desde = new Uint8Array(n);
  for (let k = 0; k < pose.orden.length; k++) {
    const i = pose.orden[k];
    if (i === s || padres[i] >= 0 && desde[padres[i]]) desde[i] = 1;
  }
  cinematica(pose, desde);
}

function conj(a, ia, out) {
  out[0] = -a[ia];
  out[1] = -a[ia + 1];
  out[2] = -a[ia + 2];
  out[3] = a[ia + 3];
}

function ejeAngulo(x, y, z, ang, out) {
  const s = Math.sin(ang / 2);
  out[0] = x * s;
  out[1] = y * s;
  out[2] = z * s;
  out[3] = Math.cos(ang / 2);
}

function desdeVectores(a, b, out) {
  const la = Math.hypot(a[0], a[1], a[2]), lb = Math.hypot(b[0], b[1], b[2]);
  if (la < 1e-6 || lb < 1e-6) {
    out[0] = out[1] = out[2] = 0;
    out[3] = 1;
    return;
  }
  const ax = a[0] / la, ay = a[1] / la, az = a[2] / la, bx = b[0] / lb, by = b[1] / lb, bz = b[2] / lb;
  const r = ax * bx + ay * by + az * bz + 1;
  if (r < 1e-6) {
    out[0] = -az;
    out[1] = 0;
    out[2] = ax;
    out[3] = 0;
    if (Math.abs(ax) < 1e-6 && Math.abs(az) < 1e-6) {
      out[0] = 1;
    }
    normalizar(out, 0);
    return;
  }
  out[0] = ay * bz - az * by;
  out[1] = az * bx - ax * bz;
  out[2] = ax * by - ay * bx;
  out[3] = r;
  normalizar(out, 0);
}

function aMatrices(pose) {
  const {absRot: absRot, absPos: absPos, esc: esc, matrices: matrices} = pose;
  for (let i = 0; i < absPos.length / 3; i++) {
    const x = absRot[i * 4], y = absRot[i * 4 + 1], z = absRot[i * 4 + 2], w = absRot[i * 4 + 3];
    const sx = esc[i * 3], sy = esc[i * 3 + 1], sz = esc[i * 3 + 2], o = i * 16;
    matrices[o] = (1 - 2 * (y * y + z * z)) * sx;
    matrices[o + 1] = 2 * (x * y + z * w) * sx;
    matrices[o + 2] = 2 * (x * z - y * w) * sx;
    matrices[o + 3] = 0;
    matrices[o + 4] = 2 * (x * y - z * w) * sy;
    matrices[o + 5] = (1 - 2 * (x * x + z * z)) * sy;
    matrices[o + 6] = 2 * (y * z + x * w) * sy;
    matrices[o + 7] = 0;
    matrices[o + 8] = 2 * (x * z + y * w) * sz;
    matrices[o + 9] = 2 * (y * z - x * w) * sz;
    matrices[o + 10] = (1 - 2 * (x * x + y * y)) * sz;
    matrices[o + 11] = 0;
    matrices[o + 12] = absPos[i * 3];
    matrices[o + 13] = absPos[i * 3 + 1];
    matrices[o + 14] = absPos[i * 3 + 2];
    matrices[o + 15] = 1;
  }
}

export class Reproductor {
  constructor(esq) {
    this.esq = esq;
    this.pose = crearPose(esq);
    this.anim = null;
    this.t = 0;
    this.velocidad = 1;
    this.pausa = false;
    this.loop = null;
    this.ik = true;
    this.enElLugar = false;
  }
  poner(anim, desde = 0) {
    this.anim = anim;
    this.t = desde;
    return this;
  }
  avanzar(dt) {
    if (this.anim && !this.pausa) {
      this.t += dt * FPS * this.velocidad;
      const loop = this.loop ?? this.anim.loop;
      if (!loop && this.t > this.anim.duracion) this.t = this.anim.duracion;
    }
    return evaluar(this.esq, this.anim, this.t, this.pose, {
      ik: this.ik,
      enElLugar: this.enElLugar,
      loop: this.loop ?? undefined
    });
  }
  get terminada() {
    return !!this.anim && !(this.loop ?? this.anim.loop) && this.t >= this.anim.duracion;
  }
}
