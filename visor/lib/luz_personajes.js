// SH4 web — FeniXVOID · Project Ravenlight
import * as THREE from "three";

import { partesBin } from "./sh4bin.js";

import { NIEBLA_RADIAL, PROF_NIEBLA, DECL_NIEBLA } from "./niebla_radial.js";

const ESCALA = .005;

const URLQ = typeof location !== "undefined" ? new URLSearchParams(location.search) : new URLSearchParams;

const OP = {
  sombras: "siempre",
  niebla: true,
  caida: true,
  tope: true
};

if (URLQ.has("sombraspj")) OP.sombras = URLQ.get("sombraspj") || "siempre";

if (URLQ.has("sinsombraspj")) OP.sombras = "no";

if (URLQ.has("sombrafuerte")) OP.alfaPrueba = .7;

OP.cine = URLQ.get("sombrascine") === "sala" ? "sala" : "juego";

if (URLQ.has("lucespjantes")) {
  OP.caida = false;
  OP.tope = false;
}

export const MODO_ANTES = URLQ.get("luzpj") === "antes";

if (MODO_ANTES) Object.assign(OP, {
  sombras: "no",
  niebla: false,
  caida: false,
  tope: false
});

try {
  const o = JSON.parse(localStorage.getItem("sh4opciones") || "null");
  if (o?.sombrasPersonajes) OP.sombras = o.sombrasPersonajes;
} catch {}

try {
  addEventListener("sh4opciones", e => {
    if (e.detail?.sombrasPersonajes) OP.sombras = e.detail.sombrasPersonajes;
  });
} catch {}

export function opcionesLuzPj(o) {
  if (o) Object.assign(OP, o);
  return {
    ...OP
  };
}

const actual = {
  nombre: "",
  niebla: null,
  datosNiebla: null
};

export function marcarSala(nombre, uniformsNiebla, datosNiebla) {
  actual.nombre = nombre || "";
  actual.niebla = uniformsNiebla || null;
  actual.datosNiebla = datosNiebla || null;
}

export function salaActualPj() {
  return actual.nombre;
}

const gruposLuces = new Set;

export function registrarLucesPj(g) {
  for (const x of [ ...gruposLuces ]) if (!x.parent && x !== g) gruposLuces.delete(x);
  gruposLuces.add(g);
}

export const U_PJ = {
  uSalaNiebla: {
    value: new THREE.Vector4(1, 0, 1 / ESCALA, 0)
  },
  uSalaNieblaColor: {
    value: new THREE.Color(0)
  },
  uSh4Tope: {
    value: 1
  }
};

const mejoradoActivo = () => {
  try {
    return !!globalThis.sh4?.mejorado?.estado?.activo;
  } catch {
    return false;
  }
};

let ultimoCuadro = -1;

function sincronizar(renderer) {
  const f = renderer?.info?.render?.frame ?? -2;
  if (f === ultimoCuadro && f !== -2) return;
  ultimoCuadro = f;
  const n = actual.niebla;
  if (n && OP.niebla) {
    U_PJ.uSalaNiebla.value.copy(n.uSalaNiebla.value);
    U_PJ.uSalaNieblaColor.value.copy(n.uSalaNieblaColor.value);
  } else U_PJ.uSalaNiebla.value.w = 0;
  U_PJ.uSh4Tope.value = OP.tope && !mejoradoActivo() ? 1 : 0;
  try {
    if (globalThis.sh4 && !globalThis.sh4.luzPj) globalThis.sh4.luzPj = API;
  } catch {}
}

