// SH4 web — FeniXVOID · Project Ravenlight
import * as THREE from "three";

import { partesBin } from "../lib/sh4bin.js";

import { aRGBA } from "../lib/texturas.js";

const q = new URLSearchParams(location.search);

const antes = q.get("v") === "antes", casco = q.has("casco"), CUADROS = +(q.get("cuadros") || 90);

const {crearFiltros: crearFiltros} = await (import(antes ? "./ruido_antes.js" : "../efectos/ruido.js"));

const W = 1280, H = 720, COL = 3, FIL = 2, TW = W / COL, TH = H / FIL;

const renderer = new THREE.WebGLRenderer({
  preserveDrawingBuffer: true
});

renderer.setPixelRatio(1);

renderer.setSize(W, H, false);

renderer.outputColorSpace = THREE.SRGBColorSpace;

renderer.autoClear = false;

document.body.appendChild(renderer.domElement);

renderer.domElement.style.width = "100%";

const fondoTex = await (new THREE.TextureLoader).loadAsync("./fondo_bd16.jpg");

fondoTex.colorSpace = THREE.SRGBColorSpace;

const CASOS = [ [ "1 enemigo a 3 m", [ {
  distancia: 3,
  tipo: "HYENA"
} ] ], [ "3 enemigos (3, 5, 7 m)", [ 3, 5, 7 ].map(d => ({
  distancia: d,
  tipo: "HYENA"
})) ], [ "6 enemigos (2 a 8 m)", [ 2, 3, 4, 5, 6, 8 ].map(d => ({
  distancia: d,
  tipo: "HYENA"
})) ], [ "fantasma (MULTI) a 1 m", [ {
  distancia: 1,
  tipo: "MULTI"
} ] ], [ "máximo: 3 fantasmas pegados", [ .3, .5, .8 ].map(d => ({
  distancia: d,
  tipo: "FLAMES"
})) ], [ "sin enemigos", [] ] ];

const tiles = CASOS.map(([nombre, lista]) => {
  const escena = new THREE.Scene;
  const camara = new THREE.PerspectiveCamera(casco ? 100 : 60, TW / TH, .01, 100);
  escena.add(camara);
  const h = 2 * 10 * Math.tan(camara.fov * Math.PI / 360), w = h * camara.aspect;
  const fondo = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({
    map: fondoTex,
    depthTest: false
  }));
  fondo.position.z = -10;
  fondo.renderOrder = -1;
  camara.add(fondo);
  const f = crearFiltros({
    THREE: THREE,
    lib: {
      partesBin: partesBin,
      aRGBA: aRGBA
    },
    camara: camara
  });
  return {
    nombre: nombre,
    lista: lista,
    escena: escena,
    camara: camara,
    f: f
  };
});

for (const t of tiles) {
  await t.f.cargar();
  t.f.alCargarSala("bd16");
  let s = 12345;
  t.f.opciones({
    rand: () => ((s = s * 16807 % 2147483647) - 1) / 2147483646
  });
  t.f.opciones?.({
    pantalla: [ TW, TH ]
  });
  for (let i = 0; i < CUADROS; i++) {
    t.f.enemigos(t.lista);
    t.f.actualizar(1 / 30, casco);
  }
}

renderer.clear();

tiles.forEach((t, i) => {
  const x = i % COL * TW, y = H - (Math.floor(i / COL) + 1) * TH;
  renderer.setViewport(x, y, TW, TH);
  renderer.setScissor(x, y, TW, TH);
  renderer.setScissorTest(true);
  renderer.render(t.escena, t.camara);
});

renderer.setScissorTest(false);

window.hoja = (calidad = .8) => {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d");
  g.drawImage(renderer.domElement, 0, 0);
  g.font = "bold 18px sans-serif";
  g.textBaseline = "top";
  tiles.forEach((t, i) => {
    const x = i % COL * TW, y = Math.floor(i / COL) * TH, e = t.f.estado;
    const txt = `${t.nombre} · ${(e.actual || []).slice(0, 3).join("/")}`;
    g.fillStyle = "rgba(0,0,0,0.7)";
    g.fillRect(x + 4, y + 4, g.measureText(txt).width + 12, 26);
    g.fillStyle = "#ffd24a";
    g.fillText(txt, x + 10, y + 8);
    g.strokeStyle = "#444";
    g.strokeRect(x + .5, y + .5, TW - 1, TH - 1);
  });
  const rot = `${antes ? "ANTES" : "AHORA"} · ${casco ? "casco" : "PC"} · ${CUADROS} cuadros (grano/película/destello)`;
  g.fillStyle = "rgba(0,0,0,0.75)";
  g.fillRect(W - g.measureText(rot).width - 24, H - 34, g.measureText(rot).width + 20, 28);
  g.fillStyle = "#fff";
  g.fillText(rot, W - g.measureText(rot).width - 14, H - 29);
  return c.toDataURL("image/jpeg", calidad);
};

window.listo = {
  estados: tiles.map(t => [ t.nombre, t.f.estado ])
};
