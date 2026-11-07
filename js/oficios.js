// Editor VR: los oficios y sus cartas. Cazar el ciervo del bosque (js/animales.js), talar en el bosque (tala), picar
// piedra en la cueva (cantera) y pescar (js/animales.js) dan una carta; el mercader del poblado (mercader) te las
// compra. Cada oficio pregunta antes (js/pregunta.js) y cuesta puntos (PUNTOS_CAZAR…, en js/partida.js).
// Solo se lleva una carta de cada tipo (partida.cartas).

// Las cartas: su título, cómo se nombran ("una": vendes la madera) y, las que se comen, "comer"
const CARTAS = {
  pescado: { titulo: 'Pescado', una: 'el pescado', comer: true },
  carne: { titulo: 'Carne', una: 'la carne', comer: true },
  madera: { titulo: 'Madera', una: 'la madera' },
  piedra: { titulo: 'Pieza', una: 'la pieza de piedra' },
};
const OFICIO_TINTA = '#3a2616';

// Una carta de oficio, como un naipe de pergamino (el pescado tiene la suya, dibujarCartaPescado): el dibujo, cómo
// está y lo que vale. En el inventario va sin dibujo ("conDibujo" a false): delante, el modelo 3D (modelosDeCartas).
function dibujarCarta(g, W, H, tipo, como, conDibujo = true) {
  g.fillStyle = '#d7c49a'; g.fillRect(0, 0, W, H);
  g.strokeStyle = OFICIO_TINTA; g.lineWidth = 10; g.strokeRect(8, 8, W - 16, H - 16);
  g.lineWidth = 2; g.strokeRect(22, 22, W - 44, H - 44);
  g.fillStyle = OFICIO_TINTA; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '600 46px Georgia, serif'; g.fillText(CARTAS[tipo].titulo, W / 2, 70);
  const cx = W / 2, cy = H * 0.42;
  g.lineWidth = 4; g.lineJoin = 'round';
  if (!conDibujo) { /* el hueco, para el modelo */ }
  else if (tipo === 'carne') {
    // una pierna: la carne y el hueso
    const asada = como === 'asada';
    g.fillStyle = '#e8dcc4';
    g.beginPath(); g.ellipse(cx + 92, cy - 50, 16, 12, -0.6, 0, Math.PI * 2); g.fill(); g.stroke();
    g.beginPath(); g.ellipse(cx + 104, cy - 34, 16, 12, -0.6, 0, Math.PI * 2); g.fill(); g.stroke();
    g.fillRect(cx + 40, cy - 40, 50, 18);
    g.fillStyle = asada ? '#6a3a1c' : '#9a4a3a';
    g.beginPath(); g.ellipse(cx - 10, cy + 10, 82, 58, -0.6, 0, Math.PI * 2); g.fill(); g.stroke();
    if (asada) { g.strokeStyle = '#2b1a0c'; g.lineWidth = 6; for (const x of [-40, -8, 24]) { g.beginPath(); g.moveTo(cx + x - 12, cy - 22); g.lineTo(cx + x + 12, cy + 40); g.stroke(); } }
  } else if (tipo === 'madera') {
    // tres troncos apilados, de lado, con sus anillos
    for (const [dx, dy] of [[-48, 30], [48, 30], [0, -30]]) {
      const x = cx + dx, y = cy + dy;
      g.fillStyle = '#6e4a2c'; g.fillRect(x - 70, y - 30, 120, 60); g.strokeRect(x - 70, y - 30, 120, 60);
      g.fillStyle = '#c9a66b'; g.beginPath(); g.ellipse(x + 50, y, 18, 30, 0, 0, Math.PI * 2); g.fill(); g.stroke();
      g.lineWidth = 2; g.beginPath(); g.ellipse(x + 50, y, 9, 15, 0, 0, Math.PI * 2); g.stroke(); g.lineWidth = 4;
    }
  } else if (tipo === 'piedra') {
    // un sillar labrado: la cara, la de arriba y la del lado
    const a = 150, b = 90, p = 40;
    g.fillStyle = '#a8a196'; g.fillRect(cx - a / 2, cy - b / 2 + p / 2, a, b); g.strokeRect(cx - a / 2, cy - b / 2 + p / 2, a, b);
    g.fillStyle = '#c4beb2';
    g.beginPath(); g.moveTo(cx - a / 2, cy - b / 2 + p / 2); g.lineTo(cx - a / 2 + p, cy - b / 2 - p / 2); g.lineTo(cx + a / 2 + p, cy - b / 2 - p / 2); g.lineTo(cx + a / 2, cy - b / 2 + p / 2); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = '#8a8378';
    g.beginPath(); g.moveTo(cx + a / 2, cy - b / 2 + p / 2); g.lineTo(cx + a / 2 + p, cy - b / 2 - p / 2); g.lineTo(cx + a / 2 + p, cy + b / 2 - p / 2); g.lineTo(cx + a / 2, cy + b / 2 + p / 2); g.closePath(); g.fill(); g.stroke();
    // las marcas del pico
    g.lineWidth = 2; for (let i = 0; i < 6; i++) { const x = cx - a / 2 + 20 + i * 22; g.beginPath(); g.moveTo(x, cy + 10); g.lineTo(x + 8, cy + 26); g.stroke(); }
  }
  g.fillStyle = OFICIO_TINTA; g.textAlign = 'center';
  g.font = 'italic 38px Georgia, serif'; g.fillText(como[0].toUpperCase() + como.slice(1), W / 2, H * 0.7);
  g.font = '28px Georgia, serif';
  const puntos = PUNTOS_COMIDA[como];
  g.fillText(CARTAS[tipo].comer && puntos ? `Comerla: ${puntos} ${puntos === 1 ? 'punto' : 'puntos'}` : `Vale ${PRECIO_CARTA} monedas`, W / 2, H * 0.84);
}

