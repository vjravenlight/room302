// SH4 web — FeniXVOID · Project Ravenlight
import { DT, girarY, azar01 } from "./comun.js";

import { C } from "./ia_hyena.js";

export const P = {
  INIT: 0,
  STAY: 1,
  DAMAGE: 2
};

export const NOMBRE_PASO = Object.fromEntries(Object.entries(P).map(([k, v]) => [ v, k ]));

export const NOMBRES_ANIM_MM = [ "MM_NT1", "MM_NT2", "MM_NT3", "MM_DMG", "MM_DMG_TIRO" ];

const TABLA_ANIM = {
  "enemy_mm_fr03.bin": [ [ 0, 1, 2, 3, 4 ], [ 5, 6, 7, 8, 9 ] ],
  "enemy_mm_mz32.bin": [ [ 0, 1 ], [ 2, 3 ], [ 4, 5, 6 ] ]
};

const MZ32_APARECE = [ [ -1100, 0, 800 ], [ -700, 0, 1800 ], [ -200, 0, 2300 ], [ -400, 0, 2300 ], [ 700, 0, 2e3 ], [ 700, 0, 1300 ] ];

const SE_MMZ = 61204;

const SE_GOLPE = 60208;

const RADIO_PARTE = 120;

const ALTO_JUG = 320;

const GOLPES_MUDOS = [ "BAK_PLAYER_STUNGUN", "BAK_PLAYER_SPRAY", "BAK_PLAYER_CHAINSAW", "BAK_PLAYER_CHAINSAW_ST" ];

function cercano(a, b, p) {
  const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
  const pr = (p[0] - a[0]) * dx + (p[1] - a[1]) * dy + (p[2] - a[2]) * dz, l2 = dx * dx + dy * dy + dz * dz;
  let t = 0;
  if (Math.abs(pr) >= 1e-6 && l2 >= 1e-6) t = Math.max(0, Math.min(1, pr / l2));
  const q = [ a[0] + dx * t, a[1] + dy * t, a[2] + dz * t ];
  const ex = q[0] - p[0], ey = q[1] - p[1], ez = q[2] - p[2];
  return [ q, ex * ex + ey * ey + ez * ez ];
}

