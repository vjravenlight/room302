// SH4 web — FeniXVOID · Project Ravenlight
import * as THREE from "three";

import { q } from "./motor.js";

import { utilidades } from "./mitad2_comun.js";

import { itemsDePrueba, eileenDePrueba } from "./mitad2a_comun.js";

import { lucesDelJuego, aplicarLucesPersonaje } from "../lib/luz_cine.js";

import { FPS } from "../lib/sqt.js";

import { vozMediaDemo, volumenMediaDemo, camaraJuego } from "./voz_media.js";

const ITEM = {
  CORDON: 87,
  ZAPAPICO_ESPERANZA: 86,
  LIBRO: 154
};

const RECUERDOS = [ {
  escena: 2,
  bin: "cm02.bin",
  pos: [ 220, -180, -202.073 ],
  quat: [ 0, -.382684, 0, .92388 ],
  stream: 30251,
  subs: [ [ 165, 4 ] ],
  bandera: 1136
}, {
  escena: 10,
  bin: "cm10.bin",
  pos: [ -1440, -80, 720 ],
  quat: [ 0, .980783, 0, .19509 ],
  stream: 30252,
  subs: [ [ 166, 3.5 ] ],
  bandera: 1178
}, {
  escena: 4,
  bin: "cm04.bin",
  pos: [ -220.323, -130, -8.817 ],
  quat: [ 0, .55557, 0, .83147 ],
  stream: 30253,
  subs: [ [ 167, 4 ] ],
  bandera: 1179
}, {
  escena: 2,
  bin: "cm02.bin",
  pos: [ 60, -180, 8460 ],
  quat: [ 0, .980783, 0, -.19509 ],
  stream: 30254,
  subs: [ [ 168, 2 ] ],
  bandera: 1180
}, {
  escena: 5,
  bin: "cm05.bin",
  pos: [ -525, -100, -60 ],
  quat: [ 0, .83147, 0, .55557 ],
  stream: 30255,
  subs: [ [ 169, 5 ], [ 170, 2.5 ] ],
  bandera: 1181
}, {
  escena: 6,
  bin: "cm06.bin",
  pos: [ 400, -80, -1040 ],
  quat: [ 0, -.55557, 0, .83147 ],
  stream: 30256,
  subs: [ [ 171, 2.7 ] ],
  bandera: 1182
} ];

const EV_RECUERDO = {
  204: 0,
  205: 1,
  206: 2,
  207: 3,
  208: 4,
  209: 5
};

const CADENAS = [ [ 5, 11, 1136, [ 555.885, -645.914, -276.571 ] ], [ 6, 12, 1178, [ 508.653, -546.381, -292.433 ] ], [ 7, 13, 1179, [ 479.833, -523.11, -261.357 ] ], [ 8, 14, 1180, [ 439.48, -587.392, -280.029 ] ], [ 9, 15, 1181, [ 430.824, -613.601, -285.236 ] ], [ 10, 16, 1182, [ 459.956, -470.135, -259.109 ] ] ];

const SON = {
  FANTASMA: 52405,
  CHICO: 30257,
  CHICO_2: 20111
};

const VERSION_DEMOS = [ [ 1138, 1140 ], [ 1185, 1187 ], [ 1186, 1188 ] ];

const CHICO_CM24 = {
  demo: 328,
  centro: [ -291, -100, 3827 ],
  cerca: 500,
  desvanece: 1.25
};

const distXZ = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);

const CERRADAS = {
  28: {
    a: 11,
    m: 223
  },
  29: {
    c: 21
  },
  32: {
    c: 21
  },
  37: {
    c: 21
  },
  40: {
    c: 21
  },
  43: {
    c: 21
  },
  50: {
    c: 21
  },
  53: {
    c: 21
  },
  55: {
    c: 21
  }
};

for (const d of [ 30, 31, 33, 34, 35, 36, 38, 39, 41, 42, 44, 45, 46, 47, 48, 49, 51, 52 ]) CERRADAS[d] = {
  c: 20
};

export const DEPARTAMENTOS_PASADO = {
  etapa: "cm",
  nombre: {
    s: "Departamentos del pasado",
    e: "Apartment World (past)"
  },
  inicio: {
    escena: 21
  },
  mitad: 1,
  terminado: 0,
  mensajes: "home0",
  banderasAlLlegar: [],
  banderasAtajo: [ 917, 1173 ],
  despues: {
    55: {
      pos: [ 210, 0, 700 ]
    }
  },
  demoAlAzar: {},
  molinetes: [],
  sinHacer: [],
  fin: null,
  variantes: [],
  puertas: {},
  crear: api => crearCM(api)
};

