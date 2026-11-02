// SH4 web — FeniXVOID · Project Ravenlight
import * as THREE from "three";

import { armarSala } from "../lib/sala.js";

import { iniciarHenry } from "../henry.js";

import { iniciarEnemigos } from "./enemigos.js";

const ESCALA = .005, OJOS = 1.6, RADIO = .25, PASO = .45;

const q = new URLSearchParams(location.search);

const $ = id => document.getElementById(id);

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

escena.background = new THREE.Color(328707);

const vista = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, .05, 300);

const jugador = new THREE.Group;

escena.add(jugador);

const camHenry = new THREE.PerspectiveCamera;

jugador.add(camHenry);

addEventListener("resize", () => {
  vista.aspect = innerWidth / innerHeight;
  vista.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

let sala = null, colision = null;

const salaGrupo = new THREE.Group;

escena.add(salaGrupo);

const bajar = async r => {
  const x = await fetch("/juego/" + r);
  if (!x.ok) throw new Error("no pude leer " + r);
  return x.arrayBuffer();
};

const globales = new Map;

const henry = await iniciarHenry({
  THREE: THREE,
  escena: escena,
  camara: camHenry,
  jugador: jugador,
  ojos: OJOS,
  getColision: () => colision
});

henry.ponerModo("3ra");

if (q.has("arma")) await henry.equipar(+q.get("arma"));

const registro = [];

if (q.has("vida")) henry.controlador.s.vida = +q.get("vida") * henry.controlador.s.vidaMax;

henry.alRecibirDaño?.(d => {
  registro.unshift(`${(performance.now() / 1e3).toFixed(1)}s → Henry: ${d.cant} (tipo ${d.tipo}${d.atras ? ", de atrás" : ""})`);
  registro.length = Math.min(registro.length, 5);
});

henry.alGolpear?.((a, danio, tipo) => {
  registro.unshift(`Henry → ${a.id}: ${tipo} ${danio}`);
  registro.length = Math.min(registro.length, 5);
});

const enemigos = iniciarEnemigos({
  THREE: THREE,
  escena: escena,
  sala: salaGrupo,
  jugador: jugador,
  henry: henry,
  getColision: () => colision,
  escala: ESCALA,
  ojos: OJOS,
  nivel: +(q.get("nivel") ?? 1)
});

enemigos.verEstados = q.has("verIA");

async function cargar(nombre, mitad = +(q.get("mitad") || 1)) {
  $("estado").textContent = "cargando " + nombre + "…";
  if (sala) {
    sala.grupo.removeFromParent();
    sala.dispose();
  }
  salaGrupo.clear();
  sala = await armarSala(THREE, bajar, nombre, globales);
  colision = sala.colision;
  salaGrupo.add(sala.grupo);
  const col = (c, k = 1) => (new THREE.Color).setRGB(c[0] / 128 * k, c[1] / 128 * k, c[2] / 128 * k, THREE.SRGBColorSpace);
  const luces = new THREE.Group;
  for (const l of sala.luces) {
    if (l.tipo === 1) luces.add(new THREE.AmbientLight(col(l.color), 1.6)); else if (l.tipo === 2 || l.tipo === 5) {
      const d = new THREE.DirectionalLight(col(l.color), 1.4);
      d.position.set(l.dir[0], l.dir[1], -l.dir[2]).normalize().multiplyScalar(-10);
      luces.add(d);
    } else if (l.tipo === 3 || l.tipo === 4 || l.tipo === 6) {
      const p = new THREE.PointLight(col(l.color, .5), 2.2, 9, 1.2);
      p.position.set(-l.pos[0] * ESCALA, -l.pos[1] * ESCALA, l.pos[2] * ESCALA);
      luces.add(p);
    }
  }
  luces.add(new THREE.AmbientLight(8421504, q.has("claro") ? 2.5 : 1));
  salaGrupo.add(luces);
  let pos = null, giro = 0;
  const hq = q.get("henry")?.split(",").map(Number);
  if (hq?.length >= 2) pos = [ hq[0], hq.length > 2 ? hq[2] : 0, hq[1] ]; else {
    try {
      const E = (await (await fetch("/datos/escenas.json")).json()).etapas;
      const et = E[nombre.slice(0, 2)], n = Object.entries(et.salas).find(([, s]) => s === nombre.slice(0, 4))?.[0];
      const ps = et.puertas?.puertas_por_escena?.[n] || [];
      const p = ps.find(x => x.door_no === +q.get("puerta")) || ps.find(x => x.arranque_pos);
      if (p) {
        pos = p.arranque_pos;
        giro = Math.atan2(p.arranque_dir[0], p.arranque_dir[2]);
      }
    } catch {}
  }
  pos = pos || [ 0, 0, 0 ];
  jugador.position.set(-pos[0] * ESCALA, -pos[1] * ESCALA + OJOS, pos[2] * ESCALA);
  pisar();
  henry.ubicarRumbo(-giro);
  henry.actualizar(0, {
    moviendo: false,
    corriendo: false,
    dir: null,
    enVR: false
  });
  const r = await enemigos.alCargarSala(nombre, {
    mitad: mitad
  });
  info.sala = nombre;
  info.mitad = mitad;
  info.enemigos = r?.enemigos;
  info.pendientes = enemigos.pendientes.map(d => d.enemigo);
  info.lista = true;
  history.replaceState(null, "", "?" + new URLSearchParams({
    ...Object.fromEntries(q),
    sala: nombre,
    mitad: mitad
  }).toString().replace(/=(&|$)/g, "$1"));
  redibujar();
}

const rayo = new THREE.Raycaster, abajo = new THREE.Vector3(0, -1, 0), tmp = new THREE.Vector3;

function pisar(forzar) {
  if (!colision) return;
  tmp.copy(jugador.position);
  tmp.y += forzar ? 5 : PASO - OJOS;
  rayo.set(tmp, abajo);
  rayo.far = forzar ? 50 : 3;
  const h = rayo.intersectObject(colision).filter(x => Math.abs(x.face.normal.y) > .6)[0];
  if (h) jugador.position.y = h.point.y + OJOS;
}

function libre(dir, dist) {
  if (!colision) return true;
  for (const alto of [ PASO - OJOS + .05, -.6, 0 ]) {
    tmp.copy(jugador.position);
    tmp.y += alto;
    rayo.set(tmp, dir);
    rayo.far = dist + RADIO;
    if (rayo.intersectObject(colision).some(x => Math.abs(x.face.normal.y) < .6)) return false;
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

const teclas = {};

addEventListener("keydown", e => {
  teclas[e.code] = true;
});

addEventListener("keyup", e => {
  teclas[e.code] = false;
});

const ordenes = {
  destino: null,
  correr: false,
  moviendo: false
};

let modoCam = [ "cenital", "lateral" ].includes(q.get("cam")) ? q.get("cam") : "atras", yawCam = 0;

function pasoHenry(dt) {
  const dir = new THREE.Vector3;
  const fw = new THREE.Vector3(-Math.sin(yawCam), 0, -Math.cos(yawCam)), der = new THREE.Vector3(Math.cos(yawCam), 0, -Math.sin(yawCam));
  if (teclas.KeyW || teclas.ArrowUp) dir.add(fw);
  if (teclas.KeyS || teclas.ArrowDown) dir.sub(fw);
  if (teclas.KeyD || teclas.ArrowRight) dir.add(der);
  if (teclas.KeyA || teclas.ArrowLeft) dir.sub(der);
  let corriendo = !!(teclas.ShiftLeft || teclas.ShiftRight);
  if (ordenes.destino) {
    const t = new THREE.Vector3(-ordenes.destino[0] * ESCALA, jugador.position.y, ordenes.destino[1] * ESCALA);
    const d = t.sub(jugador.position);
    d.y = 0;
    if (d.length() < .15) ordenes.destino = null; else {
      dir.copy(d);
      corriendo = ordenes.correr;
    }
  }
  ordenes.moviendo = dir.lengthSq() > 0;
  if (ordenes.moviendo && henry.vida > 0) {
    mover(dir, henry.velocidad(corriendo) * dt);
    pisar();
  }
  henry.actualizar(dt, {
    moviendo: ordenes.moviendo && henry.vida > 0,
    corriendo: corriendo,
    dir: ordenes.moviendo ? dir.clone().normalize() : null,
    enVR: false
  });
}

function camara() {
  const h = henry.personaje.grupo.position;
  if (modoCam === "cenital") {
    vista.position.set(h.x, h.y + 2.7, h.z + .01);
    vista.lookAt(h.x, h.y, h.z);
    return;
  }
  if (modoCam === "lateral") {
    const e = enemigos.masCercano(h, 12), p = e ? enemigos.posicion(e) : h.clone().add(new THREE.Vector3(0, 0, 1));
    const medio = h.clone().lerp(p, .5), d = p.clone().sub(h);
    d.y = 0;
    const lado = new THREE.Vector3(-d.z, 0, d.x).normalize();
    let mejor = null;
    for (const s of [ 1, -1 ]) {
      const desde = medio.clone().add(new THREE.Vector3(0, 1.2, 0)), dir = lado.clone().multiplyScalar(s).add(new THREE.Vector3(0, .25, 0)).normalize();
      let largo = Math.max(2.6, d.length() * 1.3);
      if (colision) {
        rayo.set(desde, dir);
        rayo.far = largo;
        const g = rayo.intersectObject(colision)[0];
        if (g) largo = Math.max(.4, g.distance - .2);
      }
      if (!mejor || largo > mejor.largo) mejor = {
        largo: largo,
        pos: desde.clone().addScaledVector(dir, largo)
      };
    }
    vista.position.copy(mejor.pos);
    vista.lookAt(medio.add(new THREE.Vector3(0, .7, 0)));
    return;
  }
  const e = enemigos.masCercano(h, 12);
  if (e) {
    const p = enemigos.posicion(e);
    yawCam = Math.atan2(-(p.x - h.x), -(p.z - h.z));
  } else yawCam = henry.personaje.grupo.rotation.y + Math.PI;
  const atras = new THREE.Vector3(Math.sin(yawCam), 0, Math.cos(yawCam));
  const desde = h.clone().add(new THREE.Vector3(0, 1.6, 0)), hacia = atras.clone().multiplyScalar(3.6).add(new THREE.Vector3(0, .8, 0));
  let largo = hacia.length();
  if (colision) {
    rayo.set(desde, hacia.clone().normalize());
    rayo.far = largo;
    const g = rayo.intersectObject(colision)[0];
    if (g) largo = Math.max(.4, g.distance - .25);
  }
  vista.position.copy(desde).addScaledVector(hacia.normalize(), largo);
  const mira = h.clone().add(new THREE.Vector3(0, .6, 0));
  if (e) mira.lerp(enemigos.posicion(e), .45);
  vista.lookAt(mira);
}

function golpe(tipo = "BAK_PLAYER_PIPE") {
  const e = enemigos.masCercano(henry.personaje.grupo.position, 2.5);
  if (!e) return null;
  enemigos.recibirGolpe(e, undefined, tipo);
  registro.unshift(`Henry → ${e.id}: ${tipo}`);
  registro.length = Math.min(registro.length, 5);
  return e.id;
}

addEventListener("keydown", e => {
  if (e.code === "KeyG") golpe("BAK_PLAYER_PIPE");
  if (e.code === "KeyH") golpe("PISOTON");
  if (e.code === "KeyC") modoCam = {
    atras: "cenital",
    cenital: "lateral",
    lateral: "atras"
  }[modoCam];
  if (e.code === "KeyI") enemigos.verEstados = !enemigos.verEstados;
  if (e.code === "KeyP") enemigos.pausa = !enemigos.pausa;
});

$("golpe").onclick = () => golpe("BAK_PLAYER_PIPE");

$("pisoton").onclick = () => golpe("PISOTON");

function textoEstado() {
  const r = enemigos.resumen().map(x => `${x.id.padEnd(9)} ${String(x.paso).padEnd(14)} ${String(x.anim).padEnd(5)} c${String(x.cuadro).padStart(2)} hp ${String(x.hp).padStart(5)} d ${x.dJugador}`);
  const j = enemigos.jugador;
  return `${info.sala} mitad ${info.mitad}  ·  Henry vida ${Math.round(henry.vida)}  pos ${j.pos.map(Math.round).join(",")}${j.corriendo ? " corriendo" : ""}\n` + r.join("\n") + (info.pendientes?.length ? `\nsin IA todavía: ${info.pendientes.join(", ")}` : "") + (registro.length ? "\n" + registro.join("\n") : "");
}

const info = {};

let sucio = 3;

function redibujar() {
  sucio = 2;
}

const reloj = new THREE.Clock;

renderer.setAnimationLoop(() => {
  const dt = Math.min(reloj.getDelta(), .1);
  if (!quieto) {
    pasoHenry(dt);
    enemigos.actualizar(dt);
  } else {
    if (sucio <= 0) return;
    sucio--;
  }
  camara();
  $("estado").textContent = textoEstado();
  renderer.render(escena, vista);
});

function simular(seg) {
  const n = Math.round(seg * 30);
  for (let i = 0; i < n; i++) {
    pasoHenry(1 / 30);
    enemigos.actualizar(1 / 30);
  }
  redibujar();
  return enemigos.resumen();
}

window.sh4 = {
  THREE: THREE,
  escena: escena,
  camara: vista,
  jugador: jugador,
  henry: henry,
  enemigos: enemigos,
  info: info,
  cargar: cargar,
  simular: simular,
  redibujar: redibujar,
  golpe: golpe,
  henryIr: (x, z, correr = false) => {
    ordenes.destino = [ x, z ];
    ordenes.correr = correr;
  },
  henryParar: () => {
    ordenes.destino = null;
  },
  vida: v => {
    if (v != null) henry.controlador.s.vida = v;
    return henry.vida;
  },
  atacar: (seg = .6) => {
    henry.entrada({
      preparar: true,
      atacar: true
    });
    simular(seg);
    henry.entrada({
      preparar: null,
      atacar: false
    });
    return simular(.5);
  },
  camaraModo: m => {
    modoCam = m;
    redibujar();
  },
  registro: registro
};

const datos = await (await fetch("/datos/enemigos.json")).json();

const sel = $("sala");

for (const [s, d] of Object.entries(datos.salas)) {
  const n1 = d.mitad1.map(x => x.enemigo), n2 = d.mitad2.map(x => x.enemigo);
  const res = l => Object.entries(l.reduce((a, k) => (a[k] = (a[k] || 0) + 1, a), {})).map(([k, v]) => `${v} ${k}`).join(", ");
  sel.appendChild(new Option(`${s} · ${res(n1) || "—"} / ${res(n2) || "—"}`, s));
}

sel.value = q.get("sala") || "sb02";

$("mitad").value = q.get("mitad") || "1";

$("nivel").value = q.get("nivel") || "1";

sel.onchange = () => cargar(sel.value, +$("mitad").value);

$("mitad").onchange = () => cargar(sel.value, +$("mitad").value);

$("nivel").onchange = () => {
  enemigos.nivel = +$("nivel").value;
  cargar(sel.value, +$("mitad").value);
};

await cargar(sel.value);

if (q.has("correr")) {
  const p = q.get("correr").split(",").map(Number);
  if (p.length >= 2) window.sh4.henryIr(p[0], p[1], true);
}
