// SH4 web — FeniXVOID · Project Ravenlight
import { DT, envolver, rumboHacia, frente, dist3, distXZ, girarY, azar, azar01 } from "./comun.js";

import { Multi } from "./ia_multi.js";

const AMORT_HITBACK = (30 / 31) ** 8;

export const A = {
  NT: 0,
  WLK: 1,
  WLKC: 2,
  WLKN: 3,
  WLKS: 4,
  DMH1: 5,
  DMH2: 6,
  DMP1: 7,
  DMP2: 8,
  DMP3: 9,
  DMC1: 10,
  DMC2: 11,
  XXP1: 12,
  XXP2: 13,
  XXP3: 14,
  XXS1: 15,
  XXS2: 16,
  XXG1: 17,
  XXG2: 18,
  XXC1: 19,
  UPD: 20,
  ROTD: 21,
  ATT1A: 22,
  ATT1B: 23,
  ATT1C: 24,
  ATT2A: 25,
  ATT2B: 26,
  ATT2C: 27,
  WKD1: 28,
  WKD2: 29,
  WO1: 30,
  WPS: 31,
  DNT: 32,
  TDM: 33,
  DM: 34
};

export const P = {
  INIT: 0,
  WANDER: 1,
  CHASE: 2,
  ATTACK: 3,
  CONFRONT: 4,
  CAPTURE: 5,
  CAPTURE2: 6,
  VACANT: 7,
  CRAWL: 8,
  CRAWLCHASE: 9,
  CAPTURE3: 10,
  TREPANG: 11,
  THROUGHWALL: 12,
  CHASEINWALL: 13,
  APPEARFROMWALL: 14,
  DAMAGE: 15,
  DOWN: 16,
  RISE: 17,
  EXORCISMDOWN: 18,
  CRAWLDAMAGE: 19,
  FINISHED: 20,
  EVENT: 21,
  WAIT: 22,
  FLAGWAIT: 23
};

export const NOMBRE_PASO = Object.fromEntries(Object.entries(P).map(([k, v]) => [ v, k ]));

export const MODELO_TIPO = [ "enemy_model_cyo.bin", "enemy_model_bab.bin" ];

export const PARTE_MODELO = [ {
  modelo: 0,
  texturas: 0,
  pelo: {
    modelo: 1,
    texturas: 1
  }
}, {
  modelo: 0,
  texturas: 0
} ];

export const OPCIONES = {
  alturaDelJuego: false
};

const ST = {
  SILENT: 2,
  ATTACK: 5,
  DAMAGE: 6,
  DEAD: 10
};

const CO = {
  NORMAL: 1,
  CONFRONT: 2,
  CHASE: 3,
  ATTACK: 5,
  AGARRA: 6,
  SOLO_VIDA: 7,
  LEVANTA: 8,
  DANIO: 9,
  CAIDA: 10,
  MUERTA: 11,
  EN_PARED: 13,
  EVENTO: 18,
  BANDERA: 17
};

const H_CABEZA = 11, H_MANO = 16;

const H_PELO_PUNTA = [ 80, 79, 86, 85 ];

const H_PELO_RAIZ = [ 38, 37, 40, 39 ];

const ALTURA_FLOTAR = -260;

const FLOTAR = {
  lower: 120,
  fall: 60,
  rise: 100,
  descent: 100,
  fallSpeed: 200
};

const GRAD = Math.PI / 180;

const azarS = () => Math.random() * 2 - 1;

function ruido(p1, p2) {
  if (p1 < 0 && azar(32768) & 8192) p1 = -p1;
  return ((p2 + 1) * p2 / (azar01() + p2) - p2) * p1;
}

function resorte(s, k, obj, a, b, rig, am) {
  const v = (ruido(-a, b) + s[k + 1] - (s[k] - obj) * rig) * am;
  s[k + 1] = v;
  s[k] += v;
}

const sumar = (a, b) => [ a[0] + b[0], a[1] + b[1], a[2] + b[2] ];

