// SH4 web — FeniXVOID · Project Ravenlight
export const HUESO_CABEZA = 11;

const ESCALA = .005;

export function prepararOjos(THREE, bind, padres) {
  const h = HUESO_CABEZA;
  if (!bind || bind.length <= h) return null;
  const pc = new THREE.Vector3, qc = new THREE.Quaternion, sc = new THREE.Vector3;
  bind[h].decompose(pc, qc, sc);
  const ojos = [ 29, 31 ].filter(i => i < bind.length && padres?.[i] === h).map(i => (new THREE.Vector3).setFromMatrixPosition(bind[i]));
  const pOjo = ojos.length === 2 ? ojos[0].add(ojos[1]).multiplyScalar(.5) : pc.clone().add(new THREE.Vector3(0, -16, 16));
  return {
    local: pOjo.applyMatrix4(bind[h].clone().invert()),
    qBindInv: qc.invert()
  };
}

const _t = {};

function tmp(THREE) {
  if (!_t.p) Object.assign(_t, {
    p: new THREE.Vector3,
    q: new THREE.Quaternion,
    s: new THREE.Vector3,
    f: new THREE.Vector3,
    u: new THREE.Vector3,
    m: new THREE.Matrix4,
    o: new THREE.Vector3
  });
  return _t;
}

export function poseOjos(THREE, ojo, matrizCabeza, outPos, outQuat) {
  const T = tmp(THREE);
  outPos.copy(ojo.local).applyMatrix4(matrizCabeza);
  outPos.set(-outPos.x * ESCALA, -outPos.y * ESCALA, outPos.z * ESCALA);
  matrizCabeza.decompose(T.p, T.q, T.s);
  T.q.multiply(ojo.qBindInv);
  T.f.set(0, 0, 1).applyQuaternion(T.q);
  T.u.set(0, -1, 0).applyQuaternion(T.q);
  T.f.set(-T.f.x, -T.f.y, T.f.z);
  T.u.set(-T.u.x, -T.u.y, T.u.z);
  T.m.lookAt(T.o.set(0, 0, 0), T.f, T.u);
  return outQuat.setFromRotationMatrix(T.m);
}

export function crearSuavizado(THREE) {
  const p = new THREE.Vector3, q = new THREE.Quaternion;
  let listo = false;
  return {
    p: p,
    q: q,
    reiniciar() {
      listo = false;
    },
    paso(pos, quat, dt) {
      if (!listo || dt < 0 || dt > .25 || p.distanceTo(pos) > .5) {
        p.copy(pos);
        q.copy(quat);
        listo = true;
        return true;
      }
      if (dt === 0) return false;
      p.lerp(pos, 1 - Math.exp(-dt * 14));
      q.slerp(quat, 1 - Math.exp(-dt * 8));
      return false;
    }
  };
}

export function rumbo(THREE, quat) {
  const T = tmp(THREE);
  T.f.set(0, 0, -1).applyQuaternion(quat);
  T.u.set(0, 1, 0).applyQuaternion(quat);
  const hx = T.u.y * T.f.x - T.f.y * T.u.x, hz = T.u.y * T.f.z - T.f.y * T.u.z;
  return Math.atan2(-hx, -hz);
}

export function inclinacion(THREE, quat) {
  const T = tmp(THREE);
  T.f.set(0, 0, -1).applyQuaternion(quat);
  return Math.asin(Math.max(-1, Math.min(1, T.f.y)));
}

export function ubicarRig(THREE, rig, base, pos, quat, {soloGiro: soloGiro = false, y: y = null} = {}) {
  const T = tmp(THREE);
  if (soloGiro) {
    const a = rumbo(THREE, quat) - rumbo(THREE, base.q);
    rig.quaternion.setFromAxisAngle(T.u.set(0, 1, 0), a);
  } else rig.quaternion.copy(quat).multiply(T.q.copy(base.q).invert());
  T.p.copy(base.p).applyQuaternion(rig.quaternion);
  rig.position.set(pos.x - T.p.x, y ?? pos.y - T.p.y, pos.z - T.p.z);
  rig.updateMatrixWorld(true);
}
