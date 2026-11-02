// SH4 web — FeniXVOID · Project Ravenlight
import * as THREE from "three";

import { q } from "./motor.js";

import { sitioIngles } from "../textos_sitio.js";

import { leerOpciones } from "../opciones_sitio.js";

const EN_CAM = () => sitioIngles();

import { partesBin } from "../lib/sh4bin.js";

import { indiceSh4 } from "../lib/remoto.js";

import { leerSqt, crearMuestreador, leerCamara, nuevaCamara, FPS } from "../lib/sqt.js";

import { prepararOjos, poseOjos, crearSuavizado, inclinacion, ubicarRig, HUESO_CABEZA } from "../lib/ojos_cine.js";

import { decodificarXmd } from "../lib/xmd.js";

import { leerModelo } from "../lib/modelo.js";

import { leerTexturas } from "../lib/texturas.js";

import { crearPersonaje } from "../lib/personaje.js";

import { subtitulosDe } from "../lib/subtitulos.js";

import { crearUniformsLuz, materialJuego, lucesDelJuego, aplicarLucesPersonaje } from "../lib/luz_cine.js";

import { sombraDemo, esHalfDemo, opcionesLuzPj } from "../lib/luz_personajes.js";

import { armarExtras } from "../lib/extras_cine.js";

import { ocultarGrupos } from "../lib/extras_cine.js";

import { crearEventosDemo } from "../efectos/eventos_demo.js";

import { crearCapasCamara } from "../efectos/pantalla_demo.js";

const ESCALA = .005, ALTO_FRANJA = .125;

const _qJ = new THREE.Quaternion(0, 0, 1, 0), _qX = new THREE.Quaternion(1, 0, 0, 0);

const _q = new THREE.Quaternion, _p = new THREE.Vector3, _s = new THREE.Vector3, _m = new THREE.Matrix4, _col = new THREE.Color, _dir = new THREE.Vector3;

const aThree = (v, out) => out.set(-v[0] * ESCALA, -v[1] * ESCALA, v[2] * ESCALA);

