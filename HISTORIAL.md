# Historial

Lo que se ha ido haciendo en Editor VR, con el porqué cuando no es obvio. Lo más reciente, arriba.
Cómo está hecho cada cosa: [README.md](README.md).

## 25 de octubre de 2026

Sesión larga, primero con Blender conectado a Claude (MCP de Blender, Blender 5.2), luego a
ratos desde las gafas y a ratos desde el ordenador.

### Modelos de Blender
- **Antorcha de pared:** soporte de hierro, mango de madera, brea y llama aparte (para que
  tiemble). Dos en el pasillo 2, cuatro en el comedor y dos fuera, en la puerta del patio.
- **Puertas:** hojas de tablones con bisagras largas con punta de lanza (hasta el último
  tablón, con dos remaches por tablón), escudo de cerradura, travesaños con tornapuntas detrás y
  aldaba que brilla al apuntarla; dos tamaños. **Marcos** de sillares con dintel de dovelas.
- **Caballero de piedra** sobre pedestal: uno a cada lado de la escalera de la sala 3.
- **Criado** con jarra que da vueltas a la mesa del comedor: cabeza, muslos, espinillas (con
  rodilla) y brazo libre aparte; balancea piernas y brazo, dobla la rodilla al dar el paso,
  respira, te mira y te saluda.
- **Guardia** con cota de malla, sobreveste con cruz, yelmo con nasal, lanza y escudo: dos a
  los lados del arco del comedor (uno en espejo). Te miran, te saludan y no se les atraviesa.

### Estancias y exterior
- **La escena se separó en archivos:** `index.html` (jugador y luz), `salas/*.html` (una por
  estancia, se cargan con `incluir`) y `js/*.js` (comportamiento). Antes todo estaba en
  `index.html` (66 KB).
- **Comedor** de 12 × 10 m a la derecha de la sala 3, por un arco con dovelas: chimenea con
  hoguera, mesa de 7 m con bancos, sillón y vajilla, lámparas de rueda, estandartes, ventanas en
  arco y antorchas.
- **Patio de armas** entre la sala 1 y la sala 2, con puerta desde el pasillo, muralla almenada y
  pozo (postes sobre el brocal, torno con manivela y cubo de duelas).
- **Exterior:** portón en la muralla del patio y campo alrededor de todo el castillo (hierba,
  camino, árboles y colinas). Las salas tienen piel por fuera, las galerías de arriba se ven como
  cadalsos y las esquinas de los muros están cerradas. Por las ventanas se ve el campo de verdad
  (antes había un cielo pintado en un plano).

### Controles
- **Mando de Xbox en el ordenador:** andar, mirar, abrir puertas (A), traer la pantalla (B),
  girar (LB/RB) y recalibrar (Vista). Los sticks se calibran solos: uno por Bluetooth dejaba el
  derecho en -0,7 sin tocarlo y la vista subía sola.
- **Puertas al apretar el gatillo**, no al soltarlo: el clic de A-Frame se perdía si al soltar el
  rayo había pasado a otra de las piezas que se solapan (la hoja y las esferas de la aldaba).
- **Altura en VR:** cuenta la real; sentado, se suben 35 cm. (Se probó fijarla a 1,60 m y no
  gustó.)
- **Salir de algo macizo:** en VR uno puede meterse andando de verdad (pasó en el pozo) y desde
  dentro el joystick no dejaba salir. Ahora sí.

### Rendimiento
- **Medidor** en el mando izquierdo (botón X).
- **Fundir lo fijo** de cada estancia, antorcha y lámparas en menos piezas, y **6 luces fijas**
  que copian a las cercanas. Fuera, de frente al castillo, de 25 a 76–82 imágenes por segundo;
  la escalera y el comedor, a 90. Los tirones al entrar en las salas eran recompilaciones por
  cambiar cuántas luces había.

### Parpadeos arreglados (z-fighting)
Dos caras en el mismo plano se pelean. Salieron, y se arreglaron:
- el ramal del pasillo 2 dentro del hueco del muro de la sala 3, y el suelo del arco de arriba;
- la trasera de la placa de las antorchas y las puntas de las vigas, contra paredes de doble cara;
- el reborde del escudo del guardia (tan grueso como el escudo) y la cruz;
- la fachada contra el muro de los pasillos de arriba, los alféizares contra la piel de fuera, los
  listones del marco de las ventanas, la pantalla del PC contra su marco, la cruz de los
  estandartes, las losas de la escalera (2 mm por encima de la piedra) y la muralla del patio
  contra las paredes de las salas;