const CAIDA_JUEGO = `\nfloat getDistanceAttenuation( const in float lightDistance, const in float cutoffDistance, const in float decayExponent ) {\n\t// sh4: luces de personajes de lib/sala.js (decay 0): caída del TE del PC, clamp(fin/d − 1) (FUN_00426be0)\n\tif ( decayExponent == 0.0 && cutoffDistance > 0.0 ) return saturate( cutoffDistance / max( lightDistance, 1e-4 ) - 1.0 );\n\t// sh4: luces móviles de lib/luz_movil.js (decay < 0 = −inicio, en metros): la caída general del PC con inicio ≠ fin/2,\n\t// clamp(inicio·(fin − d) / ((fin − inicio)·d)) (la antorcha: 100 → 1000)\n\tif ( decayExponent < 0.0 && cutoffDistance > 0.0 ) {\n\t\tfloat sh4Ini = -decayExponent;\n\t\treturn saturate( sh4Ini * ( cutoffDistance - lightDistance ) / ( max( cutoffDistance - sh4Ini, 1e-4 ) * max( lightDistance, 1e-4 ) ) );\n\t}\n\treturn getDistanceAttenuationThree( lightDistance, cutoffDistance, decayExponent );\n}\nfloat getSpotAttenuation(`;

const TOPE_LUZ = `\n\t{ // sh4: el TE satura el color de vértice (luz) a 1 antes de multiplicar la textura\n\t\tvec3 sh4Luz = ( reflectedLight.directDiffuse + reflectedLight.indirectDiffuse ) / max( diffuseColor.rgb, vec3( 1e-3 ) );\n\t\tvec3 sh4k = mix( vec3( 1.0 ), min( vec3( 1.0 ), 1.0 / max( sh4Luz, vec3( 1e-4 ) ) ), uSh4Tope );\n\t\treflectedLight.directDiffuse *= sh4k; reflectedLight.indirectDiffuse *= sh4k;\n\t}`;

const NIEBLA_FRAG = `\n\tif (uSalaNiebla.w > 0.5) {\n\t\tfloat sh4Vis = clamp(uSalaNiebla.x + uSalaNiebla.y / max(vSh4PjProf * uSalaNiebla.z, 1e-3), 0.0, 1.0);\n\t\tbool sh4Lineal = abs(linearToOutputTexel(vec4(0.5)).r - 0.5) < 0.01;\n\t\tvec3 sh4C = sh4Lineal ? sRGBTransferOETF(vec4(max(gl_FragColor.rgb, vec3(0.0)), 1.0)).rgb : gl_FragColor.rgb;\n\t\tsh4C = mix(uSalaNieblaColor, sh4C, sh4Vis);\n\t\tgl_FragColor.rgb = sh4Lineal ? sRGBTransferEOTF(vec4(sh4C, 1.0)).rgb : sh4C;\n\t}`;

export function parcharMaterialPersonaje(mat) {
  if (!mat || mat.isShaderMaterial || mat.userData?.sh4LuzPj || MODO_ANTES) return mat;
  mat.userData.sh4LuzPj = true;
  mat.userData.salaNiebla = U_PJ;
  const iluminado = !!(mat.isMeshLambertMaterial || mat.isMeshPhongMaterial || mat.isMeshStandardMaterial);
  const previo = mat.onBeforeCompile, clave = mat.customProgramCacheKey;
  mat.onBeforeCompile = function(sh, r) {
    previo?.call(this, sh, r);
    Object.assign(sh.uniforms, U_PJ, {
      uNieblaRadial: NIEBLA_RADIAL
    });
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying float vSh4PjProf;\n" + DECL_NIEBLA).replace("#include <project_vertex>", "#include <project_vertex>\n\tvSh4PjProf = " + PROF_NIEBLA + ";");
    let f = sh.fragmentShader.replace("#include <common>", "#include <common>\nvarying float vSh4PjProf;\nuniform vec4 uSalaNiebla;\nuniform vec3 uSalaNieblaColor;\nuniform float uSh4Tope;");
    if (iluminado) {
      if (OP.caida) f = f.replace("#include <lights_pars_begin>", THREE.ShaderChunk.lights_pars_begin.replace("float getDistanceAttenuation(", "float getDistanceAttenuationThree(").replace("float getSpotAttenuation(", CAIDA_JUEGO));
      f = f.replace("#include <lights_fragment_end>", "#include <lights_fragment_end>" + TOPE_LUZ);
    }
    sh.fragmentShader = f.replace("#include <fog_fragment>", "#include  <fog_fragment>" + NIEBLA_FRAG);
  };
  mat.customProgramCacheKey = function() {
    return (clave ? clave.call(this) : "") + "|sh4LuzPj" + (OP.caida ? "c" : "");
  };
  mat.needsUpdate = true;
  return mat;
}

