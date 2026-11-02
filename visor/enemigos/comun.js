// SH4 web — FeniXVOID · Project Ravenlight
import { crearPiso, PISO } from "../lib/colision.js";

export const FPS = 30;

export const DT = 1 / FPS;

export const PI = Math.PI;

export function envolver(a) {
  return Math.atan2(Math.sin(a), Math.cos(a));
}

export function rumboHacia(a, b) {
  return Math.atan2(a[0] - b[0], a[2] - b[2]);
}

export function frente(r, largo = 1) {
  return [ Math.sin(r) * largo, 0, Math.cos(r) * largo ];
}

export function dist3(a, b) {
  const x = a[0] - b[0], y = a[1] - b[1], z = a[2] - b[2];
  return Math.sqrt(x * x + y * y + z * z);
}

export function distXZ(a, b) {
  const x = a[0] - b[0], z = a[2] - b[2];
  return Math.sqrt(x * x + z * z);
}

export function girarY(v, r) {
  const c = Math.cos(r), s = Math.sin(r);
  return [ v[0] * c + v[2] * s, v[1], -v[0] * s + v[2] * c ];
}

export const azar = n => Math.floor(Math.random() * n);

export const azar01 = () => Math.min(.99, Math.random());

export class AnimEnemigo {
  constructor(pj, anims, nombres = []) {
    this.pj = pj;
    this.anims = anims;
    this.nombres = nombres;
    this.n = -1;
    this.t = 0;
    this.vel = 1;
    this.vuelta = false;
    this.fin = false;
    this.recien = false;
    pj.reproductor.enElLugar = true;
  }
  get anim() {
    return this.anims[this.n];
  }
  get dur() {
    return Math.max(1, this.anim?.duracion || 1);
  }
  get loop() {
    return !!this.anim?.loop;
  }
  get cuadro() {
    return Math.floor(this.t + 1e-6);
  }
  get nombre() {
    return this.nombres[this.n] || String(this.n);
  }
  poner(n, {vel: vel = 1, desde: desde = 0} = {}) {
    this.n = n;
    this.vel = vel;
    this.vuelta = false;
    this.fin = false;
    this.recien = true;
    this.t = desde < 0 ? this.dur + desde : desde;
  }
  velocidad(v) {
    this.vel = v;
  }
  avanzar() {
    this.recien = false;
    this.vuelta = false;
    if (this.n < 0) return;
    const d = this.dur;
    this.t += this.vel;
    if (this.loop) {
      if (this.t >= d) {
        this.t -= d;
        this.vuelta = true;
      }
      if (this.t < 0) {
        this.t += d;
        this.vuelta = true;
      }
    } else {
      if (this.t >= d) {
        this.t = d;
        this.fin = true;
      }
      if (this.t <= 0 && this.vel < 0) {
        this.t = 0;
        this.fin = true;
      }
    }
  }
  dibujar(alfa = 0) {
    if (this.n < 0) return;
    const r = this.pj.reproductor;
    if (r.anim !== this.anim) r.poner(this.anim);
    let t = this.t + (this.fin ? 0 : alfa * this.vel);
    if (this.loop) t = (t % this.dur + this.dur) % this.dur; else t = Math.max(0, Math.min(this.dur, t));
    r.t = t;
    r.loop = this.loop;
    this.pj.actualizar(0);
  }
}

export function avanceTabla(tabla, cuadro, escala = 1) {
  if (!tabla) return null;
  for (const f of tabla) {
    if (cuadro >= f.desde && cuadro <= f.hasta) {
      const k = 1 / (f.hasta - f.desde + 1);
      return [ -f.mover[0] * k * escala, -f.mover[1] * k, f.mover[2] * k * escala ];
    }
  }
  return null;
}

export function crearMovedor(THREE, getColision, escala, {minNy: minNy = PISO.enemigo.minNy} = {}) {
  const rayo = new THREE.Raycaster, o = new THREE.Vector3, d = new THREE.Vector3;
  const pisoComun = crearPiso(THREE, escala);
  const aV = (p, alto = 0) => o.set(-p[0] * escala, (-p[1] + alto) * escala, p[2] * escala);
  function bloqueado(p, dx, dz, radio) {
    const col = getColision?.();
    if (!col) return false;
    const L = Math.hypot(dx, dz);
    if (L < 1e-6) return false;
    d.set(-dx / L, 0, dz / L);
    for (const alto of [ 25, 70 ]) {
      aV(p, alto);
      rayo.set(o, d);
      rayo.far = (L + radio) * escala;
      if (rayo.intersectObject(col).some(h => Math.abs(h.face.normal.y) < .6)) return true;
    }
    return false;
  }
  function piso(p, subir = 80, bajar = 400) {
    return pisoComun.juego(getColision?.(), p, subir, bajar, minNy);
  }
  function mover(p, dx, dz, radio = 70) {
    if (Math.abs(dx) + Math.abs(dz) > 1e-6) {
      if (!bloqueado(p, dx, dz, radio)) {
        p[0] += dx;
        p[2] += dz;
      } else {
        if (Math.abs(dx) > 1e-4 && !bloqueado(p, dx, 0, radio)) p[0] += dx;
        if (Math.abs(dz) > 1e-4 && !bloqueado(p, 0, dz, radio)) p[2] += dz;
      }
    }
    const y = piso(p);
    if (y != null) p[1] = y;
    return p;
  }
  return {
    mover: mover,
    piso: piso,
    bloqueado: bloqueado
  };
}