// Los modelos 3D de las cartas, para el inventario (js/mapa.js), que los gira delante de su carta como el pez: la
// pierna de carne, tres troncos y un sillar. Miden alrededor de 1: el inventario los encoge.
function modelosDeCartas() {
  const mat = color => new THREE.MeshStandardMaterial({ color, roughness: 0.9, flatShading: true, fog: false, transparent: true });
  const pieza = (padre, geo, material, x, y, z, rz = 0) => { const m = new THREE.Mesh(geo, material); m.position.set(x, y, z); m.rotation.z = rz; m.renderOrder = 998; padre.add(m); return m; };
  const carne = new THREE.Group(), hueso = mat('#e8dcc4');
  carne.userData.carne = pieza(carne, new THREE.SphereGeometry(0.5, 12, 8), mat('#9a4a3a'), -0.15, 0, 0);
  carne.userData.carne.scale.set(1, 0.72, 0.72);
  pieza(carne, new THREE.CylinderGeometry(0.08, 0.08, 0.5, 8), hueso, 0.45, 0, 0, Math.PI / 2);
  for (const z of [-0.08, 0.08]) pieza(carne, new THREE.SphereGeometry(0.11, 8, 6), hueso, 0.72, 0, z);
  const madera = new THREE.Group(), corteza = mat('#6e4a2c'), corte = mat('#c9a66b');
  for (const [y, z] of [[-0.17, -0.2], [-0.17, 0.2], [0.17, 0]]) pieza(madera, new THREE.CylinderGeometry(0.2, 0.2, 1, 10), [corteza, corte, corte], 0, y, z, Math.PI / 2);
  const piedra = new THREE.Group();
  pieza(piedra, new THREE.BoxGeometry(0.9, 0.5, 0.6), mat('#a8a196'), 0, 0, 0);
  return { carne, madera, piedra };
}

// Un oficio que se hace apuntando a algo y apretando el gatillo: pregunta y, si se dice que sí, da la carta.
// "id": el sitio de farmeo, que en la misión de la casa da una sola carga (partida.agotado)
function hacerOficio({ que, tipo, como, precio, texto, id }) {
  if (!partida.ranura || preguntaAbierta) return;
  if (partida.agotado(id)) { partida.avisar(que === 'tala' ? 'Aquí ya no queda madera buena: busca otro sitio.' : 'Esta veta está agotada: busca otro sitio.'); return; }
  if (!partida.puedeOficio(tipo, precio)) return;
  preguntarGasto({ que, precio, alResponder: si => {
    if (!si || !partida.puedeOficio(tipo, precio) || partida.agotado(id)) return;
    partida.farmear(id, tipo);
    partida.conseguir(tipo, como, precio, texto);
  } });
}

