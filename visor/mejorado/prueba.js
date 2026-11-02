// SH4 web — FeniXVOID · Project Ravenlight
import * as THREE from "three";

import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";

import { VRButton } from "three/addons/webxr/VRButton.js";

import { soloConCasco } from "../vr_boton.js";

import { partesBin } from "../lib/sh4bin.js";

import { leerTexturas, aRGBA } from "../lib/texturas.js";

import { armarSala, crearLucesPersonajes } from "../lib/sala.js";

import { leerModelo } from "../lib/modelo.js";

import { iniciarMejorado } from "./mejorado.js";

const ESCALA = .005, OJOS = 1.6;

const q = new URLSearchParams(location.search);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  preserveDrawingBuffer: q.has("quieto")
});

renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

renderer.setSize(innerWidth, innerHeight);

renderer.outputColorSpace = THREE.SRGBColorSpace;

renderer.xr.enabled = true;

document.body.appendChild(renderer.domElement);

if (!q.has("limpio")) document.body.appendChild(soloConCasco(VRButton.createButton(renderer)));

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
  t.anisotropy = 4;
  t.needsUpdate = true;
  return t;
}

const sala = new THREE.Group;

escena.add(sala);

const info = {
  sala: null
};

let colision = null, sucio = 3, salaArmada = null;

const globales = new Map;

const redibujar = () => {
  sucio = 2;
};

const mej = iniciarMejorado({
  THREE: THREE,
  renderer: renderer,
  escena: escena,
  camara: camara,
  sala: sala,
  info: info,
  redibujar: redibujar
});

window.sh4p = {
  mej: mej,
  info: info,
  escena: escena,
  camara: camara,
  jugador: jugador,
  renderer: renderer,
  THREE: THREE
};

