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
