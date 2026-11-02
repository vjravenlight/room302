// SH4 web — FeniXVOID · Project Ravenlight
import { partesBin } from "./lib/sh4bin.js";

import { leerModelo } from "./lib/modelo.js";

import { leerTexturas } from "./lib/texturas.js";

import { leerAnimacion, animacionesDeBin } from "./lib/animacion.js";

import { crearPersonaje } from "./lib/personaje.js";

import { cargarDatos, ESTADO, ITEM, MOV_302, AGARRE } from "./jugador/datos.js";

import { idiomaActual } from "./textos_sitio.js";

import { Animador } from "./jugador/mezcla.js";

import { crearControlador } from "./jugador/controlador.js";

import { crearArmas } from "./jugador/armas.js";

import { crearInventario } from "./jugador/inventario.js";

import { crearGameOver } from "./jugador/gameover.js";

import { iniciarBotonesHenry } from "./jugador/botones.js";

import { crearInventarioVR } from "./jugador/inventario_vr.js";

import { crearCascoCine } from "./jugador/casco_cine.js";

import { crearArmaVista } from "./jugador/arma_vista.js";

import { opciones, vibrarCelular, casco as cascoComun } from "./jugador/casco_comun.js";

import { crearCuerpoVR } from "./jugador/cuerpo_vr.js";

import { crearManosHenry } from "./jugador/manos_henry.js";

import { crearSeguidor } from "./camara/hombro.js";

