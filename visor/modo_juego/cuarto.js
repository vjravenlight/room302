// SH4 web — FeniXVOID · Project Ravenlight
import * as THREE from "three";

import { armarSala, crearLucesPersonajes, ESCALA } from "../lib/sala.js";

import { partesBin } from "../lib/sh4bin.js";

import { leerModelo } from "../lib/modelo.js";

import { leerTexturas } from "../lib/texturas.js";

import { leerAnimacion } from "../lib/animacion.js";

import { crearPersonaje } from "../lib/personaje.js";

import { crearPiso } from "../lib/colision.js";

import { EQUIPO_CHICO } from "./motor.js";

const ANIM_VENT_LIVING = [ "event_rl00_cmn.bin", 19 ], ANIM_VENT_DORM = [ "event_rl01_cmn.bin", 2 ];

const OBJ_RADIO = {
  arch: "event_rl00_cmn.bin",
  m: 0,
  t: 1,
  a: [ "event_rl00_cmn.bin", 2 ],
  radio: true
};

export const OBJETOS_FIJOS = {
  rl00a: [ OBJ_RADIO, {
    arch: "event_rl00.bin",
    m: 5,
    t: 6,
    a: ANIM_VENT_LIVING
  } ],
  rl00b: [ OBJ_RADIO, {
    arch: "event_rl00.bin",
    m: 5,
    t: 6,
    a: ANIM_VENT_LIVING
  } ],
  rl00c: [ OBJ_RADIO, {
    arch: "event_rl00.bin",
    m: 7,
    t: 8,
    a: ANIM_VENT_LIVING
  } ],
  rl00d: [ OBJ_RADIO, {
    arch: "event_rl00_cmn.bin",
    m: 17,
    t: 18,
    a: ANIM_VENT_LIVING
  } ],
  rl00g: [ OBJ_RADIO, {
    arch: "event_rl00_cmn.bin",
    m: 17,
    t: 18,
    a: ANIM_VENT_LIVING
  } ],
  rl00e: [ OBJ_RADIO ],
  rl00f: [ OBJ_RADIO ],
  rl00h: [ OBJ_RADIO ],
  rl01a: [ {
    arch: "event_rl01.bin",
    m: 2,
    t: 3,
    a: ANIM_VENT_DORM
  } ],
  rl01b: [ {
    arch: "event_rl01.bin",
    m: 4,
    t: 5,
    a: ANIM_VENT_DORM
  } ],
  rl01c: [ {
    arch: "event_rl01_cmn.bin",
    m: 0,
    t: 1,
    a: ANIM_VENT_DORM
  } ],
  rl01d: [ {
    arch: "event_rl01_cmn.bin",
    m: 0,
    t: 1,
    a: ANIM_VENT_DORM
  } ]
};

export const MUNDOS_EXTRA = {
  rl00a: [ "rl00a_text" ]
};

export const EXTRAS_ESTADO = {
  rl00a_text: E => E.F(1508)
};

const heladera = {
  5: E => !E.heladera,
  6: E => E.heladera
};

export const MODELOS_ESTADO = {
  rl00a: {
    5: E => !E.F(305),
    6: E => E.F(305),
    7: E => !E.heladera,
    8: E => E.heladera
  },
  rl00b: heladera,
  rl00c: heladera,
  rl00d: heladera,
  rl00h: heladera,
  rl00e: {
    ...heladera,
    7: E => !E.F(1577),
    8: E => E.F(1577)
  },
  rl03a: {
    5: E => !E.F(1565),
    8: E => !E.F(1565),
    10: E => !E.F(1565),
    9: E => E.F(1565),
    11: E => E.F(1565),
    7: E => E.F(1567)
  },
  rl01a: {
    6: () => false
  }
};

export const PARTES_OBJETO = {
  rl01a: {
    ocultar: [ 5 ],
    mostrar: [ 6 ]
  }
};

export const OJOS = 1.65;

const RADIO = .25, PASO = .45;

export const aMundo = p => new THREE.Vector3(-p[0] * ESCALA, -p[1] * ESCALA, p[2] * ESCALA);

export const rumboDe = d => Math.atan2(d[0], -d[2]);

