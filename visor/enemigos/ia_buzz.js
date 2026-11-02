// SH4 web — FeniXVOID · Project Ravenlight
import { DT, envolver, rumboHacia, dist3, distXZ, azar01 } from "./comun.js";

import { C } from "./ia_hyena.js";

export const P = {
  INIT: 0,
  TECHO: 1,
  PARED: 2,
  PISO: 3,
  VAGAR: 4,
  IR_A_COLGARSE: 5,
  CAUTELA: 6,
  RONDA: 7,
  PICADA: 8,
  CHUPAR: 9,
  PICOTAZO: 10,
  HUIR: 11,
  JUNTARSE: 12,
  DANIO: 13,
  CAIDO: 14,
  ESPERA: 15
};

export const NOMBRE_PASO = [ "INIT", "StayOnCeiling", "StayOnWall", "StayOnFloor", "Wander", "ToHold", "Caution", "Round", "Dive", "SuckAttack", "PeckAttack", "Escape", "Gather", "Damage", "Down", "Wait" ];

export const A = {
  COLGADO: 0,
  EN_PARED: 1,
  EN_PISO: 2,
  ATERRIZA: 3,
  CAMINA_PARED: 4,
  SUELTA_TECHO: 5,
  DESPEGA_PARED: 6,
  DESPEGA_PISO: 7,
  GOLPE: 8,
  CAIDO: 11,
  MUERTO: 12,
  MURIENDO: 13,
  MUERTO2: 14,
  VUELA: 15,
  HUYE: 16,
  ATACA: 17,
  PICOTEA: 18,
  CHUPA: 19
};

export const NOMBRES_ANIM_BUZZ = Object.fromEntries(Object.entries(A).map(([k, v]) => [ v, k ]));

const V = {
  QUIETO: 0,
  PICADA_LIBRE: 1,
  RONDA: 2,
  ATAQUE: 3,
  VAGAR: 4,
  PEGADO: 5,
  CAUTELA: 6,
  ATERRIZA: 7,
  VA_A_PARED: 8,
  POSA: 9,
  CIRCULA: 10,
  PICADA: 11,
  HUYE: 12,
  JUNTA: 13,
  GOLPEADO: 14,
  CAE: 15,
  NADA: 16
};

const SE = {
  ALAS: 63151,
  GOLPE: 60153,
  GOLPE_SUAVE: 60155,
  REMATE: 60154,
  CAE_AL_PISO: 60156
};

const RADIO = 40;

const ALTO_VUELO = 240;

const RELOJ = {
  "dueño": null,
  ultimo: 0
};

const ALERTAS = [];

function alertar(tipo, pos, radio, seg) {
  ALERTAS.push({
    tipo: tipo,
    pos: [ ...pos ],
    radio: radio,
    t: seg
  });
}

function alerta(tipo, pos) {
  return ALERTAS.find(a => a.tipo === tipo && dist3(a.pos, pos) < a.radio) || null;
}

