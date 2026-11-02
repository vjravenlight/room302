// SH4 web — FeniXVOID · Project Ravenlight
import * as THREE from "three";

import { partesBin } from "../lib/sh4bin.js";

import { leerMundo } from "../lib/mundo.js";

import { leerTexturas, aRGBA } from "../lib/texturas.js";

import { leerColision } from "../lib/colision.js";

import { iniciarHenry } from "../henry.js";

import { iniciarCamaraJuego } from "../camara_juego.js";

import { decodificarArg } from "./modos.js";

const ESCALA = .005, OJOS = 1.6;

const q = new URLSearchParams(location.search);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  preserveDrawingBuffer: true
});

renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

renderer.setSize(innerWidth, innerHeight);

renderer.outputColorSpace = THREE.SRGBColorSpace;

document.body.appendChild(renderer.domElement);

const escena = new THREE.Scene;

escena.background = new THREE.Color(0);

const camara = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, .02, 400);

const jugador = new THREE.Group;

jugador.add(camara);

escena.add(jugador);

camara.rotation.order = "YXZ";

escena.add(new THREE.AmbientLight(16777215, 1.5));

addEventListener("resize", () => {
  camara.aspect = innerWidth / innerHeight;
  camara.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  dibujar();
});

const $ = id => document.getElementById(id);

const salaGrupo = new THREE.Group;

escena.add(salaGrupo);

const debug = new THREE.Group;

escena.add(debug);

debug.visible = q.has("areas");

let colision = null, salaNombre = null, datos = null;

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

async function cargarMundo(nombre) {
  salaGrupo.clear();
  colision = null;
  const buf = await bajar("data/" + nombre + ".bin"), partes = partesBin(buf), bancos = [ [], [] ];
  for (const p of partes) if (p.tipo === "texturas") bancos[0].push(leerTexturas(buf, p.ofs, p.len));
  try {
    const gb = await bajar("data/" + nombre.slice(0, 2) + "gb.bin");
    for (const p of partesBin(gb)) if (p.tipo === "texturas") bancos[1].push(leerTexturas(gb, p.ofs, p.len));
  } catch {}
  const cache = new Map;
  for (const p of partes) {
    if (p.tipo !== "mundo") continue;
    const antes = partes.filter(x => x.tipo === "texturas" && x.indice < p.indice).length, local = bancos[0][Math.max(0, antes - 1)] || [];
    for (const z of leerMundo(buf, p.ofs, p.len).piezas) {
      const banco = z.banco ? bancos[1][0] || [] : local, img = banco[z.textura - 1]?.[z.paleta] || banco[z.textura - 1]?.[0];
      const clave = (z.banco ? "g" : "l" + antes) + ":" + z.textura + ":" + z.paleta;
      let tex = cache.get(clave);
      if (tex === undefined) {
        tex = img ? texturaThree(img) : null;
        cache.set(clave, tex);
      }
      const g = new THREE.BufferGeometry, pos = new Float32Array(z.pos.length);
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
      }
      salaGrupo.add(new THREE.Mesh(g, mat));
    }
  }
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
      wireframe: true
    }));
    colision.visible = false;
    salaGrupo.add(colision);
  }
}

const henry = await iniciarHenry({
  THREE: THREE,
  escena: escena,
  camara: camara,
  jugador: jugador,
  ojos: OJOS,
  getColision: () => colision
});

const cj = iniciarCamaraJuego({
  THREE: THREE,
  camara: camara,
  jugador: jugador,
  henry: henry,
  getColision: () => colision,
  escala: ESCALA,
  ojos: OJOS,
  renderer: renderer
});

cj.activar(!q.has("libre"));

window.sh4 = {
  escena: escena,
  camara: camara,
  jugador: jugador,
  henry: henry,
  camaraJuego: cj,
  renderer: renderer
};

const ray = new THREE.Raycaster, abajo = new THREE.Vector3(0, -1, 0), tmp = new THREE.Vector3;

function pisar(forzar) {
  if (!colision) return;
  tmp.copy(jugador.position);
  tmp.y += forzar ? 5 : .45 - OJOS;
  ray.set(tmp, abajo);
  ray.far = forzar ? 50 : 3;
  const h = ray.intersectObject(colision).filter(x => Math.abs(x.face.normal.y) > .6)[0];
  if (h) jugador.position.y = h.point.y + OJOS;
}

function libre(dir, dist) {
  if (!colision) return true;
  for (const alto of [ .5 - OJOS, -.6, 0 ]) {
    tmp.copy(jugador.position);
    tmp.y += alto;
    ray.set(tmp, dir);
    ray.far = dist + .25;
    if (ray.intersectObject(colision).some(x => Math.abs(x.face.normal.y) < .6)) return false;
  }
  return true;
}

