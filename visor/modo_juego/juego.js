// SH4 web — FeniXVOID · Project Ravenlight
import { crearMotor, bajar, json, q } from "./motor.js";

import { cargarFuente, leerMensajes } from "./fuente.js";

import * as P from "./pantallas.js";

import { abrirVideo } from "./video.js";

import { pintarConFuente, vigilarBoton } from "./textos_dom.js";

import { crearMusica, TEMA_TITULO } from "./musica_juego.js";

import { leerOpciones, guardarOpciones, enlazarCine } from "../opciones_sitio.js";

import { casco as cascoComun } from "../jugador/casco_comun.js";

import { imagenJuego } from "../suite_juego.js";

import { puntero2D } from "./menu2d.js";

import { migrar, hayGuardados, continuarDesde, pantallaGuardado } from "./guardado.js";

import { prepararCelular } from "./celular.js";

import { idiomaActual, fijarIdioma, t, nombreIdioma, IDS_IDIOMAS, PARTE_COMUN } from "../textos_sitio.js";

import { iniciarModoFoto } from "./modo_foto.js";

import { aplicarBrillo } from "../lib/brillo.js";

const PEDIDOS = [];

{
  const fetchOriginal = window.fetch.bind(window);
  window.fetch = (url, op) => {
    try {
      const u = new URL(typeof url === "string" ? url : url.url, location.href);
      if (u.origin === location.origin && u.pathname.startsWith("/juego/")) {
        const h = op?.headers, rango = h ? h instanceof Headers ? h.get("Range") : h.Range || h.range : null;
        PEDIDOS.push({
          ruta: decodeURIComponent(u.pathname.slice(6)),
          rango: (op?.method === "HEAD" ? null : rango) || null,
          ...op?.method === "HEAD" ? {
            head: true
          } : {}
        });
      }
    } catch {}
    return fetchOriginal(url, op);
  };
}

const $ = id => document.getElementById(id);

let fuenteDom = null;

const estado = t => {
  if (fuenteDom) pintarConFuente($("estado"), fuenteDom, t, {
    px: .6
  }); else $("estado").textContent = t;
  if (q.has("quieto")) console.log("[juego]", t.split("\n")[0]);
};

const M = crearMotor();

const {pantalla: pantalla} = M;

const g = pantalla.g;

const juego = window.sh4juego = {
  M: M,
  fase: "cargando",
  P: P,
  pedidos: PEDIDOS
};

prepararCelular(M);

juego.modoFoto = iniciarModoFoto({
  M: M,
  juego: juego
});

migrar();

if (q.has("limpio")) for (const id of [ "ayuda", "volver", "estado", "VRButton" ]) $(id)?.classList.add("oculto");

estado(t("juego.cargando"));

pantalla.mostrar();

P.limpiar(g);

pantalla.actualizar();

juego.IDIOMA = idiomaActual();

function imagenes2D() {
  const im = async (...a) => {
    try {
      return await imagenJuego(...a);
    } catch (e) {
      console.warn(e.message);
      return null;
    }
  };
  const ARCHIVOS = {
    snap_title: [ [ "titulo", 0, [ 0, 0, 512, 448 ] ], [ "logo", 1, [ 0, 88, 512, 120 ], {
      modo: "alfa",
      escalaX: 1
    } ], [ "copy", 1, [ 87, 414, 334, 17 ], {
      modo: "alfa"
    } ], [ "niebla", 1, [ 0, 448, 380, 64 ], {
      modo: "alfa"
    } ], [ "cursores", 1, [ 380, 448, 132, 64 ], {
      modo: "alfa",
      escalaX: 1
    } ] ],
    snap_opening: [ [ "konami", 0, [ 0, 0, 512, 512 ], {
      escalaX: 1
    } ], [ "kcet", 1, [ 0, 0, 512, 512 ], {
      escalaX: 1
    } ], [ "kcet2", 2, [ 0, 0, 512, 512 ], {
      escalaX: 1
    } ], [ "carne", 3, [ 0, 0, 512, 448 ] ] ],
    snap_option: [ [ "opciones", 0, [ 0, 0, 512, 448 ] ] ],
    snap_gameover: [ [ "gameover", 0, [ 0, 0, 512, 448 ] ] ]
  };
  const listas = {}, pedidos = new Map, I = {};
  const pedir = a => {
    if (!pedidos.has(a)) pedidos.set(a, Promise.all(ARCHIVOS[a].map(([k, ...r]) => im(a, ...r).then(c => {
      listas[k] = c;
    }))));
    return pedidos.get(a);
  };
  for (const [a, l] of Object.entries(ARCHIVOS)) for (const [k] of l) {
    Object.defineProperty(I, k, {
      enumerable: true,
      get() {
        if (!(k in listas)) pedir(a);
        return listas[k] ?? null;
      }
    });
  }
  Object.defineProperty(I, "esperar", {
    value: (...ks) => Promise.all(ks.map(k => pedir(Object.keys(ARCHIVOS).find(a => ARCHIVOS[a].some(([x]) => x === k)))))
  });
  return pedir("snap_title").then(() => I);
}

