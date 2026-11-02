// SH4 web — FeniXVOID · Project Ravenlight
import { aRGBA } from "./lib/texturas.js";

const VISTAS = {
  normal: "Normal (como el juego)",
  textura: "Solo textura",
  luz: "Solo luz en los vértices (en el 302 casi no hay: está en la textura)",
  alfaTex: "Transparencia de la textura",
  alfaVert: "Transparencia del vértice",
  piezas: "Cada pieza de un color",
  uv: "Coordenadas de textura (UV)"
};

export function iniciarInspeccion({THREE: THREE, escena: escena, camara: camara, sala: sala, info: info, escala: escala, redibujar: redibujar, getColision: getColision}) {
  const estado = {
    vista: "normal",
    capas: {
      normal: true,
      calco: true,
      transparente: true,
      colision: false,
      luces: false,
      niebla: true,
      alambre: false
    }
  };
  const lucesGrupo = new THREE.Group;
  lucesGrupo.visible = false;
  escena.add(lucesGrupo);
  const css = document.createElement("style");
  css.textContent = `\n  #insp { position: fixed; top: 10px; right: 10px; width: 300px; max-height: calc(100% - 20px); overflow: auto; background: rgba(0,0,0,.72);\n    border: 1px solid #3a302a; padding: 8px 10px; font: 13px/1.4 Georgia, serif; color: #c9c2b6; display: none; }\n  #insp h3 { margin: 6px 0 4px; font-size: 13px; color: #b59c7a; font-weight: normal; text-transform: uppercase; letter-spacing: .05em; }\n  #insp label { display: block; cursor: pointer; }\n  #insp select { width: 100%; font: inherit; background: #1a1412; color: #c9c2b6; border: 1px solid #4a3c34; }\n  #insp canvas { width: 128px; height: 128px; image-rendering: pixelated; border: 1px solid #4a3c34; background:\n    repeating-conic-gradient(#333 0 25%, #222 0 50%) 0 0 / 16px 16px; }\n  #insp .dato { font-size: 12px; color: #9d9388; white-space: pre-line; }\n  #mira { position: fixed; left: 50%; top: 50%; width: 10px; height: 10px; margin: -5px 0 0 -5px; border: 1px solid #f0d0a0;\n    border-radius: 50%; pointer-events: none; display: none; mix-blend-mode: difference; }\n  #btnInsp { position: fixed; top: 10px; right: 10px; font: 13px Georgia, serif; background: #1a1412; color: #c9c2b6;\n    border: 1px solid #4a3c34; padding: 3px 8px; cursor: pointer; }`;
  document.head.appendChild(css);
  const btn = document.createElement("button");
  btn.id = "btnInsp";
  btn.textContent = "Inspección (I)";
  const panel = document.createElement("div");
  panel.id = "insp";
  panel.innerHTML = `\n    <div style="display:flex;justify-content:space-between"><b>Inspección</b><a href="#" id="inspCerrar" style="color:#b59c7a">cerrar (I)</a></div>\n    <h3>Vista</h3><select id="inspVista">${Object.entries(VISTAS).map(([k, v]) => `<option value="${k}">${v}</option>`).join("")}</select>\n    <h3>Capas</h3>\n    <label><input type="checkbox" data-capa="normal" checked> Escenario base</label>\n    <label><input type="checkbox" data-capa="calco" checked> Calcos encima (sombras, manchas)</label>\n    <label><input type="checkbox" data-capa="transparente" checked> Transparentes (rejas, hojas)</label>\n    <label><input type="checkbox" data-capa="alambre"> Alambre (triángulos)</label>\n    <label><input type="checkbox" data-capa="colision"> Colisión del juego</label>\n    <label><input type="checkbox" data-capa="luces"> Luces del juego</label>\n    <label><input type="checkbox" data-capa="niebla" checked> Niebla del juego</label>\n    <h3>En el centro de la vista</h3>\n    <canvas id="inspTex" width="128" height="128"></canvas>\n    <div class="dato" id="inspPieza">—</div>\n    <h3>Sala</h3><div class="dato" id="inspSala">—</div>`;
  document.body.append(btn, panel);
  const mira = document.createElement("div");
  mira.id = "mira";
  document.body.appendChild(mira);
  const $ = id => document.getElementById(id);
  const abrir = si => {
    panel.style.display = si ? "block" : "none";
    btn.style.display = si ? "none" : "block";
    mira.style.display = si ? "block" : "none";
    redibujar();
  };
  btn.onclick = () => abrir(true);
  $("inspCerrar").onclick = e => {
    e.preventDefault();
    abrir(false);
  };
  addEventListener("keydown", e => {
    if (e.code === "KeyI") abrir(panel.style.display !== "block");
  });
  $("inspVista").onchange = e => {
    estado.vista = e.target.value;
    aplicar();
  };
  panel.querySelectorAll("[data-capa]").forEach(c => {
    c.onchange = () => {
      estado.capas[c.dataset.capa] = c.checked;
      aplicar();
    };
  });
  const colorPieza = n => (new THREE.Color).setHSL(n * .618034 % 1, .65, .55);
  function material(m, vista) {
    const u = m.userData, o = u.matOriginal;
    u.mats ??= {};
    if (u.mats[vista]) return u.mats[vista];
    let mat;
    const base = {
      side: THREE.DoubleSide,
      transparent: o.transparent,
      depthWrite: o.depthWrite,
      polygonOffset: o.polygonOffset,
      polygonOffsetFactor: o.polygonOffsetFactor,
      polygonOffsetUnits: o.polygonOffsetUnits
    };
    if (vista === "normal") mat = o; else if (vista === "textura") mat = new THREE.MeshBasicMaterial({
      ...base,
      map: u.tex,
      alphaTest: o.alphaTest
    }); else if (vista === "piezas") mat = new THREE.MeshBasicMaterial({
      ...base,
      color: colorPieza(u.pieza),
      transparent: u.grupo !== "normal",
      opacity: u.grupo === "normal" ? 1 : .6
    }); else {
      const frag = {
        luz: "gl_FragColor = vec4(sRGBTransferOETF(vec4(vCol.rgb, 1.0)).rgb, 1.0);",
        alfaTex: "vec4 t = texture2D(map, vUv); gl_FragColor = vec4(vec3(t.a), 1.0);",
        alfaVert: "gl_FragColor = vec4(vec3(vCol.a), 1.0);",
        uv: "gl_FragColor = vec4(fract(vUv), 0.0, 1.0);"
      }[vista];
      mat = new THREE.ShaderMaterial({
        side: THREE.DoubleSide,
        depthWrite: true,
        uniforms: {
          map: {
            value: u.tex
          }
        },
        vertexShader: "attribute vec4 color; varying vec2 vUv; varying vec4 vCol; void main(){ vUv = uv; vCol = color; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
        fragmentShader: "uniform sampler2D map; varying vec2 vUv; varying vec4 vCol; void main(){ " + (u.tex || vista !== "alfaTex" ? frag : "gl_FragColor = vec4(1.0,0.0,1.0,1.0);") + " }"
      });
    }
    u.mats[vista] = mat;
    return mat;
  }
  function aplicar() {
    $("inspVista").value = estado.vista;
    sala.traverse(m => {
      if (!m.isMesh || !m.userData.matOriginal) return;
      const mat = material(m, estado.vista);
      mat.wireframe = estado.capas.alambre;
      m.material = mat;
      m.visible = !!estado.capas[m.userData.grupo];
    });
    const col = getColision();
    if (col) col.visible = estado.capas.colision;
    lucesGrupo.visible = estado.capas.luces;
    const ns = window.sh4.niebla;
    const prendida = ns ? ns.activar(estado.capas.niebla) : false;
    escena.fog = null;
    escena.background = prendida ? (new THREE.Color).setRGB(...ns.co.color, THREE.SRGBColorSpace) : new THREE.Color(0);
    sala.traverse(m => {
      if (m.material) m.material.needsUpdate = true;
    });
    redibujar();
  }
  window.sh4.alCargarSala = () => {
    lucesGrupo.clear();
    for (const l of info.luces || []) {
      if (l.tipo !== 3 && l.tipo !== 4 && l.tipo !== 6) continue;
      const c = (new THREE.Color).setRGB(l.color[0] / 255, l.color[1] / 255, l.color[2] / 255, THREE.SRGBColorSpace);
      const s = new THREE.Mesh(new THREE.SphereGeometry(.07, 12, 8), new THREE.MeshBasicMaterial({
        color: c,
        fog: false
      }));
      s.position.set(-l.pos[0] * escala, -l.pos[1] * escala, l.pos[2] * escala);
      const halo = new THREE.Mesh(new THREE.SphereGeometry(.16, 12, 8), new THREE.MeshBasicMaterial({
        color: c,
        wireframe: true,
        transparent: true,
        opacity: .5,
        fog: false
      }));
      s.add(halo);
      lucesGrupo.add(s);
    }
    const n = info.niebla;
    const fmt = c => `rgb(${c.join(",")})`;
    $("inspSala").textContent = `${info.piezas} piezas · ${info.triangulos} triángulos · ${info.texturas} texturas\n` + `Luces (${(info.luces || []).length}):\n` + (info.luces || []).map(l => `· ${l.nombreTipo} ${fmt(l.color)}`).join("\n") + (n ? `\nNiebla: de ${Math.round(n.cerca * escala * 10) / 10} a ${Math.round(n.lejos * escala * 10) / 10} m, ${fmt(n.color)}` : "\nSin niebla");
    aplicar();
  };
  const rayo = new THREE.Raycaster, centro = new THREE.Vector2(0, 0);
  let ultima = null;
  const canvas = $("inspTex"), ctx = canvas.getContext("2d");
  setInterval(() => {
    if (panel.style.display !== "block") return;
    rayo.setFromCamera(centro, camara);
    const objs = [];
    sala.traverse(m => {
      if (m.isMesh && m.visible && m.userData.matOriginal) objs.push(m);
    });
    const h = rayo.intersectObjects(objs, false)[0];
    const m = h?.object;
    if (m === ultima) return;
    ultima = m;
    if (!m) {
      $("inspPieza").textContent = "—";
      ctx.clearRect(0, 0, 128, 128);
      return;
    }
    const u = m.userData, img = u.img;
    $("inspPieza").textContent = `Pieza ${u.pieza} · capa: ${u.grupo === "normal" ? "base" : u.grupo === "calco" ? "calco encima" : "transparente"}\n` + `Textura ${u.textura}, subimagen ${u.paleta}, ${u.banco ? "banco global del mundo (xxgb)" : "banco de la sala"}\n` + (img ? `${img.ancho}×${img.alto} ${img.formato}` : "SIN TEXTURA") + ` · ${u.triangulos} triángulos\n` + `clut ${u.clut} · backclip ${u.backclip} · modelo de mundo #${u.modeloMundo}\n` + `a ${h.distance.toFixed(2)} m`;
    ctx.clearRect(0, 0, 128, 128);
    if (img) {
      const rgba = aRGBA(img);
      const c2 = document.createElement("canvas");
      c2.width = img.ancho;
      c2.height = img.alto;
      c2.getContext("2d").putImageData(new ImageData(new Uint8ClampedArray(rgba.buffer, rgba.byteOffset, rgba.length), img.ancho, img.alto), 0, 0);
      ctx.drawImage(c2, 0, 0, 128, 128);
    }
  }, 300);
  if (new URLSearchParams(location.search).has("insp")) abrir(true);
  window.sh4.inspeccion = {
    estado: estado,
    aplicar: aplicar,
    abrir: abrir
  };
}
