// SH4 web — FeniXVOID · Project Ravenlight
import * as THREE from "three";

import { partesBin } from "../lib/sh4bin.js";

import { leerTexturas, aRGBA } from "../lib/texturas.js";

import { aNegro, aImagen, fundidoDemo } from "./fundidos.js";

async function texturaRGBA(bajar, archivo) {
  const buf = await bajar("data/" + archivo + ".bin");
  const p = partesBin(buf).find(x => x.tipo === "texturas");
  const im = leerTexturas(buf, p.ofs, p.len)[0][0];
  const c = document.createElement("canvas");
  c.width = im.ancho;
  c.height = im.alto;
  c.getContext("2d").putImageData(new ImageData(new Uint8ClampedArray(aRGBA(im)), im.ancho, im.alto), 0, 0);
  return c;
}

export function crearMirilla({M: M, juego: juego, cine: cine, cuarto: cuarto, bajar: bajar, DATOS: DATOS, DJ: DJ}) {
  const lienzo = document.createElement("canvas");
  lienzo.width = lienzo.height = 1024;
  const tex = new THREE.CanvasTexture(lienzo);
  tex.colorSpace = THREE.SRGBColorSpace;
  const marco = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({
    map: tex,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    toneMapped: false
  }));
  marco.renderOrder = 80;
  marco.visible = false;
  marco.frustumCulled = false;
  M.camara.add(marco);
  const texturas = {};
  async function prepararMarco(tipo) {
    const g = lienzo.getContext("2d");
    g.clearRect(0, 0, 1024, 1024);
    const arch = tipo === "puerta" ? "doorscope" : "peephole";
    try {
      texturas[arch] ??= await texturaRGBA(bajar, arch);
    } catch (e) {
      console.warn(arch, e.message);
    }
    if (texturas[arch]) {
      g.imageSmoothingQuality = "high";
      g.drawImage(texturas[arch], 0, 0, 1024, 1024);
    } else {
      g.fillStyle = "#000";
      g.fillRect(0, 0, 1024, 1024);
      g.globalCompositeOperation = "destination-out";
      g.beginPath();
      g.arc(512, 512, 420, 0, 7);
      g.fill();
      g.globalCompositeOperation = "source-over";
    }
    tex.needsUpdate = true;
  }
  const costados = [ [ -1, 0 ], [ 1, 0 ], [ 0, -1 ], [ 0, 1 ] ].map(([lx, ly]) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({
      color: 0,
      transparent: true,
      opacity: 1,
      depthTest: false,
      depthWrite: false
    }));
    m.renderOrder = 80;
    m.visible = false;
    m.frustumCulled = false;
    m.userData.l = [ lx, ly ];
    M.camara.add(m);
    return m;
  });
  function anclarMarco() {
    const vr = M.enVR();
    const d = Math.max(.08, (M.camara.near || .05) * 1.5);
    const fov = vr ? 100 : M.camara.fov;
    const alto = 2 * d * Math.tan(THREE.MathUtils.degToRad(fov) / 2);
    const lado = alto * (vr ? .75 : 1.04);
    marco.scale.set(lado, lado, 1);
    marco.position.set(0, 0, -d);
    const grande = alto * Math.max(1, M.camara.aspect) * 6;
    for (const c of costados) {
      const [lx, ly] = c.userData.l;
      c.scale.set(lx ? grande : lado + .001, ly ? grande : vr ? lado + .001 : alto * 2, 1);
      c.position.set(lx * (lado / 2 + grande / 2 - 5e-4), ly * (lado / 2 + grande / 2 - 5e-4), -d);
    }
  }
  const HUECO = THREE.MathUtils.degToRad(32);
  const ancla = new THREE.Group;
  ancla.visible = false;
  const geoEsfera = new THREE.SphereGeometry(1, 48, 24, 0, Math.PI * 2, HUECO, Math.PI - HUECO);
  geoEsfera.rotateX(-Math.PI / 2);
  const esfera = new THREE.Mesh(geoEsfera, new THREE.MeshBasicMaterial({
    color: 0,
    side: THREE.BackSide
  }));
  esfera.renderOrder = -1e3;
  esfera.frustumCulled = false;
  ancla.add(esfera);
  let Dact = null, giroAncla = null;
  const _e = new THREE.Euler(0, 0, 0, "YXZ");
  function anclarVR() {
    const near = M.camara.near || .05, d = Math.max(.2, near * 1.6);
    if (marco.parent !== ancla) ancla.add(marco);
    if (ancla.parent !== M.jugador) M.jugador.add(ancla);
    const base = Dact?._base?.q || M.camara.quaternion;
    _e.setFromQuaternion(base, "YXZ");
    if (giroAncla === null || Dact?._base?.q !== giroAncla.ref) giroAncla = {
      y: _e.y,
      ref: Dact?._base?.q
    };
    ancla.position.copy(M.camara.position);
    ancla.rotation.set(0, giroAncla.y, 0);
    esfera.scale.setScalar(d * 1.3);
    const lado = 2 * d * Math.tan(HUECO) / .8;
    marco.scale.set(lado, lado, 1);
    marco.position.set(0, 0, -d);
    marco.quaternion.identity();
  }
  function verMarco(si) {
    const vr = si && M.enVR();
    if (!vr && marco.parent !== M.camara) M.camara.add(marco);
    ancla.visible = vr;
    if (!si) {
      Dact = null;
      giroAncla = null;
      ancla.removeFromParent();
    }
    marco.visible = si;
    for (const c of costados) c.visible = si && !vr && !c.userData.l[1];
  }
  const T = DATOS.agujero_living?.tablas_eileen || {};
  const numDemo = d => d ? +String(d).replace(/\D/g, "") : null;
  const ahora = P => P.reloj ?? performance.now() / 1e3;
  const estadoMirilla = P => P.mirilla ||= {
    desde: -1e9,
    intervalo: 0,
    ultima: 0
  };
  function elegirAgujero(P) {
    const F = n => !!P.banderas[n];
    const forzadas = [ [ 46, () => !F(1553) && F(911) && !F(1101), 1553 ], [ 126, () => !F(1663) && F(1530) && !F(1534), 1663 ], [ 125, () => !F(1664) && F(1550) && !F(1554), 1664 ] ];
    for (const [id, ok, b] of forzadas) if (ok()) {
      P.banderas[b] = 1;
      return id;
    }
    if (F(1559) || F(1301) || F(1203)) return null;
    const m = estadoMirilla(P);
    if ([ 56, 58, 61, 138 ].includes(m.ultima) && ahora(P) - m.desde < 300) return null;
    if (!F(1530)) return null;
    const col = F(901) ? 2 : F(701) ? 1 : 0;
    const info = T.eil_demo_info || [];
    const actual = info[P.escenaEileen ?? 33] || info[33] || {
      escena: "NOBODY",
      tipo: 0
    };
    const clave = {
      NOBODY: [ "nobody_vestida", "nobody_en_casa", "nobody_desvestida" ][actual.tipo] || "nobody_vestida",
      TELEPHONE: "telephon",
      CROSS_LEGS: "cross_leg",
      THINKING: "round",
      SLEEPING3: "sleeping_3",
      SLEEPING4: "sleeping_4"
    }[actual.escena] || actual.escena.toLowerCase();
    const sig = T.transiciones?.[clave]?.siguientes || [];
    let r = Math.random(), elegido = null;
    for (const f of sig) {
      r -= f.prob[col] || 0;
      if (r <= 0) {
        elegido = f;
        break;
      }
    }
    if (!elegido) elegido = {
      indice: 33,
      demo: null
    };
    P.escenaEileen = elegido.indice;
    return numDemo(elegido.demo);
  }
  function elegirPuerta(P) {
    const F = n => !!P.banderas[n];
    const prender = (...l) => {
      for (const b of l) P.banderas[b] = 1;
    };
    const m = estadoMirilla(P), t = ahora(P);
    const visto = id => {
      m.desde = t;
      m.intervalo = 300;
      m.ultima = id || 0;
      return id;
    };
    if (juego.hauntings302?.estadoDe?.(5) === 1) return visto(139);
    if (!F(1101) && F(1620) && !F(1621)) {
      prender(1622, 1621);
      return visto(null);
    }
    if (!F(1547) && F(1546)) {
      prender(1547, 1599);
      return visto(61);
    }
    if (!F(1540) && F(1539)) {
      prender(1540, 1597);
      return visto(59);
    }
    if (!F(1535) && F(1537)) {
      prender(1535, 1594);
      return visto(58);
    }
    if (F(1527) && !F(1528)) {
      prender(1528);
      return visto(56);
    }
    if (F(1203)) {
      visto(0);
      return null;
    }
    if (t - m.desde <= m.intervalo) return null;
    const filas = [ [ 131, () => F(312) && !F(1534) || F(1540) && !F(1547), 50 ], [ 136, () => F(1535) && !F(522), 20 ], [ 135, () => F(1535) && !F(522), 20 ], [ 138, () => F(501) && !F(718), 5 ], [ 133, () => F(1540), 33 ], [ 137, () => F(1101), 1 ], [ 132, () => F(1540), 33 ], [ 134, () => F(1540), 10 ] ];
    const k0 = Math.floor(Math.random() * filas.length);
    for (let i = 0; i < filas.length; i++) {
      const [id, ok, pct] = filas[(k0 + i) % filas.length];
      if (ok() && Math.random() * 100 < pct) return visto(id);
    }
    return null;
  }
  const salaPuerta = P => P.banderas[1130] ? "rl06b" : "rl06a";
  const salaAgujero = P => P.banderas[1130] || P.banderas[1570] ? "rl05c" : P.banderas[718] ? "rl05b" : "rl05a";
  async function mirar(tipo, id, P) {
    const salaVista = tipo === "puerta" ? salaPuerta(P) : salaAgujero(P);
    const vuelta = {
      sala: cuarto.sala.nombre,
      pos: M.jugador.position.clone(),
      giro: M.camara.rotation.y,
      fase: juego.fase
    };
    juego.fase = "mirando por " + (tipo === "puerta" ? "la mirilla" : "el agujero") + (id ? " (d_" + id + ")" : " (vacío)");
    await aNegro(M);
    const seguir = () => {
      if (M.enVR()) {
        if (!ancla.visible) verMarco(true);
        anclarVR();
      } else {
        if (ancla.visible) verMarco(true);
        anclarMarco();
      }
    };
    try {
      await cuarto.cargar(salaVista, {
        pos: new THREE.Vector3(0, 0, 0)
      });
      await prepararMarco(tipo);
      let D = null;
      try {
        D = await cine.abrir(id ?? (tipo === "puerta" ? 75 : 101));
      } catch (err) {
        console.warn(err);
      }
      Dact = D;
      M.tareas.add(seguir);
      verMarco(true);
      aImagen(M);
      if (D) {
        const endless = !id || (DJ?.demos?.[String(id)]?.evento?.banderas || []).some(b => b.funcion === "DemoSetEndless" && b.args?.[0] === 1);
        const salida = fundidoDemo(D, {
          sinEntrada: true
        });
        await cine.reproducir(D, !id ? {
          desde: 0,
          hasta: .04,
          mantener: true,
          sinAudio: true,
          sinPersonajes: true,
          sinSubtitulos: true
        } : endless ? {
          mantener: true
        } : {
          alCuadro: s => {
            const v = salida(s);
            if (v > 0) M.ponerVelo(v);
          }
        });
        cine.liberar(D);
      }
    } catch (err) {
      console.warn("mirilla", err);
    }
    await aNegro(M);
    M.tareas.delete(seguir);
    verMarco(false);
    await cuarto.cargar(vuelta.sala, {
      pos: vuelta.pos,
      giro: vuelta.giro
    }).catch(err => console.warn("mirilla: vuelta", err));
    juego.fase = vuelta.fase;
    await aImagen(M);
  }
  return {
    mirar: mirar,
    puerta: (e, P) => mirar("puerta", elegirPuerta(P), P),
    agujero: (e, P) => mirar("agujero", elegirAgujero(P), P)
  };
}
