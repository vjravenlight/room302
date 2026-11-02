// SH4 web — FeniXVOID · Project Ravenlight
import { sitioIngles, fijarIdioma } from "./textos_sitio.js";

const GOG = "https://www.gog.com/en/game/silent_hill_4_the_room";

const RELEASE = "https://github.com/vjravenlight/room302/releases/latest";

const BD = "sh4carpeta", ALMACEN = "ajustes", CLAVE = "raiz";

const $ = id => document.getElementById(id);

const PARTES = [ {
  id: "exe",
  archivo: "silent hill 4.exe"
}, {
  id: "data",
  carpeta: "data",
  minimo: 600,
  claves: [ "fontdata.bin", "message_common_eu.bin", "snap_title.bin", "system_load.bin", "wp_model.bin", "item_model.bin", "henry01.bin", "rl01a.bin", "enemy_tex.bin" ]
}, {
  id: "demo",
  carpeta: "demo",
  minimo: 20,
  claves: [ "rl.sh4", "rl.sdb", "bgm.sh4", "se.sh4" ]
}, {
  id: "movie",
  carpeta: "movie",
  minimo: 10,
  claves: [ "m_00.pac" ]
} ];

const q = new URLSearchParams(location.search);

const idiomaGuardado = (() => {
  try {
    return !!JSON.parse(localStorage.getItem("sh4opciones") || "{}")?.idioma;
  } catch {
    return false;
  }
})();

let ingles = q.get("idioma") || idiomaGuardado ? sitioIngles() : !/^es\b/i.test(navigator.language || "es");