// La carga de un sitio de farmeo (troncos, vetas) se ve mientras le quede: en la misión de la casa, una vez farmeado,
// se queda sin ella
function cargaDeFarmeo(comp, piezas) {
  const poner = () => { const agotado = partida.agotado(comp.data.id); for (const p of piezas) p.visible = !agotado; };
  poner();
  comp.alCambiar = poner;
  document.addEventListener('partida-cambia', poner);
}

// Piezas sueltas de THREE para los decorados de los oficios: cajas y cilindros, con su material
function piezaOficio(padre, geometria, color, x, y, z, rx = 0, ry = 0, rz = 0) {
  const m = new THREE.Mesh(geometria, new THREE.MeshStandardMaterial({ color, roughness: 0.95 }));
  m.position.set(x, y, z); m.rotation.set(rx, ry, rz);
  padre.add(m);
  return m;
}

// Tala: un tocón con el hacha clavada y una pila de troncos. Origen: en el suelo, en el tocón.
AFRAME.registerComponent('tala', {
  schema: { id: { default: '' } },   // el sitio de farmeo (partida.farmear); sin id, se tala siempre
  init() {
    const g = new THREE.Group(), cil = (r, h) => new THREE.CylinderGeometry(r, r, h, 12);
    piezaOficio(g, cil(0.42, 0.5), '#5e4630', 0, 0.25, 0);
    piezaOficio(g, new THREE.CylinderGeometry(0.4, 0.4, 0.02, 12), '#c9a66b', 0, 0.505, 0);   // el corte, claro
    // el hacha: mango inclinado y la hoja clavada en el tocón
    piezaOficio(g, new THREE.BoxGeometry(0.05, 0.8, 0.05), '#6e5236', 0.12, 0.82, 0, 0, 0, -0.5);
    piezaOficio(g, new THREE.BoxGeometry(0.2, 0.14, 0.03), '#4a4640', -0.06, 0.5, 0, 0, 0, -0.5);
    // los troncos, tumbados a lo largo de z, uno encima de los otros dos
    const troncos = [[1.0, 0.18], [1.38, 0.18], [1.19, 0.5]].map(([x, y]) => piezaOficio(g, cil(0.18, 1.8), '#6e4a2c', x, y, 0.2, Math.PI / 2));
    this.el.setObject3D('mesh', g);
    cargaDeFarmeo(this, troncos);
    cajaDeRayo(this.el, 0.6, 0.6, 0.1, 2.2, 1.2, 2, () => hacerOficio({ que: 'tala', tipo: 'madera', como: 'troncos', precio: PUNTOS_TALAR, id: this.data.id, texto: 'Talas un árbol y te llevas una carga de madera.' }));
    this.el.querySelector('.clicable').addEventListener('mouseenter', () => partida.avisar('Aprieta el gatillo para talar.'));
  },
  remove() { document.removeEventListener('partida-cambia', this.alCambiar); this.el.getObject3D('mesh').traverse(o => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } }); this.el.removeObject3D('mesh'); }
});

