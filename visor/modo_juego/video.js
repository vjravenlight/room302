// SH4 web — FeniXVOID · Project Ravenlight
import { SeparadorPS } from "./ps_mpeg.js";

import { DecodificadorMp1 } from "./mp1.js";

export const URL_JSMPEG = "https://cdn.jsdelivr.net/npm/@cycjimmy/jsmpeg-player@6.1.2/dist/jsmpeg-player.esm.js";

let jsmpeg = null;

async function cargarJSMpeg() {
  if (!jsmpeg) jsmpeg = import(URL_JSMPEG).then(m => m.default || m.JSMpeg || m).catch(e => {
    jsmpeg = null;
    throw e;
  });
  return jsmpeg;
}

function claseConB(JSMpeg) {
  const Base = JSMpeg.Decoder.MPEG1Video;
  const M = Base;
  const T = M.PICTURE_TYPE;
  const juego = () => ({
    y: null,
    cr: null,
    cb: null,
    y32: null,
    cr32: null,
    cb32: null
  });
  return class MPEG1ConB extends Base {
    initBuffers() {
      super.initBuffers();
      const n = this.codedSize, nuevo = () => {
        const j = juego();
        j.y = new Uint8ClampedArray(n);
        j.y32 = new Uint32Array(j.y.buffer);
        j.cr = new Uint8ClampedArray(n >> 2);
        j.cr32 = new Uint32Array(j.cr.buffer);
        j.cb = new Uint8ClampedArray(n >> 2);
        j.cb32 = new Uint32Array(j.cb.buffer);
        return j;
      };
      this.refs = [ nuevo(), nuevo(), nuevo() ];
      this.refAnt = null;
      this.refPos = null;
      this.libre = 0;
      this.jB = nuevo();
      this.jAux = nuevo();
      this.motionBwH = this.motionBwHPrev = this.motionBwV = this.motionBwVPrev = 0;
    }
    usar(j) {
      this.currentY = j.y;
      this.currentY32 = j.y32;
      this.currentCr = j.cr;
      this.currentCr32 = j.cr32;
      this.currentCb = j.cb;
      this.currentCb32 = j.cb32;
    }
    decodePicture() {
      this.currentFrame++;
      this.bits.skip(10);
      this.pictureType = this.bits.read(3);
      this.bits.skip(16);
      if (this.pictureType <= 0 || this.pictureType > T.B) return;
      if (this.pictureType === T.B && (!this.refAnt || !this.refPos || this.saltarB)) {
        this.saltarImagen();
        this.descartados = (this.descartados || 0) + 1;
        return;
      }
      if (this.pictureType >= T.PREDICTIVE) {
        this.fullPelForward = this.bits.read(1);
        this.forwardFCode = this.bits.read(3);
        if (!this.forwardFCode) return;
        this.forwardRSize = this.forwardFCode - 1;
        this.forwardF = 1 << this.forwardRSize;
      }
      if (this.pictureType === T.B) {
        this.fullPelBackward = this.bits.read(1);
        this.backwardFCode = this.bits.read(3);
        if (!this.backwardFCode) return;
        this.backwardRSize = this.backwardFCode - 1;
        this.backwardF = 1 << this.backwardRSize;
      }
      let destino;
      if (this.pictureType === T.B) {
        destino = this.jB;
        this.fw = this.refAnt;
        this.bw = this.refPos;
      } else {
        destino = this.refs[this.libre];
        this.fw = this.refPos;
        this.bw = null;
      }
      if (this.fw) {
        this.forwardY = this.fw.y;
        this.forwardCr = this.fw.cr;
        this.forwardCb = this.fw.cb;
      }
      this.usar(destino);
      let code = 0;
      do {
        code = this.bits.findNextStartCode();
      } while (code === M.START.EXTENSION || code === M.START.USER_DATA);
      while (code >= M.START.SLICE_FIRST && code <= M.START.SLICE_LAST) {
        this.decodeSlice(code & 255);
        code = this.bits.findNextStartCode();
      }
      if (code !== -1) this.bits.rewind(32);
      if (this.pictureType === T.B) this.mostrar(destino); else {
        if (this.refPos) this.mostrar(this.refPos);
        const viejo = this.refAnt;
        this.refAnt = this.refPos;
        this.refPos = destino;
        this.libre = this.refs.indexOf(viejo ?? this.refs.find(r => r !== this.refAnt && r !== this.refPos));
      }
    }
    saltarImagen() {
      let code = 0;
      do {
        code = this.bits.findNextStartCode();
      } while (code === M.START.EXTENSION || code === M.START.USER_DATA || code >= M.START.SLICE_FIRST && code <= M.START.SLICE_LAST);
      if (code !== -1) this.bits.rewind(32);
    }
    mostrar(j) {
      this.destination?.render(j.y, j.cr, j.cb, true);
    }
    vaciar() {
      if (this.refPos) {
        this.mostrar(this.refPos);
        this.refPos = null;
      }
    }
    decodeSlice(slice) {
      this.motionBwH = this.motionBwHPrev = this.motionBwV = this.motionBwVPrev = 0;
      this.mbAntFw = false;
      this.mbAntBw = false;
      super.decodeSlice(slice);
    }
    decodeMacroblock() {
      if (this.pictureType !== T.B) {
        this.forwardY = this.fw?.y;
        this.forwardCr = this.fw?.cr;
        this.forwardCb = this.fw?.cb;
        return super.decodeMacroblock();
      }
      let incremento = 0, t = this.readHuffman(M.MACROBLOCK_ADDRESS_INCREMENT);
      while (t === 34) t = this.readHuffman(M.MACROBLOCK_ADDRESS_INCREMENT);
      while (t === 35) {
        incremento += 33;
        t = this.readHuffman(M.MACROBLOCK_ADDRESS_INCREMENT);
      }
      incremento += t;
      if (this.sliceBegin) {
        this.sliceBegin = false;
        this.macroblockAddress += incremento;
      } else {
        if (this.macroblockAddress + incremento >= this.mbSize) return;
        if (incremento > 1) {
          this.dcPredictorY = this.dcPredictorCr = this.dcPredictorCb = 128;
        }
        while (incremento > 1) {
          this.macroblockAddress++;
          this.mbRow = this.macroblockAddress / this.mbWidth | 0;
          this.mbCol = this.macroblockAddress % this.mbWidth;
          this.predecirB(this.mbAntFw, this.mbAntBw);
          incremento--;
        }
        this.macroblockAddress++;
      }
      this.mbRow = this.macroblockAddress / this.mbWidth | 0;
      this.mbCol = this.macroblockAddress % this.mbWidth;
      this.macroblockType = this.readHuffman(M.MACROBLOCK_TYPE_B);
      this.macroblockIntra = this.macroblockType & 1;
      this.macroblockMotFw = this.macroblockType & 8;
      const bw = this.macroblockType & 4;
      if (this.macroblockType & 16) this.quantizerScale = this.bits.read(5);
      if (this.macroblockIntra) {
        this.motionFwH = this.motionFwHPrev = this.motionFwV = this.motionFwVPrev = 0;
        this.motionBwH = this.motionBwHPrev = this.motionBwV = this.motionBwVPrev = 0;
        this.mbAntFw = this.mbAntBw = false;
      } else {
        this.dcPredictorY = this.dcPredictorCr = this.dcPredictorCb = 128;
        if (this.macroblockMotFw) this.decodeMotionVectors();
        if (bw) this.vectorAtras();
        this.mbAntFw = !!this.macroblockMotFw;
        this.mbAntBw = !!bw;
        this.predecirB(this.mbAntFw, this.mbAntBw);
      }
      const cbp = (this.macroblockType & 2) !== 0 ? this.readHuffman(M.CODE_BLOCK_PATTERN) : this.macroblockIntra ? 63 : 0;
      for (let b = 0, m = 32; b < 6; b++) {
        if (cbp & m) this.decodeBlock(b);
        m >>= 1;
      }
    }
    vectorAtras() {
      const comp = prev => {
        const code = this.readHuffman(M.MOTION);
        let d;
        if (code !== 0 && this.backwardF !== 1) {
          const r = this.bits.read(this.backwardRSize);
          d = (Math.abs(code) - 1 << this.backwardRSize) + r + 1;
          if (code < 0) d = -d;
        } else d = code;
        prev += d;
        if (prev > (this.backwardF << 4) - 1) prev -= this.backwardF << 5; else if (prev < -this.backwardF << 4) prev += this.backwardF << 5;
        return prev;
      };
      this.motionBwHPrev = comp(this.motionBwHPrev);
      this.motionBwH = this.fullPelBackward ? this.motionBwHPrev << 1 : this.motionBwHPrev;
      this.motionBwVPrev = comp(this.motionBwVPrev);
      this.motionBwV = this.fullPelBackward ? this.motionBwVPrev << 1 : this.motionBwVPrev;
    }
    predecirB(fw, bw) {
      const dest = this.jB;
      if (fw) {
        this.usar(dest);
        this.copyMacroblock(this.motionFwH, this.motionFwV, this.fw.y, this.fw.cr, this.fw.cb);
      }
      if (bw) {
        this.usar(fw ? this.jAux : dest);
        this.copyMacroblock(this.motionBwH, this.motionBwV, this.bw.y, this.bw.cr, this.bw.cb);
        this.usar(dest);
        if (fw) this.promediar(dest, this.jAux);
      }
      this.usar(dest);
    }
    promediar(a, b) {
      const w = this.codedWidth, r = this.mbRow, c = this.mbCol;
      let o = (r << 4) * w + (c << 4);
      for (let y = 0; y < 16; y++, o += w) for (let x = 0; x < 16; x++) a.y[o + x] = a.y[o + x] + b.y[o + x] + 1 >> 1;
      const w2 = w >> 1;
      o = (r << 3) * w2 + (c << 3);
      for (let y = 0; y < 8; y++, o += w2) for (let x = 0; x < 8; x++) {
        a.cr[o + x] = a.cr[o + x] + b.cr[o + x] + 1 >> 1;
        a.cb[o + x] = a.cb[o + x] + b.cb[o + x] + 1 >> 1;
      }
    }
  };
}

