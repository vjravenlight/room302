// SH4 web — FeniXVOID · Project Ravenlight
import { FPS, DT, envolver, rumboHacia, frente, dist3, distXZ, girarY, azar01 } from "./comun.js";

const AMORT_HITBACK = (30 / 31) ** 8;

export const C = {
  NADA: 0,
  NORMAL: 1,
  CAUTION: 2,
  CHASE: 3,
  ESCAPE: 4,
  BATTLE: 5,
  RISE: 8,
  DAMAGE: 9,
  DYING: 10,
  DEAD: 11,
  SPECIAL: 12,
  HIDDEN: 13,
  ERASE: 16,
  FLAGWAIT: 17,
  EVENT: 18
};

export const P = {
  INIT: 0,
  DESCENT: 1,
  DESCENT2: 2,
  WANDER: 3,
  CAUTION: 4,
  ANGRY: 5,
  APPROACH: 6,
  ATTACK: 7,
  AWAY: 8,
  WILD: 9,
  CAUTION4: 10,
  KABADDI: 11,
  SEARCH: 12,
  GATHER: 13,
  APPROACH4: 14,
  ATTACK4: 15,
  AWAY4: 16,
  LEAP: 17,
  DAMAGE: 18,
  DOWN: 19,
  GUARD: 20,
  WAIT: 21,
  NOMOVE: 22,
  JUMP: 23
};

export const NOMBRE_PASO = [ "Init", "Descent", "Descent", "Wander", "Caution", "Angry", "Approach", "Attack", "Away", "Wild", "Caution4", "Kabaddi", "Search", "Gather", "Approach4", "Attack4", "Away4", "Leap", "Damage", "Down", "Guard", "Wait", "NoMove", "Jump" ];

export const DIR_PASO = [ 4810704, 4811056, 4811056, 4827456, 4812784, 4814240, 4815072, 4815600, 4828224, 4829008, 4816240, 4829584, 4816800, 4830800, 4817888, 4818384, 4818864, 4831520, 4819648, 4820768, 4822576, 4824208, 4824400, 4824576 ];

export const A = {
  NT: 0,
  NT4: 1,
  BAJA: 2,
  SUBE: 3,
  WLK: 8,
  WLKB: 9,
  WLKR: 10,
  WLKL: 11,
  RUN: 16,
  RUNB: 17,
  RUNR: 18,
  RUNL: 19,
  DM: 24,
  DM4: 42,
  UP: 60,
  ROT: 62,
  YACE: 64,
  ANGRY1: 66,
  ANGRY2: 67,
  LOOK: 68,
  ATT1: 69,
  ATT2: 70,
  ATT3: 71,
  RATT1: 72,
  RATT2: 73,
  RATT3: 74,
  FALL: 75,
  LAND: 76,
  JUMP: 77
};

const PARTE_ANIM = [ 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 17, 16, 18, 19, 21, 20, 22, 23, 25, 24, 26, 27, 29, 28, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 48, 40, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 64, 56, 65, 66, 67, 68, 69, 70, 30, 31, 32, 71, 72, 73, 74, 75, 75, 76, 77, -3, -4, -5 ];

const NOMBRE_LOGICO = (() => {
  const n = [ "NT", "NT4", "BAJA", "SUBE", "NT_A", "NT4_A", "BAJA_A", "SUBE_A", "WLK", "WLKB", "WLKR", "WLKL", "WLKARM", "WLKB_A", "WLKR_A", "WLKL_A", "RUN", "RUNB", "RUNR", "RUNL", "RUN_A", "RUNB_A", "RUNR_A", "RUNL_A" ];
  for (let d = 0; d < 18; d++) n.push("DM" + d);
  for (let d = 0; d < 18; d++) n.push("DM4_" + d);
  n.push("UP0", "UP1", "ROT0", "ROT1", "YACE0", "YACE1", "ANGRY1", "ANGRY2", "LOOK", "ATT1", "ATT2", "ATT3", "RATT1", "RATT2", "RATT3", "FALL", "LAND", "JUMP1", "JUMP2", "JUMP3");
  return n;
})();

export const NOMBRES_ANIM_JINMEN = Array.from({
  length: 72
}, (_, k) => NOMBRE_LOGICO.filter((_, L) => PARTE_ANIM[L] === k + 6).join("/") || String(k));

export const NOMBRES_ANIM_JINMEN_EVENTO = [ "JUMP1", "JUMP2", "JUMP3" ];

export const esEvento = def => ((def?.estado_inicial ?? def?.ini ?? 0) & 15) === 6;

export function binJinmen(def) {
  return esEvento(def) ? "enemy_jinmen_event.bin" : "enemy_jinmen.bin";
}

export function parteModeloJinmen(def) {
  if (esEvento(def)) return {
    modelo: 0,
    texturas: 0
  };
  let t = def?.tipo_param || 0;
  if (t > 1) t -= 2;
  return {
    modelo: t & 1,
    texturas: t & 1
  };
}

const RW = {
  8: [ -4.8, 5.7, -4, 4.9, -3.5, 4, -3.3, 3.3, -2.4, 2.9, -2.3, 2.9, -2.2, 2.9, -.1, 2.9, -.1, 2.9, -.1, 2.8, -.4, 2.7, -.4, 2.5, .6, 3.2, .5, 3.3, .8, 3.3, 2, 3.5, 1.9, 3.3, 2, 3.2, 2, 3.2, 3.1, 4.6, 3.1, 4.9, 3.2, 4.4, 2.9, 3.7, 2.1, 2.8, 1.9, 2.6, 1.1, 2, .2, 2.4, .3, 2.4, .6, 2.6, .8, 2.7, .2, 3.4, 0, 3.4, -.9, 3, -2.2, 3.6, -2, 4, -2, 3.7 ],
  9: [ -1.8, -2.9, -1.9, -2.8, -1.8, -2.8, -1.9, -2.7, -1.8, -2.6, -1.9, -2.6, -1.6, -2.7, -1.7, -2.7, -1.2, -2.9, -1.2, -2.9, -.7, -3.2, -.4, -3.1, -.5, -3.2, 0, -3.3, 0, -3.3, -.1, -3.6, -.1, -3.6, .4, -3.3, .7, -3, 1.5, -2.9, 1.5, -2.9, 1.5, -2.9, 1.6, -2.9, 1.5, -2.9, 1.7, -2.9, 1.7, -2.9, 1.5, -2.9, 1.6, -2.9, 1, -3, 1, -2.9, 1.1, -2.9, .3, -3.1, .4, -3, .4, -1.2, .4, -1.2, .2, -3.3, .2, -3.3, 0, -3.1, -.1, -3.1, 0, -3 ],
  10: [ 5.9, -1, 5.9, -1, 5.9, -1, 6.2, -1.1, 6.2, -1.1, 6.2, -1.1, 5.4, -.7, 5.4, -.7, 5.4, -.7, 3.3, -.1, 3.3, -.1, 3.3, -.1, 2.1, .3, 2.1, .3, 2.1, .3, 1.2, .6, 1.2, .6, 1.2, .6, .4, .9, .4, .9, .4, .9, -.7, 2.4, -.7, 2.4, -.7, 2.4, .6, 1.9, .6, 1.9, .6, 1.9, 1.6, .7, 1.6, .7, 1.6, .7, 2.7, -.6, 2.9, -.8, 2.9, -.8, 3.3, -1.2, 3.5, -1.4, 3.4, -1.2, 3.6, -.7, 3.6, -.7, 3.6, -.7, 3.7, .1 ],
  11: [ -5.8, -1, -5.8, -1, -5.8, -1, -6.1, -1.1, -6.1, -1.1, -6.1, -1.1, -5.4, -.7, -5.4, -.7, -5.4, -.7, -3.3, -.1, -3.3, -.1, -3.3, -.1, -2.1, .3, -2.1, .3, -2.1, .3, -1.2, .6, -1.2, .6, -1.2, .6, -.4, .9, -.4, .9, -.4, .9, .7, 2.4, .7, 2.4, .7, 2.4, -.6, 1.9, -.6, 1.9, -.6, 1.9, -1.6, .7, -1.6, .7, -1.6, .7, -2.6, -.6, -2.9, -.8, -2.9, -.8, -3.3, -1.2, -3.5, -1.4, -3.4, -1.2, -3.7, -.7, -3.7, -.7, -3.7, -.7, -3.7, -.5 ],
  12: [ -2.5, 3.5, -2.5, 4.3, -2.6, 4.5, -2.5, 4.9, -2, 4.8, -1.7, 4.5, -1.3, 4, -1.3, 4, -.4, 2.9, -.1, 2.4, .2, 1.9, .5, 1.7, .7, 1.6, 1, 1.5, 1.4, 1.5, 1.9, 1.8, 2, 2, 2.1, 2.4, 2.3, 2.9, 2.2, 3.6, 2.3, 4.5, 2.3, 5.1, 2.1, 5.4, 1.8, 5.5, 1.9, 4.6, 1.9, 4.6, .5, 5.4, .3, 4.5, .2, 3.4, -.1, 2.5, -.2, 1.8, -.6, 1.4, -1.2, 1.1, -1.8, 1.4, -2.1, 1.7, -2.4, 2.5 ],
  13: [ -1.6, -2.9, -1.8, -2.8, -1.9, -2.7, -1.9, -2.7, -1.9, -2.6, -1.9, -2.7, -1.7, -2.7, -1.6, -2.7, -1.4, -2.8, -1, -2.9, -.7, -3.2, -.4, -3.1, -.4, -3.2, -.2, -3.4, -.2, -3.4, -.1, -3.6, .1, -3.5, .4, -3.3, .7, -3, .9, -3, 1.3, -2.9, 1.6, -2.9, 1.7, -2.8, 1.8, -2.8, 2, -2.8, 1.8, -2.9, 1.7, -2.9, 1.4, -2.9, 1.2, -2.9, 1, -2.9, .8, -3, .6, -3.1, .5, -3, .4, -1.3, .4, -1.3, .1, -3.3, 0, -3.2, -.1, -3.1, -.1, -3.1, 0, -3 ],
  14: [ 5.8, -.9, 5.8, -1, 6, -1.1, 6.1, -1.1, 6.3, -1.1, 6, -1, 5.8, -.9, 5.5, -.7, 4.9, -.6, 3.9, -.3, 3.2, -.1, 2.8, 0, 2.5, .1, 2.1, .3, 1.8, .4, 1.5, .5, 1.1, .6, 1.1, .7, .8, .9, .1, 1, .1, 1, -.8, 2.3, -.9, 2.4, -.5, 2.4, .2, 2.1, .7, 1.9, .9, 1.6, 1.2, 1.1, 1.6, .7, 2, .2, 2.4, -.4, 2.9, -.8, 3.1, -1.1, 3.3, -1.2, 3.4, -1.5, 3.5, -1.2, 3.6, -1, 3.5, -.8, 3.7, -.2, 3.7, .1 ],
  15: [ -5.8, -.9, -5.7, -1, -6, -1.1, -6.1, -1.1, -6.3, -1.1, -6, -1, -5.8, -.9, -5.5, -.7, -4.9, -.6, -3.9, -.3, -3.2, -.1, -2.8, 0, -2.5, .1, -2.1, .3, -1.8, .4, -1.5, .5, -1.1, .6, -1.1, .7, -.8, .9, -.1, 1, -.1, 1, .8, 2.3, .9, 2.4, .5, 2.4, -.2, 2.1, -.7, 1.9, -.9, 1.6, -1.2, 1.1, -1.6, .7, -2, .2, -2.4, -.4, -2.8, -.8, -3.1, -1.1, -3.3, -1.2, -3.4, -1.5, -3.5, -1.2, -3.6, -.9, -3.5, -.7, -3.8, -.4, -3.8, -.5 ]
};

const FM_RUN = [ 0, 3847, 3824, 2631, 5555, 6400, 6400, 6400, 6400, 6400, 6400, 6400, 719, 704, -48, -304 ];

const FM_RUNB = [ 0, -160, 418, 378, 378, 275, 275, 280, -7692, -8452, -9368, -5120, -5120, -5120, -5120, -5120, -5120, -5120, -5120, -4141, 1136, 1135, 741, 281, 281, -237, -237, -237, -218, -218 ];

