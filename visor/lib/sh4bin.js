// SH4 web — FeniXVOID · Project Ravenlight
export function partesBin(buf) {
  const dv = new DataView(buf);
  if (buf.byteLength < 4) return [];
  const n = dv.getUint32(0, true);
  if (!n || 4 + 4 * n > buf.byteLength) return [];
  const ofs = [];
  for (let i = 0; i < n; i++) ofs.push(dv.getUint32(4 + 4 * i, true));
  return ofs.map((o, i) => {
    const fin = i + 1 < n ? ofs[i + 1] : buf.byteLength;
    return {
      indice: i,
      ofs: o,
      len: fin - o,
      tipo: tipoParte(buf, o, fin - o)
    };
  });
}

export function tipoParte(buf, o, n) {
  const dv = new DataView(buf, o, n);
  const u32 = k => k + 4 <= n ? dv.getUint32(k, true) : 0;
  const u16 = k => k + 2 <= n ? dv.getUint16(k, true) : 0;
  const f32 = k => k + 4 <= n ? dv.getFloat32(k, true) : 0;
  if (n === 2) return "vacio";
  const m = u32(0);
  if (m === 56880) return "sqt0";
  if (m === 4294901763) return "modelo";
  if (m === 264269824) return "sombra";
  if (m === 4228055041) return "mundo";
  if (m === 4294967295) return "sh3";
  if (m === 196369) return "colision";
  if (m === 130833 || m === 65297) return "colision_vieja";
  if ((m === 0 || m === 6) && u32(4) === 16) return "colision_rara";
  if (m === 1413958739) return "luces";
  if (m === 4278255617) return "animacion";
  if (u16(0) === 34177) return "sdb";
  if (m === 1 && u32(4) === 3) return "se";
  if (m === 65536) return "icono_ps2";
  if (f32(0) < f32(4) && !u16(14) && !f32(16) && !f32(20) && !f32(24) && !f32(28)) return "niebla";
  if ((n >= 64 && n < 144 || n === 176) && !f32(0) && !f32(4)) return "niebla";
  if (n >= 144 && u16(0) && !u32(4) && !u32(8) && !u32(12)) return "texturas";
  if (n >= 144 && !u32(0) && !u32(4) && !u32(8) && !u32(12)) return "texturas_vacias";
  if (u16(0) + 1 === u16(2)) return "textos";
  if (m && m <= n && (n - m) % 4 === 0) return "caminos";
  return "desconocido";
}

export function paqueteSh4(buf) {
  const dv = new DataView(buf);
  if (dv.getUint32(0, false) !== 1397240832) throw new Error("no es un .sh4");
  const n = dv.getUint32(4, true);
  const base = buf.byteLength - n * 16;
  const dec = new TextDecoder("latin1");
  const res = [];
  for (let i = 0; i < n; i++) {
    const b = new Uint8Array(buf, base + 16 * i, 16);
    const z = b.indexOf(0);
    res.push({
      nombre: dec.decode(z < 0 ? b : b.subarray(0, z)),
      ofs: dv.getUint32(8 + 8 * i, true),
      len: dv.getUint32(12 + 8 * i, true)
    });
  }
  return res;
}
