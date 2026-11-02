// SH4 web — FeniXVOID · Project Ravenlight
import { crearPiso } from "./lib/colision.js";

import * as THREE from "three";

import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";

import { VRButton } from "three/addons/webxr/VRButton.js";

import { soloConCasco } from "./vr_boton.js";

import { armarSala, crearLucesPersonajes } from "./lib/sala.js";

import { iniciarInspeccion } from "./inspeccion.js";

import { sacarFoto, descargar } from "./fotos.js";

import { iniciarMejorado } from "./mejorado/mejorado.js";

import { iniciarEscenaJuego } from "./escena_juego.js";

import { iniciarHenry } from "./henry.js";

import { iniciarControlesExtra } from "./controles_extra.js";

import { iniciarCamaraJuego } from "./camara_juego.js";

import { iniciarSonido } from "./sonido/sonido.js";

import { iniciarEfectos } from "./efectos/efectos.js";

import { iniciarEfectosVisor } from "./efectos/en_visor.js";

import { iniciarEnemigos } from "./enemigos/enemigos.js";

import { prepararCasco } from "./jugador/casco_comun.js";

import { iniciarEscenaViva } from "./escena_viva.js";

import { crearPanelVR } from "./panel_vr.js";

import { crearListaVR } from "./suite_vr_lista.js";

import { indiceMiniaturas, urlMiniatura } from "./miniaturas.js";

import { sitioIngles } from "./textos_sitio.js";

import { prepararBrillo } from "./lib/brillo.js";

let panelVR = null, grillaSalas = null;

let camaraJuego = null;

let escenaJuego = null, henry = null;

let efectos = null, efectosVisor = null, enemigos = null;

let viva = null;

let vistaElegida = new URLSearchParams(location.search).get("vista");

const ESCALA = .005;

const q = new URLSearchParams(location.search);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  stencil: true
});

renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

renderer.setSize(innerWidth, innerHeight);

renderer.outputColorSpace = THREE.SRGBColorSpace;

renderer.xr.enabled = true;

document.body.appendChild(renderer.domElement);

prepararBrillo(renderer.domElement);

VRButton.registerSessionGrantedListener();

document.body.appendChild(soloConCasco(VRButton.createButton(renderer)));

const escena = new THREE.Scene;

escena.background = new THREE.Color(0);

const camara = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, .02, 400);

const jugador = new THREE.Group;

jugador.add(camara);

escena.add(jugador);

const controles = new PointerLockControls(camara, renderer.domElement);

renderer.domElement.addEventListener("click", () => {
  if (!renderer.xr.isPresenting) controles.lock();
});

