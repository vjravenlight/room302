// SH4 web — FeniXVOID · Project Ravenlight
import { partesBin } from "../lib/sh4bin.js";

import { leerModelo } from "../lib/modelo.js";

import { leerTexturas, aRGBA } from "../lib/texturas.js";

import { leerAnimacion } from "../lib/animacion.js";

import { crearPersonaje } from "../lib/personaje.js";

import { leerHuesos, nuevaPose } from "../lib/sqt.js";

import { crearRand } from "./comun.js";

import * as AC from "./p_agua_chispas.js";

import * as GH from "./p_gotas_humo.js";

import { crearFantasmaPared, DEMO47_FANTASMA } from "./fantasma_pared.js";

import { crearVelasDemo, crearObjetoJefe, crearCharcoJefe, VELAS_CM065 } from "./objetos_demo.js";

export const INICIO_ETAPA = [ 1, 9, 19, 30, 34, 40 ];

export const FIN_ETAPA = {
  6: 1179,
  17: 520,
  21: 880,
  33: 510,
  37: 828
};

export const DESPERTAR = [ 45, 54, 57, 62, 63, 79, 87, 150 ];

export const VENTILADORES = {
  rl00_0: {
    sala: "rl00",
    arch: "event_rl00.bin",
    m: 5,
    t: 6,
    a: [ "event_rl00_cmn.bin", 19 ]
  },
  rl00_2: {
    sala: "rl00",
    arch: "event_rl00_cmn.bin",
    m: 17,
    t: 18,
    a: [ "event_rl00_cmn.bin", 19 ]
  },
  rl01_0: {
    sala: "rl01",
    arch: "event_rl01.bin",
    m: 2,
    t: 3,
    a: [ "event_rl01_cmn.bin", 2 ]
  },
  rl01_1: {
    sala: "rl01",
    arch: "event_rl01.bin",
    m: 4,
    t: 5,
    a: [ "event_rl01_cmn.bin", 2 ]
  },
  rl01_2: {
    sala: "rl01",
    arch: "event_rl01_cmn.bin",
    m: 0,
    t: 1,
    a: [ "event_rl01_cmn.bin", 2 ]
  }
};

export const VENTILADOR_DE = {
  47: "rl00_2",
  48: "rl00_0",
  50: "rl00_0",
  55: "rl00_0",
  54: "rl01_0",
  57: "rl01_0",
  79: "rl01_0",
  74: "rl01_0",
  87: "rl01_1",
  45: "rl01_2",
  62: "rl01_2",
  63: "rl01_2",
  150: "rl01_por_sala"
};

const rango = (a, b) => Array.from({
  length: b - a + 1
}, (_, i) => a + i);

export const AGUJERO = [ 46, ...rango(101, 130), ...rango(140, 149) ];

export const MIRILLA = [ 56, 58, 59, 61, 64, 75, ...rango(131, 139) ];

export const GOLPES = {
  58: [ 68, 72, 82, 90, 95, 122, 127, 137, 147, 168, 178, 187, 202, 208, 218, 248, 259, 451, 461, 471, 479, 519, 528, 555, 599, 1347 ],
  59: [ 348, 353, 360, 370, 380, 410, 414, 423, 434, 454, 464, 475, 488, 494, 504, 535, 548, 817, 823, 830, 840, 850, 877, 884, 894, 904, 1677, 1518, 1528, 1542, 1548, 1558, 1588, 1598 ]
};

