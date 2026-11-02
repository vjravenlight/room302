// SH4 web — FeniXVOID · Project Ravenlight
import { q } from "./motor.js";

import { SUBTE } from "./subte.js";

import { conSegundaMitad, utilidades, engancharUsarItem } from "./mitad2_comun.js";

import { itemsDePrueba, copiarRecogidos, ponerMitadEfectos, eileenDePrueba } from "./mitad2a_comun.js";

const ITEM = {
  LLAVE_JUGUETE: 90,
  MONEDA_SUCIA: 91,
  MONEDA: 92,
  LLAVE_SB24: 93,
  MANIJA: 94
};

const SON = {
  CAJA: 50307,
  MAQUINA: 50309,
  MANIJA: 50306,
  TREN: 50305
};

const DESPUES_172 = {
  pos: [ 472, 0, 513 ],
  rot: -.8
};

const TREN_3149 = {
  henry: [ 13500, -10, -920 ],
  eileen: [ 12900, -7, -920 ]
};

export const SUBTE_2 = conSegundaMitad(SUBTE, (api, base) => crearSubte2(api, base), {
  banderasAtajo: [ 301, 302, 1526, 316 ],
  despues: {
    ...SUBTE.despues,
    172: DESPUES_172
  }
});

function crearSubte2(api, base) {
  const {M: M, juego: juego, henry: henry, F: F, prender: prender} = api;
  const U = utilidades(api, {
    etapa: "sb",
    num: 2,
    datosJson: "./hospital_datos.json"
  });
  let escena = 0, enganchado = false;
  const comun = n => juego.textoComun?.(n) || "";
  const textoDelLugar = o => api.eventos.find(x => x !== o && x.pos && o.pos && Math.hypot(x.pos[0] - o.pos[0], x.pos[2] - o.pos[2]) < 40 && !x.zona?.dmy13 && (x.ev?.guion || x.ev?.init));
  async function sinItem(o) {
    const t = textoDelLugar(o);
    if (t) await api.ejecutar(t);
  }
  return {
    ...base,
    async alCargarEscena(n, llegada) {
      await (base.alCargarEscena?.(n, llegada));
      escena = n;
      ponerMitadEfectos(api);
      itemsDePrueba(api);
      await eileenDePrueba(api, U);
      if (!enganchado) {
        enganchado = true;
        engancharUsarItem(api, {
          items: [ ITEM.LLAVE_JUGUETE, ITEM.MONEDA, ITEM.MANIJA ],
          zonas: () => api.eventos.filter(o => [ 2220, 2221, 2224 ].includes(o.ev?.evnum)),
          usar: o => api.ejecutar(o),
          activo: () => api.mitad === 2
        });
      }
    },
    maneja: ev => base.maneja?.(ev) || [ 2220, 2221, 2224, 3149 ].includes(ev?.evnum),
    async ejecutar(o) {
      const ev = o.ev || {};
      if (o.mitad2) return undefined;
      if (ev.evnum === 2220) {
        if (!U.cuantos(ITEM.LLAVE_JUGUETE)) {
          await sinItem(o);
          return null;
        }
        await M.fundir(1, .15);
        U.sonar(SON.CAJA);
        henry.inventario?.quitar(ITEM.LLAVE_JUGUETE);
        await M.esperar(1);
        await U.guion(ev.guion);
        await M.fundir(0, .15);
        await U.guion(ev.guion2);
        prender(332);
        return null;
      }
      if (ev.evnum === 2221) {
        if (!U.cuantos(ITEM.MONEDA)) {
          await sinItem(o);
          return null;
        }
        await M.fundir(1, .15);
        U.sonar(SON.MAQUINA);
        henry.inventario?.quitar(ITEM.MONEDA);
        await M.fundir(0, .15);
        await U.guion(ev.guion);
        prender(333);
        return null;
      }
      if (ev.evnum === 2224) {
        if (!U.cuantos(ITEM.MANIJA)) {
          await sinItem(o);
          return null;
        }
        prender(336);
        U.sonar(SON.MANIJA);
        const pos = U.posHenry(), rot = U.rotHenry();
        copiarRecogidos(api, "sb", 14, 22);
        await M.fundir(1, .35);
        await api.irA(22, {
          pos: pos,
          rot: rot
        });
        await M.fundir(0, .35);
        return null;
      }
      if (ev.evnum === 3149) {
        U.sonar(SON.TREN);
        await M.fundir(1, .05);
        api.ubicarHenry(TREN_3149.henry, null);
        if (api.eileen?.actual) {
          try {
            api.eileen.actual.ubicar(TREN_3149.eileen, U.rotHenry());
          } catch {}
          api.eileenConmigo?.();
        }
        await M.fundir(0, .5);
        await U.guion(ev.guion);
        henry.inventario?.quitar(ITEM.MANIJA);
        prender(337);
        return null;
      }
      if (ev.evnum === 172) {
        const r = await (base.ejecutar?.(o));
        if (r !== undefined) return r;
        const rr = await api.ejecutar({
          ...o,
          mitad2: true
        });
        await U.eileenConHenry();
        return rr;
      }
      if ((ev.exec || "").startsWith("0x4d1bf0") || ev.evnum === 76) {
        const r = await (base.ejecutar?.(o));
        if (r && (r.volver302 || r.porAgujero)) api.dejarEileen?.();
        return r;
      }
      return base.ejecutar?.(o);
    },
    async antesDePuerta(p) {
      if ((p.funcion_paso || "").startsWith("0x4fd030")) {
        if (!api.eileen?.actual && !api.PARTIDA.eileen?.estado || U.eileenCerca()) return true;
        await api.decir([ api.texto(5, 43) || comun(26) ]);
        return false;
      }
      const pasa = base.antesDePuerta ? await base.antesDePuerta(p) : true;
      const baja = {
        10: {
          p: 31,
          evnum: 46,
          demo: 8,
          cond: "!F322 AND !F323"
        },
        11: {
          p: 33,
          evnum: 3081,
          demo: 5,
          cond: "!F323 AND !F322"
        }
      }[escena];
      if (pasa && baja && p.door_no === baja.p && !F(322) && !F(323) && api.eileen?.actual && U.eileenCerca()) {
        await api.ejecutar({
          i: -1,
          mitad2: true,
          ev: {
            evnum: baja.evnum,
            demo: baja.demo,
            cond: baja.cond
          }
        });
      }
      return pasa;
    },
    estado() {
      const b = [ 316, 318, 325, 332, 333, 335, 336, 337, 343 ].filter(n => F(n));
      return {
        ...base.estado?.() || {},
        mitad2: true,
        escena: escena,
        banderas2: b,
        items2: Object.fromEntries(Object.entries(ITEM).map(([k, v]) => [ k, U.cuantos(v) ])),
        eileen: !!api.eileen?.actual
      };
    }
  };
}
