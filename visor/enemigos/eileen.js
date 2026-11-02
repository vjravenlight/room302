// SH4 web — FeniXVOID · Project Ravenlight
import { partesBin } from "../lib/sh4bin.js";

import { leerModelo } from "../lib/modelo.js";

import { leerTexturas } from "../lib/texturas.js";

import { leerAnimacion } from "../lib/animacion.js";

import { crearPersonaje } from "../lib/personaje.js";

import { leerMensajes, PAQUETES_MENSAJES, PARTE_COMUN } from "../lib/subtitulos.js";

import { idiomaActual } from "../textos_sitio.js";

import { Animador } from "../jugador/mezcla.js";

import { componer } from "../lib/animacion.js";

import { crearGiroCara, aplicarGiroCara } from "./girar_cara.js";

import { crearPies } from "./pies_piso.js";

import { crearTexturaMaldita } from "./textura_maldita.js";

import { crearOjos } from "./ojos_eileen.js";

import { crearBrazo } from "./brazo_metralleta.js";

import { DT, envolver, rumboHacia, distXZ, dist3, crearMovedor, azar01, azar } from "./comun.js";

import { TrabajoCamino, buscarCaminoEil } from "./caminos.js";

export { DT };

const d2xz = (a, b) => (a[0] - b[0]) ** 2 + (a[2] - b[2]) ** 2;

export function escenasConectadas(puertasPorEscena, etapa, desde, hasta) {
  if (desde == null || hasta == null || desde === hasta) return false;
  const ok = (puertasPorEscena?.[String(desde)] || []).some(p => p.lleva_a_escena === hasta && p.door_type === 2);
  if (!ok) return false;
  if (etapa === 2) {
    if (desde === 8 && hasta === 7 || desde === 13 || hasta === 13) return false;
  } else if (etapa === 3) {
    if (desde === 22 || hasta === 23) return false;
  }
  return true;
}

export const TABLA_ANIM = [ -1, 0, 1, 2, 7, 8, 3, 4, 5, 9, 10, 12, 11, 13, -1, 6, -1, -1, -1, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, -1, -1, -1, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, -1, -1, -1, -1, 64, 65, 66 ];

export const ANIM = {
  QUIETA: 1,
  CAMINA: 2,
  CAMINA_ATRAS: 3,
  COSTADO_A: 4,
  COSTADO_B: 5,
  COJEA: 6,
  CORRE: 8,
  COJEA_CORRE: 9,
  GIRO_A: 10,
  GIRO_A_GRANDE: 11,
  GIRO_B: 12,
  GIRO_B_GRANDE: 13,
  FRENA: 15,
  APUNTA_ATRAS: 19,
  APUNTA_ADELANTE: 20,
  INQUIETA: [ 21, 22, 23, 24, 25, 26 ],
  RESPIRA: 28,
  RESPIRA_FUERTE: 29,
  HENRY_MUERTO: 32,
  DANIO_FRENTE: 37,
  DANIO_FRENTE_FUERTE: 38,
  DANIO_ATRAS: 39,
  DANIO_ATRAS_FUERTE: 40,
  QUIETA_MALDITA: 41,
  QUIETA_SUFRE: 42,
  EMPUJADA_ATRAS: 43,
  EMPUJADA_ADELANTE: 44,
  HABLA: [ 46, 47, 48, 49 ],
  LOCURA: [ [ 50, 51, 52 ], [ 56, 57, 58 ], [ 59, 0, 0 ] ],
  EQUIPA: 60,
  ATAQUE_BOLSO: 61,
  ESPECIAL_BOLSO: 62,
  REMATE_BOLSO: 63,
  ATAQUE: 64,
  ATAQUE_MEDIO: 65,
  ATAQUE_BAJO: 66,
  ESPECIAL: 67,
  REMATE: 68,
  APUNTA_ARMA: 69,
  DISPARA: 70,
  BAJA_ARMA: 71,
  CAE: 76,
  CAIDA: 77,
  SE_LEVANTA: 78
};

export const PASO = {
  CONSTRUIR: 0,
  ESPERA: 1,
  GIRO: 2,
  SIGUE: 3,
  FRENA: 4,
  APUNTA: 5,
  COSTADO: 6,
  DANIO: 7,
  EMPUJADA: 8,
  RESPIRA: 9,
  INQUIETA: 10,
  EQUIPA: 11,
  ATAQUE: 12,
  ATAQUE_MEDIO: 13,
  ATAQUE_BAJO: 14,
  ESPECIAL: 15,
  REMATE: 16,
  DISPARO: 17,
  HABLA: 18,
  LOCURA: 19,
  HENRY_MUERTO: 20,
  CAIDA: 21
};

export const NOMBRE_PASO = [ "Construct", "Wait", "Turn", "Follow", "RunStop", "TargetingMove", "SlideMove", "Damage", "Pushed", "Breath", "StandBy", "Equip", "Attack", "MiddleAttack", "LowerAttack", "AttackSpecial", "AttackFinish", "GunAttack", "Talk", "Insane", "HenryDead", "Down" ];

export const ARMA = {
  NINGUNA: 0,
  BOLSO: 1,
  CACHIPORRA: 2,
  FUSTA: 3,
  CADENA: 4,
  METRALLETA: 5
};

export const ITEM_A_ARMA = {
  128: 1,
  129: 5,
  130: 2,
  131: 3,
  132: 4
};

export const ARMA_A_ITEM = {
  1: 128,
  2: 130,
  3: 131,
  4: 132,
  5: 129
};

export const NOMBRE_ARMA = [ "", "Bolso de Eileen", "Cachiporra", "Fusta", "Cadena", "Pistola metralleta" ];

const KINDS = [ "", "HANDBAG", "CLUB", "ROD", "CHAIN" ];

export function golpeDe(arma, sub) {
  if (arma === ARMA.METRALLETA) return "BAK_PLAYER_EIL_GUN_N";
  if (!KINDS[arma]) return null;
  return "BAK_PLAYER_EIL_" + KINDS[arma] + "_" + [ "N", "3_1", "3_2", "3_3", "FINISH" ][sub];
}

export const ALCANCE = [ 0, 180, 160, 280, 240.00002, 160 ];

export const MODELO_ARMA = {
  1: [ 6, 1 ],
  2: [ 9, 4 ],
  3: [ 10, 5 ],
  4: [ 8, 3 ],
  5: [ 7, 2 ]
};

export const HUESO_MANO = 25;

export const SON = {
  BALANCEO: [ 0, 40125, 40127, 40126, 40128, 40129 ],
  CADENA_ZUMBA: 40135,
  DANIO: [ 40117, 40118, 40121, 40130 ],
  DANIO_COMUN: 40130,
  DANIO_FUERTE: 40123,
  EMPUJADA: 40119,
  INQUIETA: 40132,
  RESPIRA: 40133,
  CAE: 40134,
  LOCURA_RISA: 40136,
  LOCURA: [ 40117, 40118, 40119, 40122 ],
  CORTA_CHARLA: [ 40120, 40119, 40122, 40117, 40118, 40121, 40123 ],
  CAE_AL_POZO: 20241,
  PASO: {
    1: 40104,
    2: 40108,
    3: 40107,
    4: 40106,
    5: 40109,
    6: 40110,
    7: 40111,
    8: 40112,
    9: 40113,
    11: 40105,
    12: 40114
  }
};

export const C = {
  VIDA_MAX: 100,
  SIGUE_LEJOS: 500,
  PARA: 200,
  LEJOS: 800,
  APURA: 600,
  ALTO_SEPARA: 400,
  GIRA: Math.PI / 2,
  GIRO_GRANDE: 2.356194,
  APUNTA: .3926991,
  GIRO_SIGUE: .08,
  GIRO_OBJ: .05,
  CAMINA: 9,
  CORRE: 10,
  COJEA: 7,
  COJEA_CORRE: 8,
  PARAM_MAX: 1.2,
  SEPARA: 80,
  CANSANCIO_MAX: 10240,
  ESPERA_AZAR: 300,
  ESPERA_MIN: 5,
  VIDA_REGEN: .0025,
  VIDA_PISO: -.1,
  MALD_SUBE: 15e-5,
  MALD_VISTA: .025,
  MALD_BAJA: 5e-5,
  MALD_BAJA_HERIDA: 1e-5,
  MALD_METRALLETA: 2e-4,
  MALD_DISPARO: .0025,
  MALD_CAIDA: .2,
  NIVEL_MALD: [ .25, .5, .7 ],
  NIVEL_VIDA: [ .99, .5, .25 ]
};

const PI = Math.PI;

const mismo = (a, b) => !!a && !!b && (a === b || a.id != null && a.id === b.id);

const M = (p, m, v, fr = 0, s = 0) => ({
  paquete: p,
  mensaje: m,
  voz: v,
  cuadros: fr,
  siguen: s
});

export const FRASES = {
  apurada: [ M(0, 213, 30064), M(0, 214, 30065), M(0, 215, 30067), M(0, 216, 30068), M(0, 221, 30074), M(0, 222, 30076), M(0, 220, 30072), M(0, 217, 30069), M(0, 225, 30080), M(0, 218, 30070), M(0, 219, 30071), M(0, 224, 30078) ],
  rara: [ M(0, 234, 30167), M(0, 235, 30168), M(0, 236, 30169), M(0, 237, 30170), M(0, 238, 30171), M(0, 239, 30172), M(0, 240, 30173), M(0, 241, 30176), M(0, 242, 30181), M(0, 243, 30186), M(0, 244, 30188) ],
  etapa: {
    2: [ M(5, 48, 30112), M(5, 49, 30115), M(5, 50, 30116), M(5, 51, 30120, 0, 1), M(5, 52, 30123) ],
    3: [ M(6, 77, 30126), M(6, 78, 30131, 60, 1), M(6, 79, 0, 170), M(6, 80, 30132) ],
    4: [ M(7, 18, 30135), M(7, 19, 30136, 0, 1), M(7, 20, 30138), M(7, 21, 30140), M(7, 22, 30143) ],
    5: [ M(8, 37, 30146), M(8, 38, 30149), M(8, 39, 30153), M(8, 40, 30154), M(8, 41, 30155) ],
    7: [ M(10, 52, 30096), M(10, 54, 30100), M(10, 55, 30102), M(10, 56, 30104), M(10, 53, 30098) ],
    8: [ M(11, 76, 30156), M(11, 77, 30159), M(11, 78, 30163) ],
    11: [ M(0, 230, 30106), M(0, 231, 30107), M(0, 232, 30108), M(0, 233, 30109) ]
  }
};

const LOCURAS = [ [ 26, 1, 1, 0 ], [ 1, 0, 1, 0 ], [ 26, 2, 0, 0 ], [ 24, 3, 0, 0 ], [ 24, 4, 0, 0 ], [ 1, 5, 1, 0 ], [ 1, 6, 1, 0 ], [ 1, 7, 0, 0 ], [ 1, 8, 0, 0 ], [ 0, -1, 0, 2 ], [ 0, -1, 0, 3 ], [ 0, 9, 0, 1 ], [ 0, 10, 0, 1 ] ];

const INQUIETAS = [ [ 21, 0, 0, 128, .8 ], [ 22, 0, 1, 16, 1 ], [ 23, 0, 0, 256, .5 ], [ 24, 0, 0, 384, .4 ], [ 25, 0, 0, 80, .7 ], [ 26, 0, 0, 512, .4 ] ];

export function guardadoNuevo() {
  return {
    estado: 0,
    pos: [ 0, 0, 0 ],
    rot: 0,
    etapa: 0,
    escena: 0,
    maldicion: 0,
    danioTotal: 0,
    arma: 0,
    dejadaConBichos: 0,
    vecesDejadaConBichos: 0,
    cambiosEscena: 0,
    cambiosConEileen: 0,
    caidas: 0,
    golpesDeHenry: 0,
    tiempo: 0,
    tiempoConHenry: 0,
    banderas: new Array(32).fill(0),
    vida: C.VIDA_MAX
  };
}

export function maldicionBase(g) {
  const n = g.cambiosEscena;
  if (n < 10) return 0;
  let r = g.tiempo > 0 ? g.tiempoConHenry / g.tiempo - .5 : 0;
  r = Math.max(0, Math.min(1, r));
  const caidas = Math.min(10, g.caidas);
  const danio = Math.max(0, Math.min(.2, g.danioTotal * 3e-4));
  const golpes = Math.max(0, Math.min(.5, g.golpesDeHenry * .02));
  let v = golpes + danio + (caidas * .05 - .05) + (n - g.cambiosConEileen + g.vecesDejadaConBichos) / n - r * .2 - .2;
  v = Math.max(0, Math.min(.8, v)) * 1.25;
  return Math.max(0, Math.min(.95, v));
}

export const nivelMaldicion = v => v >= C.NIVEL_MALD[2] ? 3 : v >= C.NIVEL_MALD[1] ? 2 : v >= C.NIVEL_MALD[0] ? 1 : 0;

export function eileenSobrevive(g) {
  return !((g?.banderas?.[19] || 0) & 3);
}

export function finalDelJuego(g, cuartoLimpio) {
  const viva = eileenSobrevive(g);
  if (viva && cuartoLimpio) return "A";
  if (viva) return "B";
  if (cuartoLimpio) return "C";
  return "D";
}

