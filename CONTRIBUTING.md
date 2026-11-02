# Cómo sumarse a Room 302

*[English below](#english)*

¡Gracias por querer ayudar! Sirve todo: reportar problemas, proponer ideas, probar en otros cascos, joysticks o
navegadores, mejorar las traducciones de la interfaz y mandar código.

## Reportar un problema

1. Fijate si ya está en los [issues abiertos](https://github.com/vjravenlight/room302/issues).
2. Abrí uno nuevo con la plantilla **"Algo no anda"**: [issues/new/choose](https://github.com/vjravenlight/room302/issues/new/choose).
3. Contá **qué hiciste, qué pasó y qué esperabas**, con el navegador, el sistema, el modo (online, descargado o desde el
   código) y con qué jugabas (teclado, joystick, táctil, casco).
4. Si podés, sumá una **captura** (el modo foto con **C** o **F2** ayuda) y lo que dice la **consola** del navegador
   (**F12 → Consola**, los mensajes en rojo).

**Nunca adjuntes archivos del juego** (ni partes de `data`, `demo` o `movie`).

## Proponer una idea

Usá la plantilla **"Tengo una idea"**. Si es algo grande (un modo nuevo, cambiar cómo se juega), conviene charlarlo en el
issue antes de escribir código, así no se pierde trabajo.

## Mandar código

### Antes de empezar

- Hace falta **Node.js 18+**, **Chrome o Edge** y tu copia del juego. No hay nada que instalar ni compilar.
- Levantá el servidor y abrí la Suite:

  ```
  node tools/servidor.mjs 8130 "C:\GOG Games\Silent Hill 4"
  ```

  → http://127.0.0.1:8130/suite.html
- Parámetros útiles en la dirección: `?idioma=en` (interfaz en inglés), `?tactil` (fuerza los controles táctiles en la PC),
  `?limpio` (en Jugar, sin la ayuda ni los botones de la página).

### Estilo del código

- **Castellano:** nombres de variables, funciones, archivos y comentarios en castellano. Los textos que ve el jugador van en
  `visor/textos_sitio.js`, siempre con su par en inglés.
- **ES modules** (`import` / `export`) cargados directo por el navegador. **Sin dependencias de npm y sin paso de build**:
  lo que está en `visor/` es lo que corre.
- Three.js va incluido en `visor/lib/three/` (r170) y se carga con el `importmap` de cada página: no lo actualices en el mismo
  PR que otra cosa.
- Dos espacios de sangría, `const` / `let`, punto y coma.
- **Nada de archivos del juego** en el repo, ni modelos, texturas, audio o videos sacados de él. Todo se lee en vivo de la
  copia de cada jugador.
- Lo que empieza con `_` (carpetas o archivos) no se publica: no lo uses para código que tiene que correr.

### Probar

Antes de mandar el PR, probá en **Chrome o Edge** lo que tocaste, y si podés:

- en **Jugar** (`modo_juego/juego.html`) y en la página de la Suite que corresponda;
- con teclado y mouse, y con táctil (`?tactil`) si cambiaste algo de la pantalla;
- en el casco, si tocaste algo de VR (o avisá en el PR que no lo pudiste probar).

### El pull request

- Uno por tema, chico y con una descripción clara. Usá la plantilla.
- Sumá capturas o un video corto si cambia algo que se ve.
- **Cómo se publica:** el código de este repo se arma desde la copia de trabajo del proyecto y se publica **sin los
  comentarios internos**. Si tu PR se acepta, se pasa a esa copia y vuelve en la versión siguiente, con tu crédito en las
  notas de la versión.

La licencia del proyecto todavía está a definir.

---

## English

Thanks for helping! Bug reports, ideas, testing on other headsets, gamepads or browsers, interface translations and code
are all welcome.

- **Bugs:** check the [open issues](https://github.com/vjravenlight/room302/issues), then use the **bug** template at
  [issues/new/choose](https://github.com/vjravenlight/room302/issues/new/choose). Say what you did, what happened and what you
  expected, plus browser, OS, mode (online, downloaded, from source) and input (keyboard, gamepad, touch, headset). A
  screenshot and the browser console (**F12 → Console**, red messages) help a lot. **Never attach game files.**
- **Ideas:** use the **idea** template. For big changes, discuss them in the issue before writing code.
- **Running it:** Node.js 18+, Chrome or Edge and your copy of the game. `node tools/servidor.mjs 8130 "C:\GOG Games\Silent Hill 4"`
  and open http://127.0.0.1:8130/suite.html. Useful URL flags: `?idioma=en`, `?tactil`, `?limpio`.
- **Code style:** names, files and comments in **Spanish**; player-facing texts in `visor/textos_sitio.js` with their English
  pair. Plain **ES modules** loaded by the browser, **no npm dependencies, no build step**. Three.js r170 is vendored in
  `visor/lib/three/`. Two-space indent. **No game files or assets extracted from the game** in the repo. Anything starting
  with `_` is not published.
- **Testing:** in Chrome or Edge, in Play (`modo_juego/juego.html`) and the relevant Suite page; touch with `?tactil`; the
  headset if you touched VR (or say you couldn't).
- **Pull requests:** one topic each, small, with screenshots if something visible changes. This repository is generated from
  the project's working copy and published **without internal comments**; accepted PRs are ported there and come back in the
  next release, credited in the release notes.

The project's license is still to be decided.
