# El juego

Diseño del juego, en conversación. Un juego de exploración y aventura, con poca acción, en el que el
avance es sobre todo lo que aprendes.

## Qué está ya programado

Núcleo (`js/partida.js`), taberna (`salas/taberna.html`, `js/taberna.js`), posada con habitaciones (`salas/posada.html`), pesca y comida, la misión de la boda y el banquete (`js/boda.js`).
Cómo funciona: "El juego", en [README.md](README.md). **Todavía no:** cartas, mercado, personajes, enemigos,
las demás misiones y la caza.

Valores provisionales, en tablas al principio de `js/partida.js`, a la espera de que se confirmen:

- Precios: castillo 1, acantilado 2, puerto 2, cueva 2, mazmorras 2, abadía 3. El castillo cuenta como una sola zona.
- Comida: crudo 1, asado 3. Comerse el pescado deja sin encargo.
- Decidido por el usuario: con misión, pescar cuesta 3 puntos. Por eso la boda da 3 más.
- La boda: presupuesto 9, paga 5 monedas de plata. Aceptarla no cambia de día (lo corrigió el usuario), pero deja el presupuesto entero y sin pescado. Lo pescado se estropea al acabar el día.
- Se asa en cualquier hoguera. Se puede comer en cualquier sitio, desde el inventario.
- Sin misión, comer no da puntos. 

Decidido por el usuario: en la boda estás sentado a la mesa. Un círculo en el suelo marca la zona de la boda. Provisional: es en la plaza, al día siguiente de la entrega, espera hasta que vayas y no se puede repetir la misión hasta entonces.

Decidido por el usuario: el inventario es una pestaña del pergamino. El pescado se lleva como una carta, que se ve solo ahí, con el modelo 3D del objeto: no en la mano (lo cambió el usuario). Solo se puede tener una carta de cada tipo: con un pescado encima, crudo o asado, no se coge otro. Solo es la carta a la vista: mazo, compra y venta siguen sin programar.

Decidido por el usuario: la taberna y la posada son dos sitios distintos. La posada tiene habitaciones, una es la del personaje y la partida empieza allí. Provisional: el camarero y las misiones están en la taberna; cada día también empieza en tu habitación; la posada no tiene aún nada que hacer aparte de dormir.

Decidido por el usuario: en el pergamino se cambia de hoja apuntando a la pestaña, no con el botón A.

Decidido por el usuario: la moza de la jarra se cambia, con mejor forma de andar. Probar personajes con esqueleto, empezando por los novios; si convence, extenderlo a los demás.

Decidido por el usuario: al coger una copa en la boda, todos la cogen con la mano, brindan y gritan, y los novios se acercan y se besan.

Decidido por el usuario: la posada se llama La Parada y la taberna, Las Chatungas, cada una con un cartel cuidado. El botón B enseña las cartas. Lo de ir a la cama sale después de contestar "Allí estaré". En la taberna hay gente con pelo, no solo los soldados sentados. En la habitación y en la boda se pueden coger las copas, acercando la mano, no con el rayo. El usuario ha probado el tutorial y le ha gustado.

Decidido por el usuario: la partida empieza con un tutorial: abrir la puerta apuntando y con el gatillo, bajar la escalera, hablar con el posadero (que indica que la taberna está al lado), hablar con el tabernero y aceptar la misión, moverse, los puntos, pescar apuntando a los peces, volver por el mapa, entregar, dormir en la cama de tu habitación (la cama es la acción de pasar al día siguiente) e ir a la boda, donde acaba. El objetivo se marca sobre el personaje y en el mapa. Las zonas no visitadas salen con niebla en el mapa. En el mapa solo hay accesos a los lugares (poblado, lago, castillo...), no a la taberna, la posada ni la isla. Provisional: la marca es un rombo dorado encima y un aro en el sello de la zona. El usuario dijo que cada acción cuesta puntos, incluido moverse: de momento solo cuesta entrar en una zona, como en las reglas. Con el usuario, "tabernero" es el camarero.

Decidido por el usuario: hay un menú principal con hasta tres partidas guardadas, que se pueden continuar o borrar, y desde el juego se puede salir al menú; por eso desaparece la opción de reiniciar del pergamino. Provisional: el menú es una sala de piedra con una tabla y salir no pide confirmación, porque no se pierde nada.