const FM_RUNR = [ 0, 0, 320, 208, -96, -815, -1184, -288, 8049, 10240, 10240, 10240, 10240, 5952, 5456, 7408, 8448, 7520, 496, 80, 263, 263, -384, -608 ];

const FM_RUNL = [ 0, 0, 320, 208, -96, -815, -1184, -288, -3247, -5120, -10240, -10240, -10240, -10240, -10240, -10240, -5120, -5120, 496, 80, 263, 263, -384, -608 ];

const FM_ATRAS = [ 0, -5120, -5120, -5120, -5120, -5120, -5120, -5120, -5120, -5120, -5120, -2048, -2048, -2048, -2048, -2048, -2048, -2048 ];

const FM_ADELANTE = FM_ATRAS.map(v => -v);

const FM_RATT1 = [ 0, -39, 135, 271, 352, 408, 423, 384, 327, 199, 7751, 7495, 7680, 7680, 7680, 7680, 7680, 7680, 7680, 7680, 7680, 7680, 240, 640, 1152, 784, 679, 512, 288, 128, 71, 24, -24, -48, -79, -103, -120, -128, -128, -160, -184, -199, -231, -216, -207, -192, -152 ];

const FM_RATT3 = [ 0, -39, 39, 128, 192, 239, 272, 304, 312, 295, 288, 240, 207, 160, 135, 152, 135, 111, 96, 48, -32, -96, -175, 7416, 7279, 7680, 7680, 7680, 7680, 7680, 7680, 7680, 7680, 7680, 7680, -1840, 640, 1152, 783, 679, 512, 288, 128, 71, 24, -24, -48, -79, -103, -120, -128, -128, -160, -184, -199, -231, -216, -207, -192, -152 ];

const FM = {
  16: [ 0, FM_RUN ],
  20: [ 0, FM_RUN ],
  17: [ 0, FM_RUNB ],
  21: [ 0, FM_RUNB ],
  18: [ 1, FM_RUNR ],
  22: [ 1, FM_RUNR ],
  19: [ 1, FM_RUNL ],
  23: [ 1, FM_RUNL ],
  37: [ 0, FM_ATRAS ],
  55: [ 0, FM_ATRAS ],
  38: [ 0, FM_ADELANTE ],
  56: [ 0, FM_ADELANTE ],
  72: [ 0, FM_RATT1 ],
  74: [ 0, FM_RATT3 ]
};

const FS = {
  8: [ [ 0, 1 ], [ 18, 1 ], [ 16, -1 ], [ 33, -1 ] ],
  9: [ [ 1, 1 ], [ 21, 1 ], [ 12, -1 ], [ 33, -1 ] ],
  10: [ [ 0, 1 ], [ 19, 1 ], [ 16, -1 ], [ 35, -1 ] ],
  11: [ [ 1, 1 ], [ 20, 1 ], [ 17, -1 ], [ 39, -1 ] ],
  12: [ [ 10, 1 ], [ 26, 1 ], [ 7, -1 ], [ 26, -1 ] ],
  16: [ [ 0, 1 ], [ 11, 1 ] ],
  17: [ [ 16, 1 ], [ 20, 1 ] ],
  18: [ [ 11, 1 ], [ 13, 1 ] ],
  19: [ [ 16, 1 ], [ 17, 1 ] ],
  66: [ [ 13, 1 ], [ 15, 1 ], [ 26, 1 ], [ 28, 1 ] ],
  70: [ [ 17, 1 ] ],
  71: [ [ 24, 1 ], [ 34, 1 ] ],
  72: [ [ 20, 1 ], [ 22, 1 ] ],
  74: [ [ 33, 1 ], [ 35, 1 ] ]
};

FS[13] = FS[9];

FS[14] = FS[10];

FS[15] = FS[11];

FS[20] = FS[16];

FS[21] = FS[17];

FS[22] = FS[18];

FS[23] = FS[19];

const SON = {
  ATAQUE: 60101,
  MUERTE: 60103,
  DOLOR: 60104,
  CAE: 60105,
  PASO: 60106,
  EXCITA: 60107,
  GOLPE: 60108,
  LOOP: 61100
};

const GOLPE = {
  82: {
    golpe: "BAK_JIN_SCRATCH",
    danio: 10,
    shock: 20
  },
  83: {
    golpe: "BAK_JIN_STRIKE",
    danio: 15,
    shock: 50
  },
  84: {
    golpe: "BAK_JIN_STAB",
    danio: 15,
    shock: 50
  },
  85: {
    golpe: "BAK_JIN_BRINGDOWN",
    danio: 20,
    shock: 70
  }
};

const PALO_MODO = {
  1: [ 25, 2 ],
  2: [ 33, 4 ],
  3: [ 35, 8 ],
  4: [ 39, 16 ],
  5: [ 41, 32 ]
};

const NOMBRE_ITEM = {
  25: "ITEM_MID_MASHY",
  33: "ITEM_MASHY_NIBLICK",
  35: "ITEM_PITCHER",
  39: "ITEM_PITCHING_WEDGE",
  41: "ITEM_SAND_WEDGE",
  18: "ITEM_IRON_PIPE"
};

const ITEM_PUNTA = new Set([ 18, 19, ...Array.from({
  length: 23
}, (_, i) => 21 + i), 45, 46 ]);

const ITEM_PALO = new Set([ 21, 23, 25, 27, 29, 31, 33, 35, 37, 39, 41, 43 ]);

const HUESO = {
  SANGRE: 8,
  MIRA: 9,
  CABEZA: 11,
  CABEZA2: 22,
  MANO: 30
};

const ST = {
  SILENT: 2,
  READY: 3,
  LOCK: 4,
  ATTACK: 5,
  DAMAGE: 6,
  EVENT: 7,
  GODMODE: 9,
  DEAD: 10
};

const R30 = .5235988, R45 = .7853982, R60 = 1.0471976, R75 = 1.3089969, R90 = 1.5707964;

const azarS = () => Math.random() * 2 - 1;

function azarCargado(a, b) {
  let s = a;
  if (a < 0 && Math.random() < .5) s = -a;
  return ((b + 1) * b / (azar01() + b) - b) * s;
}

const sumar = (a, b) => [ a[0] + b[0], a[1] + b[1], a[2] + b[2] ];

const d2XZ = (a, b) => (a[0] - b[0]) ** 2 + (a[2] - b[2]) ** 2;

const compartido = new WeakMap;

function estadoDe(m) {
  let s = compartido.get(m);
  if (!s) {
    s = {
      jinmen: [],
      avisos: [],
      reloj: 0,
      idAviso: 0,
      trafico: null
    };
    compartido.set(m, s);
  }
  return s;
}

