// SH4 web — FeniXVOID · Project Ravenlight
import { q } from "./motor.js";

import { partesBin } from "../lib/sh4bin.js";

import { leerModelo } from "../lib/modelo.js";

import { leerTexturas } from "../lib/texturas.js";

import { crearPersonaje } from "../lib/personaje.js";

const E = .005, DT = 1 / 30;

const ITEM = {
  VELA: 4,
  MEDALLON: 8
};

const C = {
  ALTO: 400,
  PARED: .5,
  RELOJ: 5,
  TOPE: 50,
  BAJA: .6,
  MEDALLON: 1.5,
  VELA: 3.01,
  RADIO_VELA: 400,
  VIDA_VELA: 100,
  QUEMA_USO: 2.9
};

export function crearMaldicionMundos({THREE: THREE, M: M, juego: juego, henry: henry, enemigos: enemigos, amb: amb, PARTIDA: PARTIDA, bajar: bajar, getColision: getColision, cont: cont, decir: decir, pies: pies = null, aJuego: aJuego = null}) {
  const ctl = henry.controlador;
  const H = PARTIDA.hauntings ||= {};
  let reloj = 0, velas = [], cuentaVelas = 0, medAntes = null;
  const rayo = new THREE.Raycaster, vA = new THREE.Vector3, vB = new THREE.Vector3;
  const aV = (p, alto = 0) => new THREE.Vector3(-p[0] * E, (-p[1] + alto) * E, p[2] * E);
  const henryPos = () => {
    if (pies && aJuego) return aJuego(pies());
    const g = henry.personaje.grupo.position;
    return [ -g.x / E, -g.y / E, g.z / E ];
  };
  const lugarMedallon = () => henry.inventario?.lugares?.find(l => l.k === ITEM.MEDALLON) || null;
  const medallonPuesto = () => {
    const l = lugarMedallon();
    if (!l) {
      H.medallon = false;
      return false;
    }
    return !!H.medallon && (l.dur ?? 100) > 0;
  };
  function gastarMedallon(v) {
    const l = lugarMedallon();
    if (!l) return;
    l.dur = (l.dur ?? 100) - v;
    if (l.dur <= 0) {
      henry.inventario.quitar(ITEM.MEDALLON);
      H.medallon = false;
    }
  }
  function pared(a, b) {
    const col = getColision?.();
    if (!col) return false;
    vA.copy(aV(a, 150));
    vB.copy(aV(b, 150));
    const L = vA.distanceTo(vB);
    if (L < .001) return false;
    rayo.set(vA, vB.sub(vA).normalize());
    rayo.far = L;
    return rayo.intersectObject(col).some(h => Math.abs(h.face.normal.y) < .6);
  }
  function zonas() {
    const out = [];
    for (const e of enemigos.enemigos || []) {
      if (!e?.pos || e.visible === false || e.cond === 9 || e.cond === 11 || e.cond === 18) continue;
      if (typeof e.maldice === "function" && !e.maldice()) continue;
      if (typeof e.intocable === "function" && e.intocable() && e.tipo !== "PICKGIRL") continue;
      const p = e.param;
      if (!p) continue;
      if (p.rango_danio > 0 && p.danio_extra > 0) out.push({
        e: e,
        pos: e.pos,
        R: p.rango_danio * 200,
        P: p.danio_extra
      });
      if (e.tipo === "FAT" && [ 4, 8, 10, 20 ].includes(e.paso) && p.ataque1 > 0) out.push({
        e: e,
        pos: e.pos,
        R: 200,
        P: p.ataque1
      });
    }
    return out;
  }
  function danioZona(z, hp, dt) {
    if (Math.abs(hp[1] - z.pos[1]) > C.ALTO) return 0;
    const d = Math.hypot(hp[0] - z.pos[0], hp[2] - z.pos[2]);
    if (d >= z.R) return 0;
    return (z.R - d) / z.R * z.P * dt;
  }
  function danioEn(pos) {
    let suma = 0;
    for (const z of zonas()) {
      const x = danioZona(z, pos, DT);
      if (x > 0) suma += pared(pos, z.pos) ? x * C.PARED : x;
    }
    return suma;
  }
  function exorcismo(e, dt = DT) {
    let v = 0;
    for (const x of velas) {
      const d = Math.hypot(x.pos[0] - e.pos[0], x.pos[1] - e.pos[1], x.pos[2] - e.pos[2]);
      if (d < C.RADIO_VELA) {
        v += dt * x.potencia * C.VELA;
        x.usada = true;
      }
    }
    return v;
  }
  function vela(e) {
    if (medallonPuesto() && e?.param?.rango_danio > 0) {
      const hp = henryPos();
      let x = 0;
      for (const z of zonas()) if (z.e === e) x += danioZona(z, hp, DT);
      if (x > 0) return Math.max(x, .01) * C.MEDALLON;
    }
    return exorcismo(e);
  }
  enemigos.vela = vela;
  enemigos.exorcismo = e => exorcismo(e);
  const bins = new Map;
  const bin = a => {
    if (!bins.has(a)) bins.set(a, bajar("data/" + a).then(b => ({
      b: b,
      p: partesBin(b)
    })));
    return bins.get(a);
  };
  async function apoyarVela() {
    const hp = henryPos(), r = ctl.m.cuerpo;
    const p = [ hp[0] + Math.sin(r) * 60, hp[1], hp[2] + Math.cos(r) * 60 ];
    const col = getColision?.();
    let y = null;
    if (col) {
      rayo.set(aV(p, 100), new THREE.Vector3(0, -1, 0));
      rayo.far = 300 * E;
      const h = rayo.intersectObject(col).find(x => Math.abs(x.face.normal.y) > .6);
      if (h) y = -h.point.y / E;
    }
    if (y == null) {
      await decir([ juego.textoItem?.(22) || "No puedo ponerla aquí..." ]);
      return false;
    }
    p[1] = y - 20;
    henry.inventario.quitar(ITEM.VELA);
    const v = {
      pos: p,
      t: 0,
      potencia: 1,
      usada: false,
      n: 30 + cuentaVelas++ % 10,
      pj: null,
      fuego: null
    };
    velas.push(v);
    try {
      const {b: b, p: pp} = await bin("wp_model.bin");
      const pj = crearPersonaje(leerModelo(b, pp[80].ofs, pp[80].len), leerTexturas(b, pp[112].ofs, pp[112].len));
      pj.ubicar(p[0], p[1], p[2], 0);
      pj.grupo.name = "Vela Sagrada";
      cont.add(pj.grupo);
      v.pj = pj;
    } catch (e) {
      console.warn("vela", e.message);
    }
    try {
      v.fuego = amb?.fx?.fuegos?.vela?.(v.n, [ p[0], p[1] - 50, p[2] ]) ?? null;
    } catch {}
    return true;
  }
  function quitarVela(v) {
    v.pj?.grupo.removeFromParent();
    v.pj?.dispose?.();
    try {
      amb?.fx?.fuegos?.apagarVela?.(v.n);
    } catch {}
    velas.splice(velas.indexOf(v), 1);
  }
  let ocupado = false;
  henry.inventario?.alMensaje?.(t => {
    const inv = henry.inventario;
    if (ocupado || !t || t !== inv.texto(25)) return;
    const l = inv.lugares[inv.sel];
    if (!l || l.k !== ITEM.VELA && l.k !== ITEM.MEDALLON) return;
    ocupado = true;
    try {
      if (l.k === ITEM.MEDALLON) {
        H.medallon = !H.medallon;
        inv.mensaje(H.medallon ? `Te pones el Medallón Santo (${Math.round(l.dur ?? 100)} %).` : "Te sacas el Medallón Santo.");
      } else {
        inv.mensaje("");
        inv.cerrar?.();
        apoyarVela();
      }
    } finally {
      ocupado = false;
    }
  });
  return {
    vela: vela,
    exorcismo: exorcismo,
    apoyarVela: apoyarVela,
    medallonPuesto: medallonPuesto,
    danioEn: danioEn,
    ponerMedallon(si = true) {
      if (si && !lugarMedallon()) henry.agregarItem(ITEM.MEDALLON, 1);
      H.medallon = !!si;
      return medallonPuesto();
    },
    zonas: zonas,
    alCargarEscena() {
      for (const v of velas.slice()) quitarVela(v);
      reloj = 0;
    },
    cuadro(dt) {
      const hp = henryPos(), med = medallonPuesto();
      let suma = 0;
      for (const z of zonas()) {
        const x = danioZona(z, hp, dt);
        if (x <= 0) continue;
        if (med) {
          gastarMedallon(dt);
          continue;
        }
        suma += pared(hp, z.pos) ? x * C.PARED : x;
      }
      if (suma > 0 && !ctl.s.muerto && !q.has("sindanio")) {
        reloj += dt;
        if (reloj > C.RELOJ) {
          reloj = 0;
          const golpe = Math.min(C.TOPE, suma / dt * C.RELOJ);
          if (ctl.danio?.(golpe)) ctl.morir?.();
          henry.armaVista?.vibrar?.(.6, 120);
        }
      } else reloj = Math.max(0, reloj - dt * C.BAJA);
      for (const v of velas.slice()) {
        v.t += v.usada ? dt * C.QUEMA_USO : dt;
        v.usada = false;
        if (v.pj) v.pj.grupo.scale.set(1, Math.max(.05, Math.min(1, (100 - v.t) * .01)), 1);
        if (v.t > C.VIDA_VELA) quitarVela(v);
      }
      if (med !== medAntes) {
        medAntes = med;
        try {
          amb?.fx?.opciones?.({
            medallon: med
          });
        } catch {}
      }
      return suma > 0 || velas.length > 0;
    },
    estado: () => ({
      reloj: +reloj.toFixed(2),
      medallon: medallonPuesto() ? Math.round(lugarMedallon()?.dur ?? 0) : null,
      velas: velas.map(v => Math.round(v.t)),
      zonas: zonas().map(z => `${z.e.tipo}:${Math.round(z.R)}/${z.P}`)
    })
  };
}