const partesCache = new WeakMap;

export function leerSombra(buf, ofs, len) {
  const dv = new DataView(buf, ofs, len);
  if (dv.getUint32(0, true) !== 264269824) return null;
  const nm = dv.getUint32(12, true), tabla = dv.getUint32(16, true);
  const mallas = [];
  for (let m = 0; m < nm; m++) {
    const o = dv.getUint32(tabla + m * 4, true), h = k => dv.getUint32(o + k, true);
    const oh = h(8), [oa, na, op, np, ov, nv] = [ h(16), h(20), h(24), h(28), h(32), h(36) ];
    const nh = dv.getUint16(o + oh, true), huesos = [];
    for (let k = 0; k < nh; k++) huesos.push(dv.getUint16(o + oh + 2 + k * 2, true));
    const v = new Float32Array(nv * 3), hv = new Uint16Array(nv);
    for (let k = 0; k < nv; k++) {
      const q = o + ov + k * 16;
      v[k * 3] = dv.getFloat32(q, true);
      v[k * 3 + 1] = dv.getFloat32(q + 4, true);
      v[k * 3 + 2] = dv.getFloat32(q + 8, true);
      hv[k] = huesos[dv.getInt16(q + 12, true) / 4 | 0] ?? 0;
    }
    let pol = new Uint8Array(buf, ofs + o + op, np * 4).slice(), ar = new Uint8Array(buf, ofs + o + oa, na * 4).slice();
    if (np === 2) {
      pol = new Uint8Array([ 0, 1, 2, 1, 0, 3, 1, 1 ]);
      ar = new Uint8Array([ 0, 1, 0, 1 ]);
    }
    mallas.push({
      v: v,
      hv: hv,
      pol: pol,
      ar: ar,
      nv: nv,
      np: pol.length / 4,
      na: ar.length / 4
    });
  }
  return {
    mallas: mallas,
    nv: mallas.reduce((s, m) => s + m.nv, 0)
  };
}

export function sombraDelModelo(modelo) {
  const o = modelo?.origen;
  if (!o?.buf) return null;
  let ps = partesCache.get(o.buf);
  if (!ps) {
    ps = partesBin(o.buf);
    partesCache.set(o.buf, ps);
  }
  const i = ps.findIndex(p => p.ofs === o.ofs);
  if (i < 0) return null;
  for (let k = i + 1; k < ps.length; k++) {
    if (ps[k].tipo === "modelo") return null;
    if (ps[k].tipo === "sombra") {
      try {
        return leerSombra(o.buf, ps[k].ofs, ps[k].len);
      } catch {
        return null;
      }
    }
  }
  return null;
}

const ETAPAS = {
  rl: 1,
  sb: 2,
  fr: 3,
  mz: 4,
  bd: 5,
  ie: 6,
  hs: 7,
  cm: 8,
  ls: 9,
  gt: 10,
  st: 11
};

function etapaEscena(nombre) {
  const e = ETAPAS[nombre.slice(0, 2)] || 0, n = parseInt(nombre.slice(2, 4), 10) || 0;
  return [ e, e === 1 ? n + 1 : n ];
}

const MZ_CON_SOMBRA = new Set([ 2, 4, 5, 6, 7, 8, 9, 10, 12, 14, 15, 16, 17, 18, 19, 20, 22, 24, 25, 26, 27, 28, 29, 30 ]);

