# Instrucciones para Claude en este proyecto

Escena WebXR (A-Frame 1.7) para Meta Quest, todo en `index.html`. Qué hay, controles, servidor
y cómo está hecho: [README.md](README.md). Léelo antes de cambiar la escena.

## Voz: solo en modo Quest

El usuario trabaja a veces con las gafas Quest puestas, dictando con Acceso por voz de
Windows, y a veces delante del ordenador. Cómo está montado: [VOZ.md](VOZ.md).

- **Modo Quest** = existe el archivo `.claude/modo-quest`. Comprobarlo antes de hablar.
  - Al recibir una orden: decir en voz alta una o dos frases cortas con lo que vas a hacer.
  - Al terminar: un resumen corto en voz alta ("Listo" + qué ha quedado hecho).
  - Voz: `System.Speech` con **Microsoft Helena Desktop** (código en VOZ.md). El audio del PC
    lo lleva el usuario a las gafas: no hay que mandar la voz al Quest.
- **Modo ordenador** = no existe el archivo. No hablar nada.
- Si dice "estoy en el Quest" / "me pongo las gafas", crear `.claude/modo-quest` (vacío).
  Si dice "estoy en el ordenador", borrarlo.
- El dictado cambia palabras ("Jordi" por "joystick", "paseo" por "pasillo", "así ya" por
  "silla") y a veces recoge la voz de Claude al principio del mensaje: ignorar ese eco,
  interpretar por el contexto y preguntar si no se entiende.

## Saber dónde está el usuario y ver la escena

Servidor: `node servidor/servidor.js` (puerto 8443 por defecto; normalmente ya está abierto en
su propia ventana, "Servidor Editor VR"). Al cambiar `servidor.js` hay que reiniciarlo; al
cambiar `index.html` no, la página se recarga sola.

- `https://localhost:8443/__posicion`: dónde está, en qué zona, a qué altura, hacia dónde mira
  y qué punto tiene delante. Usarlo para "pon X donde estoy" / "donde miro" / "esta pared".
- `https://localhost:8443/__vista.jpg`: última foto de lo que ve (botón A o X del mando).
  Descargarla con `curl -sk` al scratchpad y mirarla.
- **Vista previa propia:** `http://localhost:8080/` en el navegador integrado (no acepta el
  certificado del 8443). Para mirar un sitio concreto, mover el rig con JavaScript
  (`document.getElementById('rig').object3D.position.set(...)`, `rotation.y`).

## Estilo de la escena

- Estética **feudal / medieval**: piedra, madera oscura, hierro, arcos de medio punto. Nada que
  parezca moderno (pomos dorados, marcos blancos, colores chillones). Barandillas doradas solo
  en la escalera de la sala 3, como la Escalera Dorada de Burgos.
- Texturas dibujadas en canvas, sin imágenes externas: `suelo-madera`, `pared-piedra` (planos),
  `piedra-mundo` (cajas).
- Colores apagados (los libros, por ejemplo); la luz ambiente es fuerte y lo satura todo.

## Cómo programar aquí

- Código, nombres y comentarios **en español**, con la densidad de comentarios que ya hay.
- Todo lo que se pisa por encima del suelo va en `SUPERFICIES` (`macizo` si no se puede pasar
  por debajo); cada zona nueva por la que se pueda andar, en las zonas de `zonasPermitidas`
  (unidas por puertas, y `arriba: true` si solo se llega a la altura de la galería).
- Dos caras en el mismo plano parpadean (z-fighting). Al llegar un pasillo a un muro grueso
  (los de la sala 3 tienen 40 cm), sus paredes y techo terminan en la cara del muro: el hueco
  ya pone las suyas.
- Las cajas inclinadas se giran con un cuaternión al cargar (`loaded`), no con el atributo
  `rotation`: A-Frame aplica los ejes en otro orden y salen torcidas.
- Cambios grandes en `index.html`: un script de Node en el scratchpad que reemplaza texto
  exacto y falla si no lo encuentra (o lo encuentra repetido). Después, comprobar la sintaxis
  de los `<script>` y que `<a-entity>` y `</a-entity>` cuadran.
- Para comprobar escaleras y choques sin gafas, simular el recorrido con `sueloEn` y
  `zonasPermitidas` en Node, y mirar la escena en la vista previa.
- Tras cambiar algo, documentarlo en README.md (y aquí si cambia cómo trabajar).
