// SH4 web — FeniXVOID · Project Ravenlight
import { DT, envolver, rumboHacia, frente, dist3, distXZ, girarY, azar01 } from "./comun.js";

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
  DIE: 22
};

const BIN = Array.from({
  length: 23
}, (_, k) => k === 0 ? 0 : k + 4);

export const NOMBRES_ANIM_JEFE = Array.from({
  length: 27
}, (_, i) => Object.keys(A)[BIN.indexOf(i)] || "?" + (i + 3));

export const P = {
  APPEAR: 0,
  UPDOWN: 1,
  ATTACK: 2,
  DAMAGE: 3,
  DOWN: 4,
  DEAD: 5,
  DAMAGENT: 6,
  DOWNNT: 7,
  EVENT: 8
};

export const NOMBRE_PASO = [ "Appear", "UpDown", "Attack", "Damage", "Down", "Dead", "DamageNT", "DownNT", "Event" ];

export const binJefe = () => "enemy_kabe_boss.bin";

export const esJefe = def => def?.enemigo === "WALLMAN" && ((def.estado_inicial ?? def.ini ?? 0) & 15) === 8;

const C = {
  NORMAL: 1,
  CAUTION: 2,
  BATTLE: 5,
  DAMAGE: 9,
  DEAD: 11,
  EVENT: 18
};

const CICLO = [ 16, 14, 12, 10, 8 ];

const ESTANCIA = [ 5, 4, 3, 2, 2 ];

const BASE = -80, ALTURA = 1600;

const TOPE_CAIDO = -1680;

const ABAJO = -400;

const ALCANCE = 600;

const DESAPARECE = -2e3;

const ESCALA = 2;

const RADIO = 100;

const RADIO_ATAQUE = 200;

const ATAQUE = {
  [A.ATT1]: [ 16, "BAK_KABE_SIDEBLOW", 0, 100 ],
  [A.ATT2]: [ 20, "BAK_KABE_BRINGDOWN", 0, 80 ],
  [A.ATT3]: [ 11, "BAK_KABE_HEADBUTT", 1, 50 ],
  [A.ATT4]: [ 16, "BAK_KABE_BRINGDOWN", 2, 80 ],
  [A.ATT5]: [ 20, "BAK_KABE_STRIKE", 2, 50 ]
};

const SON = {
  ATAQUE: 60302,
  DANIO: 60303,
  DANIO_CONT: 60305,
  LLEGA: 60304,
  MUERE: 60301
};

const ST = {
  DAMAGE: 6,
  EVENT: 7,
  GODMODE: 9,
  DEAD: 10
};

const LEJOS = 17014118e31;

const compartido = new WeakMap;

const banderaReal = (m, n) => !!(m.bandera && m.bandera(n) && !m.bandera(32767));

function estadoDe(m) {
  let s = compartido.get(m);
  if (!s) {
    s = nuevoEstado();
    compartido.set(m, s);
  }
  return s;
}

function nuevoEstado() {
  return {
    lista: [],
    verdadero: null,
    timer: 0,
    timer2: 0,
    timer3: azar01() * 10 + 20,
    reverso: 0,
    animDanio: 0,
    avisos: [],
    reloj: 0
  };
}

