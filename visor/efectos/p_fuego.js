// SH4 web — FeniXVOID · Project Ravenlight
import { posGen, velGen, profundidad } from "./particulas.js";

const TEX = {
  archivo: "jsp_fire.bin",
  parte: 0
};

const VIDA = .9;

const FILA_V = [ .001953125, .1269531, .2519531, .3769531 ];

function trabajo(pos, alto, {brillo: brillo = 1, ancho: ancho = 60, chgIni: chgIni = 0, chgT: chgT = .1} = {}) {
  return {
    pos: [ ...pos ],
    prev: [ ...pos ],
    vel: 0,
    brillo: brillo,
    alto: alto,
    ancho: ancho,
    chgIni: chgIni,
    chgT: chgT,
    vidaRate: 1,
    objs: []
  };
}

function renovar(o, fw) {
  o.pos = fw.pos;
  fw.vidaRate = Math.max(.3, 1 - VIDA / fw.alto * fw.vel * .3);
}

function particulas(fw, intervalo, demo) {
  const max = fw.alto / VIDA;
  return {
    nombre: "fuego",
    quads: 1,
    material: {
      ...TEX,
      mezcla: 72,
      aref: 0
    },
    org: {
      pos: fw.pos,
      vec1: [ 0, 0, 0 ],
      vec2: [ 0, 0, 0 ],
      dir: [ 0, -1, 0 ],
      n: -10,
      intervalo: intervalo,
      espera: .1,
      abre: 0,
      max: max,
      min: .6 * max,
      demo: demo
    },
    cmn: fw,
    generar(p, o, c, rand) {
      const a = rand.f(), b = rand.f();
      renovar(o, c);
      p.vida = c.vidaRate * VIDA;
      p.pos = posGen(o, a, b);
      p.vel = velGen(o, rand);
      p.diam = (rand.f() * .7 + .3) * c.ancho;
      p.alto = (rand.f() + 1) * .8 * p.diam;
      p.t = 0;
      p.ang = rand.f() * 6.283185;
      const r = rand();
      p.azar = (r & 32767) << 16 | r >>> 1;
    },
    calcular(p, o, c, dt) {
      renovar(o, c);
      p.vel[1] -= dt * 100;
      const f = 1 - dt * .5;
      for (let k = 0; k < 3; k++) {
        p.vel[k] *= f;
        p.pos[k] += dt * p.vel[k];
      }
      p.t += dt;
      if (p.t > p.vida * .6) p.diam *= .985;
      return p.t <= p.vida;
    },
    dibujar(p, o, c, emitir, cam) {
      if (p.t < 0 || profundidad(cam, p.pos) < 60) return;
      const cuadro = Math.min(7, Math.max(0, Math.trunc(p.t * 9 / p.vida - 2)));
      const fa = p.t < .01 ? p.t * 100.001 : p.t > p.vida * .4 ? (p.vida - p.t) / (p.vida * .6) : 1;
      const A = Math.trunc(fa * c.brillo * 30);
      let R, B;
      if (p.t < c.chgIni) {
        R = 18;
        B = 50;
      } else if (c.chgT !== 0 && p.t < c.chgIni + c.chgT) {
        const k = (p.t - c.chgIni) / c.chgT;
        R = 18 + 62 * k;
        B = 50 - 35 * k;
      } else {
        R = 80;
        B = 15;
      }
      const col = [ Math.trunc(R) / 128, Math.trunc(.7 * R) / 128, Math.trunc(B) / 128, A / 128 ];
      const fr = cam.fr, aY = Math.atan2(fr[0], fr[2]), aX = .75 * Math.atan2(-fr[1], Math.hypot(fr[0], fr[2]));
      const der = [ Math.cos(aY), 0, -Math.sin(aY) ], aba = [ Math.sin(aY) * Math.sin(aX), Math.cos(aX), Math.cos(aY) * Math.sin(aX) ];
      const cs = Math.cos(p.ang), sn = Math.sin(p.ang);
      const esq = [ [ -.5, -.5 ], [ .5, -.5 ], [ -.5, .5 ], [ .5, .5 ] ].map(([x, y]) => {
        const sx = (x * cs - y * sn) * p.diam, sy = (x * sn + y * cs) * p.alto;
        return [ 0, 1, 2 ].map(k => p.pos[k] + der[k] * sx + aba[k] * sy);
      });
      const u0 = (cuadro * 32 + .5) / 256 + .001953125, v0 = FILA_V[p.azar & 3], d = .1210938;
      emitir(esq, [ [ u0, v0 ], [ u0 + d, v0 ], [ u0, v0 + d ], [ u0 + d, v0 + d ] ], col);
    }
  };
}

const J = (x, y, z, hueso, alto, ancho, chgT) => ({
  local: [ x, y, z ],
  hueso: hueso,
  alto: alto,
  ancho: ancho,
  chgT: chgT
});

export const JASPER = {
  cuerpo: {
    brillo: .65,
    tabla: [ J(40, -15, 20, 13, 80, 40, 0), J(25, -10, -10, 18, 100, 40, .3), J(50, 0, -10, 18, 60, 30, .2), J(-10, -35, -30, 9, 200, 60, 0), J(20, -25, 30, 9, 100, 60, .3), J(-10, -15, -30, 9, 140, 90, 0), J(-40, -10, 15, 9, 140, 80, 0), J(40, 5, 15, 9, 140, 50, .2), J(-10, 0, 30, 1, 280, 90, .05), J(10, 10, 30, 1, 140, 60, .25), J(20, 25, 30, 1, 160, 44, 0), J(0, 0, 30, 5, 160, 30, .15), J(0, 40, 0, 2, 120, 40, .15) ]
  },
  mas: {
    brillo: 1.3,
    tabla: [ J(25, -5, 30, 9, 340, 140, .5), J(-25, 5, 30, 9, 340, 160, .5), J(-26, 60, 30, 1, 400, 140, .5) ]
  },
  piso: {
    brillo: .7,
    tabla: [ J(20, 0, 120, -1, 320, 160, .1), J(-70, 0, 110, -1, 200, 120, .1), J(60, 0, 100, -1, 160, 60, .1), J(-100, 0, 100, -1, 240, 100, .1), J(130, 0, 130, -1, 80, 40, .1) ]
  }
};

