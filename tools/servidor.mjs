// SH4 web — FeniXVOID · Project Ravenlight
import http from "node:http";

import fs from "node:fs";

import path from "node:path";

import { fileURLToPath } from "node:url";

const PUERTO = +(process.argv[2] || 8130);

const JUEGO = process.argv[3] || "C:/GOG Games/Silent Hill 4";

const iReg = process.argv.indexOf("--registrar");

const REGISTRO = iReg > 0 ? process.argv[iReg + 1] : null;

const RED = process.argv.includes("--red");

const HOST_LOCAL = /^(127\.0\.0\.1|localhost|\[::1\])(:\d+)?$/i;

const VISOR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "visor");

const DATOS = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "datos");

const TIPOS = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".md": "text/plain; charset=utf-8",
  ".jpg": "image/jpeg",
  ".css": "text/css",
  ".png": "image/png",
  ".webmanifest": "application/manifest+json"
};

const DATOS_WEB = "https://sh4.ravenlight.net/datos/";

async function bajarDato(f, nombre) {
  const r = await fetch(DATOS_WEB + nombre);
  if (!r.ok) throw new Error("HTTP " + r.status);
  fs.mkdirSync(path.dirname(f), {
    recursive: true
  });
  fs.writeFileSync(f, Buffer.from(await r.arrayBuffer()));
  console.log("bajado de la web: datos/" + nombre);
}

const RUTA_CLAVE = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "_privado", "clave_acceso.txt");

const CLAVE = fs.existsSync(RUTA_CLAVE) ? fs.readFileSync(RUTA_CLAVE, "utf8").trim() : "";

http.createServer((req, res) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405);
    return res.end();
  }
  if (!RED && !req.headers["cf-connecting-ip"] && !HOST_LOCAL.test(req.headers.host || "")) {
    res.writeHead(403);
    return res.end();
  }
  if (CLAVE && req.headers["cf-connecting-ip"]) {
    const u = new URL(req.url, "http://x");
    const galleta = /(?:^|;\s*)sh4clave=([^;]+)/.exec(req.headers.cookie || "")?.[1];
    if (u.searchParams.get("clave") === CLAVE) {
      u.searchParams.delete("clave");
      res.writeHead(302, {
        "Set-Cookie": `sh4clave=${CLAVE}; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Lax`,
        Location: u.pathname + (u.search || "")
      });
      return res.end();
    }
    if (galleta !== CLAVE) {
      res.writeHead(403, {
        "Content-Type": "text/html; charset=utf-8"
      });
      return res.end('<body style="background:#070505;color:#8f857a;font:18px Georgia;display:grid;place-items:center;height:90vh">Hace falta el link con la clave.</body>');
    }
  }
  let url;
  try {
    url = decodeURIComponent(new URL(req.url, "http://x").pathname);
  } catch {
    res.writeHead(400);
    return res.end();
  }
  let raiz = VISOR;
  if (url === "/juego-lista.json") {
    const lista = {};
    for (const d of [ "data", "demo", "movie" ]) try {
      lista[d] = fs.readdirSync(path.join(JUEGO, d));
    } catch {
      lista[d] = [];
    }
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache"
    });
    return res.end(JSON.stringify(lista));
  }
  if (url.startsWith("/juego/")) {
    raiz = JUEGO;
    url = url.slice(6);
    if (REGISTRO) fs.appendFile(REGISTRO, JSON.stringify({
      ruta: url,
      rango: req.headers.range || null
    }) + "\n", () => {});
  } else if (url.startsWith("/datos/")) {
    raiz = DATOS;
    url = url.slice(6);
  } else if (url.startsWith("/md/")) {
    if (!url.endsWith(".md")) {
      res.writeHead(403);
      return res.end();
    }
    raiz = path.join(DATOS, "..");
    url = url.slice(3);
  }
  if (url.endsWith("/")) url += "index.html";
  const f = path.join(raiz, path.normalize(url));
  const base = path.resolve(raiz);
  if (f !== base && !f.startsWith(base + path.sep)) {
    res.writeHead(403);
    return res.end();
  }
  servir(false);
  function servir(yaBajado) {
    fs.stat(f, (e, st) => {
      if ((e || !st.isFile()) && raiz === DATOS && !yaBajado && /^[\/][\w.-]+\.json$/.test(url)) {
        return bajarDato(f, url.slice(1)).then(() => servir(true), err => {
          res.writeHead(404);
          res.end("no está: " + url + " (" + err.message + ")");
        });
      }
      if (e || !st.isFile()) {
        res.writeHead(404);
        return res.end("no está: " + url);
      }
      const cabeceras = {
        "Content-Type": TIPOS[path.extname(f).toLowerCase()] || "application/octet-stream",
        "Content-Length": st.size,
        "Cache-Control": "no-cache",
        "Cross-Origin-Opener-Policy": "same-origin"
      };
      cabeceras["Accept-Ranges"] = "bytes";
      let estadoHttp = 200, rangoLectura;
      const m = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range || "");
      if (m && (m[1] || m[2])) {
        const a = m[1] ? +m[1] : Math.max(0, st.size - +m[2]), b = m[1] && m[2] ? Math.min(+m[2], st.size - 1) : st.size - 1;
        if (a > b || a >= st.size) {
          res.writeHead(416, {
            "Content-Range": `bytes */${st.size}`
          });
          return res.end();
        }
        estadoHttp = 206;
        rangoLectura = {
          start: a,
          end: b
        };
        cabeceras["Content-Length"] = b - a + 1;
        cabeceras["Content-Range"] = `bytes ${a}-${b}/${st.size}`;
      }
      if (req.method === "HEAD") {
        res.writeHead(estadoHttp, cabeceras);
        return res.end();
      }
      const enviar = intento => {
        const s = fs.createReadStream(f, rangoLectura);
        s.on("error", err => {
          if (err.code === "EBUSY" && intento < 5 && !res.headersSent) return setTimeout(() => enviar(intento + 1), 300);
          console.log("error leyendo", url, err.code);
          res.destroy();
        });
        s.once("open", () => {
          if (!res.headersSent) res.writeHead(estadoHttp, cabeceras);
          s.pipe(res);
        });
      };
      enviar(0);
    });
  }
}).listen(PUERTO, RED ? "0.0.0.0" : "127.0.0.1", () => console.log(`SH4 visor en http://127.0.0.1:${PUERTO}/  (juego: ${JUEGO})${RED ? "  [abierto a la red]" : ""}`));
