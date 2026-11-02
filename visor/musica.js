// SH4 web — FeniXVOID · Project Ravenlight
import { indiceSh4 } from "./lib/remoto.js";

import { cabeceraXmd, decodificarXmd } from "./lib/xmd.js";

import { leerOpciones } from "./opciones_sitio.js";

import { sitioIngles } from "./textos_sitio.js";

const $ = id => document.getElementById(id);

const q = new URLSearchParams(location.search);

let ctx = null, gan = null, fuente = null, actual = null, paq = null, lista = [], visibles = [];

const paquetes = new Map;

window.sh4 = {
  info: {
    lista: false
  }
};

const EN = {
  "Pantalla de título": "Title screen",
  "Game over": "Game over",
  "Pantalla de resultados (final)": "Results screen (ending)",
  "Radio del 302: noticiero": "Room 302 radio: newscast",
  "Radio del 302: noticias de la historia": "Room 302 radio: story news",
  "Sigue sonando con el menú abierto": "Keeps playing with the menu open",
  "Uso no identificado": "No zone: an event, a cutscene or unused",
  "suena en": "plays in",
  "ambiente de": "ambience of",
  "con enemigos": "with enemies",
  "2.ª mitad": "2nd half",
  "audio de cinemáticas de": "cutscene audio from",
  "Voz de Jasper en la Wish House (fr20)": "Jasper's voice in the Wish House (fr20)",
  "El agujero del baño (302)": "The bathroom hole (302)",
  "Ruido en la puerta después de la llamada (302)": "Noise at the door after the call (302)",
  "Voces de las medias demos y de los altavoces": "Voices of the half demos and the speakers",
  "Cinemática": "Cutscene",
  zona: "zone",
  zonas: "zones",
  "estéreo": "stereo",
  mono: "mono",
  "repite desde": "loops from",
  "sin repetición": "no loop",
  temas: "tracks",
  de: "of",
  leyendo: "reading",
  "Audio de cinemáticas": "Cutscene audio",
  "MÚSICA": "MUSIC",
  Pausa: "Pause",
  Seguir: "Play",
  Anterior: "Previous",
  Siguiente: "Next",
  "Música": "Music",
  Efectos: "Effects",
  "Salir del casco": "Exit headset",
  "no se pudo leer": "could not read",
  "¿el juego está abierto?": "is the game open?"
};

const tr = t => sitioIngles() ? EN[t] ?? t : t === "Uso no identificado" ? "Sin zona: evento, cinemática o sin usar" : t;

if (sitioIngles()) {
  $("filtro").placeholder = "search…";
  $("filtro").title = "search by name, place or number";
  $("soloUso").nextSibling.textContent = " only with a known use";
  for (const [id, t] of [ [ "anterior", "previous" ], [ "pausa", "pause" ], [ "siguiente", "next" ] ]) $(id).title = t;
}

async function json(ruta) {
  try {
    const r = await fetch(ruta, {
      cache: "no-cache"
    });
    return r.ok ? await r.json() : null;
  } catch {
    return null;
  }
}

const [SON, NOM, LISTA] = await Promise.all([ json("/datos/sonido.json"), json("./nombres.json"), json("/juego-lista.json") ]);

const corto = s => String(s || "").replace(/\s*\(.*\)\s*$/, "");

const nombreMundo = st => corto(NOM?.mundos?.[st]?.nombre) || st;

function lugar(st, escena) {
  const n = st === "rl" ? escena - 1 : escena;
  const sala = st + String(Math.max(0, n)).padStart(2, "0");
  const ns = NOM?.salas?.[sala]?.nombre;
  return {
    texto: `${nombreMundo(st)} · ${ns ? ns + " " : ""}(${sala})`,
    sala: sala
  };
}

const USOS = {
  "bgm.sh4": new Map,
  "se.sh4": new Map
};

function uso(paqN, i, texto, titulo = null) {
  let u = USOS[paqN]?.get(i);
  if (!USOS[paqN]) return;
  if (!u) USOS[paqN].set(i, u = {
    titulo: null,
    usos: new Set,
    lugares: []
  });
  if (titulo && !u.titulo) u.titulo = titulo;
  if (texto) u.usos.add(texto);
  return u;
}

const aIndice = no => no >= 1e4 && no < 2e4 ? [ "bgm.sh4", no - 1e4 ] : no >= 2e4 && no < 3e4 ? [ "se.sh4", no - 2e4 ] : no >= 3e4 && no < 4e4 ? [ "bgm.sh4", no - 3e4 ] : null;

