// SH4 web — FeniXVOID · Project Ravenlight
import { posGen, velGen, segmentoPx, profundidad, norm } from "./particulas.js";

const ATLAS = {
  archivo: "system_load.bin",
  parte: 2
};

const c128 = (r, g, b, a) => [ r / 128, g / 128, b / 128, a / 128 ];

function gotas(org, cmn, nombre) {
  return {
    nombre: nombre,
    org: org,
    cmn: cmn,
    quads: 2,
    material: {
      ...ATLAS,
      mezcla: 68,
      fix: null
    },
    generar(p, o, c, rand) {
      p.pos = posGen(o, rand.f(), rand.f());
      p.vel = velGen(o, rand);
      p.paso = 0;
      p.t = 0;
      p.onda = 0;
      p.fin = [ 0, 0 ];
    },
    calcular(p, o, c, dt) {
      p.t += dt;
      const lluvia = c.tipo === 1, roce = lluvia ? .03 : .1, rebote = lluvia ? -194 : -180;
      p.vel[1] += 1960 * dt;
      const k = 1 - roce * dt;
      for (let i = 0; i < 3; i++) {
        p.vel[i] *= k;
        p.pos[i] += p.vel[i] * dt;
      }
      if (p.paso === 0 && p.pos[1] > c.piso) p.paso = 1;
      if (p.paso === 1) {
        p.fin = [ p.pos[0], p.pos[2] ];
        p.vel[0] *= .13;
        p.vel[2] *= .13;
        p.pos[1] = c.piso;
        p.vel[1] = rebote;
        p.paso = 2;
        for (let i = 0; i < 3; i++) p.pos[i] += p.vel[i] * dt;
      }
      if (p.paso === 2) {
        p.onda += dt;
        if (p.pos[1] >= c.piso) {
          p.pos[1] = c.piso;
          for (let i = 0; i < 3; i++) p.vel[i] *= .4;
        }
        if (p.onda > c.vidaOnda) return false;
      }
      return true;
    },
    dibujar(p, o, c, emitir, cam) {
      const w = profundidad(cam, p.pos);
      if (w < 60) return;
      const lluvia = c.tipo === 1;
      let wF = lluvia ? 1.2 : 1.5, wA = wF;
      if (p.onda > 0) {
        wF *= 1.8;
        wA = 2 * wF;
      }
      const cola = p.onda > 0 ? [ .7 * p.pos[0] + .3 * p.fin[0], c.piso, .7 * p.pos[2] + .3 * p.fin[1] ] : p.pos.map((x, k) => x - p.vel[k] * (1 / 30) * (lluvia ? 1.7 : 1));
      const u = c.tex === 1 ? .902 : .777;
      const alfa = Math.min(1, 120 / w + .7);
      emitir(segmentoPx(cam, p.pos, cola, wF, wA), [ [ u, .498 ], [ u, .498 ], [ u, .252 ], [ u, .252 ] ], [ c.rgba[0], c.rgba[1], c.rgba[2], c.rgba[3] * alfa ]);
      if (p.onda > 0 && c.ondaMax > 0) {
        const ta = (c.vidaOnda - p.onda) / (.4 * c.vidaOnda);
        if (ta <= 0) return;
        const s = p.onda / c.vidaOnda * c.ondaMax, cx = .6 * p.pos[0] + .4 * p.fin[0] - s / 2, cz = .6 * p.pos[2] + .4 * p.fin[1] - s / 2;
        emitir([ [ cx, c.piso, cz ], [ cx + s, c.piso, cz ], [ cx, c.piso, cz + s ], [ cx + s, c.piso, cz + s ] ], [ [ .00195, .252 ], [ .248, .252 ], [ .00195, .498 ], [ .248, .498 ] ], [ c.rgba[0], c.rgba[1], c.rgba[2], c.rgba[3] * Math.min(1, ta) ]);
      }
    }
  };
}

