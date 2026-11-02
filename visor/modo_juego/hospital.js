// SH4 web — FeniXVOID · Project Ravenlight
import { crearGuion, agujeroDeVuelta } from "./guion_comun.js";

import { json, q } from "./motor.js";

import { partesBin } from "../lib/sh4bin.js";

import { leerModelo } from "../lib/modelo.js";

import { leerTexturas } from "../lib/texturas.js";

import { leerAnimacion } from "../lib/animacion.js";

import { crearPersonaje } from "../lib/personaje.js";

const FPS = 30;

const distXZ = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);

const ETAPA_DE_NUMERO = {
  1: "rl",
  2: "sb",
  3: "fr",
  4: "mz",
  5: "bd",
  6: "ie",
  7: "hs",
  8: "cm",
  9: "ls",
  10: "gt",
  11: "st"
};

const SON = {
  ITEM: 40006,
  BOTON: 50204
};

let HD = null;

async function datos() {
  if (!HD || HD._vacio) HD = await json("./hospital_datos.json") || HD || {
    _vacio: true,
    fin: {},
    agujeros: [],
    cerraduras: [],
    guiones: {},
    salida: {
      tabla: []
    }
  };
  return HD;
}

datos();

export const HOSPITAL = {
  etapa: "hs",
  nombre: {
    s: "Mundo del Hospital",
    e: "Hospital World"
  },
  inicio: {
    escena: 1
  },
  mitad: 1,
  terminado: 0,
  banderasAlLlegar: [],
  banderasAtajo: [ 1301 ],
  despues: {},
  demoAlAzar: {},
  molinetes: [],
  sinHacer: [],
  fin: null,
  variantes: [],
  puertas: {},
  excluir: o => o.zona?.dmy1 === 6,
  crear: api => crearHospital(api)
};

export const ESCALERA = {
  etapa: "st",
  nombre: {
    s: "Escalera en espiral",
    e: "Spiral Staircase"
  },
  inicio: {
    escena: 1
  },
  mitad: 1,
  terminado: 0,
  banderasAlLlegar: [],
  banderasAtajo: [],
  despues: {},
  demoAlAzar: {},
  molinetes: [],
  sinHacer: [],
  fin: null,
  variantes: [],
  puertas: {},
  crear: api => crearEscalera(api)
};

function utilidades(api) {
  const {THREE: THREE, M: M, juego: juego, henry: henry, F: F, prender: prender, decir: decir} = api;
  const E = .005;
  const aMundo = p => new THREE.Vector3(-p[0] * E, -p[1] * E, p[2] * E);
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
  const parar = (h, t = .3) => {
    try {
      h?.parar?.(t);
    } catch {}
  };
  const comun = n => juego.textoComun?.(n) || "";
  let ultimaEleccion = 0;
  let guionComun = null;
  function guion(cmds, o) {
    guionComun ||= crearGuion({
      decir: decir,
      texto: (a, n) => api.texto(a, n),
      comun: comun,
      darItem: k => henry.agregarItem(k, 1),
      siNo: "conSigno",
      llamada: f => {
        const d = String(f).slice(0, 8);
        if (d === "0x50abe0" || d === "0x50ac00") sonar(SON.ITEM);
      },
      alElegir: v => {
        ultimaEleccion = v;
      }
    });
    return guionComun(cmds, o);
  }
  const finDe = ev => HD?.fin?.etapa7?.[String(ev?.evnum ?? ev)] || HD?.fin?.comun?.[String(ev?.evnum ?? ev)] || null;
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
  const demo = n => api.ejecutar({
    i: -1,
    hospital: true,
    ev: {
      evnum: 0,
      demo: n,
      cond: "siempre"
    }
  });
  const bins = new Map;
  const bin = a => {
    if (!bins.has(a)) bins.set(a, api.bajar("data/" + a).then(b => ({
      b: b,
      p: partesBin(b)
    })));
    return bins.get(a);
  };
  async function modelo(arch, pm, pt, pan = null, archAnim = null) {
    const m = await bin(arch), Mp = m.p.find(x => x.indice === pm), T = m.p.find(x => x.indice === pt);
    const pj = crearPersonaje(leerModelo(m.b, Mp.ofs, Mp.len), T?.tipo === "texturas" ? leerTexturas(m.b, T.ofs, T.len) : []);
    if (pan != null) {
      const ma = archAnim ? await bin(archAnim) : m, A = ma.p.find(x => x.indice === pan);
      if (A?.tipo === "animacion") {
        pj.poner(leerAnimacion(ma.b, A.ofs, A.len));
        pj.reproductor.loop = true;
      }
    }
    return pj;
  }
  const eileenCerca = () => !!api.eileenConHenry?.();
  function cambioDeEtapa(f, haciaEscalera) {
    for (const b of f.banderas || []) prender(b);
    if (haciaEscalera) return {
      aEtapa: "st",
      escena: f.a_escena,
      pos: f.pos,
      rot: f.rot
    };
    return {
      aEtapa: ETAPA_DE_NUMERO[f.etapa],
      escena: f.escena,
      pos: f.mundo_pos,
      rot: f.mundo_rot
    };
  }
  return {
    E: E,
    aMundo: aMundo,
    apagar: apagar,
    posHenry: posHenry,
    cuantos: cuantos,
    sonar: sonar,
    parar: parar,
    comun: comun,
    guion: guion,
    get ultimaEleccion() {
      return ultimaEleccion;
    },
    finDe: finDe,
    banderaDe: banderaDe,
    terminar: terminar,
    demo: demo,
    modelo: modelo,
    eileenCerca: eileenCerca,
    cambioDeEtapa: cambioDeEtapa
  };
}

