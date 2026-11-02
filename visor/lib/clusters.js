// SH4 web — FeniXVOID · Project Ravenlight
import * as THREE from "three";

export function leerClusters(modelo) {
  const o = modelo?.origen;
  if (!o?.buf) return null;
  const len = o.buf.byteLength - o.ofs;
  const dv = new DataView(o.buf, o.ofs, len);
  if (dv.getUint32(0, true) !== 4294901763) return null;
  const h = i => dv.getUint32(4 + 4 * i, true);
  const nN = h(16), oN = h(17), nC = h(18), oC = h(19);
  if (!nN || !nC || oN + nN * 6 > len || oC + nC * 8 > len) return null;
  const nodos = new Int16Array(nN * 3);
  for (let i = 0; i < nN * 3; i++) nodos[i] = dv.getInt16(oN + 2 * i, true);
  const clusters = [];
  for (let c = 0; c < nC; c++) {
    const n = dv.getUint32(oC + 8 * c, true), oe = dv.getUint32(oC + 8 * c + 4, true);
    const elem = new Int16Array(n * 4);
    if (oe + n * 8 <= len) for (let k = 0; k < n * 4; k++) elem[k] = dv.getInt16(oe + 2 * k, true);
    clusters.push({
      n: n,
      elem: elem
    });
  }
  const datos = [];
  let base = 0;
  for (const [n, o0] of [ [ h(7), h(8) ], [ h(9), h(10) ] ]) {
    let p = o0;
    for (let k = 0; k < n && p > 0 && p < len; k++) {
      const inf = j => dv.getUint32(p + 4 * j, true);
      const nSub = dv.getUint32(p + inf(2), true);
      const nCD = inf(5), oCD = inf(6);
      for (let j = 0; j < nCD; j++) {
        const q = p + oCD + 6 * j;
        if (q + 6 > len) break;
        datos.push({
          sub: base,
          src: dv.getUint16(q, true),
          dst: dv.getUint16(q + 2, true),
          n: dv.getUint16(q + 4, true)
        });
      }
      base += nSub;
      const tam = inf(0);
      if (!tam) break;
      p += tam;
    }
  }
  return {
    nNodos: nN,
    nodos: nodos,
    clusters: clusters,
    datos: datos
  };
}

export function armarClusters(pj, modelo, cl = leerClusters(modelo)) {
  if (!cl || !pj?.mallas?.length || !modelo?.partes?.length) return null;
  const partes = modelo.partes, nC = cl.clusters.length;
  const desp = cl.clusters.map(c => {
    const d = new Float32Array(cl.nNodos * 3);
    for (let k = 0; k < c.n; k++) {
      const nodo = c.elem[k * 4 + 3];
      if (nodo < 0 || nodo >= cl.nNodos) continue;
      d[nodo * 3] = c.elem[k * 4] / 16;
      d[nodo * 3 + 1] = c.elem[k * 4 + 1] / 16;
      d[nodo * 3 + 2] = c.elem[k * 4 + 2] / 16;
    }
    return d;
  });
  const porSub = new Map;
  for (const {sub: sub, src: src, dst: dst, n: n} of cl.datos) {
    for (let k = 0; k < n; k++) {
      let s = sub, v = dst + k;
      while (partes[s] && partes[s].parte === sub && v >= partes[s].pos.length / 3) {
        v -= partes[s].pos.length / 3;
        s++;
      }
      if (!partes[s] || partes[s].parte !== sub) continue;
      let l = porSub.get(s);
      if (!l) porSub.set(s, l = []);
      l.push([ v, src + k ]);
    }
  }
  const mallas = [];
  let vertices = 0;
  for (const [s, lista] of porSub) {
    const malla = pj.mallas[s], parte = partes[s];
    if (!malla || !parte) continue;
    const g = malla.geometry, nV = parte.pos.length / 3;
    if (g.attributes.position.count !== nV) continue;
    const morphs = [];
    for (let c = 0; c < nC; c++) {
      const a = new Float32Array(nV * 3);
      for (const [v, nodo] of lista) {
        const m = modelo.huesos[parte.hueso[v * 4]]?.matriz;
        const x = desp[c][nodo * 3], y = desp[c][nodo * 3 + 1], z = desp[c][nodo * 3 + 2];
        if (m) {
          a[v * 3] = x * m[0] + y * m[4] + z * m[8];
          a[v * 3 + 1] = x * m[1] + y * m[5] + z * m[9];
          a[v * 3 + 2] = x * m[2] + y * m[6] + z * m[10];
        } else {
          a[v * 3] = x;
          a[v * 3 + 1] = y;
          a[v * 3 + 2] = z;
        }
      }
      morphs.push(new THREE.BufferAttribute(a, 3));
    }
    g.morphAttributes.position = morphs;
    g.morphTargetsRelative = true;
    malla.updateMorphTargets();
    malla.morphTargetInfluences.fill(0);
    mallas.push(malla);
    vertices += lista.length;
  }
  if (!mallas.length) return null;
  const pesos = new Float32Array(nC);
  return {
    n: nC,
    pesos: pesos,
    mallas: mallas,
    vertices: vertices,
    poner(i, peso) {
      if (i < 0 || i >= nC) return;
      const w = Math.max(0, Math.min(1, +peso || 0));
      if (pesos[i] === w) return;
      pesos[i] = w;
      for (const m of mallas) if (m.morphTargetInfluences) m.morphTargetInfluences[i] = w;
    }
  };
}
