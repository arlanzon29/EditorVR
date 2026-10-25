# Editor VR

Editor en realidad virtual (WebXR) para Meta Quest. De momento es una
habitación de 6 × 6 m con una ventana y una puerta que se abre a un pasillo
de 6 m, que lleva a una segunda habitación.

## Cómo se usa

- **Meta Quest:** abre la página en el navegador y pulsa el botón **VR**.
  **Joystick izquierdo:** andar hacia donde miras.
  **Joystick derecho** a izquierda o derecha: girar 30°.
  **Gatillo** apuntando a la puerta: abrirla o cerrarla.
- **Ordenador:** haz clic para capturar el ratón y muévete con **WASD**.
  Clic con la mira sobre la puerta: abrirla o cerrarla. **Esc** suelta el ratón.

## Probar en el Quest por wifi

WebXR exige HTTPS, así que hay un servidor local en `servidor/`:

1. Doble clic en `servidor/iniciar.cmd` (o `node servidor/servidor.js`).
2. En el navegador del Quest abre `https://<IP del PC>:8444/` y acepta el aviso
   del certificado casero la primera vez.
3. Cada vez que se guarda un archivo, la página se recarga sola (en VR hay que
   volver a pulsar el botón VR).

La primera vez crea `servidor/cert.pem` y `servidor/key.pem` (fuera de git). Si
cambia la IP del PC, bórralos y vuelve a arrancar.

Cómo se trabaja con Claude por voz en este proyecto: [VOZ.md](VOZ.md).
