// SH4 web — FeniXVOID · Project Ravenlight
export const FPS = 30;

export const TIPOS = {
  1: "rot_hueso",
  4: "pos_hueso",
  8: "cluster",
  10: "escala_hueso",
  12: "tex_anim",
  13: "rot_hueso_s15",
  128: "rot_camara",
  129: "pos_camara",
  130: "float_camara",
  131: "rot_luz",
  132: "pos_luz",
  133: "color_luz",
  134: "tipo_luz",
  135: "float_luz",
  136: "short_camara"
};

export function esSqt(buf, ofs = 0, len = buf.byteLength - ofs) {
  return len >= 48 && new DataView(buf, ofs, 4).getUint16(0, true) === 56880;
}

export function leerSqt(buf, ofs = 0, len = buf.byteLength - ofs) {
  const dv = new DataView(buf, ofs, len);
  if (dv.getUint16(0, true) !== 56880) throw new Error("no es una cinemática SQT");
  const version = dv.getInt16(2, true), ini = dv.getInt16(4, true), fin = dv.getInt16(6, true);
  const nch = dv.getInt32(8, true), och = dv.getInt32(12, true), tam = dv.getInt32(16, true), ofr = dv.getInt32(20, true);
  const trans = [ 0, 1, 2, 3 ].map(i => dv.getFloat32(32 + 4 * i, true));
  const n = Math.floor((len - ofr) / tam);
  const personajes = [];
  for (let k = 0; k < nch; k++) {
    const r = och + 8 * k;
    const id = dv.getInt16(r, true), enCuadro = dv.getInt16(r + 2, true), nk = dv.getInt16(r + 4, true), ok = dv.getInt16(r + 6, true);
    const clase = id === 100 ? "camara" : id < 300 ? "luz" : "modelo";
    const claves = [];
    for (let j = 0; j < nk; j++) {
      const c = r + ok + 8 * j;
      let tipo = dv.getUint16(c, true);
      if (version === 0 && clase !== "modelo" && tipo >= 13 && tipo <= 21) tipo += 115;
      claves.push({
        tipo: tipo,
        nombre: TIPOS[tipo] || "tipo_" + tipo.toString(16),
        map: dv.getInt16(c + 2, true),
        ofs: dv.getInt16(c + 4, true)
      });
    }
    const p = {
      id: id,
      clase: clase,
      enCuadro: enCuadro,
      claves: claves
    };
    if (clase === "modelo") {
      p.rot = claves.filter(c => c.tipo === 1 || c.tipo === 13);
      p.pos = claves.filter(c => c.tipo === 4);
      p.escala = claves.filter(c => c.tipo === 10);
      p.clusters = claves.filter(c => c.tipo === 8);
      p.texAnim = claves.filter(c => c.tipo === 12);
      p.nHuesos = Math.max(0, ...p.rot.map(c => c.map + 1), ...p.pos.map(c => c.map + 1));
    }
    personajes.push(p);
  }
  const sqt = {
    dv: dv,
    version: version,
    ini: ini,
    fin: fin,
    n: n,
    tam: tam,
    ofr: ofr,
    trans: trans,
    personajes: personajes
  };
  sqt.camara = personajes.find(p => p.clase === "camara") || null;
  sqt.luces = personajes.filter(p => p.clase === "luz");
  sqt.modelos = personajes.filter(p => p.clase === "modelo");
  return sqt;
}

export const numeroCuadro = (sqt, i) => sqt.dv.getInt16(sqt.ofr + i * sqt.tam + 2, true);

const f32 = (dv, o) => dv.getFloat32(o, true);

function vec(dv, o, n, out, io = 0) {
  for (let i = 0; i < n; i++) out[io + i] = dv.getFloat32(o + 4 * i, true);
  return out;
}

function quatS15(dv, o, out, io) {
  let x = dv.getInt16(o, true), y = dv.getInt16(o + 2, true), z = dv.getInt16(o + 4, true), w = dv.getInt16(o + 6, true);
  const l = Math.hypot(x, y, z, w) || 1;
  out[io] = x / l;
  out[io + 1] = y / l;
  out[io + 2] = z / l;
  out[io + 3] = w / l;
}

