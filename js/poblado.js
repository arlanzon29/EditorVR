// Editor VR: lo del poblado y la abadía. Casas de entramado, puestos de mercado, tumbas y columnas.
// Son piezas fijas: se funden y se hornean como el resto. Las macizas van en SUPERFICIES.

function piezaCaja(padre, x, y, z, w, h, d, attrs) {
  const e = document.createElement('a-box');
  e.setAttribute('position', `${x} ${y} ${z}`); e.setAttribute('width', w); e.setAttribute('height', h); e.setAttribute('depth', d);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  padre.appendChild(e);
}
// Obstáculo en el mundo: las piezas se giran de 90 en 90°, así que sigue siendo un rectángulo
function macizoGirado(el, ancho, fondo, alto) {
  const p = el.object3D.position, g = Math.round(el.object3D.rotation.y / (Math.PI / 2)) % 2 !== 0;
  const a = (g ? fondo : ancho) / 2, f = (g ? ancho : fondo) / 2;
  SUPERFICIES.push({ x0: p.x - a, x1: p.x + a, z0: p.z - f, z1: p.z + f, y: alto, macizo: true });
}

// Casa de planta rectangular: zócalo de piedra, paredes encaladas con vigas vistas (con "madera", de tablas
// de ese tono), puerta, ventanas con postigos y tejado de paja a dos aguas. Mira hacia +z local; el origen,
// en el centro, en el suelo.
AFRAME.registerComponent('casa', {
  schema: { ancho: { default: 6 }, fondo: { default: 5 }, alto: { default: 2.8 }, cal: { default: '#c9b998' }, madera: { default: '' }, techo: { default: '#6e5c33' } },
  init() {
    const { ancho: A, fondo: F, alto: H, cal, madera, techo } = this.data, MADERA = '#3a2a1b';
    const el = this.el, c = (x, y, z, w, h, d, attrs) => piezaCaja(el, x, y, z, w, h, d, attrs);
    // (el zócalo sigue 1,5 m bajo tierra: en una cuesta, la casa no queda en el aire)
    c(0, -0.45, 0, A + 0.1, 2.1, F + 0.1, { 'piedra-mundo': 'tono: #b5ab98' });
    c(0, 0.6 + (H - 0.6) / 2, 0, A, H - 0.6, F, madera ? { 'madera-mundo': `tono: ${madera}` } : { color: cal });
    // vigas vistas por las cuatro caras: esquinas, una a media altura y arriba
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) c(sx * A / 2, H / 2 + 0.3, sz * F / 2, 0.16, H - 0.6, 0.16, { color: MADERA });
    for (const lado of [-1, 1]) {
      c(0, H, lado * F / 2, A + 0.1, 0.14, 0.1, { color: MADERA });
      c(0, 1.5, lado * (F / 2 + 0.01), A, 0.1, 0.06, { color: MADERA });
      c(lado * A / 2, H, 0, 0.1, 0.14, F + 0.1, { color: MADERA });
      c(lado * (A / 2 + 0.01), 1.5, 0, 0.06, 0.1, F, { color: MADERA });
    }
    // puerta y ventanas con postigos, cerrados, delante
    c(0, 1.05, F / 2 + 0.03, 1, 2.1, 0.06, { color: '#34251a' });
    c(0, 2.15, F / 2 + 0.04, 1.2, 0.12, 0.08, { color: MADERA });
    for (const lado of [-1, 1]) c(lado * A * 0.29, 1.85, F / 2 + 0.03, 0.8, 0.7, 0.05, { color: '#4a3424' });
    // tejado de paja, a dos aguas: un prisma con sus hastiales
    const P = 1.9, V = 0.35, forma = new THREE.Shape();
    forma.moveTo(-(A / 2 + V), 0); forma.lineTo(A / 2 + V, 0); forma.lineTo(0, P); forma.lineTo(-(A / 2 + V), 0);
    const geo = new THREE.ExtrudeGeometry(forma, { depth: F + 2 * V, bevelEnabled: false }).toNonIndexed();
    geo.translate(0, H + 0.05, -(F / 2 + V));
    geo.computeVertexNormals();
    el.setObject3D('mesh', new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: techo, roughness: 1, flatShading: true })));
    macizoGirado(el, A + 0.2, F + 0.2, H);
  },
  remove() { this.el.removeObject3D('mesh'); }
});

