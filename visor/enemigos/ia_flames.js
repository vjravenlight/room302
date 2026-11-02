// SH4 web — FeniXVOID · Project Ravenlight
import { DT, envolver, rumboHacia, distXZ, azar01 } from "./comun.js";

import { C } from "./ia_hyena.js";

import { registrarLuzMovil } from "../lib/luz_movil.js";

export const P = {
  INIT: 0,
  FLOTA: 1,
  BAJA: 2,
  SE_ACERCA: 3,
  ATACA: 4,
  MUERDE: 5,
  ENFRENTA: 6,
  PAUSA: 7,
  EN_PARED: 8,
  SALE_PARED: 9,
  DANIO: 10,
  CAIDO: 11,
  EXORCIZADO: 12,
  TERMINADO: 13,
  ESPERA: 14,
  ESPERA_EVENTO: 15,
  ESPERA_BANDERA: 16
};

export const NOMBRE_PASO = [ "INIT", "Float", "Descent", "Approach", "Attack", "Bite", "Confront", "Interval", "InWall", "FromWall", "Damage", "Down", "ExorcismDown", "Finished", "Wait", "EventWait", "FlagWait" ];

export const A = {
  FLOTA: 0,
  AVANZA: 3,
  CAE: 13,
  TIRADO: 14,
  GOLPE: 23,
  SE_LEVANTA: 25,
  ATT1: 29,
  ATT2: 30,
  AGARRA: 31,
  SUELTA: 33
};

export const NOMBRES_ANIM_FLAMES = Object.fromEntries(Object.entries(A).map(([k, v]) => [ v, k ]));

export const MODELO_TIPO = [ "enemy_model_fla.bin", "enemy_model_oji.bin" ];

const ALTURA = {
  [P.FLOTA]: 400,
  [P.BAJA]: 240,
  [P.SE_ACERCA]: 200,
  [P.ENFRENTA]: 200,
  [P.ATACA]: 200,
  [P.ESPERA]: 800
};

const GIRO = {
  [P.FLOTA]: .5236,
  [P.BAJA]: .7854,
  [P.SE_ACERCA]: .7854,
  [P.ENFRENTA]: 1.0472,
  [P.ATACA]: 1.5708
};

const SE = {
  ATT1: 40034,
  ATT2: 40035,
  EXORCISMO: 60256,
  EXORCISMO_FUEGO: 60656,
  LOOP_FUEGO: 60656
};