export class Buzz {
  constructor(def, pj, anim, m) {
    this.tipo = "BUZZ";
    this.def = def;
    this.pj = pj;
    this.anim = anim;
    this.m = m;
    this.param = m.parametros("BUZZ", 0);
    this.hp = this.hpMax = this.param.vida;
    this.aguante = this.param.aguante;
    this.pos = [ ...def.pos ];
    this.rot = def.rumbo || 0;
    this.posAnt = [ ...this.pos ];
    this.rotAnt = this.rot;
    this.radio = RADIO;
    this.radioGolpe = 60;
    this.alto = 120;
    this.centroAlto = 60;
    this.sinPasos = true;
    this.sinSangre = false;
    this.cond = C.NORMAL;
    this.paso = P.INIT;
    this.sub = 0;
    this.golpes = [];
    this.ini = def.ini ?? 0;
    this.w = {
      obj: [ ...this.pos ],
      normal: [ 0, 1, 0 ],
      vel: [ 0, 0, 0 ],
      va: 0,
      giro: 0,
      timer: 0,
      timer2: 0,
      puede: false,
      vel1: 1,
      vel2: 0,
      primero: 0,
      golpesAbajo: 0,
      recupera: false,
      modo: V.NADA,
      chupando: false,
      tChupa: 0
    };
    this.animN = -1;
    this.inclinacion = null;
    const t = this.ini & 15;
    if (t === 1 || t === 3) {
      this.ponerAnim(t === 1 ? A.MUERTO : A.MUERTO2);
      this.anim.t = this.anim.dur - 1;
      this.cond = C.DEAD;
      this.hp = 0;
      this.paso = P.CAIDO;
      this.sub = 99;
      this.pisar();
    }
    this.w.primero = (def.tipo_param || 0) === 1 ? 1 : 0;
  }
  caido() {
    return this.paso === P.CAIDO && this.cond !== C.DEAD;
  }
  persigue() {
    return [ P.CAUTELA, P.RONDA, P.PICADA, P.CHUPAR, P.PICOTAZO ].includes(this.paso);
  }
  intocable() {
    return this.cond === C.DEAD;
  }
  recibir(g) {
    if (!this.intocable()) this.golpes.push(g);
  }
  pasoA(n) {
    this.paso = n;
    this.sub = 0;
  }
  ponerAnim(n) {
    if (n !== this.animN || this.anim.fin) {
      this.animN = n;
      this.anim.poner(n);
    }
  }
  sonido(id, loop) {
    this.m.sonido?.(this, id, loop);
  }
  alas(si) {
    if (si !== this.sonando) {
      this.sonando = si;
      this.sonido(si ? SE.ALAS : null, true);
    }
  }
  jug() {
    return this.m.jugador();
  }
  vidaJug() {
    return (this.jug().vida ?? 1) * 100;
  }
  meEncara() {
    const j = this.jug();
    return !!j.existe && [ 3, 4, 5 ].includes(j.estado);
  }
  jugCorre() {
    const j = this.jug();
    return !!j.existe && !!j.corriendo;
  }
  dJug() {
    return distXZ(this.pos, this.jug().pos);
  }
  siente(r, r2) {
    const j = this.jug();
    if (!j.existe) return false;
    const d = dist3(this.pos, j.pos);
    if (d <= r2) return true;
    if (d > r || Math.abs(envolver(rumboHacia(j.pos, this.pos) - this.rot)) > 1.0472) return false;
    return this.m.lineaDeVista(this, null);
  }
  pisar() {
    const y = this.m.piso(this.pos, 30, 3e3);
    if (y != null) this.pos[1] = y;
  }
  tick() {
    this.posAnt = [ ...this.pos ];
    this.rotAnt = this.rot;
    const ahora = performance.now();
    if (RELOJ.dueño !== this && ahora - (RELOJ.ultimo || 0) > 500) {
      RELOJ.dueño = this;
      ALERTAS.length = 0;
    }
    if (RELOJ.dueño === this) {
      RELOJ.ultimo = ahora;
      for (const a of ALERTAS) a.t -= DT;
      for (let i = ALERTAS.length - 1; i >= 0; i--) if (ALERTAS[i].t <= 0) ALERTAS.splice(i, 1);
    }
    this.revisarGolpes();
    if (this.cond !== C.DEAD) {
      switch (this.paso) {
       case P.INIT:
        this.init();
        break;

       case P.TECHO:
       case P.PISO:
       case P.ESPERA:
        this.quieto();
        break;

       case P.PARED:
        this.pared();
        break;

       case P.VAGAR:
        this.vagar();
        break;

       case P.IR_A_COLGARSE:
        this.irAColgarse();
        break;

       case P.CAUTELA:
        this.cautela();
        break;

       case P.RONDA:
        this.ronda();
        break;

       case P.PICADA:
        this.picada();
        break;

       case P.CHUPAR:
        this.chupar();
        break;

       case P.PICOTAZO:
        this.picotazo();
        break;

       case P.HUIR:
        this.huir();
        break;

       case P.JUNTARSE:
        this.juntarse();
        break;

       case P.DANIO:
        this.danio();
        break;

       case P.CAIDO:
        this.abajo();
        break;
      }
      this.volar();
      if (this.paso !== P.CAIDO && this.cond !== C.DEAD) this.hp = Math.min(this.hpMax, this.hp + this.param.recupera * DT);
    }
    this.anim.avanzar();
  }
  revisarGolpes() {
    if (!this.golpes.length) return;
    const gs = this.golpes;
    this.golpes = [];
    if (this.cond === C.DEAD) return;
    let g = gs[0], d = 0;
    for (const x of gs) {
      d += x.danio || 0;
      if ((x.danio || 0) > (g.danio || 0)) g = x;
    }
    const pisoton = /FINISH|PISOTON/.test(g.golpe || "");
    if (this.paso === P.CAIDO) {
      this.w.timer += azar01() * 5 + 2;
      this.hp -= d;
      this.sonido(pisoton ? SE.REMATE : g.danio > 8 ? SE.GOLPE : SE.GOLPE_SUAVE);
      if (this.hp <= 0) {
        this.w.golpesAbajo++;
        this.morir();
      }
      return;
    }
    this.hp -= d;
    this.sonido(g.danio > 8 ? SE.GOLPE : SE.GOLPE_SUAVE);
    const s = g.shock ?? 20, dir = g.dir || [ 0, 0, 1 ];
    this.w.vel = [ -dir[0] * s * 2 - dir[0] * s * 18 * .1, -dir[1] * s * 2, -dir[2] * s * 2 - dir[2] * s * 18 * .1 ];
    this.w.recupera = !(this.hp / this.hpMax * 100 + 50 <= azar01() * 150);
    alertar(3, this.pos, 2e3, 3);
    this.inclinacion = null;
    this.pasoA(P.DANIO);
  }
  volar() {
    const w = this.w, modo = w.modo;
    if (modo === V.PEGADO || modo === V.NADA || this.paso === P.CAIDO) {
      w.vel = [ 0, 0, 0 ];
      return;
    }
    const j = this.jug();
    if (w.obj[1] < j.pos[1] - 800) w.obj[1] = j.pos[1] - 800;
    let d = [ w.obj[0] - this.pos[0], w.obj[1] - this.pos[1], w.obj[2] - this.pos[2] ];
    let roce = 0;
    if (modo === V.CAE) {
      w.vel[1] += 1568 * DT;
    } else if (modo === V.GOLPEADO) {
      const h = Math.hypot(w.vel[0], w.vel[2]);
      const k = h > 0 ? Math.max(0, h - DT * 1600) / h : 0;
      w.vel[0] *= k;
      w.vel[2] *= k;
      w.vel[1] += 1568 * DT;
    } else if (modo === V.HUYE) {
      const L = Math.hypot(...d) || 1;
      d = d.map(v => -v / L * 400);
    } else {
      if ([ V.PICADA_LIBRE, V.CAUTELA, V.ATERRIZA, V.VA_A_PARED ].includes(modo)) roce = 1;
      if ([ V.RONDA, V.ATAQUE, V.CIRCULA, V.JUNTA ].includes(modo)) roce = 2;
    }
    if (modo !== V.CAE && modo !== V.GOLPEADO) {
      const k = Math.min(1, DT * 5);
      if (roce) w.vel = w.vel.map(v => v / (roce * DT + 1));
      w.vel = w.vel.map((v, i) => v + d[i] * k);
      const max = ([ V.ATAQUE, V.CIRCULA, V.JUNTA ].includes(modo) ? this.param.velocidad2 : this.param.velocidad) * w.vel1;
      const L = Math.hypot(...w.vel);
      if (L > max) w.vel = w.vel.map(v => v * max / L);
    }
    const nx = this.pos[0] + w.vel[0] * DT, nz = this.pos[2] + w.vel[2] * DT;
    const libre = this.m.lineaDeVista([ this.pos[0], this.pos[1] - 20, this.pos[2] ], [ nx + Math.sign(w.vel[0]) * RADIO, this.pos[1] - 20, nz + Math.sign(w.vel[2]) * RADIO ]);
    if (libre) {
      this.pos[0] = nx;
      this.pos[2] = nz;
    } else {
      w.vel[0] *= -.3;
      w.vel[2] *= -.3;
    }
    const dy = w.vel[1] * DT;
    if (Math.abs(dy) > .001) {
      const hasta = [ this.pos[0], this.pos[1] + dy + Math.sign(dy) * 30, this.pos[2] ];
      if (this.m.lineaDeVista([ this.pos[0], this.pos[1], this.pos[2] ], hasta)) this.pos[1] += dy; else w.vel[1] = 0;
    }
    const piso = this.m.piso(this.pos, 10, 3e3);
    if (piso != null && this.pos[1] > piso - 10 && modo !== V.CAE && modo !== V.GOLPEADO) {
      this.pos[1] = piso - 10;
      if (w.vel[1] > 0) w.vel[1] = 0;
    }
    let mira = null;
    if ([ V.QUIETO, V.PICADA_LIBRE, V.HUYE ].includes(modo) && Math.hypot(w.vel[0], w.vel[2]) > 1) mira = Math.atan2(w.vel[0], w.vel[2]); else if ([ V.RONDA, V.CAUTELA, V.ATERRIZA, V.ATAQUE, V.VAGAR, V.CIRCULA, V.JUNTA, V.PICADA, V.POSA, V.VA_A_PARED ].includes(modo)) mira = rumboHacia(j.pos, this.pos);
    if (mira != null) {
      const vel = {
        [V.HUYE]: 6.28,
        [V.RONDA]: 2.09,
        [V.CAUTELA]: 2.09,
        [V.ATERRIZA]: 2.09
      }[modo] ?? 3.14;
      const dr = envolver(mira - this.rot);
      this.rot += Math.sign(dr) * Math.min(Math.abs(dr), vel * DT);
    }
  }
  init() {
    const t = this.ini & 240;
    this.w.modo = V.NADA;
    if (t === 16) this.pasoA(P.PISO); else if (t >= 32 && t <= 80) {
      this.w.normal = [ [ 0, 0, 1 ], [ 1, 0, 0 ], [ 0, 0, -1 ], [ -1, 0, 0 ] ][(t >> 4) - 2];
      this.pasoA(P.PARED);
    } else if (t === 96) this.pasoA(P.TECHO); else {
      this.alas(true);
      this.pasoA(P.VAGAR);
    }
  }
  quieto() {
    const w = this.w, techo = this.paso === P.TECHO;
    if (this.sub === 0) {
      this.radio = 20;
      this.alas(false);
      w.modo = V.NADA;
      this.ponerAnim(techo ? A.COLGADO : A.EN_PISO);
      if (techo) {
        this.colgarDelTecho();
        this.inclinacion = "techo";
      } else {
        this.pisar();
        this.inclinacion = null;
      }
      w.timer2 = azar01();
      if (this.paso === P.ESPERA) {
        this.sub = 4;
        return;
      }
      if (w.primero === 1) {
        this.sub = 3;
        return;
      }
      w.timer = azar01() * 10;
      this.sub = 1;
      return;
    }
    if (this.sub === 2) {
      if (!this.anim.fin) return;
      if (techo) {
        this.pos[1] += 120;
        this.posAnt[1] = this.pos[1];
      }
      this.pasoA(P.CAUTELA);
      return;
    }
    const al3 = !!alerta(3, this.pos), al4 = !!alerta(4, this.pos);
    let suelta = false;
    if (this.sub === 1) {
      let r = this.meEncara() ? 1200 : 800;
      if (al3) r *= 2;
      if (this.dJug() < r) {
        w.timer -= azar01();
        suelta = w.timer <= 0;
      } else suelta = al4;
    } else if (this.sub === 3) {
      suelta = this.dJug() < (al3 ? 1e3 : techo ? 400 : 800) || al4;
    } else if (this.sub === 4) {
      if (this.dJug() < 640) {
        this.despegar(A.DESPEGA_PISO);
        this.sub = 2;
      }
      return;
    }
    if (!suelta) return;
    w.timer2 -= DT;
    if (w.timer2 > 0 && this.sub !== 3) return;
    w.primero = 0;
    this.despegar(techo ? A.SUELTA_TECHO : A.DESPEGA_PISO);
    this.sub = 2;
  }
  despegar(an) {
    const w = this.w;
    w.vel = [ Math.sin(this.rot) * 200, 0, Math.cos(this.rot) * 200 ];
    w.obj = [ this.pos[0] + Math.sin(this.rot) * 240, this.pos[1] + (this.inclinacion === "techo" ? 160 : -240), this.pos[2] + Math.cos(this.rot) * 240 ];
    this.inclinacion = null;
    this.radio = RADIO;
    this.ponerAnim(an);
    w.modo = V.CAUTELA;
    this.alas(true);
  }
  colgarDelTecho() {
    for (let h = 4; h < 1500; h += 20) {
      const p = [ this.pos[0], this.pos[1] - h, this.pos[2] ];
      if (!this.m.lineaDeVista([ this.pos[0], this.pos[1] + 1, this.pos[2] ], p)) {
        this.pos[1] = p[1] + 20;
        return;
      }
    }
  }
  pared() {
    const w = this.w;
    switch (this.sub) {
     case 0:
      this.radio = 20;
      this.alas(false);
      w.modo = V.PEGADO;
      this.ponerAnim(A.EN_PARED);
      this.inclinacion = "pared";
      w.timer2 = azar01();
      if (w.primero === 1) {
        this.sub = 5;
        return;
      }
      w.timer = azar01() * 3 + 1;
      this.sub = 1;
      return;

     case 1:
      w.timer -= DT;
      if (w.timer <= 0) this.sub = 2;
      return;

     case 2:
     case 3:
      {
        let r = this.meEncara() ? 1200 : 800;
        if (alerta(3, this.pos)) r *= 2;
        if (this.dJug() < r) break;
        if (this.sub === 2) {
          this.ponerAnim(A.CAMINA_PARED);
          w.giro = (azar01() * 2 - 1) * .0174 * 30;
          w.timer = azar01() * 3 + 1;
          this.sub = 3;
        }
        w.timer -= DT;
        if (w.timer < 0) {
          this.sub = azar01() < .3 ? 0 : 2;
          return;
        }
        this.rot += w.giro * DT;
        const nx = this.pos[0] + Math.sin(this.rot) * 60 * DT, nz = this.pos[2] + Math.cos(this.rot) * 60 * DT;
        if (this.m.lineaDeVista([ this.pos[0], this.pos[1], this.pos[2] ], [ nx, this.pos[1], nz ])) {
          this.pos[0] = nx;
          this.pos[2] = nz;
        } else w.giro = -w.giro;
        return;
      }

     case 4:
      if (this.anim.fin) this.pasoA(P.CAUTELA);
      return;

     case 5:
      if (this.dJug() < (alerta(3, this.pos) ? 1e3 : 400)) break;
      return;
    }
    w.timer2 -= DT;
    if (w.timer2 > 0) return;
    w.primero = 0;
    this.despegar(A.DESPEGA_PARED);
    this.sub = 4;
  }
  vagar() {
    const w = this.w, j = this.jug();
    if (alerta(4, this.pos)) {
      this.pasoA(P.JUNTARSE);
      return;
    }
    if (this.sub === 0) {
      this.radio = RADIO;
      this.ponerAnim(A.VUELA);
      w.modo = V.PICADA_LIBRE;
      this.alas(true);
      this.inclinacion = null;
      w.va = w.vel[1] * .5;
      this.sub = 1;
    }
    if (this.sub === 1) {
      const a = this.rot + (azar01() * 2 - 1) * 1.5708 * .6;
      w.obj = [ this.pos[0] + Math.sin(a) * 400, this.pos[1], this.pos[2] + Math.cos(a) * 400 ];
      const piso = this.m.piso(w.obj, 300, 2e3);
      w.obj[1] = piso != null ? Math.min(piso - 160, Math.max(piso - 240 - 200, this.pos[1])) : this.pos[1];
      w.puede = this.vidaJug() < azar01() * 110;
      w.timer = azar01() * 2 + 1;
      this.sub = 2;
    }
    if (this.sub === 2) {
      w.timer -= DT;
      if (w.timer <= 0 || dist3(w.obj, this.pos) < 100) {
        if (azar01() < .3 && this.dJug() > 800 && azar01() > .01) {
          this.pasoA(P.IR_A_COLGARSE);
          return;
        }
        this.sub = 1;
      }
    }
    if (w.puede && j.existe) {
      const r = this.meEncara() ? 4e3 : 2e3;
      if (this.siente(r, r / 2)) this.pasoA(P.CAUTELA);
    }
  }
  irAColgarse() {
    const w = this.w;
    if (this.sub === 0) {
      const h = this.buscarDondeColgarse();
      if (!h) {
        this.pasoA(P.VAGAR);
        return;
      }
      w.obj = h.pos;
      w.normal = h.normal;
      this.ponerAnim(A.ATACA);
      w.modo = V.VA_A_PARED;
      w.timer = 5;
      this.sub = 1;
    }
    const cerca = dist3(this.pos, w.obj);
    if (this.sub === 1 && cerca < 400) {
      this.radio = 20;
      w.modo = V.POSA;
      this.sub = 2;
    }
    if (this.sub === 2 && cerca < 60) {
      this.pos = [ ...w.obj ];
      w.vel = [ 0, 0, 0 ];
      if (w.normal[1] < -.866) {
        this.pasoA(P.PISO);
        return;
      }
      if (w.normal[1] > .866) {
        this.ponerAnim(A.ATERRIZA);
        w.modo = V.NADA;
        this.sub = 3;
        return;
      }
      this.rot = Math.atan2(-w.normal[0], -w.normal[2]);
      this.pasoA(P.PARED);
      return;
    }
    if (this.sub === 3) {
      if (this.anim.fin) this.pasoA(P.TECHO);
      return;
    }
    w.timer -= DT;
    if (w.timer <= 0) this.pasoA(P.CAUTELA);
  }
  buscarDondeColgarse() {
    for (const [dy, dl] of [ [ -400, 200 ], [ -300, 400 ], [ 0, 400 ], [ 300, 300 ] ]) {
      const a = this.rot + (azar01() - .5);
      const hasta = [ this.pos[0] + Math.sin(a) * dl, this.pos[1] + dy, this.pos[2] + Math.cos(a) * dl ];
      if (!this.m.lineaDeVista([ this.pos[0], this.pos[1], this.pos[2] ], hasta)) {
        const normal = dy < -200 ? [ 0, 1, 0 ] : dy > 200 ? [ 0, -1, 0 ] : [ -Math.sin(a), 0, -Math.cos(a) ];
        const k = .85;
        return {
          pos: [ this.pos[0] + (hasta[0] - this.pos[0]) * k, this.pos[1] + (hasta[1] - this.pos[1]) * k, this.pos[2] + (hasta[2] - this.pos[2]) * k ],
          normal: normal
        };
      }
    }
    return null;
  }
  cautela() {
    const w = this.w, j = this.jug();
    if (this.jugCorre()) {
      this.pasoA(P.PICADA);
      return;
    }
    if (this.sub === 0) {
      const espalda = Math.abs(envolver(rumboHacia(this.pos, j.pos) - j.rot)) > 2.1;
      if (azar01() < .25 && !this.meEncara() && espalda) {
        this.pasoA(P.PICADA);
        return;
      }
      this.radio = RADIO;
      this.ponerAnim(A.VUELA);
      this.alas(true);
      this.inclinacion = null;
      w.modo = V.PICADA_LIBRE;
      this.sub = 1;
    }
    const dx = j.pos[0] - this.pos[0], dz = j.pos[2] - this.pos[2], d = Math.hypot(dx, dz) || 1;
    w.obj = [ j.pos[0] - dx / d * 200, Math.min(j.pos[1] - 160, j.pos[1] - ALTO_VUELO), j.pos[2] - dz / d * 200 ];
    if (this.sub === 1) {
      if (d <= 400) {
        this.ponerAnim(A.ATACA);
        w.modo = V.RONDA;
        w.timer = azar01() * 2 + 1;
        this.sub = 2;
      }
    } else {
      if (d > 600) {
        this.ponerAnim(A.VUELA);
        w.modo = V.PICADA_LIBRE;
        this.sub = 1;
        return;
      }
      w.timer -= DT;
      if (w.timer <= 0) this.pasoA((this.def.tipo_param || 0) === 2 ? P.HUIR : P.RONDA);
    }
    if (!j.existe || !this.siente(this.jugCorre() ? 4e3 : 2e3, this.jugCorre() ? 2e3 : 1e3)) this.pasoA(P.VAGAR);
  }
  ronda() {
    const w = this.w, j = this.jug();
    if (this.jugCorre()) {
      this.pasoA(P.PICADA);
      return;
    }
    if (this.sub === 0) {
      this.ponerAnim(A.ATACA);
      w.modo = V.CIRCULA;
      w.timer2 = (azar01() + 1) * 3;
      this.sub = 1;
    }
    if (!j.existe || !this.siente(this.jugCorre() ? 4e3 : 2e3, this.jugCorre() ? 2e3 : 1e3)) {
      this.pasoA(P.VAGAR);
      return;
    }
    const a = rumboHacia(this.pos, j.pos), dif = envolver(j.rot + Math.PI - a);
    if (Math.abs(dif) < .0873) {
      if (this.sub === 1) {
        w.timer = azar01() * 1.5;
        this.sub = 2;
      } else {
        w.timer -= DT;
        if (w.timer <= 0) {
          this.pasoA(this.meEncara() ? P.PICOTAZO : P.CHUPAR);
          return;
        }
      }
    }
    w.timer2 -= DT;
    if (w.timer2 <= 0 && !this.meEncara()) {
      this.pasoA(Math.abs(dif) >= .0873 ? P.PICOTAZO : P.CHUPAR);
      return;
    }
    const b = a + Math.sign(dif) * Math.min(Math.abs(dif), 1.0472);
    w.obj = [ j.pos[0] + Math.sin(b) * 200, j.pos[1] - ALTO_VUELO, j.pos[2] + Math.cos(b) * 200 ];
  }
  picada() {
    const w = this.w, j = this.jug();
    if (this.meEncara()) {
      this.pasoA(P.CAUTELA);
      return;
    }
    if (this.sub === 0) {
      this.ponerAnim(A.VUELA);
      w.modo = V.PICADA;
      w.timer = 7;
      this.sub = 1;
    }
    w.timer -= DT;
    if (w.timer <= 0) {
      this.pasoA(P.VAGAR);
      return;
    }
    w.obj = [ j.pos[0], j.pos[1] - 360, j.pos[2] ];
    if (this.toca(j)) {
      this.m.golpear(this, this.param.ataque3 || 2, "BAK_BUZZ_DIVE");
      this.pasoA(P.HUIR);
    }
  }
  toca(j) {
    return j.existe && distXZ(this.pos, j.pos) < this.radio + this.m.radioJugador + 30 && this.pos[1] > j.pos[1] - 420 && this.pos[1] < j.pos[1] + 20;
  }
  chupar() {
    const w = this.w, j = this.jug();
    if (this.sub === 0) {
      this.radio = RADIO;
      w.modo = V.ATAQUE;
      this.ponerAnim(A.ATACA);
      w.timer2 = 7;
      this.sub = 1;
    }
    if (this.sub === 1) {
      w.timer2 -= DT;
      if (w.timer2 <= 0) {
        this.pasoA(P.HUIR);
        return;
      }
      if (this.meEncara()) {
        this.pasoA(P.PICOTAZO);
        return;
      }
      w.obj = [ j.pos[0], j.pos[1] - 360, j.pos[2] ];
      if (this.toca(j) || distXZ(this.pos, j.pos) < 60) {
        w.modo = V.PEGADO;
        this.ponerAnim(A.CHUPA);
        this.sub = 3;
        w.tChupa = 0;
        this.m.golpear(this, this.param.ataque1 || 3, "BAK_BUZZ_BLOODSUCK", {
          reaccion: 5
        });
      }
      return;
    }
    this.pos = [ j.pos[0] - Math.sin(j.rot) * 20, j.pos[1] - 300, j.pos[2] - Math.cos(j.rot) * 20 ];
    this.rot = j.rot;
    if (this.meEncara() || !j.existe || j.estado === 10) {
      this.pasoA(P.CAUTELA);
      return;
    }
    w.tChupa += DT;
    if (w.tChupa >= 1) {
      w.tChupa -= 1;
      this.m.golpear(this, this.param.ataque2 || 2, "BAK_BUZZ_BLOODSUCK", {
        reaccion: 5
      });
    }
    if (this.anim.fin) this.pasoA(P.HUIR);
  }
  picotazo() {
    const w = this.w, j = this.jug();
    if (this.sub === 0) {
      this.radio = RADIO;
      w.modo = V.ATAQUE;
      this.ponerAnim(A.ATACA);
      w.timer2 = 3;
      this.sub = 1;
    }
    w.obj = [ j.pos[0], j.pos[1] - 360, j.pos[2] ];
    if (this.sub === 1) {
      w.timer2 -= DT;
      if (w.timer2 <= 0) {
        this.pasoA(P.HUIR);
        return;
      }
      if (this.toca(j)) {
        this.ponerAnim(A.PICOTEA);
        w.pego = false;
        this.sub = 2;
      }
      return;
    }
    if (!w.pego && this.anim.cuadro > 4 && this.toca(j)) {
      w.pego = true;
      this.m.golpear(this, 3, "BAK_BUZZ_PECK");
    }
    if (this.anim.fin) this.pasoA(P.HUIR);
  }
  huir() {
    const w = this.w, j = this.jug();
    if (alerta(4, this.pos)) {
      this.pasoA(P.JUNTARSE);
      return;
    }
    if (this.sub === 0) {
      this.radio = RADIO;
      this.ponerAnim(A.HUYE);
      w.modo = V.HUYE;
      w.timer = (azar01() + 1) * 5;
      this.sub = 1;
    }
    w.obj = [ j.pos[0], j.pos[1] - ALTO_VUELO, j.pos[2] ];
    w.timer -= DT;
    if (w.timer <= 0 || dist3(this.pos, j.pos) > 3e3) this.pasoA(P.VAGAR);
  }
  juntarse() {
    const w = this.w, al = alerta(4, this.pos);
    if (this.sub === 0) {
      if (!al) {
        this.pasoA(P.VAGAR);
        return;
      }
      w.centro = [ ...al.pos ];
      this.ponerAnim(A.VUELA);
      w.modo = V.JUNTA;
      w.timer = azar01() * 20 + 10;
      this.sub = 1;
    }
    const c = w.centro, a = (performance.now() / 1e3 + (this.def.indice || 0)) * 1.2;
    w.obj = [ c[0] + Math.sin(a) * 80, c[1] - ALTO_VUELO, c[2] + Math.cos(a) * 80 ];
    w.timer -= DT;
    if (w.timer <= 0) this.pasoA(P.VAGAR);
  }
  danio() {
    const w = this.w;
    if (this.sub === 0) {
      this.alas(false);
      this.ponerAnim(A.GOLPE);
      w.modo = V.GOLPEADO;
      this.sub = 1;
      w.timer = 0;
    }
    w.timer += DT;
    const piso = this.m.piso(this.pos, 10, 3e3);
    if (piso != null && this.pos[1] >= piso - 12) {
      this.pos[1] = piso;
      w.vel = [ 0, 0, 0 ];
      this.sonido(SE.CAE_AL_PISO);
      this.pasoA(P.CAIDO);
      return;
    }
    if (piso == null && w.timer > 2) {
      this.pasoA(P.CAIDO);
    }
  }
  abajo() {
    const w = this.w;
    if (this.sub === 99) return;
    if (this.sub === 0) {
      this.radio = 20;
      w.modo = V.NADA;
      this.pisar();
      this.inclinacion = null;
      this.alas(false);
      this.ponerAnim(A.CAIDO);
      w.timer = azar01() * 7 + 3;
      this.cond = 10;
      this.sub = 1;
      if (this.hp <= 0) {
        this.morir();
        return;
      }
      return;
    }
    w.timer -= DT;
    if (w.timer > 0 && w.golpesAbajo < 2) return;
    if (this.hp <= 0) {
      this.morir();
      return;
    }
    if (w.recupera ? azar01() < .8 : azar01() >= .1) {
      if (w.recupera) {
        this.cond = C.NORMAL;
        this.w.normal = [ 0, -1, 0 ];
        this.despegar(A.DESPEGA_PISO);
        this.pasoA(P.PARED);
        this.sub = 4;
        return;
      }
      w.timer = azar01() * 3 + 1;
      this.ponerAnim(this.animN === A.CAIDO ? A.MUERTO : A.CAIDO);
      return;
    }
    this.morir();
  }
  morir() {
    this.hp = 0;
    this.cond = C.DEAD;
    this.alas(false);
    this.w.modo = V.NADA;
    this.ponerAnim(A.MURIENDO);
    this.paso = P.CAIDO;
    this.sub = 99;
    this.pisar();
    this.m.charco?.(this, 100, false);
    alertar(4, this.pos, 1400, 10);
  }
  inclinar(grupo) {
    if (this.inclinacion !== "pared") return;
    const n = this.w.normal, V3 = grupo.position.constructor, Q = grupo.quaternion.constructor;
    const q = (new Q).setFromUnitVectors(new V3(0, 1, 0), new V3(-n[0], -n[1], n[2]).normalize());
    grupo.quaternion.premultiply(q);
  }
}
