// SH4 web — FeniXVOID · Project Ravenlight
import { json, q } from "./motor.js";

import * as P from "./pantallas.js";

import { partesBin } from "../lib/sh4bin.js";

import { leerModelo } from "../lib/modelo.js";

import { leerTexturas, aRGBA } from "../lib/texturas.js";

import { leerAnimacion } from "../lib/animacion.js";

import { crearPersonaje } from "../lib/personaje.js";

import { crearGuion, agujeroDeVuelta } from "./guion_comun.js";

const distXZ = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);

const OJOS = 1.6;

const DT30 = 1 / 30;

const LLEGADA = {
  escena: 18,
  pos: [ -5800, 0, 0 ],
  rot: 1.518
};

const SON = {
  ITEM: 40006,
  BOTON_ASCENSOR: 50200,
  REJA_ABRE: 50201,
  REJA_CIERRA: 50202,
  PARA: 50205,
  MOTOR: 51203,
  FANTASMA: 61255,
  ARRIBA_2251: 20218
};

const ITEM = {
  LLAVE_FANTASMA: 107,
  LLAVE_ALBERT: 122,
  ESPADA: 5,
  CARTEL_CAOS: 121,
  NOTA_BARMAN: 175
};

const ESCALERAS_BD = [ [ 11, 22, 12, 22, 255, 255 ], [ 11, 26, 12, 26, 255, 255 ], [ 12, 22, 255, 255, 11, 22 ], [ 12, 26, 255, 255, 11, 26 ], [ 11, 27, 4, 27, 255, 255 ], [ 4, 27, 255, 255, 11, 27 ] ];

let ED = null;

async function datos() {
  if (!ED || ED._vacio) ED = await json("./edificio_datos.json") || ED || {
    _vacio: true,
    fin: {},
    agujeros: [],
    cerraduras: [],
    zonas: {},
    guiones: {},
    ascensor: null,
    clave: null
  };
  return ED;
}

datos();

export const EDIFICIO = {
  etapa: "bd",
  nombre: {
    s: "Mundo del Edificio",
    e: "Building World"
  },
  inicio: {
    escena: 18
  },
  terminado: 911,
  banderasAlLlegar: [],
  banderasAtajo: [ 901 ],
  despues: {},
  demoAlAzar: {},
  molinetes: [],
  sinHacer: [],
  fin: {
    evnum: 37,
    escena302: 2
  },
  variantes: [],
  puertas: {},
  excluir: () => false,
  crear: api => crearEdificio(api)
};

