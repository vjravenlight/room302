// SH4 web — FeniXVOID · Project Ravenlight
import { PARTE_COMUN } from "./lib/subtitulos.js";

export const IDIOMAS = [ {
  id: "s",
  nombre: "Español",
  msg: 56
}, {
  id: "e",
  nombre: "English (US)",
  msg: 57,
  extra: " (US)"
}, {
  id: "b",
  nombre: "English (UK)",
  msg: 57,
  extra: " (UK)"
}, {
  id: "f",
  nombre: "Français",
  msg: 56
}, {
  id: "g",
  nombre: "Deutsch",
  msg: 56
}, {
  id: "i",
  nombre: "Italiano",
  msg: 56
}, {
  id: "j",
  nombre: null,
  msg: null
}, {
  id: "k",
  nombre: "한국어",
  msg: 56
} ];

export const IDS_IDIOMAS = IDIOMAS.map(x => x.id);

const ALIAS = {
  es: "s",
  en: "e",
  us: "e",
  uk: "b",
  gb: "b",
  fr: "f",
  de: "g",
  it: "i",
  ja: "j",
  jp: "j",
  ko: "k",
  kr: "k"
};

export const idiomaValido = id => IDS_IDIOMAS.includes(id) ? id : ALIAS[String(id || "").toLowerCase()] || null;

export { PARTE_COMUN };

const CLAVE = "sh4opciones";

function guardado() {
  try {
    return idiomaValido(JSON.parse(localStorage.getItem(CLAVE) || "{}")?.idioma) || "s";
  } catch {
    return "s";
  }
}

function deLaDireccion() {
  try {
    return idiomaValido(new URLSearchParams(location.search).get("idioma"));
  } catch {
    return null;
  }
}

let actual = deLaDireccion() || guardado();

function japonesDom() {
  if (actual === "j" && typeof document !== "undefined") import("./lib/japones_dom.js").then(m => m.activarJaponesDom()).catch(() => {});
}

japonesDom();

export const idiomaActual = () => actual;

export const sitioIngles = () => actual !== "s";

export function fijarIdioma(id) {
  id = idiomaValido(id) || "s";
  try {
    const o = JSON.parse(localStorage.getItem(CLAVE) || "{}") || {};
    o.idioma = id;
    localStorage.setItem(CLAVE, JSON.stringify(o));
  } catch {}
  try {
    const u = new URL(location.href);
    if (u.searchParams.has("idioma")) {
      u.searchParams.delete("idioma");
      history.replaceState(history.state, "", u.pathname + u.search + u.hash);
    }
  } catch {}
  if (id === actual) return;
  actual = id;
  japonesDom();
  try {
    window.dispatchEvent(new CustomEvent("sh4idioma", {
      detail: id
    }));
  } catch {}
}

try {
  addEventListener("storage", e => {
    if (e.key !== CLAVE || deLaDireccion()) return;
    const id = guardado();
    if (id !== actual) {
      actual = id;
      japonesDom();
      try {
        window.dispatchEvent(new CustomEvent("sh4idioma", {
          detail: id
        }));
      } catch {}
    }
  });
} catch {}

export function nombreIdioma(id, textoDe = null) {
  const d = IDIOMAS.find(x => x.id === id);
  if (!d) return id;
  if (!d.nombre) return t("idioma." + id);
  const delJuego = d.msg != null && textoDe ? textoDe(PARTE_COMUN[id], d.msg) : "";
  return delJuego ? delJuego + (d.extra || "") : d.nombre;
}

