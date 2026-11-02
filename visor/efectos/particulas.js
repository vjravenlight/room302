// SH4 web — FeniXVOID · Project Ravenlight
import { texturasDeParte, materialPS2, geometriaDinamica, crearRand } from "./comun.js";

export const PASO = 1 / 30;

export function posGen(o, a, b) {
  return [ 0, 1, 2 ].map(k => o.pos[k] + a * o.vec1[k] + b * o.vec2[k]);
}

export function velGen(o, rand) {
  const v = (o.max - o.min) * rand.f() + o.min;
  let d = norm(o.dir);
  if (o.abre > 0) {
    const ang = rand.f() * o.abre, r = [ 2 * rand.f() - 1, 2 * rand.f() - 1, 2 * rand.f() - 1 ];
    const p = norm([ r[1] * d[2] - r[2] * d[1], r[2] * d[0] - r[0] * d[2], r[0] * d[1] - r[1] * d[0] ]);
    d = [ 0, 1, 2 ].map(k => d[k] * Math.cos(ang) + p[k] * Math.sin(ang));
  }
  return d.map(x => x * v);
}

export function desviar(rand, D, R) {
  const r = rand.f();
  let v;
  if (r <= D) v = D === 0 ? 0 : (((r - D) / D) ** 3 + 1) * D; else v = D === 1 ? 1 : ((r - D) / (1 - D)) ** 3 * (1 - D) + D;
  return v * R + (1 - R) * r;
}

export function norm(v) {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [ v[0] / l, v[1] / l, v[2] / l ];
}

