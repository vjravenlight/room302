// SH4 web — FeniXVOID · Project Ravenlight
import * as THREE from "three";

const SIGNO_PALMA = -1;

const MIRA_MIN = .65;

const SOSTENER = .9;

const QUIETA = .03;

const SEGMENTOS = 32;

export function crearGestoPausa({M: M, activo: activo = () => true, accion: accion = "menu"}) {
  const geo = new THREE.RingGeometry(.032, .04, SEGMENTOS, 1, Math.PI / 2, Math.PI * 2);
  const mat = new THREE.MeshBasicMaterial({
    color: 16720916,
    transparent: true,
    opacity: .9,
    depthTest: false,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false
  });
  const anillo = new THREE.Mesh(geo, mat);
  anillo.name = "gesto de pausa";
  anillo.renderOrder = 998;
  anillo.frustumCulled = false;
  anillo.visible = false;
  M.escena.add(anillo);
  const estado = {
    t: 0,
    mira: 0,
    bloqueado: false,
    veces: 0
  };
  const _n = new THREE.Vector3, _c = new THREE.Vector3, _w = new THREE.Vector3, _q = new THREE.Quaternion;
  const _p = new THREE.Vector3, _a = new THREE.Vector3, _b = new THREE.Vector3, inicio = new THREE.Vector3;
  function cortar() {
    estado.t = 0;
    if (anillo.visible) {
      anillo.visible = false;
      return true;
    }
    return false;
  }
  const tarea = dt => {
    if (!M.enVR() || !activo()) {
      estado.bloqueado = false;
      return cortar();
    }
    const dom = M.opciones?.().manoVR === "izq" ? "izq" : "der";
    const e = M.manos?.estados?.find(x => x.conectado && x.tipo === "mano" && x.lado !== dom);
    const J = e?.mano?.joints, w = J?.wrist, ta = J?.["thumb-tip"], ib = J?.["index-finger-tip"];
    if (!e || !w || !w.visible || !ta || !ib) {
      estado.bloqueado = false;
      return cortar();
    }
    if (!e.pellizco) {
      estado.bloqueado = false;
      return cortar();
    }
    if (estado.bloqueado) return cortar();
    w.updateMatrixWorld(true);
    _n.set(0, SIGNO_PALMA, 0).applyQuaternion(w.getWorldQuaternion(_q));
    M.camara.getWorldPosition(_c);
    _c.sub(w.getWorldPosition(_w)).normalize();
    estado.mira = +_n.dot(_c).toFixed(2);
    _p.copy(ta.getWorldPosition(_a)).add(ib.getWorldPosition(_b)).multiplyScalar(.5);
    if (estado.mira < MIRA_MIN) return cortar();
    if (estado.t === 0) inicio.copy(_p); else if (_p.distanceTo(inicio) > QUIETA) {
      estado.bloqueado = true;
      return cortar();
    }
    estado.t += dt;
    const k = Math.min(1, estado.t / SOSTENER);
    geo.setDrawRange(0, 6 * Math.max(1, Math.round(k * SEGMENTOS)));
    anillo.position.copy(_p);
    anillo.lookAt(M.camara.getWorldPosition(_c));
    anillo.visible = true;
    if (estado.t >= SOSTENER) {
      estado.bloqueado = true;
      estado.veces++;
      cortar();
      M.pulsar(accion);
    }
    return true;
  };
  M.tareas.add(tarea);
  return {
    estado: estado,
    parar() {
      M.tareas.delete(tarea);
      anillo.removeFromParent();
    }
  };
}
