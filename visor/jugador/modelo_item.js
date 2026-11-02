// SH4 web — FeniXVOID · Project Ravenlight
import { partesBin } from "../lib/sh4bin.js";

import { leerModelo } from "../lib/modelo.js";

import { leerTexturas } from "../lib/texturas.js";

import { crearPersonaje } from "../lib/personaje.js";

const bins = new Map;

function bin(archivo) {
  if (!bins.has(archivo)) {
    bins.set(archivo, fetch("/juego/data/" + archivo).then(r => {
      if (!r.ok) throw new Error("no pude leer " + archivo);
      return r.arrayBuffer();
    }).then(b => ({
      b: b,
      p: partesBin(b)
    })));
    bins.get(archivo).catch(() => bins.delete(archivo));
  }
  return bins.get(archivo);
}

export function crearModelosItem({THREE: THREE, datos: datos}) {
  const filas = new Map((datos?.juego?.modelos_items?.filas || []).map(f => [ f.id, f ]));
  const leidos = new Map;
  function leer(k) {
    if (leidos.has(k)) return leidos.get(k);
    const p = (async () => {
      const f = filas.get(k);
      if (!f?.modelo) return null;
      const m = await bin(f.modelo.archivo), pm = m.p[f.modelo.parte];
      if (!pm) return null;
      const t = f.texturas ? await bin(f.texturas.archivo) : null, pt = t ? t.p[f.texturas.parte] : null;
      const mod = leerModelo(m.b, pm.ofs, pm.len);
      const texs = pt ? leerTexturas(t.b, pt.ofs, pt.len) : [];
      const caja = new THREE.Box3, v = new THREE.Vector3;
      for (const s of mod.partes) for (let i = 0; i < s.pos.length; i += 3) caja.expandByPoint(v.set(-s.pos[i], -s.pos[i + 1], s.pos[i + 2]));
      return caja.isEmpty() ? null : {
        mod: mod,
        texs: texs,
        caja: caja
      };
    })().catch(e => {
      console.warn("modelo del ítem", k, e.message);
      return null;
    });
    leidos.set(k, p);
    return p;
  }
  async function modelo(k) {
    const L = await leer(k);
    if (!L) return null;
    const pj = crearPersonaje(L.mod, L.texs, {
      escala: 1
    });
    const tam = L.caja.getSize(new THREE.Vector3), centro = L.caja.getCenter(new THREE.Vector3);
    const lado = Math.max(tam.x, tam.y, tam.z) || 1;
    const g = new THREE.Group;
    g.name = "ítem " + k;
    const dentro = new THREE.Group;
    dentro.add(pj.grupo);
    pj.grupo.position.copy(centro).multiplyScalar(-1);
    dentro.scale.setScalar(1 / lado);
    g.add(dentro);
    g.traverse(o => {
      if (o.isMesh) {
        o.frustumCulled = false;
        o.renderOrder = 72;
        o.material.depthTest = true;
      }
    });
    g.userData.pj = pj;
    return g;
  }
  return {
    modelo: modelo,
    tiene: k => !!filas.get(k)?.modelo
  };
}