export function lluvia(centro, piso = -1) {
  const org = {
    pos: [ centro[0] - 600, centro[1], centro[2] - 600 ],
    vec1: [ 1200, 0, 0 ],
    vec2: [ 0, 0, 1200 ],
    dir: [ -.15, 1, -.1 ],
    n: -10,
    intervalo: .1,
    espera: -2,
    abre: .0698,
    max: 2e3,
    min: 1700
  };
  const cmn = {
    tipo: 1,
    tex: 0,
    rgba: c128(80, 73, 67, 38),
    piso: piso,
    ondaMax: 80,
    vidaOnda: .3
  };
  return Array.from({
    length: 5
  }, () => gotas({
    ...org,
    pos: [ ...org.pos ]
  }, cmn, "lluvia"));
}

export function goteoMz(centro = [ 0, -700, 0 ], onditas = true, sala = "") {
  const org = {
    pos: [ centro[0] - 2e3, centro[1], centro[2] - 2e3 ],
    vec1: [ 4e3, 0, 0 ],
    vec2: [ 0, 0, 4e3 ],
    dir: [ 0, 1, 0 ],
    n: -10,
    intervalo: .1,
    espera: -4,
    abre: 0,
    max: 20,
    min: 20
  };
  const cmn = {
    tipo: 0,
    tex: 0,
    rgba: c128(80, 73, 67, sala === "bd11" ? 32 : 54),
    piso: -1,
    ondaMax: onditas ? 120 : 0,
    vidaOnda: .6
  };
  return Array.from({
    length: 3
  }, () => gotas({
    ...org,
    pos: [ ...org.pos ]
  }, cmn, "goteo"));
}

export function gotasFacil({centro: centro, ancho: ancho = 10, vel: vel = [ 0, 200, 0 ], negra: negra = false, rgba: rgba = c128(80, 73, 67, 54), veces: veces = -10, intervalo: intervalo = .5, piso: piso = 0, onda: onda = 30}) {
  const v = Math.hypot(...vel);
  return gotas({
    pos: [ centro[0] - ancho / 2, centro[1], centro[2] - ancho / 2 ],
    vec1: [ ancho, 0, 0 ],
    vec2: [ 0, 0, ancho ],
    dir: vel,
    n: veces,
    intervalo: intervalo,
    espera: 0,
    abre: .08727,
    max: v,
    min: .9 * v
  }, {
    tipo: 0,
    tex: negra ? 1 : 0,
    rgba: rgba,
    piso: piso,
    ondaMax: onda,
    vidaOnda: .7
  }, "gotas");
}

export function sangreNegra(centro, vel = [ 0, 100, 0 ], intervalo = .4, piso = 0, unaVez = false) {
  return gotasFacil({
    centro: centro,
    ancho: 2.6,
    vel: vel,
    negra: true,
    rgba: c128(52, 52, 52, 120),
    veces: unaVez ? 1 : -10,
    intervalo: unaVez ? 1 : intervalo,
    piso: piso,
    onda: 30
  });
}

const CUADROS_HUMO = [ [ .752, .002 ], [ .252, .002 ], [ .502, .002 ], [ .752, .002 ] ];

