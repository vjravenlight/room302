// SH4 web — FeniXVOID · Project Ravenlight
import { componer, crearPose, evaluar } from "../lib/animacion.js";

import { casco, manoDominante } from "./casco_comun.js";

import { manosDelJuego, MANO } from "./manos_henry.js";

const OCULTOS = new Set([ 10, 11, 23 ]);

const MOVIDOS = new Set([ 14, 15, 16, 25, 19, 20, 21 ]);

const BRAZOS = {
  der: {
    brazo: 13,
    antebrazo: 14,
    mano: 15,
    hijos: [ 16, 25 ],
    signo: 1
  },
  izq: {
    brazo: 18,
    antebrazo: 19,
    mano: 20,
    hijos: [ 21 ],
    signo: -1
  }
};

const MUNECA = {
  der: [ .03, .075, 0 ],
  izq: [ -.03, .075, 0 ]
};

export const DOS_MANOS = 90, AGARRE_IZQ = .22;

const DOS_MANOS_LARGAS = new Set([ 47, 48, 49 ]);

export const AJUSTE = {
  der: [ 0, 0, 0 ],
  izq: [ 0, 0, 0 ]
};

export function crearCuerpoVR({THREE: THREE, pj: pj, animador: animador, armas: armas = null, getColision: getColision = null, manosHenry: manosHenry = null, datos: datos = null}) {
  const esq = pj.esq, pose = animador.pose;
  const originales = pj.mallas.map(m => m.geometry.index);
  const filtrados = pj.mallas.map(m => {
    const g = m.geometry, idx = g.index.array, si = g.attributes.skinIndex.array, sw = g.attributes.skinWeight.array;
    const clase = v => {
      let w = 0, mov = 0, quieto = 0;
      for (let k = 0; k < 4; k++) {
        const b = si[v * 4 + k], p = sw[v * 4 + k];
        if (p <= .01) continue;
        if (OCULTOS.has(b)) w += p;
        if (MOVIDOS.has(b)) mov += p; else quieto += p;
      }
      return w >= .25 ? -1 : mov > 0 ? 1 : 0;
    };
    const salida = [];
    for (let t = 0; t + 2 < idx.length; t += 3) {
      const a = clase(idx[t]), b = clase(idx[t + 1]), c = clase(idx[t + 2]);
      if (a >= 0 && b >= 0 && c >= 0) salida.push(idx[t], idx[t + 1], idx[t + 2]);
    }
    return new THREE.BufferAttribute(new Uint16Array(salida), 1);
  });
  const MANO_DESDE_HUESO = {
    der: (new THREE.Quaternion).setFromRotationMatrix((new THREE.Matrix4).makeBasis(new THREE.Vector3(0, 0, -1), new THREE.Vector3(0, -1, 0), new THREE.Vector3(-1, 0, 0))),
    izq: (new THREE.Quaternion).setFromRotationMatrix((new THREE.Matrix4).makeBasis(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, -1, 0), new THREE.Vector3(1, 0, 0)))
  };
  const MANO_A_GRIP = {
    der: (new THREE.Quaternion).setFromRotationMatrix((new THREE.Matrix4).makeBasis(new THREE.Vector3(0, 0, 1), new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0))),
    izq: (new THREE.Quaternion).setFromRotationMatrix((new THREE.Matrix4).makeBasis(new THREE.Vector3(0, 0, -1), new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, 1, 0)))
  };
  const bindPos = i => [ esq.bindAbsPos[i * 3], esq.bindAbsPos[i * 3 + 1], esq.bindAbsPos[i * 3 + 2] ];
  const _mJ = new THREE.Matrix4, _q = new THREE.Quaternion, _qJ = new THREE.Quaternion, _qa = new THREE.Quaternion, _p = new THREE.Vector3, _v = new THREE.Vector3, _e = new THREE.Euler;
  let activo = false;
  const rayo = new THREE.Raycaster, empuje = {
    der: new THREE.Vector3,
    izq: new THREE.Vector3
  };
  const _cab = new THREE.Vector3, _t = new THREE.Vector3, _dir = new THREE.Vector3;
  const MARGEN_PARED = .05;
  function empujar({activo: si = false, manos: manos = null, camara: camara = null} = {}) {
    empuje.der.set(0, 0, 0);
    empuje.izq.set(0, 0, 0);
    casco.empuje = empuje;
    const col = getColision?.();
    if (!si || !col || !camara) return empuje;
    camara.getWorldPosition(_cab);
    for (const e of manos?.estados || []) {
      if (!e.conectado || !empuje[e.lado] || !e.grip) continue;
      e.grip.updateWorldMatrix(true, false);
      _t.setFromMatrixPosition(e.grip.matrixWorld);
      _dir.subVectors(_t, _cab);
      const d = _dir.length();
      if (d < .05) continue;
      _dir.divideScalar(d);
      rayo.set(_cab, _dir);
      rayo.far = d + MARGEN_PARED;
      const h = rayo.intersectObject(col, true)[0];
      if (h) empuje[e.lado].copy(_dir).multiplyScalar(Math.max(0, h.distance - MARGEN_PARED) - d);
    }
    return empuje;
  }
  function ponerVisible(si) {
    if (armas?.actual?.grupo) armas.actual.grupo.visible = !si;
    if (si === activo) return;
    activo = si;
    pj.mallas.forEach((m, i) => {
      m.geometry.setIndex(si ? filtrados[i] : originales[i]);
    });
  }
  function manoAlGrip(l, g) {
    const B = BRAZOS[l];
    const juego = pj.contenedor;
    juego.updateWorldMatrix(true, false);
    g.updateWorldMatrix(true, false);
    _mJ.copy(juego.matrixWorld).invert();
    juego.getWorldQuaternion(_qJ).invert();
    g.getWorldQuaternion(_q);
    const a = AJUSTE[l];
    _qa.setFromEuler(_e.set(a[0], a[1], a[2]));
    const qMano = _qJ.clone().multiply(_q).multiply(_qa).multiply(MANO_A_GRIP[l]).multiply(MANO_DESDE_HUESO[l]);
    const mu = MUNECA[l];
    _p.set(mu[0], mu[1], mu[2]).applyMatrix4(g.matrixWorld).add(empuje[l]).applyMatrix4(_mJ);
    const pm = bindPos(B.mano), pa = bindPos(B.antebrazo);
    _v.set(pm[0] - pa[0], pm[1] - pa[1], pm[2] - pa[2]).applyQuaternion(qMano);
    const {absRot: absRot, rot: rot, pos: pos, padres: padres} = pose;
    for (const i of [ B.antebrazo, B.mano ]) {
      absRot[i * 4] = qMano.x;
      absRot[i * 4 + 1] = qMano.y;
      absRot[i * 4 + 2] = qMano.z;
      absRot[i * 4 + 3] = qMano.w;
    }
    padres[B.antebrazo] = -1;
    pos[B.antebrazo * 3] = _p.x - _v.x;
    pos[B.antebrazo * 3 + 1] = _p.y - _v.y;
    pos[B.antebrazo * 3 + 2] = _p.z - _v.z;
    pos[B.mano * 3] = pm[0] - pa[0];
    pos[B.mano * 3 + 1] = pm[1] - pa[1];
    pos[B.mano * 3 + 2] = pm[2] - pa[2];
    for (const h of B.hijos) {
      const p = padres[h];
      _q.set(absRot[p * 4], absRot[p * 4 + 1], absRot[p * 4 + 2], absRot[p * 4 + 3]).multiply(_qa.set(rot[h * 4], rot[h * 4 + 1], rot[h * 4 + 2], rot[h * 4 + 3]));
      absRot[h * 4] = _q.x;
      absRot[h * 4 + 1] = _q.y;
      absRot[h * 4 + 2] = _q.z;
      absRot[h * 4 + 3] = _q.w;
    }
  }
  const _S = new THREE.Vector3, _W = new THREE.Vector3, _E = new THREE.Vector3, _d = new THREE.Vector3, _pol = new THREE.Vector3;
  const _a = new THREE.Vector3, _b = new THREE.Vector3, _qf = new THREE.Quaternion, _qb = new THREE.Quaternion, _qr = new THREE.Quaternion;
  const largo = (i, j) => {
    const a = bindPos(i), b = bindPos(j);
    return Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  };
  function brazoIK(l) {
    const B = BRAZOS[l], {absRot: absRot, absPos: absPos, pos: pos} = pose;
    const iA = B.antebrazo, iM = B.mano, iB = B.brazo;
    _S.set(absPos[iB * 3], absPos[iB * 3 + 1], absPos[iB * 3 + 2]);
    _W.set(absPos[iM * 3], absPos[iM * 3 + 1], absPos[iM * 3 + 2]);
    _qf.set(absRot[iA * 4], absRot[iA * 4 + 1], absRot[iA * 4 + 2], absRot[iA * 4 + 3]);
    _a.set(pos[iM * 3], pos[iM * 3 + 1], pos[iM * 3 + 2]);
    const L2 = _a.length(), L1 = largo(iB, iA);
    if (L1 < .001 || L2 < .001) return;
    _d.subVectors(_W, _S);
    const d = _d.length();
    if (d < .001) return;
    _d.divideScalar(d);
    _pol.set(B.signo * .5, 1, -.45).normalize();
    _pol.addScaledVector(_d, -_pol.dot(_d));
    if (_pol.lengthSq() < 1e-6) _pol.set(0, 1, 0);
    _pol.normalize();
    if (d >= L1 + L2) _E.copy(_S).addScaledVector(_d, L1); else {
      const dd = Math.max(d, Math.abs(L1 - L2) + .001);
      const c = (L1 * L1 + dd * dd - L2 * L2) / (2 * L1 * dd), sn = Math.sqrt(Math.max(0, 1 - c * c));
      _E.copy(_S).addScaledVector(_d, L1 * c).addScaledVector(_pol, L1 * sn);
    }
    _b.copy(_a).applyQuaternion(_qf).normalize();
    _qr.setFromUnitVectors(_b, _d.subVectors(_W, _E).normalize());
    _qf.premultiply(_qr);
    absRot[iA * 4] = _qf.x;
    absRot[iA * 4 + 1] = _qf.y;
    absRot[iA * 4 + 2] = _qf.z;
    absRot[iA * 4 + 3] = _qf.w;
    const k = _W.distanceTo(_E) / L2;
    pos[iA * 3] = _E.x;
    pos[iA * 3 + 1] = _E.y;
    pos[iA * 3 + 2] = _E.z;
    pos[iM * 3] *= k;
    pos[iM * 3 + 1] *= k;
    pos[iM * 3 + 2] *= k;
    _qb.set(absRot[iB * 4], absRot[iB * 4 + 1], absRot[iB * 4 + 2], absRot[iB * 4 + 3]);
    const pa = bindPos(iB), pe = bindPos(iA);
    _b.set(pe[0] - pa[0], pe[1] - pa[1], pe[2] - pa[2]).applyQuaternion(_qb).normalize();
    _qr.setFromUnitVectors(_b, _d.subVectors(_E, _S).normalize());
    _qb.premultiply(_qr);
    absRot[iB * 4] = _qb.x;
    absRot[iB * 4 + 1] = _qb.y;
    absRot[iB * 4 + 2] = _qb.z;
    absRot[iB * 4 + 3] = _qb.w;
  }
  const ARMA_CADENA = [ 14, 15, 16, 25 ];
  const refArma = new Map;
  const poseRef = crearPose(esq);
  const Q = (a, i) => new THREE.Quaternion(a[i * 4], a[i * 4 + 1], a[i * 4 + 2], a[i * 4 + 3]);
  const V3 = (a, i) => new THREE.Vector3(a[i * 3], a[i * 3 + 1], a[i * 3 + 2]);
  function referencia(k) {
    if (refArma.has(k)) return refArma.get(k);
    let r = null;
    try {
      const f = datos?.proceso?.(30, k), anim = f && animador.anims[f.anim];
      if (anim) {
        evaluar(esq, anim, 0, poseRef, {
          ik: false,
          enElLugar: true
        });
        const pistas25 = anim.pistas.filter(p => p.hueso === 25).map(p => p.clase);
        const fp = pistas25.includes("pos") && !pistas25.includes("rot") ? datos?.proceso?.(28, k) : null, prep = fp && animador.anims[fp.anim];
        if (prep) {
          const pp = crearPose(esq);
          evaluar(esq, prep, prep.duracion, pp, {
            ik: false,
            enElLugar: true
          });
          poseRef.rot.set(pp.rot.subarray(100, 104), 100);
          componer(esq, poseRef);
        }
        if (poseRef.padres[25] === 16 && poseRef.padres[16] === 15 && poseRef.padres[15] === 14) {
          const a14 = Q(poseRef.absRot, 14), i14 = a14.clone().invert(), p14 = V3(poseRef.absPos, 14);
          r = {
            anim: f.anim,
            rel: {},
            local: {}
          };
          for (const h of ARMA_CADENA) r.rel[h] = i14.clone().multiply(Q(poseRef.absRot, h));
          r.d25 = V3(poseRef.absPos, 25).sub(p14).applyQuaternion(i14);
          const i16 = Q(poseRef.absRot, 16).invert();
          r.L = i16.clone().multiply(Q(poseRef.absRot, 25));
          r.G = V3(poseRef.absPos, 25).sub(V3(poseRef.absPos, 15)).applyQuaternion(i16);
          for (const h of [ 15, 16, 25 ]) r.local[h] = V3(poseRef.pos, h);
          const i25 = Q(poseRef.absRot, 25).invert(), p25 = V3(poseRef.absPos, 25);
          r.izq = {
            q: i25.clone().multiply(Q(poseRef.absRot, 20)),
            p: V3(poseRef.absPos, 20).sub(p25).applyQuaternion(i25),
            dist: V3(poseRef.absPos, 20).distanceTo(p25)
          };
          r.dosManos = r.izq.dist < DOS_MANOS || DOS_MANOS_LARGAS.has(k);
        }
      }
    } catch (e) {
      console.warn("[cuerpo VR] pose del arma", k, e);
    }
    refArma.set(k, r);
    return r;
  }
  const _M = new THREE.Matrix4, _q25 = new THREE.Quaternion, _p25 = new THREE.Vector3, _s = new THREE.Vector3, _q14 = new THREE.Quaternion;
  function manoConArma(l, ref, obj) {
    const B = BRAZOS[l];
    const juego = pj.contenedor;
    juego.updateWorldMatrix(true, false);
    obj.updateWorldMatrix(true, false);
    _M.copy(juego.matrixWorld).invert().multiply(obj.matrixWorld).decompose(_p25, _q25, _s);
    _q14.copy(_q25).multiply(ref.rel[25].clone().invert());
    const p14 = _p25.clone().sub(ref.d25.clone().applyQuaternion(_q14));
    const {absRot: absRot, pos: pos, padres: padres} = pose;
    for (const h of ARMA_CADENA) {
      const q = h === 14 ? _q14 : _q.copy(_q14).multiply(ref.rel[h]);
      absRot[h * 4] = q.x;
      absRot[h * 4 + 1] = q.y;
      absRot[h * 4 + 2] = q.z;
      absRot[h * 4 + 3] = q.w;
    }
    padres[B.antebrazo] = -1;
    pos[14 * 3] = p14.x;
    pos[14 * 3 + 1] = p14.y;
    pos[14 * 3 + 2] = p14.z;
    for (const h of [ 15, 16, 25 ]) {
      const v = ref.local[h];
      pos[h * 3] = v.x;
      pos[h * 3 + 1] = v.y;
      pos[h * 3 + 2] = v.z;
    }
  }
  const _q25b = new THREE.Quaternion, _p25b = new THREE.Vector3, _pw = new THREE.Vector3, _pg = new THREE.Vector3;
  function lugarIzq(ref) {
    const {absRot: absRot, absPos: absPos} = pose;
    _q25b.set(absRot[25 * 4], absRot[25 * 4 + 1], absRot[25 * 4 + 2], absRot[25 * 4 + 3]);
    _p25b.set(absPos[25 * 3], absPos[25 * 3 + 1], absPos[25 * 3 + 2]);
    return {
      q: _q25b.clone().multiply(ref.izq.q),
      p: ref.izq.p.clone().applyQuaternion(_q25b).add(_p25b)
    };
  }
  function manoIzqEnArma(L) {
    const B = BRAZOS.izq, {absRot: absRot, pos: pos, padres: padres} = pose;
    const pm = bindPos(B.mano), pa = bindPos(B.antebrazo);
    _v.set(pm[0] - pa[0], pm[1] - pa[1], pm[2] - pa[2]).applyQuaternion(L.q);
    for (const i of [ B.antebrazo, B.mano ]) {
      absRot[i * 4] = L.q.x;
      absRot[i * 4 + 1] = L.q.y;
      absRot[i * 4 + 2] = L.q.z;
      absRot[i * 4 + 3] = L.q.w;
    }
    padres[B.antebrazo] = -1;
    pos[B.antebrazo * 3] = L.p.x - _v.x;
    pos[B.antebrazo * 3 + 1] = L.p.y - _v.y;
    pos[B.antebrazo * 3 + 2] = L.p.z - _v.z;
    pos[B.mano * 3] = pm[0] - pa[0];
    pos[B.mano * 3 + 1] = pm[1] - pa[1];
    pos[B.mano * 3 + 2] = pm[2] - pa[2];
    for (const h of B.hijos) {
      const p = padres[h];
      _q.set(absRot[p * 4], absRot[p * 4 + 1], absRot[p * 4 + 2], absRot[p * 4 + 3]).multiply(_qa.set(pose.rot[h * 4], pose.rot[h * 4 + 1], pose.rot[h * 4 + 2], pose.rot[h * 4 + 3]));
      absRot[h * 4] = _q.x;
      absRot[h * 4 + 1] = _q.y;
      absRot[h * 4 + 2] = _q.z;
      absRot[h * 4 + 3] = _q.w;
    }
  }
  const _sJ = new THREE.Vector3, MEDIA_VUELTA_Z = (new THREE.Quaternion).setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI);
  function armaEnGrip(k, lado = "der", deMano = false) {
    if (lado !== "der" || k === 16 || k === 17) return null;
    const ref = referencia(k);
    if (!ref?.L) return null;
    const a = AJUSTE.der;
    const X = (new THREE.Quaternion).setFromEuler(new THREE.Euler(a[0], a[1], a[2])).multiply(MANO_A_GRIP.der).multiply(MANO_DESDE_HUESO.der);
    pj.contenedor.updateWorldMatrix(true, false);
    pj.contenedor.getWorldScale(_sJ);
    const q = X.clone().multiply(ref.L);
    const p = new THREE.Vector3(...MUNECA.der).add(ref.G.clone().applyQuaternion(X).multiplyScalar(Math.abs(_sJ.x) || .005));
    if (deMano) {
      q.premultiply(MEDIA_VUELTA_Z);
      p.applyQuaternion(MEDIA_VUELTA_Z);
    }
    return {
      q: q,
      p: p
    };
  }
  const estado = {
    manos: null,
    armaEnMano: null
  };
  function apretada(e) {
    if (!e) return false;
    if (e.tipo === "mano") return !!e.pellizco;
    const b = e.fuente?.gamepad?.buttons || [];
    return (b[1]?.value || 0) > .5 || (b[0]?.value || 0) > .5;
  }
  function actualizar({activo: si = false, manos: manos = null, arma: arma = 0, armaVista: armaVista = null} = {}) {
    const prueba = !!globalThis.window?.sh4?.cuerpoVRPrueba;
    si = si || prueba;
    ponerVisible(si);
    if (!si) return false;
    pj.grupo.visible = true;
    const grips = {}, est = {};
    for (const e of manos?.estados || []) if (e.conectado && e.lado && (e.tipo === "control" || e.tipo === "mano")) {
      grips[e.lado] = e.grip;
      est[e.lado] = e;
    }
    const dom = manoDominante();
    const conArma = arma && datos?.esArma?.(arma) ? arma : 0;
    const der = conArma && dom === "der" ? manosDelJuego(datos, conArma, 2)[1] : apretada(est.der) ? MANO.DER_PUNO : MANO.DER_ABIERTA;
    let izq = conArma && dom === "izq" || apretada(est.izq) ? MANO.IZQ_CERRADA : MANO.IZQ_ABIERTA;
    if (!grips.der && !grips.izq) {
      manosHenry?.poner(izq, der);
      estado.manos = {
        izq: izq,
        der: der
      };
      return true;
    }
    const obj = armaVista?.modelo?.grupo, ref = conArma && dom === "der" && obj && armaVista.modelo.k === conArma && armaVista.montura?.parent ? referencia(conArma) : null;
    estado.armaEnMano = ref ? {
      arma: conArma,
      anim: ref.anim
    } : null;
    const guardados = {};
    for (const l of [ "der", "izq" ]) if (grips[l]) {
      guardados[l] = pose.padres[BRAZOS[l].antebrazo];
      if (l === "der" && ref) manoConArma(l, ref, obj); else manoAlGrip(l, grips[l]);
    }
    componer(esq, pose, {
      rotAbsolutas: true
    });
    estado.dosManos = false;
    estado.distIzq = null;
    if (ref?.dosManos && grips.izq && grips.der) {
      const L = lugarIzq(ref);
      const juego = pj.contenedor;
      juego.updateWorldMatrix(true, false);
      _pw.copy(L.p).applyMatrix4(juego.matrixWorld);
      grips.izq.updateWorldMatrix(true, false);
      _pg.setFromMatrixPosition(grips.izq.matrixWorld);
      const dist = _pw.distanceTo(_pg);
      estado.lugarIzq = _pw.toArray();
      estado.distIzq = +dist.toFixed(3);
      if (dist < AGARRE_IZQ) {
        manoIzqEnArma(L);
        izq = manosDelJuego(datos, conArma, 2)[0] ?? MANO.IZQ_CERRADA;
        estado.dosManos = true;
        componer(esq, pose, {
          rotAbsolutas: true
        });
      }
    }
    manosHenry?.poner(izq, der);
    estado.manos = {
      izq: izq,
      der: der
    };
    for (const l of Object.keys(guardados)) brazoIK(l);
    componer(esq, pose, {
      rotAbsolutas: true
    });
    for (const l of Object.keys(guardados)) pose.padres[BRAZOS[l].antebrazo] = guardados[l];
    pj.aplicar(pose);
    return true;
  }
  const MARGEN = Math.PI / 4, ACOMODAR = 3, ESPERA = 1.2;
  let rumboCuerpo = null, quietoDeCostado = 0;
  const vuelta = a => Math.atan2(Math.sin(a), Math.cos(a));
  function rumbo(dirVista, dt, dirMov) {
    const moviendo = !!dirMov;
    const plano = Math.hypot(dirVista.x, dirVista.z);
    const rv = plano > .25 ? Math.atan2(-dirVista.x, dirVista.z) : rumboCuerpo ?? 0;
    if (rumboCuerpo == null) rumboCuerpo = rv;
    let meta = rv;
    if (moviendo) {
      const rm = Math.atan2(-dirMov.x, dirMov.z);
      if (Math.abs(vuelta(rm - rv)) < 1.75) meta = rm;
    }
    let d = vuelta(meta - rumboCuerpo);
    if (!moviendo && Math.abs(d) > MARGEN) {
      rumboCuerpo = vuelta(rumboCuerpo + d - Math.sign(d) * MARGEN);
      d = Math.sign(d) * MARGEN;
    }
    quietoDeCostado = Math.abs(d) > .26 && !moviendo ? quietoDeCostado + dt : 0;
    if (moviendo || quietoDeCostado > ESPERA) {
      const paso = Math.min(Math.abs(d), (moviendo ? 2 * ACOMODAR : ACOMODAR) * dt);
      rumboCuerpo = vuelta(rumboCuerpo + Math.sign(d) * paso);
    }
    return rumboCuerpo;
  }
  const CUELLO_ATRAS = .12;
  function ubicar(ojosMundo, pisoY, dirVista, dt, dirMov = null) {
    const r = rumbo(dirVista, dt, dirMov);
    pj.grupo.position.set(ojosMundo.x + Math.sin(r) * CUELLO_ATRAS, pisoY, ojosMundo.z - Math.cos(r) * CUELLO_ATRAS);
    pj.grupo.rotation.y = -r;
    return r;
  }
  return {
    empujar: empujar,
    actualizar: actualizar,
    ubicar: ubicar,
    reiniciar() {
      rumboCuerpo = null;
      quietoDeCostado = 0;
    },
    get activo() {
      return activo;
    },
    estado: estado,
    armaEnGrip: armaEnGrip,
    referenciaArma: k => referencia(k)
  };
}
