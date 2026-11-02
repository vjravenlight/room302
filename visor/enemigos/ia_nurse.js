// SH4 web — FeniXVOID · Project Ravenlight
import { FPS, DT, PI, envolver, rumboHacia, frente, dist3, distXZ, girarY, azar, azar01 } from "./comun.js";

const AMORT_HITBACK = (30 / 31) ** 8;

export const C = {
  NORMAL: 1,
  CAUTION: 2,
  CHASE: 3,
  BATTLE: 5,
  SEIZE: 6,
  WARP: 7,
  RISE: 8,
  DAMAGE: 9,
  DYING: 10,
  DEAD: 11,
  INWALL: 13,
  NADA: 16,
  EVENT: 18
};

export const P = {
  INIT: 0,
  WANDER: 1,
  PERFORM: 2,
  CAUTION: 3,
  CHASE: 4,
  WARP: 5,
  TOWARP: 6,
  TOWARP2: 7,
  ATTACK: 8,
  SEIZE: 9,
  BACKATTACK: 10,
  TURN: 11,
  INWALL: 12,
  DAMAGE: 13,
  DOWN: 14,
  EXORCISMDOWN: 15,
  FINISHED: 16,
  EVENT: 17,
  DEAD: 18
};

export const NOMBRE_PASO = [ "Init", "Wander", "Perform", "Caution", "Chase", "Warp", "ToWarp", "ToWarp2", "Attack", "Seize", "BackAttack", "Turn", "InWall", "Damage", "Down", "ExorcismDown", "Finished", "Event", "Dead" ];

export const A = {
  NT: 0,
  NT2: 1,
  NT3: 2,
  WLK: 3,
  WLKB: 4,
  WLKR: 5,
  WLKL: 6,
  WLKS: 7,
  DMH1: 8,
  DMH2: 9,
  DMP1: 10,
  DMP2: 11,
  DMP3: 12,
  DMS1: 13,
  DMS2: 14,
  DMCA: 15,
  XXP1: 16,
  XXP2: 17,
  XXP3: 18,
  XXS1: 19,
  XXS2: 20,
  XXG1: 21,
  XXG2: 22,
  XXC1: 23,
  XXC2: 24,
  DMCB: 25,
  UPU: 26,
  UPD: 27,
  DNT1: 28,
  DNT2: 29,
  ROTU: 30,
  ROTD: 31,
  ATT1: 32,
  ATT2A: 33,
  ATT2B: 34,
  ATT2C: 35,
  ATT3A: 36,
  ATT3B: 37,
  ATT3C: 38,
  ATT4: 39,
  TDMU: 40,
  TDMD: 41,
  ST1: 42,
  ST2: 43
};

export const NOMBRES_LOGICOS = Object.keys(A);

export const PARTE_ANIM = NOMBRES_LOGICOS.map((_, l) => l < 16 ? l : l < 25 ? l + 1 : l === 25 ? 16 : l < 42 ? l : -1);

export const NOMBRES_ANIM_NURSE = Array.from({
  length: 42
}, (_, k) => NOMBRES_LOGICOS[PARTE_ANIM.indexOf(k)]);

export const binNurse = () => "enemy_scratch.bin";

export const modeloNurse = () => "enemy_model_det.bin";

const ESCALA = 1.2;

const RADIO = 60;

const ANIME_SPEED = [ .7, .8, 1, 1.2, 1.5 ];

const HP_RATE = [ 80, 70, 50, 30, 20 ];

const ARMA = [ 0, -40, 0 ];

const MANO_AGARRE = [ 0, 0, 30 ];

const HUESO = {
  MIRA: 8,
  ARMA: 16,
  MANO: 34,
  PIE_D: 33,
  PIE_I: 32
};

const SON = {
  ATAQUE: 60760,
  ATRAS: 60761,
  ESPECIAL: 60762,
  MUERE: 60753,
  BALA: 60752,
  GOLPE: 60751,
  POZO: 60751,
  AGARRE: 61763,
  WARP: 60550,
  REMATE: 60553
};

const GOLPE = {
  99: {
    golpe: "BAK_SCR_ATT1",
    danio: 10,
    shock: 40,
    radio: 100
  },
  100: {
    golpe: "BAK_SCR_ATT2",
    danio: 10,
    shock: 40,
    radio: 100
  },
  101: {
    golpe: "BAK_SCR_ATT4",
    danio: 10,
    shock: 50,
    radio: 140
  }
};

const FM_WLK = [ 0, 1888, 1920, 1984, 2032, 2112, 2144, 2159, 2127, 1952, 1504, 2191, 2336, 2176, 2048, 2032, 2e3, 1888, 1839, 1839, 1840, 2016, 1999, 2016, 2016, 2016, 2016, 1824, 1792, 2255, 2208, 2112, 2016, 1968, 1935 ];

const RW = {
  [A.WLKB]: [ -1.1, -8, -1.4, -8.2, -1.3, -8.5, -1.3, -8.4, -1.4, -8.8, -1.7, -9.2, -1.6, -9.8, -1.6, -10.7, -1.6, -10.7, -3.1, -8.2, -1.4, -10.1, -.9, -10.3, -1.1, -9.8, -.9, -9.1, -.4, -8.8, .3, -8.5, .8, -8.6, .6, -8.6, .8, -11.6, .8, -12.1, .8, -12.2, 1.1, -11.8, 1.2, -10.9, 1.4, -9.7, 1.6, -8.2, 1.4, -7, 1.2, -7.2, 1.2, -7.2, 1.6, -8.8, 1, -8.9, .8, -8.7, .5, -8.8, 0, -8.8, -.4, -9 ],
  [A.WLKR]: [ 12.5, -.9, 11.6, -1.1, 11.6, -1.2, 11.6, -1.1, 11.9, -.8, 12.4, 1.1, 13.6, 1.1, 9, .4, 9, .4, 11, .5, 11.8, .7, 12.1, .9, 12.4, 1.1, 12.5, 1.2, 12.8, 1.1, 12.5, 1, 11.2, 1, 10.6, .8, 11.7, .3, 12.4, -.2, 12.9, -.8, 12.2, -.5, 11.2, -1.4, 8, -2.4, 8, -2.4, 13.3, -.9, 15.2, -.5, 14.3, -.2, 13.2, -.4, 12.9, -.4, 12.8, -.1, 12.6, -.3, 12.6, -.7 ],
  [A.WLKL]: [ -12.1, 1.4, -12, 1.1, -13.1, .8, -12.4, .5, -12.1, .5, -11.5, .5, -10.7, .2, -9.5, .2, -9.5, .2, -12.8, -2.9, -12.8, -2.6, -12.6, -2.2, -12.2, -2.1, -12, -1.6, -11.8, -.9, -12, -.5, -11.9, -.3, -12.2, .1, -12.8, .8, -13.3, 1.1, -13.5, .8, -13.8, .8, -12, .9, -7, 1.9, -7, 1.9, -13.3, -.1, -14.2, .1, -12.8, -.1, -12, 0, -11.6, .6, -11.5, .8, -11.9, 1.1 ],
  [A.WLKS]: [ .8, 5.6, .7, 5.6, .1, 5.8, .1, 6.1, -.3, 6.2, -.4, 6.3, -.5, 6.4, -.4, 6.3, -.6, 6.6, -.6, 6.9, -.8, 7.3, -1.4, 7.5, -1.4, 7.5, -1.5, 7.8, -1.5, 8.1, -1.2, 7, -1.1, 7.2, -1.4, 7.2, -1.1, 7.2, -1, 7.1, -1.1, 7.2, -1.1, 7.2, -1.1, 7.1, -.9, 7, -.8, 7.1, -.5, 7.1, -.1, 7, .1, 7, .4, 7, .7, 7, .8, 7, .8, 7, .8, 6.9, 1, 6.9, 1, 6.9, .5, 8.1, 1.5, 8.6, 1.7, 8.6, 1.9, 8, 1.9, 7.5, 1.9, 7, 1.7, 6.8, 1.5, 6.3, 1.3, 5.8, 1.1, 5.2, 1.1, 5.2, 1, 5.4 ]
};

