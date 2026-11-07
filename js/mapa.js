// Editor VR: el mapa, la misión, el diario, el inventario y la ayuda. Un pergamino con cinco pestañas: el mapa, con todas
// las zonas, los caminos y una flecha que dice dónde estás y hacia dónde miras; la misión, con lo hecho y lo que toca
// (partida.resumenMision); el diario de la partida, con lo
// aprendido y el botón de terminar el día; el inventario, con las cartas, las monedas y el botón de comer; y
// la ayuda, con todos los botones. A o Y lo abren y cierran, y de hoja se cambia apuntando a su pestaña (en el
// ordenador, la tecla N pasa a la siguiente, y después de la última se guarda). En VR va
// en el mando izquierdo; fuera, delante de la cámara. Empieza oculto.

const MAPA = { x0: -300, x1: 370, z0: -445, z1: 60 };   // lo que abarca, en metros del mundo
// Viaje rápido: en la pestaña del mapa, apuntar a un sello y apretar el gatillo derecho (en el ordenador,
// mirarlo y hacer clic) te lleva allí. Solo salen los de las zonas ya visitadas; en la partida de depuración, todos.
const NIEBLA_MAPA = 'rgb(185, 178, 163)';
// Un sello por lugar. Zona; dónde está en el mapa (x, z); adónde lleva (a, b); hacia dónde mira
const DESTINOS_MAPA = [
  { zona: 'castillo', x: 6, z: -25, a: 6, b: -25, giro: 180 },
  { zona: 'mazmorras', x: 27, z: 8, a: 1350, y: 3, b: -52.9, giro: 0 },
  { zona: 'bosque', x: 6, z: -60, a: 6, b: -60, giro: 0 },
  { zona: 'cueva', x: 24, z: -150, a: 1010, b: -100, giro: -90 },
  { zona: 'lago', x: 5, z: -226, a: 5, b: -226, giro: 0 },
  { zona: 'puerto', x: 285, z: -349, a: 285, b: -349, giro: -90 },
  { zona: 'poblado', x: 160, z: -108, a: 160, b: -108, giro: 0 },
  { zona: 'acantilado', x: 300, z: -120, a: 300, b: -120, giro: -90 },
  { zona: 'montana', x: -115, z: -123, a: -115, b: -123, giro: 90 },
  { zona: 'abadia', x: -180, z: -300, a: -180, b: -300, giro: 0 },
];
// los caminos, trazados a mano sobre los de cada zona
const CAMINOS_MAPA = [
  [[6, -7], [8, -15], [4, -25], [6, -35], [6, -45], [3, -54], [6, -66], [9, -76], [6, -84], [12, -92], [8, -110], [11, -150], [6, -200], [6, -231]],
  [[9, -74], [50, -100], [90, -120], [160, -120], [230, -120], [300, -120], [324, -120]],
  [[5, -370], [30, -378], [60, -365], [90, -345], [140, -348], [200, -352], [250, -345], [303, -349]],
  [[285, -349], [282, -300], [272, -260], [270, -232]],
  [[3, -58], [-40, -95], [-80, -120], [-125, -125], [-150, -160], [-180, -200], [-180, -230], [-180, -290], [-180, -315]],
];
const B_MANTENIDO_MS = 600;   // botón B: pulsado, las cartas; mantenido, la pantalla del PC (js/conexion.js)
const HOJA_MAPA = 0, HOJA_MISION = 1, HOJA_DIARIO = 2, HOJA_INVENTARIO = 3, HOJA_AYUDA = 4;
AFRAME.registerComponent('mapa', {
  init() {
    const W = 1024, H = Math.round(W * (MAPA.z1 - MAPA.z0) / (MAPA.x1 - MAPA.x0));
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    this.lienzoMapa = c;
    this.mapaBase = document.createElement('canvas');
    this.mapaBase.width = W; this.mapaBase.height = H;
    this.dibujar(this.mapaBase.getContext('2d'), W, H);
    const lienzo = l => { const t = new THREE.CanvasTexture(l); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
    const tex = lienzo(c);
    const c2 = this.lienzoAyuda = document.createElement('canvas');
    c2.width = W; c2.height = H;
    this.pintarAyuda();
    // la misión, el diario y el inventario se redibujan cuando cambia la partida
    this.lienzoMision = document.createElement('canvas');
    this.lienzoMision.width = W; this.lienzoMision.height = H;
    this.lienzoDiario = document.createElement('canvas');
    this.lienzoDiario.width = W; this.lienzoDiario.height = H;
    this.lienzoInventario = document.createElement('canvas');
    this.lienzoInventario.width = W; this.lienzoInventario.height = H;
    this.hojas = [tex, lienzo(this.lienzoMision), lienzo(this.lienzoDiario), lienzo(this.lienzoInventario), lienzo(c2)];
    this.botones = { [HOJA_MISION]: [], [HOJA_DIARIO]: [], [HOJA_INVENTARIO]: [] };   // { x, y, w, h (en el lienzo), hacer }
    this.confirmando = false;
    this.pintarMision();
    this.pintarDiario();
    this.pintarInventario();
    document.addEventListener('partida-cambia', () => { this.pintarMision(); this.pintarDiario(); this.pintarInventario(); });
    const ancho = 0.42, alto = ancho * H / W;
    this.ancho = ancho; this.alto = alto;
    this.panel = new THREE.Mesh(new THREE.PlaneGeometry(ancho, alto), new THREE.MeshBasicMaterial({ map: tex, fog: false, depthTest: false, transparent: true }));
    this.panel.renderOrder = 997;
    this.panel.visible = false;
    // la flecha: un triángulo rojo oscuro, con un borde claro para que se vea sobre cualquier zona
    const forma = new THREE.Shape();
    forma.moveTo(0, 0.016); forma.lineTo(0.0105, -0.012); forma.lineTo(0, -0.006); forma.lineTo(-0.0105, -0.012); forma.lineTo(0, 0.016);
    const flecha = new THREE.Mesh(new THREE.ShapeGeometry(forma), new THREE.MeshBasicMaterial({ color: '#a01f16', fog: false, depthTest: false, transparent: true }));
    flecha.renderOrder = 998;
    this.flecha = flecha;
    this.panel.add(flecha);
    // el brillo sobre el botón del diario al que se apunta
    this.brillo = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: '#ffcc33', opacity: 0.35, fog: false, depthTest: false, transparent: true }));
    this.brillo.renderOrder = 998;
    this.brillo.visible = false;
    this.panel.add(this.brillo);
    this.botonApuntado = null;
    // el objeto en 3D, girando delante de su carta: el pez de los bancos. Transparente solo para dibujarse
    // después de la hoja, que no mira la profundidad y lo taparía
    // el punto del pergamino al que apunta el rayo
    this.puntero = new THREE.Mesh(new THREE.CircleGeometry(0.004, 14), new THREE.MeshBasicMaterial({ color: '#c8201a', fog: false, depthTest: false, transparent: true }));
    this.puntero.renderOrder = 999;
    this.puntero.visible = false;
    this.panel.add(this.puntero);
    this.modeloInventario = new THREE.Mesh(formaDePez(), new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, fog: false, transparent: true }));
    this.modeloInventario.scale.setScalar(0.09);
    // (en el hueco del dibujo de la carta del pescado, la primera, que se pinta en 50, 235 a la mitad: pintarInventario)
    this.modeloInventario.position.set((140 / W - 0.5) * ancho, (0.5 - 355 / H) * alto, 0.03);
    this.modeloInventario.renderOrder = 998;
    this.modeloInventario.visible = false;
    this.panel.add(this.modeloInventario);
    // y los de las demás cartas (js/oficios.js), cada uno en el hueco de la suya (huecosCartas, de pintarInventario)
    this.modelosCartas = modelosDeCartas();
    for (const m of Object.values(this.modelosCartas)) { m.scale.setScalar(0.045); m.visible = false; this.panel.add(m); }
    this.mira = new THREE.Vector3(); this.yo = new THREE.Vector3();
    // los sellos de los destinos: se encienden al apuntarlos
    this.visitadas = new Set();
    this.pintarMapa();
    // cada partida tiene sus zonas visitadas
    // (y la ayuda: los botones de depurar solo salen en su partida)
    document.addEventListener('partida-abierta', () => { this.visitadas = new Set(partida.estado.visitadas); this.pintarMapa(); this.pintarAyuda(); this.hojas[HOJA_AYUDA].needsUpdate = true; });
    // el aro dorado alrededor de la zona que pide el tutorial
    this.colocarMarcaMapa = () => {
      const paso = partida.pasoTutorial(), d = paso && paso.zona && DESTINOS_MAPA.find(s => s.zona === paso.zona);
      this.marcaMapa.visible = this.hoja === HOJA_MAPA && !!d;
      if (d) this.marcaMapa.position.set(((d.x - MAPA.x0) / (MAPA.x1 - MAPA.x0) - 0.5) * ancho, -((d.z - MAPA.z0) / (MAPA.z1 - MAPA.z0) - 0.5) * alto, 0.0006);
    };
    this.marcaMapa = new THREE.Mesh(new THREE.RingGeometry(0.014, 0.02, 24), new THREE.MeshBasicMaterial({ color: '#d9a020', fog: false, depthTest: false, transparent: true }));
    this.marcaMapa.renderOrder = 997.6;
    this.marcaMapa.visible = false;
    this.panel.add(this.marcaMapa);
    this.sellos = DESTINOS_MAPA.map(d => {
      const s = new THREE.Mesh(new THREE.CircleGeometry(0.0085, 14), new THREE.MeshBasicMaterial({ color: '#7a1f18', fog: false, depthTest: false, transparent: true }));
      s.position.set(((d.x - MAPA.x0) / (MAPA.x1 - MAPA.x0) - 0.5) * ancho, -((d.z - MAPA.z0) / (MAPA.z1 - MAPA.z0) - 0.5) * alto, 0.0005);
      s.renderOrder = 997.5;
      s.destino = d;
      this.panel.add(s);
      return s;
    });
    this.apuntado = null;
    this.rayo = new THREE.Raycaster();
    // dónde está el ratón en la vista (de -1 a 1), para apuntar al pergamino en el ordenador
    this.ndc = new THREE.Vector2();
    this.ponerRaton = e => {
      const c = this.el.canvas; if (!c) return;
      const r = c.getBoundingClientRect();
      this.ndc.set((e.clientX - r.left) / r.width * 2 - 1, -((e.clientY - r.top) / r.height * 2 - 1));
    };
    window.addEventListener('mousemove', this.ponerRaton);
    const viajar = () => this.viajar();
    window.addEventListener('mousedown', e => {
      if (e.button !== 0 || this.el.is('vr-mode')) return;
      if (this.panel.visible) { this.ponerRaton(e); this.mirarSellos(); this.mirarBotones(); }   // (lo que hay bajo el ratón en este instante)
      viajar();
    });   // (el derecho es correr)
    // cerrado → mapa → diario → inventario → ayuda → cerrado
    this.hoja = -1;
    // en el ordenador, la tecla N va pasando de hoja: la mira se mueve con el pergamino y no llega a las pestañas
    const alternar = () => ponerHoja(this.hoja + 1 < this.hojas.length ? this.hoja + 1 : -1);
    // en VR, A o Y abren y cierran; de hoja se cambia apuntando a su pestaña
    const abrirCerrar = () => ponerHoja(this.hoja < 0 ? HOJA_MAPA : -1);
    const ponerHoja = hoja => {
      if (!partida.ranura) return;   // (en el menú no hay pergamino)
      this.hoja = hoja;
      this.panel.visible = this.hoja >= 0;
      this.brillo.visible = false; this.botonApuntado = null;
      if (this.confirmando) { this.confirmando = false; this.pintarDiario(); }
      this.modoRaton(this.hoja >= 0);
      if (this.hoja < 0) return;
      if (this.hoja === HOJA_MISION) this.pintarMision();
      this.panel.material.map = this.hojas[this.hoja];
      this.panel.material.needsUpdate = true;
      this.flecha.visible = this.hoja === HOJA_MAPA;
      for (const s of this.sellos) s.visible = this.hoja === HOJA_MAPA;
      this.colocarMarcaMapa();
    };
    this.el.addEventListener('mapa-alternar', alternar);   // (la Y del mando de Xbox, js/movimiento.js)
    // Botón arriba a la derecha (ordenador y móvil, fuera de VR): abre y cierra el pergamino, con el ratón libre
    // o con el dedo. No sale en el menú ni en VR.
    const estilo = document.createElement('style');
    estilo.textContent = '.boton-pergamino{position:fixed;top:14px;right:14px;z-index:25;display:none;align-items:center;gap:8px;padding:8px 14px 8px 10px;'
      + 'border-radius:22px;border:none;cursor:pointer;font:600 17px Georgia,serif;color:#e8d9b0;-webkit-tap-highlight-color:transparent;touch-action:manipulation;'
      + 'background:radial-gradient(circle at 50% 35%,#4a3826,#2a1f14 70%,#1c140c);'
      + 'box-shadow:0 0 0 2px #3a3a3a,0 0 0 3px #1a1a1a,0 0 0 4px #5a5a5a,0 4px 10px rgba(0,0,0,.5)}'
      + '.boton-pergamino:active{color:#f0c878;transform:scale(.96)}'
      + '.boton-pergamino i{width:22px;height:16px;border-radius:3px;background:linear-gradient(90deg,#8a6b3f 0 4px,#d9c49a 4px calc(100% - 4px),#8a6b3f calc(100% - 4px))}';
    document.head.appendChild(estilo);
    const boton = document.createElement('button');
    boton.className = 'boton-pergamino';
    boton.innerHTML = '<i></i><span>Pergamino</span>';
    // (que el clic no llegue a la escena ni al pergamino de debajo)
    for (const ev of ['mousedown', 'touchstart', 'touchend']) boton.addEventListener(ev, e => e.stopPropagation());
    boton.addEventListener('click', e => { e.stopPropagation(); abrirCerrar(); });
    document.body.appendChild(boton);
    this.botonPergamino = setInterval(() => {
      boton.style.display = partida.ranura && !this.el.is('vr-mode') && !comicAbierto ? 'flex' : 'none';   // (con el cómic abierto, solo el cómic)
      boton.querySelector('span').textContent = this.hoja >= 0 ? 'Cerrar' : 'Pergamino';
    }, 300);
    window.addEventListener('keydown', e => {
      if (e.code === 'KeyN') alternar();
      // en el ordenador la mira no puede apuntar al pergamino, que va con ella: con la hoja abierta, teclas
      if (this.hoja === HOJA_DIARIO && e.code === 'KeyT') this.pulsarTerminar();
      if (this.hoja === HOJA_DIARIO && e.code === 'KeyQ') this.pulsarSalir();
      if (this.hoja === HOJA_INVENTARIO && e.code === 'KeyC') partida.comer();
    });
    const mando = () => document.querySelector('[laser-controls="hand: left"]');
    const enganchar = () => {
      const m = mando();
      if (!m) return setTimeout(enganchar, 500);
      m.addEventListener('ybuttondown', abrirCerrar);
      const derecho = document.querySelector('[laser-controls="hand: right"]');
      if (derecho) {
        derecho.addEventListener('abuttondown', abrirCerrar); derecho.addEventListener('triggerdown', viajar);
        let desde = 0;
        derecho.addEventListener('bbuttondown', () => { desde = performance.now(); });
        derecho.addEventListener('bbuttonup', () => { if (performance.now() - desde < B_MANTENIDO_MS) ponerHoja(this.hoja === HOJA_INVENTARIO ? -1 : HOJA_INVENTARIO); });
      }
    };
    enganchar();
    // las pestañas, de arriba de cada hoja, son botones de todas ellas (ver pestanas)
    this.botonesPestanas = this.hojas.map((_, i) => ({ x: 30 + i * 145, y: 24, w: 140, h: 42, hacer: () => ponerHoja(i) }));
    this.colocar = () => {
      const m = mando();
      if (this.el.is('vr-mode') && m) {
        m.object3D.add(this.panel);
        this.panel.position.set(0.03, 0.2, -0.12); this.panel.rotation.set(-0.6, 0, 0);
      } else {
        this.el.camera.el.object3D.add(this.panel);
        this.panel.position.set(0, 0, -0.5); this.panel.rotation.set(0, 0, 0);
      }
    };
    this.el.addEventListener('enter-vr', () => { for (const ms of [300, 1000, 2500]) setTimeout(this.colocar, ms); });
    this.el.addEventListener('exit-vr', this.colocar);
    if (this.el.hasLoaded) this.colocar(); else this.el.addEventListener('loaded', this.colocar, { once: true });
  },
  // Las pestañas, arriba a la izquierda, con la que está abierta más clara
  pestanas(g, W, abierta) {
    ['Mapa', 'Misión', 'Diario', 'Inventario', 'Ayuda'].forEach((texto, i) => {
      const x = 30 + i * 145;
      g.fillStyle = i === abierta ? '#ead9ae' : '#a4906a';
      g.strokeStyle = '#3a2616'; g.lineWidth = 3;
      g.beginPath(); g.moveTo(x, 66); g.lineTo(x + 8, 24); g.lineTo(x + 132, 24); g.lineTo(x + 140, 66); g.closePath(); g.fill(); g.stroke();
      g.font = `600 ${i === abierta ? 30 : 26}px Georgia, serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = '#3a2616'; g.fillText(texto, x + 70, 47, 118);
    });
  },
  // Fondo de pergamino, con sus manchas y sus pestañas, para las hojas que se redibujan
  fondoHoja(g, W, H, hoja) {
    g.fillStyle = '#d7c49a'; g.fillRect(0, 0, W, H);
    let s = 23;
    const azar = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 200; i++) {
      g.fillStyle = `rgba(${azar() > 0.5 ? '120, 92, 54' : '245, 232, 200'}, ${0.03 + azar() * 0.05})`;
      g.beginPath(); g.ellipse(azar() * W, azar() * H, 10 + azar() * 60, 8 + azar() * 40, azar() * 3, 0, Math.PI * 2); g.fill();
    }
    g.strokeStyle = 'rgba(58, 38, 22, 0.8)'; g.lineWidth = 6; g.strokeRect(10, 10, W - 20, H - 20);
    this.pestanas(g, W, hoja);
    g.fillStyle = '#3a2616'; g.textAlign = 'left'; g.textBaseline = 'middle';
  },
  // Un botón abajo de la hoja, apuntado en la lista de esa hoja
  boton(g, H, hoja, x, w, texto, hacer) {
    const by = H - 92, bh = 62, TINTA = '#3a2616';
    g.fillStyle = '#b89f6e'; g.fillRect(x, by, w, bh);
    g.strokeStyle = TINTA; g.lineWidth = 3; g.strokeRect(x, by, w, bh);
    g.fillStyle = TINTA; g.textAlign = 'center'; g.font = '600 25px Georgia, serif';
    g.fillText(texto, x + w / 2, by + bh / 2 + 2, w - 16);
    g.textAlign = 'left';
    this.botones[hoja].push({ x, y: by, w, h: bh, hacer });
  },
  // La hoja de la misión: en cuál estás, sus pasos (hechos, con su marca) y lo siguiente que hay que hacer
  pintarMision() {
    const r = partida.resumenMision(), c = this.lienzoMision, g = c.getContext('2d'), W = c.width, H = c.height, TINTA = '#3a2616';
    this.fondoHoja(g, W, H, HOJA_MISION);
    let y = 110;
    const fila = (texto, letra, x = 50) => {
      g.font = `${letra} Georgia, serif`;
      for (const l of partirTexto(g, texto, W - x - 50)) { g.fillText(l, x, y); y += parseInt(letra.match(/(\d+)px/)[1], 10) + 11; }
    };
    fila(r.titulo, '600 38px');
    if (r.estado) fila(r.estado, 'italic 25px');
    y += 14;
    if (r.pasos.length) {
      fila('Lo hecho', '600 30px');
      for (const p of r.pasos) {
        // una casilla, con su marca si está hecho
        g.strokeStyle = TINTA; g.lineWidth = 3; g.strokeRect(52, y - 13, 26, 26);
        if (p.hecho) { g.lineWidth = 5; g.beginPath(); g.moveTo(56, y); g.lineTo(64, y + 9); g.lineTo(80, y - 16); g.stroke(); }
        g.fillStyle = p.hecho ? TINTA : 'rgba(58, 38, 22, 0.6)';
        fila(p.texto, p.hecho ? '26px' : 'italic 26px', 96);
        g.fillStyle = TINTA;
        y += 2;
      }
      y += 14;
    }
    fila('Lo siguiente', '600 30px');
    fila(r.siguiente, '600 27px');
    // en la partida de depuración, saltar a cualquier momento de las misiones (partida.saltar)
    this.botones[HOJA_MISION] = [];
    if (partida.depuracion()) {
      const i = partida.estado.depura || 0, n = SALTOS_DEPURACION.length, siguiente = SALTOS_DEPURACION[(i + 1) % n].nombre;
      g.font = 'italic 22px Georgia, serif';
      g.fillText(`Depuración, ${i + 1} de ${n}: ${SALTOS_DEPURACION[i].nombre}`, 50, H - 112, W - 100);
      this.boton(g, H, HOJA_MISION, 50, 260, '◀ Anterior', () => partida.saltar(i - 1));
      this.boton(g, H, HOJA_MISION, 330, W - 380, `${siguiente} ▶`, () => partida.saltar(i + 1));
    }
    this.hojas[HOJA_MISION].needsUpdate = true;
  },
  // La hoja del inventario: las cartas que llevas, en fila (el pescado, el primero), las monedas y los botones de comer
  pintarInventario() {
    const e = partida.estado, c = this.lienzoInventario, g = c.getContext('2d'), W = c.width, H = c.height;
    this.fondoHoja(g, W, H, HOJA_INVENTARIO);
    this.botones[HOJA_INVENTARIO] = [];
    g.font = '600 38px Georgia, serif'; g.fillText('Inventario', 50, 110);
    g.font = '27px Georgia, serif'; g.fillText(`Monedas de plata: ${e.monedas}`, 50, 158);
    g.font = '600 30px Georgia, serif'; g.fillText('Cartas', 50, 205);
    const cartas = partida.cartasQueLlevas();
    if (!cartas.length) { g.font = 'italic 25px Georgia, serif'; g.fillText('No llevas ninguna.', 50, 250); }
    let boton = 0;
    this.huecosCartas = {};
    cartas.forEach(([tipo, como], i) => {
      this.huecosCartas[tipo] = { x: 50 + i * 200 + 90, y: 344 };   // (el centro del hueco del dibujo, en el lienzo)
      g.save(); g.translate(50 + i * 200, 235); g.scale(0.5, 0.5);
      // (los dibujos van aparte, en 3D: modeloInventario, el pez, y modelosCartas)
      if (tipo === 'pescado') dibujarCartaPescado(g, 360, 520, como, false);
      else dibujarCarta(g, 360, 520, tipo, como, false);
      g.restore();
      if (CARTAS[tipo].comer && boton < 2) this.boton(g, H, HOJA_INVENTARIO, 50 + boton++ * 440, 420, `Comer ${CARTAS[tipo].una}${boton === 1 ? ' (C)' : ''}`, () => partida.comer(tipo));
    });
    g.fillStyle = '#3a2616'; g.textAlign = 'left'; g.textBaseline = 'middle';
    g.font = 'italic 24px Georgia, serif';
    g.fillText(`Solo se puede llevar una carta de cada tipo. El mercader del poblado las compra a ${PRECIO_CARTA} monedas.`, 50, 525, W - 100);
    this.hojas[HOJA_INVENTARIO].needsUpdate = true;
    this.botonApuntado = null;
    if (this.brillo) this.brillo.visible = false;   // (la primera vez aún no existe)
  },
  // La hoja del diario: el día, la misión, lo aprendido, los precios y el botón de terminar el día
  pintarDiario() {
    const e = partida.estado, m = partida.misionActiva(), c = this.lienzoDiario, g = c.getContext('2d'), W = c.width, H = c.height;
    this.fondoHoja(g, W, H, HOJA_DIARIO);
    let y = 105;
    const fila = (texto, letra = '27px') => {
      g.font = `${letra} Georgia, serif`;
      for (const l of partirTexto(g, texto, W - 100)) { g.fillText(l, 50, y); y += parseInt(letra.match(/(\d+)px/)[1], 10) + 11; }
    };
    fila(`Día ${e.dia}`, '600 38px');
    y += 4;
    const paso = partida.pasoTutorial();
    if (paso) fila('Ahora: ' + paso.texto, '600 27px');
    const quedan = `Te ${e.puntos === 1 ? 'queda 1 punto' : `quedan ${e.puntos} puntos`}`;
    fila(m ? `Misión: ${m.titulo}. ${quedan}.` : `Sin misión: ${quedan} de los ${PUNTOS_LIBRE} del día. Las misiones se reciben en la taberna.`);
    fila('Entrar cuesta: ' + Object.entries(PRECIOS_ZONA).map(([z, p]) => `${MUNDO[z].titulo.replace(/^(El|La|Las) /, '')} ${p}`).join(', ') + '.', '22px');
    y += 12;
    fila('Lo aprendido', '600 30px');
    if (!e.aprendido.length) fila('Todavía nada.', 'italic 25px');
    for (const a of e.aprendido) fila('· ' + a, '25px');
    // el botón, abajo
    this.botones[HOJA_DIARIO] = [];
    const aviso = e.pescado ? 'Se pierde el pescado' : 'Vuelves a la posada';
    this.boton(g, H, HOJA_DIARIO, 50, 500, this.confirmando ? `¿Seguro? ${aviso}. (T)` : 'Terminar el día (T)', () => this.pulsarTerminar());
    this.boton(g, H, HOJA_DIARIO, 570, W - 620, 'Salir al menú (Q)', () => this.pulsarSalir());
    this.hojas[HOJA_DIARIO].needsUpdate = true;
    this.botonApuntado = null;
    if (this.brillo) this.brillo.visible = false;   // (la primera vez aún no existe)
  },
  // Primero avisa de lo que se pierde; la segunda vez, termina
  pulsarTerminar() {
    if (!this.confirmando) { this.confirmando = true; return this.pintarDiario(); }
    this.confirmando = false;
    this.cerrar();
    partida.terminarDia();
  },
  // Sin confirmar: no se pierde nada
  pulsarSalir() {
    if (!partida.salirAlMenu()) return;
    this.cerrar();
  },
  // qué botón de la hoja abierta tiene delante el rayo
  mirarBotones() {
    const p = this.puntoEnPanel();
    let mejor = null;
    if (p) {
      const W = this.lienzoDiario.width, H = this.lienzoDiario.height, x = (p.x / this.ancho + 0.5) * W, y = (0.5 - p.y / this.alto) * H;
      mejor = [...this.botonesPestanas, ...(this.botones[this.hoja] || [])].find(b => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) || null;
    }
    if (mejor === this.botonApuntado) return;
    this.botonApuntado = mejor;
    this.brillo.visible = !!mejor;
    if (!mejor) return;
    const W = this.lienzoDiario.width, H = this.lienzoDiario.height;
    this.brillo.scale.set(mejor.w / W * this.ancho, mejor.h / H * this.alto, 1);
    this.brillo.position.set(((mejor.x + mejor.w / 2) / W - 0.5) * this.ancho, (0.5 - (mejor.y + mejor.h / 2) / H) * this.alto, 0.001);
  },
  pintarAyuda() {
    const g = this.lienzoAyuda.getContext('2d'), W = this.lienzoAyuda.width;
    this.dibujarAyuda(g, W, this.lienzoAyuda.height);
    this.pestanas(g, W, HOJA_AYUDA);
  },
  dibujarAyuda(g, W, H) {
    g.fillStyle = '#d7c49a'; g.fillRect(0, 0, W, H);
    let s = 15;
    const azar = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 200; i++) {
      g.fillStyle = `rgba(${azar() > 0.5 ? '120, 92, 54' : '245, 232, 200'}, ${0.03 + azar() * 0.05})`;
      g.beginPath(); g.ellipse(azar() * W, azar() * H, 10 + azar() * 60, 8 + azar() * 40, azar() * 3, 0, Math.PI * 2); g.fill();
    }
    const TINTA = '#3a2616';
    g.strokeStyle = 'rgba(58, 38, 22, 0.8)'; g.lineWidth = 6; g.strokeRect(10, 10, W - 20, H - 20);
    g.textBaseline = 'middle';
    const columna = (x, y, titulo, filas) => {
      g.textAlign = 'left'; g.fillStyle = TINTA; g.font = '600 36px Georgia, serif'; g.fillText(titulo, x, y);
      y += 50;
      for (const [boton, efecto] of filas) {
        g.font = '600 25px Georgia, serif'; g.fillText(boton, x, y);
        g.font = '25px Georgia, serif'; g.fillText(efecto, x + 318, y);
        y += 41;
      }
      return y;
    };
    columna(50, 110, 'Con las gafas', [
      ['Joystick izquierdo', 'andar'],
      ['Lateral izquierdo', 'correr, mientras lo aprietas'],
      ['Joystick derecho', 'girar 30°'],
      ['Gatillo', 'puertas, carteles, hablar, pescar, asar'],
      ['Lateral en la pantalla', 'coger y colocarla'],
      ['A o Y', 'abrir y cerrar el pergamino'],
      ['Gatillo en una pestaña', 'cambiar de hoja'],
      ['Gatillo dcho. en el mapa', 'ir al sello que apuntas'],
      ['Gatillo dcho. en un botón', 'terminar el día, comer'],
      ['B', 'ver tus cartas; mantenido, traer la pantalla del PC'],
      ['Joystick derecho, mantenido', 'cambiar la resolución (recarga)'],
      ...(partida.depuracion() ? [['X o apretar joystick izq.', 'medidor de rendimiento'], ['Apretar joystick dcho.', 'luz horneada, sí o no']] : []),
    ]);
    columna(50, 590, 'En el ordenador', [
      ['WASD o flechas', 'andar; Mayúsculas, correr'],
      ['Clic', 'capturar el ratón y abrir puertas'],
      ['N', 'mapa, diario, inventario, ayuda, cerrar'],
      ['T / Q, en el diario', 'terminar el día / salir al menú'],
      ['C, en el inventario', 'comer'],
      ...(partida.depuracion() ? [['M / H', 'medidor / luz horneada']] : []),
    ]);
    g.textAlign = 'left'; g.font = 'italic 24px Georgia, serif'; g.fillText('Los pasos entre tierras se cruzan por los caminos, entre la niebla.', 50, H - 40);
  },
  dibujar(g, W, H) {
    const X = x => (x - MAPA.x0) / (MAPA.x1 - MAPA.x0) * W, Z = z => (MAPA.z1 - z) / (MAPA.z1 - MAPA.z0) * H;   // el norte (z negativas) arriba...
    const Y = z => H - Z(z);   // ...así el castillo queda abajo
    let s = 9;
    const azar = () => (s = (s * 16807) % 2147483647) / 2147483647;
    // pergamino, con manchas y el borde oscurecido
    g.fillStyle = '#d7c49a'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 260; i++) {
      g.fillStyle = `rgba(${azar() > 0.5 ? '120, 92, 54' : '245, 232, 200'}, ${0.03 + azar() * 0.05})`;
      g.beginPath(); g.ellipse(azar() * W, azar() * H, 10 + azar() * 60, 8 + azar() * 40, azar() * 3, 0, Math.PI * 2); g.fill();
    }
    const v = g.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.62);
    v.addColorStop(0, 'rgba(70, 45, 20, 0)'); v.addColorStop(1, 'rgba(70, 45, 20, 0.55)');
    g.fillStyle = v; g.fillRect(0, 0, W, H);
    const TINTA = '#3a2616';
    // mar, a la derecha del acantilado
    g.fillStyle = 'rgba(70, 110, 130, 0.5)';
    g.beginPath(); g.moveTo(X(337), Y(-200)); for (let z = -200; z <= -40; z += 8) g.lineTo(X(337 + 5 * Math.sin(z * 0.06) + 2.5 * Math.sin(z * 0.17 + 1)), Y(z)); g.lineTo(X(370), Y(-40)); g.lineTo(X(370), Y(-200)); g.fill();
    g.strokeStyle = TINTA; g.lineWidth = 2.5; g.stroke();
    g.strokeStyle = 'rgba(58, 38, 22, 0.5)'; g.lineWidth = 1.2;
    for (let i = 0; i < 18; i++) { const x = X(345 + azar() * 20), y = Y(-195 + azar() * 150); g.beginPath(); g.moveTo(x - 7, y); g.quadraticCurveTo(x, y - 4, x + 7, y); g.stroke(); }
    // la costa del puerto y de la playa, con sus muelles
    g.fillStyle = 'rgba(70, 110, 130, 0.5)'; g.strokeStyle = TINTA; g.lineWidth = 2.5;
    const costa = MUNDO.puerto.costa;
    g.beginPath(); g.moveTo(X(costa(-440)), Y(-440)); for (let z = -440; z <= -204; z += 6) g.lineTo(X(costa(z)), Y(z)); g.lineTo(X(370), Y(-204)); g.lineTo(X(370), Y(-440)); g.closePath(); g.fill();
    g.beginPath(); for (let z = -440; z <= -204; z += 6) g.lineTo(X(costa(z)), Y(z)); g.stroke();
    g.fillStyle = 'rgba(215, 190, 130, 0.9)';
    g.beginPath(); for (let z = -300; z <= -212; z += 6) g.lineTo(X(costa(z)), Y(z)); for (let z = -212; z >= -300; z -= 6) g.lineTo(X(costa(z)) - 14, Y(z)); g.closePath(); g.fill();
    g.strokeStyle = '#3a2616'; g.lineWidth = 5;
    for (const z of [-332, -350, -368]) { g.beginPath(); g.moveTo(X(306), Y(z)); g.lineTo(X(331), Y(z)); g.stroke(); }
    // lago e isla
    g.fillStyle = 'rgba(70, 110, 130, 0.55)'; g.strokeStyle = TINTA; g.lineWidth = 2.5;
    g.beginPath(); g.ellipse(X(5), Y(-300), X(5 + 70) - X(5), Y(-300 + 65) - Y(-300), 0, 0, Math.PI * 2); g.fill(); g.stroke();
    g.fillStyle = '#c7b98b'; g.beginPath(); g.arc(X(43), Y(-300), X(43 + 17) - X(43), 0, Math.PI * 2); g.fill(); g.stroke();
    // árboles del bosque y de alrededor del lago
    const arbol = (x, z) => { g.strokeStyle = TINTA; g.lineWidth = 1.5; g.fillStyle = 'rgba(70, 90, 45, 0.75)'; g.beginPath(); g.arc(X(x), Y(z), 7, 0, Math.PI * 2); g.fill(); g.stroke(); g.beginPath(); g.moveTo(X(x), Y(z) + 7); g.lineTo(X(x), Y(z) + 12); g.stroke(); };
    for (let i = 0; i < 70; i++) { const x = -72 + azar() * 155, z = -192 + azar() * 140; if (Math.abs(x - 6) > 16 && Math.abs(z + 120) > 9) arbol(x, z); }
    // montes
    const monte = (x, z, r) => { g.strokeStyle = TINTA; g.lineWidth = 2; g.fillStyle = 'rgba(120, 105, 85, 0.6)'; g.beginPath(); g.moveTo(X(x) - r, Y(z) + r * 0.7); g.lineTo(X(x), Y(z) - r * 0.8); g.lineTo(X(x) + r, Y(z) + r * 0.7); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#f0ece0'; g.beginPath(); g.moveTo(X(x) - r * 0.28, Y(z) - r * 0.25); g.lineTo(X(x), Y(z) - r * 0.8); g.lineTo(X(x) + r * 0.28, Y(z) - r * 0.25); g.closePath(); g.fill(); };
    monte(-235, -70, 26); monte(-145, -55, 22); monte(-245, -170, 24); monte(-190, -120, 48); monte(-125, -190, 20);
    // caminos, en trazos
    g.strokeStyle = '#6b4526'; g.lineWidth = 4; g.setLineDash([12, 8]);
    for (const c of CAMINOS_MAPA) { g.beginPath(); c.forEach(([x, z], i) => i ? g.lineTo(X(x), Y(z)) : g.moveTo(X(x), Y(z))); g.stroke(); }
    // ruta de la barca
    g.strokeStyle = '#3a2616'; g.lineWidth = 2; g.setLineDash([3, 8]);
    g.beginPath(); g.moveTo(X(7), Y(-243)); g.lineTo(X(7), Y(-357)); g.moveTo(X(7), Y(-243)); g.lineTo(X(15), Y(-298)); g.lineTo(X(7), Y(-357)); g.stroke();
    g.setLineDash([]);
    // edificios: castillo, casas, faro, abadía
    g.strokeStyle = TINTA; g.lineWidth = 2; g.fillStyle = '#a89274';
    const torre = (x, z, a, b) => { g.fillRect(X(x) - a / 2, Y(z) - b, a, b); g.strokeRect(X(x) - a / 2, Y(z) - b, a, b); for (let i = 0; i < 3; i++) { g.fillRect(X(x) - a / 2 + i * a / 2.5, Y(z) - b - 5, a / 5, 5); g.strokeRect(X(x) - a / 2 + i * a / 2.5, Y(z) - b - 5, a / 5, 5); } };
    torre(-8, 8, 58, 20); torre(4, 14, 30, 42); torre(-30, 12, 18, 30); torre(26, 12, 18, 30);
    for (const [x, z] of [[135, -100], [150, -95], [175, -95], [190, -105], [135, -140], [150, -148], [172, -148], [190, -135]]) {
      g.fillStyle = '#a89274'; g.fillRect(X(x) - 8, Y(z) - 8, 16, 10); g.strokeRect(X(x) - 8, Y(z) - 8, 16, 10);
      g.fillStyle = '#7a5a33'; g.beginPath(); g.moveTo(X(x) - 11, Y(z) - 8); g.lineTo(X(x), Y(z) - 18); g.lineTo(X(x) + 11, Y(z) - 8); g.closePath(); g.fill(); g.stroke();
    }
    for (const [x, z] of [[291, -331], [291, -345], [291, -358], [291, -372], [272, -338], [272, -366]]) {
      g.fillStyle = '#a89274'; g.fillRect(X(x) - 7, Y(z) - 7, 14, 9); g.strokeRect(X(x) - 7, Y(z) - 7, 14, 9);
      g.fillStyle = '#7a5a33'; g.beginPath(); g.moveTo(X(x) - 10, Y(z) - 7); g.lineTo(X(x), Y(z) - 15); g.lineTo(X(x) + 10, Y(z) - 7); g.closePath(); g.fill(); g.stroke();
    }
    g.fillStyle = '#a89274'; torre(322, -120, 12, 42);
    g.fillStyle = '#8f8f92'; torre(-180, -335, 60, 24); torre(-206, -335, 16, 46);
    // nombres
    g.font = '600 26px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const nombre = (texto, x, z, t) => { g.font = `600 ${t || 30}px Georgia, serif`; g.fillStyle = TINTA; g.fillText(texto, X(x), Y(z)); };
    nombre('El Castillo', 5, 25); nombre('El Bosque', 6, -135); nombre('El Lago', 5, -258);
    nombre('El Poblado', 160, -172); nombre('La Montaña', -200, -30); nombre('El Acantilado', 285, -175);
    nombre('La Abadía en Ruinas', -180, -405);
    g.fillStyle = '#1e1813'; g.beginPath(); g.arc(X(24), Y(-150), 6, 0, Math.PI * 2); g.fill(); nombre('Cueva', 44, -146, 18); nombre('Mar', 356, -70, 22); nombre('Mar', 345, -300, 22);
    nombre('El Puerto', 235, -385); nombre('La Playa', 240, -250, 24);
  },
  // Título, rosa de los vientos y marco: van por encima de la niebla
  rotulos(g, W, H) {
    const TINTA = '#3a2616';
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = '600 44px Georgia, serif'; g.fillStyle = TINTA; g.fillText('Tierras del Reino', W * 0.8, 44);
    // rosa de los vientos, arriba a la izquierda (el norte del juego, hacia el lago)
    const rx = W * 0.72, ry = H * 0.8, R = 46;
    g.strokeStyle = TINTA; g.fillStyle = TINTA; g.lineWidth = 2;
    g.beginPath(); g.arc(rx, ry, R * 0.55, 0, Math.PI * 2); g.stroke();
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; g.beginPath(); g.moveTo(rx + Math.sin(a) * R, ry - Math.cos(a) * R); g.lineTo(rx + Math.cos(a) * 7, ry + Math.sin(a) * 7); g.lineTo(rx - Math.cos(a) * 7, ry - Math.sin(a) * 7); g.closePath(); g.fill(); }
    g.font = '600 22px Georgia, serif'; g.fillText('N', rx, ry - R - 14);
    g.strokeStyle = 'rgba(58, 38, 22, 0.8)'; g.lineWidth = 6; g.strokeRect(10, 10, W - 20, H - 20);
    g.lineWidth = 1.5; g.strokeRect(22, 22, W - 44, H - 44);
  },
  // La hoja del mapa: el dibujo, con niebla sobre las zonas que aún no has visitado
  pintarMapa() {
    const c = this.lienzoMapa, g = c.getContext('2d'), W = c.width, H = c.height;
    g.drawImage(this.mapaBase, 0, 0);
    const X = x => (x - MAPA.x0) / (MAPA.x1 - MAPA.x0) * W, Y = z => (z - MAPA.z0) / (MAPA.z1 - MAPA.z0) * H;
    g.save();
    g.beginPath(); g.rect(10, 10, W - 20, H - 20); g.clip();
    for (const nombre of Object.keys(MUNDO)) {
      const s = MUNDO[nombre].sitio;
      if (partida.depuracion() || this.visitadas.has(nombre) || s.x0 > MAPA.x1) continue;   // (cueva y mazmorras están fuera del mapa)
      const x0 = X(s.x0), x1 = X(Math.min(s.x1, MAPA.x1 + 20)), y0 = Y(Math.max(s.z0, MAPA.z0 - 20)), y1 = Y(Math.min(s.z1, MAPA.z1 + 20));
      // la base, y encima bocanadas claras y oscuras, siempre las mismas para cada zona
      g.fillStyle = NIEBLA_MAPA; g.fillRect(x0, y0, x1 - x0, y1 - y0);
      let semilla = 7 + nombre.length * 131 + Math.round(x0);
      const azar = () => (semilla = (semilla * 16807) % 2147483647) / 2147483647;
      const bocanada = (x, y, r, rgb, fuerza) => {
        const d = g.createRadialGradient(x, y, 0, x, y, r);
        d.addColorStop(0, `rgba(${rgb}, ${fuerza})`); d.addColorStop(1, `rgba(${rgb}, 0)`);
        g.fillStyle = d; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
      };
      for (let k = (x1 - x0) * (y1 - y0) / 1500; k > 0; k--) bocanada(x0 + azar() * (x1 - x0), y0 + azar() * (y1 - y0), 26 + azar() * 46, azar() < 0.5 ? '226, 222, 210' : '150, 145, 134', 0.2);
      // el borde, deshilachado: bocanadas del mismo color que se salen de la zona
      for (const [ax, ay, bx, by] of [[x0, y0, x1, y0], [x0, y1, x1, y1], [x0, y0, x0, y1], [x1, y0, x1, y1]])
        for (let k = Math.hypot(bx - ax, by - ay) / 14; k > 0; k--) { const u = azar(); bocanada(ax + (bx - ax) * u, ay + (by - ay) * u, 22 + azar() * 22, '185, 178, 163', 1); }
    }
    g.restore();
    this.rotulos(g, W, H);
    this.pestanas(g, W, 0);
    this.hojas[HOJA_MAPA].needsUpdate = true;
  },
  viajar() {
    if (this.panel.visible && this.botonApuntado && !cambiandoDeZona && !enBarco && !enLaMesa) return this.botonApuntado.hacer();
    if (!this.panel.visible || this.hoja !== HOJA_MAPA || !this.apuntado || cambiandoDeZona || enBarco || enLaMesa) return;
    const d = this.apuntado.destino;
    // (con misión, se pagan todas las zonas del camino)
    // (si cuesta puntos, primero la pregunta: el pergamino se cierra para verla)
    if (!this.el.components.zonas.cruzar(d.zona, { x: d.a, y: d.y, z: d.b, giro: d.giro * Math.PI / 180 }, partida.precioViaje(d.zona), { viaje: true })) return;
    this.cerrar();
  },
  // En el ordenador, con el pergamino abierto el ratón se suelta y solo apunta a él: no gira la cámara ni toca
  // nada de la escena (la cámara pierde su rayo). Al cerrarlo, vuelve a capturarse.
  modoRaton(si) { ratonLibre('mapa', si); },
  cerrar() { this.panel.visible = false; this.hoja = -1; this.modoRaton(false); },
  // dónde toca el pergamino el rayo del mando derecho (fuera de VR, el ratón), en sus coordenadas
  puntoEnPanel() {
    if (this.el.is('vr-mode')) {
      const fuente = document.querySelector('[laser-controls="hand: right"]');
      const rc = fuente && fuente.components.raycaster;
      if (!rc) return null;
      this.rayo.ray.copy(rc.raycaster.ray);
    } else {
      if (!this.el.camera) return null;
      this.rayo.setFromCamera(this.ndc, this.el.camera);
    }
    this.panel.updateWorldMatrix(true, false);
    const h = this.rayo.intersectObject(this.panel, false)[0];
    return h ? this.panel.worldToLocal(h.point.clone()) : null;
  },
  // qué sello tiene delante el rayo
  mirarSellos() {
    const p = this.puntoEnPanel();
    let mejor = null;
    if (p) {
      let d = 0.02;
      for (const s of this.sellos) {
        if (!s.visible) continue;
        const dd = Math.hypot(s.position.x - p.x, s.position.y - p.y);
        if (dd < d) { d = dd; mejor = s; }
      }
    }
    if (mejor === this.apuntado) return;
    if (this.apuntado) { this.apuntado.material.color.set('#7a1f18'); this.apuntado.scale.setScalar(1); }
    this.apuntado = mejor;
    if (mejor) { mejor.material.color.set('#ffcc33'); mejor.scale.setScalar(1.7); }
  },
  // la flecha en su sitio, según dónde estás y hacia dónde miras
  // El pergamino no mira la profundidad y se dibuja encima de todo: mientras está abierto, el rayo de los mandos
  // se dibuja después de él, o no se vería al apuntarle. Igual con una página de cómic abierta (js/comic.js).
  rayoEncima(encima) {
    for (const m of document.querySelectorAll('[laser-controls]')) {
      const linea = m.getObject3D('line');
      if (!linea || linea.renderOrder === (encima ? 999 : 0)) continue;
      linea.renderOrder = encima ? 999 : 0;
      linea.material.transparent = encima;
      linea.material.depthTest = !encima;
      linea.material.needsUpdate = true;
    }
  },
  tick() {
    this.rayoEncima(this.panel.visible || !!comicAbierto);
    const aqui = zonaCargada.nombre;
    if (partida.ranura && !cambiandoDeZona && this.el.components.zonas.actual === aqui && !this.visitadas.has(aqui)) {
      this.visitadas.add(aqui);
      partida.estado.visitadas = [...this.visitadas];
      partida.guardar();
      this.pintarMapa();
    }
    if (!this.panel.visible || !this.el.camera) return;
    const punto = this.el.is('vr-mode') ? this.puntoEnPanel() : null;
    this.puntero.visible = !!punto;
    if (punto) this.puntero.position.set(punto.x, punto.y, 0.002);
    const pescado = partida.estado.pescado;
    this.modeloInventario.visible = this.hoja === HOJA_INVENTARIO && !!pescado;
    if (this.modeloInventario.visible) {
      this.modeloInventario.rotation.y = performance.now() / 1200;
      this.modeloInventario.material.color.set(pescado === 'asado' ? '#a8703a' : '#ffffff');   // asado, tostado
    }
    const W = this.lienzoInventario.width, H = this.lienzoInventario.height;
    for (const [tipo, m] of Object.entries(this.modelosCartas)) {
      const h = this.huecosCartas[tipo];
      m.visible = this.hoja === HOJA_INVENTARIO && !!h;
      if (!m.visible) continue;
      m.position.set((h.x / W - 0.5) * this.ancho, (0.5 - h.y / H) * this.alto, 0.03);
      m.rotation.set(0.35, performance.now() / 1200, 0);
      if (tipo === 'carne') m.userData.carne.material.color.set(partida.estado.cartas.carne === 'asada' ? '#6a3a1c' : '#9a4a3a');
    }
    if (this.hoja === HOJA_MAPA) {
      for (const s of this.sellos) s.visible = partida.depuracion() || this.visitadas.has(s.destino.zona);
      this.colocarMarcaMapa();
      this.marcaMapa.scale.setScalar(1 + 0.2 * Math.sin(performance.now() / 300));
      this.mirarSellos();
    }
    this.mirarBotones();
    if (!this.el.is('vr-mode')) {
      // en el monitor, el pergamino ocupa casi toda la vista; y la flecha del ratón pasa a mano sobre lo que se toca
      const c = this.el.camera, alto = 2 * 0.5 * Math.tan(c.fov * Math.PI / 360), ancho = alto * c.aspect;
      this.panel.scale.setScalar(Math.min(0.9 * alto / this.alto, 0.92 * ancho / this.ancho));
      if (this.el.canvas) this.el.canvas.style.cursor = this.apuntado || this.botonApuntado ? 'pointer' : '';
    } else this.panel.scale.setScalar(1);
    this.el.camera.getWorldPosition(this.yo);
    this.el.camera.getWorldDirection(this.mira);
    const u = (this.yo.x - MAPA.x0) / (MAPA.x1 - MAPA.x0) - 0.5, v = (this.yo.z - MAPA.z0) / (MAPA.z1 - MAPA.z0) - 0.5;
    // en el mapa, el norte (z negativas) va hacia arriba
    // (bajo tierra, fuera del mapa, no sale)
    this.flecha.visible = this.hoja === HOJA_MAPA && Math.abs(u) < 0.5 && Math.abs(v) < 0.5;
    this.flecha.position.set(u * this.ancho, -v * this.alto, 0.001);
    this.flecha.rotation.z = Math.atan2(-this.mira.x, -this.mira.z);
  }
});
