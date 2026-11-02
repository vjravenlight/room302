// SH4 web — FeniXVOID · Project Ravenlight
import * as THREE from "three";

import { partesBin } from "../lib/sh4bin.js";

import { leerModelo } from "../lib/modelo.js";

import { leerTexturas, aRGBA } from "../lib/texturas.js";

import { leerAnimacion } from "../lib/animacion.js";

import { crearPersonaje } from "../lib/personaje.js";

import { bajar, EQUIPO_CHICO } from "./motor.js";

const FPS = 30, ESC = .005;

const enVisor = (x, y, z, v = new THREE.Vector3) => v.set(-x * ESC, -y * ESC, z * ESC);

const al = () => Math.random();

const entero = n => Math.floor(Math.random() * n);

const HORAS = [ [ 2060, 2 ], [ 2051, 2 ], [ 1570, 2 ], [ 1130, 2 ], [ 718, 1 ], [ 1519, 0 ], [ 1504, 0 ] ];

export function horaDelDia(F) {
  for (const [b, h] of HORAS) if (F(b)) return h;
  return 2;
}

export const VISTAS = [ "tw00", "tw01", "tx00" ];

export const horaDeVista = nombre => Math.max(0, VISTAS.indexOf(String(nombre).slice(0, 4)));

export const ESCENAS = [ {
  ev: 71,
  bandera: 1511,
  nombre: "Cynthia",
  si: F => !F(1511) && F(1506),
  cam: [ [ .7854, .7373 ], [ .901, .6776 ] ],
  lente: 20,
  subs: [],
  minimo: 10
}, {
  ev: 87,
  bandera: 1532,
  nombre: "el detective y el policía",
  si: F => !F(1532) && F(315) && !F(501),
  cam: [ [ .7854, .7373 ], [ .901, .6776 ] ],
  lente: 20,
  subs: [ [ 1, 406 ], [ 5, 407 ], [ 9, null ] ]
}, {
  ev: 116,
  bandera: 1551,
  nombre: "Walter en el 207",
  si: F => !F(1551) && F(911) && !F(1101),
  cam: [ [ -.467, .677 ], [ -.076, .6504 ] ],
  lente: 20,
  subs: [ [ 1, 409 ], [ 5, 410 ], [ 9, null ] ]
}, {
  ev: 146,
  bandera: 1558,
  nombre: "la ambulancia",
  si: F => !F(1558) && F(1130) && !F(1301),
  cam: [ [ .8994, 1 ], [ 1, 1 ] ],
  lente: 40,
  subs: [ [ 1, 408 ], [ 5, null ] ],
  minimo: 6
} ];

export const escenaDeVentana = F => ESCENAS.findIndex(e => e.si(F));

const AUTOS = [ [ 5, 19, 1, 160, 2, 7, 128 ], [ 6, 20, 1, 160, 2, 7, 128 ], [ 7, 21, 1, 130, 1.5, 7, 128 ], [ 8, 22, 1, 130, 1.5, 7, 128 ], [ 9, 23, 1, 240, 4, 5, 120 ], [ 10, 24, 1, 120, 1.2, 10, 128 ], [ 11, 25, 2, 160, 2, 7, 128 ], [ 12, 26, 2, 160, 2, 7, 128 ], [ 13, 27, 2, 160, 2, 7, 128 ], [ 18, 33, 2, 160, 2, 7, 250 ], [ 15, 30, 2, 100, 1, 18, 20 ], [ 16, 31, 1, 100, 1, 20, 40 ], [ 14, 28, 2, 160, 2, 10, 8 ], [ 17, 32, 2, 160, 2, 10, 16 ] ];

const CARRILES = [ {
  ini: [ 7700, 0, -1600 ],
  fin: [ 7700, 0, -22e3 ],
  dir: [ 0, 0, -1 ],
  pFin: [ 0, 0, -1, -22e3 ],
  pPare: [ 0, 0, -1, -7e3 ],
  pCruce: [ 0, 0, -1, -7500 ],
  giro: Math.PI
}, {
  ini: [ 9438, 0, -22e3 ],
  fin: [ 9438, 0, -1600 ],
  dir: [ 0, 0, 1 ],
  pFin: [ 0, 0, 1, 1600 ],
  pPare: [ 0, 0, 1, 13e3 ],
  pCruce: [ 0, 0, 1, 12500 ],
  giro: 0
} ];

const MAX_AUTOS = 10;

const PEATONES = [ [ 3, 0 ], [ 4, 0 ], [ 5, 0 ], [ 6, 0 ], [ 8, 1 ], [ 8, 1 ], [ 8, 1 ], [ 10, 1 ], [ 11, 2 ], [ 12, 2 ], [ 13, 2 ], [ 14, 2 ] ];

const ANDARES = [ [ 15, 7 ], [ 16, 10 ], [ 15, 6 ], [ 16, 9 ], [ 17, 24 ] ];

const CAMINOS = [ {
  a: [ 5938, 0, -2581 ],
  b: [ 5938, 0, -7542 ],
  c: [ 1383, 0, -7542 ],
  p1: [ 0, 0, 1, 1590 ],
  p2: [ -1, 0, 0, 383 ]
}, {
  a: [ 16311, 0, -9489 ],
  b: [ 10834, 0, -9489 ],
  c: [ 10834, 0, -1936 ],
  p1: [ 1, 0, 0, -15311 ],
  p2: [ 0, 0, 1, 936 ]
}, {
  a: [ 10884, 0, -24039 ],
  b: [ 10884, 0, -12399 ],
  c: [ 20072, 0, -12399 ],
  p1: [ 0, 0, -1, -23039 ],
  p2: [ 1, 0, 0, -19072 ]
}, {
  a: [ -1646, 0, -10482 ],
  b: [ 5938, 0, -10482 ],
  c: [ 5938, 0, -17939 ],
  p1: [ -1, 0, 0, -646 ],
  p2: [ 0, 0, -1, -16939 ]
} ];

const MAX_PEATONES = EQUIPO_CHICO ? 16 : 40;