export async function cargarEileen({bajar: bajar, enfermera: enfermera = false}) {
  const [bm, ba, bw] = await Promise.all([ bajar("data/" + (enfermera ? "eol.bin" : "eil.bin")), bajar("data/eil_anm.bin"), bajar("data/eil_arms.bin") ]);
  const pm = partesBin(bm), pa = partesBin(ba), pw = partesBin(bw);
  const mod = pm[1], tex = pm[0];
  const modelo = leerModelo(bm, mod.ofs, mod.len);
  const pj = crearPersonaje(modelo, leerTexturas(bm, tex.ofs, tex.len));
  pj.grupo.name = "Eileen";
  const partes = pa.map(p => p.tipo === "animacion" ? leerAnimacion(ba, p.ofs, p.len) : null);
  const anims = TABLA_ANIM.map(p => partes[p >= 0 ? p : 0] || partes[0]);
  const armas = {};
  for (const [a, [pmod, ptex]] of Object.entries(MODELO_ARMA)) {
    try {
      const w = crearPersonaje(leerModelo(bw, pw[pmod].ofs, pw[pmod].len), leerTexturas(bw, pw[ptex].ofs, pw[ptex].len));
      w.grupo.name = "arma_eileen_" + a;
      armas[a] = w;
    } catch (e) {
      console.warn("arma de Eileen", a, e.message);
    }
  }
  return {
    pj: pj,
    anims: anims,
    armas: armas,
    partes: modelo.partes,
    modelo: modelo
  };
}

export function crearTextos(bajar) {
  const cache = new Map, listos = new Map, L = idiomaActual();
  async function paquete(p) {
    if (!cache.has(p)) {
      const arch = p === 0 ? "message_common_eu.bin" : "message_" + PAQUETES_MENSAJES[p] + "_" + L + ".bin";
      cache.set(p, bajar("data/" + arch).then(b => {
        const P = leerMensajes(b);
        return p === 0 ? P[PARTE_COMUN[L]] || P[PARTE_COMUN.b] || [] : P[0] || [];
      }).catch(() => []).then(L => {
        listos.set(p, L);
        return L;
      }));
    }
    return cache.get(p);
  }
  return {
    paquete: paquete,
    async texto(p, n) {
      return (await paquete(p))[n] ?? null;
    },
    ya(p, n) {
      const L = listos.get(p);
      if (L) return L[n] ?? null;
      paquete(p);
      return undefined;
    }
  };
}