const T = {
  sub: [ "Jugá online con tu copia del juego", "Play online with your own copy of the game" ],
  intro: [ "El juego corre en esta página, pero los archivos los lee de <b>tu</b> carpeta de Silent Hill 4 (la versión de PC de GOG). No se sube nada: todo queda en tu compu.", "The game runs on this page, but it reads the files from <b>your</b> Silent Hill 4 folder (the GOG PC version). Nothing is uploaded: everything stays on your computer." ],
  elegir: [ "Elegir la carpeta de Silent Hill 4", "Choose the Silent Hill 4 folder" ],
  donde: [ "Suele estar en <code>C:\\GOG Games\\Silent Hill 4</code>. Es la que tiene adentro las carpetas <code>data</code>, <code>demo</code> y <code>movie</code>. Chrome te va a preguntar si dejás que la página <b>vea</b> los archivos: solo los lee.", "It is usually <code>C:\\GOG Games\\Silent Hill 4</code>. It is the one with the <code>data</code>, <code>demo</code> and <code>movie</code> folders inside. Chrome will ask whether the page may <b>view</b> the files: it only reads them." ],
  recordada: [ "La última vez elegiste la carpeta <b>{0}</b>.", "Last time you chose the folder <b>{0}</b>." ],
  seguir: [ "Seguir con esa carpeta", "Continue with that folder" ],
  permiso: [ 'Chrome pide que lo confirmes con un clic cada vez que volvés (o elegí "Permitir en cada visita").', 'Chrome asks you to confirm with one click each time you come back (or choose "Allow on every visit").' ],
  otra: [ "Elegir otra carpeta", "Choose another folder" ],
  yaLista: [ "La carpeta <b>{0}</b> ya está lista.", "The folder <b>{0}</b> is ready." ],
  entrar: [ "Entrar", "Enter" ],
  analizando: [ "Revisando la carpeta… {0}", "Checking the folder… {0}" ],
  p_exe: [ "El programa del juego (SILENT HILL 4.exe)", "The game program (SILENT HILL 4.exe)" ],
  p_data: [ "data: modelos, salas y textos", "data: models, rooms and texts" ],
  p_demo: [ "demo: cinemáticas, música y sonido", "demo: cutscenes, music and sound" ],
  p_movie: [ "movie: videos", "movie: videos" ],
  archivos: [ "{0} archivos · {1}", "{0} files · {1}" ],
  noEsta: [ "no está", "missing" ],
  faltan: [ "faltan: {0}", "missing: {0}" ],
  pocos: [ "tiene solo {0} archivos (el juego completo trae {1} o más)", "only {0} files (the full game has {1} or more)" ],
  total: [ "Total: {0} en {1} archivos.", "Total: {0} in {1} files." ],
  todoBien: [ "Está todo. Entrando al juego…", "Everything is there. Starting the game…" ],
  subcarpeta: [ "Elegiste <b>{0}</b>; el juego estaba adentro, en <b>{1}</b>, y se usa esa.", "You chose <b>{0}</b>; the game was inside, in <b>{1}</b>, so that one is used." ],
  elegisteAdentro: [ "Elegiste la carpeta <b>{0}</b>, que está <b>adentro</b> del juego. Elegí la de arriba: la que tiene <code>data</code>, <code>demo</code> y <code>movie</code>.", "You chose the <b>{0}</b> folder, which is <b>inside</b> the game. Choose the one above it: the one with <code>data</code>, <code>demo</code> and <code>movie</code>." ],
  noJuego: [ "Esta carpeta no tiene Silent Hill 4 (o le faltan partes). Tiene que ser la carpeta donde está <b>instalado</b> el juego de PC, con <code>data</code>, <code>demo</code>, <code>movie</code> y <code>SILENT HILL 4.exe</code>.", "This folder does not have Silent Hill 4 (or parts are missing). It must be the folder where the PC game is <b>installed</b>, with <code>data</code>, <code>demo</code>, <code>movie</code> and <code>SILENT HILL 4.exe</code>." ],
  incompleto: [ 'Si la instalación quedó a medias, en GOG Galaxy usá "Verificar / Reparar"; con el instalador suelto, volvé a instalarlo.', 'If the installation is incomplete, use "Verify / Repair" in GOG Galaxy, or run the offline installer again.' ],
  comprar: [ '¿No tenés el juego? <b>Silent Hill 4: The Room</b> está a la venta en GOG, sin DRM: <a href="{0}" target="_blank" rel="noopener">comprarlo en GOG.com</a>. Después lo instalás y elegís su carpeta acá.', 'Don\'t have the game? <b>Silent Hill 4: The Room</b> is sold DRM-free on GOG: <a href="{0}" target="_blank" rel="noopener">buy it on GOG.com</a>. Then install it and choose its folder here.' ],
  bloqueada: [ "Chrome no deja abrir esa carpeta (dice que tiene archivos del sistema; pasa con <code>Archivos de programa</code>). Copiá <code>data</code>, <code>demo</code>, <code>movie</code> y <code>SILENT HILL 4.exe</code> a otra carpeta, por ejemplo <code>C:\\Juegos\\Silent Hill 4</code>, y elegí esa.", "Chrome cannot open that folder (it says it contains system files; it happens with <code>Program Files</code>). Copy <code>data</code>, <code>demo</code>, <code>movie</code> and <code>SILENT HILL 4.exe</code> to another folder, e.g. <code>C:\\Games\\Silent Hill 4</code>, and choose that one." ],
  sinPermiso: [ "No se dio el permiso para leer la carpeta. Sin eso el juego no puede abrir sus archivos.", "Permission to read the folder was not granted. Without it the game cannot open its files." ],
  sinApi: [ "Este navegador no puede abrir una carpeta de tu compu. Pasa con Firefox, Safari, los celulares y el navegador del Quest o del Pico.", "This browser cannot open a folder on your computer. That happens with Firefox, Safari, phones and the Quest or Pico browser." ],
  sinApi2: [ "Para jugar online abrí esta página con <b>Chrome</b> o <b>Edge</b> en una PC.", "To play online, open this page with <b>Chrome</b> or <b>Edge</b> on a PC." ],
  sinApi3: [ "O bajá la <b>versión para tu PC</b>: se instala con un doble clic, lee el juego de tu carpeta y sirve también para el casco (Quest / Pico) con cable.", "Or download the <b>PC version</b>: it installs with a double click, reads the game from your folder and also works with a headset (Quest / Pico) over USB." ],
  bajar: [ "Bajar la versión para PC", "Download the PC version" ],
  sinSw: [ "El navegador no dejó instalar la parte que lee los archivos (service worker). Probá sin modo incógnito, o con Chrome o Edge al día.", "The browser did not allow installing the part that reads the files (service worker). Try outside private mode, or with an up-to-date Chrome or Edge." ],
  error: [ "Algo falló: {0}", "Something went wrong: {0}" ],
  pie: [ "Homenaje sin fines de lucro: no trae ningún archivo del juego. Silent Hill es de Konami. · FeniXVOID · Project Ravenlight", "Non-profit tribute: it ships no game files. Silent Hill belongs to Konami. · FeniXVOID · Project Ravenlight" ]
};

