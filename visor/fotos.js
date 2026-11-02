// SH4 web — FeniXVOID · Project Ravenlight
import { NIEBLA_RADIAL } from "./lib/niebla_radial.js";

import { gammaDeNivel } from "./lib/brillo.js";

import { leerOpciones } from "./opciones_sitio.js";

export function tablaBrillo(nivel = leerOpciones().brillo ?? 5) {
  const g = gammaDeNivel(nivel);
  if (Math.abs(g - 1) < .001) return null;
  const t = new Uint8Array(256);
  for (let i = 0; i < 256; i++) t[i] = Math.round(255 * Math.pow(i / 255, 1 / g));
  return t;
}

export const VS = "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }";

export const FS_EQUI = `uniform sampler2D cara; uniform mat3 base; uniform float rumbo, v0, vAlto; varying vec2 vUv;\n  void main(){\n    float v = v0 + vUv.y * vAlto;\n    float lon = (vUv.x - 0.5) * 6.28318530718 - rumbo, lat = (v - 0.5) * 3.14159265359;\n    vec3 d = vec3(sin(lon) * cos(lat), sin(lat), -cos(lon) * cos(lat));\n    vec3 c = base * d; // a los ejes de la cámara de la cara (mira hacia −Z, 90°)\n    if (c.z >= 0.0) discard;\n    vec2 p = c.xy / -c.z;\n    if (abs(p.x) > 1.0 || abs(p.y) > 1.0) discard;\n    gl_FragColor = vec4(texture2D(cara, p * 0.5 + 0.5).rgb, 1.0);\n    #include <colorspace_fragment>\n  }`;

export const CARAS = [ {
  f: [ 1, 0, 0 ],
  u: [ 0, 1, 0 ],
  lat: [ -55, 55 ]
}, {
  f: [ -1, 0, 0 ],
  u: [ 0, 1, 0 ],
  lat: [ -55, 55 ]
}, {
  f: [ 0, 0, 1 ],
  u: [ 0, 1, 0 ],
  lat: [ -55, 55 ]
}, {
  f: [ 0, 0, -1 ],
  u: [ 0, 1, 0 ],
  lat: [ -55, 55 ]
}, {
  f: [ 0, 1, 0 ],
  u: [ 0, 0, 1 ],
  lat: [ 35, 90 ]
}, {
  f: [ 0, -1, 0 ],
  u: [ 0, 0, -1 ],
  lat: [ -90, -35 ]
} ];

const PEDAZO = [ 1920, 1080 ], FRANJA = 1024;

export const TAMANOS = {
  "4k": [ 3840, 2160 ],
  "8k": [ 7680, 4320 ],
  "360-4k": [ 4096, 2048 ],
  "360-8k": [ 8192, 4096 ]
};

