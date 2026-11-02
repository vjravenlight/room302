// SH4 web — FeniXVOID · Project Ravenlight
import * as THREE from "three";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import { VRButton } from "three/addons/webxr/VRButton.js";

import { partesBin } from "./lib/sh4bin.js";

import { leerModelo } from "./lib/modelo.js";

import { leerTexturas } from "./lib/texturas.js";

import { leerAnimacion, FPS } from "./lib/animacion.js";

import { crearPersonaje } from "./lib/personaje.js";

import { NOMBRES_ANIM } from "./lib/anim_nombres.js";

import { crearUniformsLuz, materialJuego } from "./lib/luz_cine.js";

import { cargarDatos } from "./jugador/datos.js";

import { crearArmas } from "./jugador/armas.js";

import { prepararCasco, opciones, alCambiarOpciones, aplicarCalidad } from "./jugador/casco_comun.js";

import { crearListaVR } from "./suite_vr_lista.js";

import { indiceMiniaturas, urlMiniatura } from "./miniaturas.js";

import { idiomaActual, sitioIngles } from "./textos_sitio.js";

const q = new URLSearchParams(location.search);

const $ = id => document.getElementById(id);

const EN = {
  "buscar un personaje, monstruo, arma u objeto…": "search a character, monster, weapon or item…",
  Todo: "All",
  Personajes: "Characters",
  Monstruos: "Monsters",
  Armas: "Weapons",
  Objetos: "Items",
  "Otros archivos": "Other files",
  "arma en la mano": "weapon in hand",
  "redondear (U)": "smooth (U)",
  "Luz del juego": "Game light",
  "Luz de estudio": "Studio light",
  "(sin arma)": "(no weapon)",
  "filtrar…": "filter…",
  "(sin animación)": "(no animation)",
  "otros archivos": "other files",
  modelo: "model",
  "nada coincide con": "nothing matches",
  huesos: "bones",
  partes: "parts",
  "triángulos": "triangles",
  alto: "height",
  "animación": "animation",
  cuadros: "frames",
  pistas: "tracks",
  "cara (clusters)": "face (clusters)",
  "texturas animadas": "animated textures",
  "sin modelos": "no models",
  MODELOS: "MODELS",
  ANIMACIONES: "ANIMATIONS",
  "Ver animaciones": "Animations",
  "Ver modelos": "Models",
  "Anim. anterior": "Prev. anim.",
  "Anim. siguiente": "Next anim.",
  Pausa: "Pause",
  Seguir: "Play",
  "Salir del casco": "Exit headset",
  "cargando…": "loading…"
};

const tr = t => sitioIngles() ? EN[t] ?? t : t;

for (const el of document.querySelectorAll("#categoria option, #luz option")) el.textContent = tr(el.textContent);

$("buscar").placeholder = tr($("buscar").placeholder);

$("filtroAnim").placeholder = tr("filtrar…");

document.querySelector("#filaArma label").textContent = tr("arma en la mano");

$("redondear").nextSibling.textContent = " " + tr("redondear (U)");

const CON_ANIM = [ "anm_test", "anmmix_test", "bd12_eleA", "bd12_eleB", "bd12_eleC", "car_ambul01", "cm01", "cm02", "cm03", "cm11", "cm12", "cm24", "cynl_anm", "eil_anm", "enemy_buzz", "enemy_fat", "enemy_flames", "enemy_hil", "enemy_hyena", "enemy_jinmen", "enemy_jinmen_event", "enemy_kabe", "enemy_kabe_boss", "enemy_kabe_dek", "enemy_killer", "enemy_killer_last", "enemy_mm_bd11", "enemy_mm_fr03", "enemy_mm_mz32", "enemy_mm_sb05", "enemy_mm_sb14", "enemy_multi", "enemy_multi_event_bd07", "enemy_mush", "enemy_mush2", "enemy_pickgirl", "enemy_scratch", "enemy_scratch_event_bd03", "enemy_twins", "enemy_wall_ghost", "enemy_wheel", "ev_killer", "event_rl00", "event_rl00_cmn", "event_rl01_cmn", "fr20", "fr23", "frchi", "henry01", "hs10", "ie14", "jin", "padata", "phe_rl01", "phe_rl02", "sb01", "sb02", "sb07", "sb12", "sb13", "sb14", "sb22", "st01", "st_all", "st_spi00", "tw_mob", "twdm_106ma00", "twdm_106re00", "twdm_107ma00", "twdm_206ch00", "twdm_206ch01", "twdm_206fe00", "twdm_206ma00", "twdm_207ri00", "twdm_cyn00", "twdm_detective00", "twdm_ki00", "twdm_police00" ];

