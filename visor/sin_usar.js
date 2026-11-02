// SH4 web — FeniXVOID · Project Ravenlight
import { leerMensajes } from "./lib/subtitulos.js";

import { sitioIngles } from "./textos_sitio.js";

const SECCIONES = [ [ "jugoso", "Lo más jugoso" ], [ "cine", "Cinemáticas" ], [ "mirilla", "Mirilla y agujero" ], [ "hauntings", "Hauntings" ], [ "monstruos", "Monstruos" ], [ "escalera", "Escalera en espiral" ], [ "salas", "Salas y mundos" ], [ "objetos", "Objetos" ], [ "textos", "Textos" ], [ "audio", "Audio" ], [ "e3", "Prototipos E3" ], [ "curiosidades", "Curiosidades" ] ];

const CERTEZA = {
  datos: "confirmado en los datos",
  internet: "según internet",
  supuesto: "supuesto"
};

const TCRF = [ "TCRF", "https://web.archive.org/web/20250928174337/https://tcrf.net/Silent_Hill_4:_The_Room" ];

const SHM = (p, n = "Silent Hill Memories") => [ n, "https://www.silenthillmemories.net/" + p ];

const YT = (id, n = "video") => [ n, "https://www.youtube.com/watch?v=" + id ];

const cine = (d, p = "rl") => `./cine.html?paquete=${p}&demo=${d}`;

const modelo = (a, n = 0) => `./modelos.html?archivo=${a}${n ? "&n=" + n : ""}`;

const sala = (s, extra = "") => `./index.html?sala=${s}${extra}`;

