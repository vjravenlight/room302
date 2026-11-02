// SH4 web — FeniXVOID · Project Ravenlight
import { DT, envolver, rumboHacia, distXZ, azar01 } from "./comun.js";

export const P = {
  RONDA_I: 0,
  ATAQUE_I: 1,
  APUNTA_I: 2,
  SALTO_I: 3,
  BARRIDO_I: 4,
  EVENTO1: 5,
  EVENTO2: 6,
  EVENTO3: 7,
  ACERCA: 8,
  ATAQUE: 9,
  APUNTA: 10,
  BARRIDO: 11,
  CARGA: 12,
  CUIDADO: 13,
  PAUSA: 14,
  ATRAS: 15,
  DANIO: 16,
  REMATE: 17,
  MUERTO: 18
};

export const NOMBRE_PASO = [ "RoundI", "AttackI", "ReadyI", "WarpI", "BlowI", "Event1", "Event2", "Event3", "Approach", "Attack", "Ready", "Blow", "Dash", "Caution", "Interval", "BackStep", "Damage", "Finish", "Dead" ];

export const DIR_PASO = [ "0x4a7870", "0x4a7c20", "0x4a7fe0", "0x4a4fd0", "0x4a52a0", "0x4a54c0", "0x4a5580", "0x4a8690", "0x4a5750", "0x4a58b0", "0x4a8850", "0x4a5c60", "0x4a5e70", "0x4a6360", "0x4a66d0", "0x4a6a50", "0x4a90d0", "0x4a6df0", "0x4a9190" ];

export const ANIM_WALTER = {
  0: 0,
  1: 1,
  2: 2,
  3: 3,
  4: 4,
  5: 5,
  6: 6,
  7: 7,
  8: 8,
  9: 9,
  10: 10,
  11: 11,
  12: 12,
  13: 13,
  14: 14,
  15: 15,
  16: 16,
  17: 17,
  18: 18,
  19: 19,
  20: 20,
  21: 21,
  22: 22,
  23: 23,
  26: 24,
  33: 25,
  34: 26,
  35: 27,
  36: 28,
  41: 29,
  42: 30,
  49: 31
};

export const ANIM_CUERPO_BASE = 32;

export const A = {
  NT: 0,
  CAMINA: 1,
  ATRAS: 2,
  CORRE: 3,
  XXU: 18,
  XXD: 19,
  CAE_U: 20,
  CAE_D: 21,
  SUBE_U: 22,
  SUBE_D: 23,
  TIRADO: 26,
  ARMA_SUBE: 33,
  ARMA_APUNTA: 34,
  ARMA_TIRO: 35,
  ARMA_BAJA: 36,
  GOLPE_A: 41,
  GOLPE_B: 42,
  GIRO: 49
};

export const MODELOS = {
  walter: [ 5, 0 ],
  cuerpo: [ 6, 1 ],
  pistola: [ 9, 4 ]
};

export const HUESO_MANO = [ 50, 49 ];

export const HUESO_CUERPO_LANZAS = 10;

export const C = {
  BASE: [ 0, -40, -2e3 ],
  CENTRO: [ 0, 0, -2600 ],
  CERCA_CUERPO: 1200,
  VUELTA: 600,
  LLEGO: 120,
  CERCA: 200,
  MEDIO: 400,
  LEJOS: 3e3,
  COS_FRENTE: .5,
  COS_DISPARO: .7071068,
  COS_APUNTA: .258819,
  COS_DE_ESPALDAS: -.8660254,
  GIRO_CAMINA: Math.PI / 2,
  GIRO_GOLPE: Math.PI / 4,
  GIRO_ARMA: Math.PI / 6,
  GIRO_APUNTA: Math.PI / 36,
  CAMINA: 400,
  CORRE: 800,
  SALTO: 4e3,
  ESPERA_APUNTAR: [ 3, 3, 2, 1.5, 1 ],
  DISPARO: 3e3,
  BARRIDO_R0: 200,
  BARRIDO_R1: 300,
  BARRIDO_V: 150,
  EVENTO1_SEG: 3,
  GOLPES_DECAE: 1.6,
  ARMA_X3: 1 / 3,
  PLATA_X5: 5,
  CAIDO_SONIDO: 197
};

export const SON = {
  VOZ1: 60401,
  VOZ2: 60402,
  VOZ3: 60403,
  CARGA: 40048,
  TIRO: 40045,
  GOLPE_INMUNE: 60453,
  CUERPO_LATE: 61450,
  CUERPO_GRITA: 60452,
  CUERPO_LANZA: 60451,
  CUERPO_OCHO: 50802
};

export const GOLPE = {
  PISTOLAZO: "BAK_KILLER_PIPE",
  PISTOLAZO_FUERTE: "BAK_KILLER_PIPE_ST",
  TIRO: "BAK_KILLER_SHOOT",
  BARRIDO: "BAK_KILLER_BLOWOFF"
};