export class Eileen {
  constructor({pj: pj, anims: anims, armas: armas = {}, partes: partes = null, modelo: modelo = null, m: m, pos: pos = [ 0, 0, 0 ], rot: rot = 0, guardado: guardado = null}) {
    this.pj = pj;
    this.anims = anims;
    this.armas = armas;
    this.m = m;
    this.anim = new Animador(pj, anims);
    this.cara = crearGiroCara();
    this.pies = crearPies({
      getColision: m.getColision,
      escala: m.escala ?? .005
    });
    this.textura = partes && typeof document !== "undefined" ? pj.texturaMaldita ||= crearTexturaMaldita(pj, partes) : null;
    this.ojos = crearOjos(pj, modelo, anims);
    this.brazo = crearBrazo();
    this.movedor = crearMovedor(m.THREE, m.getColision, m.escala ?? .005, {
      minNy: .01
    });
    this.g = guardado || guardadoNuevo();
    this.pos = [ ...pos ];
    this.rot = rot;
    this.posAnt = [ ...pos ];
    this.rotAnt = rot;
    this.w = {
      vida: this.g.vida ?? C.VIDA_MAX,
      maldicion: this.g.maldicion,
      maldVista: this.g.maldicion,
      maldBase: 0,
      dirObj: rot,
      distObj: 0,
      dist: 0,
      distAnt: 0,
      ang: 0,
      cojea: 0,
      henryAtaca: 0,
      apura: 0,
      puertaTimer: 0,
      actitud: 0,
      golpe: 0,
      golpeOrigen: [ 0, 0, 0 ],
      golpeDanio: 0,
      golpeId: 0,
      golpeTimer: 0,
      danioFuerte: 0,
      empujeDe: null,
      empujeTimer: 0,
      fueraEscena: 0,
      caminoBloqueado: 0,
      vel: 0,
      velAnt: 0,
      dirMov: [ Math.sin(rot), Math.cos(rot) ],
      aceleracion: 0,
      accion: 0,
      objetivo: 0,
      prox: 0,
      proxObj: 0,
      mascara: 0,
      mascaraTimer: 0,
      esquiva: 0,
      esquivaPide: 0,
      esquivaVeces: 0,
      esquivaTimer: 0,
      esquivaEspera: 0,
      timer: 0,
      param: .05,
      ratio: 0,
      girado: 0,
      giroVel: 0,
      tipoEspera: 0,
      lado: -1,
      ladoUsado: 0,
      enemigo: null,
      enemigoPos: [ 0, 0, 0 ],
      enemigoDir: 0,
      enemigoDist: 0,
      enemigoAng: 0,
      invencible: 0,
      metodo: 0,
      enemigoGrande: 0,
      enemigoAgarra: 0,
      maldiceHenry: 0,
      sufre: 0,
      disparoAcierta: 0,
      arma: this.g.arma || 0,
      armaPedida: this.g.arma || 0,
      armaActiva: 0,
      disparos: 0,
      timerAtaque: 0,
      cansancio: 0,
      ordenes: [ 0, 0, 0, 0, 0, 0 ],
      ordenIr: null,
      ordenGirar: null,
      ordenMirar: null,
      locuraTipo: 0,
      movCharla: 0,
      irDeslizando: 0,
      finEstado: 0,
      caidaPrimero: 0,
      estadoCamino: 0,
      inicioGlobal: this.g.inicioGlobal || null,
      estadoGlobal: this.g.estadoGlobal || 0,
      globalFallo: 0,
      destinoGlobal: null,
      escenaEil: this.g.escena ?? null,
      hurdle: 0,
      esqPide: 0,
      esqPunto: null,
      puntoCamino: null
    };
    this.tc = new TrabajoCamino;
    this.tg = new TrabajoCamino;
    this.paso = PASO.CONSTRUIR;
    this.sub = 0;
    this.ac = {
      n: -1,
      t: 0,
      vel: 1,
      loop: false,
      fin: false
    };
    this.golpeados = new Set;
    this.sonSub = null;
    this.charla = null;
    this.eventos = crearEventos(this);
    this.cuadroPaso = 0;
    this.armaPuesta = null;
    this.pie = -1;
    this.pend = null;
    this.ponerArmaModelo(this.w.arma);
    this.construir();
    this.fueraDeEscena();
    this.ubicarModelo(1);
  }
  caminos() {
    return this.m.caminos?.() || globalThis.sh4?.enemigos?.caminos || null;
  }
  fueraDeEscena() {
    const w = this.w, g = this.g, esc = this.m.escena?.(), c = this.caminos();
    if (!esc || g.estado !== 2 || g.escena == null || g.escena === esc.escena) {
      if (esc) w.escenaEil = esc.escena;
      return;
    }
    if (!c || c.numEtapa !== esc.etapa) {
      w.escenaEil = g.escena;
      return;
    }
    w.fueraEscena = 1;
    w.escenaEil = g.escena;
    w.globalFallo = 0;
    const pe = c.aEtapa(this.pos, g.escena);
    this.pos = c.aEscena(pe, esc.escena);
    this.posAnt = [ ...this.pos ];
    const j = this.m.jugador?.();
    w.destinoGlobal = j?.pos ? c.aEtapa(j.pos, esc.escena) : null;
    this.pj.grupo.visible = false;
  }
  get dirCuerpo() {
    return [ Math.sin(this.rot), Math.cos(this.rot) ];
  }
  angA(r) {
    return envolver(r - this.rot);
  }
  son(id, op) {
    if (!id) return null;
    try {
      return this.m.sonido?.(id, this.pos, op) || null;
    } catch {
      return null;
    }
  }
  nivelMald() {
    return nivelMaldicion(this.w.maldVista);
  }
  nivelVida() {
    const r = this.w.vida / C.VIDA_MAX;
    return r <= 0 ? 3 : r >= C.NIVEL_VIDA[0] ? 0 : r >= C.NIVEL_VIDA[1] ? 1 : r >= C.NIVEL_VIDA[2] ? 2 : 3;
  }
  ponerAnim(n, {mezcla: mezcla = .5, vel: vel = 1, loop: loop = null, sub: sub = null, ratio: ratio = 0} = {}) {
    const a = this.anims[n] || this.anims[1];
    const lp = loop ?? !!a.loop;
    if (this.ac.n !== n || sub != null) {
      this.ac = {
        n: n,
        t: 0,
        vel: vel,
        loop: lp,
        fin: false,
        sub: sub,
        ratio: ratio
      };
    } else {
      this.ac.vel = vel;
    }
    if (sub != null) this.anim.ponerSub(n, sub, ratio, {
      mezcla: mezcla,
      loop: lp,
      vel: vel
    }); else this.anim.poner(n, {
      mezcla: mezcla,
      loop: lp,
      vel: vel,
      forzar: true
    });
  }
  get cuadro() {
    return Math.floor(this.ac.t + 1e-6);
  }
  get animFin() {
    return this.ac.fin;
  }
  avanzarAnim() {
    const a = this.anims[this.ac.n];
    if (!a) return;
    const d = Math.max(1, a.duracion);
    this.ac.t += this.ac.vel;
    if (this.ac.loop) {
      if (this.ac.t >= d) {
        this.ac.t -= d;
      }
      if (this.ac.t < 0) this.ac.t += d;
    } else if (this.ac.t >= d) {
      this.ac.t = d;
      this.ac.fin = true;
    }
  }
  cambiarPaso(n) {
    const w = this.w;
    if (w.mascaraTimer >= 1 || this.paso === n) return false;
    this.paso = n;
    this.sub = 0;
    w.mascaraTimer = 5;
    w.mascara = 1;
    this.cuadroPaso = 0;
    this.brazo?.soltar();
    return true;
  }
  terminar() {
    const w = this.w;
    if (w.mascaraTimer < 1 && this.paso !== PASO.ESPERA) this.cambiarPaso(PASO.ESPERA);
    w.proxObj = 1;
    w.mascara = 0;
  }
  construir() {
    const w = this.w;
    w.maldBase = maldicionBase(this.g);
    w.maldVista = w.maldicion;
    this.ponerAnim(ANIM.QUIETA, {
      mezcla: 0
    });
    if (w.vida < 1) {
      this.paso = -1;
      this.cambiarPaso(PASO.CAIDA);
      w.caidaPrimero = 1;
      w.mascara = 0;
    } else {
      this.paso = -1;
      this.cambiarPaso(PASO.ESPERA);
      w.mascaraTimer = 0;
    }
  }
  tick() {
    this.posAnt = [ ...this.pos ];
    this.rotAnt = this.rot;
    const w = this.w, j = this.m.jugador();
    w.velAnt = w.vel;
    w.cansancio = Math.max(0, Math.min(C.CANSANCIO_MAX, w.cansancio - 10));
    w.prox = 0;
    w.armaActiva = 0;
    w.vel = 0;
    this.g.tiempo++;
    this.analizar(j);
    this.tomarGolpes();
    if (!w.fueraEscena) {
      this.procesarGolpes();
      this.maldicionCuadro();
      this.analizarEnemigos();
    }
    this.textura?.tick(w.maldVista);
    this.ojos?.tick({
      hablando: this.eventos.hablando,
      danio: this.paso === PASO.DANIO,
      cojea: !!w.cojea,
      maldicion: w.maldVista
    });
    this.eventos.revisar(j);
    this.pensar(j);
    if (!w.mascara && w.prox && w.accion !== PASO.HENRY_MUERTO) this.cambiarPaso(w.prox);
    this.cuadroPaso++;
    this.ejecutarPaso(j);
    w.accion = this.paso;
    if (w.mascaraTimer > 0) w.mascaraTimer--;
    if (!w.armaActiva) this.golpeados.clear();
    this.eventos.hablar(j);
    this.separarDeHenry(j);
    if (w.fueraEscena) {
      this.pos[0] += w.dirMov[0] * w.vel;
      this.pos[2] += w.dirMov[1] * w.vel;
      if (w.puntoCamino) this.pos[1] = w.puntoCamino[1] + 129;
    } else if (w.vel) {
      const antes = [ this.pos[0], this.pos[2] ];
      this.movedor.mover(this.pos, w.dirMov[0] * w.vel, w.dirMov[1] * w.vel, 60);
      let movido = Math.hypot(this.pos[0] - antes[0], this.pos[2] - antes[1]);
      if (movido < w.vel * .3) {
        const dx = w.dirMov[0] * w.vel, dz = w.dirMov[1] * w.vel, alto = [ this.pos[0], this.pos[1] - 60, this.pos[2] ];
        if (!this.movedor.bloqueado(alto, dx, dz, 60)) {
          const q = [ this.pos[0] + dx, this.pos[1], this.pos[2] + dz ], y = this.movedor.piso(q, 80, 120);
          if (y != null && this.pos[1] - y <= 70) {
            this.pos[0] = q[0];
            this.pos[2] = q[2];
            this.pos[1] = y;
            movido = Math.hypot(dx, dz);
          }
        }
      }
      w.hurdle = w.vel > 2 && movido < w.vel * .3 ? 2 : 0;
    } else {
      w.hurdle = 0;
      const y = this.movedor.piso(this.pos, 120);
      if (y != null) this.pos[1] = y;
    }
    this.avanzarAnim();
    this.pasos();
    this.golpeEnemigos();
    this.trabada(j);
  }
  trabada() {
    const w = this.w, movido = distXZ(this.pos, this.posAnt);
    if (this.paso === PASO.SIGUE && w.vel > 2 && movido < w.vel * .3) w.trabas = (w.trabas || 0) + 1; else w.trabas = 0;
  }
  analizar(j) {
    const w = this.w;
    w.distAnt = w.dist;
    w.dist = j.existe === false ? 1e9 : dist3(this.pos, j.pos);
    if (w.dist < C.LEJOS) this.g.tiempoConHenry++;
    w.rumboHenry = rumboHacia(j.pos, this.pos);
    w.ang = this.angA(w.rumboHenry);
    w.henryAtaca = [ 3, 4, 5 ].includes(j.estado) ? 1 : 0;
    if (j.tocoPuerta) w.puertaTimer = 60;
    if (w.puertaTimer) {
      w.puertaTimer--;
      w.apura = 1;
    } else w.apura = 0;
    if (!w.cojea) {
      if (this.nivelVida() > 2) w.cojea = 1;
    } else if (this.nivelVida() < 3) w.cojea = 0;
    w.actitud = [ 0, 1, 4, 2, 3, 4 ][w.arma] || 0;
  }
  recibir({tipo: tipo = 3, danio: danio = 0, origen: origen = null, grande: grande = false, id: id = null, enemigo: enemigo = null} = {}) {
    const p = this.pend;
    if (p && p.tipo >= tipo) return;
    this.pend = {
      tipo: tipo,
      danio: danio,
      grande: grande,
      id: id ?? Math.random(),
      enemigo: enemigo,
      origen: origen ? [ ...origen ] : [ ...this.m.jugador().pos ]
    };
  }
  golpeDeEnemigo(e, danio = 10, grande = false, id = null) {
    this.recibir({
      tipo: 3,
      danio: danio,
      grande: grande,
      origen: e?.pos,
      id: id ?? e?.id + ":" + (e?.paso ?? "") + ":" + (e?.sub ?? "")
    });
  }
  empujeDeEnemigo(e) {
    const w = this.w;
    if (!e || w.empujeDe === e && w.empujeTimer > 0) return;
    this.recibir({
      tipo: 2,
      origen: e.pos,
      enemigo: e
    });
  }
  tomarGolpes() {
    const w = this.w, p = this.pend;
    this.pend = null;
    if (w.empujeTimer > 0) w.empujeTimer--; else w.empujeDe = null;
    w.golpe = 0;
    if (!p) return;
    w.golpe = p.tipo;
    w.golpeOrigen = p.origen;
    if (p.tipo === 3) {
      w.golpeDanio = p.danio;
      w.golpeGrande = p.grande ? 1 : 0;
      w.golpeIdNuevo = p.id;
    }
    if (p.tipo === 2 && p.enemigo) {
      w.empujeDe = p.enemigo;
      w.empujeTimer = 90;
    }
  }
  golpeDeHenry(origen) {
    this.recibir({
      tipo: 1,
      origen: origen
    });
  }
  procesarGolpes() {
    const w = this.w;
    if (w.golpeTimer > 0) {
      w.golpeTimer--;
      return;
    }
    if (w.golpe === 3 && !w.invencible && w.golpeIdNuevo !== w.golpeId) {
      w.golpeId = w.golpeIdNuevo;
      w.golpeTimer = 15;
      if (w.vida > 0) {
        this.herir(w.golpeDanio);
        w.danioFuerte = w.golpeGrande;
      }
    }
  }
  herir(d) {
    const w = this.w;
    w.vida = Math.max(C.VIDA_MAX * C.VIDA_PISO, Math.min(C.VIDA_MAX, w.vida - d));
    this.g.danioTotal += d;
  }
  avanzaMaldicion(v) {
    const w = this.w;
    w.maldicion = Math.max(0, Math.min(1, w.maldicion + v));
  }
  bajaMaldicion(v) {
    const w = this.w;
    if (w.maldicion < w.maldBase) v *= .5;
    w.maldicion = Math.max(0, Math.min(1, w.maldicion - v));
  }
  maldicionCuadro() {
    const w = this.w;
    w.vida = Math.max(C.VIDA_MAX * C.VIDA_PISO, Math.min(C.VIDA_MAX, w.vida + C.VIDA_REGEN));
    if (this.nivelVida() < 3) {
      if (w.maldBase < w.maldicion) this.bajaMaldicion(C.MALD_BAJA);
    } else this.bajaMaldicion(C.MALD_BAJA_HERIDA);
    if (w.arma === ARMA.METRALLETA && (this.m.dificultad ?? 1) !== 2) this.avanzaMaldicion(C.MALD_METRALLETA);
    w.maldicion += Math.max(0, Math.min(C.MALD_SUBE, w.maldBase - w.maldicion));
    w.maldVista += Math.max(-C.MALD_VISTA, Math.min(C.MALD_VISTA, w.maldicion - w.maldVista));
    w.sufre = 0;
    if (!w.maldiceHenry) {
      const f = this.m.maldicionEn?.(this.pos) || 0;
      if (f) {
        this.herir(f);
        this.avanzaMaldicion(f * .01);
        w.sufre = 1;
      }
    }
    if (w.maldVista !== 0) {
      const p = [ this.pos[0], this.pos[1] - 100, this.pos[2] ];
      const f = w.maldiceHenry ? this.m.maldecirHenry?.(p, 800, w.maldVista * 2.5) || 0 : this.m.purificacionEn?.(p) || 0;
      w.maldiceHenry = 0;
      if (f) this.bajaMaldicion(f * .01);
    }
  }
  analizarEnemigos() {
    const w = this.w, lista = this.m.enemigos?.() || [];
    w.enemigo = null;
    let mejor = 1800, el = null;
    for (const e of lista) {
      if (!e?.pos || e.cond === 11) continue;
      if ([ "CELL", "MM", "HIL" ].includes(e.tipo)) continue;
      const dy = e.pos[1] - this.pos[1];
      if (dy > 100 || dy < -500) continue;
      if (this.movedor.bloqueado([ this.pos[0], this.pos[1], this.pos[2] ], e.pos[0] - this.pos[0], e.pos[2] - this.pos[2], 0) && this.etapa() !== 11) continue;
      let d = distXZ(e.pos, this.pos);
      if (e.tipo === "WHEEL") d *= .25;
      if (d < mejor) {
        mejor = d;
        el = e;
      }
    }
    const jo = this.m.jugador().objetivo;
    if (jo && jo.cond !== 11 && lista.some(e => mismo(e, jo))) {
      const d = distXZ(jo.pos, this.pos);
      if (d <= 1080 && d - 200 <= mejor) {
        el = jo;
        mejor = d;
      }
    }
    if (!el) return;
    w.enemigo = el;
    w.enemigoPos = [ ...el.pos ];
    w.enemigoDist = distXZ(el.pos, this.pos);
    w.enemigoDir = rumboHacia(el.pos, this.pos);
    w.enemigoAng = this.angA(w.enemigoDir);
    w.enemigoAgarra = el.cond === 6 ? 1 : 0;
    w.enemigoGrande = [ "TWINS", "NURSE" ].includes(el.tipo) ? 1 : 0;
    if (el.cond === 10) {
      w.metodo = w.arma === ARMA.CACHIPORRA ? 0 : 5;
      return;
    }
    const alto = el.pos[1] - (this.pos[1] - 200);
    const b = alto > 100 ? 2 : alto >= -50 ? 1 : 0;
    let mt;
    switch (el.tipo) {
     case "BUZZ":
      mt = (b !== 0) + 1;
      return void (w.metodo = mt);

     case "WALLMAN":
      mt = (b > 1) + 1;
      return void (w.metodo = mt);

     case "WHEEL":
      return void (w.metodo = 2);

     case "TWINS":
      mt = (b > 1) + 1;
      break;

     case "HYENA":
      return void (w.metodo = (b !== 0) + 2);

     default:
      mt = b + 1;
    }
    if (b === 1 && this.nivelVida() < 3 && this.nivelMald() < 2 && Math.abs(w.enemigoAng) <= .08726647 && azar(8) === 0) mt = 4;
    w.metodo = mt;
  }
  etapa() {
    return this.m.escena?.()?.etapa ?? 0;
  }
  escenaN() {
    return this.m.escena?.()?.escena ?? 0;
  }
  pensar(j) {
    const w = this.w;
    w.prox = 0;
    if (w.fueraEscena) return this.pensarFuera(j);
    if (w.henryMuerto && j.estado !== 10) {
      w.henryMuerto = 0;
      w.prox = 0;
      this.paso = -1;
      this.cambiarPaso(PASO.ESPERA);
      w.mascaraTimer = 0;
      w.mascara = 0;
    }
    const yoEstado = this.estadoExportado();
    if (yoEstado === 10) return;
    if (!w.mascara) {
      this.pensarOrdenes();
      if (!w.prox) {
        this.pensarHenry(j);
        this.pensarEnemigo(j);
      }
    }
    if (w.accion === PASO.SIGUE && w.prox === PASO.ESPERA) {
      w.prox = PASO.RESPIRA;
      w.proxObj = 0;
    }
    this.pensarChoque();
    this.pensarObstaculo();
    if (w.vida <= 0) {
      w.prox = PASO.CAIDA;
      w.proxObj = 0;
    }
    if (j.estado === 10) {
      w.henryMuerto = 1;
      if (Math.abs(w.ang) > C.APUNTA) {
        w.dirObj = w.rumboHenry;
        w.proxObj = 1;
        w.prox = PASO.GIRO;
      } else {
        w.prox = PASO.HENRY_MUERTO;
        w.proxObj = 1;
      }
    }
  }
  pensarFuera() {
    const w = this.w;
    if (w.globalFallo) {
      w.prox = PASO.ESPERA;
      w.proxObj = 0;
      return;
    }
    const c = this.caminos(), r = c ? this.buscarGlobal(c) : {
      r: -1
    };
    if (r.r < 0) {
      w.prox = PASO.ESPERA;
      w.proxObj = 0;
      w.globalFallo = 1;
      return;
    }
    if (r.punto) {
      const p = c.aEscena(r.punto);
      w.puntoCamino = p;
      w.dirObj = rumboHacia(p, this.pos);
      if (c.ver) c.ruta("eileen-global", this.pos, [ p, ...this.tg.puntos.slice(this.tg.i + 1).map(q => c.aEscena(q)) ], 6340863);
    }
    w.distObj = 2e4;
    w.prox = PASO.SIGUE;
    w.proxObj = 0;
    if (r.r !== 0) {
      w.fueraEscena = 0;
      w.escenaEil = this.escenaN();
      w.puntoCamino = null;
      const y = this.movedor.piso(this.pos, 300, 600);
      if (y != null) this.pos[1] = y;
      this.posAnt = [ ...this.pos ];
      c?.ruta?.("eileen-global", null, []);
    }
  }
  buscarGlobal(c) {
    const w = this.w, esc = this.escenaN(), pe = c.aEtapa(this.pos);
    switch (w.estadoGlobal) {
     case 1:
      {
        if (this.etapa() === 5 && esc === 2 && w.escenaEil === 3 && pe[1] > 5e3) {
          w.estadoGlobal = 0;
          return {
            r: -1
          };
        }
        const dest = w.destinoGlobal || c.aEtapa(this.m.jugador().pos);
        if (!w.inicioGlobal || !this.tg.crearGlobal(c, w.inicioGlobal, w.escenaEil, dest, esc)) {
          w.estadoGlobal = 0;
          return {
            r: -1
          };
        }
        w.estadoGlobal = 2;
      }

     case 2:
      if (d2xz(pe, w.inicioGlobal) >= 1600) return {
        r: 0,
        punto: w.inicioGlobal
      };
      w.estadoGlobal = 3;

     case 3:
      {
        const p = this.tg.punto();
        if (p && d2xz(pe, p) < 1600) {
          if (p[3] === esc || p[4] === esc) {
            w.estadoGlobal = 4;
            return {
              r: 1
            };
          }
          this.tg.avanzar();
        }
        return {
          r: 0,
          punto: this.tg.punto()
        };
      }

     case 4:
      return {
        r: 1
      };

     default:
      return {
        r: -1
      };
    }
  }
  pensarHenry(j) {
    const w = this.w;
    if (j.existe === false) return;
    const c = this.caminos();
    let rumbo = w.rumboHenry, ang = w.ang;
    const pared = c ? c.obstaculo(this.pos, j.pos) : this.movedor.bloqueado(this.pos, j.pos[0] - this.pos[0], j.pos[2] - this.pos[2], 0);
    if (!pared) w.estadoCamino = 0; else if (w.estadoCamino === 0) w.estadoCamino = 1;
    if (w.estadoCamino !== 0 && c) {
      const r = buscarCaminoEil(c, this.tc, w, this.pos, j.pos);
      if (r.r < 0) {
        w.prox = PASO.ESPERA;
        w.proxObj = 0;
        w.esqPide = 1;
        w.caminoBloqueado = 0;
        return;
      }
      if (r.r === 0 && r.punto) {
        w.puntoCamino = r.punto;
        rumbo = rumboHacia(r.punto, this.pos);
        ang = this.angA(rumbo);
        if (c.ver) c.ruta("eileen", this.pos, this.tc.puntos.slice(this.tc.i));
      }
    } else {
      w.puntoCamino = null;
      if (c?.ver) c.ruta("eileen", null, []);
    }
    const enCamino = w.estadoCamino !== 0 && !!c;
    w.caminoBloqueado = enCamino ? 1 : 0;
    w.dirObj = rumbo;
    if (w.dist > C.SIGUE_LEJOS) {
      w.prox = PASO.SIGUE;
      w.proxObj = 1;
      w.distObj = 0;
    }
    if (!enCamino) w.proxObj = 1; else {
      w.prox = PASO.SIGUE;
      w.proxObj = 0;
      w.distObj = 2e4;
    }
    if (Math.abs(ang) > C.GIRA) {
      w.prox = PASO.GIRO;
      w.proxObj = enCamino ? 0 : 1;
    }
  }
  puedeAtacar() {
    const w = this.w;
    if (!w.arma) return false;
    let a = w.actitud;
    if (w.enemigoAgarra) a = 4;
    const nm = this.nivelMald();
    if (nm === 2) a -= 1;
    if (nm === 3) a -= 2;
    a = Math.max(0, a);
    const nv = this.nivelVida();
    switch (a) {
     case 0:
      return false;

     case 1:
      return !!w.timerAtaque && w.enemigoDist <= C.SIGUE_LEJOS && nv <= 1;

     case 2:
      return !!w.timerAtaque && nv <= 1;

     case 3:
      return (w.enemigoDist <= C.APURA || !!w.timerAtaque) && nv < 3;

     case 4:
      return nv < 3;

     default:
      return true;
    }
  }
  pensarEnemigo() {
    const w = this.w;
    if (w.henryAtaca) w.timerAtaque = w.actitud === 1 ? 30 : w.actitud === 2 ? 90 : 150;
    w.timerAtaque = Math.max(0, w.timerAtaque - 1);
    if (!w.enemigo) {
      if ([ PASO.APUNTA, PASO.ESPECIAL, PASO.DISPARO ].includes(w.accion)) {
        w.prox = PASO.ESPERA;
        w.proxObj = 0;
      }
      return;
    }
    const rango = [ 800, 900, 1e3, 1100, 1300 ][w.actitud] ?? 1100;
    if (this.etapa() === 11 && this.escenaN() === 7 || w.dist <= rango && !w.apura) {
      if (this.puedeAtacar()) this.pensarAtaque(); else this.pensarEscape();
    } else if (w.prox === PASO.SIGUE && this.enemigoDelante()) {
      w.prox = PASO.COSTADO;
      w.proxObj = 2;
      w.lado = -1;
    }
  }
  enemigoDelante(largo = 120) {
    const lista = this.m.enemigos?.() || [], f = this.dirCuerpo;
    for (const e of lista) {
      if (!e?.pos || e.cond >= 10 || [ "CELL", "MM", "HIL" ].includes(e.tipo)) continue;
      const dx = e.pos[0] - this.pos[0], dz = e.pos[2] - this.pos[2];
      const fr = dx * f[0] + dz * f[1], la = Math.abs(dx * f[1] - dz * f[0]);
      if (fr > 0 && fr < largo + 100 && la < 100) return true;
    }
    return false;
  }
  pensarEscape() {
    const w = this.w, d = w.enemigoDist;
    const darVuelta = () => {
      if (Math.abs(w.enemigoAng) > C.GIRA) {
        w.dirObj = w.enemigoDir;
        w.prox = PASO.GIRO;
        w.proxObj = 2;
      }
    };
    if (d > 900) {
      w.prox = PASO.ESPERA;
      w.proxObj = 2;
      darVuelta();
      return;
    }
    if (d > 700) {
      if (w.accion !== PASO.APUNTA) {
        w.prox = PASO.ESPERA;
        w.proxObj = 2;
      }
      darVuelta();
      return;
    }
    if (d > C.SIGUE_LEJOS) {
      if (w.accion !== PASO.SIGUE) {
        const lado = this.ladoLibre();
        if (lado === -1) {
          w.prox = PASO.ESPERA;
          w.proxObj = 2;
        } else if (lado === 2) {
          w.dirObj = w.enemigoDir;
          w.dirMov = [ -Math.sin(w.dirObj), -Math.cos(w.dirObj) ];
          w.prox = PASO.APUNTA;
          w.proxObj = 2;
        } else {
          w.mascara = 0;
          w.prox = PASO.COSTADO;
          w.proxObj = 0;
          w.lado = lado;
        }
      }
      darVuelta();
      return;
    }
    const q = this.puntoEscape() || [ w.enemigoPos[0] - Math.sin(w.enemigoDir) * 400, 0, w.enemigoPos[2] - Math.cos(w.enemigoDir) * 400 ];
    const L = distXZ(q, this.pos);
    if (L >= 100) {
      w.dirObj = rumboHacia(q, this.pos);
      w.prox = PASO.SIGUE;
      w.proxObj = 2;
      w.distObj = 2e4;
      if (this.enemigoDelante()) {
        w.prox = PASO.COSTADO;
        w.proxObj = 2;
        w.lado = -1;
      }
      if (Math.abs(this.angA(w.dirObj)) > C.GIRA) {
        w.prox = PASO.GIRO;
        w.proxObj = 2;
      }
    } else {
      w.prox = PASO.ESPERA;
      w.proxObj = 2;
      darVuelta();
    }
  }
  puntoEscape() {
    const c = this.caminos(), red = c?.detalle, w = this.w;
    if (!red) return null;
    const de = [ w.enemigoPos[0] - this.pos[0], w.enemigoPos[1] - this.pos[1], w.enemigoPos[2] - this.pos[2] ];
    const L = Math.hypot(...de) || 1;
    de[0] /= L;
    de[1] /= L;
    de[2] /= L;
    let mejor = null, m = 2;
    for (let i = 0; i < Math.min(red.n, 32); i++) {
      const v = red.pos(i);
      v[1] = this.pos[1];
      if (c.obstaculo(this.pos, v)) continue;
      if ((v[0] - w.enemigoPos[0]) ** 2 + (v[1] - w.enemigoPos[1]) ** 2 + (v[2] - w.enemigoPos[2]) ** 2 < 36e4) continue;
      const dv = [ v[0] - this.pos[0], v[1] - this.pos[1], v[2] - this.pos[2] ], l = Math.hypot(...dv) || 1;
      const p = (dv[0] * de[0] + dv[1] * de[1] + dv[2] * de[2]) / l;
      if (p < m) {
        m = p;
        mejor = v;
      }
    }
    return mejor;
  }
  pensarAtaque() {
    const w = this.w;
    w.dirObj = w.enemigoDir;
    let a = Math.abs(w.enemigoAng);
    if (w.arma === ARMA.METRALLETA) a *= 2;
    if (a > PI / 4) {
      w.prox = PASO.GIRO;
      w.proxObj = 2;
      return;
    }
    if (this.otroDelante()) {
      w.prox = PASO.COSTADO;
      w.lado = -1;
      w.proxObj = 2;
      return;
    }
    let rango = ALCANCE[w.arma];
    const d = w.enemigoDist;
    if (w.arma !== ARMA.METRALLETA) {
      if (w.metodo === 5) rango = w.enemigoGrande ? 160 : 100;
      if (Math.abs(rango - d) >= 40) {
        if (d > 360) {
          w.distObj = d;
          w.prox = PASO.SIGUE;
          w.proxObj = 2;
        } else if (rango < d) {
          w.dirMov = [ Math.sin(w.dirObj), Math.cos(w.dirObj) ];
          w.prox = PASO.APUNTA;
          w.proxObj = 2;
        } else {
          w.dirMov = [ -Math.sin(w.dirObj), -Math.cos(w.dirObj) ];
          w.prox = PASO.APUNTA;
          w.proxObj = 2;
        }
        return;
      }
      const P = [ 0, PASO.ATAQUE, PASO.ATAQUE_MEDIO, PASO.ATAQUE_BAJO, PASO.ESPECIAL, PASO.REMATE ][w.metodo];
      if (P) {
        w.prox = P;
        w.proxObj = 2;
      }
      return;
    }
    if (d < rango) {
      w.dirMov = [ -Math.sin(w.dirObj), -Math.cos(w.dirObj) ];
      w.prox = PASO.APUNTA;
      w.proxObj = 2;
    } else if (d <= 700) {
      w.prox = PASO.DISPARO;
      w.proxObj = 2;
    } else {
      w.distObj = d;
      w.prox = PASO.SIGUE;
      w.proxObj = 2;
    }
  }
  otroDelante() {
    const lista = this.m.enemigos?.() || [], w = this.w, f = this.dirCuerpo;
    for (const e of lista) {
      if (mismo(e, w.enemigo) || !e?.pos || e.cond >= 10) continue;
      const dx = e.pos[0] - this.pos[0], dz = e.pos[2] - this.pos[2];
      const fr = dx * f[0] + dz * f[1], la = Math.abs(dx * f[1] - dz * f[0]);
      if (fr > 0 && fr < w.enemigoDist && la < 100) return true;
    }
    return false;
  }
  ladoLibre() {
    const f = this.dirCuerpo, d = 200;
    const izq = [ f[1], -f[0] ], der = [ -f[1], f[0] ];
    if (!this.movedor.bloqueado(this.pos, izq[0] * d, izq[1] * d, 40)) return 0;
    if (!this.movedor.bloqueado(this.pos, der[0] * d, der[1] * d, 40)) return 1;
    if (!this.movedor.bloqueado(this.pos, -f[0] * d, -f[1] * d, 40)) return 2;
    return -1;
  }
  pensarOrdenes() {
    const w = this.w, o = w.ordenes;
    for (let i = 0; i < 6; i++) {
      if (o[i] !== 1) continue;
      if (i === 0) {
        w.prox = PASO.HABLA;
        w.proxObj = 0;
      } else if (i === 1) {
        w.prox = PASO.LOCURA;
        w.proxObj = 0;
      } else if (i === 2) {
        const d = distXZ(w.ordenIr, this.pos);
        if (d < 160) {
          o[i] = 2;
          continue;
        }
        w.distObj = d;
        const r = rumboHacia(w.ordenIr, this.pos);
        if (Math.abs(this.angA(r)) > C.APUNTA) {
          w.irDeslizando = 0;
          w.dirObj = r;
          w.prox = PASO.GIRO;
          w.proxObj = 0;
        } else if (this.enemigoDelante()) {
          w.irDeslizando = 1;
          w.prox = PASO.COSTADO;
          w.proxObj = 0;
          w.lado = -1;
        } else {
          w.irDeslizando = 0;
          w.dirObj = r;
          w.prox = PASO.SIGUE;
          w.proxObj = 0;
        }
      } else if (i === 3) {
        const r = rumboHacia(w.ordenGirar, this.pos);
        if (Math.abs(this.angA(r)) < C.APUNTA) {
          o[i] = 2;
          continue;
        }
        w.dirObj = r;
        w.prox = PASO.GIRO;
        w.proxObj = 0;
      } else if (i === 4) {
        if (w.arma === w.armaPedida) {
          o[i] = 2;
          continue;
        }
        w.prox = PASO.EQUIPA;
        w.proxObj = 0;
      } else if (i === 5) {
        o[i] = 2;
        continue;
      }
    }
  }
  pensarChoque() {
    const w = this.w;
    if (!w.golpe || w.invencible) return;
    if (w.golpe === 1) {
      w.prox = PASO.DANIO;
      w.proxObj = 1;
    } else if (w.golpe === 3) {
      w.mascara = 0;
      w.prox = PASO.DANIO;
      w.proxObj = 3;
    } else if (w.golpe === 2) {
      w.prox = PASO.DANIO;
      w.proxObj = 3;
    } else if (w.golpe === 4 && !(this.etapa() === 7 && this.escenaN() === 12)) {
      w.prox = PASO.EMPUJADA;
      w.proxObj = 1;
    }
  }
  pensarObstaculo() {
    const w = this.w;
    if (w.prox === PASO.DANIO || w.prox === PASO.CAIDA) {
      w.esqPide = 0;
      return;
    }
    if (w.esquivaEspera > 0) w.esquivaEspera--;
    const fin = () => {
      w.esqPide = 0;
    };
    switch (w.esquiva) {
     case 0:
      if (!w.hurdle && !w.esqPide) {
        w.esquivaVeces = 0;
        return;
      }
      if (w.accion === PASO.EMPUJADA) {
        w.mascara = 0;
        w.prox = PASO.COSTADO;
        w.proxObj = 1;
        w.lado = -1;
        w.esquivaTimer = 30;
        w.esquiva = 1;
        return fin();
      }
      if (w.accion === PASO.SIGUE && w.hurdle === 2) w.esqPide = 1;
      if (w.esqPide === 1 && w.esquivaVeces > 2) w.esqPide = 2;
      if (w.esqPide === 1) {
        let l = this.ladoLibre();
        if (l > 1) l = -1;
        w.mascara = 0;
        w.prox = PASO.COSTADO;
        w.proxObj = 0;
        w.lado = l;
        w.esquiva = 1;
        w.esquivaTimer = 25;
        return fin();
      }
      if (w.esqPide === 2) {
        w.esquiva = 2;
        return fin();
      }
      return fin();

     case 1:
      if (w.accion === PASO.COSTADO) {
        if (w.esquivaTimer-- > 0) {
          w.prox = PASO.COSTADO;
          w.proxObj = 1;
          w.lado = -1;
          w.esquivaEspera = 60;
          return fin();
        }
        w.prox = PASO.ESPERA;
        w.proxObj = 0;
        w.esquivaVeces++;
        w.esquivaEspera = 60;
        return fin();
      }
      w.esquiva = 0;
      return fin();

     case 2:
      {
        const p = this.puntoCercano();
        if (!p) {
          w.prox = PASO.ESPERA;
          w.proxObj = 0;
          w.esquiva = 0;
          return fin();
        }
        w.esqPunto = p;
        w.esquiva = 3;
      }

     case 3:
      {
        const r = rumboHacia(w.esqPunto, this.pos);
        if (Math.abs(this.angA(r)) >= C.APUNTA) {
          w.dirObj = r;
          w.prox = PASO.GIRO;
          w.proxObj = 0;
          return fin();
        }
        w.esquivaTimer = 60;
        w.esquiva = 4;
        return fin();
      }

     case 5:
      if (w.accion !== PASO.SIGUE) {
        w.esquiva = 0;
        return fin();
      }

     case 4:
      {
        if (w.esquivaTimer-- < 1) {
          w.prox = PASO.ESPERA;
          w.proxObj = 0;
          return fin();
        }
        const p = w.esqPunto, d = Math.hypot(p[0] - this.pos[0], p[1] - this.pos[1], p[2] - this.pos[2]);
        w.distObj = d;
        if (d <= 60) w.prox = PASO.ESPERA; else {
          w.dirObj = rumboHacia(p, this.pos);
          w.prox = PASO.SIGUE;
        }
        w.esquiva = 5;
        w.proxObj = 0;
        return fin();
      }

     default:
      w.esquiva = 0;
      return fin();
    }
  }
  puntoCercano() {
    const c = this.caminos(), red = c?.detalle;
    if (!red) return null;
    let mejor = null, dm = 2e4;
    for (let i = 0; i < red.n; i++) {
      const v = red.pos(i);
      v[1] = this.pos[1];
      if (c.obstaculo(this.pos, v)) continue;
      const d = Math.hypot(v[0] - this.pos[0], v[2] - this.pos[2]);
      if (d < dm) {
        dm = d;
        mejor = v;
      }
    }
    return mejor && dm >= 60 && dm < 4e3 ? mejor : null;
  }
  estadoExportado() {
    const a = this.w.accion;
    if ([ 3, 6, 8 ].includes(a)) return 1;
    if (a === 5) return 4;
    if (a === 7) return 6;
    if (a >= 12 && a <= 17) return 5;
    if (a === 20 || a === 21) return 10;
    return 0;
  }
  ejecutarPaso(j) {
    switch (this.paso) {
     case PASO.ESPERA:
      return this.esperar();

     case PASO.GIRO:
      return this.girar();

     case PASO.SIGUE:
      return this.seguir(j);

     case PASO.FRENA:
      return this.frenar();

     case PASO.APUNTA:
      return this.apuntar();

     case PASO.COSTADO:
      return this.costado();

     case PASO.DANIO:
      return this.danio();

     case PASO.EMPUJADA:
      return this.empujada(j);

     case PASO.RESPIRA:
      return this.respirar();

     case PASO.INQUIETA:
      return this.inquieta();

     case PASO.EQUIPA:
      return this.equipar();

     case PASO.ATAQUE:
      return this.atacar(ANIM.ATAQUE, [ [ 9, 30, 0 ] ], 42, true);

     case PASO.ATAQUE_MEDIO:
      return this.atacar(ANIM.ATAQUE_MEDIO, [ [ 17, 29, 0 ] ], 45);

     case PASO.ATAQUE_BAJO:
      return this.atacar(ANIM.ATAQUE_BAJO, [ [ 19, 34, 0 ] ], 52);

     case PASO.ESPECIAL:
      return this.atacar([ ANIM.ESPECIAL_BOLSO, ANIM.ESPECIAL ], [ [ 15, 30, 1 ], [ 50, 67, 1 ], [ 85, 105, 1 ] ], 124);

     case PASO.REMATE:
      return this.atacar([ ANIM.REMATE_BOLSO, ANIM.REMATE ], [ [ 15, 40, 4 ], [ 55, 75, 4 ] ], 95);

     case PASO.DISPARO:
      return this.disparar();

     case PASO.HABLA:
      return this.hablar();

     case PASO.LOCURA:
      return this.locura();

     case PASO.HENRY_MUERTO:
      return this.henryMuerto();

     case PASO.CAIDA:
      return this.caida();

     default:
      return undefined;
    }
  }
  tomarObjetivo() {
    this.w.objetivo = this.w.proxObj;
  }
  girarAlObjetivo() {
    const w = this.w, a = this.angA(w.dirObj);
    if (Math.abs(a) > C.GIRO_OBJ) this.rot = envolver(this.rot + Math.sign(a) * C.GIRO_OBJ);
  }
  esperar() {
    const w = this.w;
    const tipo = (this.nivelMald() > 2 ? 1 : 0) + (w.sufre ? 1 : 0);
    if (this.sub === 0) {
      w.mascara = 0;
      w.tipoEspera = tipo;
      this.ponerAnim([ ANIM.QUIETA, ANIM.QUIETA_MALDITA, ANIM.QUIETA_SUFRE ][tipo], {
        mezcla: .5
      });
      w.timer = azar01() * C.ESPERA_AZAR + C.ESPERA_MIN;
      this.sub = 1;
    }
    this.tomarObjetivo();
    w.vel = w.velAnt * .7;
    w.dirMov = this.dirCuerpo;
    if (w.tipoEspera !== tipo) {
      this.sub = 0;
      return;
    }
    if (tipo === 0 && w.objetivo === 1 && (w.timer -= 1) < 0) this.cambiarPaso(PASO.INQUIETA);
  }
  girar() {
    const w = this.w;
    if (this.sub === 0) {
      w.vel = 0;
      w.mascara = 1;
      this.tomarObjetivo();
      const a = this.angA(w.dirObj);
      let n = a < 0 ? ANIM.GIRO_A : ANIM.GIRO_B;
      if (Math.abs(a) > C.GIRO_GRANDE) {
        n++;
        w.giroGrande = 1;
        w.giroCuadros = 30;
      } else {
        w.giroGrande = 0;
        w.giroCuadros = 25;
      }
      this.ponerAnim(n, {
        mezcla: .2
      });
      w.giroVel = a / w.giroCuadros;
      this.sub = 1;
    }
    if (this.sub === 2) return this.terminar();
    if (this.cuadro >= (w.giroGrande ? 20 : 15)) w.mascara = 0;
    if (this.animFin) {
      this.sub = 2;
      return;
    }
    if (w.giroCuadros > 0) {
      if (w.objetivo === 1) w.dirObj = w.rumboHenry;
      const quiere = this.angA(w.dirObj) / w.giroCuadros, tope = w.giroGrande ? .15 : .1;
      if (w.giroVel < quiere) w.giroVel += .005;
      if (w.giroVel > quiere) w.giroVel -= .005;
      w.giroVel = Math.max(-tope, Math.min(tope, w.giroVel));
      this.rot = envolver(this.rot + w.giroVel);
      w.dirMov = this.dirCuerpo;
      w.giroCuadros -= 1;
    }
  }
  seguir(j) {
    const w = this.w;
    if (this.sub === 0) {
      w.mascara = 0;
      w.vel = 0;
      w.param = .05;
      this.sub = 1;
    }
    if (this.sub === 1) {
      w.cojeaAnim = w.cojea;
      this.ponerAnim(w.cojea ? ANIM.COJEA : ANIM.CAMINA, {
        mezcla: .3,
        loop: true,
        sub: w.cojea ? ANIM.COJEA_CORRE : ANIM.CORRE,
        ratio: 0
      });
      this.sub = 2;
    }
    this.tomarObjetivo();
    let tipo = 1;
    if (w.caminoBloqueado) tipo = 2;
    if (w.fueraEscena) tipo = 3;
    if (w.objetivo === 1) tipo = 0;
    if (w.ordenes[2] === 1) tipo = 1;
    if (tipo === 0) w.dirObj = w.rumboHenry;
    if (tipo !== 3) {
      const a = this.angA(w.dirObj);
      if (Math.abs(a) > .001) this.rot = envolver(this.rot + Math.max(-C.GIRO_SIGUE, Math.min(C.GIRO_SIGUE, a)));
    } else this.rot = w.dirObj;
    w.dirMov = this.dirCuerpo;
    let s = w.param;
    if (tipo === 0) {
      if (w.dist > C.LEJOS || w.distAnt <= w.dist) s += .05; else if (s <= .15) s += .01; else s -= .05;
      if (w.apura && w.dist > C.APURA) s += .1;
    } else if (tipo !== 3) {
      s += .05;
      if (w.distObj < C.LEJOS) {
        if (s > .15) s -= .1;
        if (s < .15) s = .15;
      }
    } else s += .1;
    if (this.etapa() === 7 && this.escenaN() === 12) {
      const c = this.cuadro;
      if (c > 6 && c < 9 || c > 18 && c < 21) s = .02;
    }
    s = Math.max(0, Math.min(C.PARAM_MAX, s));
    w.param = s;
    const camina = w.cojea ? C.COJEA : C.CAMINA, corre = w.cojea ? C.COJEA_CORRE : C.CORRE;
    let velAnim, vel;
    if (s - .2 <= 0) {
      w.ratio = 0;
      velAnim = s * 5;
      vel = camina * velAnim;
    } else {
      w.ratio = Math.min(1, s - .2);
      velAnim = 1;
      vel = corre * (s - .2) + camina;
    }
    w.vel = vel;
    this.ac.vel = velAnim;
    this.ac.ratio = w.ratio;
    if (this.anim.capa) {
      this.anim.capa.vel = velAnim;
      if (this.anim.capa.sub) this.anim.capa.sub.ratio = w.ratio;
    }
    w.cansancio += Math.trunc(s * 20);
    if (w.cojeaAnim !== w.cojea) this.sub = 1;
    if (tipo === 0 && w.dist < C.PARA) this.cambiarPaso(PASO.RESPIRA);
  }
  frenar() {
    const w = this.w;
    if (this.sub === 0) {
      w.mascara = 0;
      this.ponerAnim(ANIM.FRENA, {
        mezcla: .2
      });
      this.sub = 1;
    }
    if (this.sub === 2) return this.terminar();
    w.vel = w.velAnt * .8;
    if (this.animFin) this.sub = 2;
  }
  apuntar() {
    const w = this.w;
    if (this.sub === 0) {
      this.tomarObjetivo();
      w.mascara = 0;
      w.vel = 0;
      this.ponerAnim(ANIM.APUNTA_ADELANTE, {
        mezcla: .3,
        loop: true,
        sub: ANIM.APUNTA_ATRAS,
        ratio: .5,
        vel: 1.5
      });
      w.param = 0;
      this.sub = 1;
    }
    const f = this.dirCuerpo, quiere = f[0] * w.dirMov[0] + f[1] * w.dirMov[1];
    let p = w.param;
    if (p > quiere + .2) p -= .2; else if (p < quiere - .2) p += .2; else p = quiere;
    p = Math.max(-1, Math.min(1, p));
    w.param = p;
    w.ratio = Math.max(0, Math.min(1, (1 - p) * .5));
    if (this.anim.capa?.sub) this.anim.capa.sub.ratio = w.ratio;
    let v = Math.abs(p);
    const c = this.cuadro;
    if (c < 4 || c > 41) v *= .5;
    w.vel = v * 6;
    if (w.objetivo === 2 && w.enemigo) w.dirObj = w.enemigoDir;
    this.girarAlObjetivo();
  }
  costado() {
    const w = this.w;
    if (this.sub === 0) {
      this.tomarObjetivo();
      w.mascara = 0;
      w.vel = 0;
      let lado = w.lado;
      if (lado < 0) lado = this.ladoLibre();
      if (lado < 0 || lado > 1) {
        this.terminar();
        return;
      }
      w.ladoUsado = lado;
      this.ponerAnim(ANIM.COSTADO_A, {
        mezcla: .3,
        loop: true,
        sub: ANIM.COSTADO_B,
        ratio: .5
      });
      w.timer = 150;
      w.param = 0;
      this.sub = 1;
    }
    const f = this.dirCuerpo, s = w.ladoUsado === 0 ? 1 : -1;
    w.dirMov = [ f[1] * s, -f[0] * s ];
    let p = w.param + .1 * s;
    p = Math.max(-1, Math.min(1, p));
    w.param = p;
    w.ratio = (p + 1) * .5;
    if (this.anim.capa?.sub) this.anim.capa.sub.ratio = w.ratio;
    w.vel = Math.abs(p) * 4.6;
    if (--w.timer < 0) return this.terminar();
    if (w.objetivo === 2 && !w.enemigo) return this.terminar();
    if (w.objetivo === 2 && w.enemigo) w.dirObj = w.enemigoDir;
    if (w.objetivo !== 0) this.girarAlObjetivo();
  }
  danio() {
    const w = this.w;
    if (this.sub === 0) {
      this.tomarObjetivo();
      w.mascara = 1;
      if (w.golpe === 1 && !w.enemigo) this.g.golpesDeHenry++;
      const o = w.golpeOrigen, f = this.dirCuerpo;
      const atras = (o[0] - this.pos[0]) * f[0] + (o[2] - this.pos[2]) * f[1] < 0;
      let id;
      if (!w.danioFuerte) id = azar(4) === 0 ? SON.DANIO[azar(4)] : SON.DANIO_COMUN; else id = SON.DANIO_FUERTE;
      this.son(id);
      this.ponerAnim((atras ? 39 : 37) + (w.danioFuerte ? 1 : 0), {
        mezcla: .1
      });
      const d = [ this.pos[0] - o[0], this.pos[2] - o[2] ], L = Math.hypot(d[0], d[1]) || 1;
      w.dirMov = [ d[0] / L, d[1] / L ];
      w.vel = 40;
      w.giroVel = atras ? 0 : this.angA(rumboHacia(o, this.pos)) * .1;
      w.danioFuerte = 0;
      this.sub = 1;
    }
    if (this.sub === 2) return this.terminar();
    const dur = this.anims[this.ac.n]?.duracion || 30;
    if (this.cuadro > dur / 2) w.mascara = 0;
    w.giroVel *= .5;
    this.rot = envolver(this.rot + w.giroVel);
    w.vel = w.velAnt * .5;
    if (this.animFin) {
      w.mascara = 0;
      this.sub = 2;
    }
  }
  empujada(j) {
    const w = this.w, f = this.dirCuerpo;
    const henryAtras = (this.pos[0] - j.pos[0]) * f[0] + (this.pos[2] - j.pos[2]) * f[1] >= 0;
    switch (this.sub) {
     case 0:
      {
        w.mascara = 1;
        this.tomarObjetivo();
        const fuerte = (j.vel ?? 0) > 15;
        this.sub = henryAtras ? fuerte ? 7 : 5 : fuerte ? 3 : 1;
        w.timer = 15;
        return this.empujada(j);
      }

     case 1:
      this.ponerAnim(ANIM.CAMINA_ATRAS, {
        mezcla: .2,
        loop: true
      });
      w.dirMov = [ -f[0], -f[1] ];
      w.aceleracion = .5;
      w.vel = 1;
      this.sub = 2;
      return;

     case 2:
      w.vel = Math.min(8, w.velAnt + w.aceleracion);
      if (henryAtras) {
        this.sub = 0;
        return;
      }
      break;

     case 3:
      this.ponerAnim(ANIM.EMPUJADA_ATRAS, {
        mezcla: .1
      });
      w.dirMov = [ -f[0], -f[1] ];
      w.aceleracion = -.25;
      w.vel = 15;
      if (azar(2) === 0) this.son(SON.EMPUJADA);
      this.sub = 4;
      return;

     case 4:
      w.vel = Math.max(0, w.velAnt + w.aceleracion);
      w.aceleracion -= .1;
      if (this.animFin) this.terminar();
      return;

     case 5:
      this.ponerAnim(ANIM.CAMINA, {
        mezcla: .2,
        loop: true
      });
      w.dirMov = [ ...f ];
      w.aceleracion = 1;
      w.vel = 1;
      this.sub = 6;
      return;

     case 6:
      w.vel = Math.min(10, w.velAnt + w.aceleracion);
      if (!henryAtras) {
        this.sub = 0;
        return;
      }
      break;

     case 7:
      w.dirMov = [ ...f ];
      w.vel = 10;
      w.aceleracion = -.15;
      this.ponerAnim(ANIM.EMPUJADA_ADELANTE, {
        mezcla: .1
      });
      if (azar(2) === 0) this.son(SON.EMPUJADA);
      this.sub = 8;
      return;

     case 8:
      w.vel = Math.max(0, w.velAnt + w.aceleracion);
      w.aceleracion -= .005;
      if (this.animFin) this.terminar();
      return;

     default:
      return;
    }
    if (w.golpe === 4) {
      w.mascara = 1;
      w.timer = 15;
      return;
    }
    w.mascara = 0;
    if (w.timer-- < 0) this.terminar();
  }
  respirar() {
    const w = this.w;
    if (this.sub === 0) {
      w.vel = 0;
      w.mascara = 1;
      if (w.cansancio < 1024) return this.terminar();
      w.respiraFuerte = w.cansancio > 4608 ? 2 : w.cansancio > 3072 ? 1 : 0;
      this.ponerAnim(w.respiraFuerte === 2 ? ANIM.RESPIRA_FUERTE : ANIM.RESPIRA, {
        mezcla: .4,
        loop: true,
        vel: w.respiraFuerte ? 1 : .5
      });
      w.timer = (this.anims[this.ac.n]?.duracion || 30) * (w.respiraFuerte ? 1 : 2);
      w.sonCuadro = -1;
      this.sub = 1;
    }
    if (this.sub === 2) return this.terminar();
    w.mascara = 0;
    this.sonEnCuadro(SON.RESPIRA, w.respiraFuerte === 2 ? 16 : 20);
    if (w.cansancio < 3072 && (w.timer -= 1) < 0) this.sub = 2;
    if (w.respiraFuerte === 2 && w.cansancio < 4608) this.sub = 0;
  }
  sonEnCuadro(id, c) {
    const w = this.w, f = this.cuadro;
    if (f < (w.sonCuadro ?? -1)) w.sonCuadro = -1;
    if (w.sonCuadro < 0 && f >= c) {
      this.son(id);
      w.sonCuadro = c;
    }
  }
  inquieta() {
    const w = this.w;
    if (this.sub === 0) {
      w.vel = 0;
      w.mascara = 1;
      const total = INQUIETAS.reduce((t, x) => t + x[3], 0), r = Math.trunc(azar01() * total);
      let acum = 0, i = 0;
      for (;i < 5; i++) {
        acum += INQUIETAS[i][3];
        if (r < acum) break;
      }
      const [n, , corta, , vel] = INQUIETAS[i];
      this.ponerAnim(n, {
        mezcla: .4,
        vel: vel
      });
      w.inquietaN = i;
      w.timer = corta ? (this.anims[n]?.duracion || 60) / vel * (azar01() + 1) * .5 : 0;
      w.sonCuadro = 1e3;
      if (i === 1) w.sonCuadro = -1;
      this.sub = 1;
    }
    if (this.sub === 2) return this.terminar();
    if (this.cuadro > 4) w.mascara = 0;
    if (w.inquietaN === 1) this.sonEnCuadro(SON.INQUIETA, 18);
    if (w.timer && this.cuadroPaso >= w.timer) this.sub = 2;
    if (this.animFin) this.sub = 2;
  }
  equipar() {
    const w = this.w;
    if (this.sub === 0) {
      w.vel = 0;
      w.mascara = 1;
      this.ponerAnim(ANIM.EQUIPA, {
        mezcla: .2
      });
      this.sub = 1;
    }
    if (this.sub === 1 && this.cuadro >= 12) {
      w.arma = w.armaPedida;
      this.g.arma = w.arma;
      this.ponerArmaModelo(w.arma);
      w.ordenes[4] = 2;
      w.mascara = 0;
      this.sub = 2;
    }
    if (this.sub === 2 && this.animFin) this.sub = 3;
    if (this.sub === 3) this.terminar();
  }
  atacar(anims, ventanas, libre, conBolso = false) {
    const w = this.w;
    if (this.sub === 0) {
      this.tomarObjetivo();
      w.vel = 0;
      w.mascara = 1;
      let n = Array.isArray(anims) ? anims[w.arma === ARMA.BOLSO ? 0 : 1] : anims;
      if (conBolso && w.arma === ARMA.BOLSO) n = ANIM.ATAQUE_BOLSO;
      this.ponerAnim(n, {
        mezcla: .15
      });
      w.ventana = -1;
      this.sub = 1;
    }
    if (this.sub === 2) return this.terminar();
    const c = this.cuadro;
    let activa = -1;
    for (let i = 0; i < ventanas.length; i++) if (c > ventanas[i][0] && c <= ventanas[i][1]) activa = i;
    if (activa !== w.ventana) {
      if (activa >= 0) {
        this.son(SON.BALANCEO[w.arma]);
        this.golpeados.clear();
      }
      w.ventana = activa;
    }
    if (activa >= 0) {
      w.armaActiva = 1;
      w.golpeSub = ventanas[activa][2];
    }
    if (c > libre) w.mascara = 0;
    if (w.enemigo && c < ventanas[0][0]) w.dirObj = w.enemigoDir;
    this.girarAlObjetivo();
    if (this.animFin) this.sub = 2;
  }
  golpeEnemigos() {
    const w = this.w;
    if (!w.armaActiva || !w.arma || w.arma === ARMA.METRALLETA) return;
    const lista = this.m.enemigos?.() || [], alc = ALCANCE[w.arma] + 60;
    for (const e of lista) {
      if (!e?.pos || e.cond === 11 || this.golpeados.has(e.id ?? e)) continue;
      const d = distXZ(e.pos, this.pos), dy = e.pos[1] - this.pos[1];
      if (d > alc || dy > 150 || dy < -600) continue;
      if (Math.abs(this.angA(rumboHacia(e.pos, this.pos))) > PI / 3) continue;
      this.golpeados.add(e.id ?? e);
      const g = golpeDe(w.arma, w.golpeSub ?? 0);
      const r = rumboHacia(e.pos, this.pos);
      try {
        this.m.golpearEnemigo?.(e, g, {
          dir: [ Math.sin(r), 0, Math.cos(r) ]
        });
      } catch (err) {
        console.warn("Eileen golpe", err.message);
      }
    }
  }
  disparar() {
    const w = this.w;
    switch (this.sub) {
     case 0:
      this.tomarObjetivo();
      w.vel = 0;
      w.mascara = 1;
      this.ponerAnim(ANIM.APUNTA_ARMA, {
        mezcla: .2
      });
      this.sub = 1;

     case 1:
      if (!this.animFin) break;
      w.disparoAcierta = 0;
      w.disparos = 1 + azar(4);
      this.sub = 2;

     case 2:
      this.ponerAnim(ANIM.DISPARA, {
        mezcla: 0,
        loop: true
      });
      this.brazo.apuntar(w.enemigoPos);
      this.sub = 3;

     case 3:
      this.son(SON.BALANCEO[ARMA.METRALLETA]);
      if ((this.m.dificultad ?? 1) !== 2) this.avanzaMaldicion(C.MALD_DISPARO);
      if (w.enemigo && Math.abs(w.enemigoAng) <= 1.047198 && w.enemigoDist <= 1600) {
        const r = w.enemigoDir;
        try {
          this.m.golpearEnemigo?.(w.enemigo, "BAK_PLAYER_EIL_GUN_N", {
            dir: [ Math.sin(r), 0, Math.cos(r) ]
          });
        } catch {}
        w.disparoAcierta = 1;
      }
      w.timer = 3;
      this.sub = 4;

     case 4:
      if (--w.timer < 0) {
        this.sub = 3;
        break;
      }
      if (this.cuadro >= (this.anims[this.ac.n]?.duracion || 20) - 1) {
        if (Math.abs(w.enemigoAng) > 1.047198 || !w.disparoAcierta) w.enemigo = null;
        if (w.enemigo && --w.disparos > 0) {
          this.sub = 2;
          break;
        }
        this.sub = 5;
      }
      break;

     case 5:
      this.brazo.soltar();
      this.ponerAnim(ANIM.BAJA_ARMA, {
        mezcla: .1
      });
      this.sub = 6;

     case 6:
      if (this.animFin) this.terminar();
      break;

     default:
      break;
    }
    if (w.enemigo) w.dirObj = w.enemigoDir;
    this.girarAlObjetivo();
  }
  hablar() {
    const w = this.w;
    if (w.ordenes[0] !== 1) {
      this.sub = 4;
    }
    switch (this.sub) {
     case 0:
      w.vel = 0;
      w.mascara = 0;
      if (w.movCharla) {
        this.ponerAnim(w.movCharla, {
          mezcla: .3
        });
        this.sub = 2;
        break;
      }
      this.ponerAnim(ANIM.QUIETA, {
        mezcla: .3
      });
      w.timer = Math.round(azar01() * 60 - .49);
      this.sub = 1;
      break;

     case 1:
      if (w.timer-- < 0) {
        this.ponerAnim(ANIM.HABLA[azar(4)], {
          mezcla: .3,
          vel: (azar01() + 1) * .5
        });
        this.sub = 2;
      }
      break;

     case 2:
      if (this.animFin) {
        this.ponerAnim(ANIM.QUIETA, {
          mezcla: .3
        });
        this.sub = 3;
      }
      break;

     case 4:
      this.terminar();
      break;

     default:
      break;
    }
  }
  locura() {
    const w = this.w, t = Math.max(0, Math.min(2, w.locuraTipo)), [a0, a1, a2] = ANIM.LOCURA[t];
    if (this.sub === 0) {
      w.vel = 0;
      w.mascara = 1;
      this.ponerAnim(a0, {
        mezcla: .3
      });
      w.timer = 0;
      w.sonCuadro = -1;
      w.sonPaso = 0;
      if (t === 2) {
        w.sonEnTiempo = 112;
      }
      this.sub = 1;
    }
    if (this.sub === 1) {
      if (t === 2 && this.cuadro < 100 && --w.timer < 0) {
        this.son(SON.LOCURA[azar(4)]);
        w.timer = azar(8) + 12;
      }
      if (t === 2) this.sonEnCuadro(SON.RESPIRA, 112);
      w.maldiceHenry = 1;
      if (this.animFin) {
        if (!a1) {
          this.sub = 4;
          return;
        }
        this.ponerAnim(a1, {
          mezcla: .2,
          loop: true
        });
        w.sonCuadro = -1;
        this.sub = 2;
      }
      return;
    }
    if (this.sub === 2) {
      w.maldiceHenry = 1;
      if (t === 1) this.sonEnCuadro(SON.LOCURA_RISA, 5);
      if (t === 1 && --w.timer < 0) {
        this.son(azar(2) ? SON.LOCURA[0] : SON.LOCURA[1]);
        w.timer = azar(32) + 15;
      }
      if (w.ordenes[1] !== 1) {
        this.ponerAnim(a2, {
          mezcla: .2
        });
        w.sonCuadro = -1;
        this.sub = 3;
      }
      return;
    }
    if (this.sub === 3) {
      if (t === 0) this.sonEnCuadro(SON.RESPIRA, 16);
      if (t === 1) this.sonEnCuadro(SON.EMPUJADA, 22);
      if (this.animFin) this.sub = 4;
      return;
    }
    this.terminar();
  }
  henryMuerto() {
    const w = this.w;
    if (this.sub === 0) {
      w.vel = 0;
      w.mascara = 1;
      this.ponerAnim(ANIM.HENRY_MUERTO, {
        mezcla: .4
      });
      this.sub = 1;
    }
  }
  caida() {
    const w = this.w;
    switch (this.sub) {
     case 0:
      w.vel = 0;
      w.mascara = 1;
      w.invencible = 1;
      this.avanzaMaldicion(C.MALD_CAIDA);
      this.ponerAnim(ANIM.CAE, {
        mezcla: .15
      });
      this.son(SON.CAE);
      this.sub = w.caidaPrimero ? 2 : 1;
      w.caidaPrimero = 0;
      if (this.sub === 2) return this.caida();
      return;

     case 1:
      w.dirMov = this.dirCuerpo;
      w.vel = this.cuadro > 25 ? 0 : 3;
      if (!this.animFin) return;
      this.sub = 2;

     case 2:
      w.vel = 0;
      this.ponerAnim(ANIM.CAIDA, {
        mezcla: .2,
        loop: true
      });
      w.timer = 4;
      this.sub = 3;

     case 3:
      if (--w.timer < 1) {
        this.son(SON.RESPIRA);
        w.timer = 80;
      }
      w.vida = Math.max(C.VIDA_MAX * C.VIDA_PISO, Math.min(C.VIDA_MAX, w.vida + .05));
      if (this.nivelVida() < 3) {
        this.ponerAnim(ANIM.SE_LEVANTA, {
          mezcla: .2
        });
        this.sub = 4;
      }
      return;

     case 4:
      if (this.animFin) {
        this.g.caidas++;
        w.invencible = 0;
        this.terminar();
      }
      return;

     default:
      return;
    }
  }
  pasos() {
    if (this.w.fueraEscena) return;
    if (this.pies.pasos()) {
      const mat = this.m.material?.(this.pos);
      this.son(SON.PASO[mat] || SON.PASO[1], {
        volumen: 1
      });
    }
  }
  separarDeHenry(j) {
    const w = this.w;
    if (j.existe === false || w.fueraEscena) return;
    if (Math.abs(j.pos[1] - this.pos[1]) > 200) return;
    const dx = j.pos[0] - this.pos[0], dz = j.pos[2] - this.pos[2], d = Math.hypot(dx, dz);
    if (d < .001) return;
    const pl = [ dx / d, dz / d ];
    if (w.golpe === 4) {
      if (this.paso !== PASO.EMPUJADA) {
        let v = [ pl[0] * -1.5, pl[1] * -1.5 ];
        if (w.vel) {
          v[0] += w.dirMov[0] * w.vel;
          v[1] += w.dirMov[1] * w.vel;
        }
        const L = Math.hypot(v[0], v[1]) || 1;
        w.dirMov = [ v[0] / L, v[1] / L ];
        w.vel = .5;
      }
      if (C.SEPARA - d > 0) {
        const k = (C.SEPARA - d) * .9;
        if (this.m.empujarHenry) this.m.empujarHenry([ pl[0] * k, 0, pl[1] * k ]); else this.movedor.mover(this.pos, -pl[0] * k, -pl[1] * k, 60);
      }
    }
    if (d < C.SEPARA) this.recibir({
      tipo: 4,
      origen: j.pos
    });
  }
  darArma(item) {
    if (!this.conHenry()) return false;
    const a = ITEM_A_ARMA[item] ?? 0;
    this.w.armaPedida = this.w.arma === a ? 0 : a;
    this.w.ordenes[4] = 1;
    return true;
  }
  ordenIr(pos) {
    this.w.ordenIr = [ ...pos ];
    this.w.ordenes[2] = 1;
  }
  ordenGirar(pos) {
    this.w.ordenGirar = [ ...pos ];
    this.w.ordenes[3] = 1;
  }
  ordenHablar(mov = 0) {
    this.w.ordenes[0] = 1;
    this.w.movCharla = mov;
  }
  ordenCallar() {
    this.w.ordenes[0] = 2;
  }
  ordenLocura(tipo) {
    this.w.ordenes[1] = 1;
    this.w.locuraTipo = tipo;
  }
  ordenCalmar() {
    this.w.ordenes[1] = 2;
  }
  conHenry() {
    return this.etapa() !== 9 && !this.w.fueraEscena && this.w.dist < C.LEJOS;
  }
  salirEscena(j = this.m.jugador()) {
    const g = this.g, w = this.w, {etapa: etapa, escena: escena} = this.m.escena?.() || {};
    g.cambiosEscena++;
    if (g.dejadaConBichos) g.vecesDejadaConBichos += g.dejadaConBichos;
    g.cambiosConEileen++;
    let st = w.dist >= C.LEJOS || Math.abs(this.pos[1] - j.pos[1]) >= C.ALTO_SEPARA || w.fueraEscena ? 2 : 1;
    const c = this.caminos();
    w.estadoGlobal = 0;
    w.inicioGlobal = null;
    if (c?.red && c.escena === escena) {
      const v = c.cercanoDeEscena(c.aEtapa([ this.pos[0], this.pos[1] - 100, this.pos[2] ]), escena);
      if (v) {
        w.inicioGlobal = v.slice(0, 3);
        w.estadoGlobal = 1;
      }
    }
    if (etapa === 2) {
      if (escena === 13) st = 1;
      if (j.escenaReal === 24) st = 2;
      if (escena === 20 && c) {
        w.estadoCamino = 1;
        if (buscarCaminoEil(c, this.tc, w, this.pos, j.pos).r < 0) {
          st = 2;
          w.estadoGlobal = 0;
        }
      }
    } else if (etapa === 5 && escena === 12) st = this.movedor.bloqueado(this.pos, j.pos[0] - this.pos[0], j.pos[2] - this.pos[2], 0) ? 2 : 1; else if (etapa === 7 && escena === 33) st = 1;
    if (w.finEstado === 1) st = 2;
    if (w.finEstado === 2) st = 1;
    g.dejadaConBichos = st === 2 && w.finEstado !== 3 ? this.quedaConBichos() : 0;
    g.estado = st;
    if (w.fueraEscena && c && w.escenaEil != null) {
      g.escena = w.escenaEil;
      g.pos = c.aEscena(c.aEtapa(this.pos), w.escenaEil);
    } else {
      g.escena = escena;
      g.pos = [ ...this.pos ];
    }
    g.rot = this.rot;
    g.etapa = etapa;
    g.inicioGlobal = w.inicioGlobal;
    g.estadoGlobal = w.estadoGlobal;
    g.maldicion = w.maldicion;
    g.arma = w.arma;
    g.vida = w.vida;
    return st;
  }
  quedaConBichos() {
    const P = {
      BUZZ: .201,
      WALLMAN: .0501,
      WHEEL: .101,
      JINMEN: .501,
      TWINS: .501,
      MULTI: .501,
      NURSE: .501,
      HYENA: .334,
      KILLER: .801
    };
    let s = 0;
    for (const e of this.m.enemigos?.() || []) if (e?.cond < 10 && ![ "CELL", "MM", "HIL" ].includes(e.tipo)) s += P[e.tipo] || 0;
    return s === 0 ? 0 : s >= 1 ? 2 : 1;
  }
  estado() {
    const w = this.w;
    return {
      paso: NOMBRE_PASO[this.paso] || this.paso,
      sub: this.sub,
      anim: this.ac.n,
      cuadro: this.cuadro,
      vida: +w.vida.toFixed(1),
      nivelVida: this.nivelVida(),
      maldicion: +w.maldicion.toFixed(3),
      maldicionVista: +w.maldVista.toFixed(3),
      maldicionBase: +w.maldBase.toFixed(3),
      nivelMaldicion: this.nivelMald(),
      cojea: !!w.cojea,
      cansancio: w.cansancio,
      arma: NOMBRE_ARMA[w.arma] || "",
      dist: Math.round(w.dist),
      vel: +w.vel.toFixed(2),
      enemigo: w.enemigo?.id ?? null,
      conHenry: this.conHenry(),
      charla: this.eventos.actual,
      pos: this.pos.map(v => Math.round(v)),
      camino: {
        estado: w.estadoCamino,
        puntos: this.tc.n,
        i: this.tc.i,
        punto: w.puntoCamino?.slice(0, 3).map(v => Math.round(v)) ?? null,
        fueraEscena: w.fueraEscena,
        suEscena: w.escenaEil,
        global: w.estadoGlobal,
        globalPuntos: this.tg.n,
        globalI: this.tg.i,
        esquiva: w.esquiva
      },
      pies: [ "A", "B" ].map(k => {
        const p = this.pies.est[k];
        return {
          apoyado: p.apoyado,
          landing: p.landing,
          hosei: +p.hosei.toFixed(1),
          dy: +p.dy.toFixed(1),
          planta: +p.ratioPlanta.toFixed(2),
          punto: p.punto.map(v => Math.round(v))
        };
      }),
      textura: this.textura ? {
        po: +this.textura.po.toFixed(3),
        manchas: this.textura.manchas.filter(x => x.estado).length
      } : null,
      ojos: this.ojos ? {
        parpado: +this.ojos.est.peso.toFixed(2),
        hablando: this.ojos.est.hablando,
        extras: this.ojos.est.extras,
        clusters: this.ojos.clusters?.n ?? 0,
        ojoMaldito: this.ojos.ojo ? this.ojos.ojo.grupo : null
      } : null,
      brazo: {
        apunta: this.brazo.est.activo,
        peso: +this.brazo.est.peso.toFixed(2),
        meta: this.brazo.est.meta?.map(v => Math.round(v)) ?? null
      }
    };
  }
  ponerArmaModelo(a) {
    if (this.armaPuesta) {
      this.armaPuesta.contenedor.removeFromParent();
      this.armaPuesta = null;
    }
    const w = this.armas[a];
    const hueso = this.pj.huesos[HUESO_MANO];
    if (!w || !hueso) return;
    const c = w.contenedor;
    c.removeFromParent();
    c.rotation.set(0, 0, 0);
    c.scale.setScalar(1);
    c.position.set(0, 0, 0);
    hueso.add(c);
    this.armaPuesta = w;
  }
  ubicar(pos, rot = this.rot) {
    if (this.w.fueraEscena) {
      this.w.fueraEscena = 0;
      this.w.escenaEil = this.escenaN();
      this.w.puntoCamino = null;
    }
    this.pos = [ ...pos ];
    this.rot = rot;
    this.posAnt = [ ...pos ];
    this.rotAnt = rot;
    this.w.dirMov = this.dirCuerpo;
    const y = this.movedor.piso(this.pos, 120);
    if (y != null) this.pos[1] = y;
    this.ubicarModelo(1);
    this.pies.reiniciar();
  }
  ubicarModelo(alfa) {
    const p = this.posAnt.map((v, i) => v + (this.pos[i] - v) * alfa);
    const dr = envolver(this.rot - this.rotAnt);
    this.rotDibujo = this.rotAnt + dr * alfa;
    this.posDibujo = p;
    this.pj.ubicar(p[0], p[1], p[2], this.rotDibujo);
  }
  dibujar(alfa, dt) {
    if (this._fuera !== this.w.fueraEscena) {
      this._fuera = this.w.fueraEscena;
      this.pj.grupo.visible = !this._fuera;
    }
    this.ubicarModelo(alfa);
    const c = this.anim.capa;
    if (c && c.n === this.ac.n) {
      const d = Math.max(1, this.anims[c.n]?.duracion || 1);
      let t = this.ac.t + (this.ac.fin ? 0 : alfa * this.ac.vel);
      t = this.ac.loop ? (t % d + d) % d : Math.max(0, Math.min(d, t));
      c.t = t - dt * 30 * c.vel;
      if (!c.loop && c.t < 0) c.t = 0;
    }
    this.anim.actualizar(dt);
    let toco = this.piesPiso(dt);
    toco = this.girarCara(dt) || toco;
    toco = this.brazoArma(dt) || toco;
    if (this.ojos?.aplicar(this.anim.pose)) {
      componer(this.anim.esq, this.anim.pose, {
        rotAbsolutas: true
      });
      toco = true;
    }
    if (toco) this.pj.aplicar(this.anim.pose);
    this.textura?.dibujar();
  }
  piesPiso(dt) {
    const w = this.w;
    if (w.fueraEscena || !this.pj.grupo.visible) {
      return false;
    }
    const cad = this.anims[this.ac.n]?.ik;
    if (!cad?.length) return false;
    return this.pies.aplicar({
      esq: this.anim.esq,
      pose: this.anim.pose,
      cadenas: cad,
      animN: this.ac.n,
      cuadro: this.cuadro,
      vel: w.vel,
      pos: this.posDibujo || this.pos,
      rot: this.rotDibujo ?? this.rot,
      dirMov: w.dirMov,
      cuadros: dt * 30,
      fueraEscena: w.fueraEscena
    });
  }
  brazoArma(dt) {
    const w = this.w;
    if (w.fueraEscena || !this.pj.grupo.visible) return false;
    return this.brazo.aplicar({
      esq: this.anim.esq,
      pose: this.anim.pose,
      cadenas: this.anims[this.ac.n]?.ik,
      pos: this.posDibujo || this.pos,
      rot: this.rotDibujo ?? this.rot,
      cuadros: dt * 30
    });
  }
  girarCara(dt) {
    const w = this.w, c = this.cara;
    if (w.fueraEscena) {
      c.prendido = false;
      c.peso = 0;
      c.anterior = null;
      return false;
    }
    const j = w.objetivo === 1 ? this.m.jugador?.() : null;
    if (w.ordenMirar) {
      c.prendido = true;
      c.punto = [ ...w.ordenMirar ];
    } else if (j?.pos && j.existe !== false) {
      c.prendido = true;
      c.punto = [ j.pos[0], j.pos[1] - 330, j.pos[2] ];
    } else if (w.objetivo === 2 && w.enemigo) {
      c.prendido = true;
      c.punto = [ ...w.enemigoPos ];
    } else c.prendido = false;
    const r = this.rotDibujo ?? this.rot, cs = Math.cos(r), sn = Math.sin(r);
    const dx = c.punto[0] - this.pos[0], dz = c.punto[2] - this.pos[2];
    const local = {
      ...c,
      punto: [ dx * cs - dz * sn, c.punto[1] - this.pos[1], dx * sn + dz * cs ]
    };
    const ok = aplicarGiroCara(local, this.anim.esq, this.anim.pose, dt, componer);
    c.peso = local.peso;
    c.anterior = local.anterior;
    return ok;
  }
}

