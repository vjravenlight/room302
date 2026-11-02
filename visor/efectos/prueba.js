// SH4 web — FeniXVOID · Project Ravenlight
import * as THREE from "three";

import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";

import { VRButton } from "three/addons/webxr/VRButton.js";

import { partesBin } from "../lib/sh4bin.js";

import { leerMundo } from "../lib/mundo.js";

import { leerTexturas, aRGBA } from "../lib/texturas.js";

import { leerColision } from "../lib/colision.js";

import { leerLuces, leerNiebla } from "../lib/luces.js";

import { leerModelo } from "../lib/modelo.js";

import { leerAnimacion } from "../lib/animacion.js";

import { iniciarEfectos } from "./efectos.js";

import { leerTanm, crearTanm } from "./tanm.js";

const ESCALA = .005;

const q = new URLSearchParams(location.search);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  preserveDrawingBuffer: q.has("quieto"),
  stencil: true
});

renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

renderer.setSize(innerWidth, innerHeight);

renderer.outputColorSpace = THREE.SRGBColorSpace;

renderer.xr.enabled = true;

document.body.appendChild(renderer.domElement);

if (!q.has("limpio")) document.body.appendChild(VRButton.createButton(renderer));

const escena = new THREE.Scene;

escena.background = new THREE.Color(0);

const camara = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, .02, 400);

const jugador = new THREE.Group;

jugador.add(camara);

escena.add(jugador);

const controles = new PointerLockControls(camara, renderer.domElement);

renderer.domElement.addEventListener("click", () => controles.lock());

addEventListener("resize", () => {
  camara.aspect = innerWidth / innerHeight;
  camara.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

const estado = t => {
  document.getElementById("estado").textContent = t;
};

const bajar = async r => {
  const x = await fetch("/juego/" + r);
  if (!x.ok) throw new Error("no pude leer " + r);
  return x.arrayBuffer();
};

function texturaThree(img) {
  const t = new THREE.DataTexture(aRGBA(img), img.ancho, img.alto, THREE.RGBAFormat);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  t.needsUpdate = true;
  return t;
}

const sala = new THREE.Group;

escena.add(sala);

const info = {
  sala: null
};

let sucio = 3;

const redibujar = () => {
  sucio = 2;
};

const fx = iniciarEfectos({
  THREE: THREE,
  renderer: renderer,
  escena: escena,
  camara: camara,
  sala: sala,
  info: info,
  escala: ESCALA
});

window.sh4p = {
  fx: fx,
  info: info,
  escena: escena,
  camara: camara,
  jugador: jugador,
  renderer: renderer,
  THREE: THREE
};

async function cargarSala(nombre) {
  sala.clear();
  const buf = await bajar("data/" + nombre + ".bin");
  const partes = partesBin(buf);
  const bancos = [ [], [] ];
  for (const p of partes) if (p.tipo === "texturas") bancos[0].push(leerTexturas(buf, p.ofs, p.len));
  try {
    const gb = await bajar("data/" + nombre.slice(0, 2) + "gb.bin");
    for (const p of partesBin(gb)) if (p.tipo === "texturas") bancos[1].push(leerTexturas(gb, p.ofs, p.len));
  } catch {}
  const cache = new Map;
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
        tex = img ? texturaThree(img) : null;
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
      const m = new THREE.Mesh(g, mat);
      m.userData = {
        grupo: z.grupo,
        tex: tex,
        img: img,
        matOriginal: mat
      };
      if (z.grupo === "calco") m.renderOrder = 1;
      if (z.grupo === "transparente") m.renderOrder = 2;
      sala.add(m);
    }
  }
  info.luces = [];
  info.niebla = null;
  for (const p of partes) {
    if (p.tipo === "luces") info.luces.push(...leerLuces(buf, p.ofs, p.len));
    if (p.tipo === "niebla" && !info.niebla) info.niebla = leerNiebla(buf, p.ofs, p.len);
  }
  info.sala = nombre;
  const cam = q.get("cam")?.split(",").map(Number);
  if (cam?.length >= 3) jugador.position.set(cam[0], cam[1], cam[2]);
  camara.rotation.set((cam?.[4] || 0) * Math.PI / 180, (cam?.[3] || 0) * Math.PI / 180, 0, "YXZ");
  if (q.get("mitad")) fx.opciones({
    mitad: +q.get("mitad")
  });
  if (q.has("sin")) fx.opciones({
    niebla: false,
    ruido: false,
    texFog: false,
    auto: false
  });
  fx.alCargarSala(nombre);
  info.lista = true;
  redibujar();
}

let tanm = null;

