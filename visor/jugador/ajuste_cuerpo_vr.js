// SH4 web — FeniXVOID · Project Ravenlight
import { crearListaVR } from "../suite_vr_lista.js";

import { leerOpciones, guardarOpciones, enlazarCine } from "../opciones_sitio.js";

import { idiomaActual } from "../textos_sitio.js";

const CINE = [ "pantalla", "adentro", "ojos" ];

const ALTURAS = [ 1.4, 1.5, 1.55, 1.6, 1.65, 1.7, 1.75, 1.8, 1.85, 1.9, 2, 2.1 ];

const OJOS_POR_ALTURA = .936;

const T = {
  postura: [ "¿CÓMO VAS A JUGAR?", "HOW WILL YOU PLAY?" ],
  parado: [ "Parado", "Standing" ],
  sentado: [ "Sentado", "Seated" ],
  altura: [ "TU ALTURA", "YOUR HEIGHT" ],
  medir: [ "Medirla ahora (quedate derecho 2 s)", "Measure it now (stand straight for 2 s)" ],
  midiendo: [ "Midiendo... quedate derecho", "Measuring... stand straight" ],
  escala: [ "¿CÓMO QUERÉS VER EL MUNDO?", "HOW DO YOU WANT TO SEE THE WORLD?" ],
  henry: [ "Ser Henry (los ojos a su altura, como el juego)", "Be Henry (eyes at his height, like the game)" ],
  propia: [ "A mi altura (el mundo a mi tamaño)", "At my height (the world at my size)" ],
  cine: [ "¿CÓMO QUERÉS VER LAS CINEMÁTICAS?", "HOW DO YOU WANT TO WATCH THE CUTSCENES?" ],
  pantalla: [ "Pantalla de cine (no marea)", "Cinema screen (no motion sickness)" ],
  adentro: [ "Adentro, con la cámara de la escena", "Inside, with the scene camera" ],
  ojos: [ "Inmersivo: los ojos de Henry", "Immersive: Henry's eyes" ],
  listo: [ "Listo", "Done" ],
  ajustar: [ "Gatillo: ajustar", "Trigger: adjust" ],
  cuerpo: [ "TU CUERPO", "YOUR BODY" ]
};

const t = k => T[k][idiomaActual() === "s" ? 0 : 1];

const metros = m => (idiomaActual() === "s" ? m.toFixed(2).replace(".", ",") : m.toFixed(2)) + " m";

