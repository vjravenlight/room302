// SH4 web — FeniXVOID · Project Ravenlight
import * as THREE from "three";

import { crearManos } from "./vr_manos.js";

import { imagenJuego, RECORTES } from "./suite_juego.js";

import { leerOpciones, guardarOpciones, estructura, cambiarOpcion, opcionesPorDefecto, dibujarOpcionesLienzo, LIENZO_OPC, cargarTextosJuego } from "./opciones_sitio.js";

import { t as tr } from "./textos_sitio.js";

const destino = (k, extra) => ({
  k: k,
  get t() {
    return tr(k);
  },
  get d() {
    return tr(k + ".d");
  },
  ...extra
});

export const DESTINOS = [ destino("vr.jugar", {
  href: "./modo_juego/juego.html"
}), destino("vr.escenarios", {
  href: "./index.html"
}), destino("vr.modelos", {
  href: "./modelos.html"
}), destino("vr.cine", {
  href: "./cine.html"
}), destino("vr.musica", {
  href: "./musica.html"
}), destino("vr.opciones", {
  accion: "opciones"
}), destino("vr.salir", {
  accion: "salir"
}) ];

const OJOS = 1.6;

const normalizar = t => String(t ?? "").replace(/…/g, "...").replace(/[—–]/g, "-");

