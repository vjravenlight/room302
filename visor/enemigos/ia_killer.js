// SH4 web — FeniXVOID · Project Ravenlight
import { DT, envolver, rumboHacia, distXZ, dist3, azar01, azar } from "./comun.js";

export const P = {
  INIT: 0,
  WANDER: 1,
  RUN: 2,
  CATTACK: 3,
  APPROACH: 4,
  READY: 5,
  SHOOT: 6,
  RAPIDFIRE: 7,
  ESCAPE: 8,
  DASH: 9,
  ATTACK: 10,
  INTERVAL: 11,
  BACKSTEP: 12,
  DAMAGE: 13,
  DOWN: 14,
  FINISH: 15,
  CM: 16,
  CM2: 17,
  WAIT: 18,
  EVENT: 19,
  NADA: 20
};

export const NOMBRE_PASO = [ "Init", "Wander", "Run", "CAttack", "Approach", "Ready", "Shoot", "RapidFire", "Escape", "Dash", "Attack", "Interval", "BackStep", "Damage", "Down", "Finish", "CM", "CM", "Wait", "Event", "-" ];

export const A = {
  NT: 0,
  WALK: 1,
  BACK: 2,
  RUN: 3,
  BAS0: 4,
  BAS1: 5,
  XXU: 18,
  XXD: 19,
  DNTU: 20,
  DNTD: 21,
  UPU: 22,
  UPD: 23,
  ROTU: 24,
  ROTD: 25,
  XXG: 26,
  DEADU: 27,
  DEADD: 28,
  GUNR1: 29,
  GUNR2: 30,
  GUNR3: 31,
  GUNR4: 32,
  GUNL1: 33,
  GUNL2: 34,
  GUNL3: 35,
  GUNL4: 36,
  GUNB1: 37,
  GUNB2: 38,
  GUNB3: 39,
  GUNB4: 40,
  PIPEA: 41,
  PIPEB: 42,
  CHA1: 43,
  CHA2: 44,
  CHA3: 45,
  CHB1: 46,
  CHB2: 47,
  CHB3: 48
};

export const NOMBRES_ANIM_KILLER = [ "NT", "WALK", "BACK", "RUN", "BAS0", "BAS1", "DMH1", "DMH2", "DMH1S", "DMH2S", "DMP1", "DMP2", "DMP1S", "DMP2S", "DMS1", "DMS2", "DMS1S", "DMS2S", "XXU", "XXD", "DNTU", "DNTD", "UPU", "UPD", "ROTU", "ROTD", "XXG", "DEADU", "DEADD", "GUNR1", "GUNR2", "GUNR3", "GUNR4", "GUNL1", "GUNL2", "GUNL3", "GUNL4", "GUNB1", "GUNB2", "GUNB3", "GUNB4", "PIPEA", "PIPEB", "CHA1", "CHA2", "CHA3", "CHB1", "CHB2", "CHB3" ];

export const GOLPE = {
  102: [ "BAK_KILLER_SHOOT", 10 ],
  103: [ "BAK_KILLER_RAPIDFIRE", 10 ],
  104: [ "BAK_KILLER_PIPE", 15 ],
  105: [ "BAK_KILLER_PIPE_ST", 25 ],
  106: [ "BAK_KILLER_CHAINSAW_STAB", 7 ],
  107: [ "BAK_KILLER_CHAINSAW_SHAKE", 12 ]
};

export const ARMAS = {
  0: [ 229, 230 ],
  5: [ 229, 230 ],
  1: [ 231, 231 ],
  3: [ 231, 231 ],
  4: [ 231, 231 ],
  2: [ 53, 230 ]
};

export const ARMAS_SUBTE = [ 18, 16 ];

export const HUESO_MANO = [ 50, 49 ];

export const MODELO_ARMA = {
  229: {
    bin: "enemy_killer.bin",
    m: 1,
    t: 1
  },
  230: {
    bin: "enemy_killer.bin",
    m: 2,
    t: 2
  },
  231: {
    bin: "enemy_killer.bin",
    m: 3,
    t: 3
  },
  18: {
    bin: "item_model2.bin",
    parte: 0,
    tparte: 1
  },
  16: {
    bin: "wp_model.bin",
    parte: 12,
    tparte: 90
  },
  53: {
    bin: "wp_model.bin",
    parte: 8,
    tparte: 88
  }
};

const SON = {
  VOZ1: 60401,
  VOZ2: 60402,
  CARGA: 40048,
  TIRO: 40045,
  MOTOSIERRA_FIN: 40050,
  PUERTA_ABRE: 40084,
  PUERTA_CIERRA: 40085,
  MOTOSIERRA: 41001,
  MOTOSIERRA2: 41049
};

const PI2 = Math.PI * 2, R90 = Math.PI / 2, R45 = Math.PI / 4, R30 = Math.PI / 6, R15 = .2617994, R5 = .0872665;

const COS15 = .258819, COS45 = .7071068;

const GOLPES_TOPE = [ 1, 1, 2, 2, 2 ];

const frente = r => [ Math.sin(r), Math.cos(r) ];

