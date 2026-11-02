// SH4 web — FeniXVOID · Project Ravenlight
import { DT, envolver, dist3, girarY, azar, azar01 } from "./comun.js";

export const C = {
  NORMAL: 1,
  DEAD: 11,
  BORRADO: 16,
  EVENTO: 18
};

export const P = {
  INIT: 0,
  CRECE: 1,
  PARADO: 2,
  MUERE: 3,
  ESPERA: 4,
  EVENTO: 5,
  ESPERA_EVENTO: 6
};

export const NOMBRE_PASO = [ "Init", "Grow", "Stand", "Dead", "Wait", "Event", "EventWait" ];

export const A = {
  BROTE: 0,
  ABRE: 1
};

export const NOMBRES_ANIM_MUSH = [ "BROTE", "ABRE" ];

export function binMush(def, sala) {
  const s = String(sala || def?.sala || "").slice(0, 4).toLowerCase();
  const n = Number(s.slice(2));
  if (s.startsWith("mz") && n >= 35 || s === "bd11") return "enemy_mush2.bin";
  return "enemy_mush.bin";
}

export const BANDERA_EVENTO = 707;

const SE = {
  LOOP: 61207,
  REVIENTA: 60206
};

const HUESOS = [ 0, 1, 2, 3 ];

const ALTO_HENRY = 360;

const ESCALA_VISOR = .005;

const MEMORIA = new Map;

export const memoriaMush = MEMORIA;

function ruido(p1, p2) {
  if (p1 < 0 && azar(32768) & 8192) p1 = -p1;
  const den = azar01() + p2;
  if (den === 0) return 0;
  return ((p2 + 1) * p2 / den - p2) * p1;
}

function resorte(s, obj, a, b, rig, am) {
  const v = (ruido(-a, b) + s[1] - (s[0] - obj) * rig) * am;
  s[1] = v;
  s[0] += v;
}

const ahora = () => globalThis.performance?.now?.() ?? Date.now();

function cuatDesdeArriba(d) {
  const L = Math.hypot(d[0], d[1], d[2]) || 1;
  const x = d[0] / L, y = d[1] / L, z = d[2] / L;
  let q = [ -z, 0, x, 1 - y ];
  const n = Math.hypot(...q);
  if (n < 1e-6) return [ 1, 0, 0, 0 ];
  return q.map(v => v / n);
}

function matriz(q, t, out) {
  const [x, y, z, w] = q;
  out[0] = 1 - 2 * (y * y + z * z);
  out[1] = 2 * (x * y + w * z);
  out[2] = 2 * (x * z - w * y);
  out[3] = 0;
  out[4] = 2 * (x * y - w * z);
  out[5] = 1 - 2 * (x * x + z * z);
  out[6] = 2 * (y * z + w * x);
  out[7] = 0;
  out[8] = 2 * (x * z + w * y);
  out[9] = 2 * (y * z - w * x);
  out[10] = 1 - 2 * (x * x + y * y);
  out[11] = 0;
  out[12] = t[0];
  out[13] = t[1];
  out[14] = t[2];
  out[15] = 1;
  return out;
}

function mult(a, b, out) {
  const r = new Array(16);
  for (let c = 0; c < 4; c++) for (let f = 0; f < 4; f++) {
    let s = 0;
    for (let k = 0; k < 4; k++) s += a[k * 4 + f] * b[c * 4 + k];
    r[c * 4 + f] = s;
  }
  for (let i = 0; i < 16; i++) out[i] = r[i];
  return out;
}

function invertirAfin(m, out) {
  const a = m[0], b = m[4], c = m[8], d = m[1], e = m[5], f = m[9], g = m[2], h = m[6], i = m[10];
  const A = e * i - f * h, B = -(d * i - f * g), Cc = d * h - e * g;
  const det = a * A + b * B + c * Cc || 1e-12;
  const r = [ A / det, -(b * i - c * h) / det, (b * f - c * e) / det, B / det, (a * i - c * g) / det, -(a * f - c * d) / det, Cc / det, -(a * h - b * g) / det, (a * e - b * d) / det ];
  const tx = m[12], ty = m[13], tz = m[14];
  out[0] = r[0];
  out[4] = r[1];
  out[8] = r[2];
  out[1] = r[3];
  out[5] = r[4];
  out[9] = r[5];
  out[2] = r[6];
  out[6] = r[7];
  out[10] = r[8];
  out[3] = 0;
  out[7] = 0;
  out[11] = 0;
  out[15] = 1;
  out[12] = -(r[0] * tx + r[1] * ty + r[2] * tz);
  out[13] = -(r[3] * tx + r[4] * ty + r[5] * tz);
  out[14] = -(r[6] * tx + r[7] * ty + r[8] * tz);
  return out;
}

