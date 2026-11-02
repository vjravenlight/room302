// SH4 web — FeniXVOID · Project Ravenlight
import * as THREE from "three";

import { crearManos } from "../vr_manos.js";

import { leerOpciones, usoActual, CLAVE } from "../opciones_sitio.js";

import { opcionesMejorado } from "../mejorado/presets.js";

let _op = null, _t = -1e9, _firma = "";

const oyentes = new Set;

function releer() {
  _op = leerOpciones();
  _t = performance.now();
  const f = JSON.stringify(_op);
  if (f !== _firma) {
    const habia = !!_firma;
    _firma = f;
    if (habia) for (const g of oyentes) {
      try {
        g(_op);
      } catch (e) {
        console.warn("[opciones]", e);
      }
    }
  }
  return _op;
}

export function opciones() {
  return !_op || performance.now() - _t > 1500 ? releer() : _op;
}

export function alCambiarOpciones(f) {
  oyentes.add(f);
  return () => oyentes.delete(f);
}

if (typeof addEventListener === "function") {
  addEventListener("sh4opciones", () => releer());
  addEventListener("storage", e => {
    if (e.key === CLAVE || e.key === "sh4vistaMundo") releer();
  });
}

export const manoDominante = () => opciones().manoVR === "izq" ? "izq" : "der";

export const ladoXR = l => l === "izq" ? "left" : "right";

export const dominanteXR = () => ladoXR(manoDominante());

export const otraXR = () => dominanteXR() === "right" ? "left" : "right";

export const vibrarCelular = (ms = 25) => {
  if (opciones().vibracion) {
    try {
      navigator.vibrate?.(ms);
    } catch {}
  }
};

export const escalaBotones = () => ({
  chicos: .8,
  medianos: 1,
  grandes: 1.25
}[opciones().botones] || 1);

export const joystickALaDerecha = () => opciones().joystick === "der";

export function pixelesPorPunto(dpr = globalThis.devicePixelRatio || 1) {
  const o = opciones(), u = usoActual(o);
  const c = u === "escritorio" ? o.calidad : u === "vr" ? "alta" : o.calidadTactil;
  return c === "baja" ? Math.max(.5, Math.min(1, dpr) * .75) : c === "media" ? Math.min(dpr, 1.25) : Math.min(dpr, 2);
}

export function aplicarCalidad(renderer) {
  if (renderer.xr?.isPresenting) return;
  const pr = pixelesPorPunto();
  if (Math.abs(renderer.getPixelRatio() - pr) > .001) {
    renderer.setPixelRatio(pr);
    renderer.setSize(innerWidth, innerHeight);
  }
}

export function mouse() {
  const o = opciones();
  return {
    k: Math.pow(2, ((+o.mouseSens || 5) - 5) / 2.5),
    invertir: !!o.mouseInvertir
  };
}

export const casco = {
  manos: null,
  apuntables: new Set,
  agarre: null,
  palito: {
    x: 0,
    y: 0
  },
  inventarioAbierto: false,
  gripMano: () => null,
  rayo() {
    const r = this.manos?.rayos?.().find(x => x.activa);
    return r || null;
  }
};

const _cab = new THREE.Vector3, _cab2 = new THREE.Vector3;

export function girarAlrededorDeCabeza(rig, camara, ang) {
  camara.getWorldPosition(_cab);
  rig.rotation.y += ang;
  rig.updateMatrixWorld(true);
  camara.getWorldPosition(_cab2);
  rig.position.x += _cab.x - _cab2.x;
  rig.position.z += _cab.z - _cab2.z;
  rig.updateMatrixWorld(true);
}

export function girarConPalito(rig, camara, x, dt, estado) {
  if (opciones().giroVR === "suave") {
    const v = Math.abs(x) > .2 ? (x - Math.sign(x) * .2) / .8 : 0;
    if (v) girarAlrededorDeCabeza(rig, camara, -v * THREE.MathUtils.degToRad(90) * dt);
    return !!v;
  }
  if (Math.abs(x) > .6) {
    if (estado.listo !== false) {
      girarAlrededorDeCabeza(rig, camara, -Math.sign(x) * Math.PI / 6);
      estado.listo = false;
      return true;
    }
  } else if (Math.abs(x) < .3) estado.listo = true;
  return false;
}

