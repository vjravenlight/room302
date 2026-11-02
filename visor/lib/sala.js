// SH4 web — FeniXVOID · Project Ravenlight
import { partesBin } from "./sh4bin.js";

import { leerMundo } from "./mundo.js";

import { leerTexturas, aRGBA } from "./texturas.js";

import { leerColision } from "./colision.js";

import { leerLuces, leerNiebla } from "./luces.js";

import { NIEBLA_RADIAL, PROF_NIEBLA, DECL_NIEBLA } from "./niebla_radial.js";

import { marcarSala, registrarLucesPj, MODO_ANTES } from "./luz_personajes.js";

import { parcharMaterialEscenario } from "./luz_movil.js";

export const ESCALA = .005;

export const NIEBLA_POR_DEFECTO = {
  cerca: 500,
  lejos: 3e3,
  color: [ 0, 0, 0 ],
  alfa: 0,
  potCerca: 8,
  potLejos: 128,
  porDefecto: true
};

export function coeficientesNiebla(n) {
  if (!n) return null;
  let pc = n.potCerca, pl = n.potLejos;
  if (!pc && !pl) return null;
  pc ||= 1;
  pl ||= 1;
  if (n.lejos === n.cerca) return null;
  const a = (255 - pc) / 255, b = (255 - pl) / 255, k = (b - a) * n.cerca;
  return {
    c0: b - k / (n.cerca - n.lejos),
    c1: k * n.lejos / (n.cerca - n.lejos),
    color: n.color.map(x => x / 255)
  };
}

let FACTOR_NIEBLA = 1, FACTOR_LUZ_PJ = 1;

const nieblasVivas = new Set, lucesVivas = new Set, oyentesNiebla = new Set;

export function escalarNiebla(co, k = FACTOR_NIEBLA) {
  if (!co || k === 1) return co;
  return {
    ...co,
    c0: 1 - k + k * co.c0,
    c1: k * co.c1
  };
}

export function factorNiebla(k) {
  if (k != null && Number.isFinite(+k) && +k !== FACTOR_NIEBLA) {
    FACTOR_NIEBLA = Math.max(0, +k);
    for (const n of nieblasVivas) n.reaplicar();
    for (const f of oyentesNiebla) {
      try {
        f(FACTOR_NIEBLA);
      } catch {}
    }
  }
  return FACTOR_NIEBLA;
}

export function alCambiarNiebla(f) {
  oyentesNiebla.add(f);
  return () => oyentesNiebla.delete(f);
}

export function brilloPersonajes(k) {
  if (k != null && Number.isFinite(+k) && +k !== FACTOR_LUZ_PJ) {
    FACTOR_LUZ_PJ = Math.max(0, +k);
    for (const g of [ ...lucesVivas ]) {
      if (!g.parent) {
        lucesVivas.delete(g);
        continue;
      }
      ajustarLucesPj(g);
    }
  }
  return FACTOR_LUZ_PJ;
}

const realcePj = () => Math.max(0, FACTOR_LUZ_PJ - 1) * .25 * Math.PI;

function ajustarLucesPj(g) {
  for (const l of g.children) {
    if (l.userData.realce) l.intensity = realcePj(); else if (l.isLight && l.userData.base != null) l.intensity = l.userData.base * FACTOR_LUZ_PJ;
  }
}

function leerOpcionesLuz(o) {
  if (!o) return;
  if (typeof o.niebla === "number") factorNiebla(o.niebla / 5);
  if (typeof o.brilloPersonajes === "number") brilloPersonajes(o.brilloPersonajes / 5);
}

try {
  leerOpcionesLuz(JSON.parse(localStorage.getItem("sh4opciones") || "null"));
} catch {}

try {
  addEventListener("sh4opciones", e => leerOpcionesLuz(e.detail));
} catch {}

