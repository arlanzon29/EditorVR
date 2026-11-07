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
  derecho en -0,7 sin tocarlo y la vista subía sola. Fallo corregido: un stick mantenido fijo (andar recto
  más de 2 s) se tomaba por "soltado" y el personaje se paraba; ahora el stick solo
  se da por soltado si ha llegado con una bajada rápida (el muelle, `MUELLE`) y se queda quieto: es el stick que se
  queda a medias al soltarlo. Aflojar poco a poco no cuenta. (Se probó antes con "ha caído X de su pico" y paraba al
  aflojar un poco andando.)
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
- **Menú horneado otra vez:** se había dejado sin hornear mientras se cambiaba a menudo; el usuario pidió hornearlo para que vaya más ligero. Volvió a `SALAS_HORNEADAS` y se horneó con sus 11 luces (candelabros, antorchas, lámparas y la de la luna).
- **Solo tres zonas al principio:** poblado, bosque y lago (`ZONAS_ABIERTAS`); `partida.abierta()` cierra el resto (paso, mapa, portales), salvo en la partida de depuración y en las zonas que una partida vieja ya había visitado. La barca del lago se quitó de `salas/lago.html` (queda comentada). Estrellas escondidas (`js/estrellas.js`): 5 fijas, que salen al aceptar la misión y se cuentan en `estado.estrellas` y en el indicador. El posadero, con el encargo del tabernero aceptado o cumplido, ya no repite que el tabernero tiene una misión.
- **Camino de la posada sin sombras:** estaba en `salas/posada.html` y `luzEnCaminos` solo trata los de la sala del suelo; pasó a `salas/poblado.html` y ya recibe la sombra de los árboles.
- **Poblado de noche, de verdad:** al pisar el lago anochece (`estado.noche`) y al despertar al día siguiente vuelve el día. Se quitó el `?noche` de la dirección, que se habría quedado forzando la noche. Probado en la vista previa: lago → poblado de noche y sin moza; dormir → poblado de día y con ella.
- **historia.md:** el usuario planteó la historia: la boda como primer episodio, que hace que el personaje se quede en el poblado y necesite casa, la pareja con un hijo pequeño unido a él que viene a cazar, y de adolescente, aventuras mayores. Lo dicho va como decidido y lo demás, como propuesta.
- **Episodio 2, tu casa:** el usuario definió el episodio (episodio2.md) y pidió construirlo entero. La casa de 7 × 5 frente a la posada pasó a ser una sala propia (`salas/casa.html`) con la obra dibujada por un componente (`casa-obra`), para que cada fase no obligue a hornear; la casa vieja se quitó de lo horneado del poblado recortando sus triángulos al cargar (`HUECOS_HORNEADOS`), porque en la sesión no había Blender. Leonor, la cena, los sitios de farmeo de una sola carga, la barca otra vez, la cueva y la montaña abiertas y el primer enemigo, el lobo, con su cabeza en la pregunta. El usuario pidió también poder saltar a cualquier momento de las misiones en la partida de depuración (botones en la hoja de la misión).
- **Vista previa sin la red de A-Frame:** en la sesión en la nube el proxy no deja bajar A-Frame de cdn.jsdelivr.net; para probar con Playwright se sirve la misma versión instalada con npm (solo en la prueba, la página no cambia).
- **Conversación en cómic:** el usuario propuso viñetas tipo cómic para la charla con Leonor, y luego varias páginas y viñetas de distintos tamaños. Se hizo con fotos de la escena pasadas a cómic en canvas (sin imágenes externas). Primeros fallos: el filtro en pocos tonos por canal lo dejaba todo gris (pasó a escalones de luz conservando el color), Leonor no salía (al quitar los rombos del tutorial de la foto se ocultaba su entidad entera) y la toma de la casa, a 45 m, salía en blanco (el cielo y el terreno lejano van con el jugador). Pendiente, pedido por el usuario: modelos de Leonor y Garcés sin traje de boda, y sentados en la cena.
- **Viñetas en las gafas y Leonor de casada:** en el Quest la página de cómic no salía; lo más probable, que pasar las fotos a cómic en la CPU del Quest (todas las viñetas a resolución entera, de una vez) paraba la sesión. En VR se sacan a la mitad y la toma va en try/finally (si falla, la página sale igual y la escena queda como estaba); sin probar todavía en las gafas. El usuario vio a Leonor aún vestida de novia: modelo nuevo `leonor` (herramientas/modelar-leonor.py: saya verde, cinturón de cuero, toca blanca de casada con barboquejo; la cabeza y el esqueleto de la novia), en la posada y en la cena. Garcés sigue con el del novio.
- **Leonor, cara y espalda:** el usuario las vio raras en las gafas. La toca era un casquete cerrado que la cara atravesaba, con un barboquejo flotando y una caída en caja por la nuca; pasó a capucha abierta por delante (cerrada arriba, sobre la frente) y griñón cerrado al cuello. Y la saya salía torcida hacia atrás en reposo: esa animación no tenía claves en las piernas y se quedaba con el último paso del andar; ahora el reposo las pone quietas.
- **Viñetas opacas:** en las gafas la página de cómic se transparentaba. Era opaca y sin prueba de profundidad, pero en la pasada de lo opaco: lo transparente que estaba más cerca que ella (lo horneado, con `transparent`) se pintaba luego encima. Pasó a la pasada de lo transparente, como las tablas, con su `renderOrder` alto: va la última.
- **Leonor te lleva a la casa:** pedido por el usuario: al cerrar el cómic, Leonor te dice que la sigas y anda hasta la casa abandonada (por el borde de la plaza, por donde la moza, sin el pozo ni los puestos), esperándote si te quedas atrás. Es un paso del tutorial (`seguir-leonor`, del estado `casaVista`), para que su aviso no lo tape el siguiente. Sin probar todavía en las gafas.
- **Capucha de Leonor transparente:** la escena deja los modelos de una cara (objetos.js) y la toca era dos hojas abiertas que `normals_make_consistent` había puesto mirando las dos hacia fuera: el forro no se veía y, mirándola de frente, se veía a través. Ahora se orientan a mano (la de fuera hacia fuera, el forro hacia la cabeza). Para revisar modelos así, las fotos con `use_backface_culling`.
- **La foto desde las gafas no existe:** `/__vista.jpg` está pendiente (README): el usuario creyó haberla mandado y no llegó nada.
- **Una sola charla con Leonor:** en la última viñeta ella dice «Sígueme, te la enseño» y el botón final es «Seguirla»: al pulsarlo se cierra el cómic y echa a andar. Mientras te guía, apuntarla y apretar el gatillo no abre otra charla (solo recuerda que la sigas).
- **Leonor anda moviendo los brazos:** con las manos juntas delante, en reposo y al andar, parecía que aún llevaba el ramo. Ahora los brazos van caídos y, al andar, con el paso de cuatro tiempos de la moza (cada brazo al revés que su pierna). La toca, rosa claro, como pidió el usuario.
- **La casa, entera por fuera:** decidido por el usuario: por fuera, la misma en todos los episodios, para hornearla; la obra, toda de dentro. El tejado pasó de `casa-obra` a un componente fijo (`casa-fuera`, se funde y se hornea); fuera ya no hay escombros, maleza, parches ni puerta clavada, y el banco de obra está dentro, en la habitación (con el rombo del tutorial, que antes no tenía). La ruina de dentro: viga caída, tablas descolgadas, huecos en el techo y las paredes, escombros y maleza. Se entra desde el principio. Falta hornear la sala `casa` (necesita la vista previa: cuando el usuario se quite las gafas). Sin mirar todavía en la escena.
- **Leonor ya no te llevaba:** probablemente porque ya te había llevado una vez (`casaVista`) y, al recargar, volvía a la posada y allí se quedaba quieta. Ahora, si ya te ha enseñado la casa, aparece delante de ella; y aceptar la misión pone `casaVista` a falso, para que al volver a probarla desde la partida de depuración vuelva a guiarte. Sin confirmar con el usuario que era eso.
- **El gatillo en el cómic:** pedido por el usuario: con la página abierta, el rayo de los mandos solo da en el botón de la respuesta (`.pregunta`). Antes daba también en Leonor, y apretar sobre ella cerraba la charla; seguramente por eso a veces no te llevaba a la casa. Ya confirmado por el usuario que Leonor te guía bien.
- **Casa horneada:** con la vista previa (`?sinhornear&sinfundir&partida=1`) y `HORNEAR_SOLO=campo-poblado,poblado,casa`, de día y de noche. Se vació `HUECOS_HORNEADOS`: el poblado ya se horneó sin la casa vieja. El interior queda oscuro (la puerta abierta y las ventanas cerradas; el fuego y la lámpara solo están en la última fase y no se hornean).
- **Cabeza del lobo en rojo:** en la pregunta de entrar en la cueva, la cabeza que dice que hay enemigo va en rojo apagado, como pidió el usuario. Dijo además que la entrada de la cueva sigue muy fea, con una foto que no llegó (no hay foto desde las gafas todavía).
- **La pregunta de la cueva no nombra al lobo:** pedido por el usuario: la cabeza roja significa que puede haber un enemigo que cuesta puntos de energía combatir; el texto dice eso, sin decir cuál.
- **El enemigo, un riesgo:** el usuario pidió que la pregunta no diga cuánto cuesta combatir: solo enseña el precio de entrar (y sus monedas) y avisa de que puede haber un enemigo que gasta energía. Lo de más se sigue cobrando al entrar.
- **Foto desde las gafas, por fin:** `foto-para-claude` (js/conexion.js): botón X del mando izquierdo o tecla P. Saca la foto con una cámara aparte en tus ojos (la imagen de las gafas no se puede leer) y la manda a `/__vista.jpg`. El medidor, que estaba también en la X, queda solo en apretar el joystick izquierdo. Antes Claude le había dicho al usuario que ya funcionaba con A o X, y no era verdad.
- **El encuentro con el lobo, con espera:** pedido por el usuario: un cuadro con el lobo que cuenta lo que ha pasado, pero después de un rato de espera para que dé emoción. Al decir que sí a la cueva: aviso, silencio, gruñido y gañido o aullido, y el cuadro (con su cabeza, tachada si lo matas, y lo gastado); con Seguir, entras o huyes. El cartel de las preguntas admite ahora otro dibujo y un solo botón. Sin probar en las gafas.
- **Casa por dentro, con luz:** la foto del usuario (ya llega desde las gafas) la enseñaba negra por dentro: al hornear no había ninguna luz (postigos cerrados, el fuego solo al final). Dos luces fijas tenues en salas/casa.html, una por cuarto, y la casa horneada otra vez (`HORNEAR_SOLO=casa`, día y noche).
- **Fundido entre obras:** pedido por el usuario, para ver el cambio: al reparar, lo de antes se desvanece y lo nuevo aparece a la vez, en 2,5 s.
- **El rayo, encima de las viñetas:** pedido por el usuario: con la página de cómic abierta, el rayo de los mandos se dibuja encima (como con el mapa, `rayoEncima`, ahora en los dos mandos), para ver que llega al botón.
- **La foto, al gatillo lateral derecho:** el usuario usa la X para el medidor de depuración; la foto pasó al gatillo lateral del mando derecho, solo si no ha cogido nada con él. La X vuelve al medidor.
- **Obra gratis en depuración:** en la partida 1 el banco de obra no pide madera ni piedra, para ver cómo avanza la casa.
- **Chimenea y mesa de la casa:** la chimenea, de piedra clara, salía blanca con la luz fuerte: ahora es oscura. La mesa medía 2,4 m y llenaba el salón: ahora 1,6, con sus bancos, la silla de la cena y Leonor y Garcés más cerca. La cama "no parece horneada" porque no lo está: los muebles salen con la última obra y van sin hornear (`NO_FUNDIR`); queda pendiente hornear la fase terminada si se nota mucho.
- **Cómic en el móvil:** el usuario no vio las viñetas en el móvil (en el PC sí). Probado en la vista previa con tamaño de móvil: en vertical sale "Gira el móvil para jugar"; en horizontal la página sí sale, pero pequeña y con letra que no se lee. Ahora, fuera de VR, ocupa casi toda la pantalla (`tablaEnMonitor` con `llenar`). Lo más probable es que en el móvil no llegara a esa charla: cada navegador guarda sus propias partidas, y en GitHub Pages no hay partida de depuración para saltar a ella.
- **En el cómic, solo el cómic:** pedido por el usuario: con la página abierta no salen avisos (se descartan), ni el letrero de la zona, ni el botón del pergamino. Fuera de VR la página ocupa casi toda la pantalla.
- **Puertas y ventanas de la casa:** pedido por el usuario: la puerta se puede abrir y cerrar (antes estaba fija y abierta), el hueco pasó de 1,5 a 1 m porque la hoja estirada salía demasiado ancha, la habitación tiene su puerta, y la casa tres ventanas de verdad, con postigos abiertos. La mesa, al fondo del salón con un banco a cada lado, para no cerrar la entrada; Leonor y Garcés, a las cabeceras. La casa, horneada otra vez.
- **Vano de la habitación, la aldaba y el rombo del banco:** el vano del tabique pasó de 1,2 a 0,9 m (la puerta salía demasiado ancha). La aldaba de las puertas estiradas quedaba pegada a la jamba o tapada por la tabla en diagonal: ahora va a 12 cm del canto, por encima del travesaño de en medio. Y en la partida de depuración el rombo del tutorial no salía en el banco de obra (pedía llevar las cargas): ahora sale.
- **Leonor y Garcés sentados en la cena:** pedido por el usuario. Una animación `sentado` en sus modelos (y `brindis-sentado` para Garcés), sin modelo aparte: el modelo no baja, se pone 0,4 m más abajo en la escena. `persona-animada` admite otra animación de reposo. Las puertas de la casa usan ya la hoja de la posada (`puerta.glb`) a su escala, con los huecos a su medida, y la casa se horneó otra vez.
- **Muebles de Blender y la casa terminada horneada:** el usuario vio malos la cama y la mesa, hechas con cajas y sin hornear. Ahora son modelos (modelar-muebles.py: mesa de caballetes, banco, cama con cabecero, jergón y manta, arcón con flejes y estante con jarras y libros) en un componente fijo, `casa-muebles`, y la casa terminada tiene su propia versión horneada (`casa-terminada`), elegida por `archivoHorneado` según la obra.
- **La luz horneada tiembla con el fuego en la casa terminada:** el usuario preguntó por qué las antorchas hacen titilar la luz en la puerta y no en la pared horneada. Lo horneado es una imagen fija; solo en las salas de `SALAS_CON_FUEGO` tiembla un 4 %, toda a la vez. La casa terminada se añadió (tiene fuego y antorcha). En el poblado, de día, no.
- **La cena, de noche:** pedido por el usuario. Al terminar la casa anochece y se recarga la zona (así sale también la casa terminada horneada, de noche). Probado en la vista previa: obra 2 → reparar → de noche, con los muebles horneados.
- **La cena en viñetas y la chimenea de Blender:** pedidos por el usuario. La cena pasó de frases sueltas a una página de cómic de dos páginas (`COMIC_CENA`), con tomas de Garcés, Leonor, los dos y el fuego; probada en la vista previa. La chimenea de cajas se hizo en Blender (machones de sillares, dintel, campana, hogar y morillos, en piedra oscura) y la casa terminada se horneó otra vez con ella.
- **Dormir en tu casa:** pedido por el usuario: después de la cena, tu cama es la de tu casa (la de la posada lo dice y no deja dormir) y el día empieza allí.
- **La cama de tu casa no dejaba dormir:** la tabla se abría y se cerraba sola: `seHaAlejado` medía desde la posición local de la entidad, y la cama está dentro de `casa-obra` (en coordenadas de la casa). Ahora mide en el mundo. Además, al apuntar a una cama sale qué se puede hacer, y la noche de la cena el tutorial marca tu cama con el rombo (`dormir-casa`).
- **Después de la cena, sin Leonor y Garcés en el salón:** solo se sientan a la mesa hasta la cena (también si la partida tiene la misión de la casa y la casa hecha a la vez, como la de depuración después de las pruebas).
- **Bocadillos cuadrados:** pedido por el usuario: los globos del cómic pasaron de óvalos a rectángulos de esquinas redondeadas con doble reborde (el grueso de tinta y uno fino por dentro).
- **Llegar a la casa sin Leonor:** el usuario fue a la casa por su cuenta y Leonor se quedó esperándolo en la posada; el tutorial seguía en "sigue a Leonor" y el banco de obra no tenía rombo. Ahora, si llegas tú solo a menos de 6 m de la puerta, cuenta como vista: Leonor aparece delante de la puerta y sigue la obra.
- **La puerta junto a la pared y el aviso repetido:** al abrir la puerta asomaba, abajo, la piedra del zócalo: muros y zócalo acababan en el borde del hueco (2 cm dentro), y sus caras coincidían con las de las jambas. Ahora acaban debajo de las jambas; las del vano de la habitación, 1 cm por delante del tabique. Casa y casa terminada, horneadas otra vez. Y "Tu casa está terminada" se repetía al pasar por la habitación: la caja del banco de obra seguía allí sin banco; ya no avisa.
