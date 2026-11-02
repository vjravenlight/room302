// SH4 web — FeniXVOID · Project Ravenlight
import { CamaraOtroMundo, areasDeEscena, NOMBRES_MODO, decodificarArg } from "./camara/modos.js";

import { wrap } from "./camara/motor.js";

import { armarParedes } from "./camara/paredes.js";

import { crearSeguidor } from "./camara/hombro.js";

import { leerOpciones } from "./opciones_sitio.js";

const DT_JUEGO = 1 / 30;

const FOV_302 = .96;

const OJO_302 = 300;

const PITCH_MAX = .4363323, PITCH_MIN = -.8726646;

const AF_DIST = 450;

const AF_TIPOS = new Set([ 4, 5, 7, 8, 9 ]);

export const fovVertical = a => 2 * Math.atan(Math.tan(a / 2) * .75) * 180 / Math.PI;

export const TIPOS_CAMARA = [ "juego", "hombro", "libre" ];

export const CAMARA_DEFECTO = {
  camTipo: "juego",
  camSuavizado: 3,
  camGiro: 5,
  camDistancia: 5
};

const num = (v, d, a = 0, b = 10) => typeof v === "number" && isFinite(v) ? Math.max(a, Math.min(b, v)) : d;

export function opcionesCamara(o = {}) {
  const q = typeof location !== "undefined" ? new URLSearchParams(location.search).get("camtipo") : null;
  return {
    tipo: TIPOS_CAMARA.includes(q) ? q : TIPOS_CAMARA.includes(o.camTipo) ? o.camTipo : "juego",
    suavizado: num(o.camSuavizado, CAMARA_DEFECTO.camSuavizado),
    giro: num(o.camGiro, CAMARA_DEFECTO.camGiro),
    distancia: num(o.camDistancia, CAMARA_DEFECTO.camDistancia, 1, 10)
  };
}

const tauSuavizado = s => s / 10 * (s / 10) * .5;

export const metrosDistancia = n => 1 + n * .3;

