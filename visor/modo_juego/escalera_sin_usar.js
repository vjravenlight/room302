// SH4 web — FeniXVOID · Project Ravenlight
import { partesBin } from "../lib/sh4bin.js";

import { leerModelo } from "../lib/modelo.js";

import { leerTexturas } from "../lib/texturas.js";

import { leerAnimacion } from "../lib/animacion.js";

import { crearPersonaje } from "../lib/personaje.js";

export const SIN_USAR = [ {
  fila: 3,
  m: 12,
  t: 0,
  a: 24,
  pos: [ 379.208, 1171.64, 101.994 ],
  q: [ 0, .9371, 0, -.3491 ],
  nicho: "B"
}, {
  fila: 4,
  m: 13,
  t: 1,
  a: 25,
  pos: [ -2009.796, 3341.575, -1290.517 ],
  q: [ 0, .291, 0, .9567 ],
  nicho: "A"
}, {
  fila: 5,
  m: 14,
  t: 2,
  a: 26,
  pos: [ -1986.634, 3354.749, -1253.473 ],
  q: [ 0, 0, 0, 1 ],
  nicho: "A"
}, {
  fila: 8,
  m: 20,
  t: 8,
  a: 29,
  pos: [ -1975.46, 541.268, -1220.725 ],
  q: [ 0, .3207, 0, .9472 ],
  nicho: "A (arriba)"
}, {
  fila: 9,
  m: 21,
  t: 9,
  a: 30,
  pos: [ -1831.981, 3167.693, -1363.408 ],
  q: [ 0, .3878, 0, .9217 ],
  nicho: "A"
}, {
  fila: 10,
  m: 21,
  t: 9,
  a: 31,
  pos: [ -1961.985, 3348.086, -1264.176 ],
  q: [ 0, .2958, 0, .9553 ],
  nicho: "A"
}, {
  fila: 11,
  m: 21,
  t: 9,
  a: 32,
  pos: [ -1986.222, 2995.467, -1266.545 ],
  q: [ 0, .3093, 0, .951 ],
  nicho: "A"
}, {
  fila: 12,
  m: 22,
  t: 10,
  a: 33,
  pos: [ 428.725, 1154.94, 55.511 ],
  q: [ 0, .9997, 0, .023 ],
  nicho: "B"
}, {
  fila: 1,
  m: 16,
  t: 4,
  a: null,
  pos: [ -2395.647, -1800, 2508.022 ],
  q: [ 0, .9563, 0, .2924 ],
  nicho: "hueco (cae)",
  cae: true
} ];

export const USADAS = [ {
  fila: 6,
  m: 18,
  t: 6,
  a: 27,
  escena: 3
}, {
  fila: 7,
  m: 19,
  t: 7,
  a: 28,
  escena: 4
}, {
  fila: 13,
  m: 23,
  t: 11,
  a: 34,
  escena: 5
} ];

export const TODOS = [ {
  arch: "st_all",
  m: 12,
  t: 0,
  a: 24,
  uso: "no",
  fila: 3
}, {
  arch: "st_all",
  m: 13,
  t: 1,
  a: 25,
  uso: "no",
  fila: 4
}, {
  arch: "st_all",
  m: 14,
  t: 2,
  a: 26,
  uso: "no",
  fila: 5
}, {
  arch: "st_all",
  m: 15,
  t: 3,
  a: null,
  uso: "cae",
  fila: 0,
  nota: "cae por el hueco de st02 (filas 0–2)"
}, {
  arch: "st_all",
  m: 16,
  t: 4,
  a: null,
  uso: "no",
  fila: 1,
  nota: "fila 1 de st02: el azar la cambia por la 0 o la 2"
}, {
  arch: "st_all",
  m: 17,
  t: 5,
  a: null,
  uso: "cae",
  fila: 2,
  nota: "cae por el hueco de st02 (filas 0–2)"
}, {
  arch: "st_all",
  m: 18,
  t: 6,
  a: 27,
  uso: "si",
  fila: 6,
  nota: "st03"
}, {
  arch: "st_all",
  m: 19,
  t: 7,
  a: 28,
  uso: "si",
  fila: 7,
  nota: "st04"
}, {
  arch: "st_all",
  m: 20,
  t: 8,
  a: 29,
  uso: "no",
  fila: 8
}, {
  arch: "st_all",
  m: 21,
  t: 9,
  a: 30,
  uso: "no",
  fila: 9,
  otras: [ 31, 32 ]
}, {
  arch: "st_all",
  m: 22,
  t: 10,
  a: 33,
  uso: "no",
  fila: 12
}, {
  arch: "st_all",
  m: 23,
  t: 11,
  a: 34,
  uso: "si",
  fila: 13,
  nota: "st05"
}, {
  arch: "st01",
  m: 5,
  t: 7,
  a: 6,
  uso: "no",
  nota: "st01.bin: ningún ID 0xF0??F1D3 de las partes 5–13 en el EXE"
}, {
  arch: "st01",
  m: 8,
  t: 10,
  a: 9,
  uso: "no",
  nota: "st01.bin: sin ID en el EXE"
}, {
  arch: "st01",
  m: 11,
  t: 13,
  a: 12,
  uso: "no",
  nota: "st01.bin: sin ID en el EXE"
}, {
  arch: "st_spi00",
  m: 0,
  t: 1,
  a: 2,
  uso: "no",
  nota: "copia de st_all #18; personaje 406 de demo_chara_list sin cinemática"
}, {
  arch: "event_st",
  m: 0,
  t: 1,
  a: null,
  uso: "si",
  nota: "objeto de evento (0x62dd00)"
} ];

