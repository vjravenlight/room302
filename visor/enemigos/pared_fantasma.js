// SH4 web — FeniXVOID · Project Ravenlight
import { DT, envolver, rumboHacia, distXZ, azar, azar01 } from "./comun.js";

export const PARED_MULTI = {
  atravesar: {
    animEntrar: 36,
    giro: Math.PI,
    manchaAparece: 400,
    manchaDesaparece: 200,
    alcance: 200,
    sonido: 61252
  },
  enPared: {
    warp: .5,
    despertar: .02,
    trampa: .1,
    objetivo: 1600,
    manchaAparece: 400,
    aparecer: 80
  },
  salir: {
    anim: 35,
    animTipo: 0,
    neutra: 0,
    variantes: 3,
    mover: 100,
    aparecer: 100,
    manchaAparece: 400,
    manchaDesaparece: 200,
    despertar: .1,
    alto: -180,
    cuadroFlotar: 260,
    sonido: 61252
  }
};

const EXCLUIR2 = 16e4;

const PREMOVE = .25;

const d2xz = (a, b) => {
  const x = a[0] - b[0], z = a[2] - b[2];
  return x * x + z * z;
};

const rumboNormal = n => Math.atan2(n[0], n[2]);

function pw(e) {
  return e.pw || (e.pw = {
    pared: null,
    normal: null,
    meta: null,
    entro: null,
    salida: 0,
    opac: 1
  });
}

function irHacia(e, meta, v) {
  const dx = meta[0] - e.pos[0], dz = meta[2] - e.pos[2], L = Math.hypot(dx, dz);
  if (L < .001) return 0;
  const k = Math.min(1, v / L);
  e.mov[0] += dx * k;
  e.mov[2] += dz * k;
  return L;
}

function girarHacia(e, rumbo, u) {
  const a = envolver(rumbo - e.rot);
  e.rot = envolver(e.rot + Math.max(-u, Math.min(u, a)));
}

function paredEn(e, punto, radio = 100, lado = null) {
  const h = e.m.paredCerca?.(punto, radio);
  if (!h) return null;
  let n = h.normal;
  if (lado && (lado[0] - punto[0]) * n[0] + (lado[2] - punto[2]) * n[2] < 0) n = [ -n[0], 0, -n[2] ];
  return {
    pos: [ ...punto ],
    normal: n,
    choque: h.pos
  };
}

function candidatos(e) {
  const v = e.m.puntosFantasma?.();
  if (v && v.length) return v.map(p => ({
    p: p,
    w: 1
  }));
  return (e.m.paredesAlrededor?.(e.jugador().pos, 2400) || []).map(p => ({
    p: p,
    w: 1
  }));
}

function elegirPunto(lista, punto, excluir, warp) {
  const c = lista.filter(x => !excluir || d2xz(x.p, excluir) >= EXCLUIR2).map(x => ({
    ...x,
    d: d2xz(x.p, punto)
  }));
  if (!c.length) return null;
  c.sort((a, b) => a.d - b.d);
  const peso = 1 - warp;
  for (const x of c) if (azar01() < azar01() * peso) return x.p;
  for (const x of c) if (azar01() < peso) return x.p;
  return c[0].p;
}

export function atravesarPared(e, prm, vel) {
  const P = pw(e);
  switch (e.sub) {
   case 0:
    {
      const pts = e.m.puntosFantasma?.() || [];
      let pared = null;
      if (pts.length) {
        const orden = pts.map(p => [ d2xz(p, e.pos), p ]).sort((a, b) => a[0] - b[0]);
        for (const [, p] of orden.slice(0, 6)) {
          pared = paredEn(e, p, 100, e.pos);
          if (pared) break;
        }
      }
      if (!pared) {
        const h = e.m.paredCerca?.(e.pos, 600, e.jugador().pos);
        if (h) pared = {
          pos: [ h.pos[0] + h.normal[0] * 40, e.pos[1], h.pos[2] + h.normal[2] * 40 ],
          normal: h.normal,
          choque: h.pos
        };
      }
      if (!pared) return -1;
      P.pared = pared.pos;
      P.normal = pared.normal;
      P.entro = [ ...pared.pos ];
      P.opac = 1;
      e.sub = 1;
    }

   case 1:
   case 2:
    {
      if (d2xz(P.pared, e.pos) <= prm.manchaAparece * prm.manchaAparece) {
        e.tipoCl = 4;
        e.sub = 3;
      }
      moverYGirar(e, P.pared, vel, prm.giro);
      return 1;
    }

   case 3:
   case 4:
    {
      if (d2xz(P.pared, e.pos) < prm.alcance * prm.alcance) {
        e.animSet(prm.animEntrar);
        e.m.sonido?.(e, prm.sonido);
        e.sub = 5;
      }
      moverYGirar(e, P.pared, vel, prm.giro);
      return 0;
    }

   case 5:
    {
      girarHacia(e, rumboNormal(P.normal) + Math.PI, DT * prm.giro);
      const L = irHacia(e, P.pared, vel * DT);
      if (L < 20) e.sub = 6;
      return 0;
    }

   case 6:
    {
      e.mov[0] -= P.normal[0] * vel * DT;
      e.mov[2] -= P.normal[2] * vel * DT;
      const adentro = -((e.pos[0] - P.pared[0]) * P.normal[0] + (e.pos[2] - P.pared[2]) * P.normal[2]);
      P.opac = Math.max(0, Math.min(1, 1 - adentro / prm.manchaDesaparece));
      e.opacidad = P.opac;
      if (adentro * adentro > prm.manchaDesaparece * prm.manchaDesaparece) {
        e.visible = false;
        e.opacidad = 1;
        e.tipoCl = 7;
        return 2;
      }
      return 0;
    }
  }
  return 0;
}