export function crearAjusteCuerpoVR({THREE: THREE, renderer: renderer, camara: camara, jugador: jugador, alCambiar: alCambiar = null, alturaCabeza: alturaCabeza = null}) {
  let paso = null, tCartel = 0, midiendo = null;
  const op = () => leerOpciones();
  const guardar = cambios => {
    const o = op();
    Object.assign(o, cambios);
    if ("cineVR" in cambios) enlazarCine(o, "cineVR");
    guardarOpciones(o);
    try {
      alCambiar?.();
    } catch {}
  };
  function resumen() {
    const o = op(), alt = +o.alturaVR || null;
    return [ o.posturaVR === "sentado" ? t("sentado") : t("parado"), alt ? metros(alt) : null, o.posturaVR === "sentado" || o.escalaVR === "henry" ? "Henry" : t("propia").split(" (")[0], t(o.cineVR || "adentro").split(" (")[0].split(",")[0] ].filter(Boolean).join(" · ");
  }
  function filas() {
    const o = op();
    if (paso === "cartel") return [ {
      texto: resumen(),
      marcada: true
    }, {
      texto: t("ajustar")
    } ];
    if (paso === "postura") return [ {
      texto: t("parado"),
      marcada: o.posturaVR !== "sentado"
    }, {
      texto: t("sentado"),
      marcada: o.posturaVR === "sentado"
    } ];
    if (paso === "altura") return [ {
      texto: midiendo ? t("midiendo") : t("medir")
    }, ...ALTURAS.map(a => ({
      texto: metros(a),
      marcada: Math.abs((+o.alturaVR || 0) - a) < .024
    })) ];
    if (paso === "escala") return [ {
      texto: t("henry"),
      marcada: o.escalaVR === "henry"
    }, {
      texto: t("propia"),
      marcada: o.escalaVR !== "henry"
    } ];
    if (paso === "cine") return CINE.map(k => ({
      texto: t(k),
      marcada: (o.cineVR || "adentro") === k
    }));
    return [];
  }
  const titulo = () => ({
    cartel: t("cuerpo"),
    postura: t("postura"),
    altura: t("altura"),
    escala: t("escala"),
    cine: t("cine")
  }[paso] || "");
  function alElegir(i) {
    if (paso === "cartel") {
      ir("postura");
      return;
    }
    if (paso === "postura") {
      const sentado = i === 1;
      guardar({
        posturaVR: sentado ? "sentado" : "parado"
      });
      ir(sentado ? "cine" : "altura");
      return;
    }
    if (paso === "altura") {
      if (i === 0) {
        midiendo = {
          t: 0,
          medidas: []
        };
        lista.refrescar();
        return;
      }
      guardar({
        alturaVR: ALTURAS[i - 1]
      });
      ir("escala");
      return;
    }
    if (paso === "escala") {
      guardar({
        escalaVR: i === 0 ? "henry" : "propia"
      });
      ir("cine");
      return;
    }
    if (paso === "cine") {
      guardar({
        cineVR: CINE[i] || "adentro"
      });
      ir("fin");
    }
  }
  const lista = crearListaVR({
    THREE: THREE,
    renderer: renderer,
    camara: camara,
    jugador: jugador,
    titulo: titulo,
    filas: filas,
    alElegir: alElegir,
    seCierra: false,
    porPagina: 13,
    ancho: 1.1,
    distancia: 1.1,
    abajo: .1,
    ayuda: () => idiomaActual() === "s" ? "Gatillo o pellizco: elegir - Palito: arriba/abajo - A: elegir" : "Trigger or pinch: choose - Stick: up/down - A: choose"
  });
  function ir(p) {
    paso = p;
    midiendo = null;
    if (p === "fin") {
      guardar({
        cuerpoVRListo: true
      });
      lista.cerrar();
      paso = null;
      return;
    }
    if (lista.abierto) {
      lista.irA(0);
      lista.refrescar();
    } else lista.abrir();
  }
  function alEntrar() {
    if (op().cuerpoVRListo) {
      tCartel = 2;
      ir("cartel");
    } else ir("postura");
  }
  const _p = new THREE.Vector3;
  function actualizar(dt) {
    if (!paso || !renderer.xr.isPresenting) return false;
    if (midiendo) {
      let y = alturaCabeza?.();
      if (y == null) {
        const cam = renderer.xr.getCamera();
        cam.getWorldPosition(_p);
        jugador.worldToLocal(_p);
        y = _p.y;
      }
      midiendo.t += dt;
      if (midiendo.t > .4 && y > .5) midiendo.medidas.push(y);
      if (midiendo.t > 2.4 && midiendo.medidas.length) {
        const ojos = midiendo.medidas.reduce((s, v) => s + v, 0) / midiendo.medidas.length;
        const alt = Math.round(ojos / OJOS_POR_ALTURA * 100) / 100;
        midiendo = null;
        guardar({
          alturaVR: Math.max(1.2, Math.min(2.3, alt))
        });
        ir("escala");
      }
    }
    if (paso === "cartel" && (tCartel -= dt) <= 0) {
      lista.cerrar();
      paso = null;
      return false;
    }
    return lista.actualizar(dt);
  }
  renderer.xr.addEventListener("sessionend", () => {
    paso = null;
    midiendo = null;
  });
  return {
    alEntrar: alEntrar,
    ajustar: () => ir("postura"),
    actualizar: actualizar,
    fueParaLaLista: () => lista.fueParaLaLista?.(),
    get abierto() {
      return !!paso;
    }
  };
}