export function estadoGS(pz) {
  const p = pz.params;
  const prim = p ? p.getUint32(56, true) : 20, alpha = p ? p.getUint32(52, true) : 68;
  const tex1 = p ? p.getUint32(48, true) : 96, clamp = p ? p.getUint32(40, true) : 4278198271;
  return {
    prim: prim,
    alpha: alpha,
    tex1: tex1,
    clamp: clamp,
    textura: !!(prim & 16),
    mezcla: !!(prim & 64),
    lineal: !!(tex1 & 32),
    suma: (alpha & 255) === 72 || (alpha & 255) === 104 || (alpha & 255) === 88,
    resta: (alpha & 255) === 66 || (alpha & 255) === 98
  };
}

function texturaThree(THREE, img, {lineal: lineal = true, mipmaps: mipmaps = true} = {}) {
  const t = new THREE.DataTexture(aRGBA(img), img.ancho, img.alto, THREE.RGBAFormat);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.magFilter = lineal ? THREE.LinearFilter : THREE.NearestFilter;
  t.minFilter = lineal ? mipmaps ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter : THREE.NearestFilter;
  t.generateMipmaps = lineal && mipmaps;
  t.anisotropy = lineal && mipmaps ? 4 : 1;
  t.needsUpdate = true;
  return t;
}

const LIN = new Float32Array(256);

for (let i = 0; i < 256; i++) {
  const c = i / 255;
  LIN[i] = c <= .04045 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4);
}

function crearNiebla(THREE) {
  const uniforms = {
    uSalaNiebla: {
      value: new THREE.Vector4(1, 0, 1 / ESCALA, 0)
    },
    uSalaNieblaColor: {
      value: new THREE.Color(0)
    }
  };
  function parchar(mat) {
    mat.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, uniforms, {
        uNieblaRadial: NIEBLA_RADIAL
      });
      sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying float vSalaProf;\n" + DECL_NIEBLA).replace("#include <project_vertex>", "#include <project_vertex>\n\tvSalaProf = " + PROF_NIEBLA + ";");
      sh.fragmentShader = sh.fragmentShader.replace("#include <common>", "#include <common>\nvarying float vSalaProf;\nuniform vec4 uSalaNiebla;\nuniform vec3 uSalaNieblaColor;").replace("#include <fog_fragment>", "#include  <fog_fragment>\n\tif (uSalaNiebla.w > 0.5) gl_FragColor.rgb = mix(uSalaNieblaColor, gl_FragColor.rgb, clamp(uSalaNiebla.x + uSalaNiebla.y / max(vSalaProf * uSalaNiebla.z, 1e-3), 0.0, 1.0));");
    };
    mat.customProgramCacheKey = () => "sh4salaNiebla";
    mat.userData.salaNiebla = uniforms;
  }
  return {
    uniforms: uniforms,
    parchar: parchar,
    co: null,
    activa: false,
    poner(n, activa = true) {
      this.co = coeficientesNiebla(n);
      this.reaplicar();
      this.activar(activa);
    },
    reaplicar() {
      const c = escalarNiebla(this.co);
      if (c) {
        uniforms.uSalaNiebla.value.x = c.c0;
        uniforms.uSalaNiebla.value.y = c.c1;
        uniforms.uSalaNiebla.value.z = 1 / ESCALA;
        uniforms.uSalaNieblaColor.value.setRGB(...c.color);
      }
    },
    activar(si) {
      this.activa = !!si && !!this.co;
      uniforms.uSalaNiebla.value.w = this.activa ? 1 : 0;
      return this.activa;
    },
    visibilidad(m) {
      return this.co ? Math.min(1, Math.max(0, this.co.c0 + this.co.c1 / Math.max(m / ESCALA, .001))) : 1;
    }
  };
}

const CALCOS_OCULTOS = {
  bd23: [ 3 ],
  bd28: [ 16 ]
};

const MODELOS_OCULTOS = {
  rl00a: {
    6: "bandera 0x131 (tabla 0x651ae0)",
    8: "modelo B del ObjDontMove 0x54b360"
  },
  rl00b: {
    6: "modelo B del ObjDontMove 0x54b360"
  },
  rl00c: {
    6: "modelo B del ObjDontMove 0x54b360"
  },
  rl00d: {
    6: "modelo B del ObjDontMove 0x54b360"
  },
  rl00h: {
    6: "modelo B del ObjDontMove 0x54b360"
  },
  rl00e: {
    6: "modelo B del ObjDontMove 0x54b360",
    8: "bandera 0x629 (tabla 0x651ae0)"
  },
  rl03a: {
    7: "bandera 0x61f (tabla 0x651ae0)",
    9: "bandera 0x61d (tabla 0x651ae0)",
    11: "bandera 0x61d (tabla 0x651ae0)"
  }
};