// Puesto de mercado: mostrador con mercancía (cajas y sacos) y un toldo de tela de color apagado.
AFRAME.registerComponent('puesto', {
  schema: { toldo: { default: '#7a3f35' } },
  init() {
    const c = (x, y, z, w, h, d, attrs) => piezaCaja(this.el, x, y, z, w, h, d, attrs), M = { color: '#4e3421' };
    c(0, 0.45, 0, 2.4, 0.9, 1, M);
    for (const [x, z] of [[-1.15, -0.5], [1.15, -0.5], [-1.15, 0.5], [1.15, 0.5]]) c(x, 1.15, z, 0.09, 2.3, 0.09, M);
    c(0, 2.35, 0, 2.8, 0.05, 1.6, { color: this.data.toldo });
    [[-0.8, '#a8843f'], [-0.1, '#71803f'], [0.65, '#8c5a35']].forEach(([x, color]) => c(x, 1, 0.1, 0.5, 0.22, 0.6, { color }));
    macizoGirado(this.el, 2.6, 1.2, 1);
  }
});

// Tumba: una losa con su lápida un poco ladeada
AFRAME.registerComponent('tumba', {
  init() {
    const c = (x, y, z, w, h, d, attrs) => piezaCaja(this.el, x, y, z, w, h, d, attrs), P = { 'piedra-mundo': 'tono: #8d8f92' };
    c(0, 0.08, 0, 0.9, 0.16, 1.9, P);
    c(0, 0.55, -0.85, 0.75, 1, 0.14, P);
    macizoGirado(this.el, 0.9, 1.9, 0.4);
  }
});

// Columna de piedra con basa y capitel; "alto" permite dejarla rota.
AFRAME.registerComponent('columna', {
  schema: { alto: { default: 6 } },
  init() {
    const c = (x, y, z, w, h, d, attrs) => piezaCaja(this.el, x, y, z, w, h, d, attrs), P = { 'piedra-mundo': 'tono: #9a9ca0' }, A = this.data.alto;
    c(0, 0.2, 0, 1.1, 0.4, 1.1, P);
    c(0, A / 2, 0, 0.75, A, 0.75, P);
    if (A > 5) c(0, A + 0.15, 0, 1.05, 0.3, 1.05, P);
    SUPERFICIES.push({ x0: this.el.object3D.position.x - 0.55, x1: this.el.object3D.position.x + 0.55, z0: this.el.object3D.position.z - 0.55, z1: this.el.object3D.position.z + 0.55, y: 3, macizo: true });
  }
});

