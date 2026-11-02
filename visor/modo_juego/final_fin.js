// SH4 web — FeniXVOID · Project Ravenlight
import { q } from "./motor.js";

import * as P from "./pantallas.js";

import { leerMensajes } from "./fuente.js";

import { imagenJuego } from "../suite_juego.js";

import { eileenSobrevive } from "../enemigos/eileen.js";

export const LETRA_FINAL = {
  A: 1,
  B: 2,
  C: 3,
  D: 4
};

export const BANDERA_FINAL = {
  A: 5,
  B: 6,
  C: 7,
  D: 8
};

export const VIDEO_FINAL = {
  A: 2,
  B: 3,
  C: 4,
  D: 5
};

export const VIDEO_CREDITOS = 6;

const TEXTO_FINAL = {
  A: 287,
  B: 288,
  C: 289,
  D: 290
};

const NOMBRE = {
  A: '"Escape"',
  B: '"Madre"',
  C: '"Muerte de Eileen"',
  D: '"21 Sacramentos"'
};

const TEMA_RESULTADOS = 10046;

export const SUBTITULOS = [ [ 2, 13, 920, 970 ], [ 2, 8, 1740, 1800 ], [ 2, 0, 1880, 1975 ], [ 2, 1, 1980, 2025 ], [ 2, 2, 2030, 2070 ], [ 2, 8, 4555, 4600 ], [ 2, 9, 5905, 6e3 ], [ 3, 13, 980, 1025 ], [ 3, 11, 1770, 1830 ], [ 3, 0, 1900, 1973 ], [ 3, 1, 1985, 2015 ], [ 3, 2, 2030, 2075 ], [ 3, 11, 4620, 4680 ], [ 3, 12, 5970, 6070 ], [ 4, 13, 900, 980 ], [ 4, 0, 1670, 1770 ], [ 4, 1, 1780, 1830 ], [ 4, 2, 1835, 1875 ], [ 4, 18, 3335, 3386 ], [ 4, 19, 3387, 3420 ], [ 4, 20, 3421, 3478 ], [ 4, 21, 3500, 3595 ], [ 4, 22, 3600, 3768 ], [ 4, 23, 3777, 3846 ], [ 4, 24, 3855, 3975 ], [ 4, 25, 3980, 4125 ], [ 4, 26, 4127, 4200 ], [ 4, 27, 4210, 4400 ], [ 4, 28, 4410, 4480 ], [ 5, 13, 819, 904 ], [ 5, 29, 3180, 3225 ], [ 5, 30, 3245, 3288 ], [ 5, 31, 3305, 3355 ], [ 5, 32, 3360, 3580 ], [ 5, 33, 3651, 3697 ], [ 5, 34, 3720, 3778 ], [ 5, 35, 3778, 3820 ], [ 5, 36, 3830, 4e3 ], [ 5, 37, 4001, 4024 ], [ 5, 38, 4025, 4115 ], [ 5, 39, 4116, 4320 ], [ 5, 40, 4340, 4512 ], [ 5, 41, 4530, 4620 ], [ 5, 42, 4650, 4800 ], [ 5, 43, 4820, 4854 ], [ 5, 44, 4855, 4930 ], [ 5, 45, 4940, 5070 ], [ 5, 46, 5080, 5250 ], [ 5, 47, 5260, 5335 ], [ 5, 48, 5336, 5490 ], [ 5, 50, 5510, 5560 ], [ 5, 51, 5570, 5610 ], [ 5, 52, 5612, 5725 ] ];

const FILAS = [ 353, 354, 355, 356, 357, 361, 359, 360 ];

const DIFICULTAD = [ 75, 75, 76, 77 ];

const PUNTOS_NIVEL = [ 0, 5, 10, 20 ];

const NOTAS = [ 101, 152 ];

export function cuartoLimpio(PARTIDA) {
  const f = PARTIDA?.fenomenos || {};
  const pur = +f.purificados || 0, total = pur + (+f.fallados || 0) + (+f.activos || 0);
  return (total ? pur / total : 1) >= .8;
}

export function decidirFinal({eileen: eileen, PARTIDA: PARTIDA}) {
  const viva = eileenSobrevive(eileen || {}), limpio = cuartoLimpio(PARTIDA);
  if (viva && limpio) return "A";
  if (viva) return "B";
  if (limpio) return "C";
  return "D";
}

export function puntaje(d) {
  const tiempo = Math.max(0, Math.min(20, Math.trunc(24 - d.segundos * (1 / 3600) * 2)));
  const p = (PUNTOS_NIVEL[d.nivel] ?? 0) + tiempo + Math.max(0, Math.min(12, 12 - d.guardadas)) + Math.max(0, Math.min(10, 10 - d.continuadas)) + Math.floor(d.notas * 20 / 52) + Math.min(20, Math.floor(d.derrotados / 6));
  return {
    total: Math.min(100, p),
    tiempo: tiempo
  };
}