function mover(dir, v) {
  const d = dir.clone().normalize();
  if (libre(d, v)) {
    jugador.position.addScaledVector(d, v);
    return;
  }
  for (const eje of [ new THREE.Vector3(Math.sign(d.x), 0, 0), new THREE.Vector3(0, 0, Math.sign(d.z)) ]) {
    const parte = Math.abs(eje.x ? d.x : d.z) * v;
    if (parte > 1e-4 && libre(eje, parte)) jugador.position.addScaledVector(eje, parte);
  }
}

function capsula(p0, p1, r, color) {
  const a = new THREE.Vector3(-p0[0] * ESCALA, -p0[1] * ESCALA, p0[2] * ESCALA), b = new THREE.Vector3(-p1[0] * ESCALA, -p1[1] * ESCALA, p1[2] * ESCALA);
  const g = new THREE.Group, m = new THREE.LineBasicMaterial({
    color: color,
    depthTest: false,
    transparent: true,
    opacity: .8
  });
  g.add(new THREE.Line((new THREE.BufferGeometry).setFromPoints([ a, b ]), m));
  const rr = Math.min(r * ESCALA, 30);
  for (const c of [ a, b ]) {
    const pts = [];
    for (let i = 0; i <= 32; i++) {
      const t = i / 32 * Math.PI * 2;
      pts.push(new THREE.Vector3(c.x + Math.cos(t) * rr, c.y, c.z + Math.sin(t) * rr));
    }
    g.add(new THREE.Line((new THREE.BufferGeometry).setFromPoints(pts), m));
  }
  g.renderOrder = 10;
  return g;
}

function dibujarAreas() {
  debug.clear();
  for (const a of cj.areas || []) {
    const act = a === cj.areaActual, d = a.DriveArea;
    debug.add(capsula(d.Pos0, d.Pos1, d.Radius, act ? 16724016 : 3211104));
    const arg = decodificarArg(a);
    if (arg.mover) debug.add(capsula(arg.mover.p0, arg.mover.p1, arg.mover.radio, act ? 16748592 : 3178751));
  }
}

const mapa = $("mapa"), mctx = mapa.getContext("2d");

let caja = null;

function dibujarMapa() {
  if (!caja) return;
  const W = mapa.width, Hh = mapa.height;
  mctx.clearRect(0, 0, W, Hh);
  const [x0, z0, x1, z1] = caja, s = Math.min(W / (x1 - x0), Hh / (z1 - z0)) * .92;
  const P = (x, z) => [ W / 2 + (x - (x0 + x1) / 2) * s, Hh / 2 - (z - (z0 + z1) / 2) * s ];
  mctx.lineCap = "round";
  for (const a of cj.areas || []) {
    const d = a.DriveArea, act = a === cj.areaActual;
    mctx.strokeStyle = act ? "rgba(255,60,60,.55)" : "rgba(60,255,100,.18)";
    mctx.lineWidth = d.Radius > 3e3 ? 2 : Math.max(1, d.Radius * 2 * s);
    mctx.beginPath();
    mctx.moveTo(...P(d.Pos0[0], d.Pos0[2]));
    mctx.lineTo(...P(d.Pos1[0], d.Pos1[2]));
    mctx.stroke();
    const arg = decodificarArg(a);
    if (arg.mover) {
      mctx.strokeStyle = act ? "#ffa040" : "rgba(80,140,255,.6)";
      mctx.lineWidth = Math.max(2, arg.mover.radio * 2 * s);
      mctx.beginPath();
      mctx.moveTo(...P(arg.mover.p0[0], arg.mover.p0[2]));
      mctx.lineTo(...P(arg.mover.p1[0], arg.mover.p1[2]));
      mctx.stroke();
    }
  }
  const e = cj.estado;
  if (e.henry) {
    mctx.fillStyle = "#fff";
    mctx.beginPath();
    mctx.arc(...P(e.henry[0], e.henry[2]), 4, 0, 7);
    mctx.fill();
  }
  if (e.pos) {
    mctx.fillStyle = "#ffd040";
    mctx.beginPath();
    mctx.arc(...P(e.pos[0], e.pos[2]), 4, 0, 7);
    mctx.fill();
  }
}

function hud() {
  const e = cj.estado;
  $("hud").textContent = `${salaNombre} · escena ${e.escena ?? "-"} · ${e.areas} áreas\ncámara: ${cj.activa ? "original" : "libre"} · modo ${e.modo}\nárea: ${e.area}${e.corte ? " (corte)" : ""} · ángulo ${(e.angulo || 0).toFixed(3)} rad = ${(2 * Math.atan(Math.tan((e.angulo || 0) / 2) * .75) * 180 / Math.PI).toFixed(1)}° vertical\nHenry ${e.henry ? e.henry.join(", ") : "-"} · cámara ${e.pos ? e.pos.join(", ") : "-"}`;
}

