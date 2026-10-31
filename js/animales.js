// Editor VR: pasadizos, animales y lo demás que da vida a las zonas. Portal (un cartel que te lleva a
// otra zona, como la puerta de las mazmorras o la boca de la cueva), techo de cueva, ciervo, peces,
// cartel de madera y pinos.

// Tabla de madera con un texto escrito en un canvas (con tildes). Devuelve la textura.
function tablaDeTexto(texto, ancho = 640, alto = 128) {
  const c = document.createElement('canvas');
  c.width = ancho; c.height = alto;
  const g = c.getContext('2d');
  g.fillStyle = '#3a2a1b'; g.fillRect(0, 0, ancho, alto);
  g.strokeStyle = '#17100a'; g.lineWidth = 8; g.strokeRect(4, 4, ancho - 8, alto - 8);
  g.font = '600 54px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  const cabe = g.measureText(texto).width;
  if (cabe > ancho - 40) g.font = `600 ${Math.floor(54 * (ancho - 40) / cabe)}px Georgia, serif`;
  g.fillStyle = '#e4d3a8'; g.fillText(texto, ancho / 2, alto / 2 + 3);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// Cartel que solo se lee: una tabla sobre un poste, en el suelo
AFRAME.registerComponent('cartel-madera', {
  schema: { texto: { default: '' } },
  init() {
    const g = new THREE.Group();
    const tabla = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.32), new THREE.MeshBasicMaterial({ map: tablaDeTexto(this.data.texto), side: THREE.DoubleSide }));
    tabla.position.y = 1.5;
    const poste = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.5, 0.1), new THREE.MeshStandardMaterial({ color: '#3a2a1b', roughness: 1 }));
    poste.position.set(0, 0.7, -0.03);
    g.add(tabla, poste);
    this.el.setObject3D('mesh', g);
  },
  remove() { this.el.removeObject3D('mesh'); }
});

// Portal: un cartel; apuntándole y apretando el gatillo, la niebla se cierra y apareces en otra zona.
AFRAME.registerComponent('portal', {
  schema: { texto: { default: '' }, zona: { default: '' }, x: { default: 0 }, z: { default: 0 }, giro: { default: 0 } },
  init() {
    const e = this.el, d = this.data;
    e.classList.add('clicable', 'cartel');
    const tex = tablaDeTexto(d.texto);
    e.setAttribute('geometry', 'primitive: plane; width: 1.4; height: 0.28');
    e.setAttribute('material', 'shader: flat; side: double');
    const poner = () => { const m = e.getObject3D('mesh'); if (m) { m.material.map = tex; m.material.needsUpdate = true; } };
    e.addEventListener('object3dset', poner);
    poner();
    e.addEventListener('mouseenter', () => { const m = e.getObject3D('mesh'); if (m) m.material.color.set('#ffd9a0'); });
    e.addEventListener('mouseleave', () => { const m = e.getObject3D('mesh'); if (m) m.material.color.set('#ffffff'); });
    e.addEventListener('click', () => { if (!cambiandoDeZona) e.sceneEl.components.zonas.ir(d.zona, { x: d.x, z: d.z, giro: d.giro * Math.PI / 180 }); });
  }
});

