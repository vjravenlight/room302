// SH4 web — FeniXVOID · Project Ravenlight
import * as THREE from "three";

import { q } from "./motor.js";

import { BOSQUE } from "./bosque.js";

import { conSegundaMitad, utilidades, engancharUsarItem } from "./mitad2_comun.js";

import { itemsDePrueba, ponerMitadEfectos, eileenDePrueba } from "./mitad2a_comun.js";

import { haciaEscalera } from "./escalera.js";

import { registrarLuzMovil } from "../lib/luz_movil.js";

const ITEM = {
  ANTORCHA: 52,
  MEDALLON: 85,
  CABEZA: 95,
  BRAZO_D: 96,
  BRAZO_I: 97,
  PIERNA_D: 98,
  PIERNA_I: 99,
  TEXTO_MUNECA: 180
};

const SON = {
  COLOCA: 50103,
  MEDALLON: 50101,
  ANTORCHA: 40088
};

const ANTORCHA = {
  seg: 30,
  segLargo: 180,
  bandera: 1635,
  segFinal: 10
};

const DESPUES_018 = {
  pos: [ 539, 0, 1251 ],
  rot: -3.1
};

const MUNECA = [ {
  m: 7,
  t: 15,
  b: 0
}, {
  m: 10,
  t: 18,
  b: 557
}, {
  m: 6,
  t: 14,
  b: 558
}, {
  m: 5,
  t: 13,
  b: 559
}, {
  m: 9,
  t: 17,
  b: 560
}, {
  m: 8,
  t: 16,
  b: 561
} ];

const SILLA = {
  quieta: [ 3378.414, -164.294, 1494.488 ],
  corrida: [ 3243.019, -84.835, 911.408 ]
};

const ESCALERA_FR23 = [ 3276.113, 176.314, 602.287 ];

export const BOSQUE_2 = conSegundaMitad(BOSQUE, (api, base) => crearBosque2(api, base), {
  banderasAtajo: [ 501, 328, 523, 1852 ],
  despues: {
    ...BOSQUE.despues,
    47: DESPUES_018
  }
});

