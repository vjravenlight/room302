// SH4 web — FeniXVOID · Project Ravenlight
import { json, q } from "./motor.js";

import { engancharEnInventario } from "./mitad2_comun.js";

import { lucesDelJuego, aplicarLucesPersonaje } from "../lib/luz_cine.js";

import { FPS } from "../lib/sqt.js";

import { vozMediaDemo, volumenMediaDemo, camaraJuego } from "./voz_media.js";

import { crearGuion, agujeroDeVuelta } from "./guion_comun.js";

import { partesBin } from "../lib/sh4bin.js";

import { leerModelo } from "../lib/modelo.js";

import { leerTexturas } from "../lib/texturas.js";

import { leerAnimacion } from "../lib/animacion.js";

import { crearPersonaje } from "../lib/personaje.js";

const pad3 = n => String(n).padStart(3, "0");

const distXZ = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);

const azar = n => Math.floor(Math.random() * n);

const LLEGADA = {
  escena: 1,
  pos: [ -788.67, -1.89, 2160.19 ],
  rot: 2.93
};

const JASPER = {
  6: {
    centro: [ 1541, -100, 71 ],
    zona: {
      pos: [ 1487, 0, 210 ],
      radio: 200
    }
  },
  9: {
    centro: [ 1481, -200, 1910 ],
    zona: {
      pos: [ 1485, -200, 2e3 ],
      radio: 200
    },
    caja: {
      pos: [ 1245, -100, 2200 ],
      medio: [ 300, 150, 300 ]
    }
  }
};

const DESPUES_315 = {
  pos: [ 946, 0, 2220 ],
  rot: 1.85
};

const DESPUES_012 = {
  pos: [ 25, 0, -154 ],
  rot: 2.9
};

const HUMO_FR21 = {
  pos: [ 1015, -360, 333 ],
  techo: -650,
  sonido: 51102,
  sonidoPos: [ 1188, -220, -125 ]
};

const GOLPES_FR21 = {
  pos: [ 1122.28, -300, 352.9 ],
  sonidos: [ 40079, 40080 ]
};

const SON_ITEM = 40006;

const SON_CAE = 50100;

const ITEM = {
  BATIDO: 62,
  PALA: 63,
  LLAVE: 64
};

let BD = null;

async function datos() {
  if (!BD || BD._vacio) BD = await json("./bosque_datos.json") || BD || {
    _vacio: true,
    fin: {},
    guiones: {},
    agujeros: [],
    zonas: {},
    cerraduras: []
  };
  return BD;
}

datos();

export const BOSQUE = {
  etapa: "fr",
  nombre: {
    s: "Mundo del Bosque",
    e: "Forest World"
  },
  inicio: {
    escena: 1
  },
  terminado: 522,
  banderasAlLlegar: [],
  banderasAtajo: [ 501 ],
  despues: {},
  demoAlAzar: {},
  molinetes: [],
  sinHacer: [ 27, 3161 ],
  fin: {
    evnum: 28,
    escena302: 2
  },
  variantes: [ {
    escenas: [ 9, 23 ],
    elegir: F => F(1130) ? 23 : 9
  } ],
  puertas: {},
  excluir: () => false,
  crear: api => crearBosque(api)
};

