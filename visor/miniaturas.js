// SH4 web — FeniXVOID · Project Ravenlight
const BASE = new URL("./miniaturas/", import.meta.url);

let pedido = null;

export function indiceMiniaturas() {
  pedido ||= fetch(new URL("indice.json", BASE), {
    cache: "no-cache"
  }).then(r => r.ok ? r.json() : {}).catch(() => ({})).then(j => {
    const ind = {};
    for (const [k, v] of Object.entries(j || {})) ind[k] = Array.isArray(v) ? new Set(v) : v;
    return ind;
  });
  return pedido;
}

export const claveMiniatura = v => String(v ?? "").replace(/\.sh4$/, "").replace(/[^\w-]/g, "_");

export function urlMiniatura(ind, tipo, clave) {
  if (!ind) return null;
  clave = claveMiniatura(clave);
  if (tipo === "mundos") {
    const s = ind.mundos?.[clave];
    return s ? urlMiniatura(ind, "salas", s) : null;
  }
  return ind[tipo]?.has?.(clave) ? new URL(`${tipo}/${clave}.jpg`, BASE).href : null;
}
