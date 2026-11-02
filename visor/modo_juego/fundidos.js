// SH4 web — FeniXVOID · Project Ravenlight
export const FPS = 30;

const NORMAL = {
  entra: 4,
  sale: 4,
  antes: 30
};

const NFADE = {
  47: {
    entra: 2,
    sale: 1,
    antes: 90
  }
};

export const VEL = 4;

export const segundos = (delta = 1, vel = VEL) => Math.max(.001, Math.ceil(128 * Math.abs(delta) / vel) / FPS);

export const aNegro = (M, vel = VEL) => M.fundir(1, segundos(1 - (M.velo ?? 0), vel));

export const aImagen = (M, vel = VEL) => M.fundir(0, segundos(M.velo ?? 1, vel));

export function fundidoDemo(D, {hasta: hasta = null, mantener: mantener = false, sinEntrada: sinEntrada = false} = {}) {
  const f = NFADE[D.id] || NORMAL;
  const fin = hasta ?? D.duracion;
  let t0 = null;
  return seg => {
    const ahora = performance.now() / 1e3;
    if (t0 === null) t0 = ahora;
    let nivel = sinEntrada ? 0 : Math.max(0, 128 - f.entra * Math.floor((ahora - t0) * FPS));
    if (!mantener) {
      const c = Math.floor((seg - (fin - f.antes / FPS)) * FPS);
      if (c > 0) nivel = Math.max(nivel, Math.min(128, f.sale * c));
    }
    return nivel / 128;
  };
}
