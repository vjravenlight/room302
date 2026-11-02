// SH4 web — FeniXVOID · Project Ravenlight
import { cargarFuente } from "./fuente.js";

const PRIVADO = /[-]/;

const SALTEAR = /^(SCRIPT|STYLE|TEXTAREA|OPTION|SELECT|TITLE|CANVAS)$/;

let fuente = null, obs = null;

function pintarNodo(n) {
  if (!fuente || n.nodeType !== 3 || !n.parentElement || !PRIVADO.test(n.nodeValue)) return;
  const el = n.parentElement;
  if (SALTEAR.test(el.nodeName)) return;
  const cs = getComputedStyle(el), alto = parseFloat(cs.fontSize) || 16;
  const texto = n.nodeValue.replace(/^\s+|\s+$/g, "");
  const lineas = texto.split("\n");
  const k = alto * 1.1 / 20, dpr = Math.min(2, devicePixelRatio || 1);
  const ancho = Math.max(1, ...lineas.map(l => fuente.anchoLinea(l))), altoTxt = (lineas.length - 1) * 24 + 21;
  const c = document.createElement("canvas");
  c.width = Math.ceil(ancho * k * dpr);
  c.height = Math.ceil(altoTxt * k * dpr);
  c.style.cssText = `width:${(ancho * k).toFixed(1)}px;height:${(altoTxt * k).toFixed(1)}px;vertical-align:middle;display:${lineas.length > 1 ? "block" : "inline-block"};max-width:100%`;
  c.setAttribute("role", "img");
  c.setAttribute("aria-label", texto);
  c.dataset.japones = "1";
  fuente.escribir(c.getContext("2d"), texto, 0, 0, {
    escala: k * dpr,
    color: cs.color || "#fff",
    sombra: false,
    interlinea: 24
  });
  n.replaceWith(c);
}

function pintarTodo(raiz) {
  if (!raiz) return;
  if (raiz.nodeType === 3) return pintarNodo(raiz);
  if (raiz.nodeType !== 1 || SALTEAR.test(raiz.nodeName)) return;
  const w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
  const lista = [];
  for (let n = w.nextNode(); n; n = w.nextNode()) if (PRIVADO.test(n.nodeValue)) lista.push(n);
  lista.forEach(pintarNodo);
}

export function activarJaponesDom() {
  if (obs || typeof document === "undefined") return;
  obs = new MutationObserver(cambios => {
    if (!fuente) return;
    for (const c of cambios) {
      if (c.type === "characterData") pintarNodo(c.target); else for (const n of c.addedNodes) pintarTodo(n);
    }
  });
  const empezar = () => obs.observe(document.body, {
    subtree: true,
    childList: true,
    characterData: true
  });
  if (document.body) empezar(); else addEventListener("DOMContentLoaded", empezar, {
    once: true
  });
  cargarFuente(r => fetch("/juego/" + r).then(x => {
    if (!x.ok) throw new Error(r);
    return x.arrayBuffer();
  })).then(f => {
    fuente = f;
    pintarTodo(document.body);
  }).catch(e => console.warn("japonés en el HTML: sin fontdata.bin", e.message));
}
