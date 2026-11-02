// SH4 web — FeniXVOID · Project Ravenlight
import { texturasDeParte, crearRand, materialPS2, geometriaDinamica, ponerMezcla } from "./comun.js";

const ARCHIVO = "crack_3ldk.bin";

export const CRACK_DATA = [ [ 1.6, 1.3, 1 ], [ .9, 1, 1.05 ], [ 1.1, .5, 1.15 ], [ .8, .4, 1.03 ], [ 1.1, .8, 1.2 ], [ 1.2, .6, 1.05 ], [ .9, .4, 1.15 ], [ .8, .7, 1.03 ], [ 1.2, .9, 1.15 ], [ .8, .5, 1.03 ] ];

const TABLA_AZAR = [ 2591461481, 941384790, 2039366183, 1216512293, 4127734092, 306393682, 4078277446, 55800373 ];

function azarGrieta(x) {
  x = Math.imul(x >>> 0, 2591461481) >>> 0;
  x = x + ((TABLA_AZAR[x & 7] ^ x) >>> 0) >>> 0;
  return (x << 23 | x >>> 9) >>> 0;
}

export const HAUNTING_LUGARES = [ {
  pos: [ 1279, -350, -160 ],
  azar: [ 0, 50, 200 ],
  normal: [ -1, 0, 0 ]
}, {
  pos: [ -163, -330, -700 ],
  azar: [ 0, 50, 150 ],
  normal: [ 1, 0, 0 ]
}, {
  pos: [ 280, -300, 200 ],
  azar: [ 0, 0, 0 ],
  normal: [ -1, 0, 0 ]
}, {
  pos: [ -250, -260, 410 ],
  azar: [ 100, 0, 0 ],
  normal: [ 0, 0, -1 ]
} ];

export const DEMO47 = [ [ 270, [ 1279, -241, -581 ], [ -1, 0, 0 ], 440, 50, 11 ], [ 700, [ 1279, -220, -340 ], [ -1, 0, 0 ], 200, 20, 6 ], [ 350, [ 1279, -417, -457 ], [ -1, 0, 0 ], 300, 14, 5 ], [ 170, [ 1175, -161, -880 ], [ 0, 0, 1 ], 140, 20, 1 ], [ 1200, [ 1066, -385, -880 ], [ 0, 0, 1 ], 100, 10, 3 ], [ 210, [ 1167, -470, -651 ], [ 0, 1, 0 ], 260, 40, 2 ], [ 320, [ 1136, -470, -200 ], [ 0, 1, 0 ], 400, 12, 2 ], [ 500, [ 1279, -369, -781 ], [ -1, 0, 0 ], 260, 60, 3 ], [ 480, [ 1156, -273, -880 ], [ 0, 0, 1 ], 200, 48, 4 ], [ 870, [ 1115, -470, -880 ], [ 0, 0, 1 ], 200, 100, 4 ], [ 860, [ 1115, -470, -800 ], [ 0, 1, 0 ], 200, 100, 4 ], [ 630, [ 1185, -330, -880 ], [ 0, 0, 1 ], 160, 40, 3 ], [ 950, [ 1279, -320, -600 ], [ -1, 0, 0 ], 200, 32, 4 ], [ 950, [ 1279, -300, -320 ], [ -1, 0, 0 ], 240, 20, 4 ], [ 800, [ 1279, -210, -700 ], [ -1, 0, 0 ], 160, 34, 3 ], [ 620, [ 1279, -360, -580 ], [ -1, 0, 0 ], 200, 38, 3 ], [ 1150, [ 1279, -380, -220 ], [ -1, 0, 0 ], 220, 36, 3 ], [ 1300, [ 1279, -160, -800 ], [ -1, 0, 0 ], 200, 40, 3 ], [ 1250, [ 1279, -390, -20 ], [ -1, 0, 0 ], 220, 40, 3 ], [ 1e3, [ 1197, -470, -400 ], [ 0, 1, 0 ], 220, 40, 3 ] ];

const V = 6;

