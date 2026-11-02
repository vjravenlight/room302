// SH4 web — FeniXVOID · Project Ravenlight
export const MALDICION = {
  WHEEL: [ 1.5, .5 ],
  MULTI: [ 5, .2 ],
  PICKGIRL: [ 5, .4 ],
  FLAMES: [ 2, 7 ],
  FAT: [ 4, 1 ],
  SCRATCH: [ 3, .4 ]
};

export const CERCA = {
  lleno: 4,
  nada: 12
};

const ALTO_MAX = 2;

export function objetivoPorEnemigos(lista, {etapa: etapa = 0, mitad: mitad = 1, protegido: protegido = false, fondoEtapa: fondoEtapa = 0} = {}) {
  let suma = 0, cerca = 0, hay = false;
  const como302 = etapa === 1 || etapa === 10;
  for (const x of lista || []) {
    if (!x || x.muerto) continue;
    const d = Math.max(0, +x.distancia || 0), vis = x.visible !== false;
    hay = true;
    const t = MALDICION[String(x.tipo || "").toUpperCase()];
    const R = x.rango ?? t?.[0] ?? 0, P = x.potencia ?? t?.[1] ?? 0;
    if (R > 0 && P > 0 && d < R && (como302 || Math.abs(x.alto || 0) <= ALTO_MAX)) {
      let c = (R - d) / R * P;
      if (!vis && !como302) c *= .5;
      suma += c;
    }
    let f = d <= CERCA.lleno ? 1 : d >= CERCA.nada ? 0 : (CERCA.nada - d) / (CERCA.nada - CERCA.lleno);
    f = f * f * (3 - 2 * f);
    if (!vis) f *= .5;
    cerca = Math.max(cerca, f);
  }
  if (!hay) return null;
  if (suma > 0) {
    const v = Math.min(128, Math.round(suma * (128 / 3) - .49));
    let fl = Math.round(suma * (64 / 3) - .49);
    if (fl > 96) fl = 64;
    return [ 128, Math.max(0, v), Math.max(0, protegido ? Math.trunc(v / 3) : fl) ];
  }
  const base = fondoEtapa || 48;
  return [ Math.round(base * cerca), 0, 0 ];
}

export function listaDesdeModulo(api, {THREE: THREE, camara: camara, escala: escala = .005}) {
  const j = api?.jugador, out = [];
  if (!j?.pos || j.existe === false) return out;
  const v = listaDesdeModulo.v || (listaDesdeModulo.v = new THREE.Vector3);
  for (const e of api.enemigos || []) {
    if (!e?.pos || e.cond === 11 || e.retenido) continue;
    const dx = e.pos[0] - j.pos[0], dz = e.pos[2] - j.pos[2];
    let visible = true;
    if (camara) {
      v.set(-e.pos[0] * escala, -(e.pos[1] - (e.alto || 100) / 2) * escala, e.pos[2] * escala).project(camara);
      visible = v.z > -1 && v.z < 1 && Math.abs(v.x) <= 1 && Math.abs(v.y) <= 1;
    }
    const p = e.param;
    const sinMaldicion = e.cond === 9 || e.cond === 18 || typeof e.maldice === "function" && !e.maldice();
    out.push({
      distancia: Math.hypot(dx, dz) * escala,
      alto: (e.pos[1] - j.pos[1]) * escala,
      visible: visible,
      tipo: e.tipo,
      rango: sinMaldicion ? 0 : p?.rango_danio,
      potencia: sinMaldicion ? 0 : p?.danio_extra
    });
  }
  return out;
}
