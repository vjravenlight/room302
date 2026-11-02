// SH4 web — FeniXVOID · Project Ravenlight
import * as THREE from "three";

import { armarSala, crearLucesPersonajes } from "../lib/sala.js";

import { iniciarHenry } from "../henry.js";

import { prepararCasco, casco } from "./casco_comun.js";

const q = new URLSearchParams(location.search);

const SALA = q.get("sala") || "sb02", OJOS = 1.6, ESC = .005;

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  preserveDrawingBuffer: true
});

renderer.setSize(innerWidth, innerHeight);

renderer.outputColorSpace = THREE.SRGBColorSpace;

document.body.appendChild(renderer.domElement);

const escena = new THREE.Scene;

escena.background = new THREE.Color(0);

const rigXR = new THREE.Group;

rigXR.name = "espacio del jugador";

escena.add(rigXR);

const camara = new THREE.PerspectiveCamera(80, innerWidth / innerHeight, .02, 400);

camara.position.set(0, OJOS, 0);

rigXR.add(camara);

const rigHenry = new THREE.Group;

rigHenry.name = "Henry (ojos)";

escena.add(rigHenry);

const ctrl = [ new THREE.Group, new THREE.Group ], grip = [ new THREE.Group, new THREE.Group ];

ctrl.forEach((c, i) => {
  c.name = "rayo " + i;
  grip[i].name = "grip " + i;
  rigXR.add(c, grip[i]);
});

const pads = [ "right", "left" ].map(lado => ({
  handedness: lado,
  gamepad: {
    buttons: [ 0, 1, 2, 3, 4, 5 ].map(() => ({
      pressed: false,
      value: 0
    })),
    axes: [ 0, 0, 0, 0 ],
    hapticActuators: [ {
      pulse: () => {
        vib[lado]++;
      }
    } ]
  }
}));

const vib = {
  left: 0,
  right: 0
};

let presentando = true;

const ARTIC = [ "wrist", "thumb-tip", "index-finger-tip", "index-finger-metacarpal", "pinky-finger-metacarpal", "middle-finger-phalanx-proximal" ];

const manosFalsas = [ 0, 1 ].map(i => {
  const h = new THREE.Group;
  h.name = "mano de verdad " + i;
  h.joints = {};
  for (const n of ARTIC) {
    const j = new THREE.Group;
    j.name = n;
    h.joints[n] = j;
    h.add(j);
  }
  return h;
});

const xrFalso = {
  enabled: false,
  get isPresenting() {
    return presentando;
  },
  getController: i => ctrl[i],
  getControllerGrip: i => grip[i],
  getHand: i => manosFalsas[i],
  getCamera: () => camara,
  getReferenceSpace: () => null,
  setReferenceSpace() {},
  getEnvironmentBlendMode: () => "opaque",
  hasDepthSensing: () => false,
  getSession: () => presentando ? {
    inputSources: pads
  } : null,
  addEventListener() {},
  removeEventListener() {}
};

renderer.xr = xrFalso;

const cascoP = prepararCasco({
  renderer: renderer,
  camara: camara,
  padre: rigXR,
  ojos: OJOS
});

for (let i = 0; i < 2; i++) {
  const e = {
    type: "connected",
    data: {
      handedness: i === 0 ? "right" : "left",
      gamepad: pads[i].gamepad
    }
  };
  ctrl[i].dispatchEvent(e);
  grip[i].dispatchEvent(e);
}

cascoP.manos.estados.forEach((e, i) => {
  e.fuente = pads[i];
});

function manoIzqDeVerdad() {
  const e = {
    type: "connected",
    data: {
      handedness: "left",
      hand: new Map
    }
  };
  ctrl[1].dispatchEvent(e);
  const J = manosFalsas[1].joints, b = new THREE.Vector3(-.15, 1.25, -.35);
  J.wrist.position.copy(b);
  J["index-finger-metacarpal"].position.copy(b).add(new THREE.Vector3(.03, .02, -.05));
  J["pinky-finger-metacarpal"].position.copy(b).add(new THREE.Vector3(-.02, .02, -.05));
  J["middle-finger-phalanx-proximal"].position.copy(b).add(new THREE.Vector3(.01, .03, -.09));
  pellizcar(false);
}

