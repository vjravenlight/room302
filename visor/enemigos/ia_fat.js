// SH4 web — FeniXVOID · Project Ravenlight
import { DT, envolver, rumboHacia, distXZ, dist3, azar01 } from "./comun.js";

export const P = {
  INIT: 0,
  FLOAT: 1,
  BALLOON: 2,
  RISE: 3,
  CONFRONT: 4,
  IDLING: 5,
  DASH: 6,
  HURL: 7,
  CAUTION: 8,
  ESCAPE: 9,
  CHASE: 10,
  INTOWALL: 11,
  INWALL: 12,
  FROMWALL: 13,
  DAMAGE: 14,
  DOWN: 15,
  DOWN2: 16,
  EXORCISMDOWN: 17,
  EXORCISMDOWNT: 18,
  FINISHED: 19,
  WAIT: 20
};

export const NOMBRE_PASO = [ "Init", "Float", "Balloon", "Rise", "Confront", "Idling", "Dash", "Hurl", "Caution", "Escape", "Chase", "IntoWall", "InWall", "FromWall", "Damage", "Down", "Down2", "ExorcismDown", "ExorcismDownT", "Finished", "Wait" ];

export const A = {
  NT: 0,
  NTSP: 1,
  ANT: 2,
  DMH1: 3,
  DMH2: 4,
  DMP1: 5,
  DMP2: 6,
  DMP3: 7,
  XXPS: 8,
  XXPU: 9,
  XXPD: 10,
  XXSU: 11,
  XXSD: 12,
  ROTS: 13,
  ROTU: 14,
  ROTD: 15,
  UPS: 16,
  SPH: 17,
  ATT1: 18,
  BRS1: 19,
  BRS2: 20,
  BRS3: 21,
  WA: 22,
  DNTU: 23,
  DNTD: 24,
  TDMU: 25,
  TDMD: 26,
  UPU: 27,
  UPD: 28
};

export const NOMBRES_ANIM_FAT = Object.keys(A);

const GOLPE = {
  SING: [ "BAK_FAT_SING", 4 ],
  DASH: [ "BAK_FAT_DASH", 20 ],
  DASH2: [ "BAK_FAT_DASH2", 10 ],
  BOMB: [ "BAK_FAT_BOMB", 10 ]
};

const SON = {
  VOZ: 60607,
  GOLPE: 60605,
  DANIO: 60600,
  EXORCISMO: 60606,
  MUERE: 61604
};

const R90 = Math.PI / 2, R45 = Math.PI / 4, R30 = Math.PI / 6, R15 = .2617994, R5 = .0872665;

const ALTO_FLOTE = 240;