export class Killer {
  constructor(def, pj, anim, m) {
    this.tipo = "KILLER";
    this.def = def;
    this.pj = pj;
    this.anim = anim;
    this.m = m;
    const ini = def.ini ?? def.estado_inicial ?? 0;
    this.tipoParam = def.tipo_param ?? ini >> 8 & 15;
    this.param = m.parametros("KILLER", 0);
    this.hp = this.hpMax = this.param.vida;
    this.aguante = this.aguanteMax = this.param.aguante;
    this.pos = [ ...def.pos ];
    this.rot = def.rumbo || 0;
    this.posAnt = [ ...this.pos ];
    this.rotAnt = this.rot;
    this.radio = 80;
    this.alto = 300;
    this.centroAlto = 150;
    this.radioGolpe = 100;
    this.cond = 1;
    this.paso = P.INIT;
    this.sub = 0;
    const armas = m.etapa === 2 && (this.tipoParam === 0 || this.tipoParam === 5) ? ARMAS_SUBTE : ARMAS[this.tipoParam] || ARMAS[0];
    this.armas = armas;
    const pistolas = this.tipoParam === 1 || this.tipoParam === 3 || this.tipoParam === 4;
    this.w = {
      balas: [ pistolas ? 10 : 0, 10 ],
      objetivo: [ ...this.pos ],
      golpes: 0,
      golpesT: 0,
      mano: 0,
      golpe: 0,
      t: 0,
      tiros: 0,
      t2: 0,
      dAnt: 0,
      caida: 0,
      reloj: 0,
      vela: 0,
      motor: null,
      desde: 0,
      hasta: 0,
      golpesPend: [],
      dirGolpe: null
    };
    this.golpes = [];
    this.visible = true;
    if ((ini & 15) === 6) {
      this.cond = 18;
      this.paso = P.EVENT;
    } else if ((ini & 240) === 112 && m.etapa !== 2 && m.etapa !== 4) {
      this.cond = 13;
      this.paso = P.WAIT;
      this.visible = false;
    }
    this.anim.poner(A.NT);
  }
  caido() {
    return this.paso === P.DOWN;
  }
  persigue() {
    return this.paso >= P.APPROACH && this.paso <= P.BACKSTEP || this.paso === P.CM || this.paso === P.CM2;
  }
  intocable() {
    return !this.visible || this.paso === P.WAIT || this.paso === P.NADA;
  }
  maldice() {
    return false;
  }
  get sinSangre() {
    return false;
  }
  recibir(g) {
    if (!this.intocable()) this.golpes.push(g);
  }
  cambiar(p) {
    this.paso = p;
    this.sub = 0;
  }
  ponerAnim(n) {
    if (n === A.WALK || n === A.NT || n === A.RUN || n === A.BAS0 || n === A.BAS1 || n === A.PIPEA || n === A.PIPEB) this.estadoArmas(0);
    let vel = 1;
    if (n >= 6 && n <= 17) vel = azar01() * .2 + .8; else if ([ A.GUNR1, A.GUNR4, A.GUNL1, A.GUNL4 ].includes(n)) vel = azar01() + 1; else if (n === A.PIPEA || n === A.PIPEB) vel = azar01() * .5 + 1;
    this.anim.poner(n, {
      vel: vel
    });
  }
  estadoArmas() {}
  progreso() {
    return this.anim.t / this.anim.dur;
  }
  quedan(seg) {
    return this.anim.fin || this.anim.dur - this.anim.t <= Math.round(seg * 30 * Math.abs(this.anim.vel));
  }
  jug() {
    return this.m.jugador();
  }
  dJ(j = this.jug()) {
    return distXZ(this.pos, j.pos);
  }
  cosA(p) {
    const d = distXZ(p, this.pos);
    if (d < .001) return 1;
    const [fx, fz] = frente(this.rot);
    return (fx * (p[0] - this.pos[0]) + fz * (p[2] - this.pos[2])) / d;
  }
  girarHacia(p, vel) {
    const d = envolver(rumboHacia(p, this.pos) - this.rot), max = vel * DT;
    this.rot = envolver(this.rot + Math.max(-max, Math.min(max, d)));
  }
  sonido(id) {
    if (id) this.m.sonido?.(this, id);
  }
  libre(a, b) {
    return this.m.lineaDeVista ? this.m.lineaDeVista([ a[0], a[1] - 150, a[2] ], [ b[0], b[1] - 150, b[2] ]) : true;
  }
  armado() {
    return this.tipoParam === 1 || this.tipoParam === 3 || this.tipoParam === 4;
  }
  hayBalas() {
    return this.w.balas[0] > 0 || this.w.balas[1] > 0;
  }
  conBalas() {
    return !this.armado() || this.hayBalas();
  }
  recargar() {
    if (this.armado()) this.w.balas[0] = 10;
    this.w.balas[1] = 10;
  }
  muerto(j) {
    return j.estado === 10;
  }
  atacable(j) {
    return this.w.reloj >= 5 && ![ 6, 7, 9, 10 ].includes(j.estado);
  }
  apuntado(j) {
    if (!(j.estado >= 3 && j.estado <= 5)) return 0;
    return this.m.objetivoJugador?.()?.enemigo === this ? 1 : 2;
  }
  henryPega(j) {
    return j.estado === 5;
  }
  miraHenry(j) {
    const [hx, hz] = frente(j.rot), d = distXZ(this.pos, j.pos) || 1;
    return (hx * (this.pos[0] - j.pos[0]) + hz * (this.pos[2] - j.pos[2])) / d;
  }
  puedeTirar(j) {
    if (dist3(this.pos, j.pos) > 3e3 || this.cosA(j.pos) < COS45) return 0;
    if (this.miraHenry(j) < -COS45) return 2;
    return this.libre(this.pos, j.pos) ? 1 : 0;
  }
  alAlcance(p) {
    return dist3(this.pos, p) <= 400 && this.cosA(p) >= COS45 && this.libre(this.pos, p);
  }
  angosto() {
    const r = this.m.rayo;
    if (!r) return false;
    const p = [ this.pos[0], this.pos[1] - 100, this.pos[2] ];
    const pared = (dx, dz) => !!r(p, [ p[0] + dx, p[1], p[2] + dz ]);
    return pared(-240, 0) && pared(240, 0) || pared(0, -240) && pared(0, 240);
  }
  buscarBicho() {
    const lista = this.m.otros?.() || [];
    let mejor = null, dm = 1e3;
    for (const e of lista) {
      if (e === this || e.tipo === "KILLER" || e.cond === 10 || e.cond === 11 || e.intocable?.() || (e.hp ?? 1) <= 0) continue;
      const d = dist3(e.pos, this.pos);
      if (d < dm) {
        dm = d;
        mejor = e;
      }
    }
    this.w.bicho = mejor;
    return !!mejor;
  }
  buscarHenry(j) {
    if (!j.existe || j.estado === 10) return false;
    const d = dist3(this.pos, j.pos);
    if (d < 600) return true;
    return d <= 2e3 && this.cosA(j.pos) >= Math.cos(1.0472) && this.libre(this.pos, j.pos);
  }
  camino() {
    const w = this.w;
    if (typeof this.m.camino !== "function") {
      w.sinCamino = false;
      return w.objetivo;
    }
    const p = this.m.camino(this, w.objetivo);
    w.sinCamino = !p;
    return p || w.objetivo;
  }
  puntoAlAzar(escondido = false) {
    const j = this.jug();
    for (let k = 0; k < 100; k++) {
      const a = azar01() * PI2, r = 1e3 + azar01() * 2e3;
      const p = [ this.pos[0] + Math.sin(a) * r, this.pos[1], this.pos[2] + Math.cos(a) * r ];
      const y = this.m.piso?.(p, 200, 600);
      if (y == null) continue;
      p[1] = y;
      if (!this.libre(this.pos, p) && !escondido) continue;
      if (escondido && this.libre(j.pos, p)) continue;
      return p;
    }
    return [ this.pos[0] + Math.sin(this.rot) * 800, this.pos[1], this.pos[2] + Math.cos(this.rot) * 800 ];
  }
  tick() {
    this.posAnt = [ ...this.pos ];
    this.rotAnt = this.rot;
    const w = this.w, j = this.jug();
    w.reloj += DT;
    w.golpesT += DT;
    if (w.golpesT >= 1.6) {
      w.golpesT = 0;
      w.golpes = Math.max(0, w.golpes - 1);
    }
    this.revisarGolpes(j);
    const f = PASOS[this.paso];
    if (f) f.call(this, j);
    this.recuperar();
    this.motosierra(j);
    this.anim.avanzar();
    this.avance();
    const y = this.m.piso?.(this.pos);
    if (y != null && this.visible) this.pos[1] = y;
  }
  avance() {
    const n = this.anim.n;
    let v = 0;
    if (n === A.WALK) v = 400 * Math.abs(this.anim.vel); else if (n === A.RUN) v = (Math.abs(this.anim.vel) + 1) * 400; else if (n === A.BACK) v = -200;
    if (!v) return;
    const [fx, fz] = frente(this.rot);
    this.m.mover(this, fx * v * DT, fz * v * DT);
  }
  recuperar() {
    if (this.cond === 9 || this.cond === 10) return;
    const v = (this.param.recupera || 4) * DT;
    const lleno = this.aguante >= this.aguanteMax || this.aguante >= this.hp;
    if (this.cond === 11 || lleno && (this.anim.n === A.BAS0 || this.anim.n === A.BAS1)) this.sumarVida(v); else this.aguante = Math.min(this.aguanteMax, this.hp, this.aguante + v);
  }
  sumarVida(v) {
    this.hp = Math.min(this.hpMax, this.hp + v);
    this.aguante = Math.min(this.hp, this.aguanteMax);
  }
  revisarGolpes(j) {
    if (!this.golpes.length) return;
    const gs = this.golpes;
    this.golpes = [];
    for (const g of gs) {
      if (this.paso === P.DOWN) {
        this.danioEnElPiso(g);
        continue;
      }
      if (this.paso === P.DAMAGE || this.paso === P.WAIT || this.paso === P.NADA) continue;
      this.danio(g, j);
    }
  }
  danio(g, j) {
    const w = this.w;
    let d = g.danio ?? 10;
    if (g.bdt === 19) w.golpes = 0; else if (g.golpe === "BAK_PLAYER_WOOD_STICK") {
      w.golpes = 0;
      if (this.m.antorcha?.()) d *= 3;
    } else {
      w.golpes++;
      if (g.bdt === 0 || g.bdt === 1) d *= .5;
    }
    w.golpesT = 0;
    this.hp = Math.max(0, this.hp - d);
    this.aguante -= d;
    const sinAguante = this.aguante <= 0;
    const fuerte = [ 3, 5, 7, 9, 11, 13, 15, 17, 20 ].includes(g.bdt);
    let cae = w.golpes > GOLPES_TOPE[Math.max(0, Math.min(4, this.m.nivel ?? 1))];
    if (!cae) {
      if (g.bdt === 9 || g.bdt === 11) {
        const [fx, fz] = frente(this.rot), dd = g.dir ? g.dir[0] * fx + (g.dir[2] ?? g.dir[1] ?? 0) * fz : -1;
        cae = dd >= .5 || sinAguante;
      } else cae = g.bdt === 16 || sinAguante || fuerte;
    }
    w.dirGolpe = g.dir || null;
    w.golpeFuerte = fuerte;
    w.bdtGolpe = g.bdt;
    if (cae) {
      this.vozCaida(g);
      this.cambiar(P.DAMAGE);
      return;
    }
    this.sonidoGolpe(g);
  }
  animDanio(bdt, u) {
    let n = bdt === 1 ? 8 : [ 2, 4, 6, 10 ].includes(bdt) ? 10 : [ 3, 5, 7, 12, 14, 15, 16, 17 ].includes(bdt) ? 12 : [ 8, 11, 19, 20 ].includes(bdt) ? 14 : [ 9, 13, 18 ].includes(bdt) ? 16 : 6;
    if (n === 6 && this.m.etapa === 9) n = 8;
    return n + u;
  }
  sonidoGolpe(g) {
    const k = g.kind ?? -1;
    if ([ 42, 43, 44, 45, 73, 75, 76, 95, 106, 107, 109 ].includes(k)) return;
    this.sonido(k === 6 || k === 7 ? 40070 : k === 40 || k === 41 ? 40064 : 40058);
  }
  vozCaida(g) {
    const k = g.kind ?? -1;
    if ([ 42, 43, 44, 45, 73, 75, 76, 95, 106, 107, 109 ].includes(k)) return;
    if (k === 48) {
      this.sonido(60405);
      return;
    }
    const ebf0 = k < 4 || k > 71 || k === 6 || k === 7 || k === 34 || k === 35 || k >= 42 && k <= 51;
    this.sonido(ebf0 ? 60400 : 60405);
  }
  danioEnElPiso(g) {
    const w = this.w;
    this.hp = Math.max(0, this.hp - (g.danio ?? 10));
    if (this.hp <= 0) {
      this.ponerAnim(A.DEADU + w.caida);
      this.sub = 4;
      return;
    }
    if (this.sub !== 6) {
      w.t += azar01() * 3;
      return;
    }
    w.t = azar01() * 3 + 2;
    this.sub = 1;
  }
  armarGolpe(id, desde, hasta, alcance) {
    this.w.golpe = id;
    this.w.desde = desde;
    this.w.hasta = hasta;
    this.w.alcance = alcance;
  }
  probarGolpe(j) {
    const w = this.w;
    if (!w.golpe) return false;
    const f = this.anim.cuadro;
    if (f < w.desde || f > w.hasta) return false;
    if (j.estado === 10) return false;
    if (this.dJ(j) > w.alcance || this.cosA(j.pos) < .5 || Math.abs(j.pos[1] - this.pos[1]) > 300) return false;
    const [nom, dan] = GOLPE[w.golpe] || [ "BAK_KILLER_PIPE", 15 ];
    this.m.golpear(this, dan, nom, {
      desde: this.pos
    });
    w.golpe = 0;
    return true;
  }
  disparar(mano, id) {
    const w = this.w, j = this.jug();
    w.balas[mano] = Math.max(0, w.balas[mano] - 1);
    this.sonido(SON.TIRO);
    this.m.efecto?.(this, "fogonazo", {
      mano: mano
    });
    if (j.estado === 10 || !j.existe) return false;
    const d = this.dJ(j);
    let acierta = false;
    if (d < 400 && this.cosA(j.pos) > .5) acierta = true; else if (d <= 3e3) {
      const [fx, fz] = frente(this.rot), vx = j.pos[0] - this.pos[0], vz = j.pos[2] - this.pos[2], t = vx * fx + vz * fz;
      acierta = t > 0 && Math.abs(vx * fz - vz * fx) < 60;
    }
    if (acierta && !this.libre(this.pos, j.pos)) acierta = false;
    if (acierta) {
      const [nom, dan] = GOLPE[id];
      this.m.golpear(this, dan, nom, {
        desde: this.pos,
        tiro: true
      });
    }
    return acierta;
  }
  motosierra(j) {
    const w = this.w;
    if (!w.motor) return;
    w.motor.t -= DT;
    if (w.motor.t > 0) return;
    if (this.dJ(j) <= 250 && this.cosA(j.pos) >= .5 && j.estado !== 10) {
      const [nom, dan] = GOLPE[w.motor.id];
      this.m.golpear(this, dan, nom, {
        desde: this.pos
      });
      w.motor.t = .5;
    }
  }
  prenderMotor(id, son = SON.MOTOSIERRA) {
    this.w.motor = {
      id: id,
      t: 0
    };
    this.w.motorSon = this.m.sonido?.(this, son, true);
  }
  apagarMotor() {
    this.w.motor = null;
    this.m.sonido?.(this, null, true);
  }
  despuesDelGolpe(j) {
    if (this.armado() && !this.hayBalas()) return this.cambiar(P.ESCAPE);
    if (this.cosA(j.pos) < 0) return this.cambiar(P.INTERVAL);
    return this.cambiar(this.dJ(j) <= 400 ? P.BACKSTEP : P.DASH);
  }
}

