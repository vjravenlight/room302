// SH4 web — FeniXVOID · Project Ravenlight
import * as THREE from "three";

const ESCALA = .005;

const VERT = `varying vec2 vUv; void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const FRAG = `\nuniform sampler2D tColor; uniform sampler2D tProf; uniform sampler2D tPeque;\nuniform float cerca, lejos, inten, borroso;\nuniform vec4 planos;   // metros de vista: lejos1, lejos2, cerca1, cerca2\nuniform vec4 usar;     // 1/0 por pasada (mismo orden)\nuniform vec2 px;       // un píxel de la pantalla del juego (640×480) en coordenadas uv\nvarying vec2 vUv;\nvec3 aGamma(vec3 c) { return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c)); }\nvec3 copia(vec2 o) { return aGamma(texture2D(tColor, clamp(vUv + o, vec2(0.0), vec2(1.0))).rgb); }\nfloat vista(float z) { float n = z * 2.0 - 1.0; return 2.0 * cerca * lejos / (lejos + cerca - n * (lejos - cerca)); }\nvoid main() {\n  vec3 c = copia(vec2(0.0));\n  float d = vista(texture2D(tProf, vUv).x);\n  // la pantalla del juego tiene y para abajo: "+y" del juego es −y en uv\n  if (usar.x > 0.5 && d >= planos.x) { c = mix(c, copia(vec2( 3.0 * inten * px.x, 0.0)), 85.0 / 128.0); c = mix(c, copia(vec2(-3.0 * inten * px.x, 0.0)), 51.0 / 128.0); }\n  if (usar.y > 0.5 && d >= planos.y) { c = mix(c, copia(vec2(0.0, -2.0 * inten * px.y)), 32.0 / 128.0); c = mix(c, copia(vec2(0.0,  2.0 * inten * px.y)), 25.0 / 128.0); }\n  if (usar.z > 0.5 && d <= planos.z) { c = mix(c, copia(vec2( 4.0 * inten * px.x, 0.0)), 54.0 / 128.0); c = mix(c, copia(vec2(-4.0 * inten * px.x, 0.0)), 38.0 / 128.0); }\n  if (usar.w > 0.5 && d <= planos.w) { c = mix(c, copia(vec2(0.0, -6.0 * inten * px.y)), 42.0 / 128.0); c = mix(c, copia(vec2(0.0,  6.0 * inten * px.y)), 32.0 / 128.0); }\n  // difuminado de d_047: la copia de 40×30 estirada (bilineal) con alfa fijo\n  if (borroso > 0.0) c = mix(c, aGamma(texture2D(tPeque, vUv).rgb), borroso);\n  gl_FragColor = vec4(c, 1.0);\n}`;

