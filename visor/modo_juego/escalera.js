// SH4 web — FeniXVOID · Project Ravenlight
import { json } from "./motor.js";

import { ESCALERA as BASE } from "./hospital.js";

import { partesBin } from "../lib/sh4bin.js";

import { leerModelo } from "../lib/modelo.js";

import { leerTexturas } from "../lib/texturas.js";

import { leerAnimacion } from "../lib/animacion.js";

import { crearPersonaje } from "../lib/personaje.js";

import { crearJefeSt07 } from "./jefe_st07.js";

import { crearCapaSinUsar } from "./escalera_sin_usar.js";

const E = .005;

const NUMERO = {
  rl: 1,
  sb: 2,
  fr: 3,
  mz: 4,
  bd: 5,
  ie: 6,
  hs: 7,
  cm: 8,
  ls: 9,
  gt: 10,
  st: 11
};

const ETAPA = Object.fromEntries(Object.entries(NUMERO).map(([k, v]) => [ v, k ]));

const CAEN = [ {
  fila: 0,
  pos: [ -949.4, -1800, 2172.6 ],
  q: [ 0, 1, 0, .017 ],
  m: 15,
  t: 3,
  a: null,
  escena: 2
}, {
  fila: 1,
  pos: [ -2395.6, -1800, 2508 ],
  q: [ 0, .956, 0, .292 ],
  m: 16,
  t: 4,
  a: null,
  escena: 2
}, {
  fila: 2,
  pos: [ -2938.5, -1800, 1228.3 ],
  q: [ 0, .888, 0, .461 ],
  m: 17,
  t: 5,
  a: null,
  escena: 2
}, {
  fila: 6,
  pos: [ -1986.9, 3320.7, -1248.1 ],
  q: [ 0, .3, 0, .954 ],
  m: 18,
  t: 6,
  a: 27,
  escena: 3
}, {
  fila: 7,
  pos: [ 441.9, 956, 95.7 ],
  q: [ -.007, -.744, .011, .668 ],
  m: 19,
  t: 7,
  a: 28,
  escena: 4
}, {
  fila: 13,
  pos: [ -2021.5, 5873.3, -1300 ],
  q: [ -.004, .512, -.043, .858 ],
  m: 23,
  t: 11,
  a: 34,
  escena: 5
} ];

const SON_CERROJO = 40087;

const MAT_PUERTA = {
  1: "STEEL",
  2: "WOOD"
};

function puertaEscalera(api, n) {
  const m = MAT_PUERTA[n];
  if (!m) return;
  try {
    api.amb?.son?.puerta?.(m, "abrir");
  } catch {}
  setTimeout(() => {
    try {
      api.amb?.son?.puerta?.(m, "cerrar");
    } catch {}
  }, 1100);
}

let tabla = null;

async function cargarTabla() {
  if (!tabla) tabla = (await json("./hospital_datos.json"))?.salida?.tabla || [];
  return tabla;
}

export async function haciaEscalera(api, etapa, escena) {
  const T = await cargarTabla();
  const f = T.find(x => x.etapa === NUMERO[etapa] && x.escena === +escena);
  if (!f) return null;
  if ((api.eileen?.actual || api.PARTIDA?.eileen?.estado) && !api.eileenConHenry?.()) {
    await api.decir([ api.juego.textoComun?.(26) || "No puedo dejar sola a Eileen." ]);
    return null;
  }
  api.eileenConmigo?.();
  for (const b of f.banderas || []) api.prender(b);
  puertaEscalera(api, f.musica);
  return {
    aEtapa: "st",
    escena: f.a_escena,
    pos: f.pos,
    rot: f.rot
  };
}

export const ESCALERA = {
  ...BASE,
  crear: api => crearEscalera(api)
};

