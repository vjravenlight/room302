// SH4 web — FeniXVOID · Project Ravenlight
export const PRESETS = {
  "pc-alta": {
    nombre: "Calidad PC alta",
    post: true,
    msaa: 4,
    ao: {
      radio: .35,
      muestras: 16,
      fuerza: .7
    },
    bloom: {
      fuerza: .45,
      radio: .55,
      umbral: .82
    },
    dof: null,
    sombras: {
      tipo: "PCFSoft",
      puntuales: 3,
      tamPuntual: 1024,
      radio: 1.5,
      tamLinterna: 1024,
      estaticas: false
    },
    halos: true,
    halo: 1
  },
  "pc-media": {
    nombre: "Calidad PC media",
    post: true,
    msaa: 0,
    ao: {
      radio: .35,
      muestras: 8,
      fuerza: .6
    },
    bloom: {
      fuerza: .4,
      radio: .5,
      umbral: .85
    },
    dof: null,
    sombras: {
      tipo: "PCF",
      puntuales: 1,
      tamPuntual: 512,
      radio: 1,
      tamLinterna: 512,
      estaticas: false
    },
    halos: true,
    halo: 1
  },
  quest: {
    nombre: "Quest (VR)",
    post: false,
    sombras: {
      tipo: "PCF",
      puntuales: 1,
      tamPuntual: 512,
      radio: 0,
      tamLinterna: 512,
      estaticas: true
    },
    maxPuntuales: 3,
    halos: true,
    halo: 1,
    foveacion: 1,
    redondear: false
  }
};

export function opcionesMejorado() {
  let o = {};
  try {
    o = JSON.parse(localStorage.getItem("sh4opciones") || "{}") || {};
  } catch {}
  return {
    questPedido: !!o.mejoradoQuest,
    presetPC: o.calidad === "alta" || o.calidad == null ? "pc-alta" : "pc-media"
  };
}

export const VR = {
  vineta: .2,
  granoMat: .012,
  brillo: [ .85, .55 ]
};

export function animoDe(sala) {
  const s = sala || "";
  if (/^rl0[1-9]/.test(s)) return {
    nombre: "302",
    aberracion: 0,
    vineta: .18,
    grano: .02,
    saturacion: 1,
    contraste: 1.05,
    sombra: .45,
    relieve: .15,
    halo: 0,
    niebla: 1,
    realce: .5,
    levantar: .25
  };
  if (/^rl00/.test(s)) return {
    nombre: "pesadilla",
    aberracion: .012,
    vineta: .26,
    grano: .035,
    saturacion: .9,
    contraste: 1.06,
    sombra: .55,
    relieve: .15,
    halo: .08,
    niebla: 1,
    realce: .5,
    levantar: .25
  };
  return {
    nombre: "otro mundo",
    aberracion: .008,
    vineta: .24,
    grano: .03,
    saturacion: .94,
    contraste: 1.06,
    sombra: .7,
    relieve: .2,
    halo: .25,
    niebla: 1,
    realce: .55,
    levantar: .28
  };
}
