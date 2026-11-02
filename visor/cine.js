// SH4 web — FeniXVOID · Project Ravenlight
import * as THREE from "three";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import { VRButton } from "three/addons/webxr/VRButton.js";

import { partesBin } from "./lib/sh4bin.js";

import { indiceSh4 } from "./lib/remoto.js";

import { leerSqt, esSqt, crearMuestreador, leerHuesos, leerCamara, numeroCuadro, FPS } from "./lib/sqt.js";

import { decodificarXmd } from "./lib/xmd.js";

import { leerModelo } from "./lib/modelo.js";

import { leerTexturas } from "./lib/texturas.js";

import { armarSala, ESCALA } from "./lib/sala.js";

import { leerTablaSubtitulos, leerMensajes, subtitulosDe, PAQUETES_MENSAJES } from "./lib/subtitulos.js";

import { cargarFuente } from "./lib/fuente.js";

import { IDIOMAS, idiomaActual, nombreIdioma, t as tr } from "./textos_sitio.js";

import { crearUniformsLuz, materialJuego, lucesDelJuego, aplicarLucesPersonaje } from "./lib/luz_cine.js";

import { sombraDemo, lucesDeSombraSLGT, esHalfDemo, opcionesLuzPj } from "./lib/luz_personajes.js";

import { armarExtras } from "./lib/extras_cine.js";

import { ocultarGrupos } from "./lib/extras_cine.js";

import { iniciarEfectos } from "./efectos/efectos.js";

import { crearEventosDemo } from "./efectos/eventos_demo.js";

import { crearPantallaDemo, pantallaActiva } from "./efectos/pantalla_demo.js";

import { prepararOjos, poseOjos, crearSuavizado, ubicarRig, HUESO_CABEZA } from "./lib/ojos_cine.js";

import { prepararCasco, opciones } from "./jugador/casco_comun.js";

import { crearListaVR } from "./suite_vr_lista.js";

import { indiceMiniaturas, urlMiniatura } from "./miniaturas.js";

import { prepararFotoCine } from "./cine_foto.js";

import { prepararVideoCine } from "./cine_video.js";

import { prepararBrillo } from "./lib/brillo.js";

import { sitioIngles } from "./textos_sitio.js";

const EN_CINE = {
  "cámara móvil (arrastrá)": "free camera (drag)",
  "redondear (U)": "smooth (U)",
  "CINEMÁTICAS": "CUTSCENES",
  Pausa: "Pause",
  Play: "Play",
  "Vista: cine": "View: cinema",
  "Vista: adentro": "View: inside",
  "Ojos de Henry": "Henry's eyes",
  "Cámara de la escena": "Scene camera",
  "Otro paquete": "Next package",
  "Salir del casco": "Exit headset",
  "Desde el principio": "From the start",
  "¿Cómo la ves?": "How to watch it?",
  "cinemáticas": "cutscenes",
  Volver: "Back",
  "Pantalla de cine": "Cinema screen",
  "Delante tuyo, sin moverte": "In front of you, still",
  "Adentro de la escena": "Inside the scene",
  "Donde está la cámara": "Where the camera is",
  "Si no está, la cámara": "Scene camera if he is absent"
};

const trC = t => sitioIngles() ? EN_CINE[t] ?? t : t;

const SIEMPRE_CAMARA = new Set([ 47 ]);

const leerElecciones = () => {
  try {
    return JSON.parse(localStorage.getItem("sh4camcine") || "{}");
  } catch {
    return {};
  }
};

const cineVRop = () => globalThis.__sh4EnVR ? opciones().cineVR || null : null;

const quiereOjos = id => {
  const m = cineVRop();
  if (m) return m === "ojos" && !SIEMPRE_CAMARA.has(id);
  const e = leerElecciones();
  return id in e ? e[id] === "ojos" : SIEMPRE_CAMARA.has(id) ? false : !!opciones().cine1ra;
};

const guardarEleccion = (id, ojos) => {
  const e = leerElecciones();
  e[id] = ojos ? "ojos" : "escena";
  try {
    localStorage.setItem("sh4camcine", JSON.stringify(e));
  } catch {}
};

const offMovil = {
  yaw: 0,
  pitch: 0
}, _qOff = new THREE.Quaternion, _eOff = new THREE.Euler(0, 0, 0, "YXZ");

let baseVRcam = null;

const q = new URLSearchParams(location.search);

const $ = id => document.getElementById(id);

const estado = t => {
  $("estado").textContent = t;
  if (q.has("quieto")) console.log("[cine]", (performance.now() / 1e3).toFixed(1) + " s", t.split(String.fromCharCode(10))[0]);
};

const quieto = q.has("quieto");

const probarVR = q.get("probarvr");

const ASPECTO_JUEGO = 4 / 3, ALTO_FRANJA = .125;

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  stencil: true,
  preserveDrawingBuffer: q.has("captura")
});

renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

renderer.setSize(innerWidth, innerHeight);

renderer.outputColorSpace = THREE.SRGBColorSpace;

renderer.xr.enabled = true;

document.body.appendChild(renderer.domElement);

prepararBrillo(renderer.domElement);

VRButton.registerSessionGrantedListener();

const botonVR = VRButton.createButton(renderer);

document.body.appendChild(botonVR);

const vrSinCasco = () => {
  if (/NOT SUPPORTED|NOT AVAILABLE|NOT ALLOWED/i.test(botonVR.textContent || "")) botonVR.style.display = "none";
};

setTimeout(vrSinCasco, 1500);

setTimeout(vrSinCasco, 4e3);

const escena = new THREE.Scene;

escena.background = new THREE.Color(0);

const juego = new THREE.Group;

juego.name = "espacio_juego";

juego.rotation.z = Math.PI;

juego.scale.setScalar(ESCALA);

escena.add(juego);

const salas = new THREE.Group;

salas.name = "salas";

escena.add(salas);

const personajesGrupo = new THREE.Group;

personajesGrupo.name = "personajes";

escena.add(personajesGrupo);

const lucesGrupo = new THREE.Group;

lucesGrupo.name = "luces_cine";

escena.add(lucesGrupo);

const lucesRespaldo = new THREE.HemisphereLight(16774374, 3156e3, 1.2 * Math.PI);

lucesRespaldo.visible = false;

escena.add(lucesRespaldo);

const grilla = new THREE.GridHelper(20, 40, 5583650, 2759958);

grilla.visible = false;

escena.add(grilla);

const camCine = new THREE.PerspectiveCamera(45, ASPECTO_JUEGO, .02, 600);

escena.add(camCine);

const ayudaCam = new THREE.CameraHelper(camCine);

ayudaCam.visible = false;

escena.add(ayudaCam);

const camLibre = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, .02, 600);

camLibre.position.set(2, 2, 3);

const orbita = new OrbitControls(camLibre, renderer.domElement);

orbita.addEventListener("change", () => redibujar());

const jugador = new THREE.Group;

jugador.name = "jugador";

const camVR = new THREE.PerspectiveCamera(70, 1, .02, 600);

jugador.add(camVR);

const cineVR = new THREE.Scene;

cineVR.background = new THREE.Color(328707);

const rt = new THREE.WebGLRenderTarget(1440, 1080, {
  samples: 4
});

rt.texture.colorSpace = THREE.SRGBColorSpace;

const pantalla = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 3.6), new THREE.MeshBasicMaterial({
  map: rt.texture,
  toneMapped: false
}));

pantalla.position.set(0, 1.7, -4.2);

cineVR.add(pantalla);

const franjasVR = [ 1, -1 ].map(lado => {
  const f = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 3.6 * ALTO_FRANJA), new THREE.MeshBasicMaterial({
    color: 0
  }));
  f.position.set(0, lado * 3.6 * (.5 - ALTO_FRANJA / 2), .002);
  pantalla.add(f);
  return f;
});

const marco = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 4), new THREE.MeshBasicMaterial({
  color: 1182730
}));

marco.position.set(0, 1.7, -4.25);

cineVR.add(marco);

const pisoCine = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.MeshBasicMaterial({
  color: 854279
}));

pisoCine.rotation.x = -Math.PI / 2;

cineVR.add(pisoCine);

const lienzoSub = document.createElement("canvas");

lienzoSub.width = 1024;

lienzoSub.height = 160;

const texSub = new THREE.CanvasTexture(lienzoSub);

texSub.colorSpace = THREE.SRGBColorSpace;

const cartelSub = new THREE.Mesh(new THREE.PlaneGeometry(1.6, .25), new THREE.MeshBasicMaterial({
  map: texSub,
  transparent: true,
  depthTest: false,
  toneMapped: false
}));

cartelSub.renderOrder = 20;

cartelSub.visible = false;

addEventListener("resize", () => {
  if (C.exportando) return;
  renderer.setSize(innerWidth, innerHeight);
  camLibre.aspect = innerWidth / innerHeight;
  camLibre.updateProjectionMatrix();
  redibujar();
});

let sucio = 3;

const redibujar = () => {
  sucio = Math.max(sucio, 2);
};

async function bajar(ruta) {
  const r = await fetch("/juego/" + ruta.split("/").map(encodeURIComponent).join("/"));
  if (!r.ok) throw new Error("no pude leer " + ruta);
  return r.arrayBuffer();
}

const fuenteJuego = await cargarFuente(bajar).catch(e => {
  console.warn("sin fontdata.bin", e);
  return null;
});

const bajarSala = bajar;

async function json(ruta) {
  try {
    const r = await fetch(ruta, {
      cache: "no-cache"
    });
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  }
}

const [lista, nombres, PC, DJ, AUTO, DS] = await Promise.all([ json("/juego-lista.json"), json("./nombres.json"), json("/datos/personajes_cine.json"), json("/datos/demos.json"), json("/datos/cine_auto.json"), json("/datos/demos_salas.json") ]);

function buscarEn(j, paq, demo, id) {
  if (!j) return undefined;
  const pref = paq.slice(0, 2), num = +demo.slice(2);
  const claves = [ pref + "/" + demo, paq + "/" + demo, demo, pref + "/" + demo + ".sdm", demo + ".sdm" ];
  const contenedores = [ j, j.demos, j.cinematicas ].filter(Boolean);
  for (const c of contenedores) {
    if (Array.isArray(c)) {
      const e = c.find(x => x && (x.demo === demo || x.demo === num || x.demo_id === num || x.nombre === demo));
      if (e) return id === undefined ? e : e.personajes?.[id] ?? (Array.isArray(e.personajes) ? e.personajes.find(p => p.id === id || p.id === String(id)) : undefined);
      continue;
    }
    for (const k of claves) if (c[k] !== undefined) return id === undefined ? c[k] : c[k]?.[id] ?? c[k]?.personajes?.[id] ?? (Array.isArray(c[k]?.personajes) ? c[k].personajes.find(p => +p.id === id) : undefined);
  }
  if (id !== undefined) return j.personajes?.[id] ?? j[id];
  return undefined;
}

