// SH4 web — FeniXVOID · Project Ravenlight
import * as THREE from "three";

import { iniciarEfectos } from "../efectos/efectos.js";

import { crearFantasmaPared, DEMO47_FANTASMA } from "../efectos/fantasma_pared.js";

import { leerHuesos, nuevaPose } from "../lib/sqt.js";

import { iniciarSonido } from "../sonido/sonido.js";

import { aMundo } from "./cuarto.js";

import { bajar, json, fijarBajar, ponerAtajoBajar, enCacheBajar, precargar, estadoBajar, EQUIPO_CHICO } from "./motor.js";

import { indiceSh4 } from "../lib/remoto.js";

import { factorNiebla, brilloPersonajes } from "../lib/sala.js";

let descargasCompartidas = false;

const rangosPrecargados = new Map;

let fetchPrevio = null;

export function precargarRango(url, desde, hasta) {
  if (!fetchPrevio) return;
  const rango = `bytes=${desde}-${hasta}`, clave = decodeURIComponent(new URL(url, location.href).pathname) + " " + rango;
  if (rangosPrecargados.has(clave)) return;
  const p = fetchPrevio(url, {
    headers: {
      Range: rango
    },
    priority: "low"
  }).then(async r => {
    if (!r.ok) throw new Error("http " + r.status);
    return {
      buf: await r.arrayBuffer(),
      status: r.status,
      tipo: r.headers.get("Content-Type"),
      rango: r.headers.get("Content-Range")
    };
  });
  rangosPrecargados.set(clave, p);
  p.catch(() => {
    if (rangosPrecargados.get(clave) === p) rangosPrecargados.delete(clave);
  });
  setTimeout(() => {
    if (rangosPrecargados.get(clave) === p) rangosPrecargados.delete(clave);
  }, 6e5);
}

export function compartirDescargas() {
  if (descargasCompartidas) return;
  descargasCompartidas = true;
  const previo = fetchPrevio = window.fetch;
  const fijos = new Map, recientes = new Map, DURA = 12e4;
  let dentro = false;
  const copia = d => new Response(d.buf, {
    status: 200,
    headers: d.tipo ? {
      "Content-Type": d.tipo
    } : {}
  });
  ponerAtajoBajar(ruta => {
    const k = "/juego/" + ruta, p = recientes.get(k);
    if (!p) return null;
    recientes.delete(k);
    return p.then(d => d.buf);
  });
  const compartir = (mapa, clave, url, op, dura) => {
    let p = mapa.get(clave);
    if (!p) {
      p = previo(url, op).then(async r => {
        if (!r.ok) throw new Error("http " + r.status);
        return {
          buf: await r.arrayBuffer(),
          tipo: r.headers.get("Content-Type")
        };
      });
      mapa.set(clave, p);
      p.then(() => {
        if (dura) setTimeout(() => {
          if (mapa.get(clave) === p) mapa.delete(clave);
        }, dura);
      }, () => {
        if (mapa.get(clave) === p) mapa.delete(clave);
      });
    }
    return p.then(copia, () => previo(url, op));
  };
  window.fetch = function(url, op) {
    try {
      const h = op && Object.keys(op).length === 1 && op.headers && !(op.headers instanceof Headers) ? op.headers : null;
      if (h && typeof url === "string" && Object.keys(h).length === 1 && h.Range && rangosPrecargados.size) {
        const clave = decodeURIComponent(new URL(url, location.href).pathname) + " " + h.Range, p = rangosPrecargados.get(clave);
        if (p) {
          rangosPrecargados.delete(clave);
          return p.then(d => new Response(d.buf, {
            status: d.status,
            headers: {
              ...d.tipo ? {
                "Content-Type": d.tipo
              } : {},
              ...d.rango ? {
                "Content-Range": d.rango
              } : {}
            }
          }), () => previo(url, op));
        }
      }
      if (!dentro && typeof url === "string" && (op == null || Object.keys(op).length === 1 && op.cache)) {
        const u = new URL(url, location.href);
        if (u.origin === location.origin) {
          const ruta = decodeURIComponent(u.pathname);
          const sala = op == null && /^\/juego\/(data\/[a-z]{2}\d\d[a-z]?\.bin)$/.exec(ruta);
          if (sala) {
            dentro = true;
            try {
              return bajar(sala[1]).then(b => new Response(b));
            } finally {
              dentro = false;
            }
          }
          if (/^\/(datos|camara)\/[^/]+\.json$/.test(ruta)) return compartir(fijos, ruta, url, op, 0);
          if (op == null && ruta.startsWith("/juego/")) {
            const rel = ruta.slice(7);
            if (enCacheBajar(rel)) return bajar(rel).then(b => new Response(b), () => previo(url, op));
            return compartir(recientes, ruta, url, op, DURA);
          }
        }
      }
    } catch {}
    return previo.call(this, url, op);
  };
}

