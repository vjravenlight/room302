// SH4 web — FeniXVOID · Project Ravenlight
import * as THREE from "three";

import { componer } from "../lib/animacion.js";

export const CP = {
  ALTO_MANIJA: 30,
  TOL: 100,
  PASO_Y: 4,
  AIRE_MIN: 34,
  AIRE_BAJA: 8,
  AIRE_BAJA_A: 4,
  INTERP_AIRE: .3,
  INTERP_NORMAL: .2,
  PLANTA: .07,
  CUERPO: 6,
  ALCANCE: .98,
  ADELANTE: 100,
  PISO_ARRIBA: 200,
  PISO_ABAJO: 300,
  MIN_NY: .01,
  TOBILLOS: [ 7, 4 ],
  AIRE_A: [ 5, 18 ],
  APOYO_B: [ 6, 16 ]
};

const ANIM_CAMINA = 2, ANIM_COJEA = 6;

const LANDING = {
  NADA: 0,
  APOYO: 1,
  APOYO_A_AIRE: 2,
  AIRE: 3
};

const nuevoPie = () => ({
  dy: 0,
  dyAim: 0,
  landing: 0,
  step: 0,
  manija: -1,
  tobillo: -1,
  inicio: -1,
  ratioPlanta: 0,
  punto: [ 0, 0, 0 ],
  plano: [ 0, -1, 0 ],
  apoyado: 1,
  alturaPiso: 0,
  interp: 0,
  hosei: 0
});

const acercar = (de, a, paso) => Math.abs(de - a) >= paso ? de <= a ? de + paso : de - paso : a;

const _o = new THREE.Vector3, _abajo = new THREE.Vector3(0, -1, 0), _rayo = new THREE.Raycaster;

const _q = new THREE.Quaternion, _qt = new THREE.Quaternion, _qd = new THREE.Quaternion, _qi = new THREE.Quaternion;

const _vz = new THREE.Vector3, _vx = new THREE.Vector3;

export function crearPies({getColision: getColision, escala: escala = .005, minNy: minNy = CP.MIN_NY} = {}) {
  const A = nuevoPie(), B = nuevoPie();
  const est = {
    A: A,
    B: B,
    lado: 0,
    sono: 0
  };
  function piso(p, arriba = CP.PISO_ARRIBA, abajo = CP.PISO_ABAJO) {
    const col = getColision?.();
    if (!col) return null;
    _o.set(-p[0] * escala, (-p[1] + arriba) * escala, p[2] * escala);
    _rayo.set(_o, _abajo);
    _rayo.near = 0;
    _rayo.far = Math.max(1e-4, (arriba + abajo) * escala);
    const derivada = !!col.userData?.derivada;
    for (const h of _rayo.intersectObject(col, false)) {
      const n = h.face?.normal, ny = n?.y ?? 0;
      if (derivada ? Math.abs(ny) > .6 : ny > 0 && ny >= minNy) {
        return {
          y: -h.point.y / escala,
          n: [ -(n?.x ?? 0), -Math.abs(ny), n?.z ?? 0 ]
        };
      }
    }
    return null;
  }
  return {
    est: est,
    piso: piso,
    aplicar: a => aplicar(est, piso, a),
    pasos: () => pasos(est),
    reiniciar() {
      Object.assign(A, nuevoPie());
      Object.assign(B, nuevoPie());
    }
  };
}

