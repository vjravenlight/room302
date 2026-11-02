// SH4 web — FeniXVOID · Project Ravenlight
import { PlaneGeometry, ShaderMaterial, Uniform, Mesh, PerspectiveCamera, Scene, WebGLRenderer, CanvasTexture, SRGBColorSpace } from "three";

let _renderer;

let fullscreenQuadGeometry;

let fullscreenQuadMaterial;

let fullscreenQuad;

export function decompress(texture, maxTextureSize = Infinity, renderer = null) {
  if (!fullscreenQuadGeometry) fullscreenQuadGeometry = new PlaneGeometry(2, 2, 1, 1);
  if (!fullscreenQuadMaterial) fullscreenQuadMaterial = new ShaderMaterial({
    uniforms: {
      blitTexture: new Uniform(texture)
    },
    vertexShader: `\n\t\t\tvarying vec2 vUv;\n\t\t\tvoid main(){\n\t\t\t\tvUv = uv;\n\t\t\t\tgl_Position = vec4(position.xy * 1.0,0.,.999999);\n\t\t\t}`,
    fragmentShader: `\n\t\t\tuniform sampler2D blitTexture; \n\t\t\tvarying vec2 vUv;\n\n\t\t\tvoid main(){ \n\t\t\t\tgl_FragColor = vec4(vUv.xy, 0, 1);\n\t\t\t\t\n\t\t\t\t#ifdef IS_SRGB\n\t\t\t\tgl_FragColor = sRGBTransferOETF( texture2D( blitTexture, vUv) );\n\t\t\t\t#else\n\t\t\t\tgl_FragColor = texture2D( blitTexture, vUv);\n\t\t\t\t#endif\n\t\t\t}`
  });
  fullscreenQuadMaterial.uniforms.blitTexture.value = texture;
  fullscreenQuadMaterial.defines.IS_SRGB = texture.colorSpace == SRGBColorSpace;
  fullscreenQuadMaterial.needsUpdate = true;
  if (!fullscreenQuad) {
    fullscreenQuad = new Mesh(fullscreenQuadGeometry, fullscreenQuadMaterial);
    fullscreenQuad.frustumCulled = false;
  }
  const _camera = new PerspectiveCamera;
  const _scene = new Scene;
  _scene.add(fullscreenQuad);
  if (renderer === null) {
    renderer = _renderer = new WebGLRenderer({
      antialias: false
    });
  }
  const width = Math.min(texture.image.width, maxTextureSize);
  const height = Math.min(texture.image.height, maxTextureSize);
  renderer.setSize(width, height);
  renderer.clear();
  renderer.render(_scene, _camera);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  canvas.width = width;
  canvas.height = height;
  context.drawImage(renderer.domElement, 0, 0, width, height);
  const readableTexture = new CanvasTexture(canvas);
  readableTexture.minFilter = texture.minFilter;
  readableTexture.magFilter = texture.magFilter;
  readableTexture.wrapS = texture.wrapS;
  readableTexture.wrapT = texture.wrapT;
  readableTexture.colorSpace = texture.colorSpace;
  readableTexture.name = texture.name;
  if (_renderer) {
    _renderer.forceContextLoss();
    _renderer.dispose();
    _renderer = null;
  }
  return readableTexture;
}
