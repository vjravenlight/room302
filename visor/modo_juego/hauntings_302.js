// SH4 web — FeniXVOID · Project Ravenlight
import * as THREE from "three";

import { bajar, q } from "./motor.js";

import { aMundo, OJOS } from "./cuarto.js";

import * as P from "./pantallas.js";

import { imagenJuego } from "../suite_juego.js";

import { crearVisualesHauntings } from "../efectos/hauntings_302_fx.js";

const FPS = 30, DT = 1 / FPS;

export const FILAS = [ {
  n: 0,
  nombre: "grieta de la pared",
  jp: "壁のヒビ",
  mascara: 6,
  momento: 2,
  rad: 400,
  pos: [ 1270, -350, -160 ],
  spot: [ 1270, -50, -160 ]
}, {
  n: 1,
  nombre: "la ventana",
  jp: "Window",
  mascara: 2,
  momento: 1,
  rad: 550,
  pos: [ 900.884, -272.157, -900.884 ],
  spot: [ 769, -50, -905 ]
}, {
  n: 2,
  nombre: "ventana derecha (datos de la 1)",
  jp: "右Window",
  mascara: 0,
  momento: 99,
  rad: 500,
  pos: [ 637.211, -285.542, -909.525 ],
  spot: [ 0, -50, 0 ]
}, {
  n: 3,
  nombre: "el cuadro",
  jp: "絵",
  mascara: 4,
  momento: 3,
  rad: 350,
  pos: [ -150, -300, -290 ],
  spot: [ -150, -50, -290 ]
}, {
  n: 4,
  nombre: "el sofá",
  jp: "ソファ",
  mascara: 2,
  momento: 3,
  rad: 400,
  pos: [ 900, -100, -700 ],
  spot: [ 900, -50, -700 ]
}, {
  n: 5,
  nombre: "el superintendente",
  jp: "管理人",
  mascara: 2,
  momento: 3,
  rad: 400,
  pos: [ 480, -300, 850 ],
  spot: [ 480, -50, 850 ]
}, {
  n: 6,
  nombre: "el fantasma de la pared",
  jp: "ゴースト",
  mascara: 30,
  momento: 3,
  rad: 600,
  pos: [ 1270, -400, -610 ],
  spot: [ 1270, -50, -610 ]
}, {
  n: 7,
  nombre: "el teléfono",
  jp: "電話",
  mascara: 4,
  momento: 2,
  rad: 300,
  pos: [ 550, -130, -350 ],
  spot: [ 550, -50, -350 ]
}, {
  n: 8,
  nombre: "los muñecos de la pared",
  jp: "壁人形",
  mascara: 2,
  momento: 2,
  rad: 400,
  pos: [ 331.626, -299.099, -252.956 ],
  spot: [ 331.626, -50, -252.956 ]
}, {
  n: 9,
  nombre: "la tele",
  jp: "てれび",
  mascara: 2,
  momento: 2,
  rad: 400,
  pos: [ 450, -200, -440 ],
  spot: [ 450, -50, -440 ]
}, {
  n: 10,
  nombre: "la sombra",
  jp: "人影",
  mascara: 4,
  momento: 1,
  rad: 600,
  pos: [ 550, -100, 50 ],
  spot: [ 550, -50, 50 ]
}, {
  n: 11,
  nombre: "los zapatos",
  jp: "靴",
  mascara: 2,
  momento: 1,
  rad: 300,
  pos: [ 1040, -10, 410 ],
  spot: [ 1040, -50, 410 ]
}, {
  n: 12,
  nombre: "el reloj",
  jp: "時計",
  mascara: 2,
  momento: 1,
  rad: 500,
  pos: [ 342.147, -344.085, -645.925 ],
  spot: [ 342.147, -50, -645.925 ]
}, {
  n: 13,
  nombre: "la carne en la heladera",
  jp: "肉塊in冷蔵庫",
  mascara: 2,
  momento: 2,
  rad: 300,
  pos: [ 760, -100, 700 ],
  spot: [ 760, -50, 700 ]
}, {
  n: 14,
  nombre: "la sangre de la canilla",
  jp: "蛇口血",
  mascara: 2,
  momento: 3,
  rad: 400,
  pos: [ 997.739, -177.297, 820.781 ],
  spot: [ 997.739, -50, 820.781 ]
} ];

