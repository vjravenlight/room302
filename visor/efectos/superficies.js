// SH4 web — FeniXVOID · Project Ravenlight
import { texturasDeParte, materialPS2, geometriaDinamica, crearRand } from "./comun.js";

const envolver = a => {
  a %= 2 * Math.PI;
  return a > Math.PI ? a - 2 * Math.PI : a < -Math.PI ? a + 2 * Math.PI : a;
};

const ANILLOS = [ [ 250, .002, 60, 6.2832 ], [ 340, .0846, 80, 10.0531 ], [ 360, .002, 60, 7.5398 ], [ 380, .0846, 34, 12.5664 ], [ 440, .1673, 80, 8.1681 ], [ 480, .0846, 30, 11.3097 ], [ 520, .002, 90, 7.5398 ], [ 560, .1673, 40, 10.6814 ], [ 700, .002, 32, 6.2832 ], [ 760, .1673, 12, 10.0531 ], [ 940, .25, 26, 10.0531 ], [ 1120, .3327, 12, 10.0531 ], [ 1280, .25, 26, 6.9115 ], [ 1440, .3327, 10, 6.9115 ] ];

const LUCES_CHARCO = [ [ [ 0, 1384, -2218 ], 1 ], [ [ 0, 844, 1400 ], .7 ] ];