function normalizarModelo(v) {
  if (!v) return null;
  const sinBin = a => a.replace(/\.bin$/, "");
  if (typeof v === "string") {
    const [a, i] = sinBin(v).split("#");
    return {
      archivo: a,
      indice: +(i || 0),
      fuente: "datos"
    };
  }
  if (v.modelo && typeof v.modelo === "object" && typeof v.modelo.archivo === "string") {
    return {
      archivo: sinBin(v.modelo.archivo),
      parte: v.modelo.parte,
      texArchivo: v.texturas?.archivo && sinBin(v.texturas.archivo),
      texParte: v.texturas?.parte,
      nombre: v.nombre,
      fuente: "datos"
    };
  }
  const a = v.archivo ?? v.bin ?? v.file;
  if (typeof a !== "string") return null;
  return {
    archivo: sinBin(a),
    indice: +(v.indice ?? v.n ?? 0) || 0,
    nombre: v.nombre,
    fuente: "datos"
  };
}

const TRAJES = {
  eileen: /enfermera de Eileen/,
  cynthia: /alternativo de Cynthia/
};

const trajes = (() => {
  if (q.has("trajes")) return Object.fromEntries(q.get("trajes").split(",").filter(Boolean).map(k => [ k, 1 ]));
  try {
    return JSON.parse(localStorage.getItem("sh4trajes") || "{}");
  } catch {
    return {};
  }
})();

function conTraje(v) {
  for (const x of v?.variantes || []) for (const [k, re] of Object.entries(TRAJES)) if (trajes[k] && re.test(x.cuando || "")) return x;
  return v;
}

function modeloPara(paq, demo, id) {
  const g = normalizarModelo(conTraje(buscarEn(PC, paq, demo, id)));
  if (g) return g;
  const a = AUTO?.demos?.[paq.slice(0, 2) + "/" + demo]?.personajes?.find(p => p.id === id)?.modelo;
  return a ? {
    archivo: a.archivo,
    indice: a.indice,
    fuente: "esqueleto",
    error: a.error
  } : null;
}

const demoGhidra = demo => DJ?.demos?.[String(+demo.slice(2, 5))] ?? null;

function salaDeEscena(texto) {
  const m = /^([a-z]{2})\D+(\d+)/.exec(texto || "");
  if (!m) return null;
  const base = m[1] === "rl" ? "rl" + String(+m[2] - 1).padStart(2, "0") : m[1] + String(+m[2]).padStart(2, "0");
  return {
    base: base,
    sala: SALAS.find(x => x === base) || SALAS.find(x => x.startsWith(base) && /^[a-z]{2}\d\d[a-z]?$/.test(x)) || null
  };
}

function salaDeDatos(paq, demo) {
  const e = DS?.demos?.[paq.slice(0, 2) + "/" + demo];
  if (!e?.sala) return null;
  const etq = {
    alta: "segura",
    media: "probable",
    baja: "dudosa"
  }[e.confianza] || e.confianza;
  return {
    salas: [ e.sala ],
    base: e.sala.slice(0, 4),
    desplazar: e.desplazar,
    giro: e.giro_y || 0,
    t: e.t,
    datos: e,
    fuente: `${e.etapa} escena ${e.escena ?? "-"}, ${etq} (demos_salas.json)`
  };
}

function salaPara(paq, demo) {
  const ds = salaDeDatos(paq, demo);
  if (ds) return ds;
  const d = demoGhidra(demo);
  const ev = d?.evento?.nombres_e3?.init || "";
  const porEvento = /RoomPeep/.test(ev) ? "rl escena 6" : /DoorPeep/.test(ev) ? "rl escena 7" : /WakeUp/.test(ev) ? "rl escena 2" : /RL0(\d)Fan/.test(ev) ? `rl escena ${+/RL0(\d)Fan/.exec(ev)[1] + 1}` : null;
  const esc = porEvento ?? d?.escenas?.[0] ?? (d?.por_evento?.[0] ? `${d.por_evento[0].etapa} escena ${d.por_evento[0].escena}` : null);
  const g = salaDeEscena(esc);
  if (g?.sala) return {
    salas: [ g.sala ],
    base: g.base,
    fuente: "ghidra: " + esc
  };
  const a = AUTO?.demos?.[paq.slice(0, 2) + "/" + demo]?.salas?.[0];
  if (a && a.puntaje >= .5) return {
    salas: [ a.sala ],
    base: a.base,
    fuente: "automática (" + a.puntaje + ")"
  };
  return {
    salas: [],
    fuente: "ninguna"
  };
}

function alineada(base, sqt) {
  const c = AUTO?.cajas?.[base];
  if (!c || !sqt.camara) return true;
  let dentro = 0, n = 0;
  for (let f = 0; f < sqt.n; f += 30) {
    const p = leerCamara(sqt, f).pos;
    n++;
    if ([ 0, 1, 2 ].every(i => p[i] >= c.min[i] - 300 && p[i] <= c.max[i] + 300)) dentro++;
  }
  return dentro >= n * .3;
}

const PAQUETES = (lista?.demo || []).filter(f => f.endsWith(".sh4") && !/^(bgm|se)\.sh4$/.test(f));

const SALAS = (lista?.data || []).filter(f => /^[a-z]{2}\d\d[a-z0-9_]*\.bin$/.test(f)).map(f => f.slice(0, -4));

const nombreSala = s => {
  const m = s.match(/^([a-z]{2}\d\d)([a-h])?/);
  const sala = nombres?.salas?.[m?.[1]]?.nombre, va = nombres?.variantes?.[s]?.nombre;
  return [ sala, va ].filter(Boolean).join(" · ");
};

const nombreMundo = pref => nombres?.mundos?.[pref]?.nombre || pref;

for (const p of PAQUETES) $("paquete").add(new Option(`${nombreMundo(p.slice(0, 2))} (${p})`, p));

function llenarSalas(pref, elegidas) {
  const sel = $("sala");
  sel.innerHTML = "";
  sel.add(new Option("(ninguna: piso de referencia)", ""));
  const grupos = {};
  for (const s of SALAS) (grupos[s.slice(0, 2)] ||= []).push(s);
  const orden = Object.keys(grupos).sort((a, b) => a === pref ? -1 : b === pref ? 1 : a.localeCompare(b));
  for (const g of orden) {
    const og = document.createElement("optgroup");
    og.label = nombreMundo(g) + ` (${g})`;
    for (const s of grupos[g]) {
      const n = nombreSala(s);
      og.appendChild(new Option(n ? `${s} · ${n}` : s, s));
    }
    sel.appendChild(og);
  }
  sel.value = elegidas[0] || "";
}

{
  const sel = $("subs");
  if (sel) {
    sel.textContent = "";
    for (const x of IDIOMAS) sel.add(new Option(tr("cine.subs", nombreIdioma(x.id)), x.id));
    sel.add(new Option(tr("cine.sinSubs"), "no"));
    sel.value = idiomaActual();
  }
}

let tablaSubs = null;

const mensajes = {};

async function cargarTablaSubs() {
  if (tablaSubs !== null) return tablaSubs;
  try {
    tablaSubs = leerTablaSubtitulos(await bajar("SILENT HILL 4.exe")) || [];
  } catch {
    tablaSubs = [];
  }
  return tablaSubs;
}

async function subtitulos(demoId, idioma) {
  if (idioma === "no") return [];
  const tabla = await cargarTablaSubs();
  const usados = [ ...new Set(tabla.filter(e => e.demo === demoId).map(e => e.paquete)) ];
  mensajes[idioma] ||= {};
  for (const p of usados) {
    if (mensajes[idioma][p]) continue;
    try {
      mensajes[idioma][p] = leerMensajes(await bajar(`data/message_${PAQUETES_MENSAJES[p]}_${idioma}.bin`));
    } catch {
      mensajes[idioma][p] = [];
    }
  }
  return subtitulosDe(tabla, demoId, mensajes[idioma]);
}

const LUZ_JUEGO = q.get("luz") !== "vieja";

const C = {
  paquete: null,
  paq: null,
  entradas: [],
  demo: null,
  sqt: null,
  muestrear: null,
  t: 0,
  tocando: false,
  personajes: [],
  luces: [],
  subs: [],
  audio: null,
  salas: [],
  salaInfo: null,
  desplazar: null
};

window.cine = {
  C: C,
  THREE: THREE,
  escena: escena,
  camCine: camCine,
  renderer: renderer,
  redibujar: redibujar,
  listo: false
};

const conEventos = !q.has("sineventos");

const infoFx = {
  get sala() {
    return C.salas[0]?.nombre ?? null;
  },
  get luces() {
    return C.salas[0]?.luces ?? [];
  },
  get niebla() {
    return C.salas[0]?.nieblaJuego ?? C.salas[0]?.niebla ?? null;
  }
};

let fx = null;

if (conEventos) {
  try {
    fx = iniciarEfectos({
      THREE: THREE,
      renderer: renderer,
      escena: salas,
      camara: camCine,
      sala: salas,
      info: infoFx,
      escala: ESCALA
    });
    fx.opciones({
      auto: false,
      texFog: false
    });
  } catch (e) {
    console.warn("efectos", e);
    fx = null;
  }
}

if (q.has("depurarFx")) window.cine.fx = fx;

const eventos = conEventos ? crearEventosDemo({
  THREE: THREE,
  bajar: bajar,
  escala: ESCALA,
  modo: "visor"
}) : null;

const pantallaDemo = crearPantallaDemo({
  THREE: THREE,
  renderer: renderer
});

C.pantalla = null;

let tEventos = null;

function avanzarEventos(t) {
  if (!C.ev) {
    C.pantalla = null;
    return;
  }
  const paso = 2;
  if (tEventos === null || t < tEventos - .5) tEventos = 0;
  let n = 0;
  while (t - tEventos > paso + .01 && n++ < 1500) {
    tEventos += paso;
    C.pantalla = eventos.cuadro(C.ev, tEventos, paso / FPS);
    fx?.actualizar(paso / FPS);
  }
  const dt = Math.max(0, (t - tEventos) / FPS);
  C.pantalla = eventos.cuadro(C.ev, t, dt);
  fx?.actualizar(dt);
  tEventos = t;
}

let crearPersonaje = null;

try {
  ({crearPersonaje: crearPersonaje} = await (import("./lib/personaje.js")));
} catch (e) {
  console.warn("sin lib/personaje.js: solo esqueletos", e);
}

const archivos = new Map;

async function binDatos(nombre) {
  if (!archivos.has(nombre)) archivos.set(nombre, bajar("data/" + nombre + ".bin"));
  return archivos.get(nombre);
}