const PASOS = [];

PASOS[P.INIT] = function(j) {
  if (this.tipoParam === 3 && j.pos[2] < 2600) {
    this.visible = false;
    this.paso = P.NADA;
    return;
  }
  this.cambiar(this.tipoParam === 3 ? P.CM : this.tipoParam === 4 ? P.CM2 : P.WANDER);
};

PASOS[P.WANDER] = function(j) {
  const w = this.w;
  if (this.sub === 0) {
    this.ponerAnim(A.WALK);
    this.cond = 1;
    w.bicho = null;
    this.sub = 1;
  }
  if (this.sub === 1) {
    w.objetivo = this.puntoAlAzar();
    if (this.cosA(w.objetivo) > 0 && azar01() < .1) return this.cambiar(P.RUN);
    this.sub = 2;
  }
  if (this.sub === 2) {
    this.girarHacia(this.camino(), R90);
    if (distXZ(this.pos, w.objetivo) < 400) this.sub = 1;
  }
  if (this.progreso() > .9 && !w.vuelta) {
    w.vuelta = true;
    if (this.buscarBicho()) return this.cambiar(P.CATTACK);
    if (this.buscarHenry(j)) return this.cambiar(P.APPROACH);
  } else if (this.progreso() < .5) w.vuelta = false;
};

