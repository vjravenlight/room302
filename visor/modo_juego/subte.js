// SH4 web — FeniXVOID · Project Ravenlight
import { crearManejoCynthia, NOMBRE_PASO as NOMBRE_PASO_CYN } from "../enemigos/cynthia.js";

import { partesBin } from "../lib/sh4bin.js";

import { leerModelo } from "../lib/modelo.js";

import { leerTexturas } from "../lib/texturas.js";

import { leerAnimacion } from "../lib/animacion.js";

import { crearPersonaje } from "../lib/personaje.js";

import { lucesDelJuego, aplicarLucesPersonaje } from "../lib/luz_cine.js";

import { vozMediaDemo, volumenMediaDemo, camaraJuego } from "./voz_media.js";

const PI2 = Math.PI / 2;

const LD = {
  ONESIDE: 0,
  ITEM: 1,
  ITEM_NO_GASTA: 2,
  ROTA: 3,
  CERRADA: 4,
  CONDICION: 5,
  MENSAJE: 6
};

export const PUERTAS_TRABADAS_SB = [ [ 1, LD.ONESIDE, 2118, 19, {
  c: 19
}, {
  c: 22
} ], ...[ 4, 7, 5, 6, 37, 38 ].map(d => [ d, LD.CONDICION, 314, 0 ]), ...[ 50, 69, 51, 52, 53, 54 ].map(d => [ d, LD.CONDICION, 1130, 1 ]), ...[ 62, 67, 63, 64, 65, 66 ].map(d => [ d, LD.CONDICION, 314, 1, 1130, 0 ]), ...[ 9, 32, 11, 12, 19 ].map(d => [ d, LD.CONDICION, 311, 0 ]), [ 32, LD.ONESIDE, 2117, 11, {
  c: 19
}, {
  c: 22
} ], ...[ 55, 56, 57, 58, 59 ].map(d => [ d, LD.CONDICION, 311, 1 ]), [ 56, LD.ONESIDE, 2117, 11, {
  c: 19
}, {
  c: 22
} ], ...[ 34, 43, 44 ].map(d => [ d, LD.CONDICION, 336, 0 ]), ...[ 60, 61, 68 ].map(d => [ d, LD.CONDICION, 336, 1 ]), [ 70, LD.ITEM, 2127, 20, {
  c: 18
}, {
  c: 22
}, {
  i: 274
}, 93 ], [ 85, LD.CONDICION, 338, 1 ], ...[ 71, 72, 73, 74, 75, 76, 77, 78, 79, 81, 82, 83, 84 ].map(d => [ d, LD.CERRADA, {
  c: 21
} ]) ];

export const ESCALERAS = {
  3001: {
    ang: PI2,
    cinta: 100,
    palanca: 0
  },
  3002: {
    ang: PI2,
    palanca: .9
  },
  3005: {
    ang: PI2,
    cinta: 100
  },
  3006: {
    ang: PI2,
    cinta: 100
  },
  3007: {
    ang: -PI2,
    cinta: 100
  },
  3008: {
    ang: -PI2,
    cinta: 100
  },
  3009: {
    ang: -PI2,
    palanca: .9
  },
  3010: {
    ang: -PI2,
    cinta: 100,
    palanca: 0
  }
};

const SON_ESCALERA = 51300;

const EIL_84 = {
  eil: [ [ 260, 0, -106 ], [ -180, 0, -430 ] ],
  eilRot: [ 0, Math.PI ]
};

const MOLINETES = {
  84: {
    moneda: true,
    msj: 67,
    pos: [ [ 130, 0, 50 ], [ -250, 0, -600 ] ],
    rot: [ 0, Math.PI ],
    ...EIL_84
  },
  173: {
    moneda: true,
    msj: 67,
    pos: [ [ 130, 0, 50 ], [ -250, 0, -600 ] ],
    rot: [ 0, Math.PI ],
    ...EIL_84
  },
  177: {
    moneda: false,
    msj: 68,
    pos: [ [ 130, 0, 50 ], [ -250, 0, -600 ], [ 150, 0, 1e3 ], [ -300, 0, 1600 ] ],
    rot: [ 0, Math.PI, Math.PI, 0 ],
    eil: [ [ 260, 0, -106 ], [ -180, 0, -430 ], [ 25, 0, 1135 ], [ -120, 0, 1490 ] ],
    eilRot: [ 0, Math.PI, Math.PI, 0 ]
  }
};

