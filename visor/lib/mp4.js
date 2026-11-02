// SH4 web — FeniXVOID · Project Ravenlight
const enc = new TextEncoder;

const u8 = (...b) => new Uint8Array(b);

const u16 = v => u8(v >>> 8 & 255, v & 255);

const u24 = v => u8(v >>> 16 & 255, v >>> 8 & 255, v & 255);

const u32 = v => u8(v >>> 24 & 255, v >>> 16 & 255, v >>> 8 & 255, v & 255);

const u64 = v => {
  const a = new Uint8Array(8);
  new DataView(a.buffer).setBigUint64(0, BigInt(Math.round(v)));
  return a;
};

const txt = s => enc.encode(s);

const fijo16 = v => u32(Math.round(v * 65536));

function unir(partes) {
  let n = 0;
  for (const p of partes) n += p.length;
  const r = new Uint8Array(n);
  let o = 0;
  for (const p of partes) {
    r.set(p, o);
    o += p.length;
  }
  return r;
}

function caja(tipo, ...hijos) {
  const cuerpo = unir(hijos.flat(Infinity).filter(Boolean));
  return unir([ u32(cuerpo.length + 8), txt(tipo), cuerpo ]);
}

const cajaLlena = (tipo, version, flags, ...hijos) => caja(tipo, u8(version), u24(flags), ...hijos);

const MATRIZ = [ fijo16(1), u32(0), u32(0), u32(0), fijo16(1), u32(0), u32(0), u32(0), u32(1073741824) ];

const UUID_ESFERICO = u8(255, 204, 130, 99, 248, 85, 74, 147, 136, 20, 88, 122, 2, 82, 31, 221);

function esfericoV1(programa) {
  const xml = '<?xml version="1.0"?><rdf:SphericalVideo\nxmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"\n' + 'xmlns:GSpherical="http://ns.google.com/videos/1.0/spherical/"><GSpherical:Spherical>true</GSpherical:Spherical>' + "<GSpherical:Stitched>true</GSpherical:Stitched><GSpherical:StitchingSoftware>" + programa + "</GSpherical:StitchingSoftware>" + "<GSpherical:ProjectionType>equirectangular</GSpherical:ProjectionType></rdf:SphericalVideo>";
  return caja("uuid", UUID_ESFERICO, txt(xml));
}

function esfericoV2(programa) {
  return [ cajaLlena("st3d", 0, 0, u8(0)), caja("sv3d", cajaLlena("svhd", 0, 0, txt(programa), u8(0)), caja("proj", cajaLlena("prhd", 0, 0, u32(0), u32(0), u32(0)), cajaLlena("equi", 0, 0, u32(0), u32(0), u32(0), u32(0)))) ];
}

const desc = (tag, ...hijos) => {
  const c = unir(hijos.flat());
  return unir([ u8(tag, 128 | c.length >> 21 & 127, 128 | c.length >> 14 & 127, 128 | c.length >> 7 & 127, c.length & 127), c ]);
};

