// SH4 web — FeniXVOID · Project Ravenlight
export function iniciarEfectosVisor({THREE: THREE, fx: fx, camara: camara, getColision: getColision, sala: sala, escala: escala = .005, estado: estado = () => {}, select: select = null, boton: boton = null}) {
  const aJuego = v => [ -v.x / escala, -v.y / escala, v.z / escala ];
  const dirJuego = d => [ -d.x, -d.y, d.z ];
  const ray = new THREE.Raycaster;
  const sostenidos = [];
  let nVela = 0;
  function mira() {
    const o = camara.getWorldPosition(new THREE.Vector3), d = camara.getWorldDirection(new THREE.Vector3);
    const col = getColision?.() || sala;
    ray.set(o, d);
    ray.far = 8;
    const h = col ? ray.intersectObject(col, true).find(x => x.face) : null;
    const punto = h ? h.point.clone().addScaledVector(d, -.03) : o.clone().addScaledVector(d, 2);
    const normal = h ? h.face.normal.clone().transformDirection(h.object.matrixWorld) : d.clone().negate();
    ray.set(punto.clone().add(new THREE.Vector3(0, .1, 0)), new THREE.Vector3(0, -1, 0));
    ray.far = 6;
    const hp = col ? ray.intersectObject(col, true).find(x => x.face) : null;
    const piso = hp ? hp.point.clone() : new THREE.Vector3(punto.x, o.y - 1.6, punto.z);
    const adelante = d.clone();
    adelante.y = 0;
    adelante.normalize();
    const derecha = (new THREE.Vector3).crossVectors(adelante, new THREE.Vector3(0, 1, 0));
    const mano = o.clone().addScaledVector(adelante, .45).addScaledVector(derecha, .18).add(new THREE.Vector3(0, -.35, 0));
    return {
      o: o,
      d: d,
      punto: punto,
      normal: normal,
      piso: piso,
      mano: mano,
      pisoY: -piso.y / escala,
      hayPared: !!h && Math.abs(normal.y) < .6
    };
  }
  function sostener(t, f) {
    sostenidos.push({
      t: t,
      total: t,
      f: f
    });
  }
  const filtro = (tipo, valor) => fx.disparar("filtro", {
    tipo: tipo,
    valor: valor
  });
  const LISTA = [ [ "Sangre (golpe)", m => fx.disparar("sangre", {
    posMundo: m.punto.toArray(),
    dir: dirJuego(m.d),
    tam: 400
  }) ], [ "Chispas", m => fx.disparar("chispas", {
    posMundo: m.punto.toArray()
  }) ], [ "Chispa con humo", m => fx.disparar("chispa_humo", {
    posMundo: m.punto.toArray()
  }) ], [ "Pistola eléctrica", m => sostener(.6, () => fx.disparar("stungun", {
    posMundo: m.mano.toArray(),
    fin: aJuego(m.punto)
  })) ], [ "Spray", m => {
    const v = m.d.clone().multiplyScalar(600);
    fx.disparar("spray", {
      posMundo: m.mano.toArray(),
      vel: [ -v.x, -v.y, v.z ]
    });
    sostener(1.5, (dt, k) => {
      if (k <= 0) fx.disparar("spray", {
        parar: true
      });
    });
  } ], [ "Fuego", m => fx.disparar("fuego", {
    posMundo: m.piso.toArray(),
    alto: 200,
    ancho: 60
  }) ], [ "Vela", m => fx.disparar("vela", {
    n: nVela++ % 8,
    posMundo: m.piso.toArray()
  }) ], [ "Humo (puerta del otro mundo)", m => {
    const p = aJuego(m.piso);
    fx.disparar("humo_puerta", {
      pos: p,
      pos2: [ p[0], p[1] - 200, p[2] ],
      techo: m.pisoY - 480
    });
  } ], [ "Sangre negra que gotea", m => {
    const p = aJuego(m.piso);
    fx.disparar("sangre_negra", {
      pos: [ p[0], p[1] - 360, p[2] ],
      piso: m.pisoY
    });
  } ], [ "Gotas del techo", m => {
    const p = aJuego(m.piso);
    fx.disparar("gotas", {
      pos: [ p[0], p[1] - 480, p[2] ],
      piso: m.pisoY,
      ancho: 60
    });
  } ], [ "Lluvia", m => {
    const p = aJuego(m.o);
    fx.disparar("lluvia", {
      pos: [ p[0], m.pisoY - 900, p[2] ],
      piso: m.pisoY
    });
  } ], [ "Salpicadura de un paso", m => fx.disparar("paso_agua", {
    posMundo: m.piso.toArray()
  }) ], [ "Caño de agua", m => {
    const p = aJuego(m.piso);
    fx.disparar("canio", {
      pos: [ p[0], p[1] - 400, p[2] ],
      piso: m.pisoY
    });
  } ], [ "Charco (jefe final)", m => fx.disparar("charco", {
    posMundo: m.piso.toArray()
  }) ], [ "Grieta de carne (en la pared)", m => {
    if (!m.hayPared) return "mirá una pared";
    fx.disparar("grieta", {
      posMundo: m.punto.toArray(),
      normal: dirJuego(m.normal),
      radio: 140,
      nucleo: 20,
      tiempo: 4
    });
  } ], [ "Filtro: daño de Henry", () => {
    danio(3);
  } ], [ "Filtro: rojo", () => sostener(1, (dt, k) => filtro("rojo", 48 * k)) ], [ "Filtro: borde azul", () => sostener(1.2, (dt, k) => filtro("bordeAzul", 100 * k)) ], [ "Filtro: blanqueo", () => sostener(.8, (dt, k) => filtro("blanqueo", 128 * k)) ], [ "Ruido fuerte (maldición)", () => {
    fx.disparar("ruido", {
      valores: [ 128, 128, 42, 0, 0 ]
    });
    sostener(4, (dt, k) => {
      if (k <= 0) fx.disparar("ruido", {
        valores: null
      });
    });
  } ], [ "302: grietas del haunting", () => fx.disparar("grietas_haunting", {
    lugar: 1
  }) ], [ "302: grietas de la cinemática 47", () => fx.disparar("grietas_demo47") ], [ "bd15: silla eléctrica", () => fx.disparar("silla") ], [ "bd15: humo de Richard", () => fx.disparar("humo_richard") ], [ "fr23: humo de la casa quemada", () => fx.disparar("humo_fr23") ], [ "mz39: agua", () => fx.disparar("agua_mz39") ], [ "mz33: ondas de la pileta", () => fx.disparar("ondas_pileta") ], [ "mz31: olas de la torre", () => fx.disparar("olas_torre") ], [ "mz: compuertas de la prisión", () => fx.disparar("compuertas") ], [ "Limpiar (deja los de la sala)", () => {
    sostenidos.length = 0;
    fx.disparar("ruido", {
      valores: null
    });
    fx.alCargarSala();
  } ] ];
  let elegido = 0;
  if (select) {
    select.innerHTML = "";
    LISTA.forEach(([t], i) => select.appendChild(new Option(t, i)));
    select.value = "0";
    select.addEventListener("change", () => {
      elegido = +select.value;
    });
    select.addEventListener("keydown", e => {
      if (e.code === "KeyG") e.preventDefault();
    });
  }
  boton?.addEventListener("click", e => {
    e.preventDefault();
    disparar();
    boton.blur();
  });
  addEventListener("keydown", e => {
    if (e.code !== "KeyG" || e.repeat || e.ctrlKey || e.altKey) return;
    if (e.shiftKey) {
      elegir(elegido + 1);
      estado("Efecto elegido: " + LISTA[elegido][0] + " (G lo dispara)");
      return;
    }
    disparar();
  });
  function elegir(i) {
    elegido = (i % LISTA.length + LISTA.length) % LISTA.length;
    if (select) select.value = String(elegido);
  }
  function disparar(cual = elegido) {
    const i = typeof cual === "string" ? LISTA.findIndex(([t]) => t === cual) : cual;
    if (i < 0 || !LISTA[i]) {
      const r = fx.disparar(cual, {});
      window.sh4?.redibujar?.();
      return r;
    }
    let r;
    try {
      r = LISTA[i][1](mira());
    } catch (err) {
      console.warn("efecto", LISTA[i][0], err);
      r = "no se pudo: " + err.message;
    }
    estado("Efecto: " + LISTA[i][0] + (typeof r === "string" ? " — " + r : ""));
    window.sh4?.redibujar?.();
    return r;
  }
  let nivel = 0, pendiente = 0;
  function danio(cant) {
    pendiente += cant;
  }
  function conectarHenry(h) {
    h?.alRecibirDaño?.(d => danio(d?.cant ?? 0));
  }
  let acum = 0;
  function pasoDanio() {
    const obj = Math.min(128, pendiente * 42.6667);
    pendiente = 0;
    if (obj > nivel) nivel = obj; else nivel = Math.abs(nivel - obj) >= 100 / 30 ? nivel - 100 / 30 : obj;
  }
  function actualizar(dt) {
    acum += dt;
    while (acum >= 1 / 30) {
      acum -= 1 / 30;
      pasoDanio();
    }
    const v = Math.round(nivel - .49);
    if (v > 0) {
      filtro("bordeSangre", v * 2 / 3);
      filtro("rojo", v >> 4);
    }
    for (let i = sostenidos.length - 1; i >= 0; i--) {
      const s = sostenidos[i];
      s.t -= dt;
      const k = Math.max(0, s.t / s.total);
      try {
        s.f(dt, k);
      } catch (err) {
        console.warn("efecto sostenido", err);
        s.t = 0;
      }
      if (s.t <= 0) sostenidos.splice(i, 1);
    }
    return v > 0 || sostenidos.length > 0;
  }
  return {
    disparar: disparar,
    elegir: elegir,
    actualizar: actualizar,
    conectarHenry: conectarHenry,
    danio: danio,
    lista: LISTA.map(([t]) => t),
    get elegido() {
      return elegido;
    },
    mira: mira,
    get nivelDanio() {
      return nivel;
    }
  };
}