export function crearGrietas({THREE: THREE, lib: lib, raiz: raiz, rand: rand = crearRand(4)}) {
  const grupo = new THREE.Group;
  grupo.name = "grietas_302";
  raiz.add(grupo);
  const insts = [];
  let texs = null, cargando = null, T = 0;
  let luces = [];
  let grupoIds = null;
  const dt30 = 1 / 30;
  function cargar() {
    if (!cargando) cargando = Promise.all([ 0, 2, 4 ].map(p => texturasDeParte(THREE, lib, ARCHIVO, p))).then(([t0, t2, t4]) => {
      texs = {
        linea: t0[0][0],
        carne: t2[0][0],
        fondo: t4[0][0]
      };
      for (const i of insts) armarMallas(i);
    });
    return cargando;
  }
  function crear(pos, normal, radio, nucleo, tiempo, id = insts.length) {
    const n = normal.slice(0, 3);
    const p = pos.slice(0, 3);
    p[0] += n[0] * 8;
    p[1] += n[1] * 8;
    p[2] += n[2] * 8;
    const r = rand();
    const c = {
      pos: p,
      normal: n,
      timer: 0,
      azar: ((r & 32767) << 16 | r >>> 1) >>> 0,
      atk: 0,
      atkTgt: 0,
      atkSpd: 0,
      polyTgt: radio,
      nucleoR: nucleo * .1,
      nucleoTgt: nucleo,
      nucleoSpd: 0,
      aref: 0,
      arefSpd: 0,
      arefTgt: 1,
      relieve: [ 0, 0, 0 ]
    };
    if (tiempo <= dt30) {
      c.aref = 1;
      c.nucleoR = nucleo;
    } else {
      c.arefSpd = (1 - c.aref) / tiempo;
      c.nucleoSpd = (nucleo - c.nucleoR) / tiempo;
    }
    const inst = {
      id: id,
      c: c,
      n: (c.azar >>> 5 & 1) + 6,
      lineas: [],
      carne: [],
      mallas: null,
      viva: true
    };
    let cad = c.azar;
    for (let i = 0; i < inst.n; i++) {
      cad = azarGrieta(cad);
      inst.lineas.push(hacerLinea(inst, i, cad, tiempo, null));
    }
    for (let j = 0; j <= inst.n; j++) inst.carne.push({
      rot: rand() & 3,
      f: rand.f() * .7 + 1.9,
      esq: [ [ 0, 0, 0 ], [ 0, 0, 0 ], [ 0, 0, 0 ], [ 0, 0, 0 ] ]
    });
    calcularRelieve(inst);
    insts.push(inst);
    if (texs) armarMallas(inst);
    renovarLineas(inst);
    calcularCarne(inst);
    return inst;
  }
  function hacerLinea(inst, i, azar, tiempo, l) {
    const c = inst.c;
    if (!l) {
      l = {
        dir: direccion(c.normal, i, inst.n, azar),
        tex: azar >>> 20 & 3,
        R: 0,
        Rspd: 0,
        Rtgt: 0,
        v: []
      };
      for (let k = 0; k < V; k++) l.v.push({
        p: [ 0, 0, 0 ],
        s: 0,
        t: 0,
        q: 1
      });
    }
    if (!l.creada) {
      l.R = l.Rtgt * .7;
      l.creada = true;
    }
    l.Rtgt = ((azar & 4095) * 4882813e-11 + 1) * c.polyTgt;
    if (tiempo > dt30) l.Rspd = (l.Rtgt - l.R) / tiempo * ((c.azar & 4095) * (1 / 4096) * .4 + .8); else {
      l.R = l.Rtgt;
      l.Rspd = 0;
    }
    return l;
  }
  function direccion(n, i, N, azar) {
    let eje, base;
    if (n[0] === 0 && n[2] === 0) {
      eje = [ 0, n[1] < 0 ? -1 : 1, 0 ];
      base = [ 0, 0, -1 ];
    } else {
      const L = Math.hypot(...n);
      eje = n.map(x => x / L);
      const lxz = Math.hypot(eje[0], eje[2]) || 1;
      base = [ eje[2] / lxz * -eje[1], lxz, eje[0] / lxz * -eje[1] ];
    }
    const ang = 2 * Math.PI * (i / N + .5 / N * (azar & 1048575) * 9.536743e-7);
    return rotar(base, eje, ang);
  }
  function rotar(v, e, a) {
    const c = Math.cos(a), s = Math.sin(a), d = v[0] * e[0] + v[1] * e[1] + v[2] * e[2];
    return [ 0, 1, 2 ].map(k => v[k] * c + (e[(k + 1) % 3] * v[(k + 2) % 3] - e[(k + 2) % 3] * v[(k + 1) % 3]) * s + e[k] * d * (1 - c));
  }
  function calcularRelieve(inst) {
    const c = inst.c;
    let mejor = 0, L = [ 0, 1, 0 ];
    for (const l of luces) {
      if (l.tipo !== 3 && l.tipo !== 4) continue;
      const d = [ c.pos[0] - l.pos[0], c.pos[1] - l.pos[1], c.pos[2] - l.pos[2] ], dist = Math.hypot(...d) || 1;
      const ini = l.escala * .25, fin = l.escala;
      const f = dist <= ini ? 1 : dist >= fin ? 0 : (fin - dist) / (fin - ini);
      if (f > mejor) {
        mejor = f;
        L = d.map(x => x / dist);
      }
    }
    const n = c.normal;
    const C = [ n[1] * L[2] - n[2] * L[1], n[2] * L[0] - n[0] * L[2], n[0] * L[1] - n[1] * L[0] ];
    const D = [ C[1] * n[2] - C[2] * n[1], C[2] * n[0] - C[0] * n[2], C[0] * n[1] - C[1] * n[0] ];
    const m = Math.hypot(...D) || 1;
    c.relieve = D.map(x => x / m * .84);
  }
  function renovarLineas(inst) {
    const c = inst.c;
    inst.lineas.forEach((l, i) => {
      if (dtActual * l.Rspd <= -1e-5) l.R += dtActual * l.Rspd; else l.R = l.Rtgt;
      for (let k = 0; k < V; k++) {
        const v = l.v[k];
        v.s = l.tex * 63.75 / 255;
        let d, t;
        if (k === 0) {
          t = 1.0039682;
          d = 0;
        } else {
          t = (k < 3 ? 126.5 - k * 8 : 110.5 - (k - 2) * 14.833333) * .007936508;
          if (k < 3) d = k * c.nucleoR * .5; else {
            const f = (k - 2) / 3;
            d = f * l.R + (1 - f) * c.nucleoR;
          }
        }
        let q = c.nucleoR * (k < 3 ? .8 : .3) + d;
        if (k > 0) {
          let w = (k * .1333333 + .2) * c.atk * l.R * .6;
          if (w > 200) w = 200;
          if (w >= 1e-4) {
            w *= Math.sin((T * 60 + (i + k) * .2) * 2 * Math.PI) * .35 + .65;
            q += (Math.sin(T * 240 * 2 * Math.PI) + 1) * .5 * w * 3;
            d += w;
          }
        }
        v.q = q;
        v.t = t;
        v.p[0] = c.pos[0] + d * l.dir[0];
        v.p[1] = c.pos[1] + d * l.dir[1];
        v.p[2] = c.pos[2] + d * l.dir[2];
      }
    });
  }
  function calcularCarne(inst) {
    const N = inst.n, c = inst.c.pos;
    const P = (j, f, out) => {
      const k = Math.min(V - 2, Math.trunc(f)), fr = f - k, a = inst.lineas[j].v[k].p, b = inst.lineas[j].v[k + 1].p;
      out[0] = a[0] + (b[0] - a[0]) * fr;
      out[1] = a[1] + (b[1] - a[1]) * fr;
      out[2] = a[2] + (b[2] - a[2]) * fr;
      return out;
    };
    const A = [ 0, 0, 0 ], B = [ 0, 0, 0 ];
    inst.carne.forEach((m, j) => {
      const e = m.esq;
      if (j === N) {
        P(0, m.f, e[0]);
        P(N >> 2, m.f, e[1]);
        P(N * 2 >> 2, m.f, e[2]);
        P(N * 3 >> 2, m.f, e[3]);
        return;
      }
      P(j, m.f, A);
      P((j + 1) % N, m.f, B);
      for (let x = 0; x < 3; x++) {
        const s = A[x] - c[x] + (B[x] - c[x]);
        e[0][x] = c[x] + s;
        e[3][x] = c[x] - .3 * s;
      }
      P((j - 1 + N) % N, m.f, e[1]);
      P((j + 2) % N, m.f, e[2]);
    });
  }
  function aref(m) {
    const f = (m + 1) * m * .5;
    const x = .5 * (250 - 128 * (.05 + .95 * Math.sin(f * Math.PI / 2) + .025 * (Math.sin(f * 8 * Math.PI) + 1)));
    return Math.min(127.5, Math.max(64, x));
  }
  function armarMallas(inst) {
    if (inst.mallas || !texs) return;
    const N = inst.n;
    const gFondo = geometriaDinamica(THREE, N + 2, indicesAbanico(N + 2));
    const gLin = geometriaDinamica(THREE, N * 12, indicesTiras(N, 12));
    const gCarne = geometriaDinamica(THREE, (N + 1) * 4, indicesQuads(N + 1));
    const mats = [ materialPS2(THREE, {
      mapa: texs.fondo,
      mezcla: 68
    }), materialPS2(THREE, {
      mapa: texs.linea,
      mezcla: 104,
      fix: 88 / 128,
      aref: 120,
      stencil: "marcar",
      desplazar: new THREE.Vector3
    }), materialPS2(THREE, {
      mapa: texs.linea,
      mezcla: 98,
      fix: 104 / 128,
      aref: 120
    }), materialPS2(THREE, {
      mapa: texs.carne,
      mezcla: 68,
      stencil: "probar"
    }), materialPS2(THREE, {
      mapa: texs.carne,
      mezcla: 66,
      stencil: "probar",
      desplazar: new THREE.Vector3
    }) ];
    const geos = [ gFondo, gLin, gLin, gCarne, gCarne ];
    inst.mallas = mats.map((m, k) => {
      const malla = new THREE.Mesh(geos[k], m);
      malla.frustumCulled = false;
      malla.renderOrder = 60 + inst.id * 5 + k;
      malla.userData.sinSombra = true;
      malla.name = "grieta" + inst.id + "_" + [ "fondo", "relieve", "lineas", "carne", "carne_relieve" ][k];
      grupo.add(malla);
      return malla;
    });
    inst.colores = {
      fondo: [ 20 / 128, 20 / 128, 15 / 128, 32 / 128 ],
      linea: [ 28 / 128, 32 / 128, 32 / 128, 255 / 128 ],
      carne: [ 115 / 128, 115 / 128, 115 / 128, 50 / 128 ],
      carneRel: [ 100 / 128, 110 / 128, 120 / 128, 28 / 128 ]
    };
    llenarColor(gFondo, inst.colores.fondo);
    llenarColor(gLin, inst.colores.linea);
    llenarColor(gCarne, [ 1, 1, 1, 1 ]);
    mats[3].uniforms.uColor.value.set(...inst.colores.carne);
    mats[4].uniforms.uColor.value.set(...inst.colores.carneRel);
  }
  function llenarColor(g, c) {
    const a = g.attributes.color.array;
    for (let i = 0; i < a.length; i += 4) a.set(c, i);
    g.attributes.color.needsUpdate = true;
  }
  function indicesAbanico(n) {
    const r = [];
    for (let i = 1; i + 1 < n; i++) r.push(0, i, i + 1);
    return r;
  }
  function indicesTiras(nTiras, largo) {
    const r = [];
    for (let s = 0; s < nTiras; s++) for (let i = 0; i + 2 < largo; i++) r.push(s * largo + i, s * largo + i + 1, s * largo + i + 2);
    return r;
  }
  function indicesQuads(n) {
    const r = [];
    for (let s = 0; s < n; s++) r.push(s * 4, s * 4 + 1, s * 4 + 2, s * 4 + 1, s * 4 + 3, s * 4 + 2);
    return r;
  }
  function volcar(inst) {
    const N = inst.n, c = inst.c;
    const gF = inst.mallas[0].geometry, pF = gF.attributes.position.array, uF = gF.attributes.uvq.array;
    pF.set(c.pos, 0);
    uF.set([ .3769608, .5079365, 1 ], 0);
    for (let j = 0; j <= N; j++) {
      const l = inst.lineas[j % N], a = j * 2 * Math.PI / N;
      for (let x = 0; x < 3; x++) pF[(j + 1) * 3 + x] = c.pos[x] + l.R * .9 * l.dir[x];
      uF.set([ Math.sin(a) * .12375 + .3769608, Math.cos(a) * .495 + .5079365, 1 ], (j + 1) * 3);
    }
    gF.attributes.position.needsUpdate = gF.attributes.uvq.needsUpdate = true;
    const gL = inst.mallas[1].geometry, pL = gL.attributes.position.array, uL = gL.attributes.uvq.array;
    let o = 0;
    for (let i = 0; i < N; i++) {
      const a = inst.lineas[i], b = inst.lineas[(i + 1) % N];
      for (let k = 0; k < V; k++) for (let lado = 0; lado < 2; lado++) {
        const v = (lado ? b : a).v[k];
        const u = k === 0 ? a.v[0].s + .075 : lado * .25 + a.v[k].s;
        pL.set(v.p, o * 3);
        uL.set([ u * v.q, v.t * v.q, v.q ], o * 3);
        o++;
      }
    }
    gL.attributes.position.needsUpdate = gL.attributes.uvq.needsUpdate = true;
    const ar = aref(c.aref);
    inst.mallas[1].material.uniforms.uAref.value = ar;
    inst.mallas[2].material.uniforms.uAref.value = ar;
    inst.mallas[1].material.uniforms.uOfs.value.set(...c.relieve);
    inst.mallas[4].material.uniforms.uOfs.value.set(...c.relieve);
    const gC = inst.mallas[3].geometry, pC = gC.attributes.position.array, uC = gC.attributes.uvq.array;
    const UV = [ [ .01612903, .01612903 ], [ 1.016129, .01612903 ], [ .01612903, 1.016129 ], [ 1.016129, 1.016129 ] ];
    inst.carne.forEach((m, j) => {
      for (let k = 0; k < 4; k++) {
        pC.set(m.esq[k], (j * 4 + k) * 3);
        uC.set([ UV[k][0], UV[k][1], 1 ], (j * 4 + k) * 3);
      }
    });
    gC.attributes.position.needsUpdate = gC.attributes.uvq.needsUpdate = true;
  }
  let dtActual = dt30;
  function actualizar(dt) {
    dtActual = dt;
    T += dt * .016666668;
    if (T > 1) T -= 1;
    for (const inst of insts) {
      if (!inst.viva) continue;
      const c = inst.c;
      c.timer += dt;
      c.aref = acercar(c.aref, c.arefTgt, c.arefSpd, dt, () => {
        c.arefSpd = 0;
      });
      c.nucleoR = acercar(c.nucleoR, c.nucleoTgt, c.nucleoSpd, dt, () => {
        c.nucleoSpd = 0;
      });
      if (c.polyTgt > 2 || c.nucleoTgt > 0 || c.nucleoR > 0 || c.nucleoSpd > 0) {
        c.atk = Math.max(0, acercar(c.atk, c.atkTgt, c.atkSpd, dt, () => {
          c.atkSpd = 0;
        }));
        renovarLineas(inst);
        calcularCarne(inst);
        if (inst.mallas) volcar(inst);
      } else borrar(inst);
    }
  }
  function acercar(v, tgt, spd, dt, alLlegar) {
    const paso = dt * spd;
    if (Math.abs(tgt - v) > Math.abs(paso)) return v + paso;
    alLlegar();
    return tgt;
  }
  function borrar(inst) {
    inst.viva = false;
    for (const m of inst.mallas || []) {
      grupo.remove(m);
      m.material.dispose();
    }
    inst.mallas?.[0].geometry.dispose();
    inst.mallas?.[1].geometry.dispose();
    inst.mallas?.[3].geometry.dispose();
  }
  function renovar(inst, radio, nucleo, arefTgt, tiempo) {
    if (!inst?.viva) return false;
    const c = inst.c;
    c.arefTgt = arefTgt;
    c.polyTgt = radio;
    c.nucleoTgt = nucleo;
    if (tiempo < dt30) {
      c.aref = arefTgt;
      c.nucleoR = nucleo;
      c.arefSpd = c.nucleoSpd = 0;
    } else {
      c.arefSpd = (arefTgt - c.aref) / tiempo;
      c.nucleoSpd = (nucleo - c.nucleoR) / tiempo;
    }
    inst.lineas.forEach((l, i) => hacerLinea(inst, i, c.azar, tiempo, l));
    return true;
  }
  function ataque(inst, tasa, tiempo) {
    if (!inst?.viva) return;
    const c = inst.c;
    c.atkTgt = tasa;
    if (tiempo === 0) {
      c.atkSpd = 1;
      c.atk = tasa;
    } else c.atkSpd = (tasa - c.atk) / tiempo;
  }
  function crearGrupo(pos, normal, radio = 140, nucleo = 20, tiempo = 10) {
    let y = pos[1] >>> 0, z = pos[2] >>> 0;
    grupoIds = CRACK_DATA.map((fila, k) => {
      let p = pos.slice();
      if (k > 0) {
        y = azarGrieta(Math.trunc(pos[1]) | 0);
        z = azarGrieta(Math.trunc(pos[2]) | 0);
        for (let r = 0; r < k; r++) {
          y = azarGrieta(y);
          z = azarGrieta(z);
        }
        p = [ pos[0], (y >>> 9 & 255) - 128 + pos[1], (z >>> 9 & 255) - 128 + pos[2] ];
      }
      return crear(p, normal, radio * fila[0], nucleo * fila[1], tiempo * fila[2], insts.length);
    });
    return grupoIds;
  }
  function renovarGrupo(radio, nucleo, arefTgt, tiempo) {
    grupoIds?.forEach((inst, k) => renovar(inst, radio * CRACK_DATA[k][0], nucleo * CRACK_DATA[k][1], arefTgt, tiempo * CRACK_DATA[k][2]));
  }
  function desvanecerGrupo(tiempo) {
    grupoIds?.forEach(inst => renovar(inst, 2, 0, 0, tiempo));
  }
  let haunting = null;
  function iniciarHaunting(lugar = 1, potencia = 1e4) {
    const L = HAUNTING_LUGARES[Math.max(0, Math.min(3, lugar - 1))];
    const p = L.pos.map((x, k) => x + rand.f() * L.azar[k]);
    crearGrupo(p, L.normal, 140, 20, 10);
    haunting = {
      pos: p,
      potencia: potencia
    };
  }
  function actualizarHaunting(distJugador) {
    if (!haunting) return;
    const v = haunting.potencia * 1e-4, r = Math.sqrt(Math.max(0, v));
    renovarGrupo((Math.sqrt(r) * .85 + .15) * .7 * 200, (r * .65 + .35) * .1 * 200, v, 0);
    const tasa = distJugador < 400 ? (400 - distJugador) / 400 : 0;
    grupoIds?.forEach(inst => ataque(inst, tasa, 0));
  }
  let demo = null;
  function iniciarDemo47() {
    demo = {
      cuadro: 0,
      hechas: new Set,
      renovadas: new Set,
      insts: []
    };
  }
  function actualizarDemo(dt) {
    if (!demo) return;
    const antes = demo.cuadro;
    demo.cuadro += dt * 30;
    DEMO47.forEach(([cuadro, pos, normal, radio, nucleo, tiempo], k) => {
      if (!demo.hechas.has(k) && antes < cuadro && cuadro <= demo.cuadro) {
        demo.hechas.add(k);
        demo.insts[k] = crear(pos, normal, radio, nucleo, tiempo);
      }
      const c2 = cuadro + Math.trunc(30 * tiempo * .8);
      if (demo.insts[k] && !demo.renovadas.has(k) && antes < c2 && c2 <= demo.cuadro) {
        demo.renovadas.add(k);
        renovar(demo.insts[k], radio * 1.3, nucleo * 1.3, 1, 30);
      }
    });
  }
  return {
    grupo: grupo,
    cargar: cargar,
    crear: crear,
    renovar: renovar,
    ataque: ataque,
    crearGrupo: crearGrupo,
    renovarGrupo: renovarGrupo,
    desvanecerGrupo: desvanecerGrupo,
    iniciarHaunting: iniciarHaunting,
    actualizarHaunting: actualizarHaunting,
    iniciarDemo47: iniciarDemo47,
    ponerLuces(l) {
      luces = l || [];
      for (const i of insts) if (i.viva) calcularRelieve(i);
    },
    actualizar(dt, distJugador) {
      actualizarDemo(dt);
      actualizarHaunting(distJugador ?? 1e9);
      actualizar(dt);
    },
    limpiar() {
      for (const i of insts) if (i.viva) borrar(i);
      insts.length = 0;
      grupoIds = null;
      haunting = null;
      demo = null;
    },
    get instancias() {
      return insts.filter(i => i.viva);
    },
    materiales() {
      const r = [];
      for (const i of insts) if (i.viva && i.mallas) for (const m of i.mallas) r.push(m.material);
      return r;
    }
  };
}
