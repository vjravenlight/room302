// SH4 web — FeniXVOID · Project Ravenlight
import { componer } from "../lib/animacion.js";

export const CB = {
  ORIGEN: 14,
  MANIJA: 29,
  MANO: 16,
  EFECTOR: 15,
  GIRO_MIN: -.5235988,
  GIRO_MAX: 1.0471976,
  ELEV_MIN: -.7853982,
  ELEV_MAX: .7853982,
  ELEV_AJUSTE: .0872665,
  LARGO_Y: 40,
  LARGO: 60,
  PESO_PASO: .2
};

export function crearBrazo() {
  const b = {
    activo: false,
    objetivo: [ 0, 0, 0 ],
    peso: 0,
    mano: null,
    meta: null
  };
  return {
    est: b,
    apuntar(p) {
      b.activo = true;
      b.objetivo = [ p[0], p[1], p[2] ];
      b.peso = 0;
      b.mano = null;
    },
    soltar() {
      b.activo = false;
    },
    aplicar: a => aplicar(b, a)
  };
}

function aplicar(b, a) {
  const {esq: esq, pose: pose, cadenas: cadenas, pos: pos, rot: rot} = a;
  if (!b.activo || !pose || !cadenas?.length) return false;
  const cad = cadenas.find(c => c.tipo === 1 && c.manija === CB.MANIJA);
  if (!cad) return false;
  const cs = Math.cos(rot), sn = Math.sin(rot);
  const aMundo = l => [ pos[0] + l[0] * cs + l[2] * sn, pos[1] + l[1], pos[2] - l[0] * sn + l[2] * cs ];
  const aLocal = m => {
    const dx = m[0] - pos[0], dz = m[2] - pos[2];
    return [ dx * cs - dz * sn, m[1] - pos[1], dx * sn + dz * cs ];
  };
  const P = i => [ pose.absPos[i * 3], pose.absPos[i * 3 + 1], pose.absPos[i * 3 + 2] ];
  if (!b.mano) b.mano = aMundo(P(CB.MANO));
  const o = P(CB.ORIGEN);
  const d = aLocal(b.objetivo).map((v, i) => v - o[i]);
  const l = Math.hypot(d[0], d[1], d[2]) || 1;
  const x = d[0] / l, y = d[1] / l, z = d[2] / l;
  const giro = Math.max(CB.GIRO_MIN, Math.min(CB.GIRO_MAX, Math.atan2(x, z)));
  const horiz = Math.sqrt(Math.max(0, 1 - y * y));
  const elev = Math.max(CB.ELEV_MIN, Math.min(CB.ELEV_MAX, Math.atan2(y, horiz) - CB.ELEV_AJUSTE));
  let v = [ Math.sin(giro), Math.sin(elev), Math.cos(giro) ];
  const lv = Math.hypot(v[0], v[1], v[2]) || 1;
  v = v.map(c => c / lv);
  const largo = Math.abs(v[1]) * CB.LARGO_Y + CB.LARGO;
  const meta = [ o[0] + v[0] * largo, o[1] + v[1] * largo, o[2] + v[2] * largo ];
  const cuadros = Math.max(.25, Math.min(4, a.cuadros ?? 1));
  b.peso = Math.min(1, b.peso + CB.PESO_PASO * cuadros);
  const k = 1 - Math.pow(1 - b.peso, cuadros);
  const mano = aLocal(b.mano);
  const h = [ mano[0] + (meta[0] - mano[0]) * k, mano[1] + (meta[1] - mano[1]) * k, mano[2] + (meta[2] - mano[2]) * k ];
  const i = CB.MANIJA;
  pose.pos[i * 3] = h[0];
  pose.pos[i * 3 + 1] = h[1];
  pose.pos[i * 3 + 2] = h[2];
  componer(esq, pose, {
    rotAbsolutas: true,
    ik: [ cad ]
  });
  b.mano = aMundo(P(CB.MANO));
  b.meta = aMundo(meta);
  return true;
}
