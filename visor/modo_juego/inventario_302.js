// SH4 web — FeniXVOID · Project Ravenlight
import { cargarDatos, ITEM } from "../jugador/datos.js";

import { crearInventario } from "../jugador/inventario.js";

const VIDA_302 = {
  bebida: 30,
  ampolla: 50,
  botiquin: [ .6, 35 ]
};

const MEDALLON = 8;

export async function crearInventario302(ctx) {
  const {THREE: THREE, M: M, juego: juego, PARTIDA: PARTIDA} = ctx;
  const datos = await cargarDatos({
    idioma: juego.IDIOMA || "s"
  });
  const henryP = () => PARTIDA.henry ||= {
    lugares: [],
    notas: [],
    vida: 100
  };
  const s = {
    arma: 0,
    vida: 100,
    vidaMax: 100,
    balas: 0,
    muerto: false,
    dificultad: "normal"
  };
  const curar = n => {
    s.vida = Math.min(s.vidaMax, s.vida + n);
    henryP().vida = s.vida;
  };
  const ctl = {
    s: s,
    ponerMunicion() {},
    alGastarArma() {},
    usarCuracion(k) {
      if (k === ITEM.BEBIDA) curar(VIDA_302.bebida); else if (k === ITEM.AMPOLLA) curar(VIDA_302.ampolla); else if (k === ITEM.BOTIQUIN) curar(Math.max((s.vidaMax - s.vida) * VIDA_302.botiquin[0], VIDA_302.botiquin[1])); else return false;
      return true;
    }
  };
  const armas = {
    equipar: async () => {}
  };
  let inv = null;
  function alUsar(k) {
    const e = ctx.eventoDeItem(k);
    if (e) {
      inv.cerrar();
      setTimeout(() => ctx.usarEvento(e, k), 0);
      return "evento";
    }
    const H = ctx.hauntings?.();
    if (k === ITEM.VELA && H?.usarVela) {
      inv.cerrar();
      setTimeout(() => ctx.usarEvento(null, k, () => H.usarVela()), 0);
      return "evento";
    }
    if (k === MEDALLON && H?.H) {
      H.H.medallon = !H.H.medallon;
      inv.mensaje("");
      return "silencio";
    }
    if (datos.atributo(k) === "curación") {
      if (ctl.usarCuracion(k)) {
        ctx.quitarItem(k);
        armar();
      }
      return "usado";
    }
    if (datos.esArma(k)) return "silencio";
    return "nada";
  }
  inv = crearInventario({
    datos: datos,
    controlador: ctl,
    armas: armas,
    teclasAbrir: [],
    THREE: THREE,
    alUsar: alUsar
  });
  function armar() {
    const P = henryP();
    inv.lugares.length = 0;
    inv.notas.length = 0;
    for (const [k, n, dur] of P.lugares || []) {
      inv.agregar(k, n);
      const l = inv.lugares.find(x => x.k === k);
      if (l && dur != null) l.dur = dur;
    }
    for (const k of P.notas || []) inv.agregar(k, 1);
    for (const k of (PARTIDA.inventario || []).slice(PARTIDA.inventarioVisto || 0)) inv.agregar(k, 1);
    s.vida = P.vida ?? 100;
    s.arma = P.arma || 0;
    inv.seleccionar(inv.sel);
  }
  inv.alAbrir(si => {
    if (si) armar();
  });
  addEventListener("keydown", ev => {
    if (inv.abierto && ev.code === "KeyI") {
      inv.cerrar();
      iAntes = true;
    }
  }, true);
  let vr = null;
  if (M.renderer?.xr) {
    try {
      const {crearInventarioVR: crearInventarioVR} = await (import("../jugador/inventario_vr.js"));
      vr = crearInventarioVR({
        THREE: THREE,
        renderer: M.renderer,
        camara: M.camara,
        inventario: inv,
        datos: datos,
        controlador: ctl,
        conPalma: false
      });
    } catch (e) {
      console.warn("inventario del casco en el 302", e.message);
    }
  }
  let boton = null, botonPedido = false;
  if (M.tactil) {
    boton = document.createElement("button");
    boton.textContent = juego.IDIOMA !== "s" ? "ITEMS" : "OBJETOS";
    boton.id = "botonInventario302";
    boton.style.cssText = 'position:fixed;top:14px;right:16px;z-index:31;padding:10px 14px;border-radius:22px;border:1px solid rgba(236,227,210,.5);background:rgba(20,12,10,.55);color:#ece3d2;font:13px "Cormorant Garamond",Georgia,serif;letter-spacing:.08em;display:none';
    boton.addEventListener("touchstart", ev => {
      ev.preventDefault();
      botonPedido = true;
    }, {
      passive: false
    });
    boton.addEventListener("click", () => {
      botonPedido = true;
    });
    document.body.appendChild(boton);
  }
  let iAntes = false;
  function cuadro(dt, entrada, libre) {
    const enVR = M.enVR();
    vr?.actualizar(dt, enVR && (libre || inv.abierto));
    if (boton) boton.style.display = libre && !inv.abierto ? "" : "none";
    const i = !!entrada?.teclas?.KeyI, pideI = i && !iAntes;
    iAntes = i;
    const acciones = entrada?.acciones || [];
    if (!inv.abierto) {
      const pide = pideI || botonPedido || !enVR && acciones.includes("cancelar");
      botonPedido = false;
      if (pide && libre) {
        inv.abrir();
        return true;
      }
      return false;
    }
    botonPedido = false;
    if (pideI) {
      inv.cerrar();
      return true;
    }
    for (const a of acciones) {
      if (a === "izq") inv.mover(-1); else if (a === "der") inv.mover(1); else if (a === "arriba") inv.alternarInfo(); else if (a === "abajo") {
        if (inv.info) inv.alternarInfo(false);
      } else if ((a === "aceptar" || a === "accion") && !enVR) inv.usarSeleccionado(); else if (a === "cancelar" && !enVR) inv.volver(); else if (a === "menu") inv.cerrar();
    }
    return true;
  }
  return {
    inv: inv,
    cuadro: cuadro,
    abrir: () => inv.abrir(),
    cerrar: () => inv.cerrar(),
    get abierto() {
      return inv.abierto;
    },
    boton: boton,
    armar: armar
  };
}
