# Editor VR

Escena en realidad virtual (WebXR, con [A-Frame](https://aframe.io) 1.7) para Meta Quest, de
estética feudal: salas de piedra, suelos y techos de madera con vigas, puertas de tablones con
herrajes de hierro y una gran escalera al estilo de la Escalera Dorada de la catedral de Burgos.
La escena se reparte en archivos de texto (ver [Archivos](#archivos)); las texturas (madera,
piedra) se dibujan en el propio navegador, sin imágenes externas, y las piezas más trabajadas
(puertas, antorchas, estatuas) son modelos de Blender.

Se edita hablando con Claude: desde las gafas (por voz) o desde el ordenador. Claude sabe dónde
estás en la escena y qué miras, modela en Blender lo que haga falta, y tú puedes ver el escritorio
del PC dentro de la escena. Lo que se ha ido haciendo, paso a paso: [HISTORIAL.md](HISTORIAL.md).

## La escena

Coordenadas en metros: **x** hacia la puerta de la sala 1 y el pasillo, **y** hacia arriba,
**z** hacia atrás (la ventana de la sala 1 está en z = -3).

| Zona | Dónde | Qué hay |
|---|---|---|
| **Sala 1** | 6 × 6 m, 3 m de alto (x, z = -3…3) | Paredes de piedra, suelo de tablas, techo de madera con 5 vigas. Ventana rústica hundida en el muro (marco de madera con 12 cuarterones, alféizar; por ella se ve el campo de fuera). Mesa, silla y biblioteca en la esquina. La pantalla del PC, a la izquierda de la ventana. |
| **Pasillo** | 6 m (x = 3…9), 1,2 m de ancho | Paredes de piedra y suelo de madera. Puerta a la sala 1, puerta a la sala 2 al fondo y, a mitad, a la derecha, puerta a la sala 3. |
| **Sala 2** | 5 × 5 m (x = 9…14) | Como la sala 1: piedra, techo con vigas, ventana rústica, biblioteca, mesa separada de la pared y silla pegada a ella. |
| **Patio** | 6 × 6 m, fuera (x = 3…9, z = -6,6…-0,6) | Patio de armas entre la sala 1 y la sala 2: se sale por la puerta de la pared izquierda del pasillo, enfrente de la de la sala 3. Suelo de losas, muralla almenada de 4 m, pozo con postes sobre el brocal, torno con manivela y cubo de duelas con aros y asa, antorchas junto a la puerta y cielo. |
| **Exterior** | Campo alrededor de todo el castillo | Se sale por el portón en arco de la muralla del patio. Hierba, camino de tierra, árboles y colinas a lo lejos. Las salas 1 y 2 tienen piel por fuera y las galerías de arriba se ven como cadalsos de madera. |
| **Bosque** | Otra zona, al final del camino del exterior (x = -24…36, z = -100…-46) | El camino sigue serpenteando entre los árboles hasta un claro con piedras. Ver [Zonas](#zonas). |
| **Pasillo 2** | 3,4 m (x = 5,4…6,6, z = 0,6…4) | Ramal que lleva a la sala 3. A mitad, una antorcha de pared en cada lado, con la llama y la luz temblando. |
| **Sala 3** | 12 × 10 m, 7,5 m de alto (x = 0…12, z = 4…14) | La grande. Muros de piedra de 40 cm con arcos arriba, techo con 8 vigas y la escalera. |
| **Comedor** | 12 × 10 m, 4,2 m de alto (x = -12,4…-0,4, z = 4…14) | A la derecha de la sala 3 entrando, por un gran arco con dovelas en su muro, guardado por dos guardias con lanza y escudo. Suelo de losas, techo de madera con 8 vigas, tres ventanas en arco con reja, chimenea con hoguera, mesa de 7 m con bancos y sillón, dos lámparas de rueda, estandartes y antorchas. Un criado con una jarra da vueltas a la mesa. |
| **Pasillos de arriba** | Alrededor de la sala 3, por fuera de sus muros, a 4,4 m | Suelo de madera, techo y muro exterior de piedra. Se ven desde la sala por los arcos. |

**La escalera de la sala 3** ocupa toda la pared del fondo, de pared lateral a pared lateral:

1. Un tramo central ancho sube hasta un rellano (1,2 m), delante de un nicho.
2. Desde ahí, por delante, un tramo hacia cada lado hasta un rellano (2 m) que llega a la pared
   lateral. Debajo de cada uno, un **arco ciego** de piedra.
3. Desde cada rellano, pegados al fondo, los tramos vuelven hacia el centro y se juntan en el
   rellano de arriba (4,4 m). Allí, un arco del muro lleva a los **pasillos de arriba**.

Al pie del tramo central, a cada lado, un caballero de piedra sobre su pedestal, mirando a la
entrada. El frente de la escalera es de sillares de piedra, las pisadas de losas de roca y las barandillas
doradas. Se puede subir andando; los tramos son macizos y no se pueden atravesar.

## Zonas

El mundo se reparte en zonas (`ZONAS` en [js/zonas.js](js/zonas.js): `castillo`, con todas las
estancias de arriba, y `bosque`) y **solo hay una cargada a la vez**. Es la misma página, así que no
se sale de VR. Todas usan las coordenadas del mundo: el jugador no se teletransporta, el camino sigue.

- **Niebla:** a menos de 10 m del final del camino (x = 6, z = -45) se espesa. Al cruzarlo se cierra
  del todo, no se puede andar, se cambia de zona y se abre al terminar. Volver funciona igual.
- **Letrero:** al entrar en una zona (también al abrir la página) aparece delante de ti una tabla de
  madera con su nombre (`titulo` en `ZONAS`), unos 5 s, y se desvanece.
- **Al salir de una zona:** se liberan geometrías, materiales y texturas (`liberarEstancia`), se
  quitan sus entidades y se vacía `SUPERFICIES`. Las puertas vuelven a estar cerradas al regresar.
- **Comprobar que no se pierde memoria:** el medidor enseña las geometrías y texturas vivas
  (`geo`, `tex`), que deben volver a los mismos valores tras cada ida y vuelta.

Para añadir una zona: sus archivos en `salas/`, su título y su lista en `ZONAS`, su rectángulo en `zonasPermitidas`
(unido por un paso) y su límite en el `tick` de `zonas`.

## Controles

**Meta Quest** (abre la página y pulsa el botón **VR**):

| Control | Qué hace |
|---|---|
| **Joystick izquierdo** | Andar hacia donde miras. Sube y baja escalones; no deja atravesar paredes ni puertas cerradas, ni caerse. |
| **Joystick derecho** a un lado | Girar 30°. |
| **Gatillo** apuntando a una puerta | Abrirla o cerrarla (el rayo se pone verde, la aldaba brilla y sale el cartel). |
| **Gatillo lateral** apuntando a la pantalla | Cogerla y colocarla; se queda donde la sueltes. |
| **Botón B o Y** | Traer la pantalla del PC delante de ti. |
| **Botón X** o **apretar el joystick izquierdo** | Ocultar o enseñar el medidor de rendimiento, que sale encendido (en el ordenador, tecla **M**). |

En VR cuenta tu altura real. Si estás sentado (las gafas, de media, por debajo de 1,30 m durante
unos segundos), la escena te sube **35 cm** (`SUBIR_SENTADO` en js/movimiento.js); al ponerte de
pie, vuelve a tu altura.

**Ordenador:** clic para capturar el ratón, **WASD** o flechas para andar (igual que el joystick:
con choques y escalones), clic con la mira en una puerta para abrirla, **Esc** suelta el ratón.

**Mando de Xbox en el ordenador** (por cable, Bluetooth o adaptador; el navegador lo detecta al
pulsar cualquier botón con la página delante; dentro de las gafas no cuenta):

| Mando | Qué hace |
|---|---|
| **Stick izquierdo** | Andar, con los mismos choques y escalones. |
| **Stick derecho** | Mirar alrededor (girar y mirar arriba o abajo). |
| **A** | Abrir o cerrar la puerta que hay en la mira. |
| **B** | Traer la pantalla del PC delante. |
| **LB / RB** | Girar 30° a la izquierda / derecha. |
| **Vista** (dos cuadraditos) | Recalibrar los sticks: soltarlos y pulsarlo si la vista o el jugador se mueven solos. |

Este mando resbala solo: sin tocarlo, el eje vertical derecho va despacio (unos 0,1 por segundo) de 0
a -0,681 y se queda ahí, y al tocarlo vuelve a 0. Por eso un eje no cuenta hasta que da un salto rápido,
como el que da una mano (`SALTO_MANO`, `SALTO_MS`), y deja de contar al soltarlo, si marca lo mismo
al milésimo 0,7 s o si, a medias, no se separa de un punto en 2 s (`QUIETO_MS`: el izquierdo se quedó en
-0,65 tras soltarlo y se andaba solo); mientras no cuenta, lo que marque es su reposo. Un stick movido muy despacio no se
nota hasta el primer movimiento rápido. Mirar va al cuadrado de la inclinación, para apuntar despacio, y en vertical al 60 %
de la velocidad (`MIRAR_VERTICAL`). El informe de posición (`/__posicion`)
incluye los mandos que ve el navegador y lo que marcan, para diagnosticar.

Al recargar la página vuelves al sitio donde estabas y la pantalla sigue donde la dejaste (se
guarda en el navegador). Si se cambia en el código el punto de inicio (ahora, la sala 3 mirando
a la escalera), se empieza en el nuevo.

## Servidor local

WebXR exige HTTPS, así que hay un servidor en [servidor/servidor.js](servidor/servidor.js):

1. Doble clic en `servidor/iniciar.cmd` (o `node servidor/servidor.js`; otro puerto como
   argumento).
2. En el Quest abre `https://<IP del PC>:8443/` y acepta el aviso del certificado casero la
   primera vez.
3. En el PC también se puede abrir `http://localhost:8080/` (sin certificado, solo desde este
   PC; es la que usa la vista previa del navegador integrado de Claude).

Cada vez que se guarda un archivo, la página se recarga sola (en VR hay que volver a pulsar
**VR**). La primera vez crea `servidor/cert.pem` y `servidor/key.pem` (fuera de git); si cambia
la IP del PC, bórralos y vuelve a arrancar.

Además de servir los archivos, el servidor guarda en memoria lo que se intercambian la escena,
el PC y Claude:

| Dirección | Quién escribe (POST) | Quién lee (GET) |
|---|---|---|
| `/__pantalla.jpg` | `emisor.html`, una imagen por segundo | La pantalla de la escena (caduca a los 5 s) |
| `/__posicion` | La escena, cada segundo | Claude: dónde estás, zona, hacia dónde miras y qué tienes delante |
| `/__vista.jpg` | (pendiente: la escena aún no la manda) | Claude: la última foto de lo que ves |
| `/__recarga` | — | La página, para recargarse al guardar |

Mientras se comparte la pantalla, cualquiera en la misma wifi que abra la página puede verla.

## Pantalla del PC

1. Con el servidor arrancado, abre en el PC `https://localhost:8443/emisor.html`.
2. Pulsa **Compartir** y elige qué compartir.
3. Aparece en la pantalla de la escena. Para dejar de compartir, **Parar** o cierra la pestaña.

- **"Sin imagen del PC":** el PC no está enviando (pestaña cerrada, o se reinició el servidor:
  vuelve a pulsar **Compartir**).
- **Se ve en negro:** comparte **Toda la pantalla** en vez de una ventana; Windows suele capturar
  en negro las ventanas de apps con aceleración gráfica (como Claude).
- La captura se hace desde el navegador (eliges tú qué se comparte): un script de PowerShell lo
  bloquea Windows Defender por parecerse a software espía.

## Dónde estás y qué ves (para Claude)

- `/__posicion` (JSON): `zona` (sala 1, pasillo, sala 2, pasillo 2, sala 3, en la escalera,
  rellano de arriba, pasillos de arriba, comedor, patio, exterior), `cabeza`, `suelo` (con la altura que pisas),
  `direccion`, `rumbo` (0 = hacia la ventana de la sala 1, 90 = hacia la puerta, 180 = hacia
  atrás) y `mira`: el punto, la distancia y el objeto que tienes delante. Así Claude puede
  colocar cosas "donde estoy" o "donde miro".
  También `mandos`: los mandos que ve el navegador y lo que marcan (para el de Xbox).
- `/__vista.jpg`: **pendiente.** La escena nombra un componente `foto-para-claude` que nunca se
  llegó a programar; el servidor ya guarda la foto si alguien la manda. Hasta entonces, mandar
  capturas a Claude a mano.

## Cómo está hecho

### Archivos

| Archivo | Qué tiene |
|---|---|
| [index.html](index.html) | La escena: el jugador (`rig`, cámara y mandos) y la luz general. |
| [salas/](salas/) | Una estancia por archivo, en coordenadas del mundo: `sala1.html`, `pasillo.html`, `sala2.html`, `pasillo2.html`, `sala3.html`, `comedor.html` (lo fijo), `comedor-vivos.html` (lo que se mueve y los obstáculos), `patio.html`, `exterior.html`, `bosque.html`. Solo etiquetas de A-Frame. |
| [js/zonas.js](js/zonas.js) | Qué estancias tiene cada zona, cambio de zona y niebla. |
| [js/incluir.js](js/incluir.js) | Componente `incluir`: descarga una estancia y la mete en la escena. |
| [js/movimiento.js](js/movimiento.js) | Andar, girar, zonas, `SUPERFICIES`, obstáculos `macizo` y la mira del monitor. |
| [js/arboles.js](js/arboles.js) | Árboles dibujados en bloque, con versión de cerca y de lejos según la distancia. |
| [js/texturas.js](js/texturas.js) | Texturas de canvas y `suelo-madera`, `pared-piedra`, `piedra-mundo`. |
| [js/objetos.js](js/objetos.js) | Puerta, antorcha, estatua, biblioteca, escalera, muros con arcos, pasillos de arriba, y lo del comedor (hoguera, lámpara de rueda, mesa, estandarte). |
| [js/rendimiento.js](js/rendimiento.js) | Para el Quest: al cargar cada estancia junta lo fijo en pocas mallas (`fundirEstancia`), y solo usa 6 luces puntuales, siempre las mismas, que copian a las más cercanas (`luces-cercanas`: si cambia cuántas luces hay, el navegador recompila y da un tirón). |
| [js/medidor.js](js/medidor.js) | Medidor de rendimiento: imágenes por segundo (y la peor), llamadas de dibujo, triángulos y luces. |
| [js/conexion.js](js/conexion.js) | Pantalla del PC, objetos que se cogen e informe de posición para Claude. |
| [modelos/](modelos/) | Modelos de Blender (`.glb`) y el `.blend` para retocarlos. |

Para añadir una estancia: un archivo nuevo en `salas/`, su nombre en `ZONAS` (js/zonas.js), y
sus zonas en `js/movimiento.js` (`zonasPermitidas`) si se puede andar por ella.

### Componentes

- **Movimiento:** `andar-joystick` (joystick, teclado y mando de Xbox en el PC), `giro-por-pasos`. Las zonas por las que
  se puede ir (`SALA`, `PASILLO`, …, `PASILLOS_ARRIBA`) se unen por puertas abiertas
  (`zonasPermitidas`); las alturas que se pisan están en `SUPERFICIES` (`sueloEn`: escalones de
  hasta 35 cm, sin caídas, sin atravesar lo macizo). Desde el HTML de una sala, `macizo="ancho; fondo;
  alto"` añade un obstáculo que no se puede atravesar (la chimenea del comedor).
- **Materiales:** `suelo-madera`, `pared-piedra` (planos), `piedra-mundo` (cajas, con la textura
  alineada en el mundo; `tono` la tiñe), `suelo-hierba` (el campo), `camino` (cinta de tierra con curvas
  por una lista de puntos, con el borde fundido con la hierba; no impide andar fuera de ella) y `claro`
  (círculo de tierra igual).
- **Objetos:** `puerta`, `antorcha` (carga el modelo, pone su luz, salvo con `luz: false`, y hace temblar la llama), `estatua` (caballero con
  pedestal macizo), `biblioteca`, `escalera-sala3`, `muro-arcos` (con `entrada` a ras de suelo,
  recta o en arco con `entradaArco`), `arco-ciego` (con `hueco: false`, marco de dovelas de un arco
  abierto), `pasillos-arriba`; en el comedor, `hoguera`, `lampara-rueda`, `mesa-comedor` (mesa,
  bancos, sillón, vajilla y candeleros; maciza), `estandarte`, `guardia` (quieto, respira, te mira, te saluda y es macizo) y `criado` (anda por una ruta de
  puntos, mueve piernas y brazo, respira, te sigue con la cabeza y te saluda si te acercas).
- **Modelos de Blender** en `modelos/` (glTF binario, `.glb`), con `gltf-model="url(modelos/...)"`:
  `antorcha.glb` (`Soporte`, una sola pieza con el hierro, el mango y la brea, y la `Llama`
  aparte para que tiemble).
  Su origen es el punto de la placa que toca la pared y sale hacia +z: se pone en la pared y se
  gira para que mire a la sala (90° si la pared mira a +x, -90° si mira a -x, 180° si mira a -z).
  - Puertas: `puerta.glb` (hoja de 0,9 × 2,05 m) y `puerta-ancha.glb` (1,04 × 2,32 m, la de la
    sala 2): tablones con juntas, delante bisagras largas con punta de lanza, clavos y escudo de
    cerradura, detrás travesaños con tornapuntas, y la aldaba a los dos lados. El origen es la
    bisagra, abajo; la aldaba es un nodo aparte llamado `Aldaba` que el componente `puerta`
    hace brillar. Los tableros de cajas se quitaron; quedan, invisibles, la caja y las esferas
    que recibe el rayo.
  - Marcos: `marco-puerta.glb` y `marco-ancho.glb`, jambas de sillares (hiladas alternas que
    sobresalen) y dintel adovelado de cinco piezas. Origen en el centro del hueco, a ras de suelo.
  - `caballero.glb`: estatua de piedra (yelmo cerrado, sobreveste, capa, espada y escudo) sobre
    pedestal de sillares; 2,6 m en total, origen en el centro de la base, mira hacia +z.
  - `criado.glb`: criado de 1,77 m (túnica, delantal, capucha, jarra de barro). Piezas aparte
    para animarlo: `Cuerpo`, `Cabeza` (pivote en el cuello), `PiernaD` / `PiernaI` (muslos, en la
    cadera) con `EspinillaD` / `EspinillaI` colgando de ellos (en la rodilla) y `BrazoI` (en el hombro). Origen entre los pies; mira hacia +z.
  - `guardia.glb`: guardia con cota de malla, sobreveste granate con cruz, yelmo con nasal, lanza
    y escudo de cometa. Piezas `GuardiaCuerpo` y `GuardiaCabeza` (pivote en el cuello); 2,6 m con
    la lanza; origen entre los pies; mira hacia +z.
  - `arboles.glb`: tres árboles (`Arbol1`, `Arbol2`, `Arbol3`), con el color en los vértices. Cada uno,
    `_Cerca_` (ramas, raíces y mechones; unos 3.000 triángulos) y `_Lejos_` (unos 420), con `_Tronco` y
    `_Copa`. Origen en la base. Si cambia lo que miden, actualizar `ALTO_MODELOS` en js/arboles.js.
  - `modelos.blend`: el archivo de Blender con todos, para retocarlos y volver a exportar.
- **Conexión con el PC y Claude:** `pantalla-pc`, `agarrable`, `informe-posicion`
  (`foto-para-claude`, pendiente).
- **Rendimiento:** `fundirEstancia` (al cargar cada sala), `fundirMallas` (piezas de un mismo
  objeto, como la lámpara de rueda), `luces-cercanas` y `medidor`. Ver [Rendimiento](#rendimiento).
- **Carteles con texto:** `cartelDeTexto` (objetos.js) dibuja el texto en un canvas: la letra de
  `a-text` no tiene ñ, ¿ ni tildes.

## Rendimiento

El límite es el Quest, no el modelado. Para que vaya fluido (72–90 imágenes por segundo):
**pocas llamadas de dibujo** (unas 100–200 por imagen; cada malla a la vista es una), triángulos
de sobra (cientos de miles) y **pocas luces puntuales** (cada una encarece todo lo que se dibuja).
El navegador descarta lo que queda fuera de la vista, pero no lo que está tapado detrás de un muro:
lo peor es mirar el castillo entero desde fuera.

- **Lo fijo se funde:** al cargar cada estancia, todas sus cajas, planos y piezas fijas se juntan en
  unas pocas mallas, una por clase de material (el color de cada pieza va en sus vértices y la
  colocación de la textura en sus coordenadas). No se funden las puertas, los personajes, las
  llamas, la pantalla, los carteles, los modelos de Blender ni lo que recibe el rayo (`.clicable`).
  El HTML de las salas no cambia. Con `?sinfundir` en la dirección se carga sin fundir.
- **6 luces fijas:** las luces de la escena no se dibujan; 6 luces que siempre están encendidas
  copian a las 6 más cercanas. Si cambiara cuántas luces hay, el navegador recompilaría los
  materiales y daría un tirón (pasaba al entrar en las salas).
- **Árboles en bloque** ([js/arboles.js](js/arboles.js)): `arbol="alto; semilla"` no crea mallas; todos
  se dibujan con `InstancedMesh`, unas 12 llamadas como mucho sean cuantos sean. A menos de 18 m usan
  la versión de cerca y a más de 22 m la de lejos.
- **Modelos de Blender en pocas piezas:** una por material, salvo lo que se anima aparte.
- **Medidor** (botón X, joystick izquierdo apretado o tecla M): imágenes por segundo, la peor,
  llamadas, triángulos y luces.

Medido en el Quest (octubre de 2026), antes y después de fundir y de las 6 luces:

| Dónde | Llamadas | Imágenes por segundo |
|---|---|---|
| Fuera, de frente al castillo | 1.097 → 189 | 25 → 76–82 |
| Frente a la escalera de la sala 3 | 502 → 86 | 44 → 90 |
| Comedor | 449 → 83 | 55 → 88–90 |

Si algún día no llega: ocultar el interior de las salas cuando se está fuera, cargar las salas
según uno se acerca.

### Horneado

Todo el castillo lleva la luz calculada en Blender, salvo lo que se mueve, lo transparente, la hierba,
el camino, las colinas y los árboles (el bosque, tampoco). El **botón A** (en el ordenador, la tecla
**H**) recarga el castillo con o sin ella, sin salir de VR; sin hornear, sale el letrero "Sin hornear".
Con **`?sinhornear`** en la dirección se empieza sin ella.

- **Las estancias se cargan igual**, con sus componentes y obstáculos; solo cambia lo que se dibuja:
  sus piezas fijas se ocultan y va en su lugar `modelos/horneado/<sala>.glb` con `<sala>-luz.jpg`
  (`hornearEstancia`, en rendimiento.js), con materiales que no calculan luces. Personajes y puertas
  siguen usando las 6 luces. Estatuas y marcos de piedra también van horneados (`MODELOS_HORNEADOS`).
- **Lo horneado no se actualiza solo:** después de cambiar algo fijo de una estancia, hay que regenerarlo
  (no retocar los modelos a mano):
  1. `node herramientas/recibir-estancia.js <carpeta>`.
  2. Abrir la página con `?sinhornear&sinfundir` y, en la consola, la línea `fetch(...)` que hay
     encima de `exportarCastillo`, en rendimiento.js.
  3. `blender --background --python herramientas/hornear-castillo.py -- <carpeta>/castillo.json <salida> 256`
     (minuto y medio) y copiar a `modelos/horneado/` los `.glb`, los `.jpg` y `castillo.blend`. Los vatios
     por unidad de luz, el sol y el cielo se ajustan en ese script.
- Las puertas y los personajes no están en Blender: no dan sombra, y la luz pasa por las puertas como si
  estuvieran abiertas.

Medido en la vista previa del PC (octubre de 2026), sin y con horneado; **falta medirlo en el Quest**:

| Dónde | Llamadas | Triángulos |
|---|---|---|
| Fuera, de frente al castillo | 200 → 159 | 158 mil → 158 mil |
| Frente a la escalera de la sala 3 | 28 → 15 | 39 mil → 39 mil |
| Comedor | 36 → 31 | 47 mil → 69 mil |

## Trabajar con Claude

- Por voz desde las gafas, y el modo Quest / modo ordenador: [VOZ.md](VOZ.md).
- Instrucciones para Claude en este proyecto: [CLAUDE.md](CLAUDE.md).
- Lo que se ha hecho y por qué: [HISTORIAL.md](HISTORIAL.md).
