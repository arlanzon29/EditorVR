// Editor VR: el menú principal, en su estancia (salas/menu.html, la zona "menu"). Una tabla con las partidas
// guardadas (RANURAS, en js/partida.js): de cada una, cómo va y sus botones (continuar y borrar, o empezarla si
// está vacía). Se usa como lo demás, con el rayo y el gatillo; en el ordenador, con la mira y el clic.

const MENU_ANCHO = 2, MENU_ALTO = 1.3;   // metros
const MENU_PX = 640;                     // píxeles de la tabla por metro
const MENU_FILA_Y = 190, MENU_FILA_ALTO = 200;   // en píxeles: dónde empieza la primera partida y lo que ocupa cada una
const MENU_BOTON_ANCHO = 0.46, MENU_BOTON_ALTO = 0.13;

AFRAME.registerComponent('menu-partidas', {
  init() {
    this.lienzo = document.createElement('canvas');
    this.lienzo.width = MENU_ANCHO * MENU_PX; this.lienzo.height = MENU_ALTO * MENU_PX;
    this.tex = new THREE.CanvasTexture(this.lienzo);
    this.tex.colorSpace = THREE.SRGBColorSpace;
    this.tabla = new THREE.Mesh(new THREE.PlaneGeometry(MENU_ANCHO, MENU_ALTO), new THREE.MeshBasicMaterial({ map: this.tex, fog: false }));
    this.el.setObject3D('mesh', this.tabla);
    this.botones = [];
    this.borrando = null;   // la partida que pregunta si se borra
    this.ultimo = 0;
    this.pintar();
  },
  remove() {
    this.quitarBotones();
    this.tabla.geometry.dispose(); this.tabla.material.dispose(); this.tex.dispose();
  },
  quitarBotones() {
    for (const b of this.botones) {
      const m = b.getObject3D('mesh');
      m.geometry.dispose(); m.material.map.dispose(); m.material.dispose();
      b.parentNode.removeChild(b);
    }
    this.botones = [];
  },
  // "columna": 0, el de la izquierda; 1, el de la derecha. El segundo botón de una pregunta cae donde estaba
  // "Borrar", y el "sí" en el otro lado: una doble pulsación no borra nada.
  boton(fila, columna, texto, hacer) {
    const e = document.createElement('a-entity');
    e.classList.add('clicable');
    const m = new THREE.Mesh(new THREE.PlaneGeometry(MENU_BOTON_ANCHO, MENU_BOTON_ALTO), new THREE.MeshBasicMaterial({ map: tablaDeTexto(texto, 368, 104), fog: false }));
    e.setObject3D('mesh', m);
    const x = MENU_ANCHO / 2 - 0.3 - (1 - columna) * (MENU_BOTON_ANCHO + 0.04);
    const y = MENU_ALTO / 2 - (MENU_FILA_Y + (fila + 0.5) * MENU_FILA_ALTO) / MENU_PX;
    e.setAttribute('position', `${x} ${y} 0.01`);
    e.addEventListener('mouseenter', () => m.material.color.set('#ffcc33'));
    e.addEventListener('mouseleave', () => m.material.color.set('#ffffff'));
    e.addEventListener('mousedown', () => {
      if (performance.now() - this.ultimo < 400) return;
      this.ultimo = performance.now();
      hacer();
    });
    this.el.appendChild(e);
    this.botones.push(e);
  },
  pintar() {
    this.quitarBotones();
    const g = this.lienzo.getContext('2d'), W = this.lienzo.width, H = this.lienzo.height;
    fondoDeTabla(g, W, H);
    g.font = '600 72px Georgia, serif'; g.fillText('Tierras del Reino', W / 2, 75);
    g.font = 'italic 34px Georgia, serif'; g.fillText('Elige partida', W / 2, 140);
    for (let i = 0; i < RANURAS; i++) this.pintarPartida(g, i, W);
    g.textAlign = 'center';
    g.font = 'italic 28px Georgia, serif';
    g.fillText('Apunta y aprieta el gatillo (en el ordenador, con la mira y el clic)', W / 2, H - 28);
    this.tex.needsUpdate = true;
  },
  pintarPartida(g, fila, W) {
    const r = fila + 1, s = partida.resumen(r), y = MENU_FILA_Y + fila * MENU_FILA_ALTO;
    g.strokeStyle = '#4a4640'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(40, y); g.lineTo(W - 40, y); g.stroke();
    g.textAlign = 'left'; g.fillStyle = '#d8c7a0';
    g.font = '600 44px Georgia, serif'; g.fillText(`Partida ${r}${r === PARTIDA_DEPURACION ? ' (depuración)' : ''}`, 60, y + 48);
    g.font = '30px Georgia, serif';
    if (!s) {
      g.font = 'italic 30px Georgia, serif'; g.fillText('Vacía', 60, y + 100);
      this.boton(fila, 1, 'Nueva partida', () => partida.abrir(r));
    } else if (this.borrando === r) {
      g.fillText('¿La borras? No se puede recuperar.', 60, y + 100);
      this.boton(fila, 0, 'Sí, borrar', () => { partida.borrar(r); this.borrando = null; this.pintar(); });
      this.boton(fila, 1, 'No', () => { this.borrando = null; this.pintar(); });
    } else {
      g.fillText(`Día ${s.dia}  ·  ${s.zona}  ·  ${s.monedas} ${s.monedas === 1 ? 'moneda' : 'monedas'}`, 60, y + 100);
      g.font = 'italic 27px Georgia, serif';
      g.fillText(`${s.mision ? 'Misión: ' + s.mision : 'Sin misión'}${s.fecha ? '  ·  ' + new Date(s.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : ''}`, 60, y + 148, W - 720);
      this.boton(fila, 0, 'Continuar', () => partida.abrir(r));
      this.boton(fila, 1, 'Borrar', () => { this.borrando = r; this.pintar(); });
    }
  },
});
