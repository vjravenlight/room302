// SH4 web — FeniXVOID · Project Ravenlight
const BD = "sh4carpeta", ALMACEN = "ajustes", CLAVE = "raiz";

const TIPOS = {
  html: "text/html; charset=utf-8",
  htm: "text/html; charset=utf-8",
  js: "text/javascript; charset=utf-8",
  json: "application/json",
  txt: "text/plain; charset=utf-8",
  ini: "text/plain; charset=utf-8",
  jpg: "image/jpeg",
  png: "image/png"
};

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", e => e.waitUntil(self.clients.claim()));

let raiz = null;

let raizCargada = null;

let leida = false;

const indices = new Map;

function leerBD() {
  return new Promise(ok => {
    let pedido;
    try {
      pedido = indexedDB.open(BD, 1);
    } catch {
      return ok(null);
    }
    pedido.onupgradeneeded = () => pedido.result.createObjectStore(ALMACEN);
    pedido.onerror = () => ok(null);
    pedido.onsuccess = () => {
      const bd = pedido.result;
      try {
        const g = bd.transaction(ALMACEN, "readonly").objectStore(ALMACEN).get(CLAVE);
        g.onsuccess = () => {
          bd.close();
          ok(g.result || null);
        };
        g.onerror = () => {
          bd.close();
          ok(null);
        };
      } catch {
        bd.close();
        ok(null);
      }
    };
  });
}

function carpeta() {
  if (!raizCargada) raizCargada = leerBD().then(r => {
    raiz = r && r.handle ? r : null;
    leida = true;
    return raiz;
  });
  return raizCargada;
}

self.addEventListener("message", e => {
  if (e.data && e.data.sh4carpeta === "cambio") {
    raiz = null;
    raizCargada = null;
    leida = false;
    indices.clear();
    e.waitUntil(carpeta().then(() => e.source && e.source.postMessage({
      sh4carpeta: "listo",
      nombre: raiz ? raiz.nombre : null
    })));
  }
});

async function indice(dir, clave) {
  if (indices.has(clave)) return indices.get(clave);
  const m = new Map;
  for await (const [nombre, h] of dir.entries()) m.set(nombre.toLowerCase(), h);
  indices.set(clave, m);
  return m;
}

async function buscar(partes) {
  let dir = raiz.handle, clave = "";
  for (let i = 0; i < partes.length; i++) {
    const h = (await indice(dir, clave)).get(partes[i].toLowerCase());
    if (!h) return null;
    if (i === partes.length - 1) return h.kind === "file" ? h : null;
    if (h.kind !== "directory") return null;
    dir = h;
    clave += "/" + partes[i].toLowerCase();
  }
  return null;
}

const cab = extra => Object.assign({
  "Cache-Control": "no-cache",
  "X-SH4-Origen": "carpeta"
}, extra);

const sinPermiso = () => new Response("Falta el permiso para leer la carpeta del juego / Folder permission needed", {
  status: 503,
  headers: cab({
    "Content-Type": "text/plain; charset=utf-8",
    "X-SH4-Carpeta": "permiso"
  })
});

const esPermiso = err => err && (err.name === "NotAllowedError" || err.name === "SecurityError");

async function lista(req) {
  const r = {
    data: [],
    demo: [],
    movie: []
  };
  for (const d of Object.keys(r)) {
    const h = (await indice(raiz.handle, "")).get(d);
    if (h && h.kind === "directory") for (const x of (await indice(h, "/" + d)).values()) r[d].push(x.name);
  }
  return new Response(req.method === "HEAD" ? null : JSON.stringify(r), {
    headers: cab({
      "Content-Type": "application/json"
    })
  });
}

async function archivo(req, ruta) {
  const partes = ruta.split("/").filter(Boolean);
  if (!partes.length || partes.some(p => p === ".." || p === ".")) return new Response("", {
    status: 403,
    headers: cab()
  });
  const h = await buscar(partes);
  if (!h) return new Response("no está: /" + partes.join("/"), {
    status: 404,
    headers: cab({
      "Content-Type": "text/plain; charset=utf-8"
    })
  });
  const f = await h.getFile(), tam = f.size;
  const ext = (partes[partes.length - 1].split(".").pop() || "").toLowerCase();
  const c = cab({
    "Content-Type": TIPOS[ext] || "application/octet-stream",
    "Accept-Ranges": "bytes",
    "Content-Length": String(tam)
  });
  let estado = 200, cuerpo = f;
  const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get("Range") || "");
  if (m && (m[1] || m[2])) {
    const a = m[1] ? +m[1] : Math.max(0, tam - +m[2]), b = m[1] && m[2] ? Math.min(+m[2], tam - 1) : tam - 1;
    if (a > b || a >= tam) return new Response("", {
      status: 416,
      headers: cab({
        "Content-Range": `bytes */${tam}`
      })
    });
    estado = 206;
    cuerpo = f.slice(a, b + 1);
    c["Content-Length"] = String(b - a + 1);
    c["Content-Range"] = `bytes ${a}-${b}/${tam}`;
  }
  return new Response(req.method === "HEAD" ? null : cuerpo, {
    status: estado,
    headers: c
  });
}

const deFull = url => {
  try {
    return new URL(url).pathname.startsWith("/full/");
  } catch {
    return false;
  }
};

async function atender(e) {
  const req = e.request, u = new URL(req.url);
  if (e.clientId) {
    const cliente = await self.clients.get(e.clientId);
    if (cliente && deFull(cliente.url)) return fetch(req);
  }
  await carpeta();
  if (!raiz) return fetch(req);
  try {
    const p = await raiz.handle.queryPermission({
      mode: "read"
    });
    if (p !== "granted") return sinPermiso();
  } catch {}
  try {
    if (u.pathname === "/juego-lista.json") return await lista(req);
    return await archivo(req, decodeURIComponent(u.pathname.slice("/juego/".length)));
  } catch (err) {
    if (esPermiso(err)) return sinPermiso();
    if (err && err.name === "NotFoundError") {
      indices.clear();
      return new Response("", {
        status: 503,
        headers: cab({
          "X-SH4-Carpeta": "no-esta"
        })
      });
    }
    return new Response(String(err && err.message || err), {
      status: 500,
      headers: cab({
        "Content-Type": "text/plain; charset=utf-8"
      })
    });
  }
}

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET" && req.method !== "HEAD") return;
  let u;
  try {
    u = new URL(req.url);
  } catch {
    return;
  }
  if (u.origin !== self.location.origin) return;
  if (u.pathname !== "/juego-lista.json" && !u.pathname.startsWith("/juego/")) return;
  if (u.pathname.startsWith("/full/") || deFull(req.referrer)) return;
  if (leida && !raiz) return;
  e.respondWith(atender(e));
});
