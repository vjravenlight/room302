// SH4 web — FeniXVOID · Project Ravenlight
export let hayCasco = null;

let pregunta = null;

export function averiguarCasco() {
  if (!pregunta) {
    pregunta = (async () => {
      if (!navigator.xr?.isSessionSupported) return false;
      try {
        return !!await Promise.race([ navigator.xr.isSessionSupported("immersive-vr").catch(() => false), new Promise(r => setTimeout(() => r(false), 2500)) ]);
      } catch {
        return false;
      }
    })().then(v => hayCasco = v);
  }
  return pregunta;
}

function estilo() {
  if (document.getElementById("estiloVRBoton")) return;
  const s = document.createElement("style");
  s.id = "estiloVRBoton";
  s.textContent = ".vrSinCasco,.vrFueraDeMenu{display:none !important}";
  document.head.appendChild(s);
}

export function soloConCasco(el) {
  if (!el) return el;
  estilo();
  el.classList.add("vrSinCasco");
  averiguarCasco().then(h => {
    if (h) el.classList.remove("vrSinCasco");
  });
  return el;
}

export function soloEnMenu(el, visible) {
  if (!el) return;
  estilo();
  el.classList.toggle("vrFueraDeMenu", !visible);
}