PASOS[P.RUN] = function(j) {
  const w = this.w;
  switch (this.sub) {
   case 0:
    this.ponerAnim(A.WALK);
    this.cond = 1;
    w.t = 0;
    w.objetivo = this.puntoAlAzar();
    this.sub = 2;
    break;

   case 2:
    {
      w.t += DT;
      this.girarHacia(this.camino(), R90);
      if (distXZ(this.pos, w.objetivo) < 400) {
        if (w.t > 10) {
          this.ponerAnim(A.BAS1);
          this.sub = 3;
          w.t = azar01() * 5 + 1;
        } else if (w.t > 5) {
          this.ponerAnim(A.BAS0);
          this.sub = 3;
          w.t = azar01() * 5 + 1;
        } else {
          w.objetivo = this.puntoAlAzar();
        }
      }
      break;
    }

   case 3:
    w.t -= DT;
    if (w.t <= 0) {
      if (this.buscarBicho()) return this.cambiar(P.CATTACK);
      return this.cambiar(P.WANDER);
    }
    return;
  }
  if (this.anim.n === A.WALK && this.progreso() > .2) this.ponerAnim(A.RUN);
  if (this.anim.n === A.RUN && this.progreso() > .9 && this.buscarHenry(j)) this.cambiar(P.APPROACH);
};

