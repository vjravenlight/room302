// SH4 web — FeniXVOID · Project Ravenlight
import { MotorCamara, areaCercana, wrap, v3, sum, res, esc, pp, norm, largo, largoXZ, anguloXZ, PI } from "./motor.js";

export const NOMBRES_MODO = [ "quieta", "persecución", "ángulo limitado / riel", "circular", "riel circular" ];

export function decodificarArg(a) {
  const m = a.CamMvArg || [];
  const cap = o => ({
    p0: m.slice(o, o + 3),
    p1: m.slice(o + 3, o + 6),
    radio: m[o + 6],
    cilindro: m[o + 7] !== 0
  });
  switch (a.CamMvType) {
   case 1:
    return {
      mover: cap(0),
      watchY: m[8],
      orgX: m[9],
      orgY: m[10],
      radioCirculo: m[11],
      adelante: m[12],
      player2CamY: m[13]
    };

   case 2:
    return {
      mover: cap(0),
      watch2cam: m.slice(8, 11),
      watchY: m[11],
      orgX: m[12],
      orgY: m[13],
      anchoX: m[14],
      anchoY: m[15],
      rateX: m[16],
      rateY: m[17],
      l2: m[18]
    };

   case 3:
    return {
      centro: [ m[0], m[1] ],
      radio: m[2],
      arco: m[3],
      modoY: m[4],
      camY: m[5],
      watchY: m[6],
      orgX: m[7],
      watchOfs: m[8]
    };

   case 4:
    return {
      rielCentro: m.slice(0, 3),
      mkPos: m.slice(4, 7),
      orgChar: m[8],
      orgRiel: m[9],
      rate: m[10],
      rielRadio: m[11],
      zoom: m[12],
      watchY: m[13]
    };

   default:
    return {
      usarLimite: m[0]
    };
  }
}

function transformarRef(src, r) {
  const c = Math.cos(r.RotAngY), s = Math.sin(r.RotAngY);
  let fx = [ c, 0, -s ], fz = [ s, 0, c ];
  const fy = [ 0, 1, 0 ];
  if (r.NegX) fx = esc(fx, -1);
  if (r.NegZ) fz = esc(fz, -1);
  const rot = v => sum(sum(esc(fx, v[0]), esc(fy, v[1])), esc(fz, v[2]));
  const tras = sum(r.AfterRotAddXYZ, rot(esc(r.SrcRotCenterXYZ, -1)));
  const punto = v => sum(rot(v), tras);
  const ang = a => {
    a = wrap(a);
    if (r.NegX) a = -a;
    if (r.NegZ) {
      a = wrap(a - PI / 2);
      a = wrap(-a + PI / 2);
    }
    return wrap(a + r.RotAngY);
  };
  const a = JSON.parse(JSON.stringify(src)), m = a.CamMvArg;
  a.DriveArea.Pos0 = punto(src.DriveArea.Pos0);
  a.DriveArea.Pos1 = punto(src.DriveArea.Pos1);
  if (a.CamMvType === 1 || a.CamMvType === 2) {
    const p0 = punto(m.slice(0, 3)), p1 = punto(m.slice(3, 6));
    m.splice(0, 6, ...p0, ...p1);
  }
  if (a.CamMvType === 1) m[10] = ang(m[10]);
  if (a.CamMvType === 2) {
    const w = rot([ m[8], 0, m[10] ]);
    m[8] = w[0];
    m[10] = w[2];
    m[13] = ang(m[13]);
  }
  if (a.CamMvType === 3) {
    const w = rot([ m[0], 0, m[1] ]);
    m[0] = w[0];
    m[1] = w[2];
  }
  a.nombre = src.nombre + " (ref)";
  return a;
}

export function areasDeEscena(cam, areasRef) {
  if (!cam) return null;
  if (cam.tipo.startsWith("CSD_REFFER")) return cam.areas.map(r => areasRef[r.pSrcArea] && transformarRef(areasRef[r.pSrcArea], r)).filter(Boolean);
  if (cam.tipo.startsWith("CSD_DIRECT")) return cam.areas.map(a => JSON.parse(JSON.stringify(a)));
  return null;
}