export class Mm {
  constructor(def, pj, anim, m) {
    this.tipo = "MM";
    this.def = def;
    this.pj = pj;
    this.anim = anim;
    this.m = m;
    const ini = def.ini ?? 0;
    this.modo = ini >> 12 & 15;
    this.tipoAnim = ini >> 8 & 15;
    this.archivo = (def.archivos || []).find(a => /^enemy_mm_/.test(a)) || null;
    this.etapa = this.archivo ? this.archivo.slice(9, 11) : null;
    this.tablaAnim = TABLA_ANIM[this.archivo]?.[this.tipoAnim] || null;
    this.param = m.parametros("MM", 0);
    this.hp = this.hpMax = this.param.vida;
    this.aguante = this.aguanteMax = this.param.aguante;
    this.vidaPct = 100;
    this.pos = [ ...def.pos ];
    this.rot = def.rumbo || 0;
    this.posAnt = [ ...this.pos ];
    this.rotAnt = this.rot;
    this.radio = RADIO_PARTE;
    this.radioGolpe = RADIO_PARTE;
    this.alto = 240;
    this.centroAlto = 120;
    this.sinPasos = true;
    this.sinSangre = false;
    this.cond = this.modo === 4 ? 13 : C.NORMAL;
    this.paso = P.INIT;
    this.sub = 0;
    this.golpes = [];
    this.bd = null;
    this.ed = null;
    this.animN = -1;
    this.w = {
      escala: new Array(10).fill(1),
      timer: 0,
      hitTimer: 0,
      charcos: 0,
      velAnim: 1,
      sinPared: false,
      sonando: false
    };
    this.punto = [ ...this.pos ];
    this.centroColision = [ ...this.pos ];
    this.partes = [ 0, 1, 2 ].map(() => ({
      pos: [ ...this.pos ],
      radio: RADIO_PARTE
    }));
    this.cuerpo = [];
    this.pared = [];
    if (pj?.reproductor) pj.reproductor.enElLugar = false;
  }
  caido() {
    return false;
  }
  persigue() {
    return false;
  }
  intocable() {
    return this.cond === 13 || this.cond === 16;
  }
  get posSonido() {
    return this.punto;
  }
  pasoA(n) {
    this.paso = n;
    this.sub = 0;
  }
  animArchivo(n) {
    return this.tablaAnim ? this.tablaAnim[n] ?? n : n;
  }
  animTermino() {
    return this.animN < 0 || !this.anim.loop && this.anim.fin;
  }
  velocidadPorVida() {
    let v = this.vidaPct * .01;
    if (v <= .1) v = .1;
    this.anim.velocidad(v);
    this.w.velAnim = v;
    this.m.volumenSonido?.(this, v);
    return v;
  }
  animSet(n) {
    const directo = this.modo === 3 || this.modo === 4 && n !== 1;
    if (n === this.animN && !directo) {
      this.velocidadPorVida();
      return;
    }
    this.animN = n;
    this.anim.poner(this.animArchivo(n));
    this.velocidadPorVida();
  }
  restarVida(d) {
    this.hp -= d;
    if (this.hp <= 0) {
      this.hp = 0;
      this.vidaPct = 0;
      this.aguante = 0;
      return;
    }
    this.vidaPct = this.hp / this.hpMax * 100;
    this.aguante = Math.max(0, this.aguante - d);
  }
  sumarVida(x) {
    this.hp = Math.min(this.hpMax, this.hp + x);
    this.vidaPct = this.hp / this.hpMax * 100;
    this.aguante = Math.min(this.hp, this.aguanteMax);
  }
  juntar(gs) {
    let mayor = gs[0], suma = 0;
    for (const g of gs) {
      suma += g.danio || 0;
      if ((g.danio || 0) > (mayor.danio || 0)) mayor = g;
    }
    return {
      ...mayor,
      danio: suma
    };
  }
  tick() {
    this.posAnt = [ ...this.pos ];
    this.rotAnt = this.rot;
    if (!this.w.sonando) {
      this.w.sonando = true;
      this.m.sonido?.(this, SE_MMZ, true);
    }
    this.control();
    this.anim.avanzar();
    this.hookAnim();
    if (this.ed && this.animTermino()) {
      const e = this.ed;
      this.ed = null;
      if (e.paso != null) this.pasoA(e.paso); else this.sub++;
    }
    this.actualizarCuerpo();
  }
  control() {
    const w = this.w;
    this.ed = null;
    if (this.golpes.length) {
      const gs = this.golpes;
      this.golpes = [];
      if (this.paso === P.STAY || this.paso === P.DAMAGE) {
        const bd = this.juntar(gs);
        if (this.modo < 2) {
          this.bd = bd;
          this.pasoA(P.DAMAGE);
        } else this.restarVida(bd.danio);
      }
    }
    switch (this.paso) {
     case P.INIT:
      w.escala.fill(1);
      this.pasoA(P.STAY);
      break;

     case P.STAY:
      this.controlStay();
      break;

     case P.DAMAGE:
      this.controlDamage();
      break;
    }
    if (this.cond !== C.DAMAGE) {
      this.sumarVida(this.param.recupera * DT);
      this.velocidadPorVida();
    }
    if (this.tocandoJugador()) w.hitTimer += DT; else w.hitTimer = 0;
  }
  controlStay() {
    const w = this.w;
    switch (this.sub) {
     case 0:
      this.cond = C.NORMAL;
      if (this.modo === 3) {
        this.sub = 3;
        return;
      }
      if (this.modo === 4) {
        this.sub = 5;
        return;
      }
      this.sub = 1;

     case 1:
      {
        const n = this.modo < 2 ? Math.round(azar01() * 3 - .49) : azar01() < .2 ? 1 : 0;
        if (this.animN !== n) {
          this.animSet(n);
          const dur = this.anim.dur;
          let c = Math.round(azar01() * dur - .49);
          while (c < 0) c += dur;
          while (c >= dur) c -= dur;
          this.anim.t = c;
          w.timer = 5;
        }
        this.sub = 2;
        return;
      }

     case 2:
      w.timer -= DT;
      if (w.timer <= 0) {
        w.timer = 0;
        if (azar01() < .01) this.sub = 1;
      }
      return;

     case 3:
      this.animSet(azar01() < .1 ? 1 : 0);
      w.timer = azar01() * 5 + 1;
      this.sub = 4;
      return;

     case 4:
      if (this.animTermino()) {
        w.timer -= DT;
        if (w.timer <= 0) this.sub = 3;
      }
      return;

     case 5:
      {
        this.sumarVida(this.hpMax);
        this.cond = C.NORMAL;
        this.animSet(2);
        const i = Math.max(0, Math.min(5, Math.round(azar01() * 6 - .49)));
        this.pos = [ ...MZ32_APARECE[i] ];
        this.posAnt = [ ...this.pos ];
        this.sub = 6;
        return;
      }

     case 6:
      if (this.animTermino()) {
        this.animSet(0);
        w.timer = azar01() * 20 + 10;
        this.sub = 7;
      }
      return;

     case 7:
      w.timer -= DT;
      if (w.timer <= 0 || this.vidaPct < 100) {
        this.animSet(1);
        w.timer = azar01() * 5 + 1;
        this.sub = 8;
      }
      return;

     case 8:
      if (this.animTermino()) {
        w.timer -= DT;
        if (w.timer <= 0) this.sub = 5;
      }
      return;
    }
  }
  controlDamage() {
    const w = this.w;
    switch (this.sub) {
     case 0:
      {
        this.cond = C.DAMAGE;
        const bd = this.bd || {
          danio: 0,
          golpe: "",
          atributo: 3
        };
        this.bd = null;
        if (!GOLPES_MUDOS.includes(bd.golpe)) this.m.sonido?.(this, SE_GOLPE);
        this.restarVida(bd.danio || 0);
        this.animSet(bd.atributo === 5 || bd.atributo === 7 ? 4 : 3);
        w.timer = (100 - this.vidaPct) * .03 + 2;
        this.sub = this.hp <= 0 ? 2 : 1;
        return;
      }

     case 1:
      if (this.anim.loop) break;
      this.ed = {
        paso: P.STAY
      };
      return;

     case 2:
      if (!this.anim.loop) {
        this.ed = {
          sub: true
        };
        return;
      }
      w.timer -= DT;
      if (w.timer <= 0) this.sub = 3;
      return;

     case 3:
      {
        w.timer = azar01() * 15 + 5;
        if (this.modo === 1 && w.charcos < 3) {
          this.charco();
          w.charcos++;
        }
        this.animSet(Math.round(azar01() * 3 - .49));
        this.sub = 4;
        break;
      }

     case 4:
      break;

     default:
      return;
    }
    w.timer -= DT;
    if (w.timer <= 0) this.pasoA(P.STAY);
  }
  charco() {
    const j = this.m.jugador(), p = this.punto;
    let dx = j.existe ? j.pos[0] - p[0] : 0, dz = j.existe ? j.pos[2] - p[2] : 0, dy = j.existe ? j.pos[1] - p[1] : 0;
    const L = Math.hypot(dx, dy, dz) || 1;
    const q = [ p[0] + dx / L * 100, p[1] + dy / L * 100, p[2] + dz / L * 100 ];
    const y = this.m.piso?.(q);
    if (y == null) return;
    q[1] = y;
    if (this.m.charcoEn) this.m.charcoEn(q, 100); else this.m.charco?.({
      w: {},
      pos: q
    }, 100, false);
  }
  hookAnim() {
    if (this.modo === 4 && this.animN === 1 && this.anim.t > 71 && this.anim.t < 72) this.anim.t = 72;
  }
  huesos() {
    const r = this.pj?.reproductor;
    if (!r || this.anim.n < 0) return [];
    if (r.anim !== this.anim.anim) r.poner(this.anim.anim);
    r.t = this.anim.t;
    r.loop = this.anim.loop;
    const pose = r.avanzar(0), a = pose.absPos, n = Math.floor(a.length / 3), out = [];
    for (let i = 0; i < n; i++) {
      const g = girarY([ a[i * 3], a[i * 3 + 1], a[i * 3 + 2] ], this.rot);
      out.push([ this.pos[0] + g[0], this.pos[1] + g[1], this.pos[2] + g[2] ]);
    }
    return out;
  }
  actualizarCuerpo() {
    const h = this.cuerpo = this.huesos();
    if (h.length < 2) return;
    this.ponerPared(h);
    const j = this.m.jugador();
    if (!j.existe) return;
    const pj = [ j.pos[0], j.pos[1] - (this.m.altoOjos?.() ?? ALTO_JUG), j.pos[2] ];
    let mejor = 17014118e31, punto = null;
    for (let i = 1; i < h.length; i++) {
      const [q, d] = cercano(h[i - 1], h[i], pj);
      if (d < mejor) {
        mejor = d;
        punto = q;
      }
    }
    this.punto = punto;
    const c = [ ...punto ];
    if (c[1] < pj[1] + 100 && pj[1] - c[1] < 400) c[1] = pj[1] + 100;
    this.centroColision = c;
    const seg = [];
    for (let i = 0; i < h.length - 1; i++) {
      const [q, d] = cercano(h[i], h[i + 1], pj);
      seg.push({
        q: q,
        d: d
      });
    }
    seg.sort((a, b) => a.d - b.d);
    for (let k = 0; k < 3; k++) this.partes[k].pos = seg[Math.min(k, seg.length - 1)].q;
  }
  ponerPared(h) {
    const w = this.w;
    if (w.hitTimer > 1) {
      if (!w.sinPared) {
        w.sinPared = true;
        this.pared = [];
        this.m.paredEnemigo?.(this, null);
      }
      if (w.hitTimer <= 1.5) return;
      w.sinPared = false;
      w.hitTimer = 0;
    }
    const segs = [];
    for (let i = 1; i < h.length; i++) {
      if (h[i - 1][1] > -500 || h[i][1] > -500) segs.push({
        a: h[i - 1],
        b: h[i],
        radio: 100 * Math.max(this.w.escala[i - 1] ?? 1, this.w.escala[i] ?? 1)
      });
    }
    this.pared = segs;
    this.m.paredEnemigo?.(this, segs);
  }
  tocandoJugador() {
    const j = this.m.jugador();
    if (!j.existe) return false;
    const r = this.m.radioJugador ?? 40, p = [ j.pos[0], j.pos[1] - (this.m.altoOjos?.() ?? ALTO_JUG), j.pos[2] ];
    const d2 = (q, rad) => {
      const x = q[0] - p[0], z = q[2] - p[2];
      return x * x + z * z < (rad + r) * (rad + r) && Math.abs(q[1] - p[1]) < 400;
    };
    if (d2(this.centroColision, RADIO_PARTE)) return true;
    return this.pared.some(s => d2(cercano(s.a, s.b, p)[0], s.radio));
  }
  puntoGolpe() {
    return this.partes[0].pos;
  }
  recibir(g) {
    if (!this.intocable()) this.golpes.push(g);
  }
}
