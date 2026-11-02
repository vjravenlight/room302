// SH4 web — FeniXVOID · Project Ravenlight
import { IDS_IDIOMAS, PARTE_COMUN, idiomaActual, fijarIdioma, nombreIdioma, t, hayTexto } from "./textos_sitio.js";

export const CLAVE = "sh4opciones";

export const DEFECTO = {
  brillo: 5,
  subtitulos: true,
  volMus: 8,
  volEfe: 8,
  sangre: 0,
  ruido: 5,
  henryVR: true,
  vistaCineVR: true,
  cine1ra: false,
  apuntar: "completa",
  niebla: 5,
  brilloPersonajes: 5,
  sombrasPersonajes: "siempre",
  camTipo: "juego",
  camSuavizado: 3,
  camGiro: 5,
  camDistancia: 5,
  idioma: "s",
  uso: "auto",
  calidad: "alta",
  mouseSens: 5,
  mouseInvertir: false,
  vista: "3ra",
  botones: "medianos",
  joystick: "izq",
  vibracion: true,
  calidadTactil: "media",
  giroVR: "saltos",
  vinetaVR: 1,
  posturaVR: "parado",
  manoVR: "der",
  mejoradoQuest: false,
  cuerpoVR: true,
  alturaVR: null,
  escalaVR: "propia",
  cuerpoVRListo: false,
  cineVR: "adentro"
};

export const USOS = [ "auto", "escritorio", "movil", "tabletV", "tabletH", "vr" ];

export const NOMBRE_USO = {
  auto: "Automático",
  escritorio: "Escritorio",
  movil: "Celular",
  tabletV: "Tablet vertical",
  tabletH: "Tablet horizontal",
  vr: "Casco VR"
};

export function leerOpciones() {
  let g = {};
  try {
    g = JSON.parse(localStorage.getItem(CLAVE) || "{}") || {};
  } catch {}
  const o = Object.assign({}, DEFECTO, g);
  if (typeof o.ruido !== "number") o.ruido = o.ruido === false ? 0 : 5;
  enlazarCine(o);
  try {
    const v = localStorage.getItem("sh4vistaMundo");
    if (v === "1ra" || v === "3ra") o.vista = v;
  } catch {}
  return o;
}

export function guardarOpciones(o) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify(o));
  } catch {}
  try {
    localStorage.setItem("sh4vistaMundo", o.vista);
  } catch {}
  try {
    window.dispatchEvent(new CustomEvent("sh4opciones", {
      detail: o
    }));
  } catch {}
}

export function enlazarCine(o, cambio = null) {
  const ojosVR = o.cineVR === "ojos";
  if (o.cineVR && !ojosVR) o.cineVRcine = o.cineVR;
  if (cambio === "cineVR") o.cine1ra = ojosVR; else if (cambio === "cine1ra") o.cineVR = o.cine1ra ? "ojos" : ojosVR ? o.cineVRcine || "adentro" : o.cineVR; else if (!!o.cine1ra !== ojosVR) {
    o.cine1ra = true;
    o.cineVR = "ojos";
  }
  return o;
}

export function detectarUso() {
  const q = new URLSearchParams(location.search).get("uso");
  if (q && NOMBRE_USO[q] && q !== "auto") return q;
  if (globalThis.__sh4EnVR) return "vr";
  const ua = navigator.userAgent || "";
  if (/OculusBrowser|Quest|PicoBrowser|Wolvic/i.test(ua)) return "vr";
  const tactil = matchMedia("(pointer: coarse)").matches || navigator.maxTouchPoints > 1 && !matchMedia("(pointer: fine)").matches;
  if (!tactil) return "escritorio";
  const corto = Math.min(screen.width || innerWidth, screen.height || innerHeight);
  if (corto < 600) return "movil";
  return matchMedia("(orientation: portrait)").matches ? "tabletV" : "tabletH";
}

export const usoActual = o => o.uso && o.uso !== "auto" ? o.uso : detectarUso();

export const usoTactil = () => new URLSearchParams(location.search).has("tactil") || [ "movil", "tabletV", "tabletH" ].includes(usoActual(leerOpciones()));

