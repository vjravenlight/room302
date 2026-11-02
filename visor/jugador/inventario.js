// SH4 web — FeniXVOID · Project Ravenlight
import { imagenJuego } from "../suite_juego.js";

import { leerMensajes, PARTE_COMUN } from "../lib/subtitulos.js";

import { idiomaActual, t } from "../textos_sitio.js";

import { ITEM, municionPorDefecto } from "./datos.js";

export const LUGARES = 10;

export const TEXTO_COMUN = {
  usarEquipar: 151,
  info: 152,
  volver: 174,
  noSePuede: 25,
  noPuedoLlevar: 17,
  nada: 211,
  decidir: 173
};

const POR_DEFECTO = {
  151: "Usar/Equipar Objeto",
  152: "Info Objeto",
  174: "Volver",
  25: "Esto no lo puedo usar aquí.",
  17: "Ya no puedo llevar más...",
  211: "No tienes nada.",
  173: "Decidir"
};

let comunes = null;

function cargarComunes(idioma = "s") {
  if (!comunes) {
    comunes = fetch("/juego/data/message_common_eu.bin").then(r => r.ok ? r.arrayBuffer() : null).then(b => b ? leerMensajes(b) : null).catch(() => null);
  }
  return comunes.then(m => m ? m[PARTE_COMUN[idioma] ?? 5] || m[PARTE_COMUN.b] || null : null);
}

