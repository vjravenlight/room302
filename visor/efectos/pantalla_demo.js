// SH4 web — FeniXVOID · Project Ravenlight
const VERT = `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const FRAG = `\nuniform sampler2D tBase, tChico, tMasc, tDest;\nuniform float aBorroso, aBrillo, aDest, mascara, zoom, dy, franjas, conMasc, conDest;\nuniform vec2 px, escDest;\nvarying vec2 vUv;\nvec3 aGamma(vec3 c) { return mix(c * 12.92, 1.055 * pow(max(c, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c)); }\nvec3 base(vec2 uv) { return aGamma(texture2D(tBase, clamp(uv, vec2(0.0), vec2(1.0))).rgb); }\nvoid main() {\n  vec2 uv = vUv;\n  vec2 g = vec2(uv.x * 512.0, (1.0 - uv.y) * 448.0);       // pantalla del juego, y para abajo\n  if (mascara > 0.5 && mascara < 1.5) {                    // lente de la mirilla\n    vec2 c = vec2(256.0, 224.0 + dy), d = g - c;\n    float r = length(d), R = 200.0 * (1.0 + zoom);\n    if (r < R && r > 1e-3) { g = c + d / r * (R * asin(r / R) * 0.6366198); uv = vec2(g.x / 512.0, 1.0 - g.y / 448.0); }\n  }\n  vec3 col = base(uv);\n  if (aBorroso > 0.0) col = mix(col, aGamma(texture2D(tChico, uv).rgb), aBorroso);\n  if (aBrillo > 0.0) {\n    vec3 s = base(uv + vec2(px.x, 0.0)) + base(uv - vec2(px.x, 0.0)) + base(uv + vec2(0.0, px.y)) + base(uv - vec2(0.0, px.y));\n    col = mix(col, min(col + s * 0.09375, vec3(1.0)), aBrillo);\n  }\n  vec2 gp = vec2(vUv.x * 512.0, (1.0 - vUv.y) * 448.0);\n  if (mascara > 0.5 && mascara < 1.5) {                    // doorscope: cuadrado centrado, negro afuera\n    float lado = 448.0 * (1.0 + zoom);\n    vec2 q = (gp - vec2(256.0, 224.0 + dy)) / lado + 0.5;\n    if (q.x < 0.0 || q.x > 1.0 || q.y < 0.0 || q.y > 1.0) col = vec3(0.0);\n    else if (conMasc > 0.5) { vec4 m = texture2D(tMasc, q); col = mix(col, aGamma(m.rgb) * 0.625, m.a); }\n  } else if (mascara > 1.5 && conMasc > 0.5) {             // peephole: pantalla completa\n    vec4 m = texture2D(tMasc, vec2((10.0 + vUv.x * 236.0) / 256.0, 1.0 - vUv.y));\n    col = mix(col, aGamma(m.rgb) * 0.625, m.a);\n  }\n  if (conDest > 0.5 && aDest > 0.0) { vec4 m = texture2D(tDest, vec2(vUv.x, 1.0 - vUv.y) * escDest); col = mix(col, aGamma(m.rgb) * 0.625, m.a * aDest); }\n  if (franjas >= 0.0 && (gp.y < 51.0 || gp.y > 448.0 - 68.0)) col = mix(col, vec3(0.0), franjas);\n  gl_FragColor = vec4(col, 1.0);\n}`;

export function pantallaActiva(P) {
  return !!P && (P.borroso > 0 || P.brillo > 0 || !!P.mascara || !!P.destello || P.franjas != null);
}

export function crearPantallaDemo({THREE: THREE, renderer: renderer}) {
  let rt = null, rtChico = null, nChico = 0;
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const uni = {
    tBase: {
      value: null
    },
    tChico: {
      value: null
    },
    tMasc: {
      value: null
    },
    tDest: {
      value: null
    },
    aBorroso: {
      value: 0
    },
    aBrillo: {
      value: 0
    },
    aDest: {
      value: 0
    },
    mascara: {
      value: 0
    },
    zoom: {
      value: 0
    },
    dy: {
      value: 0
    },
    franjas: {
      value: -1
    },
    conMasc: {
      value: 0
    },
    conDest: {
      value: 0
    },
    px: {
      value: new THREE.Vector2
    },
    escDest: {
      value: new THREE.Vector2(1, 1)
    }
  };
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    uniforms: uni,
    vertexShader: VERT,
    fragmentShader: FRAG,
    depthTest: false,
    depthWrite: false
  }));
  quad.frustumCulled = false;
  const escenaQuad = new THREE.Scene;
  escenaQuad.add(quad);
  const uniCopia = {
    t: {
      value: null
    }
  };
  const quadCopia = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
    uniforms: uniCopia,
    vertexShader: VERT,
    fragmentShader: "uniform sampler2D t; varying vec2 vUv; void main() { gl_FragColor = texture2D(t, vUv); }",
    depthTest: false,
    depthWrite: false
  }));
  quadCopia.frustumCulled = false;
  const escenaCopia = new THREE.Scene;
  escenaCopia.add(quadCopia);
  function asegurar(w, h, n) {
    if (!rt || rt.width !== w || rt.height !== h) {
      rt?.dispose();
      rt = new THREE.WebGLRenderTarget(w, h, {
        type: THREE.HalfFloatType,
        samples: 4
      });
      rt.texture.minFilter = rt.texture.magFilter = THREE.LinearFilter;
    }
    const cw = Math.max(1, Math.round(640 / n)), ch = Math.max(1, Math.round(480 / n));
    if (!rtChico || nChico !== n) {
      rtChico?.dispose();
      rtChico = new THREE.WebGLRenderTarget(cw, ch, {
        type: THREE.HalfFloatType
      });
      rtChico.texture.minFilter = rtChico.texture.magFilter = THREE.LinearFilter;
      nChico = n;
    }
  }
  function dibujar(escena, camara, area, P, franjasActivas = false) {
    const dpr = renderer.getPixelRatio();
    const w = Math.max(1, Math.round(area.w * dpr)), h = Math.max(1, Math.round(area.h * dpr));
    let n = P.nBorroso || 5;
    if (n === 4) n = 2;
    n = Math.max(1, Math.min(16, n));
    asegurar(w, h, n);
    const previo = renderer.getRenderTarget(), tijera = renderer.getScissorTest();
    renderer.setScissorTest(false);
    renderer.setRenderTarget(rt);
    renderer.clear();
    renderer.render(escena, camara);
    if (P.borroso > 0) {
      uniCopia.t.value = rt.texture;
      renderer.setRenderTarget(rtChico);
      renderer.render(escenaCopia, cam);
    }
    renderer.setRenderTarget(previo);
    renderer.setViewport(area.x, area.y, area.w, area.h);
    if (franjasActivas && P.franjas == null) {
      const fr = area.h * .125;
      renderer.setScissor(area.x, area.y + fr, area.w, area.h - 2 * fr);
      renderer.setScissorTest(true);
    }
    uni.tBase.value = rt.texture;
    uni.tChico.value = rtChico.texture;
    uni.aBorroso.value = Math.min(1, P.borroso || 0);
    uni.aBrillo.value = Math.min(1, P.brillo || 0);
    uni.mascara.value = P.mascara ? P.mascara.tipo === "puerta" ? 1 : 2 : 0;
    uni.tMasc.value = P.mascara?.tex || null;
    uni.conMasc.value = P.mascara?.tex ? 1 : 0;
    uni.zoom.value = P.sacudida?.zoom || 0;
    uni.dy.value = P.sacudida?.dy || 0;
    uni.tDest.value = P.destello?.tex || null;
    if (P.destello?.tex) {
      const u = P.destello.tex.userData;
      uni.escDest.value.set(512 / (u.ancho || 512), 448 / (u.alto || 448));
    }
    uni.conDest.value = P.destello?.tex ? 1 : 0;
    uni.aDest.value = P.destello?.a || 0;
    uni.franjas.value = franjasActivas && P.franjas != null ? P.franjas : -1;
    uni.px.value.set(2 / 640, 2 / 480);
    renderer.render(escenaQuad, cam);
    renderer.setScissorTest(tijera);
  }
  return {
    dibujar: dibujar,
    dispose() {
      rt?.dispose();
      rtChico?.dispose();
    }
  };
}

