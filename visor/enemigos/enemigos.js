// SH4 web — FeniXVOID · Project Ravenlight
import { partesBin } from "../lib/sh4bin.js";

import { leerModelo } from "../lib/modelo.js";

import { leerTexturas, aRGBA } from "../lib/texturas.js";

import { texturasDeParte } from "../efectos/comun.js";

import { leerAnimacion } from "../lib/animacion.js";

import { crearPersonaje } from "../lib/personaje.js";

import { NOMBRES_ANIM } from "../lib/anim_nombres.js";

import { FPS, DT, AnimEnemigo, crearMovedor, distXZ, dist3, girarY, rumboHacia } from "./comun.js";

import { Hyena, NOMBRE_PASO as PASOS_HYENA, bdtIndice, C as COND } from "./ia_hyena.js";

import { Multi, NOMBRE_PASO as PASOS_MULTI, MODELO_TIPO as MODELO_MULTI } from "./ia_multi.js";

import { Mm, NOMBRE_PASO as PASOS_MM, NOMBRES_ANIM_MM } from "./ia_mm.js";

import { Kabe, NOMBRE_PASO as PASOS_KABE, NOMBRES_ANIM_KABE, modeloKabe, parteModeloKabe } from "./ia_kabe.js";

import { Pickgirl, NOMBRE_PASO as PASOS_PICK, MODELO_TIPO as MODELO_PICK, PARTE_MODELO as PARTE_PICK } from "./ia_pickgirl.js";

import { Buzz, NOMBRE_PASO as PASOS_BUZZ, NOMBRES_ANIM_BUZZ } from "./ia_buzz.js";

import { Flames, NOMBRE_PASO as PASOS_FLAMES, NOMBRES_ANIM_FLAMES, MODELO_TIPO as MODELO_FLAMES } from "./ia_flames.js";

import { Cell, NOMBRE_PASO as PASOS_CELL, crearCell } from "./ia_cell.js";

import { Mush, NOMBRE_PASO as PASOS_MUSH, NOMBRES_ANIM_MUSH, binMush } from "./ia_mush.js";

import { Twins, NOMBRE_PASO as PASOS_TWINS, NOMBRES_ANIM_TWINS, PARTE_MODELO as PARTE_TWINS } from "./ia_twins.js";

import { Hil, NOMBRE_PASO as PASOS_HIL, NOMBRES_ANIM_HIL, binHil, parteModeloHil, texturasHil } from "./ia_hil.js";

import { Wheel, NOMBRE_PASO as PASOS_WHEEL, NOMBRES_ANIM_WHEEL, binWheel } from "./ia_wheel.js";

import { Jinmen, NOMBRE_PASO as PASOS_JINMEN, NOMBRES_ANIM_JINMEN, binJinmen, parteModeloJinmen } from "./ia_jinmen.js";

import { Nurse, NOMBRE_PASO as PASOS_NURSE, NOMBRES_ANIM_NURSE, binNurse, modeloNurse } from "./ia_nurse.js";

import { Scratch, NOMBRE_PASO as PASOS_SCRATCH, NOMBRES_ANIM_SCRATCH, binScratch, modeloScratch } from "./ia_scratch.js";

import { KabeJefe, NOMBRE_PASO as PASOS_JEFE, NOMBRES_ANIM_JEFE, binJefe, esJefe } from "./ia_kabe_jefe.js";

import { ScratchEvento, esScratchEvento } from "./ia_scratch_evento.js";

import { Killer, NOMBRE_PASO as PASOS_KILLER, NOMBRES_ANIM_KILLER, binKiller, armasKiller, sinKiller } from "./ia_killer.js";

import { Fat, NOMBRE_PASO as PASOS_FAT, NOMBRES_ANIM_FAT, binFat } from "./ia_fat.js";

import { crearCaminos } from "./caminos.js";

const BUSQUEDA = {
  KILLER: {
    alto: 40,
    ancho: 80,
    rango: 400
  },
  JINMEN: {
    alto: 0,
    altoMeta: 100,
    ancho: 60,
    rango: 300
  },
  TWINS: {
    alto: 40,
    ancho: 100,
    rango: 400
  }
};

const BUSQUEDA_FANTASMA = {
  alto: 40,
  ancho: 60,
  rango: 300
};

BUSQUEDA.FAT = {
  alto: 0,
  ancho: 140,
  rango: 400
};

BUSQUEDA.MULTI = {
  alto: 40,
  ancho: 80,
  rango: 400
};

const IA = {
  HYENA: {
    bin: "enemy_hyena.bin",
    clase: Hyena,
    pasos: PASOS_HYENA
  },
  MULTI: {
    bin: "enemy_multi.bin",
    modelo: def => MODELO_MULTI[def.tipo_param || 0] || MODELO_MULTI[0],
    clase: Multi,
    pasos: PASOS_MULTI
  },
  MM: {
    bin: (def, sala) => def.archivos?.find(a => a.startsWith("enemy_mm_")) || "enemy_mm_" + String(sala).slice(0, 4) + ".bin",
    modelo: () => "enemy_mm.bin",
    clase: Mm,
    pasos: PASOS_MM,
    nombres: NOMBRES_ANIM_MM
  },
  WALLMAN: {
    bin: "enemy_kabe.bin",
    modelo: def => modeloKabe(def),
    parteModelo: def => parteModeloKabe(def),
    clase: Kabe,
    pasos: PASOS_KABE,
    nombres: NOMBRES_ANIM_KABE,
    sin: def => (def.estado_inicial & 15) === 8
  },
  PICKGIRL: {
    bin: "enemy_pickgirl.bin",
    modelo: def => MODELO_PICK[def.tipo_param || 0] || MODELO_PICK[0],
    parteModelo: def => PARTE_PICK[def.tipo_param || 0] ?? PARTE_PICK[0],
    clase: Pickgirl,
    pasos: PASOS_PICK
  },
  BUZZ: {
    bin: "enemy_buzz.bin",
    clase: Buzz,
    pasos: PASOS_BUZZ,
    nombres: NOMBRES_ANIM_BUZZ
  },
  FLAMES: {
    bin: "enemy_flames.bin",
    modelo: def => MODELO_FLAMES[def.tipo_param || 0] || MODELO_FLAMES[0],
    clase: Flames,
    pasos: PASOS_FLAMES,
    nombres: NOMBRES_ANIM_FLAMES
  },
  CELL: {
    bin: "enemy_cell.bin",
    clase: Cell,
    pasos: PASOS_CELL,
    crear: crearCell
  },
  MUSH: {
    bin: (def, sala) => binMush(def, sala),
    clase: Mush,
    pasos: PASOS_MUSH,
    nombres: NOMBRES_ANIM_MUSH
  },
  TWINS: {
    bin: "enemy_twins.bin",
    parteModelo: def => PARTE_TWINS(def),
    clase: Twins,
    pasos: PASOS_TWINS,
    nombres: NOMBRES_ANIM_TWINS
  },
  HIL: {
    bin: (def, sala) => binHil(def, sala),
    parteModelo: def => parteModeloHil(def),
    clase: Hil,
    pasos: PASOS_HIL,
    nombres: NOMBRES_ANIM_HIL,
    extra: (e, x) => texturasHil(e, x)
  },
  WHEEL: {
    bin: (def, sala) => binWheel(def, sala),
    clase: Wheel,
    pasos: PASOS_WHEEL,
    nombres: NOMBRES_ANIM_WHEEL
  },
  JINMEN: {
    bin: def => binJinmen(def),
    parteModelo: def => parteModeloJinmen(def),
    clase: Jinmen,
    pasos: PASOS_JINMEN,
    nombres: NOMBRES_ANIM_JINMEN
  },
  NURSE: {
    bin: () => binNurse(),
    modelo: () => modeloNurse(),
    clase: Nurse,
    pasos: PASOS_NURSE,
    nombres: NOMBRES_ANIM_NURSE
  },
  SCRATCH: {
    bin: () => binScratch(),
    modelo: () => modeloScratch(),
    clase: Scratch,
    pasos: PASOS_SCRATCH,
    nombres: NOMBRES_ANIM_SCRATCH
  },
  WALLMAN_JEFE: {
    bin: () => binJefe(),
    clase: KabeJefe,
    pasos: PASOS_JEFE,
    nombres: NOMBRES_ANIM_JEFE
  },
  SCRATCH_EVENTO: {
    bin: () => binScratch(),
    modelo: () => modeloScratch(),
    clase: ScratchEvento,
    pasos: PASOS_SCRATCH,
    nombres: NOMBRES_ANIM_SCRATCH
  },
  KILLER: {
    bin: () => binKiller(),
    parteModelo: () => 0,
    clase: Killer,
    pasos: PASOS_KILLER,
    nombres: NOMBRES_ANIM_KILLER,
    sin: sinKiller,
    extra: armasKiller
  },
  FAT: {
    bin: () => binFat(),
    clase: Fat,
    pasos: PASOS_FAT,
    nombres: NOMBRES_ANIM_FAT
  }
};

