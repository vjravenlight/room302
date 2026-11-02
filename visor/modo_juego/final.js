// SH4 web — FeniXVOID · Project Ravenlight
import * as THREE from "three";

import { q } from "./motor.js";

import { partesBin } from "../lib/sh4bin.js";

import { leerModelo } from "../lib/modelo.js";

import { leerTexturas } from "../lib/texturas.js";

import { leerAnimacion } from "../lib/animacion.js";

import { crearPersonaje } from "../lib/personaje.js";

import { AnimEnemigo, crearMovedor, DT, distXZ, envolver, rumboHacia } from "../enemigos/comun.js";

import { KillerLast, KillerBody, ANIM_WALTER, ANIM_CUERPO_BASE, MODELOS, HUESO_MANO, HUESO_CUERPO_LANZAS, NOMBRE_PASO, P as PW } from "../enemigos/ia_killer_last.js";

import { crearManejoEileen, guardadoNuevo, eileenSobrevive } from "../enemigos/eileen.js";

import { crearObjetoJefe, crearCharcoJefe } from "../efectos/objetos_demo.js";

import { jugarFin, decidirFinal, LETRA_FINAL } from "./final_fin.js";

const ITEM = {
  CORDON: 87,
  LANZA: 88,
  LLAVES: 60
};

const LANZAS = [ {
  ang: .628,
  x: 1763,
  z: 2427,
  pos: [ 1764.17, -348.61, 2434.77 ],
  quat: [ -.151, -.859, -.395, .288 ]
}, {
  ang: 1.257,
  x: 2853,
  z: 927,
  pos: [ 2858.41, -348.61, 932.41 ],
  quat: [ -.266, -.728, -.329, .54 ]
}, {
  ang: 1.885,
  x: 2853,
  z: -927,
  pos: [ 2860.34, -348.61, -926.56 ],
  quat: [ -.355, -.525, -.231, .738 ]
}, {
  ang: 2.513,
  x: 1763,
  z: -2427,
  pos: [ 1767.57, -348.6, -2432.17 ],
  quat: [ -.409, -.271, -.11, .864 ]
}, {
  ang: 3.77,
  x: -1763,
  z: -2427,
  pos: [ -1765.58, -348.6, -2433.62 ],
  quat: [ .395, -.288, -.151, -.859 ]
}, {
  ang: 4.398,
  x: -2853,
  z: -927,
  pos: [ -2859.46, -348.59, -931.02 ],
  quat: [ .329, -.539, -.266, -.728 ]
}, {
  ang: 5.027,
  x: -2853,
  z: 927,
  pos: [ -2860.48, -348.59, 926.02 ],
  quat: [ .231, -.738, -.355, -.525 ]
}, {
  ang: 5.655,
  x: -1763,
  z: 2427,
  pos: [ -1768.72, -348.59, 2431.39 ],
  quat: [ .11, -.864, -.409, -.272 ]
} ];

const CUERPO = {
  ang: Math.PI,
  x: 0,
  z: -2800
};

const LANZA = {
  CERCA: 80,
  ANG: Math.PI / 4,
  CUERPO_CERCA: 600,
  CUERPO_ANG: 1.2566371,
  ACERCA: .2,
  GIRO: 8,
  TOMA: .8,
  CLAVA: 1.03,
  ESPERA: .4,
  ENFRIA: 2,
  PROC_SACAR: 121,
  PROC_TOMAR: 122,
  PROC_CLAVAR: 123
};

const EIL = {
  INICIO: [ 0, -307, 2800 ],
  DIR: Math.PI,
  ESPERA: 300,
  APURA_Z: 920,
  CAE_Z: 650,
  ACEL: .01,
  VEL: 6.4,
  PAUSA: 300,
  PAUSA_MIN: 40,
  FRENA: .3,
  CAE_Y: 10,
  ANIM_CAMINA: 2,
  ANIM_QUIETA: 1,
  ANIM_CAE: 76,
  SON_CAE: 20241
};

const P = {
  NADA: 0,
  SACA: 1,
  TOMA: 2,
  GUARDA: 3,
  CLAVA0: 4,
  CLAVA: 5,
  CLAVADA: 6,
  ESPERA: 7
};

const ESTADO_LANZA = 123;

const QZ = (new THREE.Quaternion).setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI);

export const FINAL = {
  etapa: "ls",
  nombre: {
    s: "",
    e: ""
  },
  inicio: {
    escena: 1
  },
  mitad: 1,
  terminado: 4,
  banderasAlLlegar: [],
  banderasAtajo: [ 1901 ],
  despues: {
    218: {
      pos: [ -10, -17, 560 ],
      rot: 0
    },
    50: {
      pos: [ -1470, 18, 840 ],
      rot: .838
    }
  },
  crear: api => crearTramoFinal(api)
};

