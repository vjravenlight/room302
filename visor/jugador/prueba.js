// SH4 web — FeniXVOID · Project Ravenlight
import * as THREE from "three";

import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";

import { partesBin } from "../lib/sh4bin.js";

import { leerMundo } from "../lib/mundo.js";

import { leerTexturas, aRGBA } from "../lib/texturas.js";

import { leerColision } from "../lib/colision.js";

import { iniciarHenry } from "../henry.js";

const ESCALA = .005, OJOS = 1.6;

const q = new URLSearchParams(location.search);

const quieto = q.has("quieto");

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  preserveDrawingBuffer: true
});

renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

renderer.setSize(innerWidth, innerHeight);

renderer.outputColorSpace = THREE.SRGBColorSpace;

document.body.appendChild(renderer.domElement);

const escena = new THREE.Scene;

escena.background = new THREE.Color(657416);

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

escena.add(new THREE.AmbientLight(9472128, 1.4));

const sol = new THREE.DirectionalLight(16772829, 1.3);

sol.position.set(3, 6, 2);

escena.add(sol);

const $estado = document.getElementById("estado");

function texturaThree(img) {
  const t = new THREE.DataTexture(aRGBA(img), img.ancho, img.alto, THREE.RGBAFormat);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  t.needsUpdate = true;
  return t;
}

let colision = null;

async function cargarSala(nombre) {
  const buf = await (await fetch("/juego/data/" + nombre + ".bin")).arrayBuffer();
  const partes = partesBin(buf);
  const bancos = [ [], [] ];
  for (const p of partes) if (p.tipo === "texturas") bancos[0].push(leerTexturas(buf, p.ofs, p.len));
  try {
    const gb = await (await fetch("/juego/data/" + nombre.slice(0, 2) + "gb.bin")).arrayBuffer();
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
      if (!cache.has(clave)) cache.set(clave, img ? texturaThree(img) : null);
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
        map: cache.get(clave),
        vertexColors: true,
        side: THREE.DoubleSide,
        alphaTest: .3
      });
      if (z.grupo !== "normal") {
        mat.transparent = true;
        mat.depthWrite = false;
      }
      escena.add(new THREE.Mesh(g, mat));
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
      visible: false,
      side: THREE.DoubleSide
    }));
    escena.add(colision);
  }
}

const sala = q.get("sala");

if (sala) await cargarSala(sala);

if (!colision) {
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d");
  g.fillStyle = "#3a3330";
  g.fillRect(0, 0, 64, 64);
  g.fillStyle = "#2a2422";
  g.fillRect(0, 0, 32, 32);
  g.fillRect(32, 32, 32, 32);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(30, 30);
  t.colorSpace = THREE.SRGBColorSpace;
  const piso = new THREE.Mesh(new THREE.PlaneGeometry(30, 30).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({
    map: t
  }));
  escena.add(piso);
  colision = piso;
}

const pq = q.get("pos")?.split(",").map(Number);

{
  colision.geometry.computeBoundingBox();
  const caja = colision.geometry.boundingBox, cen = caja.getCenter(new THREE.Vector3);
  const o = pq?.length === 3 ? new THREE.Vector3(...pq) : new THREE.Vector3(cen.x, caja.max.y + 2, cen.z);
  const r = new THREE.Raycaster(o.clone().setY(Math.max(o.y, caja.max.y + 1)), new THREE.Vector3(0, -1, 0));
  const h = r.intersectObject(colision).filter(x => Math.abs(x.face.normal.y) > .6).pop();
  jugador.position.set(o.x, (h ? h.point.y : 0) + OJOS, o.z);
}

const henry = await iniciarHenry({
  THREE: THREE,
  escena: escena,
  camara: camara,
  jugador: jugador,
  ojos: OJOS,
  getColision: () => colision
});

henry.ponerModo(q.get("vista") || "3ra");

henry.ubicarRumbo(0);

camara.rotation.set(-.12, 0, 0);

const I = henry.ITEM;

for (const [k, n] of [ [ 18, 1 ], [ I.PISTOLA, 1 ], [ I.BALAS_PISTOLA, 15 ], [ I.BEBIDA, 2 ], [ I.AMPOLLA, 1 ], [ I.BOTIQUIN, 1 ], [ 21, 1 ], [ 49, 1 ], [ 45, 1 ] ]) henry.agregarItem(k, n);

await henry.equipar(q.has("arma") ? Number(q.get("arma")) : 18);

const enemigos = [];

if (q.get("enemigo") !== "0") {
  const e = {
    vida: 100,
    radio: .45,
    alto: 1.7,
    muerto: false,
    caido: false,
    golpes: 0
  };
  e.grupo = new THREE.Mesh(new THREE.CylinderGeometry(.3, .3, 1.7, 16).translate(0, .85, 0), new THREE.MeshLambertMaterial({
    color: 8002066
  }));
  e.grupo.position.copy(jugador.position).add(new THREE.Vector3(0, -OJOS, -1.6));
  e.posicion = e.grupo.position;
  escena.add(e.grupo);
  enemigos.push(e);
}

henry.ponerEnemigos(() => enemigos);

henry.ponerRecibirGolpe((e, danio, tipo, info) => {
  e.vida -= danio;
  e.golpes++;
  e.ultimo = {
    danio: danio,
    tipo: tipo,
    fuerte: info.fuerte
  };
  e.grupo.material.color.setHex(16777215);
  setTimeout(() => e.grupo.material.color.setHex(8002066), 120);
});

addEventListener("keydown", ev => {
  if (ev.code === "KeyH") henry.recibirDaño(null, "BAK_JIN_STRIKE", enemigos[0]?.posicion);
  if (ev.code === "KeyV") henry.alternar();
});