function crearMaterial(THREE) {
  const plano = (w, h) => {
    const t = new THREE.DataTexture(new Uint8Array(w * h), w, h, THREE.RedFormat, THREE.UnsignedByteType);
    t.minFilter = t.magFilter = THREE.LinearFilter;
    t.generateMipmaps = false;
    t.needsUpdate = true;
    t.unpackAlignment = 1;
    return t;
  };
  const u = {
    tY: {
      value: plano(16, 16)
    },
    tCb: {
      value: plano(8, 8)
    },
    tCr: {
      value: plano(8, 8)
    },
    escalaUV: {
      value: new THREE.Vector2(1, 1)
    },
    brillo: {
      value: 1
    }
  };
  const material = new THREE.ShaderMaterial({
    uniforms: u,
    toneMapped: false,
    depthWrite: false,
    vertexShader: "varying vec2 vUv; uniform vec2 escalaUV; void main(){ vUv = vec2(uv.x, 1.0 - uv.y) * escalaUV; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: `varying vec2 vUv; uniform sampler2D tY, tCb, tCr; uniform float brillo;\n      void main(){\n        float y = 1.16438 * (texture2D(tY, vUv).r - 0.0627451);\n        float cb = texture2D(tCb, vUv).r - 0.5, cr = texture2D(tCr, vUv).r - 0.5;\n        vec3 c = vec3(y + 1.59603 * cr, y - 0.39176 * cb - 0.81297 * cr, y + 2.01723 * cb);\n        gl_FragColor = vec4(clamp(c, 0.0, 1.0) * brillo, 1.0);\n      }`
  });
  let ancho = 0, alto = 0;
  const destino = {
    resize(w, h) {
      ancho = w;
      alto = h;
    },
    render(y, cr, cb) {
      const W = ancho + 15 >> 4 << 4, H = alto + 15 >> 4 << 4;
      for (const [nom, src, w, h] of [ [ "tY", y, W, H ], [ "tCr", cr, W >> 1, H >> 1 ], [ "tCb", cb, W >> 1, H >> 1 ] ]) {
        let t = u[nom].value;
        if (t.image.width !== w || t.image.height !== h) {
          t.dispose();
          t = u[nom].value = plano(w, h);
        }
        t.image.data.set(src.length === w * h ? src : src.subarray(0, w * h));
        t.needsUpdate = true;
      }
      u.escalaUV.value.set(ancho / W, alto / H);
      destino.cuadros++;
    },
    cuadros: 0
  };
  return {
    material: material,
    destino: destino,
    get ancho() {
      return ancho;
    },
    get alto() {
      return alto;
    }
  };
}