function salaConSombra(nombre, enDemo = false) {
  if (OP.sombras === "no") return false;
  if (OP.sombras !== "juego") return true;
  const [e, s] = etapaEscena(nombre);
  return e === 7 && (s === 1 || s === 31) || e === 1 && s === 2 && !enDemo || e === 4 && MZ_CON_SOMBRA.has(s);
}

export function colorSombra(nombre, niebla, demo = -1) {
  const [e, s] = etapaEscena(nombre || "");
  const c = niebla?.color || [ 0, 0, 0 ], a = niebla?.alfa ?? 0, mitad = c.map(x => (x & 254) / 2 / 255);
  if (demo === 2 || demo === 50) return [ 0, 0, 0, 20 / 255 ];
  if (demo === 9) return [ 0, 0, 0, 120 / 255 ];
  if (demo === 67) return [ 0, 0, 0, 0 ];
  let alfa;
  if (e < 1 || e > 11) alfa = 45; else if (e === 1 || e === 2) alfa = 50; else if (e === 3 || e === 5) alfa = 60; else if (e === 4) alfa = s === 31 ? 0 : 80; else if (e === 6 || e === 7) alfa = 52; else if (e === 8) alfa = 45; else if (e === 9 || e === 10) return [ ...mitad, (45 | (a & 164) >> 1) / 255 ]; else return [ ...mitad, (20 | (a & 214) >> 1) / 255 ];
  return [ 0, 0, 0, alfa / 255 ];
}

const sombras = new Set;

let ordenSombra = 0;

const _m = new THREE.Matrix4, _v = new THREE.Vector3, _w = new THREE.Vector3, _q = new THREE.Vector3;

function hayPlantilla(renderer) {
  const rt = renderer.getRenderTarget();
  if (rt) return !!rt.stencilBuffer;
  try {
    return !!renderer.getContext().getContextAttributes()?.stencil;
  } catch {
    return false;
  }
}

function raiz(o) {
  while (o.parent) o = o.parent;
  return o;
}

function visible(o) {
  for (;o; o = o.parent) if (!o.visible) return false;
  return true;
}

export function ponerSombraPersonaje(pj, sv) {
  if (!sv || !sv.nv) return null;
  const nv = sv.nv, pos = new Float32Array(nv * 2 * 3);
  const maxIdx = sv.mallas.reduce((s, m) => s + m.np * 3 * 2 + m.na * 6, 0);
  const idx = new Uint16Array(Math.max(3, maxIdx));
  const g = new THREE.BufferGeometry;
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  g.setIndex(new THREE.BufferAttribute(idx, 1).setUsage(THREE.DynamicDrawUsage));
  g.setDrawRange(0, 0);
  const k = ordenSombra++ % 1e3, base = 5 + k * .003;
  const comun = {
    colorWrite: false,
    depthWrite: false,
    depthTest: true,
    transparent: true,
    stencilWrite: true,
    stencilFunc: THREE.AlwaysStencilFunc,
    stencilRef: 0,
    stencilFuncMask: 255,
    stencilWriteMask: 255,
    stencilFail: THREE.KeepStencilOp,
    stencilZPass: THREE.KeepStencilOp
  };
  const atras = new THREE.Mesh(g, new THREE.MeshBasicMaterial({
    ...comun,
    side: THREE.BackSide,
    stencilZFail: THREE.IncrementWrapStencilOp
  }));
  const adelante = new THREE.Mesh(g, new THREE.MeshBasicMaterial({
    ...comun,
    side: THREE.FrontSide,
    stencilZFail: THREE.DecrementWrapStencilOp
  }));
  const cuadro = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    uniforms: {
      uColor: {
        value: new THREE.Vector4(0, 0, 0, .2)
      }
    },
    vertexShader: "void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }",
    fragmentShader: "uniform vec4 uColor; void main() { gl_FragColor = uColor; }",
    transparent: true,
    depthTest: false,
    depthWrite: false,
    stencilWrite: true,
    stencilFunc: THREE.NotEqualStencilFunc,
    stencilRef: 0,
    stencilFuncMask: 255,
    stencilWriteMask: 255,
    stencilFail: THREE.KeepStencilOp,
    stencilZFail: THREE.ZeroStencilOp,
    stencilZPass: THREE.ZeroStencilOp
  }));
  atras.renderOrder = base;
  adelante.renderOrder = base + .001;
  cuadro.renderOrder = base + .002;
  for (const o of [ atras, adelante, cuadro ]) {
    o.frustumCulled = false;
    o.userData.sinSombra = true;
    o.userData.sombraPj = true;
    o.name = "sombra (volumen)";
  }
  cuadro.name = "sombra (oscurecido)";
  const s = {
    pj: pj,
    sv: sv,
    g: g,
    pos: pos,
    idx: idx,
    atras: atras,
    adelante: adelante,
    cuadro: cuadro,
    cuadroHecho: -1,
    luz: null,
    activa: false
  };
  atras.onBeforeRender = (renderer, escena) => {
    engancharEscena(escena);
    if (s.cuadroHecho !== renderer.info.render.frame) actualizarSombra(s, renderer);
  };
  cuadro.onBeforeRender = renderer => {
    const ok = s.activa && hayPlantilla(renderer);
    cuadro.material.uniforms.uColor.value.w = ok ? s.alfa : 0;
  };
  pj.contenedor.add(atras, adelante, cuadro);
  sombras.add(s);
  return s;
}

