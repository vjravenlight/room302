// SH4 web — FeniXVOID · Project Ravenlight
import { FPS, DT, envolver, rumboHacia, frente, dist3, distXZ, girarY, azar01 } from "./comun.js";

const AMORT_HITBACK = (30 / 31) ** 8;

export const C = {
  NORMAL: 1,
  CAUTION: 2,
  CHASE: 3,
  ESCAPE: 4,
  BATTLE: 5,
  RISE: 8,
  DAMAGE: 9,
  DYING: 10,
  DEAD: 11,
  NADA: 16,
  EVENT: 18
};

export const P = {
  INIT: 0,
  WANDER: 1,
  POSE: 2,
  DASH: 3,
  CAUTION: 4,
  INTERVAL: 5,
  APPROACH: 6,
  ATTACK: 7,
  JUMPATTACK: 8,
  BACKATTACK: 9,
  ESCAPE: 10,
  DAMAGE: 11,
  DOWN: 12,
  DEAD: 13,
  EVENT: 14,
  TEST: 15
};

export const NOMBRE_PASO = [ "Init", "Wander", "Pose", "Dash", "Caution", "Interval", "Approach", "Attack", "JumpAttack", "BackAttack", "Escape", "Damage", "Down", "Dead", "Event", "Test" ];

export const A = {
  NT: 0,
  LOOK: 1,
  POINT: 2,
  PEND: 3,
  WLK: 4,
  TURN: 5,
  RUN: 6,
  DMP1: 7,
  DMP2: 8,
  DMS1: 9,
  DMS2: 10,
  XXP1: 11,
  XXP2: 12,
  XXS1: 13,
  XXS2: 14,
  DNT: 15,
  UP: 16,
  ROT: 17,
  ATT1: 18,
  ATT2: 19,
  ATT3: 20
};

export const NOMBRES_ANIM_TWINS = Object.keys(A);

export const PARTE_MODELO = def => (def.tipo_param || 0) & 1;

const SON = {
  DOLOR: 60501,
  PASO: 60502,
  VOZ: 60503,
  MUERTE: 60504,
  ATAQUE: 60505,
  VAGA: 60507,
  GOLPE: 60508,
  CAE: 60509,
  GEMIDO: 61506
};

const PIE = {
  [A.WLK]: [ 11, 41 ],
  [A.RUN]: [ 6, 16 ]
};

const GOLPE = {
  86: {
    golpe: "BAK_TWN_STRIKE",
    danio: 10,
    shock: 50,
    hueso: 16
  },
  87: {
    golpe: "BAK_TWN_JUMP",
    danio: 15,
    shock: 80,
    hueso: -1
  },
  88: {
    golpe: "BAK_TWN_TURN",
    danio: 10,
    shock: 50,
    hueso: 21
  }
};

const RADIO_GOLPE = 120;

const ESPERA_ATAQUE = [ 4, 3, 2.5, 0, 0 ];

const HUESO_CENTRO = 9;

const ST = {
  READY: 3,
  LOCK: 4,
  ATTACK: 5,
  DAMAGE: 6,
  EVENT: 7,
  GODMODE: 9,
  DEAD: 10
};

const ITEM_PISTOLA = 16, ITEM_REVOLVER = 17;

const azarS = () => Math.random() * 2 - 1;

const sumar = (a, b) => [ a[0] + b[0], a[1] + b[1], a[2] + b[2] ];

const compartido = new WeakMap;

function estadoDe(m) {
  let s = compartido.get(m);
  if (!s) {
    s = {
      gemelas: [],
      avisos: [],
      reloj: 0
    };
    compartido.set(m, s);
  }
  return s;
}

