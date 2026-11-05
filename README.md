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
| **Patio** | 6 × 6 m, fuera (x = 3…9, z = -6,6…-0,6) | Patio de armas entre la sala 1 y la sala 2: se sale por la puerta de la pared izquierda del pasillo, enfrente de la de la sala 3. Suelo de losas, muralla almenada de 4 m, pozo con postes sobre el brocal, torno con manivela y cubo de duelas con aros y asa (con el gatillo, el cubo baja y sube con agua), antorchas junto a la puerta y cielo. |
| **Exterior** | Campo alrededor de todo el castillo | Se sale por el portón en arco de la muralla del patio. Hierba, camino de tierra, árboles y montañas alrededor. Las salas 1 y 2 tienen piel por fuera y las galerías de arriba se ven como cadalsos de madera. |
| **Bosque** | Al final del camino del exterior (x = -78…88, z = -198…-46) | Colinas de hasta unos 10 m, a mediodía. El camino lleva a un claro con piedras y se abre hacia el lago, el poblado y la montaña. |
| **Lago** | Al norte del bosque (x = -78…88, z = -392…-202) | Mediodía. Lago con embarcadero en la orilla sur, en la isla (con una torre vieja) y en la orilla norte; una barca lleva de uno a otro. |
| **Poblado** | Al este del bosque (x = 92…228, z = -190…-50) | Mediodía. Calle con once casas de tablas y muchos árboles entre ellas, plaza con pozo (igual que el del patio del castillo: se saca agua con el gatillo) y mercado, iglesia con torre, un guardia en la entrada, delante de su garita, y una moza. Junto a la plaza, dos edificios: la **taberna** (Las Chatungas, de madera; chimenea, mostrador con el camarero y dos mesas con clientes) y la **posada** (La Parada, piedra abajo y tablas arriba): abajo, entrada con el posadero y escalera; arriba, un pasillo con cinco habitaciones, tres que se visitan y dos cerradas. La del noroeste es la tuya, con la puerta cerrada al empezar: se abre con el gatillo (`puerta` con `bloquea`). A los pies de la cama, un cofre. |
| **Montaña** | Al oeste del bosque (x = -282…-82, z = -228…-10) | Mediodía. Cumbre nevada de unos 50 m a la que se puede subir, con mojón y atalaya. |
| **Acantilado** | Al este del poblado (x = 232…327, z = -190…-50) | Atardecer sobre el mar. Llano a 20 m cortado a pico, faro con fuego, banco y farallones. |
| **Puerto y playa** | Al norte del acantilado, con salida al mar (x = 92…345, z = -395…-202) | Mediodía. Solo se llega por el camino de la orilla norte del lago. Muelle de piedra, tres embarcaderos con barcas, casas de pescadores, barriles y redes. Siguiendo la costa al sur, una playa con barcas varadas, que acaba contra el acantilado. |
| **Capilla** | Enfrente del comedor, al otro lado de la sala 3 (x = 12,4…24,4, z = 4…14) | Simétrica del comedor: arco con dos guardias, bancos, altar con cruz, tres vidrieras y lámpara de rueda. |
| **Mazmorras** | Bajo tierra (x = 1345…1355). Se baja por la puerta del arco ciego de la derecha de la escalera de la sala 3 | Pasillo con celdas enrejadas, una abierta, y la sala del carcelero. Solo antorchas. Se llega arriba de la escalera, que se baja andando, y se sale subiéndola. |
| **Cueva** | Bajo tierra (x = 1004…1130). Se entra por la boca de roca, al este del camino del bosque | Túnel que se abre a una gran sala con lago oscuro, cristales que brillan y estalactitas. |
| **Abadía en ruinas** | Al norte de la montaña (x = -282…-82, z = -430…-232) | De noche, con luna y estrellas. Nave sin techo, columnas rotas, camposanto y hogueras. |
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

El mundo se reparte en zonas (`MUNDO` en [js/mundo.js](js/mundo.js)) y **solo hay una cargada a la vez**. Es la misma página, así que no
se sale de VR. Todas usan las coordenadas del mundo: el jugador no se teletransporta, el camino sigue.

- **Pasos:** entre dos zonas solo se pasa por un hueco (`PASOS`), porque sus zonas de andar quedan separadas 2 m. A menos de 10 m la
  niebla se espesa. Al cruzar se cierra del todo, no se puede andar, se cambia de zona y se abre al terminar.
- **Hora:** cada zona tiene la suya (`cielo` en `MUNDO`, recetas en `CIELOS`, js/texturas.js): cielo, niebla y luz general
  cambian con la niebla cerrada.
