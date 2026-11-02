// SH4 web — FeniXVOID · Project Ravenlight
import { partesBin } from "../lib/sh4bin.js";

import { leerModelo } from "../lib/modelo.js";

import { leerTexturas } from "../lib/texturas.js";

import { leerAnimacion } from "../lib/animacion.js";

import { crearPersonaje } from "../lib/personaje.js";

import { MECANISMO } from "../enemigos/ia_kabe_jefe.js";

export function crearJefeSt07(api) {
  const {F: F, prender: prender} = api;
  let activo = false, cuerpos = null, armando = false, vuelta = 0;
  const jefes = () => (api.enemigos?.enemigos || []).filter(e => e.tipo === "WALLMAN_JEFE");
  async function armarCuerpos(v) {
    armando = true;
    try {
      const b = await api.bajar("data/enemy_kabe_boss.bin"), p = partesBin(b);
      if (v !== vuelta) return;
      const mo = p.find(x => x.tipo === "modelo"), tx = p.find(x => x.tipo === "texturas");
      const an = p.filter(x => x.tipo === "animacion")[MECANISMO.parteAnim()];
      const anim = an ? leerAnimacion(b, an.ofs, an.len) : null;
      const y0 = F(MECANISMO.bandera) ? MECANISMO.hasta : MECANISMO.desde;
      cuerpos = MECANISMO.pos.map(([x, z], i) => {
        const pj = crearPersonaje(leerModelo(b, mo.ofs, mo.len), tx ? leerTexturas(b, tx.ofs, tx.len) : []);
        pj.grupo.name = "st07 mecanismo " + i;
        pj.grupo.scale.setScalar(MECANISMO.escala);
        if (anim) {
          pj.poner(anim);
          pj.reproductor.loop = false;
          pj.reproductor.t = Math.max(0, anim.duracion - 1);
          pj.actualizar(0);
        }
        pj.ubicar(x, y0, z, MECANISMO.rot);
        api.cont.add(pj.grupo);
        return {
          pj: pj,
          x: x,
          z: z,
          y: y0
        };
      });
    } catch (e) {
      console.warn("st07: el mecanismo", e.message);
    } finally {
      armando = false;
    }
  }
  function quitar() {
    for (const c of cuerpos || []) {
      c.pj.grupo.removeFromParent();
      c.pj.dispose?.();
    }
    cuerpos = null;
  }
  return {
    entrar(n) {
      vuelta++;
      quitar();
      activo = n === 7;
      if (api.enemigos) api.enemigos.prenderBandera = b => prender(b);
    },
    cuadro(dt) {
      if (!activo) return;
      const lista = jefes();
      const comp = lista[0]?.comp;
      if (comp?.muerto && !F(1857)) prender(1857);
      if (!cuerpos && !armando && lista.some(e => e.mecanismo)) armarCuerpos(vuelta);
      if (!cuerpos) return;
      const v = MECANISMO.velocidad(api.enemigos?.nivel) * dt;
      for (const c of cuerpos) {
        if (c.y < MECANISMO.hasta) {
          c.y = Math.min(MECANISMO.hasta, c.y + v);
          if (c.y >= MECANISMO.hasta && !F(MECANISMO.bandera)) prender(MECANISMO.bandera);
          c.pj.ubicar(c.x, c.y, c.z, MECANISMO.rot);
        }
      }
    },
    salir() {
      activo = false;
      vuelta++;
      quitar();
    },
    estado() {
      const l = jefes(), comp = l[0]?.comp;
      return {
        jefes: l.length,
        vivos: l.filter(e => !e.borrado && e.cond !== 11).length,
        verdadero: comp?.verdadero ? comp.lista.indexOf(comp.verdadero) : null,
        vidaVerdadero: comp?.verdadero ? Math.round(comp.verdadero.hp) : null,
        pasos: l.map(e => e.paso).join(""),
        alturas: l.map(e => Math.round(e.pos[1])),
        reloj: comp ? +comp.timer.toFixed(2) : null,
        mecanismo: cuerpos ? cuerpos.map(c => Math.round(c.y)) : null,
        F1855: F(1855),
        F1857: F(1857),
        F1858: F(1858)
      };
    }
  };
}
