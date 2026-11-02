// SH4 web — FeniXVOID · Project Ravenlight
import { decodificarXmd } from "../lib/xmd.js";

export const TEMA_TITULO = 10058;

export const TEMA_GAME_OVER = 10059;

const FUNDIDOS = {
  0: 0,
  1: 1.5,
  2: .5,
  3: 3,
  4: 0,
  5: .5,
  6: .1,
  7: .3,
  8: .3
};

const volDeOpcion = v => Math.max(0, Math.min(1.25, (v ?? 8) / 8));

export function crearMusica({M: M}) {
  const ctx = M.contextoAudio();
  if (!ctx) return {
    tocar() {},
    parar() {},
    volumen() {},
    precargar: async () => null,
    estado: () => ({
      sinAudio: true
    })
  };
  const bus = ctx.createGain();
  bus.connect(ctx.destination);
  const desbloquear = () => {
    M.contextoAudio();
  };
  for (const ev of [ "pointerdown", "touchend", "keydown", "mousedown" ]) addEventListener(ev, desbloquear, true);
  M.renderer?.xr?.addEventListener?.("sessionstart", desbloquear);
  async function rango(ruta, a, b) {
    const r = await fetch("/juego/" + ruta, {
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
  let dirBgm = null;
  function directorio() {
    dirBgm ??= (async () => {
      const {buf: buf, total: total} = await rango("demo/bgm.sh4", 0, 7);
      const n = new DataView(buf).getUint32(4, true);
      const ent = new DataView((await rango("demo/bgm.sh4", 0, 8 + 8 * n - 1)).buf);
      const nom = new Uint8Array((await rango("demo/bgm.sh4", total - 16 * n, total - 1)).buf);
      const lista = [];
      for (let k = 0; k < n; k++) {
        let s = "";
        for (let j = 0; j < 16 && nom[16 * k + j]; j++) s += String.fromCharCode(nom[16 * k + j]);
        lista.push({
          nombre: s,
          ofs: ent.getUint32(8 + 8 * k, true),
          len: ent.getUint32(12 + 8 * k, true)
        });
      }
      return lista;
    })();
    dirBgm.catch(() => {
      dirBgm = null;
    });
    return dirBgm;
  }
  const cache = new Map;
  function buffer(no) {
    if (cache.has(no)) return cache.get(no);
    const p = (async () => {
      if (!(no >= 1e4 && no < 2e4)) throw new Error("tema fuera de bgm.sh4: " + no);
      const e = (await directorio())[no - 1e4];
      if (!e || e.len <= 12) throw new Error("no está el tema " + no);
      const {buf: buf} = await rango("demo/bgm.sh4", e.ofs, e.ofs + e.len - 1);
      const a = decodificarXmd(new Uint8Array(buf));
      if (!a) throw new Error("no pude decodificar " + e.nombre);
      const ab = ctx.createBuffer(a.canales.length, a.canales[0].length, a.frecuencia);
      a.canales.forEach((c, k) => ab.copyToChannel(c, k));
      return {
        ab: ab,
        loopea: a.loop,
        loopInicio: a.loopInicio / a.frecuencia,
        nombre: e.nombre
      };
    })();
    cache.set(no, p);
    while (cache.size > 2) cache.delete(cache.keys().next().value);
    p.catch(() => cache.delete(no));
    return p;
  }
  let actual = null, pedido = 0;
  function cortar(a, seg) {
    if (!a) return;
    a.parando = true;
    const t = ctx.currentTime;
    try {
      a.g.gain.cancelScheduledValues(t);
      a.g.gain.setValueAtTime(a.g.gain.value, t);
      if (seg > 0) a.g.gain.linearRampToValueAtTime(0, t + seg); else a.g.gain.value = 0;
      a.s?.stop(t + seg + .05);
    } catch {}
    setTimeout(() => {
      try {
        a.g.disconnect();
      } catch {}
    }, (seg + .3) * 1e3);
  }
  const api = {
    tocar(no, {volumen: volumen = 1, siNoSuena: siNoSuena = false} = {}) {
      if (siNoSuena && actual && actual.no === no && !actual.parando) return;
      cortar(actual, FUNDIDOS[6]);
      const yo = ++pedido;
      const g = ctx.createGain();
      g.gain.value = volumen;
      g.connect(bus);
      const a = actual = {
        no: no,
        s: null,
        g: g,
        parando: false,
        listo: false
      };
      buffer(no).then(({ab: ab, loopea: loopea, loopInicio: loopInicio}) => {
        if (yo !== pedido || a.parando) return;
        const s = ctx.createBufferSource();
        s.buffer = ab;
        s.loop = !!loopea;
        if (loopea) {
          s.loopStart = loopInicio;
          s.loopEnd = ab.duration;
        }
        s.connect(g);
        s.start();
        a.s = s;
        a.listo = true;
      }).catch(e => console.warn("música", no, e.message));
    },
    parar(tipo = 2) {
      if (!actual) return;
      cortar(actual, FUNDIDOS[tipo] ?? .5);
      actual = null;
      pedido++;
    },
    volumen(v) {
      bus.gain.setTargetAtTime(volDeOpcion(v), ctx.currentTime, .05);
    },
    precargar(no) {
      return buffer(no).catch(() => null);
    },
    get sonando() {
      return actual && !actual.parando ? actual.no : null;
    },
    estado() {
      return {
        no: actual?.no ?? null,
        listo: !!actual?.listo,
        parando: !!actual?.parando,
        audio: ctx.state,
        volumen: +bus.gain.value.toFixed(3),
        segundos: actual?.listo ? +ctx.currentTime.toFixed(2) : 0
      };
    },
    ctx: ctx,
    bus: bus
  };
  return api;
}
