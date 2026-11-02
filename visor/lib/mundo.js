// SH4 web — FeniXVOID · Project Ravenlight
export const GRUPOS = [ "normal", "calco", "transparente" ];

export function leerMundo(buf, ofs, len) {
  const dv = new DataView(buf, ofs, len);
  const version = dv.getUint32(4, true);
  if (dv.getUint32(0, true) !== 4228055041 || version !== 3 && version !== 2) return {
    version: version,
    piezas: []
  };
  const piezas = [];
  GRUPOS.forEach((grupo, g) => {
    const og = dv.getUint32(8 + 4 * g, true);
    if (!og) return;
    const nb = dv.getUint32(og, true);
    for (let b = 0; b < nb; b++) {
      piezas.push(leerBloque(buf, ofs, dv, og + dv.getUint32(og + 4 + 4 * b, true), grupo));
    }
  });
  const matrices = [];
  const om = dv.getUint32(20, true), nm = dv.getUint32(24, true);
  for (let k = 0; k < nm && om + k * 64 + 64 <= len; k++) {
    const m = new Float32Array(16);
    for (let i = 0; i < 16; i++) m[i] = dv.getFloat32(om + k * 64 + i * 4, true);
    matrices.push(m);
  }
  return {
    version: version,
    piezas: piezas,
    matrices: matrices,
    luzDinamica: !!(dv.getUint8(28) & 1)
  };
}

function leerBloque(buf, base, dv, ob, grupo) {
  const op = ob + dv.getInt32(ob + 8, true);
  const nCaras = dv.getUint32(op + 32, true), nVert = dv.getUint32(op + 36, true);
  const oCaras = op + dv.getUint32(op + 116, true), oVert = oCaras + nCaras * 2;
  const tira = new Uint16Array(buf.slice(base + oCaras, base + oCaras + nCaras * 2));
  const pos = new Float32Array(nVert * 3), col = new Float32Array(nVert * 4), uv = new Float32Array(nVert * 2);
  for (let i = 0; i < nVert; i++) {
    const o = oVert + i * 24;
    pos[i * 3] = dv.getFloat32(o, true);
    pos[i * 3 + 1] = dv.getFloat32(o + 4, true);
    pos[i * 3 + 2] = dv.getFloat32(o + 8, true);
    col[i * 4] = dv.getUint8(o + 14) / 255;
    col[i * 4 + 1] = dv.getUint8(o + 13) / 255;
    col[i * 4 + 2] = dv.getUint8(o + 12) / 255;
    col[i * 4 + 3] = dv.getUint8(o + 15) / 255;
    uv[i * 2] = dv.getFloat32(o + 16, true);
    uv[i * 2 + 1] = dv.getFloat32(o + 20, true);
  }
  const oNor = dv.getUint32(op + 124, true);
  let nor = null;
  if (oNor) {
    nor = new Float32Array(nVert * 3);
    for (let i = 0; i < nVert * 3; i++) nor[i] = dv.getFloat32(op + oNor + 72 + i * 4, true);
  }
  return {
    grupo: grupo,
    nor: nor,
    textura: dv.getInt16(ob + 12, true),
    banco: dv.getInt16(ob + 14, true),
    clut: dv.getInt16(ob + 16, true),
    paleta: dv.getInt16(ob + 18, true),
    matriz: dv.getInt16(ob + 24, true),
    backclip: dv.getUint8(ob + 26),
    params: new DataView(buf, base + ob + dv.getInt32(ob + 4, true), 64),
    pos: pos,
    col: col,
    uv: uv,
    indices: tiraATriangulos(tira)
  };
}

export function tiraATriangulos(t) {
  const out = [];
  for (let i = 2; i < t.length; i++) {
    const a = t[i - 2], b = t[i - 1], c = t[i];
    if (a === b || b === c || a === c) continue;
    if (i & 1) out.push(b, a, c); else out.push(a, b, c);
  }
  return new Uint32Array(out);
}
