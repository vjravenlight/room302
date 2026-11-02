// SH4 web — FeniXVOID · Project Ravenlight
import { imagenJuego } from "../suite_juego.js";

import { t } from "../textos_sitio.js";

export const ESC = 2;

export const W = 640, H = 448;

export const MSG = {
  si: 0,
  no: 1,
  advertencia: 197,
  nueva: 198,
  continuar: 199,
  cargar: 200,
  opciones: 201,
  facil: 294,
  normal: 295,
  dificil: 296,
  nivel: 285,
  op: {
    titulo1: 110,
    titulo2: 111,
    titulo3: 112,
    brillo: 40,
    subtitulos: 43,
    idioma: 42,
    sangre: 44,
    ruido: 47,
    sonido: 36,
    volMus: 37,
    volEfe: 38,
    salir: 48,
    on: 49,
    off: 50,
    estereo: 52,
    mono: 53,
    espanol: 56,
    ingles: 57,
    rojo: 59,
    verde: 60,
    morado: 61,
    porDefecto: 74,
    vibracion: 35,
    movCabeza: 32,
    ayudaBrillo: 95,
    ayudaSubOn: 99,
    ayudaSubOff: 98,
    ayudaVolMus: 92,
    ayudaVolEfe: 93,
    ayudaRuidoOn: 104,
    ayudaRuidoOff: 103,
    ayudaSangre: [ 100, 101, 102 ],
    ayudaIdioma: 97,
    ayudaEstereo: 90,
    ayudaMono: 91,
    cambiar: 73
  }
};

export async function cargarImagenes() {
  const im = async (...a) => {
    try {
      return await imagenJuego(...a);
    } catch (e) {
      console.warn(e.message);
      return null;
    }
  };
  const [konami, kcet, kcet2, carne, titulo, logo, copy, niebla, cursores, opciones, gameover] = await Promise.all([ im("snap_opening", 0, [ 0, 0, 512, 512 ], {
    escalaX: 1
  }), im("snap_opening", 1, [ 0, 0, 512, 512 ], {
    escalaX: 1
  }), im("snap_opening", 2, [ 0, 0, 512, 512 ], {
    escalaX: 1
  }), im("snap_opening", 3, [ 0, 0, 512, 448 ]), im("snap_title", 0, [ 0, 0, 512, 448 ]), im("snap_title", 1, [ 0, 88, 512, 120 ], {
    modo: "alfa",
    escalaX: 1
  }), im("snap_title", 1, [ 87, 414, 334, 17 ], {
    modo: "alfa"
  }), im("snap_title", 1, [ 0, 448, 380, 64 ], {
    modo: "alfa"
  }), im("snap_title", 1, [ 380, 448, 132, 64 ], {
    modo: "alfa",
    escalaX: 1
  }), im("snap_option", 0, [ 0, 0, 512, 448 ]), im("snap_gameover", 0, [ 0, 0, 512, 448 ]) ]);
  return {
    konami: konami,
    kcet: kcet,
    kcet2: kcet2,
    carne: carne,
    titulo: titulo,
    logo: logo,
    copy: copy,
    niebla: niebla,
    cursores: cursores,
    opciones: opciones,
    gameover: gameover
  };
}

export function limpiar(g, color = "#000") {
  g.save();
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalAlpha = 1;
  g.fillStyle = color;
  g.fillRect(0, 0, g.canvas.width, g.canvas.height);
  g.restore();
}

export function imagen(g, im, alfa = 1, x = 0, y = 0, w = W, h = H) {
  if (!im) return;
  g.save();
  g.globalAlpha = alfa;
  g.drawImage(im, x * ESC, y * ESC, w * ESC, h * ESC);
  g.restore();
}

export const TITULO = {
  logo: {
    y: 68.57 - 60,
    ancho: 512
  },
  menu: {
    y: 226,
    paso: 28
  },
  copy: {
    y: 414
  }
};