const frente = r => [ Math.sin(r), Math.cos(r) ];

export class KillerLast {
  constructor({pj: pj, anim: anim, m: m, def: def, param: param}) {
    this.tipo = "KILLER";
    this.id = "KILLER_LAST";
    this.pj = pj;
    this.anim = anim;
    this.m = m;
    this.pos = [ ...def?.pos || [ -1e3, 0, 1580 ] ];
    this.rot = def?.rumbo ?? 1.5;
    this.posAnt = [ ...this.pos ];
    this.rotAnt = this.rot;
    this.radio = 100;
    this.radioGolpe = 110;
    this.alto = 380;
    this.centroAlto = 200;
    this.hp = this.hpMax = param?.vida ?? 700;
    this.aguante = this.aguanteMax = param?.aguante ?? 700;
    this.cond = 1;
    this.paso = P.RONDA_I;
    this.sub = 0;
    this.activo = false;
    this.muerto = false;
    this.w = {
      objetivo: [ ...this.pos ],
      timer: 0,
      timer2: 0,
      golpes: 0,
      golpesT: 0,
      ataque: null,
      ventana: null,
      alcance: 0,
      total: 0,
      venganza: 0,
      golpeado: false,
      balas: [ 10, 10 ],
      disparoAcerto: false,
      flagRapido: false
    };
    this.golpeEnProceso = false;
    this.anim.poner(A.CAMINA);
  }
  get vulnerable() {
    const c = this.m.cuerpo;
    return !!c?.todas && this.paso > 7 && (this.paso <= 15 || this.paso === P.DANIO && this.sub <= 0);
  }
  caido() {
    return this.cond === 9;
  }
  intocable() {
    return this.muerto;
  }
  get sinSangre() {
    return !this.vulnerable;
  }
  cambiar(p, sub = 0) {
    this.paso = p;
    this.sub = sub;
  }
  ponerAnim(n) {
    this.anim.poner(n);
  }
  progreso() {
    return this.anim.t / this.anim.dur;
  }
  quedan(seg) {
    return this.anim.fin || this.anim.dur - this.anim.t <= Math.round(seg * 30 * Math.abs(this.anim.vel));
  }
  cuadro() {
    return this.anim.cuadro;
  }
  distJ(j) {
    return distXZ(this.pos, j.pos);
  }
  cosA(p) {
    const d = distXZ(p, this.pos);
    if (d < .001) return 1;
    const [fx, fz] = frente(this.rot);
    return (fx * (p[0] - this.pos[0]) + fz * (p[2] - this.pos[2])) / d;
  }
  girarHacia(p, vel) {
    const a = rumboHacia(p, this.pos), d = envolver(a - this.rot), max = vel * DT;
    this.rot = envolver(this.rot + Math.max(-max, Math.min(max, d)));
  }
  camino(dest) {
    const p = this.m.camino?.(this, dest);
    return p || dest;
  }
  avanzar(v) {
    const [fx, fz] = frente(this.rot);
    this.m.mover(this.pos, fx * v * DT, fz * v * DT, this.radio);
  }
  sonido(id) {
    this.m.sonido?.(id, this.pos);
  }
  puedeTirar(j) {
    if (this.distJ(j) > C.LEJOS || this.cosA(j.pos) < C.COS_DISPARO) return 0;
    const [hx, hz] = frente(j.rot), d = distXZ(this.pos, j.pos) || 1;
    const mira = (hx * (this.pos[0] - j.pos[0]) + hz * (this.pos[2] - j.pos[2])) / d;
    if (mira < -.7071068) return 2;
    return this.m.vista?.([ this.pos[0], this.pos[1] - 300, this.pos[2] ], [ j.pos[0], j.pos[1] - 150, j.pos[2] ]) === false ? 0 : 1;
  }
  cercaDelCuerpo(j) {
    return distXZ(C.CENTRO, j.pos) < C.CERCA_CUERPO;
  }
  tick() {
    this.posAnt = [ ...this.pos ];
    this.rotAnt = this.rot;
    if (!this.activo || this.muerto && this.paso !== P.MUERTO) {
      this.anim.avanzar();
      return;
    }
    const j = this.m.jugador();
    this.w.golpesT += DT;
    if (this.w.golpesT >= C.GOLPES_DECAE) {
      this.w.golpesT = 0;
      this.w.golpes = Math.max(0, this.w.golpes - 1);
    }
    const c = this.m.cuerpo;
    if (c && this.m.bandera?.(1904) && c.lanzas < 0) {
      c.lanzas = 0;
      this.cambiar(P.EVENTO1);
    }
    const fn = PASOS[this.paso];
    if (fn) fn.call(this, j);
    this.w.golpeado = false;
    this.anim.avanzar();
    if (this.anim.n === A.CAMINA) this.avanzar(C.CAMINA); else if (this.anim.n === A.CORRE) this.avanzar(C.CORRE);
    const y = this.m.piso?.(this.pos);
    if (y != null) this.pos[1] = y;
  }
  armarGolpe(golpe, desde, hasta, alcance, {barrido: barrido = false} = {}) {
    this.w.ataque = {
      golpe: golpe,
      desde: desde,
      hasta: hasta,
      alcance: alcance,
      barrido: barrido,
      hecho: false
    };
  }
  probarGolpe(j) {
    const a = this.w.ataque;
    if (!a || a.hecho) return false;
    const f = this.cuadro();
    if (f < a.desde || f > a.hasta) return false;
    if (j.estado === 10 || j.estado === 7 && j.enAccion === false) return false;
    const d = this.distJ(j), r = a.barrido ? this.w.alcance + 40 : a.alcance;
    if (d > r || !a.barrido && this.cosA(j.pos) < .5 || Math.abs(j.pos[1] - this.pos[1]) > 300) return false;
    a.hecho = true;
    this.m.golpear?.(a.golpe, {
      desde: this.pos
    });
    return true;
  }
  disparar(j) {
    this.w.balas[1] = Math.max(0, this.w.balas[1] - 1);
    this.sonido(SON.TIRO);
    this.m.efecto?.("fogonazo", {
      pos: this.pos,
      rot: this.rot
    });
    const d = this.distJ(j);
    if (j.estado === 10 || d > C.DISPARO) return false;
    let acierta = false;
    if (d < C.MEDIO && this.cosA(j.pos) > C.COS_FRENTE) acierta = true; else {
      const [fx, fz] = frente(this.rot), vx = j.pos[0] - this.pos[0], vz = j.pos[2] - this.pos[2], t = vx * fx + vz * fz;
      acierta = t > 0 && Math.abs(vx * fz - vz * fx) < 60;
    }
    if (acierta && this.m.vista?.([ this.pos[0], this.pos[1] - 300, this.pos[2] ], [ j.pos[0], j.pos[1] - 150, j.pos[2] ]) === false) acierta = false;
    if (acierta) this.m.golpear?.(GOLPE.TIRO, {
      desde: this.pos,
      tiro: true
    });
    return acierta;
  }
  recibir(g) {
    if (!this.vulnerable) {
      this.w.golpeado = true;
      return false;
    }
    const w = this.w;
    let danio = g.danio ?? 10, forzado = false;
    if (g.bdt === 19) w.golpes = 0; else if (g.golpe === "BAK_PLAYER_SILVER_BULLET") {
      w.golpes = 3;
      danio *= C.PLATA_X5;
    } else {
      w.total++;
      w.golpes++;
      if (g.bdt === 0 || g.bdt === 1) danio *= C.ARMA_X3; else if (this.anim.n === A.GIRO && this.cuadro() > 11) w.golpes = 3;
    }
    w.golpesT = 0;
    this.hp -= danio;
    if (this.hp <= 0) {
      this.hp = 0;
      this.aguante = 0;
    } else this.aguante = Math.max(0, this.aguante - danio);
    const fuerte = [ 1, 3, 5, 7, 9, 11, 13, 15, 17, 20 ].includes(g.bdt);
    if (w.golpes >= 3) forzado = true; else if ([ 1, 9, 11 ].includes(g.bdt)) forzado = this.aguante <= 0; else if (g.bdt === 16) forzado = true; else forzado = this.aguante <= 0 || fuerte;
    if (this.hp <= 0) this.sonido(SON.GOLPE_INMUNE);
    w.golpeado = true;
    if (forzado && !this.golpeEnProceso) {
      this.golpeEnProceso = true;
      this.cambiar(P.DANIO);
      this.cond = 9;
      w.golpes = 0;
      const [fx, fz] = frente(this.rot), dz = g.dir ? g.dir[0] * fx + (g.dir[2] ?? g.dir[1] ?? 0) * fz : -1;
      const atras = dz > 0 ? 1 : 0, b = g.bdt ?? 2;
      let n = [ 1 ].includes(b) ? 8 : [ 2, 4, 6, 10 ].includes(b) ? 10 : [ 3, 5, 7, 12, 14, 15, 16, 17 ].includes(b) ? 12 : [ 8, 11, 19, 20 ].includes(b) ? 14 : [ 9, 13, 18 ].includes(b) ? 16 : 6;
      n += atras;
      if (n === 6) n = 8; else if (n === 7) n = 9;
      this.ponerAnim(n);
      this.m.cuerpo?.sangra();
      if (this.hp <= 0) {
        this.ponerAnim(A.TIRADO);
        this.sub = 1;
      }
    }
    return true;
  }
  levantar() {
    this.aguante = this.aguanteMax;
    this.cond = 8;
  }
  siguiente(j) {
    const d = this.distJ(j);
    if (d >= C.CERCA) {
      if (d < C.MEDIO) this.cambiar(P.ATAQUE); else this.cambiar(this.puedeTirar(j) === 1 ? P.APUNTA : P.ACERCA);
    } else this.cambiar(P.ATRAS);
  }
}

