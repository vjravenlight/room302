// SH4 web — FeniXVOID · Project Ravenlight
import * as THREE from "three";

import { aMundo } from "./cuarto.js";

const FPS = 30;

const QZ = (new THREE.Quaternion).setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI);

const EJE_X = new THREE.Vector3(1, 0, 0), EJE_Y = new THREE.Vector3(0, 1, 0), EJE_Z = new THREE.Vector3(0, 0, 1);

const VENTANAS = {
  1: [ [ 930, 870 ], [ 660, 600 ] ],
  2: [ [ 470, 370 ], [ 200, 100 ] ]
};

const GIRO_X = 0;

export function crearEfectos302({M: M, juego: juego, cuarto: cuarto, F: F, prender: prender, apagar: apagar, evaluar: evaluar}) {
  const activos = [];
  const afuera = () => juego.fase === "mirando por la ventana";
  let vuelta = 0;
  function quitarTodos() {
    for (const a of activos.splice(0)) try {
      a.quitar();
    } catch {}
  }
  async function modelo2202(n) {
    let pj;
    try {
      pj = await cuarto.crearModelo({
        arch: "event_rl00.bin",
        m: 2,
        t: 3,
        a: [ "event_rl00.bin", 4 ]
      });
    } catch (e) {
      console.warn("ev 2202", e.message);
      return;
    }
    if (n !== vuelta) {
      pj.dispose?.();
      return;
    }
    pj.grupo.name = "ev 2202 (event_rl00 #2)";
    cuarto.grupo.add(pj.grupo);
    prender(1618);
    activos.push({
      que: "2202",
      grupo: pj.grupo,
      sala: cuarto.sala?.nombre,
      actualizar: dt => {
        if (!cumple2202()) return "fin";
        pj.grupo.visible = !afuera();
        pj.actualizar(dt);
        return true;
      },
      quitar: () => {
        pj.grupo.removeFromParent();
        pj.dispose?.();
        apagar(1618);
      }
    });
  }
  const cumple2202 = () => evaluar("F701 AND !F911 AND !F1619", F);
  async function sombra2206(n, esc) {
    let pj;
    try {
      pj = await cuarto.crearModelo({
        arch: "event_rl.bin",
        m: 0,
        t: 1
      });
    } catch (e) {
      console.warn("ev 2206", e.message);
      return;
    }
    if (n !== vuelta) {
      pj.dispose?.();
      return;
    }
    pj.grupo.name = "ev 2206 (event_rl #0)";
    pj.grupo.visible = false;
    cuarto.grupo.add(pj.grupo);
    const s = {
      estado: 0,
      cuenta: 0,
      sentido: Math.random() * 2 | 0,
      x: 0,
      y: 0,
      hasta: 0,
      vel: .5,
      q: new THREE.Quaternion
    };
    const qa = new THREE.Quaternion;
    const girar = (ax, ay, az) => {
      s.q.multiply(qa.setFromAxisAngle(EJE_X, ax)).multiply(qa.setFromAxisAngle(EJE_Y, ay)).multiply(qa.setFromAxisAngle(EJE_Z, az));
    };
    function preparar() {
      s.cuenta = FPS * 300 / 12 + Math.floor(Math.random() * 60) * (Math.random() < .5 ? -1 : 1);
      const par = VENTANAS[esc][Math.random() * 2 | 0];
      s.x = par[0] + Math.random() * (par[1] - par[0]);
      s.y = s.sentido === 0 ? 50 : -450;
      s.hasta = s.sentido === 0 ? -450 : 50;
      s.vel = .5;
      s.q.set(1, 0, 0, 0);
      girar(-3.14, -3.24, -.36);
    }
    preparar();
    let resto = 0;
    activos.push({
      que: "2206",
      grupo: pj.grupo,
      sala: cuarto.sala?.nombre,
      estado: s,
      actualizar(dt) {
        if (!evaluar("F901 AND !F911", F)) return "fin";
        if (juego.demoActual) return false;
        resto += dt * FPS;
        let cambio = false;
        while (resto >= 1) {
          resto -= 1;
          if (s.estado === 0) {
            if (s.cuenta-- < 1) s.estado = 1;
            continue;
          }
          if (s.sentido === 0) {
            s.y -= s.vel;
            girar(-GIRO_X, .004 * -.5, -.0025);
          } else {
            s.y += s.vel;
            girar(GIRO_X, .004, .0025);
          }
          s.vel *= 1.01;
          cambio = true;
          const llego = s.sentido === 0 ? s.y < s.hasta : s.y > s.hasta;
          if (llego) {
            s.sentido ^= 1;
            preparar();
            s.estado = 0;
          }
        }
        const ver = s.estado === 1 && !afuera();
        if (ver) {
          pj.grupo.position.copy(aMundo([ s.x, s.y, -950 ]));
          pj.grupo.children[0]?.quaternion.copy(QZ).multiply(s.q);
        }
        if (pj.grupo.visible !== ver) {
          pj.grupo.visible = ver;
          cambio = true;
        }
        return cambio;
      },
      quitar: () => {
        pj.grupo.removeFromParent();
        pj.dispose?.();
      }
    });
  }
  M.tareas.add(dt => {
    let cambio = false;
    for (const a of activos.slice()) {
      if (cuarto.sala?.nombre !== a.sala) continue;
      if (!a.grupo.parent) {
        cuarto.grupo.add(a.grupo);
        cambio = true;
      }
      const r = a.actualizar(dt);
      if (r === "fin") {
        a.quitar();
        activos.splice(activos.indexOf(a), 1);
        cambio = true;
      } else if (r) cambio = true;
    }
    return cambio;
  });
  function alEntrarSala() {
    const n = ++vuelta;
    quitarTodos();
    const esc = +cuarto.escena;
    if (esc === 1 && cumple2202()) modelo2202(n);
    if ((esc === 1 || esc === 2) && evaluar("F901 AND !F911", F)) sombra2206(n, esc);
  }
  return {
    alEntrarSala: alEntrarSala,
    quitarTodos: quitarTodos,
    estado: () => activos.map(a => a.que === "2206" ? `2206 ${a.estado.estado ? "pasando" : "esperando " + Math.round(a.estado.cuenta / FPS) + " s"}` : a.que),
    ya() {
      for (const a of activos) if (a.que === "2206") a.estado.cuenta = 0;
    },
    sombra: () => activos.find(a => a.que === "2206") || null
  };
}