function humo(org, cmn, nombre) {
  return {
    nombre: nombre,
    org: org,
    cmn: cmn,
    material: {
      ...ATLAS,
      mezcla: 68,
      fix: null,
      aref: 0
    },
    generar(p, o, c, rand) {
      p.pos = posGen(o, rand.f(), rand.f());
      p.vel = velGen(o, rand);
      p.t = 0;
      p.xz = (rand.f() * .25 + 1) * c.xz;
      p.alto = c.alto;
      p.vida = (rand.f() * .2 + .8) * c.vida;
      p.pres = (rand.f() + .5) * c.pres;
      p.giro = (rand.f() - .5) * 2 * Math.PI;
      const r = rand();
      p.azar = ((r & 32767) << 16 | r >>> 1) >>> 0;
    },
    calcular(p, o, c, dt) {
      p.t += dt;
      const r9 = p.azar >>> 6 & 511;
      let vg = (.5 - r9 / 511) * 1.745329;
      if (Math.abs(vg) > .174533) vg = Math.sign(vg) * (.174533 + (Math.abs(vg) - .174533) * .2);
      p.giro += vg * dt;
      const acc = [ 0, c.acelY, 0 ];
      if (c.aire) {
        o.tAire = (o.tAire || 0) + dt / 64;
        const ph = (p.azar >>> 10 & 255) / 255 * 2, amp = Math.cos((ph + p.t) * Math.PI) * .3 + .7;
        const ofs = [ Math.sin((ph + p.t) * 2.0944) * amp * 80, 0, Math.cos((ph + p.t) * 2.0944) * amp * 80 ];
        const tasa = Math.cos(o.tAire * .2) * .6 + Math.cos(o.tAire * .13) * .4 - .2;
        for (const z of c.aire.atraer) {
          const d = [ 0, 1, 2 ].map(k => z.pos[k] - (p.pos[k] - ofs[k])), L = Math.hypot(...d);
          if (L < z.rango) {
            const k = z.valor / z.rango * tasa;
            acc[0] += d[0] * k;
            acc[1] += d[1] * k * .2;
            acc[2] += d[2] * k;
          }
        }
        for (const z of c.aire.flujo) {
          const L = Math.hypot(...[ 0, 1, 2 ].map(k => z.pos[k] - (p.pos[k] - ofs[k])));
          if (L < z.rango) for (let k = 0; k < 3; k++) acc[k] += z.acel[k] * tasa;
        }
      }
      for (let k = 0; k < 3; k++) p.vel[k] += acc[k] * dt;
      p.vel[1] *= 1 - 4 * dt;
      p.vel[0] *= 1 - 2 * dt;
      p.vel[2] *= 1 - 2 * dt;
      const mv = p.vel.map(x => x * dt);
      if (p.pos[1] < c.techo + c.distTecho) {
        const f = 1 - (p.pos[1] - c.techo) / c.distTecho;
        mv[1] *= 1 - f;
        mv[0] *= 1 + f;
        mv[2] *= 1 + f;
      }
      for (let k = 0; k < 3; k++) p.pos[k] += mv[k];
      const P2 = p.pres - (p.pres - 1) * dt * c.difPres, s = Math.sqrt(p.pres / P2) - 1;
      p.pres = P2;
      p.xz *= 1 + 1.4 * s;
      p.alto *= 1 + .5 * s;
      return p.t <= p.vida;
    },
    dibujar(p, o, c, emitir, cam) {
      const w = profundidad(cam, p.pos);
      if (w < 60) return;
      let rx = 1, ry = 1;
      if (p.pos[1] < c.techo + c.distTecho) {
        const f = 1 - (p.pos[1] - c.techo) / c.distTecho;
        rx = 1 + 4 * f;
        ry = 1 - .7 * f;
      }
      const d = norm(p.pos.map((x, k) => x - cam.pos[k]));
      const angY = Math.atan2(d[0], d[2]), angX = Math.atan2(-d[1], Math.hypot(d[0], d[2])) * .75;
      const der = [ Math.cos(angY), 0, -Math.sin(angY) ];
      const arr = [ Math.sin(angY) * Math.sin(angX), Math.cos(angX), Math.cos(angY) * Math.sin(angX) ];
      const cs = Math.cos(p.giro), sn = Math.sin(p.giro);
      const R = der.map((x, k) => (x * cs + arr[k] * sn) * p.xz * rx), U = arr.map((x, k) => (x * cs - der[k] * sn) * p.alto * ry);
      const e = (a, b) => [ 0, 1, 2 ].map(k => p.pos[k] + R[k] * a + U[k] * b);
      const tA = p.t < .3 ? p.t * 3.3343 : p.t <= .4 * p.vida ? 1 : (p.vida - p.t) / (.6 * p.vida);
      const cerca = Math.min(1, Math.max(0, (w - 60) * .00625));
      const [u0, v0] = CUADROS_HUMO[p.azar & 3], du = .2461;
      emitir([ e(-.5, -.5), e(.5, -.5), e(-.5, .5), e(.5, .5) ], [ [ u0, v0 ], [ u0 + du, v0 ], [ u0, v0 + du ], [ u0 + du, v0 + du ] ], [ c.rgba[0], c.rgba[1], c.rgba[2], c.rgba[3] * cerca * Math.max(0, tA) ]);
    }
  };
}

const HUMO_CMN = o => ({
  techo: -2e4,
  distTecho: 200,
  rgba: c128(43, 45, 50, 40),
  acelY: -400,
  xz: 60,
  alto: 138,
  pres: 2,
  difPres: .1,
  vida: 5,
  aire: null,
  ...o
});