const [fuente, I, comun] = await Promise.all([ cargarFuente(bajar), imagenes2D(), bajar("data/message_common_eu.bin").then(leerMensajes) ]).catch(e => {
  estado("No se pudo cargar el juego (" + (e?.message || e) + "). Recargá la página.");
  throw e;
});

const textoComun = n => comun[PARTE_COMUN[juego.IDIOMA]]?.[n] ?? comun[PARTE_COMUN.b]?.[n] ?? "";

const textoDe = (parte, n) => comun[parte]?.[n] ?? "";

juego.fuente = fuente;

juego.I = I;

juego.textoComun = textoComun;

juego.textoDe = textoDe;

fuenteDom = fuente;

function pintarTextosPagina() {
  const ay = $("ayuda");
  if (ay) pintarConFuente(ay, fuente, t("juego.ayuda").replace(/ · /g, "\n"), {
    px: .6
  });
  const vo = $("volver");
  if (vo) pintarConFuente(vo, fuente, t("juego.suite").toUpperCase(), {
    px: .65
  });
  for (const b of document.querySelectorAll("#botonesTactil button")) {
    const k = "boton." + b.dataset.b, txt = t(k) !== k ? t(k) : b.textContent.trim() || b.getAttribute("aria-label") || "";
    pintarConFuente(b, fuente, txt, {
      px: .6,
      alinear: "centro"
    });
  }
}

pintarTextosPagina();

vigilarBoton($("VRButton"), fuente, {
  px: .65
});

{
  const e0 = $("estado").textContent;
  if (e0) {
    $("estado").textContent = "";
    estado(e0);
  }
}

addEventListener("sh4idioma", e => {
  juego.IDIOMA = e.detail;
  document.documentElement.lang = e.detail === "s" ? "es" : "en";
  pintarTextosPagina();
});

document.documentElement.lang = juego.IDIOMA === "s" ? "es" : "en";

const DATOS = await json("./datos_302.json") || {};

juego.DATOS = DATOS;

function tarea(fn) {
  M.tareas.add(fn);
  return () => M.tareas.delete(fn);
}

function esperar(seg, saltable = true) {
  return new Promise(ok => {
    let t = 0;
    const fin = tarea((dt, {acciones: acciones}) => {
      t += dt;
      if (saltable && acciones.some(a => a === "aceptar" || a === "cancelar" || a === "clic")) {
        fin();
        ok(true);
        return;
      }
      if (t >= seg) {
        fin();
        ok(false);
      }
    });
  });
}

function animar(seg, dibujo, saltable = true) {
  return new Promise(ok => {
    let t = 0;
    const fin = tarea((dt, {acciones: acciones}) => {
      t += dt;
      const k = Math.min(1, t / seg);
      dibujo(k, t);
      pantalla.actualizar();
      if (saltable && acciones.some(a => a === "aceptar" || a === "cancelar" || a === "clic")) {
        fin();
        ok(true);
        return;
      }
      if (k >= 1) {
        fin();
        ok(false);
      }
      return true;
    });
  });
}

