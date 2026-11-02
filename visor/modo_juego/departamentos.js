// SH4 web — FeniXVOID · Project Ravenlight
import { json, q } from "./motor.js";

import { partesBin } from "../lib/sh4bin.js";

import { leerModelo } from "../lib/modelo.js";

import { leerTexturas } from "../lib/texturas.js";

import { leerAnimacion } from "../lib/animacion.js";

import { crearPersonaje } from "../lib/personaje.js";

import { lucesDelJuego, aplicarLucesPersonaje } from "../lib/luz_cine.js";

import { crearGuion, agujeroDeVuelta } from "./guion_comun.js";

import { engancharUsarItem } from "./mitad2_comun.js";

const distXZ = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);

const FPS = 30;

const LLEGADA = {
  escena: 24,
  pos: [ 0, 0, 7600 ],
  rot: Math.PI
};

const AGUJEROS_IE = [ {
  fila: 17,
  etapa: 6,
  escena: 22,
  bandera: 18,
  bandera2: 47,
  pos: [ -98, 0, 1347 ],
  rot: 1.57
}, {
  fila: 18,
  etapa: 6,
  escena: 1,
  bandera: 26,
  bandera2: 55,
  pos: [ -818, 0, -114 ],
  rot: 1.57
} ];

const SON = {
  ITEM: 40006,
  HELADERA: 50400,
  TAQUILLA: 50403,
  LLAVE_MUNECA: 50404,
  VOZ_2280: 20220,
  TELEFONO: 51402
};

const ITEM = {
  TAQUILLA_106: 75,
  SUPERINTENDENTE: 74,
  LLAVES_APTO: 84,
  LLAVE_MUNECA: 77,
  MUNECA: 83,
  PAPELES: [ 66, 67, 71, 72, 73 ]
};

let DD = null;

async function datos() {
  if (!DD || DD._vacio) DD = await json("./departamentos_datos.json") || DD || {
    _vacio: true,
    fin: {},
    agujeros: AGUJEROS_IE,
    cerraduras: [],
    zonas: {},
    guiones: {}
  };
  return DD;
}

datos();

export const DEPARTAMENTOS = {
  etapa: "ie",
  nombre: {
    s: "Mundo de los Departamentos",
    e: "Apartment World"
  },
  inicio: {
    escena: 24
  },
  terminado: 1130,
  banderasAlLlegar: [],
  banderasAtajo: [ 1101 ],
  despues: {},
  demoAlAzar: {},
  molinetes: [],
  sinHacer: [ 2280, 3035 ],
  fin: {
    evnum: 42,
    escena302: 2
  },
  variantes: [],
  puertas: {},
  excluir: (o, escena, PARTIDA) => escena === 5 && o.ev?.evnum === 3169 && !q.has("metralleta") && !((+PARTIDA?.terrorNuevo?.rango || 0) > 89 && (PARTIDA?.terrorNuevo?.modo || 0) !== 1),
  crear: api => crearDepartamentos(api)
};