function crearBosque2(api, base) {
  const {M: M, juego: juego, henry: henry, F: F, prender: prender} = api;
  const U = utilidades(api, {
    etapa: "fr",
    num: 3,
    datosJson: "./bosque_datos.json"
  });
  let escena = 0, vuelta = 0, extras = [], enganchado = false;
  const comun = n => juego.textoComun?.(n) || "";
  const ctl = henry.controlador;
  let antorcha = 0, fuego = null, luz = null;
  const conAntorcha = () => ctl.s.arma === ITEM.ANTORCHA;
  const encendida = () => antorcha > 0 && conAntorcha();
  api.enemigos.antorcha = encendida;
  function prenderAntorcha() {
    antorcha = F(ANTORCHA.bandera) ? ANTORCHA.segLargo : ANTORCHA.seg;
  }
  const _v = new THREE.Vector3;
  function puntaAntorcha() {
    const h = henry.personaje?.huesos?.[25];
    if (h) {
      h.updateWorldMatrix(true, false);
      _v.set(0, 0, 135).applyMatrix4(h.matrixWorld);
    } else _v.copy(henry.personaje.grupo.position);
    return [ -_v.x / .005, -_v.y / .005, _v.z / .005 ];
  }
  function cuadroAntorcha(dt) {
    if (antorcha <= 0 || !conAntorcha() || api.mitad !== 2) {
      apagarFuego();
      return;
    }
    antorcha = Math.max(0, antorcha - dt);
    const p = puntaAntorcha();
    const fx = api.amb?.fx;
    try {
      if (!fuego && fx?.fuegos) fuego = fx.fuegos.fuego(p, antorcha >= 10 ? 100 : 100 * antorcha * .1, 40, 1); else if (fuego) fx.fuegos.mover(fuego, p, dt);
    } catch {}
    if (!luz) luz = registrarLuzMovil({
      nombre: "antorcha",
      color: [ .89, .67, .542 ],
      inicio: 100,
      fin: 1e3,
      padre: M.escena
    }); else if (!luz.activa) luz.activar(true);
    luz.pos.copy(api.aMundo(p));
    const k = antorcha >= ANTORCHA.segFinal ? 1 : antorcha / ANTORCHA.segFinal;
    if (k !== luz._k) {
      luz._k = k;
      luz.alcance(100 * k, 1e3 * k);
    }
    if (antorcha <= 0) apagarFuego();
  }
  function apagarFuego() {
    try {
      if (fuego) api.amb?.fx?.fuegos?.apagar(fuego);
    } catch {}
    fuego = null;
    if (luz?.activa) luz.activar(false);
  }
  const piezaSala = k => api.cont.children.find(c => /^sala_/.test(c.name || ""))?.getObjectByName("mundo_" + k) || null;
  function quitarExtras() {
    for (const x of extras) {
      x.grupo.removeFromParent();
      x.dispose?.();
    }
    extras = [];
  }
  async function poner(arch, pm, pt, pos, rot = 0, pan = null, nombre = "") {
    const v0 = vuelta;
    const pj = await U.modelo(arch, pm, pt, pan);
    if (v0 !== vuelta) {
      pj.dispose?.();
      return pj;
    }
    pj.ubicar(pos[0], pos[1], pos[2], rot);
    pj.grupo.name = nombre || arch;
    api.cont.add(pj.grupo);
    extras.push(pj);
    return pj;
  }
  async function armarModelos(n, v) {
    try {
      if (n === 23) {
        if (!F(550)) await poner("whpk.bin", 0, 1, SILLA.quieta, 0, null, "silla de ruedas (fr23)"); else {
          const s = await poner("whpk.bin", 0, 1, SILLA.corrida, 0, null, "silla de ruedas corrida (fr23)");
          await animarCon(s, "fr23.bin", 12);
        }
        if (v !== vuelta) return;
        if (F(550)) {
          const e = await poner("prik.bin", 0, 1, ESCALERA_FR23, 0, null, "prik.bin (fr23 obj 11)");
          await animarCon(e, "fr23.bin", 11);
        }
        if (!F(550)) {
          const objs = api.objetosEscena(23).filter(o => o.cnst === "0x4dff30");
          for (const o of objs) {
            const fila = MUNECA[o.grupo_0x414 ?? 0];
            if (!fila || fila.b && !F(fila.b)) continue;
            if (v !== vuelta) return;
            const pj = await poner("fr23.bin", fila.m, fila.t, o.pos, 0, null, "muñeca " + (o.grupo_0x414 ?? 0));
            pj.grupo.userData.bandera = fila.b;
          }
        }
      }
      if (n === 16 && !F(532)) {
        const c = await poner("chik.bin", 0, 1, [ 700, 0, 1300 ], 0, null, "el chico (fr16)");
        await animarCon(c, "frchi.bin", 0);
      }
      if (n === 22) {
        const g = piezaSala(6);
        if (g) g.visible = F(540);
      }
    } catch (e) {
      console.warn("bosque 2: modelos", e.message);
    }
  }
  async function animarCon(pj, arch, pa) {
    try {
      const m = await U.bin(arch), A = m.p.find(x => x.indice === pa);
      if (A?.tipo !== "animacion") return;
      const {leerAnimacion: leerAnimacion} = await (import("../lib/animacion.js"));
      pj.poner(leerAnimacion(m.b, A.ofs, A.len));
      pj.reproductor.loop = true;
    } catch (e) {
      console.warn("animación", arch, pa, e.message);
    }
  }
  function prenderVelas(n) {
    const fx = api.amb?.fx;
    if (!fx) return;
    api.objetosEscena(n).filter(o => o.cnst === "0x4e0870" && o.pos).forEach((o, k) => {
      try {
        fx.disparar("vela", {
          n: 40 + k,
          pos: o.pos,
          alto: 200,
          ancho: 40
        });
      } catch (e) {
        console.warn("vela", e.message);
      }
    });
  }
  return {
    ...base,
    async alCargarEscena(n, llegada) {
      await (base.alCargarEscena?.(n, llegada));
      escena = n;
      const v = ++vuelta;
      quitarExtras();
      apagarFuego();
      ponerMitadEfectos(api);
      itemsDePrueba(api);
      prenderVelas(n);
      armarModelos(n, v);
      await eileenDePrueba(api, U);
      if (!enganchado) {
        enganchado = true;
        engancharUsarItem(api, {
          items: [ ITEM.CABEZA, ITEM.BRAZO_D, ITEM.BRAZO_I, ITEM.PIERNA_D, ITEM.PIERNA_I, ITEM.MEDALLON ],
          zonas: () => api.eventos.filter(o => o.ev?.evnum >= 3162 && o.ev?.evnum <= 3166 || o.ev?.evnum === 185),
          usar: o => api.ejecutar(o),
          activo: () => api.mitad === 2
        });
      }
    },
    cuadro(dt) {
      const r = base.cuadro?.(dt);
      cuadroAntorcha(dt);
      for (const x of extras) x.actualizar?.(dt);
      return r || antorcha > 0 || extras.length > 0;
    },
    maneja: ev => base.maneja?.(ev) || [ 180, 183, 2260, 2261, 2262, 3162, 3163, 3164, 3165, 3166, 185 ].includes(ev?.evnum) || /^0x4e0c00/.test(ev?.init || ""),
    async ejecutar(o) {
      const ev = o.ev || {};
      if (o.mitad2 || o.bosque) return base.ejecutar?.(o);
      if (/^0x4e0c00/.test(ev.init || "")) {
        if (!F(1852)) {
          try {
            api.amb?.puerta?.({
              door_no: 0
            }, 2);
          } catch {}
          U.sonar(SON.ANTORCHA);
          await U.guion(ev.guion);
          return null;
        }
        if (api.eileen?.actual && !U.eileenCerca()) {
          await api.decir([ comun(26) || "No puedo dejar sola a Eileen." ]);
          return null;
        }
        return haciaEscalera(api, "fr", 19);
      }
      if (ev.evnum === 2261) {
        if (!conAntorcha()) return null;
        const si = await U.guion(ev.guion);
        if (si) {
          prenderAntorcha();
          U.sonar(SON.ANTORCHA);
        }
        return null;
      }
      if (ev.evnum === 2262 || ev.evnum >= 3162 && ev.evnum <= 3166) {
        let puso = false;
        for (const x of api.eventos.filter(y => y.ev?.evnum >= 3162 && y.ev?.evnum <= 3166)) {
          const k = x.zona?.dmy13, b = 557 + (x.ev.evnum - 3162);
          if (!k || F(b) || !U.cuantos(k)) continue;
          await U.guion(x.ev.guion);
          henry.inventario?.quitar(k);
          U.sonar(SON.COLOCA);
          prender(b);
          puso = true;
        }
        if (puso) {
          quitarExtras();
          armarModelos(23, ++vuelta);
          return null;
        }
        if (!F(550)) {
          await U.guion([ {
            msg: 219,
            archivo: 2
          }, {
            msg: 220,
            archivo: 2,
            imagen: "0xdc"
          }, {
            msg: 221,
            archivo: 2
          }, {
            item: ITEM.TEXTO_MUNECA
          }, {
            llamada: "0x50ac00"
          } ]);
        }
        return null;
      }
      if (ev.evnum === 185) {
        if (!U.cuantos(ITEM.MEDALLON)) {
          const t = api.eventos.find(x => x.ev?.evnum === 183);
          if (t) await U.guion(t.ev.guion);
          return null;
        }
        await U.guion(ev.guion);
        U.sonar(SON.MEDALLON);
        henry.inventario?.quitar(ITEM.MEDALLON);
        prender(540);
        quitarExtras();
        armarModelos(22, ++vuelta);
        return null;
      }
      if (ev.evnum === 2260) {
        if (await U.guion(ev.guion, {
          alItem: k => api.darItem(k, o)
        })) U.terminar(ev);
        return null;
      }
      if (ev.evnum === 180) {
        if (await U.guion(ev.guion)) prender(527);
        return null;
      }
      if (ev.evnum === 183) {
        U.sonar(SON.ANTORCHA);
        await U.guion(ev.guion);
        return null;
      }
      if (ev.evnum === 2269 || ev.evnum === 47) {
        const r = await api.ejecutar({
          ...o,
          mitad2: true
        });
        await U.eileenConHenry();
        quitarExtras();
        armarModelos(escena, ++vuelta);
        return r;
      }
      if (ev.evnum === 3113) {
        const r = await haciaEscalera(api, "fr", 22);
        if (r) U.terminar(ev);
        return r;
      }
      if (/^0x4d1bf0/.test(ev.exec || "")) {
        const r = await (base.ejecutar?.(o));
        if (r && (r.volver302 || r.porAgujero)) api.dejarEileen?.();
        return r;
      }
      return base.ejecutar?.(o);
    },
    objetoVisible(o) {
      if (o.cnst === "0x4e0a40" && U.cuantos(132)) return false;
      if (o.cnst === "0x4dfc40") return false;
      return base.objetoVisible ? base.objetoVisible(o) : true;
    },
    alSalir() {
      apagarFuego();
      if (luz) {
        luz.quitar();
        luz = null;
      }
      quitarExtras();
      if (api.enemigos?.antorcha === encendida) api.enemigos.antorcha = null;
      base.alSalir?.();
    },
    prenderAntorcha: prenderAntorcha,
    estado() {
      const b = [ 328, 523, 527, 532, 533, 540, 549, 550, 557, 558, 559, 560, 561, 566, 1852 ].filter(n => F(n));
      return {
        ...base.estado?.() || {},
        mitad2: true,
        escena: escena,
        banderas2: b,
        antorcha: +antorcha.toFixed(1),
        encendida: encendida(),
        luzAntorcha: luz ? luz.estado() : null,
        munecas: [ ITEM.CABEZA, ITEM.BRAZO_D, ITEM.BRAZO_I, ITEM.PIERNA_D, ITEM.PIERNA_I ].map(k => U.cuantos(k)),
        extras: extras.map(x => x.grupo.name)
      };
    }
  };
}