const VECINOS = [ [ 1, "twdm_106re00", [ [ 2, 0, 1, 2, 12, 40, 20, 20, 20 ], [ 6, 0, 5, 12, 0, 30, 50, 20, 0 ], [ 7, 3, 0, 0, 0, 100, 0, 0, 0 ], [ 8, 3, 4, 0, 0, 70, 30, 0, 0 ], [ 9, 0, 0, 0, 0, 100, 0, 0, 0 ], [ 10, 6, 0, 0, 0, 100, 0, 0, 0 ], [ 11, 6, 7, 8, 9, 40, 20, 20, 20 ], [ 12, 6, 8, 9, 0, 60, 20, 20, 0 ], [ 13, 6, 7, 9, 0, 60, 20, 20, 0 ], [ 3, 0, 0, 0, 0, 100, 0, 0, 0 ], [ 4, 11, 0, 0, 0, 100, 0, 0, 0 ], [ 5, 0, 0, 0, 0, 100, 0, 0, 0 ], [ 14, 13, 0, 0, 0, 100, 0, 0, 0 ], [ 17, 13, 14, 18, 22, 50, 20, 20, 10 ], [ 18, 15, 16, 0, 0, 70, 30, 0, 0 ], [ 19, 15, 16, 17, 0, 50, 30, 20, 0 ], [ 20, 15, 17, 0, 0, 60, 40, 0, 0 ], [ 21, 13, 0, 0, 0, 100, 0, 0, 0 ], [ 22, 19, 20, 0, 0, 70, 30, 0, 0 ], [ 23, 19, 20, 21, 0, 50, 30, 20, 0 ], [ 24, 19, 21, 0, 0, 60, 40, 0, 0 ], [ 15, 13, 0, 0, 0, 100, 0, 0, 0 ], [ 16, 0, 0, 0, 0, 100, 0, 0, 0 ] ] ], [ 2, "twdm_106re00", [ [ 25, 0, 1, 2, 6, 40, 20, 20, 20 ], [ 27, 0, 1, 2, 6, 20, 40, 20, 20 ], [ 28, 3, 4, 0, 0, 50, 50, 0, 0 ], [ 29, 3, 4, 5, 0, 30, 40, 30, 0 ], [ 30, 3, 4, 5, 0, 30, 40, 30, 0 ], [ 31, 0, 1, 0, 0, 50, 50, 0, 0 ], [ 32, 7, 8, 0, 0, 50, 50, 0, 0 ], [ 33, 7, 8, 9, 0, 30, 40, 30, 0 ], [ 34, 7, 8, 9, 0, 30, 40, 30, 0 ], [ 26, 0, 1, 0, 0, 50, 50, 0, 0 ] ] ], [ 4, "twdm_106ma00", [ [ 2, 0, 1, 2, 6, 40, 20, 20, 20 ], [ 4, 0, 1, 2, 6, 20, 40, 20, 20 ], [ 5, 3, 4, 0, 0, 50, 50, 0, 0 ], [ 6, 3, 4, 5, 0, 30, 40, 30, 0 ], [ 7, 3, 4, 5, 0, 30, 40, 30, 0 ], [ 8, 0, 1, 0, 0, 50, 50, 0, 0 ], [ 9, 7, 8, 0, 0, 50, 50, 0, 0 ], [ 10, 7, 8, 9, 0, 30, 40, 30, 0 ], [ 11, 7, 8, 9, 0, 30, 40, 30, 0 ], [ 3, 0, 1, 0, 0, 50, 50, 0, 0 ] ] ], [ 8, "twdm_107ma00", [ [ 2, 0, 1, 2, 4, 50, 15, 15, 20 ], [ 3, 0, 1, 2, 5, 10, 60, 15, 15 ], [ 9, 8, 11, 0, 0, 50, 50, 0, 0 ], [ 16, 0, 1, 0, 0, 50, 50, 0, 0 ], [ 4, 0, 5, 0, 0, 30, 70, 0, 0 ], [ 5, 6, 0, 0, 0, 100, 0, 0, 0 ], [ 6, 6, 7, 0, 0, 70, 30, 0, 0 ], [ 7, 0, 0, 0, 0, 100, 0, 0, 0 ], [ 10, 9, 0, 0, 0, 100, 0, 0, 0 ], [ 11, 9, 10, 0, 0, 80, 20, 0, 0 ], [ 12, 3, 0, 0, 0, 100, 0, 0, 0 ], [ 13, 12, 0, 0, 0, 100, 0, 0, 0 ], [ 14, 12, 13, 0, 0, 80, 20, 0, 0 ], [ 15, 3, 0, 0, 0, 100, 0, 0, 0 ] ] ], [ 16, "twdm_107ma00", [ [ 18, 0, 1, 2, 0, 70, 10, 20, 0 ], [ 19, 0, 2, 0, 0, 60, 40, 0, 0 ], [ 20, 3, 0, 0, 0, 100, 0, 0, 0 ], [ 21, 3, 4, 0, 0, 70, 30, 0, 0 ], [ 22, 0, 1, 0, 0, 80, 20, 0, 0 ] ] ], [ 32, "twdm_107ma00", [ [ 17, 0, 0, 0, 0, 100, 0, 0, 0 ] ] ], [ 64, "twdm_107ma00", [ [ 23, 0, 1, 2, 9, 70, 10, 10, 10 ], [ 25, 0, 3, 0, 0, 70, 30, 0, 0 ], [ 26, 0, 3, 0, 0, 70, 30, 0, 0 ], [ 27, 4, 0, 0, 0, 100, 0, 0, 0 ], [ 29, 4, 5, 6, 8, 70, 10, 10, 10 ], [ 28, 4, 8, 0, 0, 70, 30, 0, 0 ], [ 30, 4, 7, 8, 0, 40, 50, 10, 0 ], [ 31, 4, 8, 0, 0, 70, 30, 0, 0 ], [ 32, 0, 0, 0, 0, 100, 0, 0, 0 ], [ 24, 0, 3, 0, 0, 70, 30, 0, 0 ] ] ], [ 128, "twdm_206ma00", [ [ 2, 0, 1, 2, 9, 70, 10, 10, 10 ], [ 4, 0, 3, 0, 0, 70, 30, 0, 0 ], [ 5, 0, 3, 0, 0, 70, 30, 0, 0 ], [ 6, 4, 0, 0, 0, 100, 0, 0, 0 ], [ 7, 4, 5, 6, 8, 70, 10, 10, 10 ], [ 8, 4, 8, 0, 0, 70, 30, 0, 0 ], [ 9, 4, 7, 8, 0, 40, 50, 10, 0 ], [ 10, 4, 8, 0, 0, 70, 30, 0, 0 ], [ 11, 0, 0, 0, 0, 100, 0, 0, 0 ], [ 3, 0, 3, 0, 0, 70, 30, 0, 0 ] ] ], [ 256, "twdm_206fe00", [ [ 2, 0, 1, 2, 0, 70, 15, 15, 0 ], [ 3, 0, 1, 2, 0, 70, 15, 15, 0 ], [ 4, 0, 1, 2, 0, 70, 15, 15, 0 ] ] ], [ 512, "twdm_206ch00", [ [ 2, 0, 1, 0, 0, 90, 10, 0, 0 ], [ 3, 2, 0, 0, 0, 100, 0, 0, 0 ], [ 4, 0, 0, 0, 0, 100, 0, 0, 0 ] ] ], [ 1024, "twdm_206ch00", [ [ 5, 0, 1, 2, 3, 85, 5, 5, 5 ], [ 6, 0, 1, 2, 3, 85, 5, 5, 5 ], [ 7, 0, 1, 2, 3, 85, 5, 5, 5 ], [ 8, 0, 1, 2, 3, 85, 5, 5, 5 ] ] ], [ 2048, "twdm_206ch00", [ [ 9, 0, 1, 2, 3, 25, 25, 25, 25 ], [ 10, 0, 1, 2, 4, 25, 25, 25, 25 ], [ 11, 0, 1, 3, 4, 25, 25, 25, 25 ], [ 12, 0, 2, 3, 4, 25, 25, 25, 25 ], [ 13, 1, 2, 3, 4, 25, 25, 25, 25 ] ] ], [ 4096, "twdm_206ch00", [ [ 14, 0, 1, 2, 3, 25, 25, 25, 25 ], [ 14, 0, 1, 2, 4, 25, 25, 25, 25 ], [ 14, 0, 1, 3, 4, 25, 25, 25, 25 ], [ 14, 0, 2, 3, 4, 25, 25, 25, 25 ], [ 14, 1, 2, 3, 4, 25, 25, 25, 25 ] ] ], [ 8192, "twdm_206ch01", [ [ 2, 0, 1, 2, 3, 50, 20, 20, 10 ], [ 3, 0, 1, 2, 3, 50, 20, 20, 10 ], [ 4, 0, 1, 2, 3, 50, 20, 20, 10 ], [ 5, 4, 0, 0, 0, 100, 0, 0, 0 ], [ 6, 4, 5, 0, 0, 90, 10, 0, 0 ], [ 7, 0, 1, 2, 0, 60, 20, 20, 0 ] ] ], [ 16384, "twdm_206ch01", [ [ 8, 0, 1, 2, 3, 25, 25, 25, 25 ], [ 9, 0, 1, 2, 4, 25, 25, 25, 25 ], [ 10, 0, 1, 3, 4, 25, 25, 25, 25 ], [ 11, 0, 2, 3, 4, 25, 25, 25, 25 ], [ 12, 1, 2, 3, 4, 25, 25, 25, 25 ] ] ], [ 32768, "twdm_206ch01", [ [ 13, 0, 1, 2, 3, 25, 25, 25, 25 ], [ 14, 0, 1, 2, 4, 25, 25, 25, 25 ], [ 15, 0, 1, 3, 4, 25, 25, 25, 25 ], [ 16, 0, 2, 3, 4, 25, 25, 25, 25 ], [ 17, 1, 2, 3, 4, 25, 25, 25, 25 ] ] ], [ 65536, "twdm_207ri00", [ [ 2, 0, 1, 2, 5, 60, 10, 10, 20 ], [ 3, 0, 2, 4, 5, 50, 10, 20, 20 ], [ 4, 0, 1, 4, 5, 50, 10, 20, 20 ], [ 12, 0, 0, 0, 0, 100, 0, 0, 0 ], [ 11, 13, 15, 16, 17, 70, 10, 10, 10 ], [ 10, 7, 8, 9, 10, 25, 25, 25, 25 ], [ 9, 0, 0, 0, 0, 100, 0, 0, 0 ], [ 5, 6, 7, 9, 10, 25, 25, 25, 25 ], [ 6, 6, 7, 8, 10, 25, 25, 25, 25 ], [ 7, 6, 8, 9, 10, 25, 25, 25, 25 ], [ 8, 6, 7, 8, 9, 25, 25, 25, 25 ], [ 19, 0, 0, 0, 0, 100, 0, 0, 0 ], [ 13, 13, 15, 16, 17, 25, 25, 25, 25 ], [ 14, 12, 13, 16, 17, 25, 25, 25, 25 ], [ 14, 11, 13, 15, 16, 15, 25, 30, 30 ], [ 15, 11, 14, 15, 17, 15, 30, 30, 25 ], [ 16, 11, 13, 14, 17, 15, 30, 25, 30 ], [ 17, 11, 15, 16, 17, 15, 30, 25, 30 ] ] ], [ 131072, "twdm_207ri00", [ [ 20, 0, 1, 2, 3, 55, 15, 15, 15 ], [ 21, 0, 4, 5, 0, 60, 20, 20, 0 ], [ 22, 0, 4, 5, 0, 60, 20, 20, 0 ], [ 23, 0, 4, 5, 0, 60, 20, 20, 0 ], [ 24, 0, 1, 3, 5, 60, 10, 10, 20 ], [ 28, 6, 7, 0, 0, 50, 50, 0, 0 ], [ 25, 6, 7, 8, 0, 10, 50, 40, 0 ], [ 26, 6, 7, 8, 0, 10, 50, 40, 0 ], [ 27, 0, 0, 0, 0, 100, 0, 0, 0 ] ] ], [ 262144, "twdm_207ri00", [ [ 32, 0, 0, 0, 0, 100, 0, 0, 0 ] ] ] ];