// Cantera: una pared de roca con vetas, piedras sueltas y un pico apoyado. Mira hacia +z local; origen en el suelo.
AFRAME.registerComponent('cantera', {
  schema: { id: { default: '' } },   // como en la tala
  init() {
    const g = new THREE.Group();
    const roca = new THREE.MeshStandardMaterial({ color: '#7c776c', roughness: 1, flatShading: true });
    for (const [x, y, z, r] of [[0, 1.2, -0.4, 1.4], [-1.3, 0.8, -0.2, 1], [1.3, 0.9, -0.3, 1.1]]) {
      const m = new THREE.Mesh(new THREE.DodecahedronGeometry(r), roca); m.position.set(x, y, z); m.scale.set(1, 1, 0.6); g.add(m);
    }
    // vetas claras donde se pica, y piedras sueltas por el suelo
    const carga = [];
    for (const [x, y] of [[-0.3, 1.1], [0.35, 0.8], [0.1, 1.5]]) carga.push(piezaOficio(g, new THREE.BoxGeometry(0.5, 0.08, 0.05), '#b9b2a2', x, y, 0.42, 0, 0, 0.3));
    for (const [x, z, r] of [[-0.6, 0.6, 0.15], [0.4, 0.75, 0.12], [0.9, 0.5, 0.18]]) carga.push(piezaOficio(g, new THREE.DodecahedronGeometry(r), '#8a857a', x, r * 0.6, z));
    // el pico, apoyado en la roca: mango y cabeza de hierro
    piezaOficio(g, new THREE.BoxGeometry(0.05, 0.9, 0.05), '#6e5236', -1.0, 0.45, 0.55, 0.25, 0, 0.2);
    piezaOficio(g, new THREE.BoxGeometry(0.5, 0.06, 0.06), '#4a4640', -1.1, 0.88, 0.45, 0.25, 0, 0.2);
    this.el.setObject3D('mesh', g);
    cargaDeFarmeo(this, carga);
    cajaDeRayo(this.el, 0, 1, 0.3, 3, 2, 1, () => hacerOficio({ que: 'picar', tipo: 'piedra', como: 'sillar', precio: PUNTOS_PICAR, id: this.data.id, texto: 'Picas la roca y sacas una buena pieza de piedra.' }));
    this.el.querySelector('.clicable').addEventListener('mouseenter', () => partida.avisar('Aprieta el gatillo para picar piedra.'));
  },
  remove() { document.removeEventListener('partida-cambia', this.alCambiar); this.el.getObject3D('mesh').traverse(o => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } }); this.el.removeObject3D('mesh'); }
});

// Mercader: el tendero (persona-animada, modelos/tendero.glb), quieto detrás de su puesto; al hablarle te tiende la
// mano y te compra las cartas que lleves. (También vale junto a "criado".)
AFRAME.registerComponent('mercader', {
  init() {
    this.quitar = null; this.ojo = new THREE.Vector3();
    cajaDeRayo(this.el, 0, 0.95, 0, 0.9, 1.9, 0.9, () => { if (this.quitar) this.cerrar(); else this.hablar(); });
  },
  hablar() {
    // (en la misión de la casa, la madera y la piedra son para la obra: no se venden)
    const cartas = partida.cartasQueLlevas().filter(([tipo]) => !partida.cargaDeLaCasa(tipo));
    const paraLaCasa = partida.cartasQueLlevas().length > cartas.length ? ' La madera y la piedra que llevas, guárdalas para tu casa.' : '';
    if (this.el.components.criado) this.el.components.criado.charlando = true;
    partida.charlaAbierta = true;   // (el tutorial espera: partida.comprobarPaso)
    const persona = this.el.components['persona-animada'];
    if (persona) persona.poner('ofrecer', true);
    const charla = cartas.length ? {
      texto: `Compro lo que traigas: pescado, carne, madera y piedra, a ${PRECIO_CARTA} monedas de plata cada carta.${paraLaCasa}`,
      opciones: [...cartas.map(([tipo]) => ({ texto: `Vender ${CARTAS[tipo].una}`, hacer: () => partida.vender(tipo) })), { texto: 'Nada más' }],
    } : {
      texto: `¿No traes nada? Te compro pescado, carne, madera y piedra, a ${PRECIO_CARTA} monedas cada carta.${paraLaCasa}`,
      opciones: [{ texto: 'Volveré' }],
    };
    this.quitar = tablaDeOpciones(this.el.sceneEl, sitioDeLectura(this.el.sceneEl), charla, op => {
      this.cerrar();
      // después de vender, sigue la charla con lo que quede
      if (op.hacer) { op.hacer(); if (partida.cartasQueLlevas().some(([tipo]) => !partida.cargaDeLaCasa(tipo))) this.hablar(); }
    });
  },
  cerrar() {
    if (!this.quitar) return;
    this.quitar();
    this.quitar = null;
    if (this.el.components.criado) this.el.components.criado.charlando = false;
    partida.charlaAbierta = false;
    setTimeout(() => partida.comprobarPaso());
  },
  tick() { if (this.quitar && seHaAlejado(this.el, this.ojo)) this.cerrar(); },
  remove() { if (this.quitar) { this.quitar(); partida.charlaAbierta = false; } this.quitar = null; }
});