// Puerta que lleva a otra zona: la misma hoja que las demás (modelos/puerta.glb), con el mismo brillo de
// la aldaba al apuntarla. Al apretar el gatillo se abre y la niebla te lleva. Origen en la bisagra.
AFRAME.registerComponent('puerta-portal', {
  schema: { zona: { default: '' }, x: { default: 0 }, y: { default: -999 }, z: { default: 0 }, giro: { default: 0 } },   // y: si no es la del terreno
  init() {
    const d = this.data;
    this.hoja = document.createElement('a-entity');
    this.hoja.setAttribute('gltf-model', 'url(modelos/puerta.glb)');
    this.el.appendChild(this.hoja);
    this.hoja.addEventListener('model-loaded', e => {
      const a = e.detail.model.getObjectByName('Aldaba');
      if (a) { a.material = a.material.clone(); this.aldaba = a; }
    });
    const rayo = document.createElement('a-box');
    rayo.classList.add('clicable');
    rayo.setAttribute('position', '0.45 1.025 0'); rayo.setAttribute('width', 0.9); rayo.setAttribute('height', 2.05); rayo.setAttribute('depth', 0.1);
    rayo.setAttribute('material', 'visible: false');
    this.el.appendChild(rayo);
    this.apuntada = false;
    rayo.addEventListener('mousedown', () => {
      if (cambiandoDeZona) return;
      this.hoja.setAttribute('animation', { property: 'rotation', to: '0 -80 0', dur: 500, easing: 'easeInQuad' });
      this.el.sceneEl.components.zonas.ir(d.zona, { x: d.x, y: d.y > -999 ? d.y : undefined, z: d.z, giro: d.giro * Math.PI / 180 });
    });
  },
  tick() {
    let apuntada = false;
    for (const el of this.el.sceneEl.querySelectorAll('[raycaster]')) {
      const r = el.components.raycaster;
      if (r && r.data.enabled && r.intersectedEls.some(e => this.el.contains(e))) apuntada = true;
    }
    if (apuntada === this.apuntada) return;
    this.apuntada = apuntada;
    if (!this.aldaba) return;
    this.aldaba.material.emissive.set(apuntada ? '#ffcc33' : '#000');
    const s = apuntada ? 1.5 : 1;
    this.aldaba.scale.set(s, s, 1);
  }
});

// Salida andando: al entrar la cabeza en el rectángulo (lo alto de una escalera), te lleva a otra zona.
AFRAME.registerComponent('salida', {
  schema: { x0: { default: 0 }, x1: { default: 0 }, z0: { default: 0 }, z1: { default: 0 }, zona: { default: '' }, x: { default: 0 }, z: { default: 0 }, giro: { default: 0 } },
  // (no vale hasta que se ha salido de él: se llega a la zona bajando esa misma escalera, y se empieza dentro)
  init() { this.ojo = new THREE.Vector3(); this.armada = false; },
  tick() {
    const d = this.data, c = this.el.sceneEl.camera;
    if (!c || cambiandoDeZona) return;
    c.getWorldPosition(this.ojo);
    const dentro = this.ojo.x > d.x0 && this.ojo.x < d.x1 && this.ojo.z > d.z0 && this.ojo.z < d.z1;
    if (!dentro) { this.armada = true; return; }
    if (this.armada)
      this.el.sceneEl.components.zonas.ir(d.zona, { x: d.x, z: d.z, giro: d.giro * Math.PI / 180 });
  }
});