// Muestra de un negocio: tablones viejos pintados a mano por las dos caras, que cuelgan de un brazo de hierro y se mecen un poco.
// Origen: en el eje del que cuelga; los brazos van hacia +z local, hasta la pared. emblema: luna o jarra.
AFRAME.registerComponent('muestra', {
  schema: { titulo: { default: '' }, nombre: { default: '' }, emblema: { default: 'luna' }, ancho: { default: 2.3 }, caida: { default: 0.22 }, brazo: { default: 0.6 } },
  init() {
    const { titulo, nombre, emblema, ancho: ANCHO, caida: CAIDA, brazo: BRAZO } = this.data;
    const c = document.createElement('canvas'), W = c.width = 1024, H = c.height = 340, g = c.getContext('2d');
    let semilla = nombre.length * 97 + 11;
    const azar = () => (semilla = (semilla * 16807) % 2147483647) / 2147483647;
    // tres tablones viejos, de tono algo distinto, con vetas, nudos y juntas abiertas
    const TABLON = H / 3;
    for (let k = 0; k < 3; k++) {
      const y = k * TABLON, l = 20 + azar() * 4;
      g.fillStyle = `hsl(${25 + azar() * 4}, 32%, ${l}%)`; g.fillRect(0, y, W, TABLON);
      for (let v = 0; v < 26; v++) {
        const vy = y + azar() * TABLON, fase = azar() * 6;
        g.strokeStyle = `hsla(26, 35%, ${azar() < 0.6 ? 11 : 30}%, ${0.25 + azar() * 0.35})`; g.lineWidth = 0.8 + azar() * 1.8;
        g.beginPath();
        for (let x = 0; x <= W; x += 24) g.lineTo(x, vy + Math.sin(x / 110 + fase) * 4);
        g.stroke();
      }
      const nx = 180 + azar() * 660, ny = y + TABLON * (0.25 + azar() * 0.5);
      g.fillStyle = 'rgba(18, 10, 5, 0.55)'; g.beginPath(); g.ellipse(nx, ny, 15, 8, 0, 0, Math.PI * 2); g.fill();
      g.fillStyle = 'rgba(10, 6, 3, 0.9)'; g.fillRect(0, y - 2, W, 5);
    }
    // herrajes de hierro en los extremos, clavados
    for (const x of [0, W - 48]) {
      g.fillStyle = '#211d19'; g.fillRect(x, 0, 48, H);
      g.fillStyle = '#3c3630';
      for (let y = 28; y < H; y += 71) { g.beginPath(); g.arc(x + 24, y, 7, 0, Math.PI * 2); g.fill(); }
    }
    // pintura a mano, de un color y un negro gastados: las manchas de la madera se comen parte de lo pintado
    const PINTURA_CLARA = '#b5a378', OSCURO = '#17110b';
    g.lineCap = 'round'; g.lineJoin = 'round';
    for (const x of [122, W - 122]) {
      g.fillStyle = PINTURA_CLARA;
      if (emblema === 'jarra') {
        g.beginPath(); g.moveTo(x - 30, H / 2 - 32); g.lineTo(x + 28, H / 2 - 35); g.lineTo(x + 36, H / 2 + 44); g.lineTo(x - 36, H / 2 + 46); g.closePath(); g.fill();
        g.strokeStyle = PINTURA_CLARA; g.lineWidth = 9; g.beginPath(); g.arc(x + 35, H / 2 + 2, 20, -Math.PI / 2, Math.PI / 2); g.stroke();
        g.strokeStyle = OSCURO; g.lineWidth = 3; g.beginPath(); g.moveTo(x - 31, H / 2 - 13); g.lineTo(x + 30, H / 2 - 15); g.moveTo(x - 34, H / 2 + 26); g.lineTo(x + 34, H / 2 + 25); g.stroke();
      } else {
        g.beginPath(); g.arc(x, H / 2, 42, Math.PI * 0.32, Math.PI * 1.68); g.quadraticCurveTo(x - 8, H / 2, x + 22, H / 2 + 35); g.fill();
        for (const [dx, dy, r] of [[28, -34, 5], [38, 5, 4], [18, 44, 3]]) { g.beginPath(); g.arc(x + dx, H / 2 + dy, r, 0, Math.PI * 2); g.fill(); }
      }
    }
    // cada letra, a pulso: un poco torcida y a su altura. Sin sombra ni brillo: pintura sobre madera
    const aPulso = (texto, y, tam, estilo, tinta) => {
      g.font = `${estilo} ${tam}px Georgia, serif`;
      const anchos = [...texto].map(l => g.measureText(l).width), total = anchos.reduce((a, b) => a + b, 0);
      let x = W / 2 - total / 2;
      [...texto].forEach((l, k) => {
        g.save();
        g.translate(x + anchos[k] / 2, y + (azar() - 0.5) * tam * 0.05);
        g.rotate((azar() - 0.5) * 0.05);
        g.fillStyle = tinta; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.fillText(l, 0, 0);
        g.restore();
        x += anchos[k];
      });
    };
    g.font = 'italic 700 112px Georgia, serif';
    const tam = Math.min(112, Math.floor(112 * 520 / g.measureText(nombre).width));
    aPulso(titulo, 88, 50, '700', PINTURA_CLARA);
    aPulso(nombre, 205, tam, 'italic 700', PINTURA_CLARA);
    // la pintura gastada: rozaduras del color de la madera por encima de todo
    for (let k = 0; k < 260; k++) {
      g.fillStyle = `hsla(26, 30%, ${16 + azar() * 8}%, ${0.35 + azar() * 0.5})`;
      g.fillRect(50 + azar() * (W - 100), azar() * H, 3 + azar() * 22, 1 + azar() * 3);
    }
    this.tex = new THREE.CanvasTexture(c);
    this.tex.colorSpace = THREE.SRGBColorSpace; this.tex.anisotropy = 8;
    const ALTO = ANCHO * H / W, GROSOR = 0.05;
    this.materiales = [new THREE.MeshStandardMaterial({ map: this.tex, roughness: 1 }), new THREE.MeshStandardMaterial({ color: '#2c1d12', roughness: 1 }), new THREE.MeshStandardMaterial({ color: '#1f1c19', roughness: 0.6, metalness: 0.4 })];
    const [PINTURA, CANTO, HIERRO] = this.materiales;
    const raiz = new THREE.Group();
    const pieza = (padre, x, y, z, w, h, d, m) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); padre.add(o); return o; };
    // el eje entre dos brazos que salen de la pared
    pieza(raiz, 0, 0, 0, ANCHO + 0.3, 0.04, 0.04, HIERRO);
    for (const s of [-1, 1]) pieza(raiz, s * (ANCHO / 2 + 0.15), 0, BRAZO / 2, 0.05, 0.05, BRAZO + 0.04, HIERRO);
    // lo que se mece: las dos cadenas y la tabla
    this.tabla = new THREE.Group();
    for (const s of [-1, 1]) pieza(this.tabla, s * ANCHO * 0.36, -(CAIDA - 0.025) / 2, 0, 0.025, CAIDA - 0.025, 0.025, HIERRO);
    // dos caras separadas por el grueso de la tabla, y el canto alrededor: sin una caja detrás de la pintura,
    // que a pocos milímetros parpadea
    const B = 0.025, medio = -CAIDA - ALTO / 2;
    pieza(this.tabla, 0, medio + (ALTO + B) / 2, 0, ANCHO + 2 * B, B, GROSOR, CANTO);
    pieza(this.tabla, 0, medio - (ALTO + B) / 2, 0, ANCHO + 2 * B, B, GROSOR, CANTO);
    pieza(this.tabla, -(ANCHO + B) / 2, medio, 0, B, ALTO, GROSOR, CANTO);
    pieza(this.tabla, (ANCHO + B) / 2, medio, 0, B, ALTO, GROSOR, CANTO);
    for (const [z, giro] of [[GROSOR / 2 - 0.005, 0], [-GROSOR / 2 + 0.005, Math.PI]]) {
      const cara = new THREE.Mesh(new THREE.PlaneGeometry(ANCHO, ALTO), PINTURA);
      cara.position.set(0, -CAIDA - ALTO / 2, z);
      cara.rotation.y = giro;
      this.tabla.add(cara);
    }
    raiz.add(this.tabla);
    this.el.setObject3D('mesh', raiz);
  },
  tick(t) { this.tabla.rotation.x = 0.025 * Math.sin(t / 1100); },
  remove() {
    this.el.getObject3D('mesh').traverse(o => { if (o.isMesh) o.geometry.dispose(); });
    this.el.removeObject3D('mesh');
    for (const m of this.materiales) m.dispose();
    this.tex.dispose();
  }
});

