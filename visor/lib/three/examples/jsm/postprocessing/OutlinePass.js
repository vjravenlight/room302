// SH4 web — FeniXVOID · Project Ravenlight
import { AdditiveBlending, Color, DoubleSide, HalfFloatType, Matrix4, MeshDepthMaterial, NoBlending, RGBADepthPacking, ShaderMaterial, UniformsUtils, Vector2, Vector3, WebGLRenderTarget } from "three";

import { Pass, FullScreenQuad } from "./Pass.js";

import { CopyShader } from "../shaders/CopyShader.js";

class OutlinePass extends Pass {
  constructor(resolution, scene, camera, selectedObjects) {
    super();
    this.renderScene = scene;
    this.renderCamera = camera;
    this.selectedObjects = selectedObjects !== undefined ? selectedObjects : [];
    this.visibleEdgeColor = new Color(1, 1, 1);
    this.hiddenEdgeColor = new Color(.1, .04, .02);
    this.edgeGlow = 0;
    this.usePatternTexture = false;
    this.edgeThickness = 1;
    this.edgeStrength = 3;
    this.downSampleRatio = 2;
    this.pulsePeriod = 0;
    this._visibilityCache = new Map;
    this._selectionCache = new Set;
    this.resolution = resolution !== undefined ? new Vector2(resolution.x, resolution.y) : new Vector2(256, 256);
    const resx = Math.round(this.resolution.x / this.downSampleRatio);
    const resy = Math.round(this.resolution.y / this.downSampleRatio);
    this.renderTargetMaskBuffer = new WebGLRenderTarget(this.resolution.x, this.resolution.y);
    this.renderTargetMaskBuffer.texture.name = "OutlinePass.mask";
    this.renderTargetMaskBuffer.texture.generateMipmaps = false;
    this.depthMaterial = new MeshDepthMaterial;
    this.depthMaterial.side = DoubleSide;
    this.depthMaterial.depthPacking = RGBADepthPacking;
    this.depthMaterial.blending = NoBlending;
    this.prepareMaskMaterial = this.getPrepareMaskMaterial();
    this.prepareMaskMaterial.side = DoubleSide;
    this.prepareMaskMaterial.fragmentShader = replaceDepthToViewZ(this.prepareMaskMaterial.fragmentShader, this.renderCamera);
    this.renderTargetDepthBuffer = new WebGLRenderTarget(this.resolution.x, this.resolution.y, {
      type: HalfFloatType
    });
    this.renderTargetDepthBuffer.texture.name = "OutlinePass.depth";
    this.renderTargetDepthBuffer.texture.generateMipmaps = false;
    this.renderTargetMaskDownSampleBuffer = new WebGLRenderTarget(resx, resy, {
      type: HalfFloatType
    });
    this.renderTargetMaskDownSampleBuffer.texture.name = "OutlinePass.depthDownSample";
    this.renderTargetMaskDownSampleBuffer.texture.generateMipmaps = false;
    this.renderTargetBlurBuffer1 = new WebGLRenderTarget(resx, resy, {
      type: HalfFloatType
    });
    this.renderTargetBlurBuffer1.texture.name = "OutlinePass.blur1";
    this.renderTargetBlurBuffer1.texture.generateMipmaps = false;
    this.renderTargetBlurBuffer2 = new WebGLRenderTarget(Math.round(resx / 2), Math.round(resy / 2), {
      type: HalfFloatType
    });
    this.renderTargetBlurBuffer2.texture.name = "OutlinePass.blur2";
    this.renderTargetBlurBuffer2.texture.generateMipmaps = false;
    this.edgeDetectionMaterial = this.getEdgeDetectionMaterial();
    this.renderTargetEdgeBuffer1 = new WebGLRenderTarget(resx, resy, {
      type: HalfFloatType
    });
    this.renderTargetEdgeBuffer1.texture.name = "OutlinePass.edge1";
    this.renderTargetEdgeBuffer1.texture.generateMipmaps = false;
    this.renderTargetEdgeBuffer2 = new WebGLRenderTarget(Math.round(resx / 2), Math.round(resy / 2), {
      type: HalfFloatType
    });
    this.renderTargetEdgeBuffer2.texture.name = "OutlinePass.edge2";
    this.renderTargetEdgeBuffer2.texture.generateMipmaps = false;
    const MAX_EDGE_THICKNESS = 4;
    const MAX_EDGE_GLOW = 4;
    this.separableBlurMaterial1 = this.getSeperableBlurMaterial(MAX_EDGE_THICKNESS);
    this.separableBlurMaterial1.uniforms["texSize"].value.set(resx, resy);
    this.separableBlurMaterial1.uniforms["kernelRadius"].value = 1;
    this.separableBlurMaterial2 = this.getSeperableBlurMaterial(MAX_EDGE_GLOW);
    this.separableBlurMaterial2.uniforms["texSize"].value.set(Math.round(resx / 2), Math.round(resy / 2));
    this.separableBlurMaterial2.uniforms["kernelRadius"].value = MAX_EDGE_GLOW;
    this.overlayMaterial = this.getOverlayMaterial();
    const copyShader = CopyShader;
    this.copyUniforms = UniformsUtils.clone(copyShader.uniforms);
    this.materialCopy = new ShaderMaterial({
      uniforms: this.copyUniforms,
      vertexShader: copyShader.vertexShader,
      fragmentShader: copyShader.fragmentShader,
      blending: NoBlending,
      depthTest: false,
      depthWrite: false
    });
    this.enabled = true;
    this.needsSwap = false;
    this._oldClearColor = new Color;
    this.oldClearAlpha = 1;
    this.fsQuad = new FullScreenQuad(null);
    this.tempPulseColor1 = new Color;
    this.tempPulseColor2 = new Color;
    this.textureMatrix = new Matrix4;
    function replaceDepthToViewZ(string, camera) {
      const type = camera.isPerspectiveCamera ? "perspective" : "orthographic";
      return string.replace(/DEPTH_TO_VIEW_Z/g, type + "DepthToViewZ");
    }
  }
  dispose() {
    this.renderTargetMaskBuffer.dispose();
    this.renderTargetDepthBuffer.dispose();
    this.renderTargetMaskDownSampleBuffer.dispose();
    this.renderTargetBlurBuffer1.dispose();
    this.renderTargetBlurBuffer2.dispose();
    this.renderTargetEdgeBuffer1.dispose();
    this.renderTargetEdgeBuffer2.dispose();
    this.depthMaterial.dispose();
    this.prepareMaskMaterial.dispose();
    this.edgeDetectionMaterial.dispose();
    this.separableBlurMaterial1.dispose();
    this.separableBlurMaterial2.dispose();
    this.overlayMaterial.dispose();
    this.materialCopy.dispose();
    this.fsQuad.dispose();
  }
  setSize(width, height) {
    this.renderTargetMaskBuffer.setSize(width, height);
    this.renderTargetDepthBuffer.setSize(width, height);
    let resx = Math.round(width / this.downSampleRatio);
    let resy = Math.round(height / this.downSampleRatio);
    this.renderTargetMaskDownSampleBuffer.setSize(resx, resy);
    this.renderTargetBlurBuffer1.setSize(resx, resy);
    this.renderTargetEdgeBuffer1.setSize(resx, resy);
    this.separableBlurMaterial1.uniforms["texSize"].value.set(resx, resy);
    resx = Math.round(resx / 2);
    resy = Math.round(resy / 2);
    this.renderTargetBlurBuffer2.setSize(resx, resy);
    this.renderTargetEdgeBuffer2.setSize(resx, resy);
    this.separableBlurMaterial2.uniforms["texSize"].value.set(resx, resy);
  }
  updateSelectionCache() {
    const cache = this._selectionCache;
    function gatherSelectedMeshesCallBack(object) {
      if (object.isMesh) cache.add(object);
    }
    cache.clear();
    for (let i = 0; i < this.selectedObjects.length; i++) {
      const selectedObject = this.selectedObjects[i];
      selectedObject.traverse(gatherSelectedMeshesCallBack);
    }
  }
  changeVisibilityOfSelectedObjects(bVisible) {
    const cache = this._visibilityCache;
    for (const mesh of this._selectionCache) {
      if (bVisible === true) {
        mesh.visible = cache.get(mesh);
      } else {
        cache.set(mesh, mesh.visible);
        mesh.visible = bVisible;
      }
    }
  }
  changeVisibilityOfNonSelectedObjects(bVisible) {
    const visibilityCache = this._visibilityCache;
    const selectionCache = this._selectionCache;
    function VisibilityChangeCallBack(object) {
      if (object.isMesh || object.isSprite) {
        if (!selectionCache.has(object)) {
          const visibility = object.visible;
          if (bVisible === false || visibilityCache.get(object) === true) {
            object.visible = bVisible;
          }
          visibilityCache.set(object, visibility);
        }
      } else if (object.isPoints || object.isLine) {
        if (bVisible === true) {
          object.visible = visibilityCache.get(object);
        } else {
          visibilityCache.set(object, object.visible);
          object.visible = bVisible;
        }
      }
    }
    this.renderScene.traverse(VisibilityChangeCallBack);
  }
  updateTextureMatrix() {
    this.textureMatrix.set(.5, 0, 0, .5, 0, .5, 0, .5, 0, 0, .5, .5, 0, 0, 0, 1);
    this.textureMatrix.multiply(this.renderCamera.projectionMatrix);
    this.textureMatrix.multiply(this.renderCamera.matrixWorldInverse);
  }
  render(renderer, writeBuffer, readBuffer, deltaTime, maskActive) {
    if (this.selectedObjects.length > 0) {
      renderer.getClearColor(this._oldClearColor);
      this.oldClearAlpha = renderer.getClearAlpha();
      const oldAutoClear = renderer.autoClear;
      renderer.autoClear = false;
      if (maskActive) renderer.state.buffers.stencil.setTest(false);
      renderer.setClearColor(16777215, 1);
      this.updateSelectionCache();
      this.changeVisibilityOfSelectedObjects(false);
      const currentBackground = this.renderScene.background;
      this.renderScene.background = null;
      this.renderScene.overrideMaterial = this.depthMaterial;
      renderer.setRenderTarget(this.renderTargetDepthBuffer);
      renderer.clear();
      renderer.render(this.renderScene, this.renderCamera);
      this.changeVisibilityOfSelectedObjects(true);
      this._visibilityCache.clear();
      this.updateTextureMatrix();
      this.changeVisibilityOfNonSelectedObjects(false);
      this.renderScene.overrideMaterial = this.prepareMaskMaterial;
      this.prepareMaskMaterial.uniforms["cameraNearFar"].value.set(this.renderCamera.near, this.renderCamera.far);
      this.prepareMaskMaterial.uniforms["depthTexture"].value = this.renderTargetDepthBuffer.texture;
      this.prepareMaskMaterial.uniforms["textureMatrix"].value = this.textureMatrix;
      renderer.setRenderTarget(this.renderTargetMaskBuffer);
      renderer.clear();
      renderer.render(this.renderScene, this.renderCamera);
      this.renderScene.overrideMaterial = null;
      this.changeVisibilityOfNonSelectedObjects(true);
      this._visibilityCache.clear();
      this._selectionCache.clear();
      this.renderScene.background = currentBackground;
      this.fsQuad.material = this.materialCopy;
      this.copyUniforms["tDiffuse"].value = this.renderTargetMaskBuffer.texture;
      renderer.setRenderTarget(this.renderTargetMaskDownSampleBuffer);
      renderer.clear();
      this.fsQuad.render(renderer);
      this.tempPulseColor1.copy(this.visibleEdgeColor);
      this.tempPulseColor2.copy(this.hiddenEdgeColor);
      if (this.pulsePeriod > 0) {
        const scalar = (1 + .25) / 2 + Math.cos(performance.now() * .01 / this.pulsePeriod) * (1 - .25) / 2;
        this.tempPulseColor1.multiplyScalar(scalar);
        this.tempPulseColor2.multiplyScalar(scalar);
      }
      this.fsQuad.material = this.edgeDetectionMaterial;
      this.edgeDetectionMaterial.uniforms["maskTexture"].value = this.renderTargetMaskDownSampleBuffer.texture;
      this.edgeDetectionMaterial.uniforms["texSize"].value.set(this.renderTargetMaskDownSampleBuffer.width, this.renderTargetMaskDownSampleBuffer.height);
      this.edgeDetectionMaterial.uniforms["visibleEdgeColor"].value = this.tempPulseColor1;
      this.edgeDetectionMaterial.uniforms["hiddenEdgeColor"].value = this.tempPulseColor2;
      renderer.setRenderTarget(this.renderTargetEdgeBuffer1);
      renderer.clear();
      this.fsQuad.render(renderer);
      this.fsQuad.material = this.separableBlurMaterial1;
      this.separableBlurMaterial1.uniforms["colorTexture"].value = this.renderTargetEdgeBuffer1.texture;
      this.separableBlurMaterial1.uniforms["direction"].value = OutlinePass.BlurDirectionX;
      this.separableBlurMaterial1.uniforms["kernelRadius"].value = this.edgeThickness;
      renderer.setRenderTarget(this.renderTargetBlurBuffer1);
      renderer.clear();
      this.fsQuad.render(renderer);
      this.separableBlurMaterial1.uniforms["colorTexture"].value = this.renderTargetBlurBuffer1.texture;
      this.separableBlurMaterial1.uniforms["direction"].value = OutlinePass.BlurDirectionY;
      renderer.setRenderTarget(this.renderTargetEdgeBuffer1);
      renderer.clear();
      this.fsQuad.render(renderer);
      this.fsQuad.material = this.separableBlurMaterial2;
      this.separableBlurMaterial2.uniforms["colorTexture"].value = this.renderTargetEdgeBuffer1.texture;
      this.separableBlurMaterial2.uniforms["direction"].value = OutlinePass.BlurDirectionX;
      renderer.setRenderTarget(this.renderTargetBlurBuffer2);
      renderer.clear();
      this.fsQuad.render(renderer);
      this.separableBlurMaterial2.uniforms["colorTexture"].value = this.renderTargetBlurBuffer2.texture;
      this.separableBlurMaterial2.uniforms["direction"].value = OutlinePass.BlurDirectionY;
      renderer.setRenderTarget(this.renderTargetEdgeBuffer2);
      renderer.clear();
      this.fsQuad.render(renderer);
      this.fsQuad.material = this.overlayMaterial;
      this.overlayMaterial.uniforms["maskTexture"].value = this.renderTargetMaskBuffer.texture;
      this.overlayMaterial.uniforms["edgeTexture1"].value = this.renderTargetEdgeBuffer1.texture;
      this.overlayMaterial.uniforms["edgeTexture2"].value = this.renderTargetEdgeBuffer2.texture;
      this.overlayMaterial.uniforms["patternTexture"].value = this.patternTexture;
      this.overlayMaterial.uniforms["edgeStrength"].value = this.edgeStrength;
      this.overlayMaterial.uniforms["edgeGlow"].value = this.edgeGlow;
      this.overlayMaterial.uniforms["usePatternTexture"].value = this.usePatternTexture;
      if (maskActive) renderer.state.buffers.stencil.setTest(true);
      renderer.setRenderTarget(readBuffer);
      this.fsQuad.render(renderer);
      renderer.setClearColor(this._oldClearColor, this.oldClearAlpha);
      renderer.autoClear = oldAutoClear;
    }
    if (this.renderToScreen) {
      this.fsQuad.material = this.materialCopy;
      this.copyUniforms["tDiffuse"].value = readBuffer.texture;
      renderer.setRenderTarget(null);
      this.fsQuad.render(renderer);
    }
  }
  getPrepareMaskMaterial() {
    return new ShaderMaterial({
      uniforms: {
        depthTexture: {
          value: null
        },
        cameraNearFar: {
          value: new Vector2(.5, .5)
        },
        textureMatrix: {
          value: null
        }
      },
      vertexShader: `#include <morphtarget_pars_vertex>\n\t\t\t\t#include <skinning_pars_vertex>\n\n\t\t\t\tvarying vec4 projTexCoord;\n\t\t\t\tvarying vec4 vPosition;\n\t\t\t\tuniform mat4 textureMatrix;\n\n\t\t\t\tvoid main() {\n\n\t\t\t\t\t#include <skinbase_vertex>\n\t\t\t\t\t#include <begin_vertex>\n\t\t\t\t\t#include <morphtarget_vertex>\n\t\t\t\t\t#include <skinning_vertex>\n\t\t\t\t\t#include <project_vertex>\n\n\t\t\t\t\tvPosition = mvPosition;\n\n\t\t\t\t\tvec4 worldPosition = vec4( transformed, 1.0 );\n\n\t\t\t\t\t#ifdef USE_INSTANCING\n\n\t\t\t\t\t\tworldPosition = instanceMatrix * worldPosition;\n\n\t\t\t\t\t#endif\n\n\t\t\t\t\tworldPosition = modelMatrix * worldPosition;\n\n\t\t\t\t\tprojTexCoord = textureMatrix * worldPosition;\n\n\t\t\t\t}`,
      fragmentShader: `#include <packing>\n\t\t\t\tvarying vec4 vPosition;\n\t\t\t\tvarying vec4 projTexCoord;\n\t\t\t\tuniform sampler2D depthTexture;\n\t\t\t\tuniform vec2 cameraNearFar;\n\n\t\t\t\tvoid main() {\n\n\t\t\t\t\tfloat depth = unpackRGBAToDepth(texture2DProj( depthTexture, projTexCoord ));\n\t\t\t\t\tfloat viewZ = - DEPTH_TO_VIEW_Z( depth, cameraNearFar.x, cameraNearFar.y );\n\t\t\t\t\tfloat depthTest = (-vPosition.z > viewZ) ? 1.0 : 0.0;\n\t\t\t\t\tgl_FragColor = vec4(0.0, depthTest, 1.0, 1.0);\n\n\t\t\t\t}`
    });
  }
  getEdgeDetectionMaterial() {
    return new ShaderMaterial({
      uniforms: {
        maskTexture: {
          value: null
        },
        texSize: {
          value: new Vector2(.5, .5)
        },
        visibleEdgeColor: {
          value: new Vector3(1, 1, 1)
        },
        hiddenEdgeColor: {
          value: new Vector3(1, 1, 1)
        }
      },
      vertexShader: `varying vec2 vUv;\n\n\t\t\t\tvoid main() {\n\t\t\t\t\tvUv = uv;\n\t\t\t\t\tgl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n\t\t\t\t}`,
      fragmentShader: `varying vec2 vUv;\n\n\t\t\t\tuniform sampler2D maskTexture;\n\t\t\t\tuniform vec2 texSize;\n\t\t\t\tuniform vec3 visibleEdgeColor;\n\t\t\t\tuniform vec3 hiddenEdgeColor;\n\n\t\t\t\tvoid main() {\n\t\t\t\t\tvec2 invSize = 1.0 / texSize;\n\t\t\t\t\tvec4 uvOffset = vec4(1.0, 0.0, 0.0, 1.0) * vec4(invSize, invSize);\n\t\t\t\t\tvec4 c1 = texture2D( maskTexture, vUv + uvOffset.xy);\n\t\t\t\t\tvec4 c2 = texture2D( maskTexture, vUv - uvOffset.xy);\n\t\t\t\t\tvec4 c3 = texture2D( maskTexture, vUv + uvOffset.yw);\n\t\t\t\t\tvec4 c4 = texture2D( maskTexture, vUv - uvOffset.yw);\n\t\t\t\t\tfloat diff1 = (c1.r - c2.r)*0.5;\n\t\t\t\t\tfloat diff2 = (c3.r - c4.r)*0.5;\n\t\t\t\t\tfloat d = length( vec2(diff1, diff2) );\n\t\t\t\t\tfloat a1 = min(c1.g, c2.g);\n\t\t\t\t\tfloat a2 = min(c3.g, c4.g);\n\t\t\t\t\tfloat visibilityFactor = min(a1, a2);\n\t\t\t\t\tvec3 edgeColor = 1.0 - visibilityFactor > 0.001 ? visibleEdgeColor : hiddenEdgeColor;\n\t\t\t\t\tgl_FragColor = vec4(edgeColor, 1.0) * vec4(d);\n\t\t\t\t}`
    });
  }
  getSeperableBlurMaterial(maxRadius) {
    return new ShaderMaterial({
      defines: {
        MAX_RADIUS: maxRadius
      },
      uniforms: {
        colorTexture: {
          value: null
        },
        texSize: {
          value: new Vector2(.5, .5)
        },
        direction: {
          value: new Vector2(.5, .5)
        },
        kernelRadius: {
          value: 1
        }
      },
      vertexShader: `varying vec2 vUv;\n\n\t\t\t\tvoid main() {\n\t\t\t\t\tvUv = uv;\n\t\t\t\t\tgl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n\t\t\t\t}`,
      fragmentShader: `#include <common>\n\t\t\t\tvarying vec2 vUv;\n\t\t\t\tuniform sampler2D colorTexture;\n\t\t\t\tuniform vec2 texSize;\n\t\t\t\tuniform vec2 direction;\n\t\t\t\tuniform float kernelRadius;\n\n\t\t\t\tfloat gaussianPdf(in float x, in float sigma) {\n\t\t\t\t\treturn 0.39894 * exp( -0.5 * x * x/( sigma * sigma))/sigma;\n\t\t\t\t}\n\n\t\t\t\tvoid main() {\n\t\t\t\t\tvec2 invSize = 1.0 / texSize;\n\t\t\t\t\tfloat sigma = kernelRadius/2.0;\n\t\t\t\t\tfloat weightSum = gaussianPdf(0.0, sigma);\n\t\t\t\t\tvec4 diffuseSum = texture2D( colorTexture, vUv) * weightSum;\n\t\t\t\t\tvec2 delta = direction * invSize * kernelRadius/float(MAX_RADIUS);\n\t\t\t\t\tvec2 uvOffset = delta;\n\t\t\t\t\tfor( int i = 1; i <= MAX_RADIUS; i ++ ) {\n\t\t\t\t\t\tfloat x = kernelRadius * float(i) / float(MAX_RADIUS);\n\t\t\t\t\t\tfloat w = gaussianPdf(x, sigma);\n\t\t\t\t\t\tvec4 sample1 = texture2D( colorTexture, vUv + uvOffset);\n\t\t\t\t\t\tvec4 sample2 = texture2D( colorTexture, vUv - uvOffset);\n\t\t\t\t\t\tdiffuseSum += ((sample1 + sample2) * w);\n\t\t\t\t\t\tweightSum += (2.0 * w);\n\t\t\t\t\t\tuvOffset += delta;\n\t\t\t\t\t}\n\t\t\t\t\tgl_FragColor = diffuseSum/weightSum;\n\t\t\t\t}`
    });
  }
  getOverlayMaterial() {
    return new ShaderMaterial({
      uniforms: {
        maskTexture: {
          value: null
        },
        edgeTexture1: {
          value: null
        },
        edgeTexture2: {
          value: null
        },
        patternTexture: {
          value: null
        },
        edgeStrength: {
          value: 1
        },
        edgeGlow: {
          value: 1
        },
        usePatternTexture: {
          value: 0
        }
      },
      vertexShader: `varying vec2 vUv;\n\n\t\t\t\tvoid main() {\n\t\t\t\t\tvUv = uv;\n\t\t\t\t\tgl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n\t\t\t\t}`,
      fragmentShader: `varying vec2 vUv;\n\n\t\t\t\tuniform sampler2D maskTexture;\n\t\t\t\tuniform sampler2D edgeTexture1;\n\t\t\t\tuniform sampler2D edgeTexture2;\n\t\t\t\tuniform sampler2D patternTexture;\n\t\t\t\tuniform float edgeStrength;\n\t\t\t\tuniform float edgeGlow;\n\t\t\t\tuniform bool usePatternTexture;\n\n\t\t\t\tvoid main() {\n\t\t\t\t\tvec4 edgeValue1 = texture2D(edgeTexture1, vUv);\n\t\t\t\t\tvec4 edgeValue2 = texture2D(edgeTexture2, vUv);\n\t\t\t\t\tvec4 maskColor = texture2D(maskTexture, vUv);\n\t\t\t\t\tvec4 patternColor = texture2D(patternTexture, 6.0 * vUv);\n\t\t\t\t\tfloat visibilityFactor = 1.0 - maskColor.g > 0.0 ? 1.0 : 0.5;\n\t\t\t\t\tvec4 edgeValue = edgeValue1 + edgeValue2 * edgeGlow;\n\t\t\t\t\tvec4 finalColor = edgeStrength * maskColor.r * edgeValue;\n\t\t\t\t\tif(usePatternTexture)\n\t\t\t\t\t\tfinalColor += + visibilityFactor * (1.0 - maskColor.r) * (1.0 - patternColor.r);\n\t\t\t\t\tgl_FragColor = finalColor;\n\t\t\t\t}`,
      blending: AdditiveBlending,
      depthTest: false,
      depthWrite: false,
      transparent: true
    });
  }
}

OutlinePass.BlurDirectionX = new Vector2(1, 0);

OutlinePass.BlurDirectionY = new Vector2(0, 1);

export { OutlinePass };