const grupoUso = u => u === "escritorio" ? "escritorio" : u === "vr" ? "vr" : "tactil";

const SI = 49, NO = 50;

function ayudaIdioma(o, textos) {
  const id = idiomaActual();
  if (id === "j") return t("idioma.ay.j");
  const delJuego = textos?.de?.(PARTE_COMUN[id], 97) || t("idioma.ay");
  return id === "s" || id === "e" || id === "b" ? delJuego : t("idioma.ay.otro", delJuego);
}

const COMUNES = [ {
  id: "brillo",
  n: 40,
  rango: [ 0, 10 ],
  ay: 95
}, {
  id: "subtitulos",
  n: 43,
  bool: true,
  ay: o => o.subtitulos ? 99 : 98
}, {
  id: "idioma",
  n: 42,
  k: "idioma",
  valores: IDS_IDIOMAS,
  ay: ayudaIdioma
}, {
  id: "volMus",
  n: 37,
  rango: [ 0, 10 ],
  ay: 92
}, {
  id: "volEfe",
  n: 38,
  rango: [ 0, 10 ],
  ay: 93
}, {
  id: "sangre",
  n: 44,
  valores: [ 0, 1, 2 ],
  nombres: [ 59, 60, 61 ],
  ay: o => [ 100, 101, 102 ][o.sangre]
}, {
  id: "ruido",
  n: 47,
  rango: [ 0, 10 ],
  ceroApagado: true,
  ay: o => o.ruido ? 104 : 103
}, {
  id: "henryVR",
  bool: true,
  ay: "op.henryVR.ay"
}, {
  id: "vistaCineVR",
  bool: true,
  ay: "op.vistaCineVR.ay"
}, {
  id: "cine1ra",
  valores: [ false, true ],
  ay: "op.cine1ra.ay"
}, {
  id: "niebla",
  rango: [ 0, 10 ],
  ceroApagado: true,
  ay: "op.niebla.ay"
}, {
  id: "brilloPersonajes",
  rango: [ 0, 10 ],
  ay: "op.brilloPersonajes.ay"
}, {
  id: "sombrasPersonajes",
  valores: [ "siempre", "juego", "no" ],
  ay: "op.sombrasPersonajes.ay"
}, {
  id: "apuntar",
  valores: [ "completa", "mira", "nada" ],
  ay: "op.apuntar.ay"
} ];

const CALIDAD = {
  valores: [ "baja", "media", "alta" ],
  vk: "calidad",
  k: "op.calidad"
};

const CAMARA = [ {
  id: "camTipo",
  valores: [ "juego", "hombro", "libre" ],
  ay: o => "op.camTipo.ay." + (o.camTipo || "juego")
}, {
  id: "camSuavizado",
  rango: [ 0, 10 ],
  ay: "op.camSuavizado.ay"
}, {
  id: "camGiro",
  rango: [ 0, 10 ],
  ay: "op.camGiro.ay"
}, {
  id: "camDistancia",
  rango: [ 1, 10 ],
  ay: "op.camDistancia.ay"
} ];

