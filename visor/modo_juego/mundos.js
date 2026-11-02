// SH4 web — FeniXVOID · Project Ravenlight
import * as THREE from "three";

import { bajar, json, q, EQUIPO_CHICO } from "./motor.js";

import { leerMensajes } from "./fuente.js";

import { leerTablaSubtitulos } from "../lib/subtitulos.js";

import { armarSala, crearLucesPersonajes, ESCALA } from "../lib/sala.js";

import { crearPiso } from "../lib/colision.js";

import { partesBin } from "../lib/sh4bin.js";

import { leerModelo } from "../lib/modelo.js";

import { leerTexturas } from "../lib/texturas.js";

import { leerAnimacion } from "../lib/animacion.js";

import { crearPersonaje } from "../lib/personaje.js";

import { crearCine } from "./cine_juego.js";

import { crearVelasDemo } from "../efectos/objetos_demo.js";

import { iniciarHenry } from "../henry.js";

import { municionPorDefecto } from "../jugador/datos.js";

import { iniciarEnemigos } from "../enemigos/enemigos.js";

import { iniciarCamaraJuego, fovVertical } from "../camara_juego.js";

import { imagenJuego } from "../suite_juego.js";

import { crearGuion } from "./guion_comun.js";

import * as P from "./pantallas.js";

import { MUNDOS, ORDEN } from "./subte.js";

import { BOSQUE } from "./bosque.js";

MUNDOS.fr = BOSQUE;

import { PRISION } from "./prision.js";

MUNDOS.mz = PRISION;

import { EDIFICIO } from "./edificio.js";

MUNDOS.bd = EDIFICIO;

import { PRISION_2 } from "./prision2.js";

import { EDIFICIO_2 } from "./edificio2.js";

MUNDOS.mz = PRISION_2;

MUNDOS.bd = EDIFICIO_2;

import { DEPARTAMENTOS } from "./departamentos.js";

MUNDOS.ie = DEPARTAMENTOS;

if (!ORDEN.includes("ie")) ORDEN.push("ie");

import { HOSPITAL, ESCALERA } from "./hospital.js";

MUNDOS.hs = HOSPITAL;

import { ESCALERA as ESCALERA_ST, haciaEscalera } from "./escalera.js";

MUNDOS.st = ESCALERA_ST || ESCALERA;

if (!ORDEN.includes("hs")) ORDEN.push("hs");

import { FINAL } from "./final.js";

MUNDOS.ls = FINAL;

import { SUBTE_2 } from "./subte2.js";

import { BOSQUE_2 } from "./bosque2.js";

import { DEPARTAMENTOS_PASADO } from "./cm.js";

import { crearMaldicionMundos } from "./maldicion_mundos.js";

MUNDOS.sb = SUBTE_2;

MUNDOS.fr = BOSQUE_2;

MUNDOS.cm = DEPARTAMENTOS_PASADO;

import { crearManejoEileen, entrarEscena, guardadoNuevo, ITEM_A_ARMA, escenasConectadas, lugarDeEntrada } from "../enemigos/eileen.js";

import { marcarModelo, seRepite } from "../lib/repetidos_demo.js";

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

const OJOS = 1.6;

const OJOS_302 = 1.65;

const RADIO = .25, PASO = .45;

const VEL = {
  caminar: 1.95,
  correr: 3.9,
  guardia: 9.1 * 30 * ESCALA
};

const aMundo = p => new THREE.Vector3(-p[0] * ESCALA, -p[1] * ESCALA, p[2] * ESCALA);

const aJuego = v => [ -v.x / ESCALA, -v.y / ESCALA, v.z / ESCALA ];

const OBJETOS_EXE = {
  "0x4e5ee0": {
    arch: "cm11.bin",
    m: 5,
    t: 8,
    a: 7
  },
  "0x4e5f70": {
    arch: "cm11.bin",
    m: 6,
    t: 9
  },
  "0x4e6000": {
    arch: "cm12.bin",
    m: 18,
    t: 9
  },
  "0x4e6090": {
    arch: "cm12.bin",
    m: 16,
    t: 8,
    a: 17,
    giro: Math.PI
  },
  "0x4e5640": {
    arch: "cm16.bin",
    m: 6,
    t: 7,
    pos: [ 65.274, -100.051, -431.505 ],
    giro: 2 * Math.atan2(.68718, .72648)
  },
  "0x4e6150": {
    arch: "cm24.bin",
    m: 8,
    t: 11,
    a: 7,
    giro: 2 * Math.atan2(.99681, .07945)
  },
  "0x4e6210": {
    arch: "cm24.bin",
    m: 6,
    t: 10
  }
};

const CARNE = (arch, filas, cnsts) => Object.fromEntries(cnsts.map((c, i) => {
  const [m, t, a, pos] = filas[i];
  return [ c, {
    arch: arch,
    m: m,
    t: t,
    a: a,
    pos: pos
  } ];
}));

const CARNE_PAREDES = {
  ...CARNE("cm01.bin", [ [ 15, 10, 16, [ -2.86, -866.42, 1300.24 ] ], [ 17, 11, 18, [ -1079.95, -866.42, -97.85 ] ], [ 19, 12, 20, [ 890.16, -723.65, -187.11 ] ], [ 21, 13, 22, [ 568.57, -209.85, 241.05 ] ] ], [ "0x4e64a0", "0x4e64d0", "0x4e6510", "0x4e6550" ]),
  ...CARNE("cm02.bin", [ [ 11, 7, 12, [ 0, 0, 1138.42 ] ], [ 13, 8, 14, [ 0, 0, 3837.8 ] ], [ 15, 9, 16, [ 0, 0, 7712.43 ] ], [ 17, 10, 18, [ -2108.27, 0, -5.15 ] ] ], [ "0x4e6600", "0x4e6630", "0x4e6670", "0x4e66b0" ]),
  ...CARNE("cm03.bin", [ [ 20, 17, 21, [ 0, 0, 1819.37 ] ], [ 22, 18, 23, [ 0, 0, 3837.8 ] ], [ 24, 19, 25, [ 1598.03, 0, -5.15 ] ] ], [ "0x4e6760", "0x4e6790", "0x4e67d0" ]),
  ...CARNE("cm11.bin", [ [ 14, 10, 15, [ 0, 0, 1138.42 ] ], [ 16, 11, 17, [ 0, 0, 3837.8 ] ], [ 18, 12, 19, [ 0, 0, 7712.43 ] ], [ 20, 13, 21, [ -2108.27, 0, -5.15 ] ] ], [ "0x4e6880", "0x4e68b0", "0x4e68f0", "0x4e6930" ]),
  ...CARNE("cm12.bin", [ [ 10, 5, 11, [ 0, 0, 1138.42 ] ], [ 12, 6, 13, [ 0, 0, 3837.8 ] ], [ 14, 7, 15, [ 684.29, -8.58, -36.7 ] ] ], [ "0x4e69e0", "0x4e6a10", "0x4e6a50" ]),
  ...CARNE("cm24.bin", [ [ 16, 12, 17, [ 0, 0, 1138.42 ] ], [ 18, 13, 19, [ 0, 0, 3837.8 ] ], [ 20, 14, 21, [ 0, 0, 7712.43 ] ], [ 22, 15, 23, [ -2108.27, 0, -5.15 ] ] ], [ "0x4e6b00", "0x4e6b30", "0x4e6b70", "0x4e6bb0" ])
};

const pad3 = n => String(n).padStart(3, "0");

const giroCamara = a => Math.atan2(Math.sin(a), -Math.cos(a));

export async function seguirEnLosMundos(juego, ctx) {
  ctx.callar302?.();
  const mundo = await prepararMundos(juego, ctx);
  juego.mundo = mundo;
  let atajo = q.get("mundo"), siguiente = null;
  for (;;) {
    ctx.callar302?.();
    const dest = juego.dias302?.ultimoDestino;
    const etapa = siguiente?.aEtapa || (atajo && MUNDOS[atajo.slice(0, 2)] ? atajo.slice(0, 2) : dest?.etapa && MUNDOS[dest.etapa] ? dest.etapa : ORDEN.find(e => !ctx.F(MUNDOS[e].terminado)) || "sb");
    if (juego.dias302) juego.dias302.ultimoDestino = null;
    const r = await mundo.jugar(etapa, {
      atajo: atajo,
      llegada: siguiente ? {
        escena: siguiente.escena,
        pos: siguiente.pos,
        rot: siguiente.rot
      } : !atajo && dest?.llegada && dest.etapa === etapa ? dest.llegada : null
    });
    atajo = null;
    siguiente = null;
    if (r?.aEtapa && MUNDOS[r.aEtapa]) {
      siguiente = r;
      continue;
    }
    if (!r?.volver302) return r;
    await mundo.volverAl302(r);
    const r2 = await ctx.jugarLibre();
    if (!r2?.aSubte) return r2;
  }
}