async function abrirPaquete(paq) {
  C.paquete = paq;
  estado("leyendo " + paq + "…");
  C.paq = await indiceSh4("/juego/demo/" + encodeURIComponent(paq));
  C.entradas = C.paq.entradas;
  const sel = $("demo");
  sel.innerHTML = "";
  await cargarTablaSubs();
  const sdms = C.entradas.filter(e => e.len > 48 && e.nombre.endsWith(".sdm"));
  const cabeceras = new Array(sdms.length);
  for (let i = 0; i < sdms.length; i += 8) await Promise.all(sdms.slice(i, i + 8).map(async (e, k) => {
    cabeceras[i + k] = await C.paq.leer(e, 1024);
  }));
  sdms.forEach((e, i) => {
    const b = cabeceras[i];
    if (!esSqt(b)) return;
    const dv = new DataView(b), nch = dv.getInt32(8, true), och = dv.getInt32(12, true), tam = dv.getInt32(16, true), ofr = dv.getInt32(20, true);
    const n = Math.floor((e.len - ofr) / tam), id = +e.nombre.slice(2, 5);
    let pers = 0;
    for (let k = 0; k < nch && och + 8 * k + 2 <= b.byteLength; k++) if (dv.getInt16(och + 8 * k, true) >= 300) pers++;
    const nSub = tablaSubs.filter(x => x.demo === id).length;
    sel.add(new Option(`${e.nombre.slice(0, -4)} · ${(n / FPS).toFixed(0)} s · ${pers} pers.` + (nSub ? ` · ${nSub} subt.` : ""), e.nombre.slice(0, -4)));
  });
}

function limpiar() {
  pausar();
  for (const p of C.personajes) {
    p.obj?.grupo?.removeFromParent();
    p.obj?.dispose?.();
    p.esqueleto?.removeFromParent();
  }
  C.personajes = [];
  lucesGrupo.clear();
  C.luces = [];
  for (const x of C.extras || []) {
    x.grupo.removeFromParent();
    x.dispose?.();
  }
  C.extras = [];
  if (C.ev) {
    eventos.terminar(C.ev);
    C.ev = null;
  }
  C.pantalla = null;
  tEventos = null;
}

async function abrirDemo(nombre, opciones = {}) {
  limpiar();
  const e = C.entradas.find(x => x.nombre === nombre + ".sdm");
  if (!e) {
    estado("no está " + nombre);
    return;
  }
  C.demo = nombre;
  estado("leyendo " + nombre + "…");
  const ex = C.entradas.find(x => x.nombre === nombre + ".xmd");
  const [bufSdm, bufXmd] = await Promise.all([ C.paq.leer(e), ex && ex.len > 12 ? C.paq.leer(ex) : null ]);
  const sqt = leerSqt(bufSdm);
  C.sqt = sqt;
  C.muestrear = crearMuestreador(sqt);
  C.audio = null;
  if (bufXmd) {
    const a = decodificarXmd(new Uint8Array(bufXmd));
    if (a) C.audio = a;
  }
  const avisos = [];
  for (let i = 0; i < sqt.modelos.length; i++) {
    const p = sqt.modelos[i];
    const ent = {
      p: p,
      i: i,
      modelo: modeloPara(C.paquete, nombre, p.id),
      obj: null,
      esqueleto: null,
      padres: null,
      bind: null
    };
    if (ent.modelo && crearPersonaje) {
      try {
        const M = ent.modelo, buf = await binDatos(M.archivo);
        const partes = partesBin(buf);
        const mods = partes.filter(x => x.tipo === "modelo"), texs = partes.filter(x => x.tipo === "texturas");
        const mp = M.parte !== undefined ? partes[M.parte] : mods[M.indice];
        const m = mp?.tipo === "modelo" && leerModelo(buf, mp.ofs, mp.len);
        if (m && m.huesos.length >= p.nHuesos) {
          let t = [];
          if (M.texParte !== undefined) {
            const tb = M.texArchivo && M.texArchivo !== M.archivo ? await binDatos(M.texArchivo) : buf;
            const tp = partesBin(tb)[M.texParte];
            if (tp?.tipo === "texturas") t = leerTexturas(tb, tp.ofs, tp.len);
          } else {
            const i = Math.max(0, mods.indexOf(mp)), tp = texs[Math.min(i, texs.length - 1)];
            if (tp) t = leerTexturas(buf, tp.ofs, tp.len);
          }
          if (LUZ_JUEGO) {
            ent.uniformsLuz = crearUniformsLuz();
            ent.obj = crearPersonaje(m, t, {
              material: (tex, sp) => materialJuego(tex, sp, ent.uniformsLuz)
            });
          } else {
            ent.obj = crearPersonaje(m, t);
            if (q.get("normales") !== "archivo") for (const ma of ent.obj.mallas) ma.geometry.computeVertexNormals();
          }
          ocultarGrupos(p.id, m, ent.obj);
          ent.padres = m.huesos.map(h => h.padre);
          ent.bind = m.huesos.map(h => (new THREE.Matrix4).fromArray(h.matriz));
          if (/^Henry/.test(PC?.personajes?.[String(p.id)]?.nombre || "")) ent.ojo = prepararOjos(THREE, ent.bind, ent.padres);
          personajesGrupo.add(ent.obj.grupo);
        } else avisos.push(`${p.id}: ${ent.modelo.archivo} no coincide (${m?.huesos.length} huesos vs ${p.nHuesos})`);
      } catch (err) {
        avisos.push(`${p.id}: ${err.message}`);
      }
    }
    crearEsqueleto(ent);
    C.personajes.push(ent);
  }
  for (const p of sqt.luces) {
    const tipos = new Set;
    for (let f = 0; f < sqt.n; f += 10) {
      const b = sqt.ofr + f * sqt.tam + p.enCuadro;
      const c = p.claves.find(k => k.tipo === 134);
      if (c) tipos.add(sqt.dv.getInt32(b + c.ofs, true));
    }
    const l = {
      p: p,
      tipos: tipos,
      amb: null,
      dir: null,
      pun: null
    };
    if (tipos.has(1)) {
      l.amb = new THREE.AmbientLight(16777215, 0);
      lucesGrupo.add(l.amb);
    }
    if (tipos.has(2) || tipos.has(5)) {
      l.dir = new THREE.DirectionalLight(16777215, 0);
      lucesGrupo.add(l.dir, l.dir.target);
    }
    if (tipos.has(3) || tipos.has(4) || tipos.has(6)) {
      l.pun = new THREE.PointLight(16777215, 0, 0, 0);
      lucesGrupo.add(l.pun);
    }
    C.luces.push(l);
  }
  const elegida = opciones.salas ?? salaPara(C.paquete, nombre);
  if (!opciones.salas && !elegida.datos && elegida.base && elegida.salas.length && !alineada(elegida.base, sqt)) {
    elegida.fuente += `; ${elegida.salas[0]} no está alineada con la cinemática (falta el map_offset), no se carga`;
    elegida.salas = [];
  }
  const banderas = demoGhidra(nombre)?.evento?.banderas || [];
  C.sinFranjas = banderas.some(b => b.funcion === "DemoSetDontDrawBelt" && b.args?.[0] === 1);
  if (!q.has("cine1ra")) $("primera").checked = quiereOjos(+nombre.slice(2, 5));
  suaveOjos.reiniciar();
  offMovil.yaw = offMovil.pitch = 0;
  baseVRcam = null;
  if (!q.has("franjas")) $("franjas").checked = !C.sinFranjas;
  C.tOjo = null;
  baseVR1ra = null;
  const clip = demoGhidra(nombre)?.niebla_recorte?.clip;
  camCine.near = clip > 0 ? clip * ESCALA : .02;
  camCine.updateProjectionMatrix();
  C.salaInfo = elegida;
  C.desplazar = opciones.desplazar ?? elegida.desplazar ?? null;
  if (opciones.salas && !opciones.desplazar) {
    const ds = salaDeDatos(C.paquete, nombre);
    if (ds && opciones.salas.salas[0] === ds.salas[0]) {
      C.desplazar = ds.desplazar;
      elegida.giro = ds.giro;
      elegida.t = ds.t;
      elegida.datos = ds.datos;
    }
  }
  llenarSalas(C.paquete.slice(0, 2), elegida.salas);
  await cargarSalas(elegida.salas);
  sombrasDemo();
  C.extras = await armarExtras(THREE, bajar, +nombre.slice(2, 5));
  for (const x of C.extras) salas.add(x.grupo);
  if (eventos) {
    try {
      fx?.alCargarSala(elegida.salas[0] || null);
    } catch (e) {
      console.warn("efectos sala", e);
    }
    const materialOkimono = LUZ_JUEGO ? () => {
      const u = crearUniformsLuz();
      return {
        u: u,
        material: (tex, sp) => materialJuego(tex, sp, u)
      };
    } : null;
    try {
      C.ev = await eventos.preparar(+nombre.slice(2, 5), {
        sqt: sqt,
        personajes: C.personajes,
        padre: salas,
        fx: fx,
        sala: elegida.salas[0] || "",
        materialOkimono: materialOkimono
      });
    } catch (e) {
      console.warn("eventos de la demo", e);
      C.ev = null;
    }
    tEventos = null;
  }
  C.subs = await subtitulos(+nombre.slice(2, 5), $("subs").value);
  $("linea").max = sqt.n - 1;
  irA(opciones.cuadro ?? 0);
  apuntarLibre();
  const conModelo = C.personajes.filter(x => x.obj).length;
  C.resumen = `${nombre}.sdm v${sqt.version}: ${sqt.n} cuadros (${(sqt.n / FPS).toFixed(1)} s, n° ${sqt.ini}…${sqt.fin}), ` + `${sqt.luces.length} luces, ${sqt.modelos.length} personajes (${conModelo} con modelo)` + (C.audio ? "" : ", sin audio") + (C.subs.length ? `, ${C.subs.length} subtítulos` : "") + `\nsala: ${elegida.salas.join(", ") || "ninguna"}${elegida.salas[0] && nombreSala(elegida.salas[0]) ? " · " + nombreSala(elegida.salas[0]) : ""} (${elegida.fuente})` + "\n" + C.personajes.map(x => `${x.p.id}=${x.modelo ? (x.modelo.nombre || x.modelo.archivo) + (x.modelo.fuente === "esqueleto" ? "*" : "") : x.p.nHuesos > 2 ? "?" : "objeto"}${x.obj ? "" : " (huesos)"}`).join(" · ") + (C.personajes.some(x => x.modelo?.fuente === "esqueleto") ? "  (* reconocido por el esqueleto)" : "") + (avisos.length ? "\n" + avisos.join("\n") : "");
  estado(C.resumen);
  const resto = [ ...q ].filter(([k]) => ![ "paquete", "demo", "sala", "cuadro" ].includes(k)).map(([k, v]) => "&" + k + (v ? "=" + v : "")).join("");
  history.replaceState(null, "", `?paquete=${C.paquete}&demo=${nombre}` + (opciones.salas ? "&sala=" + elegida.salas.join(",") : "") + resto);
  document.title = `${nombre} · ${nombreMundo(C.paquete.slice(0, 2))} · SH4`;
  window.cine.listo = true;
  redibujar();
}