export class Fat {
  constructor(def, pj, anim, m) {
    this.tipo = "FAT";
    this.def = def;
    this.pj = pj;
    this.anim = anim;
    this.m = m;
    this.tipoParam = def.tipo_param || 0;
    this.param = m.parametros("FAT", this.tipoParam);
    this.hp = this.hpMax = this.param.vida;
    this.aguante = this.aguanteMax = this.param.aguante;
    this.pos = [ ...def.pos ];
    this.rot = def.rumbo || 0;
    this.posAnt = [ ...this.pos ];
    this.rotAnt = this.rot;
    this.radio = 140;
    this.alto = 360;
    this.centroAlto = 180;
    this.radioGolpe = 140;
    this.tipoCl = 0;
    this.sinPasos = true;
    this.cond = 1;
    this.paso = P.INIT;
    this.sub = 0;
    this.golpes = [];
    this.visible = true;
    this.opacidad = .9;
    this.w = {
      t: 0,
      t2: 0,
      vel: [ 0, 0, 0 ],
      giro: this.rot,
      lento: 0,
      golpeo: false,
      alturaObj: this.pos[1],
      empuje: [ 0, 0, 0 ],
      canto: 0
    };
    const esc = m.escena?.();
    this.ausente = !m.bandera(1637) || !m.bandera(740) && !(m.etapa === 4 && esc === 40);
    if (this.ausente) {
      this.visible = false;
      this.paso = -1;
    } else if (((def.ini ?? 0) & 240) === 112) this.paso = P.WAIT;
    this.anim.poner(A.NT);
  }
  caido() {
    return this.paso === P.DOWN || this.paso === P.DOWN2 || this.paso === P.EXORCISMDOWN || this.paso === P.EXORCISMDOWNT;
  }
  persigue() {
    return [ P.CONFRONT, P.IDLING, P.DASH, P.HURL, P.CAUTION, P.CHASE ].includes(this.paso);
  }
  intocable() {
    return this.ausente || !this.visible || this.paso === P.FINISHED || this.paso === P.INWALL;
  }
  maldice() {
    return !this.ausente && this.cond !== 9 && this.cond !== 10 && this.cond !== 11 && this.cond !== 18;
  }
  get sinSangre() {
    return true;
  }
  recibir(g) {
    if (!this.intocable()) this.golpes.push(g);
  }
  cambiar(p) {
    this.paso = p;
    this.sub = 0;
  }
  ponerAnim(n, vel = 1) {
    this.anim.poner(n, {
      vel: vel
    });
  }
  sonido(id) {
    this.m.sonido?.(this, id);
  }
  jug() {
    return this.m.jugador();
  }
  dJ(j = this.jug()) {
    return distXZ(this.pos, j.pos);
  }
  lento() {
    return 1 - this.w.lento * .5;
  }
  girarHacia(p, vel) {
    const d = envolver(rumboHacia(p, this.pos) - this.rot), max = vel * DT;
    this.rot = envolver(this.rot + Math.max(-max, Math.min(max, d)));
  }
  flotar() {
    const dy = this.w.alturaObj - this.pos[1];
    this.pos[1] += Math.max(-200 * DT, Math.min(200 * DT, dy));
  }
  alturaHenry(j) {
    this.w.alturaObj = j.pos[1] - ALTO_FLOTE;
  }
  avanzar(v) {
    this.mover(Math.sin(this.rot) * v * DT, Math.cos(this.rot) * v * DT);
  }
  mover(dx, dz) {
    (this.m.moverFlotante || this.m.moverFantasma).call(this.m, this, dx, dz);
  }
  haciaPorCamino(dest) {
    const p = typeof this.m.camino === "function" ? this.m.camino(this, dest) : null;
    this.w.sinCamino = !p;
    return p ? [ p[0], dest[1], p[2] ] : dest;
  }
  vela() {
    const v = this.m.vela?.(this) || 0;
    if (v > 0) {
      this.hp = Math.max(0, this.hp - v * 10);
      this.w.lento = Math.min(1, this.w.lento + DT);
    } else this.w.lento = Math.max(0, this.w.lento - DT);
  }
  tick() {
    this.posAnt = [ ...this.pos ];
    this.rotAnt = this.rot;
    if (this.ausente) return;
    if (!this.m.bandera(740) && !(this.m.etapa === 4 && this.m.escena?.() === 40)) {
      this.anim.avanzar();
      return;
    }
    const j = this.jug();
    this.vela();
    this.revisarGolpes(j);
    if (this.cond < 9 || this.cond > 11) {
      this.w.canto -= DT;
      if (this.w.canto <= 0) {
        this.sonido(SON.VOZ);
        this.w.canto = (azar01() + 1) * 5;
      }
    }
    const f = PASOS[this.paso];
    if (f) f.call(this, j);
    this.anim.avanzar();
  }
  revisarGolpes(j) {
    if (!this.golpes.length) return;
    const gs = this.golpes;
    this.golpes = [];
    for (const g of gs) {
      if (this.caido()) {
        this.hp = Math.max(0, this.hp - (g.danio || 0));
        continue;
      }
      if (g.atributo === 6 || g.atributo === 7) {
        this.sonido(SON.EXORCISMO);
        this.cambiar(P.EXORCISMDOWN);
        return;
      }
      this.hp = Math.max(0, this.hp - (g.danio || 0));
      const dir = g.dir || [ 0, 0, 0 ];
      this.w.empuje = [ dir[0] * 20, 0, (dir[2] ?? dir[1] ?? 0) * 20 ];
      this.sonido(SON.DANIO);
      this.cambiar(P.DAMAGE);
    }
  }
}

const PASOS = [];

PASOS[P.INIT] = function(j) {
  this.alturaHenry(j);
  this.cambiar(P.FLOAT);
};