async function ponerModelo(arch, parte) {
  const buf = await bajar("data/" + arch);
  const ps = partesBin(buf), p = ps.find(x => x.indice === parte), tp = ps.filter(x => x.tipo === "texturas" && x.indice < parte).pop() || ps.find(x => x.tipo === "texturas");
  const m = leerModelo(buf, p.ofs, p.len), texs = tp ? leerTexturas(buf, tp.ofs, tp.len) : [];
  const g = new THREE.Group;
  const mallas = [];
  for (const s of m.partes) {
    const geo = new THREE.BufferGeometry;
    const pos = new Float32Array(s.pos.length);
    for (let i = 0; i < pos.length; i += 3) {
      pos[i] = -s.pos[i] * ESCALA;
      pos[i + 1] = -s.pos[i + 1] * ESCALA;
      pos[i + 2] = s.pos[i + 2] * ESCALA;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("uv", new THREE.BufferAttribute(s.uv, 2));
    geo.setIndex(new THREE.BufferAttribute(s.indices, 1));
    const img = s.textura && (texs[s.textura.grupo]?.[s.textura.sub] || texs[s.textura.grupo]?.[0]);
    const malla = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      map: img ? texturaThree(img) : null,
      side: THREE.DoubleSide,
      transparent: true,
      alphaTest: .05,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    }));
    g.add(malla);
    mallas.push(malla);
  }
  const pa = ps.find(x => x.indice === parte + 1 && x.tipo === "animacion");
  const anim = pa ? leerAnimacion(buf, pa.ofs, pa.len) : null;
  tanm = crearTanm({
    modelo: m,
    tanm: leerTanm(buf, p.ofs, p.len),
    mallas: mallas,
    anim: anim
  });
  const caja = (new THREE.Box3).setFromObject(g), c = caja.getCenter(new THREE.Vector3);
  g.position.sub(c);
  const d = new THREE.Vector3;
  camara.getWorldDirection(d);
  g.position.add(jugador.position.clone().addScaledVector(d, 1.5));
  escena.add(g);
  window.sh4p.tanm = tanm;
}

const teclas = {};

addEventListener("keydown", e => {
  teclas[e.code] = true;
});

addEventListener("keyup", e => {
  teclas[e.code] = false;
});

const reloj = new THREE.Clock, adelante = new THREE.Vector3, costado = new THREE.Vector3;

const quieto = q.has("quieto");

renderer.setAnimationLoop(() => {
  if (quieto) {
    if (sucio <= 0) return;
    sucio--;
  }
  const dt = quieto ? 0 : Math.min(reloj.getDelta(), .1);
  const v = (teclas.ShiftLeft ? 4 : 1.6) * dt;
  camara.getWorldDirection(adelante);
  adelante.y = 0;
  adelante.normalize();
  costado.crossVectors(adelante, camara.up).normalize();
  if (teclas.KeyW) jugador.position.addScaledVector(adelante, v);
  if (teclas.KeyS) jugador.position.addScaledVector(adelante, -v);
  if (teclas.KeyD) jugador.position.addScaledVector(costado, v);
  if (teclas.KeyA) jugador.position.addScaledVector(costado, -v);
  if (teclas.KeyE) jugador.position.y += v;
  if (teclas.KeyQ) jugador.position.y -= v;
  if (!quieto) {
    fx.actualizar(dt);
    tanm?.actualizar(dt);
  }
  renderer.render(escena, camara);
});

window.sh4p.avanzar = s => {
  const n = Math.round(s * 30);
  camara.updateMatrixWorld(true);
  for (let i = 0; i < n; i++) {
    fx.actualizar(1 / 30);
    tanm?.actualizar(1 / 30);
  }
  redibujar();
  return n;
};

window.sh4p.redibujar = redibujar;

window.sh4p.centroSala = () => {
  const b = (new THREE.Box3).setFromObject(sala), c = b.getCenter(new THREE.Vector3);
  return [ -c.x / ESCALA, -(b.min.y / ESCALA) - 20, c.z / ESCALA ];
};

window.sh4p.enfocar = (p, dist = 1.5, alto = 1.2, giro = 0, incl = null) => {
  const t = new THREE.Vector3(-p[0] * ESCALA, -p[1] * ESCALA, p[2] * ESCALA), g = giro * Math.PI / 180;
  jugador.position.set(t.x + Math.sin(g) * dist, t.y + alto, t.z + Math.cos(g) * dist);
  const inc = incl ?? -Math.atan2(alto - .4, dist) * 180 / Math.PI;
  camara.rotation.set(inc * Math.PI / 180, g, 0, "YXZ");
  camara.updateMatrixWorld(true);
  redibujar();
};

window.sh4p.disparar = (n, o) => {
  const r = fx.disparar(n, o);
  redibujar();
  return !!r;
};

(async () => {
  try {
    await cargarSala(q.get("sala") || "rl00a");
    await fx.listo;
    const op = q.get("op") ? JSON.parse(q.get("op")) : {};
    if (op.pos === "centro") op.pos = window.sh4p.centroSala();
    const enf = q.get("enfocar")?.split(",").map(Number);
    if (enf && Array.isArray(op.pos)) window.sh4p.enfocar(op.pos, ...enf);
    for (const e of (q.get("efecto") || "").split(",").filter(Boolean)) if (!q.has("sin")) fx.disparar(e, op);
    const mod = q.get("modelo")?.split(",");
    if (mod) await ponerModelo(mod[0], +mod[1]);
    await new Promise(r => setTimeout(r, 500));
    if (q.get("t")) window.sh4p.avanzar(+q.get("t"));
    info.efectosListos = true;
    estado(`${info.sala} · ${q.has("sin") ? "SIN efectos" : "efectos: " + (q.get("efecto") || "los de la sala")} · ` + JSON.stringify(fx.estado.filtros.actual));
    redibujar();
  } catch (e) {
    estado("error: " + e.message);
    console.error(e);
  }
})();
