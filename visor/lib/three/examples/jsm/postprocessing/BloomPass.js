// SH4 web — FeniXVOID · Project Ravenlight
import { AdditiveBlending, HalfFloatType, ShaderMaterial, UniformsUtils, Vector2, WebGLRenderTarget } from "three";

import { Pass, FullScreenQuad } from "./Pass.js";

import { ConvolutionShader } from "../shaders/ConvolutionShader.js";

class BloomPass extends Pass {
  constructor(strength = 1, kernelSize = 25, sigma = 4) {
    super();
    this.renderTargetX = new WebGLRenderTarget(1, 1, {
      type: HalfFloatType
    });
    this.renderTargetX.texture.name = "BloomPass.x";
    this.renderTargetY = new WebGLRenderTarget(1, 1, {
      type: HalfFloatType
    });
    this.renderTargetY.texture.name = "BloomPass.y";
    this.combineUniforms = UniformsUtils.clone(CombineShader.uniforms);
    this.combineUniforms["strength"].value = strength;
    this.materialCombine = new ShaderMaterial({
      name: CombineShader.name,
      uniforms: this.combineUniforms,
      vertexShader: CombineShader.vertexShader,
      fragmentShader: CombineShader.fragmentShader,
      blending: AdditiveBlending,
      transparent: true
    });
    const convolutionShader = ConvolutionShader;
    this.convolutionUniforms = UniformsUtils.clone(convolutionShader.uniforms);
    this.convolutionUniforms["uImageIncrement"].value = BloomPass.blurX;
    this.convolutionUniforms["cKernel"].value = ConvolutionShader.buildKernel(sigma);
    this.materialConvolution = new ShaderMaterial({
      name: convolutionShader.name,
      uniforms: this.convolutionUniforms,
      vertexShader: convolutionShader.vertexShader,
      fragmentShader: convolutionShader.fragmentShader,
      defines: {
        KERNEL_SIZE_FLOAT: kernelSize.toFixed(1),
        KERNEL_SIZE_INT: kernelSize.toFixed(0)
      }
    });
    this.needsSwap = false;
    this.fsQuad = new FullScreenQuad(null);
  }
  render(renderer, writeBuffer, readBuffer, deltaTime, maskActive) {
    if (maskActive) renderer.state.buffers.stencil.setTest(false);
    this.fsQuad.material = this.materialConvolution;
    this.convolutionUniforms["tDiffuse"].value = readBuffer.texture;
    this.convolutionUniforms["uImageIncrement"].value = BloomPass.blurX;
    renderer.setRenderTarget(this.renderTargetX);
    renderer.clear();
    this.fsQuad.render(renderer);
    this.convolutionUniforms["tDiffuse"].value = this.renderTargetX.texture;
    this.convolutionUniforms["uImageIncrement"].value = BloomPass.blurY;
    renderer.setRenderTarget(this.renderTargetY);
    renderer.clear();
    this.fsQuad.render(renderer);
    this.fsQuad.material = this.materialCombine;
    this.combineUniforms["tDiffuse"].value = this.renderTargetY.texture;
    if (maskActive) renderer.state.buffers.stencil.setTest(true);
    renderer.setRenderTarget(readBuffer);
    if (this.clear) renderer.clear();
    this.fsQuad.render(renderer);
  }
  setSize(width, height) {
    this.renderTargetX.setSize(width, height);
    this.renderTargetY.setSize(width, height);
  }
  dispose() {
    this.renderTargetX.dispose();
    this.renderTargetY.dispose();
    this.materialCombine.dispose();
    this.materialConvolution.dispose();
    this.fsQuad.dispose();
  }
}

const CombineShader = {
  name: "CombineShader",
  uniforms: {
    tDiffuse: {
      value: null
    },
    strength: {
      value: 1
    }
  },
  vertexShader: `\n\n\t\tvarying vec2 vUv;\n\n\t\tvoid main() {\n\n\t\t\tvUv = uv;\n\t\t\tgl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n\n\t\t}`,
  fragmentShader: `\n\n\t\tuniform float strength;\n\n\t\tuniform sampler2D tDiffuse;\n\n\t\tvarying vec2 vUv;\n\n\t\tvoid main() {\n\n\t\t\tvec4 texel = texture2D( tDiffuse, vUv );\n\t\t\tgl_FragColor = strength * texel;\n\n\t\t}`
};

BloomPass.blurX = new Vector2(.001953125, 0);

BloomPass.blurY = new Vector2(0, .001953125);

export { BloomPass };
