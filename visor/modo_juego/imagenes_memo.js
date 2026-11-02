// SH4 web — FeniXVOID · Project Ravenlight
export const IMAGENES_MEMO = [ "snap_kyoten", "snap_hiseki", "snap_papa", null, "snap_pict", "snap_bookred", "snap_shirt", "snap_town", "snap_spdial", "snap_1stlet", "snap_redscp", "snap_dialred", "snap_spmem", "snap_spscp", "snap_redscp2", "snap_letjos", "snap_spdial2", "snap_rinjin", "snap_lovlet", "snap_redenv", "snap_dialred2", "snap_dialred3", "snap_nursemem", "snap_childenv", "snap_barmem", "snap_omoide", "snap_dokubou", "snap_mzrepo", "snap_cordmz", "snap_kirehashi", "snap_shiromemo", "snap_yakememo", "snap_wish" ];

export function archivoImagen(im) {
  if (im == null || im === "") return null;
  const s = String(im);
  if (/^0x[0-9a-f]+$/i.test(s) || typeof im === "number") return IMAGENES_MEMO[+im] ?? null;
  return s.replace(/\.bin$/, "");
}