export function crearFoco({M: M}) {
  const {renderer: renderer, escena: escena, camara: camara, jugador: jugador} = M;
  const qs = new URLSearchParams(location.search);
  let rt = null, rtPeque = null, activo = false, apagadoPorPedido = qs.has("sinfoco"), sinBorroso = qs.has("sinborroso");
  let dof = false, borroso = 0;
  const estado = {
    tipo: 0,
    nivel: 0,
    profundidad: 0,
    rango: 0,
    intensidad: 1
  };
  const uni = {
    tColor: {
      value: null
    },
    tProf: {
      value: null
    },
    tPeque: {
      value: null
    },
    borroso: {
      value: 0
    },
    cerca: {
      value: .02
    },
    lejos: {
      value: 400
    },
    inten: {
      value: 1
    },
    planos: {
      value: new THREE.Vector4
    },
    usar: {
      value: new THREE.Vector4
    },
    px: {
      value: new THREE.Vector2
    }
  };
  const mat = new THREE.ShaderMaterial({
    uniforms: uni,
    vertexShader: VERT,
    fragmentShader: FRAG,
    depthTest: false,
    depthWrite: false
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  quad.frustumCulled = false;
  const escenaQuad = new THREE.Scene;
  escenaQuad.add(quad);
  const camQuad = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const tam = new THREE.Vector2;
  const matPeque = new THREE.ShaderMaterial({
    uniforms: {
      tColor: uni.tColor
    },
    vertexShader: VERT,
    depthTest: false,
    depthWrite: false,
    fragmentShader: "uniform sampler2D tColor; varying vec2 vUv; void main() { gl_FragColor = vec4(texture2D(tColor, vUv).rgb, 1.0); }"
  });
  const quadPeque = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), matPeque);
  quadPeque.frustumCulled = false;
  const escenaPeque = new THREE.Scene;
  escenaPeque.add(quadPeque);
  function asegurarRT() {
    renderer.getDrawingBufferSize(tam);
    if (rt && rt.width === tam.x && rt.height === tam.y) return;
    rt?.dispose();
    const prof = new THREE.DepthTexture(tam.x, tam.y, THREE.UnsignedInt248Type);
    prof.format = THREE.DepthStencilFormat;
    rt = new THREE.WebGLRenderTarget(tam.x, tam.y, {
      type: THREE.HalfFloatType,
      depthBuffer: true,
      stencilBuffer: true,
      depthTexture: prof,
      samples: 4
    });
    uni.tColor.value = rt.texture;
    uni.tProf.value = rt.depthTexture;
    rtPeque?.dispose();
    rtPeque = new THREE.WebGLRenderTarget(Math.max(1, Math.round(30 * tam.x / tam.y)), 30, {
      type: THREE.HalfFloatType,
      depthBuffer: false
    });
    uni.tPeque.value = rtPeque.texture;
  }
  function refrescar() {
    const quiere = dof && !apagadoPorPedido || borroso > 0 && !sinBorroso;
    if (quiere !== activo) {
      activo = quiere;
      M.ponerDibujo(activo ? dibujar : null);
    }
  }
  function desdeCamara(cam) {
    const tipo = cam?.shorts?.[0] | 0, nivel = cam?.shorts?.[1] | 0;
    if (!(tipo > 0 && tipo < 4 && nivel > 0 && nivel < 3)) {
      estado.tipo = 0;
      dof = false;
      return refrescar();
    }
    estado.tipo = tipo;
    estado.nivel = Math.min(2, nivel);
    estado.profundidad = cam.floats[1];
    estado.rango = cam.floats[2] || 100;
    estado.intensidad = cam.floats[3] || 1;
    dof = true;
    refrescar();
  }
  function apagar() {
    dof = false;
    borroso = 0;
    refrescar();
  }
  function dibujar() {
    if (!activo) return false;
    asegurarRT();
    const {tipo: tipo, nivel: nivel, profundidad: d, rango: r, intensidad: intensidad} = estado;
    const n = camara.near, f = camara.far, rec = x => Math.min(f, Math.max(n, x * ESCALA));
    uni.cerca.value = n;
    uni.lejos.value = f;
    uni.inten.value = intensidad;
    uni.planos.value.set(rec(d + r), rec(d + 3 * r), rec(d - r), rec(d - 3 * r));
    const k = dof && !apagadoPorPedido ? 1 : 0;
    uni.usar.value.set(k && tipo & 2 ? 1 : 0, k && tipo & 2 && nivel >= 2 ? 1 : 0, k && tipo & 1 ? 1 : 0, k && tipo & 1 && nivel >= 2 ? 1 : 0);
    uni.borroso.value = sinBorroso ? 0 : borroso;
    const asp = tam.x / tam.y;
    uni.px.value.set(1 / (480 * asp), 1 / 480);
    const hud = camara.children.filter(o => o.visible);
    hud.forEach(o => {
      o.visible = false;
    });
    renderer.setRenderTarget(rt);
    renderer.clear();
    renderer.render(escena, camara);
    hud.forEach(o => {
      o.visible = true;
    });
    if (uni.borroso.value > 0) {
      renderer.setRenderTarget(rtPeque);
      renderer.render(escenaPeque, camQuad);
    }
    renderer.setRenderTarget(null);
    renderer.render(escenaQuad, camQuad);
    if (hud.length) {
      const fondo = escena.background, otros = escena.children.filter(o => o !== jugador && o.visible);
      escena.background = null;
      otros.forEach(o => {
        o.visible = false;
      });
      const ac = renderer.autoClear;
      renderer.autoClear = false;
      renderer.clearDepth();
      renderer.render(escena, camara);
      renderer.autoClear = ac;
      escena.background = fondo;
      otros.forEach(o => {
        o.visible = true;
      });
    }
    return true;
  }
  return {
    desdeCamara: desdeCamara,
    apagar: apagar,
    dibujar: dibujar,
    borroso(a) {
      const b = Math.max(0, Math.min(1, +a || 0));
      if (b !== borroso) {
        borroso = b;
        refrescar();
      }
    },
    get activo() {
      return activo;
    },
    get estado() {
      return {
        ...estado,
        activo: activo,
        desenfoque: dof,
        borroso: borroso
      };
    },
    permitir(si) {
      apagadoPorPedido = !si;
      refrescar();
    },
    permitirBorroso(si) {
      sinBorroso = !si;
      refrescar();
    }
  };
}