function crearEdificio(api) {
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
  const comun = n => juego.textoComun?.(n) || "";
  const b0 = n => api.texto(8, n);
  let escena = 0, activo = false;
  const finDe = ev => ED?.fin?.etapa5?.[String(ev?.evnum ?? ev)] || ED?.fin?.comun?.[String(ev?.evnum ?? ev)] || null;
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
  const zonasEscena = (n = escena) => ED?.zonas?.[`${n}/${api.mitad || 1}`] || [];
  const zonaDe = o => zonasEscena().find(z => z.i === o.i) || null;
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
    if (d === "0x4dddd0") fantasma.liberar();
  }
  const demo = n => api.ejecutar({
    i: -1,
    edificio: true,
    ev: {
      evnum: 0,
      demo: n,
      cond: "siempre"
    }
  });
  async function elegirVertical(texto, n = 3) {
    juego.hablando = true;
    const c = M.cartel;
    const r = await new Promise(ok => {
      let el = 0, t = 0;
      const dibujar = () => {
        P.dibujarMensaje(c.g, juego.fuente, texto, {
          alfa: Math.min(1, t * 6)
        });
        const g = c.g, k = g.canvas.width / 640, x = 560 * k;
        for (let i = 0; i < n; i++) {
          const y = (24 + i * 34) * k;
          g.beginPath();
          g.arc(x, y, 11 * k, 0, Math.PI * 2);
          g.fillStyle = i === el ? "rgba(236,227,210,0.95)" : "rgba(80,72,64,0.85)";
          g.fill();
          g.lineWidth = 2 * k;
          g.strokeStyle = "#d8cfc0";
          g.stroke();
        }
        c.mostrar();
      };
      const tarea = (dt, {acciones: acciones}) => {
        t += dt;
        dibujar();
        for (const a of acciones) {
          if (a === "arriba" || a === "izq") {
            if (el > 0) {
              el--;
              sonar(SON.BOTON_ASCENSOR);
            }
          }
          if (a === "abajo" || a === "der") {
            if (el < n - 1) {
              el++;
              sonar(SON.BOTON_ASCENSOR);
            }
          }
          if (t > .25 && (a === "aceptar" || a === "accion" || a === "clic")) {
            M.tareas.delete(tarea);
            c.ocultar();
            ok(el);
            return true;
          }
          if (t > .25 && a === "cancelar") {
            M.tareas.delete(tarea);
            c.ocultar();
            ok(n);
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
  const bins = new Map;
  const bin = a => {
    if (!bins.has(a)) bins.set(a, api.bajar("data/" + a).then(b => ({
      b: b,
      p: partesBin(b)
    })));
    return bins.get(a);
  };
  async function modelo(arch, pm, pt, tArch = null) {
    const m = await bin(arch), Mp = m.p.find(x => x.indice === pm) || m.p[pm];
    const tb = tArch ? await bin(tArch) : m, T = tb.p.find(x => x.indice === pt) || tb.p[pt];
    return crearPersonaje(leerModelo(m.b, Mp.ofs, Mp.len), T?.tipo === "texturas" ? leerTexturas(tb.b, T.ofs, T.len) : []);
  }
  const salaGrupo = () => api.cont.children.find(c => /^sala_/.test(c.name || "")) || null;
  const ascensor = (() => {
    const cab = [ 0, 1 ].map(no => ({
      no: no,
      piso: 0,
      objetivo: 0,
      y: 0,
      vel: 0,
      t: 0,
      dur: 0,
      reja: 2,
      rejaVel: 0,
      paso: 0,
      sonMotor: null,
      grupo: null,
      hojas: [],
      piso3d: null,
      pared: null
    }));
    const A = () => ED?.ascensor;
    const flags = no => A()?.banderas?.[no] || (no ? [ 922, 923, 924 ] : [ 919, 920, 921 ]);
    const lugar = (no, piso) => A()?.pos?.[no]?.[piso] || [ no ? 0 : 800, [ 0, -1600, -3200 ][piso], 0 ];
    function iniciarBanderas() {
      for (const no of [ 0, 1 ]) if (!flags(no).some(b => F(b))) prender(flags(no)[no === 0 ? 1 : 2]);
    }
    function leerPiso(no) {
      const f = flags(no);
      return F(f[2]) ? 2 : F(f[1]) ? 1 : 0;
    }
    function ponerBanderas(no, piso) {
      const f = flags(no);
      f.forEach((b, i) => i === piso ? prender(b) : apagar(b));
    }
    function reiniciar() {
      for (const c of cab) {
        c.piso = c.objetivo = leerPiso(c.no);
        c.y = lugar(c.no, c.piso)[1];
        c.vel = 0;
        c.t = 0;
        c.paso = 0;
        c.reja = c.piso === 0 ? 2 : 0;
        c.rejaVel = 0;
        try {
          c.sonMotor?.parar?.(.1);
        } catch {}
        c.sonMotor = null;
      }
      apagar(925);
    }
    function armar() {
      const s = salaGrupo();
      if (!s) return;
      const ud = s.userData.edificio || (s.userData.edificio = {});
      if (!ud.cabinas) {
        const g0 = s.getObjectByName("mundo_12");
        const hojas0 = [ 15, 16, 17, 18 ].map(k => s.getObjectByName("mundo_" + k));
        ud.cabinas = [ 0, 1 ].map(no => {
          const g = no === 0 ? g0 : g0?.clone();
          if (g && !g.parent) s.add(g);
          const hs = hojas0.map(h => {
            if (!h) return null;
            const c = no === 0 ? h : h.clone();
            if (!c.parent) s.add(c);
            return c;
          });
          return {
            g: g,
            hs: hs
          };
        });
        const col = api.colision;
        ud.colision = [ 0, 1 ].map(() => {
          const mat = new THREE.MeshBasicMaterial({
            visible: false
          });
          const piso = new THREE.Mesh(new THREE.PlaneGeometry(620 * E, 800 * E).rotateX(-Math.PI / 2), mat);
          piso.name = "piso de la cabina";
          const pared = new THREE.Mesh(new THREE.PlaneGeometry(620 * E, 800 * E), mat);
          pared.name = "reja de la cabina";
          col?.add(piso);
          col?.add(pared);
          return {
            piso: piso,
            pared: pared
          };
        });
      }
      cab.forEach((c, i) => {
        c.grupo = ud.cabinas[i].g;
        c.hojas = ud.cabinas[i].hs;
        c.piso3d = ud.colision[i].piso;
        c.pared = ud.colision[i].pared;
      });
      dibujar();
    }
    function dibujar() {
      for (const c of cab) {
        const [x, , z] = lugar(c.no, 0);
        if (c.grupo) {
          c.grupo.position.set(-x * E, -c.y * E, z * E);
          c.grupo.updateMatrixWorld(true);
        }
        (A()?.hojas || []).forEach((tramos, h) => {
          const g = c.hojas[h];
          if (!g) return;
          const k = Math.min(2, Math.floor(c.reja) % 3), r = tramos[k];
          const hx = r[0] + (r[1] - r[0]) * (c.reja - k) + x;
          g.position.set(-hx * E, -c.y * E, r[2] * E);
          g.updateMatrixWorld(true);
        });
        if (c.piso3d) {
          c.piso3d.position.set(-x * E, -c.y * E, z * E);
          c.piso3d.updateMatrixWorld(true);
        }
        if (c.pared) {
          const abierta = c.paso === 0 && c.piso === 0;
          c.pared.position.set(-x * E, abierta ? -2e3 * E : 400 * E, -400 * E);
          c.pared.updateMatrixWorld(true);
        }
      }
    }
    const moviendo = () => cab.some(c => c.paso !== 0);
    const cabinaDeHenry = (p = posHenry()) => p[0] < 400 ? 1 : 0;
    const enLaCabina = (c, p = posHenry()) => {
      const [x] = lugar(c.no, 0);
      return Math.abs(p[0] - x) < 340 && p[2] > -400 && Math.abs(p[1] - c.y) < 600;
    };
    function paso(c) {
      const dt = DT30;
      switch (c.paso) {
       case 0:
        if (c.piso === c.objetivo) return false;
        prender(925);
        if (c.piso === 0) {
          c.paso = 6;
          sonar(SON.REJA_CIERRA, [ lugar(c.no, 0)[0], c.y - 400, 0 ]);
        } else c.paso = 1;
        return true;

       case 1:
        {
          const dy = Math.abs(lugar(c.no, c.objetivo)[1] - lugar(c.no, c.piso)[1]);
          c.vel = 0;
          c.t = 0;
          c.dur = (dy - 300) / 300;
          c.paso = 2;
          try {
            c.sonMotor?.parar?.(.1);
          } catch {}
          c.sonMotor = sonar(SON.MOTOR, [ lugar(c.no, 0)[0], c.y - 400, 0 ], {
            loop: true
          });
        }

       case 2:
        {
          const s = c.piso < c.objetivo ? -1 : 1;
          c.t += dt;
          c.y += dt * c.vel;
          c.vel += dt * s * 300;
          if (c.t >= 1) {
            c.vel = s * 300;
            c.paso = 3;
          }
          return true;
        }

       case 3:
        c.t += dt;
        c.y += dt * c.vel;
        if (c.t > c.dur + 1) {
          c.paso = 4;
          try {
            c.sonMotor?.parar?.(.2);
          } catch {}
          c.sonMotor = null;
          sonar(SON.PARA, [ lugar(c.no, 0)[0], c.y - 400, 0 ]);
        }
        return true;

       case 4:
        {
          const s = c.piso < c.objetivo ? -1 : 1;
          c.t += dt;
          c.vel -= dt * s * 300;
          c.y += dt * c.vel;
          if (c.t > c.dur + 2) {
            c.y = lugar(c.no, c.objetivo)[1];
            c.piso = c.objetivo;
            if (c.piso === 0) {
              c.paso = 5;
              sonar(SON.REJA_ABRE, [ lugar(c.no, 0)[0], c.y - 400, 0 ]);
            } else c.paso = 7;
          }
          return true;
        }

       case 5:
        if (c.reja > .15) {
          if (c.reja >= 1.85) c.rejaVel = Math.abs(c.rejaVel - dt * .2);
        } else c.rejaVel = Math.abs(dt * .2 + c.rejaVel);
        c.reja += c.rejaVel;
        if (c.reja >= 2) {
          c.reja = 2;
          c.paso = 7;
          c.rejaVel = 0;
        }
        return true;

       case 6:
        if (c.reja > .15) {
          if (c.reja >= 1.85) c.rejaVel = Math.abs(c.rejaVel + dt * .2);
        } else c.rejaVel = Math.abs(c.rejaVel - dt * .2);
        c.reja -= c.rejaVel;
        if (c.reja <= 0) {
          c.reja = 0;
          c.paso = 1;
          c.rejaVel = 0;
        }
        return true;

       case 7:
        apagar(925);
        c.paso = 0;
        return true;
      }
      return false;
    }
    function llevarHenry(yJuego) {
      const piso = -yJuego * E;
      const rig = M.escena.getObjectByName("Henry (ojos)");
      if (rig) rig.position.y = piso + OJOS;
      M.jugador.position.y = piso;
      if (henry.personaje?.grupo) henry.personaje.grupo.position.y = piso;
    }
    function pararEnCabina() {
      const p = posHenry();
      for (const c of cab) if (enLaCabina(c, p) && Math.abs(p[1] - c.y) > 2) {
        api.ubicarHenry([ p[0], c.y, p[2] ], null);
        return;
      }
    }
    const _p = new THREE.Vector3, _m = new THREE.Vector3, _M = new THREE.Matrix4, _q = new THREE.Quaternion, _q2 = new THREE.Quaternion;
    function camara() {
      if (api.vista !== "3ra" || M.enVR()) return;
      const p = posHenry(), c = cab[cabinaDeHenry(p)], [x, , z] = lugar(c.no, 0);
      _p.copy(aMundo([ c.no === 0 ? x - 200 : x + 200, p[1] - 560, z ]));
      _m.copy(aMundo([ p[0], p[1] - 300, p[2] ]));
      M.jugador.updateMatrixWorld(true);
      M.camara.position.copy(M.jugador.worldToLocal(_p.clone()));
      _M.lookAt(_p, _m, M.camara.up);
      _q.setFromRotationMatrix(_M);
      M.jugador.getWorldQuaternion(_q2).invert();
      M.camara.quaternion.copy(_q2.multiply(_q));
    }
    function viajar() {
      return new Promise(ok => {
        let acum = 0;
        const tarea = dt => {
          acum += Math.min(dt, .25);
          while (acum >= DT30) {
            acum -= DT30;
            for (const c of cab) {
              const dentro = enLaCabina(c);
              if (paso(c) && dentro) llevarHenry(c.y);
            }
          }
          dibujar();
          if (escena === 12) camara();
          if (!moviendo()) {
            M.tareas.delete(tarea);
            ok();
          }
          return true;
        };
        M.tareas.add(tarea);
      });
    }
    async function ir(no, piso) {
      const c = cab[no];
      if (c.piso === piso) return;
      ponerBanderas(no, piso);
      c.objetivo = piso;
      await viajar();
    }
    function ponerDeGolpe(no, piso) {
      const c = cab[no];
      ponerBanderas(no, piso);
      c.piso = c.objetivo = piso;
      c.y = lugar(no, piso)[1];
      c.reja = piso === 0 ? 2 : 0;
      c.paso = 0;
      c.vel = 0;
      dibujar();
    }
    function ocultar(si) {
      for (const c of cab) {
        if (c.grupo) c.grupo.visible = !si;
        for (const h of c.hojas) if (h) h.visible = !si;
      }
    }
    function parar() {
      for (const c of cab) {
        try {
          c.sonMotor?.parar?.(.1);
        } catch {}
        c.sonMotor = null;
      }
    }
    return {
      cab: cab,
      iniciarBanderas: iniciarBanderas,
      reiniciar: reiniciar,
      armar: armar,
      dibujar: dibujar,
      camara: camara,
      ir: ir,
      ponerDeGolpe: ponerDeGolpe,
      moviendo: moviendo,
      cabinaDeHenry: cabinaDeHenry,
      enLaCabina: enLaCabina,
      ocultar: ocultar,
      parar: parar,
      flags: flags,
      leerPiso: leerPiso,
      pararEnCabina: pararEnCabina
    };
  })();
  async function botonera(o) {
    if (ascensor.moviendo()) return null;
    const z = api.objetosEscena(12).find(x => x.indice === o.i);
    const no = z?.grupo_0x414 ?? ascensor.cabinaDeHenry();
    const g = ED.guiones.ascensor_botonera || [ {
      msg: 43,
      archivo: 8
    } ];
    const r = await elegirVertical(b0(g[0].msg));
    const f = ascensor.flags(no);
    if (r === 3) return null;
    if (r === 0 && !F(f[2])) {
      await ascensor.ir(no, 2);
      return null;
    }
    if (r === 1 && !F(f[1]) && F(909)) {
      await ascensor.ir(no, 1);
      return null;
    }
    if (r === 2 && !F(f[0])) {
      if (!F(909)) return elAscensorConRichard();
      await ascensor.ir(no, 0);
      return null;
    }
    await guion(ED.guiones.ascensor_nada);
    return null;
  }
  async function elAscensorConRichard() {
    if (F(909)) return null;
    await demo(36);
    ascensor.ponerDeGolpe(1, 0);
    terminar(36);
    const p = posHenry(), dentro = Math.abs(p[0]) < 300 && p[2] > -380 && p[2] < 380;
    api.ubicarHenry(dentro ? [ p[0], 0, p[2] ] : [ 0, 0, 120 ], dentro ? null : 0);
    return null;
  }
  const fantasma = (() => {
    let e = null, quejido = null, anims = null;
    async function cargarAnims() {
      if (anims) return anims;
      const m = await bin("enemy_multi_event_bd07.bin");
      anims = m.p.filter(x => x.tipo === "animacion").map(x => leerAnimacion(m.b, x.ofs, x.len));
      return anims;
    }
    async function preparar() {
      e = (api.enemigos?.enemigos || []).find(x => x.tipo === "MULTI" && ((x.def?.estado_inicial ?? 0) & 15) === 6) || null;
      if (!e) return;
      const ev = await cargarAnims();
      const lista = [ ...e.anim.anims ];
      lista[39] = ev[0];
      lista[40] = ev[1];
      e.anim.anims = lista;
      e.intocable = () => true;
      e.tick = () => {
        e.posAnt = [ ...e.pos ];
        e.rotAnt = e.rot;
        e.anim.avanzar();
      };
      if (F(929)) {
        e.paso = 16;
        e.anim.poner(40);
        e.anim.t = Math.max(0, e.anim.dur - 1);
      } else {
        e.anim.poner(39);
        try {
          quejido?.parar?.(.1);
        } catch {}
        quejido = sonar(SON.FANTASMA, e.pos, {
          loop: true
        });
      }
      e.dibujar?.(1);
    }
    function soltarLlave() {
      if (!e) return;
      e.anim.poner(40);
      e.paso = 16;
      try {
        quejido?.parar?.(1);
      } catch {}
      quejido = null;
    }
    function liberar() {}
    function parar() {
      try {
        quejido?.parar?.(.3);
      } catch {}
      quejido = null;
      e = null;
    }
    return {
      preparar: preparar,
      soltarLlave: soltarLlave,
      liberar: liberar,
      parar: parar,
      get e() {
        return e;
      }
    };
  })();
  async function evFantasma(ev) {
    await guion(ED.guiones.fantasma_espada);
    if ((henry.inventario?.lugares?.length || 0) >= 10) {
      await guion(ED.guiones.inventario_lleno);
      return null;
    }
    if (!await guion(ED.guiones.fantasma_llave)) return null;
    sonar(SON.ITEM);
    fantasma.soltarLlave();
    terminar(ev);
    return null;
  }
  let imgPanel = null;
  async function imagenPanel() {
    if (imgPanel) return imgPanel;
    try {
      const m = await bin("bd14.bin"), T = m.p.find(x => x.indice === 5);
      const tex = leerTexturas(m.b, T.ofs, T.len)[0]?.[0];
      if (tex) {
        const px = aRGBA(tex), cv = document.createElement("canvas");
        cv.width = tex.ancho;
        cv.height = tex.alto;
        const d = new ImageData(tex.ancho, tex.alto);
        d.data.set(px.subarray ? px.subarray(0, d.data.length) : px.slice(0, d.data.length));
        cv.getContext("2d").putImageData(d, 0, 0);
        imgPanel = cv;
      }
    } catch (err) {
      console.warn("panel del bar", err.message);
    }
    return imgPanel;
  }
  async function panelBar(ev) {
    const C = ED.clave || {}, B = C.botones || [], R = F(1130) ? C.segunda : C.primera;
    const S = C.sonidos || {
      boton: 50208,
      mal: 50209,
      bien: 50210
    };
    const img = await imagenPanel();
    const g = M.pantalla.g;
    await M.fundir(1, .3);
    M.ponerVelo(0);
    M.pantalla.mostrar();
    juego.hablando = true;
    const GRILLA = [ [ 1, 2, 3 ], [ 4, 5, 6 ], [ 7, 8, 9 ], [ 10, 0, 11 ] ];
    const donde = b => {
      for (let f = 0; f < 4; f++) {
        const c = GRILLA[f].indexOf(b);
        if (c >= 0) return [ f, c ];
      }
      return [ 0, 0 ];
    };
    const ok = await new Promise(fin => {
      let sel = 5, cifras = [], t = 0, cierre = -1, bien = false;
      const apretar = b => {
        sonar(S.boton);
        if (b === 10 || b === 11) {
          cifras = [];
          return;
        }
        cifras.push(b);
        if (cifras.length === 4) {
          bien = cifras.every((v, i) => v === R?.[i]);
          sonar(bien ? S.bien : S.mal);
          cierre = bien ? .7 : .9;
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
        const kx = g.canvas.width / 640, ky = g.canvas.height / 448;
        g.fillStyle = "#0d0b0a";
        g.fillRect(0, 0, g.canvas.width, g.canvas.height);
        if (img) g.drawImage(img, 0, 0, 512, Math.min(448, img.height), 0, 0, 640 * kx, 448 * ky);
        for (let i = 0; i < 12; i++) {
          const [x, y, w, h] = B[i] || [ 0, 0, 0, 0 ];
          g.strokeStyle = i === sel ? "#ffffff" : "rgba(255,255,255,0.22)";
          g.lineWidth = i === sel ? 3 : 1;
          g.strokeRect((x * 1.25 - 2) * kx, (y - 2) * ky, (w * 1.25 + 4) * kx, (h + 4) * ky);
          g.save();
          g.fillStyle = i === sel ? "#ffffff" : "#bfb6a6";
          g.font = `${Math.round(14 * ky)}px sans-serif`;
          g.textAlign = "center";
          g.fillText(i < 10 ? String(i) : i === 10 ? "*" : "#", (x + w / 2) * 1.25 * kx, (y + h - 3) * ky);
          g.restore();
        }
        g.save();
        g.fillStyle = "#e8dfcf";
        g.font = `bold ${Math.round(22 * ky)}px sans-serif`;
        g.textAlign = "center";
        cifras.forEach((_, i) => g.fillText("*", (300 + i * 16) * kx, 160 * ky));
        g.restore();
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
    if (ok) terminar(ev);
    await M.fundir(0, .4);
    return ok;
  }
  function mirarArriba(ev) {
    const D = ED.escalera_2251 || {
      mira: [ 0, -8800, -800 ],
      sonido: SON.ARRIBA_2251
    };
    sonar(D.sonido, D.mira, {
      volumen: 1
    });
    const vr = M.enVR(), tercera = api.vista === "3ra";
    const destino = aMundo(D.mira);
    const q0 = M.camara.quaternion.clone();
    const pc = M.camara.getWorldPosition(new THREE.Vector3);
    const qp = M.camara.parent ? M.camara.parent.getWorldQuaternion(new THREE.Quaternion).invert() : new THREE.Quaternion;
    const mm = (new THREE.Matrix4).lookAt(pc, destino, M.camara.up);
    const q1 = qp.multiply((new THREE.Quaternion).setFromRotationMatrix(mm));
    return new Promise(ok => {
      let t = 0;
      const tarea = dt => {
        t += dt;
        if (!vr) {
          const a = Math.max(0, Math.min(1, (t - .5) / 1.5)), s = a * a * (3 - 2 * a);
          M.camara.quaternion.copy(q0).slerp(q1, s);
        }
        if (t > 4) {
          M.tareas.delete(tarea);
          if (!vr && !tercera) M.camara.quaternion.copy(q0);
          terminar(ev);
          ok(null);
          return true;
        }
        return true;
      };
      M.tareas.add(tarea);
    });
  }
  let ventilador = null, angVent = 0, reloj = 0, cartel = null;
  async function objetosDeSala(n) {
    ventilador = null;
    cartel = null;
    if (n === 17) {
      try {
        const pj = await modelo("bd17.bin", 5, 7);
        const o = api.objetosEscena(17).find(x => x.indice === 1);
        pj.ubicar(...o?.pos || [ 0, 120, -1440 ], 0);
        pj.grupo.name = "ventilador (bd17)";
        if (escena === 17) {
          api.cont.add(pj.grupo);
          ventilador = pj;
        }
      } catch (err) {
        console.warn("ventilador", err.message);
      }
    }
    if (n === 16 && !F(956)) {
      try {
        const pj = await modelo("item_model.bin", 24, 25);
        const o = api.objetosEscena(16).find(x => x.indice === 5);
        pj.ubicar(...o?.pos || [ -163.234, -8960, 0 ], o?.rot || 0);
        pj.grupo.name = "Cartel Caos (bd16)";
        if (escena === 16) {
          api.cont.add(pj.grupo);
          cartel = pj;
        }
      } catch (err) {
        console.warn("cartel", err.message);
      }
    }
  }
  function relojCuadro(dt) {
    if (escena !== 24) return;
    if (F(948)) {
      reloj += 60 * dt;
      if (reloj > 720) reloj -= 720;
    }
    const s = salaGrupo();
    if (!s) return;
    const giro = (nombre, ang) => {
      const g = s.getObjectByName(nombre);
      if (g) {
        g.rotation.z = ang;
      }
    };
    giro("mundo_6", reloj * Math.PI / 360);
    giro("mundo_8", reloj * Math.PI / 30);
    giro("mundo_5", Math.sin(reloj * Math.PI / 36) * .2617994);
  }
  const soltados = [];
  let MI = null;
  async function soltarItem(e, item, pos) {
    if (!item || !pos) return;
    const o = {
      i: 1e3 + Date.now() % 1e6,
      item: item,
      pos: [ pos[0], pos[1], pos[2] ],
      zona: {
        dmy1: 1,
        radio: 120,
        dmy6: 5
      },
      ev: null
    };
    api.eventos.push(o);
    try {
      MI ||= new Map(((await json("/datos/juego.json"))?.modelos_items?.filas || []).map(f => [ f.id, f ]));
      const f = MI.get(item);
      if (f?.modelo) {
        const pj = await modelo(f.modelo.archivo, f.modelo.parte, f.texturas?.parte, f.texturas?.archivo);
        pj.ubicar(o.pos[0], o.pos[1], o.pos[2], 0);
        pj.grupo.name = `ítem ${item} (soltado)`;
        api.cont.add(pj.grupo);
        soltados.push({
          o: o,
          pj: pj,
          escena: escena
        });
      }
    } catch (err) {
      console.warn("ítem soltado", err.message);
    }
  }
  if (api.enemigos) api.enemigos.soltarItem = (e, item, pos) => {
    soltarItem(e, item, pos);
  };
  function revisarSoltados() {
    for (const s of soltados.splice(0)) {
      const tomado = (api.PARTIDA.recogidos || []).includes(`bd/${s.escena}/${api.mitad}/${s.o.i}`);
      if (tomado || s.escena !== escena) {
        s.pj.grupo.removeFromParent();
        s.pj.dispose?.();
      } else soltados.push(s);
    }
  }
  const cerraduraDe = door => (ED?.cerraduras || []).find(c => c.door === door) || null;
  let cajaPuertas = null;
  const cond5 = c => !c || c.tipo !== 5 || c.condiciones.every(([b, v]) => !b || (F(b) ? 1 : 0) === v);
  async function cerradura(c, p) {
    const sonido = t => {
      try {
        api.amb?.puerta?.(p, t);
      } catch {}
    };
    const G = ED.guiones;
    switch (c.tipo) {
     case 5:
      return cond5(c);

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
  async function enganchado(z, p) {
    const o = api.eventosCrudos(escena).find(x => x.i === z.i) || {
      i: z.i,
      ev: z.ev
    };
    const ev = o.ev || z.ev || {};
    if (ev.cond && !cumpleCond(ev.cond)) return;
    if (ev.evnum === 2235 || /^0x4dcdc0/.test(ev.init || "")) {
      if (!F(934)) await panelBar(ev);
      return;
    }
    if (ev.evnum === 2252) {
      if (!F(936)) {
        await guion(ev.guion || ED.guiones.que_es_esto_2252);
        terminar(ev);
      }
      return;
    }
    if (ev.evnum === 2230) {
      await guion(ev.guion);
      terminar(ev);
      return;
    }
  }
  const cumpleCond = c => !c || c === "siempre" || c.split(/\s+AND\s+/).every(x => x === "siempre" ? true : x[0] === "!" ? !F(+x.slice(2)) : F(+x.slice(1)));
  return {
    ascensor: ascensor,
    inicio() {
      ascensor.iniciarBanderas();
      if (!F(901)) return {
        ...LLEGADA
      };
      const s = api.PARTIDA.salidaMundo?.bd;
      if (s) return {
        escena: s.escena,
        pos: s.pos,
        rot: s.rot
      };
      const fila = (ED?.agujeros || []).find(f => f.etapa === 5 && F(f.bandera));
      return fila ? {
        escena: fila.escena,
        pos: fila.pos,
        rot: fila.rot
      } : null;
    },
    async alCargarEscena(n) {
      await datos();
      escena = n;
      activo = true;
      fantasma.parar();
      ascensor.parar();
      ascensor.iniciarBanderas();
      if (n === 12) {
        ascensor.reiniciar();
        ascensor.armar();
        ascensor.pararEnCabina();
      }
      if (n === 7) {
        try {
          await fantasma.preparar();
        } catch (err) {
          console.warn("fantasma de bd07", err.message);
        }
      }
      await objetosDeSala(n);
    },
    cuadro(dt) {
      if (escena === 12) {
        ascensor.dibujar();
        ascensor.camara();
      }
      if (ventilador) {
        angVent = (angVent + .17453294 * 30 * dt) % (Math.PI * 2);
        ventilador.grupo.rotation.y = -angVent;
      }
      if (cartel && F(956)) {
        cartel.grupo.removeFromParent();
        cartel = null;
      }
      if (soltados.length) revisarSoltados();
      relojCuadro(dt);
      return false;
    },
    maneja(ev) {
      if (!ev) return false;
      if (/^0x4ddc00/.test(ev.exec || "")) return !ascensor.moviendo() && !F(925);
      return /^0x4ddac0/.test(ev.exec || "") || /^0x4dc390/.test(ev.init || "");
    },
    reemplazaObjeto(o) {
      return /^0x4dd500/.test(o.cnst || "") || (o.archivos_en_codigo || []).some(a => a.archivo === "bd12.bin" && a.parte === 12);
    },
    llamada: llamada,
    estado() {
      const b = [ 901, 905, 909, 911, 919, 920, 921, 922, 923, 924, 925, 928, 929, 930, 931, 932, 933, 934, 935, 936, 955, 956, 1130, 1611 ].filter(n => F(n));
      return {
        escena: escena,
        banderas: b,
        ascensor: ascensor.cab.map(c => ({
          piso: c.piso,
          objetivo: c.objetivo,
          y: Math.round(c.y),
          reja: +c.reja.toFixed(2),
          paso: c.paso
        })),
        fantasma: fantasma.e ? {
          paso: fantasma.e.paso,
          anim: fantasma.e.anim.n
        } : null,
        llaves: {
          fantasma: cuantos(ITEM.LLAVE_FANTASMA),
          albert: cuantos(ITEM.LLAVE_ALBERT),
          espada: cuantos(ITEM.ESPADA),
          cartel: cuantos(ITEM.CARTEL_CAOS)
        }
      };
    },
    alDemo(si) {
      if (escena === 12) ascensor.ocultar(si);
    },
    alSalir() {
      activo = false;
      fantasma.parar();
      ascensor.parar();
    },
    extras: [],
    async ejecutar(o) {
      if (o.edificio) return undefined;
      const ev = o.ev || {};
      const z = zonaDe(o);
      const ini = (ev.init || "").slice(0, 8), exe = (ev.exec || "").slice(0, 8);
      if (z?.dmy1 === 6) return null;
      if (exe === "0x4d1bf0") {
        return agujeroDeVuelta({
          api: api,
          etapa: "bd",
          num: 5,
          agujeros: ED.agujeros || [],
          escena: escena,
          pos: posHenry(),
          rot: henry.controlador.m.cuerpo
        });
      }
      if (exe === "0x4ddc00") return botonera(o);
      if (ev.evnum === 36) return elAscensorConRichard();
      if (exe === "0x4ddac0" || ev.evnum === 2231) return evFantasma(ev);
      if (ini === "0x4dc390" || ev.evnum === 2251) return mirarArriba(ev);
      if (ev.evnum === 2234) {
        if (!F(933)) {
          await guion(ev.guion);
          terminar(ev);
        } else await guion((ev.guion || []).filter(c => c.item == null && !c.llamada && c.msg !== 127));
        return null;
      }
      if (ev.evnum === 37) {
        prender(1611);
        return undefined;
      }
      if (ev.guion && !o.item && ev.guion.some(c => c.archivo === 0)) {
        if (await guion(ev.guion)) terminar(ev);
        return null;
      }
      return undefined;
    },
    elegirPuerta(lista) {
      cajaPuertas = lista.map(p => p.door_no);
      if (lista.length === 1) return lista[0];
      const ok = lista.find(p => cond5(cerraduraDe(p.door_no)));
      if (ok) return ok;
      const mitad = p => {
        const c = cerraduraDe(p.door_no);
        const k = c?.condiciones?.find(([b]) => b === 1130);
        return !k || (F(1130) ? 1 : 0) === k[1];
      };
      return lista.find(mitad) || lista[0];
    },
    async antesDePuerta(p) {
      const f = (p.funcion_paso || "").slice(0, 8);
      const escaleraBd = async q => {
        if (F(925) || ascensor.moviendo()) return false;
        const fila = ESCALERAS_BD.find(x => x[0] === escena && x[1] === q.door_no);
        if (!fila) return false;
        const sube = fila[2] !== 255;
        return !!await decir([ comun(sube ? 27 : 28) || (sube ? "Es una escalera. ¿Debería subir?" : "Es una escalera. ¿Debería bajar?") ], {
          pregunta: true
        });
      };
      if (f === "0x4fca60") {
        if (F(925) || ascensor.moviendo()) return false;
        const pu = ED?.ascensor?.puertas?.[String(p.door_no)];
        if (pu === undefined) {
          await guion(ED.guiones.puerta_cerrada);
          return false;
        }
        if (pu === null) return escaleraBd(p);
        if (!F(pu)) {
          await guion(ED.guiones.ascensor_no_esta);
          return false;
        }
        return true;
      }
      if (f === "0x4fd150") return escaleraBd(p);
      const c = cerraduraDe(p.door_no);
      if (!c || await cerradura(c, p)) return true;
      const centro = b => b.getCenter(new THREE.Vector3);
      const misma = (juego.mundo?.puertas || []).filter(x => x.caja && p.caja && centro(x.caja).distanceTo(centro(p.caja)) < .25).map(x => x.door_no);
      const enCaja = new Set([ p.door_no, ...cajaPuertas || [], ...misma ]);
      for (const z of zonasEscena().filter(x => x.dmy1 === 6 && enCaja.has(x.dmy2))) await enganchado(z, p);
      return false;
    }
  };
}