PASOS[P.CATTACK] = function(j) {
  const w = this.w, e = w.bicho;
  const vivo = e && (e.hp ?? 1) > 0 && e.cond !== 10 && e.cond !== 11;
  let giro = 0;
  if (this.sub === 0) {
    this.ponerAnim(A.WALK);
    this.cond = 3;
    this.sub = 1;
  }
  if (this.sub === 1) {
    if (!vivo) return this.cambiar(P.WANDER);
    w.objetivo = [ ...e.pos ];
    giro = R90;
    if (this.progreso() > .8 && this.alAlcance(e.pos)) {
      this.cond = 5;
      if (this.tipoParam === 2) {
        this.ponerAnim(A.CHB1);
        this.prenderMotor(107);
        this.sub = 4;
      } else if (this.armado() || this.tipoParam === 1) {
        this.ponerAnim(A.GUNL1);
        w.mano = 1;
        this.sub = 6;
      } else {
        const b = azar01() >= .5;
        this.ponerAnim(b ? A.PIPEB : A.PIPEA);
        w.golpeBicho = b ? 105 : 104;
        this.sonido(SON.VOZ2);
        this.sub = 2;
      }
    }
  } else if (this.sub === 2 || this.sub === 4) {
    giro = R45;
    if (this.sub === 2 && w.golpeBicho && vivo && this.anim.cuadro >= (this.anim.n === A.PIPEA ? 30 : 78)) {
      if (dist3(e.pos, this.pos) < 300) this.m.golpearBicho?.(e, GOLPE[w.golpeBicho][1], GOLPE[w.golpeBicho][0]);
      w.golpeBicho = 0;
    }
    if (this.sub === 4 && this.anim.n === A.CHB1 && this.anim.fin) this.ponerAnim(A.CHB2);
    if (this.sub === 4 && vivo && (w.t2 -= DT) <= 0) {
      w.t2 = .5;
      if (dist3(e.pos, this.pos) < 300) this.m.golpearBicho?.(e, 12, "BAK_KILLER_CHAINSAW_SHAKE");
    }
    if (this.sub === 2 && this.quedan(.5) || this.sub === 4 && (!vivo || dist3(e.pos, this.pos) > 400)) {
      if (this.sub === 4) {
        this.apagarMotor();
        this.ponerAnim(A.CHB3);
        this.sonido(SON.MOTOSIERRA_FIN);
        this.sub = 5;
        return;
      }
      if (vivo && this.alAlcance(e.pos)) {
        this.sub = 1;
        return;
      }
      return this.cambiar(P.WANDER);
    }
  } else if (this.sub === 5) {
    giro = R45;
    if (this.quedan(.5)) return vivo ? void (this.sub = 0) : this.cambiar(P.WANDER);
  } else if (this.sub === 6) {
    giro = R30;
    if (this.anim.fin) {
      this.ponerAnim(A.GUNL3);
      this.disparoBicho(e);
      this.sub = 7;
    }
  } else if (this.sub === 7) {
    giro = .08726647;
    if (this.anim.fin) {
      if (!vivo || this.cosA(e.pos) < COS15 || !this.libre(this.pos, e.pos)) {
        this.ponerAnim(A.GUNL4);
        this.sub = 8;
        return;
      }
      if (azar(5) < this.w.balas[1]) {
        this.ponerAnim(A.GUNL3);
        this.disparoBicho(e);
      } else {
        this.ponerAnim(A.GUNL4);
        this.sub = 8;
      }
    }
  } else if (this.sub === 8) {
    giro = R30;
    if (this.quedan(.2)) return this.cambiar(vivo ? P.CATTACK : P.WANDER);
  }
  if (e && giro) this.girarHacia(e.pos, giro);
};

Killer.prototype.disparoBicho = function(e) {
  this.w.balas[1] = Math.max(0, this.w.balas[1] - 1);
  this.sonido(SON.TIRO);
  if (e && this.libre(this.pos, e.pos)) this.m.golpearBicho?.(e, 10, "BAK_KILLER_SHOOT");
};

PASOS[P.APPROACH] = function(j) {
  if (this.sub === 0) {
    this.ponerAnim(A.WALK);
    this.cond = 3;
    this.m.reiniciarCamino?.(this);
    this.sub = 1;
  }
  this.w.objetivo = [ ...j.pos ];
  this.girarHacia(this.camino(), R90);
  if (this.w.sinCamino) return this.cambiar(P.WANDER);
  if (this.muerto(j)) return this.cambiar(P.FINISH);
  if (this.hayBalas() && this.puedeTirar(j)) return this.cambiar(this.armado() ? P.RAPIDFIRE : P.READY);
  if (this.alAlcance(j.pos)) return this.cambiar(this.armado() ? P.RAPIDFIRE : P.ATTACK);
};

PASOS[P.READY] = function(j) {
  const w = this.w;
  switch (this.sub) {
   case 0:
    if (this.muerto(j)) return this.cambiar(P.FINISH);
    if (this.cosA(j.pos) >= COS15 && this.libre(this.pos, j.pos)) {
      if (w.balas[1] > w.balas[0]) {
        this.ponerAnim(A.GUNL1);
        w.mano = 1;
      } else if (w.balas[0] >= 1) {
        this.ponerAnim(A.GUNR1);
        w.mano = 0;
      } else return this.cambiar(P.ESCAPE);
      this.cond = 5;
      this.sub = 1;
      return;
    }
    return this.cambiar(P.DASH);

   case 1:
    this.girarHacia(j.pos, R30);
    if (this.anim.fin) {
      this.ponerAnim(w.mano ? A.GUNL2 : A.GUNR2);
      if (w.reloj > .1) this.sonido(SON.CARGA);
      w.t = 5;
      w.t2 = 0;
      w.dAnt = 0;
      this.sub = 2;
    }
    return;

   case 2:
    {
      const at = this.atacable(j);
      this.girarHacia(j.pos, R5);
      let tira = false;
      if (this.apuntado(j) === 1) {
        if (at && (w.golpes > 0 || (w.t2 += DT) > .5)) tira = true;
      }
      if (at && (this.m.etapa === 8 || this.m.etapa === 9)) tira = true;
      const d = this.dJ(j);
      if (d < w.dAnt && (w.t2 += DT) > .5 && at) tira = true;
      w.dAnt = d;
      if (tira) {
        this.sonido(SON.VOZ1);
        return this.cambiar(P.SHOOT);
      }
      w.t -= DT;
      if (w.t <= 0 || this.cosA(j.pos) < .5 || !this.libre(this.pos, j.pos) || this.henryPega(j)) {
        this.ponerAnim(w.mano ? A.GUNL4 : A.GUNR4);
        this.sub = 3;
      }
      return;
    }

   case 3:
    this.girarHacia(j.pos, R30);
    if (this.quedan(.2)) return this.cambiar(this.buscarBicho() ? P.CATTACK : P.DASH);
  }
};

