// SH4 web — FeniXVOID · Project Ravenlight
import * as THREE from "three";

import { bajar, json, q } from "./motor.js";

import { leerMensajes } from "./fuente.js";

import { leerTablaSubtitulos } from "../lib/subtitulos.js";

import { crearCuarto, aMundo, OJOS, PARTES_OBJETO } from "./cuarto.js";

import { crearCine } from "./cine_juego.js";

import * as P from "./pantallas.js";

import { crearMirilla } from "./mirilla.js";

import { crearFoco } from "./foco.js";

import { iniciarAmbiente, compartirDescargas } from "./ambiente.js";

import { fundidoDemo, aNegro, aImagen } from "./fundidos.js";

import { imagenJuego } from "../suite_juego.js";

import { crearDias302 } from "./dias_302.js";

import { crearGestoPausa } from "./gesto_pausa.js";

import { crearMira } from "./mira.js";

import { crearInventario302 } from "./inventario_302.js";

import { pantallaGuardado } from "./guardado.js";

import { abrirBaul } from "./baul.js";

import { crearVentana, armarFranjas, aCamara } from "./ventana.js";

import { crearTelefono302 } from "./telefono_302.js";

import { t as textoSitio } from "../textos_sitio.js";

import { seRepite } from "../lib/repetidos_demo.js";

const giroDeAngulo = a => Math.atan2(Math.sin(a), -Math.cos(a));

const BANDERAS_DIA1_SUPUESTAS = [ 1607 ];