- en general: los modelos de Blender llegaban de doble cara, y su trasera asomaba.

### Pendiente
- **Foto para Claude** (`foto-para-claude`): nunca se programó; el botón X es ahora el medidor.
- **Aspecto del castillo por fuera:** con la piedra igual en todas las caras no se leen bien las
  esquinas ni los volúmenes. Ideas: sol de lado y menos luz ambiente, sillares claros en las
  esquinas, almenas y tejados o terrazas encima de las salas, zócalo.

## Menú principal y tres partidas (noviembre de 2026)

El menú es una zona más (`menu`), no una pantalla de HTML: así se puede salir a él y volver sin salir de VR, porque recargar la página sí sacaría. El sitio y las zonas visitadas pasaron a ir dentro de cada partida. Al recargar se sigue en la misma partida (`sessionStorage`), para no pasar por el menú cada vez que la página se recarga sola mientras se trabaja.

La sala del menú va horneada como las demás, con la imagen de luz bajada a mano de 4096 a 2048: el script da 4096 por el área de los muros, contando sus caras ocultas, y es demasiado para una sala tan pequeña. Al regenerarla hay que volver a bajarla.

- **Frames y esqueletos (sin resolver):** el usuario nota menos imágenes por segundo desde los cuerpos con esqueleto. Cada uno son 11 o 12 piezas por material (el doble de llamadas en VR, por los dos ojos), de 3.200 a 4.900 triángulos, y con `frustumCulled = false` se dibujaban aunque quedaran a tu espalda. Se ha cambiado por una esfera fija que les cabe en cualquier postura (`persona-animada`), y ya no se dibujan fuera de la vista; lo que tengas delante, aunque esté tras una pared, se sigue dibujando. Medido en el Quest con 1,1 de resolución: de 83 a 90 imágenes por segundo, sin tirones, con unas 300 llamadas mirando a la boda o a la moza con el poblado detrás. No hace falta reducir piezas por ahora; las llamadas dependen de lo que hay en la vista, así que solo sirve comparar desde el mismo sitio.
- **Interiores:** mirando a la posada y la taberna bajaba a 83. Se oculta lo suelto de dentro al estar fuera y lejos de su puerta (`interior`), y el usuario nota mejora en las gafas (sin cifras todavía). Después, lo mismo en el castillo, tomando el portón como puerta: fuera iba a 70 y mejora bastante, según el usuario. Merece la pena repetirlo donde haya un interior con muchas cosas sueltas. Por vigilar, como dijo el usuario: el castillo tiene muchas salas, y dentro de él sigue dibujándose lo suelto de todas; se podría ocultar sala por sala si el medidor baja dentro.

## Taberna, posada y tutorial (noviembre de 2026)

Se fue haciendo con el usuario probando en las gafas y pidiendo cambios sobre la marcha.

