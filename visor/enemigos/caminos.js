// SH4 web — FeniXVOID · Project Ravenlight
import { partesBin } from "../lib/sh4bin.js";

const MAX = 32;

const CELDA = 400;

const ATTR_META = 4;

export class Red {
  constructor(buf, ofs, len) {
    const v = new DataView(buf, ofs, len);
    const n = len >= 16 ? v.getInt32(4, true) : 0, ov = len >= 16 ? v.getInt32(8, true) : 0, ol = len >= 16 ? v.getInt32(12, true) : 0;
    this.n = n;
    this.p = new Float32Array(n * 3);
    this.e0 = new Uint8Array(n);
    this.e1 = new Uint8Array(n);
    this.attr = new Uint8Array(n);
    this.enl = [];
    for (let i = 0; i < n; i++) {
      const o = ov + 16 * i;
      this.p[i * 3] = v.getFloat32(o, true);
      this.p[i * 3 + 1] = v.getFloat32(o + 4, true);
      this.p[i * 3 + 2] = v.getFloat32(o + 8, true);
      this.e0[i] = v.getUint8(o + 12);
      this.e1[i] = v.getUint8(o + 13);
      this.attr[i] = v.getUint8(o + 14);
      const l = [];
      if (ol) {
        let q = v.getInt32(ol + 4 * i, true);
        for (let k = 0; k < 64 && q + 4 <= len; k++, q += 4) {
          const x = v.getInt32(q, true);
          if (x < 0) break;
          l.push(x);
        }
      }
      this.enl.push(l);
    }
  }
  pos(i) {
    return [ this.p[i * 3], this.p[i * 3 + 1], this.p[i * 3 + 2] ];
  }
  punto(i) {
    return [ this.p[i * 3], this.p[i * 3 + 1], this.p[i * 3 + 2], this.e0[i], this.e1[i], this.attr[i] ];
  }
  enEscena(i, s) {
    return this.e0[i] === s || this.e1[i] === s;
  }
}

export function leerArchivoCaminos(buf) {
  const partes = partesBin(buf);
  return partes.map(x => {
    try {
      return new Red(buf, x.ofs, x.len);
    } catch {
      return null;
    }
  });
}

const d2 = (a, b) => {
  const x = a[0] - b[0], y = a[1] - b[1], z = a[2] - b[2];
  return x * x + y * y + z * z;
};

const d2xz = (a, b) => {
  const x = a[0] - b[0], z = a[2] - b[2];
  return x * x + z * z;
};

export function astar(red, ini, meta) {
  if (ini < 0 || meta < 0 || ini >= red.n || meta >= red.n) return null;
  const P = red.p, dist = (a, b) => Math.hypot(P[a * 3] - P[b * 3], P[a * 3 + 1] - P[b * 3 + 1], P[a * 3 + 2] - P[b * 3 + 2]);
  const g = new Float64Array(red.n).fill(Infinity), f = new Float64Array(red.n).fill(Infinity), padre = new Int32Array(red.n).fill(-1);
  const abierto = new Set([ ini ]), cerrado = new Uint8Array(red.n);
  g[ini] = 0;
  f[ini] = dist(ini, meta);
  while (abierto.size) {
    let c = -1, fc = Infinity;
    for (const x of abierto) if (f[x] < fc) {
      fc = f[x];
      c = x;
    }
    if (c === meta) {
      const r = [];
      for (let x = c; x >= 0; x = padre[x]) r.push(x);
      return r.reverse();
    }
    abierto.delete(c);
    cerrado[c] = 1;
    for (const s of red.enl[c]) {
      if (s >= red.n || cerrado[s]) continue;
      const ng = g[c] + dist(c, s);
      if (ng < g[s]) {
        g[s] = ng;
        f[s] = ng + dist(s, meta);
        padre[s] = c;
        abierto.add(s);
      }
    }
  }
  return null;
}

let datosP = null;

export function datosCaminos() {
  datosP ||= fetch("/datos/caminos.json").then(r => r.ok ? r.json() : null).catch(() => null);
  return datosP;
}