const T = {
  idioma: [ "Idioma", "Language" ],
  "idioma.j": [ "Japonés", "Japanese" ],
  "idioma.ay": [ "Textos del juego: menús, mensajes, memos y subtítulos.", "Game texts: menus, messages, memos and subtitles." ],
  "idioma.ay.j": [ "Textos del juego en japonés.\nLa interfaz del sitio va en inglés.", "Game texts in Japanese.\nThe site interface stays in English." ],
  "idioma.ay.otro": [ "{0}\nLa interfaz del sitio va en inglés.", "{0}\nThe site interface stays in English." ],
  "idioma.ay.partida": [ "Lo de la partida cambia del todo al volver al título.", "In-game texts fully change after returning to the title." ],
  "op.titulo": [ "Opciones", "Options" ],
  "op.juego": [ "Juego", "Game" ],
  "op.porDefecto": [ "Por defecto", "Default" ],
  "op.porDefecto.ay": [ "Vuelve todo a como venía.", "Resets everything." ],
  "op.salir": [ "Salir", "Exit" ],
  "op.volver": [ "Volver", "Back" ],
  "op.si": [ "Sí", "Yes" ],
  "op.no": [ "No", "No" ],
  "op.brillo": [ "Brillo", "Brightness" ],
  "op.subtitulos": [ "Subtítulos", "Subtitles" ],
  "op.volMus": [ "Volumen de la música", "Music volume" ],
  "op.volEfe": [ "Volumen de los efectos", "Effects volume" ],
  "op.sangre": [ "Color de la sangre", "Blood color" ],
  "op.sangre.v.0": [ "Rojo", "Red" ],
  "op.sangre.v.1": [ "Verde", "Green" ],
  "op.sangre.v.2": [ "Morado", "Purple" ],
  "op.ruido": [ "Ruido", "Noise" ],
  "op.henryVR": [ "Henry en escenas", "Henry in scenes" ],
  "op.henryVR.ay": [ "En el casco: ver a Henry en las cinemáticas.\nApagado, Henry sos vos.", "In the headset: see Henry in the cutscenes.\nOff: you are Henry." ],
  "op.henryVR.ay2": [ "Ver a Henry en las cinemáticas.\nApagado, Henry sos vos.", "See Henry in the cutscenes.\nOff: you are Henry." ],
  "op.vistaCineVR": [ "Cámara de escena", "Scene camera" ],
  "op.vistaCineVR.ay": [ "En el casco: la vista sigue sola a la cámara\nde la escena cuando mira muy arriba o abajo.", "In the headset: the view follows the scene camera\nwhen it looks far up or down." ],
  "op.vistaCineVR.ay2": [ "La vista sigue sola a la cámara de la escena\ncuando mira muy arriba o abajo.", "The view follows the scene camera\nwhen it looks far up or down." ],
  "op.cine1ra": [ "Cinemáticas", "Cutscenes" ],
  "op.cine1ra.v.false": [ "Cinemática", "Cutscene" ],
  "op.cine1ra.v.true": [ "Ojos de Henry", "Henry's eyes" ],
  "op.cine1ra.ay": [ "Cinemática: la cámara del juego, como el original.\nOjos de Henry: desde sus ojos (también en el casco).", "Cutscene: the game camera, as in the original.\nHenry's eyes: through his eyes (also in the headset)." ],
  "op.niebla": [ "Niebla", "Fog" ],
  "op.niebla.ay": [ "5 = como el juego. 0 = sin niebla, 10 = el doble.", "5 = as in the game. 0 = no fog, 10 = double." ],
  "op.brilloPersonajes": [ "Brillo de los personajes", "Character brightness" ],
  "op.brilloPersonajes.ay": [ "Luz sobre Henry y los monstruos.\n5 = como el juego.", "Light on Henry and the monsters.\n5 = as in the game." ],
  "op.sombrasPersonajes": [ "Sombras de los personajes", "Character shadows" ],
  "op.sombrasPersonajes.v.siempre": [ "Siempre", "Always" ],
  "op.sombrasPersonajes.v.juego": [ "Como el juego", "As the game" ],
  "op.sombrasPersonajes.v.no": [ "No", "Off" ],
  "op.sombrasPersonajes.ay": [ "La sombra de Henry y los demás con la luz de la sala.\nComo el juego: solo donde el PC la dibuja con la opción apagada.", "Shadow of Henry and the others from the room light.\nAs the game: only where the PC draws it with the option off." ],
  "op.apuntar": [ "Ayuda para apuntar", "Aiming help" ],
  "op.apuntar.v.completa": [ "Completa", "Full" ],
  "op.apuntar.v.mira": [ "Solo mira", "Dot only" ],
  "op.apuntar.v.nada": [ "Nada", "Off" ],
  "op.apuntar.ay": [ "Un punto en el centro de la vista; completa: se pone\nrojo y dice qué va a hacer Acción.", "A dot in the middle of the view; full: it turns red\nand says what Action will do." ],
  "op.calidad": [ "Calidad de imagen", "Image quality" ],
  "op.calidad.v.baja": [ "Baja", "Low" ],
  "op.calidad.v.media": [ "Media", "Medium" ],
  "op.calidad.v.alta": [ "Alta", "High" ],
  "op.calidad.ay": [ "Baja: más rápido en PCs lentas.\nAlta: resolución completa y sombras.", "Low: faster on slow PCs.\nHigh: full resolution and shadows." ],
  "op.calidadTactil.ay": [ "Baja ahorra batería y anda más fluido.", "Low saves battery and runs smoother." ],
  "op.mouseSens": [ "Sensibilidad del mouse", "Mouse sensitivity" ],
  "op.mouseSens.ay": [ "Qué tan rápido gira la vista con el mouse.", "How fast the view turns with the mouse." ],
  "op.mouseInvertir": [ "Invertir el mouse", "Invert mouse" ],
  "op.mouseInvertir.ay": [ "Mouse para arriba = mirar para abajo.", "Mouse up = look down." ],
  "op.vista": [ "Cámara", "Camera" ],
  "op.vistaMundos": [ "Cámara en los mundos", "Camera (worlds)" ],
  "op.vista.v.1ra": [ "1ra persona", "1st person" ],
  "op.vista.v.3ra": [ "3ra persona", "3rd person" ],
  "op.vista.ay": [ "3ra persona: la cámara del juego, viendo a Henry.\n1ra persona: desde sus ojos.", "3rd person: the game camera, looking at Henry.\n1st person: through his eyes." ],
  "op.vistaMundos.ay": [ "3ra persona: las cámaras del juego.\n1ra persona: desde los ojos de Henry (V o VISTA).", "3rd person: the game cameras.\n1st person: through Henry's eyes (V or VIEW)." ],
  "op.camara": [ "Ajustes de cámara", "Camera settings" ],
  "op.camara.ay": [ "Tipo de cámara, suavizado, velocidad de giro\ny distancia (3ra persona).", "Camera type, smoothing, turning speed\nand distance (3rd person)." ],
  "op.casco": [ "Casco VR", "VR headset" ],
  "op.casco.ay": [ "Giro, viñeta, postura y mano dominante\ndel casco (Meta Quest).", "Turning, vignette, posture and dominant hand\nfor the headset (Meta Quest)." ],
  "op.camTipo": [ "Tipo de cámara", "Camera type" ],
  "op.camTipo.v.juego": [ "Del juego", "Game" ],
  "op.camTipo.v.hombro": [ "Detrás del hombro", "Over the shoulder" ],
  "op.camTipo.v.libre": [ "Libre", "Free" ],
  "op.camTipo.ay.juego": [ "Las cámaras fijas y de riel del juego original.", "The fixed and rail cameras of the original game." ],
  "op.camTipo.ay.hombro": [ "Detrás de Henry, lo sigue cuando camina.\nMouse, palito derecho o dedo para girarla.", "Behind Henry, follows him as he walks.\nMouse, right stick or finger to turn it." ],
  "op.camTipo.ay.libre": [ "Gira solo con el mouse, el palito derecho\no el dedo, alrededor de Henry.", "Turns only with the mouse, the right stick\nor a finger, around Henry." ],
  "op.camSuavizado": [ "Suavizado de cámara", "Camera smoothing" ],
  "op.camSuavizado.ay": [ "0 = sin suavizar (como el juego).\n10 = la cámara sigue muy suave.", "0 = no smoothing (as in the game).\n10 = very smooth." ],
  "op.camGiro": [ "Velocidad de giro", "Turning speed" ],
  "op.camGiro.ay": [ "Qué tan rápido gira la cámara (hombro y libre).\nHombro: 0 = no vuelve sola atrás de Henry.", "How fast the camera turns (shoulder and free).\nShoulder: 0 = it does not swing back on its own." ],
  "op.camDistancia": [ "Distancia de cámara", "Camera distance" ],
  "op.camDistancia.ay": [ "Qué tan lejos de Henry va la cámara\n(hombro y libre). 5 = 2,5 m.", "How far from Henry the camera goes\n(shoulder and free). 5 = 2.5 m." ],
  "op.botones": [ "Tamaño de los botones", "Button size" ],
  "op.botones.v.chicos": [ "Chicos", "Small" ],
  "op.botones.v.medianos": [ "Medianos", "Medium" ],
  "op.botones.v.grandes": [ "Grandes", "Large" ],
  "op.botones.ay": [ "El tamaño del joystick y los botones en pantalla.", "The size of the on-screen joystick and buttons." ],
  "op.joystick": [ "Lado del joystick", "Joystick side" ],
  "op.joystick.v.izq": [ "Izquierda", "Left" ],
  "op.joystick.v.der": [ "Derecha", "Right" ],
  "op.joystick.ay": [ "De qué lado va el joystick para caminar.\nLos botones van del otro.", "Which side the walking joystick goes on.\nThe buttons go on the other side." ],
  "op.vibracion": [ "Vibración", "Vibration" ],
  "op.vibracion.ay": [ "Vibrar al tocar los botones y con los golpes.", "Vibrate when touching the buttons and on hits." ],
  "op.giroVR": [ "Giro", "Turning" ],
  "op.giroVR.v.saltos": [ "A saltos", "Snap" ],
  "op.giroVR.v.suave": [ "Suave", "Smooth" ],
  "op.giroVR.ay": [ "A saltos marea menos. Suave gira de corrido.", "Snap turning is easier on the stomach.\nSmooth turns continuously." ],
  "op.vinetaVR": [ "Viñeta al moverse", "Vignette when moving" ],
  "op.vinetaVR.v.1": [ "Suave", "Soft" ],
  "op.vinetaVR.v.2": [ "Fuerte", "Strong" ],
  "op.vinetaVR.ay": [ "Oscurece los bordes mientras caminás:\nayuda a no marearse.", "Darkens the edges while you move:\nhelps against motion sickness." ],
  "op.posturaVR": [ "Postura", "Posture" ],
  "op.posturaVR.v.parado": [ "Parado", "Standing" ],
  "op.posturaVR.v.sentado": [ "Sentado", "Seated" ],
  "op.posturaVR.ay": [ "Sentado: sube la vista a la altura de Henry.", "Seated: raises the view to Henry's eye height." ],
  "op.manoVR": [ "Mano dominante", "Dominant hand" ],
  "op.manoVR.v.der": [ "Derecha", "Right" ],
  "op.manoVR.v.izq": [ "Izquierda", "Left" ],
  "op.manoVR.ay": [ "La mano del rayo y del arma.\nLa otra camina.", "The hand for the pointer and the weapon.\nThe other one walks." ],
  "op.cuerpoVR": [ "Cuerpo de Henry", "Henry's body" ],
  "op.escalaVR": [ "Escala", "Scale" ],
  "op.ajustarCuerpo": [ "Ajustar cuerpo", "Adjust body" ],
  "op.ajustarCuerpo.ay": [ "En el casco: parado o sentado, tu altura," + String.fromCharCode(10) + "la escala y cómo ver las cinemáticas.", "In the headset: standing or seated, your height," + String.fromCharCode(10) + "the scale and how to watch cutscenes." ],
  "op.cineVR": [ "Cinemáticas (casco)", "Cutscenes (headset)" ],
  "op.cineVR.v.pantalla": [ "Pantalla de cine", "Cinema screen" ],
  "op.cineVR.v.adentro": [ "Adentro", "Inside" ],
  "op.cineVR.v.ojos": [ "Ojos de Henry", "Henry's eyes" ],
  "op.cineVR.ay": [ "Pantalla delante tuyo, adentro con la cámara de la" + String.fromCharCode(10) + "escena, u ojos de Henry (vale también sin casco).", "A screen in front of you, inside with the scene camera," + String.fromCharCode(10) + "or Henry's eyes (also without the headset)." ],
  "op.escalaVR.v.propia": [ "A mi altura", "My height" ],
  "op.escalaVR.v.henry": [ "Ser Henry", "Be Henry" ],
  "op.escalaVR.ay": [ "Parado: el mundo a tu altura de verdad,\no los ojos a la altura de los de Henry.", "Standing: the world at your real height,\nor your eyes at Henry's eye height." ],
  "op.cuerpoVR.ay": [ "Ver las manos, el cuerpo y las piernas de Henry.\nApagado, unas manos simples.", "See Henry's hands, body and legs.\nOff: simple hands." ],
  "op.mejoradoQuest": [ "Mejorado Quest", "Quest enhanced" ],
  "op.mejoradoQuest.ay": [ "Luces, sombras y texturas mejoradas\n(pide un Quest 3).", "Better lights, shadows and textures\n(needs a Quest 3)." ],
  "op.uso": [ "Uso", "Device" ],
  "op.uso.auto": [ "Auto: {0}", "Auto: {0}" ],
  "op.uso.ay": [ "Se detecta solo. Cambialo para ver las opciones\nde otro aparato.", "Detected automatically. Change it to see\nthe options for another device." ],
  "uso.auto": [ "Automático", "Automatic" ],
  "uso.escritorio": [ "Escritorio", "Desktop" ],
  "uso.movil": [ "Celular", "Phone" ],
  "uso.tabletV": [ "Tablet vertical", "Tablet (portrait)" ],
  "uso.tabletH": [ "Tablet horizontal", "Tablet (landscape)" ],
  "uso.vr": [ "Casco VR", "VR headset" ],
  "op.teclas": [ "↑ ↓ elegir · ← → cambiar · Enter aceptar · Esc volver · joystick: cruz, A y B", "↑ ↓ choose · ← → change · Enter accept · Esc back · gamepad: d-pad, A and B" ],
  "op.teclasCasco": [ "Palito: elegir y cambiar · Gatillo / pellizco: aceptar · B: volver", "Stick: choose and change · Trigger / pinch: accept · B: back" ],
  "juego.tocar": [ "Tocá la pantalla para empezar", "Tap the screen to start" ],
  "juego.clic": [ "Hacé clic o apretá Enter para empezar", "Click or press Enter to start" ],
  "juego.casco": [ '(en el casco: botón "ENTER VR" y después el gatillo)', '(headset: "ENTER VR", then the trigger)' ],
  "juego.capitulo": [ "Elegir capítulo", "Choose chapter" ],
  "juego.salir": [ "Para salir, cerrá la pestaña.", "Close the tab to quit." ],
  "juego.cargando": [ "cargando…", "loading…" ],
  "juego.ayuda": [ "Flechas / WASD: moverse y elegir · Enter: aceptar · Esc: volver/saltar · E: examinar · mouse: mirar (clic para capturar) · en el casco: palito izquierdo camina, derecho gira, gatillo examina, A acepta, B vuelve · C o F2: modo foto (también en la pausa; en el casco, los dos palitos apretados)", "Arrows / WASD: move and choose · Enter: accept · Esc: back/skip · E: examine · mouse: look (click to capture) · headset: left stick walks, right stick turns, trigger examines, A accepts, B goes back · C or F2: photo mode (also in the pause menu; headset: press both sticks)" ],
  "juego.suite": [ "Suite", "Suite" ],
  "casco.ayuda": [ "Mira o palito: elegir    Gatillo / pellizco / A: {0}    B: {1}", "Aim or stick: choose    Trigger / pinch / A: {0}    B: {1}" ],
  decidir: [ "Decidir", "Select" ],
  volver: [ "Volver", "Back" ],
  "boton.correr": [ "CORRER", "RUN" ],
  "boton.accion": [ "EXAMINAR", "EXAMINE" ],
  "boton.cancelar": [ "VOLVER", "BACK" ],
  "boton.aceptar": [ "OK", "OK" ],
  "boton.menu": [ "MENÚ", "MENU" ],
  "boton.arma": [ "ARMA", "AIM" ],
  "boton.golpe": [ "GOLPE", "ATTACK" ],
  "boton.paso": [ "PASO", "STEP" ],
  "boton.inv": [ "INV", "ITEMS" ],
  "boton.vista": [ "VISTA", "VIEW" ],
  "boton.puerta": [ "PUERTA", "DOOR" ],
  "boton.piso": [ "PISO", "FLOOR" ],
  "boton.foto": [ "FOTO", "PHOTO" ],
  "foto.menu": [ "Modo foto", "Photo mode" ],
  "foto.titulo": [ "MODO FOTO", "PHOTO MODE" ],
  "foto.foto": [ "FOTO", "PHOTO" ],
  "foto.360": [ "FOTO 360°", "360° PHOTO" ],
  "foto.res": [ "TAMAÑO: {0}", "SIZE: {0}" ],
  "foto.subir": [ "SUBIR", "UP" ],
  "foto.bajar": [ "BAJAR", "DOWN" ],
  "foto.panel": [ "ESCONDER PANEL", "HIDE PANEL" ],
  "foto.salir": [ "SALIR", "EXIT" ],
  "foto.personajes": [ "PERSONAJES", "CHARACTERS" ],
  "foto.henry": [ "HENRY", "HENRY" ],
  "foto.efectos": [ "EFECTOS", "EFFECTS" ],
  "foto.ruido": [ "RUIDO", "NOISE" ],
  "foto.niebla": [ "NIEBLA", "FOG" ],
  "foto.subtitulos": [ "SUBTÍTULOS", "SUBTITLES" ],
  "foto.filtro": [ "MEJORADO", "ENHANCED" ],
  "foto.si": [ "SÍ", "ON" ],
  "foto.no": [ "NO", "OFF" ],
  "foto.cine": [ "cinemática {0} · cuadro {1}", "cutscene {0} · frame {1}" ],
  "foto.entrar": [ "Todo quieto. Mirá con el mouse y movete con WASD; P o Enter saca la foto, O la 360°. C, F2 o Esc: salir.", "Everything is frozen. Look with the mouse and move with WASD; P or Enter takes the photo, O the 360° one. C, F2 or Esc: exit." ],
  "foto.entrar.tactil": [ "Todo quieto. Un dedo mira, dos dedos mueven, pellizco: zoom.", "Everything is frozen. One finger looks, two fingers move, pinch: zoom." ],
  "foto.ayuda.pc": [ "Mouse: mirar (arrastrá, o clic para capturar) · WASD / flechas: moverse · E / Espacio: subir · Q: bajar · Shift: rápido · rueda o + -: zoom · Z / X: inclinar · R: enderezar · P: foto 4K (Shift: 8K) · O: 360° 8K (Shift: 4K) · Enter: foto · 1 a 6: opciones · H: panel · C, F2 o Esc: salir", "Mouse: look (drag, or click to capture) · WASD / arrows: move · E / Space: up · Q: down · Shift: fast · wheel or + -: zoom · Z / X: roll · R: level · P: 4K photo (Shift: 8K) · O: 360° 8K (Shift: 4K) · Enter: photo · 1 to 6: options · H: panel · C, F2 or Esc: exit" ],
  "foto.ayuda.tactil": [ "Un dedo: mirar · dos dedos: moverse · pellizco: zoom · SUBIR / BAJAR: mantener", "One finger: look · two fingers: move · pinch: zoom · UP / DOWN: hold" ],
  "foto.ayuda.vr": [ "Palito que camina: volar · el otro: girar, subir y bajar · agarre: rápido · gatillo: foto · el de la otra mano: 360° · A/X: personajes · B/Y: salir", "Walking stick: fly · the other: turn, up and down · grip: fast · trigger: photo · other trigger: 360° · A/X: characters · B/Y: exit" ],
  "foto.sacando": [ "sacando la foto {0}…", "taking the {0} photo…" ],
  "foto.lista": [ "Foto {0} lista ({1}×{2}, {3} MB): quedó en Descargas", "{0} photo ready ({1}×{2}, {3} MB): saved to Downloads" ],
  "foto.error": [ "no se pudo sacar la foto: {0}", "could not take the photo: {0}" ],
  "inv.ayuda": [ "← → elegir · Enter usar / equipar · ↑ info · Esc volver · (tocar: elegir y usar)", "← → choose · Enter use / equip · ↑ info · Esc back · (tap: choose and use)" ],
  "inv.cerrar": [ "cerrar", "close" ],
  "inv.vida": [ "VIDA", "LIFE" ],
  "inv.estado": [ "ESTADO", "CONDITION" ],
  "cap.titulo": [ "ELEGIR CAPÍTULO", "CHOOSE CHAPTER" ],
  "cap.nada": [ "Henry no lleva nada", "Henry carries nothing" ],
  "cap.eileen": [ "Eileen con Henry", "Eileen with Henry" ],
  "cap.vida": [ "Vida", "Life" ],
  "cap.mitad1": [ "primera mitad", "first half" ],
  "cap.mitad2": [ "segunda mitad", "second half" ],
  "cap.baul": [ "{0} en el baúl", "{0} in the box" ],
  "vr.jugar": [ "Jugar", "Play" ],
  "vr.jugar.d": [ "La pesadilla, el fantasma y el 302, como en el juego.", "The nightmare, the ghost and room 302, as in the game." ],
  "vr.escenarios": [ "Escenarios", "Rooms" ],
  "vr.escenarios.d": [ "Recorrer cada sala del juego.", "Walk through every room of the game." ],
  "vr.modelos": [ "Modelos", "Models" ],
  "vr.modelos.d": [ "Personajes y monstruos con sus animaciones.", "Characters and monsters with their animations." ],
  "vr.cine": [ "Cinemáticas", "Cutscenes" ],
  "vr.cine.d": [ "Las escenas del juego, dentro del motor.", "The game scenes, inside the engine." ],
  "vr.musica": [ "Música", "Music" ],
  "vr.musica.d": [ "Akira Yamaoka, ambientes y voces.", "Akira Yamaoka, ambiences and voices." ],
  "vr.opciones": [ "Opciones", "Options" ],
  "vr.opciones.d": [ "Brillo, sonido, giro, viñeta, mano dominante...", "Brightness, sound, turning, vignette, dominant hand..." ],
  "vr.salir": [ "Salir del casco", "Exit the headset" ],
  "vr.salir.d": [ "Volver a la página.", "Back to the page." ],
  "vr.teclas": [ "Apuntá con la mira roja y apretá el gatillo  ·  palito: elegir  ·  A: aceptar  ·  B: volver", "Aim with the red dot and pull the trigger  ·  stick: choose  ·  A: accept  ·  B: back" ],
  "suite.estado": [ "tu copia del juego: {0} archivos de datos · {1} de cinemáticas y audio · {2} videos", "your copy of the game: {0} data files · {1} cutscene and audio files · {2} videos" ],
  "suite.bloqueada": [ "la música está bloqueada: ¿el juego está abierto?", "the music is locked: is the game open?" ],
  "suite.noJuego": [ "No encuentro los archivos del juego. Abrí la Suite con ABRIR_SUITE.cmd (los busca en C:\\GOG Games\\Silent Hill 4).", "I can't find the game files. Open the Suite with ABRIR_SUITE.cmd (it looks for them in C:\\GOG Games\\Silent Hill 4)." ],
  "suite.preparando": [ "preparando el casco…", "preparing the headset…" ],
  "suite.noCasco": [ "no se pudo entrar al casco: ", "could not enter the headset: " ],
  "cine.subs": [ "Subtítulos: {0}", "Subtitles: {0}" ],
  "cine.sinSubs": [ "Sin subtítulos", "No subtitles" ]
};

