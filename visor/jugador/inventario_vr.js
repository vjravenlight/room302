// SH4 web — FeniXVOID · Project Ravenlight
import { cargarFuente } from "../lib/fuente.js";

import { LUGARES, TEXTO_COMUN } from "./inventario.js";

import { crearModelosItem } from "./modelo_item.js";

import { casco, dominanteXR, otraXR } from "./casco_comun.js";

const SIGNO_PALMA = -1;

const bajar = ruta => fetch("/juego/" + ruta).then(r => {
  if (!r.ok) throw new Error("no pude leer " + ruta);
  return r.arrayBuffer();
});

const LW = 1024, LH = 576, U = 2, UW = LW / U, UH = LH / U;

const ANCHO = .44;

const ALTO = ANCHO * LH / LW;

const TIRA = {
  x0: 20,
  y: 72,
  lado: 40,
  paso: 47.2
};

const BOTONES = [ {
  id: "usar",
  x: 14,
  w: 196
}, {
  id: "info",
  x: 218,
  w: 142
}, {
  id: "volver",
  x: 368,
  w: 130
} ].map(b => ({
  ...b,
  y: 250,
  h: 30
}));

export function crearInventarioVR({THREE: THREE, renderer: renderer, camara: camara, inventario: inventario, datos: datos, controlador: controlador, capa: capa = 9, conPalma: conPalma = true}) {
  let fuente = null;
  cargarFuente(bajar).then(f => {
    fuente = f;
    sucio = true;
  }).catch(e => console.warn("inventario del casco: fuente", e.message));
  const modelos = crearModelosItem({
    THREE: THREE,
    datos: datos
  });
  const lienzo = document.createElement("canvas");
  lienzo.width = LW;
  lienzo.height = LH;
  const g = lienzo.getContext("2d");
  const tex = new THREE.CanvasTexture(lienzo);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const mat = new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
    side: THREE.DoubleSide
  });
  const malla = new THREE.Mesh(new THREE.PlaneGeometry(ANCHO, ALTO), mat);
  malla.renderOrder = 70;
  malla.frustumCulled = false;
  malla.name = "inventario (casco)";
  const panel = new THREE.Group;
  panel.name = "panel inventario casco";
  panel.add(malla);
  panel.visible = false;
  const soporteItem = new THREE.Group;
  soporteItem.position.set(0, ALTO / 2 + .07, .02);
  panel.add(soporteItem);
  const lienzoAviso = document.createElement("canvas");
  lienzoAviso.width = 1024;
  lienzoAviso.height = 96;
  const gA = lienzoAviso.getContext("2d");
  const texA = new THREE.CanvasTexture(lienzoAviso);
  texA.colorSpace = THREE.SRGBColorSpace;
  const aviso = new THREE.Mesh(new THREE.PlaneGeometry(.8, .075), new THREE.MeshBasicMaterial({
    map: texA,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    toneMapped: false
  }));
  aviso.renderOrder = 71;
  aviso.visible = false;
  aviso.frustumCulled = false;
  aviso.position.set(0, -.3, -1.2);
  aviso.rotation.x = .22;
  camara.add(aviso);
  for (const o of [ malla, aviso ]) o.layers.enable(capa);
  const lados = new Map;
  function controles() {
    const xr = renderer?.xr;
    if (!xr?.getController) return {};
    const fuentes = [ ...xr.getSession?.()?.inputSources || [] ];
    const out = {};
    for (let i = 0; i < 2; i++) {
      const c = xr.getController(i), gr = xr.getControllerGrip(i);
      if (!lados.has(c)) {
        lados.set(c, null);
        const poner = e => lados.set(c, e.data?.handedness || null);
        c.addEventListener("connected", poner);
        gr.addEventListener("connected", poner);
        c.addEventListener("disconnected", () => lados.set(c, null));
      }
      const lado = lados.get(c) || fuentes[i]?.handedness || null;
      if (lado && !out[lado]) out[lado] = {
        c: c,
        g: gr,
        fuente: fuentes.find(f => f.handedness === lado) || fuentes[i] || null
      };
    }
    return out;
  }
  controles();
  const txt = (s, x, y, {tam: tam = 1, color: color = "#ece3d2", alinear: alinear = "izq", alfa: alfa = 1, interlinea: interlinea = 22} = {}) => {
    if (!fuente || !s) return;
    fuente.escribir(g, s, x / tam, y / tam, {
      escala: U * tam,
      color: color,
      alinear: alinear,
      alfa: alfa,
      interlinea: interlinea
    });
  };
  function cortar(s, ancho, tam) {
    if (!fuente) return [ s ];
    const out = [];
    for (const parrafo of String(s).split("\n")) {
      let linea = "";
      for (const p of parrafo.split(" ")) {
        const prueba = linea ? linea + " " + p : p;
        if (fuente.anchoLinea(prueba) * tam > ancho && linea) {
          out.push(linea);
          linea = p;
        } else linea = prueba;
      }
      out.push(linea);
    }
    return out;
  }
  const iconos = new Map;
  function icono(k) {
    if (!iconos.has(k)) {
      iconos.set(k, null);
      inventario.icono?.(k).then(c => {
        iconos.set(k, c);
        sucio = true;
      });
    }
    return iconos.get(k);
  }
  const caja = (x, y, w, h) => [ x * U, y * U, w * U, h * U ];
  function barra(x, y, w, frac) {
    g.fillStyle = "rgba(122,59,30,.30)";
    g.fillRect(...caja(x, y, w, 7));
    g.strokeStyle = "rgba(160,80,40,.7)";
    g.lineWidth = 2;
    g.strokeRect(...caja(x, y, w, 7));
    const gr = g.createLinearGradient(x * U, 0, (x + w) * U, 0);
    gr.addColorStop(0, "#6a1009");
    gr.addColorStop(1, "#d8301f");
    g.fillStyle = gr;
    g.fillRect(...caja(x + 1, y + 1, Math.max(0, (w - 2) * frac), 5));
  }
  let sucio = true, hover = null, cursor = null;
  function dibujar() {
    const L = inventario.lugares, sel = inventario.sel, info = inventario.info, l = L[sel];
    g.clearRect(0, 0, LW, LH);
    const fondo = g.createLinearGradient(0, 0, 0, LH);
    fondo.addColorStop(0, "rgba(10,7,6,.93)");
    fondo.addColorStop(1, "rgba(3,2,2,.97)");
    g.fillStyle = fondo;
    g.fillRect(0, 0, LW, LH);
    g.strokeStyle = "rgba(140,66,32,.85)";
    g.lineWidth = 3;
    g.strokeRect(1.5, 1.5, LW - 3, LH - 3);
    const msj = inventario.ultimoMensaje;
    if (msj) txt(msj, UW / 2, 6, {
      tam: .85,
      alinear: "centro"
    });
    if (!info) {
      for (let i = 0; i < LUGARES; i++) {
        const it = L[i], es = i === sel, s = es ? 1.32 : 1, lado = TIRA.lado * s;
        const cx = TIRA.x0 + TIRA.paso * i + TIRA.lado / 2, cy = TIRA.y, x = cx - lado / 2, y = cy - lado / 2;
        g.globalAlpha = es ? 1 : hover === i ? .85 : .6;
        g.fillStyle = "rgba(0,0,0,.6)";
        g.fillRect(...caja(x, y, lado, lado));
        g.strokeStyle = es ? "rgba(236,227,210,.9)" : "rgba(140,66,32,.6)";
        g.lineWidth = es ? 3 : 2;
        g.strokeRect(...caja(x, y, lado, lado));
        const ic = it && icono(it.k);
        if (ic) g.drawImage(ic, ...caja(x + 1, y + 1, lado - 2, lado - 2));
        g.globalAlpha = 1;
        if (it && (it.n > 1 || datos.atributo(it.k) === "munición")) txt(String(it.n), x + lado - 2, y + lado - 15, {
          tam: .7,
          alinear: "der"
        }); else if (it && (it.k === 16 || it.k === 17) && inventario.cargadas) txt(String(inventario.cargadas(it.k)), x + lado - 2, y + lado - 15, {
          tam: .7,
          alinear: "der"
        });
        if (it && it.k === controlador.s.arma) {
          g.fillStyle = "#d8301f";
          g.fillRect(...caja(x + 4, y + lado + 3, lado - 8, 2.5));
        }
      }
      if (l) {
        txt(datos.nombreItem(l.k), 20, 104, {
          tam: 1
        });
        cortar(inventario.descripcion(l.k), 330, .8).slice(0, 5).forEach((ln, i) => txt(ln, 20, 130 + i * 17, {
          tam: .8,
          color: "#cdc3b6"
        }));
      } else txt(inventario.texto(TEXTO_COMUN.nada), 20, 104, {
        tam: .9,
        color: "#a59a8d"
      });
      txt("VIDA", 492, 104, {
        tam: .7,
        alinear: "der",
        color: "#cdc3b6"
      });
      barra(372, 122, 120, Math.max(0, controlador.s.vida / controlador.s.vidaMax));
      if (l && datos.durabilidad(l.k)) {
        txt("ESTADO", 492, 138, {
          tam: .7,
          alinear: "der",
          color: "#cdc3b6"
        });
        barra(372, 156, 120, Math.max(0, l.dur) / 100);
      }
    } else if (l) {
      txt(datos.nombreItem(l.k), UW / 2, 30, {
        tam: 1.1,
        alinear: "centro"
      });
      cortar(inventario.descripcion(l.k), 470, .9).slice(0, 9).forEach((ln, i) => txt(ln, UW / 2, 64 + i * 20, {
        tam: .9,
        alinear: "centro",
        color: "#ddd3c5"
      }));
    }
    const nombres = {
      usar: "Gatillo: " + inventario.texto(TEXTO_COMUN.usarEquipar),
      info: "A: " + inventario.texto(TEXTO_COMUN.info),
      volver: "B: " + inventario.texto(TEXTO_COMUN.volver)
    };
    for (const b of BOTONES) {
      const on = hover === b.id || b.id === "info" && info;
      g.fillStyle = on ? "rgba(150,30,20,.55)" : "rgba(20,14,12,.85)";
      g.fillRect(...caja(b.x, b.y, b.w, b.h));
      g.strokeStyle = on ? "rgba(236,227,210,.9)" : "rgba(140,66,32,.75)";
      g.lineWidth = 2;
      g.strokeRect(...caja(b.x, b.y, b.w, b.h));
      txt(nombres[b.id], b.x + b.w / 2, b.y + 7, {
        tam: .72,
        alinear: "centro"
      });
    }
    if (cursor && !casco.manos) {
      const x = cursor[0] * U, y = cursor[1] * U;
      g.strokeStyle = g.fillStyle = "rgba(255,36,20,.95)";
      g.lineWidth = 3;
      g.beginPath();
      g.arc(x, y, 9, 0, Math.PI * 2);
      g.stroke();
      g.beginPath();
      g.arc(x, y, 2.5, 0, Math.PI * 2);
      g.fill();
    }
    tex.needsUpdate = true;
  }
  let avisoActual = "";
  function dibujarAviso(t) {
    gA.clearRect(0, 0, 1024, 96);
    if (t) {
      const gr = gA.createLinearGradient(0, 0, 1024, 0);
      gr.addColorStop(0, "rgba(0,0,0,0)");
      gr.addColorStop(.2, "rgba(0,0,0,.75)");
      gr.addColorStop(.8, "rgba(0,0,0,.75)");
      gr.addColorStop(1, "rgba(0,0,0,0)");
      gA.fillStyle = gr;
      gA.fillRect(0, 0, 1024, 96);
      if (fuente) fuente.escribir(gA, t, 256, 13, {
        escala: 2,
        alinear: "centro"
      });
    }
    texA.needsUpdate = true;
  }
  let kModelo = null, modelo = null, giroModelo = 0, inclinacion = 0;
  async function ponerModelo(k) {
    if (k === kModelo) return;
    kModelo = k;
    if (modelo) {
      soporteItem.remove(modelo);
      modelo.userData.pj?.dispose?.();
      modelo = null;
    }
    if (!k) return;
    const m = await modelos.modelo(k);
    if (kModelo !== k || !m) {
      m?.userData.pj?.dispose?.();
      return;
    }
    m.traverse(o => {
      if (o.isMesh) o.layers.enable(capa);
    });
    modelo = m;
    soporteItem.add(m);
  }
  const _p = new THREE.Vector3, _c = new THREE.Vector3, _q = new THREE.Quaternion, _q2 = new THREE.Quaternion, _m = new THREE.Matrix4, _f = new THREE.Vector3;
  const ARRIBA = new THREE.Vector3(0, 1, 0);
  let fijo = null;
  function manoReal(ladoXR) {
    return casco.manos?.estados.find(e => e.conectado && e.tipo === "mano" && (e.lado === "izq" ? "left" : "right") === ladoXR) || null;
  }
  function ubicar(dt, ctl) {
    const rig = camara.parent;
    if (!rig) return;
    if (panel.parent !== rig) rig.add(panel);
    camara.getWorldPosition(_c);
    const lado = otraXR(), grip = ctl[lado]?.g, mr = manoReal(lado), muneca = mr?.mano?.joints?.wrist;
    if (muneca || grip && ctl[lado].fuente) {
      if (muneca) {
        muneca.updateMatrixWorld(true);
        muneca.getWorldPosition(_p);
      } else {
        if (!grip.parent) rig.add(grip);
        grip.updateMatrixWorld(true);
        grip.getWorldPosition(_p);
      }
      _f.copy(_c).sub(_p).setY(0);
      if (_f.lengthSq() > 1e-6) _f.normalize();
      _p.addScaledVector(ARRIBA, .14).addScaledVector(_f, .03);
      fijo = null;
    } else {
      if (!fijo) {
        camara.getWorldDirection(_f);
        _f.y = 0;
        if (_f.lengthSq() < 1e-6) _f.set(0, 0, -1);
        _f.normalize();
        fijo = _c.clone().addScaledVector(_f, .55);
        fijo.y -= .22;
      }
      _p.copy(fijo);
    }
    _m.lookAt(_c, _p, ARRIBA);
    _q.setFromRotationMatrix(_m);
    rig.updateMatrixWorld(true);
    rig.getWorldQuaternion(_q2).invert();
    const local = rig.worldToLocal(_p.clone());
    const k = panel.userData.puesto ? 1 - Math.exp(-dt * 18) : 1;
    panel.position.lerp(local, k);
    panel.quaternion.slerp(_q2.multiply(_q), k);
    panel.userData.puesto = true;
  }
  const rayo = new THREE.Raycaster, _o = new THREE.Vector3, _d = new THREE.Vector3;
  function apuntado(ctl) {
    const r = casco.rayo();
    if (r) {
      _o.copy(r.origen);
      _d.copy(r.dir);
    } else {
      const lado = dominanteXR(), c = ctl[lado]?.c;
      if (!c || !ctl[lado].fuente) return null;
      if (!c.parent) camara.parent?.add(c);
      c.updateMatrixWorld(true);
      _o.setFromMatrixPosition(c.matrixWorld);
      _d.set(0, 0, -1).transformDirection(c.matrixWorld);
    }
    rayo.set(_o, _d);
    rayo.far = 3;
    malla.updateMatrixWorld(true);
    const h = rayo.intersectObject(malla, false)[0];
    if (!h?.uv) return null;
    const x = h.uv.x * UW, y = (1 - h.uv.y) * UH;
    let que = null;
    for (const b of BOTONES) if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) que = b.id;
    if (que == null && !inventario.info && Math.abs(y - TIRA.y) < TIRA.lado * .7) {
      const i = Math.round((x - TIRA.x0 - TIRA.lado / 2) / TIRA.paso);
      if (i >= 0 && i < LUGARES) que = i;
    }
    return {
      x: x,
      y: y,
      que: que
    };
  }
  const antes = {};
  const flanco = (k, v) => {
    const a = antes[k];
    antes[k] = v;
    return v && !a;
  };
  let repetir = 0, dirAntes = 0, claveAntes = "";
  function vibrar(fuente, f = .25, ms = 18) {
    try {
      fuente?.gamepad?.hapticActuators?.[0]?.pulse?.(f, ms);
    } catch {}
  }
  function comando(id) {
    if (id === "usar") inventario.usarSeleccionado(); else if (id === "info") inventario.alternarInfo(); else if (id === "volver") inventario.volver();
    sucio = true;
  }
  let pellizcoListo = false;
  function engancharPellizco() {
    if (pellizcoListo || !casco.manos) return;
    pellizcoListo = true;
    casco.manos.alElegir(({tipo: tipo}) => {
      if (tipo === "mano" && inventario.abierto) comando(typeof hover === "string" ? hover : "usar");
    });
  }
  let palma = 0;
  const _pm = new THREE.Vector3, _pc = new THREE.Vector3, _pq = new THREE.Quaternion;
  function gestoPalma(dt) {
    const mr = manoReal(otraXR()), w = mr?.mano?.joints?.wrist;
    if (!w || !w.visible) {
      palma = 0;
      return;
    }
    w.updateMatrixWorld(true);
    _pm.set(0, SIGNO_PALMA, 0).applyQuaternion(w.getWorldQuaternion(_pq));
    camara.getWorldPosition(_pc).sub(w.getWorldPosition(_p)).normalize();
    const mira = _pm.dot(_pc);
    if (!inventario.abierto) {
      palma = mira > .65 ? palma + dt : 0;
      if (palma > .5 && !controlador.s.muerto) {
        inventario.abrir();
        palma = 0;
        sucio = true;
      }
    } else {
      palma = mira < .15 ? palma + dt : 0;
      if (palma > .6) {
        inventario.cerrar();
        palma = 0;
        sucio = true;
      }
    }
  }
  function actualizar(dt, enVR) {
    const ses = enVR ? renderer?.xr?.getSession?.() : null;
    if (!ses) {
      if (panel.visible) {
        panel.visible = false;
        panel.userData.puesto = false;
      }
      aviso.visible = false;
      fijo = null;
      casco.apuntables.delete(malla);
      casco.inventarioAbierto = false;
      return;
    }
    engancharPellizco();
    const ctl = controles();
    const gpO = ctl[otraXR()]?.fuente?.gamepad, gpD = ctl[dominanteXR()]?.fuente?.gamepad;
    const gpIzq = ctl.left?.fuente?.gamepad, gpDer = ctl.right?.fuente?.gamepad;
    const bt = (gp, i) => !!gp?.buttons?.[i]?.pressed;
    const eje = gp => gp ? gp.axes.length >= 4 ? [ gp.axes[2], gp.axes[3] ] : [ gp.axes[0] || 0, gp.axes[1] || 0 ] : [ 0, 0 ];
    if (flanco("y", bt(gpIzq, 5))) {
      if (inventario.abierto) inventario.cerrar(); else if (!controlador.s.muerto) inventario.abrir();
      sucio = true;
    }
    if (conPalma) gestoPalma(dt);
    const abierto = inventario.abierto;
    casco.inventarioAbierto = abierto;
    if (abierto !== panel.visible) {
      panel.visible = abierto;
      panel.userData.puesto = false;
      fijo = null;
      if (abierto) {
        vibrar(ctl[otraXR()]?.fuente, .3, 25);
        casco.apuntables.add(malla);
      } else casco.apuntables.delete(malla);
    }
    const msj = inventario.ultimoMensaje;
    if (!abierto) {
      if (msj !== avisoActual) {
        avisoActual = msj;
        dibujarAviso(msj);
      }
      aviso.visible = !!msj;
      for (const k of [ "gat", "a", "b" ]) antes[k] = false;
      return;
    }
    aviso.visible = false;
    ubicar(dt, ctl);
    const [ex, ey] = eje(gpO);
    if (inventario.info) {
      giroModelo += ex * dt * 2.5;
      inclinacion = Math.max(-.9, Math.min(.9, inclinacion + ey * dt * 1.8));
    } else {
      const d = ex > .6 ? 1 : ex < -.6 ? -1 : 0;
      if (d && d !== dirAntes) {
        inventario.mover(d);
        repetir = .42;
        vibrar(ctl[otraXR()]?.fuente);
      } else if (d) {
        repetir -= dt;
        if (repetir <= 0) {
          inventario.mover(d);
          repetir = .16;
          vibrar(ctl[otraXR()]?.fuente);
        }
      }
      dirAntes = d;
    }
    const ap = apuntado(ctl);
    const nuevoHover = ap?.que ?? null;
    if (typeof nuevoHover === "number" && nuevoHover !== inventario.sel) {
      inventario.seleccionar(nuevoHover);
      vibrar(ctl[dominanteXR()]?.fuente, .15, 12);
    }
    hover = nuevoHover;
    cursor = ap ? [ ap.x, ap.y ] : null;
    if (flanco("gat", bt(gpD, 0))) comando(typeof hover === "string" ? hover : "usar");
    if (flanco("a", bt(gpDer, 4))) comando("info");
    if (flanco("b", bt(gpDer, 5))) comando("volver");
    const l = inventario.lugares[inventario.sel];
    ponerModelo(l?.k || null);
    if (modelo) {
      const grande = inventario.info;
      const s = grande ? .17 : .085;
      modelo.scale.setScalar(modelo.scale.x + (s - modelo.scale.x) * Math.min(1, dt * 10));
      soporteItem.position.set(0, ALTO / 2 + (grande ? .12 : .065), grande ? .05 : .02);
      if (!grande) {
        giroModelo += dt * .9;
        inclinacion *= Math.max(0, 1 - dt * 3);
      }
      modelo.rotation.set(inclinacion, giroModelo, 0);
    }
    const clave = [ inventario.sel, inventario.info, msj, hover, cursor && cursor.map(v => Math.round(v)).join(","), controlador.s.arma, Math.round(controlador.s.vida), inventario.lugares.map(x => x.k + ":" + x.n + ":" + Math.round(x.dur)).join("|"), !!fuente, JSON.stringify(controlador.s.cargador || {}), controlador.s.bala ].join(";");
    if (sucio || clave !== claveAntes) {
      claveAntes = clave;
      sucio = false;
      dibujar();
    }
  }
  return {
    actualizar: actualizar,
    panel: panel,
    malla: malla,
    aviso: aviso,
    get estado() {
      return {
        abierto: inventario.abierto,
        visible: panel.visible,
        sel: inventario.sel,
        info: inventario.info,
        hover: hover,
        cursor: cursor,
        modelo: kModelo,
        conModelo: !!modelo,
        fijo: !!fijo
      };
    }
  };
}
