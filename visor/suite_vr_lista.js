// SH4 web — FeniXVOID · Project Ravenlight
import { casco, manoDominante } from "./jugador/casco_comun.js";

import { cargarTextosJuego } from "./opciones_sitio.js";

const W = 1400, H = 1e3;

const normalizar = t => String(t ?? "").replace(/…/g, "...").replace(/[—–]/g, "-").replace(/[“”«»]/g, '"').replace(/[‘’]/g, "'").replace(/[·•]/g, "-");

const FOTOS = new Map;

const MAX_FOTOS = 220, A_LA_VEZ = 3;

let bajando = 0;

const cola = [];

function pedirFoto(url, avisar) {
  let f = FOTOS.get(url);
  if (f) {
    f.usada = performance.now();
    if (f.estado === "cola" || f.estado === "bajando") f.avisar.add(avisar);
    return f;
  }
  f = {
    img: null,
    estado: "cola",
    avisar: new Set([ avisar ]),
    usada: performance.now()
  };
  FOTOS.set(url, f);
  cola.push(url);
  seguirCola();
  if (FOTOS.size > MAX_FOTOS) {
    const viejas = [ ...FOTOS ].filter(([, x]) => x.estado === "lista" || x.estado === "falta").sort((a, b) => a[1].usada - b[1].usada);
    for (const [u] of viejas.slice(0, FOTOS.size - MAX_FOTOS)) FOTOS.delete(u);
  }
  return f;
}

function seguirCola() {
  while (bajando < A_LA_VEZ && cola.length) {
    const url = cola.shift(), f = FOTOS.get(url);
    if (!f || f.estado !== "cola") continue;
    f.estado = "bajando";
    bajando++;
    const img = new Image;
    img.decoding = "async";
    const fin = ok => {
      bajando--;
      f.estado = ok ? "lista" : "falta";
      f.img = ok ? img : null;
      for (const a of f.avisar) try {
        a();
      } catch {}
      f.avisar.clear();
      seguirCola();
    };
    img.onload = () => (img.decode ? img.decode().catch(() => {}) : Promise.resolve()).then(() => fin(true));
    img.onerror = () => fin(false);
    img.src = url;
  }
}

function sacarDeCola(urls) {
  for (let i = cola.length - 1; i >= 0; i--) if (!urls.has(cola[i])) {
    const f = FOTOS.get(cola[i]);
    if (f?.estado === "cola") FOTOS.delete(cola[i]);
    cola.splice(i, 1);
  }
}

