// SH4 web — FeniXVOID · Project Ravenlight
import * as P from "./pantallas.js";

import { t, sitioIngles } from "../textos_sitio.js";

import { q } from "./motor.js";

import { puntero2D } from "./menu2d.js";

import { cargarDatos } from "../jugador/datos.js";

const KIT = {
  nada: {
    henry: []
  },
  sb: {
    henry: [ [ 18, 1 ], [ 9, 2 ] ],
    arma: 18
  },
  d2: {
    henry: [ [ 18, 1 ], [ 9, 2 ], [ 118, 1 ] ],
    arma: 18
  },
  fr: {
    henry: [ [ 18, 1 ], [ 16, 1 ], [ 1, 15 ], [ 9, 3 ], [ 11, 1 ] ],
    baul: [ [ 118, 1 ] ],
    arma: 18
  },
  d3: {
    henry: [ [ 18, 1 ], [ 16, 1 ], [ 1, 12 ], [ 9, 2 ], [ 11, 1 ], [ 119, 1 ] ],
    baul: [ [ 118, 1 ] ],
    arma: 18
  },
  mz: {
    henry: [ [ 18, 1 ], [ 16, 1 ], [ 1, 20 ], [ 9, 3 ], [ 11, 1 ], [ 4, 1 ] ],
    baul: [ [ 118, 1 ], [ 119, 1 ] ],
    arma: 18
  },
  d4: {
    henry: [ [ 18, 1 ], [ 16, 1 ], [ 1, 18 ], [ 9, 2 ], [ 11, 1 ], [ 4, 1 ], [ 120, 1 ] ],
    baul: [ [ 118, 1 ], [ 119, 1 ] ],
    arma: 18
  },
  bd: {
    henry: [ [ 18, 1 ], [ 16, 1 ], [ 1, 20 ], [ 9, 3 ], [ 11, 1 ], [ 4, 1 ], [ 8, 1 ] ],
    baul: [ [ 118, 1 ], [ 119, 1 ], [ 120, 1 ] ],
    arma: 18
  },
  d5: {
    henry: [ [ 18, 1 ], [ 16, 1 ], [ 1, 18 ], [ 9, 2 ], [ 11, 1 ], [ 4, 1 ], [ 8, 1 ], [ 121, 1 ] ],
    baul: [ [ 118, 1 ], [ 119, 1 ], [ 120, 1 ] ],
    arma: 18
  },
  ie: {
    henry: [ [ 18, 1 ], [ 16, 1 ], [ 1, 25 ], [ 17, 1 ], [ 2, 6 ], [ 9, 3 ], [ 11, 1 ], [ 4, 1 ] ],
    baul: [ [ 8, 1 ], [ 118, 1 ], [ 119, 1 ], [ 120, 1 ], [ 121, 1 ] ],
    arma: 18
  },
  m2: {
    henry: [ [ 18, 1 ], [ 16, 1 ], [ 1, 25 ], [ 9, 3 ], [ 11, 1 ], [ 118, 1 ], [ 119, 1 ], [ 120, 1 ], [ 121, 1 ] ],
    baul: [ [ 17, 1 ], [ 2, 6 ], [ 4, 1 ], [ 8, 1 ] ],
    arma: 18
  },
  lav: {
    henry: [ [ 18, 1 ], [ 16, 1 ], [ 1, 25 ], [ 9, 3 ], [ 11, 1 ], [ 4, 1 ], [ 8, 1 ] ],
    baul: [ [ 17, 1 ], [ 2, 6 ] ],
    arma: 18
  },
  hs: {
    henry: [ [ 18, 1 ], [ 16, 1 ], [ 1, 25 ], [ 17, 1 ], [ 2, 6 ], [ 9, 3 ], [ 11, 1 ], [ 4, 1 ] ],
    baul: [ [ 8, 1 ] ],
    arma: 18
  },
  hsv: {
    henry: [ [ 18, 1 ], [ 16, 1 ], [ 1, 20 ], [ 17, 1 ], [ 2, 6 ], [ 9, 2 ], [ 10, 1 ], [ 11, 1 ], [ 4, 1 ] ],
    baul: [ [ 8, 1 ] ],
    arma: 18
  },
  m2mundos: {
    henry: [ [ 18, 1 ], [ 16, 1 ], [ 1, 30 ], [ 17, 1 ], [ 2, 10 ], [ 9, 3 ], [ 11, 1 ], [ 4, 2 ], [ 8, 1 ] ],
    baul: [ [ 10, 1 ] ],
    arma: 18
  },
  final: {
    henry: [ [ 18, 1 ], [ 16, 1 ], [ 1, 30 ], [ 17, 1 ], [ 2, 10 ], [ 9, 3 ], [ 11, 1 ], [ 4, 1 ], [ 87, 1 ] ],
    baul: [ [ 8, 1 ], [ 10, 1 ] ],
    arma: 18
  }
};