export function crearCharco({THREE: THREE, lib: lib, raiz: raiz, camara: camara, escala: escala, rand: rand = crearRand(5)}) {
  const RAYOS = 16, K = 14;
  const v = [];
  let centro = [ 0, 0, 0 ], activo = false;
  const idx = [];
  for (let i = 0; i < RAYOS; i++) for (let k = 0; k + 1 < K; k++) {
    const a = i * K + k, b = (i + 1) % RAYOS * K + k;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const N = (RAYOS + 1) * K;
  const idx2 = [];
  for (let i = 0; i < RAYOS; i++) for (let k = 0; k + 1 < K; k++) {
    const a = i * K + k, b = (i + 1) * K + k;
    idx2.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const gS = geometriaDinamica(THREE, N, idx2), gR = geometriaDinamica(THREE, N, idx2);
  const mS = materialPS2(THREE, {
    mezcla: 68,
    region: new THREE.Vector4(0, .49609375, 0, .49609375)
  });
  const mR = materialPS2(THREE, {
    mezcla: 72
  });
  const grupo = new THREE.Group;
  grupo.name = "charco_final";
  raiz.add(grupo);
  for (const [g, m, o] of [ [ gS, mS, 30 ], [ gR, mR, 31 ] ]) {
    const x = new THREE.Mesh(g, m);
    x.frustumCulled = false;
    x.renderOrder = o;
    x.userData.sinSombra = true;
    grupo.add(x);
  }
  grupo.visible = false;
  texturasDeParte(THREE, lib, "last_boss_bg_eff.bin", 0).then(t => {
    for (const m of [ mS, mR ]) {
      m.uniforms.mapa.value = t[0][0];
      m.uniforms.uTieneMapa.value = 1;
    }
  });
  function iniciar(c) {
    centro = c.slice(0, 3);
    activo = true;
    grupo.visible = true;
    v.length = 0;
    for (let i = 0; i < RAYOS; i++) {
      const s = Math.sin(i * .3926991), co = Math.cos(i * .3926991), fila = [];
      for (let k = 0; k < K; k++) {
        const [rd, tt] = ANILLOS[k];
        fila.push({
          s: s,
          c: co,
          rd: rd,
          pos: [ centro[0] + rd * s, centro[1], centro[2] + rd * co ],
          base: envolver(rd * .02617994),
          anillo: rand.f() * 2 * Math.PI,
          bu: i * .06225586 + .001953125,
          bv: tt,
          q: 1,
          rgb: 1,
          ref: 0,
          ru: 0,
          rv: 0
        });
      }
      v.push(fila);
    }
  }
  const cam = new THREE.Vector3, mv = new THREE.Matrix4;
  function actualizar(dt) {
    if (!activo) return;
    camara.getWorldPosition(cam);
    const cj = [ -cam.x / escala, -cam.y / escala, cam.z / escala ];
    mv.copy(camara.matrixWorldInverse);
    for (let i = 0; i < RAYOS; i++) for (let k = 0; k < K; k++) {
      const p = v[i][k], [, , amp, om] = ANILLOS[k];
      p.base = envolver(p.base + dt * 2 * Math.PI);
      p.anillo = envolver(p.anillo + dt * om);
      p.pos[1] = 10 * Math.sin(p.base) + amp * Math.sin(p.anillo) + centro[1];
      const d = norm3(p.pos.map((x, j) => x - cj[j])), n = norm3([ p.s * p.rd / 1480, .8, p.c * p.rd / 1480 ]);
      const r = (d[0] * n[0] + d[1] * n[1] + d[2] * n[2]) * .3 + .7;
      p.rgb = r <= 0 ? 0 : k === 0 ? r * .4 : r;
      p.ref = reflejo(p.pos, cj);
      p.q = Math.cos(p.anillo) * .7 + 1.2;
      const sb = Math.sin(p.base), sr = Math.sin(p.anillo), cr = Math.cos(p.anillo);
      const nn = norm3([ sb * p.s + sr * p.s + cr * p.c, -2, sb * p.c + sr * p.c - cr * p.s ]);
      const vx = new THREE.Vector3(-nn[0], -nn[1], nn[2]).transformDirection(mv);
      p.ru = vx.x * .118125 + .6210938;
      p.rv = -vx.y * .118125 + .125;
    }
    volcar();
  }
  function reflejo(P, cj) {
    const dV = norm3(P.map((x, j) => x - cj[j]));
    let tot = 0;
    for (const [L, pow] of LUCES_CHARCO) {
      const d = [ L[0] - cj[0], L[1] * .75 - cj[1], L[2] - cj[2] ], dist = Math.hypot(...d), dn = d.map(x => x / dist);
      const ang = (1 - dn[1] * dn[1] - .2) * 1.25;
      if (ang <= 0) continue;
      const r = (dV[0] * dn[0] + dV[1] * dn[1] + dV[2] * dn[2] - .9396926) / (1 - .9396926), dr = 1 - dist / 16e3;
      if (r > 0 && dr >= 0) tot += dr * pow * r * ang;
    }
    return Math.min(tot, 1);
  }
  function volcar() {
    const ps = gS.attributes.position.array, us = gS.attributes.uvq.array, cs = gS.attributes.color.array;
    const pr = gR.attributes.position.array, ur = gR.attributes.uvq.array, cr = gR.attributes.color.array;
    for (let i = 0; i <= RAYOS; i++) for (let k = 0; k < K; k++) {
      const p = v[i % RAYOS][k], o = i * K + k, q = p.q, bu = i === RAYOS ? .998047 : p.bu;
      ps.set(p.pos, o * 3);
      pr.set(p.pos, o * 3);
      us.set([ bu * q, p.bv * q, q ], o * 3);
      ur.set([ p.ru * q, p.rv * q, q ], o * 3);
      const ola = .85 + .15 * Math.sin(p.base) * Math.sin(p.anillo);
      cs.set([ p.rgb * ola, p.rgb * ola * .5, p.rgb * ola * .5, 1 ], o * 4);
      cr.set([ 1, 1, 1, p.ref * (.75 + .25 * Math.sin(p.anillo)) ], o * 4);
    }
    for (const g of [ gS, gR ]) for (const a of [ "position", "uvq", "color" ]) g.attributes[a].needsUpdate = true;
  }
  return {
    grupo: grupo,
    iniciar: iniciar,
    actualizar: actualizar,
    detener() {
      activo = false;
      grupo.visible = false;
    },
    get activo() {
      return activo;
    },
    materiales: () => [ mS, mR ]
  };
}

export function crearAguaMz39({THREE: THREE, lib: lib, raiz: raiz, rand: rand = crearRand(9)}) {
  const L = 16, paso = 129.8313, vs = [];
  const idx = [];
  for (let z = 0; z + 1 < L; z++) for (let x = 0; x + 1 < L; x++) {
    const a = z * L + x, b = a + L;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const capas = [ [ 0, 493, 80 / 128, 1 ], [ 1, 209.99998, 60 / 128, 60 / 128 ] ].map(([modo, y, rgb, a]) => {
    const g = geometriaDinamica(THREE, L * L, idx), m = materialPS2(THREE, {
      mezcla: 68
    });
    const malla = new THREE.Mesh(g, m);
    malla.frustumCulled = false;
    malla.renderOrder = 20 + modo;
    malla.userData.sinSombra = true;
    return {
      modo: modo,
      y: y,
      rgb: rgb,
      a: a,
      g: g,
      m: m,
      malla: malla
    };
  });
  const grupo = new THREE.Group;
  grupo.name = "agua_mz39";
  raiz.add(grupo);
  grupo.visible = false;
  for (const c of capas) grupo.add(c.malla);
  texturasDeParte(THREE, lib, "mz39_water_floor.bin", 0).then(t => {
    for (const c of capas) {
      c.m.uniforms.mapa.value = t[0][0];
      c.m.uniforms.uTieneMapa.value = 1;
    }
  });
  let activo = false, acum = 0;
  function iniciar() {
    vs.length = 0;
    for (let z = 0; z < L; z++) for (let x = 0; x < L; x++) vs.push({
      x: -155 + (x + (.5 - rand.f()) * .2) * paso,
      z: 1400 - (z + (.5 - rand.f()) * .2) * paso,
      u: x / 30,
      v: z / 15,
      ofs: (2 * rand.f() - 1) * 7,
      vel: 0,
      gen: 0,
      ang: rand.f() * 2 * Math.PI,
      sig: 0
    });
    activo = true;
    grupo.visible = true;
  }
  function paso1() {
    let max = .7;
    for (let z = 0; z < L; z++) for (let x = 0; x < L; x++) {
      const p = vs[z * L + x];
      const s = (x ? vs[z * L + x - 1].ofs : 0) + (x < L - 1 ? vs[z * L + x + 1].ofs : 0) + (z ? vs[(z - 1) * L + x].ofs : 0) + (z < L - 1 ? vs[(z + 1) * L + x].ofs : 0);
      let acc = (s - p.ofs * 5) * 50 * .2;
      if (p.gen) {
        p.ang = envolver(p.ang + 2 * Math.PI / 30);
        acc += Math.sin(p.ang) * p.gen;
      }
      p.vel += acc / 30;
      p.vel *= 1 - .05 / 30;
      p.sig = p.ofs + p.vel / 30;
      max = Math.max(max, Math.abs(p.sig));
    }
    const k = 7 / max;
    for (const p of vs) p.ofs = p.sig * k;
  }
  function actualizar(dt) {
    if (!activo) return;
    acum += dt;
    while (acum >= 1 / 30) {
      acum -= 1 / 30;
      paso1();
    }
    for (const c of capas) {
      const pos = c.g.attributes.position.array, uvq = c.g.attributes.uvq.array, col = c.g.attributes.color.array;
      vs.forEach((p, i) => {
        const tasa = (p.ofs + 7) * .1428571, q = tasa * .2 + .8;
        pos.set([ p.x, c.y + p.ofs, p.z ], i * 3);
        uvq.set([ (p.u + (c.modo ? .5 : 0)) * q, p.v * q, q ], i * 3);
        const b = c.rgb * (.9 + .1 * tasa);
        col.set([ b, b, b, c.a ], i * 4);
      });
      for (const a of [ "position", "uvq", "color" ]) c.g.attributes[a].needsUpdate = true;
    }
  }
  return {
    grupo: grupo,
    iniciar: iniciar,
    actualizar: actualizar,
    detener() {
      activo = false;
      grupo.visible = false;
    },
    get activo() {
      return activo;
    },
    materiales: () => capas.map(c => c.m)
  };
}

function norm3(v) {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [ v[0] / l, v[1] / l, v[2] / l ];
}
