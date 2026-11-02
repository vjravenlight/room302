// SH4 web — FeniXVOID · Project Ravenlight
import { crearPose, evaluar, componer, FPS } from "../lib/animacion.js";

function slerp(a, ia, b, ib, t, out, io) {
  let ax = a[ia], ay = a[ia + 1], az = a[ia + 2], aw = a[ia + 3];
  let bx = b[ib], by = b[ib + 1], bz = b[ib + 2], bw = b[ib + 3];
  let c = ax * bx + ay * by + az * bz + aw * bw;
  if (c < 0) {
    c = -c;
    bx = -bx;
    by = -by;
    bz = -bz;
    bw = -bw;
  }
  let k0 = 1 - t, k1 = t;
  if (c < .9995) {
    const th = Math.acos(c), s = Math.sin(th);
    k0 = Math.sin((1 - t) * th) / s;
    k1 = Math.sin(t * th) / s;
  }
  const x = ax * k0 + bx * k1, y = ay * k0 + by * k1, z = az * k0 + bz * k1, w = aw * k0 + bw * k1;
  const l = Math.hypot(x, y, z, w) || 1;
  out[io] = x / l;
  out[io + 1] = y / l;
  out[io + 2] = z / l;
  out[io + 3] = w / l;
}

function mezclarEn(a, b, t) {
  const n = a.rot.length / 4;
  for (let i = 0; i < n; i++) slerp(a.rot, i * 4, b.rot, i * 4, t, a.rot, i * 4);
  for (let i = 0; i < a.pos.length; i++) {
    a.pos[i] += (b.pos[i] - a.pos[i]) * t;
    a.esc[i] += (b.esc[i] - a.esc[i]) * t;
  }
}

function copiarLocal(de, a) {
  a.rot.set(de.rot);
  a.pos.set(de.pos);
  a.esc.set(de.esc);
  a.padres.set(de.padres);
}

const SOLO_LUGAR = new WeakMap;

function soloLugar(anim, h) {
  let m = SOLO_LUGAR.get(anim);
  if (!m) {
    m = new Map;
    SOLO_LUGAR.set(anim, m);
  }
  if (!m.has(h)) {
    const c = anim.pistas.filter(p => p.hueso === h).map(p => p.clase);
    m.set(h, c.includes("pos") && !c.includes("rot"));
  }
  return m.get(h);
}

export class Animador {
  constructor(pj, anims, {conservarGiro: conservarGiro = []} = {}) {
    this.pj = pj;
    this.esq = pj.esq;
    this.anims = anims;
    this.conservarGiro = conservarGiro;
    this.giroPrevio = new Float32Array(conservarGiro.length * 4);
    this.pose = crearPose(this.esq);
    this.pb = crearPose(this.esq);
    this.pc = crearPose(this.esq);
    this.anterior = crearPose(this.esq);
    this.capa = null;
    this.fundido = 0;
    this.fundidoTotal = 0;
    this.ik = true;
  }
  get actual() {
    return this.capa?.n ?? -1;
  }
  get t() {
    return this.capa?.t ?? 0;
  }
  get duracion() {
    return this.capa ? this.anims[this.capa.n].duracion : 0;
  }
  get segundos() {
    return this.t / FPS;
  }
  get terminada() {
    const c = this.capa;
    return !!c && !c.loop && c.t >= this.anims[c.n].duracion;
  }
  get proporcion() {
    const c = this.capa;
    return c ? Math.min(1, c.t / Math.max(1, this.anims[c.n].duracion)) : 1;
  }
  poner(n, {mezcla: mezcla = .33, loop: loop = null, vel: vel = 1, desde: desde = 0, forzar: forzar = false, sub: sub = null} = {}) {
    const a = this.anims[n];
    if (!a) return;
    if (!forzar && this.capa?.n === n) {
      this.capa.vel = vel;
      if (sub) this.capa.sub = sub; else this.capa.sub = null;
      return;
    }
    if (this.capa && mezcla > 0) {
      copiarLocal(this.pose, this.anterior);
      this.fundido = this.fundidoTotal = mezcla;
    } else this.fundido = 0;
    this.capa = {
      n: n,
      t: desde,
      vel: vel,
      loop: loop ?? a.loop,
      sub: sub
    };
  }
  ponerSub(n, sub, ratio, opciones = {}) {
    this.poner(n, {
      ...opciones,
      sub: {
        n: sub,
        ratio: ratio
      }
    });
    if (this.capa) this.capa.sub = {
      n: sub,
      ratio: ratio
    };
  }
  actualizar(dt) {
    const c = this.capa;
    if (!c) return null;
    const a = this.anims[c.n], dur = Math.max(1, a.duracion);
    c.t += dt * FPS * c.vel;
    if (c.loop) c.t %= dur; else if (c.t > dur) c.t = dur;
    const G = this.conservarGiro, gp = this.giroPrevio;
    for (let j = 0; j < G.length; j++) gp.set(this.pose.rot.subarray(G[j] * 4, G[j] * 4 + 4), j * 4);
    const conservar = (pose, anim) => {
      for (let j = 0; j < G.length; j++) {
        const q = gp.subarray(j * 4, j * 4 + 4);
        if (soloLugar(anim, G[j]) && Math.hypot(q[0], q[1], q[2], q[3]) > .5) pose.rot.set(q, G[j] * 4);
      }
    };
    evaluar(this.esq, a, c.t, this.pose, {
      ik: false,
      enElLugar: true,
      loop: c.loop
    });
    conservar(this.pose, a);
    let ik = a.ik;
    if (c.sub && c.sub.ratio > 0) {
      const b = this.anims[c.sub.n];
      const tb = c.t / dur * Math.max(1, b.duracion);
      evaluar(this.esq, b, tb, this.pb, {
        ik: false,
        enElLugar: true,
        loop: true
      });
      conservar(this.pb, b);
      mezclarEn(this.pose, this.pb, Math.min(1, c.sub.ratio));
      if (c.sub.ratio >= .5) ik = b.ik;
    }
    if (this.fundido > 0) {
      this.fundido = Math.max(0, this.fundido - dt);
      const k = this.fundidoTotal > 0 ? this.fundido / this.fundidoTotal : 0;
      copiarLocal(this.pose, this.pc);
      copiarLocal(this.anterior, this.pose);
      mezclarEn(this.pose, this.pc, 1 - k);
      this.pose.padres.set(this.pc.padres);
    }
    componer(this.esq, this.pose, {
      ik: this.ik ? ik : null
    });
    this.pj.aplicar(this.pose);
    return this.pose;
  }
}
