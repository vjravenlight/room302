// SH4 web — FeniXVOID · Project Ravenlight
import { leerMensajes } from "../lib/subtitulos.js";

export const MOV = {
  paso: 13,
  fps: 30,
  stickMin: .4,
  atrasMin: -.6,
  aceleracion: 1.5,
  giroParado: 6 * Math.PI,
  giroCaminar: 2 * Math.PI,
  giroRestaCorrer: Math.PI,
  correrAlGirar: .6,
  correrRampa: 1,
  cuerpoGiro: 12,
  alturaVel: 280,
  guardiaPaso: 9.1
};

export const MOV_302 = {
  paso: 10.5,
  correr: .3,
  giro: .6 * 30 / 15,
  lateral: 10.5
};

export const ESQUIVE = {
  atras: {
    vel: 750,
    hasta: .6,
    fin: .8
  },
  lado: {
    tramos: [ [ .233, 850 ], [ .3, 200 ] ],
    desde: .066,
    hasta: .7,
    fin: .933
  }
};

export const VIDA = {
  max: 100,
  defensa: 1,
  azar: .2,
  base: .9,
  ampolla: 50,
  ampollaSeg: {
    facil: 80,
    normal: 60,
    dificil: 50
  },
  botiquin: {
    facil: [ .75, 50 ],
    normal: [ .6, 35 ],
    dificil: [ .45, 30 ]
  },
  bebida: 30
};

export const ESTADO = {
  NORMAL: 0,
  PREPARAR: 1,
  GUARDIA: 2,
  GOLPE: 3,
  GOLPE_FUERTE: 4,
  REMATE: 5,
  REMATE2: 6,
  VACIO: 10,
  RECARGA: 88,
  RECARGA_MENU: 89,
  PASO_ATRAS: 20,
  ESQUIVE: 21,
  USAR_ITEM: 88,
  USAR_ITEM_GUARDIA: 89,
  GUARDAR_ARMA: 98,
  BAJAR: 99,
  MUERTE: 100,
  MUERTO: 101
};

export const AGARRE = {
  procesos: {
    1: 88,
    2: 92,
    3: 93,
    4: 88,
    5: 91
  },
  soltarse: {
    1: 89,
    2: 94,
    3: 95,
    4: 89,
    5: 89
  },
  stick: .5,
  boton: 4,
  cortar: .7,
  tambaleo: {
    hasta: .2,
    empuje: .1,
    vel: 1e3,
    sube: [ .4, .6 ],
    baja: [ .2, .8 ]
  },
  sinGolpe: .6,
  tiempo: {
    MULTI: 4,
    HYENA: 2
  },
  sonido: 40026,
  sangreCada: 4
};

export const ITEM = {
  VACIO: 0,
  BALAS_PISTOLA: 1,
  BALAS_REVOLVER: 2,
  BALAS_PLATA: 3,
  VELA: 4,
  BEBIDA: 9,
  AMPOLLA: 10,
  BOTIQUIN: 11,
  PISTOLA: 16,
  REVOLVER: 17,
  TUBERIA: 18,
  CUCHILLO: 19,
  BATE: 20,
  PALA: 47,
  HACHA: 48,
  PICO: 49,
  PISTOLA_ELEC: 50,
  SPRAY: 51,
  MOTOSIERRA: 53,
  BOTELLA: 45,
  ESPADA: 5,
  MEDALLON: 8
};

export function municionPorDefecto(k, nivel = 2, tabla = null) {
  if (k === 17) k = 2; else if (k === 16) k = 1;
  if (k > 10) return 1;
  const fila = tabla ? tabla.flat() : [ 1, 1, 1, 1, 12, 12, 10, 8, 6, 6, 6, 6, 1, 1, 1, 1 ];
  const v = fila[k * 4 + Math.max(0, Math.min(3, nivel | 0))] ?? 1;
  return v < 2 ? 1 : v;
}

export const SONIDO_ARMA = {
  tiro: {
    16: 40040,
    17: 40045
  },
  tiroPlata: 40041,
  preparar: {
    16: 40044,
    17: 40048,
    50: 40039
  },
  recarga: {
    16: 40042,
    17: 40046
  },
  vacio: {
    16: 40043
  },
  golpe(k) {
    if (k === 18 || k === 20 || k === 49) return 40034;
    if (k === 19 || k === 45 || k === 52 || k === 46) return 40033;
    if (k >= 21 && k <= 43 || k === 47 || k === 48) return 40035;
    if (k === 50) return 40038;
    return 0;
  },
  vozFeed(k) {
    return k === 49 ? 3 : k === 47 || k === 48 ? 5 : 7;
  },
  voz: [ 40023, 40024 ],
  vozFuerte: 40025
};