let tablaObjetos = null;

async function tablaDeObjetos() {
  if (tablaObjetos) return tablaObjetos;
  try {
    const r = await fetch(new URL("./sala_objetos.json", import.meta.url));
    tablaObjetos = r.ok ? await r.json() : {};
  } catch {
    tablaObjetos = {};
  }
  return tablaObjetos;
}

let tablaDespl = null;

async function tablaDesplazamientos() {
  if (tablaDespl) return tablaDespl;
  try {
    const r = await fetch(new URL("./sala_desplazamiento.json", import.meta.url));
    tablaDespl = r.ok ? await r.json() : {};
  } catch {
    tablaDespl = {};
  }
  return tablaDespl;
}

export function desplazamientoSala(nombre) {
  return tablaDespl && tablaDespl[nombre] || [ 0, 0, 0 ];
}

export function lucesASala(luces, nombre) {
  const o = MODO_ANTES ? [ 0, 0, 0 ] : desplazamientoSala(nombre);
  return (luces || []).map(l => l.posEtapa ? l : {
    ...l,
    posEtapa: l.pos,
    pos: [ l.pos[0] - o[0], l.pos[1] - o[1], l.pos[2] - o[2] ]
  });
}

const LUZ_FANTASMA = (pos, motivo) => ({
  pos: pos,
  color: [ .89, .67, .542 ],
  s: 200,
  e: 1e3,
  motivo: motivo
});

export const LUCES_DINAMICAS = {
  fr02: {
    mitades: [ 2 ],
    luces: [ LUZ_FANTASMA([ 3128.043, 61.651, 2149.828 ], "Phenom 0x4e0870 de fr02") ]
  },
  fr06: {
    mitades: [ 2 ],
    luces: [ LUZ_FANTASMA([ 1883.58, -314.938, 2418.06 ], "Phenom 0x4e0870 de fr06") ]
  },
  fr16: {
    mitades: [ 2 ],
    luces: [ LUZ_FANTASMA([ -239.285, -313.936, -678.08 ], "Phenom 0x4e0870 de fr16 / ItemEvent 0x4df440") ]
  },
  fr17: {
    mitades: [ 2 ],
    luces: [ LUZ_FANTASMA([ -2720.36, -279.442, -.1 ], "Phenom 0x4e0870 de fr17") ]
  },
  fr18: {
    mitades: [ 2 ],
    luces: [ LUZ_FANTASMA([ -160.36, -314.938, 799.9 ], "Phenom 0x4e0870 de fr18") ]
  },
  fr19: {
    mitades: [ 2 ],
    luces: [ LUZ_FANTASMA([ 1322.547, -354, -1952.345 ], "Phenom 0x4e0870 de fr19") ]
  },
  bd16: {
    mitades: [ 2 ],
    luces: []
  },
  bd21: {
    mitades: [ 2 ],
    luces: []
  },
  cm21: {
    mitades: [ 1, 2 ],
    luces: [ {
      pos: [ -260, -120, 30 ],
      color: [ 1, 1, .8 ],
      s: 20,
      e: 300,
      motivo: "lámpara de cm21 (FUN_004f8840)"
    } ]
  }
};

function sumarLuces(luces, x, y, z, nx, ny, nz, out) {
  out[0] = out[1] = out[2] = 0;
  for (const l of luces) {
    let dx = l.pos[0] - x, dy = l.pos[1] - y, dz = l.pos[2] - z;
    const d = Math.hypot(dx, dy, dz) || .001;
    dx /= d;
    dy /= d;
    dz /= d;
    const nl = Math.max(0, nx * dx + ny * dy + nz * dz);
    const att = Math.min(1, Math.max(0, l.s * l.e / (l.e - l.s) / d - l.s / (l.e - l.s)));
    out[0] += l.color[0] * nl * att;
    out[1] += l.color[1] * nl * att;
    out[2] += l.color[2] * nl * att;
  }
  return out;
}