function hayImagenCompleta(bits, terminado) {
  const b = bits.bytes, n = bits.byteLength;
  let i = bits.index + 7 >> 3, vista = false;
  for (;i + 3 < n; i++) {
    if (b[i] !== 0 || b[i + 1] !== 0 || b[i + 2] !== 1) continue;
    const c = b[i + 3];
    if (!vista) {
      if (c === 0) vista = true;
      i += 3;
      continue;
    }
    if (c === 0 || c >= 176) return true;
    i += 3;
  }
  return terminado && vista;
}

export async function abrirVideo({THREE: THREE, url: url, audio: actx, volumen: volumen = 1, alAvanzar: alAvanzar}) {
  const JSMpeg = await cargarJSMpeg();
  const Clase = claseConB(JSMpeg);
  const salida = crearMaterial(THREE);
  const dec = new Clase({
    streaming: true,
    videoBufferSize: 6 * 1024 * 1024,
    decodeFirstFrame: false
  });
  dec.connect(salida.destino);
  const audioDec = new DecodificadorMp1(JSMpeg.Decoder.MP2Audio.SYNTHESIS_WINDOW);
  const colaVideo = [];
  let bytesCola = 0;
  let pts0Video = null, pts0Audio = null;
  let muestrasAudio = 0, t0Audio = null, ganancia = null;
  const fuentes = [];
  let leidoTodo = false, cancelado = false, terminado = false, cuadrosDec = 0, finVideo = false;
  const sep = new SeparadorPS({
    alVideo: (pts, d) => {
      if (pts0Video === null && pts !== null) pts0Video = pts;
      colaVideo.push(d);
      bytesCola += d.length;
    },
    alAudio: (pts, d) => {
      if (pts0Audio === null && pts !== null) pts0Audio = pts;
      const r = audioDec.escribir(d);
      if (r && actx) encolarAudio(r); else if (r) muestrasAudio += r[0].length;
    }
  });
  function encolarAudio([l, r]) {
    if (!ganancia) {
      ganancia = actx.createGain();
      ganancia.gain.value = volumen;
      ganancia.connect(actx.destination);
    }
    const b = actx.createBuffer(2, l.length, audioDec.tasa);
    b.copyToChannel(l, 0);
    b.copyToChannel(r, 1);
    const s = actx.createBufferSource();
    s.buffer = b;
    s.connect(ganancia);
    if (t0Audio === null) t0Audio = actx.currentTime + .25;
    const cuando = t0Audio + muestrasAudio / audioDec.tasa;
    if (cuando >= actx.currentTime) s.start(cuando); else s.start(actx.currentTime, Math.min(b.duration, actx.currentTime - cuando));
    fuentes.push(s);
    s.onended = () => {
      const i = fuentes.indexOf(s);
      if (i >= 0) fuentes.splice(i, 1);
    };
    muestrasAudio += l.length;
  }
  let t0Pagina = null;
  const reloj = () => {
    if (actx && t0Audio !== null && actx.state === "running") return actx.currentTime - t0Audio;
    if (t0Pagina === null) t0Pagina = performance.now();
    return (performance.now() - t0Pagina) / 1e3;
  };
  const adelanto = () => actx && t0Audio !== null ? muestrasAudio / audioDec.tasa - reloj() : 99;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error("no pude abrir " + url);
  const total = +resp.headers.get("content-length") || 0;
  const lector = resp.body.getReader();
  let leidos = 0;
  (async () => {
    try {
      for (;;) {
        if (cancelado) return;
        if (t0Audio !== null && adelanto() > 3 || bytesCola > 4e6) {
          await new Promise(r => setTimeout(r, 40));
          continue;
        }
        const {done: done, value: value} = await lector.read();
        if (done) break;
        leidos += value.length;
        sep.escribir(value);
      }
    } catch (e) {
      if (!cancelado) console.warn("video:", e.message);
    }
    leidosTodo();
  })();
  function leidosTodo() {
    leidoTodo = true;
  }
  function alimentar() {
    while (colaVideo.length && dec.bits.byteLength - (dec.bits.index >> 3) + colaVideo[0].length < 3e6) {
      const d = colaVideo.shift();
      bytesCola -= d.length;
      dec.write(null, d);
    }
  }
  const fps = () => dec.frameRate || 59.94;
  function actualizar() {
    if (terminado) return false;
    alimentar();
    const t = Math.max(0, reloj() + ((pts0Audio ?? 0) - (pts0Video ?? 0)));
    const objetivo = Math.floor(t * fps());
    let n = 0, cambio = false;
    dec.saltarB = objetivo - cuadrosDec > 3;
    while (cuadrosDec <= objetivo && n < 8) {
      if (!dec.hasSequenceHeader || !hayImagenCompleta(dec.bits, leidoTodo && !colaVideo.length)) {
        alimentar();
        if (!dec.hasSequenceHeader || !hayImagenCompleta(dec.bits, leidoTodo && !colaVideo.length)) break;
      }
      let ok = dec.decode();
      if (!ok) ok = dec.decode();
      if (!ok) break;
      cuadrosDec++;
      n++;
      cambio = true;
    }
    if (leidoTodo && !colaVideo.length && !hayImagenCompleta(dec.bits, true)) {
      if (!finVideo) {
        finVideo = true;
        dec.vaciar();
        cambio = true;
      }
      const durAudio = muestrasAudio / audioDec.tasa;
      if (reloj() >= durAudio - .05 || !actx) terminado = true;
    }
    alAvanzar?.({
      t: reloj(),
      cuadros: cuadrosDec,
      leidos: leidos,
      total: total
    });
    return cambio;
  }
  function parar() {
    cancelado = true;
    terminado = true;
    try {
      lector.cancel();
    } catch {}
    for (const s of fuentes.splice(0)) {
      try {
        s.stop();
      } catch {}
    }
    if (ganancia) {
      try {
        ganancia.disconnect();
      } catch {}
    }
  }
  async function decodificarHasta(nMostrados) {
    while (salida.destino.cuadros < nMostrados) {
      alimentar();
      if (dec.hasSequenceHeader && hayImagenCompleta(dec.bits, leidoTodo && !colaVideo.length)) {
        if (!dec.decode()) dec.decode();
        cuadrosDec++;
        continue;
      }
      if (leidoTodo && !colaVideo.length) break;
      t0Audio = null;
      await new Promise(r => setTimeout(r, 5));
    }
    return {
      y: salida.material.uniforms.tY.value.image.data,
      ancho: salida.ancho,
      alto: salida.alto,
      mostrados: salida.destino.cuadros,
      decodificados: cuadrosDec
    };
  }
  return {
    decodificarHasta: decodificarHasta,
    get descartados() {
      return dec.descartados || 0;
    },
    material: salida.material,
    get aspecto() {
      return salida.ancho ? salida.ancho / salida.alto : 4 / 3;
    },
    actualizar: actualizar,
    parar: parar,
    get terminado() {
      return terminado;
    },
    get tiempo() {
      return reloj();
    },
    get cuadros() {
      return cuadrosDec;
    },
    get mostrados() {
      return salida.destino.cuadros;
    },
    set volumen(v) {
      if (ganancia) ganancia.gain.value = v;
    }
  };
}