const MOV = {
  [A.WLK]: "fm",
  [A.ATT2A]: "fm",
  [A.ATT2B]: "fm",
  [A.ATT2C]: "fm",
  [A.WLKB]: "rw",
  [A.WLKR]: "rw",
  [A.WLKL]: "rw",
  [A.WLKS]: "rw"
};

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

const BAK = {
  BAK_PLAYER_HAND_GUN: 2,
  BAK_PLAYER_REVOLVER: 3,
  BAK_PLAYER_STUNGUN: 42,
  BAK_PLAYER_SPRAY: 43,
  BAK_PLAYER_CHAINSAW: 44,
  BAK_PLAYER_CHAINSAW_ST: 45,
  BAK_PLAYER_SILVER_BULLET: 47,
  BAK_PLAYER_FINISH: 48,
  BAK_PLAYER_EIL_GUN_N: 72
};

const R30 = .5235988, R45 = .7853982, R60 = 1.0471976, R90 = 1.5707964, R120 = 2.0943952, R135 = 2.3561945, R165 = 2.8797934;

const azarS = () => Math.random() * 2 - 1;

const sumar = (a, b) => [ a[0] + b[0], a[1] + b[1], a[2] + b[2] ];

function ruido(p1, p2) {
  if (p1 < 0 && azar(32768) & 8192) p1 = -p1;
  const den = azar01() + p2;
  return den === 0 ? 0 : ((p2 + 1) * p2 / den - p2) * p1;
}

function resorte(s, obj, a, b, rig, am) {
  const v = (ruido(-a, b) + s[1] - (s[0] - obj) * rig) * am;
  s[1] = v;
  s[0] += v;
  return s[0];
}

function qrot(q, v) {
  const [x, y, z, w] = q, [vx, vy, vz] = v;
  const ix = w * vx + y * vz - z * vy, iy = w * vy + z * vx - x * vz, iz = w * vz + x * vy - y * vx, iw = -x * vx - y * vy - z * vz;
  return [ ix * w + iw * -x + iy * -z - iz * -y, iy * w + iw * -y + iz * -x - ix * -z, iz * w + iw * -z + ix * -y - iy * -x ];
}

const compartido = new WeakMap;

function estadoDe(m) {
  let s = compartido.get(m);
  if (!s) {
    s = {
      lista: [],
      avisos: [],
      reloj: 0
    };
    compartido.set(m, s);
  }
  return s;
}