const PASOS = [];

PASOS[P.RONDA_I] = function(j) {
  const w = this.w;
  if (this.sub === 0) {
    this.cond = 1;
    this.ponerAnim(A.CAMINA);
    this.sub = 1;
  }
  if (this.sub === 1) {
    const b = C.BASE, dx = b[0] - this.pos[0], dz = b[2] - this.pos[2], L = Math.hypot(dx, dz) || 1;
    const a = azar01() * (Math.PI / 3), c = Math.cos(a), s = Math.sin(a);
    const vx = dx / L * c + dz / L * s, vz = -(dx / L) * s + dz / L * c;
    w.objetivo = [ b[0] + vx * C.VUELTA, 0, b[2] + vz * C.VUELTA ];
    this.sub = 2;
  }
  this.girarHacia(this.camino(w.objetivo), C.GIRO_CAMINA * (w.flagRapido ? 4 : 1));
  const d = this.distJ(j), cos = this.cosA(j.pos);
  if (j.estado !== 7) {
    if (!(d >= C.MEDIO || cos < C.COS_FRENTE || this.progreso() <= .8)) return this.cambiar(P.ATAQUE_I);
    if (this.cercaDelCuerpo(j) && j.tieneLanza) return this.cambiar(d >= C.CERCA ? P.SALTO_I : P.BARRIDO_I);
    const r = this.puedeTirar(j);
    if (r === 0 || j.apuntado !== 1 && !this.cercaDelCuerpo(j) && !j.tieneLanza) {
      if (distXZ(this.pos, w.objetivo) < C.LLEGO) this.sub = 1;
    } else return this.cambiar(P.APUNTA_I);
  } else if (this.puedeTirar(j)) return this.cambiar(P.APUNTA_I);
  if (w.golpeado) this.cambiar(P.SALTO_I);
};

