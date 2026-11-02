// SH4 web — FeniXVOID · Project Ravenlight
import { archivoImagen } from "./imagenes_memo.js";

import { imagenJuego } from "../suite_juego.js";

export async function imagenDelTexto(c) {
  const arch = archivoImagen(c?.imagen);
  if (!arch) return null;
  try {
    return await imagenJuego(arch, 0, [ 0, 0, 512, 448 ]);
  } catch {
    return null;
  }
}

const PREGUNTA = /[¿?？]/;

export function crearGuion({decir: decir, texto: texto, comun: comun, darItem: darItem, llamada: llamada = null, siNo: siNo = "marcado", imagenes: imagenes = true, alElegir: alElegir = null}) {
  return async function guion(cmds, {alItem: alItem = null} = {}) {
    if (!cmds) return true;
    let lista = [], imgs = [];
    alElegir?.(0);
    const soltar = async pregunta => {
      if (!lista.length) return true;
      const r = await decir(lista, {
        pregunta: pregunta,
        imagenes: imgs
      });
      lista = [];
      imgs = [];
      return pregunta ? r : true;
    };
    for (const c of cmds) {
      if (c.msg != null) {
        const t = c.archivo === 0 ? comun(c.msg) : texto(c.archivo, c.msg);
        if (!t || t === "@") continue;
        lista.push(t);
        imgs.push(imagenes ? await imagenDelTexto(c) : null);
        if (c.si_no && (siNo === "marcado" || PREGUNTA.test(t))) {
          const si = await soltar(true);
          alElegir?.(si ? 0 : 1);
          if (!si) return false;
        }
      } else if (c.item != null) {
        await soltar(false);
        if ((alItem || darItem)(c.item) === false) return false;
      } else if (c.llamada) {
        await soltar(false);
        llamada?.(c.llamada);
      }
    }
    await soltar(false);
    return true;
  };
}

export async function agujeroDeVuelta({api: api, etapa: etapa, num: num, agujeros: agujeros = [], escena: escena, pos: pos, rot: rot, antes: antes = null}) {
  const {juego: juego, decir: decir, prender: prender, PARTIDA: PARTIDA} = api;
  const apagar = n => {
    if (n) PARTIDA.banderas[n] = 0;
  };
  const si = await decir([ juego.textoComun?.(16) || "¿Entrar en el agujero?" ], {
    pregunta: true
  });
  if (!si) return null;
  const fila = agujeros.find(f => f.etapa === num && f.escena === escena);
  (PARTIDA.salidaMundo ||= {})[etapa] = fila ? {
    escena: fila.escena,
    pos: fila.pos,
    rot: fila.rot
  } : {
    escena: escena,
    pos: pos,
    rot: rot
  };
  antes?.();
  const dias = juego.dias302?.agujeroDelMundo?.({
    etapa: etapa,
    escena: escena
  });
  if (!dias) {
    for (const f of agujeros) {
      apagar(f.bandera);
      apagar(f.bandera2);
    }
    if (fila) {
      prender(fila.bandera);
      prender(fila.bandera2);
    }
  }
  return {
    ...dias || {
      volver302: true,
      escena302: 2
    },
    porAgujero: true
  };
}
