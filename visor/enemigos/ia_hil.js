// SH4 web — FeniXVOID · Project Ravenlight
import { DT, envolver, distXZ, dist3, azar, azar01 } from "./comun.js";

import { C } from "./ia_hyena.js";

import { aRGBA } from "../lib/texturas.js";

export const P = {
  INIT: 0,
  VAGA: 1,
  SE_ACERCA: 2,
  HUYE: 3,
  CAE: 4,
  SE_SUELTA: 5,
  APLASTADA: 6,
  MUERTA: 7
};

export const NOMBRE_PASO = [ "Init", "Wander", "Approach", "Escape", "Fall", "Fall2", "Crush", "Dead" ];

export const A = {
  RETUERCE: 0,
  CAE: 1,
  APLASTADA: 2,
  SE_LEVANTA: 3
};

export const NOMBRES_ANIM_HIL = Object.fromEntries(Object.entries(A).map(([k, v]) => [ v, k ]));

const M = {
  REPTA: 0,
  QUIETA: 1,
  APLASTADA: 2,
  EN_PISO: 3,
  CAE: 4,
  SALTA: 5
};

const SE = {
  REPTA: 61200,
  REVIENTA: 60201,
  PISOTON: 60202,
  CAE: 60203
};

const HUESOS = [ 1, 2, 3 ];

const DIST = [ -12.324, 14.2633, 13.2111, 14 ];

const ALTO = [ .4232, .1754, -.2923, -.3061 ];

const LIMITE = [ 1.0472, 1.0472, 1.0472, 1.0472 ];

const TAM_MANCHA = [ 100, 100, 80 ];

const COS15 = .9659258, COS45 = .70710677, SEN15 = .25881904;

const GRAVEDAD = 1960;

const SENTIDO = 1e3;

const ESCALA_BASE = 1;

const OCULTAR_APLASTADA = true;

const CAJAS = {
  sb: [ [ -300, -450, -300, 100, 0, 50 ] ],
  mz01: [ [ -3e3, -700, -3e3, 3e3, -100, 3e3 ] ],
  mz11: "mz01",
  mz21: "mz01",
  mz34: [ [ -500, -800, -570, 500, -50, 890 ] ],
  bd06: [ null, [ 369, -1200, -1100, 600, -850, -750 ] ],
  bd10: [ null, [ -110, -450, -1e3, 150, -50, -550 ], [ -100, 10, -1e3, 120, 1600, -550 ], [ -100, 10, 350, 120, 1600, 850 ], [ -2080, 200, -1e3, -150, 800, 850 ] ],
  bd11: [ null, [ -1e3, -400, -1720, 0, -50, -1400 ], [ -800, -400, 500, -200, -50, 800 ] ],
  bd14: [ null, [ -1120, -700, -800, -700, -50, -50 ], [ -950, -700, -960, -200, -50, -500 ] ]
};

const sumar = (a, b) => [ a[0] + b[0], a[1] + b[1], a[2] + b[2] ];

const restar = (a, b) => [ a[0] - b[0], a[1] - b[1], a[2] - b[2] ];

const por = (a, k) => [ a[0] * k, a[1] * k, a[2] * k ];

const punto = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

const cruz = (a, b) => [ a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0] ];

const largo = a => Math.hypot(a[0], a[1], a[2]);

const mezclar = (a, b, t) => [ a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t ];

function unit(a, otro = [ 0, 0, 1 ]) {
  const L = largo(a);
  return L > 1e-9 ? por(a, 1 / L) : [ ...otro ];
}

const tangente = (v, n) => restar(v, por(n, punto(v, n)));

function girarEje(v, e, a) {
  const c = Math.cos(a), s = Math.sin(a), k = punto(e, v) * (1 - c), x = cruz(e, v);
  return [ v[0] * c + x[0] * s + e[0] * k, v[1] * c + x[1] * s + e[1] * k, v[2] * c + x[2] * s + e[2] * k ];
}

function base(n, f) {
  const Y = por(n, -1), Z = f, X = cruz(Y, Z);
  return {
    X: X,
    Y: Y,
    Z: Z
  };
}

const aLocal = (v, b) => [ punto(v, b.X), punto(v, b.Y), punto(v, b.Z) ];

const aMundo = (l, b) => [ b.X[0] * l[0] + b.Y[0] * l[1] + b.Z[0] * l[2], b.X[1] * l[0] + b.Y[1] * l[1] + b.Z[1] * l[2], b.X[2] * l[0] + b.Y[2] * l[1] + b.Z[2] * l[2] ];

function ruido(p1, p2) {
  if (p1 < 0 && azar(32768) & 8192) p1 = -p1;
  const den = azar01() + p2;
  return den === 0 ? 0 : ((p2 + 1) * p2 / den - p2) * p1;
}

function resorte(s, obj, a, b, rig, am) {
  const v = (ruido(-a, b) + s[1] - (s[0] - obj) * rig) * am;
  s[1] = v;
  s[0] += v;
}

function acercarAngulo(act, obj, paso) {
  const d = envolver(obj - act);
  if (d < -paso) return envolver(act - paso);
  if (d > paso) return envolver(act + paso);
  return envolver(obj);
}

export function orientacionIni(ini, rumbo = 0) {
  let Y = [ 0, 1, 0 ], Z = [ Math.sin(rumbo), 0, Math.cos(rumbo) ];
  const giros = [], t = ini & 240;
  if (t >= 32 && t <= 80) {
    giros.push([ [ 1, 0, 0 ], Math.PI / 2 ]);
    if (t === 48) giros.push([ [ 0, 1, 0 ], Math.PI / 2 ]);
    if (t === 64) giros.push([ [ 0, 1, 0 ], Math.PI ]);
    if (t === 80) giros.push([ [ 0, 1, 0 ], -Math.PI / 2 ]);
  } else if (t === 96) giros.push([ [ 0, 0, 1 ], Math.PI ]);
  for (const [e, a] of giros) {
    Y = girarEje(Y, e, a);
    Z = girarEje(Z, e, a);
  }
  return {
    n: unit(por(Y, -1)),
    f: unit(Z)
  };
}

export function tipoHil(def, sala = def?.sala) {
  let t = def?.ini != null ? def.ini >> 8 & 15 : def?.tipo_param || 0;
  if (t < 3 && String(sala || "").startsWith("mz")) t += 3;
  return t;
}

