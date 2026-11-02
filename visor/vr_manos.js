// SH4 web — FeniXVOID · Project Ravenlight
import * as THREE from "three";

const PIEL = 13483178;

const DEDOS = {
  indice: [ -.027, [ .042, .025, .02 ], .0088 ],
  medio: [ -.008, [ .046, .028, .021 ], .0092 ],
  anular: [ .011, [ .043, .026, .02 ], .0085 ],
  menique: [ .028, [ .033, .02, .018 ], .0074 ]
};

const PULGAR = [ [ .038, .03, .025 ], .0098 ];

const AJUSTE = {
  der: [ 0, 0, 0 ],
  izq: [ 0, 0, 0 ]
};

const CENTRO_PUNO = new THREE.Vector3(0, -.03, -.075);

function materialPiel() {
  return new THREE.MeshStandardMaterial({
    color: PIEL,
    roughness: .78,
    metalness: 0,
    emissive: 1840144
  });
}

export function crearManoProcedural(lado = "der", material = materialPiel()) {
  const s = lado === "der" ? 1 : -1;
  const raiz = new THREE.Group;
  raiz.name = "mano_" + lado;
  const mano = new THREE.Group;
  raiz.add(mano);
  const palma = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), material);
  palma.scale.set(.046, .015, .052);
  palma.position.set(0, 0, -.048);
  mano.add(palma);
  const muneca = new THREE.Mesh(new THREE.CapsuleGeometry(.019, .025, 4, 14).rotateX(Math.PI / 2), material);
  muneca.scale.set(1.3, .7, 1);
  muneca.position.set(0, .001, .008);
  mano.add(muneca);
  const falange = (largo, radio) => {
    const m = new THREE.Mesh(new THREE.CapsuleGeometry(radio, Math.max(.001, largo - radio), 4, 8).rotateX(Math.PI / 2).translate(0, 0, -largo / 2), material);
    return m;
  };
  const cadena = (base, largos, radio) => {
    const juntas = [];
    let padre = base;
    largos.forEach((l, i) => {
      const j = new THREE.Group;
      if (i > 0) j.position.z = -largos[i - 1];
      j.add(falange(l, radio * (1 - i * .1)));
      padre.add(j);
      juntas.push(j);
      padre = j;
    });
    return juntas;
  };
  const dedos = {};
  for (const [nombre, [x, largos, radio]] of Object.entries(DEDOS)) {
    const base = new THREE.Group;
    base.position.set(x * s, .002, -.088 + Math.abs(x) * .25);
    base.rotation.y = -x * s * 1.2;
    mano.add(base);
    dedos[nombre] = cadena(base, largos, radio);
  }
  const basePulgar = new THREE.Group;
  basePulgar.position.set(-.03 * s, -.008, -.022);
  basePulgar.rotation.set(-.35, .75 * s, .5 * s);
  mano.add(basePulgar);
  dedos.pulgar = cadena(basePulgar, PULGAR[0], PULGAR[1]);
  const m = new THREE.Matrix4;
  if (s > 0) m.makeBasis(new THREE.Vector3(0, 0, 1), new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0)); else m.makeBasis(new THREE.Vector3(0, 0, -1), new THREE.Vector3(-1, 0, 0), new THREE.Vector3(0, 1, 0));
  mano.quaternion.setFromRotationMatrix(m);
  mano.position.copy(CENTRO_PUNO).applyQuaternion(mano.quaternion).negate();
  raiz.rotation.set(...AJUSTE[lado]);
  const actual = {
    g: 0,
    a: 0,
    p: 0
  };
  function poner(gatillo = 0, agarre = 0, pulgar = 0, dt = 1) {
    const k = Math.min(1, dt * 18);
    actual.g += (gatillo - actual.g) * k;
    actual.a += (agarre - actual.a) * k;
    actual.p += (pulgar - actual.p) * k;
    const curvar = (juntas, c, angs = [ 1.35, 1.55, 1 ]) => juntas.forEach((j, i) => {
      j.rotation.x = -angs[i] * c;
    });
    curvar(dedos.indice, .18 + .82 * actual.g);
    for (const n of [ "medio", "anular", "menique" ]) curvar(dedos[n], .22 + .78 * actual.a);
    dedos.pulgar.forEach((j, i) => {
      j.rotation.x = -(.15 + .55 * actual.p) * [ .4, .8, .7 ][i];
      j.rotation.y = -(.1 + .5 * actual.p) * s * [ .5, .6, .4 ][i];
    });
  }
  poner(0, 0, 0);
  return {
    grupo: raiz,
    poner: poner,
    dedos: dedos
  };
}

