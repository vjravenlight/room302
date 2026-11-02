// SH4 web — FeniXVOID · Project Ravenlight
const DXT1 = 827611204, DXT3 = 861165636, DXT5 = 894720068, BGRA = 21;

function leerSinPaletas(dv, buf, ofs, len, n) {
  const res = [];
  for (let i = 0; i < n; i++) {
    const oi = dv.getUint32(16 + 4 * i, true);
    if (oi + 16 > len) {
      res.push([]);
      continue;
    }
    const h = oi + dv.getUint32(oi + 12, true);
    if (h + 112 > len) {
      res.push([]);
      continue;
    }
    const ancho = dv.getUint32(h + 32, true), alto = dv.getUint32(h + 36, true);
    const formato = dv.getUint32(h + 40, true), mips = dv.getUint32(h + 44, true);
    const largo = dv.getUint32(h + 48, true), oDatos = dv.getUint32(h + 80, true);
    res.push([ {
      ancho: ancho,
      alto: alto,
      formato: nombreFormato(formato),
      mips: mips,
      datos: new Uint8Array(buf, ofs + h + oDatos, Math.min(largo, len - h - oDatos))
    } ]);
  }
  return res;
}

export function leerTexturas(buf, ofs, len) {
  const dv = new DataView(buf, ofs, len);
  const n = dv.getUint16(0, true);
  if (n > 0 && dv.getUint16(2, true) === 0) return leerSinPaletas(dv, buf, ofs, len, n);
  if (n !== dv.getUint16(2, true)) throw new Error("bloque de texturas raro");
  const res = [];
  for (let i = 0; i < n; i++) {
    const oPal = dv.getUint32(16 + 4 * n + 4 * i, true);
    const cant = dv.getUint32(oPal + 4, true);
    const base = oPal + dv.getUint32(oPal + 12, true);
    const subs = [];
    for (let j = 0; j < cant; j++) {
      const h = base + j * 112;
      if (h + 112 > len) break;
      const ancho = dv.getUint32(h + 32, true), alto = dv.getUint32(h + 36, true);
      const formato = dv.getUint32(h + 40, true), mips = dv.getUint32(h + 44, true);
      const largo = dv.getUint32(h + 48, true), oDatos = dv.getUint32(h + 80, true);
      subs.push({
        ancho: ancho,
        alto: alto,
        formato: nombreFormato(formato),
        mips: mips,
        datos: new Uint8Array(buf, ofs + h + oDatos, Math.min(largo, len - h - oDatos))
      });
    }
    res.push(subs);
  }
  return res;
}

function nombreFormato(f) {
  if (f === DXT1) return "DXT1";
  if (f === DXT3) return "DXT3";
  if (f === DXT5) return "DXT5";
  if (f === BGRA) return "BGRA";
  return "raro_" + f;
}

export function aRGBA(img) {
  const {ancho: w, alto: h, formato: formato, datos: datos} = img;
  const out = new Uint8Array(w * h * 4);
  if (formato === "BGRA") {
    for (let i = 0; i < w * h; i++) {
      out[i * 4] = datos[i * 4 + 2];
      out[i * 4 + 1] = datos[i * 4 + 1];
      out[i * 4 + 2] = datos[i * 4];
      out[i * 4 + 3] = datos[i * 4 + 3];
    }
    return out;
  }
  const tamBloque = formato === "DXT1" ? 8 : 16;
  const bx = Math.max(1, w >> 2), by = Math.max(1, h >> 2);
  const c = new Uint8Array(16);
  for (let y = 0; y < by; y++) for (let x = 0; x < bx; x++) {
    const o = (y * bx + x) * tamBloque;
    if (o + tamBloque > datos.length) return out;
    const oc = formato === "DXT1" ? o : o + 8;
    const c0 = datos[oc] | datos[oc + 1] << 8, c1 = datos[oc + 2] | datos[oc + 3] << 8;
    rgb565(c0, c, 0);
    rgb565(c1, c, 4);
    if (formato !== "DXT1" || c0 > c1) {
      for (let k = 0; k < 3; k++) {
        c[8 + k] = (2 * c[k] + c[4 + k] + 1) / 3;
        c[12 + k] = (c[k] + 2 * c[4 + k] + 1) / 3;
      }
      c[11] = c[15] = 255;
    } else {
      for (let k = 0; k < 3; k++) {
        c[8 + k] = c[k] + c[4 + k] >> 1;
        c[12 + k] = 0;
      }
      c[11] = 255;
      c[15] = 0;
    }
    c[3] = c[7] = 255;
    let alfas = null;
    if (formato === "DXT5") alfas = alfaDxt5(datos, o);
    for (let py = 0; py < 4; py++) {
      const bits = datos[oc + 4 + py];
      for (let px = 0; px < 4; px++) {
        const X = x * 4 + px, Y = y * 4 + py;
        if (X >= w || Y >= h) continue;
        const idx = bits >> px * 2 & 3, d = (Y * w + X) * 4;
        out[d] = c[idx * 4];
        out[d + 1] = c[idx * 4 + 1];
        out[d + 2] = c[idx * 4 + 2];
        let a = c[idx * 4 + 3];
        if (formato === "DXT3") {
          const n = datos[o + py * 2 + (px >> 1)] >> (px & 1) * 4 & 15;
          a = n * 17;
        } else if (alfas) a = alfas[py * 4 + px];
        out[d + 3] = a;
      }
    }
  }
  return out;
}