function pellizcar(si, adelante = 0, costado = 0) {
  const J = manosFalsas[1].joints, p = new THREE.Vector3(-.12 + costado, 1.2, -.4 - adelante);
  J["thumb-tip"].position.copy(p);
  J["index-finger-tip"].position.copy(p).add(new THREE.Vector3(si ? .01 : .06, 0, 0));
}

grip[1].position.set(-.14, 1.22, -.34);

grip[1].rotation.set(-.5, 0, 0);

ctrl[0].position.set(.16, 1.25, -.22);

const bajar = ruta => fetch("/juego/" + ruta).then(r => {
  if (!r.ok) throw new Error("no pude leer " + ruta);
  return r.arrayBuffer();
});

const $e = document.getElementById("estado");

$e.textContent = "cargando " + SALA + "…";

const sala = await armarSala(THREE, bajar, SALA);

escena.add(sala.grupo);

escena.add(crearLucesPersonajes(THREE, sala.luces));

const colision = sala.colision;

const pos = (q.get("pos") || "410,0,-1825").split(",").map(Number);

rigHenry.position.set(-pos[0] * ESC, -pos[1] * ESC + OJOS, pos[2] * ESC);

rigXR.position.set(rigHenry.position.x, rigHenry.position.y - OJOS, rigHenry.position.z);

window.sh4 = {
  renderer: renderer,
  camaraJuego: {
    estado: {
      sala: SALA
    },
    activa: true
  }
};

const henry = await iniciarHenry({
  THREE: THREE,
  escena: escena,
  camara: camara,
  jugador: rigHenry,
  ojos: OJOS,
  getColision: () => colision,
  renderer: renderer,
  teclasInventario: [ "KeyI" ],
  camaraExterna: () => true,
  controlarCamara: false,
  pantallaGameOver: false,
  botones: true
});

window.sh4.henry = henry;

const dt = 1 / 72;

async function cuadros(n = 1, {dir: dir = null, fuerza: fuerza = 1, corriendo: corriendo = false, mover: mover = null} = {}) {
  for (let k = 0; k < n; k++) {
    const moviendo = !!dir;
    henry.actualizar(dt, {
      moviendo: moviendo,
      corriendo: corriendo,
      dir: dir ? dir.clone().normalize() : null,
      fuerza: fuerza,
      enVR: presentando
    });
    if (presentando && !henry.casco?.cine) {
      camara.getWorldPosition(_v);
      rigHenry.position.set(_v.x, rigXR.position.y + OJOS, _v.z);
    }
    cascoP.actualizar(dt, {
      moviendo: !!dir || !!mover
    });
    if (mover) {
      rigXR.position.addScaledVector(mover, dt);
      rigXR.updateMatrixWorld(true);
    }
    if (k % 12 === 11) await new Promise(r => setTimeout(r, 0));
  }
}

const _v = new THREE.Vector3;

function boton(lado, i, v) {
  const b = pads[lado === "right" ? 0 : 1].gamepad.buttons[i];
  b.pressed = !!v;
  b.value = v ? 1 : 0;
}

async function apretar(lado, i) {
  boton(lado, i, true);
  await cuadros(2);
  boton(lado, i, false);
  await cuadros(2);
}

function palito(lado, x, y) {
  const a = pads[lado === "right" ? 0 : 1].gamepad.axes;
  a[2] = x;
  a[3] = y;
}

function apuntarUV(u, v) {
  const m = henry.inventarioVR.malla;
  m.updateMatrixWorld(true);
  const w = m.geometry.parameters.width, h = m.geometry.parameters.height;
  const p = m.localToWorld(new THREE.Vector3((u - .5) * w, (.5 - v) * h, 0));
  const n = new THREE.Vector3(0, 0, 1).transformDirection(m.matrixWorld);
  const desde = p.clone().addScaledVector(n, .35).add(new THREE.Vector3(.05, -.08, 0));
  rigXR.updateMatrixWorld(true);
  ctrl[0].position.copy(rigXR.worldToLocal(desde.clone()));
  const opuesto = desde.clone().multiplyScalar(2).sub(p);
  ctrl[0].lookAt(opuesto);
  ctrl[0].updateMatrixWorld(true);
}

