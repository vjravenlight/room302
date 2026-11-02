// SH4 web — FeniXVOID · Project Ravenlight
import { crearComun, crearFabrica, instalarToneMapping, instalarSombraSuave } from "./material.js";

import { crearPost } from "./post.js";

import { PRESETS, VR, animoDe } from "./presets.js";

import { redondeo } from "../lib/suavizar_malla.js";

import { brilloPersonajes } from "../lib/sala.js";

import { idiomaActual } from "../textos_sitio.js";

const ESCALA = .005;

export function iniciarMejorado({THREE: THREE, renderer: renderer, escena: escena, camara: camara, sala: sala, info: info, redibujar: redibujar = () => {}, ui: ui = true}) {
  const q = new URLSearchParams(location.search);
  instalarToneMapping(THREE);
  if (!q.has("sombrathree")) instalarSombraSuave(THREE);
  const comun = crearComun(THREE);
  const fabrica = crearFabrica(THREE, comun);
  const post = crearPost(THREE, renderer, escena, camara);
  const luces = new THREE.Group;
  luces.name = "luces_mejorado";
  const previo = {
    toneMapping: renderer.toneMapping,
    exposicion: renderer.toneMappingExposure,
    sombras: renderer.shadowMap.enabled,
    tipo: renderer.shadowMap.type
  };
  const estado = {
    activo: false,
    preset: "pc-alta",
    linterna: false,
    animo: animoDe(""),
    piezas: [],
    puntuales: [],
    fuentes: [],
    dinamicos: 0,
    foco: 2,
    opciones: {
      dof: false,
      ao: true,
      bloom: true,
      halos: true,
      niebla: true,
      acabado: true,
      exposicion: 1,
      sombrasEscenario: false
    }
  };
  const conShader = (m, clave, f) => {
    m.onBeforeCompile = sh => {
      sh.fragmentShader = f(sh.fragmentShader);
    };
    m.customProgramCacheKey = () => clave;
    return m;
  };
  const recorte = f => f.replace("#include <alphatest_fragment>", "if ( diffuseColor.a < 0.5 ) discard;");
  const RECORTE = {
    dist: conShader(new THREE.MeshDistanceMaterial, "sh4recorteD", recorte),
    prof: conShader(new THREE.MeshDepthMaterial({
      depthPacking: THREE.RGBADepthPacking
    }), "sh4recorteP", recorte)
  };
  const cielo = new THREE.Mesh(new THREE.SphereGeometry(180, 32, 16), fabrica(null));
  cielo.material.side = THREE.BackSide;
  cielo.material.depthWrite = false;
  cielo.renderOrder = -10;
  cielo.frustumCulled = false;
  cielo.userData.sinAO = true;
  cielo.name = "cielo_mejorado";
  const linterna = new THREE.SpotLight(16773596, 60, 20, .42, .55, 2);
  linterna.position.set(.22, -.25, .05);
  linterna.target.position.set(.05, -.12, -2);
  linterna.castShadow = true;
  linterna.shadow.camera.near = .08;
  linterna.shadow.camera.far = 20;
  linterna.shadow.bias = -4e-4;
  linterna.shadow.normalBias = .02;
  linterna.name = "linterna_mejorado";
  linterna.userData.mejorado = true;
  function prepararPieza(m) {
    const u = m.userData;
    if (!u.matOriginal) return;
    const g = m.geometry;
    if (!g.attributes.normal) g.computeVertexNormals();
    if (!u.matMejorado) u.matMejorado = fabrica(u.matOriginal, {
      capa: u.grupo !== "normal" && !q.has("capasigual")
    });
    m.receiveShadow = true;
    m.castShadow = u.proyecta = u.grupo === "normal" || u.grupo === "transparente";
    if (u.grupo === "transparente" && u.tex) {
      m.customDistanceMaterial = RECORTE.dist;
      m.customDepthMaterial = RECORTE.prof;
    }
    estado.piezas.push(m);
  }
  const sm = renderer.shadowMap, renderSombrasOriginal = sm.render;
  let sombrasPendientes = false;
  sm.render = function(lights, scene, cam) {
    if (!estado.activo) return renderSombrasOriginal.call(this, lights, scene, cam);
    if (!sombrasPendientes) return;
    sombrasPendientes = false;
    const lin = lights.filter(l => l.isSpotLight), resto = lights.filter(l => !l.isSpotLight);
    if (lin.length) renderSombrasOriginal.call(this, lin, scene, cam);
    if (resto.length) {
      const sin = !estado.opciones.sombrasEscenario;
      if (sin) for (const m of estado.piezas) m.castShadow = false;
      renderSombrasOriginal.call(this, resto, scene, cam);
      if (sin) for (const m of estado.piezas) m.castShadow = m.userData.proyecta;
    }
  };
  function ponerMateriales() {
    for (const m of estado.piezas) {
      const u = m.userData;
      if (estado.activo && m.material === u.matOriginal) m.material = u.matMejorado; else if (!estado.activo && m.material === u.matMejorado) m.material = u.matOriginal;
    }
  }
  const tmp = new THREE.Vector3;
  const v3 = p => new THREE.Vector3(-p[0] * ESCALA, -p[1] * ESCALA, p[2] * ESCALA);
  const colorSRGB = c => (new THREE.Color).setRGB(c[0] / 255, c[1] / 255, c[2] / 255, THREE.SRGBColorSpace);
  function armarLuces() {
    luces.clear();
    estado.puntuales = [];
    estado.fuentes = [];
    const todas = info.luces || [];
    const sombra = todas.filter(l => l.banderas === 2 && l.tipo === 3).map(l => v3(l.pos));
    for (const l of todas) {
      if (!(l.banderas & 1)) continue;
      if (l.tipo === 1) {
        const a = new THREE.AmbientLight(colorSRGB(l.color), Math.PI);
        a.userData.base = Math.PI;
        luces.add(a);
      } else if (l.tipo === 2 || l.tipo === 5) {
        const d = new THREE.Vector3(-l.dir[0], -l.dir[1], l.dir[2]);
        if (d.lengthSq() < 1e-8) continue;
        const dl = new THREE.DirectionalLight(colorSRGB(l.color), Math.PI);
        dl.userData.base = Math.PI;
        dl.position.copy(d.normalize().multiplyScalar(-10));
        luces.add(dl, dl.target);
      } else if (l.tipo === 3 || l.tipo === 6) {
        const r = Math.max(.5, l.escala * ESCALA), pos = v3(l.pos);
        estado.fuentes.push({
          i: estado.fuentes.length,
          pos: pos,
          r: r,
          color: colorSRGB(l.color),
          intensidad: Math.PI * r * .25,
          gemela: sombra.some(s => Math.hypot(s.x - pos.x, s.z - pos.z) < 1.2)
        });
      }
    }
    const n = Math.min(estado.fuentes.length, PRESETS[estado.preset].maxPuntuales ?? Infinity);
    for (let k = 0; k < n; k++) {
      const pl = new THREE.PointLight(16777215, 1, 1, 1);
      pl.shadow.bias = -.002;
      pl.shadow.normalBias = .03;
      pl.shadow.radius = 2;
      luces.add(pl);
      estado.puntuales.push(pl);
    }
    const realce = new THREE.AmbientLight(16777215, 0);
    realce.userData.realcePj = true;
    realce.name = "realce de personajes (Opciones)";
    luces.add(realce);
    luces.traverse(o => {
      o.userData.mejorado = true;
    });
    ultimaAsignacion = "";
    asignarFuentes();
    aplicarBrillo(true);
  }
  let kPj = -1;
  function aplicarBrillo(forzar = false) {
    const k = brilloPersonajes();
    if (k === kPj && !forzar) return;
    kPj = k;
    comun.uniforms.uBrilloPj.value = k;
    luces.traverse(l => {
      if (!l.isLight) return;
      if (l.userData.realcePj) l.intensity = Math.max(0, k - 1) * .25 * Math.PI; else if (l.userData.base != null) l.intensity = l.userData.base * k;
    });
    for (const pl of estado.puntuales) if (pl.userData.fuente) pl.intensity = pl.userData.fuente.intensidad * k;
  }
  const henry3ra = () => {
    const h = window.sh4?.henry;
    return h?.modo === "3ra" && !renderer.xr.isPresenting && h.personaje?.grupo?.parent ? h : null;
  };
  const _ojos = new THREE.Vector3(0, 1.6, 0);
  function posRef(v) {
    const h = henry3ra();
    if (h) return h.personaje.grupo.getWorldPosition(v).add(_ojos);
    return camara.getWorldPosition(v);
  }
  const cercania = (f, p) => f.pos.distanceTo(p) - f.r - (f.gemela ? 2 : 0);
  let ultimaAsignacion = "";
  function asignarFuentes() {
    posRef(tmp);
    const elegidas = [ ...estado.fuentes ].sort((a, b) => cercania(a, tmp) - cercania(b, tmp)).slice(0, estado.puntuales.length).sort((a, b) => a.i - b.i);
    const clave = elegidas.map(f => f.i).join(",");
    if (clave === ultimaAsignacion) return false;
    ultimaAsignacion = clave;
    elegidas.forEach((f, k) => {
      const pl = estado.puntuales[k];
      pl.position.copy(f.pos);
      pl.color.copy(f.color);
      pl.intensity = f.intensidad * brilloPersonajes();
      pl.distance = f.r;
      pl.shadow.camera.near = Math.min(.35, f.r * .2);
      pl.shadow.camera.far = f.r;
      pl.shadow.camera.updateProjectionMatrix();
      pl.shadow.needsUpdate = true;
      pl.userData.fuente = f;
    });
    return true;
  }
  let ultimaEleccion = "";
  function elegirSombras(forzar) {
    const P = PRESETS[estado.preset];
    posRef(tmp);
    const orden = [ ...estado.puntuales ].sort((a, b) => cercania(a.userData.fuente, tmp) - cercania(b.userData.fuente, tmp));
    const k = estado.dinamicos > 0 || estado.opciones.sombrasEscenario ? P.sombras.puntuales : 0;
    const elegidas = new Set(orden.slice(0, k));
    const clave = orden.slice(0, k).map(l => l.id).join(",") + "|" + ultimaAsignacion;
    if (clave === ultimaEleccion && !forzar) return;
    ultimaEleccion = clave;
    for (const l of estado.puntuales) {
      l.castShadow = elegidas.has(l);
      if (l.castShadow) {
        if (l.shadow.mapSize.x !== P.sombras.tamPuntual) {
          l.shadow.mapSize.set(P.sombras.tamPuntual, P.sombras.tamPuntual);
          l.shadow.map?.dispose();
          l.shadow.map = null;
        }
        l.shadow.radius = P.sombras.radio ?? 1;
        l.shadow.autoUpdate = !P.sombras.estaticas || estado.dinamicos > 0;
        l.shadow.needsUpdate = true;
      }
    }
  }
  function ponerNiebla() {
    estado.nieblaSala = null;
    for (const m of estado.piezas) {
      const ns = m.userData.matOriginal?.userData?.salaNiebla;
      if (ns) {
        estado.nieblaSala = ns;
        break;
      }
    }
    const n = info.niebla, u = comun.uniforms;
    if (!n || !(n.lejos > n.cerca)) {
      u.uNieblaRango.value.set(0, 1e9, 0, 0);
      return;
    }
    u.uNieblaColor.value.copy(colorSRGB(n.color));
    u.uNieblaRango.value.set(n.cerca * ESCALA, n.lejos * ESCALA, n.potCerca / 128, n.potLejos / 128);
  }
  const mios = new Set, dinamicos = new Set, autosombra = q.has("autosombra");
  function sinVueltaDeNormal(m) {
    if (m.userData.sh4SinVuelta || q.has("conparches") || !(m.isMeshLambertMaterial || m.isMeshStandardMaterial || m.isMeshPhongMaterial)) return;
    m.userData.sh4SinVuelta = true;
    const antes = m.onBeforeCompile, clave = m.customProgramCacheKey;
    m.onBeforeCompile = function(sh, r) {
      antes?.call(this, sh, r);
      sh.fragmentShader = sh.fragmentShader.replace("#include <normal_fragment_begin>", "#include <normal_fragment_begin>\n#ifdef DOUBLE_SIDED\n\tnormal *= faceDirection;\n#endif");
    };
    m.customProgramCacheKey = function() {
      return clave.call(this) + "|sh4SinVuelta";
    };
    m.needsUpdate = true;
  }
  function buscarDinamicos() {
    let n = 0;
    escena.traverse(o => {
      if (o.isLight && !o.userData.mejorado && o.visible && estado.activo && !apagadas.has(o)) {
        o.visible = false;
        apagadas.add(o);
        return;
      }
      if (!o.isMesh || mios.has(o) || o.userData.matOriginal || o.userData.sinSombra) return;
      if (!o.userData.sombra && !proyectaSombra(o)) return;
      o.castShadow = true;
      o.receiveShadow = estado.linterna || autosombra;
      const mats = Array.isArray(o.material) ? o.material : [ o.material ];
      for (const m of mats) if (m && m.side === THREE.DoubleSide) {
        if (m.shadowSide == null) m.shadowSide = THREE.BackSide;
        sinVueltaDeNormal(m);
      }
      dinamicos.add(o);
      n++;
    });
    if (n !== estado.dinamicos) {
      estado.dinamicos = n;
      elegirSombras(true);
    }
  }
  function proyectaSombra(o) {
    if (o.renderOrder >= 900 || o.isSprite || o.isPoints) return false;
    const mats = Array.isArray(o.material) ? o.material : [ o.material ];
    return mats.every(m => m && (m.isMeshLambertMaterial || m.isMeshStandardMaterial || m.isMeshPhongMaterial || m.isMeshToonMaterial) && m.blending === THREE.NormalBlending && !(m.transparent && (!m.depthWrite || m.opacity < .9)));
  }
  const apagadas = new Set;
  function apagarAjenas(si) {
    if (si) escena.traverse(o => {
      if (o.isLight && !o.userData.mejorado && o.visible) {
        o.visible = false;
        apagadas.add(o);
      }
    }); else {
      for (const o of apagadas) o.visible = true;
      apagadas.clear();
    }
  }
  function aplicarUniforms(enVR) {
    const P = PRESETS[estado.preset], A = estado.animo, u = comun.uniforms, o = estado.opciones;
    const sinPost = !P.post || enVR;
    u.uFuerzaSombra.value = A.sombra;
    u.uRelieve.value = A.relieve;
    u.uNiebla.value = o.niebla ? 1 : 0;
    const ns = estado.nieblaSala;
    if (ns) {
      u.uNieblaJuego.value.copy(ns.uSalaNiebla.value);
      const c = ns.uSalaNieblaColor.value;
      u.uNieblaJuegoColor.value.set(c.r, c.g, c.b);
    } else u.uNieblaJuego.value.w = 0;
    u.uRealce.value = o.realce ?? A.realce;
    u.uLevantar.value = o.levantar ?? A.levantar;
    u.uHalo.value = o.halos && P.halos ? .08 * A.halo * P.halo : 0;
    u.uVineta.value = sinPost && o.acabado ? VR.vineta * (A.vineta / .4) : 0;
    u.uGrano.value = sinPost && o.acabado ? VR.granoMat * (A.grano / .06) : 0;
    u.uBrillo.value.set(sinPost ? VR.brillo[0] : 10, sinPost ? VR.brillo[1] : 0);
    u.uLinterna.value = estado.linterna ? 1 : 0;
    u.uAlbedo.value = A.nombre === "otro mundo" ? 1 : .8;
  }
  function configurarPreset() {
    const P = PRESETS[estado.preset];
    if (estado.puntuales.length !== Math.min(estado.fuentes.length, P.maxPuntuales ?? Infinity)) armarLuces();
    renderer.shadowMap.type = P.sombras.tipo === "PCFSoft" ? THREE.PCFSoftShadowMap : THREE.PCFShadowMap;
    linterna.shadow.mapSize.set(P.sombras.tamLinterna, P.sombras.tamLinterna);
    linterna.shadow.map?.dispose();
    linterna.shadow.map = null;
    const halos = P.halos ? 1 : 0;
    if (comun.defines.HALOS !== halos) {
      comun.defines.HALOS = halos;
      for (const m of estado.piezas) m.userData.matMejorado.needsUpdate = true;
      cielo.material.needsUpdate = true;
    }
    if (P.post) {
      const o = estado.opciones;
      post.configurar({
        ...P,
        ao: o.ao ? P.ao : null,
        bloom: o.bloom ? P.bloom : null,
        dof: o.dof ? P.dof || {
          apertura: .004,
          maximo: .006
        } : null
      });
    }
    if (P.foveacion !== undefined) renderer.xr.setFoveation?.(P.foveacion);
    elegirSombras(true);
    redibujar();
  }
  function activar(si = true) {
    si = !!si;
    if (si === estado.activo) return estado.activo;
    estado.activo = si;
    if (si) {
      renderer.shadowMap.enabled = true;
      renderer.toneMapping = THREE.CustomToneMapping;
      renderer.toneMappingExposure = estado.opciones.exposicion;
      apagarAjenas(true);
      escena.add(luces);
      escena.add(cielo);
      camara.add(linterna);
      camara.add(linterna.target);
      configurarPreset();
    } else {
      escena.remove(luces);
      escena.remove(cielo);
      linterna.removeFromParent();
      linterna.target.removeFromParent();
      apagarAjenas(false);
      renderer.toneMapping = previo.toneMapping;
      renderer.toneMappingExposure = previo.exposicion;
      renderer.shadowMap.enabled = previo.sombras;
      renderer.shadowMap.type = previo.tipo;
    }
    linterna.visible = estado.linterna;
    ponerMateriales();
    redondeo.seguirMejorado(si && PRESETS[estado.preset].redondear !== false);
    actualizarUI();
    redibujar();
    return estado.activo;
  }
  function preset(nombre) {
    if (!PRESETS[nombre]) return estado.preset;
    estado.preset = nombre;
    if (estado.activo) configurarPreset();
    redondeo.seguirMejorado(estado.activo && PRESETS[nombre].redondear !== false);
    actualizarUI();
    return nombre;
  }
  function alCargarSala() {
    estado.piezas = [];
    sala.traverse(prepararPieza);
    estado.animo = animoDe(info.sala);
    armarLuces();
    linterna.visible = estado.linterna;
    ponerNiebla();
    mios.clear();
    mios.add(cielo);
    dinamicos.clear();
    ultimaEleccion = "";
    estado.dinamicos = -1;
    buscarDinamicos();
    if (estado.activo) {
      apagarAjenas(true);
      configurarPreset();
    }
    ponerMateriales();
    redibujar();
  }
  const reloj = {
    dinamicos: 0,
    sombras: 0,
    foco: 0
  };
  const rayo = new THREE.Raycaster, centro = new THREE.Vector2;
  function alDibujar(dt = 1 / 60) {
    if (!estado.activo) return false;
    ponerMateriales();
    const enVR = renderer.xr.isPresenting;
    aplicarUniforms(enVR);
    aplicarBrillo();
    ponerLinterna();
    comun.uniforms.uTiempo.value += dt;
    if ((reloj.dinamicos += dt) > .5) {
      reloj.dinamicos = 0;
      buscarDinamicos();
    }
    if ((reloj.sombras += dt) > 1) {
      reloj.sombras = 0;
      asignarFuentes();
      elegirSombras(false);
    }
    sombrasPendientes = true;
    const P = PRESETS[estado.preset];
    if (!P.post || enVR) return false;
    let foco = null;
    if (estado.opciones.dof && (reloj.foco += dt) > .15) {
      reloj.foco = 0;
      rayo.setFromCamera(centro, camara);
      rayo.far = 60;
      const h = rayo.intersectObjects(estado.piezas, false)[0];
      estado.foco += ((h ? h.distance : 30) - estado.foco) * .5;
      foco = estado.foco;
    }
    const A = estado.animo, o = estado.opciones;
    post.dibujar(dt, o.acabado ? A : {
      aberracion: 0,
      vineta: 0,
      grano: 0,
      saturacion: 1,
      contraste: 1
    }, foco);
    return true;
  }
  const _lp = new THREE.Vector3, _lt = new THREE.Vector3;
  function ponerLinterna() {
    if (!estado.linterna) return;
    const h = henry3ra();
    linterna.intensity = h ? 30 : 60;
    if (h) {
      if (linterna.parent !== luces) {
        luces.add(linterna);
        luces.add(linterna.target);
      }
      const g = h.personaje.grupo;
      g.updateMatrixWorld();
      linterna.position.copy(_lp.set(-.16, 1.15, .28).applyMatrix4(g.matrixWorld));
      linterna.target.position.copy(_lt.set(-.05, .55, 4).applyMatrix4(g.matrixWorld));
    } else if (linterna.parent !== camara) {
      camara.add(linterna);
      camara.add(linterna.target);
      linterna.position.set(.22, -.25, .05);
      linterna.target.position.set(.05, -.12, -2);
    }
  }
  function linternaSi(si = !estado.linterna) {
    estado.linterna = !!si;
    linterna.visible = estado.linterna && estado.activo;
    for (const o of dinamicos) o.receiveShadow = estado.linterna || autosombra;
    actualizarUI();
    redibujar();
    return estado.linterna;
  }
  function opciones(cambios = {}) {
    Object.assign(estado.opciones, cambios);
    renderer.toneMappingExposure = estado.activo ? estado.opciones.exposicion : previo.exposicion;
    if (estado.activo) configurarPreset();
    return {
      ...estado.opciones
    };
  }
  let actualizarUI = () => {};
  if (ui && typeof document !== "undefined") {
    const css = document.createElement("style");
    css.textContent = `#mejorado { position: fixed; right: 10px; bottom: 10px; background: rgba(0,0,0,.65); border: 1px solid #3a302a;\n      padding: 6px 8px; font: 13px Georgia, serif; color: #c9c2b6; display: flex; gap: 6px; align-items: center; }\n      #mejorado button, #mejorado select { font: inherit; background: #1a1412; color: #c9c2b6; border: 1px solid #4a3c34; padding: 2px 6px; cursor: pointer; }\n      #mejorado button.si { background: #4a2a1c; border-color: #b59c7a; }`;
    document.head.appendChild(css);
    const div = document.createElement("div");
    div.id = "mejorado";
    const T = () => idiomaActual() === "s" ? {
      orig: "Original",
      mej: "Mejorado",
      lin: "Linterna",
      p: {}
    } : {
      orig: "Original",
      mej: "Enhanced",
      lin: "Flashlight",
      p: {
        "pc-alta": "PC high quality",
        "pc-media": "PC medium quality",
        quest: "Quest (VR)"
      }
    };
    div.innerHTML = `<button id="mejModo" title="M">Original</button>\n      <select id="mejPreset">${Object.entries(PRESETS).map(([k, p]) => `<option value="${k}">${p.nombre}</option>`).join("")}</select>\n      <button id="mejLinterna" title="L">Linterna</button>`;
    document.body.appendChild(div);
    const b = div.querySelector("#mejModo"), s = div.querySelector("#mejPreset"), l = div.querySelector("#mejLinterna");
    b.onclick = () => activar(!estado.activo);
    s.onchange = () => preset(s.value);
    l.onclick = () => linternaSi();
    addEventListener("keydown", e => {
      if (e.target?.tagName === "INPUT" || e.target?.tagName === "SELECT") return;
      if (e.code === "KeyM") activar(!estado.activo);
      if (e.code === "KeyL") linternaSi();
    });
    actualizarUI = () => {
      const t = T();
      b.textContent = estado.activo ? t.mej : t.orig;
      b.classList.toggle("si", estado.activo);
      l.textContent = t.lin;
      for (const o of s.options) o.textContent = t.p[o.value] || PRESETS[o.value]?.nombre || o.value;
      s.value = estado.preset;
      s.disabled = !estado.activo;
      l.classList.toggle("si", estado.linterna);
      l.disabled = !estado.activo;
    };
    actualizarUI();
    addEventListener("sh4idioma", () => actualizarUI());
    if (q.has("limpio")) div.style.display = "none";
  }
  if (q.has("linterna")) estado.linterna = true;
  if (PRESETS[q.get("mejorado")]) estado.preset = q.get("mejorado"); else if (!q.get("mejorado") && /OculusBrowser|Quest/i.test(navigator.userAgent)) estado.preset = "quest";
  function medir(n = 30) {
    const gl = renderer.getContext(), px = new Uint8Array(4);
    const dibujar = () => {
      if (!alDibujar(1 / 60)) renderer.render(escena, camara);
    };
    dibujar();
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    const t0 = performance.now();
    for (let i = 0; i < n; i++) dibujar();
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    const ms = (performance.now() - t0) / n;
    const r = renderer.info.render;
    return {
      ms: +ms.toFixed(2),
      llamadas: r.calls,
      triangulos: r.triangles,
      programas: renderer.info.programs?.length,
      sombrasPuntuales: estado.puntuales.filter(l => l.castShadow).length,
      linterna: estado.linterna,
      preset: estado.preset,
      activo: estado.activo
    };
  }
  const api = {
    activar: activar,
    preset: preset,
    alCargarSala: alCargarSala,
    alDibujar: alDibujar,
    linterna: linternaSi,
    opciones: opciones,
    medir: medir,
    get activo() {
      return estado.activo;
    },
    estado: estado,
    uniforms: comun.uniforms,
    post: post,
    luces: luces,
    presets: PRESETS,
    material: (orig, op) => fabrica(orig, op)
  };
  if (q.has("mejorado")) queueMicrotask(() => activar(true));
  return api;
}