function eventosDe(n) {
  if (n === 1) return [ {
    i: 1,
    ev: {
      evnum: 218,
      demo: 68,
      cond: "!F1901"
    }
  }, {
    i: 3,
    pos: [ 0, 0, 0 ],
    zona: {
      dmy1: 1,
      radio: 600,
      alto: 100,
      dmy6: 5
    },
    ev: {
      evnum: 3131,
      cond: "F1901 AND !F4",
      propio: "agujero"
    }
  } ];
  if (n === 2) return [ {
    i: 3,
    ev: {
      evnum: 50,
      demo: 69,
      cond: "!F1903"
    }
  }, {
    i: 4,
    pos: [ -10, 20, -2919 ],
    zona: {
      dmy1: 1,
      radio: 400,
      alto: 100,
      dmy6: 2
    },
    ev: {
      evnum: 2327,
      cond: "!F1904",
      propio: "cordon"
    }
  }, ...LANZAS.map((l, k) => ({
    i: "lanza" + k,
    pos: [ l.x, 0, l.z ],
    zona: {
      dmy1: 1,
      radio: LANZA.CERCA,
      alto: 100,
      dmy6: 1
    },
    ev: {
      evnum: 9100 + k,
      cond: "siempre",
      propio: "lanza",
      k: k
    }
  })), {
    i: "cuerpo",
    pos: [ CUERPO.x, 0, CUERPO.z ],
    zona: {
      dmy1: 1,
      radio: LANZA.CUERPO_CERCA,
      alto: 100,
      dmy6: 1
    },
    ev: {
      evnum: 9120,
      cond: "siempre",
      propio: "cuerpo"
    }
  } ];
  return [];
}