const SIN_BACKCLIP = /^rl0[01]/;

const CON_GB = new Set([ "bd", "cm", "fr", "gt", "hs", "ie", "ls", "mz", "rl", "sb", "st" ]);

const BOSQUE_T5 = /^fr(05|07|19)/;

export async function armarSala(THREE, bajar, nombre, globales = new Map, opciones = {}) {
  const op = {
    mipmaps: true,
    niebla: true,
    colisionDerivada: true,
    verColision: false,
    ...opciones
  };
  const mitad = op.mitad ?? (typeof location !== "undefined" && new URLSearchParams(location.search).get("mitad") === "2" ? 2 : 1);
  const T = (await tablaDeObjetos())[nombre] || {
    objetos: [],
    ocultar: {}
  };
  await tablaDesplazamientos();
  const principal = op.principal ?? op.colisionDerivada !== false;
  let marcada = false, datosNieblaPj = null;
  const LD = LUCES_DINAMICAS[nombre.slice(0, 4)];
  const modoLuz = op.luzDinamica !== false && (!!LD?.mitades.includes(mitad) || nombre.startsWith("fr") && mitad === 2 || typeof location !== "undefined" && new URLSearchParams(location.search).get("luzmovil") === "todas");
  const lucesSala = modoLuz && LD?.luces.length ? LD.luces : null;
  const conLuz = [], conMovil = [];
  const suma = [ 0, 0, 0 ];
  const buf = await bajar("data/" + nombre + ".bin");
  const partes = partesBin(buf);
  const bancos = [ [], [] ];
  for (const p of partes) if (p.tipo === "texturas") bancos[0].push(leerTexturas(buf, p.ofs, p.len));
  const mu = nombre.slice(0, 2);
  if (!globales.has(mu)) {
    const lista = [];
    if (CON_GB.has(mu)) {
      try {
        const gb = await bajar("data/" + mu + "gb.bin");
        for (const p of partesBin(gb)) if (p.tipo === "texturas") lista.push(leerTexturas(gb, p.ofs, p.len));
      } catch {}
    }
    globales.set(mu, lista);
  }
  bancos[1] = globales.get(mu);
  const vistaCalle = /^t[wx]\d/.test(nombre) ? partes.filter(x => x.tipo === "texturas") : null;
  if (vistaCalle?.length >= 2) bancos[1] = [ leerTexturas(buf, vistaCalle[1].ofs, vistaCalle[1].len) ];
  const sala4 = nombre.slice(0, 4);
  const grupo = new THREE.Group;
  grupo.name = "sala_" + nombre;
  const niebla = crearNiebla(THREE);
  nieblasVivas.add(niebla);
  const cache = new Map;
  let piezas = 0, tris = 0, faltantes = 0, modelos = 0, orden = 0;
  const modelosOcultos = [];
  for (const p of partes) {
    if (p.tipo !== "mundo") continue;
    const obj = T.objetos.find(o => o.parte === p.indice) || null;
    const instancias = obj?.en?.length ? obj.en.filter(e => (e[4] ?? 1) === mitad) : null;
    const motivo = MODELOS_OCULTOS[nombre]?.[p.indice] || T.ocultar[p.indice] || (obj?.oculto ? obj.motivo + " (" + obj.oculto + ")" : null) || (instancias && !instancias.length ? obj.motivo + " (no está en la mitad " + mitad + ")" : null);
    if (motivo && !op.todosLosModelos) {
      modelosOcultos.push({
        parte: p.indice,
        motivo: motivo
      });
      continue;
    }
    const antes = obj?.tex != null ? partes.filter(x => x.tipo === "texturas" && x.indice <= obj.tex).length : partes.filter(x => x.tipo === "texturas" && x.indice < p.indice).length;
    const local = (vistaCalle?.length >= 2 ? bancos[0][0] : bancos[0][Math.max(0, antes - 1)]) || [];
    const m = leerMundo(buf, p.ofs, p.len);
    const gm = new THREE.Group;
    gm.name = "mundo_" + p.indice;
    let iCalco = 0, ultimoT5 = null;
    for (const z of m.piezas) {
      const gs = estadoGS(z);
      if (z.grupo === "calco" && CALCOS_OCULTOS[sala4]?.includes(iCalco++)) continue;
      const banco = z.banco ? bancos[1][0] || [] : local;
      let img = z.textura >= 1 ? banco[z.textura - 1]?.[z.paleta] || banco[z.textura - 1]?.[0] : null;
      if (z.textura === 5 && z.clut === 5) ultimoT5 = img;
      if (z.textura < 1 && BOSQUE_T5.test(nombre)) img = ultimoT5;
      if (!gs.textura) img = null;
      const clave = img ? (z.banco ? "g" : "l" + antes) + ":" + z.textura + ":" + z.paleta + (gs.lineal ? "" : ":p") : null;
      let tex = clave ? cache.get(clave) : null;
      if (clave && tex === undefined) {
        tex = texturaThree(THREE, img, {
          lineal: gs.lineal,
          mipmaps: op.mipmaps
        });
        cache.set(clave, tex);
      }
      if (gs.textura && z.textura >= 1 && !tex) faltantes++;
      const g = new THREE.BufferGeometry;
      const pos = new Float32Array(z.pos.length);
      const M = m.matrices?.[z.matriz] || null, identidad = !M || M.every((x, i) => Math.abs(x - (i % 5 === 0 ? 1 : 0)) < 1e-6);
      for (let i = 0; i < pos.length; i += 3) {
        let x = z.pos[i], y = z.pos[i + 1], w = z.pos[i + 2];
        if (!identidad) {
          const X = x, Y = y, Z = w;
          x = X * M[0] + Y * M[4] + Z * M[8] + M[12];
          y = X * M[1] + Y * M[5] + Z * M[9] + M[13];
          w = X * M[2] + Y * M[6] + Z * M[10] + M[14];
        }
        pos[i] = -x * ESCALA;
        pos[i + 1] = -y * ESCALA;
        pos[i + 2] = w * ESCALA;
      }
      g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      const col = new Float32Array(z.col.length);
      for (let i = 0; i < col.length; i += 4) {
        col[i] = LIN[Math.round(z.col[i] * 255)];
        col[i + 1] = LIN[Math.round(z.col[i + 1] * 255)];
        col[i + 2] = LIN[Math.round(z.col[i + 2] * 255)];
        col[i + 3] = z.col[i + 3];
      }
      g.setAttribute("color", new THREE.BufferAttribute(col, 4));
      let colLuz = null;
      if (lucesSala && m.luzDinamica && z.nor) {
        colLuz = new Float32Array(col.length);
        for (let i = 0, v = 0; i < col.length; i += 4, v += 3) {
          let x = z.pos[v], y = z.pos[v + 1], w = z.pos[v + 2], nx = z.nor[v], ny = z.nor[v + 1], nz = z.nor[v + 2];
          if (!identidad) {
            const X = x, Y = y, Z = w;
            x = X * M[0] + Y * M[4] + Z * M[8] + M[12];
            y = X * M[1] + Y * M[5] + Z * M[9] + M[13];
            w = X * M[2] + Y * M[6] + Z * M[10] + M[14];
            const a = nx, b = ny, c = nz;
            nx = a * M[0] + b * M[4] + c * M[8];
            ny = a * M[1] + b * M[5] + c * M[9];
            nz = a * M[2] + b * M[6] + c * M[10];
          }
          sumarLuces(lucesSala, x, y, w, nx, ny, nz, suma);
          for (let k = 0; k < 3; k++) colLuz[i + k] = LIN[Math.round(Math.min(1, z.col[i + k] + suma[k]) * 255)];
          colLuz[i + 3] = z.col[i + 3];
        }
      }
      g.setAttribute("uv", new THREE.BufferAttribute(z.uv, 2));
      g.setIndex(new THREE.BufferAttribute(z.indices, 1));
      const side = z.backclip && !SIN_BACKCLIP.test(nombre) ? THREE.BackSide : THREE.DoubleSide;
      const mat = new THREE.MeshBasicMaterial({
        map: tex || null,
        vertexColors: true,
        side: side,
        alphaTest: z.grupo === "transparente" ? 0 : .5 / 255
      });
      if (z.grupo !== "normal" || gs.mezcla) {
        mat.transparent = true;
        if (z.grupo !== "normal") mat.depthWrite = false;
        if (gs.suma) mat.blending = THREE.AdditiveBlending; else if (gs.resta) {
          mat.blending = THREE.CustomBlending;
          mat.blendEquation = THREE.ReverseSubtractEquation;
          mat.blendSrc = THREE.SrcAlphaFactor;
          mat.blendDst = THREE.OneFactor;
        }
      }
      if (z.grupo === "calco") {
        mat.polygonOffset = true;
        mat.polygonOffsetFactor = -1;
        mat.polygonOffsetUnits = -1;
      }
      if (op.niebla !== null) niebla.parchar(mat);
      if (modoLuz && m.luzDinamica && z.nor) {
        const nor = new Float32Array(z.nor.length);
        for (let i = 0; i < nor.length; i += 3) {
          let nx = z.nor[i], ny = z.nor[i + 1], nz = z.nor[i + 2];
          if (!identidad) {
            const a = nx, b = ny, c = nz;
            nx = a * M[0] + b * M[4] + c * M[8];
            ny = a * M[1] + b * M[5] + c * M[9];
            nz = a * M[2] + b * M[6] + c * M[10];
          }
          nor[i] = -nx;
          nor[i + 1] = -ny;
          nor[i + 2] = nz;
        }
        g.setAttribute("normal", new THREE.BufferAttribute(nor, 3));
        parcharMaterialEscenario(mat);
      }
      const malla = new THREE.Mesh(g, mat);
      if (mat.userData.sh4LuzMovil) conMovil.push(malla);
      if (principal && !marcada) {
        marcada = true;
        malla.onBeforeRender = () => marcarSala(nombre, niebla.uniforms, datosNieblaPj);
      }
      malla.name = `${z.grupo} t${z.textura} b${z.banco} p${z.paleta}`;
      if (z.grupo === "calco") malla.renderOrder = 1 + orden++ * 1e-4;
      if (z.grupo === "transparente") malla.renderOrder = 2;
      malla.userData = {
        pieza: piezas,
        modeloMundo: p.indice,
        grupo: z.grupo,
        textura: z.textura,
        banco: z.banco,
        paleta: z.paleta,
        clut: z.clut,
        backclip: z.backclip,
        img: img,
        tex: tex || null,
        matOriginal: mat,
        triangulos: z.indices.length / 3,
        gs: {
          prim: gs.prim,
          alpha: gs.alpha,
          tex1: gs.tex1,
          clamp: gs.clamp
        }
      };
      if (colLuz) {
        malla.userData.colorSinLuz = col.slice();
        malla.userData.colorConLuz = colLuz;
        g.attributes.color.array.set(colLuz);
        conLuz.push(malla);
      }
      gm.add(malla);
      piezas++;
      tris += z.indices.length / 3;
    }
    if (obj) gm.userData.objeto = {
      motivo: obj.motivo,
      parte: p.indice
    };
    if (instancias?.length) {
      instancias.forEach((e, k) => {
        let g = gm;
        if (k > 0) {
          g = new THREE.Group;
          g.name = gm.name + " #" + k;
          g.userData = gm.userData;
          for (const m of gm.children) {
            const c = new THREE.Mesh(m.geometry, m.material);
            c.name = m.name;
            c.renderOrder = m.renderOrder;
            c.userData = m.userData;
            g.add(c);
          }
        }
        g.position.set(-e[0] * ESCALA, -e[1] * ESCALA, e[2] * ESCALA);
        g.rotation.y = -(e[3] || 0);
        grupo.add(g);
      });
    } else grupo.add(gm);
    modelos++;
  }
  let colision = null, nColision = 0, colisionDerivada = false;
  for (const p of partes) {
    if (p.tipo !== "colision") continue;
    const c = leerColision(buf, p.ofs, p.len);
    if (!c) continue;
    const pos = [];
    for (const poli of c.polis) {
      const v = poli.v.map((x, i) => (i % 3 === 2 ? x : -x) * ESCALA);
      for (let k = 1; k + 1 < v.length / 3; k++) pos.push(...v.slice(0, 3), ...v.slice(k * 3, k * 3 + 3), ...v.slice(k * 3 + 3, k * 3 + 6));
    }
    const g = new THREE.BufferGeometry;
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    colision = new THREE.Mesh(g, new THREE.MeshBasicMaterial({
      color: 65382,
      wireframe: true,
      side: THREE.DoubleSide
    }));
    colision.name = "colision";
    colision.visible = !!op.verColision;
    grupo.add(colision);
    nColision = c.polis.length;
  }
  if (!colision && op.colisionDerivada) {
    const pos = [];
    grupo.traverse(m => {
      if (!m.isMesh || m.userData.grupo !== "normal") return;
      m.geometry.computeBoundingBox();
      const t = m.geometry.boundingBox.getSize(new THREE.Vector3);
      if (m.userData.triangulos <= 8 && Math.max(t.x, t.z) > 15 || t.x > 15 && t.y > 6 && t.z > 10) return;
      const p = m.geometry.attributes.position, idx = m.geometry.index.array;
      for (const i of idx) pos.push(p.getX(i), p.getY(i), p.getZ(i));
    });
    if (pos.length) {
      const g = new THREE.BufferGeometry;
      g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      colision = new THREE.Mesh(g, new THREE.MeshBasicMaterial({
        color: 16755200,
        wireframe: true,
        side: THREE.DoubleSide
      }));
      colision.name = "colision derivada";
      colision.visible = false;
      colision.userData.derivada = true;
      grupo.add(colision);
      colisionDerivada = true;
    }
  }
  const juegosLuces = [];
  let nieblaDatos = null;
  for (const p of partes) {
    if (p.tipo === "luces") juegosLuces.push(lucesASala(leerLuces(buf, p.ofs, p.len), nombre));
    if (p.tipo === "niebla" && !nieblaDatos) nieblaDatos = leerNiebla(buf, p.ofs, p.len);
  }
  const luces = [ ...juegosLuces[juegosLuces.length - 1] || [] ];
  const nieblaJuego = nieblaDatos || NIEBLA_POR_DEFECTO;
  niebla.poner(nieblaJuego, op.niebla !== false && op.niebla !== null);
  datosNieblaPj = nieblaJuego;
  if (principal) marcarSala(nombre, niebla.uniforms, nieblaJuego);
  return {
    nombre: nombre,
    grupo: grupo,
    colision: colision,
    colisionDerivada: colisionDerivada,
    nColision: nColision,
    luces: luces,
    juegosLuces: juegosLuces,
    niebla: nieblaDatos,
    nieblaJuego: nieblaJuego,
    nieblaSala: niebla,
    colorFondo: niebla.co ? niebla.co.color : [ 0, 0, 0 ],
    piezas: piezas,
    triangulos: tris,
    texturas: cache.size,
    faltantes: faltantes,
    modelos: modelos,
    modelosOcultos: modelosOcultos,
    mitad: mitad,
    desplazamiento: desplazamientoSala(nombre),
    luzDinamica: {
      luces: lucesSala || [],
      piezas: conLuz.length,
      activa: conLuz.length > 0,
      modo: modoLuz,
      piezasMovil: conMovil.length,
      activar(si) {
        for (const mm of conLuz) {
          const a = mm.geometry.attributes.color;
          a.array.set(si ? mm.userData.colorConLuz : mm.userData.colorSinLuz);
          a.needsUpdate = true;
        }
        this.activa = !!si && conLuz.length > 0;
        return this.activa;
      }
    },
    dispose() {
      nieblasVivas.delete(niebla);
      grupo.traverse(o => {
        o.geometry?.dispose();
        o.material?.dispose();
      });
      for (const t of cache.values()) t?.dispose();
    }
  };
}