function crearBosque(api) {
  const {THREE: THREE, M: M, juego: juego, henry: henry, F: F, prender: prender, decir: decir} = api;
  const E = .005;
  const aMundo = p => new THREE.Vector3(-p[0] * E, -p[1] * E, p[2] * E);
  const apagar = n => {
    if (n) api.PARTIDA.banderas[n] = 0;
  };
  const posHenry = () => api.aJuego(api.pies());
  const camaraOyente = () => camaraJuego(THREE, M.camara, api.aJuego);
  const cuantos = k => henry.inventario?.cuantos(k) || 0;
  const son = () => api.amb?.son || null;
  function sonar(id, posJuego = null, op = {}) {
    try {
      return son()?.efecto?.(id, posJuego ? aMundo(posJuego) : null, op) || null;
    } catch {
      return null;
    }
  }
  const comun = n => juego.textoComun?.(n) || "";
  let escena = 0, humoHecho = false, accionPendiente = false, aAntes = false;
  const finDe = ev => BD?.fin?.etapa3?.[String(ev?.evnum)] || BD?.fin?.comun?.[String(ev?.evnum)] || null;
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
  const finDistinto = ev => {
    const l = finDe(ev);
    if (!l || !ev?.evnum) return false;
    const b = banderaDe(ev);
    return !(l.length === 1 && l[0] === b);
  };
  const cumpleCond = c => !c || c === "siempre" || c.split(/\s+AND\s+/).every(x => x[0] === "!" ? !F(+x.slice(2)) : F(+x.slice(1)));
  let guionComun = null;
  function guion(cmds, o) {
    guionComun ||= crearGuion({
      decir: decir,
      texto: (a, n) => api.texto(a, n),
      comun: comun,
      darItem: k => henry.agregarItem(k, 1),
      siNo: "marcado",
      llamada: f => llamada(f)
    });
    return guionComun(cmds, o);
  }
  function llamada(f) {
    const d = String(f).slice(0, 8);
    if (d === "0x50abe0" || d === "0x50ac00") sonar(SON_ITEM); else if (d === "0x4e0f60") {
      sonar(GOLPES_FR21.sonidos[0], GOLPES_FR21.pos);
      setTimeout(() => sonar(GOLPES_FR21.sonidos[1], GOLPES_FR21.pos), 3e3);
    } else if (d === "0x4e0f50") prender(504);
  }
  const demo = n => api.ejecutar({
    i: -1,
    bosque: true,
    ev: {
      evnum: 0,
      demo: n,
      cond: "siempre"
    }
  });
  const zonasEscena = () => BD?.zonas?.[`${escena}/${api.mitad}`] || [];
  const zonaDe = o => zonasEscena().find(z => z.i === o.i) || null;
  const cerraduraDe = door => (BD?.cerraduras || []).find(c => c.door === door) || null;
  const cond1130 = c => !c || c.tipo !== 5 || c.condiciones.every(([b, v]) => b !== 1130 || (F(1130) ? 1 : 0) === v);
  const media = (() => {
    const cache = new Map;
    let actual = null, subAnt = "";
    const grupo = new THREE.Group;
    grupo.name = "media demo (Jasper)";
    const _p = new THREE.Vector3, _q = new THREE.Quaternion, _s = new THREE.Vector3, _m = new THREE.Matrix4;
    async function abrir(n) {
      if (!cache.has(n)) cache.set(n, (async () => {
        const D = await api.cine.abrir(n);
        const off = api.DS?.demos?.["fr/d_" + pad3(n)]?.desplazar || [ 0, 0, 0 ];
        D.grupoMedia = new THREE.Group;
        D.grupoMedia.position.copy(aMundo(off)).negate();
        for (const ent of D.personajes) if (ent.obj) {
          ent.obj.grupo.visible = true;
          D.grupoMedia.add(ent.obj.grupo);
        }
        return D;
      })().catch(e => {
        cache.delete(n);
        throw e;
      }));
      return cache.get(n);
    }
    function poner(D, t) {
      const S = D.muestrear(t, true);
      const L = lucesDelJuego(D.sqt, S);
      for (const ent of D.personajes) {
        if (!ent.obj) continue;
        const po = S.poses[ent.i], hs = ent.obj.huesos;
        if (ent.uniformsLuz) aplicarLucesPersonaje(ent.uniformsLuz, L, po.tiene[0] ? new THREE.Vector3(-po.pos[0] * E, -po.pos[1] * E, po.pos[2] * E) : null, null);
        for (let h = 0; h < hs.length; h++) {
          if (po.tiene[h]) {
            _p.fromArray(po.pos, h * 3);
            _q.fromArray(po.rot, h * 4);
            _s.fromArray(po.esc, h * 3);
            hs[h].matrix.compose(_p, _q, _s);
          } else {
            const pa = ent.padres[h];
            if (pa >= 0 && pa < h) hs[h].matrix.multiplyMatrices(hs[pa].matrix, _m.copy(ent.bind[pa]).invert()).multiply(ent.bind[h]); else hs[h].matrix.copy(ent.bind[h]);
          }
          hs[h].matrixWorldNeedsUpdate = true;
        }
      }
    }
    function sub(t) {
      if (t === subAnt) return;
      subAnt = t;
      try {
        api.mostrarSub(t);
      } catch {}
    }
    function arrancar(D, {centro: centro, alFin: alFin = null, vel: vel = 1} = {}) {
      parar();
      if (!grupo.parent) M.escena.add(grupo);
      grupo.add(D.grupoMedia);
      const voz = vozMediaDemo(son(), D.id, volumenMediaDemo(camaraOyente(), centro));
      actual = {
        D: D,
        t: 0,
        vel: vel,
        voz: voz,
        alFin: alFin,
        centro: centro
      };
      poner(D, 0);
    }
    function parar() {
      if (!actual) return;
      actual.voz?.parar(.2);
      actual.D.grupoMedia.removeFromParent();
      actual = null;
      sub("");
    }
    function rapido(v = 4) {
      if (actual) actual.vel = v;
    }
    function cuadro(dt, pies) {
      if (!actual) return false;
      const a = actual;
      a.t += dt * a.vel;
      const f = Math.min(a.D.sqt.n - 1, a.t * FPS);
      a.voz?.fijar(volumenMediaDemo(camaraOyente(), a.centro));
      const k = pies && a.centro ? volumenMediaDemo(pies, a.centro) : 1;
      const fi = Math.floor(f);
      sub(k > .35 && juego.opciones?.subtitulos !== false ? a.D.subs.filter(s => fi >= s.ini && fi < s.fin).map(s => s.texto).join("\n") : "");
      poner(a.D, f);
      if (f >= a.D.sqt.n - 1 && (!a.voz || a.voz.terminada || a.vel > 1)) {
        const fin = a.alFin;
        a.alFin = null;
        if (fin) fin(); else {
          a.t = 0;
          a.vel = 1;
          a.voz?.parar(.1);
          a.voz = null;
        }
      }
      return true;
    }
    function liberar() {
      parar();
      for (const p of cache.values()) p.then(D => api.cine.liberar(D)).catch(() => {});
      cache.clear();
      grupo.removeFromParent();
    }
    function soltarMenos(quedan) {
      for (const [n, p] of [ ...cache ]) {
        if (quedan.includes(n)) continue;
        if (actual) p.then(D => {
          if (D === actual?.D) parar();
        }).catch(() => {});
        cache.delete(n);
        p.then(D => api.cine.liberar(D)).catch(() => {});
      }
    }
    return {
      abrir: abrir,
      arrancar: arrancar,
      parar: parar,
      rapido: rapido,
      cuadro: cuadro,
      liberar: liberar,
      soltarMenos: soltarMenos,
      grupo: grupo,
      get actual() {
        return actual;
      }
    };
  })();
  const jasper = (() => {
    let tipo = null, esc = 0, hablando = false, pedido = false, dentroAntes = false, tocado = false, cargando = 0;
    function elegir(n) {
      if (api.mitad !== 1) return null;
      if (n === 6) {
        if (!F(504) && !F(507)) return "A6";
        if (F(504) && !F(507)) return "B6";
        return null;
      }
      if (n === 9) {
        if (F(518)) return null;
        if (cuantos(ITEM.LLAVE)) return "C9";
        if (F(507) && !F(513) && !cuantos(ITEM.BATIDO)) return "A9";
        if (F(507) && (cuantos(ITEM.BATIDO) || F(513))) return "B9";
      }
      return null;
    }
    const quieto = t => ({
      A6: 303,
      B6: 307,
      A9: 310,
      B9: F(513) ? 316 : 310,
      C9: 316
    }[t]);
    const charlas = t => ({
      A6: [ 304, 305, 306 ],
      B6: [ 308, 309 ],
      A9: [ 311, 312, 313 ],
      B9: [ 311, 314 ],
      C9: [ 317 ]
    }[t] || []);
    async function alCargar(n) {
      const yo = ++cargando;
      media.parar();
      hablando = false;
      pedido = false;
      tocado = false;
      dentroAntes = false;
      esc = n;
      tipo = elegir(n);
      media.soltarMenos(tipo ? [ quieto(tipo), ...charlas(tipo) ] : []);
      if (!tipo) return;
      try {
        const D = await media.abrir(quieto(tipo));
        if (yo !== cargando || esc !== escena) return;
        media.arrancar(D, {
          centro: JASPER[esc].centro
        });
        for (const k of charlas(tipo)) media.abrir(k).catch(() => {});
      } catch (e) {
        console.warn("Jasper", e.message);
      }
    }
    async function volverQuieto() {
      hablando = false;
      if (!tipo) return;
      try {
        const D = await media.abrir(quieto(tipo));
        if (esc === escena) media.arrancar(D, {
          centro: JASPER[esc].centro
        });
      } catch {}
    }
    async function charlar(n, bandera) {
      hablando = true;
      pedido = false;
      if (bandera) prender(bandera);
      try {
        const D = await media.abrir(n);
        if (esc !== escena) return;
        media.arrancar(D, {
          centro: JASPER[esc].centro,
          alFin: () => volverQuieto()
        });
      } catch (e) {
        hablando = false;
        console.warn("Jasper", n, e.message);
      }
    }
    function cual() {
      switch (tipo) {
       case "A6":
        return F(503) ? [ [ 305, 306 ][azar(2)], 0 ] : [ 304, 503 ];

       case "B6":
        return F(505) ? [ 309, 0 ] : [ 308, 505 ];

       case "A9":
        return !F(509) ? [ 311, 509 ] : !F(510) ? [ 312, 510 ] : [ 313, 511 ];

       case "B9":
        return F(513) ? null : !F(509) ? [ 311, 509 ] : [ 314, 0 ];

       case "C9":
        return [ 317, 517 ];
      }
      return null;
    }
    const conEntrada = () => [ "A6", "B6", "C9" ].includes(tipo);
    function cuadro(pies, accion) {
      if (!tipo || esc !== escena || !pies) return;
      const J = JASPER[esc];
      let dentro = distXZ(pies, J.zona.pos) <= J.zona.radio && Math.abs(pies[1] - J.zona.pos[1]) < 400;
      if (esc === 9 && F(516) && J.caja) {
        const c = J.caja;
        if (Math.abs(pies[0] - c.pos[0]) <= c.medio[0] && Math.abs(pies[2] - c.pos[2]) <= c.medio[2]) dentro = true;
      }
      const entro = dentro && !dentroAntes;
      dentroAntes = dentro;
      const toco = tocado;
      tocado = false;
      const quiere = (entro || toco) && conEntrada() || accion && dentro || toco;
      if (!quiere || hablando || pedido) return;
      const c = cual();
      if (!c) return;
      if (tipo === "B6" || tipo === "C9" || !media.actual) charlar(c[0], c[1]); else {
        pedido = true;
        media.rapido(4);
        media.actual.alFin = () => charlar(c[0], c[1]);
      }
    }
    const puedeBatido = () => escena === 9 && tipo === "B9" && !F(513) && cuantos(ITEM.BATIDO) > 0;
    async function darBatido() {
      media.parar();
      hablando = true;
      await demo(315);
      api.ubicarHenry(DESPUES_315.pos, DESPUES_315.rot);
      for (const b of [ 509, 510, 511, 512, 513 ]) prender(b);
      henry.inventario?.quitar(ITEM.BATIDO);
      tipo = elegir(9) || "B9";
      await volverQuieto();
      M.fundir(0, .5);
      return null;
    }
    return {
      alCargar: alCargar,
      cuadro: cuadro,
      tocar: () => {
        tocado = true;
      },
      puedeBatido: puedeBatido,
      darBatido: darBatido,
      get tipo() {
        return tipo;
      },
      get hablando() {
        return hablando;
      }
    };
  })();
  async function usarEn(o, z) {
    const k = z.dmy13, ev = o.ev || z.ev || {};
    if (!cuantos(k)) return false;
    if (k === ITEM.BATIDO) {
      if (!jasper.puedeBatido()) return false;
      await jasper.darBatido();
      return true;
    }
    if (k === ITEM.PALA && ev.evnum === 95) {
      if (F(516)) return false;
      await demo(20);
      henry.inventario?.quitar(ITEM.PALA);
      terminar(ev);
      return true;
    }
    if (k === ITEM.LLAVE && ev.evnum === 96) {
      if (F(518)) return false;
      try {
        api.amb?.puerta?.(null, 3);
      } catch {}
      await guion(BD.guiones["96"]);
      henry.inventario?.quitar(ITEM.LLAVE);
      terminar(ev);
      return true;
    }
    return false;
  }
  let invEnganchado = false;
  function engancharInventario() {
    const inv = henry.inventario;
    if (invEnganchado || !inv) return;
    invEnganchado = true;
    const probar = k => {
      if (k == null || escena === 0 || api.mitad == null || !activo) return null;
      if (![ ITEM.BATIDO, ITEM.PALA, ITEM.LLAVE ].includes(k)) return null;
      const pj = posHenry();
      for (const z of zonasEscena()) {
        if (z.dmy13 !== k) continue;
        const o = api.eventos.find(x => x.i === z.i) || {
          i: z.i,
          pos: z.pos,
          ev: z.ev
        };
        const pos = z.pos || o.pos;
        if (!pos) continue;
        const cerca = z.dmy1 === 6 ? distXZ(pj, pos) < 500 : distXZ(pj, pos) <= (z.dmy1 === 1 ? z.dmy2 || 150 : 200) + 60;
        if (!cerca) continue;
        return () => usarEn(o, z);
      }
      return null;
    };
    engancharEnInventario(inv, "bosque", probar);
  }
  async function automaticosAhora() {
    for (let k = 0; k < 3; k++) {
      const o = api.eventos.find(x => x.ev && !x.pos && x.ev.evnum && x.ev.guion && cumpleCond(x.ev.cond) && !(banderaDe(x.ev) && F(banderaDe(x.ev))));
      if (!o) return;
      await api.ejecutar(o);
      if (!banderaDe(o.ev)) return;
    }
  }
  let activo = false;
  function botonA() {
    const s = M.renderer?.xr?.getSession?.();
    if (!s) return false;
    let a = false;
    for (const src of s.inputSources) if (src.handedness === "right" && src.gamepad?.buttons[4]?.pressed) a = true;
    const r = a && !aAntes;
    aAntes = a;
    return r;
  }
  const tareaAccion = (dt, {acciones: acciones, teclas: teclas}) => {
    if (!activo || juego.demoActual || juego.hablando || henry.inventario?.abierto) return;
    const vr = M.enVR();
    const manos = vr && [ ...M.renderer?.xr?.getSession?.()?.inputSources || [] ].some(s => s.hand);
    for (const a of acciones) {
      if (vr) {
        if (a === "accion" && manos) accionPendiente = true;
        continue;
      }
      if (a === "accion" || a === "aceptar" && !teclas.Space || a === "clic" && M.tactil) accionPendiente = true;
    }
    if (vr && botonA()) accionPendiente = true;
  };
  const CASA_FR20 = {
    puntos: [ [ 152.07, 0, 866.65, [ 1, 1, 2, 2 ] ], [ 9.86, 0, 155.15, [ 0, 2, 3, 3 ] ], [ 570.86, 0, 286.85, [ 0, 1, 5, 6 ] ], [ 208.35, 0, -373.79, [ 1, 4, 5, 6 ] ], [ -575.96, 0, -566.54, [ 2, 3, 5, 6 ] ], [ -726.83, 0, 99.72, [ 2, 3, 4, 6 ] ], [ -203.9, 0, -311.05, [ 2, 3, 4, 5 ] ], [ -890, 0, -137.39, [ 2, 3, 4, 5 ] ] ],
    voz: 30214,
    sub: [ [ 49, 4 ] ],
    radio: 120,
    empuje: 1.9,
    vel: 2.5,
    llega: 1.25,
    giro: .05,
    pasos: 40016
  };
  const jasperCasa = (() => {
    let pj = null, A = null, cargando = null, vuelta = 0;
    let paso = 0, espera = 0, antes = 7, actual = 7, destino = 7, yaw = 0, dYaw = 0, vel = [ 0, 0, 0 ], camina = false, pos = [ 0, 0, 0 ];
    let dentroAntes = false, hablaHasta = 0, voz = null, cuadroAnt = 0;
    const norm = a => {
      while (a > Math.PI) a -= 2 * Math.PI;
      while (a < -Math.PI) a += 2 * Math.PI;
      return a;
    };
    async function bin(a) {
      const b = await api.bajar("data/" + a);
      return {
        b: b,
        p: partesBin(b)
      };
    }
    async function cargar() {
      if (!cargando) cargando = (async () => {
        const [g, f] = await Promise.all([ bin("geik.bin"), bin("fr20.bin") ]);
        const m = g.p[0], t = g.p[1];
        const p = crearPersonaje(leerModelo(g.b, m.ofs, m.len), leerTexturas(g.b, t.ofs, t.len));
        const an = i => leerAnimacion(f.b, f.p[i].ofs, f.p[i].len);
        A = {
          quieto: an(7),
          habla: an(8),
          camina: an(9)
        };
        p.grupo.name = "Jasper (fr20, ev 27)";
        return p;
      })().catch(e => {
        cargando = null;
        throw e;
      });
      return cargando;
    }
    function anim(k) {
      pj.poner(A[k]);
      pj.reproductor.loop = true;
    }
    function quitar() {
      pj?.grupo.removeFromParent();
      try {
        voz?.parar?.(.3);
      } catch {}
      voz = null;
      if (hablaHasta) {
        try {
          api.mostrarSub("");
        } catch {}
      }
      hablaHasta = 0;
    }
    async function alCargar(n) {
      const v = ++vuelta;
      quitar();
      if (n !== 20 || api.mitad !== 1 || F(520)) {
        pj = null;
        return;
      }
      let p = null;
      try {
        p = await cargar();
      } catch (e) {
        console.warn("Jasper fr20", e.message);
        return;
      }
      if (v !== vuelta || escena !== 20) return;
      pj = p;
      paso = 0;
      antes = 7;
      actual = 7;
      destino = 7;
      yaw = 0;
      camina = false;
      dentroAntes = false;
      pos = CASA_FR20.puntos[7].slice(0, 3);
      api.cont.add(pj.grupo);
      pj.ubicar(pos[0], pos[1], pos[2], yaw);
    }
    function hablar() {
      paso = 6;
      anim("habla");
      try {
        voz = sonar(CASA_FR20.voz, null, {
          volumen: 1,
          loop: false
        });
      } catch {
        voz = null;
      }
      const [m, s] = CASA_FR20.sub[0];
      if (juego.opciones?.subtitulos !== false) {
        try {
          api.mostrarSub(api.texto(6, m) || "");
        } catch {}
      }
      hablaHasta = performance.now() + s * 1e3;
    }
    function cuadro(dt, pies) {
      if (!pj) return false;
      if (F(520)) {
        quitar();
        pj = null;
        return true;
      }
      const f = Math.min(dt, .1) * 30;
      const P = CASA_FR20.puntos;
      if (paso === 0) {
        anim("quieto");
        camina = false;
        espera = (Math.random() + 1) * 150;
        paso = 1;
      } else if (paso === 1) {
        espera -= f;
        if (espera < 0) paso = 2;
      } else if (paso === 2) {
        camina = true;
        anim("camina");
        cuadroAnt = 0;
        let k = 0;
        do {
          destino = P[actual][3][Math.floor(Math.random() * 4)];
        } while (destino === antes && ++k < 20);
        const d = [ P[destino][0] - pos[0], 0, P[destino][2] - pos[2] ], L = Math.hypot(d[0], d[2]) || 1;
        vel = [ d[0] / L * CASA_FR20.vel, 0, d[2] / L * CASA_FR20.vel ];
        dYaw = norm(Math.atan2(vel[0], vel[2]) - yaw);
        paso = 3;
      } else if (paso === 3) {
        const meta = Math.atan2(vel[0], vel[2]), falta = norm(meta - yaw), giroCuadro = dYaw * CASA_FR20.giro * f;
        if (Math.abs(falta) < CASA_FR20.giro || Math.abs(giroCuadro) >= Math.abs(falta) || Math.sign(giroCuadro) !== Math.sign(falta)) {
          yaw = meta;
          paso = 4;
        } else yaw = norm(yaw + giroCuadro);
      } else if (paso === 4) {
        pos = [ pos[0] + vel[0] * f, pos[1], pos[2] + vel[2] * f ];
        const q = P[destino];
        const fr = pj.reproductor.t % Math.max(1, A.camina.duracion);
        if (fr >= 16 && cuadroAnt < 16 || fr >= 48 && cuadroAnt < 48) sonar(CASA_FR20.pasos, pos, {
          volumen: 1
        });
        cuadroAnt = fr;
        if (Math.hypot(q[0] - pos[0], q[2] - pos[2]) < Math.max(CASA_FR20.llega, CASA_FR20.vel * f)) {
          pos = q.slice(0, 3);
          antes = actual;
          actual = destino;
          paso = 0;
        }
      } else if (paso === 6 || paso === 7) {
        paso = 7;
        if (performance.now() >= hablaHasta && !(voz?.sonando ?? false)) {
          try {
            api.mostrarSub("");
          } catch {}
          hablaHasta = 0;
          paso = 8;
        }
      }
      if (paso === 8) {
        if (camina) {
          anim("camina");
          paso = 4;
        } else {
          anim("quieto");
          paso = 1;
        }
      }
      pj.ubicar(pos[0], pos[1], pos[2], yaw);
      pj.actualizar(dt);
      if (pies) {
        const dx = pies[0] - pos[0], dz = pies[2] - pos[2], d = Math.hypot(dx, dz);
        const dentro = d <= CASA_FR20.radio && Math.abs(pies[1] - pos[1]) < 400;
        if (dentro && !dentroAntes && paso < 5) hablar();
        dentroAntes = dentro;
        if (d < CASA_FR20.radio && d > .001) {
          try {
            api.empujar(new THREE.Vector3(-dx / d, 0, dz / d), (CASA_FR20.radio - d) * E * .2);
          } catch {}
        }
      }
      return true;
    }
    return {
      alCargar: alCargar,
      cuadro: cuadro,
      quitar: quitar,
      get estado() {
        return pj ? {
          paso: paso,
          pos: pos.map(Math.round),
          destino: destino,
          actual: actual
        } : null;
      }
    };
  })();
  const COSA_FR07 = {
    pos: [ 1256.390625, -605.65, 2019.102783 ],
    piso: 150.75,
    v0: 2222.2,
    g: 1960
  };
  let cosa = null;
  function ponerCosaFr07() {
    cosa = null;
    if (escena !== 7) return;
    let g = null;
    api.cont?.traverse?.(o => {
      if (!g && o.name === "mundo_5" && /^sala_fr07/.test(o.parent?.name || "")) g = o;
    });
    if (!g) return;
    const cayo = F(535);
    cosa = {
      g: g,
      y: cayo ? COSA_FR07.piso : COSA_FR07.pos[1],
      v: 0,
      cae: false
    };
    g.position.copy(aMundo([ COSA_FR07.pos[0], cosa.y, COSA_FR07.pos[2] ]));
  }
  function caerCosaFr07() {
    prender(535);
    if (!cosa) {
      setTimeout(() => sonar(SON_CAE, [ COSA_FR07.pos[0], COSA_FR07.piso, COSA_FR07.pos[2] ]), 700);
      return;
    }
    cosa.cae = true;
    cosa.v = COSA_FR07.v0;
  }
  function cuadroCosaFr07(dt) {
    if (!cosa?.cae) return false;
    cosa.v += COSA_FR07.g * dt;
    cosa.y += cosa.v * dt;
    if (cosa.y >= COSA_FR07.piso) {
      cosa.y = COSA_FR07.piso;
      cosa.cae = false;
      sonar(SON_CAE, [ COSA_FR07.pos[0], COSA_FR07.piso, COSA_FR07.pos[2] ], {
        radio: 4e3
      });
    }
    cosa.g.position.copy(aMundo([ COSA_FR07.pos[0], cosa.y, COSA_FR07.pos[2] ]));
    return true;
  }
  return {
    inicio() {
      if (!F(501)) return {
        ...LLEGADA
      };
      const s = api.PARTIDA.salidaMundo?.fr;
      if (s) return {
        escena: s.escena,
        pos: s.pos,
        rot: s.rot
      };
      const fila = (BD?.agujeros || []).find(f => f.etapa === 3 && F(f.bandera));
      return fila ? {
        escena: fila.escena,
        pos: fila.pos,
        rot: fila.rot
      } : null;
    },
    async alCargarEscena(n) {
      await datos();
      escena = n;
      humoHecho = false;
      accionPendiente = false;
      activo = true;
      engancharInventario();
      if (!M.tareas.has(tareaAccion)) M.tareas.add(tareaAccion);
      if (F(516) && cuantos(ITEM.LLAVE)) prender(539); else apagar(539);
      if (api.mitad === 1 && (api.enemigos?.enemigos || []).some(e => e.tipo === "FLAMES" && (e.def?.tipo_param || 0) === 1 && e.visible !== false)) prender(571);
      await jasper.alCargar(n);
      ponerCosaFr07();
      await jasperCasa.alCargar(n);
    },
    cuadro(dt) {
      const pj = posHenry();
      const hay = media.cuadro(dt, pj);
      if (escena === 20 && F(520) && !F(521) && !humoHecho) {
        humoHecho = true;
        try {
          api.amb?.fx?.disparar?.("humo_puerta", {
            pos: HUMO_FR21.pos,
            pos2: HUMO_FR21.pos,
            techo: HUMO_FR21.techo
          });
        } catch (e) {
          console.warn("humo fr21", e);
        }
        sonar(HUMO_FR21.sonido, HUMO_FR21.sonidoPos);
        prender(521);
      }
      const acc = accionPendiente;
      accionPendiente = false;
      jasper.cuadro(pj, acc);
      const cae = cuadroCosaFr07(dt);
      const casa = jasperCasa.cuadro(dt, pj);
      return hay || cae || casa;
    },
    maneja(ev) {
      if (!ev) return false;
      if (ev.evnum === 23) return !F(507);
      return /^0x4dea60|^0x4df350|^0x4df380|^0x4e0c90|^0x4e0e80|^0x4e0ef0/.test(ev.init || "") || /^0x4df050/.test(ev.exec || "") || /^0x4e0dc0/.test(ev.trgchk || "");
    },
    llamada: llamada,
    estado() {
      const b = [ 501, 502, 503, 504, 505, 507, 509, 510, 511, 512, 513, 516, 517, 518, 520, 521, 522, 535, 536, 537, 538, 539, 556, 570, 571, 1609 ].filter(n => F(n));
      return {
        escena: escena,
        jasper: jasper.tipo,
        hablando: jasper.hablando,
        casa: jasperCasa.estado,
        media: media.actual ? media.actual.D.id : null,
        banderas: b,
        batido: cuantos(ITEM.BATIDO),
        pala: cuantos(ITEM.PALA),
        llave: cuantos(ITEM.LLAVE)
      };
    },
    alDemo(si) {
      media.grupo.visible = !si;
    },
    alSalir() {
      activo = false;
      media.liberar();
      jasperCasa.quitar();
      M.tareas.delete(tareaAccion);
    },
    extras: [],
    async ejecutar(o) {
      if (o.bosque) return undefined;
      const ev = o.ev || {};
      const z = zonaDe(o);
      if (z?.dmy1 === 6 && ev.evnum !== 96) return null;
      if (z && (z.dmy6 === 1 || z.dmy6 === 2) && z.dmy13) {
        if (await usarEn(o, z)) return null;
        if (z.dmy13 === ITEM.BATIDO) {
          jasper.tocar();
          return null;
        }
        const otro = api.eventos.find(x => x !== o && x.pos && o.pos && distXZ(x.pos, o.pos) < 40 && x.ev?.guion && !zonaDe(x)?.dmy13);
        if (otro) return api.ejecutar(otro);
        return null;
      }
      if (/^0x4d1bf0/.test(ev.exec || "")) {
        return agujeroDeVuelta({
          api: api,
          etapa: "fr",
          num: 3,
          agujeros: BD.agujeros || [],
          escena: escena,
          pos: posHenry(),
          rot: henry.controlador.m.cuerpo,
          antes: () => media.parar()
        });
      }
      if (/^0x4dea60|^0x4df350|^0x4df380/.test(ev.init || "")) {
        jasper.tocar();
        return null;
      }
      if (/^0x4de1|^0x4de4|^0x4de7|^0x4deaf|^0x4df08/.test(ev.exec || "")) return null;
      if (/^0x4e0c90/.test(ev.init || "")) {
        await guion(F(502) ? BD.guiones["249_azar_" + azar(3)] : BD.guiones["249_primero"]);
        terminar(ev);
        return null;
      }
      if (/^0x4e0e80/.test(ev.init || "")) {
        await guion(F(538) ? BD.guiones.bidon_con_538 : BD.guiones.bidon_sin_538);
        prender(538);
        return null;
      }
      if (/^0x4e0ef0/.test(ev.init || "")) {
        if (!F(567)) await guion(BD.guiones["2563_sin_567"]); else if (!F(1130)) await guion(BD.guiones["2563_sin_1641"]); else {
          await guion(BD.guiones["2563_con_1641"]);
          prender(568);
        }
        terminar(ev);
        return null;
      }
      if (ev.evnum === 23) {
        await demo(12);
        api.ubicarHenry(DESPUES_012.pos, DESPUES_012.rot);
        terminar(ev);
        return null;
      }
      if (/^0x4e0dc0/.test(ev.trgchk || "")) {
        caerCosaFr07();
        return null;
      }
      if (ev.evnum === 28) {
        prender(1609);
        return undefined;
      }
      if (ev.guion && !o.item && (ev.guion.some(c => c.archivo === 0 || /^0x/.test(c.imagen || "")) || finDistinto(ev))) {
        if (await guion(ev.guion)) terminar(ev);
        return null;
      }
      return undefined;
    },
    elegirPuerta(lista) {
      if (lista.length === 1) return lista[0];
      return lista.find(p => cond1130(cerraduraDe(p.door_no))) || lista[0];
    },
    async antesDePuerta(p) {
      const c = cerraduraDe(p.door_no);
      if (!c || await cerradura(c, p)) return true;
      for (const z of zonasEscena().filter(x => x.dmy1 === 6 && x.dmy2 === p.door_no)) await enganchado(z, p);
      return false;
    }
  };
  async function cerradura(c, p) {
    const sonido = t => {
      try {
        api.amb?.puerta?.(p, t);
      } catch {}
    };
    switch (c.tipo) {
     case 5:
      return c.condiciones.every(([b, v]) => !b || (F(b) ? 1 : 0) === v);

     case 0:
     case 1:
     case 2:
      {
        if (F(c.bandera)) return true;
        if (c.escena === escena) {
          if (c.tipo === 0) {
            prender(c.bandera);
            sonido(3);
            await guion(BD.guiones[c.guiones[0]]);
            return false;
          }
          if (c.item && cuantos(c.item)) {
            sonido(3);
            await guion(BD.guiones[c.guiones[2]]);
            if (c.tipo === 1) henry.inventario?.quitar(c.item);
            prender(c.bandera);
            return false;
          }
          sonido(4);
          await guion(BD.guiones[c.guiones[0]]);
          return false;
        }
        sonido(4);
        await guion(BD.guiones[c.guiones[1]]);
        return false;
      }

     case 3:
     case 4:
      sonido(c.tipo === 3 ? 2 : 4);
      await guion(BD.guiones[c.guiones[0]]);
      return false;

     case 6:
      if (F(c.bandera)) return true;
      sonido(4);
      await guion(BD.guiones[c.guiones[0]]);
      return false;
    }
    return true;
  }
  async function enganchado(z, p) {
    const ev = z.ev || {};
    const t = (ev.trgchk || "").slice(0, 8), i = (ev.init || "").slice(0, 8);
    if (ev.evnum === 3161) {
      if (!F(539)) return;
      terminar(ev);
      await M.fundir(1, .6);
      try {
        api.amb?.fx?.disparar?.("ruido", {
          valores: [ 64, 64, 32 ],
          segundos: 1.5
        });
      } catch {}
      api.ubicarHenry(PUERTA13_FR13.pos, PUERTA13_FR13.rot);
      await M.fundir(0, .8);
      return;
    }
    const o = api.eventos.find(x => x.i === z.i);
    const vale = cumpleCond(o?.ev?.cond ?? null);
    if (!vale) return;
    if (i === "0x4dea60") {
      if (!F(516)) jasper.tocar();
      return;
    }
    if (t === "0x4e0ec0") {
      if (F(570)) return;
      await guion(o?.ev?.guion || [ {
        msg: 185,
        archivo: 6
      } ]);
      prender(570);
      return;
    }
    if (t === "0x4e0d80") {
      if (F(521)) return;
      try {
        api.amb?.puerta?.(p, 4);
      } catch {}
      await guion(o?.ev?.guion || [ {
        msg: 18,
        archivo: 0
      } ]);
      return;
    }
  }
}

const PUERTA13_FR13 = {
  pos: [ -2855.504, -565.64, 3367.923 ],
  rot: Math.PI / 2
};