function crearEscalera(api) {
  const {THREE: THREE, M: M, juego: juego, F: F, prender: prender, decir: decir} = api;
  const base = BASE.crear(api);
  const comun = n => juego.textoComun?.(n) || "";
  const sonar = id => {
    try {
      api.amb?.son?.efecto?.(id, null, {
        volumen: 1
      });
    } catch {}
  };
  const aV = p => new THREE.Vector3(-p[0] * E, -p[1] * E, p[2] * E);
  let escena = 0, camFija = null, caen = [], vuelta = 0;
  const jefe = crearJefeSt07(api);
  const qSU = typeof location !== "undefined" ? new URLSearchParams(location.search) : null;
  const sinUsar = qSU?.has("sinusar") && juego.fase !== "visor" ? crearCapaSinUsar({
    THREE: THREE,
    bajar: api.bajar,
    padre: api.cont
  }) : null;
  let binSt = null;
  const st = () => binSt ||= api.bajar("data/st_all.bin").then(b => ({
    b: b,
    p: partesBin(b)
  }));
  async function armarCaidas(n, v) {
    for (const c of CAEN.filter(x => x.escena === n)) {
      try {
        const {b: b, p: p} = await st();
        if (v !== vuelta) return;
        const k = c.fila <= 2 ? CAEN[Math.random() < .5 ? 0 : 2] : c;
        const pj = crearPersonaje(leerModelo(b, p[k.m].ofs, p[k.m].len), leerTexturas(b, p[k.t].ofs, p[k.t].len));
        pj.grupo.name = "st cae #" + k.m;
        pj.grupo.children[0].quaternion.copy(new THREE.Quaternion(0, 0, 1, 0)).multiply(new THREE.Quaternion(...c.q).normalize());
        if (c.a != null) {
          pj.poner(leerAnimacion(b, p[c.a].ofs, p[c.a].len));
          pj.reproductor.loop = true;
        }
        pj.grupo.position.copy(aV(c.pos));
        api.cont.add(pj.grupo);
        caen.push({
          c: c,
          pj: pj,
          paso: c.a != null ? 0 : 1,
          espera: 0,
          y: -1800,
          vel: 100,
          acel: 0,
          resto: 0
        });
      } catch (e) {
        console.warn("escalera caídas", e.message);
      }
    }
  }
  function quitarCaidas() {
    for (const x of caen) {
      x.pj.grupo.removeFromParent();
      x.pj.dispose?.();
    }
    caen = [];
  }
  function cuadroCaidas(dt) {
    for (const x of caen) {
      if (x.c.a != null) {
        x.pj.actualizar(dt);
        continue;
      }
      x.resto += dt * 30;
      while (x.resto >= 1) {
        x.resto -= 1;
        if (x.paso === 1) {
          x.espera = 32 + Math.floor(Math.random() * 256);
          x.y = -1800;
          x.vel = 100;
          x.acel = 0;
          x.paso = 2;
        } else if (x.paso === 2) {
          if (--x.espera <= 0) x.paso = 3;
        } else if (x.paso === 3) {
          x.vel += x.acel;
          if (x.vel < -250) x.vel = -250;
          x.y += x.vel;
          if (x.y > 7e3 || x.y < -1800) {
            x.espera = 32 + Math.floor(Math.random() * 256);
            if (Math.random() < .75) {
              x.y = -1800;
              x.vel = 100;
              x.acel = 0;
            } else {
              x.y = 7e3;
              x.vel = 0;
              x.acel = -2;
            }
            x.paso = 2;
          }
        }
      }
      x.pj.grupo.visible = x.paso === 3;
      x.pj.grupo.position.copy(aV([ x.c.pos[0], x.y, x.c.pos[2] ]));
    }
  }
  return {
    ...base,
    async alCargarEscena(n, llegada) {
      await (base.alCargarEscena?.(n, llegada));
      escena = n;
      camFija = null;
      jefe.entrar(n);
      quitarCaidas();
      const v = ++vuelta;
      armarCaidas(n, v);
      if (sinUsar) sinUsar.poner(n, {
        modo: qSU.get("sinusar") === "todas" ? "todas" : "deducido",
        etiquetas: qSU.has("nichos")
      }).catch(e => console.warn("sin usar", e.message));
    },
    maneja: ev => base.maneja?.(ev) || [ 3120, 3167 ].includes(ev?.evnum),
    camaraFija: () => camFija,
    cuadro(dt) {
      base.cuadro?.(dt);
      cuadroCaidas(dt);
      sinUsar?.actualizar(dt);
      if (escena === 7 && !juego.demoActual) jefe.cuadro(dt);
    },
    async ejecutar(o) {
      const ev = o.ev || {};
      const exec = (ev.exec || "").slice(0, 8);
      if (exec === "0x4e7050") {
        sonar(SON_CERROJO);
        await decir([ comun(19) || "Está abierta." ]);
        prender(1852);
        return null;
      }
      if (exec === "0x4e71c0") {
        const pos = [ 75, -900, 894 ], ax = -25.8 * Math.PI / 180;
        camFija = {
          pos: pos,
          mira: [ pos[0], pos[1] - Math.sin(ax) * 500, pos[2] + Math.cos(ax) * 500 ],
          fija: true
        };
        await decir([ comun(352) || "El cierre se ha abierto." ]);
        sonar(SON_CERROJO);
        prender(1856);
        camFija = null;
        return null;
      }
      if (exec === "0x4e6e00") {
        if (o.grupo === 11 && !F(1856)) {
          await decir([ comun(351) || "Hay un mensaje grabado en la puerta." ]);
          return null;
        }
        if (o.grupo === 7 && F(534) && !F(719)) {
          if ((api.eileen?.actual || api.PARTIDA?.eileen?.estado) && !api.eileenConHenry?.()) {
            await decir([ comun(26) ]);
            return null;
          }
          api.eileenConmigo?.();
          puertaEscalera(api, (await cargarTabla())[7]?.musica);
          return {
            aEtapa: "mz",
            escena: 33,
            pos: null,
            rot: null
          };
        }
      }
      const fila = exec === "0x4e6e00" ? (await cargarTabla())[o.grupo] : null, antes = api.escena;
      const r = await base.ejecutar(o);
      if (fila && (r?.aEtapa || api.escena !== antes)) puertaEscalera(api, fila.musica);
      if (ev.evnum === 2705) api.eileenConmigo?.();
      return r;
    },
    alSalir() {
      quitarCaidas();
      sinUsar?.quitar();
      jefe.salir();
      base.alSalir?.();
    },
    estado: () => ({
      ...base.estado(),
      caen: caen.map(x => x.c.m + ":" + x.paso + ":" + Math.round(x.y)),
      jefe: escena === 7 ? jefe.estado() : null,
      F1852: F(1852),
      F1855: F(1855),
      F1856: F(1856),
      sinUsar: sinUsar?.estado() || null
    })
  };
}

export { ETAPA };
