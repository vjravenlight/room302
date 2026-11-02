// SH4 web — FeniXVOID · Project Ravenlight
const INTERLINEA = 24;

const normalizar = t => String(t ?? "").replace(/…/g, "...").replace(/[—–]/g, "-").replace(/[“”]/g, '"').replace(/[‘’]/g, "'");

export function lienzoTexto(fuente, texto, {escala: escala = 2, color: color = "#ece3d2", sombra: sombra = true, alinear: alinear = "izq"} = {}) {
  const lineas = normalizar(texto).split("\n");
  const ancho = Math.max(1, ...lineas.map(l => fuente.anchoLinea(l))) + 3;
  const alto = (lineas.length - 1) * INTERLINEA + (fuente.ALTO || 20) + 3;
  const c = document.createElement("canvas");
  c.width = Math.ceil(ancho * escala);
  c.height = Math.ceil(alto * escala);
  const g = c.getContext("2d");
  fuente.escribir(g, lineas.join("\n"), alinear === "centro" ? ancho / 2 : 0, 0, {
    escala: escala,
    color: color,
    sombra: sombra,
    alinear: alinear,
    interlinea: INTERLINEA
  });
  c.dataset.ancho = ancho;
  c.dataset.alto = alto;
  return c;
}

export function pintarConFuente(el, fuente, texto, {px: px = .7, color: color, alinear: alinear = "izq"} = {}) {
  if (!el) return;
  texto = normalizar(texto);
  if (el.dataset.textoJuego === texto) return;
  el.dataset.textoJuego = texto;
  el.setAttribute("aria-label", texto);
  el.textContent = "";
  if (!texto) return;
  const c = lienzoTexto(fuente, texto, {
    color: color || getComputedStyle(el).color || "#ece3d2",
    alinear: alinear
  });
  c.style.width = +c.dataset.ancho * px + "px";
  c.style.height = +c.dataset.alto * px + "px";
  c.style.display = "block";
  c.style.pointerEvents = "none";
  if (alinear === "centro") c.style.margin = "0 auto";
  el.appendChild(c);
}

export function vigilarBoton(el, fuente, op = {}) {
  if (!el) return;
  const pintar = () => {
    const t = [ ...el.childNodes ].filter(n => n.nodeType === 3).map(n => n.textContent).join("").trim();
    if (t) {
      delete el.dataset.textoJuego;
      pintarConFuente(el, fuente, t, {
        alinear: "centro",
        ...op
      });
    }
  };
  pintar();
  new MutationObserver(pintar).observe(el, {
    childList: true,
    characterData: true,
    subtree: true
  });
}