export function crearMp4({ancho: ancho, alto: alto, fps: fps, audio: audio = null, es360: es360 = false, archivo: archivo = null, programa: programa = "SH4 web - FeniXVOID Project Ravenlight", muestras: muestras = null}) {
  const ESCALA_V = 9e4, durV = Math.round(ESCALA_V / fps);
  const pistas = [ {
    tipo: "v",
    tam: [],
    clave: [],
    desc: null,
    offsets: [],
    dur: durV,
    escala: ESCALA_V
  }, ...audio ? [ {
    tipo: "a",
    tam: [],
    desc: null,
    offsets: [],
    dur: 1024,
    escala: audio.frecuencia
  } ] : [] ];
  const ftyp = caja("ftyp", txt("isom"), u32(512), txt("isom"), txt("iso2"), txt("avc1"), txt("mp41"));
  const cabMdat = unir([ u32(1), txt("mdat"), u64(0) ]);
  const partes = [];
  let pos = 0, escrito = Promise.resolve(), error = null;
  const escribir = datos => {
    const p = pos;
    pos += datos.length;
    if (archivo) escrito = escrito.then(() => archivo.write({
      type: "write",
      position: p,
      data: datos
    })).catch(e => {
      error ||= e;
    }); else partes.push(datos);
    return p;
  };
  escribir(ftyp);
  const reserva = muestras ? Math.ceil(((muestras.video || 0) + (muestras.audio || 0)) * 12 * 1.15) + (es360 ? 4096 : 2048) + 65536 : 0;
  const inicioReserva = reserva ? escribir(unir([ u32(reserva), txt("free"), new Uint8Array(reserva - 8) ])) : -1;
  const inicioMdat = escribir(cabMdat);
  function agregar(pista, chunk, meta) {
    if (error) throw error;
    if (meta?.decoderConfig?.description && !pista.desc) {
      const d = meta.decoderConfig.description;
      pista.desc = new Uint8Array(d.buffer ? d.buffer.slice(d.byteOffset ?? 0, (d.byteOffset ?? 0) + d.byteLength) : d);
    }
    const datos = new Uint8Array(chunk.byteLength);
    chunk.copyTo(datos);
    pista.offsets.push(escribir(datos));
    pista.tam.push(datos.length);
    if (pista.clave) pista.clave.push(chunk.type === "key");
  }
  function trak(p, id, durMovie) {
    const n = p.tam.length, esV = p.tipo === "v";
    const durMedia = n * p.dur;
    const tkhd = cajaLlena("tkhd", 0, 3, u32(0), u32(0), u32(id), u32(0), u32(durMovie), u32(0), u32(0), u16(0), u16(0), u16(esV ? 0 : 256), u16(0), MATRIZ, fijo16(esV ? ancho : 0), fijo16(esV ? alto : 0));
    const mdhd = cajaLlena("mdhd", 0, 0, u32(0), u32(0), u32(p.escala), u32(durMedia), u16(21956), u16(0));
    const hdlr = cajaLlena("hdlr", 0, 0, u32(0), txt(esV ? "vide" : "soun"), u32(0), u32(0), u32(0), txt(esV ? "Video" : "Sonido"), u8(0));
    let entrada;
    if (esV) {
      entrada = caja("avc1", u8(0, 0, 0, 0, 0, 0), u16(1), u16(0), u16(0), u32(0), u32(0), u32(0), u16(ancho), u16(alto), fijo16(72), fijo16(72), u32(0), u16(1), u8(...new Array(32).fill(0)), u16(24), u16(65535), caja("avcC", p.desc || u8()), ...es360 ? esfericoV2(programa) : []);
    } else {
      const esds = cajaLlena("esds", 0, 0, desc(3, u16(1), u8(0), desc(4, u8(64, 21), u24(0), u32(192e3), u32(16e4), desc(5, p.desc || u8(17, 144))), desc(6, u8(2))));
      entrada = caja("mp4a", u8(0, 0, 0, 0, 0, 0), u16(1), u32(0), u32(0), u16(audio.canales), u16(16), u16(0), u16(0), u32(Math.min(audio.frecuencia, 65535) * 65536), esds);
    }
    const stsd = cajaLlena("stsd", 0, 0, u32(1), entrada);
    const stts = cajaLlena("stts", 0, 0, u32(1), u32(n), u32(p.dur));
    const stsc = cajaLlena("stsc", 0, 0, u32(1), u32(1), u32(1), u32(1));
    const stsz = cajaLlena("stsz", 0, 0, u32(0), u32(n), p.tam.map(u32));
    const co64 = cajaLlena("co64", 0, 0, u32(n), p.offsets.map(u64));
    const claves = esV ? p.clave.map((k, i) => k ? i + 1 : 0).filter(Boolean) : null;
    const stss = esV ? cajaLlena("stss", 0, 0, u32(claves.length), claves.map(u32)) : null;
    const stbl = caja("stbl", stsd, stts, stss, stsc, stsz, co64);
    const minf = caja("minf", esV ? cajaLlena("vmhd", 0, 1, u16(0), u16(0), u16(0), u16(0)) : cajaLlena("smhd", 0, 0, u16(0), u16(0)), caja("dinf", cajaLlena("dref", 0, 0, u32(1), cajaLlena("url ", 0, 1))), stbl);
    return caja("trak", tkhd, caja("mdia", mdhd, hdlr, minf), ...esV && es360 ? [ esfericoV1(programa) ] : []);
  }
  async function cerrar() {
    if (error) throw error;
    const finMdat = pos;
    const durMovie = Math.round(Math.max(...pistas.map(p => p.tam.length * p.dur / p.escala)) * 1e3);
    const mvhd = cajaLlena("mvhd", 0, 0, u32(0), u32(0), u32(1e3), u32(durMovie), fijo16(1), u16(256), u16(0), u32(0), u32(0), MATRIZ, u32(0), u32(0), u32(0), u32(0), u32(0), u32(0), u32(pistas.length + 1));
    const moov = caja("moov", mvhd, ...pistas.map((p, i) => trak(p, i + 1, durMovie)));
    const tamMdat = unir([ u32(1), txt("mdat"), u64(finMdat - inicioMdat) ]);
    const sobra = reserva - moov.length, adelante = reserva > 0 && (sobra === 0 || sobra >= 8);
    const relleno = adelante && sobra ? unir([ u32(sobra), txt("free") ]) : null;
    if (archivo) {
      if (adelante) {
        escrito = escrito.then(() => archivo.write({
          type: "write",
          position: inicioReserva,
          data: moov
        }));
        if (relleno) escrito = escrito.then(() => archivo.write({
          type: "write",
          position: inicioReserva + moov.length,
          data: relleno
        }));
      } else escribir(moov);
      escrito = escrito.then(() => archivo.write({
        type: "write",
        position: inicioMdat,
        data: tamMdat
      })).then(() => archivo.close());
      await escrito;
      if (error) throw error;
      return null;
    }
    partes[reserva ? 2 : 1] = tamMdat;
    if (adelante) partes[1] = relleno ? new Blob([ moov, relleno, new Uint8Array(sobra - 8) ]) : moov; else partes.push(moov);
    return new Blob(partes, {
      type: "video/mp4"
    });
  }
  return {
    video: (chunk, meta) => agregar(pistas[0], chunk, meta),
    audio: (chunk, meta) => audio && agregar(pistas[1], chunk, meta),
    cerrar: cerrar,
    get bytes() {
      return pos;
    },
    get muestras() {
      return pistas.map(p => p.tam.length);
    },
    pendiente: () => escrito
  };
}