PASOS[P.ATAQUE_I] = function(j) {
  ataque.call(this, j, false);
};

PASOS[P.ATAQUE] = function(j) {
  ataque.call(this, j, true);
};

function ataque(j, normal) {
  if (this.sub === 0) {
    this.cond = 5;
    const d = this.distJ(j), cos = this.cosA(j.pos);
    if (cos <= 0 || d >= 320 || this.anim.n === A.GOLPE_A) {
      this.ponerAnim(A.GOLPE_B);
      this.armarGolpe(GOLPE.PISTOLAZO_FUERTE, 78, 102, 230);
    } else {
      this.ponerAnim(A.GOLPE_A);
      this.armarGolpe(GOLPE.PISTOLAZO, 30, 50, 230);
    }
    this.sonido(SON.VOZ2);
    this.sub = 1;
  }
  if ((this.sub === 1 || this.sub === 2) && j.estado === 7) {
    this.w.ataque = null;
    this.sub = 3;
  }
  if (this.probarGolpe(j)) this.sub = 2;
  this.girarHacia(j.pos, C.GIRO_GOLPE);
  if (!this.quedan(.5)) return;
  this.w.ataque = null;
  const d = this.distJ(j);
  if (j.estado === 10) return this.cambiar(P.REMATE);
  if (!normal) {
    if (this.sub === 3) return void (this.sub = 0);
    if (this.sub === 2) return this.cambiar(d >= C.CERCA || !j.tieneLanza || !this.cercaDelCuerpo(j) ? P.RONDA_I : P.BARRIDO_I);
    if (d >= C.CERCA || !j.tieneLanza && azar01() >= .3) {
      if (d >= C.MEDIO) return this.cambiar(P.RONDA_I);
      return void (this.sub = 0);
    }
    return this.cambiar(P.BARRIDO_I);
  }
  if (d < C.CERCA && azar01() < .4) return this.cambiar(P.BARRIDO);
  if (d >= C.MEDIO) {
    const r = this.puedeTirar(j);
    if (r === 1) return this.cambiar(P.APUNTA);
    return this.cambiar(d <= C.LEJOS && !j.apuntado ? P.ACERCA : P.CARGA);
  }
  this.sub = 0;
}

PASOS[P.APUNTA_I] = function(j) {
  apunta.call(this, j, false);
};

PASOS[P.APUNTA] = function(j) {
  apunta.call(this, j, true);
};

