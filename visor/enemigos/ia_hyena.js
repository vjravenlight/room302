// SH4 web — FeniXVOID · Project Ravenlight
import { FPS, envolver, rumboHacia, frente, dist3, distXZ, girarY, azar, azar01, avanceTabla } from "./comun.js";

export const A = {
  ATT1: 0,
  ATT2: 1,
  ATT3: 2,
  DIEL: 3,
  DIER: 4,
  DMH1: 5,
  DMH2: 6,
  DMP1: 7,
  DMP2: 8,
  DMP3: 9,
  DMP4: 10,
  DMS1: 11,
  DMS2: 12,
  NT: 13,
  ROTL: 14,
  ROTR: 15,
  RUN: 16,
  STY1: 17,
  STY2: 18,
  STY3: 19,
  STY4: 20,
  STY5: 21,
  STY6: 22,
  UPL: 23,
  UPR: 24,
  WLK: 25,
  WLK2: 26,
  WLKB: 27,
  XXC: 28,
  XXG1: 29,
  XXG2: 30,
  XXG3: 31,
  XXP1: 32,
  XXP2: 33,
  XXP3: 34,
  XXP4: 35,
  XXS1: 36,
  XXS2: 37,
  DED: 38
};

export const P = {
  INIT: 0,
  NT: 1,
  WANDER: 2,
  DESCENT: 3,
  APPROACH: 4,
  LIEDOWN: 5,
  SMELL: 6,
  RUNATTACK: 7,
  WALKATTACK: 8,
  HOLDING: 9,
  ESCAPE: 10,
  DAMAGE: 11,
  DOWN: 12,
  STRUGGLE: 13,
  DEAD: 15,
  DEADADRUPTLY: 16,
  DEADDEMO: 17,
  RISE: 18,
  THREATEN: 19,
  BACKSTEP: 20,
  BLOODSIP: 21,
  SMELLTERRITORY: 22,
  BACKSTEPATTACK: 23
};

export const NOMBRE_PASO = Object.fromEntries(Object.entries(P).map(([k, v]) => [ v, k ]));

const T_NADA = -1, T_JUGADOR = 0, T_SANGRE = 100, T_TERRITORIO = 200;

export const C = {
  NORMAL: 1,
  DAMAGE: 9,
  DYING: 10,
  DEAD: 11
};

const BDT = [ "GUN", "REVOLVER", "PIPE", "PIPE_ST", "BAT", "BAT_ST", "CLUB", "CLUB_ST", "CUTTER", "CUTTER_ST", "BOTTLE", "BOTTLE_ST", "SCOOP", "SCOOP_ST", "HATCHET", "HATCHET_ST", "PICK", "PICK_ST", "STUNGUN", "CHAINSAW", "CHAINSAW_ST", "SMALL", "OTHER" ];

export const bdtIndice = t => typeof t === "number" ? t : Math.max(0, BDT.indexOf(String(t).replace(/^BDT_/, "")));

const ST = {
  MOVE: 1,
  READY: 3,
  LOCK: 4,
  ATTACK: 5,
  DAMAGE: 6,
  DEAD: 10
};

const GRADO = Math.PI / 180;

const seg = s => Math.trunc(FPS * s);

