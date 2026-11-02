// SH4 web — FeniXVOID · Project Ravenlight
import { NIEBLA_RADIAL } from "../lib/niebla_radial.js";

export const HOMBRO = `\nfloat sh4Hombro( float x, float k ) { return x <= k ? x : k + ( 1.0 - k ) * ( 1.0 - exp( - ( x - k ) / ( 1.0 - k ) ) ); }\nvec3 sh4HombroRGB( vec3 c, float k ) { float p = max( c.r, max( c.g, c.b ) ); return p <= k ? c : c * ( sh4Hombro( p, k ) / p ); }\n`;

export function instalarToneMapping(THREE) {
  const viejo = "vec3 CustomToneMapping( vec3 color ) { return color; }";
  const c = THREE.ShaderChunk.tonemapping_pars_fragment;
  if (c.includes("sh4HombroRGB")) return;
  if (!c.includes(viejo)) {
    console.warn("mejorado: no pude instalar el tone mapping propio");
    return;
  }
  THREE.ShaderChunk.tonemapping_pars_fragment = c.replace(viejo, HOMBRO + "vec3 CustomToneMapping( vec3 color ) { return sh4HombroRGB( color * toneMappingExposure, 0.8 ); }");
}

const SOMBRA_PCF_THREE = /vec2 offset = vec2\( - 1, 1 \) \* shadowRadius \* texelSize\.y;[\s\S]*?\) \* \( 1\.0 \/ 9\.0 \);/;

const SOMBRA_BILINEAL = `vec2 sh4Tam = shadowMapSize * vec2( 4.0, 2.0 );\n\t\t\t\tif ( shadowRadius < 0.5 ) shadow = sh4CompararBil( shadowMap, cubeToUV( bd3D, texelSize.y ), dp, sh4Tam );\n\t\t\t\telse {\n\t\t\t\t\tvec2 offset = vec2( - 1, 1 ) * shadowRadius * texelSize.y * 0.7;\n\t\t\t\t\tshadow = 0.25 * (\n\t\t\t\t\t\tsh4CompararBil( shadowMap, cubeToUV( bd3D + offset.xyy, texelSize.y ), dp, sh4Tam ) +\n\t\t\t\t\t\tsh4CompararBil( shadowMap, cubeToUV( bd3D + offset.yxx, texelSize.y ), dp, sh4Tam ) +\n\t\t\t\t\t\tsh4CompararBil( shadowMap, cubeToUV( bd3D + offset.xxy, texelSize.y ), dp, sh4Tam ) +\n\t\t\t\t\t\tsh4CompararBil( shadowMap, cubeToUV( bd3D + offset.yyx, texelSize.y ), dp, sh4Tam ) );\n\t\t\t\t}`;

const SOMBRA_FUNCION = `\n\tfloat sh4CompararBil( sampler2D m, vec2 uv, float dp, vec2 tam ) {\n\t\tvec2 p = uv * tam - 0.5, f = fract( p ), b = ( floor( p ) + 0.5 ) / tam, t = 1.0 / tam;\n\t\tfloat a = texture2DCompare( m, b, dp ), c = texture2DCompare( m, b + vec2( t.x, 0.0 ), dp );\n\t\tfloat d = texture2DCompare( m, b + vec2( 0.0, t.y ), dp ), e = texture2DCompare( m, b + t, dp );\n\t\treturn mix( mix( a, c, f.x ), mix( d, e, f.x ), f.y );\n\t}\n\tfloat getPointShadow(`;

export function instalarSombraSuave(THREE) {
  const c = THREE.ShaderChunk.shadowmap_pars_fragment;
  if (c.includes("sh4CompararBil")) return true;
  const i = c.indexOf("float getPointShadow(");
  if (i < 0 || !SOMBRA_PCF_THREE.test(c.slice(i))) {
    console.warn("mejorado: no pude instalar las sombras suaves");
    return false;
  }
  THREE.ShaderChunk.shadowmap_pars_fragment = c.slice(0, i) + c.slice(i).replace("float getPointShadow(", SOMBRA_FUNCION.trimStart().replace(/^float sh4/, "float sh4")).replace(SOMBRA_PCF_THREE, SOMBRA_BILINEAL);
  return true;
}

