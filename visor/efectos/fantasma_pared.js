// SH4 web — FeniXVOID · Project Ravenlight
import { partesBin } from "../lib/sh4bin.js";

import { leerTexturas, aRGBA } from "../lib/texturas.js";

import { texturasDeParte, crearRand, materialPS2, geometriaDinamica, ponerNieblaEnMaterial } from "./comun.js";

const ARCHIVO = "enemy_tex.bin";

export const RECORTES = [ [ 0, 0, 0, 0 ], [ 0, 0, 32, 32 ], [ 0, 32, 32, 128 ], [ 0, 160, 32, 96 ], [ 32, 0, 96, 64 ], [ 32, 64, 96, 96 ], [ 128, 0, 96, 160 ], [ 32, 160, 192, 96 ], [ 224, 0, 32, 64 ], [ 224, 64, 32, 64 ], [ 224, 128, 32, 64 ], [ 224, 192, 32, 64 ] ];

export const TIPO = [ 1, 1, 1, 4, 5, 1, 1, 6, 4, 7, 5, 1, 7, 4, 6, 1, 1, 6, 4, 7, 5, 1, 7, 4, 6 ];

export const GOTEO = [ 0, 1, 2, -1, -1, 3, 4, -1, -1, -1, -1, 5, -1, -1, -1, 6, 7, -1, -1, -1, 8, -1, -1, -1, 2 ];

const TEX_GOTEO = [ 2, 3 ];

export const PARAMETRO = {
  ancho: 100,
  alto: 100,
  aparece: 3,
  esperaManchas: 1,
  tiempoManchas: 2,
  esperaBorrar: 5,
  tiempoBorrar: 2
};

export const HUESOS_HILOS = [ 1, 1, 2, 2, 3, 3, 5, 5, 6, 6, 8, 8, 9, 9, 11, 11, 12, 12, 13, 13, 14, 14, 16, 16, 17, 17, 18, 18, 19, 19, 21, 21 ];

export const DEMO47_FANTASMA = {
  pos: [ 1256.03, -273, -92 ],
  normal: [ -1, 0, 0 ],
  inicio: 700,
  pegajoso: 750,
  borrar: -1,
  personaje: 403
};

const DT = 1 / 30;

const SEPARA = 8;

const ALFA_MANCHA = 95 / 128;

const MAX_MANCHAS = 25, MAX_GOTEOS = 16, MAX_HILOS = 32;

function arribaDe(n) {
  let f = [ n[2], 0, -n[0] ];
  if (f[0] * f[0] + f[1] * f[1] + f[2] * f[2] < 1e-6) f = [ 0, -n[2], n[1] ];
  const r = [ f[1] * n[2] - f[2] * n[1], f[2] * n[0] - f[0] * n[2], f[0] * n[1] - f[1] * n[0] ];
  const l = Math.hypot(...r) || 1;
  return r.map(v => v / l);
}

function girar(v, e, a) {
  const c = Math.cos(a), s = Math.sin(a), d = v[0] * e[0] + v[1] * e[1] + v[2] * e[2];
  const x = [ e[1] * v[2] - e[2] * v[1], e[2] * v[0] - e[0] * v[2], e[0] * v[1] - e[1] * v[0] ];
  return [ 0, 1, 2 ].map(i => v[i] * c + x[i] * s + e[i] * d * (1 - c));
}