function aplicar(est, piso, a) {
  const {esq: esq, pose: pose, cadenas: cadenas, pos: pos, rot: rot} = a;
  if (!pose || !cadenas?.length || a.fueraEscena) return false;
  const {A: A, B: B} = est;
  const cA = cadenas.find(c => c.tipo === 1 && c.efector === CP.TOBILLOS[0]), cB = cadenas.find(c => c.tipo === 1 && c.efector === CP.TOBILLOS[1]);
  if (!cA || !cB) return false;
  for (const [p, c] of [ [ A, cA ], [ B, cB ] ]) if (p.manija !== c.manija) {
    Object.assign(p, nuevoPie(), {
      manija: c.manija,
      tobillo: c.efector,
      inicio: c.inicio
    });
  }
  const cuadros = Math.max(.25, Math.min(4, a.cuadros ?? 1));
  if (a.animN !== ANIM_CAMINA && a.animN !== ANIM_COJEA) {
    if (A.landing) {
      A.landing = 0;
      A.step = 0;
    }
    if (B.landing) {
      B.landing = 0;
      B.step = 0;
    }
  } else {
    const f = a.cuadro;
    if (f < CP.APOYO_B[0] || f > CP.APOYO_B[1]) {
      if (B.landing !== LANDING.AIRE) {
        B.landing = LANDING.AIRE;
        B.step = 0;
      }
    } else if (B.landing !== LANDING.APOYO && B.landing !== LANDING.APOYO_A_AIRE) {
      B.landing = LANDING.APOYO;
      B.step = 0;
    }
    if (f < CP.AIRE_A[1] + 1 && f > CP.AIRE_A[0] - 1) {
      if (A.landing !== LANDING.AIRE) {
        A.landing = LANDING.AIRE;
        A.step = 0;
      }
    } else if (A.landing !== LANDING.APOYO && A.landing !== LANDING.APOYO_A_AIRE) {
      A.landing = LANDING.APOYO;
      A.step = 0;
    }
  }
  const cs = Math.cos(rot), sn = Math.sin(rot);
  const aMundo = l => [ pos[0] + l[0] * cs + l[2] * sn, pos[1] + l[1], pos[2] - l[0] * sn + l[2] * cs ];
  const aLocal = m => {
    const dx = m[0] - pos[0], dz = m[2] - pos[2];
    return [ dx * cs - dz * sn, m[1] - pos[1], dx * sn + dz * cs ];
  };
  const normalLocal = n => [ n[0] * cs - n[2] * sn, n[1], n[0] * sn + n[2] * cs ];
  const ctx = {
    ...a,
    cuadros: cuadros,
    piso: piso,
    aMundo: aMundo,
    aLocal: aLocal,
    normalLocal: normalLocal
  };
  let toco = false;
  for (const p of [ A, B ]) {
    const i = p.manija;
    const pre = [ pose.absPos[i * 3], pose.absPos[i * 3 + 1], pose.absPos[i * 3 + 2] ];
    const preM = aMundo(pre);
    if (p.landing === LANDING.APOYO) apoyado(p, preM, ctx); else if (p.landing === LANDING.AIRE) enElAire(p, preM, ctx); else normal(p, preM, ctx);
    planta(p, ctx);
    p.hosei = p.punto[1] - preM[1];
    const l = aLocal(p.punto);
    pose.pos[i * 3] = l[0];
    pose.pos[i * 3 + 1] = l[1];
    pose.pos[i * 3 + 2] = l[2];
    toco = true;
  }
  if (!a.vel) {
    const h = Math.max(-CP.CUERPO, Math.min(CP.CUERPO, Math.max(A.hosei, B.hosei)));
    const r = raiz(pose.padres);
    if (r >= 0 && h) pose.pos[r * 3 + 1] += h;
  }
  if (toco) componer(esq, pose, {
    rotAbsolutas: true,
    ik: [ cA, cB ]
  });
  return toco;
}

function raiz(padres) {
  for (let i = 0; i < padres.length; i++) if (padres[i] < 0) return i;
  return -1;
}

function fueraDeAlcance(p, punto, ctx) {
  const {pose: pose, aMundo: aMundo} = ctx, s = p.inicio, e = p.tobillo, m = pose.padres[e];
  if (s < 0 || m < 0) return false;
  const P = i => [ pose.absPos[i * 3], pose.absPos[i * 3 + 1], pose.absPos[i * 3 + 2] ];
  const S = P(s), M = P(m), E = P(e);
  const l1 = Math.hypot(M[0] - S[0], M[1] - S[1], M[2] - S[2]), l2 = Math.hypot(E[0] - M[0], E[1] - M[1], E[2] - M[2]);
  const sm = aMundo(S);
  return Math.hypot(punto[0] - sm[0], punto[1] - sm[1], punto[2] - sm[2]) > (l1 + l2) * CP.ALCANCE;
}

function apoyado(p, pre, ctx) {
  if (p.step === 0) {
    const q = [ pre[0], pre[1] + p.dy, pre[2] ];
    const g = ctx.piso(q);
    let h = g ? g.y - CP.ALTO_MANIJA : 1e9;
    if (g) p.plano = g.n;
    if (Math.abs(h - q[1]) > CP.TOL) h = ctx.pos[1] - CP.ALTO_MANIJA;
    p.punto = q;
    p.alturaPiso = h;
    p.step = 1;
  } else if (p.step !== 1) return;
  if (!fueraDeAlcance(p, p.punto, ctx)) {
    p.apoyado = 1;
    p.punto[1] = acercar(p.punto[1], p.alturaPiso, CP.PASO_Y * ctx.cuadros);
  } else if (p.landing !== LANDING.APOYO_A_AIRE) {
    p.landing = LANDING.APOYO_A_AIRE;
    p.step = 0;
  }
}

