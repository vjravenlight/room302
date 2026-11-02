// SH4 web — FeniXVOID · Project Ravenlight
import * as THREE from "three";

import { armarSala } from "../lib/sala.js";

import { armarSala as armarAntes1 } from "./sala_antes.js";

import { armarSala as armarAntes2 } from "./sala_antes2.js";

const q = new URLSearchParams(location.search);

const nombre = q.get("sala") || "rl00a";

const armarAntes = q.get("antes") === "2" ? (T, b, n) => armarAntes2(T, b, n, new Map, {
  mipmaps: !q.has("sinmip")
}) : armarAntes1;

const bajar = async r => {
  const x = await fetch("/juego/" + r);
  if (!x.ok) throw new Error(r);
  return x.arrayBuffer();
};

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  preserveDrawingBuffer: true
});

renderer.setSize(innerWidth, innerHeight);

renderer.outputColorSpace = THREE.SRGBColorSpace;

renderer.setScissorTest(true);

document.body.appendChild(renderer.domElement);

const camara = new THREE.PerspectiveCamera(+(q.get("fov") || 60), innerWidth / 2 / innerHeight, .02, 400);

const [antes, ahora] = await Promise.all([ armarAntes(THREE, bajar, nombre), armarSala(THREE, bajar, nombre, new Map, {
  mipmaps: !q.has("sinmip")
}) ]);

const eA = new THREE.Scene, eD = new THREE.Scene;

eA.add(antes.grupo);

eD.add(ahora.grupo);

eD.background = (new THREE.Color).setRGB(...ahora.nieblaSala.activa ? ahora.colorFondo : [ 0, 0, 0 ], THREE.SRGBColorSpace);

if (q.has("sinniebla")) ahora.nieblaSala.activar(false);

for (const [k, g] of [ [ "soloA", antes.grupo ], [ "soloD", ahora.grupo ] ]) {
  if (!q.get(k)) continue;
  const si = q.get(k).split(",").map(Number);
  if (k === "soloA") {
    let i = 0;
  }
  g.traverse(o => {
    const n = o.userData?.modeloMundo ?? (o.name?.startsWith("mundo_") ? +o.name.slice(6) : null);
    if (o.isMesh && n != null) o.visible = si.includes(n);
  });
}

const v = s => s.split(",").map(Number);

let ojo, mira;

if (q.get("cam")) {
  ojo = new THREE.Vector3(...v(q.get("cam")));
  mira = new THREE.Vector3(...v(q.get("mira") || "0,0,0"));
} else {
  const calcos = [];
  ahora.grupo.traverse(m => {
    if (m.isMesh && m.userData.grupo === (q.get("grupo") || "calco")) {
      m.geometry.computeBoundingBox();
      const t = m.geometry.boundingBox.getSize(new THREE.Vector3);
      calcos.push({
        m: m,
        area: t.x * t.z + t.x * t.y + t.y * t.z
      });
    }
  });
  calcos.sort((a, b) => b.area - a.area);
  const c = calcos[+(q.get("calco") || 0)]?.m;
  const caja = (new THREE.Box3).setFromObject(ahora.colision || ahora.grupo), centro = caja.getCenter(new THREE.Vector3);
  mira = c ? c.geometry.boundingBox.getCenter(new THREE.Vector3) : centro.clone();
  ojo = centro.clone();
  ojo.y = caja.min.y + 1.6;
  const d = (new THREE.Vector3).subVectors(ojo, mira);
  d.y = 0;
  if (d.length() < 1.5) ojo.addScaledVector(d.normalize(), 1.5 - d.length());
}

camara.position.copy(ojo);

camara.lookAt(mira);

if (q.has("mapa")) {
  const caja = (new THREE.Box3).setFromObject(ahora.colision || ahora.grupo);
  const c = caja.getCenter(new THREE.Vector3), t = caja.getSize(new THREE.Vector3);
  const asp = innerWidth / innerHeight, m = Math.max(t.x / asp, t.z) / 2 * 1.05;
  const orto = new THREE.OrthographicCamera(-m * asp, m * asp, m, -m, .01, 50);
  orto.position.set(c.x, caja.min.y + +(q.get("mapa") || 2.2), c.z);
  orto.up.set(0, 0, -1);
  orto.lookAt(c.x, -100, c.z);
  ahora.nieblaSala.activar(false);
  const grilla = new THREE.GridHelper(60, 60, 16711680, 8930372);
  grilla.position.set(Math.round(c.x), caja.min.y + .05, Math.round(c.z));
  eD.add(grilla);
  renderer.setScissorTest(false);
  renderer.setViewport(0, 0, innerWidth, innerHeight);
  renderer.render(eD, orto);
  document.getElementById("a").textContent = `planta de ${nombre}: x de ${(c.x - m * asp).toFixed(1)} a ${(c.x + m * asp).toFixed(1)} (izq→der), z de ${(c.z - m).toFixed(1)} (arriba) a ${(c.z + m).toFixed(1)} (abajo); grilla 1 m, línea roja = x ${Math.round(c.x)} / z ${Math.round(c.z)}`;
  document.getElementById("d").remove();
  window.listo = {
    mapa: true
  };
  throw new Error("listo (mapa)");
}

if (q.get("antes") === "2") document.getElementById("a").textContent = "ANTES (sin ubicar los modelos de objetos)";

const W = innerWidth / 2, H = innerHeight;

renderer.setViewport(0, 0, W, H);

renderer.setScissor(0, 0, W, H);

renderer.render(eA, camara);

renderer.setViewport(W, 0, W, H);

renderer.setScissor(W, 0, W, H);

renderer.render(eD, camara);

const n = ahora.nieblaJuego;

document.getElementById("info").textContent = `${nombre}  cam=${ojo.toArray().map(x => x.toFixed(2))}  mira=${mira.toArray().map(x => x.toFixed(2))}` + `  niebla ${n.porDefecto ? "(la de siempre)" : ""} ${n.cerca}-${n.lejos} pot ${n.potCerca}/${n.potLejos} rgb(${n.color})  a 2 m queda ${(ahora.nieblaSala.visibilidad(2) * 100).toFixed(0)} % del color`;

window.listo = {
  sala: nombre,
  piezas: ahora.piezas,
  ojo: ojo.toArray(),
  mira: mira.toArray(),
  ocultos: ahora.modelosOcultos,
  luzDinamica: {
    piezas: ahora.luzDinamica?.piezas,
    luces: ahora.luzDinamica?.luces.length
  }
};
