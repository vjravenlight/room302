// SH4 web — FeniXVOID · Project Ravenlight
import "./pantalla_completa.js";

import { vigilarPagina } from "./textos_sitio.js";

vigilarPagina();

const PAGINAS = [ [ "suite.html", "Inicio" ], [ "modo_juego/juego.html", "Jugar" ], [ "index.html", "Escenarios" ], [ "modelos.html", "Modelos" ], [ "cine.html", "Cinemáticas" ], [ "musica.html", "Música" ], [ "sin_usar.html", "Sin usar" ], [ "suite.html#opciones", "Opciones" ] ];

if (!new URLSearchParams(location.search).has("limpio")) {
  const actual = location.pathname.split("/").pop() || "index.html";
  const cabeza = document.head;
  for (const href of [ "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&display=swap", "./suite.css" ]) {
    if ([ ...cabeza.querySelectorAll("link[rel=stylesheet]") ].some(l => l.getAttribute("href") === href)) continue;
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = href;
    cabeza.appendChild(l);
  }
  document.body.classList.add("sh-con-nav");
  const vineta = document.createElement("div");
  vineta.id = "shVineta";
  const nav = document.createElement("nav");
  nav.id = "suiteNav";
  nav.setAttribute("aria-label", "Suite");
  const aca = PAGINAS.find(([h]) => h === actual)?.[1] || "Suite";
  nav.innerHTML = "<b>SH4</b>" + `<button type="button" id="suiteNavBoton" aria-expanded="false" aria-controls="suiteNavLista">${aca} <i aria-hidden="true">▾</i></button>` + '<div id="suiteNavLista">' + PAGINAS.map(([h, t]) => `<a href="./${h}"${h === actual ? ' class="aca" aria-current="page"' : ""}>${t}</a>`).join("") + "</div>";
  document.body.append(vineta, nav);
  const boton = nav.querySelector("#suiteNavBoton");
  const abrir = si => {
    nav.classList.toggle("abierta", si);
    boton.setAttribute("aria-expanded", si ? "true" : "false");
  };
  boton.addEventListener("click", e => {
    e.stopPropagation();
    abrir(!nav.classList.contains("abierta"));
  });
  document.addEventListener("click", e => {
    if (!nav.contains(e.target)) abrir(false);
  });
  nav.addEventListener("keydown", e => {
    if (e.key === "Escape" && nav.classList.contains("abierta")) {
      e.stopPropagation();
      abrir(false);
      boton.focus();
    }
  });
  for (const a of nav.querySelectorAll("a")) a.addEventListener("click", () => abrir(false));
  if (document.body.classList.contains("sh-portada") || actual === "musica.html") {
    const c = document.createElement("canvas");
    c.width = c.height = 160;
    const g = c.getContext("2d"), img = g.createImageData(160, 160);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = Math.random() * 255;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    const grano = document.createElement("div");
    grano.id = "shGrano";
    grano.style.backgroundImage = `url(${c.toDataURL()})`;
    document.body.appendChild(grano);
  }
}
