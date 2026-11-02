// SH4 web — FeniXVOID · Project Ravenlight
import { cajaTocaEsfera } from "./armas.js";

import { ESTADO, ITEM } from "./datos.js";

import { casco, dominanteXR, manoDominante } from "./casco_comun.js";

const ESC = .005;

const VEL_GOLPE = 2, VEL_FUERTE = 4.5, ESPERA_ENEMIGO = .45;

export function crearArmaVista({THREE: THREE, camara: camara, renderer: renderer = null, armas: armas, ctl: ctl, animador: animador, enGrip: enGrip = null}) {
  const montura = new THREE.Group;
  montura.name = "arma vista";
  const giro = new THREE.Group;
  montura.add(giro);
  montura.scale.setScalar(ESC);
  let actual = null, kActual = -1, cargando = false, lugar = null;
  const base = {
    p: new THREE.Vector3,
    q: new THREE.Quaternion
  };
  const anim = {
    baja: 1,
    x: 0,
    z: 0,
    pat: 0,
    t: 0
  };
  const _m = new THREE.Matrix4, _a = new THREE.Matrix4, _v = new THREE.Vector3, _w = new THREE.Vector3, _q = new THREE.Quaternion;
  const esPistola = k => k === ITEM.PISTOLA || k === ITEM.REVOLVER;
  const lados = new Map;
  const r = () => renderer ?? globalThis.window?.sh4?.renderer;
  function escuchar() {
    const R = r();
    if (!R?.xr) return;
    for (let i = 0; i < 2; i++) {
      const c = R.xr.getController(i), g = R.xr.getControllerGrip(i);
      if (lados.has(c)) continue;
      lados.set(c, null);
      const poner = e => {
        lados.set(c, e.data?.handedness || null);
      };
      c.addEventListener("connected", poner);
      g.addEventListener("connected", poner);
      c.addEventListener("disconnected", () => lados.set(c, null));
    }
  }
  escuchar();
  function controles() {
    const R = r();
    if (!R?.xr) return null;
    escuchar();
    const fuentes = [ ...R.xr.getSession?.()?.inputSources || [] ];
    const out = {};
    for (let i = 0; i < 2; i++) {
      const c = R.xr.getController(i), g = R.xr.getControllerGrip(i);
      const lado = lados.get(c) || fuentes[i]?.handedness || null;
      if (lado && !out[lado]) out[lado] = {
        c: c,
        g: g,
        i: i
      };
    }
    return out;
  }
  function fuenteDominante() {
    const s = r()?.xr?.getSession?.();
    if (!s) return null;
    const lado = dominanteXR();
    for (const src of s.inputSources) if (src.handedness === lado) return src;
    return null;
  }
  function vibrar(fuerza = .8, ms = 70) {
    try {
      fuenteDominante()?.gamepad?.hapticActuators?.[0]?.pulse?.(fuerza, ms);
    } catch {}
  }
  function alinear(c, adelante, arriba, eje2 = null) {
    const e1 = c.eje.clone().normalize();
    let e2 = (eje2 || c.eje2).clone().projectOnPlane(e1);
    if (e2.lengthSq() < 1e-6) e2 = c.eje2.clone().projectOnPlane(e1);
    e2.normalize();
    const e3 = (new THREE.Vector3).crossVectors(e1, e2);
    const f = adelante.clone().normalize(), u = arriba.clone().projectOnPlane(f).normalize(), s = (new THREE.Vector3).crossVectors(f, u);
    _a.makeBasis(e1, e2, e3).invert();
    _m.makeBasis(f, u, s).multiply(_a);
    giro.quaternion.setFromRotationMatrix(_m);
  }
  async function poner(k) {
    if (k === kActual || cargando) return;
    cargando = true;
    try {
      const c = k ? await armas.copia(k) : null;
      giro.clear();
      actual = c;
      kActual = k;
      if (c) giro.add(c.grupo);
      lugar = null;
    } catch (e) {
      console.warn("arma vista", e);
      actual = null;
      kActual = k;
    }
    cargando = false;
  }
  function ubicar(nuevo, ctrl) {
    if (nuevo === lugar && montura.parent && (nuevo === "camara" || montura.parent === (nuevo === "rayo" ? ctrl.c : ctrl.g))) return;
    lugar = nuevo;
    montura.removeFromParent();
    base.p.set(0, 0, 0);
    base.q.identity();
    if (!actual) return;
    if (nuevo === "camara") {
      camara.add(montura);
      alinear(actual, esPistola(kActual) ? new THREE.Vector3(0, .02, -1) : new THREE.Vector3(-.15, 1, -.35), esPistola(kActual) ? new THREE.Vector3(0, 1, .1) : new THREE.Vector3(.2, 0, 1));
    } else if (nuevo === "grip") {
      ctrl.g.add(montura);
      const deMano = !!ctrl.g.name?.startsWith("grip de la mano");
      const en = enGrip?.(kActual, manoDominante(), deMano);
      if (en) {
        giro.quaternion.identity();
        base.q.copy(en.q);
        base.p.copy(en.p);
      } else alinear(actual, new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 1, 0));
    } else if (nuevo === "rayo") {
      ctrl.c.add(montura);
      alinear(actual, new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, 1, 0));
    }
  }
  const tipAntes = new THREE.Vector3;
  let hayTip = false;
  const esperas = new Map;
  let espera = 0;
  const obb = {
    centro: new THREE.Vector3,
    ejes: [ new THREE.Vector3, new THREE.Vector3, new THREE.Vector3 ]
  };
  function cajaMundo() {
    montura.updateWorldMatrix(true, true);
    const M = actual.grupo.matrixWorld;
    obb.centro.copy(actual.centro).applyMatrix4(M);
    const e = M.elements;
    for (let i = 0; i < 3; i++) obb.ejes[i].set(e[i * 4], e[i * 4 + 1], e[i * 4 + 2]).multiplyScalar(actual.medio.getComponent(i));
    return obb;
  }
  const estado = {
    velocidad: 0,
    golpesGesto: 0,
    ultimoGesto: null,
    lugar: null
  };
  function gesto(dt) {
    if (!actual || esPistola(kActual) || dt <= 0) {
      hayTip = false;
      return;
    }
    montura.updateWorldMatrix(true, true);
    const tip = actual.grupo.localToWorld(_v.copy(actual.punta));
    const vel = hayTip ? tip.distanceTo(tipAntes) / dt : 0;
    tipAntes.copy(tip);
    hayTip = true;
    estado.velocidad = vel;
    if (vel >= VEL_GOLPE && !estado.blandiendo && !ctl.s.muerto) {
      estado.blandiendo = true;
      estado.blandidas = (estado.blandidas || 0) + 1;
      try {
        ctl.sonarGolpe?.(vel >= VEL_FUERTE);
      } catch {}
    } else if (vel < VEL_GOLPE * .5) estado.blandiendo = false;
    espera = Math.max(0, espera - dt);
    for (const [e, t] of esperas) {
      if (t - dt <= 0) esperas.delete(e); else esperas.set(e, t - dt);
    }
    if (vel < VEL_GOLPE || ctl.s.muerto || espera > 0) return;
    const caja = cajaMundo();
    for (const e of ctl.enemigosLista()) {
      if (!e || e.muerto || esperas.has(e)) continue;
      const p = e.centroGolpe?.() || e.posicion;
      if (!p) continue;
      const c = _w.copy(p);
      if (!e.centroGolpe && e.alto) c.y += e.alto / 2;
      if (!cajaTocaEsfera(caja, c, (e.radio ?? .45) + .05)) continue;
      const fuerte = vel >= VEL_FUERTE;
      if (ctl.golpeExterno(e, {
        fuerte: fuerte
      })) {
        esperas.set(e, ESPERA_ENEMIGO);
        espera = .12;
        estado.golpesGesto++;
        estado.ultimoGesto = {
          vel: +vel.toFixed(2),
          fuerte: fuerte
        };
        vibrar(fuerte ? 1 : .7, fuerte ? 120 : 70);
      }
    }
  }
  function actualizar(dt, {modo: modo, enVR: enVR}) {
    const k = ctl.s.arma || 0;
    if (k !== kActual) poner(k);
    anim.t += dt;
    const ver = !!actual && !ctl.s.muerto && (enVR || modo === "1ra");
    if (!ver) {
      if (montura.parent) montura.removeFromParent();
      lugar = null;
      ctl.s.mira = null;
      hayTip = false;
      estado.lugar = null;
      casco.agarre = null;
      return;
    }
    if (enVR) {
      const cs = controles(), ctrl = cs?.[dominanteXR()];
      if (!ctrl) {
        montura.removeFromParent();
        lugar = null;
        ctl.s.mira = null;
        casco.agarre = null;
        return;
      }
      for (const lado of Object.values(cs)) {
        if (lado.g.parent !== camara.parent) camara.parent?.add(lado.g);
        if (lado.c.parent !== camara.parent && !lado.c.parent) camara.parent?.add(lado.c);
      }
      const gm = casco.gripMano(manoDominante());
      const der = gm ? {
        g: gm,
        c: ctrl.c
      } : ctrl;
      ubicar(esPistola(k) ? "rayo" : "grip", der);
      casco.agarre = {
        lado: manoDominante(),
        pistola: esPistola(k),
        t: performance.now()
      };
      montura.position.copy(base.p);
      montura.quaternion.copy(base.q);
      const em = casco.empuje?.[manoDominante()], padre = montura.parent;
      const enPuno = esPistola(k) && der.g && padre;
      if (padre && (enPuno || em && em.lengthSq() > 0)) {
        padre.updateWorldMatrix(true, false);
        if (enPuno) {
          der.g.updateWorldMatrix(true, false);
          _w.setFromMatrixPosition(der.g.matrixWorld);
        } else _w.copy(base.p).applyMatrix4(padre.matrixWorld);
        if (em) _w.add(em);
        padre.worldToLocal(_w);
        montura.position.copy(_w);
      }
      anim.pat = Math.max(0, anim.pat - dt * 6);
      if (esPistola(k)) {
        montura.rotation.x = anim.pat * .5;
        montura.position.z += anim.pat * .04;
      }
      der.c.updateWorldMatrix(true, false);
      ctl.s.mira = {
        origen: (new THREE.Vector3).setFromMatrixPosition(der.c.matrixWorld),
        dir: new THREE.Vector3(0, 0, -1).transformDirection(der.c.matrixWorld)
      };
      gesto(dt);
    } else {
      ubicar("camara");
      montura.quaternion.identity();
      hayTip = false;
      casco.agarre = null;
      camara.updateWorldMatrix(true, false);
      ctl.s.mira = {
        origen: (new THREE.Vector3).setFromMatrixPosition(camara.matrixWorld),
        dir: new THREE.Vector3(0, 0, -1).transformDirection(camara.matrixWorld)
      };
      animarVista(dt, k);
    }
    estado.lugar = lugar;
  }
  function animarVista(dt, k) {
    const s = ctl.s, E = ESTADO;
    const arriba = [ E.PREPARAR, E.GUARDIA, E.GOLPE, E.GOLPE_FUERTE, E.ESQUIVE ].includes(s.estado);
    const meta = arriba ? 0 : 1;
    anim.baja += (meta - anim.baja) * Math.min(1, dt * 9);
    let gx = 0, gz = 0, px = 0, py = 0, pz = 0;
    const p = animador?.proporcion ?? 0;
    if (s.estado === E.GOLPE || s.estado === E.GOLPE_FUERTE) {
      const a = s.estado === E.GOLPE_FUERTE ? 1.4 : 1;
      if (esPistola(k)) {
        if (p < .08) anim.pat = 1;
      } else if (p < .3) {
        const w = p / .3;
        gx += .75 * w * a;
        gz -= .55 * w * a;
        px += .05 * w;
        py += .05 * w;
      } else if (p < .6) {
        const w = (p - .3) / .3;
        gx += (.75 - 2 * w) * a;
        gz += (-.55 + 1.5 * w) * a;
        px += .05 - .2 * w;
        py += .05 - .14 * w;
        pz -= .12 * Math.sin(w * Math.PI);
      } else {
        const w = (p - .6) / .4;
        gx += -1.25 * (1 - w) * a;
        gz += .95 * (1 - w) * a;
        px += -.15 * (1 - w);
        py += -.09 * (1 - w);
      }
    }
    if (s.carga > 0 && (s.estado === E.GUARDIA || s.estado === E.PREPARAR)) {
      const c = s.carga / 100;
      gx += .25 * c;
      py += .02 * c;
      px += Math.sin(anim.t * 47) * .003 * c;
      py += Math.cos(anim.t * 53) * .003 * c;
    }
    if (s.danio) {
      px += Math.sin(anim.t * 60) * .01;
      gx -= .2;
    }
    if (s.agarre?.fase === 1) {
      px += Math.sin(anim.t * 41) * .025;
      py += Math.sin(anim.t * 29) * .02 - .08;
      gx -= .35;
      gz += Math.sin(anim.t * 37) * .12;
    }
    anim.pat = Math.max(0, anim.pat - dt * 7);
    const ancho = Math.min(1, camara.aspect / 1.6);
    const pis = esPistola(k);
    montura.position.set((pis ? .06 : .16) + .16 * ancho + px, (pis ? -.2 : -.55) - .12 * anim.baja + py, (pis ? -.42 : -.55) + pz + anim.pat * .05);
    montura.rotation.set((pis ? -.75 : -.45) * anim.baja + gx + anim.pat * .35, 0, gz);
  }
  return {
    actualizar: actualizar,
    vibrar: vibrar,
    estado: estado,
    montura: montura,
    get modelo() {
      return actual;
    }
  };
}
