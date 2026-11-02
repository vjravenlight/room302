// SH4 web — FeniXVOID · Project Ravenlight
import { VUELTAS, evaluar } from "./modo_juego/dias_302.js";

import { FILAS } from "./modo_juego/hauntings_302.js";

import { crearCine } from "./modo_juego/cine_juego.js";

import { vozMediaDemo } from "./modo_juego/voz_media.js";

import { bajar, json, EQUIPO_CHICO } from "./modo_juego/motor.js";

import { crearCalle, horaDeVista } from "./modo_juego/ventana.js";

import { crearSubtitulos } from "./subtitulos_visor.js";

import { crearMundoVivo } from "./mundo_vivo.js";

import { crearCapaSinUsar } from "./modo_juego/escalera_sin_usar.js";

const CLAVE = "sh4visorAnimacion";

const MITAD_FIJA = new Set([ "hs", "st", "cm", "ls" ]);

const SALAS_HAUNTING = /^rl0[0-3]/;

const PERSONAJES = [ {
  sala: "sb09",
  mitad: 1,
  nombre: "Cynthia en el andén",
  media: {
    demos: [ 300, 301, 302 ],
    alAzar: true,
    centro: [ 597, 0, -2993 ]
  }
}, {
  sala: "fr06",
  mitad: 1,
  nombre: "Jasper en la roca",
  si: F => !F(507),
  media: {
    demo: F => F(504) ? 307 : 303,
    centro: [ 1541, -100, 71 ]
  }
}, {
  sala: "fr09",
  mitad: 1,
  nombre: "Jasper en el árbol",
  si: F => F(507) && !F(518),
  media: {
    demo: F => F(513) ? 316 : 310,
    centro: [ 1481, -200, 1910 ]
  }
}, {
  sala: "fr20",
  mitad: 1,
  nombre: "Jasper en la Wish House",
  si: F => !F(520),
  modelo: {
    arch: "geik.bin",
    m: 0,
    t: 1,
    a: [ "fr20.bin", 7 ],
    pos: [ -890, 0, -137.39 ],
    rot: 0
  }
}, {
  sala: "fr16",
  mitad: 2,
  nombre: "el chico (fr16)",
  si: F => !F(532),
  modelo: {
    arch: "chik.bin",
    m: 0,
    t: 1,
    a: [ "frchi.bin", 0 ],
    pos: [ 700, 0, 1300 ],
    rot: 0
  }
}, {
  sala: "mz01",
  mitad: 1,
  nombre: "Andrew (la voz)",
  si: F => !F(728),
  media: {
    demos: [ 323, 324 ],
    alAzar: true,
    centro: [ -521, -357, 1250 ]
  }
}, {
  sala: "ie01",
  mitad: 1,
  nombre: "Walter en la escalera",
  si: F => !F(1203) && !F(1108),
  media: {
    demo: 318,
    centro: [ 1030, -1730, 634 ],
    personajes: [ 318, 513 ]
  }
}, {
  sala: "ie17",
  mitad: 1,
  nombre: "Walter en el 207",
  si: F => !F(1120) && !F(1203),
  modelo: {
    arch: "ev_killer.bin",
    m: 1,
    t: 0,
    a: [ "ev_killer.bin", 2 ],
    pos: [ 630, 0, -236 ],
    rot: Math.PI / 2
  }
}, {
  sala: "ie24",
  mitad: 1,
  nombre: "Walter de chico",
  si: F => !F(1108) && !F(1197) && F(1101),
  media: {
    demo: 327,
    centro: [ -291, -100, 3827 ],
    personajes: [ 303 ],
    seVa: 500
  }
}, {
  sala: "cm24",
  mitad: null,
  nombre: "el chico (cm24)",
  media: {
    demo: 328,
    centro: [ -291, -100, 3827 ],
    seVa: 500
  }
} ];

const DIA1 = VUELTAS[1].banderas.filter(b => b > 1500);

const MOMENTOS = [ {
  id: "libre",
  nombre: "Libre (la sala elegida, sin banderas)",
  banderas: []
}, {
  id: "prologo",
  nombre: "302 · Pesadilla (prólogo)",
  banderas: []
}, {
  id: "dia1",
  nombre: "302 · Día 1 (después del prólogo)",
  banderas: DIA1
}, ...Object.entries(VUELTAS).map(([n, v]) => ({
  id: "v" + n,
  nombre: `302 · Vuelta ${n}: ${v.que}` + (v.banderas.includes(1311) ? " (hauntings)" : ""),
  banderas: v.banderas
})) ];

const DEFECTO = {
  objetos: true,
  velas: true,
  particulas: true,
  niebla: true,
  ruido: true,
  sonido: true,
  personajes: true,
  hauntings: true,
  enemigos: true,
  mundo: true,
  eileen: true,
  subtitulos: true,
  sinusar: false,
  nichos: true,
  congelar: false,
  momento: "libre",
  mitad: 1,
  extra: ""
};

const PESADO = [ "particulas", "personajes", "hauntings" ];

