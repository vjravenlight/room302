// SH4 web — FeniXVOID · Project Ravenlight
import { bajarJuego } from "../efectos/comun.js";

import { objetivoPorEnemigos, listaDesdeModulo } from "./ruido_enemigos_antes.js";

const ETAPAS = {
  rl: 1,
  sb: 2,
  fr: 3,
  mz: 4,
  bd: 5,
  ie: 6,
  hs: 7,
  cm: 8,
  ls: 9,
  gt: 10
};

const DEF = [ 0, 32, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 0 ];

const DEF_2DA = [ 0, 64, 48, 48, 48, 48, 48, 48, 48, 48, 48, 48, 0 ];

const DESTELLO = [ 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 19, 21, 23, 25, 27, 29, 31, 32, 31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 17, 15, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1 ];

export const FILTRO = {
  ninguno: 0,
  blanqueo: 1,
  rojo: 2,
  bordeSangre: 3,
  bordeAzul: 4,
  contraste: 5,
  ilustrado: 6,
  sombra: 7,
  sombraDesenfoque: 8,
  grises: 9,
  sepia: 10
};

const MAX_RAYAS = 8;

export function crearFiltros({THREE: THREE, lib: lib, camara: camara}) {
  let texRuido = null;
  async function cargar() {
    const buf = await bajarJuego("data/system_load.bin");
    const p = lib.partesBin(buf)[0], dv = new DataView(buf, p.ofs, p.len);
    const h = 16 + dv.getUint32(16, true);
    const w = dv.getUint32(h + 32, true), al = dv.getUint32(h + 36, true), o = h + dv.getUint32(h + 80, true);
    const rgba = lib.aRGBA({
      ancho: w,
      alto: al,
      formato: "BGRA",
      datos: new Uint8Array(buf, p.ofs + o, w * al * 4)
    });
    texRuido = new THREE.DataTexture(rgba, w, al, THREE.RGBAFormat);
    texRuido.magFilter = texRuido.minFilter = THREE.NearestFilter;
    texRuido.needsUpdate = true;
    matNormal.uniforms.mapa.value = texRuido;
  }
  const uni = {
    mapa: {
      value: null
    },
    uSemilla: {
      value: 0
    },
    uBlanco: {
      value: 0
    },
    uPeli: {
      value: 0
    },
    uMota: {
      value: new THREE.Vector4(-1, 0, 0, 0)
    },
    uMotaUv: {
      value: new THREE.Vector2
    },
    uRayas: {
      value: Array.from({
        length: MAX_RAYAS
      }, () => new THREE.Vector4(-1, 0, 0, 0))
    },
    uRojo: {
      value: 0
    },
    uBorde: {
      value: new THREE.Vector4(0, 0, 0, 0)
    },
    uSombra: {
      value: 0
    },
    uCapa: {
      value: new THREE.Vector4(0, 0, 0, 0)
    },
    uDensidad: {
      value: 1
    }
  };
  const matNormal = new THREE.ShaderMaterial({
    uniforms: uni,
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
    fragmentShader: `\n      uniform sampler2D mapa; uniform float uSemilla, uBlanco, uPeli, uRojo, uSombra, uDensidad;\n      uniform vec4 uMota, uRayas[${MAX_RAYAS}], uBorde, uCapa; uniform vec2 uMotaUv;\n      varying vec2 vUv;\n      float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233)) + uSemilla) * 43758.5453); }\n      vec4 sobre(vec4 d, vec4 s) { float a = s.a + d.a * (1.0 - s.a); return vec4((s.rgb * s.a + d.rgb * d.a * (1.0 - s.a)) / max(a, 1e-4), a); }\n      void main() {\n        vec2 px = vec2(vUv.x * 1024.0, (1.0 - vUv.y) * 768.0); // coordenadas de la pantalla del PC\n        vec4 r = vec4(0.0);\n        // niebla cercana (TexFog NearFogRGBA, FUN_004336f0): pantalla entera\n        r = sobre(r, uCapa);\n        // sombra (filtro 7/8, aproximado: el PC difumina el framebuffer)\n        r = sobre(r, vec4(0.0, 0.0, 0.0, uSombra));\n        // rojo (filtro 2: FUN_005659d0, mezcla 0x44, color 0x0000ff con alfa 2v)\n        r = sobre(r, vec4(1.0, 0.0, 0.0, uRojo));\n        // bordes de sangre / azul (filtros 3 y 4; el PC suma una copia achicada y borrosa: acá, un borde de color)\n        float vin = smoothstep(0.35, 0.75, length(vUv - 0.5) * 1.414);\n        r = sobre(r, vec4(uBorde.rgb, uBorde.a * vin));\n        // grano blanco (FUN_00567040(1, v)): 40×30 celdas, cada una un cuadrado de 16×16 al azar del cuarto superior izquierdo\n        if (uBlanco > 0.0) {\n          vec2 g = vec2(vUv.x * 40.0, (1.0 - vUv.y) * 30.0) * uDensidad;\n          vec2 celda = floor(g);\n          vec2 dentro = fract(g);\n          vec2 sub = floor(vec2(hash(celda), hash(celda + 17.0)) * 4.0) * 16.0;\n          vec4 t = texture2D(mapa, (sub + dentro * 16.0) / 128.0);\n          r = sobre(r, vec4(1.0, 1.0, 1.0, t.a * uBlanco));\n        }\n        // película: una mota (celda de 16×16 de la mitad inferior izquierda) y rayas verticales (franjas de 8 px de la derecha)\n        if (uMota.x >= 0.0) {\n          vec2 q = (px - uMota.xy) / uMota.z;\n          if (q.x >= 0.0 && q.y >= 0.0 && q.x < 1.0 && q.y < 1.0) {\n            vec4 t = texture2D(mapa, (uMotaUv + q * 16.0) / 128.0);\n            r = sobre(r, vec4(1.0, 1.0, 1.0, t.a * uMota.w));\n          }\n        }\n        for (int i = 0; i < ${MAX_RAYAS}; i++) {\n          vec4 k = uRayas[i];\n          if (k.x < 0.0) continue;\n          float q = (px.x - k.x) / k.y;\n          if (q >= 0.0 && q < 1.0) {\n            vec4 t = texture2D(mapa, vec2((k.z + q * 8.0) / 128.0, px.y / 768.0));\n            r = sobre(r, vec4(1.0, 1.0, 1.0, t.a * k.w));\n          }\n        }\n        gl_FragColor = vec4(sRGBTransferEOTF(vec4(r.rgb, 1.0)).rgb, r.a);\n        #include <colorspace_fragment>\n      }`,
    transparent: true,
    depthTest: false,
    depthWrite: false
  });
  const matSuma = new THREE.ShaderMaterial({
    uniforms: {
      uSuma: {
        value: 0
      }
    },
    vertexShader: "void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
    fragmentShader: "uniform float uSuma; void main(){ gl_FragColor = vec4(1.0, 1.0, 1.0, clamp(uSuma, 0.0, 1.0)); }",
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const geo = new THREE.PlaneGeometry(1, 1);
  const planoN = new THREE.Mesh(geo, matNormal), planoS = new THREE.Mesh(geo, matSuma);
  for (const [m, o] of [ [ planoN, 9998 ], [ planoS, 9999 ] ]) {
    m.renderOrder = o;
    m.frustumCulled = false;
    m.userData.sinSombra = true;
    m.name = "filtro_pantalla";
    camara.add(m);
  }
  const D = .05, D_VR = 1.5;
  function ajustarPlano(enVR) {
    let w, h;
    const d = enVR ? D_VR : D;
    if (enVR) {
      w = h = d * 2 * Math.tan(70 * Math.PI / 180);
      w *= 4 / 3;
    } else {
      h = 2 * d * Math.tan(camara.fov * Math.PI / 360);
      w = h * camara.aspect;
    }
    uni.uDensidad.value = enVR ? 3.5 : 1;
    for (const m of [ planoN, planoS ]) {
      m.position.set(0, 0, -d);
      m.scale.set(w, h, 1);
    }
  }
  const objetivo = [ 0, 0, 0, 0, 0 ], actual = [ 0, 0, 0, 0, 0 ];
  let intensidad = 1;
  let fijo = null, cuadrosFijo = 0, etapa = 0, mitad = 1, activo = true, cuadros = 0, acum = 0, iDestello = 0, etapa10 = 0;
  const rayas = [];
  let controles = [];
  let rand = Math.random;
  let amenaza = null, vidaAmenaza = 0, fondo = "enemigos", protegido = false;
  const deEtapa = () => (mitad === 2 ? DEF_2DA : DEF)[etapa] || 0;
  function porDefecto() {
    objetivo.splice(0, 5, fondo === "juego" ? deEtapa() : 0, 0, 0, 0, 0);
    if (amenaza) for (let k = 0; k < 3; k++) objetivo[k] = Math.max(objetivo[k], amenaza[k]);
  }
  function paso() {
    for (const k of [ 0, 1, 2, 4 ]) actual[k] += Math.sign(objetivo[k] - actual[k]);
    actual[3] = objetivo[3];
    if (!activo) objetivo.fill(0); else if (fijo) objetivo.splice(0, 5, ...fijo); else porDefecto();
    if (vidaAmenaza > 0 && --vidaAmenaza === 0) amenaza = null;
    if (etapa === 10 && activo) {
      if (++etapa10 > 16) objetivo.splice(0, 5, 100, 100, 32, 1, 128);
    } else etapa10 = 0;
    uni.uSemilla.value = Math.floor(rand() * 1e3);
    uni.uBlanco.value = Math.min(1, Math.min(255, actual[0]) / 2 / 255 * intensidad);
    const peli = Math.min(1, Math.min(255, actual[1]) / 255 * intensidad);
    uni.uMota.value.set(-1, 0, 0, 0);
    if (actual[1] > 0) {
      if (rand() < .5) {
        const tam = 12 + Math.floor(rand() * 64);
        uni.uMota.value.set(Math.floor(rand() * 1024) * .97, Math.floor(rand() * 768) * .97, tam, peli);
        uni.uMotaUv.value.set(Math.floor(rand() * 4) * 16, (Math.floor(rand() * 4) + 4) * 16);
      }
      if (rand() < 1 / 16 && rayas.length < MAX_RAYAS) rayas.push({
        x: Math.floor(rand() * 1024),
        ancho: 5 + Math.floor(rand() * 8),
        temblor: 5 + Math.floor(rand() * 16),
        dir: rand() < .5 ? -1 : 1,
        vida: 16 + Math.floor(rand() * 64)
      });
    }
    for (let i = rayas.length - 1; i >= 0; i--) {
      const r = rayas[i];
      r.x += (Math.floor(rand() * 32768) % r.temblor - 8) * r.dir;
      r.u = 64 + Math.floor(rand() * 8) * 8;
      if (--r.vida <= 0) rayas.splice(i, 1);
    }
    uni.uRayas.value.forEach((v, i) => {
      const r = rayas[i];
      if (r) v.set(r.x, r.ancho, r.u, peli); else v.set(-1, 0, 0, 0);
    });
    let suma = 0;
    if (actual[2] > 0) {
      iDestello = iDestello + Math.floor(rand() * 40) + 1 & 63;
      suma = (Math.min(128, actual[2]) * DESTELLO[iDestello] >> 7) / 255 * intensidad;
    }
    let rojo = 0, sombra = 0;
    const borde = [ 0, 0, 0, 0 ];
    for (const [tipo, v] of controles) {
      if (tipo === 1) suma += Math.min(128, v) / 255; else if (tipo === 2) rojo = Math.max(rojo, Math.min(128, v * 2) / 255); else if (tipo === 3) borde.splice(0, 4, 1, 0, 0, Math.min(255, v * 2) / 255); else if (tipo === 4) borde.splice(0, 4, 0, 0, 1, Math.min(255, v * 2) / 255); else if (tipo === 7 || tipo === 8) sombra = Math.max(sombra, Math.min(128, v) / 255);
    }
    controles = [];
    uni.uRojo.value = rojo;
    uni.uSombra.value = sombra;
    uni.uBorde.value.set(...borde);
    matSuma.uniforms.uSuma.value = suma;
  }
  return {
    cargar: cargar,
    alCargarSala(sala) {
      etapa = ETAPAS[sala?.slice(0, 2)] || 0;
    },
    actualizar(dt, enVR = false) {
      ajustarPlano(enVR);
      acum = Math.min(acum + dt, .25);
      while (acum >= 1 / 30) {
        acum -= 1 / 30;
        paso();
        cuadros++;
        if (cuadrosFijo > 0 && --cuadrosFijo === 0) fijo = null;
      }
      const vis = activo && (uni.uBlanco.value > 0 || uni.uMota.value.x >= 0 || rayas.length || uni.uRojo.value || uni.uBorde.value.w || uni.uSombra.value || uni.uCapa.value.w);
      planoN.visible = !!vis;
      planoS.visible = matSuma.uniforms.uSuma.value > 0;
    },
    fijar(v, seg = 0) {
      fijo = v ? [ v[0] | 0, v[1] | 0, v[2] | 0, v[3] | 0, v[4] | 0 ] : null;
      cuadrosFijo = fijo && seg > 0 ? Math.max(1, Math.round(seg * 30)) : 0;
    },
    control(tipo, valor) {
      if (controles.length < 4) controles.push([ tipo, valor ]);
    },
    capaCercana(c) {
      if (c) uni.uCapa.value.set(...c); else uni.uCapa.value.set(0, 0, 0, 0);
    },
    enemigos(x, o = {}) {
      const lista = Array.isArray(x) ? x : x?.enemigos ? listaDesdeModulo(x, {
        THREE: THREE,
        camara: camara,
        escala: o.escala ?? .005
      }) : [];
      amenaza = objetivoPorEnemigos(lista, {
        etapa: etapa,
        mitad: mitad,
        protegido: o.protegido ?? protegido,
        fondoEtapa: deEtapa()
      });
      vidaAmenaza = amenaza ? 3 : 0;
      return amenaza;
    },
    opciones(o = {}) {
      if ("activo" in o) activo = o.activo;
      if ("intensidad" in o) intensidad = Math.max(0, o.intensidad);
      if ("mitad" in o) mitad = o.mitad;
      if (o.rand) rand = o.rand;
      if ("fondo" in o) fondo = o.fondo === "juego" ? "juego" : "enemigos";
      if ("protegido" in o) protegido = !!o.protegido;
    },
    get estado() {
      return {
        etapa: etapa,
        mitad: mitad,
        activo: activo,
        fondo: fondo,
        intensidad: intensidad,
        amenaza: amenaza && [ ...amenaza ],
        objetivo: [ ...objetivo ],
        actual: [ ...actual ],
        rayas: rayas.length
      };
    },
    planos: [ planoN, planoS ]
  };
}
