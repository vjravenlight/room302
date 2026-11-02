// SH4 web — FeniXVOID · Project Ravenlight
import { q } from "./motor.js";

let itemsDados = false;

export function itemsDePrueba(api) {
  if (itemsDados || !q.has("items")) return;
  itemsDados = true;
  for (const k of q.get("items").split(",").map(Number).filter(Boolean)) api.henry.agregarItem(k, 1);
}

export function copiarRecogidos(api, etapa, desde, hasta) {
  const P = api.PARTIDA, rec = P.recogidos ||= [];
  const a = api.eventosCrudos(desde) || [], b = api.eventosCrudos(hasta) || [];
  for (const o of a) {
    if (!o.item || !o.pos || !rec.includes(`${etapa}/${desde}/${api.mitad}/${o.i}`)) continue;
    const x = b.find(y => y.item === o.item && y.pos && Math.hypot(y.pos[0] - o.pos[0], y.pos[2] - o.pos[2]) < 30);
    const k = x && `${etapa}/${hasta}/${api.mitad}/${x.i}`;
    if (k && !rec.includes(k)) rec.push(k);
  }
}

export function ponerMitadEfectos(api) {
  try {
    if (api.amb?.fx?.opciones && api.amb.fx.opciones().mitad !== api.mitad) api.amb.fx.opciones({
      mitad: api.mitad
    });
  } catch {}
}

export function eileenAlLado(api, U) {
  return U.eileenConHenry();
}

export async function eileenDePrueba(api, U) {
  if (!q.has("eileen") || api.eileen?.actual || api.PARTIDA.eileen?.estado) return;
  const p = U.posHenry(), r = U.rotHenry();
  await (api.ponerEileen?.({
    pos: [ p[0] - Math.sin(r) * 120, p[1], p[2] - Math.cos(r) * 120 ],
    rot: r
  }));
}