function crearHospital(api) {
  const {THREE: THREE, M: M, juego: juego, henry: henry, F: F, prender: prender, decir: decir} = api;
  const U = utilidades(api);
  const {E: E, aMundo: aMundo, posHenry: posHenry, cuantos: cuantos, sonar: sonar, parar: parar, comun: comun, guion: guion, terminar: terminar, demo: demo, modelo: modelo} = U;
  let escena = 0, activo = false;
  const salaGrupo = () => api.cont.children.find(c => /^sala_/.test(c.name || "")) || null;
  const parteSala = k => salaGrupo()?.getObjectByName("mundo_" + k) || null;
  const _q = new THREE.Quaternion;
  const quatJuego = qj => _q.set(-qj[0], -qj[1], qj[2], qj[3]).normalize();
  let camFija = null;
  function ponerCamara(c) {
    camFija = c ? {
      pos: c.pos,
      mira: c.mira,
      angulo: c.fov || null,
      fija: true
    } : null;
  }
  let paredes = [];
  function sacarParedes() {
    for (const p of paredes) {
      p.removeFromParent();
      p.geometry.dispose();
    }
    paredes = [];
  }
  function pared(geo, nombre) {
    const col = api.colision;
    if (!col) return null;
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({
      visible: false,
      side: THREE.DoubleSide
    }));
    m.name = nombre;
    col.add(m);
    m.updateMatrixWorld(true);
    paredes.push(m);
    return m;
  }
  const cama = (() => {
    let pj = null, vuelta = 0;
    async function entrar() {
      const yo = ++vuelta;
      quitar();
      vuelta = yo;
      if (F(1310)) return;
      try {
        const C = HD?.eileen_cama || {
          pos: [ 210, 71, 94 ]
        };
        const p = await modelo("eil.bin", 1, 0, 5, "hs10.bin");
        if (yo !== vuelta || escena !== 10) {
          p.dispose?.();
          return;
        }
        p.ubicar(C.pos[0], C.pos[1], C.pos[2], 0);
        p.grupo.name = "Eileen en la cama (hs10)";
        api.cont.add(p.grupo);
        pj = p;
      } catch (e) {
        console.warn("Eileen en la cama", e.message);
      }
    }
    function cuadro(dt) {
      if (!pj) return;
      if (F(1310)) {
        quitar();
        return;
      }
      pj.actualizar?.(dt);
    }
    function quitar() {
      if (pj) {
        pj.grupo.removeFromParent();
        pj.dispose?.();
        pj = null;
      }
    }
    return {
      entrar: entrar,
      cuadro: cuadro,
      quitar: quitar,
      get pj() {
        return pj;
      }
    };
  })();
  function fotoHs09() {
    const g = parteSala(6), T = HD?.foto_hs09;
    if (!g || !T) return;
    const k = F(T.bandera) ? 1 : 0;
    g.position.copy(aMundo(T.pos[k]));
    g.quaternion.copy(quatJuego(T.quat[k]));
  }
  let paredAscensor = null;
  function puertaAscensor() {
    const T = HD?.puerta_ascensor_hs04;
    if (!T) return;
    const abierta = F(T.bandera);
    const g = parteSala(5);
    if (g) g.visible = !abierta;
    if (!abierta && !paredAscensor) {
      const P = T.pared, ancho = (P.x[1] - P.x[0]) * E, alto = (P.y[1] - P.y[0]) * E;
      const geo = new THREE.PlaneGeometry(ancho, alto);
      paredAscensor = pared(geo, "pared de la puerta del ascensor (0x625cf0)");
      if (paredAscensor) {
        paredAscensor.position.copy(aMundo([ (P.x[0] + P.x[1]) / 2, (P.y[0] + P.y[1]) / 2, P.z ]));
        paredAscensor.updateMatrixWorld(true);
      }
    } else if (abierta && paredAscensor) {
      paredAscensor.removeFromParent();
      paredes = paredes.filter(x => x !== paredAscensor);
      paredAscensor = null;
    }
  }
  const techo = (() => {
    let paso = 0, y = 0, vel = 0, t = 0, h = null, alterna = false;
    function entrar() {
      const T = HD?.techo_hs13;
      paso = 0;
      parar(h);
      h = null;
      if (!T) return;
      y = T.inicio[1];
      if (!F(T.bandera)) {
        prender(T.bandera);
        paso = 1;
        t = 0;
      }
      ubicar();
    }
    function ubicar() {
      const g = parteSala(5), T = HD?.techo_hs13;
      if (g && T) g.position.copy(aMundo([ T.inicio[0], y, T.inicio[2] ]));
    }
    function cuadro(dt) {
      const T = HD?.techo_hs13;
      if (!T || !paso) return;
      if (paso === 1) {
        t += dt;
        if (t >= 1) {
          paso = 2;
          vel = 0;
        }
      } else if (paso === 2) {
        vel += T.aceleracion * dt;
        y += vel * dt;
        if (y > T.fin_y) {
          y = T.fin_y;
          paso = 3;
          t = 0;
          sonar(T.sonidos.golpe);
        }
      } else if (paso === 3) {
        t += dt;
        if (t >= 1) {
          paso = 4;
          h = sonar(T.sonidos.sube, null, {
            loop: true
          });
        }
      } else if (paso === 4) {
        y -= T.sube * dt;
        if (y < T.inicio[1]) {
          y = T.inicio[1];
          paso = 0;
          parar(h);
          h = null;
        }
      }
      ubicar();
      if (paso) {
        let mira = T.camara.mira;
        if (paso === 3) {
          alterna = !alterna;
          mira = [ mira[0], mira[1] + (1 - t) * (alterna ? -1 : 1) * 50, mira[2] ];
        }
        ponerCamara({
          ...T.camara,
          mira: mira
        });
      } else ponerCamara(null);
    }
    function salir() {
      paso = 0;
      parar(h);
      h = null;
      ponerCamara(null);
    }
    return {
      entrar: entrar,
      cuadro: cuadro,
      salir: salir,
      get paso() {
        return paso;
      }
    };
  })();
  const jaula = (() => {
    let paso = 0, y = 0, vel = 0, t = 0, h = null, alterna = false, cilindro = null;
    const T = () => HD?.jaula_hs14;
    function entrar() {
      sacarCilindro();
      paso = 0;
      parar(h);
      h = null;
      const J = T();
      if (!J) return;
      if (F(J.banderas.cayo)) {
        y = J.fin_y;
        paso = 4;
        ponerCilindro();
      } else y = J.inicio[1];
      ubicar();
    }
    function ubicar() {
      const g = parteSala(5), J = T();
      if (g && J) g.position.copy(aMundo([ J.inicio[0], y, J.inicio[2] ]));
    }
    function caer() {
      const J = T();
      if (!J || paso) return;
      prender(J.banderas.cayo);
      paso = 2;
      vel = 0;
      h = sonar(J.sonidos.cae, null, {
        loop: true
      });
    }
    function ponerCilindro() {
      const J = T();
      if (cilindro || !J) return;
      const geo = new THREE.CylinderGeometry(J.radio * E, J.radio * E, J.alto * E, J.segmentos, 1, true);
      cilindro = pared(geo, "pared de la jaula (FUN_004e3640)");
      if (cilindro) {
        cilindro.position.copy(aMundo([ J.inicio[0], -J.alto / 2, J.inicio[2] ]));
        cilindro.updateMatrixWorld(true);
      }
    }
    function sacarCilindro() {
      if (cilindro) {
        cilindro.removeFromParent();
        paredes = paredes.filter(x => x !== cilindro);
        cilindro = null;
      }
    }
    function cuadro(dt) {
      const J = T();
      if (!J || !paso || paso === 4) return;
      if (paso === 2) {
        vel += J.aceleracion * dt;
        y += vel * dt;
        if (y > J.fin_y) {
          y = J.fin_y;
          paso = 3;
          t = 0;
          parar(h, .05);
          h = null;
          sonar(J.sonidos.golpe);
          ponerCilindro();
        }
      } else if (paso === 3) {
        t += dt;
        if (t >= 1) {
          paso = 4;
          ponerCamara(null);
        }
      }
      ubicar();
      if (paso === 2 || paso === 3) {
        let mira = J.camara.mira;
        if (paso === 3) {
          alterna = !alterna;
          mira = [ mira[0], mira[1] + (1 - t) * (alterna ? -1 : 1) * 50, mira[2] ];
        }
        ponerCamara({
          ...J.camara,
          mira: mira
        });
      }
    }
    const adentro = () => {
      const J = T();
      return J && distXZ(posHenry(), J.inicio) < J.radio;
    };
    async function puerta() {
      const J = T();
      if (!J || !F(J.banderas.cayo)) return null;
      if (!F(J.banderas.abierta)) {
        if (cuantos(79)) {
          sonar(J.sonidos.llave);
          await guion(HD.guiones.jaula_llave);
          prender(J.banderas.abierta);
        } else {
          sonar(J.sonidos.cerrada);
          await guion(HD.guiones.jaula_cerrada);
        }
        return null;
      }
      const lado = adentro() ? 0 : 1, P = J.paso[lado];
      await M.fundir(1, 8 / FPS);
      sonar(J.sonidos.paso);
      api.ubicarHenry(P.pos, P.rot);
      await M.esperar(.2);
      await M.fundir(0, 8 / FPS);
      return null;
    }
    function salir() {
      parar(h);
      h = null;
      if (paso === 2 || paso === 3) {
        paso = 4;
        y = T()?.fin_y ?? y;
      }
      ponerCamara(null);
      cilindro = null;
    }
    return {
      entrar: entrar,
      cuadro: cuadro,
      caer: caer,
      puerta: puerta,
      salir: salir,
      get paso() {
        return paso;
      }
    };
  })();
  const hs20 = (() => {
    let ojos = [], h = null, vuelta = 0;
    async function entrar() {
      const yo = ++vuelta;
      quitar();
      vuelta = yo;
      const O = HD?.ojos_hs20, P = HD?.peluca_hs20;
      if (!O || !P) return;
      try {
        for (const o of api.objetosEscena(20).filter(x => x.cnst === "0x4e2d40" && x.pos)) {
          const pj = await modelo(O.modelo[0], O.modelo[1], O.modelo[2]);
          const sombra = await modelo(O.modelo[0], O.modelo[1], O.modelo[2]);
          if (yo !== vuelta || escena !== 20) {
            pj.dispose?.();
            sombra.dispose?.();
            return;
          }
          pj.ubicar(o.pos[0], o.pos[1], o.pos[2], 0);
          pj.grupo.name = "ojo de Eileen (hs20)";
          sombra.ubicar(o.pos[0], o.pos[1], o.pos[2], 0);
          sombra.grupo.name = "ojo de Eileen (hs20, sombra)";
          sombra.grupo.scale.setScalar(O.escala);
          sombra.grupo.traverse(m => {
            if (m.material) {
              m.material.transparent = true;
              m.material.opacity = .5;
              m.material.alphaTest = 0;
              m.material.depthWrite = false;
              m.renderOrder = 1;
            }
          });
          api.cont.add(pj.grupo, sombra.grupo);
          ojos.push({
            pj: pj,
            sombra: sombra,
            pos: o.pos,
            ancho: .2,
            eje: ejeIris(pj)
          });
        }
        const g = parteSala(8);
        if (g) g.position.copy(aMundo(P.pos));
        h = sonar(P.sonido, P.pos_sonido, {
          loop: true,
          radio: P.radio
        });
      } catch (e) {
        console.warn("hs20", e.message);
      }
    }
    const _e = new THREE.Euler(0, 0, 0, "XYZ"), _d = new THREE.Vector3, _q = new THREE.Quaternion;
    const _qJuego = (new THREE.Quaternion).setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI);
    function ejeIris(pj) {
      const g = pj.mallas[0]?.geometry;
      if (!g) return new THREE.Vector3(1, 0, 0);
      const p = g.attributes.position, uv = g.attributes.uv, medio = new THREE.Vector3, pupila = new THREE.Vector3;
      let n = 0;
      for (let i = 0; i < p.count; i++) {
        medio.x += p.getX(i);
        medio.y += p.getY(i);
        medio.z += p.getZ(i);
        if (Math.hypot(uv.getX(i) - .5, uv.getY(i) - .5) < .12) {
          pupila.x += p.getX(i);
          pupila.y += p.getY(i);
          pupila.z += p.getZ(i);
          n++;
        }
      }
      if (!n) return new THREE.Vector3(1, 0, 0);
      const eje = pupila.divideScalar(n).sub(medio.divideScalar(p.count)).normalize();
      return eje.applyQuaternion(_qJuego);
    }
    function cuadro() {
      if (!ojos.length) return;
      const ph = posHenry(), alto = HD?.ojos_hs20?.alto ?? 165;
      for (const o of ojos) {
        _d.set(o.pos[0] - ph[0], o.pos[1] - (ph[1] - alto), ph[2] - o.pos[2]).normalize();
        o.ancho = (Math.random() * 4 | 0) === 0 ? .2 + Math.random() * .6 : o.ancho;
        const j = () => Math.random() * o.ancho - o.ancho * .5;
        _d.applyEuler(_e.set(j(), j(), 0));
        _q.setFromUnitVectors(o.eje, _d);
        const delante = o.pj.grupo.children[0];
        if (delante) {
          o.sombra.grupo.children[0]?.quaternion.copy(delante.quaternion);
          delante.quaternion.copy(_q).multiply(_qJuego);
        }
      }
    }
    function quitar() {
      for (const o of ojos) for (const p of [ o.pj, o.sombra ]) {
        p.grupo.removeFromParent();
        p.dispose?.();
      }
      ojos = [];
      parar(h);
      h = null;
    }
    return {
      entrar: entrar,
      cuadro: cuadro,
      quitar: quitar
    };
  })();
  const cadaver = (() => {
    let fase = 0;
    function cuadro(dt) {
      const C = HD?.cadaver_hs28, g = parteSala(5);
      if (!C || !g) return;
      fase += C.velocidad * dt * FPS;
      if (fase > 1) fase -= 1;
      const a = (fase * 360 - 180) * Math.PI / 180, s = Math.sin(a) * C.amplitud, c = Math.cos(a) * C.amplitud;
      g.position.copy(aMundo(C.pos));
      g.rotation.set(-Math.atan2(c * .5, 400), 0, Math.atan2(s * .5, 400));
    }
    return {
      cuadro: cuadro
    };
  })();
  const cerraduraDe = door => (HD?.cerraduras || []).find(c => c.door === door) || null;
  async function cerradura(c, p) {
    const sonido = t => {
      try {
        api.amb?.puerta?.(p, t);
      } catch {}
    };
    const G = HD.guiones;
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
            await guion(G[c.guiones[0]]);
            return false;
          }
          if (c.item && cuantos(c.item)) {
            sonido(3);
            await guion(G[c.guiones[2]]);
            if (c.tipo === 1) henry.inventario?.quitar(c.item);
            prender(c.bandera);
            if (c.door === 34) terminar(170);
            return false;
          }
          sonido(4);
          await guion(G[c.guiones[0]]);
          return false;
        }
        sonido(4);
        await guion(G[c.guiones[1]]);
        return false;
      }

     case 3:
     case 4:
      sonido(c.tipo === 3 ? 2 : 4);
      await guion(G[c.guiones[0]]);
      return false;

     case 6:
      if (F(c.bandera)) return true;
      sonido(4);
      await guion(G[c.guiones[0]]);
      return false;
    }
    return true;
  }
  async function agujero() {
    const G = HD.guiones;
    if (F(1310) && !F(1311)) {
      if (!U.eileenCerca()) {
        await guion(G.sin_eileen);
        return null;
      }
      if (!await guion(G.agujero_163)) return null;
      await demo(43);
      api.dejarEileen?.();
      terminar(163);
      return vueltaAl302();
    }
    if (!await guion(G.agujero_302)) return null;
    api.dejarEileen?.();
    return vueltaAl302();
  }
  function vueltaAl302() {
    const fila = (HD?.agujeros || []).find(f => f.etapa === 7 && f.escena === escena) || (HD?.agujeros || [])[0];
    (api.PARTIDA.salidaMundo ||= {}).hs = fila ? {
      escena: fila.escena,
      pos: fila.pos,
      rot: fila.rot
    } : {
      escena: escena,
      pos: posHenry(),
      rot: henry.controlador.m.cuerpo
    };
    const dias = juego.dias302?.agujeroDelMundo?.({
      etapa: "hs",
      escena: escena
    });
    if (!dias && fila) {
      prender(fila.bandera);
      prender(fila.bandera2);
    }
    return {
      ...dias || {
        volver302: true,
        escena302: 2
      },
      porAgujero: true
    };
  }
  async function ejecutarPropio(o) {
    const ev = o.ev || {};
    const ini = (ev.init || "").slice(0, 8), exe = (ev.exec || "").slice(0, 8);
    if (ev.evnum === 155) {
      await demo(40);
      terminar(155);
      const L = HD?.llegada?.despues || {
        escena: 4,
        porPuerta: 1
      };
      M.ponerVelo(1);
      await api.irA(L.escena, {
        porPuerta: L.porPuerta
      });
      await M.fundir(0, .8);
      return null;
    }
    if (ev.evnum === 2290) {
      await demo(38);
      terminar(2290);
      const D = HD?.d038 || {
        henry: [ -233, 0, 1930 ],
        rot: -.89
      };
      api.ubicarHenry(D.henry, D.rot);
      return null;
    }
    if (ev.evnum === 44) {
      await demo(42);
      terminar(44);
      prender(1302);
      cama.quitar();
      const P = HD?.eileen_hs10 || {
        pos: [ 238.577, 0, -216.183 ],
        rot: 0
      };
      await (api.ponerEileen?.({
        pos: P.pos,
        rot: P.rot
      }));
      return null;
    }
    if (ev.evnum === 45) {
      await demo(44);
      terminar(45);
      if (!api.eileen?.actual) {
        const p = posHenry(), r = henry.controlador.m.cuerpo;
        await (api.ponerEileen?.({
          pos: [ p[0] - Math.sin(r) * 150, p[1], p[2] - Math.cos(r) * 150 ],
          rot: r
        }));
      }
      api.eileenConmigo?.();
      return null;
    }
    if (exe === "0x4e2bc0") return agujero();
    if (escena === 14 && o.item === 79) {
      if (!await guion(ev.guion?.filter(c => c.item == null) || [])) return null;
      api.darItem?.(79, o);
      jaula.caer();
      return null;
    }
    if (escena === 14 && (exe === "0x4e3a90" || ini === "0x4e3bf0" || ini === "0x4e0ba0")) return jaula.puerta();
    if (ev.evnum === 3077 && exe === "0x4e4500") {
      if (!await guion(HD.guiones.boton_ascensor)) return null;
      const B = HD?.boton_ascensor || {
        sonido: SON.BOTON,
        espera: 1.8
      };
      sonar(B.sonido);
      await M.esperar(B.espera);
      terminar(3077);
      return null;
    }
    if (exe === "0x4cd570") {
      const v = +(o.ev.val?.[0] || 0);
      if (v) prender(v);
      return null;
    }
    if (ini === "0x4cde20") {
      if (!U.eileenCerca()) {
        await guion(HD.guiones.sin_eileen);
        return null;
      }
      api.eileenConmigo?.();
      const f = (HD?.salida?.tabla || []).find(x => x.etapa === 7 && x.escena === escena);
      if (!f) return null;
      return U.cambioDeEtapa(f, true);
    }
    return undefined;
  }
  function lloverHs11() {
    const fx = api.amb?.fx;
    if (!fx) return;
    const o = api.objetosEscena(11).find(x => x.cnst === "0x4e47a0" && x.pos);
    for (let k = 0; k < 8; k++) {
      try {
        fx.disparar("lluvia", {
          pos: o?.pos || [ 0, -650, 0 ],
          piso: -1
        });
      } catch (e) {
        console.warn("lluvia hs11", e.message);
      }
    }
  }
  return {
    cama: cama,
    jaula: jaula,
    techo: techo,
    hs20: hs20,
    inicio() {
      if (!F(1301)) return {
        escena: 1
      };
      const c = juego.dias302?.checkpoint?.();
      if (c?.etapa === "hs") return {
        escena: c.escena,
        pos: c.pos,
        rot: c.rot
      };
      const s = api.PARTIDA.salidaMundo?.hs;
      if (s) return {
        escena: s.escena,
        pos: s.pos,
        rot: s.rot
      };
      const f = (HD?.agujeros || [])[0];
      return f ? {
        escena: f.escena,
        pos: f.pos,
        rot: f.rot
      } : null;
    },
    async alCargarEscena(n) {
      await datos();
      cama.quitar();
      hs20.quitar();
      techo.salir();
      jaula.salir();
      sacarParedes();
      paredAscensor = null;
      ponerCamara(null);
      escena = n;
      activo = true;
      if (n === 10) await cama.entrar();
      if (n === 9) fotoHs09();
      if (n === 4) puertaAscensor();
      if (n === 13) techo.entrar();
      if (n === 14) jaula.entrar();
      if (n === 20) await hs20.entrar();
      if (n === 11) lloverHs11();
      if (q.has("eileen") && !api.eileen?.actual && !api.PARTIDA.eileen?.estado) {
        const p = posHenry(), r = henry.controlador.m.cuerpo;
        await (api.ponerEileen?.({
          pos: [ p[0] - Math.sin(r) * 120, p[1], p[2] - Math.cos(r) * 120 ],
          rot: r
        }));
      }
    },
    cuadro(dt) {
      if (!activo || api.escena !== escena) return false;
      cama.cuadro(dt);
      if (escena === 4) puertaAscensor();
      if (escena === 9) fotoHs09();
      if (escena === 13) techo.cuadro(dt);
      if (escena === 14) jaula.cuadro(dt);
      if (escena === 20) hs20.cuadro();
      if (escena === 28) cadaver.cuadro(dt);
      return escena === 13 || escena === 14 || escena === 20 || escena === 28 || !!cama.pj;
    },
    camaraFija: () => camFija,
    maneja(ev) {
      if (!ev) return false;
      const exe = (ev.exec || "").slice(0, 8), ini = (ev.init || "").slice(0, 8);
      return exe === "0x4e2bc0" || exe === "0x4e3a90" || exe === "0x4cd570" || ini === "0x4cde20" || ini === "0x4e3bf0" || ini === "0x4e0ba0";
    },
    reemplazaObjeto(o) {
      return [ "0x4e2c80", "0x4e2d40", "0x4e3070" ].includes((o.cnst || "").slice(0, 8));
    },
    estado() {
      const b = [ 1301, 1302, 1304, 1310, 1311, 1312, 1313, 1317, 1318, 1323, 1324, 1325, 1326, 1327, 2126, 2131, 1572 ].filter(x => F(x));
      const ei = api.eileen?.actual;
      return {
        escena: escena,
        banderas: b,
        techo: techo.paso,
        jaula: jaula.paso,
        cama: !!cama.pj,
        camaraFija: !!camFija,
        eileen: ei ? {
          paso: ei.estado?.().paso,
          pos: ei.pos.map(Math.round),
          conHenry: U.eileenCerca(),
          estado: ei.g?.estado
        } : null,
        llaves: {
          hospital: cuantos(79),
          pequena: cuantos(81)
        }
      };
    },
    alDemo(si) {
      if (cama.pj) cama.pj.grupo.visible = !si;
    },
    alSalir() {
      activo = false;
      cama.quitar();
      hs20.quitar();
      techo.salir();
      jaula.salir();
      sacarParedes();
      paredAscensor = null;
      ponerCamara(null);
    },
    extras: [],
    async ejecutar(o) {
      if (o.hospital) return undefined;
      return ejecutarPropio(o);
    },
    async antesDePuerta(p) {
      const c = cerraduraDe(p.door_no);
      return !c || await cerradura(c, p);
    },
    demo: demo
  };
}

