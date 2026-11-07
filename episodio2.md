# Episodio 2: Quedarte

Zona: poblado (la posada). Sigue a [la boda](historia.md) del tutorial. Reglas del juego en [JUEGO.md](JUEGO.md).

**Decidido** = lo dijo el usuario. **Propuesta** = para completar, sin decidir.

## Los novios

**Decidido:** los nombres los elige Claude. **Propuesta de nombres** (castellanos medievales, de Burgos):
- **Leonor**, la novia, ahora la mujer.
- **Garcés**, el marido.

## El inicio

**Decidido:**
- Empieza **un nuevo día en la posada**, el siguiente a la boda.
- El personaje **tiene decidido marcharse**: es un solitario y no quiere compromisos.
- Baja al **hall de entrada** de la posada.
- Allí se encuentra con **la novia, ahora la mujer** (la de la boda).
- Ella **se ha enterado de que se va a marchar**, lo **convence de quedarse** y le propone **reparar una casa abandonada**.
- Los novios piden que te quedes (ya decidido en [historia.md](historia.md)).
- **No te puedes marchar.** Tienes que quedarte y continuar la historia: es tu destino. Lo logra la conversación con ella, sin cambiar la escena.

**Propuesta (para ajustar):**
- Al despertar, el objetivo del juego no marca ninguna misión: el jugador cree que el camino sigue, y el cartel de objetivo
  dice algo como «Marcharte». Es lo que lo hace un cambio de rumbo, no un tutorial más.
- Cómo se ha enterado: se lo dijo el posadero, o vio tu bolsa preparada. Ella no acusa, pide.
- Argumentos de ella, en tono cálido: la boda no habría sido igual sin ti, el pueblo te debe un favor, y la casa está vacía
  desde hace años.
- El personaje duda (por lo que arrastra: huiste, no quieres atarte). Acepta sin explicar el porqué.
- Al aceptar, ella te señala dónde está la casa (marca en el mapa y sobre el sitio) y qué hace falta: madera, piedra…
  Es la entrada al resto del episodio: localizar los puntos donde conseguir materiales.

## La conversación (borrador, Propuesta)

Hall de la posada, de mañana. Llevas la bolsa al hombro. Leonor está junto a la puerta, en el camino de salida.

- **Leonor:** Me han dicho que te marchas.
- **Tú:** Mi camino sigue. Siempre ha sido así.
- **Leonor:** Anoche brindamos por ti. Garcés no ha dejado de hablar de la boda. ¿Y te vas sin una palabra?
- **Tú:** No soy hombre de quedarme.
- **Leonor:** Hay una casa al final del poblado, vacía desde hace años. Tiene las paredes en pie y el techo caído. Nadie la quiere, y a ti
  te vendría bien un sitio. Repárala, y si luego quieres irte, no te lo impedirá nadie.
- **Tú:** (duda) ...
- **Leonor:** Sólo te pido eso. Madera para el techo, piedra para los muros. El pueblo te ayudará con lo que sepa.
- **Tú:** (tras un silencio) Está bien. Veré esa casa.
- **Leonor:** Gracias. Sabía que te quedarías.
- **Leonor:** Sígueme, te la enseño. *(Y te lleva andando hasta la casa.)*

**Decidido:** la convence **la conversación**, sin nieve ni nada que cierre el camino (cambiaría la escena y habría que hornear todo).

Al final, el objetivo cambia a «Reparar la casa» y empieza la misión.

## La misión: los puntos de farmeo (Decidido)

La misión empieza al acabar la conversación. Hay que localizar los puntos donde se consigue cada material:

| Material | Zona | Puntos |
|---|---|---|
| Madera | Bosque | 2 zonas de madera |
| Madera | Isla (en el lago) | 1 zona de madera (hasta ahora sólo tenía árboles) |
| Piedra | Mina (cueva) | 1 zona de piedra |
| Piedra | Montaña | 2 zonas de piedra |

- Total: **3 zonas de madera** y **3 de piedra** que farmear.
- **El bote** tiene que estar ya en la zona del lago, para llegar a la isla.
- **La montaña** se habilita (hasta ahora cerrada) en este episodio: es la zona que se abre.

