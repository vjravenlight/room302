// SH4 web — FeniXVOID · Project Ravenlight
import { partesBin } from "../lib/sh4bin.js";

import { leerTexturas, aRGBA } from "../lib/texturas.js";

import { leerColision } from "../lib/colision.js";

import { alCambiarNiebla } from "../lib/sala.js";

import { crearRand, ponerNieblaEnMaterial } from "./comun.js";

import { crearGrietas } from "./grietas.js";

import { crearFiltros, FILTRO } from "./ruido.js";

import { crearNieblaSala, crearTexFog, texFogDeSala, coeficientesNiebla } from "./niebla.js";

import { crearMotor } from "./particulas.js";

import * as GH from "./p_gotas_humo.js";

import * as AC from "./p_agua_chispas.js";

import * as SA from "./p_sangre.js";

import * as FU from "./p_fuego.js";

import { crearCharco, crearAguaMz39 } from "./superficies.js";

export { FILTRO };

export function iniciarEfectos({THREE: THREE, renderer: renderer, escena: escena, camara: camara, sala: sala, info: info, escala: escala = .005}) {
  const lib = {
    partesBin: partesBin,
    leerTexturas: leerTexturas,
    aRGBA: aRGBA
  };
  const rand = crearRand(1234);
  const raiz = new THREE.Group;
  raiz.name = "efectos_originales";
  raiz.scale.set(-escala, -escala, escala);
  escena.add(raiz);
  const grietas = crearGrietas({
    THREE: THREE,
    lib: lib,
    raiz: raiz,
    rand: rand
  });
  const filtros = crearFiltros({
    THREE: THREE,
    lib: lib,
    camara: camara
  });
  const nieblaSala = crearNieblaSala({
    THREE: THREE,
    escala: escala
  });
  const texFog = crearTexFog({
    THREE: THREE,
    lib: lib,
    raiz: raiz,
    camara: camara,
    escala: escala,
    rand: rand
  });
  const motor = crearMotor({
    THREE: THREE,
    lib: lib,
    raiz: raiz,
    camara: camara,
    escala: escala,
    rand: rand
  });
  let charco = null, agua = null;
  const charcoDe = () => charco ||= crearCharco({
    THREE: THREE,
    lib: lib,
    raiz: raiz,
    camara: camara,
    escala: escala,
    rand: rand
  });
  const aguaDe = () => agua ||= crearAguaMz39({
    THREE: THREE,
    lib: lib,
    raiz: raiz,
    rand: rand
  });
  const fuegos = FU.crearFuegos({
    motor: motor,
    THREE: THREE,
    escala: escala
  });
  const lugaresVela = FU.crearLugaresVela({
    lib: lib,
    leerColision: leerColision
  });
  const listo = Promise.all([ grietas.cargar(), filtros.cargar(), texFog.cargar() ]).catch(e => console.warn("efectos:", e));
  const op = {
    niebla: true,
    ruido: true,
    intensidadRuido: 1,
    mitad: 1,
    colorSangre: 0,
    texFog: true,
    auto: true
  };
  let salaNombre = null, coNiebla = null, spray = null;
  alCambiarNiebla(() => {
    coNiebla = coeficientesNiebla(info?.niebla);
  });
  const v3 = new THREE.Vector3;
  const aJuego = o => o.pos || (o.posMundo ? [ -o.posMundo[0] / escala, -o.posMundo[1] / escala, o.posMundo[2] / escala ] : null);
  const camJuego = () => {
    camara.getWorldPosition(v3);
    raiz.updateWorldMatrix(true, false);
    raiz.worldToLocal(v3);
    return [ v3.x, v3.y, v3.z ];
  };
  const crear = e => Array.isArray(e) ? e.map(x => motor.crear(x)) : motor.crear(e);
  const ray = new THREE.Raycaster;
  function buscarPiso(o, f) {
    const a = new THREE.Vector3(-o[0] * escala, -o[1] * escala, o[2] * escala), b = new THREE.Vector3(-f[0] * escala, -f[1] * escala, f[2] * escala);
    const d = b.clone().sub(a);
    const L = d.length();
    if (!L) return null;
    ray.set(a, d.normalize());
    ray.far = L;
    for (const h of ray.intersectObject(sala, true)) {
      if (!h.face) continue;
      const n = h.face.normal.clone().transformDirection(h.object.matrixWorld);
      if (Math.abs(n.y) > .9) return [ -h.point.x / escala, -h.point.y / escala, h.point.z / escala ];
    }
    return null;
  }
  const NOMBRES = {
    sangre: o => {
      const p = aJuego(o), d = o.dir || [ 0, 0, 1 ];
      return [ crear(SA.salpicadura(p, d, o.velChara, o.tam ?? 400, op.colorSangre)), crear(SA.gotaAlPiso(p, d, o.velChara, (o.tam ?? 400) / 2, buscarPiso, rand, op.colorSangre)) ];
    },
    salpicadura: o => crear(SA.salpicadura(aJuego(o), o.dir || [ 0, 0, 1 ], o.velChara, o.tam ?? 400, op.colorSangre)),
    gota_sangre: o => crear(SA.gotaAlPiso(aJuego(o), o.dir || [ 0, 0, 1 ], o.velChara, o.tam ?? 200, buscarPiso, rand, op.colorSangre)),
    sangre_negra: o => crear(GH.sangreNegra(aJuego(o), o.vel, o.intervalo, o.piso ?? 0, o.unaVez)),
    chispas: o => crear(AC.chispasLinea(aJuego(o), o.rgba || [ 120 / 128, 60 / 128, 10 / 128, 150 / 128 ], o.vel || [ 0, -600, 0 ], o.abre ?? 1.2, o.vida ?? .5)),
    stungun: o => crear(AC.stungun(aJuego(o), o.fin, rand)),
    spray: o => {
      if (!spray) spray = crear(AC.spray());
      if (o.parar) {
        spray.o.espera = 31536e3;
        return spray;
      }
      const p = aJuego(o);
      if (p) {
        spray.o.pos = p;
      }
      if (o.vel) {
        const v = Math.hypot(...o.vel);
        spray.o.dir = o.vel;
        spray.o.max = v;
        spray.o.min = .8 * v;
        spray.cmn.largo = v / 30 * 1.7;
      }
      spray.o.espera = 0;
      return spray;
    },
    lluvia: o => crear(GH.lluvia(aJuego(o) || camJuego(), o.piso ?? -1)),
    goteo: o => crear(GH.goteoMz(aJuego(o) || [ 0, -700, 0 ], o.onditas ?? true, salaNombre)),
    gotas: o => crear(GH.gotasFacil({
      ...o,
      centro: aJuego(o)
    })),
    paso_agua: o => crear(AC.salpicaduraPaso(aJuego(o), o.velPaso ?? 300, o.angY ?? 0, o.pie ?? 55)),
    compuerta: o => crear(AC.compuerta(aJuego(o), o.vel, o.ancho ?? 120, o.alto ?? 24, o.piso ?? 60)),
    compuertas: o => crear(AC.compuertas4(o.demo)),
    canio: o => crear(AC.canio(aJuego(o), o.diametro ?? 60, o.piso ?? 0)),
    ondas_pileta: () => crear(AC.ondasPileta(rand)),
    olas_torre: () => crear(AC.olasTorre()),
    agua_mz39: () => aguaDe().iniciar(),
    charco: o => charcoDe().iniciar(aJuego(o) || [ 0, 0, 0 ]),
    humo_puerta: o => crear(GH.humoPuertaEspacio(aJuego(o), o.pos2 || [ aJuego(o)[0], aJuego(o)[1] - 200, aJuego(o)[2] ], o.techo ?? -480)),
    humo_fr23: () => crear(GH.humoCasaQuemada()),
    humo_richard: o => crear(GH.humoRichard(o.alfa)),
    silla: () => [ crear(AC.sillaChispas(rand)), crear(AC.sillaChispasHenry()), crear(GH.humoRichard()) ],
    chispa_humo: o => crear(AC.chispaHumo({
      ...o,
      centro: aJuego(o)
    })),
    fuego: o => fuegos.fuego(aJuego(o), o.alto ?? 200, o.ancho ?? 60, o.brillo ?? 1),
    vela: o => fuegos.vela(o.n ?? 0, aJuego(o), o.alto ?? 200, o.ancho ?? 40, !!o.demo),
    apagar_vela: o => fuegos.apagarVela(o.n ?? 0),
    vela_302: async o => {
      await lugaresVela.cargar();
      const p = lugaresVela.buscar(o.habitacion ?? 1, aJuego(o), o.frente);
      return p ? {
        pos: p,
        fuego: fuegos.vela(o.n ?? 0, p)
      } : null;
    },
    jasper: o => fuegos.jasper(o.huesos, o.modo ?? "cuerpo", o.piso ?? 0),
    grieta: o => grietas.crear(aJuego(o), o.normal || [ -1, 0, 0 ], o.radio ?? 140, o.nucleo ?? 20, o.tiempo ?? 10),
    grietas_haunting: o => grietas.iniciarHaunting(o.lugar ?? 1, o.potencia ?? 1e4),
    grietas_demo47: () => {
      grietas.iniciarDemo47();
      filtros.fijar(null);
      return true;
    },
    ruido: o => filtros.fijar(o.valores || null, o.segundos || 0),
    filtro: o => filtros.control(typeof o.tipo === "string" ? FILTRO[o.tipo] : o.tipo, o.valor ?? 64)
  };
  function alCargarSala(nombre = info?.sala) {
    salaNombre = nombre;
    motor.limpiar();
    grietas.limpiar();
    charco?.detener();
    agua?.detener();
    fuegos.limpiar();
    spray = null;
    coNiebla = coeficientesNiebla(info?.niebla);
    nieblaSala.poner(info?.niebla, op.niebla);
    sala?.traverse(m => {
      if (m.isMesh && m.userData.matOriginal) nieblaSala.parchar(m.userData.matOriginal);
    });
    filtros.alCargarSala(nombre);
    filtros.opciones({
      activo: op.ruido,
      mitad: op.mitad,
      intensidad: op.intensidadRuido
    });
    grietas.ponerLuces(info?.luces || []);
    texFog.poner(op.texFog ? texFogDeSala(nombre || "", op.mitad) : [], info?.niebla?.color);
    if (!op.auto || !nombre) return;
    if (nombre.startsWith("mz39")) aguaDe().iniciar();
    if (nombre.startsWith("mz33")) crear(AC.ondasPileta(rand));
    if (nombre.startsWith("mz31")) crear(AC.olasTorre());
    if (nombre.startsWith("fr23")) crear(GH.humoCasaQuemada());
  }
  let tNiebla = 0;
  function actualizar(dt) {
    const enVR = !!renderer?.xr?.isPresenting;
    const cj = camJuego();
    const h = grietas.instancias[0]?.c?.pos;
    grietas.actualizar(dt, h ? Math.hypot(cj[0] - h[0], cj[2] - h[2]) : 1e9);
    texFog.actualizar(dt);
    filtros.capaCercana(texFog.capaCercana());
    filtros.actualizar(dt, enVR);
    fuegos.actualizar(dt);
    motor.actualizar(dt);
    charco?.actualizar(dt);
    agua?.actualizar(dt);
    if ((tNiebla -= dt) <= 0) {
      tNiebla = .25;
      for (const m of [ ...grietas.materiales(), ...motor.materiales(), ...charco?.materiales() || [], ...agua?.materiales() || [] ]) ponerNieblaEnMaterial(m, coNiebla, escala, op.niebla);
    }
  }
  return {
    alCargarSala: alCargarSala,
    actualizar: actualizar,
    listo: listo,
    disparar(nombre, o = {}) {
      const f = NOMBRES[nombre];
      if (!f) throw new Error("efecto desconocido: " + nombre);
      return f(o);
    },
    nombres: Object.keys(NOMBRES),
    enemigos: (x, o) => filtros.enemigos(x, {
      escala: escala,
      ...o
    }),
    opciones(o = {}) {
      Object.assign(op, o);
      nieblaSala.activar(op.niebla && !!coNiebla);
      filtros.opciones({
        activo: op.ruido,
        mitad: op.mitad,
        intensidad: op.intensidadRuido
      });
      if ("fondoRuido" in o) filtros.opciones({
        fondo: o.fondoRuido
      });
      if ("medallon" in o) filtros.opciones({
        protegido: o.medallon
      });
      if ("texFog" in o || "mitad" in o) texFog.poner(op.texFog ? texFogDeSala(salaNombre || "", op.mitad) : [], info?.niebla?.color);
      return {
        ...op
      };
    },
    get estado() {
      return {
        sala: salaNombre,
        niebla: coNiebla,
        filtros: filtros.estado,
        grietas: grietas.instancias.length,
        particulas: motor.objetos.length,
        texFog: texFog.sistemas.length
      };
    },
    raiz: raiz,
    grietas: grietas,
    filtros: filtros,
    texFog: texFog,
    motor: motor,
    nieblaSala: nieblaSala,
    fuegos: fuegos,
    lugaresVela: lugaresVela,
    get charco() {
      return charco;
    },
    get agua() {
      return agua;
    },
    get nieblaActual() {
      return op.niebla ? coNiebla : null;
    }
  };
}
