// SH4 web — FeniXVOID · Project Ravenlight
import * as P from "./pantallas.js";

import { puntero2D, filasLista } from "./menu2d.js";

import { imagenJuego } from "../suite_juego.js";

export const ESPACIOS = 10;

const CLAVE = n => "sh4guardado" + n, VIEJA = "sh4partida", MIGRADA = "sh4guardadoMigrado";

const leerLS = k => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};

const escribirLS = (k, v) => {
  try {
    localStorage.setItem(k, v);
    return true;
  } catch {
    return false;
  }
};

const LUGAR_M2 = {
  hs: 307,
  sb: 309,
  fr: 311,
  mz: 313,
  bd: 315,
  cm: 317
};

const LUGAR_ST = {
  1: 308,
  2: 310,
  3: 312,
  4: 314,
  5: 316,
  6: 314,
  7: 316
};

export function lugarDe(partida, checkpoint = null) {
  const F = n => !!partida?.banderas?.[n];
  if (F(1130)) {
    const e = checkpoint?.etapa;
    if (e === "st") return LUGAR_ST[checkpoint.escena] || 308;
    return LUGAR_M2[e] || 306;
  }
  if (F(1101)) return 306;
  if (F(901)) return 305;
  if (F(701)) return 304;
  if (F(501)) return 303;
  if (F(301)) return 302;
  return 301;
}

export function migrar() {
  if (leerLS(MIGRADA)) return;
  const vieja = leerLS(VIEJA);
  if (vieja && !leerLS(CLAVE(1))) {
    try {
      const partida = JSON.parse(vieja);
      escribirLS(CLAVE(1), JSON.stringify({
        version: 1,
        n: 1,
        fecha: Date.now(),
        migrada: true,
        tiempo: Math.round(partida.reloj || 0),
        lugar: lugarDe(partida),
        guardadas: partida.guardadas || 1,
        nivel: partida.nivel ?? null,
        partida: partida
      }));
    } catch {}
  }
  escribirLS(MIGRADA, "1");
}

export function leerEspacio(n) {
  try {
    const s = leerLS(CLAVE(n));
    return s ? JSON.parse(s) : null;
  } catch {
    return {
      n: n,
      roto: true
    };
  }
}

export function leerEspacios() {
  migrar();
  return Array.from({
    length: ESPACIOS
  }, (_, i) => leerEspacio(i + 1));
}

export const hayGuardados = () => leerEspacios().some(e => e && !e.roto);

export function ultimoGuardado() {
  return leerEspacios().filter(e => e && !e.roto).sort((a, b) => (b.fecha || 0) - (a.fecha || 0))[0] || null;
}

export function continuarDesde() {
  const u = ultimoGuardado();
  return u && !u.terminada ? u : null;
}

export function guardarEn(n, partida, {checkpoint: checkpoint = null, nivel: nivel = null, terminada: terminada = null} = {}) {
  const dato = {
    version: 1,
    n: n,
    fecha: Date.now(),
    tiempo: Math.round(partida.reloj || 0),
    lugar: terminada ? LUGAR_TERMINADA : lugarDe(partida, checkpoint),
    guardadas: partida.guardadas || 0,
    nivel: nivel ?? partida.nivel ?? null,
    mitad: partida.banderas?.[1130] ? 2 : 1,
    partida: partida
  };
  if (terminada) dato.terminada = terminada;
  return escribirLS(CLAVE(n), JSON.stringify(dato));
}

export const LUGAR_TERMINADA = 319;

export const TEXTO_FINALES = {
  A: 287,
  B: 288,
  C: 289,
  D: 290
};

const dos = v => String(v).padStart(2, "0");

export const tiempoJugado = s => {
  s = Math.max(0, Math.round(s || 0));
  return `${dos(Math.floor(s / 3600))}:${dos(Math.floor(s / 60) % 60)}:${dos(s % 60)}`;
};

const fechaDe = t => {
  if (!t) return "--/--/---- --:--";
  const d = new Date(t);
  return `${dos(d.getDate())}/${dos(d.getMonth() + 1)}/${d.getFullYear()} ${dos(d.getHours())}:${dos(d.getMinutes())}`;
};

