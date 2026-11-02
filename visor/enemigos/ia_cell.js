// SH4 web — FeniXVOID · Project Ravenlight
import { DT, envolver, dist3, azar, azar01 } from "./comun.js";

export const P = {
  INIT: 0,
  VAGA: 1,
  SE_ACERCA: 2,
  VA_A_WALTER: 3
};

export const NOMBRE_PASO = [ "Init", "Wander", "Approach", "ApproachKiller" ];

const C = {
  NORMAL: 1,
  CHASE: 3,
  DEAD: 11
};

const KIND_KILLER = 16;

export const ESQUELETO = {
  dist: [ -12.324028, 14.263286, 13.211078, 14 ],
  dist2: [ -123.24028, 142.63286, 132.11078, 140 ],
  limite: [ 1.0471976, 1.0471976, 1.0471976, 1.0471976 ]
};

export const LIMITES_CELL = {
  sb01: [ [ [ -4400, -480, 590 ], [ -3080, -70, 600 ] ], [ [ -7620, -480, -690 ], [ -7250, -70, -680 ] ], [ [ -7500, -480, 590 ], [ -7080, -70, 600 ] ], [ [ -10300, -480, 590 ], [ -9800, -70, 600 ] ], [ [ -1100, -480, -690 ], [ -30, -70, -680 ] ] ],
  mz05: [ [ -650, -700, -400 ], [ -550, -50, -70 ] ],
  mz09: [ [ 1100, -700, 0 ], [ 1500, -50, 1e3 ] ],
  mz16: [ [ -900, -700, -900 ], [ -500, -50, -500 ] ],
  mz18: [ [ 1e3, -700, -1e3 ], [ 1450, -50, -200 ] ],
  mz20: [ [ 150, -700, 1050 ], [ 1e3, -50, 1450 ] ],
  mz25: [ [ -1450, -700, -950 ], [ -1100, -50, -50 ] ],
  mz30: [ [ [ 500, -700, 500 ], [ 950, -50, 950 ] ], [ [ 0, -700, 700 ], [ 0, -50, 1350 ] ] ]
};

export const TEXTURA_CELL = {
  ancho: 512,
  alto: 256,
  cuadroAncho: 64,
  cuadroAlto: 32,
  columnas: 8,
  cuadros: 64,
  cada: .05
};

export function cuadroTextura(cuenta) {
  const f = (cuenta % 64 + 64) % 64, vuelta = Math.floor(cuenta / 64) & 1;
  const k = vuelta ? 63 - f : f;
  const u = k % 8, v = Math.floor(k / 8);
  return {
    k: k,
    u0: u * 64,
    v0: v * 32,
    u1: u * 64 + 64,
    v1: v * 32 + 32
  };
}

export const VELOCIDAD_CELL = {
  maestro: null,
  s: [ 1, 0 ],
  marca: 0
};

function ruido(p1, p2) {
  if (p1 < 0 && azar(32768) & 8192) p1 = -p1;
  return ((p2 + 1) * p2 / (azar01() + p2) - p2) * p1;
}

export function resorte(s, k, obj, a, b, rig, am) {
  const v = (ruido(-a, b) + s[k + 1] - (s[k] - obj) * rig) * am;
  s[k + 1] = v;
  s[k] += v;
}

export function acercarAngulo(act, obj, paso) {
  const d = envolver(obj - act);
  if (d < -paso) return envolver(act - paso);
  if (d > paso) return envolver(act + paso);
  return envolver(obj);
}

const suma = (a, b) => [ a[0] + b[0], a[1] + b[1], a[2] + b[2] ];

const resta = (a, b) => [ a[0] - b[0], a[1] - b[1], a[2] - b[2] ];

const por = (a, k) => [ a[0] * k, a[1] * k, a[2] * k ];

const pp = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

const cruz = (a, b) => [ a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0] ];

const largo = a => Math.hypot(a[0], a[1], a[2]);

const unir = a => {
  const l = largo(a);
  return l > 1e-9 ? por(a, 1 / l) : null;
};

const enPlano = (v, n) => resta(v, por(n, pp(v, n)));