function crearDepartamentos(api) {
  const {THREE: THREE, M: M, juego: juego, henry: henry, F: F, prender: prender, decir: decir} = api;
  const E = .005;
  const aMundo = p => new THREE.Vector3(-p[0] * E, -p[1] * E, p[2] * E);
  const apagar = n => {
    if (n) api.PARTIDA.banderas[n] = 0;
  };
  const posHenry = () => api.aJuego(api.pies());
  const cuantos = k => henry.inventario?.cuantos(k) || 0;
  const tieneNota = k => !!(henry.inventario?.notas?.includes(k) || (api.PARTIDA.inventario || []).includes(k));
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
  function volumenMando(h, k) {
    for (const f of h?.fuentes || []) {
      f._g0 ??= f.g.gain.value;
      f.g.gain.value = f._g0 * k;
    }
  }
  const comun = n => juego.textoComun?.(n) || "";
  const h0 = n => api.texto(9, n);
  let escena = 0, activo = false, papelesEnganchados = false;
  const finDe = ev => DD?.fin?.etapa6?.[String(ev?.evnum ?? ev)] || DD?.fin?.comun?.[String(ev?.evnum ?? ev)] || null;
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
  const cumpleCond = c => !c || c === "siempre" || c.split(/\s+AND\s+/).every(x => x === "siempre" ? true : x[0] === "!" ? !F(+x.slice(2)) : F(+x.slice(1)));
  const vigente = o => {
    const ev = o?.ev;
    if (!ev || ev.cond == null) return false;
    if (!cumpleCond(ev.cond)) return false;
    const b = banderaDe(ev);
    return !(b && F(b));
  };
  let ultimaEleccion = 0;
  let guionComun = null;
  function guion(cmds, o) {
    guionComun ||= crearGuion({
      decir: decir,
      texto: (a, n) => api.texto(a, n),
      comun: comun,
      darItem: k => henry.agregarItem(k, 1),
      siNo: "conSigno",
      llamada: f => llamada(f),
      alElegir: v => {
        ultimaEleccion = v;
      }
    });
    return guionComun(cmds, o);
  }
  function llamada(f) {
    const d = String(f).slice(0, 8);
    if (d === "0x50abe0" || d === "0x50ac00") sonar(SON.ITEM);
    if (d === "0x4e2aa0") {
      prender(1117);
      telefono.parar();
    }
  }
  const demo = n => api.ejecutar({
    i: -1,
    departamentos: true,
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
  const opacidad = (grupo, a) => grupo.traverse(o => {
    if (o.material) {
      for (const mt of [].concat(o.material)) {
        mt.transparent = a < 1;
        mt.opacity = a;
      }
    }
  });
  const salaGrupo = () => api.cont.children.find(c => /^sala_/.test(c.name || "")) || null;
  const parteSala = k => salaGrupo()?.getObjectByName("mundo_" + k) || null;
  function crearMediaDemo({nombre: nombre, pos: pos, personajes: personajes = null, alTerminar: alTerminar = null}) {
    let md = null;
    function soltar(x) {
      if (!x) return;
      if (x.viejo) {
        soltar(x.viejo);
        x.viejo = null;
      }
      parar(x.voz, .2);
      if (x.D) api.cine.liberar(x.D);
      x.grupo.removeFromParent();
    }
    async function iniciar(n) {
      const viejo = md;
      const yo = md = {
        n: n,
        D: null,
        t0: 0,
        grupo: new THREE.Group,
        voz: null,
        sub: viejo?.sub || "",
        alfa: viejo?.alfa ?? 1,
        cargando: true,
        terminada: false,
        viejo: viejo
      };
      yo.grupo.name = "media demo " + nombre;
      let D;
      try {
        D = await api.cine.abrir(n);
      } catch (e) {
        console.warn("media demo", n, e.message);
        yo.cargando = false;
        soltar(viejo);
        yo.viejo = null;
        return;
      }
      if (md !== yo) {
        api.cine.liberar(D);
        return;
      }
      soltar(viejo);
      yo.viejo = null;
      M.escena.add(yo.grupo);
      const off = api.DS?.demos?.["ie/d_" + String(n).padStart(3, "0")]?.desplazar || [ 0, 0, 0 ];
      yo.grupo.position.copy(aMundo(off)).negate();
      for (const ent of D.personajes) {
        if (!ent.obj) continue;
        const id = ent.p?.id;
        const esHenry = /^Henry/.test(api.PC?.personajes?.[String(id)]?.nombre || "");
        ent.obj.grupo.visible = !esHenry && (!personajes || personajes.includes(id));
        yo.grupo.add(ent.obj.grupo);
      }
      if (yo.alfa < 1) opacidad(yo.grupo, yo.alfa);
      yo.D = D;
      yo.t0 = performance.now();
      yo.cargando = false;
      const adx = ADX[n];
      if (adx) {
        yo.voz = sonar(adx, null, {
          volumen: 1,
          loop: false
        });
        volumenMando(yo.voz, 0);
      }
    }
    const _p = new THREE.Vector3, _q = new THREE.Quaternion, _s = new THREE.Vector3, _m = new THREE.Matrix4;
    function cuadro() {
      const x = md;
      if (!x?.D || x.terminada) return;
      const D = x.D, t = (performance.now() - x.t0) / 1e3 * FPS;
      if (t >= D.sqt.n - 1) {
        x.terminada = true;
        alTerminar?.(x.n);
        return;
      }
      const S = D.muestrear(t, true), luces = lucesDelJuego(D.sqt, S);
      for (const ent of D.personajes) {
        if (!ent.obj || !ent.obj.grupo.visible) continue;
        const po = S.poses[ent.i], hs = ent.obj.huesos;
        if (ent.uniformsLuz) aplicarLucesPersonaje(ent.uniformsLuz, luces, po.tiene[0] ? new THREE.Vector3(-po.pos[0] * E, -po.pos[1] * E, po.pos[2] * E) : null, null);
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
      const ph = posHenry(), d = distXZ(ph, pos);
      const k = Math.max(0, Math.min(1, (2e3 - d) / (2e3 - 300))) * x.alfa;
      volumenMando(x.voz, k);
      const f = Math.floor(t);
      const txt = k > .35 && juego.opciones?.subtitulos !== false ? (D.subs || []).filter(s => f >= s.ini && f < s.fin).map(s => s.texto).join("\n") : "";
      if (txt !== x.sub) {
        x.sub = txt;
        api.mostrarSub(txt);
      }
    }
    function quitar() {
      const x = md;
      if (!x) return;
      md = null;
      soltar(x);
      if (x.sub) api.mostrarSub("");
    }
    return {
      iniciar: iniciar,
      cuadro: cuadro,
      quitar: quitar,
      get actual() {
        return md;
      },
      get n() {
        return md?.n ?? null;
      },
      get cargando() {
        return !!md?.cargando;
      },
      ponerAlfa(a) {
        if (!md) return;
        md.alfa = Math.max(0, a);
        opacidad(md.grupo, md.alfa);
      },
      ocultar(si) {
        if (md) md.grupo.visible = !si;
      }
    };
  }
  const ADX = {
    318: null,
    319: 30211,
    320: 30212,
    321: null,
    327: 30258
  };
  const walter = (() => {
    let presente = false, choque = null;
    const W = () => DD?.walter || {
      pos: [ 1030, -1730, 634 ],
      radio_choque: 85,
      alto_choque: 255
    };
    const md = crearMediaDemo({
      nombre: "(Walter en ie01)",
      pos: [ 1030, -1730, 634 ],
      personajes: [ 318, 513 ],
      alTerminar: () => {
        if (!F(1108)) md.iniciar(318); else {
          prender(1147);
          prender(1218);
          md.iniciar(321);
        }
      }
    });
    function entrar() {
      presente = false;
      if (F(1203) || F(1108)) return;
      presente = true;
      md.iniciar(318);
      const w = W(), col = api.colision;
      if (col) {
        const g = new THREE.CylinderGeometry(w.radio_choque * E, w.radio_choque * E, (w.alto_choque || 255) * E, 12, 1, true);
        choque = new THREE.Mesh(g, new THREE.MeshBasicMaterial({
          visible: false,
          side: THREE.DoubleSide
        }));
        choque.name = "choque de Walter (FUN_004cd300)";
        choque.position.copy(aMundo(w.pos));
        choque.position.y += (w.alto_choque || 255) * E / 2;
        choque.updateMatrixWorld(true);
        col.add(choque);
      }
    }
    async function hablarle() {
      if (!presente || md.cargando) return null;
      if (!F(1108)) {
        prender(1108);
        await md.iniciar(319);
      } else if (F(1145)) await md.iniciar(320);
      return null;
    }
    function salir() {
      if (presente && F(1108)) {
        prender(1146);
        prender(1147);
        prender(1218);
      }
      presente = false;
      md.quitar();
      if (choque) {
        choque.removeFromParent();
        choque.geometry.dispose();
        choque = null;
      }
    }
    return {
      entrar: entrar,
      salir: salir,
      hablarle: hablarle,
      cuadro: () => presente && md.cuadro(),
      get presente() {
        return presente;
      },
      md: md
    };
  })();
  const nino = (() => {
    let presente = false, sono = false, desvanecer = false, alfa = 1, hecho = false;
    const vale = () => !F(1108) && !F(1197) && F(1101);
    const N = () => DD?.nino || {
      pos: [ -291, -100, 3827 ],
      cerca: 500,
      baja_por_cuadro: .00125
    };
    const md = crearMediaDemo({
      nombre: "(Walter de chico en ie24)",
      pos: [ -291, -100, 3827 ],
      personajes: [ 303 ],
      alTerminar: () => {
        sono = true;
        if (alfa > 0) md.iniciar(327);
      }
    });
    function entrar() {
      presente = false;
      sono = false;
      desvanecer = false;
      alfa = 1;
      hecho = false;
      if (!vale()) return;
      presente = true;
      md.iniciar(327);
    }
    function cuadro(dt) {
      if (!presente) return;
      md.cuadro();
      if (md.actual && !md.cargando && md.actual.D && performance.now() - md.actual.t0 > 300) sono ||= true;
      if (!desvanecer && sono && distXZ(posHenry(), N().pos) < N().cerca) desvanecer = true;
      if (desvanecer && alfa > 0) {
        alfa -= FPS * N().baja_por_cuadro * dt * FPS;
        if (alfa <= 0) {
          alfa = 0;
          md.quitar();
          presente = false;
          hecho = true;
          return;
        }
        md.ponerAlfa(alfa);
      }
    }
    function salir() {
      presente = false;
      md.quitar();
    }
    function revisar() {
      if (!presente && !hecho && vale()) entrar();
    }
    return {
      entrar: entrar,
      cuadro: cuadro,
      salir: salir,
      revisar: revisar,
      md: md,
      get presente() {
        return presente;
      },
      get alfa() {
        return alfa;
      }
    };
  })();
  const asesino = (() => {
    let pj = null, i = -1, vuelta = 0;
    async function entrar() {
      const yo = ++vuelta;
      quitar();
      vuelta = yo;
      if (F(1120) || F(1203)) return;
      try {
        const A = DD?.asesino || {
          pos: [ 630, 0, -236 ],
          rot: 1.5708
        };
        const p = await modelo("ev_killer.bin", 1, 0, 2);
        if (yo !== vuelta || escena !== 17) return;
        p.ubicar(A.pos[0], A.pos[1], A.pos[2], A.rot ?? Math.PI / 2);
        p.grupo.name = "Walter en el 207 (ev_killer.bin)";
        api.cont.add(p.grupo);
        pj = p;
        i = -1;
      } catch (err) {
        console.warn("Walter del 207", err.message);
      }
    }
    function cuadro(dt) {
      if (!pj) return;
      pj.actualizar?.(dt);
      if (F(1120) && i < 0) i = 0;
      if (i >= 0) {
        i += dt * FPS;
        const a = (Math.min(i, 30) / 30 - 1) ** 2;
        opacidad(pj.grupo, a);
        if (i >= 30) quitar();
      }
    }
    function quitar() {
      if (pj) {
        pj.grupo.removeFromParent();
        pj.dispose?.();
        pj = null;
      }
    }
    return {
      entrar: entrar,
      cuadro: cuadro,
      quitar: quitar,
      get pj() {
        return pj;
      }
    };
  })();
  const papeles = (() => {
    let lista = [], vuelta = 0;
    const T = () => DD?.papeles || [];
    async function entrar() {
      const yo = ++vuelta;
      quitar();
      vuelta = yo;
      prender(1167);
      for (const f of T()) {
        try {
          const pj = await modelo(f.modelo[0], f.modelo[1], f.texturas[1]);
          if (yo !== vuelta || escena !== 24) {
            pj.dispose?.();
            return;
          }
          pj.ubicar(f.pos[0], f.pos[1], f.pos[2], f.rot || 0);
          pj.grupo.name = `papel rojo ${f.k} (ie24 objeto ${f.objeto})`;
          api.cont.add(pj.grupo);
          lista.push({
            f: f,
            pj: pj
          });
        } catch (err) {
          console.warn("papel", f.k, err.message);
        }
      }
      cuadro();
    }
    function cuadro() {
      for (const {f: f, pj: pj} of lista) pj.grupo.visible = F(f.bandera) && !tieneNota(f.nota);
    }
    const algunoVisible = () => T().some(f => F(f.bandera) && !tieneNota(f.nota));
    function quitar() {
      for (const x of lista) {
        x.pj.grupo.removeFromParent();
        x.pj.dispose?.();
      }
      lista = [];
    }
    async function poner(item) {
      const fila = (DD?.poner_papel?.filas || [ [ 66, 1168 ], [ 67, 1169 ], [ 71, 1170 ], [ 72, 1171 ], [ 73, 1172 ] ]).find(([k]) => k === item);
      if (!fila || F(fila[1]) || !F(1102) || !cuantos(item)) return false;
      await M.fundir(1, .4);
      prender(fila[1]);
      cuadro();
      await M.fundir(0, .4);
      await decir([ h0(item === 66 || item === 67 ? 74 : 75) ]);
      henry.inventario?.quitar(item);
      return true;
    }
    return {
      entrar: entrar,
      cuadro: cuadro,
      quitar: quitar,
      poner: poner,
      algunoVisible: algunoVisible,
      get lista() {
        return lista;
      }
    };
  })();
  let partesCache = {};
  function partesPorBandera() {
    const pone = (k, v) => {
      const g = partesCache[k] !== undefined ? partesCache[k] : partesCache[k] = parteSala(k);
      if (g && g.visible !== v) g.visible = v;
    };
    if (escena === 1) {
      pone(6, !F(1148));
      pone(5, F(1148));
    }
    if (escena === 5) {
      pone(6, !F(1124));
      pone(5, F(1124));
    }
    if (escena === 24) pone(6, F(1127) || F(1556) && cuantos(ITEM.LLAVE_MUNECA) > 0);
  }
  async function abrirConFundido(sonido, henryA = null) {
    await M.fundir(1, 8 / FPS);
    sonar(sonido);
    partesPorBandera();
    if (henryA) api.ubicarHenry(henryA.pos, henryA.rot);
    await M.esperar(.2);
    await M.fundir(0, 8 / FPS);
  }
  const telefono = (() => {
    let h = null, luz = null, cuadros = 0, acum = 0;
    function entrar() {
      parar(h, .1);
      h = null;
      luz = null;
      cuadros = 0;
      if (escena === 14) luz = api.cont.children.find(c => /^objeto 1 \(ie14\.bin\)/.test(c.name || "")) || null;
      if (escena === 14 && F(1116) && !F(1117)) h = sonar(SON.TELEFONO, DD?.telefono?.pos || [ 344, -186, 112 ], {
        volumen: 1,
        loop: true
      });
    }
    function cuadro(dt = 0) {
      if (h && F(1117)) {
        parar(h, .2);
        h = null;
      }
      if (luz) {
        acum += dt;
        while (acum >= 1 / FPS) {
          acum -= 1 / FPS;
          cuadros++;
        }
        luz.visible = !(F(1116) && !F(1117) && cuadros % 4 === 0);
      }
    }
    return {
      entrar: entrar,
      cuadro: cuadro,
      parar: () => {
        parar(h, .2);
        h = null;
      },
      get sonando() {
        return !!h;
      }
    };
  })();
  let voz2280 = null;
  function zonasIe24() {
    if (escena !== 24) return;
    const p = posHenry(), c = [ -245, 0, 1100 ], llave = F(1556) && cuantos(ITEM.LLAVE_MUNECA) > 0;
    if (voz2280) {
      if (distXZ(p, c) > 1e3) {
        parar(voz2280, .5);
        voz2280 = null;
        terminar(2280);
      }
      return;
    }
    if (!F(1203) && F(1197) && !llave && distXZ(p, c) <= 600) {
      prender(1218);
      voz2280 = sonar(SON.VOZ_2280, c, {
        volumen: 1,
        loop: false
      });
    }
    if (!F(1128) && llave && distXZ(p, c) <= 330) {
      prender(1218);
      sonar(SON.LLAVE_MUNECA);
      terminar(3035);
    }
  }
  const cerraduraDe = door => (DD?.cerraduras || []).find(c => c.door === door) || null;
  async function cerradura(c, p) {
    const sonido = t => {
      try {
        api.amb?.puerta?.(p, t);
      } catch {}
    };
    const G = DD.guiones;
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
            await guion(G[c.guiones[0]]);
            return false;
          }
          if (c.item && cuantos(c.item)) {
            sonido(3);
            await guion(G[c.guiones[2]]);
            if (c.tipo === 1) henry.inventario?.quitar(c.item);
            prender(c.bandera);
            return false;
          }
          sonido(4);
          await guion(G[c.guiones[0]]);
          return false;
        }
        sonido(4);
        await guion(G[c.guiones[1]]);
        return false;
      }

     case 3:
     case 4:
      sonido(c.tipo === 3 ? 2 : 4);
      await guion(G[c.guiones[0]]);
      return false;

     case 6:
      if (F(c.bandera)) return true;
      sonido(4);
      await guion(G[c.guiones[0]]);
      return false;
    }
    return true;
  }
  async function puerta302(p) {
    if (F(1102)) for (const k of ITEM.PAPELES) if (cuantos(k) && await papeles.poner(k)) return false;
    try {
      api.amb?.puerta?.(p, 4);
    } catch {}
    const G = DD.guiones;
    await guion(cuantos(ITEM.LLAVES_APTO) ? G.puerta302_llave : papeles.algunoVisible() ? G.puerta302_papel : G.puerta302_cerrada);
    terminar(118);
    return false;
  }
  async function puerta20(p) {
    const P20 = DD?.puerta20 || {
      bandera: 2116,
      item: 77,
      mira: 1121,
      escena: 24
    };
    if (F(P20.bandera)) return true;
    if (escena !== P20.escena) return false;
    const G = DD.guiones;
    if (cuantos(P20.item)) {
      try {
        api.amb?.puerta?.(p, 3);
      } catch {}
      await guion(G.puerta20_llave);
      henry.inventario?.quitar(P20.item);
      prender(P20.bandera);
      partesPorBandera();
      return false;
    }
    try {
      api.amb?.puerta?.(p, 4);
    } catch {}
    await guion(F(P20.mira) ? G.puerta20_cerrada_1121 : G.puerta20_cerrada);
    return false;
  }
  async function taquillas() {
    const ev = i => api.eventos.find(x => x.i === i)?.ev || null;
    if (F(1148)) {
      await guion(ev(10)?.guion || [ {
        msg: 29,
        archivo: 9
      } ]);
      return null;
    }
    if (cuantos(ITEM.TAQUILLA_106)) {
      await guion(ev(9)?.guion || [ {
        msg: 28,
        archivo: 9
      } ]);
      henry.inventario?.quitar(ITEM.TAQUILLA_106);
      terminar(3046);
      await abrirConFundido(SON.TAQUILLA);
      return null;
    }
    await guion(ev(8)?.guion || [ {
      msg: 27,
      archivo: 9
    } ]);
    return null;
  }
  function otroDelLugar(o) {
    if (!o.pos) return null;
    return api.eventos.find(x => x !== o && x.pos && x.ev?.evnum && distXZ(x.pos, o.pos) < 60 && Math.abs(x.pos[1] - o.pos[1]) < 150 && vigente(x) && !(x.item && (api.PARTIDA.recogidos || []).includes(`ie/${escena}/${api.mitad}/${x.i}`))) || null;
  }
  async function ejecutarPropio(o) {
    const ev = o.ev || {};
    const ini = (ev.init || "").slice(0, 8), exe = (ev.exec || "").slice(0, 8), trg = (ev.trgchk || "").slice(0, 8);
    if (exe === "0x4d1bf0") {
      return agujeroDeVuelta({
        api: api,
        etapa: "ie",
        num: 6,
        agujeros: DD?.agujeros || AGUJEROS_IE,
        escena: escena,
        pos: posHenry(),
        rot: henry.controlador.m.cuerpo
      });
    }
    if (ini === "0x4e10f0") return walter.hablarle();
    if (escena === 1 && (trg === "0x4e2960" || trg === "0x4e29c0" || ev.evnum === 3046)) return taquillas();
    if (escena === 7 && (ev.evnum === 130 || trg === "0x4e29f0")) {
      if (!F(1115)) {
        const r = await guion(ev.guion);
        if (r && ultimaEleccion === 0) prender(1116);
        terminar(130);
      } else if (!F(1117)) await guion(api.eventos.find(x => x.i === 4)?.ev?.guion || [ {
        msg: 182,
        archivo: 9
      } ]);
      return null;
    }
    if (ev.evnum === 132) {
      const r = await guion(ev.guion);
      if (r && ultimaEleccion === 0) apagar(1153);
      terminar(132);
      telefono.cuadro();
      return null;
    }
    if (ini === "0x4e2a40") {
      const G = DD.guiones;
      await guion(F(1215) ? G.armas_despues : G.armas_primera);
      prender(1215);
      return null;
    }
    if (ev.evnum === 139) {
      await guion(ev.guion);
      terminar(ev);
      await abrirConFundido(SON.HELADERA, {
        pos: DD?.heladera?.henry || [ 515, 0, -215 ],
        rot: Math.PI
      });
      return null;
    }
    if (ev.evnum === 42) {
      prender(1612);
      return undefined;
    }
    if (!ev.evnum && ev.guion) {
      const otro = otroDelLugar(o);
      if (otro) return ejecutarPropio(otro);
    }
    if (o.item) return undefined;
    if (ev.evnum && ev.cond != null && !vigente(o)) return null;
    if (ev.guion) {
      if (await guion(ev.guion)) terminar(ev);
      return null;
    }
    return undefined;
  }
  return {
    walter: walter,
    nino: nino,
    papeles: papeles,
    asesino: asesino,
    telefono: telefono,
    inicio() {
      if (!F(1101)) return {
        ...LLEGADA
      };
      const s = api.PARTIDA.salidaMundo?.ie;
      if (s) return {
        escena: s.escena,
        pos: s.pos,
        rot: s.rot
      };
      const fila = (DD?.agujeros || AGUJEROS_IE).find(f => f.etapa === 6 && F(f.bandera));
      return fila ? {
        escena: fila.escena,
        pos: fila.pos,
        rot: fila.rot
      } : null;
    },
    async alCargarEscena(n) {
      await datos();
      if (!papelesEnganchados) {
        papelesEnganchados = true;
        engancharUsarItem(api, {
          items: ITEM.PAPELES,
          activo: () => activo && escena === 24 && F(1102),
          zonas: () => api.eventos.filter(o => /^0x4e1930/.test(o.ev?.init || "")),
          usar: async o => await papeles.poner(o.zona.dmy13) ? null : false
        });
      }
      walter.salir();
      nino.salir();
      asesino.quitar();
      papeles.quitar();
      telefono.parar();
      parar(voz2280, .3);
      voz2280 = null;
      escena = n;
      activo = true;
      partesCache = {};
      partesPorBandera();
      if (n === 1) walter.entrar();
      if (n === 24) {
        await papeles.entrar();
        nino.entrar();
      }
      if (n === 17) await asesino.entrar();
      telefono.entrar();
    },
    cuadro(dt) {
      if (!activo) return false;
      walter.cuadro();
      nino.cuadro(dt);
      asesino.cuadro(dt);
      telefono.cuadro(dt);
      if (escena === 24) {
        papeles.cuadro();
        zonasIe24();
        if (!juego.demoActual) nino.revisar();
      }
      if (escena === 1 || escena === 5 || escena === 24) partesPorBandera();
      return false;
    },
    maneja(ev) {
      if (!ev) return false;
      if (/^0x4e10f0/.test(ev.init || "")) return walter.presente;
      if (/^0x4e2a40/.test(ev.init || "")) return true;
      return false;
    },
    reemplazaObjeto(o) {
      return /^0x4e2490/.test(o.cnst || "");
    },
    llamada: llamada,
    estado() {
      const b = [ 1101, 1102, 1105, 1106, 1107, 1108, 1112, 1113, 1115, 1116, 1117, 1120, 1124, 1125, 1126, 1127, 1128, 1130, 1145, 1146, 1147, 1148, 1167, 1168, 1169, 1170, 1171, 1172, 1193, 1195, 1197, 1199, 1203, 1218, 1556, 1612, 2101, 2116 ].filter(x => F(x));
      return {
        escena: escena,
        banderas: b,
        walter: walter.presente ? walter.md.n : null,
        nino: nino.presente ? {
          demo: nino.md.n,
          alfa: +nino.alfa.toFixed(2)
        } : null,
        asesino: !!asesino.pj,
        telefono: telefono.sonando,
        voz2280: !!voz2280,
        papeles: papeles.lista.filter(x => x.pj.grupo.visible).map(x => x.f.k),
        llaves: {
          taquilla: cuantos(ITEM.TAQUILLA_106),
          superintendente: cuantos(ITEM.SUPERINTENDENTE),
          apartamento: cuantos(ITEM.LLAVES_APTO),
          muneca: cuantos(ITEM.LLAVE_MUNECA)
        },
        papelesEnMano: ITEM.PAPELES.filter(k => cuantos(k))
      };
    },
    alDemo(si) {
      walter.md.ocultar(si);
      nino.md.ocultar(si);
      if (asesino.pj) asesino.pj.grupo.visible = !si;
    },
    alSalir() {
      activo = false;
      walter.salir();
      nino.salir();
      asesino.quitar();
      telefono.parar();
      parar(voz2280, .3);
      voz2280 = null;
    },
    extras: [],
    async ejecutar(o) {
      if (o.departamentos) return undefined;
      return ejecutarPropio(o);
    },
    async antesDePuerta(p) {
      const f = (p.funcion_paso || "").slice(0, 8);
      if (f === "0x4fcd10") return puerta302(p);
      if (f === "0x4fcd40") return puerta20(p);
      const c = cerraduraDe(p.door_no);
      return !c || await cerradura(c, p);
    },
    demo: demo
  };
}