const t = (k, ...v) => T[k][ingles ? 1 : 0].replace(/\{(\d)\}/g, (_, i) => v[+i]);

const esc = s => String(s).replace(/[&<>"]/g, c => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;"
}[c]));

const tam = b => (b >= 1e9 ? (b / 1e9).toFixed(2) + " GB" : (b / 1e6).toFixed(1) + " MB").replace(".", ingles ? "." : ",");

function bd() {
  return new Promise((ok, mal) => {
    const p = indexedDB.open(BD, 1);
    p.onupgradeneeded = () => p.result.createObjectStore(ALMACEN);
    p.onsuccess = () => ok(p.result);
    p.onerror = () => mal(p.error);
  });
}

async function leerGuardada() {
  try {
    const b = await bd();
    return await new Promise(ok => {
      const g = b.transaction(ALMACEN).objectStore(ALMACEN).get(CLAVE);
      g.onsuccess = () => {
        b.close();
        ok(g.result || null);
      };
      g.onerror = () => {
        b.close();
        ok(null);
      };
    });
  } catch {
    return null;
  }
}

async function guardar(handle) {
  const b = await bd();
  await new Promise((ok, mal) => {
    const tx = b.transaction(ALMACEN, "readwrite");
    tx.objectStore(ALMACEN).put({
      handle: handle,
      nombre: handle.name,
      fecha: (new Date).toISOString()
    }, CLAVE);
    tx.oncomplete = ok;
    tx.onerror = () => mal(tx.error);
  });
  b.close();
}

async function entradas(dir) {
  const m = new Map;
  for await (const [n, h] of dir.entries()) m.set(n.toLowerCase(), h);
  return m;
}

const pareceJuego = m => m.get("data")?.kind === "directory" && m.get("demo")?.kind === "directory";

async function analizar(dir, alAvanzar = () => {}) {
  const avisos = [];
  let m = await entradas(dir), raiz = dir;
  if (!pareceJuego(m)) {
    for (const h of m.values()) {
      if (h.kind !== "directory") continue;
      try {
        const m2 = await entradas(h);
        if (pareceJuego(m2)) {
          avisos.push(t("subcarpeta", esc(dir.name), esc(h.name)));
          raiz = h;
          m = m2;
          break;
        }
      } catch {}
    }
  }
  if (!pareceJuego(m) && [ "fontdata.bin", "rl.sh4", "bgm.sh4", "m_00.pac", "henry01.bin" ].some(k => m.has(k))) avisos.push(t("elegisteAdentro", esc(dir.name)));
  const partes = [];
  let total = 0, n = 0;
  for (const P of PARTES) {
    if (P.archivo) {
      const h = m.get(P.archivo);
      if (h?.kind === "file") {
        const f = await h.getFile();
        total += f.size;
        n++;
        partes.push({
          id: P.id,
          ok: true,
          det: tam(f.size)
        });
      } else partes.push({
        id: P.id,
        ok: false,
        det: t("noEsta")
      });
      continue;
    }
    const h = m.get(P.carpeta);
    if (h?.kind !== "directory") {
      partes.push({
        id: P.id,
        ok: false,
        det: t("noEsta")
      });
      continue;
    }
    const hijos = await entradas(h);
    let bytes = 0, cuantos = 0;
    for (const x of hijos.values()) {
      if (x.kind !== "file") continue;
      try {
        bytes += (await x.getFile()).size;
      } catch {}
      if (++cuantos % 50 === 0) alAvanzar(`${P.carpeta} ${cuantos}`);
    }
    total += bytes;
    n += cuantos;
    const faltan = P.claves.filter(k => hijos.get(k)?.kind !== "file");
    const det = [ t("archivos", cuantos, tam(bytes)) ];
    if (faltan.length) det.push(t("faltan", faltan.join(", "))); else if (cuantos < P.minimo) det.push(t("pocos", cuantos, P.minimo));
    partes.push({
      id: P.id,
      ok: !faltan.length && cuantos >= P.minimo,
      det: det.join(" · ")
    });
  }
  return {
    ok: partes.every(p => p.ok),
    raiz: raiz,
    partes: partes,
    total: total,
    n: n,
    avisos: avisos
  };
}