function armarUsos() {
  uso("bgm.sh4", 58, null, tr("Pantalla de título"));
  uso("bgm.sh4", 59, null, tr("Game over"));
  uso("bgm.sh4", 46, null, tr("Pantalla de resultados (final)"));
  for (let i = 47; i <= 53; i++) uso("bgm.sh4", i, null, `${tr("Radio del 302: noticiero")} ${i - 46}`);
  uso("bgm.sh4", 60, null, `${tr("Radio del 302: noticias de la historia")} 1`);
  uso("bgm.sh4", 61, null, `${tr("Radio del 302: noticias de la historia")} 2`);
  uso("bgm.sh4", 214, null, tr("Voz de Jasper en la Wish House (fr20)"));
  uso("se.sh4", 90, null, tr("El agujero del baño (302)"));
  uso("se.sh4", 91, null, tr("El agujero del baño (302)"));
  uso("se.sh4", 92, null, tr("Ruido en la puerta después de la llamada (302)"));
  for (const no of SON?.bgm_sin_pausa || []) {
    const x = aIndice(no);
    if (x) uso(x[0], x[1], tr("Sigue sonando con el menú abierto"));
  }
  for (const [etapa, regs] of Object.entries(SON?.sdb || {})) {
    const st = etapa.slice(0, 2), lh = etapa.endsWith("_lh");
    for (const r of regs || []) {
      if (r.tipo !== 2 || !r.no) continue;
      const x = aIndice(r.no);
      if (!x) continue;
      const l = lugar(st, r.escena).texto + (r.pagina === 11 ? ` (${tr("con enemigos")})` : "") + (lh ? ` (${tr("2.ª mitad")})` : "");
      const u = uso(x[0], x[1], (x[0] === "se.sh4" ? tr("ambiente de") : tr("suena en")) + " " + l);
      u?.lugares.push({
        mundo: nombreMundo(st),
        texto: l
      });
    }
  }
  for (const r of SON?.remapeo_xmd_cine || []) uso(r.archivo, r.indice, `${tr("audio de cinemáticas de")} ${nombreMundo(r.paquete.slice(0, 2))}`);
}

armarUsos();

