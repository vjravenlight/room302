// SH4 web — FeniXVOID · Project Ravenlight
import { MOV, ESQUIVE, VIDA, ESTADO, ITEM, SONIDO_ARMA, AGARRE } from "./datos.js";

import { crearMovimiento, pasoMovimiento, velocidadAnim, mezclaCorrer } from "./movimiento.js";

import { cajaTocaEsfera } from "./armas.js";

import { ESCALA } from "../lib/personaje.js";

import { crearPiso } from "../lib/colision.js";

const norm = a => Math.atan2(Math.sin(a), Math.cos(a));

const P = {
  QUIETO: 0,
  CAMINAR: 1,
  CAMINAR_ARRANQUE: 2,
  CORRER: 4,
  CORRER_ARRANQUE: 5,
  AGITADO1: 63,
  AGITADO2: 64,
  PREPARAR: 28,
  PREPARAR_ABAJO: 29,
  GUARDIA: 30,
  GUARDIA_ABAJO: 31,
  GUARDIA_MOVER: 32,
  BAJAR: 33,
  BAJAR_ABAJO: 34,
  GOLPE: 35,
  GOLPE_ABAJO: 36,
  GOLPE_FUERTE: 37,
  MUERTE: 98,
  REMATE: 99,
  RECARGA: 103,
  VACIO: 104,
  VACIO_ABAJO: 105
};

const esFuego = k => k === ITEM.PISTOLA || k === ITEM.REVOLVER;

const PESADAS = {
  47: [ 44, 45, 46 ],
  49: [ 47, 48, 49 ],
  53: [ 50, 51, 52 ]
};

