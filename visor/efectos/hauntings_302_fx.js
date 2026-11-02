// SH4 web — FeniXVOID · Project Ravenlight
import { partesBin } from "../lib/sh4bin.js";

import { leerModelo } from "../lib/modelo.js";

import { leerTexturas, aRGBA } from "../lib/texturas.js";

import { leerAnimacion } from "../lib/animacion.js";

import { crearPersonaje } from "../lib/personaje.js";

import { leerMundo } from "../lib/mundo.js";

import { crearFantasmaPared } from "./fantasma_pared.js";

const E = .005;

const PHE1 = "phe_rl01.bin", PHE2 = "phe_rl02.bin";

const aV = (THREE, p) => new THREE.Vector3(-p[0] * E, -p[1] * E, p[2] * E);

const azar01 = () => Math.random();

const azarS = () => Math.max(-.99, Math.min(.99, Math.random() * 2 - 1));

const rand = n => Math.floor(Math.random() * n);

const GRIETA = {
  lugar: [ [ 1279, -350, -160 ], [ -163, -330, -700 ], [ 280, -300, 200 ], [ -250, -260, 410 ] ],
  azar: [ [ 0, 50, 200 ], [ 0, 50, 150 ], [ 0, 0, 0 ], [ 100, 0, 0 ] ],
  normal: [ [ -1, 0, 0 ], [ 0, 0, -1 ], [ 1, 0, 0 ] ],
  idx: [ 0, 2, 0, 1 ]
};

const FANTASMA = {
  lugar: [ [ 1279, -400, -140 ], [ 650, -400, -750 ], [ -30, -400, 300 ], [ -250, -260, 410 ] ],
  azar: [ [ 0, 50, 240 ], [ 0, 50, 0 ], [ 50, 50, 0 ], [ 100, 0, 0 ] ],
  normal: [ [ -1, 0, 0 ], [ 0, 0, -1 ], [ 1, 0, 0 ] ],
  idx: [ 0, 0, 1, 1 ]
};

const SALTOS = [ [ -8, -10, -7, -1, -2, -5, -1, 0 ], [ -4, -5, -1, -2, -3.5, 0 ] ];

export const SON = {
  ventana: 50905,
  cuadro: 50016,
  heladera: 50911,
  pileta: 51907,
  sombra: 51908,
  reloj: 51909,
  munecos: 51910,
  tele: 51010,
  telefono: 30260
};