const FAROLES = [ [ 2673.8, -766.1, -2325.7 ], [ 10566.4, -909.4, -6331.4 ], [ 5150.3, -909.4, -7802.1 ], [ 5150.3, -909.4, -8047.2 ], [ 3620.1, -909.4, -7802.1 ], [ 3620.1, -909.4, -8047.2 ], [ 3595.6, -909.4, -9933.4 ], [ 3595.6, -909.4, -10178.5 ], [ 5137.7, -909.4, -9933.4 ], [ 5137.7, -909.4, -10178.5 ], [ 6263.3, -495.1, -6400 ], [ 5241.5, -766.1, -4609.9 ], [ 6263.3, -495.1, -7563.5 ], [ 6834, -909.4, -4275.2 ], [ 6591, -909.4, -4275.2 ], [ 10600.5, -909.4, -14054.2 ], [ 10357.5, -909.4, -14054.2 ], [ 10600.5, -909.4, -16532 ], [ 10357.5, -909.4, -16532 ], [ 6588.2, -909.4, -11843.7 ], [ 6831.3, -909.4, -11843.7 ], [ 2062.6, -766.1, 2183.1 ], [ 5241.5, -766.1, -6854.4 ], [ 2941.8, -766.1, -6872.1 ], [ 6591, -909.4, -6176.8 ], [ 6834, -909.4, -6176.8 ], [ 10316.5, -909.4, -7935.8 ], [ 10559.5, -909.4, -7935.8 ], [ 10323.4, -909.4, -6331.4 ] ];

const BALIZAS_BARRA = [ [ -200, -600, 350 ], [ -100, -600, 350 ], [ 100, -600, 350 ], [ 200, -600, 350 ] ];

const BALIZAS = [ [ -140, -390, -50 ], [ -70, -390, -50 ], [ 70, -390, -50 ], [ 140, -390, -50 ] ];

const CUADROS_BALIZA = [ [ 0, 32 ], [ 32, 64 ], [ 64, 96 ], [ 96, 128 ], [ 128, 96 ], [ 96, 64 ], [ 64, 32 ], [ 32, 0 ] ];

const GLOBO = {
  fase: Math.random() * 2,
  sello: performance.now()
};

const EJE_Y = new THREE.Vector3(0, 1, 0);

const _q1 = new THREE.Quaternion, _q2 = new THREE.Quaternion, _e1 = new THREE.Vector3, _e2 = new THREE.Vector3, _d1 = new THREE.Vector3;

export function direccionVentana(giro, cabeceo, out = new THREE.Vector3) {
  const d = new THREE.Vector3(1, 0, 0);
  _e1.crossVectors(EJE_Y, d).normalize();
  _q1.setFromAxisAngle(_e1, -cabeceo * .3054);
  _d1.copy(d).applyQuaternion(_q1);
  _e2.crossVectors(_d1, _e1).normalize();
  _q2.setFromAxisAngle(_e2, giro * .829);
  return out.copy(d).applyQuaternion(_q2.multiply(_q1));
}

export function rotacionVisor(dj) {
  const vx = -dj.x, vy = -dj.y, vz = dj.z, l = Math.hypot(vx, vy, vz) || 1;
  return {
    y: Math.atan2(-vx, -vz),
    x: Math.asin(THREE.MathUtils.clamp(vy / l, -1, 1))
  };
}

export const ojoVentana = lado => [ 0, -1640, lado ? 0 : -1e3 ];

const lenteVertical = h => THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(h) / 2) * 3 / 4));

function crearCargador() {
  const bins = new Map, cosas = new Map;
  const bin = a => {
    if (!bins.has(a)) bins.set(a, bajar("data/" + a).then(b => ({
      b: b,
      p: partesBin(b)
    })));
    return bins.get(a);
  };
  const una = (k, f) => {
    if (!cosas.has(k)) cosas.set(k, f());
    return cosas.get(k);
  };
  const modelo = (a, i) => una(`m:${a}:${i}`, async () => {
    const m = await bin(a);
    return leerModelo(m.b, m.p[i].ofs, m.p[i].len);
  });
  const texturas = (a, i) => una(`t:${a}:${i}`, async () => {
    const m = await bin(a);
    return m.p[i] ? leerTexturas(m.b, m.p[i].ofs, m.p[i].len) : [];
  });
  const anim = (a, i) => una(`a:${a}:${i}`, async () => {
    const m = await bin(a);
    return m.p[i]?.tipo === "animacion" ? leerAnimacion(m.b, m.p[i].ofs, m.p[i].len) : null;
  });
  async function personaje(a, pm, pt, ta = a) {
    const [m, t] = await Promise.all([ modelo(a, pm), texturas(ta, pt) ]);
    return crearPersonaje(m, t);
  }
  function textura(img, {repetir: repetir = false} = {}) {
    const t = new THREE.DataTexture(aRGBA(img), img.ancho, img.alto, THREE.RGBAFormat);
    t.magFilter = THREE.LinearFilter;
    t.minFilter = THREE.LinearFilter;
    t.colorSpace = THREE.SRGBColorSpace;
    if (repetir) t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.needsUpdate = true;
    return t;
  }
  return {
    bin: bin,
    modelo: modelo,
    texturas: texturas,
    anim: anim,
    personaje: personaje,
    textura: textura
  };
}

