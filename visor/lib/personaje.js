// SH4 web — FeniXVOID · Project Ravenlight
import * as THREE from "three";

import { crearEsqueleto, Reproductor } from "./animacion.js";

import { aRGBA, ampliarSuave } from "./texturas.js";

import { registrarRedondeo } from "./suavizar_malla.js";

import { parcharMaterialPersonaje, prepararPersonaje, quitarSombraPersonaje } from "./luz_personajes.js";

export const ESCALA = .005;

const SUAVIZAR = typeof location === "undefined" || !new URLSearchParams(location.search).has("sinsuavizar");

function texturaThree(img) {
  let rgba = aRGBA(img), w = img.ancho, h = img.alto;
  if (SUAVIZAR && Math.max(w, h) <= 256 && w >= 8 && h >= 8) ({datos: rgba, ancho: w, alto: h} = ampliarSuave(rgba, w, h, 2));
  const t = new THREE.DataTexture(rgba, w, h, THREE.RGBAFormat);
  t.magFilter = THREE.LinearFilter;
  t.anisotropy = 4;
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  t.needsUpdate = true;
  return t;
}

const SOLDAR = typeof location === "undefined" || !new URLSearchParams(location.search).has("sinsoldar");

function soldarNormales(partes) {
  const grupos = new Map;
  partes.forEach((s, ip) => {
    const n = s.pos.length / 3;
    for (let i = 0; i < n; i++) {
      const k = Math.round(s.pos[i * 3] * 4) + "," + Math.round(s.pos[i * 3 + 1] * 4) + "," + Math.round(s.pos[i * 3 + 2] * 4) + ":" + s.hueso[i * 4] + "/" + s.hueso[i * 4 + 1] + "/" + s.hueso[i * 4 + 2] + "/" + s.hueso[i * 4 + 3];
      let g = grupos.get(k);
      if (!g) grupos.set(k, g = []);
      g.push(ip, i);
    }
  });
  const out = partes.map(s => new Float32Array(s.nor));
  for (const g of grupos.values()) {
    if (g.length < 4) continue;
    for (let a = 0; a < g.length; a += 2) {
      const na = partes[g[a]].nor, ia = g[a + 1] * 3;
      let x = 0, y = 0, z = 0;
      for (let b = 0; b < g.length; b += 2) {
        const nb = partes[g[b]].nor, ib = g[b + 1] * 3;
        if (na[ia] * nb[ib] + na[ia + 1] * nb[ib + 1] + na[ia + 2] * nb[ib + 2] < .35) continue;
        x += nb[ib];
        y += nb[ib + 1];
        z += nb[ib + 2];
      }
      const l = Math.hypot(x, y, z) || 1;
      out[g[a]][ia] = x / l;
      out[g[a]][ia + 1] = y / l;
      out[g[a]][ia + 2] = z / l;
    }
  }
  return out;
}

function sinVueltaPorCara(m) {
  if (typeof location !== "undefined" && new URLSearchParams(location.search).has("conparches")) return m;
  m.userData.sh4SinVuelta = true;
  m.onBeforeCompile = sh => {
    sh.fragmentShader = sh.fragmentShader.replace("#include <normal_fragment_begin>", `#include <normal_fragment_begin>\n#ifdef DOUBLE_SIDED\n\tnormal *= faceDirection;\n#endif`);
  };
  m.customProgramCacheKey = () => "sh4SinVuelta";
  return m;
}