const sin = (l, ...x) => l.filter(b => !x.includes(b));

const B = {
  sb: V => [ ...sin(V[1].banderas, 301, 302, 304), 1516 ],
  fr: V => sin(V[3].banderas, 501),
  mz: V => sin(V[5].banderas, 701),
  bd: V => sin(V[7].banderas, 901),
  ie: V => sin(V[9].banderas, 1101),
  hs: V => [ ...V[11].banderas ],
  m2: V => [ ...V[12].banderas, 1310, 1317 ]
};

B.sb2 = V => [ ...B.m2(V), 316 ];

B.fr2 = V => [ ...B.sb2(V), 1852, 328, 523 ];

B.mz2 = V => [ ...B.fr2(V), 534 ];

B.bd2 = V => [ ...B.mz2(V), 719, 721 ];

B.cm = V => [ ...B.bd2(V), 1858, 1856, 917, 1173 ];

const ES = (s, e) => ({
  s: s,
  e: e
});

export const GRUPOS = {
  rl: ES("El 302", "Room 302"),
  m1: ES("Primera mitad", "First half"),
  m2: ES("Segunda mitad", "Second half"),
  fin: ES("El final", "The ending"),
  salas: ES("Salas clave", "Key rooms")
};

export const CAPITULOS = [ {
  id: "d1",
  g: "rl",
  n: ES("Día 1: después del sueño", "Day 1: after the dream"),
  q: {},
  kit: "nada"
}, {
  id: "d2",
  g: "rl",
  n: ES("Día 2: de vuelta del Metro", "Day 2: back from the Subway"),
  q: {
    vuelta: 2
  },
  kit: "d2"
}, {
  id: "d3",
  g: "rl",
  n: ES("Día 3: de vuelta del Bosque", "Day 3: back from the Forest"),
  q: {
    vuelta: 4
  },
  kit: "d3"
}, {
  id: "d4",
  g: "rl",
  n: ES("Día 4: de vuelta de la Prisión de Agua", "Day 4: back from the Water Prison"),
  q: {
    vuelta: 6
  },
  kit: "d4"
}, {
  id: "d5",
  g: "rl",
  n: ES("Día 5: de vuelta del Edificio", "Day 5: back from the Building"),
  q: {
    vuelta: 8
  },
  kit: "d5"
}, {
  id: "m2",
  g: "rl",
  n: ES("Segunda mitad: de vuelta del Apartamento", "Second half: back from the Apartments"),
  q: {
    vuelta: 10
  },
  kit: "m2"
}, {
  id: "lav",
  g: "rl",
  n: ES("Segunda mitad: el agujero del lavadero", "Second half: the laundry hole"),
  q: {
    vuelta: 11
  },
  kit: "lav"
}, {
  id: "hsv",
  g: "rl",
  n: ES("Segunda mitad: de vuelta del Hospital", "Second half: back from the Hospital"),
  q: {
    vuelta: 12
  },
  kit: "hsv"
}, {
  id: "sb",
  g: "m1",
  n: ES("Mundo del Metro", "Subway World"),
  q: {
    mundo: "sb"
  },
  b: B.sb,
  kit: "sb"
}, {
  id: "fr",
  g: "m1",
  n: ES("Mundo del Bosque", "Forest World"),
  q: {
    mundo: "fr"
  },
  b: B.fr,
  kit: "fr"
}, {
  id: "mz",
  g: "m1",
  n: ES("Prisión de Agua", "Water Prison World"),
  q: {
    mundo: "mz"
  },
  b: B.mz,
  kit: "mz"
}, {
  id: "bd",
  g: "m1",
  n: ES("Mundo del Edificio", "Building World"),
  q: {
    mundo: "bd"
  },
  b: B.bd,
  kit: "bd"
}, {
  id: "ie",
  g: "m1",
  n: ES("Mundo del Apartamento", "Apartment World"),
  q: {
    mundo: "ie"
  },
  b: B.ie,
  kit: "ie"
}, {
  id: "hs",
  g: "m2",
  n: ES("Mundo del Hospital", "Hospital World"),
  q: {
    mundo: "hs"
  },
  b: B.hs,
  kit: "hs"
}, {
  id: "st",
  g: "m2",
  n: ES("La escalera en espiral", "The spiral staircase"),
  q: {
    mundo: "st01"
  },
  b: B.m2,
  kit: "m2mundos",
  eileen: 1
}, {
  id: "sb2",
  g: "m2",
  n: ES("Metro (segunda vez)", "Subway (second time)"),
  q: {
    mundo: "sb19"
  },
  b: B.sb2,
  kit: "m2mundos",
  eileen: 1
}, {
  id: "fr2",
  g: "m2",
  n: ES("Bosque (segunda vez)", "Forest (second time)"),
  q: {
    mundo: "fr19"
  },
  b: B.fr2,
  kit: "m2mundos",
  eileen: 1
}, {
  id: "mz2",
  g: "m2",
  n: ES("Prisión de Agua (segunda vez)", "Water Prison (second time)"),
  q: {
    mundo: "st06"
  },
  b: B.mz2,
  kit: "m2mundos",
  eileen: 1
}, {
  id: "bd2",
  g: "m2",
  n: ES("Edificio (segunda vez)", "Building (second time)"),
  q: {
    mundo: "st04"
  },
  b: B.bd2,
  kit: "m2mundos",
  eileen: 1
}, {
  id: "cm",
  g: "m2",
  n: ES("El 302 del pasado", "Room 302 of the past"),
  q: {
    mundo: "cm21"
  },
  b: B.cm,
  kit: "m2mundos",
  eileen: 1
}, {
  id: "fin",
  g: "fin",
  n: ES("El final: hacia Walter", "The ending: towards Walter"),
  q: {
    ir: "final"
  },
  b: B.cm,
  kit: "final"
}, {
  id: "jefe",
  g: "fin",
  n: ES("El final: la pelea con Walter", "The ending: the fight with Walter"),
  q: {
    ir: "final",
    jefe: ""
  },
  b: B.cm,
  kit: "final"
}, {
  id: "sb24",
  g: "salas",
  n: ES("Metro: el andén del final", "Subway: the last platform"),
  q: {
    mundo: "sb24"
  },
  b: V => [ ...B.sb(V), 301, 302, 1526, 338 ],
  kit: "sb"
}, {
  id: "fr20",
  g: "salas",
  n: ES("Bosque: la salida (Jasper)", "Forest: the exit (Jasper)"),
  q: {
    mundo: "fr20"
  },
  b: V => [ ...B.fr(V), 501, 507, 513, 516, 518, 520, 521, 562 ],
  kit: "fr"
}, {
  id: "mz39",
  g: "salas",
  n: ES("Prisión de Agua: la salida", "Water Prison: the exit"),
  q: {
    mundo: "mz39"
  },
  b: V => [ ...B.mz(V), 701, 722, 728, 707, 711, 716, 735 ],
  kit: "mz"
}, {
  id: "bd16",
  g: "salas",
  n: ES("Edificio: la escalera de arriba", "Building: the top stairs"),
  q: {
    mundo: "bd16"
  },
  b: V => [ ...B.bd(V), 901, 909, 934, 935, 936, 956 ],
  kit: "bd"
}, {
  id: "ie24",
  g: "salas",
  n: ES("Apartamento: la puerta del 302", "Apartments: the door of 302"),
  q: {
    mundo: "ie24"
  },
  b: V => [ ...B.ie(V), 1101, 1556, 2116 ],
  kit: "ie"
}, {
  id: "hs10",
  g: "salas",
  n: ES("Hospital: Eileen", "Hospital: Eileen"),
  q: {
    mundo: "hs10"
  },
  b: B.hs,
  kit: "hs"
}, {
  id: "hs34",
  g: "salas",
  n: ES("Hospital: la salida a la escalera", "Hospital: the way to the stairs"),
  q: {
    mundo: "hs34"
  },
  b: V => [ ...B.hs(V), 1301, 1310, 1317 ],
  kit: "m2mundos",
  eileen: 1
}, {
  id: "st07",
  g: "salas",
  n: ES("Escalera: los doce WALLMAN", "Stairs: the twelve WALLMAN"),
  q: {
    mundo: "st07"
  },
  b: V => [ ...B.bd2(V), 1858 ],
  kit: "m2mundos",
  eileen: 1
} ];