export function crearMotor({THREE: THREE, lib: lib, raiz: raiz, camara: camara, escala: escala, rand: rand = crearRand(11)}) {
  const grupo = new THREE.Group;
  grupo.name = "particulas";
  raiz.add(grupo);
  const objetos = [];
  const texCache = new Map;
  const cam = {
    pos: [ 0, 0, 0 ],
    der: [ 1, 0, 0 ],
    arr: [ 0, -1, 0 ],
    fr: [ 0, 0, 1 ],
    focal: 384 / Math.tan(Math.PI / 6)
  };
  const v3 = new THREE.Vector3, q = new THREE.Quaternion;
  function textura(archivo, parte) {
    const k = archivo + "#" + parte;
    if (!texCache.has(k)) texCache.set(k, texturasDeParte(THREE, lib, archivo, parte).then(t => t[0]?.[0] || null));
    return texCache.get(k);
  }
  function crear(efecto) {
    const o = {
      ...efecto.org,
      reloj: 0,
      nacidas: 0,
      muertas: 0,
      espera: efecto.org.espera ?? 0,
      apagado: false
    };
    if (o.n === -11) o.n = 64;
    const maxQ = 64 * (efecto.quads || 1);
    const idx = [];
    for (let i = 0; i < maxQ; i++) idx.push(i * 4, i * 4 + 1, i * 4 + 2, i * 4 + 1, i * 4 + 3, i * 4 + 2);
    const g = geometriaDinamica(THREE, maxQ * 4, idx);
    const m = efecto.material;
    const mat = materialPS2(THREE, {
      mezcla: m.mezcla ?? 68,
      fix: m.fix ?? null,
      aref: m.aref ?? null
    });
    if (m.archivo) textura(m.archivo, m.parte).then(t => {
      mat.uniforms.mapa.value = t;
      mat.uniforms.uTieneMapa.value = t ? 1 : 0;
    });
    const malla = new THREE.Mesh(g, mat);
    malla.frustumCulled = false;
    malla.renderOrder = 70;
    malla.userData.sinSombra = true;
    malla.name = "part_" + (efecto.nombre || "");
    grupo.add(malla);
    const obj = {
      efecto: efecto,
      o: o,
      cmn: efecto.cmn,
      ps: new Array(64).fill(null),
      malla: malla,
      g: g,
      mat: mat,
      maxQ: maxQ,
      vivo: true
    };
    objetos.push(obj);
    while (o.espera < 0) {
      pasoObjeto(obj);
      o.espera += PASO;
    }
    if (o.espera > -PASO && o.espera < 0) o.espera = 0;
    return obj;
  }
  function pasoObjeto(obj) {
    const {o: o, efecto: efecto, cmn: cmn, ps: ps} = obj;
    if (o.espera > 0) {
      o.espera = Math.max(0, o.espera - PASO);
      o.dibujoApagado = true;
      return;
    }
    o.dibujoApagado = false;
    if (o.reloj <= 0 && !o.apagado && (o.n === -10 || o.nacidas < o.n)) {
      for (let i = 0; i < 64; i++) {
        if (ps[i]) continue;
        const p = {
          i: i
        };
        efecto.generar(p, o, cmn, rand);
        ps[i] = p;
        o.nacidas++;
        if (o.intervalo !== 0) break;
        if (o.n !== -10 && o.nacidas >= o.n) break;
      }
      o.reloj = (rand.f() * .8 + .8) * o.intervalo;
    }
    for (let i = 0; i < 64; i++) if (ps[i] && efecto.calcular(ps[i], o, cmn, PASO, rand) === false) {
      ps[i] = null;
      o.muertas++;
    }
    o.reloj -= PASO;
    if (o.n !== -10 && o.n <= o.muertas || o.apagado && ps.every(p => !p)) obj.vivo = false;
  }
  let acum = 0;
  function actualizar(dt) {
    camara.getWorldPosition(v3);
    raiz.updateWorldMatrix(true, false);
    raiz.worldToLocal(v3);
    cam.pos = [ v3.x, v3.y, v3.z ];
    camara.getWorldQuaternion(q);
    const ax = (x, y, z) => {
      v3.set(x, y, z).applyQuaternion(q);
      return [ -v3.x, -v3.y, v3.z ];
    };
    cam.der = ax(1, 0, 0);
    cam.arr = ax(0, 1, 0);
    cam.fr = ax(0, 0, -1);
    cam.focal = 384 / Math.tan((camara.fov || 60) * Math.PI / 360);
    acum += dt;
    let n = 0;
    while (acum >= PASO && n++ < 4) {
      acum -= PASO;
      for (const obj of objetos) if (obj.vivo) pasoObjeto(obj);
    }
    if (acum > PASO) acum = 0;
    for (let k = objetos.length - 1; k >= 0; k--) {
      const obj = objetos[k];
      if (!obj.vivo) {
        grupo.remove(obj.malla);
        obj.g.dispose();
        obj.mat.dispose();
        objetos.splice(k, 1);
        continue;
      }
      volcar(obj);
    }
  }
  function volcar(obj) {
    const pos = obj.g.attributes.position.array, uvq = obj.g.attributes.uvq.array, col = obj.g.attributes.color.array;
    let nq = 0;
    const emitir = (v, u, c) => {
      if (nq >= obj.maxQ) return;
      for (let k = 0; k < 4; k++) {
        const b = nq * 4 + k;
        pos.set(v[k], b * 3);
        uvq.set([ u[k][0], u[k][1], 1 ], b * 3);
        col.set(Array.isArray(c[0]) ? c[k] : c, b * 4);
      }
      nq++;
    };
    if (!obj.o.dibujoApagado) for (const p of obj.ps) if (p) obj.efecto.dibujar(p, obj.o, obj.cmn, emitir, cam);
    obj.g.setDrawRange(0, nq * 6);
    for (const k of [ "position", "uvq", "color" ]) obj.g.attributes[k].needsUpdate = true;
  }
  return {
    grupo: grupo,
    crear: crear,
    actualizar: actualizar,
    cam: cam,
    apagar(obj) {
      if (obj) obj.o.apagado = true;
    },
    limpiar() {
      for (const obj of objetos) obj.vivo = false;
    },
    get objetos() {
      return objetos;
    },
    materiales() {
      return objetos.map(o => o.mat);
    }
  };
}

export function quadFrente(cam, c, w, h, ang = 0) {
  const cs = Math.cos(ang), sn = Math.sin(ang);
  const R = cam.der.map((x, k) => x * cs + cam.arr[k] * sn), U = cam.arr.map((x, k) => x * cs - cam.der[k] * sn);
  const e = (sx, sy) => [ 0, 1, 2 ].map(k => c[k] + R[k] * sx * w / 2 + U[k] * sy * h / 2);
  return [ e(-1, 1), e(1, 1), e(-1, -1), e(1, -1) ];
}

export function segmentoPx(cam, a, b, pxA, pxB) {
  const prof = p => Math.max(1, (p[0] - cam.pos[0]) * cam.fr[0] + (p[1] - cam.pos[1]) * cam.fr[1] + (p[2] - cam.pos[2]) * cam.fr[2]);
  const wa = pxA * prof(a) / cam.focal, wb = pxB * prof(b) / cam.focal;
  return [ a, a.map((x, k) => x + cam.der[k] * wa), b, b.map((x, k) => x + cam.der[k] * wb) ];
}

export function profundidad(cam, p) {
  return (p[0] - cam.pos[0]) * cam.fr[0] + (p[1] - cam.pos[1]) * cam.fr[1] + (p[2] - cam.pos[2]) * cam.fr[2];
}
