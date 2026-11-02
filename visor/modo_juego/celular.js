// SH4 web — FeniXVOID · Project Ravenlight
import { alCambiarOpciones, escalaBotones, joystickALaDerecha } from "../jugador/casco_comun.js";

const SA = lado => `env(safe-area-inset-${lado}, 0px)`;

export function prepararCelular(M) {
  if (!M?.tactil) return null;
  const css = document.createElement("style");
  css.id = "celularModoJuego";
  let medidas = null;
  function armar() {
    const k = escalaBotones(), der = joystickALaDerecha(), W = innerWidth, H = innerHeight, parado = H > W;
    const lado = der ? "left" : "right", ladoJoy = der ? "right" : "left";
    const r = v => Math.round(v * k);
    const joy = r(parado ? 124 : 108), bw = r(parado ? 62 : 60), bh = r(parado ? 48 : 40), gap = r(8), borde = 14;
    const cols = parado && 3 * bw + 2 * gap + joy + 3 * borde + 12 <= W ? 3 : 2;
    const filas = n => Math.ceil(n / cols), alto = n => filas(n) * bh + (filas(n) - 1) * gap;
    const abajo = parado ? 18 : 12;
    const abajoHenry = abajo + alto(5) + r(12);
    const afuera = c => der ? c : cols + 1 - c;
    const lugar = cols === 3 ? {
      accion: [ 2, 1 ],
      aceptar: [ 2, 2 ],
      correr: [ 1, 1 ],
      cancelar: [ 1, 2 ],
      menu: [ 1, 3 ],
      golpe: [ 2, 1 ],
      arma: [ 2, 2 ],
      paso: [ 1, 1 ],
      inv: [ 1, 2 ],
      vista: [ 1, 3 ]
    } : {
      accion: [ 3, 1 ],
      aceptar: [ 3, 2 ],
      correr: [ 2, 1 ],
      cancelar: [ 2, 2 ],
      menu: [ 1, 1 ],
      golpe: [ 3, 1 ],
      arma: [ 3, 2 ],
      paso: [ 2, 1 ],
      inv: [ 2, 2 ],
      vista: [ 1, 1 ]
    };
    const reglas = Object.entries(lugar).map(([b, [f, c]]) => {
      const sel = [ "golpe", "arma", "paso", "inv", "vista" ].includes(b) ? `#botonesHenry button[data-b=${b}]` : `#botonesTactil button[data-b=${b}]`;
      return `${sel}{grid-row:${f} !important;grid-column:${afuera(c)} !important}`;
    }).join("\n");
    const boton = `height:${bh}px !important;min-height:0 !important;border-radius:${Math.round(bh / 2)}px !important;padding:0 2px !important;margin:0 !important`;
    const racimo = `${lado}:calc(${borde}px + ${SA(lado)}) !important;${ladoJoy}:auto !important;display:grid;grid-template-columns:repeat(${cols},${bw}px) !important;` + `grid-auto-rows:${bh}px !important;gap:${gap}px !important`;
    css.textContent = `\n#joyBase{${ladoJoy}:calc(${borde + 4}px + ${SA(ladoJoy)}) !important;${lado}:auto !important;bottom:calc(${abajo + 2}px + ${SA("bottom")}) !important;width:${joy}px !important;height:${joy}px !important}\n#joyPalo{left:${Math.round(joy * .3)}px !important;top:${Math.round(joy * .3)}px !important;width:${Math.round(joy * .4)}px !important;height:${Math.round(joy * .4)}px !important}\n#botonesTactil{${racimo};bottom:calc(${abajo}px + ${SA("bottom")}) !important}\n#botonesTactil button{${boton}}\n#botonesHenry{${racimo};bottom:calc(${abajoHenry}px + ${SA("bottom")}) !important}\n#botonesHenry.oculto{display:none !important}\n#botonesHenry button,#botonesHenry button[data-b=golpe]{${boton}}\n${reglas}\n#volver{top:calc(8px + ${SA("top")}) !important;right:calc(12px + ${SA("right")}) !important}\n#estado{top:calc(8px + ${SA("top")}) !important;left:calc(10px + ${SA("left")}) !important;max-width:55vw !important}\n#botonInventario302,#botonObjetos302{top:calc(34px + ${SA("top")}) !important;right:calc(12px + ${SA("right")}) !important;padding:7px 12px !important}\n#botonCamCine{top:calc(34px + ${SA("top")}) !important;right:calc(12px + ${SA("right")}) !important}\n#botonCamMovil{top:calc(34px + ${SA("top")}) !important;left:calc(12px + ${SA("left")}) !important;right:auto !important}\n#VRButton{bottom:auto !important;top:calc(44px + ${SA("top")}) !important;left:50% !important;transform:translateX(-50%) !important;padding:6px 10px !important;width:auto !important}\n#VRButton.sinCasco{display:none !important}\n#shInventario{padding-bottom:${SA("bottom")}}`;
    medidas = {
      parado: parado,
      cols: cols,
      joy: joy,
      bw: bw,
      bh: bh,
      abajoHenry: abajoHenry
    };
  }
  armar();
  document.head.appendChild(css);
  const alFinal = () => {
    if (css.nextSibling) document.head.appendChild(css);
  };
  alCambiarOpciones(() => {
    armar();
    setTimeout(alFinal, 0);
  });
  addEventListener("resize", armar);
  addEventListener("orientationchange", () => setTimeout(armar, 200));
  const vigilarVR = () => {
    const b = document.getElementById("VRButton");
    if (!b) return;
    const t = (b.getAttribute("aria-label") || b.textContent || "").toUpperCase();
    b.classList.toggle("sinCasco", /NOT SUPPORTED|NOT AVAILABLE|NO DISPONIBLE/.test(t));
  };
  setInterval(vigilarVR, 1e3);
  vigilarVR();
  setInterval(() => {
    for (const b of document.querySelectorAll("body > button:not([id])")) if (/^(C[ÁA]MARA|CAMERA):/i.test(b.textContent || "")) b.id = b.style.left === "12px" ? "botonCamMovil" : "botonCamCine";
  }, 1500);
  return {
    get medidas() {
      return medidas;
    },
    armar: armar
  };
}
