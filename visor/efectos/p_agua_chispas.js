// SH4 web — FeniXVOID · Project Ravenlight
import { posGen, velGen, desviar, quadFrente, profundidad, norm } from "./particulas.js";

const ATLAS = {
  archivo: "system_load.bin",
  parte: 2
};

const CHISPA = {
  archivo: "spark_smoke.bin",
  parte: 0
};

const c128 = (r, g, b, a) => [ r / 128, g / 128, b / 128, a / 128 ];

const colGS = x => c128(x & 255, x >>> 8 & 255, x >>> 16 & 255, x >>> 24);

const CELDAS = [ [ .002, .002 ], [ .252, .002 ], [ .502, .002 ], [ .752, .002 ] ];

function chorro(org, piso, nombre) {
  return {
    nombre: nombre,
    org: org,
    cmn: {
      piso: piso
    },
    quads: 1 + 8,
    material: {
      ...ATLAS,
      mezcla: 68,
      aref: 0
    },
    generar(p, o, c, rand) {
      const r1 = desviar(rand, .5, .8), r2 = desviar(rand, .5, .8);
      p.vel = velGen(o, rand);
      p.velT = [ ...p.vel ];
      p.pos = posGen(o, r1, r2);
      p.cola = p.pos.map((x, k) => x - .25 * p.vel[k]);
      p.ancho = o.ancho;
      p.anchoV = Math.tan(o.abre) * Math.hypot(...p.vel);
      p.t = 0;
      p.sal = 0;
      p.r1 = rand() << 15 | rand();
      p.r2 = rand();
    },
    calcular(p, o, c, dt) {
      p.t += dt;
      p.anchoV *= 1 - .05 * dt;
      p.ancho += dt * p.anchoV;
      p.vel[1] += 1960 * dt;
      for (let k = 0; k < 3; k++) {
        p.vel[k] *= 1 - .1 * dt;
        p.pos[k] += dt * p.vel[k];
      }
      if (p.t > .25) {
        p.velT[1] += 1960 * dt;
        for (let k = 0; k < 3; k++) p.velT[k] *= 1 - .1 * dt;
      }
      for (let k = 0; k < 3; k++) p.cola[k] += dt * p.velT[k];
      if (p.pos[1] > c.piso) p.sal += dt;
      return p.sal <= .4;
    },
    dibujar(p, o, c, emitir, cam) {
      if (profundidad(cam, p.pos) < 60 || profundidad(cam, p.cola) < 60) return;
      const eje = p.pos.map((x, k) => x - p.cola[k]);
      const lado = norm([ eje[1] * cam.fr[2] - eje[2] * cam.fr[1], eje[2] * cam.fr[0] - eje[0] * cam.fr[2], eje[0] * cam.fr[1] - eje[1] * cam.fr[0] ]).map(x => x * p.ancho * .5);
      const [u0, v0] = CELDAS[p.r2 & 3], d = .2460938, col = c128(60, 60, 62, 80);
      emitir([ p.pos.map((x, k) => x + lado[k]), p.pos.map((x, k) => x - lado[k]), p.cola.map((x, k) => x + lado[k]), p.cola.map((x, k) => x - lado[k]) ], [ [ u0, v0 ], [ u0 + d, v0 ], [ u0, v0 + d ], [ u0 + d, v0 + d ] ], col);
      if (p.sal > 0) {
        const t = p.sal;
        const R = p.ancho * 1.65 * .5 * (1 + 3e-4 * Math.abs(p.vel[1])) * (.85 + .15 * Math.cos(18.84956 * t)) * Math.min(2.5 * t, 1);
        const fd = Math.min(4.166667 * (.4 - t), 1), fh = .6 + .4 * ((p.r1 >>> 15 & 127) / 127);
        const cc = c128(60, 60, 60, 80 * Math.max(0, fd));
        const arr = a => [ p.pos[0] + R * Math.sin(a), c.piso - fh * fd * R, p.pos[2] + R * Math.cos(a) ];
        const aba = a => [ p.pos[0] + .3 * R * Math.sin(a), c.piso, p.pos[2] + .3 * R * Math.cos(a) ];
        const ua = (a, r) => [ .125 + r * Math.sin(a), .125 + r * Math.cos(a) ];
        for (let k = 0; k < 8; k++) {
          const a = k * Math.PI / 4, b = (k + 1) * Math.PI / 4;
          emitir([ arr(a), aba(a), arr(b), aba(b) ], [ ua(a, .123), ua(a, .0123), ua(b, .123), ua(b, .0123) ], cc);
        }
      }
    }
  };
}

