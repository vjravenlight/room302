// SH4 web — FeniXVOID · Project Ravenlight
import { Vector2 } from "three";

const ConvolutionShader = {
  name: "ConvolutionShader",
  defines: {
    KERNEL_SIZE_FLOAT: "25.0",
    KERNEL_SIZE_INT: "25"
  },
  uniforms: {
    tDiffuse: {
      value: null
    },
    uImageIncrement: {
      value: new Vector2(.001953125, 0)
    },
    cKernel: {
      value: []
    }
  },
  vertexShader: `\n\n\t\tuniform vec2 uImageIncrement;\n\n\t\tvarying vec2 vUv;\n\n\t\tvoid main() {\n\n\t\t\tvUv = uv - ( ( KERNEL_SIZE_FLOAT - 1.0 ) / 2.0 ) * uImageIncrement;\n\t\t\tgl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n\n\t\t}`,
  fragmentShader: `\n\n\t\tuniform float cKernel[ KERNEL_SIZE_INT ];\n\n\t\tuniform sampler2D tDiffuse;\n\t\tuniform vec2 uImageIncrement;\n\n\t\tvarying vec2 vUv;\n\n\t\tvoid main() {\n\n\t\t\tvec2 imageCoord = vUv;\n\t\t\tvec4 sum = vec4( 0.0, 0.0, 0.0, 0.0 );\n\n\t\t\tfor( int i = 0; i < KERNEL_SIZE_INT; i ++ ) {\n\n\t\t\t\tsum += texture2D( tDiffuse, imageCoord ) * cKernel[ i ];\n\t\t\t\timageCoord += uImageIncrement;\n\n\t\t\t}\n\n\t\t\tgl_FragColor = sum;\n\n\t\t}`,
  buildKernel: function(sigma) {
    const kMaxKernelSize = 25;
    let kernelSize = 2 * Math.ceil(sigma * 3) + 1;
    if (kernelSize > kMaxKernelSize) kernelSize = kMaxKernelSize;
    const halfWidth = (kernelSize - 1) * .5;
    const values = new Array(kernelSize);
    let sum = 0;
    for (let i = 0; i < kernelSize; ++i) {
      values[i] = gauss(i - halfWidth, sigma);
      sum += values[i];
    }
    for (let i = 0; i < kernelSize; ++i) values[i] /= sum;
    return values;
  }
};

function gauss(x, sigma) {
  return Math.exp(-(x * x) / (2 * sigma * sigma));
}

export { ConvolutionShader };
