// SH4 web — FeniXVOID · Project Ravenlight
import { armarSala } from "./sala.js";

export const EXTRAS_DEMO = {
  50: [ {
    modelo: "rl00a_text",
    alfa: [ 1e3, 1100 ],
    fuente: "DemoEventInitRL050 0x509010 / Exec 0x509070 / Draw 0x5090b0"
  } ]
};

export async function armarExtras(THREE, bajar, id, globales) {
  const lista = [];
  for (const def of EXTRAS_DEMO[+id] || []) {
    try {
      const s = await armarSala(THREE, bajar, def.modelo, globales);
      const mats = [];
      s.grupo.traverse(o => {
        if (!o.isMesh) return;
        const m = o.material;
        m.transparent = true;
        m.depthWrite = false;
        m.polygonOffset = true;
        m.polygonOffsetFactor = -2;
        m.polygonOffsetUnits = -2;
        o.renderOrder = 3;
        mats.push(m);
      });
      const actualizar = cuadro => {
        let a = 1;
        if (def.alfa) a = Math.max(0, Math.min(1, (cuadro - def.alfa[0]) / (def.alfa[1] - def.alfa[0])));
        for (const m of mats) m.opacity = a;
        s.grupo.visible = a > 0;
      };
      actualizar(0);
      lista.push({
        grupo: s.grupo,
        def: def,
        actualizar: actualizar,
        dispose: s.dispose
      });
    } catch (e) {
      console.warn("extra de la demo", id, def.modelo, e);
    }
  }
  return lista;
}

export const GRUPOS_APAGADOS = {
  317: [ 2, 3, 4, 5, 7 ]
};

export function ocultarGrupos(id, modelo, obj) {
  const g = GRUPOS_APAGADOS[id];
  if (!g) return 0;
  let n = 0;
  modelo.partes.forEach((s, i) => {
    if (g.includes(s.grupoParte) && obj.mallas[i]) {
      obj.mallas[i].visible = false;
      n++;
    }
  });
  return n;
}