function moverYGirar(e, meta, vel, giro) {
  girarHacia(e, rumboHacia(meta, e.pos), DT * giro);
  irHacia(e, meta, vel * DT);
}

export function enPared(e, prm, vel) {
  const P = pw(e), j = e.jugador();
  if (e.sub === 0) {
    e.visible = false;
    e.tipoCl = 7;
    e.sub = 1;
  }
  if (!j.existe) return 0;
  if (e.sub === 1) {
    const L = irHacia(e, j.pos, vel * PREMOVE * DT);
    if (azar01() < prm.despertar || L < prm.objetivo) {
      const r = elegirSalida(e, prm);
      if (r) e.sub = 2;
    }
    return 0;
  }
  if (e.sub === 2) {
    const L = irHacia(e, P.meta, vel * DT);
    e.rot = rumboNormal(P.normal);
    if (L * L < prm.aparecer * prm.aparecer) return 1;
  }
  return 0;
}

function elegirSalida(e, prm) {
  const P = pw(e), j = e.jugador();
  const delante = [ j.pos[0] + Math.sin(j.rot) * prm.objetivo, j.pos[1], j.pos[2] + Math.cos(j.rot) * prm.objetivo ];
  const p = elegirPunto(candidatos(e), delante, P.entro, prm.warp);
  if (!p) return false;
  const pared = paredEn(e, p, 100, j.pos);
  if (!pared) return false;
  P.pared = pared.pos;
  P.normal = pared.normal;
  P.meta = [ pared.pos[0] - pared.normal[0] * prm.manchaAparece, j.pos[1], pared.pos[2] - pared.normal[2] * prm.manchaAparece ];
  return true;
}

export function salirDePared(e, prm, vel) {
  const P = pw(e);
  if (!P.pared) {
    P.pared = [ ...e.pos ];
    P.normal = [ Math.sin(e.rot), 0, Math.cos(e.rot) ];
  }
  switch (e.sub) {
   case 0:
    P.meta = [ P.pared[0] - P.normal[0] * prm.manchaAparece, e.pos[1], P.pared[2] - P.normal[2] * prm.manchaAparece ];
    e.visible = false;
    e.tipoCl = 7;
    e.sub = 1;

   case 1:
    {
      if ((e.pos[0] - P.pared[0]) * P.normal[0] + (e.pos[2] - P.pared[2]) * P.normal[2] >= 0) {
        e.pos[0] = P.meta[0];
        e.pos[2] = P.meta[2];
        e.posAnt = [ ...e.pos ];
      }
      if (d2xz(P.meta, e.pos) < 400) {
        P.meta = [ ...P.pared ];
        e.rot = rumboNormal(P.normal);
        e.sub = 2;
      }
      irHacia(e, P.meta, vel * DT);
      return 1;
    }

   case 2:
    {
      e.rot = rumboNormal(P.normal);
      if (d2xz(P.pared, e.pos) >= prm.aparecer * prm.aparecer) {
        irHacia(e, P.pared, vel * DT);
        return 1;
      }
      e.pos[0] = P.pared[0];
      e.pos[2] = P.pared[2];
      e.posAnt = [ ...e.pos ];
      e.animSet(prm.anim);
      e.m.sonido?.(e, prm.sonido);
      e.visible = true;
      P.opac = 0;
      e.opacidad = 0;
      P.salida = 0;
      e.sub = 3;
      return 1;
    }

   case 3:
   case 4:
    {
      aparecerOpacidad(e, P);
      if (e.sub === 3 && e.anim.cuadro >= prm.cuadroFlotar) e.sub = 4;
      if (e.anim.fin || e.anim.vuelta) {
        e.animSet(prm.neutra + azar(prm.variantes));
        e.tipoCl = 1;
        e.sub = 5;
      }
      return e.sub === 5 ? 2 : 1;
    }

   case 5:
    {
      aparecerOpacidad(e, P);
      if (P.salida < prm.mover) {
        const v = Math.min(vel * DT, prm.mover - P.salida);
        e.mov[0] += P.normal[0] * v;
        e.mov[2] += P.normal[2] * v;
        P.salida += v;
      }
      if (e.anim.fin || e.anim.vuelta) e.sub = 6;
      return 1;
    }

   case 6:
    aparecerOpacidad(e, P);
    if (azar01() < prm.despertar) {
      e.opacidad = 1;
      return 3;
    }
    return 2;
  }
  return 0;
}

function aparecerOpacidad(e, P) {
  P.opac = Math.min(1, P.opac + DT);
  e.opacidad = P.opac;
}

export const enLaPared = e => e.visible === false;
