// SH4 web — FeniXVOID · Project Ravenlight
export const TIPOS_LUZ = [ "nada", "ambiente", "direccional", "puntual", "foco", "reflejo direccional", "reflejo puntual" ];

export function leerLuces(buf, ofs, len) {
  const dv = new DataView(buf, ofs, len);
  if (dv.getUint32(0, false) !== 1397507924) return [];
  const n = dv.getUint32(8, true);
  const luces = [];
  for (let i = 0; i < n && 16 + i * 64 + 64 <= len; i++) {
    const p = 16 + i * 64;
    const f = k => dv.getFloat32(p + k, true);
    const tipo = dv.getUint32(p, true);
    luces.push({
      tipo: tipo,
      nombreTipo: TIPOS_LUZ[tipo] || "tipo " + tipo,
      color: [ dv.getUint8(p + 4), dv.getUint8(p + 5), dv.getUint8(p + 6) ],
      banderas: dv.getUint8(p + 7),
      intensidad: f(8),
      escala: f(12),
      pos: [ f(16), f(20), f(24) ],
      dir: [ f(32), f(36), f(40) ],
      cono: f(48),
      penumbra: f(52),
      largoSombra: f(56)
    });
  }
  return luces;
}

export function leerNiebla(buf, ofs, len) {
  const dv = new DataView(buf, ofs, len);
  return {
    cerca: dv.getFloat32(0, true),
    lejos: dv.getFloat32(4, true),
    color: [ dv.getUint8(8), dv.getUint8(9), dv.getUint8(10) ],
    alfa: dv.getUint8(11),
    potCerca: dv.getUint8(12),
    potLejos: dv.getUint8(13)
  };
}
