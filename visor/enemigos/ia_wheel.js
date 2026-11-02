// SH4 web — FeniXVOID · Project Ravenlight
import { DT, PI, envolver, rumboHacia, distXZ, girarY, frente, azar01 } from "./comun.js";

import { C } from "./ia_hyena.js";

export { C };

export const P = {
  INIT: 0,
  VAGA: 1,
  ENTRA_PUERTA: 2,
  SALE_PUERTA: 3,
  DANIO: 4,
  EVENTO: 5
};

export const NOMBRE_PASO = [ "Init", "Wander", "IntoDoor", "FromDoor", "Damage", "Event" ];

export const CW = {
  NORMAL: 1,
  DANIO: 9,
  MUERTA: 11,
  ADENTRO: 13,
  BORRADA: 16,
  EVENTO: 18
};

export const A = {
  NT: 0,
  NT2: 1,
  NT3: 2,
  GIRO_DER: 3,
  GIRO_IZQ: 4
};

export const NOMBRES_ANIM_WHEEL = [ "NT", "NT2", "NT3" ];

export const RIELES = {
  bd17: [ [ -940, -40, [ 2, 4 ] ], [ -400, -40, [ 1, 3, 5 ] ], [ 1050, -40, [ 2, 9 ] ], [ -940, -400, [ 1, 2, 5, 6 ] ], [ -400, -400, [ 2, 4, 7 ] ], [ -940, -820, [ 4, 7, 10, 11 ] ], [ -400, -820, [ 5, 6, 8, 10, 11, 12 ] ], [ 300, -820, [ 7, 9, 11, 12, 13 ] ], [ 1050, -820, [ 3, 8, 12, 13 ] ], [ -940, -1440, [ 6, 7, 11, 14, 15 ] ], [ -400, -1440, [ 6, 7, 8, 10, 12, 14, 15, 16 ] ], [ 300, -1440, [ 7, 8, 9, 11, 13, 15, 16, 17 ] ], [ 1050, -1440, [ 8, 9, 12, 16, 17 ] ], [ -940, -2100, [ 10, 11, 15 ] ], [ -400, -2100, [ 10, 11, 12, 14, 16 ] ], [ 300, -2100, [ 11, 12, 13, 15, 17 ] ], [ 1050, -2100, [ 12, 13, 16 ] ] ],
  hs32: [ [ -180, 4900, [ 2, 4, 5 ] ], [ 0, 4900, [ 1, 3, 4, 5, 6 ] ], [ 180, 4900, [ 2, 5, 6 ] ], [ -180, 3e3, [ 1, 2, 7, 8 ] ], [ 0, 3e3, [ 1, 2, 3, 7, 8, 9 ] ], [ 180, 3e3, [ 2, 3, 8, 9 ] ], [ -180, 1200, [ 4, 5, 10, 11 ] ], [ 0, 1200, [ 4, 5, 6, 10, 11, 12 ] ], [ 180, 1200, [ 5, 6, 11, 12 ] ], [ -180, -600, [ 7, 8, 13, 14 ] ], [ 0, -600, [ 7, 8, 9, 13, 14, 15 ] ], [ 180, -600, [ 8, 9, 14, 15 ] ], [ -180, -2400, [ 10, 11, 16, 17 ] ], [ 0, -2400, [ 10, 11, 12, 16, 17, 18 ] ], [ 180, -2400, [ 11, 12, 17, 18 ] ], [ -180, -4300, [ 13, 14, 17 ] ], [ 0, -4300, [ 13, 14, 15, 16, 18 ] ], [ 180, -4300, [ 14, 15, 17 ] ] ]
};

const SE = {
  RUEDA: 61700,
  GOLPE: 60701
};

const VOCES = 2;

const GIRO_RAPIDO = PI / 2;

const A30 = .5235988, A90 = 1.5707964, A150 = 2.6179938;

const PIVOTE = {
  [A.GIRO_DER]: [ -60, 0, -60 ],
  [A.GIRO_IZQ]: [ 60, 0, -60 ]
};

const HUESOS_RUEDA = [ [ 1, 2, 3, 4 ], [ 2, 3, 4, 5 ] ];

const RADIO_RUEDA = [ 50, 50, 20, 20 ];

const RUEDA_LOCAL = [ [ -55, -55, -64 ], [ 55, -55, -64 ], [ -59, -16, 25 ], [ 59, -16, 25 ] ];

const SIN_RUIDO = /STUNGUN|SPRAY|CHAINSAW/;

export function binWheel(def, sala) {
  if (sala) def._sala = String(sala).slice(0, 4);
  return "enemy_wheel.bin";
}