export class Hyena {
  constructor(def, pj, anim, m) {
    this.tipo = "HYENA";
    this.def = def;
    this.pj = pj;
    this.anim = anim;
    this.m = m;
    this.tipoParam = def.tipo_param || 0;
    const fila = m.parametros("HYENA", this.tipoParam);
    this.param = fila;
    this.hp = this.hpMax = fila.vida;
    this.aguante = this.aguanteMax = fila.aguante;
    this.pos = [ ...def.pos ];
    this.rot = def.rumbo || 0;
    this.posAnt = [ ...this.pos ];
    this.rotAnt = this.rot;
    this.radio = 70;
    this.alto = 110;
    this.centroAlto = 55;
    this.cond = C.NORMAL;
    this.paso = P.INIT;
    this.sub = 0;
    this.next = -1;
    this.oldPaso = 0;
    this.golpes = [];
    this.atacando = null;
    const w = this.w = {
      targetPos: [ 0, 0, 0, 0 ],
      animeSpeed: 1,
      pow: 0,
      target: T_NADA,
      targetPlayer: -1,
      targetBodypart: 0,
      targetRad: this.rot,
      oldAnime: -1,
      oldPlayerStat: 0,
      run: 0,
      wanderLr: 0,
      wanderHorming: 0,
      targetFind: 0,
      downLr: 0,
      setBlood: 0,
      boneCtrlFalse: 0,
      animeJustSet: 0,
      targetDummyEnable: 0,
      targetDummyLr: 0,
      oiuti: 0,
      stampCnt: 0,
      stampDead: 0,
      killCounted: 0,
      wanderCnt: 0,
      wanderNext: 0,
      angry: 0,
      ignoreBlood: 0,
      ignoreTerri: 0,
      ignorePlay: 0,
      invalidWalkAttack: 0,
      frightenDisable: 0,
      playAnimeTimes: 0,
      runAttackCnt: 0,
      tongueMode: 0,
      oiutiTimer: 0,
      srcThreatenDist: 0,
      holdingDist: 0,
      oldEposX: this.pos[0],
      oldEposZ: this.pos[2],
      targetDummyMove: 0,
      ppos: [ 0, 0, 0 ],
      bloodRes: null,
      bdType: 0,
      bdKind: 0,
      bdShock: 0,
      bdDir: [ 0, 0, 1 ],
      flag: [ 0, 0 ],
      wk: [ 0, 0 ],
      rest: 0,
      stepTimer: 0
    };
    const ini = def.estado_inicial & 15;
    if (ini === 3 || ini === 7) this.pasoDirecto(P.DEADDEMO); else if (ini === 6) this.pasoDirecto(P.BLOODSIP); else this.pasoDirecto(P.INIT);
    this.animSet(A.NT);
  }
  pasoDirecto(p) {
    this.paso = p;
    this.sub = 0;
  }
  nextStepIssue(n) {
    this.next = n;
  }
  nextStepSet() {
    const n = this.next, w = this.w;
    if (n === -1 || n === this.paso && n !== P.DEAD) return;
    w.flag[0] = w.flag[1] = 0;
    w.wk[0] = w.wk[1] = 0;
    w.rest = 0;
    w.stepTimer = 0;
    if (n !== P.RUNATTACK && n !== P.APPROACH && n !== P.ESCAPE) w.runAttackCnt = 0;
    this.oldPaso = this.paso;
    this.paso = n;
    this.sub = 0;
    this.next = -1;
  }
  animSet(n) {
    const w = this.w;
    if (n === this.anim.n) return;
    w.animeJustSet = 1;
    w.animeSpeed = 1;
    w.oldAnime = this.anim.n;
    this.anim.poner(n);
    w.run = n === A.ATT1 || n === A.RUN ? 1 : 0;
    w.downLr = [ A.DIER, A.ROTR, A.XXG2, A.XXG3, A.XXP2, A.XXP3, A.XXP4, A.XXS2 ].includes(n) ? 1 : 0;
    w.tongueMode = n === A.STY2 ? 1 : n === A.DED ? 2 : 0;
    this.sonidoLoop(null);
  }
  animSetWithSpeed(n, v) {
    this.animSet(n);
    this.w.animeSpeed = v;
  }
  sonido(id) {
    this.m.sonido?.(this, id);
  }
  sonidoLoop(id) {
    this.m.sonido?.(this, id ?? null, true);
  }
  get vuelta() {
    return this.anim.vuelta;
  }
  get fin() {
    return this.anim.fin;
  }
  get cuadro() {
    return this.anim.cuadro;
  }
  hueso(i) {
    const r = this.pj.reproductor;
    if (r.anim !== this.anim.anim) r.poner(this.anim.anim);
    r.t = this.anim.t;
    r.loop = this.anim.loop;
    const pose = r.avanzar(0);
    const p = [ pose.absPos[i * 3], pose.absPos[i * 3 + 1], pose.absPos[i * 3 + 2] ], g = girarY(p, this.rot);
    return [ this.pos[0] + g[0], this.pos[1] + g[1], this.pos[2] + g[2] ];
  }
  jugador() {
    return this.m.jugador();
  }
  distJugador() {
    const j = this.jugador();
    return j.existe ? dist3(this.pos, j.pos) : 1e9;
  }
  esJugador() {
    return this.w.target === 0 || this.w.target === 1;
  }
  nivel() {
    return this.m.nivel;
  }
  caido() {
    return [ P.DOWN, P.STRUGGLE, P.DEAD, P.RISE ].includes(this.paso) || this.cond === C.DYING;
  }
  persigue() {
    return this.esJugador() && ![ P.DEAD, P.DEADADRUPTLY, P.DEADDEMO ].includes(this.paso);
  }
  horming(u) {
    const w = this.w, s = Math.sin(w.targetRad - this.rot);
    if (s === 0) return 1;
    const antes = Math.sign(s);
    this.rot = envolver(this.rot + (s > 0 ? u : -u));
    if (Math.sign(Math.sin(w.targetRad - this.rot)) !== antes) {
      this.rot = envolver(w.targetRad);
      return 1;
    }
    return 0;
  }
  ladoDe(p) {
    return Math.sin(rumboHacia(p, this.pos) - this.rot);
  }
  jugadorAlFrente(rango) {
    const j = this.jugador();
    if (!j.existe) return false;
    const a = envolver(rumboHacia(j.pos, this.pos) - this.rot);
    return a <= rango && a > -rango;
  }
  jugadorDeEspaldas() {
    const j = this.jugador(), a = frente(this.rot), b = frente(j.rot);
    return a[0] * b[0] + a[2] * b[2] > .45;
  }
  backStepGameLevel() {
    return this.nivel() >= 2;
  }
  setInvalidWalkAttack() {
    const n = this.nivel();
    if (n >= 0 && n < 2) this.w.invalidWalkAttack = seg(6); else if (n === 2) this.w.invalidWalkAttack = seg(3);
  }
  runCornerCheck(t) {
    const w = this.w;
    if (!w.run) return 0;
    if (Math.hypot(w.oldEposX - this.pos[0], w.oldEposZ - this.pos[2]) >= 20) {
      w.wk[0] = 0;
      return 0;
    }
    return ++w.wk[0] >= t ? 1 : 0;
  }
  targetReset() {
    const w = this.w;
    w.target = T_NADA;
    w.targetPlayer = -1;
    w.targetBodypart = 0;
    w.targetDummyEnable = 0;
  }
  targetSetPlayer(n = 0) {
    const w = this.w;
    w.targetPlayer = n;
    if (azar(3) !== 2) w.targetDummyEnable = 1;
    if (w.targetDummyEnable) {
      w.targetDummyMove = 0;
      w.targetDummyLr = azar(2);
    }
  }
  apuntarJugador() {
    const w = this.w;
    this.targetReset();
    w.target = T_JUGADOR;
    this.targetSetPlayer(0);
    w.angry = seg(20);
  }
  targetPosUpdate() {
    const w = this.w;
    if (!this.esJugador()) return;
    const j = this.jugador();
    if (!j.existe) return;
    w.targetPos = [ j.pos[0], j.pos[1], j.pos[2], 0 ];
    if (!w.targetDummyEnable || this.paso !== P.APPROACH && this.paso !== P.RUNATTACK) return;
    const vel = w.run ? 20 : 4, rango = w.run ? 300 : 250;
    if (!w.targetDummyLr) {
      w.targetDummyMove -= vel;
      if (w.targetDummyMove <= -rango) w.targetDummyLr = 1;
    } else {
      w.targetDummyMove += vel;
      if (w.targetDummyMove >= rango) w.targetDummyLr = 0;
    }
    const a = rumboHacia(j.pos, this.pos), d = girarY([ w.targetDummyMove, 0, 0 ], a);
    w.targetPos[0] += d[0];
    w.targetPos[2] += d[2];
  }
  targetSearchPlayerRun() {
    const w = this.w;
    if (w.ignorePlay > 0) return 0;
    const j = this.jugador();
    if (!j.existe || this.distJugador() > 1500 || !j.corriendo) return 0;
    this.apuntarJugador();
    return 1;
  }
  targetSearchSub() {
    const w = this.w, j = this.jugador();
    let jug = false;
    if (w.ignorePlay < 1 && j.existe && j.vida < 1) {
      const rango = (1 - j.vida) * 1500;
      if (this.distJugador() <= rango && rango > 1e-30) jug = true;
    }
    let sangre = null, terri = null;
    if (w.ignoreBlood < 1) {
      sangre = this.m.olerCharco(this.pos, 0, 4e3);
      if (sangre) w.bloodRes = sangre;
    }
    if (w.ignoreTerri < 1) terri = this.m.olerCharco(this.pos, 1, 1500);
    if (sangre) return {
      tipo: T_SANGRE,
      pos: sangre.pos
    };
    if (jug) return {
      tipo: T_JUGADOR,
      pos: j.pos
    };
    if (terri) return {
      tipo: T_TERRITORIO,
      pos: terri.pos
    };
    return null;
  }
  targetSearch() {
    if (this.targetSearchPlayerRun()) return 1;
    const r = this.targetSearchSub(), w = this.w;
    if (!r) {
      this.targetReset();
      return 0;
    }
    if (r.tipo === T_SANGRE) {
      this.targetReset();
      w.target = T_SANGRE;
      w.targetPos = [ ...r.pos, 0 ];
      return 1;
    }
    if (r.tipo === T_JUGADOR) {
      this.apuntarJugador();
      return 1;
    }
    this.targetReset();
    w.target = T_TERRITORIO;
    w.targetPos = [ ...r.pos, 0 ];
    return 1;
  }
  narizEnCharco() {
    const b = this.w.bloodRes;
    if (!b || !this.m.charcoVivo(b)) return 0;
    return dist3(this.hueso(23), b.pos) <= b.radio ? 1 : 0;
  }
  frighten(srcDist) {
    const w = this.w;
    if (w.frightenDisable > 0 || !this.esJugador()) return 0;
    const j = this.jugador(), a = frente(this.rot), b = frente(j.rot);
    if (!(a[0] * b[0] + a[2] * b[2] < -.86)) return 0;
    const st = j.estado;
    let si = st === ST.ATTACK && azar(10) === 0 || st === ST.READY && azar(15) === 0 || (st === ST.READY || st === ST.LOCK) && azar(45) === 0;
    if (!si) {
      const d = this.distJugador(), n = Math.max(1, Math.trunc(FPS * 1.6));
      if (d < 200 && azar(n) === 0) si = true; else if (srcDist >= 0 && d < srcDist && azar(n) === 0) si = true;
    }
    if (si) {
      w.frightenDisable = seg(3);
      return 1;
    }
    return 0;
  }
  tick() {
    if (this.w.esperaVoz > 0) this.w.esperaVoz--;
    this.posAnt = [ ...this.pos ];
    this.rotAnt = this.rot;
    if (this.cond === C.DEAD) {
      this.anim.avanzar();
      return;
    }
    this.control();
    this.anim.avanzar();
    const mov = this.motionLinkMove();
    this.w.oldEposX = this.pos[0];
    this.w.oldEposZ = this.pos[2];
    this.m.mover(this, mov[0], mov[2]);
    this.actualizarAtaque();
  }
  control() {
    const w = this.w;
    if (w.rest > 0) w.rest--;
    if (this.golpes.length) {
      this.terminarAtaque();
      if (this.paso === P.HOLDING) this.m.soltar?.(this);
      const g = this.golpes.shift();
      this.golpes.length = 0;
      this.damageAdditional(g);
      this.nextStepSet();
    }
    this.targetPosUpdate();
    switch (this.paso) {
     case P.INIT:
      this.controlInit();
      break;

     case P.NT:
      this.controlNT();
      break;

     case P.WANDER:
      this.controlWander();
      break;

     case P.DESCENT:
      this.controlDescent();
      break;

     case P.APPROACH:
      this.controlApproach();
      break;

     case P.LIEDOWN:
      this.controlLieDown();
      break;

     case P.SMELLTERRITORY:
     case P.SMELL:
      this.controlSmell();
      break;

     case P.RUNATTACK:
      this.controlRunAttack();
      break;

     case P.WALKATTACK:
      this.controlWalkAttack();
      break;

     case P.HOLDING:
      this.controlHolding();
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

     case P.STRUGGLE:
      this.controlStruggle();
      break;

     case P.DEAD:
      this.controlDead();
      break;

     case P.DEADADRUPTLY:
      this.controlDeadAdruptly();
      break;

     case P.DEADDEMO:
      this.controlDeadDemo();
      break;

     case P.RISE:
      this.controlRise();
      break;

     case P.THREATEN:
      this.controlThreaten();
      break;

     case P.BACKSTEP:
      this.controlBackstep();
      break;

     case P.BLOODSIP:
      this.controlBloodSip();
      break;

     case P.BACKSTEPATTACK:
      this.controlBackstepAttack();
      break;
    }
    w.stepTimer++;
    for (const k of [ "angry", "ignoreBlood", "ignoreTerri", "ignorePlay", "invalidWalkAttack", "frightenDisable" ]) if (w[k] > 0) w[k]--;
    this.angryCollidePlayer();
    w.oldPlayerStat = this.esJugador() ? this.jugador().estado : 0;
    if (this.paso !== P.DOWN && this.paso !== P.STRUGGLE && this.paso !== P.DEAD && this.aguante > 0) this.aguante = Math.min(this.aguanteMax, this.aguante + this.param.recupera / FPS);
    this.nextStepSet();
    w.animeJustSet = 0;
  }
  angryCollidePlayer() {
    if (this.esJugador()) return;
    if (![ P.NT, P.WANDER, P.APPROACH, P.LIEDOWN, P.SMELL, P.BLOODSIP, P.SMELLTERRITORY ].includes(this.paso)) return;
    if (!this.m.tocaJugador(this)) return;
    this.apuntarJugador();
    this.nextStepIssue(P.APPROACH);
  }
  motionLinkMove() {
    const w = this.w, H = this.m.datosHyena;
    let mov = [ 0, 0, 0 ];
    const nom = A_NOMBRE[this.anim.n];
    const local = avanceTabla(H.movimiento[nom], this.cuadro, w.animeSpeed);
    if (local) mov = girarY(local, this.rot);
    const dan = this.anim.n >= A.DMH1 && this.anim.n <= A.DMS2 || this.anim.n >= A.XXC && this.anim.n <= A.XXS2;
    if (dan) {
      let shock = w.bdShock;
      if (shock === 0 && (w.bdType === 19 || w.bdType === 20)) shock = w.bdShock = 1;
      const tabla = H.movimiento_danio[BDT[w.bdType]];
      const d = shock ? avanceTabla(tabla, this.cuadro, shock) : null;
      if (d) {
        const r = Math.atan2(w.bdDir[0], w.bdDir[2]), g = girarY([ d[0], d[1], d[2] ], r);
        mov = [ mov[0] + g[0], mov[1] + g[1], mov[2] + g[2] ];
      }
    }
    return mov;
  }
  controlInit() {
    const y = this.m.piso(this.pos);
    if (y != null && Math.abs(y - this.pos[1]) <= 20) this.nextStepIssue(P.WANDER); else {
      this.anim.velocidad(1);
      this.nextStepIssue(P.DESCENT);
    }
  }
  controlDescent() {
    const w = this.w;
    if (this.sub === 0) {
      w.pow = 0;
      this.sub++;
    }
    const y = this.m.piso(this.pos, 40, 4e3);
    if (y == null || this.pos[1] >= y - 1) {
      if (y != null) this.pos[1] = y;
      this.nextStepIssue(P.WANDER);
      return;
    }
    w.pow += 1 / FPS * 1960;
    this.pos[1] = Math.min(y, this.pos[1] + w.pow / FPS);
  }
  controlNT() {
    const w = this.w;
    if (this.sub === 0) {
      w.targetFind = 0;
      w.playAnimeTimes = 2 + azar(2);
      this.animSet(A.NT);
      w.animeSpeed = 1;
      this.sub = 1;
    } else if (this.sub === 1 && this.vuelta) {
      if (!w.targetFind) {
        if (--w.playAnimeTimes < 1) this.nextStepIssue(P.WANDER);
      } else {
        w.targetFind = 0;
        this.nextStepIssue(P.APPROACH);
      }
    }
    if (!w.targetFind && this.targetSearch()) w.targetFind = 1;
  }
  descanso() {
    return Math.trunc((azar01() * .51 - .25) * FPS * 2) + FPS * 2;
  }
  controlWander() {
    const w = this.w;
    switch (this.sub) {
     case 0:
      w.wanderLr = azar(2);
      w.wanderHorming = 1;
      w.wanderCnt = azar(3) + 1;
      w.rest = this.descanso();
      this.animSet(A.WLK);
      w.animeSpeed = 1;
      this.targetReset();
      this.sub = 1;
      break;

     case 1:
      {
        if (w.rest !== 0) break;
        let ang = [ 45, 60, 75, 90 ][azar(4)] * GRADO;
        if (!w.wanderHorming) {
          w.wanderLr ^= 1;
          if (!w.wanderLr) ang = -ang;
          w.wanderHorming = 1;
        } else {
          const j = this.jugador();
          if (j.existe && this.ladoDe(j.pos) <= 0) ang = -ang;
          if (!(this.distJugador() > 1500)) w.wanderHorming = 0;
        }
        w.targetRad = envolver(w.targetRad + ang);
        this.sub = 2;
        break;
      }

     case 2:
      if (!this.horming(GRADO)) break;
      if (--w.wanderCnt === 0) {
        w.rest = this.descanso();
        this.sub = 1;
        break;
      }
      {
        const r = azar(6);
        w.wanderNext = r < 2 ? 0 : r < 4 ? 1 : 2;
      }
      w.wanderCnt = azar(3) + 1;
      this.sub = 3;

     case 3:
      if (this.vuelta) {
        if (w.wanderNext === 0) {
          this.m.grupo.smellBase = 2;
          this.nextStepIssue(P.SMELL);
        } else if (w.wanderNext === 1) this.nextStepIssue(P.LIEDOWN); else this.nextStepIssue(P.NT);
      }
    }
    if (this.targetSearch()) this.nextStepIssue(P.APPROACH);
  }
  controlApproach() {
    const w = this.w;
    const d = dist3(w.targetPos, this.pos), a = envolver(rumboHacia(w.targetPos, this.pos) - this.rot), A3 = .05235988;
    const fuera = !(a < A3 && a > -A3);
    const jug = this.esJugador();
    let anim = -1;
    if (this.sub === 0) {
      if (!jug) anim = d < 1200 || fuera ? A.WLK : A.RUN; else anim = d < 800 || fuera ? A.WLK2 : A.RUN;
      this.sub++;
    }
    if (jug) {
      if (w.run || !this.vuelta || d < 800 || fuera) {
        if (w.run && d < 400) {
          const st = this.jugador().estado;
          if (w.runAttackCnt >= 2) {
            anim = A.WLK2;
            w.runAttackCnt = 0;
          } else if (st === ST.READY || st === ST.LOCK || st === ST.ATTACK) anim = A.WLK2;
        }
      } else anim = A.RUN;
    } else if (w.target === T_SANGRE || w.target === T_TERRITORIO) {
      if (w.run || !this.vuelta || d < 1200 || fuera) {
        if (w.run && d < 800) anim = A.WLK;
      } else anim = A.RUN;
    }
    if (this.runCornerCheck(Math.trunc(FPS / 4))) w.flag[0] = 1;
    if (w.run && this.cuadro === this.anim.dur - 6 && fuera && jug) anim = A.WLK2;
    const giro = d < 200 ? d >= 60 ? (d * .007142857 + 1) * A3 : .10471976 : A3;
    if (!jug || !w.run || this.distJugador() >= 550) {
      w.targetRad = rumboHacia(w.targetPos, this.pos);
      this.horming(giro);
    }
    if (anim !== -1) this.animSetWithSpeed(anim, 1);
    if (jug) {
      if (w.angry < 1 && (this.vuelta || w.animeJustSet)) {
        w.ignorePlay = seg(5);
        this.nextStepIssue(P.WANDER);
        return;
      }
      if (w.run && w.flag[0]) {
        w.ignorePlay = seg(3);
        this.nextStepIssue(P.WANDER);
        return;
      }
      const st = this.jugador().estado;
      if (w.run && d < 450 && this.jugadorDeEspaldas() && st !== ST.READY && st !== ST.LOCK && st !== ST.ATTACK) {
        this.nextStepIssue(P.RUNATTACK);
        return;
      }
      if (!w.run && d < 300 && this.jugadorAlFrente(.2617994) && w.invalidWalkAttack < 1) {
        this.nextStepIssue(P.THREATEN);
        return;
      }
      if (!w.run && d < 600 && this.frighten(-1) && this.backStepGameLevel()) {
        this.animSetWithSpeed(A.STY3, 1);
        this.nextStepIssue(P.BACKSTEP);
      }
      return;
    }
    if (w.target === T_SANGRE || w.target === T_TERRITORIO) {
      if (this.targetSearchPlayerRun()) return;
      const k = w.target === T_SANGRE ? "ignoreBlood" : "ignoreTerri";
      if (w.stepTimer < seg(15)) {
        if (!(w.run && w.flag[0])) {
          if (w.target === T_SANGRE) {
            if (!this.narizEnCharco() || !this.vuelta) return;
            this.animSet(A.NT);
            w.animeSpeed = 1;
            this.nextStepIssue(P.BLOODSIP);
            return;
          }
          if (d > 150 || !this.vuelta) return;
          this.m.grupo.smellBase = 8;
          this.nextStepIssue(P.SMELLTERRITORY);
          return;
        }
        w[k] = seg(5);
      } else w[k] = seg(15);
      this.nextStepIssue(P.WANDER);
    }
  }
  controlLieDown() {
    const w = this.w;
    switch (this.sub) {
     case 0:
      w.targetFind = 0;
      this.animSet(A.STY5);
      w.animeSpeed = 1;
      this.sub = 1;
      break;

     case 1:
      if (this.fin) {
        w.playAnimeTimes = azar(5) + 15;
        this.animSetWithSpeed(A.STY4, 1);
        this.sub = 2;
      }
      break;

     case 2:
      if (!this.vuelta) break;
      if (!w.targetFind) {
        if (--w.playAnimeTimes < 1) {
          this.anim.poner(A.STY5, {
            desde: -1,
            vel: -1
          });
          this.sub = 3;
        }
      } else {
        w.targetFind = 0;
        this.nextStepIssue(P.APPROACH);
      }
      break;

     case 3:
      if (this.fin) {
        this.animSetWithSpeed(A.NT, 1);
        this.nextStepIssue(P.WANDER);
      }
      break;
    }
    if (!w.targetFind && this.targetSearch()) w.targetFind = 1;
  }
  controlSmell() {
    const w = this.w;
    if (this.sub === 0) {
      w.targetFind = 0;
      w.playAnimeTimes = azar(2) + this.m.grupo.smellBase;
      this.animSet(A.STY1);
      w.animeSpeed = 1;
      this.sub = 1;
    } else if (this.sub === 1 && this.vuelta) {
      if (w.targetFind) {
        w.targetFind = 0;
        w.ignoreTerri = seg(15);
        this.nextStepIssue(P.APPROACH);
        this.sub++;
        return;
      }
      if (--w.playAnimeTimes < 1) {
        w.ignoreTerri = seg(15);
        this.nextStepIssue(P.WANDER);
        this.sub++;
        return;
      }
    }
    if (this.targetSearchPlayerRun()) w.targetFind = 1;
  }
  controlBloodSip() {
    const w = this.w;
    switch (this.sub) {
     case 0:
      w.targetFind = 0;
      if (!w.bloodRes || !this.m.charcoVivo(w.bloodRes)) {
        this.animSet(A.NT);
        w.animeSpeed = 1;
        this.sub = 1;
      } else this.sub = 2;
      break;

     case 1:
      {
        const b = this.m.olerCharco(this.pos, 0, 4e3);
        if (b) {
          w.bloodRes = b;
          w.target = T_SANGRE;
          w.targetPos = [ ...b.pos, 0 ];
          this.sub = 2;
        }
        break;
      }

     case 2:
      w.playAnimeTimes = azar(2) + 3;
      this.animSet(A.STY2);
      w.animeSpeed = 1;
      this.sub = 3;

     case 3:
      {
        if (!w.flag[0] && this.cuadro > 8) {
          this.sonidoLoop(61009);
          w.flag[0] = 1;
        }
        let parar = w.flag[0] && w.flag[1] && !this.narizEnCharco();
        if (this.vuelta) {
          w.playAnimeTimes--;
          w.flag[1] = 1;
          if (w.playAnimeTimes < 1) parar = true;
          if (w.targetFind) {
            w.ignoreBlood = seg(15);
            this.nextStepIssue(P.APPROACH);
            break;
          }
        }
        if (parar) {
          w.ignoreBlood = seg(15);
          this.animSet(A.NT);
          w.animeSpeed = 1;
          this.nextStepIssue(P.WANDER);
        }
      }
    }
    if (this.targetSearchPlayerRun()) w.targetFind = 1;
  }
  controlThreaten() {
    const w = this.w, j = this.jugador(), grupoLibre = this.m.grupo.walkAttackInvalid === 0;
    if (this.sub === 0) {
      w.ppos = [ ...j.pos ];
      w.flag[0] = 1;
      this.animSet(A.STY6);
      w.animeSpeed = 2;
      this.sub = 1;
    } else if (this.sub === 1) {
      if (this.fin) {
        w.rest = Math.trunc(azar01() * FPS) + FPS * 7;
        this.animSet(A.STY3);
        w.animeSpeed = 1;
        this.sonidoLoop(61007);
        w.srcThreatenDist = this.distJugador();
        this.sub = 2;
      }
    } else if (this.sub === 2) {
      if (w.rest <= Math.trunc(FPS * 21 / 4)) w.flag[0] = 0;
      let nx = -1;
      if (dist3(w.ppos, j.pos) >= 300) nx = grupoLibre ? P.WALKATTACK : P.APPROACH;
      const d = this.distJugador();
      if (d <= 300 && azar(30) === 0) this.nextStepIssue(grupoLibre ? P.WALKATTACK : P.APPROACH); else if (w.rest === 0) this.nextStepIssue(this.jugadorAlFrente(.7853982) ? grupoLibre ? P.WALKATTACK : P.APPROACH : P.APPROACH); else if (this.frighten(w.srcThreatenDist) && this.oldPaso !== P.BACKSTEP && this.backStepGameLevel()) this.nextStepIssue(P.BACKSTEP); else if (Math.trunc(FPS * 7 / 2) < w.rest && d >= 800) this.nextStepIssue(P.APPROACH); else if (nx !== -1) this.nextStepIssue(nx);
    }
    if (w.flag[0]) {
      w.targetRad = rumboHacia(w.targetPos, this.pos);
      this.horming(.05235988);
    }
  }
  controlBackstep() {
    const w = this.w;
    const a = envolver(rumboHacia(w.targetPos, this.pos) - this.rot);
    if (this.sub === 0) {
      this.animSet(A.WLKB);
      w.animeSpeed = 1;
      this.sub = 1;
      return;
    }
    if (this.sub === 1) {
      if (this.cuadro !== this.anim.dur - 4) return;
      this.animSet(A.STY3);
      w.animeSpeed = 1;
      this.sub = 2;
      return;
    }
    if (!this.vuelta) return;
    const n = this.nivel();
    let r;
    if (n === 0 || n === 1) {
      this.nextStepIssue(P.THREATEN);
      return;
    }
    if (n === 2) r = azar(3); else if (n === 3) r = azar(2); else r = 0;
    if (r === 0 && a < .41887903 && a > -.41887903) this.nextStepIssue(P.BACKSTEPATTACK); else this.nextStepIssue(P.THREATEN);
  }
  controlBackstepAttack() {
    const w = this.w, d = dist3(w.targetPos, this.pos);
    if (this.sub === 0) {
      this.animSet(A.RUN);
      w.animeSpeed = 1;
      this.sub = 1;
    } else if (w.run && d < 450) this.nextStepIssue(P.RUNATTACK);
  }
  controlRunAttack() {
    const w = this.w;
    switch (this.sub) {
     case 0:
      w.runAttackCnt++;
      this.sonido(60011);
      this.animSet(A.ATT1);
      w.animeSpeed = 1;
      this.sub = 1;
      break;

     case 1:
      if (this.cuadro > 4) {
        const ap = this.param.ataque1;
        this.atacando = {
          golpe: "BAK_HYENA_DASH",
          danio: ap,
          shock: ap * 3,
          radio: 60,
          hueso: 23,
          pego: false
        };
        this.sub = 2;
      }
      break;

     case 2:
      if (this.cuadro < 5 || this.cuadro > 15) {
        this.terminarAtaque();
        this.sub = 3;
        break;
      }
      if (this.atacando?.pego) {
        w.flag[0] = 1;
        this.terminarAtaque();
        this.sub = 3;
      }
      break;

     case 3:
      if (!this.fin) break;
      if (w.flag[0]) {
        w.runAttackCnt = 0;
        this.animSetWithSpeed(A.NT, 1);
        this.nextStepIssue(P.APPROACH);
      } else this.nextStepIssue(P.ESCAPE);
    }
  }
  actualizarAtaque() {
    const at = this.atacando;
    if (!at || at.pego) return;
    const c = this.hueso(at.hueso), j = this.jugador();
    if (!j.existe) return;
    if (distXZ(c, j.pos) <= at.radio + this.m.radioJugador && c[1] <= j.pos[1] + 20 && c[1] >= j.pos[1] - 380) {
      at.pego = true;
      const dir = frente(rumboHacia(j.pos, this.pos));
      this.m.golpear(this, at.danio, at.golpe, {
        shock: at.shock,
        dir: dir,
        pos: c
      });
    }
  }
  terminarAtaque() {
    this.atacando = null;
  }
  controlWalkAttack() {
    const w = this.w;
    if (this.sub === 0) {
      this.sonido(60012);
      this.animSet(A.ATT2);
      w.animeSpeed = 1;
      this.sub = 1;
      return;
    }
    if (this.fin) {
      this.animSet(A.NT);
      w.animeSpeed = 1;
      this.nextStepIssue(P.APPROACH);
      return;
    }
    if (this.cuadro < 3 || this.cuadro > 10) return;
    const j = this.jugador();
    if (!j.existe) return;
    const cabeza = this.hueso(23), piernas = this.m.piernasJugador();
    const d2 = dist3(cabeza, piernas[0]), d3 = dist3(cabeza, piernas[1]);
    if (d2 > 110 && d3 > 110) return;
    const n = this.nivel();
    this.m.grupo.walkAttackInvalid = Math.trunc(FPS * (n >= 0 && n < 2 ? 5.5 : n === 3 ? 1 : 3.5));
    const ap = this.param.ataque1;
    if (this.tipoParam !== 1) {
      this.m.golpear(this, ap, "HYENA_MORDIDA", {
        reaccion: 5,
        pos: cabeza,
        dir: frente(rumboHacia(j.pos, this.pos))
      });
      this.setInvalidWalkAttack();
      this.animSetWithSpeed(A.NT, 1);
      this.nextStepIssue(P.APPROACH);
      return;
    }
    this.m.grupo.walkAttackInvalid += Math.trunc(FPS * 1.5);
    w.targetBodypart = d3 < d2 ? 3 : 2;
    if (this.m.agarrar?.(this, w.targetBodypart, ap) !== false) this.nextStepIssue(P.HOLDING);
  }
  controlHolding() {
    const w = this.w, j = this.jugador();
    if (this.sub === 0) {
      const pierna = this.m.piernasJugador()[w.targetBodypart === 3 ? 1 : 0];
      this.rot = rumboHacia(pierna, this.pos);
      const f = frente(this.rot, 140);
      this.m.moverA(this, pierna[0] - f[0], pierna[2] - f[2]);
      this.animSet(A.ATT3);
      w.animeSpeed = 1;
      this.sonido(61e3);
      this.sub = 1;
      w.holdingDist = dist3(this.hueso(23), pierna);
      w.wk[0] = 0;
      return;
    }
    if (this.sub === 1) {
      if (j.estado === ST.DEAD) w.wk[0]++;
      if (this.m.sigueAgarrado?.(this) ?? w.stepTimer < seg(2)) return;
      this.m.soltar?.(this);
      w.rest = FPS;
      this.animSet(A.NT);
      w.animeSpeed = 1;
      this.sub = 2;
      return;
    }
    if (w.rest === 0) {
      this.setInvalidWalkAttack();
      this.nextStepIssue(P.APPROACH);
    }
  }
  controlEscape() {
    const w = this.w;
    if (this.sub === 0) {
      w.playAnimeTimes = azar(2) + 3;
      this.animSet(A.RUN);
      w.animeSpeed = 1;
      this.sub = 1;
      return;
    }
    if (this.runCornerCheck(Math.trunc(FPS / 8))) w.flag[0] = 1;
    if (this.distJugador() >= 1e3) w.flag[0] = 1;
    if (w.playAnimeTimes === 1 || w.flag[0]) {
      if (this.cuadro === this.anim.dur - 6) w.playAnimeTimes = 0;
    } else if (this.vuelta) w.playAnimeTimes--;
    if (w.playAnimeTimes < 1) this.nextStepIssue(this.oldPaso === P.RUNATTACK ? P.APPROACH : P.WANDER);
  }
  recibir(g) {
    if (this.cond !== C.DEAD) this.golpes.push(g);
  }
  reduceHP(d) {
    this.hp -= d;
    if (this.hp <= 0) {
      this.hp = 0;
      this.aguante = 0;
      return;
    }
    this.aguante = Math.max(0, this.aguante - d);
  }
  vozDanio(g) {
    const w = this.w;
    if (g.kind === 43) return 60010;
    const t = g.bdt;
    if ([ 0, 4, 6, 9, 10, 12, 14, 18 ].includes(t)) return 60004;
    if ([ 1, 3, 5, 7, 11, 13, 15, 16, 17 ].includes(t)) return 60005;
    if (t === 19 || t === 20) {
      if ((w.esperaVoz || 0) < 1) {
        w.esperaVoz = Math.floor(azar(30) / 2);
        return 60005;
      }
      return 0;
    }
    return 60003;
  }
  damageAdditional(g) {
    const w = this.w;
    if (g.atributo === 8) {
      if (this.cond !== C.DYING || w.stampCnt > 1) return;
      this.hp = Math.max(0, this.hp - g.danio);
      this.nextStepIssue(P.DEAD);
      w.stampCnt++;
      w.stampDead = 1;
      return;
    }
    if (this.paso === P.DEAD) {
      this.sonido(60004);
      return;
    }
    const hpAntes = this.hp;
    this.reduceHP(g.danio);
    w.bdType = g.bdt;
    w.bdShock = g.shock;
    w.bdKind = g.golpe;
    w.bdDir = g.dir;
    const voz = this.vozDanio(g);
    if (voz || hpAntes > 0 && this.hp <= 0) this.sonido(voz || 60005);
    if (this.paso === P.STRUGGLE || this.paso === P.DOWN) return;
    let lado = Math.sin(Math.atan2(g.dir[0], g.dir[2]) - this.rot) >= 0 ? 1 : 0;
    const t = g.bdt;
    let derribo = this.aguante <= 0 || [ 1, 13, 15, 16, 17, 18 ].includes(t);
    let anim;
    const golpeCabeza = w.run && this.golpeEnLaCabeza(g) && g.atributo !== 5 && g.atributo !== 7;
    const r10 = () => azar(10);
    if (golpeCabeza) anim = derribo ? A.XXP4 : A.DMP4; else switch (t) {
     case 0:
     case 9:
      anim = derribo ? r10() >= 3 ? A.XXP1 + lado : A.XXP4 : r10() > 2 ? A.DMP1 + lado : A.DMP3;
      break;

     case 1:
     case 13:
      anim = A.XXC;
      break;

     case 2:
     case 22:
      anim = derribo ? A.XXP1 + lado : r10() > 2 ? A.DMH1 + lado : A.DMP3;
      break;

     case 3:
     case 10:
     case 18:
      anim = (derribo ? 25 : 0) + A.DMP1 + lado;
      break;

     case 4:
     case 6:
      anim = derribo ? A.XXP3 + (r10() < 3 ? 1 : 0) : r10() > 2 ? A.DMP3 : A.DMP4;
      break;

     case 5:
     case 7:
      anim = (derribo ? 25 : 0) + A.DMS1 + lado;
      break;

     case 8:
     case 21:
      anim = derribo ? A.XXP1 + lado : r10() > 1 ? A.DMH1 + lado : A.DMP3;
      break;

     case 11:
      anim = derribo ? A.XXS1 + lado : r10() < 3 ? A.DMP4 : A.DMS1 + lado;
      break;

     case 12:
      anim = !derribo ? r10() > 2 ? A.DMP3 : A.DMP4 : r10() > 2 ? r10() > 1 ? A.XXP3 : A.XXG3 : A.XXP4;
      break;

     case 14:
      anim = derribo ? r10() >= 5 ? A.XXP1 + lado : A.XXP4 : r10() > 2 ? A.DMP1 + lado : A.DMP3;
      break;

     case 15:
     case 17:
      anim = A.XXG1 + lado;
      break;

     case 16:
      anim = A.XXG3;
      break;

     case 19:
     case 20:
      anim = derribo ? A.XXC : r10() < 3 ? A.DMP4 : A.DMP1 + lado;
      break;

     default:
      anim = A.XXP4;
      derribo = true;
    }
    this.anim.n = -1;
    this.animSetWithSpeed(anim, anim === A.DMP4 ? 2 : 1);
    this.nextStepIssue(derribo ? P.DOWN : P.DAMAGE);
  }
  golpeEnLaCabeza(g) {
    const f = frente(this.rot);
    if (f[0] * g.dir[0] + f[2] * g.dir[2] > -.3) return false;
    return !g.pos || dist3(this.hueso(9), g.pos) <= 50;
  }
  controlDamage() {
    if (this.sub === 0) {
      this.cond = C.DAMAGE;
      this.sub = 1;
      return;
    }
    if (!this.fin) return;
    this.cond = C.NORMAL;
    if (this.hp === 0) {
      this.nextStepIssue(P.DEAD);
      return;
    }
    this.animSet(A.NT);
    this.w.animeSpeed = 1;
    this.apuntarJugador();
    const a = envolver(rumboHacia(this.jugador().pos, this.pos) - this.rot);
    this.nextStepIssue(a < 2.0943952 && a >= -2.0943952 && this.backStepGameLevel() ? P.BACKSTEP : P.APPROACH);
  }
  controlDown() {
    if (this.sub === 0) {
      this.cond = C.DAMAGE;
      this.sub = 1;
      return;
    }
    if (!this.fin) return;
    this.nextStepIssue(this.hp <= 0 ? P.DEAD : P.STRUGGLE);
  }
  controlStruggle() {
    const w = this.w;
    if (this.sub === 0) {
      if (w.bdType === 18 && this.hp / this.hpMax * 100 >= 35) w.playAnimeTimes = 1; else {
        const n = this.nivel(), r = azar(3);
        w.playAnimeTimes = r + (n < 0 ? 5 : n < 2 ? 7 : n === 3 ? 3 : 5);
      }
      const izq = [ A.XXP1, A.XXS1, A.XXC, A.XXG1 ].includes(this.anim.n);
      if (izq) {
        this.animSet(A.ROTL);
        w.animeSpeed = 1;
      } else this.animSetWithSpeed(A.ROTR, 1);
      this.sonidoLoop(61006);
      this.sub = 1;
      return;
    }
    if (!this.vuelta) return;
    if (--w.playAnimeTimes > 0) return;
    this.nextStepIssue(this.hp !== 0 ? P.RISE : P.DEAD);
  }
  controlRise() {
    const w = this.w;
    if (this.sub === 0) {
      this.animSet(this.anim.n === A.ROTL ? A.UPL : A.UPR);
      w.animeSpeed = 1;
      this.sub = 1;
      return;
    }
    if (!this.fin) return;
    this.aguante = this.aguanteMax;
    this.cond = C.NORMAL;
    this.animSet(A.NT);
    w.animeSpeed = 1;
    this.apuntarJugador();
    const a = envolver(rumboHacia(this.jugador().pos, this.pos) - this.rot);
    this.nextStepIssue(a < 2.0943952 && a >= -2.0943952 ? P.BACKSTEP : P.APPROACH);
  }
  controlDead() {
    const w = this.w;
    if (w.oiutiTimer !== 0) w.oiutiTimer--;
    const muriendo = this.anim.n === A.DIEL || this.anim.n === A.DIER;
    if (w.oiuti && w.oiutiTimer < 1 && (!muriendo || this.fin)) {
      this.m.charco(this, 200);
      this.cond = C.DEAD;
      this.sonidoLoop(null);
      return;
    }
    if (this.sub !== 0) return;
    if (!w.killCounted) w.killCounted = 1;
    if (w.stampDead) {
      this.sonido(60008);
      this.anim.n = -1;
      this.animSet(w.downLr ? A.DIER : A.DIEL);
      w.stampDead = 0;
    }
    this.cond = w.stampCnt < 2 ? C.DYING : C.DAMAGE;
    this.sub = 1;
    if (!w.oiuti) {
      w.oiuti = 1;
      w.oiutiTimer = FPS * (azar(6) + 5);
    }
  }
  controlDeadAdruptly() {
    this.w.boneCtrlFalse = 1;
    if (this.w.downLr) this.anim.poner(A.DIER, {
      desde: 60
    }); else this.anim.poner(A.DIEL, {
      desde: 45
    });
    this.cond = C.DEAD;
  }
  controlDeadDemo() {
    this.w.boneCtrlFalse = 1;
    this.animSet(A.DED);
    this.m.charco(this, 200, true);
    this.cond = C.DEAD;
  }
}

const A_NOMBRE = Object.fromEntries(Object.entries(A).map(([k, v]) => [ v, k ]));
