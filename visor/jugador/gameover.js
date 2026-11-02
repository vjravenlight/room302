// SH4 web — FeniXVOID · Project Ravenlight
import { imagenJuego } from "../suite_juego.js";

export function crearGameOver({contenedor: contenedor = document.body, alContinuar: alContinuar} = {}) {
  const el = document.createElement("div");
  el.id = "shGameOver";
  el.innerHTML = `<style>\n#shGameOver{position:fixed;inset:0;z-index:85;display:none;background:#000;opacity:0;transition:opacity 2.5s;align-items:center;justify-content:center;\n  flex-direction:column;font-family:'Cormorant Garamond',Garamond,Georgia,serif}\n#shGameOver.visible{display:flex}\n#shGameOver.lleno{opacity:1}\n#shGameOver .img{max-width:100vw;max-height:100vh;aspect-ratio:640/448;width:min(100vw,calc(100vh*640/448));background:#000 center/cover no-repeat}\n#shGameOver .titulo{position:absolute;top:58%;letter-spacing:.55em;color:#c0261a;font-size:clamp(28px,5vw,58px);text-shadow:0 0 18px rgba(0,0,0,.9)}\n#shGameOver .op{position:absolute;top:72%;color:#ece3d2;font-size:18px;letter-spacing:.3em;cursor:pointer;opacity:0;transition:opacity 1s 2s}\n#shGameOver.lleno .op{opacity:.85}\n#shGameOver .op:hover{color:#fff;text-shadow:0 0 10px #c0261a}\n</style><div class="img"></div><div class="titulo">GAME OVER</div><div class="op">CONTINUAR</div>`;
  contenedor.appendChild(el);
  imagenJuego("snap_gameover", 0, [ 0, 0, 512, 448 ]).then(c => {
    el.querySelector(".img").style.backgroundImage = `url(${c.toDataURL()})`;
  }).catch(() => {});
  function continuar() {
    el.classList.remove("lleno");
    setTimeout(() => el.classList.remove("visible"), 400);
    alContinuar?.();
  }
  el.querySelector(".op").addEventListener("click", continuar);
  addEventListener("keydown", e => {
    if (el.classList.contains("lleno") && (e.code === "Enter" || e.code === "Space")) continuar();
  });
  return {
    mostrar() {
      el.classList.add("visible");
      requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("lleno")));
    },
    ocultar() {
      el.classList.remove("lleno", "visible");
    },
    continuar: continuar,
    el: el
  };
}
