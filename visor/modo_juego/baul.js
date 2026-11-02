// SH4 web — FeniXVOID · Project Ravenlight
import * as P from "./pantallas.js";

import { puntero2D, filasLista } from "./menu2d.js";

import { imagenJuego } from "../suite_juego.js";

import { cargarDatos } from "../jugador/datos.js";

export const LUGARES_HENRY = 10, LUGARES_BAUL = 136;

const apilable = k => k >= 1 && k <= 11;

const COL = [ {
  x0: 26,
  x1: 314
}, {
  x0: 326,
  x1: 614
} ], FILA = {
  y0: 82,
  paso: 30,
  n: 10
};

let fondo = null;

const iconos = new Map;

function icono(datos, k) {
  if (iconos.has(k)) return iconos.get(k);
  const r = {
    c: null
  };
  iconos.set(k, r);
  const ic = datos.icono(k);
  if (ic && ic.celda !== 255) {
    const x = ic.celda % 5 * 96, y = Math.floor(ic.celda / 5) * 96;
    imagenJuego("item_l", ic.imagen, [ x, y, 84, 96 ], {
      escalaX: 1
    }).then(c => {
      r.c = c;
    }).catch(() => {});
  }
  return r;
}

export function vistaHenry(PARTIDA, datos) {
  const L = [];
  const sumar = (k, n, dur) => {
    if (!k || datos?.atributo(k) === "nota") return;
    const ya = L.find(l => l.k === k);
    if (ya && apilable(k)) {
      ya.n += n;
      return;
    }
    L.push({
      k: k,
      n: apilable(k) ? n : 1,
      dur: dur ?? null
    });
  };
  for (const [k, n, dur] of PARTIDA.henry?.lugares || []) sumar(k, n, dur);
  for (const k of (PARTIDA.inventario || []).slice(PARTIDA.inventarioVisto || 0)) sumar(k, 1, null);
  return L;
}

export function dejarEnBaul(PARTIDA, datos, l, quitarItem) {
  const B = PARTIDA.baul ||= [];
  const junto = apilable(l.k) ? B.find(b => b[0] === l.k) : null;
  if (!junto && B.length >= LUGARES_BAUL) return 176;
  for (let i = 0; i < l.n; i++) quitarItem(l.k);
  if (junto) junto[1] += l.n; else B.push([ l.k, l.n, l.dur ?? datos?.durabilidad(l.k)?.inicial ?? null ]);
  if (PARTIDA.henry && PARTIDA.henry.arma === l.k) PARTIDA.henry.arma = 0;
  return null;
}

export function sacarDelBaul(PARTIDA, datos, j) {
  const B = PARTIDA.baul ||= [], b = B[j];
  if (!b) return null;
  const L = vistaHenry(PARTIDA, datos);
  const junta = apilable(b[0]) && L.some(l => l.k === b[0]);
  if (!junta && L.length >= LUGARES_HENRY) return 17;
  PARTIDA.inventario ||= [];
  for (let i = 0; i < (apilable(b[0]) ? b[1] : 1); i++) PARTIDA.inventario.push(b[0]);
  B.splice(j, 1);
  return null;
}