export function crearCalle({grupo: grupo, hora: hora = 0, F: F = () => false, ojo: ojo = () => new THREE.Vector3, dirOjo: dirOjo = null, escena: escena = -1, conVecinos: conVecinos = true, forzarEscenas: forzarEscenas = false, alAvisar: alAvisar = null, forzarGlobo: forzarGlobo = false, forzarCae: forzarCae = false} = {}) {
  const C = crearCargador();
  const raiz = new THREE.Group;
  raiz.name = "calle viva (ventana.js)";
  grupo.add(raiz);
  const noche = hora === 2;
  let vivo = true, resto = 0;
  const avisar = t => {
    try {
      alAvisar?.(t);
    } catch {}
  };
  const reserva = new Map;
  async function sacar(clave, crear) {
    const l = reserva.get(clave);
    if (l?.length) {
      const p = l.pop();
      p.grupo.visible = true;
      return p;
    }
    const p = await crear();
    p.clave = clave;
    return p;
  }
  function devolver(p) {
    if (!p) return;
    p.grupo.removeFromParent();
    p.grupo.visible = false;
    (reserva.get(p.clave) || reserva.set(p.clave, []).get(p.clave)).push(p);
  }
  const autos = [], porCarril = [ [], [], [] ];
  const ARRIBA = [ 0, 1, 0 ];
  const plano = (p, P) => p[0] * P[0] + p[1] * P[1] + p[2] * P[2] + P[3];
  function nuevoAuto(carril, pos, tipo = entero(14)) {
    const T = AUTOS[tipo], L = CARRILES[carril];
    const a = {
      tipo: tipo,
      carril: carril,
      estado: 0,
      pos: [ ...pos ],
      vel: 0,
      acel: 0,
      max: 0,
      frena: al(),
      cede: entero(2),
      paraEnEsquina: entero(2),
      apurado: 0,
      barra: 0,
      baliza: 0,
      cuadros: [ 0, 0, 0, 0 ].map(() => entero(8)),
      pj: null,
      barraPj: null,
      sprites: null
    };
    if (L) {
      const lat = [ L.dir[2] * ARRIBA[1] - L.dir[1] * ARRIBA[2], 0, L.dir[1] * ARRIBA[0] - L.dir[0] * ARRIBA[1] ];
      const n = Math.hypot(...lat) || 1, k = al() * 100;
      a.pos[0] += lat[0] / n * k;
      a.pos[2] += lat[2] / n * k;
    }
    a.max = Math.min(T[3], T[3] * .7 + al() * T[3] * .3);
    a.vel = (al() * .4 + .8) * a.max;
    if (noche) {
      const r = entero(2);
      if (tipo === 12) a.barra = r;
      if (tipo === 13) a.baliza = r;
    }
    autos.push(a);
    porCarril[carril]?.unshift(a);
    armarAuto(a);
    return a;
  }
  async function armarAuto(a) {
    const T = AUTOS[a.tipo];
    const m = noche ? T[1] : T[0];
    try {
      const pj = await sacar(`auto:${m}`, () => C.personaje("tw_cars.bin", m, T[2]));
      if (!vivo || a.fuera) {
        devolver(pj);
        return;
      }
      a.pj = pj;
      raiz.add(pj.grupo);
      if (a.barra) {
        const b = await sacar("barra", () => C.personaje("tw_cars.bin", 29, 2));
        if (!vivo || a.fuera) {
          devolver(b);
          return;
        }
        a.barraPj = b;
        pj.huesos[0].add(b.grupo);
        const base = (new THREE.Quaternion).setFromAxisAngle(new THREE.Vector3(0, 0, 1), -Math.PI);
        b.grupo.quaternion.copy(new THREE.Quaternion(-.5, -.5, .5, .5).multiply(base));
        b.grupo.position.set(0, 0, -1);
        b.grupo.scale.setScalar(1.08 / ESC);
      }
      if (a.barra || a.baliza) a.sprites = await balizas(a);
      ubicarAuto(a);
    } catch (e) {
      console.warn("ventana: auto", e.message);
    }
  }
  function ubicarAuto(a) {
    if (!a.pj) return;
    const L = CARRILES[a.carril];
    a.pj.ubicar(a.pos[0], a.pos[1], a.pos[2], L ? L.giro : 0);
  }
  function quitarAuto(a) {
    a.fuera = true;
    autos.splice(autos.indexOf(a), 1);
    const l = porCarril[a.carril];
    if (l) l.splice(l.indexOf(a), 1);
    if (a.barraPj) devolver(a.barraPj);
    if (a.sprites) for (const s of a.sprites) s.removeFromParent();
    devolver(a.pj);
  }
  let pasaPatrullero = false;
  function pasoAuto(a) {
    const T = AUTOS[a.tipo], L = CARRILES[a.carril];
    if (!L) return;
    if (a.estado === 0) a.estado = 1;
    if (a.estado === 1) {
      if (a.vel <= a.max * 1.1) {
        if (a.max * .9 <= a.vel) a.acel = 0; else {
          if (a.acel < 0) a.acel = 0;
          if (a.vel < a.max * .5) a.acel += 1;
          a.acel += .2;
        }
      } else {
        if (a.acel > 0) a.acel = 0;
        a.acel -= .05;
      }
      if (a.apurado) {
        if (a.acel < 0) a.acel = 0;
        a.acel = .5;
      }
      if (a.paraEnEsquina && plano(a.pos, L.pCruce) < 0) {
        const p = a.pos.map((v, i) => v + L.dir[i] * a.max * 30);
        if (plano(p, L.pPare) > 0) {
          a.acel = 0;
          a.estado = 2;
        }
      }
    } else if (a.estado === 2) {
      if (a.acel > 0) a.acel = 0;
      const f = a.frena * .5;
      if (a.vel <= (1 - f) * a.max) a.acel = .5; else {
        a.acel -= f;
        if (a.acel < -5) a.acel = -5;
      }
      if (plano(a.pos, L.pCruce) > 0) a.estado = 1;
    }
    if (pasaPatrullero) {
      const p = a.pos.map((v, i) => v + L.dir[i] * a.max * 10);
      if (Math.abs(plano(p, L.pPare)) < 600) a.acel = -10;
    }
    const l = porCarril[a.carril], ad = l[l.indexOf(a) + 1];
    if (ad && ad.vel < a.vel) {
      const s = (AUTOS[ad.tipo][5] + T[5]) * 1.2 * .5;
      const d = Math.hypot(ad.pos[0] - a.pos[0], ad.pos[1] - a.pos[1], ad.pos[2] - a.pos[2]);
      if (d < (s + 20) * 200 && a.acel > -2) a.acel = -2;
      if (d < (s + 10) * 200) {
        if (a.acel > -10) a.acel = -10;
        if (a.cede) ad.apurado = 1;
      }
      if (d < s * 200) a.acel = (ad.vel - a.vel) * 1.1;
    }
    if (a.acel > T[4]) a.acel = T[4];
    a.vel += a.acel;
    if (a.vel > T[3]) a.vel = T[3];
    if (a.vel < 0) {
      a.vel = 0;
      a.acel = 0;
    }
    for (let i = 0; i < 3; i++) a.pos[i] += a.vel * L.dir[i];
    if (plano(a.pos, L.pFin) > 0) quitarAuto(a);
  }
  function probarAuto(carril, pos) {
    const tipo = entero(14);
    if (entero(256) >= AUTOS[tipo][6] || autos.length >= MAX_AUTOS) return;
    const ul = porCarril[carril][0];
    if (ul) {
      const d = Math.hypot(ul.pos[0] - pos[0], ul.pos[1] - pos[1], ul.pos[2] - pos[2]);
      if (d < (AUTOS[ul.tipo][5] + AUTOS[tipo][5]) * 1.2 * .5 * 200) return;
    }
    nuevoAuto(carril, pos, tipo);
  }
  const esperaAuto = () => noche ? entero(127) + 32 : entero(15) + 8;
  const relojAuto = [ esperaAuto(), esperaAuto() ];
  for (const [i, L] of CARRILES.entries()) {
    const largo = Math.hypot(L.fin[0] - L.ini[0], L.fin[2] - L.ini[2]);
    let t = 0;
    while (t < largo) {
      t += al() * 4e3 + 1400;
      probarAuto(i, L.ini.map((v, k) => v + L.dir[k] * t));
    }
  }
  for (const [i, L] of CARRILES.entries()) porCarril[i].sort((x, y) => plano(x.pos, [ L.dir[0], L.dir[1], L.dir[2], 0 ]) - plano(y.pos, [ L.dir[0], L.dir[1], L.dir[2], 0 ]));
  let hojaBaliza = null, texFarol = null;
  const matSprite = map => new THREE.SpriteMaterial({
    map: map,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    transparent: true,
    color: new THREE.Color(1, 1, 1),
    fog: false
  });
  async function balizas(a) {
    if (!hojaBaliza) hojaBaliza = C.texturas("tw_cars.bin", 4).then(t => {
      const img = t[0]?.[0];
      return img ? {
        tex: C.textura(img),
        w: img.ancho,
        h: img.alto
      } : null;
    });
    const H = await hojaBaliza;
    if (!H || !vivo || a.fuera) return null;
    const puntos = a.barra ? BALIZAS_BARRA : BALIZAS;
    return puntos.map((p, i) => {
      const t = H.tex.clone();
      t.needsUpdate = true;
      t.repeat.set(32 * 2 / H.w, 32 * 2 / H.h);
      const fila = !a.barra && i > 1 ? 1 : 0;
      const s = new THREE.Sprite(matSprite(t));
      s.userData = {
        p: p,
        fila: fila,
        i: i,
        H: H
      };
      s.scale.setScalar(400);
      s.renderOrder = 5;
      a.pj?.huesos[0].add(s);
      s.position.set(p[0], p[1], p[2]);
      return s;
    });
  }
  function animarBalizas(a) {
    if (!a.sprites) return;
    for (const s of a.sprites) {
      const {fila: fila, i: i, H: H} = s.userData, c = CUADROS_BALIZA[a.cuadros[i] & 7];
      const u0 = Math.min(c[0], c[1]) * 2 / H.w, espejo = c[0] > c[1];
      s.material.map.offset.set(espejo ? u0 + 64 / H.w : u0, fila * 32 * 2 / H.h);
      s.material.map.repeat.set(espejo ? -64 / H.w : 64 / H.w, 64 / H.h);
      a.cuadros[i] = a.cuadros[i] + 1 & 7;
    }
  }
  const faroles = [];
  if (noche) {
    C.texturas("tx00.bin", 2).then(t => {
      const img = t[0]?.[0];
      if (!img || !vivo) return;
      texFarol = C.textura(img);
      for (const p of FAROLES) {
        const m = matSprite(texFarol);
        m.color.setScalar(64 / 128);
        const s = new THREE.Sprite(m);
        s.renderOrder = 4;
        const k = al() * .5 + 1;
        s.scale.setScalar(2 * 170 * k * ESC);
        s.userData.p = enVisor(...p);
        raiz.add(s);
        faroles.push(s);
      }
    }).catch(e => console.warn("ventana: faroles", e.message));
  }
  const _o = new THREE.Vector3, _v = new THREE.Vector3;
  function moverFaroles() {
    if (!faroles.length) return;
    _o.copy(ojo());
    for (const s of faroles) {
      _v.copy(_o).sub(s.userData.p).normalize().multiplyScalar(100 * ESC);
      s.position.copy(s.userData.p).add(_v);
      s.material.opacity = entero(1024) < 8 ? (128 - entero(32)) / 128 : 1;
    }
  }
  const peatones = [];
  function nuevoPeaton(previo = 0) {
    if (peatones.length >= MAX_PEATONES) return;
    const camino = entero(4), tipo = entero(12), deADos = entero(4) === 0;
    const andar = deADos ? entero(4) : entero(5);
    const p = armarPeaton({
      camino: camino,
      tipo: tipo,
      andar: andar
    });
    let q = null;
    if (deADos && peatones.length < MAX_PEATONES) q = armarPeaton({
      camino: camino,
      tipo: entero(12),
      andar: andar,
      lider: p
    });
    for (let i = 0; i < previo; i++) {
      if (!p.fuera) pasoPeaton(p);
      if (q && !q.fuera) pasoPeaton(q);
    }
    for (const x of [ p, q ]) if (x && !x.fuera) vestirPeaton(x);
  }
  function armarPeaton({camino: camino, tipo: tipo, andar: andar, lider: lider = null}) {
    const W = CAMINOS[camino];
    const p = {
      camino: camino,
      tipo: tipo,
      andar: andar,
      lider: lider,
      idx: 1,
      pos: [ 0, 0, 0 ],
      dir: [ 0, 0, 1 ],
      puntos: null,
      plano: null,
      pj: null,
      fuera: false
    };
    const k = al() * .1 + .95;
    p.velAnim = lider ? lider.velAnim : k;
    p.vel = lider ? lider.vel : (tipo > 7 ? k * .7 : k) * ANDARES[andar][1];
    if (!lider) {
      const ida = entero(2) === 1;
      const ini = [ ...ida ? W.a : W.c ], fin = [ ...ida ? W.c : W.a ];
      p.plano = ida ? W.p2 : W.p1;
      const tirar = v => {
        const r = al() * 200, g = al() * 6.28319;
        v[0] += Math.sin(g) * r;
        v[2] += Math.cos(g) * r;
        return v;
      };
      tirar(ini);
      const hacia = (o, d) => {
        const v = [ d[0] - o[0], 0, d[2] - o[2] ], n = Math.hypot(v[0], v[2]) || 1;
        return [ o[0] + v[0] / n * 2e3, 0, o[2] + v[2] / n * 2e3 ];
      };
      p.puntos = [ ini, hacia(W.b, ini), [ ...W.b ], hacia(W.b, fin), fin ];
      for (let i = 1; i < 5; i++) tirar(p.puntos[i]);
      p.pos = [ ...ini ];
    } else {
      p.lado = entero(2) ? -160 : 160;
      p.puntos = lider.puntos;
      p.plano = lider.plano;
      p.pos = aCostado(lider, p.lado);
      p.desde = entero(16);
    }
    const t = p.puntos[p.idx];
    const v = [ t[0] - p.pos[0], 0, t[2] - p.pos[2] ], n = Math.hypot(v[0], v[2]) || 1;
    p.dir = [ v[0] / n, 0, v[2] / n ];
    peatones.push(p);
    return p;
  }
  function aCostado(l, lado) {
    const g = Math.atan2(l.dir[0], l.dir[2]), c = Math.cos(g), s = Math.sin(g);
    return [ l.pos[0] + lado * c, l.pos[1], l.pos[2] - lado * s ];
  }
  function pasoPeaton(p) {
    if (p.lider) {
      if (p.lider.fuera) return sacarPeaton(p);
      const o = aCostado(p.lider, p.lado), v = [ o[0] - p.pos[0], 0, o[2] - p.pos[2] ], d = Math.hypot(v[0], v[2]);
      if (d > .001) {
        const k = Math.min(1, p.vel / d);
        p.dir = d > p.vel ? [ v[0] / d, 0, v[2] / d ] : p.lider.dir;
        p.pos[0] += v[0] * k;
        p.pos[2] += v[2] * k;
      } else p.dir = p.lider.dir;
      return;
    }
    const n = p.puntos.length, t = p.puntos[p.idx], sig = p.puntos[Math.min(p.idx + 1, n - 1)];
    const v = [ t[0] - p.pos[0], 0, t[2] - p.pos[2] ], d = Math.hypot(v[0], v[2]) || .001;
    const r = p.vel / d;
    if (r > .98) {
      if (++p.idx >= n) return sacarPeaton(p);
    } else {
      const m0 = p.dir.map(x => x * p.vel * 15);
      let m1;
      if (p.andar === 4) m1 = [ (sig[0] - p.pos[0]) * .1, 0, (sig[2] - p.pos[2]) * .1 ]; else {
        const w = [ sig[0] - p.pos[0], 0, sig[2] - p.pos[2] ], nw = Math.hypot(w[0], w[2]) || 1;
        m1 = [ w[0] / nw * p.vel * 15, 0, w[2] / nw * p.vel * 15 ];
      }
      const h00 = 2 * r ** 3 - 3 * r * r + 1, h10 = r ** 3 - 2 * r * r + r, h01 = -2 * r ** 3 + 3 * r * r, h11 = r ** 3 - r * r;
      const q = [ 0, 2 ].map(i => h00 * p.pos[i] + h10 * m0[i] + h01 * t[i] + h11 * m1[i]);
      const w = [ q[0] - p.pos[0], q[1] - p.pos[2] ], nw = Math.hypot(w[0], w[1]);
      if (nw > 1e-4) p.dir = [ w[0] / nw, 0, w[1] / nw ];
      if (Math.hypot(t[0] - p.pos[0], t[2] - p.pos[2]) < 100 && ++p.idx >= n) return sacarPeaton(p);
    }
    p.pos[0] += p.dir[0] * p.vel;
    p.pos[2] += p.dir[2] * p.vel;
    if (plano(p.pos, p.plano) > 0) sacarPeaton(p);
  }
  function sacarPeaton(p) {
    p.fuera = true;
    const i = peatones.indexOf(p);
    if (i >= 0) peatones.splice(i, 1);
    devolver(p.pj);
    p.pj = null;
  }
  async function vestirPeaton(p) {
    const [m, t] = PEATONES[p.tipo], [an] = ANDARES[p.andar];
    try {
      const [pj, anim] = await Promise.all([ sacar(`peaton:${m}:${t}`, () => C.personaje("tw_mob.bin", m, t)), C.anim("tw_mob.bin", an) ]);
      if (!vivo || p.fuera) {
        devolver(pj);
        return;
      }
      p.pj = pj;
      raiz.add(pj.grupo);
      if (anim) {
        pj.poner(anim, p.desde ?? entero(Math.max(1, anim.duracion)));
        pj.reproductor.loop = true;
        pj.reproductor.enElLugar = true;
        pj.reproductor.velocidad = p.velAnim;
      }
      ubicarPeaton(p);
    } catch (e) {
      console.warn("ventana: peatón", e.message);
    }
  }
  function ubicarPeaton(p) {
    if (p.pj) p.pj.ubicar(p.pos[0], p.pos[1], p.pos[2], Math.atan2(p.dir[0], p.dir[2]));
  }
  let relojPeaton = entero(31) + 16;
  for (let n = 1024; n > 0; n -= noche ? 48 + entero(63) : 32 + entero(31)) nuevoPeaton(n);
  const actores = [];
  async function actor({arch: arch, m: m = 0, t: t = 1, anim: anim = null, loop: loop = false, nombre: nombre, pos: pos = null, giro: giro = 0, tArch: tArch = arch}) {
    const pj = await C.personaje(arch, m, t, tArch);
    if (!vivo) {
      pj.dispose();
      return null;
    }
    pj.grupo.name = nombre || arch;
    if (anim) {
      const A = await C.anim(...anim);
      if (A) {
        pj.poner(A);
        pj.reproductor.loop = loop;
      }
    }
    if (pos) pj.ubicar(pos[0], pos[1], pos[2], giro);
    raiz.add(pj.grupo);
    const x = {
      pj: pj,
      nombre: nombre,
      cuadro: dt => pj.actualizar(dt)
    };
    actores.push(x);
    return x;
  }
  let compartido = 0;
  const elegir = f => {
    let r = entero(99) + 1, i = 0;
    while (r > 0 && i < 4) {
      r -= f[5 + i];
      i++;
    }
    return f[1 + Math.max(0, i - 1)];
  };
  async function vecino([mascara, arch, filas]) {
    const anims = new Map;
    const animDe = n => {
      if (!anims.has(n)) anims.set(n, C.anim(arch + ".bin", filas[n]?.[0] ?? filas[0][0]));
      return anims.get(n);
    };
    const x = await actor({
      arch: arch + ".bin",
      nombre: `vecino ${arch} (0x${mascara.toString(16)})`
    });
    if (!x) return;
    let fila = elegir(filas[0]);
    const poner = async () => {
      const A = await animDe(fila);
      if (A) {
        x.pj.poner(A);
        x.pj.reproductor.loop = false;
      }
    };
    await poner();
    x.cuadro = dt => {
      x.pj.actualizar(dt);
      if (!x.pj.reproductor.terminada) return;
      fila = elegir(filas[fila] || filas[0]);
      if (mascara === 2 || mascara === 2048 || mascara === 4096) compartido = fila;
      if (mascara === 4 || mascara === 16384 || mascara === 32768) fila = compartido;
      poner();
    };
  }
  function elegirVecinos() {
    let m = 0;
    if (F(1175)) return 0;
    m |= entero(2) ? 2 : 1;
    if (m & 2) m |= 4;
    m |= [ 8, 16, 32, 64 ][entero(4)];
    m |= entero(2) ? 128 : 256;
    m |= [ 512, 1024, 2048, 4096 ][entero(4)];
    m |= m & 2048 ? 16384 : m & 4096 ? 32768 : 8192;
    if (!F(1535) || F(522)) {
      if (!F(701)) {
        if (!F(911)) m |= 65536;
      } else if (!F(911)) m |= 262144;
    }
    return m;
  }
  let vecinosPuestos = false;
  async function ponerVecinos() {
    if (vecinosPuestos || !conVecinos) return;
    vecinosPuestos = true;
    const m = elegirVecinos();
    for (const v of VECINOS) if (v[0] & m) vecino(v).catch(e => console.warn("ventana: vecino", v[1], e.message));
  }
  const escenaActores = [];
  async function ponerEscena(n, persistente = false) {
    const A = o => actor(o).then(x => {
      if (x) escenaActores.push(x);
      return x;
    });
    const auto = (m, t, pos) => actor({
      arch: "tw_cars.bin",
      m: m,
      t: t,
      pos: pos,
      giro: Math.PI,
      nombre: `auto de la escena (tw_cars #${m})`
    });
    if (n === 0) await A({
      arch: "twdm_cyn00.bin",
      anim: [ "twdm_cyn00.bin", 2 ],
      nombre: "Cynthia (twdm_cyn00)"
    });
    if (n === 1) {
      await Promise.all([ A({
        arch: "twdm_detective00.bin",
        anim: [ "twdm_detective00.bin", 2 ],
        nombre: "el detective"
      }), A({
        arch: "twdm_police00.bin",
        anim: [ "twdm_police00.bin", 2 ],
        nombre: "el policía"
      }), auto(17, persistente ? 3 : 2, [ 6950, 0, -7800 ]), auto(14, persistente ? 3 : 2, [ 7e3, 0, -6100 ]) ]);
    }
    if (n === 2) await A({
      arch: "twdm_ki00.bin",
      anim: [ "twdm_ki00.bin", 2 ],
      loop: true,
      nombre: "Walter en el 207 (twdm_ki00)"
    });
    if (n === 3) {
      const a = {
        tipo: 12,
        carril: 2,
        estado: 3,
        pos: [ 0, 0, 0 ],
        vel: 0,
        barra: 1,
        baliza: 0,
        cuadros: [ 0, 1, 2, 3 ],
        fuera: false
      };
      autos.push(a);
      porCarril[2].unshift(a);
      await armarAuto(a);
      if (a.pj) {
        const anim = await C.anim("car_ambul01.bin", 2);
        if (anim) {
          a.pj.poner(anim);
          a.pj.reproductor.loop = false;
        }
        a.pj.ubicar(0, 0, 0, 0);
        a.escena = true;
      }
    }
  }
  if (escena >= 0) ponerEscena(escena); else {
    const poner = new Map;
    if (forzarEscenas) {
      for (let i = 0; i < 4; i++) if (ESCENAS[i].si(F)) poner.set(i, false);
    }
    if (F(315) && !F(501)) poner.set(1, true);
    if (F(911) && !F(1101)) poner.set(2, true);
    for (const [i, quieta] of poner) ponerEscena(i, quieta);
    ponerVecinos();
  }
  const hayGlobo = forzarGlobo || Math.random() < .2;
  let globo = null, yawGlobo = 0;
  if (hayGlobo) {
    GLOBO.fase += (performance.now() - GLOBO.sello) / 1e3 * FPS * 1e-4;
    actor({
      arch: "usaball.bin",
      nombre: "el globo (usaball)"
    }).then(x => {
      globo = x;
      if (x) x.cuadro = () => {};
    }).catch(() => {});
  }
  const cae = forzarCae || noche && escena < 0 && Math.random() < .05 ? {
    estado: 1,
    cuenta: 0,
    hasta: entero(150) + 90,
    x: null
  } : null;
  if (cae) actor({
    arch: "event_rl.bin",
    nombre: "lo que cae (event_rl #0)"
  }).then(x => {
    if (!x) return;
    cae.x = x;
    x.pj.grupo.visible = false;
    x.cuadro = () => {};
  }).catch(() => {});
  const _qc = new THREE.Quaternion, _eu = new THREE.Euler;
  function pasoCae() {
    if (!cae?.x) return;
    const g = cae.x.pj.grupo;
    if (cae.estado === 1 && ++cae.cuenta > cae.hasta) {
      const d = dirOjo ? dirOjo() : new THREE.Vector3(1, 0, 0), o = ojo();
      cae.pos = [ -o.x / ESC + d.x * 200, -o.y / ESC + d.y * 200 - 150, o.z / ESC + d.z * 200 ];
      cae.giro = Math.atan2(d.x, d.z) - 3.14;
      cae.rx = al() * 1.8 - .9;
      cae.rz = al() * 6 - 3;
      cae.vz = al() * .2 - .1;
      cae.estado = 2;
      g.visible = true;
    }
    if (cae.estado === 2) {
      cae.pos[1] += 15;
      cae.rz += cae.vz;
      cae.x.pj.ubicar(cae.pos[0], cae.pos[1], cae.pos[2], cae.giro);
      g.children[0]?.quaternion.copy(_qc.setFromEuler(_eu.set(cae.rx, 0, cae.rz))).premultiply((new THREE.Quaternion).setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI));
      if (cae.pos[1] > -1200) {
        cae.estado = 3;
        g.visible = false;
      }
    }
  }
  function pasoGlobo() {
    GLOBO.sello = performance.now();
    if (!globo) return;
    const f = (Math.sin(GLOBO.fase * Math.PI) + 1) * .5;
    GLOBO.fase += 1e-4;
    yawGlobo += Math.sin(GLOBO.fase * 15.70796) * .01;
    globo.pj.ubicar(26260 - 9600 * f, 4200 * f - 8460, 8650 - 14880 * f, yawGlobo);
  }
  function cuadroJuego() {
    if (--relojAuto[0] < 0) {
      probarAuto(0, CARRILES[0].ini);
      relojAuto[0] = esperaAuto();
    }
    if (--relojAuto[1] < 0) {
      probarAuto(1, CARRILES[1].ini);
      relojAuto[1] = esperaAuto();
    }
    for (const a of autos.slice()) {
      pasoAuto(a);
      ubicarAuto(a);
      animarBalizas(a);
    }
    if (--relojPeaton < 1) {
      relojPeaton = (noche ? entero(63) : entero(31)) + 32;
      nuevoPeaton(0);
    }
    for (const p of peatones.slice()) {
      if (!p.fuera) pasoPeaton(p);
      ubicarPeaton(p);
    }
    pasoGlobo();
    pasoCae();
    const pat = autos.find(a => a.escena);
    if (pat?.pj) {
      const t = pat.pj.reproductor.t * 1e3;
      pasaPatrullero = t > 6e4 && t <= 125e3;
    }
  }
  function actualizar(dt) {
    if (!vivo) return false;
    resto += dt * FPS;
    let n = 0;
    while (resto >= 1 && n < 4) {
      resto -= 1;
      cuadroJuego();
      n++;
    }
    if (resto > 4) resto = 0;
    for (const p of peatones) p.pj?.actualizar(dt);
    for (const a of autos) if (a.escena) a.pj?.actualizar(dt);
    for (const x of actores) x.cuadro(dt);
    moverFaroles();
    return true;
  }
  function quitar() {
    vivo = false;
    raiz.removeFromParent();
    raiz.traverse(o => {
      o.geometry?.dispose?.();
      for (const m of [].concat(o.material || [])) {
        m.map?.dispose?.();
        m.dispose?.();
      }
    });
    for (const l of reserva.values()) for (const p of l) p.dispose?.();
    for (const a of autos) {
      a.pj?.dispose?.();
      a.barraPj?.dispose?.();
    }
    for (const p of peatones) p.pj?.dispose?.();
    for (const x of actores) x.pj.dispose?.();
  }
  return {
    raiz: raiz,
    actualizar: actualizar,
    quitar: quitar,
    estado: () => ({
      autos: autos.length,
      peatones: peatones.length,
      vecinos: actores.filter(x => /^vecino/.test(x.nombre)).map(x => x.nombre),
      escena: escenaActores.map(x => x.nombre),
      globo: !!globo,
      cae: cae ? cae.estado : null,
      faroles: faroles.length,
      noche: noche
    }),
    ponerVecinos: ponerVecinos,
    get escenaActores() {
      return escenaActores;
    },
    get autos() {
      return autos;
    },
    get peatones() {
      return peatones;
    },
    avisar: avisar
  };
}