function crearRayo() {
  const geo = (new THREE.BufferGeometry).setFromPoints([ new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1) ]);
  const linea = new THREE.Line(geo, new THREE.LineBasicMaterial({
    color: 12592666,
    transparent: true,
    opacity: .55,
    depthWrite: false
  }));
  linea.name = "rayo";
  linea.renderOrder = 998;
  linea.frustumCulled = false;
  const mira = new THREE.Group;
  mira.name = "mira";
  const mat = new THREE.MeshBasicMaterial({
    color: 16720916,
    transparent: true,
    opacity: .95,
    depthTest: false,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const anillo = new THREE.Mesh(new THREE.RingGeometry(.62, 1, 32), mat);
  const punto = new THREE.Mesh(new THREE.CircleGeometry(.22, 16), mat);
  for (let i = 0; i < 4; i++) {
    const t = new THREE.Mesh(new THREE.PlaneGeometry(.12, .42), mat);
    const a = i * Math.PI / 2;
    t.position.set(Math.sin(a) * 1.3, Math.cos(a) * 1.3, 0);
    t.rotation.z = -a;
    mira.add(t);
  }
  mira.add(anillo, punto);
  mira.traverse(o => {
    o.renderOrder = 999;
  });
  mira.visible = false;
  return {
    linea: linea,
    mira: mira
  };
}

export function crearManos({renderer: renderer, padre: padre, escena: escena = null, manoDominante: manoDominante = "der", estilo: estilo = "manos", perfilMano: perfilMano = "mesh", alcance: alcance = 12, mira: mira = true} = {}) {
  const xr = renderer.xr;
  const escuchas = {
    elegir: new Set,
    soltar: new Set
  };
  const material = materialPiel();
  const ray = new THREE.Raycaster;
  ray.far = alcance;
  const tmpM = new THREE.Matrix4, tmpV = new THREE.Vector3, tmpCam = new THREE.Vector3;
  let activa = manoDominante, dominante = manoDominante;
  let fabControles = null, fabManos = null;
  const cargarFabricas = (async () => {
    try {
      if (estilo !== "manos") fabControles = new (await (import("three/addons/webxr/XRControllerModelFactory.js"))).XRControllerModelFactory;
      fabManos = new (await (import("three/addons/webxr/XRHandModelFactory.js"))).XRHandModelFactory;
    } catch (e) {
      console.warn("[manos] no pude cargar las fábricas de three/addons", e);
    }
  })();
  const M = [ 0, 1 ].map(i => {
    const ctrl = xr.getController(i), grip = xr.getControllerGrip(i), mano = xr.getHand(i);
    padre.add(ctrl, grip, mano);
    const {linea: linea, mira: mr} = crearRayo();
    ctrl.add(linea);
    (escena || padre).add(mr);
    const e = {
      i: i,
      ctrl: ctrl,
      grip: grip,
      mano: mano,
      linea: linea,
      mira: mr,
      fuente: null,
      lado: null,
      tipo: null,
      proc: {},
      modeloControl: null,
      modeloMano: null,
      nativo: false,
      pellizco: false,
      pellizcoT: 0,
      hit: null,
      conectado: false,
      simulado: false
    };
    ctrl.addEventListener("connected", ev => {
      const s = ev.data;
      e.fuente = s;
      e.conectado = true;
      e.lado = s.handedness === "left" ? "izq" : "der";
      e.tipo = s.hand ? "mano" : "control";
      armar(e);
    });
    ctrl.addEventListener("disconnected", () => {
      e.conectado = false;
      e.fuente = null;
      e.hit = null;
      mostrar(e);
    });
    ctrl.addEventListener("selectstart", () => {
      if (e.tipo === "mano") e.nativo = true;
      if (!e.lado) return;
      if (e.lado !== activa) {
        activa = e.lado;
        return;
      }
      emitir("elegir", e);
    });
    ctrl.addEventListener("selectend", () => emitir("soltar", e));
    cargarFabricas.then(() => {
      if (fabManos && !e.modeloMano) {
        e.modeloMano = fabManos.createHandModel(mano, perfilMano);
        mano.add(e.modeloMano);
      }
      if (fabControles && !e.modeloControl) {
        e.modeloControl = fabControles.createControllerModel(grip);
        grip.add(e.modeloControl);
        mostrar(e);
      }
    });
    return e;
  });
  function armar(e) {
    if (!e.proc[e.lado]) {
      e.proc[e.lado] = crearManoProcedural(e.lado, material);
      e.grip.add(e.proc[e.lado].grupo);
    }
    mostrar(e);
  }
  function mostrar(e) {
    for (const [l, p] of Object.entries(e.proc)) p.grupo.visible = e.conectado && e.tipo === "control" && l === e.lado && estilo !== "controles" && !globalThis.__sh4ManosHenry;
    if (e.modeloControl) e.modeloControl.visible = e.conectado && e.tipo === "control" && estilo !== "manos";
    if (e.modeloMano) e.modeloMano.visible = !globalThis.__sh4ManosHenry;
    const ve = e.conectado && (e.lado === activa || e.simulado);
    e.linea.visible = ve;
    if (!ve) e.mira.visible = false;
  }
  function emitir(tipo, e) {
    for (const f of escuchas[tipo]) {
      try {
        f({
          lado: e.lado,
          tipo: e.tipo,
          hit: e.hit,
          i: e.i
        });
      } catch (er) {
        console.error(er);
      }
    }
  }
  function revisarPellizco(e, dt) {
    const jt = e.mano.joints, a = jt?.["thumb-tip"], b = jt?.["index-finger-tip"];
    if (!a || !b) return;
    const d = a.position.distanceTo(b.position);
    if (!e.pellizco && d < .018) {
      e.pellizco = true;
      e.pellizcoT = .12;
    } else if (e.pellizco && d > .032) {
      e.pellizco = false;
      if (!e.nativo) emitir("soltar", e);
    }
    if (e.pellizco && e.pellizcoT > 0) {
      e.pellizcoT -= dt;
      if (e.pellizcoT <= 0 && !e.nativo) {
        if (e.lado !== activa) activa = e.lado; else emitir("elegir", e);
      }
    }
  }
  const botones = e => e.fuente?.gamepad?.buttons || [];
  function actualizar(dt = 1 / 72, objetivos = []) {
    const cam = renderer.xr.isPresenting ? renderer.xr.getCamera() : null;
    if (cam) cam.getWorldPosition(tmpCam);
    const salida = [];
    for (const e of M) {
      if (!e.conectado) continue;
      if (e.tipo === "control") {
        const b = botones(e);
        const pulgar = [ 3, 4, 5 ].some(k => b[k]?.touched || b[k]?.pressed) ? 1 : 0;
        e.proc[e.lado]?.poner(b[0]?.value || 0, b[1]?.value || 0, pulgar, dt);
      } else revisarPellizco(e, dt);
      mostrar(e);
      if (e.lado !== activa && !e.simulado) {
        e.hit = null;
        continue;
      }
      e.ctrl.updateMatrixWorld(true);
      tmpM.identity().extractRotation(e.ctrl.matrixWorld);
      ray.ray.origin.setFromMatrixPosition(e.ctrl.matrixWorld);
      ray.ray.direction.set(0, 0, -1).applyMatrix4(tmpM).normalize();
      const h = objetivos.length ? ray.intersectObjects(objetivos, true)[0] || null : null;
      if (h && e.hit?.object !== h.object) vibrar(e.lado, .15, 12);
      e.hit = h;
      const largo = h ? h.distance : .6;
      e.linea.scale.z = largo;
      e.linea.material.opacity = h ? .6 : .25;
      if (mira && h) {
        e.mira.visible = true;
        if (!cam) tmpCam.copy(ray.ray.origin);
        e.mira.position.copy(h.point).addScaledVector(tmpV.copy(tmpCam).sub(h.point).normalize(), .004);
        e.mira.parent?.worldToLocal(e.mira.position);
        e.mira.lookAt(tmpCam);
        e.mira.scale.setScalar(.0105 * Math.max(.3, h.point.distanceTo(tmpCam)));
      } else e.mira.visible = false;
      salida.push({
        lado: e.lado,
        tipo: e.tipo,
        hit: h
      });
    }
    return salida;
  }
  function vibrar(lado, fuerza = .3, ms = 20) {
    for (const e of M) if (e.lado === lado && e.fuente?.gamepad?.hapticActuators?.[0]) {
      try {
        e.fuente.gamepad.hapticActuators[0].pulse(fuerza, ms);
      } catch {}
    }
  }
  function palitos() {
    const r = {};
    for (const e of M) {
      if (!e.conectado || e.tipo !== "control") continue;
      const p = e.fuente.gamepad;
      if (!p) continue;
      const ax = p.axes.length >= 4 ? [ p.axes[2], p.axes[3] ] : [ p.axes[0] || 0, p.axes[1] || 0 ];
      r[e.lado] = {
        x: ax[0] || 0,
        y: ax[1] || 0,
        gatillo: p.buttons[0]?.value || 0,
        agarre: p.buttons[1]?.value || 0,
        a: !!p.buttons[4]?.pressed,
        b: !!p.buttons[5]?.pressed,
        palito: !!p.buttons[3]?.pressed
      };
    }
    return r;
  }
  function rayos() {
    return M.filter(e => e.conectado).map(e => {
      e.ctrl.updateMatrixWorld(true);
      const origen = (new THREE.Vector3).setFromMatrixPosition(e.ctrl.matrixWorld);
      const dir = new THREE.Vector3(0, 0, -1).applyMatrix4((new THREE.Matrix4).extractRotation(e.ctrl.matrixWorld)).normalize();
      return {
        fuente: e.tipo === "mano" ? "mano" : "control",
        lado: e.lado,
        origen: origen,
        dir: dir,
        activa: e.lado === activa
      };
    });
  }
  function simular({i: i = 0, lado: lado = "der", origen: origen, mirarA: mirarA, gatillo: gatillo = 0, agarre: agarre = 0, pulgar: pulgar = 1}) {
    const e = M[i];
    e.simulado = true;
    e.conectado = true;
    e.lado = lado;
    e.tipo = "control";
    activa = lado;
    e.fuente = {
      handedness: lado === "izq" ? "left" : "right",
      gamepad: {
        buttons: [ {
          value: gatillo
        }, {
          value: agarre
        }, {}, {
          touched: !!pulgar
        } ],
        axes: []
      }
    };
    for (const o of [ e.ctrl, e.grip ]) {
      o.matrixAutoUpdate = true;
      o.visible = true;
      o.position.copy(origen);
      o.lookAt(mirarA);
      o.rotateY(Math.PI);
    }
    e.grip.rotateX(.95);
    armar(e);
    return e;
  }
  return {
    actualizar: actualizar,
    vibrar: vibrar,
    palitos: palitos,
    rayos: rayos,
    simular: simular,
    alElegir(f) {
      escuchas.elegir.add(f);
      return () => escuchas.elegir.delete(f);
    },
    alSoltar(f) {
      escuchas.soltar.add(f);
      return () => escuchas.soltar.delete(f);
    },
    get dominante() {
      return dominante;
    },
    ponerDominante(l) {
      dominante = activa = l === "izq" ? "izq" : "der";
    },
    get activa() {
      return activa;
    },
    estados: M,
    liberar() {
      for (const e of M) {
        padre.remove(e.ctrl, e.grip, e.mano);
        e.mira.parent?.remove(e.mira);
      }
    }
  };
}