export function quitarSombraPersonaje(s) {
  if (!s) return;
  sombras.delete(s);
  for (const o of [ s.atras, s.adelante, s.cuadro ]) {
    o.removeFromParent();
    o.material.dispose();
  }
  s.g.dispose();
  s.cuadro.geometry.dispose();
}

const escenasEnganchadas = new WeakSet;

function engancharEscena(escena) {
  if (!escena?.isScene || escenasEnganchadas.has(escena)) return;
  escenasEnganchadas.add(escena);
  const previo = escena.onBeforeRender;
  escena.onBeforeRender = function(renderer, sc, cam, rt) {
    if (typeof previo === "function") previo.call(this, renderer, sc, cam, rt);
    sincronizar(renderer);
    for (const s of sombras) {
      if (raiz(s.pj.grupo) !== escena) continue;
      actualizarSombra(s, renderer);
    }
  };
}

function lucesDeSombra(escena) {
  let g = null;
  for (const x of gruposLuces) if (x.parent && raiz(x) === escena) g = x;
  return g;
}

const _pw = new THREE.Vector3, _id = new THREE.Matrix4;

function elegirLuzDe(s, lista, g) {
  if (!lista?.length) return null;
  s.pj.grupo.getWorldPosition(_pw);
  const mw = g ? g.matrixWorld : _id;
  let mejor = null, dmin = Infinity, dir = null;
  for (const l of lista) {
    if (l.tipo === 2) {
      dir ||= l;
      continue;
    }
    _v.set(-l.pos[0] * ESCALA, -l.pos[1] * ESCALA, l.pos[2] * ESCALA).applyMatrix4(mw);
    const d = _v.distanceTo(_pw) / ESCALA;
    if (d < l.fin * 1.5 && d < dmin) {
      dmin = d;
      mejor = l;
    }
  }
  return mejor || dir;
}

function elegirLuz(s, escena) {
  const g = lucesDeSombra(escena);
  if (!g) return null;
  return elegirLuzDe(s, g.userData.sombras, g);
}

export function lucesDeSombraSLGT(luces) {
  return (luces || []).filter(l => l.banderas & 2 && (l.tipo === 2 || l.tipo === 3)).map(l => ({
    tipo: l.tipo,
    pos: l.pos,
    dir: l.dir,
    fin: l.escala || 0,
    largo: l.largoSombra || 0
  }));
}