- **Montañas del castillo:** `montes` (texturas.js), una malla alrededor, sin hornear.
- **Terreno:** `altura` de cada zona; `alturaTerreno` da la de la zona cargada, plana alrededor de los pasos. La usan el andar, los
  árboles, el camino, la valla y la malla `terreno` (de hierba o, con `color`, pintada por vértices). Por debajo de `agua` no se pisa.
- **Límites:** una valla luminosa invisible (`barrera`, objetos.js) se enciende a menos de 4 m del borde, y de lejos no se dibuja.
  Si cambia un límite o un paso, hay que cambiarla también (`huecos`).
- **Pendiente:** habitaciones en la planta de arriba del castillo.
- **Portales** (`portal`, js/animales.js): un cartel; al apuntarle y apretar el gatillo te lleva a otra zona con la niebla cerrada. Así se baja a mazmorras y cueva, que están lejos del resto.
- **Animales:** `ciervo` (también las cabras; bosque y montaña), `peces` con el cartel de la zona de pesca (lago) y `pinos` (montaña).
- **Viaje rápido** (js/mapa.js): en el mapa hay un sello por lugar (ni la taberna, ni la posada, ni la isla). Las zonas aún no visitadas salen tapadas con niebla (`pintarMapa`). Apuntar a un sello con el mando derecho y apretar el gatillo. Con misión se pagan todas las zonas del camino más barato (del lago a la posada, bosque y poblado: 2). El sello de una zona se activa al visitarla, y una partida nueva empieza sin ninguno salvo el del poblado; la partida 1 es la de depuración (`PARTIDA_DEPURACION`, `partida.depuracion()`, js/partida.js; el menú lo pone): tiene el mapa entero, sin niebla y con todos los sellos, el medidor y el cambio de luz horneada (y la ayuda los enseña solo allí). Publicada en GitHub Pages (*.github.io) no hay partida de depuración: solo en el servidor de casa.
- **Barca** (js/lago.js): apunta con el rayo a un cartel suyo y aprieta el gatillo. Te lleva sin dejarte andar y te deja en el embarcadero.
  Modelo: `herramientas/modelar-barca.py` → `modelos/barca.glb`.
- **Letrero:** al entrar en una zona (también al abrir la página) aparece delante de ti una tabla de
  madera con su nombre, unos 5 s, y se desvanece.
- **Al salir de una zona:** se liberan geometrías, materiales y texturas (`liberarEstancia`), se
  quitan sus entidades y se vacía `SUPERFICIES`. Las puertas vuelven a estar cerradas al regresar.
- **Rayo:** se pone verde sobre lo que se puede usar (`rayo-verde`): puertas, el tabernero, el cofre, carteles.
- **Comprobar que no se pierde memoria:** el medidor enseña las geometrías y texturas vivas
  (`geo`, `tex`), que deben volver a los mismos valores tras cada ida y vuelta.

Para añadir una zona: su entrada en `MUNDO`, sus `PASOS`, su archivo en `salas/`, su `barrera` y su nombre en `SALAS_HORNEADAS` y
`SUELOS_HORNEADOS` (rendimiento.js), y hornearla.

## El juego

Diseño y lo que falta: [JUEGO.md](JUEGO.md). Estado y reglas: [js/partida.js](js/partida.js), guardados en el navegador (`editorvr-partida-1` a `-3`, cada una con sus zonas visitadas y su sitio); en la consola se ve en `partida.estado`.

**Menú principal** ([js/menu.js](js/menu.js), [salas/menu.html](salas/menu.html), la zona `menu`): al abrir la página se llega a una sala con una tabla de tres partidas, cada una con **Continuar** y **Borrar** (pregunta antes), o **Nueva partida** si está vacía. Es un gran salón de piedra (20 × 15 m, 10 de alto), lo primero que se ve: la tabla al fondo entre dos caballeros de piedra (`estatua`) y dos antorchas; delante, un mosaico con una rosa de los vientos (`mosaico`) donde cae, en diagonal, la luz de la luna, con motas grandes para verlas desde el fondo, que entra por un óculo del techo (`oculo`, js/menu.js: el cielo de noche con estrellas, la luna y nubes que pasan, el haz con motas, que es un cilindro oblicuo con la boca plana en el hueco y la otra donde cae, y el charco de luz; el techo tiene el hueco y el marco redondo tapa sus esquinas); una alfombra granate hasta el mosaico; columnas y arcos ciegos a los lados, cada uno con su estandarte y un candelabro de pie de hierro contra la pared (`candelabro`, modelo `herramientas/modelar-candelabro.py` → `modelos/candelabro.glb`, con luz de verdad para que la pared se ilumine y se hornee); y un techo de vigas con dos lámparas de rueda. La luz general es baja (`ambiente` del menú). Va horneado como las estancias (`menu` en `SALAS_HORNEADAS`): al cambiar algo fijo, hay que hornearlo de nuevo; lo de `NO_FUNDIR` (óculo, mosaico, candelabros, tabla) no se hornea. Se puede andar por él (`andar` en `MUNDO.menu`); al entrar te deja a 3,4 m de la tabla (`MENU_SITIO`), al alcance del rayo. Antes hubo un rosetón con un haz encima de la tabla y braseros: se quitaron porque no gustaron. Una partida nueva empieza en tu habitación de la posada; al continuarla se vuelve al sitio donde se dejó. Desde el juego se vuelve con **Salir al menú**, en el diario, sin salir de VR. Al recargar la página jugando se sigue en la misma partida (`sessionStorage`), y con **`?partida=1`** en la dirección se entra directo a esa partida sin pasar por el menú. La partida de cuando solo había una pasa sola a la primera.