// Pozo: la manivela, la cuerda y el cubo de duelas. Al apuntarle y apretar el gatillo, el cubo baja
// girando la manivela, se llena abajo (se oye el chapoteo) y sube con agua; otra vez, se vacía.
const POZO_ARRIBA = 1.3, POZO_ABAJO = -0.5, POZO_TORNO = 2.1;
const POZO_NUDO = 0.36;   // a qué altura del cubo está el nudo de la cuerda: justo encima del asa
const POZO_BAJA_MS = 2600, POZO_SUBE_MS = 3800, POZO_LLENA_MS = 900;
AFRAME.registerComponent('pozo', {
  init() {
    const pieza = (padre, tipo, attrs) => {
      const e = document.createElement(tipo);
      for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
      padre.appendChild(e);
      return e;
    };
    const HIERRO = 'color: #262626; metalness: 0.6; roughness: 0.45';
    // manivela: gira alrededor del eje del torno
    this.manivela = pieza(this.el, 'a-entity', { position: '0.7 2.15 0' });
    pieza(this.manivela, 'a-box', { position: '0 -0.1 0', width: 0.03, height: 0.24, depth: 0.04, material: HIERRO });
    pieza(this.manivela, 'a-cylinder', { position: '0.06 -0.2 0', rotation: '0 0 90', radius: 0.018, height: 0.12, color: '#3a281a' });
    this.cuerda = pieza(this.el, 'a-cylinder', { radius: 0.008, height: 1, color: '#8a7a5a' });
    this.cubo = pieza(this.el, 'a-entity', { position: `0 ${POZO_ARRIBA} 0` });
    pieza(this.cubo, 'a-cone', { position: '0 0.11 0', 'radius-bottom': 0.095, 'radius-top': 0.12, height: 0.22, 'open-ended': true, 'segments-radial': 14, color: '#5c4029', side: 'double' });
    pieza(this.cubo, 'a-circle', { position: '0 0.002 0', rotation: '-90 0 0', radius: 0.095, segments: 14, color: '#4a3220' });
    pieza(this.cubo, 'a-torus', { position: '0 0.04 0', rotation: '90 0 0', radius: 0.1, 'radius-tubular': 0.008, 'segments-tubular': 20, material: HIERRO });
    pieza(this.cubo, 'a-torus', { position: '0 0.19 0', rotation: '90 0 0', radius: 0.116, 'radius-tubular': 0.008, 'segments-tubular': 20, material: HIERRO });
    pieza(this.cubo, 'a-torus', { position: '0 0.22 0', radius: 0.12, 'radius-tubular': 0.006, arc: 180, 'segments-tubular': 16, material: HIERRO });
    // el nudo que ata la cuerda al asa: una vuelta y una bolita
    pieza(this.cubo, 'a-sphere', { position: `0 ${POZO_NUDO - 0.005} 0`, radius: 0.024, 'segments-width': 8, 'segments-height': 6, scale: '1 0.8 1', color: '#8a7a5a' });
    pieza(this.cubo, 'a-torus', { position: '0 0.335 0', rotation: '0 90 0', radius: 0.018, 'radius-tubular': 0.007, 'segments-radial': 6, 'segments-tubular': 10, color: '#8a7a5a' });
    this.agua = pieza(this.cubo, 'a-circle', { position: '0 0.18 0', rotation: '-90 0 0', radius: 0.112, segments: 14, material: 'shader: flat; color: #4f7f92' });
    this.agua.setAttribute('visible', false);
    // lo que recibe el rayo: invisible, abarca el torno y el cubo
    const rayo = pieza(this.el, 'a-box', { class: 'clicable', position: '0.1 1.6 0', width: 1.6, height: 1.5, depth: 0.9, material: 'visible: false' });
    // al apretar, no con "click", y con margen contra dobles: como las puertas
    this.ultimo = 0;
    rayo.addEventListener('mousedown', () => {
      if (performance.now() - this.ultimo < 500) return;
      this.ultimo = performance.now();
      this.accion();
    });
    this.apuntado = false;
    this.fase = null;   // baja, llena, sube, o nada
    this.lleno = false;
    this.ms = 0;
    this.y = POZO_ARRIBA;
    this.colocar();
  },
  accion() {
    if (this.fase) return;
    if (this.lleno) {   // vaciarlo
      this.lleno = false;
      this.agua.setAttribute('visible', false);
      return;
    }
    this.fase = 'baja'; this.ms = 0;
  },
  // un chapoteo: ruido corto, filtrado, generado aquí mismo
  chapoteo() {
    try {
      const A = this.audio = this.audio || new (window.AudioContext || window.webkitAudioContext)();
      const n = A.sampleRate * 0.35, b = A.createBuffer(1, n, A.sampleRate), d = b.getChannelData(0);
      for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3);
      const s = A.createBufferSource(), f = A.createBiquadFilter(), g = A.createGain();
      f.type = 'lowpass'; f.frequency.value = 700; g.gain.value = 0.5;
      s.buffer = b; s.connect(f); f.connect(g); g.connect(A.destination); s.start();
    } catch (e) {}
  },
  colocar() {
    this.cubo.object3D.position.y = this.y;
    const largo = POZO_TORNO - (this.y + POZO_NUDO);
    this.cuerda.object3D.position.set(0, this.y + POZO_NUDO + largo / 2, 0);
    this.cuerda.object3D.scale.y = Math.max(0.01, largo);
  },
  // como la aldaba de las puertas: si un rayo lo toca, la manivela brilla en amarillo y crece
  mirarRayos() {
    let apuntado = false;
    for (const el of this.el.sceneEl.querySelectorAll('[raycaster]')) {
      const r = el.components.raycaster;
      if (r && r.data.enabled && r.intersectedEls.some(e => this.el.contains(e))) apuntado = true;
    }
    if (apuntado === this.apuntado) return;
    this.apuntado = apuntado;
    this.manivela.object3D.traverse(o => { if (o.isMesh) o.material.emissive.set(apuntado ? '#ffcc33' : '#000'); });
    const s = apuntado ? 1.4 : 1;
    this.manivela.object3D.scale.set(s, s, s);
  },
  tick(t, dt) {
    this.mirarRayos();
    if (!this.fase || !dt) return;
    this.ms += Math.min(dt, 100);
    if (this.fase === 'baja') {
      const f = Math.min(1, this.ms / POZO_BAJA_MS);
      this.y = POZO_ARRIBA + (POZO_ABAJO - POZO_ARRIBA) * f * f;   // baja cada vez más deprisa
      this.manivela.object3D.rotation.x -= 0.012 * dt * (0.4 + f);
      if (f === 1) { this.fase = 'llena'; this.ms = 0; this.chapoteo(); this.lleno = true; this.agua.setAttribute('visible', true); }
    } else if (this.fase === 'llena') {
      if (this.ms > POZO_LLENA_MS) { this.fase = 'sube'; this.ms = 0; }
    } else {
      const f = Math.min(1, this.ms / POZO_SUBE_MS);
      this.y = POZO_ABAJO + (POZO_ARRIBA - POZO_ABAJO) * f;
      this.manivela.object3D.rotation.x += 0.006 * dt;
      if (f === 1) this.fase = null;
    }
    this.colocar();
  },
  remove() { if (this.audio) this.audio.close(); }
});

