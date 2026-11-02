// SH4 web — FeniXVOID · Project Ravenlight
import { Nurse, P, C, A } from "./ia_nurse.js";

import { azar01 } from "./comun.js";

export { NOMBRE_PASO, NOMBRES_ANIM_NURSE as NOMBRES_ANIM_SCRATCH } from "./ia_nurse.js";

export const binScratch = () => "enemy_scratch.bin";

export const modeloScratch = () => "enemy_model_scr.bin";

const R90 = Math.PI / 2;

const SON_SCRATCH = {
  ATAQUE: 60560,
  ATRAS: 60561,
  ESPECIAL: 60562,
  MUERE: 60553,
  BALA: 60552,
  GOLPE: 60551,
  POZO: 60551,
  AGARRE: 61563,
  WARP: 60550,
  REMATE: 60553
};

export class Scratch extends Nurse {
  constructor(def, pj, anim, m) {
    super(def, pj, anim, m);
    this.tipo = "SCRATCH";
    this.SON = SON_SCRATCH;
    this.escala = 1;
    try {
      pj?.grupo?.scale?.setScalar?.(1);
    } catch {}
    this.param = m.parametros?.("SCRATCH", this.tipoParam) || this.param;
    this.hp = this.hpMax = this.param.vida;
    this.aguante = this.aguanteMax = this.param.aguante;
    this.radio = 60;
    this.radioGolpe = 160;
    this.alto = 240;
    this.centroAlto = 200;
    const ini = def.ini ?? def.estado_inicial ?? 0;
    if ((ini & 15) === 4) {
      this.cond = 13;
      this.paso = P.INWALL;
    } else if ((ini & 15) === 6) {
      this.paso = P.EVENT;
      this.cond = 18;
    }
  }
  get sinSangre() {
    return true;
  }
  maldice() {
    return this.cond !== 9 && this.cond !== 10 && this.cond !== C.DEAD && this.cond !== 18 && this.paso !== P.INWALL;
  }
  tick() {
    const v = this.m.vela?.(this) || 0;
    if (v > 0) {
      this.hp = Math.max(0, this.hp - v * 10);
      this.w.slowly = Math.min(1, this.w.slowly + 1 / 30);
    } else this.w.slowly = Math.max(0, this.w.slowly - 1 / 30);
    super.tick();
  }
  controlChase() {
    const w = this.w, j = this.jugador();
    if (this.sub === 0) {
      this.terminarAtaque();
      this.cond = C.CHASE;
      this.animSet(A.WLK);
      w.modo = 2;
      w.moveTimer = .5;
      this.sub = 1;
      this.quedarse();
      return;
    }
    const d = this.d3();
    const p = j.existe ? this.camino(j.pos) : null;
    if (p) {
      this.girarHacia(p, this.lento() * (1 / 30) * R90);
      if (d < 500 && this.progreso() > .8 && this.veJugadorDesdePies()) {
        const espalda = this.mismoFrente();
        this.pasoA(this.puedeAtacar() && espalda >= .7071068 ? P.SEIZE : P.PERFORM);
        return;
      }
      this.quedarse();
      return;
    }
    if (d < 1200) {
      this.pasoA(P.CAUTION);
      return;
    }
    this.quedarse();
  }
  controlWander() {
    if (this.sub === 1 && azar01() < .1 / 30 && this.jugador().existe) {
      this.pasoA(P.TOWARP);
      return;
    }
    super.controlWander();
  }
}