export async function iniciarPartida(juego, modo) {
  if (q.get("ir") === "final") {
    modo = "302";
    if (!q.has("mundo")) q.set("mundo", q.has("jefe") ? "ls02" : "ls");
  }
  const {M: M, fuente: fuente, DATOS: DATOS} = juego;
  const estado = juego.estado;
  estado("cargando el 302…");
  const L = juego.IDIOMA;
  compartirDescargas();
  const [ESC, DJ, PC, exe, room0, memo, itemMsg] = await Promise.all([ json("/datos/escenas.json"), json("/datos/demos.json"), json("/datos/personajes_cine.json"), bajar("SILENT HILL 4.exe"), bajar(`data/message_room0_${L}.bin`), bajar(`data/message_memo_msg_${L}.bin`).catch(() => null), bajar(`data/message_item_msg_${L}.bin`).catch(() => null) ]);
  const E = ESC.etapas.rl;
  const tablaSubs = leerTablaSubtitulos(exe) || [];
  const mRoom = leerMensajes(room0), mMemo = memo ? leerMensajes(memo) : [], mItem = itemMsg ? leerMensajes(itemMsg) : [];
  const textoRoom = n => mRoom[0]?.[n] ?? "";
  const textoItem = n => mItem[0]?.[n] ?? "";
  juego.textoItem = textoItem;
  const texto = m => {
    if (m.archivo === "memo_msg") return mMemo[0]?.[m.n] ?? m.texto?.replace(/\|/g, "\n") ?? "";
    if (m.archivo === "item_msg") return textoItem(m.n) || (m.texto || "").replace(/\|/g, "\n");
    if (m.archivo === "common_eu") return juego.textoComun(m.n);
    return textoRoom(m.n) || (m.texto || "").replace(/\|/g, "\n");
  };
  juego.textoRoom = textoRoom;
  const cartel = M.cartel;
  const cartelCentro = M.crearCapa("centro");
  function mostrarSub(t, {centro: centro = false} = {}) {
    const c = centro ? cartelCentro : cartel, otro = centro ? cartel : cartelCentro;
    otro.ocultar();
    P.dibujarMensaje(c.g, fuente, t || "", {});
    if (t) c.mostrar(); else c.ocultar();
  }
  async function decir(lista, {pregunta: pregunta = false, imagenes: imagenes = []} = {}) {
    lista = (Array.isArray(lista) ? lista : [ lista ]).filter(t => t != null && t !== "" && t !== "@");
    if (!lista.length) return null;
    juego.hablando = true;
    const r = await new Promise(ok => {
      let i = 0, t = 0, el = 0, imgMostrada = null;
      const dibujar = () => {
        const ultimo = i === lista.length - 1;
        const preg = pregunta && ultimo ? {
          opciones: [ juego.textoComun(P.MSG.si), juego.textoComun(P.MSG.no) ],
          elegido: el
        } : null;
        P.dibujarMensaje(cartel.g, fuente, lista[i], {
          alfa: Math.min(1, t * 6),
          pregunta: preg
        });
        cartel.mostrar();
        if (imagenes[i] !== imgMostrada) {
          imgMostrada = imagenes[i];
          if (imgMostrada) {
            P.limpiar(M.pantalla.g);
            P.imagen(M.pantalla.g, imgMostrada, 1);
            M.pantalla.mostrar();
            M.pantalla.actualizar();
          } else M.pantalla.ocultar();
        }
      };
      const tarea = (dt, {acciones: acciones}) => {
        t += dt;
        dibujar();
        for (const a of acciones) {
          if (pregunta && i === lista.length - 1 && (a === "izq" || a === "der" || a === "arriba" || a === "abajo")) el = 1 - el;
          if (t > .25 && (a === "aceptar" || a === "accion" || a === "clic" || a === "cancelar")) {
            if (i < lista.length - 1) {
              i++;
              t = 0;
              continue;
            }
            M.tareas.delete(tarea);
            cartel.ocultar();
            if (imgMostrada) M.pantalla.ocultar();
            ok(pregunta ? el === 0 && a !== "cancelar" : true);
            return true;
          }
        }
        return t < .3;
      };
      M.tareas.add(tarea);
    });
    juego.hablando = false;
    return r;
  }
  juego.decir = decir;
  const cuarto = crearCuarto({
    M: M,
    bajar: bajar,
    E: E
  });
  const foco = crearFoco({
    M: M
  });
  let amb = null;
  const cine = crearCine({
    M: M,
    bajar: bajar,
    DJ: DJ,
    PC: PC,
    tablaSubs: tablaSubs,
    mensajesPorPaquete: {
      4: mRoom
    },
    mostrarSub: mostrarSub,
    pisoEn: p => cuarto.pisoEn(p),
    foco: foco,
    alEmpezar: D => amb?.demoEmpieza(D),
    alTerminar: D => amb?.demoTermina(D),
    verHenryVR: () => !!juego.opciones?.henryVR,
    vistaCineVR: () => juego.opciones?.vistaCineVR !== false,
    cineVR: () => juego.opciones?.cineVR || null,
    ambienteSala: () => {
      const l = cuarto.sala?.luces?.find(x => x.tipo === 1);
      return l ? l.color.map(v => v / 255) : null;
    }
  });
  juego.cuarto = cuarto;
  juego.cine = cine;
  juego.foco = foco;
  M.tareas.add(dt => cuarto.animarObjetos(dt));
  const mirilla = juego.mirilla = crearMirilla({
    M: M,
    juego: juego,
    cine: cine,
    cuarto: cuarto,
    bajar: bajar,
    DATOS: DATOS,
    DJ: DJ
  });
  async function demo(id, opciones = {}) {
    const n = typeof id === "string" ? +id.replace(/\D/g, "") : id;
    estado("cinemática d_" + String(n).padStart(3, "0") + "…");
    let D;
    const negro = opciones.sinFundido ? null : aNegro(M);
    try {
      D = await cine.abrir(n);
      await negro;
    } catch (e) {
      console.warn("demo", n, e.message);
      estado("");
      if (!opciones.sinVuelta) aImagen(M);
      return null;
    }
    estado("");
    const faseAntes = juego.fase;
    juego.fase = "demo " + n;
    juego.demoActual = D;
    const velo = fundidoDemo(D, {
      ...opciones,
      sinEntrada: !!opciones.sinFundido
    });
    const escondidos = [];
    for (const o of cuarto.grupo?.children || []) {
      if (o.visible && !(/^sala_/.test(o.name) || o.isLight || o.name === "luces de personajes" || o.userData?.enDemo) && seRepite(o, D)) {
        o.visible = false;
        escondidos.push(o);
      }
    }
    const fija = cuarto.grupo?.children.find(o => /^sala_/.test(o.name));
    const po = PARTES_OBJETO[cuarto.sala?.nombre], mostrados = [];
    for (const i of po?.ocultar || []) {
      const o = fija?.getObjectByName("mundo_" + i);
      if (o?.visible) {
        o.visible = false;
        escondidos.push(o);
      }
    }
    for (const i of po?.mostrar || []) {
      const o = fija?.getObjectByName("mundo_" + i);
      if (o && !o.visible) {
        o.visible = true;
        mostrados.push(o);
      }
    }
    M.fundir(opciones.sinFundido ? 0 : 1, .001);
    const alCuadro = opciones.alCuadro;
    let saltada = true;
    try {
      saltada = await cine.reproducir(D, {
        ...opciones,
        alCuadro: s => {
          M.ponerVelo(velo(s));
          alCuadro?.(s);
        }
      });
    } catch (e) {
      console.warn("demo", n, e);
    } finally {
      for (const o of escondidos) o.visible = true;
      for (const o of mostrados) o.visible = false;
      M.anclarCapas();
      cine.liberar(D);
      juego.demoActual = null;
      if (juego.fase === "demo " + n) juego.fase = faseAntes;
    }
    if (!opciones.mantener) {
      M.ponerVelo(1);
      if (!opciones.sinVuelta) aImagen(M);
    }
    return {
      saltada: saltada,
      D: D
    };
  }
  juego.demo = demo;
  async function video(n, maxSeg = null) {
    await M.fundir(1, .5);
    M.ponerVelo(0);
    await juego.reproducirVideo(n, {
      maxSeg: maxSeg
    });
    M.pantalla.ocultar();
  }
  const PARTIDA = juego.partida = {
    banderas: {},
    inventario: [],
    guardadas: 0,
    examenesPrologo: 0,
    ...modo === "cargar" ? (() => {
      try {
        return JSON.parse(JSON.stringify(juego.partidaCargada || null)) || JSON.parse(localStorage.getItem("sh4partida")) || {};
      } catch {
        return {};
      }
    })() : {},
    ...modo === "capitulo" ? JSON.parse(JSON.stringify(juego.estadoInicial || {})) : {},
    ...modo === "nueva" && juego.terrorNuevo ? {
      terrorNuevo: JSON.parse(JSON.stringify(juego.terrorNuevo)),
      guardadas: juego.terrorNuevo.guardadas || 0,
      finales: [ ...juego.terrorNuevo.finales || [] ],
      vestidoEileen: !!juego.terrorNuevo.vestidoEileen
    } : {}
  };
  if (juego.nivel && !PARTIDA.nivel) PARTIDA.nivel = juego.nivel;
  const F = n => !!PARTIDA.banderas[n];
  const prender = n => {
    if (n) PARTIDA.banderas[n] = 1;
  };
  for (const b of (q.get("banderas") || "").split(",").filter(Boolean)) prender(+b);
  const enPrologo = () => !F(1504);
  amb = await iniciarAmbiente({
    M: M,
    juego: juego,
    cuarto: cuarto,
    enPrologo: enPrologo
  });
  juego.ambiente = amb;
  const dias = await crearDias302({
    M: M,
    juego: juego,
    cuarto: cuarto,
    PARTIDA: PARTIDA,
    F: F,
    prender: prender,
    decir: decir,
    demo: demo,
    mostrarSub: mostrarSub,
    textoRoom: textoRoom,
    cumple: cumple,
    recargarSala: recargarSala,
    alEntrarSala: alEntrarSala,
    agujeroBano: agujeroBano,
    radioHistoria: radioHistoria,
    varianteDe: varianteDe,
    son: () => amb?.son || null,
    eventos: () => EV
  });
  const TRGCHK = {
    "0x4da9f0": () => enPrologo(),
    "0x4dae90": () => enPrologo(),
    "0x4daa30": () => enPrologo() || F(1508),
    "0x4daa10": () => F(1508),
    "0x4dafa0": () => F(1613),
    "0x54b810": () => !!PARTIDA.heladera,
    "0x54b390": () => !PARTIDA.heladera && !/^rl00[fg]/.test(cuarto.sala?.nombre || ""),
    "0x4da710": () => !F(1519),
    "0x4da740": () => F(1519),
    "0x4da990": () => !F(1518) && !F(1519),
    "0x4daf20": () => F(1513),
    "0x4ce350": () => F(1512),
    "0x54c030": () => F(1505),
    "0x4d9840": () => F(1504) && !F(1600),
    "0x4d9aa0": () => F(1600),
    "0x4d6690": () => !(F(1524) && !F(1525)),
    "0x4d7fe0": () => F(1508) && !F(1580),
    "0x4d9150": () => F(1522),
    "0x4ccf70": () => F(1504)
  };
  Object.assign(TRGCHK, dias.TRGCHK);
  function cumple(e) {
    const tg = TRGCHK[(e.funciones?.trgchk || "").slice(0, 8)];
    if (tg && !tg()) return false;
    const c = e.condicion || "";
    const tokens = c.match(/!?F\d+/g);
    if (!tokens) return true;
    return tokens.every(t => t[0] === "!" ? !F(+t.slice(2)) : F(+t.slice(1)));
  }
  const banderaPropia = e => dias.finDe(e.evnum)?.[0] ?? (e.evnum === 65 ? 1503 : +(/!F(\d+)/.exec(e.condicion || "")?.[1] || 0));
  function varianteDe(base) {
    if (enPrologo()) return {
      rl00: "rl00g",
      rl01: "rl01d"
    }[base] || DATOS.variantes_sala?.prologo?.[base]?.replace(/\.bin.*$/, "") || base + "a";
    const orden = DATOS.variantes_sala?.por_sala?.[base]?.orden || [];
    for (const o of orden) if (!o.si_bandera || F(o.si_bandera)) return o.archivo.replace(/\.bin$/, "");
    return base + "a";
  }
  const EV = DATOS.eventos || [];
  const escenaActual = () => String(cuarto.escena);
  function puntosDeSala() {
    return EV.filter(e => String(e.escena) === escenaActual() && e.pos && /^punto/.test(e.zona?.tipo || "") && cumple(e) && util(e) && !recogido(e)).map(e => ({
      e: e,
      pos: aMundo(e.pos),
      get caja() {
        return cajaItem(e);
      }
    }));
  }
  const cajasItem = new WeakMap;
  function cajaItem(e) {
    const it = itemsEnSala.find(x => x.e === e);
    if (!it) return null;
    let c = cajasItem.get(it.grupo);
    if (!c) {
      it.grupo.updateMatrixWorld(true);
      c = (new THREE.Box3).setFromObject(it.grupo);
      cajasItem.set(it.grupo, c);
    }
    return c;
  }
  function cajasDeSala() {
    return EV.filter(e => String(e.escena) === escenaActual() && e.pos && e.zona?.caja && cumple(e) && banderaPropia(e)).map(e => {
      const a = aMundo(e.pos), b = aMundo([ e.pos[0] + e.zona.caja[0], e.pos[1] - e.zona.caja[1], e.pos[2] + e.zona.caja[2] ]);
      const caja = (new THREE.Box3).setFromPoints([ a, b ]);
      caja.min.y -= .5;
      caja.max.y += 2.5;
      return {
        e: e,
        caja: caja
      };
    });
  }
  function automaticosDeSala() {
    return EV.filter(e => String(e.escena) === escenaActual() && !e.pos && (banderaPropia(e) || dias.esAutomatico(e)) && cumple(e) && (e.demo || e.evnum === 4 || dias.esAutomatico(e)) && ![ 1, 63, 68 ].includes(e.evnum));
  }
  function util(e) {
    if (e.evnum === 138) return false;
    if (e.mensajes?.some(m => m.texto && m.texto !== "@") || e.lista_mensajes || e.demo || e.items) return true;
    return [ 3015, 7, 3016, 2213, 13 ].includes(e.evnum) || ESPECIALES.includes((e.funciones?.trgchk || "").slice(0, 8)) || dias.util(e);
  }
  const ESPECIALES = [ "0x4d7fe0", "0x4d9150", "0x4d9840", "0x4d9aa0", "0x54c030", "0x54b390" ];
  function textosDe(e) {
    if (e.lista_mensajes) {
      const l = e.lista_mensajes.find(x => !x.mientras_no || !F(x.mientras_no)) || e.lista_mensajes[e.lista_mensajes.length - 1];
      return {
        textos: l.textos.map(texto),
        imagenes: []
      };
    }
    const ms = (e.mensajes || []).filter(m => m.texto !== "@");
    const k = ms.findIndex(m => m.pregunta_si_no);
    return {
      textos: ms.map(texto),
      imagenes: ms.map(m => m.imagen || null),
      pregunta: k >= 0,
      preguntaEn: k
    };
  }
  async function ejecutar(e) {
    juego.ultimoEvento = e.evnum + " (" + e.escena + "/" + e.indice + ")";
    const propia = banderaPropia(e);
    const rd = await dias.ejecutar(e);
    if (rd !== undefined) return rd;
    if (e.funciones?.trgchk?.startsWith("0x4d7fe0")) return mirilla.puerta(e, PARTIDA);
    if (e.funciones?.trgchk?.startsWith("0x4d9150")) return mirilla.agujero(e, PARTIDA);
    if (e.evnum === 3015) return guardar();
    const tg = (e.funciones?.trgchk || "").slice(0, 8);
    if (tg === "0x4d9840" && tieneItem(ITEM_CASETE) && !PARTIDA.caseteOido) return casete();
    if (tg === "0x4d9840") return radio(true);
    if (tg === "0x4d9aa0") return radio(false);
    if (tg === "0x54c030") return ventana(e);
    if (tg === "0x54b390") return heladera(true);
    if (e.evnum === 3016) return baul();
    if (e.evnum === 2213) return telefonoDial();
    if (e.evnum === 3) {
      await demo(50, {
        sinVuelta: true
      });
      prender(propia);
      cuarto.aplicarEstado();
      await mirilla.mirar("puerta", 75, PARTIDA);
      return;
    }
    if (e.evnum === 13) {
      await demo(55, {
        sinVuelta: true
      });
      await mirilla.mirar("agujero", 101, PARTIDA);
      prender(propia);
      return;
    }
    if (e.evnum === 7) return agujeroBano(e);
    if (e.evnum === 64) {
      amb?.ruidoCaja();
      prender(propia);
      return;
    }
    if (enPrologo() && !e.demo && e.evnum !== 65 && /^punto/.test(e.zona?.tipo || "") && PARTIDA.examenesPrologo < 5) {
      await decir([ textoRoom(347 + PARTIDA.examenesPrologo++) ]);
      return;
    }
    if (e.demo) {
      await demo(e.demo);
      prender(propia);
      return;
    }
    if (e.evnum === 65) {
      await decir([ textoRoom(0) || "Espeluznante... parece una cara." ]);
      prender(1503);
      await M.esperar(.5);
      await M.fundir(1, .6);
      await demo(47, {
        sinVuelta: true
      });
      M.ponerVelo(1);
      prender(1504);
      return {
        terminar: true,
        finPrologo: true
      };
    }
    const {textos: textos, imagenes: imagenes, pregunta: pregunta, preguntaEn: preguntaEn} = textosDe(e);
    const imgs = await Promise.all(imagenes.map(async a => a ? imagenJuego(a.replace(/\.bin$/, ""), 0, [ 0, 0, 512, 448 ]).catch(() => null) : null));
    if (pregunta) {
      const si = await decir(textos.slice(0, preguntaEn + 1), {
        pregunta: true,
        imagenes: imgs.slice(0, preguntaEn + 1)
      });
      if (!si) return;
      await decir(textos.slice(preguntaEn + 1), {
        imagenes: imgs.slice(preguntaEn + 1)
      });
    } else await decir(textos.length ? textos : [ juego.textoComun(23) ], {
      imagenes: imgs
    });
    if (e.items) PARTIDA.inventario.push(...e.items);
    if (e.zona?.id3 != null) {
      (PARTIDA.recogidos ||= []).push(claveRecogido(e));
      sacarItem(e);
    }
    prender(propia);
  }
  const RUIDO_DIA1 = {
    id: 50002,
    pos: [ [ 189.64, -240, 174.54 ], [ -87, -240, 45 ] ]
  };
  async function ruido(e) {
    await M.esperar(.5);
    const g = e.zona?.grupo_0x414 === 1 ? 1 : 0;
    const punto = aMundo(RUIDO_DIA1.pos[g]);
    try {
      son()?.efecto(RUIDO_DIA1.id, punto, {
        volumen: 1,
        radio: 4e3
      });
    } catch (err) {
      console.warn("ruido del día 1", err?.message || err);
    }
    await M.esperar(2.5);
    const vr = !!M.enVR?.();
    const fr = q.has("franjas") && !vr ? franjasRuido() : null;
    await (fr?.subir(1));
    await M.esperar(1);
    if (!vr) await girarVistaHacia(punto);
    await M.esperar(1);
    await decir([ textoRoom(32) ]);
    await (fr?.bajar(1));
    prender(banderaPropia(e));
  }
  async function girarVistaHacia(punto) {
    const cam = M.camara;
    if (!cam) return;
    cam.updateMatrixWorld?.();
    const ojo = new THREE.Vector3;
    cam.getWorldPosition(ojo);
    const d = (new THREE.Vector3).subVectors(punto, ojo);
    if (d.lengthSq() < 1e-6) return;
    const y0 = cam.rotation.y, x0 = cam.rotation.x;
    const y1 = Math.atan2(-d.x, -d.z), x1 = Math.atan2(d.y, Math.hypot(d.x, d.z));
    const dy = Math.atan2(Math.sin(y1 - y0), Math.cos(y1 - y0));
    const paso = 1 / 30;
    let t = 0;
    while (t < 1) {
      let k = paso;
      if (t >= .8) k = Math.max(1e-4, (1 - t) * paso * 5.00002);
      t = Math.min(1, t + k);
      if (t > .9995) t = 1;
      cam.rotation.y = y0 + dy * t;
      cam.rotation.x = x0 + (x1 - x0) * t;
      M.redibujar?.();
      await M.esperar(paso);
    }
  }
  function franjasRuido() {
    const cam = M.camara;
    if (!cam) return null;
    const gr = armarFranjas();
    aCamara(gr, cam.fov);
    cam.add(gr);
    const mats = [];
    gr.traverse(o => {
      if (o.material && !mats.includes(o.material)) mats.push(o.material);
    });
    for (const m of mats) {
      m.transparent = true;
      m.opacity = 0;
    }
    const rampa = async (de, a, seg) => {
      const n = Math.max(1, Math.round(seg * 30));
      for (let i = 1; i <= n; i++) {
        for (const m of mats) m.opacity = de + (a - de) * (i / n);
        M.redibujar?.();
        await M.esperar(1 / 30);
      }
    };
    return {
      subir: seg => rampa(0, 1, seg),
      async bajar(seg) {
        await rampa(1, 0, seg);
        gr.removeFromParent();
        gr.traverse(o => o.geometry?.dispose?.());
        for (const m of mats) m.dispose?.();
      }
    };
  }
  async function agujeroBano(e, {sinPregunta: sinPregunta = false} = {}) {
    const si = sinPregunta || await decir([ textoRoom(39) ], {
      pregunta: true
    });
    if (!si) return;
    prender(1516);
    await demo(53, {
      sinVuelta: true
    });
    return {
      terminar: true,
      aSubte: true
    };
  }
  async function guardar() {
    if (enPrologo()) return;
    son()?.efecto(40009, null, {
      volumen: 1
    });
    let img = null;
    try {
      img = await imagenJuego("snap_save", 0, [ 0, 0, 512, 448 ]);
    } catch {}
    const si = await decir([ textoRoom(344), juego.textoComun(251) ], {
      pregunta: true,
      imagenes: [ img, img ]
    });
    if (!si) return;
    const antes = {
      sala: PARTIDA.sala,
      pos: PARTIDA.pos,
      giro: PARTIDA.giro,
      guardadas: PARTIDA.guardadas
    };
    PARTIDA.guardadas = (PARTIDA.guardadas || 0) + 1;
    PARTIDA.sala = cuarto.sala?.nombre;
    PARTIDA.pos = M.jugador.position.toArray();
    PARTIDA.giro = M.camara.rotation.y;
    PARTIDA.nivel = PARTIDA.nivel || juego.nivel || null;
    const fase = juego.fase, mirar = M.control.mirarLibre;
    M.control.mirarLibre = false;
    M.control.soltar?.();
    const listo = await pantallaGuardado(juego, {
      modo: "guardar",
      partida: PARTIDA,
      checkpoint: dias.checkpoint?.() || null,
      nivel: PARTIDA.nivel
    });
    M.pantalla.ocultar();
    M.control.mirarLibre = mirar;
    juego.fase = fase;
    if (!listo) Object.assign(PARTIDA, antes);
  }
  juego.guardar = () => guardar();
  const son = () => amb?.son || null;
  const VOL_SALA = {
    1: 1,
    2: .4,
    3: .25,
    4: .5
  };
  const POS_RADIO = {
    1: [ 407.09, -240.43, -808.28 ],
    2: [ -10, -180, 60 ],
    3: [ -30, -180, -170 ],
    4: [ 50, -180, 10 ]
  };
  const NOTICIEROS = [ {
    id: 10050,
    textos: [ [ 372, 5.75 ], [ 373, 5 ], [ 374, 4.5 ], [ 375, 3.5 ], [ 376, 4 ] ]
  }, {
    id: 10049,
    textos: [ [ 380, 7.25 ], [ 381, 6.75 ] ]
  }, {
    id: 10053,
    textos: [ [ 382, 5.25 ], [ 383, 3.75 ] ]
  }, {
    id: 10051,
    textos: [ [ 387, 5.5 ], [ 388, 8 ] ]
  }, {
    id: 10047,
    textos: [ [ 389, 6 ], [ 390, 5.25 ], [ 391, 6 ] ]
  }, {
    id: 10048,
    textos: [ [ 392, 2.75 ], [ 393, 7.5 ] ]
  } ];
  let sonRadio = null, noticiero = null, ultimoNoticiero = -1, subsRadio = null;
  function sortearNoticiero() {
    if (noticiero || F(1600) || Math.random() >= .3) return;
    let k = Math.floor(Math.random() * 6);
    if (k === ultimoNoticiero) k = (k + 1) % 6;
    ultimoNoticiero = k;
    noticiero = NOTICIEROS[k];
  }
  function callar302() {
    sonRadio?.parar(.2);
    sonRadio = null;
    subsRadio?.parar();
    subsRadio = null;
    dias.pararAmbientes();
    amb?.pararAmbiente?.(.1);
  }
  function sonarRadio() {
    sonRadio?.parar(.2);
    sonRadio = null;
    subsRadio?.parar();
    subsRadio = null;
    if (!F(1600) || !son()) return;
    const esc = +cuarto.escena, v = VOL_SALA[esc] ?? 0;
    if (!v) return;
    if (noticiero) {
      sonRadio = son().efecto(noticiero.id, null, {
        volumen: v,
        loop: false
      });
      if (esc === 1) subsRadio = subtitulosRadio(noticiero.textos);
      noticiero = null;
    } else sonRadio = son().efecto(51711, esc === 1 ? aMundo(POS_RADIO[1]) : aMundo(POS_RADIO[esc]), {
      volumen: v,
      loop: true,
      radio: 4e3
    });
  }
  function subtitulosRadio(lista) {
    if (juego.opciones?.subtitulos === false) return null;
    let t = 0, i = 0, mostrado = -1;
    const tarea = dt => {
      if (juego.hablando || juego.demoActual) return;
      t += dt;
      while (i < lista.length && t > lista[i][1]) {
        t -= lista[i][1];
        i++;
      }
      if (i >= lista.length) {
        M.tareas.delete(tarea);
        mostrarSub("");
        return true;
      }
      if (i !== mostrado) {
        mostrado = i;
        mostrarSub(textoRoom(lista[i][0]));
        return true;
      }
    };
    M.tareas.add(tarea);
    return {
      parar() {
        if (M.tareas.delete(tarea)) mostrarSub("");
      }
    };
  }
  async function radioHistoria({id: id, textos: textos}) {
    sonRadio?.parar(.2);
    sonRadio = null;
    subsRadio?.parar();
    subsRadio = null;
    noticiero = null;
    PARTIDA.banderas[1600] = 1;
    cuarto.radioPrendida = true;
    const esc = +cuarto.escena, v = VOL_SALA[esc] ?? 0;
    if (v && son()) sonRadio = son().efecto(id, esc === 1 ? aMundo(POS_RADIO[1]) : null, {
      volumen: v,
      loop: false,
      radio: 4e3
    });
    if (esc === 1) subsRadio = subtitulosRadio(textos);
  }
  async function radio(prender_) {
    son()?.efecto(50006, aMundo(POS_RADIO[1]), {
      volumen: 1,
      radio: 4e3
    });
    if (!prender_) PARTIDA.caseteOido = false;
    PARTIDA.banderas[1600] = prender_ ? 1 : 0;
    cuarto.radioPrendida = prender_;
    sonarRadio();
    await M.esperar(.3);
  }
  const ITEM_CASETE = 76;
  const tieneItem = k => !!(PARTIDA.henry?.lugares?.some(([x, n]) => x === k && n > 0) || PARTIDA.henry?.notas?.includes(k) || (PARTIDA.inventario || []).slice(PARTIDA.inventarioVisto || 0).includes(k));
  const GUION_CASETE = [ [ null, 90 ], [ 132, 180 ], [ 133, 150 ], [ 134, 40 ], [ 135, 90 ], [ 136, 60 ], [ 137, 90 ], [ 138, 135 ], [ null, 360 ] ];
  async function casete() {
    await decir([ textoRoom(131) ]);
    sonRadio?.parar(.2);
    sonRadio = null;
    subsRadio?.parar();
    subsRadio = null;
    const cinta = son()?.efecto(20110, null, {
      volumen: 1,
      loop: false
    });
    const subs = juego.opciones?.subtitulos !== false;
    await new Promise(ok => {
      let i = 0, t = 0, mostrado = -1;
      const tarea = (dt, {acciones: acciones} = {}) => {
        if ((acciones || []).includes("cancelar")) i = GUION_CASETE.length;
        t += dt;
        while (i < GUION_CASETE.length && t > GUION_CASETE[i][1] / 30) {
          t -= GUION_CASETE[i][1] / 30;
          i++;
        }
        if (i >= GUION_CASETE.length) {
          M.tareas.delete(tarea);
          mostrarSub("");
          ok();
          return true;
        }
        if (i !== mostrado) {
          mostrado = i;
          mostrarSub(subs && GUION_CASETE[i][0] != null ? textoRoom(GUION_CASETE[i][0]) : "");
          return true;
        }
      };
      M.tareas.add(tarea);
    });
    cinta?.parar(.3);
    PARTIDA.caseteOido = true;
    sonarRadio();
  }
  juego.casete = () => casete();
  const CAJA_COCINA = (() => {
    const c = aMundo([ 810.47, -10.43, 520.2 ]), s = new THREE.Vector3(309, 95, 454).multiplyScalar(.005);
    const b = new THREE.Box3(c.clone().sub(s), c.clone().add(s));
    b.min.y -= 1;
    b.max.y += 3;
    return b;
  })();
  async function heladera(abrir) {
    await M.fundir(1, .27);
    son()?.efecto(abrir ? 5e4 : 50001, null, {
      volumen: 1
    });
    PARTIDA.heladera = abrir;
    cuarto.aplicarEstado();
    refrescar();
    await M.fundir(0, .27);
  }
  async function baul() {
    son()?.efecto(50708, null, {
      volumen: 1
    });
    const mirar = M.control.mirarLibre;
    M.control.mirarLibre = false;
    M.control.soltar?.();
    try {
      await abrirBaul({
        juego: juego,
        PARTIDA: PARTIDA,
        quitarItem: k => dias.quitarItem(k)
      });
    } catch (err) {
      console.warn("baúl", err);
      M.pantalla.ocultar();
    }
    M.control.mirarLibre = mirar;
    son()?.efecto(50709, null, {
      volumen: 1
    });
    prender(1607);
  }
  juego.baul = () => baul();
  const TEXTOS_ITEM = new Map;
  json("/datos/henry.json").then(h => {
    for (const t of h?.textos_item || []) TEXTOS_ITEM.set(t.item, t.nombre);
  });
  const nombreItem = n => TEXTOS_ITEM.get(n) ?? -1;
  const telefono = crearTelefono302({
    M: M,
    juego: juego,
    fuente: fuente,
    F: F,
    prender: prender,
    son: () => amb?.son || null,
    mostrarSub: mostrarSub,
    textoRoom: textoRoom
  });
  const telefonoDial = () => telefono.marcar();
  juego.telefono = telefonoDial;
  const vistaVentana = crearVentana({
    M: M,
    juego: juego,
    cuarto: cuarto,
    son: son,
    F: F,
    prender: prender,
    mostrarSub: mostrarSub,
    textoRoom: textoRoom
  });
  const ventana = e => vistaVentana.mirar(e);
  async function pausa() {
    const fase = juego.fase, mirar = M.control.mirarLibre;
    juego.fase = "pausa";
    M.control.mirarLibre = false;
    M.control.soltar();
    const tc0 = juego.textoComun, tc = n => n === "foto" ? textoSitio("foto.menu") : tc0(n);
    const filas = [ P.PAUSA.volver, P.PAUSA.opciones, ...juego.modoFoto ? [ "foto" ] : [], P.PAUSA.irTitulo ];
    const iOpciones = filas.indexOf(P.PAUSA.opciones), iFoto = filas.indexOf("foto"), iTitulo = filas.indexOf(P.PAUSA.irTitulo);
    let aFoto = false;
    const elegir = (n, pregunta = null) => new Promise(ok => {
      let el = 0, t = 0;
      const tarea = (dt, {acciones: acciones}) => {
        t += dt;
        for (const a of acciones) {
          if (a === "arriba" || a === "izq") el = (el + n - 1) % n;
          if (a === "abajo" || a === "der") el = (el + 1) % n;
          if (a === "cancelar" || a === "menu" && !pregunta) {
            M.tareas.delete(tarea);
            ok(-1);
            return true;
          }
          if (t > .2 && (a === "aceptar" || a === "accion" || a === "clic")) {
            M.tareas.delete(tarea);
            ok(el);
            return true;
          }
        }
        if (pregunta) P.dibujarPausa(M.pantalla.g, juego.I, fuente, tc, [ 0, 1 ], el, t, {
          pregunta: pregunta
        }); else P.dibujarPausa(M.pantalla.g, juego.I, fuente, tc, filas, el, t);
        M.pantalla.actualizar();
        return true;
      };
      M.tareas.add(tarea);
    });
    M.pantalla.mostrar();
    for (;;) {
      const r = await elegir(filas.length);
      if (r === iOpciones) {
        await (juego.abrirOpciones?.());
        juego.fase = "pausa";
        M.pantalla.mostrar();
        continue;
      }
      if (r === iFoto && iFoto >= 0) {
        aFoto = true;
        break;
      }
      if (r === iTitulo) {
        if (await elegir(2, tc(P.PAUSA.seguro)) !== 0) continue;
        const u = new URLSearchParams(location.search);
        u.set("ir", "titulo");
        u.set("auto", "");
        location.search = u.toString();
        return;
      }
      break;
    }
    M.pantalla.ocultar();
    M.control.mirarLibre = mirar;
    juego.fase = fase;
    if (aFoto) juego.modoFoto?.entrar();
  }
  juego.pausa = pausa;
  juego.gestoPausa = crearGestoPausa({
    M: M,
    activo: () => !!juego.libre && !juego.hablando && !juego.demoActual && (!juego.libre.ocupado || juego.fase === "pausa")
  });
  const claveRecogido = e => e.escena + "/" + e.indice + (e.mitad === 2 ? "/m2" : "");
  const recogido = e => !!PARTIDA.recogidos?.includes(claveRecogido(e));
  const MODELOS_ITEM = new Map;
  for (const a of [ "item_model.bin", "wp_model.bin", "item_model2.bin" ]) bajar("data/" + a).catch(() => {});
  const listosModelos = json("/datos/juego.json").then(j => {
    for (const f of j?.modelos_items?.filas || []) MODELOS_ITEM.set(f.id, f);
  });
  const QZ = (new THREE.Quaternion).setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI), EJE_Y = new THREE.Vector3(0, 1, 0);
  let itemsEnSala = [], vueltaItems = 0, itemsListos = Promise.resolve();
  const ITEMS_EN_DEMO = new Set([ 18 ]);
  async function ponerItems() {
    const n = ++vueltaItems;
    for (const it of itemsEnSala) {
      it.grupo.removeFromParent();
      it.pj?.dispose?.();
    }
    itemsEnSala = [];
    await listosModelos;
    const lista = EV.filter(e => String(e.escena) === escenaActual() && e.zona?.id3 != null && e.pos && cumple(e) && !recogido(e));
    await Promise.all(lista.map(async e => {
      const f = MODELOS_ITEM.get(e.zona.id3);
      if (!f?.modelo) return;
      try {
        const pj = await cuarto.crearModelo({
          arch: f.modelo.archivo,
          m: f.modelo.parte,
          tArch: f.texturas?.archivo,
          t: f.texturas?.parte
        });
        if (n !== vueltaItems || recogido(e)) {
          pj.dispose?.();
          return;
        }
        pj.grupo.position.copy(aMundo(e.pos));
        const qj = e.zona.quat ? new THREE.Quaternion(...e.zona.quat).normalize() : (new THREE.Quaternion).setFromAxisAngle(EJE_Y, e.zona.rot || 0);
        pj.grupo.children[0].quaternion.copy(QZ).multiply(qj);
        pj.grupo.name = "item " + f.item + " (" + e.escena + "/" + e.indice + ")";
        if (ITEMS_EN_DEMO.has(e.zona.id3)) pj.grupo.userData.enDemo = true;
        cuarto.grupo.add(pj.grupo);
        itemsEnSala.push({
          e: e,
          grupo: pj.grupo,
          pj: pj
        });
        M.redibujar();
      } catch (err) {
        console.warn("item", e.zona.id3, err.message);
      }
    }));
  }
  function sacarItem(e) {
    for (const it of itemsEnSala.filter(x => x.e === e)) {
      it.grupo.removeFromParent();
      it.pj?.dispose?.();
    }
    itemsEnSala = itemsEnSala.filter(x => x.e !== e);
    M.redibujar();
  }
  juego.items = () => itemsEnSala.map(x => x.grupo.name);
  cuarto.estado = {
    F: F,
    get heladera() {
      return !!PARTIDA.heladera;
    }
  };
  let puntos = [], cajas = [];
  const refrescar = () => {
    puntos = puntosDeSala();
    cajas = cajasDeSala();
    juego.puntos = puntos;
    itemsListos = ponerItems();
  };
  const esperarItems = () => Promise.race([ itemsListos.catch(() => {}), M.esperar(4) ]);
  juego.irA = async (nombre, posJuego, giro = null) => {
    await cuarto.cargar(nombre, {
      pos: aMundo(posJuego),
      giro: giro
    });
    alEntrarSala();
    refrescar();
  };
  juego.automaticos = () => automaticos();
  function alEntrarSala() {
    PARTIDA.heladera = false;
    cuarto.aplicarEstado();
    if (String(cuarto.escena) === "1") sortearNoticiero();
    cuarto.radioPrendida = F(1600);
    sonarRadio();
    dias.alEntrarSala();
  }
  cuarto.puertaUsable = p => pasoPuerta(p) !== "nada";
  function pasoPuerta(p) {
    const f = (p.funcion_paso || "").slice(0, 8);
    if (f === "0x4fcfa0") return (enPrologo() ? F(1502) : !(F(1569) && !F(1570))) ? null : "nada";
    if (f === "0x4fcfd0") return enPrologo() ? "trabada" : null;
    if (f === "0x4fd010") return F(1577) ? null : "nada";
    return null;
  }
  async function cambiarSala(puerta) {
    const base = E.salas[puerta.lleva_a_escena];
    const paso = pasoPuerta(puerta);
    if (paso === "trabada") {
      amb?.puerta(puerta, 4);
      await decir([ juego.textoComun(21) ]);
      return;
    }
    if (paso) return;
    amb?.puerta(puerta, "abrir");
    await M.fundir(1, .35);
    try {
      await cuarto.cargar(varianteDe(base), {
        porPuerta: puerta.door_no
      });
    } catch (e) {
      console.warn("puerta", puerta.door_no, e);
      estado("");
      await M.fundir(0, .35);
      return;
    }
    amb?.puerta(cuarto.puertas.find(p => p.door_no === puerta.door_no) || puerta, "cerrar");
    alEntrarSala();
    refrescar();
    await M.fundir(0, .35);
    await automaticos();
  }
  async function recargarSala() {
    const nombre = varianteDe(E.salas[cuarto.escena]);
    if (nombre !== cuarto.sala.nombre) {
      const pos = M.jugador.position.clone(), g = M.camara.rotation.y;
      await cuarto.cargar(nombre, {
        pos: pos,
        giro: g
      });
    } else cuarto.aplicarEstado();
    refrescar();
  }
  async function automaticos() {
    for (let k = 0; k < 4; k++) {
      const e = automaticosDeSala()[0];
      if (!e) break;
      if (e.evnum === 4) await ruido(e); else if (!e.demo && dias.esAutomatico(e)) await dias.auto(e); else {
        await esperarItems();
        await demo(e.demo);
        prender(banderaPropia(e));
      }
      await recargarSala();
    }
  }
  const conPista = q.has("pista");
  const pista = (() => {
    if (!conPista) return {
      actualizar: () => false,
      ocultar() {}
    };
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d");
    g.translate(32, 32);
    g.rotate(Math.PI / 4);
    g.strokeStyle = "rgba(236,227,210,0.85)";
    g.lineWidth = 4;
    g.strokeRect(-13, -13, 26, 26);
    g.fillStyle = "rgba(192,38,26,0.55)";
    g.fillRect(-7, -7, 14, 14);
    const tx = new THREE.CanvasTexture(c);
    tx.colorSpace = THREE.SRGBColorSpace;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({
      map: tx,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      toneMapped: false
    }));
    m.renderOrder = 70;
    m.visible = false;
    m.frustumCulled = false;
    M.camara.add(m);
    let t = 0;
    return {
      actualizar(dt, hay) {
        t += dt;
        const d = M.enVR() ? 1.2 : 1, s = .03 * d;
        m.scale.setScalar(s * (1 + .08 * Math.sin(t * 4)));
        m.position.set(0, 0, -d);
        if (m.visible !== hay) {
          m.visible = hay;
          return true;
        }
        return hay;
      },
      ocultar() {
        m.visible = false;
      }
    };
  })();
  const mira = crearMira({
    M: M,
    juego: juego,
    fuente: fuente,
    tactil: M.tactil
  });
  const NOMBRE_SALA = juego.IDIOMA !== "s" ? {
    1: "Living room",
    2: "Bedroom",
    3: "Bathroom",
    4: "Laundry room",
    5: "Secret room"
  } : {
    1: "Sala",
    2: "Dormitorio",
    3: "Baño",
    4: "Lavadero",
    5: "Habitación secreta"
  };
  const infoMira = {
    nombreSala: n => NOMBRE_SALA[n] || null,
    itemDe: e => e.items?.[0] ?? MODELOS_ITEM.get(e.zona?.id3)?.item ?? null,
    nombreItem: (k, e) => {
      for (const m of e?.mensajes || []) {
        const r = /[ÿ÷]([^|ÿ÷ö]+?)\.?(\||$)/.exec(m.texto || "");
        if (r) return r[1].trim();
      }
      return (textoItem(nombreItem(k)) || "").replace(/[|ÿöþ÷]/g, " ").replace(/\s+/g, " ").trim() || null;
    }
  };
  juego.mira = mira;
  function eventoDeItem(k) {
    const lista = EV.filter(e => String(e.escena) === escenaActual() && e.zona?.dmy13 === k && cumple(e));
    if (!lista.length) return null;
    const pie = M.camara.getWorldPosition(new THREE.Vector3);
    const puntos_ = lista.filter(e => e.pos && !e.zona?.caja).map(e => ({
      e: e,
      pos: aMundo(e.pos)
    }));
    const a = puntos_.length ? cuarto.apuntado(puntos_, {
      conPuertas: false,
      alcance: 2.6
    }) : null;
    if (a) return a.p.e;
    for (const p of puntos_) if (Math.hypot(p.pos.x - pie.x, p.pos.z - pie.z) < 1.3) return p.e;
    for (const e of lista) {
      if (!e.pos || !e.zona?.caja) continue;
      const c = e.zona.caja, lo = aMundo([ e.pos[0] - c[0], e.pos[1] - c[1], e.pos[2] - c[2] ]), hi = aMundo([ e.pos[0] + c[0], e.pos[1] + c[1], e.pos[2] + c[2] ]);
      const caja = (new THREE.Box3).setFromPoints([ lo, hi ]);
      caja.min.y -= .5;
      caja.max.y += 2.5;
      if (caja.containsPoint(pie)) return e;
    }
    return lista.find(e => !e.pos) || null;
  }
  const inv302 = await crearInventario302({
    THREE: THREE,
    M: M,
    juego: juego,
    PARTIDA: PARTIDA,
    quitarItem: k => dias.quitarItem(k),
    eventoDeItem: eventoDeItem,
    usarEvento: (e, k, f) => juego.libre?.correrEvento?.(e, f),
    hauntings: () => dias.hauntings
  }).catch(err => {
    console.warn("inventario del 302", err);
    return null;
  });
  juego.inventario302 = inv302;
  function jugarLibre({terminarCon: terminarCon = () => null} = {}) {
    M.control.mirarLibre = true;
    refrescar();
    return new Promise(ok => {
      let ocupado = false, tPista = 1, hayAlgo = false, apuntadoAhora = null;
      juego.libre = {
        get ocupado() {
          return ocupado;
        },
        correrEvento: (e, f) => correr(f || (() => e?.evnum === 138 ? casete() : evento(e)))
      };
      const tarea = (dt, entrada) => {
        const libreAhora = !(ocupado || juego.hablando || juego.demoActual);
        if (inv302?.cuadro(dt, entrada, libreAhora)) {
          pista.ocultar();
          mira.ocultar();
          return true;
        }
        if (!libreAhora) {
          pista.ocultar();
          return mira.ocultar();
        }
        const movio = cuarto.actualizar(dt, entrada);
        if ((tPista += dt) > .1 || movio) {
          tPista = 0;
          apuntadoAhora = cuarto.apuntado(puntos);
          hayAlgo = !!apuntadoAhora;
        }
        const cambioPista = pista.actualizar(dt, hayAlgo) | mira.actualizar(dt, apuntadoAhora, infoMira);
        const pie = M.camara.getWorldPosition(new THREE.Vector3);
        for (const c of cajas) if (c.caja.containsPoint(pie)) {
          correr(() => evento(c.e));
          return true;
        }
        if (PARTIDA.heladera && String(cuarto.escena) === "1" && !CAJA_COCINA.containsPoint(pie)) {
          correr(() => heladera(false));
          return true;
        }
        for (const a of entrada.acciones) {
          if (a === "menu") {
            correr(pausa);
            break;
          }
          if (a === "accion" || a === "aceptar" || a === "clic" && (M.tactil || M.control.capturado)) {
            correr(accionar);
            break;
          }
          if (a === "clic" && !M.enVR() && !M.tactil) M.control.capturar();
        }
        return movio || cambioPista;
      };
      async function correr(f) {
        ocupado = true;
        try {
          const r = await f();
          if (r?.terminar) {
            terminar(r);
            return;
          }
        } catch (err) {
          console.error(err);
        } finally {
          ocupado = false;
        }
        const fin = terminarCon();
        if (fin) terminar(fin);
      }
      async function evento(e) {
        const r = await ejecutar(e);
        if (r?.terminar) return r;
        await recargarSala();
        await automaticos();
        return r;
      }
      async function accionar() {
        const a = cuarto.apuntado(puntos);
        juego.ultimoApuntado = a ? (a.tipo === "puerta" ? "puerta " + a.puerta.door_no : "ev " + a.p.e.escena + "/" + a.p.e.indice) + " (" + a.rayo + ", " + a.distancia.toFixed(2) + " m)" : null;
        if (a?.tipo === "punto") return evento(a.p.e);
        if (a?.tipo === "puerta") return cambiarSala(a.puerta);
      }
      juego.accionar = () => correr(accionar);
      function terminar(r) {
        M.tareas.delete(tarea);
        pista.ocultar();
        mira.ocultar();
        M.control.mirarLibre = false;
        juego.libre = null;
        ok(r);
      }
      M.tareas.add(tarea);
    });
  }
  async function prologo() {
    juego.fase = "prologo";
    M.pantalla.ocultar();
    M.ponerVelo(1);
    await cuarto.cargar("rl01d", {
      pos: aMundo([ 416.97, 0, -334.6 ]),
      giro: giroDeAngulo(-1.371)
    });
    const r = await demo(45, {
      subCentro: true
    });
    prender(1501);
    if (r && !r.saltada) {
      const c = r.D.muestrear(r.D.sqt.n - 1, false).cam;
      if (c) {
        const qc = new THREE.Quaternion(0, 0, 1, 0).multiply(new THREE.Quaternion(...c.rot)).multiply(new THREE.Quaternion(1, 0, 0, 0));
        const f = new THREE.Vector3(0, 0, -1).applyQuaternion(qc);
        cuarto.ponerEn(aMundo([ c.pos[0], 0, c.pos[2] ]), Math.atan2(-f.x, -f.z));
        if (!M.enVR()) M.camara.position.set(0, OJOS, 0);
      }
    }
    await M.fundir(0, .8);
    juego.fase = "prologo libre";
    const creditos = q.has("creditos") ? iniciarCreditos() : {
      parar() {}
    };
    await automaticos();
    await jugarLibre({
      terminarCon: () => F(1504) ? {
        fin: true
      } : null
    });
    creditos.parar();
    if (q.has("videos")) await video(1, 61); else {
      juego.fase = "prologo recorrido";
      M.ponerVelo(1);
      try {
        await cuarto.cargar(varianteDe("rl00"), {
          pos: aMundo([ 463, 0, 145 ])
        });
        await demo(48, {
          sinVuelta: true
        });
      } catch (err) {
        console.warn("recorrido d_048", err);
      }
    }
    juego.fase = "prologo despertar";
    prender(1505);
    M.ponerVelo(1);
    await cuarto.cargar(varianteDe("rl01"), {
      pos: aMundo([ 276.03, 0, -423.77 ]),
      giro: giroDeAngulo(-.73)
    });
    await demo(74);
    cuarto.ponerEn(aMundo([ 276.03, 0, -423.77 ]), giroDeAngulo(-.73));
    if (!M.enVR()) M.camara.position.set(0, OJOS, 0);
    cuarto.desatascar();
    prender(1506);
    await M.fundir(0, .8);
  }
  function iniciarCreditos() {
    const capa = M.crearCapa("centro");
    const lista = [ 1, 2, 3, 4, 5, 6, 7, 8, 9 ];
    const cada = 8, dura = 6, desde = 3;
    let t = 0, ultimo = null;
    const tarea = dt => {
      if (juego.hablando || juego.demoActual) {
        capa.ocultar();
        ultimo = null;
        return;
      }
      t += dt;
      const k = Math.floor((t - desde) / cada), dentro = t - desde - k * cada;
      const n = k >= 0 && k < lista.length && dentro < dura ? lista[k] : null;
      const a = n == null ? 0 : Math.max(0, Math.min(1, dentro / 1.2, (dura - dentro) / 1.2));
      const clave = n + ":" + a.toFixed(2);
      if (clave === ultimo) return;
      ultimo = clave;
      capa.g.clearRect(0, 0, capa.lienzo.width, capa.lienzo.height);
      if (n != null) {
        const lineas = textoRoom(n).split("\n");
        lineas.forEach((l, i) => fuente.escribir(capa.g, l, 320, 52 + i * 26 - (lineas.length - 1) * 13, {
          escala: P.ESC,
          alinear: "centro",
          alfa: a,
          color: i === 0 && lineas.length > 1 ? "#a99f92" : "#f2ece0"
        }));
        capa.mostrar();
      } else capa.ocultar();
      return true;
    };
    M.tareas.add(tarea);
    return {
      parar() {
        M.tareas.delete(tarea);
        capa.ocultar();
      }
    };
  }
  if (modo === "nueva" || modo === "prologo") await prologo(); else if (modo === "cargar" && PARTIDA.sala) {
    await cuarto.cargar(PARTIDA.sala, {
      pos: (new THREE.Vector3).fromArray(PARTIDA.pos),
      giro: PARTIDA.giro
    });
    alEntrarSala();
  } else {
    for (const b of [ 1501, 1502, 1503, 1504, 1505, 1506, ...BANDERAS_DIA1_SUPUESTAS ]) prender(b);
    await cuarto.cargar(varianteDe("rl01"), {
      pos: aMundo([ 276.03, 0, -423.77 ]),
      giro: giroDeAngulo(-.73)
    });
    cuarto.desatascar();
    alEntrarSala();
  }
  M.pantalla.ocultar();
  M.ponerVelo(0);
  juego.fase = "302";
  estado("");
  await dias.arranquePrueba();
  await automaticos();
  const r = q.has("mundo") ? {
    aSubte: true
  } : await jugarLibre();
  if (r?.aSubte) {
    juego.fase = "al Subte";
    const {seguirEnLosMundos: seguirEnLosMundos} = await (import("./mundos.js"));
    const {MUNDOS: MUNDOS} = await (import("./subte.js"));
    for (const [et, cfg] of Object.entries(MUNDOS)) {
      if (!cfg || cfg.__cartelUnaVez) continue;
      const original = cfg.nombre;
      Object.defineProperty(cfg, "nombre", {
        configurable: true,
        enumerable: true,
        get() {
          const PA = juego.partida || PARTIDA;
          const clave = et + (PA.banderas?.[1130] ? "2" : "1");
          const vistos = PA.cartelesMundo ||= [];
          if (vistos.includes(clave)) return null;
          vistos.push(clave);
          return original;
        }
      });
      Object.defineProperty(cfg, "__cartelUnaVez", {
        value: true
      });
    }
    await seguirEnLosMundos(juego, dias.envolverCtx({
      jugarLibre: jugarLibre,
      demo: demo,
      varianteDe: varianteDe,
      prender: prender,
      F: F,
      PARTIDA: PARTIDA,
      cuarto: cuarto,
      giroDeAngulo: giroDeAngulo,
      alEntrarSala: alEntrarSala,
      refrescar: refrescar,
      automaticos: automaticos,
      callar302: callar302
    }));
  }
}