- **Tutorial** (`partida.pasoTutorial`): guía la primera partida hasta la boda: bienvenida, abrir tu puerta, hablar con el posadero, aceptar el encargo del tabernero, puntos e ir al lago, cómo abrir el mapa y cómo correr, pescar, volver por el mapa, dormir en la cama e ir a la boda. Cada paso sale en un aviso largo, con el icono de un libro abierto, y en el diario; un rombo dorado (`marca-paso`) señala lo que toca, y un aro en el mapa, la zona. Se calcula del estado: si se pierde el pescado, vuelve a pedirlo. Lo que se dice hablando con alguien cuenta al cerrar la charla (el posadero), y mientras se habla con el tabernero el tutorial espera (`partida.charlaAbierta`), para que el aviso no salga encima de la tabla; y el aviso no repite lo que acaba de decir el personaje, lo completa.
- **Puntos de acción:** cada día trae los suyos: con misión, su presupuesto; **sin misión, 30** (`PUNTOS_LIBRE`). Todo cuesta igual con misión que sin ella: entrar en una zona, su precio (`PRECIOS_ZONA`), y andar dentro es gratis; pescar, cazar, talar y picar, lo suyo. Comer da puntos. Las partidas de antes, sin misión, se abren con 30.
- **Ciervos** (`ciervo`, js/animales.js; modelo `herramientas/modelar-ciervo.py` → `modelos/ciervo.glb`: cuerpo, cuello con cabeza, astas aparte y cuatro patas con su pivote): pastan en una llanura al oeste del bosque (`LLANURA_CIERVOS`, js/mundo.js: llana en 14 m), para que las patas no se hundan en las cuestas.
- **Boca de la cueva:** en la ladera del oeste de una loma del terreno (`LADERA_CUEVA`, js/mundo.js), con un rellano delante y un camino corto que sube a él; rocas medio enterradas tapan el encuentro del arco con la ladera. Al salir de la cueva se aparece en el rellano.
- **Árboles con detalle** (js/arboles.js): de cerca, con ramas y mechones; de lejos, sencillos. Cambian a 18 m (`DIST_CERCA`), salvo en la zona que diga otra cosa (`arbolesCerca` en `MUNDO`): en el poblado, de prueba, 40 m. En la plaza son 12 árboles más con detalle y unos 33 000 triángulos más (de 68 000 a 100 000, medido en la vista previa); falta ver en el Quest si se nota.
- **Antes de gastar puntos, una pregunta** ([js/pregunta.js](js/pregunta.js), `preguntarGasto`): al pasar andando a otra zona, al viajar por el mapa, al cruzar una puerta o escalera que lleva a otra zona y al pescar sale delante un cartel de pergamino con un dibujo de lo que se va a hacer (la foto del sitio al que vas y, debajo, de dónde a dónde, con huellas o, por el mapa, un arco hasta el sello; al pescar, la caña y el pez), lo que cuesta y lo que te quedará, y dos botones: sí o no. Alejarse 3 m o cambiar de zona es decir que no. Mientras está abierta no se cruza el paso (te frena en el límite), el tutorial espera y el aviso que hubiera se quita. Al decir que no, 1,5 s sin volver a preguntar (`NO_PREGUNTAR_MS`). Sin misión también cuesta: el modo libre tiene 30 puntos al día.
- **Fotos de las zonas** (`fotos/<zona>.jpg`, 640 × 400): sacadas en la escena desde donde se llega con el mapa (`DESTINOS_MAPA`); en la montaña, el puerto y el acantilado, mirando a otro lado (al norte, al sur y al norte), porque desde la llegada se veía una ladera, una pared o un pilar. Para rehacerlas: en la vista previa, ir a la zona (`zonas.ir`), ocultar lo pegado a la cámara, `renderer.render` y copiar el lienzo a uno de 640 × 400; mandarlas fuera del proyecto y copiarlas después, porque guardar en el proyecto recarga la página.
- **Sin puntos para esa zona** no se cruza y sale un aviso (`zonas.cruzar`, también en portales, puertas y viaje rápido). **Con cero**, intentar cruzar acaba el día.
- **Terminar el día:** en el diario, con confirmación, o al quedarse sin puntos. Se vuelve a la posada con el presupuesto entero; lo aprendido y las monedas se quedan y lo pescado se pierde.
- **Carta:** solo se puede tener una de cada tipo. Lo que llevas se ve como un naipe dibujado en canvas, solo en el inventario, desde donde se come, con el modelo 3D del objeto girando delante (`modeloInventario`). Por ahora solo el pescado, crudo o asado (`dibujarCartaPescado`, y el pez de los bancos, `formaDePez`).
- **Indicador:** una tablilla abajo a la izquierda de la vista, con el día y los puntos. Los avisos salen en una tabla delante, unos segundos.
- **Rayo en el pergamino:** mientras está abierto, el rayo del mando derecho se dibuja por encima (`rayoEncima`) y un punto rojo marca adónde apunta.
- **Misión:** segunda pestaña del pergamino (`pintarMision`, con `partida.resumenMision`): en qué misión estás, cómo va (día y puntos), sus pasos con una casilla marcada si está hecho y lo siguiente que hay que hacer (lo del tutorial si lo hay; si no, el primer paso sin hacer). Con la misión en marcha, también si se repite, cuenta hasta la entrega; después, dormir e ir a la boda.
- **Diario:** tercera pestaña del pergamino: día, misión, lo aprendido, precios y los botones de terminar el día (con confirmación) y **salir al menú** (en el ordenador, teclas **T** y **Q**).
- **Inventario:** cuarta pestaña: las cartas que llevas, las monedas y el botón de comer. Los botones se apuntan en VR con el mando derecho; en el ordenador, con la hoja abierta, teclas **T** (diario) y **C** (inventario), porque la mira se mueve con el pergamino.
- **Posada** ([salas/posada.html](salas/posada.html), [js/posada.js](js/posada.js)): cada día empieza en tu habitación, arriba, al fondo entre la cama y el taburete, mirando a la puerta (`INICIO_DIA`). Al apuntar a la cama y apretar el gatillo se puede dormir, que pasa al día siguiente (`cama-dormir`). El posadero te indica la taberna (`posadero`). Los postigos de la ventana de tu habitación se cierran y se abren apuntando a la ventana desde dentro y apretando el gatillo (`postigos`); la partida recuerda cómo los dejas (`partida.estado.postigos`).
- **Peinados:** `cliente` con `pelo` (color) y `peinado` (1 corto, 2 melena, 3 fraile, 4 rizado), de `herramientas/modelar-pelos.py` → `modelos/pelos.glb`.
- **Moza de la jarra** (`moza`, js/poblado.js; `herramientas/modelar-moza.py`): con esqueleto, un paso de cuatro tiempos y sus rutas en la plaza, el comedor y el puerto.
- **Personas con esqueleto:** por ahora, los novios y la moza, de prueba (`persona-animada`, js/boda.js): una malla en T-pose con 17 huesos y animaciones reposo, andar, beso y, él, brindis (`esqueleto`, `animar` y `brazos` en `herramientas/piezas_modelo.py`). Los demás personajes siguen siendo piezas rígidas. Falta medir en el Quest cuánto cuestan.
- **Brindis** (js/boda.js): al coger una copa en la boda, los invitados cogen la suya de la mesa con la mano (`BrazoD`, herramientas/modelar-cliente-sentado.py), la alzan, dan un botecito y gritan, y los novios se acercan y se besan "¡hurra!" (sonido hecho con el navegador, sin archivos).
- **Copas** (`copa`): en la mesa de tu habitación y en la de la boda. Se coge acercando la mano, sin rayo, con el gatillo lateral (`agarrable` con `cercania`); brilla un poco cuando la mano llega y, al soltarla, cae de pie sobre lo que tenga debajo (la mesa, la cama, el suelo); al recargar vuelve a la mesa.
- **Muestras** (`muestra`, js/poblado.js): tablones viejos pintados a mano por las dos caras (sin dorados), que cuelgan de un brazo de hierro sobre la puerta: "Posada La Parada" con la luna y la estrella, y "Taberna Las Chatungas" con la jarra.
- **Cofre** ([js/posada.js](js/posada.js)): en tu habitación. Al apuntarle y apretar el gatillo se abre y se guarda o se saca lo que llevas (`partida.opcionesCofre`). Por ahora solo el pescado, que dentro también se estropea al acabar el día.
- **Taberna** ([salas/taberna.html](salas/taberna.html), [js/taberna.js](js/taberna.js)): donde se reciben las misiones, junto a la plaza. Al apuntar al camarero y apretar el gatillo, habla y se elige la respuesta (`partida.charlaCamarero`). Los clientes son `guardia` con `modelo: cliente-sentado` (`herramientas/modelar-cliente-sentado.py`) y `cliente` para la ropa.
- **Oficios y cartas** ([js/oficios.js](js/oficios.js)): cada oficio pregunta antes (con su dibujo), cuesta puntos y da una carta. **Cazar** el ciervo del bosque, 3 puntos (`PUNTOS_CAZAR`): carta de carne, que cae de lado y al rato desaparece hasta volver a la zona. **Talar** en el tocón con el hacha, junto al claro del bosque (`tala`), 5 puntos: carta de madera. **Picar piedra** en la cantera de la sala de la cueva (`cantera`, con su luz de antorcha), 5 puntos: carta de pieza (un sillar). Solo una carta de cada tipo (`partida.cartas`; el pescado va aparte, en `partida.pescado`, por la misión). La carne se asa en la hoguera como el pescado y se come (cruda 1 punto, asada 3); al acabar el día se estropea, la madera y la piedra no.
- **El tendero** (`mercader`, en el puesto del mercado del poblado; modelo `herramientas/modelar-tendero.py` → `modelos/tendero.glb`, con esqueleto: reposo, andar y ofrecer): al hablarle tiende la mano y compra cada carta por 5 monedas de plata (`PRECIO_CARTA`).
- **Inventario:** las cartas en fila, cada una con su modelo 3D girando delante (`modelosDeCartas`, js/oficios.js; el pez, `modeloInventario`), y un botón para comer el pescado y otro para la carne.
- **Pescar:** con misión cuesta 3 puntos (`PUNTOS_PESCAR`), y antes pregunta. Al pescar, el aviso recuerda que con el mapa se viaja deprisa a donde ya has estado. Apuntar al agua del banco (`peces`) y apretar el gatillo, a menos de 4 m, por ejemplo desde el embarcadero sur; con misión, una vez al día, y sin misión, todo lo que se quiera, pero sin llevar ya uno encima. **Asar:** apuntar a cualquier `hoguera`. **Comer:** en el inventario.
- **El círculo de la boda** brilla: una cortina de luz dorada que sube del aro y late despacio, con el aro (`luzCirculo`).
- **Brindar en la boda:** al sentarte sale el aviso de que cojas tu copa y brindes por los novios (en el tutorial es su último paso, `brindar`). El botón de levantarte no sale hasta que has brindado: en VR, cogiendo la copa con la mano; en el ordenador, con un clic en una de las copas de tu lado de la mesa (brilla al apuntarla; `sePuedeBrindar`, js/boda.js).
- **La boda:** aceptar con el camarero (9 puntos), bosque, lago, pescar, bosque, poblado y entregar: cobras en monedas. Después, el camarero ofrece repetirla, con el presupuesto entero y sin volver a pagar.