// Techo de la cueva: una malla irregular de roca, con estalactitas en los picos
AFRAME.registerComponent('techo-cueva', {
  schema: { x0: { default: 0 }, x1: { default: 0 }, z0: { default: 0 }, z1: { default: 0 } },
  init() {
    const { x0, x1, z0, z1 } = this.data, PASO = 2;
    const nx = Math.round((x1 - x0) / PASO), nz = Math.round((z1 - z0) / PASO), pos = [], ind = [];
    for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
      const x = x0 + i * PASO, z = z0 + j * PASO;
      pos.push(x, alturaTechoCueva(x, z), z);
      if (i < nx && j < nz) { const a = j * (nx + 1) + i, b = a + nx + 1; ind.push(a, a + 1, b, a + 1, b + 1, b); }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setIndex(ind);
    const plano = geo.toNonIndexed();
    plano.computeVertexNormals();
    this.el.setObject3D('mesh', new THREE.Mesh(plano, new THREE.MeshStandardMaterial({ color: '#5b554c', roughness: 1, flatShading: true })));
  },
  remove() { this.el.removeObject3D('mesh'); }
});

// Animal de cajas: cuerpo, cuello y cabeza, y cuatro patas que se mueven al andar. Da vueltas por una
// ruta ("x z" separados por comas), pegado al terreno, y se para de vez en cuando a pastar.
AFRAME.registerComponent('ciervo', {
  schema: { puntos: { type: 'string' }, color: { default: '#7a5635' }, astas: { default: true }, velocidad: { default: 1.1 } },
  init() {
    const { color, astas } = this.data;
    this.ruta = this.data.puntos.split(',').map(p => p.trim().split(/\s+/).map(Number));
    this.i = 0; this.pausa = 0; this.fase = 0; this.pasto = 0;
    const piel = new THREE.MeshStandardMaterial({ color, roughness: 1 }), clara = new THREE.MeshStandardMaterial({ color: '#c9b79a', roughness: 1 });
    const oscuro = new THREE.MeshStandardMaterial({ color: '#2e2219', roughness: 1 });
    const caja = (padre, x, y, z, w, h, d, m = piel) => { const c = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); c.position.set(x, y, z); padre.add(c); return c; };
    const g = new THREE.Group();
    caja(g, 0, 1.02, 0, 0.42, 0.5, 1.15);
    caja(g, 0, 0.95, -0.42, 0.3, 0.26, 0.25, clara);   // la grupa clara y el rabo
    caja(g, 0, 1.15, -0.62, 0.1, 0.2, 0.08, clara);
    this.patas = [];
    for (const [x, z] of [[-0.15, 0.45], [0.15, 0.45], [-0.15, -0.45], [0.15, -0.45]]) {
      const p = new THREE.Group();
      p.position.set(x, 0.86, z);
      caja(p, 0, -0.43, 0, 0.09, 0.86, 0.1);
      caja(p, 0, -0.84, 0, 0.1, 0.06, 0.13, oscuro);
      g.add(p);
      this.patas.push(p);
    }
    // el cuello gira en el hombro para bajar a pastar
    this.cuello = new THREE.Group();
    this.cuello.position.set(0, 1.2, 0.5);
    this.cuello.rotation.x = 0.5;
    const cu = caja(this.cuello, 0, 0.2, 0.05, 0.18, 0.55, 0.2);
    cu.rotation.x = -0.15;
    caja(this.cuello, 0, 0.5, 0.2, 0.2, 0.2, 0.38);
    caja(this.cuello, 0, 0.47, 0.42, 0.12, 0.12, 0.12, oscuro);
    for (const l of [-1, 1]) {
      const oreja = caja(this.cuello, l * 0.15, 0.62, 0.12, 0.14, 0.05, 0.06);
      oreja.rotation.z = l * 0.4;
      if (!astas) continue;
      const a = new THREE.Group();
      a.position.set(l * 0.07, 0.6, 0.15);
      a.rotation.z = l * -0.3;
      caja(a, 0, 0.3, 0, 0.03, 0.6, 0.03, clara);
      for (const [y, s] of [[0.25, 1], [0.45, -1], [0.58, 1]]) { const r = caja(a, l * 0.09, y, s * 0.06, 0.02, 0.22, 0.02, clara); r.rotation.set(s * 0.8, 0, l * -0.8); }
      this.cuello.add(a);
    }
    g.add(this.cuello);
    this.el.setObject3D('mesh', g);
    const [x, z] = this.ruta[0];
    this.el.object3D.position.set(x, alturaTerreno(x, z), z);
  },
  tick(t, dt) {
    if (!dt) return;
    const s = Math.min(dt, 100) / 1000, o = this.el.object3D;
    if (this.pausa > 0) {
      this.pausa -= s;
      this.pasto = Math.min(1, this.pasto + s * 1.2);
      this.cuello.rotation.x = 0.5 + this.pasto * 1.5 + 0.06 * Math.sin(t / 200);   // baja la cabeza
      for (const p of this.patas) p.rotation.x *= 0.85;
      return;
    }
    this.pasto = Math.max(0, this.pasto - s * 1.5);
    this.cuello.rotation.x = 0.5 + this.pasto * 1.5;
    if (this.pasto > 0) return;
    const [mx, mz] = this.ruta[this.i], dx = mx - o.position.x, dz = mz - o.position.z, d = Math.hypot(dx, dz);
    if (d < 0.6) {
      this.i = (this.i + 1) % this.ruta.length;
      if (this.i % 2 === 0) this.pausa = 4 + Math.random() * 5;
      return;
    }
    const v = this.data.velocidad * s;
    o.position.x += dx / d * v; o.position.z += dz / d * v;
    o.position.y = alturaTerreno(o.position.x, o.position.z);
    let dg = Math.atan2(dx, dz) - o.rotation.y;
    dg = Math.atan2(Math.sin(dg), Math.cos(dg));
    o.rotation.y += dg * Math.min(1, s * 2.5);
    this.fase += v * 4.5;
    this.patas.forEach((p, k) => { p.rotation.x = 0.5 * Math.sin(this.fase + (k === 0 || k === 3 ? 0 : Math.PI)); });
  },
  remove() { this.el.removeObject3D('mesh'); }
});