export const OKIMONO = {
  66: [ {
    arch: "event_rl04_l.bin",
    m: 0,
    t: 1,
    pos: [ 0, 0, 0 ],
    fuente: "DemoEventInitRL066 0x509500"
  } ],
  67: [ {
    arch: "mz33.bin",
    m: 6,
    t: 5,
    pos: [ 0, -390, -2080 ],
    fuente: "DemoEventInitMZ067 0x5085c0"
  } ],
  26: [ {
    arch: "st_spi00.bin",
    m: 0,
    t: 1,
    a: [ "st_spi00.bin", 2 ],
    pos: [ 230, -1670, -150 ],
    giroY: -1.57,
    fuente: "DemoEventInitCM026 0x507f00"
  } ],
  65: [ {
    arch: "event_cm.bin",
    m: 0,
    t: 1,
    pos: [ 222.588, -190.49, 1594.97 ],
    quat: [ .42037, .36715, -.66214, .50006 ],
    fuente: "DemoEventInitCM065 0x507fa0"
  } ],
  19: [ [ -100, 0, 4760, 2.3 ], [ 200, 0, 4440, -3 ], [ 60, 0, 2450, -.1 ] ].map(([x, y, z, g]) => ({
    arch: "enemy_hyena.bin",
    m: 1,
    t: 0,
    a: [ "enemy_hyena.bin", 43 ],
    pos: [ x, y, z ],
    giroY: g,
    fuente: "DemoEventInitIE019 0x507b40"
  })),
  25: [ [ 16, 12, 17, [ 0, 0, 1138.42 ] ], [ 18, 13, 19, [ 0, 0, 3837.8 ] ], [ 20, 14, 21, [ 0, 0, 7712.4 ] ], [ 22, 15, 23, [ -2108.27, 0, -5.146 ] ] ].map(([m, t, a, pos], i) => ({
    arch: "cm24.bin",
    m: m,
    t: t,
    a: [ "cm24.bin", a ],
    pos: pos,
    colorFijo: 83 / 128,
    fuente: `DemoEventInitCM025 0x507e50 (wall_obj ${i})`
  }))
};

export const DESTELLOS = {
  22: 331,
  23: 481,
  24: 347
};

export const PERSONAJES_EVENTO = {
  7: [ {
    id: 326,
    resta: true
  } ],
  37: [ {
    id: 303,
    alfa: f => f < 900 ? 1 : Math.max(0, (938 - f) / 38)
  } ],
  71: [ {
    id: 303,
    alfa: f => f <= 909 ? 1 : f > 938 ? 0 : 1 - (f - 909) / 30
  } ]
};

const cacheTex = new Map;

async function texturaPantalla(THREE, bajar, archivo, parte = 0) {
  const k = archivo + "#" + parte;
  if (!cacheTex.has(k)) cacheTex.set(k, (async () => {
    const buf = await bajar("data/" + archivo);
    const ps = partesBin(buf).filter(x => x.tipo === "texturas");
    const p = ps[parte] || ps[0];
    const im = leerTexturas(buf, p.ofs, p.len)[0][0];
    const t = new THREE.DataTexture(new Uint8Array(aRGBA(im)), im.ancho, im.alto, THREE.RGBAFormat);
    t.flipY = false;
    t.colorSpace = THREE.SRGBColorSpace;
    t.minFilter = t.magFilter = THREE.LinearFilter;
    t.needsUpdate = true;
    t.userData = {
      ancho: im.ancho,
      alto: im.alto
    };
    return t;
  })());
  return cacheTex.get(k);
}

