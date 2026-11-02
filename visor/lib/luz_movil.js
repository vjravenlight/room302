// SH4 web — FeniXVOID · Project Ravenlight
import * as THREE from "three";

export const ESCALA = .005;

export const MAX_LUCES_MOVILES = 2;

const DIF_TE = .8;

const vacio = () => Array.from({
  length: MAX_LUCES_MOVILES
}, () => new THREE.Vector3);

export const U_MOVIL = {
  uLuzMovilPos: {
    value: vacio()
  },
  uLuzMovilCol: {
    value: vacio()
  },
  uLuzMovilAte: {
    value: Array.from({
      length: MAX_LUCES_MOVILES
    }, () => new THREE.Vector2)
  }
};

let factorPj = 1;

const leerBrillo = o => {
  if (o && typeof o.brilloPersonajes === "number") factorPj = Math.max(0, o.brilloPersonajes / 5);
};

try {
  leerBrillo(JSON.parse(localStorage.getItem("sh4opciones") || "null"));
} catch {}

try {
  addEventListener("sh4opciones", e => {
    leerBrillo(e.detail);
    for (const l of registradas) l._intensidad();
  });
} catch {}

const registradas = new Set;

const lugares = new Array(MAX_LUCES_MOVILES).fill(null);

function repartirLugares() {
  for (let i = 0; i < lugares.length; i++) if (lugares[i] && (!lugares[i].activa || !registradas.has(lugares[i]))) {
    lugares[i]._lugar = -1;
    lugares[i] = null;
  }
  for (const l of registradas) {
    if (!l.activa || l._lugar >= 0) continue;
    const i = lugares.indexOf(null);
    if (i < 0) break;
    lugares[i] = l;
    l._lugar = i;
  }
  for (let i = 0; i < lugares.length; i++) {
    const l = lugares[i];
    if (l) {
      U_MOVIL.uLuzMovilPos.value[i] = l.pos;
      U_MOVIL.uLuzMovilCol.value[i] = l.escenario ? l._colGamma : new THREE.Vector3;
      U_MOVIL.uLuzMovilAte.value[i] = l._ate;
    } else {
      U_MOVIL.uLuzMovilPos.value[i] = new THREE.Vector3;
      U_MOVIL.uLuzMovilCol.value[i] = new THREE.Vector3;
      U_MOVIL.uLuzMovilAte.value[i] = new THREE.Vector2;
    }
  }
}

export function registrarLuzMovil(obj = {}) {
  const luz = new THREE.PointLight(16777215, 0, 1, -.5);
  const l = {
    nombre: obj.nombre || "luz móvil",
    escenario: obj.escenario !== false,
    personajes: obj.personajes !== false,
    pos: luz.position,
    inicio: 0,
    fin: 0,
    activa: false,
    _lugar: -1,
    _colGamma: new THREE.Vector3,
    _ate: new THREE.Vector2,
    _color: [ 1, 1, 1 ],
    luz: luz
  };
  if (obj.pos) l.pos.copy(obj.pos);
  luz.name = l.nombre + " (personajes)";
  luz.userData.luzMovil = true;
  luz.userData.sinSombra = true;
  l._intensidad = () => {
    l.luz.intensity = l.activa && l.personajes ? Math.PI * DIF_TE * factorPj : 0;
  };
  l.alcance = (inicio, fin) => {
    l.inicio = +inicio || 0;
    l.fin = +fin || 0;
    if (l.fin > l.inicio && l.fin > 0) {
      const k1 = l.inicio * l.fin / (l.fin - l.inicio), k0 = -l.inicio / (l.fin - l.inicio);
      l._ate.set(k1 * ESCALA, k0);
      l.luz.distance = l.fin * ESCALA;
      l.luz.decay = -(l.inicio * ESCALA);
    } else {
      l._ate.set(0, -1);
      l.luz.distance = .001;
      l.luz.decay = -.5;
    }
    return l;
  };
  l.color = (r, g, b) => {
    l._color = [ r, g, b ];
    l._colGamma.set(r, g, b);
    l.luz.color.setRGB(r, g, b, THREE.SRGBColorSpace);
    return l;
  };
  l.activar = si => {
    l.activa = !!si;
    l._intensidad();
    repartirLugares();
    return l;
  };
  l.quitar = () => {
    registradas.delete(l);
    l.activa = false;
    l._intensidad();
    l.luz.removeFromParent();
    repartirLugares();
  };
  l.estado = () => ({
    nombre: l.nombre,
    activa: l.activa,
    lugar: l._lugar,
    pos: l.pos.toArray().map(v => +v.toFixed(3)),
    inicio: l.inicio,
    fin: l.fin,
    color: l._color,
    escenario: l.escenario,
    personajes: l.personajes,
    intensidad: +l.luz.intensity.toFixed(3)
  });
  l.color(...obj.color || [ 1, 1, 1 ]);
  l.alcance(obj.inicio ?? 100, obj.fin ?? 1e3);
  if (obj.padre) obj.padre.add(l.luz);
  registradas.add(l);
  l.activar(obj.activa !== false);
  engancharApi();
  return l;
}

