// SH4 web — FeniXVOID · Project Ravenlight
export const claveModelo = (arch, parte) => String(arch || "").toLowerCase().replace(/\.bin$/, "") + "#" + parte;

export function marcarModelo(grupo, arch, parte) {
  grupo.userData.modelo = claveModelo(arch, parte);
  return grupo;
}

export const seRepite = (o, D) => !!o.userData?.modelo && !!D?.modelos?.has(o.userData.modelo);