export function crearEventosDemo({THREE: THREE, bajar: bajar, escala: escala = .005, modo: modo = "visor"}) {
  const enVisor = modo === "visor";
  const bins = new Map;
  const bin = a => {
    if (!bins.has(a)) {
      bins.set(a, bajar("data/" + a).then(b => ({
        b: b,
        p: partesBin(b)
      })));
      bins.get(a).catch(() => bins.delete(a));
    }
    return bins.get(a);
  };
  const QZ = (new THREE.Quaternion).setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI);
  const aThree = p => new THREE.Vector3(-p[0] * escala, -p[1] * escala, p[2] * escala);
  const _m = new THREE.Matrix4, _mi = new THREE.Matrix4, _s = (new THREE.Matrix4).makeScale(-1 / escala, -1 / escala, 1 / escala);
  async function crearOkimono(def, E) {
    const m = await bin(def.arch), M_ = m.p[def.m], T = m.p[def.t];
    const mf = def.colorFijo ? null : E?.materialOkimono?.() || null;
    const cf = def.colorFijo ? (new THREE.Color).setRGB(def.colorFijo, def.colorFijo, def.colorFijo, THREE.SRGBColorSpace) : null;
    const op = mf ? {
      material: mf.material
    } : cf ? {
      material: tex => new THREE.MeshBasicMaterial({
        map: tex,
        color: cf,
        side: THREE.DoubleSide,
        alphaTest: .3
      })
    } : undefined;
    const pj = crearPersonaje(leerModelo(m.b, M_.ofs, M_.len), T?.tipo === "texturas" ? leerTexturas(m.b, T.ofs, T.len) : [], op);
    pj.uniformsLuz = mf?.u || null;
    if (def.a) {
      const ma = await bin(def.a[0]), A = ma.p[def.a[1]];
      if (A?.tipo === "animacion") {
        pj.poner(leerAnimacion(ma.b, A.ofs, A.len));
        pj.reproductor.loop = true;
      }
    }
    if (def.pos) pj.grupo.position.copy(aThree(def.pos));
    const qj = def.quat ? new THREE.Quaternion(...def.quat).normalize() : (new THREE.Quaternion).setFromAxisAngle(new THREE.Vector3(0, 1, 0), def.giroY || 0);
    pj.grupo.children[0].quaternion.copy(QZ).multiply(qj);
    pj.grupo.name = `okimono ${def.arch} #${def.m}`;
    return pj;
  }
  function piezasDe(id, E) {
    const P = [];
    const justo = (T, f, fAnt) => fAnt < T && T <= f;
    const largo = () => E.sqt.n - 1;
    if (INICIO_ETAPA.includes(id)) P.push({
      nombre: "inicio de etapa (0x507360)",
      cuadro(E, f) {
        if (f < 200) {
          const v = 200 - Math.floor(f);
          E.pantalla.borroso = Math.round(v * .5) / 128;
          E.pantalla.nBorroso = 5;
          E.pantalla.brillo = Math.min(128, Math.round(v * .64)) / 128;
        }
      },
      fin: ruidoCero
    });
    if (FIN_ETAPA[id]) {
      const T = FIN_ETAPA[id];
      P.push({
        nombre: `fin de etapa, ${T} cuadros (0x5073f0)`,
        cuadro(E, f) {
          const L = largo(), c = Math.floor(f);
          if (c + T >= L) {
            const x = Math.round((T - L + c) / T * 128) || 1;
            E.ruido = [ Math.min(255, 48 + Math.round(.625 * x)), x, x, 0, 0 ];
          }
        },
        fin: ruidoCero
      });
    }
    if (DESPERTAR.includes(id)) P.push({
      nombre: "despertar (0x508e60)",
      cuadro(E, f) {
        const c = Math.floor(f), L = largo();
        if (c < 300) {
          const v = 300 - c;
          E.pantalla.borroso = Math.round(v / 3) / 128;
          E.pantalla.nBorroso = 5;
          E.pantalla.brillo = Math.min(128, Math.round(v * .42667)) / 128;
        }
        E.pantalla.franjas = c >= L - 32 ? Math.min(128, Math.round((L - f) * 4)) / 128 : 1;
      },
      fin: ruidoCero
    });
    if (enVisor && VENTILADOR_DE[id]) P.push({
      nombre: "ventilador",
      async preparar(E) {
        let k = VENTILADOR_DE[id];
        const s = E.sala || "";
        if (k === "rl01_por_sala") k = /^rl01[cd]/.test(s) ? "rl01_2" : /^rl01b/.test(s) ? "rl01_1" : "rl01_0";
        const def = VENTILADORES[k];
        if (!def || !s.startsWith(def.sala)) return;
        const pj = await crearOkimono(def, E);
        E.padre.add(pj.grupo);
        E.objetos.push(pj);
      }
    });
    for (const def of OKIMONO[id] || []) P.push({
      nombre: "okimono " + def.arch,
      async preparar(E) {
        const pj = await crearOkimono(def, E);
        E.padre.add(pj.grupo);
        E.objetos.push(pj);
      }
    });
    if (AGUJERO.includes(id) || MIRILLA.includes(id)) {
      const puerta = MIRILLA.includes(id);
      P.push({
        nombre: puerta ? "mirilla (0x508bb0)" : "agujero (0x508e40)",
        async preparar(E) {
          if (enVisor) E.texMascara = await texturaPantalla(THREE, bajar, puerta ? "doorscope.bin" : "peephole.bin");
        },
        cuadro(E) {
          if (enVisor) E.pantalla.mascara = {
            tipo: puerta ? "puerta" : "agujero",
            tex: E.texMascara
          };
        }
      });
    }
    if (GOLPES[id]) {
      const rnd = crearRand(id), signos = GOLPES[id].map(() => [ rnd.f() < .5 ? -1 : 1, rnd.f() < .5 ? -1 : 1 ]);
      P.push({
        nombre: "golpes en la puerta",
        cuadro(E, f) {
          const c = Math.floor(f);
          let zoom = 0, dy = 0;
          GOLPES[id].forEach((k, i) => {
            if (c >= k) zoom += signos[i][0] * .06 * .5 ** (c - k + 1);
            if (c >= k + 1) dy += signos[i][1] * 10 * .5 ** (c - k);
          });
          E.pantalla.sacudida = {
            zoom: zoom,
            dy: dy
          };
        }
      });
    }
    if (DESTELLOS[id]) {
      const t0 = DESTELLOS[id];
      P.push({
        nombre: "destellos demo022_flash (0x507c00)",
        async preparar(E) {
          E.texDestellos = await Promise.all([ 0, 1, 2 ].map(k => texturaPantalla(THREE, bajar, "demo022_flash.bin", k)));
        },
        cuadro(E, f) {
          const k = Math.floor((f - t0) / 8);
          E.pantalla.destello = f >= t0 && k < 3 ? {
            tex: E.texDestellos[k],
            a: 1
          } : null;
        }
      });
    }
    for (const pe of PERSONAJES_EVENTO[id] || []) P.push({
      nombre: `personaje ${pe.id} ${pe.resta ? "restando" : "con alfa"}`,
      preparar(E) {
        const ent = E.personajes.find(x => x.p?.id === pe.id && x.obj);
        if (!ent) return;
        E.mats ||= [];
        for (const ma of ent.obj.mallas) {
          const m = ma.material;
          E.mats.push({
            m: m,
            antes: {
              blending: m.blending,
              transparent: m.transparent,
              opacity: m.opacity,
              depthWrite: m.depthWrite,
              eq: m.blendEquation,
              src: m.blendSrc,
              dst: m.blendDst
            }
          });
          if (pe.resta) {
            m.blending = THREE.CustomBlending;
            m.blendEquation = THREE.ReverseSubtractEquation;
            m.blendSrc = THREE.SrcAlphaFactor;
            m.blendDst = THREE.OneFactor;
            m.transparent = true;
            m.depthWrite = false;
          } else m.transparent = true;
          m.needsUpdate = true;
        }
        pe.ent = ent;
      },
      cuadro(E, f) {
        if (!pe.alfa || !pe.ent) return;
        const a = pe.alfa(f);
        for (const ma of pe.ent.obj.mallas) {
          ma.material.opacity = a;
          ma.visible = a > 0;
        }
      },
      fin(E) {
        if (pe.ent) for (const ma of pe.ent.obj.mallas) ma.visible = true;
        for (const {m: m, antes: antes} of E.mats || []) {
          m.blending = antes.blending;
          m.transparent = antes.transparent;
          m.opacity = antes.opacity;
          m.depthWrite = antes.depthWrite;
          m.blendEquation = antes.eq;
          m.blendSrc = antes.src;
          m.blendDst = antes.dst;
          m.needsUpdate = true;
        }
        E.mats = [];
      }
    });
    if (id === 47 && enVisor) P.push({
      nombre: "d_047: grietas, manchas, hilos, ruido y difuminado",
      preparar(E) {
        if (!E.fx) return;
        E.fantasma = crearFantasmaPared({
          THREE: THREE,
          raiz: E.fx.raiz
        });
        E.fantasma.cargar();
        const k = E.sqt.modelos.findIndex(m => m.id === DEMO47_FANTASMA.personaje);
        const pose = k >= 0 ? nuevaPose(E.sqt.modelos[k]) : null;
        let fp = -1;
        E.huesos47 = (cuadro, h) => {
          if (!pose) return null;
          const f = Math.max(0, Math.min(E.sqt.n - 1, cuadro));
          if (f !== fp) {
            leerHuesos(E.sqt, E.sqt.modelos[k], f, pose);
            fp = f;
          }
          return pose.tiene[h] ? [ pose.pos[h * 3], pose.pos[h * 3 + 1], pose.pos[h * 3 + 2] ] : null;
        };
      },
      reiniciar(E) {
        if (!E.fx) return;
        E.fx.disparar("grietas_demo47");
        E.fantasma?.iniciar(DEMO47_FANTASMA, E.huesos47);
      },
      cuadro(E, f) {
        E.fantasma?.irA(f);
        const co = E.fx?.estado?.niebla;
        if (co !== undefined) E.fantasma?.niebla(co, escala);
        const c = Math.floor(f), L = largo();
        if (c + 1700 >= L) {
          const v = Math.trunc((c - L + 1700) * .0754) || 1;
          E.ruido = [ v, v, v, 0, v ];
        }
        if (c >= 200) {
          E.pantalla.borroso = Math.min(c - 200, 50) / 128;
          E.pantalla.nBorroso = 16;
        }
      },
      fin(E) {
        E.fantasma?.limpiar();
        E.fx?.grietas?.limpiar?.();
        ruidoCero(E);
      }
    });
    if (id === 17) P.push({
      nombre: "Jasper en llamas (0x507840)",
      reiniciar(E) {
        E.fuegoJasper = false;
      },
      cuadro(E, f, fAnt) {
        if (!E.fx) return;
        const ent = E.personajes.find(x => x.p?.id === 309 && x.obj);
        if (!ent) return;
        const huesos = n => huesoEnRaiz(E, ent.obj.huesos[n]);
        if (!E.fuegoJasper) {
          E.fx.disparar("jasper", {
            huesos: huesos,
            modo: "cuerpo"
          });
          E.fuegoJasper = true;
        }
        if (justo(950, f, fAnt)) E.fx.disparar("jasper", {
          huesos: huesos,
          modo: "mas"
        });
        if (justo(1045, f, fAnt)) E.fx.disparar("jasper", {
          huesos: huesos,
          modo: "piso"
        });
      }
    });
    if (id === 18) P.push({
      nombre: "vela de FR018 (0x5078f0)",
      reiniciar(E) {
        E.fx?.disparar("vela", {
          n: 1,
          pos: [ -239.285, -313.935, -678.08 ],
          alto: 200,
          ancho: 40,
          demo: true
        });
      }
    });
    if (id === 37) P.push({
      nombre: "silla eléctrica (0x507260 / 0x507280)",
      reiniciar(E) {
        if (E.fx) crearFx(E, AC.sillaChispas(E.rand));
      },
      cuadro(E, f, fAnt) {
        if (!E.fx) return;
        if (justo(377, f, fAnt) || justo(378, f, fAnt)) crearFx(E, AC.sillaChispasHenry());
        if (justo(580, f, fAnt)) crearFx(E, GH.humoRichard());
        if (justo(1570, f, fAnt)) {
          crearFx(E, GH.humoRichard());
          crearFx(E, GH.humoRichard());
        }
      }
    });
    if (id === 33) P.push({
      nombre: "agua de mz39 (0x432bf0)",
      reiniciar(E) {
        E.fx?.disparar("agua_mz39");
      }
    });
    if (id === 67) P.push({
      nombre: "pileta y compuertas (0x5085c0 / 0x508640)",
      reiniciar(E) {
        E.fx?.disparar("ondas_pileta");
      },
      cuadro(E, f, fAnt) {
        if (E.fx && [ 150, 165, 180 ].some(T => justo(T, f, fAnt))) E.fx.disparar("compuertas", {
          demo: true
        });
      }
    });
    if (id === 88) P.push({
      nombre: "pileta y torre (0x508680)",
      reiniciar(E) {
        E.fx?.disparar("ondas_pileta");
        E.fx?.disparar("olas_torre");
      }
    });
    if (id === 65) P.push({
      nombre: "20 velas (0x545990)",
      async preparar(E) {
        const v = await crearVelasDemo({
          THREE: THREE,
          bajar: bajar,
          escala: escala,
          posiciones: VELAS_CM065
        });
        E.padre?.add(v.grupo);
        E.objetos.push(v);
      }
    });
    if (id === 69 || id === 70) {
      const cortes = id === 69 ? [ [ 530, 0 ], [ 1700, 1 ], [ 1840, 0 ], [ 2300, 1 ], [ 2355, 0 ] ] : [ [ 250, 0 ] ];
      const prendido = f => {
        let s = 1;
        for (const [T, v] of cortes) if (f >= T) s = v;
        return s === 1;
      };
      P.push({
        nombre: `objeto y charco del jefe (0x4e4b10 / 0x4319c0), cortes ${cortes.map(c => c[0]).join(", ")}`,
        async preparar(E) {
          const o = await crearObjetoJefe({
            THREE: THREE,
            bajar: bajar,
            escala: escala,
            materialOkimono: E.materialOkimono
          });
          const c = await crearCharcoJefe({
            THREE: THREE,
            bajar: bajar,
            escala: escala
          });
          E.padre?.add(o.grupo, c.grupo);
          E.objetos.push(o, c);
          E.charco = c;
        },
        cuadro(E, f) {
          E.charco?.prender(prendido(Math.floor(f)));
        }
      });
    }
    return P;
  }
  function ruidoCero(E) {
    E.ruido = null;
  }
  function crearFx(E, e) {
    if (Array.isArray(e)) for (const x of e) crearFx(E, x); else if (e) E.fx.motor.crear(e);
  }
  function huesoEnRaiz(E, h) {
    if (!h) return null;
    _mi.copy(E.fx.raiz.matrixWorld).invert();
    return _m.copy(_s).invert().multiply(_mi).multiply(h.matrixWorld);
  }
  async function preparar(id, {sqt: sqt, personajes: personajes = [], padre: padre = null, fx: fx = null, sala: sala = "", materialOkimono: materialOkimono = null} = {}) {
    const E = {
      id: +id,
      sqt: sqt,
      personajes: personajes,
      padre: padre,
      fx: fx,
      sala: sala,
      materialOkimono: materialOkimono,
      objetos: [],
      rand: crearRand(id),
      fAnt: -1,
      ruido: null,
      pantalla: pantallaVacia(),
      piezas: []
    };
    E.piezas = piezasDe(+id, E);
    for (const p of E.piezas) {
      try {
        await (p.preparar?.(E));
      } catch (e) {
        console.warn("evento de la demo", id, p.nombre, e.message);
      }
    }
    E.nombres = E.piezas.map(p => p.nombre);
    return E;
  }
  const pantallaVacia = () => ({
    borroso: 0,
    nBorroso: 5,
    brillo: 0,
    franjas: null,
    mascara: null,
    sacudida: null,
    destello: null
  });
  function cuadro(E, t, dt = 0) {
    if (!E) return null;
    if (!E.iniciado || t < E.fAnt - .5) {
      if (E.iniciado) limpiarFx(E);
      for (const p of E.piezas) {
        try {
          p.reiniciar?.(E);
        } catch (e) {
          console.warn("evento", E.id, p.nombre, e.message);
        }
      }
      E.iniciado = true;
      E.fAnt = -1;
    }
    E.pantalla = pantallaVacia();
    const ruidoAntes = E.ruido;
    E.ruido = null;
    for (const p of E.piezas) {
      try {
        p.cuadro?.(E, t, E.fAnt, dt);
      } catch (e) {
        console.warn("evento", E.id, p.nombre, e.message);
      }
    }
    for (const o of E.objetos) o.actualizar?.(dt);
    if (E.fx) {
      if (E.ruido) E.fx.disparar("ruido", {
        valores: E.ruido
      }); else if (ruidoAntes) E.fx.disparar("ruido", {
        valores: null
      });
    }
    E.fAnt = t;
    return E.pantalla;
  }
  function limpiarFx(E) {
    if (!E.fx) return;
    try {
      E.fx.motor?.limpiar?.();
      E.fx.fuegos?.limpiar?.();
      E.fx.agua?.detener?.();
      E.fx.grietas?.limpiar?.();
      E.fantasma?.limpiar?.();
    } catch (e) {
      console.warn(e);
    }
  }
  function parar(E) {
    if (!E) return;
    for (const p of E.piezas) {
      try {
        p.fin?.(E);
      } catch (e) {
        console.warn("evento", E.id, p.nombre, e.message);
      }
    }
    if (E.fx) {
      try {
        E.fx.disparar("ruido", {
          valores: null
        });
      } catch {}
    }
    limpiarFx(E);
    E.pantalla = pantallaVacia();
    E.iniciado = false;
    E.ruido = null;
  }
  function terminar(E) {
    if (!E) return;
    parar(E);
    for (const o of E.objetos) {
      o.grupo.removeFromParent();
      o.dispose?.();
    }
    E.objetos = [];
  }
  return {
    preparar: preparar,
    cuadro: cuadro,
    parar: parar,
    terminar: terminar,
    tieneEventos: id => piezasDe(+id, {
      sqt: null,
      personajes: []
    }).length > 0
  };
}
