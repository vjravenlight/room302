// SH4 web — FeniXVOID · Project Ravenlight
import { crearMusica, TEMA_TITULO } from "./modo_juego/musica_juego.js";

import { leerSdpa, leerWav } from "./sonido/formatos.js";

import { lienzoTexto } from "./modo_juego/textos_dom.js";

import { cargarTextosJuego, leerOpciones } from "./opciones_sitio.js";

export const SE_MENU = {
  cursor: 4e4,
  elegir: 40007,
  cancelar: 40002
};

const FUNDIDO_ELEGIR = 1;

let ctx = null;

function contexto() {
  const Ctx = globalThis.AudioContext || globalThis.webkitAudioContext;
  if (!Ctx) return null;
  ctx ??= new Ctx({
    latencyHint: "interactive"
  });
  if (ctx.state !== "running") ctx.resume().catch(() => {});
  return ctx;
}

let filas = null, indice = null;

const buffers = new Map;

async function rango(ruta, a, b) {
  const r = await fetch("/juego/" + ruta, {
    headers: {
      Range: `bytes=${a}-${b}`
    }
  });
  if (!r.ok) throw new Error("no pude leer " + ruta);
  const buf = await r.arrayBuffer();
  return r.status === 206 ? buf : buf.slice(a, b + 1);
}

async function bufferEfecto(wav, hz) {
  const clave = wav + "@" + hz;
  if (!buffers.has(clave)) buffers.set(clave, (async () => {
    indice ??= (async () => {
      const n = new DataView(await rango("sound/sound.pac", 0, 7)).getUint32(4, true);
      return leerSdpa(await rango("sound/sound.pac", 0, 8 + 12 * n - 1));
    })();
    const e = (await indice)[wav];
    const w = leerWav(new Uint8Array(await rango("sound/sound.pac", e.ofs, e.ofs + e.bytes - 1)), e.loopOfs);
    const ab = contexto().createBuffer(w.canales.length, w.canales[0].length, hz || w.frecuencia);
    w.canales.forEach((c, k) => ab.copyToChannel(c, k));
    return ab;
  })().catch(er => {
    buffers.delete(clave);
    throw er;
  }));
  return buffers.get(clave);
}

let volEfectos = 1;

export async function efectoMenu(id) {
  const c = contexto();
  if (!c) return;
  try {
    filas ??= fetch("/datos/sonido.json").then(r => r.json()).then(d => d.se);
    const fila = (await filas)[id];
    if (!fila) return;
    for (const capa of fila.capas) {
      const ab = await bufferEfecto(capa.wav, capa.hz);
      const s = c.createBufferSource();
      s.buffer = ab;
      const g = c.createGain();
      g.gain.value = Math.max(0, fila.vol) / 127 * volEfectos;
      const p = c.createStereoPanner();
      p.pan.value = Math.max(-1, Math.min(1, (capa.pan - 64) / 64));
      s.connect(g);
      g.connect(p);
      p.connect(c.destination);
      s.start();
      s.onended = () => {
        try {
          p.disconnect();
        } catch {}
      };
    }
  } catch (er) {
    console.warn("efecto del menú", id, er.message);
  }
}

export function prepararPortada({menu: menu = document.getElementById("menu"), velo: velo = null, esperarIntro: esperarIntro = Promise.resolve()} = {}) {
  const q = new URLSearchParams(location.search);
  const sinMusica = q.has("sinmusica");
  const M = {
    contextoAudio: contexto
  };
  const musica = crearMusica({
    M: M
  });
  const aplicarVolumen = o => {
    musica.volumen(o.volMus);
    volEfectos = Math.max(0, Math.min(1.25, (o.volEfe ?? 8) / 8));
  };
  aplicarVolumen(leerOpciones());
  addEventListener("sh4opciones", e => aplicarVolumen(e.detail || leerOpciones()));
  let musicaPausada = false;
  esperarIntro.then(() => {
    if (!sinMusica && !musicaPausada) musica.tocar(TEMA_TITULO, {
      siNoSuena: true
    });
  });
  velo ??= Object.assign(document.createElement("div"), {
    id: "veloPortada"
  });
  velo.style.cssText = "position:fixed;inset:0;background:#000;opacity:0;pointer-events:none;z-index:99990;transition:opacity 0s linear";
  if (!velo.isConnected) document.body.appendChild(velo);
  addEventListener("pageshow", e => {
    if (!e.persisted) return;
    velo.style.transition = "none";
    velo.style.opacity = "0";
    yendo = false;
    if (!sinMusica && !musicaPausada) musica.tocar(TEMA_TITULO, {
      siNoSuena: true
    });
  });
  let fuente = null;
  const pintar = a => {
    const etq = a.querySelector(".etq");
    if (!etq || !fuente) return;
    const texto = etq.textContent.trim();
    let c = a.querySelector("canvas.etqJuego");
    if (c && c.dataset.texto === texto) return;
    const nuevo = lienzoTexto(fuente, texto, {
      escala: 2,
      color: "#ffffff",
      sombra: true,
      alinear: "centro"
    });
    nuevo.className = "etqJuego";
    nuevo.dataset.texto = texto;
    nuevo.setAttribute("aria-hidden", "true");
    nuevo.style.width = +nuevo.dataset.ancho * 1.1 + "px";
    nuevo.style.height = +nuevo.dataset.alto * 1.1 + "px";
    if (c) c.replaceWith(nuevo); else etq.after(nuevo);
    a.classList.add("conLetraJuego");
  };
  cargarTextosJuego().then(({fuente: f}) => {
    fuente = f;
    for (const a of menu.querySelectorAll("a")) pintar(a);
    new MutationObserver(cambios => {
      for (const c of cambios) {
        const a = (c.target.nodeType === 3 ? c.target.parentNode : c.target).closest?.("#menu a");
        if (a) pintar(a);
      }
    }).observe(menu, {
      subtree: true,
      characterData: true,
      childList: true
    });
    addEventListener("sh4idioma", () => setTimeout(() => {
      for (const a of menu.querySelectorAll("a")) pintar(a);
    }, 0));
  }).catch(() => {});
  let yendo = false;
  function elegir(a) {
    if (yendo) return false;
    const href = a.getAttribute("href") || "";
    efectoMenu(SE_MENU.elegir);
    if (href.startsWith("#")) return false;
    yendo = true;
    musica.parar(2);
    velo.style.transition = `opacity ${FUNDIDO_ELEGIR}s linear`;
    requestAnimationFrame(() => {
      velo.style.opacity = "1";
    });
    setTimeout(() => {
      location.href = a.href;
    }, FUNDIDO_ELEGIR * 1e3 + 30);
    return true;
  }
  menu.addEventListener("click", e => {
    const a = e.target.closest("a");
    if (!a) return;
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.button === 1) return;
    if (e.defaultPrevented) {
      if (!yendo) efectoMenu(SE_MENU.elegir);
      return;
    }
    if (elegir(a)) e.preventDefault();
  });
  return {
    musica: musica,
    cursor: () => efectoMenu(SE_MENU.cursor),
    cancelar: () => efectoMenu(SE_MENU.cancelar),
    elegir: elegir,
    pausarMusica() {
      musicaPausada = true;
      musica.parar(2);
    },
    seguirMusica() {
      musicaPausada = false;
      if (!sinMusica) musica.tocar(TEMA_TITULO, {
        siNoSuena: true
      });
    },
    estado: () => ({
      musica: musica.estado(),
      audio: ctx?.state ?? null,
      letraJuego: menu.querySelectorAll("canvas.etqJuego").length,
      velo: +velo.style.opacity || 0
    })
  };
}