function sombrasDemo() {
  if (!C.demo) return;
  const id = +C.demo.slice(2, 5), half = esHalfDemo(id), sala = C.salas[0] || null;
  const conSala = sala && (half || opcionesLuzPj().cine === "sala");
  const luces = conSala ? lucesDeSombraSLGT(sala.luces) : null;
  for (const ent of C.personajes) if (ent.obj?.sombraJuego) sombraDemo(ent.obj, {
    id: id,
    luces: luces,
    grupo: conSala ? sala.grupo : null,
    forzadas: conSala && !half
  });
}

async function cargarSalas(lista) {
  for (const s of C.salas) {
    s.grupo.removeFromParent();
    s.dispose();
  }
  C.salas = [];
  for (const s of lista) {
    try {
      estado("cargando sala " + s + "…");
      const mitad = q.has("mitad") ? undefined : C.salaInfo?.datos?.mitad || undefined;
      const r = await armarSala(THREE, bajarSala, s, undefined, mitad ? {
        mitad: mitad
      } : {});
      salas.add(r.grupo);
      C.salas.push(r);
    } catch (err) {
      console.warn("sala", s, err);
    }
  }
  const giro = C.salaInfo?.giro || 0, t = C.salaInfo?.t || [ 0, 0, 0 ];
  if (C.desplazar) {
    const d = giro ? C.salaInfo.datos.offset : C.desplazar;
    salas.position.set(-d[0] * ESCALA, -d[1] * ESCALA, d[2] * ESCALA);
  } else salas.position.set(0, 0, 0);
  salas.rotation.set(0, giro, 0);
  for (const s of C.salas) s.grupo.position.set(giro ? t[0] * ESCALA : 0, giro ? t[1] * ESCALA : 0, giro ? -t[2] * ESCALA : 0);
  salas.updateMatrixWorld(true);
  grilla.visible = !C.salas.length;
  redibujar();
}

function crearEsqueleto(ent) {
  const p = ent.p, n = p.nHuesos;
  if (!n) return;
  if (!ent.padres) {
    const po = leerHuesos(C.sqt, p, 0);
    ent.padres = arbolMinimo(po);
  }
  const g = new THREE.Group;
  g.name = "esqueleto_" + p.id;
  const color = (new THREE.Color).setHSL(p.id * .137 % 1, .7, .55);
  const esf = new THREE.InstancedMesh(new THREE.SphereGeometry(n > 2 ? 3 : 8, 8, 6), new THREE.MeshBasicMaterial({
    color: color,
    depthTest: false,
    transparent: true,
    opacity: .85
  }), n);
  esf.frustumCulled = false;
  esf.renderOrder = 10;
  const lg = new THREE.BufferGeometry;
  lg.setAttribute("position", new THREE.BufferAttribute(new Float32Array(n * 6), 3));
  const lineas = new THREE.LineSegments(lg, new THREE.LineBasicMaterial({
    color: color,
    depthTest: false,
    transparent: true
  }));
  lineas.frustumCulled = false;
  lineas.renderOrder = 10;
  if (n <= 2) {
    const ej = new THREE.AxesHelper(25);
    ej.material.depthTest = false;
    ej.renderOrder = 11;
    g.add(ej);
    ent.ejes = ej;
  }
  g.add(esf, lineas);
  ent.esqueleto = g;
  ent.esferas = esf;
  ent.lineas = lineas;
  juego.add(g);
}

function arbolMinimo(po) {
  const n = po.n, padres = new Array(n).fill(-1), en = new Uint8Array(n);
  const d2 = (a, b) => (po.pos[a * 3] - po.pos[b * 3]) ** 2 + (po.pos[a * 3 + 1] - po.pos[b * 3 + 1]) ** 2 + (po.pos[a * 3 + 2] - po.pos[b * 3 + 2]) ** 2;
  en[0] = 1;
  for (let k = 1; k < n; k++) {
    let mejor = -1, de = -1, dm = Infinity;
    for (let i = 0; i < n; i++) if (en[i]) for (let j = 0; j < n; j++) if (!en[j]) {
      const d = d2(i, j);
      if (d < dm) {
        dm = d;
        mejor = j;
        de = i;
      }
    }
    if (mejor < 0) break;
    en[mejor] = 1;
    padres[mejor] = de;
  }
  return padres;
}

const _q = new THREE.Quaternion, _p = new THREE.Vector3, _s = new THREE.Vector3, _m = new THREE.Matrix4, _m2 = new THREE.Matrix4;

const _qJ = new THREE.Quaternion(0, 0, 1, 0);

const _qX = new THREE.Quaternion(1, 0, 0, 0);

const aThree = (v, out) => out.set(-v[0] * ESCALA, -v[1] * ESCALA, v[2] * ESCALA);

const _col = new THREE.Color, _dir = new THREE.Vector3;

let ultimoCuadroSub = -1;

const ANGULO_1RA = 2 * Math.atan(Math.tan(Math.PI / 6) * ASPECTO_JUEGO);

const _pOjo = new THREE.Vector3, _qOjo = new THREE.Quaternion, suaveOjos = crearSuavizado(THREE);

let saltoOjos = false, baseVR1ra = null;

function ambienteSala() {
  const l = C.salas[0]?.luces?.find(x => x.tipo === 1);
  return l ? l.color.map(v => v / 255) : null;
}

function aplicar(t) {
  const S = C.muestrear(t, !q.has("sininterp"));
  C.t = S.t;
  if (S.cam) {
    aThree(S.cam.pos, camCine.position);
    _q.set(S.cam.rot[0], S.cam.rot[1], S.cam.rot[2], S.cam.rot[3]);
    camCine.quaternion.copy(_qJ).multiply(_q).multiply(_qX);
    C.angulo = S.cam.angulo;
    ajustarCamCine();
  }
  const usarLuces = $("luces").checked && C.luces.length;
  lucesGrupo.visible = !LUZ_JUEGO && !!usarLuces;
  lucesRespaldo.visible = !LUZ_JUEGO && !usarLuces;
  const lucesJ = LUZ_JUEGO ? lucesDelJuego(C.sqt, S) : null;
  for (const x of C.extras || []) x.actualizar(S.t);
  try {
    avanzarEventos(S.t);
  } catch (e) {
    console.warn("eventos", e);
  }
  for (const o of C.ev?.objetos || []) if (o.uniformsLuz) {
    o.uniformsLuz.uLuzActiva.value = $("luces").checked ? 1 : 0;
    o.centroLuz ??= (new THREE.Box3).setFromObject(o.grupo).getCenter(new THREE.Vector3);
    aplicarLucesPersonaje(o.uniformsLuz, lucesJ, o.centroLuz, ambienteSala());
  }
  if (!LUZ_JUEGO) S.luces.forEach((s, i) => {
    const l = C.luces[i];
    if (!l) return;
    _col.setRGB(s.color[0], s.color[1], s.color[2], THREE.LinearSRGBColorSpace);
    const k = (s.params[0] || 0) * Math.PI;
    if (l.amb) {
      l.amb.color.copy(_col);
      l.amb.intensity = s.tipo === 1 ? k : 0;
    }
    if (l.dir) {
      l.dir.color.copy(_col);
      l.dir.intensity = s.tipo === 2 || s.tipo === 5 ? k : 0;
      _q.set(s.rot[0], s.rot[1], s.rot[2], s.rot[3]);
      _dir.set(0, 0, 1).applyQuaternion(_q);
      _dir.set(-_dir.x, -_dir.y, _dir.z);
      aThree(s.pos, l.dir.target.position);
      l.dir.position.copy(l.dir.target.position).addScaledVector(_dir, -1);
    }
    if (l.pun) {
      l.pun.color.copy(_col);
      l.pun.intensity = s.tipo === 3 || s.tipo === 4 || s.tipo === 6 ? k : 0;
      aThree(s.pos, l.pun.position);
    }
  });
  const verHuesos = $("huesos").checked;
  for (const ent of C.personajes) {
    const po = S.poses[ent.i];
    if (ent.obj && ent.uniformsLuz) {
      ent.uniformsLuz.uLuzActiva.value = $("luces").checked ? 1 : 0;
      aplicarLucesPersonaje(ent.uniformsLuz, lucesJ, po.tiene[0] ? aThree(po.pos, _p).clone() : null, ambienteSala());
    }
    if (ent.obj) {
      const hs = ent.obj.huesos;
      for (let h = 0; h < hs.length; h++) {
        if (po.tiene[h]) {
          _p.fromArray(po.pos, h * 3);
          _q.fromArray(po.rot, h * 4);
          _s.fromArray(po.esc, h * 3);
          hs[h].matrix.compose(_p, _q, _s);
        } else {
          const pa = ent.padres[h];
          if (pa >= 0 && pa < h) hs[h].matrix.multiplyMatrices(hs[pa].matrix, _m.copy(ent.bind[pa]).invert()).multiply(ent.bind[h]); else hs[h].matrix.copy(ent.bind[h]);
        }
        hs[h].matrixWorldNeedsUpdate = true;
      }
    }
    if (ent.esqueleto) {
      ent.esqueleto.visible = verHuesos || !ent.obj;
      if (ent.esqueleto.visible) {
        const a = ent.lineas.geometry.attributes.position.array;
        for (let h = 0; h < po.n; h++) {
          _p.fromArray(po.pos, h * 3);
          _m2.compose(_p, _q.fromArray(po.rot, h * 4), _s.set(1, 1, 1));
          ent.esferas.setMatrixAt(h, _m2);
          const pa = ent.padres[h] >= 0 ? ent.padres[h] : h;
          a.set(po.pos.subarray(h * 3, h * 3 + 3), h * 6);
          a.set(po.pos.subarray(pa * 3, pa * 3 + 3), h * 6 + 3);
        }
        if (ent.ejes) {
          ent.ejes.position.fromArray(po.pos, 0);
          ent.ejes.quaternion.fromArray(po.rot, 0);
        }
        ent.esferas.instanceMatrix.needsUpdate = true;
        ent.lineas.geometry.attributes.position.needsUpdate = true;
      }
    }
  }
  const hen = $("primera").checked && !C.sinFranjas ? C.personajes.find(e => e.ojo && e.obj) : null;
  for (const e of C.personajes) if (e.ojo && e.obj) e.obj.grupo.visible = !hen;
  if (hen) {
    poseOjos(THREE, hen.ojo, hen.obj.huesos[HUESO_CABEZA].matrix, _pOjo, _qOjo);
    const dt = (C.tocando || C.exportando) && C.tOjo != null ? (S.t - C.tOjo) / FPS : -1;
    C.tOjo = S.t;
    if (suaveOjos.paso(_pOjo, _qOjo, dt)) saltoOjos = true;
    camCine.position.copy(suaveOjos.p);
    camCine.quaternion.copy(suaveOjos.q);
    C.angulo = ANGULO_1RA;
    ajustarCamCine();
  } else C.tOjo = null;
  C.henry1ra = hen;
  const f = Math.floor(S.t);
  if (f !== ultimoCuadroSub) {
    ultimoCuadroSub = f;
    mostrarSub(C.subs.filter(s => f >= s.ini && f < s.fin).map(s => s.texto).join("\n"));
  }
  $("linea").value = f;
  const seg = S.t / FPS;
  $("reloj").textContent = `cuadro ${f} / ${C.sqt.n - 1} · n° ${numeroCuadro(C.sqt, f)} · ${Math.floor(seg / 60)}:${(seg % 60).toFixed(1).padStart(4, "0")}` + (S.corte ? " · corte" : "");
  redibujar();
}