const TEXTOS_CODIGO = {
  "0x4ef2a0": (F, prender, mitad) => {
    if (!F(341)) {
      prender(341);
      return {
        s: 62
      };
    }
    return {
      s: mitad === 2 ? 42 : 63
    };
  },
  "0x4ef3b0": (F, p, mitad) => ({
    s: mitad === 2 ? 55 : 54
  }),
  "0x4ef380": F => F(332) ? {
    c: 23
  } : {
    s: 47
  },
  "0x4ef3e0": (F, p, mitad) => ({
    s: mitad === 2 ? 61 : 56
  })
};

const MEDIA_DEMO = {
  demos: [ 300, 301, 302 ],
  pos: [ 597, 0, -2993 ],
  cerca: 300,
  lejos: 2e3
};

const VOZ_16 = {
  id: 30259,
  subs: [ [ 22, 3 ], [ 23, 2 ], [ 24, 5 ], [ 25, 3 ], [ 26, 2 ], [ 27, 3 ] ]
};

export const SUBTE = {
  etapa: "sb",
  nombre: {
    s: "Mundo del Metro",
    e: "Subway World"
  },
  inicio: {
    escena: 1
  },
  terminado: 315,
  banderasAlLlegar: [],
  banderasAtajo: [ 301, 302, 1526 ],
  despues: {
    8: {
      pos: [ -9950, 0, 0 ],
      rot: 1.5708
    },
    10: {
      demos: [ 4 ],
      pos: [ 410, 0, -1825 ],
      rot: -1.5708
    }
  },
  demoAlAzar: {},
  molinetes: [],
  sinHacer: [ 3001, 3002, 3003, 3004, 3005, 3006, 3007, 3008, 3009, 3010, 3011, 3012 ],
  fin: {
    evnum: 17,
    escena302: 2
  },
  variantes: [],
  puertas: {},
  excluir: (o, escena) => escena === 1 && o.item && o.pos && Math.abs(o.pos[2] - 85) < 1 && o.pos[0] <= -6700 && o.pos[0] >= -8900,
  crear: api => crearSubte(api)
};