export function dibujarTitulo(g, I, fuente, textos, {t: t = 0, opciones: opciones = [], elegido: elegido = 0, alfa: alfa = 1, alfaMenu: alfaMenu = 1} = {}) {
  limpiar(g);
  imagen(g, I.titulo, alfa);
  const nb = nieblaSuave(I);
  if (nb) for (const [vel, y, a] of [ [ 7, 210, .2 ], [ -4.5, 290, .14 ] ]) {
    const ancho = 760, x = (t * vel % ancho + ancho) % ancho;
    g.save();
    g.globalAlpha = a * alfa;
    g.globalCompositeOperation = "lighter";
    for (const dx of [ x - ancho, x ]) g.drawImage(nb, dx * ESC, y * ESC, ancho * ESC, 150 * ESC);
    g.restore();
  }
  if (I.logo) {
    const L = TITULO.logo, h = L.ancho * I.logo.height / I.logo.width;
    imagen(g, I.logo, alfa, (W - L.ancho) / 2, L.y, L.ancho, h);
  }
  if (I.copy) imagen(g, I.copy, alfa * .9, (W - I.copy.width / 2) / 2, TITULO.copy.y, I.copy.width / 2, I.copy.height / 2);
  opciones.forEach((op, i) => {
    const y = TITULO.menu.y + i * TITULO.menu.paso, sel = i === elegido, des = op.deshabilitado;
    const k = sel ? .7 + .3 * Math.cos(t * 4) : 1;
    const color = des ? "#2a2a2a" : sel ? `rgb(${Math.round(255 * k)},${Math.round(255 * k)},${Math.round(255 * k)})` : "#5a5a5a";
    fuente.escribir(g, op.t ?? textos(op.n ?? op), W / 2, y, {
      escala: ESC,
      alinear: "centro",
      color: color,
      alfa: alfa * alfaMenu
    });
  });
}

let _nb = null;

function nieblaSuave(I) {
  if (_nb || !I.niebla) return _nb;
  const c = document.createElement("canvas");
  c.width = I.niebla.width;
  c.height = I.niebla.height;
  const x = c.getContext("2d");
  x.drawImage(I.niebla, 0, 0);
  x.globalCompositeOperation = "destination-in";
  const v = x.createLinearGradient(0, 0, 0, c.height);
  v.addColorStop(0, "rgba(0,0,0,0)");
  v.addColorStop(.5, "rgba(0,0,0,1)");
  v.addColorStop(1, "rgba(0,0,0,0)");
  x.fillStyle = v;
  x.fillRect(0, 0, c.width, c.height);
  const h = x.createLinearGradient(0, 0, c.width, 0);
  h.addColorStop(0, "rgba(0,0,0,0)");
  h.addColorStop(.15, "rgba(0,0,0,1)");
  h.addColorStop(.85, "rgba(0,0,0,1)");
  h.addColorStop(1, "rgba(0,0,0,0)");
  x.fillStyle = h;
  x.fillRect(0, 0, c.width, c.height);
  return _nb = c;
}

export function dibujarLogo(g, im, alfa, fondo = "#000") {
  limpiar(g, fondo);
  imagen(g, im, alfa, 64, -16, 512, 512);
}

export function dibujarAdvertencia(g, I, fuente, texto, alfa) {
  limpiar(g);
  imagen(g, I.carne, alfa * .5);
  fuente.escribir(g, texto, W / 2, H / 2 - 22, {
    escala: ESC,
    alinear: "centro",
    alfa: alfa,
    interlinea: 24
  });
}