let subActual = "";

const JW = 640, JH = 448, FRANJA_J = JH * ALTO_FRANJA, INTERLINEA_J = 24;

function yTextoJuego(n, alto = JH) {
  const h = 20 + (n - 1) * INTERLINEA_J;
  return alto === JH ? Math.min(JH - FRANJA_J + (FRANJA_J - h) / 2, JH - h - 6) : (alto - h) / 2;
}

function escribirSub(g, texto, escala, altoVirtual) {
  if (!texto) return;
  const lineas = texto.split("\n").slice(-3);
  const y = yTextoJuego(lineas.length, altoVirtual);
  if (fuenteJuego) fuenteJuego.escribir(g, lineas.join("\n"), JW / 2, y, {
    escala: escala,
    alinear: "centro",
    interlinea: INTERLINEA_J
  }); else {
    g.save();
    g.font = `${Math.round(18 * escala)}px Georgia, serif`;
    g.textAlign = "center";
    g.textBaseline = "top";
    g.fillStyle = "#fff";
    g.shadowColor = "#000";
    g.shadowBlur = 3 * escala;
    lineas.forEach((l, i) => g.fillText(l, JW / 2 * escala, (y + i * INTERLINEA_J) * escala));
    g.restore();
  }
}

let claveSub = "";

function pintarSubPantalla(area) {
  const el = $("subt"), oculto = $("subs").value === "no" || !subActual;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const clave = [ subActual, area.x, area.y, area.w, area.h, dpr, oculto ].join("|");
  if (clave === claveSub) return;
  claveSub = clave;
  el.style.display = oculto ? "none" : "";
  if (oculto) return;
  el.style.left = area.x + "px";
  el.style.top = area.y + "px";
  el.style.width = area.w + "px";
  el.style.height = area.h + "px";
  el.width = Math.max(1, Math.round(area.w * dpr));
  el.height = Math.max(1, Math.round(area.h * dpr));
  const g = el.getContext("2d");
  g.clearRect(0, 0, el.width, el.height);
  const esc = Math.min(el.width / JW, el.height / JH);
  g.save();
  g.translate((el.width - JW * esc) / 2, el.height - JH * esc);
  escribirSub(g, subActual, esc, JH);
  g.restore();
}

function mostrarSub(texto) {
  if (texto === subActual) return;
  subActual = texto;
  claveSub = "";
  const c = lienzoSub.getContext("2d");
  c.clearRect(0, 0, lienzoSub.width, lienzoSub.height);
  if (texto) {
    const esc = lienzoSub.width / JW, n = Math.min(3, texto.split("\n").length);
    const anchoTxt = fuenteJuego ? Math.max(...texto.split("\n").slice(-3).map(l => fuenteJuego.anchoLinea(l))) : JW * .8;
    const h = 20 + (n - 1) * INTERLINEA_J, y0 = yTextoJuego(n, lienzoSub.height / esc);
    c.fillStyle = "rgba(0,0,0,0.45)";
    c.fillRect((JW / 2 - anchoTxt / 2 - 10) * esc, (y0 - 6) * esc, (anchoTxt + 20) * esc, (h + 12) * esc);
    escribirSub(c, texto, esc, lienzoSub.height / esc);
  }
  texSub.needsUpdate = true;
  cartelSub.visible = !!texto;
}

function fovVertical(aspecto) {
  const a = C.angulo || 1.0472;
  if (q.get("fov") === "v") return THREE.MathUtils.radToDeg(a);
  return THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(a / 2) / ASPECTO_JUEGO));
}

function ajustarCamCine(aspecto = camCine.aspect) {
  let fov = fovVertical(aspecto);
  if (C.mantenerAncho && aspecto < ASPECTO_JUEGO) fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(fov) / 2) * ASPECTO_JUEGO / aspecto));
  camCine.fov = fov;
  camCine.aspect = aspecto;
  camCine.updateProjectionMatrix();
}

function apuntarLibre() {
  const S = C.muestrear(C.t), c = new THREE.Vector3, v = new THREE.Vector3;
  let n = 0;
  S.poses.forEach((po, i) => {
    if (C.personajes[i]?.p.nHuesos > 2 && po.tiene[0]) {
      c.add(aThree(po.pos, v));
      n++;
    }
  });
  if (n) c.divideScalar(n); else c.copy(camCine.position).add(new THREE.Vector3(0, 0, -1).applyQuaternion(camCine.quaternion));
  orbita.target.copy(c);
  grilla.position.set(c.x, 0, c.z);
  const atras = camCine.position.clone().sub(c).setLength(camCine.position.distanceTo(c) + .8);
  camLibre.position.copy(c).add(atras).add(new THREE.Vector3(0, .4, 0));
  orbita.update();
}

let actx = null, fuente = null, relojInicio = 0, tInicio = 0, usaAudio = false;

function contextoAudio() {
  if (!actx) {
    try {
      actx = new AudioContext({
        sampleRate: 48e3
      });
    } catch {
      actx = null;
    }
  }
  if (actx?.state === "suspended") actx.resume();
  return actx;
}

function ahora() {
  return performance.now() / 1e3;
}

function tocar() {
  if (!C.sqt || C.tocando) return;
  if (C.t >= C.sqt.n - 1) C.t = 0;
  C.tocando = true;
  $("play").textContent = "⏸";
  tInicio = C.t;
  usaAudio = false;
  const ctx = C.audio && contextoAudio();
  if (ctx && C.audio) {
    if (!C.audioBuffer || C.audioBuffer.demo !== C.demo) {
      const a = C.audio, b = ctx.createBuffer(a.canales.length, a.canales[0].length, a.frecuencia);
      a.canales.forEach((ch, i) => b.copyToChannel(ch, i));
      C.audioBuffer = b;
      b.demo = C.demo;
    }
    fuente = ctx.createBufferSource();
    fuente.buffer = C.audioBuffer;
    fuente.connect(ctx.destination);
    const off = tInicio / FPS;
    if (off < C.audioBuffer.duration) fuente.start(0, off);
    usaAudio = ctx.state === "running";
  }
  relojInicio = ahora();
}

function pausar() {
  C.tocando = false;
  $("play").textContent = "▶";
  try {
    fuente?.stop();
  } catch {}
  fuente = null;
}

function irA(t) {
  const seguia = C.tocando;
  if (seguia) pausar();
  aplicar(Math.max(0, Math.min(C.sqt.n - 1, t)));
  if (seguia) tocar();
}

function areaJuego() {
  const W = innerWidth, H = innerHeight;
  if ($("ancho").checked) return {
    x: 0,
    y: 0,
    w: W,
    h: H
  };
  let w = W, h = W / ASPECTO_JUEGO;
  if (h > H) {
    h = H;
    w = H * ASPECTO_JUEGO;
  }
  return {
    x: (W - w) / 2,
    y: (H - h) / 2,
    w: w,
    h: h
  };
}

function dibujarCine(destinoW, destinoH, area, cam = camCine) {
  renderer.setScissorTest(false);
  renderer.setViewport(0, 0, destinoW, destinoH);
  renderer.clear();
  if (cam === camCine) ajustarCamCine(area.w / area.h); else {
    cam.aspect = area.w / area.h;
    cam.updateProjectionMatrix();
  }
  renderer.setViewport(area.x, area.y, area.w, area.h);
  if ($("franjas").checked) {
    const fr = area.h * ALTO_FRANJA * ($("ancho").checked && area.w / area.h > ASPECTO_JUEGO ? 0 : 1);
    renderer.setScissor(area.x, area.y + fr, area.w, area.h - 2 * fr);
  } else renderer.setScissor(area.x, area.y, area.w, area.h);
  renderer.setScissorTest(true);
  ayudaCam.visible = false;
  const qAntes = camCine.quaternion.clone(), conOff = cam === camCine && conDesvio();
  if (conOff) desviar(camCine.quaternion);
  if (pantallaActiva(C.pantalla) && !q.has("sinpantalla")) pantallaDemo.dibujar(escena, cam, area, C.pantalla, $("franjas").checked); else renderer.render(escena, cam);
  if (conOff) camCine.quaternion.copy(qAntes);
  renderer.setScissorTest(false);
}

const conDesvio = () => $("movil").checked && $("modo").value === "cine" && !!(offMovil.yaw || offMovil.pitch);

function desviar(qu) {
  _eOff.set(0, offMovil.yaw, 0);
  qu.premultiply(_qOff.setFromEuler(_eOff));
  _eOff.set(offMovil.pitch, 0, 0);
  qu.multiply(_qOff.setFromEuler(_eOff));
  return qu;
}

function vistaActual() {
  if ($("modo").value === "libre") return {
    cam: camLibre
  };
  const qv = camCine.quaternion.clone();
  if (conDesvio()) desviar(qv);
  return {
    pos: camCine.position.clone(),
    quat: qv,
    fov: camCine.fov,
    near: camCine.near,
    aspecto: camCine.aspect
  };
}

function dibujarEnTextura() {
  ajustarCamCine(rt.width / rt.height);
  rt.scissorTest = false;
  rt.viewport.set(0, 0, rt.width, rt.height);
  renderer.setRenderTarget(rt);
  for (const f of franjasVR) f.visible = $("franjas").checked;
  ayudaCam.visible = false;
  renderer.render(escena, camCine);
}

function posicionarSub(area) {
  pintarSubPantalla(area);
}

const fotoCine = prepararFotoCine({
  renderer: renderer,
  escena: escena,
  salas: salas,
  camCine: camCine,
  vista: vistaActual,
  demo: () => C.demo && C.sqt ? {
    id: +C.demo.slice(2, 5),
    nom: C.demo,
    seg: C.t / FPS,
    personajes: C.personajes
  } : null,
  sala: () => C.salas[0]?.nombre || "",
  fuente: () => fuenteJuego,
  efectos: () => fx,
  audio: () => actx,
  parar: () => {
    const seguia = C.tocando;
    if (seguia) pausar();
    return seguia;
  },
  seguir: tocar,
  redibujar: redibujar
});