const POR_USO = {
  escritorio: [ {
    id: "calidad",
    ...CALIDAD,
    ay: "op.calidad.ay"
  }, {
    id: "mouseSens",
    rango: [ 1, 10 ],
    ay: "op.mouseSens.ay"
  }, {
    id: "mouseInvertir",
    bool: true,
    ay: "op.mouseInvertir.ay"
  }, {
    id: "vista",
    valores: [ "1ra", "3ra" ],
    ay: "op.vista.ay"
  }, ...CAMARA ],
  tactil: [ {
    id: "botones",
    valores: [ "chicos", "medianos", "grandes" ],
    ay: "op.botones.ay"
  }, {
    id: "joystick",
    valores: [ "izq", "der" ],
    ay: "op.joystick.ay"
  }, {
    id: "vibracion",
    bool: true,
    ay: "op.vibracion.ay"
  }, {
    id: "calidadTactil",
    ...CALIDAD,
    ay: "op.calidadTactil.ay"
  }, ...CAMARA ],
  vr: [ {
    id: "giroVR",
    valores: [ "saltos", "suave" ],
    ay: "op.giroVR.ay"
  }, {
    id: "vinetaVR",
    valores: [ 0, 1, 2 ],
    nombres: [ NO, null, null ],
    ay: "op.vinetaVR.ay"
  }, {
    id: "posturaVR",
    valores: [ "parado", "sentado" ],
    ay: "op.posturaVR.ay"
  }, {
    id: "manoVR",
    valores: [ "der", "izq" ],
    ay: "op.manoVR.ay"
  }, {
    id: "cuerpoVR",
    bool: true,
    ay: "op.cuerpoVR.ay"
  }, {
    id: "escalaVR",
    valores: [ "propia", "henry" ],
    ay: "op.escalaVR.ay"
  }, {
    id: "cineVR",
    valores: [ "pantalla", "adentro", "ojos" ],
    ay: "op.cineVR.ay"
  }, {
    id: "mejoradoQuest",
    bool: true,
    ay: "op.mejoradoQuest.ay"
  } ]
};

export function estructura(o, textos = null) {
  const T = (n, f) => (n != null && textos ? textos(n) : "") || f || "";
  const u = usoActual(o);
  const fila = d => ({
    id: d.id,
    def: d,
    nombre: T(d.n, t(d.k || "op." + d.id)),
    valor: valorTexto(o, d, T, textos),
    ayuda: ayudaTexto(o, d, T, textos)
  });
  const filaUso = {
    id: "uso",
    def: {
      id: "uso",
      valores: USOS
    },
    nombre: t("op.uso"),
    valor: o.uso === "auto" ? t("op.uso.auto", t("uso." + u)) : t("uso." + (NOMBRE_USO[o.uso] ? o.uso : u)),
    ayuda: t("op.uso.ay")
  };
  const titulo = {
    escritorio: t("uso.escritorio"),
    tactil: t("uso." + u),
    vr: t("uso.vr")
  }[grupoUso(u)];
  const columnas = [ {
    titulo: t("op.juego"),
    filas: COMUNES.map(fila)
  }, {
    titulo: titulo,
    filas: [ filaUso, ...POR_USO[grupoUso(u)].map(fila) ]
  } ];
  const acciones = [ {
    id: "porDefecto",
    accion: true,
    nombre: T(74, t("op.porDefecto")),
    ayuda: t("op.porDefecto.ay")
  }, {
    id: "salir",
    accion: true,
    nombre: T(48, t("op.salir")),
    ayuda: ""
  } ];
  return {
    titulo: T(201, t("op.titulo")) || t("op.titulo"),
    uso: u,
    columnas: columnas,
    acciones: acciones,
    lineal: [ ...columnas[0].filas, ...columnas[1].filas, ...acciones ]
  };
}

function valorTexto(o, d, T, textos) {
  if (d.id === "idioma") return nombreIdioma(idiomaActual(), textos?.de);
  const v = o[d.id];
  if (d.bool) return T(v ? SI : NO, t(v ? "op.si" : "op.no"));
  if (d.rango) return d.ceroApagado && !v ? T(NO, t("op.no")) : String(v);
  const i = d.valores.indexOf(v), clave = `op.${d.vk || d.id}.v.${v}`;
  if (i < 0) return String(v);
  return T(d.nombres?.[i], hayTexto(clave) ? t(clave) : String(v));
}

function ayudaTexto(o, d, T, textos) {
  const a = typeof d.ay === "function" ? d.ay(o, textos) : d.ay;
  if (typeof a === "number") return T(a, "");
  return a ? hayTexto(a) ? t(a) : a : "";
}

