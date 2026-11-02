// SH4 web — FeniXVOID · Project Ravenlight
import { bajar, json } from "./modo_juego/motor.js";

import { crearCine } from "./modo_juego/cine_juego.js";

import { crearManejoEileen, guardadoNuevo } from "./enemigos/eileen.js";

const ETAPA_N = {
  rl: 1,
  sb: 2,
  fr: 3,
  mz: 4,
  bd: 5,
  ie: 6,
  hs: 7,
  cm: 8,
  ls: 9,
  gt: 10,
  st: 11
};

const MODULOS = {
  sb: () => import("./modo_juego/subte2.js").then(m => m.SUBTE_2),
  fr: () => import("./modo_juego/bosque2.js").then(m => m.BOSQUE_2),
  mz: () => import("./modo_juego/prision2.js").then(m => m.PRISION_2),
  bd: () => import("./modo_juego/edificio2.js").then(m => m.EDIFICIO_2),
  ie: () => import("./modo_juego/departamentos.js").then(m => m.DEPARTAMENTOS),
  hs: () => import("./modo_juego/hospital.js").then(m => m.HOSPITAL),
  st: () => import("./modo_juego/escalera.js").then(m => m.ESCALERA).catch(() => import("./modo_juego/hospital.js").then(m => m.ESCALERA)),
  cm: () => import("./modo_juego/cm.js").then(m => m.DEPARTAMENTOS_PASADO)
};

const SALAS_DEL_MUNDO = new Set([ "fr06", "fr09", "fr20", "fr16", "ie01", "ie17", "ie24", "cm24" ]);

const ETAPAS_EILEEN = new Set([ "sb", "fr", "mz", "bd", "ie", "hs", "st", "cm" ]);

const SIEMPRE_MITAD2 = new Set([ "hs", "st", "cm" ]);

const DATOS_MUNDOS = new Set([ "bosque_datos.json", "departamentos_datos.json", "edificio_datos.json", "hospital_datos.json", "prision_datos.json", "mundos_datos.json", "datos_302.json" ]);

let fetchCorregido = false;

function corregirFetch() {
  if (fetchCorregido || typeof fetch !== "function") return;
  fetchCorregido = true;
  const previo = globalThis.fetch;
  const base = new URL("./modo_juego/", import.meta.url);
  globalThis.fetch = function(url, op) {
    try {
      const u = new URL(typeof url === "string" ? url : url?.url || "", location.href);
      const nombre = u.pathname.split("/").pop();
      if (u.origin === location.origin && DATOS_MUNDOS.has(nombre) && u.pathname === new URL("./" + nombre, location.href).pathname && !u.pathname.includes("/modo_juego/")) return previo.call(this, new URL(nombre, base).href, op);
    } catch {}
    return previo.call(this, url, op);
  };
}