function crearTramoFinal(api) {
  const {M: M, juego: juego, henry: henry, PARTIDA: PARTIDA, F: F, prender: prender, bajar: bajar, aMundo: aMundo, aJuego: aJuego} = api;
  const ctl = henry.controlador;
  const amb = api.amb || {};
  const son = () => amb.son || null;
  const extras = [];
  const grupo = new THREE.Group;
  grupo.name = "tramo final";
  M.escena.add(grupo);
  const movedor = crearMovedor(THREE, () => api.colision, .005);
  const rayo = new THREE.Raycaster, vA = new THREE.Vector3, vB = new THREE.Vector3;
  let escena = 0, walter = null, cuerpo = null, anillos = null, charco = null, lanzas = [], cargado = null, fin = null;
  let acum = 0, accion = null, finalForzado = null, muertoAntes = false, continuadas = 0;
  const eil = {
    manejo: null,
    actual: null,
    paso: 0,
    cuenta: 0,
    k: 1,
    param: 0,
    pausa: 0,
    ya: 0,
    velAnt: 0,
    cayo: false
  };
  const ff = (q.get("finalfijo") || "").toUpperCase();
  if (ff && "ABCD".includes(ff) && ff.length === 1) finalForzado = ff;
  function jugador() {
    const s = ctl.s, E = henry.ESTADO;
    let estado = 1;
    if (s.muerto || s.estado === E.MUERTE || s.estado === E.MUERTO) estado = 10; else if (accion) estado = 7; else if (s.danio) estado = 6; else if ([ E.GOLPE, E.GOLPE_FUERTE, E.REMATE, E.REMATE2 ].includes(s.estado)) estado = 5; else if (s.estado === E.GUARDIA) estado = 4; else if (s.estado === E.PREPARAR) estado = 3;
    const pos = aJuego(henry.personaje.grupo.position);
    const objetivo = s.objetivo?.enemigo || s.objetivo;
    return {
      pos: pos,
      rot: ctl.m.cuerpo,
      estado: estado,
      enAccion: !!accion,
      tieneLanza: cuantos(ITEM.LANZA) > 0,
      apuntado: estado >= 3 && estado <= 5 ? objetivo === walter ? 1 : 2 : 0,
      corriendo: (ctl.m?.run ?? 0) > .5 && (ctl.m?.move ?? 0) > .3
    };
  }
  const cuantos = k => henry.inventario?.cuantos?.(k) || 0;
  function vista(a, b) {
    const col = api.colision;
    if (!col) return true;
    vA.set(-a[0] * .005, -a[1] * .005, a[2] * .005);
    vB.set(-b[0] * .005, -b[1] * .005, b[2] * .005);
    const L = vA.distanceTo(vB);
    if (L < .001) return true;
    rayo.set(vA, vB.sub(vA).normalize());
    rayo.far = L;
    return !rayo.intersectObject(col).some(h => Math.abs(h.face.normal.y) < .6);
  }
  const sonido = (id, pos, op) => {
    try {
      return son()?.efecto?.(id, pos ? aMundo(pos) : null, op) || null;
    } catch {
      return null;
    }
  };
  const m = {
    jugador: jugador,
    vista: vista,
    sonido: sonido,
    get nivel() {
      return Math.max(0, Math.min(4, juego.nivel ?? 2));
    },
    mover: (p, dx, dz, r) => movedor.mover(p, dx, dz, r),
    piso: p => movedor.piso(p, 120, 600),
    bandera: n => F(n),
    get cuerpo() {
      return cuerpo;
    },
    golpear(golpe, {desde: desde} = {}) {
      if (accion) abortarAccion();
      try {
        henry.recibirDaño(null, golpe, desde ? aMundo(desde) : null);
      } catch (e) {
        console.warn("golpe de Walter", e.message);
      }
    },
    efecto(tipo, d) {
      if (tipo === "sangre_lanza" && d?.lanza) {
        const p = d.lanza.getWorldPosition(new THREE.Vector3);
        try {
          amb.fx?.disparar?.("sangre", {
            posMundo: [ p.x, p.y, p.z ],
            dir: [ 0, 1, 0 ],
            tam: 500
          });
        } catch {}
      }
    },
    alMorir: () => empezarFinal(),
    camino(e, dest) {
      const c = api.enemigos?.caminos;
      if (!c?.busquedaEnemigo) return null;
      e.busqueda ||= c.busquedaEnemigo();
      const desde = [ e.pos[0], e.pos[1] - 40, e.pos[2] ];
      const p = e.busqueda.buscar(desde, [ dest[0], dest[1], dest[2] ]) ? e.busqueda.punto(desde, 100, 400) : null;
      if (c.ver) c.ruta(e.id, e.pos, p ? [ p ] : [], 16744512);
      return p;
    }
  };
  async function cargar() {
    if (cargado) return cargado;
    cargado = (async () => {
      const [b, wp] = await Promise.all([ bajar("data/enemy_killer_last.bin"), bajar("data/wp_model.bin") ]);
      const pb = partesBin(b), pw = partesBin(wp);
      const mod = n => pb[n], lista = pb.filter(x => x.tipo === "animacion").map(x => leerAnimacion(b, x.ofs, x.len));
      const pj = (mi, ti) => crearPersonaje(leerModelo(b, mod(mi).ofs, mod(mi).len), leerTexturas(b, mod(ti).ofs, mod(ti).len));
      const pW = pj(...MODELOS.walter);
      pW.grupo.name = "Walter (jefe final)";
      for (const h of HUESO_MANO) {
        const a = pj(...MODELOS.pistola), c = a.contenedor;
        c.rotation.set(0, 0, 0);
        c.scale.setScalar(1);
        c.position.set(0, 0, 0);
        pW.huesos[h]?.add(c);
      }
      const animsW = [];
      for (let n = 0; n < 50; n++) animsW[n] = lista[ANIM_WALTER[n] ?? 0];
      const pC = pj(...MODELOS.cuerpo);
      pC.grupo.name = "cuerpo de Walter (la madre)";
      const animsC = [];
      for (let n = 0; n < 10; n++) animsC[n] = lista[ANIM_CUERPO_BASE + n] || lista[ANIM_CUERPO_BASE];
      const L = LANZAS.map((l, k) => {
        const p = crearPersonaje(leerModelo(wp, pw[78].ofs, pw[78].len), leerTexturas(wp, pw[111].ofs, pw[111].len));
        p.grupo.name = "Lanza de la Madre Sagrada " + (k + 1);
        return p;
      });
      let objeto = null, charco = null;
      try {
        objeto = await crearObjetoJefe({
          THREE: THREE,
          bajar: bajar,
          escala: .005
        });
      } catch (e) {
        console.warn("anillos del jefe", e.message);
      }
      try {
        charco = await crearCharcoJefe({
          THREE: THREE,
          bajar: bajar,
          escala: .005
        });
      } catch (e) {
        console.warn("charco del jefe", e.message);
      }
      return {
        pW: pW,
        animsW: animsW,
        pC: pC,
        animsC: animsC,
        L: L,
        objeto: objeto,
        charco: charco
      };
    })();
    return cargado;
  }
  async function armarPelea() {
    const d = await cargar();
    if (escena !== 2) return;
    const nivel = m.nivel;
    let param = null;
    try {
      const E = await (await fetch("/datos/enemigos.json")).json();
      const t = E.parametros.KILLER.tipos[1];
      param = t[Math.min(nivel, t.length - 1)];
    } catch {}
    walter = new KillerLast({
      pj: d.pW,
      anim: new AnimEnemigo(d.pW, d.animsW, []),
      m: m,
      def: {
        pos: [ -1e3, 0, 1580 ],
        rumbo: 1.5
      },
      param: param
    });
    cuerpo = new KillerBody({
      pj: d.pC,
      anim: new AnimEnemigo(d.pC, d.animsC, []),
      m: m,
      def: {
        pos: [ 0, 0, 0 ],
        rumbo: 0
      }
    });
    d.pC.reproductor.enElLugar = false;
    grupo.add(d.pW.grupo, d.pC.grupo);
    if (d.objeto) {
      grupo.add(d.objeto.grupo);
      anillos = d.objeto;
    }
    if (d.charco) {
      d.charco.prender(true);
      grupo.add(d.charco.grupo);
      charco = d.charco;
    }
    lanzas = d.L.map((pj, k) => ({
      k: k,
      pj: pj,
      estado: 1
    }));
    for (const l of lanzas) ponerLanzaEnElMundo(l);
    const ya = Math.max(0, Math.min(8, +(q.get("lanzas") || 0)));
    if (q.has("cordon") || ya) prender(1904);
    for (let k = 0; k < ya; k++) {
      clavarEnCuerpo(lanzas[k], false);
    }
    if (cuerpo.todas) walter.cambiar(PW.EVENTO3);
    extras.length = 0;
    extras.push(walter);
    api.enemigos.extras = [ walter, ...(api.enemigos.extras || []).filter(x => x?.id !== "KILLER_LAST") ];
    walter.activo = cuerpo.activo = F(1903);
    await ponerEileen();
    dibujar(1, 0);
  }
  function ponerLanzaEnElMundo(l) {
    const L = LANZAS[l.k], c = l.pj.contenedor;
    if (c.parent !== l.pj.grupo) {
      l.pj.grupo.add(c);
    }
    c.position.set(0, 0, 0);
    c.scale.setScalar(.005);
    c.quaternion.copy(QZ).multiply(new THREE.Quaternion(...L.quat).normalize());
    l.pj.grupo.position.copy(aMundo(L.pos));
    l.pj.grupo.rotation.set(0, 0, 0);
    grupo.add(l.pj.grupo);
    l.pj.grupo.visible = true;
  }
  function lanzaEnMano(l) {
    const c = l.pj.contenedor, h = henry.personaje.huesos[25];
    if (!h) return;
    c.rotation.set(0, 0, 0);
    c.scale.setScalar(1);
    c.position.set(0, 0, 0);
    h.add(c);
  }
  function clavarEnCuerpo(l, conEvento = true) {
    const hb = cuerpo?.pj.huesos[HUESO_CUERPO_LANZAS];
    l.estado = 5;
    if (!hb) return;
    if (!conEvento) {
      const c = l.pj.contenedor;
      c.rotation.set(0, 0, 0);
      c.scale.setScalar(1);
      c.position.set(0, -60 + 25 * l.k, 0);
      hb.add(c);
    } else {
      grupo.updateMatrixWorld(true);
      hb.attach(l.pj.contenedor);
      const pl = l.pj.contenedor.position, d = pl.length();
      if (d > 600) pl.multiplyScalar(600 / d);
    }
    cuerpo.clavar(l.pj.contenedor, conEvento ? walter : null);
  }
  async function ponerEileen() {
    try {
      if (!eil.manejo) eil.manejo = crearManejoEileen({
        THREE: THREE,
        bajar: bajar,
        padre: grupo,
        getColision: () => api.colision,
        escala: .005,
        enfermera: !!PARTIDA?.vestidoEileen,
        jugador: () => ({
          existe: true,
          pos: aJuego(henry.personaje.grupo.position),
          rot: ctl.m.cuerpo,
          estado: 1,
          vel: 0,
          tocoPuerta: false
        }),
        sonido: (id, pos, op) => sonido(id, pos, op),
        mostrarSub: t => api.mostrarSub(t),
        escena: () => ({
          etapa: 9,
          escena: 2
        })
      });
      if (eil.inicial) PARTIDA.eileen = JSON.parse(eil.inicial);
      const g = PARTIDA.eileen || guardadoNuevo();
      if (q.has("maldicion")) g.maldicion = Math.max(0, Math.min(.95, +q.get("maldicion") || 0));
      if (!eil.inicial) eil.inicial = JSON.stringify(g);
      PARTIDA.eileen = g;
      eil.actual = await eil.manejo.poner({
        pos: [ ...EIL.INICIO ],
        rot: EIL.DIR,
        guardado: g
      });
      eil.actual.ubicar([ ...EIL.INICIO ], EIL.DIR);
      eil.paso = 0;
      eil.cayo = !eileenSobrevive(g);
      eil.actual.pj.grupo.visible = !eil.cayo;
      g.estado = 1;
    } catch (e) {
      console.warn("Eileen en la pelea final", e);
      eil.actual = null;
    }
  }
  function tickEileen() {
    const ei = eil.actual;
    if (!ei || eil.cayo && eil.paso >= 5) return;
    ei.posAnt = [ ...ei.pos ];
    ei.rotAnt = ei.rot;
    const g = ei.g;
    switch (eil.paso) {
     case 0:
      eil.k = 1 - (g.maldicion || 0);
      eil.cuenta = EIL.ESPERA;
      ei.ponerAnim(EIL.ANIM_QUIETA, {
        mezcla: 0
      });
      eil.paso = 1;
      break;

     case 1:
      eil.cuenta--;
      if (eil.cuenta < 0) {
        eil.paso = 2;
        eil.param = 0;
        eil.ya = 0;
        ei.ponerAnim(EIL.ANIM_CAMINA, {
          vel: 0
        });
      }
      break;

     case 2:
     case 3:
      {
        const c = 1 - eil.k;
        const acel = (1 + c) * EIL.ACEL, max = (c + 1) * .5;
        const pausa = Math.round(eil.k * EIL.PAUSA + EIL.PAUSA_MIN - .49);
        let vel = 0;
        if (eil.paso === 2) {
          const f = ei.cuadro;
          if (f < 5) {
            eil.ya = 0;
            eil.pausa = pausa;
          }
          if (f > 7 && !eil.ya) {
            eil.paso = 3;
          }
          eil.param = Math.max(0, Math.min(max, eil.param + acel));
          ei.ac.vel = eil.param;
          vel = eil.param * EIL.VEL;
        } else {
          ei.ac.vel = 0;
          vel = Math.max(0, eil.velAnt - EIL.FRENA);
          eil.pausa--;
          if (eil.pausa < 0) {
            ei.ac.t = 0;
            eil.param = 0;
            eil.ya = 1;
            eil.paso = 2;
          }
        }
        eil.velAnt = vel;
        ei.pos[2] -= vel;
        const y = movedor.piso(ei.pos, 200, 600);
        if (y != null) ei.pos[1] = y;
        if (ei.pos[2] < EIL.APURA_Z) eil.k = Math.max(-20, Math.min(1, eil.k - .2));
        if (ei.pos[2] < EIL.CAE_Z) {
          g.banderas = g.banderas || new Array(32).fill(0);
          g.banderas[19] |= 1;
          PARTIDA.eileen = g;
          sonido(EIL.SON_CAE, ei.pos);
          eil.cayo = true;
          eil.paso = 4;
          eil.sub = 0;
        }
        break;
      }

     case 4:
      if (!eil.sub) {
        ei.ponerAnim(EIL.ANIM_CAE, {
          mezcla: .1,
          loop: false
        });
        eil.sub = 1;
      } else if (ei.animFin) {
        ei.pj.grupo.visible = false;
        eil.paso = 5;
      }
      ei.pos[1] += EIL.CAE_Y;
      break;

     default:
      break;
    }
    ei.avanzarAnim();
  }
  const rig = () => aJuego(api.pies());
  function empezarAccion(tipo, l) {
    accion = {
      tipo: tipo,
      l: l,
      fase: tipo === "sacar" ? P.SACA : P.CLAVA0,
      t: 0,
      espera: 0
    };
    ctl.s.estado = ESTADO_LANZA;
    ctl.s.objetivo = null;
    if (henry.armas?.actual) henry.armas.actual.grupo.visible = false;
  }
  function terminarAccion() {
    accion = null;
    if (ctl.s.estado === ESTADO_LANZA) {
      ctl.s.estado = henry.ESTADO.NORMAL;
      ctl.ponerProceso(0, {
        forzar: true,
        mezcla: .3
      });
    }
    if (henry.armas?.actual) henry.armas.actual.grupo.visible = true;
  }
  function abortarAccion() {
    const a = accion;
    if (!a) return;
    if (a.l) {
      if (a.l.estado === 2) {
        a.l.estado = 1;
        ponerLanzaEnElMundo(a.l);
      } else if (a.l.estado === 4) {
        a.l.estado = 3;
        a.l.pj.grupo.visible = false;
        grupo.add(a.l.pj.grupo);
        a.l.pj.grupo.add(a.l.pj.contenedor);
      }
    }
    accion = null;
    if (henry.armas?.actual) henry.armas.actual.grupo.visible = true;
    if (ctl.s.estado === ESTADO_LANZA) ctl.s.estado = henry.ESTADO.NORMAL;
  }
  function acercarA(x, z, ang) {
    const p = rig(), dx = x - p[0], dz = z - p[2];
    const d = Math.hypot(dx, dz) * LANZA.ACERCA;
    if (d > .5) api.empujar(new THREE.Vector3(-dx, 0, dz).normalize(), d * .005);
    ctl.m.rumbo = ang;
    const dc = envolver(ang - ctl.m.cuerpo), pc = LANZA.GIRO * DT;
    ctl.m.cuerpo = Math.abs(dc) < pc ? ang : envolver(ctl.m.cuerpo + Math.sign(dc) * pc);
  }
  function tickAccion() {
    const a = accion;
    if (!a) return;
    if (ctl.s.danio || ctl.s.muerto) {
      abortarAccion();
      return;
    }
    const an = henry.animador;
    a.t += DT;
    switch (a.fase) {
     case P.SACA:
      {
        if (a.t <= DT * 1.5) ctl.ponerProceso(LANZA.PROC_SACAR, {
          forzar: true
        });
        const L = LANZAS[a.l.k];
        acercarA(L.x, L.z, L.ang);
        if (a.t > .2 && an.terminada) {
          if (F(1904)) {
            a.fase = P.TOMA;
            a.t = 0;
            lanzaEnMano(a.l);
            ctl.ponerProceso(LANZA.PROC_TOMAR, {
              forzar: true
            });
          } else {
            a.l.estado = 1;
            a.fase = P.ESPERA;
            a.t = 0;
            api.decir([ api.texto(12, 17) || "Las lanzas están clavadas." ]);
          }
        }
        break;
      }

     case P.TOMA:
      if (an.segundos > LANZA.TOMA) {
        henry.agregarItem(ITEM.LANZA, 1);
        a.l.estado = 3;
        a.l.pj.grupo.visible = false;
        a.l.pj.grupo.add(a.l.pj.contenedor);
        a.fase = P.GUARDA;
      }
      break;

     case P.GUARDA:
      if (an.terminada) terminarAccion();
      break;

     case P.CLAVA0:
      ctl.ponerProceso(LANZA.PROC_CLAVAR, {
        forzar: true
      });
      lanzaEnMano(a.l);
      a.l.pj.grupo.visible = true;
      a.l.estado = 4;
      a.fase = P.CLAVA;
      a.t = 0;
      break;

     case P.CLAVA:
      acercarA(rig()[0], rig()[2], Math.atan2(CUERPO.x - rig()[0], CUERPO.z - rig()[2]));
      if (an.segundos > LANZA.CLAVA) {
        henry.inventario?.quitar?.(ITEM.LANZA, 1);
        a.l.pj.grupo.visible = true;
        clavarEnCuerpo(a.l, true);
        a.fase = P.CLAVADA;
        a.t = 0;
      }
      break;

     case P.CLAVADA:
      if (an.terminada) {
        a.espera = LANZA.ENFRIA;
        terminarAccion();
      }
      break;

     case P.ESPERA:
      if (a.t > LANZA.ESPERA) terminarAccion();
      break;

     default:
      terminarAccion();
    }
  }
  function puedeClavar() {
    if (accion || escena !== 2 || !cuerpo) return null;
    const p = rig(), d = Math.hypot(CUERPO.x - p[0], CUERPO.z - p[2]);
    if (d >= LANZA.CUERPO_CERCA || Math.abs(envolver(CUERPO.ang - ctl.m.cuerpo)) >= LANZA.CUERPO_ANG) return null;
    if (!cuantos(ITEM.LANZA)) return null;
    return lanzas.find(l => l.estado === 3) || null;
  }
  let usarPedido = null;
  henry.inventario?.alMensaje?.(t => {
    if (!vivo || !henry.inventario?.abierto) return;
    const l = henry.inventario.lugares?.[henry.inventario.sel];
    if (l?.k === ITEM.LANZA && puedeClavar()) usarPedido = "cuerpo"; else if (l?.k === ITEM.CORDON && escena === 2 && !F(1904) && distXZ(rig(), [ -10, 0, -2919 ]) < 460) usarPedido = "cordon"; else return;
    henry.inventario.cerrar?.();
  });
  let vivo = true;
  function empezarFinal() {
    if (fin) return;
    fin = {
      pedido: true
    };
    api.eventos.push({
      i: "fin",
      pos: [ 0, 0, 0 ],
      zona: {
        dmy1: 1,
        radio: 1e7,
        alto: 1e7
      },
      ev: {
        evnum: 9200,
        cond: "siempre",
        propio: "fin"
      }
    });
  }
  async function correrFinal() {
    const letra = finalForzado || decidirFinal({
      eileen: eil.actual?.g || PARTIDA.eileen,
      PARTIDA: PARTIDA
    });
    for (const b of [ 5, 6, 7, 8, 37 ]) delete PARTIDA.banderas[b];
    prender({
      A: 5,
      B: 6,
      C: 7,
      D: 8
    }[letra]);
    prender(4);
    PARTIDA.derrotados = (PARTIDA.derrotados || 0) + 1;
    PARTIDA.continuadas = (PARTIDA.continuadas || 0) + continuadas;
    juego.fase = "final " + letra;
    await M.fundir(1, 1.1);
    grupo.visible = false;
    api.cont.visible = false;
    henry.personaje.grupo.visible = false;
    if (henry.armaVista) henry.armaVista.montura.visible = false;
    if (henry.botones) henry.botones.visibles = false;
    M.escena.background = new THREE.Color(0, 0, 0);
    try {
      son()?.musica?.(null);
    } catch {}
    await jugarFin({
      juego: juego,
      M: M,
      PARTIDA: PARTIDA,
      letra: letra,
      bajar: bajar,
      henry: henry,
      F: F
    });
  }
  function dibujar(alfa, dt) {
    if (walter) {
      const w = walter, p = w.posAnt.map((v, i) => v + (w.pos[i] - v) * alfa), dr = envolver(w.rot - w.rotAnt);
      w.pj.ubicar(p[0], p[1], p[2], w.rotAnt + dr * alfa);
      w.anim.dibujar(alfa);
      w.pj.grupo.visible = !w.muerto || w.anim.n === 26;
    }
    if (cuerpo) {
      cuerpo.pj.ubicar(cuerpo.pos[0], cuerpo.pos[1], cuerpo.pos[2], cuerpo.rot);
      cuerpo.anim.dibujar(alfa);
    }
    anillos?.actualizar?.(dt);
    charco?.actualizar?.(dt);
    if (eil.actual && eil.actual.pj.grupo.visible) eil.actual.dibujar(alfa, dt);
  }
  function tickLogico() {
    if (escena !== 2 || !walter) return;
    if (ctl.s.muerto) {
      muertoAntes = true;
      return;
    }
    if (muertoAntes) {
      muertoAntes = false;
      continuadas++;
      reiniciarPelea();
      return;
    }
    const activo = F(1903);
    walter.activo = cuerpo.activo = activo;
    if (activo) tickEileen();
    walter.tick();
    cuerpo.tick();
    if (usarPedido && !accion) {
      const u = usarPedido;
      usarPedido = null;
      if (u === "cuerpo") {
        const l = puedeClavar();
        if (l) empezarAccion("clavar", l);
      } else if (u === "cordon") api.eventos.push({
        i: "cordon_inv",
        pos: rig(),
        zona: {
          dmy1: 1,
          radio: 1e6,
          alto: 1e6
        },
        ev: {
          evnum: 9201,
          cond: "!F1904",
          propio: "cordon"
        }
      });
    }
    tickAccion();
  }
  async function reiniciarPelea() {
    for (const o of [ walter?.pj.grupo, cuerpo?.pj.grupo ]) o?.removeFromParent();
    for (const l of lanzas) l.pj.grupo.removeFromParent();
    cuerpo?.parar();
    walter = cuerpo = null;
    accion = null;
    while (cuantos(ITEM.LANZA)) henry.inventario.quitar(ITEM.LANZA, 1);
    try {
      await armarPelea();
    } catch (e) {
      console.warn("pelea final: no se pudo volver a armar", e);
    }
  }
  const mod = {
    extras: extras,
    inicio: () => ({
      escena: 1,
      pos: [ -245.04, -16.56, 579.3 ],
      rot: 2.845
    }),
    async alCargarEscena(n) {
      escena = n;
      try {
        api.eileen?.quitar?.();
      } catch {}
      api.eventos.splice(0, api.eventos.length, ...eventosDe(n).map(o => ({
        ...o,
        ev: {
          ...o.ev
        }
      })));
      if (n === 1 && finalForzado && !q.has("jefe")) {
        api.eventos.unshift({
          i: "finfijo",
          ev: {
            evnum: 9300,
            cond: "siempre",
            propio: "finfijo"
          }
        });
      }
      if (n === 2) {
        if (q.has("cordon") || +(q.get("lanzas") || 0) > 0) prender(1904);
        if (!F(1904) && !cuantos(ITEM.CORDON) && q.has("mundo")) henry.agregarItem(ITEM.CORDON, 1);
        await armarPelea();
      } else {
        for (const o of [ walter?.pj.grupo, cuerpo?.pj.grupo, eil.actual?.pj.grupo ]) o?.removeFromParent();
        walter = null;
        cuerpo?.parar();
        cuerpo = null;
        extras.length = 0;
      }
    },
    alDemo(si) {
      grupo.visible = !si;
    },
    forzar: () => accion ? {
      dir: new THREE.Vector3,
      fuerza: 0
    } : null,
    maneja(ev) {
      if (!ev?.propio) return false;
      switch (ev.propio) {
       case "agujero":
        return escena === 1;

       case "cordon":
        return escena === 2 && !F(1904) && !accion;

       case "lanza":
        return escena === 2 && !accion && lanzas[ev.k]?.estado === 1 && F(1903);

       case "cuerpo":
        return escena === 2 && !accion && !!puedeClavar();

       case "fin":
       case "finfijo":
        return true;
      }
      return false;
    },
    async ejecutar(o) {
      const ev = o.ev || {};
      if (!ev.propio) return undefined;
      switch (ev.propio) {
       case "agujero":
        {
          const si = await api.decir([ juego.textoComun?.(16) || "¿Entrar en el agujero?" ], {
            pregunta: true
          });
          if (!si) return null;
          await M.fundir(1, .6);
          await api.irA(2, {});
          if (F(1903)) await M.fundir(0, .6);
          return null;
        }

       case "cordon":
        {
          if (!cuantos(ITEM.CORDON)) return null;
          await api.ejecutar({
            ev: {
              evnum: 2327,
              demo: 31
            }
          });
          henry.inventario?.quitar?.(ITEM.CORDON, 1);
          prender(1904);
          return null;
        }

       case "lanza":
        {
          const l = lanzas[ev.k], L = LANZAS[ev.k];
          if (!l || l.estado !== 1) return null;
          if (Math.abs(envolver(L.ang - ctl.m.cuerpo)) >= LANZA.ANG && api.vista !== "1ra" && !M.enVR()) return null;
          if ((henry.inventario?.lugares?.length || 0) >= 10) {
            await api.decir([ juego.textoComun?.(17) || "Ya no puedo llevar más..." ]);
            return null;
          }
          l.estado = 2;
          empezarAccion("sacar", l);
          return null;
        }

       case "cuerpo":
        {
          const l = puedeClavar();
          if (l) empezarAccion("clavar", l);
          return null;
        }

       case "fin":
       case "finfijo":
        await correrFinal();
        return null;
      }
      return null;
    },
    cuadro(dt) {
      acum += Math.min(dt, .25);
      let n = 0;
      while (acum >= DT && n < 8) {
        tickLogico();
        acum -= DT;
        n++;
      }
      dibujar(acum / DT, dt);
    },
    alSalir() {
      vivo = false;
      cuerpo?.parar();
      grupo.removeFromParent();
    }
  };
  mod.estado = () => ({
    escena: escena,
    accion: accion ? `${accion.tipo} ${accion.fase}` : null,
    walter: walter ? {
      paso: NOMBRE_PASO[walter.paso],
      sub: walter.sub,
      hp: Math.round(walter.hp),
      aguante: Math.round(walter.aguante),
      vulnerable: walter.vulnerable,
      pos: walter.pos.map(Math.round),
      anim: walter.anim.n,
      cuadro: walter.anim.cuadro,
      muerto: walter.muerto
    } : null,
    cuerpo: cuerpo ? {
      lanzas: cuerpo.lanzas,
      todas: cuerpo.todas,
      anim: cuerpo.anim.n
    } : null,
    lanzas: lanzas.map(l => l.estado).join(""),
    eileen: eil.actual ? {
      paso: eil.paso,
      z: Math.round(eil.actual.pos[2]),
      y: Math.round(eil.actual.pos[1]),
      cayo: eil.cayo,
      k: +eil.k.toFixed(2)
    } : null,
    banderas: [ 1901, 1903, 1904, 4, 5, 6, 7, 8 ].filter(b => F(b)),
    final: fin ? juego.fase : null
  });
  mod.reiniciar = () => reiniciarPelea();
  mod.walter = () => walter;
  mod.cuerpo = () => cuerpo;
  mod.eileen = () => eil.actual;
  mod.clavarTodas = () => {
    for (const l of lanzas) if (l.estado !== 5) {
      prender(1904);
      if (cuerpo.lanzas < 0) cuerpo.lanzas = 0;
      clavarEnCuerpo(l, true);
    }
  };
  mod.simular = seg => {
    for (let i = 0; i < Math.round(seg * 30); i++) {
      if (accion) henry.animador.actualizar(DT);
      tickLogico();
    }
    dibujar(1, 0);
    return mod.estado();
  };
  window.sh4final = mod;
  return mod;
}

export { LETRA_FINAL, ITEM as ITEM_FINAL, LANZAS };
