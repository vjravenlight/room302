// SH4 web — FeniXVOID · Project Ravenlight
import { casco, manoDominante } from "./jugador/casco_comun.js";

import { leerOpciones, guardarOpciones, cargarTextosJuego } from "./opciones_sitio.js";

import { idiomaActual } from "./textos_sitio.js";

const W = 1600, H = 900, ANCHO_M = 1.5;

const FILA = 40, Y0 = 118, COL = [ 56, 836 ], ANCHO_COL = 708;

const INGLES = {
  "ANIMACIÓN": "ANIMATION",
  OPCIONES: "OPTIONS",
  Momento: "Moment",
  Mitad: "Half",
  "Objetos animados": "Animated objects",
  Velas: "Candles",
  "Agua y humo": "Water and smoke",
  Niebla: "Fog",
  "Ruido de pantalla": "Screen noise",
  Sonido: "Sound",
  Personajes: "Characters",
  "Hauntings (302)": "Hauntings (302)",
  Enemigos: "Enemies",
  "Lo que arma cada mundo": "World scripts",
  Eileen: "Eileen",
  "Subtítulos": "Subtitles",
  Congelar: "Freeze",
  Sala: "Room",
  Imagen: "Image",
  "Calidad del Mejorado": "Enhanced quality",
  "Linterna (Mejorado)": "Flashlight (Enhanced)",
  "Brillo de los personajes": "Character brightness",
  "Subtítulos (Opciones)": "Subtitles (Options)",
  "Elegir sala (fotos)": "Choose room (photos)",
  Ver: "Open",
  Cerrar: "Close",
  "Sí": "Yes",
  No: "No",
  Original: "Original",
  Mejorado: "Enhanced",
  Libre: "Free",
  "1.ª mitad": "1st half",
  "2.ª mitad": "2nd half",
  "Calidad PC alta": "PC high quality",
  "Calidad PC media": "PC medium quality",
  "Palito: elegir y cambiar · Gatillo o A: cambiar · Apretar el palito: cerrar": "Stick: choose and change · Trigger or A: change · Press the stick: close"
};

const tr = t => idiomaActual() === "s" ? t : INGLES[t] ?? t;

const normalizar = t => String(t ?? "").replace(/…/g, "...").replace(/[—–]/g, "-").replace(/[“”]/g, '"').replace(/[‘’]/g, "'");

