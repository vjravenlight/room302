// SH4 web — FeniXVOID · Project Ravenlight
import { MotorSdb } from "./motor_sdb.js";

import { leerSdb, leerSdpa, leerWav, MATERIALES, visorAJuego, salaAEscena } from "./formatos.js";

import { decodificarXmd } from "../lib/xmd.js";

import { partesBin } from "../lib/sh4bin.js";

import { leerColision } from "../lib/colision.js";

const ACCIONES_PUERTA = {
  abrir: 0,
  cerrar: 1
};

const SDB_DEL_JUEGO = new Set([ "bd", "bd_lh", "cm", "fr", "fr_lh", "gt", "hs", "ie", "ls", "mz", "mz_lh", "rl", "sb", "sb_lh", "st" ]);

const RADIO_ENEMIGO = 4e3;

const UMBRAL_PIE = 9, UMBRAL_PIE_CORRER = 28;

const NUMERO_PC = {
  60011: 60001,
  60012: 60001
};

const FOOT_SE = [ 0, 40010, 40014, 40013, 40012, 40015, 40016, 40017, 40018, 40019, 0, 40011, 40020, 0, 40054, 0 ];

const SIN_SUSTITUTO = typeof location !== "undefined" && new URLSearchParams(location.search).has("pasosoriginales");