export async function sacarFoto(THREE, R, escena, camara, tipo, meta) {
  const max = R.capabilities.maxTextureSize, basura = [], gl = R.getContext();
  let [w, h] = TAMANOS[tipo];
  const es360 = tipo.startsWith("360");
  const nuevaRT = (rw, rh, prof, muestras = 0) => {
    const r = new THREE.WebGLRenderTarget(rw, rh, {
      depthBuffer: prof,
      samples: muestras
    });
    r.texture.colorSpace = THREE.SRGBColorSpace;
    basura.push(r);
    return r;
  };
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const cx = cv.getContext("2d");
  let tope = 0;
  let datos = null;
  const lut = tablaBrillo();
  function pegar(rt, rw, rh, dx, dy) {
    if (!datos || datos.length !== rw * rh * 4) datos = new Uint8Array(rw * rh * 4);
    R.readRenderTargetPixels(rt, 0, 0, rw, rh, datos);
    const img = new ImageData(rw, rh), fila = rw * 4;
    for (let y = 0; y < rh; y++) img.data.set(datos.subarray((rh - 1 - y) * fila, (rh - y) * fila), y * fila);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i] > tope) tope = d[i];
      if (d[i + 1] > tope) tope = d[i + 1];
      if (d[i + 2] > tope) tope = d[i + 2];
      d[i + 3] = 255;
    }
    if (lut) for (let i = 0; i < d.length; i += 4) {
      d[i] = lut[d[i]];
      d[i + 1] = lut[d[i + 1]];
      d[i + 2] = lut[d[i + 2]];
    }
    cx.putImageData(img, dx, dy);
  }
  const sinMemoria = () => gl.getError() === gl.OUT_OF_MEMORY;
  const prev = {
    rt: R.getRenderTarget(),
    xr: R.xr.enabled,
    autoClear: R.autoClear,
    fondo: R.getClearColor(new THREE.Color),
    fondoA: R.getClearAlpha()
  };
  let faltoMemoria = false;
  async function respirar() {
    const radial = NIEBLA_RADIAL.value;
    R.setRenderTarget(prev.rt);
    R.xr.enabled = prev.xr;
    R.autoClear = prev.autoClear;
    R.setClearColor(prev.fondo, prev.fondoA);
    NIEBLA_RADIAL.value = 0;
    await new Promise(r => setTimeout(r, 0));
    R.xr.enabled = false;
    NIEBLA_RADIAL.value = radial;
    gl.getError();
  }
  gl.getError();
  try {
    R.xr.enabled = false;
    camara.updateMatrixWorld();
    if (es360) {
      const lado = Math.min(R.capabilities.maxTextureSize || max, w / 2, 4096);
      const rtCara = nuevaRT(lado, lado, true, lado <= 2048 ? 4 : 0);
      const fr = Math.min(FRANJA, h), rtFranja = nuevaRT(w, fr, false);
      const pos = camara.getWorldPosition(new THREE.Vector3);
      const yaw = (new THREE.Euler).setFromQuaternion(camara.getWorldQuaternion(new THREE.Quaternion), "YXZ").y;
      const cc = new THREE.PerspectiveCamera(90, 1, camara.near, camara.far);
      const mat = new THREE.ShaderMaterial({
        uniforms: {
          cara: {
            value: rtCara.texture
          },
          base: {
            value: new THREE.Matrix3
          },
          rumbo: {
            value: yaw
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
      const orto = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
      NIEBLA_RADIAL.value = 1;
      for (let y0 = 0; y0 < h; y0 += fr) {
        mat.uniforms.v0.value = 1 - (y0 + fr) / h;
        mat.uniforms.vAlto.value = fr / h;
        const latMax = (.5 - y0 / h) * 180, latMin = (.5 - (y0 + fr) / h) * 180;
        R.setRenderTarget(rtFranja);
        R.setClearColor(0, 1);
        R.clear();
        for (const k of CARAS) {
          if (latMax < k.lat[0] || latMin > k.lat[1]) continue;
          cc.position.copy(pos);
          cc.up.set(...k.u);
          cc.lookAt(pos.x + k.f[0], pos.y + k.f[1], pos.z + k.f[2]);
          cc.updateMatrixWorld(true);
          R.autoClear = true;
          R.setRenderTarget(rtCara);
          R.render(escena, cc);
          mat.uniforms.base.value.setFromMatrix4(cc.matrixWorldInverse);
          R.autoClear = false;
          R.setRenderTarget(rtFranja);
          R.render(e, orto);
        }
        R.autoClear = prev.autoClear;
        if (sinMemoria()) faltoMemoria = true;
        pegar(rtFranja, w, fr, 0, y0);
        await respirar();
      }
      mat.dispose();
      q.geometry.dispose();
    } else {
      const c = camara.clone();
      c.aspect = w / h;
      c.matrixWorld.copy(camara.matrixWorld);
      c.matrixWorldInverse.copy(camara.matrixWorldInverse);
      c.matrixAutoUpdate = false;
      const pw = Math.min(PEDAZO[0], w, max), ph = Math.min(PEDAZO[1], h, max);
      const rt = nuevaRT(pw, ph, true, 4);
      for (let y = 0; y < h; y += ph) for (let x = 0; x < w; x += pw) {
        c.setViewOffset(w, h, x, y, pw, ph);
        c.updateProjectionMatrix();
        R.setRenderTarget(rt);
        R.clear();
        R.render(escena, c);
        if (sinMemoria()) faltoMemoria = true;
        pegar(rt, pw, ph, x, y);
        await respirar();
      }
    }
  } finally {
    R.setRenderTarget(prev.rt);
    R.xr.enabled = prev.xr;
    R.autoClear = prev.autoClear;
    R.setClearColor(prev.fondo, prev.fondoA);
    NIEBLA_RADIAL.value = 0;
    for (const b of basura) b.dispose();
  }
  if (faltoMemoria || tope < 3) throw new Error(faltoMemoria ? "la placa se quedó sin memoria; probá en 4K" : "la foto salió negra; probá en 4K o sacala de nuevo");
  const blob = await new Promise((r, no) => cv.toBlob(b => b ? r(b) : no(new Error("el navegador no generó el JPEG")), "image/jpeg", .95));
  const jpeg = conXMP(new Uint8Array(await blob.arrayBuffer()), xmp(w, h, es360, meta));
  return {
    blob: new Blob([ jpeg ], {
      type: "image/jpeg"
    }),
    ancho: w,
    alto: h
  };
}

const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

function xmp(w, h, es360, m) {
  const fecha = (new Date).toISOString();
  const gpano = es360 ? ` xmlns:GPano="http://ns.google.com/photos/1.0/panorama/" GPano:ProjectionType="equirectangular" GPano:UsePanoramaViewer="True"` + ` GPano:CroppedAreaImageWidthPixels="${w}" GPano:CroppedAreaImageHeightPixels="${h}" GPano:FullPanoWidthPixels="${w}" GPano:FullPanoHeightPixels="${h}"` + ` GPano:CroppedAreaLeftPixels="0" GPano:CroppedAreaTopPixels="0" GPano:PoseHeadingDegrees="0" GPano:InitialViewHeadingDegrees="0" GPano:InitialViewPitchDegrees="0"` : "";
  return '<?xpacket begin="\ufeff" id="W5M0MpCehiHzreSzNTczkc9d"?><x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">' + '<rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:xmp="http://ns.adobe.com/xap/1.0/"' + ' xmlns:sh4="https://ravenlight.net/ns/sh4/1.0/"' + gpano + ` xmp:CreatorTool="SH4 The Room web · FeniXVOID · Project Ravenlight" xmp:CreateDate="${fecha}"` + ` sh4:Juego="Silent Hill 4: The Room (PC)" sh4:Sala="${esc(m.sala)}" sh4:Posicion="${m.posicion.map(v => v.toFixed(3)).join(",")}"` + ` sh4:RumboGrados="${m.rumbo.toFixed(1)}" sh4:InclinacionGrados="${m.inclinacion.toFixed(1)}" sh4:AnguloVision="${m.fov.toFixed(1)}"` + (m.mundo ? ` sh4:Mundo="${esc(m.mundo)}"` : "") + (m.cinematica ? ` sh4:Cinematica="${esc(m.cinematica)}"` : "") + (m.cuadro != null ? ` sh4:Cuadro="${m.cuadro}"` : "") + (m.giro != null ? ` sh4:GiroGrados="${(+m.giro).toFixed(1)}"` : "") + ` sh4:Vista="${esc(m.vista)}" sh4:Tipo="${es360 ? "equirectangular 360" : "plana"}" sh4:Tamano="${w}x${h}">` + `<dc:title><rdf:Alt><rdf:li xml:lang="x-default">${esc(m.titulo)}</rdf:li></rdf:Alt></dc:title>` + `<dc:description><rdf:Alt><rdf:li xml:lang="x-default">${esc(m.descripcion)}</rdf:li></rdf:Alt></dc:description>` + "<dc:creator><rdf:Seq><rdf:li>FeniXVOID · Project Ravenlight</rdf:li></rdf:Seq></dc:creator>" + "<dc:subject><rdf:Bag><rdf:li>Silent Hill 4</rdf:li><rdf:li>The Room</rdf:li>" + (es360 ? "<rdf:li>360</rdf:li>" : "") + "</rdf:Bag></dc:subject>" + '</rdf:Description></rdf:RDF></x:xmpmeta><?xpacket end="w"?>';
}

function conXMP(jpeg, texto) {
  const enc = new TextEncoder, ns = enc.encode("http://ns.adobe.com/xap/1.0/\0"), cuerpo = enc.encode(texto);
  const largo = 2 + ns.length + cuerpo.length;
  if (largo > 65535) throw new Error("XMP demasiado largo");
  const seg = new Uint8Array(2 + largo);
  seg[0] = 255;
  seg[1] = 225;
  seg[2] = largo >> 8;
  seg[3] = largo & 255;
  seg.set(ns, 4);
  seg.set(cuerpo, 4 + ns.length);
  let pos = 2;
  if (jpeg[2] === 255 && jpeg[3] === 224) pos = 4 + (jpeg[4] << 8 | jpeg[5]);
  const out = new Uint8Array(jpeg.length + seg.length);
  out.set(jpeg.subarray(0, pos), 0);
  out.set(seg, pos);
  out.set(jpeg.subarray(pos), pos + seg.length);
  return out;
}

export function descargar(blob, nombre) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 6e4);
}
