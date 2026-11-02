// SH4 web — FeniXVOID · Project Ravenlight
import { deslizar } from "./paredes.js";

export const PI = Math.PI;

export const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));

export const v3 = (x = 0, y = 0, z = 0) => [ x, y, z ];

export const sum = (a, b) => [ a[0] + b[0], a[1] + b[1], a[2] + b[2] ];

export const res = (a, b) => [ a[0] - b[0], a[1] - b[1], a[2] - b[2] ];

export const esc = (a, k) => [ a[0] * k, a[1] * k, a[2] * k ];

export const pp = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

export const cruz = (a, b) => [ a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0] ];

export const largo = a => Math.hypot(a[0], a[1], a[2]);

export const largoXZ = a => Math.hypot(a[0], a[2]);

export const norm = a => {
  const l = largo(a);
  return l > 0 ? esc(a, 1 / l) : [ 0, 0, 0 ];
};

export const anguloXZ = d => Math.atan2(d[0], d[2]);

export function areaCercana(p, p0, p1, radio, cilindro) {
  const ej = res(p1, p0), l2 = pp(ej, ej);
  let t = l2 > 0 ? pp(res(p, p0), ej) / l2 : 0, parte = 2;
  if (t <= 0) {
    t = 0;
    parte = 0;
  } else if (t >= 1) {
    t = 1;
    parte = 1;
  }
  const n = sum(p0, esc(ej, t)), d = largo(res(p, n));
  let dir = norm(ej);
  if (largo(dir) === 0) dir = [ 0, 1, 0 ];
  if (cilindro && parte !== 2) {
    const r = radio > 0 ? radio : .2, w = res(p, n);
    let lat = res(w, esc(dir, pp(w, dir)));
    const ll = largo(lat);
    if (ll > r) lat = esc(lat, r / ll);
    const q = sum(n, lat);
    return {
      dist: largo(res(p, q)),
      pos: q
    };
  }
  let q = p.slice();
  if (radio < d) q = sum(p, esc(norm(res(n, p)), d - radio));
  let dist = d - radio;
  if (cilindro && dist < 0) {
    const m = Math.min(pp(res(p, p0), dir), pp(res(p1, p), dir));
    if (!(-dist < m)) dist = -m;
  }
  return {
    dist: dist,
    pos: q
  };
}

export function baseVista(pitch, yaw) {
  const Z = [ Math.sin(yaw) * Math.cos(pitch), -Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch) ];
  const X = norm([ Z[2], 0, -Z[0] ]);
  const Y = cruz(Z, X);
  return {
    X: X,
    Y: Y,
    Z: Z
  };
}

function limitarVista(v, minX, maxX, minY, maxY, rateX, rateY, B) {
  if (rateX > 1) rateX = 1;
  const l = [ pp(v, B.X), pp(v, B.Y), pp(v, B.Z) ];
  const h = Math.hypot(l[0], l[2]);
  let p, y;
  if (h === 0) {
    p = l[1] <= 0 ? PI / 2 : -PI / 2;
    y = 0;
  } else {
    p = Math.atan2(-l[1], h);
    y = Math.atan2(l[0], l[2]);
  }
  p = Math.max(-PI / 2, Math.min(PI / 2, p));
  if (rateX !== 1) p = wrap(p) * rateX;
  if (rateY !== 1) y = wrap(y) * rateY;
  p = Math.max(minX, Math.min(maxX, p));
  y = Math.max(minY, Math.min(maxY, y));
  const q = [ Math.sin(y) * Math.cos(p), -Math.sin(p), Math.cos(y) * Math.cos(p) ];
  return sum(sum(esc(B.X, q[0]), esc(B.Y, q[1])), esc(B.Z, q[2]));
}