Decidido por el usuario: en la habitación hay un cofre que se abre para guardar cosas. Provisional: solo guarda el pescado, que también se estropea al acabar el día, para no guardarlo de cara a la misión; cuando haya cartas y objetos, irán ahí.

Decidido por el usuario: la partida y cada día empiezan en la posada. El viaje rápido cobra todas las zonas por las que hay que pasar (del lago a la posada, 2: bosque y poblado), y dentro de la misma zona es gratis. El de cada zona se activa al visitarla; una partida nueva empieza sin zonas visitadas. Antes de gastar puntos (cruzar a otra zona, viajar, pescar, cazar, talar o picar) se pregunta, con un dibujo y una foto del destino; sin misión también.

Decidido por el usuario: sin misión (modo libre) se tienen 30 puntos de acción al día, y todo cuesta lo mismo que con misión.

Decidido por el usuario: oficios que dan cartas, una de cada tipo: pescar (3 puntos, pescado), cazar el ciervo del bosque (3, carne), talar en el bosque (5, madera) y picar piedra en la cueva (5, pieza). El tendero del mercado del poblado compra cada carta por 5 monedas. La partida 1 del menú es de depuración, con el mapa entero; las demás, con niebla.

Decidido por el usuario: una misión cumplida se puede repetir hablando con quien la dio, y solo se paga la primera vez.

Sin decidir: si se puede abandonar una misión (ahora no se puede).

## Reglas acordadas

### Pasear y misiones

- **Sin misión:** se pasea libre y gratis.
- **Con misión:** la misión da un presupuesto de puntos. Cada intento empieza con el presupuesto entero.
- Las misiones se reciben en la **taberna** del poblado, con el camarero y gente diversa.
- Cada misión decide qué **PNJ** aparecen, desaparecen o cambian, y dónde están.

### Puntos

- **Entrar en una zona cuesta puntos**, y cada zona tiene su precio (bosque 1, montaña 3). Andar dentro es gratis.
- Sin puntos suficientes no se entra en esa zona y no pasa nada más: con 1 punto se puede ir al bosque y no a la montaña.
- Con cero puntos se puede seguir andando por la zona en la que estás.
- **Zonas abiertas al empezar:** solo el poblado, el bosque y el lago (`ZONAS_ABIERTAS`, `js/partida.js`). Las demás dicen "está cerrado por ahora" y se irán abriendo más adelante. El lago no tiene barca por ahora. La partida de depuración las tiene todas.
- **Estrellas escondidas:** al aceptar la misión aparecen 5 estrellas azules, siempre en los mismos sitios en cada misión (2 en el poblado, 2 en el bosque, 1 en el lago). Se cogen apuntando y con el gatillo, de cerca, y un marcador ("★ 2 de 5") sale en el indicador. La moza del poblado, al acercarte con la misión empezada y la estrella de detrás de la iglesia sin coger, dice "Vi algo brillante detrás de la iglesia". Sin premio por ahora. Ideas para favorecer la exploración, sin decidir: premio al juntar las 5; un pequeño brillo o sonido al acercarse; cofres o cartas escondidas; vistas con un cartel al llegar (el mapa las marca como visitadas); pistas del tabernero o los vecinos; una carta de oficio nueva en un rincón.
- **Idea sin decidir: poblado de noche al volver del lago.** Versión barata: cielo y niebla de noche y la luz horneada atenuada y teñida de azul (sin hornear otra vez), con un indicador en la partida de que ya es de noche; versión buena: hornear el poblado también de noche (`campo-poblado`, `poblado`, `taberna`, `posada`), con luces en las ventanas.
- Los sitios a los que se baja, como las mazmorras o una cala al pie del acantilado, son zonas con su precio.

### Fin del día

- Se puede terminar el día siempre que se quiera.
- Al acabarse los puntos se vuelve al inicio y empieza otro día, que es otro intento de la misión.
- Se conserva lo aprendido. Hay objetos que se conservan y objetos que no.

### Personajes

- Cada personaje tiene habilidades. El explorador tiene 3 puntos extra de movimiento, que no consumen del presupuesto general.

### Objetos y cartas

- Hay objetos con ventajas, como unas botas especiales para andar mejor en la montaña.
- Los objetos pueden ser **cartas**, que se compran y se venden en el **mercado**, también sin misión.
- Durante una misión se puede ir al mercado, pagando la entrada al poblado.

### Pescar, cazar y comer

