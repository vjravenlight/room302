// SH4 web — FeniXVOID · Project Ravenlight
import { q } from "./motor.js";

import { EDIFICIO } from "./edificio.js";

import { crearVelasDemo } from "../efectos/objetos_demo.js";

import { conSegundaMitad, utilidades, engancharUsarItem } from "./mitad2_comun.js";

import { eileenDePrueba } from "./mitad2a_comun.js";

const ITEM = {
  BOLA: 102,
  GATO: 103,
  PELOTA: 104,
  VELAS: 105
};

const LUGARES = [ {
  ev: 2241,
  item: ITEM.VELAS,
  bandera: 943,
  cnst: "0x4dbf70",
  m: 8,
  t: 9
}, {
  ev: 2242,
  item: ITEM.PELOTA,
  bandera: 944,
  cnst: "0x4dbfd0",
  m: 4,
  t: 5
}, {
  ev: 2243,
  item: ITEM.GATO,
  bandera: 945,
  cnst: "0x4dc030",
  m: 2,
  t: 3
}, {
  ev: 2244,
  item: ITEM.BOLA,
  bandera: 946,
  cnst: "0x4dc090",
  m: 0,
  t: 1
} ];

const SON = {
  SUENA: 51211,
  VOZ: 20215
};

const ESCALERAS_BD11 = [ [ 11, 22, 12, 22, 255, 255 ], [ 11, 26, 12, 26, 255, 255 ], [ 12, 22, 255, 255, 11, 22 ], [ 12, 26, 255, 255, 11, 26 ], [ 11, 27, 4, 27, 255, 255 ], [ 4, 27, 255, 255, 11, 27 ] ];

const PUNTO_SUENA = [ [ -1500, 1600, 0 ], [ -1500, 0, 0 ] ];

const RELOJ = {
  SALA: 24,
  POS: [ 889.934, -381.091, -1155.117 ],
  CERCA: [ 51206, 53207 ],
  TIC: 53207,
  RADIO: 4e3,
  VOL_TIC: .45
};

export const EDIFICIO_2 = conSegundaMitad(EDIFICIO, (api, base) => crearEdificio2(api, base), {
  banderasAtajo: [ 901, 721, 957 ]
});