function crearSubte(api) {
  const {THREE: THREE, M: M, juego: juego, henry: henry, F: F, prender: prender, decir: decir} = api;
  const son = () => api.amb?.son || null;
  const L = juego.IDIOMA || "s";
  const texto = m => (m.c != null ? juego.textoComun?.(m.c) : m.i != null ? api.texto(1, m.i) : api.texto(5, m.s)) || "";
  const aMundo = api.aMundo, aJuego = api.aJuego;
  const posHenry = () => aJuego(api.pies());
  const dirVisor = ang => new THREE.Vector3(-Math.sin(ang), 0, Math.cos(ang));
  let escena = 0, sonidos = [], cinta = null, modelosExtra = [], escaleraLarga = [];
  let mediaDemo = null, voz = null, soltada = null;
  const cyn = crearManejoCynthia({
    THREE: THREE,
    bajar: api.bajar,
    padre: api.cont,
    getColision: () => api.colision,
    escala: .005,
    escena: () => escena,
    jugador: () => {
      const g = henry.personaje.grupo;
      return {
        existe: true,
        pos: aJuego(g.position),
        rot: -g.rotation.y
      };
    },
    sonido: (id, pos) => {
      try {
        son()?.efecto?.(id, pos ? aMundo(pos) : null);
      } catch {}
    }
  });
  const extraCyn = {
    tipo: "CYNTHIA",
    id: "CYNTHIA",
    radio: 70,
    alto: 330,
    sinSangre: true,
    cond: 0,
    get pj() {
      return cyn.actual?.pj;
    },
    get pos() {
      return cyn.actual?.pos || [ 0, 0, 0 ];
    },
    caido: () => false,
    intocable: () => !cyn.actual || cyn.actual.parada,
    recibir: g => cyn.actual?.golpe(g?.dir)
  };
  const existeCynthia = () => (F(330) || !F(304)) && !F(331);
  function sonar(id, posJuego = null, op = {}) {
    try {
      return son()?.efecto?.(id, posJuego ? aMundo(posJuego) : null, op) || null;
    } catch {
      return null;
    }
  }
  function pararSonidos() {
    for (const h of sonidos) {
      try {
        h?.parar?.(.3);
      } catch {}
    }
    sonidos = [];
  }
  const bins = new Map;
  const bin = a => {
    if (!bins.has(a)) bins.set(a, api.bajar("data/" + a).then(b => ({
      b: b,
      p: partesBin(b)
    })));
    return bins.get(a);
  };
  async function modeloDe(arch, pm, pt, panim = null) {
    const m = await bin(arch), Mp = m.p[pm], T = m.p[pt];
    const pj = crearPersonaje(leerModelo(m.b, Mp.ofs, Mp.len), T?.tipo === "texturas" ? leerTexturas(m.b, T.ofs, T.len) : []);
    if (panim != null) {
      const A = m.p[panim];
      if (A?.tipo === "animacion") {
        pj.poner(leerAnimacion(m.b, A.ofs, A.len));
        pj.reproductor.loop = true;
      }
    }
    return pj;
  }
  async function ponerModelosExtra(n) {
    for (const x of modelosExtra) {
      x.grupo.removeFromParent();
      x.dispose?.();
    }
    modelosExtra = [];
    escaleraLarga = [];
    const vuelta = escena;
    try {
      if (n === 2) {
        for (const [pm, z] of [ [ 9, -1913.738 ], [ 10, -1534.324 ] ]) {
          const pj = await modeloDe("sb02.bin", pm, 8);
          if (vuelta !== escena) {
            pj.dispose?.();
            return;
          }
          pj.ubicar(-480.18, -422.853, z, 0);
          pj.grupo.name = "puerta del baño (sb02)";
          api.cont.add(pj.grupo);
          modelosExtra.push(pj);
        }
      }
      if (n === 13) {
        for (const [pa, pb, pt, pan, z] of [ [ 6, 8, 14, 12, -179.179 ], [ 5, 7, 13, 11, 175.545 ] ]) {
          const B = await modeloDe("sb13.bin", pb, pt, pan);
          if (vuelta !== escena) {
            B.dispose?.();
            return;
          }
          B.ubicar(1992.22, 1143.267, z, 0);
          B.grupo.visible = true;
          B.mallas.forEach(x => {
            x.visible = false;
          });
          api.cont.add(B.grupo);
          modelosExtra.push(B);
          const escalones = [];
          for (let i = 0; i < 14; i++) {
            const A = await modeloDe("sb13.bin", pa, pt);
            if (vuelta !== escena) {
              A.dispose?.();
              return;
            }
            A.grupo.matrixAutoUpdate = false;
            api.cont.add(A.grupo);
            modelosExtra.push(A);
            escalones.push(A);
          }
          escaleraLarga.push({
            B: B,
            escalones: escalones
          });
        }
      }
    } catch (e) {
      console.warn("modelos del subte", e.message);
    }
  }
  const _m = new THREE.Matrix4, _p = new THREE.Vector3, _q = new THREE.Quaternion, _s = new THREE.Vector3;
  function actualizarEscaleraLarga(dt) {
    for (const {B: B, escalones: escalones} of escaleraLarga) {
      B.actualizar(dt);
      B.grupo.updateMatrixWorld(true);
      escalones.forEach((A, i) => {
        const h = B.huesos[i];
        if (!h) return;
        _m.multiplyMatrices(B.contenedor.matrixWorld, h.matrix);
        _m.decompose(_p, _q, _s);
        A.grupo.matrix.copy(api.cont.matrixWorld.clone().invert().multiply(_m).multiply(A.contenedor.matrix.clone().invert()));
        A.grupo.matrixWorldNeedsUpdate = true;
      });
    }
  }
  async function empezarMediaDemo() {
    if (mediaDemo) return;
    const md = mediaDemo = {
      n: MEDIA_DEMO.demos[Math.floor(Math.random() * 3)],
      D: null,
      t0: 0,
      grupo: new THREE.Group,
      voz: null,
      sub: ""
    };
    md.grupo.name = "media demo (Cynthia en el andén)";
    M.escena.add(md.grupo);
    await cargarMediaDemo(md);
  }
  async function cargarMediaDemo(md) {
    let D;
    try {
      D = await api.cine.abrir(md.n);
    } catch (e) {
      console.warn("media demo", md.n, e.message);
      return;
    }
    if (mediaDemo !== md) {
      api.cine.liberar(D);
      return;
    }
    if (md.D) api.cine.liberar(md.D);
    const off = api.DS?.demos?.["sb/d_" + String(md.n).padStart(3, "0")]?.desplazar || [ 0, 0, 0 ];
    md.grupo.position.copy(aMundo(off)).negate();
    for (const ent of D.personajes) {
      if (!ent.obj) continue;
      const esHenry = /^Henry/.test(api.PC?.personajes?.[String(ent.p.id)]?.nombre || "");
      ent.obj.grupo.visible = !esHenry;
      md.grupo.add(ent.obj.grupo);
    }
    md.D = D;
    md.t0 = performance.now();
    md.voz?.parar(.1);
    md.voz = vozMediaDemo(son(), md.n, volumenMediaDemo(camaraJuego(THREE, M.camara, aJuego), MEDIA_DEMO.pos, MEDIA_DEMO.cerca, MEDIA_DEMO.lejos));
  }
  const _pp = new THREE.Vector3, _qq = new THREE.Quaternion, _ss = new THREE.Vector3, _mm = new THREE.Matrix4;
  function cuadroMediaDemo() {
    const md = mediaDemo;
    if (!md?.D) return;
    const D = md.D, t = Math.min(D.sqt.n - 1, (performance.now() - md.t0) / 1e3 * 30);
    if (t >= D.sqt.n - 1 && (!md.voz || md.voz.terminada)) {
      let n = md.n + (Math.random() < .5 ? 1 : 2);
      if (n > 302) n -= 3;
      md.n = n;
      md.D = null;
      cargarMediaDemo(md).catch(e => console.warn("media demo del andén", e));
      api.cine.liberar(D);
      return;
    }
    const S = D.muestrear(t, true);
    const luces = lucesDelJuego(D.sqt, S);
    for (const ent of D.personajes) {
      if (!ent.obj || !ent.obj.grupo.visible) continue;
      const po = S.poses[ent.i], hs = ent.obj.huesos;
      if (ent.uniformsLuz) aplicarLucesPersonaje(ent.uniformsLuz, luces, po.tiene[0] ? new THREE.Vector3(-po.pos[0] * .005, -po.pos[1] * .005, po.pos[2] * .005) : null, null);
      for (let h = 0; h < hs.length; h++) {
        if (po.tiene[h]) {
          _pp.fromArray(po.pos, h * 3);
          _qq.fromArray(po.rot, h * 4);
          _ss.fromArray(po.esc, h * 3);
          hs[h].matrix.compose(_pp, _qq, _ss);
        } else {
          const pa = ent.padres[h];
          if (pa >= 0 && pa < h) hs[h].matrix.multiplyMatrices(hs[pa].matrix, _mm.copy(ent.bind[pa]).invert()).multiply(ent.bind[h]); else hs[h].matrix.copy(ent.bind[h]);
        }
        hs[h].matrixWorldNeedsUpdate = true;
      }
    }
    md.voz?.fijar(volumenMediaDemo(camaraJuego(THREE, M.camara, aJuego), MEDIA_DEMO.pos, MEDIA_DEMO.cerca, MEDIA_DEMO.lejos));
    const k = volumenMediaDemo(posHenry(), MEDIA_DEMO.pos, MEDIA_DEMO.cerca, MEDIA_DEMO.lejos);
    const f = Math.floor(t);
    const txt = k > .35 && juego.opciones?.subtitulos !== false ? D.subs.filter(s => f >= s.ini && f < s.fin).map(s => s.texto).join("\n") : "";
    if (txt !== md.sub) {
      md.sub = txt;
      api.mostrarSub(txt);
    }
  }
  function pararMediaDemo() {
    const md = mediaDemo;
    if (!md) return;
    mediaDemo = null;
    md.voz?.parar(.2);
    md.voz = null;
    if (md.D) api.cine.liberar(md.D);
    md.grupo.removeFromParent();
    if (md.sub) api.mostrarSub("");
  }
  async function voz16() {
    if (voz) return;
    voz = {
      h: sonar(VOZ_16.id, null, {
        volumen: 1,
        loop: false
      })
    };
    const yo = voz;
    for (const [m, s] of VOZ_16.subs) {
      if (voz !== yo) return;
      if (juego.opciones?.subtitulos !== false) api.mostrarSub(api.texto(5, m));
      await M.esperar(s);
    }
    if (voz === yo) {
      api.mostrarSub("");
      voz = null;
    }
  }
  function dentro(o, pj) {
    const z = o.zona || {}, p = o.pos;
    if (!p) return false;
    if (z.dmy1 === 2 && z.caja) return Math.abs(pj[0] - p[0]) <= z.caja[0] / 2 && Math.abs(pj[2] - p[2]) <= z.caja[2] / 2 && Math.abs(pj[1] - p[1]) <= Math.max(z.caja[1], 400);
    return Math.hypot(pj[0] - p[0], pj[2] - p[2]) <= (z.radio || 100) && Math.abs(pj[1] - p[1]) <= 400;
  }
  const trabas = door => PUERTAS_TRABADAS_SB.filter(t => t[0] === door);
  const cumpleCondicion = t => {
    for (let i = 2; i + 1 < t.length; i += 2) if (t[i] && (F(t[i]) ? 1 : 0) !== t[i + 1]) return false;
    return true;
  };
  const existePuerta = p => trabas(p.door_no).every(t => t[1] !== LD.CONDICION || cumpleCondicion(t));
  return {
    inicio() {
      if (!F(301)) return null;
      const c = juego.dias302?.checkpoint?.();
      if (c?.etapa === "sb") return {
        escena: c.escena,
        pos: c.pos,
        rot: c.rot
      };
      const s = api.PARTIDA.salidaMundo?.sb;
      return s ? {
        escena: s.escena,
        pos: s.pos,
        rot: s.rot
      } : {
        escena: 3,
        pos: [ 395, 0, -432 ],
        rot: -PI2
      };
    },
    async alCargarEscena(n) {
      escena = n;
      cinta = null;
      soltada = null;
      pararSonidos();
      pararMediaDemo();
      if (voz) {
        api.mostrarSub("");
        voz = null;
      }
      cyn.quitar();
      if (n === 1 && !F(302)) {
        try {
          await cyn.poner({
            parada: true,
            pos: [ -850, 0, 65 ],
            rot: 1.5
          });
        } catch (e) {
          console.warn("Cynthia", e.message);
        }
      }
      for (const o of api.objetosEscena(n)) {
        if (o.dmy8 && !F(o.dmy8)) continue;
        if (o.cnst === "0x4edec0" && o.pos) sonidos.push(sonar(SON_ESCALERA, o.pos, {
          loop: true,
          radio: 4e3
        }));
        if (o.cnst === "0x4edf20") sonidos.push(sonar(SON_ESCALERA, null, {
          loop: true
        }));
      }
      await ponerModelosExtra(n);
    },
    objetoVisible(o) {
      if (o.dmy8 && !F(o.dmy8)) return false;
      if (o.dmy9 && F(o.dmy9)) return false;
      if (o.rend === "0x4ee870" && F(329)) return false;
      return true;
    },
    reemplazaObjeto: o => o.cnst === "0x4edcd0",
    ajustarObjeto(o, pj) {
      if (o.cnst === "0x4ed7c0" && api.mitad !== 2) pj.reproductor.pausa = true;
    },
    cuadro(dt) {
      if (api.escena !== escena) {
        cinta = null;
        return false;
      }
      const c = cyn.actual;
      if (c && (c.parada && F(302) || !c.parada && !existeCynthia())) cyn.quitar();
      cyn.actualizar(dt);
      if (escaleraLarga.length) actualizarEscaleraLarga(dt);
      cuadroMediaDemo();
      const pj = posHenry();
      for (const o of api.eventosCrudos(escena)) {
        const e = ESCALERAS[o.ev?.evnum];
        if (e && dentro(o, pj) && cinta?.ev !== o.ev.evnum && soltada !== o.ev.evnum) cinta = {
          ...e,
          ev: o.ev.evnum,
          quieto: 0,
          ultima: pj
        };
      }
      if (cinta) {
        const d = Math.hypot(pj[0] - cinta.ultima[0], pj[2] - cinta.ultima[2]);
        cinta.quieto = d < 1 ? cinta.quieto + dt : 0;
        cinta.ultima = pj;
        if (cinta.quieto > 2) {
          soltada = cinta.ev;
          cinta = null;
        }
      }
      return !!(cyn.actual || mediaDemo || escaleraLarga.length);
    },
    forzar() {
      if (!cinta) return null;
      const d = dirVisor(cinta.ang);
      return {
        dir: cinta.palanca != null ? d : null,
        fuerza: cinta.palanca ?? null,
        cinta: cinta.cinta ? {
          dir: d,
          v: cinta.cinta * .005
        } : null
      };
    },
    maneja: ev => [ 74, 15, 16, 76, 84, 177 ].includes(ev?.evnum) || !!TEXTOS_CODIGO[ev?.init],
    alDemo(si) {
      if (cyn.actual) cyn.actual.pj.grupo.visible = !si;
      if (mediaDemo) mediaDemo.grupo.visible = !si;
    },
    alSalir() {
      pararSonidos();
      pararMediaDemo();
      cyn.quitar();
      cinta = null;
      if (voz) {
        api.mostrarSub("");
        voz = null;
      }
    },
    extras: [ extraCyn ],
    get cynthia() {
      return cyn.actual;
    },
    get cinta() {
      return cinta;
    },
    get mediaDemo() {
      return mediaDemo;
    },
    estado() {
      const c = cyn.actual;
      return {
        escena: escena,
        cinta: cinta?.ev ?? null,
        mediaDemo: mediaDemo ? mediaDemo.n : null,
        sonidos: sonidos.filter(Boolean).length,
        modelosExtra: modelosExtra.length,
        cynthia: c ? {
          parada: c.parada,
          paso: c.parada ? "Standing" : NOMBRE_PASO_CYN[c.paso] ?? c.paso,
          pos: c.pos.map(Math.round),
          dist: Math.round(c.w.distJ),
          vel: +c.w.vel.toFixed(2)
        } : null
      };
    },
    async ejecutar(o) {
      const ev = o.ev || {};
      if (ev.evnum === 74) {
        if (!existeCynthia()) return null;
        try {
          if (escena === 1) await cyn.poner({
            pos: [ -1675, 0, 100 ],
            rot: 1.5,
            primera: true
          }); else {
            const p = posHenry(), r = henry.controlador.m.cuerpo;
            await cyn.poner({
              pos: [ p[0] - Math.sin(r) * 150, p[1], p[2] - Math.cos(r) * 150 ],
              rot: r,
              primera: false
            });
          }
        } catch (e) {
          console.warn("Cynthia", e.message);
        }
        return null;
      }
      if (ev.evnum === 15) {
        empezarMediaDemo();
        return null;
      }
      if (ev.evnum === 16) {
        prender(312);
        voz16();
        return null;
      }
      if (ev.evnum === 76) {
        const si = await decir([ F(305) ? juego.textoComun?.(16) || "¿Entrar en el agujero?" : api.texto(5, 36) ], {
          pregunta: true
        });
        if (!si) return null;
        prender(305);
        return agujeroDeVuelta(3);
      }
      if ((ev.exec || "").startsWith("0x4d1bf0")) {
        const si = await decir([ juego.textoComun?.(16) || "¿Entrar en el agujero?" ], {
          pregunta: true
        });
        return si ? agujeroDeVuelta(escena) : null;
      }
      const mol = MOLINETES[ev.evnum];
      if (mol) return molinete(o, mol);
      const tc = TEXTOS_CODIGO[ev.init];
      if (tc) {
        await decir([ texto(tc(F, prender, api.mitad)) ]);
        return null;
      }
      return undefined;
    },
    llamada(f) {
      if (f === "0x50abe0") sonar(40006); else if (f === "0x50acb0") sonar(50308);
    },
    elegirPuerta(lista) {
      const forz = new URLSearchParams(location.search).get("vestibulo");
      if (forz) {
        const p = lista.find(x => x.lleva_a_escena === +forz);
        if (p) return p;
      }
      return lista.find(existePuerta) || null;
    },
    async antesDePuerta(p) {
      if (!existePuerta(p)) return false;
      for (const t of trabas(p.door_no)) {
        if (t[1] === LD.CONDICION) continue;
        if (t[1] === LD.CERRADA || t[1] === LD.ROTA) {
          api.amb?.puerta?.(p, t[1] === LD.ROTA ? 2 : 4);
          await decir([ texto(t[2]) ]);
          return false;
        }
        if (t[1] === LD.MENSAJE) {
          if (F(t[2])) continue;
          api.amb?.puerta?.(p, 4);
          await decir([ texto(t[3]) ]);
          return false;
        }
        if (t[1] === LD.ONESIDE) {
          if (F(t[2])) continue;
          if (escena === t[3]) {
            prender(t[2]);
            api.amb?.puerta?.(p, 3);
            await decir([ texto(t[4]) ]);
            return false;
          }
          api.amb?.puerta?.(p, 4);
          await decir([ texto(t[5]) ]);
          return false;
        }
        if (t[1] === LD.ITEM || t[1] === LD.ITEM_NO_GASTA) {
          if (F(t[2])) continue;
          if (escena === t[3]) {
            if (henry.inventario?.cuantos(t[7])) {
              prender(t[2]);
              if (t[1] === LD.ITEM) henry.inventario.quitar(t[7]);
              api.amb?.puerta?.(p, 3);
              await decir([ texto(t[6]) ]);
              return false;
            }
            api.amb?.puerta?.(p, 4);
            await decir([ texto(t[4]) ]);
            return false;
          }
          api.amb?.puerta?.(p, 4);
          await decir([ texto(t[5]) ]);
          return false;
        }
      }
      if ((p.funcion_paso || "").startsWith("0x4fd030")) {
        await decir([ api.texto(5, 43) ]);
        return false;
      }
      if (/^0x4fd(300|3b0)/.test(p.funcion_paso || "")) {
        const baja = escena !== 12;
        return !!await decir([ juego.textoComun?.(baja ? 28 : 27) || (baja ? "Es una escalera. ¿Debería bajar?" : "Es una escalera. ¿Debería subir?") ], {
          pregunta: true
        });
      }
      return true;
    }
  };
  function agujeroDeVuelta(n) {
    const cp = {
      3: [ 395, 0, -432, -PI2 ],
      10: [ 62, 0, -207, -PI2 ],
      14: [ 10532, 0, 160, -PI2 ],
      22: [ 10532, 0, 160, -PI2 ]
    }[n];
    if (cp) (api.PARTIDA.salidaMundo ||= {}).sb = {
      escena: n,
      pos: cp.slice(0, 3),
      rot: cp[3]
    };
    const r = juego.dias302?.agujeroDelMundo?.({
      etapa: "sb",
      escena: n
    }) || {
      volver302: true,
      escena302: 2
    };
    return {
      ...r,
      porAgujero: true
    };
  }
  async function molinete(o, mol) {
    const item = o.zona?.dmy13;
    if (item && !henry.inventario?.cuantos(item)) {
      const otro = api.eventos.find(x => x !== o && x.pos && o.pos && Math.hypot(x.pos[0] - o.pos[0], x.pos[2] - o.pos[2]) < 40 && !MOLINETES[x.ev?.evnum] && (x.ev?.guion || TEXTOS_CODIGO[x.ev?.init]));
      if (otro) return api.ejecutar(otro);
      await decir([ texto({
        s: 62
      }) ]);
      return null;
    }
    await decir([ api.texto(5, mol.msj) ]);
    await M.fundir(1, 1);
    sonar(mol.moneda ? 50301 : 50304);
    await M.esperar(1);
    if (mol.moneda) sonar(50304);
    const k = Math.min(o.grupo || 0, mol.pos.length - 1);
    const eilConHenry = !!api.eileenConHenry?.();
    api.ubicarHenry(mol.pos[k], mol.rot[k]);
    if (eilConHenry && api.eileen?.actual) {
      try {
        api.eileen.actual.ubicar(mol.eil?.[k] || mol.pos[k], mol.eilRot?.[k] ?? mol.rot[k]);
      } catch {}
    }
    await M.esperar(1 / 3);
    await M.fundir(0, 1);
    return null;
  }
}

export const MUNDOS = {
  sb: SUBTE,
  fr: {
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
    banderasAtajo: [],
    despues: {},
    demoAlAzar: {},
    molinetes: [],
    sinHacer: [],
    variantes: [],
    puertas: {},
    excluir: () => false
  },
  mz: {
    etapa: "mz",
    nombre: {
      s: "Prisión de Agua",
      e: "Water Prison World"
    },
    inicio: {
      escena: 1
    },
    terminado: 718,
    banderasAlLlegar: [],
    banderasAtajo: [],
    despues: {},
    demoAlAzar: {},
    molinetes: [],
    sinHacer: [],
    variantes: [],
    puertas: {},
    excluir: () => false
  },
  bd: {
    etapa: "bd",
    nombre: {
      s: "Mundo del Edificio",
      e: "Building World"
    },
    inicio: {
      escena: 1
    },
    terminado: 911,
    banderasAlLlegar: [],
    banderasAtajo: [],
    despues: {},
    demoAlAzar: {},
    molinetes: [],
    sinHacer: [],
    variantes: [],
    puertas: {},
    excluir: () => false
  }
};

export const ORDEN = [ "sb", "fr", "mz", "bd" ];
