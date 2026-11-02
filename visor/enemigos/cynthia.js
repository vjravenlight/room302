// SH4 web — FeniXVOID · Project Ravenlight
import { partesBin } from "../lib/sh4bin.js";

import { leerModelo } from "../lib/modelo.js";

import { leerTexturas } from "../lib/texturas.js";

import { leerAnimacion } from "../lib/animacion.js";

import { crearPersonaje } from "../lib/personaje.js";

import { Animador } from "../jugador/mezcla.js";

import { componer } from "../lib/animacion.js";

import { crearGiroCara, aplicarGiroCara } from "./girar_cara.js";

import { DT, envolver, rumboHacia, distXZ, crearMovedor, azar01 } from "./comun.js";

import { TrabajoCamino, buscarCaminoEil } from "./caminos.js";

export { DT };

export const ANIM = {
  QUIETA: 0,
  CAMINA: 1,
  CORRE: 2,
  QUIETA2: 3,
  DANIO_ATRAS: 4,
  DANIO_FRENTE: 5,
  QUIETA_ALT: 6
};

export const PASO = {
  ESPERA0: 0,
  PRIMERA: 1,
  ESPERA: 2,
  GIRO: 3,
  SIGUE: 4,
  EMPUJADA: 5,
  DANIO: 6
};

export const NOMBRE_PASO = [ "Wait", "FirstWalk", "Wait", "Turn", "Follow", "Pushed", "Damage" ];

const C = {
  LEJOS_SEGUIR: 500,
  CERCA_PARAR: 200,
  MUY_LEJOS: 1e3,
  LEJOS_CAMBIO: 800,
  ANG_GIRO: Math.PI / 2,
  GIRO_MAX: .1,
  GIRO_MIN: .05,
  GIRO_FUERTE: .03,
  VEL_MAX: 1.5,
  CAMINA: 6,
  CORRE: 10,
  ESPERA_AZAR: 1800,
  ESPERA_MIN: 60,
  PRIMERA_CUADROS: 120,
  RADIO: 80,
  SON_GOLPE: 40131
};

export async function cargarCynthia({bajar: bajar, alternativo: alternativo = false}) {
  const arch = alternativo ? "cybl.bin" : "cynl.bin";
  const [bm, ba] = await Promise.all([ bajar("data/" + arch), bajar("data/cynl_anm.bin") ]);
  const pm = partesBin(bm), pa = partesBin(ba);
  const mod = pm.find(p => p.tipo === "modelo"), tex = pm.find(p => p.tipo === "texturas");
  const pj = crearPersonaje(leerModelo(bm, mod.ofs, mod.len), tex ? leerTexturas(bm, tex.ofs, tex.len) : []);
  const anims = pa.filter(p => p.tipo === "animacion").map(p => leerAnimacion(ba, p.ofs, p.len));
  pj.grupo.name = "Cynthia";
  return {
    pj: pj,
    anims: anims
  };
}

