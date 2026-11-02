// SH4 web — FeniXVOID · Project Ravenlight
import * as THREE from "three";

import { json, q } from "./motor.js";

import { aMundo, OJOS } from "./cuarto.js";

import { crearEfectos302 } from "./efectos_302.js";

import { crearHauntings302 } from "./hauntings_302.js";

import { guardadoNuevo } from "../enemigos/eileen.js";

const giroDeAngulo = a => Math.atan2(Math.sin(a), -Math.cos(a));

export function evaluar(c, F) {
  if (!c || /siempre|sin bandera/.test(c) && !/F\d/.test(c)) return true;
  const t = c.match(/(AND|OR)|!?F\d+|siempre/g) || [];
  let r = null, op = "AND";
  for (const x of t) {
    if (x === "AND" || x === "OR") {
      op = x;
      continue;
    }
    const v = x === "siempre" ? true : x[0] === "!" ? !F(+x.slice(2)) : F(+x.slice(1));
    r = r === null ? v : op === "AND" ? r && v : r || v;
  }
  return r ?? true;
}

export const DESPERTADOR = [ {
  ev: 221,
  demo: 63
}, {
  ev: 164,
  demo: 63
}, {
  ev: 145,
  demo: 62
}, {
  ev: 106,
  demo: 87
}, {
  ev: 29,
  demo: 79
}, {
  ev: 18,
  demo: 57
}, {
  ev: 11,
  demo: 54
}, {
  ev: 1,
  demo: 74
}, {
  ev: 63,
  demo: 45
} ];

export const DESPERTAR_COMUN = 150;

const POS_SALTADA = [ 417, 0, -334.6 ], ROT_SALTADA = -1.371;

export const AGUJEROS = {
  7: {
    trg: "0x4da0e0",
    salas: [ "rl02b" ],
    msg: 39,
    visto: 301,
    primera: 301,
    etapa: "sb",
    etapaN: 2,
    escena: 1,
    tunel: 1,
    efectos: []
  },
  89: {
    trg: "0x4da280",
    salas: [ "rl02c", "rl02h" ],
    msg: 126,
    visto: 1534,
    primera: 501,
    etapa: "fr",
    etapaN: 3,
    escena: 1,
    tunel: 2,
    llegada: {
      pos: [ -788.67, -1.89, 2160.19 ],
      rot: 2.932
    },
    efectos: []
  },
  99: {
    trg: "0x4da330",
    salas: [ "rl02d" ],
    msg: 129,
    visto: 1541,
    primera: 701,
    etapa: "mz",
    etapaN: 4,
    escena: 1,
    tunel: 3,
    llegada: {
      pos: [ 150, 0, -1800 ],
      rot: -1.5708
    },
    efectos: [ "0x4d41e0", "0x4d4df0" ]
  },
  110: {
    trg: "0x4da3e0",
    salas: [ "rl02e" ],
    msg: 130,
    visto: 1549,
    primera: 901,
    etapa: "bd",
    etapaN: 5,
    escena: 18,
    tunel: 4,
    llegada: {
      pos: [ -5800, 0, 0 ],
      rot: 1.518
    },
    efectos: [ "0x4d4df0" ]
  },
  39: {
    trg: "0x4da490",
    salas: [ "rl02f" ],
    msg: 107,
    visto: 1554,
    primera: 1101,
    etapa: "ie",
    etapaN: 6,
    escena: 24,
    tunel: 5,
    llegada: {
      pos: [ 0, 0, 7600 ],
      rot: 3.1416
    },
    efectos: [ "0x4d4270" ]
  },
  154: {
    trg: "0x4da540",
    salas: [ "rl03a", "rl03b" ],
    msg: 275,
    visto: 1568,
    primera: 1301,
    etapa: "hs",
    etapaN: 7,
    escena: 1,
    tunel: 6,
    efectos: [ "0x4d42f0" ]
  }
};

export const demoTunel = (n, vuelta) => n === 1 ? vuelta ? 200 : 201 : 200 + 2 * (n - 1) + (vuelta ? 1 : 0);

const TUNEL_DE = {
  sb: 1,
  fr: 2,
  mz: 3,
  bd: 4,
  ie: 5
};

function tunelDe(etapa, escena, mitad2) {
  if (etapa === "hs") return 6;
  if (etapa === "cm") return 11;
  if (etapa === "st") return [ 0, 6, 7, 8, 9, 10 ][escena >= 1 && escena <= 5 ? escena : 1];
  return (TUNEL_DE[etapa] || 1) + (mitad2 && [ "sb", "fr", "mz", "bd" ].includes(etapa) ? 6 : 0);
}

const ETAPA_N = {
  sb: 2,
  fr: 3,
  mz: 4,
  bd: 5,
  ie: 6,
  hs: 7,
  cm: 8,
  st: 11
};

const VOL_EMISOR = [ 0, 1, .5, .35, .75, .8, .3, 1, .15, .7, .2, 0, 1, .5, .2, .1, .25 ];