### La boda

Al día siguiente de entregar el pescado por primera vez ([js/boda.js](js/boda.js), `partida.bodaHoy`), el camarero no está en la taberna y en la plaza, delante de la iglesia, dentro de un círculo dorado en el suelo, hay una mesa con el banquete, el novio y seis invitados sentados, y los novios de pie (`herramientas/modelar-novia.py` y `modelar-novio.py`, que comparten `piezas_modelo.py` → `modelos/novia.glb` y `novio.glb`). Se espera hasta que vayas. Al apuntar a la silla libre y apretar el gatillo te sientas: no se anda (`enLaMesa`), los ojos quedan a 1,15 m y salen las frases del brindis, hasta pulsar **Levantarte**. Al empezar el día siguiente ya no está. No se hornea: solo existe ese día, y no cambia lo horneado del poblado.

## Controles

**Meta Quest** (abre la página y pulsa el botón **VR**):

| Control | Qué hace |
|---|---|
| **Joystick izquierdo** | Andar hacia donde miras. Sube y baja escalones; no deja atravesar paredes ni puertas cerradas, ni caerse. |
| **Gatillo lateral izquierdo** | Correr, mientras se aprieta (2,5 veces más rápido). En el ordenador, **Mayúsculas** o el **botón derecho del ratón**; con mando de Xbox, **LT**; en el móvil, **doble toque** en la cruceta de andar. |
| **Joystick derecho** a un lado | Girar 30°. |
| **Gatillo** apuntando a una puerta | Abrirla o cerrarla (el rayo se pone verde, la aldaba brilla y sale el cartel). |
| **Gatillo lateral** apuntando a la pantalla, o con la mano junto a una copa | Cogerla y colocarla; la pantalla se queda donde la sueltes y la copa cae. |
| **Botón B** | Ver tus cartas (el inventario). Mantenido, traer la pantalla del PC delante de ti. |
| **Apretar el joystick derecho** | Poner o quitar la luz horneada (en el ordenador, tecla **H**), solo en la partida de depuración; en las demás, siempre horneada. Mantenido un segundo, cambiar la resolución entre 1,1 y 1: se guarda y recarga la página, y hay que volver a pulsar **VR**; el valor sale en el medidor. |
| **Botón A o Y** | Abrir o cerrar el pergamino. De hoja se cambia apuntando a su pestaña y apretando el gatillo: mapa (con una flecha que dice dónde estás), diario de la partida, inventario y ayuda con todos los botones (en el ordenador, la tecla **N** va pasando de hoja). |
| **Gatillo** apuntando a un cartel de la barca | Subirte y viajar a ese destino. |
| **Gatillo** apuntando al camarero, al agua de los peces o a una hoguera | Hablar, pescar o asar. |
| **Botón X** o **apretar el joystick izquierdo** | Ocultar o enseñar el medidor de rendimiento, que sale encendido (en el ordenador, tecla **M**). Solo en la partida de depuración. |

