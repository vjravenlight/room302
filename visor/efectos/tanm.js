// SH4 web — FeniXVOID · Project Ravenlight
import { muestrearPista } from "../lib/animacion.js";

export function leerTanm(buf, ofs, len) {
  const dv = new DataView(buf, ofs, len);
  if (dv.getUint32(0, true) !== 4294901763) return null;
  const h = i => dv.getUint32(4 + 4 * i, true);
  const nTp = h(13), o = h(29);
  if (!o || !nTp) return null;
  const ids = [];
  for (let i = 0; i < nTp && o + 4 * i + 4 <= len; i++) {
    const x = dv.getUint32(o + 4 * i, true);
    ids.push(x & 4096 ? x & 4095 : -1);
  }
  return ids.some(x => x >= 0) ? ids : null;
}

export function crearTanm({modelo: modelo, tanm: tanm, mallas: mallas, anim: anim, fps: fps = 30}) {
  const pistas = new Map;
  for (const p of anim?.pistas || []) if (p.tipo === 12) pistas.set(p.hueso, p);
  const animadas = [];
  modelo.partes.forEach((s, i) => {
    const n = tanm?.[s.material];
    const malla = mallas[i];
    if (n == null || n < 0 || !pistas.has(n) || !malla?.material?.map) return;
    malla.material = malla.material.clone();
    malla.material.map = malla.material.map.clone();
    malla.material.map.needsUpdate = true;
    animadas.push({
      malla: malla,
      pista: pistas.get(n)
    });
  });
  let t = 0;
  const v = new Float32Array(4);
  function aplicar() {
    const cuadro = anim.loop || !anim.duracion ? t % Math.max(1, anim.duracion) : Math.min(t, anim.duracion);
    for (const a of animadas) {
      muestrearPista(a.pista, cuadro, v, 0);
      const m = a.malla.material.map;
      m.offset.set(v[0], v[1]);
      m.repeat.set(v[2] || 1, v[3] || 1);
    }
    return cuadro;
  }
  aplicar();
  return {
    animadas: animadas.length,
    actualizar(dt) {
      t += dt * fps;
      return aplicar();
    },
    ir(c) {
      t = c;
      return aplicar();
    }
  };
}