const POS_EMISOR = [ null, [ 450, -180, 900 ], [ -10, -180, 60 ], [ -30, -180, -170 ], [ 50, -180, 10 ], [ -413, -180, 296 ], [ -10, -180, 60 ], [ -30, -180, -170 ], [ 50, -180, 10 ], [ 318, -180, 480 ], [ -10, -180, 60 ], [ -30, -180, -170 ], [ -283, -95, 275 ], [ 457, -170, -436 ], [ -10, -180, 60 ], [ -30, -180, -170 ], [ 50, -180, 10 ] ];

const EXEC_VOLUMEN = {
  "0x4d4110": 8
};

const VARIANTE_AGUJERO = {
  rl02b: 1,
  rl02c: 2,
  rl02h: 2,
  rl02d: 3,
  rl02e: 4,
  rl02f: 5
};

const STREAM_AGUJERO = [ null, 20090, 20090, 20090, 20091 ];

const AGUJERO_LAVADERO = {
  id: 20243,
  pos: [ -779, -217, 163 ]
};

const VENTILADOR = {
  ev: 165,
  id: 50702,
  pos: [ 662.8, -248.7, -355.9 ]
};

const SON_PUERTA_ENTRADA = {
  0: 50008,
  1: 50007,
  2: 40088
};

const VOL_TIMBRE = [ 1, .5, .3, .3 ], POS_TIMBRE = [ [ 600, -130, -355 ], [ -410, -180, -10 ], [ -30, -180, -170 ], [ 50, -180, 10 ] ];

const VOL_PUERTA = [ 1, .6, .2, .2 ], POS_PUERTA = [ [ 450, -180, 900 ], [ -10, -180, 60 ], [ -30, -180, -170 ], [ 50, -180, 10 ] ];

const NOTICIAS = {
  19: {
    id: 10060,
    textos: [ [ 54, 3.5 ], [ 55, 3.5 ], [ 56, 5.5 ], [ 57, 2 ], [ 58, 2 ], [ 59, 2 ] ]
  },
  38: {
    id: 10061,
    textos: [ [ 99, .5 ], [ 100, 2.5 ], [ 101, 6 ], [ 102, 3.7 ], [ 103, 3.5 ], [ 104, 5 ], [ 105, 3 ], [ 106, 4 ] ]
  }
};

const LLAMADA = {
  id: 20216,
  guion: [ [ null, 1 ], [ 49, 2 ], [ null, 1 ], [ 50, 2 ], [ null, 1 ], [ 51, 2 ], [ null, 3 ] ]
};

const SOLO_BANDERA = new Set([ 79, 21, 30, 3032, 2200, 2203, 2207, 2208, 2209 ]);

const DIA1 = [ 1501, 1502, 1503, 1504, 1505, 1506, 1507, 1508, 1509, 1510, 1511, 1512, 1513, 1514, 1515, 1516, 1607 ];

const DIA2 = [ 301, 302, 304, 1518, 1519, 1520, 1521, 1522, 1523, 1524, 1525, 1526, 1527, 1528 ];

export const VUELTAS = {
  1: {
    que: "a mitad del Subte (agujero de sb10)",
    banderas: [ ...DIA1, 301, 302, 304 ],
    agujero: {
      etapa: "sb",
      escena: 10
    }
  },
  2: {
    que: "Subte terminado (d_006)",
    banderas: [ ...DIA1, ...DIA2, 307, 311, 315, 338 ]
  },
  3: {
    que: "a mitad del Bosque",
    banderas: [ ...DIA1, ...DIA2, 315, 338, 1530, 1531, 1533, 1534, 501 ],
    agujero: {
      etapa: "fr",
      escena: 9
    }
  },
  4: {
    que: "Bosque terminado",
    banderas: [ ...DIA1, ...DIA2, 315, 338, 1530, 1531, 1533, 1534, 501, 522 ]
  },
  5: {
    que: "a mitad de la Prisión de Agua",
    banderas: [ ...DIA1, ...DIA2, 315, 1530, 1531, 1533, 1534, 501, 522, 1538, 1539, 1541, 701 ],
    agujero: {
      etapa: "mz",
      escena: 34
    }
  },
  6: {
    que: "Prisión de Agua terminada",
    banderas: [ ...DIA1, ...DIA2, 315, 1530, 1531, 1533, 1534, 501, 522, 1538, 1539, 1541, 701, 718 ]
  },
  7: {
    que: "a mitad del Edificio",
    banderas: [ ...DIA1, ...DIA2, 315, 1530, 1531, 1533, 1534, 501, 522, 1538, 1539, 1541, 701, 718, 1543, 1549, 901 ],
    agujero: {
      etapa: "bd",
      escena: 14
    }
  },
  8: {
    que: "Edificio terminado",
    banderas: [ ...DIA1, ...DIA2, 315, 1530, 1531, 1533, 1534, 501, 522, 1538, 1539, 1541, 701, 718, 1543, 1549, 901, 911 ]
  },
  9: {
    que: "a mitad del Apartamento",
    banderas: [ ...DIA1, ...DIA2, 315, 1530, 1531, 1533, 1534, 501, 522, 1538, 1539, 1541, 701, 718, 1543, 1549, 901, 911, 1552, 1553, 1554, 1625, 1626, 1101 ],
    agujero: {
      etapa: "ie",
      escena: 22
    }
  },
  10: {
    que: "Apartamento terminado: empieza la segunda mitad",
    banderas: [ ...DIA1, ...DIA2, 315, 1530, 1531, 1533, 1534, 501, 522, 1538, 1539, 1541, 701, 718, 1543, 1549, 901, 911, 1552, 1553, 1554, 1625, 1626, 1101, 1108, 1167, 1556, 2116, 1130, 1612 ]
  }
};