const RENGLON = {
  y0: 68,
  paso: 24,
  x0: 36,
  x1: 604
};

let fondo = null;

const pedirFondo = () => fondo ||= imagenJuego("snap_save", 0, [ 0, 0, 512, 448 ]).catch(() => null);

export async function pantallaGuardado(juego, {modo: modo = "cargar", partida: partida = null, checkpoint: checkpoint = null, nivel: nivel = null, terminada: terminada = null, preguntarSalir: preguntarSalir = false} = {}) {
  const {M: M, fuente: fuente} = juego;
  const g = M.pantalla.g, tc = juego.textoComun, EN = juego.IDIOMA !== "s";
  const T = {
    titulo: modo === "guardar" ? EN ? "SAVE GAME" : "GUARDAR PARTIDA" : EN ? "LOAD GAME" : "CARGAR PARTIDA",
    guardar: EN ? "Save" : "Guardar",
    sobrescribir: EN ? "Overwrite" : "Sobrescribir",
    cargar: tc(200) || "Cargar",
    vacio: EN ? "- - -  empty  - - -" : "- - -  vacío  - - -",
    fecha: EN ? "Date" : "Fecha",
    roto: tc(284) || "Los datos están corruptos."
  };
  const ptr = puntero2D(M);
  ptr.reiniciar();
  const img = await pedirFondo();
  const faseAntes = juego.fase;
  juego.fase = modo === "guardar" ? "guardando" : "cargando partida";
  let espacios = leerEspacios();
  const libres = espacios.map((e, i) => e ? -1 : i).filter(i => i >= 0);
  const nuevo = espacios.reduce((m, e, i) => e && !e.roto && (m < 0 || (e.fecha || 0) > (espacios[m].fecha || 0)) ? i : m, -1);
  let el = modo === "guardar" ? libres[0] ?? Math.max(0, nuevo) : Math.max(0, nuevo);
  let etapa = "lista", siNo = 1, aviso = null, t = 0;
  const filas = filasLista(ESPACIOS, {
    x0: RENGLON.x0,
    x1: RENGLON.x1,
    y0: RENGLON.y0,
    paso: RENGLON.paso
  });
  const botonesSiNo = [ {
    x0: 220,
    x1: 310,
    y0: 372,
    y1: 400
  }, {
    x0: 330,
    x1: 420,
    y0: 372,
    y1: 400
  } ];
  const dibujar = () => {
    P.limpiar(g);
    if (img) P.imagen(g, img, 1); else P.imagen(g, juego.I?.opciones, .5);
    fuente.escribir(g, T.titulo, P.W / 2, 30, {
      escala: P.ESC,
      alinear: "centro",
      color: "#f0e4d2"
    });
    espacios.forEach((e, i) => {
      const f = filas[i], sel = i === el;
      if (sel) {
        g.save();
        const gr = g.createLinearGradient(f.x0 * P.ESC, 0, f.x1 * P.ESC, 0);
        gr.addColorStop(0, `rgba(150,28,18,${.55 + .12 * Math.sin(t * 5)})`);
        gr.addColorStop(1, "rgba(90,14,10,0.35)");
        g.fillStyle = gr;
        g.fillRect(f.x0 * P.ESC, (f.y0 + 1) * P.ESC, (f.x1 - f.x0) * P.ESC, (RENGLON.paso - 2) * P.ESC);
        g.restore();
      }
      const y = f.y0 + 2, c = sel ? "#ffffff" : "#d9cebf";
      fuente.escribir(g, dos(i + 1), f.x0 + 14, y, {
        escala: P.ESC,
        color: sel ? "#ffd9c4" : "#b8a898"
      });
      if (!e) fuente.escribir(g, T.vacio, f.x0 + 60, y, {
        escala: P.ESC,
        color: sel ? "#cfc4b4" : "#6f665d"
      }); else if (e.roto) fuente.escribir(g, T.roto, f.x0 + 60, y, {
        escala: P.ESC,
        color: "#a05a4a"
      }); else {
        const lugar = tc(e.lugar) || tc(301), k = Math.min(1, 410 / Math.max(1, fuente.anchoLinea?.(lugar) || 1));
        P.escribirEscalado(g, fuente, lugar, f.x0 + 60, y + (1 - k) * 10, k, {
          color: e.terminada ? sel ? "#f2d58a" : "#c9ad62" : c
        });
        fuente.escribir(g, tiempoJugado(e.tiempo), f.x1 - 10, y, {
          escala: P.ESC,
          color: c,
          alinear: "der"
        });
      }
    });
    const e = espacios[el], yb = 324;
    if (aviso) fuente.escribir(g, aviso.texto, P.W / 2, yb + 26, {
      escala: P.ESC,
      alinear: "centro",
      color: "#f0e4d2"
    }); else if (etapa === "pregunta" || etapa === "salir") {
      const preg = etapa === "salir" ? tc(293) || "Preparado para salir sin guardar la partida.\n¿Desea continuar?" : tc(261) || "¿Desea sobreescribir?";
      fuente.escribir(g, preg, P.W / 2, yb + (etapa === "salir" ? -14 : 10), {
        escala: P.ESC,
        alinear: "centro",
        color: "#f0e4d2",
        interlinea: 22
      });
      [ tc(0) || "Sí", tc(1) || "No" ].forEach((s, i) => {
        const b = botonesSiNo[i], sel = i === siNo;
        if (sel) {
          g.save();
          g.fillStyle = `rgba(150,28,18,${.5 + .12 * Math.sin(t * 5)})`;
          g.fillRect(b.x0 * P.ESC, b.y0 * P.ESC, (b.x1 - b.x0) * P.ESC, (b.y1 - b.y0) * P.ESC);
          g.restore();
        }
        fuente.escribir(g, s, (b.x0 + b.x1) / 2, b.y0 + 4, {
          escala: P.ESC,
          alinear: "centro",
          color: sel ? "#ffffff" : "#a59a8d"
        });
      });
    } else {
      if (!e) fuente.escribir(g, tc(300) || "Sin datos de partida.", P.W / 2, yb + 12, {
        escala: P.ESC,
        alinear: "centro",
        color: "#a59a8d"
      }); else if (!e.roto && e.terminada) {
        const nivel = e.nivel ? tc(293 + e.nivel) : null;
        fuente.escribir(g, `${tc(355) || "Veces guardadas"}: ${e.guardadas ?? 0}` + (nivel ? `     ${tc(353) || "Dificultad"}: ${nivel}` : ""), 40, yb - 6, {
          escala: P.ESC,
          color: "#cfc4b4"
        });
        fuente.escribir(g, tc(286) || "Librar final", 40, yb + 16, {
          escala: P.ESC,
          color: "#f2d58a"
        });
        const fin = e.terminada.finales || [];
        [ [ "A", 157, 38 ], [ "B", 157, 62 ], [ "C", 342, 38 ], [ "D", 342, 62 ] ].forEach(([l, x, dy]) => {
          if (fin.includes(l)) fuente.escribir(g, tc(TEXTO_FINALES[l]), x, yb + dy, {
            escala: P.ESC,
            color: "#e6dccd"
          });
        });
      } else if (!e.roto) {
        const nivel = e.nivel ? tc(293 + e.nivel) : null;
        fuente.escribir(g, `${T.fecha}: ${fechaDe(e.fecha)}`, 60, yb, {
          escala: P.ESC,
          color: "#e6dccd"
        });
        fuente.escribir(g, `${tc(354) || "Tiempo de juego"}: ${tiempoJugado(e.tiempo)}`, 60, yb + 24, {
          escala: P.ESC,
          color: "#e6dccd"
        });
        fuente.escribir(g, `${tc(355) || "Veces guardadas"}: ${e.guardadas ?? 0}` + (nivel ? `     ${tc(353) || "Dificultad"}: ${nivel}` : ""), 60, yb + 48, {
          escala: P.ESC,
          color: "#cfc4b4"
        });
      }
      const accion = modo === "guardar" ? e ? T.sobrescribir : T.guardar : T.cargar;
      fuente.escribir(g, `${tc(173) || "Decidir"}: ${accion}      ${tc(174) || "Volver"}`, P.W / 2, 392, {
        escala: P.ESC,
        alinear: "centro",
        color: "#bdb2a4",
        alfa: .9
      });
    }
    ptr.dibujar(g);
    M.pantalla.actualizar();
  };
  const resultado = await new Promise(ok => {
    const decidir = () => {
      const e = espacios[el];
      if (modo === "cargar") {
        if (!e || e.roto) {
          aviso = {
            texto: e?.roto ? T.roto : tc(300) || "Sin datos de partida.",
            hasta: t + 1.4
          };
          return;
        }
        aviso = {
          texto: tc(266) || "Cargando datos de partida.",
          hasta: t + .8,
          luego: () => ok(e)
        };
        return;
      }
      if (e && !e.roto) {
        etapa = "pregunta";
        siNo = 1;
        return;
      }
      grabar();
    };
    let guardo = false;
    const grabar = () => {
      etapa = "lista";
      aviso = {
        texto: tc(262) || "Guardando...",
        hasta: t + .7,
        luego: () => {
          const bien = guardarEn(el + 1, partida, {
            checkpoint: checkpoint,
            nivel: nivel,
            terminada: terminada
          });
          espacios = leerEspacios();
          if (bien) guardo = true;
          aviso = bien ? {
            texto: tc(264) || "Guardar completado.",
            hasta: t + 1.3,
            luego: () => ok(true)
          } : {
            texto: tc(263) || "Error al guardar.",
            hasta: t + 1.6
          };
        }
      };
    };
    const tarea = (dt, {acciones: acciones}) => {
      t += dt;
      if (aviso) {
        if (t >= aviso.hasta) {
          const f = aviso.luego;
          aviso = null;
          f?.();
        }
        dibujar();
        return true;
      }
      if (etapa === "pregunta" || etapa === "salir") {
        const i = ptr.sobre(botonesSiNo);
        if (i != null) siNo = i;
        const era = etapa;
        for (const a of acciones) {
          if ([ "izq", "der", "arriba", "abajo" ].includes(a)) siNo = 1 - siNo; else if (a === "cancelar") etapa = "lista"; else if (a === "aceptar" || a === "accion" || a === "clic") {
            if (a === "clic") {
              const k = ptr.tocada(botonesSiNo);
              if (k == null) continue;
              siNo = k;
            }
            if (era === "salir") {
              if (siNo === 0) {
                ok(null);
                return true;
              }
              etapa = "lista";
            } else if (siNo === 0) grabar(); else etapa = "lista";
          }
          if (etapa !== era || aviso) break;
        }
      } else {
        const i = ptr.sobre(filas);
        if (i != null) el = i;
        for (const a of acciones) {
          if (a === "arriba" || a === "izq") el = (el + ESPACIOS - 1) % ESPACIOS; else if (a === "abajo" || a === "der") el = (el + 1) % ESPACIOS; else if ((a === "cancelar" || a === "menu") && preguntarSalir && modo === "guardar" && !guardo) {
            etapa = "salir";
            siNo = 1;
            break;
          } else if (a === "cancelar" || a === "menu") {
            M.tareas.delete(tarea);
            ok(null);
            return true;
          } else if (a === "aceptar" || a === "accion" || a === "clic") {
            if (a === "clic") {
              const k = ptr.tocada(filas);
              if (k == null) continue;
              el = k;
            }
            decidir();
            break;
          }
        }
      }
      dibujar();
      return true;
    };
    const okOriginal = ok;
    ok = v => {
      M.tareas.delete(tarea);
      okOriginal(v);
    };
    M.pantalla.mostrar();
    dibujar();
    M.tareas.add(tarea);
  });
  juego.fase = faseAntes;
  return resultado;
}
