// SH4 web — FeniXVOID · Project Ravenlight
import * as THREE from "three";

import { iniciarSonido } from "./sonido.js";

import { MATERIALES, juegoAVisor, visorAJuego } from "./formatos.js";

const $ = id => document.getElementById(id);

const q = new URLSearchParams(location.search);

const ESCALA = .005, OJOS = 1.6;

const camara = new THREE.PerspectiveCamera(70, 1, .05, 500);

const jugador = new THREE.Group;

jugador.add(camara);

const escena3d = new THREE.Scene;

escena3d.add(jugador);

const D = await (await fetch("/datos/sonido.json")).json();

const son = await iniciarSonido({
  THREE: THREE,
  camara: camara,
  jugador: jugador,
  escala: ESCALA,
  ojos: OJOS,
  datos: D
});

window.prueba = {
  son: son,
  THREE: THREE,
  jugador: jugador,
  camara: camara,
  mover: mover,
  caminar: caminar
};

const salas = [];

for (const [et, regs] of Object.entries(D.sdb)) {
  if (et.endsWith("_lh")) continue;
  for (const e of [ ...new Set(regs.map(r => r.escena)) ].sort((a, b) => a - b)) salas.push(et === "rl" ? "rl" + String(e - 1).padStart(2, "0") : et + String(e).padStart(2, "0"));
}

for (const s of salas) $("sala").add(new Option(s, s));

$("sala").value = q.get("sala") || "sb01";

$("mitad").checked = q.get("mitad") === "2";

let regsEscena = [], vista = null, rumbo = 0;

async function cargar() {
  const sala = $("sala").value, mitad = $("mitad").checked ? 2 : 1;
  await son.alCargarSala(sala, {
    mitad: mitad
  });
  const et = sala.slice(0, 2), nom = mitad === 2 && D.sdb[et + "_lh"] ? et + "_lh" : et;
  regsEscena = (D.sdb[nom] || []).filter(r => r.escena === son.motor.escena);
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (const r of regsEscena) {
    x0 = Math.min(x0, r.area[0]);
    x1 = Math.max(x1, r.area[2]);
    z0 = Math.min(z0, r.area[3]);
    z1 = Math.max(z1, r.area[1]);
  }
  if (!isFinite(x0)) {
    x0 = -2e3;
    x1 = 2e3;
    z0 = -2e3;
    z1 = 2e3;
  }
  const lado = Math.max(x1 - x0, z1 - z0) * 1.1 + 200;
  vista = {
    cx: (x0 + x1) / 2,
    cz: (z0 + z1) / 2,
    lado: lado
  };
  const r0 = regsEscena.find(r => r.tipo === 0) || regsEscena[0];
  if (r0) mover((r0.area[0] + r0.area[2]) / 2, (r0.area[1] + r0.area[3]) / 2); else mover(0, 0);
  $("musicas").innerHTML = "";
  for (const no of [ ...new Set((D.sdb[nom] || []).filter(r => r.tipo === 2).map(r => r.no)) ].sort()) boton($("musicas"), String(no), () => son.musica(no));
  boton($("musicas"), "cortar", () => son.musica(null));
  history.replaceState(null, "", `?sala=${sala}${mitad === 2 ? "&mitad=2" : ""}`);
}

function pisoEn(x, z) {
  let mejor = null, area = Infinity;
  for (const r of regsEscena) {
    const [a0, b0, a1, b1, ymin] = r.area;
    if (x < a0 || x > a1 || z < b1 || z > b0) continue;
    const s = (a1 - a0) * (b0 - b1);
    if (s < area) {
      area = s;
      mejor = ymin - 10;
    }
  }
  return mejor ?? 0;
}

function mover(x, z) {
  const [vx, vy, vz] = juegoAVisor([ x, pisoEn(x, z), z ], ESCALA);
  jugador.position.set(vx, vy + OJOS, vz);
}

function caminar(dx, dz) {
  const [x, , z] = visorAJuego([ jugador.position.x, jugador.position.y - OJOS, jugador.position.z ], ESCALA);
  mover(x + dx, z + dz);
}

function boton(donde, texto, fn) {
  const b = document.createElement("button");
  b.textContent = texto;
  b.onclick = fn;
  donde.appendChild(b);
  return b;
}

