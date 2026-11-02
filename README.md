<p align="center"><img src="img/banner.jpg" alt="Room 302 — Silent Hill 4: The Room, rehecho para el navegador" width="100%"></p>

<p align="center">
<b>Silent Hill 4: The Room, rehecho para el navegador.</b> Se juega en la PC, con joystick o con casco de realidad virtual, usando <b>tu propia copia del juego de PC (GOG)</b>.
</p>

<p align="center">
<a href="https://sh4.ravenlight.net"><b>▶ Jugar online</b></a> ·
<a href="https://github.com/vjravenlight/room302/releases/latest"><b>⬇ Descargar</b></a> ·
<a href="https://github.com/vjravenlight/room302/issues/new/choose"><b>✉ Reportar un problema</b></a>
</p>

<p align="center">
<a href="https://github.com/vjravenlight/room302/releases/latest"><img src="https://img.shields.io/github/v/release/vjravenlight/room302?label=versi%C3%B3n&color=8c1a12" alt="Última versión"></a>
<a href="https://github.com/vjravenlight/room302/releases"><img src="https://img.shields.io/github/downloads/vjravenlight/room302/total?label=descargas&color=4a3b30" alt="Descargas"></a>
</p>

<p align="center"><a href="README.en.md">English version</a></p>

> **Proyecto de fans, sin fines de lucro.** No trae ningún archivo del juego: lo lee de tu copia de *Silent Hill 4: The Room* para PC.
> Silent Hill es una marca de Konami. Este proyecto no tiene relación con Konami.

---

## Índice