- Comer lo que se pesca o se caza da puntos, y cocinarlo en una hoguera da más todavía.
- Con misión se puede pescar y cazar **una vez al día**. Sin misión se puede pescar todo lo que se quiera.

## Primera misión (tutorial): el pescado de la boda

El camarero tiene una boda y quiere dar un banquete con pescado. Hay que ir al lago, pescar y llevárselo.

- **Recorrido:** posada → bosque (1) → lago (1) → pescar (3) → bosque (1) → poblado (1). Son 7 puntos, con un presupuesto de 9.
- **Propuesto:** si te comes el pescado, te quedas sin encargo y hay que repetir al día siguiente; el camarero paga en monedas, y eso lleva al mercado.

## Propuestas sin confirmar

- Precios de las zonas salvo bosque y montaña, y si todo el castillo cuenta como una sola zona.
- Qué objetos exactos se conservan: la propuesta es que lo de misión, como la llave, vuelva a su sitio, y que las cartas y las monedas se queden.
- Valores de la comida: crudo 1 punto, asado 3.
- Número de cartas que se llevan a una misión, y otros personajes (erudito, diplomático, ladrón).
- **Encuentros con enemigos:** al cambiar de zona puede aparecer un enemigo que solo quita puntos; se evita con puntos de lucha o un objeto de lucha.

## Ideas de la conversación

Todo lo hablado que no es regla: propuestas de Claude que el usuario no ha confirmado ni descartado, salvo donde se indica.

### Pendiente de decidir


- La sombra a la salida de la posada: el usuario la ve mal; en la vista previa la sombra del edificio sale algo irregular sobre el camino. Falta una foto (botón A o X) para saber qué es.

### Historia

- El señor del castillo ha desaparecido y nadie cuenta lo mismo; cada zona guarda una parte y el final está en la abadía, de noche.
- Pistas en el escenario (una marca en una piedra, una luz que solo se ve desde un sitio), y sin marcadores de misión.

### Fin del día y puntos

- Con cero puntos, el día termina al intentar cruzar a otra zona; así se recorre entera la última que has pagado.
- "Terminar el día" en el pergamino, con confirmación que avise de lo que se pierde.
- Un aviso en la niebla con lo que cuesta la zona. Precio visible en el mapa o en un cartel antes de cruzar.
- El viaje rápido cuesta lo mismo que entrar en el destino, o más.
- El presupuesto, algo mayor que la ruta buena: si cuesta 5, darle unos 7.
- Aceptar una misión empieza un día nuevo, para no llevar comida fresca preparada.
- Sin misión, reservar algunos sitios para las misiones (la torre de la isla, el fondo de las mazmorras); las pistas importantes solo aparecen con su misión.
- El mundo cambia según el día: el barquero solo sale ciertos días, un mercado semanal, algo en la abadía la tercera noche. Si llevas días atascado, aparece alguien con una pista.

### Ejemplo: la llave del puerto

Bajar a las mazmorras con una llave que está en el puerto. Con precios inventados: ida 5, vuelta 4, mazmorras 1; total 10, presupuesto 11.

- Terminar el día devuelve gratis al inicio: si la llave se conservara, la vuelta no se pagaría nunca. Por eso lo de misión vuelve a su sitio.
- El primer día averiguas dónde está la llave; el segundo vas directo con tu diario.
- Un atajo por descubrir: un barquero en el puerto, o un túnel a las mazmorras.

### Objetos

- **Criterio:** lo que resuelve la misión se pierde; lo que te hace mejor explorador se queda; lo que sabes (notas, contraseñas, nombres) se queda siempre.
- Explicación dentro de la historia: lo de misión no es tuyo (el carcelero echa en falta su llave). En el pergamino, separar "Lo que llevas prestado" de "Tus pertenencias".
- Se manejan con las manos: meter la llave en la cerradura y girarla. Un zurrón a la cintura con pocos huecos.
- Clases: herramientas (cuerda, catalejo, antorcha), consumibles (pan y queso, moneda para el barquero), para leer (cartas y libros que dejan la pista en el diario), de intercambio y recuerdos, expuestos en un estante de tu habitación.
- Equipo por terreno: botas (montaña), capa (noche de la abadía), remos buenos (lago), farol (cueva).
- Las botas: entrar en la montaña cuesta 2 en vez de 3, subes más rápido y llegas a senderos que antes no podías subir. Se pueden comprar al zapatero, encontrar o recibir de un cabrero.
- Ventajas que se suman: el explorador con botas gasta aún menos.