export const ASIGNACION = {
  1: [ 3, 4 ],
  2: [ 1, 5 ],
  3: [],
  4: [ 8, 9, 10, 11 ],
  5: [ 12 ]
};

export const PROPIOS_ST01 = [ {
  arch: "st01",
  m: 5,
  t: 7,
  a: 6,
  nicho: 1,
  donde: "cuartito st01-1 (B), colgado cabeza abajo"
}, {
  arch: "st01",
  m: 8,
  t: 10,
  a: 9,
  donde: "el hueco, colgando de cadenas cerca del eje"
}, {
  arch: "st01",
  m: 11,
  t: 13,
  a: 12,
  donde: "arriba, al lado de la puerta de entrada (SUPUESTO)"
} ];

export const ESCENAS_SIN_USAR = [ 1, 2, 3, 4, 5 ];

const E = .005;

const bins = new Map;

const binDe = (bajar, nombre) => {
  if (!bins.has(nombre)) bins.set(nombre, bajar(`data/${nombre}.bin`).then(b => ({
    b: b,
    p: partesBin(b)
  })));
  return bins.get(nombre);
};

export async function ponerSinUsar({THREE: THREE, bajar: bajar, padre: padre, filas: filas = null}) {
  const {b: b, p: p} = await binDe(bajar, "st_all");
  const lista = [];
  for (const c of SIN_USAR) {
    if (filas && !filas.includes(c.fila)) continue;
    try {
      const pj = crearPersonaje(leerModelo(b, p[c.m].ofs, p[c.m].len), leerTexturas(b, p[c.t].ofs, p[c.t].len));
      pj.grupo.name = `sin usar · st_all #${c.m} (fila ${c.fila})`;
      pj.grupo.userData.sinUsar = c;
      pj.grupo.children[0].quaternion.copy(new THREE.Quaternion(0, 0, 1, 0)).multiply(new THREE.Quaternion(...c.q).normalize());
      if (c.a != null) {
        pj.poner(leerAnimacion(b, p[c.a].ofs, p[c.a].len));
        pj.reproductor.loop = true;
      }
      pj.grupo.position.set(-c.pos[0] * E, -c.pos[1] * E, c.pos[2] * E);
      padre.add(pj.grupo);
      lista.push({
        c: c,
        pj: pj,
        y: c.pos[1],
        espera: 30 + Math.random() * 100,
        vel: 100
      });
    } catch (e) {
      console.warn("escalera sin usar", c.fila, e.message);
    }
  }
  return {
    lista: lista,
    actualizar(dt) {
      for (const x of lista) {
        if (!x.c.cae) {
          x.pj.actualizar(dt);
          continue;
        }
        if (x.espera > 0) {
          x.espera -= dt * 30;
          x.pj.grupo.visible = false;
          continue;
        }
        x.y += x.vel * dt * 30;
        if (x.y > 7e3) {
          x.y = -1800;
          x.espera = 32 + Math.random() * 256;
        }
        x.pj.grupo.visible = true;
        x.pj.grupo.position.y = -x.y * E;
      }
      return lista.length > 0;
    },
    quitar() {
      for (const x of lista) {
        x.pj.grupo.removeFromParent();
        x.pj.dispose?.();
      }
      lista.length = 0;
    },
    estado: () => lista.map(x => `#${x.c.m}/f${x.c.fila}`)
  };
}

let NICHOS = null;

export async function nichos() {
  NICHOS ||= fetch(new URL("./escalera_nichos.json", import.meta.url)).then(r => r.json()).catch(() => ({}));
  return NICHOS;
}

const ALTO_RENGLON = .028;

function etiqueta(THREE, texto, color = "#e8c9a0") {
  const lineas = String(texto).split("\n");
  const px = 2;
  const g0 = document.createElement("canvas").getContext("2d");
  const fuente = i => (i ? "" : "bold ") + (i ? 12 : 13) * px + "px Georgia, serif";
  let ancho = 0;
  lineas.forEach((l, i) => {
    g0.font = fuente(i);
    ancho = Math.max(ancho, g0.measureText(l).width);
  });
  const cv = document.createElement("canvas");
  cv.width = Math.ceil(ancho + 12 * px);
  cv.height = (lineas.length * 15 + 6) * px;
  const g = cv.getContext("2d");
  g.fillStyle = "rgba(10,8,7,0.62)";
  g.fillRect(0, 0, cv.width, cv.height);
  g.fillStyle = color;
  g.fillRect(0, 0, 2 * px, cv.height);
  g.textBaseline = "middle";
  lineas.forEach((l, i) => {
    g.font = fuente(i);
    g.fillStyle = i ? "rgba(232,220,205,0.92)" : color;
    g.fillText(l, 6 * px, (3 + 7.5 + 15 * i) * px);
  });
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.minFilter = THREE.LinearFilter;
  t.generateMipmaps = false;
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({
    map: t,
    depthTest: false,
    transparent: true,
    opacity: .9,
    sizeAttenuation: false,
    fog: false,
    toneMapped: false
  }));
  const h = ALTO_RENGLON * (lineas.length * 15 + 6) / 15;
  sp.renderOrder = 999;
  sp.scale.set(h * cv.width / cv.height, h, 1);
  sp.center.set(0, 0);
  sp.userData.sinSombra = true;
  sp.userData.etiquetaNicho = true;
  return sp;
}