async function cargarSala(nombre) {
  const s = await armarSala(THREE, bajar, nombre, globales, {
    mipmaps: !q.has("sinmip"),
    niebla: !q.has("sinniebla")
  });
  salaArmada?.dispose?.();
  salaArmada = s;
  sala.clear();
  sala.add(s.grupo);
  colision = s.colision;
  info.luces = s.luces;
  info.niebla = s.niebla;
  info.nieblaJuego = s.nieblaJuego;
  window.sh4p.niebla = s.nieblaSala;
  escena.background = (new THREE.Color).setRGB(...s.nieblaSala.activa ? s.colorFondo : [ 0, 0, 0 ], THREE.SRGBColorSpace);
  sala.add(crearLucesPersonajes(THREE, info.luces));
  info.sala = nombre;
  const cam = q.get("cam")?.split(",").map(Number);
  if (cam?.length >= 3) jugador.position.set(cam[0], cam[1], cam[2]); else {
    const piso = pisoMasGrande();
    if (piso) jugador.position.set(piso.x, piso.y + OJOS, piso.z);
  }
  camara.rotation.set((cam?.[4] || 0) * Math.PI / 180, (cam?.length >= 4 ? cam[3] : giroMasAbierto()) * Math.PI / 180, 0, "YXZ");
  if (q.has("calco")) {
    const calcos = [];
    s.grupo.traverse(m => {
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
    if (c) {
      const mira = c.geometry.boundingBox.getCenter(new THREE.Vector3);
      const caja = (new THREE.Box3).setFromObject(colision || s.grupo), centro = caja.getCenter(new THREE.Vector3);
      const d = (new THREE.Vector3).subVectors(centro, mira);
      d.y = 0;
      d.normalize();
      jugador.position.copy(mira).addScaledVector(d, +(q.get("dist") || 1.4));
      jugador.position.y = Math.max(mira.y + .3, caja.min.y + 1.2);
      camara.rotation.set(0, 0, 0);
      camara.lookAt(mira);
    }
  }
  if (q.has("henry")) await ponerHenry();
  mej.alCargarSala();
  info.lista = true;
  estado(`${nombre} · ${mej.activo ? "MEJORADO " + mej.estado.preset : "ORIGINAL"} · ${info.luces.length} luces`);
  redibujar();
}

async function ponerHenry() {
  const buf = await bajar("data/henry01.bin");
  const partes = partesBin(buf);
  const p = partes.find(x => x.tipo === "modelo"), tp = partes.find(x => x.tipo === "texturas");
  const m = leerModelo(buf, p.ofs, p.len), texs = tp ? leerTexturas(buf, tp.ofs, tp.len) : [];
  const henry = new THREE.Group;
  henry.name = "henry_prueba";
  for (const s of m.partes) {
    const g = new THREE.BufferGeometry;
    const pos = new Float32Array(s.pos.length), nor = new Float32Array(s.nor.length);
    for (let i = 0; i < pos.length; i += 3) {
      pos[i] = -s.pos[i] * ESCALA;
      pos[i + 1] = -s.pos[i + 1] * ESCALA;
      pos[i + 2] = s.pos[i + 2] * ESCALA;
      nor[i] = -s.nor[i];
      nor[i + 1] = -s.nor[i + 1];
      nor[i + 2] = s.nor[i + 2];
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
    g.setAttribute("uv", new THREE.BufferAttribute(s.uv, 2));
    g.setIndex(new THREE.BufferAttribute(s.indices, 1));
    const img = s.textura && (texs[s.textura.grupo]?.[s.textura.sub] || texs[s.textura.grupo]?.[0]);
    const mat = new THREE.MeshLambertMaterial({
      map: img ? texturaThree(img) : null,
      side: THREE.DoubleSide,
      alphaTest: .3
    });
    if (q.has("caraunica")) {
      mat.onBeforeCompile = sh => {
        sh.fragmentShader = sh.fragmentShader.replace("#include <normal_fragment_begin>", "#include <normal_fragment_begin>\n\tnormal *= faceDirection;");
      };
      mat.customProgramCacheKey = () => "caraunica";
    }
    henry.add(new THREE.Mesh(g, mat));
  }
  const caja = (new THREE.Box3).setFromObject(henry);
  const dir = new THREE.Vector3;
  camara.getWorldDirection(dir);
  dir.y = 0;
  dir.normalize();
  const pie = jugador.position.clone().addScaledVector(dir, +(q.get("henry") || 1.8));
  const r = new THREE.Raycaster(pie.clone().setY(pie.y + .5), new THREE.Vector3(0, -1, 0), 0, 6);
  const h = colision && r.intersectObject(colision)[0];
  henry.position.set(pie.x, (h ? h.point.y : jugador.position.y - OJOS) - caja.min.y, pie.z);
  henry.rotation.y = Math.atan2(-dir.x, -dir.z) - Math.PI * .15;
  escena.add(henry);
}

function pisoMasGrande() {
  if (!colision) return null;
  const p = colision.geometry.attributes.position, a = new THREE.Vector3, b = new THREE.Vector3, c = new THREE.Vector3, n = new THREE.Vector3;
  const cands = [];
  for (let i = 0; i < p.count; i += 3) {
    a.fromBufferAttribute(p, i);
    b.fromBufferAttribute(p, i + 1);
    c.fromBufferAttribute(p, i + 2);
    n.subVectors(b, a).cross(c.clone().sub(a));
    const ar = n.length() / 2;
    if (ar > .05 && Math.abs(n.normalize().y) > .9) cands.push({
      ar: ar,
      centro: a.clone().add(b).add(c).divideScalar(3)
    });
  }
  cands.sort((x, y) => y.ar - x.ar);
  const r = new THREE.Raycaster, buenos = [];
  for (const k of cands.slice(0, 300)) {
    const {centro: centro} = k;
    r.set(centro.clone().add(new THREE.Vector3(0, -.05, 0)), new THREE.Vector3(0, -1, 0));
    r.far = 6;
    if (r.intersectObject(colision).some(x => Math.abs(x.face.normal.y) > .6)) continue;
    r.set(centro.clone().add(new THREE.Vector3(0, .05, 0)), new THREE.Vector3(0, 1, 0));
    r.far = OJOS + .2;
    if (r.intersectObject(colision).length) continue;
    buenos.push(k);
  }
  if (!buenos.length) return cands[0]?.centro || null;
  const grandes = buenos.slice(0, 40), minY = Math.min(...grandes.map(k => k.centro.y));
  return grandes.find(k => k.centro.y < minY + 1.5).centro;
}

function giroMasAbierto() {
  if (!colision) return 0;
  const r = new THREE.Raycaster, o = jugador.position.clone();
  o.y -= .4;
  let mejor = 0, lejos = -1;
  for (let k = 0; k < 16; k++) {
    const g = k * 22.5, rad = g * Math.PI / 180;
    r.set(o, new THREE.Vector3(-Math.sin(rad), 0, -Math.cos(rad)));
    r.far = 60;
    const d = r.intersectObject(colision)[0]?.distance ?? 60;
    if (d > lejos) {
      lejos = d;
      mejor = g;
    }
  }
  return mejor;
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
  const dt = Math.min(reloj.getDelta(), .1);
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
  if (!mej.alDibujar(dt)) renderer.render(escena, camara);
});

if (q.get("preset")) mej.preset(q.get("preset"));

if (q.has("linterna")) mej.linterna(true);

if (q.get("modo") === "mejorado") mej.activar(true);

window.sh4p.cargar = s => {
  info.lista = false;
  return cargarSala(s);
};

window.sh4p.redibujar = redibujar;

window.sh4p.dibujar = () => {
  const t = performance.now();
  if (!mej.alDibujar(1 / 60)) renderer.render(escena, camara);
  renderer.getContext().finish();
  return Math.round(performance.now() - t);
};

window.sh4p.medir = n => {
  const r = mej.medir(n);
  redibujar();
  return r;
};

cargarSala(q.get("sala") || "rl01a").catch(e => estado("error: " + e.message));

window.sh4p.comparar = () => {
  const W = renderer.domElement.width, H = renderer.domElement.height;
  let lienzo = document.getElementById("comparar");
  if (!lienzo) {
    lienzo = document.createElement("canvas");
    lienzo.id = "comparar";
    Object.assign(lienzo.style, {
      position: "fixed",
      left: 0,
      top: 0,
      width: "100%",
      height: "100%",
      zIndex: 5
    });
    document.body.appendChild(lienzo);
  }
  lienzo.width = W;
  lienzo.height = H;
  const c = lienzo.getContext("2d");
  const estabaActivo = mej.activo;
  const foto = activo => {
    mej.activar(activo);
    if (!mej.alDibujar(1 / 60)) renderer.render(escena, camara);
    const img = document.createElement("canvas");
    img.width = W;
    img.height = H;
    img.getContext("2d").drawImage(renderer.domElement, 0, 0);
    return img;
  };
  const a = foto(false), b = foto(true);
  c.drawImage(a, W / 4, 0, W / 2, H, 0, 0, W / 2, H);
  c.drawImage(b, W / 4, 0, W / 2, H, W / 2, 0, W / 2, H);
  c.fillStyle = "#000";
  c.fillRect(W / 2 - 1, 0, 2, H);
  c.font = `${Math.round(H / 30)}px Georgia`;
  c.fillStyle = "#fff";
  c.fillText("Original", 12, H / 22);
  c.fillText("Mejorado · " + mej.estado.preset, W / 2 + 12, H / 22);
  mej.activar(estabaActivo);
  const medir = img => {
    const d = img.getContext("2d").getImageData(W / 4, 0, W / 2, H).data, h = new Uint32Array(256);
    let suma = 0, quemados = 0, n = d.length / 4;
    for (let i = 0; i < d.length; i += 4) {
      const l = Math.round(.2126 * d[i] + .7152 * d[i + 1] + .0722 * d[i + 2]);
      suma += l;
      h[l]++;
      if (l >= 250) quemados++;
    }
    let acc = 0, med = 0;
    for (let k = 0; k < 256; k++) {
      acc += h[k];
      if (acc >= n / 2) {
        med = k;
        break;
      }
    }
    return {
      medio: +(suma / n).toFixed(1),
      mediana: med,
      quemados: +(quemados / n * 100).toFixed(2)
    };
  };
  return {
    W: W,
    H: H,
    original: medir(a),
    mejorado: medir(b),
    cam: jugador.position.toArray().map(x => +x.toFixed(2)),
    giro: +(camara.rotation.y * 180 / Math.PI).toFixed(0)
  };
};