export const capituloPorId = id => CAPITULOS.find(c => c.id === id) || null;

const PARAMS = [ "ir", "mundo", "vuelta", "banderas", "eileen", "items", "jefe", "placas", "armas", "cordon", "lanzas", "finalfijo" ];

export async function aplicarCapitulo(juego, cap) {
  const [{VUELTAS: VUELTAS}, {guardadoNuevo: guardadoNuevo}] = await Promise.all([ import("./dias_302.js"), import("../enemigos/eileen.js") ]);
  for (const k of PARAMS) q.delete(k);
  q.set("ir", "302");
  for (const [k, v] of Object.entries(cap.q || {})) q.set(k, String(v));
  const banderas = [ ...new Set(cap.b ? cap.b(VUELTAS) : []) ];
  if (banderas.length) q.set("banderas", banderas.join(","));
  const kit = KIT[cap.kit] || KIT.nada;
  const estado = {
    capitulo: cap.id,
    henry: {
      lugares: kit.henry.map(([k, n]) => [ k, n, null ]),
      notas: [],
      vida: 100,
      arma: kit.arma || 0
    },
    baul: (kit.baul || []).map(([k, n]) => [ k, n, null ])
  };
  if (cap.eileen) estado.eileen = {
    ...guardadoNuevo(),
    estado: 1
  };
  juego.estadoInicial = estado;
  juego.capitulo = cap;
  if (!juego.nivel) juego.nivel = 2;
  return estado;
}