const FUENTES = [ [ /^eil$/, [ "eil_anm" ] ], [ /^cynl$/, [ "cynl_anm", "fr20" ] ], [ /^enemy_model_(fla|oji)$/, [ "enemy_flames" ] ], [ /^enemy_model_(bab|cyo)$/, [ "enemy_pickgirl" ] ], [ /^enemy_model_(scr|det)$/, [ "enemy_scratch", "enemy_scratch_event_bd03" ] ], [ /^enemy_model_ml/, [ "enemy_multi", "enemy_multi_event_bd07" ] ], [ /^enemy_model_kbo/, [ "enemy_kabe", "enemy_kabe_boss", "enemy_kabe_dek" ] ], [ /^enemy_mm$/, [ "enemy_mm_fr03", "enemy_mm_bd11", "enemy_mm_mz32", "enemy_mm_sb05", "enemy_mm_sb14" ] ], [ /^(henry01|henhk|kmnk)$/, [ "henry01", "hs10", "padata" ] ] ];

const GLOSARIO = {
  ATT: "ataque",
  DIE: "muere",
  DED: "muerto",
  DM: "daño",
  NT: "quieto",
  ROT: "gira",
  RUN: "corre",
  WLK: "camina",
  UP: "se levanta",
  STY: "espera",
  XX: "caído",
  LOOK: "mira",
  POINT: "señala",
  WALK: "camina",
  BACK: "retrocede",
  TURN: "gira",
  DAM: "daño",
  DOWN: "cae",
  ATK: "ataque",
  BRS: "aliento",
  SPH: "escupe",
  DWN: "cae",
  APP: "aparece",
  WAIT: "espera",
  WAI: "espera",
  TRN: "gira",
  STD: "parado"
};

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  preserveDrawingBuffer: q.has("quieto")
});

renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

renderer.setSize(innerWidth, innerHeight);

renderer.outputColorSpace = THREE.SRGBColorSpace;

renderer.xr.enabled = true;

document.body.appendChild(renderer.domElement);

const escena = new THREE.Scene;

escena.background = new THREE.Color(723208);

const hemi = new THREE.HemisphereLight(16774374, 3156e3, 1.6);

escena.add(hemi);

const luz = new THREE.DirectionalLight(16777215, 1.4);

luz.position.set(1, 2, 2);

escena.add(luz);

const piso = new THREE.Mesh(new THREE.CircleGeometry(1.2, 48), new THREE.MeshBasicMaterial({
  color: 1709330
}));

piso.rotation.x = -Math.PI / 2;

escena.add(piso);

const grilla = new THREE.PolarGridHelper(1.2, 8, 4, 48, 2892831, 2892831);

grilla.position.y = .001;

escena.add(grilla);

const camara = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, .01, 100);

camara.position.set(0, 1.2, 3.2);

const orbita = new OrbitControls(camara, renderer.domElement);

orbita.target.set(0, .9, 0);

const ajustarTamano = () => {
  aplicarCalidad(renderer);
  camara.aspect = innerWidth / innerHeight;
  camara.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  sucio = 2;
};

addEventListener("resize", () => {
  if (!renderer.xr.isPresenting) ajustarTamano();
});

const raiz = new THREE.Group;

escena.add(raiz);

const info = {
  lista: false
};

let sucio = 3;

const quieto = q.has("quieto");

const reloj = new THREE.Clock;

let pj = null;

let uniformsLuz = null;

let armas = null;

const brillo = () => {
  const b = +opciones().brilloPersonajes;
  return Number.isFinite(b) ? Math.pow(2, (b - 5) / 5) : 1;
};

const luzJuego = () => $("luz").value === "juego";

const DIR_CLAVE = new THREE.Vector3(-1, -2, -2).normalize(), DIR_RELLENO = new THREE.Vector3(1.5, -.5, 1).normalize();

function aplicarLuz() {
  const k = brillo();
  hemi.intensity = 1.6 * k;
  luz.intensity = 1.4 * k;
  if (!uniformsLuz) return;
  uniformsLuz.uLuzAmb.value.set(.55, .53, .5).multiplyScalar(k);
  uniformsLuz.uLuzDirDir.value[0].copy(DIR_CLAVE);
  uniformsLuz.uLuzDirCol.value[0].set(.95, .9, .84).multiplyScalar(k);
  uniformsLuz.uLuzDirDir.value[1].copy(DIR_RELLENO);
  uniformsLuz.uLuzDirCol.value[1].set(.3, .3, .34).multiplyScalar(k);
  uniformsLuz.uLuzDirCol.value[2].set(0, 0, 0);
  for (const c of uniformsLuz.uLuzPunCol.value) c.set(0, 0, 0);
}

alCambiarOpciones(() => {
  aplicarLuz();
  sucio = 2;
});

