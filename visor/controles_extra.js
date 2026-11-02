// SH4 web — FeniXVOID · Project Ravenlight
import { alCambiarOpciones, aplicarCalidad, escalaBotones, joystickALaDerecha, vibrarCelular, dominanteXR, girarConPalito, casco } from "./jugador/casco_comun.js";

import { opcionesMejorado } from "./mejorado/presets.js";

import { usoTactil } from "./opciones_sitio.js";

export function iniciarControlesExtra({THREE: THREE, renderer: renderer, camara: camara, jugador: jugador, ojos: ojos, teclas: teclas}) {
  const inventarioAbierto = () => !!window.sh4?.henry?.inventario?.abierto;
  const tecla = code => {
    dispatchEvent(new KeyboardEvent("keydown", {
      code: code
    }));
    setTimeout(() => dispatchEvent(new KeyboardEvent("keyup", {
      code: code
    })), 60);
  };
  const presetPorCalidad = () => {
    const m = window.sh4?.mejorado;
    if (!m?.preset || renderer.xr.isPresenting || new URLSearchParams(location.search).has("mejorado") || /OculusBrowser|Quest/i.test(navigator.userAgent)) return;
    m.preset(opcionesMejorado().presetPC);
  };
  aplicarCalidad(renderer);
  presetPorCalidad();
  alCambiarOpciones(() => {
    aplicarCalidad(renderer);
    presetPorCalidad();
  });
  const tactil = usoTactil();
  const joy = {
    x: 0,
    y: 0,
    id: null
  };
  let correrTactil = false;
  if (tactil) {
    const css = document.createElement("style");
    const armarCss = () => {
      const k = escalaBotones(), der = joystickALaDerecha(), px = v => Math.round(v * k) + "px";
      css.textContent = `\n      #joyBase { position: fixed; ${der ? "right" : "left"}: 22px; ${der ? "left" : "right"}: auto; bottom: 26px; width: ${px(128)}; height: ${px(128)}; border-radius: 50%; z-index: 30;\n        background: radial-gradient(circle, rgba(140,26,18,.18), rgba(10,7,6,.55)); border: 1px solid rgba(122,59,30,.6); touch-action: none; }\n      #joyPalo { position: absolute; left: ${px(39)}; top: ${px(39)}; width: ${px(50)}; height: ${px(50)}; border-radius: 50%;\n        background: rgba(236,227,210,.28); border: 1px solid rgba(236,227,210,.5); pointer-events: none; }\n      #botonesTactil { position: fixed; ${der ? "left" : "right"}: 16px; ${der ? "right" : "left"}: auto; bottom: 26px; z-index: 30; display: grid; grid-template-columns: repeat(2, ${px(64)}); gap: ${px(10)}; }\n      #botonesTactil button { height: ${px(54)}; border-radius: 50%; font: ${px(13)} 'Cormorant Garamond', Georgia, serif; letter-spacing: .08em;\n        color: #ece3d2; background: rgba(10,7,6,.6); border: 1px solid rgba(122,59,30,.7); touch-action: none; }\n      #botonesTactil button.si { background: rgba(140,26,18,.6); }\n      #ayuda { display: none !important; }`;
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
    bot.innerHTML = '<button data-b="correr">CORRER</button><button data-b="E">PUERTA</button><button data-b="V">VISTA</button><button data-b="R">PISO</button>';
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
    const soltar = e => {
      for (const t of e.changedTouches) if (t.identifier === joy.id) {
        joy.id = null;
        joy.x = joy.y = 0;
        palo.style.transform = "";
      }
    };
    base.addEventListener("touchend", soltar);
    base.addEventListener("touchcancel", soltar);
    bot.addEventListener("touchstart", e => {
      const b = e.target.closest("button");
      if (!b) return;
      e.preventDefault();
      vibrarCelular(12);
      if (b.dataset.b === "correr") {
        correrTactil = true;
        b.classList.add("si");
      } else tecla("Key" + b.dataset.b);
    }, {
      passive: false
    });
    bot.addEventListener("touchend", e => {
      const b = e.target.closest("button");
      if (b?.dataset.b === "correr") {
        correrTactil = false;
        b.classList.remove("si");
      }
    });
    const euler = new THREE.Euler(0, 0, 0, "YXZ");
    let mira = null;
    renderer.domElement.addEventListener("touchstart", e => {
      const t = e.changedTouches[0];
      mira = {
        id: t.identifier,
        x: t.clientX,
        y: t.clientY
      };
    }, {
      passive: true
    });
    renderer.domElement.addEventListener("touchmove", e => {
      for (const t of e.changedTouches) {
        if (!mira || t.identifier !== mira.id) continue;
        euler.setFromQuaternion(camara.quaternion);
        euler.y -= (t.clientX - mira.x) * .0055;
        euler.x -= (t.clientY - mira.y) * .0045;
        euler.x = Math.max(-1.45, Math.min(1.45, euler.x));
        camara.quaternion.setFromEuler(euler);
        mira.x = t.clientX;
        mira.y = t.clientY;
        window.sh4?.redibujar?.();
      }
    }, {
      passive: true
    });
    renderer.domElement.addEventListener("touchend", () => {
      mira = null;
    }, {
      passive: true
    });
  }
  const ajuste = new THREE.Group;
  ajuste.name = "ajuste VR (ojos de Henry)";
  let giroListo = true, correrVR = false;
  renderer.xr.addEventListener("sessionstart", () => {
    jugador.add(ajuste);
    ajuste.position.set(0, -ojos, 0);
    ajuste.add(camara);
  });
  renderer.xr.addEventListener("sessionend", () => {
    jugador.add(camara);
    ajuste.removeFromParent();
    camara.position.set(0, 0, 0);
  });
  for (let i = 0; i < 2; i++) {
    const c = renderer.xr.getController(i);
    let mano = null;
    c.addEventListener("connected", e => {
      mano = e.data?.handedness;
    });
    c.addEventListener("selectstart", e => {
      if (mano && mano !== dominanteXR() && !e.data?.hand && !inventarioAbierto()) tecla("KeyE");
    });
    ajuste.add(c);
  }
  function ejesVR() {
    const s = renderer.xr.getSession();
    if (!s) return null;
    const r = {
      mx: 0,
      my: 0,
      giro: 0,
      correr: false,
      a: false
    };
    const dom = dominanteXR();
    for (const src of s.inputSources) {
      const g = src.gamepad;
      if (!g) continue;
      const ax = g.axes.length >= 4 ? [ g.axes[2], g.axes[3] ] : [ g.axes[0] || 0, g.axes[1] || 0 ];
      if (src.handedness !== dom) {
        r.mx = ax[0];
        r.my = ax[1];
        r.correr = !!g.buttons[3]?.pressed;
      } else r.giro = ax[0];
      if (src.handedness === "right") r.a = !!g.buttons[4]?.pressed;
    }
    if (casco.palito.x || casco.palito.y) {
      r.mx = casco.palito.x;
      r.my = casco.palito.y;
    }
    return r;
  }
  let aAntes = false;
  const giroEstado = {
    listo: true
  };
  let tAntes = performance.now();
  function entrada(adelante, costado) {
    const dir = new THREE.Vector3;
    let corriendo = false, analogico = 0, girando = false;
    const ahora = performance.now(), dt = Math.min(.1, (ahora - tAntes) / 1e3);
    tAntes = ahora;
    if (renderer.xr.isPresenting) {
      const e = ejesVR();
      if (e) {
        const zona = v => Math.abs(v) < .18 ? 0 : v;
        const inv = inventarioAbierto();
        const mx = inv ? 0 : zona(e.mx), my = inv ? 0 : zona(e.my);
        dir.addScaledVector(adelante, -my).addScaledVector(costado, mx);
        analogico = Math.min(1, Math.hypot(mx, my));
        corriendo = e.correr || correrVR;
        if (!inv) girando = girarConPalito(jugador, camara, e.giro, dt, giroEstado);
        if (e.a && !aAntes && !inv) tecla("KeyE");
        aAntes = e.a;
      }
    } else if (tactil && (joy.x || joy.y)) {
      dir.addScaledVector(adelante, -joy.y).addScaledVector(costado, joy.x);
      analogico = Math.min(1, Math.hypot(joy.x, joy.y));
      corriendo = correrTactil || analogico > .95 && correrTactil;
    }
    if (tactil && correrTactil) corriendo = true;
    return {
      dir: dir,
      corriendo: corriendo,
      analogico: analogico,
      girando: girando
    };
  }
  return {
    entrada: entrada,
    tactil: tactil,
    ajuste: ajuste,
    get joy() {
      return {
        ...joy
      };
    }
  };
}