const NORMAL_INI = {
  16: [ 0, -1, 0 ],
  32: [ 0, 0, 1 ],
  48: [ 1, 0, 0 ],
  64: [ 0, 0, -1 ],
  80: [ -1, 0, 0 ],
  96: [ 0, 1, 0 ]
};

export class Cell {
  constructor(def, pj, anim, m, op = {}) {
    this.tipo = "CELL";
    this.def = def;
    this.pj = pj;
    this.anim = anim;
    this.m = m;
    this.ini = def.ini ?? 0;
    this.tipoCell = this.ini >> 8 & 15;
    this.modo = this.ini >> 12 & 15;
    this.param = m.parametros("CELL", 0);
    this.hp = this.hpMax = this.param.vida;
    this.sala = op.sala || def.sala || null;
    this.sup = op.sup || null;
    this.pos = [ ...def.pos ];
    this.posAnt = [ ...this.pos ];
    this.radio = 24;
    this.alto = 25;
    this.centroAlto = 12;
    this.modoCl = 2;
    if (this.tipoCell === 2) {
      this.modoCl = 6;
      this.radio = 240;
      this.alto = 241;
    }
    this.sinPasos = true;
    this.sinSangre = true;
    this.visible = true;
    this.cond = C.NORMAL;
    this.paso = P.INIT;
    this.sub = 0;
    this.golpes = [];
    this.w = {
      giro: [ 0, 0 ],
      vel: [ 0, 0 ],
      visc: 0,
      cuentaTex: 0,
      cuentaTex2: 0,
      choco: 0,
      enSuperficie: true
    };
    this.orientar(def.rumbo || 0);
    this.b = [ 0, 1, 2, 3 ].map(() => [ ...this.pos ]);
    this.bAnt = this.b.map(p => [ ...p ]);
    if (!VELOCIDAD_CELL.maestro || this.maestroMuerto()) this.hacerseMaestro();
    this.relojVisto = VELOCIDAD_CELL.marca;
    this.sinVer = 0;
    this.rot = Math.atan2(this.f[0], this.f[2]);
    this.rotAnt = this.rot;
  }
  hacerseMaestro() {
    VELOCIDAD_CELL.maestro = this;
    VELOCIDAD_CELL.s = [ 1, 0 ];
  }
  maestroMuerto() {
    return VELOCIDAD_CELL.maestro?.destruido;
  }
  destruir() {
    this.destruido = true;
    if (VELOCIDAD_CELL.maestro === this) VELOCIDAD_CELL.maestro = null;
  }
  caido() {
    return false;
  }
  persigue() {
    return false;
  }
  intocable() {
    return true;
  }
  recibir() {}
  pasoA(n) {
    this.paso = n;
    this.sub = 0;
  }
  jug() {
    return this.m.jugador();
  }
  get x() {
    return cruz(por(this.n, -1), this.f);
  }
  orientar(rumbo) {
    const t = this.ini & 240;
    let n = NORMAL_INI[t] || [ 0, -1, 0 ];
    this.w.orientado = false;
    if (this.sup) {
      if (t >= 32 && t <= 80) {
        let mejor = null;
        for (let i = 0; i < 16; i++) {
          const a = i / 16 * Math.PI * 2, d = [ Math.sin(a), 0, Math.cos(a) ];
          const h = this.sup.rayo(this.pos, d, 300);
          if (h && Math.abs(h.n[1]) < .5) {
            const L = largo(resta(h.p, this.pos));
            if (!mejor || L < mejor.L) mejor = {
              ...h,
              L: L
            };
          }
        }
        if (mejor) {
          n = mejor.n;
          this.pos = suma(mejor.p, por(n, .5));
          this.w.orientado = true;
        }
      } else {
        const h = this.sup.rayo(suma(this.pos, por(n, 40)), por(n, -1), 400);
        if (h) {
          n = h.n;
          this.pos = suma(h.p, por(n, .5));
          this.w.orientado = true;
        }
      }
    }
    this.n = unir(n);
    let f = unir(enPlano([ Math.sin(rumbo), 0, Math.cos(rumbo) ], this.n));
    if (!f) f = unir(enPlano([ 0, -1, 0 ], this.n)) || [ 0, 0, 1 ];
    this.f = f;
  }
  girar(a) {
    if (!a) return;
    const c = Math.cos(a), s = Math.sin(a);
    this.f = unir(suma(por(this.f, c), por(this.x, s))) || this.f;
  }
  angulo(v) {
    return Math.atan2(pp(v, this.x), pp(v, this.f));
  }
  tick() {
    if (this.sup && !this.w.orientado && (this.w.intentos = (this.w.intentos || 0) + 1) <= 30) {
      this.pos = [ ...this.def.pos ];
      this.orientar(this.def.rumbo || 0);
      if (this.w.orientado) {
        this.b = [ 0, 1, 2, 3 ].map(() => [ ...this.pos ]);
        this.posAnt = [ ...this.pos ];
      } else if (this.w.intentos === 30) this.sup = null;
    }
    this.posAnt = [ ...this.pos ];
    this.rotAnt = this.rot;
    this.bAnt = this.b.map(p => [ ...p ]);
    this.mov = [ 0, 0, 0 ];
    if (this.cond !== C.DEAD) {
      this.control();
      this.limitar();
      this.esqueleto();
      this.moverPorSuperficie();
      const w = this.w;
      w.cuentaTex2 += DT;
      if (w.cuentaTex2 >= TEXTURA_CELL.cada) {
        w.cuentaTex++;
        w.cuentaTex2 -= TEXTURA_CELL.cada;
      }
    }
    this.vigilarMaestro();
    if (VELOCIDAD_CELL.maestro === this) {
      const g = VELOCIDAD_CELL.s;
      resorte(g, 0, 1, .05, .01, .001, .999);
      g[0] = Math.max(.1, Math.min(3, g[0]));
      VELOCIDAD_CELL.marca++;
    }
    this.rot = Math.atan2(this.f[0], this.f[2]);
    this.anim?.avanzar?.();
  }
  vigilarMaestro() {
    const V = VELOCIDAD_CELL;
    if (V.maestro === this) return;
    if (V.marca !== this.relojVisto) {
      this.relojVisto = V.marca;
      this.sinVer = 0;
      return;
    }
    if (++this.sinVer > 3 || !V.maestro || V.maestro.destruido) this.hacerseMaestro();
  }
  control() {
    switch (this.paso) {
     case P.INIT:
      this.pasoA(P.VAGA);
      this.w.giro = [ 0, 0 ];
      this.w.vel = [ 0, 0 ];
      break;

     case P.VAGA:
      this.vaga();
      break;

     case P.SE_ACERCA:
     case P.VA_A_WALTER:
      this.seAcerca();
      break;
    }
  }
  vaga() {
    const w = this.w;
    if (this.sub === 0) {
      this.cond = C.NORMAL;
      this.sub = 1;
    }
    if (this.sub === 2) {
      w.vel[0] -= DT;
      if (w.vel[0] < 0) {
        w.giro = [ 0, 0 ];
        w.vel = [ 0, 0 ];
        this.sub = 1;
      }
    } else if (azar01() < .002) {
      w.vel[0] = azar01() * 2 + 1;
      this.sub = 2;
    }
    if (!w.choco) {
      if (this.tipoCell === 2) resorte(w.giro, 0, 0, .017453, .0017453, .05, .95); else resorte(w.giro, 0, 0, .087266, .087266, .1, .9);
    } else if (Math.abs(w.giro[0]) < .08726647) {
      w.giro[0] = w.giro[0] >= 0 ? .08726647 : -.08726647;
    }
    this.avanzar();
    const j = this.jug();
    if (j.existe !== false && dist3(j.pos, this.pos) < 1e3) {
      this.pasoA(P.SE_ACERCA);
      return;
    }
    const k = this.m.buscarEnemigo?.(KIND_KILLER) || this.m.walter?.() || null;
    if (k?.pos && dist3(k.pos, this.pos) < 1e3) this.pasoA(P.VA_A_WALTER);
  }
  seAcerca() {
    const w = this.w;
    let obj;
    if (this.paso === P.SE_ACERCA) obj = this.jug().pos; else {
      const k = this.m.buscarEnemigo?.(KIND_KILLER) || this.m.walter?.() || null;
      if (!k?.pos) {
        this.pasoA(P.VAGA);
        return;
      }
      obj = k.pos;
    }
    if (this.sub === 0) {
      this.cond = C.CHASE;
      this.sub = 1;
    }
    const a = this.angulo(resta(obj, this.pos));
    w.giro[0] = acercarAngulo(w.giro[0], a, DT * 1.5707964);
    resorte(w.giro, 0, 0, .087266, .087266, .1, .9);
    this.avanzar();
    if (dist3(obj, this.pos) > 1600) this.pasoA(P.VAGA);
  }
  avanzar() {
    const w = this.w, ahora = VELOCIDAD_CELL.s[0];
    this.girar(Math.min(1, ahora) * w.giro[0]);
    const vObj = this.param.velocidad * ahora;
    resorte(w.vel, 0, vObj, vObj * .3, vObj * .2, .1, .9);
    w.vel[0] = Math.max(w.vel[0], vObj * .1);
    w.visc = w.vel[0] > vObj ? Math.min(.7, w.visc + .05) : Math.max(0, w.visc - .05);
    this.mov = por(this.f, w.vel[0] * DT);
  }
  caja() {
    if (this.tipoCell === 2 || !this.sala) return null;
    const L = LIMITES_CELL[this.sala];
    if (!L) return null;
    if (this.sala === "sb01") return this.modo < 5 ? L[this.modo] : null;
    if (this.sala === "mz30") return L[this.modo === 0 ? 0 : 1];
    return L;
  }
  limitar() {
    const c = this.caja();
    this.w.limitado = 0;
    if (!c) return;
    for (let i = 0; i < 3; i++) {
      const nuevo = this.pos[i] + this.mov[i];
      if (nuevo < c[0][i]) {
        this.mov[i] = c[0][i] - this.pos[i];
        this.w.limitado = 1;
      } else if (nuevo > c[1][i]) {
        this.mov[i] = c[1][i] - this.pos[i];
        this.w.limitado = 1;
      }
    }
  }
  esqueleto() {
    if (this.tipoCell === 1) return;
    const dist = this.tipoCell === 2 ? ESQUELETO.dist2 : ESQUELETO.dist, lim = ESQUELETO.limite;
    const X = this.x, visc = this.w.visc;
    let ant = this.pos, angAnt = 0;
    for (let i = 0; i < 4; i++) {
      let ang = 0;
      if (i > 0) {
        const v = resta(ant, this.b[i]);
        let a = envolver(Math.atan2(pp(v, X), pp(v, this.f)) - angAnt);
        a = Math.max(-lim[i], Math.min(lim[i], a));
        ang = envolver(a + angAnt);
      }
      const dir = suma(por(X, Math.sin(ang)), por(this.f, Math.cos(ang)));
      const t = resta(ant, por(dir, dist[i]));
      const b = this.b[i];
      for (let k = 0; k < 3; k++) b[k] = (b[k] - t[k]) * visc + t[k];
      ant = b;
      angAnt = ang;
    }
  }
  moverPorSuperficie() {
    const w = this.w, mov = this.mov, L = largo(mov);
    w.choco = w.limitado ? 1 : 0;
    if (!this.sup) {
      this.pos = suma(this.pos, enPlano(mov, this.n));
      w.enSuperficie = true;
      return;
    }
    if (L < 1e-6) return;
    const d = por(mov, 1 / L), lev = 6;
    const h = this.sup.rayo(suma(this.pos, por(this.n, lev)), d, L + this.radio * .5);
    if (h && pp(h.n, this.n) < .7) {
      const nViejo = this.n;
      this.n = h.n;
      this.pos = suma(h.p, por(h.n, .5));
      this.f = unir(enPlano(nViejo, this.n)) || unir(enPlano(this.f, this.n)) || this.f;
      w.enSuperficie = true;
      return;
    }
    const nueva = suma(this.pos, mov);
    const g = this.sup.rayo(suma(nueva, por(this.n, 20)), por(this.n, -1), 40);
    if (g && pp(g.n, this.n) > .2) {
      this.pos = suma(g.p, por(g.n, .5));
      this.n = g.n;
      this.f = unir(enPlano(this.f, this.n)) || this.f;
      w.enSuperficie = true;
      return;
    }
    const e = this.sup.rayo(suma(nueva, por(this.n, -10)), por(d, -1), 40);
    if (e && pp(e.n, d) > .5) {
      const nViejo = this.n;
      this.n = e.n;
      this.pos = suma(e.p, por(e.n, .5));
      this.f = unir(enPlano(por(nViejo, -1), this.n)) || this.f;
      w.enSuperficie = true;
      return;
    }
    w.choco = 1;
  }
  separacion() {
    if (this.tipoCell > 1) return 4;
    const s = String(this.sala || "");
    if (s.startsWith("sb")) return 10;
    if (s.startsWith("mz") && [ 9, 18, 20, 25 ].includes(parseInt(s.slice(2), 10))) return 10;
    return 4;
  }
  puntosTira(alfa = 1) {
    const mez = (a, b) => [ a[0] + (b[0] - a[0]) * alfa, a[1] + (b[1] - a[1]) * alfa, a[2] + (b[2] - a[2]) * alfa ];
    const pos = mez(this.posAnt, this.pos), bs = this.b.map((b, i) => mez(this.bAnt[i], b));
    const cab = suma(pos, por(this.f, this.tipoCell === 2 ? 300 : 30));
    const pts = [ cab ];
    let ant = cab;
    for (const b of bs) {
      pts.push(por(suma(ant, b), .5), b);
      ant = b;
    }
    return pts;
  }
}