async function pantallaInicio() {
  if (q.has("auto") || q.has("quieto")) return;
  juego.fase = "inicio";
  if (![ "intro", "video", "302" ].includes(q.get("ir"))) musica.tocar(TEMA_TITULO, {
    siNoSuena: true
  });
  await new Promise(ok => {
    let t0 = 0;
    const fin = tarea((dt, {acciones: acciones}) => {
      t0 += dt;
      P.dibujarTitulo(g, I, fuente, textoComun, {
        t: t0,
        opciones: [],
        alfa: Math.min(1, t0 / 1.5)
      });
      fuente.escribir(g, t(M.tactil ? "juego.tocar" : "juego.clic"), P.W / 2, 262, {
        escala: P.ESC,
        alinear: "centro",
        alfa: .55 + .35 * Math.sin(t0 * 3),
        color: "#d8cfc2"
      });
      fuente.escribir(g, t("juego.casco"), P.W / 2, 292, {
        escala: P.ESC,
        alinear: "centro",
        color: "#7a7067"
      });
      fuente.escribir(g, "FeniXVOID  ·  Project Ravenlight", P.W / 2, 388, {
        escala: P.ESC,
        alinear: "centro",
        color: "#5a524a"
      });
      pantalla.actualizar();
      if (acciones.some(a => a === "aceptar" || a === "clic" || a === "accion")) {
        fin();
        ok();
      }
      return true;
    });
  });
  M.contextoAudio();
}

async function logos() {
  juego.fase = "logos";
  await I.esperar("konami", "carne");
  const T = DATOS.arranque?.tiempos_logo || {};
  const entra = T.fundido_entrada_s ?? 1, queda = T.espera_s ?? 2, sale = T.fundido_salida_s ?? 1;
  for (const im of [ I.konami, I.kcet2 ]) {
    if (!im) continue;
    await animar(entra, k => P.dibujarLogo(g, im, k), false);
    await animar(queda, () => P.dibujarLogo(g, im, 1), false);
    await animar(sale, k => P.dibujarLogo(g, im, 1 - k), false);
  }
  const adv = textoComun(P.MSG.advertencia);
  if (adv) {
    if (!await animar(entra, k => P.dibujarAdvertencia(g, I, fuente, adv, k))) await animar(queda, () => P.dibujarAdvertencia(g, I, fuente, adv, 1));
    await animar(sale, k => P.dibujarAdvertencia(g, I, fuente, adv, 1 - k), false);
  }
}

export async function reproducirVideo(n, {saltable: saltable = true, maxSeg: maxSeg = null} = {}) {
  const faseAntes = juego.fase, faseVideo = "video " + n;
  const volverFase = () => {
    if (juego.fase === faseVideo) juego.fase = faseAntes;
  };
  juego.fase = faseVideo;
  const nombre = "m_" + String(n).padStart(2, "0") + ".pac";
  estado("video " + nombre + "…");
  let v;
  try {
    v = await abrirVideo({
      THREE: M.THREE,
      url: "/juego/movie/" + nombre,
      audio: M.contextoAudio()
    });
  } catch (e) {
    estado("no se pudo abrir el video: " + e.message);
    console.warn(e);
    volverFase();
    return;
  }
  juego.video = v;
  g.clearRect(0, 0, g.canvas.width, g.canvas.height);
  pantalla.actualizar();
  pantalla.mostrar(v.material);
  await new Promise(ok => {
    let tPared = 0;
    const fin = tarea((dt, {acciones: acciones}) => {
      const cambio = v.actualizar();
      tPared += dt;
      if (saltable && acciones.some(a => a === "aceptar" || a === "cancelar" || a === "clic")) {
        v.parar();
      }
      if (maxSeg && tPared > maxSeg + 3) v.parar();
      if (v.terminado) {
        fin();
        ok();
      }
      return cambio;
    });
  });
  juego.video = null;
  volverFase();
  estado("");
  pantalla.mostrar();
  P.limpiar(g);
  pantalla.actualizar();
}