[Qué es](#qué-es) · [Capturas](#capturas) · [Cómo jugar](#cómo-jugar) · [Requisitos](#requisitos) · [Controles](#controles) ·
[Cámaras y opciones](#cámaras-y-opciones) · [La Suite](#la-suite) · [Desde el código](#correrlo-desde-el-código) ·
[Problemas comunes](#problemas-comunes) · [Cómo sumarse](#cómo-sumarse) · [Créditos](#créditos-y-aviso-legal)

## Qué es

Room 302 vuelve a armar *Silent Hill 4: The Room* (Team Silent, 2004) adentro del navegador, con Three.js y WebXR.
Se estudió cómo funciona el original y se volvió a armar pieza por pieza: las salas, la luz, los personajes, las
cinemáticas, el sonido y la lógica del juego. Todo se lee **en vivo de tu copia**: escenarios, texturas, modelos,
animaciones, cinemáticas, música y textos. Nada se convirtió ni se copió.

**Lo que se respetó del original**

- El 302 en primera persona, con los cambios de cada día y los fenómenos del departamento.
- Los mundos en tercera persona, con su niebla, su luz y las **cámaras fijas y de riel** del juego.
- El movimiento y el combate de Henry con las cifras del juego, y la **IA de los enemigos y de Eileen**.
- Las cinemáticas con su cámara, sus luces y su audio; la música y los ambientes de Akira Yamaoka.
- Los textos, los subtítulos y la letra del juego, en sus **8 idiomas** (castellano incluido).
- Guardar en el cuaderno rojo del 302, como en el original.

**Lo que se agregó**

- **Casco de realidad virtual** (Meta Quest / Pico): primera persona con el cuerpo y las manos de Henry, el arma en la mano,
  o tercera persona en una pantalla de cine con las cámaras del juego. También se juega con las manos, sin controles.
- **Más cámaras:** detrás del hombro, libre y primera persona en los mundos. Las cinemáticas se pueden ver por los ojos de Henry.
- **Modo foto** en cualquier momento, también en las cinemáticas: fotos 4K y 8K, y fotos 360°.
- **Video de las cinemáticas** en 4K, 1080p, 360° o vertical 9:16.
- Joystick, pantalla táctil, ayuda para apuntar, guías al apuntar, niebla y brillo regulables y un modo Mejorado.
- **La Suite**, para recorrer con calma 182 cinemáticas, 301 salas, 413 modelos y la música.

## Capturas

<table>
<tr>
<td width="33%"><img src="img/cap_cadenas.jpg" alt="La puerta encadenada del 302"><br><sub>La puerta encadenada del 302</sub></td>
<td width="33%"><img src="img/cap_agujero.jpg" alt="El agujero del baño"><br><sub>El agujero del baño</sub></td>
<td width="33%"><img src="img/cap_apuntar.jpg" alt="Ayuda y guías al apuntar"><br><sub>Primera persona con guías al apuntar (opcional)</sub></td>
</tr>
<tr>
<td><img src="img/cap_bosque.jpg" alt="El bosque, con los subtítulos del juego"><br><sub>El bosque, con los subtítulos del juego</sub></td>
<td><img src="img/cap_subte.jpg" alt="El subte, con la cámara del juego"><br><sub>El subte, con la cámara del juego</sub></td>
<td><img src="img/cap_walter.jpg" alt="Walter"><br><sub>Walter, con la luz de la escena</sub></td>
</tr>
<tr>
<td><img src="img/cap_303.jpg" alt="Cinemática del 303"><br><sub>Las cinemáticas, dentro del motor</sub></td>
<td><img src="img/cap_eileen.jpg" alt="Eileen"><br><sub>Eileen</sub></td>
<td><img src="img/cap_suite_vr.jpg" alt="La Suite en el casco"><br><sub>La Suite: Cinemáticas, también en el casco</sub></td>
</tr>
</table>

## Cómo jugar

### 1. Online (lo más rápido)

1. Entrá a **[sh4.ravenlight.net](https://sh4.ravenlight.net)** con **Chrome o Edge en una PC** y tocá **Empezar online**.
2. Elegí la carpeta donde está instalado el juego (la que tiene `data`, `demo` y `movie`).
   La carpeta **no se sube a ningún lado**: el navegador la lee desde tu PC.
3. La próxima vez la recuerda: Chrome solo pide el permiso con un clic.

> Firefox, Safari, los celulares y el navegador del casco no pueden abrir una carpeta de tu PC. Para esos casos está la versión descargada.

### 2. Descargado (Windows)

1. Bajá el último **[Release](https://github.com/vjravenlight/room302/releases/latest)** (`SH4web_vX.zip`) y descomprimilo donde quieras.
2. Doble clic en **`INSTALAR.cmd`** y elegí la carpeta del juego. Si está en `C:\GOG Games\Silent Hill 4`, la encuentra sola.
3. Se abre el navegador en `http://127.0.0.1:8130/suite.html` y listo.

Las próximas veces usá el acceso directo **"SH4 web"** del Escritorio (o `JUGAR.cmd`). La ventana negra es el servidor:
dejala abierta mientras jugás. No hay que instalar nada más, porque Node ya viene adentro.

**La primera vez necesita internet:** baja unas tablas de datos (unos 6 MB) de `sh4.ravenlight.net` y las guarda. Después anda sin conexión.

**Celular o tablet:** con la versión descargada abierta en la PC, desde el celular conectado a la misma red Wi-Fi abrí
`http://<IP de tu PC>:8130/suite.html` (si Windows pregunta por el firewall, dejá pasar la conexión en la red privada).

### 3. Con casco de realidad virtual (Meta Quest / Pico)

- **Desde la PC:** con Quest Link, Air Link o Virtual Desktop, abrí la Suite en Chrome o Edge de la PC y tocá **Entrar en VR**.
  Sirve tanto online como descargado.
- **Con el navegador del casco, por cable:** con la versión descargada abierta, conectá el casco por USB (en modo desarrollador)
  y corré **`CASCO_USB.cmd`**. Después abrí `http://127.0.0.1:8130/suite.html` en el navegador del casco.
  Hace falta `adb` (Android Platform Tools); si no lo tenés, el archivo te dice de dónde bajarlo y dónde ponerlo.

## Requisitos

| | Online | Descargado |
|---|---|---|
| Sistema | cualquiera con **Chrome o Edge** de escritorio | **Windows** |
| El juego | tu copia de *Silent Hill 4: The Room* para PC ([GOG](https://www.gog.com/en/game/silent_hill_4_the_room)), instalada | lo mismo |
| Espacio | el del juego (unos 3,5 GB) | el juego + unos 120 MB del Release |
| Internet | sí | solo la primera vez |

Para el casco: Meta Quest o Pico. La opción **Mejorado Quest** pide un Quest 3.

## Controles

Los controles también están en pantalla (la ayuda de abajo a la izquierda y la de cada menú).

### Teclado y mouse

| Qué | Tecla |
|---|---|
| Moverse / elegir en los menús | **WASD** o **flechas** |
| Correr | **Shift** (mantener) |
| Mirar | **mouse** (clic para capturarlo, **Esc** lo suelta) |
| Examinar / abrir puertas | **E** o **F** (en el 302 también clic izquierdo) |
| Aceptar | **Enter** (o Espacio en los menús) |
| Volver / saltar una escena | **Esc** o **Retroceso** |
| Pausa | **Tab** o **M** |
| Inventario | **I** |
| Preparar el arma | **clic derecho** o **K** (mantener) |
| Golpear (mantener = golpe cargado) | **clic izquierdo**, **Espacio** o **J** |
| Paso atrás | **X** con el arma preparada, o **Shift+S** |
| Paso al costado (en guardia) | **Shift+A** / **Shift+D** |
| Centrar la cámara detrás de Henry | **X** |
| Primera / tercera persona en los mundos | **V** |
| Modo foto | **C** o **F2** |

### Joystick (Xbox o compatible)

| Qué | Botón |
|---|---|
| Caminar | palito izquierdo |
| Mirar / girar la cámara | palito derecho |
| Aceptar | **A** |
| Volver | **B** |
| Examinar / puertas | **X** |
| Pausa | **Start** (Menú) |
| Moverse en los menús | cruz |
| Modo foto | **Select** (Back / Vista) |

> En esta versión el joystick todavía no tiene botones para pelear ni para correr: eso va con teclado y mouse, táctil o casco.

### Pantalla táctil (celular o tablet)

| Qué | Cómo |
|---|---|
| Caminar | el joystick en pantalla (a la izquierda; se puede pasar a la derecha en Opciones) |
| Mirar | arrastrar el dedo |
| Examinar / pasar el texto | tocar la pantalla o **EXAMINAR** |
| Correr | **CORRER** (prende y apaga) |
| Aceptar / volver | **OK** / **VOLVER** |
| Pausa | **MENÚ** |
| Modo foto | **FOTO** |
| En los mundos | **ARMA** (mantener), **GOLPE** (mantener = cargado), **PASO** (paso atrás), **INV** (inventario), **VISTA** (1ra / 3ra persona) |

### Casco VR (con controles)

| Qué | Cómo |
|---|---|
| Caminar | palito de la mano izquierda (apretarlo = correr) |
| Girar | palito de la mano derecha (a saltos de 30° o suave) |
| Elegir en los menús | rayo con **mira roja**; gatillo, **A** o pellizco aceptan; **B** vuelve |
| Examinar / puertas | **A** (en el 302 también el gatillo) |
| Preparar el arma / golpear | **agarre** / **gatillo** de la mano del arma, o mover el brazo |
| Remate al enemigo caído | gatillo de la otra mano |
| Paso atrás | **X** |
| Inventario | **Y** (un panel en la mano izquierda) |
| Cambiar de arma | clic corto del palito izquierdo |
| Tercera persona (pantalla de cine) | **B** (otra vez **B** vuelve) |
| Pausa | apretar el palito derecho |
| Modo foto | apretar **los dos palitos** a la vez |

Con **Opciones → Mano dominante: izquierda** todo se espeja.
**Con las manos, sin controles:** pellizcar con la mano izquierda y moverla camina (como un palito); el pellizco de la otra
mano acepta y examina; mirar la palma izquierda medio segundo abre el inventario; en el 302, la palma hacia la cara con
un pellizco sostenido abre la pausa.

### Modo foto

Al entrar se congela todo, también una cinemática en el cuadro en que estaba. Las fotos quedan en **Descargas**.

| Qué | PC | Joystick | Casco |
|---|---|---|---|
| Entrar / salir | **C** o **F2** (Esc también sale) | **Select** | los dos palitos |
| Mirar / moverse | mouse · **WASD** / flechas | — | un palito vuela, el otro gira, sube y baja |
| Subir / bajar | **E** o Espacio / **Q** | **RB** / **LB** | — |
| Rápido | **Shift** | — | agarre |
| Zoom | rueda o **+ −** | **LT** / **RT** | — |
| Inclinar / enderezar | **Z** / **X** · **R** | — | — |
| Foto | **P** = 4K (Shift: 8K) · **Enter** = la del tamaño elegido | — | gatillo |
| Foto 360° | **O** = 8K (Shift: 4K) | — | gatillo de la otra mano |
| Opciones (personajes, Henry, efectos, ruido, niebla, subtítulos, mejorado) | **1** a **7** | — | A/X: personajes |
| Esconder el panel | **H** | — | — |

En el celular: un dedo mira, dos dedos mueven, pellizco = zoom, y los botones SUBIR / BAJAR.

## Cámaras y opciones

**Cámaras.** El 302 va siempre en primera persona, como el original. En los mundos se elige en **Opciones → Ajustes de cámara**:

- **Del juego:** las cámaras fijas y de riel del original.
- **Detrás del hombro:** sigue a Henry cuando camina; se gira con el mouse, el palito derecho o el dedo.
- **Libre:** gira solo con el mouse, el palito derecho o el dedo, alrededor de Henry.
- **Primera persona:** desde los ojos de Henry (**V** o **VISTA**). También se pelea así.

Para las de hombro y libre se regulan el suavizado, la velocidad de giro y la distancia.
**Cinemáticas:** *Cinemática* (la cámara del juego) u *Ojos de Henry*. En el casco, además: pantalla de cine o adentro de la escena.

**Opciones principales**

| Grupo | Opciones |
|---|---|
| Juego | Idioma (los 8 del juego; la interfaz del sitio va en castellano o en inglés), brillo, subtítulos, volumen de la música y de los efectos, color de la sangre (rojo, verde o morado) |
| Imagen | Ruido (0 a 10), niebla (5 = como el juego), brillo y sombras de los personajes, calidad de imagen (baja, media, alta) |
| Ayudas | Ayuda para apuntar (completa, solo mira o nada), guías al apuntar (marca en rojo la puerta u objeto) |
| Mouse | Sensibilidad, invertir |
| Táctil | Tamaño de los botones, lado del joystick, vibración |
| Casco | Giro (a saltos o suave), viñeta al moverse, postura (parado o sentado), escala, mano dominante, cuerpo de Henry, Mejorado Quest |

Las opciones y las partidas guardadas quedan en tu navegador.

## La Suite

La Suite (`suite.html`) es la entrada a todo, en la PC o en el casco:

- **Jugar:** desde la pesadilla del comienzo o directo al 302.
- **Cinemáticas:** las 182 escenas del juego dentro del motor, cuadro por cuadro, con la cámara del juego o libre, por los
  ojos de Henry, con huesos y luces a la vista. Exportan **video 4K, 1080p, 360° o vertical 9:16** (para Instagram, TikTok o
  Shorts), con su sonido, y modo foto.
- **Escenarios:** las 301 salas para recorrer en primera o tercera persona, con Henry jugable, linterna, efectos del juego,
  modo Mejorado y fotos 4K/8K/360°.
- **Modelos:** 413 modelos, personajes y monstruos, con sus animaciones.
- **Música:** los temas de Akira Yamaoka, los ambientes y las voces, para escuchar o bajar en WAV.
- **Archivo:** el contenido sin usar que quedó adentro del juego.

## Correrlo desde el código

Hace falta **Node.js 18 o más nuevo** y tu copia del juego. No hay que instalar dependencias ni compilar nada.

```
git clone https://github.com/vjravenlight/room302.git
cd room302
node tools/servidor.mjs 8130 "C:\GOG Games\Silent Hill 4"
```

Después abrí **http://127.0.0.1:8130/suite.html**. El servidor solo lee: sirve `visor/`, la carpeta del juego en `/juego/`
y las tablas en `/datos/` (las baja de `sh4.ravenlight.net` la primera vez que se piden).

**Armar el Release** (Windows, con Python 3):

```
python tools/armar_release.py --version X
```

Sale en `_release/SH4web/` y `_release/SH4web_vX.zip`. Copia el `node.exe` instalado (`--node "ruta\node.exe"` si no está en
`C:\Program Files\nodejs`).

**Estructura**

| Carpeta | Qué hay |
|---|---|
| `visor/` | todo lo que corre en el navegador. Páginas: `suite.html` (inicio), `modo_juego/juego.html` (Jugar), `index.html` (Escenarios), `cine.html`, `modelos.html`, `musica.html`, `carpeta.html` (online) |
| `visor/modo_juego/` | el juego: el 302, los mundos, menús, guardado, modo foto |
| `visor/jugador/`, `visor/enemigos/` | Henry (movimiento, combate, inventario, casco) y los enemigos |
| `visor/lib/` | lectura de los archivos del juego, salas, modelos, luz, Three.js r170 |
| `tools/` | `servidor.mjs` (servidor local) y `armar_release.py` |
| `datos/` | vacía en el repo: las tablas se bajan solas la primera vez |

## Problemas comunes

<details>
<summary><b>"No está la carpeta data" o "no encuentro los archivos del juego"</b></summary>

Elegiste otra carpeta. Tiene que ser la carpeta donde está **instalado** el juego: adentro tienen que estar `data`, `demo` y
`movie` (con GOG suele ser `C:\GOG Games\Silent Hill 4`). En la versión descargada, para cambiarla, borrá
`config\carpeta_juego.txt` y volvé a correr `INSTALAR.cmd`.
</details>

<details>
<summary><b>"Este navegador no puede abrir una carpeta"</b></summary>

Pasa con Firefox, Safari, los celulares y el navegador del casco. Para jugar online usá **Chrome o Edge en una PC**, o bajá
la versión descargada.
</details>

<details>
<summary><b>El casco no entra en VR</b></summary>

- Con Link / Air Link / Virtual Desktop, abrí la página en **Chrome o Edge de la PC** (no en el navegador del casco) y tocá **Entrar en VR**.
- Con `CASCO_USB.cmd`: el casco tiene que estar en **modo desarrollador**, conectado por USB y con la **depuración USB aceptada**
  en el casco. `JUGAR.cmd` tiene que estar abierto en la PC. Si falta `adb`, el archivo te dice dónde bajarlo.
</details>

<details>
<summary><b>El puerto 8130 está ocupado</b></summary>

Casi siempre es porque ya hay otra ventana del servidor abierta: cerrala, o usá la que ya está. Desde el código podés usar
otro puerto: `node tools/servidor.mjs 8131 "C:\GOG Games\Silent Hill 4"` y abrir `http://127.0.0.1:8131/suite.html`.
</details>

<details>
<summary><b>No abre el navegador, o se ve en negro</b></summary>

Entrá a mano a `http://127.0.0.1:8130/suite.html`. Si se ve en negro o anda lento, probá con Chrome o Edge actualizados y con
**Opciones → Calidad de imagen: baja**.
</details>

<details>
<summary><b>No aparecen mis partidas guardadas</b></summary>

Las partidas quedan en el navegador y en la dirección donde jugaste: online y descargado se guardan por separado (y también
`127.0.0.1` y `localhost`). Como en el original, se guarda en el cuaderno rojo del 302.
</details>

## Cómo sumarse

¡Toda ayuda suma! Reportes, ideas, pruebas en otros cascos o joysticks, traducciones de la interfaz y código.

- **Reportar un problema o proponer una idea:** [abrí un issue](https://github.com/vjravenlight/room302/issues/new/choose) con las plantillas.
- **Código:** leé **[CONTRIBUTING.md](CONTRIBUTING.md)** antes de mandar un pull request.

El código de este repositorio se publica **sin los comentarios internos** de trabajo: está formateado y se lee bien, pero
las explicaciones largas quedan del lado del proyecto. Si algo no se entiende, preguntá en un issue.

## Créditos y aviso legal

- ***Silent Hill 4: The Room*** © Konami. Creado por **Team Silent**; dirigido por **Suguru Murakoshi**, música y sonido de **Akira Yamaoka**.
- **Room 302** es un proyecto de **FeniXVOID · Project Ravenlight** — **VJ Ravenlight** ([ravenlight.net](https://www.ravenlight.net)).
- Hecho con [Three.js](https://threejs.org) (licencia MIT, incluida en `visor/lib/three/`).

Silent Hill es una marca de Konami. Este es un proyecto de fans, sin fines de lucro y sin relación con Konami.
**No incluye archivos del juego:** necesitás tu propia copia de PC, comprada legalmente.

Licencia: a definir.