function crearCM(api) {
  const {M: M, juego: juego, henry: henry, F: F, prender: prender, decir: decir} = api;
  const U = utilidades(api, {
    etapa: "cm",
    num: 8,
    datosJson: "./hospital_datos.json"
  });
  let escena = 0, vuelta = 0, extras = [], fantasmas = [], voz = null;
  const comun = n => juego.textoComun?.(n) || "";
  const home = n => api.texto(11, n) || "";
  const oidos = () => RECUERDOS.filter(r => F(r.bandera)).length;
  const _q = new THREE.Quaternion;
  function versionDemos() {
    const ei = api.eileen?.actual?.estado?.();
    const v = ei ? ei.maldicionVista ?? ei.maldicion ?? 0 : api.PARTIDA.eileen?.maldicion ?? 0;
    const n = v >= .7 ? 2 : v > .4 ? 1 : 0;
    for (const par of VERSION_DEMOS) for (const b of par) api.PARTIDA.banderas[b] = 0;
    for (const b of VERSION_DEMOS[n]) prender(b);
    return n;
  }
  const versionActual = () => F(1186) || F(1188) ? 2 : F(1185) || F(1187) ? 1 : 0;
  const chico = (() => {
    let a = null, pedido = 0, subAnt = "";
    const _p = new THREE.Vector3, _q = new THREE.Quaternion, _s = new THREE.Vector3, _m = new THREE.Matrix4;
    const sub = t => {
      if (t === subAnt) return;
      subAnt = t;
      try {
        api.mostrarSub(t);
      } catch {}
    };
    function poner(D, t) {
      const S = D.muestrear(t, true), L = lucesDelJuego(D.sqt, S);
      for (const ent of D.personajes) {
        if (!ent.obj) continue;
        const po = S.poses[ent.i], hs = ent.obj.huesos;
        if (ent.uniformsLuz) aplicarLucesPersonaje(ent.uniformsLuz, L, po.tiene[0] ? new THREE.Vector3(-po.pos[0] * U.E, -po.pos[1] * U.E, po.pos[2] * U.E) : null, null);
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
    const oyente = () => camaraJuego(THREE, M.camara, api.aJuego);
    function audio() {
      a.voz?.parar(.1);
      a.voz = vozMediaDemo(api.amb?.son || null, a.D.id ?? CHICO_CM24.demo, volumenMediaDemo(oyente(), CHICO_CM24.centro) * a.k);
    }
    async function entrar() {
      salir();
      const yo = ++pedido;
      const C = CHICO_CM24, h = U.posHenry();
      if (Math.hypot(h[0] - C.centro[0], h[1] - C.centro[1], h[2] - C.centro[2]) < C.cerca) return;
      try {
        const D = await api.cine.abrir(C.demo);
        if (yo !== pedido || escena !== 24) {
          api.cine.liberar?.(D);
          return;
        }
        const off = api.DS?.demos?.["cm/d_" + C.demo]?.desplazar || [ 0, 0, 0 ];
        const g = new THREE.Group;
        g.name = "media demo (el chico, cm24)";
        g.position.copy(api.aMundo(off)).negate();
        for (const ent of D.personajes) if (ent.obj) {
          ent.obj.grupo.visible = true;
          g.add(ent.obj.grupo);
        }
        api.cont.add(g);
        a = {
          D: D,
          g: g,
          t: 0,
          k: 1,
          sonando: false,
          yendose: false,
          voz: null
        };
        audio();
        poner(D, 0);
      } catch (e) {
        console.warn("cm24: el chico", e.message);
      }
    }
    function salir() {
      pedido++;
      if (!a) return;
      a.voz?.parar(.2);
      a.g.removeFromParent();
      try {
        api.cine.liberar?.(a.D);
      } catch {}
      a = null;
      sub("");
    }
    function cuadro(dt) {
      if (!a) return false;
      const C = CHICO_CM24, h = U.posHenry();
      a.t += dt;
      a.sonando = true;
      let f = a.t * FPS;
      if (f >= a.D.sqt.n - 1) {
        if (!a.voz || a.voz.terminada) {
          a.t = 0;
          f = 0;
          audio();
        } else f = a.D.sqt.n - 1;
      }
      const d = Math.hypot(h[0] - C.centro[0], h[1] - C.centro[1], h[2] - C.centro[2]);
      if (a.sonando && d < C.cerca) a.yendose = true;
      if (a.yendose) a.k = Math.max(0, a.k - dt * C.desvanece);
      if (a.k <= 0) {
        salir();
        return false;
      }
      a.voz?.fijar(volumenMediaDemo(oyente(), C.centro) * a.k);
      const v = volumenMediaDemo(h, C.centro);
      const fi = Math.floor(f);
      sub(v > .35 && a.k > .5 && juego.opciones?.subtitulos !== false ? a.D.subs.filter(x => fi >= x.ini && fi < x.fin).map(x => x.texto).join("\n") : "");
      poner(a.D, f);
      if (a.k < 1) alfaGrupo(a.g, a.k);
      return true;
    }
    return {
      entrar: entrar,
      salir: salir,
      cuadro: cuadro,
      get activo() {
        return !!a;
      },
      get k() {
        return a?.k ?? 0;
      },
      get t() {
        return a?.t ?? 0;
      }
    };
  })();
  const piezaSala = k => api.cont.children.find(c => /^sala_/.test(c.name || ""))?.getObjectByName("mundo_" + k) || null;
  function quitar() {
    for (const x of extras) {
      x.grupo.removeFromParent();
      x.dispose?.();
    }
    extras = [];
    fantasmas = [];
  }
  async function poner(arch, pm, pt, pos, quat = null, nombre = "") {
    const pj = await U.modelo(arch, pm, pt);
    pj.ubicar(pos[0], pos[1], pos[2], 0);
    if (quat) pj.grupo.children[0].quaternion.multiply(_q.set(-quat[0], -quat[1], quat[2], quat[3]).normalize());
    pj.grupo.name = nombre || arch;
    api.cont.add(pj.grupo);
    extras.push(pj);
    return pj;
  }
  function alfaGrupo(g, a) {
    g.traverse(o => {
      if (o.material) {
        o.material.transparent = a < 1;
        o.material.opacity = a;
        o.material.depthWrite = a >= 1;
      }
    });
  }
  function alfa(pj, a) {
    pj.grupo.traverse(o => {
      if (o.material) {
        o.material.transparent = a < 1;
        o.material.opacity = a;
        o.material.depthWrite = a >= 1;
      }
    });
  }
  async function armar(n, v) {
    try {
      if (n === 3) for (const [m, , b] of CADENAS) {
        const g = piezaSala(m);
        if (g) g.visible = !F(b);
      }
      for (const r of RECUERDOS) {
        if (r.escena !== n || F(r.bandera)) continue;
        if (v !== vuelta) return;
        const pj = await poner(r.bin, 5, 6, r.pos, r.quat, "recuerdo " + r.bandera);
        alfa(pj, .6);
        fantasmas.push({
          r: r,
          pj: pj,
          a: .6,
          t: 8,
          apagando: false
        });
      }
      if (n === 1) {
        const g = piezaSala(8);
        if (g) g.visible = !F(1191);
      }
    } catch (e) {
      console.warn("cm: modelos", e.message);
    }
  }
  async function hablar(stream, subs) {
    const yo = voz = {
      h: U.sonar(stream, null, {
        volumen: 1,
        loop: false
      })
    };
    for (const [m, s] of subs) {
      if (voz !== yo) return;
      if (juego.opciones?.subtitulos !== false) api.mostrarSub(home(m));
      await M.esperar(s);
    }
    if (voz === yo) {
      api.mostrarSub("");
      voz = null;
    }
  }
  return {
    inicio: () => null,
    async alCargarEscena(n) {
      escena = n;
      const v = ++vuelta;
      quitar();
      if (voz) {
        api.mostrarSub("");
        voz = null;
      }
      chico.salir();
      versionDemos();
      try {
        if (api.amb?.fx?.opciones && api.amb.fx.opciones().mitad !== 2) api.amb.fx.opciones({
          mitad: 2
        });
      } catch {}
      itemsDePrueba(api);
      await armar(n, v);
      await eileenDePrueba(api, U);
      if (n === 24 && v === vuelta) chico.entrar();
    },
    cuadro(dt) {
      const hayChico = chico.cuadro(dt);
      for (const x of extras) x.actualizar?.(dt);
      if (escena === 1) {
        const g = piezaSala(8);
        if (g) g.visible = !F(1191);
      }
      for (const f of fantasmas) {
        if (f.apagando) {
          f.a = Math.max(0, f.a - .025 * 30 * dt);
          alfa(f.pj, f.a);
          if (f.a <= 0) f.pj.grupo.visible = false;
          continue;
        }
        f.t += dt;
        if (f.t > 10) {
          f.t = 0;
          U.sonar(SON.FANTASMA, f.r.pos, {
            volumen: 1.1
          });
        }
      }
      return extras.length > 0 || hayChico;
    },
    maneja: ev => [ 203, 204, 205, 206, 207, 208, 209, 213, 55, 58, 201 ].includes(ev?.evnum) || /^0x4d1bf0/.test(ev?.exec || "") || /^0x4e6d50/.test(ev?.init || ""),
    async ejecutar(o) {
      const ev = o.ev || {};
      if (o.mitad2) return undefined;
      if (EV_RECUERDO[ev.evnum] != null) {
        const r = RECUERDOS[EV_RECUERDO[ev.evnum]];
        prender(r.bandera);
        prender(1137);
        const f = fantasmas.find(x => x.r === r);
        if (f) f.apagando = true;
        hablar(r.stream, r.subs);
        return null;
      }
      if (ev.evnum === 203) {
        if (!F(1134)) hablar(SON.CHICO, [ [ 161, 6 ], [ 162, 4 ] ]); else U.sonar(SON.CHICO_2);
        return null;
      }
      if (ev.evnum === 213) {
        if (o.zona?.dmy1 === 6) return null;
        if (F(1192) || !api.eileen?.actual && !api.PARTIDA.eileen?.estado || U.eileenCerca()) prender(1201); else api.PARTIDA.banderas[1201] = 0;
        prender(1139);
        return null;
      }
      if (ev.evnum === 55) {
        const n = [ 26, 27, 28 ][versionActual()];
        await U.demo(n);
        prender(1191);
        api.ubicarHenry([ 210, 0, 700 ], null);
        if (api.eileen?.actual) {
          try {
            api.eileen.actual.ubicar([ -18, 0, 545 ], Math.PI);
          } catch {}
        }
        quitar();
        armar(escena, ++vuelta);
        return null;
      }
      if (ev.evnum === 58) {
        await U.demo([ 22, 23, 24 ][versionActual()]);
        api.darItem(ITEM.CORDON, o);
        prender(1192);
        return null;
      }
      if (ev.evnum === 201) {
        await U.demo(25);
        prender(1131);
        if (api.eileen?.actual) {
          try {
            api.eileen.actual.ubicar([ -5.96, 0, 4411.082 ], Math.PI);
          } catch {}
          api.eileenConmigo?.();
        } else if (api.PARTIDA.eileen?.estado) await (api.ponerEileen?.({
          pos: [ -5.96, 0, 4411.082 ],
          rot: Math.PI
        }));
        return null;
      }
      if (/^0x4d1bf0/.test(ev.exec || "")) {
        const si = await decir([ comun(16) || "¿Entrar en el agujero?" ], {
          pregunta: true
        });
        if (!si) return null;
        (api.PARTIDA.salidaMundo ||= {}).cm = {
          escena: escena,
          pos: U.posHenry(),
          rot: U.rotHenry()
        };
        api.dejarEileen?.();
        const dias = juego.dias302?.agujeroDelMundo?.({
          etapa: "cm",
          escena: escena
        });
        return {
          ...dias || {
            volver302: true,
            escena302: 2
          },
          porAgujero: true
        };
      }
      return undefined;
    },
    async antesDePuerta(p) {
      const c = CERRADAS[p.door_no];
      if (c) {
        try {
          api.amb?.puerta?.(p, p.door_no === 28 || c.c === 20 ? 2 : 4);
        } catch {}
        await decir([ c.c != null ? comun(c.c) : home(c.m) ]);
        return false;
      }
      if (p.door_no === 3) {
        if (F(1139) && F(1201)) return true;
        const quedan = 6 - oidos();
        if (quedan > 0) {
          await decir([ home(quedan === 1 ? 177 : 172 + (6 - quedan)) ]);
          return false;
        }
        await decir([ home(178) || comun(26) ]);
        return false;
      }
      return true;
    },
    objetoVisible(o) {
      if (o.cnst === "0x4e5730") return false;
      return true;
    },
    alDemo(si) {
      for (const x of extras) x.grupo.visible = !si && !(fantasmas.find(f => f.pj === x)?.a <= 0);
    },
    alSalir() {
      quitar();
      if (voz) {
        api.mostrarSub("");
        voz = null;
      }
      chico.salir();
    },
    extras: [],
    estado() {
      const b = [ 917, 1131, 1134, 1136, 1137, 1139, 1142, 1173, 1174, 1175, 1176, 1178, 1179, 1180, 1181, 1182, 1191, 1192, 1201, 1207, 1210, 1211, 1212 ].filter(n => F(n));
      return {
        escena: escena,
        banderas: b,
        oidos: oidos(),
        extras: extras.map(x => x.grupo.name),
        eileen: !!api.eileen?.actual,
        versionDemos: versionActual(),
        chico: chico.activo ? {
          k: +chico.k.toFixed(2),
          t: +chico.t.toFixed(1)
        } : null
      };
    }
  };
}