export function t(clave, ...valores) {
  const par = T[clave];
  let s = par ? par[sitioIngles() ? 1 : 0] ?? par[0] : clave;
  valores.forEach((v, i) => {
    s = s.split(`{${i}}`).join(String(v));
  });
  return s;
}

export const hayTexto = clave => clave in T;

const PAGINA = {
  Inicio: "Home",
  Jugar: "Play",
  Escenarios: "Rooms",
  Modelos: "Models",
  "Cinemáticas": "Cutscenes",
  "Música": "Music",
  Opciones: "Options",
  "Sin usar": "Unused",
  "Sin usar": "Unused",
  "Contenido sin usar": "Unused content",
  "escenas, monstruos y salas que quedaron adentro del juego": "scenes, monsters and rooms left inside the game",
  "Lo más jugoso": "Highlights",
  "Mirilla y agujero": "Peephole and hole",
  Hauntings: "Hauntings",
  Monstruos: "Monsters",
  "Escalera en espiral": "Spiral staircase",
  "Salas y mundos": "Rooms and worlds",
  Objetos: "Items",
  Textos: "Texts",
  Audio: "Audio",
  "Prototipos E3": "E3 prototypes",
  Curiosidades: "Trivia",
  Todo: "All",
  "Contenido sin usar y curiosidades": "Unused content and trivia",
  "El informe en texto": "The text report",
  "Las criaturas de la escalera": "The staircase creatures",
  "La escalera, restaurada": "The staircase, restored",
  Herramientas: "Tools",
  "la pesadilla, el fantasma y el 302, como en el juego": "the nightmare, the ghost and room 302, as in the game",
  "recorrer cada sala, en la PC o en el casco": "walk through every room, on the PC or in the headset",
  "personajes y monstruos con sus animaciones": "characters and monsters with their animations",
  "las escenas del juego, dentro del motor": "the game scenes, inside the engine",
  "Música y sonido": "Music and sound",
  "Akira Yamaoka, ambientes y voces": "Akira Yamaoka, ambiences and voices",
  Archivo: "Archive",
  "lo que encontramos adentro del juego": "what we found inside the game",
  "las del juego y las de este aparato": "the game ones and the ones for this device",
  "Entrar en VR": "Enter VR",
  "el menú en el casco, con manos y mira roja": "the menu in the headset, with hands and a red dot",
  "flechas o joystick: elegir · Enter / A: entrar · Esc / B: volver": "arrows or gamepad: choose · Enter / A: enter · Esc / B: back",
  "▾ ACCESOS DIRECTOS ▾": "▾ SHORTCUTS ▾",
  "Accesos directos": "Shortcuts",
  "revisando los archivos del juego…": "checking the game files…",
  "Desde la pesadilla": "From the nightmare",
  "el comienzo del juego, en la PC, el celular o el casco": "the start of the game, on the PC, the phone or the headset",
  "Directo al 302": "Straight to 302",
  "recién despierto, para recorrer el departamento": "just woken up, to walk around the apartment",
  Sala: "Room",
  Modelo: "Model",
  Escena: "Scene",
  "La pesadilla": "The nightmare",
  "el 302 oxidado y con sangre": "room 302, rusty and bloody",
  "Cuarto 302": "Room 302",
  "living, cocina y pasillo": "living room, kitchen and hallway",
  "El agujero": "The hole",
  "oxidado, con el agujero del pasillo": "rusty, with the hole in the hallway",
  "Por el agujero": "Through the hole",
  "el departamento de Eileen": "Eileen's apartment",
  "El subte": "The subway",
  "donde aparece el primer monstruo": "where the first monster shows up",
  "El hospital": "The hospital",
  "la sala de emergencias": "the emergency room",
  "La escalera caracol": "The spiral staircase",
  "entre un mundo y otro": "between one world and the next",
  "la calle del final": "the street of the ending",
  "con sus 170 animaciones": "with his 170 animations",
  "la vecina del 303": "the neighbor in 303",
  "El perro": "The dog",
  "Sniffer Dog, el primer monstruo": "Sniffer Dog, the first monster",
  "Fantasma de pared": "Wall ghost",
  "haunting de la segunda mitad": "a second-half haunting",
  '"¿Diga...?"': '"Hello...?"',
  "Henry atiende el teléfono": "Henry answers the phone",
  "La puerta encadenada": "The chained door",
  '"Desde entonces no he podido salir…"': '"I haven\'t been able to leave since…"',
  "Eileen y el encargado": "Eileen and the superintendent",
  "el pasillo de las manos": "the hallway of the hands",
  "Henry fantasma": "Ghost Henry",
  "por la mirilla; la PC original no lo mostraba": "through the peephole; the original PC release did not show it",
  "La mirilla": "The peephole",
  '"Hace cinco días… Tuve por primera vez la pesadilla. Desde entonces no he podido salir del apartamento."': '"Five days ago… I had the nightmare for the first time. Since then I haven\'t been able to leave the apartment."',
  "HENRY TOWNSHEND · CUARTO 302": "HENRY TOWNSHEND · ROOM 302",
  '"¡¡No salgas!!"': '"Don\'t go out!!"',
  "Todo lo que ves en esta suite se lee en vivo de tu copia del juego: escenarios, texturas, luces, modelos, animaciones, cinemáticas, música y textos. Nada se convirtió ni se copió.": "Everything in this suite is read live from your copy of the game: rooms, textures, lights, models, animations, cutscenes, music and texts. Nothing was converted or copied.",
  "salas con nombre": "named rooms",
  animaciones: "animations",
  "cinemáticas": "cutscenes",
  "temas de música": "music tracks",
  "modelos con esqueleto": "models with a skeleton",
  "idiomas, con castellano": "languages, Spanish included",
  "escenas de Eileen por el agujero": "Eileen scenes through the hole",
  "funciones nombradas del juego": "named game functions",
  "Contenido sin usar y curiosidades": "Unused content and trivia",
  "· escenas cortadas, final UFO, la demo E3": "· cut scenes, UFO ending, the E3 demo",
  "Nombres de las 285 salas": "Names of the 285 rooms",
  "El plan": "The plan",
  "Inventario de archivos": "File inventory",
  "Investigación": "Research",
  Animaciones: "Animations",
  "Datos del ejecutable": "Executable data",
  "Modo mejorado": "Enhanced mode",
  "Silent Hill 4: The Room © Konami. Esta suite no trae archivos del juego: los lee de tu copia.": "Silent Hill 4: The Room © Konami. This suite ships no game files: it reads them from your copy.",
  "la vista por la mirilla de la puerta": "the view through the door peephole",
  "la primera nota, deslizada bajo la puerta": "the first note, slipped under the door",
  "la música está bloqueada: ¿el juego está abierto?": "the music is locked: is the game open?",
  "preparando el casco…": "preparing the headset…",
  "paquete demo/*.sh4": "package demo/*.sh4",
  "cinemática": "cutscene",
  "avanzado: cambiar la sala de fondo": "advanced: change the background room",
  "Sala de fondo": "Background room",
  "Vista: cámara del juego": "View: game camera",
  "Vista: libre (mirar desde afuera)": "View: free (look from outside)",
  "modo en el casco": "headset mode",
  "VR: pantalla de cine": "VR: cinema screen",
  "VR: adentro de la escena": "VR: inside the scene",
  "traje de Eileen (extra del juego)": "Eileen's costume (game extra)",
  "Eileen: vestido": "Eileen: dress",
  "Eileen: enfermera": "Eileen: nurse",
  "traje de Cynthia (extra del juego)": "Cynthia's costume (game extra)",
  "Cynthia: normal": "Cynthia: normal",
  "Cynthia: traje alternativo": "Cynthia: alternate costume",
  "franjas (B)": "bars (B)",
  "1ra persona (P)": "1st person (P)",
  "luces de la cinemática (L)": "cutscene lights (L)",
  "huesos (H)": "bones (H)",
  "llenar pantalla": "fill screen",
  "cargando…": "loading…",
  "Espacio play/pausa · ← → cuadro a cuadro (Shift = 1 s) · Inicio vuelve al principio · M cámara/libre · B franjas · H huesos · L luces · T subtítulos · en el casco: gatillo = play/pausa, apretar el agarre = pararse donde está la cámara": "Space play/pause · ← → frame by frame (Shift = 1 s) · Home goes back to the start · M camera/free · B bars · H bones · L lights · T subtitles · headset: trigger = play/pause, squeeze the grip = stand where the camera is",
  "animaciones de": "animations from",
  "reproducir / pausa": "play / pause",
  velocidad: "speed",
  repetir: "loop",
  "IK (piernas y brazos)": "IK (legs and arms)",
  "en el lugar": "in place",
  huesos: "bones",
  "Arrastrá para girar · rueda para acercar · 30 cuadros por segundo, como el juego ·": "Drag to turn · wheel to zoom · 30 frames per second, like the game ·",
  "volver a los escenarios": "back to the rooms",
  "leído directo de": "read straight from",
  "inicio de la Suite": "Suite home",
  "Música (bgm.sh4)": "Music (bgm.sh4)",
  "Efectos y ambientes (se.sh4)": "Effects and ambiences (se.sh4)",
  "filtrar…": "filter…",
  "repetir como en el juego": "loop like the game",
  volumen: "volume",
  "Bajar el tema actual como WAV": "Download the current track as WAV",
  Recorrer: "Explore",
  "Foto 4K": "4K photo",
  "Efecto (G)": "Effect (G)",
  Silenciar: "Mute",
  "Animación": "Animation",
  "Efecto original para disparar (Shift+G pasa al siguiente)": "Original effect to trigger (Shift+G goes to the next one)",
  "G: lo dispara donde mirás": "G: triggers it where you look",
  "N: silenciar o volver a oír el ambiente, la música y las voces": "N: mute or unmute the ambience, the music and the voices",
  "Qué se anima en la sala, y en qué momento del juego": "What moves in the room, and at what point of the game",
  "Clic para recorrer · WASD / flechas · Shift corre · F vuela (Q/E) · R vuelve al piso · C muestra la colisión · P foto 4K · Shift+P 8K · O foto 360° 8K · Shift+O 360° 4K · V 1ra/3ra persona · B cámara original/libre · E puertas · I inspección · M original/mejorado · L linterna · G efecto (Shift+G elige otro) · Clic der. o K arma · Clic, Espacio o J golpe · X paso atrás · Tab inventario · N silencio · Esc suelta el mouse · ?sinenemigos ?sinefectos": "Click to explore · WASD / arrows · Shift runs · F flies (Q/E) · R back to the floor · C shows collision · P 4K photo · Shift+P 8K · O 360° 8K photo · Shift+O 360° 4K · V 1st/3rd person · B original/free camera · E doors · I inspection · M original/enhanced · L flashlight · G effect (Shift+G picks another) · Right click or K weapon · Click, Space or J attack · X step back · Tab inventory · N mute · Esc releases the mouse · ?sinenemigos ?sinefectos",
  "volver a la Suite": "back to the Suite",
  CORRER: "RUN",
  PUERTA: "DOOR",
  VISTA: "VIEW",
  PISO: "FLOOR"
};