PASOS[P.SHOOT] = function(j) {
  const w = this.w;
  switch (this.sub) {
   case 0:
    this.ponerAnim(w.mano ? A.GUNL3 : A.GUNR3);
    this.disparar(w.mano, 102);
    w.t = .1;
    this.sub = 1;
    return;

   case 1:
   case 2:
    w.t -= DT;
    if (w.t <= 0 && this.sub === 1) this.sub = 2;
    if (!this.anim.fin) return;
    if (this.cosA(j.pos) < COS15) {
      this.ponerAnim(w.mano ? A.GUNL4 : A.GUNR4);
      this.sub = 4;
      return;
    }
    if (this.libre(this.pos, j.pos)) {
      let r = this.angosto() ? 0 : azar(5);
      if (this.sub === 2 && (j.vida ?? 1) * 100 < azar01() * azar01() * 100) r = 999;
      if (w.balas[w.mano] <= r) {
        this.ponerAnim(w.mano ? A.GUNL4 : A.GUNR4);
        this.sub = 3;
        return;
      }
      this.sub = 0;
      return;
    }
    this.ponerAnim(w.mano ? A.GUNL4 : A.GUNR4);
    this.sub = 5;
    return;

   case 3:
   case 4:
   case 5:
    this.girarHacia(j.pos, R15);
    if (!this.quedan(.2)) return;
    if (this.muerto(j)) return this.cambiar(P.FINISH);
    return this.cambiar(this.sub === 3 ? P.ESCAPE : this.sub === 4 ? P.INTERVAL : P.WANDER);
  }
};

PASOS[P.RAPIDFIRE] = function(j) {
  const w = this.w;
  switch (this.sub) {
   case 0:
    if (w.balas[0] && w.balas[1]) {
      this.ponerAnim(A.GUNB1);
      this.cond = 5;
      this.sub = 1;
      return;
    }
    return this.cambiar(P.ESCAPE);

   case 1:
    this.girarHacia(j.pos, R30);
    if (this.anim.fin) {
      this.ponerAnim(A.GUNB2);
      w.t = 10;
      w.t2 = 0;
      w.dAnt = 0;
      this.sub = 2;
    }
    return;

   case 2:
    {
      this.girarHacia(j.pos, R5);
      const at = this.atacable(j);
      if (this.apuntado(j) === 1 && (this.aguante <= 0 || (w.t2 += DT) > .5) && at) {
        this.sub = 3;
        return;
      }
      const d = this.dJ(j);
      if (d < w.dAnt && (w.t2 += DT) > .5 && at) {
        this.sonido(SON.VOZ1);
        w.dAnt = d;
        this.sub = 3;
        return;
      }
      w.dAnt = d;
      if (this.cosA(j.pos) >= .5) {
        w.t -= DT;
        if (w.t > 0 && this.libre(this.pos, j.pos)) return;
      }
      this.ponerAnim(A.GUNB4);
      this.sub = 8;
      return;
    }

   case 3:
    this.ponerAnim(A.GUNB3);
    this.disparar(0, 103);
    w.t = .1;
    this.sub = 4;
    return;

   case 4:
    w.t -= DT;
    if (w.t <= 0) this.sub = 5;

   case 5:
    if (this.anim.cuadro >= 7) {
      this.disparar(1, 103);
      w.t = .1;
      this.sub = 6;
    }
    return;

   case 6:
    w.t -= DT;
    if (w.t <= 0) this.sub = 7;

   case 7:
    if (!this.anim.fin) return;
    if (w.balas[0] > 0 && w.balas[1] > 0 && this.cosA(j.pos) > COS15 && (j.vida ?? 1) * 100 < azar01() * azar01() * 100) {
      this.sub = 3;
      return;
    }
    this.ponerAnim(A.GUNB4);
    this.sub = 8;
    return;

   case 8:
    this.girarHacia(j.pos, R15);
    if (!this.anim.fin) return;
    if (this.muerto(j)) return this.cambiar(P.FINISH);
    if (w.balas[0] && w.balas[1]) return this.cambiar(this.libre(this.pos, j.pos) ? P.APPROACH : P.INTERVAL);
    return this.cambiar(P.ESCAPE);
  }
};

PASOS[P.ESCAPE] = function(j) {
  const w = this.w;
  switch (this.sub) {
   case 0:
    if (this.angosto() && this.conBalas()) return this.cambiar(P.APPROACH);
    this.ponerAnim(A.WALK);
    this.cond = 4;
    w.t = 0;
    w.t2 = 0;
    w.objetivo = this.puntoAlAzar(true);
    this.sub = 2;
    return;

   case 2:
    {
      w.t += DT;
      const lejos = distXZ(j.pos, w.objetivo) >= 600;
      if (lejos) {
        if (this.dJ(j) < 400) {
          w.t2 += DT;
          if (w.t2 >= 1 && this.conBalas()) {
            this.ponerAnim(A.WALK);
            this.sub = 4;
            return;
          }
        } else w.t2 = 0;
        this.girarHacia(this.camino(), R90);
        if (distXZ(this.pos, w.objetivo) < 400) {
          this.recargar();
          if (w.t <= 10 && !(this.dJ(j) > 2e3)) {
            this.ponerAnim(A.BAS0);
            this.sub = 3;
            w.t = azar01() * 5 + 1;
            return;
          }
          this.ponerAnim(w.t > 10 ? A.BAS1 : A.BAS0);
          this.sub = 3;
          w.t = azar01() * 5 + 1;
          return;
        }
      } else {
        w.objetivo = this.puntoAlAzar(true);
      }
      if (this.anim.n === A.WALK && this.progreso() > .2) this.ponerAnim(A.RUN);
      return;
    }

   case 3:
    w.t -= DT;
    if (w.t <= 0) this.cambiar(P.WANDER);
    return;

   case 4:
    this.girarHacia(j.pos, PI2);
    if (this.progreso() > .8 && this.cosA(j.pos) >= .5) return this.cambiar(this.armado() ? P.RAPIDFIRE : P.ATTACK);
  }
};

PASOS[P.DASH] = function(j) {
  if (this.sub === 0) {
    if (this.angosto()) return this.cambiar(P.APPROACH);
    if (this.armado()) return this.cambiar(P.ESCAPE);
    this.ponerAnim(A.WALK);
    this.cond = 3;
    this.sub = 1;
  }
  this.w.objetivo = [ ...j.pos ];
  this.girarHacia(this.camino(), PI2);
  if (this.progreso() > .8 && this.alAlcance(j.pos) && this.atacable(j)) return this.cambiar(P.ATTACK);
  if (this.anim.n === A.WALK && this.progreso() > .2) this.ponerAnim(A.RUN);
};