PASOS[P.FLOAT] = function(j) {
  const w = this.w;
  if (this.sub === 0) {
    this.ponerAnim(A.NT);
    this.cond = 1;
    this.tipoCl = 0;
    this.alturaHenry(j);
    this.sub = 1;
  }
  if (this.sub === 1) {
    if (Math.abs(j.pos[1] - this.pos[1]) > 600 && this.m.lineaDeVista?.(this, null)) return this.cambiar(P.RISE);
    const a = azar01() * Math.PI * 2, r = 400 + azar01() * 800;
    w.objetivo = [ this.pos[0] + Math.sin(a) * r, this.pos[1], this.pos[2] + Math.cos(a) * r ];
    if (dist3(this.pos, j.pos) < 2e3) {
      const x = azar01();
      if (x < .5) return this.cambiar(P.BALLOON);
      if (x < .7) return this.cambiar(P.CAUTION);
    }
    w.t = azar01() * 10 + 5;
    this.sub = 2;
  }
  if (this.sub === 2) {
    this.girarHacia(this.haciaPorCamino(w.objetivo), R90 * this.lento());
    this.avanzar((this.param.velocidad || 60) * (1 - w.lento * .5));
    w.t -= DT;
    if (w.t <= 0 || distXZ(this.pos, w.objetivo) < 100) this.sub = 1;
    if (dist3(this.pos, j.pos) < 1500 && this.m.lineaDeVista?.(this, null)) this.cambiar(P.CHASE);
  }
  this.alturaHenry(j);
  this.flotar();
};

PASOS[P.BALLOON] = function(j) {
  const w = this.w;
  switch (this.sub) {
   case 0:
    this.cond = 1;
    w.t = azar01() * 20 + 5;
    this.ponerAnim(A.BRS1);
    this.sub = 1;
    return;

   case 1:
    if (this.anim.fin) {
      this.ponerAnim(A.BRS2);
      this.sub = 2;
    }
    break;

   case 2:
    {
      w.t -= DT;
      const d = this.dJ(j);
      if (w.t > 0 && d < 3e3) {
        this.girarHacia(j.pos, R15);
        if (d < 2e3 && d < 1e3) w.t *= .5;
        break;
      }
      this.ponerAnim(A.BRS3);
      this.sub = 3;
      break;
    }

   case 3:
    if (!this.anim.fin) break;
    if (this.dJ(j) <= 400) {
      if (dist3(this.pos, j.pos) >= 300) return this.cambiar(P.DASH);
      return this.cambiar(azar01() < .5 ? P.IDLING : P.HURL);
    }
    return this.cambiar(P.FLOAT);
  }
  this.flotar();
};

PASOS[P.RISE] = function(j) {
  this.cond = 3;
  if (this.anim.n !== A.ANT) this.ponerAnim(A.ANT);
  this.alturaHenry(j);
  this.flotar();
  this.girarHacia(j.pos, R90);
  if (Math.abs(this.pos[1] - this.w.alturaObj) < 200) this.cambiar(P.CONFRONT);
};

PASOS[P.CONFRONT] = function(j) {
  const w = this.w;
  if (this.sub === 0) {
    this.ponerAnim(A.ATT1);
    this.cond = 5;
    this.tipoCl = 0;
    w.t = 0;
    w.t2 = azar01() * 3 + 2;
    this.sub = 1;
  }
  this.alturaHenry(j);
  this.flotar();
  this.girarHacia(j.pos, R45 * this.lento());
  const d = this.dJ(j);
  if (d > 400) this.avanzar((this.param.velocidad || 60) * 2 * this.lento());
  w.t2 -= DT;
  if (w.t2 <= 0) {
    if (d < 600 && this.m.lineaDeVista?.(this, null)) return this.cambiar(P.HURL);
    if (d < 400) return this.cambiar(P.IDLING);
    if (d > 3e3) return this.cambiar(P.FLOAT);
    w.t2 = azar01() * 3 + 2;
    if (azar01() < .3) return this.cambiar(P.ESCAPE);
  }
};

PASOS[P.IDLING] = function(j) {
  const w = this.w;
  if (this.sub === 0) {
    this.ponerAnim(A.NTSP, 2);
    this.cond = 5;
    w.t = azar01() * 5;
    w.golpeo = false;
    this.sub = 1;
  }
  this.girarHacia(j.pos, R30);
  if (!w.golpeo && this.dJ(j) < 160 + this.m.radioJugador) {
    w.golpeo = true;
    this.m.golpear(this, GOLPE.DASH2[1], GOLPE.DASH2[0]);
    this.sonido(SON.GOLPE);
  }
  w.t -= DT;
  if (w.t <= 0) return this.cambiar(this.dJ(j) < 400 ? P.DASH : P.CHASE);
};