function apunta(j, normal) {
  const w = this.w;
  switch (this.sub) {
   case 0:
    if (j.estado === 10) return this.cambiar(P.REMATE);
    this.cond = 5;
    this.ponerAnim(A.ARMA_SUBE);
    w.balas = [ 10, 10 ];
    this.sonido(SON.VOZ1);
    w.venganza = 0;
    this.sub = 1;
    return;

   case 1:
    this.girarHacia(j.pos, C.GIRO_ARMA);
    if (this.anim.fin) {
      this.ponerAnim(A.ARMA_APUNTA);
      this.sonido(SON.CARGA);
      w.timer = (azar01() * .2 + .8) * C.ESPERA_APUNTAR[Math.max(0, Math.min(4, this.m.nivel ?? 2))];
      w.timer2 = 0;
      this.sub = 2;
    }
    return;

   case 2:
    {
      if (w.timer >= .1) this.girarHacia(j.pos, C.GIRO_APUNTA);
      if (j.estado === 7) {
        if (w.timer < 1) w.timer = 1;
        w.timer2 = 0;
        return;
      }
      w.timer -= DT;
      if (w.timer <= 0 || w.golpeado) {
        this.sub = 3;
        return;
      }
      const d2 = this.distJ(j) ** 2;
      if (d2 > C.LEJOS * C.LEJOS || this.cosA(j.pos) < C.COS_APUNTA) {
        this.ponerAnim(A.ARMA_BAJA);
        this.sub = 8;
        return;
      }
      const [hx, hz] = frente(j.rot), dd = this.distJ(j) || 1, mira = (hx * (this.pos[0] - j.pos[0]) + hz * (this.pos[2] - j.pos[2])) / dd;
      if (mira >= C.COS_DE_ESPALDAS || !this.cercaDelCuerpo(j)) {
        w.timer2 = 0;
        if (!j.corriendo) return;
      } else {
        w.timer2 += DT;
        if (w.timer2 + .5 <= azar01() + .5) return;
      }
      this.ponerAnim(A.ARMA_BAJA);
      this.sub = 7;
      return;
    }

   case 3:
    this.ponerAnim(A.ARMA_TIRO);
    w.disparoAcerto = this.disparar(j);
    w.timer = .1;
    w.timer2 = 0;
    this.sub = 4;
    return;

   case 4:
    if (w.disparoAcerto) {
      this.sub = 5;
      return;
    }
    w.timer -= DT;
    if (w.timer <= 0) this.sub = 6;
    return;

   case 5:
   case 6:
   case 10:
    this.girarHacia(j.pos, C.GIRO_APUNTA);
    if (this.anim.fin) {
      if (this.sub === 10) {
        this.ponerAnim(A.ARMA_BAJA);
        this.sub = 7;
        return;
      }
      const otra = this.sub === 6 && Math.floor(azar01() * 10) < w.balas[1];
      if (j.estado === 10) {
        this.ponerAnim(A.ARMA_BAJA);
        this.sub = 9;
        return;
      }
      if (otra && this.cosA(j.pos) >= C.COS_FRENTE) {
        this.ponerAnim(A.ARMA_APUNTA);
        w.timer = (azar01() * .2 + .8) * C.ESPERA_APUNTAR[Math.max(0, Math.min(4, this.m.nivel ?? 2))];
        this.sub = 2;
        return;
      }
      this.ponerAnim(A.ARMA_BAJA);
      this.sub = this.cosA(j.pos) >= C.COS_FRENTE ? 7 : 8;
    }
    return;

   default:
    this.girarHacia(j.pos, C.GIRO_ARMA);
    if (!this.quedan(.2)) return;
    if (this.sub === 9) return this.cambiar(P.REMATE);
    if (!normal) {
      if (this.sub === 7) return this.cambiar(j.tieneLanza ? P.SALTO_I : P.RONDA_I);
      const d = this.distJ(j);
      if (d < C.CERCA) return this.cambiar(P.BARRIDO_I);
      if (d < C.MEDIO) return this.cambiar(P.ATAQUE_I);
      return this.cambiar(j.tieneLanza ? P.SALTO_I : P.RONDA_I);
    }
    {
      const d = this.distJ(j);
      this.cambiar(d < C.CERCA ? P.BARRIDO : d < C.MEDIO ? P.ATAQUE : P.CUIDADO);
    }
  }
}

PASOS[P.SALTO_I] = function(j) {
  const w = this.w;
  if (this.sub === 0) {
    this.m.efecto?.("estela", {
      de: this
    });
    this.sonido(SON.VOZ2);
    this.ponerAnim(A.NT);
    w.timer = 0;
    this.sub = this.distJ(j) >= 1e3 ? 2 : 1;
  }
  w.timer = Math.min(1, w.timer + 2 * DT);
  this.girarHacia(j.pos, Math.PI);
  const r = this.sub === 1 ? j.rot : this.rot, [fx, fz] = frente(r);
  const obj = [ j.pos[0] - fx * 200, j.pos[1], j.pos[2] - fz * 200 ];
  const dx = obj[0] - this.pos[0], dz = obj[2] - this.pos[2], L = Math.hypot(dx, dz), paso = DT * w.timer * C.SALTO;
  if (L <= paso) {
    this.m.mover(this.pos, dx, dz, this.radio);
    this.m.efecto?.("estela_fin", {
      de: this
    });
    return this.cambiar(!j.tieneLanza || this.distJ(j) >= C.CERCA ? P.ATAQUE_I : P.BARRIDO_I);
  }
  this.m.mover(this.pos, dx / L * paso, dz / L * paso, this.radio);
};