$("botonFoto")?.addEventListener("click", e => {
  e.currentTarget.blur();
  fotoCine.entrar();
});

const videoCine = prepararVideoCine({
  C: C,
  renderer: renderer,
  escena: escena,
  camCine: camCine,
  camLibre: camLibre,
  ayudaCam: ayudaCam,
  $: $,
  FPS: FPS,
  JW: JW,
  JH: JH,
  aplicar: aplicar,
  dibujarCine: dibujarCine,
  pausar: pausar,
  redibujar: redibujar,
  escribirSub: escribirSub,
  sub: () => subActual,
  anchoSub: t => fuenteJuego ? Math.max(...t.split("\n").slice(-3).map(l => fuenteJuego.anchoLinea(l))) : JW * .8,
  fotoCam: () => fotoCine.foto.estado.entradas > 0 ? fotoCine.foto.camara : null,
  reiniciarOjos: () => {
    suaveOjos.reiniciar();
    C.tOjo = null;
  }
});

$("botonVideo")?.addEventListener("click", e => {
  e.currentTarget.blur();
  videoCine.abrir();
});

const reloj = new THREE.Clock;

renderer.setAnimationLoop(() => {
  const dt = reloj.getDelta();
  if (C.exportando) return;
  if (fotoCine.cuadro(dt)) return;
  if (C.tocando && C.sqt) {
    const t = tInicio + (ahora() - relojInicio) * FPS;
    if (t >= C.sqt.n - 1) {
      aplicar(C.sqt.n - 1);
      pausar();
    } else aplicar(t);
  }
  $("subt").classList.toggle("oculto", renderer.xr.isPresenting || !!probarVR);
  if (renderer.xr.isPresenting) {
    dibujarVR(dt);
    return;
  }
  if (probarVR) {
    if (quieto) {
      if (sucio <= 0) return;
      sucio--;
    }
    renderer.setViewport(0, 0, innerWidth, innerHeight);
    camVR.aspect = innerWidth / innerHeight;
    camVR.updateProjectionMatrix();
    dibujarVR(dt);
    return;
  }
  if (quieto) {
    if (sucio <= 0) return;
    sucio--;
  }
  const modo = $("modo").value;
  if (modo === "cine") {
    const area = areaJuego();
    dibujarCine(innerWidth, innerHeight, area);
    posicionarSub(area);
  } else {
    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, innerWidth, innerHeight);
    renderer.clear();
    ayudaCam.visible = true;
    ajustarCamCine(ASPECTO_JUEGO);
    ayudaCam.update();
    renderer.render(escena, camLibre);
    posicionarSub({
      x: 0,
      y: 0,
      w: innerWidth,
      h: innerHeight - 50
    });
  }
});

const _v = new THREE.Vector3;

if (probarVR) {
  $("vrmodo").value = probarVR === "adentro" ? "adentro" : "cine";
  camVR.position.set(0, 1.6, 0);
}

function dibujarVR(dt = 1 / 72) {
  const modo = $("vrmodo").value;
  const destino = modo === "cine" ? cineVR : escena;
  if (jugador.parent !== destino) destino.add(jugador);
  cascoVR.actualizar(dt, {
    moviendo: false
  });
  listaVR.actualizar(dt);
  jugador.updateMatrixWorld(true);
  if (modo === "cine") {
    const xr = renderer.xr.enabled, previo = renderer.getRenderTarget();
    renderer.xr.enabled = false;
    dibujarEnTextura();
    renderer.setRenderTarget(previo);
    renderer.xr.enabled = xr;
    if (cartelSub.parent !== cineVR) {
      cineVR.add(cartelSub);
      cartelSub.position.set(0, .12, -4.15);
      cartelSub.scale.setScalar(1.6);
      cartelSub.quaternion.identity();
    }
    renderer.render(cineVR, camVR);
  } else {
    if (C.henry1ra) {
      if (!baseVR1ra || saltoOjos) baseVR1ra = {
        q: camVR.quaternion.clone(),
        p: camVR.position.clone()
      };
      saltoOjos = false;
      ubicarRig(THREE, jugador, baseVR1ra, camCine.position, camCine.quaternion, {
        soloGiro: true
      });
      baseVRcam = null;
    } else {
      baseVR1ra = null;
      if (opciones().vistaCineVR !== false && C.sqt) {
        const corte = !baseVRcam || baseVRcam.pAnt.distanceTo(camCine.position) > 40 * ESCALA || Math.abs(baseVRcam.qAnt.dot(camCine.quaternion)) < .97;
        if (corte) baseVRcam = {
          q: camVR.quaternion.clone(),
          p: camVR.position.clone(),
          pCorte: camCine.position.clone(),
          piso: pisoDebajo(camCine.position),
          pAnt: new THREE.Vector3,
          qAnt: new THREE.Quaternion
        };
        ubicarRig(THREE, jugador, baseVRcam, camCine.position, camCine.quaternion, {
          soloGiro: true,
          y: baseVRcam.piso + (camCine.position.y - baseVRcam.pCorte.y)
        });
        baseVRcam.pAnt.copy(camCine.position);
        baseVRcam.qAnt.copy(camCine.quaternion);
      } else baseVRcam = null;
    }
    if (cartelSub.parent !== escena) {
      escena.add(cartelSub);
      cartelSub.scale.setScalar(1);
    }
    const cx = renderer.xr.isPresenting ? renderer.xr.getCamera() : camVR;
    cx.getWorldDirection(_v);
    _v.y = Math.max(-.4, Math.min(.2, _v.y));
    _v.normalize();
    const meta = cx.getWorldPosition(new THREE.Vector3).addScaledVector(_v, 1.6).add(new THREE.Vector3(0, -.45, 0));
    cartelSub.position.lerp(meta, .12);
    cartelSub.lookAt(cx.getWorldPosition(new THREE.Vector3));
    renderer.render(escena, camVR);
  }
}

const rayo = new THREE.Raycaster;

function pisoDebajo(pos) {
  let piso = null;
  const cols = C.salas.map(s => s.colision).filter(Boolean);
  rayo.set(pos.clone().add(new THREE.Vector3(0, .3, 0)), new THREE.Vector3(0, -1, 0));
  rayo.far = 6;
  for (const c of cols) {
    const h = rayo.intersectObject(c).find(x => Math.abs(x.face.normal.y) > .6);
    if (h && (piso === null || h.point.y > piso)) piso = h.point.y;
  }
  if (piso === null) {
    let minY = Infinity;
    for (const ent of C.personajes) if (ent.obj) {
      const b = (new THREE.Box3).setFromObject(ent.obj.grupo);
      if (!b.isEmpty()) minY = Math.min(minY, b.min.y);
    }
    piso = Number.isFinite(minY) ? minY : pos.y - 1.6;
  }
  return piso;
}

function pararseEnLaCamara() {
  const pos = camCine.position.clone();
  let piso = null;
  const cols = C.salas.map(s => s.colision).filter(Boolean);
  rayo.set(pos.clone().add(new THREE.Vector3(0, .3, 0)), new THREE.Vector3(0, -1, 0));
  rayo.far = 6;
  for (const c of cols) {
    const h = rayo.intersectObject(c).find(x => Math.abs(x.face.normal.y) > .6);
    if (h && (piso === null || h.point.y > piso)) piso = h.point.y;
  }
  if (piso === null) {
    let minY = Infinity;
    for (const ent of C.personajes) if (ent.obj) {
      const b = (new THREE.Box3).setFromObject(ent.obj.grupo);
      if (!b.isEmpty()) minY = Math.min(minY, b.min.y);
    }
    piso = Number.isFinite(minY) ? minY : 0;
  }
  const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(camCine.quaternion);
  jugador.position.set(pos.x, piso, pos.z);
  jugador.rotation.set(0, Math.atan2(-dir.x, -dir.z), 0);
}

function aplicarCineVR() {
  const m = cineVRop();
  if (!m) return;
  if (!q.has("vr")) $("vrmodo").value = m === "pantalla" ? "cine" : "adentro";
  if (C.demo && !q.has("cine1ra")) $("primera").checked = quiereOjos(+C.demo.slice(2, 5));
  suaveOjos.reiniciar();
  baseVR1ra = null;
  baseVRcam = null;
  C.tOjo = null;
  if ($("vrmodo").value === "adentro") pararseEnLaCamara(); else {
    jugador.position.set(0, 0, 0);
    jugador.rotation.set(0, 0, 0);
  }
  if (C.sqt) aplicar(C.t);
  redibujar();
  listaVR?.refrescar();
}

renderer.xr.addEventListener("sessionstart", () => {
  contextoAudio();
  globalThis.__sh4EnVR = true;
  if ($("vrmodo").value === "adentro") pararseEnLaCamara(); else {
    jugador.position.set(0, 0, 0);
    jugador.rotation.set(0, 0, 0);
  }
  aplicarCineVR();
});

addEventListener("sh4opciones", () => {
  if (renderer.xr.isPresenting) setTimeout(aplicarCineVR, 0);
});

for (let i = 0; i < 2; i++) {
  const ctl = renderer.xr.getController(i);
  ctl.addEventListener("selectstart", () => {
    if (listaVR.fueParaLaLista()) return;
    C.tocando ? pausar() : tocar();
  });
  ctl.addEventListener("squeezestart", () => {
    if ($("vrmodo").value === "adentro") pararseEnLaCamara();
  });
  jugador.add(ctl);
}

const cascoVR = prepararCasco({
  renderer: renderer,
  camara: camVR,
  padre: jugador,
  ojos: 1.6
});

renderer.xr.addEventListener("sessionend", () => {
  jugador.removeFromParent();
  globalThis.__sh4EnVR = false;
});

renderer.xr.addEventListener("sessionstart", () => {
  globalThis.__sh4EnVR = true;
  nivelVR = "mundos";
  setTimeout(() => listaVR.abrir(), 500);
});

const PAQS_VR = () => [ ...$("paquete").options ].map(o => o.value);

let nivelVR = "demos", MINI = null, cargandoVR = null;

indiceMiniaturas().then(i => {
  MINI = i;
  listaVR?.refrescar();
});

const prefPaq = p => String(p || "").slice(0, 2);

const nombreDemoVR = demo => {
  const e = DS?.demos?.[prefPaq(C.paquete) + "/" + demo];
  return e?.sala && nombreSala(e.sala) || demo;
};

const fotoDemoVR = (paq, demo) => urlMiniatura(MINI, "cine", prefPaq(paq) + "_" + demo);