PASOS[P.DASH] = function(j) {
  const w = this.w;
  switch (this.sub) {
   case 0:
    this.ponerAnim(A.SPH);
    this.cond = 5;
    w.golpeo = false;
    w.t = 0;
    this.sub = 1;
    return;

   case 1:
    {
      this.girarHacia(j.pos, R15);
      w.t += DT;
      const v = (1 - w.lento * .8) * (this.param.velocidad2 || 250) * 4;
      const antes = [ ...this.pos ];
      this.m.mover(this, Math.sin(this.rot) * v * DT, Math.cos(this.rot) * v * DT);
      const atrasDeHenry = Math.sin(this.rot) * (j.pos[0] - this.pos[0]) + Math.cos(this.rot) * (j.pos[2] - this.pos[2]) < -400;
      if (!w.golpeo && dist3(this.pos, j.pos) < 160 + this.m.radioJugador && j.existe) {
        w.golpeo = true;
        this.m.golpear(this, GOLPE.DASH[1], GOLPE.DASH[0]);
        this.sonido(SON.GOLPE);
        this.sub = 2;
        w.t2 = .5;
        return;
      }
      if (atrasDeHenry || distXZ(antes, this.pos) < v * DT * .2 || w.t > 4) {
        this.sub = 3;
        w.t2 = .5;
      }
      return;
    }

   case 2:
   case 3:
    {
      const s = this.sub === 2 ? -10 : 10;
      this.m.mover(this, Math.sin(this.rot) * s * 20 * DT, Math.cos(this.rot) * s * 20 * DT);
      w.t2 -= DT;
      if (w.t2 <= 0) {
        this.ponerAnim(A.NTSP);
        this.anim.poner(A.NTSP, {
          vel: -1,
          desde: -1
        });
        this.sub = 5;
      }
      return;
    }

   case 5:
    if (this.anim.fin || this.anim.t <= 0) this.cambiar(P.CAUTION);
    return;
  }
};

PASOS[P.HURL] = function(j) {
  const w = this.w;
  switch (this.sub) {
   case 0:
    this.ponerAnim(A.NTSP, azar01() + 1);
    this.cond = 7;
    w.t = azar01() + .5;
    w.golpeo = false;
    w.impulso = 0;
    this.sub = 1;
    return;

   case 1:
    this.girarHacia(j.pos, R30);
    this.avanzar(-(this.param.velocidad || 60) * (1 - w.lento * .4));
    w.t -= DT;
    if (w.t <= 0 && this.anim.fin) {
      w.t = azar01() * 3 + 2;
      this.cond = 5;
      this.ponerAnim(A.BRS1);
      this.sub = 2;
    }
    return;

   case 2:
    w.impulso = Math.min(1, w.impulso + DT);
    this.girarHacia(j.pos, R5);
    this.avanzar((1 - w.lento * .4) * w.impulso * 600);
    if (!w.golpeo && dist3(this.pos, j.pos) < 200 + this.m.radioJugador) {
      w.golpeo = true;
      this.m.golpear(this, GOLPE.DASH[1], GOLPE.DASH[0]);
      this.sonido(SON.GOLPE);
      this.ponerAnim(A.BRS3);
      this.sub = 3;
    }
    w.t -= DT;
    if (w.t <= 0 && this.anim.fin) {
      this.ponerAnim(A.BRS3);
      this.sub = 3;
    }
    return;

   case 3:
    w.impulso = Math.max(0, w.impulso - DT);
    this.avanzar(w.impulso * 400);
    if (this.anim.fin) this.cambiar(P.CONFRONT);
  }
};

PASOS[P.CAUTION] = function(j) {
  const w = this.w;
  if (this.sub === 0) {
    this.ponerAnim(A.NT);
    this.cond = 2;
    w.t = azar01() * 10 + 5;
    this.sub = 1;
  }
  this.alturaHenry(j);
  this.flotar();
  this.girarHacia(j.pos, R15 * this.lento());
  w.t -= DT;
  const apunta = j.estado >= 3 && j.estado <= 5;
  if (apunta && w.t <= 0) return this.cambiar(azar01() < .2 && this.dJ(j) < 400 ? P.IDLING : P.HURL);
  if (!apunta && w.t <= 0) return this.cambiar(azar01() < .5 ? P.CONFRONT : P.BALLOON);
  if (this.dJ(j) > 2e3) this.cambiar(P.CHASE);
};