PASOS[P.ATTACK] = function(j) {
  const w = this.w;
  switch (this.sub) {
   case 0:
    this.cond = 5;
    if (this.tipoParam !== 2) {
      if (azar01() >= .5 || this.anim.n === A.RUN) {
        this.ponerAnim(A.PIPEB);
        this.armarGolpe(105, 78, 102, 230);
      } else {
        this.ponerAnim(A.PIPEA);
        this.armarGolpe(104, 30, 50, 230);
      }
      this.sonido(SON.VOZ2);
      this.sub = 1;
    } else {
      if (azar01() >= .5) {
        this.ponerAnim(A.CHB1);
        this.sub = 3;
        this.prenderMotor(107);
      } else {
        this.ponerAnim(A.CHA1);
        this.sub = 2;
        this.prenderMotor(106);
      }
      this.sonido(SON.VOZ2);
      w.t2 = 0;
    }
    break;

   case 1:
    if (this.anim.cuadro < w.desde && this.dJ(j) > 180) {
      const [fx, fz] = frente(this.rot);
      this.m.mover(this, fx * 300 * DT, fz * 300 * DT);
    }
    this.probarGolpe(j);
    if (this.quedan(.5)) {
      if (this.muerto(j)) return this.cambiar(P.FINISH);
      if (w.golpe && this.cosA(j.pos) < .5) {
        w.golpe = 0;
        return this.cambiar(P.APPROACH);
      }
      w.golpe = 0;
      return this.cambiar(P.READY);
    }
    break;

   case 2:
   case 3:
    if (this.anim.fin && (this.anim.n === A.CHA1 || this.anim.n === A.CHB1)) {
      this.ponerAnim(this.sub === 2 ? A.CHA2 : A.CHB2);
      if (w.motor) this.m.sonido?.(this, SON.MOTOSIERRA2, true);
    }
    if (this.dJ(j) > 400) {
      this.apagarMotor();
      this.ponerAnim(this.sub === 2 ? A.CHA3 : A.CHB3);
      this.sonido(SON.MOTOSIERRA_FIN);
      this.sub = 4;
    }
    break;

   case 4:
    if (this.anim.fin) return this.cambiar(P.READY);
    break;
  }
  this.girarHacia(j.pos, R45);
};

PASOS[P.INTERVAL] = function(j) {
  const w = this.w;
  if (this.sub === 0) {
    this.ponerAnim(A.RUN);
    this.cond = 2;
    w.t = 0;
    this.sub = 1;
  }
  if (this.sub === 1) {
    const [fx, fz] = frente(this.rot);
    this.girarHacia([ this.pos[0] + fx * 400, 0, this.pos[2] + fz * 400 ], R90);
    w.t += DT;
    if ((this.dJ(j) > 600 || w.t > 3) && this.progreso() > .9) {
      this.ponerAnim(A.WALK);
      this.sub = 2;
    }
    return;
  }
  this.girarHacia(j.pos, PI2);
  if (this.progreso() > .8) this.cambiar(this.armado() ? P.RAPIDFIRE : P.READY);
};

PASOS[P.BACKSTEP] = function(j) {
  if (this.sub === 0) {
    this.cond = 4;
    if (this.cosA(j.pos) < 0) return this.cambiar(P.ESCAPE);
    this.ponerAnim(A.BACK);
    this.sub = 1;
    return;
  }
  if (this.quedan(.2)) this.cambiar(this.armado() ? P.RAPIDFIRE : P.READY);
};

PASOS[P.DAMAGE] = function(j) {
  const w = this.w;
  switch (this.sub) {
   case 0:
    {
      this.cond = 9;
      this.apagarMotor();
      w.golpe = 0;
      const [fx, fz] = frente(this.rot), g = w.dirGolpe;
      const atras = g ? g[0] * fx + (g[2] ?? g[1] ?? 0) * fz > 0 : false;
      w.caida = atras ? 1 : 0;
      if (this.hp <= 0 && w.golpeFuerte) {
        w.caida = 0;
        this.ponerAnim(A.XXG);
        this.sub = 3;
        return;
      }
      this.ponerAnim(this.animDanio(w.bdtGolpe, atras ? 1 : 0));
      w.golpes = 0;
      this.sub = this.aguante <= 0 ? 2 : 1;
      return;
    }

   case 1:
    if (this.progreso() >= .8) this.despuesDelGolpe(j);
    return;

   case 2:
    if (this.progreso() >= .5) {
      this.ponerAnim(A.XXU + w.caida);
      this.sub = 3;
    }
    return;

   case 3:
    if (this.anim.fin) this.cambiar(P.DOWN);
    return;
  }
};

PASOS[P.DOWN] = function(j) {
  const w = this.w;
  switch (this.sub) {
   case 0:
    this.cond = 10;
    this.apagarMotor();
    w.t = this.aguante > 0 ? azar01() : this.hp > 0 ? (azar01() + 1) * 5 : (azar01() + 1) * 30;
    this.sub = 1;
    return;

   case 1:
    w.t -= DT;
    if (w.t <= 0) {
      if (!this.henryPega(j)) {
        this.ponerAnim(A.UPU + w.caida);
        this.cond = 8;
        this.sub = 3;
      } else {
        this.sumarVida(10);
        this.ponerAnim(A.ROTU + w.caida);
        this.sub = 2;
      }
      return;
    }
    if (this.anim.fin && this.anim.n !== A.DNTU + w.caida) this.ponerAnim(A.DNTU + w.caida);
    return;

   case 2:
    if (!this.anim.fin) return;
    if (this.henryPega(j)) {
      if (azar01() < .5) {
        this.sumarVida(10);
        this.anim.poner(this.anim.n, {
          desde: 0
        });
        return;
      }
      w.t = azar01() * 2 + 1;
      this.ponerAnim(A.DNTU + w.caida);
      this.sub = 1;
      return;
    }
    this.ponerAnim(A.UPU + w.caida);
    this.cond = 8;
    this.sub = 3;
    return;

   case 3:
    if (this.quedan(.5)) {
      this.sumarVida(10);
      this.despuesDelGolpe(j);
    }
    return;

   case 4:
    if (this.anim.fin) {
      this.cond = 11;
      this.sub = 5;
    }
    return;

   case 5:
    if (this.hp >= this.hpMax) {
      this.cond = 10;
      this.ponerAnim(A.ROTU + w.caida);
      this.sub = 6;
    }
    return;

   case 6:
    if (this.anim.fin) {
      this.ponerAnim(A.UPU + w.caida);
      this.cond = 8;
      this.sub = 3;
    }
    return;
  }
};