const ORG_CHORRO = o => ({
  n: -10,
  intervalo: .1,
  espera: 0,
  abre: .2618,
  ...o
});

export function salpicaduraPaso(pos, velPaso, angY, pie = 55) {
  const s = Math.sin(angY), c = Math.cos(angY), max = .65 * velPaso;
  return chorro(ORG_CHORRO({
    pos: [ pos[0] + .7 * pie * s, pos[1], pos[2] + .7 * pie * c ],
    vec1: [ .2 * pie * s, 0, .2 * pie * c ],
    vec2: [ 0, 0, 0 ],
    dir: [ s, 2, c ],
    ancho: .85 * pie,
    n: 1,
    intervalo: .05,
    max: max,
    min: .8 * max
  }), pos[1], "paso_agua");
}

export function compuerta(pos, velAgua, W, H, piso, demo = false) {
  const n = norm([ velAgua[2], 0, -velAgua[0] ]), v = Math.hypot(...velAgua);
  return chorro(ORG_CHORRO({
    pos: [ pos[0] - .5 * W * n[0], pos[1] - .5 * H, pos[2] - .5 * W * n[2] ],
    vec1: n.map(x => x * W),
    vec2: [ 0, H, 0 ],
    dir: velAgua,
    ancho: .8 * W,
    max: v,
    min: .8 * v,
    demo: demo
  }), piso, "compuerta");
}

const COMPUERTAS = [ [ [ 860, -20, -575 ], [ 280, -120, 280 ] ], [ [ -860, -20, -575 ], [ -280, -120, 280 ] ], [ [ 860, -20, -2300 ], [ 280, -120, -280 ] ], [ [ -860, -20, -2300 ], [ -280, -120, -280 ] ] ];

export function compuertas4(demo = false) {
  return COMPUERTAS.map(([p, v]) => compuerta(p, v, 120, demo ? 40 : 24, 60, demo));
}

export function canio(pos, D, piso) {
  const RW = .2 * D;
  return Array.from({
    length: 4
  }, () => chorro(ORG_CHORRO({
    pos: [ pos[0] - .5 * RW, pos[1], pos[2] - .5 * RW ],
    vec1: [ RW, 0, 0 ],
    vec2: [ 0, 0, RW ],
    dir: [ 0, 1, 0 ],
    ancho: .8 * D,
    intervalo: .25,
    espera: -4,
    max: 380,
    min: 320
  }), piso, "canio"));
}