const T = [ {
  s: "jugoso",
  t: "Eileen con el encargado: la escena del 2 %",
  c: "datos",
  img: "m_eisk.jpg",
  d: 'Por el agujero del baño hay 33 escenas de Eileen elegidas al azar. "WITH_SUPER" (d_107, 109 s, con Frank en su cuarto) sale solo al final del juego y con 2 % de chance.',
  ver: [ [ "Verla", cine("d_107") ] ]
}, {
  s: "jugoso",
  t: 'Pantallas de la demo E3: "TO BE CONTINUED"',
  c: "datos",
  img: "snap_gameover_e3.jpg",
  d: 'El título, el game over y el final de la "trial version" de la E3 2004 siguen en los archivos de PC (snap_*_e3). El EXE nunca los carga.'
}, {
  s: "jugoso",
  t: "Una cinemática prototipo (demo.bin)",
  c: "datos",
  img: "m_demo_0.jpg",
  d: "Henry y Eileen tempranos (otra cara, otra ropa) y 16,7 s de movimiento en un formato viejo (SQT versión 0), sin cámara.",
  ver: [ [ "Ver los modelos", modelo("demo") ] ],
  f: [ YT("x1qkBGZFsiQ", "Rodolfo Nuñez") ]
}, {
  s: "jugoso",
  t: "El inglés de EE.UU. que no se usa",
  c: "datos",
  d: 'GOG carga los textos en inglés británico ("Mum", "aluminium"). Los 12 archivos en inglés de EE.UU. ("Mom") están pero nadie los nombra.',
  leer: {
    arch: "message_room0_e.bin",
    buscar: [ "Mom" ]
  }
}, {
  s: "jugoso",
  t: "El final UFO",
  c: "datos",
  d: '"U.F.O." es el 5.º final en la lista de finales. Hay piedras para lavar, el inodoro con "algo adentro" y 5 IDs de cada piedra, como en los UFO de SH1 y SH3.',
  leer: {
    arch: "message_common_eu.bin",
    buscar: [ "U.F.O", "UFO" ]
  },
  f: [ TCRF ]
}, {
  s: "cine",
  t: "Personajes de cinemática sin cinemática",
  c: "datos",
  img: "m_kl3l.jpg",
  d: "Ocho personajes tienen fila en la lista de cinemáticas pero ninguna escena los usa: Walter muerto (kl3l), la mujer de la escalera (st_spi00), dos Joseph más, el ascensor B…",
  ver: [ [ "Walter muerto", modelo("kl3l") ], [ "La de la escalera", modelo("st_spi00") ] ]
}, {
  s: "cine",
  t: '"Eileen llama a Henry": la escena perdida',
  c: "internet",
  d: "TCRF la ubica entre la escena con Joseph y la de Eileen. En los archivos hay candidatas por duración y elenco: d_101, d_122, d_126, d_129 y d_130.",
  ver: [ [ "Ver d_122", cine("d_122") ], [ "Ver d_101", cine("d_101") ] ],
  f: [ TCRF, YT("NyA1M7OGO48") ]
}, {
  s: "cine",
  t: "Frank en la puerta, abriendo la boca raro",
  c: "internet",
  img: "m_di907.jpg",
  d: "Las escenas de la mirilla d_131–d_134 son del encargado Frank (d_131 dura 94 s con su audio).",
  ver: [ [ "Ver d_131", cine("d_131") ] ],
  f: [ YT("UdZp5JSF7qY", "Perfect End Strange"), YT("NrO1M2O4Dmk", "Rodolfo Nuñez") ]
}, {
  s: "cine",
  t: "El Walter niño golpea la puerta del 302",
  c: "internet",
  d: "Una escena al empezar el Mundo Apartamento y otra en el lobby que el juego no muestra. Un mod de 2026 las reactiva.",
  f: [ [ "PCGamingWiki (Wayback)", "https://web.archive.org/web/20260907202834id_/https://community.pcgamingwiki.com/files/file/4112-silent-hill-4-restore-and-recreate-unused-content/" ], YT("vYAzvkQ2VBE") ]
}, {
  s: "cine",
  t: "Los túneles del agujero sí se usan",
  c: "datos",
  d: 'Corrección: gt01–gt12 no es un "mundo sin usar". Son el gateo de Henry por el agujero, con 22 cámaras propias (d_200–d_221).',
  ver: [ [ "Ver gt01", sala("gt01") ] ]
}, {
  s: "mirilla",
  t: 'EATING: la "hamburguesa"',
  c: "datos",
  d: "TCRF la da por sin usar, pero la tabla de PC la puede elegir: solo al final del juego y desde un único estado. Rarísima.",
  ver: [ [ "Verla", cine("d_119") ] ],
  f: [ TCRF ]
}, {
  s: "mirilla",
  t: "Los 10 programas de tele de Eileen",
  c: "datos",
  d: "TV1–TV10: cada uno trae ~28 s de audio propio con lo que mira Eileen. Salen al azar y por etapas: casi nadie los escucha todos.",
  ver: [ [ "TV6", cine("d_140") ], [ "TV10", cine("d_147") ] ]
}, {
  s: "mirilla",
  t: "Seis escenas de Eileen fuera de la tabla",
  c: "supuesto",
  d: 'd_101, d_122, d_125, d_126, d_129 y d_130 no están en la tabla del azar. Son las candidatas a "Eileen poseída que se retuerce frente a la mirilla".',
  ver: [ [ "Ver d_125", cine("d_125") ], [ "Ver d_130", cine("d_130") ] ],
  f: [ YT("s7CR8t6_al0", "TCRF"), YT("Iwpu9sx2Ym4", "Perfect End Strange") ]
}, {
  s: "mirilla",
  t: "El Henry fantasma de la mirilla",
  c: "datos",
  img: "m_kmnk.jpg",
  d: "d_139: un Henry de camisa blanca que susurra (42 s de audio). La PC original nunca lo mostró; GOG lo restauró en 2025.",
  ver: [ [ "Verlo", cine("d_139") ], [ "El modelo", modelo("kmnk") ] ],
  f: [ YT("rAnFkBtDBQc") ]
}, {
  s: "mirilla",
  t: "Las máscaras de la mira",
  c: "datos",
  img: "mirillas.jpg",
  d: "El ojo de pez de la puerta (doorscope), la máscara del agujero (peephole) y una tercera de la Prisión de Agua: ahí también se espía (mz_peep)."
}, {
  s: "mirilla",
  t: "Una escena casi imposible de ver",
  c: "internet",
  d: "Hunter Stanton la encontró en el código: Mundo Edificio por primera vez, Eileen recién salida, y 1 chance en 50 cada vez que toca escena.",
  f: [ YT("UXLe3-t6Tz8", "Hunter Stanton") ]
}, {
  s: "hauntings",
  t: "Los 15 hauntings, con su nombre interno",
  c: "datos",
  d: 'La tabla está completa e igual a la de la E3, con nombres en japonés: la grieta, el cuadro, el teléfono, "el trozo de carne en la heladera", "el grifo de sangre"…',
  ver: [ [ "El 302 de la segunda mitad", sala("rl00a", "&mitad=2") ] ]
}, {
  s: "hauntings",
  t: '"管理人": el haunting del encargado',
  c: "supuesto",
  d: 'Uno de los 15 se llama "el encargado" y usa PhenomEntInit. Por el nombre y el lugar parece de la entrada; todavía no se sabe qué hace.'
}, {
  s: "hauntings",
  t: '"Esto es un dummy, eh"',
  c: "datos",
  img: "g_phe_rl02.jpg",
  d: 'Una textura de prueba en los hauntings del 302 dice en japonés "これはダミーなのですよ。". Al lado, un pasillo oscuro con una figura.',
  ver: [ [ "Ver el archivo", modelo("phe_rl02") ] ]
}, {
  s: "hauntings",
  t: "Los 7 hauntings que faltaban en PC",
  c: "internet",
  d: "Grifo de sangre, zapatos, mirilla, teléfono, sombra del Walter niño, retrato y muñecos. Seguían en el código; GOG los reactivó el 20/03/2025.",
  f: [ [ "Bloody Disgusting", "https://web.archive.org/web/20250430135326id_/https://bloody-disgusting.com/video-games/3861171/cut-ps2-content-from-gog-version-of-silent-hill-4-the-room-has-been-restored-video/" ], SHM("sh4/hauntings_en.htm") ]
}, {
  s: "monstruos",
  t: "Enemigos que no existen: TUFT, FIREMAN, GHOST, PUPPET",
  c: "datos",
  d: "El archivo de prueba param.bin los lista junto a TEST00 y SAMPLE. No hay modelos: solo los nombres.",
  f: [ TCRF ]
}, {
  s: "monstruos",
  t: "NURSE: la enfermera sin modelo",
  c: "datos",
  d: "Está en la lista de enemigos de la E3 y tiene sus sonidos (se_en_nurse.bin), pero no hay carpeta con su modelo."
}, {
  s: "monstruos",
  t: "Walter colgado de cadenas",
  c: "datos",
  img: "m_klsp.jpg",
  d: "klsp.bin: Walter colgado (57 huesos, 19 m de alto por las cadenas). Ninguna tabla del EXE lo nombra.",
  ver: [ [ "Ver el modelo", modelo("klsp") ] ]
}, {
  s: "monstruos",
  t: "Jasper con remera verde",
  c: "datos",
  img: "m_gei.jpg",
  d: "gei.bin no se nombra en ningún lado: el juego usa otras versiones de Jasper.",
  ver: [ [ "Ver el modelo", modelo("gei") ] ]
}, {
  s: "monstruos",
  t: "Diseños rechazados",
  c: "internet",
  d: 'Un bicho de dos cabezas y un cuerpo, cortado "por ética" (Tsuboyama), y una "parca" con punzón. Los jefes intermedios se cortaron por falta de gente.',
  f: [ SHM("creators/interviews/2004.09.06_yamaoka_tsuboyama_kikizo_en.htm", "Kikizo") ]
}, {
  s: "monstruos",
  t: "Cuatro animaciones de más del Wall Man jefe",
  c: "supuesto",
  d: "El jefe de la escalera tiene 27 animaciones y la lista de la E3 nombra 23. Las 4 de más son las mejores candidatas a animaciones sin usar.",
  ver: [ [ "Ver el modelo", modelo("enemy_kabe_boss") ] ]
}, {
  s: "escalera",
  t: "Seis criaturas que el juego nunca pone",
  c: "datos",
  img: "escalera_galeria.jpg",
  d: 'El EXE las tiene ubicadas en el hueco de la escalera, con posición y giro, pero en la "sala 0", que no existe. Ya estaban apagadas en la demo E3.',
  ver: [ [ "La galería", "./escalera_sin_usar.html" ], [ "En su lugar", sala("st01", "&sinusar") ] ],
  f: [ TCRF, YT("eO1q3d4OBNY", "Rodolfo Nuñez"), YT("HjRJfM_tXkk", "Rodolfo Nuñez 2"), YT("ZOIbKedkjTM", "Perfect End Strange") ]
}, {
  s: "escalera",
  t: "La enfermera del cuartito vacío",
  c: "supuesto",
  img: "escalera_st01_4.jpg",
  d: "Una enfermera trabaja sobre un cuerpo en una mesa. Va en el cuartito de 235°, que en st01 está vacío (reparto deducido por el orden de la tabla).",
  ver: [ [ "Verla en st01", sala("st01", "&sinusar") ] ]
}, {
  s: "escalera",
  t: "El bulto sobre la camilla",
  c: "datos",
  img: "escalera_st05_3.jpg",
  d: "La criatura encogida (#22) cae justo encima de la camilla que solo existe en st05. Es la ubicación más clara de todas.",
  ver: [ [ "Verla en st05", sala("st05", "&sinusar") ] ]
}, {
  s: "escalera",
  t: "Los tres modelos escondidos en st01",
  c: "datos",
  img: "escalera_st01_1.jpg",
  d: "st01.bin trae un maniquí cabeza abajo, dos bultos colgados de cadenas y una mujer colgada que ninguna tabla nombra. Vienen ya ubicados en la sala.",
  ver: [ [ "Verlos en st01", sala("st01", "&sinusar") ] ]
}, {
  s: "escalera",
  t: "La puerta que nunca cae",
  c: "datos",
  d: "En st02 caen cosas por el hueco. Una de las tres filas tiene una puerta (#16), pero el azar del código siempre elige otra.",
  ver: [ [ "Ver el modelo", modelo("st_all", 4) ] ]
}, {
  s: "escalera",
  t: "35 cuartitos, 19 vacíos desde el diseño",
  c: "datos",
  img: "escalera_nichos_st03.jpg",
  d: "Los cuartitos de rejas son un módulo repetido de relleno. La tabla de criaturas apunta solo a 3 lugares; los demás nunca tuvieron nada.",
  ver: [ [ "Ver los nichos numerados", sala("st03", "&sinusar=todas") ] ]
}, {
  s: "escalera",
  t: "El ángel, la oveja y el maniquí perforado",
  c: "datos",
  img: "escalera_oveja.jpg",
  d: "Lo que la wiki describe sí se ve en el juego: el ángel (st02) y la oveja (st03) son parte del mundo; el maniquí perforado es una criatura de la tabla (st04).",
  ver: [ [ "La oveja", sala("st03") ] ],
  f: [ [ "Wiki de Silent Hill", "https://silenthill.fandom.com/wiki/Spiral_Staircase" ] ]
}, {
  s: "salas",
  t: "iwa_teststage: la sala de pruebas",
  c: "datos",
  img: "g_iwa_teststage.jpg",
  d: "Sala con colisión, una esfera de prueba y texturas de óxido, puertas y madera. Se puede caminar.",
  ver: [ [ "Caminarla", sala("iwa_teststage") ], [ "La esfera", modelo("iwa_teststage") ] ]
}, {
  s: "salas",
  t: "em_test: la sala con chicas de anime",
  c: "datos",
  img: "g_em_test.jpg",
  d: 'Texturas del departamento y de otro mundo… y dos personajes de "Moekan", un visual novel de 2003. Nunca se ven.',
  ver: [ [ "Verla", sala("em_test") ] ],
  f: [ TCRF ]
}, {
  s: "salas",
  t: "padata: una sala vieja y una mujer temprana",
  c: "datos",
  img: "m_padata_0.jpg",
  d: "Modelo y colisión viejos, un Henry ensangrentado y una mujer (¿Eileen o Cynthia temprana?) con 3 animaciones.",
  ver: [ [ "Ver los modelos", modelo("padata") ] ]
}, {
  s: "salas",
  t: "Cubos, esferas y sombras de prueba",
  c: "datos",
  img: "m_prc_objects.jpg",
  d: "hit1, kage_test, prc_objects y tex1: archivos de prueba de colisiones, sombras y texturas sueltas.",
  ver: [ [ "prc_objects", modelo("prc_objects") ], [ "hit1", modelo("hit1") ] ]
}, {
  s: "salas",
  t: "sb06: el vacío del subte",
  c: "datos",
  d: "Una sala del Subte cuyo contenido es un bloque de prueba de Silent Hill 3. Si se entra, Henry queda en un vacío negro.",
  ver: [ [ "Entrar", sala("sb06") ] ],
  f: [ TCRF ]
}, {
  s: "salas",
  t: "ie14_lite y los finales sin ID",
  c: "datos",
  d: "Una versión liviana de ie14 que nada carga, y las salas de los finales (ed00, ed01) sin ningún ID en el EXE.",
  ver: [ [ "ie14_lite", sala("ie14_lite") ], [ "ed01", sala("ed01") ] ]
}, {
  s: "salas",
  t: "La campera de James en la escalera",
  c: "internet",
  d: "Un video dice que, en la transición de la escalera, queda cargada una campera de James Sunderland invisible.",
  f: [ YT("dUFE7Iuyl00") ]
}, {
  s: "salas",
  t: "Iba a haber un hotel",
  c: "internet",
  d: "En enero de 2004 se anunciaban bosque, prisión y un hotel. En el juego quedó el Edificio.",
  f: [ [ "IGN (Wayback)", "https://web.archive.org/web/20050112035254id_/http://ps2.ign.com/articles/461/461798p1.html" ] ]
}, {
  s: "objetos",
  t: "Dirty Stone y Channelling Stone",
  c: "datos",
  d: 'Una piedra sucia que se lava y se convierte en "piedra con un poder extraño". Hay textos, 5 IDs de cada una y el inodoro: "There\'s something in the toilet…".',
  leer: {
    arch: "message_item_msg_b.bin",
    buscar: [ "Stone" ]
  },
  f: [ TCRF ]
}, {
  s: "objetos",
  t: "Ítems sin uso",
  c: "internet",
  d: 'Red Chrism, Lord\'s Prayer y Trailer Key tienen ID pero no se usan. Dos sobres figuran como "¿ítem japonés?".',
  f: [ [ "Almar's Guides", "https://almarsguides.com/retro/walkthroughs/ps2/games/silenthill4theroom/codebreaker/itemmodifiercodes/" ] ]
}, {
  s: "objetos",
  t: "La radio habla de un UFO",
  c: "datos",
  d: 'Rumores de "algo raro en el parque de diversiones cerca del faro" y de "un UFO que pasó volando". Esto sí se escucha.',
  leer: {
    arch: "message_room0_b.bin",
    buscar: [ "UFO", "lighthouse" ]
  }
}, {
  s: "textos",
  t: "Las resoluciones de antes",
  c: "datos",
  d: "GOG reescribió el menú de resoluciones. El original quedó guardado aparte, con 400x300 incluido.",
  leer: {
    arch: "message_common_eu.org.bin",
    buscar: [ "x300", "x480", "x600" ]
  }
}, {
  s: "textos",
  t: "Textos de prueba",
  c: "datos",
  d: '"english dummy message", "italy dummy message" (sí, "italy"), "Now no use!!!" y avisos de la demo y de la Xbox.',
  leer: {
    arch: "message_common_eu.bin",
    buscar: [ "dummy message", "Now no use", "trial", "Xbox" ]
  }
}, {
  s: "textos",
  t: "El coreano tiene de más (y de menos)",
  c: "datos",
  d: "Tiene mensajes extra en varios archivos, y el del Mundo Apartamento pesa 0 bytes: en coreano ese mundo quedaría sin texto."
}, {
  s: "textos",
  t: "GOEGOEGOEGOE",
  c: "datos",
  d: 'sample.bin, el archivo para probar el formato, dice "GOEGOEGOEGOE", "NAENAE" y "SILENT HILL 4".',
  f: [ TCRF ]
}, {
  s: "textos",
  t: "Subtítulos japoneses y coreanos escondidos",
  c: "internet",
  d: "La versión de GOG los trae; se activan parcheando 4 bytes del EXE (acá el EXE no se toca).",
  f: [ [ "PCGamingWiki", "https://web.archive.org/web/20261013072857id_/https://www.pcgamingwiki.com/wiki/Silent_Hill_4:_The_Room" ] ]
}, {
  s: "audio",
  t: "Nueve temas de radio sin usar",
  c: "internet",
  d: '"Never Come", "Confinement", "Fever Chill", "Tender Sugar", "Robbie"… y una llamada del Walter niño.',
  ver: [ [ "Escuchar la música", "./musica.html" ] ],
  f: [ YT("j_jdsBAegRE") ]
}, {
  s: "audio",
  t: "45 audios sin marcador",
  c: "supuesto",
  d: "De los 261 audios de bgm.sh4, 45 no aparecen en ningún paquete de etapa. No prueba que no se usen: son candidatos.",
  ver: [ [ "Escucharlos", "./musica.html" ] ]
}, {
  s: "audio",
  t: "Videos de monstruos de la E3",
  c: "datos",
  d: "La demo E3 tenía videos m_enemy01, m_enemy_fat, m_enemy_fla… En PC no están: solo quedaron los nombres."
}, {
  s: "e3",
  t: "El título de la demo E3",
  c: "datos",
  img: "snap_title_e3.jpg",
  d: 'La mujer de pelo negro que grita, la puerta con cadenas y la barra de menú de la "trial version".'
}, {
  s: "e3",
  t: '"To be continued" por la mirilla',
  c: "datos",
  img: "snap_trailerend.jpg",
  d: "El final del tráiler, con la calle vista a través de la mirilla. Figura en la tabla, pero nada lo carga."
}, {
  s: "e3",
  t: "Henry de campera marrón",
  c: "datos",
  img: "m_anm_test.jpg",
  d: "anm_test.bin: un Henry temprano de 30 huesos (el final tiene 65), campera marrón y remera verde.",
  ver: [ [ "Ver el modelo", modelo("anm_test") ] ],
  f: [ TCRF ]
}, {
  s: "e3",
  t: "Maniquíes de prueba",
  c: "datos",
  img: "m_anmmix_test.jpg",
  d: "Un maniquí azul (anmmix_test) y tres amarillos (anj002) para probar animaciones.",
  ver: [ [ "El azul", modelo("anmmix_test") ], [ "Los amarillos", modelo("anj002") ] ]
}, {
  s: "e3",
  t: "El menú de debug de la E3",
  c: "datos",
  d: '"DEBUG GAME START", un visor y arranques directos al Bosque, la Prisión y el Edificio. El EXE de PC no tiene ninguna de esas cadenas.'
}, {
  s: "e3",
  t: "La demo de la revista de Xbox",
  c: "internet",
  d: "Bate y hierro 4 desde el principio, stamina infinita, guardado que no anda y sin video de intro.",
  f: [ [ "GameFAQs (Wayback)", "https://web.archive.org/web/20190206124000id_/https://gamefaqs.gamespot.com/xbox/919555-silent-hill-4-the-room/faqs/32269" ] ]
}, {
  s: "e3",
  t: "Tráileres con escenas que no están",
  c: "internet",
  d: "Material hecho a propósito para los tráileres: cámara en mano, Henry le pega a un perro y una puerta con docenas de candados.",
  f: [ SHM("sh4/videos_en.htm") ]
}, {
  s: "curiosidades",
  t: "El director, preso en la radio",
  c: "datos",
  d: 'En las noticias detienen a "Suguru Murakoshi" (el director). Y en otra, la morsa Wally del zoológico de Springfield.',
  leer: {
    arch: "message_room0_b.bin",
    buscar: [ "Murakoshi", "Walrus" ]
  }
}, {
  s: "curiosidades",
  t: "Guiños a otros Silent Hill",
  c: "internet",
  d: "Calles Lynch y King, Rachel de SH2 en el 106, el auto de Jasper es el de James y Frank es su padre.",
  f: [ SHM("sh4/cool_and_scary_things_en.htm") ]
}, {
  s: "curiosidades",
  t: '"Room 302" y el UFO que no fue',
  c: "internet",
  d: 'Iba a llamarse "Room 302". El final UFO no entró porque "a nadie se le ocurrió algo gracioso y no hubo tiempo".',
  f: [ SHM("sh4/post_mortem_en.htm", "Postmortem") ]
}, {
  s: "curiosidades",
  t: "Masahiro Ito no trabajó en SH4",
  c: "internet",
  d: '"Solo pasé unos modelos", dijo el diseñador de los monstruos de SH1 a SH3.',
  f: [ [ "X (adsk4)", "https://x.com/adsk4/status/1446535760820064260" ] ]
} ];