En VR cuenta tu altura real. Si estás sentado (las gafas, de media, por debajo de 1,30 m durante
unos segundos), la escena te sube **35 cm** (`SUBIR_SENTADO` en js/movimiento.js); al ponerte de
pie, vuelve a tu altura.

**Ordenador:** clic para capturar el ratón, **WASD** o flechas para andar (igual que el joystick:
con choques y escalones), clic con la mira en una puerta para abrirla, **Esc** suelta el ratón.
Con **Alt mantenida** el cursor es libre (`cursorLibre`, en movimiento.js): sale la flecha, se clica
directamente sobre puertas y botones sin girar la cámara, y al soltar Alt vuelve la mira del centro.
La mira es clara con borde oscuro y se dibuja por encima de los carteles (`encima`, en objetos.js). Se pone verde y más grande sobre todo lo que se puede usar (`rayo-verde`, la misma que pinta de
verde el rayo del mando), y con Alt la flecha pasa a mano. El día y los puntos salen arriba en el monitor.
En el monitor, el pergamino (N) y las preguntas de gasto de puntos salen más grandes y suelta el ratón
(`ratonLibre`, en movimiento.js, con un motivo por cada uno): el ratón solo toca el pergamino o los botones de la
pregunta, y no gira la cámara ni toca la escena; al cerrarlos se recaptura. Las preguntas y las tablas de opciones del cofre,
la cama y el posadero salen rectas, de frente a la cámara aunque mire arriba o abajo, y a una escala que cabe en la vista
(`tablaEnMonitor`, en posada.js). Los avisos del tutorial, más grandes y arriba. En VR todo sigue como estaba.