renderer.setAnimationLoop(() => {
  const dt = Math.min(reloj.getDelta(), .1);
  const vr = renderer.xr.isPresenting;
  if (pj && !quieto && pj.reproductor.anim && !pj.reproductor.pausa) {
    actualizarPose(dt);
    sucio = 1;
  }
  if (vr) {
    cascoVR.actualizar(dt, {
      moviendo: false
    });
    if (!listaVR.actualizar(dt)) for (const p of Object.values(cascoVR.manos?.palitos?.() || {})) if (Math.abs(p.x) > .3) raiz.rotation.y += p.x * dt * Math.PI / 2;
    renderer.render(escena, camara);
    return;
  }
  if (quieto && sucio-- <= 0) return;
  orbita.update();
  renderer.render(escena, camara);
});

orbita.addEventListener("change", () => {
  sucio = 2;
});

function actualizarPose(dt) {
  const pose = pj.actualizar(dt);
  const r = pj.reproductor;
  info.cuadro = r.t;
  info.pose = pose;
  const dur = Math.max(1, r.anim?.duracion || 1), tt = r.loop ?? r.anim?.loop ? (r.t % dur + dur) % dur : Math.min(r.t, dur);
  $("tiempo").value = r.anim ? tt : 0;
  $("cuadro").textContent = r.anim ? `${tt.toFixed(1)} / ${r.anim.duracion}` : "";
}

const bins = new Map;

async function bin(nombre) {
  if (!bins.has(nombre)) {
    bins.set(nombre, fetch("/juego/data/" + nombre + ".bin").then(r => {
      if (!r.ok) throw new Error("no pude leer " + nombre);
      return r.arrayBuffer();
    }));
    bins.get(nombre).catch(() => bins.delete(nombre));
  }
  return bins.get(nombre);
}

const [lista, nombresJ, datos] = await Promise.all([ fetch("/juego-lista.json").then(r => r.json()), fetch("./nombres.json", {
  cache: "no-cache"
}).then(r => r.ok ? r.json() : {}).catch(() => ({})), cargarDatos({
  idioma: idiomaActual()
}).catch(e => {
  console.warn("datos de ítems", e.message);
  return null;
}) ]);

const NOMBRE_ARCH = nombresJ?.personajes || {};

const archivos = lista.data.filter(f => !/^[a-z]{2}\d\d/.test(f) || CON_ANIM.includes(f.slice(0, -4))).filter(f => !/^(message|snap|se_|fontdata|map_)/.test(f)).map(f => f.slice(0, -4));

const NO_PERSONAJES = /^(tw_cars|car_ambul01|ita|flr|whpk|anj002|kage_test|sample|hit1|jsp_fire|anm_test|anmmix_test|enemy_tex|flame_tex|prik|dea)$/;

function categoriaDe(a) {
  if (NO_PERSONAJES.test(a)) return "otros";
  if (/^enemy_/.test(a)) return "monstruos";
  return NOMBRE_ARCH[a] ? "personajes" : "otros";
}

const CATALOGO = [];

for (const a of archivos) CATALOGO.push({
  valor: a,
  cat: categoriaDe(a),
  nombre: NOMBRE_ARCH[a]?.nombre || a,
  archivo: a
});

const nombreItem0 = k => datos?.nombreItem?.(k) || `ítem ${k}`;

const vecesNombre = new Map;

for (const k of [ ...(datos?.juego?.armas || []).map(a => a.item_id), ...(datos?.juego?.modelos_items?.filas || []).map(f => f.id) ]) {
  const n = nombreItem0(k);
  vecesNombre.set(n, (vecesNombre.get(n) || new Set).add(k));
}

const nombreItem = k => {
  const n = nombreItem0(k);
  return vecesNombre.get(n)?.size > 1 ? `${n} (n.° ${k})` : n;
};

for (const a of datos?.juego?.armas || []) if (a.modelo?.model) CATALOGO.push({
  valor: "arma:" + a.item_id,
  cat: "armas",
  nombre: nombreItem(a.item_id),
  archivo: "wp_model",
  arma: a
});

for (const f of datos?.juego?.modelos_items?.filas || []) if (f.modelo) CATALOGO.push({
  valor: "objeto:" + f.id,
  cat: "items",
  nombre: nombreItem(f.id),
  archivo: f.modelo.archivo.replace(/\.bin$/, ""),
  fila: f
});

CATALOGO.sort((x, y) => (x.nombre === x.archivo) - (y.nombre === y.archivo) || x.nombre.localeCompare(y.nombre, "es"));

const ORDEN_CAT = [ "personajes", "monstruos", "armas", "items", "otros" ];

const NOMBRE_CAT = {
  personajes: "Personajes",
  monstruos: "Monstruos",
  armas: "Armas",
  items: "Objetos",
  otros: "Otros archivos"
};

const porValor = new Map(CATALOGO.map(c => [ c.valor, c ]));

const pedido0 = (q.get("archivo") || "henry01").replace(/^item:/, "objeto:");

let visiblesCat = [];

