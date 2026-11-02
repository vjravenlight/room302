// SH4 web — FeniXVOID · Project Ravenlight
import * as THREE from "three";

import { crearMp4 } from "./lib/mp4.js";

import { VS, FS_EQUI, CARAS, descargar } from "./fotos.js";

import { NIEBLA_RADIAL } from "./lib/niebla_radial.js";

import { factorNiebla } from "./lib/sala.js";

import { gammaDeNivel } from "./lib/brillo.js";

import { leerOpciones } from "./opciones_sitio.js";

import { sitioIngles } from "./textos_sitio.js";

export const FORMATOS = {
  "4k": {
    tam: [ 3840, 2160 ],
    nombre: "4K (3840×2160)"
  },
  1080: {
    tam: [ 1920, 1080 ],
    nombre: "1080p (1920×1080)"
  },
  "9x16": {
    tam: [ 1080, 1920 ],
    nombre: "Vertical 9:16 (1080×1920: Instagram, TikTok, Shorts)",
    vertical: true
  },
  "360-4k": {
    tam: [ 4096, 2048 ],
    nombre: "360° 4K (4096×2048)",
    es360: true
  },
  "360-2k": {
    tam: [ 2048, 1024 ],
    nombre: "360° 2K (2048×1024, de prueba)",
    es360: true
  }
};

const EN = {
  "VIDEO DE LA CINEMÁTICA": "CUTSCENE VIDEO",
  "Tamaño": "Size",
  "Cuadros por segundo": "Frames per second",
  "30 (como el juego)": "30 (like the game)",
  "60 (más suave)": "60 (smoother)",
  Imagen: "Picture",
  "4:3 con bordes (como el juego)": "4:3 with side bars (like the game)",
  "16:9 completa": "Full 16:9",
  Encuadre: "Framing",
  "El centro (mismo zoom)": "Center (same zoom)",
  "Completa, con negro arriba y abajo": "Whole picture, black above and below",
  "Más alta (se ve más techo y piso)": "Taller (more ceiling and floor)",
  Niebla: "Fog",
  "Como el juego": "Like the game",
  "Suave (la mitad)": "Light (half)",
  "Sin niebla": "No fog",
  "Cámara": "Camera",
  "La de la escena": "Scene camera",
  "Ojos de Henry": "Henry's eyes",
  "La vista libre (quieta)": "Free view (still)",
  "La del modo foto (la última)": "Photo mode camera (last one)",
  "Subtítulos": "Subtitles",
  "Franjas de cine": "Cinema bars",
  Sonido: "Sound",
  "Desde el cuadro": "From frame",
  "Hasta el cuadro": "To frame",
  "acá": "here",
  todo: "all",
  GENERAR: "MAKE VIDEO",
  Cerrar: "Close",
  Cancelar: "Cancel"
};

const tr = t => sitioIngles() ? EN[t] ?? t : t;

const dos = n => String(n).padStart(2, "0");

const reloj = s => `${Math.floor(s / 60)}:${dos(Math.floor(s % 60))}`;

