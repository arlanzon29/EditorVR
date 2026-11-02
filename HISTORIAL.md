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
- **Tutorial:** se calcula de cómo va la partida, no se guarda en qué paso vas, para que aguante perder el pescado o acabar el día.
- **Calidad:** subir la imagen de luz no mejoró las texturas, porque el horneado solo pone la luz. Por eso se probó con más resolución en las gafas y una textura de madera mejor. Falta ver si basta y cuánto cuesta en el Quest.
- **Mapa:** un acceso por lugar, y niebla sobre lo no visitado. Los primeros bordes de niebla eran duros y salían círculos; se suavizaron con degradados.

- **Personajes con esqueleto (prueba):** todos eran piezas rígidas en su postura final. Los novios se rehicieron en T-pose, con una malla, esqueleto y animaciones. Los pesos se calculan por distancia a los huesos, sin depender del automático de Blender, y las poses de los brazos se dan diciendo adónde apunta cada tramo, que es mucho más fácil de acertar que con ángulos.