PASOS[P.BARRIDO_I] = function(j) {
  barrido.call(this, j, false);
};

PASOS[P.BARRIDO] = function(j) {
  barrido.call(this, j, true);
};

function barrido(j, normal) {
  const w = this.w;
  if (this.sub === 0) {
    this.cond = 5;
    this.ponerAnim(A.GIRO);
    this.armarGolpe(GOLPE.BARRIDO, 12, 49, 0, {
      barrido: true
    });
    w.alcance = C.BARRIDO_R0;
    this.sub = 1;
  }
  if (this.cuadro() > 11) w.alcance = Math.min(C.BARRIDO_R1, w.alcance + C.BARRIDO_V * DT);
  this.probarGolpe(j);
  if (!this.anim.fin) return;
  this.w.ataque = null;
  const cos = this.cosA(j.pos), d2 = this.distJ(j) ** 2;
  if (!normal) return this.cambiar(cos >= C.COS_FRENTE ? P.APUNTA_I : d2 < 16e4 ? P.ATAQUE_I : P.RONDA_I);
  this.cambiar(cos >= C.COS_FRENTE ? P.APUNTA : d2 < 16e4 ? P.ATAQUE : P.ACERCA);
}

PASOS[P.EVENTO1] = function(j) {
  if (this.sub === 0) {
    this.cond = 9;
    this.w.ataque = null;
    this.ponerAnim(A.CAE_D);
    this.w.timer = C.EVENTO1_SEG;
    this.sub = 1;
    return;
  }
  this.w.timer -= DT;
  if (this.w.timer <= 0) {
    this.levantar();
    this.ponerAnim(A.SUBE_D);
    this.cambiar(P.ACERCA);
  }
};

PASOS[P.EVENTO2] = function(j) {
  const w = this.w;
  switch (this.sub) {
   case 0:
    this.cond = 9;
    w.ataque = null;
    if (this.anim.n !== A.SUBE_D && this.anim.n !== A.CAE_D) {
      this.ponerAnim(A.XXD);
      w.timer = azar01() * 2;
      this.sub = 1;
    } else {
      this.ponerAnim(A.CAE_D);
      w.timer += azar01() * 3;
      this.sub = 2;
    }
    return;

   case 1:
    if (this.anim.fin) {
      this.ponerAnim(A.CAE_D);
      this.sub = 2;
    }
    return;

   case 2:
    w.timer -= DT;
    if (w.timer <= 0) {
      this.levantar();
      this.ponerAnim(A.SUBE_D);
      this.sub = 3;
    }
    return;

   default:
    if (!this.anim.fin) return;
    {
      const d = this.distJ(j);
      if (d < C.CERCA) return this.cambiar(P.BARRIDO_I);
      this.cambiar(this.cosA(j.pos) >= C.COS_FRENTE ? P.APUNTA_I : P.SALTO_I);
    }
  }
};

PASOS[P.EVENTO3] = function(j) {
  const w = this.w;
  switch (this.sub) {
   case 0:
    this.cond = 9;
    w.ataque = null;
    w.timer = azar01() * 2 + 3;
    if (this.anim.n === A.XXD) {
      this.sub = 4;
      return;
    }
    if (this.anim.n === A.CAE_D) {
      this.sub = 5;
      return;
    }
    this.ponerAnim(A.XXU);
    this.sub = 1;
    return;

   case 1:
    if (this.anim.fin) {
      this.ponerAnim(A.CAE_U);
      this.sub = 2;
    }
    return;

   case 2:
    w.timer -= DT;
    if (w.timer <= 0) {
      this.levantar();
      this.ponerAnim(A.SUBE_U);
      this.sub = 3;
    }
    return;

   case 3:
    if (this.anim.fin) this.siguiente(j);
    return;

   case 4:
    if (this.anim.fin) {
      this.ponerAnim(A.CAE_D);
      this.sub = 5;
    }
    return;

   default:
    w.timer -= DT;
    if (w.timer <= 0) {
      this.levantar();
      this.ponerAnim(A.SUBE_D);
      this.sub = 3;
    }
  }
};

PASOS[P.ACERCA] = function(j) {
  if (this.sub === 0) {
    this.cond = 3;
    if (this.anim.n !== A.SUBE_D && this.anim.n !== A.SUBE_U || this.anim.fin) this.ponerAnim(A.CAMINA);
    this.sub = 1;
  }
  if ((this.anim.n === A.SUBE_D || this.anim.n === A.SUBE_U) && !this.anim.fin) return;
  if (this.anim.n !== A.CAMINA) this.ponerAnim(A.CAMINA);
  this.girarHacia(this.camino(j.pos), C.GIRO_CAMINA * (this.w.flagRapido ? 4 : 1));
  if (this.progreso() > .8) {
    if (this.distJ(j) < C.MEDIO) return this.cambiar(P.ATAQUE);
    if (this.puedeTirar(j) === 1) return this.cambiar(P.APUNTA);
  }
};