const EN = {
  "confirmado en los datos": "confirmed in the data",
  "según internet": "according to the internet",
  supuesto: "guess",
  Todo: "All",
  "Leer el texto del juego": "Read the game text",
  "Cerrar ✕": "Close ✕",
  tarjetas: "cards",
  "no hay nada con": "nothing matches",
  "cargando el texto…": "loading the text…",
  "no pude leer": "could not read",
  Fuentes: "Sources"
};

const tr = s => sitioIngles() ? EN[s] || s : s;

const $ = id => document.getElementById(id);

const esc = s => String(s).replace(/[&<>"]/g, c => ({
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;"
}[c]));

const filtro = {
  sec: null,
  cert: null,
  q: ""
};

function tarjeta(x, i) {
  const el = document.createElement("article");
  el.className = "tarjeta";
  el.dataset.i = i;
  const img = x.img ? `<div class="img" data-img="sin_usar_img/${x.img}"><img loading="lazy" src="sin_usar_img/${x.img}" alt="${esc(x.t)}"></div>` : "";
  const ver = (x.ver || []).map(([t, h]) => `<a href="${h}">${esc(t)}</a>`).join("");
  const leer = x.leer ? `<button type="button" data-leer="${i}">${tr("Leer el texto del juego")}</button>` : "";
  const f = (x.f || []).length ? `<div class="fuentes">${tr("Fuentes")}: ${x.f.map(([n, u]) => `<a href="${u}" target="_blank" rel="noopener">${esc(n)}</a>`).join("")}</div>` : "";
  el.innerHTML = `${img}<div class="cuerpo"><span class="cert ${x.c}">${tr(CERTEZA[x.c])}</span><h3>${esc(x.t)}</h3><p>${esc(x.d)}</p>${f}<div class="acciones">${ver}${leer}</div></div>`;
  return el;
}

