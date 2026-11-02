// SH4 web — FeniXVOID · Project Ravenlight
import * as THREE from "three";

import { usoTactil } from "../opciones_sitio.js";

import { VRButton } from "three/addons/webxr/VRButton.js";

import { soloConCasco, soloEnMenu } from "../vr_boton.js";

import { prepararBrillo } from "../lib/brillo.js";

import { prepararCasco, casco, opciones, alCambiarOpciones, mouse, aplicarCalidad, pixelesPorPunto, escalaBotones, joystickALaDerecha, vibrarCelular, dominanteXR, girarConPalito } from "../jugador/casco_comun.js";

export const q = new URLSearchParams(location.search);

export function crearMotor() {
  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    stencil: true
  });
  renderer.setPixelRatio(pixelesPorPunto());
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.xr.enabled = true;
  renderer.xr.setReferenceSpaceType("local-floor");
  document.body.appendChild(renderer.domElement);
  prepararBrillo(renderer.domElement);
  VRButton.registerSessionGrantedListener();
  const botonVR = soloConCasco(VRButton.createButton(renderer));
  botonVR.id = "VRButton";
  soloEnMenu(botonVR, false);
  document.body.appendChild(botonVR);
  const escena = new THREE.Scene;
  escena.background = new THREE.Color(0);
  const camara = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, .02, 400);
  camara.rotation.order = "YXZ";
  const jugador = new THREE.Group;
  jugador.name = "jugador";
  jugador.add(camara);
  escena.add(jugador);
  addEventListener("resize", () => {
    camara.aspect = innerWidth / innerHeight;
    camara.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    redibujar();
  });
  const lienzo = document.createElement("canvas");
  lienzo.width = 1280;
  lienzo.height = 896;
  const g2 = lienzo.getContext("2d");
  const texLienzo = new THREE.CanvasTexture(lienzo);
  texLienzo.colorSpace = THREE.SRGBColorSpace;
  texLienzo.minFilter = THREE.LinearFilter;
  texLienzo.generateMipmaps = false;
  const matLienzo = new THREE.MeshBasicMaterial({
    map: texLienzo,
    toneMapped: false,
    depthTest: false,
    depthWrite: false
  });
  const plano = new THREE.Mesh(new THREE.PlaneGeometry(4 / 3, 1), matLienzo);
  plano.renderOrder = 50;
  plano.visible = false;
  plano.frustumCulled = false;
  plano.name = "pantalla";
  const planoTexto = new THREE.Mesh(new THREE.PlaneGeometry(4 / 3, 1), new THREE.MeshBasicMaterial({
    map: texLienzo,
    transparent: true,
    toneMapped: false,
    depthTest: false,
    depthWrite: false
  }));
  planoTexto.renderOrder = 51;
  planoTexto.visible = false;
  plano.add(planoTexto);
  planoTexto.position.z = .001;
  const fondoVR = new THREE.Mesh(new THREE.SphereGeometry(30, 16, 12), new THREE.MeshBasicMaterial({
    color: 328451,
    side: THREE.BackSide,
    depthWrite: false
  }));
  fondoVR.visible = false;
  fondoVR.renderOrder = 40;
  escena.add(fondoVR);
  const pantalla = {
    lienzo: lienzo,
    g: g2,
    plano: plano,
    fondo: fondoVR,
    mostrar(material = null) {
      plano.material = material || matLienzo;
      if (!plano.material.transparent) {
        plano.material.transparent = true;
        plano.material.needsUpdate = true;
      }
      planoTexto.visible = !!material;
      plano.visible = true;
      anclar();
    },
    ocultar() {
      plano.visible = false;
      fondoVR.visible = false;
    },
    actualizar() {
      texLienzo.needsUpdate = true;
      redibujar();
    },
    get visible() {
      return plano.visible;
    }
  };
  function anclar() {
    plano.removeFromParent();
    if (renderer.xr.isPresenting) {
      const cab = new THREE.Vector3, dir = new THREE.Vector3;
      camara.getWorldPosition(cab);
      camara.getWorldDirection(dir);
      dir.y = 0;
      dir.normalize();
      escena.add(plano);
      plano.scale.setScalar(2.4);
      plano.position.copy(cab).addScaledVector(dir, 3);
      plano.lookAt(cab.x, plano.position.y, cab.z);
      fondoVR.visible = true;
      fondoVR.position.copy(cab);
    } else {
      camara.add(plano);
      const d = 1, alto = 2 * d * Math.tan(THREE.MathUtils.degToRad(camara.fov) / 2);
      const s = Math.min(alto, alto * camara.aspect / (4 / 3));
      plano.scale.setScalar(s);
      plano.position.set(0, 0, -d);
      plano.rotation.set(0, 0, 0);
      fondoVR.visible = false;
    }
  }
  renderer.xr.addEventListener("sessionstart", () => setTimeout(() => {
    if (plano.visible) anclar();
    capas.forEach(c => c.anclar());
  }, 50));
  renderer.xr.addEventListener("sessionend", () => setTimeout(() => {
    if (plano.visible) anclar();
    capas.forEach(c => c.anclar());
  }, 50));
  addEventListener("resize", () => {
    if (plano.visible) anclar();
    capas.forEach(c => c.anclar());
  });
  const capas = [];
  function crearCapa(lugar = "abajo") {
    const lz = document.createElement("canvas");
    lz.width = 1280;
    lz.height = 256;
    const tx = new THREE.CanvasTexture(lz);
    tx.colorSpace = THREE.SRGBColorSpace;
    tx.minFilter = THREE.LinearFilter;
    tx.generateMipmaps = false;
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(5, 1), new THREE.MeshBasicMaterial({
      map: tx,
      transparent: true,
      toneMapped: false,
      depthTest: false,
      depthWrite: false
    }));
    pl.renderOrder = 60;
    pl.visible = false;
    pl.frustumCulled = false;
    camara.add(pl);
    const capa = {
      lienzo: lz,
      g: lz.getContext("2d"),
      plano: pl,
      mostrar() {
        pl.visible = true;
        tx.needsUpdate = true;
        redibujar();
      },
      ocultar() {
        if (pl.visible) {
          pl.visible = false;
          redibujar();
        }
      },
      get visible() {
        return pl.visible;
      },
      anclar() {
        const vr = renderer.xr.isPresenting, d = vr ? 1.4 : 1;
        const altoVista = 2 * d * Math.tan(THREE.MathUtils.degToRad(camara.fov) / 2);
        const dy = {
          abajo: -1,
          centro: 0,
          arriba: 1
        }[lugar];
        if (vr) {
          pl.scale.setScalar(.24);
          pl.position.set(0, dy * .32, -d);
        } else {
          const anchoJuego = Math.min(altoVista * camara.aspect, altoVista * 4 / 3);
          const altoJuego = Math.min(altoVista, anchoJuego * 3 / 4);
          const s = anchoJuego / 5;
          pl.scale.setScalar(s);
          pl.position.set(0, dy * (altoJuego / 2 - s * .62), -d);
        }
      }
    };
    capa.anclar();
    capas.push(capa);
    return capa;
  }
  const cartel = crearCapa("abajo");
  const velo = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.MeshBasicMaterial({
    color: 0,
    transparent: true,
    opacity: 0,
    depthTest: false,
    depthWrite: false
  }));
  velo.position.z = -.05;
  velo.renderOrder = 100;
  velo.frustumCulled = false;
  camara.add(velo);
  let fundido = null;
  function fundir(hacia, segundos = .6) {
    const desde = velo.material.opacity;
    const previo = fundido;
    return new Promise(ok => {
      fundido = {
        desde: desde,
        hacia: hacia,
        t: 0,
        dur: Math.max(.001, segundos),
        ok: ok
      };
      previo?.ok();
      redibujar();
    });
  }
  const ponerVelo = a => {
    velo.material.opacity = a;
    velo.visible = a > .001;
    redibujar();
  };
  const filtro = {
    f: null
  };
  for (const tipo of [ "keydown", "keyup" ]) addEventListener(tipo, e => {
    if (filtro.f?.(e) === true) {
      e.stopImmediatePropagation();
      e.preventDefault();
    }
  }, true);
  const teclas = {};
  const pulsos = [];
  const MAPA = {
    ArrowUp: "arriba",
    KeyW: "arriba",
    ArrowDown: "abajo",
    KeyS: "abajo",
    ArrowLeft: "izq",
    KeyA: "izq",
    ArrowRight: "der",
    KeyD: "der",
    Enter: "aceptar",
    Space: "aceptar",
    NumpadEnter: "aceptar",
    Escape: "cancelar",
    Backspace: "cancelar",
    KeyE: "accion",
    KeyF: "accion",
    Tab: "menu",
    KeyM: "menu"
  };
  addEventListener("keydown", e => {
    if (e.repeat && !/Arrow/.test(e.code)) return;
    teclas[e.code] = true;
    const a = MAPA[e.code];
    if (a) {
      pulsos.push(a);
      if (a === "aceptar" || /Arrow|Space|Tab/.test(e.code)) e.preventDefault();
    }
    contextoAudio();
  });
  addEventListener("keyup", e => {
    teclas[e.code] = false;
  });
  addEventListener("blur", () => {
    for (const k of Object.keys(teclas)) if (k !== "CorrerVR" && !(tactil && k === "ShiftLeft")) teclas[k] = false;
  });
  renderer.domElement.addEventListener("pointerdown", e => {
    contextoAudio();
    if (e.pointerType !== "mouse") return;
    pulsos.push("clic");
    if (control.mirarLibre && !capturado && !renderer.xr.isPresenting) control.capturar();
  });
  const tactil = usoTactil();
  const joy = {
    x: 0,
    y: 0,
    id: null
  };
  if (tactil) {
    const css = document.createElement("style");
    const armarCss = () => {
      const k = escalaBotones(), der = joystickALaDerecha(), px = v => Math.round(v * k) + "px";
      css.textContent = `\n      #joyBase { position: fixed; ${der ? "right" : "left"}: 22px; ${der ? "left" : "right"}: auto; bottom: 26px; width: ${px(128)}; height: ${px(128)}; border-radius: 50%; z-index: 30;\n        background: radial-gradient(circle, rgba(140,26,18,.18), rgba(10,7,6,.55)); border: 1px solid rgba(122,59,30,.6); touch-action: none; }\n      #joyPalo { position: absolute; left: ${px(39)}; top: ${px(39)}; width: ${px(50)}; height: ${px(50)}; border-radius: 50%;\n        background: rgba(236,227,210,.28); border: 1px solid rgba(236,227,210,.5); pointer-events: none; }\n      #botonesTactil { position: fixed; ${der ? "left" : "right"}: 16px; ${der ? "right" : "left"}: auto; bottom: 26px; z-index: 30; display: grid; grid-template-columns: repeat(2, ${px(72)}); gap: ${px(10)}; }\n      #botonesTactil button { height: ${px(60)}; border-radius: 50%; font: ${px(12)} 'Cormorant Garamond', Georgia, serif; letter-spacing: .06em;\n        color: #ece3d2; background: rgba(10,7,6,.6); border: 1px solid rgba(122,59,30,.7); touch-action: none; }\n      #botonesTactil button.si { background: rgba(140,26,18,.6); }\n      #ayuda { display: none !important; }`;
    };
    armarCss();
    alCambiarOpciones(() => armarCss());
    document.head.appendChild(css);
    const base = document.createElement("div");
    base.id = "joyBase";
    const palo = document.createElement("div");
    palo.id = "joyPalo";
    base.appendChild(palo);
    const bot = document.createElement("div");
    bot.id = "botonesTactil";
    bot.innerHTML = '<button data-b="correr">CORRER</button><button data-b="accion">EXAMINAR</button><button data-b="cancelar">VOLVER</button><button data-b="aceptar">OK</button><button data-b="menu">MENÚ</button><button data-b="foto">FOTO</button>';
    document.body.append(base, bot);
    const mover = t => {
      const r = base.getBoundingClientRect(), R = r.width / 2;
      let dx = t.clientX - (r.left + R), dy = t.clientY - (r.top + R);
      const d = Math.hypot(dx, dy), max = R - 14 * (R / 64);
      if (d > max) {
        dx *= max / d;
        dy *= max / d;
      }
      joy.x = dx / max;
      joy.y = dy / max;
      palo.style.transform = `translate(${dx}px, ${dy}px)`;
    };
    base.addEventListener("touchstart", e => {
      e.preventDefault();
      contextoAudio();
      const t = e.changedTouches[0];
      joy.id = t.identifier;
      mover(t);
    }, {
      passive: false
    });
    base.addEventListener("touchmove", e => {
      e.preventDefault();
      for (const t of e.changedTouches) if (t.identifier === joy.id) mover(t);
    }, {
      passive: false
    });
    const soltarJ = e => {
      for (const t of e.changedTouches) if (t.identifier === joy.id) {
        joy.id = null;
        joy.x = joy.y = 0;
        palo.style.transform = "";
      }
    };
    base.addEventListener("touchend", soltarJ);
    base.addEventListener("touchcancel", soltarJ);
    bot.addEventListener("touchstart", e => {
      const b = e.target.closest("button");
      if (!b) return;
      e.preventDefault();
      contextoAudio();
      vibrarCelular(12);
      if (b.dataset.b === "correr") {
        teclas.ShiftLeft = !teclas.ShiftLeft;
        b.classList.toggle("si", teclas.ShiftLeft);
      } else pulsos.push(b.dataset.b);
    }, {
      passive: false
    });
    let mira = null;
    renderer.domElement.addEventListener("touchstart", e => {
      contextoAudio();
      const t = e.changedTouches[0];
      mira = {
        id: t.identifier,
        x: t.clientX,
        y: t.clientY,
        x0: t.clientX,
        y0: t.clientY,
        t0: performance.now()
      };
    }, {
      passive: true
    });
    renderer.domElement.addEventListener("touchmove", e => {
      for (const t of e.changedTouches) {
        if (!mira || t.identifier !== mira.id || !control.mirarLibre || renderer.xr.isPresenting) continue;
        camara.rotation.y -= (t.clientX - mira.x) * .0055;
        camara.rotation.x = THREE.MathUtils.clamp(camara.rotation.x - (t.clientY - mira.y) * .0045, -1.35, 1.35);
        mira.x = t.clientX;
        mira.y = t.clientY;
        redibujar();
      }
    }, {
      passive: true
    });
    renderer.domElement.addEventListener("touchend", e => {
      for (const t of e.changedTouches) if (mira && t.identifier === mira.id) {
        if (Math.hypot(t.clientX - mira.x0, t.clientY - mira.y0) < 12 && performance.now() - mira.t0 < 350) pulsos.push("clic");
        mira = null;
      }
    }, {
      passive: true
    });
  }
  let capturado = false;
  document.addEventListener("pointerlockchange", () => {
    capturado = document.pointerLockElement === renderer.domElement;
  });
  addEventListener("mousemove", e => {
    if (!capturado || renderer.xr.isPresenting || !control.mirarLibre) return;
    const ms = mouse();
    camara.rotation.y -= e.movementX * .0022 * ms.k;
    camara.rotation.x = THREE.MathUtils.clamp(camara.rotation.x - (ms.invertir ? -1 : 1) * e.movementY * .0022 * ms.k, -1.35, 1.35);
    redibujar();
  });
  const control = {
    mirarLibre: false,
    capturar() {
      if (renderer.xr.isPresenting || capturado) return;
      try {
        const p = renderer.domElement.requestPointerLock?.();
        p?.catch?.(() => {});
      } catch {}
    },
    soltar() {
      if (capturado) document.exitPointerLock?.();
    },
    get capturado() {
      return capturado;
    },
    rayos() {
      const lista = [];
      const r = renderer.xr.isPresenting ? casco.rayo() : null;
      if (r) lista.push({
        origen: r.origen,
        dir: r.dir,
        fuente: "control",
        mano: r.fuente === "mano",
        lado: r.lado
      }); else if (renderer.xr.isPresenting) {
        for (const c of controles) if (c.userData.lado === dominanteXR() && c.userData.conectado) {
          c.updateMatrixWorld(true);
          const o = (new THREE.Vector3).setFromMatrixPosition(c.matrixWorld);
          const d = new THREE.Vector3(0, 0, -1).transformDirection(c.matrixWorld);
          lista.push({
            origen: o,
            dir: d,
            fuente: "control"
          });
        }
      }
      const o = camara.getWorldPosition(new THREE.Vector3), d = camara.getWorldDirection(new THREE.Vector3);
      lista.push({
        origen: o,
        dir: d,
        fuente: renderer.xr.isPresenting ? "mirada" : "centro"
      });
      return lista;
    }
  };
  const controles = [ 0, 1 ].map(i => {
    const c = renderer.xr.getController(i);
    c.addEventListener("connected", e => {
      c.userData.lado = e.data?.handedness;
      c.userData.conectado = true;
    });
    c.addEventListener("disconnected", () => {
      c.userData.conectado = false;
    });
    jugador.add(c);
    return c;
  });
  const cascoVR = prepararCasco({
    renderer: renderer,
    camara: camara,
    padre: jugador,
    ojos: 1.6,
    alCambiarAltura: () => {
      if (plano.visible) anclar();
      capas.forEach(c => c.anclar());
    }
  });
  cascoVR.manos.alElegir(({tipo: tipo}) => {
    if (tipo === "mano" && !casco.inventarioAbierto) pulsos.push(plano.visible ? "aceptar" : "accion");
  });
  alCambiarOpciones(() => aplicarCalidad(renderer));
  const giroSuave = {
    listo: true
  };
  const prevBotones = new Map;
  function leerMandos() {
    const ejes = {
      x: 0,
      y: 0,
      gx: 0,
      gy: 0
    };
    const tocar = (id, i, v) => {
      const k = id + ":" + i, a = prevBotones.get(k);
      prevBotones.set(k, v);
      return v && !a;
    };
    const ses = renderer.xr.getSession?.();
    const dom = dominanteXR();
    if (ses) for (const src of ses.inputSources) {
      const gp = src.gamepad;
      if (!gp) continue;
      const lado = src.handedness, id = "xr-" + lado, esDom = lado === dom;
      const ax = gp.axes.length >= 4 ? [ gp.axes[2], gp.axes[3] ] : [ gp.axes[0] || 0, gp.axes[1] || 0 ];
      if (!esDom) {
        ejes.x += ax[0];
        ejes.y += ax[1];
      } else {
        ejes.gx += ax[0];
        ejes.gy += ax[1];
      }
      if (tocar(id, 0, gp.buttons[0]?.pressed)) pulsos.push(esDom ? "accion" : "aceptar");
      if (tocar(id, 4, gp.buttons[4]?.pressed)) pulsos.push("aceptar");
      if (tocar(id, 5, gp.buttons[5]?.pressed)) pulsos.push("cancelar");
      if (!esDom) teclas.CorrerVR = !!gp.buttons[3]?.pressed; else if (tocar(id, 3, gp.buttons[3]?.pressed)) pulsos.push("menu");
      if (tocar(id, "ar", ax[1] < -.7)) pulsos.push("arriba");
      if (tocar(id, "ab", ax[1] > .7)) pulsos.push("abajo");
      if (tocar(id, "iz", ax[0] < -.7)) pulsos.push("izq");
      if (tocar(id, "de", ax[0] > .7)) pulsos.push("der");
    }
    for (const gp of navigator.getGamepads?.() || []) {
      if (!gp || gp.mapping !== "standard") continue;
      const id = "gp" + gp.index;
      ejes.x += gp.axes[0];
      ejes.y += gp.axes[1];
      ejes.gx += gp.axes[2];
      ejes.gy += gp.axes[3];
      if (tocar(id, 0, gp.buttons[0]?.pressed)) pulsos.push("aceptar");
      if (tocar(id, 1, gp.buttons[1]?.pressed)) pulsos.push("cancelar");
      if (tocar(id, 2, gp.buttons[2]?.pressed)) pulsos.push("accion");
      if (tocar(id, 9, gp.buttons[9]?.pressed)) pulsos.push("menu");
      if (tocar(id, 12, gp.buttons[12]?.pressed)) pulsos.push("arriba");
      if (tocar(id, 13, gp.buttons[13]?.pressed)) pulsos.push("abajo");
      if (tocar(id, 14, gp.buttons[14]?.pressed)) pulsos.push("izq");
      if (tocar(id, 15, gp.buttons[15]?.pressed)) pulsos.push("der");
    }
    ejes.x += joy.x;
    ejes.y += joy.y;
    if (ses) {
      ejes.x += casco.palito.x;
      ejes.y += casco.palito.y;
      if (casco.palito.activo) {
        teclas.CorrerVR = !!casco.palito.corre;
        teclas.manoCorria = true;
      } else if (teclas.manoCorria) {
        teclas.CorrerVR = false;
        teclas.manoCorria = false;
      }
    }
    if (tactil) {
      if (tocar("joy", "ar", joy.y < -.7)) pulsos.push("arriba");
      if (tocar("joy", "ab", joy.y > .7)) pulsos.push("abajo");
      if (tocar("joy", "iz", joy.x < -.7)) pulsos.push("izq");
      if (tocar("joy", "de", joy.x > .7)) pulsos.push("der");
    }
    const zm = v => Math.abs(v) < .15 ? 0 : v;
    ejes.x = zm(ejes.x);
    ejes.y = zm(ejes.y);
    ejes.gx = zm(ejes.gx);
    ejes.gy = zm(ejes.gy);
    return ejes;
  }
  let actx = null;
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
    if (actx?.state === "suspended" && !congelado.f) actx.resume();
    return actx;
  }
  const congelado = {
    f: null,
    cam: null
  };
  const quieto = q.has("quieto");
  let sucio = 3;
  function redibujar() {
    sucio = Math.max(sucio, 2);
  }
  const tareas = new Set;
  const reloj = new THREE.Clock;
  renderer.setAnimationLoop(() => {
    const dt = Math.min(reloj.getDelta(), .1);
    const ejes = leerMandos();
    const acciones = pulsos.splice(0);
    if (congelado.f) {
      try {
        congelado.f(dt, {
          ejes: ejes,
          acciones: acciones,
          teclas: teclas
        });
      } catch (err) {
        console.error("modo foto", err);
      }
      renderer.render(escena, congelado.cam || camara);
      return;
    }
    let cambio = false;
    const vr = renderer.xr.isPresenting;
    const caminaVR = vr && !plano.visible && !!(ejes.x || ejes.y || ejes.gx);
    if (vr && opciones().giroVR === "suave") {
      if (!plano.visible && !casco.inventarioAbierto) girarConPalito(jugador, camara, ejes.gx, dt, giroSuave);
      ejes.gx = 0;
    }
    for (const t of [ ...tareas ]) {
      try {
        if (t(dt, {
          ejes: ejes,
          acciones: acciones,
          teclas: teclas
        }) === true) cambio = true;
      } catch (err) {
        t._fallas = (t._fallas || 0) + 1;
        if (t._fallas <= 3) console.error("tarea del juego", err);
      }
    }
    if (fundido) {
      fundido.t += dt;
      const k = Math.min(1, fundido.t / fundido.dur);
      ponerVelo(fundido.desde + (fundido.hacia - fundido.desde) * k);
      if (k >= 1) {
        const ok = fundido.ok;
        fundido = null;
        ok();
      }
      cambio = true;
    }
    if (renderer.xr.isPresenting) cambio = true;
    if (quieto && !cambio) {
      if (sucio <= 0) return;
      sucio--;
    }
    if (dibujo.f && !renderer.xr.isPresenting && dibujo.f() !== false) return;
    if (vr) cascoVR.actualizar(dt, {
      moviendo: caminaVR,
      objetivos: plano.visible ? [ plano ] : []
    });
    if (vr && dibujoVR.f) {
      try {
        dibujoVR.f();
      } catch (err) {
        console.error("dibujo del casco", err);
        dibujoVR.f = null;
      }
    }
    renderer.render(escena, camara);
  });
  const dibujo = {
    f: null
  }, dibujoVR = {
    f: null
  };
  const esperar = s => new Promise(ok => setTimeout(ok, s * 1e3));
  return {
    THREE: THREE,
    renderer: renderer,
    escena: escena,
    camara: camara,
    jugador: jugador,
    pantalla: pantalla,
    cartel: cartel,
    crearCapa: crearCapa,
    dibujoVR: dibujoVR,
    anclarCapas: () => capas.forEach(c => c.anclar()),
    fundir: fundir,
    ponerVelo: ponerVelo,
    get velo() {
      return velo.material.opacity;
    },
    redibujar: redibujar,
    tareas: tareas,
    control: control,
    contextoAudio: contextoAudio,
    esperar: esperar,
    teclas: teclas,
    enVR: () => renderer.xr.isPresenting,
    quieto: quieto,
    botonVR: {
      el: botonVR,
      mostrar: v => soloEnMenu(botonVR, v),
      get visible() {
        return !botonVR.classList.contains("vrFueraDeMenu");
      }
    },
    pulsar: a => pulsos.push(a),
    tactil: tactil,
    casco: cascoVR,
    manos: cascoVR.manos,
    opciones: opciones,
    ponerDibujo(f) {
      dibujo.f = f;
      redibujar();
    },
    congelar(f, cam = null) {
      congelado.f = f;
      congelado.cam = cam;
    },
    descongelar() {
      congelado.f = null;
      congelado.cam = null;
      redibujar();
    },
    get congelado() {
      return !!congelado.f;
    },
    filtrarTeclas(f) {
      filtro.f = f;
    },
    capas: capas
  };
}