const COMO_VR = [ {
  id: "pantalla",
  texto: "Pantalla de cine",
  dato: "Delante tuyo, sin moverte"
}, {
  id: "adentro",
  texto: "Adentro de la escena",
  dato: "Donde está la cámara"
}, {
  id: "ojos",
  texto: "Ojos de Henry",
  dato: "Si no está, la cámara"
} ];

const comoActualVR = () => $("vrmodo").value === "cine" ? "pantalla" : $("primera").checked ? "ojos" : "adentro";

function verComoVR(m) {
  $("vrmodo").value = m === "pantalla" ? "cine" : "adentro";
  $("vrmodo").dispatchEvent(new Event("change"));
  const ojos = m === "ojos" && !(C.demo && SIEMPRE_CAMARA.has(+C.demo.slice(2, 5)));
  if ($("primera").checked !== ojos) {
    $("primera").checked = ojos;
    $("primera").dispatchEvent(new Event("change"));
  }
}

const listaVR = crearListaVR({
  THREE: THREE,
  renderer: renderer,
  camara: camVR,
  jugador: jugador,
  ancho: 1.5,
  distancia: 1.15,
  abajo: .1,
  curvo: true,
  grilla: true,
  columnas: 4,
  filasGrilla: 3,
  titulo: () => nivelVR === "mundos" ? trC("CINEMÁTICAS") : nivelVR === "demos" ? trC("CINEMÁTICAS") + " - " + nombreMundo(prefPaq(C.paquete)) : trC("¿Cómo la ves?") + " - " + nombreDemoVR($("demo").value),
  filas: () => {
    if (nivelVR === "mundos") return PAQS_VR().map(p => {
      const n = MINI?.cine ? [ ...MINI.cine ].filter(k => k.startsWith(prefPaq(p) + "_")).length : 0;
      return {
        texto: nombreMundo(prefPaq(p)),
        dato: n ? n + " " + trC("cinemáticas") : p,
        img: urlMiniatura(MINI, "mundos", prefPaq(p)),
        marcada: p === C.paquete
      };
    });
    if (nivelVR === "como") {
      const img = fotoDemoVR(C.paquete, $("demo").value), m = comoActualVR();
      return COMO_VR.map(x => ({
        texto: trC(x.texto),
        dato: trC(x.dato),
        img: img,
        marcada: x.id === m
      }));
    }
    return [ ...$("demo").options ].map(o => ({
      texto: nombreDemoVR(o.value),
      dato: o.textContent.split(" · ").slice(0, 2).join(" · "),
      sinFoto: o.value,
      img: fotoDemoVR(C.paquete, o.value),
      marcada: o.value === C.demo
    }));
  },
  alElegir: async i => {
    if (nivelVR === "mundos") {
      const p = PAQS_VR()[i];
      if (!p) return;
      if (p !== C.paquete) {
        $("paquete").value = p;
        await abrirPaquete(p);
      }
      nivelVR = "demos";
      listaVR.irA(Math.max(0, [ ...$("demo").options ].findIndex(o => o.value === C.demo)));
    } else if (nivelVR === "demos") {
      const o = $("demo").options[i];
      if (!o) return;
      $("demo").value = o.value;
      cargandoVR = o.value === C.demo ? null : abrirDemo(o.value);
      nivelVR = "como";
      listaVR.irA(Math.max(0, COMO_VR.findIndex(x => x.id === comoActualVR())));
    } else {
      const m = COMO_VR[i]?.id;
      if (!m) return;
      await cargandoVR;
      cargandoVR = null;
      verComoVR(m);
      nivelVR = "demos";
      listaVR.cerrar();
      irA(0);
      tocar();
    }
    listaVR.refrescar();
  },
  alVolver: () => {
    if (nivelVR === "mundos") return false;
    nivelVR = nivelVR === "como" ? "demos" : "mundos";
    listaVR.irA(0);
    return true;
  },
  botones: () => [ {
    id: "play",
    texto: C.tocando ? trC("Pausa") : trC("Play")
  }, {
    id: "inicio",
    texto: trC("Desde el principio")
  }, {
    id: "vista",
    texto: $("vrmodo").value === "cine" ? trC("Vista: cine") : trC("Vista: adentro")
  }, {
    id: "ojos",
    texto: $("primera").checked ? trC("Ojos de Henry") : trC("Cámara de la escena"),
    activo: $("primera").checked
  }, nivelVR === "mundos" ? null : {
    id: "volver",
    texto: trC("Volver")
  }, {
    id: "salir",
    texto: trC("Salir del casco")
  } ].filter(Boolean),
  alBoton: async id => {
    if (id === "play") C.tocando ? pausar() : tocar(); else if (id === "inicio") irA(0); else if (id === "vista") {
      $("vrmodo").value = $("vrmodo").value === "cine" ? "adentro" : "cine";
      $("vrmodo").dispatchEvent(new Event("change"));
    } else if (id === "ojos") {
      $("primera").checked = !$("primera").checked;
      $("primera").dispatchEvent(new Event("change"));
    } else if (id === "volver") listaVR.volver(); else if (id === "salir") {
      try {
        await (renderer.xr.getSession()?.end());
      } catch {}
    }
    listaVR.refrescar();
  }
});

$("vrmodo").addEventListener("change", () => {
  if (renderer.xr.isPresenting && $("vrmodo").value === "adentro") pararseEnLaCamara(); else if (renderer.xr.isPresenting) {
    jugador.position.set(0, 0, 0);
    jugador.rotation.set(0, 0, 0);
  }
});

let tUI = performance.now();

const verUI = () => {
  tUI = performance.now();
  document.body.classList.remove("sinUI");
};

for (const ev of [ "mousemove", "pointerdown", "keydown", "touchstart", "wheel" ]) addEventListener(ev, verUI, {
  passive: true
});

setInterval(() => {
  const encima = document.querySelector("#panel:hover, #barra:hover");
  document.body.classList.toggle("sinUI", !!(C.tocando && !renderer.xr.isPresenting && !encima && performance.now() - tUI > 2500));
}, 300);

{
  const lab = document.createElement("label");
  lab.innerHTML = '<input type="checkbox" id="primera"> 1ra persona (P)';
  $("huesos").closest("label").after(lab);
  $("primera").checked = q.has("cine1ra") && q.get("cine1ra") !== "0";
  const ay = $("ayuda");
  if (ay) ay.textContent = ay.textContent.replace(" · T subtítulos", " · T subtítulos · P 1ra persona (ojos de Henry)");
}

$("primera").addEventListener("change", () => {
  suaveOjos.reiniciar();
  baseVR1ra = null;
  baseVRcam = null;
  C.tOjo = null;
  if (C.demo && !renderer.xr.isPresenting) guardarEleccion(+C.demo.slice(2, 5), $("primera").checked);
  if (C.sqt) aplicar(C.t);
  redibujar();
  listaVR.refrescar();
});

$("movil").checked = q.has("cinemovil") || (() => {
  try {
    return localStorage.getItem("sh4camcineMovil") === "1";
  } catch {
    return false;
  }
})();

$("movilTxt").textContent = trC("cámara móvil (arrastrá)");

$("redondearTxt").textContent = trC("redondear (U)");

$("movil").addEventListener("change", () => {
  offMovil.yaw = offMovil.pitch = 0;
  try {
    localStorage.setItem("sh4camcineMovil", $("movil").checked ? "1" : "0");
  } catch {}
  redibujar();
});

let arrastre = null;

renderer.domElement.addEventListener("pointerdown", e => {
  if ($("movil").checked && $("modo").value === "cine" && !renderer.xr.isPresenting) {
    arrastre = {
      x: e.clientX,
      y: e.clientY
    };
    try {
      renderer.domElement.setPointerCapture(e.pointerId);
    } catch {}
  }
});

renderer.domElement.addEventListener("pointermove", e => {
  if (!arrastre) return;
  offMovil.yaw = THREE.MathUtils.clamp(offMovil.yaw - (e.clientX - arrastre.x) * .005, -Math.PI * .75, Math.PI * .75);
  offMovil.pitch = THREE.MathUtils.clamp(offMovil.pitch - (e.clientY - arrastre.y) * .005, -1.1, 1.1);
  arrastre.x = e.clientX;
  arrastre.y = e.clientY;
  redibujar();
});

for (const ev of [ "pointerup", "pointercancel" ]) renderer.domElement.addEventListener(ev, () => {
  arrastre = null;
});

renderer.domElement.addEventListener("dblclick", () => {
  offMovil.yaw = offMovil.pitch = 0;
  redibujar();
});

$("redondear").checked = !!globalThis.sh4Redondeo?.activo;

$("redondear").addEventListener("change", e => {
  globalThis.sh4Redondeo?.poner(e.target.checked);
  redibujar();
});

addEventListener("keydown", e => {
  if (e.code === "KeyU") setTimeout(() => {
    $("redondear").checked = !!globalThis.sh4Redondeo?.activo;
    redibujar();
  }, 0);
});

$("play").addEventListener("click", () => C.tocando ? pausar() : tocar());

$("inicio").addEventListener("click", () => irA(0));

$("atras").addEventListener("click", () => irA(Math.floor(C.t) - 1));

$("adelante").addEventListener("click", () => irA(Math.floor(C.t) + 1));

$("linea").addEventListener("input", e => irA(+e.target.value));

$("paquete").addEventListener("change", async e => {
  await abrirPaquete(e.target.value);
  await abrirDemo($("demo").value);
});

$("demo").addEventListener("change", e => abrirDemo(e.target.value));

for (const [k, id] of [ [ "eileen", "trajeEileen" ], [ "cynthia", "trajeCynthia" ] ]) {
  $(id).value = trajes[k] ? "1" : "";
  $(id).addEventListener("change", async e => {
    if (e.target.value) trajes[k] = 1; else delete trajes[k];
    try {
      localStorage.setItem("sh4trajes", JSON.stringify(trajes));
    } catch {}
    if (!C.demo) return;
    const t = C.t, seguia = C.tocando;
    await abrirDemo(C.demo);
    irA(Math.min(Math.floor(t), C.sqt.n - 1));
    if (seguia) tocar();
  });
}

$("sala").addEventListener("change", async e => {
  const s = e.target.value ? [ e.target.value ] : [];
  C.salaInfo = {
    salas: s,
    fuente: "elegida a mano"
  };
  await cargarSalas(s);
  q.set("sala", s.join(",") || "ninguna");
  history.replaceState(null, "", "?" + q.toString().replace(/=(&|$)/g, "$1"));
  estado(C.resumen?.replace(/\nsala: .*/, `\nsala: ${s.join(", ") || "ninguna"} (elegida a mano)`));
});

$("subs").addEventListener("change", async () => {
  C.subs = C.demo ? await subtitulos(+C.demo.slice(2, 5), $("subs").value) : [];
  ultimoCuadroSub = -1;
  aplicar(C.t);
});

