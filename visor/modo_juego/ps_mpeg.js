// SH4 web — FeniXVOID · Project Ravenlight
export class SeparadorPS {
  constructor({alVideo: alVideo, alAudio: alAudio}) {
    this.alVideo = alVideo;
    this.alAudio = alAudio;
    this.buf = new Uint8Array(1 << 18);
    this.len = 0;
    this.bytes = 0;
  }
  escribir(u8) {
    if (this.len + u8.length > this.buf.length) {
      const n = new Uint8Array(Math.max(this.buf.length * 2, this.len + u8.length));
      n.set(this.buf.subarray(0, this.len));
      this.buf = n;
    }
    this.buf.set(u8, this.len);
    this.len += u8.length;
    const b = this.buf;
    let p = 0;
    while (p + 4 <= this.len) {
      if (!(b[p] === 0 && b[p + 1] === 0 && b[p + 2] === 1)) {
        p++;
        continue;
      }
      const id = b[p + 3];
      if (id === 186) {
        if (p + 14 > this.len) break;
        if ((b[p + 4] & 240) === 32) p += 12; else p += 14 + (b[p + 13] & 7);
        continue;
      }
      if (id === 185) {
        p += 4;
        continue;
      }
      if (id < 187) {
        p++;
        continue;
      }
      if (p + 6 > this.len) break;
      const largo = b[p + 4] << 8 | b[p + 5];
      if (p + 6 + largo > this.len) break;
      if (id === 224 || id === 192) {
        let q = p + 6;
        const fin = p + 6 + largo;
        while (b[q] === 255 && q < fin) q++;
        if ((b[q] & 192) === 64) q += 2;
        let pts = null;
        if ((b[q] & 240) === 32) {
          pts = leerPts(b, q);
          q += 5;
        } else if ((b[q] & 240) === 48) {
          pts = leerPts(b, q);
          q += 10;
        } else if (b[q] === 15) q += 1; else if ((b[q] & 192) === 128) {
          const flags = b[q + 1], hl = b[q + 2];
          if (flags & 128) pts = leerPts(b, q + 3);
          q += 3 + hl;
        }
        const datos = b.slice(q, fin);
        if (id === 224) this.alVideo?.(pts, datos); else this.alAudio?.(pts, datos);
      }
      p += 6 + largo;
    }
    this.buf.copyWithin(0, p, this.len);
    this.len -= p;
    this.bytes += p;
  }
}

function leerPts(b, q) {
  const v = (b[q] >> 1 & 7) * 1073741824 + (b[q + 1] << 7 | b[q + 2] >> 1) * 32768 + (b[q + 3] << 7 | b[q + 4] >> 1);
  return v / 9e4;
}