const CASILLAS = [ [ "objetos", "Objetos animados", "ventiladores, máquinas, la radio" ], [ "velas", "Velas", "las velas Phenom con su llama" ], [ "particulas", "Agua y humo", "partículas que arranca la sala y la niebla en capas" ], [ "niebla", "Niebla", "la niebla de la sala" ], [ "ruido", "Ruido de pantalla", "el grano del juego" ], [ "sonido", "Sonido", "ambiente, música y voces (N)" ], [ "personajes", "Personajes", "Jasper, Cynthia, Walter, el chico…" ], [ "hauntings", "Hauntings (302)", "segunda mitad: los fenómenos del departamento" ], [ "enemigos", "Enemigos", "los de la sala con su IA" ], [ "mundo", "Lo que arma cada mundo", "el código de cada mundo: Jasper en la Wish House, Cynthia en el andén, la escalera de sb13, cadenas, papeles…" ], [ "eileen", "Eileen", "segunda mitad: Eileen sigue a Henry (su IA del juego)" ], [ "subtitulos", "Subtítulos", "lo que dicen los personajes, en el idioma de Opciones" ], [ "sinusar", "Contenido sin usar", "escalera en espiral (st01–st05): las criaturas que el juego tiene y nunca pone, y los nichos numerados" ], [ "nichos", "Carteles de los nichos", "con «Contenido sin usar»: el cartelito con el número de cada nicho (chico; apagalo para fotos)" ], [ "congelar", "Congelar", "todo quieto, para las fotos" ] ];

