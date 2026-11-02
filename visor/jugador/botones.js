// SH4 web — FeniXVOID · Project Ravenlight
import { alCambiarOpciones, escalaBotones, joystickALaDerecha, vibrarCelular, dominanteXR } from "./casco_comun.js";

import { usoTactil } from "../opciones_sitio.js";

import { t } from "../textos_sitio.js";

export function iniciarBotonesHenry({henry: henry, renderer: renderer = null, contenedor: contenedor = document.body, tactil: tactil = null, abajo: abajo = 186, alVista: alVista = null, alLado: alLado = 0} = {}) {
  const esTactil = tactil ?? usoTactil();
  const apretado = {
    preparar: false,
    atacar: false
  };
  const vr = {
    preparar: false,
    atacar: false
  };
  let raiz = null;
  function aplicar() {
    const preparar = apretado.preparar || vr.preparar ? true : null;
    const atacar = apretado.atacar || vr.atacar ? true : null;
    henry?.entrada({
      preparar: preparar,
      atacar: atacar
    });
  }
  if (esTactil) {
    raiz = document.createElement("div");
    raiz.id = "botonesHenry";
    const estilo = () => {
      const k = escalaBotones(), lado = joystickALaDerecha() ? "left" : "right", otro = lado === "left" ? "right" : "left", px = v => Math.round(v * k) + "px";
      return `<style>\n#botonesHenry{position:fixed;${lado}:16px;${otro}:auto;bottom:${Math.round(abajo * k)}px;z-index:31;display:grid;grid-template-columns:repeat(2,${px(64)});gap:${px(10)}}\n#botonesHenry.oculto{display:none}\n@media (max-height:600px){#botonesHenry.junto{${lado}:${Math.round(alLado * k)}px;bottom:26px}}\n#botonesHenry button{height:${px(54)};border-radius:50%;font:${px(13)} 'Cormorant Garamond',Georgia,serif;letter-spacing:.08em;color:#ece3d2;\n  background:rgba(10,7,6,.6);border:1px solid rgba(122,59,30,.7);touch-action:none;user-select:none;-webkit-user-select:none}\n#botonesHenry button.si{background:rgba(140,26,18,.6)}\n#botonesHenry button[data-b=golpe]{height:${px(64)};border-color:rgba(192,38,26,.8)}\n</style>`;
    };
    const rotulos = () => [ "arma", "golpe", "paso", "inv", ...alVista ? [ "vista" ] : [] ].map(b => `<button data-b="${b}">${t("boton." + b)}</button>`).join("");
    raiz.innerHTML = `${estilo()}${rotulos()}`;
    addEventListener("sh4idioma", () => {
      for (const b of raiz.querySelectorAll("button[data-b]")) if (!b.querySelector("canvas")) b.textContent = t("boton." + b.dataset.b);
    });
    alCambiarOpciones(() => {
      const s = raiz.querySelector("style");
      if (s) s.outerHTML = estilo();
    });
    if (alLado) raiz.classList.add("junto");
    contenedor.appendChild(raiz);
    const boton = e => e.target.closest?.("button");
    raiz.addEventListener("pointerdown", e => {
      const b = boton(e);
      if (!b || !henry) return;
      e.preventDefault();
      try {
        b.setPointerCapture(e.pointerId);
      } catch {}
      vibrarCelular(12);
      const k = b.dataset.b;
      if (k === "arma") {
        apretado.preparar = true;
        b.classList.add("si");
        aplicar();
      } else if (k === "golpe") {
        apretado.atacar = true;
        b.classList.add("si");
        aplicar();
      } else if (k === "paso") henry.entrada({
        pasoAtras: true
      }); else if (k === "inv") henry.inventario && (henry.inventario.abierto ? henry.inventario.cerrar() : henry.inventario.abrir()); else if (k === "vista") alVista?.();
    });
    const soltar = e => {
      const b = boton(e);
      if (!b) return;
      const k = b.dataset.b;
      if (k === "arma") {
        apretado.preparar = false;
        b.classList.remove("si");
        aplicar();
      }
      if (k === "golpe") {
        apretado.atacar = false;
        b.classList.remove("si");
        aplicar();
      }
    };
    raiz.addEventListener("pointerup", soltar);
    raiz.addEventListener("pointercancel", soltar);
    raiz.addEventListener("contextmenu", e => e.preventDefault());
  }
  const antes = {
    b: false,
    x: false,
    y: false
  };
  const clic = {
    apretado: false,
    t: 0,
    movido: false,
    otro: false,
    cambios: 0
  };
  let visibles = null;
  function actualizar(enVR) {
    if (raiz) raiz.classList.toggle("oculto", !!enVR || !!henry?.inventario?.abierto || (visibles == null ? henry?.modo !== "3ra" : !visibles));
    if (!henry) return;
    const r = renderer ?? window.sh4?.renderer;
    const s = enVR && r?.xr?.getSession?.();
    if (!s) {
      if (vr.preparar || vr.atacar) {
        vr.preparar = vr.atacar = false;
        aplicar();
      }
      return;
    }
    let gatillo = false, agarre = false, b = false, x = false, y = false, gatilloOtro = false;
    let palitoOtro = false, palitoDom = false, ejeOtro = 0, fuenteOtra = null;
    const dom = dominanteXR();
    for (const src of s.inputSources) {
      const g = src.gamepad;
      if (!g) continue;
      const bt = i => !!g.buttons[i]?.pressed;
      if (src.handedness === dom) palitoDom = bt(3); else if (src.handedness === "left" || src.handedness === "right") {
        palitoOtro = bt(3);
        fuenteOtra = src;
        const ax = g.axes.length >= 4 ? [ g.axes[2], g.axes[3] ] : [ g.axes[0] || 0, g.axes[1] || 0 ];
        ejeOtro = Math.hypot(ax[0] || 0, ax[1] || 0);
      }
      if (bt(1)) agarre = true;
      if (src.handedness === dom) gatillo = bt(0); else if (src.handedness === "left" || src.handedness === "right") gatilloOtro = bt(0);
      if (src.handedness === "right") b = bt(5); else if (src.handedness === "left") {
        x = bt(4);
        y = bt(5);
      }
    }
    const prep = agarre || gatillo;
    if (gatillo !== vr.atacar || prep !== vr.preparar) {
      vr.atacar = gatillo;
      vr.preparar = prep;
      aplicar();
    }
    const inv = henry.inventario?.abierto;
    if (b && !antes.b && !inv) {
      if (henry.casco) henry.casco.alternar(); else henry.siguienteArma?.();
    }
    if (x && !antes.x && !inv) henry.entrada({
      pasoAtras: true
    });
    if (gatilloOtro && !antes.gatilloOtro && !inv) henry.entrada({
      remate: true
    });
    if (y && !antes.y && !henry.inventarioVR) henry.curarRapido?.();
    Object.assign(antes, {
      b: b,
      x: x,
      y: y,
      gatilloOtro: gatilloOtro
    });
    const ahora = performance.now();
    if (palitoOtro && !clic.apretado) Object.assign(clic, {
      apretado: true,
      t: ahora,
      movido: ejeOtro > .35,
      otro: palitoDom
    }); else if (palitoOtro) {
      if (ejeOtro > .35) clic.movido = true;
      if (palitoDom) clic.otro = true;
    } else if (clic.apretado) {
      clic.apretado = false;
      if (!clic.movido && !clic.otro && ahora - clic.t < 400 && !inv && !henry.controlador?.s?.muerto) {
        const antesArma = henry.controlador?.s?.arma;
        const k = henry.siguienteArma?.();
        if (k !== antesArma) {
          clic.cambios++;
          try {
            fuenteOtra?.gamepad?.hapticActuators?.[0]?.pulse?.(.35, 35);
          } catch {}
        }
      }
    }
  }
  return {
    actualizar: actualizar,
    raiz: raiz,
    ponerHenry(h) {
      henry = h;
    },
    get tactil() {
      return esTactil;
    },
    estado: () => ({
      ...apretado,
      vr: {
        ...vr
      },
      cambiosArma: clic.cambios
    }),
    get visibles() {
      return visibles;
    },
    set visibles(v) {
      visibles = v == null ? null : !!v;
    }
  };
}