async function prepararMundos(juego, ctx) {
  const {M: M, fuente: fuente} = juego;
  const estado = juego.estado || (() => {});
  const L = juego.IDIOMA || "s";
  const F = n => !!ctx.F(n);
  const prender = n => {
    if (n) ctx.prender(n);
  };
  const cont = ctx.cuarto.grupo;
  const amb = juego.ambiente || {};
  function mostrarTitulo(t) {
    cont.visible = !t;
    if (t) {
      const g = M.pantalla.g;
      P.limpiar(g);
      fuente.escribir(g, t, P.W / 2, P.H / 2, {
        escala: P.ESC,
        alinear: "centro",
        color: "#cfc4b4"
      });
      M.pantalla.mostrar();
      M.pantalla.actualizar();
      M.ponerVelo(0);
    } else {
      M.ponerVelo(1);
      M.pantalla.ocultar();
    }
  }
  estado("cargando el mundo…");
  const [ESC, MD, DJ, PC, DS, JJ, exe, itemBin, memoBin, roomBin] = await Promise.all([ json("/datos/escenas.json"), json("./mundos_datos.json"), json("/datos/demos.json"), json("/datos/personajes_cine.json"), json("/datos/demos_salas.json"), json("/datos/juego.json"), bajar("SILENT HILL 4.exe"), bajar(`data/message_item_msg_${L}.bin`).catch(() => null), bajar(`data/message_memo_msg_${L}.bin`).catch(() => null), bajar(`data/message_room0_${L}.bin`).catch(() => null) ]);
  const tablaSubs = leerTablaSubtitulos(exe) || [];
  const mItem = itemBin ? leerMensajes(itemBin)[0] || [] : [], mMemo = memoBin ? leerMensajes(memoBin)[0] || [] : [];
  const paquetes = {
    4: roomBin ? leerMensajes(roomBin) : []
  };
  const MODELOS_ITEM = new Map((JJ?.modelos_items?.filas || []).map(f => [ f.id, f ]));
  const rig = new THREE.Group;
  rig.name = "Henry (ojos)";
  M.escena.add(rig);
  let colision = null;
  const getColision = () => colision;
  estado("cargando a Henry…");
  let cambiarVista = () => {};
  const opcionesHenry = {
    THREE: THREE,
    escena: M.escena,
    camara: M.camara,
    jugador: rig,
    ojos: OJOS,
    getColision: getColision,
    renderer: M.renderer,
    teclasInventario: [ "KeyI" ],
    camaraExterna: () => true,
    controlarCamara: false,
    pantallaGameOver: false,
    botonesAbajo: M.tactil ? 250 : 186,
    botonesAlLado: 186,
    alVista: () => cambiarVista()
  };
  const henry = await iniciarHenry(opcionesHenry).catch(async e => {
    console.warn("Henry, segundo intento:", e.message);
    await M.esperar(1);
    return iniciarHenry(opcionesHenry);
  });
  henry.personaje.grupo.visible = false;
  if (henry.botones) henry.botones.visibles = false;
  const ctl = henry.controlador;
  {
    const nv = Math.max(1, Math.min(3, juego.nivel ?? 2));
    ctl.s.nivel = nv;
    ctl.s.dificultad = [ "facil", "facil", "normal", "dificil" ][nv];
  }
  const enemigos = iniciarEnemigos({
    THREE: THREE,
    escena: M.escena,
    jugador: rig,
    henry: henry,
    getColision: getColision,
    escala: ESCALA,
    ojos: OJOS,
    nivel: q.has("nivel") ? +q.get("nivel") : Math.max(0, Math.min(4, juego.nivel ?? 1)),
    sonido: amb.son || null,
    efectos: amb.fx || null,
    bajar: bajar
  });
  enemigos.verEstados = q.has("verIA");
  henry.conectarAgarres?.(enemigos);
  Object.assign(enemigos, {
    bandera: n => F(n),
    escenaActual: () => escena,
    camara: M.camara,
    arrastrarJugador: (e, dx, dz) => {
      const d = Math.hypot(dx, dz);
      if (d > 1e-6) empujar(new THREE.Vector3(-dx / d, 0, dz / d), d * ESCALA);
    },
    girarJugador: (e, rumbo) => {
      ctl.m.rumbo = ctl.m.cuerpo = ctl.m.deseado = rumbo;
    }
  });
  const cj = iniciarCamaraJuego({
    THREE: THREE,
    camara: M.camara,
    jugador: M.jugador,
    henry: henry,
    getColision: getColision,
    escala: ESCALA,
    ojos: OJOS,
    renderer: M.renderer
  });
  cj.activar(true);
  const sh4 = window.sh4 = window.sh4 || {};
  Object.assign(sh4, {
    renderer: M.renderer,
    camaraJuego: cj,
    sonido: amb.son || null,
    efectos: amb.fx || null,
    enemigos: enemigos
  });
  const PARTIDA = ctx.PARTIDA;
  let henryCargado = false;
  function traerInventario() {
    if (PARTIDA.henry && !henryCargado) {
      for (const [k, n, dur] of PARTIDA.henry.lugares || []) {
        henry.agregarItem(k, n);
        const l = henry.inventario?.lugares.find(x => x.k === k);
        if (l && dur != null) l.dur = dur;
      }
      for (const k of PARTIDA.henry.notas || []) henry.agregarItem(k, 1);
      const cg = PARTIDA.henry.cargador;
      if (cg) {
        for (const k of [ 16, 17 ]) if (cg[k] != null) ctl.s.cargador[k] = cg[k];
        if (cg.bala) ctl.s.bala = cg.bala;
      }
      if (PARTIDA.henry.arma) henry.equipar(PARTIDA.henry.arma);
    }
    if (PARTIDA.henry?.vida > 0) ctl.s.vida = Math.min(ctl.s.vidaMax || 100, PARTIDA.henry.vida);
    if (henryCargado) for (const k of PARTIDA.quitarDeHenry || []) henry.inventario?.quitar(k);
    PARTIDA.quitarDeHenry = [];
    const vistos = PARTIDA.inventarioVisto || 0;
    for (const k of (PARTIDA.inventario || []).slice(vistos)) henry.agregarItem(k, 1);
    PARTIDA.inventarioVisto = (PARTIDA.inventario || []).length;
    henryCargado = true;
    if (q.has("armas") && !henry.inventario?.cuantos(henry.ITEM.PISTOLA)) {
      for (const [k, n] of [ [ henry.ITEM.TUBERIA, 1 ], [ henry.ITEM.PISTOLA, 1 ], [ henry.ITEM.BALAS_PISTOLA, 15 ], [ henry.ITEM.BEBIDA, 2 ], [ henry.ITEM.BOTIQUIN, 1 ] ]) henry.agregarItem(k, n);
    }
    if (!ctl.s.arma) {
      const a = henry.inventario?.lugares.find(l => henry.datos.esArma(l.k));
      if (a) henry.equipar(a.k);
    }
  }
  function guardarInventario() {
    const inv = henry.inventario;
    PARTIDA.henry = {
      lugares: (inv?.lugares || []).map(l => [ l.k, l.n, l.dur ]),
      notas: [ ...inv?.notas || [] ],
      vida: ctl.s.vida,
      arma: ctl.s.arma,
      cargador: {
        16: ctl.s.cargador[16] ?? null,
        17: ctl.s.cargador[17] ?? null,
        bala: ctl.s.bala
      }
    };
  }
  let mEtapa = [];
  const texto = (archivo, n) => {
    if (archivo === 0) return juego.textoComun?.(n) ?? "";
    if (archivo === 1 || archivo === 3) return mItem[n] ?? "";
    if (archivo === 2) return mMemo[n] ?? "";
    const p = paquetes[archivo];
    return p?.[0]?.[n] ?? (archivo === 4 ? "" : mEtapa[n] ?? "");
  };
  const decir = (l, o) => juego.decir(l, o);
  function mostrarSub(t) {
    P.dibujarMensaje(M.cartel.g, fuente, t || "", {});
    if (t) M.cartel.mostrar(); else M.cartel.ocultar();
  }
  const ABAJO = new THREE.Vector3(0, -1, 0), tmp = new THREE.Vector3;
  const pisoComun = crearPiso(THREE, ESCALA);
  function pisoEn(p) {
    return pisoComun.visor(colision, p.x, p.y, p.z, .3, 5.7);
  }
  const cine = crearCine({
    M: M,
    bajar: bajar,
    DJ: DJ,
    PC: PC,
    tablaSubs: tablaSubs,
    mensajesPorPaquete: paquetes,
    mostrarSub: mostrarSub,
    pisoEn: pisoEn,
    foco: juego.foco || null,
    alEmpezar: D => amb.demoEmpieza?.(D),
    alTerminar: D => amb.demoTermina?.(D)
  });
  let velH = 0, posAntH = null, tocoPuerta = 0, subEil = "", darEileenOcupado = false;
  function jugadorEileen() {
    const g = henry.personaje.grupo, s = ctl.s, EH = henry.ESTADO || {};
    let est = 1;
    if (s.muerto || s.estado === EH.MUERTE || s.estado === EH.MUERTO) est = 10; else if ([ EH.GOLPE, EH.GOLPE_FUERTE, EH.REMATE, EH.REMATE2 ].includes(s.estado)) est = 5; else if (s.estado === EH.GUARDIA) est = 4; else if (s.estado === EH.PREPARAR) est = 3;
    return {
      existe: true,
      pos: aJuego(g.position),
      rot: -g.rotation.y,
      estado: est,
      vel: velH,
      tocoPuerta: tocoPuerta > 0,
      escenaReal: escena
    };
  }
  function subEileen(t, alfa = 1) {
    const txt = t && alfa > .35 && juego.opciones?.subtitulos !== false ? t : "";
    if (txt === subEil) return;
    subEil = txt;
    mostrarSub(txt);
  }
  const eileen = crearManejoEileen({
    THREE: THREE,
    bajar: bajar,
    padre: cont,
    getColision: getColision,
    escala: ESCALA,
    enfermera: !!PARTIDA.vestidoEileen,
    jugador: jugadorEileen,
    escena: () => ({
      etapa: ETAPA_N[etapa] ?? 0,
      escena: escena ?? 0
    }),
    enemigos: () => enemigos.enemigos,
    golpearEnemigo: (e, golpe, o) => enemigos.recibirGolpe(e, undefined, golpe, o),
    sonido: (id, pos, op) => {
      try {
        return amb.son?.efecto?.(id, pos ? aMundo(pos) : null, op) || null;
      } catch {
        return null;
      }
    },
    mostrarSub: (t, alfa) => subEileen(t, alfa),
    maldicionEn: pos => {
      try {
        return maldicion?.danioEn?.(pos) || 0;
      } catch {
        return 0;
      }
    },
    empujarHenry: v => {
      const d = Math.hypot(v[0], v[2]);
      if (d > 1e-6 && !M.enVR()) empujar(new THREE.Vector3(-v[0] / d, 0, v[2] / d), d * ESCALA);
    }
  });
  enemigos.eileen = eileen;
  const extraEileen = {
    tipo: "EILEEN",
    id: "EILEEN",
    radio: 60,
    alto: 330,
    sinSangre: true,
    cond: 0,
    get pj() {
      return eileen.actual?.pj;
    },
    get pos() {
      return eileen.actual?.pos || [ 0, 0, 0 ];
    },
    caido: () => false,
    intocable: () => !eileen.actual,
    recibir: () => eileen.actual?.golpeDeHenry(aJuego(henry.personaje.grupo.position))
  };
  function salirEileen() {
    const a = eileen.actual;
    if (!a) return;
    try {
      a.salirEscena(jugadorEileen());
    } catch (e) {
      console.warn("Eileen", e.message);
    }
    PARTIDA.eileen = a.g;
    eileen.quitar();
    subEileen("");
  }
  async function entrarEileen(n) {
    const g = PARTIDA.eileen;
    if (!g?.estado) return;
    const conHenry = g.estado === 1;
    if (!entrarEscena(g, {
      etapa: ETAPA_N[etapa] ?? 0,
      escena: +n,
      conectada: s => escenasConectadas(E?.puertas?.puertas_por_escena, ETAPA_N[etapa] ?? 0, s, +n)
    })) return;
    let pos = g.pos, rot = g.rot;
    if (conHenry) {
      const r = ctl.m.cuerpo;
      pos = lugarCerca(r);
      rot = r;
    }
    try {
      await eileen.poner({
        pos: pos,
        rot: rot,
        guardado: g
      });
    } catch (e) {
      console.warn("Eileen", e.message);
    }
  }
  function lugarCerca(r) {
    const pisoJ = crearPiso(THREE, ESCALA);
    const {pos: pos} = lugarDeEntrada({
      pos: aJuego(pies()),
      rot: r,
      etapa: ETAPA_N[etapa] ?? 0,
      escena: escena ?? 0,
      escenaReal: escena ?? 0,
      piso: (q, arriba, abajo) => pisoJ.juego(colision, q, arriba, abajo, .01)
    });
    return pos;
  }
  function actualizarEileen(dt, pausada) {
    if (!eileen.actual) return false;
    const p = henry.personaje.grupo.position;
    if (posAntH) {
      velH = dt > 0 ? posAntH.distanceTo(p) / ESCALA / Math.max(dt * 30, .001) : velH;
      posAntH.copy(p);
    } else posAntH = p.clone();
    if (tocoPuerta > 0) tocoPuerta--;
    if (!pausada) eileen.actualizar(dt);
    return true;
  }
  henry.inventario?.alMensaje?.(t => {
    const inv = henry.inventario;
    if (darEileenOcupado || !t || t !== inv.texto(25)) return;
    const l = inv.lugares[inv.sel], a = eileen.actual;
    if (!l || !ITEM_A_ARMA[l.k] || !a) return;
    darEileenOcupado = true;
    try {
      if (a.darArma(l.k)) inv.mensaje("");
    } finally {
      darEileenOcupado = false;
    }
  });
  const globales = new Map;
  const cacheSalas = new Map, ordenCache = [];
  let E = null, cfg = null, etapa = null, mitad = 1, sala = null, escena = null, nombreSala = null;
  let puertas = [], objetosFijos = [], items = [], eventos = [];
  let ambientePrevia = null;
  function nieblaPersonajes() {
    const ns = amb.fx?.nieblaSala;
    if (!ns) return;
    const parchar = o => {
      if (!o.isMesh || o.userData.matOriginal || o.userData.sinSombra) return;
      for (const m of Array.isArray(o.material) ? o.material : [ o.material ]) if (m && !m.isShaderMaterial && !m.userData?.salaNiebla) ns.parchar(m);
    };
    henry.personaje.grupo.traverse(parchar);
    enemigos.grupo?.traverse(parchar);
    for (const c of cont.children) if (c !== sala?.grupo && !c.isLight) c.traverse(parchar);
  }
  let entrada = null;
  const partesDe = new WeakMap;
  const bin = async a => {
    const b = await bajar("data/" + a);
    let p = partesDe.get(b);
    if (!p) partesDe.set(b, p = partesBin(b));
    return {
      b: b,
      p: p
    };
  };
  async function modelo({arch: arch, m: pm, t: pt, tArch: tArch = null, anim: anim = null, colorFijo: colorFijo = null}) {
    const m = await bin(arch), Mp = m.p[pm];
    const tb = tArch ? await bin(tArch) : m, T = tb.p[pt];
    const cf = colorFijo ? (new THREE.Color).setRGB(colorFijo, colorFijo, colorFijo, THREE.SRGBColorSpace) : null;
    const op = cf ? {
      material: tex => new THREE.MeshBasicMaterial({
        map: tex,
        color: cf,
        side: THREE.DoubleSide,
        alphaTest: .3
      })
    } : {};
    const pj = crearPersonaje(leerModelo(m.b, Mp.ofs, Mp.len), T?.tipo === "texturas" ? leerTexturas(tb.b, T.ofs, T.len) : [], op);
    if (anim) {
      const ma = await bin(anim[0]), A = ma.p[anim[1]];
      if (A?.tipo === "animacion") {
        pj.poner(leerAnimacion(ma.b, A.ofs, A.len));
        pj.reproductor.loop = true;
      }
    }
    marcarModelo(pj.grupo, arch, pm);
    return pj;
  }
  async function salaDe(nombre) {
    const clave = nombre + "#" + mitad;
    if (!cacheSalas.has(clave)) {
      cacheSalas.set(clave, armarSala(THREE, bajar, nombre, globales, {
        mitad: mitad
      }).catch(e => {
        cacheSalas.delete(clave);
        const i = ordenCache.indexOf(clave);
        if (i >= 0) ordenCache.splice(i, 1);
        throw e;
      }));
      ordenCache.push(clave);
      while (ordenCache.length > (EQUIPO_CHICO ? 2 : 4)) {
        const v = ordenCache.shift();
        if (v !== clave) {
          cacheSalas.get(v)?.then(s => s.dispose?.()).catch(() => {});
          cacheSalas.delete(v);
        }
      }
    }
    return cacheSalas.get(clave);
  }
  const salaDeEscena = n => E.salas[String(n)];
  const escenaDeSala = s => +Object.entries(E.salas).find(([, x]) => x === s.slice(0, 4))?.[0];
  async function cargarEscena(n, llegada = {}) {
    const nombre = salaDeEscena(n);
    salirEileen();
    estado("cargando " + nombre + "…");
    const s = await salaDe(nombre);
    cont.clear();
    cont.position.set(0, 0, 0);
    const ambSala = (s.luces || []).find(l => l.tipo === 1 && l.banderas & 1);
    if (ambSala) ambientePrevia = ambSala.color.map(x => x / 255);
    cont.add(s.grupo);
    cont.add(crearLucesPersonajes(THREE, s.luces, {
      ambiente: ambientePrevia
    }));
    sala = s;
    colision = s.colision;
    escena = +n;
    nombreSala = nombre;
    M.escena.background = (new THREE.Color).setRGB(...s.nieblaSala?.activa ? s.colorFondo : [ 0, 0, 0 ], THREE.SRGBColorSpace);
    if (amb.info) {
      amb.info.sala = nombre;
      amb.info.luces = s.luces || [];
      amb.info.niebla = s.nieblaSala?.co ? s.nieblaJuego : null;
    }
    if (!juego.demoActual) {
      amb.son?.cinematica?.(false);
    }
    try {
      amb.fx?.alCargarSala(nombre);
    } catch (e) {
      console.warn("efectos", e);
    }
    amb.son?.alCargarSala(nombre, {
      mitad: mitad
    })?.catch?.(() => {});
    puertas = (E.puertas?.puertas_por_escena?.[String(n)] || []).map(p => ({
      ...p,
      caja: (new THREE.Box3).setFromPoints([ aMundo(p.caja_min), aMundo(p.caja_max) ]).expandByScalar(p.door_type === 2 ? .35 : .6)
    }));
    await ponerObjetos(n);
    eventos = eventosDe(n);
    await ponerItems();
    let pos = null, rot = null;
    if (llegada.pos) {
      pos = llegada.pos;
      rot = llegada.rot ?? null;
    } else {
      const p = llegada.porPuerta != null && puertas.find(x => x.door_no === llegada.porPuerta) || puertas.find(x => x.arranque_pos) || null;
      if (p?.arranque_pos) {
        pos = p.arranque_pos;
        const d = p.arranque_dir || [ 0, 0, 1 ];
        rot = Math.atan2(d[0], d[2]);
      }
    }
    if (pos) ubicarHenry(pos, rot);
    entrada = {
      pos: aJuego(pies()),
      rot: ctl.m.cuerpo
    };
    puertaArmada = false;
    zonasDentro.clear();
    corridosEnSala = new Set;
    henry.alCargarSala?.();
    cj.alCargarSala(nombre);
    armarCamarasEv(+n);
    if (vista === "1ra") ponerPrimera(ctl.m.cuerpo);
    try {
      await enemigos.alCargarSala(nombre, {
        mitad: mitad
      });
    } catch (e) {
      console.warn("enemigos", e);
    }
    retenerParaDemo();
    enemigos.extras = [ ...mod?.extras || [], extraEileen ];
    maldicion.alCargarEscena();
    await entrarEileen(n);
    try {
      await (mod?.alCargarEscena?.(+n, llegada));
    } catch (e) {
      console.warn("mundo", e);
    }
    estado("");
    juego.salaMundo = nombre;
    nieblaPersonajes();
    M.redibujar();
    return s;
  }
  let velasSala = null;
  const liberarPj = pj => {
    if (!pj) return;
    try {
      pj.grupo?.removeFromParent();
      pj.dispose?.();
      pj.esqueleto?.dispose?.();
    } catch (e) {
      console.warn("liberar", e.message);
    }
  };
  function soltarObjetosFijos() {
    for (const o of objetosFijos) if (o !== velasSala) liberarPj(o);
    objetosFijos = [];
  }
  function soltarItems() {
    for (const it of items) liberarPj(it.pj);
    items = [];
  }
  async function ponerObjetos(n) {
    soltarObjetosFijos();
    const lista = (mitad === 2 ? E.objetos_segunda_mitad : E.objetos)?.[String(n)] || [];
    velasSala?.dispose();
    velasSala = null;
    const velas = lista.filter(o => o.cnst === "0x545990" && o.pos && (!o.dmy8 || F(o.dmy8))).map(o => o.pos);
    if (velas.length) {
      try {
        const v = await crearVelasDemo({
          THREE: THREE,
          bajar: bajar,
          escala: ESCALA,
          posiciones: velas,
          semilla: n
        });
        if (escena !== +n) v.dispose(); else {
          v.grupo.userData.modelo = "velas";
          cont.add(v.grupo);
          objetosFijos.push(v);
          velasSala = v;
        }
      } catch (e) {
        console.warn("velas", e.message);
      }
    }
    for (const o of lista) {
      if (!/ObjDontMove/.test(o.tipo_nombre || "")) continue;
      if (mod?.reemplazaObjeto?.(o) || mod?.objetoVisible && !mod.objetoVisible(o)) continue;
      const ox = OBJETOS_EXE[o.cnst];
      if (ox) {
        try {
          const pj = await modelo({
            arch: ox.arch,
            m: ox.m,
            t: ox.t,
            anim: ox.a != null ? [ ox.arch, ox.a ] : null
          });
          if (escena !== +n) {
            liberarPj(pj);
            return;
          }
          const p = ox.pos || o.pos || [ 0, 0, 0 ];
          pj.ubicar(p[0], p[1], p[2], ox.giro ?? o.rot ?? 0);
          pj.grupo.name = `objeto ${o.indice} (${ox.arch} #${ox.m}, ${o.cnst})`;
          cont.add(pj.grupo);
          objetosFijos.push(pj);
        } catch (e) {
          console.warn("objeto", o.indice, o.cnst, e.message);
        }
        continue;
      }
      const carne = CARNE_PAREDES[o.cnst];
      if (carne) {
        try {
          const pj = await modelo({
            arch: carne.arch,
            m: carne.m,
            t: carne.t,
            anim: [ carne.arch, carne.a ],
            colorFijo: 83 / 128
          });
          if (escena !== +n) {
            liberarPj(pj);
            return;
          }
          pj.ubicar(carne.pos[0], carne.pos[1], carne.pos[2], 0);
          pj.grupo.name = `carne de la pared ${o.indice} (${carne.arch} #${carne.m})`;
          cont.add(pj.grupo);
          objetosFijos.push(pj);
        } catch (e) {
          console.warn("carne de la pared", o.indice, e.message);
        }
        continue;
      }
      const arch = o.archivos_en_codigo || [];
      const mo = arch.find(a => a.tipo === "modelo_esqueleto"), tx = arch.find(a => a.tipo === "texturas"), an = arch.find(a => a.tipo === "animacion");
      if (!mo) continue;
      try {
        const pj = await modelo({
          arch: mo.archivo,
          m: mo.parte,
          t: tx?.parte,
          tArch: tx?.archivo,
          anim: an ? [ an.archivo, an.parte ] : null
        });
        if (escena !== +n) {
          liberarPj(pj);
          return;
        }
        if (o.pos) pj.ubicar(o.pos[0], o.pos[1], o.pos[2], o.rot || 0);
        pj.grupo.name = `objeto ${o.indice} (${mo.archivo})`;
        mod?.ajustarObjeto?.(o, pj);
        cont.add(pj.grupo);
        objetosFijos.push(pj);
      } catch (e) {
        console.warn("objeto", o.indice, e.message);
      }
    }
  }
  function cumple(c) {
    if (!c || c === "siempre") return true;
    const t = c.split(/\s+/);
    let v = null, op = "AND";
    for (const x of t) {
      if (x === "AND" || x === "OR") {
        op = x;
        continue;
      }
      const b = x === "siempre" ? true : x[0] === "!" ? !F(+x.slice(2)) : F(+x.slice(1));
      v = v == null ? b : op === "OR" ? v || b : v && b;
    }
    return v ?? true;
  }
  const banderaDe = ev => {
    const m = /^!F(\d+)/.exec(ev?.cond || "");
    return m ? +m[1] : 0;
  };
  const recogido = o => !!PARTIDA.recogidos?.includes(`${etapa}/${escena}/${mitad}/${o.i}`);
  function eventosDe(n) {
    const d = MD?.etapas?.[etapa]?.escenas?.[String(n)];
    const lista = (mitad === 2 ? d?.mitad2 : d?.mitad1) || [];
    return lista.filter(o => !cfg.excluir?.(o, +n, PARTIDA) && !(o.ev && cfg.sinHacer?.includes(o.ev.evnum)));
  }
  function vigente(o) {
    if (o.item && recogido(o)) return false;
    if (o.ev?.trgchk === "0x4e6d30") {
      const tn = PARTIDA.terrorNuevo;
      if (!tn || !(tn.finales || []).some(l => l === "A" || l === "B") || tn.vestido) return false;
    }
    const ev = o.ev;
    if (!ev) return !!o.item;
    if (ev.evnum && ev.cond === null && !o.item && !(ev.guion && !o.zona?.dmy13 && o.zona?.dmy1 !== 6)) return false;
    if (!cumple(ev.cond)) return false;
    const b = banderaDe(ev);
    if (b && F(b)) return false;
    return !!(ev.demo || ev.guion || ev.lista || ev.video != null || o.item || cfg.molinetes?.includes(ev.evnum) || cfg.despues?.[ev.evnum] || cfg.demoAlAzar?.[ev.evnum] || b || mod?.maneja?.(ev) || /^0x4cde80/.test(ev.exec || ""));
  }
  const tieneZona = o => o.pos && (o.zona?.dmy1 === 2 || o.zona?.dmy1 === 1);
  const seExamina = o => o.zona && o.zona.dmy6 != null;
  let corridosEnSala = new Set;
  const automaticos = () => eventos.filter(o => o.ev && !o.pos && !corridosEnSala.has(o) && vigente(o) && (o.ev.demo || cfg.demoAlAzar?.[o.ev.evnum] || o.ev.guion || o.ev.video != null || banderaDe(o.ev) || mod?.maneja?.(o.ev)));
  function dentroDeZona(o, piesJ, margen = 0) {
    const z = o.zona, p = o.pos;
    if (z.dmy1 === 2 && z.caja) {
      const [cx, cy, cz] = z.caja.map(v => (v || 0) / 2 + margen);
      return Math.abs(piesJ[0] - p[0]) <= cx && Math.abs(piesJ[2] - p[2]) <= cz && Math.abs(piesJ[1] - p[1]) <= Math.max(cy, 400);
    }
    const r = (z.radio || 100) + margen;
    return Math.hypot(piesJ[0] - p[0], piesJ[2] - p[2]) <= r && Math.abs(piesJ[1] - p[1]) <= Math.max(z.alto || 0, 400);
  }
  const cuantosItem = k => (henry.inventario?.cuantos?.(k) || 0) + (henry.inventario?.notas?.includes(k) ? 1 : 0);
  const TRGCHK_CAMARA = {
    "0x4e2700": () => !F(1203),
    "0x4e27e0": () => !(F(1150) && F(1112)),
    "0x4eeff0": () => !cuantosItem(131),
    "0x4e0a20": () => !cuantosItem(132)
  };
  let camarasEv = [], camEv = null, camEvTimer = 0;
  const camEvAdelante = new THREE.Vector3, _ce = [ new THREE.Vector3, new THREE.Vector3, new THREE.Quaternion, new THREE.Quaternion, new THREE.Matrix4, new THREE.Vector3 ];
  function armarCamarasEv(n) {
    camEv = null;
    camEvTimer = 0;
    const lista = (mitad === 2 ? E.objetos_segunda_mitad : E.objetos)?.[String(n)] || [];
    camarasEv = q.has("sincamev") ? [] : lista.filter(o => o.tipo === 11 && o.pos && (o.dmy1 === 1 || o.dmy1 === 2)).map(o => {
      const rad = Math.PI / 180, ax = (o.dmy15 || 0) * rad, ay = (o.dmy16 || 0) * rad;
      const pos = [ o.dmy12 || 0, o.dmy13 || 0, o.dmy14 || 0 ];
      const mira = o.id1 === 1 ? [ o.dmy15 || 0, o.dmy16 || 0, o.dmy17 || 0 ] : [ pos[0] + Math.sin(ay) * Math.cos(ax) * 100, pos[1] - Math.sin(ax) * 100, pos[2] + Math.cos(ay) * Math.cos(ax) * 100 ];
      return {
        o: o,
        pos: pos,
        mira: mira,
        angulo: o.dmy0 ? o.dmy0 * rad : null,
        margen: Math.max(20, o.dmy11 ? o.dmy11 * 2 : 160),
        existe: false
      };
    });
  }
  function dentroCamEv(c, pj) {
    const o = c.o, m = c.existe ? c.margen : 0;
    const dx = pj[0] - o.pos[0], dz = pj[2] - o.pos[2], dy = pj[1] - o.pos[1];
    if (o.dmy1 === 1) return Math.hypot(dx, dz) <= (o.dmy2 || 100) + m && Math.abs(dy) <= Math.max(o.dmy3 || 0, 400);
    const r = o.dmy5 || 0, cr = Math.cos(r), sr = Math.sin(r);
    const lx = dx * cr - dz * sr, lz = dx * sr + dz * cr;
    return Math.abs(lx) <= (o.dmy2 || 0) / 2 + m && Math.abs(lz) <= (o.dmy4 || 0) / 2 + m && Math.abs(dy) <= Math.max((o.dmy3 || 0) / 2, 400);
  }
  function camaraEvento(pj) {
    let activa = null;
    for (const c of camarasEv) {
      const o = c.o;
      if (!c.existe) {
        if (o.dmy8 && !F(o.dmy8) || o.dmy9 && F(o.dmy9)) continue;
        if (o.dmy7) {
          const t = TRGCHK_CAMARA[o.dmy7];
          if (!t || !t()) continue;
        }
        if (dentroCamEv(c, pj)) c.existe = true;
      } else if (!dentroCamEv(c, pj)) c.existe = false;
      if (c.existe) activa = c;
    }
    return activa;
  }
  const direccionCamEv = (c, out) => out.copy(aMundo(c.mira)).sub(aMundo(c.pos)).setY(0).normalize();
  function aplicarCamaraEvento(dt, moviendo) {
    const delJuego = cj.activa && (cj.tipo ?? "juego") === "juego";
    const fija = delJuego ? mod?.camaraFija?.() || null : null;
    const c = fija || (delJuego && camarasEv.length ? camaraEvento(aJuego(pies(_ce[5]))) : null);
    if (c !== camEv) {
      if (camEv) direccionCamEv(camEv, camEvAdelante); else cj.adelanteControl(camEvAdelante);
      camEv = c;
      camEvTimer = 1.6;
    } else if (camEvTimer > 0 && moviendo) camEvTimer -= dt; else camEvTimer = 0;
    if (!c) return;
    const [p, m, qc, qj, mt] = _ce;
    p.copy(aMundo(c.pos));
    m.copy(aMundo(c.mira));
    M.jugador.updateMatrixWorld(true);
    M.camara.position.copy(M.jugador.worldToLocal(p.clone()));
    mt.lookAt(p, m, M.camara.up);
    qc.setFromRotationMatrix(mt);
    M.jugador.getWorldQuaternion(qj).invert();
    M.camara.quaternion.copy(qj.multiply(qc));
    if (c.angulo) {
      const f = fovVertical(c.angulo);
      if (Math.abs(M.camara.fov - f) > .001) {
        M.camara.fov = f;
        M.camara.updateProjectionMatrix();
      }
    }
  }
  function adelanteControl(out) {
    if (camEvTimer > 0) return out.copy(camEvAdelante);
    if (camEv) return direccionCamEv(camEv, out);
    return cj.adelanteControl(out);
  }
  function examinable(piesJ, adelante) {
    let mejor = null, md = Infinity;
    for (const o of eventos) {
      if (!o.pos || !(seExamina(o) || o.item) || !vigente(o)) continue;
      const dx = o.pos[0] - piesJ[0], dz = o.pos[2] - piesJ[2], d = Math.hypot(dx, dz);
      const dentro = tieneZona(o) && dentroDeZona(o, piesJ, 60);
      if (!dentro && d > (o.zona?.radio || 100) + 220) continue;
      if (Math.abs(o.pos[1] - piesJ[1]) > 600) continue;
      const frente = d < 1 ? 1 : (dx * adelante[0] + dz * adelante[1]) / d;
      if (frente < (dentro ? -.2 : .35)) continue;
      const s = d * (1.5 - frente);
      if (s < md) {
        md = s;
        mejor = o;
      }
    }
    return mejor;
  }
  let guionMundo = null;
  function correrGuion(cmds, o) {
    guionMundo ||= crearGuion({
      decir: decir,
      texto: texto,
      comun: n => texto(0, n),
      darItem: k => darItem(k),
      llamada: f => mod?.llamada?.(f),
      siNo: "marcado"
    });
    return guionMundo(cmds, {
      alItem: k => darItem(k, o)
    });
  }
  function darItem(k, o) {
    const ok = henry.agregarItem(k, k >= 1 && k <= 3 ? municionPorDefecto(k, ctl.s.nivel ?? 2, henry.datos.juego?.use_item_default?.filas) : 1);
    if (ok === false) {
      henry.inventario?.mensaje(texto(1, 0) || "No puedo llevar más cosas.");
      return false;
    }
    if (henry.datos.esArma(k) && !ctl.s.arma) henry.equipar(k);
    if (o?.item) {
      (PARTIDA.recogidos ||= []).push(`${etapa}/${escena}/${mitad}/${o.i}`);
      sacarItem(o);
    }
    return true;
  }
  async function agarrarItem(o) {
    const t = henry.datos.henry.textos_item?.find(x => x.item === o.item);
    const preg = t ? mItem[t.info + 1] : "", tiene = t ? mItem[t.info + 2] : "";
    const si = await decir([ preg || "¿" + henry.datos.nombreItem(o.item) + "?" ], {
      pregunta: true
    });
    if (!si) return false;
    if (darItem(o.item, o) && tiene) await decir([ tiene ]);
    return true;
  }
  async function ejecutar(o) {
    const ev = o.ev || {};
    juego.ultimoEvento = `${etapa} ${escena}/${o.i} ev${ev.evnum ?? "-"}`;
    if (mod?.ejecutar) {
      const rm = await mod.ejecutar(o);
      if (rm !== undefined) return rm;
    }
    if (/^0x4cde80/.test(ev.exec || "")) return haciaEscalera(apiMundo, etapa, escena);
    if (cfg.molinetes?.includes(ev.evnum)) {
      await cruzarMolinete(o);
      return null;
    }
    const azar = cfg.demoAlAzar?.[ev.evnum];
    const demoN = ev.demo ?? (azar ? azar[Math.floor(Math.random() * azar.length)] : null);
    if (demoN) {
      const r = await demoMundo(demoN);
      const extra = cfg.despues?.[ev.evnum];
      for (const d of extra?.demos || []) await demoMundo(d);
      if (extra?.pos) ubicarHenry(extra.pos, extra.rot ?? null); else if (r?.final) ubicarHenry(r.final.pos, r.final.rot);
      prender(banderaDe(ev));
      enemigos.soltarRetenidos?.();
      if (cfg.fin?.evnum === ev.evnum || finDeEtapa(demoN)) return {
        volver302: true,
        escena302: cfg.fin?.escena302 ?? 2
      };
      M.fundir(0, .5);
      return null;
    }
    if (ev.video != null) {
      if (!q.has("sinvideos")) {
        await M.fundir(1, .4);
        await juego.reproducirVideo(ev.video, {});
        M.pantalla.ocultar();
        await M.fundir(0, .4);
      }
      prender(banderaDe(ev));
      return null;
    }
    if (ev.guion) {
      if (await correrGuion(ev.guion, o)) prender(banderaDe(ev));
      return null;
    }
    if (ev.lista) {
      const l = ev.lista.find(x => !x.mientras_no || !F(x.mientras_no)) || ev.lista[ev.lista.length - 1];
      if (l) await correrGuion(l.guion, o);
      prender(banderaDe(ev));
      return null;
    }
    if (o.item) {
      if (await agarrarItem(o)) prender(banderaDe(ev));
      return null;
    }
    prender(banderaDe(ev));
    return null;
  }
  function retenerParaDemo() {
    if (!enemigos.retener) return;
    const archivos = new Set;
    for (const o of eventos) {
      if (!o.ev?.demo || !vigente(o)) continue;
      for (const d of [ o.ev.demo, ...cfg.despues?.[o.ev.evnum]?.demos || [] ]) {
        for (const id of DJ?.demos?.[String(d)]?.sqt?.personajes || []) {
          const a = PC?.personajes?.[String(id)]?.modelo?.archivo;
          if (/^enemy_/.test(a || "")) archivos.add(a);
        }
      }
    }
    if (!archivos.size) return;
    const n = enemigos.retener(e => archivos.has(e.def?.archivos?.[0]));
    if (n) console.info(`enemigos: ${n} esperan la cinemática de la sala (${[ ...archivos ].join(", ")})`);
  }
  const finDeEtapa = n => /StageFinish/.test(DJ?.demos?.[String(n)]?.evento?.nombres_e3?.end || "");
  async function cruzarMolinete(o) {
    const pj = aJuego(pies());
    const lado = pj[2] < o.pos[2] ? 1 : -1;
    await M.fundir(1, .3);
    amb.son?.efecto?.(50255, null, {
      volumen: .8
    });
    ubicarHenry([ o.pos[0], pj[1], o.pos[2] + lado * 170 ], lado > 0 ? 0 : Math.PI);
    await M.fundir(0, .3);
  }
  const QZ = (new THREE.Quaternion).setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI), EJE_Y = new THREE.Vector3(0, 1, 0);
  let vueltaItems = 0;
  async function ponerItems() {
    const n = ++vueltaItems;
    soltarItems();
    for (const o of eventos) {
      if (!o.item || !o.pos || recogido(o) || o.ev && o.ev.cond && !cumple(o.ev.cond)) continue;
      const f = MODELOS_ITEM.get(o.item);
      if (!f?.modelo) continue;
      try {
        const pj = await modelo({
          arch: f.modelo.archivo,
          m: f.modelo.parte,
          tArch: f.texturas?.archivo,
          t: f.texturas?.parte
        });
        if (n !== vueltaItems) {
          liberarPj(pj);
          return;
        }
        pj.grupo.position.copy(aMundo(o.pos));
        const qj = o.quat ? new THREE.Quaternion(...o.quat).normalize() : (new THREE.Quaternion).setFromAxisAngle(EJE_Y, o.rot || 0);
        pj.grupo.children[0].quaternion.copy(QZ).multiply(qj);
        pj.grupo.name = `ítem ${o.item} (${escena}/${o.i})`;
        cont.add(pj.grupo);
        items.push({
          o: o,
          grupo: pj.grupo,
          pj: pj
        });
      } catch (e) {
        console.warn("ítem", o.item, e.message);
      }
    }
  }
  function sacarItem(o) {
    for (const it of items.filter(x => x.o === o)) liberarPj(it.pj);
    items = items.filter(x => x.o !== o);
    M.redibujar();
  }
  function esconderParaDemo(D) {
    const quedan = o => /^sala_/.test(o.name) || o.isLight || o.name === "luces de personajes" || o.userData?.enDemo || !seRepite(o, D);
    const escondidos = [];
    for (const o of cont.children) if (o.visible && !quedan(o)) {
      o.visible = false;
      escondidos.push(o);
    }
    return escondidos;
  }
  async function demoMundo(n) {
    const negro = M.fundir(1, .25);
    const aviso = setTimeout(() => estado("cargando…"), 1e3);
    let D;
    try {
      [D] = await Promise.all([ cine.abrir(n), negro ]);
    } catch (e) {
      console.warn("demo", n, e.message);
      clearTimeout(aviso);
      estado("");
      M.fundir(0, .4);
      return null;
    }
    clearTimeout(aviso);
    estado("");
    const ds = DS?.demos?.[etapa + "/d_" + pad3(n)];
    const off = ds?.desplazar || [ 0, 0, 0 ];
    const vis = {
      henry: henry.personaje.grupo.visible,
      arma: henry.armaVista?.montura.visible,
      enemigos: enemigos.grupo.visible,
      items: items.map(i => i.grupo.visible)
    };
    henry.personaje.grupo.visible = false;
    enemigos.grupo.visible = false;
    if (henry.armaVista) henry.armaVista.montura.visible = false;
    if (henry.botones) henry.botones.visibles = false;
    const eilVis = eileen.actual ? eileen.actual.pj.grupo.visible : null;
    if (eileen.actual) eileen.actual.pj.grupo.visible = false;
    mod?.alDemo?.(true);
    const escondidos = esconderParaDemo(D);
    cont.position.copy(aMundo(off));
    cont.updateMatrixWorld(true);
    juego.fase = "demo " + n;
    juego.demoActual = D;
    M.fundir(0, .4);
    let saltada = false;
    try {
      saltada = await cine.reproducir(D, {});
    } catch (e) {
      console.warn("demo", n, e);
    } finally {
      amb.son?.cinematica?.(false);
    }
    M.anclarCapas();
    cont.position.set(0, 0, 0);
    cont.updateMatrixWorld(true);
    const final = finalHenry(D, off);
    cine.liberar(D);
    juego.demoActual = null;
    juego.fase = "mundo " + etapa;
    henry.personaje.grupo.visible = vis.henry;
    enemigos.grupo.visible = vis.enemigos;
    if (henry.armaVista) henry.armaVista.montura.visible = true;
    if (henry.botones) henry.botones.visibles = true;
    if (eileen.actual && eilVis !== null) eileen.actual.pj.grupo.visible = eilVis;
    for (const o of escondidos) o.visible = true;
    mod?.alDemo?.(false);
    if (vista === "3ra") cj.alCargarSala(nombreSala); else ponerPrimera(ctl.m.cuerpo);
    M.ponerVelo(1);
    return {
      saltada: saltada,
      final: final,
      D: D
    };
  }
  function finalHenry(D, off) {
    const k = D.sqt.modelos.findIndex(m => m.id === 300 || m.id === 317);
    if (k < 0) return null;
    const S = D.muestrear(D.sqt.n - 1, false), po = S.poses[k];
    const h = po?.tiene ? po.tiene.findIndex(x => x) : -1;
    if (h < 0) return null;
    const pos = [ po.pos[h * 3] - off[0], po.pos[h * 3 + 1] - off[1] + 90, po.pos[h * 3 + 2] - off[2] ];
    if (pisoEn(aMundo(pos).add(new THREE.Vector3(0, .8, 0))) == null) return null;
    const qd = new THREE.Quaternion(po.rot[h * 4], po.rot[h * 4 + 1], po.rot[h * 4 + 2], po.rot[h * 4 + 3]);
    const f = new THREE.Vector3(0, 0, 1).applyQuaternion(qd);
    return {
      pos: pos,
      rot: Math.hypot(f.x, f.z) > .2 ? Math.atan2(f.x, f.z) : null
    };
  }
  function pies(out = new THREE.Vector3) {
    return out.set(rig.position.x, rig.position.y - OJOS, rig.position.z);
  }
  const rayo = new THREE.Raycaster;
  function pisarRig(forzar = false) {
    if (!colision) return;
    const pies = rig.position.y - OJOS;
    const y = pisoComun.visor(colision, rig.position.x, pies, rig.position.z, forzar ? 1 : .5, forzar ? 3 : 2.5);
    if (y != null) rig.position.y = y + OJOS;
  }
  function libre(desdeOjos, dir, dist) {
    if (!colision) return true;
    for (const alto of [ PASO - OJOS + .05, -.6, 0 ]) {
      tmp.copy(desdeOjos);
      tmp.y += alto;
      rayo.set(tmp, dir);
      rayo.far = dist + RADIO;
      if (rayo.intersectObject(colision).some(x => Math.abs(x.face.normal.y) < .6)) return false;
    }
    return true;
  }
  function moverConColision(ojosPos, dir, v) {
    const d = dir.clone().normalize(), antes = ojosPos.clone();
    if (libre(ojosPos, d, v)) ojosPos.addScaledVector(d, v); else for (const eje of [ new THREE.Vector3(Math.sign(d.x), 0, 0), new THREE.Vector3(0, 0, Math.sign(d.z)) ]) {
      const parte = Math.abs(eje.x ? d.x : d.z) * v;
      if (parte > 1e-4 && libre(ojosPos, eje, parte)) ojosPos.addScaledVector(eje, parte);
    }
    return ojosPos.clone().sub(antes);
  }
  function ubicarHenry(posJuego, rot = null) {
    const p = aMundo(posJuego);
    rig.position.set(p.x, p.y + OJOS, p.z);
    pisarRig(true);
    if (rot != null) {
      ctl.m.rumbo = ctl.m.cuerpo = ctl.m.deseado = rot;
    }
    seguirConElRig(true);
    if (vista === "1ra" && !M.enVR()) M.camara.rotation.set(0, giroCamara(ctl.m.cuerpo), 0);
    if (M.enVR()) {
      const cab = M.camara.getWorldPosition(new THREE.Vector3);
      const yawCab = (new THREE.Euler).setFromQuaternion(M.camara.getWorldQuaternion(new THREE.Quaternion), "YXZ").y;
      M.jugador.rotation.y += giroCamara(ctl.m.cuerpo) - yawCab;
      M.jugador.updateMatrixWorld(true);
      const cab2 = M.camara.getWorldPosition(new THREE.Vector3);
      M.jugador.position.x += p.x - cab2.x;
      M.jugador.position.z += p.z - cab2.z;
      M.jugador.position.y = rig.position.y - OJOS;
      void cab;
    }
    hayPrev = false;
    if (vista === "3ra" && nombreSala && !M.enVR()) cj.alCargarSala(nombreSala);
  }
  function seguirConElRig() {
    if (M.enVR()) return;
    M.jugador.position.set(rig.position.x, rig.position.y - OJOS, rig.position.z);
    M.jugador.rotation.set(0, 0, 0);
  }
  let vista = (() => {
    const v = q.get("vista");
    if (v === "1ra" || v === "3ra") return v;
    try {
      return localStorage.getItem("sh4vistaMundo") || "3ra";
    } catch {
      return "3ra";
    }
  })();
  function ponerPrimera(rumbo) {
    henry.ponerModo("1ra");
    if (!M.enVR()) {
      M.camara.position.set(0, OJOS, 0);
      M.camara.rotation.set(0, giroCamara(rumbo), 0);
      if (Math.abs(M.camara.fov - 60) > .01) {
        M.camara.fov = 60;
        M.camara.updateProjectionMatrix();
      }
      M.anclarCapas();
    }
    M.control.mirarLibre = true;
    if (sh4.henry === henry) sh4.henry = null;
  }
  function ponerTercera() {
    henry.ponerModo("3ra");
    M.control.mirarLibre = false;
    sh4.henry = henry;
    if (nombreSala) cj.alCargarSala(nombreSala);
  }
  cambiarVista = () => {
    if (M.enVR()) return vista;
    vista = vista === "1ra" ? "3ra" : "1ra";
    try {
      localStorage.setItem("sh4vistaMundo", vista);
    } catch {}
    if (vista === "1ra") ponerPrimera(ctl.m.cuerpo); else ponerTercera();
    estado(vista === "1ra" ? "primera persona" : "tercera persona");
    setTimeout(() => estado(""), 1500);
    return vista;
  };
  addEventListener("keydown", e => {
    if (e.code === "KeyV" && activo && !juego.demoActual && !juego.hablando) cambiarVista();
  });
  const vistaDeOpciones = v => {
    if ((v === "1ra" || v === "3ra") && v !== vista && activo && !M.enVR() && !juego.demoActual) cambiarVista();
  };
  addEventListener("sh4opciones", e => vistaDeOpciones(e.detail?.vista));
  addEventListener("storage", e => {
    if (e.key === "sh4vistaMundo") vistaDeOpciones(e.newValue);
  });
  M.renderer.xr.addEventListener("sessionstart", () => setTimeout(() => {
    if (!activo) return;
    M.camara.position.set(0, 0, 0);
    M.camara.rotation.set(0, 0, 0);
    M.jugador.position.set(rig.position.x, rig.position.y - OJOS, rig.position.z);
    M.jugador.rotation.set(0, giroCamara(ctl.m.cuerpo), 0);
  }, 60));
  M.renderer.xr.addEventListener("sessionend", () => setTimeout(() => {
    if (!activo) return;
    M.jugador.rotation.set(0, 0, 0);
    seguirConElRig();
    if (vista === "1ra") ponerPrimera(ctl.m.cuerpo); else ponerTercera();
  }, 60));
  const rojo = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.MeshBasicMaterial({
    color: 9043968,
    transparent: true,
    opacity: 0,
    depthTest: false,
    depthWrite: false
  }));
  rojo.position.z = -.06;
  rojo.renderOrder = 99;
  rojo.visible = false;
  rojo.frustumCulled = false;
  M.camara.add(rojo);
  let rojoT = 0;
  henry.alRecibirDaño(() => {
    rojoT = .35;
    henry.armaVista?.vibrar(1, 140);
  });
  let gameOverPendiente = false;
  ctl.on("gameOver", () => {
    gameOverPendiente = true;
  });
  let imgGameOver = null;
  imagenJuego("snap_gameover", 0, [ 0, 0, 512, 448 ]).then(c => {
    imgGameOver = c;
  }).catch(() => {});
  async function gameOver() {
    gameOverPendiente = false;
    juego.fase = "game over";
    await M.fundir(1, 1.6);
    const g = M.pantalla.g;
    M.ponerVelo(0);
    M.pantalla.mostrar();
    await new Promise(ok => {
      let t = 0;
      const tarea = (dt, {acciones: acciones}) => {
        t += dt;
        P.limpiar(g);
        if (imgGameOver) P.imagen(g, imgGameOver, Math.min(1, t / 2));
        fuente.escribir(g, "GAME OVER", 320, 250, {
          escala: P.ESC * 1.6,
          alinear: "centro",
          color: "#c0261a",
          alfa: Math.min(1, t / 1.5)
        });
        if (t > 2) fuente.escribir(g, juego.textoComun?.(105) || "CONTINUAR", 320, 320, {
          escala: P.ESC,
          alinear: "centro",
          color: "#ece3d2",
          alfa: .6 + .3 * Math.sin(t * 3)
        });
        M.pantalla.actualizar();
        if (t > 2 && acciones.some(a => a === "aceptar" || a === "accion" || a === "clic")) {
          M.tareas.delete(tarea);
          ok();
        }
        return true;
      };
      M.tareas.add(tarea);
    });
    M.ponerVelo(1);
    M.pantalla.ocultar();
    ctl.revivir();
    ubicarHenry(entrada.pos, entrada.rot);
    if (eileen.actual) eileen.actual.ubicar(lugarCerca(ctl.m.cuerpo), ctl.m.cuerpo);
    try {
      await enemigos.alCargarSala(nombreSala, {
        mitad: mitad
      });
    } catch {}
    retenerParaDemo();
    cj.alCargarSala(nombreSala);
    juego.fase = "mundo " + etapa;
    await M.fundir(0, .8);
  }
  const zonasDentro = new Set;
  let tNiebla = 0;
  let activo = false, ocupado = false, puertaArmada = false, hayPrev = false, terminar = null, giroListo = true, aAntes = false, ultimoFov = 0;
  const adelante = new THREE.Vector3, costado = new THREE.Vector3, ARRIBA = new THREE.Vector3(0, 1, 0), _v = new THREE.Vector3;
  async function correr(f) {
    ocupado = true;
    try {
      const r = await f();
      if (r?.volver302 || r?.aEtapa) {
        terminar?.(r);
        return;
      }
    } catch (e) {
      console.error(e);
    } finally {
      ocupado = false;
    }
  }
  function botonA() {
    const s = M.renderer.xr.getSession?.();
    if (!s) return false;
    let a = false;
    for (const src of s.inputSources) if (src.handedness === "right" && src.gamepad?.buttons[4]?.pressed) a = true;
    const r = a && !aAntes;
    aAntes = a;
    return r;
  }
  const conManos = () => {
    const s = M.renderer.xr.getSession?.();
    if (!s) return false;
    for (const src of s.inputSources) if (src.hand) return true;
    return false;
  };
  function girarRig(ang) {
    const cab = M.camara.getWorldPosition(new THREE.Vector3);
    M.jugador.rotation.y += ang;
    M.jugador.updateMatrixWorld(true);
    const nueva = M.camara.getWorldPosition(new THREE.Vector3);
    M.jugador.position.add(cab.sub(nueva));
  }
  function tarea(dt, {ejes: ejes, acciones: acciones, teclas: teclas}) {
    if (!activo) return;
    const vr = M.enVR();
    const cine = vr && !!henry.casco?.cine;
    rojoT = Math.max(0, rojoT - dt);
    rojo.visible = rojoT > 0;
    rojo.material.opacity = Math.min(.45, rojoT * 1.4);
    if (juego.demoActual || juego.hablando || ocupado || juego.fase === "pausa" || juego.fase === "game over") {
      enemigos.pausa = true;
      return rojo.visible;
    }
    if (gameOverPendiente) {
      correr(gameOver);
      return true;
    }
    const invAbierto = !!henry.inventario?.abierto;
    enemigos.pausa = invAbierto;
    const forz = mod?.forzar?.();
    const corre = !!(teclas.ShiftLeft || teclas.ShiftRight || teclas.CorrerVR) && !forz?.dir;
    const dir = new THREE.Vector3;
    let fuerza = 0;
    const forzar = () => {
      if (sh4.controlesInvertidos) dir.negate();
      if (forz?.dir) {
        if (forz.fuerza > 0) dir.copy(forz.dir); else dir.set(0, 0, 0);
        fuerza = forz.fuerza;
      }
    };
    if (vr) {
      M.camara.getWorldDirection(adelante);
      adelante.y = 0;
      adelante.normalize();
      costado.crossVectors(adelante, ARRIBA).normalize();
      if (ejes.x || ejes.y) {
        dir.addScaledVector(adelante, -ejes.y).addScaledVector(costado, ejes.x);
        fuerza = Math.min(1, dir.length());
      }
      if (Math.abs(ejes.gx) > .6) {
        if (giroListo) {
          girarRig(-Math.sign(ejes.gx) * Math.PI / 6);
          giroListo = false;
        }
      } else if (Math.abs(ejes.gx) < .3) giroListo = true;
      forzar();
      const cab = M.camara.getWorldPosition(new THREE.Vector3);
      if (fuerza > 0 && !invAbierto && !cine) {
        const v = velocidadPrimera(corre) * fuerza * dt;
        const ojo = new THREE.Vector3(cab.x, M.jugador.position.y + OJOS, cab.z);
        const d = moverConColision(ojo, dir, v);
        M.jugador.position.x += d.x;
        M.jugador.position.z += d.z;
      }
      const cab2 = M.camara.getWorldPosition(new THREE.Vector3);
      if (!cine) {
        rig.position.set(cab2.x, M.jugador.position.y + OJOS, cab2.z);
        pisarRig();
      }
      M.jugador.position.y = rig.position.y - OJOS;
    } else if (vista === "1ra") {
      M.camara.getWorldDirection(adelante);
      adelante.y = 0;
      adelante.normalize();
      costado.crossVectors(adelante, ARRIBA).normalize();
      if (teclas.KeyW || teclas.ArrowUp) dir.add(adelante);
      if (teclas.KeyS || teclas.ArrowDown) dir.sub(adelante);
      if (teclas.KeyD) dir.add(costado);
      if (teclas.KeyA) dir.sub(costado);
      if (teclas.ArrowLeft) M.camara.rotation.y += 1.9 * dt;
      if (teclas.ArrowRight) M.camara.rotation.y -= 1.9 * dt;
      if (ejes.x || ejes.y) {
        dir.addScaledVector(adelante, -ejes.y).addScaledVector(costado, ejes.x);
      }
      if (ejes.gx || ejes.gy) {
        M.camara.rotation.y -= ejes.gx * 2.2 * dt;
        M.camara.rotation.x = THREE.MathUtils.clamp(M.camara.rotation.x - ejes.gy * 1.6 * dt, -1.3, 1.3);
      }
      fuerza = Math.min(1, dir.length());
      forzar();
      if (fuerza > 0 && !invAbierto) {
        moverConColision(rig.position, dir, velocidadPrimera(corre) * fuerza * dt);
        pisarRig();
      }
    } else {
      adelanteControl(adelante);
      adelante.y = 0;
      if (adelante.lengthSq() < 1e-6) M.camara.getWorldDirection(adelante).setY(0);
      adelante.normalize();
      costado.crossVectors(adelante, ARRIBA).normalize();
      if (teclas.KeyW || teclas.ArrowUp) dir.add(adelante);
      if (teclas.KeyS || teclas.ArrowDown) dir.sub(adelante);
      if (teclas.KeyD || teclas.ArrowRight) dir.add(costado);
      if (teclas.KeyA || teclas.ArrowLeft) dir.sub(costado);
      if (ejes.x || ejes.y) dir.addScaledVector(adelante, -ejes.y).addScaledVector(costado, ejes.x);
      fuerza = Math.min(1, dir.length());
      forzar();
    }
    const moviendo = dir.lengthSq() > 1e-6;
    henry.actualizar(dt, {
      moviendo: moviendo,
      corriendo: corre,
      dir: moviendo ? dir.clone().normalize() : null,
      fuerza: moviendo ? Math.max(.4, fuerza) : 1,
      enVR: vr
    });
    if (vr) {
      M.jugador.position.y = rig.position.y - OJOS;
    } else seguirConElRig();
    if (forz?.cinta && !invAbierto) empujar(forz.cinta.dir, forz.cinta.v * dt);
    enemigos.actualizar(dt);
    actualizarEileen(dt, invAbierto);
    if (!invAbierto) maldicion.cuadro(dt);
    try {
      amb.fx?.enemigos?.(enemigos);
    } catch (e) {
      console.warn("ruido por enemigos", e);
    }
    if (!vr && vista === "3ra") {
      cj.actualizar(dt);
      aplicarCamaraEvento(dt, moviendo);
    }
    if (Math.abs(M.camara.fov - ultimoFov) > .5) {
      ultimoFov = M.camara.fov;
      M.anclarCapas();
    }
    amb.son?.corriendo?.(corre && moviendo);
    for (const o of objetosFijos) o.actualizar(dt);
    if ((tNiebla -= dt) <= 0) {
      tNiebla = 1;
      nieblaPersonajes();
    }
    mod?.cuadro?.(dt);
    const pj = aJuego(pies(_v)), cintura = _v.clone();
    cintura.y += OJOS * .5;
    const cuerpo = ctl.m.cuerpo, fr = !cine && (vr || vista === "1ra") ? (() => {
      const f = M.camara.getWorldDirection(new THREE.Vector3);
      return [ -f.x, f.z ];
    })() : [ Math.sin(cuerpo), Math.cos(cuerpo) ];
    const enPuerta = puertas.filter(p => p.caja.containsPoint(cintura));
    if (!enPuerta.length) puertaArmada = true;
    let accion = false;
    for (const a of acciones) {
      if (a === "menu") {
        correr(() => juego.pausa?.());
        return true;
      }
      if (vr) {
        if (a === "accion" && conManos()) accion = true;
        continue;
      }
      if (a === "accion" || a === "aceptar" && !teclas.Space || a === "clic" && M.tactil) accion = true;
      if (a === "clic" && !M.tactil) M.control.capturar();
    }
    if (vr && botonA()) accion = true;
    if (invAbierto) return true;
    if (puertaArmada && enPuerta.length) {
      const p = elegirPuerta(enPuerta, {
        fr: fr,
        cintura: cintura,
        conAccion: accion
      });
      if (p && (p.door_type === 2 || accion)) {
        correr(() => pasarPuerta(p));
        return true;
      }
    }
    for (const o of eventos) {
      if (!o.pos || seExamina(o) || o.item || !tieneZona(o)) continue;
      const dentro = dentroDeZona(o, pj), antes = zonasDentro.has(o);
      if (dentro) zonasDentro.add(o); else zonasDentro.delete(o);
      if (dentro && !antes && vigente(o)) {
        correr(() => ejecutar(o).then(async r => r || await despuesDeEvento()));
        return true;
      }
    }
    if (accion) {
      const o = examinable(pj, fr);
      if (o) {
        correr(() => ejecutar(o).then(async r => r || await despuesDeEvento()));
        return true;
      }
    }
    return true;
  }
  const velocidadPrimera = corre => ctl.s.agarre ? 0 : [ henry.ESTADO.PREPARAR, henry.ESTADO.GUARDIA ].includes(ctl.s.estado) ? VEL.guardia : [ henry.ESTADO.GOLPE, henry.ESTADO.GOLPE_FUERTE ].includes(ctl.s.estado) ? 0 : corre ? VEL.correr : VEL.caminar;
  async function despuesDeEvento() {
    await ponerItems();
    const r = await correrAutomaticos();
    return r;
  }
  async function correrAutomaticos() {
    for (let k = 0; k < 4; k++) {
      const o = automaticos()[0];
      if (!o) break;
      corridosEnSala.add(o);
      const r = await ejecutar(o);
      if (r?.volver302 || r?.aEtapa) return r;
      await ponerItems();
    }
    return null;
  }
  function deFrente(lista, {fr: fr, cintura: cintura} = {}) {
    if (!fr || !cintura || lista.length < 2) return lista;
    const dv = new THREE.Vector3(-fr[0], 0, fr[1]).normalize(), q = new THREE.Vector3;
    const nota = p => {
      const rect = (new THREE.Box3).setFromPoints([ aMundo(p.caja_min), aMundo(p.caja_max) ]);
      rect.clampPoint(cintura, q);
      q.sub(cintura).setY(0);
      return q.length() < .15 ? 1 : q.normalize().dot(dv);
    };
    const r = lista.map(p => ({
      p: p,
      n: nota(p)
    })).sort((a, b) => b.n - a.n);
    const buenas = r.filter(x => x.n > -.2);
    return (buenas.length ? buenas : r).map(x => x.p);
  }
  function elegirPuerta(lista, mirar = null) {
    if (mirar?.conAccion) lista = deFrente(lista, mirar);
    if (mod?.elegirPuerta) return mod.elegirPuerta(lista);
    if (lista.length === 1) return lista[0];
    const dests = lista.map(p => p.lleva_a_escena);
    for (const v of cfg.variantes || []) {
      if (!dests.some(d => v.escenas.includes(d))) continue;
      const forzada = q.get("vestibulo");
      const quiero = forzada && v.escenas.includes(+forzada) ? +forzada : v.elegir(F);
      const p = lista.find(x => x.lleva_a_escena === quiero);
      if (p) return p;
    }
    return lista[0];
  }
  async function pasarPuerta(p) {
    tocoPuerta = 2;
    const f = (p.funcion_paso || "").slice(0, 8);
    if (mod?.antesDePuerta && !await mod.antesDePuerta(p)) {
      puertaArmada = false;
      return null;
    }
    if (cfg.puertas?.[f] === "cerrada") {
      amb.puerta?.(p, 2);
      await decir([ juego.textoComun?.(21) || "La puerta está cerrada." ]);
      puertaArmada = false;
      return null;
    }
    const dest = await (mod?.destinoPuerta?.(p)) ?? {
      escena: p.lleva_a_escena,
      porPuerta: p.door_no
    };
    if (!dest) {
      puertaArmada = false;
      return null;
    }
    if (!salaDeEscena(dest.escena)) {
      amb.puerta?.(p, 4);
      await decir([ juego.textoComun?.(21) || "La puerta está cerrada." ]);
      puertaArmada = false;
      return null;
    }
    amb.puerta?.(p, "abrir");
    const eilPuerta = eileen.actual ? dt => {
      tocoPuerta = 2;
      actualizarEileen(dt, false);
    } : null;
    if (eilPuerta) M.tareas.add(eilPuerta);
    try {
      await M.fundir(1, .35);
    } finally {
      if (eilPuerta) M.tareas.delete(eilPuerta);
    }
    try {
      await cargarEscena(dest.escena, {
        porPuerta: dest.porPuerta
      });
    } catch (e) {
      console.warn("puerta", p.door_no, e);
      cacheSalas.delete(salaDeEscena(dest.escena) + "#" + mitad);
      estado("");
      await M.fundir(0, .35);
      puertaArmada = false;
      return null;
    }
    amb.puerta?.(puertas.find(x => x.door_no === dest.porPuerta) || p, "cerrar");
    const piesJ = aJuego(pies());
    const llegada = eventos.find(o => o.pos && !seExamina(o) && !o.item && tieneZona(o) && o.ev?.demo && vigente(o) && dentroDeZona(o, piesJ));
    if (llegada) {
      zonasDentro.add(llegada);
      const r = await ejecutar(llegada);
      return r || await despuesDeEvento();
    }
    await M.fundir(0, .35);
    return correrAutomaticos();
  }
  const CERRADURAS_ETAPA = {
    fr: "./bosque_datos.json",
    mz: "./prision_datos.json",
    bd: "./edificio_datos.json",
    ie: "./departamentos_datos.json",
    hs: "./hospital_datos.json"
  };
  const cerradurasCache = new Map;
  async function cerraduraDePuerta(door) {
    const arch = CERRADURAS_ETAPA[etapa];
    if (!arch) return null;
    if (!cerradurasCache.has(arch)) cerradurasCache.set(arch, json(arch).then(d => {
      if (!d) cerradurasCache.delete(arch);
      return d?.cerraduras || [];
    }));
    return (await cerradurasCache.get(arch) || []).find(c => c.door === door && (c.escena == null || c.escena === escena)) || null;
  }
  function eventoDeItem(k) {
    const pj = aJuego(pies(_v)), cintura = _v.clone();
    cintura.y += OJOS * .5;
    const cuerpo = ctl.m.cuerpo, vr = M.enVR();
    const fr = vr || vista === "1ra" ? (() => {
      const f = M.camara.getWorldDirection(new THREE.Vector3);
      return [ -f.x, f.z ];
    })() : [ Math.sin(cuerpo), Math.cos(cuerpo) ];
    let mejor = null, md = Infinity, puerta = null;
    for (const o of eventos) {
      const z = o.zona;
      if (!z || z.dmy13 !== k || !o.ev) continue;
      if (z.dmy1 === 6 && !o.pos) {
        if (puerta) continue;
        const en = puertas.filter(p => p.caja.containsPoint(cintura));
        const p = en.length ? elegirPuerta(en, {
          fr: fr,
          cintura: cintura,
          conAccion: true
        }) : null;
        if (p) puerta = {
          o: o,
          p: p
        };
        continue;
      }
      if (!o.pos || !vigente(o)) continue;
      const dentro = tieneZona(o) ? dentroDeZona(o, pj, 80) : Math.hypot(o.pos[0] - pj[0], o.pos[2] - pj[2]) <= (z.radio || 150) + 80 && Math.abs(o.pos[1] - pj[1]) <= 600;
      if (!dentro) continue;
      const d = Math.hypot(o.pos[0] - pj[0], o.pos[2] - pj[2]);
      if (d < md) {
        md = d;
        mejor = o;
      }
    }
    return mejor ? {
      o: mejor
    } : puerta;
  }
  function usarConCorrer(f) {
    henry.inventario?.cerrar?.();
    correr(async () => {
      const r = await f();
      if (r === false) {
        await decir([ juego.textoComun?.(25) || "Esto no lo puedo usar aquí." ]);
        return null;
      }
      if (r?.volver302 || r?.aEtapa) return r;
      return despuesDeEvento();
    });
    return "evento";
  }
  function usarItemMundo(k) {
    if (!activo) return null;
    if (ocupado || juego.demoActual || juego.hablando || gameOverPendiente || /^(game over|pausa)/.test(juego.fase || "")) return "silencio";
    for (const probar of [ ...henry.inventario?.__usarItem?.values() || [] ]) {
      let f = null;
      try {
        f = probar(k);
      } catch (e) {
        console.warn("usar ítem", e);
      }
      if (typeof f === "function") return usarConCorrer(f);
    }
    const x = eventoDeItem(k);
    if (x?.p) {
      const p = x.p;
      return usarConCorrer(async () => {
        const c = await cerraduraDePuerta(p.door_no);
        if (!c || c.item !== k || F(c.bandera)) return false;
        return pasarPuerta(p);
      });
    }
    if (x?.o) return usarConCorrer(() => ejecutar(x.o));
    if (k === (henry.ITEM?.VELA ?? 4) && maldicion?.apoyarVela) return usarConCorrer(async () => {
      await maldicion.apoyarVela();
      return null;
    });
    return null;
  }
  if (henry.inventario) henry.inventario.alUsar = usarItemMundo;
  let mod = null;
  const mods = new Map;
  function empujar(d, dist) {
    if (M.enVR()) {
      const cab = M.camara.getWorldPosition(new THREE.Vector3);
      const m = moverConColision(new THREE.Vector3(cab.x, M.jugador.position.y + OJOS, cab.z), d, dist);
      M.jugador.position.x += m.x;
      M.jugador.position.z += m.z;
    } else {
      moverConColision(rig.position, d, dist);
      pisarRig();
      seguirConElRig();
    }
  }
  const apiMundo = {
    THREE: THREE,
    M: M,
    juego: juego,
    henry: henry,
    enemigos: enemigos,
    cine: cine,
    cont: cont,
    amb: amb,
    PARTIDA: PARTIDA,
    DS: DS,
    PC: PC,
    F: F,
    prender: prender,
    decir: decir,
    texto: texto,
    mostrarSub: mostrarSub,
    bajar: bajar,
    aMundo: aMundo,
    aJuego: aJuego,
    pies: pies,
    ubicarHenry: ubicarHenry,
    ejecutar: ejecutar,
    empujar: empujar,
    irA: async (n, llegada = {}) => {
      try {
        return await cargarEscena(n, llegada);
      } catch (e) {
        console.warn("irA", n, e);
        estado("");
        await M.fundir(0, .35);
        throw e;
      }
    },
    get vista() {
      return vista;
    },
    objetosEscena: n => (mitad === 2 ? E.objetos_segunda_mitad : E.objetos)?.[String(n)] || [],
    eventosCrudos: n => {
      const d = MD?.etapas?.[etapa]?.escenas?.[String(n)];
      return (mitad === 2 ? d?.mitad2 : d?.mitad1) || [];
    },
    get colision() {
      return colision;
    },
    get eventos() {
      return eventos;
    },
    get mitad() {
      return mitad;
    },
    get escena() {
      return escena;
    },
    eileen: eileen,
    darItem: (k, o) => darItem(k, o),
    eileenConHenry: () => !!eileen.actual?.conHenry(),
    async ponerEileen({pos: pos, rot: rot = 0} = {}) {
      PARTIDA.eileen ||= guardadoNuevo();
      PARTIDA.eileen.estado = 1;
      PARTIDA.eileen.etapa = ETAPA_N[etapa] ?? 0;
      PARTIDA.eileen.escena = escena;
      try {
        await eileen.poner({
          pos: pos,
          rot: rot,
          guardado: PARTIDA.eileen
        });
      } catch (e) {
        console.warn("Eileen", e.message);
      }
      return eileen.actual;
    },
    dejarEileen() {
      const a = eileen.actual;
      if (a) a.w.finEstado = 1; else if (PARTIDA.eileen?.estado === 1) PARTIDA.eileen.estado = 2;
    },
    eileenConmigo() {
      const a = eileen.actual;
      if (a) {
        a.w.finEstado = 2;
        a.g.estado = 1;
      } else if (PARTIDA.eileen?.estado) PARTIDA.eileen.estado = 1;
    }
  };
  const maldicion = crearMaldicionMundos({
    THREE: THREE,
    M: M,
    juego: juego,
    henry: henry,
    enemigos: enemigos,
    amb: amb,
    PARTIDA: PARTIDA,
    bajar: bajar,
    getColision: getColision,
    cont: cont,
    decir: decir,
    pies: pies,
    aJuego: aJuego
  });
  async function jugar(et, {atajo: atajo = null, llegada: llegada = null} = {}) {
    etapa = et;
    cfg = MUNDOS[et];
    E = ESC.etapas[et];
    mitad = cfg.mitad ?? (F(1130) ? 2 : 1);
    if (!mods.has(et)) mods.set(et, cfg.crear ? cfg.crear(apiMundo) : null);
    mod = mods.get(et);
    juego.fase = "mundo " + et;
    const nPaq = MD?.etapas?.[et]?.paquete_mensajes, nomPaq = cfg.mensajes || MD?.etapas?.[et]?.mensajes;
    if (nPaq && nomPaq && !paquetes[nPaq]) {
      try {
        paquetes[nPaq] = leerMensajes(await bajar(`data/message_${nomPaq}_${L}.bin`));
      } catch {
        paquetes[nPaq] = [];
      }
    }
    mEtapa = paquetes[nPaq]?.[0] || [];
    M.control.mirarLibre = false;
    M.control.soltar?.();
    await M.fundir(1, 1);
    M.ponerVelo(1);
    mostrarTitulo(cfg.nombre?.[L === "e" ? "e" : "s"] || "");
    for (const b of cfg.banderasAlLlegar || []) prender(b);
    traerInventario();
    henry.botones && (henry.botones.visibles = true);
    if (henry.armaVista) henry.armaVista.montura.visible = true;
    try {
      amb.fx?.opciones?.({
        mitad: F(1130) ? 2 : 1
      });
    } catch {}
    activo = true;
    const ini = llegada?.escena ? llegada : atajo && /\d/.test(atajo) ? null : mod?.inicio?.();
    let n = ini?.escena ?? cfg.inicio.escena;
    if (atajo && /^[a-z]{2}\d\d/.test(atajo)) {
      n = escenaDeSala(atajo) || n;
      if (n !== cfg.inicio.escena) for (const b of cfg.banderasAtajo || []) prender(b);
    }
    if (vista === "3ra") ponerTercera(); else ponerPrimera(0);
    await cargarEscena(n, ini?.pos ? {
      pos: ini.pos,
      rot: ini.rot
    } : {});
    if (vista === "1ra") ponerPrimera(ctl.m.cuerpo);
    await M.esperar(q.has("quieto") ? .1 : 1.2);
    mostrarTitulo("");
    const fin = new Promise(ok => {
      terminar = ok;
    });
    M.tareas.add(tarea);
    ocupado = true;
    let r0 = null;
    try {
      r0 = await correrAutomaticos();
    } finally {
      ocupado = false;
    }
    if (r0?.volver302 || r0?.aEtapa) {
      terminar(r0);
    } else await M.fundir(0, .8);
    const r = await fin;
    M.tareas.delete(tarea);
    activo = false;
    if (PARTIDA.henry) PARTIDA.henry.vida = ctl.s.vida;
    mod?.alSalir?.();
    mods.delete(et);
    mod = null;
    if (!r?.porAgujero) prender(cfg.terminado);
    return r;
  }
  async function volverAl302(r) {
    juego.fase = "vuelta al 302";
    await M.fundir(1, .6);
    salirEileen();
    guardarInventario();
    enemigos.alCargarSala("--");
    try {
      amb.fx?.enemigos?.(null);
    } catch {}
    henry.personaje.grupo.visible = false;
    if (henry.botones) henry.botones.visibles = false;
    if (henry.armaVista) henry.armaVista.montura.visible = false;
    henry.ponerModo("1ra");
    sh4.henry = null;
    soltarObjetosFijos();
    soltarItems();
    velasSala?.dispose();
    velasSala = null;
    vueltaItems++;
    cont.clear();
    colision = null;
    M.jugador.rotation.set(0, 0, 0);
    if (!M.enVR()) {
      M.camara.position.set(0, OJOS_302, 0);
      M.camara.rotation.set(0, 0, 0);
      M.camara.fov = 60;
      M.camara.updateProjectionMatrix();
      M.anclarCapas();
    }
    prender(1518);
    const base = ctx.cuarto && ctx.varianteDe ? ctx.varianteDe("rl0" + ((r.escena302 ?? 2) - 1)) : "rl01a";
    await ctx.cuarto.cargar(base, {
      pos: aMundo([ 276.03, 0, -423.77 ]),
      giro: ctx.giroDeAngulo ? ctx.giroDeAngulo(-.73) : 0
    });
    ctx.alEntrarSala?.();
    ctx.refrescar?.();
    if (ctx.demo) await ctx.demo(54, {
      sinFundido: true
    });
    M.pantalla.ocultar();
    juego.fase = "302";
    await M.fundir(0, .8);
    await (ctx.automaticos?.());
  }
  return {
    jugar: jugar,
    volverAl302: volverAl302,
    henry: henry,
    enemigos: enemigos,
    eileen: eileen,
    camaraJuego: cj,
    cine: cine,
    get mod() {
      return mod;
    },
    eventosCrudos: n => apiMundo.eventosCrudos(n),
    maldicion: maldicion,
    get sala() {
      return nombreSala;
    },
    get listo() {
      return activo && !ocupado && !juego.demoActual && !juego.hablando && M.tareas.has(tarea);
    },
    get escena() {
      return escena;
    },
    get vista() {
      return vista;
    },
    get mitad() {
      return mitad;
    },
    get eventos() {
      return eventos;
    },
    get puertas() {
      return puertas;
    },
    get items() {
      return items.map(i => i.grupo.name);
    },
    cambiarVista: () => cambiarVista(),
    ir: (n, posJuego = null, rot = null) => cargarEscena(typeof n === "string" ? escenaDeSala(n) : n, posJuego ? {
      pos: posJuego,
      rot: rot
    } : {}),
    ubicar: ubicarHenry,
    ejecutar: ejecutar,
    demo: demoMundo,
    pasarPuerta: pasarPuerta,
    correrEvento: o => correr(() => ejecutar(o).then(async r => r || await despuesDeEvento())),
    usarPuerta: p => correr(() => pasarPuerta(p)),
    estado() {
      return {
        sala: nombreSala,
        escena: escena,
        vista: vista,
        mitad: mitad,
        vida: +ctl.s.vida.toFixed(1),
        estado: ctl.s.estado,
        arma: ctl.s.arma,
        henry: aJuego(pies()).map(x => Math.round(x)),
        enemigos: enemigos.resumen?.(),
        eventos: eventos.filter(vigente).map(o => `${o.i}:ev${o.ev?.evnum ?? "-"}${o.ev?.demo ? " d" + o.ev.demo : ""}${o.item ? " it" + o.item : ""}`),
        puertas: puertas.map(p => `${p.door_no}->${p.lleva_a_escena}`),
        armaVista: henry.armaVista?.estado,
        fase: juego.fase,
        camarasEvento: camarasEv.map(c => `${c.o.indice}${c.existe ? "*" : ""}`),
        camaraEvento: camEv ? camEv.o?.indice ?? "fija" : null,
        eileen: eileen.actual?.estado() || null
      };
    }
  };
}
