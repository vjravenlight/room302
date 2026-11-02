// SH4 web — FeniXVOID · Project Ravenlight
import { json, q } from "./motor.js";

import { lucesDelJuego, aplicarLucesPersonaje } from "../lib/luz_cine.js";

import { FPS } from "../lib/sqt.js";

import { vozMediaDemo, volumenMediaDemo, camaraJuego } from "./voz_media.js";

import { lucesASala, armarSala, crearLucesPersonajes } from "../lib/sala.js";

import { leerLuces } from "../lib/luces.js";

import { partesBin } from "../lib/sh4bin.js";

import * as P from "./pantallas.js";

import { crearGuion, agujeroDeVuelta } from "./guion_comun.js";

const pad3 = n => String(n).padStart(3, "0");

const distXZ = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);

const azar = n => Math.floor(Math.random() * n);

const m8 = v => (v % 8 + 8) % 8;

const LLEGADA = {
  escena: 1,
  pos: [ 150, 0, -1800 ],
  rot: -1.5708
};

const VOZ_ANDREW = {
  centro: [ -521, -357, 1250 ],
  demos: [ 323, 324 ]
};

const SON = {
  ITEM: 40006,
  BOTON: 50603,
  BIEN: 50604,
  MAL: 50605,
  AGUA: 51602,
  PASOS_GUARDIA: 50607,
  EJE: 20126,
  RUEDA: 20127
};

const GUARDIA = {
  radio: 1e3,
  prob: [ .1, .2, .3, .05, .05, .05, .05, .05, .05, .05, .05 ],
  sonidos: [ null, null, null, 20117, 20118, 20119, 20120, 20121, 20122, [ 20123, 20124 ], 20125 ]
};

const ITEM = {
  LLAVE_ARRIBA: 124,
  PLACA: 120
};

let PD = null;

async function datos() {
  if (!PD || PD._vacio) PD = await json("./prision_datos.json") || PD || {
    _vacio: true,
    fin: {},
    torre: null,
    guiones: {},
    agujeros: [],
    zonas: {},
    cerraduras: []
  };
  return PD;
}

datos();

export function crearTorre(PDt, giros, F) {
  const NOM = [ null, "b1", "f1", "f2", "f3" ];
  const piso = n => PDt.pisos[NOM[n]];
  const giro = n => giros[n - 1] | 0;
  const celda = (n, pos) => piso(n)?.celdas[m8(giro(n) + pos)] || null;
  const caño = (n, pos) => piso(n)?.caños[m8(giro(n) + pos)] || null;
  const pisoDe = e => e >= 1 && e <= 10 || e === 34 ? 2 : e >= 11 && e <= 20 ? 3 : e >= 21 && e <= 30 ? 4 : e >= 35 && e <= 39 ? 1 : -1;
  function posDe(n, esc) {
    for (let i = 0; i < 8; i++) if (celda(n, i)?.escena === esc) return i;
    return -1;
  }
  const pasillo = n => PDt.puertas_pasillo[NOM[n]] || [];
  const puertaDePos = (n, pos) => pasillo(n)[pos] ?? -1;
  function posDePuerta(door) {
    for (const n of [ 2, 3, 4 ]) {
      const i = pasillo(n).indexOf(door);
      if (i >= 0) return {
        n: n,
        pos: i
      };
    }
    return null;
  }
  function info(esc) {
    const n = pisoDe(esc);
    const pos = n > 0 ? posDe(n, esc) : -1;
    return pos < 0 ? null : {
      n: n,
      pos: pos,
      c: celda(n, pos)
    };
  }
  const sano = (n, pos) => {
    const c = caño(n, pos);
    return !!(c && c.hay && !c.roto);
  };
  const impar = pos => (pos & 1) === 1;
  function fluye(n, pos) {
    if (!F(711)) return false;
    switch (n) {
     case 4:
      return impar(pos) && sano(4, pos);

     case 3:
      return impar(pos) && sano(3, pos) && fluye(4, pos);

     case 2:
      return impar(pos) && sano(2, pos) && fluye(3, pos);

     case 1:
      return fluye(2, [ 1, 3, 5, 7 ][pos] ?? -1);
    }
    return false;
  }
  const rueda = () => fluye(1, 0) !== fluye(1, 2);
  const velRueda = () => {
    const a = fluye(1, 0), b = fluye(1, 2);
    return a && !b ? .049087387 : !a && b ? -.049087387 : a && b ? (Math.random() - .5) * .01 : 0;
  };
  const agujero = (n, pos) => !!celda(n, pos)?.agujero;
  function luz(esc) {
    if (!rueda()) return false;
    const i = info(esc);
    if (!i) return false;
    switch (i.n) {
     case 4:
      return true;

     case 3:
      return agujero(4, i.pos);

     case 2:
      return agujero(3, i.pos) && agujero(4, i.pos);

     case 1:
      {
        const k = [ 0, 2, 5, 7 ][i.pos];
        return k != null && agujero(3, k) && agujero(4, k);
      }
    }
    return false;
  }
  function derrama(n, pos) {
    if (!F(711)) return false;
    const llega = n === 2 ? fluye(3, pos) : n === 3 ? fluye(4, pos) : n === 4 ? impar(pos) : false;
    if (!llega) return false;
    return (giro(n) & 1) === 1 || !!caño(n, pos)?.roto;
  }
  function bajoAgujero(esc) {
    if (esc === 4) return 36;
    if (esc === 6) return 38;
    if (esc === 9) return 37;
    const i = info(esc);
    if (!i || i.n < 3) return 0;
    return celda(i.n - 1, i.pos)?.escena || 0;
  }
  function girar(n, dir) {
    if (n === 3 || n === 4) giros[n - 1] = m8(giro(n) + 8 + dir);
  }
  return {
    piso: piso,
    giro: giro,
    celda: celda,
    "caño": caño,
    pisoDe: pisoDe,
    posDe: posDe,
    puertaDePos: puertaDePos,
    posDePuerta: posDePuerta,
    info: info,
    fluye: fluye,
    rueda: rueda,
    velRueda: velRueda,
    luz: luz,
    derrama: derrama,
    bajoAgujero: bajoAgujero,
    girar: girar,
    giros: giros
  };
}

