// SH4 web — FeniXVOID · Project Ravenlight
import { partesBin } from "../lib/sh4bin.js";

import { leerMundo } from "../lib/mundo.js";

import { leerTexturas, aRGBA } from "../lib/texturas.js";

import { leerColision } from "../lib/colision.js";

import { leerLuces, leerNiebla } from "../lib/luces.js";

export const ESCALA = .005;

function texturaThree(THREE, img) {
  const t = new THREE.DataTexture(aRGBA(img), img.ancho, img.alto, THREE.RGBAFormat);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  t.anisotropy = 4;
  t.needsUpdate = true;
  return t;
}

export async function armarSala(THREE, bajar, nombre, globales = new Map) {
  const buf = await bajar("data/" + nombre + ".bin");
  const partes = partesBin(buf);
  const bancos = [ [], [] ];
  for (const p of partes) if (p.tipo === "texturas") bancos[0].push(leerTexturas(buf, p.ofs, p.len));
  const mu = nombre.slice(0, 2);
  if (!globales.has(mu)) {
    const lista = [];
    try {
      const gb = await bajar("data/" + mu + "gb.bin");
      for (const p of partesBin(gb)) if (p.tipo === "texturas") lista.push(leerTexturas(gb, p.ofs, p.len));
    } catch {}
    globales.set(mu, lista);
  }
  bancos[1] = globales.get(mu);
  const grupo = new THREE.Group;
  grupo.name = "sala_" + nombre;
  const cache = new Map;
  let piezas = 0, tris = 0;
  for (const p of partes) {
    if (p.tipo !== "mundo") continue;
    const antes = partes.filter(x => x.tipo === "texturas" && x.indice < p.indice).length;
    const local = bancos[0][Math.max(0, antes - 1)] || [];
    for (const z of leerMundo(buf, p.ofs, p.len).piezas) {
      const banco = z.banco ? bancos[1][0] || [] : local;
      const img = banco[z.textura - 1]?.[z.paleta] || banco[z.textura - 1]?.[0];
      const clave = (z.banco ? "g" : "l" + antes) + ":" + z.textura + ":" + z.paleta;
      let tex = cache.get(clave);
      if (tex === undefined) {
        tex = img ? texturaThree(THREE, img) : null;
        cache.set(clave, tex);
      }
      const g = new THREE.BufferGeometry;
      const pos = new Float32Array(z.pos.length);
      for (let i = 0; i < pos.length; i += 3) {
        pos[i] = -z.pos[i] * ESCALA;
        pos[i + 1] = -z.pos[i + 1] * ESCALA;
        pos[i + 2] = z.pos[i + 2] * ESCALA;
      }
      g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      const col = new Float32Array(z.col.length);
      for (let i = 0; i < col.length; i++) col[i] = Math.min(2, z.col[i] * 255 / 128);
      g.setAttribute("color", new THREE.BufferAttribute(col, 4));
      g.setAttribute("uv", new THREE.BufferAttribute(z.uv, 2));
      g.setIndex(new THREE.BufferAttribute(z.indices, 1));
      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        vertexColors: true,
        side: THREE.DoubleSide,
        alphaTest: .3
      });
      if (z.grupo !== "normal") {
        mat.transparent = true;
        mat.depthWrite = false;
        mat.alphaTest = .01;
        mat.polygonOffset = true;
        mat.polygonOffsetFactor = -1;
        mat.polygonOffsetUnits = -2;
      }
      const malla = new THREE.Mesh(g, mat);
      if (z.grupo === "calco") malla.renderOrder = 1;
      if (z.grupo === "transparente") malla.renderOrder = 2;
      grupo.add(malla);
      piezas++;
      tris += z.indices.length / 3;
    }
  }
  let colision = null;
  for (const p of partes) {
    if (p.tipo !== "colision") continue;
    const c = leerColision(buf, p.ofs, p.len);
    if (!c) continue;
    const pos = [];
    for (const poli of c.polis) {
      const v = poli.v.map((x, i) => (i % 3 === 2 ? x : -x) * ESCALA);
      for (let k = 1; k + 1 < v.length / 3; k++) pos.push(...v.slice(0, 3), ...v.slice(k * 3, k * 3 + 3), ...v.slice(k * 3 + 3, k * 3 + 6));
    }
    const g = new THREE.BufferGeometry;
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    colision = new THREE.Mesh(g, new THREE.MeshBasicMaterial({
      color: 65382,
      wireframe: true,
      side: THREE.DoubleSide
    }));
    colision.visible = false;
    grupo.add(colision);
  }
  const luces = [];
  let niebla = null;
  for (const p of partes) {
    if (p.tipo === "luces") luces.push(...leerLuces(buf, p.ofs, p.len));
    if (p.tipo === "niebla" && !niebla) niebla = leerNiebla(buf, p.ofs, p.len);
  }
  return {
    nombre: nombre,
    grupo: grupo,
    colision: colision,
    luces: luces,
    niebla: niebla,
    piezas: piezas,
    triangulos: tris,
    texturas: cache.size,
    dispose() {
      grupo.traverse(o => {
        o.geometry?.dispose();
        o.material?.dispose();
      });
      for (const t of cache.values()) t?.dispose();
    }
  };
}