export class KabeJefe {
  constructor(def, pj, anim, m) {
    this.tipo = "WALLMAN_JEFE";
    this.def = def;
    this.pj = pj;
    this.anim = anim;
    this.m = m;
    try {
      pj?.grupo?.scale?.setScalar?.(ESCALA);
    } catch {}
    this.param = m.parametros?.("WALLMAN", 2) || {
      vida: 200,
      aguante: 70,
      velocidad2: 8,
      ataque1: 12,
      ataque2: 8
    };
    this.hp = this.hpMax = this.param.vida;
    this.aguante = this.aguanteMax = this.param.aguante;
    this.pos = [ ...def.pos ];
    this.rot = def.rumbo || 0;
    this.posAnt = [ ...this.pos ];
    this.rotAnt = this.rot;
    this.radio = RADIO * ESCALA;
    this.alto = 280 * ESCALA;
    this.centroAlto = 245 * ESCALA;
    this.sinPasos = true;
    this.cond = C.NORMAL;
    this.paso = P.APPEAR;
    this.sub = 0;
    this.animId = -1;
    this.visible = true;
    this.opacidad = 1;
    this.borrado = false;
    this.w = {
      timer: 0,
      id: 0,
      enAtaque: 0,
      golpeo: false,
      aterrizo: 0,
      cuadros: 0,
      sonCont: -99
    };
    this.golpes = [];
    this.eventos = [];
    this.revisaDanio = false;
    this.centro = [ this.pos[0], this.pos[1] - this.centroAlto, this.pos[2] ];
    const s = estadoDe(m);
    if (s.lista.some(k => k.w.cuadros > 0)) {
      compartido.set(m, nuevoEstado());
    }
    this.comp = estadoDe(m);
    this.w.id = this.comp.lista.length;
    this.comp.lista.push(this);
    this.comp.verdadero = this.elegirVerdadero();
    this.ponerAnim(A.NT);
    if (banderaReal(m, 1857)) {
      if (this.w.id === 0) {
        this.comp.verdadero = this;
        this.cond = C.DEAD;
        this.pos[1] = DESAPARECE;
        this.pasoA(P.EVENT);
      } else {
        this.borrado = true;
        this.cond = C.DEAD;
        this.visible = false;
      }
    }
  }
  get esVerdadero() {
    return this.comp.verdadero === this;
  }
  caido() {
    return this.paso === P.DOWN || this.paso === P.DOWNNT || this.paso === P.DAMAGE && this.sub === 2;
  }
  persigue() {
    return !this.borrado && this.paso !== P.DEAD && this.paso !== P.EVENT;
  }
  activo() {
    return this.pos[1] > -480 && (1 - (BASE - this.pos[1]) * .0025) * 100 >= 20;
  }
  intocable() {
    return this.borrado || this.cond === C.DEAD || this.paso === P.EVENT || !this.activo();
  }
  get radioGolpe() {
    return this.activo() ? RADIO * ESCALA : 0;
  }
  get sinSangre() {
    return false;
  }
  recibir(g) {
    if (!this.intocable()) this.golpes.push(g);
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
  sonido(id) {
    this.m.sonido?.(this, id);
  }
  distXZJugador() {
    const j = this.jugador();
    return j.existe ? distXZ(this.pos, j.pos) : LEJOS;
  }
  jugadorAtacable() {
    const j = this.jugador();
    if (!j.existe || [ ST.DAMAGE, ST.EVENT, ST.GODMODE, ST.DEAD ].includes(j.estado)) return false;
    return (this.m.relojAtaque?.() ?? this.comp.reloj) >= 5;
  }
  anguloObjetivo() {
    const j = this.jugador();
    return j.existe ? envolver(rumboHacia(j.pos, this.pos) - this.rot) : 0;
  }
  elegirVerdadero() {
    const vivos = this.comp.lista.filter(k => k.cond !== C.DEAD);
    if (!vivos.length) return null;
    const k = Math.max(0, Math.min(vivos.length - 1, Math.round(azar01() * this.comp.lista.length - .49)));
    return vivos[k];
  }
  velocidad() {
    const l = this.lv();
    return 3200 / (CICLO[l] - ESTANCIA[l] * 3);
  }
  alturaObjetivo() {
    const l = this.lv(), cyc = CICLO[l], st = ESTANCIA[l], N = Math.max(1, this.comp.lista.length);
    let f = this.w.id * cyc / N + this.comp.timer;
    while (f >= cyc) f -= cyc;
    while (f < 0) f += cyc;
    if (f < st) return BASE;
    f -= st;
    const L = cyc - st;
    if (f >= L * .5) f = L - f;
    f += f;
    const L2 = L - (st + st);
    if (f > L2) {
      const g = (f - L2) * 15;
      return BASE - ((g - (g + 1) * (.5 / st) * g * (1 / 30)) / L2 * (1 / 30) + 1) * ALTURA;
    }
    return BASE - f / L2 * ALTURA;
  }
  moverColumna() {
    const t = this.alturaObjetivo(), v = this.velocidad() * DT, d = t - this.pos[1];
    this.pos[1] += Math.max(-v, Math.min(v, d));
    return t;
  }
  llego() {
    const t = this.moverColumna();
    return Math.abs(t - this.pos[1]) < 2 * this.velocidad() * DT;
  }
  columna() {
    const t = this.moverColumna(), w = this.w;
    if (t - this.pos[1] >= 0) {
      if (t - this.pos[1] === 0 && t >= BASE && !w.aterrizo) {
        this.sonido(SON.LLEGA);
        w.aterrizo = 1;
      }
    } else if (this.pos[1] < ABAJO) w.aterrizo = 0;
  }
  avanzarReloj() {
    if (!this.esVerdadero) return;
    const s = this.comp, l = this.lv(), cyc = CICLO[l], st2 = ESTANCIA[l] * 2;
    let d = s.reverso ? -DT : DT;
    s.timer2 -= DT;
    if (s.timer2 > 0) d *= 1 - 2 / st2 * s.timer2;
    s.timer += d;
    while (s.timer >= cyc) s.timer -= cyc;
    while (s.timer < 0) s.timer += cyc;
    s.timer3 -= DT;
    if (s.timer3 <= 0) {
      s.reverso ^= 1;
      s.timer3 = azar01() * 25 + 5;
      s.timer2 = st2;
    }
  }
  revisarVerdadero() {
    if (this.esVerdadero) return 0;
    const a = this.comp.avisos.find(x => x.t >= 0 && !x.vistos.has(this));
    if (!a) return 0;
    a.vistos.add(this);
    if (a.tipo === 3) {
      this.pasoA(P.DAMAGENT);
      return 1;
    }
    if (a.tipo === 4) {
      this.pasoA(P.DOWNNT);
      return 2;
    }
    return 0;
  }
  hueso(i) {
    const r = this.pj?.reproductor;
    try {
      if (r.anim !== this.anim.anim) r.poner(this.anim.anim);
      r.t = this.anim.t;
      r.loop = this.anim.loop;
      const pose = r.avanzar(0);
      const g = girarY([ pose.absPos[i * 3] * ESCALA, pose.absPos[i * 3 + 1] * ESCALA, pose.absPos[i * 3 + 2] * ESCALA ], this.rot);
      if (!g.every(Number.isFinite)) throw new Error("pose");
      return [ this.pos[0] + g[0], this.pos[1] + g[1], this.pos[2] + g[2] ];
    } catch {
      const g = girarY([ 0, -245 * ESCALA, 60 * ESCALA ], this.rot);
      return [ this.pos[0] + g[0], this.pos[1] + g[1], this.pos[2] + g[2] ];
    }
  }
  ponerAnim(id, op) {
    this.anim.poner(BIN[id] ?? 0, op);
    this.animId = id;
  }
  terminada() {
    return this.anim.n < 0 || this.anim.fin || this.anim.loop && this.anim.vuelta;
  }
  terminaPronto(s = .5) {
    if (this.anim.n < 0) return true;
    const v = this.anim.vel, n = Math.round(Math.abs(v) * s * 30 - .49), c = this.anim.cuadro;
    return v >= 0 ? this.anim.dur - n <= c : c <= n;
  }
  animSet(id) {
    if (id === A.DIE || id >= 1 && id <= 11 || id === A.DDM) this.ponerAnim(id); else if (id >= A.ATT1 && id <= A.ATT5) this.ponerAnim(id); else if (id === A.ROD) {
      if (this.animId !== id) this.ponerAnim(id);
    } else if (this.animId !== id) this.ponerAnim(id);
    if (id >= 1 && id <= 6) this.anim.velocidad(.9 + azar01() * .2); else this.anim.velocidad(1);
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
      c: () => this.golpes.some(g => g.danio > 0),
      p: P.DAMAGE
    });
  }
  alDanioAdicional() {
    this.revisaDanio = true;
    this.eventos.push({
      c: () => this.golpes.some(g => g.danio > 0),
      f: () => this.danioEnElPiso()
    });
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
    if (this.borrado) {
      this.visible = false;
      this.golpes.length = 0;
      return;
    }
    if (this.m.bandera && !this.m.bandera(32767) && !this.m.bandera(1858)) {
      this.golpes.length = 0;
      return;
    }
    w.cuadros++;
    if (s.lista.find(k => !k.borrado) === this) {
      s.reloj += DT;
      for (const a of s.avisos) a.t -= DT;
      s.avisos = s.avisos.filter(a => a.t >= 0);
    }
    if (w.enAtaque && this.paso !== P.ATTACK) {
      w.enAtaque = 0;
      w.golpeo = false;
    }
    switch (this.paso) {
     case P.APPEAR:
      this.controlAppear();
      break;

     case P.UPDOWN:
      this.controlUpDown();
      break;

     case P.ATTACK:
      this.controlAttack();
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

     case P.DAMAGENT:
      this.controlDamageNT();
      break;

     case P.DOWNNT:
      this.controlDownNT();
      break;

     case P.EVENT:
      this.controlEvent();
      break;
    }
    this.recuperar();
    if (this.anim.n >= 0) this.anim.avanzar();
    this.procesarEventos();
    if (this.paso !== P.EVENT && !this.borrado) this.centro = this.hueso(2);
    this.visible = !this.borrado && this.paso !== P.EVENT;
  }
  recuperar() {
    if (this.cond === C.DAMAGE || this.cond === C.DEAD) return;
    const r = this.param.recupera ?? 1;
    this.aguante = Math.min(this.aguanteMax, Math.max(this.aguante, Math.min(this.hp, this.aguante + r * DT)));
  }
  controlAppear() {
    if (this.sub === 0) {
      this.cond = C.NORMAL;
      this.animSet(A.NT);
      this.sub = 1;
    }
    if (this.llego()) this.pasoA(P.UPDOWN);
    this.alDanio();
    this.avanzarReloj();
  }
  controlUpDown() {
    if (this.sub === 0) {
      this.cond = C.CAUTION;
      this.animSet(A.NT);
      this.sub = 1;
    } else if (this.sub === 1) {
      if (this.pos[1] > ABAJO && this.distXZJugador() < ALCANCE && this.jugadorAtacable()) this.pasoA(P.ATTACK);
    }
    this.alDanio();
    this.avanzarReloj();
    this.columna();
    this.revisarVerdadero();
  }
  elegirAtaque() {
    const a = this.anguloObjetivo(), r = azar01(), d15 = .2617994;
    if (Math.abs(a) >= d15) {
      if (a >= 0) return r < .7 ? A.ATT5 : r < .9 ? A.ATT2 : A.ATT1;
      return r < .8 ? A.ATT1 : A.ATT4;
    }
    return r < .5 ? A.ATT3 : r < .8 ? A.ATT4 : r < .9 ? A.ATT1 : A.ATT2;
  }
  controlAttack() {
    const w = this.w;
    if (this.sub === 0) {
      this.cond = C.BATTLE;
      this.animSet(this.elegirAtaque());
      this.sonido(SON.ATAQUE);
      w.golpeo = false;
      this.sub = 1;
    } else if (this.sub > 0 && this.sub < 3) {
      if (this.terminaPronto(this.animId > A.ATT3 ? .2 : .5)) {
        if (this.pos[1] <= ABAJO || this.distXZJugador() >= ALCANCE || !this.jugadorAtacable()) this.pasoA(P.UPDOWN); else this.sub = 0;
      }
    }
    this.alDanio();
    this.avanzarReloj();
    this.columna();
    this.revisarVerdadero();
    if (this.paso === P.ATTACK && this.sub === 1) {
      const at = ATAQUE[this.animId], c = this.anim.cuadro;
      if (at && c > 12 && c < 30) {
        w.enAtaque = 1;
        if (!w.golpeo) {
          const p = this.hueso(at[0]), j = this.jugador();
          if (j.existe && distXZ(p, j.pos) <= RADIO_ATAQUE + (this.m.radioJugador ?? 40) && p[1] <= j.pos[1] + RADIO_ATAQUE && p[1] >= j.pos[1] - 360 - RADIO_ATAQUE) {
            const k = at[2], col = [ this.param.velocidad2, this.param.ataque1, this.param.ataque2 ][k];
            const danio = col > 0 ? col : 10;
            this.m.golpear?.(this, danio, at[1], {
              shock: at[3],
              dir: frente(rumboHacia(j.pos, p)),
              pos: p
            });
            w.golpeo = true;
            w.enAtaque = 0;
            this.sub = 2;
          }
        }
      } else if (w.enAtaque) w.enAtaque = 0;
    }
  }
  tomarGolpe() {
    if (!this.golpes.length) return {
      danio: 0,
      bdt: 22,
      golpe: ""
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
  quitar(d) {
    this.hp -= d;
    if (this.hp <= 0) {
      this.hp = 0;
      this.aguante = 0;
      return;
    }
    this.aguante = Math.max(0, this.aguante - d);
  }
  sonidoDanio(g) {
    if (/STUNGUN|SPRAY|CHAINSAW/.test(String(g.golpe || ""))) {
      if (this.w.cuadros - this.w.sonCont < 30) return;
      this.w.sonCont = this.w.cuadros;
      this.sonido(SON.DANIO_CONT);
    } else this.sonido(SON.DANIO);
  }
  animDanio(g) {
    const t = g.bdt ?? 22, abajo = this.aguante <= 0, v = this.esVerdadero;
    let r;
    if (t === 19 || t === 20) r = 2; else if ([ 1, 13, 15, 16, 17 ].includes(t)) r = v && !abajo ? 0 : 1; else r = abajo ? 1 : 0;
    let a;
    switch (t) {
     case 0:
      a = r ? A.XXG1 : A.DMP1;
      break;

     case 4:
     case 6:
     case 12:
     case 14:
      a = r ? A.XXP2 : A.DMP3;
      break;

     case 5:
     case 7:
      a = r ? A.XXS1 : A.DMS1;
      break;

     case 10:
      a = r ? A.XXP1 : A.DMP2;
      break;

     case 11:
      a = r ? A.XXS1 : A.DMS2;
      break;

     case 13:
     case 15:
     case 17:
      a = r ? A.XXG1 : A.DMP3;
      break;

     case 16:
      a = r ? A.XXG2 : A.DMP3;
      break;

     case 18:
      a = r ? A.XXP1 : A.DMS2;
      break;

     case 19:
     case 20:
      a = A.XXC1;
      break;

     default:
      a = r ? A.XXP1 : [ 1, 3, 5, 7, 9, 11 ].includes(t) ? A.DMP2 : A.DMH1;
    }
    this.animSet(a);
    return r;
  }
  controlDamage() {
    const w = this.w, s = this.comp;
    switch (this.sub) {
     case 0:
      {
        this.cond = C.DAMAGE;
        const g = this.tomarGolpe();
        this.sonidoDanio(g);
        const v = this.esVerdadero;
        this.quitar(v ? g.danio * .5 : g.danio);
        if (v) this.aguante = Math.min(this.aguanteMax, this.hp);
        this.sub = this.animDanio(g) + 1;
        if (v) {
          s.animDanio = this.animId;
          if (this.hp > 0) s.avisos.push({
            tipo: 3,
            t: DT * 1.01,
            vistos: new Set
          }); else s.avisos.push({
            tipo: 4,
            t: 10,
            vistos: new Set
          });
          if (this.sub === 1) this.sub = 4;
        }
        w.timer = 0;
        break;
      }

     case 1:
      this.alTerminar(P.APPEAR);
      break;

     case 2:
      this.alTerminar(P.DOWN);
      break;

     case 3:
      w.timer += DT;
      if (w.timer >= .5) {
        if (this.esVerdadero) {
          if (this.hp > 0) {
            this.pasoA(P.APPEAR);
            break;
          }
          s.animDanio = A.XXC2;
        }
        this.animSet(A.XXC2);
        this.sub = 2;
      }
      break;

     case 4:
      this.alCasiTerminar(P.APPEAR);
      break;
    }
    if (this.sub !== 2) this.alDanio();
    this.revisarVerdadero();
  }
  controlDown() {
    const w = this.w;
    switch (this.sub) {
     case 0:
      if (this.hp <= 0) {
        if (this.esVerdadero) {
          this.comp.muerto = true;
          this.m.prenderBandera?.(1857);
        }
        this.pasoA(P.DEAD);
        this.m.contarMuerte?.(this);
        return;
      }
      this.cond = C.DAMAGE;
      w.timer = (azar01() + 1) * 10;
      this.sub = 1;
      break;

     case 1:
      w.timer -= DT;
      if (w.timer <= 0) {
        this.animSet(A.UPU);
        this.sub = 2;
      }
      break;

     case 2:
      this.eventos.push({
        c: () => this.terminada(),
        f: () => this.revivir()
      });
      break;

     case 3:
      w.timer -= DT;
      if (w.timer <= 0) {
        this.animSet(A.UPU);
        this.sub = 2;
      }
      if (this.animId === A.DDM && this.terminada() && this.animId !== A.ROD) this.animSet(A.ROD);
      break;

     case 4:
      this.alTerminar(P.DEAD);
      return;
    }
    this.revisarVerdadero();
    if (this.sub === 2) this.llego(); else {
      this.alDanioAdicional();
      if (this.sub === 1 && this.pos[1] > TOPE_CAIDO) this.pos[1] = Math.max(TOPE_CAIDO, this.pos[1] - this.velocidad() * DT);
    }
  }
  revivir() {
    this.hp = Math.min(this.hpMax, this.hp + this.hpMax * .5);
    this.aguante = Math.min(this.hp, this.aguanteMax);
    this.pasoA(P.APPEAR);
  }
  danioEnElPiso() {
    const g = this.tomarGolpe();
    this.quitar(g.danio);
    this.sonidoDanio(g);
    if (this.hp <= 0) {
      this.animSet(A.DIE);
      this.paso = P.DOWN;
      this.sub = 4;
      return;
    }
    this.animSet(A.DDM);
    this.w.timer += azar01();
    this.paso = P.DOWN;
    this.sub = 3;
  }
  controlDead() {
    if (this.sub === 0) {
      this.cond = C.DEAD;
      this.sonido(SON.MUERE);
      this.sub = 1;
    }
    this.pos[1] -= this.velocidad() * DT;
    if (this.pos[1] < DESAPARECE) {
      if (this.esVerdadero) {
        this.pasoA(P.EVENT);
        return;
      }
      this.borrado = true;
      this.visible = false;
    }
  }
  controlDamageNT() {
    const s = this.comp;
    switch (this.sub) {
     case 0:
      {
        this.cond = C.DAMAGE;
        const a = s.animDanio;
        this.animSet(a);
        if (a >= 1 && a <= 6) this.sub = 1; else if (a >= 7 && a <= 11 || a === A.XXC2 || a === A.DDM || a === A.DIE) this.sub = 2; else this.sub = 3;
        break;
      }

     case 1:
      this.alTerminar(P.APPEAR);
      break;

     case 2:
      this.alTerminar(P.DOWNNT);
      break;

     case 3:
      if (s.verdadero?.animId !== A.XXC1) this.pasoA(P.APPEAR);
      break;
    }
    this.alDanio();
    this.revisarVerdadero();
  }
  controlDownNT() {
    const s = this.comp;
    if (this.sub === 0) {
      this.cond = C.DAMAGE;
      this.animSet(s.animDanio);
      if (s.animDanio === A.XXC1) {
        this.sub = 2;
        return;
      }
      this.sub = 1;
    } else if (this.sub === 1) {
      if (!s.verdadero || s.verdadero.cond === C.DEAD) {
        this.pasoA(P.DEAD);
        this.m.contarMuerte?.(this);
      }
    } else if (this.sub === 2) {
      if (s.verdadero?.animId !== A.XXC1) {
        this.animSet(A.XXC2);
        this.sub = 1;
      }
    }
  }
  controlEvent() {
    if (this.sub === 0) {
      this.cond = C.EVENT;
      this.mecanismo = true;
      this.sub = 1;
    }
  }
}

export const MECANISMO = {
  pos: [ [ -310, 1980 ], [ 470, 1980 ] ],
  rot: Math.PI,
  desde: -2e3,
  hasta: -600,
  anim: A.DDM,
  bandera: 1855,
  velocidad: nivel => {
    const l = Math.max(0, Math.min(4, Math.round(nivel ?? 1)));
    return 3200 / (CICLO[l] - ESTANCIA[l] * 3);
  },
  parteAnim: () => BIN[A.DDM],
  escala: ESCALA
};