export class Cynthia {
  constructor({pj: pj, anims: anims, m: m, pos: pos, rot: rot = 0, parada: parada = false, primera: primera = true, alternativo: alternativo = false}) {
    this.pj = pj;
    this.anims = anims;
    this.m = m;
    this.anim = new Animador(pj, anims);
    this.movedor = crearMovedor(m.THREE, m.getColision, m.escala ?? .005);
    this.pos = [ ...pos ];
    this.rot = rot;
    this.posAnt = [ ...pos ];
    this.rotAnt = rot;
    this.parada = parada;
    this.w = {
      vel: 0,
      dirMov: rot,
      param: .05,
      timer: 0,
      giro: 0,
      giroCuadros: 0,
      ocupada: false,
      choque: 0,
      choqueDir: [ 0, 0, 0 ],
      distJ: 0,
      distJAnt: 0,
      angJ: 0,
      estado: primera ? 0 : 1,
      estadoCamino: 0,
      puntoCamino: null
    };
    this.tc = new TrabajoCamino;
    this.paso = -1;
    this.sub = 0;
    this.cara = crearGiroCara();
    if (parada) this.anim.poner(alternativo ? ANIM.QUIETA_ALT : ANIM.QUIETA, {
      mezcla: 0,
      loop: true
    }); else this.cambiarPaso(primera ? PASO.PRIMERA : PASO.ESPERA);
    this.ubicarModelo(1);
  }
  caminos() {
    return this.m.caminos?.() || globalThis.sh4?.enemigos?.caminos || null;
  }
  objetivo(j) {
    return this.w.estadoCamino && this.w.puntoCamino ? this.w.puntoCamino : j.pos;
  }
  get estadoAcompanante() {
    return this.w.estado;
  }
  cambiarPaso(n) {
    if (this.paso === n) return;
    this.paso = n;
    this.sub = 0;
    this.w.ocupada = true;
  }
  analizar() {
    const j = this.m.jugador(), w = this.w;
    w.distJAnt = w.distJ;
    w.distJ = distXZ(this.pos, j.pos);
    w.angJ = envolver(rumboHacia(j.pos, this.pos) - this.rot);
    return j;
  }
  pensar(j) {
    const w = this.w;
    let sig = 0;
    if (w.estado === 0) return PASO.PRIMERA;
    let ang = w.angJ, sinCamino = false;
    const c = this.caminos();
    if (c && j.existe !== false) {
      if (!c.obstaculo(this.pos, j.pos)) w.estadoCamino = 0; else if (!w.estadoCamino) w.estadoCamino = 1;
      if (w.estadoCamino) {
        const r = buscarCaminoEil(c, this.tc, w, this.pos, j.pos);
        if (r.r < 0) sinCamino = true; else if (r.r === 0 && r.punto) {
          w.puntoCamino = r.punto;
          ang = envolver(rumboHacia(r.punto, this.pos) - this.rot);
        } else w.puntoCamino = null;
        if (c.ver) c.ruta("cynthia", this.pos, this.tc.puntos.slice(this.tc.i), 16736511);
      } else {
        w.puntoCamino = null;
        if (c.ver) c.ruta("cynthia", null, []);
      }
    }
    if (sinCamino) sig = PASO.ESPERA; else {
      if (w.distJ > C.LEJOS_SEGUIR || w.estadoCamino) sig = PASO.SIGUE;
      if (Math.abs(ang) > C.ANG_GIRO) sig = PASO.GIRO;
    }
    if (this.m.escena?.() === 1 && sig === PASO.SIGUE && (j.pos[2] < -600 || j.pos[0] < -4500)) sig = PASO.ESPERA;
    if (w.choque === 1 || w.choque === 3) sig = PASO.DANIO; else if (w.choque === 4) sig = PASO.EMPUJADA;
    if (this.paso !== PASO.ESPERA && w.ocupada) sig = 0;
    return sig;
  }
  tick() {
    this.posAnt = [ ...this.pos ];
    this.rotAnt = this.rot;
    if (this.parada) return;
    const j = this.analizar(), w = this.w;
    const sig = this.pensar(j);
    if (sig && this.paso !== PASO.PRIMERA) this.cambiarPaso(sig);
    switch (this.paso) {
     case PASO.PRIMERA:
      this.primera();
      break;

     case PASO.GIRO:
      this.girar(j);
      break;

     case PASO.SIGUE:
      this.seguir(j);
      break;

     case PASO.EMPUJADA:
      this.empujada(j);
      break;

     case PASO.DANIO:
      this.danio();
      break;

     default:
      this.esperar();
      break;
    }
    w.choque = 0;
    if (w.vel) this.movedor.mover(this.pos, Math.sin(w.dirMov) * w.vel, Math.cos(w.dirMov) * w.vel, 60);
    if (j.existe) {
      const dx = this.pos[0] - j.pos[0], dz = this.pos[2] - j.pos[2], d = Math.hypot(dx, dz);
      if (d < C.RADIO && d > .001) {
        this.movedor.mover(this.pos, dx / d * (C.RADIO - d) * .9, dz / d * (C.RADIO - d) * .9, 60);
        w.choque = 4;
      }
    }
    w.estado = w.distJ >= C.LEJOS_CAMBIO ? 2 : 1;
  }
  esperar() {
    const w = this.w;
    if (this.sub === 0) {
      w.ocupada = false;
      w.vel = 0;
      this.anim.poner(ANIM.QUIETA, {
        mezcla: .33,
        loop: true
      });
      w.timer = Math.round(azar01() * C.ESPERA_AZAR + C.ESPERA_MIN);
      this.sub = 1;
    }
    if (this.sub === 1) {
      if (--w.timer < 0) {
        this.anim.poner(ANIM.QUIETA2, {
          mezcla: .33,
          loop: false
        });
        this.sub = 2;
      }
    } else if (this.sub === 2 && this.anim.terminada) this.sub = 0;
  }
  primera() {
    const w = this.w;
    if (this.sub === 0) {
      w.ocupada = true;
      this.anim.poner(ANIM.CAMINA, {
        mezcla: .3,
        loop: true
      });
      w.dirMov = this.rot;
      w.timer = C.PRIMERA_CUADROS;
      this.sub = 1;
    }
    w.dirMov = this.rot;
    w.vel = C.CAMINA;
    if (--w.timer < 0) {
      this.paso = -1;
      this.cambiarPaso(PASO.SIGUE);
    }
  }
  girar(j) {
    const w = this.w;
    if (this.sub === 0) {
      w.ocupada = true;
      w.vel = 0;
      w.giroCuadros = 30;
      this.anim.poner(ANIM.CAMINA, {
        mezcla: .2,
        loop: true,
        vel: .5
      });
      this.sub = 1;
    }
    const a = envolver(rumboHacia(this.objetivo(j), this.pos) - this.rot);
    const paso = a / Math.max(1, w.giroCuadros);
    this.rot = envolver(this.rot + paso);
    w.dirMov = this.rot;
    w.giroCuadros = Math.max(1, w.giroCuadros - 1);
    if (w.giroCuadros < 15) w.ocupada = false;
    if (Math.abs(a) < .05 || w.giroCuadros <= 1) {
      this.paso = -1;
      this.cambiarPaso(PASO.ESPERA);
    }
  }
  seguir(j) {
    const w = this.w;
    if (this.sub === 0) {
      w.ocupada = false;
      w.vel = 0;
      w.param = .05;
      this.sub = 1;
    }
    let a = envolver(rumboHacia(this.objetivo(j), this.pos) - this.rot), fuerte = false;
    if (Math.abs(a) > C.GIRO_MIN) {
      const g = Math.max(-C.GIRO_MAX, Math.min(C.GIRO_MAX, a));
      this.rot = envolver(this.rot + g);
      if (Math.abs(g) > C.GIRO_FUERTE) fuerte = true;
    }
    w.dirMov = this.rot;
    let s = w.param;
    if (w.distJ > C.MUY_LEJOS) s += .02; else if (w.distJ <= C.LEJOS_SEGUIR) s += s < .5 || w.distJAnt <= w.distJ ? .01 : -.01; else {
      if (s > .5) s -= .02;
      if (s < .4) s += .02;
    }
    s = Math.max(0, Math.min(C.VEL_MAX, s));
    if (fuerte && s > .5) s += Math.max(-.2, Math.min(.2, s * .8 - s));
    w.param = s;
    if (s >= .5) {
      const r = Math.max(0, Math.min(1, s - .5));
      w.vel = C.CORRE * r + C.CAMINA;
      this.anim.ponerSub(ANIM.CAMINA, ANIM.CORRE, r, {
        mezcla: .2,
        loop: true
      });
    } else {
      const r = Math.max(0, Math.min(1, s * 2));
      w.vel = C.CAMINA * r;
      this.anim.ponerSub(ANIM.CAMINA, ANIM.QUIETA, 1 - r, {
        mezcla: .2,
        loop: true
      });
    }
    if (w.distJ < C.CERCA_PARAR) {
      this.paso = -1;
      this.cambiarPaso(PASO.ESPERA);
    }
  }
  empujada(j) {
    const w = this.w;
    if (this.sub === 0) {
      w.ocupada = true;
      const frente = Math.cos(envolver(rumboHacia(j.pos, this.pos) - this.rot)) >= 0;
      this.anim.poner(ANIM.CAMINA, {
        mezcla: .3,
        loop: true
      });
      w.dirMov = frente ? envolver(this.rot + Math.PI) : this.rot;
      w.vel = 4;
      w.timer = 15;
      this.sub = 1;
    }
    w.vel = Math.max(0, Math.min(10, w.vel + .2));
    if (w.choque === 4) w.timer = 15;
    if (--w.timer < 0) {
      w.ocupada = false;
      this.paso = -1;
      this.cambiarPaso(PASO.ESPERA);
    }
  }
  danio() {
    const w = this.w;
    if (this.sub === 0) {
      w.ocupada = true;
      const d = w.choqueDir, de = Math.sin(this.rot) * d[0] + Math.cos(this.rot) * d[2];
      const frente = de < 0;
      this.anim.poner(frente ? ANIM.DANIO_FRENTE : ANIM.DANIO_ATRAS, {
        mezcla: .1,
        loop: false
      });
      w.dirMov = frente ? envolver(this.rot + Math.PI) : this.rot;
      w.vel = 4;
      this.cuadro = 0;
      this.m.sonido?.(C.SON_GOLPE, this.pos);
      this.sub = 1;
    }
    this.cuadro++;
    w.vel = this.cuadro < 16 ? 4.6 : this.cuadro < 26 ? 2 : 0;
    if (this.cuadro >= 26) w.ocupada = false;
    if (this.anim.terminada) {
      this.paso = -1;
      this.cambiarPaso(PASO.ESPERA);
    }
  }
  golpe(dir) {
    this.w.choque = 1;
    this.w.choqueDir = dir || [ 0, 0, 1 ];
  }
  ubicar(pos, rot = this.rot) {
    this.pos = [ ...pos ];
    this.rot = rot;
    this.posAnt = [ ...pos ];
    this.rotAnt = rot;
    this.w.dirMov = rot;
    const y = this.movedor.piso(this.pos);
    if (y != null) this.pos[1] = y;
    this.ubicarModelo(1);
  }
  ubicarModelo(alfa) {
    const p = this.posAnt.map((v, i) => v + (this.pos[i] - v) * alfa);
    const dr = envolver(this.rot - this.rotAnt);
    this.rotDibujo = this.rotAnt + dr * alfa;
    this.pj.ubicar(p[0], p[1], p[2], this.rotDibujo);
  }
  dibujar(alfa, dt) {
    this.ubicarModelo(alfa);
    this.anim.actualizar(dt);
    this.girarCara(dt);
  }
  girarCara(dt) {
    const c = this.cara, j = this.m.jugador?.();
    c.prendido = !this.parada && this.paso !== PASO.PRIMERA && this.paso >= 0 && !!j?.pos && j.existe !== false;
    if (c.prendido) c.punto = [ j.pos[0], j.pos[1] - 330, j.pos[2] ];
    const r = this.rotDibujo ?? this.rot, cs = Math.cos(r), sn = Math.sin(r);
    const dx = c.punto[0] - this.pos[0], dz = c.punto[2] - this.pos[2];
    const local = {
      ...c,
      punto: [ dx * cs - dz * sn, c.punto[1] - this.pos[1], dx * sn + dz * cs ]
    };
    const ok = aplicarGiroCara(local, this.anim.esq, this.anim.pose, dt, componer);
    c.peso = local.peso;
    c.anterior = local.anterior;
    if (ok) this.pj.aplicar(this.anim.pose);
  }
}

