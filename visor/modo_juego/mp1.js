// SH4 web — FeniXVOID · Project Ravenlight
const TASAS = [ 44100, 48e3, 32e3, 0 ];

const KBPS = [ 0, 32, 64, 96, 128, 160, 192, 224, 256, 288, 320, 352, 384, 416, 448, 0 ];

const N = new Float32Array(64 * 32);

for (let i = 0; i < 64; i++) for (let k = 0; k < 32; k++) N[i * 32 + k] = Math.cos((16 + i) * (2 * k + 1) * Math.PI / 64);

const ESCALAS = new Float32Array(64);

for (let i = 0; i < 63; i++) ESCALAS[i] = 2 * Math.pow(2, -i / 3);

export class DecodificadorMp1 {
  constructor(ventana32768) {
    this.D = new Float32Array(512);
    for (let i = 0; i < 512; i++) this.D[i] = ventana32768[i] / 32768;
    this.V = [ new Float32Array(1024 * 2), new Float32Array(1024 * 2) ];
    this.vpos = [ 0, 0 ];
    this.tasa = 48e3;
    this.canales = 2;
    this.buf = new Uint8Array(1 << 16);
    this.len = 0;
    this.alloc = [ new Uint8Array(32), new Uint8Array(32) ];
    this.esc = [ new Float32Array(32), new Float32Array(32) ];
    this.s = [ new Float32Array(32), new Float32Array(32) ];
  }
  escribir(u8) {
    if (this.len + u8.length > this.buf.length) {
      const n = new Uint8Array(Math.max(this.buf.length * 2, this.len + u8.length));
      n.set(this.buf.subarray(0, this.len));
      this.buf = n;
    }
    this.buf.set(u8, this.len);
    this.len += u8.length;
    const salidaI = [], salidaD = [];
    let p = 0;
    for (;;) {
      while (p + 4 <= this.len && !(this.buf[p] === 255 && (this.buf[p + 1] & 254) === 254)) p++;
      if (p + 4 > this.len) break;
      const b2 = this.buf[p + 2], b3 = this.buf[p + 3];
      const kbps = KBPS[b2 >> 4], tasa = TASAS[b2 >> 2 & 3], relleno = b2 >> 1 & 1;
      if (!kbps || !tasa) {
        p++;
        continue;
      }
      const largo = (Math.floor(12 * kbps * 1e3 / tasa) + relleno) * 4;
      if (p + largo > this.len) break;
      this.tasa = tasa;
      const [i, d] = this.cuadro(p, largo, b3, !(this.buf[p + 1] & 1));
      salidaI.push(i);
      salidaD.push(d);
      p += largo;
    }
    this.buf.copyWithin(0, p, this.len);
    this.len -= p;
    if (!salidaI.length) return null;
    return [ unir(salidaI), unir(salidaD) ];
  }
  cuadro(p, largo, b3, conCrc) {
    const modo = b3 >> 6, ext = b3 >> 4 & 3;
    const nc = modo === 3 ? 1 : 2;
    const limite = modo === 1 ? 4 * (ext + 1) : 32;
    const u8 = this.buf;
    let bit = (p + 4 + (conCrc ? 2 : 0)) * 8;
    const leer = n => {
      let v = 0;
      for (let k = 0; k < n; k++, bit++) v = v << 1 | u8[bit >> 3] >> 7 - (bit & 7) & 1;
      return v;
    };
    const {alloc: alloc, esc: esc, s: s} = this;
    for (let sb = 0; sb < 32; sb++) {
      if (sb < limite) for (let c = 0; c < nc; c++) alloc[c][sb] = leer(4); else {
        const a = leer(4);
        alloc[0][sb] = a;
        alloc[1][sb] = a;
      }
    }
    for (let sb = 0; sb < 32; sb++) for (let c = 0; c < nc; c++) if (alloc[c][sb]) esc[c][sb] = ESCALAS[leer(6)];
    const izq = new Float32Array(384), der = new Float32Array(384);
    for (let blq = 0; blq < 12; blq++) {
      for (let sb = 0; sb < 32; sb++) {
        if (sb < limite) {
          for (let c = 0; c < nc; c++) {
            const a = alloc[c][sb];
            if (!a) {
              s[c][sb] = 0;
              continue;
            }
            const nb = a + 1, n = 1 << nb, v = leer(nb);
            s[c][sb] = (2 * v - n + 2) / (n - 1) * esc[c][sb];
          }
        } else {
          const a = alloc[0][sb];
          if (!a) {
            s[0][sb] = s[1][sb] = 0;
            continue;
          }
          const nb = a + 1, n = 1 << nb, v = leer(nb), f = (2 * v - n + 2) / (n - 1);
          s[0][sb] = f * esc[0][sb];
          s[1][sb] = f * esc[1][sb];
        }
      }
      for (let c = 0; c < 2; c++) this.sintesis(nc === 1 ? 0 : c, c, c === 0 ? izq : der, blq * 32);
    }
    return [ izq, der ];
  }
  sintesis(entrada, canal, out, o) {
    const S = this.s[entrada], V = this.V[canal], D = this.D;
    let vp = this.vpos[canal] = (this.vpos[canal] + 1024 - 64) % 1024;
    for (let i = 0; i < 64; i++) {
      let acc = 0;
      const f = i * 32;
      for (let k = 0; k < 32; k++) acc += N[f + k] * S[k];
      V[vp + i] = acc;
      V[vp + i + 1024] = acc;
    }
    for (let j = 0; j < 32; j++) {
      let acc = 0;
      for (let i = 0; i < 8; i++) {
        acc += V[vp + i * 128 + j] * D[i * 64 + j];
        acc += V[vp + i * 128 + 96 + j] * D[i * 64 + 32 + j];
      }
      out[o + j] = acc;
    }
  }
}

function unir(lista) {
  if (lista.length === 1) return lista[0];
  const n = lista.reduce((a, x) => a + x.length, 0), r = new Float32Array(n);
  let o = 0;
  for (const x of lista) {
    r.set(x, o);
    o += x.length;
  }
  return r;
}