export const PRISION = {
  etapa: "mz",
  nombre: {
    s: "Prisión de Agua",
    e: "Water Prison World"
  },
  inicio: {
    escena: 1
  },
  terminado: 718,
  banderasAlLlegar: [],
  banderasAtajo: [ 701 ],
  despues: {},
  demoAlAzar: {},
  molinetes: [],
  sinHacer: [],
  fin: {
    evnum: 105,
    escena302: 2
  },
  variantes: [],
  puertas: {},
  excluir: () => false,
  crear: api => crearPrision(api)
};

function crearPrision(api) {
  const {THREE: THREE, M: M, juego: juego, henry: henry, F: F, prender: prender, decir: decir} = api;
  const E = .005;
  const aMundo = p => new THREE.Vector3(-p[0] * E, -p[1] * E, p[2] * E);
  const aJuego = v => [ -v.x / E, -v.y / E, v.z / E ];
  const apagar = n => {
    if (n) api.PARTIDA.banderas[n] = 0;
  };
  const posHenry = () => api.aJuego(api.pies());
  const cuantos = k => henry.inventario?.cuantos(k) || 0;
  const son = () => api.amb?.son || null;
  function sonar(id, posJuego = null, op = {}) {
    try {
      return son()?.efecto?.(id, posJuego ? aMundo(posJuego) : null, op) || null;
    } catch {
      return null;
    }
  }
  const comun = n => juego.textoComun?.(n) || "";
  const agua0 = n => api.texto(7, n);
  const giros = api.PARTIDA.torreMz ||= [ 0, 0, 0, 0 ];
  if (q.has("giros")) q.get("giros").split(",").forEach((v, i) => {
    giros[i] = m8(+v || 0);
  });
  let T = null;
  let escena = 0, activo = false, accionPendiente = false, aAntes = false;
  const finDe = ev => PD?.fin?.etapa4?.[String(ev?.evnum)] || PD?.fin?.comun?.[String(ev?.evnum)] || null;
  const banderaDe = ev => {
    const m = /^!F(\d+)/.exec(ev?.cond || "");
    return m ? +m[1] : 0;
  };
  function terminar(ev) {
    const l = finDe(ev);
    if (l) {
      for (const b of l) b > 0 ? prender(b) : apagar(-b);
      return;
    }
    prender(banderaDe(ev));
  }
  const cumpleCond = c => !c || c === "siempre" || c.split(/\s+AND\s+/).every(x => x[0] === "!" ? !F(+x.slice(2)) : F(+x.slice(1)));
  let guionComun = null;
  function guion(cmds, o) {
    guionComun ||= crearGuion({
      decir: decir,
      texto: (a, n) => api.texto(a, n),
      comun: comun,
      darItem: k => henry.agregarItem(k, 1),
      siNo: "marcado",
      llamada: f => llamada(f)
    });
    return guionComun(cmds, o);
  }
  function llamada(f) {
    const d = String(f).slice(0, 8);
    if (d === "0x50abe0" || d === "0x50ac00") sonar(SON.ITEM);
  }
  async function elegir(texto, opciones, inicial = 1) {
    juego.hablando = true;
    const c = M.cartel;
    const r = await new Promise(ok => {
      let el = inicial, t = 0;
      const dibujar = () => {
        P.dibujarMensaje(c.g, juego.fuente, texto + "\n ", {
          alfa: Math.min(1, t * 6)
        });
        const lineas = (texto + "\n ").split("\n").length, alto = lineas * 24 + 18, y = 128 - alto - 4 + 10 + (lineas - 1) * 24;
        opciones.forEach((op, i) => juego.fuente.escribir(c.g, op, 320 + (i - (opciones.length - 1) / 2) * 190, y, {
          escala: P.ESC,
          alinear: "centro",
          color: i === el ? "#ffffff" : "#8a8178",
          alfa: Math.min(1, t * 6)
        }));
        c.mostrar();
      };
      const tarea = (dt, {acciones: acciones}) => {
        t += dt;
        dibujar();
        for (const a of acciones) {
          if (a === "izq") el = Math.max(0, el - 1);
          if (a === "der") el = Math.min(opciones.length - 1, el + 1);
          if (t > .25 && (a === "aceptar" || a === "accion" || a === "clic")) {
            M.tareas.delete(tarea);
            c.ocultar();
            ok(el);
            return true;
          }
          if (t > .25 && a === "cancelar") {
            M.tareas.delete(tarea);
            c.ocultar();
            ok(-1);
            return true;
          }
        }
        return t < .3;
      };
      M.tareas.add(tarea);
    });
    juego.hablando = false;
    return r;
  }
  const demo = n => api.ejecutar({
    i: -1,
    prision: true,
    ev: {
      evnum: 0,
      demo: n,
      cond: "siempre"
    }
  });
  async function ir(n, llegada) {
    await M.fundir(1, .4);
    await api.irA(n, llegada);
    await M.fundir(0, .5);
  }
  const media = (() => {
    const cache = new Map;
    let actual = null, subAnt = "";
    const grupo = new THREE.Group;
    grupo.name = "media demo (Andrew)";
    const _p = new THREE.Vector3, _q = new THREE.Quaternion, _s = new THREE.Vector3, _m = new THREE.Matrix4;
    async function abrir(n) {
      if (!cache.has(n)) cache.set(n, (async () => {
        const D = await api.cine.abrir(n);
        const off = api.DS?.demos?.["mz/d_" + pad3(n)]?.desplazar || [ 0, 0, 0 ];
        D.grupoMedia = new THREE.Group;
        D.grupoMedia.position.copy(aMundo(off)).negate();
        for (const ent of D.personajes) if (ent.obj) {
          ent.obj.grupo.visible = true;
          D.grupoMedia.add(ent.obj.grupo);
        }
        return D;
      })().catch(e => {
        cache.delete(n);
        throw e;
      }));
      return cache.get(n);
    }
    function poner(D, t) {
      const S = D.muestrear(t, true);
      const L = lucesDelJuego(D.sqt, S);
      for (const ent of D.personajes) {
        if (!ent.obj) continue;
        const po = S.poses[ent.i], hs = ent.obj.huesos;
        if (ent.uniformsLuz) aplicarLucesPersonaje(ent.uniformsLuz, L, po.tiene[0] ? new THREE.Vector3(-po.pos[0] * E, -po.pos[1] * E, po.pos[2] * E) : null, null);
        for (let h = 0; h < hs.length; h++) {
          if (po.tiene[h]) {
            _p.fromArray(po.pos, h * 3);
            _q.fromArray(po.rot, h * 4);
            _s.fromArray(po.esc, h * 3);
            hs[h].matrix.compose(_p, _q, _s);
          } else {
            const pa = ent.padres[h];
            if (pa >= 0 && pa < h) hs[h].matrix.multiplyMatrices(hs[pa].matrix, _m.copy(ent.bind[pa]).invert()).multiply(ent.bind[h]); else hs[h].matrix.copy(ent.bind[h]);
          }
          hs[h].matrixWorldNeedsUpdate = true;
        }
      }
    }
    function sub(t) {
      if (t === subAnt) return;
      subAnt = t;
      try {
        api.mostrarSub(t);
      } catch {}
    }
    function arrancar(D, {centro: centro, alFin: alFin = null, volumen: volumen = null, alfaSub: alfaSub = null} = {}) {
      parar();
      if (!grupo.parent) M.escena.add(grupo);
      grupo.add(D.grupoMedia);
      const voz = vozMediaDemo(son(), D.id, volumen ?? volumenMediaDemo(camaraJuego(THREE, M.camara, aJuego), centro));
      actual = {
        D: D,
        t: 0,
        voz: voz,
        alFin: alFin,
        centro: centro,
        volumen: volumen,
        alfaSub: alfaSub
      };
      poner(D, 0);
    }
    function parar() {
      if (!actual) return;
      actual.voz?.parar(.2);
      actual.D.grupoMedia.removeFromParent();
      actual = null;
      sub("");
    }
    function cuadro(dt, pies) {
      if (!actual) return false;
      const a = actual;
      a.t += dt;
      const f = Math.min(a.D.sqt.n - 1, a.t * FPS);
      a.voz?.fijar(a.volumen ?? volumenMediaDemo(camaraJuego(THREE, M.camara, aJuego), a.centro));
      const k = pies && a.centro ? volumenMediaDemo(pies, a.centro) : 1;
      const fi = Math.floor(f);
      const alfa = a.alfaSub ?? k;
      sub(alfa > .2 && juego.opciones?.subtitulos !== false ? a.D.subs.filter(s => fi >= s.ini && fi < s.fin).map(s => s.texto).join("\n") : "");
      poner(a.D, f);
      if (f >= a.D.sqt.n - 1 && (!a.voz || a.voz.terminada)) {
        const fin = a.alFin;
        a.alFin = null;
        if (fin) fin(); else {
          a.t = 0;
          a.voz?.parar(.1);
          a.voz = vozMediaDemo(son(), a.D.id, a.volumen ?? 0);
        }
      }
      return true;
    }
    function liberar() {
      parar();
      for (const p of cache.values()) p.then(D => api.cine.liberar(D)).catch(() => {});
      cache.clear();
      grupo.removeFromParent();
    }
    return {
      abrir: abrir,
      arrancar: arrancar,
      parar: parar,
      cuadro: cuadro,
      liberar: liberar,
      grupo: grupo,
      get actual() {
        return actual;
      }
    };
  })();
  let vozPedida = false;
  async function vozAndrew(op = {}) {
    if (F(728)) return;
    vozPedida = true;
    const otra = async () => {
      if (!vozPedida || F(728)) {
        media.parar();
        return;
      }
      try {
        const D = await media.abrir(VOZ_ANDREW.demos[azar(2)]);
        if (vozPedida) media.arrancar(D, {
          centro: VOZ_ANDREW.centro,
          alFin: otra,
          ...op
        });
      } catch (e) {
        console.warn("voz de Andrew", e.message);
      }
    };
    await otra();
  }
  function callarAndrew() {
    vozPedida = false;
    media.parar();
  }
  const guardia = (() => {
    let on = false, ang = 2.7488937, accion = 0, espera = 0, paso = 0, dir = 1, prox = 0;
    const pos = () => [ Math.sin(ang) * GUARDIA.radio, -200, -Math.cos(ang) * GUARDIA.radio ];
    function elegirAccion() {
      let r = Math.random(), s = 0;
      for (let i = 0; i < GUARDIA.prob.length; i++) {
        s += GUARDIA.prob[i];
        if (r <= s) return i === accion ? (i + 1) % 11 : i;
      }
      return 0;
    }
    function cuadro(dt) {
      if (!on) return;
      espera -= dt;
      if (accion === 1) {
        ang += dir * (Math.PI * 2 / 60) * dt;
        paso -= dt;
        if (paso <= 0) {
          paso = 1;
          sonar(SON.PASOS_GUARDIA, pos(), {
            volumen: .8
          });
        }
      }
      if (espera > 0) return;
      accion = elegirAccion();
      dir = Math.random() < .5 ? -1 : 1;
      espera = accion === 1 ? 5 + Math.random() * 10 : accion === 0 ? 5 + Math.random() * 5 : 5 + Math.random() * 5;
      const s = GUARDIA.sonidos[accion];
      if (s) {
        const id = Array.isArray(s) ? s[azar(2)] : s;
        prox = setTimeout(() => sonar(id, pos(), {
          volumen: 1
        }), Math.random() * 5e3);
      }
    }
    return {
      cuadro: cuadro,
      encender(si) {
        on = si;
        if (!si) clearTimeout(prox);
        espera = Math.random() * 5;
      },
      get on() {
        return on;
      }
    };
  })();
  async function lucesDeLaCelda(n) {
    if (!T || !T.info(n)) return;
    const nombre = "mz" + String(n).padStart(2, "0");
    let juegos = null;
    try {
      const b = await api.bajar("data/" + nombre + ".bin");
      juegos = partesBin(b).filter(x => x.tipo === "luces").map(x => lucesASala(leerLuces(b, x.ofs, x.len), nombre));
    } catch {
      return;
    }
    if (!juegos || juegos.length < 2 || escena !== n) return;
    const viejo = (api.cont?.children || []).find(o => o.name === "luces de personajes");
    const nuevo = crearLucesPersonajes(THREE, T.luz(n) ? juegos[0] : juegos[1]);
    nuevo.userData.celda = T.luz(n) ? "con luz" : "sin luz";
    if (viejo) viejo.removeFromParent();
    api.cont.add(nuevo);
  }
  function cañosDeLaSala(n) {
    const piso = n === 1 ? 2 : n === 11 ? 3 : n === 21 ? 4 : 0;
    if (!piso || !T) return;
    const sala = "sala_mz" + String(n).padStart(2, "0");
    let g = null;
    api.cont?.traverse?.(o => {
      if (!g && o.name === "mundo_5" && (o.parent?.name || "").startsWith(sala)) g = o;
    });
    if (g) g.rotation.y = piso === 2 ? 0 : -(T.giro(piso) * Math.PI / 4);
  }
  const sonidosAgua = [];
  function aguaDeLaSala(n) {
    for (const h of sonidosAgua.splice(0)) {
      try {
        h?.parar?.(.3);
      } catch {}
    }
    if (!T) return;
    const fx = api.amb?.fx;
    const chorro = (p, veces) => {
      for (let k = 0; k < veces; k++) {
        try {
          fx?.disparar?.("canio", {
            pos: p,
            diametro: 60
          });
        } catch {}
      }
    };
    const pisoPasillo = {
      1: 2,
      11: 3,
      21: 4
    }[n];
    if (pisoPasillo) {
      for (let pos = 0; pos < 8; pos++) {
        if (!T.derrama(pisoPasillo, pos)) continue;
        const c = PD.torre.pos_caños[pos], p = [ c[0], c[1] - 180, c[2] ];
        chorro(p, 3);
        sonidosAgua.push(sonar(SON.AGUA, p, {
          loop: true,
          volumen: 1
        }));
      }
    }
    if (n === 32) {
      for (let i = 0; i < 4; i++) {
        if (!T.fluye(1, i)) continue;
        const c = PD.torre.pos_cascadas_b1[i], p = [ c[0], c[1] - 20, c[2] ];
        chorro(p, 4);
        sonidosAgua.push(sonar(SON.AGUA, p, {
          loop: true,
          volumen: 1
        }));
      }
    }
  }
  const globalesEspiar = new Map;
  async function espiar(o) {
    const pisoMirilla = {
      3: 2,
      13: 3,
      23: 4
    }[escena];
    if (!pisoMirilla || !T) return null;
    const grupo = o.grupo ?? api.objetosEscena(escena).find(x => x.indice === o.i)?.grupo_0x414 ?? 0;
    const k = m8(T.giro(pisoMirilla) + grupo);
    const celda = T.celda(pisoMirilla, grupo);
    const cam = PD.espiar.camaras[k];
    if (!celda || !cam) return null;
    const nombre = "mz" + String(celda.escena).padStart(2, "0");
    await M.fundir(1, .4);
    let sala = null;
    try {
      sala = await armarSala(THREE, api.bajar, nombre, globalesEspiar, {
        mitad: api.mitad
      });
    } catch (e) {
      console.warn("mirilla", nombre, e.message);
    }
    if (sala) M.escena.add(sala.grupo);
    henry.personaje.grupo.visible = false;
    if (henry.armaVista) henry.armaVista.montura.visible = false;
    const guardado = {
      pos: M.jugador.position.clone(),
      rot: M.jugador.rotation.clone(),
      cpos: M.camara.position.clone(),
      crot: M.camara.rotation.clone(),
      fov: M.camara.fov
    };
    const desde = aMundo(cam.desde), hacia = aMundo(cam.hacia);
    const vr = M.enVR();
    if (!vr) {
      M.jugador.position.copy(desde);
      M.jugador.rotation.set(0, 0, 0);
      M.camara.position.set(0, 0, 0);
      M.camara.lookAt(hacia);
      M.anclarCapas();
    } else {
      const cab = M.camara.getWorldPosition(new THREE.Vector3);
      M.jugador.position.add(desde.clone().sub(cab));
    }
    const base = M.camara.quaternion.clone();
    const voz = celda.escena === 2 && !F(728);
    if (voz) vozAndrew({
      volumen: .4,
      alfaSub: .25
    });
    M.redibujar();
    await M.fundir(0, .5);
    juego.fase = "mirilla";
    await new Promise(ok => {
      let yaw = 0, pitch = 0, t = 0;
      const LIM = .43633232;
      const tarea = (dt, {ejes: ejes, acciones: acciones, teclas: teclas}) => {
        t += dt;
        if (!vr) {
          const gx = (ejes.gx || ejes.x || 0) + (teclas.ArrowRight ? 1 : 0) - (teclas.ArrowLeft ? 1 : 0);
          const gy = (ejes.gy || ejes.y || 0) + (teclas.ArrowDown ? 1 : 0) - (teclas.ArrowUp ? 1 : 0);
          yaw = THREE.MathUtils.clamp(yaw - gx * .9 * dt, -LIM, LIM);
          pitch = THREE.MathUtils.clamp(pitch - gy * .9 * dt, -LIM, LIM);
          M.camara.quaternion.copy(base).multiply((new THREE.Quaternion).setFromEuler(new THREE.Euler(pitch, yaw, 0, "YXZ")));
        }
        media.cuadro(dt, null);
        if (t > .4 && acciones.some(a => a === "cancelar" || a === "accion" || a === "aceptar" || a === "clic" && M.tactil)) {
          M.tareas.delete(tarea);
          ok();
        }
        return true;
      };
      M.tareas.add(tarea);
    });
    await M.fundir(1, .4);
    if (voz) callarAndrew();
    if (sala) {
      sala.grupo.removeFromParent();
      try {
        sala.dispose?.();
      } catch {}
    }
    M.jugador.position.copy(guardado.pos);
    M.jugador.rotation.copy(guardado.rot);
    M.camara.position.copy(guardado.cpos);
    M.camara.rotation.copy(guardado.crot);
    if (Math.abs(M.camara.fov - guardado.fov) > .01) {
      M.camara.fov = guardado.fov;
      M.camara.updateProjectionMatrix();
    }
    henry.personaje.grupo.visible = api.vista === "3ra";
    if (henry.armaVista) henry.armaVista.montura.visible = true;
    api.ubicarHenry(posHenry(), henry.controlador.m.cuerpo);
    juego.fase = "mundo mz";
    await M.fundir(0, .5);
    return null;
  }
  async function manivela() {
    const n = escena === 13 ? 3 : escena === 23 ? 4 : 0;
    if (!n) return null;
    if (F(716)) {
      await decir([ agua0(45) ]);
      return null;
    }
    const r = await elegir(agua0(16), [ comun(135) || "←", "—", comun(134) || "→" ]);
    const dir = r === 0 ? -1 : r === 2 ? 1 : 0;
    if (!dir) return null;
    T.girar(n, dir);
    await demo(dir > 0 ? 15 : 16);
    api.ubicarHenry(posHenry(), henry.controlador.m.cuerpo);
    if (escena === 23 && !F(728)) {
      const volver = {
        pos: posHenry(),
        rot: henry.controlador.m.cuerpo
      };
      await M.fundir(1, .4);
      callarAndrew();
      await api.irA(1, {
        pos: [ 0, 0, 1780 ]
      });
      await demo(13);
      prender(728);
      await api.irA(23, volver);
      await M.fundir(0, .6);
    }
    return null;
  }
  async function saltar(o) {
    const si = await decir([ agua0(23) ], {
      pregunta: true
    });
    if (!si) return null;
    const abajo = T.bajoAgujero(escena);
    if (!abajo) return null;
    const g = (PD.giros_d010 || []).find(x => x.escena === escena);
    const cont = api.cont;
    const rotAntes = cont.rotation.y;
    cont.rotation.y = g ? g.giro * Math.PI / 4 : 0;
    cont.updateMatrixWorld(true);
    try {
      await demo(10);
    } finally {
      cont.rotation.y = rotAntes;
      cont.updateMatrixWorld(true);
    }
    callarAndrew();
    const b1 = {
      36: 0,
      37: 1,
      38: 2,
      39: 3
    }[abajo];
    await M.fundir(1, .01);
    if (b1 != null) {
      const p = PD.torre.b1_pos[b1];
      await api.irA(abajo, {
        pos: [ p[0], p[1], p[2] ],
        rot: 0
      });
    } else {
      const i = T.info(abajo);
      await api.irA(abajo, {
        porPuerta: i?.c?.puerta
      });
    }
    await M.fundir(0, .6);
    return null;
  }
  async function escalera(o, exec) {
    const grupo = api.objetosEscena(escena).find(x => x.indice === o.i)?.grupo_0x414 ?? 0;
    let destino = null;
    if (exec === "0x4fd6b0") {
      const t = comun(29) || "";
      const ops = [ ...t.matchAll(/ô?([^|]*)ó/g) ].map(m => m[1].trim()).filter(Boolean);
      const r = await elegir(t.split("|")[0], ops.length === 3 ? ops : [ "Subir", "—", "Bajar" ]);
      if (r === 0) destino = PD.escaleras["0x4fd680"][3]; else if (r === 2) destino = PD.escaleras["0x4fd680"][4]; else return null;
    } else {
      const sube = exec === "0x4fd650" || exec === "0x4fd830";
      const si = await decir([ comun(sube ? 27 : 28) ], {
        pregunta: true
      });
      if (!si) return null;
      destino = PD.escaleras[exec]?.[grupo];
    }
    if (!destino) return null;
    await M.fundir(1, 4 / 30);
    api.ubicarHenry([ destino[0], destino[1], destino[2] ], null);
    await M.esperar(.1);
    await M.fundir(0, 4 / 30);
    return null;
  }
  const ESCALERAS_MZ = [ [ 35, 23, 3, 23, 255, 255 ], [ 3, 23, 13, 41, 35, 23 ], [ 13, 41, 23, 24, 3, 23 ], [ 23, 24, 255, 255, 13, 41 ] ];
  async function escaleraTorre(p) {
    const f = ESCALERAS_MZ.find(x => x[0] === escena && x[1] === p.door_no);
    if (!f) return false;
    const sube = f[2] !== 255, baja = f[4] !== 255;
    let r = null;
    if (sube && baja) {
      const t = comun(29) || "";
      const ops = [ ...t.matchAll(/ô?([^|]*)ó/g) ].map(m => m[1].trim()).filter(Boolean);
      const e = await elegir(t.split("|")[0], ops.length === 3 ? ops : [ "Subir", "—", "Bajar" ]);
      r = e === 0 ? "sube" : e === 2 ? "baja" : null;
    } else if (await decir([ comun(sube ? 27 : 28) ], {
      pregunta: true
    })) r = sube ? "sube" : "baja";
    if (!r) return false;
    return r === "sube" ? {
      escena: f[2],
      porPuerta: f[3]
    } : {
      escena: f[4],
      porPuerta: f[5]
    };
  }
  async function panel() {
    if (!T.luz(38)) {
      await decir([ agua0(34) ]);
      return null;
    }
    const B = PD.clave.botones, R = PD.clave.respuesta;
    const g = M.pantalla.g;
    let img = null;
    try {
      const {imagenJuego: imagenJuego} = await (import("../suite_juego.js"));
      img = await imagenJuego("mz38", 7, [ 0, 0, 512, 448 ]);
    } catch {}
    await M.fundir(1, .3);
    M.ponerVelo(0);
    M.pantalla.mostrar();
    juego.hablando = true;
    const X0 = 64, ESCB = 1;
    const etiqueta = i => i < 10 ? String(i) : i === 10 ? "*" : "#";
    const ok = await new Promise(fin => {
      let sel = 5, cifras = [], t = 0, cierre = -1, bien = false;
      const GRILLA = [ [ 7, 8, 9 ], [ 4, 5, 6 ], [ 1, 2, 3 ], [ 10, 0, 11 ] ];
      const donde = b => {
        for (let f = 0; f < 4; f++) {
          const c = GRILLA[f].indexOf(b);
          if (c >= 0) return [ f, c ];
        }
        return [ 0, 0 ];
      };
      const apretar = b => {
        sonar(SON.BOTON);
        if (b === 10 || b === 11) {
          cifras = [];
          return;
        }
        cifras.push(b);
        if (cifras.length === 4) {
          bien = cifras.every((v, i) => v === R[i]);
          sonar(bien ? SON.BIEN : SON.MAL);
          cierre = bien ? .6 : .8;
        }
      };
      const tecla = e => {
        if (/^Digit[0-9]$|^Numpad[0-9]$/.test(e.code) && cierre < 0) {
          const b = +e.code.slice(-1);
          sel = b;
          apretar(b);
        }
      };
      addEventListener("keydown", tecla, true);
      const tarea = (dt, {acciones: acciones}) => {
        t += dt;
        P.limpiar(g);
        if (img) P.imagen(g, img, 1); else {
          g.fillStyle = "#1a1714";
          g.fillRect(0, 0, g.canvas.width, g.canvas.height);
        }
        const k = g.canvas.width / 640;
        for (let i = 0; i < 12; i++) {
          const [x, y, w, h] = B[i];
          const cx = (X0 + x * ESCB) * k, cy = y * k * (g.canvas.height / k / 448);
          g.strokeStyle = i === sel ? "#ffffff" : "rgba(255,255,255,0.25)";
          g.lineWidth = i === sel ? 3 : 1;
          g.strokeRect(cx - 2, cy - 2, (w + 4) * k, (h + 4) * k);
          if (!img) juego.fuente.escribir(g, etiqueta(i), X0 + x + w / 2, y + 2, {
            escala: P.ESC,
            alinear: "centro",
            color: "#d8cfc0"
          });
        }
        juego.fuente.escribir(g, cifras.map(String).join(" ").padEnd(7, " ") + "", 320, 120, {
          escala: P.ESC * 1.4,
          alinear: "centro",
          color: "#e0d6c6"
        });
        M.pantalla.actualizar();
        if (cierre >= 0) {
          cierre -= dt;
          if (cierre <= 0) {
            M.tareas.delete(tarea);
            removeEventListener("keydown", tecla, true);
            fin(bien);
          }
          return true;
        }
        for (const a of acciones) {
          const [f, c] = donde(sel);
          if (a === "arriba") sel = GRILLA[Math.max(0, f - 1)][c];
          if (a === "abajo") sel = GRILLA[Math.min(3, f + 1)][c];
          if (a === "izq") sel = GRILLA[f][Math.max(0, c - 1)];
          if (a === "der") sel = GRILLA[f][Math.min(2, c + 1)];
          if (t > .3 && (a === "aceptar" || a === "accion" || a === "clic")) apretar(sel);
          if (t > .3 && a === "cancelar") {
            M.tareas.delete(tarea);
            removeEventListener("keydown", tecla, true);
            fin(false);
            return true;
          }
        }
        return true;
      };
      M.tareas.add(tarea);
    });
    juego.hablando = false;
    M.ponerVelo(1);
    M.pantalla.ocultar();
    if (!ok) {
      apagar(716);
      await M.fundir(0, .4);
      return null;
    }
    prender(716);
    await api.irA(39, {
      porPuerta: 12
    });
    await M.fundir(0, .6);
    return null;
  }
  const cerraduraDe = door => (PD?.cerraduras || []).find(c => c.door === door) || null;
  async function cerradura(c, p) {
    const sonido = t => {
      try {
        api.amb?.puerta?.(p, t);
      } catch {}
    };
    switch (c.tipo) {
     case 5:
      return c.condiciones.every(([b, v]) => !b || (F(b) ? 1 : 0) === v);

     case 0:
     case 1:
     case 2:
      {
        if (F(c.bandera)) return true;
        if (c.escena === escena) {
          if (c.tipo === 0) {
            prender(c.bandera);
            sonido(3);
            await guion(PD.guiones[c.guiones[0]]);
            return false;
          }
          if (c.item && cuantos(c.item)) {
            sonido(3);
            await guion(PD.guiones[c.guiones[2]]);
            if (c.tipo === 1) henry.inventario?.quitar(c.item);
            prender(c.bandera);
            return false;
          }
          sonido(4);
          await guion(PD.guiones[c.guiones[0]]);
          return false;
        }
        sonido(4);
        await guion(PD.guiones[c.guiones[1]]);
        return false;
      }

     case 3:
     case 4:
      sonido(c.tipo === 3 ? 2 : 4);
      await guion(PD.guiones[c.guiones[0]]);
      return false;

     case 6:
      if (F(c.bandera)) return true;
      sonido(4);
      await guion(PD.guiones[c.guiones[0]]);
      return false;
    }
    return true;
  }
  function botonA() {
    const s = M.renderer?.xr?.getSession?.();
    if (!s) return false;
    let a = false;
    for (const src of s.inputSources) if (src.handedness === "right" && src.gamepad?.buttons[4]?.pressed) a = true;
    const r = a && !aAntes;
    aAntes = a;
    return r;
  }
  const tareaAccion = (dt, {acciones: acciones, teclas: teclas}) => {
    if (!activo || juego.demoActual || juego.hablando || henry.inventario?.abierto) return;
    const vr = M.enVR();
    const manos = vr && [ ...M.renderer?.xr?.getSession?.()?.inputSources || [] ].some(s => s.hand);
    for (const a of acciones) {
      if (vr) {
        if (a === "accion" && manos) accionPendiente = true;
        continue;
      }
      if (a === "accion" || a === "aceptar" && !teclas.Space || a === "clic" && M.tactil) accionPendiente = true;
    }
    if (vr && botonA()) accionPendiente = true;
  };
  let sonRueda = null;
  function ruedaDeLaSala(n) {
    try {
      sonRueda?.parar?.(.3);
    } catch {}
    sonRueda = null;
    if (!T || !T.rueda()) return;
    if (n === 32) sonRueda = sonar(SON.RUEDA, [ 0, 0, 1600 ], {
      loop: true,
      volumen: 1
    });
    if (n === 41 || n === 42) sonRueda = sonar(SON.EJE, [ 1440, 0, 1440 ], {
      loop: true,
      volumen: 1
    });
  }
  return {
    torre: () => T,
    inicio() {
      if (!F(701)) return {
        ...LLEGADA
      };
      const s = api.PARTIDA.salidaMundo?.mz;
      if (s) return {
        escena: s.escena,
        pos: s.pos,
        rot: s.rot
      };
      const fila = (PD?.agujeros || []).find(f => f.etapa === 4 && F(f.bandera));
      return fila ? {
        escena: fila.escena,
        pos: fila.pos,
        rot: fila.rot
      } : null;
    },
    async alCargarEscena(n) {
      await datos();
      if (!T && PD.torre) T = crearTorre(PD.torre, giros, F);
      escena = n;
      accionPendiente = false;
      activo = true;
      if (!M.tareas.has(tareaAccion)) M.tareas.add(tareaAccion);
      callarAndrew();
      guardia.encender(false);
      aguaDeLaSala(n);
      ruedaDeLaSala(n);
      cañosDeLaSala(n);
      await lucesDeLaCelda(n);
    },
    cuadro(dt) {
      const pj = posHenry();
      const hay = media.cuadro(dt, pj);
      guardia.cuadro(dt);
      if (!F(741) && cuantos(ITEM.LLAVE_ARRIBA)) prender(741);
      accionPendiente = false;
      return hay;
    },
    maneja(ev) {
      if (!ev) return false;
      if (ev.evnum === 32) return !F(728);
      return /^0x4ea550/.test(ev.trgchk || "") || /^0x4e8ce0|^0x4e8520|^0x4eb660|^0x4eb6b0|^0x4e9810/.test(ev.init || "") || /^0x4fd6[5-9b]|^0x4fd8[36]/.test(ev.exec || "") || /^0x4e84c0/.test(ev.end || "");
    },
    llamada: llamada,
    estado() {
      const b = [ 701, 702, 703, 707, 711, 716, 718, 722, 723, 724, 725, 726, 727, 728, 734, 735, 737, 738, 739, 741, 1610, 2119, 2130 ].filter(n => F(n));
      return {
        escena: escena,
        giros: [ ...giros ],
        banderas: b,
        rueda: T?.rueda() ?? null,
        luz: T ? T.luz(escena) : null,
        voz: !!media.actual,
        vozAdx: media.actual?.voz?.adx ?? null,
        vozK: media.actual?.voz ? +media.actual.voz.k.toFixed(2) : null,
        guardia: guardia.on,
        llave: cuantos(ITEM.LLAVE_ARRIBA),
        placa: cuantos(ITEM.PLACA),
        celdas: T ? [ 2, 3, 4 ].map(p => Array.from({
          length: 8
        }, (_, i) => T.celda(p, i)?.escena)) : null
      };
    },
    alDemo(si) {
      media.grupo.visible = !si;
      if (si) guardia.encender(false);
    },
    alSalir() {
      activo = false;
      media.liberar();
      guardia.encender(false);
      M.tareas.delete(tareaAccion);
      for (const h of sonidosAgua.splice(0)) {
        try {
          h?.parar?.(.3);
        } catch {}
      }
      try {
        sonRueda?.parar?.(.3);
      } catch {}
    },
    extras: [],
    async ejecutar(o) {
      if (o.prision) return undefined;
      const ev = o.ev || {};
      const ini = (ev.init || "").slice(0, 8), exe = (ev.exec || "").slice(0, 8), trg = (ev.trgchk || "").slice(0, 8), fin = (ev.end || "").slice(0, 8);
      if (exe === "0x4d1bf0") {
        return agujeroDeVuelta({
          api: api,
          etapa: "mz",
          num: 4,
          agujeros: PD.agujeros || [],
          escena: escena,
          pos: posHenry(),
          rot: henry.controlador.m.cuerpo,
          antes: () => callarAndrew()
        });
      }
      if (ev.evnum === 32) {
        if (!F(728)) vozAndrew();
        return null;
      }
      if (trg === "0x4ea550") {
        if (T && !T.luz(escena)) {
          guardia.encender(true);
          prender(724);
        }
        return null;
      }
      if (ini === "0x4e8ce0") return espiar(o);
      if (ini === "0x4e8520" || trg === "0x4eb700") return manivela();
      if (fin === "0x4e84c0") return saltar(o);
      if (/^0x4fd6[5-9b]|^0x4fd8[36]/.test(exe)) return escalera(o, exe);
      if (ini === "0x4eb660") {
        await guion(PD.guiones[T?.rueda() ? "generador_si" : "generador_no"]);
        return null;
      }
      if (ini === "0x4eb6b0") {
        await guion(PD.guiones[T?.rueda() ? "transformador_si" : "transformador_no"]);
        return null;
      }
      if (ev.evnum === 225 || ini === "0x4e9810") return panel();
      if (ev.evnum === 224) {
        if (!await guion(ev.guion)) return null;
        await demo(67);
        prender(734);
        terminar(ev);
        return null;
      }
      if (ev.evnum === 33) {
        const r = await demo(32);
        terminar(ev);
        prender(2119);
        return r?.volver302 ? r : null;
      }
      if (ev.evnum === 105) {
        prender(1610);
        return undefined;
      }
      return undefined;
    },
    async destinoPuerta(p) {
      if (/^0x4fd150/.test(p.funcion_paso || "")) return escaleraTorre(p);
      if (!T || !/^0x4fce20/.test(p.funcion_paso || "")) return null;
      const pasillo = {
        1: 2,
        11: 3,
        21: 4
      }[escena];
      if (pasillo) {
        const d = T.posDePuerta(p.door_no);
        if (!d) return null;
        const c = T.celda(d.n, d.pos);
        if (!c?.escena) return null;
        if (c.trabada) {
          try {
            api.amb?.puerta?.(p, 2);
          } catch {}
          await guion(PD.guiones["0x629b00"] || [ {
            msg: 15,
            archivo: 7
          } ]);
          return false;
        }
        return {
          escena: c.escena,
          porPuerta: c.puerta
        };
      }
      const i = T.info(escena);
      if (!i) return null;
      if (i.c.trabada) {
        try {
          api.amb?.puerta?.(p, 2);
        } catch {}
        await guion([ {
          msg: 15,
          archivo: 7
        } ]);
        return false;
      }
      return {
        escena: {
          2: 1,
          3: 11,
          4: 21
        }[i.n],
        porPuerta: T.puertaDePos(i.n, i.pos)
      };
    },
    async antesDePuerta(p) {
      const c = cerraduraDe(p.door_no);
      return !c || await cerradura(c, p);
    }
  };
}
