// SH4 web — FeniXVOID · Project Ravenlight
import { iniciarCamaraJuego } from "../camara_juego.js";

const DIST = 2.8, ANCHO = 3;

const RT_W = 1280, RT_H = 960;

export function crearCascoCine({THREE: THREE, renderer: renderer, escena: escena, camara: camara, henry: henry, getColision: getColision = () => null, escala: escala = .005, ojos: ojos = 1.6, capa: capa = 9}) {
  let activo = false, aplicado = false, pendiente = false, mascaraAntes = 1, sala = null;
  const raiz = new THREE.Group;
  raiz.name = "cámara de cine (casco)";
  const camCine = new THREE.PerspectiveCamera(50, 4 / 3, .05, 400);
  camCine.rotation.order = "YXZ";
  raiz.add(camCine);
  const henryProxy = {
    get personaje() {
      return henry.personaje;
    },
    modo: "3ra"
  };
  const falsoR = {
    xr: {
      isPresenting: false
    }
  };
  const cj = iniciarCamaraJuego({
    THREE: THREE,
    camara: camCine,
    jugador: raiz,
    henry: henryProxy,
    getColision: getColision,
    escala: escala,
    ojos: ojos,
    renderer: falsoR
  });
  cj.activar(true);
  const rt = new THREE.WebGLRenderTarget(RT_W, RT_H, {
    depthBuffer: true
  });
  rt.texture.colorSpace = THREE.SRGBColorSpace;
  const salaCine = new THREE.Group;
  salaCine.name = "sala de cine (casco)";
  salaCine.visible = false;
  const pantalla = new THREE.Mesh(new THREE.PlaneGeometry(ANCHO, ANCHO * 3 / 4), new THREE.MeshBasicMaterial({
    map: rt.texture,
    fog: false,
    toneMapped: true
  }));
  pantalla.name = "pantalla de cine";
  const marco = new THREE.Mesh(new THREE.PlaneGeometry(ANCHO + .08, ANCHO * 3 / 4 + .08), new THREE.MeshBasicMaterial({
    color: 1182730,
    fog: false
  }));
  marco.position.z = -.01;
  const soporte = new THREE.Group;
  soporte.add(pantalla, marco);
  salaCine.add(soporte);
  const lp = document.createElement("canvas");
  lp.width = lp.height = 256;
  {
    const g = lp.getContext("2d"), gr = g.createRadialGradient(128, 128, 8, 128, 128, 128);
    gr.addColorStop(0, "rgba(60,40,34,0.55)");
    gr.addColorStop(.6, "rgba(30,20,18,0.35)");
    gr.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, 256, 256);
  }
  const texPiso = new THREE.CanvasTexture(lp);
  texPiso.colorSpace = THREE.SRGBColorSpace;
  const piso = new THREE.Mesh(new THREE.CircleGeometry(3.2, 48), new THREE.MeshBasicMaterial({
    map: texPiso,
    transparent: true,
    depthWrite: false,
    fog: false
  }));
  piso.rotation.x = -Math.PI / 2;
  piso.position.y = .002;
  salaCine.add(piso);
  salaCine.traverse(o => {
    o.layers.set(capa);
    o.frustumCulled = false;
  });
  const _p = new THREE.Vector3, _e = new THREE.Euler(0, 0, 0, "YXZ");
  function recentrar() {
    const rig = camara.parent;
    if (!rig) return;
    if (salaCine.parent !== rig) rig.add(salaCine);
    _p.copy(camara.position);
    _e.setFromQuaternion(camara.quaternion, "YXZ");
    const yaw = _e.y;
    soporte.position.set(_p.x - Math.sin(yaw) * DIST, Math.max(1.2, _p.y), _p.z - Math.cos(yaw) * DIST);
    soporte.rotation.set(0, yaw, 0);
    piso.position.set(_p.x, .002, _p.z);
  }
  const esMenu = o => o.name === "pantalla" || o.isMesh && o.renderOrder === 40 && o.material?.side === THREE.BackSide && o.geometry?.type === "SphereGeometry";
  function aplicarCapas() {
    if (!aplicado) {
      mascaraAntes = camara.layers.mask;
      aplicado = true;
    }
    camara.layers.set(capa);
    (camara.parent || camara).traverse(o => o.layers.enable(capa));
    for (const o of escena.children) if (esMenu(o)) o.traverse(x => x.layers.enable(capa));
    salaCine.visible = true;
  }
  function quitarCapas() {
    if (!aplicado) return;
    camara.layers.mask = mascaraAntes;
    aplicado = false;
    salaCine.visible = false;
  }
  const renderOriginal = renderer.render;
  const ocultos = [];
  renderer.render = function(s, c) {
    if (s === escena && renderer.xr.isPresenting) {
      if (pendiente && activo) {
        pendiente = false;
        const xrAntes = renderer.xr.enabled, rtAntes = renderer.getRenderTarget();
        ocultos.length = 0;
        const rig = camara.parent;
        if (rig?.visible) {
          rig.visible = false;
          ocultos.push(rig);
        }
        for (const o of escena.children) if (o.visible && esMenu(o)) {
          o.visible = false;
          ocultos.push(o);
        }
        raiz.updateMatrixWorld(true);
        renderer.xr.enabled = false;
        try {
          renderer.setRenderTarget(rt);
          renderer.clear();
          renderOriginal.call(this, s, camCine);
        } finally {
          renderer.setRenderTarget(rtAntes);
          renderer.xr.enabled = xrAntes;
          for (const o of ocultos) o.visible = true;
        }
      } else quitarCapas();
    }
    return renderOriginal.call(this, s, c);
  };
  const fC = new THREE.Vector3, rC = new THREE.Vector3, fH = new THREE.Vector3, rH = new THREE.Vector3, ARRIBA = new THREE.Vector3(0, 1, 0);
  function convertir(dir, out = new THREE.Vector3) {
    camara.getWorldDirection(fH);
    fH.y = 0;
    if (fH.lengthSq() < 1e-6) fH.set(0, 0, -1);
    fH.normalize();
    rH.crossVectors(fH, ARRIBA).normalize();
    const a = dir.x * fH.x + dir.z * fH.z, b = dir.x * rH.x + dir.z * rH.z;
    cj.adelanteControl(fC);
    fC.y = 0;
    if (fC.lengthSq() < 1e-6) fC.set(0, 0, -1);
    fC.normalize();
    rC.crossVectors(fC, ARRIBA).normalize();
    out.copy(fC).multiplyScalar(a).addScaledVector(rC, b);
    return out.lengthSq() > 1e-9 ? out.normalize() : out;
  }
  function poner(si) {
    activo = !!si;
    if (activo) {
      recentrar();
      if (sala) cj.alCargarSala(sala);
    } else {
      quitarCapas();
      if (window.sh4?.oyenteCasco === camCine) window.sh4.oyenteCasco = null;
    }
    return activo;
  }
  function actualizar(dt, enVR) {
    if (!activo || !enVR) {
      if (aplicado && !enVR) quitarCapas();
      return false;
    }
    const s = window.sh4?.camaraJuego?.estado?.sala;
    if (s && s !== sala) {
      sala = s;
      cj.alCargarSala(s);
    }
    if (salaCine.parent !== camara.parent) recentrar();
    cj.actualizar(dt);
    aplicarCapas();
    pendiente = true;
    if (window.sh4) window.sh4.oyenteCasco = camCine;
    return true;
  }
  return {
    actualizar: actualizar,
    poner: poner,
    recentrar: recentrar,
    convertir: convertir,
    alternar() {
      return poner(!activo);
    },
    get activo() {
      return activo;
    },
    get cine() {
      return activo && !!renderer.xr?.isPresenting;
    },
    adelanteControl(out = new THREE.Vector3) {
      return cj.adelanteControl(out);
    },
    camara: camCine,
    pantalla: pantalla,
    salaCine: salaCine,
    rt: rt,
    get estado() {
      return {
        activo: activo,
        aplicado: aplicado,
        sala: sala,
        mascara: camara.layers.mask,
        camara: cj.estado
      };
    }
  };
}
