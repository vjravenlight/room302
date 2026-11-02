// SH4 web — FeniXVOID · Project Ravenlight
import * as THREE from "three";

export const CT = {
  MANCHAS_MAX: 4,
  POR_PO: 4,
  REDONDEO: .49,
  VEL_BASE: .03,
  VEL_AZAR: .02,
  ALFA_MANCHA: 128 / 255,
  ALFA_VELO: 120 / 255,
  GRILLA: 16,
  TIPOS: 3,
  COLOR_VELO: [ 112, 128, 120 ],
  COLOR_MANCHA: [ [ 62, 18, 30 ], [ 48, 24, 44 ], [ 70, 30, 26 ] ],
  GRUPOS_PIEL: [ 1, 2, 3, 4, 5, 14 ],
  CADA: 4
};

const nuevaMancha = () => ({
  u: 0,
  v: 0,
  valor: 0,
  vel: 0,
  estado: 0,
  tipo: 0
});

export function crearTexturaMaldita(pj, partes, {grupos: grupos = CT.GRUPOS_PIEL} = {}) {
  const manchas = Array.from({
    length: CT.MANCHAS_MAX
  }, nuevaMancha);
  const capas = new Map;
  let po = 0, poDibujado = -1, contador = 0, lista = null;
  function preparar() {
    if (lista) return lista;
    lista = [];
    partes?.forEach((s, ip) => {
      const g = s.textura?.grupo;
      if (g == null || !grupos.includes(g)) return;
      const mat = pj.mallas?.[ip]?.material, base = mat?.map;
      if (!mat || !base?.image) return;
      let c = capas.get(g);
      if (!c) {
        const img = base.image, w = img.width, h = img.height;
        if (!w || !h || !img.data) return;
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d", {
          willReadFrequently: false
        });
        const datos = new ImageData(new Uint8ClampedArray(img.data.buffer, img.data.byteOffset, w * h * 4), w, h);
        ctx.putImageData(datos, 0, 0);
        const tex = new THREE.CanvasTexture(canvas);
        tex.flipY = false;
        tex.colorSpace = base.colorSpace;
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.magFilter = base.magFilter;
        tex.minFilter = base.minFilter;
        tex.anisotropy = base.anisotropy;
        tex.generateMipmaps = true;
        c = {
          canvas: canvas,
          ctx: ctx,
          base: datos,
          tex: tex,
          mats: [],
          original: base,
          w: w,
          h: h
        };
        capas.set(g, c);
      }
      if (!c.mats.includes(mat)) c.mats.push(mat);
      lista.push(mat);
    });
    return lista;
  }
  function tick(valor) {
    po = Math.max(0, Math.min(1, valor || 0));
    const n = Math.round(po * CT.POR_PO - CT.REDONDEO);
    manchas.forEach((m, i) => {
      if (i < n && m.estado === 0) {
        m.u = Math.floor(Math.random() * CT.GRILLA);
        m.v = Math.floor(Math.random() * CT.GRILLA);
        m.valor = 0;
        m.vel = Math.random() * CT.VEL_AZAR + CT.VEL_BASE;
        m.estado = 1;
        m.tipo = Math.floor(Math.random() * CT.TIPOS);
      }
      if (m.estado === 1) {
        m.valor += m.vel;
        if (m.valor > 1) {
          m.valor = 1;
          m.estado = 2;
        }
      }
      if (m.estado === 2) {
        m.valor -= m.vel;
        if (m.valor < 0) {
          m.valor = 0;
          m.estado = 0;
        }
      }
    });
  }
  const hayManchas = () => manchas.some(m => m.estado);
  function dibujar() {
    if (typeof document === "undefined") return;
    if (po <= 0 && !hayManchas()) {
      if (poDibujado !== 0) {
        restaurar();
        poDibujado = 0;
      }
      return;
    }
    if (++contador % CT.CADA) return;
    const mats = preparar();
    if (!mats.length) return;
    for (const c of capas.values()) {
      const {ctx: ctx, w: w, h: h} = c;
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.putImageData(c.base, 0, 0);
      ctx.globalCompositeOperation = "multiply";
      ctx.globalAlpha = po * CT.ALFA_VELO;
      ctx.fillStyle = `rgb(${CT.COLOR_VELO.join(",")})`;
      ctx.fillRect(0, 0, w, h);
      for (const m of manchas) {
        if (!m.estado || m.valor <= 0) continue;
        const cw = w / CT.GRILLA, ch = h / CT.GRILLA, cx = (m.u + .5) * cw, cy = (m.v + .5) * ch, r = Math.max(cw, ch) * (m.tipo === 2 ? 1.6 : 1.2);
        const [cr, cg, cb] = CT.COLOR_MANCHA[m.tipo] || CT.COLOR_MANCHA[0];
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        g.addColorStop(0, `rgba(${cr},${cg},${cb},1)`);
        g.addColorStop(.55, `rgba(${cr},${cg},${cb},0.6)`);
        g.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
        ctx.globalAlpha = m.valor * CT.ALFA_MANCHA;
        ctx.fillStyle = g;
        ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
      }
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      c.tex.needsUpdate = true;
      for (const mat of c.mats) if (mat.map !== c.tex) {
        mat.map = c.tex;
        mat.needsUpdate = true;
      }
    }
    poDibujado = po;
  }
  function restaurar() {
    for (const c of capas.values()) for (const mat of c.mats) if (mat.map !== c.original) {
      mat.map = c.original;
      mat.needsUpdate = true;
    }
  }
  function dispose() {
    restaurar();
    for (const c of capas.values()) c.tex.dispose();
    capas.clear();
    lista = null;
  }
  return {
    tick: tick,
    dibujar: dibujar,
    restaurar: restaurar,
    dispose: dispose,
    get po() {
      return po;
    },
    get manchas() {
      return manchas.map(m => ({
        ...m
      }));
    }
  };
}