async function cargar(nombre, puerta = null) {
  salaNombre = nombre;
  if (!datos) datos = (await (await fetch("/datos/escenas.json")).json()).etapas;
  await cargarMundo(nombre);
  const et = nombre.slice(0, 2), E = datos[et], n = Object.entries(E?.salas || {}).find(([, s]) => s === nombre.slice(0, 4))?.[0];
  const ps = E?.puertas?.puertas_por_escena?.[n] || [];
  const p = puerta != null && ps.find(x => x.door_no === puerta) || ps.find(x => x.arranque_pos);
  if (p) {
    jugador.position.set(-p.arranque_pos[0] * ESCALA, -p.arranque_pos[1] * ESCALA + OJOS, p.arranque_pos[2] * ESCALA);
    pisar();
    henry.ubicarRumbo(-Math.atan2(p.arranque_dir[0], p.arranque_dir[2]));
  } else {
    const b = (new THREE.Box3).setFromObject(colision || salaGrupo), c = b.getCenter(new THREE.Vector3);
    jugador.position.set(c.x, b.max.y, c.z);
    pisar(true);
  }
  henry.ponerModo(et === "rl" || et === "gt" ? "1ra" : "3ra");
  camara.rotation.set(0, 0, 0);
  await cj.alCargarSala(nombre);
  const b = (new THREE.Box3).setFromObject(colision || salaGrupo);
  caja = [ -b.max.x / ESCALA, b.min.z / ESCALA, -b.min.x / ESCALA, b.max.z / ESCALA ];
  henry.actualizar(0, {
    moviendo: false
  });
  for (let i = 0; i < 4; i++) cj.actualizar(1 / 30);
  dibujarAreas();
  hud();
  dibujarMapa();
  history.replaceState(null, "", "?" + [ ...new URLSearchParams({
    ...Object.fromEntries(q),
    sala: nombre
  }) ].map(([k, v]) => k + (v ? "=" + v : "")).join("&"));
  dibujar();
}

const reloj = new THREE.Clock;

function paso(dt, dir, corriendo) {
  const v = (corriendo ? 3.9 : 1.45) * dt;
  if (dir && dir.lengthSq() > 0) {
    mover(dir, v);
    pisar();
  }
  henry.actualizar(dt, {
    moviendo: !!dir,
    corriendo: corriendo,
    dir: dir ? dir.clone().normalize() : null,
    enVR: false
  });
  cj.actualizar(dt);
}

const teclas = {};

addEventListener("keydown", e => {
  teclas[e.code] = true;
  if (e.code === "KeyC") {
    cj.activar(!cj.activa);
    $("modo").textContent = "Cámara: " + (cj.activa ? "original" : "libre");
  }
  if (e.code === "KeyM") mapa.style.display = mapa.style.display === "none" ? "" : "none";
});

addEventListener("keyup", e => {
  teclas[e.code] = false;
});

$("modo").addEventListener("click", () => {
  cj.activar(!cj.activa);
  $("modo").textContent = "Cámara: " + (cj.activa ? "original" : "libre");
});

$("areas").addEventListener("click", () => {
  debug.visible = !debug.visible;
  dibujar();
});

const quieto = q.has("quieto");

let sucio = 2;

function dibujar() {
  sucio = 2;
  if (quieto) {
    renderer.render(escena, camara);
  }
}

renderer.setAnimationLoop(() => {
  if (quieto) return;
  const dt = Math.min(reloj.getDelta(), .1);
  const adelante = new THREE.Vector3;
  if (cj.activa) cj.adelanteControl(adelante); else {
    camara.getWorldDirection(adelante);
    adelante.y = 0;
    adelante.normalize();
  }
  const costado = (new THREE.Vector3).crossVectors(adelante, new THREE.Vector3(0, 1, 0)).normalize();
  const dir = new THREE.Vector3;
  if (teclas.KeyW || teclas.ArrowUp) dir.add(adelante);
  if (teclas.KeyS || teclas.ArrowDown) dir.sub(adelante);
  if (teclas.KeyD || teclas.ArrowRight) dir.add(costado);
  if (teclas.KeyA || teclas.ArrowLeft) dir.sub(costado);
  paso(dt, dir.lengthSq() > 0 ? dir : null, !!(teclas.ShiftLeft || teclas.ShiftRight));
  if (debug.visible) dibujarAreas();
  hud();
  dibujarMapa();
  renderer.render(escena, camara);
});