export function crearComun(THREE) {
  return {
    uniforms: {
      uFuerzaSombra: {
        value: .7
      },
      uRelieve: {
        value: .2
      },
      uLinterna: {
        value: 1
      },
      uAlbedo: {
        value: 1
      },
      uNiebla: {
        value: 1
      },
      uNieblaColor: {
        value: new THREE.Color(0, 0, 0)
      },
      uNieblaRango: {
        value: new THREE.Vector4(0, 1e9, 0, 0)
      },
      uNieblaJuego: {
        value: new THREE.Vector4(1, 0, 200, 0)
      },
      uNieblaJuegoColor: {
        value: new THREE.Vector3(0, 0, 0)
      },
      uRealce: {
        value: .35
      },
      uLevantar: {
        value: .25
      },
      uHalo: {
        value: 0
      },
      uBrillo: {
        value: new THREE.Vector2(10, 0)
      },
      uVineta: {
        value: 0
      },
      uGrano: {
        value: 0
      },
      uTiempo: {
        value: 0
      },
      uBrilloPj: {
        value: 1
      }
    },
    defines: {
      HALOS: 1
    }
  };
}

const CABECERA = `\nuniform float uFuerzaSombra, uRelieve, uLinterna, uAlbedo, uNiebla, uHalo, uVineta, uGrano, uTiempo, uRealce, uLevantar, uBrilloPj;\nuniform vec3 uNieblaColor; uniform vec4 uNieblaRango; uniform vec2 uBrillo;\nuniform vec4 uNieblaJuego; uniform vec3 uNieblaJuegoColor; uniform float uNieblaRadial;\nvec3 sh4ASRGB( vec3 c ) { c = max( c, vec3( 0.0 ) ); return mix( c * 12.92, 1.055 * pow( c, vec3( 1.0 / 2.4 ) ) - 0.055, step( vec3( 0.0031308 ), c ) ); }\nvec3 sh4ALin( vec3 c ) { c = max( c, vec3( 0.0 ) ); return mix( c / 12.92, pow( ( c + 0.055 ) / 1.055, vec3( 2.4 ) ), step( vec3( 0.04045 ), c ) ); }\nfloat sh4Sin = 0.0, sh4Con = 0.0, sh4NL = 0.0;\nvec3 sh4C0;\n// solo cuentan las luces que dan de frente a la superficie (una luz debajo de la mesa no le hace sombra al tablero)\nvoid sh4Acumular( IncidentLight l, vec3 c0, vec3 n ) {\n  float w0 = dot( c0, vec3( 0.3333 ) ), nl = saturate( dot( n, l.direction ) );\n  sh4Sin += w0 * nl; sh4Con += dot( l.color, vec3( 0.3333 ) ) * nl; sh4NL += w0;\n}\nfloat sh4Hash( vec2 p ) { return fract( sin( dot( p, vec2( 12.9898, 78.233 ) ) ) * 43758.5453 ); }\n#if defined( SH4_HALOS ) && NUM_POINT_LIGHTS > 0\n// Luz dispersada por la niebla a lo largo del rayo cámara→fragmento, para cada luz puntual (forma cerrada de\n// ∫ dt / (h² + (t-b)²)). Se apaga si la luz quedó detrás de la superficie (no hay sombra volumétrica).\n// Solo las luces chicas son lámparas: las de radio grande (> 4-5 m) son luces de relleno y no tienen halo.\nvec3 sh4Halos( vec3 P ) {\n  float L = length( P ); vec3 D = P / L; vec3 acc = vec3( 0.0 );\n  for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {\n    vec3 Lp = pointLights[ i ].position;\n    float b = dot( Lp, D );\n    float h = max( sqrt( max( dot( Lp, Lp ) - b * b, 1e-5 ) ), 0.06 );\n    float r = max( pointLights[ i ].distance, 0.5 );\n    float g = ( atan( ( L - b ) / h ) - atan( - b / h ) ) * 0.25 / max( h, 0.1 );\n    float ventana = pow2( saturate( 1.0 - h / ( 0.45 * r ) ) ) * saturate( ( L - b ) / 0.4 + 1.0 ) * ( 1.0 - smoothstep( 2.5, 5.0, r ) );\n    acc += pointLights[ i ].color / ( 0.3125 * r ) * g * ventana; // intensidad π·r/4 (caída 1/d): mismo halo que antes\n  }\n  return acc;\n}\n#endif\n`;