**Decidido:** la exploración es un punto importante del juego. **Cada punto de farmeo se agota al usarlo en la misión**: una vez
farmeado, no se puede volver a farmear ese punto. Por tanto, cada punto da **una sola carga**, y el total de la misión sale de los puntos
que encuentres: 3 de madera y 3 de piedra como máximo.

**Decidido:**
- **El diario de la misión** lista los materiales que hacen falta: **3 de madera y 3 de piedra** (la casa pide todos los puntos).
- Se llevan **de uno en uno**: se mantiene la regla de una carta de cada tipo (`puedeOficio`). Hay que llevar la carga a la
  casa antes de farmear la siguiente. No hace falta un contador de cargas a la vez, sólo contar las entregadas («Madera 1 de 3»).
- Los puntos están **algo escondidos**, como ya lo están los de piedra (la cantera de la cueva y los de la montaña).

**Propuesta:** los puntos usados y las cargas entregadas se guardan en la partida (como las estrellas). Como la casa pide 3 y 3,
hay que encontrarlos **todos**: el diario dice cuántos faltan, no dónde.

Por decidir: qué es «todo lo que tienes» al perder (¿también las monedas de plata y los materiales ya entregados a la casa,
o solo lo que llevas encima: puntos, cartas y pescado?), cuánto cuesta cada punto de farmeo en puntos de acción, dónde está exactamente cada uno (escondido), dónde se entrega
la carga en la casa en ruinas, y cómo se hace la reparación por fases.

## La cueva y los enemigos: el lobo (Decidido)

- **La cueva no está disponible en el episodio 1.** Se **activa aquí**, en el episodio 2 (ya está cerrada al empezar: no está en
  `ZONAS_ABIERTAS`). Es donde está la **cantera** de piedra.
- Aquí empieza un tema nuevo: **los enemigos**.
- **Hay un lobo dentro de la cueva.** Enfrentarlo **sólo consume más puntos** (no hay pelea de acción):
  - Con puntos suficientes, **matas al lobo** y puedes entrar. **Ya no vuelve a aparecer en la misión.**
  - Sin puntos suficientes, **vuelves a la posada** y **el lobo sigue** ahí para otro intento.

**Decidido:** el lobo de la cueva es de **una cabeza** y cuesta **2 puntos más** que entrar (la cueva cuesta 2: 4 en total).
Los puntos de cada encuentro **no siguen una escala fija** con las cabezas: el usuario decide en cada momento cuánto cuesta
cada enemigo.

**Decidido:** en el **cartel que sale al ir a la cueva** aparece un **símbolo de enemigo que indica el nivel**: una **cabeza de lobo, o dos, o tres**, según la
dificultad.

**Decidido (materiales y enemigos):**
- **Los puntos de madera y piedra** tienen el mismo aspecto que ahora (tocón con hacha, cantera), pero **en rincones**, lejos del
  camino principal. Sin ayuda: hay que explorar.
- **Matar al lobo:** pregunta de gasto y una escena corta, **sin pelea de acción**. Al aceptar, el lobo cae y se descuentan los puntos.
- **El cartel con las cabezas de lobo** es la **pregunta de gasto**, la que dice «se van a consumir x puntos: ¿quieres entrar o no?».
  Las cabezas salen ahí, junto al precio.
- **Si no llegas a los puntos,** vuelves a la posada y **pierdes todo lo que tienes, incluidos los puntos** (el usuario dijo «creo»:
  provisional). El lobo sigue ahí.

Propuesta (a ajustar):
- El símbolo sale en ese cartel, junto al precio, antes de cruzar.
- Se avisa antes de entrar, con la pregunta de gasto que ya usan los oficios.
- Estado en la partida: «lobo de la cueva muerto», como las estrellas cogidas.
- Es el primer enemigo y sirve de modelo para los siguientes. Encaja con los encuentros de [JUEGO.md](JUEGO.md) (se resuelven sin pelea
  de acción), pero esto es un enemigo fijo en un sitio, no un encuentro al azar en el cambio de zona.
- Otras salidas, por si se quieren más adelante: echarle comida (carne) en vez de gastar puntos.

## La casa (Decidido y Propuesta)

**Decidido:**
- La casa es **una del poblado, frente a la posada** (al otro lado de la plaza).
- **Tiene que poder abrirse la puerta y entrar** (ahora las casas son cajas cerradas).
- El interior tiene un **salón comedor** y **una habitación**.