export function dibujarOpciones(g, I, fuente, textos, filas, elegido, ayuda, t = 0, titulo = null) {
  const M = enCasco();
  if (M) return opcionesCasco(M, g, I, fuente, textos, filas, elegido, ayuda, t, titulo);
  limpiar(g);
  imagen(g, I.opciones, 1);
  g.save();
  g.fillStyle = "rgba(0,0,0,0.45)";
  g.fillRect(70 * ESC, 50 * ESC, 500 * ESC, 330 * ESC);
  g.restore();
  fuente.escribir(g, titulo ?? textos(MSG.op.titulo1), W / 2, 62, {
    escala: ESC,
    alinear: "centro",
    color: "#e8d9c4"
  });
  const muchas = filas.length > 14, y0 = muchas ? 96 : 110;
  const paso = Math.min(30, (muchas ? 266 : 250) / Math.max(1, filas.length - 1));
  filas.forEach((f, i) => {
    const y = y0 + i * paso, sel = i === elegido;
    const c = sel ? "#ffffff" : "#a59a8d";
    fuente.escribir(g, f.nombre, 110, y, {
      escala: ESC,
      color: c,
      alfa: sel ? .8 + .2 * Math.sin(t * 5) : 1
    });
    if (f.valor != null) fuente.escribir(g, f.valor, 530, y, {
      escala: ESC,
      color: sel ? "#f0c8b0" : "#b8a898",
      alinear: "der"
    });
  });
  if (ayuda) fuente.escribir(g, ayuda, W / 2, 392, {
    escala: ESC,
    alinear: "centro",
    color: "#cfc4b4",
    interlinea: 22
  });
}

export const PAUSA = {
  titulo: 142,
  volver: 174,
  opciones: 201,
  irTitulo: 126,
  seguro: 127
};

export function dibujarPausa(g, I, fuente, textos, filas, elegido, t = 0, {pregunta: pregunta = null} = {}) {
  const M = enCasco();
  if (M) return pausaCasco(M, g, I, fuente, textos, filas, elegido, t, pregunta);
  limpiar(g);
  imagen(g, I.opciones, .55);
  g.save();
  g.fillStyle = "rgba(0,0,0,0.5)";
  g.fillRect(150 * ESC, 110 * ESC, 340 * ESC, 220 * ESC);
  g.restore();
  fuente.escribir(g, textos(PAUSA.titulo), W / 2, 130, {
    escala: ESC,
    alinear: "centro",
    color: "#e8d9c4"
  });
  filas.forEach((n, i) => {
    const sel = i === elegido;
    fuente.escribir(g, textos(n), W / 2, 190 + i * 34, {
      escala: ESC,
      alinear: "centro",
      color: sel ? "#ffffff" : "#7d746b",
      alfa: sel ? .8 + .2 * Math.sin(t * 5) : 1
    });
  });
  if (pregunta) fuente.escribir(g, pregunta, W / 2, 350, {
    escala: ESC,
    alinear: "centro",
    color: "#cfc4b4",
    interlinea: 22
  });
}

export function dibujarMensaje(g, fuente, texto, {alfa: alfa = 1, pregunta: pregunta = null} = {}) {
  g.clearRect(0, 0, g.canvas.width, g.canvas.height);
  if (!texto) return;
  const lineas = texto.split("\n").length + (pregunta ? 1 : 0);
  const alto = lineas * 24 + 18, y0 = 128 - alto - 4;
  g.save();
  g.globalAlpha = .55 * alfa;
  const gr = g.createLinearGradient(0, y0 * ESC, 0, 128 * ESC);
  gr.addColorStop(0, "rgba(0,0,0,0)");
  gr.addColorStop(.25, "rgba(0,0,0,0.85)");
  gr.addColorStop(1, "rgba(0,0,0,0.9)");
  g.fillStyle = gr;
  g.fillRect(40 * ESC, y0 * ESC, 560 * ESC, (128 - y0) * ESC);
  g.restore();
  fuente.escribir(g, texto, 320, y0 + 10, {
    escala: ESC,
    alinear: "centro",
    alfa: alfa,
    interlinea: 24
  });
  if (pregunta) {
    const y = y0 + 10 + (lineas - 1) * 24;
    pregunta.opciones.forEach((op, i) => {
      const x = 320 + (i === 0 ? -60 : 60);
      fuente.escribir(g, op, x, y, {
        escala: ESC,
        alinear: "centro",
        color: i === pregunta.elegido ? "#ffffff" : "#8a8178",
        alfa: alfa
      });
    });
  }
}