const CV = crearCargador();

let vidrio = null;

export async function texturasVidrio() {
  if (!vidrio) vidrio = CV.texturas("tw_cars.bin", 4).then(t => ({
    vidrio: t[1]?.[0] ? CV.textura(t[1][0]) : null,
    marco: t[2]?.[0] || null,
    marcoTex: t[2]?.[0] ? CV.textura(t[2][0]) : null
  }));
  return vidrio;
}

export function armarVidrio(T) {
  const g = new THREE.Group;
  g.name = "vidrio de la ventana";
  const mat = map => new THREE.MeshBasicMaterial({
    map: map,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    fog: false,
    side: THREE.DoubleSide
  });
  const quad = map => {
    const geo = new THREE.BufferGeometry;
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(12), 3));
    geo.setAttribute("uv", new THREE.BufferAttribute(new Float32Array(8), 2));
    geo.setIndex([ 0, 1, 2, 0, 2, 3 ]);
    const m = new THREE.Mesh(geo, mat(map));
    m.renderOrder = 998;
    m.frustumCulled = false;
    g.add(m);
    return m;
  };
  const v = T.vidrio ? quad(T.vidrio) : null;
  const tiras = T.marcoTex ? [ 0, 1, 2, 3 ].map(() => quad(T.marcoTex)) : [];
  const mw = T.marco?.ancho || 256, mh = T.marco?.alto || 128;
  const poner = (m, vs, tw = 1, th = 1) => {
    const P = m.geometry.attributes.position.array, U = m.geometry.attributes.uv.array;
    vs.forEach(([x, y, u, w], i) => {
      P[i * 3] = x;
      P[i * 3 + 1] = y;
      P[i * 3 + 2] = 0;
      U[i * 2] = u / tw;
      U[i * 2 + 1] = w / th;
    });
    m.geometry.attributes.position.needsUpdate = true;
    m.geometry.attributes.uv.needsUpdate = true;
    m.geometry.computeBoundingSphere();
  };
  function acomodar(giro, cabeceo, golpe = 0) {
    const x0 = -256.5 - 256 * giro, x1 = x0 + 1024, y0 = -288.5 - 288 * cabeceo + 1.875 * golpe, y1 = y0 + 1024;
    if (v) poner(v, [ [ x0, y0, 0, 0 ], [ x1, y0, 1, 0 ], [ x1, y1, 1, 1 ], [ x0, y1, 0, 1 ] ]);
    if (tiras.length) {
      poner(tiras[0], [ [ x0, y0, 255, 0 ], [ x0, y0 + 512, 0, 0 ], [ x0 + 128, y0 + 512, 0, 63 ], [ x0 + 128, y0, 256, 63 ] ], mw, mh);
      poner(tiras[1], [ [ x0, y1, 0, 64 ], [ x0, y1 - 512, 255, 64 ], [ x0 + 128, y1 - 512, 255, 127 ], [ x0 + 128, y1, 0, 127 ] ], mw, mh);
      poner(tiras[2], [ [ x1, y0, 255, 0 ], [ x1, y0 + 512, 0, 0 ], [ x1 - 128, y0 + 512, 0, 63 ], [ x1 - 128, y0, 256, 63 ] ], mw, mh);
      poner(tiras[3], [ [ x1, y1, 0, 64 ], [ x1, y1 - 512, 255, 64 ], [ x1 - 128, y1 - 512, 255, 127 ], [ x1 - 128, y1, 0, 127 ] ], mw, mh);
    }
  }
  return {
    g: g,
    acomodar: acomodar
  };
}