export function binHil(def, sala) {
  if (def) def.sala = sala ?? def.sala ?? null;
  return "enemy_hil.bin";
}

export function parteModeloHil(def) {
  return tipoHil(def) >= 3 ? 1 : 0;
}

export const RECT_HIL = [ [ 64, 64, 64, 64 ], [ 64, 0, 64, 64 ], [ 0, 0, 64, 64 ], [ 0, 64, 16, 64 ], [ 16, 64, 16, 64 ] ];

const PARTE_MOCO = 10, PARTE_MANCHA = 11;

let texHil = null;

export async function texturasHil(e, {bin: bin, leerTexturas: leerTexturas, THREE: THREE}) {
  if (!THREE || !bin || !leerTexturas) return;
  const b = await bin("enemy_hil.bin");
  if (!texHil || texHil.b !== b.b) {
    const crear = k => {
      const p = b.p[k];
      if (!p || p.tipo !== "texturas") return null;
      const img = leerTexturas(b.b, p.ofs, p.len)?.[0]?.[0];
      if (!img) return null;
      const t = new THREE.DataTexture(aRGBA(img), img.ancho, img.alto, THREE.RGBAFormat);
      t.magFilter = THREE.LinearFilter;
      t.minFilter = THREE.LinearFilter;
      t.colorSpace = THREE.SRGBColorSpace;
      t.wrapS = THREE.RepeatWrapping;
      t.wrapT = THREE.RepeatWrapping;
      t.needsUpdate = true;
      t.userData.ancho = img.ancho;
      t.userData.alto = img.alto;
      t.name = "hil parte " + k;
      return t;
    };
    try {
      texHil = {
        b: b.b,
        moco: crear(PARTE_MOCO),
        mancha: crear(PARTE_MANCHA)
      };
    } catch (err) {
      console.warn("texturas del Hil", err.message);
      texHil = {
        b: b.b,
        moco: null,
        mancha: null
      };
    }
  }
  e.texturas = texHil;
}

