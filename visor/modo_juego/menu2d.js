// SH4 web — FeniXVOID · Project Ravenlight
import * as P from "./pantallas.js";

const cache = new WeakMap;

export function puntero2D(M) {
  if (cache.has(M)) return cache.get(M);
  const lienzo = M.renderer.domElement;
  let pos = null, movido = false, toque = null, tToque = 0, filaVR = null;
  const aJuego = (cx, cy) => {
    const r = lienzo.getBoundingClientRect();
    const w = Math.min(r.width, r.height * 4 / 3), h = w * 3 / 4;
    return {
      x: (cx - r.left - (r.width - w) / 2) / w * P.W,
      y: (cy - r.top - (r.height - h) / 2) / h * P.H
    };
  };
  let arrastre = 0, yArrastre = null;
  lienzo.addEventListener("pointermove", e => {
    if (e.pointerType === "mouse") {
      pos = aJuego(e.clientX, e.clientY);
      movido = true;
      return;
    }
    if (yArrastre != null && M.pantalla.visible) {
      const y = aJuego(e.clientX, e.clientY).y;
      arrastre += yArrastre - y;
      yArrastre = y;
    }
  });
  lienzo.addEventListener("pointerdown", e => {
    toque = aJuego(e.clientX, e.clientY);
    tToque = performance.now();
    if (e.pointerType === "mouse") pos = toque; else yArrastre = toque.y;
  });
  const soltar = () => {
    yArrastre = null;
  };
  lienzo.addEventListener("pointerup", soltar);
  lienzo.addEventListener("pointercancel", soltar);
  lienzo.addEventListener("wheel", e => {
    if (M.pantalla.visible) arrastre += Math.sign(e.deltaY) * 24;
  }, {
    passive: true
  });
  const dentro = (p, f) => p && f && p.x >= f.x0 && p.x < f.x1 && p.y >= f.y0 && p.y < f.y1;
  const buscar = (p, filas) => {
    const i = filas.findIndex(f => dentro(p, f));
    return i >= 0 ? i : null;
  };
  let ultimoVR = null;
  const api = {
    sobre(filas) {
      if (M.enVR()) {
        P.acercarPantalla(M);
        ultimoVR = P.apuntar(M);
        const i = buscar(ultimoVR, filas);
        if (i === filaVR) return null;
        filaVR = i;
        if (i != null) {
          const lado = M.opciones?.().manoVR === "izq" ? "left" : "right";
          try {
            for (const s of M.renderer.xr.getSession()?.inputSources || []) if (s.handedness === lado) s.gamepad?.hapticActuators?.[0]?.pulse?.(.2, 15);
          } catch {}
        }
        return i;
      }
      ultimoVR = null;
      if (!movido) return null;
      movido = false;
      return buscar(pos, filas);
    },
    tocada(filas) {
      if (!toque || performance.now() - tToque > 1500) return null;
      const i = buscar(toque, filas);
      toque = null;
      return i;
    },
    reiniciar() {
      arrastre = 0;
      toque = null;
      movido = false;
      filaVR = null;
    },
    filasArrastradas(paso) {
      const n = Math.trunc(arrastre / paso);
      arrastre -= n * paso;
      return n;
    },
    dibujar(g) {
      if (M.enVR()) P.cursor(g, ultimoVR, M);
    },
    posicion() {
      if (M.enVR()) {
        P.acercarPantalla(M);
        ultimoVR = P.apuntar(M);
        return ultimoVR ? {
          ...ultimoVR,
          movido: true
        } : null;
      }
      if (!pos) return null;
      const m = movido;
      movido = false;
      return {
        x: pos.x,
        y: pos.y,
        movido: m
      };
    },
    get enVR() {
      return M.enVR();
    }
  };
  cache.set(M, api);
  return api;
}

export const filasLista = (n, {x0: x0, x1: x1, y0: y0, paso: paso, alto: alto = paso}) => Array.from({
  length: n
}, (_, i) => ({
  x0: x0,
  x1: x1,
  y0: y0 + i * paso,
  y1: y0 + i * paso + alto
}));
