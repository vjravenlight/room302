// SH4 web — FeniXVOID · Project Ravenlight
import { partesBin } from "../lib/sh4bin.js";

import { leerModelo } from "../lib/modelo.js";

import { leerTexturas } from "../lib/texturas.js";

import { crearPersonaje } from "../lib/personaje.js";

export const HUESO_MANO = 25;

export function crearArmas({THREE: THREE, henry: henry, datos: datos}) {
  let buf = null, partes = null, actual = null, item = 0;
  const cache = new Map;
  async function bin() {
    if (!buf) {
      buf = await (await fetch("/juego/data/wp_model.bin")).arrayBuffer();
      partes = partesBin(buf);
    }
    return buf;
  }
  async function modelo(k) {
    if (cache.has(k)) return cache.get(k);
    const a = datos.arma(k);
    if (!a?.modelo?.model) {
      cache.set(k, null);
      return null;
    }
    await bin();
    const pm = partes[a.modelo.model.parte], pt = a.modelo.tex ? partes[a.modelo.tex.parte] : null;
    const mod = leerModelo(buf, pm.ofs, pm.len);
    const texs = pt ? leerTexturas(buf, pt.ofs, pt.len) : [];
    const pj = crearPersonaje(mod, texs, {
      escala: 1
    });
    const g = pj.contenedor;
    g.rotation.set(0, 0, 0);
    g.scale.setScalar(1);
    g.name = "arma_" + k;
    const caja = new THREE.Box3;
    for (const s of mod.partes) for (let i = 0; i < s.pos.length; i += 3) caja.expandByPoint(new THREE.Vector3(s.pos[i], s.pos[i + 1], s.pos[i + 2]));
    const aj = datos.cajaGolpe(k);
    const centro = caja.getCenter(new THREE.Vector3).add(new THREE.Vector3(aj.desplazar[0], aj.desplazar[1], aj.desplazar[2]));
    const medio = caja.getSize(new THREE.Vector3).multiplyScalar(.5).multiply(new THREE.Vector3(aj.escala[0], aj.escala[1], aj.escala[2]));
    const r = {
      k: k,
      grupo: g,
      pj: pj,
      centro: centro,
      medio: medio
    };
    cache.set(k, r);
    return r;
  }
  const copias = new Map;
  async function copia(k) {
    if (!k) return null;
    if (copias.has(k)) return copias.get(k);
    const a = datos.arma(k);
    if (!a?.modelo?.model) {
      copias.set(k, null);
      return null;
    }
    await bin();
    const pm = partes[a.modelo.model.parte], pt = a.modelo.tex ? partes[a.modelo.tex.parte] : null;
    const mod = leerModelo(buf, pm.ofs, pm.len);
    const pj = crearPersonaje(mod, pt ? leerTexturas(buf, pt.ofs, pt.len) : [], {
      escala: 1
    });
    const g = pj.contenedor;
    g.rotation.set(0, 0, 0);
    g.scale.setScalar(1);
    g.name = "copia_arma_" + k;
    const caja = new THREE.Box3;
    for (const s of mod.partes) for (let i = 0; i < s.pos.length; i += 3) caja.expandByPoint(new THREE.Vector3(s.pos[i], s.pos[i + 1], s.pos[i + 2]));
    const tam = caja.getSize(new THREE.Vector3);
    const orden = [ 0, 1, 2 ].sort((a, b) => tam.getComponent(b) - tam.getComponent(a));
    const lado = j => Math.abs(caja.max.getComponent(j)) >= Math.abs(caja.min.getComponent(j)) ? caja.max.getComponent(j) : caja.min.getComponent(j);
    const i = orden[0], j = orden[1];
    const lejos = lado(i);
    const eje = (new THREE.Vector3).setComponent(i, Math.sign(lejos) || 1);
    const eje2 = (new THREE.Vector3).setComponent(j, Math.sign(lado(j)) || 1);
    const punta = caja.getCenter(new THREE.Vector3).setComponent(i, lejos);
    const r = {
      k: k,
      grupo: g,
      pj: pj,
      caja: caja,
      eje: eje,
      eje2: eje2,
      punta: punta,
      largo: Math.abs(lejos),
      medio: tam.clone().multiplyScalar(.5),
      centro: caja.getCenter(new THREE.Vector3)
    };
    copias.set(k, r);
    return r;
  }
  return {
    copia: copia,
    get item() {
      return item;
    },
    get actual() {
      return actual;
    },
    async equipar(k) {
      if (actual) actual.grupo.parent?.remove(actual.grupo);
      actual = null;
      item = k || 0;
      if (!k) return null;
      const m = await modelo(k);
      if (item !== k) return null;
      actual = m;
      if (m) henry.huesos[HUESO_MANO].add(m.grupo);
      return m;
    },
    cajaMundo(out = {}) {
      if (!actual) return null;
      const hueso = henry.huesos[HUESO_MANO];
      hueso.updateWorldMatrix(true, false);
      const M = hueso.matrixWorld;
      out.centro = (out.centro || new THREE.Vector3).copy(actual.centro).applyMatrix4(M);
      out.ejes = out.ejes || [ new THREE.Vector3, new THREE.Vector3, new THREE.Vector3 ];
      const e = M.elements;
      for (let i = 0; i < 3; i++) out.ejes[i].set(e[i * 4], e[i * 4 + 1], e[i * 4 + 2]).multiplyScalar(actual.medio.getComponent(i));
      return out;
    }
  };
}

export function cajaTocaEsfera(caja, c, r) {
  const d = c.clone().sub(caja.centro);
  const p = caja.centro.clone();
  for (const e of caja.ejes) {
    const l = e.length();
    if (l < 1e-9) continue;
    const u = e.clone().divideScalar(l);
    const t = Math.max(-l, Math.min(l, d.dot(u)));
    p.addScaledVector(u, t);
  }
  return p.distanceToSquared(c) <= r * r;
}
