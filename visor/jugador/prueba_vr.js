// SH4 web — FeniXVOID · Project Ravenlight
import * as THREE from "three";

import { cargarDatos, ITEM } from "./datos.js";

import { crearArmas } from "./armas.js";

import { crearArmaVista } from "./arma_vista.js";

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  preserveDrawingBuffer: true
});

renderer.setSize(innerWidth, innerHeight);

renderer.outputColorSpace = THREE.SRGBColorSpace;

document.body.appendChild(renderer.domElement);

const escena = new THREE.Scene;

escena.background = new THREE.Color(657416);

escena.add(new THREE.AmbientLight(16777215, 1.5));

const rig = new THREE.Group;

escena.add(rig);

const camara = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, .02, 100);

camara.position.set(0, 1.6, 0);

rig.add(camara);

const ctrl = [ new THREE.Group, new THREE.Group ], grip = [ new THREE.Group, new THREE.Group ];

const fuente = {
  handedness: "right",
  gamepad: {
    buttons: [],
    hapticActuators: [ {
      pulse: (f, ms) => {
        vibraciones.push([ f, ms ]);
      }
    } ]
  }
};

const vibraciones = [];

let presentando = true;

const xr = {
  get isPresenting() {
    return presentando;
  },
  getController: i => ctrl[i],
  getControllerGrip: i => grip[i],
  getSession: () => presentando ? {
    inputSources: [ fuente ]
  } : null
};

const falso = {
  xr: xr
};

const datos = await cargarDatos();

const armas = crearArmas({
  THREE: THREE,
  henry: null,
  datos: datos
});

const golpes = [];

const enemigo = {
  posicion: new THREE.Vector3(0, .7, -.75),
  radio: .3,
  alto: .6,
  muerto: false
};

const ctl = {
  s: {
    arma: ITEM.TUBERIA,
    muerto: false,
    estado: 0,
    carga: 0,
    mira: null,
    danio: null
  },
  enemigosLista: () => [ enemigo ],
  golpeExterno: (e, o) => {
    golpes.push({
      ...o
    });
    return true;
  }
};

const vista = crearArmaVista({
  THREE: THREE,
  camara: camara,
  renderer: falso,
  armas: armas,
  ctl: ctl,
  animador: {
    proporcion: 0
  }
});

const bola = new THREE.Mesh(new THREE.SphereGeometry(.3, 16, 12), new THREE.MeshBasicMaterial({
  color: 8396832,
  wireframe: true
}));

bola.position.copy(enemigo.posicion);

escena.add(bola);

for (let i = 0; i < 2; i++) {
  ctrl[i].dispatchEvent({
    type: "connected",
    data: {
      handedness: i === 0 ? "right" : "left"
    }
  });
  grip[i].dispatchEvent({
    type: "connected",
    data: {
      handedness: i === 0 ? "right" : "left"
    }
  });
}

const dt = 1 / 72;

async function cuadros(n, mover) {
  for (let k = 0; k < n; k++) {
    mover?.(k);
    vista.actualizar(dt, {
      modo: "1ra",
      enVR: true
    });
  }
}

const res = {};

for (let k = 0; k < 200 && !vista.modelo; k++) {
  vista.actualizar(dt, {
    modo: "1ra",
    enVR: true
  });
  await new Promise(r => setTimeout(r, 50));
}

vista.actualizar(dt, {
  modo: "1ra",
  enVR: true
});

res.tuberia = {
  lugar: vista.estado.lugar,
  padreEsGrip: vista.montura.parent === grip[0],
  largo: +(vista.modelo?.largo * .005).toFixed(3)
};

grip[0].position.set(.6, .9, -.45);

await cuadros(90, k => {
  grip[0].position.x = .6 - k * (1 / 72);
});

res.lento = {
  golpes: golpes.length,
  vel: +vista.estado.velocidad.toFixed(2)
};

grip[0].position.set(.6, .9, -.45);

await cuadros(2);

await cuadros(30, k => {
  grip[0].position.x = .6 - k * (3 / 72);
});

res.rapido = {
  golpes: golpes.length,
  ultimo: golpes[golpes.length - 1] || null,
  vel: +vista.estado.velocidad.toFixed(2)
};

await cuadros(40);

grip[0].position.set(.6, .9, -.45);

await cuadros(2);

await cuadros(20, k => {
  grip[0].position.x = .6 - k * (6 / 72);
});

res.fuerte = {
  golpes: golpes.length,
  ultimo: golpes[golpes.length - 1] || null,
  vibraciones: vibraciones.length
};

ctl.s.arma = ITEM.PISTOLA;

for (let k = 0; k < 200 && vista.modelo?.k !== ITEM.PISTOLA; k++) {
  vista.actualizar(dt, {
    modo: "1ra",
    enVR: true
  });
  await new Promise(r => setTimeout(r, 50));
}

ctrl[0].position.set(.2, 1.2, -.2);

ctrl[0].rotation.set(-.3, .2, 0);

await cuadros(2);

const d = ctl.s.mira?.dir;

res.pistola = {
  lugar: vista.estado.lugar,
  padreEsRayo: vista.montura.parent === ctrl[0],
  mira: d ? d.toArray().map(x => +x.toFixed(3)) : null
};

presentando = false;

ctl.s.arma = ITEM.TUBERIA;

for (let k = 0; k < 100 && vista.modelo?.k !== ITEM.TUBERIA; k++) {
  vista.actualizar(dt, {
    modo: "1ra",
    enVR: false
  });
  await new Promise(r => setTimeout(r, 30));
}

vista.actualizar(dt, {
  modo: "1ra",
  enVR: false
});

res.primera = {
  lugar: vista.estado.lugar,
  padreEsCamara: vista.montura.parent === camara,
  mira: !!ctl.s.mira
};

vista.actualizar(dt, {
  modo: "3ra",
  enVR: false
});

res.tercera = {
  lugar: vista.estado.lugar,
  sinMira: ctl.s.mira === null
};

vista.actualizar(dt, {
  modo: "1ra",
  enVR: false
});

renderer.render(escena, camara);

document.getElementById("estado").textContent = JSON.stringify(res, null, 1);

window.prueba = {
  resultado: res
};