export function sombraDemo(pj, {id: id = -1, luces: luces = null, grupo: grupo = null, forzadas: forzadas = false} = {}) {
  const s = pj?.sombraJuego;
  if (!s) return null;
  s.demo = {
    id: +id,
    luces: luces === "escena" ? "escena" : luces ? [ ...luces ] : null,
    grupo: grupo,
    forzadas: forzadas
  };
  return s;
}

export const esHalfDemo = id => +id >= 300 && +id <= 328;

function actualizarSombra(s, renderer) {
  s.cuadroHecho = renderer.info.render.frame;
  const escena = raiz(s.pj.grupo);
  const nombre = actual.nombre;
  const D = s.demo || null;
  let luz = null;
  if (!mejoradoActivo() && visible(s.pj.grupo) && salaConSombra(nombre, !!D)) {
    if (D) {
      if (D.luces && (!D.forzadas || OP.cine === "sala")) luz = D.luces === "escena" ? elegirLuz(s, escena) : elegirLuzDe(s, D.luces, D.grupo);
    } else luz = elegirLuz(s, escena);
  }
  s.luz = luz;
  const [r, gg, b, a] = colorSombra(nombre, actual.datosNiebla, D ? D.id : -1);
  s.alfa = OP.alfaPrueba && a > 0 ? OP.alfaPrueba : a;
  s.cuadro.material.uniforms.uColor.value.set(r, gg, b, s.alfa);
  if (!luz || a <= 0) {
    s.activa = false;
    s.g.setDrawRange(0, 0);
    s.adelante.visible = s.cuadro.visible = false;
    return;
  }
  s.activa = true;
  s.adelante.visible = s.cuadro.visible = true;
  const grupoLuces = D && D.luces !== "escena" ? D.grupo : lucesDeSombra(escena);
  const mwLuces = grupoLuces ? grupoLuces.matrixWorld : _id;
  _m.copy(s.pj.contenedor.matrixWorld).invert();
  const largo = Math.abs(luz.largo) < 15e-6 ? 2e3 : luz.largo;
  let lx = 0, ly = 0, lz = 0, dx = 0, dy = 0, dz = 0;
  if (luz.tipo === 3) {
    _v.set(-luz.pos[0] * ESCALA, -luz.pos[1] * ESCALA, luz.pos[2] * ESCALA).applyMatrix4(mwLuces).applyMatrix4(_m);
    lx = _v.x;
    ly = _v.y;
    lz = _v.z;
  } else {
    _w.set(-luz.dir[0], -luz.dir[1], luz.dir[2]).transformDirection(mwLuces);
    _q.setFromMatrixPosition(_m);
    _v.copy(_w).applyMatrix4(_m).sub(_q).normalize();
    dx = _v.x;
    dy = _v.y;
    dz = _v.z;
  }
  const pos = s.pos, nv = s.sv.nv, H = s.pj.huesos;
  let base = 0, ni = 0;
  const idx = s.idx;
  for (const m of s.sv.mallas) {
    for (let k = 0; k < m.nv; k++) {
      const hb = H[m.hv[k]] || H[0];
      _v.set(m.v[k * 3], m.v[k * 3 + 1], m.v[k * 3 + 2]).applyMatrix4(hb.matrix);
      const i = (base + k) * 3, j = (nv + base + k) * 3;
      pos[i] = _v.x;
      pos[i + 1] = _v.y;
      pos[i + 2] = _v.z;
      let ex, ey, ez;
      if (luz.tipo === 3) {
        ex = _v.x - lx;
        ey = _v.y - ly;
        ez = _v.z - lz;
        const l = Math.hypot(ex, ey, ez) || 1;
        ex = ex / l * largo;
        ey = ey / l * largo;
        ez = ez / l * largo;
      } else {
        ex = dx * 2 * largo;
        ey = dy * 2 * largo;
        ez = dz * 2 * largo;
      }
      pos[j] = _v.x + ex;
      pos[j + 1] = _v.y + ey;
      pos[j + 2] = _v.z + ez;
    }
    const lit = m.lit || (m.lit = new Uint8Array(m.np));
    for (let p = 0; p < m.np; p++) {
      const a = base + m.pol[p * 4], b = base + m.pol[p * 4 + 1], c = base + m.pol[p * 4 + 2];
      const ax = pos[a * 3], ay = pos[a * 3 + 1], az = pos[a * 3 + 2];
      const e1x = pos[b * 3] - ax, e1y = pos[b * 3 + 1] - ay, e1z = pos[b * 3 + 2] - az;
      const e2x = pos[c * 3] - ax, e2y = pos[c * 3 + 1] - ay, e2z = pos[c * 3 + 2] - az;
      const nx = e1y * e2z - e1z * e2y, ny = e1z * e2x - e1x * e2z, nz = e1x * e2y - e1y * e2x;
      let Dx = dx, Dy = dy, Dz = dz;
      if (luz.tipo === 3) {
        Dx = ax - lx;
        Dy = ay - ly;
        Dz = az - lz;
      }
      const l = nx * Dx + ny * Dy + nz * Dz <= 0;
      lit[p] = l ? 1 : 0;
      if (m.pol[p * 4 + 3] === 0) {
        if (l) {
          idx[ni++] = a;
          idx[ni++] = b;
          idx[ni++] = c;
        } else {
          idx[ni++] = a + nv;
          idx[ni++] = b + nv;
          idx[ni++] = c + nv;
        }
      }
    }
    for (let e = 0; e < m.na; e++) {
      const f1 = lit[m.ar[e * 4 + 2]], f2 = lit[m.ar[e * 4 + 3]];
      if (f1 === f2) continue;
      const v0 = base + m.ar[e * 4], v1 = base + m.ar[e * 4 + 1];
      if (f1 < f2) {
        idx[ni++] = v0;
        idx[ni++] = v1;
        idx[ni++] = v0 + nv;
        idx[ni++] = v1;
        idx[ni++] = v1 + nv;
        idx[ni++] = v0 + nv;
      } else {
        idx[ni++] = v1;
        idx[ni++] = v0;
        idx[ni++] = v1 + nv;
        idx[ni++] = v0;
        idx[ni++] = v0 + nv;
        idx[ni++] = v1 + nv;
      }
    }
    base += m.nv;
  }
  s.g.attributes.position.needsUpdate = true;
  s.g.index.needsUpdate = true;
  s.g.setDrawRange(0, ni);
}