const teclas = {};

addEventListener("keydown", e => {
  teclas[e.code] = true;
});

addEventListener("keyup", e => {
  teclas[e.code] = false;
});

function entradaTeclado() {
  const adelante = new THREE.Vector3;
  camara.getWorldDirection(adelante);
  adelante.y = 0;
  adelante.normalize();
  const costado = (new THREE.Vector3).crossVectors(adelante, camara.up).normalize();
  const dir = new THREE.Vector3;
  if (!teclas.ShiftLeft || !henry.controlador.s.estado) {
    if (teclas.KeyW) dir.add(adelante);
    if (teclas.KeyS) dir.sub(adelante);
    if (teclas.KeyD) dir.add(costado);
    if (teclas.KeyA) dir.sub(costado);
  }
  const corriendo = !!(teclas.ShiftLeft || teclas.ShiftRight);
  return {
    moviendo: dir.lengthSq() > 0,
    corriendo: corriendo,
    dir: dir.lengthSq() ? dir.normalize() : null
  };
}

function estadoTexto() {
  const s = henry.controlador.s, m = henry.controlador.m;
  return `vida ${s.vida.toFixed(1)} · estado ${s.estado} · proceso ${s.procesoActual} (anim ${henry.animador.actual}) · arma ${s.arma.toString(16)}\n` + `move ${m.move.toFixed(2)} run ${m.run.toFixed(2)} vel ${(m.vel * ESCALA).toFixed(2)} m/s · rumbo ${(m.rumbo * 57.3).toFixed(0)}° cuerpo ${(m.cuerpo * 57.3).toFixed(0)}° · carga ${s.carga.toFixed(0)}` + (enemigos[0] ? `\nenemigo: vida ${enemigos[0].vida.toFixed(0)} golpes ${enemigos[0].golpes}` : "");
}

window.prueba = {
  henry: henry,
  enemigos: enemigos,
  jugador: jugador,
  camara: camara,
  THREE: THREE,
  escena: escena,
  simular(seg, e = {}) {
    const dt = 1 / 30;
    henry.entrada({
      preparar: e.preparar ?? null,
      atacar: e.atacar ?? null
    });
    for (let i = 0; i < Math.round(seg * 30); i++) {
      if (i === 0) henry.entrada({
        pasoAtras: e.pasoAtras,
        pasoIzq: e.pasoIzq,
        pasoDer: e.pasoDer
      });
      const r = (e.rumbo ?? 0) * Math.PI / 180;
      const dir = e.fuerza ? new THREE.Vector3(Math.sin(r), 0, Math.cos(r)).multiplyScalar(e.fuerza) : null;
      henry.actualizar(dt, {
        moviendo: !!dir,
        corriendo: !!e.correr,
        dir: dir,
        enVR: false
      });
    }
    henry.entrada({
      preparar: null,
      atacar: null
    });
    dibujar();
    return this.estado();
  },
  estado() {
    const s = henry.controlador.s, m = henry.controlador.m;
    return {
      vida: s.vida,
      estado: s.estado,
      proceso: s.procesoActual,
      anim: henry.animador.actual,
      move: m.move,
      run: m.run,
      vel: m.vel * ESCALA,
      rumbo: m.rumbo,
      cuerpo: m.cuerpo,
      pos: jugador.position.toArray(),
      carga: s.carga,
      enemigo: enemigos[0] && {
        vida: enemigos[0].vida,
        golpes: enemigos[0].golpes,
        ultimo: enemigos[0].ultimo
      }
    };
  },
  pasos(seg, {enVR: enVR = false, antes: antes = null} = {}) {
    for (let i = 0; i < Math.round(seg * 30); i++) {
      antes?.(i);
      henry.actualizar(1 / 30, {
        moviendo: false,
        corriendo: false,
        dir: null,
        enVR: enVR
      });
    }
    dibujar();
    return this.estado();
  },
  enemigoAdelante(d = 1.2) {
    const e = enemigos[0], m = henry.controlador.m, p = jugador.position;
    e.grupo.position.set(p.x - Math.sin(m.cuerpo) * d, p.y - OJOS, p.z + Math.cos(m.cuerpo) * d);
    e.vida = 100;
    e.golpes = 0;
    e.muerto = false;
    e.grupo.visible = true;
  },
  camaraFija(x, y, z, mx, my, mz) {
    this.fija = [ x, y, z, mx, my, mz ];
    dibujar();
  }
};

function dibujar() {
  if (window.prueba.fija) {
    const [x, y, z, mx, my, mz] = window.prueba.fija;
    const p = jugador.position;
    camara.position.set(x, y, z);
    camara.lookAt(p.x + mx, p.y - OJOS + my, p.z + mz);
    jugador.updateMatrixWorld();
    camara.position.copy(jugador.worldToLocal(new THREE.Vector3(p.x + x, p.y + y, p.z + z)));
    const m = (new THREE.Matrix4).lookAt(camara.position.clone().applyMatrix4(jugador.matrixWorld), new THREE.Vector3(p.x + mx, p.y - OJOS + my, p.z + mz), new THREE.Vector3(0, 1, 0));
    camara.quaternion.setFromRotationMatrix(m);
  }
  $estado.textContent = estadoTexto();
  renderer.render(escena, camara);
}

window.prueba.dibujar = dibujar;

window.prueba.lista = true;

const reloj = new THREE.Clock;

renderer.setAnimationLoop(() => {
  if (quieto) return;
  const dt = Math.min(reloj.getDelta(), .1);
  henry.actualizar(dt, entradaTeclado());
  dibujar();
});

dibujar();