const base = (sqt, p, f) => sqt.ofr + Math.max(0, Math.min(sqt.n - 1, f)) * sqt.tam + p.enCuadro;

export function leerCamara(sqt, f, out = nuevaCamara()) {
  const p = sqt.camara;
  if (!p) return null;
  const dv = sqt.dv, b = base(sqt, p, f);
  for (const c of p.claves) {
    const o = b + c.ofs;
    if (c.tipo === 128) vec(dv, o, 4, out.rot); else if (c.tipo === 129) vec(dv, o, 3, out.pos); else if (c.tipo === 130) out.floats[c.map] = f32(dv, o); else if (c.tipo === 136) out.shorts[c.map] = dv.getInt16(o, true);
  }
  out.angulo = out.floats[0] || 1.0472;
  return out;
}

export const nuevaCamara = () => ({
  pos: new Float32Array(3),
  rot: new Float32Array([ 0, 0, 0, 1 ]),
  floats: new Float32Array(8),
  shorts: new Int16Array(4),
  angulo: 1.0472
});

export function leerLuz(sqt, p, f, out = nuevaLuz()) {
  const dv = sqt.dv, b = base(sqt, p, f);
  for (const c of p.claves) {
    const o = b + c.ofs;
    if (c.tipo === 131) vec(dv, o, 4, out.rot); else if (c.tipo === 132) vec(dv, o, 3, out.pos); else if (c.tipo === 133) vec(dv, o, 4, out.color); else if (c.tipo === 134) out.tipo = dv.getInt32(o, true); else if (c.tipo === 135) out.params[c.map] = f32(dv, o);
  }
  return out;
}

export const nuevaLuz = () => ({
  pos: new Float32Array(3),
  rot: new Float32Array([ 0, 0, 0, 1 ]),
  color: new Float32Array(4),
  tipo: 0,
  params: new Float32Array(8)
});

export function nuevaPose(p) {
  const n = p.nHuesos;
  return {
    n: n,
    pos: new Float32Array(n * 3),
    rot: new Float32Array(n * 4),
    esc: new Float32Array(n * 3).fill(1),
    tiene: new Uint8Array(n),
    clusters: new Float32Array(Math.max(0, ...p.clusters.map(c => c.map + 1))),
    tex: new Map
  };
}

export function leerHuesos(sqt, p, f, out = nuevaPose(p)) {
  const dv = sqt.dv, b = base(sqt, p, f);
  for (const c of p.pos) {
    vec(dv, b + c.ofs, 3, out.pos, c.map * 3);
    out.tiene[c.map] = 1;
  }
  for (const c of p.rot) {
    if (c.tipo === 13) quatS15(dv, b + c.ofs, out.rot, c.map * 4); else vec(dv, b + c.ofs, 4, out.rot, c.map * 4);
  }
  for (const c of p.escala) vec(dv, b + c.ofs, 3, out.esc, c.map * 3);
  for (const c of p.clusters) out.clusters[c.map] = f32(dv, b + c.ofs);
  for (const c of p.texAnim) out.tex.set(c.map, vec(dv, b + c.ofs, 4, new Float32Array(4)));
  return out;
}

export const CORTE_POS = 40, CORTE_DOT = .97;

function nlerp(a, ia, b, ib, u, out, io) {
  let d = a[ia] * b[ib] + a[ia + 1] * b[ib + 1] + a[ia + 2] * b[ib + 2] + a[ia + 3] * b[ib + 3];
  const s = d < 0 ? -1 : 1;
  let x = a[ia] + (s * b[ib] - a[ia]) * u, y = a[ia + 1] + (s * b[ib + 1] - a[ia + 1]) * u;
  let z = a[ia + 2] + (s * b[ib + 2] - a[ia + 2]) * u, w = a[ia + 3] + (s * b[ib + 3] - a[ia + 3]) * u;
  const l = Math.hypot(x, y, z, w) || 1;
  out[io] = x / l;
  out[io + 1] = y / l;
  out[io + 2] = z / l;
  out[io + 3] = w / l;
}