function ondas(org, cmn, nombre) {
  return {
    nombre: nombre,
    org: org,
    cmn: cmn,
    quads: 2,
    material: {
      ...ATLAS,
      mezcla: 72,
      fix: null,
      aref: 0
    },
    generar(p, o, c, rand) {
      p.pos = posGen(o, rand.f(), rand.f());
      p.vel = velGen(o, rand);
      p.vida = c.vida;
      p.ancho = 1;
    },
    calcular(p, o, c, dt) {
      for (let k = 0; k < 3; k++) p.pos[k] += dt * p.vel[k];
      p.vida -= dt;
      return p.vida >= 0;
    },
    dibujar(p, o, c, emitir, cam) {
      if (profundidad(cam, p.pos) < 60) return;
      const phi = c.tipo === 0 ? Math.atan2(cam.fr[0], cam.fr[2]) : Math.atan2(o.dir[0], o.dir[2]);
      const s = Math.sin(phi), co = Math.cos(phi), k = p.azar & 3, hw = c.anchoOnda * p.ancho * .5;
      const P = (lat, lon) => [ p.pos[0] + lat * hw * co + lon * s, p.pos[1], p.pos[2] - lat * hw * s + lon * co ];
      if (c.tipo === 0) {
        const L = c.largo * p.ancho, ph = p.vida * c.omega, ox = .12 * hw * Math.sin(ph), oz = .12 * hw * Math.cos(ph);
        const sh = v => [ v[0] + ox, v[1], v[2] + oz ];
        emitir([ sh(P(-1, 0)), sh(P(1, 0)), sh(P(-1, -L)), sh(P(1, -L)) ], [ [ k * .25, .25 ], [ (k + 1) * .25, .25 ], [ k * .25, 0 ], [ (k + 1) * .25, 0 ] ], [ c.rgba[0], c.rgba[1], c.rgba[2], c.rgba[3] * (.5 - .5 * Math.cos(ph)) ]);
      } else {
        const hl = c.largo * p.ancho * .5, f = (c.vida - p.vida) / c.vida, ph = c.omega * p.vida;
        const ox = .01 * hw * Math.sin(3 * ph), oz = .01 * hw * Math.cos(3 * ph), sh = v => [ v[0] + ox, v[1], v[2] + oz ];
        const filas = [ [ hl, (.18 - .17 * f) * .25 ], [ ((1 - f) * .4 + .1) * hl, (.9 - .6 * f) * .25 ], [ -hl, (1 - .1 * f) * .25 ] ];
        const a = Math.sin(Math.PI * f) * c.rgba[3];
        for (let r = 0; r < 2; r++) {
          const [l0, v0] = filas[r], [l1, v1] = filas[r + 1];
          emitir([ sh(P(-1, l0)), sh(P(1, l0)), sh(P(-1, l1)), sh(P(1, l1)) ], [ [ k * .25, v0 ], [ (k + 1) * .25, v0 ], [ k * .25, v1 ], [ (k + 1) * .25, v1 ] ], [ c.rgba[0], c.rgba[1], c.rgba[2], a ]);
        }
      }
    }
  };
}

export function ondasPileta(rand) {
  return Array.from({
    length: 15
  }, () => {
    const th = rand.f() * 2 * Math.PI;
    return ondas({
      pos: [ -806, -30, -650 ],
      vec1: [ 1612, 0, 0 ],
      vec2: [ 0, 0, -1600 ],
      dir: [ Math.sin(th), 0, Math.cos(th) ],
      n: -10,
      intervalo: .1,
      espera: -4,
      abre: 0,
      max: 0,
      min: 0
    }, {
      tipo: 0,
      rgba: colGS(1614823488),
      vida: 3,
      anchoOnda: 240,
      largo: 80,
      omega: 18.8496,
      anchoRate: () => 1
    }, "ondas_pileta");
  });
}

export function olasTorre() {
  return Array.from({
    length: 35
  }, () => ondas({
    pos: [ -15e3, 3800, -17e3 ],
    vec1: [ 3e4, 0, 0 ],
    vec2: [ 0, 0, 3e4 ],
    dir: [ Math.sin(.5585), 0, Math.cos(.5585) ],
    n: -10,
    intervalo: .5,
    espera: -4,
    abre: 0,
    max: 400,
    min: 360
  }, {
    tipo: 1,
    rgba: colGS(810569808),
    vida: 4,
    anchoOnda: 3600,
    largo: 1200,
    omega: Math.PI / 2,
    anchoRate: () => 1
  }, "olas_torre"));
}