export class Mush {
  constructor(def, pj, anim, m) {
    this.tipo = "MUSH";
    this.def = def;
    this.pj = pj;
    this.anim = anim;
    this.m = m;
    this.ini = def.ini ?? def.estado_inicial ?? 0;
    this.tipoParam = this.ini >> 8 & 15 || def.tipo_param || 0;
    this.param = m.parametros("MUSH", 0);
    this.hp = this.hpMax = this.param.vida;
    this.pos = [ ...def.pos ];
    this.rot = def.rumbo || 0;
    this.posAnt = [ ...this.pos ];
    this.rotAnt = this.rot;
    this.radio = 50;
    this.alto = 60;
    this.centroAlto = 30;
    this.sinPasos = true;
    this.sinSangre = true;
    this.cond = C.NORMAL;
    this.paso = P.INIT;
    this.sub = 0;
    this.golpes = [];
    this.borrado = false;
    this.fase = 0;
    this.escalaObj = 1;
    this.w = {
      crecimiento: 0,
      velCrecer: 0,
      maxCrecer: 0,
      escala: 6,
      marchito: 1,
      transparencia: 0,
      swingH: [ 0, 0 ],
      swingV: [ 0, 0 ],
      swingR: [ 0, 0 ],
      swingRot: 0,
      timer: 0,
      reset: 0,
      resultado: 0,
      ataque: false
    };
    this.nodos = Array.from({
      length: 6
    }, () => [ ...this.pos ]);
    this.nodosAnt = this.nodos.map(n => [ ...n ]);
    this.rotHuesos = HUESOS.map(() => [ 0, 0, 0, 1 ]);
    this.visible = false;
    this.opacidad = 1;
    this._tTick = ahora();
    const clave = def.id3 != null ? String(def.id3) : null;
    this.clave = clave;
    if (clave && MEMORIA.has(clave)) this.extraer(MEMORIA.get(clave)); else if ((this.ini & 15) === 7 && !m.bandera(BANDERA_EVENTO)) this.paso = P.ESPERA_EVENTO;
    const orig = pj?.actualizar?.bind(pj);
    if (orig && pj.huesos) pj.actualizar = dt => {
      const pose = orig(dt);
      this.ponerHuesos();
      return pose;
    };
  }
  caido() {
    return false;
  }
  persigue() {
    return false;
  }
  intocable() {
    return !this.visible || this.cond === C.DEAD || this.cond === C.EVENTO || this.borrado;
  }
  recibir(g) {
    if (!this.intocable()) this.golpes.push(g);
  }
  pasoA(n) {
    this.paso = n;
    this.sub = 0;
  }
  sonido(id, loop) {
    this.m.sonido?.(this, id, loop);
  }
  get crecimiento() {
    return this.w.crecimiento;
  }
  get escala() {
    return this.w.escala;
  }
  extraer(g) {
    this.w.crecimiento = g.crecimiento;
    this.w.velCrecer = g.velCrecer;
    this.w.maxCrecer = g.maxCrecer;
    this.hp = g.hp;
    this.w.reset = 1;
    if (g.cond === C.DEAD) this.cond = C.DEAD;
    this.pasoA(P.INIT);
  }
  conservar() {
    if (!this.clave || (this.ini & 15) === 6 || this.paso === P.ESPERA_EVENTO || this.cond === C.BORRADO) return;
    MEMORIA.set(this.clave, {
      crecimiento: this.w.crecimiento,
      velCrecer: this.w.velCrecer,
      maxCrecer: this.w.maxCrecer,
      hp: this.hp,
      cond: this.cond
    });
  }
  tick() {
    this.posAnt = this.pos;
    this.rotAnt = this.rot;
    this.nodosAnt = this.nodos.map(n => [ ...n ]);
    this._tTick = ahora();
    this._golpes = this.golpes;
    this.golpes = [];
    if (this.borrado) {
      this.visible = false;
      return;
    }
    switch (this.paso) {
     case P.INIT:
      this.iniciar();
      break;

     case P.CRECE:
      this.crecer();
      break;

     case P.PARADO:
      this.parado();
      break;

     case P.MUERE:
      this.morir();
      break;

     case P.ESPERA:
      this.espera();
      break;

     case P.EVENTO:
      this.evento();
      break;

     case P.ESPERA_EVENTO:
      this.esperaEvento();
      break;
    }
    if (this.fase < 2) this.anim.avanzar();
    this.esqueleto();
    this.ataqueContacto();
    this.conservar();
    this.opacidad = Math.max(0, Math.min(1, 1 - this.w.transparencia));
    this.visible = this.w.transparencia < 1 && this.cond !== C.BORRADO;
    const alto = this.w.escala * this.w.crecimiento * this.w.marchito;
    this.alto = Math.max(60, alto);
    this.centroAlto = alto * .7;
  }
  iniciar() {
    const w = this.w;
    if (this.tipoParam === 1) {
      w.velCrecer = (azar01() + 1) * 5;
      w.maxCrecer = azar01() * 100 + 30;
      w.escala = 3;
      w.crecimiento = (azar01() * .1 + .9) * w.maxCrecer;
      this.fase = 1;
      this.escalaObj = azar01() * .2 + .6;
      if (this.pj?.grupo?.scale) this.pj.grupo.scale.setScalar(this.escalaObj);
    } else {
      if (w.reset === 0) {
        w.velCrecer = (azar01() + 1) * 5;
        w.maxCrecer = azar01() * 80 + 60;
        w.crecimiento = azar01() * w.maxCrecer * .8;
        w.reset = 1;
      } else if (w.reset === -1) {
        w.velCrecer = (azar01() + 1) * 5;
        w.crecimiento = 0;
        w.maxCrecer = azar01() * 80 + 60;
        w.reset = 1;
      }
      w.escala = 6;
    }
    const sala = String(this.def.sala ?? this.m.sala?.()?.base ?? this.m.sala?.() ?? "");
    if (sala.startsWith("hs11") && w.crecimiento < 80) w.crecimiento = 80;
    w.marchito = 1;
    w.transparencia = 0;
    if (this.fase < 1 || this.fase > 2) {
      this.anim.poner(A.BROTE, {
        desde: -1
      });
      this.fase = 0;
    } else {
      this.anim.poner(A.BROTE, {
        desde: -1
      });
      this.anim.poner(A.ABRE, {
        desde: -1
      });
    }
    this.esqueletoInicial();
    let paso;
    if ((this.ini & 15) === 6) {
      w.crecimiento = w.maxCrecer;
      paso = P.EVENTO;
    } else if (this.cond === C.DEAD || (this.ini & 240) === 112) {
      w.crecimiento = 0;
      w.marchito = 0;
      paso = P.ESPERA;
    } else paso = this.fase === 0 ? P.CRECE : P.PARADO;
    this.pasoA(paso);
    w.swingV[0] = -(w.crecimiento * w.escala);
  }
  esqueletoInicial() {
    const w = this.w, k = w.escala * w.crecimiento / 6, [x, y, z] = this.pos;
    for (let i = 0; i < 6; i++) this.nodos[i] = [ x, y - k * (i + 1), z ];
    this.nodosAnt = this.nodos.map(n => [ ...n ]);
    w.swingH = [ 0, 0 ];
    w.swingV = [ 0, 0 ];
    w.swingR = [ 0, 0 ];
    w.swingRot = 0;
  }
  crecer() {
    const w = this.w;
    if (this.sub === 0) {
      this.sonido(SE.LOOP, true);
      this.sub = 1;
    }
    const g = w.crecimiento + DT * w.velCrecer;
    if (this.fase === 0) {
      if ((azar01() * .3 + .7) * w.maxCrecer < g) {
        this.fase = 1;
        this.anim.poner(A.ABRE);
      }
    } else if (this.anim.fin) this.pasoA(P.PARADO);
    w.crecimiento = Math.min(g, w.maxCrecer);
    this.revisarGolpe();
  }
  parado() {
    if (this.sub === 0) {
      this.sonido(SE.LOOP, true);
      this.fase = 2;
      this.sub = 1;
    }
    this.revisarGolpe();
  }
  revisarGolpe() {
    const r = this.w.resultado;
    if (r === 1 || r === 3) {
      this.cond = C.DEAD;
      this.pasoA(P.MUERE);
      return;
    }
    if (this._golpes?.length) this.pasoA(P.MUERE);
  }
  morir() {
    const w = this.w;
    switch (this.sub) {
     case 0:
      this.cond = C.DEAD;
      this.sonido(null, true);
      this.sonido(SE.REVIENTA);
      w.timer = 0;
      this.sub = 1;

     case 1:
      w.timer -= DT;
      if (w.timer <= 0) {
        this.reventar();
        w.timer = .1;
      }
      w.marchito -= DT * 4;
      if (w.marchito <= 0) {
        w.marchito = 0;
        this.sub = 2;
      }
      break;

     case 2:
      w.transparencia += DT * 2;
      if (w.transparencia >= 1) {
        w.transparencia = 1;
        w.timer = azar01() * 180 + 60;
        this.sub = 3;
      }
      break;

     case 3:
      w.timer -= DT;
      if (w.timer <= 0) this.pasoA(P.ESPERA);
    }
  }
  reventar() {
    const w = this.w, p = this.nodos[4], tam = w.escala * 75;
    const fx = this.m.efectos || globalThis.sh4?.efectos;
    if (this.m.esporas) {
      this.m.esporas(this, [ ...p ], [ 0, w.crecimiento * w.escala * .01, 0 ], tam);
      return;
    }
    try {
      fx?.disparar?.("sangre", {
        posMundo: [ -p[0] * ESCALA_VISOR, -p[1] * ESCALA_VISOR, p[2] * ESCALA_VISOR ],
        dir: [ 0, 1, 0 ],
        tam: tam
      });
    } catch {}
  }
  espera() {
    const w = this.w;
    if (this.sub === 0) {
      this.esconder();
      w.timer = azar01() * 180 + 10;
      this.sub = 1;
      return;
    }
    w.timer -= DT;
    if (w.timer > 0) return;
    this.revivir();
  }
  esperaEvento() {
    const w = this.w;
    if (this.sub === 0) {
      this.esconder();
      w.timer = azar01() * 3;
      this.sub = 1;
      return;
    }
    if (!this.m.bandera(BANDERA_EVENTO)) return;
    w.timer -= DT;
    if (w.timer > 0) return;
    this.revivir();
  }
  esconder() {
    this.w.transparencia = 1;
    this.cond = C.DEAD;
    this.fase = 0;
    this.anim.poner(A.BROTE, {
      desde: -1
    });
  }
  revivir() {
    this.cond = C.NORMAL;
    this.hp = Math.min(this.hpMax, this.hp + this.hpMax);
    this.w.reset = -1;
    this.pasoA(P.INIT);
  }
  evento() {
    if (this.sub === 0) {
      this.cond = C.EVENTO;
      this.sonido(SE.LOOP, true);
      this.anim.poner(A.ABRE, {
        desde: -1
      });
      this.sub = 1;
    }
    if (this.m.banderaEnemigo?.(3)) {
      this.borrado = true;
      this.sonido(null, true);
    }
  }
  esqueleto() {
    const w = this.w;
    let alto = w.escala * w.crecimiento;
    if (w.marchito === 0) alto = 0; else if (this.cond !== C.DEAD) {
      resorte(w.swingH, 0, alto * .01, alto * .005, .05, .98);
      resorte(w.swingR, 0, .0087266, 17453e-8, .1, .9);
    }
    const j = this.m.jugador?.();
    const d = j?.existe ? dist3(this.pos, j.pos) : 1e9;
    if (d > 400 && this.cond !== C.EVENTO) w.swingH[0] *= .95;
    resorte(w.swingV, -alto, alto * .005, alto * .001, .05, .98);
    w.swingRot = envolver(w.swingRot + w.swingR[0]);
    const dir = [ Math.sin(w.swingRot), 0, Math.cos(w.swingRot) ];
    const yOff = w.marchito * w.swingV[0];
    const [bx, by, bz] = this.pos;
    if (Math.abs(w.swingH[0]) > 1 && this.m.lineaDeVista) {
      const desde = [ bx, by + yOff, bz ], largo = w.swingH[0] + 40;
      const punto = L => [ bx + dir[0] * L, by + yOff, bz + dir[2] * L ];
      if (largo > 0 && !this.m.lineaDeVista(desde, punto(largo))) {
        let lo = 0, hi = largo;
        for (let k = 0; k < 6; k++) {
          const mid = (lo + hi) / 2;
          if (this.m.lineaDeVista(desde, punto(mid))) lo = mid; else hi = mid;
        }
        w.swingH[0] = lo - 40;
        w.swingH[1] = 0;
      }
    }
    const h = w.swingH[0] * w.marchito;
    this.nodos[5] = [ bx + dir[0] * h, by + yOff, bz + dir[2] * h ];
    for (let i = 4; i >= 0; i--) {
      const f = i / (i + 1), sup = this.nodos[i + 1], n = this.nodos[i];
      for (let k = 0; k < 3; k++) {
        const obj = (sup[k] - this.pos[k]) * f + this.pos[k];
        n[k] += (obj - n[k]) * .2;
      }
    }
  }
  ataqueContacto() {
    const w = this.w;
    if (this.cond === C.DEAD || this.cond === C.EVENTO || this.borrado) {
      w.ataque = false;
      w.resultado = 0;
      return;
    }
    w.ataque = true;
    if (w.resultado) return;
    const j = this.m.jugador?.();
    if (!j?.existe) return;
    const alto = w.escala * w.crecimiento;
    if (alto < 1) return;
    const l = girarY([ j.pos[0] - this.pos[0], 0, j.pos[2] - this.pos[2] ], -this.rot);
    const dx = Math.max(0, Math.abs(l[0]) - 24), dz = Math.max(0, Math.abs(l[2]) - 24);
    if (Math.hypot(dx, dz) > (this.m.radioJugador ?? 40)) return;
    if (j.pos[1] < this.pos[1] - alto || j.pos[1] - ALTO_HENRY > this.pos[1]) return;
    w.resultado = 1;
    this.m.golpear?.(this, this.param.ataque1, "BAK_MUSH_DEATH");
  }
  ponerHuesos() {
    const hs = this.pj?.huesos;
    if (!hs || hs.length < 7 || !this.visible) return;
    const alfa = Math.max(0, Math.min(1, (ahora() - this._tTick) / (DT * 1e3)));
    const N = this.nodos.map((n, i) => n.map((v, k) => this.nodosAnt[i][k] + (v - this.nodosAnt[i][k]) * alfa));
    const loc = p => girarY([ p[0] - this.pos[0], p[1] - this.pos[1], p[2] - this.pos[2] ], -this.rot);
    const A3 = [ ...hs[3].matrix.elements ], M = new Array(16);
    for (const i of HUESOS) {
      const t = loc(N[i]);
      if (this.cond !== C.DEAD) {
        const s = loc(N[i + 1]);
        const d = [ s[0] - t[0], s[1] - t[1], s[2] - t[2] ];
        if (d[1] > -1) d[1] = -1;
        this.rotHuesos[i] = cuatDesdeArriba(d);
      }
      matriz(this.rotHuesos[i], t, M);
      const e = hs[i].matrix.elements;
      for (let k = 0; k < 16; k++) e[k] = M[k];
      hs[i].matrixWorldNeedsUpdate = true;
    }
    const rel = mult(hs[3].matrix.elements, invertirAfin(A3, new Array(16)), new Array(16));
    for (let i = 4; i < Math.min(7, hs.length); i++) {
      const e = hs[i].matrix.elements;
      mult(rel, e, e);
      hs[i].matrixWorldNeedsUpdate = true;
    }
  }
}