function nombreDe(paqN, i, e) {
  if (paqN === "bgm.sh4" || paqN === "se.sh4") {
    const u = USOS[paqN].get(i), usos = [ ...u?.usos || [] ];
    const base = paqN === "bgm.sh4" ? i >= 64 ? 3e4 : 1e4 : 2e4;
    const no = base + i;
    let titulo = u?.titulo;
    if (!titulo && u?.lugares.length) {
      const mundos = [ ...new Set(u.lugares.map(l => l.mundo)) ], salas = new Set(u.lugares.map(l => l.texto.replace(/ \(.*$/, ""))).size;
      titulo = salas === 1 ? u.lugares[0].texto.replace(/ \((2\.ª mitad|2nd half|con enemigos|with enemies)\)/g, "") : mundos.length === 1 ? `${mundos[0]} (${salas} ${tr("zonas")})` : mundos.join(" / ");
    }
    if (!titulo && usos.length) titulo = usos.find(x => !x.startsWith(tr("Sigue sonando"))) || usos[0];
    if (!titulo && paqN === "bgm.sh4" && i >= 64) titulo = tr("Voces de las medias demos y de los altavoces");
    return {
      titulo: titulo || tr("Uso no identificado"),
      usos: usos,
      no: no,
      conocido: !!(u?.titulo || usos.length)
    };
  }
  return {
    titulo: `${tr("Cinemática")} ${e.nombre.replace(".xmd", "")} · ${nombreMundo(paqN.slice(0, 2))}`,
    usos: [],
    no: null,
    conocido: true
  };
}

for (const f of (LISTA?.demo || []).filter(f => f.endsWith(".sh4") && ![ "bgm.sh4", "se.sh4" ].includes(f))) $("paquete").add(new Option(tr("Audio de cinemáticas") + " · " + nombreMundo(f.slice(0, 2)) + ` (${f})`, f));

if (q.get("paquete")) $("paquete").value = q.get("paquete");

const mmss = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

async function abrirPaquete(nombre) {
  $("cuenta").textContent = tr("leyendo") + " " + nombre + "…";
  try {
    if (!paquetes.has(nombre)) paquetes.set(nombre, indiceSh4("/juego/demo/" + encodeURIComponent(nombre)));
    paq = await paquetes.get(nombre);
  } catch (e) {
    paquetes.delete(nombre);
    $("cuenta").textContent = `${tr("no se pudo leer")} ${nombre} (${e.message}): ${tr("¿el juego está abierto?")}`;
    return;
  }
  lista = paq.entradas.map((e, i) => ({
    ...e,
    i: i,
    paquete: nombre
  })).filter(e => e.nombre.endsWith(".xmd") && e.len > 12).map(e => ({
    ...e,
    ...nombreDe(nombre, e.i, e),
    h: null,
    seg: (e.len - 12) / 13 / 2 * 16 / 48e3
  }));
  dibujarLista();
  window.sh4.info = {
    lista: true,
    cabeceras: false,
    paquete: nombre,
    temas: lista.length,
    conNombre: lista.filter(e => e.conocido).length
  };
  lv?.refrescar();
  const yo = paq;
  for (let k = 0; k < lista.length; k += 12) {
    await Promise.all(lista.slice(k, k + 12).map(async e => {
      try {
        const h = cabeceraXmd(new Uint8Array(await paq.leer(e, 12)));
        e.h = h;
        e.ok = h.canales >= 1 && h.canales <= 2 && h.frecuencia > 8e3;
        e.seg = e.ok ? h.bytes / 13 / h.canales * 16 / h.frecuencia : 0;
      } catch {
        e.ok = false;
      }
    }));
    if (yo !== paq) return;
    if (k % 48 === 0) actualizarDatos();
  }
  lista = lista.filter(e => e.ok !== false);
  dibujarLista();
  window.sh4.info = {
    lista: true,
    cabeceras: true,
    paquete: nombre,
    temas: lista.length,
    conNombre: lista.filter(e => e.conocido).length
  };
  lv?.refrescar();
}

function filtrar() {
  const f = $("filtro").value.trim().toLowerCase(), solo = $("soloUso").checked;
  visibles = lista.filter(e => (!solo || e.conocido) && (!f || [ e.nombre, e.titulo, e.no, ...e.usos ].join(" ").toLowerCase().includes(f)));
  return visibles;
}

function datoDe(e) {
  if (!e.h) return e.seg ? "~" + mmss(e.seg) : "";
  return `${e.h.canales === 2 ? tr("estéreo") : tr("mono")} · ${e.h.frecuencia / 1e3} kHz · ` + (e.h.loop ? tr("repite desde") + " " + mmss(Math.floor(e.h.loopBytes / 13 / e.h.canales) * 16 / e.h.frecuencia) : tr("sin repetición")) + ` · ${mmss(e.seg)}`;
}

function dibujarLista() {
  const ul = $("lista");
  ul.textContent = "";
  for (const e of filtrar()) {
    const li = document.createElement("li");
    li.tabIndex = 0;
    li.classList.toggle("sinuso", !e.conocido);
    const num = document.createElement("span");
    num.className = "num";
    const arch = e.nombre.replace(".xmd", "");
    num.textContent = e.no && String(e.no) !== arch ? `${e.no} · ${arch}` : arch;
    const nom = document.createElement("span");
    nom.className = "nombre";
    nom.textContent = e.titulo;
    const extra = e.usos.filter(u => !e.titulo || !u.endsWith(e.titulo));
    if (extra.length) {
      const s = document.createElement("small");
      s.textContent = extra.slice(0, 4).join(" · ") + (extra.length > 4 ? ` (+${extra.length - 4})` : "");
      nom.appendChild(s);
    }
    const dato = document.createElement("span");
    dato.className = "dato";
    dato.textContent = datoDe(e);
    li.append(num, nom, dato);
    li.onclick = () => tocar(e);
    li.onkeydown = ev => {
      if (ev.key === "Enter" || ev.key === " ") {
        ev.preventDefault();
        tocar(e);
      }
    };
    if (actual?.e === e) li.classList.add("sonando");
    e.li = li;
    ul.appendChild(li);
  }
  $("cuenta").textContent = `${visibles.length} ${tr("de")} ${lista.length} ${tr("temas")}`;
}

function actualizarDatos() {
  for (const e of lista) if (e.li) e.li.lastChild.textContent = datoDe(e);
}

function contexto() {
  ctx ??= new AudioContext;
  if (!gan) {
    gan = ctx.createGain();
    gan.connect(ctx.destination);
    gan.gain.value = +$("vol").value;
  }
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

let pedido = 0;

async function tocar(e, desde = 0) {
  const yo = ++pedido;
  contexto();
  $("ahora").innerHTML = "";
  $("ahora").append(Object.assign(document.createElement("b"), {
    textContent: e.titulo
  }), " · " + tr("leyendo") + "…");
  let a;
  try {
    const pq = await paquetes.get(e.paquete);
    a = decodificarXmd(new Uint8Array(await pq.leer(e)));
  } catch (err) {
    $("ahora").textContent = tr("no se pudo leer") + " " + e.nombre;
    return;
  }
  if (yo !== pedido || !a) return;
  const ab = ctx.createBuffer(a.canales.length, a.canales[0].length, a.frecuencia);
  a.canales.forEach((c, i) => ab.copyToChannel(c, i));
  actual = {
    e: e,
    a: a,
    ab: ab
  };
  arrancar(desde);
  document.querySelectorAll("li.sonando").forEach(x => x.classList.remove("sonando"));
  e.li?.classList.add("sonando");
  const b = document.createElement("b");
  b.textContent = e.titulo;
  const t = document.createElement("span");
  t.id = "tiempo";
  $("ahora").textContent = "";
  $("ahora").append(b, ` · ${e.nombre.replace(".xmd", "")} · ${mmss(ab.duration)}` + (a.loop ? ` · ${tr("repite desde")} ${mmss(a.loopInicio / a.frecuencia)}` : ""), t);
  $("pausa").textContent = "⏸";
  window.sh4.info.sonando = {
    nombre: e.nombre,
    titulo: e.titulo,
    seg: +ab.duration.toFixed(1)
  };
  dibujarOnda(true);
  lv?.refrescar();
}

function arrancar(desde = 0) {
  if (!actual) return;
  try {
    fuente?.stop();
  } catch {}
  const {a: a, ab: ab} = actual;
  fuente = ctx.createBufferSource();
  fuente.buffer = ab;
  fuente.loop = $("loop").checked && a.loop;
  fuente.loopStart = a.loopInicio / a.frecuencia;
  fuente.loopEnd = ab.duration;
  fuente.connect(gan);
  desde = Math.max(0, Math.min(ab.duration - .01, desde));
  fuente.start(0, desde);
  actual.inicio = ctx.currentTime - desde;
  const f = fuente;
  f.onended = () => {
    if (f === fuente && !f.loop && ctx.state === "running") {
      $("pausa").textContent = "▶";
    }
  };
}

function posicion() {
  if (!actual || !ctx) return 0;
  const d = actual.ab.duration, t = ctx.currentTime - actual.inicio;
  if (fuente?.loop && t > d) return fuente.loopStart + (t - d) % Math.max(.01, d - fuente.loopStart);
  return Math.min(t, d);
}

function pausar() {
  if (!ctx) return;
  if (ctx.state === "running") {
    ctx.suspend();
    $("pausa").textContent = "▶";
  } else {
    ctx.resume();
    $("pausa").textContent = "⏸";
  }
  lv?.refrescar();
}

function saltar(d) {
  const l = visibles.length ? visibles : lista;
  if (!l.length) return;
  const i = actual ? l.indexOf(actual.e) : -1;
  tocar(l[(i + d + l.length) % l.length]);
}

let ondaBase = null;

function dibujarOnda(nueva) {
  const cv = $("onda"), g = cv.getContext("2d"), W = cv.width, H = cv.height;
  if (nueva || !ondaBase) {
    g.fillStyle = "#100c0a";
    g.fillRect(0, 0, W, H);
    if (actual) {
      const d = actual.a.canales[0], paso = Math.max(1, Math.floor(d.length / W));
      g.fillStyle = "#6e5a45";
      for (let x = 0; x < W; x++) {
        let mn = 1, mx = -1;
        for (let i = x * paso; i < (x + 1) * paso && i < d.length; i += 4) {
          const v = d[i];
          if (v < mn) mn = v;
          if (v > mx) mx = v;
        }
        g.fillRect(x, (1 - mx) * H / 2, 1, Math.max(1, (mx - mn) * H / 2));
      }
      if (actual.a.loop) {
        g.fillStyle = "#b59c7a";
        g.fillRect(Math.round(actual.a.loopInicio / d.length * W), 0, 2, H);
      }
    }
    ondaBase = g.getImageData(0, 0, W, H);
  } else g.putImageData(ondaBase, 0, 0);
}

(function cursor() {
  requestAnimationFrame(cursor);
  if (!actual || !ctx || document.hidden) return;
  dibujarOnda(false);
  const pos = posicion(), W = $("onda").width;
  const g = $("onda").getContext("2d");
  g.fillStyle = "#f0e0c0";
  g.fillRect(Math.round(pos / actual.ab.duration * W), 0, 2, $("onda").height);
  const t = $("tiempo");
  if (t) t.textContent = ` ${mmss(pos)} / ${mmss(actual.ab.duration)}`;
})();

$("onda").addEventListener("pointerdown", ev => {
  if (!actual) return;
  const r = $("onda").getBoundingClientRect();
  contexto();
  arrancar((ev.clientX - r.left) / r.width * actual.ab.duration);
  if (ctx.state !== "running") ctx.resume();
  $("pausa").textContent = "⏸";
});

$("paquete").onchange = ev => {
  q.set("paquete", ev.target.value);
  history.replaceState(null, "", "?" + q);
  abrirPaquete(ev.target.value);
};

$("filtro").oninput = dibujarLista;

$("soloUso").onchange = dibujarLista;

{
  const o = leerOpciones();
  if (Number.isFinite(+o.volMus)) $("vol").value = Math.max(0, Math.min(1, +o.volMus / 10));
}

$("vol").oninput = () => {
  if (gan) gan.gain.value = +$("vol").value;
};

$("pausa").onclick = pausar;

$("anterior").onclick = () => saltar(-1);

$("siguiente").onclick = () => saltar(1);

$("loop").onchange = () => {
  if (fuente) fuente.loop = $("loop").checked && actual?.a.loop;
};

addEventListener("keydown", ev => {
  if (/^(INPUT|SELECT|TEXTAREA)$/.test(ev.target.tagName) && ev.target.type !== "checkbox" && ev.target.type !== "range") return;
  if (ev.code === "Space" && ev.target.tagName !== "LI") {
    ev.preventDefault();
    pausar();
  }
  if (ev.code === "KeyN") saltar(1);
  if (ev.code === "KeyB") saltar(-1);
});

$("wav").onclick = () => {
  if (!actual) return;
  const {a: a, e: e} = actual, ch = a.canales.length, n = a.canales[0].length;
  const dv = new DataView(new ArrayBuffer(44 + n * ch * 2));
  const txt = (o, s) => [ ...s ].forEach((c, i) => dv.setUint8(o + i, c.charCodeAt(0)));
  txt(0, "RIFF");
  dv.setUint32(4, 36 + n * ch * 2, true);
  txt(8, "WAVEfmt ");
  dv.setUint32(16, 16, true);
  dv.setUint16(20, 1, true);
  dv.setUint16(22, ch, true);
  dv.setUint32(24, a.frecuencia, true);
  dv.setUint32(28, a.frecuencia * ch * 2, true);
  dv.setUint16(32, ch * 2, true);
  dv.setUint16(34, 16, true);
  txt(36, "data");
  dv.setUint32(40, n * ch * 2, true);
  for (let i = 0; i < n; i++) for (let c = 0; c < ch; c++) dv.setInt16(44 + (i * ch + c) * 2, Math.max(-32768, Math.min(32767, Math.round(a.canales[c][i] * 32767))), true);
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([ dv.buffer ], {
    type: "audio/wav"
  }));
  link.download = `SH4_${$("paquete").value.replace(".sh4", "")}_${e.nombre.replace(".xmd", "")}.wav`;
  link.click();
};

let lv = null;

async function prepararVR() {
  const {VRButton: VRButton} = await (import("three/addons/webxr/VRButton.js"));
  if (navigator.xr) VRButton.registerSessionGrantedListener();
  const hay = q.has("vr") || navigator.xr && await Promise.race([ navigator.xr.isSessionSupported("immersive-vr").catch(() => false), new Promise(r => setTimeout(() => r(false), 2e3)) ]);
  if (!hay) return;
  const THREE = await (import("three"));
  const {prepararCasco: prepararCasco} = await (import("./jugador/casco_comun.js"));
  const {crearListaVR: crearListaVR} = await (import("./suite_vr_lista.js"));
  const {imagenJuego: imagenJuego, RECORTES: RECORTES} = await (import("./suite_juego.js"));
  const renderer = new THREE.WebGLRenderer({
    antialias: true
  });
  renderer.setPixelRatio(1);
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.xr.enabled = true;
  renderer.xr.setReferenceSpaceType("local-floor");
  Object.assign(renderer.domElement.style, {
    position: "fixed",
    inset: "0",
    zIndex: "200",
    display: "none"
  });
  document.body.appendChild(renderer.domElement);
  const escena = new THREE.Scene;
  escena.background = new THREE.Color(328451);
  escena.fog = new THREE.FogExp2(722951, .08);
  const camara = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, .03, 80);
  camara.position.set(0, 1.6, 0);
  const jugador = new THREE.Group;
  jugador.add(camara);
  escena.add(jugador);
  imagenJuego(...RECORTES.tituloFondo).then(c => {
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = THREE.RepeatWrapping;
    t.repeat.x = -1;
    const R = 7, L = 1.55, alto = R * L / (640 / 448);
    const f = new THREE.Mesh(new THREE.CylinderGeometry(R, R, alto, 48, 1, true, Math.PI - L / 2, L), new THREE.MeshBasicMaterial({
      map: t,
      side: THREE.BackSide,
      color: 6971996,
      fog: false
    }));
    f.position.y = 1.95;
    escena.add(f);
  }).catch(() => {});
  const cascoVR = prepararCasco({
    renderer: renderer,
    camara: camara,
    padre: jugador,
    ojos: 1.6
  });
  const PAQS = [ "bgm.sh4", "se.sh4" ];
  lv = crearListaVR({
    THREE: THREE,
    renderer: renderer,
    camara: camara,
    jugador: jugador,
    seCierra: false,
    porPagina: 12,
    ancho: 1.3,
    distancia: 1.15,
    titulo: () => `${tr("MÚSICA")}${actual ? " - " + actual.e.titulo : ""}`,
    filas: () => visibles.map(e => ({
      texto: e.titulo,
      dato: (e.no ?? e.nombre.replace(".xmd", "")) + (e.seg ? " - " + mmss(e.seg) : ""),
      marcada: actual?.e === e
    })),
    alElegir: i => {
      const e = visibles[i];
      if (e) tocar(e);
    },
    botones: () => [ {
      id: "ant",
      texto: tr("Anterior")
    }, {
      id: "pausa",
      texto: ctx?.state === "running" ? tr("Pausa") : tr("Seguir")
    }, {
      id: "sig",
      texto: tr("Siguiente")
    }, {
      id: "paq",
      texto: $("paquete").value === "bgm.sh4" ? tr("Efectos") : tr("Música")
    }, {
      id: "salir",
      texto: tr("Salir del casco")
    } ],
    alBoton: async id => {
      if (id === "ant") saltar(-1); else if (id === "sig") saltar(1); else if (id === "pausa") pausar(); else if (id === "paq") {
        $("paquete").value = PAQS[(PAQS.indexOf($("paquete").value) + 1) % 2];
        await abrirPaquete($("paquete").value);
      } else if (id === "salir") {
        try {
          await (renderer.xr.getSession()?.end());
        } catch {}
      }
    }
  });
  const reloj = new THREE.Clock;
  function cuadro() {
    const dt = Math.min(.1, reloj.getDelta());
    cascoVR.actualizar(dt, {
      moviendo: false
    });
    lv.actualizar(dt);
    renderer.render(escena, camara);
  }
  renderer.xr.addEventListener("sessionstart", () => {
    globalThis.__sh4EnVR = true;
    contexto();
    renderer.domElement.style.display = "block";
    renderer.setAnimationLoop(cuadro);
    setTimeout(() => {
      lv.abrir();
      if (actual) lv.irA(visibles.indexOf(actual.e));
    }, 400);
  });
  renderer.xr.addEventListener("sessionend", () => {
    globalThis.__sh4EnVR = false;
    renderer.setAnimationLoop(null);
    renderer.domElement.style.display = "none";
  });
  const b = VRButton.createButton(renderer);
  $("vrLugar").appendChild(b);
  const sinCasco = () => b.classList.toggle("sinCasco", /NOT SUPPORTED|NOT AVAILABLE|NOT ALLOWED/i.test(b.textContent || ""));
  sinCasco();
  setTimeout(sinCasco, 1500);
  window.sh4.probarVR = (fila = 2) => {
    renderer.domElement.style.display = "block";
    camara.aspect = innerWidth / innerHeight;
    camara.updateProjectionMatrix();
    const r = lv.vistaPrevia(fila);
    renderer.render(escena, camara);
    return r;
  };
}

prepararVR().catch(e => console.warn("casco", e.message));

abrirPaquete($("paquete").value);