export function crearFuegos({motor: motor, THREE: THREE, escala: escala = .005}) {
  const fuegos = new Set;
  const velas = new Map;
  const jaspers = [];
  const v3 = THREE ? new THREE.Vector3 : null;
  function encender(fw, demo, veces = 1) {
    for (let r = 0; r < veces; r++) for (let i = 0; i < 3; i++) fw.objs.push(motor.crear(particulas(fw, i * .08 + .03, demo)));
    fuegos.add(fw);
    return fw;
  }
  function apagar(fw) {
    if (!fw) return;
    for (const o of fw.objs) motor.apagar(o);
    fuegos.delete(fw);
  }
  function mover(fw, pos, dt) {
    if (dt > 0) fw.vel = Math.hypot(pos[0] - fw.pos[0], pos[1] - fw.pos[1], pos[2] - fw.pos[2]) / dt;
    fw.prev = fw.pos;
    fw.pos = [ ...pos ];
    for (const o of fw.objs) o.o.pos = fw.pos;
  }
  function posHueso(h, n, local, piso) {
    const m = typeof h === "function" ? h(n) : h?.[n]?.matrixWorld;
    if (!m || !v3) return null;
    v3.set(local[0], local[1], local[2]).applyMatrix4(m);
    const p = [ -v3.x / escala, -v3.y / escala, v3.z / escala ];
    if (piso != null) p[1] = piso;
    return p;
  }
  return {
    fuego(pos, alto = 200, ancho = 60, brillo = 1, demo = false) {
      return encender(trabajo(pos, alto, {
        brillo: brillo,
        ancho: ancho
      }), demo);
    },
    vela(n, pos, alto = 200, ancho = 40, demo = false) {
      apagar(velas.get(n));
      const fw = encender(trabajo(pos, alto, {
        brillo: .6,
        ancho: ancho,
        chgT: .1
      }), demo, 2);
      velas.set(n, fw);
      return fw;
    },
    apagarVela(n) {
      apagar(velas.get(n));
      velas.delete(n);
    },
    jasper(huesos, modo = "cuerpo", piso = 0, demo = true) {
      const def = JASPER[modo];
      if (!def) throw new Error("modo de jasper: cuerpo | mas | piso");
      const lista = def.tabla.map(e => {
        const p0 = posHueso(huesos, e.hueso < 0 ? 8 : e.hueso, e.local, e.hueso < 0 ? piso : null) || [ 0, 0, 0 ];
        const fw = encender(trabajo(p0, e.alto, {
          brillo: def.brillo,
          ancho: e.ancho,
          chgT: e.chgT
        }), demo);
        const j = {
          fw: fw,
          e: e,
          huesos: huesos,
          piso: piso
        };
        jaspers.push(j);
        return fw;
      });
      return lista;
    },
    apagar: apagar,
    actualizar(dt) {
      for (const j of jaspers) {
        const p = posHueso(j.huesos, j.e.hueso < 0 ? 8 : j.e.hueso, j.e.local, j.e.hueso < 0 ? j.piso : null);
        if (p) mover(j.fw, p, dt);
      }
    },
    mover: mover,
    limpiar() {
      for (const fw of fuegos) apagar(fw);
      fuegos.clear();
      velas.clear();
      jaspers.length = 0;
    },
    get cantidad() {
      return fuegos.size;
    }
  };
}

export function crearLugaresVela({lib: lib, leerColision: leerColision}) {
  let zonas = null;
  const cargar = async () => {
    if (zonas) return zonas;
    const r = await fetch("/juego/data/rl_candle.bin");
    if (!r.ok) throw new Error("no pude leer rl_candle.bin");
    const buf = await r.arrayBuffer();
    zonas = lib.partesBin(buf).map(p => (leerColision(buf, p.ofs, p.len)?.polis || []).map(q => {
      const v = [];
      for (let i = 0; i < q.v.length; i += 3) v.push([ q.v[i], q.v[i + 1], q.v[i + 2] ]);
      return v;
    }));
    return zonas;
  };
  const adentro = (v, x, z) => {
    let s = false;
    for (let i = 0, j = v.length - 1; i < v.length; j = i++) {
      if (v[i][2] > z !== v[j][2] > z && x < (v[j][0] - v[i][0]) * (z - v[i][2]) / (v[j][2] - v[i][2]) + v[i][0]) s = !s;
    }
    return s;
  };
  return {
    cargar: cargar,
    buscar(habitacion, pos, frente = [ 0, 0, 1 ]) {
      const polis = zonas?.[habitacion - 1];
      if (!polis) return null;
      const L = Math.hypot(frente[0], frente[2]) || 1, fx = frente[0] / L, fz = frente[2] / L;
      for (let i = 0; i < 10; i++) for (const s of i ? [ 1, -1 ] : [ 0 ]) {
        const x = pos[0] + s * fx * 12.5 * i, z = pos[2] + s * fz * 12.5 * i;
        for (const v of polis) if (adentro(v, x, z)) return [ x, v[0][1] - 20, z ];
      }
      return null;
    },
    get zonas() {
      return zonas;
    }
  };
}