async function titulo() {
  musica.tocar(TEMA_TITULO, {
    siNoSuena: true
  });
  try {
    return await menuTitulo();
  } finally {
    musica.parar(2);
  }
}

async function menuTitulo() {
  juego.fase = "titulo";
  estado("");
  const hayPartida = hayGuardados();
  const opciones = [ {
    n: P.MSG.nueva
  }, {
    n: P.MSG.continuar,
    deshabilitado: !continuarDesde()
  }, {
    n: P.MSG.cargar,
    deshabilitado: !hayPartida
  }, {
    n: "capitulo",
    t: t("juego.capitulo")
  }, {
    n: P.MSG.opciones
  }, {
    n: 48
  } ];
  const ptr = puntero2D(M);
  ptr.reiniciar();
  const filasMenu = lista => lista.map((_, i) => ({
    x0: 170,
    x1: 470,
    y0: P.TITULO.menu.y + i * P.TITULO.menu.paso - 3,
    y1: P.TITULO.menu.y + (i + 1) * P.TITULO.menu.paso - 3
  }));
  let elegido = 0, tt = 0, quieto = 0;
  const ESPERA_VIDEO = DATOS.arranque?.titulo_quieto?.segundos ?? 60;
  await animar(2.1, k => P.dibujarTitulo(g, I, fuente, textoComun, {
    t: tt += 1 / 60,
    opciones: opciones,
    elegido: elegido,
    alfa: k,
    alfaMenu: k
  }));
  const mover = d => {
    do {
      elegido = (elegido + opciones.length + d) % opciones.length;
    } while (opciones[elegido].deshabilitado);
  };
  for (;;) {
    const r = await new Promise(ok => {
      const fin = tarea((dt, {acciones: acciones}) => {
        tt += dt;
        quieto += dt;
        const fm = filasMenu(opciones), s = ptr.sobre(fm);
        if (s != null && !opciones[s].deshabilitado) {
          elegido = s;
          quieto = 0;
        }
        for (const a of acciones) {
          quieto = 0;
          if (a === "arriba") mover(-1);
          if (a === "abajo") mover(1);
          if (a === "clic") {
            const k = ptr.tocada(fm);
            if (k == null || opciones[k].deshabilitado) continue;
            elegido = k;
          }
          if (a === "aceptar" || a === "accion" || a === "clic") {
            fin();
            ok(opciones[elegido].n);
            return;
          }
        }
        if (quieto > ESPERA_VIDEO) {
          fin();
          ok("video");
          return;
        }
        P.dibujarTitulo(g, I, fuente, textoComun, {
          t: tt,
          opciones: opciones,
          elegido: elegido
        });
        ptr.dibujar(g);
        pantalla.actualizar();
        return true;
      });
    });
    if (r === 48) {
      await mensajeTitulo(t("juego.salir"));
      continue;
    }
    if (r !== P.MSG.nueva) return r;
    const nivel = await elegirEnTitulo([ {
      n: 75
    }, {
      n: 76
    }, {
      n: 77
    } ], 1);
    if (nivel != null) {
      juego.nivel = nivel + 1;
      return P.MSG.nueva;
    }
  }
}

async function elegirEnTitulo(filas, inicial = 0) {
  const ptr = puntero2D(M);
  const filasMenu = lista => lista.map((_, i) => ({
    x0: 170,
    x1: 470,
    y0: P.TITULO.menu.y + i * P.TITULO.menu.paso - 3,
    y1: P.TITULO.menu.y + (i + 1) * P.TITULO.menu.paso - 3
  }));
  let el = inicial, tt = 0, n = filas.length;
  return new Promise(ok => {
    const fin = tarea((dt, {acciones: acciones}) => {
      tt += dt;
      const fm = filasMenu(filas), s = ptr.sobre(fm);
      if (s != null) el = s;
      for (const a of acciones) {
        if (a === "arriba") el = (el + n - 1) % n;
        if (a === "abajo") el = (el + 1) % n;
        if (a === "cancelar") {
          fin();
          ok(null);
          return;
        }
        if (a === "clic") {
          const k = ptr.tocada(fm);
          if (k == null) continue;
          el = k;
        }
        if (a === "aceptar" || a === "accion" || a === "clic") {
          fin();
          ok(el);
          return;
        }
      }
      P.dibujarTitulo(g, I, fuente, textoComun, {
        t: tt,
        opciones: filas,
        elegido: el
      });
      ptr.dibujar(g);
      pantalla.actualizar();
      return true;
    });
  });
}