const ATRIBUTOS = [ "title", "aria-label", "placeholder" ];

const enIngles = s => {
  const k = String(s ?? "").trim();
  if (!k || !(k in PAGINA)) return null;
  return s.replace(k, PAGINA[k]);
};

const originales = new Map;

function cambiarTexto(n) {
  const r = enIngles(n.nodeValue);
  if (r == null || r === n.nodeValue) return;
  if (!originales.has(n)) originales.set(n, n.nodeValue);
  n.nodeValue = r;
}

function cambiarAtributo(el, a) {
  const v = el.getAttribute?.(a), r = v && enIngles(v);
  if (r == null || r === v) return;
  let m = originales.get(el);
  if (!m) originales.set(el, m = {});
  if (!(a in m)) m[a] = v;
  el.setAttribute(a, r);
}

export function traducirPagina(raiz = document.body) {
  if (!sitioIngles() || !raiz) return;
  const recorrer = n => {
    if (n.nodeType === 3) {
      cambiarTexto(n);
      return;
    }
    if (n.nodeType !== 1 || /^(SCRIPT|STYLE|CANVAS)$/.test(n.nodeName)) return;
    for (const a of ATRIBUTOS) cambiarAtributo(n, a);
    for (const h of n.childNodes) recorrer(h);
  };
  recorrer(raiz);
}

