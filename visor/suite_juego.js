// SH4 web — FeniXVOID · Project Ravenlight
import { partesBin } from "./lib/sh4bin.js";

import { leerTexturas, aRGBA } from "./lib/texturas.js";

const cache = new Map;

async function imagenes(archivo) {
  if (!cache.has(archivo)) cache.set(archivo, (async () => {
    const r = await fetch("/juego/data/" + archivo + ".bin");
    if (!r.ok) throw new Error("no se pudo leer " + archivo);
    const buf = await r.arrayBuffer();
    const lista = [];
    for (const p of partesBin(buf)) if (p.tipo === "texturas") {
      try {
        for (const g of leerTexturas(buf, p.ofs, p.len)) lista.push(...g);
      } catch {}
    }
    return lista;
  })());
  return cache.get(archivo);
}

export async function imagenJuego(archivo, n, [x, y, w, h] = [ 0, 0, 512, 448 ], {modo: modo = "color", escalaX: escalaX = 1.25, color: color = [ 255, 255, 255 ]} = {}) {
  const im = (await imagenes(archivo))[n];
  if (!im) throw new Error(`${archivo} no tiene la imagen ${n}`);
  const px = aRGBA(im);
  const datos = new ImageData(w, h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const s = ((y + j) * im.ancho + (x + i)) * 4, d = (j * w + i) * 4;
    if (modo === "alfa") {
      datos.data[d] = color[0];
      datos.data[d + 1] = color[1];
      datos.data[d + 2] = color[2];
      datos.data[d + 3] = px[s + 3];
    } else {
      datos.data[d] = px[s];
      datos.data[d + 1] = px[s + 1];
      datos.data[d + 2] = px[s + 2];
      datos.data[d + 3] = 255;
    }
  }
  const a = document.createElement("canvas");
  a.width = w;
  a.height = h;
  a.getContext("2d").putImageData(datos, 0, 0);
  if (escalaX === 1) return a;
  const c = document.createElement("canvas");
  c.width = Math.round(w * escalaX);
  c.height = h;
  const g = c.getContext("2d");
  g.imageSmoothingQuality = "high";
  g.drawImage(a, 0, 0, c.width, h);
  return c;
}

export async function fondoJuego(el, archivo, n, recorte, opciones) {
  try {
    const c = await imagenJuego(archivo, n, recorte, opciones);
    el.style.backgroundImage = `url(${c.toDataURL()})`;
    el.classList.add("con-imagen");
  } catch {}
}

export const RECORTES = {
  tituloFondo: [ "snap_title", 0, [ 0, 0, 512, 448 ] ],
  logo: [ "snap_title", 1, [ 9, 96, 497, 100 ], {
    modo: "alfa"
  } ],
  logoCompleto: [ "snap_title", 1, [ 0, 88, 512, 120 ], {
    modo: "alfa",
    escalaX: 1
  } ],
  copyright: [ "snap_title", 1, [ 87, 414, 334, 17 ], {
    modo: "alfa"
  } ],
  niebla: [ "snap_title", 1, [ 0, 448, 380, 64 ], {
    modo: "alfa"
  } ],
  opciones: [ "snap_option", 0, [ 0, 0, 512, 448 ] ],
  gameover: [ "snap_gameover", 0, [ 0, 0, 512, 448 ] ],
  carne: [ "snap_opening", 3, [ 0, 0, 512, 448 ] ],
  nota: [ "snap_1stlet", 0, [ 0, 0, 512, 448 ] ],
  guardar: [ "snap_save", 0, [ 0, 0, 512, 448 ] ],
  mirilla: [ "doorscope", 0, [ 0, 0, 256, 256 ], {
    escalaX: 1
  } ]
};

export const recorte = nombre => imagenJuego(...RECORTES[nombre]);