export function chispasLinea(centro, rgba, vel, abre, vidaMax, demo = false) {
  const v = Math.hypot(...vel);
  return {
    nombre: "chispas",
    org: {
      pos: centro,
      vec1: [ 0, 0, 0 ],
      vec2: [ 0, 0, 0 ],
      dir: vel,
      n: -11,
      intervalo: 0,
      espera: 0,
      abre: abre,
      max: v,
      min: .5 * v,
      demo: demo
    },
    cmn: {
      vidaMax: vidaMax,
      rgba: rgba
    },
    material: {
      mezcla: 72,
      fix: null
    },
    generar(p, o, c, rand) {
      p.pos = [ ...o.pos ];
      p.vel = velGen(o, rand);
      p.t = 0;
      p.vida = (rand.f() * .4 + .6) * c.vidaMax;
    },
    calcular(p, o, c, dt) {
      p.t += dt;
      p.vel[1] += 1372 * dt;
      for (let k = 0; k < 3; k++) {
        p.vel[k] *= 1 - 5 * dt;
        p.pos[k] += p.vel[k] * dt;
      }
      return p.t <= p.vida;
    },
    dibujar(p, o, c, emitir, cam) {
      const b = p.pos.map((x, k) => x + p.vel[k] / 30), w = Math.max(1, profundidad(cam, p.pos)) * 1.2 / cam.focal;
      const l = cam.arr.map(x => x * w), vida = 1 - p.t / p.vida;
      const ca = [ c.rgba[0], c.rgba[1] * vida, c.rgba[2], c.rgba[3] * vida ], cb = [ c.rgba[0], c.rgba[1] * vida, c.rgba[2], 0 ];
      emitir([ p.pos.map((x, k) => x - l[k]), p.pos.map((x, k) => x + l[k]), b.map((x, k) => x - l[k]), b.map((x, k) => x + l[k]) ], [ [ 0, 0 ], [ 0, 0 ], [ 0, 0 ], [ 0, 0 ] ], [ ca, ca, cb, cb ]);
    }
  };
}