export function crearCapaSinUsar({THREE: THREE, bajar: bajar, padre: padre}) {
  const grupo = new THREE.Group;
  grupo.name = "contenido sin usar (escalera)";
  let bichos = null, vuelta = 0, escena = 0, modo = "deducido";
  let verCarteles = typeof location === "undefined" || !new URLSearchParams(location.search).has("sinnichos");
  const propios = [];
  function quitar() {
    vuelta++;
    bichos?.quitar();
    bichos = null;
    for (const x of propios.splice(0)) {
      x.pj.grupo.removeFromParent();
      x.pj.dispose?.();
    }
    for (const o of [ ...grupo.children ]) {
      o.removeFromParent();
      o.material?.map?.dispose();
      o.material?.dispose();
    }
    grupo.removeFromParent();
  }
  async function poner(n, {modo: m = "deducido", etiquetas: etiquetas = true} = {}) {
    quitar();
    const v = vuelta;
    escena = +n;
    modo = m;
    if (!ESCENAS_SIN_USAR.includes(escena)) return null;
    padre.add(grupo);
    const filas = modo === "todas" ? escena <= 4 ? SIN_USAR.map(c => c.fila).filter(f => f !== 1 || escena === 2) : [] : ASIGNACION[escena] || [];
    if (filas.length) {
      const b = await ponerSinUsar({
        THREE: THREE,
        bajar: bajar,
        padre: grupo,
        filas: filas
      });
      if (v !== vuelta) {
        b.quitar();
        return null;
      }
      bichos = b;
    }
    if (escena === 1) {
      const {b: b, p: p} = await binDe(bajar, "st01");
      if (v !== vuelta) return null;
      for (const c of PROPIOS_ST01) {
        try {
          const pj = crearPersonaje(leerModelo(b, p[c.m].ofs, p[c.m].len), leerTexturas(b, p[c.t].ofs, p[c.t].len));
          pj.grupo.name = `sin usar · st01.bin #${c.m}`;
          pj.poner(leerAnimacion(b, p[c.a].ofs, p[c.a].len));
          pj.reproductor.loop = true;
          grupo.add(pj.grupo);
          propios.push({
            c: c,
            pj: pj
          });
        } catch (e) {
          console.warn("st01 propio", c.m, e.message);
        }
      }
    }
    if (etiquetas) {
      const N = (await nichos())["st0" + escena] || [];
      if (v !== vuelta) return null;
      for (const j of N) {
        const puestas = (bichos?.lista || []).filter(x => j.filas.includes(x.c.fila)).map(x => x.c.fila);
        const usada = USADAS.find(u => u.escena === escena && j.filas.includes(u.fila));
        const lin2 = usada ? `juego: #${usada.m} (fila ${usada.fila})` : "";
        const prop = escena === 1 ? PROPIOS_ST01.filter(c => c.nicho === j.n).map(c => "st01.bin #" + c.m) : [];
        const lin3 = [ puestas.length ? `sin usar: fila ${puestas.join(", ")}` : "", ...prop ].filter(Boolean).join(" · ") || (j.contenido || "");
        const sp = etiqueta(THREE, [ `st0${escena}-${j.n}`, lin2, lin3 ].filter(Boolean).join("\n"), puestas.length ? "#ff9a6a" : usada ? "#9fd39a" : "#e8c9a0");
        sp.position.set(-j.centro[0] * E, -(j.techo - 60) * E, j.centro[2] * E);
        sp.name = `nicho st0${escena}-${j.n}`;
        sp.visible = verCarteles;
        grupo.add(sp);
      }
    }
    return estado();
  }
  function estado() {
    return {
      escena: escena,
      modo: modo,
      criaturas: [ ...bichos?.estado() || [], ...propios.map(x => "st01#" + x.c.m) ],
      nichos: grupo.children.filter(o => o.isSprite).length
    };
  }
  function actualizar(dt) {
    for (const x of propios) x.pj.actualizar(dt);
    return bichos?.actualizar(dt) || false || propios.length > 0;
  }
  function verEtiquetas(si) {
    verCarteles = !!si;
    for (const o of grupo.children) if (o.userData.etiquetaNicho) o.visible = verCarteles;
    return verCarteles;
  }
  return {
    poner: poner,
    quitar: quitar,
    estado: estado,
    actualizar: actualizar,
    grupo: grupo,
    verEtiquetas: verEtiquetas
  };
}