function crearEdificio2(api, base) {
  const {THREE: THREE, M: M, juego: juego, henry: henry, F: F, prender: prender} = api;
  const U = utilidades(api, {
    etapa: "bd",
    num: 5,
    datosJson: "./edificio_datos.json"
  });
  let escena = 0, activo = false, vuelta = 0, colocados = [], velas = null, suena = null, enganchado = false, reloj = [];
  function alEntrarEscena(n) {
    (window.sh4 ||= {}).controlesInvertidos = n === RELOJ.SALA && api.mitad === 2 && !F(947);
    if (!F(947)) return;
    if (n === RELOJ.SALA) reloj = RELOJ.CERCA.map(id => U.sonar(id, RELOJ.POS, {
      loop: true,
      volumen: 1,
      radio: RELOJ.RADIO
    })); else if (!F(2129)) reloj = [ U.sonar(RELOJ.TIC, null, {
      loop: true,
      volumen: RELOJ.VOL_TIC
    }) ];
  }
  async function armarColocados(n, v) {
    for (const L of LUGARES) {
      for (const o of api.objetosEscena(n).filter(x => x.cnst === L.cnst && x.pos)) {
        try {
          const pj = await U.modelo("event_bd_l.bin", L.m, L.t);
          if (v !== vuelta) {
            pj.dispose?.();
            return;
          }
          pj.ubicar(o.pos[0], o.pos[1], o.pos[2], 0);
          pj.grupo.name = `recuerdo ${L.item} (bd${n})`;
          pj.grupo.visible = F(L.bandera);
          api.cont.add(pj.grupo);
          colocados.push({
            L: L,
            pj: pj
          });
        } catch (e) {
          console.warn("recuerdo", L.item, e.message);
        }
      }
    }
  }
  async function encenderVelas(n) {
    if (velas || n !== 7) return;
    const pos = api.objetosEscena(7).filter(o => o.cnst === "0x545990" && o.pos && o.dmy8 === 943).map(o => o.pos);
    if (!pos.length) return;
    try {
      velas = await crearVelasDemo({
        THREE: THREE,
        bajar: api.bajar,
        escala: U.E,
        posiciones: pos,
        semilla: 7
      });
      if (escena === 7 && activo) api.cont.add(velas.grupo); else {
        velas.dispose?.();
        velas = null;
      }
    } catch (e) {
      console.warn("velas del pastel", e.message);
    }
  }
  function quitar() {
    for (const c of colocados) {
      c.pj.grupo.removeFromParent();
      c.pj.dispose?.();
    }
    colocados = [];
    if (velas) {
      velas.grupo?.removeFromParent();
      velas.dispose?.();
      velas = null;
    }
    U.parar(suena);
    suena = null;
    for (const h of reloj) U.parar(h);
    reloj = [];
    if (window.sh4) window.sh4.controlesInvertidos = false;
  }
  const lugarDe = ev => LUGARES.find(L => L.ev === ev?.evnum) || null;
  async function poner(o) {
    const L = lugarDe(o.ev);
    if (!L || F(L.bandera)) return null;
    if (!U.cuantos(L.item)) return null;
    await U.guion(o.ev.guion);
    henry.inventario?.quitar(L.item);
    U.terminar(o.ev);
    for (const c of colocados) if (c.L === L) c.pj.grupo.visible = true;
    if (L.bandera === 943) encenderVelas(escena);
    if (!F(947) && LUGARES.every(x => F(x.bandera))) U.terminar(2245);
    return null;
  }
  const zonasUsar = () => api.eventos.filter(o => lugarDe(o.ev) && o.zona?.dmy13);
  async function puertaDelPanel(p) {
    const tenia = F(934);
    if (tenia) api.PARTIDA.banderas[934] = 0;
    try {
      return await base.antesDePuerta(p);
    } finally {
      if (tenia) prender(934);
    }
  }
  return {
    ...base,
    inicio: () => base.inicio?.(),
    async alCargarEscena(n, llegada) {
      await (base.alCargarEscena?.(n, llegada));
      await U.datos();
      quitar();
      const v = ++vuelta;
      escena = n;
      activo = true;
      alEntrarEscena(n);
      if (!enganchado) {
        enganchado = true;
        engancharUsarItem(api, {
          items: LUGARES.map(L => L.item),
          zonas: zonasUsar,
          usar: poner,
          activo: () => activo && api.mitad === 2
        });
      }
      armarColocados(n, v);
      await eileenDePrueba(api, U);
    },
    cuadro(dt) {
      const r = base.cuadro?.(dt);
      if (suena && F(954)) {
        U.parar(suena, .5);
        suena = null;
      }
      return r;
    },
    maneja(ev) {
      if (!ev) return false;
      return base.maneja?.(ev) || [ 2703, 2249, 3152, 3153, 3154 ].includes(ev.evnum) || !!lugarDe(ev);
    },
    alDemo(si) {
      base.alDemo?.(si);
    },
    alSalir() {
      activo = false;
      vuelta++;
      quitar();
      base.alSalir?.();
    },
    async ejecutar(o) {
      if (o.mitad2) return undefined;
      const ev = o.ev || {}, exe = (ev.exec || "").slice(0, 8);
      if (ev.evnum === 2703) {
        if (!q.has("sinvideos")) {
          await M.fundir(1, .4);
          await (juego.reproducirVideo?.(13, {}));
          M.pantalla.ocultar();
          await M.fundir(0, .4);
        }
        U.terminar(2703);
        await U.eileenConHenry();
        return null;
      }
      if (lugarDe(ev)) return poner(o);
      if (ev.evnum === 2249 || ev.evnum === 3152) {
        if (F(954) || suena) return null;
        if (ev.evnum === 2249) suena = U.sonar(SON.SUENA, PUNTO_SUENA[o.grupo ?? api.objetosEscena(escena).find(x => x.indice === o.i)?.grupo_0x414 ?? 0] || PUNTO_SUENA[0], {
          loop: true,
          volumen: .3,
          radio: 4e3
        }); else suena = U.sonar(SON.SUENA, null, {
          loop: true,
          volumen: 1
        });
        return null;
      }
      if (ev.evnum === 3154) {
        await U.guion(ev.guion);
        U.terminar(3154);
        return null;
      }
      if (ev.evnum === 3153) {
        U.sonar(SON.VOZ, null, {
          volumen: .3
        });
        U.terminar(3153);
        return null;
      }
      if (exe === "0x4d1bf0") return U.agujero(escena);
      return base.ejecutar ? base.ejecutar(o) : undefined;
    },
    async antesDePuerta(p) {
      if (p.door_no === 32 && F(1130) && !F(950)) return puertaDelPanel(p);
      const esc = ESCALERAS_BD11.find(f => f[0] === escena && f[1] === p.door_no);
      if (esc) {
        if (F(925) || base.ascensor?.moviendo?.()) return false;
        const sube = esc[2] !== 255;
        return !!await api.decir([ U.comun(sube ? 27 : 28) || (sube ? "Es una escalera. ¿Debería subir?" : "Es una escalera. ¿Debería bajar?") ], {
          pregunta: true
        });
      }
      return base.antesDePuerta ? base.antesDePuerta(p) : true;
    },
    estado() {
      const b = [ 721, 901, 938, 939, 940, 941, 942, 943, 944, 945, 946, 947, 948, 949, 950, 951, 952, 953, 954, 957, 958 ].filter(n => F(n));
      const ei = api.eileen?.actual;
      return {
        ...base.estado?.() || {},
        mitad: 2,
        banderas2: b,
        recuerdos: {
          bola: U.cuantos(ITEM.BOLA),
          gato: U.cuantos(ITEM.GATO),
          pelota: U.cuantos(ITEM.PELOTA),
          velas: U.cuantos(ITEM.VELAS)
        },
        colocados: colocados.filter(c => c.pj.grupo.visible).map(c => c.L.item),
        suena: !!suena,
        reloj: reloj.filter(Boolean).length,
        controlesInvertidos: !!window.sh4?.controlesInvertidos,
        scratch: (api.enemigos?.enemigos || []).filter(e => e.tipo === "SCRATCH").map(e => ({
          paso: e.paso,
          sub: e.sub,
          pos: e.pos.map(Math.round)
        })),
        eileen: ei ? {
          conHenry: U.eileenCerca(),
          pos: ei.pos.map(Math.round)
        } : null
      };
    },
    poner: poner
  };
}