const LISTA = {
  y0: 56,
  paso: 23,
  visibles: 12,
  x0: 70,
  x1: 570
};

export async function pantallaCapitulos(juego) {
  const {M: M, fuente: fuente, I: I} = juego;
  const g = M.pantalla.g, tc = juego.textoComun, L = sitioIngles() ? "e" : "s";
  const ptr = puntero2D(M);
  ptr.reiniciar();
  const datos = await cargarDatos({
    idioma: juego.IDIOMA || "s"
  }).catch(() => null);
  const faseAntes = juego.fase;
  juego.fase = "capítulos";
  const filas = [];
  for (const c of CAPITULOS) {
    if (!filas.length || filas[filas.length - 1].cap?.g !== c.g) filas.push({
      grupo: GRUPOS[c.g][L]
    });
    filas.push({
      cap: c
    });
  }
  const elegibles = filas.map((f, i) => f.cap ? i : -1).filter(i => i >= 0);
  let el = elegibles[0], desde = 0, tt = 0;
  const visibles = () => Array.from({
    length: LISTA.visibles
  }, (_, i) => ({
    x0: LISTA.x0 - 10,
    x1: LISTA.x1 + 10,
    y0: LISTA.y0 + i * LISTA.paso,
    y1: LISTA.y0 + (i + 1) * LISTA.paso
  }));
  const resumen = cap => {
    const kit = KIT[cap.kit] || KIT.nada, nom = k => (datos?.nombreItem(k) || "").trim();
    const armas = kit.henry.filter(([k]) => datos?.esArma(k)).map(([k]) => nom(k)).filter(Boolean);
    const otros = kit.henry.filter(([k]) => !datos?.esArma(k)).length;
    const l1 = kit.henry.length ? "Henry: " + (armas.join(", ") || "-") + (otros ? `  (+${otros})` : "") : t("cap.nada");
    const mitad = [ "m2", "fin" ].includes(cap.g) || [ "m2", "lav", "hsv", "hs10", "hs34", "st07" ].includes(cap.id);
    const l2 = [ cap.eileen ? t("cap.eileen") : null, t("cap.vida") + " 100", t(mitad ? "cap.mitad2" : "cap.mitad1"), kit.baul?.length ? t("cap.baul", kit.baul.length) : null ].filter(Boolean).join("  ·  ");
    return [ l1, l2 ];
  };
  const dibujar = () => {
    if (el < desde) desde = el;
    if (el >= desde + LISTA.visibles) desde = el - LISTA.visibles + 1;
    if (el === desde + 0 && desde > 0 && !filas[desde - 1].cap) desde--;
    P.limpiar(g);
    P.imagen(g, I?.titulo, .35);
    g.save();
    g.fillStyle = "rgba(0,0,0,0.62)";
    g.fillRect(40 * P.ESC, 14 * P.ESC, 560 * P.ESC, 420 * P.ESC);
    g.strokeStyle = "rgba(122,59,30,0.6)";
    g.lineWidth = 2;
    g.strokeRect(40 * P.ESC, 14 * P.ESC, 560 * P.ESC, 420 * P.ESC);
    g.restore();
    fuente.escribir(g, t("cap.titulo"), P.W / 2, 24, {
      escala: P.ESC,
      alinear: "centro",
      color: "#e8d9c4"
    });
    for (let i = 0; i < LISTA.visibles; i++) {
      const f = filas[desde + i];
      if (!f) break;
      const y = LISTA.y0 + i * LISTA.paso, sel = desde + i === el;
      if (!f.cap) {
        fuente.escribir(g, f.grupo.toUpperCase(), LISTA.x0 - 6, y + 2, {
          escala: P.ESC,
          color: "#b0402a"
        });
        continue;
      }
      if (sel) {
        g.save();
        g.fillStyle = `rgba(150,28,18,${.45 + .12 * Math.sin(tt * 5)})`;
        g.fillRect((LISTA.x0 - 4) * P.ESC, y * P.ESC, (LISTA.x1 - LISTA.x0 + 8) * P.ESC, (LISTA.paso - 1) * P.ESC);
        g.restore();
      }
      fuente.escribir(g, f.cap.n[L], LISTA.x0 + 16, y + 2, {
        escala: P.ESC,
        color: sel ? "#ffffff" : "#a59a8d",
        alfa: sel ? .85 + .15 * Math.sin(tt * 5) : 1
      });
    }
    if (desde > 0) fuente.escribir(g, "^", LISTA.x1, LISTA.y0, {
      escala: P.ESC,
      color: "#cfc4b4",
      alinear: "der"
    });
    if (desde + LISTA.visibles < filas.length) fuente.escribir(g, "v", LISTA.x1, LISTA.y0 + (LISTA.visibles - 1) * LISTA.paso, {
      escala: P.ESC,
      color: "#cfc4b4",
      alinear: "der"
    });
    const [l1, l2] = resumen(filas[el].cap);
    const y0 = LISTA.y0 + LISTA.visibles * LISTA.paso + 6;
    for (const [s, dy, c] of [ [ l1, 0, "#d8cdbd" ], [ l2, 22, "#a99f92" ] ]) {
      const k = Math.min(1, 530 / Math.max(1, fuente.anchoLinea?.(s) || 1));
      P.escribirEscalado(g, fuente, s, P.W / 2, y0 + dy, k, {
        alinear: "centro",
        color: c
      });
    }
    fuente.escribir(g, `${tc(173) || t("decidir")}      ${tc(174) || t("volver")}`, P.W / 2, 386, {
      escala: P.ESC,
      alinear: "centro",
      color: "#7d746b"
    });
    ptr.dibujar(g);
    M.pantalla.actualizar();
  };
  const r = await new Promise(ok => {
    const mover = d => {
      const k = elegibles.indexOf(el);
      el = elegibles[(k + elegibles.length + d) % elegibles.length];
    };
    const tarea = (dt, {acciones: acciones}) => {
      tt += dt;
      const vis = visibles();
      const dr = ptr.filasArrastradas(LISTA.paso);
      if (dr) mover(dr);
      const i = ptr.sobre(vis);
      if (i != null && filas[desde + i]?.cap) el = desde + i;
      for (const a of acciones) {
        if (a === "arriba") mover(-1); else if (a === "abajo") mover(1); else if (a === "izq") {
          for (let k = 0; k < 5; k++) mover(-1);
        } else if (a === "der") {
          for (let k = 0; k < 5; k++) mover(1);
        } else if (a === "cancelar" || a === "menu") {
          M.tareas.delete(tarea);
          ok(null);
          return true;
        } else if (a === "aceptar" || a === "accion" || a === "clic") {
          if (a === "clic") {
            const k = ptr.tocada(vis);
            if (k == null || !filas[desde + k]?.cap) continue;
            el = desde + k;
          }
          M.tareas.delete(tarea);
          ok(filas[el].cap);
          return true;
        }
      }
      dibujar();
      return true;
    };
    M.pantalla.mostrar();
    dibujar();
    M.tareas.add(tarea);
  });
  juego.fase = faseAntes;
  return r;
}
