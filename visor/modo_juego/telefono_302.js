// SH4 web — FeniXVOID · Project Ravenlight
import * as P from "./pantallas.js";

import { puntero2D } from "./menu2d.js";

import { imagenJuego } from "../suite_juego.js";

import { q } from "./motor.js";

const K = P.W / 512;

const TECLAS = [ [ 246, 263 ], [ 219, 188 ], [ 246, 188 ], [ 272, 188 ], [ 219, 213 ], [ 246, 213 ], [ 272, 213 ], [ 219, 238 ], [ 246, 238 ], [ 272, 238 ], [ 219, 263 ], [ 272, 263 ] ];

const LADO = 20;

const MAX_DIGITOS = 7;

const NUMEROS = {
  viejo: "5553750",
  nuevo: "5554890"
};

const SONIDO = {
  tecla: 50701,
  ruido: 20222,
  grabacion: 20219
};

const TEXTO = {
  fueraServicio: 201,
  numeroNuevo: 202,
  noContestan: 203,
  ruido: 204
};

const TEXTO_DIGITO = d => d === 10 ? 78 : d === 11 ? 79 : 62 + d;

const VEL = 3 * 30;

const MARGEN = 16;

const DUR_SUB = 3;

const SIMBOLO = [ "0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "#" ];

const RECTS = TECLAS.map(([x, y]) => ({
  x0: x * K,
  y0: y,
  x1: (x + LADO) * K,
  y1: y + LADO
}));

const teclaBajo = p => p ? RECTS.findIndex(r => p.x >= r.x0 && p.x < r.x1 && p.y >= r.y0 && p.y < r.y1) : -1;

export function crearTelefono302({M: M, juego: juego, fuente: fuente, F: F, prender: prender, son: son, mostrarSub: mostrarSub, textoRoom: textoRoom}) {
  let img = null;
  const pedirImagen = () => img ||= imagenJuego("snap_dial", 0, [ 0, 0, 512, 448 ]).catch(() => null);
  async function marcar() {
    const faseAntes = juego.fase, mirarAntes = M.control.mirarLibre;
    juego.fase = "telefono";
    juego.hablando = true;
    M.control.mirarLibre = false;
    M.control.soltar?.();
    await M.fundir(1, 1);
    const fondo = await pedirImagen();
    const ptr = puntero2D(M);
    ptr.reiniciar();
    const g = M.pantalla.g, tc = n => juego.textoComun?.(n) || "";
    const st = {
      cur: {
        x: 256 * K,
        y: 224
      },
      digitos: [],
      mostrar: true,
      resaltada: -1,
      hasta: 0,
      t: 0
    };
    const debug = q.has("teclastel");
    juego.telefonoPrueba = {
      st: st,
      RECTS: RECTS
    };
    const dibujar = () => {
      P.limpiar(g);
      if (fondo) P.imagen(g, fondo, 1); else P.imagen(g, juego.I?.opciones, .5);
      if (debug) {
        g.save();
        g.strokeStyle = "rgba(255,0,0,0.8)";
        g.lineWidth = 2;
        for (const r of RECTS) g.strokeRect(r.x0 * P.ESC, r.y0 * P.ESC, (r.x1 - r.x0) * P.ESC, (r.y1 - r.y0) * P.ESC);
        g.restore();
      }
      if (st.resaltada >= 0 && st.t < st.hasta) {
        const r = RECTS[st.resaltada];
        g.save();
        g.fillStyle = "rgba(255,245,220,0.45)";
        g.fillRect(r.x0 * P.ESC, r.y0 * P.ESC, (r.x1 - r.x0) * P.ESC, (r.y1 - r.y0) * P.ESC);
        g.restore();
      }
      if (st.mostrar) st.digitos.forEach((d, i) => fuente.escribir(g, tc(TEXTO_DIGITO(d)) || SIMBOLO[d], (192 + 20 * i) * K, 384, {
        escala: P.ESC,
        color: "#ece3d2"
      }));
      if (M.enVR()) ptr.dibujar(g); else {
        const x = st.cur.x * P.ESC, y = st.cur.y * P.ESC;
        g.save();
        g.fillStyle = "rgba(255,255,255,0.95)";
        g.strokeStyle = "rgba(0,0,0,0.8)";
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x + 16, y + 6);
        g.lineTo(x + 9, y + 8);
        g.lineTo(x + 6, y + 16);
        g.closePath();
        g.fill();
        g.stroke();
        g.restore();
      }
      M.pantalla.actualizar();
    };
    const dibujo = dt => {
      st.t += dt;
      if (st.resaltada >= 0 && st.t >= st.hasta) st.resaltada = -1;
      dibujar();
      return true;
    };
    M.pantalla.mostrar();
    dibujar();
    M.tareas.add(dibujo);
    await M.fundir(0, 1);
    const r = await marcarDigitos(st, ptr);
    let especial = false;
    if (r.numero) {
      const num = r.numero.map(d => SIMBOLO[d]).join("");
      const f949 = F(949);
      let modo = "nadie";
      if (!f949) {
        if (num === NUMEROS.viejo) modo = "ruido";
      } else if (num === NUMEROS.viejo) modo = "grabacion"; else if (num === NUMEROS.nuevo) modo = "ruido";
      especial = num === NUMEROS.viejo;
      juego.telefonoMarcado = {
        numero: num,
        modo: modo
      };
      await responder(modo, st);
      await esperar(.5, true);
    }
    await M.fundir(1, 1);
    M.tareas.delete(dibujo);
    M.pantalla.ocultar();
    mostrarSub("");
    if (especial) {
      if (f949Ahora()) prender(1640); else if (F(1506)) prender(1639);
    }
    juego.hablando = false;
    juego.fase = faseAntes;
    M.control.mirarLibre = mirarAntes;
    await M.fundir(0, 1);
  }
  const f949Ahora = () => F(949);
  function marcarDigitos(st, ptr) {
    return new Promise(ok => {
      let t = 0;
      const pulsar = k => {
        try {
          son()?.efecto(SONIDO.tecla, null, {
            volumen: 1
          });
        } catch {}
        st.resaltada = k;
        st.hasta = st.t + 4 / 30;
        st.digitos.push(k);
        if (st.digitos.length >= MAX_DIGITOS) {
          M.tareas.delete(tarea);
          ok({
            numero: st.digitos.slice()
          });
          return true;
        }
        return false;
      };
      const tarea = (dt, {acciones: acciones, ejes: ejes, teclas: teclas}) => {
        t += dt;
        const p = ptr.posicion();
        if (p?.movido) st.cur = {
          x: p.x,
          y: p.y
        };
        let dx = ejes?.x || 0, dy = ejes?.y || 0;
        if (teclas?.ArrowLeft || teclas?.KeyA) dx -= 1;
        if (teclas?.ArrowRight || teclas?.KeyD) dx += 1;
        if (teclas?.ArrowUp || teclas?.KeyW) dy -= 1;
        if (teclas?.ArrowDown || teclas?.KeyS) dy += 1;
        if (dx || dy) {
          st.cur.x += Math.max(-1, Math.min(1, dx)) * VEL * K * dt;
          st.cur.y += Math.max(-1, Math.min(1, dy)) * VEL * dt;
        }
        st.cur.x = Math.max(MARGEN * K, Math.min((512 - MARGEN) * K, st.cur.x));
        st.cur.y = Math.max(MARGEN, Math.min(P.H - MARGEN, st.cur.y));
        for (const a of acciones) {
          if (a === "cancelar" || a === "menu") {
            M.tareas.delete(tarea);
            ok({
              cancelado: true
            });
            return true;
          }
          if (t < .2) continue;
          if (a === "clic") {
            const k = ptr.tocada(RECTS);
            if (k == null) continue;
            const r = RECTS[k];
            st.cur = {
              x: (r.x0 + r.x1) / 2,
              y: (r.y0 + r.y1) / 2
            };
            if (pulsar(k)) return true;
          } else if (a === "aceptar" || a === "accion") {
            const k = teclaBajo(st.cur);
            if (k >= 0 && pulsar(k)) return true;
          }
        }
        return false;
      };
      M.tareas.add(tarea);
    });
  }
  function esperar(s, boton = false) {
    return new Promise(ok => {
      let t = 0;
      const tarea = (dt, {acciones: acciones}) => {
        t += dt;
        if (t >= s || boton && acciones.some(a => a === "aceptar" || a === "accion" || a === "clic" || a === "cancelar")) {
          M.tareas.delete(tarea);
          ok();
        }
        return false;
      };
      M.tareas.add(tarea);
    });
  }
  const sub = n => mostrarSub(n == null ? "" : textoRoom(n));
  const subDemo = n => {
    if (juego.opciones?.subtitulos !== false) sub(n);
  };
  async function responder(modo, st) {
    if (modo === "nadie") {
      await esperar(1);
      st.mostrar = false;
      sub(TEXTO.noContestan);
      await esperar(DUR_SUB);
      sub(null);
      return;
    }
    if (modo === "ruido") {
      await esperar(.5);
      st.mostrar = false;
      let h = null;
      try {
        h = son()?.efecto(SONIDO.ruido, null, {
          volumen: 1,
          loop: true
        });
      } catch {}
      await esperar(15);
      try {
        h?.parar(.3);
      } catch {}
      await esperar(.5);
      sub(TEXTO.ruido);
      await esperar(DUR_SUB);
      sub(null);
      return;
    }
    await esperar(.5);
    st.mostrar = false;
    let h = null;
    try {
      h = son()?.efecto(SONIDO.grabacion, null, {
        volumen: 1,
        loop: false
      });
    } catch {}
    await esperar(3);
    subDemo(TEXTO.fueraServicio);
    await esperar(4);
    subDemo(TEXTO.numeroNuevo);
    await esperar(7);
    sub(null);
    try {
      h?.parar(.3);
    } catch {}
    await esperar(.5);
  }
  return {
    marcar: marcar,
    RECTS: RECTS,
    NUMEROS: NUMEROS
  };
}