export function crearCuarto({M: M, bajar: bajar, E: E}) {
  const salaGrupo = new THREE.Group;
  salaGrupo.name = "sala302";
  M.escena.add(salaGrupo);
  const globales = new Map;
  let sala = null, colision = null, puertas = [], escenaN = null;
  const rayo = new THREE.Raycaster, abajo = new THREE.Vector3(0, -1, 0), tmp = new THREE.Vector3;
  const cache = new Map;
  const MAX_SALAS = EQUIPO_CHICO ? 2 : 5, usoSala = new Map;
  let relojSala = 0;
  function soltarSala(nombre) {
    const p = cache.get(nombre);
    if (!p) return;
    cache.delete(nombre);
    usoSala.delete(nombre);
    p.then(s => {
      if (s !== sala || !salaGrupo.children.includes(s.grupo)) {
        s.grupo.removeFromParent();
        s.dispose?.();
      } else cache.set(nombre, p);
    }, () => {});
  }
  function recortarSalas(actual) {
    const otras = [ ...cache.keys() ].filter(n => n !== actual).sort((a, b) => (usoSala.get(a) || 0) - (usoSala.get(b) || 0));
    while (otras.length + 1 > MAX_SALAS) soltarSala(otras.shift());
  }
  function soltarSalas() {
    for (const n of [ ...cache.keys() ]) soltarSala(n);
    for (const o of objetos.splice(0)) liberar(o.grupo);
    if (sala && !salaGrupo.children.includes(sala.grupo)) {
      sala = {
        nombre: sala.nombre,
        grupo: new THREE.Group,
        luces: [],
        colision: null,
        niebla: null,
        suelta: true
      };
      colision = null;
    }
    bins.clear();
  }
  const bins = new Map;
  const bin = a => {
    if (!bins.has(a)) bins.set(a, bajar("data/" + a).then(b => ({
      b: b,
      p: partesBin(b)
    })));
    return bins.get(a);
  };
  const objetos = [];
  async function crearModelo({arch: arch, m: pm, t: pt, a: a = null, tArch: tArch = null}) {
    const m = await bin(arch), M_ = m.p[pm];
    const tb = tArch ? await bin(tArch) : m, T = tb.p[pt];
    const pj = crearPersonaje(leerModelo(m.b, M_.ofs, M_.len), T ? leerTexturas(tb.b, T.ofs, T.len) : []);
    if (a) {
      const ma = await bin(a[0]), A = ma.p[a[1]];
      if (A?.tipo === "animacion") {
        pj.poner(leerAnimacion(ma.b, A.ofs, A.len));
        pj.reproductor.loop = true;
      }
    }
    pj.grupo.name = `objeto ${arch} #${pm}`;
    return pj;
  }
  const mundosExtra = new Map;
  async function cargarObjetos(nombre) {
    for (const o of objetos.splice(0)) liberar(o.grupo);
    for (const def of OBJETOS_FIJOS[nombre] || []) {
      try {
        const pj = await crearModelo(def);
        pj.radio = !!def.radio;
        if (!pj.radio) pj.grupo.userData.enDemo = true;
        if (pj.radio) {
          pj.grupo.visible = !!api.radioPrendida;
          pj.grupo.traverse(x => {
            if (!x.isMesh) return;
            const sinLuz = m => {
              const b = new THREE.MeshBasicMaterial({
                map: m.map,
                transparent: m.transparent,
                alphaTest: m.alphaTest,
                side: m.side
              });
              m.dispose();
              return b;
            };
            x.material = Array.isArray(x.material) ? x.material.map(sinLuz) : sinLuz(x.material);
          });
        }
        salaGrupo.add(pj.grupo);
        objetos.push(pj);
      } catch (e) {
        console.warn("objeto", def.arch, e.message);
      }
    }
    for (const extra of MUNDOS_EXTRA[nombre] || []) {
      try {
        if (!mundosExtra.has(extra)) mundosExtra.set(extra, armarSala(THREE, bajar, extra, globales, {
          colisionDerivada: false
        }));
        const s = await mundosExtra.get(extra);
        s.grupo.name = "extra " + extra;
        if (EXTRAS_ESTADO[extra]) s.grupo.visible = !!EXTRAS_ESTADO[extra](api.estado || {
          F: () => false,
          heladera: false
        });
        salaGrupo.add(s.grupo);
      } catch (e) {
        console.warn("extra", extra, e.message);
      }
    }
  }
  function aplicarEstado() {
    const E = api.estado || {
      F: () => false,
      heladera: false
    };
    for (const g of salaGrupo.children) {
      const k = /^extra (.+)$/.exec(g.name)?.[1];
      if (k && EXTRAS_ESTADO[k]) g.visible = !!EXTRAS_ESTADO[k](E);
    }
    const reglas = sala && MODELOS_ESTADO[sala.nombre];
    if (!reglas) {
      M.redibujar();
      return;
    }
    for (const g of sala.grupo.children) {
      const n = /^mundo_(\d+)$/.exec(g.name)?.[1];
      if (n != null && reglas[n]) g.visible = !!reglas[n](E);
    }
    M.redibujar();
  }
  function escenaDe(nombre) {
    return Object.entries(E.salas || {}).find(([, s]) => s === nombre.slice(0, 4))?.[0] ?? null;
  }
  async function cargar(nombre, {porPuerta: porPuerta = null, pos: pos = null, giro: giro = null} = {}) {
    if (!cache.has(nombre)) cache.set(nombre, armarSala(THREE, bajar, nombre, globales, {
      todosLosModelos: true
    }));
    usoSala.set(nombre, ++relojSala);
    let s;
    const p = cache.get(nombre);
    try {
      s = await p;
    } catch (e) {
      if (cache.get(nombre) === p) cache.delete(nombre);
      throw e;
    }
    if (!cache.has(nombre)) cache.set(nombre, p);
    recortarSalas(nombre);
    salaGrupo.clear();
    salaGrupo.add(s.grupo);
    sala = s;
    colision = s.colision;
    escenaN = escenaDe(nombre);
    aplicarEstado();
    salaGrupo.add(crearLucesPersonajes(THREE, s.luces));
    M.escena.background = (new THREE.Color).setRGB(...s.nieblaSala?.activa ? s.colorFondo : [ 0, 0, 0 ], THREE.SRGBColorSpace);
    await cargarObjetos(nombre);
    puertas = (E.puertas?.puertas_por_escena?.[escenaN] || []).map(p => {
      const rect = (new THREE.Box3).setFromPoints([ aMundo(p.caja_min), aMundo(p.caja_max) ]);
      return {
        ...p,
        rect: rect,
        caja: rect.clone().expandByScalar(.4)
      };
    });
    let g = giro;
    if (pos) {
      M.jugador.position.copy(pos);
      pisar(true);
    } else {
      const p = porPuerta != null && puertas.find(x => x.door_no === porPuerta) || null;
      if (p?.arranque_pos) {
        M.jugador.position.copy(aMundo(p.arranque_pos));
        pisar();
        g = g ?? rumboDe(p.arranque_dir || [ 0, 0, 1 ]);
      }
    }
    if (!M.enVR()) M.camara.position.set(0, OJOS, 0);
    if (g != null) {
      M.camara.rotation.set(0, g, 0);
      M.jugador.rotation.set(0, 0, 0);
      if (M.enVR()) {
        M.camara.rotation.set(0, 0, 0);
        M.jugador.rotation.set(0, g, 0);
      }
    }
    try {
      api.alCargar?.(s, nombre);
    } catch (e) {
      console.warn("alCargar", e);
    }
    M.redibujar();
    return s;
  }
  const pisoComun = crearPiso(THREE, ESCALA);
  function pisar(forzar) {
    if (!colision) return;
    const p = M.jugador.position;
    const y = pisoComun.visor(colision, p.x, p.y, p.z, forzar ? 5 : PASO, forzar ? 45 : 2.5);
    if (y != null) p.y = y;
  }
  function libre(desde, dir, dist) {
    if (!colision) return true;
    for (const alto of [ PASO + .05, 1, OJOS ]) {
      tmp.copy(desde);
      tmp.y += alto;
      rayo.set(tmp, dir);
      rayo.far = dist + RADIO;
      if (rayo.intersectObject(colision).some(x => Math.abs(x.face.normal.y) < .6)) return false;
    }
    return true;
  }
  const PISO_MIN_NY = .6;
  function sobrePiso(p) {
    if (!colision || colision.userData?.derivada) return true;
    const y = pisoComun.visor(colision, p.x, p.y, p.z, PASO, PASO + .3, PISO_MIN_NY);
    return y != null;
  }
  const _nuevo = new THREE.Vector3;
  function puedeIr(desde, d, v) {
    if (!libre(desde, d, v)) return false;
    return sobrePiso(_nuevo.copy(desde).addScaledVector(d, v));
  }
  function mover(dir, v) {
    const d = dir.clone().normalize();
    const desde = M.camara.getWorldPosition(new THREE.Vector3);
    desde.y = M.jugador.position.y;
    if (puedeIr(desde, d, v)) {
      M.jugador.position.addScaledVector(d, v);
      return;
    }
    for (const eje of [ new THREE.Vector3(Math.sign(d.x), 0, 0), new THREE.Vector3(0, 0, Math.sign(d.z)) ]) {
      const parte = Math.abs(eje.x ? d.x : d.z) * v;
      if (parte > 1e-4 && puedeIr(desde, eje, parte)) {
        M.jugador.position.addScaledVector(eje, parte);
        desde.addScaledVector(eje, parte);
      }
    }
  }
  const DIRS8 = Array.from({
    length: 8
  }, (_, i) => new THREE.Vector3(Math.cos(i * Math.PI / 4), 0, Math.sin(i * Math.PI / 4)));
  function holgado(p) {
    if (!sobrePiso(p)) return false;
    for (const d of DIRS8) if (!libre(p, d, 0)) return false;
    return true;
  }
  function desatascar() {
    if (!colision) return 0;
    const cab = M.camara.getWorldPosition(new THREE.Vector3);
    cab.y = M.jugador.position.y;
    if (holgado(cab)) return 0;
    const p = new THREE.Vector3;
    for (let r = .05; r <= 1.5; r += .05) {
      const n = Math.max(8, Math.round(2 * Math.PI * r / .05));
      for (let i = 0; i < n; i++) {
        const a = i / n * Math.PI * 2;
        p.set(cab.x + Math.cos(a) * r, cab.y, cab.z + Math.sin(a) * r);
        const y = colision.userData?.derivada ? cab.y : pisoComun.visor(colision, p.x, p.y, p.z, PASO, PASO + .3, PISO_MIN_NY);
        if (y == null) continue;
        p.y = y;
        if (!holgado(p)) continue;
        M.jugador.position.x += p.x - cab.x;
        M.jugador.position.z += p.z - cab.z;
        M.jugador.position.y = y;
        M.redibujar();
        return r;
      }
    }
    return -1;
  }
  const adelante = new THREE.Vector3, costado = new THREE.Vector3, arriba = new THREE.Vector3(0, 1, 0);
  let giroPendiente = 0;
  function animarObjetos(dt) {
    let n = 0;
    for (const o of objetos) {
      if (o.radio) {
        const v = !!api.radioPrendida;
        if (o.grupo.visible !== v) {
          o.grupo.visible = v;
          n++;
        }
        if (!v) continue;
      }
      o.actualizar(dt);
      n++;
    }
    return n > 0;
  }
  function actualizar(dt, {ejes: ejes, teclas: teclas}) {
    const vr = M.enVR();
    const corre = !!(teclas.ShiftLeft || teclas.ShiftRight || teclas.CorrerVR);
    const v = (corre ? 3.4 : 1.5) * dt;
    M.camara.getWorldDirection(adelante);
    adelante.y = 0;
    adelante.normalize();
    costado.crossVectors(adelante, arriba).normalize();
    const dir = new THREE.Vector3;
    if (teclas.KeyW || teclas.ArrowUp) dir.add(adelante);
    if (teclas.KeyS || teclas.ArrowDown) dir.sub(adelante);
    if (teclas.KeyD) dir.add(costado);
    if (teclas.KeyA) dir.sub(costado);
    if (!vr) {
      if (teclas.ArrowLeft) M.camara.rotation.y += 1.9 * dt;
      if (teclas.ArrowRight) M.camara.rotation.y -= 1.9 * dt;
    }
    if (ejes.x || ejes.y) {
      dir.addScaledVector(adelante, -ejes.y);
      dir.addScaledVector(costado, ejes.x);
    }
    if (vr) {
      if (Math.abs(ejes.gx) > .6) {
        if (!giroPendiente) {
          girarRig(-Math.sign(ejes.gx) * Math.PI / 6);
          giroPendiente = 1;
        }
      } else giroPendiente = 0;
    } else if (ejes.gx || ejes.gy) {
      M.camara.rotation.y -= ejes.gx * 2.2 * dt;
      M.camara.rotation.x = THREE.MathUtils.clamp(M.camara.rotation.x - ejes.gy * 1.6 * dt, -1.3, 1.3);
    }
    let movio = false;
    if (dir.lengthSq() > 1e-4) {
      const k = Math.min(1, dir.length());
      mover(dir, v * k);
      pisar();
      movio = true;
    }
    return movio || teclas.ArrowLeft || teclas.ArrowRight || !!(ejes.gx || ejes.gy);
  }
  function girarRig(ang) {
    const cab = M.camara.getWorldPosition(new THREE.Vector3);
    M.jugador.rotation.y += ang;
    M.jugador.updateMatrixWorld(true);
    const nueva = M.camara.getWorldPosition(new THREE.Vector3);
    M.jugador.position.add(cab.sub(nueva));
  }
  const ALCANCE = 2.3, TAPA = .4, RADIO_PUNTO = .2, RADIO_POR_M = .12, CERCA_GOLPE = .45, CERCA_PIE = 1.2;
  const PUNTAJE_PUERTA = .07, ANG_PUERTA = .24, MARGEN_PUERTA = .15;
  const rayoTapa = new THREE.Raycaster;
  function piezasQueTapan() {
    const l = [];
    sala?.grupo.traverseVisible(m => {
      if (m.isMesh && m.userData.grupo === "normal") l.push(m);
    });
    return l;
  }
  function alfaEn(img, u, v) {
    const w = img.ancho, h = img.alto, d = img.datos;
    if (!w || !h || !d) return 255;
    u -= Math.floor(u);
    v -= Math.floor(v);
    const X = Math.min(w - 1, Math.floor(u * w)), Y = Math.min(h - 1, Math.floor(v * h));
    if (img.formato === "BGRA") return d[(Y * w + X) * 4 + 3] ?? 255;
    const tb = img.formato === "DXT1" ? 8 : 16, o = ((Y >> 2) * Math.max(1, w >> 2) + (X >> 2)) * tb, px = X & 3, py = Y & 3;
    if (o + tb > d.length) return 255;
    if (img.formato === "DXT3") return (d[o + py * 2 + (px >> 1)] >> (px & 1) * 4 & 15) * 17;
    if (img.formato === "DXT5") {
      const a0 = d[o], a1 = d[o + 1], i = py * 4 + px, bit = 3 * i, b = o + 2 + (bit >> 3);
      const k = (d[b] | d[b + 1] << 8) >> (bit & 7) & 7;
      if (k === 0) return a0;
      if (k === 1) return a1;
      return a0 > a1 ? ((8 - k) * a0 + (k - 1) * a1) / 7 : k === 6 ? 0 : k === 7 ? 255 : ((6 - k) * a0 + (k - 1) * a1) / 5;
    }
    if (img.formato === "DXT1") {
      const c0 = d[o] | d[o + 1] << 8, c1 = d[o + 2] | d[o + 3] << 8, idx = d[o + 4 + py] >> px * 2 & 3;
      return c0 <= c1 && idx === 3 ? 0 : 255;
    }
    return 255;
  }
  const opaco = h => {
    const img = h.object.userData?.img;
    return !img || !h.uv || alfaEn(img, h.uv.x, h.uv.y) > 127;
  };
  function tapado(origen, destino, piezas = piezasQueTapan()) {
    const d = destino.clone().sub(origen), dist = d.length();
    if (dist < TAPA || !piezas.length) return false;
    rayoTapa.set(origen, d.normalize());
    rayoTapa.far = dist - TAPA;
    return rayoTapa.intersectObjects(piezas, false).some(opaco);
  }
  const _q = new THREE.Vector3, _s = new THREE.Vector3;
  function cercaDePuerta(rect, origen, dir, alcance) {
    rect.getCenter(_q);
    for (let k = 0; k < 3; k++) {
      const t = THREE.MathUtils.clamp(_s.copy(_q).sub(origen).dot(dir), .05, alcance);
      _s.copy(origen).addScaledVector(dir, t);
      rect.clampPoint(_s, _q);
    }
    return _q.clone();
  }
  function apuntado(puntos = [], {alcance: alcance = ALCANCE, conPuertas: conPuertas = true} = {}) {
    const piezas = piezasQueTapan();
    for (const r of M.control.rayos()) {
      const ray = new THREE.Ray(r.origen, r.dir);
      rayoTapa.set(r.origen, r.dir);
      rayoTapa.far = alcance + 1;
      const golpe = piezas.length ? rayoTapa.intersectObjects(piezas, false).find(opaco) || null : null;
      const pie = r.origen;
      const visto = (pos, puerta = false) => !tapado(r.origen, pos, piezas) || golpe && (golpe.point.distanceTo(pos) < CERCA_GOLPE || !puerta && Math.hypot(pos.x - pie.x, pos.z - pie.z) < CERCA_PIE && golpe.point.distanceTo(pos) < .9);
      let mejor = null, pm = Infinity;
      for (const p of puntos) {
        let t, puntaje, donde = p.pos;
        const caja = p.caja;
        const choque = caja && !caja.isEmpty() ? ray.intersectBox(caja.clone().expandByScalar(.06), new THREE.Vector3) : null;
        if (choque) {
          t = choque.distanceTo(r.origen);
          puntaje = .02;
          donde = choque;
        } else {
          const v = p.pos.clone().sub(r.origen);
          t = v.dot(r.dir);
          if (t < .05) continue;
          const perp = v.addScaledVector(r.dir, -t).length();
          if (perp > RADIO_PUNTO + RADIO_POR_M * t) continue;
          puntaje = perp / t;
        }
        if (t > alcance || puntaje >= pm || !visto(donde)) continue;
        pm = puntaje;
        mejor = {
          tipo: "punto",
          p: p,
          distancia: t
        };
      }
      if (conPuertas) {
        let mp = null, ma = Infinity;
        for (const pu of puertas) {
          if (api.puertaUsable && api.puertaUsable(pu) === false) continue;
          const rect = pu.rect || pu.caja;
          const choque = ray.intersectBox(rect.clone().expandByScalar(MARGEN_PUERTA), new THREE.Vector3);
          let q, a;
          if (choque) {
            q = choque;
            a = 0;
          } else {
            q = cercaDePuerta(rect, r.origen, r.dir, alcance);
            const d = q.clone().sub(r.origen);
            if (d.lengthSq() < 1e-6) {
              a = 0;
            } else {
              a = Math.acos(THREE.MathUtils.clamp(d.normalize().dot(r.dir), -1, 1));
              if (a > ANG_PUERTA) continue;
            }
          }
          const t = q.distanceTo(r.origen);
          if (t > alcance + .2 || !visto(q, true)) continue;
          const s = PUNTAJE_PUERTA + Math.tan(a) + t * .002;
          if (s < ma) {
            ma = s;
            mp = {
              tipo: "puerta",
              puerta: pu,
              distancia: t
            };
          }
        }
        if (mp && ma < pm) {
          pm = ma;
          mejor = mp;
        }
      }
      if (mejor) {
        mejor.rayo = r.fuente;
        return mejor;
      }
    }
    return null;
  }
  function queHayAdelante(puntos, alcance = ALCANCE) {
    const a = apuntado(puntos, {
      alcance: alcance,
      conPuertas: false
    });
    return a?.p || null;
  }
  function pisoEn(p) {
    return pisoComun.visor(colision, p.x, p.y, p.z, .3, 5.7);
  }
  function ponerEn(pos, giro = null) {
    M.jugador.position.copy(pos);
    pisar(true);
    if (giro != null) M.camara.rotation.set(0, giro, 0);
  }
  function puertaAdelante() {
    const a = apuntado([], {});
    return a?.tipo === "puerta" ? a.puerta : null;
  }
  function liberar(raiz) {
    raiz.removeFromParent();
    raiz.traverse(o => {
      o.geometry?.dispose?.();
      if (o.isSkinnedMesh) o.skeleton?.dispose?.();
      for (const m of [].concat(o.material || [])) {
        for (const v of Object.values(m)) if (v?.isTexture) v.dispose();
        for (const u of Object.values(m.uniforms || {})) if (u?.value?.isTexture) u.value.dispose();
        m.dispose?.();
      }
    });
  }
  const api = {
    cargar: cargar,
    actualizar: actualizar,
    soltarSalas: soltarSalas,
    salasArmadas: () => [ ...cache.keys() ],
    animarObjetos: animarObjetos,
    ponerEn: ponerEn,
    pisoEn: pisoEn,
    pisar: pisar,
    apuntado: apuntado,
    desatascar: desatascar,
    sobrePiso: sobrePiso,
    queHayAdelante: queHayAdelante,
    puertaAdelante: puertaAdelante,
    girarRig: girarRig,
    crearModelo: crearModelo,
    aplicarEstado: aplicarEstado,
    tapado: tapado,
    get sala() {
      return sala;
    },
    get escena() {
      return escenaN;
    },
    get puertas() {
      return puertas;
    },
    grupo: salaGrupo,
    aMundo: aMundo,
    alCargar: null,
    estado: null,
    radioPrendida: false
  };
  return api;
}
