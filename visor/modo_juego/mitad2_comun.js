// SH4 web — FeniXVOID · Project Ravenlight
import { json } from "./motor.js";

import { partesBin } from "../lib/sh4bin.js";

import { leerModelo } from "../lib/modelo.js";

import { leerTexturas } from "../lib/texturas.js";

import { leerAnimacion } from "../lib/animacion.js";

import { crearPersonaje } from "../lib/personaje.js";

import { crearGuion, agujeroDeVuelta } from "./guion_comun.js";

export function conSegundaMitad(base, crear2, segunda = {}) {
  let apiVista = null;
  const enLa2 = () => apiVista?.mitad === 2;
  const cfg = {
    ...base,
    crear(api) {
      apiVista = api;
      const m1 = base.crear(api);
      let m2 = null;
      const actual = () => api.mitad === 2 ? m2 ||= crear2(api, m1) : m1;
      return new Proxy({}, {
        get: (_, k) => {
          const m = actual();
          const v = m?.[k];
          return typeof v === "function" ? v.bind(m) : v;
        },
        has: (_, k) => k in (actual() || {})
      });
    }
  };
  for (const k of Object.keys(segunda)) Object.defineProperty(cfg, k, {
    get: () => enLa2() ? segunda[k] : base[k],
    enumerable: true
  });
  return cfg;
}