export function crearMundoVivo({THREE: THREE, escena: escena, camara: camara, jugador: jugador, sala: sala, escala: escala = .005, ojos: ojos = 1.6, getColision: getColision, F: F, prender: prender, PARTIDA: PARTIDA, subs: subs, liviano: liviano = false}) {
  const aMundo = p => new THREE.Vector3(-p[0] * escala, -p[1] * escala, p[2] * escala);
  const aJuego = v => [ -v.x / escala, -v.y / escala, v.z / escala ];
  const enVR = () => !!window.sh4?.renderer?.xr?.isPresenting;
  const son = () => window.sh4?.sonido || null;
  let ESC = null, DS = null, PC = null, DJ = null;
  const datos = (async () => {
    [ESC, DS, PC, DJ] = await Promise.all([ json("/datos/escenas.json"), json("/datos/demos_salas.json"), json("/datos/personajes_cine.json"), json("/datos/demos.json") ]);
  })();
  let etapa = null, n = 0, mitad = 1, nombreSala = null, mod = null, cfgMod = null, errores = 0;
  const mods = new Map;
  let activo = true;
  const camFalsa = new THREE.PerspectiveCamera(60, 4 / 3, .02, 400), jugFalso = new THREE.Group;
  jugFalso.add(camFalsa);
  const tareas = new Set;
  const M = {
    escena: escena,
    camara: camFalsa,
    jugador: jugFalso,
    get renderer() {
      return window.sh4?.renderer;
    },
    tareas: tareas,
    enVR: enVR,
    tactil: false,
    fundir: async () => {},
    ponerVelo() {},
    esperar: async () => {},
    redibujar() {},
    anclarCapas() {},
    lookAt() {},
    pantalla: {
      g: null,
      mostrar() {},
      ocultar() {},
      actualizar() {}
    },
    cartel: {
      g: null,
      mostrar() {},
      ocultar() {}
    },
    control: {
      mirarLibre: false,
      soltar() {},
      rayos: () => []
    },
    contextoAudio: () => son()?.ctx || null
  };
  const juego = {
    fase: "visor",
    demoActual: null,
    hablando: false,
    get opciones() {
      return {
        subtitulos: subs?.activos !== false
      };
    },
    get IDIOMA() {
      return null;
    },
    textoComun: k => subs?.texto(0, k) || "",
    decir: async () => true
  };
  const fxVivo = () => {
    const f = window.sh4?.efectos;
    if (!f) return null;
    return new Proxy(f, {
      get: (t, k) => {
        if (k === "opciones") return () => t.opciones();
        if (k === "enemigos") return () => {};
        if (k === "disparar") return (...a) => particulas() ? t.disparar(...a) : null;
        const v = t[k];
        return typeof v === "function" ? v.bind(t) : v;
      }
    });
  };
  let particulas = () => true;
  const amb = {
    get son() {
      return son();
    },
    get fx() {
      return fxVivo();
    },
    puerta() {},
    demoEmpieza() {},
    demoTermina() {}
  };
  const henry = () => window.sh4?.henry || null;
  const pies = () => {
    const h = henry();
    return h ? h.personaje.grupo.position.clone() : jugador.position.clone().setY(jugador.position.y - ojos);
  };
  function empujar(dir, d) {
    if (enVR() || !dir || !(d > 0)) return;
    jugador.position.addScaledVector(dir, Math.min(d, .1));
  }
  let cine = null;
  async function prepararCine() {
    await datos;
    if (!cine) cine = crearCine({
      M: {
        escena: escena,
        camara: camara,
        enVR: enVR,
        tareas: new Set
      },
      bajar: bajar,
      DJ: DJ,
      PC: PC,
      tablaSubs: subs?.tablaSubs || [],
      mensajesPorPaquete: subs?.paquetes || {},
      mostrarSub: t => subs?.mostrar(t),
      ambienteSala: () => null
    });
    return cine;
  }
  const grupoEileen = new THREE.Group;
  grupoEileen.name = "Eileen (visor)";
  escena.add(grupoEileen);
  let posAntH = null, velH = 0, gEileen = null;
  function jugadorEileen() {
    const h = henry();
    if (!h) return {
      existe: false,
      pos: [ 0, 0, 0 ],
      rot: 0,
      estado: 1,
      vel: 0
    };
    const s = h.controlador?.s || {}, EH = h.ESTADO || {};
    let est = 1;
    if (s.muerto || s.estado === EH.MUERTE || s.estado === EH.MUERTO) est = 10; else if ([ EH.GOLPE, EH.GOLPE_FUERTE, EH.REMATE, EH.REMATE2 ].includes(s.estado)) est = 5; else if (s.estado === EH.GUARDIA) est = 4; else if (s.estado === EH.PREPARAR) est = 3;
    const g = h.personaje.grupo;
    return {
      existe: true,
      pos: aJuego(g.position),
      rot: -g.rotation.y,
      estado: est,
      vel: velH,
      tocoPuerta: false,
      escenaReal: n
    };
  }
  const eileen = crearManejoEileen({
    THREE: THREE,
    bajar: bajar,
    padre: grupoEileen,
    getColision: getColision,
    escala: escala,
    jugador: jugadorEileen,
    escena: () => ({
      etapa: ETAPA_N[etapa] ?? 0,
      escena: n ?? 0
    }),
    enemigos: () => window.sh4?.enemigos?.enemigos || [],
    golpearEnemigo: (e, golpe, o) => window.sh4?.enemigos?.recibirGolpe?.(e, undefined, golpe, o),
    sonido: (id, pos, op) => {
      try {
        return son()?.efecto?.(id, pos ? aMundo(pos) : null, op) || null;
      } catch {
        return null;
      }
    },
    mostrarSub: (t, alfa = 1) => subs?.mostrar(t && alfa > .35 ? t : "", alfa),
    maldicionEn: () => 0,
    empujarHenry: () => {}
  });
  const rayo = new THREE.Raycaster;
  function lugarCerca() {
    const h = henry(), g = h.personaje.grupo, r = -g.rotation.y, p = aJuego(g.position), col = getColision();
    for (const [dx, dz] of [ [ 0, -120 ], [ -100, -40 ], [ 100, -40 ], [ 0, 120 ] ]) {
      const x = Math.cos(r) * dx + Math.sin(r) * dz, z = -Math.sin(r) * dx + Math.cos(r) * dz;
      const d = new THREE.Vector3(-x, 0, z), L = d.length() * escala;
      if (!col) return [ p[0] + x, p[1], p[2] + z ];
      rayo.set(g.position.clone().add(new THREE.Vector3(0, .9, 0)), d.normalize());
      rayo.far = L + .3;
      if (!rayo.intersectObject(col).some(i => Math.abs(i.face.normal.y) < .6)) return [ p[0] + x, p[1], p[2] + z ];
    }
    return p;
  }
  async function ponerEileen({pos: pos = null, rot: rot = null} = {}) {
    const h = henry();
    if (!h) return null;
    gEileen ||= guardadoNuevo();
    Object.assign(gEileen, {
      estado: 1,
      etapa: ETAPA_N[etapa] ?? 0,
      escena: n
    });
    const r = rot ?? -h.personaje.grupo.rotation.y;
    try {
      await eileen.poner({
        pos: pos || lugarCerca(),
        rot: r,
        guardado: gEileen
      });
    } catch (e) {
      console.warn("[visor] Eileen", e.message);
      return null;
    }
    if (window.sh4?.enemigos) window.sh4.enemigos.eileen = eileen;
    return eileen.actual;
  }
  function quitarEileen() {
    eileen.quitar();
    subs?.mostrar("");
    if (window.sh4?.enemigos?.eileen === eileen) window.sh4.enemigos.eileen = null;
  }
  const api = {
    THREE: THREE,
    M: M,
    juego: juego,
    get henry() {
      return henry();
    },
    get enemigos() {
      return window.sh4?.enemigos || {
        enemigos: []
      };
    },
    get cine() {
      return cine;
    },
    cont: sala,
    amb: amb,
    PARTIDA: PARTIDA,
    get DS() {
      return DS;
    },
    get PC() {
      return PC;
    },
    F: F,
    prender: prender,
    decir: async () => true,
    texto: (a, k) => subs?.texto(a, k) || "",
    mostrarSub: t => subs?.mostrar(t),
    bajar: bajar,
    aMundo: aMundo,
    aJuego: aJuego,
    pies: pies,
    ubicarHenry() {},
    ejecutar: async () => null,
    empujar: empujar,
    irA: async () => null,
    get vista() {
      return henry()?.modo || "1ra";
    },
    objetosEscena: k => (mitad === 2 ? ESC?.etapas?.[etapa]?.objetos_segunda_mitad : ESC?.etapas?.[etapa]?.objetos)?.[String(k)] || [],
    eventosCrudos: () => [],
    get eventos() {
      return [];
    },
    get colision() {
      return getColision();
    },
    get mitad() {
      return mitad;
    },
    get escena() {
      return n;
    },
    eileen: eileen,
    darItem() {},
    soltarItem() {},
    eileenConHenry: () => !!eileen.actual?.conHenry(),
    ponerEileen: o => ponerEileen(o),
    dejarEileen() {
      const a = eileen.actual;
      if (a) a.w.finEstado = 1;
    },
    eileenConmigo() {
      const a = eileen.actual;
      if (a) {
        a.w.finEstado = 2;
        a.g.estado = 1;
      }
    }
  };
  const conHenry = api;
  async function moduloDe(et) {
    if (!MODULOS[et]) return null;
    if (!mods.has(et)) {
      mods.set(et, (async () => {
        corregirFetch();
        const cfg = await MODULOS[et]();
        await datos;
        await prepararCine();
        if (!henry()) return null;
        const m = cfg?.crear ? cfg.crear(conHenry) : null;
        return m ? {
          cfg: cfg,
          m: m
        } : null;
      })().catch(e => {
        console.warn("[visor] el código del mundo", et, e);
        mods.delete(et);
        return null;
      }));
    }
    return mods.get(et);
  }
  async function esperarHenry(ms) {
    for (let t = 0; t < ms && !henry(); t += 250) await new Promise(r => setTimeout(r, 250));
    return !!henry();
  }
  let filtro = null;
  async function preparar(nombre, {mitad: mi = 1, usar: usar = true} = {}) {
    const et = String(nombre).slice(0, 2);
    const viejo = mod;
    filtro = null;
    if (etapa !== et && viejo) {
      try {
        viejo.m.alSalir?.();
      } catch (e) {
        console.warn("[visor] alSalir", e.message);
      }
      tareas.clear();
    }
    if (etapa !== et) {
      quitarEileen();
      gEileen = null;
    }
    etapa = et;
    nombreSala = nombre;
    mod = null;
    cfgMod = null;
    errores = 0;
    await datos;
    n = +(Object.entries(ESC?.etapas?.[et]?.salas || {}).find(([, s]) => s === String(nombre).slice(0, 4))?.[0] ?? 0);
    activo = usar && !!MODULOS[et];
    if (!activo) return null;
    if (!henry()) await esperarHenry(12e3);
    const r = await moduloDe(et);
    if (!r || nombreSala !== nombre) return null;
    mod = r;
    cfgMod = r.cfg;
    mitad = cfgMod.mitad ?? mi;
    const m = r.m;
    filtro = {
      reemplaza: o => {
        try {
          return !!m.reemplazaObjeto?.(o);
        } catch {
          return false;
        }
      },
      visible: o => {
        try {
          return m.objetoVisible ? m.objetoVisible(o) !== false : true;
        } catch {
          return true;
        }
      },
      ajustar: (o, pj) => {
        try {
          m.ajustarObjeto?.(o, pj);
        } catch {}
      }
    };
    return filtro;
  }
  async function alCargarSala(nombre, {mundo: mundo = true, eileen: conEileen = true, particulas: part = true} = {}) {
    particulas = () => part;
    quitarEileen();
    if (nombre !== nombreSala) return;
    if (mundo && mod?.m) {
      if (n) await (subs?.prepararEtapa(etapa));
      try {
        await (mod.m.alCargarEscena?.(n, {}));
      } catch (e) {
        console.warn("[visor] el mundo", etapa, n, e);
      }
      if (etapa === "sb" && n === 1 && mitad === 1 && F(302) && (F(330) || !F(304)) && !F(331)) {
        try {
          await (mod.m.ejecutar?.({
            i: -1,
            ev: {
              evnum: 74,
              cond: "siempre"
            }
          }));
        } catch (e) {
          console.warn("[visor] Cynthia", e.message);
        }
      }
    }
    if (conEileen && ETAPAS_EILEEN.has(etapa) && (mitad === 2 || SIEMPRE_MITAD2.has(etapa)) && !eileen.actual) {
      if (await esperarHenry(12e3) && nombre === nombreSala) await ponerEileen();
    }
  }
  function salir() {
    quitarEileen();
    posAntH = null;
  }
  const cubre = nombre => !!(mod?.m && SALAS_DEL_MUNDO.has(String(nombre).slice(0, 4)));
  const entradaVacia = {
    teclas: {},
    acciones: [],
    ejes: {}
  };
  function actualizar(dt) {
    let hay = false;
    if (dt <= 0) return false;
    if (mod?.m && errores < 20) {
      try {
        if (mod.m.cuadro?.(dt)) hay = true;
      } catch (e) {
        if (++errores === 1 || errores === 20) console.warn("[visor] cuadro del mundo", etapa, e);
      }
      for (const t of [ ...tareas ]) {
        try {
          if (t(dt, entradaVacia)) hay = true;
        } catch (e) {
          if (++errores === 1) console.warn("[visor] tarea del mundo", e);
        }
      }
    }
    if (eileen.actual) {
      const h = henry();
      if (h) {
        const p = h.personaje.grupo.position;
        if (posAntH) {
          velH = posAntH.distanceTo(p) / escala / Math.max(dt * 30, .001);
          posAntH.copy(p);
        } else posAntH = p.clone();
      }
      eileen.actualizar(dt);
      hay = true;
    }
    return hay;
  }
  return {
    preparar: preparar,
    alCargarSala: alCargarSala,
    salir: salir,
    actualizar: actualizar,
    cubre: cubre,
    ponerEileen: ponerEileen,
    quitarEileen: quitarEileen,
    get filtro() {
      return filtro;
    },
    get modulo() {
      return mod?.m || null;
    },
    get eileen() {
      return eileen.actual;
    },
    eileenManejo: eileen,
    estado() {
      let m = null;
      try {
        m = mod?.m?.estado?.() || null;
      } catch {}
      let e = null;
      try {
        e = eileen.actual?.estado() || null;
      } catch {}
      return {
        etapa: etapa,
        escena: n,
        mitad: mitad,
        modulo: !!mod?.m,
        mundo: m,
        eileen: e ? {
          paso: e.paso,
          conHenry: e.conHenry,
          pos: e.pos
        } : null,
        errores: errores
      };
    }
  };
}
