// SH4 web — FeniXVOID · Project Ravenlight
if (!new URLSearchParams(location.search).has("limpio") && !window.__sh4PantallaCompleta) {
  window.__sh4PantallaCompleta = true;
  const doc = document.documentElement;
  const pedir = doc.requestFullscreen || doc.webkitRequestFullscreen;
  const salir = document.exitFullscreen || document.webkitExitFullscreen;
  const enCompleta = () => !!(document.fullscreenElement || document.webkitFullscreenElement);
  const b = document.createElement("button");
  b.id = "botonPantallaCompleta";
  b.title = "Pantalla completa";
  b.style.cssText = "position:fixed;top:calc(6px + env(safe-area-inset-top));left:calc(6px + env(safe-area-inset-left));z-index:40;" + "width:34px;height:34px;font:18px/1 Georgia,serif;background:rgba(0,0,0,.55);color:#e8d9c4;border:1px solid #6a4a3a;" + "border-radius:4px;padding:0;cursor:pointer;transition:opacity .4s";
  const rotulo = () => {
    b.textContent = enCompleta() ? "⤡" : "⤢";
    b.title = enCompleta() ? "Salir de pantalla completa" : "Pantalla completa";
  };
  rotulo();
  let ultimo = 0;
  const accionar = async e => {
    e.stopPropagation();
    e.preventDefault?.();
    if (performance.now() - ultimo < 600) return;
    ultimo = performance.now();
    try {
      if (enCompleta()) await salir.call(document); else if (pedir) {
        await pedir.call(doc, {
          navigationUI: "hide"
        });
        try {
          await (screen.orientation?.lock?.("landscape"));
        } catch {}
      } else alert('Este navegador no deja usar pantalla completa en una página.\nEn el iPhone: Compartir → "Agregar a pantalla de inicio" y abrilo desde ahí.');
    } catch (err) {
      console.warn("pantalla completa", err);
    }
  };
  b.addEventListener("click", accionar);
  b.addEventListener("touchend", accionar, {
    passive: false
  });
  b.addEventListener("pointerup", e => {
    if (e.pointerType !== "mouse") accionar(e);
  });
  for (const ev of [ "touchstart", "pointerdown" ]) b.addEventListener(ev, e => e.stopPropagation(), {
    passive: true
  });
  document.addEventListener("fullscreenchange", rotulo);
  document.addEventListener("webkitfullscreenchange", rotulo);
  let t = null;
  const mostrar = () => {
    b.style.opacity = "1";
    clearTimeout(t);
    t = setTimeout(() => {
      b.style.opacity = matchMedia("(pointer: coarse)").matches ? ".45" : "0";
    }, 3e3);
  };
  addEventListener("pointermove", mostrar, {
    passive: true
  });
  addEventListener("touchstart", mostrar, {
    passive: true
  });
  const ocultarEnVR = () => {
    b.style.display = navigator.xr && document.querySelector("canvas") && globalThis.__sh4EnVR ? "none" : "block";
  };
  setInterval(ocultarEnVR, 1e3);
  const poner = () => {
    document.body.appendChild(b);
    mostrar();
  };
  if (document.body) poner(); else addEventListener("DOMContentLoaded", poner);
}