export function prepararVideoCine(ctx) {
  const {C: C, renderer: renderer, escena: escena, $: $} = ctx;
  const est = {
    activo: false,
    cancelar: false,
    ultimo: null,
    progreso: null
  };
  const css = document.createElement("style");
  css.textContent = `\n    #videoCine, #videoAvance { position: fixed; left: 50%; top: 50%; transform: translate(-50%, -50%); z-index: 90; display: none;\n      background: rgba(8,5,4,.92); border: 1px solid rgba(122,59,30,.85); border-radius: 6px; padding: 14px 16px; color: #ece3d2;\n      font: 14px/1.5 Georgia, serif; width: min(440px, calc(100vw - 32px)); box-sizing: border-box; }\n    #videoCine.abierto, #videoAvance.abierto { display: block; }\n    #videoCine h3 { margin: 0 0 8px; font: 15px Georgia, serif; letter-spacing: .12em; text-align: center; color: #f0e4d2; }\n    #videoCine .vFila { display: flex; gap: 8px; align-items: center; margin: 6px 0; flex-wrap: wrap; }\n    #videoCine .vFila > span { flex: 0 0 150px; color: #a89c8c; font-size: 13px; }\n    #videoCine select, #videoCine input[type=number] { font: inherit; background: #1a1412; color: #ece3d2; border: 1px solid #4a3c34; padding: 2px 6px; }\n    #videoCine input[type=number] { width: 72px; }\n    #videoCine button, #videoAvance button { font: inherit; background: rgba(10,7,6,.7); color: #ece3d2; border: 1px solid rgba(122,59,30,.7);\n      border-radius: 4px; padding: 3px 12px; cursor: pointer; }\n    #videoCine button.fuerte { background: rgba(140,26,18,.8); border-color: #c0261a; letter-spacing: .1em; }\n    #videoCine .vPie { display: flex; justify-content: center; gap: 10px; margin-top: 10px; }\n    #videoCine .vNota { color: #8f857a; font-size: 12px; margin-top: 6px; text-align: center; }\n    #videoAvance { top: auto; bottom: 70px; transform: translateX(-50%); text-align: center; }\n    #videoAvance .vBarra { height: 8px; background: #1a1412; border: 1px solid #4a3c34; margin: 8px 0; }\n    #videoAvance .vBarra > div { height: 100%; width: 0; background: #8a2a1e; }`;
  document.head.appendChild(css);
  const panel = document.createElement("div");
  panel.id = "videoCine";
  panel.innerHTML = `<h3>${tr("VIDEO DE LA CINEMÁTICA")}</h3>\n    <div class="vFila"><span>${tr("Tamaño")}</span><select data-o="formato">${Object.entries(FORMATOS).map(([k, f]) => `<option value="${k}">${f.nombre}</option>`).join("")}</select></div>\n    <div class="vFila"><span>${tr("Cuadros por segundo")}</span><select data-o="fps"><option value="30">${tr("30 (como el juego)")}</option><option value="60">${tr("60 (más suave)")}</option></select></div>\n    <div class="vFila" data-solo="plano"><span>${tr("Imagen")}</span><select data-o="imagen"><option value="43">${tr("4:3 con bordes (como el juego)")}</option><option value="169">${tr("16:9 completa")}</option></select></div>\n    <div class="vFila" data-solo="vertical"><span>${tr("Encuadre")}</span><select data-o="encuadre"><option value="centro">${tr("El centro (mismo zoom)")}</option><option value="completa">${tr("Completa, con negro arriba y abajo")}</option><option value="alta">${tr("Más alta (se ve más techo y piso)")}</option></select></div>\n    <div class="vFila"><span>${tr("Niebla")}</span><select data-o="niebla"><option value="juego">${tr("Como el juego")}</option><option value="suave">${tr("Suave (la mitad)")}</option><option value="sin">${tr("Sin niebla")}</option></select></div>\n    <div class="vFila"><span>${tr("Cámara")}</span><select data-o="camara"><option value="escena">${tr("La de la escena")}</option><option value="ojos">${tr("Ojos de Henry")}</option><option value="libre">${tr("La vista libre (quieta)")}</option><option value="foto">${tr("La del modo foto (la última)")}</option></select></div>\n    <div class="vFila"><label><input type="checkbox" data-o="subtitulos"> ${tr("Subtítulos")}</label><label data-solo="plano"><input type="checkbox" data-o="franjas"> ${tr("Franjas de cine")}</label><label><input type="checkbox" data-o="sonido" checked> ${tr("Sonido")}</label></div>\n    <div class="vFila"><span>${tr("Desde el cuadro")}</span><input type="number" data-o="desde" min="0" step="1"><button data-b="desdeAca">${tr("acá")}</button><button data-b="todo">${tr("todo")}</button></div>\n    <div class="vFila"><span>${tr("Hasta el cuadro")}</span><input type="number" data-o="hasta" min="0" step="1"><button data-b="hastaAca">${tr("acá")}</button></div>\n    <div class="vNota" data-nota></div>\n    <div class="vPie"><button class="fuerte" data-b="generar">${tr("GENERAR")}</button><button data-b="cerrar">${tr("Cerrar")}</button></div>`;
  document.body.appendChild(panel);
  const avance = document.createElement("div");
  avance.id = "videoAvance";
  avance.innerHTML = '<div data-t></div><div class="vBarra"><div></div></div><button data-b="cancelar">' + tr("Cancelar") + "</button>";
  document.body.appendChild(avance);
  const campo = k => panel.querySelector(`[data-o="${k}"]`);
  const leer = () => ({
    formato: campo("formato").value,
    fps: +campo("fps").value,
    imagen: campo("imagen").value,
    camara: campo("camara").value,
    encuadre: campo("encuadre").value,
    niebla: campo("niebla").value,
    subtitulos: campo("subtitulos").checked,
    franjas: campo("franjas").checked,
    sonido: campo("sonido").checked,
    desde: Math.max(0, Math.floor(+campo("desde").value || 0)),
    hasta: Math.floor(+campo("hasta").value || 0)
  });
  function nota() {
    const o = leer(), f = FORMATOS[o.formato];
    for (const el of panel.querySelectorAll('[data-solo="plano"]')) el.style.display = f.es360 || f.vertical ? "none" : "";
    for (const el of panel.querySelectorAll('[data-solo="vertical"]')) el.style.display = f.vertical ? "" : "none";
    const fin = Math.min(o.hasta, (C.sqt?.n || 1) - 1), seg = Math.max(0, fin - o.desde) / ctx.FPS;
    const mb = Math.round(seg * bitrate(f.tam, o.fps) / 8e6);
    const cuadros = Math.round(seg * o.fps), lento = f.tam[0] * f.tam[1] / (3840 * 2160) * (f.es360 ? 1.1 : 1);
    panel.querySelector("[data-nota]").textContent = sitioIngles() ? `${reloj(seg)} of video · ${cuadros} frames · about ${mb} MB · it takes about ${reloj(cuadros * lento / 13)} (estimate)` : `${reloj(seg)} de video · ${cuadros} cuadros · unos ${mb} MB · tarda más o menos ${reloj(cuadros * lento / 13)} (estimado)`;
    campo("camara").querySelector('[value="foto"]').disabled = !ctx.fotoCam();
    if (f.es360 && o.fps === 60) panel.querySelector("[data-nota]").textContent += sitioIngles() ? " · for Facebook, 30 fps is safer" : " · para Facebook conviene 30 cuadros";
  }
  const CLAVE = "sh4videoCine";
  const guardar = () => {
    try {
      const o = leer();
      localStorage.setItem(CLAVE, JSON.stringify({
        formato: o.formato,
        fps: o.fps,
        imagen: o.imagen,
        encuadre: o.encuadre,
        niebla: o.niebla,
        sonido: o.sonido
      }));
    } catch {}
  };
  const recordado = () => {
    try {
      return JSON.parse(localStorage.getItem(CLAVE) || "{}");
    } catch {
      return {};
    }
  };
  panel.addEventListener("input", () => {
    nota();
    guardar();
  });
  panel.addEventListener("click", e => {
    const b = e.target.closest("button[data-b]");
    if (!b) return;
    const f = b.dataset.b;
    if (f === "cerrar") cerrar(); else if (f === "desdeAca") {
      campo("desde").value = Math.floor(C.t);
      nota();
    } else if (f === "hastaAca") {
      campo("hasta").value = Math.floor(C.t);
      nota();
    } else if (f === "todo") {
      campo("desde").value = 0;
      campo("hasta").value = C.sqt.n - 1;
      nota();
    } else if (f === "generar") {
      const o = leer();
      cerrar();
      generar(o).catch(err => console.warn("video", err));
    }
  });
  avance.querySelector('[data-b="cancelar"]').addEventListener("click", () => {
    est.cancelar = true;
  });
  panel.addEventListener("keydown", e => {
    if (e.key === "Escape") {
      e.stopPropagation();
      cerrar();
    }
  });
  function abrir() {
    if (!C.sqt || est.activo || renderer.xr.isPresenting) return false;
    ctx.pausar();
    campo("desde").value = 0;
    campo("hasta").value = C.sqt.n - 1;
    const r = recordado();
    campo("formato").value = FORMATOS[r.formato] ? r.formato : "4k";
    campo("fps").value = r.fps === 60 ? "60" : "30";
    if (r.imagen) campo("imagen").value = r.imagen === "169" ? "169" : "43";
    campo("encuadre").value = [ "centro", "completa", "alta" ].includes(r.encuadre) ? r.encuadre : "centro";
    campo("niebla").value = [ "juego", "suave", "sin" ].includes(r.niebla) ? r.niebla : "juego";
    campo("sonido").checked = r.sonido !== false;
    campo("camara").value = $("modo").value === "libre" ? "libre" : $("primera").checked ? "ojos" : "escena";
    campo("subtitulos").checked = $("subs").value !== "no";
    campo("franjas").checked = $("franjas").checked;
    if (!r.imagen) campo("imagen").value = $("ancho").checked ? "169" : "43";
    panel.classList.add("abierto");
    nota();
    return true;
  }
  function cerrar() {
    panel.classList.remove("abierto");
  }
  function bitrate([w, h], fps) {
    return Math.round(w * h * fps * (w * h > 3e6 ? .18 : .26));
  }
  async function configVideo(w, h, fps) {
    const codecs = w * h > 1920 * 1088 ? [ "avc1.640034", "avc1.640033", "avc1.4d0034" ] : [ "avc1.64002a", "avc1.640028", "avc1.4d0028" ];
    for (const acel of [ "prefer-hardware", "no-preference" ]) for (const codec of codecs) {
      const c = {
        codec: codec,
        width: w,
        height: h,
        bitrate: bitrate([ w, h ], fps),
        framerate: fps,
        avc: {
          format: "avc"
        },
        hardwareAcceleration: acel,
        latencyMode: "quality"
      };
      try {
        if ((await VideoEncoder.isConfigSupported(c)).supported) return c;
      } catch {}
    }
    return null;
  }
  async function sonido48(desde, dur) {
    const a = C.audio;
    if (!a?.canales?.length) return null;
    const ch = Math.min(2, a.canales.length), n = Math.ceil(dur * 48e3);
    const off = new OfflineAudioContext(ch, Math.max(1, n), 48e3);
    const b = off.createBuffer(ch, a.canales[0].length, a.frecuencia);
    for (let i = 0; i < ch; i++) b.copyToChannel(a.canales[i], i);
    const src = off.createBufferSource();
    src.buffer = b;
    src.connect(off.destination);
    src.start(0, Math.min(desde, b.duration));
    return off.startRendering();
  }
  function wav(buf) {
    const ch = buf.numberOfChannels, n = buf.length, d = new DataView(new ArrayBuffer(44 + n * ch * 2));
    const s = (o, t) => {
      for (let i = 0; i < t.length; i++) d.setUint8(o + i, t.charCodeAt(i));
    };
    s(0, "RIFF");
    d.setUint32(4, 36 + n * ch * 2, true);
    s(8, "WAVEfmt ");
    d.setUint32(16, 16, true);
    d.setUint16(20, 1, true);
    d.setUint16(22, ch, true);
    d.setUint32(24, 48e3, true);
    d.setUint32(28, 48e3 * ch * 2, true);
    d.setUint16(32, ch * 2, true);
    d.setUint16(34, 16, true);
    s(36, "data");
    d.setUint32(40, n * ch * 2, true);
    const cs = [ ...Array(ch) ].map((_, i) => buf.getChannelData(i));
    for (let i = 0, o = 44; i < n; i++) for (let c = 0; c < ch; c++, o += 2) d.setInt16(o, Math.max(-1, Math.min(1, cs[c][i])) * 32767, true);
    return new Blob([ d ], {
      type: "audio/wav"
    });
  }
  let p360 = null;
  function preparar360(w) {
    const lado = Math.min(renderer.capabilities.maxTextureSize, Math.round(w / 4) * 2 > 2048 ? 2048 : Math.max(512, Math.round(w / 4) * 2));
    const rtCara = new THREE.WebGLRenderTarget(lado, lado, {
      samples: 4
    });
    rtCara.texture.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.ShaderMaterial({
      uniforms: {
        cara: {
          value: rtCara.texture
        },
        base: {
          value: new THREE.Matrix3
        },
        rumbo: {
          value: 0
        },
        v0: {
          value: 0
        },
        vAlto: {
          value: 1
        }
      },
      vertexShader: VS,
      fragmentShader: FS_EQUI,
      depthTest: false,
      depthWrite: false
    });
    const q = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
    q.frustumCulled = false;
    const e = new THREE.Scene;
    e.add(q);
    return {
      rtCara: rtCara,
      mat: mat,
      q: q,
      e: e,
      orto: new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1),
      cc: new THREE.PerspectiveCamera(90, 1, .02, 600),
      dispose() {
        rtCara.dispose();
        mat.dispose();
        q.geometry.dispose();
      }
    };
  }
  const _p = new THREE.Vector3, _q = new THREE.Quaternion, _e = new THREE.Euler(0, 0, 0, "YXZ");
  function dibujar360(cam, w, h) {
    cam.updateMatrixWorld(true);
    cam.getWorldPosition(_p);
    _e.setFromQuaternion(cam.getWorldQuaternion(_q), "YXZ");
    const P = p360, cc = P.cc;
    cc.near = Math.min(.02, cam.near || .02);
    P.mat.uniforms.rumbo.value = _e.y;
    const auto = renderer.autoClear;
    NIEBLA_RADIAL.value = 1;
    renderer.setRenderTarget(null);
    renderer.setScissorTest(false);
    renderer.setViewport(0, 0, w, h);
    renderer.clear();
    for (const k of CARAS) {
      cc.position.copy(_p);
      cc.up.set(...k.u);
      cc.lookAt(_p.x + k.f[0], _p.y + k.f[1], _p.z + k.f[2]);
      cc.updateMatrixWorld(true);
      renderer.autoClear = true;
      renderer.setRenderTarget(P.rtCara);
      renderer.render(escena, cc);
      P.mat.uniforms.base.value.setFromMatrix4(cc.matrixWorldInverse);
      renderer.autoClear = false;
      renderer.setRenderTarget(null);
      renderer.setViewport(0, 0, w, h);
      renderer.render(P.e, P.orto);
    }
    renderer.autoClear = auto;
    NIEBLA_RADIAL.value = 0;
  }
  async function generar(op) {
    if (est.activo || !C.sqt) return null;
    const f = FORMATOS[op.formato] || FORMATOS["4k"], [W, H] = f.tam, fps = op.fps === 60 ? 60 : 30;
    const desde = Math.max(0, Math.min(op.desde | 0, C.sqt.n - 1)), hasta = Math.max(desde, Math.min(op.hasta | 0, C.sqt.n - 1));
    const paso = ctx.FPS / fps, N = Math.floor((hasta - desde) / paso) + 1;
    const sello = (() => {
      const d = new Date;
      return `${d.getFullYear()}${dos(d.getMonth() + 1)}${dos(d.getDate())}_${dos(d.getHours())}${dos(d.getMinutes())}${dos(d.getSeconds())}`;
    })();
    const nombre = `SH4_${C.demo}_${op.formato}_${fps}fps_c${desde}-${hasta}_${sello}`;
    let archivo = null;
    if (!op.enMemoria && window.showSaveFilePicker) {
      try {
        const h = await showSaveFilePicker({
          suggestedName: nombre + ".mp4",
          types: [ {
            description: "Video MP4",
            accept: {
              "video/mp4": [ ".mp4" ]
            }
          } ]
        });
        archivo = await h.createWritable();
      } catch (e) {
        if (e?.name === "AbortError") return null;
        archivo = null;
      }
    }
    if (!window.VideoEncoder) {
      alert("Este navegador no tiene codificador de video (WebCodecs): probá con Chrome o Edge.");
      return null;
    }
    const cfg = await configVideo(W, H, fps);
    if (!cfg) {
      alert("El codificador de video no acepta " + W + "×" + H + " en este equipo.");
      return null;
    }
    est.activo = true;
    est.cancelar = false;
    C.exportando = true;
    const t0Video = C.t, antes = {
      pr: renderer.getPixelRatio(),
      primera: $("primera").checked,
      franjas: $("franjas").checked,
      ancho: $("ancho").checked,
      fondo: renderer.getClearColor(new THREE.Color),
      fondoA: renderer.getClearAlpha(),
      xr: renderer.xr.enabled,
      niebla: factorNiebla()
    };
    ctx.pausar();
    avance.classList.add("abierto");
    const textoAv = avance.querySelector("[data-t]"), barra = avance.querySelector(".vBarra > div");
    const lienzo = document.createElement("canvas");
    lienzo.width = W;
    lienzo.height = H;
    const g = lienzo.getContext("2d", {
      alpha: false
    });
    const nivel = leerOpciones().brillo ?? 5, conBrillo = Math.abs(gammaDeNivel(nivel) - 1) > .001;
    let encV = null, encA = null, errorEnc = null, resultado = null;
    try {
      let sonido = null, aac = null;
      if (op.sonido) {
        sonido = await sonido48(desde / ctx.FPS, N * paso / ctx.FPS);
        if (sonido && window.AudioEncoder) {
          const c = {
            codec: "mp4a.40.2",
            sampleRate: 48e3,
            numberOfChannels: sonido.numberOfChannels,
            bitrate: 192e3
          };
          try {
            if ((await AudioEncoder.isConfigSupported(c)).supported) aac = c;
          } catch {}
        }
      }
      const mux = crearMp4({
        ancho: W,
        alto: H,
        fps: fps,
        audio: aac ? {
          frecuencia: 48e3,
          canales: sonido.numberOfChannels
        } : null,
        es360: !!f.es360,
        archivo: archivo,
        muestras: {
          video: N,
          audio: aac ? Math.ceil(sonido.length / 1024) + 4 : 0
        }
      });
      if (aac) {
        encA = new AudioEncoder({
          output: (ch, meta) => mux.audio(ch, meta),
          error: e => {
            errorEnc ||= e;
          }
        });
        encA.configure(aac);
        const ch = sonido.numberOfChannels, BLOQUE = 48e3;
        for (let i = 0; i < sonido.length; i += BLOQUE) {
          const n = Math.min(BLOQUE, sonido.length - i), datos = new Float32Array(n * ch);
          for (let c = 0; c < ch; c++) datos.set(sonido.getChannelData(c).subarray(i, i + n), c * n);
          const ad = new AudioData({
            format: "f32-planar",
            sampleRate: 48e3,
            numberOfFrames: n,
            numberOfChannels: ch,
            timestamp: Math.round(i / 48e3 * 1e6),
            data: datos
          });
          encA.encode(ad);
          ad.close();
        }
        await encA.flush();
      }
      encV = new VideoEncoder({
        output: (ch, meta) => mux.video(ch, meta),
        error: e => {
          errorEnc ||= e;
        }
      });
      encV.configure(cfg);
      renderer.xr.enabled = false;
      renderer.setPixelRatio(1);
      renderer.setSize(W, H, false);
      renderer.setClearColor(0, 1);
      $("franjas").checked = !f.vertical && !!op.franjas;
      $("ancho").checked = !f.vertical && op.imagen === "169";
      C.mantenerAncho = !!f.vertical && op.encuadre === "alta";
      if (op.niebla === "sin") factorNiebla(0); else if (op.niebla === "suave") factorNiebla(antes.niebla * .5);
      renderer.domElement.style.objectFit = "contain";
      let cam = null;
      if (op.camara === "ojos" || op.camara === "escena") {
        $("primera").checked = op.camara === "ojos";
        ctx.reiniciarOjos();
      } else if (op.camara === "libre") cam = ctx.camLibre.clone(); else if (op.camara === "foto" && ctx.fotoCam()) cam = ctx.fotoCam().clone();
      if (cam) {
        cam.matrixAutoUpdate = true;
        if (C.mantenerAncho) cam.fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2) * (cam.aspect || 16 / 9) / (W / H)));
      }
      if (f.es360) p360 = preparar360(W);
      const area = f.vertical ? op.encuadre === "completa" ? {
        x: 0,
        y: Math.round((H - W * 3 / 4) / 2),
        w: W,
        h: Math.round(W * 3 / 4)
      } : {
        x: 0,
        y: 0,
        w: W,
        h: H
      } : f.es360 || op.imagen === "169" ? {
        x: 0,
        y: 0,
        w: W,
        h: H
      } : {
        x: Math.round((W - H * 4 / 3) / 2),
        y: 0,
        w: Math.round(H * 4 / 3),
        h: H
      };
      const tIni = performance.now();
      if (op.camara === "ojos") for (let k = Math.max(0, desde - 15); k < desde; k++) ctx.aplicar(k);
      for (let i = 0; i < N; i++) {
        if (est.cancelar) break;
        if (errorEnc) throw errorEnc;
        ctx.aplicar(desde + i * paso);
        ctx.ayudaCam.visible = false;
        const sinPegados = f.es360 || !!cam;
        if (sinPegados) ctx.camCine.visible = false;
        if (f.es360) dibujar360(cam || ctx.camCine, W, H); else {
          renderer.setRenderTarget(null);
          ctx.dibujarCine(W, H, area, cam || undefined);
        }
        if (sinPegados) ctx.camCine.visible = true;
        g.filter = conBrillo ? "url(#sh4-brillo)" : "none";
        g.drawImage(renderer.domElement, 0, 0, W, H);
        g.filter = "none";
        const texto = op.subtitulos ? ctx.sub() : "";
        if (texto) {
          if (f.es360) {
            const esc = H / 900;
            g.save();
            g.translate(W / 2 - ctx.JW / 2 * esc, H * .6);
            ctx.escribirSub(g, texto, esc, 100);
            g.restore();
          } else if (f.vertical) {
            const esc = Math.min(3, W * .9 / Math.max(1, ctx.anchoSub(texto))), y0 = op.encuadre === "completa" ? area.y + area.h + 24 : Math.round(H * .7);
            if (op.encuadre !== "completa") {
              g.fillStyle = "rgba(0,0,0,0.35)";
              g.fillRect(0, y0 - 6, W, 100 * esc + 12);
            }
            g.save();
            g.translate(W / 2 - ctx.JW / 2 * esc, y0);
            ctx.escribirSub(g, texto, esc, 100);
            g.restore();
          } else {
            const esc = Math.min(area.w / ctx.JW, area.h / ctx.JH);
            g.save();
            g.translate(area.x + (area.w - ctx.JW * esc) / 2, area.y + area.h - ctx.JH * esc);
            ctx.escribirSub(g, texto, esc, ctx.JH);
            g.restore();
          }
        }
        const vf = new VideoFrame(lienzo, {
          timestamp: Math.round(i / fps * 1e6),
          duration: Math.round(1e6 / fps)
        });
        encV.encode(vf, {
          keyFrame: i % (fps * 2) === 0
        });
        vf.close();
        while (encV.encodeQueueSize > 4) await new Promise(r => setTimeout(r, 2));
        if (i % 3 === 0 || i === N - 1) {
          const seg = (performance.now() - tIni) / 1e3, vel = (i + 1) / Math.max(.001, seg), falta = (N - i - 1) / vel;
          textoAv.textContent = sitioIngles() ? `Making the ${f.nombre} video… frame ${i + 1} / ${N} · ${vel.toFixed(1)} frames/s · ${reloj(falta)} left` : `Armando el video ${f.nombre}… cuadro ${i + 1} / ${N} · ${vel.toFixed(1)} cuadros/s · faltan ${reloj(falta)}`;
          barra.style.width = (100 * (i + 1) / N).toFixed(1) + "%";
          est.progreso = {
            i: i + 1,
            N: N,
            vel: +vel.toFixed(2)
          };
          await new Promise(r => setTimeout(r, 0));
        }
      }
      if (est.cancelar) {
        encV.close();
        encV = null;
        if (archivo) {
          try {
            await mux.pendiente();
            await (archivo.abort?.());
          } catch {}
        }
        resultado = {
          cancelado: true
        };
      } else {
        await encV.flush();
        if (errorEnc) throw errorEnc;
        const blob = await mux.cerrar();
        const seg = (performance.now() - tIni) / 1e3;
        resultado = {
          nombre: nombre + ".mp4",
          ancho: W,
          alto: H,
          fps: fps,
          cuadros: N,
          muestras: mux.muestras,
          mb: +(mux.bytes / 1e6).toFixed(1),
          segundos: +seg.toFixed(1),
          cuadrosPorSeg: +(N / seg).toFixed(2),
          sonido: aac ? "aac" : sonido ? "wav" : null,
          codec: cfg.codec,
          acel: cfg.hardwareAcceleration,
          es360: !!f.es360
        };
        if (blob) {
          est.ultimo = blob;
          if (!op.sinBajar) descargar(blob, nombre + ".mp4");
        }
        if (sonido && !aac && !op.sinBajar) descargar(wav(sonido), nombre + ".wav");
        textoAv.textContent = sitioIngles() ? `Video ready (${resultado.mb} MB).` : `Video listo (${resultado.mb} MB)` + (archivo ? "." : ": quedó en Descargas.") + (sonido && !aac ? " El sonido salió aparte (.wav)." : "");
      }
    } catch (err) {
      console.warn("video", err);
      textoAv.textContent = (sitioIngles() ? "Could not make the video: " : "No se pudo armar el video: ") + (err?.message || err);
      resultado = {
        error: String(err?.message || err)
      };
      try {
        encV?.close();
      } catch {}
    } finally {
      try {
        encA?.close();
      } catch {}
      try {
        if (encV && encV.state !== "closed") encV.close();
      } catch {}
      p360?.dispose();
      p360 = null;
      C.mantenerAncho = false;
      renderer.domElement.style.objectFit = "";
      factorNiebla(antes.niebla);
      $("primera").checked = antes.primera;
      $("franjas").checked = antes.franjas;
      $("ancho").checked = antes.ancho;
      renderer.setClearColor(antes.fondo, antes.fondoA);
      renderer.xr.enabled = antes.xr;
      renderer.setPixelRatio(antes.pr);
      renderer.setSize(innerWidth, innerHeight);
      C.exportando = false;
      est.activo = false;
      ctx.reiniciarOjos();
      ctx.aplicar(t0Video);
      ctx.redibujar();
      setTimeout(() => avance.classList.remove("abierto"), resultado?.error ? 12e3 : 6e3);
    }
    return resultado;
  }
  return {
    abrir: abrir,
    cerrar: cerrar,
    generar: generar,
    get activo() {
      return est.activo;
    },
    get estado() {
      return {
        ...est,
        ultimo: est.ultimo ? est.ultimo.size : null
      };
    },
    get ultimo() {
      return est.ultimo;
    }
  };
}