export function cambiarOpcion(o, fila, d = 1) {
  const df = fila.def;
  if (!df) return false;
  if (fila.id === "uso") {
    const i = USOS.indexOf(o.uso);
    o.uso = USOS[(i + USOS.length + d) % USOS.length];
    return true;
  }
  if (fila.id === "idioma") {
    const i = Math.max(0, IDS_IDIOMAS.indexOf(idiomaActual()));
    o.idioma = IDS_IDIOMAS[(i + IDS_IDIOMAS.length + d) % IDS_IDIOMAS.length];
    fijarIdioma(o.idioma);
    return true;
  }
  if (df.bool) {
    o[df.id] = !o[df.id];
    return true;
  }
  if (df.rango) {
    const v = Math.max(df.rango[0], Math.min(df.rango[1], o[df.id] + d));
    if (v === o[df.id]) return false;
    o[df.id] = v;
    return true;
  }
  const i = df.valores.indexOf(o[df.id]);
  o[df.id] = df.valores[(Math.max(0, i) + df.valores.length + d) % df.valores.length];
  if (df.id === "cine1ra" || df.id === "cineVR") enlazarCine(o, df.id);
  return true;
}

export function opcionesPorDefecto(o) {
  const {uso: uso, idioma: idioma} = o;
  Object.assign(o, DEFECTO, {
    uso: uso,
    idioma: idioma
  });
}

let _textos = null;

export function cargarTextosJuego() {
  if (_textos) return _textos;
  const bajar = ruta => fetch("/juego/" + ruta).then(r => {
    if (!r.ok) throw new Error("no pude leer " + ruta);
    return r.arrayBuffer();
  });
  _textos = (async () => {
    const {cargarFuente: cargarFuente, leerMensajes: leerMensajes} = await (import("./lib/fuente.js"));
    const [fuente, comun] = await Promise.all([ cargarFuente(bajar), bajar("data/message_common_eu.bin").then(leerMensajes) ]);
    const textoDe = (parte, n) => comun[parte]?.[n] ?? "";
    const textos = n => comun[PARTE_COMUN[idiomaActual()]]?.[n] ?? comun[PARTE_COMUN.b]?.[n] ?? "";
    textos.de = textoDe;
    return {
      fuente: fuente,
      textos: textos,
      textoDe: textoDe
    };
  })();
  return _textos;
}

export function crearEntrada(alAccion) {
  const TECLAS = {
    ArrowUp: "arriba",
    ArrowDown: "abajo",
    ArrowLeft: "izq",
    ArrowRight: "der",
    Enter: "aceptar",
    " ": "aceptar",
    Escape: "cancelar",
    Backspace: "cancelar"
  };
  const tecla = e => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    if (/^(INPUT|SELECT|TEXTAREA)$/.test(e.target?.tagName)) return;
    const a = TECLAS[e.key];
    if (!a) return;
    if (alAccion(a, "teclado") !== false) e.preventDefault();
  };
  const soltar = e => {
    if (e.key === " " && TECLAS[" "] && !/^(INPUT|SELECT|TEXTAREA)$/.test(e.target?.tagName)) e.preventDefault();
  };
  addEventListener("keydown", tecla);
  addEventListener("keyup", soltar);
  const previo = new Map;
  let rep = {
    a: null,
    t: 0
  }, corriendo = true, ultimo = performance.now();
  function cuadro(ahora) {
    if (!corriendo) return;
    const dt = (ahora - ultimo) / 1e3;
    ultimo = ahora;
    const pads = navigator.getGamepads ? [ ...navigator.getGamepads() ].filter(Boolean) : [];
    let dir = null;
    for (const p of pads) {
      const b = i => !!p.buttons[i]?.pressed;
      const ax = p.axes[0] || 0, ay = p.axes[1] || 0;
      if (b(12) || ay < -.6) dir = "arriba"; else if (b(13) || ay > .6) dir = "abajo"; else if (b(14) || ax < -.6) dir = "izq"; else if (b(15) || ax > .6) dir = "der";
      for (const [i, a] of [ [ 0, "aceptar" ], [ 1, "cancelar" ], [ 9, "aceptar" ] ]) {
        const k = p.index + ":" + i, ahoraP = b(i);
        if (ahoraP && !previo.get(k)) alAccion(a, "joystick");
        previo.set(k, ahoraP);
      }
    }
    if (dir !== rep.a) {
      rep = {
        a: dir,
        t: .38
      };
      if (dir) alAccion(dir, "joystick");
    } else if (dir && (rep.t -= dt) <= 0) {
      rep.t = .13;
      alAccion(dir, "joystick");
    }
    requestAnimationFrame(cuadro);
  }
  requestAnimationFrame(cuadro);
  return {
    parar() {
      corriendo = false;
      removeEventListener("keydown", tecla);
      removeEventListener("keyup", soltar);
    }
  };
}