function llenarCatalogo(elegir) {
  const f = $("buscar").value.trim().toLowerCase(), cat = $("categoria").value;
  visiblesCat = CATALOGO.filter(c => (!cat || c.cat === cat) && (!f || (c.nombre + " " + c.archivo + " " + c.valor).toLowerCase().includes(f))).sort((x, y) => ORDEN_CAT.indexOf(x.cat) - ORDEN_CAT.indexOf(y.cat));
  const sel = $("modelo");
  sel.textContent = "";
  for (const k of ORDEN_CAT) {
    const l = visiblesCat.filter(c => c.cat === k);
    if (!l.length) continue;
    const og = document.createElement("optgroup");
    og.label = tr(NOMBRE_CAT[k]) + ` (${l.length})`;
    for (const c of l) og.appendChild(new Option(c.nombre === c.archivo ? c.archivo : `${c.nombre} · ${c.archivo}`, c.valor));
    sel.appendChild(og);
  }
  if (!visiblesCat.length) sel.add(new Option(`${tr("nada coincide con")} "${f}"`, ""));
  if (elegir && porValor.has(elegir) && visiblesCat.some(c => c.valor === elegir)) sel.value = elegir;
  return visiblesCat;
}

let actual = null, fuente = null;

function armarPersonaje(m, texs) {
  if (luzJuego()) {
    uniformsLuz = crearUniformsLuz();
    return crearPersonaje(m, texs, {
      material: (tex, sp) => materialJuego(tex, sp, uniformsLuz)
    });
  }
  uniformsLuz = null;
  return crearPersonaje(m, texs);
}

async function cargarEntrada(valor) {
  const c = porValor.get(valor) || porValor.get("henry01");
  q.set("archivo", c.valor);
  if (c.arma || c.fila) {
    const mod = c.arma ? c.arma.modelo.model : c.fila.modelo, tx = c.arma ? c.arma.modelo.tex : c.fila.texturas;
    const buf = await bin(mod.archivo.replace(/\.bin$/, "")), partes = partesBin(buf), pm = partes[mod.parte];
    let texBuf = buf, pt = null;
    if (tx) {
      texBuf = await bin(tx.archivo.replace(/\.bin$/, ""));
      pt = partesBin(texBuf)[tx.parte];
    }
    actual = {
      nombre: c.valor,
      c: c,
      unico: {
        buf: buf,
        pm: pm,
        texBuf: texBuf,
        pt: pt
      }
    };
    $("cual").hidden = true;
    $("cual").textContent = "";
    const selF = $("fuente");
    selF.textContent = "";
    selF.add(new Option(tr("(sin animación)"), ""));
    await mostrar(0);
    return;
  }
  const buf = await bin(c.archivo);
  const partes = partesBin(buf);
  actual = {
    nombre: c.archivo,
    c: c,
    buf: buf,
    modelos: partes.filter(p => p.tipo === "modelo"),
    texturas: partes.filter(p => p.tipo === "texturas")
  };
  const sel = $("cual");
  sel.textContent = "";
  actual.modelos.forEach((_, i) => sel.add(new Option(tr("modelo") + " " + i, i)));
  sel.hidden = actual.modelos.length < 2;
  sel.value = Math.min(+(q.get("n") || 0), Math.max(0, actual.modelos.length - 1));
  const sug = [];
  if (CON_ANIM.includes(c.archivo)) sug.push(c.archivo);
  for (const [re, l] of FUENTES) if (re.test(c.archivo)) for (const a of l) if (!sug.includes(a)) sug.push(a);
  const selF = $("fuente");
  selF.textContent = "";
  selF.add(new Option(tr("(sin animación)"), ""));
  for (const a of sug) selF.add(new Option(NOMBRE_ARCH[a]?.nombre ? `${a} · ${NOMBRE_ARCH[a].nombre}` : a, a));
  const og = document.createElement("optgroup");
  og.label = tr("otros archivos");
  for (const a of CON_ANIM) if (!sug.includes(a)) og.appendChild(new Option(a, a));
  selF.add(og);
  selF.value = q.has("anims") ? q.get("anims") : sug[0] || "";
  await mostrar(+sel.value);
}