function rgb565(v, c, k) {
  const r = v >> 11 & 31, g = v >> 5 & 63, b = v & 31;
  c[k] = r << 3 | r >> 2;
  c[k + 1] = g << 2 | g >> 4;
  c[k + 2] = b << 3 | b >> 2;
}

function alfaDxt5(d, o) {
  const a0 = d[o], a1 = d[o + 1], tabla = [ a0, a1 ];
  if (a0 > a1) for (let i = 1; i < 7; i++) tabla.push(((7 - i) * a0 + i * a1) / 7 | 0); else {
    for (let i = 1; i < 5; i++) tabla.push(((5 - i) * a0 + i * a1) / 5 | 0);
    tabla.push(0, 255);
  }
  const res = new Uint8Array(16);
  let bits = 0n;
  for (let i = 0; i < 6; i++) bits |= BigInt(d[o + 2 + i]) << BigInt(8 * i);
  for (let i = 0; i < 16; i++) res[i] = tabla[Number(bits >> BigInt(3 * i) & 7n)];
  return res;
}

export function ampliarSuave(rgba, w, h, f = 2) {
  const W = w * f, H = h * f;
  const pesos = t => {
    const t2 = t * t, t3 = t2 * t;
    return [ (-t3 + 2 * t2 - t) / 2, (3 * t3 - 5 * t2 + 2) / 2, (-3 * t3 + 4 * t2 + t) / 2, (t3 - t2) / 2 ];
  };
  const tabla = (n, N) => {
    const idx = new Int32Array(N * 4), pe = new Float32Array(N * 4);
    for (let i = 0; i < N; i++) {
      const s = (i + .5) / f - .5, b = Math.floor(s), p = pesos(s - b);
      for (let k = 0; k < 4; k++) {
        idx[i * 4 + k] = ((b - 1 + k) % n + n) % n;
        pe[i * 4 + k] = p[k];
      }
    }
    return {
      idx: idx,
      pe: pe
    };
  };
  const tx = tabla(w, W), ty = tabla(h, H);
  const medio = new Float32Array(h * W * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < W; x++) {
    const o = (y * W + x) * 4, k = x * 4;
    const a0 = (y * w + tx.idx[k]) * 4, a1 = (y * w + tx.idx[k + 1]) * 4, a2 = (y * w + tx.idx[k + 2]) * 4, a3 = (y * w + tx.idx[k + 3]) * 4;
    const p0 = tx.pe[k], p1 = tx.pe[k + 1], p2 = tx.pe[k + 2], p3 = tx.pe[k + 3];
    for (let c = 0; c < 4; c++) medio[o + c] = p0 * rgba[a0 + c] + p1 * rgba[a1 + c] + p2 * rgba[a2 + c] + p3 * rgba[a3 + c];
  }
  const out = new Uint8Array(W * H * 4);
  for (let y = 0; y < H; y++) {
    const k = y * 4;
    const f0 = ty.idx[k] * W * 4, f1 = ty.idx[k + 1] * W * 4, f2 = ty.idx[k + 2] * W * 4, f3 = ty.idx[k + 3] * W * 4;
    const p0 = ty.pe[k], p1 = ty.pe[k + 1], p2 = ty.pe[k + 2], p3 = ty.pe[k + 3];
    for (let i = 0, o = y * W * 4; i < W * 4; i++) {
      const v = p0 * medio[f0 + i] + p1 * medio[f1 + i] + p2 * medio[f2 + i] + p3 * medio[f3 + i] + .5;
      out[o + i] = v < 0 ? 0 : v > 255 ? 255 : v;
    }
  }
  return {
    datos: out,
    ancho: W,
    alto: H
  };
}
