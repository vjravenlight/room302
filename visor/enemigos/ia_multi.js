// SH4 web — FeniXVOID · Project Ravenlight
import { FPS, DT, envolver, rumboHacia, frente, dist3, distXZ, girarY, azar, azar01 } from "./comun.js";

import { C } from "./ia_hyena.js";

import { PARED_MULTI, atravesarPared, enPared, salirDePared, enLaPared } from "./pared_fantasma.js";

const AMORT_HITBACK = (30 / 31) ** 8;

export const A = {
  NT: 0,
  NT2: 1,
  NT3: 2,
  WLK: 3,
  WLKB: 4,
  DMH1: 5,
  DMH2: 6,
  DMP1: 7,
  DMP2: 8,
  DMP3: 9,
  DMS1: 10,
  DMS2: 11,
  DMCA: 12,
  XXP1: 13,
  XXP2: 14,
  XXP3: 15,
  XXS1: 16,
  XXS2: 17,
  XXG1: 18,
  XXG2: 19,
  XXC1: 20,
  XXC2: 21,
  DMCB: 22,
  UPU: 23,
  UPD: 24,
  DNT1: 25,
  DNT2: 26,
  ROTU: 27,
  ROTD: 28,
  ATT1A: 29,
  ATT1B: 30,
  ATT1C: 31,
  ATT2A: 32,
  ATT2B: 33,
  ATT2C: 34,
  WA: 35,
  WPS: 36
};

export const P = {
  INIT: 0,
  WANDER: 1,
  CHASE: 2,
  RISE: 3,
  ATTACK: 4,
  ATTACK2: 5,
  LEAVE: 6,
  THROUGHWALL: 7,
  CHASEINWALL: 8,
  APPEARFROMWALL: 9,
  PUSH: 10,
  DAMAGE: 11,
  ESCAPE: 12,
  ROUND: 13,
  DOWN: 14,
  EXORCISMDOWN: 15,
  FINISHED: 16,
  EVENT: 17
};

export const NOMBRE_PASO = Object.fromEntries(Object.entries(P).map(([k, v]) => [ v, k ]));

const ST = {
  DAMAGE: 6,
  EVENT: 7,
  GODMODE: 9,
  DEAD: 10
};

export const MODELO_TIPO = [ "enemy_model_mlt.bin", "enemy_model_mln.bin", "enemy_model_mlu.bin", "enemy_model_mlb.bin" ];

const GOLPES_EB60 = new Set([ 42, 43, 44, 45, 73, 75, 76, 95, 106, 107, 109 ]);

const ALTO = 180;

