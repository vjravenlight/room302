// SH4 web — FeniXVOID · Project Ravenlight
const PAL = [ 0, 95, 127, 159, 191, 223, 255 ];

export const ALTO = 20;

const ANCHO_CJK = 16, JAPONES0 = 57344, COREANO0 = 44032;

export async function cargarFuente(bajar, n = 0) {
  const buf = await bajar("data/fontdata.bin");
  const d = new Uint8Array(buf), dv = new DataView(buf);
  const base = dv.getUint32(4 + 4 * n, true);
  const nFuentes = dv.getUint32(0, true), baseCoreano = n + 2 < nFuentes ? dv.getUint32(4 + 4 * (n + 2), true) : 0;
  const anchos = d.subarray(base + 16, base + 240);
  const glifos = new Map;
  function decodificar(id, baseF = base, anchoFijo = 0) {
    const w = anchoFijo || anchos[id];
    const o = baseF ? dv.getUint16(baseF + 240 + 2 * (id + 112), true) * 4 : 0;
    if (!w || !o) return {
      ancho: w || 6,
      lienzo: null
    };
    let pos = baseF + o, corr = 0;
    const bits = () => {
      if (corr === 24) {
        pos += 3;
        corr = 0;
      }
      const v = (d[pos] | d[pos + 1] << 8 | d[pos + 2] << 16 | d[pos + 3] << 24) >>> corr & 7;
      corr += 3;
      return v;
    };
    const n = w * ALTO, px = new Uint8Array(n);
    let k = 0;
    while (k < n) {
      let b = bits();
      if (b === 7) {
        let z;
        b = bits();
        if (b === 0) {
          b = bits();
          if (b === 0) {
            b = bits();
            if (b === 0) {
              let b2 = bits();
              b = bits();
              if (b === 0 && b2 === 0) {
                const b3 = bits();
                b2 = bits();
                b = bits();
                z = (b << 6 | b2 << 3 | b3) + 84;
              } else z = (b << 3 | b2) + 21;
            } else z = b + 14;
          } else z = b + 7;
        } else z = b;
        k += z + 1;
      } else px[k++] = PAL[b];
    }
    const c = document.createElement("canvas");
    c.width = w;
    c.height = ALTO;
    const g = c.getContext("2d"), im = g.createImageData(w, ALTO);
    for (let i = 0; i < n; i++) {
      im.data[i * 4] = im.data[i * 4 + 1] = im.data[i * 4 + 2] = 255;
      im.data[i * 4 + 3] = px[i];
    }
    g.putImageData(im, 0, 0);
    return {
      ancho: w,
      lienzo: c
    };
  }
  function glifo(ch) {
    const c = ch.codePointAt(0);
    if (!glifos.has(c)) {
      let gl;
      if (c >= 32 && c < 256) gl = decodificar(c - 32); else if (c >= JAPONES0 && c < JAPONES0 + 6400) gl = decodificar(c - JAPONES0 + 224, base, ANCHO_CJK); else if (c >= COREANO0 && c < COREANO0 + 11172) gl = decodificar(c - COREANO0 + 224, baseCoreano, ANCHO_CJK); else if (c === 8194) gl = {
        ancho: ANCHO_CJK / 2 - 1,
        lienzo: null
      }; else gl = {
        ancho: 6,
        lienzo: null
      };
      glifos.set(c, gl);
    }
    return glifos.get(c);
  }
  const ESPACIADO = 1;
  const anchoLinea = t => [ ...t ].reduce((a, ch) => a + glifo(ch).ancho + ESPACIADO, 0);
  const tintes = new Map;
  function tenido(gl, color) {
    if (color === "#fff" || !gl.lienzo) return gl.lienzo;
    const k = gl.lienzo;
    let m = tintes.get(k);
    if (!m) tintes.set(k, m = new Map);
    if (!m.has(color)) {
      const c = document.createElement("canvas");
      c.width = k.width;
      c.height = k.height;
      const g = c.getContext("2d");
      g.drawImage(k, 0, 0);
      g.globalCompositeOperation = "source-in";
      g.fillStyle = color;
      g.fillRect(0, 0, c.width, c.height);
      m.set(color, c);
    }
    return m.get(color);
  }
  function escribir(g, texto, x, y, {escala: escala = 1, alinear: alinear = "izq", color: color = "#fff", sombra: sombra = true, interlinea: interlinea = 24, alfa: alfa = 1} = {}) {
    const lineas = String(texto).split("\n");
    g.save();
    g.imageSmoothingEnabled = true;
    g.globalAlpha = alfa;
    lineas.forEach((l, i) => {
      let cx = alinear === "centro" ? x - anchoLinea(l) / 2 : alinear === "der" ? x - anchoLinea(l) : x;
      const cy = y + i * interlinea;
      for (const ch of l) {
        const gl = glifo(ch);
        if (gl.lienzo) {
          if (sombra) g.drawImage(tenido(gl, "#000"), (cx + 1.5) * escala, (cy + 1.5) * escala, gl.ancho * escala, ALTO * escala);
          g.drawImage(tenido(gl, color), cx * escala, cy * escala, gl.ancho * escala, ALTO * escala);
        }
        cx += gl.ancho + ESPACIADO;
      }
    });
    g.restore();
  }
  return {
    escribir: escribir,
    anchoLinea: anchoLinea,
    glifo: glifo,
    ALTO: ALTO
  };
}

export { leerMensajes } from "./subtitulos.js";
