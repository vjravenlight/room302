// SH4 web — FeniXVOID · Project Ravenlight
export const MATERIALES = [ "muon", "concreto", "tierra", "pasto", "metal", "agua", "arbol", "alfombra", "rejilla", "vidrio", "cortina", "carne", "escombro" ];

export function leerColision(buf, ofs, len) {
  const dv = new DataView(buf, ofs, len);
  if (dv.getUint16(0, true) !== 65297) return null;
  const flag = dv.getUint16(2, true), oAbt = dv.getInt32(4, true);
  const polis = [];
  const vistos = new Set;
  const celda = (oc, prof) => {
    if (prof > 64 || oc <= 0 || oc + 40 > len || vistos.has(oc)) return;
    vistos.add(oc);
    const nHijos = dv.getInt32(oc + 12, true);
    const nPolis = dv.getInt32(oc + 32, true);
    if (nPolis > 0) {
      let op = oc + 32 + dv.getInt32(oc + 36, true);
      for (let i = 0; i < nPolis && op + 16 <= len; i++) {
        const meta0 = dv.getUint8(op + 12), fl = dv.getUint8(op + 13);
        const n = Math.max(1, fl & 1 ? 3 : meta0);
        const v = [];
        for (let k = 0; k < n; k++) v.push(dv.getFloat32(op + k * 16, true), dv.getFloat32(op + k * 16 + 4, true), dv.getFloat32(op + k * 16 + 8, true));
        const ul = op + (n - 1) * 16;
        const attr = dv.getUint16(ul + 14, true);
        polis.push({
          v: v,
          invertido: !!(dv.getUint8(ul + 13) & 4),
          material: attr & 15,
          spec: attr >> 4 & 15,
          sinLuz: !!(attr & 256)
        });
        op += n * 16;
      }
    }
    for (let h = 0; h < nHijos; h++) {
      const rel = dv.getInt32(oc + 40 + 4 * h, true);
      if (rel) celda(oc + rel, prof + 1);
    }
  };
  if (oAbt) celda(oAbt, 0);
  return {
    flag: flag,
    polis: polis
  };
}

export const PISO = {
  henry: {
    arriba: 100,
    abajo: 100,
    minNy: 0
  },
  eileen: {
    arriba: 200,
    abajo: 300,
    minNy: .01
  },
  enemigo: {
    arriba: 80,
    abajo: 400,
    minNy: .6087614
  }
};

export function crearPiso(THREE, escala = .005) {
  const rayo = new THREE.Raycaster, o = new THREE.Vector3, abajo = new THREE.Vector3(0, -1, 0);
  function visor(col, x, y, z, arribaM, abajoM, minNy = 0) {
    if (!col) return null;
    o.set(x, y + arribaM, z);
    rayo.set(o, abajo);
    rayo.near = 0;
    rayo.far = Math.max(1e-4, arribaM + abajoM);
    const derivada = !!col.userData?.derivada;
    for (const h of rayo.intersectObject(col, false)) {
      const ny = h.face?.normal?.y ?? 0;
      if (derivada ? Math.abs(ny) > .6 : ny > 0 && ny >= minNy) return h.point.y;
    }
    return null;
  }
  function juego(col, p, arriba = 100, abajoU = 100, minNy = 0) {
    const y = visor(col, -p[0] * escala, -p[1] * escala, p[2] * escala, arriba * escala, abajoU * escala, minNy);
    return y == null ? null : -y / escala;
  }
  return {
    visor: visor,
    juego: juego
  };
}