export function crearCaminos({THREE: THREE, getColision: getColision, escala: escala = .005, leer: leer}) {
  const rayo = new THREE.Raycaster, vA = new THREE.Vector3, vB = new THREE.Vector3;
  const archivos = new Map;
  let D = null;
  const c = {
    etapa: null,
    numEtapa: 0,
    escena: 0,
    detalle: null,
    verdes: null,
    red: null,
    parteRed: null,
    ver: false,
    rayos: 0,
    desplazamientos: {}
  };
  let grilla = null;
  function armarGrilla(col) {
    const g = {
      col: col,
      tris: null,
      celdas: new Map,
      x0: 0,
      z0: 0,
      sello: null,
      marca: 0
    };
    const pos = col.geometry?.attributes?.position;
    if (!col.isMesh || !pos) return g;
    col.updateMatrixWorld?.(true);
    const M = col.matrixWorld, v = new THREE.Vector3, n = pos.count - pos.count % 3, out = [];
    const P = i => {
      v.fromBufferAttribute(pos, i).applyMatrix4(M);
      return [ -v.x / escala, -v.y / escala, v.z / escala ];
    };
    for (let i = 0; i < n; i += 3) {
      const a = P(i), b = P(i + 1), cc = P(i + 2);
      const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], wx = cc[0] - a[0], wy = cc[1] - a[1], wz = cc[2] - a[2];
      const nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx, L = Math.hypot(nx, ny, nz);
      if (L < 1e-9) continue;
      out.push(...a, ...b, ...cc);
    }
    g.tris = new Float32Array(out);
    g.sello = new Uint32Array(out.length / 9);
    let x0 = Infinity, z0 = Infinity;
    for (let k = 0; k < out.length; k += 3) {
      x0 = Math.min(x0, out[k]);
      z0 = Math.min(z0, out[k + 2]);
    }
    g.x0 = x0;
    g.z0 = z0;
    for (let t = 0; t < out.length / 9; t++) {
      const o = t * 9;
      const mnx = Math.min(out[o], out[o + 3], out[o + 6]), mxx = Math.max(out[o], out[o + 3], out[o + 6]);
      const mnz = Math.min(out[o + 2], out[o + 5], out[o + 8]), mxz = Math.max(out[o + 2], out[o + 5], out[o + 8]);
      for (let i = Math.floor((mnx - x0) / CELDA); i <= Math.floor((mxx - x0) / CELDA); i++) for (let j = Math.floor((mnz - z0) / CELDA); j <= Math.floor((mxz - z0) / CELDA); j++) {
        const k = i * 4096 + j;
        let l = g.celdas.get(k);
        if (!l) g.celdas.set(k, l = []);
        l.push(t);
      }
    }
    return g;
  }
  function corta(T, o, a, d, eps = 0) {
    const e1x = T[o + 3] - T[o], e1y = T[o + 4] - T[o + 1], e1z = T[o + 5] - T[o + 2];
    const e2x = T[o + 6] - T[o], e2y = T[o + 7] - T[o + 1], e2z = T[o + 8] - T[o + 2];
    const px = d[1] * e2z - d[2] * e2y, py = d[2] * e2x - d[0] * e2z, pz = d[0] * e2y - d[1] * e2x;
    const det = e1x * px + e1y * py + e1z * pz;
    if (Math.abs(det) < 1e-9) return false;
    const inv = 1 / det, sx = a[0] - T[o], sy = a[1] - T[o + 1], sz = a[2] - T[o + 2];
    const u = (sx * px + sy * py + sz * pz) * inv;
    if (u < 0 || u > 1) return false;
    const qx = sy * e1z - sz * e1y, qy = sz * e1x - sx * e1z, qz = sx * e1y - sy * e1x;
    const w = (d[0] * qx + d[1] * qy + d[2] * qz) * inv;
    if (w < 0 || u + w > 1) return false;
    const t = (e2x * qx + e2y * qy + e2z * qz) * inv;
    return t >= eps && t <= 1 - eps;
  }
  c.paredRayo = function(a, b, col = getColision?.()) {
    if (!col) return false;
    vA.set(-a[0] * escala, -a[1] * escala, a[2] * escala);
    vB.set(-b[0] * escala, -b[1] * escala, b[2] * escala);
    const L = vA.distanceTo(vB);
    if (L < 1e-4) return false;
    rayo.set(vA, vB.sub(vA).divideScalar(L));
    rayo.near = 5 * escala;
    rayo.far = L - 5 * escala;
    return rayo.intersectObject(col, true).length > 0;
  };
  c.pared = function(a, b) {
    const col = getColision?.();
    if (!col) return false;
    c.rayos++;
    if (!grilla || grilla.col !== col) grilla = armarGrilla(col);
    if (!grilla.tris) return c.paredRayo(a, b, col);
    const G = grilla, T = G.tris, d = [ b[0] - a[0], b[1] - a[1], b[2] - a[2] ];
    const eps = Math.min(.49, 5 / (Math.hypot(d[0], d[1], d[2]) || 1));
    const m = ++G.marca;
    const i0 = Math.max(0, Math.floor((Math.min(a[0], b[0]) - G.x0) / CELDA)), i1 = Math.floor((Math.max(a[0], b[0]) - G.x0) / CELDA);
    const j0 = Math.max(0, Math.floor((Math.min(a[2], b[2]) - G.z0) / CELDA)), j1 = Math.min(4095, Math.floor((Math.max(a[2], b[2]) - G.z0) / CELDA));
    const L2 = d[0] * d[0] + d[2] * d[2];
    for (let i = i0; i <= i1; i++) for (let j = j0; j <= j1; j++) {
      if (L2 > 1e-6 && (i1 > i0 || j1 > j0)) {
        const cx = G.x0 + (i + .5) * CELDA - a[0], cz = G.z0 + (j + .5) * CELDA - a[2];
        if (Math.abs(cx * d[2] - cz * d[0]) / Math.sqrt(L2) > CELDA * .7072) continue;
      }
      const l = G.celdas.get(i * 4096 + j);
      if (!l) continue;
      for (const t of l) {
        if (G.sello[t] === m) continue;
        G.sello[t] = m;
        if (corta(T, t * 9, a, d, eps)) return true;
      }
    }
    return false;
  };
  c.obstaculo = function(desde, hasta) {
    const a = [ desde[0], desde[1] - 100, desde[2] ], b = [ hasta[0], hasta[1] - 100, hasta[2] ];
    let lx = b[2] - a[2], lz = -(b[0] - a[0]);
    const L = Math.hypot(lx, lz) || 1;
    lx /= L;
    lz /= L;
    for (const k of [ -50, 0 ]) {
      if (c.pared([ a[0] + lx * k, a[1], a[2] + lz * k ], [ b[0] + lx * k, b[1], b[2] + lz * k ])) return true;
    }
    return false;
  };
  c.choca = function(desde, hasta, ancho = 0) {
    const a = [ desde[0], desde[1] - 4, desde[2] ], b = [ hasta[0], hasta[1] - 4, hasta[2] ];
    if (c.pared(a, b)) return true;
    if (!(ancho >= 15258789e-12)) return false;
    let lx = b[2] - a[2], lz = -(b[0] - a[0]);
    const L = Math.hypot(lx, lz);
    if (L < 1e-6) return false;
    lx = lx / L * ancho;
    lz = lz / L * ancho;
    if (c.pared([ a[0] + lx, a[1], a[2] + lz ], [ b[0] + lx, b[1], b[2] + lz ])) return true;
    return c.pared([ a[0] - lx, a[1], a[2] - lz ], [ b[0] - lx, b[1], b[2] - lz ]);
  };
  c.desplazamiento = function(escena, etapa = c.etapa) {
    const t = D?.etapas?.[etapa]?.desplazamientos?.[String(escena)];
    return t ? [ t[0], t[1], t[2] ] : [ 0, 0, 0 ];
  };
  c.aEtapa = (p, escena = c.escena) => {
    const o = c.desplazamiento(escena);
    return [ p[0] + o[0], p[1] + o[1], p[2] + o[2] ];
  };
  c.aEscena = (p, escena = c.escena) => {
    const o = c.desplazamiento(escena);
    return [ p[0] - o[0], p[1] - o[1], p[2] - o[2] ];
  };
  async function archivo(nombre) {
    if (!archivos.has(nombre)) archivos.set(nombre, Promise.resolve(leer(nombre)).then(b => leerArchivoCaminos(b)).catch(() => null));
    return archivos.get(nombre);
  }
  c.alCargarEscena = async function(etapa, escena, {bandera: bandera = () => false} = {}) {
    D ||= await datosCaminos();
    const E = D?.etapas?.[etapa];
    c.etapa = etapa;
    c.numEtapa = E?.numero ?? 0;
    c.escena = +escena;
    c.detalle = c.verdes = c.red = null;
    c.parteRed = null;
    if (archivos.size > 2) for (const k of [ ...archivos.keys() ]) if (!k.startsWith(etapa)) archivos.delete(k);
    if (!E?.archivo) return c;
    const partes = await archivo(E.archivo);
    if (!partes || c.etapa !== etapa || c.escena !== +escena) return c;
    const s = E.escenas?.[String(escena)];
    if (s?.detalle != null) c.detalle = partes[s.detalle] || null;
    if (s?.verdes != null) c.verdes = partes[s.verdes] || null;
    const R = E.red_etapa;
    let k = null;
    if (R?.por === "banderas") {
      for (const [b, p] of R.lista) {
        if (b === 0 || bandera(b)) {
          k = p;
          break;
        }
      }
    } else if (R?.por === "escena") k = R.escenas?.[String(escena)] ?? null;
    if (k != null) {
      c.red = partes[k] || null;
      c.parteRed = k;
    }
    c.version = (c.version || 0) + 1;
    return c;
  };
  const meta = p => [ p[0], p[1], p[2], 255, 255, ATTR_META ];
  function cercanoVisible(red, p) {
    const orden = [];
    for (let i = 0; i < red.n; i++) orden.push([ d2(red.pos(i), p), i ]);
    orden.sort((x, y) => x[0] - y[0]);
    for (const [, i] of orden) if (!c.pared(p, red.pos(i))) return i;
    return -1;
  }
  function cercano(red, p, filtro = null) {
    let m = -1, dm = Infinity;
    for (let i = 0; i < red.n; i++) {
      if (filtro && !filtro(i)) continue;
      const d = d2(red.pos(i), p);
      if (d < dm) {
        dm = d;
        m = i;
      }
    }
    return m;
  }
  function recortar(red, lista, desde, hasta) {
    const out = [];
    let cur = desde, prev = lista[0], ultimo = -1, k = 0, tope = 0;
    const agregar = i => {
      out.push(red.punto(i));
      ultimo = i;
      cur = red.pos(i);
      return out.length === MAX;
    };
    while (k < lista.length && tope++ < 256) {
      const n = lista[k];
      if (!c.pared(cur, red.pos(n))) {
        prev = n;
        k++;
        continue;
      }
      if (prev === ultimo) {
        if (agregar(n)) break;
        prev = n;
        k++;
        continue;
      }
      if (agregar(prev)) break;
    }
    if (out.length < MAX && prev !== ultimo && c.pared(cur, hasta)) agregar(prev);
    if (out.length < MAX) out.push(meta(hasta)); else out[MAX - 1][5] = ATTR_META;
    return out;
  }
  c.buscarDetalle = function(desde, hasta, red = c.detalle) {
    if (!c.pared(desde, hasta)) return {
      ok: true,
      directo: true,
      tipo: 1,
      puntos: [ meta(hasta) ]
    };
    if (!red || !red.n) return {
      ok: false,
      tipo: 1,
      puntos: [ meta(hasta) ]
    };
    const a = cercanoVisible(red, desde);
    if (a < 0) return {
      ok: false,
      tipo: 1,
      puntos: [ meta(hasta) ]
    };
    const b = cercanoVisible(red, hasta);
    if (b < 0) return {
      ok: false,
      tipo: 1,
      puntos: [ meta(hasta) ]
    };
    const l = astar(red, a, b);
    if (!l) return {
      ok: false,
      tipo: 1,
      puntos: [ meta(hasta) ]
    };
    return {
      ok: true,
      tipo: 1,
      puntos: recortar(red, l, desde, hasta),
      nodos: l
    };
  };
  c.reBuscarDetalle = function(puntos, i, hasta, red = c.detalle) {
    for (let k = i; k < puntos.length; k++) {
      if (!c.pared(puntos[k], hasta)) return {
        ok: true,
        tipo: 1,
        puntos: [ ...puntos.slice(i + 1, k + 1), meta(hasta) ]
      };
    }
    return c.buscarDetalle(puntos[Math.min(i, puntos.length - 1)] || hasta, hasta, red);
  };
  function sinRecortar(red, l, hasta) {
    const out = l.slice(0, MAX).map(i => red.punto(i));
    if (out.length < MAX) out.push(meta(hasta)); else out[MAX - 1][5] = ATTR_META;
    return out;
  }
  c.buscarEtapa = function(desde, hasta, red = c.red) {
    if (!red || !red.n) return {
      ok: false,
      tipo: 0,
      puntos: [ meta(hasta) ]
    };
    const l = astar(red, cercano(red, desde), cercano(red, hasta));
    return l ? {
      ok: true,
      tipo: 0,
      puntos: sinRecortar(red, l, hasta)
    } : {
      ok: false,
      tipo: 0,
      puntos: [ meta(hasta) ]
    };
  };
  c.buscarEtapaPorEscena = function(desde, escDesde, hasta, escHasta, red = c.red) {
    if (!red || !red.n) return {
      ok: false,
      tipo: 0,
      puntos: []
    };
    const a = cercano(red, desde, i => red.enEscena(i, escDesde)), b = cercano(red, hasta, i => red.enEscena(i, escHasta));
    if (a < 0 || b < 0) return {
      ok: false,
      tipo: 0,
      puntos: []
    };
    const l = astar(red, a, b);
    return l ? {
      ok: true,
      tipo: 0,
      puntos: sinRecortar(red, l, red.pos(b))
    } : {
      ok: false,
      tipo: 0,
      puntos: []
    };
  };
  c.cercanoDeEscena = function(pEtapa, escena = c.escena, red = c.red) {
    if (!red) return null;
    const o = c.desplazamiento(escena), loc = [ pEtapa[0] - o[0], pEtapa[1] - o[1], pEtapa[2] - o[2] ];
    let m = null, dm = Infinity;
    for (let i = 0; i < red.n; i++) {
      if (!red.enEscena(i, escena)) continue;
      const v = red.pos(i);
      if (c.pared(loc, [ v[0] - o[0], v[1] - o[1], v[2] - o[2] ])) continue;
      const d = d2(v, pEtapa);
      if (d < dm) {
        dm = d;
        m = red.punto(i);
      }
    }
    return m;
  };
  c.busquedaEnemigo = function() {
    const s = {
      valido: false,
      puntos: [],
      desde: null,
      hasta: null,
      objetivo: null
    };
    s.reiniciar = () => {
      s.valido = false;
    };
    s.buscar = (desde, hasta) => {
      if (s.valido && s.desde && d2(desde, s.desde) < 1e4 && d2(hasta, s.hasta) < 1e4) return true;
      const r = c.buscarDetalle(desde, hasta);
      s.valido = r.ok;
      s.puntos = r.puntos;
      s.desde = [ ...desde ];
      s.hasta = [ ...hasta ];
      return r.ok;
    };
    s.punto = (pos, ancho, rango) => {
      if (!s.valido) return null;
      let t = s.puntos[0];
      if (!c.choca(pos, s.hasta, ancho)) t = meta(s.hasta); else if (s.puntos.length > 1) {
        let p0 = s.puntos[0];
        const p1 = s.puntos[1];
        if (!c.choca(pos, p1, ancho)) {
          if (distSegmento2(pos, p0, p1) < rango * rango) {
            t = p1;
            p0 = p1;
          }
          if (s.puntos.length > 2) {
            const p2 = s.puntos[2];
            const a = norm([ p0[0] - pos[0], p0[1] - pos[1], p0[2] - pos[2] ]), b = norm([ p2[0] - pos[0], p2[1] - pos[1], p2[2] - pos[2] ]);
            if (a[0] * b[0] + a[1] * b[1] + a[2] * b[2] <= .25881904 && !c.choca(pos, p2, ancho)) t = p2;
          }
        }
      }
      s.objetivo = t;
      return t;
    };
    return s;
  };
  let dibujo = null;
  const rutas = new Map;
  const aV = p => [ -p[0] * escala, -p[1] * escala, p[2] * escala ];
  function lineas(segs, color, padre) {
    const g = new THREE.BufferGeometry;
    g.setAttribute("position", new THREE.Float32BufferAttribute(segs, 3));
    const l = new THREE.LineSegments(g, new THREE.LineBasicMaterial({
      color: color,
      depthTest: false,
      transparent: true,
      opacity: .9
    }));
    l.renderOrder = 30;
    padre.add(l);
    return l;
  }
  function puntos(lista, color, tam, padre) {
    const g = new THREE.BufferGeometry;
    g.setAttribute("position", new THREE.Float32BufferAttribute(lista, 3));
    const m = new THREE.Points(g, new THREE.PointsMaterial({
      color: color,
      size: tam,
      sizeAttenuation: true,
      depthTest: false
    }));
    m.renderOrder = 31;
    padre.add(m);
    return m;
  }
  c.dibujar = function(padre) {
    c.borrarDibujo();
    if (!c.ver || !padre) return;
    dibujo = new THREE.Group;
    dibujo.name = "caminos (depuración)";
    padre.add(dibujo);
    const o = c.desplazamiento(c.escena);
    const red = (r, color, local) => {
      if (!r) return;
      const segs = [], pts = [];
      const ve = i => local || r.enEscena(i, c.escena);
      for (let i = 0; i < r.n; i++) {
        const p = local ? r.pos(i) : [ r.p[i * 3] - o[0], r.p[i * 3 + 1] - o[1], r.p[i * 3 + 2] - o[2] ];
        if (ve(i)) pts.push(...aV(p));
        for (const j of r.enl[i]) if (j > i && j < r.n && (ve(i) || ve(j))) {
          const q = local ? r.pos(j) : [ r.p[j * 3] - o[0], r.p[j * 3 + 1] - o[1], r.p[j * 3 + 2] - o[2] ];
          segs.push(...aV(p), ...aV(q));
        }
      }
      if (segs.length) lineas(segs, color, dibujo);
      if (pts.length) puntos(pts, color, .12, dibujo);
    };
    red(c.detalle, 16724016, true);
    red(c.red, 3178751, false);
    if (c.verdes) {
      const pts = [];
      for (let i = 0; i < c.verdes.n; i++) pts.push(...aV(c.verdes.pos(i)));
      puntos(pts, 3211104, .25, dibujo);
    }
  };
  c.borrarDibujo = function() {
    if (dibujo) {
      dibujo.traverse(x => {
        x.geometry?.dispose?.();
        x.material?.dispose?.();
      });
      dibujo.removeFromParent();
      dibujo = null;
    }
    for (const r of rutas.values()) {
      r.geometry.dispose();
      r.material.dispose();
      r.removeFromParent();
    }
    rutas.clear();
  };
  c.ruta = function(clave, desde, lista, color = 16764992) {
    if (!c.ver || !dibujo) return;
    let l = rutas.get(clave);
    const pts = [];
    if (desde) pts.push(...aV([ desde[0], desde[1] - 100, desde[2] ]));
    for (const p of lista || []) pts.push(...aV(p));
    if (!l) {
      l = new THREE.Line(new THREE.BufferGeometry, new THREE.LineBasicMaterial({
        color: color,
        depthTest: false
      }));
      l.renderOrder = 32;
      rutas.set(clave, l);
      dibujo.add(l);
    }
    l.geometry.setAttribute("position", new THREE.Float32BufferAttribute(pts.length >= 6 ? pts : [ 0, 0, 0, 0, 0, 0 ], 3));
    l.geometry.computeBoundingSphere();
    l.visible = pts.length >= 6;
  };
  return c;
}

