// SH4 web — FeniXVOID · Project Ravenlight
import { profundidad, norm } from "./particulas.js";

const MANCHAS = {
  archivo: "system_load.bin",
  parte: 1
};

export const COLOR_SANGRE = {
  gota: [ [ 20, 0, 0 ], [ 0, 20, 0 ], [ 14, 0, 20 ] ],
  salpicadura: [ [ 25, 4, 4 ], [ 0, 25, 0 ], [ 16, 0, 22 ] ]
};

export function salpicadura(pos, dir, velChara = [ 0, 0, 0 ], tam = 400, opcionColor = 0) {
  const d = norm(dir), col = COLOR_SANGRE.salpicadura[opcionColor] || COLOR_SANGRE.salpicadura[0];
  return {
    nombre: "salpicadura",
    org: {
      pos: pos,
      n: 1,
      intervalo: 0,
      espera: 0
    },
    cmn: {},
    material: {
      ...MANCHAS,
      mezcla: 68,
      aref: 0
    },
    generar(p) {
      p.pos = [ ...pos ];
      p.vel = d.map((x, k) => x * 100 + velChara[k]);
      p.t = 0;
      p.alfa = 128;
      p.rmax = tam * .5;
      p.tasa = .15;
    },
    calcular(p, o, c, dt) {
      p.t += dt;
      if (p.t > .33) return false;
      p.alfa = p.t < .132 ? 85 : Math.max(0, 429.2929 * (.33 - p.t));
      p.tasa = p.t * 2.575758 + .15;
      p.pos[0] += dt * p.vel[0];
      p.pos[1] += dt * p.vel[1] * .3;
      p.pos[2] += dt * p.vel[2];
      p.vel[1] += dt * 1960;
      return true;
    },
    dibujar(p, o, c, emitir, cam) {
      if (profundidad(cam, p.pos) < 60) return;
      const r = p.rmax * p.tasa, e = (a, b) => p.pos.map((x, k) => x + cam.der[k] * a * r + cam.arr[k] * b * r);
      emitir([ e(0, 1), e(1, 0), e(-1, 0), e(0, -1) ], [ [ .50390625, .0078125 ], [ .74609375, .0078125 ], [ .50390625, .4921875 ], [ .74609375, .4921875 ] ], [ col[0] / 128, col[1] / 128, col[2] / 128, p.alfa / 128 ]);
    }
  };
}

export function gotaAlPiso(pos, dir, velChara = [ 0, 0, 0 ], tam = 200, buscarPiso, rand, opcionColor = 0) {
  const col = COLOR_SANGRE.gota[opcionColor] || COLOR_SANGRE.gota[0];
  return {
    nombre: "gota_sangre",
    org: {
      pos: pos,
      n: 1,
      intervalo: 0,
      espera: 0
    },
    cmn: {},
    material: {
      ...MANCHAS,
      mezcla: 68,
      aref: 0
    },
    generar(p) {
      const a = norm(dir);
      p.giro = rand() >> 1 & 255;
      p.dibujo = rand() & 3;
      p.rapido = Math.floor(rand.f() * 6.5);
      p.vel = [ a[0] * 240 + velChara[0], Math.min(1600, Math.max(600, velChara[1] * .7 + a[1] + 1200)), a[2] * 240 + velChara[2] ];
      p.org = [ ...pos ];
      p.tam = tam;
      p.t = 0;
      p.tCalc = rand.f() * .15;
      p.paso = 0;
      p.tAparece = 1e9;
    },
    calcular(p, o, c, dt) {
      p.t += dt;
      if (p.paso === 0 && p.t >= p.tCalc) {
        const fin = p.org.map((x, k) => x + p.vel[k]);
        const hit = buscarPiso?.(p.org, fin);
        if (!hit) return false;
        p.piso = hit;
        p.tAparece = Math.max((hit[1] - p.org[1]) / p.vel[1], 1 / 30 + .15);
        p.paso = 1;
      }
      return p.t < Math.max(p.tAparece + .8, 8) + 5;
    },
    dibujar(p, o, c, emitir, cam) {
      if (p.paso !== 1 || p.t < p.tAparece) return;
      const ang = p.giro * .02454369, hs = .5 * p.tam * Math.sin(ang), hc = .5 * p.tam * Math.cos(ang);
      const C = [ p.piso[0], p.piso[1] - 6, p.piso[2] ];
      const v = [ [ C[0] + hs, C[1], C[2] + hc ], [ C[0] + hc, C[1], C[2] - hs ], [ C[0] - hc, C[1], C[2] + hs ], [ C[0] - hs, C[1], C[2] - hc ] ];
      const cx = p.dibujo >> 1 & 1, fy = p.dibujo & 1;
      const uv = [ 0, 1, 2, 3 ].map(i => [ (cx * 32 + (i & 1 ? 31.5 : .5)) / 128, (fy * 32 + (i & 2 ? 31.5 : .5)) / 64 ]);
      const lim = Math.max(p.tAparece + .8, 8);
      const alfa = p.t < lim ? 80 : Math.max(0, 80 * (1 - (p.t - lim) / 5));
      const crece = Math.min(1, (p.t - p.tAparece) / .8);
      emitir(v, uv, [ col[0] / 128, col[1] / 128, col[2] / 128, alfa / 128 * crece ]);
    }
  };
}