const ESCALA = .005;

export const AMB_PROLOGO = {
  1: [ .5, [ 450, -180, 900 ] ],
  2: [ .2, [ -10, -180, 60 ] ],
  3: [ .1, [ -30, -180, -170 ] ],
  4: [ .25, [ 50, -180, 10 ] ]
};

export const AMB_LIVING = [ 51711, 1, [ 407.09, -240.43, -808.28 ] ];

const PASO_CAMINANDO = .62, PASO_CORRIENDO = .95;

const PASO_MUNDO_CAMINANDO = .83, PASO_MUNDO_CORRIENDO = 1.7;

export async function iniciarAmbiente({M: M, juego: juego, cuarto: cuarto, enPrologo: enPrologo}) {
  const OPC = juego.opciones || {};
  const q = new URLSearchParams(location.search);
  const info = {
    sala: null,
    luces: [],
    niebla: null
  };
  let fx = null;
  if (!q.has("sinefectos")) {
    try {
      fx = iniciarEfectos({
        THREE: THREE,
        renderer: M.renderer,
        escena: M.escena,
        camara: M.camara,
        sala: cuarto.grupo,
        info: info,
        escala: ESCALA
      });
      const ruido = o => typeof o.ruido === "number" ? o.ruido : o.ruido === false ? 0 : 5;
      fx.opciones({
        ruido: ruido(OPC) > 0,
        intensidadRuido: ruido(OPC) / 5,
        colorSangre: OPC.sangre | 0
      });
      if (q.has("ruido")) fx.opciones({
        ruido: +q.get("ruido") > 0,
        intensidadRuido: +q.get("ruido") / 5
      });
      const previo = juego.alCambiarOpciones;
      juego.alCambiarOpciones = o => {
        previo?.(o);
        fx?.opciones({
          ruido: ruido(o) > 0,
          intensidadRuido: ruido(o) / 5,
          colorSangre: o.sangre | 0
        });
      };
    } catch (e) {
      console.warn("efectos", e);
      fx = null;
    }
  }
  let fantasma = null;
  if (fx) {
    try {
      fantasma = crearFantasmaPared({
        THREE: THREE,
        raiz: fx.raiz
      });
      fantasma.cargar();
    } catch (e) {
      console.warn("fantasma", e);
      fantasma = null;
    }
  }
  let son = null;
  if (!q.has("sinsonido")) {
    compartirDescargas();
    try {
      son = await iniciarSonido({
        THREE: THREE,
        camara: M.camara,
        jugador: M.jugador,
        escala: ESCALA,
        ojos: 0,
        renderer: M.renderer
      });
    } catch (e) {
      console.warn("sonido", e);
      son = null;
    }
  }
  const luzOpc = o => {
    factorNiebla((o.niebla ?? 5) / 5);
    brilloPersonajes((o.brilloPersonajes ?? 5) / 5);
  };
  luzOpc(OPC);
  {
    const previo = juego.alCambiarOpciones;
    juego.alCambiarOpciones = o => {
      previo?.(o);
      luzOpc(o);
    };
  }
  const vol = v => Math.max(0, Math.min(1.25, (v ?? 8) / 8));
  son?.volumen({
    musica: vol(OPC.volMus),
    efectos: vol(OPC.volEfe)
  });
  {
    const previo = juego.alCambiarOpciones;
    juego.alCambiarOpciones = o => {
      previo?.(o);
      son?.volumen({
        musica: vol(o.volMus),
        efectos: vol(o.volEfe)
      });
    };
  }
  let ambiente = [], vioLiving = false;
  function pararAmbiente(fundido = .3) {
    for (const h of ambiente) h?.parar(fundido);
    ambiente = [];
  }
  function ponerAmbiente() {
    pararAmbiente(.1);
    if (!son || !enPrologo()) return;
    const esc = +cuarto.escena, a = AMB_PROLOGO[esc];
    if (esc === 1) vioLiving = true;
    if (!a || esc !== 1 && !vioLiving) return;
    ambiente.push(son.efecto(51010, aMundo(a[1]), {
      volumen: a[0],
      loop: true,
      radio: 4e3
    }));
    if (esc === 1) ambiente.push(son.efecto(AMB_LIVING[0], aMundo(AMB_LIVING[2]), {
      volumen: AMB_LIVING[1],
      loop: true,
      radio: 4e3
    }));
  }
  const F = n => !!juego.partida?.banderas?.[n];
  function variante302(base) {
    const D = juego.DATOS || {};
    if (!F(1504)) return {
      rl00: "rl00g",
      rl01: "rl01d"
    }[base] || D.variantes_sala?.prologo?.[base]?.replace(/\.bin.*$/, "") || base + "a";
    for (const o of D.variantes_sala?.por_sala?.[base]?.orden || []) if (!o.si_bandera || F(o.si_bandera)) return o.archivo.replace(/\.bin$/, "");
    return base + "a";
  }
  let lista = null;
  const listaLista = fetch("/juego-lista.json").then(r => r.ok ? r.json() : null).then(j => {
    lista = new Set(j?.data || []);
  }, () => {});
  const CERCA = 6, MAX_VECINAS = EQUIPO_CHICO ? 2 : 4;
  const posH = new THREE.Vector3;
  function posHenry() {
    const g = juego.mundo && !/^(rl|tw)/.test(ultimaAvisada || "") ? juego.mundo.henry?.personaje?.grupo : null;
    if (g) return g.getWorldPosition(posH);
    return M.camara.getWorldPosition(posH);
  }
  function vecinas(nombre) {
    if (!lista?.size) return [];
    const es302 = /^rl/.test(nombre);
    const puertas = es302 ? cuarto.puertas || [] : juego.mundo?.sala === nombre ? juego.mundo.puertas || [] : [];
    const pos = posHenry(), salida = [];
    for (const p of [ ...puertas ].filter(p => p.caja).sort((a, b) => a.caja.distanceToPoint(pos) - b.caja.distanceToPoint(pos))) {
      if (p.caja.distanceToPoint(pos) > CERCA) break;
      const n = p.lleva_a_escena;
      const x = es302 ? n >= 1 && n <= 7 ? variante302("rl0" + (n - 1)) : null : n > 0 ? nombre.slice(0, 2) + String(n).padStart(2, "0") : null;
      if (x && x !== nombre && lista.has(x + ".bin") && !salida.includes("data/" + x + ".bin")) salida.push("data/" + x + ".bin");
      if (salida.length >= MAX_VECINAS) break;
    }
    return salida;
  }
  async function precargaDemo(id) {
    try {
      const [DJ, PC] = await Promise.all([ json("/datos/demos.json"), json("/datos/personajes_cine.json") ]);
      const d = DJ?.demos?.[String(id)];
      if (!d) return [];
      const url = "/juego/" + (d.paquete || "demo/rl.sh4"), nom = "d_" + String(id).padStart(3, "0");
      const paq = await indiceSh4(url);
      for (const ext of [ ".sdm", ".xmd" ]) {
        const e = paq.entradas.find(x => x.nombre === nom + ext);
        if (e && (ext === ".sdm" || e.len > 12)) precargarRango(url, e.ofs, e.ofs + e.len - 1);
      }
      const arch = new Set;
      for (const pid of d.sqt?.personajes || []) {
        const c = PC?.personajes?.[String(pid)];
        for (const a of [ c?.modelo?.archivo, c?.texturas?.archivo ]) if (a) arch.add("data/" + a);
      }
      return [ ...arch ];
    } catch (e) {
      console.warn("precarga demo", id, e.message);
      return [];
    }
  }
  let ultimaAvisada = null, tAvisada = 0, vueltaSala = 0, reloj = null;
  const demosPedidas = new Set;
  function avisarSala(nombre) {
    if (!nombre || nombre === ultimaAvisada && performance.now() - tAvisada < 1500) return;
    ultimaAvisada = nombre;
    tAvisada = performance.now();
    const propia = "data/" + nombre + ".bin";
    fijarBajar("sala", [ propia ]);
    if (!/^(rl|tw)/.test(nombre)) {
      try {
        cuarto.soltarSalas?.();
      } catch (e) {
        console.warn("soltar salas", e);
      }
    }
    clearInterval(reloj);
    if (q.has("sinprecarga")) return;
    const n = ++vueltaSala;
    let demo = [], antes = "";
    const pedidasSala = new Set;
    const mirar = async () => {
      if (n !== vueltaSala || juego.demoActual) return;
      if (nombre === "rl00g" && !F(1504) && !F(1503) && !juego.hablando && !demosPedidas.has(47)) {
        demosPedidas.add(47);
        demo = await precargaDemo(47);
        antes = null;
        if (n !== vueltaSala) return;
      }
      if (juego.mundo?.sala === nombre && !juego.hablando) {
        const ids = [];
        for (const o of juego.mundo.eventos || []) {
          const d = o.ev?.demo, b = /^!F(\d+)/.exec(o.ev?.cond || "")?.[1];
          if (d && !(b && F(+b)) && !ids.includes(d)) ids.push(d);
        }
        for (const id of ids.slice(0, EQUIPO_CHICO ? 1 : 3)) {
          if (pedidasSala.has(id)) continue;
          pedidasSala.add(id);
          demo.push(...await precargaDemo(id));
          antes = null;
          if (n !== vueltaSala) return;
        }
      }
      const v = vecinas(nombre), clave = v.join() + "|" + demo.join();
      if (clave === antes) return;
      antes = clave;
      fijarBajar("sala", [ propia, ...demo, ...v ]);
      precargar([ ...demo, ...v ]);
    };
    setTimeout(async () => {
      if (n !== vueltaSala) return;
      await listaLista;
      if (n !== vueltaSala) return;
      antes = null;
      await mirar();
      if (n === vueltaSala) reloj = setInterval(mirar, 2e3);
    }, 1500);
  }
  if (fx) {
    const orig = fx.alCargarSala;
    fx.alCargarSala = (nombre, ...a) => {
      avisarSala(nombre ?? info.sala);
      return orig(nombre, ...a);
    };
  }
  if (son) {
    const orig = son.alCargarSala;
    son.alCargarSala = (nombre, ...a) => {
      avisarSala(nombre);
      return orig(nombre, ...a);
    };
  }
  juego.memoria = () => ({
    bajar: estadoBajar(),
    salas302: cuarto.salasArmadas?.() || []
  });
  cuarto.alCargar = (s, nombre) => {
    info.sala = nombre;
    info.luces = s.luces || [];
    info.niebla = s.niebla || null;
    try {
      fx?.alCargarSala(nombre);
    } catch (e) {
      console.warn("efectos sala", e);
    }
    son?.alCargarSala(nombre).catch?.(() => {});
    ponerAmbiente();
  };
  const centro = p => p?.caja ? p.caja.getCenter(new THREE.Vector3) : null;
  function puerta(p, accion) {
    if (!son || !p || !p.material || p.material === "NONE") return null;
    return son.puerta(p.material, accion, centro(p));
  }
  const antes = new THREE.Vector3, ahora = new THREE.Vector3, lado = new THREE.Vector3, ARRIBA = new THREE.Vector3(0, 1, 0);
  let andado = 0, hayAntes = false, pasosDados = 0, pie = 1;
  function pasos(dt, teclas) {
    if (!son) return;
    M.camara.getWorldPosition(ahora);
    ahora.y = 0;
    const libre = M.control.mirarLibre && !juego.hablando && !juego.demoActual;
    if (!libre || !hayAntes) {
      antes.copy(ahora);
      hayAntes = true;
      andado = 0;
      return;
    }
    const d = ahora.distanceTo(antes);
    antes.copy(ahora);
    if (d > Math.max(.5, (dt || 0) * 6) || d < 1e-4) {
      if (d >= 1e-4) andado = 0;
      return;
    }
    const corre = !!(teclas?.ShiftLeft || teclas?.ShiftRight || teclas?.CorrerVR);
    son.corriendo(corre);
    andado += d;
    const mundo = !!info.sala && !/^(rl|tw|tx)/.test(info.sala);
    const largo = mundo ? corre ? PASO_MUNDO_CORRIENDO : PASO_MUNDO_CAMINANDO : corre ? PASO_CORRIENDO : PASO_CAMINANDO;
    if (andado >= largo) {
      andado -= largo;
      pie = -pie;
      M.camara.getWorldDirection(lado);
      lado.y = 0;
      lado.normalize().cross(ARRIBA).multiplyScalar(mundo ? .12 * pie : 0);
      const pj = [ -(ahora.x + lado.x) / ESCALA, -M.jugador.position.y / ESCALA, (ahora.z + lado.z) / ESCALA ];
      if (mundo) {
        const [mm, v] = son.materialPaso ? son.materialPaso(pj) : [ son.materialEn(pj), 1 ];
        if (mm) {
          son.paso(mm, {
            volumen: v
          });
          pasosDados++;
        }
        return;
      }
      const m = son.materialEn(pj);
      if (m) son.paso(m, {
        volumen: corre ? 1 : .8
      }); else if (!q.has("pasosoriginales")) son.paso("alfombra", {
        volumen: corre ? .7 : .55
      });
      pasosDados++;
    }
  }
  let segAntes = null;
  function demoEmpieza(D) {
    juego.musica?.parar(2);
    son?.cinematica(true);
    segAntes = 0;
    if (D.id === 47) {
      pararAmbiente(.1);
      try {
        fx?.disparar("grietas_demo47");
      } catch (e) {
        console.warn("grietas", e);
      }
      const k = D.sqt.modelos.findIndex(m => m.id === DEMO47_FANTASMA.personaje);
      const pose = k >= 0 ? nuevaPose(D.sqt.modelos[k]) : null;
      let cuadroPose = -1;
      const huesos = (cuadro, h) => {
        if (!pose) return null;
        const f = Math.max(0, Math.min(D.sqt.n - 1, cuadro));
        if (f !== cuadroPose) {
          leerHuesos(D.sqt, D.sqt.modelos[k], f, pose);
          cuadroPose = f;
        }
        return pose.tiene[h] ? [ pose.pos[h * 3], pose.pos[h * 3 + 1], pose.pos[h * 3 + 2] ] : null;
      };
      try {
        fantasma?.iniciar(DEMO47_FANTASMA, huesos);
      } catch (e) {
        console.warn("fantasma", e);
      }
    }
  }
  function demoTermina(D) {
    son?.cinematica(false);
    segAntes = null;
    if (D?.id === 47) {
      fantasma?.limpiar();
      try {
        fx?.disparar("ruido", {
          valores: null
        });
      } catch {}
      juego.foco?.borroso(0);
    }
  }
  function cuadroDemo47(D) {
    const c = D.seg * 30, largo = D.sqt.n - 1;
    fantasma?.irA(c);
    const co = fantasma ? fx?.estado?.niebla : undefined;
    if (co !== undefined) fantasma.niebla(co, ESCALA);
    const f = Math.floor(c);
    if (f + 1700 >= largo) {
      const v = Math.trunc((f - largo + 1700) * .0754) || 1;
      try {
        fx?.disparar("ruido", {
          valores: [ v, v, v, 0, v ]
        });
      } catch {}
    }
    juego.foco?.borroso(f >= 200 && !M.enVR() ? Math.min(f - 200, 50) / 128 : 0);
  }
  M.tareas.add((dt, {teclas: teclas}) => {
    const D = juego.demoActual;
    let dFx = dt;
    if (D && D.seg != null && segAntes != null) {
      dFx = Math.max(0, D.seg - segAntes);
      segAntes = D.seg;
    }
    if (D?.id === 47 && D.seg != null) {
      try {
        cuadroDemo47(D);
      } catch (e) {
        console.warn("d_047", e);
      }
    }
    try {
      fx?.actualizar(dFx);
    } catch (e) {
      console.warn("efectos", e);
    }
    son?.actualizar(dt);
    pasos(dt, teclas);
    return false;
  });
  return {
    fx: fx,
    son: son,
    info: info,
    fantasma: fantasma,
    puerta: puerta,
    pararAmbiente: pararAmbiente,
    ponerAmbiente: ponerAmbiente,
    demoEmpieza: demoEmpieza,
    demoTermina: demoTermina,
    ruidoCaja() {
      return son?.efecto(50003, aMundo([ 662.8, -248.7, -355.9 ]), {
        volumen: 1,
        radio: 4e3
      });
    },
    estado() {
      return {
        efectos: fx?.estado || null,
        sonido: son?.estado?.() || null,
        ambiente: ambiente.length,
        pasos: pasosDados
      };
    }
  };
}