const DIF_TE = .8, AMB_TE = .5;

export function crearLucesPersonajes(THREE, luces, opciones = {}) {
  if (opciones.modo === "antes") return crearLucesPersonajesAntes(THREE, luces);
  const g = new THREE.Group;
  g.name = "luces de personajes";
  const col = c => (new THREE.Color).setRGB(c[0] / 255, c[1] / 255, c[2] / 255, THREE.SRGBColorSpace);
  const poner = (l, base) => {
    l.userData.base = base;
    l.intensity = base * FACTOR_LUZ_PJ;
    g.add(l);
    return l;
  };
  for (const l of luces || []) {
    if (!(l.banderas & 1)) continue;
    if (l.tipo === 1) poner(new THREE.AmbientLight(col(l.color)), Math.PI * AMB_TE); else if (l.tipo === 2 || l.tipo === 5) {
      if (l.tipo === 5) continue;
      const d = new THREE.DirectionalLight(col(l.color));
      if (MODO_ANTES) d.position.set(l.dir[0], l.dir[1], -l.dir[2]).normalize().multiplyScalar(-10); else d.position.set(-l.dir[0], -l.dir[1], l.dir[2]).normalize().multiplyScalar(-10);
      if (d.position.lengthSq() < 1e-8) continue;
      poner(d, Math.PI * DIF_TE);
    } else if (l.tipo === 3) {
      const r = Math.max(.5, (l.escala || 400) * ESCALA);
      const p = new THREE.PointLight(col(l.color), 1, r, 0);
      p.position.set(-l.pos[0] * ESCALA, -l.pos[1] * ESCALA, l.pos[2] * ESCALA);
      poner(p, Math.PI * DIF_TE);
    }
  }
  if (!g.children.some(x => x.isAmbientLight)) {
    const a = opciones.ambiente || [ .3, .3, .3 ];
    poner(new THREE.AmbientLight((new THREE.Color).setRGB(a[0], a[1], a[2], THREE.SRGBColorSpace)), Math.PI * AMB_TE);
  }
  const realce = new THREE.AmbientLight(16777215, realcePj());
  realce.userData.realce = true;
  realce.name = "realce (Opciones)";
  g.add(realce);
  g.userData.sombras = (luces || []).filter(l => l.banderas & 2 && (l.tipo === 2 || l.tipo === 3)).map(l => ({
    tipo: l.tipo,
    pos: l.pos,
    dir: l.dir,
    fin: l.escala || 0,
    largo: l.largoSombra || 0
  }));
  registrarLucesPj(g);
  if (lucesVivas.size > 16) for (const x of [ ...lucesVivas ]) if (!x.parent) lucesVivas.delete(x);
  lucesVivas.add(g);
  return g;
}

function crearLucesPersonajesAntes(THREE, luces) {
  const g = new THREE.Group;
  g.name = "luces de personajes";
  const col = (c, k = 1) => (new THREE.Color).setRGB(c[0] / 128 * k, c[1] / 128 * k, c[2] / 128 * k, THREE.SRGBColorSpace);
  for (const l of luces || []) {
    if (l.tipo === 1) g.add(new THREE.AmbientLight(col(l.color), 1.6)); else if (l.tipo === 2 || l.tipo === 5) {
      const d = new THREE.DirectionalLight(col(l.color), 1.4);
      d.position.set(l.dir[0], l.dir[1], -l.dir[2]).normalize().multiplyScalar(-10);
      g.add(d);
    } else if (l.tipo === 3 || l.tipo === 4 || l.tipo === 6) {
      const p = new THREE.PointLight(col(l.color, .5), 2.2, 9, 1.2);
      p.position.set(-l.pos[0] * ESCALA, -l.pos[1] * ESCALA, l.pos[2] * ESCALA);
      g.add(p);
    }
  }
  if (!g.children.some(x => x.isAmbientLight)) g.add(new THREE.AmbientLight(7368816, 1.2));
  return g;
}