export function crearPersonaje(modelo, texs = [], opciones = {}) {
  const escala = opciones.escala ?? ESCALA;
  const grupo = new THREE.Group;
  grupo.name = "personaje";
  const juego = new THREE.Group;
  juego.rotation.z = Math.PI;
  juego.scale.setScalar(escala);
  grupo.add(juego);
  const esq = crearEsqueleto(modelo);
  const huesos = [];
  for (let i = 0; i < esq.n; i++) {
    const b = new THREE.Bone;
    b.name = "hueso_" + i;
    b.matrixAutoUpdate = false;
    b.matrix.fromArray(modelo.huesos[i].matriz);
    juego.add(b);
    huesos.push(b);
  }
  grupo.updateMatrixWorld(true);
  const esqueleto = new THREE.Skeleton(huesos);
  const cache = new Map, mallas = [];
  const normales = SOLDAR ? soldarNormales(modelo.partes) : modelo.partes.map(s => s.nor);
  for (const [ip, s] of modelo.partes.entries()) {
    const g = new THREE.BufferGeometry;
    g.setAttribute("position", new THREE.BufferAttribute(s.pos, 3));
    g.setAttribute("normal", new THREE.BufferAttribute(opciones.material ? normales[ip] : normales[ip].map(v => -v), 3));
    g.setAttribute("uv", new THREE.BufferAttribute(s.uv, 2));
    const nV = s.pos.length / 3, idx = new Uint16Array(nV * 4), pes = new Float32Array(nV * 4);
    for (let i = 0; i < nV; i++) {
      let suma = 0;
      for (let k = 0; k < 4; k++) {
        const w = Math.max(0, s.peso[i * 4 + k]);
        suma += w;
      }
      for (let k = 0; k < 4; k++) {
        const w = Math.max(0, s.peso[i * 4 + k]);
        idx[i * 4 + k] = w > 0 && s.hueso[i * 4 + k] < esq.n ? s.hueso[i * 4 + k] : 0;
        pes[i * 4 + k] = suma > 0 ? w / suma : k === 0 ? 1 : 0;
      }
    }
    g.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(idx, 4));
    g.setAttribute("skinWeight", new THREE.Float32BufferAttribute(pes, 4));
    g.setIndex(new THREE.BufferAttribute(s.indices, 1));
    const clave = s.textura ? s.textura.grupo + ":" + s.textura.sub : "-";
    if (!cache.has(clave)) {
      const img = s.textura && (texs[s.textura.grupo]?.[s.textura.sub] || texs[s.textura.grupo]?.[0]);
      cache.set(clave, img ? texturaThree(img) : null);
    }
    const tex = cache.get(clave);
    const mat = parcharMaterialPersonaje(opciones.material ? opciones.material(tex, s) : sinVueltaPorCara(new THREE.MeshLambertMaterial({
      map: tex,
      side: THREE.DoubleSide,
      alphaTest: .3,
      color: tex ? 16777215 : 8939093
    })));
    const malla = new THREE.SkinnedMesh(g, mat);
    malla.frustumCulled = false;
    juego.add(malla);
    malla.updateMatrixWorld(true);
    malla.bind(esqueleto);
    mallas.push(malla);
  }
  const rep = new Reproductor(esq);
  function aplicar(pose) {
    for (let i = 0; i < esq.n; i++) {
      huesos[i].matrix.fromArray(pose.matrices, i * 16);
      huesos[i].matrixWorldNeedsUpdate = true;
    }
  }
  let lineas = null;
  function verHuesos(si) {
    if (!si) {
      if (lineas) lineas.visible = false;
      return;
    }
    if (!lineas) {
      const g = new THREE.BufferGeometry;
      g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(esq.n * 6), 3));
      lineas = new THREE.LineSegments(g, new THREE.LineBasicMaterial({
        color: 16724e3,
        depthTest: false
      }));
      lineas.renderOrder = 10;
      lineas.frustumCulled = false;
      juego.add(lineas);
    }
    lineas.visible = true;
  }
  function actualizarLineas(pose) {
    if (!lineas?.visible) return;
    const a = lineas.geometry.attributes.position.array;
    for (let i = 0; i < esq.n; i++) {
      const p = pose.padres[i] >= 0 ? pose.padres[i] : i;
      a.set(pose.absPos.subarray(i * 3, i * 3 + 3), i * 6);
      a.set(pose.absPos.subarray(p * 3, p * 3 + 3), i * 6 + 3);
    }
    lineas.geometry.attributes.position.needsUpdate = true;
  }
  return prepararPersonaje(registrarRedondeo({
    grupo: grupo,
    contenedor: juego,
    mallas: mallas,
    huesos: huesos,
    esqueleto: esqueleto,
    esq: esq,
    reproductor: rep,
    aplicar: aplicar,
    verHuesos: verHuesos,
    actualizar(dt) {
      const pose = rep.avanzar(dt);
      aplicar(pose);
      actualizarLineas(pose);
      return pose;
    },
    poner(anim, desde = 0) {
      rep.poner(anim, desde);
      return this;
    },
    ubicar(x, y, z, giroJuego = 0) {
      grupo.position.set(-x * escala, -y * escala, z * escala);
      grupo.rotation.set(0, -giroJuego, 0);
      return this;
    },
    dispose() {
      quitarSombraPersonaje(this.sombraJuego);
      for (const m of mallas) {
        m.geometry.dispose();
        m.material.dispose();
      }
      for (const t of cache.values()) t?.dispose();
      esqueleto.dispose();
    }
  }), modelo, opciones);
}