export class CamaraOtroMundo {
  constructor() {
    this.motor = new MotorCamara;
    this.areas = null;
    this.area = null;
    this.dataNo = 0;
    this.moveRate = 0;
    this.saltos = 3;
    this.prevPos = null;
    this.chase = {
      player2CamY: -434,
      ang: 1.0996,
      timer: 0
    };
    this.lim = {
      timer: 0,
      l2Lado: 0
    };
    this.circ = {
      lado: 0
    };
    this.cmprx = {
      ang: 0
    };
    this.ultimoCorte = false;
  }
  iniciarEscena(areas, dflt) {
    this.areas = areas;
    this.dflt = dflt;
    this.area = null;
    this.saltos = 3;
    this.prevPos = null;
    this.moveRate = 0;
    this.motor.iniciarEtapa();
    this.chase = {
      player2CamY: -434,
      ang: 1.0996,
      timer: 0
    };
    this.motor.angulo = 1.0996;
    this.motor.hitRadio = 200;
    this.motor.techoKeep = 120;
    this.motor.pisoKeep = 200;
    this.lim = {
      timer: 0,
      l2Lado: 0
    };
    this.circ = {
      lado: 0
    };
    this.cmprx = {
      ang: 0
    };
  }
  elegirArea(ctrl) {
    const areas = this.areas;
    for (const a of areas) {
      const r = areaCercana(ctrl, a.DriveArea.Pos0, a.DriveArea.Pos1, a.DriveArea.Radius, a.DriveArea.CylinderMode !== 0);
      a.dist = r.dist;
      a.cercano = r.pos;
    }
    let cur = this.area && areas.includes(this.area) ? this.area : null;
    if (cur && cur.DataNo !== this.dataNo) cur = null;
    const usarNueva = (dN, pN, dM, pM) => dN >= dM ? pN > pM && dN <= 0 : !(pN < pM && dM <= 0);
    let mejor = null;
    for (const a of areas) {
      if (a === cur || a.DataNo !== this.dataNo || a.UseThisCheckFunc) continue;
      if (cur && cur.InhibitChgAreaBit & a.AreaBit) continue;
      if (!mejor || usarNueva(a.dist, a.AreaPriority, mejor.dist, mejor.AreaPriority)) mejor = a;
    }
    if (!cur) return mejor;
    if (mejor) {
      let d = cur.dist;
      if ((cur.ConvineCamMvAreaBit & mejor.AreaBit) === 0) d -= 80;
      if (mejor.dist < d) {
        if (cur.AreaPriority <= mejor.AreaPriority || d > 0) return mejor;
      } else if (cur.AreaPriority < mejor.AreaPriority && mejor.dist <= 0) return mejor;
    }
    return cur;
  }
  paso(dt, P, ent) {
    let f, g;
    if (P.rapidez >= 700 && !P.peleando) {
      f = dt * .6;
      g = (1 - this.moveRate) * .7 + .3;
    } else {
      f = dt * -3;
      g = this.moveRate * .9 + .1;
    }
    this.moveRate = Math.min(1, Math.max(0, g * f + this.moveRate));
    const ctrl = P.pos.slice();
    let corte = false;
    const previa = this.area;
    if (!this.areas) this.area = this.dflt; else {
      const lejos = this.prevPos ? largo(res(ctrl, this.prevPos)) : 1e9;
      let salto = this.saltos > 0 || lejos > 280;
      const nueva = this.elegirArea(ctrl);
      let cambiar = true;
      if (nueva === previa) {
        if (lejos <= 280) cambiar = false;
      } else {
        if (nueva) this.motor.hitRadio = nueva.ColideCamRadius;
        if (!previa || previa.JumpCamMvAreaBit & nueva?.AreaBit) salto = true;
      }
      this.area = nueva;
      if (cambiar && nueva) {
        corte = salto;
        this.cambioTipo(nueva, salto, P, ent);
      }
    }
    this.usadas = this.areas && this.area ? this.areas.filter(a => a === this.area || this.area.ConvineCamMvAreaBit & a.AreaBit) : [];
    const r = this.principal(this.area, P, ent, dt);
    this.prevPos = ctrl;
    if (this.saltos > 0) this.saltos--;
    this.ultimoCorte = corte || r.corte;
    return {
      ...r,
      area: this.area,
      corte: this.ultimoCorte
    };
  }
  cambioTipo(a, salto, P, ent) {
    const t = a.CamMvType;
    if (t === 1) {
      const d = decodificarArg(a);
      this.chase.ang = a.CamViewAng;
      this.motor.hitRadio = a.ColideCamRadius;
      this.chase.player2CamY = d.player2CamY;
      if (salto) this.chase.saltar = true;
    } else if (t === 2) {
      this.lim.salto = salto;
    } else if (t === 3) {
      this.circ.salto = salto;
    } else if (t === 4) {
      this.cmprx.salto = salto;
    } else {
      if (!decodificarArg(a).usarLimite) {
        this.motor.anchoX = this.motor.anchoY = 16 * PI;
        this.motor.rateX = this.motor.rateY = 1;
        this.motor.ajuste = null;
      }
      this.motor.techoKeep = this.motor.pisoKeep = -2e4;
    }
  }
  principal(a, P, ent, dt) {
    const t = a ? a.CamMvType : 1;
    if (t === 1) return this.chaseMain(a, P, ent, dt);
    if (t === 2) return this.limMain(a, P, ent, dt);
    if (t === 3) return this.circMain(a, P, ent, dt);
    if (t === 4) return this.cmprxMain(a, P, ent, dt);
    return {
      ...this.motor.paso(dt, ent),
      modo: 0
    };
  }
  adjViewAngRate() {
    return 1 - this.moveRate * .1111111;
  }
  ajusteZonas() {
    return (mov, pre, maxLen) => {
      const p = sum(pre, mov);
      let min = 2e7, mejor = null;
      for (const a of this.usadas || []) {
        if (a.CamMvType !== 1 && a.CamMvType !== 2) continue;
        const z = decodificarArg(a).mover, r = areaCercana(p, z.p0, z.p1, z.radio, z.cilindro);
        if (r.dist < 0) return mov;
        if (r.dist < min) {
          min = r.dist;
          mejor = r.pos;
        }
      }
      if (!mejor) return mov;
      let m = sum(mov, esc(norm(res(mejor, p)), min * .3));
      const l = largo(m);
      if (l > maxLen) m = esc(m, maxLen / l);
      return m;
    };
  }
  velocidadMax(est, P, dt, ref) {
    const sp = this.motor.spd, ls = largo(sp), dp = res(P.pos, ref), ld = largo(dp);
    if (P.vel[0] !== 0 || P.vel[2] !== 0 || ls > 260 || pp(sp, dp) < -.2 && ld < 360) {
      est.timer = .6;
      return 2e3;
    }
    est.timer -= dt;
    if (est.timer <= 0) {
      est.timer = 0;
      return 0;
    }
    return 2e3;
  }
  chaseMain(a, P, ent, dt) {
    const M = this.motor, d = a ? decodificarArg(a) : {
      watchY: -180,
      orgX: 0,
      orgY: 0,
      radioCirculo: 1e3,
      adelante: 200,
      mover: null
    };
    const watchY = a ? d.watchY : -180;
    M.orgX = a ? d.orgX : 0;
    M.orgY = a ? d.orgY : 0;
    M.anchoX = M.anchoY = 16 * PI;
    M.rateX = M.rateY = 1;
    M.ajuste = a ? this.ajusteZonas() : null;
    let corte = false, saltoPos = null;
    if (this.chase.saltar || ent.boton9Apretado) {
      this.chase.saltar = false;
      corte = true;
      const base = sum(P.pos, [ 0, this.chase.player2CamY, 0 ]);
      let atras = [ -Math.sin(P.ang), 0, -Math.cos(P.ang) ], largoLibre = 460;
      if (ent.rayo) {
        let mejor = -1;
        for (const g of [ 0, .5236, -.5236, 1.0472, -1.0472, 1.5708, -1.5708 ]) {
          const dir = [ -Math.sin(P.ang + g), 0, -Math.cos(P.ang + g) ], h = ent.rayo(base, dir, 460, true) ?? 460;
          if (h > mejor + 1) {
            mejor = h;
            atras = dir;
          }
          if (h >= 460 * .66) break;
        }
        largoLibre = Math.max(40, mejor);
      }
      let p = sum(base, esc(atras, largoLibre * .93));
      if (d.mover) p = areaCercana(p, d.mover.p0, d.mover.p1, d.mover.radio, d.mover.cilindro).pos;
      M.setCameraPosition(p, false);
      saltoPos = p;
    }
    M.pisoKeep = 300;
    M.angulo = this.chase.ang * this.adjViewAngRate();
    const cam = M.tgtReal, R = a ? d.radioCirculo : 1e3, F = a ? d.adelante : 200;
    let nuevo = cam.slice();
    if (saltoPos) nuevo = saltoPos; else if (R > 0) {
      const fr = [ Math.sin(P.ang), 0, Math.cos(P.ang) ];
      const k = (1 - Math.cos(wrap(P.ang - anguloXZ(res(P.pos, cam))))) * .5;
      const C1 = sum(sum(P.pos, esc(fr, k * F)), [ 0, this.chase.player2CamY, 0 ]);
      const C2 = sum(sum(P.pos, esc(fr, F)), [ 0, this.chase.player2CamY, 0 ]);
      const MAX = 2e3;
      let v = v3();
      const d1 = [ cam[0] - C2[0], 0, cam[2] - C2[2] ], l1 = largoXZ(d1), u1 = l1 > 0 ? esc(d1, 1 / l1) : v3();
      const d2 = [ C1[0] - cam[0], 0, C1[2] - cam[2] ], l2 = largoXZ(d2), u2 = l2 > 0 ? esc(d2, 1 / l2) : v3();
      const r1 = l1 / R, r2 = l2 / R;
      if (r2 > .9) v = sum(v, esc(u2, (r2 - .9) * MAX * 20));
      if (r1 < .6) v = sum(v, esc(u1, (.6 - r1) * MAX * 1.6666667));
      const quieto = res(C2, esc(fr, F)), d3 = largoXZ(res(cam, quieto));
      if (d3 < R * .3 && pp(u1, fr) < -.2) {
        const lim = P.peleando ? 120 : 80;
        v = esc(v, Math.min(.5, Math.max(0, (lim - d3) / (R * .3))));
      }
      const vy = (C2[1] - cam[1]) / dt;
      let ky = Math.max(Math.abs(vy) / MAX - .1, 0) * vy;
      ky = Math.max(-MAX, Math.min(MAX, ky));
      v[1] += ky;
      const lv = largo(v);
      if (lv > MAX) v = esc(v, MAX / lv);
      nuevo = sum(cam, esc(v, dt));
    }
    const dc = [ P.pos[0] - M.pos[0], 0, P.pos[2] - M.pos[2] ], dist = largoXZ(dc);
    let watch;
    if (dist !== 0) {
      const ac = Math.atan2(dc[0], dc[2]), s = P.rapidez;
      const k = Math.max((360 - dist) / 360, 0);
      const k2 = s <= 500 ? s > 200 ? (500 - s) * k / 300 : k : 0;
      const ang = wrap(wrap(P.ang) - wrap(ac)) * k2 + ac;
      watch = [ P.pos[0] + Math.sin(ang) * k2 * 200 + Math.sin(ac) * 200, P.pos[1] + watchY, P.pos[2] + Math.cos(ang) * k2 * 200 + Math.cos(ac) * 200 ];
    } else watch = [ P.pos[0] + Math.sin(P.ang) * 200, P.pos[1] + watchY, P.pos[2] + Math.cos(P.ang) * 200 ];
    M.maxSpd = this.velocidadMax(this.chase, P, dt, nuevo);
    const dcp = res(nuevo, P.pos), ldp = largo(dcp);
    const fwd = ldp > 0 ? (Math.sin(P.ang) * dcp[0] + Math.cos(P.ang) * dcp[2]) / ldp : 0;
    const f2 = (fwd + 1) * .5;
    M.accel = Math.max(1, (2e3 - ldp) * f2 * f2 * .001 + 1) * 1200;
    M.setCameraPosition(nuevo, true);
    M.setWatchPosition(watch, !corte);
    return {
      ...M.paso(dt, ent),
      modo: 1,
      watch: watch,
      corte: corte
    };
  }
  limMain(a, P, ent, dt) {
    const M = this.motor, d = decodificarArg(a);
    M.ajuste = this.ajusteZonas();
    M.accel = 960;
    M.techoKeep = M.pisoKeep = -2e4;
    M.hitRadio = a.ColideCamRadius;
    let orgY = d.orgY, vx = d.watch2cam[0], vz = d.watch2cam[2], ang = a.CamViewAng, salto = this.lim.salto || false;
    this.lim.salto = false;
    if (d.l2 === 0) {
      if (ent.boton9Apretado) salto = true;
    } else if (d.l2 === 1) {
      if (ent.boton9Apretado) this.lim.l2Lado ^= 1;
      if (this.lim.l2Lado) {
        orgY = wrap(d.orgY + PI);
        vx = -vx;
        vz = -vz;
      }
    } else if (d.l2 === 2) {
      if (ent.boton9) ang = a.CamViewAng * .5;
    } else if (d.l2 === 3) {
      if (ent.boton9) {
        ang = a.CamViewAng * .8;
        vx *= .5;
        vz *= .5;
      }
    }
    M.orgX = d.orgX;
    M.orgY = orgY;
    const watch = [ P.pos[0], P.pos[1] + d.watchY, P.pos[2] ];
    let camT = [ watch[0] + vx, watch[1] + d.watch2cam[1], watch[2] + vz ];
    M.angulo = ang * this.adjViewAngRate();
    M.anchoX = d.anchoX;
    M.anchoY = d.anchoY;
    M.rateX = d.rateX;
    M.rateY = d.rateY;
    M.maxSpd = this.velocidadMax(this.lim, P, dt, camT);
    camT = areaCercana(camT, d.mover.p0, d.mover.p1, d.mover.radio, d.mover.cilindro).pos;
    M.setCameraPosition(camT, !salto);
    M.setWatchPosition(watch, !salto);
    return {
      ...M.paso(dt, ent),
      modo: 2,
      watch: watch,
      corte: salto
    };
  }
  circMain(a, P, ent, dt) {
    const M = this.motor, d = decodificarArg(a);
    let salto = this.circ.salto || false;
    this.circ.salto = false;
    if (ent.boton9Apretado) {
      salto = true;
      this.circ.lado ^= 1;
    }
    M.ajuste = null;
    M.maxSpd = 2e3;
    M.accel = 1200;
    M.techoKeep = M.pisoKeep = -2e4;
    M.anchoX = M.anchoY = 16 * PI;
    M.rateX = M.rateY = 1;
    M.angulo = a.CamViewAng;
    M.hitRadio = a.ColideCamRadius;
    const c = [ d.centro[0], 0, d.centro[1] ];
    const dir = norm([ c[0] - P.pos[0], 0, c[2] - P.pos[2] ]);
    const watch = sum(sum(P.pos, esc(dir, d.watchOfs)), [ 0, d.watchY, 0 ]);
    const ap = Math.atan2(P.pos[0] - c[0], P.pos[2] - c[2]);
    const an = this.circ.lado ? ap + d.arco / d.radio : ap - d.arco / d.radio;
    const modoY = Math.round(d.modoY);
    const cam = [ c[0] + Math.sin(an) * d.radio, modoY === 1 ? d.camY : P.pos[1] + d.camY, c[2] + Math.cos(an) * d.radio ];
    M.orgX = d.orgX;
    M.orgY = Math.atan2(watch[0] - cam[0], watch[2] - cam[2]);
    M.setCameraPosition(cam, !salto);
    M.setWatchPosition(watch, !salto);
    return {
      ...M.paso(dt, ent),
      modo: 3,
      watch: watch,
      corte: salto
    };
  }
  cmprxMain(a, P, ent, dt) {
    const M = this.motor, d = decodificarArg(a);
    const salto = this.cmprx.salto || false;
    this.cmprx.salto = false;
    const ahora = M.tgtReal.slice();
    M.ajuste = null;
    M.maxSpd = 2e3;
    M.accel = 1200;
    M.techoKeep = M.pisoKeep = -2e4;
    M.orgX = 0;
    M.orgY = 0;
    M.anchoX = M.anchoY = 16 * PI;
    M.rateX = M.rateY = 1;
    M.hitRadio = a.ColideCamRadius;
    const an = wrap(Math.atan2(P.pos[0] - d.mkPos[0], P.pos[2] - d.mkPos[2]) - d.orgChar) * d.rate + d.orgRiel;
    const cam = [ d.rielCentro[0] + Math.sin(an) * d.rielRadio, d.rielCentro[1], d.rielCentro[2] + Math.cos(an) * d.rielRadio ];
    const watch = [ P.pos[0], P.pos[1] + d.watchY, P.pos[2] ];
    if (P.peleando) {
      watch[0] += Math.sin(P.ang) * 300;
      watch[2] += Math.cos(P.ang) * 300;
    }
    const ref = salto ? cam : ahora, dist = largo(res(watch, ref));
    let k = dist <= d.zoom ? 1 : (d.zoom / dist - 1) * .85 + 1;
    let ang = Math.min(k * a.CamViewAng, 1.3962635);
    if (!salto) {
      const paso = dt * .8726646, df = ang - this.cmprx.ang;
      if (df > paso) ang = this.cmprx.ang + paso; else if (df < -paso) ang = this.cmprx.ang - paso;
    }
    this.cmprx.ang = ang;
    M.angulo = ang;
    M.setCameraPosition(cam, !salto);
    M.setWatchPosition(watch, !salto);
    return {
      ...M.paso(dt, ent),
      modo: 4,
      watch: watch,
      corte: salto
    };
  }
}
