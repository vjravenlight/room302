// SH4 web — FeniXVOID · Project Ravenlight
import { leerOpciones } from "../opciones_sitio.js";

const ID = "sh4-brillo";

let lienzo = null;

function filtro(exp) {
  let svg = document.getElementById(ID + "-svg");
  if (!svg) {
    svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.id = ID + "-svg";
    svg.setAttribute("width", "0");
    svg.setAttribute("height", "0");
    svg.style.cssText = "position:absolute;width:0;height:0;pointer-events:none";
    svg.innerHTML = `<filter id="${ID}" color-interpolation-filters="sRGB"><feComponentTransfer>` + [ "R", "G", "B" ].map(c => `<feFunc${c} type="gamma" amplitude="1" offset="0" exponent="1"/>`).join("") + "</feComponentTransfer></filter>";
    document.body.appendChild(svg);
  }
  for (const f of svg.querySelectorAll("feFuncR,feFuncG,feFuncB")) f.setAttribute("exponent", exp.toFixed(4));
}

export const gammaDeNivel = n => {
  const v = Math.min(10, Math.max(0, Number.isFinite(+n) ? +n : 5));
  return v >= 5 ? 1 + (v - 5) * .2 : 1 - (5 - v) * .06;
};

export function aplicarBrillo(nivel = leerOpciones().brillo ?? 5) {
  if (!lienzo) return;
  const g = gammaDeNivel(nivel);
  if (Math.abs(g - 1) < .001) {
    lienzo.style.filter = "";
    return;
  }
  filtro(1 / g);
  lienzo.style.filter = `url(#${ID})`;
}

export function prepararBrillo(canvas) {
  lienzo = canvas;
  aplicarBrillo();
  addEventListener("sh4opciones", e => aplicarBrillo(e.detail?.brillo ?? leerOpciones().brillo));
}