async function mostrar(n) {
  info.lista = false;
  if (pj) {
    armas?.equipar(0);
    pj.dispose();
    raiz.clear();
    pj = null;
  }
  armas = null;
  let m, texs = [];
  if (actual.unico) {
    const {buf: buf, pm: pm, texBuf: texBuf, pt: pt} = actual.unico;
    m = leerModelo(buf, pm.ofs, pm.len);
    if (pt?.tipo === "texturas") texs = leerTexturas(texBuf, pt.ofs, pt.len);
  } else {
    const p = actual.modelos[n];
    if (!p) {
      $("estado").textContent = tr("sin modelos");
      await cargarFuente();
      return;
    }
    m = leerModelo(actual.buf, p.ofs, p.len);
    const tp = actual.texturas[Math.min(n, actual.texturas.length - 1)];
    texs = tp ? leerTexturas(actual.buf, tp.ofs, tp.len) : [];
  }
  pj = armarPersonaje(m, texs);
  aplicarLuz();
  raiz.add(pj.grupo);
  pj.verHuesos($("huesos").checked);
  raiz.position.set(0, 0, 0);
  pj.actualizar(0);
  raiz.updateMatrixWorld(true);
  const caja = new THREE.Box3;
  for (const malla of pj.mallas) {
    if (malla.isSkinnedMesh) malla.computeBoundingBox(); else malla.geometry.computeBoundingBox();
    caja.union((malla.boundingBox || malla.geometry.boundingBox).clone().applyMatrix4(malla.matrixWorld));
  }
  const alto = caja.max.y - caja.min.y;
  const tam = Math.max(alto, caja.max.x - caja.min.x, caja.max.z - caja.min.z);
  const suelto = !!actual.unico, chico = tam < .6;
  const alzar = chico ? .9 : 0;
  raiz.position.set(suelto ? -(caja.min.x + caja.max.x) / 2 : 0, 0, suelto ? -(caja.min.z + caja.max.z) / 2 : 0);
  raiz.position.y = $("fuente").value ? 0 : -caja.min.y + alzar;
  const centroY = $("fuente").value ? (caja.min.y + caja.max.y) / 2 : alto / 2 + alzar;
  orbita.target.set(0, centroY, 0);
  const radio = Math.max(.03, caja.getSize(new THREE.Vector3).length() / 2);
  const fovV = THREE.MathUtils.degToRad(camara.fov), fovH = 2 * Math.atan(Math.tan(fovV / 2) * camara.aspect);
  const dist = radio / Math.sin(Math.min(fovV, fovH) / 2) * 1.1;
  const dir = suelto ? new THREE.Vector3(.55, .35, 1).normalize() : new THREE.Vector3(0, .12, 1).normalize();
  camara.position.copy(orbita.target).addScaledVector(dir, dist);
  piso.visible = grilla.visible = !chico;
  const tris = m.partes.reduce((s, x) => s + x.indices.length / 3, 0);
  Object.assign(info, {
    archivo: actual.nombre,
    n: n,
    huesos: m.huesos.length,
    partes: m.partes.length,
    tris: tris,
    alto: alto,
    tam: tam,
    nombre: actual.c?.nombre,
    luz: $("luz").value
  });
  info.texto = `${actual.c?.nombre && actual.c.nombre !== actual.nombre ? actual.c.nombre + " · " : ""}${actual.nombre}${actual.unico ? "" : " · " + tr("modelo") + " " + n}: ` + `${m.huesos.length} ${tr("huesos")}, ${m.partes.length} ${tr("partes")}, ${tris} ${tr("triángulos")}, ${tr("alto")} ${alto.toFixed(2)} m`;
  const conArma = !actual.unico && /^(henry01|henhk|kmnk)$/.test(actual.nombre) && m.huesos.length > 25 && !!datos;
  $("filaArma").hidden = !conArma;
  if (conArma) {
    armas = crearArmas({
      THREE: THREE,
      henry: pj,
      datos: datos
    });
    if (+$("arma").value) ponerArma(+$("arma").value);
  }
  await cargarFuente();
  listaVR?.refrescar();
}

async function ponerArma(k) {
  if (!armas) return;
  $("arma").value = k || 0;
  await armas.equipar(k || 0);
  info.arma = k || 0;
  sucio = 2;
  if (k) q.set("arma", k); else q.delete("arma");
  history.replaceState(null, "", "?" + q);
}

async function cargarFuente() {
  const nom = $("fuente").value;
  fuente = null;
  if (nom) {
    const buf = await bin(nom);
    const lista = partesBin(buf).filter(x => x.tipo === "animacion");
    const nombres = NOMBRES_ANIM[nom];
    const coincide = nombres && nombres.length === lista.length;
    fuente = {
      nombre: nom,
      buf: buf,
      lista: lista,
      anims: [],
      textos: []
    };
    lista.forEach((x, i) => {
      const a = leerAnimacion(buf, x.ofs, x.len);
      fuente.anims.push(a);
      let nm = nombres?.[i] ? nombres[i].replace(/^EN_\w+?_ANM_/, "") : "";
      if (nm) nm = `${nm} (${traducir(nm)})${coincide ? "" : " ?"}`;
      const maxH = Math.max(-1, ...a.pistas.filter(p => p.clase !== "float" && p.clase !== "vector").map(p => p.hueso));
      const avisar = pj && maxH >= pj.esq.n ? " ⚠ más huesos" : "";
      fuente.textos.push(`${i}${nm ? " · " + nm : ""} · ${(a.duracion / FPS).toFixed(1)} s${a.loop ? " · loop" : ""}${avisar}`);
    });
  }
  llenarAnims();
  const ai = Math.min(+(q.get("a") || 0), Math.max(0, (fuente?.anims.length || 1) - 1));
  $("anim").value = ai;
  ponerAnim(fuente ? ai : -1, +(q.get("t") || 0));
}