function crearVineta() {
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uR0: {
        value: 1
      },
      uA: {
        value: 0
      }
    },
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: "varying vec2 vUv; uniform float uR0; uniform float uA; void main(){ float r = length((vUv - 0.5) * 2.0); gl_FragColor = vec4(0.0, 0.0, 0.0, smoothstep(uR0, uR0 + 0.3, r) * uA); }",
    transparent: true,
    depthTest: false,
    depthWrite: false,
    toneMapped: false
  });
  const malla = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 4.4), mat);
  malla.position.z = -1.1;
  malla.renderOrder = 95;
  malla.frustumCulled = false;
  malla.visible = false;
  malla.name = "viñeta (casco)";
  return malla;
}

export function prepararCasco({renderer: renderer, camara: camara, padre: padre, rig: rig = padre, escena: escena = null, ojos: ojos = 1.6, mejorado: mejorado = null, alCambiarAltura: alCambiarAltura = null}) {
  const manos = crearManos({
    renderer: renderer,
    padre: padre,
    escena: escena,
    manoDominante: manoDominante()
  });
  casco.manos = manos;
  const estado = {
    postura: "parado",
    altura: null,
    ajuste: 0,
    vineta: 0,
    palito: false,
    mejorado: null
  };
  let base = null, medidas = [], tSesion = 0;
  function aplicarPostura() {
    if (!base || typeof XRRigidTransform === "undefined") return;
    const o = opciones(), sentado = o.posturaVR === "sentado", comoHenry = sentado || o.escalaVR === "henry";
    const h = comoHenry && estado.altura ? Math.max(sentado ? 0 : -.7, Math.min(1, ojos - estado.altura)) : 0;
    estado.postura = sentado ? "sentado" : "parado";
    if (Math.abs(h - estado.ajuste) < .005 && (h !== 0 || renderer.xr.getReferenceSpace() === base)) return;
    try {
      renderer.xr.setReferenceSpace(h !== 0 ? base.getOffsetReferenceSpace(new XRRigidTransform({
        x: 0,
        y: -h,
        z: 0
      })) : base);
      estado.ajuste = h;
    } catch (e) {
      console.warn("[casco] postura", e);
      return;
    }
    setTimeout(() => {
      try {
        alCambiarAltura?.();
      } catch {}
    }, 30);
  }
  let ajuste = null;
  renderer.xr.addEventListener("sessionstart", () => {
    base = renderer.xr.getReferenceSpace();
    estado.ajuste = 0;
    estado.altura = null;
    medidas = [];
    tSesion = 0;
    manos.ponerDominante(manoDominante());
    ponerMejorado(true);
    import("./ajuste_cuerpo_vr.js").then(m => {
      ajuste ||= m.crearAjusteCuerpoVR({
        THREE: THREE,
        renderer: renderer,
        camara: camara,
        jugador: padre,
        alCambiar: aplicarPostura,
        alturaCabeza: () => camara.position.y - estado.ajuste
      });
      casco.ajusteCuerpo = ajuste;
      setTimeout(() => {
        if (renderer.xr.isPresenting) ajuste.alEntrar();
      }, 1200);
    }).catch(e => console.warn("[casco] ajuste del cuerpo", e));
  });
  renderer.xr.addEventListener("sessionend", () => {
    base = null;
    estado.ajuste = 0;
    casco.palito = {
      x: 0,
      y: 0
    };
    ponerMejorado(false);
    vineta.visible = false;
  });
  let mejAntes = null;
  function ponerMejorado(entrando) {
    const m = mejorado?.();
    if (!m?.activar) return;
    if (entrando) {
      mejAntes = {
        activo: !!m.activo,
        preset: m.estado?.preset
      };
      const pedido = opcionesMejorado().questPedido;
      if (pedido) m.preset?.("quest");
      m.activar(pedido);
      estado.mejorado = pedido;
    } else if (mejAntes) {
      if (mejAntes.preset) m.preset?.(mejAntes.preset);
      m.activar(mejAntes.activo);
      mejAntes = null;
      estado.mejorado = null;
    }
  }
  alCambiarOpciones(o => {
    if (!renderer.xr.isPresenting) return;
    manos.ponerDominante(o.manoVR === "izq" ? "izq" : "der");
    aplicarPostura();
    const m = mejorado?.();
    if (m?.activar && estado.mejorado !== !!o.mejoradoQuest) {
      if (o.mejoradoQuest) m.preset?.("quest");
      m.activar(!!o.mejoradoQuest);
      estado.mejorado = !!o.mejoradoQuest;
    }
  });
  const vineta = crearVineta();
  camara.add(vineta);
  let fV = 0, pulso = 0, hayAntes = false, yawAntes = 0;
  const posAntes = new THREE.Vector3, _p = new THREE.Vector3, _q = new THREE.Quaternion, _e = new THREE.Euler(0, 0, 0, "YXZ");
  function actualizarVineta(dt, moviendo) {
    const nivel = +opciones().vinetaVR || 0;
    rig.updateMatrixWorld(true);
    rig.getWorldPosition(_p);
    _e.setFromQuaternion(rig.getWorldQuaternion(_q), "YXZ");
    let vel = 0, giro = 0;
    if (hayAntes && dt > 0) {
      const d = Math.hypot(_p.x - posAntes.x, _p.z - posAntes.z);
      let dy = _e.y - yawAntes;
      dy = Math.atan2(Math.sin(dy), Math.cos(dy));
      if (d < .6) vel = d / dt;
      if (Math.abs(dy) > .35) pulso = .2; else giro = Math.abs(dy) / dt;
    }
    posAntes.copy(_p);
    yawAntes = _e.y;
    hayAntes = true;
    pulso = Math.max(0, pulso - dt);
    const meta = nivel ? Math.max(moviendo ? Math.min(1, vel / 1.4 + giro / 1.2) : 0, pulso > 0 ? 1 : 0) : 0;
    fV += (meta - fV) * (1 - Math.exp(-dt * (meta > fV ? 12 : 5)));
    const rMin = nivel >= 2 ? .16 : .32;
    vineta.material.uniforms.uR0.value = .95 + (rMin - .95) * fV;
    vineta.material.uniforms.uA.value = 1;
    vineta.visible = fV > .01;
    estado.vineta = +fV.toFixed(2);
  }
  const marca = new THREE.Group;
  marca.name = "palito virtual";
  marca.visible = false;
  const matM = new THREE.MeshBasicMaterial({
    color: 16720916,
    transparent: true,
    opacity: .85,
    depthTest: false,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const anillo = new THREE.Mesh(new THREE.RingGeometry(.022, .028, 28).rotateX(-Math.PI / 2), matM);
  const punta = new THREE.Mesh(new THREE.SphereGeometry(.008, 10, 8), matM);
  marca.add(anillo, punta);
  marca.traverse(o => {
    o.renderOrder = 997;
    o.frustumCulled = false;
  });
  padre.add(marca);
  let origen = null;
  const _m = new THREE.Vector3, _f = new THREE.Vector3, _r = new THREE.Vector3, ARRIBA = new THREE.Vector3(0, 1, 0), _qi = new THREE.Quaternion;
  function actualizarPalito() {
    const dom = manoDominante();
    const otra = manos.estados.find(e => e.conectado && e.tipo === "mano" && e.lado !== dom);
    const a = otra?.mano?.joints?.["thumb-tip"], b = otra?.mano?.joints?.["index-finger-tip"];
    if (!otra || !otra.pellizco || !a || !b) {
      origen = null;
      marca.visible = false;
      casco.palito = {
        x: 0,
        y: 0
      };
      estado.palito = false;
      return;
    }
    _m.copy(a.position).add(b.position).multiplyScalar(.5);
    if (!origen) origen = _m.clone();
    camara.getWorldDirection(_f);
    padre.getWorldQuaternion(_qi).invert();
    _f.applyQuaternion(_qi);
    _f.y = 0;
    if (_f.lengthSq() < 1e-6) _f.set(0, 0, -1);
    _f.normalize();
    _r.crossVectors(_f, ARRIBA).normalize();
    const dx = _m.x - origen.x, dz = _m.z - origen.z;
    let x = (dx * _r.x + dz * _r.z) / .08, y = -(dx * _f.x + dz * _f.z) / .08;
    const l = Math.hypot(x, y);
    if (l < .18) x = y = 0; else if (l > 1) {
      x /= l;
      y /= l;
    }
    casco.palito = {
      x: x,
      y: y,
      activo: true,
      corre: l > 1.5
    };
    estado.palito = true;
    marca.visible = true;
    anillo.position.copy(origen);
    punta.position.copy(_m);
  }
  const gripsMano = {
    der: new THREE.Group,
    izq: new THREE.Group
  };
  for (const [l, g] of Object.entries(gripsMano)) {
    g.name = "grip de la mano " + l;
    g.visible = false;
    padre.add(g);
  }
  casco.gripMano = lado => gripsMano[lado]?.visible ? gripsMano[lado] : null;
  const _gx = new THREE.Vector3, _gy = new THREE.Vector3, _gz = new THREE.Vector3, _gm = new THREE.Matrix4;
  function actualizarGripsMano() {
    for (const l of [ "der", "izq" ]) {
      const e = manos.estados.find(x => x.conectado && x.tipo === "mano" && x.lado === l), g = gripsMano[l];
      const J = e?.mano?.joints, w = J?.wrist, im = J?.["index-finger-metacarpal"], pm = J?.["pinky-finger-metacarpal"], mp = J?.["middle-finger-phalanx-proximal"];
      if (!w || !im || !pm || !mp || !w.visible) {
        g.visible = false;
        continue;
      }
      _gz.copy(pm.position).sub(im.position).normalize();
      _gy.copy(mp.position).sub(w.position);
      _gy.addScaledVector(_gz, -_gy.dot(_gz)).normalize();
      _gx.crossVectors(_gy, _gz).normalize();
      _gm.makeBasis(_gx, _gy, _gz);
      g.quaternion.setFromRotationMatrix(_gm);
      g.position.copy(im.position).add(pm.position).add(mp.position).multiplyScalar(1 / 3);
      g.visible = true;
    }
  }
  function cerrarSobreElArma() {
    const ag = casco.agarre;
    if (!ag || performance.now() - ag.t > 250) return;
    for (const e of manos.estados) {
      if (!e.conectado || e.tipo !== "control" || e.lado !== ag.lado) continue;
      const g = e.fuente?.gamepad?.buttons?.[0]?.value || 0;
      e.proc[e.lado]?.poner(ag.pistola ? .35 + .65 * g : 1, 1, ag.pistola ? 1 : .9, 1);
    }
  }
  let pielLista = false;
  function aclararPiel() {
    for (const e of manos.estados) for (const p of Object.values(e.proc)) {
      p.grupo.traverse(o => {
        if (o.isMesh && o.material?.emissive && !pielLista) {
          o.material.emissive.setHex(3812130);
          pielLista = true;
        }
      });
    }
  }
  function actualizar(dt, {moviendo: moviendo = true, objetivos: objetivos = null} = {}) {
    if (!renderer.xr.isPresenting) {
      vineta.visible = false;
      marca.visible = false;
      return [];
    }
    tSesion += dt;
    if (!pielLista) aclararPiel();
    if (estado.altura == null) {
      const y = camara.position.y - estado.ajuste;
      if (tSesion > .3 && y > .3) medidas.push(y);
      if (tSesion > 1 && medidas.length) {
        estado.altura = medidas.reduce((s, v) => s + v, 0) / medidas.length;
        aplicarPostura();
      }
    }
    const dom = manoDominante();
    if (manos.activa !== dom) manos.ponerDominante(dom);
    const lista = objetivos ?? [];
    for (const o of casco.apuntables) if (o.visible && o.parent && !lista.includes(o)) lista.push(o);
    const hits = manos.actualizar(dt, lista);
    if (manos.activa !== dom) manos.ponerDominante(dom);
    ajuste?.actualizar(dt);
    cerrarSobreElArma();
    actualizarGripsMano();
    actualizarPalito();
    actualizarVineta(dt, moviendo);
    return hits;
  }
  return {
    manos: manos,
    actualizar: actualizar,
    estado: estado,
    vineta: vineta,
    aplicarPostura: aplicarPostura
  };
}