// Un pez: cuerpo en huso, oscuro por el lomo y plateado por la panza, con cola, aletas y ojos. Mira a +z.
function formaDePez() {
  const pos = [], col = [], c = new THREE.Color(), LOMO = '#2d4347', COSTADO = '#6f8a86', PANZA = '#c4cfc6', ALETA = '#34464a', OJO = '#0c0f10';
  const tri = (a, b, d, color) => { c.set(color); for (const p of [a, b, d]) { pos.push(...p); col.push(c.r, c.g, c.b); } };
  const anillos = [[0.3, 0], [0.2, 0.05], [0.06, 0.082], [-0.1, 0.075], [-0.22, 0.038], [-0.31, 0.012]], L = 8;
  const punto = (r, k) => { const a = k / L * Math.PI * 2; return [Math.sin(a) * r[1] * 0.72, Math.cos(a) * r[1], r[0]]; };
  const colorEn = k => { const y = Math.cos(k / L * Math.PI * 2); return y > 0.4 ? LOMO : y > -0.4 ? COSTADO : PANZA; };
  for (let i = 0; i < anillos.length - 1; i++) for (let k = 0; k < L; k++) {
    const a = punto(anillos[i], k), b = punto(anillos[i], k + 1), d = punto(anillos[i + 1], k), e = punto(anillos[i + 1], k + 1);
    tri(a, d, b, colorEn(k + 0.5));
    if (i > 0) tri(b, d, e, colorEn(k + 0.5));
  }
  // cola en horquilla, aleta dorsal, anal y dos laterales
  tri([0, 0, -0.29], [0, 0.11, -0.46], [0, 0.015, -0.38], ALETA);
  tri([0, 0, -0.29], [0, -0.11, -0.46], [0, -0.015, -0.38], ALETA);
  tri([0, 0.078, 0.08], [0, 0.135, -0.04], [0, 0.06, -0.13], ALETA);
  tri([0, -0.05, -0.1], [0, -0.09, -0.17], [0, -0.03, -0.22], ALETA);
  for (const s of [-1, 1]) {
    tri([s * 0.05, -0.02, 0.12], [s * 0.13, -0.05, 0.02], [s * 0.05, -0.03, 0.03], ALETA);
    // el ojo: un rombito a cada lado de la cabeza
    const x = s * 0.04, y = 0.02, z = 0.21, r = 0.014;
    tri([x, y + r, z], [x, y, z + r], [x, y - r, z], OJO);
    tri([x, y + r, z], [x, y - r, z], [x, y, z - r], OJO);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  return g;
}

// Banco de peces: nadan en círculos justo bajo el agua y, de vez en cuando, uno salta. Marca una zona
// de pesca. En bloque (InstancedMesh): una llamada de dibujo.
AFRAME.registerComponent('peces', {
  schema: { cuantos: { default: 18 }, radio: { default: 6 } },
  init() {
    const { cuantos, radio } = this.data;
    this.banco = new THREE.InstancedMesh(formaDePez(), new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide }), cuantos);
    this.banco.frustumCulled = false;
    const tono = new THREE.Color();
    for (let i = 0; i < cuantos; i++) { const l = 0.8 + Math.random() * 0.4; this.banco.setColorAt(i, tono.setRGB(l, l, l * (0.95 + Math.random() * 0.1))); }
    this.datos = [];
    for (let i = 0; i < cuantos; i++) this.datos.push({ r: radio * (0.3 + Math.random() * 0.7), a: Math.random() * 6.28, v: (0.25 + Math.random() * 0.25) * (i % 3 ? 1 : -1), h: 0.12 + Math.random() * 0.25, salto: 3 + Math.random() * 25 });
    this.m = new THREE.Matrix4(); this.p = new THREE.Vector3(); this.q = new THREE.Quaternion(); this.e = new THREE.Euler(); this.u = new THREE.Vector3(1, 1, 1);
    // aros en la superficie, que delatan el banco
    const aro = new THREE.Mesh(new THREE.RingGeometry(0.8, 0.88, 28), new THREE.MeshBasicMaterial({ color: '#dcebf2', transparent: true, opacity: 0.55, depthWrite: false }));
    aro.rotation.x = -Math.PI / 2;
    aro.position.y = 0.03;
    this.aros = [aro, aro.clone(), aro.clone()];
    this.aros[1].material = aro.material.clone(); this.aros[2].material = aro.material.clone();
    this.aros.forEach((a, i) => { a.position.x = (i - 1) * radio * 0.5; a.position.z = (i % 2) * radio * 0.4 - radio * 0.2; });
    const g = new THREE.Group();
    g.add(this.banco, ...this.aros);
    this.el.setObject3D('mesh', g);
  },
  tick(t, dt) {
    if (!dt) return;
    const s = Math.min(dt, 100) / 1000;
    this.datos.forEach((f, i) => {
      f.a += f.v * s;
      f.salto -= s;
      // salta: medio segundo de arco por encima del agua
      const arriba = f.salto < 0 ? Math.sin(Math.min(1, -f.salto / 0.6) * Math.PI) * 0.55 : 0;
      if (f.salto < -0.6) f.salto = 8 + Math.random() * 30;
      this.p.set(Math.cos(f.a) * f.r, arriba > 0 ? arriba : -f.h, Math.sin(f.a) * f.r);
      // mira hacia donde nada, y coletea
      this.e.set(arriba > 0 ? -0.6 * Math.cos(-f.salto / 0.6 * Math.PI) : 0, Math.atan2(-Math.sin(f.a) * Math.sign(f.v), Math.cos(f.a) * Math.sign(f.v)) + 0.16 * Math.sin(t / 130 + i * 1.7), 0);
      this.m.compose(this.p, this.q.setFromEuler(this.e), this.u);
      this.banco.setMatrixAt(i, this.m);
    });
    this.banco.instanceMatrix.needsUpdate = true;
    this.aros.forEach((a, i) => {
      const f = ((t / 3000) + i / 3) % 1, k = 0.3 + f * 2.2;
      a.scale.set(k, k, 1);
      a.material.opacity = 0.55 * (1 - f);
    });
  },
  remove() { this.el.removeObject3D('mesh'); }
});

