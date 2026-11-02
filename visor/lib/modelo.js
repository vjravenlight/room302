// SH4 web — FeniXVOID · Project Ravenlight
import { tiraATriangulos } from "./mundo.js";

export function leerModelo(buf, ofs, len) {
  const dv = new DataView(buf, ofs, len);
  if (dv.getUint32(0, true) !== 4294901763) return null;
  const h = i => dv.getUint32(4 + 4 * i, true);
  const nHuesos = h(2);
  const huesos = [];
  for (let i = 0; i < nHuesos; i++) {
    const m = new Float32Array(16);
    for (let k = 0; k < 16; k++) m[k] = dv.getFloat32(h(1) + i * 64 + k * 4, true);
    huesos.push({
      matriz: m,
      padre: dv.getInt8(h(3) + i)
    });
  }
  const pares = [];
  for (let i = 0; i < h(4); i++) pares.push([ dv.getUint8(h(5) + 2 * i), dv.getUint8(h(5) + 2 * i + 1) ]);
  const materiales = [];
  for (let i = 0; i < h(13); i++) {
    const o = h(14) + 8 * i;
    materiales.push({
      grupo: dv.getUint8(o + 4) - 1,
      sub: dv.getUint8(o + 5)
    });
  }
  const partes = [];
  for (const [n, o0] of [ [ h(7), h(8) ], [ h(9), h(10) ] ]) {
    let o = o0;
    for (let k = 0; k < n && o > 0 && o < len; k++) {
      const parte = leerParte(dv, o, huesos, pares, partes.length, materiales);
      partes.push(...parte.subpartes);
      const tam = dv.getUint32(o, true);
      if (!tam) break;
      o += tam;
    }
  }
  const res = {
    huesos: huesos,
    pares: pares,
    materiales: materiales,
    partes: partes
  };
  Object.defineProperty(res, "origen", {
    value: {
      buf: buf,
      ofs: ofs
    },
    enumerable: false
  });
  return res;
}

function transformar(m, x, y, z, w, out, k) {
  out[k] = x * m[0] + y * m[4] + z * m[8] + w * m[12];
  out[k + 1] = x * m[1] + y * m[5] + z * m[9] + w * m[13];
  out[k + 2] = x * m[2] + y * m[6] + z * m[10] + w * m[14];
}

function leerParte(dv, o, huesos, pares, base, materiales) {
  const inf = i => dv.getUint32(o + 4 * i, true);
  const lista = [];
  for (let i = 0; i < inf(7); i++) lista.push(dv.getUint16(o + inf(8) + 2 * i, true));
  for (let i = 0; i < inf(9); i++) lista.push(pares[dv.getUint16(o + inf(10) + 2 * i, true)]?.[1] ?? 0);
  const material = dv.getUint16(o + inf(10) + 2 * inf(9), true);
  const fl = k => dv.getFloat32(o + k, true);
  const grupoParte = dv.getUint8(o + 66);
  const luz = {
    tipo: dv.getUint8(o + 64),
    esp: [ fl(72), fl(76) ],
    env: fl(80),
    dif: [ fl(96), fl(100), fl(104), fl(108) ],
    amb: [ fl(112), fl(116), fl(120), fl(124) ]
  };
  const vb = o + inf(2);
  const nSub = dv.getUint32(vb, true), oIdx = dv.getUint32(vb + 8, true);
  const cabs = [];
  for (let s = 0; s < nSub; s++) {
    const c = vb + 12 + s * 92 + 64;
    cabs.push([ 0, 1, 2, 3, 4, 5, 6 ].map(i => dv.getUint32(c + 4 * i, true)));
  }
  let ov = vb + 12 + nSub * 92;
  const subpartes = [];
  for (let s = 0; s < nSub; s++) {
    const [nI, nV, tamV, , oI, , oTabla] = cabs[s];
    const baseCab = vb + oIdx + s * 92;
    const tira = new Uint16Array(nI);
    for (let i = 0; i < nI; i++) tira[i] = dv.getUint16(baseCab + oI + 2 * i, true);
    const tabla = [];
    for (let i = 0; i < 20; i++) tabla.push(dv.getUint32(baseCab + oTabla + 4 * i, true));
    let mapa = null;
    if (tamV > 32) {
      const usados = new Set;
      for (let i = 0; i < nV; i++) for (let k = 0; k < 4; k++) usados.add(dv.getFloat32(ov + i * tamV + 32 + 4 * k, true));
      mapa = new Map([ ...usados ].sort((a, b) => a - b).map((v, i) => [ v, tabla[i] ]));
    }
    const pos = new Float32Array(nV * 3), nor = new Float32Array(nV * 3), uv = new Float32Array(nV * 2);
    const hueso = new Uint16Array(nV * 4), peso = new Float32Array(nV * 4);
    for (let i = 0; i < nV; i++) {
      const v = ov + i * tamV;
      const x = dv.getFloat32(v, true), y = dv.getFloat32(v + 4, true), z = dv.getFloat32(v + 8, true);
      const nx = dv.getFloat32(v + 12, true), ny = dv.getFloat32(v + 16, true), nz = dv.getFloat32(v + 20, true);
      uv[i * 2] = dv.getFloat32(v + 24, true);
      uv[i * 2 + 1] = dv.getFloat32(v + 28, true);
      let h0 = 0;
      if (mapa) {
        for (let k = 0; k < 4; k++) {
          const bi = lista[mapa.get(dv.getFloat32(v + 32 + 4 * k, true))] ?? 0;
          hueso[i * 4 + k] = bi;
          peso[i * 4 + k] = dv.getFloat32(v + 48 + 4 * k, true);
        }
        h0 = hueso[i * 4];
      } else {
        hueso[i * 4] = lista[0] ?? 0;
        peso[i * 4] = 1;
        h0 = hueso[i * 4];
      }
      const m = huesos[h0]?.matriz;
      if (m) {
        transformar(m, x, y, z, 1, pos, i * 3);
        transformar(m, nx, ny, nz, 0, nor, i * 3);
      } else {
        pos[i * 3] = x;
        pos[i * 3 + 1] = y;
        pos[i * 3 + 2] = z;
      }
    }
    ov += nV * tamV;
    subpartes.push({
      parte: base,
      material: material,
      textura: materiales[material],
      luz: luz,
      grupoParte: grupoParte,
      pos: pos,
      nor: nor,
      uv: uv,
      hueso: hueso,
      peso: peso,
      indices: tiraATriangulos(tira)
    });
  }
  return {
    subpartes: subpartes
  };
}