PASOS[P.CARGA] = function(j) {
  const w = this.w;
  if (this.sub === 0) {
    const d = this.distJ(j);
    if (!j.apuntado && d < C.MEDIO) {
      if (d < C.CERCA) return this.cambiar(P.BARRIDO);
      return this.cambiar(P.ATAQUE);
    }
    this.cond = 3;
    this.ponerAnim(A.CORRE);
    w.timer = 0;
    this.sub = 1;
  }
  if (this.sub === 1) {
    this.girarHacia(this.camino(j.pos), Math.PI * (w.flagRapido ? 4 : 1));
    w.timer += DT;
    if (this.distJ(j) < C.MEDIO && this.cosA(j.pos) >= C.COS_FRENTE) {
      if (w.timer >= 1) {
        this.ponerAnim(A.GIRO);
        this.armarGolpe(GOLPE.BARRIDO, 12, 49, 0, {
          barrido: true
        });
        w.alcance = C.BARRIDO_R0;
        this.sub = 2;
        return;
      }
      return this.cambiar(P.ATAQUE);
    }
    return;
  }
  if (this.sub === 2) {
    if (this.cuadro() > 11) w.alcance = Math.min(C.BARRIDO_R1, w.alcance + C.BARRIDO_V * DT);
    this.probarGolpe(j);
    if (this.anim.fin) {
      w.ataque = null;
      w.timer = 1;
      this.ponerAnim(4);
      this.sub = 3;
    }
    return;
  }
  w.timer -= (azar01() * 2 + 1) * DT;
  if (w.timer > 0) return;
  const d2 = this.distJ(j) ** 2;
  if (d2 > 1e6 && this.puedeTirar(j) === 1) return this.cambiar(P.APUNTA);
  this.cambiar(this.cosA(j.pos) < 0 ? P.CUIDADO : P.ACERCA);
};

PASOS[P.CUIDADO] = function(j) {
  if (this.sub === 0) {
    this.cond = 2;
    if (this.puedeTirar(j) === 1) return this.cambiar(P.APUNTA);
    this.ponerAnim(A.CAMINA);
    this.sub = 1;
  }
  this.girarHacia(this.camino(j.pos), Math.PI * (this.w.flagRapido ? 2 : 1));
  const d2 = this.distJ(j) ** 2;
  if (d2 < 4e4) return this.cambiar(P.BARRIDO);
  if (this.cosA(j.pos) > .9914449) {
    if (d2 < 16e4) return this.cambiar(P.ATAQUE);
    this.cambiar(this.puedeTirar(j) === 1 ? P.APUNTA : P.ACERCA);
  }
};

PASOS[P.PAUSA] = function(j) {
  const w = this.w;
  if (this.sub === 0) {
    this.cond = 4;
    this.ponerAnim(A.CAMINA);
    w.timer = 0;
    w.timer2 = 0;
    const dx = this.pos[0] - j.pos[0], dz = this.pos[2] - j.pos[2], L = Math.hypot(dx, dz) || 1;
    w.objetivo = [ this.pos[0] + dx / L * 1e3, 0, this.pos[2] + dz / L * 1e3 ];
    this.sub = 1;
  }
  w.timer += DT;
  this.girarHacia(this.camino(w.objetivo), C.GIRO_CAMINA * (w.flagRapido ? 4 : 1));
  const d = this.distJ(j);
  if (d > 1e3) return this.cambiar(P.CUIDADO);
  if (d < C.MEDIO) {
    w.timer2 += DT;
    if (w.timer2 >= 2 || w.timer >= 2 && this.cosA(j.pos) >= C.COS_FRENTE) return this.cambiar(P.CARGA);
  }
  if (distXZ(this.pos, w.objetivo) < C.LLEGO) this.sub = 0;
};

PASOS[P.ATRAS] = function(j) {
  if (this.sub === 0) {
    this.cond = 4;
    this.ponerAnim(A.ATRAS);
    this.sub = 1;
  }
  const [fx, fz] = frente(this.rot);
  this.m.mover(this.pos, -fx * C.CAMINA * DT, -fz * C.CAMINA * DT, this.radio);
  this.girarHacia(j.pos, C.GIRO_GOLPE);
  if (this.anim.fin || this.anim.vuelta) this.cambiar(this.distJ(j) < C.MEDIO ? P.ATAQUE : P.ACERCA);
};