// Pinos: un tronco y tres pisos de copa, en bloque, repartidos por el terreno por debajo de "altura" y
// lejos de los puntos de "evitar" ("x z r"). Oscuros y de copa recta, para dar otra cara a la montaña.
AFRAME.registerComponent('pinos', {
  schema: { cuantos: { default: 150 }, x0: { default: 0 }, x1: { default: 0 }, z0: { default: 0 }, z1: { default: 0 }, altura: { default: 28 }, evitar: { default: '' } },
  init() {
    const { cuantos, x0, x1, z0, z1, altura, evitar } = this.data;
    const lejos = evitar.split(',').map(p => p.trim().split(/\s+/).map(Number)).filter(p => p.length === 3);
    const piezas = [new THREE.CylinderGeometry(0.16, 0.26, 2.4, 6).translate(0, 1.1, 0)];
    const copas = [[3.8, 1.35, 3.6], [3, 1.05, 5], [2.4, 0.75, 6.2]].map(([h, r, y]) => new THREE.ConeGeometry(r, h, 7).translate(0, y, 0));
    const fundir = gs => {
      const pos = [], nor = [];
      for (const g of gs) { const n = g.index ? g.toNonIndexed() : g; pos.push(...n.attributes.position.array); nor.push(...n.attributes.normal.array); }
      const o = new THREE.BufferGeometry();
      o.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      o.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
      return o;
    };
    const tronco = new THREE.InstancedMesh(fundir(piezas), new THREE.MeshStandardMaterial({ color: '#3a2a1e', roughness: 1 }), cuantos);
    const copa = new THREE.InstancedMesh(fundir(copas), new THREE.MeshStandardMaterial({ color: '#25452e', roughness: 1, flatShading: true }), cuantos);
    let s = 31, k = 0;
    const azar = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), arriba = new THREE.Vector3(0, 1, 0), c = new THREE.Color();
    for (let i = 0; i < cuantos * 30 && k < cuantos; i++) {
      const x = x0 + azar() * (x1 - x0), z = z0 + azar() * (z1 - z0), y = alturaTerreno(x, z);
      if (y > altura || lejos.some(([a, b, r]) => Math.hypot(x - a, z - b) < r)) continue;
      const e = 0.8 + azar() * 0.7;
      m.compose(new THREE.Vector3(x, y - 0.1, z), q.setFromAxisAngle(arriba, azar() * 6.28), new THREE.Vector3(e, e, e));
      tronco.setMatrixAt(k, m); copa.setMatrixAt(k, m);
      const l = 0.75 + azar() * 0.5;
      copa.setColorAt(k, c.setRGB(l, l, l));
      const r = 0.3 * e;
      SUPERFICIES.push({ x0: x - r, x1: x + r, z0: z - r, z1: z + r, y: y + 3, macizo: true });
      k++;
    }
    tronco.count = copa.count = k;
    tronco.frustumCulled = copa.frustumCulled = false;
    const g = new THREE.Group();
    g.add(tronco, copa);
    this.el.setObject3D('mesh', g);
  },
  remove() { this.el.removeObject3D('mesh'); }
});