export function crearControlador({THREE: THREE, datos: datos, animador: animador, armas: armas, jugador: jugador, ojos: ojos, getColision: getColision}) {
  const m = crearMovimiento();
  const s = {
    estado: ESTADO.NORMAL,
    t: 0,
    vida: VIDA.max,
    vidaMax: VIDA.max,
    defensa: VIDA.defensa,
    dificultad: "normal",
    ampolla: 0,
    arma: 0,
    carga: 0,
    combo: 0,
    golpeados: new Set,
    cansancio: 0,
    quieto: 0,
    aburrido: 0,
    aburr: 0,
    danio: null,
    agarre: null,
    sinGolpe: 0,
    objetivo: null,
    objetivoCaido: false,
    pasoTipo: 0,
    invencible: false,
    muerto: false,
    gameOver: false,
    procesoActual: -1,
    subActual: -1,
    balas: 0,
    cargador: {},
    bala: ITEM.BALAS_PISTOLA,
    nivel: 2,
    disparoPlata: false,
    sonoGolpe: false,
    sonoRecarga: false
  };
  const ganchos = {
    golpear: [],
    danio: [],
    muerte: [],
    gameOver: [],
    mensaje: [],
    agarre: [],
    soltarse: []
  };
  const avisar = (k, ...a) => {
    for (const f of ganchos[k]) try {
      f(...a);
    } catch (e) {
      console.warn(e);
    }
  };
  let enemigos = () => [];
  let recibirGolpeEnemigo = null;
  function ponerProceso(p, {sub: sub = -1, ratio: ratio = 0, vel: vel = null, forzar: forzar = false, mezcla: mezcla = null, loop: loop = null} = {}) {
    const f = datos.proceso(p, s.arma);
    if (!f || f.anim == null) return;
    let bl = mezcla ?? f.mezcla;
    if (mezcla == null && p === 0 && s.procesoActual >= 1 && s.procesoActual < 7) bl = .66;
    if (mezcla == null && s.procesoActual >= 65 && s.procesoActual <= 95) bl = .45;
    const v = (vel ?? 1) * (f.velocidad || 1);
    const fsub = sub >= 0 ? datos.proceso(sub, s.arma) : null;
    if (sub >= 0 && !fsub) sub = -1;
    if (sub >= 0) {
      const fs = fsub;
      animador.poner(f.anim, {
        mezcla: bl,
        vel: v,
        forzar: forzar,
        loop: loop,
        sub: {
          n: fs.anim,
          ratio: ratio
        }
      });
    } else animador.poner(f.anim, {
      mezcla: bl,
      vel: v,
      forzar: forzar,
      loop: loop
    });
    if (animador.capa) animador.capa.sub = sub >= 0 ? {
      n: datos.proceso(sub, s.arma).anim,
      ratio: ratio
    } : null;
    s.procesoActual = p;
    s.subActual = sub;
  }
  const terminada = () => animador.terminada;
  const pasada = r => animador.proporcion > r;
  const seg = () => animador.segundos;
  function cambiar(e) {
    s.estado = e;
    s.t = 0;
  }
  function danio(cant) {
    if (s.invencible || s.muerto) return false;
    s.vida -= cant * (VIDA.base + VIDA.azar * Math.random()) / s.defensa;
    if (s.vida <= 0) {
      s.vida = 0;
      return true;
    }
    return false;
  }
  function curar(cant) {
    s.vida = Math.min(s.vidaMax, s.vida + cant);
  }
  function usarCuracion(k) {
    if (k === ITEM.BEBIDA) curar(VIDA.bebida); else if (k === ITEM.AMPOLLA) {
      curar(VIDA.ampolla);
      s.ampolla = VIDA.ampollaSeg[s.dificultad];
    } else if (k === ITEM.BOTIQUIN) {
      const [f, min] = VIDA.botiquin[s.dificultad];
      curar(Math.max((s.vidaMax - s.vida) * f, min));
    } else return false;
    return true;
  }
  function recibirDanio(cant, tipo = 1, desde = null) {
    if (s.muerto || s.danio || s.agarre || s.sinGolpe > 0) return 4;
    const fila = datos.danioRecibido(tipo);
    const pos = jugador.position;
    let atras = false, dirEmpuje = m.cuerpo + Math.PI;
    if (desde) {
      const ang = Math.atan2(-(pos.x - desde.x), pos.z - desde.z);
      atras = Math.cos(m.cuerpo - ang) >= 0;
      dirEmpuje = ang;
    }
    const muere = danio(cant);
    let empujon = fila.empujon * (cant > 50 ? cant / 50 : 1);
    s.danio = {
      tipo: tipo,
      proceso: atras ? fila.atras : fila.frente,
      t: 0,
      empujon: empujon,
      tiempo: fila.tiempo,
      dir: dirEmpuje,
      recorrido: 0
    };
    s.objetivo = null;
    avisar("danio", {
      cant: cant,
      tipo: tipo,
      vida: s.vida,
      atras: atras
    });
    if (muere) {
      morir();
      return 1;
    }
    if (s.estado !== ESTADO.NORMAL) cambiar(ESTADO.NORMAL);
    ponerProceso(s.danio.proceso, {
      forzar: true
    });
    return 1;
  }
  function morir() {
    s.muerto = true;
    s.danio = null;
    s.agarre = null;
    cambiar(ESTADO.MUERTE);
    ponerProceso(P.MUERTE, {
      forzar: true,
      mezcla: .2
    });
    avisar("muerte");
  }
  function agarrar({parte: parte = 1, tiempo: tiempo = 4, danio: cant = 0, desde: desde = null, rotEnemigo: rotEnemigo = null, enemigo: enemigo = null} = {}) {
    if (s.muerto || s.danio || s.agarre || s.sinGolpe > 0 || parte < 1 || parte > 5) return false;
    let dir = null;
    if (parte === 1 || parte === 5) {
      const pos = jugador.position;
      dir = desde ? Math.atan2(-(pos.x - desde.x), pos.z - desde.z) : norm(m.cuerpo + Math.PI);
    }
    const muere = danio(cant);
    s.danio = null;
    s.objetivo = null;
    s.carga = 0;
    if (s.estado !== ESTADO.NORMAL) cambiar(ESTADO.NORMAL);
    avisar("danio", {
      cant: cant,
      tipo: "agarre",
      vida: s.vida,
      atras: false,
      agarre: true
    });
    if (muere) {
      morir();
      return true;
    }
    if (parte === 1 && rotEnemigo != null) {
      const f = Math.cos(m.cuerpo - rotEnemigo);
      m.rumbo = m.cuerpo = m.deseado = norm(rotEnemigo + (f < 0 ? Math.PI : 0));
    }
    s.agarre = {
      parte: parte,
      fase: 1,
      tiempo: tiempo,
      t: 0,
      dir: dir,
      vel: 0,
      stick: null,
      pulsaciones: 0,
      sacudida: 0,
      enemigo: enemigo,
      cuadros: 0
    };
    ponerProceso(AGARRE.procesos[parte], {
      forzar: true
    });
    if (parte !== 1) sonar(AGARRE.sonido);
    avisar("agarre", s.agarre);
    return true;
  }
  function soltarAgarre() {
    const a = s.agarre;
    if (!a || a.fase !== 1) return false;
    a.fase = 2;
    a.t = 0;
    a.tiempo = 0;
    a.vel = 0;
    ponerProceso(AGARRE.soltarse[a.parte], {
      forzar: true
    });
    avisar("soltarse", a);
    return true;
  }
  const estadoAgarre = () => s.agarre ? s.agarre.fase : 0;
  function procesarAgarre(dt, e, apretoBoton) {
    const a = s.agarre;
    let avance = {
      dx: 0,
      dz: 0
    };
    if (a.fase === 1) {
      if (s.invencible) {
        s.agarre = null;
        return;
      }
      ponerProceso(AGARRE.procesos[a.parte]);
      a.t += dt;
      a.cuadros++;
      a.tiempo -= dt;
      const sx = e.stick?.x || 0, sy = e.stick?.y || 0;
      let d2 = 0;
      if (a.stick) d2 = (sx - a.stick.x) ** 2 + (sy - a.stick.y) ** 2;
      a.stick = {
        x: sx,
        y: sy
      };
      if (apretoBoton) {
        a.pulsaciones++;
        d2 += AGARRE.boton;
      }
      a.sacudida += d2;
      a.tiempo -= dt * d2 * AGARRE.stick;
      if (a.tiempo < 0 || s.muerto) soltarAgarre();
      m.move = 0;
      m.run = 0;
      moverJuego(avance);
      return;
    }
    ponerProceso(AGARRE.soltarse[a.parte]);
    a.t += dt;
    const T = AGARRE.tambaleo;
    if (a.dir != null && a.t < T.hasta) {
      const meta = a.t < T.empuje ? T.vel : 0;
      const [km, kv] = a.vel < meta ? T.sube : T.baja;
      a.vel = meta * km + a.vel * kv;
      avance = {
        dx: Math.sin(a.dir) * a.vel * dt,
        dz: Math.cos(a.dir) * a.vel * dt
      };
    }
    if (terminada() || seg() > AGARRE.cortar && e.fuerza > 0) {
      s.agarre = null;
      s.sinGolpe = AGARRE.sinGolpe * (s.nivel < 2 ? 1.6 : 1);
      cambiar(ESTADO.NORMAL);
    }
    moverJuego(avance);
  }
  function buscarObjetivo(maxDist = 6) {
    let mejor = null, md = maxDist;
    for (const e of enemigos()) {
      if (!e || e.muerto) continue;
      const p = e.posicion || e.grupo?.position;
      if (!p) continue;
      const d = Math.hypot(p.x - jugador.position.x, p.z - jugador.position.z);
      if (d < md) {
        md = d;
        mejor = e;
      }
    }
    s.objetivo = mejor;
    s.objetivoCaido = !!mejor?.caido;
    return mejor;
  }
  function mirarObjetivo() {
    const p = s.objetivo && (s.objetivo.posicion || s.objetivo.grupo?.position);
    if (!p) return;
    const ang = Math.atan2(-(p.x - jugador.position.x), p.z - jugador.position.z);
    m.rumbo = ang;
  }
  const caja = {}, cajaAntes = {
    centro: new THREE.Vector3,
    ejes: [ new THREE.Vector3, new THREE.Vector3, new THREE.Vector3 ]
  };
  const cajaMedia = {
    centro: new THREE.Vector3,
    ejes: [ new THREE.Vector3, new THREE.Vector3, new THREE.Vector3 ]
  };
  let hayAntes = false;
  function cajaToca(c, radio) {
    if (cajaTocaEsfera(caja, c, radio)) return true;
    if (!hayAntes) return false;
    for (const t of [ 1 / 3, 2 / 3 ]) {
      cajaMedia.centro.lerpVectors(cajaAntes.centro, caja.centro, t);
      for (let i = 0; i < 3; i++) cajaMedia.ejes[i].lerpVectors(cajaAntes.ejes[i], caja.ejes[i], t);
      if (cajaTocaEsfera(cajaMedia, c, radio)) return true;
    }
    return false;
  }
  function revisarGolpe(fila, fuerte) {
    const tg = datos.tiemposGolpe(s.arma, fila);
    const tt = seg();
    const esPistola = esFuego(s.arma);
    if (!s.sonoGolpe && tt >= tg.sonido) {
      s.sonoGolpe = true;
      sonidoGolpe(fuerte);
    }
    let hayCaja = false;
    if (!esPistola) {
      if (hayAntes) {
        cajaAntes.centro.copy(caja.centro);
        for (let i = 0; i < 3; i++) cajaAntes.ejes[i].copy(caja.ejes[i]);
      }
      hayCaja = !!armas.cajaMundo(caja);
      if (!hayCaja) hayAntes = false;
    }
    if (tt < tg.inicio || tt > tg.fin) {
      hayAntes = hayCaja;
      return;
    }
    const a = datos.arma(s.arma);
    const g = datos.golpe(esPistola && s.disparoPlata ? "BAK_PLAYER_SILVER_BULLET" : fuerte ? a.golpe_fuerte : a.golpe_normal);
    if (!g || !g.danio) return;
    if (esPistola) {
      if (s.golpeados.size) return;
    } else if (!hayCaja) return;
    hayAntes = true;
    for (const e of enemigos()) {
      if (!e || e.muerto || s.golpeados.has(e)) continue;
      const p = e.centroGolpe?.() || e.posicion || e.grupo?.position;
      if (!p) continue;
      const radio = e.radio ?? .45;
      let toca;
      if (esPistola && s.mira) {
        const v = p.clone ? p.clone() : new THREE.Vector3(p.x, p.y, p.z);
        if (!e.centroGolpe && e.alto) v.y += e.alto / 2;
        v.sub(s.mira.origen);
        const d = v.length();
        toca = d < 25 && d > .001 && v.dot(s.mira.dir) / d > Math.cos(.14 + Math.atan2(radio, d));
      } else if (esPistola) {
        const ang = Math.atan2(-(p.x - jugador.position.x), p.z - jugador.position.z);
        toca = Math.abs(norm(ang - m.cuerpo)) < .35 && Math.hypot(p.x - jugador.position.x, p.z - jugador.position.z) < 25;
      } else {
        const c = p.clone ? p.clone() : new THREE.Vector3(p.x, p.y, p.z);
        if (!e.centroGolpe && e.alto) c.y += e.alto / 2;
        toca = cajaToca(c, radio);
      }
      if (!toca) continue;
      s.golpeados.add(e);
      const info = {
        item: s.arma,
        golpe: g.golpe,
        tipo: g.tipo_danio,
        atributo: g.atributo,
        shock: g.shock,
        fuerte: fuerte
      };
      recibirGolpeEnemigo?.(e, g.danio, g.tipo_danio, info);
      avisar("golpear", e, g.danio, g.tipo_danio, info);
      if (!esPistola) gastarArma();
      if (esPistola) break;
    }
  }
  let alGastar = null, municion = null, recargarArma = null, sonarF = null;
  function gastarArma() {
    alGastar?.(s.arma, "golpe");
  }
  const sonar = id => {
    if (id) try {
      sonarF?.(id);
    } catch {}
  };
  function sonidoGolpe(fuerte) {
    if (esFuego(s.arma)) {
      sonar(s.disparoPlata ? SONIDO_ARMA.tiroPlata : SONIDO_ARMA.tiro[s.arma]);
      return;
    }
    sonar(SONIDO_ARMA.golpe(s.arma));
    if (fuerte) sonar(SONIDO_ARMA.vozFuerte); else {
      const r = Math.floor(Math.random() * 1e6) % SONIDO_ARMA.vozFeed(s.arma);
      if (r < 2) sonar(SONIDO_ARMA.voz[r]);
    }
  }
  let atacarAntes = false;
  function actualizar(dt, e) {
    s.t += dt;
    if (s.ampolla > 0 && !s.muerto) {
      curar(dt);
      s.ampolla = Math.max(0, s.ampolla - dt);
    }
    const tieneArma = !!s.arma && datos.esArma(s.arma) && !!datos.arma(s.arma)?.golpe_normal && datos.arma(s.arma).golpe_normal !== "BAK_NOTHING";
    const soltoAtaque = atacarAntes && !e.atacar, apretoAtaque = !atacarAntes && e.atacar;
    atacarAntes = !!e.atacar;
    const cargable = tieneArma && (datos.arma(s.arma).carga_segundos || 0) > 0;
    if (e.atacar && cargable && (s.estado === ESTADO.GUARDIA || s.estado === ESTADO.PREPARAR)) s.carga = Math.min(100, s.carga + 100 / datos.arma(s.arma).carga_segundos * dt); else if (!e.atacar && !soltoAtaque) s.carga = Math.max(0, s.carga - 25 * dt);
    const disparo = cargable ? soltoAtaque : apretoAtaque;
    let avance = {
      dx: 0,
      dz: 0
    };
    let tasaCuerpo = MOV.cuerpoGiro;
    if (s.sinGolpe > 0) s.sinGolpe = Math.max(0, s.sinGolpe - dt);
    if (s.agarre) {
      procesarAgarre(dt, e, apretoAtaque || !!e.pasoAtras);
      return;
    }
    if (s.danio) {
      const d = s.danio;
      d.t += dt;
      if (d.tiempo > 0 && d.t < d.tiempo) {
        const v = 2 * d.empujon / d.tiempo * (1 - d.t / d.tiempo);
        avance = {
          dx: Math.sin(d.dir) * v * dt,
          dz: Math.cos(d.dir) * v * dt
        };
      }
      const r = pasada(.5);
      if (terminada() || r && (e.fuerza || e.preparar)) {
        s.danio = null;
      } else {
        moverJuego(avance);
        return;
      }
    }
    switch (s.estado) {
     case ESTADO.MUERTE:
      if (pasada(.92) && !s.gameOver) {
        s.gameOver = true;
        cambiar(ESTADO.MUERTO);
        avisar("gameOver");
      }
      return;

     case ESTADO.MUERTO:
      return;

     case ESTADO.NORMAL:
      {
        const fuerza = e.fuerza || 0;
        avance = pasoMovimiento(m, {
          fuerza: fuerza,
          rumboDeseado: e.rumboDeseado,
          correr: e.correr
        }, dt);
        if (e.sinMover) avance = {
          dx: 0,
          dz: 0
        };
        const pes = PESADAS[s.arma];
        if (m.move <= .001 && !fuerza) {
          s.cansancio = Math.max(0, s.cansancio - 1.5 * dt);
          if (s.cansancio < 60) s.cansancio *= Math.pow(.998, dt * 30);
          const frenando = s.procesoActual === 3 || s.procesoActual === 6;
          if (!pes && (s.procesoActual === 1 || s.procesoActual === 2 || s.procesoActual === 4 || s.procesoActual === 5)) {
            ponerProceso(m.run > .5 || s.procesoActual >= 4 ? 6 : 3, {
              mezcla: .1
            });
          } else if (frenando && !terminada()) {} else if (s.cansancio > 66) {
            ponerProceso(P.AGITADO2);
            s.quieto = 0;
          } else if (s.cansancio > 60) {
            ponerProceso(P.AGITADO1);
            s.quieto = 0;
          } else {
            s.quieto += dt * 30;
            if (s.quieto < 541) {
              ponerProceso(pes ? pes[0] : P.QUIETO);
              if (Math.random() < dt * 30 / 27) s.aburr = s.aburr + 1 & 7;
            } else {
              const p = datos.aburrimiento(s.arma, s.aburr);
              ponerProceso(p);
              if (terminada()) {
                s.quieto = 0;
                s.aburr = s.aburr + 1 & 7;
              }
            }
          }
        } else {
          s.cansancio = Math.min(74, s.cansancio + dt);
          s.quieto = 0;
          const arranca = !pes && (s.procesoActual === 0 || s.procesoActual === P.CAMINAR_ARRANQUE && !terminada());
          const pc = pes ? pes[1] : arranca ? P.CAMINAR_ARRANQUE : P.CAMINAR;
          const pr = pes ? pes[2] : arranca ? P.CORRER_ARRANQUE : P.CORRER;
          if (m.run > 0) ponerProceso(pc, {
            sub: pr,
            ratio: mezclaCorrer(m),
            vel: velocidadAnim(m)
          }); else ponerProceso(pc, {
            vel: velocidadAnim(m)
          });
        }
        if ((apretoAtaque || e.remate) && puedeRematar(true)) {
          rematar();
          break;
        }
        if (e.preparar && tieneArma && m.run < .2) {
          cambiar(ESTADO.PREPARAR);
          buscarObjetivo();
          s.combo = 0;
          sonar(SONIDO_ARMA.preparar[s.arma]);
        }
        break;
      }

     case ESTADO.PREPARAR:
      ponerProceso(s.objetivoCaido ? P.PREPARAR_ABAJO : P.PREPARAR);
      mirarObjetivo();
      tasaCuerpo = 6;
      m.move = 0;
      m.run = 0;
      if ((disparo || e.remate) && puedeRematar()) rematar(); else if (disparo && tieneArma) atacar(); else if (terminada()) cambiar(ESTADO.GUARDIA); else if (!e.preparar) cambiar(ESTADO.BAJAR);
      break;

     case ESTADO.GUARDIA:
      {
        if (!s.objetivo || s.objetivo.muerto) buscarObjetivo(); else s.objetivoCaido = !!s.objetivo.caido;
        tasaCuerpo = 6;
        const fuerza = e.fuerza || 0;
        if (fuerza > .9) {
          const u = MOV.guardiaPaso * MOV.fps * dt;
          avance = {
            dx: Math.sin(e.rumboDeseado) * u,
            dz: Math.cos(e.rumboDeseado) * u
          };
          const rel = norm(e.rumboDeseado - (s.objetivo ? anguloA(s.objetivo) : m.cuerpo));
          ponerProceso(P.GUARDIA_MOVER, {
            sub: subGuardia(rel),
            ratio: 1
          });
        } else ponerProceso(s.objetivoCaido ? P.GUARDIA_ABAJO : P.GUARDIA);
        if (s.objetivo) mirarObjetivo(); else if (fuerza > .9) m.rumbo = e.rumboDeseado;
        m.move = 0;
        m.run = 0;
        if ((disparo || e.remate) && puedeRematar()) rematar(); else if (disparo) atacar(); else if (!e.preparar && !e.atacar) cambiar(ESTADO.BAJAR); else if (e.pasoAtras) {
          cambiar(ESTADO.ESQUIVE);
          s.pasoTipo = 0;
        } else if (e.pasoIzq) {
          cambiar(ESTADO.ESQUIVE);
          s.pasoTipo = 1;
        } else if (e.pasoDer) {
          cambiar(ESTADO.ESQUIVE);
          s.pasoTipo = 2;
        }
        break;
      }

     case ESTADO.GOLPE:
     case ESTADO.GOLPE_FUERTE:
      {
        const fuerte = s.estado === ESTADO.GOLPE_FUERTE;
        const fila = fuerte ? 2 : s.objetivoCaido ? 1 : 0;
        tasaCuerpo = 8;
        revisarGolpe(fila, fuerte);
        const tg = datos.tiemposGolpe(s.arma, fila);
        const cancelable = tg.cancelar > 0 && seg() >= tg.cancelar;
        if (terminada()) {
          cambiar(e.preparar ? ESTADO.GUARDIA : ESTADO.BAJAR);
          s.combo = 0;
        } else if (cancelable && disparo && !fuerte && (esFuego(s.arma) || s.combo < 2)) {
          s.combo++;
          atacar();
        } else if (cancelable && (e.fuerza > 0 || e.pasoAtras)) cambiar(ESTADO.GUARDIA);
        break;
      }

     case ESTADO.REMATE:
      {
        mirarObjetivo();
        tasaCuerpo = 8;
        m.move = 0;
        m.run = 0;
        const finRemate = s.t > .15 && terminada();
        if (!s.remateGolpe && s.t > .05 && (pasada(.45) || finRemate)) {
          s.remateGolpe = true;
          const o = s.objetivo, g = datos.golpe("BAK_PLAYER_FINISH");
          if (o && !o.muerto && o.caido && g && distA(o) <= REMATE.alcance * 1.3) {
            const info = {
              item: s.arma,
              golpe: g.golpe,
              tipo: g.tipo_danio,
              atributo: g.atributo,
              shock: g.shock,
              remate: true
            };
            recibirGolpeEnemigo?.(o, g.danio, g.tipo_danio, info);
            avisar("golpear", o, g.danio, g.tipo_danio, info);
            s.remates = (s.remates || 0) + 1;
          }
        }
        if (finRemate) {
          if ((e.atacar || e.remate) && puedeRematar(true)) rematar(); else cambiar(e.preparar && tieneArma ? ESTADO.GUARDIA : tieneArma ? ESTADO.BAJAR : ESTADO.NORMAL);
        }
        break;
      }

     case ESTADO.ESQUIVE:
      {
        const t = s.t;
        if (s.pasoTipo === 0) {
          ponerProceso(P.GUARDIA_MOVER, {
            sub: 11,
            ratio: 1
          });
          if (t < ESQUIVE.atras.hasta) {
            const v = ESQUIVE.atras.vel * dt, a = m.cuerpo + Math.PI;
            avance = {
              dx: Math.sin(a) * v,
              dz: Math.cos(a) * v
            };
          }
          if (t > ESQUIVE.atras.fin) cambiar(ESTADO.GUARDIA);
        } else {
          const [izq, der] = datos.pasoLateral(s.arma);
          ponerProceso(s.pasoTipo === 1 ? izq : der);
          const a = m.cuerpo + (s.pasoTipo === 1 ? -Math.PI / 2 : Math.PI / 2);
          if (t > ESQUIVE.lado.desde && t < ESQUIVE.lado.hasta) {
            const vel = t < .233 ? 850 : t < .3 ? 200 : 0;
            avance = {
              dx: Math.sin(a) * vel * dt,
              dz: Math.cos(a) * vel * dt
            };
          }
          if (t > ESQUIVE.lado.fin) cambiar(ESTADO.GUARDIA);
        }
        tasaCuerpo = 0;
        break;
      }

     case ESTADO.VACIO:
      tasaCuerpo = 6;
      m.move = 0;
      m.run = 0;
      mirarObjetivo();
      if (terminada()) cambiar(ESTADO.GUARDIA);
      break;

     case ESTADO.RECARGA:
     case ESTADO.RECARGA_MENU:
      tasaCuerpo = 6;
      m.move = 0;
      m.run = 0;
      ponerProceso(P.RECARGA);
      if (!s.sonoRecarga && seg() > 1) {
        s.sonoRecarga = true;
        sonar(SONIDO_ARMA.recarga[s.arma]);
      }
      if (terminada()) cambiar(s.estado === ESTADO.RECARGA ? ESTADO.GUARDIA : ESTADO.NORMAL);
      break;

     case ESTADO.BAJAR:
      ponerProceso(s.objetivoCaido ? P.BAJAR_ABAJO : P.BAJAR);
      if ((apretoAtaque || e.remate) && puedeRematar(true)) rematar(); else if (e.preparar) cambiar(ESTADO.PREPARAR); else if (terminada() || e.fuerza && pasada(.2)) {
        cambiar(ESTADO.NORMAL);
        s.objetivo = null;
      }
      break;

     default:
      break;
    }
    if (s.estado !== ESTADO.NORMAL && tasaCuerpo > 0) {
      const dc = norm(m.rumbo - m.cuerpo), pc = tasaCuerpo * dt;
      m.cuerpo = Math.abs(dc) < pc ? m.rumbo : norm(m.cuerpo + Math.sign(dc) * pc);
    }
    moverJuego(avance);
  }
  function anguloA(e) {
    const p = e.posicion || e.grupo?.position;
    return Math.atan2(-(p.x - jugador.position.x), p.z - jugador.position.z);
  }
  function subGuardia(rel) {
    const a = Math.abs(rel);
    if (a < Math.PI / 4) return 7;
    if (a > 3 * Math.PI / 4) return 8;
    return rel < 0 ? 9 : 10;
  }
  const REMATE = {
    alcance: 1
  };
  const distA = o => {
    const p = o?.posicion || o?.grupo?.position;
    return p ? Math.hypot(p.x - jugador.position.x, p.z - jugador.position.z) : 1e9;
  };
  function puedeRematar(buscar = false) {
    if (s.muerto || s.agarre) return false;
    let o = s.objetivo;
    if (buscar || !o || o.muerto || !o.caido) {
      o = null;
      let md = REMATE.alcance;
      for (const x of enemigos()) {
        if (!x || x.muerto || !x.caido) continue;
        const d = distA(x);
        if (d < md) {
          md = d;
          o = x;
        }
      }
      if (o) {
        s.objetivo = o;
        s.objetivoCaido = true;
      }
    }
    return !!o && !o.muerto && !!o.caido && distA(o) <= REMATE.alcance;
  }
  function rematar() {
    const k = s.arma;
    s.golpeados.clear();
    s.remateGolpe = false;
    cambiar(ESTADO.REMATE);
    ponerProceso(k === 47 ? 100 : k === 49 ? 101 : k === 53 ? 102 : P.REMATE, {
      forzar: true
    });
  }
  function atacar() {
    const a = datos.arma(s.arma);
    if (!a || a.golpe_normal === "BAK_NOTHING") return;
    if (esFuego(s.arma)) {
      if (!(s.cargador[s.arma] > 0)) {
        s.golpeados.clear();
        hayAntes = false;
        if (recargarArma?.(s.arma)) {
          cambiar(ESTADO.RECARGA);
          s.sonoRecarga = false;
          ponerProceso(P.RECARGA, {
            forzar: true
          });
        } else {
          cambiar(ESTADO.VACIO);
          ponerProceso(s.objetivoCaido ? P.VACIO_ABAJO : P.VACIO, {
            forzar: true
          });
          sonar(SONIDO_ARMA.vacio[s.arma]);
          avisar("mensaje", "sin balas");
        }
        s.balas = s.cargador[s.arma] || 0;
        return;
      }
      s.cargador[s.arma]--;
      s.balas = s.cargador[s.arma];
      s.disparoPlata = s.arma === ITEM.PISTOLA && s.bala === ITEM.BALAS_PLATA;
      alGastar?.(s.arma, "disparo");
    }
    const fuerte = s.carga >= 100 && (a.carga_segundos || 0) > 0;
    if (fuerte) s.carga = 0; else if (s.carga > 50) s.carga *= .9;
    s.golpeados.clear();
    hayAntes = false;
    s.sonoGolpe = false;
    cambiar(fuerte ? ESTADO.GOLPE_FUERTE : ESTADO.GOLPE);
    ponerProceso(fuerte ? P.GOLPE_FUERTE : s.objetivoCaido ? P.GOLPE_ABAJO : P.GOLPE, {
      forzar: true,
      vel: a.velocidad_anim || 1
    });
  }
  const rayo = new THREE.Raycaster, tmp = new THREE.Vector3, abajo = new THREE.Vector3(0, -1, 0);
  const RADIO = .25, PASO = .45;
  function libre(dir, dist) {
    const col = getColision?.();
    if (!col) return true;
    for (const alto of [ PASO - ojos + .05, -.6, 0 ]) {
      tmp.copy(jugador.position);
      tmp.y += alto;
      rayo.set(tmp, dir);
      rayo.far = dist + RADIO;
      if (rayo.intersectObject(col).some(x => Math.abs(x.face.normal.y) < .6)) return false;
    }
    return true;
  }
  const pisoComun = crearPiso(THREE, ESCALA);
  function pisar() {
    const col = getColision?.();
    if (!col) return;
    const y = pisoComun.visor(col, jugador.position.x, jugador.position.y - ojos, jugador.position.z, .5, 2.5);
    if (y != null) {
      const meta = y + ojos, vmax = (m.move * m.run * MOV.alturaVel + MOV.alturaVel) * ESCALA * ultimoDt;
      const d = meta - jugador.position.y;
      jugador.position.y = Math.abs(d) > .5 || Math.abs(d) <= vmax ? meta : jugador.position.y + Math.sign(d) * vmax;
    }
  }
  let ultimoDt = 1 / 30;
  const dirV = new THREE.Vector3;
  function moverJuego(av) {
    const dx = -av.dx * ESCALA, dz = av.dz * ESCALA;
    const dist = Math.hypot(dx, dz);
    if (dist > 1e-6) {
      dirV.set(dx / dist, 0, dz / dist);
      if (libre(dirV, dist)) jugador.position.addScaledVector(dirV, dist); else for (const eje of [ new THREE.Vector3(Math.sign(dx), 0, 0), new THREE.Vector3(0, 0, Math.sign(dz)) ]) {
        const parte = Math.abs(eje.x ? dx : dz);
        if (parte > 1e-5 && libre(eje, parte)) jugador.position.addScaledVector(eje, parte);
      }
    }
    pisar();
  }
  function golpeExterno(e, {fuerte: fuerte = false} = {}) {
    if (!e || e.muerto || s.muerto) return false;
    const a = datos.arma(s.arma);
    if (!a || !a.golpe_normal || a.golpe_normal === "BAK_NOTHING") return false;
    const g = datos.golpe(fuerte && a.golpe_fuerte ? a.golpe_fuerte : a.golpe_normal);
    if (!g || !g.danio) return false;
    const info = {
      item: s.arma,
      golpe: g.golpe,
      tipo: g.tipo_danio,
      atributo: g.atributo,
      shock: g.shock,
      fuerte: fuerte,
      externo: true
    };
    recibirGolpeEnemigo?.(e, g.danio, g.tipo_danio, info);
    avisar("golpear", e, g.danio, g.tipo_danio, info);
    gastarArma();
    return true;
  }
  return {
    s: s,
    m: m,
    P: P,
    golpeExterno: golpeExterno,
    enemigosLista: () => enemigos() || [],
    actualizar(dt, e) {
      ultimoDt = dt;
      actualizar(dt, e);
    },
    recibirDanio: recibirDanio,
    danio: danio,
    curar: curar,
    usarCuracion: usarCuracion,
    morir: morir,
    agarrar: agarrar,
    soltarAgarre: soltarAgarre,
    estadoAgarre: estadoAgarre,
    revivir() {
      s.muerto = false;
      s.gameOver = false;
      s.vida = s.vidaMax;
      s.danio = null;
      s.agarre = null;
      s.sinGolpe = 0;
      cambiar(ESTADO.NORMAL);
      ponerProceso(P.QUIETO, {
        forzar: true,
        mezcla: 0
      });
    },
    ponerProceso: ponerProceso,
    ponerEnemigos(f) {
      enemigos = typeof f === "function" ? f : () => f || [];
    },
    ponerRecibirGolpe(f) {
      recibirGolpeEnemigo = f;
    },
    alGastarArma(f) {
      alGastar = f;
    },
    ponerMunicion(f) {
      municion = f;
    },
    ponerRecarga(f) {
      recargarArma = f;
    },
    ponerSonido(f) {
      sonarF = f;
    },
    sonar: sonar,
    sonarGolpe: (fuerte = false) => sonidoGolpe(fuerte),
    puedeRematar: () => puedeRematar(true),
    recargarDesdeMenu() {
      if (s.muerto || s.estado !== ESTADO.NORMAL || !esFuego(s.arma)) return false;
      cambiar(ESTADO.RECARGA_MENU);
      s.sonoRecarga = false;
      ponerProceso(P.RECARGA, {
        forzar: true
      });
      return true;
    },
    on(k, f) {
      ganchos[k]?.push(f);
    },
    pisar: pisar,
    moverJuego: moverJuego
  };
}