export function utilidades(api, {etapa: etapa, num: num, datosJson: datosJson, ITEM_SON: ITEM_SON = 40006}) {
  const {THREE: THREE, M: M, juego: juego, henry: henry, F: F, prender: prender, decir: decir} = api;
  const E = .005;
  let D = null;
  const datos = async () => D && !D._vacio ? D : D = await json(datosJson) || D || {
    _vacio: true,
    fin: {},
    guiones: {},
    agujeros: [],
    cerraduras: [],
    zonas: {}
  };
  datos();
  const aMundo = p => new THREE.Vector3(-p[0] * E, -p[1] * E, p[2] * E);
  const apagar = n => {
    if (n) api.PARTIDA.banderas[n] = 0;
  };
  const posHenry = () => api.aJuego(api.pies());
  const rotHenry = () => henry.controlador.m.cuerpo;
  const cuantos = k => henry.inventario?.cuantos(k) || 0;
  const son = () => api.amb?.son || null;
  function sonar(id, posJuego = null, op = {}) {
    try {
      return son()?.efecto?.(id, posJuego ? aMundo(posJuego) : null, op) || null;
    } catch {
      return null;
    }
  }
  const parar = (h, t = .3) => {
    try {
      h?.parar?.(t);
    } catch {}
  };
  const comun = n => juego.textoComun?.(n) || "";
  let guionComun = null;
  function guion(cmds, o) {
    guionComun ||= crearGuion({
      decir: decir,
      texto: (a, n) => api.texto(a, n),
      comun: comun,
      darItem: k => henry.agregarItem(k, 1),
      siNo: "conSigno",
      llamada: f => {
        const d = String(f).slice(0, 8);
        if (d === "0x50abe0" || d === "0x50ac00") sonar(ITEM_SON);
      }
    });
    return guionComun(cmds, o);
  }
  const finDe = ev => D?.fin?.["etapa" + num]?.[String(ev?.evnum ?? ev)] || D?.fin?.comun?.[String(ev?.evnum ?? ev)] || null;
  const banderaDe = ev => {
    const m = /^!F(\d+)/.exec(ev?.cond || "");
    return m ? +m[1] : 0;
  };
  function terminar(ev) {
    const l = finDe(ev);
    if (l) {
      for (const b of l) b > 0 ? prender(b) : apagar(-b);
      return;
    }
    prender(banderaDe(ev));
  }
  const cumple = c => !c || c === "siempre" || c.split(/\s+AND\s+/).every(x => x === "siempre" ? true : x[0] === "!" ? !F(+x.slice(2)) : F(+x.slice(1)));
  const demo = n => api.ejecutar({
    i: -1,
    mitad2: true,
    ev: {
      evnum: 0,
      demo: n,
      cond: "siempre"
    }
  });
  const bins = new Map;
  const bin = a => {
    if (!bins.has(a)) bins.set(a, api.bajar("data/" + a).then(b => ({
      b: b,
      p: partesBin(b)
    })));
    return bins.get(a);
  };
  async function modelo(arch, pm, pt, pan = null) {
    const m = await bin(arch), Mp = m.p.find(x => x.indice === pm), T = m.p.find(x => x.indice === pt);
    const pj = crearPersonaje(leerModelo(m.b, Mp.ofs, Mp.len), T?.tipo === "texturas" ? leerTexturas(m.b, T.ofs, T.len) : []);
    if (pan != null) {
      const A = m.p.find(x => x.indice === pan);
      if (A?.tipo === "animacion") {
        pj.poner(leerAnimacion(m.b, A.ofs, A.len));
        pj.reproductor.loop = true;
      }
    }
    return pj;
  }
  const eileenCerca = () => !!api.eileenConHenry?.();
  async function eileenConHenry() {
    const a = api.eileen?.actual;
    if (a) {
      api.eileenConmigo?.();
      const p = posHenry(), r = rotHenry();
      try {
        a.ubicar?.([ p[0] - Math.sin(r) * 120, p[1], p[2] - Math.cos(r) * 120 ], r);
      } catch {}
      return;
    }
    if (api.PARTIDA.eileen?.estado) {
      const p = posHenry(), r = rotHenry();
      await (api.ponerEileen?.({
        pos: [ p[0] - Math.sin(r) * 120, p[1], p[2] - Math.cos(r) * 120 ],
        rot: r
      }));
    }
  }
  function agujero(escena) {
    return agujeroDeVuelta({
      api: api,
      etapa: etapa,
      num: num,
      agujeros: D?.agujeros || [],
      escena: escena,
      pos: posHenry(),
      rot: rotHenry(),
      antes: () => api.dejarEileen?.()
    });
  }
  const soltados = [];
  let MI = null;
  async function soltarItem(item, pos, escena) {
    if (!item || !pos) return;
    const o = {
      i: 2e3 + Date.now() % 1e6,
      item: item,
      pos: [ pos[0], pos[1], pos[2] ],
      zona: {
        dmy1: 1,
        radio: 150,
        dmy6: 5
      },
      ev: null
    };
    api.eventos.push(o);
    try {
      MI ||= new Map(((await json("/datos/juego.json"))?.modelos_items?.filas || []).map(f => [ f.id, f ]));
      const f = MI.get(item);
      if (f?.modelo) {
        const m = await bin(f.modelo.archivo), Mp = m.p[f.modelo.parte], tb = f.texturas ? await bin(f.texturas.archivo) : m, T = f.texturas ? tb.p[f.texturas.parte] : null;
        const pj = crearPersonaje(leerModelo(m.b, Mp.ofs, Mp.len), T?.tipo === "texturas" ? leerTexturas(tb.b, T.ofs, T.len) : []);
        pj.ubicar(o.pos[0], o.pos[1], o.pos[2], 0);
        pj.grupo.name = `ítem ${item} (soltado)`;
        api.cont.add(pj.grupo);
        soltados.push({
          o: o,
          pj: pj,
          escena: escena
        });
      }
    } catch (err) {
      console.warn("ítem soltado", err.message);
    }
  }
  function revisarSoltados(escena) {
    for (const s of soltados.splice(0)) {
      const tomado = (api.PARTIDA.recogidos || []).includes(`${etapa}/${s.escena}/${api.mitad}/${s.o.i}`);
      if (tomado || s.escena !== escena) {
        s.pj.grupo.removeFromParent();
        s.pj.dispose?.();
      } else soltados.push(s);
    }
  }
  return {
    E: E,
    aMundo: aMundo,
    apagar: apagar,
    posHenry: posHenry,
    rotHenry: rotHenry,
    cuantos: cuantos,
    sonar: sonar,
    parar: parar,
    comun: comun,
    guion: guion,
    finDe: finDe,
    banderaDe: banderaDe,
    terminar: terminar,
    cumple: cumple,
    demo: demo,
    bin: bin,
    modelo: modelo,
    eileenCerca: eileenCerca,
    eileenConHenry: eileenConHenry,
    agujero: agujero,
    soltarItem: soltarItem,
    revisarSoltados: revisarSoltados,
    datos: datos,
    get D() {
      return D;
    }
  };
}

export function engancharEnInventario(inv, clave, probar) {
  if (!inv) return;
  (inv.__usarItem ||= new Map).set(clave, probar);
}

export function engancharUsarItem(api, {items: items, zonas: zonas, usar: usar, activo: activo}) {
  const inv = api.henry.inventario;
  if (!inv) return;
  const probar = k => {
    if (k == null || !activo() || !items.includes(k)) return null;
    const pj = api.aJuego(api.pies());
    for (const o of zonas()) {
      const z = o.zona || {};
      if (z.dmy13 !== k || !o.pos) continue;
      const r = z.dmy1 === 1 ? z.radio || 150 : Math.max(...z.caja || [ 300, 0, 300 ]) / 2;
      if (Math.hypot(pj[0] - o.pos[0], pj[2] - o.pos[2]) > r + 80) continue;
      return () => usar(o);
    }
    return null;
  };
  engancharEnInventario(inv, "usar " + items.join(","), probar);
}
