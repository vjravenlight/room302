// SH4 web — FeniXVOID · Project Ravenlight
import { partesBin } from "./lib/sh4bin.js";

import { leerModelo } from "./lib/modelo.js";

import { leerTexturas } from "./lib/texturas.js";

import { leerAnimacion } from "./lib/animacion.js";

import { crearPersonaje } from "./lib/personaje.js";

import { armarSala } from "./lib/sala.js";

import { crearVelasDemo } from "./efectos/objetos_demo.js";

import { OBJETOS_FIJOS, MUNDOS_EXTRA, MODELOS_ESTADO } from "./modo_juego/cuarto.js";

import { bajar } from "./modo_juego/motor.js";

const CNST_VELA = "0x545990";

export function iniciarEscenaJuego({THREE: THREE, escena: escena, sala: sala, jugador: jugador, camara: camara, escala: escala, ojos: ojos, cargarSala: cargarSala, redibujar: redibujar}) {
  let datos = null;
  const partesDe = new WeakMap;
  const bin = async nombre => {
    const b = await bajar("data/" + nombre);
    let p = partesDe.get(b);
    if (!p) partesDe.set(b, p = partesBin(b));
    return {
      b: b,
      p: p
    };
  };
  const objetos = [];
  let extras = [], velas = null, vuelta = 0;
  let puertas = [], cerca = null, actual = null;
  let estado = {
    F: () => false,
    mitad: 1,
    heladera: false
  };
  const op = {
    objetos: true,
    velas: true
  };
  const globales = new Map;
  const aviso = document.createElement("div");
  aviso.id = "avisoPuerta";
  aviso.style.cssText = "position:fixed;left:50%;bottom:64px;transform:translateX(-50%);z-index:20;display:none;" + "font:18px Cormorant Garamond,Georgia,serif;letter-spacing:.12em;color:#ece3d2;background:rgba(8,5,4,.78);" + "border:1px solid rgba(122,59,30,.6);padding:6px 18px;text-shadow:0 0 8px rgba(192,38,26,.5);pointer-events:none";
  document.body.appendChild(aviso);
  async function cargarDatos() {
    if (datos) return datos;
    try {
      datos = (await (await fetch("/datos/escenas.json")).json()).etapas;
    } catch {
      datos = {};
    }
    return datos;
  }
  function escenaDe(nombreSala, E) {
    const etapa = nombreSala.slice(0, 2), base = nombreSala.slice(0, 4);
    const salas = E?.[etapa]?.salas || {};
    const n = Object.entries(salas).find(([, s]) => s === base)?.[0];
    return n ? {
      etapa: etapa,
      n: n
    } : null;
  }
  const aMundo = p => new THREE.Vector3(-p[0] * escala, -p[1] * escala, p[2] * escala);
  const rumbo = d => Math.atan2(d[0], -d[2]);
  async function modelo({arch: arch, m: pm, t: pt, tArch: tArch = null, a: a = null}) {
    const m = await bin(arch), Mp = m.p[pm];
    const tb = tArch ? await bin(tArch) : m, T = tb.p[pt];
    const pj = crearPersonaje(leerModelo(m.b, Mp.ofs, Mp.len), T?.tipo === "texturas" ? leerTexturas(tb.b, T.ofs, T.len) : []);
    if (a) {
      const ma = await bin(a[0]), A = ma.p[a[1]];
      if (A?.tipo === "animacion") {
        pj.poner(leerAnimacion(ma.b, A.ofs, A.len));
        pj.reproductor.loop = true;
      }
    }
    return pj;
  }
  function quitarTodo() {
    for (const o of objetos.splice(0)) {
      o.grupo.removeFromParent();
      o.dispose?.();
    }
    for (const x of extras.splice(0)) x.removeFromParent();
    velas?.grupo.removeFromParent();
    velas?.dispose();
    velas = null;
  }
  const extraArmados = new Map;
  function aplicarEstado() {
    const reglas = actual && MODELOS_ESTADO[actual.sala];
    const grupoSala = sala.children.find(c => c.name === "sala_" + actual?.sala);
    if (!reglas || !grupoSala) return;
    for (const g of grupoSala.children) {
      const n = /^mundo_(\d+)$/.exec(g.name)?.[1];
      if (n != null && reglas[n]) g.visible = !!reglas[n](estado);
    }
  }
  async function alCargarSala(nombreSala, {porPuerta: porPuerta = null, mitad: mitad = 1, F: F = null, filtro: filtro = null} = {}) {
    const yo = ++vuelta;
    quitarTodo();
    puertas = [];
    cerca = null;
    aviso.style.display = "none";
    estado = {
      F: F || (() => false),
      mitad: mitad,
      heladera: false
    };
    const E = await cargarDatos();
    const es = escenaDe(nombreSala, E);
    if (actual?.etapa && es?.etapa !== actual.etapa) extraArmados.clear();
    actual = es && {
      ...es,
      sala: nombreSala
    };
    if (!es) return null;
    const etapa = E[es.etapa];
    for (const p of etapa.puertas?.puertas_por_escena?.[es.n] || []) {
      const a = aMundo(p.caja_min), b = aMundo(p.caja_max);
      const caja = (new THREE.Box3).setFromPoints([ a, b ]).expandByScalar(.35);
      puertas.push({
        ...p,
        caja: caja
      });
    }
    const lista = (mitad === 2 ? etapa.objetos_segunda_mitad : etapa.objetos)?.[es.n] || [];
    const sigue = () => yo === vuelta;
    if (es.etapa === "rl") {
      aplicarEstado();
      for (const def of OBJETOS_FIJOS[nombreSala] || []) {
        try {
          const pj = await modelo({
            arch: def.arch,
            m: def.m,
            t: def.t,
            a: def.a
          });
          if (!sigue()) {
            pj.dispose();
            return null;
          }
          pj.radio = !!def.radio;
          pj.grupo.name = `objeto ${def.arch} #${def.m}` + (def.radio ? " (radio)" : "");
          sala.add(pj.grupo);
          objetos.push(pj);
        } catch (e) {
          console.warn("objeto", def.arch, e.message);
        }
      }
      for (const nom of MUNDOS_EXTRA[nombreSala] || []) {
        try {
          if (!extraArmados.has(nom)) extraArmados.set(nom, armarSala(THREE, r => bajar(r), nom, globales, {
            colisionDerivada: false
          }));
          const s = await extraArmados.get(nom);
          if (!sigue()) return null;
          s.grupo.name = "extra " + nom;
          sala.add(s.grupo);
          extras.push(s.grupo);
        } catch (e) {
          console.warn("extra", nom, e.message);
        }
      }
    } else {
      for (const o of lista) {
        if (!/ObjDontMove/.test(o.tipo_nombre || "")) continue;
        if (filtro && (filtro.reemplaza(o) || !filtro.visible(o))) continue;
        const arch = o.archivos_en_codigo || [];
        const mod = arch.find(a => a.tipo === "modelo_esqueleto"), tex = arch.find(a => a.tipo === "texturas"), an = arch.find(a => a.tipo === "animacion");
        if (!mod) continue;
        try {
          const pj = await modelo({
            arch: mod.archivo,
            m: mod.parte,
            t: tex?.parte,
            tArch: tex?.archivo,
            a: an ? [ an.archivo, an.parte ] : null
          });
          if (!sigue()) {
            pj.dispose();
            return null;
          }
          if (o.pos) pj.ubicar(o.pos[0], o.pos[1], o.pos[2], o.rot || 0);
          pj.grupo.name = `objeto ${o.indice} (${mod.archivo})`;
          filtro?.ajustar(o, pj);
          sala.add(pj.grupo);
          objetos.push(pj);
        } catch (e) {
          console.warn("objeto", o.indice, e.message);
        }
      }
    }
    const posVelas = lista.filter(o => o.cnst === CNST_VELA && o.pos && (!o.dmy8 || estado.F(o.dmy8))).map(o => o.pos);
    if (posVelas.length) {
      try {
        const v = await crearVelasDemo({
          THREE: THREE,
          bajar: bajar,
          escala: escala,
          posiciones: posVelas,
          semilla: +es.n
        });
        if (!sigue()) {
          v.dispose();
          return null;
        }
        v.grupo.visible = op.velas;
        sala.add(v.grupo);
        velas = v;
      } catch (e) {
        console.warn("velas", e.message);
      }
    }
    const p = porPuerta != null && puertas.find(x => x.door_no === porPuerta) || puertas.find(x => x.arranque_pos) || null;
    const base = {
      puertas: puertas.length,
      objetos: objetos.length,
      velas: posVelas.length
    };
    if (!p?.arranque_pos) return base;
    const pos = aMundo(p.arranque_pos);
    return {
      ...base,
      pos: [ pos.x, pos.y + ojos, pos.z ],
      giro: rumbo(p.arranque_dir || [ 0, 0, 1 ]),
      puerta: p.door_no
    };
  }
  function salaDestino(n, salasDisponibles) {
    const E = datos?.[actual.etapa];
    if (!E) return null;
    const base = E.salas?.[n];
    if (!base) return null;
    const v = actual.etapa === "rl" ? api.varianteDe?.(base) : null;
    if (v && salasDisponibles.includes(v)) return v;
    const variante = actual.sala.slice(4);
    const opciones = [ base + variante, base + "a", base ];
    return opciones.find(s => salasDisponibles.includes(s)) || salasDisponibles.find(s => s.startsWith(base)) || null;
  }
  function actualizar(dt, salasDisponibles) {
    let hay = false;
    if (op.objetos && dt > 0) for (const o of objetos) {
      if (o.radio && !estado.F(1600)) continue;
      o.actualizar(dt);
      hay = true;
    }
    if (velas && op.velas && dt > 0) {
      velas.actualizar(dt);
      hay = true;
    }
    const yo = jugador.position.clone();
    yo.y -= ojos * .5;
    const nueva = puertas.find(p => p.caja.containsPoint(yo)) || null;
    if (nueva !== cerca) {
      cerca = nueva;
      if (cerca) {
        const destino = salaDestino(cerca.lleva_a_escena, salasDisponibles);
        cerca.destino = destino;
        const nom = destino ? window.sh4.nombreCompleto?.(destino) || destino : "sin sala";
        aviso.textContent = `E · abrir la puerta → ${nom}`;
        aviso.style.display = destino ? "block" : "none";
      } else aviso.style.display = "none";
    }
    return hay;
  }
  function opciones(o = {}) {
    Object.assign(op, o);
    if (velas) velas.grupo.visible = op.velas;
    redibujar?.();
    return {
      ...op
    };
  }
  addEventListener("keydown", e => {
    if (e.code !== "KeyE" || !cerca?.destino || window.sh4.volando) return;
    const destino = cerca.destino, puerta = cerca.door_no;
    window.sh4.sonido?.puerta(cerca.material, "abrir", jugador.position.clone());
    aviso.style.display = "none";
    cargarSala(destino, {
      porPuerta: puerta
    });
  });
  const api = {
    alCargarSala: alCargarSala,
    actualizar: actualizar,
    opciones: opciones,
    aplicarEstado: aplicarEstado,
    modelo: modelo,
    varianteDe: null,
    get puertas() {
      return puertas;
    },
    get objetos() {
      return objetos;
    },
    get velas() {
      return velas;
    },
    get actual() {
      return actual;
    },
    get estado() {
      return estado;
    }
  };
  return api;
}