function rielesDe(def) {
  if (def._sala && RIELES[def._sala]) return RIELES[def._sala];
  let mejor = null, dm = 300;
  for (const r of Object.values(RIELES)) for (const c of r) {
    const d = Math.hypot(c[0] - def.pos[0], c[1] - def.pos[2]);
    if (d < dm) {
      dm = d;
      mejor = r;
    }
  }
  return mejor;
}

class Rieles {
  constructor(datos) {
    this.c = datos || [];
  }
  get n() {
    return this.c.length;
  }
  cruce(n) {
    return this.c[Math.max(1, Math.min(this.n, n | 0)) - 1];
  }
  pos(n) {
    const c = this.cruce(n);
    return c ? [ c[0], 0, c[1] ] : [ 0, 0, 0 ];
  }
  ramales(n) {
    return this.cruce(n)?.[2] || [];
  }
  dirRamal(n, k) {
    const a = this.cruce(n), b = this.cruce(this.ramales(n)[k]);
    if (!a || !b) return 0;
    return Math.atan2(b[0] - a[0], b[1] - a[1]);
  }
  cerca(p) {
    return this.c.map((c, i) => ({
      i: i + 1,
      d: (p[2] - c[1]) ** 2 + (p[0] - c[0]) ** 2
    })).sort((a, b) => a.d - b.d).slice(0, 10);
  }
  vuelta(hasta, desde) {
    return this.ramales(hasta).find(r => r === desde) || 0;
  }
  masCerca(p) {
    if (!this.n) return null;
    let best = Infinity, out = null, j0 = 0, ini = 0, fin = null;
    for (const {i: i} of this.cerca(p)) {
      const a = this.cruce(i);
      for (const b of a[2]) {
        const e = this.cruce(b), sx = e[0] - a[0], sz = e[1] - a[1], L = sx * sx + sz * sz;
        let t = L < 15258789e-12 ? 0 : ((p[0] - a[0]) * sx + (p[2] - a[1]) * sz) / L;
        t = Math.max(0, Math.min(1, t));
        const q = [ a[0] + sx * t, 0, a[1] + sz * t ], d = (q[0] - p[0]) ** 2 + (q[2] - p[2]) ** 2;
        if (d < best) {
          best = d;
          out = q;
          j0 = b;
          ini = i;
          fin = e;
        }
      }
    }
    if (!out) return null;
    return {
      punto: out,
      j: [ j0, this.vuelta(j0, ini) ],
      dir: Math.atan2(fin[0] - out[0], fin[1] - out[2])
    };
  }
  corte(a, e, p, d) {
    const sx = e[0] - a[0], sz = e[1] - a[1], px = p[0] - a[0], pz = p[2] - a[1], L = sx * sx + sz * sz;
    if (L < 15258789e-12) return {
      f: -Math.hypot(px, pz),
      punto: [ a[0], p[1], a[1] ]
    };
    const t = (px * sx + pz * sz) / L, cr = d[2] * sx - d[0] * sz;
    let neg = false, punto;
    const u = Math.abs(cr) < 15258789e-12 ? -1 : (px * sz - pz * sx) / cr;
    if (u < 0) {
      neg = true;
      punto = t < .5 ? [ a[0], p[1], a[1] ] : [ e[0], p[1], e[1] ];
    } else {
      const ix = d[0] * u + p[0], iz = d[2] * u + p[2], s = ((ix - a[0]) * sx + (iz - a[1]) * sz) / L;
      if (s < 0) {
        neg = true;
        punto = [ a[0], p[1], a[1] ];
      } else if (s > 1) {
        neg = true;
        punto = [ e[0], p[1], e[1] ];
      } else punto = [ ix, p[1], iz ];
    }
    const tc = Math.max(0, Math.min(1, t)), dist = Math.hypot(a[0] + sx * tc - p[0], a[1] + sz * tc - p[2]);
    return {
      f: neg ? -dist : dist,
      punto: punto
    };
  }
  masCercaConRumbo(p, rumbo) {
    if (!this.n) return null;
    const r32 = Math.fround(rumbo), d = [ Math.fround(Math.sin(r32)), 0, Math.fround(Math.cos(r32)) ];
    let best = Infinity, hay = false, out = null, j0 = 0, ini = 0, fin = null;
    for (const {i: i} of this.cerca(p)) {
      const a = this.cruce(i);
      for (const b of a[2]) {
        const e = this.cruce(b), r = this.corte(a, e, p, d);
        let f = r.f;
        if (hay) {
          if (f < 0) continue;
        } else if (f < 0) f = -f; else {
          hay = true;
          best = Infinity;
        }
        if (f < best) {
          best = f;
          out = r.punto;
          j0 = b;
          ini = i;
          fin = e;
        }
      }
    }
    if (!out) return null;
    let j = [ j0, this.vuelta(j0, ini) ], dir = Math.atan2(fin[0] - out[0], fin[1] - out[2]);
    if (Math.abs(envolver(dir - rumbo)) > A90) {
      j = [ j[1], j[0] ];
      dir = envolver(dir + PI);
    }
    return {
      punto: out,
      j: j,
      dir: dir
    };
  }
}