const MB = 1048576;

const COMUNES = /^(SILENT HILL 4\.exe|data\/(henry\d*|wp_model|item_model2?|fontdata|message_[a-z0-9_]+|system_load|[a-z]{2}gb)\.bin)$/;

export const EQUIPO_CHICO = (() => {
  if (q.has("chico")) return q.get("chico") !== "0";
  try {
    const ua = navigator.userAgent || "";
    return /OculusBrowser|Quest|Pico|Android|iPhone|iPad|Mobile/i.test(ua) || navigator.deviceMemory > 0 && navigator.deviceMemory <= 4 || matchMedia("(pointer: coarse)").matches;
  } catch {
    return false;
  }
})();

export const TOPE_BAJAR = (q.has("memoria") ? Math.max(16, +q.get("memoria") || 0) : EQUIPO_CHICO ? 120 : 300) * MB;

const cacheBajar = new Map;

const fijados = new Map;

let enCache = 0, relojUso = 0, enCamino = 0, soltados = 0, mbSoltados = 0;

let atajoBajar = null;

const fijo = ruta => COMUNES.test(ruta) || [ ...fijados.values() ].some(s => s.has(ruta));

function recortar() {
  if (enCache <= TOPE_BAJAR) return;
  const lista = [ ...cacheBajar ].filter(([r, e]) => e.listo && !fijo(r)).sort((a, b) => a[1].uso - b[1].uso);
  for (const [r, e] of lista) {
    if (enCache <= TOPE_BAJAR) break;
    cacheBajar.delete(r);
    enCache -= e.bytes;
    soltados++;
    mbSoltados += e.bytes / MB;
  }
}