export async function jugarFin({juego: juego, M: M, PARTIDA: PARTIDA, letra: letra, bajar: bajar, henry: henry = null}) {
  const L = juego.IDIOMA || "s", fuente = juego.fuente;
  let last0 = [];
  try {
    last0 = leerMensajes(await bajar(`data/message_last0_${L}.bin`))[0] || [];
  } catch {}
  juego.fase = "final " + letra;
  try {
    juego.ambiente?.son?.musica?.(null);
  } catch {}
  M.pantalla.ocultar();
  await M.fundir(1, .3);
  await videoConSubtitulos(juego, M, VIDEO_FINAL[letra], last0, fuente);
  if (!q.has("sincreditos")) await videoConSubtitulos(juego, M, VIDEO_CREDITOS, [], fuente);
  const datos = datosResultados(juego, PARTIDA, letra);
  await resultados(juego, M, datos, fuente);
  await guardarFinal(juego, M, PARTIDA, letra, datos, henry);
  M.pantalla.ocultar();
  if (q.has("quedarse")) {
    juego.fase = "fin del juego";
    juego.datosFinal = datos;
    await new Promise(() => {});
  }
  const u = new URLSearchParams(location.search);
  for (const k of [ "mundo", "finalfijo", "jefe", "cordon", "lanzas", "maldicion", "banderas" ]) u.delete(k);
  u.set("ir", "titulo");
  u.set("auto", "");
  location.search = u.toString();
  return datos;
}

async function videoConSubtitulos(juego, M, n, last0, fuente) {
  if (q.has("sinvideos")) return;
  const filas = SUBTITULOS.filter(s => s[0] === n);
  let actual = -1;
  const g = M.pantalla.g;
  const tarea = () => {
    const v = juego.video;
    if (!v) return false;
    const f = (v.tiempo || 0) * 30;
    const i = filas.findIndex(s => f >= s[2] && f < s[3]);
    if (i === actual) return false;
    actual = i;
    g.clearRect(0, 0, g.canvas.width, g.canvas.height);
    if (i >= 0) P.dibujarSubtitulo(g, fuente, last0[filas[i][1]] || "", {
      y: 372
    });
    M.pantalla.actualizar();
    return true;
  };
  if (filas.length) M.tareas.add(tarea);
  const p = juego.reproducirVideo(n, {
    saltable: true
  });
  M.ponerVelo(0);
  try {
    await p;
  } catch (e) {
    console.warn("video", n, e);
  }
  M.ponerVelo(1);
  M.tareas.delete(tarea);
  g.clearRect(0, 0, g.canvas.width, g.canvas.height);
}

function datosResultados(juego, PARTIDA, letra) {
  let notas = 0;
  for (let b = NOTAS[0]; b <= NOTAS[1]; b++) if (PARTIDA.banderas?.[b]) notas++;
  const d = {
    nivel: Math.max(1, Math.min(3, juego.nivel ?? 2)),
    segundos: Number.isFinite(PARTIDA.tiempoJuego) ? PARTIDA.tiempoJuego : performance.now() / 1e3,
    guardadas: PARTIDA.guardadas || 0,
    continuadas: PARTIDA.continuadas || 0,
    derrotados: PARTIDA.derrotados || 0,
    notas: notas,
    letra: letra
  };
  Object.assign(d, puntaje(d));
  return d;
}