export function estadoLuzPj() {
  return {
    sala: actual.nombre,
    niebla: !!actual.niebla,
    opciones: {
      ...OP
    },
    grupos: gruposLuces.size,
    sombras: [ ...sombras ].filter(s => s.pj.grupo.parent).map(s => ({
      nombre: s.pj.grupo.name,
      activa: s.activa,
      alfa: +(s.alfa ?? 0).toFixed(3),
      demo: s.demo ? {
        id: s.demo.id,
        luces: s.demo.luces === "escena" ? "escena" : s.demo.luces ? s.demo.luces.length : null,
        forzadas: s.demo.forzadas
      } : undefined,
      luz: s.luz ? {
        tipo: s.luz.tipo,
        largo: s.luz.largo,
        pos: s.luz.pos,
        dir: s.luz.dir
      } : null,
      tris: s.g.drawRange.count / 3
    }))
  };
}

export function prepararPersonaje(pj, modelo, opciones = {}) {
  if (opciones.sombra === false) return pj;
  const sv = sombraDelModelo(modelo);
  if (sv) {
    pj.sombraJuego = ponerSombraPersonaje(pj, sv);
    if (opciones.material && opciones.sombra !== true) sombraDemo(pj, {
      id: -1,
      luces: null
    });
  }
  return pj;
}

const API = {
  estado: estadoLuzPj,
  opciones: opcionesLuzPj,
  colorSombra: colorSombra
};