function enElAire(p, pre, ctx) {
  if (p.step === 0) {
    p.interp = 0;
    p.step = 1;
  } else if (p.step !== 1) return;
  p.apoyado = 0;
  p.interp = Math.min(1, p.interp + CP.INTERP_AIRE * ctx.cuadros);
  const d = ctx.dirMov || [ 0, 1 ], q = [ ctx.pos[0] + d[0] * CP.ADELANTE, ctx.pos[1], ctx.pos[2] + d[1] * CP.ADELANTE ];
  const gf = ctx.piso(q), frente = gf ? gf.y : ctx.pos[1];
  let dy = frente - ctx.pos[1];
  if (Math.abs(dy) <= CP.TOL) {
    if (dy > CP.AIRE_BAJA) dy = CP.AIRE_BAJA_A;
  } else dy = 0;
  const g = ctx.piso(pre);
  if (g) {
    const h = g.y - CP.AIRE_MIN - pre[1];
    if (h < dy) dy = h;
  }
  p.dyAim = dy;
  p.dy = acercar(p.dy, dy, CP.PASO_Y * ctx.cuadros);
  const meta = [ pre[0], pre[1] + p.dy, pre[2] ];
  mezclar(p, meta, p.interp);
}

function normal(p, pre, ctx) {
  if (p.step === 0) {
    p.dy = 0;
    p.interp = 0;
    p.step = 1;
  } else if (p.step !== 1) return;
  p.interp = Math.min(1, p.interp + CP.INTERP_NORMAL * ctx.cuadros);
  const g = ctx.piso(pre);
  let h = g ? g.y - CP.ALTO_MANIJA - pre[1] : 1e9;
  if (g) p.plano = g.n;
  if (Math.abs(h) <= CP.TOL) p.apoyado = h >= 1 ? 0 : 1; else {
    p.apoyado = 1;
    h = 0;
  }
  if (h > 0) h = 0;
  p.dy = acercar(p.dy, h, CP.PASO_Y * ctx.cuadros);
  mezclar(p, [ pre[0], pre[1] + p.dy, pre[2] ], p.interp);
}

function mezclar(p, meta, k) {
  if (!(p.punto[0] || p.punto[1] || p.punto[2])) k = 1;
  for (let i = 0; i < 3; i++) p.punto[i] += (meta[i] - p.punto[i]) * k;
}

function planta(p, ctx) {
  const {pose: pose} = ctx, i = p.tobillo;
  if (i < 0) return;
  _q.set(pose.absRot[i * 4], pose.absRot[i * 4 + 1], pose.absRot[i * 4 + 2], pose.absRot[i * 4 + 3]);
  if (!p.apoyado) {
    _qd.identity();
    p.ratioPlanta = Math.max(0, p.ratioPlanta - CP.PLANTA * ctx.cuadros);
  } else {
    const n = ctx.normalLocal(p.plano);
    _vz.set(0, 0, 1).applyQuaternion(_q);
    _vx.set(1, 0, 0).applyQuaternion(_q);
    const c = Math.max(-1, Math.min(1, _vz.x * n[0] + _vz.y * n[1] + _vz.z * n[2]));
    const ang = Math.atan2(Math.sqrt(Math.max(0, 1 - c * c)), c) - Math.PI / 2;
    _qd.setFromAxisAngle(_vx, ang);
    p.ratioPlanta = Math.min(1, p.ratioPlanta + CP.PLANTA * ctx.cuadros);
  }
  if (p.ratioPlanta <= 0) return;
  _qi.identity();
  _qt.slerpQuaternions(_qi, _qd, p.ratioPlanta);
  _q.premultiply(_qt);
  pose.absRot[i * 4] = _q.x;
  pose.absRot[i * 4 + 1] = _q.y;
  pose.absRot[i * 4 + 2] = _q.z;
  pose.absRot[i * 4 + 3] = _q.w;
  for (let k = 0; k < pose.padres.length; k++) if (pose.padres[k] === i) {
    _qi.set(pose.absRot[k * 4], pose.absRot[k * 4 + 1], pose.absRot[k * 4 + 2], pose.absRot[k * 4 + 3]).premultiply(_qt);
    pose.absRot[k * 4] = _qi.x;
    pose.absRot[k * 4 + 1] = _qi.y;
    pose.absRot[k * 4 + 2] = _qi.z;
    pose.absRot[k * 4 + 3] = _qi.w;
  }
}

function pasos(est) {
  const on = [ est.A.apoyado, est.B.apoyado ];
  if (est.sono) {
    if (on[est.lado]) return false;
    est.lado ^= 1;
    est.sono = 0;
    return false;
  }
  if (on[est.lado]) {
    est.sono = 1;
    return true;
  }
  return false;
}