**Móvil o tableta** (pantalla táctil, fuera de VR): salen **dos crucetas** abajo (redondas, como escudos: madera oscura, aro de hierro, remache y cuñas de latón que se encienden al pulsarlas), la izquierda para andar y la
derecha para mirar (`crucetas`, al final de movimiento.js; se detecta con `pointer: coarse` (el puntero principal es el dedo; un portátil táctil con ratón no cuenta), y no
sale en el navegador de las Quest). La de andar se suma al joystick (`cx`, `cy` en `andar-joystick`); la de mirar gira la
cámara como el stick derecho del mando. Se pueden usar las dos a la vez, y arrastrar por la escena también gira.
**Correr en el móvil:** doble toque en la cruceta de andar (el segundo antes de `DOBLE_TOQUE_MS`, 400 ms). Corre mientras se
toca, y aunque se levante el dedo un momento (`SEGUIR_CORRIENDO_MS`, 600 ms: toque, toque y apoyar también vale); el aro se
enciende en latón mientras (`correTactil` en `andar-joystick`).
**Botón Pergamino** (arriba a la derecha, en el ordenador y en el móvil, fuera de VR y del menú): abre el pergamino por el
mapa y, abierto, pone "Cerrar" (js/mapa.js). En el ordenador se pulsa con el ratón libre (Alt, Esc o con el pergamino abierto);
con el ratón capturado sigue la tecla **N**.
**Tocar con el dedo** lo que se puede usar (la aldaba de una puerta, el posadero, una copa, los botones) es como el clic:
un toque corto, sin arrastrar, lanza un rayo desde el dedo (tan largo como el de la mira: 4 m, y en el menú `MENU_RAYO`) y le manda `mousedown`.
El giroscopio del móvil no mueve la cámara (`magicWindowTrackingEnabled: false` en `look-controls`): se mira con la cruceta o arrastrando. Al cursor de la mira se le
quita el toque, para que no haga clic a la vez en lo del centro.
Se juega en **apaisado**: al primer toque pide pantalla completa y fija la orientación (`screen.orientation.lock`, que solo
va así y en Android; el iPhone no lo deja), y en vertical un aviso tapa la escena ("Gira el móvil para jugar").

