// SH4 web — FeniXVOID · Project Ravenlight
import { DT, distXZ } from "./comun.js";

import { Scratch } from "./ia_scratch.js";

import { P, A, C } from "./ia_nurse.js";

import { partesBin } from "../lib/sh4bin.js";

import { leerAnimacion } from "../lib/animacion.js";

const EVENTO = {
  pos: [ -1042.2, 1600, 725 ],
  radio: 1e3,
  espera: 10,
  quieto: 13
};

export const esScratchEvento = def => def?.enemigo === "SCRATCH" && ((def.estado_inicial ?? def.ini ?? 0) & 15) === 6;

let anims = null;

function cargar() {
  anims ||= fetch("/juego/data/enemy_scratch_event_bd03.bin").then(r => {
    if (!r.ok) throw new Error("enemy_scratch_event_bd03.bin");
    return r.arrayBuffer();
  }).then(b => partesBin(b).filter(x => x.tipo === "animacion").map(x => leerAnimacion(b, x.ofs, x.len))).catch(e => {
    console.warn("scratch de bd03", e.message);
    anims = null;
    return null;
  });
  return anims;
}

export class ScratchEvento extends Scratch {
  constructor(def, pj, anim, m) {
    super(def, pj, anim, m);
    this.paso = P.EVENT;
    this.sub = 0;
    this.cond = C.EVENT;
    this.visible = false;
    cargar().then(l => {
      if (l) this.animsEvento = l;
    });
  }
  ponerAnim(l, reiniciar) {
    if ((l === A.ST1 || l === A.ST2) && this.animsEvento) {
      if (this.anim.anims._evento == null) {
        const base = this.anim.anims.length;
        this.anim.anims = [ ...this.anim.anims, ...this.animsEvento ];
        this.anim.anims._evento = base;
      }
      const n = this.anim.anims._evento + (l === A.ST1 ? 0 : 1);
      if (reiniciar || this.animL !== l) this.anim.poner(n);
      this.animL = l;
      return;
    }
    super.ponerAnim(l, reiniciar);
  }
  controlEvent() {
    const w = this.w, r = this.pj?.reproductor;
    switch (this.sub) {
     case 0:
      if (!this.animsEvento) {
        this.visible = false;
        return;
      }
      this.visible = true;
      this.cond = C.EVENT;
      w.modoFantasma = 9;
      if (r) r.enElLugar = false;
      this.ponerAnim(A.ST2, true);
      w.timer = EVENTO.espera;
      this.sub = 1;
      return;

     case 1:
      {
        w.timer -= DT;
        const j = this.jugador();
        const lejos = !j.existe || distXZ(j.pos, EVENTO.pos) >= EVENTO.radio || Math.abs(j.pos[1] - EVENTO.pos[1]) > 600;
        if (w.timer > 0 && lejos) {
          if (this.anim.cuadro > EVENTO.quieto) this.anim.t = 0;
          return;
        }
        w.modoFantasma = 10;
        this.sub = 2;
        return;
      }

     case 2:
      if (!this.terminada()) return;
      this.pos = [ ...EVENTO.pos ];
      this.posAnt = [ ...this.pos ];
      if (r) r.enElLugar = true;
      this.ponerAnim(A.NT, true);
      this.cond = C.NORMAL;
      w.modoFantasma = 11;
      this.pasoA(P.PERFORM);
    }
  }
}