### Cartas y mercado

- Dibujadas en canvas, como naipes o miniaturas de manuscrito; mazo en abanico en la mano. Mucho más baratas de hacer que un modelo 3D.
- Antes de cada misión eliges cuáles llevas, por ejemplo cinco. Si compras con la mano llena, dejas una en el mostrador y la recuperas al acabar.
- De efecto continuo (botas) o de un solo uso (pan y queso: 1 punto). Otras: Cuerda de esparto, Caña de pescador, Yesca y pedernal (hoguera donde quieras, una vez al día), Cazuela (1 punto más al cocinar), Halcón, Perro, Mula.
- Las cosas de misión siguen siendo objetos reales, no cartas.
- Monedas de plata: se ganan con misiones y se conservan siempre.
- El mercado está en la plaza del poblado. Vender a la mitad de lo que costó, cada puesto con su oficio, mercancía que cambia al acabar cada misión, y premios de misión que no se venden.
- Hallazgos únicos al pasear: cada cofre se abre una vez, para no sacar monedas sin límite.

### Personajes

- Erudito (3 de estudio), diplomático (3 de palabra), ladrón (3 de maña; se queda una copia de la llave), cazador (rastros y más puntos por pieza).
- Puntos extra: se gastan antes que los generales y se recargan en cada intento. Los generales sirven también para investigar o convencer.
- Ninguna misión exige un personaje concreto: sin la habilidad, cuesta más o hay que dar un rodeo.

### PNJ, taberna y posada

- Cada misión tiene una lista de reparto: quién está, dónde y qué dice. Ejemplo: el carcelero deja su sala y está en el puerto con la llave.
- Recuerdan lo que sabes: "Ya te lo conté".
- Pocos modelos, variados con ropa y colores: el `criado` sirve de base para el camarero y el guardia sentado para los clientes.
- En la taberna: rumores gratis, chimenea para cocinar, comida y clientes cuyas charlas cambian según la misión.
- Empezar cada día en la posada, como viajero alojado allí; la partida podría empezar en el castillo, con una escena que te manda al poblado.
- Quién da las misiones: el usuario prefiere un PNJ en la taberna (cuando lo dijo aún era la posada), con el camarero y gente diversa; el camarero da la primera. Sin decidir si es un personaje aparte, como un viejo escribano, o el propio camarero.
- La boda podría continuar con otra misión y un banquete real en la plaza.

### Animales, pesca y caza

- Pesca con caña y con la mano; caza sin acción: acercarse sin asustar y un solo tiro con arco, o una trampa.
- Seguir al ciervo sin asustarlo lleva a un claro, un manantial o una carta rara.
- Cuaderno de animales que se completa observándolos. Animales que dan pistas: cuervos sobre la abadía, peces sobre algo hundido.
- Misiones de una cabra perdida o de un pez legendario. Un perro compañero (lo más difícil de hacer).
- Hogueras: hoy en el comedor y la abadía; no ponerlas junto al agua. Comer llevándose la comida a la boca.
- Lo pescado se estropea al terminar el día; lo comprado no. Sin misión, una vez cada cosa también, para no ganar monedas sin límite.

### Acantilado y zonas pequeñas

- Bajar al pie del acantilado como una zona más, igual que las mazmorras, con niebla en la senda: una cala, un naufragio o una cueva de contrabandistas.
- Un paso entre las rocas hasta la playa del puerto, abierto según la marea, que te cuenta un pescador.
- Otras zonas pequeñas: el interior de la torre de la isla, la cripta de la abadía, una gruta en la montaña.

### Encuentros con enemigos

Lo pidió el usuario. Las reglas de detalle son propuesta:

- Solo con misión activa, porque sin ella los puntos no cuentan.
- Decidido por el usuario: puede haber un encuentro en **cualquier cambio de zona**.
- Probabilidad distinta según el paso (más en la abadía, menos cerca del poblado), y los rumores de la posada avisan. Quitan poco, 1 o 2 puntos, y el presupuesto deja margen.
- Ninguno en la misión del tutorial, y como mucho uno por misión al principio.
- Se resuelven en la niebla del paso, sin pelea de acción.
- Otras salidas además de la lucha: pagar monedas (bandidos), convencer (diplomático) o echar comida (lobos).
- Un personaje guerrero con 3 puntos de lucha, y cartas de lucha como un escudo, una espada o un perro.