addEventListener("resize", () => {
  camara.aspect = innerWidth / innerHeight;
  camara.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

const $ = id => document.getElementById(id);

const estado = t => {
  $("estado").textContent = t;
};

async function bajar(ruta) {
  const r = await fetch("/juego/" + ruta);
  if (!r.ok) throw new Error("no pude leer " + ruta);
  return r.arrayBuffer();
}

const salaActual = new THREE.Group;

const globalesTex = new Map;

let salaArmada = null;

escena.add(salaActual);

const info = {
  sala: null,
  piezas: 0,
  triangulos: 0,
  texturas: 0,
  caja: null,
  faltantes: 0
};

window.sh4 = {
  info: info,
  escena: escena,
  camara: camara,
  jugador: jugador,
  THREE: THREE
};

async function cargarSala(nombre, opciones = {}) {
  const tiempos = [], t0 = performance.now(), marca = n => tiempos.push(n + " " + Math.round(performance.now() - t0));
  window.sh4.tiemposParciales = tiempos;
  estado("cargando " + nombre + "…");
  if ($("sala").value !== nombre) $("sala").value = nombre;
  viva?.salir();
  info.mitad = viva ? viva.mitadDe(nombre) : q.get("mitad") === "2" ? 2 : 1;
  const antes = opciones.mantener && info.sala?.slice(0, 4) === nombre.slice(0, 4) ? {
    pos: jugador.position.clone(),
    rot: camara.rotation.clone()
  } : null;
  salaActual.clear();
  marca("inicio");
  const s = await armarSala(THREE, bajar, nombre, globalesTex, {
    mipmaps: !q.has("sinmip"),
    niebla: !q.has("sinniebla"),
    verColision: q.has("vercol"),
    mitad: info.mitad,
    todosLosModelos: /^rl/.test(nombre)
  });
  marca("mundo");
  salaArmada?.dispose?.();
  salaArmada = s;
  salaActual.add(s.grupo);
  colision = s.colision;
  info.colision = s.nColision;
  info.colisionDerivada = s.colisionDerivada;
  const piezas = s.piezas, tris = s.triangulos, faltantes = s.faltantes, nMundo = s.modelos, cache = {
    size: s.texturas
  };
  Object.assign(info, {
    piezas: piezas,
    triangulos: tris,
    texturas: s.texturas,
    faltantes: faltantes,
    modelos: nMundo,
    modelosOcultos: s.modelosOcultos
  });
  marca("colisión");
  info.luces = s.luces;
  info.niebla = s.niebla;
  info.nieblaJuego = s.nieblaJuego;
  info.colorFondo = s.colorFondo;
  window.sh4.niebla = s.nieblaSala;
  escena.background = (new THREE.Color).setRGB(...s.nieblaSala.activa ? s.colorFondo : [ 0, 0, 0 ], THREE.SRGBColorSpace);
  salaActual.add(crearLucesPersonajes(THREE, info.luces));
  window.sh4.alCargarSala?.(salaActual, info);
  window.sh4.sonido?.alCargarSala(nombre, {
    mitad: info.mitad
  });
  marca("luces");
  let llegada = null;
  let filtro = null;
  try {
    filtro = await (viva?.prepararMundo(nombre));
  } catch (e) {
    console.warn("mundo", e);
  }
  try {
    llegada = await (escenaJuego?.alCargarSala(nombre, {
      porPuerta: opciones.porPuerta,
      mitad: info.mitad,
      F: viva?.F,
      filtro: filtro
    }));
  } catch (e) {
    console.warn(e);
  }
  info.puertas = llegada?.puertas || 0;
  info.objetos = llegada?.objetos || 0;
  marca("escena del juego");
  const caja = (new THREE.Box3).setFromObject(colision || salaActual);
  Object.assign(info, {
    sala: nombre,
    piezas: piezas,
    triangulos: tris,
    texturas: cache.size,
    caja: [ caja.min.toArray(), caja.max.toArray() ],
    faltantes: faltantes,
    modelos: nMundo
  });
  const c = caja.getCenter(new THREE.Vector3);
  const cam = q.get("cam")?.split(",").map(Number);
  let giro = null;
  if (antes) jugador.position.copy(antes.pos); else if (cam?.length >= 3) jugador.position.set(cam[0], cam[1], cam[2]); else if (llegada?.pos) {
    jugador.position.set(...llegada.pos);
    pisar();
    giro = THREE.MathUtils.radToDeg(llegada.giro);
  } else {
    const piso = pisoMasGrande();
    if (piso) jugador.position.set(piso.x, piso.y + OJOS, piso.z); else {
      jugador.position.set(c.x, caja.max.y - .2, c.z);
      pisar(true);
    }
  }
  if (antes) camara.rotation.copy(antes.rot); else camara.rotation.set(0, (cam?.length >= 4 ? cam[3] : q.has("giro") ? +q.get("giro") : giro ?? giroMasAbierto()) * Math.PI / 180, 0);
  if (henry && !antes) {
    henry.ponerModo(vistaElegida || henry.vistaPorDefecto(nombre));
    const g = camara.rotation.y;
    henry.ubicarRumbo(Math.atan2(-Math.sin(g), -Math.cos(g)));
  }
  camaraJuego?.alCargarSala(nombre);
  henry?.alCargarSala?.();
  estado(`${window.sh4.nombreCompleto?.(nombre) || nombre}\n[${nombre}] ${nMundo} modelos, ${piezas} piezas, ${tris} triángulos, ${cache.size} texturas` + (faltantes ? `, ${faltantes} sin textura` : "") + (colision ? "" : ", sin colisión"));
  document.title = (window.sh4.nombreCompleto?.(nombre) || nombre) + " · SH4";
  const resto = [ ...q ].filter(([k]) => k !== "sala").map(([k, v]) => "&" + k + (v ? "=" + v : "")).join("");
  history.replaceState(null, "", "?sala=" + nombre + resto);
  marca("arranque");
  try {
    if (viva) viva.opcionesEfectos(nombre); else efectos?.opciones({
      mitad: info.mitad
    });
    efectos?.alCargarSala(nombre);
  } catch (e) {
    console.warn("efectos", e);
  }
  window.sh4.mejorado?.alCargarSala();
  marca("mejorado");
  try {
    const r = viva ? await viva.aplicarEnemigos(nombre) : await (enemigos?.alCargarSala(nombre, {
      mitad: info.mitad
    }));
    if (r) mostrarEnemigos(r);
  } catch (e) {
    console.warn("enemigos", e);
  }
  marca("enemigos");
  try {
    await (viva?.alCargarSala(nombre));
  } catch (e) {
    console.warn("escena viva", e);
  }
  marca("viva");
  info.tiempos = tiempos.join(" · ");
  info.lista = true;
  window.sh4.redibujar?.();
}

const lista = await (await fetch("/juego-lista.json")).json();

const salas = lista.data.filter(f => /^[a-z]{2}\d\d[a-z0-9_]*\.bin$/.test(f)).map(f => f.slice(0, -4));

let nombres = {
  mundos: {},
  salas: {},
  variantes: {}
};

try {
  const r = await fetch("./nombres.json", {
    cache: "no-cache"
  });
  if (r.ok) nombres = {
    ...nombres,
    ...await r.json()
  };
} catch {}

const MUNDOS_ORDEN = [ "rl", "sb", "fr", "mz", "bd", "cm", "ie", "hs", "st", "gt", "ls", "ed" ];

function partesNombre(s) {
  const m = s.match(/^([a-z]{2})(\d\d)([a-h])?(_.*)?$/) || [];
  const mundo = m[1] || s.slice(0, 2), clave = (m[1] || "") + (m[2] || "") + (m[4] || "");
  const sala = nombres.salas[clave]?.nombre || nombres.salas[m[1] + m[2]]?.nombre;
  const variante = m[3] ? nombres.variantes[s]?.nombre || "estado " + m[3] : null;
  return {
    mundo: mundo,
    numero: m[2],
    sala: sala,
    variante: variante
  };
}

function etiqueta(s) {
  const p = partesNombre(s);
  const txt = [ p.numero || s.slice(2), p.sala, p.variante ].filter(Boolean).join(" · ");
  return `${txt}  [${s}]`;
}

window.sh4.nombreCompleto = s => {
  const p = partesNombre(s);
  return [ nombres.mundos[p.mundo]?.nombre || p.mundo, p.sala, p.variante ].filter(Boolean).join(" · ");
};

const sel = $("sala");

const grupos = {};

for (const s of salas) {
  const mu = s.slice(0, 2);
  if (!grupos[mu]) grupos[mu] = [];
  grupos[mu].push(s);
}

const ordenMundos = Object.keys(grupos).sort((a, b) => (MUNDOS_ORDEN.indexOf(a) + 1 || 99) - (MUNDOS_ORDEN.indexOf(b) + 1 || 99) || a.localeCompare(b));

for (const mu of ordenMundos) {
  const og = document.createElement("optgroup");
  og.label = (nombres.mundos[mu]?.nombre || mu) + `  (${mu})`;
  for (const s of grupos[mu]) og.appendChild(new Option(etiqueta(s), s));
  sel.appendChild(og);
}

sel.value = q.get("sala") || "rl01a";

sel.addEventListener("change", () => cargarSala(sel.value).catch(e => estado("error: " + e.message)));

$("vista").addEventListener("click", () => controles.lock());

const OJOS = 1.6, RADIO = .25, PASO = .45;

let colision = null, volar = q.has("volar");

const rayo = new THREE.Raycaster, abajo = new THREE.Vector3(0, -1, 0), tmp = new THREE.Vector3;

const PISO_COMUN = crearPiso(THREE, .005);

function pisar(forzar) {
  if (!colision || volar) return;
  const y = PISO_COMUN.visor(colision, jugador.position.x, jugador.position.y - OJOS, jugador.position.z, forzar ? 5 : .5, forzar ? 45 : 2.5);
  if (y != null) jugador.position.y = y + OJOS;
}

function pisoMasGrande() {
  if (!colision) return null;
  const p = colision.geometry.attributes.position, a = new THREE.Vector3, b = new THREE.Vector3, c = new THREE.Vector3;
  const n = new THREE.Vector3;
  const cands = [];
  for (let i = 0; i < p.count; i += 3) {
    a.fromBufferAttribute(p, i);
    b.fromBufferAttribute(p, i + 1);
    c.fromBufferAttribute(p, i + 2);
    n.subVectors(b, a).cross(c.clone().sub(a));
    const ar = n.length() / 2;
    if (ar > .05 && Math.abs(n.normalize().y) > .9) cands.push({
      ar: ar,
      centro: a.clone().add(b).add(c).divideScalar(3)
    });
  }
  cands.sort((x, y) => y.ar - x.ar);
  const r = new THREE.Raycaster;
  const buenos = [];
  const lado = new THREE.Vector3;
  for (const c of cands.slice(0, colision.userData.derivada ? 120 : 300)) {
    const {centro: centro} = c;
    r.set(centro.clone().add(new THREE.Vector3(0, -.05, 0)), new THREE.Vector3(0, -1, 0));
    r.far = 6;
    if (r.intersectObject(colision).some(x => Math.abs(x.face.normal.y) > .6)) continue;
    r.set(centro.clone().add(new THREE.Vector3(0, .05, 0)), new THREE.Vector3(0, 1, 0));
    r.far = OJOS + .2;
    if (r.intersectObject(colision).length) continue;
    let libre = true;
    for (let k = 0; k < 8 && libre; k++) {
      const a = k * Math.PI / 4;
      lado.set(Math.sin(a), 0, Math.cos(a));
      r.set(centro.clone().add(new THREE.Vector3(0, 1.1, 0)), lado);
      r.far = .45;
      if (r.intersectObject(colision).length) libre = false;
    }
    if (!libre) continue;
    buenos.push(c);
  }
  if (!buenos.length) return cands[0]?.centro || null;
  if (colision.userData.derivada) {
    const bajos = buenos.filter(c => c.ar >= 2).sort((a, b) => a.centro.y - b.centro.y);
    if (bajos.length) return bajos[0].centro;
  }
  const grandes = buenos.slice(0, 40);
  const minY = Math.min(...grandes.map(c => c.centro.y));
  return grandes.find(c => c.centro.y < minY + 1.5).centro;
}

function giroMasAbierto() {
  if (!colision) return 0;
  const r = new THREE.Raycaster, o = jugador.position.clone();
  o.y -= .4;
  let mejor = 0, lejos = -1;
  for (let k = 0; k < 16; k++) {
    const g = k * 22.5, rad = g * Math.PI / 180;
    r.set(o, new THREE.Vector3(-Math.sin(rad), 0, -Math.cos(rad)));
    r.far = 60;
    const d = r.intersectObject(colision)[0]?.distance ?? 60;
    if (d > lejos) {
      lejos = d;
      mejor = g;
    }
  }
  return mejor;
}

function volverAlPiso() {
  const piso = pisoMasGrande();
  if (piso) jugador.position.set(piso.x, piso.y + OJOS, piso.z);
}

function libre(desde, dir, dist) {
  if (!colision || volar) return true;
  for (const alto of [ PASO - OJOS + .05, -.6, 0 ]) {
    tmp.copy(desde);
    tmp.y += alto;
    rayo.set(tmp, dir);
    rayo.far = dist + RADIO;
    if (rayo.intersectObject(colision).some(x => Math.abs(x.face.normal.y) < .6)) return false;
  }
  return true;
}

const mover = (dir, v) => {
  const d = dir.clone().normalize();
  if (libre(jugador.position, d, v)) {
    jugador.position.addScaledVector(d, v);
    return;
  }
  for (const eje of [ new THREE.Vector3(Math.sign(d.x), 0, 0), new THREE.Vector3(0, 0, Math.sign(d.z)) ]) {
    const parte = Math.abs(eje.x ? d.x : d.z) * v;
    if (parte > 1e-4 && libre(jugador.position, eje, parte)) jugador.position.addScaledVector(eje, parte);
  }
};

addEventListener("keydown", e => {
  if (e.code === "KeyF") window.sh4.volando = volar = !volar;
  if (e.code === "KeyR") volverAlPiso();
  if (e.code === "KeyC" && colision) colision.visible = !colision.visible;
});

const teclas = {};

addEventListener("keydown", e => {
  teclas[e.code] = true;
});

addEventListener("keyup", e => {
  teclas[e.code] = false;
});

const reloj = new THREE.Clock;

const adelante = new THREE.Vector3, costado = new THREE.Vector3;

const quieto = q.has("quieto");

let sucio = 3;

window.sh4.redibujar = () => {
  sucio = 2;
};

renderer.setAnimationLoop(() => {
  if (quieto) {
    if (sucio <= 0) return;
    sucio--;
  }
  const dt = Math.min(reloj.getDelta(), .1);
  const dtAnim = viva?.congelado ? 0 : dt;
  if (camaraJuego?.activa && henry?.modo === "3ra" && !volar && !renderer.xr.isPresenting) camaraJuego.adelanteControl(adelante); else {
    camara.getWorldDirection(adelante);
    adelante.y = 0;
    adelante.normalize();
  }
  costado.crossVectors(adelante, camara.up).normalize();
  const extra = panelVR?.abierto || grillaSalas?.abierto ? null : controlesExtra?.entrada(adelante, costado);
  if (henry && golpeBloqueado()) {
    henry.entradas.atacar = null;
    henry.entradas.preparar = null;
  }
  const corriendo = !!(teclas.ShiftLeft || teclas.ShiftRight || extra?.corriendo);
  const en3ra = henry?.modo === "3ra" && !volar;
  let v = (en3ra ? henry.velocidad(corriendo) : corriendo ? 4 : 1.6) * dt;
  const dir = new THREE.Vector3;
  if (teclas.KeyW || teclas.ArrowUp) dir.add(adelante);
  if (teclas.KeyS || teclas.ArrowDown) dir.sub(adelante);
  if (teclas.KeyD || teclas.ArrowRight) dir.add(costado);
  if (teclas.KeyA || teclas.ArrowLeft) dir.sub(costado);
  if (extra?.dir.lengthSq() > 0) {
    dir.add(extra.dir);
    v *= Math.max(.35, extra.analogico);
  }
  if (dir.lengthSq() > 0) {
    mover(dir, v);
    pisar();
  }
  henry?.actualizar(dt, {
    moviendo: dir.lengthSq() > 0,
    corriendo: corriendo,
    dir: dir.lengthSq() > 0 ? dir.clone().normalize() : null,
    fuerza: extra?.dir.lengthSq() > 0 ? Math.max(.4, extra.analogico) : 1,
    enVR: renderer.xr.isPresenting
  });
  if (dtAnim > 0) enemigos?.actualizar(dtAnim);
  if (!viva?.ruidoPropio) efectos?.enemigos(enemigos);
  if (!volar && !renderer.xr.isPresenting) camaraJuego?.actualizar(dt);
  window.sh4.sonido?.corriendo(corriendo);
  window.sh4.sonido?.actualizar(dt);
  escenaJuego?.actualizar(dtAnim, salas);
  viva?.actualizar(dtAnim, dt);
  if (volar && teclas.KeyE) jugador.position.y += v;
  if (volar && teclas.KeyQ) jugador.position.y -= v;
  efectosVisor?.actualizar(dt);
  efectos?.actualizar(dtAnim);
  if (renderer.xr.isPresenting) {
    cascoVR.actualizar(dt, {
      moviendo: dir.lengthSq() > 0 || !!extra?.girando
    });
    panelVR?.actualizar(dt);
    grillaSalas?.actualizar(dt);
  }
  if (!window.sh4.mejorado?.alDibujar(dt)) renderer.render(escena, camara);
});

async function foto(tipo) {
  const e = (new THREE.Euler).setFromQuaternion(camara.getWorldQuaternion(new THREE.Quaternion), "YXZ");
  const nombre = info.sala;
  const meta = {
    sala: nombre,
    titulo: "Silent Hill 4 · " + (window.sh4.nombreCompleto?.(nombre) || nombre),
    descripcion: `${window.sh4.nombreCompleto?.(nombre) || nombre} [${nombre}], leído de los archivos originales del juego.` + (viva ? ` Animación: ${viva.resumen()}.` : ""),
    posicion: camara.getWorldPosition(new THREE.Vector3).toArray(),
    rumbo: THREE.MathUtils.radToDeg(e.y),
    inclinacion: THREE.MathUtils.radToDeg(e.x),
    fov: camara.fov,
    vista: window.sh4.inspeccion?.estado.vista || "normal"
  };
  estado("sacando foto " + tipo + "…");
  try {
    const {blob: blob, ancho: ancho, alto: alto} = await sacarFoto(THREE, renderer, escena, camara, tipo, meta);
    const f = new Date, dos = n => String(n).padStart(2, "0");
    const sello = `${f.getFullYear()}${dos(f.getMonth() + 1)}${dos(f.getDate())}_${dos(f.getHours())}${dos(f.getMinutes())}${dos(f.getSeconds())}`;
    descargar(blob, `SH4_${nombre}_${tipo}_${sello}.jpg`);
    estado(`Foto ${tipo} lista (${ancho}×${alto}, ${(blob.size / 1e6).toFixed(1)} MB): quedó en Descargas`);
  } catch (err) {
    estado("no se pudo sacar la foto: " + err.message);
  }
  window.sh4.redibujar();
}

window.sh4.foto = foto;

window.sh4.renderer = renderer;

addEventListener("keydown", e => {
  if (e.code === "KeyP") foto(e.shiftKey ? "8k" : "4k");
  if (e.code === "KeyO") foto(e.shiftKey ? "360-4k" : "360-8k");
});

for (const [id, t] of [ [ "foto4k", "4k" ], [ "foto8k", "8k" ], [ "foto360_4k", "360-4k" ], [ "foto360", "360-8k" ] ]) $(id)?.addEventListener("click", () => foto(t));

window.sh4.cargar = s => {
  info.lista = false;
  return cargarSala(s);
};

window.sh4.girar = g => {
  camara.rotation.set(0, g * Math.PI / 180, 0);
  window.sh4.redibujar();
};

window.sh4.giroAbierto = giroMasAbierto;

if (q.has("limpio")) for (const id of [ "ayuda", "VRButton" ]) document.getElementById(id)?.remove();

iniciarInspeccion({
  THREE: THREE,
  escena: escena,
  camara: camara,
  sala: salaActual,
  info: info,
  escala: ESCALA,
  redibujar: () => window.sh4.redibujar(),
  getColision: () => colision
});

window.sh4.mejorado = iniciarMejorado({
  THREE: THREE,
  renderer: renderer,
  escena: escena,
  camara: camara,
  sala: salaActual,
  info: info,
  redibujar: () => window.sh4.redibujar()
});

if (!q.has("sinefectos")) {
  try {
    const infoFx = {
      get sala() {
        return info.sala;
      },
      get luces() {
        return info.luces;
      },
      get niebla() {
        return info.nieblaJuego ?? info.niebla;
      }
    };
    efectos = iniciarEfectos({
      THREE: THREE,
      renderer: renderer,
      escena: escena,
      camara: camara,
      sala: salaActual,
      info: infoFx,
      escala: ESCALA
    });
    efectosVisor = iniciarEfectosVisor({
      THREE: THREE,
      fx: efectos,
      camara: camara,
      getColision: () => colision,
      sala: salaActual,
      escala: ESCALA,
      estado: t => estado(document.getElementById("estado").textContent.split("\n")[0] + "\n" + t),
      select: $("efecto"),
      boton: $("disparar")
    });
    window.sh4.efectos = efectos;
    window.sh4.efectosVisor = efectosVisor;
  } catch (e) {
    console.warn("efectos no cargaron:", e);
    efectos = efectosVisor = null;
  }
}

if (!efectos) $("efectos")?.remove();

escenaJuego = iniciarEscenaJuego({
  THREE: THREE,
  escena: escena,
  sala: salaActual,
  jugador: jugador,
  camara: camara,
  escala: ESCALA,
  ojos: OJOS,
  cargarSala: (s, o) => cargarSala(s, o).catch(e => estado("error: " + e.message)),
  redibujar: () => window.sh4.redibujar()
});

window.sh4.escenaJuego = escenaJuego;

try {
  viva = iniciarEscenaViva({
    THREE: THREE,
    renderer: renderer,
    escena: escena,
    camara: camara,
    jugador: jugador,
    sala: salaActual,
    info: info,
    escala: ESCALA,
    getColision: () => colision,
    ojos: OJOS,
    recargar: (s, o) => cargarSala(s, o).catch(e => estado("error: " + e.message)),
    redibujar: () => window.sh4.redibujar()
  });
  window.sh4.viva = viva;
  escenaJuego.varianteDe = b => viva.varianteDe(b);
} catch (e) {
  console.warn("escena viva no cargó:", e);
  viva = null;
}

const controlesExtra = iniciarControlesExtra({
  THREE: THREE,
  renderer: renderer,
  camara: camara,
  jugador: jugador,
  ojos: OJOS,
  teclas: teclas
});

window.sh4.controlesExtra = controlesExtra;

const cascoVR = prepararCasco({
  renderer: renderer,
  camara: camara,
  padre: controlesExtra.ajuste,
  rig: jugador,
  ojos: OJOS,
  mejorado: () => window.sh4.mejorado
});

window.sh4.casco = cascoVR;

try {
  panelVR = crearPanelVR({
    THREE: THREE,
    renderer: renderer,
    camara: camara,
    jugador: jugador,
    viva: viva,
    info: info,
    salas: () => salas,
    cargarSala: s => cargarSala(s).catch(e => estado("error: " + e.message)),
    nombreSala: s => window.sh4.nombreCompleto?.(s) || s,
    elegirSala: () => {
      nivelSalas = "mundos";
      mundoVR = (info.sala || "rl").slice(0, 2);
      grillaSalas?.abrir();
    }
  });
  window.sh4.panelVR = panelVR;
} catch (e) {
  console.warn("panel del casco no cargó:", e);
  panelVR = null;
}

let nivelSalas = "mundos", mundoVR = "rl", MINI = null;

indiceMiniaturas().then(i => {
  MINI = i;
  grillaSalas?.refrescar();
});

const salasDe = mu => grupos[mu] || [];

try {
  grillaSalas = crearListaVR({
    THREE: THREE,
    renderer: renderer,
    camara: camara,
    jugador: jugador,
    ancho: 1.5,
    distancia: 1.15,
    abajo: .1,
    curvo: true,
    grilla: true,
    columnas: 4,
    filasGrilla: 3,
    abreConPalito: false,
    titulo: () => nivelSalas === "mundos" ? sitioIngles() ? "WORLDS" : "MUNDOS" : nombres.mundos[mundoVR]?.nombre || mundoVR,
    filas: () => nivelSalas === "mundos" ? ordenMundos.map(mu => ({
      texto: nombres.mundos[mu]?.nombre || mu,
      dato: salasDe(mu).length + (sitioIngles() ? " rooms" : " salas"),
      img: urlMiniatura(MINI, "mundos", mu),
      marcada: mu === (info.sala || "").slice(0, 2)
    })) : salasDe(mundoVR).map(s => {
      const p = partesNombre(s), t = p.sala || (sitioIngles() ? "Room " : "Sala ") + (p.numero || s.slice(2));
      return {
        texto: t,
        dato: p.variante || "",
        sinFoto: t,
        img: urlMiniatura(MINI, "salas", s),
        marcada: s === info.sala
      };
    }),
    alElegir: i => {
      if (nivelSalas === "mundos") {
        const mu = ordenMundos[i];
        if (!mu) return;
        mundoVR = mu;
        nivelSalas = "salas";
        grillaSalas.irA(Math.max(0, salasDe(mu).indexOf(info.sala)));
        return;
      }
      const s = salasDe(mundoVR)[i];
      if (!s) return;
      grillaSalas.cerrar();
      sel.value = s;
      cargarSala(s).catch(e => estado("error: " + e.message));
    },
    alVolver: () => {
      if (nivelSalas === "mundos") return false;
      nivelSalas = "mundos";
      grillaSalas.irA(Math.max(0, ordenMundos.indexOf(mundoVR)));
      return true;
    },
    botones: () => [ nivelSalas === "salas" ? {
      id: "volver",
      texto: sitioIngles() ? "Worlds" : "Mundos"
    } : null, {
      id: "cerrar",
      texto: sitioIngles() ? "Close" : "Cerrar"
    } ].filter(Boolean),
    alBoton: id => {
      if (id === "volver") grillaSalas.volver(); else if (id === "cerrar") grillaSalas.cerrar();
    }
  });
  window.sh4.grillaSalas = grillaSalas;
} catch (e) {
  console.warn("grilla de salas no cargó:", e);
  grillaSalas = null;
}

function golpeBloqueado() {
  return !!(renderer.xr.isPresenting && (panelVR?.abierto || panelVR?.gestoEnCurso || grillaSalas?.abierto || grillaSalas?.fueParaLaLista()));
}

addEventListener("keydown", e => {
  if (e.code === "KeyE" && !e.isTrusted && golpeBloqueado()) e.stopImmediatePropagation();
}, true);

window.sh4.probarPanelVR = fila => {
  if (!controlesExtra.ajuste.parent) {
    jugador.add(controlesExtra.ajuste);
    controlesExtra.ajuste.position.set(0, -OJOS, 0);
  }
  const r = panelVR?.vistaPrevia(fila);
  window.sh4.redibujar();
  return r;
};

window.sh4.probarGrillaSalas = (fila = 0, nivel = "mundos", mundo) => {
  if (!controlesExtra.ajuste.parent) {
    jugador.add(controlesExtra.ajuste);
    controlesExtra.ajuste.position.set(0, -OJOS, 0);
  }
  nivelSalas = nivel;
  if (mundo) mundoVR = mundo;
  const r = grillaSalas?.vistaPrevia(fila);
  window.sh4.redibujar();
  return {
    ...r,
    fotos: grillaSalas?.fotos()
  };
};

iniciarSonido({
  THREE: THREE,
  camara: camara,
  jugador: jugador,
  escala: ESCALA,
  ojos: OJOS,
  renderer: renderer
}).then(s => {
  window.sh4.sonido = s;
  if (info.sala) s.alCargarSala(info.sala, {
    mitad: info.mitad ?? 1
  });
  viva?.aplicarSonido();
}).catch(e => console.warn("Sonido no cargó:", e.message));

iniciarHenry({
  THREE: THREE,
  escena: escena,
  camara: camara,
  jugador: jugador,
  ojos: OJOS,
  getColision: () => colision,
  renderer: renderer,
  teclasInventario: [ "Tab" ]
}).then(h => {
  henry = h;
  window.sh4.henry = h;
  const entradaOriginal = h.entrada;
  h.entrada = (o = {}) => {
    if (!golpeBloqueado()) return entradaOriginal(o);
    const f = {
      ...o
    };
    if ("atacar" in f) f.atacar = null;
    if ("preparar" in f) f.preparar = null;
    return entradaOriginal(f);
  };
  efectosVisor?.conectarHenry(h);
  if (!q.has("sinenemigos")) {
    try {
      enemigos = iniciarEnemigos({
        THREE: THREE,
        escena: escena,
        jugador: jugador,
        henry: h,
        getColision: () => colision,
        escala: ESCALA,
        ojos: OJOS,
        nivel: q.has("nivel") ? +q.get("nivel") : 1
      });
      enemigos.verEstados = q.has("verIA");
      window.sh4.enemigos = enemigos;
      if (info.sala) (viva ? viva.aplicarEnemigos(info.sala) : enemigos.alCargarSala(info.sala, {
        mitad: info.mitad ?? 1
      })).then(r => r && mostrarEnemigos(r)).catch(e => console.warn("enemigos", e));
    } catch (e) {
      console.warn("enemigos no cargaron:", e);
      enemigos = null;
    }
  }
  camaraJuego = iniciarCamaraJuego({
    THREE: THREE,
    camara: camara,
    jugador: jugador,
    henry: h,
    getColision: () => colision,
    escala: ESCALA,
    ojos: OJOS,
    renderer: renderer
  });
  camaraJuego.activar(!q.has("camlibre"));
  window.sh4.camaraJuego = camaraJuego;
  if (info.sala) camaraJuego.alCargarSala(info.sala);
  if (info.sala) {
    h.ponerModo(vistaElegida || h.vistaPorDefecto(info.sala));
    const g = camara.rotation.y;
    h.ubicarRumbo(Math.atan2(-Math.sin(g), -Math.cos(g)));
  }
  window.sh4.redibujar?.();
}).catch(e => console.warn("Henry no cargó:", e.message));

function mostrarEnemigos(r) {
  if (!r.enemigos && !r.pendientes) return;
  const sin = [ ...new Set(enemigos.pendientes.map(d => d.enemigo)) ].join(", ");
  const linea = (r.enemigos ? `enemigos: ${r.enemigos}` : "sin enemigos con IA") + (sin ? ` (todavía sin IA: ${sin})` : "");
  info.enemigos = r.enemigos;
  info.enemigosPendientes = sin;
  estado(document.getElementById("estado").textContent.split("\n").slice(0, 2).join("\n") + "\n" + linea);
}

addEventListener("keydown", e => {
  if (e.code === "KeyB" && camaraJuego) estado("Cámara: " + (camaraJuego.activar(!camaraJuego.activa) ? "original del juego" : "libre"));
});

addEventListener("keydown", e => {
  if (e.code !== "KeyV" || !henry) return;
  vistaElegida = henry.alternar();
  estado(document.getElementById("estado").textContent.split("\n")[0] + "\nvista: " + (vistaElegida === "3ra" ? "tercera persona" : "primera persona"));
});

cargarSala(sel.value).catch(e => estado("error: " + e.message));
