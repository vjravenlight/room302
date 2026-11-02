// SH4 web — FeniXVOID · Project Ravenlight
export const MANO = {
  DER_ABIERTA: 1,
  DER_PUNO: 2,
  DER_MOTOSIERRA: 3,
  DER_PISTOLA: 4,
  IZQ_CERRADA: 5,
  IZQ_ABIERTA: 6,
  DER_OTRA: 7
};

const SIN_ARMA = [ 6, 1, 6, 1 ];

export function manosDelJuego(datos, arma, estado = 0) {
  const t = arma && datos?.arma?.(arma)?.anim_izq_der || SIN_ARMA;
  const pelea = estado >= 2 && estado < 50;
  return pelea ? [ t[2], t[3] ] : [ t[0], t[1] ];
}

export function crearManosHenry({pj: pj, modelo: modelo, datos: datos}) {
  const grupos = modelo.partes.map(s => s.grupoParte | 0);
  pj.mallas.forEach((m, i) => {
    if (grupos[i]) m.userData.grupoMano = grupos[i];
  });
  const actual = {
    izq: 0,
    der: 0
  };
  function poner(izq, der) {
    if (izq === actual.izq && der === actual.der) return;
    actual.izq = izq;
    actual.der = der;
    pj.mallas.forEach((m, i) => {
      const g = grupos[i];
      if (g) m.visible = g === izq || g === der;
    });
  }
  return {
    juego(arma, estado) {
      const [i, d] = manosDelJuego(datos, arma, estado);
      poner(i, d);
    },
    poner: poner,
    get actual() {
      return {
        ...actual
      };
    }
  };
}
