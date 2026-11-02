// SH4 web — FeniXVOID · Project Ravenlight
import { Color, HalfFloatType, MeshDepthMaterial, NearestFilter, NoBlending, RGBADepthPacking, ShaderMaterial, UniformsUtils, WebGLRenderTarget } from "three";

import { Pass, FullScreenQuad } from "./Pass.js";

import { BokehShader } from "../shaders/BokehShader.js";

class BokehPass extends Pass {
  constructor(scene, camera, params) {
    super();
    this.scene = scene;
    this.camera = camera;
    const focus = params.focus !== undefined ? params.focus : 1;
    const aperture = params.aperture !== undefined ? params.aperture : .025;
    const maxblur = params.maxblur !== undefined ? params.maxblur : 1;
    this.renderTargetDepth = new WebGLRenderTarget(1, 1, {
      minFilter: NearestFilter,
      magFilter: NearestFilter,
      type: HalfFloatType
    });
    this.renderTargetDepth.texture.name = "BokehPass.depth";
    this.materialDepth = new MeshDepthMaterial;
    this.materialDepth.depthPacking = RGBADepthPacking;
    this.materialDepth.blending = NoBlending;
    const bokehShader = BokehShader;
    const bokehUniforms = UniformsUtils.clone(bokehShader.uniforms);
    bokehUniforms["tDepth"].value = this.renderTargetDepth.texture;
    bokehUniforms["focus"].value = focus;
    bokehUniforms["aspect"].value = camera.aspect;
    bokehUniforms["aperture"].value = aperture;
    bokehUniforms["maxblur"].value = maxblur;
    bokehUniforms["nearClip"].value = camera.near;
    bokehUniforms["farClip"].value = camera.far;
    this.materialBokeh = new ShaderMaterial({
      defines: Object.assign({}, bokehShader.defines),
      uniforms: bokehUniforms,
      vertexShader: bokehShader.vertexShader,
      fragmentShader: bokehShader.fragmentShader
    });
    this.uniforms = bokehUniforms;
    this.fsQuad = new FullScreenQuad(this.materialBokeh);
    this._oldClearColor = new Color;
  }
  render(renderer, writeBuffer, readBuffer) {
    this.scene.overrideMaterial = this.materialDepth;
    renderer.getClearColor(this._oldClearColor);
    const oldClearAlpha = renderer.getClearAlpha();
    const oldAutoClear = renderer.autoClear;
    renderer.autoClear = false;
    renderer.setClearColor(16777215);
    renderer.setClearAlpha(1);
    renderer.setRenderTarget(this.renderTargetDepth);
    renderer.clear();
    renderer.render(this.scene, this.camera);
    this.uniforms["tColor"].value = readBuffer.texture;
    this.uniforms["nearClip"].value = this.camera.near;
    this.uniforms["farClip"].value = this.camera.far;
    if (this.renderToScreen) {
      renderer.setRenderTarget(null);
      this.fsQuad.render(renderer);
    } else {
      renderer.setRenderTarget(writeBuffer);
      renderer.clear();
      this.fsQuad.render(renderer);
    }
    this.scene.overrideMaterial = null;
    renderer.setClearColor(this._oldClearColor);
    renderer.setClearAlpha(oldClearAlpha);
    renderer.autoClear = oldAutoClear;
  }
  setSize(width, height) {
    this.materialBokeh.uniforms["aspect"].value = width / height;
    this.renderTargetDepth.setSize(width, height);
  }
  dispose() {
    this.renderTargetDepth.dispose();
    this.materialDepth.dispose();
    this.materialBokeh.dispose();
    this.fsQuad.dispose();
  }
}

export { BokehPass };