async function terrorNuevo(e) {
  const nivel = await elegirEnTitulo([ {
    n: 294
  }, {
    n: 295
  }, {
    n: 296
  } ], 1);
  if (nivel == null) return false;
  let vestido = false;
  if (e.terminada?.vestido) {
    const v = await elegirEnTitulo([ {
      n: 202
    }, {
      n: 203
    } ], 0);
    if (v == null) return false;
    vestido = v === 0;
  }
  juego.nivel = nivel + 1;
  juego.terrorNuevo = {
    ...e.terminada,
    nivelAnterior: e.nivel ?? null,
    vestidoEileen: vestido,
    guardadas: e.guardadas || 0
  };
  await empezarPartida("nueva");
  return true;
}

const OPC = leerOpciones();

juego.opciones = OPC;

const DEL_AJUSTE = [ "posturaVR", "alturaVR", "escalaVR", "cuerpoVRListo", "cineVR", "cine1ra", "cineVRcine" ];

addEventListener("sh4opciones", e => {
  const o = e.detail;
  if (o && o !== OPC) for (const k of DEL_AJUSTE) if (k in o) OPC[k] = o[k];
});

function guardarOPC() {
  try {
    const v = localStorage.getItem("sh4vistaMundo");
    if (v === "1ra" || v === "3ra") OPC.vista = v;
  } catch {}
  guardarOpciones(OPC);
}

const musica = juego.musica = crearMusica({
  M: M
});

musica.volumen(OPC.volMus);

{
  const previo = juego.alCambiarOpciones;
  juego.alCambiarOpciones = o => {
    previo?.(o);
    musica.volumen(o.volMus);
    aplicarBrillo(o.brillo);
  };
}

const VALORES_CASCO = {
  giroVR: [ "saltos", "suave" ],
  vinetaVR: [ 0, 1, 2 ],
  posturaVR: [ "parado", "sentado" ],
  manoVR: [ "der", "izq" ],
  escalaVR: [ "propia", "henry" ],
  cineVR: [ "pantalla", "adentro", "ojos" ]
};

function ayudaIdioma() {
  const id = juego.IDIOMA;
  const delJuego = id === "j" ? t("idioma.ay.j").split("\n")[0] : textoDe(PARTE_COMUN[id], 97) || t("idioma.ay");
  if (juego.enPartida) return delJuego + "\n" + t("idioma.ay.partida");
  if (id === "j") return t("idioma.ay.j");
  return id === "s" || id === "e" || id === "b" ? delJuego : t("idioma.ay.otro", delJuego);
}

