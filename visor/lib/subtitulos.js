// SH4 web — FeniXVOID · Project Ravenlight
export const PAQUETES_MENSAJES = {
  4: "room0",
  5: "subway0",
  6: "forest0",
  7: "water0",
  8: "building0",
  9: "home0",
  10: "hospital0",
  11: "home0",
  12: "last0",
  13: "end0"
};

export const PARTE_COMUN = {
  j: 0,
  e: 1,
  f: 2,
  g: 3,
  i: 4,
  s: 5,
  k: 6,
  b: 7
};

export const OFS_TABLA_GOG = 2417992;

const FIRMA = [ 67113985, 68813760, 67179522, 6553640 ];

export function leerTablaSubtitulos(exe) {
  const dv = new DataView(exe);
  const coincide = o => FIRMA.every((v, i) => o + 4 * i + 4 <= exe.byteLength && dv.getUint32(o + 4 * i, true) === v);
  let o = coincide(OFS_TABLA_GOG) ? OFS_TABLA_GOG : -1;
  for (let k = 0; o < 0 && k + 16 <= exe.byteLength; k += 4) if (dv.getUint32(k, true) === FIRMA[0] && coincide(k)) o = k;
  if (o < 0) return null;
  const tabla = [];
  for (;o + 8 <= exe.byteLength; o += 8) {
    const a = dv.getUint32(o, true), b = dv.getUint32(o + 4, true);
    if (!a) break;
    const demo = a & 1023, paquete = a >>> 10 & 63, mensaje = a >>> 16 & 1023, voz = a >>> 26 & 1;
    const ini = b & 65535, fin = b >>> 16;
    if (!PAQUETES_MENSAJES[paquete]) break;
    if (fin < ini) continue;
    tabla.push({
      demo: demo,
      paquete: paquete,
      mensaje: mensaje,
      voz: voz,
      ini: ini,
      fin: fin
    });
  }
  return tabla;
}

function letra(b) {
  if (b === 0) return " ";
  const c = 256 - b;
  if (c >= 32 && c < 127 || c >= 160 && c <= 255) return String.fromCharCode(c);
  return "";
}

export const JAPONES0 = 57344, COREANO0 = 44032;

export function caracterDeCodigo(c) {
  if (c === 0) return " ";
  if (c < 224) return letra(c);
  if (c < 16384) return c - 224 < 6400 ? String.fromCharCode(JAPONES0 + c - 224) : "";
  if (c < 61440) {
    const i = c - 16384 ^ 1395;
    return i < 11172 ? String.fromCharCode(COREANO0 + i) : "";
  }
  if (c === 65519) return " ";
  return "";
}

export function leerMensajes(buf) {
  const n = buf.byteLength;
  if (n < 8) return [];
  const dv = new DataView(buf), u8 = new Uint8Array(buf);
  const partes = dv.getUint32(0, true), res = [];
  if (!partes || partes > 64) return res;
  for (let p = 0; p < partes; p++) {
    const po = dv.getUint32(4 + 4 * p, true);
    if (po + 2 > n) {
      res.push([]);
      continue;
    }
    const cant = dv.getUint16(po, true), lista = [];
    for (let i = 0; i < cant; i++) {
      let a = po + dv.getUint16(po + 2 + 2 * i, true) * 2, t = "", bytes = false;
      for (;;) {
        let c;
        if (!bytes) {
          if (a + 1 >= n) break;
          c = dv.getUint16(a, true);
          a += 2;
          if (c === 32768) {
            bytes = true;
            continue;
          }
        } else {
          if (a >= n) break;
          const b = u8[a++];
          if (b === 224) {
            if (a + 1 >= n) break;
            c = u8[a] | u8[a + 1] << 8;
            a += 2;
          } else if (b > 224) c = b << 8 | (u8[a++] ?? 255); else {
            if (b !== 128) t += letra(b);
            continue;
          }
        }
        if (c === 65535) break;
        if (c === 65533) {
          t += "\n";
          continue;
        }
        t += caracterDeCodigo(c);
      }
      lista.push(t.replace(/[ \t ]+\n/g, "\n").replace(/\n{2,}/g, "\n").trim());
    }
    res.push(lista);
  }
  return res;
}

export function subtitulosDe(tabla, demoId, mensajesPorPaquete) {
  return (tabla || []).filter(e => e.demo === demoId).map(e => ({
    ini: e.ini,
    fin: e.fin,
    voz: !!e.voz,
    paquete: e.paquete,
    mensaje: e.mensaje,
    texto: mensajesPorPaquete[e.paquete]?.[0]?.[e.mensaje] ?? `(mensaje ${e.mensaje} de ${PAQUETES_MENSAJES[e.paquete]})`
  }));
}