export function crearVisualesHauntings({THREE: THREE, M: M, juego: juego, cuarto: cuarto, bajar: bajar, son: son, fx: fx}) {
  const bins = new Map;
  const bin = a => {
    if (!bins.has(a)) {
      bins.set(a, bajar("data/" + a).then(b => ({
        b: b,
        p: partesBin(b)
      })));
      bins.get(a).catch(() => bins.delete(a));
    }
    return bins.get(a);
  };
  const QZ = (new THREE.Quaternion).setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI);
  const EJE_X = new THREE.Vector3(1, 0, 0), EJE_Y = new THREE.Vector3(0, 1, 0);
  const _q = new THREE.Quaternion, _m = new THREE.Matrix4;
  const anims = new Map;
  async function anim(arch, parte) {
    const k = arch + ":" + parte;
    if (!anims.has(k)) anims.set(k, bin(arch).then(({b: b, p: p}) => p[parte]?.tipo === "animacion" ? leerAnimacion(b, p[parte].ofs, p[parte].len) : null));
    return anims.get(k);
  }
  function texturasDe(b, p, pt) {
    const T = p[pt], G = p[0];
    const loc = T?.tipo === "texturas" ? leerTexturas(b, T.ofs, T.len) : [];
    const glob = G?.tipo === "texturas" ? leerTexturas(b, G.ofs, G.len) : [];
    const r = loc.slice();
    glob.forEach((g, i) => {
      if (!r[i]?.length) r[i] = g;
    });
    return r;
  }
  async function modelo(arch, pm, pt, a = null) {
    const {b: b, p: p} = await bin(arch);
    const pj = crearPersonaje(leerModelo(b, p[pm].ofs, p[pm].len), texturasDe(b, p, pt));
    pj.grupo.name = "haunting " + arch + " #" + pm;
    if (a != null) await ponerAnim(pj, arch, a, true);
    return pj;
  }
  async function ponerAnim(pj, arch, parte, loop) {
    const A = await anim(arch, parte);
    if (A) {
      pj.poner(A);
      pj.reproductor.loop = loop;
    }
    pj.animActual = parte;
  }
  async function modeloMundo(arch, pm, pt) {
    const {b: b, p: p} = await bin(arch);
    const m = leerMundo(b, p[pm].ofs, p[pm].len), texs = texturasDe(b, p, pt);
    const g = new THREE.Group;
    g.name = "haunting " + arch + " #" + pm;
    const mallas = [];
    for (const z of m.piezas) {
      const geo = new THREE.BufferGeometry;
      const pos = new Float32Array(z.pos.length);
      for (let i = 0; i < pos.length; i += 3) {
        pos[i] = -z.pos[i] * E;
        pos[i + 1] = -z.pos[i + 1] * E;
        pos[i + 2] = z.pos[i + 2] * E;
      }
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      geo.setAttribute("color", new THREE.BufferAttribute(z.col, 4));
      geo.setAttribute("uv", new THREE.BufferAttribute(z.uv, 2));
      geo.setIndex(new THREE.BufferAttribute(z.indices, 1));
      const img = z.textura >= 1 ? texs[z.textura - 1]?.[z.paleta] || texs[z.textura - 1]?.[0] : null;
      let tex = null;
      if (img) {
        tex = new THREE.DataTexture(aRGBA(img), img.ancho, img.alto, THREE.RGBAFormat);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
        tex.magFilter = THREE.LinearFilter;
        tex.needsUpdate = true;
      }
      const mat = new THREE.MeshBasicMaterial({
        map: tex,
        vertexColors: true,
        side: THREE.DoubleSide,
        transparent: true,
        depthWrite: false
      });
      const malla = new THREE.Mesh(geo, mat);
      g.add(malla);
      mallas.push(malla);
    }
    return {
      grupo: g,
      mallas: mallas,
      actualizar() {},
      dispose() {
        for (const x of mallas) {
          x.geometry.dispose();
          x.material.map?.dispose();
          x.material.dispose();
        }
      }
    };
  }
  function alfa(pj, a) {
    const o = Math.max(0, Math.min(1, a / 128));
    for (const m of pj.mallas || []) {
      const mt = m.material;
      if (!mt) continue;
      const tr = o < .999 || !!mt.userData.siempreTransparente;
      if (mt.transparent !== tr) {
        mt.transparent = tr;
        mt.needsUpdate = true;
      }
      mt.opacity = o;
      mt.depthWrite = !tr;
    }
  }
  const ver = (pj, v) => {
    if (pj && pj.grupo.visible !== v) pj.grupo.visible = v;
  };
  const colgados = new Set;
  const sacar = g => {
    if (!g) return;
    g.userData.quitado = true;
    colgados.delete(g);
    g.removeFromParent();
  };
  const enSala = (pj, pos = null) => {
    if (pos) pj.grupo.position.copy(aV(THREE, pos));
    cuarto.grupo.add(pj.grupo);
    colgados.add(pj.grupo);
  };
  const girarY = (pj, a) => pj.grupo.children[0]?.quaternion.copy(QZ).multiply(_q.setFromAxisAngle(EJE_Y, a));
  const posCam = () => {
    const v = M.camara.getWorldPosition(new THREE.Vector3);
    return [ -v.x / E, -v.y / E, v.z / E ];
  };
  const distCam = p => {
    const c = posCam();
    return Math.hypot(c[0] - p[0], c[2] - p[2]);
  };
  const sonar = (id, pos) => {
    try {
      return son()?.efecto(id, pos ? aV(THREE, pos) : null, {
        volumen: 1,
        loop: false,
        radio: 4e3
      }) || null;
    } catch {
      return null;
    }
  };
  function loopDe(o, id, pos) {
    if (o.loop) return;
    try {
      o.loop = son()?.efecto(id, pos ? aV(THREE, pos) : null, {
        volumen: 1,
        loop: true,
        radio: 4e3
      }) || null;
    } catch {
      o.loop = null;
    }
  }
  const pararLoop = o => {
    try {
      o.loop?.parar(.3);
    } catch {}
    o.loop = null;
  };
  const ARMAR = {
    0(w, esc) {
      let creado = false;
      return {
        cuadro() {
          const gr = fx?.grietas;
          if (!gr) return false;
          if (w.estado === 1) {
            if (!creado) {
              const k = Math.max(0, Math.min(3, esc - 1)), L = GRIETA.lugar[k], A = GRIETA.azar[k];
              const p = L.map((x, i) => x + azar01() * A[i]);
              w.pos = [ ...p ];
              w.spot = [ p[0], -50, p[2] ];
              gr.crearGrupo(p, GRIETA.normal[GRIETA.idx[k]], 140, 20, 10);
              creado = true;
            }
            const v = w.nivel * 1e-4, r = v > 0 ? Math.sqrt(v) : 0, rr = r > 0 ? Math.sqrt(r) : 0;
            gr.renovarGrupo((rr * .85 + .15) * .7 * 200, (r * .65 + .35) * .1 * 200, v, 0);
            const d = distCam(w.pos), rad = w.rad;
            for (const inst of gr.instancias) gr.ataque(inst, d < rad ? (rad - d) / rad : 0, 0);
            return true;
          }
          if (w.estado === 2 && creado) {
            gr.desvanecerGrupo(20);
            creado = false;
            return true;
          }
          return false;
        },
        quitar() {
          creado = false;
        }
      };
    },
    6(w, esc) {
      let f = null, cuadro = 0;
      return {
        cuadro() {
          if (w.estado === 1) {
            if (!f && fx) {
              const k = Math.max(0, Math.min(3, esc - 1)), L = FANTASMA.lugar[k], A = FANTASMA.azar[k];
              const p = L.map((x, i) => x + azar01() * A[i]);
              w.pos = [ ...p ];
              w.spot = [ p[0], -50, p[2] ];
              try {
                f = crearFantasmaPared({
                  THREE: THREE,
                  raiz: fx.raiz
                });
                f.cargar();
                f.iniciar({
                  pos: p,
                  normal: FANTASMA.normal[FANTASMA.idx[k]],
                  inicio: 0,
                  pegajoso: 1e9,
                  borrar: -1
                }, () => null);
              } catch (e) {
                console.warn("haunting fantasma", e.message);
                f = null;
              }
              cuadro = 0;
            }
            if (f) {
              f.irA(++cuadro);
              const co = fx?.estado?.niebla;
              if (co !== undefined) f.niebla(co, E);
            }
            return !!f;
          }
          if (w.estado === 2 && f) {
            this.quitar();
            return true;
          }
          return false;
        },
        quitar() {
          try {
            f?.limpiar();
            sacar(f?.grupo);
          } catch {}
          f = null;
        }
      };
    },
    1(w) {
      const partes = [ {
        pm: 19,
        pt: 1,
        pos: [ 900.884, -272.157, -900.884 ]
      }, {
        pm: 20,
        pt: 2,
        pos: [ 637.211, -285.542, -909.525 ]
      } ];
      const objs = partes.map(x => ({
        ...x,
        pj: null,
        paso: 0,
        cuenta: 0,
        tabla: 0,
        i: 0,
        amp: 0,
        ang: 0
      }));
      for (const o of objs) modelo(PHE1, o.pm, o.pt).then(pj => {
        if (this_quitado) {
          pj.dispose();
          return;
        }
        o.pj = pj;
        enSala(pj, o.pos);
      }).catch(e => console.warn("haunting ventana", e.message));
      let this_quitado = false;
      return {
        cuadro() {
          let cambio = false;
          for (const o of objs) {
            if (!o.pj) continue;
            let dy = 0, dx = 0, dz = 0;
            if (w.estado !== 1) {
              if (w.estado === 2) o.paso = 0;
            } else if (o.paso === 0) {
              let c = 64 + rand(128);
              if (w.nivel > 1999) c = c >> 1;
              if (w.nivel > 4999) c = c >> 1;
              if (w.nivel > 7999) c = c >> 1;
              o.cuenta = c;
              o.paso = 1;
            } else if (o.paso === 1) {
              if (--o.cuenta <= 0) {
                const k = 1 - azar01() * azar01();
                if (w.nivel < 6e3) {
                  o.tabla = 1;
                  o.amp = (w.nivel * 1e-4 + .4) * k;
                } else {
                  o.tabla = 0;
                  o.amp = w.nivel * 1e-4 * k;
                }
                o.i = 0;
                sonar(SON.ventana, o.pos);
                o.paso = 2;
              }
            } else if (o.paso === 2) {
              const v = SALTOS[o.tabla][o.i] || 0;
              if (v) {
                dy = v * o.amp;
                dx = azarS();
                dz = azarS();
                o.i++;
                o.ang = azarS() * .0031415927;
              } else {
                o.ang = 0;
                o.paso = 0;
              }
            }
            o.pj.grupo.position.copy(aV(THREE, [ o.pos[0] + dx, o.pos[1] + dy, o.pos[2] + dz ]));
            girarY(o.pj, o.ang);
            cambio = true;
          }
          return cambio;
        },
        quitar() {
          this_quitado = true;
          for (const o of objs) {
            sacar(o.pj?.grupo);
            o.pj?.dispose();
          }
        }
      };
    },
    3(w) {
      const o = {
        pj: null,
        paso: 0,
        cuenta: 0,
        quitado: false
      };
      modelo(PHE2, 2, 0).then(pj => {
        if (o.quitado) {
          pj.dispose();
          return;
        }
        o.pj = pj;
        for (const m of pj.mallas) m.material.blending = THREE.AdditiveBlending;
        enSala(pj);
      }).catch(e => console.warn("haunting cuadro", e.message));
      return {
        cuadro() {
          if (!o.pj) return false;
          if (w.estado !== 1) {
            if (w.estado === 2) o.paso = 0;
            ver(o.pj, false);
            return false;
          }
          if (o.paso === 0) {
            if (o.cuenta++ > 3) o.paso = 1;
          } else if (o.paso === 1) {
            sonar(SON.cuadro, w.pos);
            o.cuenta = 0;
            o.paso = 2;
          }
          let a = Math.trunc(w.nivel * 128 / 1e4) - 32;
          if (o.paso === 2) {
            if (!rand(4)) o.cuenta++;
            a += o.cuenta;
            if (o.cuenta > 63) o.paso = 3;
          } else if (o.paso === 3) {
            if (!rand(4)) o.cuenta--;
            a += o.cuenta;
            if (o.cuenta < 1) {
              sonar(SON.cuadro, w.pos);
              o.paso = 2;
            }
          }
          alfa(o.pj, Math.max(0, Math.min(128, a)));
          ver(o.pj, true);
          return true;
        },
        quitar() {
          o.quitado = true;
          sacar(o.pj?.grupo);
          o.pj?.dispose();
        }
      };
    },
    4(w) {
      const o = {
        pj: null,
        quitado: false
      };
      modeloMundo(PHE1, 18, 15).then(pj => {
        if (o.quitado) {
          pj.dispose();
          return;
        }
        o.pj = pj;
        enSala(pj);
      }).catch(e => console.warn("haunting sofá", e.message));
      return {
        cuadro() {
          if (!o.pj) return false;
          if (w.estado !== 1 && w.estado !== 2) {
            ver(o.pj, false);
            return false;
          }
          let a = 128;
          if (w.sofa === 1) {
            w.sofaAlfa = (w.sofaAlfa || 0) + 1;
            a = w.sofaAlfa;
            if (w.sofaAlfa > 127) {
              w.sofaAlfa = 128;
              w.sofa = 2;
              a = 128;
            }
          }
          const n = Math.max(0, Math.trunc(w.nivel));
          if (n < 2e3) a = Math.trunc(n % 2e3 * 255 / 4e3);
          if (!w.sofa) a = 0;
          alfa(o.pj, a);
          ver(o.pj, a > 0);
          return true;
        },
        quitar() {
          o.quitado = true;
          sacar(o.pj?.grupo);
          o.pj?.dispose();
        }
      };
    },
    5(w) {
      return quieto(w, 34, 17, 2e3, 2e3);
    },
    11(w) {
      const lista = [ [ 25, 7, 1 ], [ 27, 9, 2 ], [ 28, 10, 2 ], [ 29, 11, 2 ], [ 30, 12, 2 ], [ 26, 8, 0 ] ].map(([pm, pt, tipo]) => ({
        pm: pm,
        pt: pt,
        tipo: tipo,
        pj: null
      }));
      let quitado = false;
      for (const z of lista) modelo(PHE1, z.pm, z.pt).then(pj => {
        if (quitado) {
          pj.dispose();
          return;
        }
        z.pj = pj;
        enSala(pj);
      }).catch(e => console.warn("haunting zapatos", e.message));
      return {
        cuadro() {
          for (const z of lista) {
            if (!z.pj) continue;
            if (w.estado !== 1) {
              ver(z.pj, z.tipo === 1);
              continue;
            }
            ver(z.pj, true);
            if (z.tipo === 2 && w.nivel < 2e3) alfa(z.pj, Math.trunc(Math.max(0, w.nivel) * 128 / 4e3)); else alfa(z.pj, 128);
          }
          return true;
        },
        quitar() {
          quitado = true;
          for (const z of lista) {
            sacar(z.pj?.grupo);
            z.pj?.dispose();
          }
        }
      };
    },
    9(w) {
      const o = {
        pj: null,
        paso: 0,
        quitado: false
      };
      modelo(PHE1, 33, 16, 38).then(pj => {
        if (o.quitado) {
          pj.dispose();
          return;
        }
        o.pj = pj;
        enSala(pj);
      }).catch(e => console.warn("haunting tele", e.message));
      return {
        cuadro(dt) {
          if (!o.pj) return false;
          if (w.estado !== 1) {
            if (w.estado === 2) {
              o.paso = 0;
              pararLoop(o);
            }
            ver(o.pj, false);
            return false;
          }
          loopDe(o, SON.tele, w.pos);
          const rep = o.pj.reproductor;
          if (o.paso === 0) {
            if (rep.terminada) ponerAnim(o.pj, PHE1, 38, false);
            if (!(rand(32768) & 510)) o.paso = 1;
          } else if (o.paso === 1) {
            ponerAnim(o.pj, PHE1, 39 + rand(4), false);
            o.paso = 2;
          } else if (o.paso === 2 && rep.terminada) {
            ponerAnim(o.pj, PHE1, 38, false);
            o.paso = 0;
          }
          o.pj.actualizar(dt);
          ver(o.pj, w.nivel > 999 || rand(1e3) < w.nivel);
          return true;
        },
        quitar() {
          o.quitado = true;
          pararLoop(o);
          sacar(o.pj?.grupo);
          o.pj?.dispose();
        }
      };
    },
    10(w) {
      const o = {
        pj: null,
        paso: 0,
        cuenta: 0,
        quitado: false
      };
      modelo(PHE2, 3, 1, 5).then(pj => {
        if (o.quitado) {
          pj.dispose();
          return;
        }
        o.pj = pj;
        enSala(pj);
      }).catch(e => console.warn("haunting sombra", e.message));
      return {
        cuadro(dt) {
          if (!o.pj) return false;
          if (w.estado !== 1) {
            if (w.estado === 2) {
              o.paso = 0;
              pararLoop(o);
            }
            ver(o.pj, false);
            return false;
          }
          loopDe(o, SON.sombra, w.pos);
          const rep = o.pj.reproductor, f = rep.t;
          if (o.paso === 0) {
            if (o.cuenta++ > 3) o.paso = 1;
          } else if (o.paso === 1) o.paso = 2; else if (o.paso === 2) {
            if (f < 1 && !rand(8)) o.paso = 3;
          } else if (o.paso === 3) {
            ponerAnim(o.pj, PHE2, 6 + rand(2), true);
            o.paso = 4;
          } else if (o.paso === 4 && f < 1 && o.vuelta) {
            ponerAnim(o.pj, PHE2, 5, true);
            o.paso = 2;
          }
          const antes = rep.t;
          o.pj.actualizar(dt);
          o.vuelta = rep.anim && rep.t < antes;
          ver(o.pj, true);
          return true;
        },
        quitar() {
          o.quitado = true;
          pararLoop(o);
          sacar(o.pj?.grupo);
          o.pj?.dispose();
        }
      };
    },
    12(w) {
      const o = {
        pj: null,
        quitado: false,
        a1: 0,
        a2: 0
      };
      modelo(PHE1, 21, 3, 35).then(pj => {
        if (o.quitado) {
          pj.dispose();
          return;
        }
        o.pj = pj;
        enSala(pj);
      }).catch(e => console.warn("haunting reloj", e.message));
      return {
        cuadro(dt) {
          if (!o.pj) return false;
          const rep = o.pj.reproductor;
          if (w.estado === 0) {
            o.a1 = o.a2 = 0;
            rep.velocidad = 0;
          } else if (w.estado === 2) {
            pararLoop(o);
            rep.velocidad = 0;
          } else {
            loopDe(o, SON.reloj, w.pos);
            const v = w.nivel * .001;
            rep.velocidad = v;
            if (w.nivel < 5001) {
              o.a1 -= v;
              o.a2 -= v * .0833333358;
            } else {
              o.a1 = azarS() * Math.PI;
              o.a2 = azarS() * Math.PI;
            }
          }
          o.pj.actualizar(dt);
          for (const [h, a] of [ [ 1, o.a1 ], [ 2, o.a2 ] ]) {
            const b = o.pj.huesos[h];
            if (b && a) {
              b.matrix.multiply(_m.makeRotationAxis(EJE_X, a));
              b.matrixWorldNeedsUpdate = true;
            }
          }
          return true;
        },
        quitar() {
          o.quitado = true;
          pararLoop(o);
          sacar(o.pj?.grupo);
          o.pj?.dispose();
        }
      };
    },
    13(w) {
      const A = {
        pj: null
      }, B = {
        pj: null,
        paso: 0
      };
      let quitado = false;
      modelo(PHE1, 23, 5).then(pj => {
        if (quitado) {
          pj.dispose();
          return;
        }
        A.pj = pj;
        enSala(pj);
      }).catch(e => console.warn("haunting heladera", e.message));
      modelo(PHE1, 24, 6, 43).then(pj => {
        if (quitado) {
          pj.dispose();
          return;
        }
        B.pj = pj;
        B.pj.reproductor.loop = false;
        enSala(pj);
      }).catch(e => console.warn("haunting heladera", e.message));
      return {
        cuadro(dt) {
          const act = w.estado === 1;
          if (A.pj) {
            ver(A.pj, act);
            if (act) alfa(A.pj, w.nivel < 1e3 ? Math.trunc(Math.max(0, w.nivel) * 128 / 1e3) : 128);
          }
          if (B.pj) {
            ver(B.pj, act);
            if (!act) {
              if (w.estado === 2) B.paso = 0;
              return false;
            }
            const rep = B.pj.reproductor;
            if (B.paso === 0) {
              if (!(rand(32768) & 510)) B.paso = 1;
            } else if (B.paso === 1) {
              const x = rand(2);
              ponerAnim(B.pj, PHE1, 44 + x, false);
              if (x) sonar(SON.heladera, w.pos);
              B.paso = 2;
            } else if (B.paso === 2 && rep.terminada) {
              ponerAnim(B.pj, PHE1, 43, false);
              B.paso = 0;
            }
            B.pj.actualizar(dt);
            const s = w.nivel < 5e3 ? Math.max(0, w.nivel) * 2e-4 : 1;
            if (s !== 1) for (let h = 0; h < 6; h++) {
              const b = B.pj.huesos[h];
              if (b) {
                b.matrix.multiply(_m.makeScale(s, s, s));
                b.matrixWorldNeedsUpdate = true;
              }
            }
            alfa(B.pj, w.nivel < 2e3 ? Math.trunc(Math.max(0, w.nivel) * 128 / 2e3) : 128);
          }
          return act;
        },
        quitar() {
          quitado = true;
          for (const o of [ A, B ]) {
            sacar(o.pj?.grupo);
            o.pj?.dispose();
          }
        }
      };
    },
    14(w) {
      const objs = [ {
        pm: 31,
        pt: 13,
        a: 36,
        tipo: 0,
        pj: null
      }, {
        pm: 32,
        pt: 14,
        a: 37,
        tipo: 1,
        pj: null
      } ];
      let quitado = false;
      for (const o of objs) modelo(PHE1, o.pm, o.pt, o.a).then(pj => {
        if (quitado) {
          pj.dispose();
          return;
        }
        o.pj = pj;
        enSala(pj);
      }).catch(e => console.warn("haunting pileta", e.message));
      return {
        cuadro(dt) {
          const act = w.estado === 1;
          for (const o of objs) {
            if (!o.pj) continue;
            ver(o.pj, act);
            if (!act) {
              if (o.tipo === 1 && w.estado === 2) pararLoop(o);
              continue;
            }
            o.pj.actualizar(dt);
            const n = Math.max(0, w.nivel);
            if (o.tipo === 1) {
              loopDe(o, SON.pileta, w.pos);
              alfa(o.pj, n < 3e3 ? n < 1068 ? 4 : Math.trunc((n - 1e3) * 128 / 2e3) : 128);
            } else alfa(o.pj, n < 2e3 ? Math.trunc(n * 128 / 2e3) : 128);
          }
          return act;
        },
        quitar() {
          quitado = true;
          for (const o of objs) {
            pararLoop(o);
            sacar(o.pj?.grupo);
            o.pj?.dispose();
          }
        }
      };
    },
    8(w) {
      let munecos = [], quitado = false;
      const o = {
        loop: null
      };
      function armar() {
        const base = [ w.pos[0], w.pos[1] + 70, w.pos[2] + 50 ], lugares = [];
        for (let i = 0; i < 15; i++) {
          let r = 10, intentos = 200, p = null;
          while (intentos--) {
            let dy, dz;
            do {
              dy = azarS() * r;
              dz = azarS() * r;
            } while (dy * dy + dz * dz > r * r);
            const choca = lugares.some(q => Math.abs(base[2] + dz - q[2]) <= 35 && Math.abs(base[1] + dy - q[1]) <= 70);
            p = [ base[0], base[1] + dy, base[2] + dz ];
            if (!choca) break;
            if (r < 150) r += 1;
          }
          lugares.push(p);
        }
        munecos = lugares.map((p, i) => ({
          p: p,
          pj: null,
          paso: 3,
          cuenta: 0,
          i: i
        }));
        for (const m of munecos) modelo(PHE1, 22, 4, 51).then(pj => {
          if (quitado) {
            pj.dispose();
            return;
          }
          m.pj = pj;
          pj.reproductor.loop = false;
          girarY(pj, Math.PI / 2);
          enSala(pj, m.p);
        }).catch(e => console.warn("haunting muñecos", e.message));
      }
      return {
        cuadro(dt) {
          if (w.estado === 1) {
            if (!munecos.length) armar();
            loopDe(o, SON.munecos, w.pos);
          } else if (w.estado === 2 && munecos.length && !munecos[0].saliendo) {
            pararLoop(o);
            munecos.forEach((m, k) => {
              m.saliendo = true;
              m.paso = 10;
              m.cuenta = 290 - k * 10;
            });
          } else if (!munecos.length) return false;
          for (const m of munecos.slice()) {
            if (!m.pj) continue;
            const rep = m.pj.reproductor;
            if (m.paso === 3) {
              if (rep.terminada) m.paso = 2;
            } else if (m.paso === 2) {
              if (!(rand(32768) & 510)) {
                ponerAnim(m.pj, PHE1, 46 + rand(5), false);
                m.paso = 3;
              }
            } else if (m.paso === 10) {
              if (--m.cuenta < 0) {
                m.paso = 11;
                m.cuenta = 0;
              }
            } else if (m.paso === 11) {
              m.pj.grupo.position.copy(aV(THREE, [ m.p[0] + m.cuenta * .5, m.p[1], m.p[2] ]));
              if (--m.cuenta < -80) {
                sacar(m.pj.grupo);
                m.pj.dispose();
                munecos.splice(munecos.indexOf(m), 1);
                continue;
              }
            }
            m.pj.actualizar(dt);
          }
          return true;
        },
        quitar() {
          quitado = true;
          pararLoop(o);
          for (const m of munecos) {
            sacar(m.pj?.grupo);
            m.pj?.dispose();
          }
          munecos = [];
        }
      };
    },
    7(w) {
      const o = {
        paso: 0,
        cuenta: 0,
        loop: null,
        texto: null
      };
      return {
        cuadro() {
          if (w.estado !== 1) {
            if (w.estado === 2) {
              o.paso = 0;
              pararLoop(o);
            }
            return false;
          }
          loopDe(o, SON.telefono, w.pos);
          const libre = !o.texto || o.texto.listo;
          if (o.paso === 0) {
            if (o.cuenta++ > 29) o.paso = 1;
          } else if (o.paso === 1) {
            o.cuenta = 60;
            o.paso = 2;
          } else if (o.paso === 2) {
            if (--o.cuenta < 1 && libre) {
              o.texto = ctxTexto?.(394, 7);
              o.paso = 3;
            }
          } else if (o.paso === 3) {
            if (libre) {
              o.cuenta = 90;
              o.paso = 4;
            }
          } else if (o.paso === 4) {
            if (--o.cuenta < 1 && libre) {
              o.texto = ctxTexto?.(395, 7);
              o.paso = 5;
            }
          } else if (o.paso === 5) {
            if (libre) {
              o.cuenta = 90;
              o.paso = 2;
            }
          }
          return false;
        },
        quitar() {
          pararLoop(o);
          o.texto?.cortar?.();
        }
      };
    }
  };
  function quieto(w, pm, pt, tope, div) {
    const o = {
      pj: null,
      quitado: false
    };
    modelo(PHE1, pm, pt).then(pj => {
      if (o.quitado) {
        pj.dispose();
        return;
      }
      o.pj = pj;
      enSala(pj);
    }).catch(e => console.warn("haunting", pm, e.message));
    return {
      cuadro() {
        if (!o.pj) return false;
        const act = w.estado === 1;
        ver(o.pj, act);
        if (act) alfa(o.pj, w.nivel < tope ? Math.trunc(Math.max(0, w.nivel) * 128 / div) : 128);
        return act;
      },
      quitar() {
        o.quitado = true;
        sacar(o.pj?.grupo);
        o.pj?.dispose();
      }
    };
  }
  async function vela(v) {
    let pj = null;
    try {
      const {b: b, p: p} = await bin("wp_model.bin");
      pj = crearPersonaje(leerModelo(b, p[80].ofs, p[80].len), leerTexturas(b, p[112].ofs, p[112].len));
      pj.grupo.name = "vela bendita";
      pj.grupo.position.copy(aV(THREE, v.pos));
      pj.grupo.children[0].quaternion.copy(QZ).multiply(_q.setFromAxisAngle(EJE_X, Math.PI / 2));
      cuarto.grupo.add(pj.grupo);
      colgados.add(pj.grupo);
    } catch (e) {
      console.warn("vela", e.message);
    }
    let fuego = null;
    try {
      fuego = fx?.fuegos?.vela?.(v.n ?? 0, [ v.pos[0], v.pos[1] - 50, v.pos[2] ]) ?? null;
    } catch {}
    return {
      pj: pj,
      fuego: fuego,
      actualizar(t) {
        if (!pj) return;
        const s = Math.max(0, Math.min(1, (100 - t) * .01));
        pj.grupo.scale.set(1, Math.max(.05, s), 1);
      },
      quitar() {
        sacar(pj?.grupo);
        pj?.dispose();
        try {
          fx?.fuegos?.apagarVela?.(v.n ?? 0);
        } catch {}
      }
    };
  }
  let armados = new Map, ctxTexto = null;
  function alEntrarSala(esc, lista) {
    quitarTodos();
    for (const {n: n, w: w} of lista) {
      const f = ARMAR[n];
      if (!f) continue;
      try {
        armados.set(n, f(w, esc));
      } catch (e) {
        console.warn("haunting", n, e);
      }
    }
  }
  function quitarTodos() {
    for (const a of armados.values()) try {
      a.quitar();
    } catch {}
    armados = new Map;
    colgados.clear();
  }
  function cuadro(dt) {
    let cambio = false;
    for (const g of colgados) if (!g.parent) {
      if (g.userData.quitado) colgados.delete(g); else {
        cuarto.grupo.add(g);
        cambio = true;
      }
    }
    for (const a of armados.values()) try {
      if (a.cuadro(dt)) cambio = true;
    } catch (e) {
      console.warn("haunting cuadro", e);
    }
    if (cambio) M.redibujar?.();
    return cambio;
  }
  return {
    alEntrarSala: alEntrarSala,
    quitarTodos: quitarTodos,
    cuadro: cuadro,
    vela: vela,
    distCam: distCam,
    posCam: posCam,
    set texto(f) {
      ctxTexto = f;
    },
    get armados() {
      return [ ...armados.keys() ];
    }
  };
}
