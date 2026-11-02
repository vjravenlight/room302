// SH4 web — FeniXVOID · Project Ravenlight
const cacheBin = new Map;

export function bajarJuego(ruta) {
  if (!cacheBin.has(ruta)) cacheBin.set(ruta, fetch("/juego/" + ruta).then(r => {
    if (!r.ok) throw new Error("no pude leer " + ruta);
    return r.arrayBuffer();
  }));
  cacheBin.get(ruta).catch(() => cacheBin.delete(ruta));
  return cacheBin.get(ruta);
}

const cacheTex = new Map;

export async function texturasDeParte(THREE, lib, archivo, parte) {
  const clave = archivo + "#" + parte;
  if (cacheTex.has(clave)) return cacheTex.get(clave);
  const prom = (async () => {
    const buf = await bajarJuego("data/" + archivo);
    const p = lib.partesBin(buf).find(x => x.indice === parte);
    if (!p || p.tipo !== "texturas") return [];
    return leerTexturasEfecto(lib, buf, p.ofs, p.len).map(subs => subs.map(img => texturaPS2(THREE, lib.aRGBA(img), img.ancho, img.alto)));
  })();
  cacheTex.set(clave, prom);
  return prom;
}

export function leerTexturasEfecto(lib, buf, ofs, len) {
  const dv = new DataView(buf, ofs, len);
  const n = dv.getUint16(0, true);
  if (dv.getUint16(2, true) === n) return lib.leerTexturas(buf, ofs, len);
  if (dv.getUint16(2, true) !== 0) throw new Error("bloque de texturas raro");
  const res = [];
  for (let i = 0; i < n; i++) {
    const e = dv.getUint32(16 + 4 * i, true), h = e + dv.getUint32(e + 12, true);
    const ancho = dv.getUint32(h + 32, true), alto = dv.getUint32(h + 36, true), f = dv.getUint32(h + 40, true);
    const largo = dv.getUint32(h + 48, true), oDatos = dv.getUint32(h + 80, true);
    const formato = f === 21 ? "BGRA" : f === 827611204 ? "DXT1" : f === 861165636 ? "DXT3" : f === 894720068 ? "DXT5" : "raro_" + f;
    res.push([ {
      ancho: ancho,
      alto: alto,
      formato: formato,
      mips: dv.getUint32(h + 44, true),
      datos: new Uint8Array(buf, ofs + h + oDatos, Math.min(largo, len - h - oDatos))
    } ]);
  }
  return res;
}

export function texturaPS2(THREE, rgba, w, h, repetir = false) {
  const t = new THREE.DataTexture(rgba, w, h, THREE.RGBAFormat);
  t.wrapS = t.wrapT = repetir ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping;
  t.magFilter = THREE.LinearFilter;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.generateMipmaps = true;
  t.needsUpdate = true;
  return t;
}

export function crearRand(semilla = 1) {
  let s = semilla >>> 0;
  const rand = () => {
    s = Math.imul(s, 214013) + 2531011 >>> 0;
    return s >>> 16 & 32767;
  };
  rand.f = () => rand() / 32767;
  rand.semilla = x => {
    s = x >>> 0;
  };
  return rand;
}

export const MEZCLA = {
  normal: 68,
  suma: 104,
  resta: 98,
  sumaAlfa: 72
};