const lerp = (a, b, u, out, n) => {
  for (let i = 0; i < n; i++) out[i] = a[i] + (b[i] - a[i]) * u;
};

const dist3 = (a, b, ia = 0, ib = 0) => Math.hypot(a[ia] - b[ib], a[ia + 1] - b[ib + 1], a[ia + 2] - b[ib + 2]);

const dot4 = (a, b) => Math.abs(a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3]);

export function crearMuestreador(sqt) {
  const A = {
    cam: nuevaCamara(),
    luces: sqt.luces.map(() => nuevaLuz()),
    poses: sqt.modelos.map(nuevaPose)
  };
  const B = {
    cam: nuevaCamara(),
    luces: sqt.luces.map(() => nuevaLuz()),
    poses: sqt.modelos.map(nuevaPose)
  };
  const S = {
    t: 0,
    cuadro: 0,
    corte: false,
    cam: sqt.camara ? nuevaCamara() : null,
    luces: sqt.luces.map(() => nuevaLuz()),
    poses: sqt.modelos.map(nuevaPose)
  };
  return function muestrear(t, interpolar = true) {
    t = Math.max(0, Math.min(sqt.n - 1, t));
    const f0 = Math.floor(t), f1 = Math.min(sqt.n - 1, f0 + 1);
    let u = interpolar ? t - f0 : 0;
    S.t = t;
    S.cuadro = f0;
    if (sqt.camara) {
      leerCamara(sqt, f0, A.cam);
      leerCamara(sqt, f1, B.cam);
      const corte = dist3(A.cam.pos, B.cam.pos) > CORTE_POS || dot4(A.cam.rot, B.cam.rot) < CORTE_DOT;
      S.corte = corte;
      const uc = corte ? 0 : u;
      lerp(A.cam.pos, B.cam.pos, uc, S.cam.pos, 3);
      nlerp(A.cam.rot, 0, B.cam.rot, 0, uc, S.cam.rot, 0);
      lerp(A.cam.floats, B.cam.floats, uc, S.cam.floats, 8);
      S.cam.shorts.set(A.cam.shorts);
      S.cam.angulo = S.cam.floats[0] || 1.0472;
    }
    sqt.luces.forEach((p, i) => {
      const a = leerLuz(sqt, p, f0, A.luces[i]), b = leerLuz(sqt, p, f1, B.luces[i]), s = S.luces[i];
      const ul = dist3(a.pos, b.pos) > CORTE_POS ? 0 : u;
      lerp(a.pos, b.pos, ul, s.pos, 3);
      nlerp(a.rot, 0, b.rot, 0, ul, s.rot, 0);
      s.color.set(a.color);
      s.tipo = a.tipo;
      lerp(a.params, b.params, ul, s.params, 8);
    });
    sqt.modelos.forEach((p, i) => {
      const a = leerHuesos(sqt, p, f0, A.poses[i]), b = leerHuesos(sqt, p, f1, B.poses[i]), s = S.poses[i];
      let salto = false;
      for (let h = 0; h < a.n && !salto; h++) if (a.tiene[h] && dist3(a.pos, b.pos, h * 3, h * 3) > CORTE_POS) salto = true;
      const um = salto ? 0 : u;
      lerp(a.pos, b.pos, um, s.pos, a.n * 3);
      lerp(a.esc, b.esc, um, s.esc, a.n * 3);
      for (let h = 0; h < a.n; h++) nlerp(a.rot, h * 4, b.rot, h * 4, um, s.rot, h * 4);
      s.tiene.set(a.tiene);
      lerp(a.clusters, b.clusters, um, s.clusters, a.clusters.length);
      s.tex = a.tex;
    });
    return S;
  };
}

export function resumenSqt(sqt) {
  return {
    version: sqt.version,
    ini: sqt.ini,
    fin: sqt.fin,
    cuadros: sqt.n,
    segundos: +(sqt.n / FPS).toFixed(1),
    bytesPorCuadro: sqt.tam,
    personajes: sqt.personajes.map(p => ({
      id: p.id,
      clase: p.clase,
      claves: p.claves.length,
      huesos: p.nHuesos
    }))
  };
}