async function activarSw() {
  if (!("serviceWorker" in navigator)) throw Object.assign(new Error("sin service worker"), {
    sinSw: true
  });
  let reg;
  try {
    reg = await navigator.serviceWorker.register("/sw_carpeta.js", {
      scope: "/"
    });
  } catch (e) {
    throw Object.assign(e, {
      sinSw: true
    });
  }
  await navigator.serviceWorker.ready;
  if (!navigator.serviceWorker.controller) {
    await new Promise(r => {
      navigator.serviceWorker.addEventListener("controllerchange", r, {
        once: true
      });
      setTimeout(r, 4e3);
    });
  }
  const sw = navigator.serviceWorker.controller || reg.active;
  if (sw) await new Promise(r => {
    const fin = setTimeout(r, 3e3);
    navigator.serviceWorker.addEventListener("message", function oir(e) {
      if (e.data?.sh4carpeta === "listo") {
        clearTimeout(fin);
        navigator.serviceWorker.removeEventListener("message", oir);
        r();
      }
    });
    sw.postMessage({
      sh4carpeta: "cambio"
    });
  });
  return reg;
}

function destino() {
  const v = q.get("volver");
  if (v && v.startsWith("/") && !v.startsWith("//") && !/^\/carpeta\.html/.test(v)) return v;
  return "/suite.html";
}

const C = () => $("contenido");

let estado = {
  pantalla: "inicio"
};

function pintar() {
  document.documentElement.lang = ingles ? "en" : "es";
  for (const b of document.querySelectorAll("#idiomas button")) b.setAttribute("aria-pressed", String(b.dataset.idioma === "e" === ingles));
  $("sub").textContent = t("sub");
  $("pie").textContent = t("pie");
  const e = estado, comprar = `<p class="ayuda">${t("comprar", GOG)}</p>`;
  let h = "";
  if (e.pantalla === "sinApi") {
    h = `<p class="aviso">${t("sinApi")}</p><p>${t("sinApi2")}</p><p>${t("sinApi3")}</p>\n      <a class="boton" href="${RELEASE}" target="_blank" rel="noopener">${t("bajar")}</a>${comprar}`;
  } else if (e.pantalla === "analizando") {
    h = `<p>${t("analizando", esc(e.avance || ""))}</p>`;
  } else {
    h = `<p>${t("intro")}</p>`;
    if (e.guardada && e.pantalla !== "informe") {
      h += e.permiso === "granted" ? `<p class="bien">${t("yaLista", esc(e.guardada.nombre))}</p><button class="principal" id="bEntrar">${t("entrar")}</button>` : `<p>${t("recordada", esc(e.guardada.nombre))}</p><button class="principal" id="bSeguir">${t("seguir")}</button><p class="ayuda">${t("permiso")}</p>`;
      h += `<p><button class="secundario" id="bElegir">${t("otra")}</button></p>`;
    } else if (e.pantalla !== "informe") {
      h += `<button class="principal" id="bElegir">${t("elegir")}</button><p class="ayuda">${t("donde")}</p>`;
    }
    if (e.pantalla === "informe") {
      const r = e.informe;
      h += r.avisos.map(a => `<p class="aviso">${a}</p>`).join("");
      h += '<ul id="informe">' + r.partes.map(p => `<li class="${p.ok ? "ok" : "mal"}"><span class="marca">${p.ok ? "✔" : "✘"}</span>${t("p_" + p.id)}<span class="det">${esc(p.det)}</span></li>`).join("") + "</ul>";
      h += `<p class="ayuda">${t("total", tam(r.total), r.n)}</p>`;
      if (r.ok) h += `<p class="bien">${t("todoBien")}</p>`; else {
        h += `<p class="aviso">${t("noJuego")}</p>`;
        if (r.partes.some(p => p.ok)) h += `<p class="ayuda">${t("incompleto")}</p>`;
        h += `<button class="principal" id="bElegir">${t("otra")}</button>`;
      }
    }
    if (e.error) h += `<p class="aviso">${e.error}</p>`;
    if (!(e.pantalla === "informe" && e.informe.ok)) h += comprar;
  }
  C().innerHTML = h;
  $("bElegir")?.addEventListener("click", elegir);
  $("bSeguir")?.addEventListener("click", seguirGuardada);
  $("bEntrar")?.addEventListener("click", () => usar(estado.guardada.handle));
}