export async function prepararSuiteVR() {
  const {fuente: fuente = null, textos: textos = null} = await cargarTextosJuego().catch(() => ({}));
  const T = (n, f) => textos && textos(n) || f;
  const opc = leerOpciones();
  const renderer = new THREE.WebGLRenderer({
    antialias: true
  });
  renderer.setPixelRatio(1);
  renderer.setSize(innerWidth, innerHeight);
  renderer.xr.enabled = true;
  renderer.xr.setReferenceSpaceType("local-floor");
  try {
    renderer.xr.setFoveation(.6);
  } catch {}
  const lienzo = renderer.domElement;
  lienzo.id = "suiteVR";
  Object.assign(lienzo.style, {
    position: "fixed",
    inset: "0",
    zIndex: "200",
    display: "none",
    width: "100%",
    height: "100%"
  });
  document.body.appendChild(lienzo);
  const escena = new THREE.Scene;
  escena.background = new THREE.Color(328451);
  escena.fog = new THREE.FogExp2(722951, .07);
  const camara = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, .03, 80);
  camara.position.set(0, OJOS, 0);
  const jugador = new THREE.Group;
  jugador.add(camara);
  escena.add(jugador);
  escena.add(new THREE.HemisphereLight(14733504, 1707530, 1.1));
  const sol = new THREE.DirectionalLight(16773344, 1.3);
  sol.position.set(.5, 3, 1.5);
  escena.add(sol);
  const mundo = new THREE.Group;
  escena.add(mundo);
  const textura = c => {
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  };
  function lienzoTexto(texto, {escala: escala = 3, ancho: ancho = null, alto: alto = null, alinear: alinear = "centro", color: color = "#ffffff"} = {}) {
    texto = normalizar(texto);
    const w = ancho || Math.ceil(((fuente ? fuente.anchoLinea(texto) : texto.length * 11) + 6) * escala);
    const h = alto || Math.ceil(26 * escala);
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const g = c.getContext("2d");
    const x = alinear === "centro" ? w / 2 / escala : 3;
    const y = (h / escala - 21) / 2;
    if (fuente) fuente.escribir(g, texto, x, y, {
      escala: escala,
      alinear: alinear,
      color: color
    }); else {
      g.font = `${18 * escala}px Georgia, serif`;
      g.fillStyle = color;
      g.textAlign = alinear === "centro" ? "center" : "left";
      g.textBaseline = "middle";
      g.fillText(texto, x * escala, h / 2);
    }
    return c;
  }
  const plano = (c, anchoM, op = {}) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(anchoM, anchoM * c.height / c.width), new THREE.MeshBasicMaterial({
      map: textura(c),
      transparent: true,
      depthWrite: false,
      fog: false,
      ...op
    }));
    return m;
  };
  const im = async (...a) => {
    try {
      return await imagenJuego(...a);
    } catch {
      return null;
    }
  };
  const [titulo, logo, niebla, fondoOpc] = await Promise.all([ im(...RECORTES.tituloFondo), im(...RECORTES.logoCompleto), im(...RECORTES.niebla), im(...RECORTES.opciones) ]);
  if (titulo) {
    const t = textura(titulo);
    t.wrapS = THREE.RepeatWrapping;
    t.repeat.x = -1;
    const R = 7, L = 1.55, alto = R * L / (640 / 448);
    const fondo = new THREE.Mesh(new THREE.CylinderGeometry(R, R, alto, 48, 1, true, Math.PI - L / 2, L), new THREE.MeshBasicMaterial({
      map: t,
      side: THREE.BackSide,
      color: 10129544
    }));
    fondo.position.y = OJOS + .35;
    mundo.add(fondo);
  }
  const piso = new THREE.Mesh(new THREE.CircleGeometry(14, 48).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({
    color: 1182987,
    roughness: 1
  }));
  mundo.add(piso);
  if (logo) {
    const l = plano(logo, 2.5, {
      color: 15524818
    });
    l.position.set(0, OJOS + 1.05, -3.3);
    mundo.add(l);
  } else {
    const l = plano(lienzoTexto("SILENT HILL 4  THE ROOM", {
      escala: 4
    }), 2.4, {
      color: 15524818
    });
    l.position.set(0, OJOS + 1.05, -3.3);
    mundo.add(l);
  }
  const suite = plano(lienzoTexto("S U I T E", {
    escala: 3
  }), .5, {
    color: 12075054
  });
  suite.position.set(0, OJOS + .66, -3.25);
  mundo.add(suite);
  const nieblas = [];
  if (niebla) {
    const x = niebla.getContext("2d");
    x.globalCompositeOperation = "destination-in";
    const v = x.createLinearGradient(0, 0, 0, niebla.height);
    v.addColorStop(0, "rgba(0,0,0,0)");
    v.addColorStop(.5, "rgba(0,0,0,1)");
    v.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = v;
    x.fillRect(0, 0, niebla.width, niebla.height);
    const hz = x.createLinearGradient(0, 0, niebla.width, 0);
    hz.addColorStop(0, "rgba(0,0,0,0)");
    hz.addColorStop(.2, "rgba(0,0,0,1)");
    hz.addColorStop(.8, "rgba(0,0,0,1)");
    hz.addColorStop(1, "rgba(0,0,0,0)");
    x.fillStyle = hz;
    x.fillRect(0, 0, niebla.width, niebla.height);
    const tn = textura(niebla);
    for (const [z, y, a, v] of [ [ -1.6, .25, .13, .06 ], [ -2.6, .7, .16, -.045 ], [ -3.6, 1.25, .12, .03 ], [ -1.2, 1.9, .07, -.05 ] ]) {
      const p = new THREE.Mesh(new THREE.PlaneGeometry(7, 1.1), new THREE.MeshBasicMaterial({
        map: tn,
        transparent: true,
        opacity: a,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
        fog: false,
        color: 14209224
      }));
      p.position.set(Math.random() * 2 - 1, y, z);
      p.userData.v = v;
      mundo.add(p);
      nieblas.push(p);
    }
  }
  const menu = new THREE.Group;
  menu.position.set(0, 0, -2.3);
  mundo.add(menu);
  const ANCHO = 1.3, PASO = .155, Y0 = OJOS + .32;
  const franjaC = document.createElement("canvas");
  franjaC.width = 256;
  franjaC.height = 16;
  {
    const g = franjaC.getContext("2d"), gr = g.createLinearGradient(0, 0, 256, 0);
    gr.addColorStop(0, "rgba(150,28,18,0)");
    gr.addColorStop(.2, "rgba(150,28,18,1)");
    gr.addColorStop(.8, "rgba(150,28,18,1)");
    gr.addColorStop(1, "rgba(150,28,18,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, 256, 16);
  }
  const franja = new THREE.Mesh(new THREE.PlaneGeometry(ANCHO * 1.15, PASO * .86), new THREE.MeshBasicMaterial({
    map: textura(franjaC),
    transparent: true,
    opacity: .6,
    depthWrite: false,
    fog: false
  }));
  franja.position.z = -.005;
  menu.add(franja);
  const items = DESTINOS.map((d, i) => {
    const c = lienzoTexto(d.t, {
      escala: 3.4,
      ancho: 1024,
      alto: 104
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(ANCHO, ANCHO * 104 / 1024), new THREE.MeshBasicMaterial({
      map: textura(c),
      transparent: true,
      depthWrite: false,
      fog: false,
      color: 9405818
    }));
    const zona = new THREE.Mesh(new THREE.PlaneGeometry(ANCHO * 1.15, PASO * .95), new THREE.MeshBasicMaterial({
      visible: false
    }));
    zona.userData.item = i;
    m.add(zona);
    m.position.y = Y0 - i * PASO;
    menu.add(m);
    return {
      m: m,
      zona: zona,
      d: d
    };
  });
  const ayudaC = document.createElement("canvas");
  ayudaC.width = 1536;
  ayudaC.height = 64;
  const ayuda = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 1.9 * 64 / 1536), new THREE.MeshBasicMaterial({
    map: textura(ayudaC),
    transparent: true,
    depthWrite: false,
    fog: false
  }));
  ayuda.position.y = Y0 - DESTINOS.length * PASO - .04;
  menu.add(ayuda);
  const teclas = plano(lienzoTexto(tr("vr.teclas"), {
    escala: 1.6
  }), 1.7, {
    color: 9405818
  });
  teclas.position.y = ayuda.position.y - .09;
  menu.add(teclas);
  let elegido = 0;
  function pintarAyuda() {
    const g = ayudaC.getContext("2d");
    g.clearRect(0, 0, ayudaC.width, ayudaC.height);
    const k = 2.2, txt = normalizar(DESTINOS[elegido].d);
    if (fuente) fuente.escribir(g, txt, ayudaC.width / 2 / k, 6, {
      escala: k,
      alinear: "centro",
      color: "#e0d6c8"
    }); else {
      g.font = "40px Georgia, serif";
      g.fillStyle = "#e0d6c8";
      g.textAlign = "center";
      g.fillText(txt, ayudaC.width / 2, 46);
    }
    ayuda.material.map.needsUpdate = true;
  }
  function elegir(i, vibrar = true) {
    i = (i + items.length) % items.length;
    if (i === elegido && items[i].m.material.color.getHex() === 16777215) return;
    elegido = i;
    items.forEach((it, k) => it.m.material.color.setHex(k === i ? 16777215 : 9405818));
    franja.position.y = items[i].m.position.y;
    pintarAyuda();
    if (vibrar) manos.vibrar(manos.activa, .2, 14);
  }
  const opcC = document.createElement("canvas");
  opcC.width = LIENZO_OPC.w * LIENZO_OPC.esc;
  opcC.height = LIENZO_OPC.h * LIENZO_OPC.esc;
  const panelOpc = new THREE.Mesh(new THREE.PlaneGeometry(2, 2 * LIENZO_OPC.h / LIENZO_OPC.w), new THREE.MeshBasicMaterial({
    map: textura(opcC),
    fog: false
  }));
  panelOpc.position.set(0, OJOS - .05, -2);
  panelOpc.visible = false;
  mundo.add(panelOpc);
  let E = null, opEl = 0, rects = [], apuntadoOpc = null;
  function dibujarOpc() {
    E = estructura(opc, textos);
    opEl = Math.max(0, Math.min(E.lineal.length - 1, opEl));
    rects = dibujarOpcionesLienzo(opcC.getContext("2d"), {
      fuente: fuente,
      fondo: fondoOpc,
      E: E,
      elegido: opEl,
      apuntado: apuntadoOpc
    });
    panelOpc.material.map.needsUpdate = true;
  }
  let modo = "menu";
  function abrirOpciones() {
    modo = "opciones";
    opEl = 0;
    menu.visible = false;
    panelOpc.visible = true;
    dibujarOpc();
  }
  function cerrarOpciones() {
    guardarOpciones(opc);
    modo = "menu";
    menu.visible = true;
    panelOpc.visible = false;
    manos.ponerDominante(opc.manoVR);
  }
  function accionOpc(a) {
    const f = E.lineal[opEl];
    if (a === "arriba") opEl = (opEl + E.lineal.length - 1) % E.lineal.length; else if (a === "abajo") opEl = (opEl + 1) % E.lineal.length; else if (a === "izq" || a === "der") {
      if (!f.accion && cambiarOpcion(opc, f, a === "izq" ? -1 : 1)) guardarOpciones(opc);
    } else if (a === "aceptar") {
      if (f.id === "salir") return cerrarOpciones();
      if (f.id === "porDefecto") {
        opcionesPorDefecto(opc);
        guardarOpciones(opc);
      } else if (cambiarOpcion(opc, f, 1)) guardarOpciones(opc);
    } else if (a === "cancelar") return cerrarOpciones();
    manos.vibrar(manos.activa, .25, 15);
    dibujarOpc();
  }
  const manos = crearManos({
    renderer: renderer,
    padre: jugador,
    escena: escena,
    manoDominante: opc.manoVR,
    estilo: "manos"
  });
  manos.alElegir(({hit: hit}) => {
    if (modo === "menu") {
      const i = hit?.object?.userData?.item;
      if (i != null) {
        elegir(i, false);
        activar(i);
      }
    } else if (modo === "opciones" && hit?.object === panelOpc && hit.uv) {
      const r = filaEn(hit.uv);
      if (r != null) {
        opEl = r;
        accionOpc("aceptar");
      }
    }
  });
  const filaEn = uv => {
    const x = uv.x * LIENZO_OPC.w, y = (1 - uv.y) * LIENZO_OPC.h;
    return rects.find(r => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h)?.i ?? null;
  };
  const negro = new THREE.Mesh(new THREE.SphereGeometry(.3, 16, 12), new THREE.MeshBasicMaterial({
    color: 0,
    transparent: true,
    opacity: 0,
    side: THREE.BackSide,
    depthTest: false,
    fog: false
  }));
  negro.renderOrder = 1e3;
  camara.add(negro);
  let fundido = null;
  function activar(i) {
    const d = DESTINOS[i];
    manos.vibrar(manos.activa, .5, 30);
    if (d.accion === "opciones") return abrirOpciones();
    if (d.accion === "salir") return salir();
    fundido = {
      t: 0,
      alTerminar: async () => {
        const url = new URL(d.href, location.href).href;
        try {
          await (renderer.xr.getSession()?.end());
        } catch {}
        location.assign(url);
      }
    };
  }
  const reloj = new THREE.Clock;
  let ubicado = false, rep = {
    a: null,
    t: 0
  }, botonesAntes = {}, ultimoHit = null, t = 0;
  const camPos = new THREE.Vector3, camDir = new THREE.Vector3;
  function ubicar() {
    const cam = renderer.xr.isPresenting ? renderer.xr.getCamera() : camara;
    cam.getWorldPosition(camPos);
    cam.getWorldDirection(camDir);
    if (renderer.xr.isPresenting && camPos.y < .2) return;
    mundo.position.set(camPos.x, camPos.y - OJOS, camPos.z);
    mundo.rotation.y = Math.atan2(-camDir.x, -camDir.z);
    ubicado = true;
  }
  function accion(a) {
    if (fundido) return;
    if (modo === "opciones") return accionOpc(a);
    if (a === "arriba") elegir(elegido - 1); else if (a === "abajo") elegir(elegido + 1); else if (a === "aceptar") activar(elegido); else if (a === "cancelar") salir();
  }
  function cuadro() {
    const dt = Math.min(.1, reloj.getDelta());
    t += dt;
    if (!ubicado) ubicar();
    for (const p of nieblas) {
      p.position.x += p.userData.v * dt;
      if (Math.abs(p.position.x) > 2.5) p.userData.v *= -1;
    }
    franja.material.opacity = .5 + .12 * Math.sin(t * 5);
    const P = manos.palitos();
    let dir = null;
    for (const p of Object.values(P)) {
      if (p.y < -.6) dir = "arriba"; else if (p.y > .6) dir = "abajo"; else if (p.x < -.6) dir = "izq"; else if (p.x > .6) dir = "der";
    }
    if (dir !== rep.a) {
      rep = {
        a: dir,
        t: .4
      };
      if (dir) accion(dir);
    } else if (dir && (rep.t -= dt) <= 0) {
      rep.t = .15;
      accion(dir);
    }
    for (const [lado, p] of Object.entries(P)) {
      for (const [k, a] of [ [ "a", "aceptar" ], [ "b", "cancelar" ] ]) {
        const id = lado + k;
        if (p[k] && !botonesAntes[id]) accion(a);
        botonesAntes[id] = p[k];
      }
    }
    const objetivos = modo === "menu" ? items.map(it => it.zona) : [ panelOpc ];
    const hits = manos.actualizar(dt, objetivos);
    const h = hits.find(x => x.hit)?.hit || null;
    if (modo === "menu") {
      const i = h?.object?.userData?.item ?? null;
      if (i !== ultimoHit) {
        ultimoHit = i;
        if (i != null) elegir(i);
      }
    } else {
      const r = h?.uv ? filaEn(h.uv) : null;
      if (r !== apuntadoOpc) {
        apuntadoOpc = r;
        if (r != null) {
          opEl = r;
          manos.vibrar(manos.activa, .15, 10);
        }
        dibujarOpc();
      }
    }
    if (fundido) {
      fundido.t += dt;
      negro.material.opacity = Math.min(1, fundido.t / .45);
      if (fundido.t > .5 && fundido.alTerminar) {
        const f = fundido.alTerminar;
        fundido.alTerminar = null;
        f();
      }
    }
    renderer.render(escena, camara);
  }
  let sesion = null;
  async function entrar() {
    sesion = await navigator.xr.requestSession("immersive-vr", {
      optionalFeatures: [ "local-floor", "bounded-floor", "hand-tracking", "layers" ]
    });
    globalThis.__sh4EnVR = true;
    sesion.addEventListener("end", () => {
      globalThis.__sh4EnVR = false;
      sesion = null;
      renderer.setAnimationLoop(null);
      lienzo.style.display = "none";
    });
    await renderer.xr.setSession(sesion);
    ubicado = false;
    modo = "menu";
    menu.visible = true;
    panelOpc.visible = false;
    fundido = null;
    negro.material.opacity = 0;
    elegir(0, false);
    renderer.setAnimationLoop(cuadro);
  }
  async function salir() {
    if (opc) guardarOpciones(opc);
    try {
      await (sesion?.end());
    } catch {}
  }
  function vistaPrevia(cual = "probar") {
    lienzo.style.display = "block";
    const ajustar = () => {
      renderer.setSize(innerWidth, innerHeight);
      camara.aspect = innerWidth / innerHeight;
      camara.updateProjectionMatrix();
    };
    ajustar();
    addEventListener("resize", ajustar);
    elegir(0, false);
    if (cual === "opciones") {
      abrirOpciones();
      camara.lookAt(0, OJOS - .05, -2);
    } else if (cual === "manos") {
      camara.fov = 50;
      camara.updateProjectionMatrix();
      camara.lookAt(0, OJOS - .25, -.5);
    } else camara.lookAt(0, OJOS + .15, -2.3);
    const objetivo = cual === "opciones" ? new THREE.Vector3(-.3, OJOS + .2, -2) : new THREE.Vector3(0, items[1].m.position.y, -2.3);
    if (cual === "manos") {
      manos.simular({
        i: 0,
        lado: "der",
        origen: new THREE.Vector3(.13, OJOS - .3, -.42),
        mirarA: new THREE.Vector3(.1, OJOS - .1, -2.3),
        gatillo: 0,
        agarre: 0,
        pulgar: 0
      });
      manos.simular({
        i: 1,
        lado: "izq",
        origen: new THREE.Vector3(-.13, OJOS - .3, -.42),
        mirarA: new THREE.Vector3(-.1, OJOS - .1, -2.3),
        gatillo: 1,
        agarre: 1,
        pulgar: 1
      });
    } else manos.simular({
      i: 0,
      lado: "der",
      origen: new THREE.Vector3(.22, OJOS - .35, -.35),
      mirarA: objetivo,
      gatillo: .3,
      agarre: .9
    });
    renderer.setAnimationLoop(cuadro);
    return {
      renderer: renderer,
      escena: escena,
      camara: camara,
      manos: manos,
      accion: accion
    };
  }
  return {
    entrar: entrar,
    salir: salir,
    vistaPrevia: vistaPrevia,
    accion: accion,
    get enCasco() {
      return !!sesion;
    }
  };
}
