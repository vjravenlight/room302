// SH4 web — FeniXVOID · Project Ravenlight
const CUADRO = 13, MUESTRAS = 16, C1 = 29336, C2 = 13136;

export function cabeceraXmd(u8, ofs = 0) {
  const dv = new DataView(u8.buffer, u8.byteOffset + ofs, 12);
  return {
    canales: dv.getUint8(0),
    frecuencia: dv.getUint16(1, true),
    bytes: dv.getUint32(3, true),
    loop: dv.getUint8(7) !== 0,
    loopBytes: dv.getUint32(8, true)
  };
}

export function decodificarXmd(u8) {
  const h = cabeceraXmd(u8);
  if (h.canales < 1 || h.canales > 2 || h.bytes === 0) return null;
  const ch = h.canales;
  const cuadros = Math.floor(h.bytes / CUADRO / ch);
  const n = cuadros * MUESTRAS;
  const sal = Array.from({
    length: ch
  }, () => new Float32Array(n));
  const dv = new DataView(u8.buffer, u8.byteOffset + 12, Math.min(h.bytes, u8.byteLength - 12));
  for (let f = 0; f < cuadros; f++) {
    for (let c = 0; c < ch; c++) {
      const o = (f * ch + c) * CUADRO;
      if (o + CUADRO > dv.byteLength) break;
      let h2 = dv.getInt16(o, true), h1 = dv.getInt16(o + 2, true);
      const esc = dv.getUint16(o + 4, true) << 14;
      const out = sal[c];
      let k = f * MUESTRAS;
      out[k++] = h2 / 32768;
      out[k++] = h1 / 32768;
      for (let i = 0; i < 14; i++) {
        const b = dv.getUint8(o + 6 + (i >> 1));
        let nib = i & 1 ? b >> 4 : b & 15;
        if (nib & 8) nib -= 16;
        let s = nib * esc + h1 * C1 - h2 * C2 >> 14;
        s = s << 16 >> 16;
        out[k++] = s / 32768;
        h2 = h1;
        h1 = s;
      }
    }
  }
  const loopInicio = h.loop ? Math.floor(h.loopBytes / CUADRO / ch) * MUESTRAS : 0;
  return {
    frecuencia: h.frecuencia,
    canales: sal,
    loop: h.loop,
    loopInicio: loopInicio
  };
}