export function lucesMoviles() {
  return [ ...registradas ].map(l => l.estado());
}

const GLSL_DECL = `\nuniform vec3 uLuzMovilPos[${MAX_LUCES_MOVILES}]; uniform vec3 uLuzMovilCol[${MAX_LUCES_MOVILES}]; uniform vec2 uLuzMovilAte[${MAX_LUCES_MOVILES}];\nvec3 sh4MovilAGamma(vec3 c) { return mix(c * 12.92, 1.055 * pow(max(c, vec3(0.0)), vec3(1.0 / 2.4)) - 0.055, step(vec3(0.0031308), c)); }\nvec3 sh4MovilALineal(vec3 c) { return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(vec3(0.04045), c)); }`;

const GLSL_SUMA = `\n#if defined( USE_COLOR_ALPHA ) || defined( USE_COLOR )\n{\n\tvec3 sh4P = ( modelMatrix * vec4( position, 1.0 ) ).xyz;\n\tvec3 sh4N = normalize( mat3( modelMatrix ) * normal );\n\tvec3 sh4Suma = vec3( 0.0 );\n\tfor ( int i = 0; i < ${MAX_LUCES_MOVILES}; i ++ ) {\n\t\tvec3 sh4D = uLuzMovilPos[ i ] - sh4P; float sh4Dist = max( length( sh4D ), 1e-4 );\n\t\tfloat sh4Ate = clamp( uLuzMovilAte[ i ].x / sh4Dist + uLuzMovilAte[ i ].y, 0.0, 1.0 );\n\t\tsh4Suma += uLuzMovilCol[ i ] * ( max( dot( sh4N, sh4D / sh4Dist ), 0.0 ) * sh4Ate );\n\t}\n\tvColor.rgb = sh4MovilALineal( min( sh4MovilAGamma( vColor.rgb ) + sh4Suma, vec3( 1.0 ) ) );\n}\n#endif`;

export function parcharMaterialEscenario(mat) {
  if (!mat || mat.userData?.sh4LuzMovil) return mat;
  mat.userData.sh4LuzMovil = true;
  const previo = mat.onBeforeCompile, clave = mat.customProgramCacheKey;
  mat.onBeforeCompile = function(sh, r) {
    previo?.call(this, sh, r);
    Object.assign(sh.uniforms, U_MOVIL);
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\n" + GLSL_DECL).replace("#include <color_vertex>", "#include <color_vertex>" + GLSL_SUMA);
  };
  mat.customProgramCacheKey = function() {
    return (clave ? clave.call(this) : "") + "|sh4LuzMovil";
  };
  mat.needsUpdate = true;
  return mat;
}

export function todasActivas(si) {
  for (const l of registradas) l.activar(si);
  return lucesMoviles();
}

export const API_LUZ_MOVIL = {
  lista: lucesMoviles,
  U: U_MOVIL,
  MAX: MAX_LUCES_MOVILES,
  registrar: registrarLuzMovil,
  todasActivas: todasActivas
};

function engancharApi() {
  try {
    if (globalThis.sh4 && !globalThis.sh4.luzMovil) globalThis.sh4.luzMovil = API_LUZ_MOVIL;
  } catch {}
}