function transformarLuces(THREE) {
  let s = THREE.ShaderChunk.lights_fragment_begin;
  const iSpot = s.indexOf("#if ( NUM_SPOT_LIGHTS > 0 )"), iDir = s.indexOf("#if ( NUM_DIR_LIGHTS > 0 )"), iRect = s.indexOf("#if ( NUM_RECT_AREA_LIGHTS > 0 )");
  if (iSpot < 0 || iDir < 0 || iRect < 0) throw new Error("mejorado: cambió lights_fragment_begin de three");
  const RE = "RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );";
  let puntual = s.slice(0, iSpot), spot = s.slice(iSpot, iDir), dir = s.slice(iDir, iRect), resto = s.slice(iRect);
  puntual = puntual.replace("getPointLightInfo( pointLight, geometryPosition, directLight );", "getPointLightInfo( pointLight, geometryPosition, directLight );\n\t\tsh4C0 = directLight.color;").replace(RE, "sh4Acumular( directLight, sh4C0, geometryNormal );");
  dir = dir.replace(RE, "");
  if (!puntual.includes("sh4Acumular") || dir.includes("RE_Direct(")) throw new Error("mejorado: no pude adaptar las luces");
  return puntual + spot + dir + resto;
}

const SALIDA = `\n  float sh4Ratio = ( sh4Con + 1e-4 ) / ( sh4Sin + 1e-4 );\n  float sh4Rel = sh4NL > 1e-4 ? sh4Sin / sh4NL : 0.5;\n  // sombra de personajes (cociente con/sin sombra) y relieve centrado en 1 (no oscurece en promedio)\n  float sh4F = mix( 1.0, sh4Ratio, uFuerzaSombra ) * mix( 1.0, 0.5 + sh4Rel, uRelieve );\n  // realce: las luces de la sala (con su caída y su sombra) suman un poco sobre lo horneado, saturando suave\n  float sh4ConE = sh4Con / max( uBrilloPj, 1e-3 ); // sin el "Brillo de los personajes" (es solo para ellos)\n  float sh4E = sh4ConE / ( 1.0 + sh4ConE );\n  vec3 sh4Base = sh4Horneado * sh4F * ( 1.0 + uRealce * sh4E );\n  // levantar: en sRGB, c + k·c·(1-c)² abre los oscuros y deja los claros (y el negro) donde estaban\n  vec3 sh4S = sh4ASRGB( sh4Base );\n  sh4S += uLevantar * sh4S * ( 1.0 - sh4S ) * ( 1.0 - sh4S );\n  vec3 outgoingLight = sh4ALin( sh4S ) + reflectedLight.directDiffuse * uLinterna;\n  #ifndef SH4_CAPA\n    outgoingLight += max( sh4Horneado - uBrillo.x, vec3( 0.0 ) ) * uBrillo.y;\n  #endif\n  // niebla del juego (igual que el original: se mezcla en sRGB, como el framebuffer del PC)\n  if ( uNieblaJuego.w > 0.5 && uNiebla > 0.0 ) {\n    float sh4Vis = clamp( uNieblaJuego.x + uNieblaJuego.y / max( mix( vViewPosition.z, length( vViewPosition ), uNieblaRadial ) * uNieblaJuego.z, 1e-3 ), 0.0, 1.0 );\n    outgoingLight = sh4ALin( mix( uNieblaJuegoColor, sh4ASRGB( outgoingLight ), mix( 1.0, sh4Vis, uNiebla ) ) );\n  }\n  #if defined( SH4_HALOS ) && NUM_POINT_LIGHTS > 0 && ! defined( SH4_CAPA )\n    vec3 sh4H = sh4Halos( - vViewPosition ) * uHalo / max( uBrilloPj, 1e-3 );\n    outgoingLight += sh4H / ( 1.0 + sh4H ); // saturación suave: varias lámparas juntas no lavan la imagen\n  #endif\n  // efectos de pantalla hechos en el material (para VR): viñeta por ángulo desde el centro de cada ojo y grano\n  float sh4T = length( vViewPosition.xy / max( vViewPosition.z, 1e-3 ) );\n  outgoingLight *= 1.0 - uVineta * smoothstep( 0.45, 1.25, sh4T );\n  #ifndef SH4_CAPA\n    // grano proporcional a la luz (sumado en lineal, en los oscuros salía como polvo gris encima de todo)\n    outgoingLight *= 1.0 + ( sh4Hash( gl_FragCoord.xy + fract( uTiempo * 7.0 ) * vec2( 113.0, 71.0 ) ) - 0.5 ) * uGrano * 6.0;\n  #endif\n`;