export const C = {
  BANDERA: 1311,
  NIVEL: 1e4,
  TOPE_RELOJ: 9e3,
  CAIDA: 3.3333333,
  LIMPIO: 3e3,
  ESPERA: 1800,
  TOPE_AFUERA: 360,
  CHANCE: 90,
  INTENTOS: 3,
  INTERNO: 250,
  POTENCIA: .001,
  RESTA: 100,
  FINAL: .8,
  MEDALLON: 4,
  GASTO_MEDALLON: 4,
  VELA: 8.01,
  RADIO_VELA: 400,
  VIDA_VELA: 100,
  QUEMA_USO: 7.9,
  AVISO1: 900,
  AVISO2: 400
};

export const ITEM = {
  VELA: 4,
  MEDALLON: 8,
  MUNECO: 83,
  MONEDA_SUCIA: 91,
  MONEDA: 92
};

export function crearHauntings302(ctx) {
  const {M: M, juego: juego, cuarto: cuarto, PARTIDA: PARTIDA, F: F, prender: prender, decir: decir, textoRoom: textoRoom} = ctx;
  const son = () => ctx.son?.() || null;
  const fx = () => juego.ambiente?.fx || null;
  const escena = () => +cuarto.escena;
  const H = PARTIDA.hauntings ||= {};
  H.pw ||= FILAS.map(() => ({
    nivel: 0,
    dano: 0,
    estado: 0,
    reloj: 0
  }));
  H.limpios ??= 0;
  H.maldicion ??= 0;
  H.iniciado ??= false;
  H.ultimo ??= -1;
  H.aviso ??= 0;
  H.velas ||= [];
  H.medallon ??= false;
  H.sofa ??= 0;
  H.marcas ||= [];
  const W = FILAS.map((f, n) => {
    const s = H.pw[n];
    return {
      n: n,
      rad: f.rad,
      pos: [ ...f.pos ],
      spot: [ ...f.spot ],
      get nivel() {
        return s.nivel;
      },
      set nivel(v) {
        s.nivel = v;
      },
      get dano() {
        return s.dano;
      },
      set dano(v) {
        s.dano = v;
      },
      get estado() {
        return s.estado;
      },
      set estado(v) {
        s.estado = v;
      },
      get reloj() {
        return s.reloj;
      },
      set reloj(v) {
        s.reloj = v;
      },
      get sofa() {
        return H.sofa;
      },
      set sofa(v) {
        H.sofa = v;
      },
      get sofaAlfa() {
        return H.sofaAlfa || 0;
      },
      set sofaAlfa(v) {
        H.sofaAlfa = v;
      }
    };
  });
  const cuadros = () => Math.floor((PARTIDA.reloj || 0) * FPS);
  const lugares = () => (PARTIDA.henry ||= {
    lugares: [],
    notas: [],
    vida: 100
  }).lugares ||= [];
  const cuantos = k => lugares().filter(([x]) => x === k).reduce((a, [, n]) => a + n, 0) + (PARTIDA.inventario || []).slice(PARTIDA.inventarioVisto || 0).filter(x => x === k).length;
  function quitarItem(k) {
    const vistos = PARTIDA.inventarioVisto || 0, j = (PARTIDA.inventario || []).lastIndexOf(k);
    if (j >= vistos) {
      PARTIDA.inventario.splice(j, 1);
      return;
    }
    const L = lugares(), i = L.findIndex(([x, n]) => x === k && n > 0);
    if (i >= 0) {
      L[i][1]--;
      if (L[i][1] <= 0) L.splice(i, 1);
    }
    (PARTIDA.quitarDeHenry ||= []).push(k);
  }
  function darItem(k) {
    (PARTIDA.inventario ||= []).push(k);
  }
  function durMedallon() {
    const L = lugares(), l = L.find(([x]) => x === ITEM.MEDALLON);
    if (!l) return cuantos(ITEM.MEDALLON) ? 100 : 0;
    if (l[2] == null) l[2] = 100;
    return l[2];
  }
  function gastarMedallon(v) {
    const L = lugares();
    let l = L.find(([x]) => x === ITEM.MEDALLON);
    if (!l && cuantos(ITEM.MEDALLON)) {
      const j = PARTIDA.inventario.lastIndexOf(ITEM.MEDALLON);
      PARTIDA.inventario.splice(j, 1);
      L.push(l = [ ITEM.MEDALLON, 1, 100 ]);
    }
    if (!l) return 0;
    l[2] = (l[2] ?? 100) - v;
    if (l[2] <= 0) {
      l[1]--;
      if (l[1] <= 0) L.splice(L.indexOf(l), 1); else l[2] = 100;
      (PARTIDA.quitarDeHenry ||= []).push(ITEM.MEDALLON);
      if (!cuantos(ITEM.MEDALLON)) H.medallon = false;
      return 0;
    }
    return l[2];
  }
  const medallonPuesto = () => H.medallon && cuantos(ITEM.MEDALLON) > 0 && durMedallon() > 0;
  const vida = () => (PARTIDA.henry ||= {
    lugares: [],
    notas: [],
    vida: 100
  }).vida ?? (PARTIDA.henry.vida = 100);
  const activos = () => H.pw.filter(s => s.estado === 1).length;
  function proporcion() {
    const t = H.maldicion + H.limpios + activos();
    return t ? H.limpios / t : 1;
  }
  function actualizarFinal() {
    PARTIDA.fenomenos = {
      purificados: H.limpios,
      fallados: H.maldicion,
      activos: activos()
    };
  }
  actualizarFinal();
  function empezar(n) {
    const s = H.pw[n];
    s.dano = 0;
    s.reloj = 0;
    s.nivel = C.NIVEL;
    s.estado = 1;
    if (n === 4) H.sofa = 0;
    actualizarFinal();
  }
  function agregarTiempo(n, t) {
    const s = H.pw[n];
    if (s.estado !== 1) return;
    let resto = t;
    if (s.reloj < C.TOPE_RELOJ) {
      const r = s.reloj + t;
      if (r < C.TOPE_RELOJ) {
        s.reloj = r;
        resto = 0;
      } else {
        resto = r - C.TOPE_RELOJ;
        s.reloj = C.TOPE_RELOJ;
      }
    }
    if (s.reloj >= C.TOPE_RELOJ) {
      s.reloj += resto;
      s.nivel -= resto * C.CAIDA;
    }
    if (s.nivel <= 0) {
      if (n === 0 || n === 6) H.marcas.push({
        n: n,
        escena: escena(),
        pos: [ ...W[n].pos ]
      }), H.marcas.splice(0, H.marcas.length - 10);
      s.estado = 2;
      if (s.dano < C.LIMPIO) H.maldicion++; else H.limpios++;
      actualizarFinal();
      ctx.alTerminar?.(n, s.dano >= C.LIMPIO);
    }
  }
  function sortear() {
    if (!(H.ultimo > 0)) return null;
    const pasado = cuadros() - H.ultimo;
    if (pasado <= 0) return null;
    for (let n = 0; n < 15; n++) agregarTiempo(n, Math.min(pasado, C.TOPE_AFUERA));
    if (pasado < C.ESPERA) return null;
    if (Math.floor(Math.random() * 100) >= C.CHANCE) return null;
    let tope = 1;
    if (F(328)) tope = 2;
    if (F(534)) tope = 3;
    for (let k = 0; k < C.INTENTOS; k++) {
      let n;
      do {
        n = Math.floor(Math.random() * 15);
      } while (FILAS[n].momento > tope);
      if (puedeEmpezar(n)) {
        empezar(n);
        return n;
      }
    }
    return null;
  }
  function puedeEmpezar(n) {
    const s = H.pw[n], est = k => H.pw[k].estado;
    if (s.estado === 1) return false;
    if (s.estado === 2 && n !== 6 && n !== 0 && n !== 8 && s.dano >= C.LIMPIO) return false;
    if (n === 6 && est(0) === 1) return false;
    if (n === 0 && est(6) === 1) return false;
    if (n === 8 && !cuantos(ITEM.MUNECO)) return false;
    if (n === 14 && !F(1634)) return false;
    if (n === 5 && F(1580)) return false;
    if (FILAS[n].mascara !== 4) return true;
    const vivos = FILAS.filter(f => f.mascara & 2 && f.momento === FILAS[n].momento);
    if (!vivos.some(f => est(f.n) === 0)) return true;
    if (proporcion() > .5) return false;
    return vivos.filter(f => est(f.n) !== 0).length > 2;
  }
  const posHenry = () => {
    const v = M.camara.getWorldPosition(new THREE.Vector3);
    return [ -v.x / .005, 0, v.z / .005 ];
  };
  let zonas = [], avisoPedido = null;
  function zona(w, potencia) {
    const p = posHenry(), d = Math.hypot(p[0] - w.spot[0], p[2] - w.spot[2]), interno = w.rad - C.INTERNO;
    let x = 0;
    if (d < w.rad) x = d < interno ? potencia * DT : (w.rad - d) * potencia / (w.rad - interno) * DT;
    zonas.push({
      n: w.n,
      d: d,
      rad: w.rad,
      potencia: potencia,
      x: x,
      spot: w.spot
    });
    if (medallonPuesto() && x > 0) {
      zonas[zonas.length - 1].danio = 0;
      gastarMedallon(C.GASTO_MEDALLON * DT);
      if (H.aviso === 2 || H.aviso === 4) avisoPedido = {
        n: 280,
        siguiente: H.aviso === 2 ? 3 : 5
      };
      return Math.max(x, .01) * C.MEDALLON;
    }
    zonas[zonas.length - 1].danio = x;
    let v = 0;
    for (const vela of H.velas) {
      if (vela.escena !== escena()) continue;
      const dd = Math.hypot(vela.pos[0] - w.spot[0], vela.pos[1] - w.spot[1], vela.pos[2] - w.spot[2]);
      if (dd < C.RADIO_VELA) {
        v += DT * (vela.potencia || 1) * C.VELA;
        vela.usada = true;
      }
    }
    if (v > 0 && (H.aviso === 2 || H.aviso === 3)) avisoPedido = {
      n: 281,
      siguiente: H.aviso === 2 ? 4 : 5
    };
    return v;
  }
  let vis = null;
  try {
    vis = crearVisualesHauntings({
      THREE: THREE,
      M: M,
      juego: juego,
      cuarto: cuarto,
      bajar: bajar,
      son: son,
      fx: fx()
    });
  } catch (e) {
    console.warn("hauntings fx", e);
  }
  const visibles = new Set;
  let velasSala = [];
  const activo = () => F(C.BANDERA) && /^rl0[0-3]/.test(cuarto.sala?.nombre || "") && !/^(mundo|al Subte|túnel|final)/.test(juego.fase || "") && juego.fase !== "game over" && juego.fase !== "mirilla";
  function alEntrarSala() {
    visibles.clear();
    for (const v of velasSala) v.obj?.quitar();
    velasSala = [];
    if (vis) vis.alEntrarSala(0, []);
    if (!activo()) return;
    if (!H.iniciado) {
      H.iniciado = true;
      H.ultimo = -1;
      H.limpios = 0;
      H.maldicion = 0;
    }
    const esc = escena(), bit = 1 << esc;
    for (const f of FILAS) {
      if (!(f.mascara & bit) || f.n === 5 && F(1580)) continue;
      W[f.n].pos = [ ...f.pos ];
      W[f.n].spot = [ ...f.spot ];
      visibles.add(f.n);
    }
    const nuevo = sortear();
    H.ultimo = cuadros();
    vis?.alEntrarSala(esc, [ ...visibles ].map(n => ({
      n: n,
      w: W[n]
    })));
    for (const v of H.velas.filter(x => x.escena === esc)) prenderVela(v);
    if (nuevo != null) console.info("haunting nuevo:", nuevo, FILAS[nuevo].nombre);
    actualizarFinal();
  }
  async function prenderVela(v) {
    const r = {
      v: v,
      obj: null
    };
    velasSala.push(r);
    r.obj = await (vis?.vela(v));
    if (!velasSala.includes(r)) r.obj?.quitar();
  }
  let resto = 0, ocupado = false, tRojo = 0;
  const parado = () => juego.demoActual || juego.hablando || /^(pausa|game over 302|guardando|cargando partida|baúl|mirando|opciones)/.test(juego.fase || "") || ocupado;
  M.tareas.add((dt, entrada) => {
    if (!activo()) return false;
    teclas(entrada);
    if (parado()) return false;
    resto += dt;
    let cambio = false, n = 0;
    while (resto >= DT && n++ < 6) {
      resto -= DT;
      if (cuadro()) cambio = true;
    }
    if (resto > DT) resto = 0;
    return cambio;
  });
  M.tareas.add(dt => {
    if (F(C.BANDERA) || !/^rl0/.test(cuarto.sala?.nombre || "") || !/^(302|prologo)/.test(juego.fase || "") || juego.demoActual) return false;
    const v = vida();
    if (v > 0 && v < 100) PARTIDA.henry.vida = Math.min(100, v + Math.min(dt, .1));
    return false;
  });
  function cuadro() {
    const esc = escena(), bit = 1 << esc;
    zonas = [];
    let danio = 0;
    for (let n = 0; n < 15; n++) {
      const f = FILAS[n], s = H.pw[n];
      if (!(f.mascara & bit)) {
        agregarTiempo(n, 1);
        continue;
      }
      if (n === 5 && F(1580)) continue;
      if (s.estado === 1) {
        const ex = zona(W[n], s.nivel * C.POTENCIA);
        const z = zonas[zonas.length - 1];
        if (z) danio += z.danio || 0;
        if (ex) {
          s.nivel -= ex * C.RESTA;
          s.dano += ex * C.RESTA;
          if (n === 4 && H.sofa === 0) {
            H.sofa = 1;
            H.sofaAlfa = 0;
          }
        }
      }
      agregarTiempo(n, 1);
    }
    H.ultimo = cuadros();
    for (const r of velasSala.slice()) {
      const v = r.v;
      v.t = (v.t || 0) + (v.usada ? DT * C.QUEMA_USO : DT);
      v.usada = false;
      r.obj?.actualizar(v.t);
      if (v.t > C.VIDA_VELA) {
        r.obj?.quitar();
        velasSala.splice(velasSala.indexOf(r), 1);
        H.velas.splice(H.velas.indexOf(v), 1);
      }
    }
    if (danio > 0 && !q.has("sindanio")) {
      const nueva = Math.max(0, vida() - danio);
      PARTIDA.henry.vida = nueva;
      tRojo = Math.min(1, tRojo + danio * 3);
      if (PARTIDA.henry.vida <= 0) {
        correr(gameOver);
      }
    }
    try {
      const f_ = fx();
      if (f_) {
        f_.opciones?.({
          medallon: medallonPuesto()
        });
        f_.enemigos?.(zonas.map(z => ({
          distancia: z.d * .005,
          visible: true,
          tipo: "HAUNTING",
          alto: 0,
          rango: z.rad * .005,
          potencia: z.potencia
        })));
        if (tRojo > .01) {
          f_.disparar?.("filtro", {
            tipo: "bordeSangre",
            valor: Math.round(tRojo * 96)
          });
          tRojo *= .94;
        }
      }
    } catch {}
    if (zonas.length && !avisoPedido) {
      const z = zonas.reduce((a, b) => b.x > a.x ? b : a);
      if (H.aviso === 0 && z.d < C.AVISO1) avisoPedido = {
        n: 278,
        siguiente: 1
      }; else if (H.aviso === 1 && z.d < C.AVISO2) avisoPedido = {
        n: 279,
        siguiente: 2
      };
    }
    if (avisoPedido) {
      const a = avisoPedido;
      avisoPedido = null;
      H.aviso = a.siguiente;
      correr(() => decir([ textoRoom(a.n) ]));
    }
    actualizarFinal();
    return vis?.cuadro(DT) || false;
  }
  async function correr(f) {
    if (ocupado) return;
    ocupado = true;
    try {
      await f();
    } catch (e) {
      console.warn("hauntings", e);
    } finally {
      ocupado = false;
    }
  }
  let imgGO = null;
  imagenJuego("snap_gameover", 0, [ 0, 0, 512, 448 ]).then(c => {
    imgGO = c;
  }).catch(() => {});
  async function gameOver() {
    const fase = juego.fase;
    juego.fase = "game over 302";
    juego.hablando = true;
    await M.fundir(1, 1.6);
    const g = M.pantalla.g;
    M.ponerVelo(0);
    M.pantalla.mostrar();
    await new Promise(ok => {
      let t = 0;
      const tarea = (dt, {acciones: acciones}) => {
        t += dt;
        P.limpiar(g);
        if (imgGO) P.imagen(g, imgGO, Math.min(1, t / 2));
        juego.fuente?.escribir(g, "GAME OVER", 320, 250, {
          escala: P.ESC * 1.6,
          alinear: "centro",
          color: "#c0261a",
          alfa: Math.min(1, t / 1.5)
        });
        if (t > 2) juego.fuente?.escribir(g, juego.textoComun?.(105) || "CONTINUAR", 320, 320, {
          escala: P.ESC,
          alinear: "centro",
          color: "#ece3d2",
          alfa: .6 + .3 * Math.sin(t * 3)
        });
        M.pantalla.actualizar();
        if (t > 2 && acciones.some(a => a === "aceptar" || a === "accion" || a === "clic")) {
          M.tareas.delete(tarea);
          ok();
        }
        return true;
      };
      M.tareas.add(tarea);
    });
    M.ponerVelo(1);
    M.pantalla.ocultar();
    PARTIDA.continuadas = (PARTIDA.continuadas || 0) + 1;
    PARTIDA.henry.vida = 100;
    try {
      await cuarto.cargar(ctx.varianteDe("rl01"), {
        pos: aMundo([ 417, 0, -334.6 ]),
        giro: Math.atan2(Math.sin(-1.371), -Math.cos(-1.371))
      });
      if (!M.enVR()) M.camara.position.set(0, OJOS, 0);
      ctx.alEntrarSala?.();
      await (ctx.recargarSala?.());
    } catch (e) {
      console.warn("game over 302", e);
    } finally {
      juego.fase = fase;
      juego.hablando = false;
    }
    await M.fundir(0, .8);
  }
  const nombreItem = k => (juego.textoItem?.({
    [ITEM.VELA]: 18,
    [ITEM.MEDALLON]: 27
  }[k]) || "").replace(/^\|?\W?/, "").replace(/\|/g, " ").trim() || (k === ITEM.VELA ? "Vela Sagrada" : "Medallón Santo");
  let iAntes = false;
  function teclas(entrada) {
    if (juego.inventario302) {
      iAntes = !!entrada?.teclas?.KeyI;
      botonPedido = false;
      if (boton) boton.style.display = "none";
      return;
    }
    const i = !!entrada?.teclas?.KeyI, libre = juego.libre && !juego.libre.ocupado && !juego.hablando && !juego.demoActual && !ocupado;
    const pide = i && !iAntes || (entrada?.acciones || []).includes("cancelar") || botonPedido;
    iAntes = i;
    botonPedido = false;
    if (pide && libre) correr(menuObjetos);
    if (boton) boton.style.display = libre && M.tactil ? "" : "none";
  }
  let botonPedido = false, boton = null;
  if (M.tactil) {
    boton = document.createElement("button");
    boton.textContent = "OBJETOS";
    boton.id = "botonObjetos302";
    boton.style.cssText = 'position:fixed;top:14px;right:16px;z-index:31;padding:10px 14px;border-radius:22px;border:1px solid rgba(236,227,210,.5);background:rgba(20,12,10,.55);color:#ece3d2;font:13px "Cormorant Garamond",Georgia,serif;letter-spacing:.08em;display:none';
    boton.addEventListener("touchstart", e => {
      e.preventDefault();
      botonPedido = true;
    }, {
      passive: false
    });
    boton.addEventListener("click", () => {
      botonPedido = true;
    });
    document.body.appendChild(boton);
  }
  async function menuObjetos() {
    juego.hablando = true;
    try {
      const velas = cuantos(ITEM.VELA), med = cuantos(ITEM.MEDALLON);
      if (!velas && !med) {
        await decir([ juego.textoComun?.(211) || "No tienes nada." ]);
        return;
      }
      if (velas && await decir([ `¿Usar la ${nombreItem(ITEM.VELA)}? (${velas})` ], {
        pregunta: true
      })) {
        await usarVela();
        return;
      }
      if (med) {
        const p = H.medallon ? `¿Sacarte el ${nombreItem(ITEM.MEDALLON)}?` : `¿Ponerte el ${nombreItem(ITEM.MEDALLON)}? (${Math.round(durMedallon())} %)`;
        if (await decir([ p ], {
          pregunta: true
        })) H.medallon = !H.medallon;
      }
    } finally {
      juego.hablando = false;
    }
  }
  async function usarVela() {
    const f_ = fx(), L = f_?.lugaresVela;
    const pie = M.camara.getWorldPosition(new THREE.Vector3);
    const fr = new THREE.Vector3(0, 0, -1).applyQuaternion(M.camara.getWorldQuaternion(new THREE.Quaternion));
    let p = null;
    try {
      await (L?.cargar());
      p = L?.buscar(escena(), [ -pie.x / .005, -pie.y / .005, pie.z / .005 ], [ -fr.x, -fr.y, fr.z ]) || null;
    } catch (e) {
      console.warn("vela", e.message);
    }
    if (!p) {
      await decir([ juego.textoItem?.(22) || "No puedo ponerla aquí..." ]);
      return;
    }
    quitarItem(ITEM.VELA);
    const v = {
      escena: escena(),
      pos: [ ...p ],
      t: 0,
      n: 20 + (H.cuentaVelas = (H.cuentaVelas || 0) + 1) % 30,
      potencia: 1
    };
    H.velas.push(v);
    prenderVela(v);
  }
  const estadoDe = n => {
    if (n === 8 && H.pw[8].estado === 2 && vis?.armados.includes(8)) return 1;
    return H.pw[n].estado;
  };
  const TRGCHK = {
    "0x54c030": () => F(1505) && !(escena() === 1 && estadoDe(1) === 1),
    "0x4dadd0": () => !!PARTIDA.heladera && estadoDe(13) === 1,
    "0x4dae60": () => F(1570) && !F(1681),
    "0x54a8e0": () => estadoDe(4) === 1 && H.pw[4].nivel >= 5e3 && H.sofa === 0,
    "0x4dabc0": () => estadoDe(14) !== 1
  };
  async function ejecutar(e) {
    const tg = (e.funciones?.trgchk || "").slice(0, 8);
    if (tg === "0x4dae60") {
      await decir([ textoRoom(268) ]);
      prender(1681);
      return null;
    }
    if (tg === "0x54a8e0") {
      H.sofa = 1;
      H.sofaAlfa = 0;
      return null;
    }
    if (e.evnum === 2212) return lavarMoneda();
    return undefined;
  }
  async function lavarMoneda() {
    if (!cuantos(ITEM.MONEDA_SUCIA)) return null;
    await M.fundir(1, .5);
    try {
      son()?.efecto(50700, null, {
        volumen: 1
      });
    } catch {}
    await M.esperar(1);
    await decir([ juego.textoItem?.(266) || "" ]);
    quitarItem(ITEM.MONEDA_SUCIA);
    await M.fundir(0, .5);
    await decir([ juego.textoItem?.(269) || "" ]);
    darItem(ITEM.MONEDA);
    prender(1634);
    return null;
  }
  if (q.has("hauntings")) {
    prender(C.BANDERA);
    const v = q.get("hauntings");
    const lista = v === "todos" || v === "" ? FILAS.filter(f => f.mascara).map(f => f.n) : v.split(",").map(Number);
    for (const n of lista) if (FILAS[n]) {
      const s = H.pw[n];
      s.dano = 0;
      s.reloj = 0;
      s.nivel = C.NIVEL;
      s.estado = 1;
    }
    if (q.has("medallon")) {
      if (!cuantos(ITEM.MEDALLON)) lugares().push([ ITEM.MEDALLON, 1, 100 ]);
      H.medallon = true;
    }
    if (q.has("velas")) {
      if (!cuantos(ITEM.VELA)) lugares().push([ ITEM.VELA, 3 ]);
    }
    H.iniciado = true;
    actualizarFinal();
  }
  const api = {
    TRGCHK: TRGCHK,
    ejecutar: ejecutar,
    alEntrarSala: alEntrarSala,
    util: e => e.evnum === 2212 || (e.funciones?.trgchk || "").startsWith("0x54a8e0"),
    estadoDe: estadoDe,
    proporcion: proporcion,
    empezar: empezar,
    sortear: sortear,
    usarVela: usarVela,
    menuObjetos: menuObjetos,
    sinLimpiar: () => H.maldicion + activos(),
    cuartoLimpio: () => proporcion() >= C.FINAL,
    estado() {
      return {
        activo: activo(),
        sala: cuarto.sala?.nombre,
        vida: Math.round(vida() * 10) / 10,
        medallon: H.medallon ? Math.round(durMedallon()) : null,
        velas: H.velas.map(v => ({
          escena: v.escena,
          t: Math.round(v.t)
        })),
        limpios: H.limpios,
        maldicion: H.maldicion,
        proporcion: Math.round(proporcion() * 100) / 100,
        aviso: H.aviso,
        armados: vis?.armados || [],
        pw: H.pw.map((s, n) => s.estado ? `${n} ${FILAS[n].nombre}: ${[ "-", "activo", "terminado" ][s.estado]} nivel ${Math.round(s.nivel)} purificado ${Math.round(s.dano)} reloj ${s.reloj}` : null).filter(Boolean)
      };
    },
    nivel(n, v) {
      H.pw[n].nivel = v;
    },
    gameOver: () => correr(gameOver),
    W: W,
    H: H
  };
  if (vis) vis.texto = (n, seg) => {
    const t = {
      listo: false,
      cortar() {
        this.listo = true;
        ctx.mostrarSub?.("");
      }
    };
    if (juego.opciones?.subtitulos === false) {
      t.listo = true;
      return t;
    }
    ctx.mostrarSub?.(textoRoom(n));
    setTimeout(() => {
      if (!t.listo) t.cortar();
    }, seg * 1e3);
    return t;
  };
  juego.hauntings302 = api;
  return api;
}
