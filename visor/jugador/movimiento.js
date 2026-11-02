// SH4 web — FeniXVOID · Project Ravenlight
import { MOV } from "./datos.js";

const norm = a => Math.atan2(Math.sin(a), Math.cos(a));

const acercar = (v, meta, paso) => Math.abs(meta - v) <= paso ? meta : v + Math.sign(meta - v) * paso;

export function crearMovimiento() {
  return {
    move: 0,
    run: 0,
    rumbo: 0,
    cuerpo: 0,
    deseado: 0,
    vel: 0,
    girando: false
  };
}

export function pasoMovimiento(m, entrada, dt, {bloqueado: bloqueado = false, tasaCuerpo: tasaCuerpo = MOV.cuerpoGiro} = {}) {
  let fuerza = bloqueado ? 0 : entrada.fuerza || 0;
  if (fuerza > 0 && fuerza < MOV.stickMin) fuerza = MOV.stickMin;
  if (fuerza < MOV.atrasMin) fuerza = MOV.atrasMin;
  let runMeta = !bloqueado && entrada.correr && fuerza > MOV.stickMin ? 1 : 0;
  if (fuerza <= 0) runMeta = 0;
  if (fuerza !== 0) m.deseado = entrada.rumboDeseado;
  m.girando = false;
  if (fuerza > 0) {
    const giro = (MOV.giroParado - (MOV.giroParado - (MOV.giroCaminar - m.run * MOV.giroRestaCorrer)) * m.move) * dt;
    const d = norm(m.deseado - m.rumbo);
    if (Math.abs(d) < giro) m.rumbo = m.deseado; else {
      m.rumbo = norm(m.rumbo + Math.sign(d) * giro);
      m.girando = true;
      if (runMeta > MOV.correrAlGirar) runMeta = MOV.correrAlGirar;
    }
  }
  m.run = Math.min(1, Math.max(0, acercar(m.run, runMeta, MOV.correrRampa * dt)));
  m.move = acercar(m.move, fuerza, MOV.aceleracion * dt);
  const unidades = m.move * MOV.paso * (m.run + 1) * MOV.fps * dt;
  m.vel = unidades / Math.max(dt, 1e-6);
  const dc = norm(m.rumbo - m.cuerpo), pc = tasaCuerpo * dt;
  m.cuerpo = Math.abs(dc) < pc ? m.rumbo : norm(m.cuerpo + Math.sign(dc) * pc);
  return {
    dx: Math.sin(m.rumbo) * unidades,
    dz: Math.cos(m.rumbo) * unidades
  };
}

export const velocidadAnim = m => Math.min(1, Math.max(.6, Math.abs(m.move)));

export const mezclaCorrer = m => Math.min(1, m.run * 1.4);