const lista = $("lista");

const bloques = {};

for (const [k, nombre] of SECCIONES) {
  const sec = document.createElement("section");
  sec.dataset.sec = k;
  sec.innerHTML = `<h2 id="${k}">${esc(nombre)} <small></small></h2>`;
  const g = document.createElement("div");
  g.className = "grilla";
  sec.appendChild(g);
  lista.appendChild(sec);
  bloques[k] = {
    sec: sec,
    g: g,
    n: sec.querySelector("small")
  };
}

T.forEach((x, i) => bloques[x.s].g.appendChild(tarjeta(x, i)));

function chips(cont, opciones, clave) {
  const todos = [ [ null, tr("Todo") ], ...opciones ];
  cont.innerHTML = todos.map(([k, n]) => `<button type="button" data-k="${k ?? ""}" class="${(filtro[clave] ?? null) === k ? "si" : ""}">${esc(n)}</button>`).join("");
  cont.onclick = e => {
    const b = e.target.closest("button");
    if (!b) return;
    filtro[clave] = b.dataset.k || null;
    for (const x of cont.children) x.classList.toggle("si", x === b);
    aplicar();
  };
}

chips($("chipsSec"), SECCIONES, "sec");

chips($("chipsCert"), Object.entries(CERTEZA).map(([k, v]) => [ k, tr(v) ]), "cert");