const tipoIA = def => esJefe(def) ? "WALLMAN_JEFE" : esScratchEvento(def) ? "SCRATCH_EVENTO" : def.enemigo;

const ESTADOS = {
  ABSENT: 0,
  MOVE: 1,
  SILENT: 2,
  READY: 3,
  LOCK: 4,
  ATTACK: 5,
  DAMAGE: 6,
  EVENT: 7,
  SWORD: 8,
  GODMODE: 9,
  DEAD: 10
};

export function iniciarEnemigos({THREE: THREE, escena: escena, sala: sala, jugador: jugador, henry: henry, getColision: getColision, escala: escala = .005, ojos: ojos = 1.6, nivel: nivel = 1, alGolpearHenry: alGolpearHenry = null, estadoHenry: estadoHenry = null, sonido: sonido = null, efectos: efectos = null, conectarHenry: conectarHenry = true, bajar: bajar = null} = {}) {
  const grupo = new THREE.Group;
  grupo.name = "enemigos";
  escena.add(grupo);
  const movedor = crearMovedor(THREE, getColision, escala);
  let datos = null, golpes = null;
  const bins = new Map;
  const enemigos = [], pendientes = [], charcos = [];
  let acumulado = 0, salaActual = null, cargando = 0;
  let estadia = 0;
  const api = {
    enemigos: enemigos,
    pendientes: pendientes,
    charcos: charcos,
    alGolpearHenry: alGolpearHenry,
    alSoltarHenry: null,
    estadoHenry: estadoHenry,
    nivel: nivel,
    verEstados: false,
    pausa: false
  };
  const caminos = crearCaminos({
    THREE: THREE,
    getColision: getColision,
    escala: escala,
    leer: n => bajar ? bajar("data/" + n) : fetch("/juego/data/" + n).then(r => {
      if (!r.ok) throw new Error(n);
      return r.arrayBuffer();
    })
  });
  try {
    caminos.ver = new URLSearchParams(location.search).has("vercaminos");
  } catch {}
  api.caminos = caminos;
  async function cargarDatos() {
    if (!datos) {
      datos = await (await fetch("/datos/enemigos.json")).json();
      try {
        golpes = (await (await fetch("/datos/juego.json")).json()).golpes;
      } catch {
        golpes = [];
      }
    }
    return datos;
  }
  function bin(nombre) {
    if (!bins.has(nombre)) bins.set(nombre, (bajar ? bajar("data/" + nombre) : fetch("/juego/data/" + nombre).then(r => {
      if (!r.ok) throw new Error("no pude leer " + nombre);
      return r.arrayBuffer();
    })).then(b => {
      const p = partesBin(b);
      return {
        b: b,
        p: p,
        modelos: p.filter(x => x.tipo === "modelo"),
        texs: p.filter(x => x.tipo === "texturas"),
        anims: p.filter(x => x.tipo === "animacion").map(x => leerAnimacion(b, x.ofs, x.len))
      };
    }));
    bins.get(nombre).catch(() => bins.delete(nombre));
    return bins.get(nombre);
  }
  const aJuego = v => [ -v.x / escala, -v.y / escala, v.z / escala ];
  const vCam = new THREE.Vector3, vA = new THREE.Vector3, vB = new THREE.Vector3, rayoVista = new THREE.Raycaster;
  const camaraJuego = () => api.camara || window.sh4?.camara || null;
  const cuadroVista = new THREE.Frustum, mVista = new THREE.Matrix4, esferaVista = new THREE.Sphere;
  let jugAnt = null, velJug = 0;
  const jug = {
    existe: true,
    pos: [ 0, 0, 0 ],
    rot: 0,
    estado: 1,
    corriendo: false,
    vida: 1
  };
  function leerJugador() {
    const pj = henry?.personaje;
    const p = pj?.grupo ? pj.grupo.position : new THREE.Vector3(jugador.position.x, jugador.position.y - ojos, jugador.position.z);
    jug.pos = aJuego(p);
    jug.rot = pj?.grupo ? -pj.grupo.rotation.y : -(jugador.rotation?.y || 0);
    const salto = jugAnt ? distXZ(jug.pos, jugAnt) : 0;
    if (jugAnt && salto < 200) velJug = velJug * .6 + .4 * (salto * FPS); else velJug = 0;
    jugAnt = [ ...jug.pos ];
    const e = (api.estadoHenry || estadoDesdeHenry)() || {};
    jug.existe = e.existe ?? true;
    jug.corriendo = e.corriendo ?? velJug > 500;
    jug.estado = typeof e.estado === "string" ? ESTADOS[e.estado] ?? 1 : e.estado ?? 1;
    jug.vida = e.vida ?? window.sh4?.vidaHenry ?? 1;
  }
  api.eileen = null;
  const eil = {
    existe: false,
    pos: [ 0, 0, 0 ],
    rot: 0,
    estado: 1,
    corriendo: false,
    vida: 1,
    esEileen: true
  };
  let objetivo = jug;
  function leerEileen() {
    const a = api.eileen?.actual, w = a?.w;
    eil.existe = !!a && !w?.fueraEscena && a.paso !== 21 && (w?.vida ?? 1) > 0;
    if (!a) return;
    eil.pos = a.pos;
    eil.rot = a.rot;
    eil.vida = (w?.vida ?? 100) / 100;
    eil.estado = a.paso >= 12 && a.paso <= 17 ? ESTADOS.ATTACK : a.paso === 7 ? ESTADOS.DAMAGE : ESTADOS.MOVE;
  }
  function elegirObjetivo(e) {
    if (!eil.existe || api.agarradoPor === e || !jug.existe) return eil.existe && !jug.existe ? eil : jug;
    return dist3(e.pos, eil.pos) < dist3(e.pos, jug.pos) ? eil : jug;
  }
  let numeroGolpe = 0;
  const BDT_FUERTE = new Set([ 1, 3, 5, 7, 9, 11, 13, 15, 17, 20 ]);
  function golpeAEileen(e, danio, info = {}, tipo = null) {
    const g = tipo != null ? golpes?.find(x => x.golpe === String(tipo) || x.golpe === "BAK_" + tipo) : null;
    const fuerte = g ? BDT_FUERTE.has(bdtIndice(g.tipo_danio)) : !!info.agarre;
    api.ultimoGolpeEileen = {
      enemigo: e.tipo,
      danio: danio,
      golpe: g?.golpe || tipo,
      fuerte: fuerte,
      t: performance.now()
    };
    try {
      api.eileen?.actual?.golpeDeEnemigo(e, danio, fuerte, `${e.id}#${++numeroGolpe}`);
    } catch (err) {
      console.warn("golpe a Eileen", err.message);
    }
  }
  function empujeAEileen(e) {
    if (e.cond === COND.DEAD) return;
    try {
      api.eileen?.actual?.empujeDeEnemigo?.(e);
    } catch (err) {
      console.warn("empuje a Eileen", err.message);
    }
  }
  function estadoDesdeHenry() {
    const c = henry?.controlador;
    if (!c?.s) return {};
    const s = c.s, E = henry.ESTADO || {};
    let estado = ESTADOS.MOVE;
    if (s.muerto || s.estado === E.MUERTE || s.estado === E.MUERTO) estado = ESTADOS.DEAD; else if (s.danio) estado = ESTADOS.DAMAGE; else if ([ E.GOLPE, E.GOLPE_FUERTE, E.REMATE, E.REMATE2 ].includes(s.estado)) estado = ESTADOS.ATTACK; else if (s.estado === E.GUARDIA) estado = ESTADOS.LOCK; else if (s.estado === E.PREPARAR) estado = ESTADOS.READY;
    return {
      vida: s.vida / (s.vidaMax || 100),
      estado: estado,
      corriendo: (c.m?.run ?? 0) > .5 && (c.m?.move ?? 0) > .3
    };
  }
  const son = () => sonido || window.sh4?.sonido || null;
  const fx = () => efectos || window.sh4?.efectos || null;
  function tocarSonido(e, id, loop) {
    const S = son();
    if (loop || id == null) {
      try {
        e.sonLoop?.parar?.();
      } catch {}
      e.sonLoop = null;
    }
    if (id == null || !S?.efecto) return;
    try {
      const h = S.efecto(id, e.pj.grupo, loop ? {
        loop: true
      } : undefined);
      if (loop) e.sonLoop = h;
    } catch (err) {
      console.warn("sonido enemigo", id, err.message);
    }
  }
  const m = {
    get nivel() {
      return api.nivel;
    },
    grupo: {
      walkAttackInvalid: 0,
      smellBase: 2
    },
    radioJugador: 40,
    datosHyena: null,
    parametros(kind, tipo) {
      const t = datos.parametros[kind].tipos;
      return t[Math.min(tipo, t.length - 1)][Math.max(0, Math.min(4, api.nivel))];
    },
    jugador: () => objetivo,
    piernasJugador() {
      const j = objetivo;
      return [ -1, 1 ].map(l => {
        const g = girarY([ l * 15, -60, 0 ], j.rot);
        return [ j.pos[0] + g[0], j.pos[1] + g[1], j.pos[2] + g[2] ];
      });
    },
    tocaJugador(e) {
      const j = objetivo;
      return j.existe && distXZ(e.pos, j.pos) < e.radio + m.radioJugador + 5 && Math.abs(e.pos[1] - j.pos[1]) < 200;
    },
    piso: (p, subir, bajar) => movedor.piso(p, subir, bajar),
    mover(e, dx, dz) {
      movedor.mover(e.pos, dx, dz, e.radio);
      const sep = (q, r) => {
        const x = e.pos[0] - q[0], z = e.pos[2] - q[2], d = Math.hypot(x, z);
        if (d < r && d > .001 && Math.abs(e.pos[1] - q[1]) < 200) movedor.mover(e.pos, x / d * (r - d), z / d * (r - d), e.radio);
      };
      if (jug.existe) sep(jug.pos, e.radio + m.radioJugador);
      if (eil.existe) {
        const x = e.pos[0] - eil.pos[0], z = e.pos[2] - eil.pos[2];
        if (Math.hypot(x, z) < e.radio + 60 && Math.abs(e.pos[1] - eil.pos[1]) < 200) empujeAEileen(e);
        sep(eil.pos, e.radio + 60);
      }
      for (const o of enemigos) if (o !== e && o.cond !== COND.DEAD && !o.retenido) sep(o.pos, e.radio + o.radio);
    },
    moverFantasma(e, dx, dz) {
      e.pos[0] += dx;
      e.pos[2] += dz;
      if (jug.existe) {
        const x = e.pos[0] - jug.pos[0], z = e.pos[2] - jug.pos[2], d = Math.hypot(x, z), r = e.radio + m.radioJugador - 30;
        if (d < r && d > .001) {
          e.pos[0] += x / d * (r - d);
          e.pos[2] += z / d * (r - d);
        }
      }
    },
    moverFlotante(e, dx, dz) {
      const t = e.tipoCl ?? 0;
      if (t === 8) return;
      if (t === 3 || t === 4 || t === 7) {
        m.moverFantasma(e, dx, dz);
        return;
      }
      const p = e.pos, r = e.radio || 60;
      const paso = (x, z) => {
        if (Math.abs(x) + Math.abs(z) < 1e-6) return;
        if (!movedor.bloqueado(p, x, z, r)) {
          p[0] += x;
          p[2] += z;
          return;
        }
        if (Math.abs(x) > 1e-4 && !movedor.bloqueado(p, x, 0, r)) p[0] += x;
        if (Math.abs(z) > 1e-4 && !movedor.bloqueado(p, 0, z, r)) p[2] += z;
      };
      const x0 = p[0], z0 = p[2];
      paso(dx, dz);
      e.chocoPared = Math.hypot(p[0] - x0, p[2] - z0) < Math.hypot(dx, dz) * .5;
      if (jug.existe && t !== 5 && t !== 6) {
        const x = p[0] - jug.pos[0], z = p[2] - jug.pos[2], d = Math.hypot(x, z), rr = r + m.radioJugador - 30;
        if (d < rr && d > .001) paso(x / d * (rr - d), z / d * (rr - d));
      }
    },
    moverA(e, x, z) {
      e.pos[0] = x;
      e.pos[2] = z;
      const y = movedor.piso(e.pos);
      if (y != null) e.pos[1] = y;
    },
    golpear(e, danio, tipo, info = {}) {
      if (objetivo === eil) {
        golpeAEileen(e, danio, info, tipo);
        return;
      }
      api.ultimoGolpe = {
        enemigo: e.tipo,
        danio: danio,
        tipo: tipo,
        ...info,
        t: performance.now()
      };
      api.golpesDados = (api.golpesDados || 0) + 1;
      if (api.alGolpearHenry) {
        api.alGolpearHenry(danio, tipo, {
          enemigo: e,
          ...info
        });
        return;
      }
      if (!henry?.recibirDaño) return;
      const fila = info.reaccion ?? (info.agarre ? 7 : String(tipo).startsWith("BAK_") ? tipo : 1);
      try {
        henry.recibirDaño(danio, fila, api.posicion(e));
      } catch (err) {
        console.warn("golpe a Henry", err.message);
      }
    },
    agarrar(e, pierna, danio, tipo = "HYENA_AGARRE") {
      if (objetivo === eil) {
        golpeAEileen(e, danio, {
          agarre: true
        }, tipo);
        return true;
      }
      api.agarradoPor = e;
      m.golpear(e, danio, tipo, {
        pierna: pierna,
        agarre: true
      });
      return true;
    },
    get agarradoPor() {
      return api.agarradoPor;
    },
    sigueAgarrado: e => api.agarradoPor === e ? api.henrySigueAgarrado?.(e) ?? null : false,
    soltar(e) {
      if (api.agarradoPor === e) {
        api.agarradoPor = null;
        api.alSoltarHenry?.(e);
      }
    },
    bandera: n => api.bandera ? !!api.bandera(n) : true,
    arrastrarJugador: (e, dx, dz) => objetivo === jug ? api.arrastrarJugador?.(e, dx, dz) : undefined,
    escena: () => api.escenaActual?.() ?? null,
    get etapa() {
      return {
        rl: 1,
        sb: 2,
        fr: 3,
        mz: 4,
        bd: 5,
        ie: 6,
        hs: 7,
        cm: 8,
        ls: 9,
        gt: 10
      }[String(salaActual?.base || "").slice(0, 2)] ?? null;
    },
    soltarItem: (e, item, pos) => api.soltarItem?.(e, item, pos),
    otros: () => enemigos,
    golpearBicho: (o, danio, golpe) => api.recibirGolpe(o, danio, golpe),
    antorcha: () => !!api.antorcha?.(),
    vela: e => api.vela ? api.vela(e) || 0 : 0,
    exorcismo: e => api.exorcismo ? api.exorcismo(e) || 0 : 0,
    prenderBandera: n => api.prenderBandera?.(n),
    posCamara: () => {
      const c = camaraJuego();
      return c ? aJuego(c.getWorldPosition(vCam)) : null;
    },
    relojAtaque: () => estadia,
    get enPantalla() {
      if (!camaraJuego()?.projectionMatrix) return undefined;
      return (e, p) => {
        const c = camaraJuego();
        c.updateMatrixWorld();
        mVista.multiplyMatrices(c.projectionMatrix, c.matrixWorldInverse);
        cuadroVista.setFromProjectionMatrix(mVista);
        const q = p || e.pos, alto = e.alto || 200;
        esferaVista.center.set(-q[0] * escala, (-q[1] + alto / 2) * escala, q[2] * escala);
        esferaVista.radius = Math.max(alto / 2, e.radio || 60) * escala;
        return cuadroVista.intersectsSphere(esferaVista);
      };
    },
    lineaDeVista(a, b) {
      const col = getColision?.();
      if (!col) return true;
      const desde = a?.pos ? a.centro || [ a.pos[0], a.pos[1] - 150, a.pos[2] ] : a, hasta = b || [ objetivo.pos[0], objetivo.pos[1] - 150, objetivo.pos[2] ];
      vA.set(-desde[0] * escala, -desde[1] * escala, desde[2] * escala);
      vB.set(-hasta[0] * escala, -hasta[1] * escala, hasta[2] * escala);
      const L = vA.distanceTo(vB);
      if (L < .001) return true;
      rayoVista.set(vA, vB.sub(vA).normalize());
      rayoVista.far = L;
      return !rayoVista.intersectObject(col).some(h => Math.abs(h.face.normal.y) < .6);
    },
    rayo(desde, hasta) {
      const col = getColision?.();
      if (!col) return null;
      vA.set(-desde[0] * escala, -desde[1] * escala, desde[2] * escala);
      vB.set(-hasta[0] * escala, -hasta[1] * escala, hasta[2] * escala);
      const L = vA.distanceTo(vB);
      if (L < 1e-6) return null;
      rayoVista.set(vA, vB.sub(vA).normalize());
      rayoVista.far = L;
      const h = rayoVista.intersectObject(col)[0];
      if (!h?.face) return null;
      const n = h.face.normal.clone().transformDirection(h.object.matrixWorld);
      return {
        pos: [ -h.point.x / escala, -h.point.y / escala, h.point.z / escala ],
        normal: [ -n.x, -n.y, n.z ],
        dist: h.distance / escala
      };
    },
    objetivoJugador: () => henry?.controlador?.s?.objetivo ?? null,
    altoOjos: () => objetivo === eil ? 300 : ojos / escala,
    jugadorAlerta: () => objetivo === jug && (henry?.controlador?.s?.carga ?? 0) > 2,
    rumboCamara() {
      const c = camaraJuego();
      if (!c) return null;
      c.getWorldDirection(vCam);
      return Math.atan2(-vCam.x, vCam.z);
    },
    girarJugador: (e, rumbo) => objetivo === jug ? api.girarJugador?.(e, rumbo) : undefined,
    sujetarJugador: (e, p) => objetivo === jug ? api.sujetarJugador?.(e, p) : undefined,
    sonido(e, id, loop) {
      if (typeof sonido === "function") sonido(e, id, loop); else tocarSonido(e, id, loop);
    },
    olerCharco(p, tipo, rango) {
      let mejor = null, dm = rango;
      for (const c of charcos) {
        if (c.tipo !== tipo) continue;
        const d = dist3(c.pos, p);
        if (d < dm) {
          dm = d;
          mejor = c;
        }
      }
      return mejor;
    },
    charcoVivo: c => charcos.includes(c),
    charco(e, radio, rapido) {
      if (e.w.setBlood) return;
      e.w.setBlood = 1;
      const c = {
        tipo: 0,
        pos: [ ...e.pos ],
        radio: radio,
        de: e
      };
      charcos.push(c);
      dibujarCharco(c, rapido);
    },
    caminos: caminos,
    camino(e, dest) {
      const b = BUSQUEDA[e.tipo] || BUSQUEDA_FANTASMA;
      e.busqueda ||= caminos.busquedaEnemigo();
      const desde = [ e.pos[0], e.pos[1] - (b.alto || 0), e.pos[2] ], meta = [ dest[0], dest[1] - (b.altoMeta || 0), dest[2] ];
      const p = e.busqueda.buscar(desde, meta) ? e.busqueda.punto(desde, b.ancho, b.rango) : null;
      if (caminos.ver) caminos.ruta(e.id, e.pos, p ? [ p ] : [], 16744512);
      return p;
    },
    reiniciarCamino: e => e.busqueda?.reiniciar(),
    puntosFantasma() {
      const v = caminos.verdes;
      if (!v?.n) return null;
      const r = [];
      for (let i = 0; i < v.n; i++) r.push(v.pos(i));
      return r;
    },
    paredCerca(p, radio = 100, hacia = null) {
      const col = getColision?.();
      if (!col) return null;
      const c = [ p[0], p[1] - 150, p[2] ], dirH = hacia ? Math.atan2(hacia[0] - p[0], hacia[2] - p[2]) : null;
      let mejor = null, dm = Infinity;
      for (let k = 0; k < 16; k++) {
        const a = k / 16 * Math.PI * 2, f = [ Math.sin(a), 0, Math.cos(a) ];
        const h = m.rayo(c, [ c[0] + f[0] * radio, c[1], c[2] + f[2] * radio ]);
        if (!h || Math.abs(h.normal[1]) >= .6) continue;
        let d = h.dist;
        if (dirH != null && Math.cos(a - dirH) < 0) d += radio * 4;
        if (d < dm) {
          dm = d;
          mejor = h;
        }
      }
      if (!mejor) return null;
      let n = [ mejor.normal[0], 0, mejor.normal[2] ];
      const L = Math.hypot(n[0], n[2]) || 1;
      n = [ n[0] / L, 0, n[2] / L ];
      if ((c[0] - mejor.pos[0]) * n[0] + (c[2] - mejor.pos[2]) * n[2] < 0) n = [ -n[0], 0, -n[2] ];
      return {
        pos: [ mejor.pos[0], p[1], mejor.pos[2] ],
        normal: n
      };
    },
    paredesAlrededor(p, radio = 2400) {
      const col = getColision?.();
      if (!col) return [];
      const c = [ p[0], p[1] - 150, p[2] ], r = [];
      for (let k = 0; k < 16; k++) {
        const a = k / 16 * Math.PI * 2, f = [ Math.sin(a), 0, Math.cos(a) ];
        const h = m.rayo(c, [ c[0] + f[0] * radio, c[1], c[2] + f[2] * radio ]);
        if (!h || Math.abs(h.normal[1]) >= .6 || h.dist < 120) continue;
        r.push([ h.pos[0] - f[0] * 40, p[1], h.pos[2] - f[2] * 40 ]);
      }
      return r;
    }
  };
  const matCharco = new THREE.MeshBasicMaterial({
    color: 4851204,
    transparent: true,
    opacity: .92,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -4
  });
  let texCharco = null;
  texturasDeParte(THREE, {
    partesBin: partesBin,
    leerTexturas: leerTexturas,
    aRGBA: aRGBA
  }, "enemy_tex.bin", 2).then(t => {
    texCharco = t?.[0]?.[0] || null;
    if (texCharco) {
      matCharco.map = texCharco;
      matCharco.needsUpdate = true;
    }
  }).catch(err => console.warn("charco: textura", err.message));
  const geoCharco = new THREE.PlaneGeometry(2, 2);
  function dibujarCharco(c, rapido) {
    const malla = new THREE.Mesh(geoCharco, matCharco);
    malla.rotation.set(-Math.PI / 2, 0, Math.random() * Math.PI * 2);
    malla.position.set(-c.pos[0] * escala, -c.pos[1] * escala + 4 * escala, c.pos[2] * escala);
    c.tam = rapido ? c.radio : 0;
    malla.scale.setScalar(Math.max(.001, c.tam * escala));
    c.malla = malla;
    c.crece = !rapido;
    malla.name = "charco de sangre";
    grupo.add(malla);
  }
  function cartel(e) {
    if (!e.cartel) {
      const cv = document.createElement("canvas");
      cv.width = 256;
      cv.height = 64;
      const tex = new THREE.CanvasTexture(cv);
      const s = new THREE.Sprite(new THREE.SpriteMaterial({
        map: tex,
        depthTest: false,
        transparent: true
      }));
      s.scale.set(.9, .225, 1);
      s.renderOrder = 20;
      grupo.add(s);
      e.cartel = {
        cv: cv,
        tex: tex,
        s: s,
        txt: ""
      };
    }
    const txt = (IA[e.tipo]?.pasos?.[e.paso] || e.paso) + " " + Math.round(e.hp) + (e.cond === COND.DEAD ? " †" : "");
    if (txt !== e.cartel.txt) {
      const x = e.cartel.cv.getContext("2d");
      x.clearRect(0, 0, 256, 64);
      x.fillStyle = "rgba(0,0,0,.6)";
      x.fillRect(0, 8, 256, 48);
      x.font = "bold 26px sans-serif";
      x.fillStyle = "#ffcc66";
      x.textAlign = "center";
      x.fillText(txt, 128, 42);
      e.cartel.tex.needsUpdate = true;
      e.cartel.txt = txt;
    }
    e.cartel.s.visible = api.verEstados;
    e.cartel.s.position.copy(e.pj.grupo.position).add(new THREE.Vector3(0, 1.1, 0));
  }
  async function crear(def, vigente = () => true) {
    const ia = IA[tipoIA(def)];
    if (ia.crear) {
      const e = await ia.crear(def, {
        THREE: THREE,
        m: m,
        bin: bin,
        escala: escala,
        grupo: grupo,
        getColision: getColision,
        sala: salaActual?.base
      });
      if (e) enCurso.add(e);
      return e;
    }
    const nombreBin = typeof ia.bin === "function" ? ia.bin(def, salaActual?.base) : ia.bin;
    const b = await bin(nombreBin);
    const bm = ia.modelo ? await bin(ia.modelo(def)) : b;
    if (!vigente()) return null;
    const pmod = ia.parteModelo ? ia.parteModelo(def) : null;
    const km = pmod != null && typeof pmod === "object" ? pmod.modelo : pmod;
    const kt = pmod != null && typeof pmod === "object" ? pmod.texturas : km;
    const k = km != null ? Math.min(km, bm.modelos.length - 1) : ia.modelo ? 0 : Math.min(def.tipo_param || 0, bm.modelos.length - 1);
    const pm = bm.modelos[k], pt = bm.texs[Math.min(kt ?? k, bm.texs.length - 1)];
    const pj = crearPersonaje(leerModelo(bm.b, pm.ofs, pm.len), pt ? leerTexturas(bm.b, pt.ofs, pt.len) : []);
    pj.grupo.name = `${def.enemigo} ${def.indice}`;
    let pelo = null;
    if (pmod?.pelo && bm.modelos[pmod.pelo.modelo]) {
      const mp = bm.modelos[pmod.pelo.modelo], tp = bm.texs[pmod.pelo.texturas];
      try {
        pelo = crearPersonaje(leerModelo(bm.b, mp.ofs, mp.len), tp ? leerTexturas(bm.b, tp.ofs, tp.len) : []);
        pelo.grupo.name = pj.grupo.name + " (pelo)";
      } catch (err) {
        console.warn("pelo", err.message);
      }
    }
    const anim = new AnimEnemigo(pj, b.anims, ia.nombres || NOMBRES_ANIM[nombreBin.slice(0, -4)] || []);
    const e = new ia.clase(def, pj, anim, m);
    enCurso.add(e);
    e.id = `${def.enemigo}_${def.indice}`;
    e.pjPelo = pelo;
    if (ia.extra) await ia.extra(e, {
      bin: bin,
      crearPersonaje: crearPersonaje,
      leerModelo: leerModelo,
      leerTexturas: leerTexturas,
      THREE: THREE
    });
    grupo.add(pj.grupo);
    if (pelo) grupo.add(pelo.grupo);
    e.dibujar = alfa => {
      if (e.retenido) {
        pj.grupo.visible = false;
        if (pelo) pelo.grupo.visible = false;
        e._opAnt = undefined;
        return;
      }
      if (!("visible" in e) && !pj.grupo.visible) pj.grupo.visible = true;
      const p = e.posAnt.map((v, i) => v + (e.pos[i] - v) * alfa);
      let dr = e.rot - e.rotAnt;
      dr = Math.atan2(Math.sin(dr), Math.cos(dr));
      pj.ubicar(p[0], p[1], p[2], e.rotAnt + dr * alfa);
      e.inclinar?.(pj.grupo);
      if ("visible" in e) {
        pj.grupo.visible = !!e.visible && !e.borrado;
        const op = e.opacidad ?? 1;
        if (op !== e._opAnt) {
          e._opAnt = op;
          pj.grupo.traverse(o => {
            if (o.material) {
              o.material.transparent = op < 1;
              o.material.opacity = op;
            }
          });
        }
      }
      anim.dibujar(alfa);
      if (pelo) {
        pelo.grupo.visible = pj.grupo.visible;
        if (pelo.grupo.visible) {
          pelo.ubicar(p[0], p[1], p[2], e.rotAnt + dr * alfa);
          pelo.aplicar(pj.reproductor.pose);
        }
      }
      cartel(e);
    };
    return e;
  }
  const enCurso = new Set;
  function retirar(e) {
    if (!e || e._retirado) return;
    e._retirado = true;
    e.pj?.grupo?.removeFromParent();
    e.pj?.dispose?.();
    e.pjPelo?.grupo.removeFromParent();
    e.pjPelo?.dispose?.();
    e.pj?.esqueleto?.dispose?.();
    e.pjPelo?.esqueleto?.dispose?.();
    if (e.cartel) {
      e.cartel.s.removeFromParent();
      e.cartel.tex?.dispose?.();
      e.cartel.s.material?.dispose?.();
    }
    try {
      e.sonLoop?.parar?.();
    } catch {}
    try {
      e.alRetirar?.();
    } catch (err) {
      console.warn("alRetirar", err.message);
    }
    if (e.w && typeof e.w.cuadros === "number") e.w.cuadros = Math.max(1, e.w.cuadros);
    if (typeof e.tCuadros === "number") e.tCuadros = Math.max(1, e.tCuadros);
    enCurso.delete(e);
  }
  function limpiar() {
    for (const e of [ ...enemigos, ...enCurso ]) retirar(e);
    enCurso.clear();
    if (enCombate) {
      enCombate = false;
      try {
        son()?.combate?.(false);
      } catch {}
    }
    for (const c of charcos) {
      c.malla?.removeFromParent();
      if (c.malla?.geometry !== geoCharco) c.malla?.geometry?.dispose?.();
    }
    enemigos.length = 0;
    pendientes.length = 0;
    charcos.length = 0;
    const ag = api.agarradoPor;
    m.grupo.walkAttackInvalid = 0;
    api.agarradoPor = null;
    if (ag) {
      try {
        api.alSoltarHenry?.(ag);
      } catch {}
    }
  }
  const otraSala = new Map;
  const enEspera = [];
  const NUM_ETAPA = {
    rl: 1,
    sb: 2,
    fr: 3,
    mz: 4,
    bd: 5,
    ie: 6,
    hs: 7,
    cm: 8
  };
  const PART_SB1 = [ 0, -1, 1, -1, 1, 1, -1, 2, 2, 2, -1, 2, 2, 4, 3, -1, 2, -1, 2, -1, 3, 2, 3, 3, -1, 1, 0, 0 ];
  const PART_SB2 = [ 0, -1, -1, 1, 1, -1, -1, -1, -1, 1, -1, -1, 2, -1, 2, 1, 1, 1, -1, -1, 1, 1, 2, -1, -1, 1, 0, 0 ];
  const PART_MZ1 = [ 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 0, 6, 4, 1, 5, 5, 5, 5, 5, 0, 6, 6, 4 ];
  function particion(etapa, escena, mitad2) {
    const en = (l, r) => l.includes(escena) ? r : null;
    switch (etapa) {
     case 2:
      return (mitad2 ? PART_SB2 : PART_SB1)[escena] ?? 0;

     case 3:
      return mitad2 ? en([ 4, 5, 6, 7, 8 ], 3) ?? en([ 11 ], 2) ?? en([ 14, 15, 19 ], 1) ?? en([ 20, 21, 22, 24 ], 4) ?? -1 : en([ 1, 15, 18 ], 1) ?? -1;

     case 4:
      return mitad2 ? en([ 31, 33 ], 1) ?? en([ 32, 36, 37, 38, 40 ], 2) ?? -1 : PART_MZ1[escena] ?? 0;

     case 5:
      return mitad2 ? en([ 2, 3, 8, 16, 22 ], 2) ?? en([ 7, 10, 23, 28 ], 1) ?? -1 : en([ 7, 10, 13, 16, 20, 26 ], 1) ?? -1;

     case 6:
      return en([ 3, 6, 7, 8, 9 ], 1) ?? en([ 13, 18 ], 2) ?? en([ 15, 22 ], 3) ?? -1;

     case 7:
      return en([ 1, 3, 23, 33, 34 ], 1) ?? -1;

     case 8:
      return -1;

     default:
      return 0;
    }
  }
  function puedeSeguir(reg, etapa, escena, mitad2, b, zHenry) {
    if (reg.etapaNum !== etapa) return false;
    const c = reg.tipo, pViejo = particion(etapa, reg.escena, mitad2);
    let r = particion(etapa, escena, mitad2);
    switch (etapa) {
     case 2:
      if (!mitad2) {
        r = -1;
        if (escena === 7) {
          if (c === 0 || c === 3) r = b(314) ? -1 : 0;
        } else if ([ 8, 9, 21 ].includes(escena)) r = b(311) ? -1 : 0; else if (escena === 12) r = c === 3 ? 0 : -1;
      } else if (escena === 3) {
        if (zHenry < 150) r = -1;
      } else if ([ 7, 8, 9, 11, 16, 17, 21 ].includes(escena)) r = -1; else if ([ 12, 14, 22 ].includes(escena)) r = c === 3 ? 0 : -1;
      break;

     case 3:
      if (!mitad2) break;
      if (escena === 11 && !b(532)) {
        r = -1;
        break;
      }
      if (c === 2 || c === 3) r = escena === 11 ? 0 : -1; else if (c === 0) r = escena === 3 || escena === 4 ? 0 : -1;
      break;

     case 5:
      r = -1;
      if (!mitad2) {
        if (c === 1 && [ 13, 16, 20 ].includes(escena)) r = 0; else if (c === 2 && [ 7, 10, 13, 16, 26 ].includes(escena)) r = 0;
      } else if (c === 1 && [ 10, 21, 23, 28 ].includes(escena)) r = 0; else if (c === 2 && [ 7, 10, 21, 23, 28 ].includes(escena)) r = 0;
      break;

     case 6:
      r = c === 0 && [ 11, 13, 18 ].includes(escena) ? 0 : -1;
      break;

     case 8:
      r = !b(1192) && c === 0 && escena === 5 ? 0 : -1;
      break;
    }
    return !(pViejo !== 0 && r !== 0 && (pViejo !== r || r === -1));
  }
  function esperaEscena(etapa, escena, mitad2, b) {
    if (etapa === 4 && [ 3, 13, 23 ].includes(escena) && (api.nivel ?? 1) < 2) return null;
    if (etapa === 5) {
      if (escena === 8) return 30;
      if (escena === 10) return 10;
      if (escena === 16 && !mitad2) return b(935) ? 10 : null;
    }
    return 0;
  }
  function guardarSeguidores() {
    if (!salaActual) return;
    const etapa = salaActual.base.slice(0, 2), escena = parseInt(salaActual.base.slice(2, 4), 10) || 0;
    for (const e of enemigos) {
      if (e.tipo !== "MULTI" || e.retenido || e.paso === 16 || e.paso === 17) continue;
      const clave = e.claveSala || `${salaActual.base}:${e.id}`;
      otraSala.set(clave, {
        clave: clave,
        def: e.def,
        id: e.id,
        etapa: etapa,
        etapaNum: NUM_ETAPA[etapa] ?? 0,
        escena: escena,
        mitad: salaActual.mitad,
        posEtapa: caminos.aEtapa(e.pos),
        rot: e.rot,
        hp: e.hp,
        hpMax: e.hpMax,
        tipo: e.tipoParam || 0,
        abajo: e.caido?.() ? Math.max(0, (e.w?.tExorc || 0) - (e.w?.timer || 0)) : 0
      });
    }
    for (const x of enEspera) {
      x.reg.escena = escena;
      x.reg.hp = x.hp;
      otraSala.set(x.reg.clave, x.reg);
    }
    enEspera.length = 0;
  }
  function revisarSeguidores(base, mitad) {
    const etapa = base.slice(0, 2), escena = parseInt(base.slice(2, 4), 10) || 0, etapaNum = NUM_ETAPA[etapa] ?? 0;
    const b = n => !!api.bandera?.(n);
    for (const reg of [ ...otraSala.values() ]) {
      if (reg.etapa !== etapa) {
        otraSala.delete(reg.clave);
        continue;
      }
      if (reg.mitad !== mitad) continue;
      if (!puedeSeguir(reg, etapaNum, escena, mitad === 2, b, jug.pos[2])) continue;
      const espera = esperaEscena(etapaNum, escena, mitad === 2, b);
      if (espera == null) continue;
      otraSala.delete(reg.clave);
      enEspera.push({
        reg: reg,
        hp: reg.hp,
        abajo: reg.abajo || 0,
        espera: espera,
        armando: false
      });
    }
  }
  function cuadroSeguidores() {
    const lvl = Math.max(0, Math.min(4, api.nivel ?? 1));
    for (const x of [ ...enEspera ]) {
      if (x.armando || estadia < x.espera) continue;
      if (x.abajo > 0) {
        x.abajo = Math.max(0, x.abajo - DT);
        continue;
      }
      if (x.hp < x.reg.hpMax) {
        x.hp = Math.min(x.reg.hpMax, x.hp + (3 << lvl) * DT);
        continue;
      }
      if (Math.random() >= .05) continue;
      x.armando = true;
      const yo = cargando;
      crear(x.reg.def, () => yo === cargando).then(e => {
        const i = enEspera.indexOf(x);
        if (!e || yo !== cargando || i < 0) {
          if (e) retirar(e);
          x.armando = false;
          return;
        }
        enEspera.splice(i, 1);
        e.claveSala = x.reg.clave;
        e.seguidor = true;
        e.id = `${x.reg.id}@${x.reg.clave.split(":")[0]}`;
        const p = caminos.aEscena(x.reg.posEtapa);
        e.pos = [ p[0], jug.pos[1], p[2] ];
        e.posAnt = [ ...e.pos ];
        e.rot = x.reg.rot;
        e.rotAnt = e.rot;
        e.hp = x.hp;
        if (e.w) e.w.alturaObj = e.pos[1];
        e.pasoA?.(8);
        e.cond = 13;
        e.visible = false;
        e.tipoCl = 7;
        enCurso.delete(e);
        enemigos.push(e);
        e.dibujar(1);
      }).catch(err => {
        x.armando = false;
        console.warn("seguidor", err.message);
      });
    }
  }
  api.otraSala = () => [ ...otraSala.values() ].map(r => ({
    clave: r.clave,
    escena: r.escena,
    hp: Math.round(r.hp)
  }));
  api.enEspera = () => enEspera.map(x => ({
    clave: x.reg.clave,
    hp: Math.round(x.hp),
    espera: x.espera
  }));
  api.alCargarSala = async function(nombreSala, {mitad: mitad = 1} = {}) {
    const yo = ++cargando;
    guardarSeguidores();
    limpiar();
    jugAnt = null;
    velJug = 0;
    await cargarDatos();
    m.datosHyena = datos.hyena;
    const base = String(nombreSala).slice(0, 4);
    const s = datos.salas[base];
    if (salaActual && salaActual.base.slice(0, 2) !== base.slice(0, 2)) bins.clear();
    salaActual = {
      nombre: nombreSala,
      base: base,
      mitad: mitad,
      datos: s
    };
    estadia = base.startsWith("hs") ? {
      3: 2,
      23: 2,
      33: 2,
      32: 3
    }[parseInt(base.slice(2, 4), 10)] ?? 0 : 0;
    try {
      await caminos.alCargarEscena(base.slice(0, 2), parseInt(base.slice(2, 4), 10) || 0, {
        bandera: n => !!api.bandera?.(n)
      });
      if (yo !== cargando) return null;
      caminos.dibujar(grupo);
    } catch (err) {
      console.warn("caminos", err.message);
    }
    if (!s) return {
      enemigos: 0,
      pendientes: 0
    };
    const lista = (mitad === 2 ? s.mitad2 : s.mitad1) || [];
    const nuevos = [];
    for (const def of lista) {
      if (!IA[tipoIA(def)] || IA[tipoIA(def)].sin?.(def)) {
        pendientes.push(def);
        continue;
      }
      if (otraSala.has(`${base}:${def.enemigo}_${def.indice}`)) continue;
      let e = null;
      try {
        e = await crear(def, () => yo === cargando);
      } catch (err) {
        console.warn("enemigo", def.enemigo, err.message);
        if (yo === cargando) pendientes.push(def);
      }
      if (yo !== cargando) {
        if (e) retirar(e);
        return null;
      }
      if (e) nuevos.push(e);
    }
    enemigos.push(...nuevos);
    for (const e of nuevos) enCurso.delete(e);
    leerJugador();
    revisarSeguidores(base, mitad);
    leerJugador();
    for (const e of enemigos) if (e.tipo === "HYENA" && e.paso === 17 && !e.retenido) e.tick();
    for (const e of enemigos) e.dibujar(1);
    if (pendientes.length) console.info("enemigos sin IA todavía:", pendientes.map(d => d.enemigo).join(", "));
    return {
      enemigos: enemigos.length,
      pendientes: pendientes.length
    };
  };
  const vH = new THREE.Vector3;
  function paraHenry(e) {
    const a = e.paraHenry || (e.paraHenry = {
      enemigo: e,
      id: e.id,
      posicion: new THREE.Vector3,
      radio: 0,
      alto: 0,
      centroGolpe: () => e.centro ? vH.set(-e.centro[0] * escala, -e.centro[1] * escala, e.centro[2] * escala) : vH.copy(a.posicion).add(new THREE.Vector3(0, (e.centroAlto ?? (e.alto || 100) / 2) * escala, 0))
    });
    a.posicion.copy(e.pj.grupo.position);
    if (e.puntoGolpe) {
      const q = e.puntoGolpe();
      a.posicion.set(-q[0] * escala, (-q[1] - (e.centroAlto ?? 0)) * escala, q[2] * escala);
    }
    a.radio = (e.radioGolpe ?? e.radio) * escala;
    a.alto = (e.alto || 100) * escala;
    a.caido = !!e.caido?.();
    a.muerto = e.cond === COND.DEAD || !!e.intocable?.();
    a.vida = e.hp;
    a.tipo = e.tipo;
    return a;
  }
  api.extras = [];
  api.paraHenry = () => [ ...enemigos.filter(e => !e.retenido), ...(api.extras || []).filter(x => x.pj) ].map(paraHenry).filter(a => !a.muerto);
  api.golpeDeHenry = function(a, danio, tipoDanio, info = {}) {
    const e = a?.enemigo || a;
    if (!e?.recibir) return;
    const golpe = info.golpe || tipoDanio;
    api.recibirGolpe(e, danio, golpe, {
      shock: info.shock
    });
    if (!e.sinSangre) {
      const c = a.centroGolpe ? a.centroGolpe() : api.posicion(e), dirH = rumboHacia(e.pos, jug.pos);
      try {
        fx()?.disparar?.("sangre", {
          posMundo: [ c.x, c.y, c.z ],
          dir: [ Math.sin(dirH), 0, Math.cos(dirH) ],
          tam: 400
        });
      } catch {}
    }
  };
  if (conectarHenry && henry?.ponerEnemigos) {
    henry.ponerEnemigos(() => api.paraHenry());
    henry.ponerRecibirGolpe?.((a, danio, tipo, info) => api.golpeDeHenry(a, danio, tipo, info));
  }
  let enCombate = false;
  function sonidosCuadro(e) {
    const S = son();
    if (!S) return;
    if (e.sonLoop?.mover) e.sonLoop.mover(e.posSonido ? api.posicion({
      pos: e.posSonido
    }) : e.pj.grupo.position);
    if (e.sinPasos || !S.pasoEnemigo || !e.anim.anim) return;
    const mitad = Math.floor(e.anim.t * 2 / e.anim.dur), anda = distXZ(e.pos, e.posAnt) > 1.5;
    if (anda && e.faseAnt != null && mitad !== e.faseAnt) try {
      S.pasoEnemigo(e.pj.grupo.position);
    } catch {}
    e.faseAnt = mitad;
  }
  function combate() {
    const c = enemigos.some(e => !e.retenido && e.cond !== COND.DEAD && e.persigue?.() && dist3(e.pos, jug.pos) < 6e3);
    if (c !== enCombate) {
      enCombate = c;
      try {
        son()?.combate?.(c);
      } catch {}
    }
  }
  api.enCombate = () => enCombate;
  function tick() {
    estadia += DT;
    if (enEspera.length) cuadroSeguidores();
    leerJugador();
    if (m.grupo.walkAttackInvalid > 0) m.grupo.walkAttackInvalid--;
    leerEileen();
    for (const e of enemigos) {
      if (e.retenido) continue;
      objetivo = elegirObjetivo(e);
      e.tick();
      sonidosCuadro(e);
    }
    objetivo = jug;
    combate();
    for (const c of charcos) if (c.crece && c.malla) {
      c.tam = Math.min(c.radio, c.tam + Math.sqrt(Math.max(0, (c.radio - c.tam) / c.radio)) * DT * 15);
      c.malla.scale.setScalar(Math.max(.001, c.tam * escala));
      if (c.tam >= c.radio) c.crece = false;
    }
  }
  api.actualizar = function(dt) {
    if (!enemigos.length || api.pausa) return false;
    acumulado += Math.min(dt, .25);
    let n = 0;
    while (acumulado >= DT && n < 8) {
      tick();
      acumulado -= DT;
      n++;
    }
    const alfa = acumulado / DT;
    for (const e of enemigos) e.dibujar(alfa);
    return true;
  };
  api.simular = function(seg) {
    const n = Math.round(seg * FPS);
    for (let i = 0; i < n; i++) tick();
    acumulado = 0;
    for (const e of enemigos) e.dibujar(1);
  };
  api.recibirGolpe = function(enemigo, danio, tipo = "BAK_PLAYER_PIPE", extra = {}) {
    if (!enemigo) return false;
    let g = null;
    const t = String(tipo).toUpperCase();
    if (t === "PISOTON" || t === "FINISH") g = golpes?.find(x => x.golpe === "BAK_PLAYER_FINISH"); else g = golpes?.find(x => x.golpe === t || x.golpe === "BAK_PLAYER_" + t);
    const bdt = g ? bdtIndice(g.tipo_danio) : bdtIndice(t);
    const ATR = [ "BAA_UNDEFINED", "BAA_NOTHING", "BAA_STAB", "BAA_HIT", "BAA_CUT", "BAA_SHOOT", "BAA_EXORCISM", "BAA_EXORCISM_SHOOT", "BAA_FINISH" ];
    let dir = extra.dir;
    if (!dir) {
      const a = rumboHacia(enemigo.pos, jug.pos);
      dir = [ Math.sin(a), 0, Math.cos(a) ];
    } else if (dir.length === 2) dir = [ dir[0], 0, dir[1] ];
    enemigo.recibir({
      danio: danio ?? g?.danio ?? 10,
      bdt: bdt,
      golpe: g?.golpe || t,
      atributo: g ? Math.max(0, ATR.indexOf(g.atributo)) : 3,
      kind: g ? g.indice : null,
      shock: extra.shock ?? g?.shock ?? 40,
      dir: dir,
      pos: extra.pos || null
    });
    return true;
  };
  api.masCercano = function(v, radio = 2) {
    const p = aJuego(v);
    let mejor = null, dm = radio / escala;
    for (const e of enemigos) {
      if (e.cond === COND.DEAD || e.retenido) continue;
      const d = distXZ(e.pos, p);
      if (d < dm) {
        dm = d;
        mejor = e;
      }
    }
    return mejor;
  };
  api.retener = function(pred) {
    let n = 0;
    for (const e of enemigos) if (pred(e)) {
      e.retenido = true;
      e.pj.grupo.visible = false;
      if (e.pjPelo) e.pjPelo.grupo.visible = false;
      n++;
    }
    for (let i = charcos.length - 1; i >= 0; i--) {
      const c = charcos[i];
      if (!c.de?.retenido) continue;
      c.malla?.removeFromParent();
      charcos.splice(i, 1);
      if (c.de.w) c.de.w.setBlood = 0;
    }
    return n;
  };
  api.soltarRetenidos = function() {
    const sueltos = enemigos.filter(e => e.retenido);
    for (const e of sueltos) e.retenido = false;
    if (!sueltos.length) return 0;
    leerJugador();
    for (const e of sueltos) if (e.tipo === "HYENA" && e.paso === 17) e.tick();
    for (const e of sueltos) e.dibujar(1);
    return sueltos.length;
  };
  api.retenidos = () => enemigos.filter(e => e.retenido).map(e => e.id);
  api.posicion = e => new THREE.Vector3(-e.pos[0] * escala, -e.pos[1] * escala, e.pos[2] * escala);
  api.resumen = () => enemigos.map(e => ({
    id: e.id,
    paso: IA[e.tipo]?.pasos?.[e.paso] || e.paso,
    sub: e.sub,
    hp: +e.hp.toFixed(1),
    anim: e.anim.nombre,
    cuadro: e.anim.cuadro,
    pos: e.pos.map(v => Math.round(v)),
    rumbo: +e.rot.toFixed(2),
    objetivo: e.w?.target,
    dJugador: Math.round(dist3(e.pos, jug.pos))
  }));
  api.jugador = jug;
  api.eileenVista = eil;
  api.grupo = grupo;
  api.sala = () => salaActual;
  return api;
}
