// SH4 web — FeniXVOID · Project Ravenlight
import { FPS, DT, envolver, rumboHacia, frente, dist3, distXZ, girarY, azar01 } from "./comun.js";

import { C } from "./ia_hyena.js";

const CK = {
  CAUTION: 2,
  ESCAPE: 4,
  BATTLE: 5,
  RISE: 8,
  HIDDEN: 13,
  EVENT: 18
};

export const A = {
  NT: 0,
  DMH1: 1,
  DMP1: 2,
  DMP2: 3,
  DMP3: 4,
  DMS1: 5,
  DMS2: 6,
  XXP1: 7,
  XXP2: 8,
  XXS1: 9,
  XXG1: 10,
  XXG2: 11,
  XXC1: 12,
  XXC2: 13,
  ATT1: 14,
  ATT2: 15,
  ATT3: 16,
  ATT4: 17,
  ATT5: 18,
  ROD: 19,
  UPU: 20,
  DDM: 21,
  DIE: 22,
  APR: 23,
  LOK: 24,
  LOK2: 25,
  DIEW: 26,
  EVT: 27,
  APR_R: 28,
  LOK_R: 29,
  PARED: 30
};

const BIN_V0 = [ 0, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 1, 2, 27, 26, 27 ];

const BIN_V1 = [ 0, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 1, 2, 3, 26 ];

export const NOMBRES_ANIM_KABE = [ "NT", "APR", "LOK", "LOK2D", "DMH1", "DMP1", "DMP2", "DMP3", "DMS1", "DMS2", "XXP1", "XXP2", "XXS1", "XXG1", "XXG2", "XXC1", "XXC2", "ATT1", "ATT2", "ATT3", "ATT4", "ATT5", "ROD", "UPU", "DDM", "DIE", "DIEW", "LOK2" ];

export const P = {
  INIT: 0,
  HIDDEN: 1,
  WAIT: 2,
  LOOK: 3,
  ATTACKW: 4,
  APPEAR: 5,
  STAY: 6,
  DISAPPEAR: 7,
  ATTACKA: 8,
  DAMAGE: 9,
  DOWN: 10,
  DEAD: 11,
  DEADSINCESTART: 12,
  EVENT: 13,
  NOMOVE: 14,
  WAIT2: 15,
  APPEAR2: 16,
  DISAPPEAR2: 17,
  DEAD2: 18,
  TEST: 19
};

export const NOMBRE_PASO = Object.fromEntries(Object.entries(P).map(([k, v]) => [ v, k ]));

const GOLPE = {
  77: {
    golpe: "BAK_KABE_STRIKE",
    danio: 10,
    shock: 50
  },
  78: {
    golpe: "BAK_KABE_BRINGDOWN",
    danio: 10,
    shock: 80
  },
  79: {
    golpe: "BAK_KABE_SIDEBLOW",
    danio: 10,
    shock: 100
  },
  80: {
    golpe: "BAK_KABE_HEADBUTT",
    danio: 10,
    shock: 50
  }
};

const ATAQUE = {
  [A.ATT1]: [ 16, 79 ],
  [A.ATT2]: [ 20, 78 ],
  [A.ATT3]: [ 11, 80 ],
  [A.ATT4]: [ 16, 78 ],
  [A.ATT5]: [ 20, 77 ]
};

const RADIO_ATAQUE = 120;