export function crearPanelVR({THREE: THREE, renderer: renderer, camara: camara, jugador: jugador, viva: viva, info: info, salas: salas = () => [], cargarSala: cargarSala = null, nombreSala: nombreSala = s => s, elegirSala: elegirSala = null}) {
  let fuente = null;
  cargarTextosJuego().then(t => {
    fuente = t.fuente;
    if (abierto) pintar();
  }).catch(() => {});
  const mej = () => window.sh4?.mejorado || null;
  const op = () => leerOpciones();
  const ponerOp = (k, v) => {
    const o = op();
    o[k] = v;
    guardarOpciones(o);
  };
  const ciclo = (v, d, a, b) => Math.max(a, Math.min(b, v + d));
  function filasOpciones() {
    const m = mej();
    const lista = [ {
      id: "sala",
      nombre: "Sala",
      valor: () => nombreSala(info.sala || ""),
      cambiar: d => {
        const l = salas(), i = l.indexOf(info.sala);
        if (!l.length || !cargarSala) return;
        cargarSala(l[(i + d + l.length) % l.length]);
      }
    } ];
    if (elegirSala) lista.push({
      id: "elegirSala",
      nombre: "Elegir sala (fotos)",
      valor: () => "Ver",
      cambiar: () => {
        cerrar();
        elegirSala();
      }
    });
    if (m) {
      lista.push({
        id: "modo",
        nombre: "Imagen",
        valor: () => m.activo ? "Mejorado" : "Original",
        cambiar: () => m.activar(!m.activo)
      });
      lista.push({
        id: "preset",
        nombre: "Calidad del Mejorado",
        valor: () => m.presets?.[m.estado?.preset]?.nombre || m.estado?.preset || "",
        cambiar: d => {
          const k = Object.keys(m.presets || {});
          const i = k.indexOf(m.estado?.preset);
          if (k.length) m.preset(k[(i + d + k.length) % k.length]);
        }
      });
      lista.push({
        id: "linterna",
        nombre: "Linterna (Mejorado)",
        valor: () => m.estado?.linterna ? "Sí" : "No",
        cambiar: () => m.linterna()
      });
    }
    lista.push({
      id: "niebla",
      nombre: "Niebla",
      valor: () => String(op().niebla ?? 5),
      cambiar: d => ponerOp("niebla", ciclo(+op().niebla || 0, d, 0, 10)),
      barra: () => (+op().niebla || 0) / 10
    });
    lista.push({
      id: "brilloPersonajes",
      nombre: "Brillo de los personajes",
      valor: () => String(op().brilloPersonajes ?? 5),
      cambiar: d => ponerOp("brilloPersonajes", ciclo(+op().brilloPersonajes || 0, d, 0, 10)),
      barra: () => (+op().brilloPersonajes || 0) / 10
    });
    lista.push({
      id: "subtitulosSitio",
      nombre: "Subtítulos (Opciones)",
      valor: () => op().subtitulos !== false ? "Sí" : "No",
      cambiar: () => ponerOp("subtitulos", op().subtitulos === false)
    });
    lista.push({
      id: "cerrar",
      nombre: "Cerrar",
      valor: () => "",
      cambiar: () => cerrar(),
      cerrar: true
    });
    return lista;
  }
  let izq = [], der = [], todas = [];
  function armarFilas() {
    izq = viva?.filasVR?.() || [];
    der = filasOpciones();
    todas = [ ...izq.map((f, i) => ({
      ...f,
      col: 0,
      i: i
    })), ...der.map((f, i) => ({
      ...f,
      col: 1,
      i: i
    })) ];
    elegida = Math.max(0, Math.min(todas.length - 1, elegida));
  }
  const lienzo = document.createElement("canvas");
  lienzo.width = W;
  lienzo.height = H;
  const tex = new THREE.CanvasTexture(lienzo);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const plano = new THREE.Mesh(new THREE.PlaneGeometry(ANCHO_M, ANCHO_M * H / W), new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    fog: false,
    toneMapped: false,
    side: THREE.DoubleSide
  }));
  plano.name = "panel del visor (casco)";
  plano.renderOrder = 980;
  plano.visible = false;
  plano.frustumCulled = false;
  plano.userData.sinSombra = true;
  let abierto = false, elegida = 0, apuntada = null;
  function texto(g, t, x, y, {escala: escala = 2, color: color = "#ece3d2", alinear: alinear = "izq"} = {}) {
    t = normalizar(tr(t));
    if (fuente) fuente.escribir(g, t, x / escala, y / escala, {
      escala: escala,
      color: color,
      alinear: alinear,
      sombra: true
    }); else {
      g.font = `${14 * escala}px Georgia, serif`;
      g.fillStyle = color;
      g.textAlign = alinear === "centro" ? "center" : alinear === "der" ? "right" : "left";
      g.textBaseline = "top";
      g.fillText(t, x, y);
    }
  }
  function rectFila(f) {
    return {
      x: COL[f.col] - 14,
      y: Y0 + f.i * FILA - 4,
      w: ANCHO_COL + 28,
      h: FILA
    };
  }
  function pintar() {
    const g = lienzo.getContext("2d");
    g.clearRect(0, 0, W, H);
    g.fillStyle = "rgba(8,5,4,0.86)";
    g.fillRect(0, 0, W, H);
    g.strokeStyle = "rgba(122,59,30,0.85)";
    g.lineWidth = 4;
    g.strokeRect(6, 6, W - 12, H - 12);
    texto(g, "ANIMACIÓN", COL[0], 34, {
      escala: 2.6,
      color: "#b8402e"
    });
    texto(g, "OPCIONES", COL[1], 34, {
      escala: 2.6,
      color: "#b8402e"
    });
    g.fillStyle = "rgba(122,59,30,0.5)";
    g.fillRect(COL[1] - 40, 40, 2, H - 120);
    for (const [k, f] of todas.entries()) {
      const r = rectFila(f), el = k === elegida, ap = apuntada === k;
      if (el || ap) {
        const gr = g.createLinearGradient(r.x, 0, r.x + r.w, 0);
        gr.addColorStop(0, "rgba(150,28,18,0)");
        gr.addColorStop(.12, `rgba(150,28,18,${el ? .75 : .4})`);
        gr.addColorStop(.88, `rgba(150,28,18,${el ? .75 : .4})`);
        gr.addColorStop(1, "rgba(150,28,18,0)");
        g.fillStyle = gr;
        g.fillRect(r.x, r.y, r.w, r.h);
      }
      const color = el ? "#ffffff" : "#c9c2b6";
      texto(g, f.nombre, COL[f.col], r.y + 8, {
        escala: 1.6,
        color: f.cerrar ? "#e0a090" : color
      });
      let v = "";
      try {
        v = String(f.valor() ?? "");
      } catch {}
      if (f.cerrar) continue;
      const xv = COL[f.col] + ANCHO_COL - 6;
      if (f.barra) {
        const b = Math.max(0, Math.min(1, f.barra())), bx = xv - 230, by = r.y + 14;
        g.fillStyle = "rgba(201,194,182,0.18)";
        g.fillRect(bx, by, 180, 10);
        g.fillStyle = el ? "#d0402c" : "#8f3a2a";
        g.fillRect(bx, by, 180 * b, 10);
        texto(g, v, xv, r.y + 8, {
          escala: 1.6,
          color: color,
          alinear: "der"
        });
      } else {
        v = tr(v);
        const corto = v.length > 34 ? v.slice(0, 33) + "..." : v;
        texto(g, (el ? "< " : "") + corto + (el ? " >" : ""), xv, r.y + 8, {
          escala: 1.6,
          color: [ "Sí", "Yes", "Mejorado", "Enhanced" ].includes(v) ? "#e8c8a0" : color,
          alinear: "der"
        });
      }
    }
    const ay = "Palito: elegir y cambiar · Gatillo o A: cambiar · Apretar el palito: cerrar";
    texto(g, ay, W / 2, H - 52, {
      escala: 1.4,
      color: "#8f857a",
      alinear: "centro"
    });
    tex.needsUpdate = true;
  }
  const _p = new THREE.Vector3, _d = new THREE.Vector3;
  function ubicar() {
    const cam = renderer.xr.isPresenting ? renderer.xr.getCamera() : camara;
    cam.getWorldPosition(_p);
    cam.getWorldDirection(_d);
    _d.y = 0;
    if (_d.lengthSq() < 1e-6) _d.set(0, 0, -1);
    _d.normalize();
    if (plano.parent !== jugador) jugador.add(plano);
    jugador.updateMatrixWorld(true);
    const pos = _p.clone().addScaledVector(_d, 1.3);
    pos.y -= .12;
    plano.position.copy(jugador.worldToLocal(pos.clone()));
    const mirar = _p.clone();
    mirar.y = pos.y;
    plano.lookAt(mirar);
  }
  function abrir() {
    armarFilas();
    ubicar();
    plano.visible = true;
    abierto = true;
    casco.apuntables.add(plano);
    pintar();
    casco.manos?.vibrar?.(manoDominante(), .3, 20);
  }
  function cerrar() {
    plano.visible = false;
    abierto = false;
    casco.apuntables.delete(plano);
    apuntada = null;
  }
  renderer.xr.addEventListener("sessionend", () => cerrar());
  function filaEn(uv) {
    const x = uv.x * W, y = (1 - uv.y) * H;
    const k = todas.findIndex(f => {
      const r = rectFila(f);
      return x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
    });
    if (k < 0) return null;
    const f = todas[k], xv = COL[f.col] + ANCHO_COL;
    return {
      k: k,
      d: x < xv - 260 ? 1 : x < xv - 130 ? -1 : 1
    };
  }
  async function cambiarFila(k, d = 1) {
    const f = todas[k];
    if (!f) return;
    casco.manos?.vibrar?.(manoDominante(), .25, 15);
    try {
      await f.cambiar(d);
    } catch (e) {
      console.warn("[panel VR]", f.id, e);
    }
    if (abierto) {
      armarFilas();
      pintar();
    }
  }
  casco.manos?.alElegir?.(({hit: hit}) => {
    if (!abierto || hit?.object !== plano || !hit.uv) return;
    const r = filaEn(hit.uv);
    if (r) {
      elegida = r.k;
      cambiarFila(r.k, r.d);
    }
  });
  const SIGNO_PALMA = -1, MIRA_MIN = .65, SOSTENER = .9, QUIETA = .03, SEG = 32;
  const geoAnillo = new THREE.RingGeometry(.032, .04, SEG, 1, Math.PI / 2, Math.PI * 2);
  const anillo = new THREE.Mesh(geoAnillo, new THREE.MeshBasicMaterial({
    color: 16720916,
    transparent: true,
    opacity: .9,
    depthTest: false,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
    fog: false
  }));
  anillo.name = "gesto del panel (casco)";
  anillo.renderOrder = 998;
  anillo.frustumCulled = false;
  anillo.visible = false;
  const gesto = {
    t: 0,
    bloqueado: false,
    enCurso: false,
    mira: 0,
    veces: 0
  };
  const _gn = new THREE.Vector3, _gc = new THREE.Vector3, _gw = new THREE.Vector3, _gq = new THREE.Quaternion;
  const _ga = new THREE.Vector3, _gb = new THREE.Vector3, _gp = new THREE.Vector3, _gi = new THREE.Vector3;
  function cortarGesto() {
    gesto.t = 0;
    gesto.enCurso = false;
    anillo.visible = false;
  }
  function gestoManos(dt) {
    const dom = manoDominante();
    const e = casco.manos?.estados?.find(x => x.conectado && x.tipo === "mano" && x.lado === dom);
    const J = e?.mano?.joints, w = J?.wrist, ta = J?.["thumb-tip"], ib = J?.["index-finger-tip"];
    if (!e || !w || !w.visible || !ta || !ib || !e.pellizco) {
      gesto.bloqueado = false;
      return cortarGesto();
    }
    w.updateMatrixWorld(true);
    _gn.set(0, SIGNO_PALMA, 0).applyQuaternion(w.getWorldQuaternion(_gq));
    const cab = renderer.xr.isPresenting ? renderer.xr.getCamera() : camara;
    cab.getWorldPosition(_gc).sub(w.getWorldPosition(_gw)).normalize();
    gesto.mira = +_gn.dot(_gc).toFixed(2);
    if (gesto.bloqueado || gesto.mira < MIRA_MIN) return cortarGesto();
    gesto.enCurso = true;
    _gp.copy(ta.getWorldPosition(_ga)).add(ib.getWorldPosition(_gb)).multiplyScalar(.5);
    if (gesto.t === 0) _gi.copy(_gp); else if (_gp.distanceTo(_gi) > QUIETA) {
      gesto.bloqueado = true;
      return cortarGesto();
    }
    gesto.t += dt;
    const k = Math.min(1, gesto.t / SOSTENER);
    geoAnillo.setDrawRange(0, 6 * Math.max(1, Math.round(k * SEG)));
    const raiz = jugador.parent || jugador;
    if (anillo.parent !== raiz) raiz.add(anillo);
    anillo.position.copy(_gp);
    raiz.worldToLocal(anillo.position);
    anillo.lookAt(cab.getWorldPosition(_gc));
    anillo.visible = true;
    if (gesto.t >= SOSTENER) {
      gesto.bloqueado = true;
      gesto.veces++;
      cortarGesto();
      abierto ? cerrar() : abrir();
    }
  }
  let antesPalito = false, rep = {
    a: null,
    t: 0
  }, antesA = false, tPintar = 0;
  function botones() {
    const s = renderer.xr.getSession?.();
    if (!s) return null;
    const dom = manoDominante() === "izq" ? "left" : "right";
    const r = {
      palito: false,
      x: 0,
      y: 0,
      a: false
    };
    for (const src of s.inputSources) {
      const g = src.gamepad;
      if (!g) continue;
      if (src.handedness === dom) {
        r.palito = !!g.buttons[3]?.pressed;
        const ax = g.axes.length >= 4 ? [ g.axes[2], g.axes[3] ] : [ g.axes[0] || 0, g.axes[1] || 0 ];
        r.x = ax[0] || 0;
        r.y = ax[1] || 0;
      }
      if (src.handedness === "right" && g.buttons[4]?.pressed) r.a = true;
      if (src.handedness === "left" && abierto && g.buttons[4]?.pressed) r.a = true;
    }
    return r;
  }
  function accion(a) {
    if (a === "arriba") elegida = (elegida + todas.length - 1) % todas.length; else if (a === "abajo") elegida = (elegida + 1) % todas.length; else if (a === "izq") return cambiarFila(elegida, -1); else if (a === "der" || a === "aceptar") return cambiarFila(elegida, 1);
    casco.manos?.vibrar?.(manoDominante(), .15, 10);
    pintar();
  }
  function actualizar(dt) {
    const b = renderer.xr.isPresenting ? botones() : null;
    if (renderer.xr.isPresenting) gestoManos(dt); else if (gesto.enCurso) cortarGesto();
    if (b) {
      if (b.palito && !antesPalito) abierto ? cerrar() : abrir();
      antesPalito = b.palito;
    }
    if (!abierto) return false;
    if (b) {
      let dir = null;
      if (b.y < -.6) dir = "arriba"; else if (b.y > .6) dir = "abajo"; else if (b.x < -.6) dir = "izq"; else if (b.x > .6) dir = "der";
      if (dir !== rep.a) {
        rep = {
          a: dir,
          t: .4
        };
        if (dir) accion(dir);
      } else if (dir && (rep.t -= dt) <= 0) {
        rep.t = .18;
        accion(dir);
      }
      if (b.a && !antesA) accion("aceptar");
      antesA = b.a;
    }
    const e = casco.manos?.estados?.find(x => x.hit?.object === plano);
    const r = e?.hit?.uv ? filaEn(e.hit.uv) : null;
    const k = r ? r.k : null;
    if (k !== apuntada) {
      apuntada = k;
      if (k != null) {
        elegida = k;
        casco.manos?.vibrar?.(manoDominante(), .12, 8);
      }
      pintar();
    }
    if ((tPintar += dt) > 1) {
      tPintar = 0;
      armarFilas();
      pintar();
    }
    return true;
  }
  function vistaPrevia(fila = 3) {
    abrir();
    jugador.updateMatrixWorld(true);
    const f = todas[Math.min(fila, todas.length - 1)], r = rectFila(f);
    const uv = new THREE.Vector2((r.x + r.w - 120) / W, 1 - (r.y + r.h / 2) / H);
    const alto = ANCHO_M * H / W;
    const objetivo = new THREE.Vector3((uv.x - .5) * ANCHO_M, (uv.y - .5) * alto, 0).applyMatrix4(plano.matrixWorld);
    const cam = camara.getWorldPosition(new THREE.Vector3), q = camara.getWorldQuaternion(new THREE.Quaternion);
    const origen = cam.clone().add(new THREE.Vector3(.22, -.32, -.38).applyQuaternion(q));
    const pad = jugador;
    const e = casco.manos?.simular?.({
      i: 0,
      lado: manoDominante(),
      origen: origen,
      mirarA: objetivo,
      gatillo: .4,
      agarre: .9
    });
    if (e) for (const o of [ e.ctrl, e.grip ]) {
      const w = o.position.clone();
      o.parent?.worldToLocal(w);
      o.position.copy(w);
      o.lookAt(objetivo);
      o.rotateY(Math.PI);
    }
    if (e) e.grip.rotateX(.95);
    void pad;
    casco.manos?.actualizar?.(1 / 60, [ plano ]);
    elegida = todas.indexOf(f);
    const ex = casco.manos?.estados?.find(x => x.hit?.object === plano);
    pintar();
    return {
      fila: f.id,
      apunta: !!ex,
      uv: ex?.hit?.uv ? [ +ex.hit.uv.x.toFixed(3), +ex.hit.uv.y.toFixed(3) ] : null
    };
  }
  return {
    abrir: abrir,
    cerrar: cerrar,
    actualizar: actualizar,
    vistaPrevia: vistaPrevia,
    accion: accion,
    plano: plano,
    get abierto() {
      return abierto;
    },
    gesto: gesto,
    gestoManos: gestoManos,
    get gestoEnCurso() {
      return gesto.enCurso;
    },
    filas: () => todas.map(f => ({
      id: f.id,
      nombre: f.nombre,
      valor: (() => {
        try {
          return f.valor();
        } catch {
          return null;
        }
      })()
    }))
  };
}
