// SH4 web — FeniXVOID · Project Ravenlight
import * as THREE from "three";

import { partesBin } from "./lib/sh4bin.js";

import { leerModelo } from "./lib/modelo.js";

import { leerTexturas } from "./lib/texturas.js";

import { leerAnimacion } from "./lib/animacion.js";

import { crearPersonaje } from "./lib/personaje.js";

import { SIN_USAR, TODOS } from "./modo_juego/escalera_sin_usar.js";

const q = new URLSearchParams(location.search);

const quieto = q.has("quieto");

const $ = id => document.getElementById(id);

const lienzo = $("lienzo");

const renderer = new THREE.WebGLRenderer({
  canvas: lienzo,
  antialias: true,
  preserveDrawingBuffer: quieto,
  alpha: true
});

renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

renderer.setClearColor(0, 0);

renderer.setScissorTest(true);

const QUE = {
  3: "nicho B (al lado del de st04)",
  4: "nicho A (el de st03)",
  5: "nicho A (el de st03), sin giro",
  8: "nicho A, 2.800 unidades más arriba",
  9: "nicho A, un poco al costado",
  10: "nicho A (el de st03)",
  11: "nicho A, 300 unidades más arriba",
  12: "nicho B (al lado del de st04)",
  1: "lo que cae por el hueco de st02: el azar nunca lo elige"
};

const celdas = [];

function celda(def, info) {
  const div = document.createElement("div");
  div.className = "celda" + (def.uso === "si" || def.uso === "cae" ? " usada" : "");
  const vista = document.createElement("div");
  vista.className = "vista";
  const r = document.createElement("div");
  r.className = "rotulo";
  const anim = def.a != null ? ` · animación #${def.a}` + (def.otras ? ` (+ #${def.otras.join(", #")})` : "") + ` (${info.cuadros} cuadros)` : " · sin animación";
  const uso = def.uso === "si" ? "la arma el juego" : def.uso === "cae" ? "cae por el hueco de st02" : "el juego nunca la arma";
  const fila = def.fila != null ? ` · fila ${def.fila}` : "";
  const que = def.uso === "no" && def.fila != null && QUE[def.fila] ? QUE[def.fila] + " · " : "";
  r.innerHTML = `<b>${def.arch} #${def.m}</b>${fila} · ${info.huesos} huesos · texturas #${def.t}${anim}<span class="chico">${uso}${def.nota ? " · " + def.nota : ""}<br>${que}${info.alto} m de alto</span>`;
  div.append(vista, r);
  $("grilla").appendChild(div);
  return vista;
}

const bins = new Map;

async function bin(nombre) {
  if (!bins.has(nombre)) bins.set(nombre, fetch("/juego/data/" + nombre + ".bin").then(r => {
    if (!r.ok) throw new Error("HTTP " + r.status);
    return r.arrayBuffer();
  }).then(b => ({
    b: b,
    p: partesBin(b)
  })));
  return bins.get(nombre);
}

async function iniciar() {
  for (const def of TODOS) {
    const {b: buf, p: p} = await bin(def.arch);
    const modelo = leerModelo(buf, p[def.m].ofs, p[def.m].len);
    const anim = def.a != null ? leerAnimacion(buf, p[def.a].ofs, p[def.a].len) : null;
    const esc = new THREE.Scene;
    esc.add(new THREE.HemisphereLight(14209220, 2760728, 1.6));
    const sol = new THREE.DirectionalLight(16773856, 2.2);
    sol.position.set(1, 2, 2);
    esc.add(sol);
    const pj = crearPersonaje(modelo, leerTexturas(buf, p[def.t].ofs, p[def.t].len));
    if (anim) {
      pj.poner(anim);
      pj.reproductor.loop = true;
    }
    pj.actualizar(q.has("t") ? +q.get("t") : 0);
    esc.add(pj.grupo);
    pj.grupo.updateMatrixWorld(true);
    const caja = (new THREE.Box3).setFromObject(pj.grupo, true);
    const centro = caja.getCenter(new THREE.Vector3), tam = caja.getSize(new THREE.Vector3);
    const radio = Math.max(tam.x, tam.y, tam.z) * .62 || 1;
    const cam = new THREE.PerspectiveCamera(35, 1, radio / 50, radio * 50);
    const info = {
      huesos: modelo.huesos.length,
      cuadros: anim?.duracion ?? 0,
      alto: tam.y.toFixed(1).replace(".", ",")
    };
    const vista = celda(def, info);
    celdas.push({
      vista: vista,
      esc: esc,
      cam: cam,
      pj: pj,
      centro: centro,
      radio: radio,
      ang: 0,
      def: def,
      alto: tam.y,
      info: info
    });
  }
  $("estado").textContent = `${TODOS.length} modelos con esqueleto en los archivos de la escalera: ${TODOS.filter(d => d.uso === "no").length} que el juego nunca arma y ${TODOS.filter(d => d.uso !== "no").length} que sí (en verde) · 30 cuadros por segundo, como el juego.`;
  dibujar(0);
}

const girar = q.get("girar") !== "0" && !quieto;

function dibujar(dt) {
  const W = innerWidth, H = innerHeight;
  if (lienzo.width !== Math.floor(W * renderer.getPixelRatio()) || lienzo.height !== Math.floor(H * renderer.getPixelRatio())) renderer.setSize(W, H, false);
  renderer.setScissor(0, 0, W, H);
  renderer.setViewport(0, 0, W, H);
  renderer.clear();
  for (const c of celdas) {
    const r = c.vista.getBoundingClientRect();
    if (r.bottom < 0 || r.top > H || r.right < 0 || r.left > W) continue;
    if (dt) c.pj.actualizar(dt);
    if (girar) c.ang += dt * .35;
    const d = c.radio / Math.tan(35 * Math.PI / 360);
    c.cam.position.set(c.centro.x + Math.sin(c.ang) * d, c.centro.y + c.radio * .15, c.centro.z + Math.cos(c.ang) * d);
    c.cam.lookAt(c.centro);
    c.cam.aspect = r.width / r.height;
    c.cam.updateProjectionMatrix();
    const y = H - r.bottom;
    renderer.setViewport(r.left, y, r.width, r.height);
    renderer.setScissor(r.left, y, r.width, r.height);
    renderer.render(c.esc, c.cam);
  }
}

window.sh4 = {
  redibujar: () => dibujar(1 / 30),
  celdas: celdas,
  listo: false
};

iniciar().then(() => {
  window.sh4.listo = true;
}).catch(e => {
  $("estado").textContent = "No pude leer st_all.bin: " + e.message;
  console.error(e);
});

if (!quieto) {
  let antes = performance.now();
  renderer.setAnimationLoop(() => {
    const a = performance.now();
    dibujar(Math.min(.1, (a - antes) / 1e3));
    antes = a;
  });
}
