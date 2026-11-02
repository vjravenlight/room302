// SH4 web — FeniXVOID · Project Ravenlight
import { imagenJuego } from "./suite_juego.js";

import { sitioIngles } from "./textos_sitio.js";

const TIEMPOS = {
  entra: 1,
  queda: 2,
  sale: 1
};

const TEXTO = {
  es: {
    titulo: "Un tributo · Museo virtual",
    cuerpo: [ "Este sitio es un homenaje hecho por un fan, sin fines de lucro: un museo virtual para recorrer, estudiar y preservar " + "Silent Hill 4: The Room.", "No es un producto oficial y no tiene ninguna relación con Konami.", "Silent Hill y Silent Hill 4: The Room, sus personajes, imágenes, música y sonidos son obras y marcas de Konami Digital " + "Entertainment. Todos los derechos pertenecen a sus dueños.", "Si te gusta, apoyá el juego original." ],
    firma: "FeniXVOID · Project Ravenlight",
    seguir: "clic, tecla o A para entrar"
  },
  en: {
    titulo: "A tribute · Virtual museum",
    cuerpo: [ "This site is a non-profit fan homage: a virtual museum to explore, study and preserve Silent Hill 4: The Room.", "It is not an official product and is in no way affiliated with Konami.", "Silent Hill and Silent Hill 4: The Room, its characters, images, music and sounds are works and trademarks of Konami " + "Digital Entertainment. All rights belong to their owners.", "If you enjoy it, support the original game." ],
    firma: "FeniXVOID · Project Ravenlight",
    seguir: "click, press a key or A to enter"
  }
};

export async function mostrarIntro({forzar: forzar = false} = {}) {
  const q = new URLSearchParams(location.search);
  if (q.has("sinintro")) return;
  let vista = false;
  try {
    vista = sessionStorage.getItem("sh4introVista") === "1";
  } catch {}
  if (vista && !forzar && !q.has("intro")) return;
  try {
    sessionStorage.setItem("sh4introVista", "1");
  } catch {}
  const capa = document.createElement("div");
  capa.id = "introTributo";
  capa.style.cssText = "position:fixed;inset:0;z-index:100000;background:#000;display:flex;align-items:center;justify-content:center;cursor:pointer";
  const lienzo = document.createElement("canvas");
  lienzo.width = 640;
  lienzo.height = 480;
  lienzo.style.cssText = "width:min(100vw,133.33vh);height:min(75vw,100vh);image-rendering:auto";
  capa.appendChild(lienzo);
  document.body.appendChild(capa);
  const desborde = document.documentElement.style.overflow;
  document.documentElement.style.overflow = "hidden";
  const g = lienzo.getContext("2d");
  let pedido = false;
  const pedir = () => {
    pedido = true;
  };
  const teclas = e => {
    e.stopImmediatePropagation();
    e.preventDefault();
    if (!e.repeat) pedir();
  };
  capa.addEventListener("pointerdown", pedir);
  addEventListener("keydown", teclas, true);
  let botonAntes = false;
  const joystick = () => {
    const a = [ ...navigator.getGamepads?.() || [] ].some(p => p?.buttons?.[0]?.pressed);
    if (a && !botonAntes) pedir();
    botonAntes = a;
  };
  const esperar = (seg, alCuadro) => new Promise(ok => {
    const t0 = performance.now();
    const paso = () => {
      joystick();
      const k = Math.min(1, (performance.now() - t0) / 1e3 / seg);
      alCuadro?.(k);
      if (k >= 1 || pedido) ok(); else requestAnimationFrame(paso);
    };
    requestAnimationFrame(paso);
  });
  const logos = await Promise.all([ 0, 2 ].map(n => imagenJuego("snap_opening", n, [ 0, 0, 512, 512 ], {
    escalaX: 1
  }).catch(() => null)));
  const dibujarLogo = (im, a) => {
    g.globalAlpha = 1;
    g.fillStyle = "#000";
    g.fillRect(0, 0, 640, 480);
    g.globalAlpha = a;
    g.drawImage(im, 64, -16, 512, 512);
    g.globalAlpha = 1;
  };
  for (const im of logos) {
    if (!im || pedido) continue;
    await esperar(TIEMPOS.entra, k => dibujarLogo(im, k));
    await esperar(TIEMPOS.queda, () => dibujarLogo(im, 1));
    await esperar(TIEMPOS.sale, k => dibujarLogo(im, 1 - k));
  }
  pedido = false;
  g.fillStyle = "#000";
  g.fillRect(0, 0, 640, 480);
  const T = TEXTO[sitioIngles() ? "en" : "es"];
  const cartel = document.createElement("div");
  cartel.style.cssText = "position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;" + 'padding:6vh 16px;box-sizing:border-box;text-align:center;color:#c9c2b6;font-family:"Cormorant Garamond",Georgia,serif;opacity:0;transition:opacity 1s';
  cartel.innerHTML = `<div style="max-width:720px">\n    <div style="font-size:clamp(20px,3.4vw,34px);letter-spacing:.12em;color:#b23a2a;margin-bottom:1.2em;text-transform:uppercase">${T.titulo}</div>\n    ${T.cuerpo.map(p => `<p style="font-size:clamp(15px,2vw,20px);line-height:1.5;margin:0 0 .9em">${p}</p>`).join("")}\n    <div style="margin-top:1.6em;font-size:clamp(13px,1.6vw,16px);color:#8f857a;letter-spacing:.08em">${T.firma}</div>\n    <div id="introSeguir" style="margin-top:2.4em;font-size:12px;color:#5f574f;opacity:0;transition:opacity .6s">${T.seguir}</div>\n  </div>`;
  capa.appendChild(cartel);
  requestAnimationFrame(() => {
    cartel.style.opacity = "1";
  });
  await esperar(1.5);
  pedido = false;
  cartel.querySelector("#introSeguir").style.opacity = "1";
  await esperar(20);
  capa.style.transition = "opacity .8s";
  capa.style.opacity = "0";
  await new Promise(ok => setTimeout(ok, 800));
  removeEventListener("keydown", teclas, true);
  capa.remove();
  document.documentElement.style.overflow = desborde;
}
