// SH4 web — FeniXVOID · Project Ravenlight
const MITAD_ANCHO = 40;

export class MotorSdb {
  constructor({fundidos: fundidos, prioridad: prioridad, salida: salida}) {
    this.fundidos = fundidos;
    this.prioridad = prioridad;
    this.salida = salida;
    this.regs = [];
    this.escena = 0;
    this.pagina = 0;
    this.paginaBase = 0;
    this.combate = false;
    this.cine = false;
    this.cercanas = Array.from({
      length: 8
    }, () => ({
      estado: 0,
      fin: 0,
      fout: 0,
      vol: 0
    }));
    this.pistas = [ 0, 1 ].map(() => this.pistaVacia());
    this.sec = {
      estado: 0,
      def: null
    };
    this.zonasDentro = [];
  }
  pistaVacia() {
    return {
      estado: 0,
      no: -1,
      sig: null,
      tipoVol: 0,
      corte: 0,
      fundido: 0,
      vol: 0,
      pos: null,
      radio: 0
    };
  }
  cargarSdb(regs, secuencia) {
    for (let t = 0; t < 2; t++) this.cortar(t, 2, true);
    this.regs = regs;
    for (const r of regs) if (r.tipo === 2) r._tirado = false;
    if (this.sec.estado) this.salida.pararSecuencia?.();
    this.sec = {
      estado: secuencia ? 2 : 0,
      def: secuencia || null
    };
    if (secuencia) this.salida.tocarSecuencia?.(secuencia);
    for (const c of this.cercanas.slice(0, 6)) Object.assign(c, {
      estado: 0,
      vol: 0
    });
  }
  cambiarEscena(escena) {
    if (escena === this.escena) return;
    this.pistas.forEach((p, t) => {
      if (p.estado && (p.tipoVol > 1 || p.corte === 1)) this.cortar(t, 6, true);
    });
    if (this.pistas[0].estado === 2 && this.pistas[1].estado === 2) this.cortar(this.pistas[0].no < 2e4 ? 1 : 0, 6, true);
    for (const r of this.regs) if (r.tipo === 2 && r.flags & 8) r._tirado = false;
    this.escena = escena;
  }
  cortar(t, fundido, sinSiguiente) {
    const p = this.pistas[t];
    if (!p.estado) return;
    p.estado = 4;
    p.fundido = fundido;
    if (sinSiguiente) p.sig = null;
  }
  autoPista(no) {
    const [a, b] = this.pistas, s0 = a.estado, n0 = a.no, s1 = b.estado, n1 = b.no;
    if (no >= 1e4 && no < 2e4) {
      if (s0 === 0) return 0;
      if (s1 === 0) return 1;
      if (n1 > 29999) return 0;
      if (n0 > 29999) return 1;
      return n1 > 19999 ? 1 : 0;
    }
    if (no >= 2e4 && no < 3e4) {
      if (s1 === 0) return 1;
      if (s0 === 0) return 0;
      if (n0 > 29999) return 1;
      if (n1 > 29999) return 0;
      return n0 < 2e4 ? 1 : 0;
    }
    if (n1 > 29999) return 1;
    if (n0 < 3e4) {
      if (s1 === 0) return 1;
      if (s0 !== 0) {
        if (n1 < 1e4) return 1;
        if (n0 > 9999) return n0 < 2e4 ? 1 : 0;
      }
    }
    return 0;
  }
  arrancar(t, no, tipoVol, corte, vol, area) {
    const p = this.pistas[t], c = this.cercanas[6 + t];
    Object.assign(p, {
      estado: 2,
      no: no,
      sig: null,
      tipoVol: tipoVol,
      corte: corte,
      vol: tipoVol === 1 ? vol : 0,
      fundido: 0
    });
    if (tipoVol === 0) Object.assign(c, {
      estado: 0,
      fin: 0,
      fout: 0,
      vol: 0
    }); else Object.assign(c, {
      estado: 2,
      fin: 2,
      fout: 2,
      vol: tipoVol === 1 ? vol : 0
    });
    if (tipoVol > 1 && area) {
      const [x0, z0, x1, z1, , ymax] = area;
      p.pos = [ (x0 + x1) / 2, ymax, (z0 + z1) / 2 ];
      p.radio = Math.hypot(x1 - x0, z1 - z0) / 2;
    } else p.pos = null;
    this.salida.tocar(t, no, p.vol);
  }
  tocarEnZona(t, r) {
    const p = this.pistas[t];
    if (p.no === r.no || !(r.pagina === this.pagina || r.pagina === -1)) return;
    if (r.porcentaje) {
      if (r._tirado) return;
      r._tirado = true;
      if (Math.floor(Math.random() * 100) >= r.porcentaje) return;
    }
    if (p.estado === 0) this.arrancar(t, r.no, r.tipoVol, r.corte, r.vol, r.area); else {
      p.estado = 4;
      p.fundido = r.fundido;
      p.sig = {
        no: r.no,
        tipoVol: r.tipoVol,
        corte: r.corte,
        vol: r.vol,
        area: r.area
      };
    }
  }
  zonas(pos) {
    const [px, py, pz] = pos, w = MITAD_ANCHO, cerca = [];
    this.zonasDentro = [];
    for (const r of this.regs) {
      if (r.escena !== this.escena) continue;
      const [x0, z0, x1, z1, ymin, ymax] = r.area;
      if (!(x0 <= px + w && px - w <= x1 && z1 <= pz + w && pz - w <= z0 && py <= ymin && ymax <= py)) continue;
      this.zonasDentro.push(r);
      if (r.tipo === 0) cerca.push(r.pistas.map(m => m.get(this.pagina) || [ 0, 0 ])); else if (r.tipo === 1) this.paginaBase = r.flags & 1 ? r.no : Math.max(this.paginaBase, r.no); else if (r.tipo === 2) {
        if (r.pista === -1) continue;
        if (r.pista === -2) {
          this.salida.seArea?.(r);
          continue;
        }
        if (r.pista === 3) {
          const [a, b] = this.pistas;
          if (a.no === r.no) a.corte = r.corte; else if (a.sig?.no === r.no) a.sig.corte = r.corte; else if (b.no === r.no) b.corte = r.corte; else if (b.sig?.no === r.no) b.sig.corte = r.corte; else this.tocarEnZona(this.autoPista(r.no), r);
        } else this.tocarEnZona(r.pista, r);
      } else if (r.tipo === 3) {
        if (r.pista === -1) {
          if (this.sec.estado === 2) this.pararSecuencia(r.fundido);
          continue;
        }
        let t = r.pista;
        if (r.no) {
          if (this.pistas[0].no === r.no) t = this.pistas[1].no === r.no ? 2 : 0; else if (this.pistas[1].no === r.no) t = 1; else continue;
        }
        this.pistas.forEach((p, i) => {
          if (p.no > 9999 && (t === i || t === 2) && p.estado && p.estado !== 4) this.cortar(i, r.fundido, true);
        });
      }
    }
    return cerca;
  }
  pararSecuencia(fundido) {
    this.sec.estado = 4;
    this.sec.fundido = fundido;
  }
  actualizar(dt, pos) {
    this.pagina = this.cine ? 10 : this.combate ? 11 : this.paginaBase;
    const cerca = pos ? this.zonas(pos) : [];
    for (let j = 0; j < 8; j++) {
      let fin = 0, fout = 0;
      for (const z of cerca) {
        if (this.prioridad[fin] < this.prioridad[z[j][0]]) fin = z[j][0];
        if (this.prioridad[fout] < this.prioridad[z[j][1]]) fout = z[j][1];
      }
      const c = this.cercanas[j];
      if (!fin) {
        if (c.estado) c.estado = 3;
      } else if (c.estado === 0 || c.estado === 3) Object.assign(c, {
        estado: 1,
        fin: fin,
        fout: fout
      });
    }
    const fundir = c => {
      if (c.estado === 1) {
        const s = this.fundidos[c.fin];
        c.vol = c.fin === 4 || !s ? 1 : c.vol + dt / s;
        if (c.vol >= 1) {
          c.vol = 1;
          c.estado = 2;
        }
      } else if (c.estado === 3) {
        const s = this.fundidos[c.fout];
        c.vol = c.fout === 4 || !s ? 0 : c.vol - dt / s;
        if (c.vol <= 0) {
          c.vol = 0;
          c.estado = 0;
        }
      }
    };
    if (this.sec.estado === 2) {
      for (let j = 0; j < 6; j++) fundir(this.cercanas[j]);
      this.sec.def.pista_de_capa.forEach((j, k) => this.salida.volumenCapa?.(k, j < 0 ? this.volCapaLibre(k) : this.cercanas[j].vol));
    } else if (this.sec.estado === 4) {
      let quedan = 0;
      for (let j = 0; j < 6; j++) {
        const c = this.cercanas[j], s = this.fundidos[this.sec.fundido];
        c.vol = !s ? 0 : Math.max(0, c.vol - dt / s);
        if (c.vol > 0) quedan++;
      }
      this.sec.def.pista_de_capa.forEach((j, k) => this.salida.volumenCapa?.(k, j < 0 ? 0 : this.cercanas[j].vol));
      if (!quedan) {
        this.sec.estado = 0;
        this.salida.pararSecuencia?.();
      }
    }
    this.pistas.forEach((p, t) => {
      const c = this.cercanas[6 + t];
      if (p.estado === 4) {
        const s = this.fundidos[p.fundido];
        p.vol = !s ? 0 : p.vol - dt / s;
        if (p.vol <= 0) {
          p.vol = 0;
          p.estado = 0;
          this.salida.parar(t);
          const sig = p.sig;
          p.no = -1;
          p.sig = null;
          if (sig) this.arrancar(t, sig.no, sig.tipoVol, sig.corte, sig.vol, sig.area);
          return;
        }
      } else if (p.estado === 2) {
        if (p.tipoVol === 0) {
          fundir(c);
          p.vol = c.vol;
        } else if (p.tipoVol > 1 && pos && p.pos) p.vol = 1 - Math.min(1, Math.hypot(pos[0] - p.pos[0], pos[2] - p.pos[2]) / (p.radio || 1));
      }
      if (p.estado) this.salida.volumen(t, p.vol);
    });
  }
  volCapaLibre() {
    return this.capaLibre ?? 0;
  }
  terminado(t) {
    const p = this.pistas[t];
    if (p.estado === 2) {
      p.estado = 0;
      p.no = -1;
    }
  }
  estadoTexto() {
    const f = x => x.toFixed(2);
    return `página ${this.pagina} · escena ${this.escena}\n` + this.pistas.map((p, t) => `stream ${t}: ${p.estado ? p.no + " estado " + p.estado + " vol " + f(p.vol) + (p.sig ? " → " + p.sig.no : "") : "—"}`).join("\n") + "\ncercanas: " + this.cercanas.map(c => f(c.vol)).join(" ") + (this.sec.def ? `\nsecuencia ${this.sec.def.id} estado ${this.sec.estado}` : "");
  }
}
