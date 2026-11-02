// SH4 web — FeniXVOID · Project Ravenlight
export async function rango(url, desde, hasta) {
  const r = await fetch(url, {
    headers: {
      Range: `bytes=${desde}-${hasta}`
    }
  });
  if (!r.ok) throw new Error("no pude leer " + url);
  const buf = await r.arrayBuffer();
  return {
    buf: buf,
    completo: r.status === 200
  };
}

export async function indiceSh4(url) {
  const cab = await rango(url, 0, 7);
  let todo = cab.completo ? cab.buf : null;
  const dv0 = new DataView(cab.buf);
  if (dv0.getUint32(0, false) !== 1397240832) throw new Error("no es un .sh4: " + url);
  const n = dv0.getUint32(4, true);
  let tabla, nombresBuf, tam;
  if (todo) {
    tam = todo.byteLength;
    tabla = todo.slice(8, 8 + 8 * n);
    nombresBuf = todo.slice(tam - 16 * n);
  } else {
    const h = await fetch(url, {
      method: "HEAD"
    });
    tam = +h.headers.get("content-length");
    [tabla, nombresBuf] = (await Promise.all([ rango(url, 8, 8 + 8 * n - 1), rango(url, tam - 16 * n, tam - 1) ])).map(x => x.buf);
  }
  const dt = new DataView(tabla), dec = new TextDecoder("latin1"), entradas = [];
  for (let i = 0; i < n; i++) {
    const b = new Uint8Array(nombresBuf, 16 * i, 16), z = b.indexOf(0);
    entradas.push({
      nombre: dec.decode(z < 0 ? b : b.subarray(0, z)),
      ofs: dt.getUint32(8 * i, true),
      len: dt.getUint32(8 * i + 4, true)
    });
  }
  async function leer(e, cuanto = e.len) {
    const l = Math.min(e.len, cuanto);
    if (!l) return new ArrayBuffer(0);
    if (todo) return todo.slice(e.ofs, e.ofs + l);
    const r = await rango(url, e.ofs, e.ofs + l - 1);
    if (r.completo) {
      todo = r.buf;
      return todo.slice(e.ofs, e.ofs + l);
    }
    return r.buf;
  }
  return {
    url: url,
    tam: tam,
    entradas: entradas,
    leer: leer
  };
}