window.prueba = {
  cargar: cargar,
  ubicar(x, z, ang = 0) {
    jugador.position.set(-x * ESCALA, jugador.position.y + 2, z * ESCALA);
    pisar(true);
    henry.ubicarRumbo(-ang);
    henry.actualizar(0, {
      moviendo: false
    });
    for (let i = 0; i < 8; i++) cj.actualizar(1 / 30);
    dibujarAreas();
    hud();
    dibujarMapa();
    dibujar();
    return cj.estado;
  },
  caminar(ang, segs, corriendo = false) {
    const n = Math.round(segs * 30);
    for (let i = 0; i < n; i++) {
      let dir;
      if (ang === "adelante") {
        dir = cj.adelanteControl(new THREE.Vector3);
      } else dir = new THREE.Vector3(-Math.sin(ang), 0, Math.cos(ang));
      paso(1 / 30, dir, corriendo);
    }
    dibujarAreas();
    hud();
    dibujarMapa();
    dibujar();
    return cj.estado;
  },
  esperar(segs) {
    for (let i = 0; i < Math.round(segs * 30); i++) paso(1 / 30, null, false);
    hud();
    dibujarMapa();
    dibujar();
    return cj.estado;
  },
  areas(si) {
    debug.visible = si;
    dibujarAreas();
    dibujar();
  },
  modo(original) {
    cj.activar(original);
    dibujar();
    return cj.activa;
  },
  get estado() {
    return cj.estado;
  },
  redibujar: dibujar,
  async hoja(pasos, cols = 3) {
    const W = 640, H = 360, filas = Math.ceil(pasos.length / cols);
    const lienzo = document.createElement("canvas");
    lienzo.width = W * cols;
    lienzo.height = H * filas;
    const c = lienzo.getContext("2d");
    c.fillStyle = "#000";
    c.fillRect(0, 0, lienzo.width, lienzo.height);
    const notas = [];
    for (let i = 0; i < pasos.length; i++) {
      const p = pasos[i];
      if (p.imagen) {
        const im = new Image;
        im.src = p.imagen;
        await im.decode().catch(() => {});
        const x = i % cols * W, y = Math.floor(i / cols) * H, k = Math.min(W / im.width, H / im.height);
        c.drawImage(im, x + (W - im.width * k) / 2, y + (H - im.height * k) / 2, im.width * k, im.height * k);
        c.fillStyle = "rgba(0,0,0,.7)";
        c.fillRect(x, y, W, 22);
        c.fillStyle = "#ffd890";
        c.font = "14px Georgia";
        c.fillText(p.titulo || "juego", x + 6, y + 16);
        continue;
      }
      if (p.sala && p.sala !== salaNombre) await cargar(p.sala, p.puerta ?? null);
      if (p.ubicar) window.prueba.ubicar(...p.ubicar);
      if (p.caminar) window.prueba.caminar(...p.caminar);
      if (p.esperar) window.prueba.esperar(p.esperar);
      if (p.fn) p.fn({
        camara: camara,
        cj: cj,
        henry: henry
      });
      renderer.render(escena, camara);
      const x = i % cols * W, y = Math.floor(i / cols) * H;
      c.drawImage(renderer.domElement, x, y, W, H);
      const e = cj.estado;
      const txt = `${p.titulo || salaNombre} · ${e.modo} · ${e.area}`;
      c.fillStyle = "rgba(0,0,0,.7)";
      c.fillRect(x, y, W, 22);
      c.fillStyle = "#e8dcc8";
      c.font = "14px Georgia";
      c.fillText(txt, x + 6, y + 16);
      if (mapa.style.display !== "none") c.drawImage(mapa, x + W - 130, y + 24, 126, 126);
      notas.push({
        i: i,
        ...e
      });
    }
    lienzo.style.cssText = "position:fixed;left:0;top:0;width:100vw;height:100vh;object-fit:contain;z-index:50;background:#000";
    document.body.appendChild(lienzo);
    return notas.map(n => `${n.i}:${n.sala} ${n.modo} ${n.area} cam ${n.pos} henry ${n.henry}`);
  }
};

const lista = await (await fetch("/juego-lista.json")).json();

const salas = lista.data.filter(f => /^[a-z]{2}\d\d[a-z0-9_]*\.bin$/.test(f)).map(f => f.slice(0, -4)).filter(s => !/gb$/.test(s));

for (const s of salas) $("sala").appendChild(new Option(s, s));

$("sala").value = q.get("sala") || "sb03";

$("sala").addEventListener("change", () => cargar($("sala").value));

await cargar($("sala").value);

window.prueba.listo = true;