const fijar = cambios => {
  estado = {
    ...estado,
    ...cambios
  };
  pintar();
};

async function elegir() {
  let dir;
  try {
    dir = await window.showDirectoryPicker({
      id: "sh4juego",
      mode: "read",
      startIn: "desktop"
    });
  } catch (e) {
    if (e?.name === "AbortError") return;
    return fijar({
      error: e?.name === "SecurityError" || e?.name === "NotAllowedError" ? t("bloqueada") : t("error", esc(e?.message || e))
    });
  }
  return usar(dir);
}

async function seguirGuardada() {
  const h = estado.guardada.handle;
  let p = "denied";
  try {
    p = await h.requestPermission({
      mode: "read"
    });
  } catch {}
  if (p !== "granted") return fijar({
    permiso: p,
    error: t("sinPermiso")
  });
  return usar(h);
}

async function usar(dir) {
  fijar({
    pantalla: "analizando",
    avance: "",
    error: null
  });
  let r;
  try {
    r = await analizar(dir, a => fijar({
      avance: a
    }));
  } catch (e) {
    return fijar({
      pantalla: "inicio",
      error: e?.name === "NotAllowedError" ? t("sinPermiso") : t("error", esc(e?.message || e))
    });
  }
  fijar({
    pantalla: "informe",
    informe: r
  });
  window.sh4carpeta.ultimo = r;
  if (!r.ok) return r;
  try {
    await guardar(r.raiz);
    await activarSw();
  } catch (e) {
    fijar({
      error: e?.sinSw ? t("sinSw") : t("error", esc(e?.message || e))
    });
    return r;
  }
  if (!q.has("quedarse")) setTimeout(() => location.assign(destino()), 900);
  return r;
}

for (const b of document.querySelectorAll("#idiomas button")) b.addEventListener("click", () => {
  fijarIdioma(b.dataset.idioma);
  ingles = b.dataset.idioma !== "s";
  pintar();
});

window.sh4carpeta = {
  analizar: analizar,
  usar: usar,
  guardar: guardar,
  leerGuardada: leerGuardada,
  activarSw: activarSw
};

(async () => {
  if (typeof window.showDirectoryPicker !== "function" || !window.isSecureContext || q.has("sinapi")) {
    estado = {
      pantalla: "sinApi"
    };
    return pintar();
  }
  const g = await leerGuardada();
  if (g?.handle) {
    let permiso = "prompt";
    try {
      permiso = await g.handle.queryPermission({
        mode: "read"
      });
    } catch {}
    estado = {
      pantalla: "inicio",
      guardada: g,
      permiso: permiso
    };
  }
  pintar();
})();
