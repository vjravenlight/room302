// SH4 web — FeniXVOID · Project Ravenlight
import * as THREE from "three";

import { iniciarModoFoto } from "./modo_juego/modo_foto.js";

const ZONA_MUERTA = .18;

const muerta = v => Math.abs(v) < ZONA_MUERTA ? 0 : v;

export function prepararFotoCine(o) {
  const {renderer: renderer, escena: escena, salas: salas} = o;
  const camVista = new THREE.PerspectiveCamera(60, 1, .02, 600);
  camVista.name = "vista de la cinemática (modo foto)";
  const filtros = [], tareas = new Set;
  let congelado = null, seguia = false;
  function sincronizar() {
    const v = o.vista();
    if (v.cam) {
      v.cam.updateMatrixWorld(true);
      v.cam.matrixWorld.decompose(camVista.position, camVista.quaternion, camVista.scale);
      camVista.fov = v.cam.fov;
      camVista.near = v.cam.near;
      camVista.aspect = v.cam.aspect;
    } else {
      camVista.position.copy(v.pos);
      camVista.quaternion.copy(v.quat);
      camVista.fov = v.fov;
      camVista.near = v.near ?? .02;
      camVista.aspect = v.aspecto || innerWidth / innerHeight;
    }
    camVista.scale.set(1, 1, 1);
    camVista.updateProjectionMatrix();
    camVista.updateMatrixWorld(true);
  }
  const alTecla = e => {
    if (!foto?.activo) sincronizar();
    for (const f of filtros) if (f(e)) {
      e.preventDefault();
      e.stopImmediatePropagation();
      return;
    }
  };
  addEventListener("keydown", alTecla, true);
  addEventListener("keyup", alTecla, true);
  const M = {
    escena: escena,
    renderer: renderer,
    camara: camVista,
    capas: [],
    casco: null,
    manos: null,
    tactil: !!globalThis.matchMedia?.("(pointer: coarse)").matches,
    pantalla: {
      plano: null,
      fondo: null
    },
    jugador: o.camCine || new THREE.Group,
    enVR: () => renderer.xr.isPresenting,
    contextoAudio: () => o.audio(),
    control: {
      mirarLibre: false,
      soltar() {}
    },
    tareas: tareas,
    filtrarTeclas: f => filtros.push(f),
    congelar(paso, cam) {
      if (!congelado) {
        seguia = o.parar();
      }
      congelado = {
        paso: paso,
        cam: cam
      };
    },
    descongelar() {
      congelado = null;
      if (seguia) o.seguir();
      seguia = false;
      o.redibujar?.();
    }
  };
  const juego = {
    get enPartida() {
      return !!o.demo() && !renderer.xr.isPresenting;
    },
    video: false,
    fase: "cinemática",
    mundo: null,
    mejorado: null,
    lugar: "modo foto del reproductor de cinemáticas",
    get fuente() {
      return o.fuente();
    },
    get demoActual() {
      return o.demo();
    },
    get cuarto() {
      return {
        grupo: salas,
        sala: {
          nombre: o.sala()
        }
      };
    },
    get ambiente() {
      return {
        fx: o.efectos(),
        son: null,
        info: {
          sala: o.sala()
        }
      };
    }
  };
  const foto = iniciarModoFoto({
    M: M,
    juego: juego
  });
  const antes = new Map;
  function joystick() {
    const r = {
      ejes: {},
      acciones: []
    };
    for (const gp of navigator.getGamepads?.() || []) {
      if (!gp || gp.mapping !== "standard") continue;
      const a = gp.axes;
      r.ejes = {
        x: muerta(a[0] || 0),
        y: muerta(a[1] || 0),
        gx: muerta(a[2] || 0),
        gy: muerta(a[3] || 0)
      };
      for (const [i, nom] of [ [ 0, "aceptar" ], [ 2, "accion" ], [ 1, "cancelar" ], [ 9, "menu" ] ]) {
        const k = gp.index + ":" + i, v = !!gp.buttons[i]?.pressed;
        if (v && !antes.get(k)) r.acciones.push(nom);
        antes.set(k, v);
      }
    }
    return r;
  }
  function cuadro(dt) {
    const j = joystick();
    if (!congelado) {
      if (!renderer.xr.isPresenting) {
        sincronizar();
        for (const f of tareas) f(dt, j);
      }
      return false;
    }
    congelado.paso(dt, j);
    if (!congelado) return false;
    renderer.setRenderTarget(null);
    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, innerWidth, innerHeight);
    renderer.render(escena, congelado.cam || camVista);
    return true;
  }
  function entrar() {
    sincronizar();
    return foto.entrar();
  }
  return {
    foto: foto,
    cuadro: cuadro,
    entrar: entrar,
    camVista: camVista
  };
}