function llenarAnims() {
  const selA = $("anim"), f = $("filtroAnim").value.trim().toLowerCase(), antes = selA.value;
  selA.textContent = "";
  if (!fuente) {
    selA.add(new Option(tr("(sin animación)"), -1));
    return;
  }
  fuente.textos.forEach((t, i) => {
    if (!f || t.toLowerCase().includes(f)) selA.add(new Option(t, i));
  });
  if (!selA.options.length) selA.add(new Option(`${tr("nada coincide con")} "${f}"`, ""));
  if ([ ...selA.options ].some(o => o.value === antes)) selA.value = antes;
}

function traducir(nm) {
  const k = Object.keys(GLOSARIO).sort((x, y) => y.length - x.length).find(x => nm.startsWith(x));
  return k ? (GLOSARIO[k] + " " + nm.slice(k.length).toLowerCase()).trim() : nm.toLowerCase();
}

function ponerAnim(i, t = 0) {
  if (!pj) return;
  const a = i >= 0 ? fuente?.anims[i] : null;
  const r = pj.reproductor;
  r.poner(a, t);
  r.loop = $("loop").checked ? true : a ? a.loop : null;
  r.ik = $("ik").checked;
  r.enElLugar = $("lugar").checked;
  r.velocidad = +$("vel").value;
  if (quieto) r.pausa = true;
  $("tiempo").max = a ? Math.max(1, a.duracion) : 1;
  actualizarPose(0);
  const extra = a ? `\n${tr("animación")} ${i}: ${a.duracion} ${tr("cuadros")} (${(a.duracion / FPS).toFixed(2)} s), ${a.pistas.length} ${tr("pistas")}, IK ${a.ik.length}` + (a.pistas.some(p => p.clase === "float") ? ", " + tr("cara (clusters)") : "") + (a.pistas.some(p => p.clase === "vector") ? ", " + tr("texturas animadas") : "") : "";
  $("estado").textContent = (info.texto || "") + extra;
  Object.assign(info, {
    anims: fuente?.nombre || null,
    a: a ? i : null,
    duracion: a?.duracion ?? 0,
    lista: true
  });
  const u = new URLSearchParams({
    archivo: actual.c?.valor || actual.nombre,
    n: info.n ?? 0
  });
  if (fuente) {
    u.set("anims", fuente.nombre);
    u.set("a", i);
  }
  for (const k of [ "luz", "arma", "vr", "idioma", "uso" ]) if (q.has(k)) u.set(k, q.get(k));
  history.replaceState(null, "", "?" + u + (quieto ? "&quieto" : ""));
  sucio = 3;
  listaVR?.refrescar();
}

window.sh4 = Object.assign(window.sh4 || {}, {
  info: info,
  escena: escena,
  camara: camara,
  THREE: THREE,
  orbita: orbita,
  renderer: renderer,
  redibujar: () => {
    sucio = 2;
  },
  cargar: (a, n = 0, anims) => {
    a = String(a).replace(/^item:/, "objeto:");
    q.set("n", n);
    for (const k of [ "anims", "a", "t" ]) q.delete(k);
    if (anims !== undefined) q.set("anims", anims);
    $("categoria").value = "";
    $("buscar").value = "";
    llenarCatalogo(a);
    $("modelo").value = a;
    return cargarEntrada(a);
  },
  animar: async (i, t = 0, otraFuente) => {
    if (otraFuente) {
      $("fuente").value = otraFuente;
      q.set("a", i);
      q.set("t", t);
      await cargarFuente();
    } else ponerAnim(i, t);
    sucio = 2;
    return info;
  },
  irA: t => {
    if (!pj) return;
    pj.reproductor.t = t;
    actualizarPose(0);
    sucio = 2;
    return pj.reproductor.t;
  },
  arma: k => ponerArma(k),
  buscar: (texto, cat = "") => {
    $("buscar").value = texto;
    $("categoria").value = cat;
    return llenarCatalogo().map(c => c.valor);
  },
  luz: v => {
    $("luz").value = v;
    return mostrar(+($("cual").value || 0));
  },
  get personaje() {
    return pj;
  }
});

$("modelo").addEventListener("change", () => {
  if (!$("modelo").value) return;
  q.set("n", 0);
  q.delete("anims");
  q.delete("a");
  q.delete("t");
  cargarEntrada($("modelo").value);
});

$("buscar").addEventListener("input", () => {
  const l = llenarCatalogo(actual?.c?.valor);
  if (l.length && !l.some(c => c.valor === actual?.c?.valor)) {
    $("modelo").value = l[0].valor;
    q.set("n", 0);
    q.delete("anims");
    q.delete("a");
    cargarEntrada(l[0].valor);
  }
});