for (const m of MATERIALES) if (D.pasos[m]) boton($("pasos"), m, () => son.paso(m));

for (const mat of Object.keys(D.puertas)) {
  boton($("puertas"), mat + " ▲", () => son.puerta(mat, "abrir"));
  boton($("puertas"), mat + " ▼", () => son.puerta(mat, "cerrar"));
}

for (const [en, ids] of Object.entries(D.enemigos_e3)) for (const id of ids) boton($("enemigos"), `${en} ${id}`, () => son.efecto(id, frente(3)));

const frente = m => {
  const v = new THREE.Vector3(0, 0, -m).applyQuaternion(camara.getWorldQuaternion(new THREE.Quaternion));
  return jugador.position.clone().add(v);
};

let orbita = null;

$("orbita").onclick = () => {
  if (orbita) {
    orbita.h.parar();
    orbita = null;
    $("orbita").classList.remove("on");
    return;
  }
  const fuente = new THREE.Object3D;
  escena3d.add(fuente);
  orbita = {
    fuente: fuente,
    t: 0,
    h: son.efecto(63150, fuente.position, {
      loop: true,
      radio: 3e3
    })
  };
  $("orbita").classList.add("on");
};

$("lejos").onclick = async () => {
  for (let i = 0; i < 12; i++) {
    son.pasoEnemigo(frente(1 + i * 1.2), "concreto");
    await new Promise(r => setTimeout(r, 450));
  }
};

$("activar").onclick = () => {
  son.desbloquear();
};

$("combate").onclick = () => {
  const on = !$("combate").classList.contains("on");
  $("combate").classList.toggle("on", on);
  son.combate(on);
};

$("vmus").oninput = () => son.volumen({
  musica: +$("vmus").value
});

$("vef").oninput = () => son.volumen({
  efectos: +$("vef").value
});

$("sala").onchange = cargar;

$("mitad").onchange = cargar;

const cv = $("mapa"), g = cv.getContext("2d");

const aCanvas = (x, z) => [ (vista.cx - x) / vista.lado * cv.width + cv.width / 2, (vista.cz - z) / vista.lado * cv.height + cv.height / 2 ];

const aJuego = (px, pz) => [ vista.cx - (px - cv.width / 2) / cv.width * vista.lado, vista.cz - (pz - cv.height / 2) / cv.height * vista.lado ];

let arrastrando = false;

const alPuntero = e => {
  const r = cv.getBoundingClientRect();
  const [x, z] = aJuego((e.clientX - r.left) / r.width * cv.width, (e.clientY - r.top) / r.height * cv.height);
  mover(x, z);
};

cv.onpointerdown = e => {
  arrastrando = true;
  son.desbloquear();
  alPuntero(e);
};

cv.onpointermove = e => {
  if (arrastrando) alPuntero(e);
};

addEventListener("pointerup", () => {
  arrastrando = false;
});

const teclas = new Set;

addEventListener("keydown", e => teclas.add(e.code));

addEventListener("keyup", e => teclas.delete(e.code));

function dibujar() {
  g.fillStyle = "#100c0a";
  g.fillRect(0, 0, cv.width, cv.height);
  if (!vista) return;
  const dentro = new Set(son.motor.zonasDentro);
  g.font = "13px Georgia";
  g.lineWidth = 1.5;
  for (const r of regsEscena) {
    const [x0, z0, x1, z1] = r.area, [a, b] = aCanvas(x0, z0), [c, d] = aCanvas(x1, z1);
    const col = r.tipo === 0 ? "#6e6258" : r.tipo === 2 ? "#5f8fc0" : "#c05f5f";
    g.strokeStyle = col;
    g.setLineDash(r.tipo === 0 ? [ 6, 4 ] : []);
    if (dentro.has(r)) {
      g.fillStyle = col + "33";
      g.fillRect(Math.min(a, c), Math.min(b, d), Math.abs(c - a), Math.abs(d - b));
    }
    g.strokeRect(Math.min(a, c), Math.min(b, d), Math.abs(c - a), Math.abs(d - b));
    if (r.tipo) {
      g.fillStyle = col;
      g.fillText((r.tipo === 3 ? "✕ " : "♪ ") + (r.no || "todo"), Math.min(a, c) + 4, Math.min(b, d) + 15);
    }
  }
  g.setLineDash([]);
  const [x, , z] = visorAJuego([ jugador.position.x, jugador.position.y - OJOS, jugador.position.z ], ESCALA), [px, pz] = aCanvas(x, z);
  g.fillStyle = "#f0e0c0";
  g.beginPath();
  g.arc(px, pz, 7, 0, 7);
  g.fill();
  g.strokeStyle = "#f0e0c0";
  g.beginPath();
  g.moveTo(px, pz);
  g.lineTo(px + Math.sin(rumbo) * 18, pz - Math.cos(rumbo) * 18);
  g.stroke();
}