export class Flames {
  constructor(def, pj, anim, m) {
    this.tipo = "FLAMES";
    this.def = def;
    this.pj = pj;
    this.anim = anim;
    this.m = m;
    this.tipoParam = def.tipo_param || 0;
    this.param = m.parametros("FLAMES", this.tipoParam);
    this.hp = this.hpMax = this.param.vida;
    this.aguante = this.param.aguante;
    this.pos = [ ...def.pos ];
    this.rot = def.rumbo || 0;
    this.posAnt = [ ...this.pos ];
    this.rotAnt = this.rot;
    this.radio = 60;
    this.alto = 360;
    this.centroAlto = 180;
    this.sinPasos = true;
    this.sinSangre = true;
    this.cond = C.NORMAL;
    this.paso = P.INIT;
    this.sub = 0;
    this.golpes = [];
    this.animN = -1;
    this.w = {
      timer: 0,
      abajo: 0,
      misma: 0,
      pego: false,
      altura: 400,
      velaAcum: 0,
      slowly: 0,
      porVela: false
    };
    this.visible = true;
    this.opacidad = .85;
    if (def.dmy8 && !m.bandera(def.dmy8)) {
      this.paso = P.ESPERA_BANDERA;
      this.visible = false;
    }
    const ini = def.ini ?? 0;
    if ((ini & 15) === 7) this.paso = P.EXORCIZADO; else if ((ini & 240) === 112) this.paso = P.CAIDO;
    if (this.tipoParam === 0) {
      try {
        this.luz = registrarLuzMovil({
          nombre: "fuego FLAMES",
          color: [ 1, .5, .1 ],
          inicio: 400,
          fin: 600,
          personajes: false
        });
        this.w.fuego = 0;
      } catch (err) {
        this.luz = null;
        console.warn("luz del FLAMES", err.message);
      }
    }
  }
  alRetirar() {
    this.luz?.quitar();
    this.luz = null;
  }
  moverLuz() {
    if (!this.luz) return;
    const k = 1 - (1 - (this.w.fuego ?? 0)) ** 2 * .8;
    this.luz.alcance(400 * k, 600 * k);
    const ve = this.visible && !this.caido();
    if (this.luz.activa !== ve) this.luz.activar(ve);
    this.luz.pos.set(-this.pos[0] * .005, -this.pos[1] * .005, this.pos[2] * .005);
  }
  caido() {
    return this.paso === P.CAIDO || this.paso === P.EXORCIZADO;
  }
  persigue() {
    return [ P.BAJA, P.SE_ACERCA, P.ATACA, P.MUERDE, P.ENFRENTA ].includes(this.paso);
  }
  intocable() {
    return !this.visible || this.paso === P.TERMINADO;
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
  sonido(id) {
    this.m.sonido?.(this, id);
  }
  jug() {
    return this.m.jugador();
  }
  dJug() {
    return distXZ(this.pos, this.jug().pos);
  }
  cara() {
    const j = this.jug();
    return Math.cos(this.rot) * Math.cos(j.rot) + Math.sin(this.rot) * Math.sin(j.rot);
  }
  girarHacia(p, vel) {
    const dr = envolver(rumboHacia(p, this.pos) - this.rot);
    this.rot += Math.sign(dr) * Math.min(Math.abs(dr), vel * DT);
  }
  flotar(v) {
    if (v) this.m.moverFantasma(this, Math.sin(this.rot) * v * DT, Math.cos(this.rot) * v * DT);
    const piso = this.m.piso(this.pos, 400, 3e3);
    const alto = ALTURA[this.paso] ?? 200;
    if (piso != null) {
      const obj = piso - alto;
      this.pos[1] += Math.max(-150 * DT, Math.min(150 * DT, obj - this.pos[1]));
    }
  }
  tick() {
    this.posAnt = [ ...this.pos ];
    this.rotAnt = this.rot;
    this.w.reloj = (this.w.reloj || 0) + DT;
    this.revisarGolpes();
    this.vela();
    this.exorcismo();
    switch (this.paso) {
     case P.INIT:
      this.pasoA(P.FLOTA);
      break;

     case P.FLOTA:
      this.flota();
      break;

     case P.BAJA:
      this.baja();
      break;

     case P.SE_ACERCA:
      this.seAcerca();
      break;

     case P.ATACA:
     case P.MUERDE:
      this.ataca();
      break;

     case P.ENFRENTA:
     case P.PAUSA:
      this.enfrenta();
      break;

     case P.EN_PARED:
     case P.SALE_PARED:
      this.pasoA(P.ENFRENTA);
      break;

     case P.DANIO:
      this.danio();
      break;

     case P.CAIDO:
      this.abajo();
      break;

     case P.EXORCIZADO:
     case P.TERMINADO:
      this.ponerAnim(A.TIRADO);
      break;

     case P.ESPERA:
      this.espera();
      break;

     case P.ESPERA_BANDERA:
      if (this.m.bandera(this.def.dmy8)) {
        this.visible = true;
        this.pasoA(P.FLOTA);
      }
      break;

     case P.ESPERA_EVENTO:
      break;
    }
    this.anim.velocidad?.(1 - this.w.slowly * .5);
    this.anim.avanzar();
    this.moverLuz();
  }
  vel() {
    return this.param.velocidad * (1 - this.w.slowly * .8);
  }
  vela() {
    const v = this.m.vela?.(this) || 0;
    if (v <= 0) return;
    const c = this.cond, n = this.animN;
    if (c === 9 && (n >= 13 && n <= 21 || n >= 23 && n <= 26)) return;
    if (c === 13 && this.paso === P.ESPERA_EVENTO) return;
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
      if (this.paso === P.EXORCIZADO || this.paso === P.TERMINADO) w.velaAcum = 0; else if (this.paso === P.CAIDO) {
        w.velaAcum = 0;
        if (!w.porVela) {
          w.porVela = true;
          if (this.sub === 1 && w.timer < 60) w.timer = 60 + azar01() * 60;
        }
      } else this.exorcizarVela();
    }
    w.slowly = Math.min(1, w.slowly + DT);
  }
  exorcizarVela() {
    this.w.velaAcum = 0;
    this.w.porVela = true;
    this.sonido(this.tipoParam === 0 ? SE.EXORCISMO_FUEGO : SE.EXORCISMO);
    this.hp = 0;
    this.pasoA(P.CAIDO);
  }
  revisarGolpes() {
    if (!this.golpes.length) return;
    const gs = this.golpes;
    this.golpes = [];
    if ([ P.CAIDO, P.EXORCIZADO, P.TERMINADO, P.ESPERA_BANDERA ].includes(this.paso)) return;
    let d = 0, g = gs[0];
    for (const x of gs) {
      d += x.danio || 0;
      if ((x.danio || 0) > (g.danio || 0)) g = x;
    }
    if (g.atributo === 6 || g.atributo === 7) {
      this.sonido(this.tipoParam === 0 ? SE.EXORCISMO_FUEGO : SE.EXORCISMO);
      this.pasoA(P.EXORCIZADO);
      return;
    }
    this.hp -= d;
    this.w.empuje = g.dir ? [ g.dir[0], g.dir[2] ] : null;
    this.pasoA(this.hp <= 0 ? P.CAIDO : P.DANIO);
  }
  flota() {
    if (this.sub === 0) {
      this.ponerAnim(A.FLOTA);
      this.cond = C.NORMAL;
      this.w.timer = 5;
      this.sub = 1;
    }
    const d = this.dJug(), ve = this.m.lineaDeVista(this, null);
    this.w.timer -= DT;
    if (d < 2e3 && ve || d < 500) this.pasoA(P.BAJA);
    this.girarHacia(this.jug().pos, GIRO[P.FLOTA]);
    this.flotar(0);
  }
  baja() {
    if (this.sub === 0) {
      this.ponerAnim(A.AVANZA);
      this.sub = 1;
    }
    if (this.dJug() < 500) {
      this.pasoA(P.SE_ACERCA);
      return;
    }
    this.girarHacia(this.jug().pos, GIRO[P.BAJA]);
    this.flotar(this.vel());
  }
  seAcerca() {
    if (this.sub === 0) {
      this.ponerAnim(A.AVANZA);
      this.cond = 3;
      this.sub = 1;
    }
    const d = this.dJug();
    if (d > 1e3) {
      this.pasoA(P.FLOTA);
      return;
    }
    if (d < 240) {
      this.pasoA(this.puedeAtacar() ? P.ATACA : P.ENFRENTA);
      return;
    }
    this.girarHacia(this.jug().pos, GIRO[P.SE_ACERCA]);
    this.flotar(this.vel());
  }
  puedeAtacar() {
    return (this.w.ultimo || 0) + 1.5 < this.w.reloj;
  }
  ataca() {
    const w = this.w;
    if (this.sub === 0) {
      w.dos = azar01() >= .6 ? false : true;
      this.ponerAnim(w.dos ? A.ATT2 : A.ATT1);
      this.cond = 5;
      w.pego = false;
      w.sono = false;
      this.sub = 1;
    }
    const cuadro = w.dos ? 20 : 9;
    if (!w.sono && this.anim.cuadro >= cuadro) {
      w.sono = true;
      this.sonido(w.dos ? SE.ATT2 : SE.ATT1);
    }
    if (!w.pego && this.anim.cuadro >= cuadro) {
      w.pego = true;
      const j = this.jug();
      if (j.existe && distXZ(this.pos, j.pos) < this.radio + this.m.radioJugador + 120 && Math.abs(envolver(rumboHacia(j.pos, this.pos) - this.rot)) < 1.2) this.m.golpear(this, w.dos ? 15 : 10, w.dos ? "BAK_FLAMES_ATT2" : "BAK_FLAMES_ATT1");
    }
    this.girarHacia(this.jug().pos, GIRO[P.ATACA]);
    if (this.anim.fin || this.anim.cuadro >= this.anim.dur - 1) {
      w.ultimo = w.reloj;
      this.pasoA(P.ENFRENTA);
    }
  }
  enfrenta() {
    const w = this.w, j = this.jug();
    if (this.sub === 0) {
      this.ponerAnim(A.FLOTA);
      this.cond = 2;
      w.timer = 0;
      this.sub = 1;
    }
    w.timer += DT;
    const d = this.dJug();
    if (w.timer >= 2 && d < 240 && this.puedeAtacar()) {
      this.pasoA(P.ATACA);
      return;
    }
    if (d > 1e3) {
      this.pasoA(P.FLOTA);
      return;
    }
    if (w.timer >= 2 && this.cara() < -.9659) {
      this.pasoA(P.SE_ACERCA);
      return;
    }
    const a = rumboHacia(this.pos, j.pos), b = a + envolver(j.rot - a) * .4;
    const obj = [ j.pos[0] + Math.sin(b) * 500, j.pos[1], j.pos[2] + Math.cos(b) * 500 ];
    const dx = obj[0] - this.pos[0], dz = obj[2] - this.pos[2], L = Math.hypot(dx, dz);
    if (L > 20) {
      const v = Math.min(this.vel(), L / DT) * DT;
      this.m.moverFantasma(this, dx / L * v, dz / L * v);
    }
    this.girarHacia(j.pos, GIRO[P.ENFRENTA]);
    this.flotar(0);
  }
  danio() {
    if (this.sub === 0) {
      this.ponerAnim(A.GOLPE);
      this.cond = 9;
      this.sub = 1;
    }
    const e = this.w.empuje;
    if (e) this.m.moverFantasma(this, -e[0] * 120 * DT, -e[1] * 120 * DT);
    if (this.anim.fin) this.pasoA(P.ENFRENTA);
  }
  abajo() {
    const w = this.w;
    if (this.sub === 0) {
      w.timer = this.hp <= 0 ? (azar01() + 1) * 60 : azar01() * 7 + 3;
      this.ponerAnim(A.CAE);
      this.cond = this.hp <= 0 ? 9 : 10;
      this.sub = 1;
    }
    if (this.sub === 1) {
      const piso = this.m.piso(this.pos, 400, 3e3);
      if (piso != null) this.pos[1] += Math.min(400 * DT, Math.max(0, piso - 40 - this.pos[1]));
      if (this.anim.fin) this.ponerAnim(A.TIRADO);
      w.timer -= DT;
      if (w.timer <= 0) {
        this.ponerAnim(A.SE_LEVANTA);
        this.sub = 2;
      }
      return;
    }
    if (this.anim.fin) {
      this.hp = this.hpMax;
      this.w.porVela = false;
      this.cond = C.NORMAL;
      this.pasoA(P.FLOTA);
    }
  }
  espera() {
    if (this.sub === 0) {
      this.ponerAnim(A.FLOTA);
      this.sub = 1;
    }
    this.flotar(0);
    if (this.dJug() < 2e3) this.pasoA(P.ENFRENTA);
  }
}