export function crearInventario({datos: datos, controlador: controlador, armas: armas, contenedor: contenedor = document.body, teclasAbrir: teclasAbrir = [ "Tab", "KeyI" ], THREE: THREE = null, alUsar: alUsar = null}) {
  const lugares = [];
  const notas = [];
  let alUsarF = alUsar;
  const cambios = [];
  const avisar = () => {
    for (const f of cambios) try {
      f();
    } catch {}
  };
  const apilable = k => k >= 1 && k <= 11;
  let tc = null;
  const texto = n => tc?.[n] || POR_DEFECTO[n] || "";
  cargarComunes(idiomaActual()).then(t => {
    tc = t;
    pintarBotones();
    avisar();
  });
  function agregar(k, n = 1) {
    if (datos.atributo(k) === "nota") {
      if (!notas.includes(k)) notas.push(k);
      avisar();
      return true;
    }
    const ya = lugares.find(l => l.k === k);
    if (ya && apilable(k)) {
      ya.n += n;
      avisar();
      return true;
    }
    if (lugares.length >= LUGARES) return false;
    const dur = datos.durabilidad(k)?.inicial ?? 100;
    lugares.push({
      k: k,
      n: apilable(k) ? n : 1,
      dur: dur
    });
    if (esFuego(k) && controlador.s.cargador && controlador.s.cargador[k] == null) controlador.s.cargador[k] = capacidad(k);
    avisar();
    return true;
  }
  function quitar(k, n = 1) {
    const i = lugares.findIndex(l => l.k === k);
    if (i < 0) return false;
    lugares[i].n -= n;
    if (lugares[i].n <= 0) lugares.splice(i, 1);
    if (sel >= lugares.length) sel = Math.max(0, Math.min(sel, lugares.length - 1));
    avisar();
    return true;
  }
  const cuantos = k => lugares.find(l => l.k === k)?.n || 0;
  async function equipar(k) {
    controlador.s.arma = k || 0;
    controlador.s.balas = esFuego(k) ? controlador.s.cargador?.[k] ?? 0 : 0;
    await armas.equipar(k);
    avisar();
  }
  function esFuego(k) {
    return k === ITEM.PISTOLA || k === ITEM.REVOLVER;
  }
  function capacidad(k) {
    return municionPorDefecto(k, controlador.s.nivel ?? 2, datos.juego?.use_item_default?.filas);
  }
  const cargadas = k => controlador.s.cargador?.[k] ?? 0;
  function cargar(arma, b, hasta) {
    const c = controlador.s.cargador, falta = Math.max(0, hasta - (c[arma] || 0)), n = Math.min(falta, cuantos(b));
    if (n <= 0) return 0;
    quitar(b, n);
    c[arma] = (c[arma] || 0) + n;
    if (controlador.s.arma === arma) controlador.s.balas = c[arma];
    avisar();
    return n;
  }
  function descargarPistola() {
    const c = controlador.s.cargador, n = c[ITEM.PISTOLA] || 0;
    if (n > 0 && !agregar(controlador.s.bala, n)) return false;
    c[ITEM.PISTOLA] = 0;
    return true;
  }
  function recargar(arma) {
    if (arma === ITEM.REVOLVER) return cargar(arma, ITEM.BALAS_REVOLVER, capacidad(arma)) > 0;
    if (arma !== ITEM.PISTOLA) return false;
    const s = controlador.s;
    if (s.bala === ITEM.BALAS_PLATA) {
      if (cuantos(ITEM.BALAS_PLATA)) return cargar(arma, ITEM.BALAS_PLATA, cargadas(arma) + cuantos(ITEM.BALAS_PLATA)) > 0;
      if (!cuantos(ITEM.BALAS_PISTOLA) || !descargarPistola()) return false;
      s.bala = ITEM.BALAS_PISTOLA;
    }
    return cargar(arma, ITEM.BALAS_PISTOLA, capacidad(arma)) > 0;
  }
  controlador.ponerRecarga?.(recargar);
  function usarBalas(b) {
    const s = controlador.s;
    const arma = b === ITEM.BALAS_REVOLVER ? ITEM.REVOLVER : ITEM.PISTOLA;
    if (!cuantos(arma)) return "nada";
    let n = 0;
    if (arma === ITEM.PISTOLA && b !== s.bala) {
      if (!descargarPistola()) return "nada";
      s.bala = b;
      n = cargar(arma, b, b === ITEM.BALAS_PLATA ? cuantos(b) : capacidad(arma));
    } else n = cargar(arma, b, b === ITEM.BALAS_PLATA ? cargadas(arma) + cuantos(b) : capacidad(arma));
    if (!n) return "nada";
    if (s.arma === arma) {
      s.balas = cargadas(arma);
      if (abierto) pedirRecargaAlCerrar = true; else controlador.recargarDesdeMenu?.();
    }
    return "usado";
  }
  let pedirRecargaAlCerrar = false;
  const balasDe = k => k === ITEM.PISTOLA ? ITEM.BALAS_PISTOLA : k === ITEM.REVOLVER ? ITEM.BALAS_REVOLVER : 0;
  controlador.ponerMunicion(k => cargadas(k));
  armas && controlador.alGastarArma((k, como) => {
    if (balasDe(k)) {
      avisar();
      return;
    }
    const d = datos.durabilidad(k);
    if (!d) return;
    const l = lugares.find(x => x.k === k);
    if (!l) return;
    l.dur -= d.perdida_por_golpe;
    if (l.dur <= 0) {
      l.k = k + 1;
      l.dur = 0;
      mensaje(datos.mensaje(62) || "Está roto...");
      equipar(l.k);
    }
    avisar();
  });
  function usar(k) {
    const at = datos.atributo(k);
    if (at === "curación") {
      if (controlador.usarCuracion(k)) quitar(k);
      return "usado";
    }
    if (at === "arma") {
      equipar(controlador.s.arma === k ? 0 : k);
      return controlador.s.arma ? "equipado" : "guardado";
    }
    if (at === "munición") return usarBalas(k);
    return "nada";
  }
  let abierto = false, sel = 0, info = false;
  const alAbrir = [];
  function mover(d) {
    if (info) return;
    sel = (sel + LUGARES + d) % LUGARES;
    dibujar();
    avisar();
  }
  function usarSeleccionado() {
    const l = lugares[sel];
    if (!l) {
      mensaje(texto(TEXTO_COMUN.nada));
      return "nada";
    }
    if (alUsarF) {
      let r0 = null;
      try {
        r0 = alUsarF(l.k);
      } catch (e) {
        console.warn("usar", e);
      }
      if (r0) {
        if (r0 === "nada") mensaje(texto(TEXTO_COMUN.noSePuede));
        dibujar();
        avisar();
        return r0;
      }
    }
    const r = usar(l.k);
    if (r === "nada") mensaje(texto(TEXTO_COMUN.noSePuede));
    dibujar();
    avisar();
    return r;
  }
  function alternarInfo(si = !info) {
    info = !!si && !!lugares[sel];
    dibujar();
    verInfo();
    avisar();
    return info;
  }
  function volver() {
    if (info) alternarInfo(false); else cerrar();
  }
  const raiz = document.createElement("div");
  raiz.id = "shInventario";
  raiz.innerHTML = `<style>\n#shInventario{position:fixed;left:0;right:0;bottom:0;height:42vh;min-height:250px;z-index:80;display:none;color:#d6cdbd;\n  font:16px/1.35 'Cormorant Garamond',Garamond,Georgia,serif;background:linear-gradient(180deg,rgba(0,0,0,0) 0,rgba(4,3,3,.88) 16%,rgba(4,3,3,.96));\n  user-select:none}\n#shInventario.abierto{display:block}\n#shInventario .tira{position:absolute;left:0;right:0;top:18%;height:42%;display:flex;justify-content:center;align-items:center;gap:1.2vw}\n#shInventario .lugar{width:9vh;height:9vh;min-width:56px;min-height:56px;opacity:.45;transition:transform .15s,opacity .15s;position:relative;\n  filter:sepia(.25) brightness(.8)}\n#shInventario .lugar canvas{width:100%;height:100%;image-rendering:auto}\n#shInventario .lugar.vacio{border:1px solid rgba(122,59,30,.25)}\n#shInventario .lugar.sel{opacity:1;transform:scale(1.55);filter:none;z-index:2}\n#shInventario .lugar .n{position:absolute;right:-2px;bottom:-4px;font-size:12px;color:#ece3d2;text-shadow:0 0 3px #000}\n#shInventario .lugar.eq::after{content:'';position:absolute;left:10%;right:10%;bottom:-8px;height:2px;background:#c0261a;box-shadow:0 0 6px #c0261a}\n#shInventario .texto{position:absolute;left:8%;right:8%;bottom:6%;height:30%;display:grid;grid-template-columns:1fr auto;gap:12px}\n#shInventario .nombre{color:#ece3d2;font-size:20px;letter-spacing:.06em}\n#shInventario .info{color:#8f857a;white-space:pre-line;font-size:15px}\n#shInventario .vida{width:150px;align-self:start;text-align:right;font-size:12px;letter-spacing:.2em;color:#8f857a}\n#shInventario .barra{height:8px;margin-top:4px;background:rgba(122,59,30,.25);border:1px solid rgba(122,59,30,.45)}\n#shInventario .barra i{display:block;height:100%;background:linear-gradient(90deg,#5a0d08,#c0261a)}\n#shInventario .durab{margin-top:8px}\n#shInventario .ayuda{position:absolute;right:2%;top:4%;font-size:12px;color:#5f574f;letter-spacing:.1em}\n#shInventario .cerrar{position:absolute;right:2%;top:12%;width:44px;height:44px;border-radius:50%;font-size:24px;line-height:1;color:#ece3d2;\n  background:rgba(10,7,6,.6);border:1px solid rgba(122,59,30,.7);cursor:pointer}\n#shInventario .lugar{cursor:pointer}\n#shInventario .msj{position:absolute;left:0;right:0;top:4%;text-align:center;color:#ece3d2;font-size:17px;min-height:1em}\n#shInventario .comandos{position:absolute;left:2%;top:4%;display:flex;gap:8px}\n#shInventario .comandos button{min-height:40px;padding:0 14px;border-radius:20px;font:14px 'Cormorant Garamond',Georgia,serif;letter-spacing:.06em;\n  color:#ece3d2;background:rgba(10,7,6,.6);border:1px solid rgba(122,59,30,.7);cursor:pointer;touch-action:manipulation}\n#shInventario .comandos button.si{background:rgba(140,26,18,.55)}\n#shInventario .examinar{position:absolute;left:8%;right:8%;bottom:calc(100% + 8px);display:none;grid-template-columns:auto 1fr;gap:16px;align-items:center;\n  padding:12px 16px;background:rgba(4,3,3,.92);border:1px solid rgba(122,59,30,.55)}\n#shInventario.coninfo .examinar{display:grid}\n#shInventario .examinar canvas{width:min(30vh,220px);height:min(30vh,220px)}\n#shInventario .examinar .txt{white-space:pre-line;color:#d6cdbd;font-size:17px}\n#shInventario .examinar .txt b{display:block;color:#ece3d2;font-weight:normal;font-size:21px;letter-spacing:.06em;margin-bottom:6px}\n@media (max-width:640px){#shInventario .ayuda{display:none}#shInventario .examinar{left:3%;right:3%;grid-template-columns:1fr;justify-items:center}\n  /* celular vertical: los 10 lugares no entran en una fila (se cortaban los primeros): dos filas de 5, del tamaño de un dedo */\n  #shInventario{height:56vh}\n  #shInventario .tira{flex-wrap:wrap;align-content:center;top:15%;height:50%;gap:2vw 3vw;padding:0 4vw}\n  #shInventario .lugar{min-width:0;min-height:0;width:15vw;height:15vw}\n  #shInventario .lugar.sel{transform:scale(1.2)}\n  #shInventario .texto{height:26%;bottom:3%}\n  /* Info Objeto arriba del inventario: que entre en lo que queda de pantalla */\n  #shInventario .examinar{max-height:calc(44vh - 14px);overflow:hidden;gap:6px;padding:8px 12px}\n  #shInventario .examinar canvas{width:min(24vh,190px);height:min(24vh,190px)}\n  #shInventario .examinar .txt{font-size:15px}#shInventario .examinar .txt b{font-size:18px}}\n</style>\n<div class="msj"></div><div class="ayuda">${t("inv.ayuda")}</div>\n<div class="comandos"><button data-c="usar"></button><button data-c="info"></button></div>\n<button class="cerrar" aria-label="${t("inv.cerrar")}">×</button>\n<div class="examinar"><canvas width="440" height="440"></canvas><div class="txt"></div></div>\n<div class="tira"></div>\n<div class="texto"><div><div class="nombre"></div><div class="info"></div></div>\n<div class="vida">${t("inv.vida")}<div class="barra"><i></i></div><div class="durab"></div></div></div>`;
  contenedor.appendChild(raiz);
  const $ = c => raiz.querySelector(c);
  function pintarBotones() {
    $("[data-c=usar]").textContent = texto(TEXTO_COMUN.usarEquipar).toUpperCase();
    $("[data-c=info]").textContent = texto(TEXTO_COMUN.info).toUpperCase();
  }
  pintarBotones();
  $("[data-c=usar]").addEventListener("click", e => {
    e.stopPropagation();
    usarSeleccionado();
  });
  $("[data-c=info]").addEventListener("click", e => {
    e.stopPropagation();
    alternarInfo();
  });
  const iconos = new Map;
  async function icono(k) {
    if (iconos.has(k)) return iconos.get(k);
    const p = (async () => {
      const ic = datos.icono(k);
      if (!ic || ic.celda === 255) return null;
      const c = ic.celda, x = c % 5 * 96, y = Math.floor(c / 5) * 96;
      try {
        const dib = await imagenJuego("item_l", ic.imagen, [ x, y, 84, 96 ], {
          escalaX: 1
        });
        const c = document.createElement("canvas");
        c.width = c.height = 96;
        c.getContext("2d").drawImage(dib, 6, 0);
        return c;
      } catch {
        return null;
      }
    })();
    iconos.set(k, p);
    return p;
  }
  const suelto = document.createElement("div");
  suelto.style.cssText = "position:fixed;left:0;right:0;bottom:12vh;z-index:79;text-align:center;pointer-events:none;color:#ece3d2;" + "font:18px 'Cormorant Garamond',Garamond,Georgia,serif;letter-spacing:.06em;text-shadow:0 0 6px #000,0 0 2px #000;transition:opacity .6s;opacity:0";
  contenedor.appendChild(suelto);
  let ultimoMensaje = {
    t: "",
    hasta: 0
  };
  function mensaje(t) {
    const el = abierto ? $(".msj") : suelto;
    el.textContent = t || "";
    el.style.opacity = 1;
    ultimoMensaje = {
      t: t || "",
      hasta: performance.now() + 2500
    };
    clearTimeout(mensaje.tm);
    mensaje.tm = setTimeout(() => {
      $(".msj").textContent = "";
      suelto.style.opacity = 0;
    }, 2500);
    for (const f of alMensaje) try {
      f(t);
    } catch {}
  }
  const alMensaje = [];
  const descripcion = k => datos.infoItem(k).split("\n").slice(1).join("\n").trim() || datos.infoItem(k);
  async function dibujar() {
    if (!abierto) return;
    const tira = $(".tira");
    tira.innerHTML = "";
    for (let i = 0; i < LUGARES; i++) {
      const l = lugares[i], d = document.createElement("div");
      d.className = "lugar" + (l ? "" : " vacio") + (i === sel ? " sel" : "") + (l && l.k === controlador.s.arma ? " eq" : "");
      if (l) {
        icono(l.k).then(c => {
          if (c) {
            const cc = document.createElement("canvas");
            cc.width = c.width;
            cc.height = c.height;
            cc.getContext("2d").drawImage(c, 0, 0);
            d.prepend(cc);
          }
        });
        if (l.n > 1 || datos.atributo(l.k) === "munición") {
          const n = document.createElement("span");
          n.className = "n";
          n.textContent = l.n;
          d.appendChild(n);
        } else if (esFuego(l.k)) {
          const n = document.createElement("span");
          n.className = "n";
          n.textContent = cargadas(l.k);
          if (l.k === ITEM.PISTOLA && controlador.s.bala === ITEM.BALAS_PLATA) n.style.color = "#c9d6e3";
          d.appendChild(n);
        }
      }
      d.addEventListener("click", () => {
        if (sel !== i) {
          sel = i;
          if (info) {
            info = !!lugares[sel];
            verInfo();
          }
          dibujar();
          avisar();
          return;
        }
        usarSeleccionado();
      });
      tira.appendChild(d);
    }
    const l = lugares[sel];
    $(".nombre").textContent = l ? datos.nombreItem(l.k) : "";
    $(".info").textContent = l ? descripcion(l.k) : "";
    $(".vida .barra i").style.width = Math.max(0, controlador.s.vida / controlador.s.vidaMax * 100) + "%";
    const dd = l && datos.durabilidad(l.k);
    $(".durab").innerHTML = dd ? `${t("inv.estado")}<div class="barra"><i style="width:${Math.max(0, l.dur)}%"></i></div>` : "";
    raiz.classList.toggle("coninfo", info);
    $("[data-c=info]").classList.toggle("si", info);
    if (info && l) {
      const tx = $(".examinar .txt");
      tx.innerHTML = "<b></b>";
      tx.firstChild.textContent = datos.nombreItem(l.k);
      tx.append(descripcion(l.k));
    }
  }
  let vistaInfo = null;
  async function verInfo() {
    if (!info || !abierto || !THREE) {
      vistaInfo?.parar();
      return;
    }
    const l = lugares[sel];
    if (!l) return;
    if (!vistaInfo) {
      const {crearModelosItem: crearModelosItem} = await (import("./modelo_item.js"));
      const lienzo = $(".examinar canvas");
      let r;
      try {
        r = new THREE.WebGLRenderer({
          canvas: lienzo,
          antialias: true,
          alpha: true
        });
      } catch {
        vistaInfo = {
          parar() {},
          poner() {}
        };
        return;
      }
      r.outputColorSpace = THREE.SRGBColorSpace;
      r.setPixelRatio(1);
      r.setSize(440, 440, false);
      const esc = new THREE.Scene;
      esc.add(new THREE.AmbientLight(16777215, 1.6));
      const dl = new THREE.DirectionalLight(16777215, 1.4);
      dl.position.set(1, 2, 3);
      esc.add(dl);
      const cam = new THREE.PerspectiveCamera(30, 1, .05, 20);
      cam.position.set(0, .15, 2.4);
      cam.lookAt(0, 0, 0);
      const modelos = crearModelosItem({
        THREE: THREE,
        datos: datos
      });
      let actual = null, kActual = null, anim = 0, t0 = performance.now();
      const bucle = () => {
        anim = requestAnimationFrame(bucle);
        const t = (performance.now() - t0) / 1e3;
        if (actual) {
          actual.rotation.y = t * .8;
          actual.rotation.x = Math.sin(t * .5) * .25;
        }
        r.render(esc, cam);
      };
      vistaInfo = {
        async poner(k) {
          if (k === kActual) return;
          kActual = k;
          if (actual) {
            esc.remove(actual);
            actual.userData.pj?.dispose?.();
          }
          actual = null;
          const m = await modelos.modelo(k);
          if (kActual !== k || !m) {
            m?.userData.pj?.dispose?.();
            return;
          }
          actual = m;
          esc.add(m);
        },
        parar() {
          cancelAnimationFrame(anim);
          anim = 0;
        },
        seguir() {
          if (!anim) {
            t0 = performance.now();
            bucle();
          }
        }
      };
    }
    vistaInfo.seguir?.();
    vistaInfo.poner(l.k);
  }
  function abrir() {
    abierto = true;
    raiz.classList.add("abierto");
    sel = Math.min(sel, Math.max(0, lugares.length - 1));
    info = false;
    dibujar();
    verInfo();
    for (const f of alAbrir) try {
      f(true);
    } catch {}
  }
  function cerrar() {
    abierto = false;
    info = false;
    raiz.classList.remove("abierto", "coninfo");
    vistaInfo?.parar();
    for (const f of alAbrir) try {
      f(false);
    } catch {}
    if (pedirRecargaAlCerrar) {
      pedirRecargaAlCerrar = false;
      controlador.recargarDesdeMenu?.();
    }
  }
  addEventListener("keydown", e => {
    if (teclasAbrir.includes(e.code)) {
      e.preventDefault();
      abierto ? cerrar() : abrir();
      return;
    }
    if (!abierto) return;
    if (e.code === "Escape" || e.code === "Backspace") volver(); else if (e.code === "ArrowRight" || e.code === "KeyD") mover(1); else if (e.code === "ArrowLeft" || e.code === "KeyA") mover(-1); else if (e.code === "ArrowUp" || e.code === "KeyW" || e.code === "KeyQ") alternarInfo(); else if (e.code === "ArrowDown" || e.code === "KeyS") {
      if (info) alternarInfo(false);
    } else if (e.code === "Enter" || e.code === "Space" || e.code === "KeyE") usarSeleccionado();
    e.stopPropagation();
  }, true);
  $(".cerrar").addEventListener("click", () => cerrar());
  cambios.push(() => dibujar());
  return {
    lugares: lugares,
    notas: notas,
    agregar: agregar,
    quitar: quitar,
    cuantos: cuantos,
    usar: usar,
    equipar: equipar,
    abrir: abrir,
    cerrar: cerrar,
    mensaje: mensaje,
    capacidad: capacidad,
    cargadas: cargadas,
    recargar: recargar,
    get abierto() {
      return abierto;
    },
    get alUsar() {
      return alUsarF;
    },
    set alUsar(f) {
      alUsarF = typeof f === "function" ? f : null;
    },
    alCambiar(f) {
      cambios.push(f);
    },
    alMensaje(f) {
      alMensaje.push(f);
    },
    seleccionar(i) {
      sel = Math.max(0, Math.min(LUGARES - 1, i));
      if (info) info = !!lugares[sel];
      dibujar();
      verInfo();
      avisar();
    },
    raiz: raiz,
    get sel() {
      return sel;
    },
    get info() {
      return info;
    },
    mover: mover,
    usarSeleccionado: usarSeleccionado,
    alternarInfo: alternarInfo,
    volver: volver,
    texto: texto,
    icono: icono,
    descripcion: descripcion,
    alAbrir(f) {
      alAbrir.push(f);
    },
    get ultimoMensaje() {
      return performance.now() < ultimoMensaje.hasta ? ultimoMensaje.t : "";
    }
  };
}