export class Jinmen {
  constructor(def, pj, anim, m) {
    this.tipo = "JINMEN";
    this.def = def;
    this.pj = pj;
    this.anim = anim;
    this.m = m;
    const ini = def.ini ?? (def.estado_inicial ?? 0) | (def.tipo_param || 0) << 8;
    this.iniRaw = ini;
    this.ini = (def.estado_inicial ?? ini) & 15;
    this.iniAlto = ini & 240;
    this.evento = this.ini === 6;
    this.tipoParam = def.tipo_param ?? ini >> 8 & 15;
    this.grande = this.tipoParam > 1;
    let t = this.tipoParam;
    if (t > 1) t -= 2;
    if (this.evento) t = 0;
    this.modo = ini >> 12 & 15;
    this.param = m.parametros("JINMEN", t);
    this.tipoFila = t;
    this.hp = this.hpMax = this.param.vida;
    this.aguante = this.aguanteMax = this.param.aguante;
    this.pos = [ ...def.pos ];
    this.rot = def.rumbo || 0;
    this.posAnt = [ ...this.pos ];
    this.rotAnt = this.rot;
    this.casa = [ ...def.pos ];
    this.rotCasa = this.rot;
    this.radio = 60;
    this.altoJuego = 160;
    this.alto = 320;
    this.centroAlto = 210;
    this.centro = [ this.pos[0], this.pos[1] - this.centroAlto, this.pos[2] ];
    this.sinPasos = true;
    this.cond = C.HIDDEN;
    this.paso = P.INIT;
    this.sub = 0;
    this.fase = 0;
    this.animL = -1;
    this.w = {
      objetivo: [ ...this.pos ],
      hitback: [ 0, 0, 0 ],
      vista: 0,
      cabeza: 0,
      animVel: 1,
      timer: 0,
      moveSpeed: 0,
      caida: 0,
      finishCount: 0,
      bCount: 0,
      vistaObj: null,
      attackKind: 0,
      target: 0,
      primerItem: 0,
      esperando: 0,
      setBlood: 0,
      trabado: 0,
      tTrabado: 0,
      ultimoGolpe: null,
      cuadros: 0,
      vy: 0,
      loop: false,
      rwAnt: -1
    };
    this.cabeza = {
      modo: 0,
      yaw: 0,
      pitch: 0,
      activa: false
    };
    this.golpes = [];
    this.danioPend = null;
    this.eds = [];
    this.edUsado = false;
    this.mov = [ 0, 0, 0 ];
    this.tAnt = 0;
    this.tAhora = 0;
    this.item = 0;
    this.armaEnMano = 0;
    this.itemAlMorir = null;
    this.itemSoltado = null;
    const palo = PALO_MODO[this.modo];
    const tomados = typeof m.palosTomados === "function" ? m.palosTomados() : 0;
    if (palo && !(tomados & palo[1])) this.w.primerItem = palo[0];
    if (typeof m.itemEnemigo === "function") this.item = m.itemEnemigo(this) || 0;
    if (!this.item && this.w.primerItem) this.item = this.w.primerItem;
    if (this.item) {
      this.armaEnMano = this.item;
      this.itemAlMorir = {
        id: this.item,
        nombre: NOMBRE_ITEM[this.item] || "item 0x" + this.item.toString(16)
      };
    }
    const s = estadoDe(m);
    if (s.jinmen.some(g => g.w.cuadros > 0)) {
      s.jinmen = [];
      s.avisos = [];
      s.reloj = 0;
      s.trafico = null;
    }
    s.jinmen.push(this);
    this.comp = s;
    if (!s.trafico) s.trafico = {
      master: null,
      espera: 30,
      tipo: 0,
      rate: 1,
      vel: 0
    };
    if (this.evento) anim.nombres = NOMBRES_ANIM_JINMEN_EVENTO;
    this.banderas = typeof m.banderasEntrada === "function" ? m.banderasEntrada(this) : def.bandera_si || def.bandera_no ? {
      si: def.bandera_si || 0,
      no: def.bandera_no || 0
    } : null;
    if (this.banderas && !this.banderasListas()) {
      this.cond = C.FLAGWAIT;
      this.sinCuerpo = true;
    }
    this.animSet(this.evento ? A.JUMP : A.NT);
    this.radio = 60;
  }
  get visible() {
    return ![ C.HIDDEN, C.FLAGWAIT, C.ERASE, 14 ].includes(this.cond);
  }
  caido() {
    return this.paso === P.DOWN || this.paso === P.DAMAGE && (this.sub === 2 || this.sub === 5);
  }
  persigue() {
    return this.visible && this.cond !== C.DEAD && ![ P.INIT, P.WANDER, P.WILD, P.WAIT, P.NOMOVE, P.JUMP, P.DESCENT, P.DESCENT2 ].includes(this.paso);
  }
  intocable() {
    return this.cond === C.DEAD || !this.visible || this.evento || this.paso === P.WAIT || this.sinCuerpo;
  }
  get sinSangre() {
    return false;
  }
  recibir(g) {
    if (!this.intocable()) this.golpes.push(g);
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
  sonidoLoop(si) {
    if (si && !this.w.loop) {
      this.w.loop = true;
      this.sonido(SON.LOOP, true);
    } else if (!si && this.w.loop) {
      this.w.loop = false;
      this.sonido(null, true);
    }
  }
  dificil() {
    return (this.m.nivelAccion ?? this.m.nivel ?? 1) > 2;
  }
  banderasListas() {
    const b = this.banderas;
    if (!b) return true;
    const bandera = n => this.m.bandera ? !!this.m.bandera(n) : true;
    return (!b.si || bandera(b.si)) && (!b.no || !bandera(b.no));
  }
  indiceAnim(L) {
    if (this.evento) return L >= A.JUMP ? L - A.JUMP : 0;
    const k = PARTE_ANIM[L];
    return k >= 6 ? k - 6 : 0;
  }
  ponerBin(L, reiniciar = true) {
    if (reiniciar || this.animL !== L) {
      this.anim.poner(this.indiceAnim(L));
      this.w.rwAnt = -1;
    }
    this.animL = L;
  }
  animSet(n) {
    const w = this.w, cur = this.animL;
    if (this.armaEnMano && n < 24) n += 4;
    if (cur === -1) {
      this.ponerBin(n);
    } else {
      let distinta = n !== cur;
      const ligero = n >= 24 && n <= 31 || n >= 41 && n <= 49 || n === 59;
      const fuerte = n >= 32 && n <= 40 || n >= 50 && n <= 58;
      if (n === 8) {
        if (!distinta) return;
        this.ponerBin(n);
      } else if ([ 9, 10, 11, 13, 14, 15 ].includes(n)) {
        if (!distinta) return;
        this.ponerBin(n);
      } else if ([ 17, 18, 19, 21, 22, 23, 66, 67 ].includes(n)) {
        if (!distinta) {
          this.anim.t = 0;
          this.anim.fin = false;
        } else this.ponerBin(n, false);
        distinta = true;
      } else if (ligero || (n === 64 || n === 65) && cur >= 60 && cur <= 65) {
        if (distinta) this.ponerBin(n); else if (!this.anim.loop) {
          this.anim.t = 0;
          this.anim.fin = false;
          distinta = true;
        }
        w.animVel = azarS() * .4 + 1;
      } else if (fuerte) {
        if (!distinta) return;
        this.ponerBin(n, false);
        w.animVel = azar01() * .2 + 1;
      } else if (n === 64 || n === 65) this.ponerBin(n); else if (n === A.FALL) {
        if (!distinta) return;
        this.ponerBin(n);
        w.animVel = 1;
      } else if (n === A.LAND) {
        const v = azar01() * 1.5 + .5;
        w.animVel = v * v;
        this.ponerBin(n);
      } else if (n >= 77 && n <= 79) this.ponerBin(n); else this.ponerBin(n, false);
      if (!distinta) {
        this.anim.velocidad(w.animVel);
        this.ponerRadioAnim(n);
        return;
      }
    }
    this.anim.velocidad(w.animVel);
    this.ponerRadioAnim(n);
  }
  ponerRadioAnim(n) {
    this.radio = n > 15 && n < 24 ? 120 : 60;
  }
  animDirecta(n, {reiniciarSiIgual: reiniciarSiIgual = false} = {}) {
    if (this.animL === -1) this.ponerBin(n); else if (this.animL === n) {
      if (reiniciarSiIgual) {
        this.anim.t = 0;
        this.anim.fin = false;
      }
    } else this.ponerBin(n, false);
    this.anim.velocidad(this.w.animVel);
    this.radio = 60;
  }
  cambiarVelAnim() {
    this.w.animVel = azarCargado(-.3, .01) + 1;
    if (this.tipoFila !== 0 || this.m.jinmenRapido) this.w.animVel *= 1.2;
    this.anim.velocidad(this.w.animVel);
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
  dioVuelta() {
    return this.anim.n < 0 || this.anim.loop && this.anim.vuelta;
  }
  progreso() {
    return this.anim.t / this.anim.dur;
  }
  cuadro() {
    return this.anim.cuadro;
  }
  jPos() {
    return this.jugador().pos;
  }
  jCentro() {
    const p = this.jPos();
    return [ p[0], p[1] - 150, p[2] ];
  }
  dXZ() {
    const j = this.jugador();
    return j.existe ? distXZ(this.pos, j.pos) : 1e9;
  }
  d3() {
    const j = this.jugador();
    return j.existe ? dist3(this.pos, j.pos) : 1e9;
  }
  cosHacia(p) {
    const f = frente(this.rot), dx = p[0] - this.pos[0], dz = p[2] - this.pos[2], L = Math.hypot(dx, dz) || 1;
    return (f[0] * dx + f[2] * dz) / L;
  }
  jugadorMira() {
    const j = this.jugador();
    if (!j.existe) return 0;
    const f = frente(j.rot), dx = this.pos[0] - j.pos[0], dz = this.pos[2] - j.pos[2], L = Math.hypot(dx, dz) || 1;
    return (f[0] * dx + f[2] * dz) / L;
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
  atacando() {
    return this.jugador().estado === ST.ATTACK ? this.apuntado() === 1 ? 1 : 2 : 0;
  }
  jugadorExiste() {
    const j = this.jugador();
    return j.existe && j.estado !== 0;
  }
  jugadorAlerta() {
    return typeof this.m.jugadorAlerta === "function" ? !!this.m.jugadorAlerta() : false;
  }
  jugadorSigiloso() {
    return this.jugador().estado === ST.SILENT;
  }
  jugadorAtacable() {
    const j = this.jugador();
    if (!j.existe || [ ST.DAMAGE, ST.EVENT, ST.GODMODE, ST.DEAD ].includes(j.estado)) return false;
    return (this.m.relojAtaque?.() ?? this.comp.reloj) >= 5;
  }
  puedeAtacar() {
    const j = this.jugador();
    if (!j.existe || j.estado === ST.DAMAGE || j.estado === ST.DEAD) return false;
    return !this.hayAviso(7, 2, this.pos, true);
  }
  seVe(a, b) {
    return this.m.lineaDeVista ? !!this.m.lineaDeVista(a, b) : true;
  }
  tapado(a, b, h = 40) {
    return !this.seVe([ a[0], a[1] - h, a[2] ], [ b[0], b[1] - h, b[2] ]);
  }
  fueraDePantalla(p = this.pos) {
    if (typeof this.m.enPantalla === "function") return !this.m.enPantalla(this, p);
    const j = this.jugador();
    if (!j.existe) return true;
    const f = frente(j.rot), dx = p[0] - j.pos[0], dz = p[2] - j.pos[2], L = Math.hypot(dx, dz) || 1;
    return !((f[0] * dx + f[2] * dz) / L > .64 && L < 6e3 && this.seVe([ p[0], p[1] - 150, p[2] ], this.jCentro()));
  }
  enCono(d, ang, desde = this.pos, rot = this.rot, alto = 160) {
    const j = this.jugador();
    if (!j.existe) return false;
    const ojo = [ desde[0], desde[1] - alto, desde[2] ], c = this.jCentro();
    const v = [ c[0] - ojo[0], c[1] - ojo[1], c[2] - ojo[2] ], L = Math.hypot(v[0], v[1], v[2]);
    if (L > d) return false;
    const f = frente(rot);
    if ((f[0] * v[0] + f[2] * v[2]) / (L || 1) < Math.cos(ang)) return false;
    return this.seVe(ojo, c);
  }
  toca() {
    const j = this.jugador();
    if (!j.existe) return false;
    return distXZ(this.pos, j.pos) <= this.radio + (this.m.radioJugador ?? 40) + 8 && Math.abs(this.pos[1] - j.pos[1]) < 250;
  }
  estrecho() {
    return typeof this.m.estrecho === "function" ? !!this.m.estrecho(this.pos) : false;
  }
  aviso(kind, tipo, pos, radio, t) {
    const id = ++this.comp.idAviso;
    this.comp.avisos.push({
      kind: kind,
      tipo: tipo,
      pos: [ ...pos ],
      radio: radio,
      t: t,
      de: this,
      id: id
    });
    return id;
  }
  hayAviso(kind, tipo, pos, ajeno = false) {
    let mejor = null, dm = Infinity;
    for (const a of this.comp.avisos) {
      if (a.t <= 0 || a.tipo !== tipo || kind != null && a.kind !== kind || ajeno && a.de === this) continue;
      const d = dist3(a.pos, pos);
      if (d <= a.radio && d < dm) {
        dm = d;
        mejor = a;
      }
    }
    return mejor;
  }
  avisoGrupo() {
    return this.hayAviso(7, 5, this.pos, true) || this.hayAviso(7, 2, this.pos, true);
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
    this.aguante = Math.min(this.aguanteMax, this.hp, this.aguante + this.param.recupera * DT);
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
  avanzar(v) {
    const f = frente(this.rot, v * DT);
    this.mov[0] += f[0];
    this.mov[2] += f[2];
  }
  bloqueado() {
    return !!this.w.trabado;
  }
  puntoAdelante(rumbo, d) {
    const p = this.pos, q = r => [ p[0] + Math.sin(r) * d, p[1], p[2] + Math.cos(r) * d ];
    let r = rumbo;
    if (!this.tapado(p, q(r), 60)) return q(r);
    const s = this.ladoMasLibre(rumbo, d) >= 0 ? 1 : -1;
    for (let i = 0; i < 5; i++) {
      r += s * R30;
      if (!this.tapado(p, q(r), 60)) break;
    }
    return q(r + s * R30);
  }
  ladoMasLibre(r, d) {
    if (typeof this.m.rayo !== "function") return Math.random() < .5 ? 1 : -1;
    const o = [ this.pos[0], this.pos[1] - 60, this.pos[2] ], lx = Math.cos(r) * d, lz = -Math.sin(r) * d;
    const a = this.m.rayo(o, [ o[0] + lx, o[1], o[2] + lz ]), b = this.m.rayo(o, [ o[0] - lx, o[1], o[2] - lz ]);
    const k = (a ? a.dist : d) - (b ? b.dist : d);
    return Math.abs(k) < 15e-6 ? 0 : k > 0 ? 1 : -1;
  }
  ladoLibre() {
    if (typeof this.m.rayo !== "function") return 0;
    const j = this.jPos(), v = [ j[0] - this.pos[0], 0, j[2] - this.pos[2] ], L = Math.hypot(v[0], v[2]) || 1;
    const lat = [ v[2] / L * 600, 0, -v[0] / L * 600 ], o = [ this.pos[0], this.pos[1] - 60, this.pos[2] ];
    const a = this.m.rayo(o, sumar(o, lat)), b = this.m.rayo(o, [ o[0] - lat[0], o[1], o[2] - lat[2] ]);
    const da = a ? a.dist : 600, db = b ? b.dist : 600, d = da - db;
    return Math.abs(d) < 15e-6 ? 0 : d > 0 ? 1 : -1;
  }
  lado(v) {
    const f = frente(this.rot), c = f[2] * v[0] - f[0] * v[2];
    return Math.abs(c) < 15e-6 ? 0 : c > 0 ? 1 : -1;
  }
  camino(dest) {
    if (typeof this.m.camino === "function") return this.m.camino(this, dest);
    return this.tapado(this.pos, dest, 100) ? null : dest;
  }
  verA(tipo) {
    const w = this.w;
    if (tipo === w.vista) return;
    if (tipo > 0 && tipo < 5) w.cabeza = 1; else if (tipo === 5 && w.cabeza) {
      w.cabeza = 0;
      w.vista = 5;
      return;
    }
    w.vista = tipo;
  }
  cabezaControl() {
    const w = this.w, c = this.cabeza;
    if (w.vista === 1 && !this.jugador().existe) w.vista = 0;
    if ((w.vista === 2 || w.vista === 3) && !(w.vistaObj && w.vistaObj.cond !== C.DEAD)) {
      w.vistaObj = null;
      w.vista = 0;
    }
    c.modo = w.vista;
    c.activa = !!w.cabeza;
    if (!w.cabeza) return;
    const cab = [ this.pos[0], this.pos[1] - (this.fase === 1 ? 137 : 251), this.pos[2] ];
    let t = null;
    if (w.vista === 1) t = this.jCentro(); else if (w.vista === 2 || w.vista === 3) t = w.vistaObj.centro || w.vistaObj.pos; else if (w.vista === 4) t = w.verPunto;
    let yaw = 0, pitch = 0;
    if (t) {
      w.verPunto = t;
      yaw = envolver(rumboHacia(t, cab) - this.rot);
      pitch = Math.atan2(cab[1] - t[1], Math.hypot(t[0] - cab[0], t[2] - cab[2]) || 1);
      const L = Math.hypot(yaw, pitch);
      if (L > R60) {
        yaw *= R60 / L;
        pitch *= R60 / L;
      }
    }
    const u = R90 * DT, ir = (a, b) => a + Math.max(-u, Math.min(u, b - a));
    c.yaw = ir(c.yaw, yaw);
    c.pitch = ir(c.pitch, pitch);
  }
  hueso(i) {
    const r = this.pj?.reproductor, lugar = r?.enElLugar;
    try {
      if (!r?.poner || !this.anim.anim) throw 0;
      if (r.anim !== this.anim.anim) r.poner(this.anim.anim);
      r.t = this.anim.t;
      r.loop = this.anim.loop;
      r.enElLugar = false;
      const pose = r.avanzar(0);
      return sumar(this.pos, girarY([ pose.absPos[i * 3], pose.absPos[i * 3 + 1], pose.absPos[i * 3 + 2] ], this.rot));
    } catch {
      const cuatro = this.fase === 1 || this.animL >= 16 && this.animL < 24 || this.animL >= 72 && this.animL <= 74;
      const t = i === HUESO.MANO ? this.animL >= 69 && this.animL <= 74 ? [ 0, cuatro ? -150 : -250, 250 ] : [ 60, -153, 44 ] : i === HUESO.SANGRE ? [ 0, cuatro ? -114 : -172, 0 ] : [ 0, cuatro ? -125 : -210, 20 ];
      return sumar(this.pos, girarY(t, this.rot));
    } finally {
      if (r && lugar !== undefined) r.enElLugar = lugar;
    }
  }
  tocaJugador(c, r) {
    const j = this.jugador();
    if (!j.existe || [ ST.EVENT, ST.GODMODE, ST.DEAD ].includes(j.estado)) return false;
    return distXZ(c, j.pos) <= r + (this.m.radioJugador ?? 40) && c[1] <= j.pos[1] + r && c[1] >= j.pos[1] - 360 - r;
  }
  golpeAtaque() {
    const w = this.w;
    if (!w.attackKind) return;
    const desde = this.animL === A.RATT1 ? 12 : this.animL === A.RATT3 ? 25 : 21;
    if (this.cuadro() < desde) return;
    let r = 60, adelante = 0;
    if (this.item === 18) {
      r += 60;
      adelante = 120;
    } else if (ITEM_PALO.has(this.item)) {
      r += 80;
      adelante = 140;
    }
    const c = sumar(this.hueso(HUESO.MANO), frente(this.rot, adelante));
    if (!this.tocaJugador(c, r)) return;
    const g = GOLPE[w.attackKind], j = this.jugador();
    this.m.golpear?.(this, g.danio, g.golpe, {
      shock: g.shock,
      dir: frente(rumboHacia(j.pos, this.pos))
    });
    if (!this.item && this.tipoParam === 1 && typeof this.m.robarArma === "function") {
      const it = this.m.robarArma(this);
      if (it) {
        this.item = this.armaEnMano = it;
        this.itemAlMorir = {
          id: it,
          nombre: NOMBRE_ITEM[it] || "item"
        };
      }
    }
    this.terminarAtaque();
  }
  terminarAtaque() {
    this.w.attackKind = 0;
  }
  charco() {
    this.m.charco?.(this, 160, false);
  }
  soltarItem() {
    if (!this.item) return;
    const it = this.item;
    const palo = Object.values(PALO_MODO).find(([id]) => id === this.w.primerItem);
    if (palo && this.w.primerItem === it) this.m.marcarPalo?.(palo[1]);
    this.w.primerItem = 0;
    const p = this.hueso(HUESO.SANGRE), y = this.m.piso ? this.m.piso([ p[0], p[1] - 60, p[2] ], 60, 400) : null;
    const pos = [ p[0], y != null && y < this.pos[1] + 400 ? y : this.pos[1], p[2] ];
    this.itemSoltado = {
      id: it,
      nombre: NOMBRE_ITEM[it] || "item 0x" + it.toString(16),
      pos: pos
    };
    this.item = 0;
    this.armaEnMano = 0;
    try {
      this.m.soltarItem?.(this, it, pos);
    } catch (err) {
      console.warn("jinmen ítem", err.message);
    }
  }
  edPaso(prueba, n) {
    this.eds.push(() => {
      if (prueba() && this.tomarED()) this.pasoA(n);
    });
  }
  edSub(prueba, d = 1) {
    this.eds.push(() => {
      if (prueba() && this.tomarED()) this.sub += d;
    });
  }
  edLlamar(prueba, f) {
    this.eds.push(() => {
      if (prueba() && this.tomarED()) f();
    });
  }
  tomarED() {
    if (this.edUsado) return false;
    this.edUsado = true;
    return true;
  }
  edFin(n) {
    this.edPaso(() => this.terminada(), n);
  }
  edCasiFin(n, s = .5) {
    this.edPaso(() => this.terminaPronto(s), n);
  }
  sentido(d, d2, ang, tipo) {
    const j = this.jugador();
    if (!j.existe) return tipo >= 2;
    const ve = this.enCono(d, ang) || dist3([ this.pos[0], this.pos[1] - 160, this.pos[2] ], j.pos) < d2;
    return tipo >= 2 ? !ve : ve;
  }
  verJugador(n) {
    const s = this.jugadorSigiloso();
    this.edPaso(() => this.sentido(s ? 1e3 : 3e3, s ? 200 : 600, s ? R30 : R60, 0), n);
  }
  perderJugador(n) {
    const s = this.jugadorSigiloso();
    this.edPaso(() => this.sentido(s ? 1400 : 4e3, s ? 400 : 1e3, s ? R45 : R90, 2), n);
  }
  verParaAtacar(n) {
    if (!this.jugadorAtacable()) return;
    const d = this.fase === 0 ? 300 : 600;
    this.edPaso(() => this.sentido(d, 100, R30, 0), n);
  }
  verGrupo() {
    this.edLlamar(() => !!this.avisoGrupo(), () => {
      if (this.d3() >= 1e3) this.pasoA(P.GATHER);
    });
  }
  tick() {
    this.posAnt = [ ...this.pos ];
    this.rotAnt = this.rot;
    this.mov = [ 0, 0, 0 ];
    this.eds.length = 0;
    this.edUsado = false;
    const s = this.comp, w = this.w;
    w.cuadros++;
    if (s.jinmen[0] === this) {
      s.reloj += DT;
      for (const a of s.avisos) a.t -= DT;
      s.avisos = s.avisos.filter(a => a.t > 0);
    }
    if (this.golpes.length) {
      this.danioPend = this.juntarGolpes(this.golpes, this.danioPend);
      this.golpes.length = 0;
    }
    if (this.cond === C.DEAD) {
      if (this.sub === 0) {
        this.sinCuerpo = true;
        this.radio = 0;
        this.sub = 1;
        this.sonidoLoop(false);
      }
      if (!this.anim.loop && !this.anim.fin) this.anim.avanzar(); else if (this.anim.loop) this.anim.velocidad(0);
      return;
    }
    if (this.cond === C.FLAGWAIT) {
      if (this.banderasListas()) {
        this.cond = C.HIDDEN;
        this.sinCuerpo = false;
      }
      return;
    }
    this.control();
    if (this.visible) {
      this.cabezaControl();
      this.tAnt = this.anim.t;
      this.anim.avanzar();
      this.tAhora = this.anim.t;
      if (this.anim.vuelta) this.tAnt -= this.anim.vel >= 0 ? this.anim.dur : -this.anim.dur;
      this.golpeAtaque();
    } else {
      this.tAnt = this.tAhora = this.anim.t;
    }
    for (const f of this.eds) f();
    this.eds.length = 0;
    if (this.danioPend && !(this.paso === P.DAMAGE && this.sub === 0)) this.danioPend = null;
    this.pasos();
    this.moverCuerpo();
    const c = this.hueso(HUESO.MIRA);
    this.centro = c;
    this.centroAlto = this.pos[1] - c[1];
    this.alto = this.fase === 2 ? 80 : this.fase === 1 || this.animL >= 16 && this.animL < 24 ? 200 : 320;
  }
  pasos() {
    const cs = FS[this.animL];
    if (!cs || !this.visible) return;
    const sentido = this.anim.vel >= 0 ? 1 : -1;
    for (const [c, sg] of cs) {
      if (sg !== sentido) continue;
      if (sentido > 0 ? this.tAnt < c && this.tAhora >= c : this.tAnt > c && this.tAhora <= c) this.sonido(SON.PASO);
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
    const w = this.w, n = this.animL;
    if (this.visible && this.anim.n >= 0) {
      const rw = RW[n], fm = FM[n];
      if (rw || fm) {
        let a = this.tAnt, b = this.tAhora;
        if (b < a) [a, b] = [ b, a ];
        const loc = [ 0, 0 ];
        if (rw) {
          const nf = rw.length / 2;
          for (let f = Math.floor(a); f < Math.ceil(b - 1e-6); f++) {
            const k = (f % nf + nf) % nf * 2, part = Math.min(b, f + 1) - Math.max(a, f);
            loc[0] += rw[k] * part;
            loc[1] += rw[k + 1] * part;
          }
        } else {
          const [tipo, t] = fm;
          for (let f = Math.floor(a); f < Math.ceil(b - 1e-6); f++) {
            const k = (f % t.length + t.length) % t.length, v = t[k] / 256 * (Math.min(b, f + 1) - Math.max(a, f));
            if (tipo === 1) loc[0] += v; else loc[1] += v;
          }
        }
        if (this.anim.vel < 0) {
          loc[0] = -loc[0];
          loc[1] = -loc[1];
        }
        const g = girarY([ loc[0], 0, loc[1] ], this.rot);
        this.mov[0] += g[0];
        this.mov[2] += g[2];
      }
    }
    const hb = w.hitback;
    this.mov[0] += hb[0] * DT;
    this.mov[2] += hb[2] * DT;
    hb[0] *= AMORT_HITBACK;
    hb[1] *= AMORT_HITBACK;
    hb[2] *= AMORT_HITBACK;
    const L = Math.hypot(this.mov[0], this.mov[2]), x0 = this.pos[0], z0 = this.pos[2];
    const enAire = this.fase === 7 || this.fase === 8 || this.paso === P.JUMP || this.paso === P.WAIT || this.cond === C.HIDDEN;
    if (enAire || this.sinCuerpo) {
      this.pos[0] += this.mov[0];
      this.pos[2] += this.mov[2];
    } else if (this.m.mover) this.m.mover(this, this.mov[0], this.mov[2]); else {
      this.pos[0] += this.mov[0];
      this.pos[2] += this.mov[2];
    }
    const hecho = Math.hypot(this.pos[0] - x0, this.pos[2] - z0);
    w.trabado = L > 1 && hecho < L * .3 ? 1 : 0;
    w.tTrabado = w.trabado ? w.tTrabado + DT : 0;
    if (!enAire && this.m.piso) this.gravedad();
  }
  gravedad() {
    const w = this.w, y = this.m.piso(this.pos, 80, 6e3);
    if (y == null) return;
    if (y > this.pos[1] + 2) {
      w.vy += 1568 * DT;
      this.pos[1] = Math.min(y, this.pos[1] + w.vy * DT);
      if (this.fase < 3) this.fase += 4;
    } else {
      this.pos[1] = y;
      w.vy = 0;
      if (this.fase >= 4 && this.fase <= 6) this.fase -= 4;
    }
  }
  control() {
    const w = this.w;
    this.revisarDanio();
    switch (this.paso) {
     case P.INIT:
      this.controlInit();
      break;

     case P.DESCENT:
     case P.DESCENT2:
      this.controlDescent();
      break;

     case P.WANDER:
      this.controlWander();
      break;

     case P.CAUTION:
      this.controlCaution();
      break;

     case P.ANGRY:
      this.controlAngry();
      break;

     case P.APPROACH:
      this.controlApproach();
      break;

     case P.ATTACK:
      this.controlAttack(false);
      break;

     case P.AWAY:
      this.controlAway();
      break;

     case P.WILD:
      this.controlWild();
      break;

     case P.CAUTION4:
      this.controlCaution4();
      break;

     case P.KABADDI:
      this.controlKabaddi();
      break;

     case P.SEARCH:
      this.controlSearch();
      break;

     case P.GATHER:
      this.controlGather();
      break;

     case P.APPROACH4:
      this.controlApproach4();
      break;

     case P.ATTACK4:
      this.controlAttack(true);
      break;

     case P.AWAY4:
      this.controlAway4();
      break;

     case P.LEAP:
      this.controlLeap();
      break;

     case P.DAMAGE:
      this.controlDamage();
      break;

     case P.DOWN:
      this.controlDown();
      break;

     case P.GUARD:
      this.controlGuard();
      break;

     case P.WAIT:
      this.controlWait();
      break;

     case P.NOMOVE:
      this.controlNoMove();
      break;

     case P.JUMP:
      this.controlJump();
      break;
    }
    if (w.attackKind && this.paso !== P.ATTACK && this.paso !== P.ATTACK4) this.terminarAtaque();
    const fondo = typeof this.m.fondoMundo === "function" ? this.m.fondoMundo() : null;
    if (fondo != null && this.pos[1] > fondo + 400 && this.fueraDePantalla() && this.ponerDescenso()) {
      if (!w.primerItem && this.item) this.m.devolverItem?.(this, this.item);
      this.pasoA(P.DESCENT);
    }
    const f = this.fase;
    if ((f < 2 || f > 3 && f !== 6) && this.cond !== C.DAMAGE) this.recuperar();
  }
  revisarDanio() {
    if (!this.danioPend) return;
    const p = this.paso;
    if (p === P.NOMOVE || p === P.JUMP) {
      this.danioPend = null;
      return;
    }
    const reflejo = () => {
      this.quitar(this.danioPend.danio || 0);
      this.danioPend = null;
    };
    if (p === P.DESCENT && this.sub < 2 || p === P.DOWN && this.cond === C.RISE) this.edLlamar(() => !!this.danioPend, reflejo); else if (p === P.DAMAGE) this.edLlamar(() => !!this.danioPend, () => this.danioAdicional()); else if (p === P.DOWN) this.edLlamar(() => !!this.danioPend, () => this.danioEnElPiso()); else this.edPaso(() => !!this.danioPend, P.DAMAGE);
  }
  controlInit() {
    const w = this.w;
    w.vista = 0;
    w.cabeza = 0;
    this.cabeza.yaw = this.cabeza.pitch = 0;
    w.animVel = 1;
    w.hitback = [ 0, 0, 0 ];
    if (this.ini === 6) {
      this.pasoA(P.JUMP);
      return;
    }
    if (this.ini === 7) {
      this.pasoA(P.NOMOVE);
      return;
    }
    if (this.iniAlto === 112 && d2XZ(this.casa, this.pos) + (this.casa[1] - this.pos[1]) ** 2 < 4e4) {
      this.sinCuerpo = true;
      this.pasoA(P.WAIT);
      return;
    }
    const y = this.m.piso ? this.m.piso(this.pos, 60, 60) : this.pos[1];
    if (y != null) {
      this.pasoA(this.grande ? P.GUARD : P.WILD);
      return;
    }
    this.pasoA(P.DESCENT2);
  }
  controlDescent() {
    const w = this.w;
    switch (this.sub) {
     case 0:
     case 99:
      {
        this.verA(0);
        this.sonidoLoop(false);
        this.cond = C.HIDDEN;
        this.fase = 7;
        this.altoJuego = 160;
        this.sinCuerpo = true;
        if (this.animL === -1 || this.animL !== A.FALL) {
          w.animVel = 1;
          this.animDirecta(A.FALL);
        }
        w.moveSpeed = azar01() * 5 + 1;
        if (this.sub === 99) {
          this.curar(this.hpMax * .25);
          w.timer = (azar01() + 1) * 3;
        } else if (this.grande || w.esperando) {
          w.timer = 0;
          w.esperando = 0;
        } else w.timer = azar01() * 3;
        this.sub = 1;
      }

     case 1:
      w.timer -= DT;
      if (w.timer > 0) return;
      this.sinCuerpo = false;
      this.cond = C.CAUTION;
      this.sub = 2;
      return;

     case 2:
      {
        const j = this.jugador();
        let dy = DT * w.moveSpeed * 1960;
        const y = this.m.piso ? this.m.piso(this.pos, 60, Math.max(400, dy + 200)) : null;
        let aterrizo = false;
        if (y != null && this.pos[1] + dy >= y) {
          dy = y - this.pos[1];
          aterrizo = true;
        } else if (!this.m.piso) {
          const yp = j.existe ? j.pos[1] : this.casa[1];
          if (this.pos[1] + dy >= yp) {
            dy = yp - this.pos[1];
            aterrizo = true;
          }
        }
        this.pos[1] += dy;
        if (aterrizo) {
          this.fase = 1;
          this.altoJuego = 120;
          this.radio = 120;
          this.animSet(A.LAND);
          this.sonido(SON.CAE);
          if (this.grande) this.sub = 4; else if (this.chequearSalto()) this.sub = 5; else this.sub = 3;
        }
        if (this.paso === P.DESCENT && j.existe) this.girarHacia(j.pos, DT * R30);
        if (this.grande || this.paso !== P.DESCENT || !j.existe) return;
        const v = [ this.pos[0] - j.pos[0], this.pos[2] - j.pos[2] ], d2 = v[0] * v[0] + v[1] * v[1], d = Math.sqrt(d2) || 1;
        if (d2 < 36e4) {
          this.mov[0] += v[0] / d * 1e3 * DT;
          this.mov[2] += v[1] / d * 1e3 * DT;
        } else if (d2 > 1e6) {
          this.mov[0] -= v[0] / d * 1e3 * DT;
          this.mov[2] -= v[1] / d * 1e3 * DT;
        }
        return;
      }

     case 3:
      this.edCasiFin(P.CAUTION4);
      return;

     case 4:
      this.edCasiFin(P.GUARD);
      return;

     case 5:
      this.edCasiFin(P.LEAP);
      return;
    }
  }
  controlWander() {
    const w = this.w;
    switch (this.sub) {
     case 0:
      this.fase = 0;
      this.altoJuego = 160;
      this.cambiarVelAnim();
      this.animSet(A.WLK);
      this.cond = C.NORMAL;
      this.verA(0);
      this.sonidoLoop(true);
      w.vistaObj = null;
      this.sub = 1;

     case 1:
      {
        const r = this.rot + azarCargado(R60, .017453292);
        w.objetivo = this.puntoAdelante(r, 400);
        this.sub = 2;
        break;
      }

     case 2:
      {
        if (this.chequearDescenso()) return;
        if (d2XZ(w.objetivo, this.pos) + (w.objetivo[1] - this.pos[1]) ** 2 < 4e4 || this.bloqueado()) {
          this.sub = 1;
          break;
        }
        const r = azar01();
        if (r < 1e-4 && !this.estrecho()) {
          this.animSet(A.BAJA);
          this.sub = 3;
          break;
        }
        if (r >= 5e-4) break;
        this.animDirecta(A.LOOK);
        this.sub = 4;
        break;
      }

     case 3:
      this.edCasiFin(P.WILD);
      return;

     case 4:
      this.edCasiFin(P.WANDER);
      return;
    }
    this.verGrupo();
    this.girarHacia(w.objetivo, DT * R60);
    this.verJugador(P.CAUTION);
    if (this.dioVuelta() && this.chequearSalto()) this.pasoA(P.LEAP);
  }
  controlCaution() {
    const w = this.w, j = this.jugador();
    let mira = j.existe ? [ ...j.pos ] : [ ...this.pos ];
    switch (this.sub) {
     case 0:
      this.fase = 0;
      this.altoJuego = 160;
      this.cond = C.CAUTION;
      this.cambiarVelAnim();
      this.animSet(A.WLK);
      this.verA(1);
      this.sonidoLoop(true);
      w.timer = 3;
      this.sub = 1;

     case 1:
      {
        if (!this.tapado(this.pos, mira) || !this.camino(mira)) {
          w.timer -= DT;
          if (!this.apuntado() && w.timer <= 0 && azar01() < .01 && !this.estrecho()) {
            this.animSet(A.BAJA);
            this.sub = 5;
            return;
          }
          if (this.d3() < 600) this.sub = 2;
        } else this.sub = 6;
        break;
      }

     case 2:
      {
        if (this.apuntado() && this.jugadorAlerta() && azar01() < .1) {
          this.pasoA(P.ANGRY);
          return;
        }
        if (!this.tapado(this.pos, mira) || !this.camino(mira)) {
          let lado = this.ladoLibre(), r = azar01();
          if (lado === 0) {
            lado = azar01() < .5 ? 1 : -1;
            r += r;
          }
          if (r > .5 && this.puedeAtacar()) {
            this.pasoA(P.APPROACH);
            return;
          }
          if (lado < 1) {
            this.animSet(A.WLKL);
            this.sub = 4;
          } else {
            this.animSet(A.WLKR);
            this.sub = 3;
          }
          w.timer = azar01() * 2 + 1;
        } else {
          this.animSet(A.WLK);
          this.sub = 6;
        }
        break;
      }

     case 3:
      mira = this.alrededor(mira, -R30);
      break;

     case 4:
      mira = this.alrededor(mira, R30);
      break;

     case 5:
      this.edCasiFin(P.CAUTION4);
      return;

     case 6:
      {
        const p = this.camino(mira);
        if (!p) this.sub = 2; else mira = p;
        if (!this.tapado(this.pos, j.pos)) {
          this.pasoA(P.APPROACH);
          return;
        }
        break;
      }
    }
    if (this.sub > 2) {
      w.timer -= DT;
      if (w.timer <= 0) {
        if (!this.puedeAtacar() || this.cosHacia(j.pos) < .8660254) this.sub = 2; else {
          this.pasoA(P.APPROACH);
          return;
        }
      }
    }
    this.girarHacia(mira, DT * R60);
    this.perderJugador(P.WANDER);
    if (this.toca()) {
      if (this.enCono(300, R75)) this.pasoA(P.ATTACK);
    } else if (this.dioVuelta() && this.chequearSalto()) this.pasoA(P.LEAP);
  }
  alrededor(p, ang) {
    const v = girarY([ p[0] - this.pos[0], 0, p[2] - this.pos[2] ], ang);
    return [ this.pos[0] + v[0], this.pos[1], this.pos[2] + v[2] ];
  }
  controlAngry() {
    const w = this.w;
    if (this.sub === 0) {
      this.fase = 0;
      this.altoJuego = 160;
      this.cond = C.CAUTION;
      if (azar01() < .2 && this.puedeAtacar()) {
        this.pasoA(P.ATTACK);
        return;
      }
      this.cambiarVelAnim();
      this.animDirecta(azar01() < .5 ? A.ANGRY1 : A.ANGRY2, {
        reiniciarSiIgual: true
      });
      this.sonido(SON.EXCITA);
      this.verA(1);
      this.sonidoLoop(true);
      this.sub = 1;
    } else if (this.sub === 1) this.edSub(() => this.terminada()); else if (this.sub === 2) {
      if (this.toca() && this.enCono(300, R75)) {
        this.pasoA(P.ATTACK);
        return;
      }
      if (azar01() < .3) {
        this.anim.t = 0;
        this.anim.fin = false;
        this.sub = 1;
        return;
      }
      if (this.grande) {
        this.pasoA(P.GUARD);
        return;
      }
      if (this.jugadorExiste() && (this.jugadorAlerta() || !this.apuntado())) {
        this.pasoA(P.CAUTION);
        return;
      }
      this.pasoA(P.APPROACH);
    }
  }
  controlApproach() {
    const j = this.jugador();
    if (!this.puedeAtacar()) {
      this.pasoA(P.CAUTION);
      return;
    }
    if (this.sub === 0) {
      this.fase = 0;
      this.altoJuego = 160;
      this.cond = C.CHASE;
      this.cambiarVelAnim();
      this.animSet(A.WLK);
      this.verA(1);
      this.sonidoLoop(true);
      this.sub = 1;
    }
    if (this.d3() < 300) {
      this.pasoA(P.ATTACK);
      return;
    }
    this.girarHacia(j.pos, DT * R60);
    this.perderJugador(P.WANDER);
    if (this.toca()) {
      if (this.enCono(300, R75)) this.pasoA(P.ATTACK);
      return;
    }
    if (!this.dioVuelta()) return;
    if (this.chequearSalto()) {
      this.pasoA(P.LEAP);
      return;
    }
    if (this.tapado(this.pos, j.pos)) this.pasoA(P.CAUTION);
  }
  controlAttack(cuatro) {
    const w = this.w;
    if (this.sub === 0) {
      this.aviso(7, 2, this.pos, 2e3, 3);
      this.fase = cuatro ? 1 : 0;
      this.altoJuego = cuatro ? 120 : 160;
      this.cond = C.BATTLE;
      this.verA(1);
      this.cambiarVelAnim();
      const it = this.item;
      let k = !it ? 0 : ITEM_PUNTA.has(it) ? azar01() < .5 ? 2 : 3 : 1;
      w.attackKind = 82 + k;
      if (k) k--;
      this.animSet((cuatro ? A.RATT1 : A.ATT1) + k);
      this.sonido(SON.ATAQUE);
      this.sub = !cuatro && this.grande ? 3 : 1;
    } else {
      const sig = cuatro ? P.AWAY4 : this.sub === 3 ? P.GUARD : P.AWAY;
      this.eds.push(() => {
        if (!this.terminada()) return;
        if (this.animL !== A.ATT1) this.sonido(SON.EXCITA);
        if (this.tomarED()) this.pasoA(sig);
      });
    }
    if (this.dificil()) this.girarHaciaJugador(DT * .2617994);
    if (!cuatro && this.animL === A.ATT3) this.avanzar(50);
  }
  controlAway() {
    const w = this.w, j = this.jugador();
    switch (this.sub) {
     case 0:
      {
        this.fase = 0;
        this.altoJuego = 160;
        this.cond = C.ESCAPE;
        this.verA(1);
        this.sonidoLoop(true);
        if ((azar01() < .3 || this.item && azar01() < .3) && !this.estrecho()) {
          this.animSet(A.BAJA);
          this.sub = 4;
          break;
        }
        this.cambiarVelAnim();
        this.animSet(A.WLKB);
        w.timer = azar01() + 2;
        this.sub = 1;
      }

     case 1:
     case 2:
      {
        const d = this.d3();
        if (d < 200) {
          this.pasoA(P.CAUTION);
          return;
        }
        w.timer -= DT;
        if (w.timer >= 0) break;
        if (d <= 600) {
          if (this.sub !== 2) {
            w.timer = azar01() * 3;
            this.sub++;
            break;
          }
        } else {
          if (!this.enCono(800, R60)) {
            this.pasoA(P.WANDER);
            return;
          }
          if (!this.jugadorAlerta() && azar01() < .5 && !this.estrecho()) {
            this.animSet(A.BAJA);
            this.sub = 3;
            break;
          }
        }
        this.pasoA(P.CAUTION);
        return;
      }

     case 3:
      this.edCasiFin(P.KABADDI);
      return;

     case 4:
      this.edCasiFin(P.AWAY4);
      return;
    }
    this.verGrupo();
    this.girarHaciaJugador(DT * R60);
    if (this.toca()) {
      if (this.enCono(300, R75)) this.pasoA(P.ATTACK);
    } else if (this.dioVuelta() && this.chequearSalto()) this.pasoA(P.LEAP);
  }
  controlWild() {
    const w = this.w;
    switch (this.sub) {
     case 0:
      this.fase = 1;
      this.altoJuego = 120;
      this.cambiarVelAnim();
      this.animSet(A.RUN);
      this.cond = C.NORMAL;
      this.verA(0);
      this.sonidoLoop(true);
      w.vistaObj = null;
      this.sub = 1;

     case 1:
      w.objetivo = this.puntoAdelante(this.rot + azarCargado(R60, .017453292), 600);
      this.sub = 2;
      break;

     case 2:
      if (this.chequearDescenso()) return;
      if (this.toca()) {
        this.pasoA(P.CAUTION4);
        return;
      }
      if (d2XZ(w.objetivo, this.pos) + (w.objetivo[1] - this.pos[1]) ** 2 < 9e4 || this.bloqueado()) this.sub = 1; else if (this.dioVuelta() && (azar01() < 1e-4 || this.estrecho())) {
        this.animSet(A.SUBE);
        this.sub = 3;
      }
      break;

     case 3:
      this.edCasiFin(P.WANDER);
      return;
    }
    this.girarHacia(w.objetivo, DT * R60 * (this.bloqueado() ? 3 : 1));
    if (this.dioVuelta()) {
      this.verGrupo();
      this.verJugador(P.KABADDI);
    }
  }
  controlCaution4() {
    const w = this.w;
    switch (this.sub) {
     case 0:
      this.cond = C.CAUTION;
      this.verA(1);
      this.fase = 1;
      this.altoJuego = 120;
      this.cambiarVelAnim();
      this.animSet(A.NT4);
      this.sonidoLoop(true);
      w.timer = azar01() + .5;
      if (this.chequearSalto()) {
        this.pasoA(P.LEAP);
        return;
      }
      this.sub = 1;
      return;

     case 1:
      {
        if (this.toca() || this.jugadorAlerta() || this.estrecho()) {
          this.animSet(A.SUBE);
          this.sub = 3;
          return;
        }
        w.timer -= DT;
        if (w.timer <= 0 && this.puedeAtacar()) {
          this.pasoA(this.jugadorExiste() && azar01() >= .4 ? P.KABADDI : P.APPROACH4);
          return;
        }
        if (this.atacando() === 1 && this.cosHacia(this.jPos()) > 0) {
          this.animSet(A.RUNB);
          this.sub = 2;
        }
        return;
      }

     case 2:
      this.edFin(P.SEARCH);
      return;

     case 3:
      this.edCasiFin(P.CAUTION);
      return;
    }
  }
  controlKabaddi() {
    const w = this.w, j = this.jugador(), d = this.d3();
    const elegirLado = hacia => {
      let lado;
      if (hacia) lado = this.lado([ hacia[0] - this.pos[0], 0, hacia[2] - this.pos[2] ]); else {
        lado = this.ladoLibre();
        if (lado === 0) lado = -this.lado([ j.pos[0] - this.pos[0], 0, j.pos[2] - this.pos[2] ]);
      }
      this.animSet(lado < 0 ? A.RUNL : A.RUNR);
    };
    switch (this.sub) {
     case 0:
      if (!this.avisoGrupo()) this.aviso(7, 5, this.pos, 2e3, 10);
      this.cond = C.CAUTION;
      this.verA(1);
      this.fase = 1;
      this.altoJuego = 120;
      this.cambiarVelAnim();
      elegirLado(null);
      this.sonidoLoop(true);
      this.sub = 1;
      break;

     case 1:
      this.edSub(() => this.terminada());
      break;

     case 2:
      {
        if (this.chequearDescenso()) return;
        if (this.apuntado() && azar01() < .25 || this.estrecho()) {
          this.animSet(A.SUBE);
          this.sub = 4;
          break;
        }
        if (this.puedeAtacar()) {
          if (azar01() < .5 && d < 600) {
            this.pasoA(P.ATTACK4);
            return;
          }
          if (this.jugadorMira() < -.5 || azar01() < .1) {
            this.animSet(A.RUN);
            w.timer = 2;
            this.sub = 3;
            return;
          }
        }
        if (!this.enCono(600, R90)) {
          this.pasoA(P.SEARCH);
          return;
        }
        const p = this.tapado(this.pos, j.pos) ? this.camino(j.pos) : null;
        elegirLado(p);
        this.sub = 1;
        break;
      }

     case 3:
      if (this.chequearDescenso()) return;
      w.timer -= DT;
      if (w.timer > 0 && this.puedeAtacar()) {
        this.girarHaciaJugador(DT * R60 * (this.bloqueado() ? 3 : 1));
        if (d < 600) this.edPaso(() => this.dioVuelta() || this.terminada(), P.ATTACK4);
        return;
      }
      this.sub = 2;
      break;

     case 4:
      this.edCasiFin(P.CAUTION);
      return;
    }
    if (this.sub > 2) return;
    const t = this.alrededor(j.pos, this.animL === A.RUNR ? -R30 : R30);
    this.girarHacia(t, DT * R60);
    this.avanzar(40);
  }
  controlSearch() {
    const w = this.w;
    switch (this.sub) {
     case 0:
      this.cond = C.CAUTION;
      this.verA(1);
      this.fase = 1;
      this.altoJuego = 120;
      this.cambiarVelAnim();
      this.sonidoLoop(true);
      if (this.d3() <= 600 && !this.estrecho()) {
        this.animSet(A.NT4);
        w.timer = azar01() * 3;
        this.sub = 1;
        return;
      }
      break;

     case 1:
      w.timer -= DT;
      if (w.timer > 0) {
        if (this.puedeAtacar()) this.verParaAtacar(P.APPROACH4);
        return;
      }
      if (azar01() >= .5) {
        this.pasoA(P.WILD);
        return;
      }
      break;

     case 2:
      this.edSub(() => this.terminaPronto(.5));
      return;

     case 3:
      this.fase = 0;
      this.altoJuego = 160;
      if (!this.pruebaVida(0, 100)) {
        this.animDirecta(azar01() >= .5 ? A.ANGRY2 : A.ANGRY1, {
          reiniciarSiIgual: true
        });
        this.sonido(SON.EXCITA);
      } else this.animDirecta(A.LOOK);
      this.sub = 4;
      return;

     case 4:
      if (this.toca() && this.enCono(300, R75)) {
        this.pasoA(P.ATTACK);
        return;
      }
      if (this.terminada() || this.dioVuelta()) this.pasoA(P.WANDER); else if (this.puedeAtacar()) this.verParaAtacar(P.APPROACH);
      return;
    }
    this.animSet(A.SUBE);
    this.sub = 2;
  }
  controlGather() {
    const w = this.w;
    switch (this.sub) {
     case 0:
      {
        const av = this.avisoGrupo();
        if (!av) {
          this.pasoA(P.WILD);
          return;
        }
        this.cond = C.CAUTION;
        this.verA(3);
        this.sonidoLoop(true);
        w.vistaObj = av.de;
        if (this.fase !== 1) {
          if (this.d3() < 1e3 && this.cosHacia(this.jPos()) > .8660254) {
            this.pasoA(P.CAUTION);
            return;
          }
          this.cambiarVelAnim();
          this.animSet(A.BAJA);
          this.sub = 1;
          return;
        }
        this.sub = 2;
        break;
      }

     case 1:
      this.edSub(() => this.terminaPronto(.5));
      return;
    }
    if (this.sub === 2) {
      this.fase = 1;
      this.altoJuego = 120;
      this.animSet(A.RUN);
      w.timer = (azar01() + 1) * 5;
      this.sub = 3;
    }
    let dest = w.vistaObj?.pos || this.jPos();
    if (this.sub === 3) {
      if (this.chequearDescenso()) return;
      if (w.vistaObj && d2XZ(w.vistaObj.pos, this.pos) < 36e4 && this.d3() < 600) {
        this.pasoA(P.KABADDI);
        return;
      }
      const p = this.camino(dest);
      if (!p) {
        this.pasoA(P.WILD);
        return;
      }
      dest = p;
      w.timer -= DT;
      if (w.timer <= 0) {
        this.pasoA(P.WILD);
        return;
      }
    }
    this.girarHacia(dest, DT * R60 * (this.bloqueado() ? 3 : 1));
    if (this.dioVuelta()) this.verJugador(P.KABADDI);
  }
  controlApproach4() {
    const w = this.w;
    if (!this.puedeAtacar()) {
      this.pasoA(P.KABADDI);
      return;
    }
    if (this.sub === 0) {
      this.fase = 1;
      this.altoJuego = 120;
      this.cond = C.CHASE;
      this.cambiarVelAnim();
      this.animSet(A.RUN);
      this.verA(1);
      this.sonidoLoop(true);
      this.sub = 1;
    }
    if (this.dioVuelta() && this.d3() < 600) {
      this.pasoA(P.ATTACK4);
      return;
    }
    let t = this.camino(this.jPos());
    if (!t || this.estrecho()) {
      t = [ ...this.jPos() ];
      this.perderJugador(P.WILD);
    }
    w.objetivo = t;
    this.girarHacia(t, DT * R60 * (this.bloqueado() ? 3 : 1));
  }
  controlAway4() {
    const w = this.w;
    switch (this.sub) {
     case 0:
      this.fase = 1;
      this.altoJuego = 120;
      this.cond = C.ESCAPE;
      this.verA(1);
      if (!this.grande && azar01() < .1) {
        this.animSet(A.RUN);
        w.timer = (azar01() + 1) * 3;
        this.sub = 6;
        return;
      }
      this.cambiarVelAnim();
      this.animSet(A.RUNB);
      this.sonidoLoop(true);
      w.timer = 1;
      w.bCount = 0;
      this.sub = 1;

     case 1:
     case 2:
      w.timer -= DT;
      if (w.timer <= 0) w.timer = 0;
      this.edLlamar(() => this.terminada(), () => this.finRetroceso());
      return;

     case 3:
      if (this.estrecho()) {
        this.animSet(A.SUBE);
        this.sub = 7;
        return;
      }
      this.animSet(A.NT4);
      w.timer = azar01() + 1;
      this.verA(0);
      this.sub = 4;

     case 4:
      w.timer -= DT;
      if (w.timer > 0) return;
      this.animSet(A.RUN);
      w.timer = azar01() * 7 + 3;
      w.objetivo = [ ...this.pos ];
      this.sub = 5;
      return;

     case 5:
      if (!this.jugadorAlerta() && this.puedeAtacar()) this.verParaAtacar(P.ATTACK4);

     case 6:
      w.timer -= DT;
      if (w.timer > 0 && this.d3() <= 2e3) {
        if (d2XZ(this.pos, w.objetivo) < 9e4) w.objetivo = this.puntoAdelante(this.rot, 600);
        this.girarHacia(w.objetivo, DT * R60);
        return;
      }
      this.pasoA(P.WILD);
      return;

     case 7:
      this.edCasiFin(P.CAUTION);
      return;

     case 8:
      this.edCasiFin(P.GUARD);
      return;
    }
  }
  finRetroceso() {
    const w = this.w;
    if (this.chequearSalto()) {
      this.pasoA(P.LEAP);
      return;
    }
    if (this.grande) {
      this.animSet(A.SUBE);
      this.sub = 8;
      return;
    }
    if (++w.bCount > 2) {
      if (this.d3() >= 600) this.pasoA(P.KABADDI); else {
        this.animSet(A.SUBE);
        this.sub = 7;
      }
      return;
    }
    if (w.timer <= 0 && this.d3() > 600) {
      if (this.comp.jinmen.some(o => o !== this && o.cond !== C.DEAD && !o.evento && dist3(o.pos, this.pos) < 2e3)) {
        this.pasoA(P.KABADDI);
        return;
      }
      if (azar01() < .5) {
        w.timer = azar01() * 3;
        this.sub++;
        return;
      }
      this.animSet(A.SUBE);
      this.sub = 7;
      return;
    }
    const atras = sumar(this.pos, frente(this.rot, -200));
    if (this.tapado(this.pos, atras, 60)) {
      this.sub = 3;
      return;
    }
    this.animSet(A.RUNB);
  }
  controlLeap() {
    const w = this.w;
    if (this.sub === 0) {
      this.cond = C.CAUTION;
      this.cambiarVelAnim();
      this.sonidoLoop(true);
      this.verA(1);
      if (this.fase === 0) {
        this.animSet(A.BAJA);
        this.sub = 2;
      } else {
        this.altoJuego = 120;
        this.sub = 1;
      }
    }
    if (this.sub === 1) {
      this.animSet(A.RUN);
      this.sub = 3;
    } else if (this.sub === 2) this.edSub(() => this.terminaPronto(.5), -1); else if (this.sub === 3) {
      if (this.chequearDescenso()) return;
      if (this.dioVuelta()) this.verJugador(P.KABADDI);
    }
    this.girarHaciaJugador(DT * R60);
    w.target = 0;
  }
  damageAnime(bdt, sinAguante, cuatro, atras) {
    const u = atras ? 1 : 0, r = azar01();
    switch (bdt) {
     case 0:
      if (sinAguante) return u || cuatro ? u + 8 : r < .2 ? 10 : u + 8;
      return u || cuatro ? u + 2 : r < .2 ? 4 : u + 2;

     case 1:
     case 13:
     case 15:
     case 17:
      return u + 13;

     case 2:
     case 21:
      if (!sinAguante) return r >= .15 ? u : 4;
      if (!u && !cuatro) return r < .3 ? 10 : u + 8;
      if (u && !cuatro) return u + 8;
      return r < .15 ? 10 : u + 8;

     case 3:
     case 10:
      return sinAguante ? u + 8 : u + 2;

     case 4:
     case 6:
      if (sinAguante) return (!u || cuatro) && r < .7 ? 8 : u + 8;
      return r < .7 ? 4 : u + 2;

     case 5:
     case 7:
      return sinAguante ? u + 11 : u + 5;

     case 8:
      return sinAguante ? u + 8 : u;

     case 9:
      if (sinAguante) return u || cuatro ? u + 8 : r < .5 ? 10 : u + 8;
      return u || cuatro ? u + 2 : r < .5 ? 4 : u + 2;

     case 11:
      if (!sinAguante) return !u && !cuatro && r < .5 ? 4 : u + 5;
      return !u && !cuatro && r < .5 ? 10 : u + 11;

     case 12:
      if (!sinAguante) return !cuatro ? 4 : r < .7 ? 4 : u + 2;
      return !cuatro ? 10 : r < .7 ? 10 : u + 8;

     case 14:
      if (!sinAguante) {
        if (!cuatro) return !u ? r < .7 ? 4 : u + 2 : u + 2;
        return r < .5 ? 4 : u + 2;
      }
      if (!cuatro) return !u ? r < .7 ? 10 : u + 8 : u + 8;
      return r < .5 ? 10 : u + 8;

     case 16:
      return 10;

     case 18:
      return !cuatro ? u + 8 : r < .8 ? 10 : u + 8;

     case 19:
     case 20:
      return 7;

     default:
      return -1;
    }
  }
  agregarDanio(g) {
    const w = this.w, sh = g.shock ?? 40, dir = g.dir || frente(this.rot + Math.PI);
    const local = girarY(dir, -this.rot), atras = local[2] > 0;
    const sinAguante = this.aguante <= 0, cuatro = this.fase === 1;
    let d = this.damageAnime(g.bdt ?? 2, sinAguante, cuatro, atras), res, vel = 1, n;
    if (d === -1) {
      if (g.golpe === "BAK_PLAYER_SPRAY") {
        n = 26 + (sinAguante ? 1 : 0);
        res = 6;
      } else {
        n = 26;
        res = 1;
      }
    } else if (d === 7) {
      res = 3;
      w.timer = 0;
      n = 31;
    } else if (d >= 8 && d <= 16) {
      res = 2;
      n = d + 24;
      vel = azarS() * .2 + 1;
    } else {
      res = 1;
      n = d + 24;
      vel = azarS() * .4 + 1;
    }
    w.hitback[0] += dir[0] * sh;
    w.hitback[1] += (dir[1] || 0) * sh;
    w.hitback[2] += dir[2] * sh;
    if (this.fase !== 0) n += 18;
    w.caida = [ 31, 32, 34, 35, 37, 39, 40, 55 ].includes(n) ? 0 : 1;
    this.animSet(n);
    w.animVel = vel;
    this.anim.velocidad(vel);
    w.ultimoGolpe = g.golpe || null;
    return res;
  }
  sinArma(g) {
    return /STUNGUN|SPRAY|CHAINSAW/.test(String(g.golpe || ""));
  }
  esRemate(g) {
    return g.atributo === 8 || /FINISH/.test(String(g.golpe || ""));
  }
  escalera() {
    return typeof this.m.enEscalera === "function" ? !!this.m.enEscalera(this.pos) : false;
  }
  sonidoDanio(g) {
    if (this.sinArma(g)) this.sonido(SON.GOLPE); else this.sonido(this.hp > 0 ? SON.DOLOR : SON.MUERTE);
  }
  controlDamage() {
    const w = this.w;
    switch (this.sub) {
     case 0:
      {
        const g = this.danioPend || {
          danio: 0,
          bdt: 2,
          shock: 0,
          dir: frente(this.rot + Math.PI)
        };
        this.danioPend = null;
        this.verA(5);
        this.sonidoLoop(false);
        this.cond = C.DAMAGE;
        this.quitar(g.danio || 0);
        let res = this.agregarDanio(g);
        const esc = this.escalera();
        if (res === 1 && esc && this.fase === 1 && azar01() < .3) {
          w.caida = 1;
          res = 2;
        }
        if (res === 2) {
          this.altoJuego = 40;
          this.fase = 2;
          if (esc) {
            this.ponerEscalera();
            res = 5;
          }
        }
        this.sonidoDanio(g);
        this.sub = res;
        return;
      }

     case 1:
     case 4:
      {
        let sig;
        if (!this.grande) {
          if (this.fase === 0) sig = !this.pruebaVida(0, 100) ? P.AWAY : azar01() >= .5 ? P.CAUTION : P.ANGRY; else sig = this.pruebaVida(0, 100) ? P.KABADDI : P.WILD;
        } else sig = P.GUARD;
        if (this.sub === 4) this.pasoA(sig); else this.edCasiFin(sig);
        return;
      }

     case 2:
      this.edFin(P.DOWN);
      return;

     case 3:
      w.timer += DT;
      if (w.timer < .5) return;
      if (this.aguante > 0) {
        this.sub = 4;
        return;
      }
      w.animVel = azar01() * .2 + 1;
      this.animDirecta(this.fase === 0 ? 39 : 57);
      this.sub = 2;
      return;

     case 5:
      if (this.progreso() > .5) this.pasoA(P.DOWN);
      return;

     case 6:
      this.edPaso(() => this.terminaPronto(.2), this.fase === 0 ? P.AWAY : P.AWAY4);
      return;
    }
  }
  danioAdicional() {
    const g = this.danioPend;
    if (!g) return;
    this.danioPend = null;
    const w = this.w;
    this.quitar(g.danio || 0);
    if (/CHAINSAW/.test(String(g.golpe || ""))) {
      this.sonido(SON.GOLPE);
      if (this.hp > 0) w.timer = 0;
    } else this.sonidoDanio(g);
    if (this.sub === 2 || this.sub === 5) return;
    let res = this.agregarDanio(g);
    const esc = this.escalera();
    if (res === 1 && esc && this.fase === 1 && azar01() < .3) {
      w.caida = 1;
      res = 2;
    }
    if (res === 2) {
      this.altoJuego = 40;
      if (esc) {
        this.ponerEscalera();
        this.sub = 5;
        return;
      }
      this.fase = 2;
    }
    this.sub = res;
  }
  ponerEscalera() {
    this.radio = 40;
    this.altoJuego = 40;
    this.fase = 3;
  }
  danioEnElPiso() {
    const g = this.danioPend;
    if (!g) return;
    this.danioPend = null;
    const w = this.w;
    let d = g.danio || 0;
    if (this.esRemate(g)) {
      d = Math.max(d, this.hp);
      this.sonido(SON.MUERTE);
      w.finishCount++;
    } else this.sonido(SON.DOLOR);
    this.quitar(d);
    this.animSet(A.YACE + w.caida);
    w.ultimoGolpe = g.golpe || null;
    if (this.sub === 4) {
      const r = azar01();
      w.timer += azar01() * r * 3;
      return;
    }
    if (this.hp <= 0) {
      this.soltarItem();
      this.charco();
      w.timer = azar01() * 3 + 1;
      this.sub = 4;
    }
  }
  controlDown() {
    const w = this.w;
    if (!this.escalera()) {
      if (this.sub === 5) {
        this.altoJuego = 160;
        this.fase = 2;
        this.sub = 99;
      }
    } else if (this.sub !== 3 && this.sub !== 5) {
      this.animSet(A.YACE + w.caida);
      this.ponerEscalera();
      w.timer = 0;
      this.sub = 5;
    }
    switch (this.sub) {
     case 0:
     case 99:
      {
        this.cond = C.DYING;
        this.verA(5);
        this.fase = 2;
        this.radio = 60;
        this.altoJuego = 40;
        if (this.aguante < azar01() * this.aguanteMax) this.soltarItem();
        if (this.hp <= 0) {
          this.charco();
          w.timer = (azar01() + 1) * 5;
          this.sub = 4;
          return;
        }
        if (w.ultimoGolpe === "BAK_PLAYER_STUNGUN") w.timer = azar01() * 7 + 3; else if (this.aguante <= 0) w.timer = (azar01() + 1) * 3; else w.timer = azar01();
        this.sub = 1;
        return;
      }

     case 1:
      w.timer -= DT;
      if (w.timer <= 0 && this.atacando() !== 1) {
        this.levantarse();
        return;
      }
      if (azar01() < .01) {
        w.timer = azar01() * 5 + 1;
        this.animSet(A.ROT + w.caida);
        this.sub = 2;
      }
      return;

     case 2:
      w.timer -= DT;
      if (w.timer <= 0) {
        if (azar01() >= .9 || this.atacando() === 1) {
          w.timer = azar01() * 5 + 1;
          this.sub = 1;
        } else this.levantarse();
      }
      return;

     case 3:
      this.edLlamar(() => this.terminaPronto(.5), () => {
        this.curar(10);
        this.altoJuego = 160;
        this.pasoA(this.grande ? P.GUARD : P.CAUTION);
      });
      return;

     case 4:
      w.timer -= DT;
      if (w.timer <= 0 || w.finishCount > 1) this.morir();
      return;

     case 5:
      w.timer -= DT;
      if (w.timer <= 0) {
        this.sonido(SON.DOLOR);
        this.quitar(10);
        this.anim.t = 0;
        const f = frente(this.rot + Math.PI, 160);
        w.hitback[0] += f[0];
        w.hitback[2] += f[2];
        w.timer = .5;
        if (this.hp <= 0) {
          this.charco();
          w.timer = 1;
          this.sub = 4;
        }
      }
      return;
    }
  }
  levantarse() {
    this.fase = 0;
    this.cond = C.RISE;
    this.animSet(A.UP + this.w.caida);
    this.sub = 3;
  }
  morir() {
    this.cond = C.DEAD;
    this.sub = 0;
    this.m.contarMuerte?.(this);
    if (this.item) this.soltarItem();
  }
  controlGuard() {
    const w = this.w, casa = this.casa;
    if (this.jugador().existe) this.verA(1); else if (w.vista === 1) w.vista = 0;
    const atacar = () => {
      this.pasoA(P.ATTACK);
    };
    switch (this.sub) {
     case 0:
      this.cond = C.CAUTION;
      this.cambiarVelAnim();
      this.sonidoLoop(true);
      if (this.fase === 1) {
        this.altoJuego = 120;
        this.animSet(A.SUBE);
        this.sub = 2;
        break;
      }
      this.animSet(A.NT);
      this.fase = 0;
      this.altoJuego = 160;
      this.sub = 1;

     case 1:
      if (this.toca()) {
        this.animSet(A.NT);
        this.sub = 5;
        break;
      }
      if (d2XZ(casa, this.pos) > 1600) {
        this.sub = 3;
        break;
      }
      if (!this.pruebaVida(-100, 100)) {
        this.pasoA(P.ANGRY);
        return;
      }
      if (azar01() >= .3) {
        this.animSet(A.NT);
        w.timer = azar01();
        this.sub = 4;
        break;
      }
      this.animDirecta(A.LOOK);
      this.sub = 2;
      break;

     case 2:
      if ((this.toca() || this.puedeAtacar()) && this.enCono(360, R60)) {
        atacar();
        return;
      }
      if (this.terminada() || this.dioVuelta()) {
        if (this.animL === A.SUBE || this.animL === A.SUBE + 4 || !this.puedeAtacar() || !this.enCono(600, R30)) {
          this.animSet(A.NT);
          this.fase = 0;
          this.altoJuego = 160;
          this.sub = 1;
        } else {
          this.animSet(A.BAJA);
          this.sub = 6;
        }
      }
      break;

     case 3:
      {
        if (this.toca()) {
          this.animSet(A.NT);
          this.sub = 5;
          break;
        }
        if (d2XZ(casa, this.pos) < 800) {
          this.animSet(A.NT);
          this.sub = 1;
          break;
        }
        if (this.animL > 7 && this.animL < 16) {
          w.timer -= DT;
          if (w.timer > 0) break;
          if (this.puedeAtacar() && this.enCono(360, R60)) {
            atacar();
            return;
          }
        }
        const a = envolver(rumboHacia(casa, this.pos) - this.rot), aa = Math.abs(a);
        this.cambiarVelAnim();
        this.animSet(aa < R60 ? A.WLK : aa > 2.6179938 ? A.WLKB : a >= 0 ? A.WLKR : A.WLKL);
        w.timer = .8;
        break;
      }

     case 4:
      if (this.toca()) {
        this.animSet(A.NT);
        this.sub = 5;
        break;
      }
      w.timer -= DT;
      if (w.timer <= 0) {
        this.sub = 1;
        break;
      }
      if (this.enCono(360, R60)) {
        atacar();
        return;
      }
      break;

     case 5:
      if (!this.jugador().existe) {
        this.sub = 1;
        break;
      }
      if ((this.toca() || this.puedeAtacar()) && this.enCono(360, R60)) {
        atacar();
        return;
      }
      if (d2XZ(casa, this.pos) > 1600) this.sub = 3;
      break;

     case 6:
      this.edCasiFin(P.ATTACK4);
      break;
    }
    this.girarHaciaJugador(DT * R90);
  }
  controlWait() {
    const w = this.w;
    if (this.sub === 0) {
      this.verA(0);
      this.cond = C.HIDDEN;
      this.fase = 8;
      this.sinCuerpo = true;
      this.sonidoLoop(false);
      w.esperando = 1;
      this.sub = 1;
    }
    if (this.sub === 1) {
      const j = this.jugador();
      if (j.existe && dist3(this.pos, j.pos) < 1e3 && this.ponerDescenso()) {
        this.sinCuerpo = false;
        this.pasoA(P.DESCENT);
      }
    }
  }
  controlNoMove() {
    if (this.sub !== 0) return;
    this.cond = C.NORMAL;
    this.sonidoLoop(true);
    this.animSet(A.NT);
    this.verA(1);
    this.fase = 0;
    this.sinCuerpo = true;
    this.sub = 1;
  }
  controlJump() {
    const w = this.w, tr = this.comp.trafico;
    if (!tr.master || tr.master.cond === C.DEAD || !this.comp.jinmen.includes(tr.master)) tr.master = this;
    if (tr.master === this) {
      tr.espera -= DT;
      if (tr.espera <= 0) {
        tr.tipo ^= 1;
        tr.espera = azarCargado(-15, 1) + 30;
      }
      if (tr.tipo === 0) {
        const ruido = azarCargado(.05, .005);
        tr.vel = (ruido + tr.vel - (tr.rate - 0) * .003) * .98;
        tr.rate += tr.vel;
      } else {
        tr.vel = 0;
        tr.rate = 0;
      }
    }
    if (this.sub === 0) {
      this.cond = C.HIDDEN;
      this.sinCuerpo = true;
      w.animVel = 1;
      this.animDirecta(A.JUMP);
      this.fase = 7;
      this.anim.velocidad(1);
      w.timer = azar01();
      this.sub = 1;
    }
    if (this.sub === 1) {
      w.timer -= DT;
      if (w.timer > 0) return;
      if (azar01() > tr.rate) {
        w.timer = (1 - tr.rate) * azar01() * .25;
        return;
      }
      this.cond = C.SPECIAL;
      let k = Math.round(azar01() * 3 - .49);
      if (k === 3) k = 2;
      this.animSet(A.JUMP + k);
      const v = Math.max(.5, Math.min(1.5, azar01() * tr.rate + 1));
      w.moveSpeed = v;
      w.animVel = v;
      if (this.tipoParam !== 0) {
        const x = girarY([ azar01() * 600, 0, 0 ], this.rot);
        this.pos[0] += x[0];
        this.pos[2] += x[2];
        const a = azarCargado(-R45, R45);
        this.girar(a);
        w.animVel /= Math.cos(a);
      }
      this.anim.velocidad(w.animVel);
      this.sub = 2;
      return;
    }
    if (this.terminada()) {
      this.pos = [ ...this.casa ];
      this.rot = this.rotCasa;
      w.vista = 0;
      w.cabeza = 0;
      this.cond = C.HIDDEN;
      w.timer = azar01() * 1.5;
      this.sub = 1;
      this.posAnt = [ ...this.pos ];
      this.rotAnt = this.rot;
      return;
    }
    this.avanzar(w.moveSpeed * 1600);
  }
  chequearSalto() {
    const j = this.jugador();
    if (!j.existe) return false;
    if (!(this.pos[1] + 480 <= j.pos[1])) return false;
    if (this.m.piso) {
      const y = this.m.piso(this.pos, 20, 20);
      if (y == null) return false;
    }
    return !this.escalera();
  }
  chequearDescenso() {
    if ((this.m.etapa ?? 5) !== 5) return false;
    const j = this.jugador();
    if (!j.existe) return false;
    let caso;
    if (j.pos[1] > this.pos[1] + 400) caso = 1; else if (j.pos[1] < this.pos[1] - 600 && !this.w.primerItem) caso = 2; else return false;
    if (!this.fueraDePantalla() || !this.ponerDescenso()) return false;
    if (caso === 2 && this.item) {
      this.m.devolverItem?.(this, this.item);
      this.item = this.armaEnMano = 0;
    }
    this.pasoA(P.DESCENT);
    if (caso === 2) this.sub = 99;
    return true;
  }
  ponerDescenso() {
    const j = this.jugador();
    if (!j.existe) return false;
    if (typeof this.m.zonaProhibida === "function" && this.m.zonaProhibida(j.pos)) return false;
    let base;
    if (!this.grande && this.paso !== P.WAIT) {
      const d0 = [ this.pos[0] - j.pos[0], this.pos[2] - j.pos[2] ], L = Math.hypot(d0[0], d0[1]);
      const rc = this.m.rumboCamara?.();
      const r0 = rc != null ? rc : L > 1 ? Math.atan2(d0[0], d0[1]) : j.rot + Math.PI;
      const r = r0 + azarCargado(-R90, .0872665);
      base = [ j.pos[0] + Math.sin(r) * 600, j.pos[1] - 160, j.pos[2] + Math.cos(r) * 600 ];
    } else base = [ this.casa[0], this.casa[1], this.casa[2] ];
    const arriba = [ base[0], base[1] - (azar01() * 1400 + 1600), base[2] ];
    const tope = this.m.rayo ? this.m.rayo([ j.pos[0], j.pos[1] - 160, j.pos[2] ], arriba) : null;
    if (tope) arriba[1] = tope.pos[1] + 60;
    if (!this.fueraDePantalla(arriba)) return false;
    let suelo = j.pos[1];
    if (this.m.piso) {
      const y = this.m.piso(arriba, 0, 8e3);
      if (y == null) return false;
      suelo = y;
    }
    if (Math.abs(suelo - j.pos[1]) >= 400) return false;
    this.pos = arriba;
    this.posAnt = [ ...arriba ];
    this.cond = C.HIDDEN;
    this.rot = rumboHacia(j.pos, this.pos);
    this.rotAnt = this.rot;
    return true;
  }
}