export function crearCine({M: M, bajar: bajar, DJ: DJ, PC: PC, tablaSubs: tablaSubs, mensajesPorPaquete: mensajesPorPaquete, mostrarSub: mostrarSub, pisoEn: pisoEn = null, foco: foco = null, alEmpezar: alEmpezar = null, alTerminar: alTerminar = null, ambienteSala: ambienteSala = null, verHenryVR: verHenryVR = null, vistaCineVR: vistaCineVR = null, cineVR: cineVR = null, cine1ra: cine1ra = null, efectos: efectos = null}) {
  let opcSitio = null;
  addEventListener("sh4opciones", e => {
    opcSitio = e.detail || null;
  });
  const OPC = () => window.sh4juego?.opciones || (opcSitio ??= leerOpciones());
  verHenryVR ??= () => OPC().henryVR !== false;
  vistaCineVR ??= () => OPC().vistaCineVR !== false;
  cineVR ??= () => OPC().cineVR || null;
  const modoVR = () => M.enVR() ? q.get("cinevr") || cineVR?.() || null : null;
  const primera = () => q.has("cine1ra") ? q.get("cine1ra") !== "0" : modoVR() ? modoVR() === "ojos" : !!(cine1ra ? cine1ra() : OPC().cine1ra);
  const esHenry = ent => /^Henry/.test(PC?.personajes?.[String(ent.p.id)]?.nombre || "");
  const SIN_HENRY = new Set([ 47 ]);
  const CON_HENRY = new Set([ 53 ]);
  const ocultarEnVR = (ent, D) => esHenry(ent) && !q.has("henrycine") && !CON_HENRY.has(D?.id) && (SIN_HENRY.has(D?.id) || M.enVR() && (q.has("sinhenrycine") || verHenryVR?.() === false));
  const LUZ_JUEGO = q.get("luz") !== "vieja";
  const pantalla = (() => {
    let grupo = null, rt = null, cam = null, puesta = false;
    function armar() {
      rt = new THREE.WebGLRenderTarget(1280, 960, {
        samples: 4
      });
      rt.texture.colorSpace = THREE.SRGBColorSpace;
      cam = new THREE.PerspectiveCamera(50, 4 / 3, .02, 600);
      grupo = new THREE.Group;
      grupo.name = "pantalla de cine (casco)";
      const negro = new THREE.Mesh(new THREE.SphereGeometry(1.6, 24, 16), new THREE.MeshBasicMaterial({
        color: 0,
        side: THREE.BackSide,
        fog: false
      }));
      negro.renderOrder = -1e3;
      negro.frustumCulled = false;
      const tela = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.05), new THREE.MeshBasicMaterial({
        map: rt.texture,
        fog: false,
        toneMapped: false,
        depthTest: false
      }));
      tela.position.set(0, 0, -1.1);
      tela.renderOrder = 1e3;
      tela.frustumCulled = false;
      grupo.add(negro, tela);
    }
    function poner() {
      if (!grupo) armar();
      const cab = M.renderer.xr.isPresenting ? M.renderer.xr.getCamera() : M.camara;
      const p = new THREE.Vector3, d = new THREE.Vector3;
      cab.getWorldPosition(p);
      cab.getWorldDirection(d);
      d.y = 0;
      if (d.lengthSq() < 1e-6) d.set(0, 0, -1);
      d.normalize();
      grupo.position.copy(p);
      grupo.rotation.set(0, Math.atan2(-d.x, -d.z), 0);
      M.escena.add(grupo);
      puesta = true;
      M.dibujoVR.f = dibujar;
    }
    function dibujar() {
      if (!puesta) return;
      const R = M.renderer, xr = R.xr.enabled, previo = R.getRenderTarget();
      grupo.visible = false;
      R.xr.enabled = false;
      R.setRenderTarget(rt);
      R.clear();
      R.render(M.escena, cam);
      R.setRenderTarget(previo);
      R.xr.enabled = xr;
      grupo.visible = true;
    }
    function ver(p, qc, fov) {
      if (!puesta) poner();
      cam.position.copy(p);
      cam.quaternion.copy(qc);
      if (Math.abs(cam.fov - fov) > .001) {
        cam.fov = fov;
        cam.updateProjectionMatrix();
      }
    }
    function sacar() {
      if (!puesta) return;
      puesta = false;
      grupo.removeFromParent();
      if (M.dibujoVR.f === dibujar) M.dibujoVR.f = null;
    }
    return {
      ver: ver,
      sacar: sacar,
      get puesta() {
        return puesta;
      }
    };
  })();
  const paquetes = new Map;
  const bin = a => bajar("data/" + a);
  const grupo = new THREE.Group;
  grupo.name = "cinematica";
  M.escena.add(grupo);
  const lucesGrupo = new THREE.Group;
  grupo.add(lucesGrupo);
  const franjas = [ 1, -1 ].map(lado => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(10, 1), new THREE.MeshBasicMaterial({
      color: 0,
      transparent: true,
      opacity: 1,
      depthTest: false,
      depthWrite: false
    }));
    m.renderOrder = 90;
    m.visible = false;
    m.frustumCulled = false;
    m.userData.lado = lado;
    M.camara.add(m);
    return m;
  });
  let conFranjas = false;
  function ponerFranjas(si) {
    conFranjas = si;
    const d = .06, alto = 2 * d * Math.tan(THREE.MathUtils.degToRad(M.camara.fov) / 2);
    for (const f of franjas) {
      f.visible = si && !M.enVR();
      const h = alto * ALTO_FRANJA * 2;
      f.scale.set(1, h, 1);
      f.position.set(0, f.userData.lado * (alto / 2 - h / 2 + h * .25), -d);
    }
  }
  const eventos = q.has("sineventos") ? null : crearEventosDemo({
    THREE: THREE,
    bajar: bajar,
    escala: ESCALA,
    modo: "juego"
  });
  const capas = crearCapasCamara({
    THREE: THREE,
    camara: M.camara
  });
  const fxDe = () => (typeof efectos === "function" ? efectos() : efectos) ?? window.sh4juego?.ambiente?.fx ?? window.sh4?.efectos ?? null;
  let salasDemos = null;
  const salasDemosListo = fetch("/datos/demos_salas.json").then(r => r.ok ? r.json() : null).then(j => {
    salasDemos = j;
  }).catch(() => {});
  async function paquete(nombre) {
    if (!paquetes.has(nombre)) paquetes.set(nombre, indiceSh4("/juego/demo/" + nombre));
    return paquetes.get(nombre);
  }
  async function abrir(id) {
    const d = DJ?.demos?.[String(id)];
    const nom = "d_" + String(id).padStart(3, "0");
    const paq = await paquete((d?.paquete || "demo/rl.sh4").replace(/^demo\//, ""));
    const e = paq.entradas.find(x => x.nombre === nom + ".sdm"), ex = paq.entradas.find(x => x.nombre === nom + ".xmd");
    if (!e) throw new Error("no está " + nom);
    for (const pid of d?.sqt?.personajes || []) {
      const c = PC?.personajes?.[String(pid)];
      for (const a of [ c?.modelo?.archivo, c?.texturas?.archivo ]) if (a) bin(a).catch(() => {});
    }
    const extrasP = armarExtras(THREE, bajar, id);
    extrasP.catch(() => {});
    const [bs, bx] = await Promise.all([ paq.leer(e), ex && ex.len > 12 ? paq.leer(ex) : null ]);
    const sqt = leerSqt(bs), muestrear = crearMuestreador(sqt);
    const audio = bx ? decodificarXmd(new Uint8Array(bx)) : null;
    const personajes = [];
    for (let i = 0; i < sqt.modelos.length; i++) {
      const p = sqt.modelos[i], ent = {
        p: p,
        i: i,
        obj: null
      };
      const c = PC?.personajes?.[String(p.id)];
      if (c?.modelo?.archivo) {
        try {
          const buf = await bin(c.modelo.archivo), partes = partesBin(buf), mp = partes[c.modelo.parte];
          const m = mp?.tipo === "modelo" && leerModelo(buf, mp.ofs, mp.len);
          if (m && m.huesos.length >= p.nHuesos) {
            let t = [];
            if (c.texturas?.archivo) {
              const tb = await bin(c.texturas.archivo), tp = partesBin(tb)[c.texturas.parte];
              if (tp?.tipo === "texturas") t = leerTexturas(tb, tp.ofs, tp.len);
            }
            if (LUZ_JUEGO) {
              ent.uniformsLuz = crearUniformsLuz();
              ent.obj = crearPersonaje(m, t, {
                material: (tex, sp) => materialJuego(tex, sp, ent.uniformsLuz)
              });
            } else {
              ent.obj = crearPersonaje(m, t);
              for (const ma of ent.obj.mallas) ma.geometry.computeVertexNormals();
            }
            ocultarGrupos(p.id, m, ent.obj);
            if (ent.obj.sombraJuego) {
              const half = esHalfDemo(id), forzar = opcionesLuzPj().cine === "sala";
              sombraDemo(ent.obj, {
                id: id,
                luces: half || forzar ? "escena" : null,
                forzadas: !half && forzar
              });
            }
            ent.padres = m.huesos.map(h => h.padre);
            ent.bind = m.huesos.map(h => (new THREE.Matrix4).fromArray(h.matriz));
            if (esHenry(ent)) ent.ojo = prepararOjos(THREE, ent.bind, ent.padres);
            ent.obj.grupo.visible = false;
            grupo.add(ent.obj.grupo);
          }
        } catch (err) {
          console.warn("personaje", p.id, err.message);
        }
      }
      personajes.push(ent);
    }
    const luces = [];
    for (const p of sqt.luces) {
      const tipos = new Set;
      for (let f = 0; f < sqt.n; f += 10) {
        const b = sqt.ofr + f * sqt.tam + p.enCuadro;
        const c = p.claves.find(k => k.tipo === 134);
        if (c) tipos.add(sqt.dv.getInt32(b + c.ofs, true));
      }
      const l = {
        amb: null,
        dir: null,
        pun: null
      };
      if (tipos.has(1)) l.amb = new THREE.AmbientLight(16777215, 0);
      if (tipos.has(2) || tipos.has(5)) l.dir = new THREE.DirectionalLight(16777215, 0);
      if (tipos.has(3) || tipos.has(4) || tipos.has(6)) l.pun = new THREE.PointLight(16777215, 0, 0, 0);
      luces.push(l);
    }
    const banderas = d?.evento?.banderas || [];
    const sinFranjas = banderas.some(b => b.funcion === "DemoSetDontDrawBelt" && b.args?.[0] === 1);
    const subs = subtitulosDe(tablaSubs, id, mensajesPorPaquete);
    const extras = await extrasP;
    for (const x of extras) {
      x.grupo.visible = false;
      grupo.add(x.grupo);
    }
    const clip = d?.niebla_recorte?.clip > 0 ? d.niebla_recorte.clip * ESCALA : null;
    let ev = null, padreEv = null, off = [ 0, 0, 0 ];
    if (eventos) {
      await salasDemosListo;
      const ds = salasDemos?.demos?.[(d?.paquete || "demo/rl.sh4").replace(/^demo\//, "").slice(0, 2) + "/" + nom];
      off = ds?.desplazar || [ 0, 0, 0 ];
      padreEv = new THREE.Group;
      padreEv.name = "eventos_demo";
      aThree(off, padreEv.position);
      padreEv.visible = false;
      grupo.add(padreEv);
      const materialOkimono = LUZ_JUEGO ? () => {
        const u = crearUniformsLuz();
        return {
          u: u,
          material: (tex, sp) => materialJuego(tex, sp, u)
        };
      } : null;
      try {
        ev = await eventos.preparar(id, {
          sqt: sqt,
          personajes: personajes,
          padre: padreEv,
          sala: ds?.sala || "",
          materialOkimono: materialOkimono
        });
      } catch (err) {
        console.warn("eventos de la demo", id, err);
        ev = null;
      }
    }
    return {
      id: id,
      nom: nom,
      sqt: sqt,
      muestrear: muestrear,
      audio: audio,
      personajes: personajes,
      luces: luces,
      extras: extras,
      clip: clip,
      sinFranjas: sinFranjas,
      subs: subs,
      duracion: sqt.n / FPS,
      ev: ev,
      padreEv: padreEv,
      off: off
    };
  }
  const _qc = new THREE.Quaternion, _pOjo = new THREE.Vector3, _qOjo = new THREE.Quaternion, _camPlano = nuevaCamara(), _qPlano = new THREE.Quaternion;
  const CORTE_M = 40 * ESCALA, CORTE_DOT = .97, VISTA_ENTERA = THREE.MathUtils.degToRad(35), FOV_1RA = 60;
  function inclinacionPlano(D, f0) {
    const k = Math.max(0, Math.floor(f0));
    D._planos ??= new Map;
    if (D._planos.has(k)) return D._planos.get(k);
    let max = 0, px = 0, py = 0, pz = 0, r0 = 0, r1 = 0, r2 = 0, r3 = 1;
    for (let f = k; f < D.sqt.n; f++) {
      const c = leerCamara(D.sqt, f, _camPlano);
      if (f > k && (Math.hypot(c.pos[0] - px, c.pos[1] - py, c.pos[2] - pz) > 40 || Math.abs(c.rot[0] * r0 + c.rot[1] * r1 + c.rot[2] * r2 + c.rot[3] * r3) < CORTE_DOT)) break;
      [px, py, pz] = c.pos;
      [r0, r1, r2, r3] = c.rot;
      _qPlano.copy(_qJ).multiply(_q.set(r0, r1, r2, r3)).multiply(_qX);
      max = Math.max(max, Math.abs(inclinacion(THREE, _qPlano)));
    }
    D._planos.set(k, max);
    return max;
  }
  const henryOjos = D => D.sinFranjas ? null : D.personajes.find(e => e.ojo && e.obj) || null;
  const SIEMPRE_CAMARA = new Set([ 47, 53 ]);
  const SIEMPRE_PANTALLA_VR = new Set([ 53 ]);
  const esPOV = D => !D.sinFranjas && !D.personajes.some(e => esHenry(e));
  const leerElecciones = () => {
    try {
      return JSON.parse(localStorage.getItem("sh4camcine") || "{}");
    } catch {
      return {};
    }
  };
  const elecciones = leerElecciones();
  const quiereOjos = D => modoVR() ? modoVR() === "ojos" && !SIEMPRE_CAMARA.has(D.id) : D.id in elecciones ? elecciones[D.id] === "ojos" : SIEMPRE_CAMARA.has(D.id) ? false : primera();
  let demoEnCurso = null;
  function alternarCamara() {
    const D = demoEnCurso;
    if (!D || !henryOjos(D)) return;
    elecciones[D.id] = quiereOjos(D) ? "escena" : "ojos";
    try {
      localStorage.setItem("sh4camcine", JSON.stringify(elecciones));
    } catch {}
    botonCam.textContent = EN_CAM() ? quiereOjos(D) ? "CAMERA: EYES" : "CAMERA: SCENE" : quiereOjos(D) ? "CÁMARA: OJOS" : "CÁMARA: ESCENA";
  }
  addEventListener("keydown", e => {
    if (e.code === "KeyV" && demoEnCurso && !e.repeat) alternarCamara();
  });
  const botonCam = document.createElement("button");
  botonCam.style.cssText = "position:fixed;right:12px;top:12px;z-index:30;display:none;font:13px Georgia,serif;letter-spacing:.08em;" + "background:rgba(0,0,0,.55);color:#e8d9c4;border:1px solid #6a4a3a;padding:8px 12px;border-radius:4px";
  botonCam.addEventListener("click", e => {
    e.stopPropagation();
    alternarCamara();
  });
  document.body.appendChild(botonCam);
  let camMovil = (() => {
    try {
      return q.has("cinemovil") || localStorage.getItem("sh4camcineMovil") === "1";
    } catch {
      return false;
    }
  })();
  const off = {
    yaw: 0,
    pitch: 0
  }, _qOff = new THREE.Quaternion, _eOff = new THREE.Euler(0, 0, 0, "YXZ");
  const botonMov = botonCam.cloneNode();
  botonMov.style.right = "auto";
  botonMov.style.left = "12px";
  const rotuloMov = () => {
    botonMov.textContent = EN_CAM() ? camMovil ? "CAMERA: FREE (drag)" : "CAMERA: FIXED" : camMovil ? "CÁMARA: MÓVIL (arrastrá)" : "CÁMARA: FIJA";
  };
  botonMov.addEventListener("click", e => {
    e.stopPropagation();
    camMovil = !camMovil;
    off.yaw = off.pitch = 0;
    rotuloMov();
    try {
      localStorage.setItem("sh4camcineMovil", camMovil ? "1" : "0");
    } catch {}
  });
  document.body.appendChild(botonMov);
  let arrastre = null;
  const mover = (dx, dy, k) => {
    if (!camMovil || !demoEnCurso || M.enVR() || demoEnCurso.sinFranjas) return;
    off.yaw = THREE.MathUtils.clamp(off.yaw - dx * k, -Math.PI * .75, Math.PI * .75);
    off.pitch = THREE.MathUtils.clamp(off.pitch - dy * k, -1.1, 1.1);
  };
  addEventListener("pointerdown", e => {
    if (camMovil && demoEnCurso && e.target === M.renderer.domElement) arrastre = {
      x: e.clientX,
      y: e.clientY
    };
  });
  addEventListener("pointermove", e => {
    if (document.pointerLockElement) return mover(e.movementX, e.movementY, .0022);
    if (arrastre) {
      mover(e.clientX - arrastre.x, e.clientY - arrastre.y, .005);
      arrastre.x = e.clientX;
      arrastre.y = e.clientY;
    }
  });
  addEventListener("pointerup", () => {
    arrastre = null;
  });
  addEventListener("dblclick", () => {
    off.yaw = off.pitch = 0;
  });
  function mostrarBotonCam(D) {
    demoEnCurso = D;
    const hay = !!(D && henryOjos(D)) && !M.enVR();
    botonCam.style.display = hay ? "block" : "none";
    if (hay) botonCam.textContent = EN_CAM() ? quiereOjos(D) ? "CAMERA: EYES" : "CAMERA: SCENE" : quiereOjos(D) ? "CÁMARA: OJOS" : "CÁMARA: ESCENA";
    botonMov.style.display = D && !M.enVR() ? "block" : "none";
    off.yaw = off.pitch = 0;
    rotuloMov();
  }
  function visibilidadHenry(D) {
    if (!D._enCurso) return;
    for (const ent of D.personajes) if (ent.obj && esHenry(ent)) ent.obj.grupo.visible = !D._sinPers && !ocultarEnVR(ent, D) && !D._ver1ra;
  }
  function ponerCamara(D, S, t, corte) {
    const dt = D._tCam == null ? 0 : (t - D._tCam) / FPS;
    D._tCam = t;
    if (demoEnCurso !== D) mostrarBotonCam(D);
    const hen = quiereOjos(D) ? henryOjos(D) : null;
    if (!!hen !== D._ver1ra) {
      D._ver1ra = !!hen;
      visibilidadHenry(D);
      D._suave?.reiniciar();
      corte = true;
    }
    if (hen) {
      poseOjos(THREE, hen.ojo, hen.obj.huesos[HUESO_CABEZA].matrix, _pOjo, _qOjo);
      D._suave ??= crearSuavizado(THREE);
      if (D._suave.paso(_pOjo, _qOjo, dt)) corte = true;
      _p.copy(D._suave.p);
      _qc.copy(D._suave.q);
    } else {
      aThree(S.cam.pos, _p);
      _qc.copy(_qJ).multiply(_q.set(S.cam.rot[0], S.cam.rot[1], S.cam.rot[2], S.cam.rot[3])).multiply(_qX);
      if (D._camAnt && (D._camAnt.p.distanceTo(_p) > CORTE_M || Math.abs(D._camAnt.q.dot(_qc)) < CORTE_DOT)) corte = true;
    }
    D._camAnt ??= {
      p: new THREE.Vector3,
      q: new THREE.Quaternion
    };
    D._camAnt.p.copy(_p);
    D._camAnt.q.copy(_qc);
    if (M.enVR() && (modoVR() === "pantalla" || SIEMPRE_PANTALLA_VR.has(D.id)) && !hen && !D.sinFranjas) {
      D._vrAnt = true;
      pantalla.ver(_p, _qc, THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(S.cam.angulo / 2) / (4 / 3))));
    } else if (M.enVR()) {
      pantalla.sacar();
      const vista = vistaCineVR?.() ?? true;
      if (D._vrAnt !== true || D._vistaAnt !== vista) corte = true;
      D._vrAnt = true;
      D._vistaAnt = vista;
      if (corte || D._primerCuadro || !D._base) {
        D._base = {
          q: M.camara.quaternion.clone(),
          p: M.camara.position.clone()
        };
        D._pCorte = _p.clone();
        D._pisoCorte = pisoEn?.(_p) ?? _p.y - 1.65;
        D._vrEntero = !hen && (vista && !q.has("vrsoloplano") && inclinacionPlano(D, t) > VISTA_ENTERA || modoVR() === "ojos" && esPOV(D));
        D._primerCuadro = false;
        if (!hen && !vista) ubicarRig(THREE, M.jugador, D._base, _p, _qc, {
          soloGiro: true,
          y: D._pisoCorte
        });
      }
      if (hen) ubicarRig(THREE, M.jugador, D._base, _p, _qc, {
        soloGiro: true
      }); else if (D._vrEntero) ubicarRig(THREE, M.jugador, D._base, _p, _qc); else if (vista) ubicarRig(THREE, M.jugador, D._base, _p, _qc, {
        soloGiro: true,
        y: D._pisoCorte + (_p.y - D._pCorte.y)
      });
    } else {
      D._vrAnt = false;
      pantalla.sacar();
      M.jugador.position.set(0, 0, 0);
      M.jugador.rotation.set(0, 0, 0);
      M.camara.position.copy(_p);
      M.camara.quaternion.copy(_qc);
      if (camMovil && !D.sinFranjas && (off.yaw || off.pitch)) {
        _eOff.set(0, off.yaw, 0);
        M.camara.quaternion.premultiply(_qOff.setFromEuler(_eOff));
        _eOff.set(off.pitch, 0, 0);
        M.camara.quaternion.multiply(_qOff.setFromEuler(_eOff));
      }
      const asp = 4 / 3;
      const fov = hen ? FOV_1RA : THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(S.cam.angulo / 2) / asp));
      if (Math.abs(fov - M.camara.fov) > .001) {
        M.camara.fov = fov;
        M.camara.updateProjectionMatrix();
        ponerFranjas(conFranjas);
        M.anclarCapas();
      }
    }
    if (foco) {
      if (M.enVR() || hen) foco.apagar(); else foco.desdeCamara(S.cam);
    }
  }
  function aplicar(D, t, corte = false) {
    const S = D.muestrear(t, true);
    const lucesJ = LUZ_JUEGO ? lucesDelJuego(D.sqt, S) : null;
    D._lucesJ = lucesJ;
    for (const x of D.extras || []) x.actualizar(S.t);
    if (!LUZ_JUEGO) S.luces.forEach((s, i) => {
      const l = D.luces[i];
      if (!l) return;
      _col.setRGB(s.color[0], s.color[1], s.color[2], THREE.LinearSRGBColorSpace);
      const k = (s.params[0] || 0) * Math.PI;
      if (l.amb) {
        l.amb.color.copy(_col);
        l.amb.intensity = s.tipo === 1 ? k : 0;
      }
      if (l.dir) {
        l.dir.color.copy(_col);
        l.dir.intensity = s.tipo === 2 || s.tipo === 5 ? k : 0;
        _q.set(s.rot[0], s.rot[1], s.rot[2], s.rot[3]);
        _dir.set(0, 0, 1).applyQuaternion(_q);
        _dir.set(-_dir.x, -_dir.y, _dir.z);
        aThree(s.pos, l.dir.target.position);
        l.dir.position.copy(l.dir.target.position).addScaledVector(_dir, -1);
      }
      if (l.pun) {
        l.pun.color.copy(_col);
        l.pun.intensity = s.tipo === 3 || s.tipo === 4 || s.tipo === 6 ? k : 0;
        aThree(s.pos, l.pun.position);
      }
    });
    posarPersonajes(D, S, lucesJ);
    if (S.cam) ponerCamara(D, S, t, corte);
    return S;
  }
  function posarPersonajes(D, S, lucesJ) {
    for (const ent of D.personajes) {
      if (!ent.obj) continue;
      const po = S.poses[ent.i], hs = ent.obj.huesos;
      if (ent.uniformsLuz) aplicarLucesPersonaje(ent.uniformsLuz, lucesJ, po.tiene[0] ? aThree(po.pos, new THREE.Vector3) : null, ambienteSala?.() ?? null);
      for (let h = 0; h < hs.length; h++) {
        if (po.tiene[h]) {
          _p.fromArray(po.pos, h * 3);
          _q.fromArray(po.rot, h * 4);
          _s.fromArray(po.esc, h * 3);
          hs[h].matrix.compose(_p, _q, _s);
        } else {
          const pa = ent.padres[h];
          if (pa >= 0 && pa < h) hs[h].matrix.multiplyMatrices(hs[pa].matrix, _m.copy(ent.bind[pa]).invert()).multiply(ent.bind[h]); else hs[h].matrix.copy(ent.bind[h]);
        }
        hs[h].matrixWorldNeedsUpdate = true;
      }
    }
  }
  function posar(D, t) {
    const S = D.muestrear(t, true);
    const lucesJ = LUZ_JUEGO ? lucesDelJuego(D.sqt, S) : null;
    for (const x of D.extras || []) x.actualizar(S.t);
    posarPersonajes(D, S, lucesJ);
    return S;
  }
  function reproducir(D, {saltable: saltable = true, desde: desde = 0, hasta: hasta = null, alCuadro: alCuadro, mantener: mantener = false, sinAudio: sinAudio = false, sinPersonajes: sinPersonajes = false, sinSubtitulos: sinSubtitulos = false, subCentro: subCentro = false} = {}) {
    const lucesAntes = [];
    if (!LUZ_JUEGO) for (const l of D.luces) {
      if (l.amb) lucesGrupo.add(l.amb);
      if (l.dir) lucesGrupo.add(l.dir, l.dir.target);
      if (l.pun) lucesGrupo.add(l.pun);
    }
    for (const ent of D.personajes) if (ent.obj) ent.obj.grupo.visible = !sinPersonajes && !ocultarEnVR(ent, D);
    D._enCurso = true;
    D._sinPers = sinPersonajes;
    D._ver1ra = undefined;
    D._tCam = null;
    D._camAnt = null;
    D._base = null;
    D._vrAnt = undefined;
    D._suave?.reiniciar();
    const guardado = {
      pos: M.jugador.position.clone(),
      rot: M.jugador.rotation.clone(),
      cpos: M.camara.position.clone(),
      cq: M.camara.quaternion.clone(),
      fov: M.camara.fov,
      near: M.camara.near
    };
    const mirabaLibre = M.control.mirarLibre;
    if (D.clip && !M.enVR()) {
      M.camara.near = D.clip;
      M.camara.updateProjectionMatrix();
    }
    M.control.mirarLibre = false;
    ponerFranjas(q.has("franjas") && !D.sinFranjas);
    D._primerCuadro = true;
    const actx = M.contextoAudio();
    let fuente = null, t0Audio = null, t0 = performance.now();
    if (D.audio && actx && !sinAudio) try {
      const b = actx.createBuffer(D.audio.canales.length, D.audio.canales[0].length, D.audio.frecuencia);
      D.audio.canales.forEach((c, i) => b.copyToChannel(c, i));
      fuente = actx.createBufferSource();
      fuente.buffer = b;
      fuente.connect(actx.destination);
      t0Audio = actx.currentTime + .05;
      fuente.start(t0Audio, desde);
    } catch (e) {
      console.warn("audio de la demo", e);
      fuente = null;
      t0Audio = null;
    }
    const fin = hasta ?? D.duracion;
    let ultimoSub = null, tAnt = -1;
    D.seg = desde;
    if (D.ev) {
      const fx = fxDe();
      D.ev.fx = fx;
      D._tEv = null;
      if (fx?.raiz && (D.off[0] || D.off[1] || D.off[2])) {
        D._raizAntes = fx.raiz.position.clone();
        aThree(D.off, fx.raiz.position);
        fx.raiz.updateMatrixWorld(true);
      }
      if (D.padreEv) D.padreEv.visible = !sinPersonajes;
    }
    try {
      alEmpezar?.(D);
    } catch (e) {
      console.warn("alEmpezar", e);
    }
    return new Promise(ok => {
      const tarea = (dt, {acciones: acciones}) => {
        const seg = Math.min(mantener ? fin : Infinity, desde + (t0Audio !== null && actx.state === "running" ? actx.currentTime - t0Audio : (performance.now() - t0) / 1e3));
        const t = Math.max(0, Math.min(D.sqt.n - 1, seg * FPS));
        D.seg = seg;
        aplicar(D, t, false);
        alCuadro?.(seg);
        if (D.ev) {
          try {
            const P = eventos.cuadro(D.ev, t, D._tEv == null ? 0 : Math.max(0, (t - D._tEv) / FPS));
            D._tEv = t;
            capas.poner(P, {
              enVR: M.enVR(),
              franjas: conFranjas
            });
            if (P?.franjas != null && conFranjas) for (const fr of franjas) fr.visible = false;
            if (foco && D.id !== 47) foco.borroso(M.enVR() ? 0 : P?.borroso || 0);
            for (const o of D.ev.objetos) if (o.uniformsLuz) {
              o.centroLuz ??= (new THREE.Box3).setFromObject(o.grupo).getCenter(new THREE.Vector3);
              aplicarLucesPersonaje(o.uniformsLuz, D._lucesJ, o.centroLuz, ambienteSala?.() ?? null);
            }
          } catch (e) {
            console.warn("eventos", e);
          }
        }
        const f = Math.floor(t);
        if (f !== tAnt) {
          tAnt = f;
          const txt = D.subs.filter(s => f >= s.ini && f < s.fin).map(s => s.texto).join("\n");
          if (txt !== ultimoSub) {
            ultimoSub = txt;
            mostrarSub(txt, {
              centro: subCentro
            });
          }
        }
        const saltar = saltable && acciones.some(a => a === "aceptar" || a === "cancelar");
        if (seg >= fin && !mantener || saltar) {
          M.tareas.delete(tarea);
          try {
            fuente?.stop();
          } catch {}
          mostrarSub("");
          ponerFranjas(false);
          foco?.apagar();
          if (D.ev) {
            eventos.parar(D.ev);
            capas.quitar();
            if (D.padreEv) D.padreEv.visible = false;
            if (D._raizAntes && D.ev.fx?.raiz) {
              D.ev.fx.raiz.position.copy(D._raizAntes);
              D._raizAntes = null;
            }
          }
          D.seg = null;
          D._enCurso = false;
          mostrarBotonCam(null);
          pantalla.sacar();
          try {
            alTerminar?.(D, saltar);
          } catch (e) {
            console.warn("alTerminar", e);
          }
          for (const ent of D.personajes) if (ent.obj) ent.obj.grupo.visible = false;
          for (const x of D.extras || []) x.grupo.visible = false;
          lucesGrupo.clear();
          M.jugador.position.copy(guardado.pos);
          M.jugador.rotation.copy(guardado.rot);
          M.camara.position.copy(guardado.cpos);
          M.camara.quaternion.copy(guardado.cq);
          M.camara.fov = guardado.fov;
          M.camara.near = guardado.near;
          M.camara.updateProjectionMatrix();
          M.control.mirarLibre = mirabaLibre;
          ok(saltar);
        }
        return true;
      };
      M.tareas.add(tarea);
    });
  }
  function liberar(D) {
    for (const ent of D.personajes) {
      ent.obj?.grupo.removeFromParent();
      ent.obj?.dispose?.();
    }
    for (const x of D.extras || []) {
      x.grupo.removeFromParent();
      x.dispose?.();
    }
    if (D.ev) {
      eventos.terminar(D.ev);
      D.padreEv?.removeFromParent();
    }
  }
  return {
    abrir: abrir,
    reproducir: reproducir,
    liberar: liberar,
    aplicar: aplicar,
    posar: posar,
    grupo: grupo
  };
}