**Mando de Xbox en el ordenador** (por cable, Bluetooth o adaptador; el navegador lo detecta al
pulsar cualquier botón con la página delante; dentro de las gafas no cuenta):

| Mando | Qué hace |
|---|---|
| **Stick izquierdo** | Andar, con los mismos choques y escalones. |
| **Stick derecho** | Mirar alrededor (girar y mirar arriba o abajo). |
| **A** o **RT** (gatillo derecho) | Hacer clic: abrir o cerrar la puerta, hablar, coger lo que hay en la mira. |
| **Y** | Abrir el pergamino y pasar de hoja (como la tecla **N**): mapa, misión, diario, inventario, ayuda y cerrado. |
| **Stick derecho y A, con una ventana abierta** | Con el pergamino o una pregunta (o la tabla del cofre, la cama, el posadero) abiertos, el personaje no se mueve; el stick derecho mueve un aro dorado (`moverCursor`, movimiento.js) y **A** pulsa lo que haya debajo (la primera pulsación solo muestra el aro). |
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
| [js/mundo.js](js/mundo.js) | Las zonas: dónde están, su terreno, su hora y sus pasos. |
| [js/zonas.js](js/zonas.js) | Cambio de zona y niebla. |
| [js/lago.js](js/lago.js) | Agua, embarcaderos y barca. |
| [js/poblado.js](js/poblado.js) | Casas, puestos, tumbas y columnas. |
| [js/mapa.js](js/mapa.js) | El pergamino: mapa, diario, inventario y ayuda. |
| [js/partida.js](js/partida.js) | El juego: estado, las tres partidas, precios, puntos, día, misión, indicador y avisos. |
| [js/menu.js](js/menu.js) | El menú principal: la tabla de las partidas. |
| [js/oficios.js](js/oficios.js) | Oficios (tala, cantera, y las cartas de cazar y pescar), las cartas y su dibujo y modelo 3D, y el tendero que las compra. |
| [js/pregunta.js](js/pregunta.js) | La pregunta antes de gastar puntos: cartel con dibujo y foto, sí o no. |
| [fotos/](fotos/) | Fotos de cada zona, para la pregunta de viajar. |
| [js/taberna.js](js/taberna.js) | Tejado, clientes y camarero con su charla. |
| [js/boda.js](js/boda.js) | El banquete de la plaza y sentarse a la mesa. |
| [herramientas/](herramientas/) | Horneado (`hornear-castillo.py`, `recibir-estancia.js`) y la barca (`modelar-barca.py`). |
| [js/incluir.js](js/incluir.js) | Componente `incluir`: descarga una estancia y la mete en la escena. |
| [js/movimiento.js](js/movimiento.js) | Andar, girar, zonas, `SUPERFICIES`, obstáculos `macizo` y la mira del monitor. |
| [js/arboles.js](js/arboles.js) | Árboles dibujados en bloque, con versión de cerca y de lejos según la distancia. |
| [js/texturas.js](js/texturas.js) | Texturas de canvas y `suelo-madera`, `pared-piedra`, `piedra-mundo`. |
| [js/objetos.js](js/objetos.js) | Puerta, antorcha, estatua, biblioteca, escalera, muros con arcos, pasillos de arriba, y lo del comedor (hoguera, lámpara de rueda, mesa, estandarte). |
| [js/rendimiento.js](js/rendimiento.js) | Para el Quest: al cargar cada estancia junta lo fijo en pocas mallas (`fundirEstancia`), y solo usa 6 luces puntuales, siempre las mismas, que copian a las más cercanas (`luces-cercanas`: si cambia cuántas luces hay, el navegador recompila y da un tirón). |
| [js/medidor.js](js/medidor.js) | Medidor de rendimiento: imágenes por segundo (y la peor), llamadas de dibujo, triángulos y luces. |
| [js/conexion.js](js/conexion.js) | Pantalla del PC, objetos que se cogen e informe de posición para Claude. |
| [modelos/](modelos/) | Modelos de Blender (`.glb`) y el `.blend` para retocarlos. |

Para añadir una estancia: un archivo nuevo en `salas/`, su nombre en `MUNDO` (js/mundo.js), y
sus zonas en `js/movimiento.js` (`zonasPermitidas`) si se puede andar por ella.

### Componentes