export async function abrirBaul({juego: juego, PARTIDA: PARTIDA, quitarItem: quitarItem}) {
  const {M: M, fuente: fuente} = juego;
  const g = M.pantalla.g, tc = juego.textoComun, EN = juego.IDIOMA !== "s";
  const [datos, img] = await Promise.all([ cargarDatos({
    idioma: juego.IDIOMA || "s"
  }), fondo ||= imagenJuego("snap_itembox", 0, [ 0, 0, 512, 448 ]).catch(() => null) ]);
  const ptr = puntero2D(M);
  ptr.reiniciar();
  const faseAntes = juego.fase;
  juego.fase = "baúl";
  let col = 0, fila = 0, desde = 0, t = 0, aviso = null;
  const filas = [ 0, 1 ].map(c => filasLista(FILA.n, {
    x0: COL[c].x0,
    x1: COL[c].x1,
    y0: FILA.y0,
    paso: FILA.paso
  }));
  const todas = [ ...filas[0], ...filas[1] ];
  const nombre = k => datos.nombreItem(k) || "?";
  const T = {
    dejar: EN ? "Store" : "Dejar",
    sacar: EN ? "Take" : "Sacar"
  };
  const dibujar = () => {
    const H = vistaHenry(PARTIDA, datos), B = PARTIDA.baul || [];
    if (col === 1) {
      fila = Math.max(0, Math.min(fila, Math.max(0, B.length - 1)));
      if (fila < desde) desde = fila;
      if (fila >= desde + FILA.n) desde = fila - FILA.n + 1;
    }
    desde = Math.max(0, Math.min(desde, Math.max(0, B.length - FILA.n)));
    P.limpiar(g);
    if (img) P.imagen(g, img, 1);
    g.save();
    g.fillStyle = "rgba(0,0,0,0.42)";
    g.fillRect(0, 0, g.canvas.width, g.canvas.height);
    g.restore();
    [ [ tc(171) || "JUGADOR", `${H.length}/${LUGARES_HENRY}` ], [ tc(170) || "CAJA", `${B.length}/${LUGARES_BAUL}` ] ].forEach(([titulo, cuenta], c) => {
      const C = COL[c];
      g.save();
      g.fillStyle = "rgba(6,4,4,0.72)";
      g.fillRect(C.x0 * P.ESC, 44 * P.ESC, (C.x1 - C.x0) * P.ESC, (FILA.y0 + FILA.n * FILA.paso - 38) * P.ESC);
      g.strokeStyle = c === col ? "rgba(192,60,36,0.9)" : "rgba(122,59,30,0.55)";
      g.lineWidth = 2;
      g.strokeRect(C.x0 * P.ESC, 44 * P.ESC, (C.x1 - C.x0) * P.ESC, (FILA.y0 + FILA.n * FILA.paso - 38) * P.ESC);
      g.restore();
      fuente.escribir(g, titulo, C.x0 + 12, 50, {
        escala: P.ESC,
        color: c === col ? "#f0e4d2" : "#9d9285"
      });
      fuente.escribir(g, cuenta, C.x1 - 12, 50, {
        escala: P.ESC,
        color: "#8f857a",
        alinear: "der"
      });
    });
    for (let c = 0; c < 2; c++) for (let i = 0; i < FILA.n; i++) {
      const f = filas[c][i], idx = c === 0 ? i : desde + i, item = c === 0 ? H[idx] : B[idx] && {
        k: B[idx][0],
        n: B[idx][1]
      };
      const sel = c === col && idx === fila;
      if (sel) {
        g.save();
        g.fillStyle = `rgba(150,28,18,${.5 + .12 * Math.sin(t * 5)})`;
        g.fillRect((f.x0 + 4) * P.ESC, f.y0 * P.ESC, (f.x1 - f.x0 - 8) * P.ESC, (FILA.paso - 2) * P.ESC);
        g.restore();
      }
      if (!item) {
        if (c === 0) fuente.escribir(g, "-", f.x0 + 50, f.y0 + 4, {
          escala: P.ESC,
          color: "#4f4842"
        });
        continue;
      }
      const ic = icono(datos, item.k).c;
      if (ic) g.drawImage(ic, (f.x0 + 10) * P.ESC, (f.y0 + 1) * P.ESC, 24 * P.ESC, 27 * P.ESC);
      const nom = nombre(item.k), k = Math.min(.9, 205 / Math.max(1, fuente.anchoLinea?.(nom) || 1));
      P.escribirEscalado(g, fuente, nom, f.x0 + 42, f.y0 + 5 + (.9 - k) * 10, k, {
        color: sel ? "#ffffff" : "#d6cdbd"
      });
      if (item.n > 1 || datos.atributo(item.k) === "munición") fuente.escribir(g, String(item.n), f.x1 - 10, f.y0 + 4, {
        escala: P.ESC,
        color: sel ? "#ffd9c4" : "#b8a898",
        alinear: "der"
      });
      if (c === 0 && PARTIDA.henry?.arma === item.k) {
        g.save();
        g.fillStyle = "#c0261a";
        g.fillRect((f.x0 + 10) * P.ESC, (f.y0 + FILA.paso - 4) * P.ESC, 24 * P.ESC, 2 * P.ESC);
        g.restore();
      }
    }
    if (col === 1 && B.length > FILA.n) {
      if (desde > 0) fuente.escribir(g, "^", COL[1].x1 - 14, 64, {
        escala: P.ESC,
        color: "#cfc4b4"
      });
      if (desde + FILA.n < B.length) fuente.escribir(g, "v", COL[1].x1 - 14, FILA.y0 + FILA.n * FILA.paso - 6, {
        escala: P.ESC,
        color: "#cfc4b4"
      });
    }
    const texto = aviso ? aviso.texto : `${tc(173) || "Decidir"}: ${col === 0 ? T.dejar : T.sacar}      ${tc(174) || "Volver"}`;
    fuente.escribir(g, texto, P.W / 2, 388, {
      escala: P.ESC,
      alinear: "centro",
      color: aviso ? "#f0e4d2" : "#bdb2a4"
    });
    ptr.dibujar(g);
    M.pantalla.actualizar();
  };
  const pasar = () => {
    const H = vistaHenry(PARTIDA, datos), B = PARTIDA.baul || [];
    let r = null;
    if (col === 0) {
      if (!H[fila]) r = 211; else r = dejarEnBaul(PARTIDA, datos, H[fila], quitarItem);
    } else {
      if (!B[fila]) r = 211; else r = sacarDelBaul(PARTIDA, datos, fila);
    }
    if (r) aviso = {
      texto: tc(r) || "",
      hasta: t + 1.6
    }; else {
      juego.inventario302?.armar?.();
      M.redibujar();
    }
  };
  await new Promise(ok => {
    const tarea = (dt, {acciones: acciones}) => {
      t += dt;
      if (aviso && t >= aviso.hasta) aviso = null;
      const B = PARTIDA.baul || [];
      const max = () => col === 0 ? LUGARES_HENRY : Math.max(1, B.length);
      const dr = ptr.filasArrastradas(FILA.paso);
      if (dr && col === 1) fila = Math.max(0, Math.min(max() - 1, fila + dr));
      const i = ptr.sobre(todas);
      if (i != null) {
        col = i < FILA.n ? 0 : 1;
        fila = col === 0 ? i : desde + (i - FILA.n);
      }
      for (const a of acciones) {
        if (a === "arriba") fila = (fila + max() - 1) % max(); else if (a === "abajo") fila = (fila + 1) % max(); else if (a === "izq" || a === "der") {
          col = a === "izq" ? 0 : 1;
          fila = Math.min(fila, max() - 1);
        } else if (a === "cancelar" || a === "menu") {
          M.tareas.delete(tarea);
          ok();
          return true;
        } else if (a === "aceptar" || a === "accion" || a === "clic") {
          if (a === "clic") {
            const k = ptr.tocada(todas);
            if (k == null) continue;
            col = k < FILA.n ? 0 : 1;
            fila = col === 0 ? k : desde + (k - FILA.n);
          }
          pasar();
        }
      }
      dibujar();
      return true;
    };
    M.pantalla.mostrar();
    dibujar();
    M.tareas.add(tarea);
  });
  M.pantalla.ocultar();
  juego.fase = faseAntes;
}