export class MotorCamara {
  constructor() {
    this.iniciarEtapa();
  }
  iniciarEtapa() {
    this.tgt = v3();
    this.tgtReal = v3();
    this.pos = v3();
    this.spd = v3();
    this.watch = v3(0, 0, 1);
    this.vista = v3(0, 0, 1);
    this.omega = v3();
    this.angulo = 1.0996;
    this.maxSpd = 2e3;
    this.accel = 1200;
    this.ajuste = null;
    this.hitRadio = 0;
    this.techoKeep = -2e4;
    this.pisoKeep = -2e4;
    this.orgX = 0;
    this.orgY = 0;
    this.anchoX = 16 * PI;
    this.anchoY = 16 * PI;
    this.rateX = 1;
    this.rateY = 1;
  }
  setCameraPosition(p, continuar) {
    this.tgt = p.slice();
    if (!continuar) {
      this.tgtReal = p.slice();
      this.pos = p.slice();
      this.spd = v3();
      this.omega = v3();
    }
  }
  setWatchPosition(p, continuar) {
    this.watch = p.slice();
    if (!continuar) {
      const d = norm(res(p, this.pos));
      if (largo(d) > 0) this.vista = d;
      this.omega = v3();
    }
  }
  paso(dt, entorno) {
    const dw = res(this.watch, this.pos), pitch = Math.atan2(-dw[1], largoXZ(dw));
    let base = 0;
    if (this.orgX * pitch >= 0 && Math.abs(pitch) >= Math.abs(this.orgX * .25)) {
      base = Math.abs(pitch) > Math.abs(this.orgX) ? this.orgX : (pitch - this.orgX * .25) * 1.3333333;
    }
    base = Math.min(this.orgX + this.anchoX * .5, Math.max(this.orgX - this.anchoX * .5, base));
    const B = baseVista(base, this.orgY);
    let mov = res(this.tgt, this.tgtReal);
    const lm = largo(mov), tope = this.maxSpd * .9 * dt;
    if (lm > tope) mov = lm > 0 ? esc(mov, tope / lm) : v3();
    if (this.ajuste) mov = this.ajuste(mov, this.tgtReal, dt * this.maxSpd);
    if (this.hitRadio > 0 && entorno?.rayo) mov = this.obstaculos(mov, entorno, dt);
    this.tgtReal = sum(this.tgtReal, mov);
    this.suavizarCamara(dt, this.maxSpd, this.accel, this.accel * 1.6, 15);
    this.suavizarVista(dt, 9.424778, 8.726646, .5);
    this.vista = norm(limitarVista(this.vista, -this.anchoX * .5, this.anchoX * .5, -this.anchoY * .5, this.anchoY * .5, this.rateX, this.rateY, B));
    return {
      pos: this.pos,
      vista: this.vista,
      angulo: this.angulo
    };
  }
  obstaculos(mov, ent, dt = 1 / 30) {
    let p = sum(this.tgtReal, mov);
    if (ent.paredes) {
      const r = this.hitRadio * 1.5 + Math.max(largo(mov), dt * 400);
      p = deslizar(this.tgtReal, p, this.hitRadio, ent.paredes(this.tgtReal, r));
    }
    if (this.techoKeep > -1e4 || this.pisoKeep > -1e4) {
      const piso = ent.rayo(p, [ 0, 1, 0 ], 4e3), techo = ent.rayo(p, [ 0, -1, 0 ], 4e3);
      if (techo != null && this.techoKeep > -1e4 && p[1] < p[1] - techo + this.techoKeep) p[1] = p[1] - techo + this.techoKeep;
      if (piso != null && this.pisoKeep > -1e4) {
        const yp = p[1] + piso;
        if (p[1] > yp - this.pisoKeep) p[1] = yp - this.pisoKeep;
      }
    }
    return res(p, this.tgtReal);
  }
  suavizarCamara(dt, maxSpd, accel, maxAccl, arrastre) {
    if (maxSpd < 0) maxSpd = 2e3;
    if (!(accel > 0)) {
      accel = 20;
      maxAccl = 20;
    }
    if (dt === 0) return;
    if (maxAccl < accel) maxAccl = accel;
    if (!(maxSpd > 0)) {
      this.spd = v3();
      return;
    }
    const d = res(this.tgtReal, this.pos), dist = largo(d), rap = largo(this.spd);
    if (dist < 6 && rap < 2) {
      this.spd = v3();
      return;
    }
    const u = dist > 0 ? esc(d, 1 / dist) : v3();
    const fwd = pp(this.spd, u), latV = res(this.spd, esc(u, fwd)), lat = largo(latV), latU = lat > 0 ? esc(latV, 1 / lat) : v3();
    const lim = Math.min(Math.sqrt(2 * dist * accel), maxSpd);
    let aF = dt * accel, aL = -(lat * dt * arrastre);
    if (fwd > 0) {
      const m = Math.hypot(fwd + aF, lat + aL);
      if (lim < m) aF = lim - m;
    }
    const ma = Math.hypot(aF, aL);
    if (dt * maxAccl < ma) {
      const k = dt * maxAccl / ma;
      aF *= k;
      aL *= k;
    }
    this.spd = sum(sum(this.spd, esc(u, aF)), esc(latU, aL));
    this.pos = sum(this.pos, esc(this.spd, dt));
  }
  suavizarVista(dt, maxOmega, rotAccl, arrastre) {
    const v = this.vista, d = norm(res(this.watch, this.pos));
    if (largo(d) === 0) return;
    let eje = norm(cruz(v, d));
    const w = this.omega, wPar = pp(w, eje), wPerpV = res(w, esc(eje, wPar)), wPerp = largo(wPerpV);
    const wPerpU = wPerp > 0 ? esc(wPerpV, 1 / wPerp) : v3();
    let wMax = maxOmega;
    if (pp(v, d) > 0) {
      const s = largo(cruz(v, d));
      if (s * maxOmega < maxOmega) wMax = s * maxOmega;
    }
    const a = dt * rotAccl;
    let m = wPerp - wPerp * dt * arrastre, r = a > 0 ? m / a : 0;
    if (r <= .7071068) m = 0; else {
      m -= a * .7071068;
      r = .7071068;
    }
    const raiz = Math.sqrt(Math.max(0, 1 - r * r));
    let nw = sum(esc(wPerpU, m), esc(eje, raiz * a + wPar));
    const ln = largo(nw);
    if (wMax < ln) nw = esc(nw, wMax / ln);
    this.omega = nw;
    this.vista = norm(sum(v, esc(cruz(nw, v), dt)));
  }
}