export function chispaHumo({centro: centro, rad1: rad1 = [ 8, 0, 0 ], rad2: rad2 = [ 0, 0, 8 ], rgba: rgba = c128(70, 62, 128, 190), angulo: angulo = 0, tamMax: tamMax = 5, vidaHumo: vidaHumo = 4, intervalo: intervalo = .2, demo: demo = false}) {
  return {
    nombre: "chispa_humo",
    org: {
      pos: centro,
      vec1: rad1,
      vec2: rad2,
      dir: [ 0, -1, 0 ],
      n: -10,
      intervalo: intervalo,
      espera: 0,
      abre: 0,
      max: 0,
      min: 0,
      demo: demo
    },
    cmn: {
      angulo: angulo,
      tamMax: tamMax,
      vidaHumo: vidaHumo,
      rgba: rgba
    },
    quads: 2,
    material: {
      ...CHISPA,
      mezcla: 72,
      fix: null,
      aref: 0
    },
    generar(p, o, c, rand) {
      const r1 = rand.f(), r2 = rand.f(), r3 = rand.f();
      const a = (.5 - r1) * .6981317 + c.angulo, rad = r2 * .05 + .95;
      p.pos = [ 0, 1, 2 ].map(k => o.pos[k] + Math.cos(a) * rad * o.vec1[k] + Math.sin(a) * rad * o.vec2[k]);
      p.vel = [ 0, 0, 0 ];
      p.cola = [ ...p.pos ];
      const f = (r3 + 1) * .5;
      p.paso = 0;
      p.tam = f * c.tamMax;
      p.tasa = 0;
      p.th = 0;
      p.vh = (f * .4 + .6) * c.vidaHumo;
      p.giro = rand.f() * 6.283185;
      const r = rand();
      p.azar = (r & 32767) << 16 | r >>> 1;
    },
    calcular(p, o, c, dt) {
      if (p.paso === 0) {
        p.tasa += 9 * dt;
        if (p.tasa >= 1) {
          p.tasa = 1;
          p.paso = 1;
        }
        return true;
      }
      p.th += dt;
      p.vel[1] -= 100 * dt;
      for (let k = 0; k < 3; k++) {
        p.vel[k] *= 1 - 4 * dt;
        p.pos[k] += p.vel[k] * dt;
        p.cola[k] += .3 * p.vel[k] * dt;
      }
      return p.th <= p.vh;
    },
    dibujar(p, o, c, emitir, cam) {
      if (profundidad(cam, p.pos) < 60) return;
      if (p.paso === 0) {
        const n = [ 3, 4, 5, 6, 4, 5, 6 ][(p.azar >>> 0) % 7], u0 = (64 * n + .5) / 512, u1 = u0 + 63 / 512, s = p.tam * p.tasa;
        emitir(quadFrente(cam, p.pos, s, s, p.giro), [ [ u0, .5 / 256 ], [ u1, .5 / 256 ], [ u0, 63.5 / 256 ], [ u1, 63.5 / 256 ] ], c.rgba);
      } else {
        const tn = p.azar >>> 8 & 3, vs = (32 * tn + 128.5) / 256, f = p.th / p.vh, cuadro = Math.min(15, Math.floor(f * 16));
        const s0 = tn < 3 ? (32 * cuadro + .5) / 512 : .0009765625, s1 = s0 + .06054688, a = (1 - f) * .6;
        const h = p.tam, fila = (b, dy) => [ b.map((x, k) => x - cam.der[k] * h - cam.arr[k] * dy), b.map((x, k) => x + cam.der[k] * h - cam.arr[k] * dy) ];
        const [A0, A1] = fila(p.pos, -.5 * h), [M0, M1] = fila(p.pos, 1.5 * h), [B0, B1] = fila(p.cola, .5 * h);
        const col = c128(87, 75, 105, 128 * a), vm = vs + (.9 - .8 * f) * .12109375, vb = vs + .1210938;
        emitir([ A0, A1, M0, M1 ], [ [ s0, vs ], [ s1, vs ], [ s0, vm ], [ s1, vm ] ], col);
        emitir([ M0, M1, B0, B1 ], [ [ s0, vm ], [ s1, vm ], [ s0, vb ], [ s1, vb ] ], col);
      }
    }
  };
}

export function sillaChispas(rand) {
  const centros = [ [ -495.3, -147, -14.6 ], [ -475.3, -149, 96 ] ], r = [];
  for (let i = 0; i < 26; i++) {
    const ang = i & 1 ? ((.5 - rand.f()) * 90 + (i & 4 ? -145 : 110)) * Math.PI / 180 : (135 + (.5 - rand.f()) * 130) * Math.PI / 180;
    r.push(chispaHumo({
      centro: centros[i & 1],
      rad1: [ 0, -10, 0 ],
      rad2: [ 0, 0, 7.6 ],
      angulo: ang,
      tamMax: 5,
      vidaHumo: 4,
      intervalo: [ .2, .5, .2, .5 ][i & 3],
      demo: true
    }));
  }
  return r;
}

export function sillaChispasHenry() {
  const v = [ 400, -1e3, 0 ], m = Math.hypot(...v);
  return [ 0, 1, 2 ].map(() => chispasLinea([ -485.3, -142.2, 90 ], colGS(2517253240), v, 1.22173, m * 75e-5, true));
}

