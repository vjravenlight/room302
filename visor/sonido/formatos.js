// SH4 web — FeniXVOID · Project Ravenlight
export const MATERIALES = [ "muon", "concreto", "tierra", "pasto", "metal", "agua", "arbol", "alfombra", "rejilla", "vidrio", "cortina", "carne", "escombro" ];

export function leerSdb(buf, ofs = 0, len = buf.byteLength - ofs) {
  const dv = new DataView(buf, ofs, len);
  if (dv.getUint16(0, true) !== 34177) throw new Error("no es un SDB");
  const regs = [];
  for (let o = 96; o + 96 <= len; o += 96) {
    const flags = dv.getUint16(o + 30, true);
    if (flags & 32768) break;
    const f = k => dv.getFloat32(o + k, true), i = k => dv.getInt32(o + k, true);
    const r = {
      area: [ f(0), f(4), f(8), f(12), f(16), f(20) ],
      escena: i(24),
      tipo: dv.getInt16(o + 28, true),
      flagsRegistro: flags
    };
    if (r.tipo === 0) {
      r.pistas = [];
      for (let p = 0; p < 8; p++) {
        const v = dv.getBigUint64(o + 32 + 8 * p, true), m = new Map;
        for (let pag = 0; pag < 12; pag++) {
          const b = Number(v >> BigInt(5 * pag) & 31n);
          if (b & 1) m.set(pag, [ (b >> 1 & 3) + 1, (b >> 3 & 3) + 1 ]);
        }
        r.pistas.push(m);
      }
    } else {
      Object.assign(r, {
        pista: i(32),
        no: i(36),
        porcentaje: i(40),
        flags: i(44),
        fundido: i(48),
        tipoVol: i(52),
        vol: f(56),
        corte: i(60),
        pagina: i(64)
      });
    }
    regs.push(r);
  }
  return regs;
}

export function leerSdpa(buf) {
  const dv = new DataView(buf);
  if (dv.getUint32(0, false) !== 1396985921) throw new Error("no es un SDPA");
  const n = dv.getUint32(4, true), ent = [];
  for (let i = 0; i < n; i++) ent.push({
    ofs: dv.getUint32(8 + 12 * i, true),
    bytes: dv.getUint32(12 + 12 * i, true),
    loopOfs: dv.getUint32(16 + 12 * i, true)
  });
  return ent;
}

export function leerWav(u8, loopOfs = 44) {
  const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
  if (dv.getUint32(0, false) !== 1380533830) throw new Error("no es un WAV");
  let p = 12, ch = 1, hz = 22050, bits = 16, datos = 44, largo = 0;
  while (p + 8 <= u8.byteLength) {
    const id = dv.getUint32(p, false), t = dv.getUint32(p + 4, true);
    if (id === 1718449184) {
      ch = dv.getUint16(p + 10, true);
      hz = dv.getUint32(p + 12, true);
      bits = dv.getUint16(p + 22, true);
    }
    if (id === 1684108385) {
      datos = p + 8;
      largo = Math.min(t, u8.byteLength - datos);
      break;
    }
    p += 8 + t + (t & 1);
  }
  if (bits !== 16) throw new Error("WAV de " + bits + " bits");
  const n = Math.floor(largo / 2 / ch), canales = Array.from({
    length: ch
  }, () => new Float32Array(n));
  for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++) canales[c][i] = dv.getInt16(datos + (i * ch + c) * 2, true) / 32768;
  const loopInicio = Math.max(0, Math.min(n - 1, Math.floor((loopOfs - datos) / 2 / ch)));
  return {
    canales: canales,
    frecuencia: hz,
    loopInicio: loopInicio,
    loopea: loopOfs !== 44
  };
}

export const juegoAVisor = (p, escala = .005) => [ -p[0] * escala, -p[1] * escala, p[2] * escala ];

export const visorAJuego = (p, escala = .005) => [ -p[0] / escala, -p[1] / escala, p[2] / escala ];

export function salaAEscena(nombre) {
  const m = /^([a-z]{2})(\d\d)/.exec(nombre || "");
  if (!m) return null;
  const n = +m[2];
  return {
    etapa: m[1],
    escena: m[1] === "rl" ? n + 1 : n
  };
}