export function armarFranjas() {
  const g = new THREE.Group;
  g.name = "franjas";
  const m = new THREE.MeshBasicMaterial({
    color: 0,
    depthTest: false,
    depthWrite: false,
    fog: false
  });
  for (const [y0, y1] of [ [ -400, 51 ], [ 448 - 68, 900 ] ]) {
    const geo = new THREE.PlaneGeometry(4e3, y1 - y0);
    const q = new THREE.Mesh(geo, m);
    q.position.set(256, (y0 + y1) / 2, 0);
    q.renderOrder = 999;
    q.frustumCulled = false;
    g.add(q);
  }
  return g;
}

export function aCamara(g, lenteV, d = .3) {
  const t = Math.tan(THREE.MathUtils.degToRad(lenteV) / 2) * d;
  g.scale.set(t * (4 / 3) / 256, -t / 224, 1);
  g.position.set(-256 * t * (4 / 3) / 256, 224 * t / 224, -d);
}

function armarMascaraVR() {
  const c = rotacionVisor(direccionVentana(0, 0));
  const ys = [ -1, 1 ].map(g => rotacionVisor(direccionVentana(g, 0)).y - c.y), xs = [ -1, 1 ].map(k => rotacionVisor(direccionVentana(0, k)).x - c.x);
  const mh = THREE.MathUtils.degToRad(22.5), mv = THREE.MathUtils.degToRad(lenteVertical(45) / 2);
  const lim = new THREE.Vector4(Math.min(...ys) - mh, Math.max(...ys) + mh, Math.min(...xs) - mv, Math.max(...xs) + mv);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      lim: {
        value: lim
      },
      borde: {
        value: THREE.MathUtils.degToRad(3)
      }
    },
    vertexShader: "varying vec3 vP; void main() { vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: `uniform vec4 lim; uniform float borde; varying vec3 vP;\n      void main() {\n        vec3 d = normalize(vP); float y = atan(-d.x, -d.z), x = asin(clamp(d.y, -1.0, 1.0));\n        float dentro = min(min(y - lim.x, lim.y - y), min(x - lim.z, lim.w - x)); // > 0 adentro del hueco\n        float a = 1.0 - smoothstep(-borde, 0.0, dentro - borde);\n        if (a <= 0.0) discard;\n        gl_FragColor = vec4(0.0, 0.0, 0.0, a);\n      }`,
    side: THREE.BackSide,
    transparent: true,
    depthTest: false,
    depthWrite: false
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(.3, 64, 32), mat);
  m.renderOrder = 90;
  m.frustumCulled = false;
  m.rotation.set(c.x, c.y, 0, "YXZ");
  return m;
}

