// SH4 web — FeniXVOID · Project Ravenlight
export const NIEBLA_RADIAL = {
  value: 0
};

export const PROF_NIEBLA = "mix(-mvPosition.z, length(mvPosition.xyz), uNieblaRadial)";

export const DECL_NIEBLA = "#ifndef SH4_NIEBLA_RADIAL\n#define SH4_NIEBLA_RADIAL\nuniform float uNieblaRadial;\n#endif";