PASOS[P.DANIO] = function(j) {
  this.golpeEnProceso = false;
  switch (this.sub) {
   case 0:
    if (this.progreso() >= .8) {
      this.levantar();
      this.siguiente(j);
    }
    return;

   case 1:
    if (this.anim.n !== A.TIRADO) this.ponerAnim(A.TIRADO);
    this.sub = 2;
    return;

   case 2:
    if (this.cuadro() > C.CAIDO_SONIDO) {
      this.sonido(SON.VOZ3);
      this.sub = 3;
    }

   case 3:
    if (this.anim.fin) {
      this.cambiar(P.MUERTO);
    }
    return;
  }
};

PASOS[P.REMATE] = function(j) {
  const w = this.w;
  if (this.sub === 0) {
    this.cond = 3;
    this.ponerAnim(A.CAMINA);
    this.sonido(SON.VOZ1);
    w.timer = 2;
    this.sub = 1;
  }
  if (this.sub <= 2) {
    this.girarHacia(this.camino(j.pos), Math.PI);
    if (this.anim.vuelta) this.sub = 2;
    if (this.sub === 2 && this.puedeTirar(j)) {
      this.ponerAnim(A.ARMA_SUBE);
      this.sub = 3;
    }
  } else if (this.sub === 3 && this.anim.fin) {
    this.ponerAnim(A.ARMA_TIRO);
    this.sonido(SON.TIRO);
    this.sub = 4;
  }
  w.timer -= DT;
  if (w.timer <= 0) {
    this.sonido(azar01() >= .5 ? SON.VOZ2 : SON.VOZ1);
    w.timer = azar01() + 2;
  }
};

PASOS[P.MUERTO] = function() {
  if (this.sub === 0) {
    this.muerto = true;
    this.cond = 9;
    this.sub = 1;
    this.m.alMorir?.();
  }
};

export class KillerBody {
  constructor({pj: pj, anim: anim, m: m, def: def}) {
    this.tipo = "KILLER";
    this.id = "KILLER_BODY";
    this.pj = pj;
    this.anim = anim;
    this.m = m;
    this.pos = [ ...def?.pos || [ 0, 0, 0 ] ];
    this.rot = def?.rumbo ?? 0;
    this.lanzas = -1;
    this.huesosLanza = [];
    this.todas = false;
    this.grito = 0;
    this.sangre = 0;
    this.sangreT = 0;
    this.alAzar = false;
    this.timer = 0;
    this.sub = 0;
    this.activo = false;
    this.late = null;
    this.anim.poner(0);
  }
  quieto() {
    const n = Math.round(azar01() * 5 - .49);
    if (this.anim.n !== n) this.anim.poner(n);
    this.grito = 0;
    this.timer = (azar01() + 1) * 5;
  }
  tick() {
    if (!this.activo) {
      this.anim.avanzar();
      return;
    }
    if (this.sub === 0) {
      this.quieto();
      this.sub = 1;
    } else {
      this.timer -= DT;
      if (this.timer <= 0 && this.anim.n <= 4) this.sub = 0;
      if (this.anim.n > 4 && this.anim.fin) this.sub = 0;
    }
    if (!this.late) this.late = this.m.sonido?.(SON.CUERPO_LATE, this.pos, {
      loop: true
    }) || true;
    if (this.anim.n === 1) {
      if (this.anim.cuadro < 4) this.grito = 0; else if (!this.grito) {
        this.grito = 1;
        this.m.sonido?.(SON.CUERPO_GRITA, this.pos);
      }
    }
    if (this.sangre > 0) {
      this.sangreT -= DT;
      if (this.sangreT <= 0) {
        const L = this.huesosLanza.length;
        if (L) this.m.efecto?.("sangre_lanza", {
          lanza: this.huesosLanza[this.alAzar ? Math.floor(Math.random() * L) : L - 1]
        });
        this.sangreT = .2;
        this.sangre--;
      }
    }
    this.anim.avanzar();
  }
  clavar(lanza, walter) {
    this.huesosLanza.push(lanza);
    this.lanzas = Math.max(0, this.lanzas) + 1;
    let son = SON.CUERPO_LANZA;
    if (this.lanzas < 5) this.anim.poner(7); else if (this.lanzas < 8) this.anim.poner(8); else {
      this.anim.poner(9);
      this.todas = true;
      son = SON.CUERPO_OCHO;
    }
    this.sub = 1;
    this.timer = 99;
    this.m.sonido?.(son, this.pos);
    this.sangre = this.lanzas * 2;
    this.sangreT = 0;
    this.alAzar = false;
    if (walter && !walter.muerto) walter.cambiar(this.todas ? P.EVENTO3 : P.EVENTO2);
  }
  sangra() {
    if (this.lanzas <= 0) return;
    this.alAzar = true;
    this.sangre += Math.round(azar01() * 5 - .49);
    if (this.anim.n !== 9) this.anim.poner(9);
    this.sub = 1;
    this.m.sonido?.(SON.CUERPO_LANZA, this.pos);
  }
  parar() {
    try {
      this.late?.parar?.();
    } catch {}
    this.late = null;
  }
}