export class Twins {
  constructor(def, pj, anim, m) {
    this.tipo = "TWINS";
    this.def = def;
    this.pj = pj;
    this.anim = anim;
    this.m = m;
    this.tipoParam = def.tipo_param || 0;
    this.variante = this.tipoParam & 1;
    this.escala = this.tipoParam > 1 ? .75 : 1;
    if (this.escala !== 1) try {
      pj?.grupo?.scale?.setScalar?.(this.escala);
    } catch {}
    this.param = m.parametros("TWINS", this.variante);
    this.hp = this.hpMax = this.param.vida;
    this.aguante = this.aguanteMax = this.param.aguante;
    this.pos = [ ...def.pos ];
    this.rot = def.rumbo || 0;
    this.posAnt = [ ...this.pos ];
    this.rotAnt = this.rot;
    this.radio = 100 * this.escala;
    this.altoJuego = 160;
    this.alto = 320 * this.escala;
    this.centroAlto = 250 * this.escala;
    this.centro = [ this.pos[0], this.pos[1] - this.centroAlto, this.pos[2] ];
    this.sinPasos = true;
    this.cond = C.NORMAL;
    this.paso = P.INIT;
    this.sub = 0;
    this.ini = (def.estado_inicial ?? 0) & 15;
    this.w = {
      objetivo: [ ...this.pos ],
      hitback: [ 0, 0, 0 ],
      moveSpeed: 0,
      timer: 0,
      attackTimer: 0,
      finishCount: 0,
      attackKind: 0,
      firstPose: 1,
      setBlood: 0,
      trabado: 0,
      tTrabado: 0,
      ultimoGolpe: null,
      cuadros: 0,
      gimiendo: false
    };
    this.golpes = [];
    this.danioPend = null;
    this.eds = [];
    this.edUsado = false;
    this.mov = [ 0, 0, 0 ];
    this.tAnt = 0;
    this.tAhora = 0;
    const s = estadoDe(m);
    if (s.gemelas.some(g => g.w.cuadros > 0)) {
      s.gemelas = [];
      s.avisos = [];
      s.reloj = 0;
    }
    s.gemelas.push(this);
    this.comp = s;
    this.animSet(A.NT);
  }
  caido() {
    return this.paso === P.DOWN || this.paso === P.DAMAGE && (this.sub === 2 || this.sub === 5);
  }
  persigue() {
    return [ P.DASH, P.CAUTION, P.INTERVAL, P.APPROACH, P.ATTACK, P.JUMPATTACK, P.BACKATTACK, P.DAMAGE, P.DOWN ].includes(this.paso) || this.paso === P.POSE && this.sub !== 6;
  }
  intocable() {
    return this.cond === C.DEAD || this.paso === P.DEAD || this.paso === P.EVENT;
  }
  get sinSangre() {
    return false;
  }
  recibir(g) {
    this.golpes.push(g);
  }
  pasoA(n) {
    this.paso = n;
    this.sub = 0;
  }
  jugador() {
    return this.m.jugador();
  }
  sonido(id, loop) {
    this.m.sonido?.(this, id, loop);
  }
  nivelDificultad() {
    return Math.max(0, Math.min(4, this.m.nivel ?? 1));
  }
  animSet(n, {vel: vel = 1, reiniciar: reiniciar = false} = {}) {
    if (reiniciar || this.anim.n !== n) {
      this.anim.poner(n);
      if (n === A.WLK || n === A.RUN) this.w.moveSpeed = 0;
    }
    this.anim.velocidad(vel);
  }
  terminada() {
    return this.anim.n < 0 || this.anim.fin || this.anim.loop && this.anim.vuelta;
  }
  terminaPronto(s = .5) {
    const a = this.anim;
    if (a.n < 0 || a.fin) return true;
    if (a.loop) return false;
    const v = Math.abs(a.vel) || 1, n = s * FPS * v;
    return a.vel >= 0 ? a.dur - a.t <= n : a.t <= n;
  }
  progreso() {
    return this.anim.t / this.anim.dur;
  }
  cuadro() {
    return this.anim.cuadro;
  }
  pasaCuadro(n) {
    return this.tAnt < n && this.tAhora >= n;
  }
  pisaWlk() {
    const p = this.progreso();
    return p > .3 && p < .5 || p > .8;
  }
  pisaRun() {
    const p = this.progreso();
    return p > .4 && p < .5 || p > .9;
  }
  dXZ() {
    const j = this.jugador();
    return j.existe ? distXZ(this.pos, j.pos) : 1e9;
  }
  d3() {
    const j = this.jugador();
    return j.existe ? dist3(this.pos, j.pos) : 1e9;
  }
  cosJugador() {
    const j = this.jugador();
    if (!j.existe) return -1;
    const f = frente(this.rot), dx = j.pos[0] - this.pos[0], dz = j.pos[2] - this.pos[2], L = Math.hypot(dx, dz) || 1;
    return (f[0] * dx + f[2] * dz) / L;
  }
  jugadorMira() {
    const j = this.jugador();
    if (!j.existe) return -1;
    const f = frente(j.rot), dx = this.pos[0] - j.pos[0], dz = this.pos[2] - j.pos[2], L = Math.hypot(dx, dz) || 1;
    return (f[0] * dx + f[2] * dz) / L;
  }
  apuntado() {
    const j = this.jugador();
    if (!j.existe || !(j.estado > 2 && j.estado < 6)) return 0;
    if (this.m.objetivoJugador) {
      const o = this.m.objetivoJugador();
      return o && (o === this || o.enemigo === this) ? 1 : 2;
    }
    const a = Math.abs(envolver(rumboHacia(this.pos, j.pos) - j.rot));
    return a < .349 && distXZ(this.pos, j.pos) < 2e3 ? 1 : 2;
  }
  armaDeFuego() {
    if (typeof this.m.armaDeFuego === "function") return !!this.m.armaDeFuego();
    try {
      const k = globalThis.sh4?.henry?.controlador?.s?.arma;
      return k === ITEM_PISTOLA || k === ITEM_REVOLVER;
    } catch {
      return false;
    }
  }
  jugadorAtacando() {
    return this.jugador().estado === ST.ATTACK;
  }
  jugadorMeAtaca() {
    return this.jugador().estado === ST.ATTACK && this.apuntado() === 1;
  }
  jugadorCorre() {
    const j = this.jugador();
    return !!j.existe && !!j.corriendo;
  }
  jugadorAtacable() {
    const j = this.jugador();
    if (!j.existe || [ ST.DAMAGE, ST.EVENT, ST.GODMODE, ST.DEAD ].includes(j.estado)) return false;
    return (this.m.relojAtaque?.() ?? this.comp.reloj) >= 5;
  }
  seVe(a, b) {
    return this.m.lineaDeVista ? !!this.m.lineaDeVista(a, b) : true;
  }
  fueraDePantalla() {
    if (typeof this.m.enPantalla === "function") return !this.m.enPantalla(this);
    const j = this.jugador();
    if (!j.existe) return true;
    return !(this.jugadorMira() > .64 && distXZ(this.pos, j.pos) < 6e3 && this.seVe(this.centro, [ j.pos[0], j.pos[1] - 150, j.pos[2] ]));
  }
  puedeAtacar() {
    const j = this.jugador();
    if (this.w.attackTimer > 0 || !j.existe) return false;
    if (!this.seVe(this.centro, [ j.pos[0], j.pos[1] - 150, j.pos[2] ])) return false;
    return this.jugadorAtacable() && !this.hayAviso(8, 2, this.centro);
  }
  ponerEsperaAtaque() {
    this.aviso(8, 2, this.centro, 2e3, 1);
    this.w.attackTimer = ESPERA_ATAQUE[this.nivelDificultad()];
  }
  aviso(kind, tipo, pos, radio, t) {
    this.comp.avisos.push({
      kind: kind,
      tipo: tipo,
      pos: [ ...pos ],
      radio: radio,
      t: t,
      de: this
    });
  }
  hayAviso(kind, tipo, pos) {
    let mejor = null, dm = Infinity;
    for (const a of this.comp.avisos) {
      if (a.t <= 0 || a.tipo !== tipo || kind != null && a.kind !== kind) continue;
      const d = dist3(a.pos, pos);
      if (d <= a.radio && d < dm) {
        dm = d;
        mejor = a;
      }
    }
    return mejor;
  }
  quitar(d) {
    this.hp -= d;
    if (this.hp <= 0) {
      this.hp = 0;
      this.aguante = 0;
      return 0;
    }
    this.aguante = Math.max(0, this.aguante - d);
    return this.aguante;
  }
  curar(d) {
    this.hp = Math.min(this.hpMax, this.hp + d);
    this.aguante = Math.min(this.hp, this.aguanteMax);
  }
  pruebaVida(a, b) {
    return (b - a) * azar01() + a < this.hp / this.hpMax * 100;
  }
  recuperar() {
    this.aguante = Math.min(this.aguanteMax, this.hp, this.aguante + this.param.recupera * DT);
  }
  girar(u) {
    this.rot = envolver(this.rot + u);
  }
  girarHacia(p, u) {
    this.girar(Math.max(-u, Math.min(u, envolver(rumboHacia(p, this.pos) - this.rot))));
  }
  girarHaciaJugador(u) {
    const j = this.jugador();
    if (j.existe) this.girarHacia(j.pos, u);
  }
  avanzar(v) {
    const f = frente(this.rot, v * DT);
    this.mov[0] += f[0];
    this.mov[2] += f[2];
  }
  multTrabado(k) {
    return this.w.trabado ? k : 1;
  }
  camino(dest) {
    if (typeof this.m.camino === "function") return this.m.camino(this, dest);
    return dest;
  }
  puntoAlAzar(escape) {
    if (typeof this.m.puntoAlAzar === "function") {
      const p = this.m.puntoAlAzar(this, {
        escape: escape
      });
      if (p) return p;
    }
    const j = this.jugador(), ref = escape && j.existe ? j.pos : this.pos;
    let p = null;
    for (let i = 0; i < 100; i++) {
      const a = azar01() * 2 * Math.PI, d = 1e3 + azar01() * 1500;
      const q = [ this.pos[0] + Math.sin(a) * d, this.pos[1], this.pos[2] + Math.cos(a) * d ];
      const y = this.m.piso ? this.m.piso(q, 200, 400) : undefined;
      if (y === null) continue;
      if (y != null) q[1] = y;
      p = q;
      if (this.m.mismaParticion && !this.m.mismaParticion(this, q)) continue;
      if (distXZ(q, ref) <= 1e3) continue;
      if (!this.seVe(this.centro, [ q[0], q[1] - 100, q[2] ])) continue;
      if (escape && j.existe && this.seVe([ j.pos[0], j.pos[1] - 150, j.pos[2] ], [ q[0], q[1] - 100, q[2] ])) continue;
      return q;
    }
    return p || [ ...this.pos ];
  }
  hueso(i) {
    const r = this.pj?.reproductor, lugar = r?.enElLugar;
    try {
      if (r.anim !== this.anim.anim) r.poner(this.anim.anim);
      r.t = this.anim.t;
      r.loop = this.anim.loop;
      r.enElLugar = false;
      const pose = r.avanzar(0);
      const e = this.escala;
      return sumar(this.pos, girarY([ pose.absPos[i * 3] * e, pose.absPos[i * 3 + 1] * e, pose.absPos[i * 3 + 2] * e ], this.rot));
    } catch {
      const t = {
        9: [ 0, -251, 0 ],
        16: [ 10, -150, 340 ],
        21: [ 40, -265, 300 ]
      }[i] || [ 0, -200, 0 ];
      return sumar(this.pos, girarY(t.map(v => v * this.escala), this.rot));
    } finally {
      if (r && lugar !== undefined) r.enElLugar = lugar;
    }
  }
  tocaJugador(c, r) {
    const j = this.jugador();
    if (!j.existe || [ ST.EVENT, ST.GODMODE, ST.DEAD ].includes(j.estado)) return false;
    return distXZ(c, j.pos) <= r + (this.m.radioJugador ?? 40) && c[1] <= j.pos[1] + r && c[1] >= j.pos[1] - 360 - r;
  }
  esferaGolpe() {
    const k = this.w.attackKind, g = GOLPE[k];
    if (!g) return false;
    const c = g.hueso < 0 ? this.pos : this.hueso(g.hueso);
    if (!this.tocaJugador(c, RADIO_GOLPE * this.escala)) return false;
    const j = this.jugador();
    this.m.golpear?.(this, g.danio, g.golpe, {
      shock: g.shock,
      dir: frente(rumboHacia(j.pos, this.pos))
    });
    this.w.attackKind = 0;
    return true;
  }
  terminarAtaque() {
    this.w.attackKind = 0;
  }
  pararGemido() {
    if (this.w.gimiendo) {
      this.w.gimiendo = false;
      this.sonido(null, true);
    }
  }
  sonidoDanio() {
    this.sonido(this.hp > 0 ? SON.DOLOR : SON.MUERTE);
  }
  charco() {
    this.m.charco?.(this, 200, false);
  }
  enPozo() {
    return typeof this.m.enPozo === "function" ? !!this.m.enPozo(this.pos) : false;
  }
  edPaso(prueba, n) {
    this.eds.push(() => {
      if (prueba() && this.tomarED()) this.pasoA(n);
    });
  }
  edLlamar(prueba, f) {
    this.eds.push(() => {
      if (prueba()) f();
    });
  }
  tomarED() {
    if (this.edUsado) return false;
    this.edUsado = true;
    return true;
  }
  tick() {
    this.posAnt = [ ...this.pos ];
    this.rotAnt = this.rot;
    this.mov = [ 0, 0, 0 ];
    this.eds.length = 0;
    this.edUsado = false;
    const s = this.comp, w = this.w;
    w.cuadros++;
    if (s.gemelas[0] === this) {
      s.reloj += DT;
      for (const a of s.avisos) a.t -= DT;
      s.avisos = s.avisos.filter(a => a.t > 0);
    }
    if (this.golpes.length) {
      this.danioPend = this.juntarGolpes(this.golpes, this.danioPend);
      this.golpes.length = 0;
    }
    this.control();
    this.tAnt = this.anim.t;
    this.anim.avanzar();
    this.tAhora = this.anim.t;
    if (this.anim.vuelta) this.tAnt -= this.anim.dur;
    for (const f of this.eds) f();
    this.eds.length = 0;
    if (this.danioPend && !(this.paso === P.DAMAGE && this.sub === 0)) this.danioPend = null;
    this.pasos();
    const hb = w.hitback;
    this.mov[0] += hb[0] * DT;
    this.mov[2] += hb[2] * DT;
    hb[0] *= AMORT_HITBACK;
    hb[1] *= AMORT_HITBACK;
    hb[2] *= AMORT_HITBACK;
    const L = Math.hypot(this.mov[0], this.mov[2]), x0 = this.pos[0], z0 = this.pos[2];
    if (this.m.mover) this.m.mover(this, this.mov[0], this.mov[2]); else {
      this.pos[0] += this.mov[0];
      this.pos[2] += this.mov[2];
    }
    const hecho = Math.hypot(this.pos[0] - x0, this.pos[2] - z0);
    w.trabado = L > 1 && hecho < L * .3 ? 1 : 0;
    w.tTrabado = w.trabado ? w.tTrabado + DT : 0;
    const c = this.paso === P.DEAD ? null : this.hueso(HUESO_CENTRO);
    if (c) {
      this.centro = c;
      this.centroAlto = this.pos[1] - c[1];
    }
  }
  pasos() {
    const cs = PIE[this.anim.n];
    if (!cs || this.anim.vel <= 0) return;
    for (const c of cs) if (this.tAnt < c && this.tAhora >= c) this.sonido(SON.PASO);
  }
  juntarGolpes(lista, previo = null) {
    let total = previo?.danio || 0, fuerte = previo?.fuerte || null;
    for (const g of lista) {
      total += g.danio || 0;
      if (!fuerte || (g.danio || 0) >= (fuerte.danio || 0)) fuerte = g;
    }
    return {
      ...fuerte,
      danio: total,
      fuerte: fuerte
    };
  }
  control() {
    const w = this.w;
    this.revisarDanio();
    switch (this.paso) {
     case P.INIT:
      this.controlInit();
      break;

     case P.WANDER:
      this.controlWander();
      break;

     case P.POSE:
      this.controlPose();
      break;

     case P.DASH:
      this.controlDash();
      break;

     case P.CAUTION:
      this.controlCaution();
      break;

     case P.INTERVAL:
      this.controlInterval();
      break;

     case P.APPROACH:
      this.controlApproach();
      break;

     case P.ATTACK:
      this.controlAttack();
      break;

     case P.JUMPATTACK:
      this.controlJumpAttack();
      break;

     case P.BACKATTACK:
      this.controlBackAttack();
      break;

     case P.ESCAPE:
      this.controlEscape();
      break;

     case P.DAMAGE:
      this.controlDamage();
      break;

     case P.DOWN:
      this.controlDown();
      break;

     case P.DEAD:
      this.controlDead();
      break;

     case P.EVENT:
      this.controlEvent();
      break;

     default:
      break;
    }
    if (w.attackKind && this.cond !== C.BATTLE) this.terminarAtaque();
    w.moveSpeed = Math.min(1, w.moveSpeed + 2 * DT);
    w.attackTimer = Math.max(0, w.attackTimer - DT);
    if (this.cond < C.DAMAGE || this.cond > C.DEAD) this.recuperar();
  }
  revisarDanio() {
    if (!this.danioPend || this.paso === P.DEAD || this.paso === P.EVENT) return;
    if (this.paso === P.DAMAGE) this.edLlamar(() => !!this.danioPend, () => this.danioAdicional()); else if (this.paso === P.DOWN) {
      if (this.cond === C.RISE) this.edLlamar(() => !!this.danioPend, () => {
        this.quitar(this.danioPend.danio);
        this.danioPend = null;
      }); else this.edLlamar(() => !!this.danioPend, () => this.danioEnElPiso());
    } else this.edPaso(() => !!this.danioPend, P.DAMAGE);
  }
  controlInit() {
    if (this.ini === 6) this.pasoA(P.EVENT); else if (this.w.firstPose) this.pasoA(P.POSE); else this.pasoA(P.WANDER);
  }
  controlWander() {
    const w = this.w;
    if (this.sub === 0) {
      this.cond = C.NORMAL;
      this.animSet(A.WLK);
      this.sub = 1;
    }
    if (this.sub === 1) {
      w.objetivo = this.puntoAlAzar(false);
      if (azar01() < .01) this.sonido(SON.VAGA);
      this.sub = 2;
    }
    if (this.sub === 2) {
      const p = this.camino(w.objetivo);
      let otro = true;
      if (p) {
        this.girarHacia(p, DT * 1.5707964 * this.multTrabado(4));
        otro = distXZ(this.pos, w.objetivo) < 400;
      }
      if (w.tTrabado > 2) otro = true;
      if (otro) this.sub = 1;
    }
    this.avanzar(w.moveSpeed * 200);
    if (this.pisaWlk()) {
      if (this.dXZ() < 560 * this.escala) {
        this.pasoA(P.CAUTION);
        return;
      }
      if (!this.fueraDePantalla()) this.armarVista();
    }
  }
  armarVista() {
    this.edPaso(() => this.veJugador(), P.DASH);
  }
  veJugador() {
    const j = this.jugador();
    if (!j.existe) return false;
    const cerca = this.hayAviso(null, 3, this.pos) ? 2e3 : this.jugadorCorre() ? 1500 : 1e3;
    const d = dist3(this.pos, j.pos), a = Math.abs(envolver(rumboHacia(j.pos, this.pos) - this.rot));
    if (!(d <= 3e3 && a <= 1.0471976 || d <= cerca)) return false;
    const ojo = [ this.pos[0], this.pos[1] - 160 * this.escala - 100, this.pos[2] ];
    return this.seVe(ojo, [ j.pos[0], j.pos[1] - 150, j.pos[2] ]);
  }
  controlPose() {
    const w = this.w;
    switch (this.sub) {
     case 0:
      {
        this.cond = C.CAUTION;
        w.timer = azar01() + 1;
        if (w.firstPose) {
          this.animSet(A.POINT);
          this.sub = 6;
          break;
        }
        const cos = this.cosJugador();
        if (cos < 0 || azar01() < .5 && this.jugadorMira() < 0) {
          this.animSet(A.LOOK);
          this.sonido(SON.VOZ);
          this.sub = 3;
          break;
        }
        if (cos > .8660254 && this.puedeAtacar() && this.dXZ() < 1e3 && azar01() < .2) {
          this.pasoA(P.JUMPATTACK);
          break;
        }
        if (this.apuntado() === 1 && this.armaDeFuego()) {
          this.pasoA(P.ESCAPE);
          break;
        }
        this.animSet(A.POINT);
        this.sub = 1;
        break;
      }

     case 1:
      if (this.pasaCuadro(50)) this.sonido(SON.VOZ);
      if (!this.terminada()) break;
      if (this.apuntado() === 1 && this.armaDeFuego() && azar01() < .1) {
        this.animSet(A.PEND);
        this.sub = 5;
        break;
      }
      if (this.fueraDePantalla()) {
        w.timer -= DT;
        if (w.timer > 0) break;
      }
      this.animSet(A.PEND);
      this.sub = 2;
      break;

     case 2:
      this.edPaso(() => this.terminaPronto(.5), P.DASH);
      break;

     case 3:
      if (!this.terminada()) return;
      if (this.cosJugador() < 0) {
        this.animSet(A.TURN, {
          vel: azar01() * .5 + 1
        });
        this.sub = 4;
      } else {
        this.animSet(A.POINT);
        this.sub = 1;
      }
      return;

     case 4:
      if (this.terminada()) {
        this.animSet(A.POINT);
        this.sub = 1;
      }
      this.girar(-1.5707964 * DT);
      return;

     case 5:
      this.edPaso(() => this.terminaPronto(.5), P.ESCAPE);
      return;

     case 6:
      {
        const d = this.d3();
        let salir = d < 560;
        if (!salir) {
          let avisos = true;
          if (d < 1400 && !this.fueraDePantalla()) {
            w.timer -= DT;
            if (w.timer <= 0) {
              salir = true;
              avisos = false;
            }
          }
          if (avisos) {
            const av = this.hayAviso(null, 3, this.pos);
            if (av && this.seVe(this.centro, [ av.pos[0], av.pos[1], av.pos[2] ])) salir = true;
          }
        }
        if (salir) {
          w.firstPose = 0;
          this.animSet(A.PEND);
          this.sub = 2;
        }
        break;
      }
    }
    this.girarHaciaJugador(DT * 1.0471976);
  }
  controlDash() {
    const w = this.w, j = this.jugador();
    switch (this.sub) {
     case 0:
      this.cond = C.CHASE;
      this.animSet(A.RUN);
      this.sub = 1;

     case 1:
      {
        w.objetivo = [ ...j.pos ];
        const p = j.existe ? this.camino(w.objetivo) : null;
        if (!p) {
          this.pasoA(P.WANDER);
          return;
        }
        this.girarHacia(p, DT * 1.5707964 * this.multTrabado(4));
        if (this.pisaRun()) {
          const dx = j.pos[0] - this.pos[0], dz = j.pos[2] - this.pos[2], d2 = dx * dx + dz * dz;
          let salto = false;
          if (this.apuntado() === 1 && d2 < 1e6) {
            if (this.armaDeFuego()) salto = true; else if (!this.jugadorAtacando()) {
              this.cond = C.BATTLE;
              this.animSet(A.ATT3, {
                reiniciar: true
              });
              w.attackKind = 88;
              this.sub = 3;
            } else {
              this.animSet(A.NT);
              this.sub = 2;
            }
          } else if (d2 < (560 * this.escala) ** 2 && this.puedeAtacar()) {
            this.pasoA(P.ATTACK);
            if (this.jugadorCorre() && this.jugadorMira() < -.9659258) salto = true;
          }
          if (salto) this.pasoA(P.JUMPATTACK);
        }
        this.avanzar(w.moveSpeed * 1e3);
        return;
      }

     case 2:
      if (!this.jugadorMeAtaca()) this.pasoA(P.APPROACH);
      return;

     case 3:
      this.giroAtaque(true, P.INTERVAL);
      return;
    }
  }
  giroAtaque(deEspaldas, siguiente) {
    const w = this.w;
    if (this.pasaCuadro(16)) this.sonido(SON.ATAQUE);
    const f = this.cuadro();
    if (w.attackKind && f > 11) this.esferaGolpe();
    if (w.attackKind && f > 28) this.terminarAtaque();
    if (this.terminaPronto(.5)) {
      this.terminarAtaque();
      this.pasoA(siguiente);
    }
    let u = 0;
    if (f >= 2 && f < 22) u = DT * 4.712389; else if (f >= 22) {
      const j = this.jugador();
      const obj = j.existe ? rumboHacia(j.pos, this.pos) + (deEspaldas ? Math.PI : 0) : this.rot;
      u = Math.max(-Math.PI * DT, Math.min(Math.PI * DT, envolver(obj - this.rot)));
    }
    this.girar(u);
  }
  controlCaution() {
    const w = this.w, j = this.jugador();
    if (this.sub === 0) {
      this.cond = C.CAUTION;
      if (this.apuntado() === 1 && this.armaDeFuego()) {
        this.pasoA(P.ESCAPE);
        return;
      }
      if (this.cosJugador() < -.70710677 && this.dXZ() < 400 * this.escala) {
        this.pasoA(P.BACKATTACK);
        return;
      }
      if (this.pruebaVida(0, 100)) {
        this.pasoA(P.APPROACH);
        return;
      }
      this.animSet(A.TURN, {
        vel: azar01() * .5 + 1
      });
      this.sub = 1;
      return;
    }
    if (this.sub === 1) {
      this.girarTurn(j.existe ? rumboHacia(this.pos, j.pos) : this.rot);
      if (this.terminada()) {
        w.timer = azar01() * 2;
        this.sub = 2;
      }
      return;
    }
    if (this.sub === 2) {
      if ((this.jugadorMeAtaca() || this.cosJugador() > -.70710677) && this.puedeAtacar()) {
        this.pasoA(P.BACKATTACK);
        return;
      }
      w.timer -= DT;
      if (w.timer <= 0) {
        if (this.apuntado() !== 1 && azar01() >= .5) this.pasoA(P.INTERVAL); else this.pasoA(P.BACKATTACK);
      }
    }
  }
  girarTurn(rumboObj) {
    const f = Math.abs(this.anim.vel || 1) * 1.5707964 * DT;
    if (this.progreso() >= .5) this.girar(Math.max(-f, Math.min(f, envolver(rumboObj - this.rot)))); else this.girar(-f);
  }
  controlInterval() {
    const w = this.w, j = this.jugador();
    switch (this.sub) {
     case 0:
      this.cond = C.ESCAPE;
      this.animSet(A.RUN);
      w.timer = 5;
      this.sub = 1;

     case 1:
      {
        if (j.existe) {
          let dx = this.pos[0] - j.pos[0], dz = this.pos[2] - j.pos[2];
          const L = Math.hypot(dx, dz) || 1;
          dx /= L;
          dz /= L;
          this.girarHacia([ j.pos[0] + dx * 1e3, this.pos[1], j.pos[2] + dz * 1e3 ], DT * 1.5707964 * this.multTrabado(4));
        }
        this.avanzar(w.moveSpeed * 1e3);
        w.timer -= DT;
        if (w.timer <= 0) {
          this.pasoA(P.ESCAPE);
          return;
        }
        if (this.pisaRun()) {
          if (this.apuntado() === 1 && !this.pruebaVida(0, 100)) {
            this.pasoA(P.ESCAPE);
            return;
          }
          if (this.dXZ() > 1e3) {
            if (this.cosJugador() >= 0) {
              this.pasoA(P.POSE);
              return;
            }
            if (this.puedeAtacar() && azar01() < .2) {
              this.pasoA(P.BACKATTACK);
              return;
            }
            this.animSet(A.TURN, {
              vel: azar01() * .5 + 1
            });
            this.sub = 2;
          }
        }
        return;
      }

     case 2:
      this.girarTurn(j.existe ? rumboHacia(j.pos, this.pos) : this.rot);
      if (this.terminada()) {
        if (this.dXZ() < 1e3 && this.puedeAtacar() && azar01() < .3 && this.cosJugador() > .8660254) {
          this.pasoA(P.JUMPATTACK);
          return;
        }
        w.timer = azar01();
        this.animSet(A.NT);
        this.sub = 3;
      }
      return;

     case 3:
      {
        if (this.dXZ() < 560 * this.escala && this.puedeAtacar()) this.pasoA(this.cosJugador() >= 0 ? P.ATTACK : P.BACKATTACK); else {
          w.timer -= DT;
          if (w.timer <= 0) this.pasoA(this.cosJugador() >= 0 ? P.APPROACH : P.POSE);
        }
        this.girarHaciaJugador(DT * .5235988);
      }
    }
  }
  controlApproach() {
    const w = this.w, j = this.jugador();
    if (this.sub === 0) {
      this.cond = C.CHASE;
      if (this.dXZ() < 560 * this.escala && this.puedeAtacar()) {
        this.pasoA(P.ATTACK);
        return;
      }
      this.animSet(A.WLK);
      this.sub = 1;
    }
    if (this.sub === 1) {
      w.objetivo = [ ...j.pos ];
      const p = j.existe ? this.camino(w.objetivo) : null;
      if (!p) this.pasoA(P.WANDER); else this.girarHacia(p, DT * 1.5707964 * this.multTrabado(2));
    }
    this.avanzar(w.moveSpeed * 200);
    if (this.paso === P.APPROACH && this.pisaWlk()) {
      const d = this.dXZ();
      if (d < 560 * this.escala && this.puedeAtacar()) {
        this.pasoA(P.ATTACK);
        return;
      }
      if (this.jugadorMira() < 0 && d > 1e3) this.pasoA(P.POSE);
    }
  }
  controlAttack() {
    const w = this.w;
    if (this.sub === 0) {
      this.cond = C.BATTLE;
      if (this.cosJugador() < 0) {
        this.pasoA(P.BACKATTACK);
        return;
      }
      if (this.d3() <= 560 * this.escala) {
        this.animSet(A.ATT1, {
          reiniciar: true,
          vel: azar01() * .5 + 1
        });
        this.ponerEsperaAtaque();
        w.attackKind = 86;
        this.sub = 1;
      } else this.pasoA(P.JUMPATTACK);
    } else if (this.sub === 1) {
      if (this.pasaCuadro(34)) this.sonido(SON.ATAQUE);
      const f = this.cuadro();
      if (w.attackKind && f > 27) this.esferaGolpe();
      if (w.attackKind && f > 34) this.terminarAtaque();
      if (this.terminaPronto(.5)) {
        this.terminarAtaque();
        this.pasoA(P.CAUTION);
      }
    }
    this.girarHaciaJugador(DT * .5235988);
  }
  controlJumpAttack() {
    const w = this.w;
    if (this.sub === 0) {
      this.cond = C.BATTLE;
      this.animSet(A.ATT2, {
        reiniciar: true
      });
      this.ponerEsperaAtaque();
      this.sonido(SON.ATAQUE);
      w.attackKind = 87;
      this.sub = 1;
    } else if (this.sub === 1) {
      const f = this.cuadro();
      if (w.attackKind && f > 10) this.esferaGolpe();
      if (w.attackKind && f > 26) this.terminarAtaque();
      if (this.terminaPronto(.5)) {
        this.terminarAtaque();
        this.pasoA(P.CAUTION);
      }
    }
    this.girarHaciaJugador(DT * .2617994);
    const f = this.cuadro();
    if (f > 9 && f < 26) this.avanzar(1500);
  }
  controlBackAttack() {
    if (this.sub === 0) {
      this.cond = C.BATTLE;
      this.animSet(A.ATT3, {
        reiniciar: true
      });
      this.w.attackKind = 88;
      this.sub = 1;
      return;
    }
    this.giroAtaque(false, P.CAUTION);
  }
  controlEscape() {
    const w = this.w, j = this.jugador();
    switch (this.sub) {
     case 0:
      this.cond = C.ESCAPE;
      this.animSet(A.RUN);
      this.sub = 1;

     case 1:
      w.objetivo = this.puntoAlAzar(true);
      w.timer = 10;
      this.sub = 2;

     case 2:
      break;

     case 3:
      this.edPaso(() => this.terminaPronto(.5), P.WANDER);
      return;

     default:
      return;
    }
    const p = this.camino(w.objetivo);
    if (!p) {
      this.pasoA(P.WANDER);
      return;
    }
    this.girarHacia(p, DT * 1.5707964 * this.multTrabado(4));
    w.timer -= DT;
    if (this.pisaRun() || w.tTrabado > 2) {
      const dx = j.pos[0] - this.pos[0], dz = j.pos[2] - this.pos[2], d2 = dx * dx + dz * dz, cos = this.cosJugador();
      if (j.existe && d2 < (560 * this.escala) ** 2 && cos > .70710677 && this.puedeAtacar()) this.pasoA(P.ATTACK); else if (j.existe && d2 < (400 * this.escala) ** 2 && cos < 0 && this.puedeAtacar()) this.pasoA(P.BACKATTACK); else if (distXZ(w.objetivo, this.pos) < 120 || w.tTrabado > 2) {
        if (!j.existe || d2 > 4e6 || !this.seVe([ j.pos[0], j.pos[1] - 150, j.pos[2] ], this.centro)) {
          this.animSet(A.LOOK);
          this.sonido(SON.VOZ);
          this.curar(10);
          this.sub = 3;
        } else this.sub = 1;
      } else if (w.timer <= 0) this.pasoA(P.CAUTION);
    }
    this.avanzar(w.moveSpeed * 1e3);
  }
  elegirDanio(g) {
    const w = this.w, sh = g.shock ?? 40, dir = g.dir || frente(this.rot + Math.PI);
    w.hitback[0] += dir[0] * sh;
    w.hitback[1] += (dir[1] || 0) * sh;
    w.hitback[2] += dir[2] * sh;
    const local = girarY(dir, -this.rot), deFrente = local[2] < 0;
    const conAguante = this.aguante > 0, t = g.bdt ?? 2;
    let cat = 1, fuerte = false;
    if ([ 0, 2, 4, 6, 8, 9, 10, 11, 21 ].includes(t)) cat = conAguante ? 1 : 2; else if ([ 16, 18 ].includes(t)) cat = 2; else if ([ 3, 5, 7, 12, 14 ].includes(t)) {
      cat = conAguante ? 1 : 2;
      fuerte = true;
    } else if ([ 1, 13, 15, 17 ].includes(t)) {
      cat = 2;
      fuerte = true;
    } else if (t === 19 || t === 20) cat = 3; else if (g.golpe === "BAK_PLAYER_SPRAY") cat = 4;
    let n;
    if (cat === 2) n = fuerte ? deFrente ? A.XXS1 : A.XXS2 : deFrente ? A.XXP1 : A.XXP2; else if (cat === 1) n = fuerte ? deFrente ? A.DMS1 : A.DMS2 : deFrente ? A.DMP1 : A.DMP2; else n = deFrente ? A.DMP1 : A.DMP2;
    this.animSet(n, {
      reiniciar: true,
      vel: cat === 1 ? 1 + azarS() * .3 : cat === 2 ? 1 + azarS() * .2 : 1
    });
    w.ultimoGolpe = g.golpe || null;
    return cat;
  }
  controlDamage() {
    const w = this.w;
    switch (this.sub) {
     case 0:
      {
        const g = this.danioPend || {
          danio: 0,
          bdt: 2,
          shock: 0,
          dir: frente(this.rot + Math.PI)
        };
        this.danioPend = null;
        this.cond = C.DAMAGE;
        this.aviso(8, 3, this.centro, 4e3, 1);
        w.firstPose = 0;
        this.quitar(g.danio || 0);
        this.sonidoDanio();
        let cat = this.elegirDanio(g);
        if (cat === 2 && this.enPozo()) cat = 5;
        this.sub = cat;
        break;
      }

     case 1:
      this.edPaso(() => this.terminaPronto(.5), P.WANDER);
      break;

     case 2:
      {
        const n = this.anim.n, c = n === A.XXP1 || n === A.XXS1 ? 43 : n === A.XXP2 || n === A.XXS2 ? 46 : -1;
        if (c >= 0 && this.pasaCuadro(c)) this.sonido(SON.CAE);
        this.edPaso(() => this.terminada(), P.DOWN);
        break;
      }

     case 3:
      {
        if (this.aguante > 0) {
          w.timer += DT;
          if (w.timer < .5) this.animSet(this.cosJugador() >= 0 ? A.DMP1 : A.DMP2); else this.sub = 1;
        } else {
          if (this.anim.n >= A.DMP1 && this.anim.n <= A.DMS2) this.animSet(this.cosJugador() >= 0 ? A.XXP1 : A.XXP2, {
            reiniciar: true
          });
          this.sub = 2;
        }
        break;
      }

     case 4:
      if (this.terminaPronto(.2)) this.pasoA(P.ESCAPE);
      break;

     case 5:
      if (this.progreso() > .5) this.pasoA(P.DOWN);
      break;
    }
    const f = this.cuadro(), n = this.anim.n;
    let d0 = 0, d1 = 0, dist = 0;
    if (n === A.XXP1 || n === A.XXP2 || n === A.XXS1 && f > 20 || n === A.XXS2 && f > 19) {
      d0 = 30;
      d1 = 40;
      dist = 200;
    } else if (n === A.DMS1 || n === A.XXS1) {
      d0 = 0;
      d1 = 10;
      dist = -200;
    } else if (n === A.DMS2 || n === A.XXS2) {
      d0 = 0;
      d1 = 10;
      dist = 200;
    }
    if (dist && f >= d0 && f < d1) this.avanzar(dist * FPS / (d1 - d0));
  }
  danioAdicional() {
    const g = this.danioPend;
    if (!g) return;
    this.danioPend = null;
    this.quitar(g.danio || 0);
    if (this.sub === 2 || this.sub === 5) return;
    this.pararGemido();
    this.sonidoDanio();
    let cat = this.elegirDanio(g);
    if (!this.edUsado) {
      if (cat === 2 && this.enPozo()) cat = 5;
      this.sub = cat;
    }
  }
  danioEnElPiso() {
    const g = this.danioPend;
    if (!g) return;
    this.danioPend = null;
    const w = this.w;
    let d = g.danio || 0;
    if (g.atributo === 8 || /FINISH/.test(String(g.golpe || ""))) {
      d = Math.max(d, this.hp);
      w.finishCount++;
    }
    this.quitar(d);
    this.pararGemido();
    this.sonidoDanio();
    this.animSet(A.ROT, {
      reiniciar: true,
      vel: azarS() * .2 + 1
    });
    w.ultimoGolpe = g.golpe || null;
    if (this.sub === 4) {
      const r = azar01();
      w.timer += azar01() * r * 3;
      return;
    }
    if (this.hp <= 0) {
      this.charco();
      w.timer = azar01() * 3 + 1;
      this.sub = 4;
    }
  }
  controlDown() {
    const w = this.w;
    if (this.sub === 5 && !this.enPozo()) {
      this.altoJuego = 160;
      this.pasoA(P.INIT);
      return;
    }
    switch (this.sub) {
     case 0:
      {
        this.cond = C.DYING;
        this.radio = 100 * this.escala;
        if (this.enPozo()) {
          this.caerPozo();
          return;
        }
        if (this.hp <= 0) {
          this.charco();
          w.timer = (azar01() + 1) * 5;
          this.sub = 4;
          return;
        }
        if (w.ultimoGolpe === "BAK_PLAYER_STUNGUN") w.timer = azar01() * 7 + 3; else if (this.aguante <= 0) w.timer = (azar01() + 1) * 3; else w.timer = azar01();
        this.animSet(A.DNT);
        this.sub = 1;
        return;
      }

     case 1:
      {
        if (this.enPozo()) {
          this.caerPozo();
          return;
        }
        w.timer -= DT;
        if (w.timer <= 0 && !this.jugadorMeAtaca()) {
          this.pararGemido();
          this.cond = C.RISE;
          this.animSet(A.UP);
          this.sub = 3;
          return;
        }
        if (azar01() < .01) {
          this.animSet(A.ROT, {
            reiniciar: true,
            vel: azarS() * .2 + 1
          });
          if (!this.w.gimiendo) {
            this.w.gimiendo = true;
            this.sonido(SON.GEMIDO, true);
          }
          this.sub = 2;
        }
        return;
      }

     case 2:
      if (this.terminada()) {
        this.animSet(A.DNT);
        w.timer = azar01() * 5 + 1;
        this.sub = 1;
      }
      return;

     case 3:
      this.edLlamar(() => this.terminaPronto(.5), () => {
        this.curar(10);
        this.altoJuego = 160;
        this.pasoA(P.WANDER);
      });
      return;

     case 4:
      w.timer -= DT;
      if (w.timer <= 0 || w.finishCount > 1) this.morir();
      return;

     case 5:
      w.timer -= DT;
      if (w.timer <= 0) {
        this.sonido(SON.DOLOR);
        this.quitar(10);
        this.anim.t = 0;
        w.timer = .5;
        if (this.hp <= 0) this.sub = 6;
      }
      return;

     case 6:
      w.timer -= DT;
      if (w.timer <= 0) {
        this.sonido(SON.MUERTE);
        this.morir();
      }
    }
  }
  caerPozo() {
    this.pararGemido();
    this.animSet(A.ROT, {
      reiniciar: true,
      vel: azarS() * .2 + 1
    });
    this.w.timer = 0;
    this.altoJuego = 120;
    this.sub = 5;
  }
  morir() {
    this.cond = C.DEAD;
    this.m.contarMuerte?.(this);
    this.pasoA(P.DEAD);
  }
  controlDead() {
    if (this.sub === 0) {
      this.radio = 0;
      this.pararGemido();
      if (this.anim.loop) this.anim.velocidad(0);
      this.sub = 1;
    }
  }
  controlEvent() {
    if (this.sub === 0) {
      this.cond = C.EVENT;
      this.animSet(A.NT);
      this.radio = 0;
      this.sub = 1;
    }
  }
}