export const ENTRADA = {
  DIST: 160,
  GIRO: 2.356194,
  ATRAS: 20,
  FR_FIJO: [ -60, -646, -713 ]
};

export function lugarDeEntrada({pos: pos, rot: rot, piso: piso = () => null, etapa: etapa = 0, escena: escena = 0, escenaReal: escenaReal = null}) {
  const r = rot + ENTRADA.GIRO;
  let p = [ pos[0] + Math.sin(r) * ENTRADA.DIST, pos[1], pos[2] + Math.cos(r) * ENTRADA.DIST ];
  if (etapa === 3 && escenaReal === 23 && escena === 22) p = [ ...ENTRADA.FR_FIJO ];
  const hayPiso = q => piso(q, 100, 100) != null;
  if (!hayPiso(p)) p = [ pos[0] - Math.sin(rot) * ENTRADA.ATRAS, pos[1], pos[2] - Math.cos(rot) * ENTRADA.ATRAS ];
  if (etapa === 5 && escena === 12 && p[1] > 0) p[1] = 0;
  const y = piso([ p[0], p[1], p[2] ], 90, 300);
  if (y != null) p[1] = y;
  return {
    pos: p,
    rot: rot
  };
}

const BANDERA_ETAPA = {
  2: 2,
  3: 6,
  4: 8,
  5: 10,
  7: 0,
  8: 12,
  11: 4
};