- **Movimiento:** `andar-joystick` (joystick, teclado y mando de Xbox en el PC), `giro-por-pasos`. Las zonas por las que
  se puede ir (`SALA`, `PASILLO`, …, `PASILLOS_ARRIBA`) se unen por puertas abiertas
  (`zonasPermitidas`); las alturas que se pisan están en `SUPERFICIES` (`sueloEn`: escalones de
  hasta 35 cm, sin caídas, sin atravesar lo macizo). Desde el HTML de una sala, `macizo="ancho; fondo;
  alto"` añade un obstáculo que no se puede atravesar (la chimenea del comedor); con `desde`, solo para quien pisa a esa altura o más (los tabiques del piso de la posada). `piso="ancho; fondo; y"` es un suelo alto por el que se pasa por debajo.
- **Materiales:** `suelo-madera`, `pared-piedra` (planos), `piedra-mundo` (cajas, con la textura
  alineada en el mundo; `tono` la tiñe), `madera-mundo` (igual, con tablas: casas del poblado, con `madera` en `casa`), `suelo-hierba` (el campo), `camino` (cinta de tierra con curvas
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

En el castillo es un **atardecer**: sol bajo y anaranjado por el oeste (`CIELOS`, js/texturas.js), con una cúpula de cielo dibujada en canvas
(`cielo`). Por dentro mandan las antorchas: las anaranjadas valen 4 veces más en Blender.

Todo el castillo lleva la luz calculada en Blender, también la hierba, con la sombra del castillo y de
los árboles (`campo`, en su propia imagen; el camino usa esa misma imagen, `luzEnCaminos`, para que la
sombra siga por encima). Las demás zonas se hornean igual, cada una a su hora. No van horneados lo que se mueve, lo transparente, el agua,
las colinas ni los árboles: usan la luz general. **Apretar el joystick derecho** (en el ordenador, la tecla **H**) recarga la zona con o sin ella, sin salir de VR;
sin hornear, sale el letrero "Sin hornear".
Con **`?sinhornear`** en la dirección se empieza sin ella.

- **Las estancias se cargan igual**, con sus componentes y obstáculos; solo cambia lo que se dibuja:
  sus piezas fijas se ocultan y va en su lugar `modelos/horneado/<sala>.glb` con `<sala>-luz.jpg`
  (`hornearEstancia`, en rendimiento.js), con materiales que no calculan luces. Personajes y puertas
  siguen usando las 6 luces. Estatuas y marcos de piedra también van horneados (`MODELOS_HORNEADOS`): su original se esconde, pero solo en las estancias de `SALAS_HORNEADAS` (si una estancia sale de esa lista, sus estatuas se ven tal cual).
- **Lo horneado no se actualiza solo:** después de cambiar algo fijo de una estancia, hay que regenerarlo
  (no retocar los modelos a mano):
  1. `node herramientas/recibir-estancia.js <carpeta>`.
  2. Abrir la página con `?sinhornear&sinfundir&partida=1` (sin `partida` se queda en el menú) y, en la consola, la línea `fetch(...)` que hay
     encima de `exportarZona`, en rendimiento.js (`/castillo`, `/lago`…), estando en esa zona.
  3. `blender --background --python herramientas/hornear-castillo.py -- <carpeta>/<zona>.json <salida> 256`
     (unos minutos; 100 píxeles por metro, imágenes de hasta 4096) y copiar a `modelos/horneado/` los `.glb`, los `.jpg` y el `.blend`. Los vatios
     por unidad de luz, el sol y el cielo se ajustan en ese script.
- En las estancias con fuego (`SALAS_CON_FUEGO`) la luz horneada tiembla un 4 %, toda a la vez, para acompañar a las llamas.
- Las puertas y los personajes no están en Blender: no dan sombra, y la luz pasa por las puertas como si
  estuvieran abiertas. Las antorchas no tiemblan en lo horneado: solo su llama y lo que se mueve.
- Sin hornear (tecla H), el castillo se ve mucho más oscuro: la luz general es ya la del atardecer.

**Interiores** (`interior`, en rendimiento.js): en la posada, la taberna y el castillo (donde la puerta es el portón), lo suelto de dentro se oculta si no estás dentro ni a menos de 15 m de su puerta, porque el motor no descarta lo tapado por una pared. Con **`?coninteriores`** no se oculta, para comparar.

En las gafas se dibuja a 1,1 veces la resolución normal (`calidad-vr`; a 1,2 el juego bajó a 75-85 imágenes por segundo, sin saber aún cuánto era por esto; probadas 1 y 1,1 en el Quest en noviembre de 2026, el usuario no vio diferencia de calidad ni de velocidad, ni tirones en 1,1) y con poco foveado (`foveationLevel`). Con `?escala=1` en la dirección se compara con otro valor. El horneado solo pone la luz; el detalle sale de las texturas de canvas, y la de madera es ahora de 2048.

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
- Diseño del juego (puntos, misiones, cartas) y qué está programado: [JUEGO.md](JUEGO.md).