export class Hil {
  constructor(def, pj, anim, m) {
    this.tipo = "HIL";
    this.def = def;
    this.pj = pj;
    this.anim = anim;
    this.m = m;
    this.sala = def.sala ?? m.sala?.() ?? null;
    this.etapa = this.sala ? String(this.sala).slice(0, 2) : null;
    this.escena = this.sala ? parseInt(String(this.sala).slice(2, 4), 10) : null;
    this.param = m.parametros("HIL", 0);
    this.hp = this.hpMax = this.param.vida;
    this.aguante = this.param.aguante;
    this.tipoCarga = tipoHil(def, this.sala);
    this.talla = ESCALA_BASE * ([ 1, 4 ].includes(this.tipoCarga) ? 1.5 : [ 2, 5 ].includes(this.tipoCarga) ? 2 : 1);
    this.velEscala = 1 / Math.sqrt(this.talla);
    const s = this.talla;
    this.radio = 24 * s;
    this.radioGolpe = 30 * s;
    this.alto = 20 * s;
    this.centroAlto = 8 * s;
    this.sinPasos = true;
    this.sinSangre = false;
    this.pos = [ ...def.pos ];
    this.rot = def.rumbo || 0;
    this.posAnt = [ ...this.pos ];
    this.rotAnt = this.rot;
    this.ini = def.ini ?? 0;
    this.limiteTipo = this.ini >> 12 & 15;
    const o = orientacionIni(this.ini, this.rot);
    this.n = o.n;
    this.f = o.f;
    this.nAnt = [ ...o.n ];
    this.fAnt = [ ...o.f ];
    this.cond = C.NORMAL;
    this.paso = P.INIT;
    this.sub = 0;
    this.modo = M.REPTA;
    this.golpes = [];
    this.animN = -1;
    this.animCorre = false;
    this.visible = true;
    this.opacidad = 1;
    this.borrado = false;
    this.cuerpoOculto = false;
    this.plano = false;
    this.w = {
      giro: [ 0, 0 ],
      vel: [ 0, 0 ],
      rapido: 0,
      timer: 0,
      visc: 0,
      limite: false,
      texTipo: -1,
      texRot: 0,
      goteoTipo: 0,
      goteo: 0,
      tAtaque: 0,
      sonoCaida: false,
      mov: [ 0, 0, 0 ],
      posVieja: [ ...this.pos ],
      quieto: 0,
      caidaT: 0,
      ultimoPiso: null,
      tam: 0,
      tamDibujo: 0
    };
    this.bpos = [ [ 0, 0, 0 ], [ 0, 0, 0 ], [ 0, 0, 0 ], [ 0, 0, 0 ] ];
    this.bposAnt = this.bpos.map(p => [ ...p ]);
    this.angs = [ 0, 0, 0, 0 ];
    this.esqueleto = false;
    this.moco = null;
    this.extras = null;
    const j = m.jugador?.();
    if (this.etapa === "sb" && this.escena === 3 && j && j.pos[2] > 150) {
      this.borrar();
      return;
    }
    this.ponerAnim(A.RETUERCE);
    this.animCorre = false;
    this.reiniciarEsqueleto();
    this.iniciarMoco();
    this.reptaSonido(true);
    const orig = anim.dibujar.bind(anim);
    anim.dibujar = (alfa = 0) => {
      orig(this.animCorre ? alfa : 0);
      this.posar(alfa);
    };
    const dispOrig = pj.dispose?.bind(pj);
    pj.dispose = () => {
      dispOrig?.();
      this.liberarMallas();
    };
  }
  caido() {
    return this.cond === C.DYING && this.paso !== P.APLASTADA;
  }
  persigue() {
    return this.cond === 3;
  }
  intocable() {
    return this.borrado || this.cond === C.DEAD;
  }
  recibir(g) {
    if (!this.intocable()) this.golpes.push(g);
  }
  pasoA(n) {
    this.paso = n;
    this.sub = 0;
  }
  ponerAnim(n, op) {
    this.animN = n;
    this.anim.poner(n, op);
    this.animCorre = true;
  }
  sonido(id, loop) {
    this.m.sonido?.(this, id, loop);
  }
  reptaSonido(si) {
    if (si !== this.sonando) {
      this.sonando = si;
      this.sonido(si ? SE.REPTA : null, true);
    }
  }
  jug() {
    return this.m.jugador();
  }
  enPiso() {
    return this.n[1] < -COS15;
  }
  puntoGolpe() {
    return this.pos;
  }
  piso(p) {
    const u = this.w.ultimoPiso;
    if (u != null && Math.abs(p[1] - u) < 3) {
      const y = this.m.piso?.(p, 3, 6);
      if (y != null) {
        this.w.ultimoPiso = y;
        return y;
      }
    }
    const y = this.m.piso?.(p, -1, 4e3);
    if (y != null) this.w.ultimoPiso = y;
    return y ?? null;
  }
  borrar() {
    this.borrado = true;
    this.visible = false;
    this.cond = C.DEAD;
    this.paso = P.MUERTA;
    this.reptaSonido(false);
  }
  rayo(a, b) {
    const h = this.m.rayo?.(a, b);
    if (!h) return null;
    const d = restar(b, a);
    let n = unit(h.normal);
    if (punto(n, d) > 0) n = por(n, -1);
    return {
      pos: h.pos,
      normal: n,
      dist: h.dist ?? largo(restar(h.pos, a))
    };
  }
  tick() {
    this.posAnt = [ ...this.pos ];
    this.rotAnt = this.rot;
    this.nAnt = [ ...this.n ];
    this.fAnt = [ ...this.f ];
    this.bposAnt = this.bpos.map(p => [ ...p ]);
    if (this.borrado) {
      this.golpes = [];
      return;
    }
    if (this.cond === C.DEAD) {
      if (this.paso === P.APLASTADA) this.aplastada();
      this.golpes = [];
      return;
    }
    this.control();
    if (this.modo === M.REPTA && this.esqueleto) this.moverHuesos();
    this.controlMoco();
    this.pegarse();
    this.golpes = [];
    const h = Math.hypot(this.f[0], this.f[2]);
    this.rot = h > .2 ? Math.atan2(this.f[0], this.f[2]) : Math.atan2(this.n[0], this.n[2]);
  }
  control() {
    switch (this.paso) {
     case P.INIT:
      this.init();
      break;

     case P.VAGA:
      this.vaga();
      break;

     case P.SE_ACERCA:
      this.seAcerca();
      break;

     case P.HUYE:
      this.huye();
      break;

     case P.CAE:
      this.cae();
      break;

     case P.SE_SUELTA:
      this.seSuelta();
      break;

     case P.APLASTADA:
      this.aplastada();
      break;

     case P.MUERTA:
      break;
    }
    this.limitar();
  }
  revisarGolpes() {
    let r = 0;
    for (const g of this.golpes) {
      const golpe = String(g.golpe || ""), bdt = g.bdt ?? -1, d = g.danio || 0;
      if (/FINISH|PISOTON/.test(golpe)) {
        if (this.enPiso()) {
          this.sonido(SE.PISOTON);
          return 2;
        }
        continue;
      }
      if (bdt === 22) {
        this.hp -= d;
        return golpe === "BAK_PLAYER_SPRAY" ? 3 : 1;
      }
      if ([ 1, 3, 5, 7, 9, 11, 13, 15, 17, 20 ].includes(bdt) || g.atributo === 2 || bdt === 19 || bdt === 20) {
        this.sonido(SE.REVIENTA);
        return 2;
      }
      if (bdt === 0 || bdt === 1) {
        this.sonido(SE.REVIENTA);
        return 2;
      }
      this.hp -= d;
      if (this.hp <= 0 || this.cercaDeLinea(g) < 30) {
        this.sonido(SE.REVIENTA);
        return 2;
      }
      r = 1;
    }
    return r;
  }
  cercaDeLinea(g) {
    if (!g.pos || !g.dir || g.dir.length < 3) return azar01() * 24 * this.talla;
    const p = Array.isArray(g.pos) ? g.pos : [ g.pos.x, g.pos.y, g.pos.z ];
    const d = unit(g.dir), v = restar(this.pos, p), t = Math.max(0, Math.min(1, punto(v, d)));
    return largo(restar(v, por(d, t)));
  }
  comun() {
    const w = this.w, j = this.jug(), s = this.talla, r24 = 24 * s;
    if (this.golpes.length) {
      const r = this.revisarGolpes();
      if (r === 1 && this.n[1] >= -COS15) {
        if (this.paso !== P.CAE) this.pasoA(P.CAE);
        return true;
      }
      if (r === 2) {
        w.texTipo = azar01() < .5 ? 1 : 0;
        this.pasoA(P.APLASTADA);
        return true;
      }
      if (r === 3 && (this.paso === P.VAGA || this.paso === P.SE_ACERCA)) {
        this.pasoA(P.HUYE);
        return true;
      }
    }
    if (!j?.existe) return false;
    const dx = j.pos[0] - this.pos[0], dz = j.pos[2] - this.pos[2], d2 = dx * dx + dz * dz;
    if (this.n[1] >= -COS15) {
      if (this.n[1] <= COS15) {
        const rr = r24 * .5 + 80;
        if (d2 >= rr * rr) {
          w.tAtaque = 0;
          return false;
        }
        if (w.tAtaque <= 0) {
          if (this.toca(j)) {
            this.m.golpear(this, this.param.ataque2, "BAK_HIL_WALL");
            w.tAtaque = 3;
          }
        } else w.tAtaque -= DT;
        return false;
      }
      if (azar01() >= .1) return false;
      if (j.pos[1] <= this.pos[1]) return false;
      if (d2 >= 9e4) return false;
      if (!this.hayPisoDebajo(r24)) return false;
      this.pasoA(P.SE_SUELTA);
      return true;
    }
    if (d2 < r24 * r24 * .6 && Math.abs(j.pos[1] - this.pos[1]) < 10 && this.jugadorPuede(j)) {
      w.texTipo = azar01() < .5 ? 2 : 0;
      this.m.golpear(this, this.param.ataque1, "BAK_HIL_FLOOR");
      this.sonido(SE.REVIENTA);
      this.pasoA(P.APLASTADA);
      return true;
    }
    if (this.cond !== C.DYING && azar01() < .1 && this.pos[1] + 60 < j.pos[1] && d2 < 9e4 && this.hayPisoDebajo(r24, 2 * r24)) {
      this.modo = M.SALTA;
      this.pasoA(P.SE_SUELTA);
      return true;
    }
    return false;
  }
  jugadorPuede(j) {
    return ![ 0, 6, 7, 9, 10 ].includes(j.estado) && (this.m.relojAtaque?.() ?? 5) >= 5;
  }
  toca(j) {
    const r = this.radio + (this.m.radioJugador ?? 40);
    return distXZ(this.pos, j.pos) < r && this.pos[1] <= j.pos[1] + 10 && this.pos[1] >= j.pos[1] - 190;
  }
  hayPisoDebajo(r24, bajar = 0) {
    const y = this.piso([ this.pos[0], this.pos[1] + bajar, this.pos[2] ]);
    return y != null && y > this.pos[1] + 20;
  }
  moverComun() {
    const w = this.w, s = this.talla;
    const bloq = Math.abs(w.giro[0]) >= .08726647 && (w.limite || this.trabada);
    if (!bloq) {
      const k = .08726647 / Math.sqrt(s);
      resorte(w.giro, 0, k, k, .1, .9);
    }
    this.f = unit(girarEje(this.f, por(this.n, -1), w.giro[0]));
    const T = w.rapido ? this.param.velocidad2 : this.param.velocidad;
    resorte(w.vel, T, T * .3, T * .2, .1, .9);
    w.vel[0] = Math.max(w.vel[0], T * .1);
    w.visc = w.vel[0] > T ? Math.min(.7, w.visc + .05) : Math.max(0, w.visc - .05);
    this.reptar(por(this.f, w.vel[0] * this.velEscala * DT * s));
  }
  reptar(d) {
    const s = this.talla, L = largo(d);
    this.trabada = false;
    if (L < 1e-6) return;
    if (this.lejos()) return;
    if (this.plano || !this.m.rayo) {
      const p2 = sumar(this.pos, d), adelante = sumar(p2, por(this.f, 24 * s));
      if (this.m.lineaDeVista && !this.m.lineaDeVista(this.pos, adelante)) {
        this.trabada = true;
        this.w.giro[0] = .1;
        return;
      }
      this.pos = p2;
      return;
    }
    const o = sumar(this.pos, por(this.n, 4 * s));
    const h = this.rayo(o, sumar(o, por(unit(d), L + 12 * s)));
    if (h && punto(h.normal, this.n) < .7) {
      const nv = this.n;
      this.n = h.normal;
      this.f = unit(tangente(nv, h.normal), this.f);
      this.pos = h.pos;
      this.trabada = true;
      return;
    }
    this.pos = sumar(this.pos, d);
    if (this.buscarSuperficie()) return;
    const q = sumar(this.pos, por(this.n, -6 * s - 4));
    const h2 = this.rayo(q, sumar(q, por(this.f, -(L + 24 * s))));
    if (h2) {
      const nv = this.n;
      this.n = h2.normal;
      this.f = unit(por(tangente(nv, h2.normal), -1), this.f);
      this.pos = h2.pos;
    }
  }
  lejos() {
    const j = this.jug();
    return !!j && dist3(this.pos, j.pos) > 3e3;
  }
  buscarSuperficie() {
    if (this.plano || !this.m.rayo || this.lejos()) return true;
    const s = this.talla;
    const h = this.rayo(sumar(this.pos, por(this.n, 12)), sumar(this.pos, por(this.n, -(12 + 8 * s))));
    if (!h || punto(h.normal, this.n) < .3) return false;
    this.pos = h.pos;
    this.n = h.normal;
    this.f = unit(tangente(this.f, this.n), tangente(this.fAnt, this.n));
    return true;
  }
  pegarse() {
    if (this.modo !== M.REPTA || this.paso === P.CAE || this.paso === P.SE_SUELTA || this.paso === P.APLASTADA) return;
    if (!this.buscarSuperficie()) this.pasoA(P.SE_SUELTA);
  }
  limitar() {
    this.w.limite = false;
    if (!this.limiteTipo || !this.sala) return;
    let t = CAJAS[this.sala] ?? CAJAS[this.etapa];
    if (typeof t === "string") t = CAJAS[t];
    if (!t) return;
    const c = this.etapa === "bd" ? t[this.limiteTipo] : t[0];
    if (!c) return;
    for (let i = 0; i < 3; i++) {
      const v = Math.max(c[i], Math.min(c[i + 3], this.pos[i]));
      if (v !== this.pos[i]) {
        this.pos[i] = v;
        this.w.limite = true;
      }
    }
  }
  init() {
    const w = this.w;
    this.pasoA(P.VAGA);
    w.giro = [ 0, 0 ];
    w.rapido = 0;
    w.vel = [ 0, 0 ];
    w.limite = false;
    this.modo = M.REPTA;
    const s = this.talla;
    if (this.m.rayo) {
      for (const R of [ s * 36, s * 60 ]) {
        const h = this.rayo(sumar(this.pos, por(this.n, R)), sumar(this.pos, por(this.n, -R)));
        if (h && punto(h.normal, this.n) > COS45) {
          this.n = h.normal;
          this.f = unit(tangente(this.f, this.n), this.f);
          this.pos = h.pos;
          this.reiniciarEsqueleto();
          return;
        }
      }
      const piso = this.piso(this.pos);
      if ((this.ini & 240) >= 32 && piso != null && piso - this.pos[1] > 100) {
        this.plano = true;
        return;
      }
      this.n = [ 0, -1, 0 ];
      this.pasoA(P.SE_SUELTA);
      return;
    }
    this.plano = true;
  }
  vaga() {
    if (this.comun()) return;
    const w = this.w;
    if (this.sub === 0) {
      this.cond = this.enPiso() ? C.DYING : C.NORMAL;
      if (azar01() < .002) {
        this.soltarEsqueleto();
        this.ponerAnim(A.RETUERCE, {
          vel: 1 - azar01() * .5
        });
        this.modo = M.QUIETA;
        w.timer = azar01() * 2 + 1;
        this.sub = 1;
        return;
      }
    } else if (this.sub === 1) {
      w.timer -= DT;
      if (w.timer < 0 && this.anim.vuelta) {
        this.reiniciarEsqueleto();
        this.animCorre = false;
        this.modo = M.REPTA;
        w.giro = [ 0, 0 ];
        w.vel = [ 0, 0 ];
        w.rapido = azar01() < .125 ? 1 : 0;
        this.sub = 0;
        return;
      }
      this.anim.avanzar();
      return;
    }
    this.moverComun();
    if (this.sentir()) this.pasoA(P.SE_ACERCA);
  }
  sentir() {
    const j = this.jug();
    return j?.existe && dist3(this.pos, j.pos) < SENTIDO ? j : null;
  }
  anguloA(v) {
    const b = base(this.n, this.f), l = aLocal(v, b);
    return Math.atan2(l[0], l[2]);
  }
  seAcerca() {
    if (this.comun()) return;
    if (this.sub === 0) {
      this.ponerAnim(A.RETUERCE, {
        desde: -1
      });
      this.anim.avanzar();
      this.animCorre = false;
      this.modo = M.REPTA;
      this.cond = this.enPiso() ? C.DYING : 2;
      this.w.rapido = 0;
      this.sub = 1;
    }
    const j = this.sentir();
    if (!j) {
      this.pasoA(P.VAGA);
      return;
    }
    this.w.giro[0] = acercarAngulo(this.w.giro[0], this.anguloA(restar(j.pos, this.pos)), .05235988);
    this.moverComun();
  }
  huye() {
    if (this.comun()) return;
    const w = this.w;
    if (this.sub === 0) {
      this.ponerAnim(A.RETUERCE, {
        desde: -1
      });
      this.anim.avanzar();
      this.animCorre = false;
      this.modo = M.REPTA;
      this.cond = this.enPiso() ? C.DYING : 4;
      w.rapido = 1;
      w.timer = (azar01() + 1) * 5;
      this.sub = 1;
    }
    w.giro[0] = acercarAngulo(w.giro[0], this.anguloA(restar(this.pos, this.jug().pos)), .08726646);
    this.moverComun();
    w.timer -= DT;
    if (w.timer <= 0) this.pasoA(P.VAGA);
  }
  cae() {
    const w = this.w, s = this.talla;
    switch (this.sub) {
     case 0:
      {
        this.cond = C.DAMAGE;
        this.liberarMoco();
        this.reptaSonido(false);
        w.mov = por(this.n, 60);
        w.posVieja = [ ...this.pos ];
        w.sonoCaida = false;
        w.quieto = 0;
        this.limiteTipo = 0;
        w.caidaT = 0;
        this.modo = M.CAE;
        this.soltarEsqueleto();
        this.ponerAnim(A.CAE, {
          vel: (azar01() * 2 - 1) * .5 + 1
        });
        this.sub = 1;
      }

     case 1:
      {
        const t0 = w.caidaT;
        w.caidaT = Math.min(1, w.caidaT + 2 * DT);
        this.girarCuerpoHacia([ 0, -1, 0 ], {
          k: (w.caidaT - t0) / (1 - t0 || 1)
        });
        if (w.caidaT >= 1) this.sub = 2;
      }

     case 2:
     case 3:
      {
        w.mov[1] += GRAVEDAD * DT;
        const piso = this.piso(this.pos);
        const v = largo(w.mov), adelante = sumar(this.pos, por(w.mov, s / Math.max(v, 1e-6) * 24 + DT));
        let h = v > 1e-6 ? this.rayo(this.pos, adelante) : null;
        if (h && (h.dist < .5 || punto(w.mov, h.normal) >= 0)) h = null;
        if (!h && piso != null && adelante[1] >= piso && w.mov[1] > 0) h = {
          pos: [ this.pos[0], piso, this.pos[2] ],
          normal: [ 0, -1, 0 ]
        };
        if (h) {
          const dn = punto(w.mov, h.normal);
          w.mov = por(restar(w.mov, por(h.normal, 2 * dn)), .3);
          if (h.normal[1] < -COS45) {
            this.n = h.normal;
            this.modo = M.EN_PISO;
            this.cond = C.DYING;
            if (this.etapa === "mz" && [ 1, 11, 21 ].includes(this.escena) && h.pos[1] < -100) w.mov[0] = -400;
            if (this.sub === 2) this.sub = 3;
            if (!w.sonoCaida) {
              this.sonido(SE.CAE);
              w.sonoCaida = true;
            }
          }
        }
        this.pos = sumar(this.pos, por(w.mov, DT * s));
        const piso2 = piso;
        if (piso2 != null && this.pos[1] > piso2) {
          this.pos[1] = piso2;
          if (w.mov[1] > 40) {
            w.mov[1] = 40;
            w.mov[0] *= .5;
            w.mov[2] *= .5;
            this.modo = M.EN_PISO;
          }
        }
        if (this.sub === 3) {
          const dm = restar(this.pos, w.posVieja);
          if (punto(dm, dm) < 10) {
            w.quieto += DT;
            if (w.quieto >= .2) {
              if (piso2 != null) this.pos[1] = piso2;
              this.girarCuerpoHacia([ 0, -1, 0 ]);
              this.modo = M.QUIETA;
              this.cond = C.DYING;
              this.sub = 4;
              this.anim.avanzar();
              return;
            }
          }
        }
        w.posVieja = [ ...this.pos ];
        break;
      }

     case 4:
      if (this.comun()) return;
      if (this.anim.fin) {
        if (this.hp <= 0) {
          w.timer = azar01() * 5 + 3;
          this.sub = 6;
          this.anim.avanzar();
          return;
        }
        w.timer = azar01() * 10;
        this.sub = 5;
        this.anim.avanzar();
        return;
      }
      break;

     case 5:
      if (this.comun()) return;
      w.timer -= DT;
      if (w.timer <= 0) {
        this.ponerAnim(A.SE_LEVANTA);
        this.sub = 6;
        this.anim.avanzar();
        return;
      }
      break;

     case 6:
      if (this.anim.fin) {
        this.reiniciarEsqueleto();
        this.animCorre = false;
        this.iniciarMoco();
        w.giro = [ 0, 0 ];
        w.vel = [ 0, 0 ];
        w.rapido = 0;
        this.modo = M.REPTA;
        this.pasoA(P.VAGA);
        this.reptaSonido(true);
        return;
      }
      break;

     case 7:
      if (this.comun()) return;
      w.timer -= DT;
      if (w.timer <= 0) {
        this.cond = C.DEAD;
        w.texTipo = -1;
      }
      break;
    }
    this.anim.avanzar();
  }
  seSuelta() {
    const s = this.talla;
    if (this.sub === 0) {
      this.cond = 3;
      this.soltarEsqueleto();
      if (this.modo !== M.SALTA) this.modo = M.CAE;
      this.reptaSonido(false);
      this.liberarMoco();
      this.limiteTipo = 0;
      this.ponerAnim(A.RETUERCE, {
        desde: -1
      });
      this.anim.avanzar();
      this.animCorre = false;
      this.sub = 1;
    }
    const piso = this.piso(this.pos);
    if (piso == null) {
      if (this.plano || !this.m.piso) {
        this.n = [ 0, -1, 0 ];
        this.aterrizar();
        return;
      }
      this.borrar();
      return;
    }
    this.girarCuerpoHacia([ 0, -1, 0 ], {
      angMax: DT * 12.566371
    });
    const falta = piso - this.pos[1];
    if (falta <= s * 24 + 10 && -this.n[1] >= .8660254 && falta <= 1) {
      this.pos[1] = piso;
      this.aterrizar();
      return;
    }
    this.pos[1] += Math.min(GRAVEDAD * DT * s, Math.max(0, falta));
  }
  aterrizar() {
    this.sonido(SE.CAE);
    this.girarCuerpoHacia([ 0, -1, 0 ]);
    this.reiniciarEsqueleto();
    this.iniciarMoco();
    this.modo = M.REPTA;
    this.plano = this.plano && !this.m.rayo;
    this.pasoA(P.VAGA);
    this.reptaSonido(true);
  }
  aplastada() {
    const w = this.w, s = this.talla;
    if (this.sub === 0) {
      this.cond = C.DEAD;
      this.hp = 0;
      this.soltarEsqueleto();
      this.modo = M.APLASTADA;
      this.ponerAnim(A.APLASTADA);
      this.reptaSonido(false);
      this.liberarMoco();
      w.texRot = (azar01() * 2 - 1) * Math.PI;
      w.tam = (s - s * s * .1) * TAM_MANCHA[Math.max(0, w.texTipo)];
      w.tamDibujo = w.tam * .25;
      if (Math.abs(this.n[1]) < COS45) {
        w.goteoTipo = azar01() < .5 ? 4 : 3;
        w.goteo = 0;
        this.sub = 1;
      } else {
        w.goteoTipo = 0;
        this.sub = 2;
      }
      this.cuerpoOculto = OCULTAR_APLASTADA;
      this.salpicar();
    } else if (this.sub === 1) {
      w.goteo += DT * 10;
      if (w.goteo > 400) {
        w.goteo = 400;
        this.sub = 2;
      } else {
        const a = sumar(this.pos, por(this.n, 10)), b = sumar(a, por(this.abajoPared(), w.goteo));
        const piso = this.m.rayo ? null : this.piso(a);
        if (this.m.rayo ? this.rayo(a, b) : piso != null && b[1] >= piso) this.sub = 2;
      }
    }
    this.anim.avanzar();
  }
  salpicar() {
    const w = this.w;
    if (!this.m.charco) return;
    const y = this.m.piso?.([ this.pos[0], this.pos[1] - 1, this.pos[2] ], 1, 200);
    const p = y != null ? [ this.pos[0], y - 4, this.pos[2] ] : [ ...this.pos ];
    try {
      this.m.charco({
        pos: p,
        w: w
      }, Math.max(10, w.tamDibujo), true);
    } catch (err) {
      console.warn("charco del Hil", err.message);
    }
  }
  abajoPared() {
    return unit(tangente([ 0, 1, 0 ], this.n), [ 0, 1, 0 ]);
  }
  girarCuerpoHacia(nObj, {angMax: angMax = Infinity, k: k = 1} = {}) {
    const tot = Math.acos(Math.max(-1, Math.min(1, punto(this.n, nObj))));
    if (tot < 1e-4) {
      this.n = [ ...nObj ];
      this.f = unit(tangente(this.f, nObj), this.f);
      return true;
    }
    let eje = cruz(this.n, nObj);
    if (largo(eje) < 1e-6) eje = cruz(por(this.n, -1), this.f);
    eje = unit(eje);
    const a = Math.min(angMax, tot * k);
    this.n = unit(girarEje(this.n, eje, a));
    this.f = unit(tangente(girarEje(this.f, eje, a), this.n), this.f);
    return a >= tot - 1e-6;
  }
  reiniciarEsqueleto() {
    const b = base(this.n, this.f), s = this.talla;
    let prev = [ ...this.pos ];
    for (let i = 0; i < 4; i++) {
      prev = restar(prev, aMundo([ 0, s * ALTO[i], s * DIST[i] ], b));
      this.bpos[i] = [ ...prev ];
    }
    this.bposAnt = this.bpos.map(p => [ ...p ]);
    this.angs = [ 0, 0, 0, 0 ];
    this.w.visc = 0;
    this.esqueleto = true;
  }
  soltarEsqueleto() {
    this.esqueleto = false;
  }
  moverHuesos() {
    const b = base(this.n, this.f), s = this.talla;
    const visc = this.w.visc * (this.w.rapido ? .5 : 1);
    let prev = [ ...this.pos ], prevAng = 0;
    for (let i = 0; i < 4; i++) {
      const lim = s * LIMITE[i];
      let ang = 0;
      if (i > 0) {
        const l = aLocal(restar(prev, this.bpos[i]), b);
        const d = Math.max(-lim, Math.min(lim, envolver(Math.atan2(l[0], l[2]) - prevAng)));
        ang = envolver(d + prevAng);
      }
      const obj = restar(prev, aMundo([ Math.sin(ang) * s * DIST[i], s * ALTO[i], Math.cos(ang) * s * DIST[i] ], b));
      this.bpos[i] = sumar(por(restar(this.bpos[i], obj), visc), obj);
      this.angs[i] = ang;
      prev = this.bpos[i];
      prevAng = ang;
    }
  }
  iniciarMoco() {
    const p = [ ...this.bpos[3] ];
    this.moco = {
      pts: Array.from({
        length: 36
      }, () => ({
        p: [ ...p ],
        d: 0,
        n: [ ...this.n ]
      })),
      t: 0,
      transp: 0
    };
  }
  liberarMoco() {
    this.moco = null;
  }
  controlMoco() {
    const mc = this.moco;
    if (!mc) return;
    if (this.modo > M.QUIETA) {
      mc.transp = Math.min(1, mc.transp + DT * 4);
      return;
    }
    mc.t += DT;
    if (this.w.rapido) mc.t += DT;
    while (mc.t >= .05) {
      mc.t -= .05;
      const cola = this.bpos[3], viejo = mc.pts[0];
      mc.pts.pop();
      const d = largo(restar(cola, viejo.p));
      mc.pts.unshift(d * d >= 15258789e-12 ? {
        p: [ ...cola ],
        d: d,
        n: [ ...this.n ]
      } : {
        p: [ ...viejo.p ],
        d: 0,
        n: [ ...viejo.n ]
      });
    }
  }
  puntosMoco(pos, bp) {
    const mc = this.moco;
    if (!mc) return null;
    const s = this.talla;
    const cuerpo = [ sumar(pos, por(this.f, 32 * s)), ...bp ];
    let i0 = 0;
    while (i0 < 35 && mc.pts[i0].d === 0) i0++;
    let L = 0;
    for (let i = i0; i < 36; i++) L += mc.pts[i].d;
    let e = 1, b4 = 4, d4 = 35 - i0;
    if (L > 0) {
      e = 40 / (L / s + 40);
      b4 = 4 / e;
      d4 = d4 / (1 - e);
    }
    const out = [ {
      p: cuerpo[0],
      n: this.n
    } ];
    for (let k = 1; k < 13; k++) {
      const u = k / 12;
      if (u <= e || L <= 0) {
        const x = Math.min(3.999, u * b4), i = Math.floor(x);
        out.push({
          p: mezclar(cuerpo[i], cuerpo[i + 1], x - i),
          n: this.n
        });
      } else {
        const x = (u - e) * d4, i = Math.min(34, Math.floor(x) + i0);
        const a = mc.pts[i], c = mc.pts[Math.min(35, i + 1)];
        out.push({
          p: mezclar(a.p, c.p, x - Math.floor(x)),
          n: a.n
        });
      }
    }
    return out;
  }
  posar(alfa = 0) {
    const g = this.pj?.grupo;
    if (!g) return;
    const pos = mezclar(this.posAnt, this.pos, alfa);
    const n = unit(mezclar(this.nAnt, this.n, alfa), this.n);
    const f = unit(tangente(mezclar(this.fAnt, this.f, alfa), n), this.f);
    const b = base(n, f), s = this.talla;
    const R = [ [ b.X[0], b.Y[0], b.Z[0] ], [ b.X[1], b.Y[1], b.Z[1] ], [ b.X[2], b.Y[2], b.Z[2] ] ], F = [ -1, -1, 1 ];
    const T = R.map((fila, i) => fila.map((v, k) => v * F[i] * F[k]));
    const q = cuaternionDe(T);
    g.quaternion?.set?.(q[0], q[1], q[2], q[3]);
    g.scale?.setScalar?.(s);
    const hs = this.pj.huesos;
    let bp = null;
    if (this.esqueleto && this.modo === M.REPTA) {
      bp = this.bpos.map((p, i) => mezclar(this.bposAnt[i], p, alfa));
      if (hs?.length >= 4) for (let k = 1; k <= 3; k++) {
        const l = por(aLocal(restar(bp[k - 1], pos), b), 1 / s), a = this.angs[k], c = Math.cos(a), sn = Math.sin(a);
        const e = hs[HUESOS[k - 1]].matrix.elements;
        e[0] = c;
        e[1] = 0;
        e[2] = -sn;
        e[3] = 0;
        e[4] = 0;
        e[5] = 1;
        e[6] = 0;
        e[7] = 0;
        e[8] = sn;
        e[9] = 0;
        e[10] = c;
        e[11] = 0;
        e[12] = l[0];
        e[13] = l[1];
        e[14] = l[2];
        e[15] = 1;
        hs[HUESOS[k - 1]].matrixWorldNeedsUpdate = true;
      }
    }
    if (this.pj.mallas) for (const mm of this.pj.mallas) mm.visible = !this.cuerpoOculto;
    this.dibujarExtras(pos, b, bp);
  }
  clases() {
    const m0 = this.pj?.mallas?.[0], cont = this.pj?.contenedor;
    if (!m0 || !cont) return null;
    const Geo = m0.geometry.constructor, Atr = m0.geometry.getAttribute("position").constructor;
    return {
      Mesh: Object.getPrototypeOf(m0.constructor),
      Geo: Geo,
      Atr: Atr,
      Mat: m0.material.constructor,
      cont: cont
    };
  }
  malla(nombre, nV, indices, color, opacidad, mapa = null) {
    this.extras ??= {};
    if (this.extras[nombre]) return this.extras[nombre];
    const K = this.clases();
    if (!K) return null;
    const geo = new K.Geo;
    geo.setAttribute("position", new K.Atr(new Float32Array(nV * 3), 3));
    geo.setAttribute("normal", new K.Atr(new Float32Array(nV * 3), 3));
    geo.setAttribute("uv", new K.Atr(new Float32Array(nV * 2), 2));
    geo.setIndex(new K.Atr(new Uint16Array(indices), 1));
    const mat = new K.Mat({
      color: mapa ? 16777215 : color,
      map: mapa || null,
      transparent: true,
      opacity: opacidad,
      depthWrite: false,
      side: 2,
      polygonOffset: true,
      polygonOffsetFactor: -2,
      polygonOffsetUnits: -2
    });
    const me = new K.Mesh(geo, mat);
    me.userData ||= {};
    me.name = "hil " + nombre;
    me.frustumCulled = false;
    me.renderOrder = 2;
    K.cont.add(me);
    return this.extras[nombre] = me;
  }
  liberarMallas() {
    for (const me of Object.values(this.extras || {})) {
      me.removeFromParent?.();
      me.geometry?.dispose?.();
      me.material?.dispose?.();
    }
    this.extras = null;
  }
  uvRect(me, r) {
    const t = me.material.map, ua = me.geometry.getAttribute("uv");
    if (!t || !ua) return;
    const W = t.userData.ancho || 128, Hh = t.userData.alto || 128;
    const u0 = r[0] / W, v0 = r[1] / Hh, u1 = (r[0] + r[2]) / W, v1 = (r[1] + r[3]) / Hh;
    ua.array.set([ u1, v1, u0, v1, u0, v0, u1, v0 ]);
    ua.needsUpdate = true;
  }
  cargar(me, puntos, normales, pos, b) {
    const pa = me.geometry.getAttribute("position"), na = me.geometry.getAttribute("normal"), s = this.talla;
    puntos.forEach((p, i) => {
      const l = por(aLocal(restar(p, pos), b), 1 / s);
      pa.array.set(l, i * 3);
      na.array.set(aLocal(normales[i], b), i * 3);
    });
    pa.needsUpdate = true;
    na.needsUpdate = true;
  }
  dibujarExtras(pos, b, bp) {
    if (!this.pj?.mallas?.length) return;
    const s = this.talla;
    const pts = this.moco && !this.cuerpoOculto ? this.puntosMoco(pos, bp || this.bpos) : null;
    const idxCinta = [];
    for (let i = 0; i < 12; i++) idxCinta.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2);
    const cinta = pts ? this.malla("moco", 26, idxCinta, 10133632, .375, this.texturas?.moco) : this.extras?.moco;
    if (cinta) {
      cinta.visible = !!pts;
      if (pts) {
        const ua = cinta.geometry.getAttribute("uv");
        if (ua && !cinta.userData.uvListo) {
          for (let i = 0; i < 13; i++) ua.array.set([ 0, i / 12 * 4, 1, i / 12 * 4 ], i * 4);
          ua.needsUpdate = true;
          cinta.userData.uvListo = true;
        }
        const v = [], nn = [];
        pts.forEach((x, i) => {
          const t = unit(restar(pts[Math.min(12, i + 1)].p, pts[Math.max(0, i - 1)].p), this.f);
          const lado = por(unit(cruz(x.n, t), [ 1, 0, 0 ]), 8 * s), arriba = por(x.n, 1.5);
          v.push(sumar(sumar(x.p, lado), arriba), sumar(restar(x.p, lado), arriba));
          nn.push(x.n, x.n);
        });
        this.cargar(cinta, v, nn, pos, b);
        cinta.material.transparent = true;
        cinta.material.opacity = .375 * (1 - (this.moco.transp || 0));
      }
    }
    const w = this.w, hay = this.paso === P.APLASTADA && w.texTipo >= 0 && w.tam > 0;
    const mancha = hay ? this.malla("mancha", 4, [ 0, 1, 2, 0, 2, 3 ], 3803142, this.texturas?.mancha ? 1 : .9, this.texturas?.mancha) : this.extras?.mancha;
    if (mancha) {
      mancha.visible = hay;
      if (hay) {
        w.tamDibujo = Math.min(w.tam, w.tamDibujo + w.tam * .25);
        const t1 = unit(tangente(girarEje(this.f, this.n, w.texRot), this.n), [ 1, 0, 0 ]), t2 = cruz(this.n, t1);
        const h = mancha.material.map ? w.tamDibujo : w.tamDibujo / 2, c = sumar(this.pos, por(this.n, 1));
        if (mancha.material.map && mancha.userData.rect !== w.texTipo) {
          this.uvRect(mancha, RECT_HIL[w.texTipo] || RECT_HIL[0]);
          mancha.userData.rect = w.texTipo;
        }
        const v = [ [ 1, 1 ], [ -1, 1 ], [ -1, -1 ], [ 1, -1 ] ].map(([a, d]) => sumar(c, sumar(por(t1, a * h), por(t2, d * h))));
        this.cargar(mancha, v, v.map(() => this.n), pos, b);
        mancha.material.transparent = true;
        mancha.material.opacity = mancha.material.map ? 1 : .9;
      }
    }
    const hayG = hay && w.goteoTipo && w.goteo > 0;
    const chorro = hayG ? this.malla("chorro", 4, [ 0, 1, 2, 0, 2, 3 ], 2884868, this.texturas?.mancha ? 1 : .85, this.texturas?.mancha) : this.extras?.chorro;
    if (chorro) {
      chorro.visible = !!hayG;
      if (hayG) {
        const ab = this.abajoPared(), lado = por(unit(cruz(this.n, ab), [ 1, 0, 0 ]), chorro.material.map ? 20 : 10), c = sumar(this.pos, por(this.n, 1.2));
        if (chorro.material.map && chorro.userData.rect !== w.goteoTipo) {
          const r = RECT_HIL[w.goteoTipo] || RECT_HIL[3], ua = chorro.geometry.getAttribute("uv"), t = chorro.material.map;
          const u0 = r[0] / t.userData.ancho, u1 = (r[0] + r[2]) / t.userData.ancho, v0 = r[1] / t.userData.alto, v1 = (r[1] + r[3]) / t.userData.alto;
          ua.array.set([ u1, v0, u0, v0, u0, v1, u1, v1 ]);
          ua.needsUpdate = true;
          chorro.userData.rect = w.goteoTipo;
        }
        const fin = sumar(c, por(ab, w.goteo));
        const v = [ sumar(c, lado), restar(c, lado), restar(fin, lado), sumar(fin, lado) ];
        this.cargar(chorro, v, v.map(() => this.n), pos, b);
        chorro.material.transparent = true;
        chorro.material.opacity = chorro.material.map ? 1 : .85;
      }
    }
  }
}

function cuaternionDe(m) {
  const [m11, m12, m13] = m[0], [m21, m22, m23] = m[1], [m31, m32, m33] = m[2], tr = m11 + m22 + m33;
  if (tr > 0) {
    const s = .5 / Math.sqrt(tr + 1);
    return [ (m32 - m23) * s, (m13 - m31) * s, (m21 - m12) * s, .25 / s ];
  }
  if (m11 > m22 && m11 > m33) {
    const s = 2 * Math.sqrt(1 + m11 - m22 - m33);
    return [ .25 * s, (m12 + m21) / s, (m13 + m31) / s, (m32 - m23) / s ];
  }
  if (m22 > m33) {
    const s = 2 * Math.sqrt(1 + m22 - m11 - m33);
    return [ (m12 + m21) / s, .25 * s, (m23 + m32) / s, (m13 - m31) / s ];
  }
  const s = 2 * Math.sqrt(1 + m33 - m11 - m22);
  return [ (m13 + m31) / s, (m23 + m32) / s, .25 * s, (m21 - m12) / s ];
}