let antes = performance.now(), acumPaso = 0, ultimoEstado = 0;

function cuadro(ahora) {
  requestAnimationFrame(cuadro);
  const dt = Math.min(.1, (ahora - antes) / 1e3);
  antes = ahora;
  const ad = (teclas.has("KeyW") || teclas.has("ArrowUp")) - (teclas.has("KeyS") || teclas.has("ArrowDown"));
  rumbo += ((teclas.has("KeyD") || teclas.has("ArrowRight")) - (teclas.has("KeyA") || teclas.has("ArrowLeft"))) * dt * 2.5;
  camara.rotation.set(0, -rumbo, 0);
  if (ad) {
    const v = 1.45 / ESCALA * dt * ad;
    caminar(-Math.sin(rumbo) * v, Math.cos(rumbo) * v);
    acumPaso += dt;
    if (acumPaso > .5) {
      acumPaso = 0;
      son.paso(null);
    }
  }
  if (orbita) {
    orbita.t += dt;
    orbita.fuente.position.set(jugador.position.x + Math.cos(orbita.t) * 3, jugador.position.y, jugador.position.z + Math.sin(orbita.t) * 3);
    son.efectoMover?.(orbita.h, orbita.fuente.position);
  }
  son.actualizar(dt);
  dibujar();
  const n = son.nivel();
  $("vumetro").firstChild.style.width = Math.min(100, n.rms * 400) + "%";
  if (ahora - ultimoEstado > 200) {
    ultimoEstado = ahora;
    $("estado").textContent = son.estado();
    $("aviso").textContent = son.desbloqueado ? "" : "Hacé clic en cualquier lado para activar el audio";
  }
}

window.prueba.listo = cargar();

await window.prueba.listo;

requestAnimationFrame(cuadro);

window.prueba.offline = async function() {
  const medir = b => [ 0, 1 ].map(c => {
    const d = b.getChannelData(Math.min(c, b.numberOfChannels - 1));
    let s = 0, p = 0;
    for (const v of d) {
      s += v * v;
      p = Math.max(p, Math.abs(v));
    }
    return {
      rms: +Math.sqrt(s / d.length).toFixed(4),
      pico: +p.toFixed(3)
    };
  });
  const mezclar = async (id, lado, seg = 2) => {
    const oc = new OfflineAudioContext(2, 48e3 * seg, 48e3);
    oc.listener.positionX.value = 0;
    oc.listener.forwardZ.value = -1;
    for (const b of await son.buffers(id)) {
      const s = oc.createBufferSource();
      s.buffer = b.ab;
      const g = oc.createGain();
      g.gain.value = b.vol ? b.vol / 127 : 1;
      let fin = g;
      if (lado != null) {
        const pn = oc.createPanner();
        pn.panningModel = "HRTF";
        pn.distanceModel = "linear";
        pn.refDistance = .25;
        pn.maxDistance = 20;
        pn.positionX.value = lado;
        pn.positionZ.value = -.5;
        g.connect(pn);
        fin = pn;
      }
      s.connect(g);
      fin.connect(oc.destination);
      s.start();
    }
    const r = await oc.startRendering();
    const [L, R] = medir(r);
    return {
      L: L,
      R: R
    };
  };
  const res = {};
  res.pasoDerecha = await mezclar(D.pasos.concreto, 2);
  res.pasoIzquierda = await mezclar(D.pasos.concreto, -2);
  res.pasoLejos = await mezclar(D.pasos.concreto, 15);
  res.puertaAcero = await mezclar(D.puertas.STEEL[0], null);
  res.hil = await mezclar(61200, 3, 3);
  res.musica10031 = await mezclar(10031, null, 3);
  res.ambiente20180 = await mezclar(20180, null, 3);
  return res;
};