const SILLAS = new WeakMap;

const ahora = () => typeof performance !== "undefined" ? performance.now() : Date.now();

function sillasDe(m) {
  if (!SILLAS.has(m)) SILLAS.set(m, new Set);
  return SILLAS.get(m);
}

function repartirVoces(m) {
  const t = ahora(), todas = sillasDe(m), j = m.jugador();
  for (const e of todas) if (t - e.ultimoTick > 500) {
    if (e.sonando) {
      e.sonando = false;
      m.sonido?.(e, null, true);
    }
    todas.delete(e);
  }
  const piden = [ ...todas ].filter(e => e.pidiendo).sort((a, b) => distXZ(a.pos, j.pos) - distXZ(b.pos, j.pos)).slice(0, VOCES);
  for (const e of todas) {
    const suena = piden.includes(e);
    if (suena !== e.sonando) {
      e.sonando = suena;
      m.sonido?.(e, suena ? SE.RUEDA : null, true);
    }
  }
}

export class Wheel {
  constructor(def, pj, anim, m) {
    this.tipo = "WHEEL";
    this.def = def;
    this.pj = pj;
    this.anim = anim;
    this.m = m;
    this.tipoParam = def.tipo_param || 0;
    this.param = m.parametros("WHEEL", this.tipoParam);
    this.hp = this.hpMax = this.param.vida;
    this.pos = [ ...def.pos ];
    this.rot = def.rumbo || 0;
    this.posAnt = [ ...this.pos ];
    this.rotAnt = this.rot;
    this.radio = 80;
    this.radioGolpe = 140;
    this.radioContacto = 140;
    this.alto = 300;
    this.centroAlto = 150;
    this.sinPasos = true;
    this.sinSangre = true;
    this.cond = CW.NORMAL;
    this.paso = P.INIT;
    this.sub = 0;
    this.golpes = [];
    this.animId = A.NT;
    this.animN = -1;
    this.w = {
      target: [ ...this.pos ],
      shock: [ 0, 0, 0 ],
      targetDir: this.rot,
      targetJc: 0,
      targetDoor: -1,
      animeStep: 0,
      jcCount: 0,
      onAttack: 0,
      timer: 0,
      turnR: 0,
      turnStart: 0,
      ruedas: null,
      angRueda: [ 0, 0, 0, 0 ]
    };
    this.inclinacion = {
      willy: 0,
      rolido: 0
    };
    this.rieles = new Rieles(rielesDe(def));
    this.ini = def.ini ?? def.estado_inicial ?? 0;
    this.visible = true;
    this.ataque = false;
    this.pidiendo = false;
    this.sonando = false;
    this.ultimoTick = ahora();
    sillasDe(m).add(this);
    this.cbTocar = false;
    this.chequeoDanio = null;
    this.esperaBandera = def.dmy8 && m.bandera && !m.bandera(def.dmy8) ? def.dmy8 : 0;
    if (this.esperaBandera) {
      this.cond = CW.BORRADA;
      this.visible = false;
    }
    this.ponerMovimiento(A.NT, true);
    this.conectarRuedas();
  }
  caido() {
    return false;
  }
  intocable() {
    return this.cond === CW.BORRADA || this.cond === CW.ADENTRO || this.cond === CW.EVENTO || !this.visible;
  }
  maldice() {
    return ![ CW.DANIO, CW.MUERTA, CW.EVENTO, CW.BORRADA, CW.ADENTRO ].includes(this.cond);
  }
  recibir(g) {
    if (!this.intocable()) this.golpes.push(g);
  }
  pasoA(n) {
    this.paso = n;
    this.sub = 0;
  }
  jug() {
    return this.m.jugador();
  }
  puertas() {
    return this.m.puertasWheel?.(this) || null;
  }
  ponerMovimiento(n, forzar) {
    if (n !== this.animN || forzar) {
      this.animN = n;
      this.anim.poner(n);
    }
  }
  ponerAnim(n) {
    this.animId = n;
    this.w.animeStep = 0;
    if (this.tipoParam !== 0 && n < 3) this.ponerMovimiento(n);
  }
  cambiarAnim() {
    const r = azar01();
    if (this.animId === A.NT) {
      if (r < .002) this.ponerAnim(A.NT2); else if (r < .004) this.ponerAnim(A.NT3);
    } else if (this.animId > 0 && this.animId < 3 && this.anim.vuelta && azar01() < .6) this.ponerAnim(A.NT);
  }
  pedirSonido(si) {
    this.pidiendo = si;
    repartirVoces(this.m);
  }
  soltar() {
    this.pidiendo = false;
    this.ultimoTick = -1e9;
    repartirVoces(this.m);
  }
  mover(dx, dz, fantasma) {
    if (fantasma && this.m.moverFantasma) this.m.moverFantasma(this, dx, dz); else if (!fantasma && this.m.mover) this.m.mover(this, dx, dz); else {
      this.pos[0] += dx;
      this.pos[2] += dz;
    }
  }
  avanzar() {
    const pct = this.hpMax > 0 ? Math.max(0, this.hp) / this.hpMax * 100 : 0;
    const v = DT * (pct * .009 + .1) * this.param.velocidad, f = frente(this.rot);
    this.mover(f[0] * v, f[2] * v, this.atraviesa);
  }
  girarHacia(p, max) {
    const dr = envolver(rumboHacia(p, this.pos) - this.rot);
    this.rot = envolver(this.rot + Math.max(-max, Math.min(max, dr)));
  }
  irHacia(p) {
    this.girarHacia(p, DT * GIRO_RAPIDO);
    this.avanzar();
    if (this.tipoParam !== 0) this.cambiarAnim();
  }
  paredAdelante() {
    if (!this.m.rayo) return false;
    const c = [ this.pos[0], this.pos[1] - 60, this.pos[2] ];
    for (const a of [ 0, -A30, A30, -1.0471976, 1.0471976 ]) {
      const f = frente(this.rot + a, 140);
      if (this.m.rayo(c, [ c[0] + f[0], c[1], c[2] + f[2] ])) return true;
    }
    return false;
  }
  dirJugador() {
    return rumboHacia(this.jug().pos, this.pos);
  }
  toca() {
    const j = this.jug();
    return j.existe && distXZ(this.pos, j.pos) < this.radioContacto + (this.m.radioJugador ?? 40) + 5 && Math.abs(this.pos[1] - j.pos[1]) < 200;
  }
  tick() {
    this.posAnt = [ ...this.pos ];
    this.rotAnt = this.rot;
    this.yaChoco = false;
    this.ultimoTick = ahora();
    sillasDe(this.m).add(this);
    if (this.esperaBandera) {
      if (!this.m.bandera(this.esperaBandera)) return;
      this.esperaBandera = 0;
      this.cond = CW.NORMAL;
      this.visible = true;
      this.pasoA(P.INIT);
    }
    this.control();
    if (this.tipoParam !== 0 && this.cond !== CW.MUERTA) this.anim.avanzar();
    this.girarRuedas();
    this.eventos();
    repartirVoces(this.m);
  }
  control() {
    const w = this.w;
    this.chequeoDanio = this.paso === P.VAGA || this.paso === P.ENTRA_PUERTA && this.sub < 2 ? "paso" : this.paso === P.DANIO ? "mas" : null;
    if (w.onAttack && --w.onAttack === 0) this.finAtaque();
    this.cbTocar = false;
    if (this.animId < 3) {
      switch (this.paso) {
       case P.INIT:
        this.init();
        break;

       case P.VAGA:
        this.vaga();
        break;

       case P.ENTRA_PUERTA:
        this.entraPuerta();
        break;

       case P.SALE_PUERTA:
        this.salePuerta();
        break;

       case P.DANIO:
        this.danio();
        break;

       case P.EVENTO:
        this.evento();
        break;
      }
    } else this.girar(PIVOTE[this.animId]);
    if (![ CW.DANIO, CW.MUERTA, CW.EVENTO ].includes(this.cond) && this.hp > 0) this.hp = Math.min(this.hpMax, this.hp + (this.param.recupera || 0) * DT);
  }
  eventos() {
    const gs = this.golpes;
    this.golpes = [];
    if (gs.length && this.chequeoDanio === "paso") {
      this.bd = gs;
      this.pasoA(P.DANIO);
    } else if (gs.length && this.chequeoDanio === "mas") this.danioExtra(gs);
    if (this.cbTocar && this.toca()) this.chocoJugador();
  }
  init() {
    this.ponerAnim(A.NT);
    this.pasoA((this.ini & 15) === 6 ? P.EVENTO : P.VAGA);
  }
  vaga() {
    const w = this.w, pos = this.pos, dir = this.rot, pdir = this.dirJugador();
    this.cbTocar = true;
    if (this.sub === 0) {
      this.cond = CW.NORMAL;
      this.ponerAnim(A.NT);
      if (!this.pidiendo) this.pedirSonido(true);
      w.jcCount = 0;
      this.sub = 1;
    }
    if (this.sub === 1) {
      if (this.paredAdelante()) {
        w.target = [ ...pos ];
        w.targetDir = envolver(dir + PI);
        this.ponerAnim(azar01() >= .5 ? A.GIRO_IZQ : A.GIRO_DER);
        this.pedirSonido(false);
        return;
      }
      const r = this.rieles.masCercaConRumbo(pos, dir);
      if (!r) return;
      if ((r.punto[0] - pos[0]) ** 2 + (r.punto[2] - pos[2]) ** 2 >= 3600) {
        this.irHacia(r.punto);
        return;
      }
      w.target = r.punto;
      let giro = envolver(r.dir - dir), nuevo = r.dir, k = 0;
      if (this.toca() && Math.abs(envolver(pdir - r.dir)) < A90) {
        k = 1;
        giro = envolver(giro + PI);
        nuevo = envolver(r.dir + PI);
      }
      w.targetDir = nuevo;
      w.targetJc = r.j[k];
      if (Math.abs(giro) < A30) {
        this.sub = 2;
        this.pedirSonido(false);
        return;
      }
      this.ponerAnim(giro <= 0 ? A.GIRO_IZQ : A.GIRO_DER);
      this.pedirSonido(false);
      return;
    }
    if (this.sub !== 2) {
      this.irHacia(w.target);
      return;
    }
    const r = this.rieles.masCerca(pos);
    if (!r || (r.punto[0] - pos[0]) ** 2 + (r.punto[2] - pos[2]) ** 2 > 3600) {
      this.sub = 1;
      return;
    }
    if (this.paredAdelante()) {
      w.target = [ ...pos ];
      w.targetJc = r.j[0] === w.targetJc ? r.j[1] : r.j[0];
      w.targetDir = envolver(w.targetDir + PI);
      this.ponerAnim(azar01() >= .5 ? A.GIRO_IZQ : A.GIRO_DER);
      this.pedirSonido(false);
      return;
    }
    const jp = this.rieles.pos(w.targetJc);
    if ((jp[0] - pos[0]) ** 2 + (jp[2] - pos[2]) ** 2 >= 400) {
      this.irHacia(jp);
      return;
    }
    w.target = jp;
    const n = this.rieles.ramales(w.targetJc).length, aJug = Math.abs(envolver(pdir - dir));
    let k = -1;
    if (!(azar01() * PI <= aJug || n < 1)) {
      let lim = A30;
      for (let i = 0; i < n; i++) {
        const d = Math.abs(envolver(this.rieles.dirRamal(w.targetJc, i) - dir));
        if (d < lim) {
          lim = d;
          k = i;
        }
      }
    }
    if (k < 0) {
      let i = 0;
      do {
        k = Math.max(0, Math.round(azar01() * n - .49));
      } while (Math.abs(envolver(this.rieles.dirRamal(w.targetJc, k) - dir)) >= A150 && ++i < 2);
    }
    const nd = this.rieles.dirRamal(w.targetJc, k);
    w.targetDir = nd;
    w.targetJc = this.rieles.ramales(w.targetJc)[k] ?? w.targetJc;
    const giro = envolver(nd - dir);
    let gira = false;
    if (Math.abs(giro) > A30) {
      this.ponerAnim(giro <= 0 ? A.GIRO_IZQ : A.GIRO_DER);
      this.pedirSonido(false);
      gira = true;
    }
    if (++w.jcCount > 4 && this.puertas()?.cantidad) {
      const p = this.puertaConRiel();
      if (p >= 0) {
        w.targetDoor = p;
        this.pasoA(P.ENTRA_PUERTA);
        return;
      }
    }
    if (!gira) this.irHacia(jp);
  }
  girar(piv) {
    const w = this.w;
    this.cbTocar = true;
    if (w.animeStep === 0) {
      w.turnStart = this.rot;
      const a = Math.abs(envolver(w.targetDir - this.rot));
      if (a < .05235988) {
        this.finGiro();
        return;
      }
      w.timer = 0;
      w.animeStep = 1;
      w.turnR = 1 / (a * .2546479);
    }
    const ant = w.turnR * w.timer;
    w.timer += DT;
    const p = w.timer * w.turnR;
    if (p >= 1) {
      this.finGiro();
      return;
    }
    const rotar = (v, h, t, r) => {
      const cz = Math.cos(r), sz = Math.sin(r), ct = Math.cos(t), st = Math.sin(t);
      const a1 = [ v[0] * cz - v[1] * sz, v[0] * sz + v[1] * cz, v[2] ];
      const a2 = [ a1[0], a1[1] * ct - a1[2] * st, a1[1] * st + a1[2] * ct ];
      return girarY(a2, h);
    };
    const inc = this.inclinacion;
    const obj = girarY(piv, w.targetDir), act = rotar(piv, this.rot, inc.willy, inc.rolido);
    const f = (p - ant) / (1 - ant);
    const nx = act[0] + (obj[0] - act[0]) * f, nz = act[2] + (obj[2] - act[2]) * f;
    const d = envolver(w.targetDir - w.turnStart), s = Math.sin(p * PI);
    this.rot = envolver(w.turnStart + p * d);
    inc.willy = (Math.abs(d / 6) + .2617994) * s;
    inc.rolido = s * d * -(1 / 6);
    const nuevo = rotar(piv, this.rot, inc.willy, inc.rolido);
    this.mover(nx - nuevo[0], nz - nuevo[2], this.atraviesa);
  }
  finGiro() {
    this.rot = envolver(this.w.targetDir);
    this.inclinacion.willy = 0;
    this.inclinacion.rolido = 0;
    if (this.paso === P.VAGA) this.sub = 2;
    this.animId = A.NT;
    this.w.animeStep = 0;
    if (!this.pidiendo) this.pedirSonido(true);
  }
  chocoJugador() {
    this.ataca();
    if (this.yaChoco) return;
    this.yaChoco = true;
    if (this.paso === P.VAGA) this.sub = 1; else if (this.paso === P.ENTRA_PUERTA || this.paso === P.SALE_PUERTA) {
      this.puertas()?.cerrar?.(this.w.targetDoor);
      if (this.cond === CW.NORMAL) {
        this.atraviesa = false;
        this.pasoA(P.VAGA);
      }
    }
  }
  ataca() {
    const j = this.jug();
    if (!j.existe || [ 6, 7, 9, 10 ].includes(j.estado) || (this.m.relojAtaque?.() ?? 5) < 5) {
      this.finAtaque();
      this.w.onAttack = 0;
      return;
    }
    this.w.onAttack = 2;
    if (!this.ataque) this.ataque = {
      pego: false
    };
    if (!this.ataque.pego) {
      this.ataque.pego = true;
      this.m.golpear(this, this.param.ataque1, "BAK_WHEEL_DASH", {
        shock: 50
      });
    }
  }
  finAtaque() {
    this.ataque = false;
  }
  danio() {
    const w = this.w;
    if (this.sub === 0) {
      if (w.targetDoor !== -1) {
        this.puertas()?.cerrar?.(w.targetDoor);
        w.targetDoor = -1;
      }
      this.finAtaque();
      w.onAttack = 0;
      this.cond = CW.DANIO;
      this.atraviesa = false;
      this.ponerAnim(A.NT);
      this.pedirSonido(false);
      const b = this.sumarGolpes(this.bd || []);
      this.bd = null;
      if (b.ruido) this.m.sonido?.(this, SE.GOLPE);
      w.shock = [ b.dir[0] * b.shock, 0, b.dir[2] * b.shock ];
      this.hp = Math.max(0, this.hp - b.danio);
      w.timer = b.shock * .05 + .5;
      this.sub = 1;
    }
    const k = DT * 20;
    this.mover(w.shock[0] * k, w.shock[2] * k);
    const fr = (1 / (1 + DT)) ** 4;
    w.shock[0] *= fr;
    w.shock[2] *= fr;
    w.timer -= DT;
    if (w.timer <= 0) {
      if (this.hp > 0) this.pasoA(P.VAGA); else if (this.cond !== CW.MUERTA) {
        this.cond = CW.MUERTA;
        this.finAtaque();
      }
    }
  }
  danioExtra(gs) {
    const w = this.w, b = this.sumarGolpes(gs);
    if (b.ruido) this.m.sonido?.(this, SE.GOLPE);
    this.hp = Math.max(0, this.hp - b.danio);
    w.shock[0] += b.dir[0] * b.shock;
    w.shock[2] += b.dir[2] * b.shock;
    w.timer = b.shock * .05 + w.timer * .5;
  }
  sumarGolpes(gs) {
    let danio = 0, sx = 0, sz = 0, fuerte = null;
    for (const g of gs) {
      danio += g.danio || 0;
      const d = g.dir || [ 0, 0, 0 ], s = g.shock ?? 0;
      sx += d[0] * s;
      sz += d[2] * s;
      if (!fuerte || (g.danio || 0) >= (fuerte.danio || 0)) fuerte = g;
    }
    const L = Math.hypot(sx, sz);
    return {
      danio: danio,
      shock: L,
      dir: L >= 15258789e-12 ? [ sx / L, 0, sz / L ] : [ 0, 0, 0 ],
      ruido: !!fuerte && !SIN_RUIDO.test(String(fuerte.golpe || ""))
    };
  }
  evento() {
    if (this.sub === 0) {
      this.cond = CW.EVENTO;
      this.sub = 1;
    }
    if (this.tipoParam !== 0) this.cambiarAnim();
  }
  puertaAzar() {
    const pu = this.puertas();
    if (!pu?.cantidad) return -1;
    const j = this.jug().pos, cam = this.m.posCamara?.() || j;
    let intentos = 0;
    for (let vueltas = 0; vueltas < 1e3; vueltas++) {
      const k = Math.max(0, Math.round(azar01() * pu.cantidad - .49));
      if (pu.tipo?.(k) === 14) continue;
      if (!pu.cerrada || pu.cerrada(k)) {
        const p = pu.pos(k);
        if (distXZ(j, p) ** 2 > 1e6 && distXZ(cam, p) ** 2 > 1e6) return k;
        if (++intentos > 9) return k;
      }
    }
    return -1;
  }
  puertaConRiel() {
    const k = this.puertaAzar();
    if (k < 0) return -1;
    const r = this.rieles.masCerca(this.puertas().pos(k));
    if (!r) return -1;
    const libre = !this.m.rayo || !this.m.rayo([ this.pos[0], this.pos[1] - 60, this.pos[2] ], [ r.punto[0], this.pos[1] - 60, r.punto[2] ]);
    return libre && Math.abs(envolver(this.w.targetDir - rumboHacia(r.punto, this.pos))) < .017453292 ? k : -1;
  }
  entraPuerta() {
    const w = this.w, pu = this.puertas(), pos = this.pos;
    if (!pu) {
      this.pasoA(P.VAGA);
      return;
    }
    this.cbTocar = this.visible;
    const dp = () => pu.pos(w.targetDoor);
    switch (this.sub) {
     case 0:
      {
        this.cond = CW.NORMAL;
        const r = this.rieles.masCerca(dp());
        w.target = r ? r.punto : [ ...dp() ];
        this.ponerAnim(A.NT);
        if (!this.pidiendo) this.pedirSonido(true);
        this.sub = 1;
      }

     case 1:
      {
        if ((w.target[0] - pos[0]) ** 2 + (w.target[2] - pos[2]) ** 2 < 400) {
          const d = dp();
          w.targetDir = rumboHacia(d, pos);
          const g = envolver(w.targetDir - this.rot);
          if (Math.abs(g) > A30) {
            this.ponerAnim(g <= 0 ? A.GIRO_IZQ : A.GIRO_DER);
            this.pedirSonido(false);
          }
          if (pu.tipo?.(w.targetDoor) === 10) {
            this.sub = 6;
            return;
          }
          pu.abrir?.(w.targetDoor);
          this.sub = 2;
          return;
        }
        this.irHacia(w.target);
        return;
      }

     case 2:
      {
        w.target = dp();
        this.girarHacia(w.target, DT * GIRO_RAPIDO);
        if (!pu.abierta || pu.abierta(w.targetDoor)) {
          this.atraviesa = true;
          this.sub = 3;
          return;
        }
        if (pu.cerrada?.(w.targetDoor)) pu.abrir?.(w.targetDoor);
        return;
      }

     case 3:
      {
        this.irHacia(w.target);
        const f = frente(this.rot);
        if (f[0] * (w.target[0] - pos[0]) + f[2] * (w.target[2] - pos[2]) < 0) this.sub = 4;
        return;
      }

     case 4:
      {
        const f = frente(w.target[3] || 0);
        this.irHacia([ w.target[0] - f[0] * 2e3, w.target[1], w.target[2] - f[2] * 2e3 ]);
        if (distXZ(pos, w.target) ** 2 > 4e4) {
          pu.cerrar?.(w.targetDoor);
          this.cond = CW.ADENTRO;
          this.visible = false;
          w.targetDoor = -1;
          this.sub = 5;
        }
        return;
      }

     case 5:
      {
        if (azar01() < .1) {
          let k, i = 0;
          do {
            k = this.puertaAzar();
          } while (pu.tipo?.(k) === 10 && ++i < 50);
          w.targetDoor = k;
          if (k >= 0) this.pasoA(P.SALE_PUERTA);
        }
        return;
      }

     case 6:
      {
        const d = dp();
        if (distXZ(pos, d) ** 2 < 8100) {
          w.targetDir = d[3] || 0;
          w.target = [ ...pos ];
          this.ponerAnim(azar01() >= .5 ? A.GIRO_IZQ : A.GIRO_DER);
          this.pedirSonido(false);
          this.pasoA(P.VAGA);
          return;
        }
        this.irHacia(d);
        return;
      }
    }
  }
  salePuerta() {
    const w = this.w, pu = this.puertas(), pos = this.pos;
    if (!pu || w.targetDoor < 0) {
      this.pasoA(P.VAGA);
      return;
    }
    switch (this.sub) {
     case 0:
      {
        this.cond = CW.NORMAL;
        this.visible = true;
        this.atraviesa = true;
        pu.abrir?.(w.targetDoor);
        const d = pu.pos(w.targetDoor);
        w.target = [ ...d ];
        const f = frente(d[3] || 0);
        if (this.m.moverA) this.m.moverA(this, d[0] - f[0] * 200, d[2] - f[2] * 200); else {
          pos[0] = d[0] - f[0] * 200;
          pos[2] = d[2] - f[2] * 200;
        }
        this.posAnt = [ ...pos ];
        this.rot = this.rotAnt = d[3] || 0;
        this.ponerAnim(A.NT);
        if (!this.pidiendo) this.pedirSonido(true);
        this.sub = 1;
        return;
      }

     case 1:
      if (!pu.abierta || pu.abierta(w.targetDoor)) this.sub = 2; else if (pu.cerrada?.(w.targetDoor)) pu.abrir?.(w.targetDoor);
      return;

     case 2:
      this.avanzar();
      if (!this.m.piso || this.m.piso(pos) != null) {
        pu.cerrar?.(w.targetDoor);
        this.sub = 3;
      }
      return;

     case 3:
      this.avanzar();
      if (distXZ(pos, w.target) ** 2 > 6400) {
        this.atraviesa = false;
        for (let i = 0; i < 5; i++) {
          const k = this.puertaAzar();
          if (k >= 0 && k !== w.targetDoor && Math.abs(envolver(rumboHacia(pu.pos(k), pos) - this.rot)) < A30) {
            w.targetDoor = k;
            this.pasoA(P.ENTRA_PUERTA);
            return;
          }
        }
        w.targetDoor = -1;
        this.pasoA(P.VAGA);
      }
      return;
    }
  }
  girarRuedas() {
    const w = this.w, salta = this.animId === A.GIRO_DER ? 4294967294 : this.animId === A.GIRO_IZQ ? 4294967293 : 0;
    const ahora = RUEDA_LOCAL.map(l => {
      const g = girarY(l, this.rot);
      return [ this.pos[0] + g[0], this.pos[1] + g[1], this.pos[2] + g[2] ];
    });
    if (w.ruedas) for (let i = 0; i < 4; i++) {
      if (salta & 1 << i) continue;
      const loc = girarY([ ahora[i][0] - w.ruedas[i][0], 0, ahora[i][2] - w.ruedas[i][2] ], -this.rot);
      w.angRueda[i] -= loc[2] / RADIO_RUEDA[i];
    }
    w.ruedas = ahora;
  }
  conectarRuedas() {
    const pj = this.pj;
    if (!pj?.huesos || typeof pj.actualizar !== "function") return;
    const huesos = HUESOS_RUEDA[this.tipoParam ? 1 : 0].map(i => pj.huesos[i]);
    if (huesos.some(h => !h?.matrix)) return;
    const M = huesos[0].matrix.constructor, rx = new M, orig = pj.actualizar.bind(pj);
    pj.actualizar = dt => {
      const pose = orig(dt);
      for (let i = 0; i < 4; i++) {
        huesos[i].matrix.multiply(rx.makeRotationX(this.w.angRueda[i]));
        huesos[i].matrixWorldNeedsUpdate = true;
      }
      return pose;
    };
  }
  inclinar(grupo) {
    const {willy: willy, rolido: rolido} = this.inclinacion;
    if (!willy && !rolido) return;
    grupo.rotateX(-willy);
    grupo.rotateZ(rolido);
  }
}