export function materialPS2(THREE, o = {}) {
  const u = {
    mapa: {
      value: o.mapa || null
    },
    uTieneMapa: {
      value: o.mapa ? 1 : 0
    },
    uFix: {
      value: o.fix ?? -1
    },
    uAref: {
      value: o.aref ?? -1
    },
    uOfs: {
      value: o.desplazar || new THREE.Vector3
    },
    uColor: {
      value: new THREE.Vector4(1, 1, 1, 1)
    },
    uRegion: {
      value: o.region || new THREE.Vector4(0, 0, 0, 0)
    },
    uNiebla: {
      value: new THREE.Vector4(1, 0, 1, 0)
    },
    uNieblaColor: {
      value: new THREE.Color(0)
    }
  };
  const m = new THREE.ShaderMaterial({
    uniforms: u,
    vertexShader: `\n      attribute vec3 uvq; attribute vec4 color;\n      uniform vec3 uOfs;\n      varying vec3 vUvq; varying vec4 vCol; varying float vDist;\n      void main() {\n        vUvq = uvq; vCol = color;\n        vec4 mv = modelViewMatrix * vec4(position + uOfs, 1.0);\n        vDist = -mv.z;\n        gl_Position = projectionMatrix * mv;\n      }`,
    fragmentShader: `\n      uniform sampler2D mapa; uniform float uTieneMapa, uFix, uAref;\n      uniform vec4 uColor, uNiebla, uRegion; uniform vec3 uNieblaColor;\n      varying vec3 vUvq; varying vec4 vCol; varying float vDist;\n      void main() {\n        vec2 uv = vUvq.xy / vUvq.z;\n        if (uRegion.y > uRegion.x) uv = vec2(uRegion.x + mod(uv.x - uRegion.x, uRegion.y - uRegion.x), uRegion.z + mod(uv.y - uRegion.z, uRegion.w - uRegion.z));\n        vec4 t = uTieneMapa > 0.5 ? texture2D(mapa, uv) : vec4(1.0);\n        vec4 c = t * vCol * uColor;                 // modulación del GS: textura · color / 0x80\n        if (uAref >= 0.0 && c.a * 128.0 <= uAref) discard; // ATST = GREATER\n        float a = uFix >= 0.0 ? uFix : clamp(c.a, 0.0, 1.0);\n        // niebla del juego sobre el efecto (sgEMRenderState: misma niebla que la sala)\n        if (uNiebla.w > 0.5) c.rgb = mix(uNieblaColor, c.rgb, clamp(uNiebla.x + uNiebla.y / max(vDist * uNiebla.z, 1e-3), 0.0, 1.0));\n        gl_FragColor = vec4(sRGBTransferEOTF(vec4(clamp(c.rgb, 0.0, 1.0), 1.0)).rgb, a);\n        #include <colorspace_fragment>\n      }`,
    transparent: true,
    depthWrite: false,
    depthTest: true,
    side: THREE.DoubleSide
  });
  ponerMezcla(THREE, m, o.mezcla ?? 68);
  if (o.stencil === "marcar") {
    m.stencilWrite = true;
    m.stencilFunc = THREE.AlwaysStencilFunc;
    m.stencilRef = 0;
    m.stencilZPass = THREE.IncrementStencilOp;
    m.stencilZFail = THREE.KeepStencilOp;
    m.stencilFail = THREE.KeepStencilOp;
  } else if (o.stencil === "probar") {
    m.stencilWrite = true;
    m.stencilFunc = THREE.LessStencilFunc;
    m.stencilRef = 0;
    m.stencilWriteMask = 0;
    m.stencilZPass = THREE.KeepStencilOp;
    m.stencilZFail = THREE.KeepStencilOp;
    m.stencilFail = THREE.KeepStencilOp;
  }
  return m;
}

export function ponerMezcla(THREE, m, alpha) {
  m.blending = THREE.CustomBlending;
  m.blendEquationAlpha = m.blendSrcAlpha = m.blendDstAlpha = null;
  if (alpha === 66 || alpha === 98) {
    m.blendEquation = THREE.ReverseSubtractEquation;
    m.blendSrc = THREE.SrcAlphaFactor;
    m.blendDst = THREE.OneFactor;
  } else if (alpha === 72 || alpha === 104 || alpha === 88) {
    m.blendEquation = THREE.AddEquation;
    m.blendSrc = THREE.SrcAlphaFactor;
    m.blendDst = THREE.OneFactor;
  } else {
    m.blendEquation = THREE.AddEquation;
    m.blendSrc = THREE.SrcAlphaFactor;
    m.blendDst = THREE.OneMinusSrcAlphaFactor;
  }
}

export function colorGS(c) {
  return [ (c & 255) / 128, (c >>> 8 & 255) / 128, (c >>> 16 & 255) / 128, (c >>> 24 & 255) / 128 ];
}

export function geometriaDinamica(THREE, nVert, indices) {
  const g = new THREE.BufferGeometry;
  g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(nVert * 3), 3).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute("uvq", new THREE.BufferAttribute(new Float32Array(nVert * 3), 3).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute("color", new THREE.BufferAttribute(new Float32Array(nVert * 4), 4).setUsage(THREE.DynamicDrawUsage));
  if (indices) g.setIndex(indices);
  return g;
}

export function ponerNieblaEnMaterial(m, co, escala, activa = true) {
  if (!m.uniforms?.uNiebla) return;
  if (!co || !activa) {
    m.uniforms.uNiebla.value.w = 0;
    return;
  }
  m.uniforms.uNiebla.value.set(co.c0, co.c1, 1 / escala, 1);
  m.uniforms.uNieblaColor.value.setRGB(...co.color);
}