async function opciones() {
  juego.fase = "opciones";
  await I.esperar("opciones");
  const T = P.MSG.op;
  try {
    const v = localStorage.getItem("sh4vistaMundo");
    if (v === "1ra" || v === "3ra") OPC.vista = v;
  } catch {}
  const siNo = v => textoComun(v ? T.on : T.off);
  const enumerada = id => {
    const lista = VALORES_CASCO[id], i = Math.max(0, lista.indexOf(OPC[id])), v = lista[i];
    const valor = id === "vinetaVR" && !v ? textoComun(T.off) : t(`op.${id}.v.${v}`);
    return {
      id: id,
      nombre: t("op." + id),
      valor: valor,
      ayuda: t(`op.${id}.ay`),
      lista: lista
    };
  };
  const paginas = {
    juego: () => [ {
      id: "brillo",
      nombre: textoComun(T.brillo),
      valor: String(OPC.brillo),
      ayuda: T.ayudaBrillo,
      n: [ 0, 10 ]
    }, {
      id: "subtitulos",
      nombre: textoComun(T.subtitulos),
      valor: siNo(OPC.subtitulos),
      ayuda: OPC.subtitulos ? T.ayudaSubOn : T.ayudaSubOff
    }, {
      id: "idioma",
      nombre: textoComun(T.idioma) || t("idioma"),
      valor: nombreIdioma(juego.IDIOMA, textoDe),
      ayuda: ayudaIdioma()
    }, {
      id: "volMus",
      nombre: textoComun(T.volMus),
      valor: String(OPC.volMus),
      ayuda: T.ayudaVolMus,
      n: [ 0, 10 ]
    }, {
      id: "volEfe",
      nombre: textoComun(T.volEfe),
      valor: String(OPC.volEfe),
      ayuda: T.ayudaVolEfe,
      n: [ 0, 10 ]
    }, {
      id: "sangre",
      nombre: textoComun(T.sangre),
      valor: textoComun([ T.rojo, T.verde, T.morado ][OPC.sangre]),
      ayuda: T.ayudaSangre[OPC.sangre]
    }, {
      id: "ruido",
      nombre: textoComun(T.ruido),
      valor: OPC.ruido ? String(OPC.ruido) : textoComun(T.off),
      ayuda: OPC.ruido ? T.ayudaRuidoOn : T.ayudaRuidoOff,
      n: [ 0, 10 ]
    }, {
      id: "cine1ra",
      nombre: t("op.cine1ra"),
      valor: t("op.cine1ra.v." + !!OPC.cine1ra),
      ayuda: t("op.cine1ra.ay")
    }, {
      id: "apuntar",
      nombre: t("op.apuntar"),
      lista: [ "completa", "mira", "nada" ],
      valor: t("op.apuntar.v." + (OPC.apuntar || "completa")),
      ayuda: t("op.apuntar.ay")
    }, {
      id: "niebla",
      nombre: t("op.niebla"),
      valor: OPC.niebla ? String(OPC.niebla) : textoComun(T.off),
      n: [ 0, 10 ],
      ayuda: t("op.niebla.ay")
    }, {
      id: "brilloPersonajes",
      nombre: t("op.brilloPersonajes"),
      valor: String(OPC.brilloPersonajes ?? 5),
      n: [ 0, 10 ],
      ayuda: t("op.brilloPersonajes.ay")
    }, {
      id: "sombrasPersonajes",
      nombre: t("op.sombrasPersonajes"),
      lista: [ "siempre", "juego", "no" ],
      valor: t("op.sombrasPersonajes.v." + (OPC.sombrasPersonajes || "siempre")),
      ayuda: t("op.sombrasPersonajes.ay")
    }, {
      id: "vista",
      nombre: t("op.vistaMundos"),
      lista: [ "3ra", "1ra" ],
      valor: t("op.vista.v." + (OPC.vista === "1ra" ? "1ra" : "3ra")),
      ayuda: t("op.vistaMundos.ay")
    }, {
      id: "camara",
      nombre: t("op.camara"),
      valor: ">",
      ayuda: t("op.camara.ay")
    }, {
      id: "casco",
      nombre: t("op.casco"),
      valor: ">",
      ayuda: t("op.casco.ay")
    }, {
      id: "salir",
      nombre: textoComun(T.salir) || t("op.salir"),
      valor: null
    } ],
    casco: () => [ {
      id: "henryVR",
      nombre: t("op.henryVR"),
      valor: siNo(OPC.henryVR),
      ayuda: t("op.henryVR.ay2")
    }, {
      id: "vistaCineVR",
      nombre: t("op.vistaCineVR"),
      valor: siNo(OPC.vistaCineVR),
      ayuda: t("op.vistaCineVR.ay2")
    }, enumerada("giroVR"), enumerada("vinetaVR"), enumerada("posturaVR"), enumerada("escalaVR"), enumerada("cineVR"), enumerada("manoVR"), {
      id: "ajustarCuerpo",
      nombre: t("op.ajustarCuerpo"),
      valor: null,
      ayuda: t("op.ajustarCuerpo.ay")
    }, {
      id: "cuerpoVR",
      nombre: t("op.cuerpoVR"),
      valor: siNo(OPC.cuerpoVR !== false),
      ayuda: t("op.cuerpoVR.ay")
    }, {
      id: "volver",
      nombre: textoComun(174) || t("op.volver"),
      valor: null
    } ],
    camara: () => [ {
      id: "camTipo",
      cam: true,
      nombre: t("op.camTipo"),
      lista: [ "juego", "hombro", "libre" ],
      valor: t("op.camTipo.v." + (OPC.camTipo || "juego")),
      ayuda: t("op.camTipo.ay." + (OPC.camTipo || "juego"))
    }, {
      id: "camSuavizado",
      cam: true,
      nombre: t("op.camSuavizado"),
      valor: String(OPC.camSuavizado ?? 3),
      n: [ 0, 10 ],
      ayuda: t("op.camSuavizado.ay")
    }, {
      id: "camGiro",
      cam: true,
      nombre: t("op.camGiro"),
      valor: String(OPC.camGiro ?? 5),
      n: [ 0, 10 ],
      ayuda: t("op.camGiro.ay")
    }, {
      id: "camDistancia",
      cam: true,
      nombre: t("op.camDistancia"),
      valor: String(OPC.camDistancia ?? 5),
      n: [ 1, 10 ],
      ayuda: t("op.camDistancia.ay")
    }, {
      id: "volver",
      nombre: textoComun(174) || t("op.volver"),
      valor: null
    } ]
  };
  let pagina = "juego", el = 0, t0 = 0;
  await new Promise(ok => {
    const fin = tarea((dt, {acciones: acciones}) => {
      t0 += dt;
      let F = paginas[pagina]();
      for (const a of acciones) {
        if (a === "arriba") el = (el + F.length - 1) % F.length;
        if (a === "abajo") el = (el + 1) % F.length;
        const f = F[el], decide = a === "aceptar" || a === "accion";
        if ((f.id === "casco" || f.id === "camara") && (decide || a === "der")) {
          pagina = f.id;
          el = 0;
          F = paginas[pagina]();
          continue;
        }
        if (pagina !== "juego" && (a === "cancelar" || decide && f.id === "volver")) {
          const de = pagina;
          pagina = "juego";
          F = paginas.juego();
          el = F.findIndex(x => x.id === de);
          continue;
        }
        if (f.id === "ajustarCuerpo") {
          if (decide && M.renderer.xr.isPresenting) cascoComun.ajusteCuerpo?.ajustar();
          continue;
        }
        if (f.id === "idioma" && (a === "izq" || a === "der" || decide)) {
          const d = a === "izq" ? -1 : 1, i = Math.max(0, IDS_IDIOMAS.indexOf(juego.IDIOMA));
          OPC.idioma = IDS_IDIOMAS[(i + IDS_IDIOMAS.length + d) % IDS_IDIOMAS.length];
          guardarOPC();
          fijarIdioma(OPC.idioma);
          F = paginas[pagina]();
          continue;
        }
        if (f.id !== "casco" && f.id !== "camara" && f.id !== "volver" && (a === "izq" || a === "der" || decide && f.id !== "salir")) {
          const d = a === "izq" ? -1 : 1;
          if (f.n) OPC[f.id] = Math.max(f.n[0], Math.min(f.n[1], (OPC[f.id] ?? f.n[0]) + d)); else if (f.lista) {
            const i = Math.max(0, f.lista.indexOf(OPC[f.id]));
            OPC[f.id] = f.lista[(i + f.lista.length + d) % f.lista.length];
          } else if (f.id === "sangre") OPC.sangre = (OPC.sangre + 3 + d) % 3; else if (typeof OPC[f.id] === "boolean") OPC[f.id] = !OPC[f.id];
          if (f.id === "cine1ra" || f.id === "cineVR") {
            enlazarCine(OPC, f.id);
            guardarOPC();
          }
          juego.alCambiarOpciones?.(OPC);
          if (f.id === "vista") {
            try {
              localStorage.setItem("sh4vistaMundo", OPC.vista);
            } catch {}
          }
          if (f.lista || f.cam) guardarOPC();
          F = paginas[pagina]();
        }
        if (pagina === "juego" && (a === "cancelar" || decide && f.id === "salir")) {
          fin();
          ok();
          return;
        }
      }
      const ay = F[el].ayuda;
      P.dibujarOpciones(g, I, fuente, textoComun, F, el, typeof ay === "string" ? ay : textoComun(ay ?? -1), t0, pagina === "casco" ? t("op.casco") : pagina === "camara" ? t("op.camara") : null);
      pantalla.actualizar();
      return true;
    });
  });
  guardarOPC();
}