export function dibujarSubtitulo(g, fuente, texto, {y: y = 360, alfa: alfa = 1} = {}) {
  if (!texto) return;
  fuente.escribir(g, texto, 320, y, {
    escala: ESC,
    alinear: "centro",
    alfa: alfa,
    interlinea: 24
  });
}

const CASCO = {
  dist: 1.8,
  alto: 1.3
};

function enCasco() {
  const M = globalThis.window?.sh4juego?.M;
  return M?.enVR?.() ? M : null;
}

function esc(g, fuente, s, x, y, k, op = {}) {
  if (s) fuente.escribir(g, s, x / k, y / k, {
    ...op,
    escala: ESC * k
  });
}

function acercarPantalla(M) {
  const pl = M.pantalla?.plano, THREE = M.THREE;
  if (!pl || !THREE || pl.parent !== M.escena || Math.abs(pl.scale.x - 2.4) > 1e-6) return;
  const cab = M.camara.getWorldPosition(new THREE.Vector3);
  const dir = pl.position.clone().sub(cab);
  dir.y = 0;
  if (dir.lengthSq() < 1e-6) M.camara.getWorldDirection(dir).setY(0);
  dir.normalize();
  pl.position.copy(cab).addScaledVector(dir, CASCO.dist);
  pl.position.y = cab.y - .06;
  pl.scale.setScalar(CASCO.alto);
  pl.lookAt(cab.x, pl.position.y, cab.z);
}

const puntero = {
  fila: null,
  vibro: 0
};

function apuntar(M) {
  const THREE = M.THREE, pl = M.pantalla?.plano;
  const r = M.control?.rayos?.().find(x => x.fuente === "control");
  if (!r || !pl?.visible || !THREE) return null;
  const ray = new THREE.Raycaster(r.origen, r.dir, 0, 10);
  pl.updateMatrixWorld(true);
  const h = ray.intersectObject(pl, false)[0];
  return h?.uv ? {
    x: h.uv.x * W,
    y: (1 - h.uv.y) * H
  } : null;
}

function seguirPuntero(M, p, filasY, elegido, alto) {
  let fila = null;
  if (p) filasY.forEach((y, i) => {
    if (p.y >= y - alto / 2 && p.y < y + alto / 2 && p.x > 60 && p.x < 580) fila = i;
  });
  if (fila !== puntero.fila) {
    puntero.fila = fila;
    if (fila != null && fila !== elegido) {
      const n = Math.abs(fila - elegido), paso = fila > elegido ? "abajo" : "arriba";
      for (let i = 0; i < n; i++) M.pulsar(paso);
      const lado = M.opciones?.().manoVR === "izq" ? "left" : "right";
      try {
        for (const s of M.renderer.xr.getSession()?.inputSources || []) if (s.handedness === lado) s.gamepad?.hapticActuators?.[0]?.pulse?.(.2, 15);
      } catch {}
    }
  }
}

function fondoCasco(g, I, x, y, w, h) {
  limpiar(g);
  imagen(g, I.opciones, .3);
  g.save();
  g.fillStyle = "rgba(4,3,3,0.86)";
  g.fillRect(x * ESC, y * ESC, w * ESC, h * ESC);
  g.strokeStyle = "rgba(150,72,36,0.85)";
  g.lineWidth = 3;
  g.strokeRect(x * ESC, y * ESC, w * ESC, h * ESC);
  g.restore();
}

function franja(g, y, alto, t) {
  g.save();
  g.fillStyle = `rgba(150,28,18,${.45 + .1 * Math.sin(t * 5)})`;
  g.fillRect(70 * ESC, (y - 4) * ESC, 500 * ESC, alto * ESC);
  g.restore();
}