const normalizar = t => String(t ?? "").replace(/…/g, "...").replace(/[—–]/g, "-").replace(/[“”]/g, '"').replace(/[‘’]/g, "'");

function pintar(el, fuente, texto, px) {
  texto = normalizar(texto);
  if (el.dataset.t === texto + "|" + px) return;
  el.dataset.t = texto + "|" + px;
  el.textContent = "";
  el.setAttribute("aria-label", texto);
  if (!fuente || !texto) {
    el.textContent = texto;
    return;
  }
  const lineas = texto.split("\n"), esc = 2;
  const ancho = Math.max(1, ...lineas.map(l => fuente.anchoLinea(l))) + 3, alto = (lineas.length - 1) * 24 + 23;
  const c = document.createElement("canvas");
  c.width = Math.ceil(ancho * esc);
  c.height = Math.ceil(alto * esc);
  const al = el.dataset.alinear || "izq";
  fuente.escribir(c.getContext("2d"), lineas.join("\n"), al === "centro" ? ancho / 2 : 0, 0, {
    escala: esc,
    color: "#ece3d2",
    alinear: al,
    interlinea: 24
  });
  c.style.width = ancho * px + "px";
  c.style.maxWidth = "100%";
  c.style.height = "auto";
  c.style.display = "block";
  c.setAttribute("aria-hidden", "true");
  el.appendChild(c);
}

