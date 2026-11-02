// SH4 web — FeniXVOID · Project Ravenlight
import { q } from "./motor.js";

import { PRISION } from "./prision.js";

import { conSegundaMitad, utilidades, engancharUsarItem } from "./mitad2_comun.js";

import { eileenDePrueba } from "./mitad2a_comun.js";

const ITEM = {
  LLAVE_GENERADOR: 100,
  CAMISA: 101,
  ESPADA: 5,
  CACHIPORRA: 130
};

export const PRISION_2 = conSegundaMitad(PRISION, (api, base) => crearPrision2(api, base), {
  banderasAtajo: [ 701, 534, 719 ]
});

function crearPrision2(api, base) {
  const {THREE: THREE, M: M, juego: juego, henry: henry, F: F, prender: prender} = api;
  const U = utilidades(api, {
    etapa: "mz",
    num: 4,
    datosJson: "./prision_datos.json"
  });
  let escena = 0, activo = false, soltarAntes = null, enganchado = false, pendiente2304 = false;
  const ESPADA = {
    MODELO: 76,
    TEX: 110,
    HUESO: 25,
    PROC: [ 38, 117, 118, 119 ],
    CLAVA: .9,
    ATRAS: .1,
    ATRAS_VEL: 700,
    BAJA: 5,
    GIRO: 8
  };
  const ESTADO_ESPADA = 117;
  let accion = null, espadaPj = null;
  const ctl = henry.controlador;
  const envolver = a => Math.atan2(Math.sin(a), Math.cos(a));
  async function modeloEspada() {
    if (espadaPj) return espadaPj;
    espadaPj = await U.modelo("wp_model.bin", ESPADA.MODELO, ESPADA.TEX);
    espadaPj.grupo.name = "Espada de Obediencia";
    return espadaPj;
  }
  function espadaEnMano(pj) {
    const c = pj.contenedor, h = henry.personaje.huesos[ESPADA.HUESO];
    if (!h) return;
    c.rotation.set(0, 0, 0);
    c.scale.setScalar(1);
    c.position.set(0, 0, 0);
    h.add(c);
    c.visible = true;
  }
  function terminarAccion() {
    const a = accion;
    if (a && a.fase < 3) a.pj.contenedor.removeFromParent();
    accion = null;
    if (ctl.s.estado === ESTADO_ESPADA) {
      ctl.s.estado = henry.ESTADO.NORMAL;
      ctl.ponerProceso(0, {
        forzar: true,
        mezcla: .3
      });
    }
    if (henry.armas?.actual) henry.armas.actual.grupo.visible = true;
  }
  function clavarEnElMundo(a) {
    const c = a.pj.contenedor;
    api.cont.updateMatrixWorld(true);
    api.cont.attach(c);
    c.position.y -= ESPADA.BAJA * .005;
    c.name = "Espada de Obediencia (clavada)";
    henry.inventario?.quitar(ITEM.ESPADA);
    if (a.e) {
      a.e.cambiar?.(19);
      a.e.clavado = true;
    }
    espadaPj = null;
  }
  function tickAccion(dt) {
    const a = accion;
    if (!a) return;
    if (ctl.s.danio || ctl.s.muerto) {
      if (a.fase < 4) a.pj.contenedor.removeFromParent();
      terminarAccion();
      return;
    }
    const an = henry.animador;
    a.t += dt;
    const proc = k => {
      if (a.puesto !== k) {
        ctl.ponerProceso(ESPADA.PROC[k], {
          forzar: true
        });
        a.puesto = k;
        a.t = 0;
      }
    };
    switch (a.fase) {
     case 0:
      proc(0);
      if (a.t > .1 && an.terminada) {
        a.fase = 1;
        a.rumbo = a.e ? Math.atan2(a.e.pos[0] - U.posHenry()[0], a.e.pos[2] - U.posHenry()[2]) : ctl.m.cuerpo;
      }
      break;

     case 1:
     case 2:
      {
        proc(a.fase);
        const dc = envolver(a.rumbo - ctl.m.cuerpo), pc = ESPADA.GIRO * dt;
        ctl.m.rumbo = a.rumbo;
        ctl.m.cuerpo = Math.abs(dc) < pc ? a.rumbo : envolver(ctl.m.cuerpo + Math.sign(dc) * pc);
        if (a.fase === 1 && a.t > .1 && an.terminada) a.fase = 2; else if (a.fase === 2 && a.t > .1 && an.proporcion >= ESPADA.CLAVA) {
          clavarEnElMundo(a);
          a.fase = 3;
        }
        break;
      }

     case 3:
      {
        proc(3);
        if (an.proporcion < ESPADA.ATRAS) {
          const r = ctl.m.cuerpo + Math.PI;
          api.empujar(new THREE.Vector3(-Math.sin(r), 0, Math.cos(r)), ESPADA.ATRAS_VEL * dt * .005);
        }
        if (a.t > .1 && an.terminada) {
          terminarAccion();
          if (a.e?.tipo === "FAT" && !F(732)) pendiente2304 = true;
          zonaLlave();
        }
        break;
      }

     default:
      terminarAccion();
    }
  }
  function fatCaido() {
    return (api.enemigos?.enemigos || []).find(e => e.tipo === "FAT" && e.caido?.() && !e.intocable?.()) || null;
  }
  const LLAVE_EV = {
    i: 3001,
    pos: [ 0, 0, 0 ],
    zona: {
      dmy1: 1,
      radio: 220,
      dmy6: 5,
      dmy13: ITEM.ESPADA
    },
    ev: {
      evnum: 0,
      cond: "siempre",
      llaveAndrew: true
    }
  };
  function zonaLlave() {
    const e = U.cuantos(ITEM.ESPADA) && !accion ? fatCaido() : null;
    const i = api.eventos.indexOf(LLAVE_EV);
    if (e) {
      LLAVE_EV.pos = [ ...e.pos ];
      if (i < 0) api.eventos.push(LLAVE_EV);
    } else if (i >= 0) api.eventos.splice(i, 1);
  }
  async function clavarEspada() {
    const e = fatCaido();
    if (accion || !e || !U.cuantos(ITEM.ESPADA)) return false;
    let pj = null;
    try {
      pj = await modeloEspada();
    } catch (err) {
      console.warn("Espada de Obediencia", err.message);
    }
    if (!pj) {
      henry.inventario?.quitar(ITEM.ESPADA);
      e.cambiar?.(19);
      e.clavado = true;
      if (!F(732)) pendiente2304 = true;
      await eventoLlave();
      zonaLlave();
      return true;
    }
    espadaEnMano(pj);
    accion = {
      e: e,
      pj: pj,
      fase: 0,
      t: 0,
      puesto: -1,
      rumbo: ctl.m.cuerpo
    };
    ctl.s.estado = ESTADO_ESPADA;
    ctl.s.objetivo = null;
    if (henry.armas?.actual) henry.armas.actual.grupo.visible = false;
    zonaLlave();
    return true;
  }
  async function eventoLlave() {
    if (!pendiente2304 || F(732) || juego.hablando || juego.demoActual) return;
    pendiente2304 = false;
    await api.decir([ juego.textoItem?.(392) || api.texto(1, 392) || "Tienes la Llave sala generador prisión acuática." ]);
    henry.agregarItem(ITEM.LLAVE_GENERADOR, 1);
    U.sonar(40006);
    prender(732);
  }
  const llaveDeAndrew = clavarEspada;
  return {
    ...base,
    inicio: () => base.inicio?.(),
    async alCargarEscena(n, llegada) {
      await (base.alCargarEscena?.(n, llegada));
      await U.datos();
      escena = n;
      activo = true;
      if (accion) terminarAccion();
      if (api.enemigos && !soltarAntes) {
        soltarAntes = api.enemigos.soltarItem || null;
        api.enemigos.soltarItem = (e, item, pos) => U.soltarItem(item, pos, escena);
      }
      if (!enganchado) {
        enganchado = true;
        engancharUsarItem(api, {
          items: [ ITEM.ESPADA ],
          zonas: () => api.eventos.includes(LLAVE_EV) ? [ LLAVE_EV ] : [],
          usar: () => clavarEspada(),
          activo: () => activo && api.mitad === 2
        });
      }
      await eileenDePrueba(api, U);
    },
    cuadro(dt) {
      const r = base.cuadro?.(dt);
      tickAccion(dt);
      U.revisarSoltados(escena);
      zonaLlave();
      if (pendiente2304 && !accion) eventoLlave();
      return r || !!accion;
    },
    forzar: () => accion ? {
      dir: new THREE.Vector3,
      fuerza: 0
    } : base.forzar?.() ?? null,
    maneja(ev) {
      return base.maneja?.(ev) || ev?.evnum === 186 || ev?.evnum === 2706 || !!ev?.llaveAndrew;
    },
    async ejecutar(o) {
      if (o.mitad2) return undefined;
      const ev = o.ev || {};
      if (ev.llaveAndrew) {
        await clavarEspada();
        return null;
      }
      if (ev.evnum === 186) {
        await U.demo(88);
        U.terminar(186);
        await U.eileenConHenry();
        M.fundir(0, .5);
        return null;
      }
      if (ev.evnum === 2706) {
        if (!F(1637)) return null;
        if (!q.has("sinvideos")) {
          await M.fundir(1, .4);
          await (juego.reproducirVideo?.(10, {}));
          M.pantalla.ocultar();
          await M.fundir(0, .4);
        }
        U.terminar(2706);
        return null;
      }
      return base.ejecutar ? base.ejecutar(o) : undefined;
    },
    llaveDeAndrew: llaveDeAndrew,
    alSalir() {
      if (accion) terminarAccion();
      activo = false;
      if (api.enemigos && soltarAntes !== null) {
        api.enemigos.soltarItem = soltarAntes;
      }
      soltarAntes = null;
      base.alSalir?.();
    },
    estado() {
      const b = [ 534, 701, 711, 719, 723, 727, 730, 731, 732, 737, 738, 739, 740, 1637, 2128 ].filter(n => F(n));
      const ei = api.eileen?.actual;
      return {
        ...base.estado?.() || {},
        mitad: 2,
        banderas2: b,
        llaveGenerador: U.cuantos(ITEM.LLAVE_GENERADOR),
        camisa: U.cuantos(ITEM.CAMISA),
        fat: (api.enemigos?.enemigos || []).filter(e => e.tipo === "FAT").length,
        eileen: ei ? {
          conHenry: U.eileenCerca(),
          pos: ei.pos.map(Math.round)
        } : null,
        espada: accion ? {
          fase: accion.fase,
          proceso: ESPADA.PROC[accion.puesto] ?? null
        } : null
      };
    },
    get activo() {
      return activo;
    }
  };
}