export function crearVentana({M: M, juego: juego, cuarto: cuarto, son: son, F: F, prender: prender, mostrarSub: mostrarSub = () => {}, textoRoom: textoRoom = () => ""}) {
  async function mirar(e) {
    const lado = (e.zona?.grupo_0x414 ?? 17) & 1;
    const hora = horaDelDia(F), vista = VISTAS[hora];
    let nEsc = escenaDeVentana(F);
    const vuelta = {
      sala: cuarto.sala.nombre,
      pos: M.jugador.position.clone(),
      giro: M.camara.rotation.y,
      fov: M.camara.fov,
      far: M.camara.far,
      giroRig: M.jugador.rotation.y,
      cabeza: M.camara.getWorldPosition(new THREE.Vector3)
    };
    const fase = juego.fase;
    juego.fase = "mirando por la ventana";
    const mirarAntes = M.control.mirarLibre;
    await M.fundir(1, .25);
    let calle = null, sonido = null, tarea = null, vid = null, franjas = null, mascara = null;
    const ojoJ = ojoVentana(lado), ojoV = enVisor(...ojoJ);
    const vr = () => M.enVR();
    const estadoCam = {
      giro: -.00434,
      cabeceo: .99645
    };
    const dj = new THREE.Vector3;
    const ponerCamara = (g, c, lente) => {
      direccionVentana(g, c, dj);
      if (!vr()) {
        const r = rotacionVisor(dj);
        M.camara.rotation.set(r.x, r.y, 0);
        const fv = lenteVertical(lente);
        if (Math.abs(M.camara.fov - fv) > .001) {
          M.camara.fov = fv;
          M.camara.updateProjectionMatrix();
        }
      }
    };
    try {
      juego.estado?.("cargando la vista de la calle…");
      const r0 = rotacionVisor(direccionVentana(estadoCam.giro, estadoCam.cabeceo));
      const pos = vr() ? ojoV.clone().add(new THREE.Vector3(0, -1.6, 0)) : ojoV.clone();
      await cuarto.cargar(vista, {
        pos: pos,
        giro: r0.y
      });
      M.jugador.position.copy(pos);
      if (!vr()) M.camara.position.set(0, 0, 0);
      M.camara.far = Math.max(M.camara.far, 5e4 * ESC + 10);
      M.camara.updateProjectionMatrix();
      juego.estado?.("");
      const ojo = () => M.camara.getWorldPosition(new THREE.Vector3);
      const dirOjo = () => {
        const d = M.camara.getWorldDirection(new THREE.Vector3);
        return new THREE.Vector3(-d.x, -d.y, d.z);
      };
      calle = crearCalle({
        grupo: cuarto.grupo,
        hora: hora,
        F: F,
        ojo: ojo,
        dirOjo: dirOjo,
        escena: nEsc
      });
      sonido = son()?.efecto(20078, null, {
        volumen: 1,
        loop: true
      });
      const T = await texturasVidrio().catch(() => null);
      if (T) {
        vid = armarVidrio(T);
        if (vr()) {
          const h = M.camara.getWorldPosition(new THREE.Vector3), d = .55;
          const t = Math.tan(THREE.MathUtils.degToRad(lenteVertical(45)) / 2) * d;
          vid.g.scale.set(t * (4 / 3) / 256, -t / 224, 1);
          const piv = new THREE.Group;
          piv.position.copy(h);
          piv.rotation.set(0, r0.y, 0, "YXZ");
          vid.g.position.set(-256 * t * (4 / 3) / 256, 224 * t / 224, -d);
          piv.add(vid.g);
          cuarto.grupo.add(piv);
          vid.acomodar(0, 0);
          for (const m of vid.g.children) m.material.depthTest = true;
        } else {
          M.camara.add(vid.g);
        }
      }
      let modo = nEsc >= 0 ? "escena" : "normal", tEsc = 0, subVisto = -1, golpe = 0, salida = null;
      const _h = new THREE.Vector3;
      const seguirMascara = () => {
        if (!vr()) {
          mascara?.removeFromParent();
          mascara = null;
          return;
        }
        if (!mascara) {
          mascara = armarMascaraVR();
          cuarto.grupo.add(mascara);
        }
        cuarto.grupo.worldToLocal(M.camara.getWorldPosition(_h));
        mascara.position.copy(_h);
      };
      const E = nEsc >= 0 ? ESCENAS[nEsc] : null;
      if (E && !vr()) {
        franjas = armarFranjas();
        M.camara.add(franjas);
      }
      if (E && vr()) M.jugador.rotation.y = rotacionVisor(direccionVentana(E.cam[lado][0], E.cam[lado][1])).y;
      const ultimo = {
        y: M.camara.rotation.y,
        x: M.camara.rotation.x
      };
      ponerCamara(estadoCam.giro, estadoCam.cabeceo, 45);
      if (E) ponerCamara(E.cam[lado][0], E.cam[lado][1], E.lente);
      ultimo.y = M.camara.rotation.y;
      ultimo.x = M.camara.rotation.x;
      M.control.mirarLibre = true;
      juego.ventana = {
        estado: () => ({
          vista: vista,
          lado: lado,
          hora: hora,
          modo: modo,
          escena: E?.nombre ?? null,
          tEsc: +tEsc.toFixed(1),
          giro: +estadoCam.giro.toFixed(3),
          cabeceo: +estadoCam.cabeceo.toFixed(3),
          lente: +M.camara.fov.toFixed(1),
          calle: calle?.estado()
        })
      };
      await M.fundir(0, .25);
      await new Promise(ok => {
        let t = 0;
        tarea = (dt, {acciones: acciones = [], ejes: ejes = {}, teclas: teclas = {}} = {}) => {
          t += dt;
          calle.actualizar(dt);
          seguirMascara();
          for (const a of acciones) if (a === "clic" && !vr() && !M.tactil) M.control.capturar();
          const cancelar = t > .3 && acciones.some(a => a === "cancelar");
          if (modo === "escena") {
            tEsc += dt;
            const subs = E.subs;
            let k = -1;
            for (let i = 0; i < subs.length; i++) if (tEsc >= subs[i][0]) k = i;
            if (k !== subVisto) {
              subVisto = k;
              mostrarSub(k >= 0 && subs[k][1] != null ? textoRoom(subs[k][1]) : "");
            }
            if (!vr()) {
              ponerCamara(E.cam[lado][0], E.cam[lado][1], E.lente);
              ultimo.y = M.camara.rotation.y;
              ultimo.x = M.camara.rotation.x;
            }
            if (vid && !vr()) {
              aCamara(vid.g, M.camara.fov);
              vid.acomodar(E.cam[lado][0], E.cam[lado][1]);
            }
            if (franjas) aCamara(franjas, M.camara.fov);
            if (cancelar && tEsc >= (E.minimo || 0) && !salida) {
              salida = (async () => {
                await M.fundir(1, .25);
                mostrarSub("");
                sonido?.parar(.1);
                sonido = son()?.efecto(20078, null, {
                  volumen: 1,
                  loop: true
                });
                franjas?.removeFromParent();
                franjas = null;
                modo = "normal";
                estadoCam.giro = E.cam[lado][0];
                estadoCam.cabeceo = E.cam[lado][1];
                ponerCamara(estadoCam.giro, estadoCam.cabeceo, 45);
                ultimo.y = M.camara.rotation.y;
                ultimo.x = M.camara.rotation.x;
                calle.ponerVecinos();
                await M.fundir(0, .25);
                salida = null;
              })();
            }
            return true;
          }
          if (salida) return true;
          if (!vr()) {
            const dRy = M.camara.rotation.y - ultimo.y, dRx = M.camara.rotation.x - ultimo.x;
            const der = (g, c) => rotacionVisor(direccionVentana(g, c));
            const r0_ = der(estadoCam.giro, estadoCam.cabeceo), ky = (der(estadoCam.giro + .01, estadoCam.cabeceo).y - r0_.y) / .01, kx = (der(estadoCam.giro, estadoCam.cabeceo + .01).x - r0_.x) / .01;
            let dg = Math.abs(ky) > 1e-6 ? dRy / ky : 0, dc = Math.abs(kx) > 1e-6 ? dRx / kx : 0;
            const sx = (ejes.x || 0) + (ejes.gx || 0) + (teclas.ArrowRight || teclas.KeyD ? 1 : 0) - (teclas.ArrowLeft || teclas.KeyA ? 1 : 0);
            const sy = (ejes.y || 0) + (ejes.gy || 0) + (teclas.ArrowDown || teclas.KeyS ? 1 : 0) - (teclas.ArrowUp || teclas.KeyW ? 1 : 0);
            if (sx) dg += -Math.sign(ky || 1) * sx * .6 * dt;
            if (sy) dc += -Math.sign(kx || 1) * sy * 1.5 * dt;
            estadoCam.giro = THREE.MathUtils.clamp(estadoCam.giro + dg, -1, 1);
            estadoCam.cabeceo = THREE.MathUtils.clamp(estadoCam.cabeceo + dc, -1, 1);
            ponerCamara(estadoCam.giro, estadoCam.cabeceo, 45);
            ultimo.y = M.camara.rotation.y;
            ultimo.x = M.camara.rotation.x;
          }
          golpe = acciones.some(a => a === "accion" || a === "aceptar" || a === "clic" && (M.tactil || M.control.capturado)) ? 1 : 0;
          if (golpe && t > .3) son()?.efecto(50712, null, {
            volumen: 1
          });
          if (vid && !vr()) {
            aCamara(vid.g, M.camara.fov);
            vid.acomodar(estadoCam.giro, estadoCam.cabeceo, golpe);
          }
          if (cancelar) {
            M.tareas.delete(tarea);
            ok();
          }
          return true;
        };
        M.tareas.add(tarea);
      });
    } catch (err) {
      console.warn("ventana", err);
    }
    if (tarea) M.tareas.delete(tarea);
    juego.ventana = null;
    mostrarSub("");
    sonido?.parar(.4);
    await M.fundir(1, .25);
    if (nEsc >= 0) prender(ESCENAS[nEsc].bandera);
    vid?.g.parent?.parent === cuarto.grupo ? vid.g.parent.removeFromParent() : vid?.g.removeFromParent();
    mascara?.removeFromParent();
    mascara = null;
    franjas?.removeFromParent();
    calle?.quitar();
    M.camara.fov = vuelta.fov;
    M.camara.far = vuelta.far;
    M.camara.updateProjectionMatrix();
    M.camara.rotation.set(0, vuelta.giro, 0);
    M.control.mirarLibre = mirarAntes;
    await cuarto.cargar(vuelta.sala, {
      pos: vuelta.pos,
      giro: vuelta.giro
    });
    if (vr()) {
      M.jugador.rotation.set(0, vuelta.giroRig, 0);
      M.jugador.updateMatrixWorld(true);
      const cab = M.camara.getWorldPosition(new THREE.Vector3);
      M.jugador.position.x += vuelta.cabeza.x - cab.x;
      M.jugador.position.z += vuelta.cabeza.z - cab.z;
    }
    cuarto.desatascar?.();
    juego.fase = fase;
    await M.fundir(0, .25);
  }
  return {
    mirar: mirar
  };
}
