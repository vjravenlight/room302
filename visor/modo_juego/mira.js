// SH4 web — FeniXVOID · Project Ravenlight
import * as THREE from "three";

const ROJO = 12592666, CLARO = 15524818;

export function crearMira({M: M, juego: juego, fuente: fuente, tactil: tactil = false}) {
  const modo = () => juego.opciones?.apuntar || "completa";
  const en = () => juego.IDIOMA !== "s";
  const matPunto = new THREE.MeshBasicMaterial({
    color: CLARO,
    transparent: true,
    opacity: .45,
    depthTest: false,
    depthWrite: false,
    toneMapped: false
  });
  const punto = new THREE.Mesh(new THREE.CircleGeometry(1, 20), matPunto);
  const anillo = new THREE.Mesh(new THREE.RingGeometry(1.6, 2.2, 28), new THREE.MeshBasicMaterial({
    color: ROJO,
    transparent: true,
    opacity: .85,
    depthTest: false,
    depthWrite: false,
    toneMapped: false
  }));
  const mira = new THREE.Group;
  mira.add(punto, anillo);
  mira.name = "mira";
  for (const o of [ punto, anillo ]) {
    o.renderOrder = 78;
    o.frustumCulled = false;
  }
  mira.visible = false;
  anillo.visible = false;
  M.camara.add(mira);
  const lz = document.createElement("canvas");
  lz.width = 768;
  lz.height = 72;
  const g = lz.getContext("2d");
  const tx = new THREE.CanvasTexture(lz);
  tx.colorSpace = THREE.SRGBColorSpace;
  tx.minFilter = THREE.LinearFilter;
  tx.generateMipmaps = false;
  const cartel = new THREE.Mesh(new THREE.PlaneGeometry(768 / 72, 1), new THREE.MeshBasicMaterial({
    map: tx,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    toneMapped: false
  }));
  cartel.renderOrder = 79;
  cartel.frustumCulled = false;
  cartel.visible = false;
  M.camara.add(cartel);
  let dom = null;
  if (tactil) {
    dom = document.createElement("canvas");
    dom.width = lz.width;
    dom.height = lz.height;
    dom.id = "textoMira";
    dom.style.cssText = "position:fixed;z-index:31;pointer-events:none;height:30px;width:auto;display:none";
    document.body.appendChild(dom);
  }
  let textoActual = null;
  function escribir(t) {
    if (t === textoActual) return;
    textoActual = t;
    g.clearRect(0, 0, lz.width, lz.height);
    if (t) {
      const w = Math.min(lz.width, (fuente?.anchoLinea?.(t) || t.length * 9) * 2 + 48);
      g.fillStyle = "rgba(4,3,3,0.55)";
      g.fillRect((lz.width - w) / 2, 8, w, 56);
      if (fuente?.escribir) fuente.escribir(g, t, lz.width / 4, 13, {
        escala: 2,
        alinear: "centro",
        color: "#ece3d2"
      }); else {
        g.font = "32px Georgia,serif";
        g.fillStyle = "#ece3d2";
        g.textAlign = "center";
        g.fillText(t, lz.width / 2, 48);
      }
    }
    tx.needsUpdate = true;
    if (dom) {
      const d = dom.getContext("2d");
      d.clearRect(0, 0, dom.width, dom.height);
      d.drawImage(lz, 0, 0);
    }
  }
  const matLinea = new THREE.LineBasicMaterial({
    color: ROJO,
    transparent: true,
    opacity: .8,
    depthTest: false,
    depthWrite: false,
    toneMapped: false
  });
  const lineas = new THREE.LineSegments(new THREE.BufferGeometry, matLinea);
  lineas.renderOrder = 77;
  lineas.frustumCulled = false;
  lineas.visible = false;
  const brillo = new THREE.Mesh(new THREE.RingGeometry(.62, 1, 24), new THREE.MeshBasicMaterial({
    color: ROJO,
    transparent: true,
    opacity: .6,
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
    side: THREE.DoubleSide
  }));
  brillo.renderOrder = 77;
  brillo.visible = false;
  const camPos = new THREE.Vector3;
  M.escena.add(lineas, brillo);
  function contorno(caja) {
    const a = caja.min, b = caja.max, p = [];
    const v = (x, y, z) => p.push(x, y, z);
    const X = [ a.x, b.x ], Y = [ a.y, b.y ], Z = [ a.z, b.z ];
    for (const y of Y) for (const z of Z) {
      v(a.x, y, z);
      v(b.x, y, z);
    }
    for (const x of X) for (const z of Z) {
      v(x, a.y, z);
      v(x, b.y, z);
    }
    for (const x of X) for (const y of Y) {
      v(x, y, a.z);
      v(x, y, b.z);
    }
    const geo = new THREE.BufferGeometry;
    geo.setAttribute("position", new THREE.Float32BufferAttribute(p, 3));
    lineas.geometry.dispose();
    lineas.geometry = geo;
  }
  let claveResalte = null;
  function textoDe(a, info) {
    if (!a) return null;
    if (a.tipo === "puerta") {
      const s = info.nombreSala?.(a.puerta.lleva_a_escena);
      return (en() ? "Open" : "Abrir") + (s ? ": " + s : "");
    }
    const k = info.itemDe?.(a.p.e);
    if (k != null) {
      const n = info.nombreItem?.(k, a.p.e);
      return (en() ? "Take" : "Agarrar") + (n ? ": " + n : "");
    }
    return en() ? "Examine" : "Examinar";
  }
  let t = 0;
  function actualizar(dt, a, info = {}, activo = true) {
    t += dt;
    const m = activo ? modo() : "nada";
    const vr = M.enVR();
    const antes = mira.visible + ":" + anillo.visible + ":" + cartel.visible + ":" + lineas.visible + ":" + brillo.visible + ":" + textoActual;
    mira.visible = m !== "nada" && !(vr && M.control.rayos()[0]?.fuente === "control");
    if (mira.visible) {
      const d = vr ? 1.4 : 1, s = (vr ? .0035 : .0028) * d;
      mira.position.set(0, 0, -d);
      mira.scale.setScalar(a ? s * 1.6 : s);
      matPunto.color.setHex(a && m === "completa" ? ROJO : CLARO);
      matPunto.opacity = a ? .9 : .45;
      anillo.visible = !!a && m === "completa";
    }
    const completa = m === "completa" && !!a;
    const txt = completa ? textoDe(a, info) : null;
    escribir(txt);
    cartel.visible = !!txt && !tactil;
    if (cartel.visible) {
      const d = vr ? 1.4 : 1, alto = (vr ? .1 : .085) * d;
      cartel.scale.setScalar(alto);
      cartel.position.set(0, -(vr ? .12 : .085) * d, -d);
    }
    if (dom) {
      dom.style.display = txt ? "" : "none";
      const b = document.getElementById("botonesTactil")?.getBoundingClientRect();
      const w = 30 * lz.width / lz.height;
      if (b && txt) {
        dom.style.left = Math.round(Math.max(4, Math.min(innerWidth - w - 4, b.left + b.width / 2 - w / 2))) + "px";
        dom.style.top = Math.max(4, b.top - 40) + "px";
      } else if (txt) {
        dom.style.left = "50%";
        dom.style.transform = "translateX(-50%)";
        dom.style.bottom = "30vh";
      }
    }
    let clave = null, caja = null, pos = null;
    if (completa) {
      if (a.tipo === "puerta") {
        clave = "p" + a.puerta.door_no;
        caja = (a.puerta.rect || a.puerta.caja).clone().expandByScalar(.02);
      } else if (a.p.caja && !a.p.caja.isEmpty()) {
        clave = "c" + a.p.e.escena + "/" + a.p.e.indice;
        caja = a.p.caja.clone().expandByScalar(.03);
      } else {
        clave = "b" + a.p.e.escena + "/" + a.p.e.indice;
        pos = a.p.pos;
      }
    }
    if (clave !== claveResalte) {
      claveResalte = clave;
      lineas.visible = !!caja;
      brillo.visible = !!pos;
      if (caja) contorno(caja);
      if (pos) brillo.position.copy(pos);
    }
    const pulso = .55 + .3 * Math.sin(t * 5);
    if (lineas.visible) matLinea.opacity = pulso;
    if (brillo.visible) {
      M.camara.getWorldPosition(camPos);
      const r = Math.max(.004, brillo.position.distanceTo(camPos) * .009);
      brillo.material.opacity = pulso * .8;
      brillo.scale.setScalar(r * (1 + .15 * Math.sin(t * 5)));
      brillo.lookAt(camPos);
    }
    const despues = mira.visible + ":" + anillo.visible + ":" + cartel.visible + ":" + lineas.visible + ":" + brillo.visible + ":" + textoActual;
    return antes !== despues || lineas.visible || brillo.visible;
  }
  function ocultar() {
    return actualizar(0, null, {}, false);
  }
  return {
    actualizar: actualizar,
    ocultar: ocultar,
    get texto() {
      return textoActual;
    }
  };
}