export class Multi {
  constructor(def, pj, anim, m) {
    this.tipo = "MULTI";
    this.def = def;
    this.pj = pj;
    this.anim = anim;
    this.m = m;
    this.tipoParam = def.tipo_param || 0;
    this.param = m.parametros("MULTI", this.tipoParam);
    this.hp = this.hpMax = this.param.vida;
    this.aguante = this.aguanteMax = this.param.aguante;
    this.pos = [ ...def.pos ];
    this.rot = def.rumbo || 0;
    this.posAnt = [ ...this.pos ];
    this.rotAnt = this.rot;
    this.radio = 80;
    this.tipoCl = 0;
    this.alto = 360;
    this.sinPasos = true;
    this.sinSangre = true;
    this.visible = true;
    this.opacidad = 1;
    this.cond = C.NORMAL;
    this.paso = P.INIT;
    this.sub = 0;
    this.next = -1;
    this.oldPaso = 0;
    this.golpes = [];
    this.w = {
      moveSpeed: 1,
      moveAccel: 0,
      timer: azar01() * 10,
      timer2: 0,
      soundTimer: 0,
      attackSuccess: 0,
      downCount: 0,
      counter: 0,
      slowly: 0,
      hitback: [ 0, 0, 0 ],
      bdType: 0,
      alturaObj: this.pos[1],
      agarrando: false,
      golpeado: false,
      velaAcum: 0
    };
    if ((def.estado_inicial & 15) === 6) this.paso = P.EVENT;
    this.animSet(A.NT);
  }
  caido() {
    return this.paso === P.DOWN || this.paso === P.EXORCISMDOWN;
  }
  persigue() {
    return [ P.CHASE, P.ATTACK, P.ATTACK2, P.PUSH, P.ROUND, P.LEAVE, P.RISE, P.THROUGHWALL, P.CHASEINWALL, P.APPEARFROMWALL ].includes(this.paso);
  }
  pasoA(n) {
    this.paso = n;
    this.sub = 0;
    if (n !== P.THROUGHWALL && n !== P.CHASEINWALL && n !== P.APPEARFROMWALL) {
      if (this.tipoCl >= 3) this.tipoCl = 1;
      this.visible = true;
      this.opacidad = 1;
    }
  }
  intocable() {
    return enLaPared(this);
  }
  animSet(n) {
    if (n !== this.anim.n) this.anim.poner(n);
  }
  get fin() {
    return this.anim.fin;
  }
  jugador() {
    return this.m.jugador();
  }
  distJugador() {
    const j = this.jugador();
    return j.existe ? dist3(this.pos, j.pos) : 1e9;
  }
  velocidad() {
    return this.param.velocidad;
  }
  velocidad2() {
    return this.param.velocidad2;
  }
  girarHacia(p, u) {
    const a = envolver(rumboHacia(p, this.pos) - this.rot);
    this.rot = envolver(this.rot + Math.max(-u, Math.min(u, a)));
  }
  avanzar(v) {
    const f = frente(this.rot, v * DT);
    this.mov[0] += f[0];
    this.mov[2] += f[2];
  }
  dotJugador(v) {
    const f = frente(this.jugador().rot);
    return f[0] * v[0] + f[2] * v[2];
  }
  agarrable() {
    const st = this.jugador().estado;
    return this.jugador().existe && ![ ST.DAMAGE, ST.EVENT, ST.GODMODE, ST.DEAD ].includes(st) && (this.m.relojAtaque?.() ?? 5) >= 5;
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
  tick() {
    this.posAnt = [ ...this.pos ];
    this.rotAnt = this.rot;
    this.mov = [ 0, 0, 0 ];
    this.control();
    this.anim.avanzar();
    const hb = this.w.hitback;
    this.mov[0] += hb[0] * DT;
    this.mov[2] += hb[2] * DT;
    hb[0] *= AMORT_HITBACK;
    hb[2] *= AMORT_HITBACK;
    (this.m.moverFlotante || this.m.moverFantasma).call(this.m, this, this.mov[0], this.mov[2]);
    this.pos[1] += (this.w.alturaObj - this.pos[1]) * .12;
  }
  control() {
    const w = this.w;
    if (this.paso === P.DAMAGE) w.timer += DT; else w.timer = Math.max(0, w.timer - DT);
    w.timer2 = Math.max(0, w.timer2 - DT);
    if (this.golpes.length) {
      const g = this.golpes.shift();
      this.golpes.length = 0;
      this.danio(g);
    }
    this.vela();
    this.exorcismo();
    switch (this.paso) {
     case P.INIT:
      this.pasoA(P.WANDER);
      break;

     case P.WANDER:
      this.controlWander();
      break;

     case P.CHASE:
      this.controlChase();
      break;

     case P.THROUGHWALL:
      this.controlThroughWall();
      break;

     case P.CHASEINWALL:
      this.controlChaseInWall();
      break;

     case P.APPEARFROMWALL:
      this.controlAppearFromWall();
      break;

     case P.RISE:
      this.controlRise();
      break;

     case P.ATTACK:
      this.controlAttack();
      break;

     case P.ATTACK2:
      this.controlAttack2();
      break;

     case P.LEAVE:
      this.controlLeave();
      break;

     case P.PUSH:
      this.controlPush();
      break;

     case P.DAMAGE:
      this.controlDamage();
      break;

     case P.ESCAPE:
      this.controlEscape();
      break;

     case P.ROUND:
      this.controlRound();
      break;

     case P.DOWN:
     case P.EXORCISMDOWN:
      this.controlDown();
      break;

     case P.EVENT:
     case P.FINISHED:
      break;
    }
    if (this.cond > 0 && this.cond < 5 && this.visible !== false) {
      w.soundTimer -= DT;
      if (w.soundTimer <= 0 && azar01() < .01) {
        this.m.sonido?.(this, 60253);
        w.soundTimer = azar01() * 5 + 3;
      }
    }
    const obj = (1 - w.slowly * .9) * ([ P.CHASE, P.LEAVE, P.CHASEINWALL ].includes(this.paso) ? 2 : 1);
    w.moveSpeed += (obj - w.moveSpeed) * .05;
    const n = this.anim.n;
    if (n >= 0 && n <= A.WLKB || n >= A.ATT1A && n <= A.ATT2C) this.anim.velocidad?.(1 - w.slowly * .5);
  }
  vela() {
    const v = this.m.vela?.(this) || 0;
    if (v <= 0) return;
    const c = this.cond, n = this.anim.n;
    if (c === 9 && (n >= 13 && n <= 21 || n >= 25 && n <= 28)) return;
    if ([ 1, 2, 3, 4, 5, 7, 8, 9, 12, 13 ].includes(c)) this.w.velaAcum += v;
  }
  exorcismo() {
    const w = this.w;
    if (w.velaAcum <= 0) {
      w.slowly = Math.max(0, w.slowly - DT);
      return;
    }
    this.hp = Math.max(0, this.hp - w.velaAcum * 10);
    if (this.hp > 0) w.velaAcum = 0; else {
      if (this.cond === 13) return;
      if (this.paso === P.EXORCISMDOWN) {
        w.velaAcum = 0;
        if (this.sub === 1 && w.tExorc < 600) w.tExorc = 600;
      } else if (this.paso === P.APPEARFROMWALL && this.sub <= 5) return; else if (enLaPared(this)) return; else if (this.paso !== P.FINISHED && this.paso !== P.EVENT) this.exorcizar();
    }
    w.slowly = Math.min(1, w.slowly + DT);
  }
  exorcizar() {
    this.w.velaAcum = 0;
    if (this.w.agarrando) this.soltar();
    this.m.sonido?.(this, 60256);
    if (this.cond !== 10) this.w.caida = azar01() < .5 ? 1 : 0;
    this.animSet(this.cond === 10 ? A.DNT1 + (this.w.caida || 0) : A.XXC1 + this.w.caida);
    this.pasoA(P.EXORCISMDOWN);
  }
  alturaPiso(dy = 0) {
    const j = this.jugador();
    this.w.alturaObj = (j.existe ? j.pos[1] : this.pos[1]) + dy;
  }
  veJugador() {
    const j = this.jugador();
    if (!j.existe) return false;
    const d = distXZ(this.pos, j.pos);
    if (Math.abs(j.pos[1] - this.pos[1]) > 200 + ALTO * 2) return false;
    const a = Math.abs(envolver(rumboHacia(j.pos, this.pos) - this.rot));
    return d <= 1e3 || d <= 2e3 && a <= 1.178;
  }
  puedeAtacar() {
    const j = this.jugador();
    if (!this.agarrable() || this.m.agarradoPor) return false;
    const d = distXZ(this.pos, j.pos), a = Math.abs(envolver(rumboHacia(j.pos, this.pos) - this.rot));
    return d <= 80 || d <= 240 && a <= .785;
  }
  controlWander() {
    const w = this.w;
    if (this.sub === 0) {
      this.animSet(A.NT);
      this.alturaPiso(0);
      this.sub = 1;
    }
    if (this.sub === 1) {
      this.rotObj = envolver(this.rot + (azar01() * 1.224 - 1.05));
      w.timer = azar01() * 3 + 5;
      this.sub = 2;
    }
    if (this.sub === 2) {
      if (w.timer <= 0) {
        const r = azar(3);
        this.animSet([ A.NT, A.NT2, A.NT3 ][r]);
        w.timer = r === 0 ? azar01() * 2 + 4 : azar01() * 3 + 5;
        if (azar(4) === 0) {
          this.animSet(A.WLKB);
          w.timer = azar01() * 5 + 10;
          w.timer2 = azar01() * 3 + 5;
          this.sub = 4;
        } else this.sub = 1;
      }
      this.girarHacia(this.pos.map((v, i) => v + frente(this.rotObj ?? this.rot, 100)[i]), DT * 1.0471976);
    } else if (this.sub === 4) {
      this.avanzar(-this.velocidad() * w.moveSpeed);
      if (w.timer2 <= 0 || w.timer <= 0) {
        this.animSet(A.NT);
        w.timer = azar01() * 3 + 5;
        this.sub = 2;
      }
    }
    if (this.veJugador()) this.pasoA(P.CHASE);
  }
  controlChase() {
    const w = this.w, j = this.jugador();
    let modo = 0;
    if (this.sub === 0) {
      this.animSet(A.WLK);
      w.timer = 3;
      this.sub = 1;
      this.tipoCl = 1;
    }
    if (this.sub === 4) {
      this.chaseSinVista(j);
      return;
    }
    if (j.existe && this.sub === 1 && w.timer <= 0 && typeof this.m.camino === "function" && this.m.lineaDeVista?.(this, null) === false) {
      this.sub = 4;
      this.chaseSinVista(j);
      return;
    }
    if (this.sub === 1) {
      if (w.timer <= 0) {
        const r = azar01();
        if (r < .001) {
          this.animSet(A.NT);
          w.timer = azar01() * 2 + 3;
          this.sub = 2;
          modo = 1;
        } else if (r < .0015) {
          this.animSet(A.NT2);
          w.timer = azar01() * 2 + 3;
          this.sub = 2;
          modo = 1;
        } else if (r < .002) {
          this.animSet(A.NT3);
          w.timer = azar01() * 2 + 3;
          this.sub = 2;
          modo = 1;
        } else if (r < .005) {
          this.animSet(A.WLKB);
          w.timer = azar01() * 3 + 7;
          w.timer2 = azar01() * 2 + 5;
          this.sub = 3;
          modo = 3;
        }
      }
    } else if (this.sub === 2) {
      modo = 1;
      if (w.timer <= 0) {
        this.animSet(A.WLK);
        w.timer = 3;
        this.sub = 1;
      }
    } else if (this.sub === 3) {
      modo = w.timer > 0 ? 3 : 0;
      if (w.timer <= 0 || w.timer2 <= 0) {
        this.animSet(A.WLK);
        w.timer = 3;
        this.sub = 1;
        modo = 0;
      }
    }
    this.alturaPiso(0);
    if (j.existe && modo === 0) {
      this.girarHacia(j.pos, DT * 1.0471976);
      this.avanzar(this.velocidad() * w.moveSpeed);
    }
    if (modo === 3) this.avanzar(-this.velocidad() * w.moveSpeed);
    if (this.puedeAtacar()) this.pasoA(P.PUSH);
  }
  chaseSinVista(j) {
    const w = this.w;
    this.alturaPiso(0);
    if (this.m.lineaDeVista?.(this, null) !== false) {
      this.tipoCl = 1;
      this.m.reiniciarCamino?.(this);
      this.animSet(A.WLK);
      w.timer = 3;
      this.sub = 1;
      return;
    }
    const dest = this.m.camino(this, j.pos);
    if (!dest) {
      this.pasoA(P.THROUGHWALL);
      return;
    }
    this.animSet(A.WLK);
    this.girarHacia(dest, DT * 1.5707964);
    this.avanzar(this.velocidad() * w.moveSpeed);
    if (this.puedeAtacar()) {
      this.tipoCl = 1;
      this.pasoA(P.PUSH);
    }
  }
  controlThroughWall() {
    const w = this.w;
    if (this.sub === 0) {
      this.animSet(A.WLK);
      this.tipoCl = 1;
      this.alturaPiso(0);
    } else if (this.sub === 999) {
      if (w.timer > 0) return;
      this.pasoA(P.CHASEINWALL);
      return;
    }
    const r = atravesarPared(this, PARED_MULTI.atravesar, this.velocidad() * w.moveSpeed);
    if (r === 1) {
      if (!w.attackSuccess && this.veJugador() && this.m.lineaDeVista?.(this, null) !== false) this.pasoA(P.CHASE);
    } else if (r === 2) {
      w.timer = azar01() * 2 + 1;
      this.sub = 999;
    } else if (r === 3) this.pasoA(P.CHASE); else if (r === -1) this.pasoA(P.WANDER);
  }
  controlChaseInWall() {
    this.alturaPiso(0);
    const r = enPared(this, PARED_MULTI.enPared, this.velocidad() * 10);
    if (r === 1) this.pasoA(P.APPEARFROMWALL); else if (r === 2) this.pasoA(P.THROUGHWALL); else if (r === 3) this.pasoA(P.CHASE);
  }
  controlAppearFromWall() {
    this.alturaPiso(0);
    const r = salirDePared(this, PARED_MULTI.salir, this.velocidad());
    if (r === 3) {
      this.w.attackSuccess = 0;
      this.pasoA(P.CHASE);
    }
  }
  controlPush() {
    const j = this.jugador();
    if (this.sub === 0) {
      const local = girarY([ j.pos[0] - this.pos[0], 0, j.pos[2] - this.pos[2] ], -this.rot);
      if (local[2] > 0 && azar01() < .8 && this.agarrable()) {
        this.pasoA(P.ATTACK);
        return;
      }
      this.animSet(local[2] <= 0 ? A.DMH2 : A.DMH1);
      this.sub = 1;
      return;
    }
    if (this.m.tocaJugador(this)) this.girarHacia(j.pos, DT * Math.PI);
    if (this.fin) this.pasoA(P.CHASE);
  }
  agarrar(danio) {
    if (this.m.agarradoPor) return false;
    this.w.agarrando = true;
    this.cond = 6;
    this.m.agarrar(this, 1, danio, "MULTI_AGARRE");
    return true;
  }
  soltar() {
    if (this.w.agarrando) {
      this.w.agarrando = false;
      this.m.soltar(this);
    }
  }
  controlAttack() {
    const w = this.w, j = this.jugador();
    switch (this.sub) {
     case 0:
      {
        if (this.m.agarradoPor && this.m.agarradoPor !== this) {
          this.pasoA(P.LEAVE);
          return;
        }
        const d = this.dotJugador(frente(this.rot));
        if ((d > -.5 && d < .5 || d < -.5 && azar01() < .5) && distXZ(j.pos, this.pos) < 200 && w.counter === 0) {
          this.pasoA(P.ATTACK2);
          return;
        }
        this.animSet(A.ATT1A);
        this.m.sonido?.(this, 60253);
        this.cond = 5;
        this.sub = 1;
      }

     case 1:
      {
        this.alturaPiso(-20);
        this.girarHacia(j.pos, DT * 1.5707964 * (w.counter ? 4 : 1));
        const f = frente(this.rot), dx = j.pos[0] - this.pos[0], dz = j.pos[2] - this.pos[2], L = Math.hypot(dx, dz) || 1;
        this.avanzar(this.velocidad2() * w.moveSpeed * Math.max(0, (f[0] * dx + f[2] * dz) / L));
        if (!this.fin) return;
        const mano = this.hueso(16), dot = this.dotJugador(f);
        if (this.agarrable() && distXZ(mano, j.pos) <= 140 && (dot <= -.70710677 || dot >= .70710677) && this.agarrar(this.param.ataque1)) {
          this.animSet(A.ATT1B);
          w.timer = .5;
          this.sub = 2;
        } else {
          this.cond = 5;
          this.animSet(A.ATT1C);
          this.sub = 4;
        }
        return;
      }

     case 2:
      if (this.m.sigueAgarrado?.(this) ?? (this.agarreT = (this.agarreT || 0) + DT) < 4) return;
      this.agarreT = 0;
      this.soltar();
      w.attackSuccess++;
      this.animSet(A.ATT1C);
      this.sub = 3;
      return;

     case 3:
     case 4:
      if (this.fin || this.anim.vuelta) this.terminarAtaque();
    }
  }
  controlAttack2() {
    const w = this.w, j = this.jugador();
    if (this.sub === 0) {
      if (this.m.agarradoPor && this.m.agarradoPor !== this) {
        this.pasoA(P.LEAVE);
        return;
      }
      this.animSet(A.ATT2A);
      this.cond = 5;
      this.sub = 1;
    }
    if (this.sub === 1) {
      this.alturaPiso(-20);
      this.girarHacia(j.pos, DT * 1.5707964);
      const f = frente(this.rot);
      let v = this.velocidad2() * w.moveSpeed;
      if ((j.pos[0] - this.pos[0]) * f[0] + (j.pos[2] - this.pos[2]) * f[2] < 0) v = 0;
      this.avanzar(v);
      if (!this.fin) return;
      const mano = this.hueso(11), dot = this.dotJugador(f);
      if (this.agarrable() && distXZ(mano, j.pos) < 100 && dot < -.70710677 && this.agarrar(this.param.ataque2)) {
        this.animSet(A.ATT2B);
        w.timer = .5;
        this.sub = 2;
        return;
      }
      if (j.existe && distXZ(this.pos, j.pos) < this.radio + this.m.radioJugador + 60) this.m.golpear(this, 10, "BAK_MULTI_HEADBUTT", {
        shock: 20,
        dir: frente(this.rot)
      });
      this.animSet(A.ATT2C);
      this.sub = 4;
      return;
    }
    if (this.sub === 2) {
      if (this.m.sigueAgarrado?.(this) ?? (this.agarreT = (this.agarreT || 0) + DT) < 4) return;
      this.agarreT = 0;
      this.soltar();
      w.attackSuccess++;
      this.animSet(A.ATT2C);
      this.sub = 3;
      return;
    }
    if (this.fin) this.terminarAtaque();
  }
  terminarAtaque() {
    this.cond = C.NORMAL;
    if (this.w.attackSuccess && this.sub !== 4 && !(this.aguante / this.aguanteMax > azar01())) {
      this.pasoA(P.LEAVE);
      return;
    }
    this.pasoA(P.ROUND);
  }
  controlLeave() {
    const w = this.w, j = this.jugador();
    if (this.sub === 0) {
      w.timer2 = 5;
      w.timer = (azar01() + 1) * 5;
      this.animSet(A.WLKB);
      this.sub = 1;
    }
    this.alturaPiso(0);
    if (j.existe) this.girarHacia(j.pos, DT * 1.0471976);
    if (w.timer > 0) this.avanzar(-this.velocidad() * w.moveSpeed);
    if (w.timer <= 0) this.pasoA(P.CHASE);
  }
  controlRound() {
    const w = this.w, j = this.jugador();
    if (this.sub === 0) {
      this.animSet(A.NT);
      w.timer = 2;
      this.sub = 1;
    }
    if (!j.existe) return;
    let a = envolver(rumboHacia(this.pos, j.pos) - j.rot);
    a = a < -2.0943952 || a > 2.0943952 ? Math.PI : a >= 0 ? a + 1.0471976 : a - 1.0471976;
    const meta = [ j.pos[0] + Math.sin(a + j.rot) * 400, j.pos[1], j.pos[2] + Math.cos(a + j.rot) * 400 ];
    const dx = meta[0] - this.pos[0], dz = meta[2] - this.pos[2], L = Math.hypot(dx, dz) || 1, v = this.velocidad2() * DT;
    this.mov[0] += dx / L * Math.min(v, L);
    this.mov[2] += dz / L * Math.min(v, L);
    this.girarHacia(j.pos, DT * Math.PI);
    this.alturaPiso(0);
    if (this.dotJugador(frente(this.rot)) <= -.8660254 || w.timer <= 0 || this.distJugador() > 1e3) this.pasoA(P.CHASE);
  }
  controlRise() {
    const w = this.w;
    if (this.sub === 0) {
      this.cond = 3;
      w.timer = azar01() * 2;
      this.sub = 1;
    }
    this.alturaPiso(-400 + ALTO);
    if (this.sub === 1 && Math.abs(this.pos[1] - this.w.alturaObj) < 200) this.sub = 2; else if (this.sub === 2 && w.timer <= 0) this.pasoA(P.CHASE);
    const j = this.jugador();
    if (j.existe) this.girarHacia(j.pos, DT * 1.5707964);
  }
  recibir(g) {
    this.golpes.push(g);
  }
  danio(g) {
    const w = this.w;
    if (this.paso === P.DOWN || this.paso === P.EXORCISMDOWN) {
      this.hp = Math.max(0, this.hp - g.danio);
      return;
    }
    if (w.agarrando) this.soltar();
    const plata = g.atributo === 7;
    if (plata) g = {
      ...g,
      danio: Math.max(g.danio || 0, this.hp)
    };
    this.hp = Math.max(0, this.hp - g.danio);
    this.aguante = Math.max(0, this.aguante - g.danio);
    this.m.sonido?.(this, GOLPES_EB60.has(g.kind) ? 60256 : 60251);
    const derribo = this.aguante <= 0;
    const local = girarY(g.dir, -this.rot), lado = local[2] < 0 ? 0 : 1;
    const t = g.bdt;
    let r = -1;
    if ([ 0, 3, 9, 10 ].includes(t)) r = derribo ? lado + 8 : lado + 2; else if ([ 1, 13, 15, 17 ].includes(t)) r = lado + 13; else if ([ 2, 8, 21 ].includes(t)) r = derribo ? lado + 8 : lado; else if ([ 4, 6, 12 ].includes(t)) r = derribo ? 10 : 4; else if ([ 5, 7, 11 ].includes(t)) r = derribo ? lado + 11 : lado + 5; else if ([ 14, 18 ].includes(t)) r = derribo ? 10 : lado + 2; else if (t === 16) r = 10; else if (t === 19 || t === 20) r = derribo ? lado + 15 : 7;
    if (plata) r = 13 + lado;
    const cae = r >= 8 && r < 17;
    this.animSet(r < 0 ? A.DMCB : r + 5);
    this.anim.velocidad(cae ? 1 + azar01() * .5 : 1 + azar01() * .4);
    const f = frente(Math.atan2(g.dir[0], g.dir[2]), (g.shock || 40) * 2);
    w.hitback = [ f[0], 0, f[2] ];
    w.timer = 0;
    this.cond = 9;
    this.pasoA(P.DAMAGE);
    this.sub = cae ? 2 : 1;
    if (plata) {
      this.cond = 10;
      this.pasoA(P.EXORCISMDOWN);
      this.sub = 0;
    }
  }
  controlDamage() {
    if (!this.fin) return;
    this.anim.velocidad(1);
    if (this.sub === 2) {
      this.pasoA(P.DOWN);
      return;
    }
    this.cond = C.NORMAL;
    this.pasoA(P.ESCAPE);
  }
  controlEscape() {
    const w = this.w, j = this.jugador();
    if (this.sub === 0) {
      w.timer2 = 1.5;
      w.timer = azar01() * 5 + 3;
      this.animSet(A.WLKB);
      this.sub = 1;
    }
    if (w.timer2 <= 0 && this.m.tocaJugador(this)) {
      this.pasoA(P.CHASE);
      return;
    }
    if (j.existe) this.girarHacia(j.pos, DT * 1.0471976);
    this.avanzar(-this.velocidad2() * w.moveSpeed);
    this.alturaPiso(0);
    if (w.timer <= 0) this.pasoA(P.CHASE);
  }
  controlDown() {
    const w = this.w;
    if (this.sub === 0) {
      w.timer = 0;
      w.tExorc = this.paso !== P.EXORCISMDOWN ? 0 : this.hp > 0 ? azar01() * 3 : (azar01() + 1) * 600;
      this.cond = 9;
      this.alturaPiso(0);
      this.sub = 1;
    }
    w.timer += DT;
    if (this.sub === 1 && w.timer > (this.paso === P.EXORCISMDOWN ? w.tExorc : Math.max(1, 9 - 2 * this.m.nivel))) {
      this.aguante = this.aguanteMax;
      this.hp = Math.max(this.hp, this.hpMax * .25);
      this.animSet(this.anim.n === A.XXP1 || this.anim.n === A.XXS1 ? A.UPD : A.UPU);
      this.sub = 2;
    }
    if (this.sub === 2 && this.fin) {
      this.cond = C.NORMAL;
      this.pasoA(P.RISE);
    }
  }
}