export function crearFantasmaPared({THREE: THREE, raiz: raiz, rand: rand = crearRand(47)}) {
  const lib = {
    partesBin: partesBin,
    leerTexturas: leerTexturas,
    aRGBA: aRGBA
  };
  const grupo = new THREE.Group;
  grupo.name = "fantasma_pared_d047";
  raiz.add(grupo);
  const azar01 = () => rand() / 32768;
  const azarS = () => {
    const r = rand(), u = (r << 17 | r) >>> 0;
    let f = (u & 2147483647) * 4.656612873077393e-10;
    if (u & 2147483648) f = -f;
    return Math.max(-.99, Math.min(.99, f));
  };
  let texMancha = null, texHilo = null, cargando = null;
  const matMancha = materialPS2(THREE, {
    mezcla: 68
  }), matHilo = materialPS2(THREE, {
    mezcla: 68,
    aref: 0
  });
  matMancha.depthWrite = false;
  matHilo.depthWrite = false;
  const gM = geometriaDinamica(THREE, MAX_MANCHAS * 2 * 4, quads(MAX_MANCHAS * 2));
  const gH = geometriaDinamica(THREE, MAX_HILOS * 2 * 4, quads(MAX_HILOS * 2));
  const mallaM = new THREE.Mesh(gM, matMancha), mallaH = new THREE.Mesh(gH, matHilo);
  for (const m of [ mallaM, mallaH ]) {
    m.frustumCulled = false;
    m.renderOrder = 20;
    m.visible = false;
    grupo.add(m);
  }
  mallaM.name = "manchas";
  mallaH.name = "hilos";
  function quads(n) {
    const r = [];
    for (let i = 0; i < n; i++) r.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3);
    return r;
  }
  function cargar() {
    if (!cargando) cargando = Promise.all([ texturasDeParte(THREE, lib, ARCHIVO, 1), texturasDeParte(THREE, lib, ARCHIVO, 0) ]).then(([t1, t0]) => {
      texMancha = t1[0][0];
      texHilo = t0[0][0];
      matMancha.uniforms.mapa.value = texMancha;
      matMancha.uniforms.uTieneMapa.value = 1;
      matHilo.uniforms.mapa.value = texHilo;
      matHilo.uniforms.uTieneMapa.value = 1;
    }).catch(e => console.warn("fantasma_pared:", e.message));
    return cargando;
  }
  let E = null;
  function nuevaMancha(op) {
    const n = op.normal.slice(0, 3), arriba = arribaDe(n);
    const m = {
      pos: op.pos.slice(0, 3),
      n: n,
      arriba: arriba,
      reloj: 0,
      paso: 0,
      manchas: [],
      goteos: Array.from({
        length: MAX_GOTEOS
      }, () => ({
        tex: -1,
        largo: 0,
        actual: 0
      })),
      nGoteos: 0,
      tabla: GOTEO.slice()
    };
    for (let i = 0; i < 46; i++) azarS();
    return m;
  }
  function brotaMancha(m) {
    const k = m.manchas.length, tipo = TIPO[k];
    const r = tipo === 1 ? azar01() * 1.5 : azarS() * .1;
    const esc = (r + 1) * .65;
    const v = girar(m.arriba, m.n, azarS() * Math.PI), f = azarS();
    const c = [ m.pos[0] + v[0] * f * PARAMETRO.ancho, m.pos[1] + v[1] * f * PARAMETRO.alto, m.pos[2] + v[2] * f * PARAMETRO.ancho ];
    const giro = azarS() * Math.PI;
    m.manchas.push({
      tipo: tipo,
      esc: esc,
      c: c,
      giro: giro
    });
    const g = m.tabla[k];
    if (g > 0) {
      m.goteos[g].tex = TEX_GOTEO[rand() >> 1 & 1];
      m.goteos[g].largo = (azarS() * .2 + 1) * 240;
      m.nGoteos++;
    }
  }
  function brotaGoteo(m) {
    const s = m.nGoteos;
    if (s >= MAX_GOTEOS) return;
    let k, vueltas = 0;
    do {
      const u = rand();
      k = ((u & 32767) << 16 | u >> 1) % 25;
    } while (m.tabla[k] !== -1 && ++vueltas < 500);
    if (m.tabla[k] !== -1) {
      m.nGoteos++;
      return;
    }
    m.tabla[k] = s;
    m.goteos[s].tex = TEX_GOTEO[rand() >> 1 & 1];
    m.goteos[s].largo = (azarS() * .2 + 1) * 240;
    m.nGoteos = s + 1;
  }
  function pasoMancha(m) {
    m.reloj += DT;
    if (m.paso === 0 && m.reloj >= PARAMETRO.aparece) m.paso = 1;
    let t = (m.reloj - PARAMETRO.esperaManchas) / PARAMETRO.tiempoManchas, extra = 0;
    if (t > 1) {
      extra = (t - 1) * .01;
      t = 1;
    }
    const objetivo = Math.round(t * 25 - .49);
    while (m.manchas.length < Math.min(MAX_MANCHAS, objetivo)) brotaMancha(m);
    if (extra > 0) {
      const nd = Math.min(MAX_GOTEOS, Math.round(extra * 25 - .49) + 9);
      while (m.nGoteos < nd) brotaGoteo(m);
    }
    for (const g of m.goteos) {
      if (!(g.tex > 0)) continue;
      let d = DT * 10;
      if (g.largo - 40 < g.actual) d = (g.largo - g.actual) * d * .025;
      g.actual += d;
    }
  }
  function nacenHilos(huesos) {
    const m = E.mancha, n = m.n, c = m.pos, lista = [];
    for (let i = 0; i < HUESOS_HILOS.length; i++) {
      const p = huesos(HUESOS_HILOS[i]);
      if (!p) continue;
      const d = (p[0] - c[0]) * n[0] + (p[1] - c[1]) * n[1] + (p[2] - c[2]) * n[2];
      const a = [ p[0] - d * n[0], p[1] - d * n[1], p[2] - d * n[2] ];
      const r = [ azarS(), azarS(), azarS() ], rn = r[0] * n[0] + r[1] * n[1] + r[2] * n[2];
      for (let k = 0; k < 3; k++) a[k] += (r[k] - rn * n[k]) * 24;
      const fila = rand() >> 1 & 255 & 1;
      lista.push({
        ancla: a,
        punta: p.slice(),
        fila: fila,
        dir: 1,
        roto: false,
        oculto: true,
        largo: azar01() * 240 + 160,
        t: 0
      });
    }
    return lista;
  }
  function pasoHilos(huesos) {
    const m = E.mancha, n = m.n, c = m.pos;
    let fila = 0;
    for (let i = 0; i < E.hilos.length; i++) {
      const h = E.hilos[i];
      const p = huesos(HUESOS_HILOS[fila++]);
      if (p) h.punta = p.slice();
      const v = [ h.punta[0] - c[0], h.punta[1] - c[1], h.punta[2] - c[2] ];
      if (v[0] * n[0] + v[1] * n[1] + v[2] * n[2] >= -10) {
        h.oculto = false;
        if (!h.roto && h.largo * h.largo < v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) h.roto = true;
        if (h.roto) {
          h.t += 2 * DT;
          if (h.t >= 1) {
            h.oculto = true;
            E.hilos.splice(i, 1);
            i--;
          }
        }
      } else h.oculto = true;
    }
  }
  function ponerQuad(g, q, esq, uv, col) {
    const P = g.attributes.position.array, U = g.attributes.uvq.array, C = g.attributes.color.array;
    for (let k = 0; k < 4; k++) {
      P.set(esq[k], (q * 4 + k) * 3);
      U[(q * 4 + k) * 3] = uv[k][0];
      U[(q * 4 + k) * 3 + 1] = uv[k][1];
      U[(q * 4 + k) * 3 + 2] = 1;
      C.set(col, (q * 4 + k) * 4);
    }
  }
  function quadPared(g, q, centro, mm, ancho, alto, giro, rec, alfa) {
    const n = mm.n, c = [ centro[0] + n[0] * SEPARA, centro[1] + n[1] * SEPARA, centro[2] + n[2] * SEPARA ];
    const hv = girar(mm.arriba, n, giro).map(x => x * alto), wv = girar(mm.arriba, n, giro + Math.PI / 2).map(x => x * ancho);
    const e = (sh, sw) => [ c[0] + sh * hv[0] + sw * wv[0], c[1] + sh * hv[1] + sw * wv[1], c[2] + sh * hv[2] + sw * wv[2] ];
    const u0 = rec[0] / 256, v0 = rec[1] / 256, u1 = (rec[0] + rec[2]) / 256, v1 = (rec[1] + rec[3]) / 256;
    ponerQuad(g, q, [ e(1, 1), e(1, -1), e(-1, -1), e(-1, 1) ], [ [ u0, v0 ], [ u1, v0 ], [ u1, v1 ], [ u0, v1 ] ], [ 1, 1, 1, alfa ]);
  }
  function dibujar() {
    if (!E?.mancha) {
      mallaM.visible = mallaH.visible = false;
      return;
    }
    const m = E.mancha;
    let q = 0;
    m.manchas.forEach((s, k) => {
      const rec = RECORTES[s.tipo], w = rec[2] * s.esc, h = rec[3] * s.esc;
      const gi = m.tabla[k];
      if (gi > 0 && m.goteos[gi].tex > 0) {
        const go = m.goteos[gi], r = go.actual * .5;
        const alfa = go.actual < 10 ? go.actual * .1 : 1;
        const a = Math.round(alfa * 96 - .49) / 128;
        if (a > 0) quadPared(gM, q++, [ s.c[0], s.c[1] + r, s.c[2] ], m, 32, h + r, 0, RECORTES[go.tex], a);
      }
      quadPared(gM, q++, s.c, m, w, h, s.giro, rec, ALFA_MANCHA);
    });
    gM.setDrawRange(0, q * 6);
    for (const k of [ "position", "uvq", "color" ]) gM.attributes[k].needsUpdate = true;
    mallaM.visible = q > 0 && !!texMancha;
    let qh = 0;
    for (const h of E.hilos || []) {
      if (h.oculto) continue;
      const v0 = h.fila * .5, v1 = v0 + .5, A = h.ancla, B = h.punta;
      const a0 = [ A[0], A[1] - 10, A[2] ], a1 = [ A[0], A[1] + 10, A[2] ], b0 = [ B[0], B[1] - 10, B[2] ], b1 = [ B[0], B[1] + 10, B[2] ];
      if (!h.roto) {
        ponerQuad(gH, qh++, [ a0, b0, b1, a1 ], [ [ 0, v0 ], [ 1, v0 ], [ 1, v1 ], [ 0, v1 ] ], [ 1, 1, 1, 1 ]);
        continue;
      }
      const t = h.t, p = 1 - (1 - t) ** 4, alfa = t >= .75 ? 1 - ((t - .75) * 4) ** 2 : 1, f = .5 - .5 * p;
      const L = (x, y, k) => [ x[0] + (y[0] - x[0]) * k, x[1] + (y[1] - x[1]) * k, x[2] + (y[2] - x[2]) * k ];
      const col = [ 1, 1, 1, Math.round(alfa * 128 - .49) / 128 ];
      ponerQuad(gH, qh++, [ a0, L(a0, b0, f), L(a1, b1, f), a1 ], [ [ 0, v0 ], [ .5, v0 ], [ .5, v1 ], [ 0, v1 ] ], col);
      ponerQuad(gH, qh++, [ L(a0, b0, 1 - f), b0, b1, L(a1, b1, 1 - f) ], [ [ .5, v0 ], [ 1, v0 ], [ 1, v1 ], [ .5, v1 ] ], col);
    }
    gH.setDrawRange(0, qh * 6);
    for (const k of [ "position", "uvq", "color" ]) gH.attributes[k].needsUpdate = true;
    mallaH.visible = qh > 0 && !!texHilo;
  }
  function irA(cuadro) {
    if (!E) return;
    const f = Math.round(cuadro - .49);
    if (f < E.cuadro) {
      const {op: op, huesos: huesos} = E;
      iniciar(op, huesos);
    }
    let tope = 4e3;
    while (E.cuadro < f && tope-- > 0) {
      E.cuadro++;
      const op = E.op, c = E.cuadro;
      const hu = h => E.huesos(c, h);
      if (!E.mancha && c >= op.inicio) E.mancha = nuevaMancha(op);
      if (E.mancha && !E.hilos && c >= op.pegajoso) E.hilos = nacenHilos(hu);
      if (E.mancha) pasoMancha(E.mancha);
      if (E.hilos) pasoHilos(hu);
    }
    dibujar();
  }
  function iniciar(op = DEMO47_FANTASMA, huesos = () => null) {
    rand.semilla?.(47);
    E = {
      op: op,
      huesos: huesos,
      cuadro: -1,
      mancha: null,
      hilos: null
    };
    cargar();
    dibujar();
  }
  function limpiar() {
    E = null;
    mallaM.visible = mallaH.visible = false;
  }
  return {
    grupo: grupo,
    cargar: cargar,
    iniciar: iniciar,
    irA: irA,
    limpiar: limpiar,
    materiales: () => [ matMancha, matHilo ],
    niebla(co, escala, activa = true) {
      for (const m of [ matMancha, matHilo ]) ponerNieblaEnMaterial(m, co, escala, activa);
    },
    get estado() {
      return E ? {
        cuadro: E.cuadro,
        manchas: E.mancha?.manchas.length || 0,
        chorreados: E.mancha?.nGoteos || 0,
        largoChorreados: E.mancha ? E.mancha.goteos.filter(g => g.tex > 0).map(g => Math.round(g.actual)) : [],
        hilos: E.hilos ? E.hilos.length : null,
        hilosVisibles: E.hilos ? E.hilos.filter(h => !h.oculto).length : 0,
        hilosCortados: E.hilos ? E.hilos.filter(h => h.roto).length : 0
      } : null;
    }
  };
}