const apuntarLugar = i => apuntarUV((20 + 47.2 * i + 20) / 512, 72 / 288);

const apuntarBoton = id => apuntarUV({
  usar: 112,
  info: 289,
  volver: 433
}[id] / 512, 265 / 288);

function mirarMano() {
  const p = henry.inventarioVR.panel.getWorldPosition(new THREE.Vector3);
  camara.lookAt(p);
}

function mirarAdelante() {
  camara.rotation.set(0, 0, 0);
}

function vistaMano() {
  grip[0].position.set(.12, 1.32, -.32);
  grip[0].rotation.set(.6, .25, 0);
  grip[0].updateMatrixWorld(true);
  camara.lookAt(grip[0].getWorldPosition(new THREE.Vector3).add(new THREE.Vector3(0, .08, 0)));
}

function dibujar() {
  renderer.render(escena, camara);
}

function estado() {
  const c = henry.casco;
  const m = cascoP.manos, der = m.estados.find(e => e.lado === "der"), izq = m.estados.find(e => e.lado === "izq");
  return {
    inv: henry.inventarioVR?.estado,
    lugares: henry.inventario.lugares.map(l => l.k + "x" + l.n),
    arma: henry.controlador.s.arma,
    vida: +henry.vida.toFixed(1),
    modo: henry.modo,
    cine: c?.estado,
    henryPos: rigHenry.position.toArray().map(x => +x.toFixed(3)),
    vib: {
      ...vib
    },
    camaraLayers: camara.layers.mask,
    pantallaVisible: c?.salaCine.visible,
    oyente: window.sh4.oyenteCasco === c?.camara,
    manos: {
      activa: m.activa,
      der: der && {
        tipo: der.tipo,
        mira: der.mira.visible,
        indice: +der.proc.der?.dedos.indice[0].rotation.x.toFixed(2),
        medio: +der.proc.der?.dedos.medio[0].rotation.x.toFixed(2)
      },
      izq: izq && {
        tipo: izq.tipo,
        pellizco: izq.pellizco
      },
      agarre: casco.agarre && {
        lado: casco.agarre.lado,
        pistola: casco.agarre.pistola
      },
      arma: henry.armaVista?.montura.parent?.name || null,
      palito: {
        x: +casco.palito.x.toFixed(2),
        y: +casco.palito.y.toFixed(2)
      },
      casco: {
        ...cascoP.estado
      },
      invAbierto: casco.inventarioAbierto
    }
  };
}

await cuadros(10);

mirarAdelante();

dibujar();

$e.textContent = "listo: " + SALA;

function opcion(o) {
  const v = JSON.parse(localStorage.getItem("sh4opciones") || "{}");
  localStorage.setItem("sh4opciones", JSON.stringify(Object.assign(v, o)));
  dispatchEvent(new CustomEvent("sh4opciones", {
    detail: v
  }));
}

window.prueba = {
  henry: henry,
  cuadros: cuadros,
  boton: boton,
  apretar: apretar,
  palito: palito,
  apuntarLugar: apuntarLugar,
  apuntarBoton: apuntarBoton,
  apuntarUV: apuntarUV,
  mirarMano: mirarMano,
  mirarAdelante: mirarAdelante,
  dibujar: dibujar,
  estado: estado,
  THREE: THREE,
  camara: camara,
  rigXR: rigXR,
  rigHenry: rigHenry,
  casco: casco,
  cascoP: cascoP,
  manosFalsas: manosFalsas,
  manoIzqDeVerdad: manoIzqDeVerdad,
  pellizcar: pellizcar,
  opcion: opcion,
  ctrl: ctrl,
  grip: grip,
  vistaMano: vistaMano,
  salir() {
    presentando = false;
  },
  entrar() {
    presentando = true;
  }
};
