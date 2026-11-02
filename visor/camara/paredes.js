// SH4 web — FeniXVOID · Project Ravenlight
const CELDA = 400;

const PARED_NY = .3;

export function armarParedes(posiciones, escala, m = null) {
  const tris = [], celdas = new Map;
  const P = i => {
    let x = posiciones[i], y = posiciones[i + 1], z = posiciones[i + 2];
    if (m) {
      const X = m[0] * x + m[4] * y + m[8] * z + m[12], Y = m[1] * x + m[5] * y + m[9] * z + m[13], Z = m[2] * x + m[6] * y + m[10] * z + m[14];
      x = X;
      y = Y;
      z = Z;
    }
    return [ -x / escala, -y / escala, z / escala ];
  };
  for (let i = 0; i + 8 < posiciones.length; i += 9) {
    const a = P(i), b = P(i + 3), c = P(i + 6);
    const u = [ b[0] - a[0], b[1] - a[1], b[2] - a[2] ], w = [ c[0] - a[0], c[1] - a[1], c[2] - a[2] ];
    let n = [ u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0] ];
    const l = Math.hypot(n[0], n[1], n[2]);
    if (!(l > 1e-6)) continue;
    n = [ n[0] / l, n[1] / l, n[2] / l ];
    if (Math.abs(n[1]) >= PARED_NY) continue;
    const t = {
      a: a,
      b: b,
      c: c,
      n: n,
      d: -(n[0] * a[0] + n[1] * a[1] + n[2] * a[2]),
      min: [ Math.min(a[0], b[0], c[0]), Math.min(a[1], b[1], c[1]), Math.min(a[2], b[2], c[2]) ],
      max: [ Math.max(a[0], b[0], c[0]), Math.max(a[1], b[1], c[1]), Math.max(a[2], b[2], c[2]) ]
    };
    const k = tris.push(t) - 1;
    for (let cx = Math.floor(t.min[0] / CELDA); cx <= Math.floor(t.max[0] / CELDA); cx++) for (let cz = Math.floor(t.min[2] / CELDA); cz <= Math.floor(t.max[2] / CELDA); cz++) {
      const key = cx * 65536 + cz;
      let L = celdas.get(key);
      if (!L) celdas.set(key, L = []);
      L.push(k);
    }
  }
  let marca = 1;
  const visto = new Uint32Array(tris.length);
  function buscar(p, r) {
    const out = [];
    marca++;
    for (let cx = Math.floor((p[0] - r) / CELDA); cx <= Math.floor((p[0] + r) / CELDA); cx++) for (let cz = Math.floor((p[2] - r) / CELDA); cz <= Math.floor((p[2] + r) / CELDA); cz++) {
      const L = celdas.get(cx * 65536 + cz);
      if (!L) continue;
      for (const k of L) {
        if (visto[k] === marca) continue;
        visto[k] = marca;
        const t = tris[k];
        if (p[0] < t.min[0] - r || p[0] > t.max[0] + r || p[1] < t.min[1] - r || p[1] > t.max[1] + r || p[2] < t.min[2] - r || p[2] > t.max[2] + r) continue;
        out.push(t);
      }
    }
    return out;
  }
  return {
    tris: tris,
    buscar: buscar
  };
}

export function cercanoTri(p, t) {
  const {a: a, b: b, c: c} = t;
  const ab = [ b[0] - a[0], b[1] - a[1], b[2] - a[2] ], ac = [ c[0] - a[0], c[1] - a[1], c[2] - a[2] ], ap = [ p[0] - a[0], p[1] - a[1], p[2] - a[2] ];
  const dot = (x, y) => x[0] * y[0] + x[1] * y[1] + x[2] * y[2];
  const d1 = dot(ab, ap), d2 = dot(ac, ap);
  if (d1 <= 0 && d2 <= 0) return a.slice();
  const bp = [ p[0] - b[0], p[1] - b[1], p[2] - b[2] ], d3 = dot(ab, bp), d4 = dot(ac, bp);
  if (d3 >= 0 && d4 <= d3) return b.slice();
  const vc = d1 * d4 - d3 * d2;
  if (vc <= 0 && d1 >= 0 && d3 <= 0) {
    const v = d1 / (d1 - d3);
    return [ a[0] + ab[0] * v, a[1] + ab[1] * v, a[2] + ab[2] * v ];
  }
  const cp = [ p[0] - c[0], p[1] - c[1], p[2] - c[2] ], d5 = dot(ab, cp), d6 = dot(ac, cp);
  if (d6 >= 0 && d5 <= d6) return c.slice();
  const vb = d5 * d2 - d1 * d6;
  if (vb <= 0 && d2 >= 0 && d6 <= 0) {
    const w = d2 / (d2 - d6);
    return [ a[0] + ac[0] * w, a[1] + ac[1] * w, a[2] + ac[2] * w ];
  }
  const va = d3 * d6 - d5 * d4;
  if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) {
    const w = (d4 - d3) / (d4 - d3 + (d5 - d6));
    return [ b[0] + (c[0] - b[0]) * w, b[1] + (c[1] - b[1]) * w, b[2] + (c[2] - b[2]) * w ];
  }
  const den = 1 / (va + vb + vc), v = vb * den, w = vc * den;
  return [ a[0] + ab[0] * v + ac[0] * w, a[1] + ab[1] * v + ac[1] * w, a[2] + ab[2] * v + ac[2] * w ];
}

function huella(t) {
  if (t.h) return t.h;
  let nx = t.n[0], nz = t.n[2];
  const l = Math.hypot(nx, nz) || 1;
  nx /= l;
  nz /= l;
  const tx = -nz, tz = nx, ts = [ t.a, t.b, t.c ].map(v => v[0] * tx + v[2] * tz);
  t.h = {
    nx: nx,
    nz: nz,
    d: -(nx * t.a[0] + nz * t.a[2]),
    tx: tx,
    tz: tz,
    t0: Math.min(...ts),
    t1: Math.max(...ts)
  };
  return t.h;
}

export function deslizar(s, p, R, tris) {
  p = p.slice();
  const cerca = tris.filter(t => {
    const h = huella(t);
    return h.nx * s[0] + h.nz * s[2] + h.d >= 0;
  });
  for (let vuelta = 0; vuelta < 4; vuelta++) {
    let movido = false;
    for (const t of cerca) {
      const h = t.h, dp = h.nx * p[0] + h.nz * p[2] + h.d;
      if (dp >= R) continue;
      const q = cercanoTri(p, t);
      if (Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]) >= R) continue;
      const u = h.tx * p[0] + h.tz * p[2];
      if (u >= h.t0 && u <= h.t1) {
        const k = R - dp;
        p[0] += h.nx * k;
        p[2] += h.nz * k;
        movido = true;
        continue;
      }
      if (dp <= 0) continue;
      const ue = u < h.t0 ? h.t0 : h.t1, ex = h.tx * ue - h.nx * h.d, ez = h.tz * ue - h.nz * h.d;
      const vx = p[0] - ex, vz = p[2] - ez, l = Math.hypot(vx, vz);
      if (l < R && l > 1e-6) {
        const k = (R - l) / l;
        p[0] += vx * k;
        p[2] += vz * k;
        movido = true;
      }
    }
    if (!movido) break;
  }
  return p;
}

export function distanciaPared(p, r, buscar) {
  let m = Infinity;
  for (const t of buscar(p, r)) {
    const dp = t.n[0] * p[0] + t.n[1] * p[1] + t.n[2] * p[2] + t.d;
    if (dp < -1) continue;
    const q = cercanoTri(p, t);
    m = Math.min(m, Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]));
  }
  return m;
}