PASOS[P.ESCAPE] = function(j) {
  const w = this.w;
  if (this.sub === 0) {
    this.cond = 4;
    this.ponerAnim(A.BRS1);
    w.t = azar01() * 3 + 1;
    this.sub = 1;
  }
  if (this.sub === 1 && this.anim.fin) {
    this.ponerAnim(A.BRS2);
    this.sub = 2;
  }
  this.girarHacia(j.pos, R15);
  this.avanzar(-(this.param.velocidad || 60) * (1 - w.lento * .5));
  w.alturaObj = j.pos[1] - 600;
  this.flotar();
  w.t -= DT;
  if (w.t <= 0) {
    this.ponerAnim(A.BRS3);
    this.cambiar(this.dJ(j) <= 400 ? P.IDLING : P.CHASE);
  }
};

PASOS[P.CHASE] = function(j) {
  if (this.sub === 0) {
    this.ponerAnim(A.NT);
    this.cond = 3;
    this.sub = 1;
  }
  this.alturaHenry(j);
  this.flotar();
  const ve = this.m.lineaDeVista?.(this, null) !== false;
  this.girarHacia(ve ? j.pos : this.haciaPorCamino(j.pos), R90 * this.lento());
  this.avanzar((this.param.velocidad || 60) * (ve ? 2 : 4) * this.lento());
  if (this.dJ(j) < 300 || ve && this.dJ(j) < 600) this.cambiar(P.CONFRONT);
};

PASOS[P.INTOWALL] = PASOS[P.INWALL] = PASOS[P.FROMWALL] = function() {
  this.visible = true;
  this.cambiar(P.CHASE);
};

PASOS[P.DAMAGE] = function(j) {
  const w = this.w;
  if (this.sub === 0) {
    this.cond = 9;
    this.ponerAnim(azar01() < .5 ? A.DMH1 : A.DMP1);
    if (this.hp <= 0 && this.m.bandera(1637)) {
      this.ponerAnim(A.XXPU);
      this.sub = 3;
      return;
    }
    this.sub = 1;
  }
  const e = w.empuje;
  this.tipoCl = 0;
  this.mover(e[0] * 20 * DT, e[2] * 20 * DT);
  const k = (30 / 31) ** 4;
  e[0] *= k;
  e[2] *= k;
  if (this.sub === 1 && this.anim.fin) this.cambiar(P.CAUTION);
  if (this.sub === 3 && this.anim.fin) this.cambiar(P.DOWN);
};

PASOS[P.DOWN] = PASOS[P.DOWN2] = function(j) {
  const w = this.w;
  if (this.sub === 0) {
    this.cond = 10;
    this.ponerAnim(A.DNTU);
    w.t = this.hp > 0 ? (azar01() + 1) * 3 : (azar01() + 1) * 30;
    w.alturaObj = (this.m.piso?.(this.pos, 400, 3e3) ?? this.pos[1]) - 40;
    this.sub = 1;
  }
  this.flotar();
  if (this.sub === 1) {
    if ((this.m.vela?.(this) || 0) > 0 && w.t < 300) w.t += azar01() * DT;
    w.t -= DT;
    if (w.t <= 0) {
      this.ponerAnim(A.UPU);
      this.cond = 8;
      this.sub = 2;
    }
    return;
  }
  if (this.anim.fin) {
    this.hp = Math.max(this.hp, this.hpMax * .5);
    this.aguante = this.aguanteMax;
    this.cambiar(P.FLOAT);
  }
};

PASOS[P.EXORCISMDOWN] = PASOS[P.EXORCISMDOWNT] = function() {
  const w = this.w;
  if (this.sub === 0) {
    this.cond = 10;
    this.ponerAnim(A.ROTU);
    w.t = (azar01() + 1) * 600 / 10;
    this.sub = 1;
    return;
  }
  if (this.sub === 1) {
    if (this.anim.fin) this.ponerAnim(A.DNTU);
    w.t -= DT;
    if (w.t <= 0) {
      this.ponerAnim(A.UPU);
      this.sub = 2;
    }
    return;
  }
  if (this.anim.fin) {
    this.hp = this.hpMax;
    this.cambiar(P.FLOAT);
  }
};

PASOS[P.FINISHED] = function() {
  if (this.sub === 0) {
    this.sonido(SON.MUERE);
    this.cond = 11;
    this.ponerAnim(A.DNTU);
    this.sub = 1;
  }
};

PASOS[P.WAIT] = function(j) {
  if (this.sub === 0) {
    this.ponerAnim(A.ATT1);
    this.cond = 5;
    this.sub = 1;
  }
  this.girarHacia(j.pos, R45);
  if (this.dJ(j) < 1e3 && this.m.lineaDeVista?.(this, null)) this.cambiar(P.CONFRONT);
};

export const binFat = () => "enemy_fat.bin";