const SON = {
  SALE: 60300,
  ENTRA: 60301,
  ATAQUE: 60302,
  DANIO: 60303,
  LLEGA: 60304,
  DANIO_CONT: 60305
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

const LEJOS = 17014118e31;

export function modeloKabe(def) {
  const t = def.tipo_param || 0;
  if (t === 1 || t === 2) return "enemy_model_kbo_lr.bin";
  if (t === 3) return "enemy_kabe_dek.bin";
  return (def.archivos || []).find(a => a.startsWith("enemy_model_kbo_")) || "enemy_kabe.bin";
}

export function parteModeloKabe(def) {
  return (def.tipo_param || 0) === 2 ? 1 : 0;
}

const compartido = new WeakMap;

function estadoDe(m) {
  let s = compartido.get(m);
  if (!s) {
    s = {
      kabes: [],
      esperas: [],
      reloj: 0
    };
    compartido.set(m, s);
  }
  return s;
}

export class Kabe {
  constructor(def, pj, anim, m) {
    this.tipo = "WALLMAN";
    this.def = def;
    this.pj = pj;
    this.anim = anim;
    this.m = m;
    this.tipoParam = def.tipo_param || 0;
    const ini = (def.estado_inicial ?? def.ini ?? 0) & 15;
    this.ini = ini;
    const etapa = def.etapa ?? m.etapa ?? null;
    this.variante = this.tipoParam !== 0 && (etapa === "cm" || etapa === 8 || (def.archivos || []).includes("enemy_kabe_dek.bin")) ? 1 : 0;
    this.binDe = this.variante ? BIN_V1 : BIN_V0;
    this.param = m.parametros("WALLMAN", this.variante);
    this.hp = this.hpMax = this.param.vida;
    this.aguante = this.aguanteMax = this.param.aguante;
    this.pos = [ ...def.pos ];
    this.posIni = [ ...def.pos ];
    this.rot = def.rumbo || 0;
    this.posAnt = [ ...this.pos ];
    this.rotAnt = this.rot;
    this.radio = 80;
    this.alto = 280;
    this.centroAlto = 245;
    this.sinPasos = true;
    this.cond = CK.HIDDEN;
    this.paso = P.INIT;
    this.sub = 0;
    this.animId = -1;
    this.golpes = [];
    this.eventos = [];
    this.revisaDanio = false;
    this.atacando = null;
    this.centro = [ this.pos[0], this.pos[1] - this.centroAlto, this.pos[2] ];
    this.visible = false;
    this.opacidad = 0;
    this.borrado = false;
    this.w = {
      timer: 0,
      transparencia: 1,
      objetivo: -1,
      enAtaque: 0,
      cuerpo: 0,
      cuadros: 0,
      sonCont: -99
    };
    const s = estadoDe(m);
    if (s.kabes.some(k => k.w.cuadros > 0)) {
      s.kabes = [];
      s.esperas = [];
      s.reloj = 0;
    }
    s.kabes.push(this);
    this.comp = s;
    this.jefe = ini === 8;
    if (this.jefe) {
      this.cond = 0;
      return;
    }
    if (ini === 3) this.paso = P.DEADSINCESTART; else if (ini === 7) this.paso = P.NOMOVE;
  }
  caido() {
    return this.paso === P.DOWN || this.paso === P.DAMAGE && this.sub >= 2 || this.paso === P.DEADSINCESTART;
  }
  persigue() {
    return !this.jefe && [ P.LOOK, P.ATTACKW, P.APPEAR, P.STAY, P.ATTACKA, P.DAMAGE, P.DOWN, P.APPEAR2 ].includes(this.paso);
  }
  intocable() {
    return this.jefe || this.borrado || this.cond === C.DEAD || this.w.transparencia >= 1 || this.w.cuerpo < 1;
  }
  get radioGolpe() {
    return this.w.cuerpo;
  }
  get sinSangre() {
    return false;
  }
  pasoA(n) {
    this.paso = n;
    this.sub = 0;
  }
  jugador() {
    return this.m.jugador();
  }
  nivel() {
    return this.m.nivel;
  }
  sonido(id) {
    this.m.sonido?.(this, id);
  }
  bin(id) {
    return this.binDe[id] ?? 0;
  }
  distXZJugador() {
    const j = this.jugador();
    return j.existe ? distXZ(this.pos, j.pos) : LEJOS;
  }
  dist3Jugador() {
    const j = this.jugador();
    return j.existe ? dist3(this.pos, j.pos) : LEJOS;
  }
  distCamara() {
    const c = this.m.posCamara?.();
    return c ? dist3(this.pos, c) : this.dist3Jugador();
  }
  objetivoVisible() {
    const j = this.jugador();
    if (!j.existe) return -1;
    return this.m.lineaDeVista?.(this.centro, j.pos) ?? true ? 0 : -1;
  }
  objetivoCualquiera() {
    return 0;
  }
  mismaParticion() {
    return this.m.mismaParticion?.(this, this.jugador().pos) ?? true;
  }
  apuntado() {
    const j = this.jugador();
    if (!j.existe) return 0;
    if (!(j.estado > 2 && j.estado < 6)) return 0;
    if (this.m.objetivoJugador) {
      const o = this.m.objetivoJugador();
      return o === this || o?.enemigo === this ? 1 : 2;
    }
    const a = Math.abs(envolver(rumboHacia(this.pos, j.pos) - j.rot));
    return a < .349 && distXZ(this.pos, j.pos) < 2e3 ? 1 : 2;
  }
  jugadorMira() {
    const j = this.jugador();
    if (!j.existe) return -1;
    const f = frente(j.rot), dx = this.pos[0] - j.pos[0], dz = this.pos[2] - j.pos[2], L = Math.hypot(dx, dz) || 1;
    return (f[0] * dx + f[2] * dz) / L;
  }
  jugadorAtacable() {
    const j = this.jugador();
    if (!j.existe) return false;
    if ([ ST.DAMAGE, ST.EVENT, ST.GODMODE, ST.DEAD ].includes(j.estado)) return false;
    return (this.m.relojAtaque?.() ?? this.comp.reloj) >= 5;
  }
  puedeAtacar() {
    return this.jugadorAtacable() && !this.esperaCerca();
  }
  esperaCerca() {
    return this.comp.esperas.some(e => e.t > 0 && dist3(e.pos, this.centro) < e.radio);
  }
  ponerEspera() {
    this.comp.esperas.push({
      pos: [ ...this.centro ],
      radio: 1e3,
      t: 2
    });
  }
  anguloObjetivo() {
    const j = this.jugador();
    return j.existe ? envolver(rumboHacia(j.pos, this.pos) - this.rot) : 0;
  }
  hueso(i) {
    const r = this.pj.reproductor;
    if (r.anim !== this.anim.anim) r.poner(this.anim.anim);
    r.t = this.anim.t;
    r.loop = this.anim.loop;
    const pose = r.avanzar(0);
    const g = girarY([ pose.absPos[i * 3], pose.absPos[i * 3 + 1], pose.absPos[i * 3 + 2] ], this.rot);
    return [ this.pos[0] + g[0], this.pos[1] + g[1], this.pos[2] + g[2] ];
  }
  terminada() {
    return this.animId === -1 || this.anim.n < 0 || this.anim.fin || this.anim.loop && this.anim.vuelta;
  }
  terminaPronto(s = .5) {
    if (this.animId === -1 || this.anim.n < 0) return true;
    const v = this.anim.vel, n = Math.round(Math.abs(v) * s * FPS - .49), c = this.anim.cuadro;
    return v >= 0 ? this.anim.dur - n <= c : c <= n;
  }
  progreso() {
    const p = this.anim.t / this.anim.dur;
    return this.anim.vel >= 0 ? p : 1 - p;
  }
  ponerBin(id, op) {
    this.anim.poner(this.bin(id), op);
  }
  animSinMezcla(id) {
    if (this.anim.n < 0 || this.animId === A.PARED || this.animId !== id || this.anim.n !== this.bin(id)) this.ponerBin(id);
    this.animId = id;
  }
  animMezcla(id) {
    this.ponerBin(id);
    this.animId = id;
  }
  animAlReves(real, marca) {
    const b = this.bin(real), prev = this.animId;
    if (this.anim.n === b && (prev === real || prev === marca) && this.anim.t > 0) {
      this.anim.velocidad(-Math.max(1, this.anim.t / 6));
      this.anim.fin = false;
    } else this.anim.poner(b, {
      vel: -1,
      desde: -1
    });
    this.animId = marca;
  }
  animeSet(id) {
    if (id === A.DIE) {
      this.ponerBin(A.DIE);
      this.animId = A.DIE;
      return;
    }
    if (id === A.PARED) {
      if (this.anim.n < 0) this.ponerBin(A.APR, {
        vel: -1
      });
      this.animId = A.PARED;
      return;
    }
    const rev = id === A.APR_R || id === A.LOK_R, real = id === A.APR_R ? A.APR : id === A.LOK_R ? A.LOK : id;
    let prev = this.animId;
    if (rev) this.animAlReves(real, id); else if (this.anim.n < 0) {
      this.ponerBin(real);
      prev = A.PARED;
      this.animId = real;
    } else if (prev === A.PARED) {
      this.ponerBin(real);
      this.animId = real;
    } else if ([ A.NT, A.UPU, A.LOK2, A.DIEW, A.EVT ].includes(real)) this.animSinMezcla(real); else this.animMezcla(real);
    if (id >= A.ATT1 && id <= A.ATT3 && prev === A.NT) this.anim.t = 8;
    if (id >= A.ATT1 && id <= A.ATT5) this.sonido(SON.ATAQUE); else if (id === A.APR || id === A.LOK) this.sonido(SON.SALE); else if (id === A.DIEW || id === A.APR_R || id === A.LOK_R) this.sonido(SON.ENTRA);
  }
  alTerminar(p) {
    this.eventos.push({
      c: () => this.terminada(),
      p: p
    });
  }
  alCasiTerminar(p) {
    this.eventos.push({
      c: () => this.terminaPronto(.5),
      p: p
    });
  }
  alDanio() {
    this.revisaDanio = true;
    this.eventos.push({
      c: () => this.hayDanio(),
      p: P.DAMAGE
    });
  }
  alDanioAdicional() {
    this.revisaDanio = true;
    this.eventos.push({
      c: () => this.hayDanio(),
      f: () => this.danioAdicional()
    });
  }
  hayDanio() {
    return this.golpes.some(g => g.danio > 0);
  }
  procesarEventos() {
    let cambio = false;
    for (const e of this.eventos) {
      if (!e.c()) continue;
      if (e.f) e.f(); else if (!cambio) {
        cambio = true;
        this.pasoA(e.p);
      }
    }
    this.eventos.length = 0;
    if (!this.revisaDanio) this.golpes.length = 0;
    this.revisaDanio = false;
  }
  tick() {
    this.posAnt = [ ...this.pos ];
    this.rotAnt = this.rot;
    const w = this.w, s = this.comp;
    w.cuadros++;
    if (s.kabes[0] === this) {
      s.reloj += DT;
      for (const e of s.esperas) e.t -= DT;
      s.esperas = s.esperas.filter(e => e.t > 0);
    }
    if (this.jefe || this.borrado) {
      this.visible = false;
      this.opacidad = 0;
      this.golpes.length = 0;
      return;
    }
    this.control();
    if (w.transparencia < 1 && this.anim.n >= 0) {
      this.anim.avanzar();
      this.centro = this.hueso(2);
    }
    this.cambiarCuerpo();
    this.revisarAtaque();
    this.procesarEventos();
    this.visible = w.transparencia < 1;
    this.opacidad = 1 - w.transparencia;
  }
  cambiarCuerpo() {
    const w = this.w, id = this.animId;
    const obj = w.transparencia < 1 && id !== A.DIEW && !(id >= A.APR_R && id <= A.PARED) ? 80 : 0;
    const paso = DT * 80, d = obj - w.cuerpo;
    w.cuerpo = d < -paso ? w.cuerpo - paso : d > paso ? w.cuerpo + paso : obj;
  }
  control() {
    const w = this.w;
    if (w.enAtaque && this.paso !== P.ATTACKW && this.paso !== P.ATTACKA) {
      this.terminarAtaque();
      w.enAtaque = 0;
    }
    switch (this.paso) {
     case P.INIT:
      this.controlInit();
      break;

     case P.HIDDEN:
      this.controlHidden();
      break;

     case P.WAIT:
      this.controlWait();
      break;

     case P.LOOK:
      this.controlLook();
      break;

     case P.ATTACKW:
      this.controlAttackW();
      break;

     case P.APPEAR:
      this.controlAppear();
      break;

     case P.STAY:
      this.controlStay();
      break;

     case P.DISAPPEAR:
      this.controlDisappear();
      break;

     case P.ATTACKA:
      this.controlAttackA();
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

     case P.DEADSINCESTART:
      this.controlDeadSinceStart();
      break;

     case P.EVENT:
      this.controlEvent();
      break;

     case P.NOMOVE:
      this.controlNoMove();
      break;

     case P.WAIT2:
      this.controlWait2();
      break;

     case P.APPEAR2:
      this.controlAppear2();
      break;

     case P.DISAPPEAR2:
      this.controlDisappear2();
      break;

     case P.DEAD2:
      this.controlDead2();
      break;

     default:
      break;
    }
    if (this.cond === CK.HIDDEN) w.transparencia = Math.min(1, w.transparencia + DT); else w.transparencia = Math.max(0, w.transparencia - DT);
  }
  controlInit() {
    const w = this.w;
    w.objetivo = this.objetivoCualquiera();
    if (this.variante === 1) {
      this.pos[1] = this.posIni[1] - 1600;
      w.transparencia = 0;
      this.pasoA(P.WAIT2);
      return;
    }
    if (this.ini === 6) {
      w.transparencia = 0;
      this.pasoA(P.EVENT);
      if (this.pos[2] > -800) {
        this.pos = [ -800, -200, -1190 ];
        this.rot = .55;
      }
      return;
    }
    if (this.dist3Jugador() > 2400) {
      w.transparencia = 1;
      this.pasoA(P.HIDDEN);
    } else {
      w.transparencia = 0;
      this.pasoA(P.WAIT);
    }
  }
  controlHidden() {
    const w = this.w;
    if (this.sub === 0) {
      this.cond = CK.HIDDEN;
      this.sub = 1;
    }
    w.objetivo = this.objetivoCualquiera();
    if (this.distXZJugador() < 2400 || this.distCamara() < 2400) this.pasoA(P.WAIT);
  }
  controlWait() {
    const w = this.w;
    w.objetivo = this.objetivoVisible();
    const d = w.objetivo === -1 ? LEJOS : this.distXZJugador();
    if (this.sub === 0) {
      this.cond = C.NORMAL;
      if (this.anim.n < 0) this.ponerBin(A.APR, {
        vel: -1
      });
      this.animId = A.PARED;
      this.sub = 1;
    }
    if (this.sub === 1) {
      if (w.objetivo !== -1 && this.mismaParticion()) {
        let n = -1;
        if (this.apuntado() === 1 || d < 360) n = P.APPEAR; else if (d < 700 && azar01() < .1) n = this.puedeAtacar() ? P.ATTACKW : P.APPEAR; else if (azar01() < .003) n = azar01() < .5 ? P.LOOK : P.APPEAR;
        if (n >= 0) this.pasoA(n);
      } else this.sub = 2;
    } else if (this.sub === 2) {
      if (w.objetivo !== -1 && this.mismaParticion()) this.sub = 1; else if (azar01() < .01) this.pasoA(P.LOOK);
    }
    if (d > 3e3 && this.distCamara() > 3e3) {
      this.pasoA(P.HIDDEN);
      return;
    }
    if (w.objetivo !== -1 && this.mismaParticion() && d < 700 && this.puedeAtacar()) this.pasoA(P.ATTACKW);
  }
  controlLook() {
    const w = this.w;
    w.objetivo = this.objetivoVisible();
    if (w.objetivo === -1) w.objetivo = this.objetivoCualquiera();
    switch (this.sub) {
     case 0:
      this.cond = C.NORMAL;
      this.animMezcla(A.LOK);
      this.sonido(SON.SALE);
      w.timer = 0;
      this.sub = 1;

     case 1:
      {
        let revisar = !this.terminada();
        if (!revisar) {
          w.timer -= DT;
          if (w.timer > 0) revisar = true; else if (azar01() >= .2) {
            this.animSinMezcla(A.LOK2);
            w.timer = azar01();
          } else {
            this.animAlReves(A.LOK, A.LOK_R);
            this.sonido(SON.ENTRA);
            this.sub = 2;
          }
        }
        if (revisar) {
          if (this.apuntado() === 1 || this.m.tocaJugador?.(this)) {
            this.animAlReves(A.LOK, A.LOK_R);
            this.sonido(SON.ENTRA);
            this.sub = 3;
          } else if (this.distXZJugador() < 360 && this.puedeAtacar()) this.pasoA(P.ATTACKW);
        }
        break;
      }

     case 2:
      this.alTerminar(P.WAIT);
      return;

     case 3:
      this.alCasiTerminar(P.APPEAR);
      return;

     case 4:
      this.alTerminar(P.HIDDEN);
      return;

     default:
      break;
    }
    if (w.objetivo === -1 || this.distXZJugador() <= 3e3 || this.distCamara() <= 3e3) {
      this.alDanio();
      return;
    }
    this.animAlReves(A.LOK, A.LOK_R);
    this.sonido(SON.ENTRA);
    this.sub = 4;
  }
  controlAttackW() {
    const w = this.w;
    if (this.sub === 0) {
      this.cond = CK.BATTLE;
      const d = this.anguloObjetivo(), a = Math.abs(d);
      let id;
      if (a < azar01() * .5235988 + .08726647) id = A.ATT3; else if (d >= 0) id = d > 0 && azar01() < .9 ? A.ATT1 : A.ATT2; else id = azar01() >= .5 ? A.ATT2 : A.ATT1;
      this.animeSet(id);
      this.anim.velocidad((azar01() + 1) * .5);
      this.sub = 1;
    } else if (this.sub === 1) {
      if (this.progreso() > .7 && this.distXZJugador() < 360) {
        this.pasoA(P.APPEAR);
        return;
      }
      this.alTerminar(P.WAIT);
    } else if (this.sub === 2) this.alTerminar(P.WAIT);
    this.alDanio();
    if (this.sub < 2) this.ataqueCuadro(false);
  }
  controlAppear() {
    if (this.sub === 0) {
      this.cond = C.NORMAL;
      this.animMezcla(A.APR);
      this.sonido(SON.SALE);
      this.sub = 1;
    } else if (this.sub !== 1) {
      this.alDanio();
      return;
    }
    this.alCasiTerminar(P.STAY);
    this.alDanio();
  }
  controlStay() {
    const w = this.w;
    w.objetivo = this.objetivoVisible();
    if (this.sub === 0) {
      this.cond = C.NORMAL;
      this.animSinMezcla(A.NT);
      w.timer = azar01() * 10 + 5;
      this.sub = 1;
    } else if (this.sub !== 1) {
      this.alDanio();
      return;
    }
    if (w.objetivo === -1) {
      if (this.variante === 0) this.pasoA(P.DISAPPEAR);
      w.objetivo = this.objetivoCualquiera();
    }
    let n = -1;
    if (w.objetivo === -1 || !this.mismaParticion()) n = this.variante === 0 ? P.DISAPPEAR : P.DISAPPEAR2; else {
      const d = this.distXZJugador();
      if (d >= 700) {
        if (this.variante === 0) {
          if (this.apuntado() !== 0 || this.jugadorMira() >= 0) {
            w.timer -= DT;
            if (w.timer > 0) {
              this.alDanio();
              return;
            }
          }
          n = P.DISAPPEAR;
        } else if (d > 1200) n = P.DISAPPEAR2;
      } else if (this.puedeAtacar()) n = P.ATTACKA;
    }
    if (n >= 0) this.pasoA(n);
    this.alDanio();
  }
  controlDisappear() {
    if (this.sub === 0) {
      this.cond = CK.ESCAPE;
      this.animAlReves(A.APR, A.APR_R);
      this.sonido(SON.ENTRA);
      this.sub = 1;
    } else if (this.sub !== 1) {
      this.alDanio();
      return;
    }
    this.alTerminar(P.WAIT);
    this.alDanio();
  }
  controlAttackA() {
    if (this.sub === 0) {
      this.cond = CK.BATTLE;
      const d = this.anguloObjetivo(), a = Math.abs(d), r = azar01();
      let id;
      if (a >= .2617994) {
        if (d >= 0) id = r < .7 ? A.ATT5 : r < .9 ? A.ATT2 : A.ATT1; else id = r < .8 ? A.ATT1 : A.ATT4;
      } else id = r < .5 ? A.ATT3 : r < .8 ? A.ATT4 : r < .9 ? A.ATT1 : A.ATT2;
      this.animeSet(id);
      this.sub = 1;
    } else if (this.sub > 0 && this.sub < 3) {
      if (this.animId >= A.ATT1 && this.animId <= A.ATT3) this.alCasiTerminar(P.STAY); else this.alTerminar(P.STAY);
    }
    this.alDanio();
    if (this.sub < 2) this.ataqueCuadro(true);
  }
  ataqueCuadro(parado) {
    const w = this.w, at = ATAQUE[this.animId] || [ 11, 80 ];
    const f = this.anim.cuadro;
    if (f <= 12) return;
    if (f < 30) {
      if (!this.atacando || this.atacando.bak !== at[1]) {
        this.atacando = {
          bak: at[1],
          hueso: at[0],
          pego: false
        };
        w.enAtaque = 1;
      }
      if (this.atacando.pego) {
        this.ponerEspera();
        this.terminarAtaque();
        w.enAtaque = 0;
        this.sub++;
        return;
      }
      this.atacando.hueso = at[0];
    } else if (w.enAtaque) {
      if (parado && azar01() < .3) this.ponerEspera();
      this.terminarAtaque();
      w.enAtaque = 0;
    }
  }
  terminarAtaque() {
    this.atacando = null;
  }
  revisarAtaque() {
    const at = this.atacando;
    if (!at || at.pego) return;
    const j = this.jugador();
    if (!j.existe) return;
    const c = this.hueso(at.hueso), r = RADIO_ATAQUE + (this.m.radioJugador ?? 40);
    if (distXZ(c, j.pos) > r || c[1] > j.pos[1] + RADIO_ATAQUE || c[1] < j.pos[1] - 360 - RADIO_ATAQUE) return;
    at.pego = true;
    const g = GOLPE[at.bak];
    this.m.golpear(this, g.danio, g.golpe, {
      shock: g.shock,
      dir: frente(rumboHacia(j.pos, c)),
      pos: c
    });
  }
  recibir(g) {
    if (this.cond !== C.DEAD && !this.jefe) this.golpes.push(g);
  }
  tomarGolpe() {
    if (!this.golpes.length) return {
      danio: 0,
      bdt: 22,
      golpe: "",
      shock: 0,
      dir: [ 0, 0, 1 ]
    };
    let g = this.golpes[0], total = 0;
    for (const x of this.golpes) {
      total += x.danio || 0;
      if ((x.danio || 0) > (g.danio || 0)) g = x;
    }
    this.golpes.length = 0;
    return {
      ...g,
      danio: total
    };
  }
  reducirVida(d) {
    this.hp -= d;
    if (this.hp <= 0) {
      this.hp = 0;
      this.aguante = 0;
      return;
    }
    this.aguante = Math.max(0, this.aguante - d);
  }
  recuperar(v) {
    this.hp = Math.min(this.hp + v, this.hpMax);
    this.aguante = Math.min(this.hp, this.aguanteMax);
  }
  sonidoDanio(g) {
    if (/STUNGUN|SPRAY|CHAINSAW/.test(String(g.golpe || ""))) {
      if (this.w.cuadros - this.w.sonCont < FPS) return;
      this.w.sonCont = this.w.cuadros;
      this.sonido(SON.DANIO_CONT);
    } else this.sonido(SON.DANIO);
  }
  animDanio(g) {
    const abajo = this.aguante <= 0, t = g.bdt;
    let r = abajo ? 1 : 0, a;
    switch (t) {
     case 0:
      a = abajo ? A.XXG1 : A.DMP1;
      break;

     case 4:
     case 6:
     case 12:
     case 14:
      a = abajo ? A.XXP2 : A.DMP3;
      break;

     case 5:
     case 7:
      a = abajo ? A.XXS1 : A.DMS1;
      break;

     case 10:
      a = abajo ? A.XXP1 : A.DMP2;
      break;

     case 11:
      a = abajo ? A.XXS1 : A.DMS2;
      break;

     case 13:
     case 15:
     case 17:
      r = 1;
      a = A.XXG1;
      break;

     case 16:
      r = 1;
      a = A.XXG2;
      break;

     case 18:
      a = abajo ? A.XXP1 : A.DMS2;
      break;

     case 19:
     case 20:
      r = 2;
      a = A.XXC1;
      break;

     default:
      {
        const st = [ 1, 3, 5, 7, 9, 11, 13, 15, 17, 20 ].includes(t) ? 1 : [ 0, 2, 4, 6, 8, 10, 12, 14, 16, 19, 21 ].includes(t) ? 0 : 2;
        a = abajo ? A.XXP1 : st !== 0 ? A.DMP2 : A.DMH1;
      }
    }
    this.animeSet(a);
    this.sonidoDanio(g);
    return r;
  }
  controlDamage() {
    const w = this.w;
    switch (this.sub) {
     case 0:
      {
        this.cond = C.DAMAGE;
        const g = this.tomarGolpe();
        this.reducirVida(g.danio);
        this.sub = this.animDanio(g) + 1;
        w.timer = 0;
        return;
      }

     case 1:
      this.alTerminar(P.STAY);
      this.alDanio();
      return;

     case 2:
      this.alTerminar(P.DOWN);
      this.alDanioAdicional();
      return;

     case 3:
      w.timer += DT;
      if (w.timer >= .5) {
        this.animMezcla(A.XXC2);
        this.sub = 2;
      }
      this.alDanioAdicional();
      return;

     default:
      return;
    }
  }
  danioAdicional() {
    const w = this.w, g = this.tomarGolpe();
    this.reducirVida(g.danio);
    this.sonidoDanio(g);
    if (this.paso === P.DAMAGE) {
      w.timer = azar01() * 4 + 3;
      this.pasoA(P.DOWN);
      this.sub = 1;
    }
    if (this.paso === P.DOWN && this.sub === 1) {
      if (this.hp <= 0) {
        this.animeSet(A.DIE);
        this.sub = 3;
        return;
      }
      this.animMezcla(A.DDM);
      const tope = azar01() * 7 + 3;
      w.timer = Math.min(tope, azar01() * 3 + w.timer);
    }
  }
  controlDown() {
    const w = this.w;
    switch (this.sub) {
     case 0:
      this.cond = C.DAMAGE;
      if (!(this.hp > 0)) break;
      w.timer = azar01() * 7 + 3;
      this.sub = 1;

     case 1:
      w.timer -= DT;
      if (w.timer > 0) {
        if (this.animId === A.DDM && this.terminada()) this.animSinMezcla(A.ROD);
        this.alDanioAdicional();
        return;
      }
      this.cond = CK.RISE;
      this.recuperar(this.hpMax * .25);
      this.animSinMezcla(A.UPU);
      this.sub = 2;
      return;

     case 2:
      this.alTerminar(P.STAY);
      return;

     case 3:
      if (!this.terminada()) return;
      break;

     default:
      return;
    }
    this.cond = C.DEAD;
    this.m.contarMuerte?.(this);
    if (this.variante === 0) {
      this.animSinMezcla(A.DIEW);
      this.sonido(SON.ENTRA);
      this.pasoA(P.DEAD);
    } else this.pasoA(P.DEAD2);
  }
  controlDead() {
    if (this.sub === 0) {
      if (this.distCamara() > 2400 && this.terminada()) {
        this.cond = CK.HIDDEN;
        this.sub = 1;
      }
    } else if (this.sub === 1 && this.w.transparencia >= 1) this.borrado = true;
  }
  controlDeadSinceStart() {
    if (this.sub !== 0) return;
    this.cond = C.DYING;
    this.ponerBin(A.DIE, {
      desde: -1
    });
    this.animId = A.DIE;
    this.sub = 1;
  }
  controlEvent() {
    if (this.sub === 0) {
      this.cond = CK.EVENT;
      this.animSinMezcla(A.EVT);
      this.anim.t = Math.max(0, Math.round(azar01() * this.anim.dur - .49));
      this.sub = 1;
    } else if (this.sub === 1 && this.terminada()) {
      const r = azar01(), v = (Math.random() * 2 - 1) * .99;
      if (r >= .5) {
        this.anim.t = this.anim.dur - 1;
        this.anim.velocidad(-1 - v * .1);
      } else {
        this.anim.t = 0;
        this.anim.velocidad(v * .1 + 1);
      }
      this.anim.fin = false;
    }
    if (this.m.banderaEnemigo?.(3)) this.borrado = true;
  }
  controlNoMove() {
    if (this.sub !== 0) return;
    this.cond = C.NORMAL;
    this.animSinMezcla(A.NT);
    this.sub = 1;
  }
  controlWait2() {
    if (this.sub === 0) {
      this.cond = CK.ESCAPE;
      this.pos = [ this.posIni[0], this.posIni[1] - 1600, this.posIni[2] ];
      this.animSinMezcla(A.NT);
      this.sub = 1;
    } else if (this.sub === 1 && this.distXZJugador() < 1e3) this.pasoA(P.APPEAR2);
  }
  controlAppear2() {
    if (this.sub === 0) {
      this.cond = CK.CAUTION;
      this.animSinMezcla(A.NT);
      this.sub = 1;
    } else if (this.sub === 1 || this.sub === 2) {
      if (this.posIni[1] <= this.pos[1]) {
        if (this.sub === 1) {
          this.sonido(SON.LLEGA);
          this.pos[1] -= 20;
          this.sub = 2;
        } else {
          this.pos[1] = this.posIni[1];
          this.pasoA(P.STAY);
        }
      } else this.pos[1] += DT * 1e3;
    }
    this.alDanio();
  }
  controlDisappear2() {
    if (this.sub === 0) {
      this.cond = CK.ESCAPE;
      this.animSinMezcla(A.NT);
      this.sub = 1;
    } else if (this.sub === 1) {
      if (this.pos[1] <= this.posIni[1] - 1600) this.pasoA(P.WAIT2); else this.pos[1] -= DT * 1e3;
    }
    if (this.distXZJugador() < 1e3) this.pasoA(P.APPEAR2);
    this.alDanio();
  }
  controlDead2() {
    if (this.sub === 0) {
      this.cond = CK.ESCAPE;
      this.animSinMezcla(A.NT);
      this.sub = 1;
    } else if (this.sub === 1) {
      if (this.posIni[1] - 1600 < this.pos[1]) this.pos[1] -= DT * 1e3; else this.borrado = true;
    }
  }
}