export function crearManejoCynthia({THREE: THREE, bajar: bajar, padre: padre, getColision: getColision, escala: escala, jugador: jugador, sonido: sonido, escena: escena}) {
  let datos = null, actual = null, acum = 0, cargando = null;
  const m = {
    THREE: THREE,
    getColision: getColision,
    escala: escala,
    jugador: jugador,
    sonido: sonido,
    escena: escena
  };
  async function datosListos() {
    if (!datos) {
      cargando ||= cargarCynthia({
        bajar: bajar
      });
      datos = await cargando;
    }
    return datos;
  }
  async function poner(opciones) {
    const d = await datosListos();
    quitar();
    actual = new Cynthia({
      ...d,
      m: m,
      ...opciones
    });
    padre.add(d.pj.grupo);
    d.pj.grupo.visible = true;
    return actual;
  }
  function quitar() {
    if (actual) {
      actual.pj.grupo.removeFromParent();
      actual = null;
    }
  }
  function actualizar(dt) {
    if (!actual) return false;
    acum += Math.min(dt, .25);
    let n = 0;
    while (acum >= DT && n < 8) {
      actual.tick();
      acum -= DT;
      n++;
    }
    actual.dibujar(acum / DT, dt);
    return true;
  }
  return {
    poner: poner,
    quitar: quitar,
    actualizar: actualizar,
    datosListos: datosListos,
    get actual() {
      return actual;
    }
  };
}