function crearEscalera(api) {
  const {juego: juego, F: F, henry: henry} = api;
  const U = utilidades(api);
  let escena = 0;
  async function salida(o) {
    if (!U.eileenCerca() && (api.eileen?.actual || api.PARTIDA.eileen?.estado)) {
      await U.guion(HD.guiones.sin_eileen);
      return null;
    }
    api.eileenConmigo?.();
    const f = (HD?.salida?.tabla || [])[o.grupo ?? 0];
    if (!f) return null;
    const r = U.cambioDeEtapa(f, false);
    if (r.aEtapa === "st") {
      await api.M.fundir(1, .35);
      await api.irA(r.escena, {
        pos: r.pos,
        rot: r.rot
      });
      await api.M.fundir(0, .35);
      return null;
    }
    return r;
  }
  return {
    inicio() {
      const c = juego.dias302?.checkpoint?.();
      return c?.etapa === "st" ? {
        escena: c.escena,
        pos: c.pos,
        rot: c.rot
      } : null;
    },
    async alCargarEscena(n) {
      await datos();
      escena = n;
    },
    maneja: ev => /^0x4e6e00/.test(ev?.exec || ""),
    async ejecutar(o) {
      if (o.hospital) return undefined;
      const ev = o.ev || {};
      if (/^0x4e6e00/.test(ev.exec || "")) return salida(o);
      if (/^0x4d1bf0/.test(ev.exec || "")) {
        if (!await U.guion(HD.guiones.agujero_302)) return null;
        api.dejarEileen?.();
        const dias = juego.dias302?.agujeroDelMundo?.({
          etapa: "st",
          escena: escena
        });
        return {
          ...dias || {
            volver302: true,
            escena302: 2
          },
          porAgujero: true
        };
      }
      return undefined;
    },
    estado: () => ({
      escena: escena,
      conEileen: U.eileenCerca(),
      henry: U.posHenry().map(Math.round),
      item: henry.inventario?.lugares?.length
    }),
    extras: [],
    alSalir() {},
    usarF: F
  };
}