- **Taberna y posada, separadas:** el edificio de antes pasó a ser la taberna (Las Chatungas) y se hizo una posada nueva (La Parada), de dos plantas, para que las habitaciones estuvieran arriba, con la tuya mirando a la plaza. Hizo falta `piso` y `macizo` con `desde`, porque un obstáculo valía para todas las alturas.
- **Puerta y luz:** primero las puertas eran fijas y las estancias salieron oscuras; el usuario pidió poder abrir la suya, y se aclararon paredes y antorchas.
- **Tutorial:** se calcula de cómo va la partida, no se guarda en qué paso vas, para que aguante perder el pescado o acabar el día. El aviso de ir al tabernero salía a la vez que la charla del posadero, encima, y decía lo mismo: ahora sale al cerrarla y explica cómo hablarle, sin repetir dónde está la taberna. Lo mismo con el tabernero: el aviso de los puntos salía al aceptar, con la charla aún abierta; ahora espera a que se acabe.
- **Calidad:** subir la imagen de luz no mejoró las texturas, porque el horneado solo pone la luz. Por eso se probó con más resolución en las gafas y una textura de madera mejor. Falta ver si basta y cuánto cuesta en el Quest.
- **Pozo del poblado:** era un cilindro con dos palos y un travesaño; se cambió por una copia del del patio del castillo, con su manivela y su cubo, y se volvió a hornear el poblado.
- **Pregunta antes de gastar:** el usuario pidió que, al moverse de lugar o pescar, saliera un cartel con lo que cuesta, un dibujo de lo que se va a hacer y sí o no; luego, una foto del sitio al que se va. Las fotos se sacan de la propia escena; desde la llegada de algunas zonas se veía una pared, una ladera o un pilar, y se miró a otro lado. La cueva por dentro es oscura de verdad y se dejó así.
- **Taberna:** los muros de tablas estaban metidos 70 cm en el zócalo de piedra, 2 cm por detrás de su cara, y de lejos asomaban parpadeando: ahora empiezan encima.
- **Boda:** el usuario pidió que al sentarte avisara de brindar y que no se pudiera uno levantar hasta alzar la copa. El brindis empieza al coger la copa, así que cuenta desde ahí; el botón de levantarse sale al acabar.
- **Misión en el pergamino:** una pestaña nueva, entre el mapa y el diario, con lo hecho y lo siguiente.
- **Árboles del poblado:** de prueba, con detalle hasta 40 m en vez de 18, para que se vean mejor. Un árbol a 1 m de la esquina de la posada metía la copa en ella: se apartó 5 m hacia la calle.
- **Postigos:** el usuario quiso poder cerrar la ventana de su habitación: los postigos de fuera giran hacia fuera, para no meterse en la pared.
- **Entrada del poblado:** de dos guardias se quedó uno, con una garita de tablas detrás; un árbol que la tocaba se apartó.
- **Oficios y mercado:** el usuario pidió cazar el ciervo (3 puntos, carta de carne), talar (5, madera) y picar piedra en la cueva (5, pieza), y alguien en el mercado que comprara las cartas por 5 monedas; luego, un personaje nuevo para el tendero y un modelo 3D en cada carta, como el pez. Se hizo con un mismo sistema de cartas (`partida.cartas`); el pescado sigue aparte por la misión.
- **Ciervo:** el de cajas se cambió por uno modelado en Blender, y se llevó a una llanura: en las cuestas las patas se hundían o flotaban.
- **Cueva:** la boca estaba en un montón de rocas sobre el terreno; se hizo una loma en el propio terreno y la boca en su ladera, con rellano y camino.
- **Boda:** el círculo de la boda, con luz que late.
- **Modo libre con puntos:** sin misión todo era gratis; el usuario decidió dar 30 puntos al día y que todo cueste igual. Las partidas guardadas sin misión pasan a tener 30 al abrirlas.
- **Menú espectacular:** el usuario quiso que la primera imagen impresionara. La sala pasó a gran salón; se probó un rosetón de vidriera con un haz de luz y motas, y braseros a los lados, y no gustaron (los braseros además flotaban): luego se pidieron candelabros, pero contra la pared y alumbrándola (los halos sin luz no la iluminaban): se modelaron en Blender, con una luz cada uno. Y en vez del rosetón, un óculo en el techo con la luna y nubes, cuyo haz de luz cae en diagonal sobre un mosaico delante de la tabla. Se puede andar por él. Ojo: el menú va horneado, así que hasta hornearlo de nuevo se seguía viendo la sala de antes.
- **Menú:** dos caballeros de piedra junto a la tabla y estandartes, para que no fuera una sala vacía.
- **Mapa:** un acceso por lugar, y niebla sobre lo no visitado. Los primeros bordes de niebla eran duros y salían círculos; se suavizaron con degradados. Para probar se dejó todo el mapa abierto; luego el usuario pidió volver a la niebla y dejar el mapa entero solo en la partida 1, de depuración. Después pasaron también allí, y solo allí, el medidor y el cambio de luz horneada.

- **Personajes con esqueleto (prueba):** todos eran piezas rígidas en su postura final. Los novios se rehicieron en T-pose, con una malla, esqueleto y animaciones. Los pesos se calculan por distancia a los huesos, sin depender del automático de Blender, y las poses de los brazos se dan diciendo adónde apunta cada tramo, que es mucho más fácil de acertar que con ángulos.
- **Haz del óculo:** salía como un cilindro recto inclinado, con la boca de arriba torcida: medio metida en el pozo y medio colgando del techo, que se veía como una elipse oscura bajo el agujero. Se cambió por un cilindro oblicuo: arriba, el círculo del hueco plano en el techo; abajo, ese círculo proyectado en la dirección del haz hasta la pared.
- **Haz del óculo, otra vez al suelo:** al usuario le gustaba más cayendo sobre el mosaico, como antes, y no veía las motas: eran de 2,5 cm y desde el fondo del salón, a 9 m, no se distinguían. Se hicieron de 7 cm, más fuertes y más (220).
- **Caballeros del menú invisibles:** los modelos de `MODELOS_HORNEADOS` se escondían siempre que había luz horneada, contando con que el horneado los dibuja; al dejar el menú sin hornear, sus caballeros desaparecieron. Ahora solo se esconden en las estancias de `SALAS_HORNEADAS`.
