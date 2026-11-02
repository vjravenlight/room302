// SH4 web — FeniXVOID · Project Ravenlight
export const ADX_MEDIA_DEMO = {
  300: 30205,
  301: 30206,
  302: 30207,
  304: 30191,
  305: 30192,
  306: 30193,
  308: 30195,
  309: 30196,
  311: 30198,
  312: 30199,
  313: 30200,
  314: 30201,
  315: 30202,
  317: 30204,
  319: 30211,
  320: 30212,
  323: 30208,
  324: 30209,
  327: 30258,
  328: 30258
};

export const adxMediaDemo = n => ADX_MEDIA_DEMO[n] ?? 0;

const ALTURA = 2.5;

export function volumenMediaDemo(desde, centro, cerca = 300, lejos = 2e3) {
  if (!desde || !centro) return 1;
  const d = Math.hypot(desde[0] - centro[0], ((desde[1] || 0) - (centro[1] || 0)) * ALTURA, desde[2] - centro[2]);
  return d < cerca ? 1 : d > lejos ? 0 : 1 - (d - cerca) / (lejos - cerca);
}

export function vozMediaDemo(son, n, k0 = 0) {
  const adx = adxMediaDemo(n);
  if (!adx || !son?.efecto) return null;
  let h = null;
  try {
    h = son.efecto(adx, null, {
      volumen: Math.max(0, k0),
      loop: false
    });
  } catch (e) {
    console.warn("voz de la media demo", n, e?.message || e);
  }
  if (!h) return null;
  let k = Math.max(0, k0), fin = false, dur = 0, t0 = 0;
  const pedido = performance.now();
  const mirar = () => {
    const f = (h.fuentes || [])[0];
    if (f && !t0) {
      t0 = performance.now();
      dur = f.s?.buffer?.duration || 0;
      try {
        f.s.addEventListener("ended", () => {
          fin = true;
        });
      } catch {}
    }
  };
  return {
    adx: adx,
    h: h,
    fijar(x) {
      k = Math.max(0, Math.min(1, x));
      mirar();
      for (const f of h.fuentes || []) {
        try {
          f.g.gain.value = k;
        } catch {}
      }
    },
    parar(fundido = .2) {
      fin = true;
      try {
        h.parar?.(fundido);
      } catch {}
    },
    get k() {
      return k;
    },
    get sonando() {
      mirar();
      return !fin && !h.parado && (h.fuentes || []).length > 0;
    },
    get terminada() {
      mirar();
      if (fin || h.parado) return true;
      if (t0) return performance.now() - t0 > dur * 1e3 + 300;
      return performance.now() - pedido > 15e3;
    }
  };
}

export function camaraJuego(THREE, camara, aJuego) {
  if (!camara || !aJuego) return null;
  const v = new THREE.Vector3;
  camara.getWorldPosition(v);
  return aJuego(v);
}