function norm(v) {
  const L = Math.hypot(v[0], v[1], v[2]) || 1;
  return [ v[0] / L, v[1] / L, v[2] / L ];
}

function distSegmento2(p, a, b) {
  const ab = [ b[0] - a[0], b[1] - a[1], b[2] - a[2] ], ap = [ p[0] - a[0], p[1] - a[1], p[2] - a[2] ];
  const L = ab[0] * ab[0] + ab[1] * ab[1] + ab[2] * ab[2];
  let t = L > 1e-9 ? (ap[0] * ab[0] + ap[1] * ab[1] + ap[2] * ab[2]) / L : 0;
  t = Math.max(0, Math.min(1, t));
  const q = [ a[0] + ab[0] * t - p[0], a[1] + ab[1] * t - p[1], a[2] + ab[2] * t - p[2] ];
  return q[0] * q[0] + q[1] * q[1] + q[2] * q[2];
}

export class TrabajoCamino {
  constructor() {
    this.reiniciar();
  }
  reiniciar() {
    this.puntos = [];
    this.i = 0;
    this.global = false;
    this.valido = false;
    this.actual = null;
    this.meta = null;
    this.inicio = null;
  }
  get n() {
    return this.puntos.length;
  }
  poner(r, global) {
    if (!r.ok) {
      this.puntos = [];
      return false;
    }
    this.puntos = r.puntos;
    this.i = 0;
    this.valido = false;
    this.global = global;
    return true;
  }
  crearDetalle(c, desde, hasta) {
    this.inicio = [ desde[0], desde[1] - 80, desde[2] ];
    this.meta = [ hasta[0], hasta[1] - 80, hasta[2] ];
    return this.poner(c.buscarDetalle(this.inicio, this.meta), false);
  }
  reBuscar(c, hasta) {
    this.meta = [ hasta[0], hasta[1] - 80, hasta[2] ];
    return this.poner(c.reBuscarDetalle(this.puntos, this.i, this.meta), false);
  }
  crearGlobal(c, desde, escDesde, hasta, escHasta) {
    this.inicio = [ ...desde ];
    this.meta = [ ...hasta ];
    return this.poner(c.buscarEtapaPorEscena(desde, escDesde, hasta, escHasta), true);
  }
  punto() {
    if (!this.valido) {
      this.actual = this.puntos[Math.min(this.i, this.n - 1)] || null;
      this.valido = true;
    }
    return this.actual;
  }
  avanzar() {
    if (this.i < this.n - 1) {
      this.i++;
      this.valido = false;
      return true;
    }
    return false;
  }
}

export function buscarCaminoEil(c, t, w, pos, hasta) {
  if (w.estadoCamino === 1 || !t.meta) {
    if (!t.crearDetalle(c, pos, hasta)) return {
      r: -1
    };
    w.estadoCamino = 2;
  }
  if (d2(t.meta, hasta) > 36e4) {
    if (!t.reBuscar(c, hasta)) return {
      r: -1
    };
  }
  let p = t.punto();
  if (!p || c.obstaculo(pos, p)) {
    if (!t.crearDetalle(c, pos, hasta)) return {
      r: -1
    };
    p = t.punto();
  }
  let r = 0;
  if (p && d2xz(pos, p) < 6400) {
    if (!t.avanzar()) r = 1;
  }
  return {
    r: r,
    punto: t.punto()
  };
}