export async function iniciarHenry({THREE: THREE, escena: escena, camara: camara, jugador: jugador, ojos: ojos, getColision: getColision, interfaz: interfaz = true, teclas: teclas = true, renderer: renderer = null, camaraExterna: camaraExterna = null, botones: botones = interfaz, teclasInventario: teclasInventario = undefined, controlarCamara: controlarCamara = true, pantallaGameOver: pantallaGameOver = interfaz, armaVista: armaVista = true, botonesAbajo: botonesAbajo = 186, alVista: alVista = null, botonesAlLado: botonesAlLado = 0}) {
  const [buf, datos] = await Promise.all([ fetch("/juego/data/henry01.bin").then(r => r.arrayBuffer()), cargarDatos({
    idioma: idiomaActual()
  }) ]);
  const partes = partesBin(buf);
  const pm = partes.find(p => p.tipo === "modelo"), pt = partes.find(p => p.tipo === "texturas");
  const modelo = leerModelo(buf, pm.ofs, pm.len);
  const pj = crearPersonaje(modelo, pt ? leerTexturas(buf, pt.ofs, pt.len) : []);
  const anims = animacionesDeBin(buf).map(p => leerAnimacion(buf, p.ofs, p.len));
  pj.grupo.name = "Henry";
  escena.add(pj.grupo);
  const animador = new Animador(pj, anims, {
    conservarGiro: [ 25 ]
  });
  const armas = crearArmas({
    THREE: THREE,
    henry: pj,
    datos: datos
  });
  const manosHenry = crearManosHenry({
    pj: pj,
    modelo: modelo,
    datos: datos
  });
  const cuerpoVR = crearCuerpoVR({
    THREE: THREE,
    pj: pj,
    animador: animador,
    armas: armas,
    getColision: getColision,
    manosHenry: manosHenry,
    datos: datos
  });
  globalThis.__sh4CuerpoVR = cuerpoVR;
  const ctl = crearControlador({
    THREE: THREE,
    datos: datos,
    animador: animador,
    armas: armas,
    jugador: jugador,
    ojos: ojos,
    getColision: getColision
  });
  ctl.ponerProceso(0, {
    mezcla: 0
  });
  ctl.ponerSonido(id => window.sh4?.sonido?.efecto?.(id, null));
  const inventario = interfaz ? crearInventario({
    datos: datos,
    controlador: ctl,
    armas: armas,
    teclasAbrir: teclasInventario,
    THREE: THREE
  }) : null;
  const R = renderer || window.sh4?.renderer || null;
  const inventarioVR = inventario && R?.xr ? crearInventarioVR({
    THREE: THREE,
    renderer: R,
    camara: camara,
    inventario: inventario,
    datos: datos,
    controlador: ctl
  }) : null;
  const casco = R?.xr && escena ? crearCascoCine({
    THREE: THREE,
    renderer: R,
    escena: escena,
    camara: camara,
    henry: {
      personaje: pj
    },
    getColision: getColision,
    ojos: ojos
  }) : null;
  const gameOver = interfaz && pantallaGameOver ? crearGameOver({
    alContinuar: () => ctl.revivir()
  }) : null;
  const vistaArma = armaVista ? crearArmaVista({
    THREE: THREE,
    camara: camara,
    renderer: renderer,
    armas: armas,
    ctl: ctl,
    animador: animador,
    enGrip: (k, lado, deMano) => cuerpoVR.armaEnGrip(k, lado, deMano)
  }) : null;
  ctl.on("gameOver", () => gameOver?.mostrar());
  ctl.on("danio", () => {
    if (!R?.xr?.isPresenting) vibrarCelular(90);
  });
  ctl.on("mensaje", t => {
    if (t !== "sin balas") inventario?.mensaje(t);
  });
  let modo = "1ra";
  const rayo = new THREE.Raycaster, pivote = new THREE.Vector3, atras = new THREE.Vector3, deseada = new THREE.Vector3;
  const ALTO_HOMBRO = -.15, LADO = .35;
  const seguidorHombro = crearSeguidor(THREE);
  function ponerModo(m) {
    modo = m;
    pj.grupo.visible = m === "3ra";
    if (m === "1ra" && controlarCamara) camara.position.set(0, 0, 0);
  }
  const _f = new THREE.Vector3, _c = new THREE.Vector3;
  function rumboVista() {
    camara.getWorldDirection(_f);
    return Math.atan2(-_f.x, _f.z);
  }
  const velocidad = corriendo => modo === "3ra" || ctl.s.agarre ? 0 : MOV_302.paso * 30 * .005 * (corriendo ? 1 + MOV_302.correr : 1);
  const sac = {
    z: 0,
    x: 0,
    y: 0,
    t: 0,
    vib: 0
  };
  function sacudirVista(dt, {primera: primera, enVR: enVR}) {
    const a = ctl.s.agarre;
    const activa = !!a && a.fase === 1 && primera;
    if (sac.z || sac.x || sac.y) {
      camara.rotation.z = 0;
      camara.position.x -= sac.x;
      camara.position.y -= sac.y;
      sac.z = sac.x = sac.y = 0;
    }
    if (!activa) {
      sac.t = 0;
      return;
    }
    sac.t += dt;
    if (enVR) {
      sac.vib -= dt;
      if (sac.vib <= 0) {
        sac.vib = .14;
        const f = Math.min(1, .45 + .4 * (1 - Math.max(0, a.tiempo) / 4));
        const manos = cascoComun.manos;
        try {
          manos?.vibrar?.("der", f, 90);
          manos?.vibrar?.("izq", f, 90);
        } catch {}
      }
      return;
    }
    const amp = .035;
    sac.z = Math.sin(sac.t * 23) * amp;
    sac.x = Math.sin(sac.t * 17) * .012;
    sac.y = Math.sin(sac.t * 31) * .015;
    camara.rotation.z = sac.z;
    camara.position.x += sac.x;
    camara.position.y += sac.y;
  }
  const en = {
    preparar: false,
    atacar: false,
    pasoAtras: false,
    pasoIzq: false,
    pasoDer: false,
    remate: false
  };
  const tec = {};
  if (teclas) {
    addEventListener("keydown", e => {
      tec[e.code] = true;
      if (e.code === "Space") e.preventDefault();
      if (e.code === "KeyX" && (tec.Mouse2 || tec.KeyK) || e.shiftKey && e.code === "KeyS") en.pasoAtras = true;
      if (e.shiftKey && e.code === "KeyA") en.pasoIzq = true;
      if (e.shiftKey && e.code === "KeyD") en.pasoDer = true;
    });
    addEventListener("keyup", e => {
      tec[e.code] = false;
    });
    addEventListener("mousedown", e => {
      if (e.button === 2) tec.Mouse2 = true;
      if (e.button === 0 && document.pointerLockElement) tec.Mouse0 = true;
    });
    addEventListener("mouseup", e => {
      if (e.button === 2) tec.Mouse2 = false;
      if (e.button === 0) tec.Mouse0 = false;
    });
    addEventListener("contextmenu", e => e.preventDefault());
  }
  const nuevosControles = {
    preparar: null,
    atacar: null
  };
  function entrada(o = {}) {
    for (const k of [ "preparar", "atacar" ]) if (k in o) nuevosControles[k] = o[k] == null ? null : !!o[k];
    for (const k of [ "pasoAtras", "pasoIzq", "pasoDer", "remate" ]) if (o[k]) en[k] = true;
  }
  const camaraAjena = () => !!(camaraExterna ? camaraExterna() : window.sh4?.camaraJuego?.activa);
  let modoAntesVR = null, modoAntesCine = null, cuerpoAgarre = null;
  const _dirCine = new THREE.Vector3;
  function actualizar(dt, {moviendo: moviendo, corriendo: corriendo, dir: dir, enVR: enVR, fuerza: fuerzaStick} = {}) {
    const cine = !!(enVR && casco?.activo);
    if (cine) {
      if (modo !== "3ra") {
        modoAntesCine = modo;
        ponerModo("3ra");
      }
    } else if (modoAntesCine) {
      ponerModo(modoAntesCine);
      modoAntesCine = null;
    }
    if (enVR && !cine && modo === "3ra") {
      modoAntesVR = "3ra";
      ponerModo("1ra");
    } else if (!enVR && modoAntesVR) {
      ponerModo(modoAntesVR);
      modoAntesVR = null;
    }
    controlesBotones?.actualizar(enVR);
    if (!enemigosApi && window.sh4?.enemigos) conectarAgarres(window.sh4.enemigos);
    inventarioVR?.actualizar(dt, !!enVR);
    if (cine && dir) dir = casco.convertir(dir, _dirCine);
    const volando = !!window.sh4?.volando;
    const pausa = inventario?.abierto;
    const primera = modo === "1ra" || enVR && !cine;
    const conCuerpo = !!enVR && !cine && primera && opciones().cuerpoVR !== false;
    const pruebaCuerpo = !enVR && primera && !!window.sh4?.cuerpoVRPrueba;
    if (!pausa && !volando) {
      en.preparar = nuevosControles.preparar ?? !!(tec.Mouse2 || tec.KeyK);
      en.atacar = nuevosControles.atacar ?? !!(tec.Mouse0 || tec.Space || tec.KeyJ);
      const fuerza = moviendo && dir ? Math.min(1, fuerzaStick ?? Math.hypot(dir.x, dir.z)) || 1 : 0;
      const rv = primera ? rumboVista() : null;
      if (primera) ctl.m.rumbo = ctl.m.cuerpo = ctl.m.deseado = rv;
      const piernas = conCuerpo || pruebaCuerpo;
      const stick = moviendo && dir ? {
        x: dir.x * fuerza,
        y: dir.z * fuerza
      } : {
        x: 0,
        y: 0
      };
      if (primera && ctl.s.agarre) ctl.m.rumbo = ctl.m.cuerpo = ctl.m.deseado = cuerpoAgarre ?? ctl.m.cuerpo;
      ctl.actualizar(dt, {
        fuerza: primera && !piernas ? 0 : fuerza,
        rumboDeseado: primera ? rv : dir ? Math.atan2(-dir.x, dir.z) : ctl.m.rumbo,
        correr: !!corriendo,
        sinMover: primera,
        stick: stick,
        ...en
      });
      if (primera && ctl.s.agarre) cuerpoAgarre = ctl.m.cuerpo; else {
        cuerpoAgarre = null;
        if (primera) ctl.m.rumbo = ctl.m.cuerpo = rv;
      }
      en.pasoAtras = en.pasoIzq = en.pasoDer = en.remate = false;
    }
    sacudirVista(dt, {
      primera: primera,
      enVR: !!enVR && !cine
    });
    if (conCuerpo || pruebaCuerpo) {
      camara.getWorldPosition(_c);
      camara.getWorldDirection(_f);
      cuerpoVR.ubicar(_c, jugador.position.y - ojos, _f, dt, moviendo && dir ? dir : null);
    } else {
      cuerpoVR.reiniciar();
      if (enVR && !cine) {
        camara.getWorldPosition(_c);
        pj.grupo.position.set(_c.x, jugador.position.y - ojos, _c.z);
      } else pj.grupo.position.set(jugador.position.x, jugador.position.y - ojos, jugador.position.z);
      pj.grupo.rotation.y = -ctl.m.cuerpo;
    }
    cuerpoVR.empujar({
      activo: !!enVR && !cine || pruebaCuerpo,
      manos: cascoComun.manos,
      camara: camara
    });
    vistaArma?.actualizar(dt, {
      modo: modo,
      enVR: !!enVR && !cine
    });
    if (!pausa) animador.actualizar(dt);
    const antes = cuerpoVR.activo;
    manosHenry.juego(ctl.s.arma, ctl.s.estado);
    globalThis.__sh4ManosHenry = cuerpoVR.actualizar({
      activo: conCuerpo,
      manos: cascoComun.manos,
      arma: ctl.s.arma,
      armaVista: vistaArma
    }) && (conCuerpo || !!window.sh4?.cuerpoVRPrueba);
    if (antes && !cuerpoVR.activo) pj.grupo.visible = modo === "3ra";
    casco?.actualizar(dt, !!enVR);
    if (modo !== "3ra" || volando || camaraAjena() || !controlarCamara || enVR) return;
    pivote.set(0, ALTO_HOMBRO, 0);
    camara.getWorldDirection(atras).multiplyScalar(-1);
    const derecha = (new THREE.Vector3).crossVectors(new THREE.Vector3(0, 1, 0), atras).normalize().multiplyScalar(-LADO);
    const largoHombro = 1 + (+(opciones().camDistancia ?? 5) || 5) * .3;
    deseada.copy(atras).multiplyScalar(largoHombro).add(derecha);
    const largo = deseada.length();
    deseada.divideScalar(largo);
    const dist = seguidorHombro.distancia(getColision(), jugador.position.clone().add(pivote), deseada, largo, dt);
    camara.position.copy(deseada.multiplyScalar(dist).add(pivote));
  }
  function siguienteArma() {
    const lista = [ 0, ...(inventario?.lugares || []).map(l => l.k).filter(k => datos.esArma(k)) ];
    const i = lista.indexOf(ctl.s.arma);
    const k = lista[(i + 1) % lista.length] || 0;
    if (ctl.s.estado !== ESTADO.NORMAL) return ctl.s.arma;
    if (inventario) inventario.equipar(k); else armas.equipar(k).then(() => {
      ctl.s.arma = k;
    });
    inventario?.mensaje(k ? datos.nombreItem(k) : "Sin arma");
    return k;
  }
  function curarRapido() {
    if (!inventario || ctl.s.muerto) return null;
    for (const k of [ ITEM.BEBIDA, ITEM.AMPOLLA, ITEM.BOTIQUIN ]) if (inventario.cuantos(k)) {
      inventario.usar(k);
      inventario.mensaje(datos.nombreItem(k));
      return k;
    }
    inventario.mensaje("No tengo nada para curarme.");
    return null;
  }
  const controlesBotones = botones ? iniciarBotonesHenry({
    henry: null,
    renderer: renderer,
    abajo: botonesAbajo,
    alVista: alVista,
    alLado: botonesAlLado
  }) : null;
  function conectarEnemigos(api) {
    const ESC = .005, adaptados = new WeakMap;
    const ALTO = {
      HYENA: .8,
      MULTI: 1.7
    };
    const muerto = e => e.cond === 11 || e.cond === 10 || e.hp <= 0;
    const adaptar = e => {
      let a = adaptados.get(e);
      if (!a) {
        a = {
          e: e,
          posicion: new THREE.Vector3,
          radio: .45,
          alto: ALTO[e.tipo] ?? 1.2,
          caido: false,
          muerto: false
        };
        adaptados.set(e, a);
      }
      a.posicion.set(-e.pos[0] * ESC, -e.pos[1] * ESC, e.pos[2] * ESC);
      a.radio = Math.max(.25, (e.radio || 60) * ESC);
      a.muerto = muerto(e);
      return a;
    };
    ctl.ponerEnemigos(() => api.enemigos.map(adaptar));
    ctl.ponerRecibirGolpe((a, danio, tipo, info) => api.recibirGolpe(a.e, danio, info.golpe, {
      shock: info.shock
    }));
    api.alGolpearHenry = (danio, tipo, info = {}) => {
      const desde = info.enemigo ? api.posicion(info.enemigo) : null;
      if (info.agarre) {
        const tipoIA = info.enemigo?.tipo || "";
        const ok = ctl.agarrar({
          parte: typeof info.pierna === "number" && info.pierna >= 1 && info.pierna <= 5 ? info.pierna : 1,
          tiempo: AGARRE.tiempo[tipoIA] ?? 4,
          danio: danio ?? danioDe(tipo),
          desde: desde,
          rotEnemigo: info.enemigo?.rot ?? null,
          enemigo: info.enemigo || null
        });
        if (!ok) api.agarradoPor = null;
        return;
      }
      ctl.recibirDanio(danio ?? danioDe(tipo), typeof info.reaccion === "number" ? info.reaccion : tipoDanio(tipo), desde);
    };
    api.henrySigueAgarrado = e => ctl.estadoAgarre() === 1 && (!ctl.s.agarre?.enemigo || ctl.s.agarre.enemigo === e);
    api.alSoltarHenry = e => {
      ctl.soltarAgarre();
    };
    api.estadoHenry = () => {
      const s = ctl.s;
      const estado = s.muerto ? "DEAD" : s.danio || s.agarre ? "DAMAGE" : s.estado === ESTADO.GOLPE || s.estado === ESTADO.GOLPE_FUERTE ? "ATTACK" : s.estado === ESTADO.PREPARAR || s.estado === ESTADO.GUARDIA ? s.objetivo ? "LOCK" : "READY" : "MOVE";
      return {
        vida: s.vida / s.vidaMax,
        estado: estado,
        corriendo: ctl.m.run > .5 && ctl.m.move > .4,
        existe: !s.gameOver
      };
    };
    return api;
  }
  let enemigosApi = null;
  function conectarAgarres(api) {
    if (!api || enemigosApi === api) return api;
    enemigosApi = api;
    api.henrySigueAgarrado = e => ctl.estadoAgarre() === 1 && (!ctl.s.agarre?.enemigo || ctl.s.agarre.enemigo === e);
    api.alSoltarHenry = () => {
      ctl.soltarAgarre();
    };
    if (!api.estadoHenry) {
      api.estadoHenry = () => {
        const s = ctl.s;
        const estado = s.muerto ? "DEAD" : s.danio || s.agarre ? "DAMAGE" : s.estado === ESTADO.GOLPE || s.estado === ESTADO.GOLPE_FUERTE ? "ATTACK" : s.estado === ESTADO.PREPARAR || s.estado === ESTADO.GUARDIA ? s.objetivo ? "LOCK" : "READY" : "MOVE";
        return {
          vida: s.vida / s.vidaMax,
          estado: estado,
          corriendo: ctl.m.run > .5 && ctl.m.move > .4,
          existe: !s.gameOver
        };
      };
    }
    return api;
  }
  function recibirDanioExterno(danio, tipo, desde) {
    const api = enemigosApi || window.sh4?.enemigos || null;
    if (api && !enemigosApi) conectarAgarres(api);
    const e = api?.agarradoPor;
    if (e && tipo === 7) {
      const parte = e.tipo === "HYENA" ? e.w?.targetBodypart === 3 ? 3 : 2 : 1;
      const ok = ctl.agarrar({
        parte: parte,
        tiempo: AGARRE.tiempo[e.tipo] ?? 4,
        danio: danio ?? danioDe(tipo),
        desde: desde,
        rotEnemigo: e.rot ?? null,
        enemigo: e
      });
      if (!ok) api.agarradoPor = null;
      return ok ? 1 : 4;
    }
    return ctl.recibirDanio(danio ?? danioDe(tipo), tipoDanio(tipo), desde);
  }
  if (inventario && typeof location !== "undefined" && new URLSearchParams(location.search).has("armas")) {
    for (const [k, n] of [ [ ITEM.TUBERIA, 1 ], [ ITEM.PISTOLA, 1 ], [ ITEM.BALAS_PISTOLA, 15 ], [ ITEM.BEBIDA, 2 ], [ ITEM.AMPOLLA, 1 ], [ ITEM.BOTIQUIN, 1 ], [ 21, 1 ], [ ITEM.PICO, 1 ], [ ITEM.BOTELLA, 1 ] ]) inventario.agregar(k, n);
    inventario.equipar(ITEM.TUBERIA);
  }
  ponerModo("1ra");
  const api = {
    actualizar: actualizar,
    velocidad: velocidad,
    get modo() {
      return modo;
    },
    ponerModo: ponerModo,
    alternar() {
      ponerModo(modo === "1ra" ? "3ra" : "1ra");
      return modo;
    },
    vistaPorDefecto(sala = "") {
      return /^rl/.test(sala) ? "1ra" : opciones().vista === "1ra" ? "1ra" : "3ra";
    },
    ubicarRumbo(r) {
      ctl.m.rumbo = ctl.m.cuerpo = ctl.m.deseado = -r;
    },
    personaje: pj,
    datos: datos,
    controlador: ctl,
    animador: animador,
    armas: armas,
    inventario: inventario,
    gameOver: gameOver,
    anims: anims,
    get vida() {
      return ctl.s.vida;
    },
    get estado() {
      return ctl.s.estado;
    },
    ponerEnemigos: f => ctl.ponerEnemigos(f),
    alGolpear: f => ctl.on("golpear", f),
    ponerRecibirGolpe: f => ctl.ponerRecibirGolpe(f),
    "recibirDaño": recibirDanioExterno,
    recibirDanio: recibirDanioExterno,
    conectarAgarres: conectarAgarres,
    "alRecibirDaño": f => ctl.on("danio", f),
    alMorir: f => ctl.on("muerte", f),
    alAgarre: f => ctl.on("agarre", f),
    alSoltarse: f => ctl.on("soltarse", f),
    get agarre() {
      return ctl.s.agarre;
    },
    equipar: k => inventario ? inventario.equipar(k) : armas.equipar(k).then(() => {
      ctl.s.arma = k;
    }),
    agregarItem: (k, n) => inventario?.agregar(k, n),
    curar: k => ctl.usarCuracion(k),
    entrada: entrada,
    entradas: nuevosControles,
    ITEM: ITEM,
    ESTADO: ESTADO,
    siguienteArma: siguienteArma,
    curarRapido: curarRapido,
    conectarEnemigos: conectarEnemigos,
    manos: manosHenry,
    botones: controlesBotones,
    armaVista: vistaArma,
    rumboVista: rumboVista,
    inventarioVR: inventarioVR,
    casco: casco,
    alCargarSala() {
      ctl.s.objetivo = null;
      if (ctl.s.agarre) {
        ctl.s.agarre = null;
        ctl.s.sinGolpe = 0;
        if (!ctl.s.muerto) ctl.ponerProceso(0, {
          forzar: true,
          mezcla: 0
        });
      }
    }
  };
  controlesBotones?.ponerHenry(api);
  return api;
  function danioDe(tipo) {
    const g = typeof tipo === "string" ? datos.golpe(tipo) : typeof tipo === "number" && tipo >= 73 ? datos.juego.golpes[tipo] : null;
    return g?.danio ?? 10;
  }
  function tipoDanio(tipo) {
    if (typeof tipo === "string") {
      const g = datos.golpe(tipo);
      return g ? datos.henry.danio_recibido.por_golpe[g.indice] : 1;
    }
    if (typeof tipo === "number" && tipo >= 73) return datos.henry.danio_recibido.por_golpe[tipo] ?? 1;
    return tipo ?? 1;
  }
}