juego.reproducirVideo = reproducirVideo;

juego.esperar = esperar;

juego.animar = animar;

juego.tarea = tarea;

juego.estado = estado;

juego.abrirOpciones = opciones;

async function arranque() {
  const ir = q.get("ir");
  await pantallaInicio();
  if (ir === "video") {
    await reproducirVideo(+(q.get("n") || 0));
    return;
  }
  if (q.has("capitulo") && ir !== "titulo") {
    const {capituloPorId: capituloPorId, aplicarCapitulo: aplicarCapitulo} = await (import("./capitulos.js"));
    const cap = capituloPorId(q.get("capitulo"));
    if (cap) {
      await aplicarCapitulo(juego, cap);
      await empezarPartida("capitulo");
      return;
    }
  }
  if (ir === "prologo" || ir === "302") {
    await empezarPartida(ir);
    return;
  }
  if (ir && ir !== "intro" && ir !== "titulo" || q.has("vuelta") || q.has("mundo")) {
    await empezarPartida("nueva");
    return;
  }
  if (ir === "intro") {
    await logos();
    await reproducirVideo(DATOS.arranque?.video_apertura ?? 0);
  }
  for (;;) {
    const r = await titulo();
    if (r === "video") {
      await reproducirVideo(DATOS.arranque?.video_titulo_quieto ?? 0);
      continue;
    }
    if (r === P.MSG.opciones) {
      await opciones();
      continue;
    }
    if (r === P.MSG.continuar) {
      const e = continuarDesde();
      if (!e) {
        await mensajeTitulo(textoComun(300));
        continue;
      }
      juego.partidaCargada = e.partida;
      juego.nivel = e.nivel || juego.nivel;
      await empezarPartida("cargar");
      return;
    }
    if (r === P.MSG.cargar) {
      const e = await pantallaGuardado(juego, {
        modo: "cargar"
      });
      if (!e) continue;
      if (e.terminada) {
        if (await terrorNuevo(e)) return;
        continue;
      }
      juego.partidaCargada = e.partida;
      juego.nivel = e.nivel || juego.nivel;
      await empezarPartida("cargar");
      return;
    }
    if (r === "capitulo") {
      const {pantallaCapitulos: pantallaCapitulos, aplicarCapitulo: aplicarCapitulo} = await (import("./capitulos.js"));
      const cap = await pantallaCapitulos(juego);
      if (!cap) continue;
      await aplicarCapitulo(juego, cap);
      await empezarPartida("capitulo");
      return;
    }
    if (r === P.MSG.nueva) {
      await empezarPartida("nueva");
      return;
    }
  }
}

async function mensajeTitulo(texto) {
  let t = 0;
  await animar(2.2, () => {
    t += 1 / 60;
    P.dibujarTitulo(g, I, fuente, textoComun, {
      t: t,
      opciones: [],
      alfa: 1
    });
    fuente.escribir(g, texto, P.W / 2, 300, {
      escala: P.ESC,
      alinear: "centro"
    });
  });
}

async function empezarPartida(modo) {
  juego.fase = "partida";
  juego.enPartida = true;
  await animar(.8, k => {
    g.save();
    g.globalAlpha = .08;
    P.limpiar(g);
    g.restore();
  }, false);
  const {iniciarPartida: iniciarPartida} = await (import("./partida.js"));
  await iniciarPartida(juego, modo);
}

arranque().catch(e => {
  estado("error: " + e.message);
  console.error(e);
});