function crearEventos(ei) {
  let actual = null, enfriar = 900, etapaAnt = -1, charla = null;
  const U = [];
  const agrupar = L => {
    const g = [];
    for (let i = 0; i < L.length; ) {
      const n = 1 + (L[i].siguen || 0);
      g.push(L.slice(i, i + n));
      i += n;
    }
    return g;
  };
  U.push({
    nombre: "apurada",
    reinicio: [ 900, 90 ],
    cumple: () => ei.estadoExportado() === 1 && ei.w.dist >= 1e3 && ei.w.dist <= 2e3,
    disparar: () => ({
      frases: [ FRASES.apurada[azar(8)] ],
      cortar: () => ei.w.golpe === 1 || ei.w.golpe === 3 ? 1 : 0
    })
  });
  U.push({
    nombre: "etapa",
    reinicio: [ 150, 45 ],
    cumple: () => !ei.w.enemigo && !ei.w.golpe && ei.estadoExportado() === 0 && ei.w.dist <= 600 && !ei.w.puertaTimer && ei.nivelMald() < 3,
    disparar: u => {
      const et = ei.etapa(), L = FRASES.etapa[et], base = BANDERA_ETAPA[et];
      if (enfriar > 0) {
        u.espera = 150;
        u.cuenta = 45;
        return null;
      }
      if (!L || base == null) return null;
      const B = ei.g.banderas, grupos = agrupar(L);
      const i = grupos.findIndex((_, n) => !(B[base + (n >> 2)] >> (n & 3) * 2 & 3));
      if (i < 0) return null;
      B[base + (i >> 2)] |= 1 << (i & 3) * 2;
      enfriar = 9e3;
      return {
        frases: grupos[i],
        hablar: true,
        girar: true,
        cortar: () => [ 1, 2, 3 ].includes(ei.w.golpe) ? 1 : ei.w.dist > 1200 ? 2 : 0
      };
    }
  });
  U.push({
    nombre: "rara",
    reinicio: [ 300, 30 ],
    cumple: () => ei.nivelMald() > 0 && ei.w.dist <= 3e3,
    disparar: u => {
      const v = ei.w.maldicion;
      if (v < azar01() * 10) {
        u.espera = v >= 1 ? 37 : 300;
        u.cuenta = 30;
        return null;
      }
      let i = Math.round(Math.max(0, Math.min(1, (v - .2) * 1.25)) * 12.5 - .49) - 2 + azar(4);
      i = Math.max(0, Math.min(12, i));
      const [mov, frase, mira, tipo] = LOCURAS[i];
      const frases = frase >= 0 ? agrupar(FRASES.rara)[frase] || null : null;
      let duracion = 0;
      if (tipo) duracion = frases ? 256 + azar(4) * (frase === 9 ? 64 : frase === 10 ? 128 : 0) : tipo === 2 ? 128 + azar(64) : 1;
      return {
        frases: frases,
        mirar: !!mira,
        locura: tipo,
        movimiento: tipo ? 0 : mov,
        hablar: !tipo,
        duracion: duracion,
        cortar: () => tipo === 0 && ei.w.golpe === 1 ? 1 : 0
      };
    }
  });
  for (const u of U) {
    u.espera = u.reinicio[0];
    u.cuenta = u.reinicio[1];
  }
  function revisar() {
    const et = ei.etapa();
    if (et !== etapaAnt) {
      etapaAnt = et;
      enfriar = 900;
    }
    if (enfriar > 0) enfriar--;
    if (ei.w.fueraEscena || ei.estadoExportado() === 10) return;
    if (actual) {
      const c = actual.cortar?.() || 0;
      if (c) terminar(c === 2);
      return;
    }
    let elegido = null;
    for (const u of U) {
      if (u.espera > 0) {
        u.espera--;
        continue;
      }
      if (!u.cumple()) u.cuenta = u.reinicio[1]; else u.cuenta--;
      if (u.cuenta < 0) elegido = u;
    }
    if (!elegido) return;
    elegido.espera = elegido.reinicio[0];
    elegido.cuenta = elegido.reinicio[1];
    const c = elegido.disparar(elegido);
    if (!c) return;
    actual = {
      ...c,
      unidad: elegido.nombre,
      t: 0
    };
    if (c.locura) ei.ordenLocura(c.locura - 1); else if (c.hablar) ei.ordenHablar(c.movimiento || 0);
    if (c.frases?.length) charla = {
      frases: c.frases,
      i: 0,
      t: 0,
      mando: null,
      empezo: false
    };
  }
  function hablar(j) {
    if (!actual) return;
    actual.t++;
    if ((actual.girar || actual.mirar) && j && Math.abs(ei.w.ang) > C.GIRA && ei.w.ordenes[3] !== 1) ei.ordenGirar(j.pos);
    if (actual.duracion && actual.t > actual.duracion) {
      ei.ordenCalmar();
      if (charla) {
        try {
          charla.mando?.parar?.(.1);
        } catch {}
        charla = null;
        ei.m.mostrarSub?.("", 0);
      }
    }
    if (!charla) {
      if (!actual.duracion || actual.t > actual.duracion) terminar(false);
      return;
    }
    const f = charla.frases[charla.i];
    if (charla.t === 0) {
      charla.mando = f.voz ? ei.son(f.voz, {
        volumen: 1,
        loop: false,
        radio: 4e3
      }) : null;
      charla.texto = null;
      const ya = ei.m.textos?.ya?.(f.paquete, f.mensaje);
      if (ya !== undefined) charla.texto = ya; else Promise.resolve(ei.m.textos?.texto(f.paquete, f.mensaje)).then(t => {
        if (charla?.frases[charla.i] === f) charla.texto = t;
      }).catch(() => {});
    }
    charla.t++;
    const alfa = Math.max(0, Math.min(1, (2e3 - ei.w.dist) / 1600));
    if (charla.texto != null) ei.m.mostrarSub?.(charla.texto, alfa);
    const m = charla.mando;
    if (m?.fuentes?.length) charla.empezo = true;
    const fin = f.cuadros ? charla.t >= f.cuadros : charla.empezo ? !m.fuentes.length : charla.t > 30 * (2 + (charla.texto?.length || 20) * .06);
    if (fin) {
      if (charla.i + 1 < charla.frases.length) {
        charla.i++;
        charla.t = 0;
        charla.empezo = false;
      } else {
        charla = null;
        ei.m.mostrarSub?.("", 0);
        if (!actual.duracion) terminar(false);
      }
    }
  }
  function terminar(conSonido) {
    if (charla?.mando) {
      try {
        charla.mando.parar?.(.1);
      } catch {}
    }
    charla = null;
    ei.m.mostrarSub?.("", 0);
    if (actual?.hablar) ei.ordenCallar();
    if (actual?.locura) ei.ordenCalmar();
    if (conSonido) ei.son(SON.CORTA_CHARLA[azar(3)]);
    actual = null;
  }
  return {
    revisar: revisar,
    hablar: hablar,
    terminar: terminar,
    get actual() {
      return actual?.unidad || null;
    },
    get frase() {
      return charla?.texto ?? null;
    },
    get hablando() {
      return !!charla;
    },
    unidades: U
  };
}