async function resultados(juego, M, d, fuente) {
  const g = M.pantalla.g, tc = n => juego.textoComun?.(n) || "";
  let fondo = null;
  try {
    fondo = await imagenJuego("snap_result0" + LETRA_FINAL[d.letra], 0, [ 0, 0, 512, 448 ]);
  } catch {}
  try {
    juego.musica?.tocar(TEMA_RESULTADOS);
  } catch {}
  const h = Math.floor(d.segundos / 3600), mi = Math.floor(d.segundos % 3600 / 60), se = Math.floor(d.segundos % 60);
  const valores = [ [ tc(DIFICULTAD[d.nivel]), d.nivel === 3 ], [ `${String(h).padStart(2, " ")}:${String(mi).padStart(2, "0")}:${String(se).padStart(2, "0")}`, d.tiempo >= 20 ], [ String(d.guardadas).padStart(2, " "), 12 - d.guardadas >= 12 ], [ String(d.continuadas).padStart(2, " "), 10 - d.continuadas >= 10 ], [ String(d.derrotados).padStart(2, " "), Math.floor(d.derrotados / 6) >= 20 ], [ `${String(d.notas).padStart(2, " ")} / 52`, Math.floor(d.notas * 20 / 52) >= 20 ], [ tc(TEXTO_FINAL[d.letra]) || NOMBRE[d.letra], false ] ];
  M.ponerVelo(0);
  M.pantalla.mostrar();
  await M.fundir(0, .3);
  await new Promise(ok => {
    let t = 0;
    const t0 = performance.now(), quieto = q.has("quieto") ? (+q.get("resultados") || 2) * 1e3 : 0;
    const tarea = (dt, {acciones: acciones}) => {
      t += dt;
      const a = Math.min(1, t / (128 / 30));
      P.limpiar(g);
      if (fondo) P.imagen(g, fondo, Math.min(1, t * 2));
      FILAS.forEach((n, i) => {
        const y = 56 + 40 * i;
        fuente.escribir(g, tc(n), 40, y, {
          escala: P.ESC,
          alfa: a,
          color: "#c8bfae"
        });
        if (i < valores.length) fuente.escribir(g, valores[i][0], 600, y, {
          escala: P.ESC,
          alinear: "der",
          alfa: a,
          color: valores[i][1] ? "#e0b050" : "#ece3d2"
        });
      });
      const grandes = Math.floor(d.total / 10), chicas = d.total % 10;
      let x = 600;
      for (let k = 0; k < chicas; k++) {
        fuente.escribir(g, "*", x, 336 + 6, {
          escala: P.ESC,
          alinear: "der",
          alfa: a,
          color: "#ece3d2"
        });
        x -= 10;
      }
      for (let k = 0; k < grandes; k++) {
        fuente.escribir(g, "*", x / 1.6, 332 / 1.6, {
          escala: P.ESC * 1.6,
          alinear: "der",
          alfa: a,
          color: "#e0b050"
        });
        x -= 18;
      }
      M.pantalla.actualizar();
      if (t > 1.2 && acciones.some(x => x === "aceptar" || x === "accion" || x === "clic" || x === "cancelar")) {
        M.tareas.delete(tarea);
        ok();
      }
      if (quieto && performance.now() - t0 > quieto) {
        M.tareas.delete(tarea);
        ok();
      }
      return true;
    };
    M.tareas.add(tarea);
  });
  await M.fundir(1, .5);
  try {
    juego.musica?.parar(2);
  } catch {}
}

const ITEM_UNIFORME = 123;

export function datosTerminada(PARTIDA, letra, rango, henry = null) {
  const previos = PARTIDA.terrorNuevo || {};
  const finales = [ ...new Set([ ...previos.finales || [], ...PARTIDA.finales || [], letra ]) ];
  const inv = henry?.inventario;
  const tieneUniforme = !!((inv?.cuantos?.(ITEM_UNIFORME) || 0) > 0 || inv?.notas?.includes?.(ITEM_UNIFORME) || PARTIDA.henry?.lugares?.some(([k, n]) => k === ITEM_UNIFORME && n > 0) || PARTIDA.henry?.notas?.includes(ITEM_UNIFORME));
  const vestido = !!previos.vestido || (letra === "A" || letra === "B") && tieneUniforme;
  const cynthia = !!previos.cynthia || [ "A", "B", "C", "D" ].every(l => finales.includes(l));
  return {
    finales: finales,
    rango: Math.max(+previos.rango || 0, rango | 0),
    vestido: vestido,
    cynthia: cynthia,
    modo: previos.modo || 0,
    ultimo: letra,
    fecha: (new Date).toISOString()
  };
}

async function guardarFinal(juego, M, PARTIDA, letra, datos, henry = null) {
  PARTIDA.finales = [ ...new Set([ ...PARTIDA.finales || [], letra ]) ];
  PARTIDA.final = {
    letra: letra,
    numero: LETRA_FINAL[letra],
    bandera: BANDERA_FINAL[letra],
    rango: datos.total,
    fecha: (new Date).toISOString()
  };
  PARTIDA.guardadas = Math.min(99, (PARTIDA.guardadas || 0) + 1);
  const terminada = datosTerminada(PARTIDA, letra, datos.total, henry);
  juego.datosTerminada = terminada;
  M.pantalla.ocultar();
  await M.fundir(0, .3);
  const {pantallaGuardado: pantallaGuardado} = await (import("./guardado.js"));
  await pantallaGuardado(juego, {
    modo: "guardar",
    partida: PARTIDA,
    nivel: datos.nivel,
    terminada: terminada,
    preguntarSalir: true
  });
  await M.fundir(1, .5);
}
