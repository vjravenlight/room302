// SH4 web — FeniXVOID · Project Ravenlight
import * as THREE from "three";

const CUELLO = 10, CABEZA = 11;

const TOPE_GIRO = 1.3744469, TOPE_INCL = Math.PI / 4, ESCALA_INCL = .7275654;

const PASO_PESO = .05, SUAVE = .2;

const ADELANTE = new THREE.Vector3(0, 0, 1), QI = new THREE.Quaternion;

export function crearGiroCara() {
  return {
    prendido: false,
    punto: [ 0, 0, 0 ],
    peso: 0,
    anterior: null
  };
}

const _qn = new THREE.Quaternion, _qh = new THREE.Quaternion, _inv = new THREE.Quaternion, _q = new THREE.Quaternion;

const _r = new THREE.Quaternion, _qm = new THREE.Quaternion, _d = new THREE.Quaternion, _qa = new THREE.Quaternion, _v = new THREE.Vector3, _w = new THREE.Vector3;

export const girarCara = {
  modo: "reposo"
};

let REPOSO = null;

const repo = i => _r.set(REPOSO[i * 4], REPOSO[i * 4 + 1], REPOSO[i * 4 + 2], REPOSO[i * 4 + 3]);

const leerQ = (a, i, q) => {
  q.set(a[i * 4], a[i * 4 + 1], a[i * 4 + 2], a[i * 4 + 3]);
  const m = REPOSO ? girarCara.modo : "directo";
  if (m === "reposo") return q.multiply(repo(i).conjugate());
  if (m === "local") return q.premultiply(repo(i).conjugate());
  if (m === "conj") return q.conjugate();
  return q;
};

const escribirQ = (a, i, q) => {
  const m = REPOSO ? girarCara.modo : "directo";
  q = q.clone();
  if (m === "reposo") q.multiply(repo(i)); else if (m === "local") q.premultiply(repo(i)); else if (m === "conj") q.conjugate();
  a[i * 4] = q.x;
  a[i * 4 + 1] = q.y;
  a[i * 4 + 2] = q.z;
  a[i * 4 + 3] = q.w;
};

function limitar(v) {
  let giro = Math.atan2(v.x, v.z), topado = false;
  if (giro < -TOPE_GIRO) {
    giro = -TOPE_GIRO;
    topado = true;
  } else if (giro > TOPE_GIRO) {
    giro = TOPE_GIRO;
    topado = true;
  }
  let incl = 0;
  if (!topado) {
    incl = Math.asin(THREE.MathUtils.clamp(v.y, -1, 1));
    incl = THREE.MathUtils.clamp(incl, -TOPE_INCL, TOPE_INCL) * (TOPE_GIRO - Math.abs(giro)) * ESCALA_INCL;
  }
  return v.set(Math.sin(giro), Math.sin(incl), Math.cos(giro)).normalize();
}

export function aplicarGiroCara(estado, esq, pose, dt, componer) {
  if (pose.absRot.length < (CABEZA + 1) * 4 || pose.padres[CABEZA] !== CUELLO) return false;
  REPOSO = esq.bindAbsRot;
  const cuadros = Math.min(4, dt * 30);
  if (!estado.prendido && estado.peso <= 0) {
    estado.anterior = null;
    return false;
  }
  if (estado.prendido && !estado.anterior) estado.anterior = leerQ(pose.absRot, CABEZA, new THREE.Quaternion);
  estado.peso = THREE.MathUtils.clamp(estado.peso + (estado.prendido ? 1 : -1) * PASO_PESO * cuadros, 0, 1);
  leerQ(pose.absRot, CUELLO, _qn);
  leerQ(pose.absRot, CABEZA, _qh);
  _inv.copy(_qn).invert();
  const ant = estado.anterior || _qh;
  _v.copy(ADELANTE).applyQuaternion(ant).applyQuaternion(_inv);
  _qa.copy(_qn).multiply(_q.setFromUnitVectors(ADELANTE, limitar(_v)));
  const pa = pose.absPos;
  _w.set(estado.punto[0] - pa[CABEZA * 3], estado.punto[1] - pa[CABEZA * 3 + 1], estado.punto[2] - pa[CABEZA * 3 + 2]);
  if (_w.lengthSq() < 1e-6) return false;
  _w.normalize().applyQuaternion(_inv);
  _qm.copy(_qn).multiply(_q.setFromUnitVectors(ADELANTE, limitar(_w)));
  _q.copy(_qm).multiply(_d.copy(_qh).invert());
  _d.slerpQuaternions(QI, _q, estado.peso);
  _q.copy(_d).multiply(_qh);
  const nueva = _d.slerpQuaternions(_qa, _q, 1 - Math.pow(1 - SUAVE, cuadros));
  estado.anterior = (estado.anterior || new THREE.Quaternion).copy(nueva);
  const {absRot: absRot, rot: rot, padres: padres, orden: orden} = pose;
  escribirQ(absRot, CABEZA, nueva);
  const desc = new Uint8Array(padres.length);
  desc[CABEZA] = 1;
  for (let k = 0; k < orden.length; k++) {
    const i = orden[k], p = padres[i];
    if (i === CABEZA || p < 0 || !desc[p]) continue;
    desc[i] = 1;
    const pa = _q.set(absRot[p * 4], absRot[p * 4 + 1], absRot[p * 4 + 2], absRot[p * 4 + 3]);
    pa.multiply(_qa.set(rot[i * 4], rot[i * 4 + 1], rot[i * 4 + 2], rot[i * 4 + 3]));
    absRot[i * 4] = pa.x;
    absRot[i * 4 + 1] = pa.y;
    absRot[i * 4 + 2] = pa.z;
    absRot[i * 4 + 3] = pa.w;
  }
  componer(esq, pose, {
    rotAbsolutas: true
  });
  return true;
}