$("categoria").addEventListener("change", () => $("buscar").dispatchEvent(new Event("input")));

$("cual").addEventListener("change", e => {
  q.delete("t");
  mostrar(+e.target.value);
});

$("fuente").addEventListener("change", e => {
  q.set("anims", e.target.value);
  q.set("a", 0);
  q.delete("t");
  $("filtroAnim").value = "";
  cargarFuente();
});

$("filtroAnim").addEventListener("input", () => {
  llenarAnims();
  const v = $("anim").value;
  if (v !== "" && +v !== info.a) ponerAnim(+v);
});

$("anim").addEventListener("change", e => {
  if (e.target.value === "") return;
  q.delete("t");
  ponerAnim(+e.target.value);
});

$("play").addEventListener("click", () => {
  if (!pj) return;
  pj.reproductor.pausa = !pj.reproductor.pausa;
  $("play").textContent = pj.reproductor.pausa ? "▶" : "❚❚";
  listaVR?.refrescar();
});

$("vel").addEventListener("change", e => {
  if (pj) pj.reproductor.velocidad = +e.target.value;
});

$("loop").addEventListener("change", e => {
  if (pj) pj.reproductor.loop = e.target.checked ? true : pj.reproductor.anim?.loop ?? null;
});

$("ik").addEventListener("change", e => {
  if (pj) {
    pj.reproductor.ik = e.target.checked;
    actualizarPose(0);
    sucio = 2;
  }
});

$("lugar").addEventListener("change", e => {
  if (pj) {
    pj.reproductor.enElLugar = e.target.checked;
    actualizarPose(0);
    sucio = 2;
  }
});

$("huesos").addEventListener("change", e => {
  if (pj) {
    pj.verHuesos(e.target.checked);
    actualizarPose(0);
    sucio = 2;
  }
});

$("tiempo").addEventListener("input", e => {
  if (!pj) return;
  pj.reproductor.t = +e.target.value;
  pj.reproductor.pausa = true;
  $("play").textContent = "▶";
  actualizarPose(0);
  sucio = 2;
});

$("luz").addEventListener("change", () => {
  q.set("luz", $("luz").value);
  const t = pj?.reproductor.t || 0;
  q.set("t", t);
  mostrar(+($("cual").value || 0));
});

$("arma").addEventListener("change", e => ponerArma(+e.target.value));

$("redondear").addEventListener("change", e => {
  globalThis.sh4Redondeo?.poner(e.target.checked);
  sucio = 2;
});

addEventListener("keydown", e => {
  if (e.code === "KeyU") setTimeout(() => {
    $("redondear").checked = !!globalThis.sh4Redondeo?.activo;
    sucio = 2;
  }, 0);
});

$("redondear").checked = !!globalThis.sh4Redondeo?.activo;

if (q.has("huesos")) $("huesos").checked = true;

if (q.has("vel")) $("vel").value = q.get("vel");

if (q.get("luz") === "estudio") $("luz").value = "estudio";

{
  const sel = $("arma");
  sel.add(new Option(tr("(sin arma)"), 0));
  for (const a of datos?.juego?.armas || []) if (a.modelo?.model && a.item_id < 128) sel.add(new Option(nombreItem(a.item_id), a.item_id));
  if (q.has("arma")) sel.value = q.get("arma");
}

const jugador = new THREE.Group;

jugador.name = "jugador";

escena.add(jugador);

const cascoVR = prepararCasco({
  renderer: renderer,
  camara: camara,
  padre: jugador,
  ojos: 1.6
});

let verVR = "categorias", MINI = null;

indiceMiniaturas().then(i => {
  MINI = i;
  listaVR?.refrescar();
});

const fotoModelo = c => urlMiniatura(MINI, "modelos", c?.valor);

const CARA_CAT = {
  personajes: "henry01",
  monstruos: "enemy_buzz",
  armas: "arma:1"
};

const catsVR = () => ORDEN_CAT.filter(k => CATALOGO.some(c => c.cat === k));

function fotoCat(k) {
  const c = porValor.get(CARA_CAT[k]);
  if (c && c.cat === k && fotoModelo(c)) return fotoModelo(c);
  for (const x of CATALOGO) if (x.cat === k && fotoModelo(x)) return fotoModelo(x);
  return null;
}