const cache = new Map;

export function cargarDatos({idioma: idioma = "s"} = {}) {
  if (!cache.has(idioma)) cache.set(idioma, cargarDatosIdioma(idioma).catch(e => {
    cache.delete(idioma);
    throw e;
  }));
  return cache.get(idioma);
}

async function cargarDatosIdioma(idioma) {
  const [henry, juego] = await Promise.all([ fetch("/datos/henry.json").then(r => r.json()), fetch("/datos/juego.json").then(r => r.json()) ]);
  let mensajes = [];
  try {
    const buf = await (await fetch(`/juego/data/message_item_msg_${idioma}.bin`)).arrayBuffer();
    mensajes = leerMensajes(buf)[0] || [];
  } catch {}
  return armar(henry, juego, mensajes);
}

function armar(henry, juego, mensajes) {
  const golpes = juego.golpes;
  const golpePorNombre = new Map(golpes.map(g => [ g.golpe, g ]));
  const armas = new Map(juego.armas.map(a => [ a.item_id, a ]));
  const durabilidad = new Map(juego.durabilidad.armas.map(a => [ a.item_id, a ]));
  const textos = new Map(henry.textos_item.map(t => [ t.item, t ]));
  const iconos = new Map(henry.iconos_item.filas.map(t => [ t.item, t ]));
  const limpiar = s => (s || "").replace(/[|ÿ]/g, "").replace(/\s*\n\s*/g, "\n").trim();
  const D = {
    henry: henry,
    juego: juego,
    mensajes: mensajes,
    procesos: henry.procesos,
    proceso(p, arma) {
      if (p >= 28 && p <= 37 && arma >= 16) {
        const t = henry.tablas_arma.tablas[henry.tablas_arma.por_item[arma]];
        if (t) return t[p - 28];
      }
      return henry.procesos[p];
    },
    aburrimiento(arma, i) {
      const clave = arma >= 16 ? henry.aburrimiento.por_item[arma] : henry.aburrimiento.sin_arma;
      return henry.aburrimiento.tablas[clave][i & 7];
    },
    pasoLateral: arma => henry.paso_lateral[arma] || [ 15, 16 ],
    tiemposGolpe(arma, fila) {
      const t = henry.tiempos_golpe.tablas[henry.tiempos_golpe.por_item[arma]];
      const [inicio, fin, sonido, cancelar] = t ? t[fila] : [ .2, .4, .25, .8 ];
      return {
        inicio: inicio,
        fin: fin,
        sonido: sonido,
        cancelar: cancelar
      };
    },
    cajaGolpe: arma => henry.caja_golpe[arma] || {
      desplazar: [ 0, 0, 0, 0 ],
      escala: [ 1, 1, 1, 1 ]
    },
    danioRecibido: tipo => henry.danio_recibido.tipos[Math.max(0, Math.min(16, tipo | 0))],
    arma: item => armas.get(item),
    golpe(nombre) {
      return golpePorNombre.get(nombre);
    },
    durabilidad: item => durabilidad.get(item),
    esArma: k => k >= 16 && k < 54,
    atributo(k) {
      if (!k) return "nada";
      if (k >= 136 && k < 188) return "nota";
      if (k >= 60 && k < 126) return "llave";
      if (k >= 4 && k < 9) return "anti-espíritus";
      if (k >= 9 && k < 12) return "curación";
      if (k >= 128 && k <= 132) return "arma de Eileen";
      return k >= 1 && k <= 3 ? "munición" : "arma";
    },
    nombreItem(k) {
      const t = textos.get(k);
      return t && limpiar(mensajes[t.nombre]) || juego.items[`0x${k.toString(16).padStart(2, "0")}`] || `ítem ${k}`;
    },
    infoItem(k) {
      const t = textos.get(k);
      return t && limpiar(mensajes[t.info]) || "";
    },
    mensaje: i => limpiar(mensajes[i]),
    icono: k => iconos.get(k)
  };
  return D;
}