export function spray() {
  const cmn = {
    largo: 40,
    area: 32400,
    vida: .57,
    rgba: colGS(511211640),
    roce: .5
  };
  return {
    nombre: "spray",
    org: {
      pos: [ 0, 0, 0 ],
      vec1: [ 0, 0, 0 ],
      vec2: [ 0, 0, 0 ],
      dir: [ 0, 0, 1 ],
      n: -10,
      intervalo: .01,
      espera: 31536e3,
      abre: .0872665,
      max: 2e3,
      min: 1800
    },
    cmn: cmn,
    material: {
      ...ATLAS,
      mezcla: 68,
      fix: null,
      aref: 0
    },
    generar(p, o, c, rand) {
      p.pos = [ ...o.pos ];
      p.vel = velGen(o, rand);
      p.ancho = .2 * c.largo;
      p.t = 0;
      p.azar = rand();
    },
    calcular(p, o, c, dt) {
      p.ancho = Math.sqrt(p.ancho * p.ancho + c.area * dt);
      for (let k = 0; k < 3; k++) {
        p.vel[k] *= 1 - 5 * c.roce * dt;
        p.pos[k] += p.vel[k] * dt;
      }
      p.t += dt;
      return p.t <= c.vida;
    },
    dibujar(p, o, c, emitir, cam) {
      const z = profundidad(cam, p.pos);
      if (z < 60) return;
      let a = Math.min(1, .342 / (p.t + .03) + .4);
      if (p.t > .342) a *= (.57 - p.t) / .228;
      const sig = p.pos.map((x, k) => x + p.vel[k] / 30), z2 = Math.max(60, profundidad(cam, sig));
      const dx = (dot(sig, cam.der) - dot(cam.pos, cam.der)) / z2 - (dot(p.pos, cam.der) - dot(cam.pos, cam.der)) / z;
      const dy = (dot(sig, cam.arr) - dot(cam.pos, cam.arr)) / z2 - (dot(p.pos, cam.arr) - dot(cam.pos, cam.arr)) / z;
      const ang = dx || dy ? Math.atan2(dy, dx) : 0, tasa = Math.hypot(dx, dy) * z / p.ancho * 2.5 + 1;
      const n = p.azar & 3, u0 = (n * 63 + .5) / 256, u1 = ((n + 1) * 63 + .5) / 256;
      emitir(quadFrente(cam, p.pos, tasa * p.ancho, p.ancho, ang), [ [ u0, 128.5 / 256 ], [ u1, 128.5 / 256 ], [ u0, 191.5 / 256 ], [ u1, 191.5 / 256 ] ], [ c.rgba[0], c.rgba[1], c.rgba[2], c.rgba[3] * Math.max(0, a) ]);
    }
  };
}

const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

export function stungun(inicio, fin, rand) {
  return {
    nombre: "stungun",
    org: {
      pos: inicio,
      vec1: [ 0, 0, 0 ],
      vec2: [ 0, 0, 0 ],
      dir: [ 0, 0, 0 ],
      n: 1,
      intervalo: 0,
      espera: 0,
      abre: 0,
      max: 0,
      min: 0
    },
    cmn: {
      fin: fin
    },
    quads: 2,
    material: {
      ...ATLAS,
      mezcla: 72,
      fix: null,
      aref: 0
    },
    generar(p) {
      p.vivo = 1;
    },
    calcular(p) {
      return p.vivo-- > 0;
    },
    dibujar(p, o, c, emitir, cam) {
      const br = rand.f() * .7 + .3;
      const w = Math.max(1, profundidad(cam, o.pos)) * 1.5 / cam.focal, l = cam.arr.map(x => x * w);
      const ve = .873047 + (rand.f() * .8 + .1) * .1210938, col = c128(90, 100, 128, 128 * br);
      emitir([ o.pos.map((x, k) => x - l[k]), o.pos.map((x, k) => x + l[k]), c.fin.map((x, k) => x - l[k]), c.fin.map((x, k) => x + l[k]) ], [ [ .501953, .873047 ], [ .501953, .873047 ], [ .623047, ve ], [ .623047, ve ] ], col);
      const m = o.pos.map((x, k) => (x + c.fin[k]) / 2), R = br * 6 + 10;
      emitir(quadFrente(cam, m, 2 * R, 2 * R, rand.f() * 6.283), [ [ .502, .752 ], [ .623, .752 ], [ .502, .873 ], [ .623, .873 ] ], c128(80, 95, 120, 128 * br));
    }
  };
}