export function crearFabrica(THREE, comun) {
  const luces = transformarLuces(THREE);
  function onBeforeCompile(sh) {
    Object.assign(sh.uniforms, comun.uniforms, {
      uNieblaRadial: NIEBLA_RADIAL
    });
    let f = sh.fragmentShader;
    const pasos = [ [ "#include <lights_lambert_pars_fragment>", "#include <lights_lambert_pars_fragment>\n" + CABECERA ], [ "#include <map_fragment>", "#include <map_fragment>\n\tvec3 sh4Albedo = diffuseColor.rgb;" ], [ "#include <color_fragment>", "#include <color_fragment>\n\tvec3 sh4Horneado = diffuseColor.rgb;\n\tdiffuseColor.rgb = sh4Albedo * uAlbedo;" ], [ "#include <lights_fragment_begin>", luces ], [ "vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;", SALIDA ] ];
    for (const [a, b] of pasos) {
      if (!f.includes(a)) throw new Error("mejorado: falta " + a);
      f = f.replace(a, b);
    }
    if (comun.defines.HALOS) f = "#define SH4_HALOS\n" + f;
    sh.fragmentShader = f;
  }
  const clave = () => "sh4mejorado" + (comun.defines.HALOS ? "H" : "");
  return function material(orig, {capa: capa = false} = {}) {
    const m = new THREE.MeshLambertMaterial({
      map: orig?.map || null,
      color: orig ? 16777215 : 0,
      vertexColors: !!orig?.vertexColors,
      side: orig?.side ?? THREE.DoubleSide,
      alphaTest: orig?.alphaTest || 0,
      transparent: !!orig?.transparent,
      depthWrite: orig ? orig.depthWrite : true,
      polygonOffset: !!orig?.polygonOffset,
      polygonOffsetFactor: orig?.polygonOffsetFactor || 0,
      polygonOffsetUnits: orig?.polygonOffsetUnits || 0,
      fog: false
    });
    if (orig) {
      m.blending = orig.blending;
      m.blendEquation = orig.blendEquation;
      m.blendSrc = orig.blendSrc;
      m.blendDst = orig.blendDst;
      m.blendEquationAlpha = orig.blendEquationAlpha;
      m.blendSrcAlpha = orig.blendSrcAlpha;
      m.blendDstAlpha = orig.blendDstAlpha;
      m.premultipliedAlpha = orig.premultipliedAlpha;
      m.depthTest = orig.depthTest;
      m.depthFunc = orig.depthFunc;
    }
    if (capa) m.defines = {
      SH4_CAPA: 1
    };
    m.onBeforeCompile = onBeforeCompile;
    m.customProgramCacheKey = capa ? () => clave() + "C" : clave;
    m.userData.sh4Mejorado = true;
    m.userData.sh4Capa = capa;
    return m;
  };
}