PASOS[P.FINISH] = function(j) {
  const w = this.w;
  switch (this.sub) {
   case 0:
    this.cond = 3;
    this.ponerAnim(A.WALK);
    this.sonido(SON.VOZ1);
    w.t = 2;
    this.sub = 1;

   case 1:
   case 2:
    w.objetivo = [ ...j.pos ];
    this.girarHacia(this.camino(), R90);
    if (this.progreso() > .5) this.sub = 2;
    if (this.sub === 2 && this.puedeTirar(j)) {
      if (!this.armado()) {
        this.ponerAnim(A.GUNL1);
        w.mano = 1;
        this.sub = 3;
      } else {
        this.ponerAnim(A.GUNB1);
        this.sub = 4;
      }
    }
    break;

   case 3:
    if (this.anim.fin) {
      this.recargar();
      this.ponerAnim(A.GUNL3);
      this.disparar(1, 102);
    }
    break;

   case 4:
    if (this.anim.fin) {
      this.recargar();
      this.ponerAnim(A.GUNB3);
      this.disparar(0, 103);
      this.sub = 5;
    }
    break;

   case 5:
    if (this.anim.cuadro > 6) {
      this.disparar(1, 103);
      this.sub = 4;
      this.ponerAnim(A.GUNB2);
    }
    break;
  }
  if (this.sub > 2) this.girarHacia(j.pos, R15);
  w.t -= DT;
  if (w.t <= 0) {
    this.sonido(azar01() >= .5 ? SON.VOZ2 : SON.VOZ1);
    w.t = azar01() + 2;
  }
};

PASOS[P.CM] = PASOS[P.CM2] = function(j) {
  const w = this.w, d = this.dJ(j), libre = this.libre(this.pos, j.pos);
  switch (this.sub) {
   case 0:
    this.cond = 1;
    this.ponerAnim(A.NT);
    this.sub = 1;
    return;

   case 1:
    if (d < 2e3 && libre) {
      this.sonido(SON.VOZ2);
      this.cond = 2;
      this.ponerAnim(A.GUNB1);
      this.sub = 2;
    }
    return;

   case 2:
    this.girarHacia(j.pos, R30);
    if (this.anim.fin) {
      this.ponerAnim(A.GUNB2);
      this.sonido(SON.CARGA);
      w.t = this.m.etapa === 11 ? azar01() + 1 : 0;
      this.sub = 3;
    }
    return;

   case 3:
    this.girarHacia(j.pos, R5);
    w.t -= DT;
    if (w.t <= 0 && this.atacable(j)) {
      w.tiros = 0;
      this.sub = 4;
      return;
    }
    if (!libre || d > 2e3) {
      this.sub = 9;
      return;
    }
    if (this.henryPega(j)) w.t = azar01() + 2;
    return;

   case 4:
    this.cond = 5;
    this.ponerAnim(A.GUNB3);
    this.disparar(0, 103);
    w.t = .1;
    this.sub = 5;
    return;

   case 5:
    if (this.anim.cuadro > 6) {
      this.disparar(1, 103);
      this.sub = 7;
    }
    return;

   case 7:
   case 8:
    if (!this.anim.fin) return;
    if (this.muerto(j)) {
      this.sonido(SON.VOZ2);
      w.t = 2;
      this.sub = 11;
      return;
    }
    if (libre) {
      w.tiros++;
      if (w.tiros < Math.round(azar01() * 4 - .49) + 2) {
        this.sub = 4;
        return;
      }
      this.sonido(SON.VOZ1);
      this.cond = 2;
      this.ponerAnim(A.GUNB2);
      this.recargar();
      w.t = azar01() + 2;
      this.sub = 3;
      return;
    }
    this.sub = 9;
    return;

   case 9:
    this.ponerAnim(A.GUNB4);
    this.sub = 10;
    return;

   case 10:
    if (this.anim.fin) this.sub = 0;
    return;

   case 11:
    w.t -= DT;
    if (w.t <= 0) {
      this.cambiar(P.FINISH);
      this.sub = 4;
    }
    return;
  }
};

PASOS[P.WAIT] = function(j) {
  const w = this.w;
  switch (this.sub) {
   case 0:
    this.cond = 13;
    this.visible = false;
    this.sub = this.m.bandera?.(541) ? 3 : 1;
    return;

   case 1:
    if (this.m.bandera?.(541)) {
      w.t = 5;
      this.sub = 2;
    }
    return;

   case 2:
    w.t -= DT;
    if (w.t <= 0) this.sub = 3;
    return;

   case 3:
    if (distXZ(j.pos, this.def.pos) > 1e3) {
      this.pos = [ ...this.def.pos ];
      this.visible = true;
      this.cond = 1;
      this.sonido(SON.PUERTA_ABRE);
      w.t = 1;
      this.sub = 4;
    }
    return;

   case 4:
    w.t -= DT;
    if (w.t <= 0) {
      this.sonido(SON.PUERTA_CIERRA);
      this.cambiar(P.APPROACH);
    }
    return;
  }
};

PASOS[P.EVENT] = function() {
  this.cond = 5;
  this.ponerAnim(A.GUNL1);
  this.w.mano = 1;
  this.anim.poner(A.GUNL1, {
    desde: -1
  });
  this.paso = P.READY;
  this.sub = 1;
};

export const binKiller = () => "enemy_killer.bin";

export async function armasKiller(e, {bin: bin, crearPersonaje: crearPersonaje, leerModelo: leerModelo, leerTexturas: leerTexturas}) {
  for (let k = 0; k < 2; k++) {
    const item = e.armas[k], M = MODELO_ARMA[item];
    if (!M) continue;
    try {
      const b = await bin(M.bin);
      let pm, pt;
      if (M.m != null) {
        pm = b.modelos[M.m];
        pt = b.texs[M.t];
      } else {
        pm = b.p[M.parte];
        pt = b.p[M.tparte];
      }
      if (!pm) continue;
      const a = crearPersonaje(leerModelo(b.b, pm.ofs, pm.len), pt ? leerTexturas(b.b, pt.ofs, pt.len) : []);
      const c = a.contenedor;
      c.rotation.set(0, 0, 0);
      c.scale.setScalar(1);
      c.position.set(0, 0, 0);
      e.pj.huesos[HUESO_MANO[k]]?.add(c);
    } catch (err) {
      console.warn("arma de Walter", item, err.message);
    }
  }
}

export const sinKiller = def => [ 7, 8 ].includes((def.estado_inicial ?? def.ini ?? 0) & 15);
