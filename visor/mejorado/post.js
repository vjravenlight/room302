// SH4 web — FeniXVOID · Project Ravenlight
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";

import { RenderPass } from "three/addons/postprocessing/RenderPass.js";

import { GTAOPass } from "three/addons/postprocessing/GTAOPass.js";

import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";

import { BokehPass } from "three/addons/postprocessing/BokehPass.js";

import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";

import { HOMBRO } from "./material.js";

class GTAOSH4 extends GTAOPass {
  constructor(...a) {
    super(...a);
    this.normalMaterial.side = 2;
    this.normalMaterial.flatShading = true;
    this.normalMaterial.needsUpdate = true;
  }
  overrideVisibility() {
    super.overrideVisibility();
    this.scene.traverse(o => {
      if (!o.isMesh && !o.isSprite) return;
      const u = o.userData;
      if (u.grupo && u.grupo !== "normal" || u.sinAO || o.material?.wireframe || o.material?.transparent) o.visible = false;
    });
  }
}

const ACABADO = {
  uniforms: {
    tDiffuse: {
      value: null
    },
    uTiempo: {
      value: 0
    },
    uRes: {
      value: null
    },
    uAberracion: {
      value: 0
    },
    uVineta: {
      value: 0
    },
    uGrano: {
      value: 0
    },
    uSaturacion: {
      value: 1
    },
    uContraste: {
      value: 1
    }
  },
  vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
  fragmentShader: `\n    uniform sampler2D tDiffuse; uniform float uTiempo, uAberracion, uVineta, uGrano, uSaturacion, uContraste; uniform vec2 uRes;\n    varying vec2 vUv;\n    ${HOMBRO.replace(/sh4Hombro/g, "acHombro")}\n    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }\n    void main() {\n      vec2 c = vUv - 0.5; float r2 = dot(c, c);\n      vec2 off = c * r2 * uAberracion;\n      vec3 col = vec3(texture2D(tDiffuse, vUv + off).r, texture2D(tDiffuse, vUv).g, texture2D(tDiffuse, vUv - off).b);\n      float l = dot(col, vec3(0.2126, 0.7152, 0.0722));\n      col = mix(vec3(l), col, uSaturacion);\n      col = (col - 0.2) * uContraste + 0.2; // pivote bajo: SH4 es casi todo oscuro y con 0,5 el contraste hundía las sombras\n      col *= 1.0 - uVineta * smoothstep(0.15, 0.5, r2); // solo las esquinas: con el color del PC (más oscuro) comía la imagen\n      float g = hash(floor(vUv * uRes) + fract(uTiempo * 7.0) * vec2(113.0, 71.0)) - 0.5;\n      col += g * uGrano * (1.0 - 0.6 * l);   // como en película: más grano en las sombras\n      col = acHombroRGB(max(col, vec3(0.0)), 0.9); // OutputPass no recorta (HalfFloat): acá se comprimen los blancos\n      gl_FragColor = vec4(col, 1.0);\n    }`
};

export function crearPost(THREE, renderer, escena, camara) {
  const tam = renderer.getSize(new THREE.Vector2);
  const pr = renderer.getPixelRatio();
  let composer = null, pases = null, config = null;
  function armar(p) {
    composer?.dispose?.();
    pases?.ao?.dispose?.();
    pases?.bloom?.dispose?.();
    const rt = new THREE.WebGLRenderTarget(tam.x * pr, tam.y * pr, {
      type: THREE.HalfFloatType,
      samples: p.msaa || 0,
      depthBuffer: true,
      stencilBuffer: true
    });
    composer = new EffectComposer(renderer, rt);
    composer.setPixelRatio(renderer.getPixelRatio());
    composer.setSize(tam.x, tam.y);
    pases = {};
    composer.addPass(new RenderPass(escena, camara));
    if (p.ao) {
      pases.ao = new GTAOSH4(escena, camara, tam.x, tam.y);
      pases.ao.updateGtaoMaterial({
        radius: p.ao.radio,
        distanceExponent: 1,
        thickness: 1,
        scale: 1,
        samples: p.ao.muestras,
        distanceFallOff: 1
      });
      pases.ao.updatePdMaterial({
        lumaPhi: 10,
        depthPhi: 2,
        normalPhi: 3,
        radius: 6,
        rings: 2,
        samples: p.ao.muestras
      });
      pases.ao.blendIntensity = p.ao.fuerza;
      composer.addPass(pases.ao);
    }
    if (p.bloom) {
      pases.bloom = new UnrealBloomPass(new THREE.Vector2(tam.x, tam.y), p.bloom.fuerza, p.bloom.radio, p.bloom.umbral);
      composer.addPass(pases.bloom);
    }
    if (p.dof) {
      pases.dof = new BokehPass(escena, camara, {
        focus: 2,
        aperture: p.dof.apertura,
        maxblur: p.dof.maximo
      });
      composer.addPass(pases.dof);
    }
    composer.addPass(new OutputPass);
    pases.acabado = new ShaderPass(ACABADO);
    pases.acabado.uniforms.uRes.value = new THREE.Vector2(tam.x, tam.y);
    composer.addPass(pases.acabado);
    config = p;
  }
  const capa = new THREE.Scene;
  capa.name = "capa de pantalla (encima del post)";
  capa.matrixAutoUpdate = false;
  const enCapa = [];
  const esCapa = o => o.isMesh && o.visible && o.renderOrder >= 900 && o.material && o.material.depthTest === false;
  function juntarCapa() {
    enCapa.length = 0;
    camara.traverse(o => {
      if (o !== camara && esCapa(o) && o.parent === camara) enCapa.push(o);
    });
    for (const o of enCapa) o.visible = false;
    return enCapa.length;
  }
  function dibujarCapa() {
    if (!enCapa.length) return;
    camara.updateMatrixWorld();
    capa.matrix.copy(camara.matrixWorld);
    capa.matrixWorldNeedsUpdate = true;
    const padres = enCapa.map(o => o.parent);
    for (const o of enCapa) {
      o.visible = true;
      capa.add(o);
    }
    const auto = renderer.autoClear, tm = renderer.toneMapping;
    renderer.autoClear = false;
    renderer.toneMapping = THREE.NoToneMapping;
    renderer.setRenderTarget(null);
    renderer.render(capa, camara);
    renderer.autoClear = auto;
    renderer.toneMapping = tm;
    enCapa.forEach((o, i) => padres[i].add(o));
  }
  const ahora = new THREE.Vector2;
  return {
    get pases() {
      return pases;
    },
    configurar(p) {
      armar(p);
    },
    dibujar(dt, animo, foco) {
      renderer.getSize(ahora);
      if (!ahora.equals(tam) || renderer.getPixelRatio() !== composer._pixelRatio) {
        tam.copy(ahora);
        composer.setPixelRatio(renderer.getPixelRatio());
        composer.setSize(tam.x, tam.y);
        pases.acabado.uniforms.uRes.value.set(tam.x, tam.y);
      }
      const u = pases.acabado.uniforms;
      u.uTiempo.value += dt;
      u.uAberracion.value = animo.aberracion;
      u.uVineta.value = animo.vineta;
      u.uGrano.value = animo.grano;
      u.uSaturacion.value = animo.saturacion;
      u.uContraste.value = animo.contraste;
      if (pases.dof && foco) pases.dof.uniforms.focus.value = foco;
      if (juntarCapa() && enCapa.some(o => o.name === "filtro_pantalla")) u.uGrano.value = 0;
      composer.render(dt);
      dibujarCapa();
    },
    get config() {
      return config;
    }
  };
}
