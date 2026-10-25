# Editor VR

Escena en realidad virtual (WebXR, con [A-Frame](https://aframe.io) 1.7) para Meta Quest, de
estética feudal: salas de piedra, suelos y techos de madera con vigas, puertas de tablones con
herrajes de hierro y una gran escalera al estilo de la Escalera Dorada de la catedral de Burgos.
Todo está en [index.html](index.html); las texturas (madera, piedra) se dibujan en el propio
navegador, sin imágenes externas.

Se edita hablando con Claude: desde las gafas (por voz) o desde el ordenador. Claude puede saber
dónde estás en la escena y ver una foto de lo que ves, y tú puedes ver el escritorio del PC
dentro de la escena.

## La escena

Coordenadas en metros: **x** hacia la puerta de la sala 1 y el pasillo, **y** hacia arriba,
**z** hacia atrás (la ventana de la sala 1 está en z = -3).

| Zona | Dónde | Qué hay |
|---|---|---|
| **Sala 1** | 6 × 6 m, 3 m de alto (x, z = -3…3) | Paredes de piedra, suelo de tablas, techo de madera con 5 vigas. Ventana rústica hundida en el muro (marco de madera con 12 cuarterones, alféizar, cielo y campo). Mesa, silla y biblioteca en la esquina. La pantalla del PC, a la izquierda de la ventana. |
| **Pasillo** | 6 m (x = 3…9), 1,2 m de ancho | Paredes de piedra y suelo de madera. Puerta a la sala 1, puerta a la sala 2 al fondo y, a mitad, a la derecha, puerta a la sala 3. |
| **Sala 2** | 5 × 5 m (x = 9…14) | Como la sala 1: piedra, techo con vigas, ventana rústica, biblioteca, mesa separada de la pared y silla pegada a ella. |
| **Pasillo 2** | 3,4 m (x = 5,4…6,6, z = 0,6…4) | Ramal que lleva a la sala 3. A mitad, una antorcha de pared en cada lado, con luz cálida. |
| **Sala 3** | 12 × 10 m, 7,5 m de alto (x = 0…12, z = 4…14) | La grande. Muros de piedra de 40 cm con arcos arriba, techo con 8 vigas y la escalera. |
| **Pasillos de arriba** | Alrededor de la sala 3, por fuera de sus muros, a 4,4 m | Suelo de madera, techo y muro exterior de piedra. Se ven desde la sala por los arcos. |

**La escalera de la sala 3** ocupa toda la pared del fondo, de pared lateral a pared lateral:

1. Un tramo central ancho sube hasta un rellano (1,2 m), delante de un nicho.
2. Desde ahí, por delante, un tramo hacia cada lado hasta un rellano (2 m) que llega a la pared
   lateral. Debajo de cada uno, un **arco ciego** de piedra.
3. Desde cada rellano, pegados al fondo, los tramos vuelven hacia el centro y se juntan en el
   rellano de arriba (4,4 m). Allí, un arco del muro lleva a los **pasillos de arriba**.

El frente de la escalera es de sillares de piedra, las pisadas de losas de roca y las barandillas
doradas. Se puede subir andando; los tramos son macizos y no se pueden atravesar.

## Controles

**Meta Quest** (abre la página y pulsa el botón **VR**):

| Control | Qué hace |
|---|---|
| **Joystick izquierdo** | Andar hacia donde miras. Sube y baja escalones; no deja atravesar paredes ni puertas cerradas, ni caerse. |
| **Joystick derecho** a un lado | Girar 30°. |
| **Gatillo** apuntando a una puerta | Abrirla o cerrarla (el rayo se pone verde, la aldaba brilla y sale el cartel). |
| **Gatillo lateral** apuntando a la pantalla | Cogerla y colocarla; se queda donde la sueltes. |
| **Botón B o Y** | Traer la pantalla del PC delante de ti. |
| **Botón A o X** | Mandar a Claude una foto de lo que ves (el mando vibra al llegar). |

**Ordenador:** clic para capturar el ratón, **WASD** o flechas para andar (igual que el joystick:
con choques y escalones), clic con la mira en una puerta para abrirla, **Esc** suelta el ratón.

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
| `/__vista.jpg` | La escena, al pulsar A o X | Claude: la última foto de lo que ves |
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
  rellano de arriba, pasillos de arriba), `cabeza`, `suelo` (con la altura que pisas),
  `direccion`, `rumbo` (0 = hacia la ventana de la sala 1, 90 = hacia la puerta, 180 = hacia
  atrás) y `mira`: el punto, la distancia y el objeto que tienes delante. Así Claude puede
  colocar cosas "donde estoy" o "donde miro".
- `/__vista.jpg`: la foto del botón A o X. La escena se vuelve a dibujar desde tu cabeza
  (1280 × 720, 80°), sin que se note en las gafas.

## Cómo está hecho

Componentes de A-Frame en [index.html](index.html), por orden:

- **Movimiento:** `andar-joystick` (joystick y teclado), `giro-por-pasos`. Las zonas por las que
  se puede ir (`SALA`, `PASILLO`, …, `PASILLOS_ARRIBA`) se unen por puertas abiertas
  (`zonasPermitidas`); las alturas que se pisan están en `SUPERFICIES` (`sueloEn`: escalones de
  hasta 35 cm, sin caídas, sin atravesar lo macizo).
- **Materiales:** `suelo-madera`, `pared-piedra` (planos), `piedra-mundo` (cajas, con la textura
  alineada en el mundo).
- **Objetos:** `puerta`, `biblioteca`, `escalera-sala3`, `muro-arcos`, `arco-ciego`,
  `pasillos-arriba`.
- **Modelos de Blender** en `modelos/` (glTF binario, `.glb`), con `gltf-model="url(modelos/...)"`:
  `antorcha.glb` (soporte de hierro, mango de madera y llama, objeto aparte llamado `Llama`).
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
  - `modelos.blend`: el archivo de Blender con todos, para retocarlos y volver a exportar.
- **Conexión con el PC y Claude:** `pantalla-pc`, `agarrable`, `informe-posicion`,
  `foto-para-claude`.

## Trabajar con Claude

- Por voz desde las gafas, y el modo Quest / modo ordenador: [VOZ.md](VOZ.md).
- Instrucciones para Claude en este proyecto: [CLAUDE.md](CLAUDE.md).