export class Nurse {
  constructor(def, pj, anim, m) {
    this.tipo = "NURSE";
    this.def = def;
    this.pj = pj;
    this.anim = anim;
    this.m = m;
    this.SON = SON;
    this.tipoParam = def.tipo_param || 0;
    this.escala = ESCALA;
    try {
      pj?.grupo?.scale?.setScalar?.(ESCALA);
    } catch {}
    this.param = m.parametros?.("NURSE", this.tipoParam) || {
      vida: 80,
      aguante: 80,
      recupera: 2
    };
    this.hp = this.hpMax = this.param.vida;
    this.aguante = this.aguanteMax = this.param.aguante;
    this.pos = [ ...def.pos ];
    this.rot = def.rumbo || 0;
    this.posAnt = [ ...this.pos ];
    this.rotAnt = this.rot;
    this.radio = RADIO * ESCALA;
    this.radioGolpe = RADIO * ESCALA;
    this.alto = 400 * ESCALA;
    this.centroAlto = 300;
    this.centro = [ this.pos[0], this.pos[1] - this.centroAlto, this.pos[2] ];
    this.cond = C.NORMAL;
    this.paso = P.INIT;
    this.sub = 0;
    this.visible = true;
    this.opacidad = 1;
    this.animL = -1;
    this.w = {
      hitback: [ 0, 0, 0 ],
      timer: 0,
      downCount: 0,
      caida: 0,
      enAtaque: 0,
      attackKind: 0,
      golpeo: false,
      movePattern: 0,
      moveTimer: 0,
      calc: [ .5, 0 ],
      velS: [ ANIME_SPEED[this.lv()], 0 ],
      attackWait: 0,
      slowly: 0,
      warpAntes: 0,
      warpDespues: 0,
      finishCount: 0,
      attackSuccess: 0,
      fallCount: 0,
      stayTime: 0,
      relojCaida: 0,
      modo: 0,
      modoFantasma: 0,
      objetivo: [ ...this.pos ],
      trabado: 0,
      tTrabado: 0,
      agarrando: false,
      tAgarre: 0,
      setBlood: 0,
      target: null
    };
    this.golpes = [];
    this.danioPend = null;
    this.eds = [];
    this.edUsado = false;
    this.mov = [ 0, 0, 0 ];
    this.tAnt = 0;
    this.tAhora = 0;
    this.ponerAnim(A.NT, true);
    const s = estadoDe(m);
    if (s.lista.some(e => e.tCuadros > 0)) {
      s.lista = [];
      s.avisos = [];
      s.reloj = 0;
    }
    s.lista.push(this);
    this.comp = s;
    this.tCuadros = 0;
  }
  caido() {
    return this.paso === P.DOWN || this.paso === P.EXORCISMDOWN || this.paso === P.DAMAGE && (this.sub === 2 || this.sub === 4);
  }
  persigue() {
    return [ P.PERFORM, P.CAUTION, P.CHASE, P.ATTACK, P.SEIZE, P.BACKATTACK, P.TURN, P.DAMAGE, P.TOWARP, P.WARP ].includes(this.paso) || this.paso === P.DOWN && this.hp > 0;
  }
  intocable() {
    return this.cond === C.DEAD || [ P.DEAD, P.FINISHED, P.EVENT, P.INWALL ].includes(this.paso);
  }
  get sinSangre() {
    return false;
  }
  recibir(g) {
    this.golpes.push(g);
  }
  lv() {
    return Math.max(0, Math.min(4, Math.round(this.m?.nivel ?? 1)));
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
  animSet(l) {
    const w = this.w;
    let rev = false;
    if (l > 43) {
      l -= 44;
      rev = true;
    }
    const act = this.animL, base = ANIME_SPEED[this.lv()];
    let reinicia = false;
    switch (l) {
     case A.NT:
      if (act === A.ST2) {
        this.ponerAnim(l, true);
        return;
      }
      reinicia = act !== l;
      break;

     case A.ROTU:
     case A.ROTD:
      reinicia = !(act > 7 && act < 26) || act !== l;
      break;

     case A.NT2:
     case A.DMH1:
     case A.DMH2:
     case A.DMP1:
     case A.DMP2:
     case A.DMP3:
     case A.DMS1:
     case A.DMS2:
     case A.XXP1:
     case A.XXP2:
     case A.XXP3:
     case A.XXS1:
     case A.XXS2:
     case A.XXG1:
     case A.XXG2:
     case A.XXC1:
     case A.XXC2:
     case A.DMCB:
     case A.ATT3B:
     case A.ATT3C:
     case A.ATT1:
     case A.ATT4:
      reinicia = true;
      break;

     case A.ST2:
     case A.ST1:
      this.ponerAnim(l, true);
      return;

     default:
      reinicia = act !== l;
    }
    if (reinicia) this.ponerAnim(l, true);
    let vel;
    switch (l) {
     case A.NT2:
      if (this.paso === P.WARP) {
        w.velS = [ base, 0 ];
        vel = azarS() * .5 + 1;
        break;
      }
      w.velS = [ base, 0 ];
      vel = 1;
      break;

     case A.WLKR:
     case A.WLKL:
      vel = base * .5;
      break;

     case A.WLK:
     case A.WLKB:
     case A.WLKS:
     case A.ATT1:
     case A.ATT2A:
     case A.ATT2B:
     case A.ATT2C:
     case A.ATT3A:
     case A.ATT3B:
     case A.ATT3C:
     case A.ATT4:
      vel = this.velRuido(base);
      break;

     case A.DMH1:
     case A.DMH2:
     case A.DMP1:
     case A.DMP2:
     case A.DMP3:
     case A.DMS1:
      w.velS = [ base, 0 ];
      vel = azarS() * .4 + 1;
      break;

     default:
      w.velS = [ base, 0 ];
      vel = 1;
    }
    this.anim.velocidad(rev ? -vel : vel);
    w.moveTimer = 0;
    w.movePattern = 0;
  }
  velRuido(base) {
    const w = this.w;
    let v = resorte(w.velS, base, .1, .1, .1, .9);
    if (v < .5) {
      v = .5;
      w.velS[0] = .5;
    } else if (v > 2) {
      v = 2;
      w.velS[0] = 2;
    }
    return v;
  }
  ponerAnim(l, reiniciar) {
    const k = PARTE_ANIM[l] ?? -1, n = k >= 0 && k < (this.anim.anims?.length ?? 0) ? k : PARTE_ANIM[A.NT];
    if (reiniciar || this.animL !== l) this.anim.poner(n);
    this.animL = l;
  }
  tiempoRuido() {
    const w = this.w, v = resorte(w.calc, .5, .125, .05, .1, .9);
    w.calc[0] = Math.max(.25, Math.min(2, v));
    return w.calc[0];
  }
  d3() {
    const j = this.jugador();
    return j.existe ? dist3(this.pos, j.pos) : 1e9;
  }
  anguloJugador() {
    const j = this.jugador();
    return j.existe ? envolver(rumboHacia(j.pos, this.pos) - this.rot) : PI;
  }
  cosHacia(p) {
    const f = frente(this.rot), dx = p[0] - this.pos[0], dz = p[2] - this.pos[2], L = Math.hypot(dx, dz) || 1;
    return (f[0] * dx + f[2] * dz) / L;
  }
  mismoFrente() {
    const j = this.jugador(), a = frente(this.rot), b = frente(j.rot);
    return a[0] * b[0] + a[2] * b[2];
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
  jugadorAtacando() {
    return this.jugador().estado === ST.ATTACK && this.apuntado() === 1;
  }
  jugadorDaniado() {
    const e = this.jugador().estado;
    return e === ST.DAMAGE || e === ST.DEAD;
  }
  jugadorAtacable() {
    const j = this.jugador();
    if (!j.existe || [ ST.DAMAGE, ST.EVENT, ST.GODMODE, ST.DEAD ].includes(j.estado)) return false;
    return (this.m.relojAtaque?.() ?? this.comp.reloj) >= 5;
  }
  puedeAtacar() {
    return !this.hayAviso(15, 2, this.pos) && this.jugadorAtacable();
  }
  jugadorDebil() {
    const j = this.jugador();
    return (j.vida ?? 1) * 100 < HP_RATE[this.lv()];
  }
  enCono(d = 800, ang = R45) {
    const j = this.jugador();
    if (!j.existe) return false;
    return distXZ(this.pos, j.pos) <= d && this.cosHacia(j.pos) >= Math.cos(ang);
  }
  seVe(a, b) {
    return this.m.lineaDeVista ? !!this.m.lineaDeVista(a, b) : true;
  }
  veJugadorDesdePies() {
    const j = this.jugador();
    return j.existe && this.seVe([ this.pos[0], this.pos[1] - 40, this.pos[2] ], [ j.pos[0], j.pos[1] - 40, j.pos[2] ]);
  }
  fueraDePantalla() {
    if (typeof this.m.enPantalla === "function") return !this.m.enPantalla(this);
    const j = this.jugador();
    if (!j.existe) return true;
    const f = frente(j.rot), dx = this.pos[0] - j.pos[0], dz = this.pos[2] - j.pos[2], L = Math.hypot(dx, dz) || 1;
    return !((f[0] * dx + f[2] * dz) / L > .64 && L < 6e3 && this.seVe(this.centro, [ j.pos[0], j.pos[1] - 150, j.pos[2] ]));
  }
  mismaParticion(p = this.pos) {
    return typeof this.m.mismaParticion === "function" ? !!this.m.mismaParticion(this, p) : true;
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
    for (const a of this.comp.avisos) {
      if (a.t <= 0 || a.tipo !== tipo || kind != null && a.kind !== kind || a.de === this) continue;
      if (dist3(a.pos, pos) <= a.radio) return a;
    }
    return null;
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
    if (this.cond >= C.RISE && this.cond <= C.DEAD) return;
    const r = this.m.parametros?.("SCRATCH", this.tipoParam)?.recupera ?? this.param.recupera ?? 2;
    if (this.aguante < this.aguanteMax && this.aguante < this.hp) this.aguante = Math.min(this.aguanteMax, this.hp, this.aguante + r * DT);
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
  lento() {
    return 1 - this.w.slowly * .5;
  }
  camino(dest) {
    return typeof this.m.camino === "function" ? this.m.camino(this, dest) : dest;
  }
  puntoAlAzar() {
    if (typeof this.m.puntoAlAzar === "function") {
      const p = this.m.puntoAlAzar(this, {
        margen: 60
      });
      if (p) return p;
    }
    const o = this.def.pos;
    let ult = null;
    for (let i = 0; i < 40; i++) {
      const a = azar01() * 2 * PI, d = azar01() * 1500;
      const q = [ o[0] + Math.sin(a) * d, this.pos[1], o[2] + Math.cos(a) * d ];
      const y = this.m.piso ? this.m.piso(q, 200, 400) : undefined;
      if (y === null) continue;
      if (y != null) q[1] = y;
      ult = q;
      if (this.seVe([ this.pos[0], this.pos[1] - 100, this.pos[2] ], [ q[0], q[1] - 100, q[2] ])) return q;
    }
    return ult || [ ...this.pos ];
  }
  huesoRot(i) {
    const r = this.pj?.reproductor, lugar = r?.enElLugar;
    try {
      if (r.anim !== this.anim.anim) r.poner(this.anim.anim);
      r.t = this.anim.t;
      r.loop = this.anim.loop;
      r.enElLugar = false;
      const pose = r.avanzar(0);
      const p = [ pose.absPos[i * 3] * this.escala, pose.absPos[i * 3 + 1] * this.escala, pose.absPos[i * 3 + 2] * this.escala ];
      const q = [ pose.absRot[i * 4], pose.absRot[i * 4 + 1], pose.absRot[i * 4 + 2], pose.absRot[i * 4 + 3] ];
      if (!p.every(Number.isFinite)) throw new Error("pose");
      return {
        pos: sumar(this.pos, girarY(p, this.rot)),
        q: q
      };
    } catch {
      const t = {
        8: [ 0, -300, 0 ],
        16: [ 30, -200, 60 ],
        34: [ -30, -200, 60 ]
      }[i] || [ 0, -200, 0 ];
      return {
        pos: sumar(this.pos, girarY(t.map(v => v * this.escala), this.rot)),
        q: null
      };
    } finally {
      if (r && lugar !== undefined) r.enElLugar = lugar;
    }
  }
  hueso(i) {
    return this.huesoRot(i).pos;
  }
  conOffset(i, off) {
    const h = this.huesoRot(i);
    const o = h.q ? girarY(qrot(h.q, off), this.rot) : girarY([ 0, off[1], Math.abs(off[2]) ], this.rot);
    return sumar(h.pos, o);
  }
  puntoArma() {
    return this.conOffset(HUESO.ARMA, ARMA);
  }
  tocaJugador(c, r) {
    const j = this.jugador();
    if (!j.existe || [ ST.EVENT, ST.GODMODE, ST.DEAD ].includes(j.estado)) return false;
    return distXZ(c, j.pos) <= r + (this.m.radioJugador ?? 40) && c[1] <= j.pos[1] + r && c[1] >= j.pos[1] - 360 - r;
  }
  esferaGolpe(kind) {
    const g = GOLPE[kind];
    if (!g || this.w.golpeo) return false;
    this.w.enAtaque = 1;
    this.w.attackKind = kind;
    const c = this.puntoArma();
    if (!this.tocaJugador(c, g.radio)) return false;
    const j = this.jugador();
    this.m.golpear?.(this, g.danio, g.golpe, {
      shock: g.shock,
      dir: frente(rumboHacia(j.pos, this.pos))
    });
    this.w.golpeo = true;
    return true;
  }
  terminarAtaque() {
    this.w.enAtaque = 0;
    this.w.attackKind = 0;
    this.w.golpeo = false;
  }
  charco(radio = 140) {
    this.m.charco?.(this, radio * this.escala, false);
  }
  enPozo() {
    return typeof this.m.enPozo === "function" ? !!this.m.enPozo(this.pos) : false;
  }
  exorcismo() {
    return typeof this.m.exorcismo === "function" ? +this.m.exorcismo(this) || 0 : 0;
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
    this.tCuadros++;
    if (s.lista[0] === this) {
      s.reloj += DT;
      for (const a of s.avisos) a.t -= DT;
      s.avisos = s.avisos.filter(a => a.t > 0);
    }
    if (this.golpes.length) {
      this.danioPend = this.juntarGolpes(this.golpes, this.danioPend);
      this.golpes.length = 0;
    }
    this.control();
    this.animControl();
    this.tAnt = this.anim.t;
    this.anim.avanzar();
    this.tAhora = this.anim.t;
    if (this.anim.vuelta) this.tAnt -= this.anim.vel >= 0 ? this.anim.dur : -this.anim.dur;
    for (const f of this.eds) f();
    this.eds.length = 0;
    if (this.danioPend && !(this.paso === P.DAMAGE && this.sub === 0)) this.danioPend = null;
    this.moverCuerpo();
    if (w.relojCaida > 0) w.relojCaida = Math.max(0, w.relojCaida - DT);
    this.transparencia();
    if (this.paso !== P.DEAD) {
      const c = this.hueso(HUESO.MIRA);
      this.centro = c;
      this.centroAlto = this.pos[1] - c[1];
    }
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
  moverCuerpo() {
    const w = this.w, l = this.animL, tipo = MOV[l];
    if (tipo && this.anim.n >= 0) {
      let a = this.tAnt, b = this.tAhora;
      if (b < a) [a, b] = [ b, a ];
      const loc = [ 0, 0 ];
      if (tipo === "rw") {
        const t = RW[l] || [], nf = t.length / 2;
        if (nf) for (let f = Math.floor(a); f < Math.ceil(b - 1e-6); f++) {
          const k = (f % nf + nf) % nf * 2, part = Math.min(b, f + 1) - Math.max(a, f);
          loc[0] += t[k] * part;
          loc[1] += t[k + 1] * part;
        }
      } else {
        const t = FM_WLK, n = t.length;
        for (let f = Math.floor(a); f < Math.ceil(b - 1e-6); f++) {
          const k = (f % n + n) % n;
          loc[1] += t[k] / 256 * (Math.min(b, f + 1) - Math.max(a, f));
        }
      }
      if (this.anim.vel < 0) {
        loc[0] = -loc[0];
        loc[1] = -loc[1];
      }
      const g = girarY([ loc[0] * this.escala, 0, loc[1] * this.escala ], this.rot);
      this.mov[0] += g[0];
      this.mov[2] += g[2];
    }
    const hb = w.hitback;
    this.mov[0] += hb[0] * DT * this.escala;
    this.mov[2] += hb[2] * DT * this.escala;
    hb[0] *= AMORT_HITBACK;
    hb[1] *= AMORT_HITBACK;
    hb[2] *= AMORT_HITBACK;
    const L = Math.hypot(this.mov[0], this.mov[2]), x0 = this.pos[0], z0 = this.pos[2];
    if (this.paso !== P.DEAD) {
      if (this.m.mover) this.m.mover(this, this.mov[0], this.mov[2]); else {
        this.pos[0] += this.mov[0];
        this.pos[2] += this.mov[2];
      }
    }
    const hecho = Math.hypot(this.pos[0] - x0, this.pos[2] - z0);
    w.trabado = L > 1 && hecho < L * .3 ? 1 : 0;
    w.tTrabado = w.trabado ? w.tTrabado + DT : 0;
  }
  transparencia() {
    const w = this.w;
    let a = 1;
    const f = this.cuadro();
    if ((this.paso === P.WARP || this.paso === P.INWALL) && this.animL === A.NT2 && f > 10 && f < 22) a = Math.abs(f - 16) / 6;
    let v = a;
    if (w.warpAntes > 0) {
      w.warpAntes -= DT;
      if (w.warpAntes <= 0) {
        w.warpAntes = 0;
        v = 0;
      } else v = w.warpAntes * a * 2;
    }
    w.warpDespues -= DT;
    if (w.warpDespues <= 0) w.warpDespues = 0; else v *= 1 - w.warpDespues * 2;
    this.opacidad = Math.max(0, Math.min(1, v));
  }
  control() {
    this.revisarDanio();
    switch (this.paso) {
     case P.INIT:
      this.controlInit();
      break;

     case P.WANDER:
      this.controlWander();
      break;

     case P.PERFORM:
      this.controlPerform();
      break;

     case P.CAUTION:
      this.controlCaution();
      break;

     case P.CHASE:
      this.controlChase();
      break;

     case P.WARP:
      this.controlWarp();
      break;

     case P.TOWARP:
      this.controlToWarp(true);
      break;

     case P.TOWARP2:
      this.controlToWarp(false);
      break;

     case P.ATTACK:
      this.controlAttack();
      break;

     case P.SEIZE:
      this.controlSeize();
      break;

     case P.BACKATTACK:
      this.controlBackAttack();
      break;

     case P.TURN:
      this.controlTurn();
      break;

     case P.INWALL:
      this.controlInWall();
      break;

     case P.DAMAGE:
      this.controlDamage();
      break;

     case P.DOWN:
      this.controlDown();
      break;

     case P.EXORCISMDOWN:
      this.controlExorcismDown();
      break;

     case P.FINISHED:
      this.controlFinished();
      break;

     case P.EVENT:
      this.controlEvent();
      break;

     case P.DEAD:
      this.controlDead();
      break;
    }
    const pisoEscena = this.m.pisoEscena?.();
    if (this.paso !== P.WARP && pisoEscena != null && pisoEscena < this.pos[1] && this.fueraDePantalla() && this.cond !== C.DAMAGE && this.cond !== C.DYING) this.pasoA(P.WARP);
    this.recuperar();
  }
  animControl() {
    const w = this.w;
    if (w.modo === 2) {
      const base = ANIME_SPEED[this.lv()];
      let v = w.velS[0];
      if (base - DT > v) v += DT; else if (base + DT < v) v -= DT; else v = base;
      w.velS[0] = v;
      w.moveTimer -= DT;
      if (w.moveTimer <= 0) w.moveTimer = this.tiempoRuido();
      w.movePattern = 0;
    }
    if (w.movePattern === 0 && this.animL === A.ATT2B && (this.pasaCuadro(2) || this.pasaCuadro(19)) && w.modo === 1) this.sonido(this.SON.ATAQUE);
    if (w.modo === 1) {
      w.moveTimer -= DT;
      if (w.moveTimer <= 0) {
        w.movePattern = 0;
        resorte(w.velS, ANIME_SPEED[this.lv()], .1, .1, .1, .9);
        w.velS[0] = Math.max(.5, Math.min(2, w.velS[0]));
        w.moveTimer = this.tiempoRuido();
        this.anim.velocidad(w.velS[0]);
      }
    }
  }
  revisarDanio() {
    if (!this.danioPend) return;
    const hay = () => !!this.danioPend;
    switch (this.paso) {
     case P.SEIZE:
      if (this.animL === A.ATT3B && this.w.timer > 0) return;

     case P.WANDER:
     case P.PERFORM:
     case P.CAUTION:
     case P.CHASE:
     case P.WARP:
     case P.TOWARP:
     case P.TOWARP2:
     case P.ATTACK:
     case P.BACKATTACK:
     case P.TURN:
      if (this.cond !== C.WARP && this.w.warpAntes <= 0 && this.w.warpDespues <= 0) this.edPaso(hay, P.DAMAGE); else this.edLlamar(hay, () => this.danioSoloEmpuje());
      return;

     case P.DAMAGE:
      if (this.sub !== 2 && this.sub !== 4) this.edLlamar(hay, () => this.danioAdicional()); else this.edLlamar(hay, () => this.danioSoloVida());
      return;

     case P.DOWN:
     case P.EXORCISMDOWN:
      if (this.m.rematarEspecial?.(this)) {
        this.edLlamar(() => true, () => this.remateEspecial());
        return;
      }
      if (this.cond === C.WARP) this.edLlamar(hay, () => this.danioSoloEmpuje()); else if (this.cond === C.RISE) this.edLlamar(hay, () => this.danioSoloVida()); else this.edLlamar(hay, () => this.danioEnElPiso());
      return;

     default:
      return;
    }
  }
  controlInit() {
    if (typeof this.m.puntoValido === "function" && this.m.puntoValido(this.pos) === false) {
      this.w.modoFantasma = 6;
      this.pasoA(P.INWALL);
      return;
    }
    this.w.modoFantasma = 11;
    this.pasoA(P.WANDER);
  }
  armarVista() {
    this.edPaso(() => this.veJugador(), P.CAUTION);
  }
  veJugador() {
    const j = this.jugador();
    if (!j.existe) return false;
    const d = dist3(this.pos, j.pos);
    if (d < 800) return true;
    if (d > 2e3 || Math.abs(this.anguloJugador()) > R60) return false;
    const ojo = [ this.pos[0], this.pos[1] - 160 * this.escala - 100, this.pos[2] ];
    return this.seVe(ojo, [ j.pos[0], j.pos[1] - 150, j.pos[2] ]);
  }
  controlWander() {
    const w = this.w;
    switch (this.sub) {
     case 0:
      this.terminarAtaque();
      this.cond = C.NORMAL;
      this.animSet(A.WLK);
      w.modoFantasma = 11;

     case 1:
      {
        w.objetivo = this.puntoAlAzar();
        w.objetivo[1] = this.pos[1];
        const p = this.camino(w.objetivo) || w.objetivo;
        if (this.cosHacia(p) <= 0) {
          if (azar01() < .01) {
            this.animSet(A.NT2);
          } else if (azar01() < .01) {
            this.animSet(A.NT3);
            w.timer = 2 * azar01() + 2;
            this.sub = 4;
            this.armarVista();
            return;
          }
        }
        w.timer = azar01() * 5 + 3;
        this.sub = 2;
      }

     case 2:
      {
        const r = typeof this.m.caminoPuerta === "function" ? this.m.caminoPuerta(this, w.objetivo) : 0;
        if (r === 1 || r === 2) {
          this.animSet(A.NT3);
          w.timer = 2 * azar01() + 2;
          this.sub = 3;
          return;
        }
        const p = this.camino(w.objetivo) || w.objetivo;
        w.timer -= DT;
        if (w.timer <= 0 || (this.pos[0] - w.objetivo[0]) ** 2 + (this.pos[2] - w.objetivo[2]) ** 2 < 9e4 || w.tTrabado > 2) {
          if (!this.mismaParticion()) {
            this.pasoA(P.TOWARP);
            return;
          }
          this.sub = 1;
        }
        this.girarHacia(p, this.lento() * DT * R90);
        break;
      }

     case 3:
      {
        if (!this.terminada()) return;
        const aa = Math.abs(this.anguloJugador()), d = this.d3();
        if (aa <= R165 || d >= 400) {
          if (azar01() >= .5) {
            if (azar01() < .1) {
              this.animSet(A.NT3);
              w.timer = 2 * azar01() + 2;
              this.sub = 4;
            } else this.sub = 0;
          } else if (azar01() >= .25) {
            this.anim.t = 0;
          } else {
            this.pasoA(P.TOWARP);
            return;
          }
        } else {
          this.pasoA(P.BACKATTACK);
          return;
        }
        break;
      }

     case 4:
      w.timer -= DT;
      if (w.timer <= 0) {
        this.animSet(A.WLK);
        this.sub = 1;
      }
      break;
    }
    this.armarVista();
    if (w.stayTime >= 30) this.pasoA(P.TOWARP);
  }
  controlPerform() {
    const w = this.w, d = this.d3(), aa = Math.abs(this.anguloJugador());
    switch (this.sub) {
     case 0:
      this.terminarAtaque();
      this.cond = C.BATTLE;
      this.animSet(A.ATT2A);
      w.modo = 0;
      w.attackSuccess = 0;
      this.sub = 1;
      break;

     case 1:
      if (this.terminada()) {
        this.animSet(A.ATT2B);
        w.modo = 1;
        w.attackWait = 0;
        w.timer = azar01() * 3;
        this.sub = 2;
      }
      break;

     case 2:
      {
        if (aa > R165 && d < 400) {
          this.pasoA(P.BACKATTACK);
          return;
        }
        if (w.stayTime >= 30) {
          this.animSet(A.ATT2C);
          this.sub = 6;
          break;
        }
        w.timer -= DT;
        if (w.timer > 0) break;
        if (!this.veJugadorDesdePies()) {
          this.pasoA(P.CHASE);
          return;
        }
        if (this.apuntado() === 1) {
          if (!this.enCono()) {
            this.animSet(A.ATT2C);
            this.sub = 6;
            w.modo = 0;
          } else {
            this.anim.velocidad(Math.abs(this.anim.vel));
            this.sub = 4;
            w.modo = 0;
          }
          break;
        }
        if (aa <= R135) {
          if ((!this.jugadorDebil() || w.attackSuccess === 0) && !this.hayAviso(15, 2, this.pos)) {
            const j = this.jugador();
            if (!this.seVe(this.centro, [ j.pos[0], j.pos[1] - 150, j.pos[2] ])) {
              this.animSet(A.ATT2C);
              this.sub = 5;
              break;
            }
            if (d <= 1200) {
              w.timer = azar01() * 2;
              break;
            }
            this.animSet(A.ATT2C);
            w.modo = 0;
            this.sub = 5;
            break;
          }
          this.animSet(A.ATT2C);
          this.sub = 6;
          break;
        }
        this.animSet(A.ATT2C);
        this.sub = 6;
        break;
      }

     case 4:
      if (this.apuntado() === 0 || aa > R90) {
        w.modo = 1;
        this.sub = 2;
        break;
      }
      if (d <= 1e3) break;
      this.animSet(A.ATT2C);
      w.modo = 0;
      this.sub = 5;
      break;

     case 5:
      this.edPaso(() => this.terminaPronto(.5), P.CHASE);
      break;

     case 6:
      this.edPaso(() => this.terminaPronto(.5), P.CAUTION);
      break;
    }
    this.girarHaciaJugador(this.lento() * DT * R30 * (w.trabado ? 6 : 1));
    w.attackWait -= DT;
    if (this.animL !== A.ATT2B || this.anim.vel <= 0 || w.attackWait > 0) {
      if (w.enAtaque) this.terminarAtaque();
      return;
    }
    if (this.esferaGolpe(100)) {
      w.attackSuccess++;
      this.terminarAtaque();
      w.attackWait = 1;
      return;
    }
    if (this.jugadorDaniado()) {
      this.terminarAtaque();
      w.attackWait = 1;
    }
  }
  controlCaution() {
    const w = this.w, j = this.jugador();
    let d = this.d3();
    const a = this.anguloJugador(), aa = Math.abs(a);
    let evaluar = false;
    if (this.sub === 0) {
      this.terminarAtaque();
      this.cond = C.CAUTION;
      w.modo = 0;
      evaluar = true;
      this.sub = 1;
    } else if (this.sub === 1) {
      evaluar = this.progreso() > .8;
      this.girarHacia(j.pos, this.lento() * DT * R120);
    } else if (this.sub === 2) {
      evaluar = this.progreso() > .8;
      const v = girarY([ j.pos[0] - this.pos[0], 0, j.pos[2] - this.pos[2] ], a * .5);
      this.girarHacia([ this.pos[0] + v[0], 0, this.pos[2] + v[2] ], this.lento() * DT * R120);
    }
    if (aa > R165 && d < 400) {
      this.pasoA(P.BACKATTACK);
      return;
    }
    if (!evaluar) {
      this.quedarse();
      return;
    }
    let uv;
    const lateral = lado => {
      let ang = lado === 5 ? R60 : -R60;
      d = ang;
      const libre = an => {
        const v = frente(this.rot + an, 240);
        return this.seVe([ this.pos[0], this.pos[1] - 100, this.pos[2] ], [ this.pos[0] + v[0], this.pos[1] - 100, this.pos[2] + v[2] ]);
      };
      if (libre(ang)) return w.trabado ? 3 : lado;
      ang *= -2;
      if (libre(ang)) return w.trabado ? 3 : lado === 5 ? 6 : 5;
      if (!this.veJugadorDesdePies()) return -1;
      return 3;
    };
    if (d <= 300 || d >= 800) {
      if (a > R60) uv = lateral(5); else if (a < -R60) uv = lateral(6); else if (d > 1200) {
        this.pasoA(P.CHASE);
        return;
      } else if (d > 800) uv = 3; else uv = 4;
    } else uv = lateral(a >= 0 ? 5 : 6);
    if (uv === -1) {
      this.pasoA(P.CHASE);
      return;
    }
    if (this.animL !== uv) {
      if (uv < 5 || uv > 6) {
        if (d < azar01() * 800 && this.apuntado() !== 1 && this.puedeAtacar()) {
          this.atacar();
          return;
        }
        this.sub = 1;
      } else {
        if ((this.animL === 5 || this.animL === 6) && this.puedeAtacar()) {
          if (d < azar01() * 800) {
            this.atacar();
            return;
          }
        }
        this.sub = 2;
      }
      this.animSet(uv);
    }
    this.quedarse();
  }
  atacar() {
    if (this.jugadorDebil() && azar01() < .5) this.pasoA(P.ATTACK); else this.pasoA(P.PERFORM);
  }
  quedarse() {
    if (this.w.stayTime >= 30) this.pasoA(P.TOWARP);
  }
  controlChase() {
    const w = this.w, j = this.jugador();
    if (this.sub === 0) {
      this.terminarAtaque();
      this.cond = C.CHASE;
      this.animSet(A.WLK);
      w.modo = 2;
      w.moveTimer = .5;
      this.sub = 1;
      this.quedarse();
      return;
    }
    const d = this.d3();
    const p = j.existe ? this.camino(j.pos) : null;
    if (p) {
      this.girarHacia(p, this.lento() * DT * R90);
      if (d < 500 && this.progreso() > .8 && this.veJugadorDesdePies()) {
        this.pasoA(P.PERFORM);
        return;
      }
      this.quedarse();
      return;
    }
    if (d < 1200) {
      this.pasoA(P.CAUTION);
      return;
    }
    this.quedarse();
  }
  ponerDetrasDelJugador() {
    const j = this.jugador();
    if (!j.existe) return;
    let p = null;
    if (azar01() >= .9) {
      for (let i = 0; i < 20 && !p; i++) {
        const q = this.puntoAlAzar();
        if (this.mismaParticion(q)) p = q;
      }
    }
    if (!p) {
      const atras = frente(j.rot + PI, 300);
      p = [ j.pos[0] + atras[0], j.pos[1], j.pos[2] + atras[2] ];
      const h = this.m.rayo?.([ j.pos[0], j.pos[1] - 100, j.pos[2] ], [ p[0], j.pos[1] - 100, p[2] ]);
      if (h) {
        const k = Math.max(0, (h.dist - 60) / 300);
        p = [ j.pos[0] + atras[0] * k, j.pos[1], j.pos[2] + atras[2] * k ];
      }
    }
    if (this.m.moverA) this.m.moverA(this, p[0], p[2]); else {
      this.pos[0] = p[0];
      this.pos[2] = p[2];
      this.pos[1] = p[1];
    }
    this.posAnt = [ ...this.pos ];
    this.rot = this.rotAnt = rumboHacia(j.pos, this.pos);
  }
  despuesDelWarp() {
    if (this.enCono(800, R45)) {
      this.pasoA(azar01() < .3 ? P.PERFORM : P.ATTACK);
      return;
    }
    if (this.d3() < 800) {
      this.pasoA(P.CAUTION);
      return;
    }
    this.pasoA(this.fueraDePantalla() ? P.WANDER : P.CHASE);
  }
  controlWarp() {
    if (this.sub === 0) {
      this.terminarAtaque();
      this.cond = C.WARP;
      this.animSet(A.NT2);
      this.sonido(this.SON.WARP);
      this.sub = 1;
    }
    if (this.sub === 1) {
      if (this.cuadro() > 15) {
        this.ponerDetrasDelJugador();
        this.sub = 2;
      }
      return;
    }
    if (this.sub === 2 && this.terminaPronto(.5)) this.despuesDelWarp();
  }
  controlToWarp(caminar) {
    const w = this.w;
    if (this.sub === 0) {
      this.terminarAtaque();
      this.cond = C.WARP;
      if (caminar) this.animSet(A.WLK);
      w.modo = 0;
      this.sonido(this.SON.WARP);
      w.warpAntes = .5;
      this.sub = 1;
    }
    if (this.sub === 1 && w.warpAntes <= 0) {
      w.warpDespues = .5;
      if (w.stayTime >= 30) {
        this.visible = false;
        this.pasoA(P.DEAD);
        this.cond = C.NADA;
        return;
      }
      this.ponerDetrasDelJugador();
      this.despuesDelWarp();
    }
  }
  controlInWall() {
    const w = this.w;
    if (this.sub === 0) {
      this.terminarAtaque();
      this.cond = C.INWALL;
      this.animSet(A.NT3);
      w.timer = 2 * azar01() + 3;
      this.sub = 1;
    }
    w.timer -= DT;
    if (w.timer <= 0) {
      if (azar01() < .2) {
        this.ponerDetrasDelJugador();
        this.sonido(this.SON.WARP);
        this.despuesDelWarp();
        w.warpDespues = .5;
        return;
      }
      w.timer += azar01();
    }
  }
  controlAttack() {
    if (this.sub === 0) {
      this.terminarAtaque();
      this.cond = C.BATTLE;
      this.animSet(A.ATT1);
      this.w.modo = 0;
      this.sonido(this.SON.ATAQUE);
      this.sub = 1;
    }
    if (this.sub === 1) this.edPaso(() => this.terminaPronto(.5), P.CAUTION);
    this.girarHaciaJugador(this.lento() * DT * R60);
    const f = this.cuadro();
    if (f < 27) {
      if (f > 9) this.esferaGolpe(99);
    } else if (this.w.enAtaque) this.terminarAtaque();
  }
  controlBackAttack() {
    if (this.sub === 0) {
      this.terminarAtaque();
      this.cond = C.BATTLE;
      this.animSet(A.ATT4);
      this.w.modo = 0;
      this.sonido(this.SON.ATRAS);
      this.sub = 1;
    }
    if (this.sub === 1) this.edPaso(() => this.terminaPronto(.5), P.TURN);
    const j = this.jugador();
    if (j.existe) this.girarHacia([ 2 * this.pos[0] - j.pos[0], 0, 2 * this.pos[2] - j.pos[2] ], this.lento() * DT * R60);
    const f = this.cuadro();
    if (f < 21) {
      if (f > 6) this.esferaGolpe(101);
    } else if (this.w.enAtaque) this.terminarAtaque();
  }
  controlTurn() {
    if (this.sub === 0) {
      this.terminarAtaque();
      this.cond = C.CHASE;
      this.animSet(A.WLK);
      this.w.modo = 0;
      this.sub = 1;
      return;
    }
    const j = this.jugador();
    if (!j.existe) return;
    this.girarHacia(j.pos, this.lento() * DT * PI);
    if (this.progreso() > .8 && this.cosHacia(j.pos) >= .5) this.pasoA(P.PERFORM);
  }
  controlSeize() {
    const w = this.w, j = this.jugador();
    switch (this.sub) {
     case 0:
      if (this.puedeAtacar()) {
        this.cond = C.CHASE;
        this.animSet(A.WLKS);
        w.modo = 0;
        w.timer = 2 * azar01();
        this.sub = 1;
      } else this.pasoA(P.ATTACK);
      return;

     case 1:
      {
        w.timer -= DT;
        let p = j.existe ? this.camino(j.pos) : null;
        if (!p) {
          p = j.pos;
          if (w.timer < 0) {
            this.pasoA(P.CHASE);
            return;
          }
        }
        this.girarHacia(p, this.lento() * DT * R60);
        if (w.timer < 0) {
          if (this.d3() <= 500) {
            this.cond = C.BATTLE;
            this.animSet(A.ATT3A);
            this.aviso(15, 2, this.pos, 1200, 5);
            this.sub = 2;
          } else this.pasoA(P.CHASE);
        }
        return;
      }

     case 2:
      {
        this.girarHaciaJugador(this.lento() * DT * R60);
        if (!this.terminada()) return;
        const c = this.mismoFrente();
        if (this.jugadorAtacable() && this.veJugadorDesdePies() && (c <= -.70710677 || c >= .70710677)) {
          const mano = this.conOffset(HUESO.MANO, MANO_AGARRE), pa = [ j.pos[0], j.pos[1] - 280, j.pos[2] ];
          const v = [ pa[0] - mano[0], pa[1] - mano[1], pa[2] - mano[2] ], f = frente(this.rot);
          if ((f[0] * v[0] + f[2] * v[2] < 0 || v[0] * v[0] + v[2] * v[2] < 19600) && this.agarrar()) {
            this.cond = C.SEIZE;
            this.sostener(mano);
            this.sonido(this.SON.AGARRE, true);
            this.animSet(A.ATT3B);
            w.timer = .5;
            this.sub = 3;
            return;
          }
        }
        this.animSet(A.ATT3C);
        this.sub = 4;
        return;
      }

     case 3:
      w.timer -= DT;
      if (!this.sostener(this.conOffset(HUESO.MANO, MANO_AGARRE))) {
        this.soltar();
        this.sonido(null, true);
        this.animSet(A.ATT3C);
        this.sub = 4;
      }
      return;

     case 4:
      if (this.terminaPronto(.5)) this.pasoA(P.CAUTION);
    }
  }
  agarrar() {
    if (this.m.agarradoPor && this.m.agarradoPor !== this) return false;
    const danio = this.m.parametros?.("SCRATCH", this.tipoParam)?.ataque1 ?? 10;
    this.w.agarrando = true;
    this.w.tAgarre = 0;
    this.m.agarrar?.(this, 1, danio, "NURSE_AGARRE");
    return true;
  }
  sostener(p) {
    this.m.sujetarJugador?.(this, p);
    const s = this.m.sigueAgarrado?.(this);
    if (s != null) return !!s;
    this.w.tAgarre += DT;
    return this.w.tAgarre < 4;
  }
  soltar() {
    if (this.w.agarrando) {
      this.w.agarrando = false;
      this.m.soltar?.(this);
    }
  }
  kindDe(g) {
    return BAK[g?.golpe] ?? (/FINISH/.test(String(g?.golpe || "")) ? 48 : 4);
  }
  sonidoDanio(g) {
    const k = this.kindDe(g);
    let t = [ 2, 3, 47, 72, 102, 103 ].includes(k) ? 2 : [ 42, 43, 44, 45, 73, 75, 76, 95, 106, 107, 109 ].includes(k) ? 0 : k === 48 ? 3 : 1;
    if (t !== 0) t = this.hp <= 0 ? 1 : t === 2 ? 2 : 3;
    this.sonido([ this.SON.ESPECIAL, this.SON.MUERE, this.SON.BALA, this.SON.GOLPE ][t]);
  }
  movimientoDanio(bdt, delante, sinAguante) {
    const u = delante ? 1 : 0;
    switch (bdt) {
     case 0:
     case 3:
     case 9:
     case 10:
      return sinAguante ? u + 8 : u + 2;

     case 1:
     case 13:
     case 15:
     case 17:
      return u + 13;

     case 2:
     case 8:
     case 21:
      return sinAguante ? u + 8 : u;

     case 4:
     case 6:
     case 12:
      return sinAguante ? 10 : 4;

     case 5:
     case 7:
     case 11:
      return sinAguante ? u + 11 : u + 5;

     case 14:
     case 18:
      return sinAguante ? 10 : u + 2;

     case 16:
      return 10;

     case 19:
     case 20:
      return sinAguante ? u + 15 : 7;

     default:
      return -1;
    }
  }
  animDanio(g, sinAguante) {
    const w = this.w, dir = g.dir || frente(this.rot + PI);
    const local = girarY(dir, -this.rot), delante = local[2] > 0;
    let mv;
    if ((g.bdt ?? 2) === 18) mv = delante ? 16 : 15; else mv = this.movimientoDanio(g.bdt ?? 2, delante, sinAguante);
    if (mv >= 8 && mv <= 16) w.caida = [ 0, 1, 1, 0, 1, 0, 1, 1, 0 ][mv - 8]; else w.caida = local[2] >= 0 ? 1 : 0;
    if (mv !== -1) {
      if (mv === 7) {
        w.timer = 0;
        this.animSet(mv + 8);
        return 3;
      }
      this.animSet(mv + 8);
      return mv >= 8 && mv <= 16 ? 2 : 1;
    }
    if (this.kindDe(g) === 43) {
      this.animSet(delante ? A.DMH2 : A.DMH1);
      return 7;
    }
    this.animSet(delante ? A.DMH2 : A.DMH1);
    return 1;
  }
  controlDamage() {
    const w = this.w;
    switch (this.sub) {
     case 0:
      {
        this.soltar();
        this.terminarAtaque();
        this.sonido(null, true);
        this.cond = C.DAMAGE;
        w.modo = 0;
        const g = this.danioPend || {
          danio: 0,
          bdt: 2,
          shock: 0,
          dir: frente(this.rot + PI)
        };
        this.danioPend = null;
        const aguante = this.quitar(g.danio || 0);
        w.ultimoGolpe = g.golpe || null;
        this.sonidoDanio(g);
        this.sub = this.animDanio(g, aguante <= 0);
        const dir = g.dir || [ 0, 0, 0 ], sh = g.shock ?? 40;
        w.hitback[0] += dir[0] * sh;
        w.hitback[1] += (dir[1] || 0) * sh;
        w.hitback[2] += dir[2] * sh;
        if (this.sub === 2 && this.enPozo()) this.sub = 4;
        break;
      }

     case 1:
      this.edPaso(() => this.terminaPronto(.5), P.PERFORM);
      break;

     case 2:
      this.edPaso(() => this.terminada(), P.DOWN);
      break;

     case 3:
      w.timer += DT;
      if (w.timer >= 1) {
        if (this.aguante <= 0) {
          this.animSet(A.XXC1 + w.caida);
          w.caida ^= 1;
          this.sub = 2;
          return;
        }
        this.animSet(A.DMCB);
        this.sub = 1;
      }
      break;

     case 4:
      {
        const k = {
          [A.XXP1]: .6,
          [A.XXS2]: .6,
          [A.XXC1]: .6,
          [A.XXP2]: .8,
          [A.XXS1]: .5,
          [A.XXC2]: .5
        }[this.animL] ?? .3;
        if (this.progreso() > k) this.pasoA(P.DOWN);
        break;
      }

     case 7:
      if (this.pasaCuadro(30)) this.m.aturdir?.(this);
      if (this.terminaPronto(.2)) this.pasoA(P.CAUTION);
      break;
    }
  }
  danioAdicional() {
    const g = this.danioPend;
    if (!g) return;
    this.danioPend = null;
    const w = this.w, aguante = this.quitar(g.danio || 0);
    w.ultimoGolpe = g.golpe || null;
    this.sonidoDanio(g);
    const dir = g.dir || [ 0, 0, 0 ], sh = g.shock ?? 40;
    w.hitback[0] += dir[0] * sh;
    w.hitback[2] += dir[2] * sh;
    if (this.edUsado || this.paso !== P.DAMAGE || this.sub === 6) return;
    if (this.sub === 3) {
      w.timer = 0;
      return;
    }
    this.sub = this.animDanio(g, aguante <= 0);
    if (this.sub === 2 && this.enPozo()) this.sub = 4;
  }
  danioSoloEmpuje() {
    const g = this.danioPend;
    if (!g) return;
    this.danioPend = null;
    this.quitar(g.danio || 0);
    this.sonidoGolpe(g);
    const dir = g.dir || [ 0, 0, 0 ], sh = (g.shock ?? 40) * .5;
    this.w.hitback[0] += dir[0] * sh;
    this.w.hitback[2] += dir[2] * sh;
  }
  danioSoloVida() {
    const g = this.danioPend;
    if (!g) return;
    this.danioPend = null;
    this.quitar(g.danio || 0);
    this.sonidoGolpe(g);
  }
  sonidoGolpe(g) {
    const nom = String(g?.golpe || ""), k = this.kindDe(g);
    if ([ 42, 43, 44, 45, 73, 75, 76, 95, 106, 107, 109 ].includes(k)) return;
    this.sonido(/^BAK_PLAYER_CUTTER(_ST)?$/.test(nom) ? 40070 : /^BAK_PLAYER_PICK(_ST)?$/.test(nom) ? 40064 : 40058);
  }
  danioEnElPiso() {
    const g = this.danioPend;
    if (!g) return;
    this.danioPend = null;
    const w = this.w;
    let d = g.danio || 0;
    if (g.atributo === 8 || /FINISH/.test(String(g.golpe || ""))) {
      w.finishCount++;
      d = this.hpMax;
    }
    this.quitar(d);
    w.ultimoGolpe = g.golpe || null;
    this.sonidoDanio(g);
    if (this.edUsado) return;
    this.animSet(A.ROTU + w.caida);
    if (this.hp > 0) w.relojCaida = w.relojCaida * .5 + azar01() * 10; else w.relojCaida = w.relojCaida >= 25 ? azar01() * 3 + 2 : 30;
    if (w.finishCount > 1) w.relojCaida = 0;
  }
  remateEspecial() {
    this.quitar(this.hpMax);
    this.charco();
    this.pasoA(P.FINISHED);
    this.sub = 99;
  }
  controlDown() {
    const w = this.w;
    if (this.sub > 3 && this.sub < 98 && !this.enPozo()) this.sub = 0;
    switch (this.sub) {
     case 0:
     case 98:
     case 99:
      {
        this.terminarAtaque();
        if (this.sub === 99) w.relojCaida = azar01() * 3 + 1; else if (this.sub !== 98) {
          if (this.hp > 0) {
            if (w.ultimoGolpe === "BAK_PLAYER_STUNGUN") w.relojCaida = azar01() * 7 + 3; else if (this.aguante > 0) w.relojCaida = azar01() * 3 + 2; else w.relojCaida = (azar01() + 1) * 5;
          } else w.relojCaida = (azar01() + 1) * 5;
        }
        this.cond = w.relojCaida <= 0 ? C.DAMAGE : C.DYING;
        w.modo = 0;
        this.sub = 1;
        return;
      }

     case 1:
      if (this.enPozo()) {
        this.caerPozo();
        return;
      }
      if (w.relojCaida <= 0 && !this.jugadorAtacando()) {
        if (this.hp <= 0) {
          this.morir();
          return;
        }
        this.cond = C.RISE;
        w.timer = .1;
        this.sub = 2;
        return;
      }
      if (azar01() < .001) {
        w.relojCaida += azar01() * 3 + 1;
        this.animSet(A.ROTU + w.caida);
        return;
      }
      if (this.animL !== A.DNT1 && this.animL !== A.DNT2 && this.terminada()) {
        this.animSet(A.DNT1 + w.caida);
        return;
      }
      if (this.exorcismo() !== 0) {
        this.pasoA(P.EXORCISMDOWN);
        this.sub = 1;
      }
      return;

     case 2:
     case 6:
      w.timer -= DT;
      if (w.timer <= 0) {
        this.animSet(A.UPU + w.caida);
        this.sub++;
      }
      return;

     case 3:
     case 7:
      this.edLlamar(() => this.terminaPronto(.5), () => this.revivir());
      return;

     case 4:
      w.timer -= DT;
      if (w.timer <= 0) {
        w.fallCount++;
        if (Math.round(azar01() * 3 - .49) + 4 < w.fallCount) {
          this.sub = 5;
          return;
        }
        this.sonido(this.SON.POZO);
        this.quitar(10);
        this.anim.t = 0;
        w.timer = .5;
      }
      return;

     case 5:
      if (w.relojCaida <= 0) {
        if (this.hp <= 0) {
          this.morir();
          return;
        }
        this.cond = C.RISE;
        this.sub = 6;
        return;
      }
      if (this.animL !== A.DNT1 && this.animL !== A.DNT2 && this.terminada()) this.animSet(A.DNT1 + w.caida); else if (this.exorcismo() !== 0) {
        this.pasoA(P.EXORCISMDOWN);
        this.sub = 6;
      }
    }
  }
  caerPozo() {
    const w = this.w;
    this.animSet(A.ROTU + w.caida);
    w.timer = 0;
    this.cond = C.DYING;
    w.modo = 4;
    w.fallCount = 0;
    this.sub = 4;
  }
  revivir() {
    const w = this.w;
    w.downCount++;
    if (this.exorcismo() <= 0) {
      if (this.hp > 0) this.curar(this.hpMax / (w.downCount + 3)); else {
        w.downCount = Math.floor(w.downCount / 2);
        this.curar(this.hpMax * .5);
      }
    }
    this.pasoA(P.CHASE);
  }
  morir() {
    this.animSet(A.ROTU + this.w.caida);
    this.charco();
    this.m.contarMuerte?.(this);
    this.pasoA(P.DEAD);
  }
  controlExorcismDown() {
    const w = this.w;
    switch (this.sub) {
     case 0:
      this.terminarAtaque();
      this.soltar();
      this.cond = C.DAMAGE;
      w.caida = azar01() < .5 ? 1 : 0;
      this.animSet(A.ROTU + w.caida);
      w.modo = 0;
      w.downCount = 0;
      w.relojCaida = this.hp > 0 ? azar01() * 3 : (azar01() + 1) * 600;
      this.sub = 1;
      return;

     case 1:
      if (this.enPozo()) {
        this.caerPozo();
        this.paso = P.DOWN;
        return;
      }
      if (w.relojCaida <= 0) {
        this.cond = C.RISE;
        w.timer = .1;
        this.sub = 2;
        return;
      }
      if (this.animL !== A.DNT1 && this.animL !== A.DNT2 && this.terminada()) {
        this.cond = C.DYING;
        this.animSet(A.DNT1 + w.caida);
      }
      return;

     case 2:
      w.timer -= DT;
      if (w.timer <= 0) {
        this.animSet(A.UPU + w.caida);
        this.sub = 3;
      }
      return;

     case 3:
      this.edLlamar(() => this.terminaPronto(.5), () => this.revivir());
    }
  }
  controlFinished() {
    const w = this.w;
    if (this.sub === 0 || this.sub === 99) {
      this.cond = C.DEAD;
      this.radio = 0;
      if (this.sub === 99) {
        w.timer = 1;
        this.sub = 3;
        return;
      }
      w.caida = [ A.DNT2, A.ROTD, A.TDMD ].includes(this.animL) ? 1 : 0;
      this.sub = 1;
      return;
    }
    if (this.sub === 3) {
      w.timer -= DT;
      if (w.timer <= 0) {
        this.sonido(this.SON.REMATE);
        this.animSet(A.TDMU + w.caida);
        this.sub = 1;
      }
      return;
    }
    if (this.sub === 1 && this.terminada()) this.sub = 2;
  }
  controlEvent() {
    if (this.sub === 0) {
      this.cond = C.EVENT;
      this.animSet(A.NT);
      this.sub = 1;
    }
  }
  controlDead() {
    if (this.sub === 0) {
      this.cond = C.DEAD;
      this.radio = 0;
      this.soltar();
      this.sonido(null, true);
      if (this.anim.loop) this.anim.velocidad(0);
      this.sub = 1;
    }
  }
}