export function leerTexturasCell(buf, ofs, len) {
  const dv = new DataView(buf, ofs, len), n = dv.getUint32(0, true), res = [];
  for (let i = 0; i < n && i < 16; i++) {
    const e = dv.getUint32(16 + 4 * i, true), h = e + dv.getUint32(e + 12, true);
    const ancho = dv.getUint32(h + 32, true), alto = dv.getUint32(h + 36, true), formato = dv.getUint32(h + 40, true);
    const lg = dv.getUint32(h + 48, true), od = dv.getUint32(h + 80, true);
    if (formato !== 21 || h + od + lg > len) {
      res.push(null);
      continue;
    }
    const src = new Uint8Array(buf, ofs + h + od, lg), rgba = new Uint8Array(lg);
    for (let k = 0; k < lg; k += 4) {
      rgba[k] = src[k + 2];
      rgba[k + 1] = src[k + 1];
      rgba[k + 2] = src[k];
      rgba[k + 3] = src[k + 3];
    }
    res.push({
      ancho: ancho,
      alto: alto,
      rgba: rgba
    });
  }
  return res;
}

export function crearSuperficie(THREE, getColision, escala) {
  const rayo = new THREE.Raycaster, o = new THREE.Vector3, d = new THREE.Vector3, nw = new THREE.Vector3;
  return {
    rayo(p, dir, lg) {
      const col = getColision?.();
      if (!col) return null;
      o.set(-p[0] * escala, -p[1] * escala, p[2] * escala);
      d.set(-dir[0], -dir[1], dir[2]).normalize();
      rayo.set(o, d);
      rayo.far = lg * escala;
      const h = rayo.intersectObject(col, true)[0];
      if (!h || !h.face) return null;
      nw.copy(h.face.normal).transformDirection(h.object.matrixWorld);
      let n = [ -nw.x, -nw.y, nw.z ];
      if (pp(n, dir) > 0) n = por(n, -1);
      return {
        p: [ -h.point.x / escala, -h.point.y / escala, h.point.z / escala ],
        n: n
      };
    }
  };
}