$("buscar").addEventListener("input", e => {
  filtro.q = e.target.value.trim().toLowerCase();
  aplicar();
});

$("buscar").addEventListener("keydown", e => e.stopPropagation());

const sinTildes = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function aplicar() {
  const q = sinTildes(filtro.q);
  let total = 0;
  for (const [k] of SECCIONES) {
    const b = bloques[k];
    let n = 0;
    for (const el of b.g.children) {
      const x = T[+el.dataset.i];
      const texto = sinTildes([ x.t, x.d, x.img || "", ...(x.f || []).map(f => f[0]) ].join(" "));
      const si = (!filtro.sec || filtro.sec === k) && (!filtro.cert || filtro.cert === x.c) && (!q || q.split(/\s+/).every(p => texto.includes(p)));
      el.classList.toggle("oculta", !si);
      if (si) n++;
    }
    b.sec.classList.toggle("oculta", !n);
    b.n.textContent = n ? `· ${n}` : "";
    total += n;
  }
  $("cuenta").textContent = total ? `${total} ${tr("tarjetas")}` : `${tr("no hay nada con")} "${filtro.q}"`;
}

aplicar();

if (location.hash) {
  const k = location.hash.slice(1);
  if (bloques[k]) {
    filtro.sec = k;
    chips($("chipsSec"), SECCIONES, "sec");
    aplicar();
  }
}