export function entrarEscena(g, {etapa: etapa, escena: escena, conectada: conectada = () => false}) {
  if (!g.estado) return false;
  if (g.dejadaConBichos === 1) g.vida = Math.min(C.VIDA_MAX, Math.max(.5, g.vida - 5)); else if (g.dejadaConBichos === 2) g.vida = Math.min(C.VIDA_MAX, Math.max(.5, g.vida - 10)); else g.vida = Math.min(C.VIDA_MAX, Math.max(.5, g.vida + 1));
  if (g.estado === 1) {
    g.etapa = etapa;
    g.escena = escena;
    return true;
  }
  if (g.etapa !== etapa) return false;
  if (etapa === 2 && g.escena === 14 && escena === 22) g.escena = 22;
  if (etapa === 5 && g.escena === 23 && escena === 28) {
    g.escena = 28;
    g.pos = [ -345, 0, -1533 ];
  }
  return g.escena === escena || !!conectada(g.escena);
}

export function guardadoParaPartida(g) {
  return JSON.parse(JSON.stringify(g));
}

export function crearManejoEileen({THREE: THREE, bajar: bajar, padre: padre, getColision: getColision, escala: escala = .005, enfermera: enfermera = false, ...resto}) {
  let datos = null, actual = null, acum = 0, cargando = null;
  const textos = resto.textos || crearTextos(bajar);
  const m = {
    THREE: THREE,
    getColision: getColision,
    escala: escala,
    textos: textos,
    ...resto
  };
  async function datosListos() {
    if (!datos) {
      cargando ||= cargarEileen({
        bajar: bajar,
        enfermera: enfermera
      });
      datos = await cargando;
    }
    return datos;
  }
  async function poner({pos: pos, rot: rot = 0, guardado: guardado = null} = {}) {
    const d = await datosListos();
    quitar();
    actual = new Eileen({
      ...d,
      m: m,
      pos: pos,
      rot: rot,
      guardado: guardado
    });
    padre.add(d.pj.grupo);
    d.pj.grupo.visible = true;
    return actual;
  }
  function quitar() {
    if (actual) {
      try {
        actual.eventos?.terminar(false);
      } catch {}
      actual.pj.grupo.removeFromParent();
      actual = null;
    }
  }
  function actualizar(dt) {
    if (!actual) return false;
    acum += Math.min(dt, .25);
    let n = 0;
    while (acum >= DT && n < 8) {
      actual.tick();
      acum -= DT;
      n++;
    }
    actual.dibujar(acum / DT, dt);
    return true;
  }
  function simular(seg) {
    if (!actual) return null;
    for (let i = 0; i < Math.round(seg * 30); i++) actual.tick();
    actual.dibujar(1, 0);
    return actual.estado();
  }
  return {
    poner: poner,
    quitar: quitar,
    actualizar: actualizar,
    simular: simular,
    datosListos: datosListos,
    m: m,
    get actual() {
      return actual;
    }
  };
}