export function crearListaVR({THREE: THREE, renderer: renderer, camara: camara, jugador: jugador, titulo: titulo = () => "", filas: filas = () => [], alElegir: alElegir = () => {}, botones: botones = () => [], alBoton: alBoton = () => {}, porPagina: porPagina = 13, ancho: ancho = 1.25, distancia: distancia = 1.2, abajo: abajo = .15, costado: costado = 0, seCierra: seCierra = true, alCerrar: alCerrar = null, ayuda: ayuda = null, grilla: grilla = false, columnas: columnas = 4, filasGrilla: filasGrilla = 3, curvo: curvo = false, alVolver: alVolver = null, abreConPalito: abreConPalito = true} = {}) {
  let fuente = null;
  cargarTextosJuego().then(t => {
    fuente = t.fuente;
    if (abierto) pintar();
  }).catch(() => {});
  const FILA = 56, Y0 = 112, X0 = 50, ANCHO_FILA = W - 100, YB = H - 150, HB = 64;
  const esGrilla = () => !!(typeof grilla === "function" ? grilla() : grilla);
  const porPag = () => esGrilla() ? columnas * filasGrilla : porPagina;
  const GAP = 26, CELDA_W = (ANCHO_FILA - (columnas - 1) * GAP) / columnas, FOTO_H = Math.round(CELDA_W * 9 / 16), CELDA_H = FOTO_H + 58;
  const lienzo = document.createElement("canvas");
  lienzo.width = W;
  lienzo.height = H;
  const tex = new THREE.CanvasTexture(lienzo);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const alto = ancho * H / W;
  const ARCO = ancho / distancia;
  let geo;
  if (curvo) {
    geo = new THREE.CylinderGeometry(distancia, distancia, alto, 40, 1, true, Math.PI - ARCO / 2, ARCO);
    const uv = geo.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setX(i, 1 - uv.getX(i));
  } else geo = new THREE.PlaneGeometry(ancho, alto);
  const plano = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    fog: false,
    toneMapped: false,
    side: THREE.DoubleSide
  }));
  plano.name = "lista (casco)";
  plano.renderOrder = 980;
  plano.visible = false;
  plano.frustumCulled = false;
  let abierto = false, elegida = 0, pagina = 0, apuntada = null, lista = [], bots = [], fundido = 1;
  function texto(g, t, x, y, {escala: escala = 2, color: color = "#ece3d2", alinear: alinear = "izq"} = {}) {
    t = normalizar(t);
    if (fuente) fuente.escribir(g, t, x / escala, y / escala, {
      escala: escala,
      color: color,
      alinear: alinear,
      sombra: true
    }); else {
      g.font = `${14 * escala}px Georgia, serif`;
      g.fillStyle = color;
      g.textAlign = alinear === "centro" ? "center" : alinear === "der" ? "right" : "left";
      g.textBaseline = "top";
      g.fillText(t, x, y);
    }
  }
  const ancho1 = (t, escala) => fuente ? fuente.anchoLinea(normalizar(t)) * escala : String(t).length * 9 * escala;
  const recortar = (t, max, escala) => {
    t = normalizar(t);
    if (ancho1(t, escala) <= max) return t;
    while (t.length > 3 && ancho1(t + "...", escala) > max) t = t.slice(0, -1);
    return t + "...";
  };
  const paginas = () => Math.max(1, Math.ceil(lista.length / porPag()));
  function zonas() {
    const z = [], pp = porPag();
    const ini = pagina * pp;
    let yp;
    if (esGrilla()) {
      for (let i = 0; i < pp && ini + i < lista.length; i++) {
        const c = i % columnas, f = Math.floor(i / columnas);
        z.push({
          tipo: "fila",
          k: ini + i,
          x: X0 + c * (CELDA_W + GAP),
          y: Y0 + f * (CELDA_H + 14),
          w: CELDA_W,
          h: CELDA_H
        });
      }
      yp = Y0 + filasGrilla * (CELDA_H + 14) - 4;
    } else {
      for (let i = 0; i < pp && ini + i < lista.length; i++) z.push({
        tipo: "fila",
        k: ini + i,
        x: X0 - 14,
        y: Y0 + i * FILA - 4,
        w: ANCHO_FILA + 28,
        h: FILA
      });
      yp = Y0 + pp * FILA + 6;
    }
    if (paginas() > 1 && esGrilla()) {
      z.push({
        tipo: "pag",
        d: -1,
        x: W - X0 - 330,
        y: 26,
        w: 110,
        h: 52
      });
      z.push({
        tipo: "pag",
        d: 1,
        x: W - X0 - 110,
        y: 26,
        w: 110,
        h: 52
      });
    } else if (paginas() > 1) {
      z.push({
        tipo: "pag",
        d: -1,
        x: X0,
        y: yp,
        w: 170,
        h: 52
      });
      z.push({
        tipo: "pag",
        d: 1,
        x: W - X0 - 170,
        y: yp,
        w: 170,
        h: 52
      });
    }
    const nb = bots.length, wb = nb ? Math.min(300, (ANCHO_FILA - (nb - 1) * 16) / nb) : 0;
    const x0 = (W - (nb * wb + (nb - 1) * 16)) / 2;
    bots.forEach((b, i) => z.push({
      tipo: "boton",
      id: b.id,
      x: x0 + i * (wb + 16),
      y: YB,
      w: wb,
      h: HB,
      b: b
    }));
    return z;
  }
  let fotoNueva = false;
  const avisoFoto = () => {
    fotoNueva = true;
    if (!renderer.xr.isPresenting && abierto) {
      fotoNueva = false;
      pintar();
    }
  };
  function pedirFotosPagina() {
    if (!esGrilla()) return;
    const pp = porPag(), ini = pagina * pp, quiero = new Set;
    for (let i = ini; i < Math.min(lista.length, ini + pp); i++) if (lista[i]?.img) quiero.add(lista[i].img);
    const pendientes = [ ...quiero ].some(u => {
      const f = FOTOS.get(u);
      return !f || f.estado === "cola" || f.estado === "bajando";
    });
    if (!pendientes) for (let i = ini + pp; i < Math.min(lista.length, ini + 2 * pp); i++) if (lista[i]?.img) quiero.add(lista[i].img);
    sacarDeCola(quiero);
    for (const u of quiero) pedirFoto(u, avisoFoto);
  }
  function tarjeta(g, z, f, el, ap) {
    const fx = z.x, fy = z.y, fw = z.w, fh = FOTO_H;
    const foto = f.img ? FOTOS.get(f.img) : null;
    if (foto?.estado === "lista" && foto.img) {
      foto.usada = performance.now();
      g.drawImage(foto.img, fx, fy, fw, fh);
    } else {
      const gr = g.createLinearGradient(0, fy, 0, fy + fh);
      gr.addColorStop(0, "#1d1714");
      gr.addColorStop(1, "#0c0908");
      g.fillStyle = gr;
      g.fillRect(fx, fy, fw, fh);
      texto(g, recortar(f.sinFoto ?? f.texto, fw - 30, 1.5), fx + fw / 2, fy + fh / 2 - 12, {
        escala: 1.5,
        color: "#5d534a",
        alinear: "centro"
      });
      if (foto && (foto.estado === "cola" || foto.estado === "bajando")) {
        g.fillStyle = "rgba(184,64,46,0.5)";
        g.fillRect(fx + fw / 2 - 30, fy + fh - 14, 60 * (performance.now() / 600 % 1), 3);
      }
    }
    if (!el && !ap) {
      g.fillStyle = "rgba(0,0,0,0.28)";
      g.fillRect(fx, fy, fw, fh);
    }
    g.strokeStyle = el ? "rgba(208,40,24,0.98)" : ap ? "rgba(208,64,44,0.75)" : f.marcada ? "rgba(232,200,160,0.7)" : "rgba(122,59,30,0.65)";
    g.lineWidth = el ? 6 : ap ? 4 : 2;
    g.strokeRect(fx + 1, fy + 1, fw - 2, fh - 2);
    const color = f.marcada ? "#e8c8a0" : el ? "#ffffff" : "#c9c2b6";
    texto(g, (f.marcada ? "> " : "") + recortar(f.texto, fw - 8, 1.6), fx + 2, fy + fh + 6, {
      escala: 1.6,
      color: color
    });
    if (f.dato) texto(g, recortar(String(f.dato), fw - 8, 1.35), fx + 2, fy + fh + 33, {
      escala: 1.35,
      color: "#a39889"
    });
  }
  function pintar() {
    lista = filas() || [];
    bots = botones() || [];
    pagina = Math.max(0, Math.min(paginas() - 1, pagina));
    pedirFotosPagina();
    const g = lienzo.getContext("2d");
    g.clearRect(0, 0, W, H);
    g.fillStyle = "rgba(8,5,4,0.88)";
    g.fillRect(0, 0, W, H);
    g.strokeStyle = "rgba(122,59,30,0.85)";
    g.lineWidth = 4;
    g.strokeRect(6, 6, W - 12, H - 12);
    const grill = esGrilla();
    texto(g, recortar(titulo(), W - 2 * X0 - (grill ? 360 : 160), 2.6), X0, 30, {
      escala: 2.6,
      color: "#b8402e"
    });
    if (paginas() > 1) texto(g, `${pagina + 1} / ${paginas()}`, grill ? W - X0 - 165 : W - X0, 40, {
      escala: 1.6,
      color: "#8f857a",
      alinear: grill ? "centro" : "der"
    });
    for (const z of zonas()) {
      const el = z.tipo === "fila" && z.k === elegida || z.tipo === "boton" && elegida === "b:" + z.id;
      const ap = apuntada && apuntada.tipo === z.tipo && apuntada.k === z.k && apuntada.id === z.id && apuntada.d === z.d;
      if (z.tipo === "fila" && grill) {
        tarjeta(g, z, lista[z.k] || {}, el, ap);
        continue;
      }
      if (el || ap) {
        const gr = g.createLinearGradient(z.x, 0, z.x + z.w, 0);
        const a = el ? .75 : .4;
        gr.addColorStop(0, "rgba(150,28,18,0)");
        gr.addColorStop(.1, `rgba(150,28,18,${a})`);
        gr.addColorStop(.9, `rgba(150,28,18,${a})`);
        gr.addColorStop(1, "rgba(150,28,18,0)");
        g.fillStyle = gr;
        g.fillRect(z.x, z.y, z.w, z.h);
      }
      if (z.tipo === "fila") {
        const f = lista[z.k] || {};
        const color = f.marcada ? "#e8c8a0" : el ? "#ffffff" : "#c9c2b6";
        const dato = f.dato ? String(f.dato) : "";
        const anchoDato = dato ? Math.min(360, ancho1(dato, 1.4) + 10) : 0;
        texto(g, (f.marcada ? "> " : "") + recortar(f.texto, ANCHO_FILA - anchoDato - 30, 1.7), X0, z.y + 10, {
          escala: 1.7,
          color: color
        });
        if (dato) texto(g, recortar(dato, 360, 1.4), X0 + ANCHO_FILA, z.y + 14, {
          escala: 1.4,
          color: "#8f857a",
          alinear: "der"
        });
      } else if (z.tipo === "pag") {
        g.strokeStyle = "rgba(122,59,30,0.7)";
        g.lineWidth = 2;
        g.strokeRect(z.x, z.y, z.w, z.h);
        texto(g, z.d < 0 ? "<<" : ">>", z.x + z.w / 2, z.y + 12, {
          escala: 1.8,
          color: "#c9c2b6",
          alinear: "centro"
        });
      } else {
        g.strokeStyle = el ? "rgba(208,64,44,0.95)" : "rgba(122,59,30,0.8)";
        g.lineWidth = 3;
        g.strokeRect(z.x, z.y, z.w, z.h);
        texto(g, recortar(z.b.texto, z.w - 20, 1.6), z.x + z.w / 2, z.y + 16, {
          escala: 1.6,
          color: z.b.activo ? "#e8c8a0" : el ? "#ffffff" : "#c9c2b6",
          alinear: "centro"
        });
      }
    }
    const ay = ayuda ? ayuda() : (grill ? "Gatillo o pellizco: elegir - Palito: moverse y paginas - A: elegir" + (alVolver ? " - B: volver" : "") : "Gatillo o pellizco: elegir - Palito: arriba/abajo y paginas - A: elegir") + (seCierra && abreConPalito ? " - Apretar el palito: cerrar" : "");
    texto(g, ay, W / 2, H - 62, {
      escala: 1.3,
      color: "#8f857a",
      alinear: "centro"
    });
    tex.needsUpdate = true;
  }
  const _p = new THREE.Vector3, _d = new THREE.Vector3, _l = new THREE.Vector3;
  function ubicar() {
    const cam = renderer.xr.isPresenting ? renderer.xr.getCamera() : camara;
    cam.getWorldPosition(_p);
    cam.getWorldDirection(_d);
    _d.y = 0;
    if (_d.lengthSq() < 1e-6) _d.set(0, 0, -1);
    _d.normalize();
    _l.set(-_d.z, 0, _d.x);
    if (plano.parent !== jugador) jugador.add(plano);
    jugador.updateMatrixWorld(true);
    if (curvo) {
      const centro = _p.clone();
      centro.y -= abajo;
      const dir = _d.clone().multiplyScalar(distancia).addScaledVector(_l, costado).normalize();
      plano.position.copy(jugador.worldToLocal(centro.clone()));
      plano.lookAt(centro.clone().sub(dir));
      return;
    }
    const pos = _p.clone().addScaledVector(_d, distancia).addScaledVector(_l, costado);
    pos.y -= abajo;
    plano.position.copy(jugador.worldToLocal(pos.clone()));
    const mirar = _p.clone();
    mirar.y = pos.y;
    plano.lookAt(mirar);
  }
  function abrir() {
    const k = (filas() || []).findIndex(f => f.marcada);
    if (k >= 0) {
      elegida = k;
      pagina = Math.floor(k / porPag());
    }
    ubicar();
    plano.visible = true;
    abierto = true;
    casco.apuntables.add(plano);
    pintar();
    casco.manos?.vibrar?.(manoDominante(), .3, 20);
    fundido = renderer.xr.isPresenting ? 0 : 1;
    plano.material.opacity = fundido;
  }
  function cerrar() {
    plano.visible = false;
    abierto = false;
    casco.apuntables.delete(plano);
    apuntada = null;
    sacarDeCola(new Set);
    alCerrar?.();
  }
  renderer.xr.addEventListener("sessionend", () => {
    plano.visible = false;
    abierto = false;
    casco.apuntables.delete(plano);
  });
  function zonaEn(uv) {
    const x = uv.x * W, y = (1 - uv.y) * H;
    return zonas().find(z => x >= z.x && x < z.x + z.w && y >= z.y && y < z.y + z.h) || null;
  }
  function volver() {
    if (alVolver) {
      let r;
      try {
        r = alVolver();
      } catch (e) {
        console.warn("[lista VR]", e);
      }
      if (r !== false) {
        if (abierto) pintar();
        return;
      }
    }
    if (seCierra) cerrar();
  }
  function activar(z) {
    if (!z) return;
    casco.manos?.vibrar?.(manoDominante(), .3, 18);
    if (z.tipo === "fila") {
      elegida = z.k;
      try {
        alElegir(z.k);
      } catch (e) {
        console.warn("[lista VR]", e);
      }
    } else if (z.tipo === "pag") {
      pagina = (pagina + z.d + paginas()) % paginas();
      if (esGrilla()) elegida = Math.min(lista.length - 1, pagina * porPag());
    } else if (z.tipo === "boton") {
      elegida = "b:" + z.id;
      try {
        alBoton(z.id);
      } catch (e) {
        console.warn("[lista VR]", e);
      }
    }
    if (abierto) pintar();
  }
  let ultimoEleg = 0;
  casco.manos?.alElegir?.(({hit: hit}) => {
    if (!abierto || hit?.object !== plano || !hit.uv) return;
    ultimoEleg = performance.now();
    activar(zonaEn(hit.uv));
  });
  const fueParaLaLista = () => performance.now() - ultimoEleg < 250 || !!(abierto && casco.manos?.estados?.some(x => x.hit?.object === plano));
  function mover(a) {
    const grill = esGrilla(), pp = porPag();
    if (grill && (a === "arriba" || a === "abajo" || a === "izq" || a === "der")) {
      let k = typeof elegida === "number" ? elegida : pagina * pp;
      const d = a === "izq" ? -1 : a === "der" ? 1 : a === "arriba" ? -columnas : columnas;
      k = Math.max(0, Math.min(lista.length - 1, k + d));
      elegida = k;
      pagina = Math.floor(k / pp);
    } else if (a === "arriba" || a === "abajo") {
      let k = typeof elegida === "number" ? elegida : pagina * pp;
      k = Math.max(0, Math.min(lista.length - 1, k + (a === "arriba" ? -1 : 1)));
      elegida = k;
      pagina = Math.floor(k / pp);
    } else if (a === "izq" || a === "der") {
      pagina = (pagina + (a === "izq" ? -1 : 1) + paginas()) % paginas();
      elegida = Math.min(lista.length - 1, pagina * pp);
    } else if (a === "aceptar") {
      if (typeof elegida === "number") {
        try {
          alElegir(elegida);
        } catch (e) {
          console.warn("[lista VR]", e);
        }
      } else if (String(elegida).startsWith("b:")) {
        try {
          alBoton(String(elegida).slice(2));
        } catch (e) {
          console.warn("[lista VR]", e);
        }
      }
    }
    casco.manos?.vibrar?.(manoDominante(), .15, 10);
    if (abierto) pintar();
  }
  const SIGNO_PALMA = -1, MIRA_MIN = .65, SOSTENER = .9, QUIETA = .03, SEG = 32;
  const geoAnillo = new THREE.RingGeometry(.032, .04, SEG, 1, Math.PI / 2, Math.PI * 2);
  const anillo = new THREE.Mesh(geoAnillo, new THREE.MeshBasicMaterial({
    color: 16720916,
    transparent: true,
    opacity: .9,
    depthTest: false,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
    fog: false
  }));
  anillo.renderOrder = 998;
  anillo.frustumCulled = false;
  anillo.visible = false;
  const gesto = {
    t: 0,
    bloqueado: false,
    enCurso: false,
    veces: 0
  };
  const _gn = new THREE.Vector3, _gc = new THREE.Vector3, _gw = new THREE.Vector3, _gq = new THREE.Quaternion, _ga = new THREE.Vector3, _gb = new THREE.Vector3, _gp = new THREE.Vector3, _gi = new THREE.Vector3;
  function cortarGesto() {
    gesto.t = 0;
    gesto.enCurso = false;
    anillo.visible = false;
  }
  function gestoManos(dt) {
    const e = casco.manos?.estados?.find(x => x.conectado && x.tipo === "mano" && x.lado === manoDominante());
    const J = e?.mano?.joints, w = J?.wrist, ta = J?.["thumb-tip"], ib = J?.["index-finger-tip"];
    if (!e || !w || !w.visible || !ta || !ib || !e.pellizco) {
      gesto.bloqueado = false;
      return cortarGesto();
    }
    w.updateMatrixWorld(true);
    _gn.set(0, SIGNO_PALMA, 0).applyQuaternion(w.getWorldQuaternion(_gq));
    const cab = renderer.xr.isPresenting ? renderer.xr.getCamera() : camara;
    cab.getWorldPosition(_gc).sub(w.getWorldPosition(_gw)).normalize();
    if (gesto.bloqueado || _gn.dot(_gc) < MIRA_MIN) return cortarGesto();
    gesto.enCurso = true;
    _gp.copy(ta.getWorldPosition(_ga)).add(ib.getWorldPosition(_gb)).multiplyScalar(.5);
    if (gesto.t === 0) _gi.copy(_gp); else if (_gp.distanceTo(_gi) > QUIETA) {
      gesto.bloqueado = true;
      return cortarGesto();
    }
    gesto.t += dt;
    geoAnillo.setDrawRange(0, 6 * Math.max(1, Math.round(Math.min(1, gesto.t / SOSTENER) * SEG)));
    const raiz = jugador.parent || jugador;
    if (anillo.parent !== raiz) raiz.add(anillo);
    anillo.position.copy(_gp);
    raiz.worldToLocal(anillo.position);
    anillo.lookAt(cab.getWorldPosition(_gc));
    anillo.visible = true;
    if (gesto.t >= SOSTENER) {
      gesto.bloqueado = true;
      gesto.veces++;
      cortarGesto();
      abierto ? seCierra && cerrar() : abrir();
    }
  }
  let antesPalito = false, antes = {}, rep = {
    a: null,
    t: 0
  }, tPintar = 0;
  function actualizar(dt) {
    if (!renderer.xr.isPresenting) return false;
    if (abreConPalito) gestoManos(dt);
    const P = casco.manos?.palitos?.() || {};
    const dom = P[manoDominante()];
    const palito = !!dom?.palito;
    if (abreConPalito && palito && !antesPalito) {
      if (abierto) {
        if (seCierra) cerrar();
      } else abrir();
    }
    antesPalito = palito;
    if (!abierto) return false;
    if (fundido < 1) {
      fundido = Math.min(1, fundido + dt / .2);
      plano.material.opacity = fundido;
    }
    let dir = null;
    for (const p of Object.values(P)) {
      if (p.y < -.6) dir = "arriba"; else if (p.y > .6) dir = "abajo"; else if (p.x < -.6) dir = "izq"; else if (p.x > .6) dir = "der";
    }
    if (dir !== rep.a) {
      rep = {
        a: dir,
        t: .4
      };
      if (dir) mover(dir);
    } else if (dir && (rep.t -= dt) <= 0) {
      rep.t = .16;
      mover(dir);
    }
    for (const [lado, p] of Object.entries(P)) {
      if (p.a && !antes[lado + "a"]) mover("aceptar");
      if (p.b && !antes[lado + "b"]) volver();
      antes[lado + "a"] = p.a;
      antes[lado + "b"] = p.b;
    }
    if (!abierto) return true;
    const e = casco.manos?.estados?.find(x => x.hit?.object === plano);
    const z = e?.hit?.uv ? zonaEn(e.hit.uv) : null;
    const clave = x => x ? x.tipo + ":" + (x.k ?? x.id ?? x.d) : "";
    if (clave(z) !== clave(apuntada)) {
      apuntada = z;
      if (z) casco.manos?.vibrar?.(manoDominante(), .1, 8);
      pintar();
      fotoNueva = false;
    } else if (fotoNueva) {
      fotoNueva = false;
      pintar();
    }
    if ((tPintar += dt) > (bajando ? .25 : 1)) {
      tPintar = 0;
      pintar();
    }
    return true;
  }
  function puntoUV(uv) {
    plano.updateMatrixWorld(true);
    if (!curvo) return new THREE.Vector3((uv.x - .5) * ancho, (uv.y - .5) * alto, 0).applyMatrix4(plano.matrixWorld);
    const th = Math.PI - ARCO / 2 + (1 - uv.x) * ARCO;
    return new THREE.Vector3(distancia * Math.sin(th), (uv.y - .5) * alto, distancia * Math.cos(th)).applyMatrix4(plano.matrixWorld);
  }
  function vistaPrevia(i = 0) {
    abrir();
    jugador.updateMatrixWorld(true);
    const z = zonas().find(x => x.tipo === "fila" && x.k === i) || zonas()[0];
    if (!z) return null;
    const uv = new THREE.Vector2((z.x + z.w * .4) / W, 1 - (z.y + z.h / 2) / H);
    const objetivo = puntoUV(uv);
    const cam = camara.getWorldPosition(new THREE.Vector3), q = camara.getWorldQuaternion(new THREE.Quaternion);
    const origen = cam.clone().add(new THREE.Vector3(.22, -.32, -.38).applyQuaternion(q));
    const e = casco.manos?.simular?.({
      i: 0,
      lado: manoDominante(),
      origen: origen,
      mirarA: objetivo,
      gatillo: .4,
      agarre: .9
    });
    if (e) for (const o of [ e.ctrl, e.grip ]) {
      const w = o.position.clone();
      o.parent?.worldToLocal(w);
      o.position.copy(w);
      o.lookAt(objetivo);
      o.rotateY(Math.PI);
    }
    if (e) e.grip.rotateX(.95);
    casco.manos?.actualizar?.(1 / 60, [ plano ]);
    const ex = casco.manos?.estados?.find(x => x.hit?.object === plano);
    apuntada = ex?.hit?.uv ? zonaEn(ex.hit.uv) : null;
    pintar();
    return {
      apunta: !!ex,
      zona: apuntada && {
        tipo: apuntada.tipo,
        k: apuntada.k
      }
    };
  }
  return {
    abrir: abrir,
    cerrar: cerrar,
    actualizar: actualizar,
    refrescar: () => abierto && pintar(),
    vistaPrevia: vistaPrevia,
    plano: plano,
    fueParaLaLista: fueParaLaLista,
    gesto: gesto,
    gestoManos: gestoManos,
    mover: mover,
    volver: volver,
    get abierto() {
      return abierto;
    },
    get gestoEnCurso() {
      return gesto.enCurso;
    },
    get elegida() {
      return elegida;
    },
    get pagina() {
      return pagina;
    },
    fotos() {
      const pp = porPag(), l = (filas() || []).slice(pagina * pp, pagina * pp + pp).filter(f => f.img);
      return {
        conFoto: l.length,
        listas: l.filter(f => FOTOS.get(f.img)?.estado === "lista").length,
        cola: cola.length,
        bajando: bajando
      };
    },
    irA(k) {
      elegida = k;
      pagina = Math.floor(k / porPag());
      if (abierto) pintar();
    }
  };
}