export function abrirPantallaOpciones({fuente: fuente = null, textos: textos = null, fondo: fondo = null, alCerrar: alCerrar = null} = {}) {
  const o = leerOpciones();
  const raiz = document.createElement("div");
  raiz.id = "shOpciones";
  raiz.setAttribute("role", "dialog");
  raiz.setAttribute("aria-modal", "true");
  raiz.setAttribute("aria-label", t("op.titulo"));
  raiz.innerHTML = `<div class="shOp-fondo"></div><div class="shOp-caja">\n    <h2 class="shOp-titulo" data-alinear="centro"></h2><div class="shOp-uso"></div>\n    <div class="shOp-cols"></div><div class="shOp-acciones"></div>\n    <div class="shOp-ayuda" data-alinear="centro" aria-live="polite"></div>\n    <div class="shOp-teclas"></div></div>`;
  if (fondo) raiz.querySelector(".shOp-fondo").style.backgroundImage = `url(${typeof fondo === "string" ? fondo : fondo.toDataURL()})`;
  document.body.appendChild(raiz);
  document.documentElement.classList.add("shOp-abierta");
  const foco0 = document.activeElement;
  const px = () => innerWidth < 500 ? .78 : .9;
  let E, el = 0, botones = [];
  const vibrar = () => {
    if (o.vibracion && usoActual(o) !== "escritorio" && navigator.userActivation?.hasBeenActive) try {
      navigator.vibrate?.(8);
    } catch {}
  };
  function armar() {
    E = estructura(o, textos);
    raiz.querySelector(".shOp-teclas").textContent = t("op.teclas");
    pintar(raiz.querySelector(".shOp-titulo"), fuente, E.titulo, px() * 1.25);
    const cols = raiz.querySelector(".shOp-cols");
    cols.textContent = "";
    const acc = raiz.querySelector(".shOp-acciones");
    acc.textContent = "";
    botones = [];
    const boton = (f, padre) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "shOp-fila" + (f.accion ? " shOp-accion" : "");
      const n = document.createElement("span");
      n.className = "n";
      if (f.accion) n.dataset.alinear = "centro";
      b.appendChild(n);
      if (!f.accion) {
        const v = document.createElement("span");
        v.className = "v";
        v.innerHTML = '<i class="menos" aria-label="menos">◄</i><span class="vt"></span><i class="mas" aria-label="más">►</i>';
        b.appendChild(v);
      }
      const i = botones.length;
      botones.push(b);
      b.addEventListener("pointerenter", e => {
        if (e.pointerType === "mouse") elegir(i, false);
      });
      b.addEventListener("click", e => {
        elegir(i, false);
        const lado = e.target.closest("i");
        if (lado) cambiar(lado.classList.contains("menos") ? -1 : 1); else aceptar();
      });
      padre.appendChild(b);
    };
    for (const c of E.columnas) {
      const col = document.createElement("div");
      col.className = "shOp-col";
      const h = document.createElement("div");
      h.className = "shOp-seccion";
      h.textContent = c.titulo;
      col.appendChild(h);
      c.filas.forEach(f => boton(f, col));
      cols.appendChild(col);
    }
    E.acciones.forEach(f => boton(f, acc));
    refrescar();
  }
  function refrescar() {
    const p = px();
    E.lineal.forEach((f, i) => {
      const b = botones[i];
      if (!b) return;
      pintar(b.querySelector(".n"), fuente, f.nombre, p);
      const vt = b.querySelector(".vt");
      if (vt) pintar(vt, fuente, f.valor, p);
      b.classList.toggle("sel", i === el);
      b.setAttribute("aria-selected", i === el ? "true" : "false");
    });
    pintar(raiz.querySelector(".shOp-ayuda"), fuente, E.lineal[el]?.ayuda || " ", p * .85);
  }
  function elegir(i, foco = true) {
    el = (i + E.lineal.length) % E.lineal.length;
    refrescar();
    if (foco) {
      botones[el]?.focus({
        preventScroll: true
      });
      botones[el]?.scrollIntoView({
        block: "nearest"
      });
    }
  }
  function cambiar(d) {
    const f = E.lineal[el];
    if (!f || f.accion) return;
    if (cambiarOpcion(o, f, d)) {
      guardarOpciones(o);
      vibrar();
      if (f.id === "uso" || f.id === "idioma") {
        armar();
        elegir(E.lineal.findIndex(x => x.id === f.id));
        return;
      }
      E = estructura(o, textos);
      refrescar();
    }
  }
  function aceptar() {
    const f = E.lineal[el];
    if (f.id === "salir") return cerrar();
    if (f.id === "porDefecto") {
      opcionesPorDefecto(o);
      guardarOpciones(o);
      vibrar();
      armar();
      elegir(el);
      return;
    }
    cambiar(1);
  }
  function cerrar() {
    guardarOpciones(o);
    raiz.remove();
    removeEventListener("resize", alCambiarTam);
    document.documentElement.classList.remove("shOp-abierta");
    try {
      foco0?.focus?.({
        preventScroll: true
      });
    } catch {}
    alCerrar?.(o);
  }
  function accion(a) {
    if (a === "arriba") elegir(el - 1); else if (a === "abajo") elegir(el + 1); else if (a === "izq") cambiar(-1); else if (a === "der") cambiar(1); else if (a === "aceptar") aceptar(); else if (a === "cancelar") cerrar();
  }
  const alCambiarTam = () => {
    if (!raiz.isConnected) return;
    for (const c of raiz.querySelectorAll("[data-t]")) delete c.dataset.t;
    armar();
  };
  addEventListener("resize", alCambiarTam);
  armar();
  elegir(0);
  return {
    accion: accion,
    cerrar: cerrar,
    el: raiz,
    opciones: o
  };
}

export const LIENZO_OPC = {
  w: 960,
  h: 540,
  esc: 2
};