// La moza de la jarra (herramientas/modelar-moza.py): anda por una ruta de puntos (x z espera), como el criado, pero con
// esqueleto (persona-animada, js/boda.js). Sube y baja un poco a cada paso, y se para si estás en medio.
const MOZA_PASOS_POR_S = 2, MOZA_SE_PARA = 1.1;
AFRAME.registerComponent('moza', {
  schema: { puntos: { type: 'string' }, velocidad: { default: 0.85 }, saludo: { default: 'Buenos días.' } },
  init() {
    this.el.setAttribute('persona-animada', 'modelo: moza; macizo: false');
    this.ruta = this.data.puntos.split(',').map(s => s.trim().split(/\s+/).map(Number)).filter(p => p.length >= 2);
    this.i = 0; this.espera = 0; this.fase = 0; this.ojo = new THREE.Vector3();
    this.y = this.el.object3D.position.y;
    this.cartel = cartelDeTexto(this.el, this.data.saludo, '0 2 0');
    this.saludado = false; this.ocultar = 0;
  },
  tick(t, dt) {
    if (!dt || !this.ruta.length) return;
    dt = Math.min(dt, 50);
    const o = this.el.object3D, persona = this.el.components['persona-animada'];
    this.el.sceneEl.camera.getWorldPosition(this.ojo);
    const aMi = Math.hypot(this.ojo.x - o.position.x, this.ojo.z - o.position.z);
    // saludo
    if (aMi < 2 && !this.saludado) { this.saludado = true; this.cartel.object3D.visible = true; this.ocultar = t + 3500; }
    if (aMi > 3) this.saludado = false;
    if (this.cartel.object3D.visible) {
      if (t > this.ocultar) this.cartel.object3D.visible = false;
      else this.cartel.object3D.lookAt(this.ojo.x, this.cartel.object3D.getWorldPosition(new THREE.Vector3()).y, this.ojo.z);
    }
    this.espera -= dt;
    const [x, z, pausa = 0] = this.ruta[this.i], dx = x - o.position.x, dz = z - o.position.z, falta = Math.hypot(dx, dz);
    // gira poco a poco hacia donde va, y no anda hasta mirar más o menos hacia allí
    const rumbo = Math.atan2(dx, dz), giro = Math.atan2(Math.sin(rumbo - o.rotation.y), Math.cos(rumbo - o.rotation.y));
    const quieta = this.espera > 0 || aMi < MOZA_SE_PARA;
    if (!quieta) o.rotation.y += giro * Math.min(1, dt / 200);
    if (quieta || Math.abs(giro) > 0.7) {
      if (persona) persona.poner(quieta ? 'reposo' : 'andar');
      o.position.y += (this.y - o.position.y) * Math.min(1, dt / 100);
      return;
    }
    if (persona) persona.poner('andar');
    const paso = this.data.velocidad * dt / 1000;
    if (falta <= paso) {
      o.position.x = x; o.position.z = z;
      this.i = (this.i + 1) % this.ruta.length;
      this.espera = pausa * 1000;
      return;
    }
    o.position.x += dx / falta * paso;
    o.position.z += dz / falta * paso;
    this.fase += dt / 1000 * MOZA_PASOS_POR_S * Math.PI;
    o.position.y = this.y + 0.012 * Math.abs(Math.sin(this.fase));
  },
  remove() { this.cartel = null; }
});