const listaVR = crearListaVR({
  THREE: THREE,
  renderer: renderer,
  camara: camara,
  jugador: jugador,
  ancho: 1.5,
  distancia: 1.1,
  abajo: .12,
  curvo: true,
  grilla: () => verVR !== "animaciones",
  columnas: 4,
  filasGrilla: 3,
  porPagina: 12,
  titulo: () => (verVR === "categorias" ? tr("MODELOS") : verVR === "modelos" ? tr("MODELOS") + " - " + tr(NOMBRE_CAT[$("categoria").value] || "") : tr("ANIMACIONES")) + (verVR !== "categorias" && actual?.c ? " - " + actual.c.nombre : ""),
  filas: () => verVR === "categorias" ? catsVR().map(k => ({
    texto: tr(NOMBRE_CAT[k]),
    dato: CATALOGO.filter(c => c.cat === k).length,
    img: fotoCat(k),
    marcada: k === actual?.c?.cat
  })) : verVR === "modelos" ? visiblesCat.map(c => ({
    texto: c.nombre,
    dato: c.nombre === c.archivo ? "" : c.archivo,
    img: fotoModelo(c),
    marcada: c.valor === actual?.c?.valor
  })) : (fuente?.textos || []).map((t, i) => ({
    texto: t,
    marcada: i === info.a
  })),
  alElegir: i => {
    if (verVR === "categorias") {
      const k = catsVR()[i];
      if (!k) return;
      $("categoria").value = k;
      $("buscar").value = "";
      llenarCatalogo(actual?.c?.valor);
      verVR = "modelos";
      listaVR.irA(Math.max(0, visiblesCat.findIndex(c => c.valor === actual?.c?.valor)));
    } else if (verVR === "modelos") {
      const c = visiblesCat[i];
      if (c) {
        $("modelo").value = c.valor;
        q.set("n", 0);
        q.delete("anims");
        q.delete("a");
        raiz.rotation.y = 0;
        cargarEntrada(c.valor);
        listaVR.cerrar();
      }
    } else if (fuente?.anims[i]) {
      $("anim").value = i;
      ponerAnim(i);
    }
  },
  alVolver: () => {
    if (verVR === "categorias") return false;
    verVR = verVR === "animaciones" ? "modelos" : "categorias";
    listaVR.irA(0);
    return true;
  },
  botones: () => [ {
    id: "ver",
    texto: verVR === "animaciones" ? tr("Ver modelos") : tr("Ver animaciones")
  }, {
    id: "ant",
    texto: tr("Anim. anterior")
  }, {
    id: "pausa",
    texto: pj?.reproductor.pausa ? tr("Seguir") : tr("Pausa")
  }, {
    id: "sig",
    texto: tr("Anim. siguiente")
  }, {
    id: "salir",
    texto: tr("Salir del casco")
  } ],
  alBoton: async id => {
    if (id === "ver") verVR = verVR === "animaciones" ? "modelos" : "animaciones"; else if (id === "ant" || id === "sig") {
      const n = fuente?.anims.length || 0;
      if (n) {
        const i = ((info.a ?? 0) + (id === "sig" ? 1 : -1) + n) % n;
        $("anim").value = i;
        ponerAnim(i);
      }
    } else if (id === "pausa") $("play").click(); else if (id === "salir") {
      try {
        await (renderer.xr.getSession()?.end());
      } catch {}
    }
    listaVR.refrescar();
  }
});

function entrarVR() {
  jugador.add(camara);
  camara.position.set(0, 0, 0);
  camara.quaternion.identity();
  jugador.position.set(0, 0, 2);
  jugador.rotation.set(0, 0, 0);
  setTimeout(() => listaVR.abrir(), 400);
}

renderer.xr.addEventListener("sessionstart", () => {
  globalThis.__sh4EnVR = true;
  entrarVR();
});

renderer.xr.addEventListener("sessionend", () => {
  globalThis.__sh4EnVR = false;
  escena.add(camara);
  camara.position.set(0, (orbita.target.y || .9) + .3, 3.2);
  orbita.update();
  ajustarTamano();
});

VRButton.registerSessionGrantedListener();

{
  const b = VRButton.createButton(renderer);
  $("vrLugar").appendChild(b);
  const sinCasco = () => b.classList.toggle("sinCasco", /NOT SUPPORTED|NOT AVAILABLE|NOT ALLOWED/i.test(b.textContent || ""));
  sinCasco();
  setTimeout(sinCasco, 1500);
  setTimeout(sinCasco, 4e3);
}

window.sh4.probarVR = (fila = 1, nivel) => {
  if (nivel) verVR = nivel;
  jugador.add(camara);
  camara.position.set(0, 1.6, 0);
  camara.rotation.set(-.12, .28, 0);
  jugador.position.set(0, 0, 2);
  camara.fov = 70;
  camara.aspect = innerWidth / innerHeight;
  camara.updateProjectionMatrix();
  const r = listaVR.vistaPrevia(fila);
  renderer.render(escena, camara);
  sucio = 0;
  return {
    ...r,
    nivel: verVR,
    fotos: listaVR.fotos()
  };
};

$("categoria").value = "";

llenarCatalogo(pedido0);

$("modelo").value = porValor.has(pedido0) ? pedido0 : "henry01";

aplicarCalidad(renderer);

await cargarEntrada($("modelo").value);