function volverAlCastellano() {
  for (const [n, o] of originales) {
    if (n.nodeType === 3) n.nodeValue = o; else for (const [a, v] of Object.entries(o)) n.setAttribute(a, v);
  }
  originales.clear();
}

let observador = null;

export function vigilarPagina() {
  if (observador !== null || typeof document === "undefined") return;
  observador = false;
  const obs = new MutationObserver(cambios => {
    if (!sitioIngles()) return;
    for (const c of cambios) {
      if (c.type === "characterData") cambiarTexto(c.target); else if (c.type === "attributes") cambiarAtributo(c.target, c.attributeName); else for (const n of c.addedNodes) traducirPagina(n.nodeType === 3 ? n.parentNode : n);
    }
  });
  const aplicar = () => {
    document.documentElement.lang = sitioIngles() ? "en" : "es";
    if (sitioIngles()) {
      traducirPagina(document.body);
      if (!observador) {
        obs.observe(document.body, {
          subtree: true,
          childList: true,
          characterData: true,
          attributes: true,
          attributeFilter: ATRIBUTOS
        });
        observador = obs;
      }
    } else {
      if (observador) {
        obs.disconnect();
        observador = false;
      }
      volverAlCastellano();
    }
  };
  if (document.body) aplicar(); else addEventListener("DOMContentLoaded", aplicar, {
    once: true
  });
  addEventListener("sh4idioma", aplicar);
}