export function iniciarCamaraJuego({THREE: THREE, camara: camara, jugador: jugador, henry: henry = null, getColision: getColision = () => null, escala: escala = .005, ojos: ojos = 1.6, renderer: renderer = null, tipoFijo: tipoFijo = null}) {
  if (!tipoFijo && renderer && renderer.xr && !renderer.domElement) tipoFijo = "juego";
  const aJuego = v => [ -v.x / escala, -v.y / escala, v.z / escala ];
  const aVisor = (p, out = new THREE.Vector3) => out.set(-p[0] * escala, -p[1] * escala, p[2] * escala);
  const otro = new CamaraOtroMundo;
  let activa = false, datos = null, areasRef = {}, dflt = null, sala = null, etapa = null, escena = null;
  let fovOriginal = camara.fov, prevPies = null, acum = 0, boton9 = false, boton9Apretado = false;
  const estado = {
    modo: "-",
    area: "-",
    corte: false,
    angulo: 0
  };
  const p302 = {
    fase: 0,
    balanceo: 1,
    objetos: [],
    foco: null,
    quietoT: 0,
    enfocando: false
  };
  const ctl = {
    timer: 0,
    adelante: new THREE.Vector3(0, 0, -1)
  };
  const conFijo = o => TIPOS_CAMARA.includes(tipoFijo) ? {
    ...o,
    tipo: tipoFijo
  } : o;
  let opc = conFijo(opcionesCamara(leerOpciones()));
  let poseA = null, poseB = null;
  const filtro = {
    pos: new THREE.Vector3,
    dir: new THREE.Vector3,
    fov: 60,
    listo: false
  };
  const rayo = new THREE.Raycaster;
  const tmpA = new THREE.Vector3, tmpB = new THREE.Vector3, tmpM = new THREE.Matrix4, tmpQ = new THREE.Quaternion, tmpQ2 = new THREE.Quaternion;
  function rayoJuego(desde, dir, dist, unaCara = false) {
    const col = getColision();
    if (!col) return null;
    aVisor(desde, tmpA);
    tmpB.set(-dir[0], -dir[1], dir[2]).normalize();
    rayo.set(tmpA, tmpB);
    rayo.near = 0;
    rayo.far = dist * escala;
    const hs = rayo.intersectObject(col, false);
    const h = unaCara ? hs.find(x => !x.face || x.face.normal.clone().transformDirection(col.matrixWorld).dot(tmpB) < 0) : hs[0];
    return h ? h.distance / escala : null;
  }
  let paredesDe = null;
  function paredes(p, r) {
    const col = getColision();
    if (!col?.geometry?.attributes?.position) return [];
    col.updateMatrixWorld(true);
    const clave = col.matrixWorld.elements.join(",");
    if (!paredesDe || paredesDe.col !== col || paredesDe.clave !== clave) {
      const ident = col.matrixWorld.equals(new THREE.Matrix4);
      paredesDe = {
        col: col,
        clave: clave,
        p: armarParedes(col.geometry.attributes.position.array, escala, ident ? null : col.matrixWorld.elements)
      };
    }
    return paredesDe.p.buscar(p, r);
  }
  async function cargarDatos() {
    if (datos) return;
    const [e, r] = await Promise.all([ fetch("/datos/escenas.json").then(x => x.json()), fetch(new URL("./camara/areas_ref.json", import.meta.url)).then(x => x.json()).catch(() => ({
      areas: {}
    })) ]);
    datos = e.etapas;
    areasRef = r.areas || {};
    dflt = areasRef.DfltOutDoor || null;
  }
  async function alCargarSala(nombreSala) {
    await cargarDatos();
    sala = nombreSala;
    etapa = nombreSala.slice(0, 2);
    const base = nombreSala.slice(0, 4), E = datos?.[etapa];
    escena = E ? Object.entries(E.salas || {}).find(([, s]) => s === base)?.[0] || null : null;
    const cam = escena ? E.camaras?.[escena] : null;
    otro.iniciarEscena(areasDeEscena(cam, areasRef), dflt);
    prevPies = null;
    acum = 0;
    ctl.timer = 0;
    poseA = poseB = null;
    filtro.listo = false;
    estado.pos = null;
    paredesDe = null;
    seg.listo = false;
    seguidor.reiniciar();
    p302.objetos = [];
    if (etapa === "rl" && E && escena) for (const o of E.objetos?.[escena] || []) if (AF_TIPOS.has(o.tipo) && o.pos && (o.pos[0] || o.pos[1] || o.pos[2])) p302.objetos.push(o.pos);
    p302.foco = null;
    p302.enfocando = false;
    estado.modo = "-";
    estado.area = "-";
    return {
      escena: escena,
      areas: otro.areas?.length || 0
    };
  }
  let P = null;
  function datosHenry(dt) {
    const g = henry?.personaje?.grupo;
    const pies = g ? g.position.clone() : jugador.position.clone().sub(new THREE.Vector3(0, ojos, 0));
    const pos = aJuego(pies);
    const ang = g ? -g.rotation.y : 0;
    let vel = [ 0, 0, 0 ];
    if (prevPies && dt > 0) vel = [ (pos[0] - prevPies[0]) / dt, (pos[1] - prevPies[1]) / dt, (pos[2] - prevPies[2]) / dt ];
    if (Math.hypot(vel[0], vel[2]) * dt > 400) vel = [ 0, 0, 0 ];
    if (Math.hypot(vel[0], vel[2]) < 5) {
      vel[0] = 0;
      vel[2] = 0;
    }
    prevPies = pos;
    return {
      pos: pos,
      ang: ang,
      vel: vel,
      rapidez: Math.hypot(vel[0], vel[2]),
      peleando: false
    };
  }
  function ubicar(posV, mirarV, fovGrados) {
    jugador.updateMatrixWorld(true);
    camara.position.copy(jugador.worldToLocal(posV.clone()));
    tmpM.lookAt(posV, mirarV, camara.up);
    tmpQ.setFromRotationMatrix(tmpM);
    jugador.getWorldQuaternion(tmpQ2).invert();
    camara.quaternion.copy(tmpQ2.multiply(tmpQ));
    if (Math.abs(camara.fov - fovGrados) > .001) {
      camara.fov = fovGrados;
      camara.updateProjectionMatrix();
    }
  }
  const _pf = new THREE.Vector3, _mf = new THREE.Vector3;
  function ubicarSuave(posV, dirV, fov, dt, corte) {
    const tau = tauSuavizado(opc.suavizado);
    if (!filtro.listo || corte || tau < .001 || !(dt > 0)) {
      filtro.pos.copy(posV);
      filtro.dir.copy(dirV);
      filtro.fov = fov;
      filtro.listo = true;
    } else {
      const k = 1 - Math.exp(-dt / tau);
      filtro.pos.lerp(posV, k);
      filtro.dir.lerp(dirV, k).normalize();
      filtro.fov += (fov - filtro.fov) * k;
    }
    ubicar(_pf.copy(filtro.pos), _mf.copy(filtro.pos).add(filtro.dir), filtro.fov);
  }
  function pasoOtroMundo(dt) {
    const r = otro.paso(dt, P, {
      rayo: rayoJuego,
      paredes: paredes,
      boton9: boton9,
      boton9Apretado: boton9Apretado
    });
    boton9Apretado = false;
    if (r.corte) {
      ctl.timer = 1.6;
    }
    poseA = r.corte || !poseB ? null : poseB;
    poseB = {
      pos: r.pos.slice(),
      vista: r.vista.slice(),
      angulo: r.angulo,
      corte: r.corte
    };
    if (!poseA) poseA = poseB;
    estado.modo = NOMBRES_MODO[r.modo] ?? r.modo;
    estado.area = r.area?.nombre || "(por defecto)";
    estado.corte = r.corte;
    estado.angulo = r.angulo;
    estado.pos = r.pos.map(x => Math.round(x));
    estado.henry = P.pos.map(x => Math.round(x));
  }
  const _pv = new THREE.Vector3, _dv = new THREE.Vector3;
  function dibujarOtroMundo(a, dtCuadro, corte) {
    const A = poseA, B = poseB, l = (x, y) => x + (y - x) * a;
    const pos = [ l(A.pos[0], B.pos[0]), l(A.pos[1], B.pos[1]), l(A.pos[2], B.pos[2]) ];
    const v = [ l(A.vista[0], B.vista[0]), l(A.vista[1], B.vista[1]), l(A.vista[2], B.vista[2]) ];
    aVisor(pos, _pv);
    _dv.set(-v[0], -v[1], v[2]).normalize();
    ubicarSuave(_pv, _dv, fovVertical(l(A.angulo, B.angulo)), dtCuadro, corte);
    const adel = new THREE.Vector3;
    camara.getWorldDirection(adel);
    adel.y = 0;
    adel.normalize();
    if (ctl.timer > 0 && P.rapidez > 0) ctl.timer -= dtCuadro; else {
      ctl.timer = 0;
      ctl.adelante.copy(adel);
    }
  }
  const seguidor = crearSeguidor(THREE);
  const seg = {
    yaw: 0,
    pitch: .22,
    piv: new THREE.Vector3,
    listo: false,
    manualT: 0
  };
  const entrada = {
    dx: 0,
    dy: 0
  };
  const _f = new THREE.Vector3, _r = new THREE.Vector3, _h = new THREE.Vector3, _c = new THREE.Vector3, _m = new THREE.Vector3, _atras = new THREE.Vector3;
  const yawDe = a => Math.atan2(Math.sin(a), -Math.cos(a));
  function pasoSeguidor(dt, libre) {
    const g = henry?.personaje?.grupo;
    const pies = g ? g.position : _h.copy(jugador.position).setY(jugador.position.y - ojos);
    const rumbo = g ? -g.rotation.y : 0;
    const k = .4 + opc.giro * .16;
    let manual = false;
    if (entrada.dx || entrada.dy) {
      seg.yaw -= entrada.dx * .0035 * k;
      seg.pitch += entrada.dy * .0028 * k;
      manual = true;
    }
    entrada.dx = entrada.dy = 0;
    for (const gp of navigator.getGamepads?.() || []) {
      if (!gp || gp.mapping !== "standard") continue;
      const gx = Math.abs(gp.axes[2]) > .18 ? gp.axes[2] : 0, gy = Math.abs(gp.axes[3]) > .18 ? gp.axes[3] : 0;
      if (gx || gy) {
        seg.yaw -= gx * 2.4 * k * dt;
        seg.pitch += gy * 1.6 * k * dt;
        manual = true;
      }
    }
    if (manual) seg.manualT = 1.5; else seg.manualT = Math.max(0, seg.manualT - dt);
    if (!seg.listo) {
      seg.yaw = yawDe(rumbo);
      seg.pitch = libre ? .3 : .22;
      seg.piv.set(pies.x, pies.y + (libre ? 1.35 : 1.55), pies.z);
    }
    const vel = P?.rapidez || 0;
    if (!libre && opc.giro > 0 && vel > 0 && seg.manualT <= 0) {
      const d = wrap(yawDe(rumbo) - seg.yaw);
      if (Math.abs(d) < 2.2) seg.yaw += d * (1 - Math.exp(-dt * opc.giro * .45));
      seg.pitch += (.22 - seg.pitch) * (1 - Math.exp(-dt * 1.2));
    }
    seg.yaw = wrap(seg.yaw);
    seg.pitch = Math.max(-.6, Math.min(1.2, seg.pitch));
    const tau = tauSuavizado(opc.suavizado);
    _h.set(pies.x, pies.y + (libre ? 1.35 : 1.55), pies.z);
    if (!seg.listo || tau < .001) seg.piv.copy(_h); else seg.piv.lerp(_h, 1 - Math.exp(-dt / tau));
    if (seg.piv.distanceTo(_h) > 1.5) seg.piv.copy(_h);
    const cp = Math.cos(seg.pitch);
    _f.set(-Math.sin(seg.yaw) * cp, -Math.sin(seg.pitch), -Math.cos(seg.yaw) * cp);
    _r.set(Math.cos(seg.yaw), 0, -Math.sin(seg.yaw));
    const col = getColision();
    const lado = libre ? 0 : seguidor.distanciaLibre(col, seg.piv, _r, .32, .1);
    _c.copy(seg.piv).addScaledVector(_r, lado);
    _atras.copy(_f).negate();
    const dist = seguidor.distancia(col, _c, _atras, metrosDistancia(opc.distancia), dt, !seg.listo);
    seg.listo = true;
    _c.addScaledVector(_atras, dist);
    _m.copy(_c).add(_f);
    ubicar(_c, _m, fovOriginalSeguidor);
    ctl.adelante.copy(_f).setY(0);
    if (ctl.adelante.lengthSq() < 1e-6) ctl.adelante.set(-Math.sin(seg.yaw), 0, -Math.cos(seg.yaw));
    ctl.adelante.normalize();
    estado.modo = libre ? "libre" : "detrás del hombro";
    estado.area = "-";
    estado.angulo = 0;
    estado.henry = P ? P.pos.map(x => Math.round(x)) : null;
    estado.pos = aJuego(_c).map(x => Math.round(x));
    estado.corte = false;
  }
  const fovOriginalSeguidor = 60;
  addEventListener("mousemove", e => {
    if (!activa || opc.tipo === "juego") return;
    const lock = !!document.pointerLockElement;
    if (lock || e.buttons & 4 || e.buttons & 1 && e.target?.tagName === "CANVAS") {
      entrada.dx += e.movementX || 0;
      entrada.dy += e.movementY || 0;
    }
  });
  let dedo = null;
  addEventListener("touchstart", e => {
    const t = e.changedTouches[0];
    if (t && e.target?.tagName === "CANVAS" && !dedo) dedo = {
      id: t.identifier,
      x: t.clientX,
      y: t.clientY
    };
  }, {
    passive: true
  });
  addEventListener("touchmove", e => {
    if (!dedo || !activa || opc.tipo === "juego") return;
    for (const t of e.changedTouches) if (t.identifier === dedo.id) {
      entrada.dx += (t.clientX - dedo.x) * 1.6;
      entrada.dy += (t.clientY - dedo.y) * 1.6;
      dedo.x = t.clientX;
      dedo.y = t.clientY;
    }
  }, {
    passive: true
  });
  const soltarDedo = e => {
    for (const t of e.changedTouches) if (dedo && t.identifier === dedo.id) dedo = null;
  };
  addEventListener("touchend", soltarDedo, {
    passive: true
  });
  addEventListener("touchcancel", soltarDedo, {
    passive: true
  });
  function paso302(dt) {
    const P = datosHenry(dt);
    const s = Math.max(Math.abs(P.vel[0]), Math.abs(P.vel[2])) * .004;
    if (s > 0) {
      p302.fase += s * 1.3 * .2094395 * (dt / DT_JUEGO);
      if (p302.fase > Math.PI) p302.fase -= 2 * Math.PI;
    }
    const k = p302.balanceo === 2 ? 3 : p302.balanceo === 1 ? 1.5 : 0;
    const y = Math.sin(p302.fase) * k - OJO_302;
    camara.position.set(0, -y * escala - ojos, 0);
    const e = (new THREE.Euler).setFromQuaternion(camara.quaternion, "YXZ");
    if (P.rapidez === 0) p302.quietoT += dt; else {
      p302.quietoT = 0;
      p302.enfocando = false;
      p302.foco = null;
    }
    if (p302.quietoT > .25 && p302.objetos.length) {
      const ojo = camara.getWorldPosition(new THREE.Vector3), fw = camara.getWorldDirection(new THREE.Vector3);
      if (!p302.foco) {
        let mejor = null, mejorDot = .7;
        for (const p of p302.objetos) {
          const v = aVisor(p).sub(ojo), d = v.length() / escala;
          if (d > AF_DIST || d < 1) continue;
          const dot = v.normalize().dot(fw);
          if (dot > mejorDot && dentroDePantalla(v)) {
            mejor = p;
            mejorDot = dot;
          }
        }
        p302.foco = mejor;
        p302.enfocando = !!mejor;
      }
      if (p302.foco && p302.enfocando) {
        const v = aVisor(p302.foco).sub(ojo);
        const yaw = Math.atan2(-v.x, -v.z), pitch = Math.atan2(v.y, Math.hypot(v.x, v.z));
        const dy = wrap(yaw - e.y), dp = pitch - e.x;
        const k10 = 1 - Math.pow(.9, dt / DT_JUEGO);
        e.y += dy * k10;
        e.x += dp * k10;
        if (Math.abs(dy) < .1 && Math.abs(dp) < .1) p302.enfocando = false;
      }
    }
    e.x = Math.max(PITCH_MIN, Math.min(PITCH_MAX, e.x));
    e.z = 0;
    camara.quaternion.setFromEuler(e);
    const f = fovVertical(FOV_302);
    if (Math.abs(camara.fov - f) > .001) {
      camara.fov = f;
      camara.updateProjectionMatrix();
    }
    estado.modo = "302 (1ra persona)";
    estado.area = p302.foco ? "autofoco" : "-";
    estado.angulo = FOV_302;
    camara.getWorldDirection(ctl.adelante);
    ctl.adelante.y = 0;
    ctl.adelante.normalize();
  }
  function dentroDePantalla(vMundo) {
    const p = vMundo.clone().add(camara.getWorldPosition(new THREE.Vector3)).project(camara);
    return Math.abs(p.x) <= 135 / 320 && Math.abs(p.y) <= 120 / 224;
  }
  function enVR() {
    return !!(renderer || window.sh4?.renderer)?.xr?.isPresenting;
  }
  function actualizar(dt) {
    if (!activa || !sala || enVR()) return false;
    const primera = henry ? henry.modo === "1ra" : etapa === "rl";
    if (primera) {
      if (etapa === "rl" || etapa === "gt") paso302(dt);
      return true;
    }
    P = datosHenry(dt);
    if (opc.tipo !== "juego") {
      pasoSeguidor(dt, opc.tipo === "libre");
      return true;
    }
    acum = Math.min(acum + dt, 4 * DT_JUEGO);
    let n = 0, corte = false;
    if (!poseB) {
      pasoOtroMundo(DT_JUEGO);
      corte = true;
    }
    while (acum >= DT_JUEGO - 1e-6 && n < 4) {
      pasoOtroMundo(DT_JUEGO);
      corte = corte || poseB.corte;
      acum -= DT_JUEGO;
      n++;
    }
    dibujarOtroMundo(Math.max(0, Math.min(1, acum / DT_JUEGO)), dt, corte);
    return true;
  }
  function activar(si) {
    if (si === activa) return activa;
    activa = !!si;
    if (activa) {
      fovOriginal = camara.fov;
      if (sala) alCargarSala(sala);
    } else {
      camara.fov = fovOriginal;
      camara.updateProjectionMatrix();
      if (henry?.modo === "1ra" || !henry) camara.position.set(0, 0, 0);
      const e = (new THREE.Euler).setFromQuaternion(camara.quaternion, "YXZ");
      e.z = 0;
      camara.quaternion.setFromEuler(e);
    }
    return activa;
  }
  function aplicarOpciones(o) {
    const antes = opc.tipo;
    opc = conFijo(opcionesCamara(o || leerOpciones()));
    if (opc.tipo !== antes) {
      seg.listo = false;
      seguidor.reiniciar();
      filtro.listo = false;
      poseA = poseB = null;
      acum = 0;
      ctl.timer = 0;
    }
  }
  addEventListener("sh4opciones", e => aplicarOpciones({
    ...leerOpciones(),
    ...e.detail || {}
  }));
  addEventListener("storage", e => {
    if (e.key === "sh4opciones") aplicarOpciones();
  });
  addEventListener("keydown", e => {
    if (e.code !== "KeyX" || e.repeat) return;
    boton9 = true;
    boton9Apretado = true;
    if (opc.tipo !== "juego") {
      const g = henry?.personaje?.grupo;
      if (g) {
        seg.yaw = yawDe(-g.rotation.y);
        seg.pitch = .22;
      }
    }
  });
  addEventListener("keyup", e => {
    if (e.code === "KeyX") boton9 = false;
  });
  return {
    alCargarSala: alCargarSala,
    actualizar: actualizar,
    activar: activar,
    get activa() {
      return activa;
    },
    set activa(v) {
      activar(v);
    },
    get tipo() {
      return opc.tipo;
    },
    get opciones() {
      return {
        ...opc
      };
    },
    aplicarOpciones: aplicarOpciones,
    adelanteControl(out = new THREE.Vector3) {
      return out.copy(ctl.adelante);
    },
    get estado() {
      return {
        ...estado,
        sala: sala,
        escena: escena,
        areas: otro.areas?.length || 0,
        tipo: opc.tipo
      };
    },
    get areas() {
      return otro.areas;
    },
    get areaActual() {
      return otro.area;
    },
    set balanceo(n) {
      p302.balanceo = n;
    },
    decodificarArg: decodificarArg
  };
}