export async function iniciarSonido({THREE: THREE, camara: camara, jugador: jugador, escala: escala = .005, ojos: ojos = 1.6, base: base = "", datos: datos = null, henry: henry = null, hrtf: hrtf = true, renderer: renderer = null} = {}) {
  const D = datos || await (await fetch(base + "/datos/sonido.json")).json();
  const Ctx = globalThis.AudioContext || globalThis.webkitAudioContext;
  const ctx = new Ctx({
    latencyHint: "interactive"
  });
  const maestro = ctx.createGain();
  maestro.connect(ctx.destination);
  const analizador = ctx.createAnalyser();
  analizador.fftSize = 2048;
  maestro.connect(analizador);
  const busMusica = ctx.createGain(), busEfectos = ctx.createGain();
  busMusica.connect(maestro);
  busEfectos.connect(maestro);
  const reverb = ctx.createConvolver(), envioReverb = ctx.createGain();
  envioReverb.gain.value = 0;
  envioReverb.connect(reverb);
  reverb.connect(maestro);
  busEfectos.connect(envioReverb);
  reverb.buffer = impulso(2.2);
  function impulso(seg) {
    const n = Math.floor(ctx.sampleRate * seg), b = ctx.createBuffer(2, n, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = b.getChannelData(c);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3.2);
    }
    return b;
  }
  let desbloqueado = ctx.state === "running";
  const desbloquear = () => {
    if (ctx.state !== "running") ctx.resume().then(() => {
      desbloqueado = true;
    }).catch(() => {}); else desbloqueado = true;
  };
  const gestos = [ "pointerdown", "keydown", "touchend", "mousedown" ];
  const alGesto = () => {
    desbloquear();
    if (desbloqueado) gestos.forEach(g => removeEventListener(g, alGesto, true));
  };
  if (typeof addEventListener === "function") gestos.forEach(g => addEventListener(g, alGesto, true));
  renderer?.xr?.addEventListener?.("sessionstart", desbloquear);
  async function rango(ruta, a, b) {
    const r = await fetch(base + "/juego/" + ruta, {
      headers: {
        Range: `bytes=${a}-${b}`
      }
    });
    if (!r.ok) throw new Error("no pude leer " + ruta);
    const total = +((r.headers.get("Content-Range") || "").split("/")[1] || 0);
    const buf = await r.arrayBuffer();
    return {
      buf: r.status === 206 ? buf : buf.slice(a, b + 1),
      total: total || buf.byteLength
    };
  }
  const memo = f => {
    const m = new Map;
    return k => {
      if (!m.has(k)) m.set(k, f(k).catch(e => {
        m.delete(k);
        throw e;
      }));
      return m.get(k);
    };
  };
  const indicePac = memo(async pac => {
    try {
      const {buf: buf} = await rango("sound/" + pac, 0, 7);
      const n = new DataView(buf).getUint32(4, true);
      return leerSdpa((await rango("sound/" + pac, 0, 8 + 12 * n - 1)).buf);
    } catch (e) {
      if (pac === "sound.pac") return D.wav.map(w => ({
        ofs: w.ofs,
        bytes: w.bytes,
        loopOfs: w.loop_ofs
      }));
      return D.seq_pac[pac].map(w => ({
        ofs: w.ofs,
        bytes: w.bytes,
        loopOfs: w.loop_ofs
      }));
    }
  });
  const wavDePac = memo(async clave => {
    const [pac, i] = clave.split("#");
    const e = (await indicePac(pac))[+i];
    const {buf: buf} = await rango("sound/" + pac, e.ofs, e.ofs + e.bytes - 1);
    return leerWav(new Uint8Array(buf), e.loopOfs);
  });
  const bufferSe = memo(async clave => {
    const [i, hz] = clave.split("@");
    const w = await wavDePac("sound.pac#" + i);
    const ab = ctx.createBuffer(w.canales.length, w.canales[0].length, +hz || w.frecuencia);
    w.canales.forEach((c, k) => ab.copyToChannel(c, k));
    return {
      ab: ab,
      loopea: w.loopea,
      loopInicio: w.loopInicio / (+hz || w.frecuencia)
    };
  });
  const directorio = memo(async paq => {
    const {buf: buf, total: total} = await rango("demo/" + paq, 0, 7);
    const n = new DataView(buf).getUint32(4, true);
    const ent = new DataView((await rango("demo/" + paq, 0, 8 + 8 * n - 1)).buf);
    const nom = new Uint8Array((await rango("demo/" + paq, total - 16 * n, total - 1)).buf);
    const dir = new Map;
    for (let k = 0; k < n; k++) {
      let s = "";
      for (let j = 0; j < 16 && nom[16 * k + j]; j++) s += String.fromCharCode(nom[16 * k + j]);
      const e = {
        ofs: ent.getUint32(8 + 8 * k, true),
        len: ent.getUint32(12 + 8 * k, true)
      };
      dir.set(s, e);
      dir.set("#" + k, e);
    }
    return dir;
  });
  const indiceXmd = (paq, no) => paq === "bgm.sh4" && no >= 1e4 && no < 2e4 ? no - 1e4 : paq === "bgm.sh4" && no >= 3e4 && no < 4e4 ? no - 3e4 : paq === "se.sh4" && no >= 2e4 && no < 3e4 ? no - 2e4 : null;
  const cacheXmd = new Map;
  async function bufferXmd(no) {
    if (cacheXmd.has(no)) {
      const v = cacheXmd.get(no);
      cacheXmd.delete(no);
      cacheXmd.set(no, v);
      return v;
    }
    const p = (async () => {
      for (const paq of no >= 2e4 && no < 3e4 ? [ "se.sh4", "bgm.sh4" ] : [ "bgm.sh4", "se.sh4" ]) {
        const dir = await directorio(paq), k = indiceXmd(paq, no);
        const e = dir.get(no + ".xmd") || (k != null ? dir.get("#" + k) : null);
        if (!e || e.len <= 12) continue;
        const {buf: buf} = await rango("demo/" + paq, e.ofs, e.ofs + e.len - 1);
        const a = decodificarXmd(new Uint8Array(buf));
        if (!a) continue;
        const ab = ctx.createBuffer(a.canales.length, a.canales[0].length, a.frecuencia);
        a.canales.forEach((c, k) => ab.copyToChannel(c, k));
        return {
          ab: ab,
          loopea: a.loop,
          loopInicio: a.loopInicio / a.frecuencia
        };
      }
      throw new Error(`no encontré ${no}.xmd`);
    })();
    cacheXmd.set(no, p);
    while (cacheXmd.size > 6) cacheXmd.delete(cacheXmd.keys().next().value);
    p.catch(() => cacheXmd.delete(no));
    return p;
  }
  const L = ctx.listener, vPos = new THREE.Vector3, vAde = new THREE.Vector3, vArr = new THREE.Vector3, q = new THREE.Quaternion;
  function ponerOyente() {
    const cam = enVR() && globalThis.window?.sh4?.oyenteCasco || camara;
    cam.updateMatrixWorld?.();
    cam.matrixWorld.decompose(vPos, q, vArr);
    vAde.set(0, 0, -1).applyQuaternion(q);
    vArr.set(0, 1, 0).applyQuaternion(q);
    const t = ctx.currentTime;
    if (L.positionX) {
      L.positionX.setTargetAtTime(vPos.x, t, .02);
      L.positionY.setTargetAtTime(vPos.y, t, .02);
      L.positionZ.setTargetAtTime(vPos.z, t, .02);
      L.forwardX.setTargetAtTime(vAde.x, t, .02);
      L.forwardY.setTargetAtTime(vAde.y, t, .02);
      L.forwardZ.setTargetAtTime(vAde.z, t, .02);
      L.upX.setTargetAtTime(vArr.x, t, .02);
      L.upY.setTargetAtTime(vArr.y, t, .02);
      L.upZ.setTargetAtTime(vArr.z, t, .02);
    } else {
      L.setPosition(vPos.x, vPos.y, vPos.z);
      L.setOrientation(vAde.x, vAde.y, vAde.z, vArr.x, vArr.y, vArr.z);
    }
  }
  const enVR = () => !!renderer?.xr?.isPresenting;
  const sonando = new Set;
  const aVector = p => !p ? null : p.isVector3 ? p : Array.isArray(p) ? new THREE.Vector3(p[0], p[1], p[2]) : p.isObject3D ? p.getWorldPosition(new THREE.Vector3) : null;
  function nodoSalida(posicion, radioJuego, pan) {
    const v = aVector(posicion);
    if (v) {
      const pn = ctx.createPanner();
      pn.panningModel = hrtf || enVR() ? "HRTF" : "equalpower";
      pn.distanceModel = "linear";
      pn.refDistance = .25;
      pn.maxDistance = Math.max(.5, radioJuego * escala);
      pn.rolloffFactor = 1;
      if (pn.positionX) {
        pn.positionX.value = v.x;
        pn.positionY.value = v.y;
        pn.positionZ.value = v.z;
      } else pn.setPosition(v.x, v.y, v.z);
      pn.connect(busEfectos);
      return pn;
    }
    const sp = ctx.createStereoPanner();
    sp.pan.value = pan;
    sp.connect(busEfectos);
    return sp;
  }
  function moverNodos(posicion) {
    const v = aVector(posicion);
    if (!v) return;
    const t = ctx.currentTime;
    for (const pn of this.nodos) if (pn.positionX) {
      pn.positionX.setTargetAtTime(v.x, t, .02);
      pn.positionY.setTargetAtTime(v.y, t, .02);
      pn.positionZ.setTargetAtTime(v.z, t, .02);
    } else pn.setPosition?.(v.x, v.y, v.z);
  }
  function efecto(id, posicion = null, {volumen: volumen = 1, loop: loop = null, radio: radio = RADIO_ENEMIGO, tono: tono = 0, etapa: etapa = null} = {}) {
    id = +id;
    if (!id) return null;
    id = NUMERO_PC[id] ?? id;
    if (id >= 43e3 && id <= 43006) return null;
    const fila = etapa === "hs" && D.se_hs?.[id] || D.se[id];
    if (!fila && id >= 4e4) return {
      id: id,
      mudo: true,
      fuentes: [],
      nodos: [],
      mover() {},
      parar() {}
    };
    if (!fila) return efectoXmd(id, posicion, {
      volumen: volumen,
      loop: loop,
      radio: radio
    });
    const mando = {
      id: id,
      fuentes: [],
      nodos: [],
      mover: moverNodos,
      parar(fundido = .05) {
        this.parado = true;
        for (const f of this.fuentes) {
          try {
            f.g.gain.setTargetAtTime(0, ctx.currentTime, fundido / 3);
            f.s.stop(ctx.currentTime + fundido);
          } catch {}
        }
        sonando.delete(this);
      }
    };
    const ganancia = Math.max(0, fila.vol) / 127 * volumen;
    for (const capa of fila.capas) {
      bufferSe(capa.wav + "@" + capa.hz).then(({ab: ab, loopea: loopea, loopInicio: loopInicio}) => {
        if (mando.parado) return;
        const s = ctx.createBufferSource();
        s.buffer = ab;
        s.loop = loop ?? loopea;
        if (s.loop) {
          s.loopStart = loopInicio;
          s.loopEnd = ab.duration;
        }
        if (tono) s.playbackRate.value = Math.pow(2, tono / 12);
        const g = ctx.createGain();
        g.gain.value = ganancia;
        const nodo = nodoSalida(posicion, radio, (capa.pan - 64) / 64);
        mando.nodos.push(nodo);
        s.connect(g);
        g.connect(nodo);
        s.onended = () => {
          g.disconnect();
          nodo.disconnect();
          mando.fuentes = mando.fuentes.filter(f => f.s !== s);
          if (!mando.fuentes.length) sonando.delete(mando);
        };
        s.start();
        mando.fuentes.push({
          s: s,
          g: g
        });
      }).catch(e => console.warn("sonido", id, e.message));
    }
    sonando.add(mando);
    return mando;
  }
  function efectoXmd(id, posicion, {volumen: volumen = 1, loop: loop = null, radio: radio = RADIO_ENEMIGO} = {}) {
    const mando = {
      id: id,
      fuentes: [],
      nodos: [],
      mover: moverNodos,
      parar(f = .1) {
        this.parado = true;
        for (const x of this.fuentes) {
          try {
            x.g.gain.setTargetAtTime(0, ctx.currentTime, f / 3);
            x.s.stop(ctx.currentTime + f);
          } catch {}
        }
        sonando.delete(this);
      }
    };
    bufferXmd(id).then(({ab: ab, loopea: loopea, loopInicio: loopInicio}) => {
      if (mando.parado) return;
      const s = ctx.createBufferSource();
      s.buffer = ab;
      s.loop = loop ?? loopea;
      if (s.loop) {
        s.loopStart = loopInicio;
        s.loopEnd = ab.duration;
      }
      const g = ctx.createGain();
      g.gain.value = volumen;
      const nodo = nodoSalida(posicion, radio, 0);
      mando.nodos.push(nodo);
      s.connect(g);
      g.connect(nodo);
      s.start();
      s.onended = () => {
        g.disconnect();
        nodo.disconnect();
        sonando.delete(mando);
      };
      mando.fuentes.push({
        s: s,
        g: g
      });
    }).catch(e => {
      console.warn("sonido", id, e.message);
      sonando.delete(mando);
    });
    sonando.add(mando);
    return mando;
  }
  const pistas = [ 0, 1 ].map(() => ({
    g: null,
    s: null,
    no: -1,
    pedido: 0
  }));
  const salida = {
    tocar(t, no, vol) {
      const p = pistas[t];
      salida.parar(t);
      p.no = no;
      const pedido = ++p.pedido;
      p.g = ctx.createGain();
      p.g.gain.value = vol;
      p.g.connect(busMusica);
      bufferXmd(no).then(({ab: ab, loopea: loopea, loopInicio: loopInicio}) => {
        if (pedido !== p.pedido) return;
        const s = ctx.createBufferSource();
        s.buffer = ab;
        s.loop = loopea;
        if (loopea) {
          s.loopStart = loopInicio;
          s.loopEnd = ab.duration;
        }
        s.connect(p.g);
        s.start();
        p.s = s;
        s.onended = () => {
          if (p.s === s) {
            p.s = null;
            motor.terminado(t);
          }
        };
      }).catch(e => console.warn("música", no, e.message));
    },
    parar(t) {
      const p = pistas[t];
      p.pedido++;
      if (p.s) {
        try {
          p.s.onended = null;
          p.s.stop();
        } catch {}
      }
      if (p.g) p.g.disconnect();
      p.s = null;
      p.g = null;
      p.no = -1;
    },
    volumen(t, v) {
      const p = pistas[t];
      if (p.g) p.g.gain.setTargetAtTime(v, ctx.currentTime, .03);
    },
    tocarSecuencia(def) {
      secuencia.tocar(def).catch(e => console.warn("secuencia", def.id, e.message));
    },
    pararSecuencia() {
      secuencia.parar();
    },
    volumenCapa(k, v) {
      secuencia.volumen(k, v);
    },
    seArea(r) {
      seArea(r);
    }
  };
  const secuencia = {
    capas: [],
    pedido: 0,
    async tocar(def) {
      this.parar();
      const pedido = ++this.pedido;
      const ind = await indicePac(def.pac);
      const ws = await Promise.all(ind.map((e, k) => wavDePac(def.pac + "#" + k)));
      if (pedido !== this.pedido) return;
      const t0 = ctx.currentTime + .05;
      this.capas = ws.map(w => {
        const ab = ctx.createBuffer(w.canales.length, w.canales[0].length, w.frecuencia);
        w.canales.forEach((c, k) => ab.copyToChannel(c, k));
        const s = ctx.createBufferSource();
        s.buffer = ab;
        s.loop = true;
        s.loopStart = w.loopInicio / w.frecuencia;
        s.loopEnd = ab.duration;
        const g = ctx.createGain();
        g.gain.value = 0;
        s.connect(g);
        g.connect(busMusica);
        s.start(t0);
        return {
          s: s,
          g: g
        };
      });
    },
    parar() {
      this.pedido++;
      for (const c of this.capas) {
        try {
          c.s.stop();
        } catch {}
        c.g.disconnect();
      }
      this.capas = [];
    },
    volumen(k, v) {
      const c = this.capas[k];
      if (c) c.g.gain.setTargetAtTime(v, ctx.currentTime, .03);
    }
  };
  const sesArea = new Map;
  function seArea(r) {
    if (sesArea.has(r) || sesArea.size >= 4) return;
    const [x0, z0, x1, z1, , ymax] = r.area;
    const pos = [ -(x0 + x1) / 2 * escala, -ymax * escala, (z0 + z1) / 2 * escala ];
    sesArea.set(r, efecto(r.no, pos, {
      volumen: r.vol || 1,
      loop: true,
      radio: Math.hypot(x1 - x0, z1 - z0) / 2
    }));
  }
  const motor = new MotorSdb({
    fundidos: D.fundidos_seg,
    prioridad: D.prioridad_fundido,
    salida: salida
  });
  let pisos = null;
  async function cargarPisos(sala) {
    pisos = null;
    try {
      const buf = await (await fetch(base + "/juego/data/" + sala + ".bin")).arrayBuffer();
      const tam = 400, celdas = new Map;
      for (const p of partesBin(buf)) {
        if (p.tipo !== "colision") continue;
        const c = leerColision(buf, p.ofs, p.len);
        for (const poli of c?.polis || []) {
          const v = poli.v, n = v.length / 3;
          if (n < 3) continue;
          const ax = v[3] - v[0], ay = v[4] - v[1], az = v[5] - v[2], bx = v[6] - v[0], by = v[7] - v[1], bz = v[8] - v[2];
          const nx = ay * bz - az * by, ny = az * bx - ax * bz, nz = ax * by - ay * bx, nl = Math.hypot(nx, ny, nz) || 1;
          if (Math.abs(ny / nl) < .5) continue;
          let mnx = Infinity, mxx = -Infinity, mnz = Infinity, mxz = -Infinity;
          for (let k = 0; k < n; k++) {
            mnx = Math.min(mnx, v[3 * k]);
            mxx = Math.max(mxx, v[3 * k]);
            mnz = Math.min(mnz, v[3 * k + 2]);
            mxz = Math.max(mxz, v[3 * k + 2]);
          }
          const ent = {
            v: v,
            n: n,
            material: poli.material,
            plano: [ nx / nl, ny / nl, nz / nl, -(nx * v[0] + ny * v[1] + nz * v[2]) / nl ]
          };
          for (let cx = Math.floor(mnx / tam); cx <= Math.floor(mxx / tam); cx++) for (let cz = Math.floor(mnz / tam); cz <= Math.floor(mxz / tam); cz++) {
            const k = cx + "," + cz;
            if (!celdas.has(k)) celdas.set(k, []);
            celdas.get(k).push(ent);
          }
        }
      }
      const cuenta = {};
      for (const l of celdas.values()) for (const e of l) if (e.material && FOOT_SE[e.material]) cuenta[e.material] = (cuenta[e.material] || 0) + 1;
      const comun = +(Object.entries(cuenta).sort((a, b) => b[1] - a[1])[0]?.[0] || 1);
      pisos = {
        celdas: celdas,
        tam: tam,
        comun: comun
      };
    } catch (e) {
      console.warn("sonido: sin colisión para", sala, e.message);
    }
  }
  function materialEn(posJuego) {
    if (!pisos) return null;
    const [x, y, z] = posJuego, lista = pisos.celdas.get(Math.floor(x / pisos.tam) + "," + Math.floor(z / pisos.tam));
    let mejor = null, dmin = 100;
    for (const e of lista || []) {
      let dentro = false;
      for (let i = 0, j = e.n - 1; i < e.n; j = i++) {
        const xi = e.v[3 * i], zi = e.v[3 * i + 2], xj = e.v[3 * j], zj = e.v[3 * j + 2];
        if (zi > z !== zj > z && x < (xj - xi) * (z - zi) / (zj - zi) + xi) dentro = !dentro;
      }
      if (!dentro) continue;
      const [a, b, c, d] = e.plano, py = -(a * x + c * z + d) / b, dist = Math.abs(py - y);
      if (dist < dmin - 1 || dist <= dmin + 1 && (mejor == null || !mejor && e.material)) {
        dmin = Math.min(dmin, dist);
        mejor = e.material;
      }
    }
    return mejor;
  }
  let etapa = null, escena = 0, sala = null, mitad = 1;
  const posJuego = () => {
    const p = jugador.getWorldPosition ? jugador.getWorldPosition(new THREE.Vector3) : jugador.position;
    return visorAJuego([ p.x, p.y - ojos, p.z ], escala);
  };
  function materialPaso(pj) {
    if (!pisos) return [ 1, 1 ];
    const m = materialEn(pj);
    if (m && FOOT_SE[m]) return [ m, 1 ];
    if (SIN_SUSTITUTO || etapa === "rl") return [ 0, 0 ];
    return [ pisos.comun || 1, .7 ];
  }
  function paso(material, {volumen: volumen = 1, posicion: posicion = null} = {}) {
    let m = typeof material === "number" ? material : MATERIALES.indexOf(material);
    if (m < 0 || material == null) m = materialEn(posJuego()) ?? 1;
    let id = FOOT_SE[m] ?? D.pasos[MATERIALES[m]];
    if (etapa === "hs" && escena === 12) id = D.pasos_especiales.hs12;
    if (!id) return null;
    return efecto(id, posicion, {
      volumen: volumen
    });
  }
  const pies = [ {
    hueso: 22,
    mat: 4,
    abajo: false,
    t: -9
  }, {
    hueso: 24,
    mat: 7,
    abajo: false,
    t: -9
  } ];
  const SUBIR_PIE = 6, MIN_MISMO_PIE = .25, MIN_ENTRE_PASOS = .14;
  const vh = new THREE.Vector3, vm = new THREE.Vector3;
  let corriendo = false, reloj = 0, ultimoPaso = -9, pasosDados = 0;
  function pasosPorHuesos(dt) {
    reloj += dt;
    const h = henry || globalThis.window?.sh4?.henry;
    const huesos = h?.personaje?.huesos;
    if (!huesos?.length || h?.personaje?.grupo?.visible === false) {
      for (const p of pies) p.abajo = true;
      return;
    }
    const pisoY = (jugador.getWorldPosition ? jugador.getWorldPosition(vh).y : jugador.position.y) - ojos;
    const est = h.controlador?.s?.estado, remate = est === 5 || est === 6;
    let sono = false;
    pies.forEach((pie, k) => {
      const b = huesos[pie.hueso];
      if (!b) return;
      b.getWorldPosition(vh);
      const alto = (vh.y - pisoY) / escala, umbral = k === 0 && remate ? UMBRAL_PIE_CORRER : UMBRAL_PIE;
      if (!pie.abajo && alto < umbral) {
        pie.abajo = true;
        if (!sono && reloj - pie.t >= MIN_MISMO_PIE && reloj - ultimoPaso >= MIN_ENTRE_PASOS) {
          sono = true;
          pie.t = ultimoPaso = reloj;
          (huesos[pie.mat] || b).getWorldPosition(vm);
          const [m, v] = materialPaso(visorAJuego([ vm.x, vh.y, vm.z ], escala));
          if (m) {
            paso(m, {
              volumen: v
            });
            pasosDados++;
          }
        }
      } else if (pie.abajo && alto > umbral + SUBIR_PIE) pie.abajo = false;
    });
  }
  function ponerReverb() {
    const r = D.reverb.find(x => x.etapa === etapa && x.escena === escena) || D.reverb.find(x => x.etapa === etapa && x.escena === -1) || D.reverb[D.reverb.length - 1];
    envioReverb.gain.setTargetAtTime(etapa === "rl" ? .04 : Math.min(.5, r.profundidad / 127 * 1.2), ctx.currentTime, .2);
  }
  const sdbCargados = new Map;
  async function alCargarSala(nombre, {mitad: m = 1} = {}) {
    const es = salaAEscena(nombre);
    sala = nombre;
    if (!es) return;
    const nuevaEtapa = es.etapa !== etapa || m !== mitad;
    etapa = es.etapa;
    mitad = m;
    const pisosListos = cargarPisos(nombre);
    if (nuevaEtapa) {
      const nom = m === 2 && [ "sb", "fr", "mz", "bd" ].includes(etapa) ? etapa + "_lh" : etapa;
      let regs = sdbCargados.get(nom);
      if (!regs) {
        if (!SDB_DEL_JUEGO.has(nom)) regs = []; else try {
          regs = leerSdb(await (await fetch(base + "/juego/demo/" + nom + ".sdb")).arrayBuffer());
        } catch {
          regs = [];
        }
        sdbCargados.set(nom, regs);
      }
      motor.cargarSdb(regs, D.secuencias[etapa] || null);
    }
    motor.cambiarEscena(es.escena);
    escena = es.escena;
    for (const [r, h] of sesArea) {
      h?.parar(.1);
      sesArea.delete(r);
    }
    ponerReverb();
    await pisosListos;
  }
  function actualizar(dt) {
    if (!dt || dt > .5) dt = 1 / 60;
    ponerOyente();
    motor.actualizar(dt, posJuego());
    pasosPorHuesos(dt);
  }
  function musica(id, {pista: pista = null, volumen: volumen = 1, fundido: fundido = 2} = {}) {
    if (id == null) {
      motor.pistas.forEach((p, t) => motor.cortar(t, fundido, true));
      return;
    }
    const t = pista ?? motor.autoPista(id);
    const p = motor.pistas[t];
    if (p.estado) {
      p.estado = 4;
      p.fundido = fundido;
      p.sig = {
        no: id,
        tipoVol: 1,
        corte: 0,
        vol: volumen
      };
    } else motor.arrancar(t, id, 1, 0, volumen);
  }
  function puerta(material, accion = "abrir", posicion = null) {
    const t = D.puertas[String(material).toUpperCase()];
    const k = typeof accion === "number" ? accion : ACCIONES_PUERTA[accion] ?? 0;
    return t?.[k] ? efecto(t[k], posicion) : null;
  }
  function pasoEnemigo(posicion, material = null, volumen = 1) {
    const p = aVector(posicion);
    const m = material ?? (p ? materialEn(visorAJuego([ p.x, p.y, p.z ], escala)) : 1) ?? 1;
    const id = D.pasos_enemigos[typeof m === "number" ? MATERIALES[m] : m];
    return id ? efecto(id, posicion, {
      volumen: volumen,
      radio: RADIO_ENEMIGO
    }) : null;
  }
  return {
    efectoMover(h, posicion) {
      h?.mover?.(posicion);
    },
    async buffers(id) {
      const fila = D.se[id];
      if (fila) return Promise.all(fila.capas.map(async c => ({
        ...await bufferSe(c.wav + "@" + c.hz),
        capa: c,
        vol: fila.vol
      })));
      return [ await bufferXmd(+id) ];
    },
    ctx: ctx,
    datos: D,
    motor: motor,
    alCargarSala: alCargarSala,
    actualizar: actualizar,
    paso: paso,
    efecto: efecto,
    musica: musica,
    puerta: puerta,
    pasoEnemigo: pasoEnemigo,
    materialEn: materialEn,
    materialPaso: materialPaso,
    desbloquear: desbloquear,
    combate(v = true) {
      motor.combate = !!v;
    },
    cinematica(v = true) {
      motor.cine = !!v;
    },
    corriendo(v = true) {
      corriendo = !!v;
    },
    get pasosDados() {
      return pasosDados;
    },
    volumen({maestro: vm, musica: vmu, efectos: ve} = {}) {
      const t = ctx.currentTime;
      if (vm != null) maestro.gain.setTargetAtTime(vm, t, .05);
      if (vmu != null) busMusica.gain.setTargetAtTime(vmu, t, .05);
      if (ve != null) busEfectos.gain.setTargetAtTime(ve, t, .05);
    },
    pararTodo() {
      motor.pistas.forEach((p, t) => motor.cortar(t, 4, true));
      for (const m of [ ...sonando ]) m.parar();
      secuencia.parar();
    },
    nivel() {
      const d = new Float32Array(analizador.fftSize);
      analizador.getFloatTimeDomainData(d);
      let s2 = 0, pk = 0;
      for (const v of d) {
        s2 += v * v;
        pk = Math.max(pk, Math.abs(v));
      }
      return {
        rms: Math.sqrt(s2 / d.length),
        pico: pk
      };
    },
    get desbloqueado() {
      return ctx.state === "running";
    },
    estado() {
      return `${sala || "-"} (${etapa || "-"} escena ${escena}, mitad ${mitad}) audio ${ctx.state}\n` + motor.estadoTexto() + `\nefectos sonando: ${sonando.size}`;
    }
  };
}