VUELTAS[11] = {
  que: "segunda mitad: el agujero del lavadero abierto",
  banderas: [ ...VUELTAS[10].banderas, 1557, 1558, 1560, 1561, 1562, 1563, 1564, 1565, 1566, 1643, 1644, 1645, 1646, 1567 ]
};

VUELTAS[12] = {
  que: "de vuelta del Hospital (agujero de hs06)",
  banderas: [ ...VUELTAS[11].banderas, 1568, 1301, 1302, 1310, 1326, 1327, 1311 ],
  agujero: {
    etapa: "hs",
    escena: 6
  },
  eileen: {
    etapa: 7,
    escena: 6,
    pos: [ -60, 0, -120 ],
    rot: 1.57
  }
};

VUELTAS[13] = {
  ...VUELTAS[12],
  que: "de vuelta del Hospital, con el sobre rojo",
  banderas: [ ...VUELTAS[12].banderas, 1569, 1572 ],
  items: [ 151, 81 ]
};

export async function crearDias302(ctx) {
  const {M: M, juego: juego, cuarto: cuarto, PARTIDA: PARTIDA, F: F, prender: prender} = ctx;
  const D = await json(new URL("./dias_302.json", import.meta.url).href) || {
    fin: {},
    condiciones: {},
    checkpoints: []
  };
  const FIN = D.fin || {}, COND = D.condiciones || {}, CP = D.checkpoints || [];
  const finDe = ev => FIN[String(ev)] || null;
  const condDe = ev => COND[String(ev)] ?? null;
  const cumpleEv = ev => {
    const c = condDe(ev);
    return c != null && evaluar(c, F);
  };
  const sala = () => cuarto.sala?.nombre || "";
  const escena = () => +cuarto.escena;
  const son = () => ctx.son();
  PARTIDA.reloj ||= 0;
  M.tareas.add(dt => {
    PARTIDA.reloj += Math.min(dt, .25);
  });
  const tieneItem = k => !!(PARTIDA.henry?.lugares?.some(([x, n]) => x === k && n > 0) || PARTIDA.henry?.notas?.includes(k) || (PARTIDA.inventario || []).slice(PARTIDA.inventarioVisto || 0).includes(k));
  function quitarItem(k) {
    const vistos = PARTIDA.inventarioVisto || 0, j = (PARTIDA.inventario || []).lastIndexOf(k);
    if (j >= vistos) {
      PARTIDA.inventario.splice(j, 1);
      return;
    }
    const L = PARTIDA.henry?.lugares, i = L ? L.findIndex(([x, n]) => x === k && n > 0) : -1;
    if (i >= 0) {
      L[i][1]--;
      if (L[i][1] <= 0) L.splice(i, 1);
    }
    (PARTIDA.quitarDeHenry ||= []).push(k);
  }
  const TRGCHK = {
    ...Object.fromEntries(Object.values(AGUJEROS).map(a => [ a.trg, () => a.salas.includes(sala()) ])),
    "0x4da1c0": () => F(1519) && !F(1536) && sala() === "rl00b",
    "0x4d3410": () => F(1524) && !F(1525),
    "0x4d32c0": () => F(1523) && !F(1526),
    "0x4d4640": () => F(1526),
    "0x4d99b0": () => true,
    "0x4d3fd0": () => !F(1537),
    "0x4d4040": () => !F(1539),
    "0x4d40b0": () => !F(1546),
    "0x4d4160": () => !F(1613),
    "0x4d41d0": () => !F(1620),
    "0x4d4260": () => !F(1625),
    "0x4d42e0": () => !F(1628),
    "0x4d3ff0": () => F(1537) && !F(1594),
    "0x4d4060": () => F(1539) && !F(1597),
    "0x4d40d0": () => escena() === 1 && F(1546) && !F(1599),
    "0x4d4170": () => F(1613) && !F(1614),
    "0x4d4200": () => F(1620) && !F(1621) && !F(1101),
    "0x4d4ef0": () => escena() !== 3 || F(1617),
    "0x4d4310": () => F(1628) && !F(1630) && !F(1631),
    "0x4d43d0": () => F(1628) && F(1630) && !F(1631),
    "0x4d5430": () => {
      const v = VARIANTE_AGUJERO[sala()] || 0;
      return v > 0 && v < 5;
    },
    "0x4d5450": () => F(1567),
    "0x4da540": () => AGUJEROS[154].salas.includes(sala()) && (!F(1569) || tieneItem(151)),
    "0x4da6a0": () => sala() === "rl00d",
    "0x4da610": () => F(1569) && !tieneItem(151),
    "0x4d3d50": () => true,
    "0x4dadd0": () => false,
    "0x4dae60": () => false,
    "0x4db150": () => F(1579),
    "0x4d4c40": () => sala() === "rl00e",
    "0x4dadf0": () => cumpleEv(200) && !juego.demoActual
  };
  let sonando = [], tareaEmisores = null;
  function pararAmbientes() {
    for (const s of sonando) try {
      s.h?.parar(.3);
    } catch {}
    sonando = [];
    if (tareaEmisores) M.tareas.delete(tareaEmisores);
    tareaEmisores = null;
    efectos.quitarTodos();
  }
  const efectos = crearEfectos302({
    M: M,
    juego: juego,
    cuarto: cuarto,
    F: F,
    prender: prender,
    apagar: n => {
      PARTIDA.banderas[n] = 0;
    },
    evaluar: evaluar
  });
  const hauntings = crearHauntings302(ctx);
  Object.assign(TRGCHK, hauntings.TRGCHK);
  const EV = () => ctx.eventos();
  const D2 = await json(new URL("./dias_302_mitad2.json", import.meta.url).href).catch(() => null) || null;
  let mitadEV = 1, EV1 = null;
  function actualizarMitad() {
    let lista = null;
    try {
      lista = EV();
    } catch {
      return;
    }
    if (!D2?.eventos || !Array.isArray(lista)) return;
    const quiero = F(1130) ? 2 : 1;
    if (quiero === mitadEV) return;
    if (quiero === 2) {
      EV1 = lista.slice();
      lista.splice(0, lista.length, ...D2.eventos);
    } else if (EV1) lista.splice(0, lista.length, ...EV1);
    mitadEV = quiero;
  }
  function emisoresDeSala() {
    const esc = String(cuarto.escena), r = [];
    for (const e of EV()) {
      if (String(e.escena) !== esc || e.pos) continue;
      const init = (e.funciones?.init || "").slice(0, 8), g = e.zona?.grupo_0x414 ?? 0, exec = (e.funciones?.exec || "").slice(0, 8);
      if (init === "0x4d3d70" && Array.isArray(e.val) && e.val[0]) {
        const k = escena() + g * 4, v = (VOL_EMISOR[k] ?? 0) * (EXEC_VOLUMEN[exec] || 1);
        if (v > 0) r.push({
          e: e,
          id: e.val[0],
          stream: !!e.val[1],
          demora: e.val[2] || 0,
          volumen: v,
          pos: POS_EMISOR[k],
          que: "ambiente",
          exec: exec
        });
      } else if (init === "0x4d5330") {
        if (g !== 0) r.push({
          e: e,
          id: AGUJERO_LAVADERO.id,
          stream: true,
          demora: 0,
          volumen: 1,
          pos: AGUJERO_LAVADERO.pos,
          que: "agujero"
        }); else {
          const id = STREAM_AGUJERO[VARIANTE_AGUJERO[sala()] || 0];
          if (id) r.push({
            e: e,
            id: id,
            stream: true,
            demora: 0,
            volumen: 1,
            pos: [ -256, -265, 80 ],
            que: "agujero"
          });
        }
      } else if (init === "0x4d32e0") r.push({
        e: e,
        id: 53009,
        demora: 1,
        volumen: VOL_TIMBRE[g] ?? .3,
        pos: POS_TIMBRE[g],
        que: "timbre"
      }); else if (init === "0x4d4660") r.push({
        e: e,
        id: 20092,
        stream: true,
        demora: 0,
        volumen: VOL_PUERTA[g] ?? .2,
        pos: POS_PUERTA[g],
        que: "puerta"
      }); else if (init === "0x4d4460" && Array.isArray(e.val) && e.val[0]) r.push({
        e: e,
        id: e.val[0],
        demora: 180 - Math.random(),
        volumen: 1,
        pos: [ 450, -180, 900 ],
        que: "cada6",
        periodo: 180
      });
    }
    return r;
  }
  const sigue = s => ctx.cumple(s.e) && !(s.que === "timbre" && F(1525));
  function alEntrarSala(nuevo = true) {
    actualizarMitad();
    if (nuevo) {
      pararAmbientes();
      efectos.alEntrarSala();
      hauntings.alEntrarSala();
    } else if (tareaEmisores) {
      M.tareas.delete(tareaEmisores);
      tareaEmisores = null;
    }
    const lista = emisoresDeSala().filter(x => !sonando.some(s => s.e === x.e));
    if (!lista.length && !sonando.length) return;
    let t = nuevo ? 0 : 1e9;
    const pendientes = lista.slice();
    tareaEmisores = dt => {
      if (juego.demoActual) return;
      t += dt;
      for (const x of pendientes.slice()) {
        if (t < x.demora) continue;
        pendientes.splice(pendientes.indexOf(x), 1);
        if (!sigue(x)) continue;
        if (x.que === "timbre") prender(1524);
        if (x.que === "puerta") {
          if (F(1528)) continue;
          prender(1527);
        }
        if (x.exec === "0x4d41a0" && escena() === 3) {
          prender(1614);
          continue;
        }
        x.t0 = PARTIDA.reloj;
        for (const b of (x.e.evnum ? finDe(x.e.evnum) : null) || []) prender(b);
        const h = son()?.efecto(x.id, x.pos ? aMundo(x.pos) : null, {
          volumen: x.volumen,
          loop: !x.periodo,
          radio: 4e3
        });
        sonando.push({
          ...x,
          h: h
        });
      }
      for (const s of sonando) if (s.periodo && PARTIDA.reloj - s.t0 >= s.periodo) {
        s.t0 = PARTIDA.reloj - Math.random();
        s.h = son()?.efecto(s.id, s.pos ? aMundo(s.pos) : null, {
          volumen: s.volumen,
          loop: false,
          radio: 4e3
        });
      }
      for (const s of sonando.slice()) if (!sigue(s)) {
        s.h?.parar(s.que === "agujero" ? .5 : .3);
        sonando.splice(sonando.indexOf(s), 1);
      }
      for (const s of sonando.slice()) if (s.que === "puerta" && /^mirando por la mirilla/.test(juego.fase || "")) {
        s.h?.parar(.5);
        sonando.splice(sonando.indexOf(s), 1);
      }
      for (const s of sonando.slice()) if (s.exec === "0x4d4340" && PARTIDA.reloj - s.t0 >= 5) {
        s.h?.parar(.5);
        sonando.splice(sonando.indexOf(s), 1);
        prender(1630);
        setTimeout(() => alEntrarSala(false), 0);
      }
      if (!pendientes.length && !sonando.length) {
        M.tareas.delete(tareaEmisores);
        tareaEmisores = null;
      }
    };
    M.tareas.add(tareaEmisores);
  }
  const esAutomatico = e => SOLO_BANDERA.has(e.evnum) || !!NOTICIAS[e.evnum] || (e.funciones?.trgchk || "").startsWith("0x4da1c0") || e.evnum === 3156;
  async function auto(e) {
    if (e.evnum === 3156) return todosLosLetreros();
    const tg = (e.funciones?.trgchk || "").slice(0, 8);
    if (tg === "0x4da1c0") {
      M.ponerVelo(1);
      son()?.efecto(50900, null, {
        volumen: 1
      });
      await M.fundir(0, 1.07);
      await ctx.decir([ ctx.textoRoom(46) ]);
      prender(1536);
      return;
    }
    if (NOTICIAS[e.evnum]) {
      await ctx.radioHistoria(NOTICIAS[e.evnum]);
      for (const b of finDe(e.evnum) || []) prender(b);
      return;
    }
    for (const b of finDe(e.evnum) || []) prender(b);
    alEntrarSala(false);
  }
  const esHuecoFinal = e => e.mitad === 2 && /^0x4db0a0/.test(e.funciones?.init || "");
  const esAbrigoVacio = e => e.mitad === 2 && /^0x4db170/.test(e.funciones?.init || "");
  const POS_CM24 = [ -43, 0, 3840 ], ROT_CM24 = 1.57;
  const esPuertaEntrada = e => e.mitad === 2 && +e.escena === 1 && /^0x4daa[13]0/.test(e.funciones?.trgchk || "");
  const puertaConLlaves = e => esPuertaEntrada(e) && tieneItem(60) && cumpleEv(200) && !juego.demoActual;
  const util = e => e.evnum === 197 && e.mitad === 2 || esCajaLlaves(e) || !!AGUJEROS[e.evnum] || e.evnum === 14 || e.mitad === 2 && LAVADERO.has(e.evnum) || e.evnum === 217 || esHuecoFinal(e) || esAbrigoVacio(e) || hauntings.util(e);
  async function puertaLlaves() {
    await ctx.decir([ ctx.textoRoom(152) ]);
    pararAmbientes();
    await M.fundir(1, .5);
    try {
      await cuarto.cargar("rl06b", {
        pos: new THREE.Vector3(0, 0, 0)
      });
    } catch (err) {
      console.warn("pasillo rl06b", err.message);
    }
    juego.fase = "puerta del 302";
    await ctx.demo(51, {
      sinVuelta: true
    });
    quitarItem(60);
    for (const b of finDe(200) || [ 1580 ]) prender(b);
    M.ponerVelo(1);
    api.ultimoDestino = {
      etapa: "cm",
      llegada: {
        escena: 24,
        pos: POS_CM24,
        rot: ROT_CM24
      }
    };
    return {
      terminar: true,
      aSubte: true,
      etapa: "cm",
      escena: 24,
      pos: POS_CM24,
      rot: ROT_CM24
    };
  }
  async function picoDeLaEsperanza() {
    await M.fundir(1, 1.07);
    quitarItem(86);
    son()?.efecto(50014, null, {
      volumen: 1
    });
    await M.esperar(1);
    prender(1577);
    cuarto.aplicarEstado();
    await M.fundir(0, 1.07);
    return null;
  }
  const esCajaLlaves = e => e.mitad === 2 && +e.escena === 1 && /^0x4dadf0/.test(e.funciones?.trgchk || "");
  async function ejecutar(e) {
    if (e.evnum === 197 && e.mitad === 2) return tieneItem(86) ? picoDeLaEsperanza() : null;
    if (esCajaLlaves(e)) return tieneItem(60) && cumpleEv(200) ? puertaLlaves() : null;
    const rh = await hauntings.ejecutar(e);
    if (rh !== undefined) return rh;
    if (e.evnum === 2217) {
      if (!tieneItem(101)) return null;
      quitarItem(101);
      return undefined;
    }
    if (puertaConLlaves(e)) return puertaLlaves();
    if (/^0x4da770/.test(e.funciones?.exec || "")) {
      const id = SON_PUERTA_ENTRADA[e.zona?.grupo_0x414 ?? -1];
      if (id) son()?.efecto(id, null, {
        volumen: 1
      });
      return undefined;
    }
    if (e.evnum === VENTILADOR.ev && e.mitad === 2) {
      son()?.efecto(VENTILADOR.id, aMundo(VENTILADOR.pos), {
        volumen: 1,
        radio: 4e3
      });
      for (const b of finDe(VENTILADOR.ev) || [ 1570 ]) prender(b);
      cuarto.aplicarEstado?.();
      return null;
    }
    if (esAbrigoVacio(e)) {
      await ctx.decir([ ctx.textoRoom(sala() === "rl04a" ? 257 : 259) ]);
      return null;
    }
    if (esHuecoFinal(e)) {
      if (sala() === "rl04a") {
        await ctx.decir([ ctx.textoRoom(258) ]);
        return null;
      }
      if (!tieneItem(87)) {
        await ctx.decir([ ctx.textoRoom(267) ]);
        return null;
      }
      if (!await ctx.decir([ ctx.textoRoom(260) ], {
        pregunta: true
      })) return null;
    }
    if (e.evnum === 217 || esHuecoFinal(e)) {
      await ctx.demo(60, {
        sinVuelta: true
      });
      api.ultimoDestino = {
        etapa: "ls"
      };
      return {
        terminar: true,
        aSubte: true,
        etapa: "ls"
      };
    }
    if (e.mitad === 2 && LAVADERO.has(e.evnum)) return lavadero(e);
    if (AGUJEROS[e.evnum]) return agujero(AGUJEROS[e.evnum], e);
    if (e.evnum === 14) return llamada(e);
    if (SOLO_BANDERA.has(e.evnum) && !e.mensajes?.length) {
      for (const b of finDe(e.evnum) || []) prender(b);
      alEntrarSala(false);
      return null;
    }
    return undefined;
  }
  async function llamada(e) {
    prender(1525);
    const h = son()?.efecto(LLAMADA.id, null, {
      volumen: 1,
      loop: false
    });
    juego.hablando = true;
    for (const [n, s] of LLAMADA.guion) {
      if (n != null && juego.opciones?.subtitulos !== false) ctx.mostrarSub(ctx.textoRoom(n)); else ctx.mostrarSub("");
      await M.esperar(s);
    }
    ctx.mostrarSub("");
    juego.hablando = false;
    try {
      h?.parar(.5);
    } catch {}
    for (const b of finDe(14) || [ 1526 ]) prender(b);
    alEntrarSala(false);
  }
  const LAVADERO = new Set([ 150, 151, 152, 3157, 3158, 3159, 3160, 3193, 3194, 3195, 3196 ]);
  const textoDe = m => (m.archivo === 4 ? ctx.textoRoom(m.msg) : m.archivo === 1 ? juego.textoItem?.(m.msg) : juego.textoComun?.(m.msg)) || "";
  const decirGuion = g => ctx.decir((g || []).filter(c => c.msg != null).map(textoDe).filter(Boolean));
  async function usarTalisman() {
    const T = D2?.talisman || {
      item: 78,
      sonido: 50707,
      bandera: 1565
    };
    await ctx.decir([ ctx.textoRoom(143) ]);
    await M.fundir(1, .5);
    quitarItem(T.item);
    son()?.efecto(T.sonido, null, {
      volumen: 1
    });
    await M.esperar(1);
    await M.fundir(0, .5);
    for (const b of finDe(151) || [ T.bandera ]) prender(b);
    prender(T.bandera);
    if (cumpleEv(3156)) await todosLosLetreros();
    return null;
  }
  async function ponerLetrero(L) {
    await decirGuion(L.guion);
    prender(L.bandera);
    prender(L.bandera_codigo);
    quitarItem(L.item);
    son()?.efecto(50703, null, {
      volumen: 1
    });
    if (cumpleEv(3156)) await todosLosLetreros();
    return null;
  }
  async function todosLosLetreros() {
    const T = D2?.todos_los_letreros || {
      sonido: 52706,
      bandera: 1567
    };
    if (F(T.bandera)) return null;
    await M.esperar(1);
    await M.fundir(1, .5);
    son()?.efecto(T.sonido, null, {
      volumen: 1
    });
    await M.esperar(1);
    prender(T.bandera);
    await M.fundir(0, .5);
    return null;
  }
  async function lavadero(e) {
    const ev = e.evnum;
    if ((ev === 150 || ev === 151) && !F(1565)) {
      if (tieneItem(78)) return usarTalisman();
      await ctx.decir([ ctx.textoRoom(142) ]);
      return null;
    }
    if (ev === 152) {
      const G = D2?.ev152;
      await decirGuion(F(1566) ? G?.con_1566 : G?.sin_1566);
      prender(1566);
      return null;
    }
    const L = (D2?.letreros || []).find(x => x.ev === ev || x.examinar === ev);
    if (L) {
      if (!F(L.bandera) && tieneItem(L.item)) return ponerLetrero(L);
      const X = e.examinar_letrero || (D2?.eventos || []).find(x => x.evnum === L.examinar)?.examinar_letrero;
      if (X) await decirGuion(F(L.bandera) ? X.con : X.sin);
      return null;
    }
    return undefined;
  }
  const checkpoint = () => CP.find(c => F(c.bandera)) || CP[0] || null;
  function marcarCheckpoint(etapa, esc) {
    for (const c of CP) PARTIDA.banderas[c.bandera] = 0;
    const c = CP.find(x => x.etapa === etapa && x.escena === +esc);
    if (!c) {
      prender(9);
      return null;
    }
    prender(c.bandera);
    prender(c.bandera_mapa);
    return c;
  }
  async function tunel(n, vuelta) {
    const nombre = "gt" + String(n).padStart(2, "0");
    try {
      M.ponerVelo(1);
      await cuarto.cargar(nombre, {
        pos: new THREE.Vector3
      });
    } catch (err) {
      console.warn("túnel", nombre, err.message);
      return null;
    }
    return ctx.demo(demoTunel(n, vuelta), {
      sinVuelta: true
    });
  }
  async function agujero(a, e) {
    const yaVisto = F(a.visto);
    const texto = yaVisto ? juego.textoComun(16) : ctx.textoRoom(a.msg);
    const si = await ctx.decir([ texto ], {
      pregunta: true
    });
    for (const b of finDe(e.evnum) || []) prender(b);
    if (!si) return null;
    for (const f of a.efectos) {
      if (f === "0x4d41e0" && F(1620)) prender(1621);
      if (f === "0x4d4df0" && F(1617)) {
        prender(1682);
        prender(1619);
      }
      if (f === "0x4d4270" && F(1625)) prender(1626);
      if (f === "0x4d42f0" && F(1628)) prender(1631);
    }
    pararAmbientes();
    const primeraVez = !F(a.primera);
    if (e.evnum === 7 && primeraVez) return ctx.agujeroBano(e, {
      sinPregunta: true
    });
    let destino;
    if (primeraVez) destino = {
      etapa: a.etapa,
      escena: a.escena,
      pos: a.llegada?.pos || null,
      rot: a.llegada?.rot ?? null
    }; else {
      const c = checkpoint();
      destino = c ? {
        etapa: c.etapa,
        escena: c.escena,
        pos: c.pos,
        rot: c.rot,
        checkpoint: c.fila
      } : {
        etapa: a.etapa,
        escena: a.escena
      };
    }
    juego.fase = "túnel " + a.tunel;
    api.ultimoDestino = {
      ...destino,
      primeraVez: primeraVez
    };
    await tunel(a.tunel, false);
    M.ponerVelo(1);
    return {
      terminar: true,
      aSubte: true,
      ...destino,
      primeraVez: primeraVez,
      tunel: a.tunel,
      desde: e.evnum
    };
  }
  let vuelta = null;
  function elegirDespertar() {
    for (const d of DESPERTADOR) if (cumpleEv(d.ev)) return d;
    return {
      ev: 0,
      demo: DESPERTAR_COMUN
    };
  }
  async function despertar(opciones = {}) {
    actualizarMitad();
    const v = vuelta;
    vuelta = null;
    if (v?.tunel) {
      juego.fase = "túnel " + v.tunel + " (vuelta)";
      await tunel(v.tunel, true);
      M.ponerVelo(1);
      await cuarto.cargar(ctx.varianteDe("rl01"), {
        pos: aMundo([ 417, 0, -334.6 ]),
        giro: giroDeAngulo(-1.371)
      });
      ctx.alEntrarSala();
      juego.fase = "vuelta al 302";
    }
    const d = elegirDespertar();
    juego.ultimoDespertar = "ev " + d.ev + " → d_" + String(d.demo).padStart(3, "0");
    const r = await ctx.demo(d.demo, {
      ...opciones,
      sinVuelta: false
    });
    for (const b of (d.ev ? finDe(d.ev) : null) || []) prender(b);
    if (pedido1518 && !F(1518)) prender(1518);
    pedido1518 = false;
    const c = r && !r.saltada ? r.D.muestrear(r.D.sqt.n - 1, false).cam : null;
    if (c) {
      const qc = new THREE.Quaternion(0, 0, 1, 0).multiply(new THREE.Quaternion(...c.rot)).multiply(new THREE.Quaternion(1, 0, 0, 0));
      const f = new THREE.Vector3(0, 0, -1).applyQuaternion(qc);
      cuarto.ponerEn(aMundo([ c.pos[0], 0, c.pos[2] ]), Math.atan2(-f.x, -f.z));
    } else cuarto.ponerEn(aMundo(POS_SALTADA), giroDeAngulo(ROT_SALTADA));
    if (!M.enVR()) M.camara.position.set(0, OJOS, 0);
    await ctx.recargarSala();
    ctx.alEntrarSala();
    return r;
  }
  function agujeroDelMundo({etapa: etapa, escena: esc}) {
    const c = marcarCheckpoint(etapa, esc);
    vuelta = {
      tunel: tunelDe(etapa, +esc, F(1130)),
      etapa: etapa,
      escena: esc,
      checkpoint: c?.fila ?? null
    };
    return {
      volver302: true,
      escena302: 2,
      agujero: vuelta
    };
  }
  let pedido1518 = false;
  function envolverCtx(c) {
    return {
      ...c,
      prender: n => {
        if (n === 1518 && juego.fase === "vuelta al 302") {
          pedido1518 = true;
          return;
        }
        c.prender(n);
      },
      demo: (id, op) => +id === 54 && juego.fase === "vuelta al 302" ? despertar(op) : c.demo(id, op)
    };
  }
  const vueltaPrueba = q.has("vuelta") ? VUELTAS[+q.get("vuelta")] : null;
  if (vueltaPrueba) for (const b of vueltaPrueba.banderas) prender(b);
  async function arranquePrueba() {
    if (!vueltaPrueba) return;
    actualizarMitad();
    if (q.has("placas")) for (const k of [ 78, 118, 119, 120, 121 ]) if (!tieneItem(k)) PARTIDA.inventario.push(k);
    if (vueltaPrueba.eileen && !PARTIDA.eileen) PARTIDA.eileen = {
      ...guardadoNuevo(),
      estado: 2,
      ...vueltaPrueba.eileen
    };
    for (const k of vueltaPrueba.items || []) if (!tieneItem(k)) PARTIDA.inventario.push(k);
    if (vueltaPrueba.agujero) agujeroDelMundo(vueltaPrueba.agujero);
    juego.fase = "vuelta al 302";
    M.ponerVelo(1);
    await despertar();
    juego.fase = "302";
    await M.fundir(0, .8);
  }
  const api = {
    TRGCHK: TRGCHK,
    finDe: finDe,
    condDe: condDe,
    cumpleEv: cumpleEv,
    esAutomatico: esAutomatico,
    auto: auto,
    util: util,
    ejecutar: ejecutar,
    alEntrarSala: alEntrarSala,
    pararAmbientes: pararAmbientes,
    despertar: despertar,
    agujeroDelMundo: agujeroDelMundo,
    marcarCheckpoint: marcarCheckpoint,
    checkpoint: checkpoint,
    envolverCtx: envolverCtx,
    arranquePrueba: arranquePrueba,
    elegirDespertar: elegirDespertar,
    varianteDe: b => ctx.varianteDe(b),
    efectos: efectos,
    hauntings: hauntings,
    quitarItem: quitarItem,
    tieneItem: tieneItem,
    get vuelta() {
      return vuelta;
    },
    estado() {
      return {
        sala: sala(),
        reloj: Math.round(PARTIDA.reloj),
        ambientes: sonando.map(s => s.que + " " + s.id),
        efectos: efectos.estado(),
        despertar: elegirDespertar(),
        checkpoint: checkpoint()?.fila ?? null,
        ultimoDespertar: juego.ultimoDespertar || null
      };
    }
  };
  juego.dias302 = api;
  return api;
}