for (const id of [ "franjas", "luces", "huesos", "ancho", "modo" ]) $(id).addEventListener("change", () => {
  aplicar(C.t);
  redibujar();
});

addEventListener("keydown", e => {
  if (e.target.tagName === "SELECT" || e.target.tagName === "INPUT" && e.target.type !== "range" && e.target.type !== "checkbox") return;
  const paso = e.shiftKey ? FPS : 1;
  if (e.code === "Space") {
    e.preventDefault();
    C.tocando ? pausar() : tocar();
  }
  if (e.code === "ArrowRight") {
    e.preventDefault();
    irA(Math.floor(C.t) + paso);
  }
  if (e.code === "ArrowLeft") {
    e.preventDefault();
    irA(Math.floor(C.t) - paso);
  }
  if (e.code === "Home") irA(0);
  const alternar = id => {
    $(id).checked = !$(id).checked;
    aplicar(C.t);
  };
  if (e.code === "KeyB") alternar("franjas");
  if (e.code === "KeyH") alternar("huesos");
  if (e.code === "KeyL") alternar("luces");
  if (e.code === "KeyP" || e.code === "KeyV" && !e.repeat) {
    $("primera").checked = !$("primera").checked;
    $("primera").dispatchEvent(new Event("change"));
  }
  if (e.code === "KeyM") {
    $("modo").value = $("modo").value === "cine" ? "libre" : "cine";
    redibujar();
  }
  if (e.code === "KeyG" && !e.repeat) videoCine.abrir();
  if (e.code === "KeyT") {
    const s = $("subs");
    s.selectedIndex = (s.selectedIndex + 1) % s.options.length;
    s.dispatchEvent(new Event("change"));
  }
});

if (q.has("limpio")) for (const id of [ "panel", "ayuda", "barra", "VRButton" ]) document.getElementById(id)?.classList.add("oculto");

if (q.has("libre")) $("modo").value = "libre";

if (q.has("huesos")) $("huesos").checked = true;

if (q.get("franjas") === "0") $("franjas").checked = false;

if (q.get("luces") === "0") $("luces").checked = false;

if (q.has("ancho")) $("ancho").checked = true;

if (q.get("subs")) $("subs").value = q.get("subs"); else if (opciones().subtitulos === false) $("subs").value = "no";

if (q.get("vr") === "adentro") $("vrmodo").value = "adentro";

const paq0 = q.get("paquete") ? q.get("paquete").endsWith(".sh4") ? q.get("paquete") : q.get("paquete") + ".sh4" : "rl.sh4";

$("paquete").value = paq0;

const salaQ = q.get("sala");

const desplazarQ = q.get("desplazar")?.split(",").map(Number);

try {
  await abrirPaquete(paq0);
  const d0 = q.get("demo") && [ ...$("demo").options ].some(o => o.value === q.get("demo")) ? q.get("demo") : $("demo").options[0]?.value;
  $("demo").value = d0;
  await abrirDemo(d0, {
    cuadro: q.has("cuadro") ? +q.get("cuadro") : 0,
    salas: salaQ ? {
      salas: salaQ === "ninguna" ? [] : salaQ.split(","),
      fuente: "de la dirección"
    } : undefined,
    desplazar: desplazarQ?.length === 3 ? desplazarQ : undefined
  });
  if (q.has("tocar")) tocar();
  if (probarVR === "adentro") pararseEnLaCamara();
} catch (err) {
  estado("error: " + err.message);
  console.error(err);
}

Object.assign(window.cine, {
  ir: f => {
    irA(f);
    return C.t;
  },
  abrir: async (paq, demo, opciones) => {
    if (paq !== C.paquete) {
      await abrirPaquete(paq);
      $("paquete").value = paq;
    }
    $("demo").value = demo;
    await abrirDemo(demo, opciones);
    return C.resumen;
  },
  info: () => ({
    demo: C.demo,
    paquete: C.paquete,
    t: C.t,
    cuadros: C.sqt?.n,
    camara: camCine.position.toArray().map(v => +v.toFixed(3)),
    fov: +camCine.fov.toFixed(2),
    primera: C.henry1ra ? C.henry1ra.p.id : null,
    mira: new THREE.Vector3(0, 0, -1).applyQuaternion(camCine.quaternion).toArray().map(v => +v.toFixed(2)),
    salas: C.salas.map(s => s.nombre),
    personajes: C.personajes.map(x => ({
      id: x.p.id,
      modelo: x.modelo?.archivo ?? null,
      huesos: x.p.nHuesos
    })),
    subs: C.subs.length,
    audio: !!C.audio,
    sub: subActual,
    eventos: C.ev?.nombres ?? [],
    objetosEvento: C.ev?.objetos.length ?? 0,
    efectos: fx?.estado ?? null,
    pantalla: C.pantalla && {
      ...C.pantalla,
      mascara: C.pantalla.mascara?.tipo ?? null,
      destello: !!C.pantalla.destello
    }
  }),
  tocar: tocar,
  pausar: pausar,
  pararseEnLaCamara: pararseEnLaCamara,
  modoFoto: fotoCine.foto,
  video: videoCine,
  probarLista: (i = 1, nivel) => {
    if (nivel) nivelVR = nivel;
    const r = listaVR.vistaPrevia(i);
    redibujar();
    return {
      ...r,
      nivel: nivelVR,
      fotos: listaVR.fotos()
    };
  },
  listaVR: () => listaVR,
  camara: () => ({
    movil: $("movil").checked,
    ojos: $("primera").checked,
    off: {
      ...offMovil
    },
    rig: jugador.position.toArray().map(v => +v.toFixed(2))
  }),
  medir: () => medir(),
  miniatura: (w = 320, h = 240, texto = "") => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const g = c.getContext("2d");
    g.fillStyle = "#000";
    g.fillRect(0, 0, w, h);
    const a = areaJuego(), dpr = renderer.getPixelRatio(), src = renderer.domElement;
    g.drawImage(src, a.x * dpr, a.y * dpr, a.w * dpr, a.h * dpr, 0, 0, w, h);
    if (texto) {
      g.font = "11px monospace";
      g.fillStyle = "#ff0";
      g.fillText(texto, 4, 12);
    }
    return c.toDataURL("image/jpeg", .8);
  }
});

const _ray = new THREE.Raycaster, _v1 = new THREE.Vector3, _v2 = new THREE.Vector3;

function medir() {
  salas.updateMatrixWorld(true);
  const cols = C.salas.map(x => x.colision).filter(Boolean);
  const vis = [];
  for (const x of C.salas) x.grupo.traverse(o => {
    if (o.isMesh && o !== x.colision) vis.push(o);
  });
  const r = {
    demo: C.demo,
    paquete: C.paquete,
    t: Math.round(C.t),
    salas: C.salas.map(x => x.nombre),
    camara: null,
    personajes: []
  };
  if (!C.salas.length) return r;
  const caja = new THREE.Box3;
  for (const m of vis) caja.expandByObject(m);
  const P = camCine.position.clone();
  const pisoBajo = (orig, objs, far) => {
    _ray.set(orig, _v1.set(0, -1, 0));
    _ray.far = far;
    for (const h of _ray.intersectObjects(objs, false)) if (h.face && Math.abs(h.face.normal.y) > .5) return h.point.y;
    return null;
  };
  const objsPiso = cols.length ? cols : vis;
  const yPisoCam = pisoBajo(P, objsPiso, 12) ?? (cols.length ? pisoBajo(P, vis, 12) : null);
  const S = C.muestrear(C.t);
  camCine.updateMatrixWorld(true);
  ajustarCamCine(ASPECTO_JUEGO);
  const frustum = (new THREE.Frustum).setFromProjectionMatrix((new THREE.Matrix4).multiplyMatrices(camCine.projectionMatrix, camCine.matrixWorldInverse));
  const centros = [];
  S.poses.forEach((po, i) => {
    const ent = C.personajes[i];
    if (!ent || ent.p.nHuesos < 15) return;
    let n = 0, minY = Infinity, maxY = -Infinity, pie = null, cabeza = null;
    const c = new THREE.Vector3;
    for (let h = 0; h < po.n; h++) if (po.tiene[h]) {
      aThree(po.pos.subarray(h * 3, h * 3 + 3), _v2);
      c.add(_v2);
      n++;
      if (_v2.y < minY) {
        minY = _v2.y;
        pie = _v2.clone();
      }
      if (_v2.y > maxY) {
        maxY = _v2.y;
        cabeza = _v2.clone();
      }
    }
    if (!n) return;
    c.divideScalar(n);
    let mejor = null;
    for (const objs of [ cols, vis ]) {
      if (!objs.length) continue;
      _ray.set(_v1.set(pie.x, pie.y + 1, pie.z), _v2.set(0, -1, 0));
      _ray.far = 2.2;
      for (const h of _ray.intersectObjects(objs, false)) if (h.face && Math.abs(h.face.normal.y) > .5) {
        const d = pie.y - h.point.y;
        if (mejor === null || Math.abs(d) < Math.abs(mejor)) mejor = d;
      }
    }
    const libre = meta => {
      const dir = meta.clone().sub(P), dist = dir.length();
      _ray.set(P, dir.normalize());
      _ray.far = Math.max(0, dist - .25);
      return _ray.intersectObjects(vis, false).length === 0;
    };
    const enCuadro = frustum.containsPoint(c) || frustum.containsPoint(cabeza);
    const visto = enCuadro ? libre(c) || libre(cabeza) : null;
    r.personajes.push({
      id: ent.p.id,
      pie: +pie.y.toFixed(3),
      alPiso: mejor === null ? null : +mejor.toFixed(3),
      pisa: mejor !== null && Math.abs(mejor) <= .25,
      enCuadro: enCuadro,
      visto: visto,
      dentro: caja.containsPoint(c)
    });
    centros.push(c);
  });
  let escapan = 0;
  const dirs = [ [ 1, 0, 0 ], [ -1, 0, 0 ], [ 0, 1, 0 ], [ 0, -1, 0 ], [ 0, 0, 1 ], [ 0, 0, -1 ] ];
  for (const sx of [ -1, 1 ]) for (const sy of [ -1, 1 ]) for (const sz of [ -1, 1 ]) dirs.push([ sx, sy, sz ]);
  for (const d of dirs) {
    _ray.set(P, _v1.set(...d).normalize());
    _ray.far = 80;
    if (!_ray.intersectObjects(vis, false).length) escapan++;
  }
  r.camara = {
    pos: P.toArray().map(v => +v.toFixed(2)),
    escapan: +(escapan / dirs.length).toFixed(2),
    dentro: caja.clone().expandByScalar(.5).containsPoint(P),
    pisoAbajo: yPisoCam === null ? null : +(P.y - yPisoCam).toFixed(2),
    conColision: cols.length > 0
  };
  return r;
}