export function crearCapasCamara({THREE: THREE, camara: camara}) {
  const mk = (mat, orden) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
    m.renderOrder = orden;
    m.visible = false;
    m.frustumCulled = false;
    camara.add(m);
    return m;
  };
  const brillo = mk(new THREE.MeshBasicMaterial({
    color: 0,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.DstColorFactor,
    blendDst: THREE.OneFactor
  }), 85);
  const destello = mk(new THREE.MeshBasicMaterial({
    transparent: true,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
    color: new THREE.Color(.625, .625, .625)
  }), 86);
  const negro = [ 1, -1 ].map(l => {
    const m = mk(new THREE.MeshBasicMaterial({
      color: 0,
      transparent: true,
      depthTest: false,
      depthWrite: false
    }), 87);
    m.userData.l = l;
    return m;
  });
  let conVista = false;
  function anclar() {
    const d = .07, alto = 2 * d * Math.tan(THREE.MathUtils.degToRad(camara.fov) / 2), ancho = alto * camara.aspect;
    for (const m of [ brillo ]) {
      m.scale.set(ancho * 1.6, alto * 1.6, 1);
      m.position.set(0, 0, -d);
    }
    destello.scale.set(alto * 4 / 3, alto, 1);
    destello.position.set(0, 0, -d * .99);
    for (const m of negro) {
      m.scale.set(alto * 51 / 448 * 2, alto, 1);
    }
    negro[0].scale.set(ancho * 1.6, alto * 51 / 448, 1);
    negro[0].position.set(0, alto / 2 - alto * 51 / 896, -d * .98);
    negro[1].scale.set(ancho * 1.6, alto * 68 / 448, 1);
    negro[1].position.set(0, -alto / 2 + alto * 68 / 896, -d * .98);
  }
  function poner(P, {enVR: enVR = false, franjas: franjas = false} = {}) {
    anclar();
    const b = Math.min(1, P?.brillo || 0) * .375;
    brillo.visible = b > .002;
    brillo.material.color.setRGB(b, b, b, THREE.SRGBColorSpace);
    const de = P?.destello;
    destello.visible = !!de?.tex;
    if (de?.tex && destello.material.map !== de.tex) {
      const u = de.tex.userData, su = 512 / (u.ancho || 512), sv = 448 / (u.alto || 448), uv = destello.geometry.attributes.uv;
      uv.setXY(0, 0, 0);
      uv.setXY(1, su, 0);
      uv.setXY(2, 0, sv);
      uv.setXY(3, su, sv);
      uv.needsUpdate = true;
      destello.material.map = de.tex;
      destello.material.needsUpdate = true;
    }
    for (const m of negro) {
      m.visible = !enVR && franjas && P?.franjas != null;
      m.material.opacity = P?.franjas ?? 1;
    }
    const s = P?.sacudida;
    if (s && !enVR && (Math.abs(s.zoom) > 1e-4 || Math.abs(s.dy) > .001)) {
      const H = 448, W = H * camara.aspect;
      camara.zoom = 1 + s.zoom;
      camara.setViewOffset(W, H, 0, -s.dy, W, H);
      conVista = true;
    } else if (conVista) {
      camara.zoom = 1;
      camara.clearViewOffset();
      conVista = false;
    }
  }
  function quitar() {
    brillo.visible = false;
    destello.visible = false;
    for (const m of negro) m.visible = false;
    if (conVista) {
      camara.zoom = 1;
      camara.clearViewOffset();
      conVista = false;
    }
  }
  return {
    poner: poner,
    quitar: quitar
  };
}