export function bajar(ruta, {prioridad: prioridad = null} = {}) {
  let e = cacheBajar.get(ruta);
  if (e) {
    e.uso = ++relojUso;
    return e.p;
  }
  e = {
    bytes: 0,
    uso: ++relojUso,
    listo: false
  };
  const baja = prioridad === "baja";
  if (!baja) enCamino++;
  const atajo = atajoBajar?.(ruta);
  e.p = (atajo || fetch("/juego/" + ruta, {
    priority: baja ? "low" : "auto"
  }).then(r => {
    if (!r.ok) throw new Error("no pude leer " + ruta);
    return r.arrayBuffer();
  })).then(b => {
    if (cacheBajar.get(ruta) === e) {
      e.bytes = b.byteLength;
      e.listo = true;
      enCache += e.bytes;
      recortar();
    }
    return b;
  }, err => {
    if (cacheBajar.get(ruta) === e) cacheBajar.delete(ruta);
    throw err;
  }).finally(() => {
    if (!baja) enCamino--;
  });
  cacheBajar.set(ruta, e);
  return e.p;
}

export function fijarBajar(grupo, rutas) {
  if (rutas?.length) fijados.set(grupo, new Set(rutas)); else fijados.delete(grupo);
  recortar();
}

export function ponerAtajoBajar(f) {
  atajoBajar = f;
}

export const enCacheBajar = ruta => cacheBajar.has(ruta);

let colaPrecarga = [], precargando = false;

export function precargar(rutas) {
  colaPrecarga = (rutas || []).filter(r => r && !cacheBajar.has(r));
  if (precargando || !colaPrecarga.length) return;
  precargando = true;
  (async () => {
    try {
      while (colaPrecarga.length) {
        if (enCamino > 0) {
          await new Promise(ok => setTimeout(ok, 300));
          continue;
        }
        if (enCache > TOPE_BAJAR * .85) break;
        const r = colaPrecarga.shift();
        if (!cacheBajar.has(r)) await bajar(r, {
          prioridad: "baja"
        }).catch(() => {});
      }
    } finally {
      precargando = false;
    }
  })();
}

export function estadoBajar() {
  return {
    mb: +(enCache / MB).toFixed(1),
    tope: TOPE_BAJAR / MB,
    archivos: cacheBajar.size,
    soltados: soltados,
    mbSoltados: Math.round(mbSoltados),
    fijos: [ ...fijados ].map(([g, s]) => g + ":" + s.size).join(" ")
  };
}

export async function json(ruta) {
  try {
    const r = await fetch(ruta, {
      cache: "no-cache"
    });
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  }
}