**Propuesta (a ajustar):**
- **La casa:** la de `172 0 -146` (6 × 5 m, puerta a la calle, `rotation 0`), la más cercana a la puerta de la posada (x ≈ 162,5).
  Alternativa algo más grande: la de `150 0 -146` (7 × 5 m), algo más al oeste.
- **Interior:** sala nueva `salas/casa.html`, añadida a las del poblado en `MUNDO` (como la posada y la taberna). Se hornea sola,
  sin tocar el poblado. Como la casa mide 6 × 5, el comedor ocupa la parte de la puerta y la habitación, la del fondo, separadas
  por un tabique con su vano. Es pequeña: una casa humilde. Puerta que se abre, ventanas, techo de vigas.
- **Exterior y obra:** la caja ya horneada se queda como está. La puerta que se abre va **justo delante** de la pintada, separada
  1 o 2 cm. Lo que cambia con la obra (techo roto, tablones, madera nueva) va como piezas aparte, en `NO_FUNDIR`: no hace falta
  hornear el poblado.
- **Entrar:** zona andable propia (`zonasPermitidas`) unida por la puerta; mientras sea una ruina, la puerta está cerrada.

**Decidido (noviembre de 2026): por fuera, horneada.** La casa estaba sin hornear y se notaba. Por fuera está **entera y
siempre igual** (muros y tejado), en todos los episodios, y se hornea con su sombra en la plaza. **Toda la obra es de dentro**
(escombros, techo y vigas de dentro, muebles): desde la plaza ya no se ve la ruina.

**Decidido también:** se entra desde la primera fase, a ver la ruina. Lo fijo de dentro (muros, suelo, techo, tabique) se
hornea con la sala; lo de cada fase (escombros, viga caída, huecos, muebles) va aparte, sin hornear (`NO_FUNDIR`). Si se nota
mucho, más adelante se puede hornear una versión por fase. El banco de obra pasa a la habitación.

## Después (por definir)

- La ruina: cuál es y cómo se ve (ver el poblado).
- Materiales, dónde se consiguen y cuántos hacen falta.
- Fases de la reparación.
- Duermes en la posada hasta acabarla.

## Por decidir

- Nada de momento sobre el inicio. Lo siguiente: el texto de la conversación.

## Hecho (noviembre de 2026)

Construido entero; se puede probar en la partida 1 saltando a cada momento desde la hoja de la misión. Cómo está hecho:
[README.md](README.md), «Episodio 2: tu casa».

- Leonor en la entrada de la posada al día siguiente de la boda, con la conversación del borrador.
- La misión **Tu casa en el poblado**, con el diario de materiales (madera y piedra puestas de 3) y las marcas del tutorial.
- La casa de 7 × 5 m de `150, -146` (frente a la posada): ruina, dos avances y la casa terminada, con salón comedor y
  habitación. Cada obra, una carga de madera y otra de piedra en el banco de obra.
- Los seis sitios de farmeo (tres de madera y tres de piedra), de una carga cada uno en la misión. La barca del lago, otra vez.
- La cueva y la montaña se abren con la misión. El lobo de la cueva, con una cabeza de lobo en la pregunta.
- La cena final con Leonor y Garcés, y la noticia del niño.

Decisiones provisionales de Claude, para revisar:
- **Presupuesto de la misión: 20 puntos al día** (el de la boda era 9; sin misión, 30). Un día da para unas dos cargas.
- **Reparar no cuesta puntos**, solo la madera y la piedra.
- **«Pierdes todo»** con el lobo es lo que llevas encima: las cartas, el pescado y los puntos del día (se acaba el día).
  No se pierden las monedas ni lo ya puesto en la obra. La carga perdida vuelve a su sitio de farmeo, para que la casa
  se pueda acabar.
- En la misión, el mercader no compra la madera ni la piedra: si las vendieras, te quedarías sin sitios donde farmear.
- En la cena, Leonor y Garcés están **de pie** al otro lado de la mesa (no hay modelo de la novia sentada).
- La casa no tiene horneado propio: las piezas de la obra no se hornean (cambian), y lo fijo se ve con la luz general.
