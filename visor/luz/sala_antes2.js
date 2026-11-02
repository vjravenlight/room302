// SH4 web — FeniXVOID · Project Ravenlight
import { partesBin } from "../lib/sh4bin.js";

import { leerMundo } from "../lib/mundo.js";

import { leerTexturas, aRGBA } from "../lib/texturas.js";

import { leerColision } from "../lib/colision.js";

import { leerLuces, leerNiebla } from "../lib/luces.js";

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
      Object.assign(sh.uniforms, uniforms);
      sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying float vSalaProf;").replace("#include <project_vertex>", "#include <project_vertex>\n\tvSalaProf = -mvPosition.z;");
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
      if (this.co) {
        uniforms.uSalaNiebla.value.set(this.co.c0, this.co.c1, 1 / ESCALA, 1);
        uniforms.uSalaNieblaColor.value.setRGB(...this.co.color);
      }
      this.activar(activa);
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

const SIN_BACKCLIP = /^rl0[01]/;

const BOSQUE_T5 = /^fr(05|07|19)/;

export async function armarSala(THREE, bajar, nombre, globales = new Map, opciones = {}) {
  const op = {
    mipmaps: true,
    niebla: true,
    colisionDerivada: true,
    verColision: false,
    ...opciones
  };
  const buf = await bajar("data/" + nombre + ".bin");
  const partes = partesBin(buf);
  const bancos = [ [], [] ];
  for (const p of partes) if (p.tipo === "texturas") bancos[0].push(leerTexturas(buf, p.ofs, p.len));
  const mu = nombre.slice(0, 2);
  if (!globales.has(mu)) {
    const lista = [];
    try {
      const gb = await bajar("data/" + mu + "gb.bin");
      for (const p of partesBin(gb)) if (p.tipo === "texturas") lista.push(leerTexturas(gb, p.ofs, p.len));
    } catch {}
    globales.set(mu, lista);
  }
  bancos[1] = globales.get(mu);
  const sala4 = nombre.slice(0, 4);
  const grupo = new THREE.Group;
  grupo.name = "sala_" + nombre;
  const niebla = crearNiebla(THREE);
  const cache = new Map;
  let piezas = 0, tris = 0, faltantes = 0, modelos = 0, orden = 0;
  const modelosOcultos = [];
  for (const p of partes) {
    if (p.tipo !== "mundo") continue;
    const motivo = MODELOS_OCULTOS[nombre]?.[p.indice];
    if (motivo && !op.todosLosModelos) {
      modelosOcultos.push({
        parte: p.indice,
        motivo: motivo
      });
      continue;
    }
    const antes = partes.filter(x => x.tipo === "texturas" && x.indice < p.indice).length;
    const local = bancos[0][Math.max(0, antes - 1)] || [];
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
      const malla = new THREE.Mesh(g, mat);
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
      gm.add(malla);
      piezas++;
      tris += z.indices.length / 3;
    }
    grupo.add(gm);
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
  const luces = [];
  let nieblaDatos = null;
  for (const p of partes) {
    if (p.tipo === "luces") luces.push(...leerLuces(buf, p.ofs, p.len));
    if (p.tipo === "niebla" && !nieblaDatos) nieblaDatos = leerNiebla(buf, p.ofs, p.len);
  }
  const nieblaJuego = nieblaDatos || NIEBLA_POR_DEFECTO;
  niebla.poner(nieblaJuego, op.niebla !== false && op.niebla !== null);
  return {
    nombre: nombre,
    grupo: grupo,
    colision: colision,
    colisionDerivada: colisionDerivada,
    nColision: nColision,
    luces: luces,
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
    dispose() {
      grupo.traverse(o => {
        o.geometry?.dispose();
        o.material?.dispose();
      });
      for (const t of cache.values()) t?.dispose();
    }
  };
}

export function crearLucesPersonajes(THREE, luces) {
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