export function humoPuertaEspacio(p1, p2, techo) {
  return [ 0, .13333, .26667, .4, .65 ].map(z => humo({
    pos: [ ...p1 ],
    vec1: [ 40, 0, 0 ],
    vec2: [ 0, p2[1] - p1[1], 0 ],
    dir: [ 0, -1, z ],
    n: -10,
    intervalo: .6,
    espera: -3,
    abre: .2618,
    max: 220,
    min: 160
  }, HUMO_CMN({
    techo: techo,
    distTecho: 120,
    pres: 5,
    difPres: .16
  }), "humo_puerta"));
}

const FR23 = [ [ 3374, 1442, 100, .3491, 13, .4 ], [ 3980, 1680, 160, 1.3963, 13, .6 ], [ 4100, 1380, 200, 1.3963, 20, .6 ], [ 3900, 1330, 240, 1.3963, 30, 1 ], [ 3700, 1580, 140, 1.3963, 15, .6 ], [ 3694, 2e3, 50, .3491, 6, .4 ], [ 4e3, 2300, 180, 1.3963, 10, .5 ], [ 3928, 2564, 140, 1.0472, 10, .4 ], [ 3828, 2764, 180, .6981, 18, .8 ], [ 3788, 2664, 100, .3491, 15, .6 ], [ 4077, 2610, 60, .5236, 7, .4 ], [ 3906, 2625, 20, .6109, 5, .4 ], [ 3286, 2696, 60, .3491, 8, .5 ], [ 2985, 1980, 40, 3.1416, 5, .4 ], [ 3072, 2219, 80, .1745, 6, .4 ], [ 2800, 1586, 40, .5236, 4, .4 ], [ 2522, 1684, 80, -.1745, 7, .5 ], [ 2196, 1532, 40, .5236, 4, .4 ], [ 2920, 2647, 60, .3491, 5, .4 ], [ 2650, 1211, 60, .3491, 5, .4 ], [ 3265, 789, 100, 1.0472, 8, .4 ], [ 3265, 789, 60, 1.0472, 5, .4 ], [ 3160, 550, 60, -.1745, 4, .4 ], [ 3622, 1100, 80, -.1745, 5, .4 ] ];

const AIRE_FR23 = {
  atraer: [ {
    pos: [ 3482, -2e3, 2310 ],
    rango: 1800,
    valor: 400
  } ],
  flujo: [ {
    pos: [ 3508, -2200, 2125 ],
    rango: 3e3,
    acel: [ -200, 34, 100 ]
  } ]
};

export function humoCasaQuemada() {
  return FR23.map(([x, z, W, ang, vida, intervalo]) => humo({
    pos: [ x - W / 4, 0, z - W / 4 ],
    vec1: [ W / 4, 0, W / 4 ],
    vec2: [ 0, 0, 0 ],
    dir: [ .7 * Math.sin(ang), -1, .7 * Math.cos(ang) ],
    n: -10,
    intervalo: intervalo,
    espera: -8,
    abre: .1745,
    max: 220,
    min: 160
  }, HUMO_CMN({
    xz: W,
    alto: 2.3 * W,
    vida: vida,
    aire: AIRE_FR23
  }), "humo_fr23"));
}

const RICHARD = [ [ -530, -142, 35, 50, 30 ], [ -450, -202, 45, 50, 16 ], [ -490, -172, 65, 50, 20 ], [ -500, -132, 95, 50, 16 ], [ -470, -192, 12, 50, 16 ] ];

export function humoRichard(alfa = 48) {
  return RICHARD.map(([x, y, z, ZW, SW]) => humo({
    pos: [ x, y, z - .5 * ZW ],
    vec1: [ 0, 0, ZW ],
    vec2: [ 0, 0, 0 ],
    dir: [ 0, -1, 0 ],
    n: -10,
    intervalo: .3,
    espera: 0,
    abre: .1745,
    max: 40,
    min: 0
  }, HUMO_CMN({
    rgba: c128(55, 60, 70, alfa),
    acelY: -320,
    xz: SW / 2,
    alto: 2 * SW,
    difPres: .3
  }), "humo_richard"));
}