export function dibujarOpcionesLienzo(g, {fuente: fuente, fondo: fondo = null, E: E, elegido: elegido = 0, t: tiempo = 0, apuntado: apuntado = null}) {
  const {w: W, h: H, esc: S} = LIENZO_OPC;
  const escr = (s, x, y, k, op = {}) => {
    if (s && fuente) fuente.escribir(g, normalizar(s), x / k, y / k, {
      ...op,
      escala: S * k
    });
  };
  g.save();
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.fillStyle = "#050303";
  g.fillRect(0, 0, g.canvas.width, g.canvas.height);
  if (fondo) {
    g.globalAlpha = .32;
    g.drawImage(fondo, 0, 0, g.canvas.width, g.canvas.height);
    g.globalAlpha = 1;
  }
  g.fillStyle = "rgba(4,3,3,0.84)";
  g.fillRect(24 * S, 14 * S, (W - 48) * S, (H - 28) * S);
  g.strokeStyle = "rgba(150,72,36,0.85)";
  g.lineWidth = 3;
  g.strokeRect(24 * S, 14 * S, (W - 48) * S, (H - 28) * S);
  g.restore();
  escr(E.titulo, W / 2, 24, 1.4, {
    alinear: "centro",
    color: "#f0e4d2"
  });
  const rects = [], paso = 34, y0 = 96, k = 1.15;
  let idx = 0;
  E.columnas.forEach((c, ci) => {
    const x0 = ci === 0 ? 44 : W / 2 + 12, ancho = W / 2 - 56;
    escr(c.titulo.toUpperCase(), x0 + 8, y0 - 34, .95, {
      color: "#c0503c"
    });
    g.fillStyle = "rgba(122,59,30,0.6)";
    g.fillRect(x0 * S, (y0 - 8) * S, ancho * S, 2);
    c.filas.forEach((f, i) => {
      const y = y0 + i * paso, sel = idx === elegido;
      if (sel) franja(g, x0, y - 4, ancho, paso - 2, tiempo, S); else if (idx === apuntado) {
        g.fillStyle = "rgba(150,28,18,0.18)";
        g.fillRect(x0 * S, (y - 4) * S, ancho * S, (paso - 2) * S);
      }
      escr(f.nombre, x0 + 10, y, k * .92, {
        color: sel ? "#ffffff" : "#c9beb0"
      });
      if (f.valor != null) escr(sel ? `< ${f.valor} >` : f.valor, x0 + ancho - 10, y, k * .92, {
        alinear: "der",
        color: sel ? "#ffd9c4" : "#d8c8b8"
      });
      rects.push({
        i: idx,
        x: x0,
        y: y - 4,
        w: ancho,
        h: paso - 2
      });
      idx++;
    });
  });
  const ya = y0 + Math.max(...E.columnas.map(c => c.filas.length)) * paso + 14;
  E.acciones.forEach((f, i) => {
    const ancho = 200, x0 = W / 2 - 220 + i * 240, sel = idx === elegido;
    if (sel) franja(g, x0, ya - 4, ancho, paso - 2, tiempo, S); else if (idx === apuntado) {
      g.fillStyle = "rgba(150,28,18,0.18)";
      g.fillRect(x0 * S, (ya - 4) * S, ancho * S, (paso - 2) * S);
    }
    escr(f.nombre, x0 + ancho / 2, ya, k, {
      alinear: "centro",
      color: sel ? "#ffffff" : "#c9beb0"
    });
    rects.push({
      i: idx,
      x: x0,
      y: ya - 4,
      w: ancho,
      h: paso - 2
    });
    idx++;
  });
  const ay = E.lineal[elegido]?.ayuda;
  if (ay) escr(ay.split("\n").join(" "), W / 2, H - 52, .85, {
    alinear: "centro",
    color: "#e0d6c8"
  });
  escr(t("op.teclasCasco"), W / 2, H - 30, .75, {
    alinear: "centro",
    color: "#8f857a"
  });
  return rects;
}

function franja(g, x, y, w, h, t, S) {
  g.save();
  const gr = g.createLinearGradient(x * S, 0, (x + w) * S, 0);
  const a = .5 + .1 * Math.sin(t * 5);
  gr.addColorStop(0, "rgba(150,28,18,0)");
  gr.addColorStop(.12, `rgba(150,28,18,${a})`);
  gr.addColorStop(.88, `rgba(150,28,18,${a})`);
  gr.addColorStop(1, "rgba(150,28,18,0)");
  g.fillStyle = gr;
  g.fillRect(x * S, y * S, w * S, h * S);
  g.restore();
}