export class Pickgirl extends Multi {
  constructor(def, pj, anim, m) {
    super(def, pj, anim, m);
    this.tipo = "PICKGIRL";
    this.tipoParam = def.tipo_param || 0;
    this.param = m.parametros("PICKGIRL", this.tipoParam);
    this.hp = this.hpMax = this.param.vida;
    this.aguante = this.aguanteMax = this.param.aguante;
    this.radio = 60;
    this.altoJuego = 200;
    this.alto = 340;
    this.centroAlto = 170;
    this.radioGolpe = 80;
    this.sinPasos = true;
    this.sinSangre = true;
    this.visible = true;
    this.ausente = false;
    this.cond = CO.NORMAL;
    this.paso = P.INIT;
    this.sub = 0;
    this.golpes = [];
    this.danioPend = null;
    this.eds = [];
    this.edUsado = false;
    this.pelo = {
      activo: false,
      atrapado: false,
      desde: [ 0, 0, 0 ],
      hasta: [ 0, 0, 0 ],
      mechones: []
    };
    this.w = {
      hitback: [ 0, 0, 0 ],
      attackPos: [ 0, 0, 0 ],
      timer: 0,
      timer2: 0,
      moveSpeed: [ 1, 0 ],
      swing: 0,
      soundTimer: azar01() * 10,
      slowly: 0,
      attackSuccess: 0,
      fallingDirection: 0,
      downCount: 0,
      headMode: 0,
      continuity: 0,
      pelo: Array.from({
        length: 4
      }, () => [ 0, 0, 0, 0 ]),
      cabeza: [ this.rot, 0 ],
      modoAltura: 1,
      alturaJuego: ALTURA_FLOTAR,
      yJuego: this.pos[1],
      modoVel: 0,
      tFantasma: 0,
      tAgarre: 0,
      velaAcum: 0,
      modo: 0,
      objetivo: null,
      trabado: 0,
      tTrabado: 0,
      inicio: [ ...this.pos ]
    };
    const ini = def.estado_inicial & 15, iniAlta = (def.ini ?? 0) & 240;
    const escena = def.escena ?? this.m.escena?.() ?? (ini === 6 ? 20 : null);
    if (this.tipoParam === 0 && !this.bandera(this.banderaCynthia()) && escena !== 20) {
      this.ausente = true;
      this.visible = false;
      this.cond = 16;
    } else if (ini === 7 || iniAlta === 112) this.paso = P.WAIT; else if (ini === 6 && !this.bandera(this.banderaCynthia())) {
      this.cond = CO.EVENTO;
      this.visible = false;
      this.paso = P.EVENT;
    } else if (ini === 4) {
      this.cond = CO.EN_PARED;
      this.visible = false;
      this.paso = P.CHASEINWALL;
    }
    this.anim.poner(A.NT);
  }
  bandera(n) {
    const f = this.m.bandera;
    return typeof f === "function" ? !!f.call(this.m, n) : true;
  }
  banderaCynthia() {
    return this.def.etapa === "bd" ? 915 : 318;
  }
  caido() {
    return [ P.DOWN, P.EXORCISMDOWN, P.FINISHED, P.CRAWL, P.CRAWLCHASE, P.TREPANG, P.CRAWLDAMAGE ].includes(this.paso);
  }
  persigue() {
    return !this.ausente && [ P.CHASE, P.ATTACK, P.CONFRONT, P.CAPTURE, P.CAPTURE2, P.CAPTURE3, P.CRAWLCHASE, P.VACANT, P.THROUGHWALL, P.CHASEINWALL, P.APPEARFROMWALL ].includes(this.paso);
  }
  intocable() {
    return this.ausente || this.cond === CO.MUERTA || [ P.EVENT, P.FLAGWAIT, P.CHASEINWALL ].includes(this.paso) || this.paso === P.APPEARFROMWALL && this.sub <= 5;
  }
  pasoA(n) {
    this.paso = n;
    this.sub = 0;
  }
  animSet(n, {reiniciar: reiniciar = false, desde: desde = 0} = {}) {
    if (n !== this.anim.n || reiniciar || this.anim.fin && !this.anim.loop) this.anim.poner(n, {
      desde: desde
    });
    if (n >= A.ATT1A && n <= A.ATT2C) this.anim.velocidad(1 - this.w.slowly * .8);
  }
  terminaEn(s) {
    const a = this.anim;
    if (a.fin) return true;
    if (a.loop) return false;
    const v = Math.abs(a.vel) || 1, n = s * 30 * v;
    return a.vel >= 0 ? a.dur - a.t <= n : a.t <= n;
  }
  ed(prueba, accion) {
    this.eds.push([ prueba, accion ]);
  }
  tomarED() {
    if (this.edUsado) return false;
    this.edUsado = true;
    return true;
  }
  edPaso(prueba, n) {
    this.ed(prueba, () => {
      if (this.tomarED()) this.pasoA(n);
    });
  }
  jugadorNoAgarrable() {
    const j = this.jugador();
    return !j.existe || j.estado === ST.DAMAGE || j.estado === ST.DEAD;
  }
  distJ() {
    const j = this.jugador();
    return j.existe ? dist3(this.pos, j.pos) : 1e9;
  }
  vista() {
    return this.m.lineaDeVista?.(this) ?? true;
  }
  velocidadP() {
    return this.param.velocidad;
  }
  velocidad2P() {
    return this.param.velocidad2;
  }
  girarA(p, u) {
    const a = envolver(rumboHacia(p, this.pos) - this.rot);
    this.rot = envolver(this.rot + Math.max(-u, Math.min(u, a)));
  }
  mover(v) {
    this.mov[0] += v[0];
    this.mov[2] += v[2];
  }
  adelante(v) {
    const f = frente(this.rot, v);
    this.mov[0] += f[0];
    this.mov[2] += f[2];
  }
  altura(h, modo = null) {
    this.w.alturaJuego = h;
    if (modo != null) this.w.modoAltura = modo;
  }
  alturaJugador(d, modo = 3) {
    this.altura(d, modo);
  }
  fijarAlto(a) {
    this.altoJuego = a;
    this.alto = a >= 200 ? 340 : a + 40;
    this.centroAlto = this.alto / 2;
  }
  quitar(d) {
    this.hp -= d;
    if (this.hp <= 0) {
      this.hp = 0;
      this.aguante = 0;
      return 0;
    }
    this.aguante = Math.max(0, this.aguante - d);
    return this.aguante;
  }
  curar(d) {
    this.hp = Math.min(this.hpMax, this.hp + d);
    this.aguante = Math.min(this.hp, this.aguanteMax);
  }
  pruebaVida(a, b) {
    return (b - a) * azar01() + a < this.hp / this.hpMax * 100;
  }
  huesos(lista) {
    try {
      const r = this.pj.reproductor;
      if (r.anim !== this.anim.anim) r.poner(this.anim.anim);
      r.t = this.anim.t;
      r.loop = this.anim.loop;
      const pose = r.avanzar(0);
      return lista.map(i => sumar(this.pos, girarY([ pose.absPos[i * 3], pose.absPos[i * 3 + 1], pose.absPos[i * 3 + 2] ], this.rot)));
    } catch {
      const bajo = this.caido();
      return lista.map(i => sumar(this.pos, girarY(i === H_MANO ? [ 0, -200, 60 ] : i === H_CABEZA ? bajo ? [ 0, -40, 80 ] : [ 0, -247, 0 ] : bajo ? [ 0, -20, 140 ] : [ 0, -180, -20 ], this.rot)));
    }
  }
  hueso(i) {
    return this.huesos([ i ])[0];
  }
  agarreJugador() {
    const j = this.jugador();
    return [ j.pos[0], j.pos[1] - 280, j.pos[2] ];
  }
  tocaPunto(p, r = 20) {
    const j = this.jugador();
    if (!j.existe) return false;
    return distXZ(p, j.pos) <= r + (this.m.radioJugador ?? 40) && p[1] <= j.pos[1] + r && p[1] >= j.pos[1] - 360 - r;
  }
  tick() {
    this.posAnt = [ ...this.pos ];
    this.rotAnt = this.rot;
    this.mov = [ 0, 0, 0 ];
    this.eds.length = 0;
    this.edUsado = false;
    this.pelo.activo = false;
    this.pelo.atrapado = false;
    if (this.ausente) return;
    this.control();
    this.controlCabeza();
    this.anim.avanzar();
    for (const [prueba, accion] of this.eds) if (prueba()) accion();
    this.eds.length = 0;
    if (this.danioPend && !((this.paso === P.DAMAGE || this.paso === P.CRAWLDAMAGE) && this.sub === 0)) this.danioPend = null;
    this.moverCuerpo();
    this.comunFantasma();
  }
  control() {
    const w = this.w;
    if (this.cond !== CO.ATTACK) this.radio = w.modo === 4 || w.modo === 5 ? 80 : this.cond === CO.MUERTA ? 0 : 60;
    if (this.golpes.length) {
      this.danioPend = this.juntarGolpes(this.golpes);
      this.golpes.length = 0;
    }
    this.revisarDanio();
    this.vela();
    this.exorcismo();
    switch (this.paso) {
     case P.INIT:
      this.controlInit();
      break;

     case P.WANDER:
      this.controlWander();
      break;

     case P.CHASE:
      this.controlChase();
      break;

     case P.ATTACK:
      this.controlAttack();
      break;

     case P.CONFRONT:
      this.controlConfront();
      break;

     case P.CAPTURE:
      this.controlCapture();
      break;

     case P.CAPTURE2:
      this.controlCapture2();
      break;

     case P.VACANT:
      this.controlVacant();
      break;

     case P.CRAWL:
      this.controlCrawl();
      break;

     case P.CRAWLCHASE:
      this.controlCrawlChase();
      break;

     case P.CAPTURE3:
      this.controlCapture3();
      break;

     case P.TREPANG:
      this.controlTrepang();
      break;

     case P.THROUGHWALL:
      this.controlThroughWall();
      break;

     case P.CHASEINWALL:
      this.controlChaseInWall();
      break;

     case P.APPEARFROMWALL:
      this.controlAppearFromWall();
      break;

     case P.DAMAGE:
      this.controlDamage();
      break;

     case P.DOWN:
      this.controlDown();
      break;

     case P.RISE:
      this.controlRise();
      break;

     case P.EXORCISMDOWN:
      this.controlExorcismDown();
      break;

     case P.CRAWLDAMAGE:
      this.controlCrawlDamage();
      break;

     case P.FINISHED:
      this.controlFinished();
      break;

     case P.EVENT:
      this.controlEvent();
      break;

     case P.WAIT:
      this.controlWait();
      break;

     case P.FLAGWAIT:
      this.controlFlagWait();
      break;
    }
    if (this.anim.n === A.WLKS) this.adelante(1.95 * Math.abs(this.anim.vel));
    const hb = w.hitback;
    this.mov[0] += hb[0] * DT;
    this.mov[2] += hb[2] * DT;
    hb[0] *= AMORT_HITBACK;
    hb[1] *= AMORT_HITBACK;
    hb[2] *= AMORT_HITBACK;
    this.recuperar();
  }
  moverCuerpo() {
    const w = this.w, j = this.jugador(), pared = [ P.THROUGHWALL, P.CHASEINWALL, P.APPEARFROMWALL ].includes(this.paso);
    const L = Math.hypot(this.mov[0], this.mov[2]);
    const x0 = this.pos[0], z0 = this.pos[2], y0 = this.pos[1];
    if (pared || !this.m.mover) {
      this.m.moverFantasma?.(this, this.mov[0], this.mov[2]);
      this.pos[1] = j.existe && Math.abs(j.pos[1] - y0) < 400 ? j.pos[1] : y0;
    } else this.m.mover(this, this.mov[0], this.mov[2]);
    const hecho = Math.hypot(this.pos[0] - x0, this.pos[2] - z0);
    w.trabado = L > 1 && hecho < L * .3 ? 1 : 0;
    const piso = this.pos[1];
    if (!OPCIONES.alturaDelJuego) return;
    const cae = w.modoAltura === 11, obj = cae ? piso - FLOTAR.fall : Math.min(piso + w.alturaJuego, piso - FLOTAR.lower);
    const v = (w.yJuego < obj ? cae ? FLOTAR.fallSpeed : FLOTAR.descent : FLOTAR.rise) * DT;
    w.yJuego += Math.max(-v, Math.min(v, obj - w.yJuego));
    this.pos[1] = w.yJuego;
  }
  comunFantasma() {
    const w = this.w, j = this.jugador();
    if (w.modoVel && j.existe) {
      const f = frente(j.rot), dx = this.pos[0] - j.pos[0], dz = this.pos[2] - j.pos[2], L = Math.hypot(dx, dz) || 1;
      const c = (f[0] * dx + f[2] * dz) / L;
      if (w.modoVel === 1 && c <= 0) w.modoVel = 2; else if (w.modoVel === 2 && c > 0) w.modoVel = 1;
    }
    if (w.tFantasma > 0) w.tFantasma = Math.max(0, w.tFantasma - DT);
  }
  velocidadMov() {
    const w = this.w, obj = 1 - w.slowly * .9;
    resorte(w.moveSpeed, 0, obj, .05, .1, .02, .95);
    w.moveSpeed[0] = Math.max(0, Math.min(obj + 1, w.moveSpeed[0]));
    if (w.moveSpeed[0] <= 0) w.moveSpeed[1] = 0;
    return w.moveSpeed[0];
  }
  ms() {
    return this.w.moveSpeed[0];
  }
  recuperar() {
    if (this.cond >= 8 && this.cond <= 11) return;
    const r = this.param.recupera * DT;
    const lleno = !(this.aguante < this.aguanteMax && this.aguante < this.hp);
    if (lleno && this.w.downCount) this.curar(r * .5); else this.aguante = Math.min(this.aguanteMax, this.aguante + r, this.hp);
  }
  controlCabeza() {
    const w = this.w, j = this.jugador(), c = w.cabeza, u = Math.PI * DT;
    let objR = this.rot, objP = 0;
    if (w.headMode === 1 && j.existe) {
      objR = this.rot + Math.max(-1.3962634, Math.min(1.3962634, envolver(rumboHacia(j.pos, this.pos) - this.rot)));
      const cab = this.pos[1] - 247, pe = j.pos[1] - 250, d = distXZ(j.pos, this.pos) || 1;
      objP = Math.max(-.34906585, Math.min(.34906585, Math.atan2(pe - cab, d)));
    } else if (w.headMode === 0) {
      c[0] = this.rot;
      c[1] = 0;
      return;
    }
    const dr = envolver(objR - c[0]);
    c[0] = envolver(c[0] + Math.max(-u, Math.min(u, dr)));
    const dp = objP - c[1];
    c[1] += Math.max(-u, Math.min(u, dp));
    if (w.headMode === 2 && Math.abs(dr) < .001 && Math.abs(dp) < .001) w.headMode = 0;
  }
  cabezaIniciar() {
    if (this.w.headMode === 0) {
      this.w.cabeza[0] = this.rot;
      this.w.cabeza[1] = 0;
    }
    this.w.headMode = 1;
  }
  cabezaParar() {
    if (this.w.headMode === 1) this.w.headMode = 2;
  }
  confrontar() {
    const w = this.w, j = this.jugador();
    if (this.tipoParam > 0 || !j.existe) return 0;
    const cab = this.hueso(H_CABEZA);
    let atrapado = false;
    const puntas = [];
    for (let i = 0; i < 4; i++) {
      const s = w.pelo[i];
      resorte(s, 0, 0, .017453292, .017453292, .01, .98);
      resorte(s, 2, 0, .0034906585, .0017453292, .01, .98);
      const r = w.cabeza[0] + s[0], p = w.cabeza[1] + s[2];
      const v = [ Math.sin(r) * Math.cos(p) * 200, Math.sin(p) * 200, Math.cos(r) * Math.cos(p) * 200 ];
      const punta = sumar(cab, v), medio = sumar(cab, v.map(x => x * .5));
      puntas.push(punta);
      if (!atrapado && (this.tocaPunto(punta) || this.tocaPunto(medio))) atrapado = true;
    }
    this.pelo = {
      activo: true,
      atrapado: atrapado,
      desde: cab,
      hasta: puntas.reduce((a, p) => sumar(a, p.map(x => x / 4)), [ 0, 0, 0 ]),
      mechones: puntas
    };
    if (!atrapado) return 0;
    const dx = cab[0] - j.pos[0], dz = cab[2] - j.pos[2], L = Math.hypot(dx, dz) || 1;
    if (this.m.tocaJugador?.(this)) this.m.girarJugador?.(this, Math.atan2(dx, dz));
    this.m.arrastrarJugador?.(this, dx / L * 440 * DT, dz / L * 440 * DT);
    return distXZ(this.pos, j.pos) <= 160 ? 1 : 0;
  }
  peloSoltar() {
    this.pelo.activo = false;
  }
  peloEnElPiso() {
    if (this.tipoParam > 0 || !this.jugador().existe) return false;
    return this.huesos(H_PELO_RAIZ).some(p => this.tocaPunto(p));
  }
  ve(dl, dl2, ang) {
    const j = this.jugador();
    if (!j.existe || Math.abs(j.pos[1] - this.pos[1]) > 300) return false;
    const d = distXZ(this.pos, j.pos), a = Math.abs(envolver(rumboHacia(j.pos, this.pos) - this.rot));
    return d <= dl2 || d <= dl && a <= ang && this.vista();
  }
  sentidoJugador() {
    const silencio = this.jugador().estado === ST.SILENT;
    if (this.paso === P.CHASE) {
      const nosight = this.sub < 4;
      this.ed(() => this.ve(2e3, 1e3, Math.PI / 2) !== nosight, () => {
        if (!this.tomarED()) return;
        if (this.m.puedeEntrarPared?.(this)) this.pasoA(P.CHASEINWALL); else this.sub = 0;
      });
    } else if (this.paso === P.CRAWL) {
      this.edPaso(() => silencio ? this.ve(400, 200, Math.PI / 4) : this.ve(600, 300, Math.PI / 2), P.CRAWLCHASE);
    } else if (this.paso === P.CRAWLCHASE) {
      this.edPaso(() => !this.ve(2e3, 600, Math.PI / 2), P.CRAWL);
    } else {
      this.edPaso(() => silencio ? this.ve(1e3, 200, Math.PI / 4) : this.ve(1e3, 600, 1.1780972), P.CHASE);
    }
  }
  sentidoAtaque() {
    this.edPaso(() => this.ve(240, 60, Math.PI / 4), P.ATTACK);
  }
  recibir(g) {
    this.golpes.push(g);
  }
  juntarGolpes(gs) {
    const g = {
      ...gs[gs.length - 1]
    };
    g.danio = gs.reduce((s, x) => s + (x.danio || 0), 0);
    const d = gs.reduce((a, x) => sumar(a, (x.dir || [ 0, 0, 1 ]).map(v => v * (x.shock || 1))), [ 0, 0, 0 ]);
    const L = Math.hypot(d[0], d[1], d[2]);
    g.dir = L > 1e-6 ? d.map(v => v / L) : [ 0, 0, 1 ];
    g.shock = Math.max(...gs.map(x => x.shock || 0));
    return g;
  }
  revisarDanio() {
    const hay = () => !!this.danioPend;
    if (this.cond === CO.SOLO_VIDA || this.cond === CO.LEVANTA) {
      this.ed(hay, () => this.soloVida());
      return;
    }
    switch (this.paso) {
     case P.WANDER:
     case P.CHASE:
     case P.ATTACK:
     case P.CONFRONT:
     case P.VACANT:
     case P.THROUGHWALL:
     case P.WAIT:
      this.edPaso(hay, P.DAMAGE);
      break;

     case P.CAPTURE:
     case P.CAPTURE2:
     case P.CAPTURE3:
      {
        const fuerte = (this.anim.n === A.ATT1B || this.anim.n === A.ATT2B) && this.w.timer > 0;
        if (fuerte) this.ed(hay, () => this.soloVida()); else this.edPaso(hay, P.DAMAGE);
        break;
      }

     case P.CRAWL:
     case P.CRAWLCHASE:
     case P.TREPANG:
     case P.CRAWLDAMAGE:
      this.edPaso(hay, P.CRAWLDAMAGE);
      break;

     case P.APPEARFROMWALL:
      if (this.sub > 5) this.edPaso(hay, P.DAMAGE);
      break;

     case P.DAMAGE:
      this.ed(hay, () => this.danioAdicional());
      break;

     case P.DOWN:
     case P.EXORCISMDOWN:
      this.ed(() => !!this.m.espadaClavada?.(this), () => this.clavar());
      this.ed(hay, () => this.danioCaida());
      break;
    }
  }
  soloVida() {
    const g = this.danioPend;
    this.danioPend = null;
    if (g) this.quitar(g.danio);
  }
  sonidoDanio(g) {
    const silencioso = /STUNGUN|SPRAY|CHAINSAW/.test(String(g.golpe || ""));
    this.m.sonido?.(this, silencioso ? 60356 : 60351);
  }
  animDanio(g, lado, abajo) {
    let an = A.DMH1, r = 1;
    switch (g.bdt) {
     case 0:
      if (g.atributo === 7) {
        this.quitar(this.hpMax);
        an = lado + A.XXG1;
        r = 2;
      } else if (abajo) {
        an = lado + A.XXG1;
        r = 2;
      } else an = lado + A.DMP1;
      break;

     case 1:
     case 13:
     case 15:
     case 17:
      an = lado + A.XXG1;
      r = 2;
      break;

     case 2:
     case 8:
     case 21:
      if (abajo) {
        an = lado + A.XXP1;
        r = 2;
      } else an = lado + A.DMH1;
      break;

     case 3:
     case 9:
     case 10:
     case 14:
      if (abajo) {
        an = lado + A.XXP1;
        r = 2;
      } else an = lado + A.DMP1;
      break;

     case 4:
     case 6:
     case 11:
     case 12:
      if (abajo) {
        an = A.XXP3;
        r = 2;
      } else an = A.DMP3;
      break;

     case 5:
     case 7:
      if (abajo) {
        an = lado + A.XXS1;
        r = 2;
      } else an = lado + A.DMP1;
      break;

     case 16:
      an = A.XXP3;
      r = 2;
      break;

     case 18:
      if (abajo) {
        an = A.XXC1;
        r = 2;
      } else an = lado + A.DMP1;
      break;

     case 19:
     case 20:
      if (abajo) {
        an = A.XXC1;
        r = 2;
      } else {
        an = lado + A.DMC1;
        r = 3;
      }
      break;

     default:
      if (g.golpe === "BAK_PLAYER_SPRAY") {
        an = lado + A.DMH1;
        r = 4;
      }
      break;
    }
    this.animSet(an, {
      reiniciar: true
    });
    this.anim.velocidad(r === 1 ? 1 + azar01() * .5 : r === 2 ? 1 + azarS() * .3 : 1);
    this.w.timer = 0;
    return r;
  }
  aplicarGolpe(g, adicional) {
    const w = this.w;
    if (g.atributo === 7) this.quitar(this.hpMax);
    const resto = this.quitar(g.danio);
    w.hitback = sumar(w.hitback, g.dir.map(v => v * (g.shock || 0)));
    this.sonidoDanio(g);
    if (adicional && (!this.tomarED() || this.sub === 2)) return;
    const local = girarY(g.dir, -this.rot), lado = local[2] > 0 ? 1 : 0;
    const r = this.animDanio(g, lado, resto <= 0);
    if (!adicional) this.altura(-200);
    if (r === 2) {
      this.fijarAlto(60);
      this.w.modoAltura = 11;
      if (g.golpe === "BAK_PLAYER_SILVER_BULLET") {
        this.cond = CO.CAIDA;
        this.pasoA(P.EXORCISMDOWN);
        this.sub = 1;
        w.timer = 0;
        return;
      }
    } else if (!adicional) this.w.modoAltura = 3;
    this.sub = r;
    w.timer = 0;
  }
  danioAdicional() {
    const g = this.danioPend;
    this.danioPend = null;
    if (g) this.aplicarGolpe(g, true);
  }
  danioCaida() {
    const g = this.danioPend, w = this.w;
    this.danioPend = null;
    if (!g) return;
    this.quitar(g.danio);
    if (g.atributo === 7 || g.atributo === 8) this.quitar(this.hpMax);
    this.sonidoDanio(g);
    if (!this.tomarED()) return;
    this.animSet(A.ROTD, {
      reiniciar: true
    });
    if (this.paso !== P.EXORCISMDOWN) {
      if (g.atributo === 6 || g.atributo === 7) {
        w.tFantasma = (azar01() + 1) * 600;
        this.pasoA(P.EXORCISMDOWN);
        this.sub = 2;
      } else w.tFantasma *= .5;
    }
    w.continuity++;
    if (this.hp > 0) {
      if (azar(4) + 5 <= w.continuity) {
        this.cond = CO.SOLO_VIDA;
        w.tFantasma = 0;
      }
    } else if (w.tFantasma >= 27) w.tFantasma += 3; else w.tFantasma = 30;
    w.tFantasma += azar01() * 2;
  }
  clavar() {
    if (!this.tomarED()) return;
    this.quitar(this.hpMax);
    this.m.efecto?.(this, "espada", [ this.pos[0], this.pos[1] - 60, this.pos[2] ]);
    this.pasoA(P.FINISHED);
    this.sub = 99;
  }
  vela() {
    const v = this.m.vela?.(this) || 0;
    if (v <= 0) return;
    const c = this.cond, n = this.anim.n;
    if (c === CO.DANIO && (n >= A.XXP1 && n <= A.XXC1 || n === A.DNT || n === A.ROTD)) return;
    if ([ 1, 2, 3, 4, 5, 7, 8, 9, 12, 13 ].includes(c)) this.w.velaAcum += v * (this.paso === P.APPEARFROMWALL ? 2 : 1);
  }
  exorcismo() {
    const w = this.w;
    if (w.velaAcum <= 0) {
      w.slowly = Math.max(0, w.slowly - DT);
      return;
    }
    this.hp = Math.max(0, this.hp - w.velaAcum * 10);
    if (this.hp > 0) w.velaAcum = 0; else {
      if (this.cond === CO.EN_PARED) return;
      switch (this.paso) {
       case P.APPEARFROMWALL:
        if (this.sub > 5) this.pasoA(P.EXORCISMDOWN);
        break;

       case P.DOWN:
        if (this.sub === 4) this.pasoA(P.EXORCISMDOWN); else {
          this.pasoA(P.EXORCISMDOWN);
          this.sub = 1;
        }
        break;

       case P.EXORCISMDOWN:
        w.velaAcum = 0;
        if (w.tFantasma < 300) w.tFantasma = 300;
        if (this.sub === 3) {
          this.cond = CO.CAIDA;
          this.sub = 2;
        }
        break;

       case P.FINISHED:
        break;

       default:
        this.pasoA(P.EXORCISMDOWN);
      }
    }
    w.slowly = Math.min(1, w.slowly + DT);
  }
  agarrarJugador(danio) {
    if (this.m.agarradoPor && this.m.agarradoPor !== this) return false;
    this.w.agarrando = true;
    this.w.tAgarre = 0;
    this.m.agarrar(this, 1, danio, "PICKGIRL_AGARRE");
    return true;
  }
  sostener(p) {
    this.m.sujetarJugador?.(this, p);
    const s = this.m.sigueAgarrado?.(this);
    if (s != null) return !!s;
    this.w.tAgarre += DT;
    return this.w.tAgarre < 4;
  }
  soltarJugador() {
    if (this.w.agarrando) {
      this.w.agarrando = false;
      this.m.soltar(this);
    }
  }
  attackStep1() {
    if (!this.tomarED()) return;
    const w = this.w, j = this.jugador(), mano = this.hueso(H_MANO), f = frente(this.rot), dot = this.dotJugador(f);
    const pa = this.agarreJugador(), v = [ pa[0] - mano[0], pa[1] - mano[1], pa[2] - mano[2] ];
    const alcanza = v[0] * f[0] + v[2] * f[2] <= 0 || v[0] * v[0] + v[1] * v[1] + v[2] * v[2] <= 6400;
    if (!this.jugadorNoAgarrable() && Math.abs(j.pos[1] - this.pos[1]) < 300 && (dot <= -.70710677 || dot >= .70710677) && alcanza && this.agarrarJugador(this.param.ataque1)) {
      this.cond = CO.AGARRA;
      this.rot = rumboHacia(j.pos, this.pos);
      this.m.girarJugador?.(this, envolver(this.rot + (dot >= 0 ? 0 : Math.PI)));
      this.m.sonido?.(this, 61354);
      w.attackPos = girarY([ mano[0] - this.pos[0], mano[1] - this.pos[1], mano[2] - this.pos[2] ], -this.rot);
      this.peloSoltar();
      w.modo = 6;
      this.animSet(A.ATT1B);
      w.timer = .5;
      this.sub++;
      return;
    }
    this.animSet(A.ATT1C);
    this.sub = 4;
  }
  attack2Step1() {
    if (!this.tomarED()) return;
    const w = this.w, j = this.jugador(), f = frente(this.rot);
    const mano = sumar(this.pos, girarY([ 0, -300, 60 ], this.rot)), pa = this.agarreJugador();
    const d2 = (pa[0] - mano[0]) ** 2 + (pa[1] - mano[1]) ** 2 + (pa[2] - mano[2]) ** 2;
    if (!this.jugadorNoAgarrable() && Math.abs(j.pos[1] - this.pos[1]) < 300 && d2 <= 25600 && this.dotJugador(f) < -.70710677 && this.agarrarJugador(this.param.ataque2)) {
      this.cond = CO.AGARRA;
      this.m.girarJugador?.(this, envolver(rumboHacia(this.pos, j.pos)));
      this.m.sonido?.(this, 61354);
      w.modo = 6;
      this.animSet(A.ATT2B);
      this.peloSoltar();
      this.curar(50);
      w.timer = .5;
      this.sub++;
      return;
    }
    w.timer -= DT;
    if (w.timer <= 0) {
      this.altura(ALTURA_FLOTAR);
      this.animSet(A.ATT2C);
      this.sub = 4;
    }
  }
  attackEnd() {
    this.peloSoltar();
    if (!this.tomarED()) return;
    const w = this.w;
    if (!w.attackSuccess) {
      this.pasoA(azar01() < .3 ? P.CHASE : P.CONFRONT);
      return;
    }
    if (this.sub !== 4 && azar01() >= .7) {
      this.pasoA(this.pruebaVida(0, 100) ? P.CONFRONT : P.THROUGHWALL);
      return;
    }
    this.pasoA(P.VACANT);
  }
  attackEnd2() {
    this.peloSoltar();
    if (this.tomarED()) this.pasoA(this.pruebaVida(0, 100) ? P.CONFRONT : P.THROUGHWALL);
  }
  attackEnd3() {
    if (this.tomarED()) this.pasoA(this.dotJugador(frente(this.rot)) < .70710677 ? P.CONFRONT : P.CAPTURE2);
  }
  aCapture3() {
    this.w.velaAcum = 0;
    this.fijarAlto(60);
    this.radio = 60;
    this.curar(this.aguanteMax);
    this.pasoA(P.CAPTURE3);
  }
  levantarseDelPiso() {
    this.fijarAlto(60);
    this.radio = 60;
    this.animSet(A.WLKC);
    this.curar(this.aguanteMax);
  }
  revivir() {
    if (!this.tomarED()) return;
    const w = this.w;
    w.downCount++;
    if (w.velaAcum <= 0) {
      if (this.hp > 0) this.curar(this.hpMax / (w.downCount + 3)); else {
        w.downCount = Math.floor(w.downCount / 2);
        this.curar(this.hpMax * .5);
      }
    }
    this.fijarAlto(200);
    this.pasoA(this.paso !== P.TREPANG && this.tipoParam < 1 ? P.CRAWL : P.RISE);
  }
  controlInit() {
    this.altura(ALTURA_FLOTAR, 1);
    this.w.yJuego = this.pos[1] + ALTURA_FLOTAR;
    this.pasoA(P.WANDER);
  }
  puntoAlAzar(margen = 60) {
    const p = this.m.puntoAlAzar?.(this, margen);
    if (p) return [ p[0], p[1] ?? this.pos[1], p[2] ];
    const a = azar01() * Math.PI * 2, r = azar01() * 800, o = this.w.inicio;
    return [ o[0] + Math.sin(a) * r, this.pos[1], o[2] + Math.cos(a) * r ];
  }
  controlWander() {
    const w = this.w, j = this.jugador();
    switch (this.sub) {
     case 0:
      this.animSet(A.WLK);
      w.modoVel = 0;
      this.altura(ALTURA_FLOTAR, 1);
      this.fijarAlto(200);
      w.modo = 0;
      this.cond = CO.NORMAL;
      this.cabezaParar();
      w.moveSpeed = [ 1, 0 ];
      this.sub = 1;

     case 1:
      {
        w.objetivo = this.puntoAlAzar(60);
        const d = [ w.objetivo[0] - this.pos[0], 0, w.objetivo[2] - this.pos[2] ], f = frente(this.rot);
        if (d[0] * f[0] + d[2] * f[2] > 0) {
          this.sub = 2;
          this.wanderAndar();
          return;
        }
        const dj = j.existe ? distXZ(this.pos, j.pos) : 1e9;
        if (!this.vista() || azar01() * 1e3 <= dj) {
          if (dj > 1e3 && azar01() < .1) {
            w.modoAltura = 11;
            this.fijarAlto(80);
            this.radio = 80;
            this.animSet(A.WLKC, {
              desde: -1
            });
            this.anim.velocidad(-1);
            w.modo = 4;
            this.sub = 4;
            return;
          }
          this.animSet(A.NT);
          w.timer = azarS() * 2 + 3;
          this.sub = 3;
          this.sentidoJugador();
          return;
        }
        this.pasoA(P.CONFRONT);
        return;
      }

     case 2:
      this.wanderAndar();
      return;

     case 3:
      w.timer -= DT;
      if (w.timer <= 0) {
        this.animSet(A.WLK);
        w.moveSpeed = [ 0, 0 ];
        this.sub = 2;
      }
      break;

     case 4:
      this.edPaso(() => this.anim.fin, P.CRAWL);
      return;
    }
    this.sentidoJugador();
  }
  wanderAndar() {
    const w = this.w;
    this.velocidadMov();
    this.girarA(w.objetivo, DT * 1.5707964);
    this.adelante(this.velocidadP() * this.ms() * DT);
    this.ed(() => distXZ(w.objetivo, this.pos) < 200, () => {
      if (this.tomarED()) this.sub--;
    });
    this.sentidoJugador();
  }
  controlChase() {
    const w = this.w, j = this.jugador();
    if (this.sub === 0) {
      this.animSet(A.WLK);
      w.modoVel = 1;
      this.altura(ALTURA_FLOTAR, 1);
      this.fijarAlto(200);
      w.modo = 0;
      this.cond = CO.CHASE;
      this.cabezaIniciar();
      w.moveSpeed = [ 1, 0 ];
      w.timer = 0;
      this.sub = 1;
    } else if (this.sub !== 1) {
      this.sentidoJugador();
      this.sentidoAtaque();
      return;
    }
    if (!j.existe) return;
    this.velocidadMov();
    if (!this.vista() || w.trabado) {
      w.timer += DT;
      if (w.timer >= 2) {
        this.cond = CO.EN_PARED;
        this.pasoA(P.CHASEINWALL);
        return;
      }
    } else w.timer = 0;
    this.girarA(j.pos, DT * 1.5707964);
    const v = w.modoVel === 2 ? this.velocidad2P() : this.velocidadP();
    this.adelante(v * this.ms() * DT);
    this.sentidoJugador();
    this.sentidoAtaque();
  }
  controlAttack() {
    const w = this.w, j = this.jugador();
    switch (this.sub) {
     case 0:
      this.animSet(A.ATT1A);
      this.alturaJugador(-220);
      w.modoVel = 0;
      w.modo = 3;
      this.cond = CO.ATTACK;
      this.peloSoltar();
      this.cabezaParar();
      this.sub = 1;

     case 1:
      if (j.existe) this.girarA(j.pos, DT * 1.5707964);
      this.adelante(this.velocidadP() * DT);
      this.ed(() => this.anim.fin, () => this.attackStep1());
      return;

     case 2:
      if (!this.sostener(sumar(this.pos, girarY(w.attackPos, this.rot)))) {
        this.soltarJugador();
        w.attackSuccess++;
        this.animSet(A.ATT1C);
        this.sub = 3;
      }
      return;

     case 3:
     case 4:
      this.ed(() => this.terminaEn(.5), () => this.attackEnd());
      return;
    }
  }
  controlConfront() {
    const w = this.w, j = this.jugador();
    if (this.sub === 0) {
      if (this.tipoParam > 0) {
        this.pasoA(P.CHASE);
        return;
      }
      this.animSet(A.NT);
      this.altura(ALTURA_FLOTAR, 1);
      w.modo = 0;
      this.cond = CO.CONFRONT;
      this.cabezaIniciar();
      w.timer = 0;
      w.timer2 = 0;
      this.sub = 1;
    }
    if (this.sub === 1 && j.existe) {
      const f = frente(this.rot, this.velocidadP() * DT);
      this.mover(f);
      if (this.confrontar()) {
        this.pasoA(P.CAPTURE);
        return;
      }
    }
    if (j.existe) this.girarA(j.pos, DT * 1.0471976);
    if (!this.vista()) {
      w.timer2 += DT;
      if (w.timer2 > 2 && this.distJ() > 1600) {
        this.peloSoltar();
        this.cabezaParar();
        this.pasoA(P.CHASE);
      }
    } else w.timer2 = 0;
  }
  controlCapture() {
    const w = this.w, j = this.jugador();
    switch (this.sub) {
     case 0:
      this.alturaJugador(-160);
      w.modo = 0;
      this.cond = CO.ATTACK;
      this.cabezaParar();
      this.animSet(A.ATT2A);
      this.sub = 1;

     case 1:
      this.confrontar();
      if (j.existe) this.girarA(j.pos, DT * 1.0471976);
      this.ed(() => this.terminaEn(.5), () => this.attack2Step1());
      return;

     case 2:
      w.timer -= DT;
      if (!this.sostener(sumar(this.pos, girarY([ 0, -300, 60 ], this.rot)))) {
        this.soltarJugador();
        w.attackSuccess++;
        this.animSet(A.ATT2C);
        this.altura(ALTURA_FLOTAR);
        this.peloSoltar();
        this.sub = 3;
      }
      return;

     case 3:
      this.ed(() => this.terminaEn(.5), () => this.attackEnd2());
      return;

     case 4:
      this.confrontar();
      if (j.existe) this.girarA(j.pos, DT * 1.0471976);
      this.ed(() => this.terminaEn(.5), () => this.attackEnd3());
      return;
    }
  }
  controlCapture2() {
    const w = this.w, j = this.jugador();
    switch (this.sub) {
     case 0:
      this.animSet(A.ATT1A);
      this.alturaJugador(-220);
      w.modoVel = 0;
      w.modo = 3;
      this.cond = CO.ATTACK;
      this.cabezaParar();
      this.sub = 1;

     case 1:
      this.confrontar();
      if (j.existe) this.girarA(j.pos, DT * 1.0471976);
      this.ed(() => this.anim.fin, () => this.attackStep1());
      return;

     case 2:
      w.timer -= DT;
      if (!this.sostener(sumar(this.pos, girarY(w.attackPos, this.rot)))) {
        this.soltarJugador();
        w.attackSuccess++;
        this.animSet(A.ATT1C);
        this.sub = 3;
      }
      return;

     case 3:
      this.ed(() => this.terminaEn(.5), () => this.attackEnd());
      return;

     case 4:
      this.confrontar();
      if (j.existe) this.girarA(j.pos, DT * 1.0471976);
      this.ed(() => this.terminaEn(.5), () => this.attackEnd3());
      return;
    }
  }
  controlVacant() {
    const w = this.w;
    if (this.sub === 0) {
      this.animSet(A.NT);
      this.altura(ALTURA_FLOTAR, 1);
      w.modo = 0;
      this.cond = CO.NORMAL;
      this.cabezaParar();
      w.timer2 = 0;
      w.timer = (azar01() + 1) * 3;
      this.sub = 1;
    }
    if (this.sub === 1) {
      if (this.m.tocaJugador?.(this)) {
        const d = this.dotJugador(frente(this.rot));
        if (!this.jugadorNoAgarrable() && (d <= -.70710677 || d >= .70710677)) {
          this.pasoA(P.ATTACK);
          return;
        }
      }
      w.timer -= DT;
      if (w.timer <= 0) {
        this.pasoA(P.WANDER);
      }
    }
    if (this.distJ() >= 600) w.timer2 = 0; else {
      w.timer2 += DT;
      if (w.timer2 >= 1.5) this.pasoA(P.CONFRONT);
    }
  }
  controlCrawl() {
    const w = this.w;
    const caminar = () => {
      this.girarA(w.objetivo, DT * .34906587 * (w.trabado ? 4 : 1));
      this.velocidadMov();
      this.anim.velocidad(this.ms() * .5 + .75);
      this.ed(() => distXZ(w.objetivo, this.pos) < 200, () => {
        if (this.tomarED()) this.sub--;
      });
    };
    switch (this.sub) {
     case 0:
      this.animSet(A.WLKS);
      this.fijarAlto(80);
      this.radio = 80;
      w.modoAltura = 11;
      w.modo = 4;
      this.cond = CO.NORMAL;
      w.moveSpeed = [ 1, 0 ];
      w.timer2 = 0;
      w.continuity = 0;
      this.sub = 1;

     case 1:
      {
        w.objetivo = this.puntoAlAzar(60);
        const d = [ w.objetivo[0] - this.pos[0], 0, w.objetivo[2] - this.pos[2] ], f = frente(this.rot);
        if (d[0] * f[0] + d[2] * f[2] <= 0 || azar01() >= .1) {
          this.sub = 2;
          caminar();
        } else {
          this.animSet(A.WLKN);
          w.timer = azarS() * 2 + 3;
          this.sub = 3;
        }
        break;
      }

     case 2:
      caminar();
      break;

     case 3:
      w.timer -= DT;
      if (w.timer <= 0) {
        this.animSet(A.WLKS);
        this.sub = 2;
      }
      break;

     case 4:
      this.edPaso(() => this.anim.fin, P.WANDER);
      return;
    }
    if (this.peloEnElPiso()) {
      w.timer2 += DT;
      if (w.timer2 > 1) {
        this.aCapture3();
        return;
      }
    } else w.timer2 = Math.max(0, w.timer2 - DT);
    this.sentidoJugador();
  }
  controlCrawlChase() {
    const w = this.w, j = this.jugador();
    if (this.sub === 0) {
      this.animSet(A.WLKS);
      this.fijarAlto(80);
      this.radio = 80;
      w.modoAltura = 11;
      w.modo = 4;
      this.cond = CO.NORMAL;
      w.timer = 0;
      w.timer2 = 0;
      w.continuity = 0;
      this.sub = 1;
    } else if (this.sub === 2) {
      this.edPaso(() => this.anim.fin, P.CHASE);
      return;
    }
    if (this.sub === 1) {
      if (!j.existe || this.distJ() > 2e3) {
        this.levantarseDelPiso();
        this.sub = 2;
        return;
      }
      this.girarA(j.pos, DT * .34906587 * (w.trabado ? 4 : 1));
      this.velocidadMov();
      this.anim.velocidad((this.ms() + 1) * .75);
    }
    w.timer = this.distJ() < 200 ? w.timer + DT : Math.max(0, w.timer - DT);
    w.timer2 = this.m.tocaJugador?.(this) ? w.timer2 + DT : Math.max(0, w.timer2 - DT);
    if (w.timer >= 1 || w.timer2 >= .2) this.aCapture3();
  }
  controlCapture3() {
    const w = this.w, j = this.jugador();
    if (this.sub === 0) {
      w.modo = 0;
      this.cond = CO.LEVANTA;
      this.cabezaParar();
      this.animSet(A.WLKC);
      w.timer = 1;
      this.sub = 1;
    }
    this.confrontar();
    if (j.existe) this.girarA(j.pos, DT * .2617994);
    if (this.anim.fin) {
      this.cond = CO.ATTACK;
      this.fijarAlto(200);
      this.alturaJugador(-160, 1);
      this.animSet(A.ATT2A);
      this.pasoA(P.CAPTURE);
      this.sub = 1;
    }
  }
  controlTrepang() {
    const w = this.w, j = this.jugador();
    switch (this.sub) {
     case 0:
      this.animSet(A.DM);
      this.fijarAlto(80);
      this.radio = 80;
      w.modoAltura = 11;
      w.modo = 4;
      this.cond = CO.NORMAL;
      w.timer2 = 0;
      w.moveSpeed = [ 1, 0 ];
      w.timer = azar01() * 15 + 5;
      this.sub = 1;

     case 1:
      w.objetivo = this.puntoAlAzar(60);
      this.sub = 2;

     case 2:
      {
        w.timer2 += DT;
        if (w.timer2 >= 3 && this.m.tocaJugador?.(this) && j.existe) {
          const v = [ j.pos[0] - this.pos[0], 0, j.pos[2] - this.pos[2] ], f = frente(this.rot);
          if (v[0] * f[0] + v[2] * f[2] < 0) {
            this.aCapture3();
            return;
          }
          this.animSet(A.UPD);
          this.cond = CO.LEVANTA;
          this.sub = 3;
          return;
        }
        w.timer -= DT;
        if (w.timer <= 0) {
          this.animSet(A.UPD);
          this.cond = CO.LEVANTA;
          this.sub = 3;
          return;
        }
        this.girarA(w.objetivo, DT * .5235988 * (w.trabado ? 4 : 1));
        this.velocidadMov();
        const k = this.ms() * .5 + .75;
        this.anim.velocidad(k);
        this.ed(() => distXZ(w.objetivo, this.pos) < 200, () => {
          if (this.tomarED()) this.sub--;
        });
        this.adelante(k * 600 * DT);
        return;
      }

     case 3:
      this.ed(() => this.terminaEn(.5), () => this.revivir());
      return;
    }
  }
  controlThroughWall() {
    const w = this.w, j = this.jugador();
    if (this.sub === 0) {
      this.altura(ALTURA_FLOTAR, 1);
      this.cabezaParar();
      this.animSet(A.WLK);
      w.modo = 0;
      w.timer = 5;
      this.sub = 1;
    }
    w.timer -= DT;
    if (!j.existe) {
      this.pasoA(P.WANDER);
      return;
    }
    this.girarA(j.pos, DT * Math.PI);
    this.adelante(this.velocidadP() * 2 * DT);
    if (distXZ(this.pos, j.pos) <= 300 || w.timer <= 0) this.pasoA(P.CHASE);
  }
  controlChaseInWall() {
    const w = this.w, j = this.jugador();
    if (this.sub === 0) {
      w.modo = 7;
      this.visible = false;
      this.peloSoltar();
      this.m.sonido?.(this, 61355);
      this.sub = 1;
    }
    if (!j.existe) return;
    const d = distXZ(this.pos, j.pos), paso = Math.min(this.velocidadP() * 10 * DT, Math.max(0, d - 100));
    if (d > .001) this.mover([ (j.pos[0] - this.pos[0]) / d * paso, 0, (j.pos[2] - this.pos[2]) / d * paso ]);
    this.rot = rumboHacia(j.pos, this.pos);
    if (d <= 400 && azar01() < .1) this.pasoA(P.APPEARFROMWALL);
  }
  controlAppearFromWall() {
    const w = this.w, j = this.jugador();
    if (this.sub === 0) {
      this.visible = true;
      w.modo = 1;
      this.cond = CO.NORMAL;
      this.animSet(A.WO1);
      this.m.sonido?.(this, 61352);
      this.altura(ALTURA_FLOTAR, 1);
      this.sub = 2;
    }
    if (j.existe) this.girarA(j.pos, DT * Math.PI);
    if (this.sub === 2 && this.anim.cuadro >= 75) {
      this.m.sonido?.(this, 60350);
      this.sub = 3;
    }
    if (this.sub <= 3 && this.anim.fin) {
      this.animSet(A.NT);
      this.sub = 6;
    } else if (this.sub === 6 && azar01() < .1) this.pasoA(P.CHASE);
  }
  controlDamage() {
    const w = this.w;
    switch (this.sub) {
     case 0:
      {
        const g = this.danioPend;
        this.danioPend = null;
        this.soltarJugador();
        this.peloSoltar();
        this.cabezaParar();
        w.modoVel = 0;
        w.modo = 2;
        this.cond = CO.DANIO;
        if (!g) {
          this.pasoA(P.CHASE);
          return;
        }
        this.aplicarGolpe(g, false);
        return;
      }

     case 1:
      this.edPaso(() => this.terminaEn(.5), P.CHASE);
      return;

     case 2:
      this.edPaso(() => this.anim.fin, P.DOWN);
      return;

     case 3:
      w.timer += DT;
      if (w.timer < .5) return;
      if (this.hp > 0) {
        this.animSet(A.DMC2);
        this.sub = 1;
        return;
      }
      this.fijarAlto(60);
      w.modoAltura = 11;
      this.animSet(A.XXC1, {
        reiniciar: true
      });
      this.sub = 2;
      return;

     case 4:
      w.timer += DT;
      if (w.timer >= 5 - (this.m.nivel ?? 1)) this.pasoA(P.CHASE);
      return;
    }
  }
  controlDown() {
    const w = this.w;
    const trepang = p => this.pruebaVida(0, 100) && azar01() < p && this.tipoParam < 1;
    switch (this.sub) {
     case 0:
     case 98:
     case 99:
      {
        if (this.sub === 99) w.tFantasma = azar01() * 3 + 2; else if (this.sub !== 98) {
          if (this.hp > 0) w.tFantasma = this.aguante > 0 || this.pruebaVida(0, 50) ? 0 : azar01() * 4 + 1; else w.tFantasma = (azar01() + 1) * 60;
        }
        this.fijarAlto(60);
        w.modoAltura = 11;
        w.modo = 2;
        if (w.tFantasma <= 0) {
          if (this.aguante > 0 && this.pruebaVida(0, 100) && this.tipoParam < 1) {
            this.pasoA(P.TREPANG);
            return;
          }
          this.cond = CO.DANIO;
        } else this.cond = CO.CAIDA;
        w.timer2 = 0;
        this.sub = 1;
        break;
      }

     case 1:
      if (w.tFantasma > 0) {
        if (azar01() >= .01) break;
        if (trepang(.5)) {
          this.pasoA(P.TREPANG);
          break;
        }
        w.tFantasma = azar01() * 4 + 1;
        this.animSet(A.ROTD, {
          reiniciar: true
        });
        this.sub = 2;
      } else {
        if (trepang(.2)) {
          this.pasoA(P.TREPANG);
          break;
        }
        if (this.jugador().estado === ST.ATTACK && this.cond !== CO.SOLO_VIDA) break;
        this.cond = CO.LEVANTA;
        w.timer = .1;
        this.sub = 3;
      }
      break;

     case 2:
      if (w.tFantasma > 0) {
        if (this.anim.fin && this.anim.n !== A.DNT) this.animSet(A.DNT);
        break;
      }
      if (azar01() < .9 && this.jugador().estado !== ST.ATTACK) {
        this.cond = CO.LEVANTA;
        w.timer = .1;
        this.sub = 3;
        break;
      }
      w.tFantasma = azar01() * 4 + 1;
      this.sub = 1;
      break;

     case 3:
      w.timer -= DT;
      if (w.timer > 0) return;
      this.animSet(A.UPD);
      this.sub = 4;
      return;

     case 4:
      this.ed(() => this.terminaEn(.5), () => this.revivir());
      return;
    }
    if (this.paso !== P.DOWN) return;
    if (!this.peloEnElPiso()) w.timer2 = 0; else {
      w.timer2 += DT;
      if (w.timer2 > (this.hp >= 0 ? 1.5 : 10)) this.aCapture3();
    }
  }
  controlRise() {
    const w = this.w;
    if (this.sub === 0) {
      this.animSet(A.WLKC);
      this.fijarAlto(80);
      this.radio = 80;
      w.modoAltura = 11;
      w.modo = 5;
      this.cond = CO.LEVANTA;
      this.sub = 1;
    } else if (this.sub === 1) this.edPaso(() => this.terminaEn(.5), P.CHASE);
  }
  controlExorcismDown() {
    const w = this.w;
    switch (this.sub) {
     case 0:
      this.soltarJugador();
      this.cond = CO.DANIO;
      this.animSet(A.XXC1, {
        reiniciar: true
      });
      this.fijarAlto(60);
      w.modoAltura = 11;
      w.modo = 2;
      this.peloSoltar();
      this.cabezaParar();
      w.velaAcum = 0;
      this.m.sonido?.(this, 60356);
      w.timer2 = 0;
      w.downCount = 0;
      this.sub = 1;
      break;

     case 1:
      if (this.anim.fin) {
        this.cond = CO.CAIDA;
        this.animSet(A.DNT);
        w.tFantasma = this.hp > 0 ? azar01() * 3 : (azar01() + 1) * 600;
        this.sub = 2;
      }
      break;

     case 2:
      if (w.tFantasma <= 0) {
        this.cond = CO.LEVANTA;
        w.timer = .1;
        this.sub = 3;
      }
      break;

     case 3:
      w.timer -= DT;
      if (w.timer <= 0) {
        this.animSet(A.UPD);
        this.sub = 4;
      }
      break;

     case 4:
      this.ed(() => this.terminaEn(.5), () => this.revivir());
      return;
    }
    if ((this.m.vela?.(this) || 0) > 0) {
      w.velaAcum = 0;
      if (w.tFantasma < 300) w.tFantasma += azar01();
      w.timer2 = 0;
      if (this.sub === 3) this.sub = 2;
    }
    if (!this.peloEnElPiso()) w.timer2 = 0; else {
      w.timer2 += DT;
      if (w.timer2 > 20) this.aCapture3();
    }
  }
  controlCrawlDamage() {
    const w = this.w;
    switch (this.sub) {
     case 0:
      {
        const g = this.danioPend;
        this.danioPend = null;
        w.modo = 5;
        this.cond = CO.DANIO;
        if (!g) {
          this.pasoA(P.CRAWL);
          return;
        }
        let d = g.danio;
        if (g.golpe === "BAK_PLAYER_PICK") d += this.aguanteMax;
        this.sonidoDanio(g);
        const resto = this.quitar(d);
        this.animSet([ 1, 3, 5, 7, 9, 11, 13, 15, 17, 20 ].includes(g.bdt) ? A.WKD2 : A.WKD1, {
          reiniciar: true
        });
        w.continuity++;
        if (resto <= 0) {
          this.sub = 3;
          return;
        }
        if (this.aguante > 0 && this.pruebaVida(0, 100)) {
          if (azar(4) + 5 <= w.continuity) this.cond = CO.SOLO_VIDA;
          this.sub = 2;
          return;
        }
        this.sub = 1;
        return;
      }

     case 1:
      this.edPaso(() => this.anim.fin, P.CRAWL);
      return;

     case 2:
      if (this.terminaEn(.5)) this.aCapture3();
      return;

     case 3:
      if (this.terminaEn(.5)) {
        this.animSet(A.ROTD, {
          reiniciar: true
        });
        this.pasoA(P.DOWN);
      }
      return;
    }
  }
  controlFinished() {
    const w = this.w;
    switch (this.sub) {
     case 0:
      this.m.sonido?.(this, 61355);

     case 99:
      this.radio = 0;
      this.cond = CO.MUERTA;
      if (this.sub === 99) {
        w.timer = 1;
        this.sub = 3;
        return;
      }
      this.sub = 1;

     case 1:
      if (this.anim.fin) {
        this.m.sonido?.(this, 61355);
        this.animSet(A.DNT);
        this.sub = 2;
      }

     case 2:
      if (this.m.espadaSacada?.(this)) {
        this.animSet(A.ROTD, {
          reiniciar: true
        });
        w.downCount = 0;
        this.cond = CO.CAIDA;
        this.pasoA(P.DOWN);
        this.sub = 99;
        return;
      }
      if (this.anim.n !== A.TDM && azar01() < .001) {
        this.animSet(w.fallingDirection, {
          reiniciar: true
        });
        this.sub = 1;
      }
      return;

     case 3:
      w.timer -= DT;
      if (w.timer <= 0) {
        this.animSet(A.TDM, {
          reiniciar: true
        });
        this.m.sonido?.(this, 60351);
        this.sub = 1;
      }
      return;
    }
  }
  controlEvent() {
    if (this.bandera(this.banderaCynthia())) {
      this.visible = true;
      this.cond = CO.NORMAL;
      this.pasoA(P.INIT);
    }
  }
  controlWait() {
    const j = this.jugador();
    if (this.sub === 0) {
      this.animSet(A.NT);
      this.altura(ALTURA_FLOTAR, 1);
      this.w.modo = 0;
      this.cond = CO.NORMAL;
      this.cabezaIniciar();
      this.sub = 1;
    } else if (this.sub === 1 && this.distJ() < 1e3 && this.vista()) this.pasoA(P.CHASE);
    if (j.existe) this.girarA(j.pos, DT * 1.5707964);
  }
  controlFlagWait() {
    const ok = this.m.banderasObjeto?.(this.def) ?? true;
    if (ok) this.pasoA(P.WAIT);
  }
}
