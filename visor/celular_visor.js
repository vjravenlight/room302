// SH4 web — FeniXVOID · Project Ravenlight
import { usoTactil } from "./opciones_sitio.js";

import { alCambiarOpciones, escalaBotones, joystickALaDerecha } from "./jugador/casco_comun.js";

const SA = l => `env(safe-area-inset-${l}, 0px)`;

if (usoTactil() && !new URLSearchParams(location.search).has("limpio")) {
  document.body.classList.add("visorTactil", "panelCerrado");
  const css = document.createElement("style");
  css.id = "celularVisor";
  function armar() {
    const k = escalaBotones(), der = joystickALaDerecha(), parado = innerHeight > innerWidth;
    const lado = der ? "left" : "right", ladoJoy = der ? "right" : "left";
    const r = v => Math.round(v * k);
    const joy = r(parado ? 120 : 100), bw = r(parado ? 64 : 58), bh = r(parado ? 46 : 38), gap = r(8), borde = 14;
    const abajo = parado ? 18 : 10, abajoHenry = abajo + 2 * bh + gap + r(12);
    const afuera = c => der ? c : 3 - c;
    const lugar = {
      E: [ 2, 1 ],
      correr: [ 2, 2 ],
      V: [ 1, 1 ],
      R: [ 1, 2 ],
      golpe: [ 2, 1 ],
      arma: [ 2, 2 ],
      paso: [ 1, 1 ],
      inv: [ 1, 2 ],
      vista: [ 3, 1 ]
    };
    const reglas = Object.entries(lugar).map(([b, [f, c]]) => `${[ "golpe", "arma", "paso", "inv", "vista" ].includes(b) ? "#botonesHenry" : "#botonesTactil"} button[data-b=${b}]{grid-row:${f} !important;grid-column:${afuera(c)} !important}`).join("\n");
    const racimo = `${lado}:calc(${borde}px + ${SA(lado)}) !important;${ladoJoy}:auto !important;display:grid;grid-template-columns:repeat(2,${bw}px) !important;grid-auto-rows:${bh}px !important;gap:${gap}px !important`;
    const boton = `height:${bh}px !important;min-height:0 !important;border-radius:${Math.round(bh / 2)}px !important;padding:0 2px !important;margin:0 !important;font-size:${r(parado ? 12 : 11)}px !important`;
    css.textContent = `\n/* arriba: ⤢ (pantalla_completa.js, 6 px) · ☰ · … · la pastilla de la Suite a la derecha */\n#botonPanel{position:fixed;top:calc(6px + ${SA("top")});left:calc(46px + ${SA("left")});z-index:41;width:34px;height:34px;padding:0 !important;\n  font:18px/1 Georgia,serif !important;background:rgba(0,0,0,.55) !important;color:#e8d9c4 !important;border:1px solid #6a4a3a !important;border-radius:4px !important}\nbody.visorTactil:not(.panelCerrado) #botonPanel{background:rgba(110,26,16,.75) !important}\nbody.visorTactil.panelCerrado #panel{display:none !important}\nbody.visorTactil.sh-con-nav #panel,body.visorTactil #panel{top:calc(46px + ${SA("top")}) !important;left:calc(8px + ${SA("left")}) !important;right:calc(8px + ${SA("right")}) !important;\n  max-width:none !important;max-height:${parado ? "62vh" : `calc(100vh - 56px - ${SA("top")})`} !important;overflow:auto !important;z-index:60 !important;padding:8px 10px !important;box-sizing:border-box;background:rgba(10,7,6,.95) !important}\nbody.visorTactil #panel select{max-width:100% !important}\nbody.visorTactil #panel button,body.visorTactil #panel select,body.visorTactil #panel summary{min-height:34px}\nbody.visorTactil #ayuda{display:none !important}\n#cajonCelular{margin-top:8px;padding-top:8px;border-top:1px solid rgba(122,59,30,.35);display:flex;flex-wrap:wrap;gap:6px;align-items:center}\n#cajonCelular #btnInsp,#cajonCelular #mejorado,#cajonCelular #VRButton{position:static !important;inset:auto !important;transform:none !important;margin:0 !important}\n#cajonCelular #mejorado{display:flex;flex-wrap:wrap;gap:6px;background:none !important;border:0 !important;padding:0 !important}\n#cajonCelular #VRButton{width:auto !important;padding:6px 10px !important;opacity:1 !important}\n#cajonCelular #VRButton.sinCasco{display:none !important}\nbody.visorTactil #insp{top:calc(46px + ${SA("top")}) !important;left:calc(8px + ${SA("left")}) !important;right:calc(8px + ${SA("right")}) !important;max-width:none !important;\n  max-height:${parado ? "60vh" : `calc(100vh - 56px)`} !important;overflow:auto !important;z-index:61 !important}\n/* el estado: una línea chica arriba que se esconde sola */\nbody.visorTactil #estado{position:fixed !important;top:calc(46px + ${SA("top")});left:calc(10px + ${SA("left")});right:calc(10px + ${SA("right")});z-index:25;margin:0 !important;\n  font-size:11px !important;line-height:1.3;color:#cfc4b4 !important;white-space:nowrap !important;overflow:hidden;text-overflow:ellipsis;pointer-events:none;\n  text-shadow:0 0 4px #000,0 0 2px #000;transition:opacity .6s}\nbody.visorTactil #estado.dormido{opacity:0}\nbody.visorTactil:not(.panelCerrado) #estado{display:none}\nbody.visorTactil #avisoPuerta{bottom:auto !important;top:calc(64px + ${SA("top")}) !important;font-size:13px !important;letter-spacing:.06em !important;\n  padding:3px 10px !important;max-width:calc(100vw - 32px);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n/* joystick y botones */\n#joyBase{${ladoJoy}:calc(${borde + 4}px + ${SA(ladoJoy)}) !important;${lado}:auto !important;bottom:calc(${abajo + 2}px + ${SA("bottom")}) !important;width:${joy}px !important;height:${joy}px !important}\n#joyPalo{left:${Math.round(joy * .3)}px !important;top:${Math.round(joy * .3)}px !important;width:${Math.round(joy * .4)}px !important;height:${Math.round(joy * .4)}px !important}\n#botonesTactil{${racimo};bottom:calc(${abajo}px + ${SA("bottom")}) !important}\n#botonesHenry{${racimo};bottom:calc(${abajoHenry}px + ${SA("bottom")}) !important}\n#botonesHenry.oculto{display:none !important}\n#botonesTactil button,#botonesHenry button,#botonesHenry button[data-b=golpe]{${boton}}\n${reglas}`;
  }
  armar();
  document.head.appendChild(css);
  alCambiarOpciones(armar);
  addEventListener("resize", armar);
  addEventListener("orientationchange", () => setTimeout(armar, 200));
  const panel = document.getElementById("panel");
  const boton = document.createElement("button");
  boton.id = "botonPanel";
  boton.type = "button";
  boton.textContent = "☰";
  boton.title = "Panel";
  boton.setAttribute("aria-label", "Panel");
  const abrir = si => {
    document.body.classList.toggle("panelCerrado", !si);
    boton.setAttribute("aria-expanded", si ? "true" : "false");
  };
  let ultimo = 0;
  const alternar = e => {
    e.preventDefault();
    e.stopPropagation();
    if (performance.now() - ultimo < 400) return;
    ultimo = performance.now();
    abrir(document.body.classList.contains("panelCerrado"));
  };
  boton.addEventListener("click", alternar);
  boton.addEventListener("touchend", alternar, {
    passive: false
  });
  for (const ev of [ "touchstart", "pointerdown" ]) boton.addEventListener(ev, e => e.stopPropagation(), {
    passive: true
  });
  document.body.appendChild(boton);
  abrir(false);
  const cajon = document.createElement("div");
  cajon.id = "cajonCelular";
  panel?.appendChild(cajon);
  const estado = document.getElementById("estado");
  if (estado) document.body.appendChild(estado);
  const mudar = () => {
    for (const id of [ "btnInsp", "mejorado", "VRButton" ]) {
      const el = document.getElementById(id);
      if (el && el.parentNode !== cajon) cajon.appendChild(el);
    }
    const vr = document.getElementById("VRButton");
    if (vr) vr.classList.toggle("sinCasco", /NOT SUPPORTED|NOT AVAILABLE/i.test(vr.textContent || ""));
  };
  mudar();
  setInterval(mudar, 1e3);
  document.addEventListener("click", e => {
    if (e.target?.closest?.("#btnInsp")) abrir(false);
  }, true);
  if (estado) {
    let t = null;
    const despertar = () => {
      estado.classList.remove("dormido");
      clearTimeout(t);
      t = setTimeout(() => estado.classList.add("dormido"), 3e3);
    };
    new MutationObserver(despertar).observe(estado, {
      childList: true,
      characterData: true,
      subtree: true
    });
    despertar();
  }
  window.sh4 = window.sh4 || {};
  window.sh4.panelCelular = {
    abrir: abrir
  };
}