export function iniciarEscenaViva({THREE: THREE, renderer: renderer, escena: escena, camara: camara, jugador: jugador, sala: sala, info: info, escala: escala = .005, recargar: recargar, redibujar: redibujar, getColision: getColision = () => null, ojos: ojos = 1.6}) {
  const q = new URLSearchParams(location.search);
  const aMundo = p => new THREE.Vector3(-p[0] * escala, -p[1] * escala, p[2] * escala);
  const enVR = () => !!renderer.xr.isPresenting;
  const liviano = EQUIPO_CHICO || q.has("liviano") || window.sh4?.mejorado?.estado?.preset === "quest";
  const cfg = {
    ...DEFECTO
  };
  if (liviano) for (const k of PESADO) cfg[k] = false;
  try {
    Object.assign(cfg, JSON.parse(localStorage.getItem(CLAVE) || "{}"));
  } catch {}
  cfg.congelar = false;
  if (q.has("mitad")) cfg.mitad = q.get("mitad") === "2" ? 2 : 1;
  if (q.has("momento")) {
    cfg.momento = q.get("momento");
    const m = MOMENTOS.find(x => x.id === cfg.momento);
    if (m && m.id !== "libre" && !q.has("mitad")) cfg.mitad = m.banderas.includes(1130) ? 2 : 1;
  }
  if (q.has("banderas")) cfg.extra = q.get("banderas");
  if (q.has("sinusar")) cfg.sinusar = true;
  for (const k of Object.keys(DEFECTO)) if (typeof DEFECTO[k] === "boolean" && q.has("sin" + k)) cfg[k] = false;
  const guardar = () => {
    try {
      const {congelar: congelar, ...resto} = cfg;
      localStorage.setItem(CLAVE, JSON.stringify(resto));
    } catch {}
  };
  const PARTIDA = {
    banderas: {},
    henry: {
      lugares: [],
      notas: [],
      vida: 100
    },
    inventario: [],
    reloj: 0
  };
  const momento = () => MOMENTOS.find(m => m.id === cfg.momento) || MOMENTOS[0];
  function armarBanderas() {
    const b = {};
    for (const n of momento().banderas) b[n] = 1;
    for (const n of String(cfg.extra || "").split(/[^0-9]+/).filter(Boolean)) b[+n] = 1;
    if (cfg.mitad === 2) b[1130] = 1; else delete b[1130];
    PARTIDA.banderas = b;
  }
  armarBanderas();
  const F = n => !!PARTIDA.banderas[n];
  const mitadDe = nombre => MITAD_FIJA.has(String(nombre).slice(0, 2)) ? 1 : cfg.mitad;
  const subs = crearSubtitulos({
    THREE: THREE,
    camara: camara,
    renderer: renderer
  });
  subs.activos = cfg.subtitulos;
  const mundo = crearMundoVivo({
    THREE: THREE,
    escena: escena,
    camara: camara,
    jugador: jugador,
    sala: sala,
    escala: escala,
    ojos: ojos,
    getColision: getColision,
    F: F,
    prender: n => {
      if (n) PARTIDA.banderas[n] = 1;
    },
    PARTIDA: PARTIDA,
    subs: subs,
    liviano: liviano
  });
  async function prepararMundo(nombre) {
    try {
      return await mundo.preparar(nombre, {
        mitad: mitadDe(nombre),
        usar: cfg.mundo
      });
    } catch (e) {
      console.warn("mundo", e);
      return null;
    }
  }
  const capaSU = crearCapaSinUsar({
    THREE: THREE,
    bajar: bajar,
    padre: escena
  });
  async function ponerSinUsarSala(nombre = info.sala) {
    if (!cfg.sinusar || !/^st0[1-5]/.test(nombre || "")) {
      capaSU.quitar();
      return null;
    }
    try {
      const r = await capaSU.poner(+nombre.slice(2, 4), {
        modo: q.get("sinusar") === "todas" ? "todas" : "deducido"
      });
      capaSU.verEtiquetas?.(cfg.nichos !== false && !q.has("sinnichos"));
      return r;
    } catch (e) {
      console.warn("sin usar", e);
      return null;
    }
  }
  let D302 = null;
  const d302 = json(new URL("./modo_juego/datos_302.json", import.meta.url).href).then(d => {
    D302 = d || {};
    return D302;
  });
  function varianteDe(base) {
    const V = D302?.variantes_sala;
    if (!V) return null;
    if (!F(1504)) return {
      rl00: "rl00g",
      rl01: "rl01d"
    }[base] || V.prologo?.[base]?.replace(/\.bin.*$/, "") || base + "a";
    for (const o of V.por_sala?.[base]?.orden || []) if (!o.si_bandera || F(o.si_bandera)) return o.archivo.replace(/\.bin$/, "");
    return base + "a";
  }
  const salasDelVisor = () => [ ...document.getElementById("sala")?.options || [] ].map(o => o.value);
  function salaQueToca(nombre) {
    if (cfg.momento === "libre" || !/^rl0[0-6]/.test(nombre)) return null;
    const v = varianteDe(nombre.slice(0, 4));
    return v && v !== nombre && salasDelVisor().includes(v) ? v : null;
  }
  const son = () => window.sh4?.sonido || null;
  let ganVoz = null;
  function aplicarSonido() {
    try {
      son()?.volumen({
        maestro: cfg.sonido ? 1 : 0
      });
    } catch {}
    const b = document.getElementById("silenciar");
    if (b) b.textContent = cfg.sonido ? "Silenciar" : "Con sonido";
    if (prologoPendiente && son()?.efecto) {
      const p = prologoPendiente;
      prologoPendiente = null;
      if (p.nombre === salaNombre) ponerPrologo(p.nombre, p.esc);
    }
  }
  const fx = () => window.sh4?.efectos || null;
  function opcionesEfectos(nombre = info.sala) {
    const f = fx();
    if (!f) return;
    f.opciones({
      mitad: mitadDe(nombre || ""),
      niebla: cfg.niebla,
      texFog: cfg.niebla && cfg.particulas,
      auto: cfg.particulas,
      ruido: cfg.ruido
    });
  }
  function aplicarNiebla() {
    const n = window.sh4?.niebla;
    try {
      n?.activar?.(cfg.niebla);
    } catch {}
    const c = cfg.niebla && n?.activa && info.colorFondo ? info.colorFondo : [ 0, 0, 0 ];
    escena.background = (new THREE.Color).setRGB(c[0], c[1], c[2], THREE.SRGBColorSpace);
  }
  const tareas302 = new Set;
  const M302 = {
    escena: escena,
    camara: camara,
    renderer: renderer,
    tareas: tareas302,
    enVR: enVR,
    tactil: false,
    redibujar() {},
    fundir: async () => {},
    ponerVelo() {},
    esperar: async () => {},
    pantalla: {
      mostrar() {},
      ocultar() {}
    }
  };
  let fxH = null;
  const peso = z => z.rango > 0 && z.distancia < z.rango ? (z.rango - z.distancia) / z.rango * (z.potencia || 0) : 0;
  const fx302 = () => {
    const f = fx();
    if (!f) return null;
    return fxH ||= new Proxy(f, {
      get: (t, k) => k === "enemigos" ? (l, o) => t.enemigos(Array.isArray(l) && l.length > 1 ? [ l.reduce((a, b) => peso(b) > peso(a) ? b : a) ] : l, o) : t[k]
    });
  };
  const juego302 = {
    fase: "302",
    opciones: {
      subtitulos: false
    },
    inventario302: true,
    demoActual: null,
    hablando: false,
    get ambiente() {
      return {
        fx: fx302()
      };
    }
  };
  const cuarto302 = {
    sala: null,
    escena: null,
    grupo: sala,
    puertas: [],
    crearModelo: def => window.sh4.escenaJuego.modelo(def),
    aplicarEstado: () => window.sh4.escenaJuego?.aplicarEstado(),
    cargar: async () => {},
    ponerEn() {},
    pisar() {}
  };
  const F302 = n => n === 1311 && !cfg.hauntings ? false : F(n);
  let dias = null, diasCargando = null, EV = [], ctx302 = null;
  async function iniciar302() {
    if (dias) return dias;
    if (!diasCargando) diasCargando = (async () => {
      await d302;
      EV = (D302.eventos || []).slice();
      const {crearDias302: crearDias302} = await (import("./modo_juego/dias_302.js"));
      const ctx = {
        M: M302,
        juego: juego302,
        cuarto: cuarto302,
        PARTIDA: PARTIDA,
        F: F302,
        prender: n => {
          PARTIDA.banderas[n] = 1;
        },
        decir: async () => true,
        demo: async () => {},
        mostrarSub() {},
        textoRoom: () => "",
        recargarSala() {},
        alEntrarSala() {},
        agujeroBano() {},
        radioHistoria: async () => {},
        varianteDe: b => varianteDe(b) || b + "a",
        son: son,
        eventos: () => EV,
        cumple: e => {
          const tg = dias?.TRGCHK?.[(e.funciones?.trgchk || "").slice(0, 8)];
          if (tg && !tg()) return false;
          return evaluar((e.condicion || "").match(/!?F\d+|AND|OR/g)?.join(" ") || "siempre", F302);
        }
      };
      ctx302 = ctx;
      dias = await crearDias302(ctx);
      return dias;
    })().catch(e => {
      diasCargando = null;
      throw e;
    });
    return diasCargando;
  }
  async function automaticos302() {
    const esc = String(cuarto302.escena), hechos = new Set;
    for (let k = 0; k < 8; k++) {
      const e = EV.find(x => String(x.escena) === esc && !x.pos && !x.demo && !hechos.has(x) && dias.esAutomatico(x) && x.evnum !== 3156 && !(x.funciones?.trgchk || "").startsWith("0x4da1c0") && ctx302.cumple(x));
      if (!e) break;
      hechos.add(e);
      try {
        await dias.auto(e);
      } catch (err) {
        console.warn("302 auto", e.evnum, err.message);
      }
    }
  }
  function forzarHauntings() {
    if (!dias || !cfg.hauntings || !F(1311) || !SALAS_HAUNTING.test(cuarto302.sala?.nombre || "")) return 0;
    const H = PARTIDA.hauntings, bit = 1 << +cuarto302.escena;
    let n = 0;
    for (const f of FILAS) {
      if (!(f.mascara & bit) || f.n === 5 && F(1580)) continue;
      const s = H?.pw?.[f.n];
      if (!s) continue;
      if (s.estado !== 1) dias.hauntings.empezar(f.n);
      s.reloj = 0;
      s.nivel = Math.max(s.nivel, 9e3);
      n++;
    }
    return n;
  }
  let haunting302 = 0;
  let cine = null, DJ = null, PC = null;
  async function prepararCine() {
    if (cine) return cine;
    [DJ, PC] = await Promise.all([ json("/datos/demos.json"), json("/datos/personajes_cine.json") ]);
    cine = crearCine({
      M: {
        escena: escena,
        camara: camara,
        enVR: enVR,
        tareas: new Set
      },
      bajar: bajar,
      DJ: DJ,
      PC: PC,
      tablaSubs: subs.tablaSubs,
      mensajesPorPaquete: subs.paquetes,
      mostrarSub() {},
      efectos: () => fx(),
      ambienteSala: () => {
        const l = info.luces?.find?.(x => x.tipo === 1);
        return l ? l.color.map(v => v / 255) : null;
      }
    });
    return cine;
  }
  const esHenry = id => /^Henry/.test(PC?.personajes?.[String(id)]?.nombre || "");
  const grupoPj = new THREE.Group;
  grupoPj.name = "personajes vivos";
  escena.add(grupoPj);
  let vivos = [], vueltaPj = 0;
  function quitarPersonajes() {
    vueltaPj++;
    for (const v of vivos.splice(0)) v.quitar();
  }
  function alfaGrupo(g, a) {
    g.traverse(o => {
      for (const m of [].concat(o.material || [])) {
        m.transparent = a < 1;
        m.opacity = a;
        m.depthWrite = a >= 1;
      }
    });
  }
  function vozDe(D) {
    return vozMediaDemo(son(), D.id, 0);
  }
  const posCam = () => {
    const v = camara.getWorldPosition(new THREE.Vector3);
    return [ -v.x / escala, -v.y / escala, v.z / escala ];
  };
  const distXZ = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);
  async function ponerMedia(def, yo) {
    const md = def.media, C = await prepararCine();
    const viva = {
      def: def,
      D: null,
      t: 0,
      grupo: new THREE.Group,
      voz: null,
      alfa: 1,
      yendo: false,
      n: 0,
      quitar: null
    };
    viva.grupo.name = "media demo · " + def.nombre;
    const elegir = antes => {
      if (md.demos) return md.alAzar && antes ? md.demos[(md.demos.indexOf(antes) + 1 + (Math.random() * (md.demos.length - 1) | 0)) % md.demos.length] : md.demos[Math.random() * md.demos.length | 0];
      return typeof md.demo === "function" ? md.demo(F) : md.demo;
    };
    async function abrir(n) {
      const D = await C.abrir(n);
      if (yo !== vueltaPj) {
        C.liberar(D);
        return false;
      }
      const viejo = viva.D;
      viva.grupo.clear();
      viva.grupo.position.copy(aMundo(D.off || [ 0, 0, 0 ])).negate();
      for (const ent of D.personajes) {
        if (!ent.obj) continue;
        ent.obj.grupo.visible = !esHenry(ent.p?.id) && (!md.personajes || md.personajes.includes(ent.p?.id));
        viva.grupo.add(ent.obj.grupo);
      }
      if (viejo) C.liberar(viejo);
      viva.voz?.parar();
      viva.voz = vozDe(D);
      viva.D = D;
      viva.n = n;
      viva.t = 0;
      if (viva.alfa < 1) alfaGrupo(viva.grupo, viva.alfa);
      C.posar(D, 0);
      return true;
    }
    if (!await abrir(elegir(null))) return null;
    grupoPj.add(viva.grupo);
    let cambiando = false;
    viva.cuadro = dt => {
      const D = viva.D;
      if (!D) return false;
      viva.t += dt;
      const f = viva.t * 30;
      const d = distXZ(posCam(), md.centro);
      if (md.seVa && f > 10 && d < md.seVa) viva.yendo = true;
      if (viva.yendo) {
        viva.alfa = Math.max(0, viva.alfa - dt * 1.25);
        alfaGrupo(viva.grupo, viva.alfa);
        if (viva.alfa <= 0) {
          viva.quitar();
          vivos = vivos.filter(x => x !== viva);
          return true;
        }
      }
      const k = Math.max(0, Math.min(1, (2e3 - d) / 1700)) * viva.alfa;
      viva.voz?.fijar(k);
      const fi = Math.floor(f), txt = k > .35 ? (D.subs || []).filter(x => fi >= x.ini && fi < x.fin).map(x => x.texto).join("\n") : "";
      if (txt || viva.sub) {
        subs.mostrar(txt, Math.max(k, .35));
        viva.sub = txt;
      }
      if (f >= D.sqt.n - 1 && (!viva.voz || viva.voz.terminada)) {
        if (!cambiando) {
          cambiando = true;
          abrir(elegir(viva.n)).catch(e => console.warn("media demo", e.message)).finally(() => {
            cambiando = false;
          });
        }
        return false;
      }
      C.posar(D, Math.min(f, D.sqt.n - 1));
      return true;
    };
    viva.quitar = () => {
      viva.voz?.parar();
      if (viva.sub) {
        subs.mostrar("");
        viva.sub = "";
      }
      viva.grupo.removeFromParent();
      if (viva.D) C.liberar(viva.D);
      viva.D = null;
    };
    return viva;
  }
  async function ponerModelo(def, yo) {
    const m = def.modelo;
    const pj = await window.sh4.escenaJuego.modelo({
      arch: m.arch,
      m: m.m,
      t: m.t,
      a: m.a
    });
    if (yo !== vueltaPj) {
      pj.dispose();
      return null;
    }
    pj.ubicar(m.pos[0], m.pos[1], m.pos[2], m.rot || 0);
    pj.grupo.name = def.nombre;
    grupoPj.add(pj.grupo);
    return {
      def: def,
      cuadro: dt => {
        pj.actualizar(dt);
        return true;
      },
      quitar: () => {
        pj.grupo.removeFromParent();
        pj.dispose();
      }
    };
  }
  async function ponerPersonajes(nombre) {
    quitarPersonajes();
    if (!cfg.personajes) return;
    const yo = vueltaPj, base = nombre.slice(0, 4), mitad = mitadDe(nombre);
    if (cfg.mundo && mundo.cubre(nombre)) return;
    if (PERSONAJES.some(def => def.sala === base && def.media)) {
      try {
        await subs.prepararEtapa(nombre.slice(0, 2));
      } catch {}
      if (yo !== vueltaPj) return;
    }
    for (const def of PERSONAJES) {
      if (def.sala !== base || def.mitad && def.mitad !== mitad || def.si && !def.si(F)) continue;
      try {
        const v = def.media ? await ponerMedia(def, yo) : await ponerModelo(def, yo);
        if (yo !== vueltaPj) {
          v?.quitar();
          return;
        }
        if (v) vivos.push(v);
      } catch (e) {
        console.warn("personaje", def.nombre, e.message);
      }
    }
    redibujar?.();
  }
  const enemigos = () => window.sh4?.enemigos || null;
  async function aplicarEnemigos(nombre = info.sala) {
    const en = enemigos();
    if (!en || !nombre) return null;
    return en.alCargarSala(cfg.enemigos ? nombre : "--", {
      mitad: mitadDe(nombre)
    });
  }
  let salaNombre = null;
  let calleViva = null, sonCalle = null;
  function ponerCalle(nombre) {
    quitarCalle();
    if (!cfg.personajes) return;
    calleViva = crearCalle({
      grupo: escena,
      hora: horaDeVista(nombre),
      F: F,
      ojo: () => camara.getWorldPosition(new THREE.Vector3),
      forzarEscenas: true
    });
    try {
      sonCalle = son()?.efecto?.(20078, null, {
        volumen: 1,
        loop: true
      }) || null;
    } catch {}
  }
  function quitarCalle() {
    calleViva?.quitar();
    calleViva = null;
    try {
      sonCalle?.parar?.(.2);
    } catch {}
    sonCalle = null;
  }
  function salir() {
    quitarPersonajes();
    quitarCalle();
    mundo.salir();
    pararPrologo();
    subs.mostrar("");
    capaSU.quitar();
    if (dias) {
      try {
        dias.pararAmbientes();
      } catch {}
    }
    cuarto302.sala = null;
    cuarto302.escena = null;
    haunting302 = 0;
  }
  async function alCargarSala(nombre) {
    salaNombre = nombre;
    aplicarNiebla();
    aplicarSonido();
    window.sh4.escenaJuego?.opciones({
      objetos: cfg.objetos,
      velas: cfg.velas
    });
    const es = window.sh4.escenaJuego?.actual;
    if (/^rl/.test(nombre) && es?.etapa === "rl") {
      try {
        await iniciar302();
        if (salaNombre !== nombre) return;
        cuarto302.sala = {
          nombre: nombre
        };
        cuarto302.escena = +es.n;
        dias.alEntrarSala();
        await automaticos302();
        if (salaNombre !== nombre) return;
        haunting302 = forzarHauntings();
      } catch (e) {
        console.warn("302 vivo", e);
      }
    } else if (dias) {
      cuarto302.sala = {
        nombre: nombre
      };
      cuarto302.escena = null;
      try {
        dias.hauntings.alEntrarSala();
      } catch {}
    }
    if (/^t[wx]0\d/.test(nombre)) ponerCalle(nombre);
    await ponerPersonajes(nombre);
    if (salaNombre === nombre) {
      try {
        await mundo.alCargarSala(nombre, {
          mundo: cfg.mundo,
          eileen: cfg.eileen,
          particulas: cfg.particulas
        });
      } catch (e) {
        console.warn("mundo vivo", e);
      }
    }
    if (salaNombre === nombre) await ponerSinUsarSala(nombre);
    if (salaNombre === nombre && /^rl/.test(nombre) && es?.etapa === "rl") ponerPrologo(nombre, +es.n);
    pintarEstado();
  }
  const SALAS_PROLOGO = new Set([ "rl00g", "rl01d", "rl03c" ]);
  let ambPrologo = [], prologoPendiente = null;
  function pararPrologo() {
    for (const h of ambPrologo) {
      try {
        h?.parar?.(.3);
      } catch {}
    }
    ambPrologo = [];
    prologoPendiente = null;
  }
  async function ponerPrologo(nombre, esc) {
    pararPrologo();
    const enPrologo = cfg.momento === "prologo" || cfg.momento === "libre" && SALAS_PROLOGO.has(nombre);
    if (!enPrologo) return;
    const s = son();
    if (!s?.efecto) {
      prologoPendiente = {
        nombre: nombre,
        esc: esc
      };
      return;
    }
    try {
      const {AMB_PROLOGO: AMB_PROLOGO, AMB_LIVING: AMB_LIVING} = await (import("./modo_juego/ambiente.js"));
      if (salaNombre !== nombre) return;
      const a = AMB_PROLOGO[esc];
      if (!a) return;
      ambPrologo.push(s.efecto(51010, aMundo(a[1]), {
        volumen: a[0],
        loop: true,
        radio: 4e3
      }));
      if (esc === 1) ambPrologo.push(s.efecto(AMB_LIVING[0], aMundo(AMB_LIVING[2]), {
        volumen: AMB_LIVING[1],
        loop: true,
        radio: 4e3
      }));
    } catch (e) {
      console.warn("ambiente del prólogo", e.message);
    }
  }
  const entradaVacia = {
    teclas: {},
    acciones: [],
    ejes: {}
  };
  let tForzar = 0, tPintar = 0;
  function actualizar(dtAnim, dt = dtAnim) {
    let cambio = false;
    if ((tPintar -= dt) <= 0) {
      tPintar = 2;
      if ($("animacion")?.open) pintarEstado();
    }
    if (dtAnim > 0) {
      for (const v of vivos.slice()) {
        try {
          if (v.cuadro?.(dtAnim)) cambio = true;
        } catch (e) {
          console.warn("personaje", e);
        }
      }
      if (calleViva) {
        try {
          if (calleViva.actualizar(dtAnim)) cambio = true;
        } catch (e) {
          console.warn("calle", e);
        }
      }
      if (mundo.actualizar(dtAnim)) cambio = true;
      if (capaSU.actualizar(dtAnim)) cambio = true;
      if (cuarto302.sala) {
        PARTIDA.henry.vida = 100;
        for (const t of [ ...tareas302 ]) {
          try {
            if (t(dtAnim, entradaVacia)) cambio = true;
          } catch (e) {
            console.warn("302", e);
          }
        }
        if (haunting302 && (tForzar -= dt) <= 0) {
          tForzar = 5;
          forzarHauntings();
        }
      }
    }
    return cambio;
  }
  const $ = id => document.getElementById(id);
  let lineaEstado = null;
  function resumen() {
    const ej = window.sh4.escenaJuego, pj = vivos.map(v => v.def.nombre);
    let amb = [];
    try {
      if (dias && cuarto302.sala && /^rl/.test(cuarto302.sala.nombre)) amb = dias.estado().ambientes;
    } catch {}
    const partes = [];
    if (ej?.objetos?.length) partes.push(`${ej.objetos.length} objeto${ej.objetos.length > 1 ? "s" : ""}`);
    if (ej?.velas) partes.push("velas");
    if (pj.length) partes.push(pj.join(", "));
    if (calleViva) {
      const c = calleViva.estado();
      partes.push(`la calle: ${c.autos} autos, ${c.peatones} peatones, ${c.vecinos.length} vecinos${c.escena.length ? ", " + c.escena.join(", ") : ""}`);
    }
    if (amb.length) partes.push("sonando " + amb.map(x => x.replace(/^ambiente /, "")).join(", "));
    let np = 0;
    try {
      np = cfg.particulas ? fx()?.estado?.particulas || 0 : 0;
    } catch {}
    if (np) partes.push(`${np} partículas`);
    if (haunting302) partes.push(`${haunting302} haunting${haunting302 > 1 ? "s" : ""}`);
    if (window.sh4.enemigos?.enemigos?.length && cfg.enemigos) partes.push(`${window.sh4.enemigos.enemigos.length} enemigos`);
    if (mundo.modulo && cfg.mundo) partes.push("código del mundo");
    if (mundo.eileen) partes.push("Eileen");
    if (ambPrologo.length) partes.push("ambiente del prólogo");
    {
      const su = capaSU.estado();
      if (cfg.sinusar && su.escena && (su.criaturas.length || su.nichos)) partes.push(`sin usar: ${su.criaturas.length} criaturas, ${su.nichos} nichos`);
    }
    return partes.join(" · ") || "nada animado en esta sala";
  }
  function pintarEstado() {
    if (lineaEstado) lineaEstado.textContent = (cfg.momento !== "libre" ? momento().nombre.replace(/^302 · /, "") + " · " : "") + `mitad ${cfg.mitad} · ` + resumen();
  }
  const texto = t => document.createTextNode(t);
  function armarPanel() {
    const cuerpo = $("animacionCuerpo");
    if (!cuerpo) return;
    cuerpo.textContent = "";
    const fila1 = document.createElement("div");
    fila1.className = "fila";
    const selM = document.createElement("select");
    selM.id = "animMomento";
    selM.title = "Momento del juego: las banderas de ese día (en el 302 cambia la variante de la sala)";
    for (const m of MOMENTOS) selM.appendChild(new Option(m.nombre, m.id));
    selM.value = momento().id;
    fila1.append(texto("Momento "), selM);
    const fila2 = document.createElement("div");
    fila2.className = "fila";
    const selMi = document.createElement("select");
    selMi.id = "animMitad";
    selMi.title = "Mitad del juego (cambia objetos, enemigos y personajes)";
    selMi.append(new Option("1.ª mitad", "1"), new Option("2.ª mitad", "2"));
    selMi.value = String(cfg.mitad);
    const inB = document.createElement("input");
    inB.id = "animBanderas";
    inB.type = "text";
    inB.inputMode = "numeric";
    inB.placeholder = "banderas: 504, 507";
    inB.value = cfg.extra || "";
    inB.title = "Banderas extra del juego (números separados por comas)";
    fila2.append(texto("Mitad "), selMi, texto(" "), inB);
    const lista = document.createElement("div");
    lista.className = "casillas";
    for (const [k, nombre, ayuda] of CASILLAS) {
      const l = document.createElement("label");
      l.title = ayuda;
      const c = document.createElement("input");
      c.type = "checkbox";
      c.checked = !!cfg[k];
      c.dataset.k = k;
      c.id = "anim_" + k;
      c.addEventListener("change", () => {
        cambiar(k, c.checked);
        c.blur();
      });
      l.append(c, texto(" " + nombre));
      lista.appendChild(l);
    }
    lineaEstado = document.createElement("div");
    lineaEstado.id = "animEstado";
    if (liviano) {
      const n = document.createElement("div");
      n.className = "nota";
      n.textContent = "Equipo liviano: agua y humo, personajes y hauntings arrancan apagados.";
      cuerpo.append(n);
    }
    cuerpo.prepend(fila1, fila2, lista);
    cuerpo.append(lineaEstado);
    for (const el of [ inB, selM, selMi ]) el.addEventListener("keydown", e => e.stopPropagation());
    selM.addEventListener("change", () => {
      selM.blur();
      ponerMomento(selM.value);
    });
    selMi.addEventListener("change", () => {
      selMi.blur();
      ponerMitad(+selMi.value);
    });
    inB.addEventListener("change", () => {
      cfg.extra = inB.value.trim();
      cambiarEstado();
    });
    const det = $("animacion");
    if (det) {
      det.open = cfg.abierto ?? (!liviano && innerWidth > 700);
      det.addEventListener("toggle", () => {
        cfg.abierto = det.open;
        guardar();
      });
    }
    $("silenciar")?.addEventListener("click", e => {
      cambiar("sonido", !cfg.sonido);
      e.currentTarget.blur();
    });
    pintarEstado();
  }
  async function cambiarEstado() {
    guardar();
    armarBanderas();
    await d302;
    const nombre = info.sala;
    if (!nombre) return;
    const otra = salaQueToca(nombre);
    await recargar(otra || nombre, {
      mantener: !otra || otra.slice(0, 4) === nombre.slice(0, 4)
    });
  }
  function cambiar(k, v) {
    cfg[k] = v;
    guardar();
    const c = $("anim_" + k);
    if (c && c.checked !== v) c.checked = v;
    switch (k) {
     case "objetos":
     case "velas":
      window.sh4.escenaJuego?.opciones({
        objetos: cfg.objetos,
        velas: cfg.velas
      });
      break;

     case "niebla":
      opcionesEfectos();
      aplicarNiebla();
      break;

     case "ruido":
      opcionesEfectos();
      break;

     case "particulas":
      opcionesEfectos();
      reiniciarEfectos();
      break;

     case "sonido":
      aplicarSonido();
      break;

     case "personajes":
      if (info.sala) {
        if (/^t[wx]0\d/.test(info.sala)) ponerCalle(info.sala);
        ponerPersonajes(info.sala).then(pintarEstado);
      }
      break;

     case "hauntings":
      if (info.sala && /^rl/.test(info.sala)) alCargarSala(info.sala);
      break;

     case "enemigos":
      aplicarEnemigos().then(pintarEstado).catch(e => console.warn("enemigos", e));
      break;

     case "mundo":
     case "eileen":
      cambiarEstado();
      break;

     case "subtitulos":
      subs.activos = v;
      break;

     case "sinusar":
      ponerSinUsarSala(info.sala).then(pintarEstado);
      break;

     case "nichos":
      capaSU.verEtiquetas?.(v);
      break;
    }
    redibujar?.();
  }
  function reiniciarEfectos() {
    try {
      fx()?.alCargarSala(info.sala);
    } catch (e) {
      console.warn("efectos", e);
    }
    if (cuarto302.sala && /^rl/.test(info.sala || "")) alCargarSala(info.sala);
  }
  addEventListener("keydown", e => {
    if (e.code === "KeyN" && !/^(INPUT|SELECT|TEXTAREA)$/.test(e.target?.tagName || "")) cambiar("sonido", !cfg.sonido);
  });
  armarPanel();
  function ponerMomento(id) {
    cfg.momento = MOMENTOS.some(m => m.id === id) ? id : "libre";
    const m = momento();
    if (m.id !== "libre") cfg.mitad = m.banderas.includes(1130) ? 2 : 1;
    const a = $("animMomento"), b = $("animMitad");
    if (a) a.value = m.id;
    if (b) b.value = String(cfg.mitad);
    return cambiarEstado();
  }
  function ponerMitad(v) {
    cfg.mitad = v === 2 ? 2 : 1;
    const b = $("animMitad");
    if (b) b.value = String(cfg.mitad);
    return cambiarEstado();
  }
  function filasVR() {
    const si = v => v ? "Sí" : "No";
    return [ {
      id: "momento",
      nombre: "Momento",
      valor: () => momento().nombre.replace(/^302 · /, "").replace(/ \(.*\)$/, ""),
      cambiar: d => {
        const i = MOMENTOS.indexOf(momento());
        return ponerMomento(MOMENTOS[(i + d + MOMENTOS.length) % MOMENTOS.length].id);
      }
    }, {
      id: "mitad",
      nombre: "Mitad",
      valor: () => cfg.mitad === 2 ? "2.ª mitad" : "1.ª mitad",
      cambiar: () => ponerMitad(cfg.mitad === 2 ? 1 : 2)
    }, ...CASILLAS.map(([k, nombre]) => ({
      id: k,
      nombre: nombre,
      valor: () => si(cfg[k]),
      cambiar: () => cambiar(k, !cfg[k])
    })) ];
  }
  return {
    F: F,
    mitadDe: mitadDe,
    alCargarSala: alCargarSala,
    salir: salir,
    actualizar: actualizar,
    prepararMundo: prepararMundo,
    filasVR: filasVR,
    ponerMomento: ponerMomento,
    ponerMitad: ponerMitad,
    subs: subs,
    mundo: mundo,
    opcionesEfectos: opcionesEfectos,
    aplicarSonido: aplicarSonido,
    aplicarEnemigos: aplicarEnemigos,
    varianteDe: b => cfg.momento === "libre" ? null : varianteDe(b),
    salaQueToca: salaQueToca,
    resumen: resumen,
    cambiar: cambiar,
    liviano: liviano,
    PARTIDA: PARTIDA,
    get cfg() {
      return {
        ...cfg
      };
    },
    get congelado() {
      return !!cfg.congelar;
    },
    get enemigosActivos() {
      return !!cfg.enemigos;
    },
    get ruidoPropio() {
      return haunting302 > 0;
    },
    get dias() {
      return dias;
    },
    get personajes() {
      return vivos.map(v => v.def.nombre);
    },
    estado() {
      return {
        momento: cfg.momento,
        mitad: cfg.mitad,
        banderas: Object.keys(PARTIDA.banderas).length,
        personajes: vivos.map(v => v.def.nombre + (v.n ? " d_" + v.n : "")),
        dias: (() => {
          try {
            return dias && cuarto302.sala ? dias.estado() : null;
          } catch {
            return null;
          }
        })(),
        hauntings: haunting302,
        liviano: liviano,
        resumen: resumen(),
        sinUsar: capaSU.estado()
      };
    }
  };
}
