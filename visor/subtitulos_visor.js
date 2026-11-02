// SH4 web — FeniXVOID · Project Ravenlight
import { leerTablaSubtitulos, leerMensajes } from "./lib/subtitulos.js";

import { idiomaActual } from "./textos_sitio.js";

import { cargarTextosJuego, leerOpciones } from "./opciones_sitio.js";

import { bajar } from "./modo_juego/motor.js";

import { lienzoTexto } from "./modo_juego/textos_dom.js";

export const PAQUETE_ETAPA = {
  rl: [ 4, "room0" ],
  sb: [ 5, "subway0" ],
  fr: [ 6, "forest0" ],
  mz: [ 7, "water0" ],
  bd: [ 8, "building0" ],
  ie: [ 9, "home0" ],
  hs: [ 10, "hospital0" ],
  cm: [ 11, "home0" ],
  ls: [ 12, "last0" ],
  gt: [ 13, "end0" ]
};

export function crearSubtitulos({THREE: THREE, camara: camara, renderer: renderer}) {
  let exe = null, tabla = null, fuente = null, textosComun = null, idioma = idiomaActual();
  const paquetes = {}, pedidos = new Map;
  const tablaSubs = [];
  let mItem = null, mMemo = null;
  const base = (async () => {
    try {
      const t = await cargarTextosJuego();
      fuente = t.fuente;
      textosComun = t.textos;
    } catch (e) {
      console.warn("[subtítulos] fuente", e.message);
    }
  })();
  async function prepararTabla() {
    if (tabla) return tabla;
    tabla = (async () => {
      try {
        exe = await bajar("SILENT HILL 4.exe");
        tablaSubs.push(...leerTablaSubtitulos(exe) || []);
      } catch (e) {
        console.warn("[subtítulos] tabla del EXE", e.message);
      }
      exe = null;
      return tablaSubs;
    })();
    return tabla;
  }
  function paquete(n, nombre) {
    const L = idiomaActual();
    if (L !== idioma) {
      idioma = L;
      for (const k of Object.keys(paquetes)) delete paquetes[k];
      pedidos.clear();
      mItem = mMemo = null;
    }
    const clave = n + "/" + L;
    if (!pedidos.has(clave)) pedidos.set(clave, bajar(`data/message_${nombre}_${L}.bin`).then(b => {
      paquetes[n] = leerMensajes(b);
    }).catch(() => {
      paquetes[n] = [];
    }));
    return pedidos.get(clave);
  }
  async function prepararEtapa(etapa) {
    const p = PAQUETE_ETAPA[etapa];
    await Promise.all([ prepararTabla(), base, p ? paquete(p[0], p[1]) : null, paquete(4, "room0") ]);
    if (!mItem) {
      const L = idiomaActual();
      [mItem, mMemo] = await Promise.all([ bajar(`data/message_item_msg_${L}.bin`).then(b => leerMensajes(b)[0] || []).catch(() => []), bajar(`data/message_memo_msg_${L}.bin`).then(b => leerMensajes(b)[0] || []).catch(() => []) ]);
    }
  }
  function texto(archivo, n) {
    if (archivo === 0) return textosComun?.(n) ?? "";
    if (archivo === 1 || archivo === 3) return mItem?.[n] ?? "";
    if (archivo === 2) return mMemo?.[n] ?? "";
    return paquetes[archivo]?.[0]?.[n] ?? "";
  }
  const div = document.createElement("div");
  div.id = "subtituloVisor";
  div.style.cssText = "position:fixed;left:50%;bottom:92px;transform:translateX(-50%);z-index:15;pointer-events:none;display:none;max-width:92vw;" + "text-align:center;filter:drop-shadow(0 0 3px #000)";
  document.body.appendChild(div);
  const lienzoVR = document.createElement("canvas");
  lienzoVR.width = 1024;
  lienzoVR.height = 192;
  const texVR = new THREE.CanvasTexture(lienzoVR);
  texVR.colorSpace = THREE.SRGBColorSpace;
  const cartel = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 1.25 * 192 / 1024), new THREE.MeshBasicMaterial({
    map: texVR,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    fog: false,
    toneMapped: false
  }));
  cartel.name = "subtítulos (casco)";
  cartel.renderOrder = 990;
  cartel.position.set(0, -.36, -1.4);
  cartel.visible = false;
  cartel.userData.sinSombra = true;
  cartel.frustumCulled = false;
  camara.add(cartel);
  let actual = "", alfaActual = 1, activos = true;
  const permitido = () => activos && leerOpciones().subtitulos !== false;
  function pintar() {
    const t = permitido() ? actual : "";
    div.textContent = "";
    div.style.display = t ? "block" : "none";
    if (t) {
      if (fuente) {
        const c = lienzoTexto(fuente, t, {
          escala: 2,
          color: "#ece3d2",
          alinear: "centro"
        });
        const px = Math.min(1.25, Math.max(.8, innerWidth / 1100));
        c.style.width = +c.dataset.ancho * px + "px";
        c.style.height = +c.dataset.alto * px + "px";
        c.style.display = "block";
        c.style.margin = "0 auto";
        div.appendChild(c);
      } else {
        div.style.font = "20px Georgia, serif";
        div.style.color = "#ece3d2";
        div.style.whiteSpace = "pre-line";
        div.textContent = t;
      }
      div.style.opacity = String(alfaActual);
    }
    const g = lienzoVR.getContext("2d");
    g.clearRect(0, 0, lienzoVR.width, lienzoVR.height);
    if (t) {
      if (fuente) {
        const c = lienzoTexto(fuente, t, {
          escala: 3,
          color: "#ece3d2",
          alinear: "centro"
        });
        const k = Math.min(1, lienzoVR.width / c.width, lienzoVR.height / c.height);
        g.drawImage(c, (lienzoVR.width - c.width * k) / 2, (lienzoVR.height - c.height * k) / 2, c.width * k, c.height * k);
      } else {
        g.font = "40px Georgia, serif";
        g.fillStyle = "#ece3d2";
        g.textAlign = "center";
        g.shadowColor = "#000";
        g.shadowBlur = 6;
        t.split("\n").forEach((l, i, a) => g.fillText(l, 512, 96 + (i - (a.length - 1) / 2) * 46));
      }
    }
    texVR.needsUpdate = true;
    cartel.material.opacity = alfaActual;
    cartel.visible = !!t && !!renderer.xr.isPresenting;
  }
  function mostrar(t, alfa = 1) {
    t = t || "";
    const a = Math.max(0, Math.min(1, alfa ?? 1));
    if (t === actual && Math.abs(a - alfaActual) < .05) return;
    const cambioTexto = t !== actual;
    actual = t;
    alfaActual = a;
    if (cambioTexto) pintar(); else {
      div.style.opacity = String(a);
      cartel.material.opacity = a;
    }
  }
  renderer.xr.addEventListener?.("sessionstart", () => {
    cartel.visible = !!actual && permitido();
  });
  renderer.xr.addEventListener?.("sessionend", () => {
    cartel.visible = false;
  });
  addEventListener("sh4opciones", () => pintar());
  addEventListener("sh4idioma", () => {
    mostrar("");
  });
  return {
    mostrar: mostrar,
    texto: texto,
    prepararEtapa: prepararEtapa,
    prepararTabla: prepararTabla,
    tablaSubs: tablaSubs,
    paquetes: paquetes,
    cartel: cartel,
    get actual() {
      return actual;
    },
    get activos() {
      return activos;
    },
    set activos(v) {
      activos = !!v;
      pintar();
    },
    get fuente() {
      return fuente;
    }
  };
}