function cursor(g, p, M) {
  if (!p || M?.manos) return;
  const x = p.x * ESC, y = p.y * ESC;
  g.save();
  g.strokeStyle = g.fillStyle = "rgba(255,36,20,0.95)";
  g.lineWidth = 3;
  g.beginPath();
  g.arc(x, y, 10, 0, Math.PI * 2);
  g.stroke();
  g.beginPath();
  g.arc(x, y, 3, 0, Math.PI * 2);
  g.fill();
  for (const [dx, dy] of [ [ 0, -1 ], [ 1, 0 ], [ 0, 1 ], [ -1, 0 ] ]) g.fillRect(x + dx * 15 - 1.5, y + dy * 15 - 1.5, dx ? 6 * Math.sign(dx) : 3, dy ? 6 * Math.sign(dy) : 3);
  g.restore();
}

function ayudaCasco(g, fuente, textos, y) {
  esc(g, fuente, t("casco.ayuda", textos(173) || t("decidir"), textos(174) || t("volver")), W / 2, y, .9, {
    alinear: "centro",
    color: "#bdb2a4"
  });
}

function pausaCasco(M, g, I, fuente, textos, filas, elegido, t, pregunta) {
  acercarPantalla(M);
  fondoCasco(g, I, 70, 40, 500, 368);
  esc(g, fuente, textos(PAUSA.titulo), W / 2, 62, 1.5, {
    alinear: "centro",
    color: "#f0e4d2"
  });
  const k = 1.45, paso = 52, y0 = pregunta ? 230 : 150;
  const filasY = filas.map((_, i) => y0 + i * paso);
  if (pregunta) esc(g, fuente, pregunta, W / 2, 140, 1.2, {
    alinear: "centro",
    color: "#e6dccd",
    interlinea: 22
  });
  filas.forEach((n, i) => {
    const sel = i === elegido;
    if (sel) franja(g, filasY[i] - 4, 20 * k + 10, t);
    esc(g, fuente, textos(n), W / 2, filasY[i], k, {
      alinear: "centro",
      color: sel ? "#ffffff" : "#c9beb0"
    });
  });
  const p = apuntar(M);
  seguirPuntero(M, p, filasY.map(y => y + 12), elegido, paso);
  ayudaCasco(g, fuente, textos, 376);
  cursor(g, p, M);
}

function opcionesCasco(M, g, I, fuente, textos, filas, elegido, ayuda, t, titulo = null) {
  acercarPantalla(M);
  fondoCasco(g, I, 50, 12, 540, 424);
  esc(g, fuente, titulo ?? textos(MSG.op.titulo1), W / 2, 22, 1.3, {
    alinear: "centro",
    color: "#f0e4d2"
  });
  const k = filas.length > 9 ? 1.2 : 1.3, paso = Math.min(34, (filas.length > 14 ? 320 : 290) / Math.max(1, filas.length)), y0 = 60;
  const filasY = filas.map((_, i) => y0 + i * paso);
  filas.forEach((f, i) => {
    const sel = i === elegido;
    if (sel) franja(g, filasY[i] - 2, paso, t);
    esc(g, fuente, f.nombre, 84, filasY[i], k, {
      color: sel ? "#ffffff" : "#c9beb0"
    });
    if (f.valor != null) esc(g, fuente, (sel ? "< " : "") + f.valor + (sel ? " >" : ""), 556, filasY[i], k, {
      alinear: "der",
      color: sel ? "#ffd9c4" : "#d8c8b8"
    });
  });
  if (ayuda) esc(g, fuente, ayuda.split(String.fromCharCode(10)).join(" "), W / 2, y0 + filas.length * paso + 6, .95, {
    alinear: "centro",
    color: "#e0d6c8"
  });
  const p = apuntar(M);
  seguirPuntero(M, p, filasY.map(y => y + 12), elegido, paso);
  ayudaCasco(g, fuente, textos, 410);
  cursor(g, p, M);
}

export { enCasco, acercarPantalla, apuntar, seguirPuntero, fondoCasco, franja, cursor, ayudaCasco, esc as escribirEscalado };