const cacheTex = new WeakMap;

export async function crearCell(def, {THREE: THREE, m: m, bin: bin, escala: escala = .005, grupo: grupo, getColision: getColision, sala: sala} = {}) {
  const b = await bin("enemy_cell.bin");
  let tex = cacheTex.get(b);
  if (!tex) {
    const pt = b.texs?.[0] || b.p?.find(x => x.tipo === "texturas");
    const t = pt ? leerTexturasCell(b.b, pt.ofs, pt.len)[0] : null;
    tex = t ? new THREE.DataTexture(t.rgba, t.ancho, t.alto, THREE.RGBAFormat) : null;
    if (tex) {
      tex.magFilter = THREE.LinearFilter;
      tex.minFilter = THREE.LinearFilter;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.needsUpdate = true;
      cacheTex.set(b, tex);
    }
  }
  const sup = getColision ? crearSuperficie(THREE, getColision, escala) : null;
  const tipoCell = (def.ini ?? 0) >> 8 & 15;
  const mat = new THREE.MeshLambertMaterial({
    map: tex,
    emissiveMap: tex,
    emissive: 4210752,
    transparent: true,
    opacity: tipoCell === 2 ? .2 : .8,
    alphaTest: .02,
    depthWrite: false,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -4
  });
  const nP = tipoCell === 1 ? 2 : 9;
  const geo = new THREE.BufferGeometry;
  const posA = new THREE.BufferAttribute(new Float32Array(nP * 2 * 3), 3), uvA = new THREE.BufferAttribute(new Float32Array(nP * 2 * 2), 2);
  const idx = [];
  for (let i = 0; i < nP - 1; i++) {
    const a = i * 2;
    idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  geo.setAttribute("position", posA);
  geo.setAttribute("uv", uvA);
  geo.setIndex(idx);
  const malla = new THREE.Mesh(geo, mat);
  malla.frustumCulled = false;
  malla.name = "cuerpo";
  const g = new THREE.Group;
  g.name = `CELL ${def.indice}`;
  g.add(malla);
  const pj = {
    grupo: g,
    dispose() {
      geo.dispose();
      mat.dispose();
      e.destruir();
    }
  };
  const anim = {
    get nombre() {
      return "textura";
    },
    get cuadro() {
      return cuadroTextura(e.w.cuentaTex).k;
    },
    avanzar() {}
  };
  const e = new Cell(def, pj, anim, m, {
    sala: sala || def.sala,
    sup: sup
  });
  e.id = `${def.enemigo}_${def.indice}`;
  const aV = p => [ -p[0] * escala, -p[1] * escala, p[2] * escala ];
  e.dibujar = (alfa = 1) => {
    const pts = tipoCell === 1 ? null : e.puntosTira(alfa);
    const pos = e.posAnt.map((v, i) => v + (e.pos[i] - v) * alfa);
    const c = aV(pos);
    g.position.set(c[0], c[1], c[2]);
    const cam = m.posCamara?.();
    g.visible = e.visible && e.w.enSuperficie && (!cam || pp(resta(cam, pos), e.n) > 0);
    if (!g.visible) return;
    const sep = e.separacion(), n = e.n, ancho = (tipoCell === 2 ? 240 : 24) / 2;
    const q = cuadroTextura(e.w.cuentaTex), T = TEXTURA_CELL;
    const u0 = q.u0 / T.ancho, u1 = q.u1 / T.ancho, v0 = q.v0 / T.alto, v1 = q.v1 / T.alto;
    const P = posA.array, U = uvA.array;
    const poner = (i, p, lado, u) => {
      for (const s of [ 0, 1 ]) {
        const w = suma(suma(p, por(n, sep)), por(lado, s ? -ancho : ancho)), v = aV(w), k = i * 2 + s;
        P[k * 3] = v[0] - c[0];
        P[k * 3 + 1] = v[1] - c[1];
        P[k * 3 + 2] = v[2] - c[2];
        U[k * 2] = u;
        U[k * 2 + 1] = s ? v1 : v0;
      }
    };
    if (!pts) {
      const lado = unir(cruz(n, e.f)) || [ 1, 0, 0 ];
      poner(0, suma(pos, por(e.f, 12)), lado, u0);
      poner(1, suma(pos, por(e.f, -12)), lado, u1);
    } else {
      for (let i = 0; i < 9; i++) {
        const t = unir(resta(pts[Math.max(0, i - 1)], pts[Math.min(8, i + 1)])) || e.f;
        const lado = unir(cruz(n, t)) || [ 1, 0, 0 ];
        poner(i, pts[i], lado, u0 + (u1 - u0) * (i / 8));
      }
    }
    posA.needsUpdate = true;
    uvA.needsUpdate = true;
  };
  grupo?.add(g);
  return e;
}
