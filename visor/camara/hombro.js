// SH4 web — FeniXVOID · Project Ravenlight
export function crearSeguidor(THREE) {
  const rc = new THREE.Raycaster;
  const _o = new THREE.Vector3, _a = new THREE.Vector3, _b = new THREE.Vector3, _d = new THREE.Vector3, _up = new THREE.Vector3(0, 1, 0);
  let dist = null;
  function distanciaLibre(col, desde, dir, largo, radio = .18) {
    if (!col) return largo;
    let libre = largo;
    _a.crossVectors(dir, _up);
    if (_a.lengthSq() < 1e-6) _a.set(1, 0, 0);
    _a.normalize();
    _b.crossVectors(_a, dir).normalize();
    const offs = [ [ 0, 0 ], [ 1, 0 ], [ -1, 0 ], [ 0, 1 ], [ 0, -1 ] ];
    for (const [i, j] of offs) {
      _o.copy(desde).addScaledVector(_a, i * radio).addScaledVector(_b, j * radio);
      if (i || j) {
        _d.copy(_o).sub(desde);
        const l = _d.length();
        rc.set(desde, _d.divideScalar(l));
        rc.near = 0;
        rc.far = l;
        if (rc.intersectObject(col, false).length) continue;
      }
      rc.set(_o, dir);
      rc.near = 0;
      rc.far = largo + radio;
      const h = rc.intersectObject(col, false)[0];
      if (h) libre = Math.min(libre, h.distance - radio);
    }
    return Math.max(.25, Math.min(largo, libre));
  }
  function distancia(col, pivote, dir, largo, dt, reiniciar = false) {
    const libre = distanciaLibre(col, pivote, dir, largo);
    if (dist == null || reiniciar || libre < dist) dist = libre; else dist += (libre - dist) * (1 - Math.exp(-dt * 4));
    return dist;
  }
  return {
    distanciaLibre: distanciaLibre,
    distancia: distancia,
    reiniciar() {
      dist = null;
    }
  };
}
