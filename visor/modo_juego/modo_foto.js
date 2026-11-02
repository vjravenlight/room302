// SH4 web — FeniXVOID · Project Ravenlight
import * as THREE from "three";

import { sacarFoto, descargar } from "../fotos.js";

import { factorNiebla } from "../lib/sala.js";

import { t } from "../textos_sitio.js";

import { pintarConFuente } from "./textos_dom.js";

import { dominanteXR } from "../jugador/casco_comun.js";

const q = new URLSearchParams(location.search);

const FPS = 30;

const RADIO_MAX = 40;

const MARGEN_SALA = 2;

const VEL = 2.2, RAPIDO = 4;

const FOV_MIN = 6, FOV_MAX = 115;

const OPCIONES = [ "personajes", "henry", "efectos", "ruido", "niebla", "subtitulos", "filtro" ];

const pad3 = n => String(n).padStart(3, "0");

const grados = r => THREE.MathUtils.radToDeg(r);

export function iniciarModoFoto({M: M, juego: juego}) {
  const {escena: escena, renderer: renderer, camara: camara} = M;
  const camF = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, .02, 400);
  const rigF = new THREE.Group;
  rigF.name = "modo foto";
  rigF.add(camF);
  renderer.domElement.dataset.sh4lienzo = "1";
  const est = {
    activo: false,
    saliendo: false,
    sacando: false,
    panel: true,
    res: "4k",
    zona: "302",
    pos: new THREE.Vector3,
    pos0: new THREE.Vector3,
    yaw: 0,
    pitch: 0,
    roll: 0,
    fov: 60,
    fov0: 60,
    caja: null,
    fovJuego: 60,
    aspectJuego: 1,
    niebla0: 1,
    subir: 0,
    mirabaLibre: false,
    entradas: 0,
    fotos: []
  };
  const op = {
    personajes: true,
    henry: true,
    efectos: true,
    ruido: true,
    niebla: true,
    subtitulos: false,
    filtro: false
  };
  const hay = {
    personajes: false,
    henry: false,
    efectos: false,
    ruido: false,
    niebla: true,
    subtitulos: false,
    filtro: false
  };
  const ahoraReal = performance.now.bind(performance);
  let relojPuesto = false, desfase = 0, paradoEn = null;
  function pararReloj() {
    if (!relojPuesto && !q.has("fotoSinReloj")) {
      try {
        performance.now = () => (paradoEn ?? ahoraReal()) - desfase;
        relojPuesto = true;
      } catch (e) {
        console.warn("modo foto: reloj", e);
      }
    }
    paradoEn = ahoraReal();
  }
  function soltarReloj() {
    if (paradoEn != null) {
      desfase += ahoraReal() - paradoEn;
      paradoEn = null;
    }
  }
  let suspendidos = [];
  const contextos = () => [ M.contextoAudio(), juego.ambiente?.son?.ctx ].filter((c, i, a) => c && a.indexOf(c) === i);
  function pausarAudio() {
    suspendidos = contextos().filter(c => c.state === "running");
    for (const c of suspendidos) c.suspend().catch(() => {});
  }
  async function reanudarAudio() {
    const lista = suspendidos;
    suspendidos = [];
    await Promise.race([ Promise.all(lista.map(c => c.resume().catch(() => {}))), new Promise(ok => setTimeout(ok, 1500)) ]);
  }
  const ocultos = [];
  const esconder = o => {
    if (o && o.visible) {
      o.visible = false;
      ocultos.push(o);
    }
  };
  function esconderInterfaz() {
    esconder(M.jugador);
    esconder(M.pantalla.plano);
    esconder(M.pantalla.fondo);
    for (const o of escena.children) {
      if (o === rigF || o === M.jugador) continue;
      const m = o.material;
      if (o.name === "gesto de pausa" || m && !Array.isArray(m) && m.depthTest === false && o.renderOrder >= 50) esconder(o);
    }
  }
  function mostrarInterfaz() {
    while (ocultos.length) ocultos.pop().visible = true;
  }
  let listas = {
    personajes: [],
    henry: [],
    efectos: []
  };
  function raicesHenry() {
    const r = [];
    const h = juego.mundo?.henry?.personaje?.grupo;
    if (h?.parent && (h.visible || /^mundo/.test(juego.fase || ""))) r.push(h);
    for (const e of juego.demoActual?.personajes || []) if (e.ojo && e.obj?.grupo?.parent) r.push(e.obj.grupo);
    return r;
  }
  function juntarListas() {
    const henry = raicesHenry();
    const fx = juego.ambiente?.fx?.raiz || window.sh4?.efectos?.raiz || null;
    const dentro = (o, raiz) => {
      for (let x = o; x; x = x.parent) if (x === raiz) return true;
      return false;
    };
    const enHenry = o => henry.some(h => dentro(o, h));
    const personajes = [], efectos = [];
    escena.traverseVisible(o => {
      if (o === rigF || dentro(o, rigF)) return;
      if (o.isSkinnedMesh && !enHenry(o) && !(fx && dentro(o, fx))) personajes.push(o); else if ((o.isPoints || o.isSprite) && !(fx && dentro(o, fx))) efectos.push(o);
    });
    if (fx) efectos.push(fx);
    listas = {
      personajes: personajes.map(o => ({
        o: o,
        v: o.visible
      })),
      henry: henry.map(o => ({
        o: o,
        v: o.visible
      })),
      efectos: efectos.map(o => ({
        o: o,
        v: o.visible
      }))
    };
    hay.personajes = personajes.length > 0;
    hay.henry = henry.length > 0;
    hay.efectos = efectos.length > 0;
    op.personajes = true;
    op.efectos = true;
    op.henry = henry.some(h => h.visible);
  }
  function aplicarListas() {
    for (const {o: o, v: v} of listas.personajes) o.visible = op.personajes && v;
    for (const {o: o} of listas.henry) o.visible = op.henry;
    for (const {o: o, v: v} of listas.efectos) o.visible = op.efectos && v;
  }
  function devolverListas() {
    for (const k of Object.keys(listas)) for (const {o: o, v: v} of listas[k]) o.visible = v;
    listas = {
      personajes: [],
      henry: [],
      efectos: []
    };
  }
  let pegados = [];
  function juntarPegados() {
    pegados = [];
    for (const o of camara.children) if (o.name === "filtro_pantalla") pegados.push({
      o: o,
      tipo: "ruido",
      pos: o.position.clone(),
      esc: o.scale.clone()
    });
    for (const c of M.capas || []) if (c.plano.visible && c.plano.parent === camara) pegados.push({
      o: c.plano,
      tipo: "subtitulos",
      pos: c.plano.position.clone(),
      esc: c.plano.scale.clone()
    });
    const ruidoVivo = pegados.some(p => p.tipo === "ruido" && p.o.visible);
    hay.ruido = ruidoVivo;
    op.ruido = false;
    hay.subtitulos = pegados.some(p => p.tipo === "subtitulos");
    op.subtitulos = false;
  }
  function ajustarPegados(aspecto = null) {
    const vr = M.enVR();
    const k = vr ? 1 : Math.tan(THREE.MathUtils.degToRad(camF.fov) / 2) / Math.tan(THREE.MathUtils.degToRad(est.fovJuego) / 2);
    const asp = Math.max(aspecto ?? camF.aspect, camF.aspect);
    for (const p of pegados) {
      if (op[p.tipo]) {
        if (p.o.parent !== camF) camF.add(p.o);
        if (p.tipo === "ruido") {
          p.o.position.copy(p.pos);
          p.o.scale.set(p.esc.x * k * (vr ? 1 : asp / est.aspectJuego) * 1.02, p.esc.y * k * 1.02, 1);
        } else {
          p.o.position.set(p.pos.x * k, p.pos.y * k, p.pos.z);
          p.o.scale.copy(p.esc).multiplyScalar(k);
        }
      } else if (p.o.parent !== camara) {
        camara.add(p.o);
        p.o.position.copy(p.pos);
        p.o.scale.copy(p.esc);
      }
    }
  }
  function devolverPegados() {
    for (const p of pegados) {
      camara.add(p.o);
      p.o.position.copy(p.pos);
      p.o.scale.copy(p.esc);
    }
    pegados = [];
  }
  const mejorado = () => juego.mejorado || null;
  let mejAntes = null;
  function aplicarOpciones() {
    aplicarListas();
    factorNiebla(op.niebla ? est.niebla0 : 0);
    ajustarPegados();
    const mj = mejorado();
    if (mj?.activar && hay.filtro && mj.activo !== op.filtro) mj.activar(op.filtro);
    pintarPanel();
  }
  function alternar(k) {
    if (!hay[k]) return;
    op[k] = !op[k];
    aplicarOpciones();
    aviso(t("foto." + k) + ": " + t(op[k] ? "foto.si" : "foto.no"));
  }
  const _b = new THREE.Box3;
  function cajaSala() {
    const g = juego.cuarto?.grupo;
    if (!g) return null;
    try {
      _b.makeEmpty();
      _b.setFromObject(g);
      if (_b.isEmpty() || !Number.isFinite(_b.min.x) || !Number.isFinite(_b.max.x)) return null;
      const b = _b.clone();
      b.expandByPoint(est.pos0);
      b.expandByScalar(MARGEN_SALA);
      return b;
    } catch {
      return null;
    }
  }
  const _l = new THREE.Vector3;
  function limitar(p) {
    if (est.caja) est.caja.clampPoint(p, p);
    const d = p.distanceTo(est.pos0);
    if (d > RADIO_MAX) p.sub(est.pos0).multiplyScalar(RADIO_MAX / d).add(est.pos0);
    return p;
  }
  const css = document.createElement("style");
  const tam = M.tactil ? 1.25 : 1;
  css.textContent = `\n    html.sh4foto body > *:not(#modoFoto):not([data-sh4lienzo]) { visibility: hidden !important; }\n    html.sh4foto canvas[data-sh4lienzo] { cursor: crosshair; touch-action: none; }\n    #modoFoto { position: fixed; left: 50%; top: calc(8px + env(safe-area-inset-top)); transform: translateX(-50%); z-index: 80;\n      display: none; max-width: calc(100vw - 16px); box-sizing: border-box; padding: ${8 * tam}px ${10 * tam}px; color: #ece3d2;\n      background: rgba(8,5,4,.72); border: 1px solid rgba(122,59,30,.75); border-radius: 6px; font: ${13 * tam}px 'Cormorant Garamond', Georgia, serif;\n      user-select: none; -webkit-user-select: none; touch-action: manipulation; }\n    html.sh4foto #modoFoto { display: block; }\n    #modoFoto .mfFila { display: flex; flex-wrap: wrap; gap: ${6 * tam}px; justify-content: center; margin: ${4 * tam}px 0; }\n    #modoFoto button { min-height: ${30 * tam}px; padding: 0 ${10 * tam}px; border-radius: 4px; color: #ece3d2; background: rgba(10,7,6,.7);\n      border: 1px solid rgba(122,59,30,.7); font: inherit; letter-spacing: .06em; cursor: pointer; touch-action: manipulation; }\n    #modoFoto button:hover { border-color: #c0261a; }\n    #modoFoto button.si { background: rgba(140,26,18,.55); }\n    #modoFoto button.fuerte { background: rgba(140,26,18,.8); border-color: #c0261a; }\n    #modoFoto button canvas { display: block; margin: 0 auto; }\n    #modoFoto .mfTitulo, #modoFoto .mfAyuda, #modoFoto .mfAviso { text-align: center; }\n    #modoFoto .mfAyuda { color: #a89c8c; font-size: ${11.5 * tam}px; margin-top: 4px; }\n    #modoFoto .mfAviso { color: #ffd9c4; min-height: 1.2em; font-size: ${12.5 * tam}px; }\n    #modoFoto.chico > :not(.mfMini) { display: none !important; }\n    #modoFoto .mfMini { display: none; }\n    #modoFoto.chico .mfMini { display: block; }\n    #modoFoto.chico { padding: 4px; }\n    @media (max-width: 560px) { #modoFoto .mfAyuda { display: none; } }`;
  document.head.appendChild(css);
  const panel = document.createElement("div");
  panel.id = "modoFoto";
  panel.innerHTML = `<button class="mfMini" data-f="panel"></button><div class="mfTitulo"></div>\n    <div class="mfFila" data-fila="acciones"></div><div class="mfFila" data-fila="opciones"></div>\n    <div class="mfAyuda"></div><div class="mfAviso"></div>`;
  document.body.appendChild(panel);
  const fila = n => panel.querySelector(`[data-fila="${n}"]`);
  const crearBoton = (padre, f) => {
    const b = document.createElement("button");
    b.dataset.f = f;
    b.tabIndex = -1;
    padre.appendChild(b);
    b.addEventListener("mousedown", e => e.preventDefault());
    return b;
  };
  for (const f of [ "foto", "360", "res", ...M.tactil ? [ "subir", "bajar" ] : [], "panel", "salir" ]) crearBoton(fila("acciones"), f);
  for (const f of OPCIONES) crearBoton(fila("opciones"), f);
  panel.addEventListener("click", e => {
    const b = e.target.closest("button");
    if (!b) return;
    e.stopPropagation();
    const f = b.dataset.f;
    if (f === "foto") foto(est.res); else if (f === "360") foto("360-" + est.res); else if (f === "res") {
      est.res = est.res === "4k" ? "8k" : "4k";
      pintarPanel();
    } else if (f === "panel") {
      est.panel = !est.panel;
      pintarPanel();
    } else if (f === "salir") salir(); else if (OPCIONES.includes(f)) alternar(f);
  });
  for (const [f, v] of [ [ "subir", 1 ], [ "bajar", -1 ] ]) {
    const b = panel.querySelector(`[data-f="${f}"]`);
    if (!b) continue;
    const soltar = () => {
      if (est.subir === v) est.subir = 0;
      b.classList.remove("si");
    };
    b.addEventListener("pointerdown", e => {
      e.preventDefault();
      est.subir = v;
      b.classList.add("si");
    });
    for (const ev of [ "pointerup", "pointercancel", "pointerleave" ]) b.addEventListener(ev, soltar);
  }
  const rotulo = (el, txt) => {
    if (!el) return;
    if (juego.fuente) pintarConFuente(el, juego.fuente, txt, {
      px: .6 * tam,
      alinear: "centro"
    }); else el.textContent = txt;
  };
  function pintarPanel() {
    panel.classList.toggle("chico", !est.panel);
    rotulo(panel.querySelector(".mfMini"), t("foto.titulo"));
    const D = juego.demoActual;
    const sub = D ? "  ·  " + t("foto.cine", D.nom || "d_" + pad3(D.id), cuadroDe(D) ?? "-") : "";
    rotulo(panel.querySelector(".mfTitulo"), t("foto.titulo") + sub);
    for (const b of panel.querySelectorAll("button[data-f]")) {
      const f = b.dataset.f;
      if (OPCIONES.includes(f)) {
        b.style.display = hay[f] ? "" : "none";
        b.classList.toggle("si", !!op[f]);
        rotulo(b, t("foto." + f) + ": " + t(op[f] ? "foto.si" : "foto.no"));
      } else if (f === "res") rotulo(b, t("foto.res", est.res.toUpperCase())); else if (f === "foto") {
        b.classList.add("fuerte");
        rotulo(b, t("foto.foto") + " " + est.res.toUpperCase());
      } else if (f === "360") {
        b.classList.add("fuerte");
        rotulo(b, t("foto.360") + " " + est.res.toUpperCase());
      } else if (f !== "panel" || b.classList.contains("mfMini") === false) rotulo(b, t("foto." + f));
    }
    rotulo(panel.querySelector(".mfMini"), t("foto.titulo"));
    rotulo(panel.querySelector(".mfAyuda"), t(M.tactil ? "foto.ayuda.tactil" : "foto.ayuda.pc").replace(/ · /g, "  ·  "));
    pintarHud();
  }
  let tAviso = null, textoAviso = "";
  function aviso(txt, seg = 4) {
    textoAviso = txt || "";
    rotulo(panel.querySelector(".mfAviso"), textoAviso);
    clearTimeout(tAviso);
    if (txt) tAviso = setTimeout(() => {
      textoAviso = "";
      rotulo(panel.querySelector(".mfAviso"), "");
      pintarHud();
    }, seg * 1e3);
    pintarHud();
    if (q.has("quieto")) console.log("[modo foto]", txt);
  }
  const lzHud = document.createElement("canvas");
  lzHud.width = 1024;
  lzHud.height = 192;
  const texHud = new THREE.CanvasTexture(lzHud);
  texHud.colorSpace = THREE.SRGBColorSpace;
  texHud.minFilter = THREE.LinearFilter;
  texHud.generateMipmaps = false;
  const hud = new THREE.Mesh(new THREE.PlaneGeometry(.9, .9 * 192 / 1024), new THREE.MeshBasicMaterial({
    map: texHud,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    toneMapped: false
  }));
  hud.renderOrder = 999;
  hud.frustumCulled = false;
  hud.position.set(0, -.34, -1.15);
  hud.rotation.x = -.25;
  hud.visible = false;
  camF.add(hud);
  function pintarHud() {
    if (!M.enVR()) {
      hud.visible = false;
      return;
    }
    const g = lzHud.getContext("2d");
    g.clearRect(0, 0, lzHud.width, lzHud.height);
    g.fillStyle = "rgba(8,5,4,.78)";
    g.fillRect(0, 0, lzHud.width, lzHud.height);
    g.strokeStyle = "rgba(160,50,30,.9)";
    g.lineWidth = 3;
    g.strokeRect(2, 2, lzHud.width - 4, lzHud.height - 4);
    const lineas = [ t("foto.titulo") + "   ·   " + (op.personajes ? "" : t("foto.personajes") + ": " + t("foto.no")), t("foto.ayuda.vr"), textoAviso ];
    const f = juego.fuente;
    lineas.forEach((l, i) => {
      if (!l) return;
      const y = 22 + i * 56, color = i === 2 ? "#ffd9c4" : i === 0 ? "#f0e4d2" : "#cfc4b4";
      if (f) {
        const ancho = f.anchoLinea(l) || 1, esc = Math.min(2.2, (lzHud.width - 40) / ancho);
        f.escribir(g, l, lzHud.width / 2 / esc, y / esc, {
          escala: esc,
          alinear: "centro",
          color: color
        });
      } else {
        g.font = "30px Georgia, serif";
        g.textAlign = "center";
        g.fillStyle = color;
        g.fillText(l, lzHud.width / 2, y + 30);
      }
    });
    texHud.needsUpdate = true;
    hud.visible = est.activo;
  }
  const tec = {};
  addEventListener("blur", () => {
    for (const k of Object.keys(tec)) tec[k] = false;
  });
  M.filtrarTeclas(e => {
    if (/^(INPUT|SELECT|TEXTAREA)$/.test(e.target?.tagName)) return false;
    const abajo = e.type === "keydown";
    if (!est.activo) {
      if (abajo && !e.repeat && !e.ctrlKey && !e.metaKey && !e.altKey && (e.code === "F2" || e.code === "KeyC")) return entrar();
      return false;
    }
    if (!abajo) {
      tec[e.code] = false;
      return false;
    }
    if (e.ctrlKey || e.metaKey || e.altKey || /^F(5|11|12)$/.test(e.code)) return false;
    tec[e.code] = true;
    if (e.repeat) return true;
    const n = /^(Digit|Numpad)([1-7])$/.exec(e.code);
    if (n) {
      alternar(OPCIONES[+n[2] - 1]);
      return true;
    }
    switch (e.code) {
     case "KeyC":
     case "F2":
     case "Escape":
      salir();
      break;

     case "KeyP":
      foto(e.shiftKey ? "8k" : "4k");
      break;

     case "KeyO":
      foto(e.shiftKey ? "360-4k" : "360-8k");
      break;

     case "Enter":
     case "NumpadEnter":
      foto(est.res);
      break;

     case "KeyR":
      est.roll = 0;
      est.fov = est.fov0;
      break;

     case "KeyH":
      est.panel = !est.panel;
      pintarPanel();
      break;

     default:
      break;
    }
    return true;
  });
  const enPanel = e => panel.contains(e.target);
  let arrastre = null;
  const toques = new Map;
  function mirar(dx, dy, k) {
    const z = est.fov / 60;
    est.yaw -= dx * k * z;
    est.pitch = THREE.MathUtils.clamp(est.pitch - dy * k * z, -1.55, 1.55);
  }
  function zoom(f) {
    est.fov = THREE.MathUtils.clamp(est.fov * f, FOV_MIN, FOV_MAX);
  }
  const _mf = new THREE.Vector3, _mr = new THREE.Vector3, _eM = new THREE.Euler(0, 0, 0, "YXZ");
  function moverCamara(adelante, derecha, arriba) {
    _eM.set(est.pitch, est.yaw, 0, "YXZ");
    _mf.set(0, 0, -1).applyEuler(_eM);
    _mr.set(Math.cos(est.yaw), 0, -Math.sin(est.yaw));
    est.pos.addScaledVector(_mf, adelante).addScaledVector(_mr, derecha);
    est.pos.y += arriba;
    limitar(est.pos);
  }
  const EVENTOS = [ "pointerdown", "pointermove", "pointerup", "mousedown", "mousemove", "mouseup", "click", "dblclick", "wheel", "contextmenu", "touchstart", "touchmove", "touchend", "touchcancel" ];
  const PASAN = new Set([ "pointerup", "mouseup", "touchend", "touchcancel" ]);
  const alEvento = e => {
    if (!est.activo || enPanel(e)) return;
    manejar(e);
    if (!PASAN.has(e.type)) e.stopImmediatePropagation();
    if (e.cancelable && (e.type === "wheel" || e.type === "contextmenu" || e.type === "touchstart" || e.type === "touchmove")) e.preventDefault();
  };
  for (const ev of EVENTOS) addEventListener(ev, alEvento, {
    capture: true,
    passive: false
  });
  function manejar(e) {
    if (M.enVR()) return;
    const ty = e.type;
    if (ty === "wheel") {
      zoom(Math.exp(e.deltaY * .0012));
      return;
    }
    if (ty.startsWith("pointer") && e.pointerType === "mouse") {
      if (ty === "pointerdown") arrastre = {
        x: e.clientX,
        y: e.clientY,
        mov: 0
      }; else if (ty === "pointermove") {
        if (document.pointerLockElement === renderer.domElement) mirar(e.movementX, e.movementY, .0022); else if (arrastre && e.buttons) {
          const dx = e.clientX - arrastre.x, dy = e.clientY - arrastre.y;
          mirar(dx, dy, .0042);
          arrastre.x = e.clientX;
          arrastre.y = e.clientY;
          arrastre.mov += Math.abs(dx) + Math.abs(dy);
        }
      } else if (ty === "pointerup") {
        if (arrastre && arrastre.mov < 4 && e.button === 0 && document.pointerLockElement !== renderer.domElement) {
          try {
            renderer.domElement.requestPointerLock?.()?.catch?.(() => {});
          } catch {}
        }
        arrastre = null;
      }
      return;
    }
    if (ty.startsWith("touch")) tocar(e);
  }
  function tocar(e) {
    if (e.type === "touchstart") {
      for (const x of e.changedTouches) toques.set(x.identifier, {
        x: x.clientX,
        y: x.clientY
      });
      return;
    }
    if (e.type === "touchend" || e.type === "touchcancel") {
      for (const x of e.changedTouches) toques.delete(x.identifier);
      return;
    }
    const lista = [ ...e.touches ].filter(x => toques.has(x.identifier));
    if (lista.length === 1) {
      const x = lista[0], a = toques.get(x.identifier);
      mirar(x.clientX - a.x, x.clientY - a.y, .0055);
    } else if (lista.length >= 2) {
      const [x1, x2] = lista, a1 = toques.get(x1.identifier), a2 = toques.get(x2.identifier);
      const dx = (x1.clientX + x2.clientX - a1.x - a2.x) / 2, dy = (x1.clientY + x2.clientY - a1.y - a2.y) / 2;
      const d0 = Math.hypot(a1.x - a2.x, a1.y - a2.y), d1 = Math.hypot(x1.clientX - x2.clientX, x1.clientY - x2.clientY);
      moverCamara(-dy * .012, dx * .012, 0);
      if (d0 > 20 && d1 > 20) zoom(d0 / d1);
    }
    for (const x of e.touches) if (toques.has(x.identifier)) toques.set(x.identifier, {
      x: x.clientX,
      y: x.clientY
    });
  }
  const previo = new Map;
  const borde = (k, v) => {
    const a = previo.get(k);
    previo.set(k, !!v);
    return !!v && !a;
  };
  function leerCasco(cebar = false, dt = 0) {
    const ses = renderer.xr.getSession?.();
    const r = {
      rapido: false,
      palitos: false,
      conMandos: false
    };
    if (!ses) return r;
    const dom = dominanteXR();
    let apretados = 0;
    for (const src of ses.inputSources) {
      const gp = src.gamepad;
      if (!gp) continue;
      r.conMandos = true;
      const id = "xr-" + src.handedness, esDom = src.handedness === dom, b = i => !!gp.buttons[i]?.pressed;
      if (b(1)) r.rapido = true;
      if (b(3)) apretados++;
      const gat = borde(id + ":0", b(0)), a = borde(id + ":4", b(4)), bb = borde(id + ":5", b(5));
      if (cebar) continue;
      if (gat) foto(esDom ? "4k" : "360-4k");
      if (a) alternar("personajes");
      if (bb) {
        salir();
        return r;
      }
    }
    if (borde("xr-palitos", apretados >= 2) && !cebar) {
      salir();
      return r;
    }
    if (!r.conMandos && !cebar) {
      const pe = (M.manos?.estados || []).filter(x => x.conectado && x.tipo === "mano" && x.pellizco).length;
      est.pellizcos = pe >= 2 ? (est.pellizcos || 0) + dt : 0;
      if (est.pellizcos > 1) {
        est.pellizcos = 0;
        salir();
      }
    }
    return r;
  }
  function leerJoystick(cebar = false) {
    const r = {
      subir: 0,
      zoom: 0
    };
    for (const gp of navigator.getGamepads?.() || []) {
      if (!gp || gp.mapping !== "standard") continue;
      const b = i => !!gp.buttons[i]?.pressed;
      const atras = borde("gp" + gp.index + ":8", b(8));
      if (cebar) continue;
      if (atras) {
        salir();
        return r;
      }
      r.subir += (b(5) ? 1 : 0) - (b(4) ? 1 : 0);
      r.zoom += (gp.buttons[6]?.value || 0) - (gp.buttons[7]?.value || 0);
    }
    return r;
  }
  M.tareas.add((dt, {acciones: acciones}) => {
    if (est.activo) return;
    const fase = juego.fase || "";
    if (/^mundo/.test(fase)) est.zona = "mundo"; else if (/^(302|prologo|vuelta al 302)/.test(fase)) est.zona = "302";
    let pedir = false;
    for (const gp of navigator.getGamepads?.() || []) if (gp && gp.mapping === "standard" && borde("gp" + gp.index + ":8", !!gp.buttons[8]?.pressed)) pedir = true;
    const ses = renderer.xr.getSession?.();
    if (ses) {
      let n = 0;
      for (const s of ses.inputSources) if (s.gamepad?.buttons[3]?.pressed) n++;
      if (borde("xr-palitos", n >= 2)) pedir = true;
    }
    if (pedir && entrar()) for (let i = acciones.length - 1; i >= 0; i--) if (acciones[i] === "menu") acciones.splice(i, 1);
  });
  const botonFoto = document.querySelector('#botonesTactil button[data-b="foto"]');
  if (botonFoto) {
    botonFoto.addEventListener("touchstart", e => {
      e.preventDefault();
      e.stopPropagation();
      entrar();
    }, {
      passive: false
    });
    botonFoto.addEventListener("click", e => {
      e.stopPropagation();
      entrar();
    });
  }
  renderer.xr.addEventListener("sessionstart", () => {
    if (est.activo) salir();
  });
  renderer.xr.addEventListener("sessionend", () => {
    if (est.activo) salir();
  });
  addEventListener("resize", () => {
    if (est.activo) ajustarPegados();
  });
  const _e = new THREE.Euler(0, 0, 0, "YXZ"), _h0 = new THREE.Vector3, _h1 = new THREE.Vector3, _fw = new THREE.Vector3, _rt = new THREE.Vector3;
  const _qy = new THREE.Quaternion, _Y = new THREE.Vector3(0, 1, 0);
  let tAnt = 0;
  function paso(_dt, {ejes: ejes, acciones: acciones}) {
    const ahora = ahoraReal(), dt = Math.min(.1, Math.max(0, (ahora - tAnt) / 1e3));
    tAnt = ahora;
    for (const c of suspendidos) if (c.state === "running") c.suspend().catch(() => {});
    if (M.enVR()) {
      pasoCasco(dt, ejes, acciones);
      return;
    }
    for (const a of acciones) {
      if (a === "aceptar") foto(est.res); else if (a === "accion") foto("360-" + est.res); else if (a === "cancelar" || a === "menu") {
        salir();
        return;
      }
    }
    const jg = leerJoystick();
    if (!est.activo) return;
    const k = c => tec[c] ? 1 : 0;
    const adelante = k("KeyW") + k("ArrowUp") - k("KeyS") - k("ArrowDown") - (ejes.y || 0);
    const derecha = k("KeyD") + k("ArrowRight") - k("KeyA") - k("ArrowLeft") + (ejes.x || 0);
    const arriba = k("KeyE") + k("Space") + k("PageUp") - k("KeyQ") - k("PageDown") + est.subir + jg.subir;
    const v = VEL * (tec.ShiftLeft || tec.ShiftRight ? RAPIDO : 1) * dt;
    if (adelante || derecha || arriba) moverCamara(THREE.MathUtils.clamp(adelante, -1, 1) * v, THREE.MathUtils.clamp(derecha, -1, 1) * v, THREE.MathUtils.clamp(arriba, -1, 1) * v);
    if (ejes.gx || ejes.gy) mirar(ejes.gx * 420 * dt, ejes.gy * 300 * dt, .0055);
    est.roll += (k("KeyX") - k("KeyZ")) * 1.1 * dt;
    const zz = k("Minus") + k("NumpadSubtract") - k("Equal") - k("NumpadAdd") - k("BracketRight") + jg.zoom;
    if (zz) zoom(Math.exp(zz * 1.2 * dt));
    camF.position.copy(est.pos);
    _e.set(est.pitch, est.yaw, est.roll, "YXZ");
    camF.quaternion.setFromEuler(_e);
    const asp = innerWidth / innerHeight;
    if (camF.fov !== est.fov || camF.aspect !== asp) {
      camF.fov = est.fov;
      camF.aspect = asp;
      camF.updateProjectionMatrix();
      ajustarPegados();
    }
    if (juego.demoActual) {
      const c = cuadroDe(juego.demoActual);
      if (c !== est.cuadroPintado) {
        est.cuadroPintado = c;
        pintarPanel();
      }
    }
  }
  function pasoCasco(dt, ejes, acciones) {
    try {
      M.casco?.actualizar?.(dt, {
        moviendo: false,
        objetivos: []
      });
    } catch {}
    const r = leerCasco(false, dt);
    if (!est.activo) return;
    if (!r.conMandos) for (const a of acciones) if (a === "accion") foto("4k");
    const v = VEL * (r.rapido ? RAPIDO : 1) * dt;
    camF.getWorldPosition(_h0);
    camF.getWorldDirection(_fw);
    _fw.y = 0;
    if (_fw.lengthSq() < 1e-6) _fw.set(0, 0, -1);
    _fw.normalize();
    _rt.crossVectors(_fw, _Y).normalize();
    const mx = ejes.x || 0, my = ejes.y || 0, gx = ejes.gx || 0, gy = ejes.gy || 0;
    rigF.position.addScaledVector(_fw, -my * v).addScaledVector(_rt, mx * v);
    rigF.position.y -= gy * v;
    if (gx) {
      _qy.setFromAxisAngle(_Y, -gx * 1.6 * dt);
      rigF.quaternion.premultiply(_qy);
      rigF.updateMatrixWorld(true);
      camF.getWorldPosition(_h1);
      rigF.position.sub(_h1).add(_h0).addScaledVector(_fw, -my * v).addScaledVector(_rt, mx * v);
      rigF.position.y -= gy * v;
    }
    rigF.updateMatrixWorld(true);
    camF.getWorldPosition(_h1);
    _l.copy(_h1);
    limitar(_l);
    rigF.position.add(_l.sub(_h1));
  }
  const cuadroDe = D => D && D.seg != null ? Math.max(0, Math.floor(D.seg * FPS)) : null;
  const puedeEntrar = () => !est.activo && !est.saliendo && !!juego.enPartida && !juego.video;
  function entrar() {
    if (!puedeEntrar()) return false;
    est.activo = true;
    est.entradas++;
    M.congelar(paso, camF);
    pararReloj();
    pausarAudio();
    est.mirabaLibre = M.control.mirarLibre;
    M.control.mirarLibre = false;
    camara.updateMatrixWorld(true);
    est.fovJuego = camara.fov;
    est.aspectJuego = camara.aspect || innerWidth / innerHeight;
    if (M.enVR()) {
      M.jugador.updateMatrixWorld(true);
      M.jugador.getWorldPosition(rigF.position);
      M.jugador.getWorldQuaternion(rigF.quaternion);
      camara.getWorldPosition(est.pos0);
    } else {
      rigF.position.set(0, 0, 0);
      rigF.quaternion.identity();
      camara.getWorldPosition(est.pos);
      est.pos0.copy(est.pos);
      _e.setFromQuaternion(camara.getWorldQuaternion(new THREE.Quaternion), "YXZ");
      est.pitch = _e.x;
      est.yaw = _e.y;
      est.roll = _e.z;
      est.fov = est.fov0 = camara.fov;
      camF.near = Math.min(.02, camara.near);
      camF.fov = est.fov;
      camF.aspect = innerWidth / innerHeight;
      camF.position.copy(est.pos);
      camF.quaternion.setFromEuler(_e.set(est.pitch, est.yaw, est.roll, "YXZ"));
      camF.updateProjectionMatrix();
    }
    escena.add(rigF);
    rigF.updateMatrixWorld(true);
    est.caja = cajaSala();
    esconderInterfaz();
    juntarListas();
    juntarPegados();
    est.niebla0 = factorNiebla();
    op.niebla = true;
    hay.niebla = true;
    const mj = mejorado();
    hay.filtro = !!mj?.activar;
    mejAntes = mj ? !!mj.activo : null;
    op.filtro = !!mejAntes;
    aplicarOpciones();
    for (const k of Object.keys(tec)) tec[k] = false;
    est.subir = 0;
    arrastre = null;
    toques.clear();
    leerCasco(true);
    leerJoystick(true);
    tAnt = ahoraReal();
    document.documentElement.classList.add("sh4foto");
    est.panel = true;
    pintarPanel();
    aviso(M.enVR() ? "" : t(M.tactil ? "foto.entrar.tactil" : "foto.entrar"), 5);
    return true;
  }
  async function salir() {
    if (!est.activo || est.saliendo) return;
    est.saliendo = true;
    try {
      const mj = mejorado();
      if (mj?.activar && mejAntes != null && mj.activo !== mejAntes) mj.activar(mejAntes);
      factorNiebla(est.niebla0);
      devolverPegados();
      devolverListas();
      mostrarInterfaz();
      hud.visible = false;
      rigF.removeFromParent();
      document.documentElement.classList.remove("sh4foto");
      clearTimeout(tAviso);
      textoAviso = "";
      M.control.mirarLibre = est.mirabaLibre;
      if (!est.mirabaLibre) M.control.soltar();
      M.congelar(() => {}, null);
      await reanudarAudio();
    } finally {
      soltarReloj();
      M.descongelar();
      est.activo = false;
      est.saliendo = false;
    }
  }
  let nombres = null;
  const nombresListos = () => nombres ??= fetch("../nombres.json").then(r => r.ok ? r.json() : {}).catch(() => ({}));
  function salaActual() {
    if (est.zona === "mundo" && juego.mundo?.sala) return juego.mundo.sala;
    return juego.cuarto?.sala?.nombre || juego.ambiente?.info?.sala || "";
  }
  async function metadatos(tipo) {
    const N = await nombresListos();
    camF.updateMatrixWorld(true);
    const qw = camF.getWorldQuaternion(new THREE.Quaternion), e = (new THREE.Euler).setFromQuaternion(qw, "YXZ");
    const sala = salaActual(), mu = sala.slice(0, 2);
    const nMundo = N?.mundos?.[mu]?.nombre || mu, nSala = N?.salas?.[sala.slice(0, 4)]?.nombre || "";
    const completo = [ nMundo, nSala ].filter(Boolean).join(" · ") || sala || "SH4";
    const D = juego.demoActual, cine = D ? D.nom || "d_" + pad3(D.id) : null, cuadro = cuadroDe(D);
    const vista = cine ? t("foto.cine", cine, cuadro) : "modo foto · " + (juego.fase || "juego");
    return {
      sala: sala,
      mundo: nMundo,
      cinematica: cine,
      cuadro: cuadro,
      giro: grados(e.z),
      titulo: "Silent Hill 4 · " + completo + (cine ? " · " + cine : ""),
      descripcion: `${completo} [${sala}]` + (cine ? `, cinemática ${cine} en el cuadro ${cuadro}` : "") + ", " + (juego.lugar || "modo foto del modo juego") + ", leído de los archivos originales del juego.",
      posicion: camF.getWorldPosition(new THREE.Vector3).toArray(),
      rumbo: grados(e.y),
      inclinacion: grados(e.x),
      fov: camF.fov,
      vista: vista,
      tipo: tipo
    };
  }
  async function foto(tipo) {
    if (!est.activo || est.sacando) return null;
    est.sacando = true;
    aviso(t("foto.sacando", tipo.toUpperCase()), 30);
    const es360 = tipo.startsWith("360");
    const visCam = camF.visible;
    try {
      const meta = await metadatos(tipo);
      hud.visible = false;
      if (es360) camF.visible = false; else ajustarPegados(16 / 9);
      const {blob: blob, ancho: ancho, alto: alto} = await sacarFoto(THREE, renderer, escena, camF, tipo, meta);
      const f = new Date, dos = n => String(n).padStart(2, "0");
      const sello = `${f.getFullYear()}${dos(f.getMonth() + 1)}${dos(f.getDate())}_${dos(f.getHours())}${dos(f.getMinutes())}${dos(f.getSeconds())}`;
      const nombre = `SH4_${meta.sala || "sala"}${meta.cinematica ? "_" + meta.cinematica + "_c" + meta.cuadro : ""}_${tipo}_${sello}.jpg`;
      if (!q.has("fotoSinBajar")) descargar(blob, nombre);
      const r = {
        nombre: nombre,
        ancho: ancho,
        alto: alto,
        mb: +(blob.size / 1e6).toFixed(2),
        tipo: tipo,
        meta: meta
      };
      est.fotos.push(r);
      est.ultimoBlob = blob;
      aviso(t("foto.lista", tipo.toUpperCase(), ancho, alto, r.mb.toFixed(1)), 6);
      return r;
    } catch (err) {
      console.warn("modo foto", err);
      aviso(t("foto.error", err?.message || err), 6);
      return null;
    } finally {
      camF.visible = visCam;
      ajustarPegados();
      hud.visible = M.enVR() && est.activo;
      est.sacando = false;
    }
  }
  const api = {
    entrar: entrar,
    salir: salir,
    foto: foto,
    alternar: alternar,
    get activo() {
      return est.activo;
    },
    get estado() {
      return {
        ...est,
        op: {
          ...op
        },
        hay: {
          ...hay
        },
        pos: est.pos.toArray(),
        caja: est.caja ? [ est.caja.min.toArray(), est.caja.max.toArray() ] : null
      };
    },
    camara: camF,
    rig: rigF,
    mover: (a, d, ar) => moverCamara(a, d, ar),
    mirar: (dx, dy) => mirar(dx, dy, .0042),
    zoom: zoom,
    girar: r => {
      est.roll += r;
    },
    reloj: () => ({
      real: ahoraReal(),
      pagina: performance.now(),
      desfase: desfase
    })
  };
  return api;
}