const capa = $("capa"), cuerpo = $("capaCuerpo");

const cerrar = () => {
  capa.classList.remove("si");
  cuerpo.textContent = "";
};

capa.querySelector(".cerrar").textContent = tr("Cerrar ✕");

capa.addEventListener("click", e => {
  if (e.target === capa || e.target.classList.contains("cerrar")) cerrar();
});

addEventListener("keydown", e => {
  if (e.key === "Escape" && capa.classList.contains("si")) cerrar();
});

const mensajes = new Map;

async function leerTexto(x) {
  capa.classList.add("si");
  cuerpo.innerHTML = `<div class="texto"><h4>${esc(x.leer.arch)}</h4><p>${tr("cargando el texto…")}</p></div>`;
  try {
    if (!mensajes.has(x.leer.arch)) mensajes.set(x.leer.arch, fetch("/juego/data/" + x.leer.arch).then(r => {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.arrayBuffer();
    }).then(leerMensajes));
    const partes = await mensajes.get(x.leer.arch);
    const hallados = [];
    partes.forEach((lineas, p) => lineas.forEach((l, k) => {
      if (x.leer.buscar.some(b => l.toLowerCase().includes(b.toLowerCase()))) hallados.push([ p, k ]);
    }));
    const items = [];
    const vistos = new Set;
    for (const [p, k] of hallados.slice(0, 24)) {
      for (let j = Math.max(0, k - 1); j <= Math.min(partes[p].length - 1, k + 1); j++) {
        const id = p + ":" + j;
        if (vistos.has(id)) continue;
        vistos.add(id);
        items.push(`<li value="${j}" class="${j === k || hallados.some(([pp, kk]) => pp === p && kk === j) ? "marca" : ""}" title="parte ${p}, mensaje ${j}">${esc(partes[p][j] || "")}</li>`);
      }
    }
    cuerpo.innerHTML = `<div class="texto"><h4>${esc(x.t)} · data/${esc(x.leer.arch)}</h4><ol>${items.join("") || "<li>—</li>"}</ol></div>`;
  } catch (e) {
    cuerpo.innerHTML = `<div class="texto"><h4>${esc(x.leer.arch)}</h4><p>${tr("no pude leer")}: ${esc(e.message)}</p></div>`;
  }
}

lista.addEventListener("click", e => {
  const b = e.target.closest("[data-leer]");
  if (b) {
    leerTexto(T[+b.dataset.leer]);
    return;
  }
  const im = e.target.closest("[data-img]");
  if (im) {
    capa.classList.add("si");
    cuerpo.innerHTML = `<img src="${im.dataset.img}" alt="">`;
  }
});

window.sh4sinUsar = {
  T: T,
  aplicar: aplicar,
  filtro: filtro,
  leerTexto: leerTexto
};
