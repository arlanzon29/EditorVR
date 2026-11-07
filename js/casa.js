// Editor VR: tu casa del poblado (salas/casa.html), frente a la posada. Por fuera está entera y siempre igual (muros,
// tejado: casa-fuera, que se funde y se hornea con la sala), en todos los episodios. Por dentro empieza en ruinas y se
// repara en tres obras, cada una con una carga de madera y otra de piedra (las cartas de los oficios, js/oficios.js).
// Cuatro fases, guardadas en partida.estado.obra: 0 ruina (vigas caídas, agujeros, escombros y maleza), 1 el techo y las
// paredes arreglados, 2 limpia pero vacía, 3 terminada (con sus muebles y el fuego). Se entra desde el principio.
// Lo que cambia con la obra (escombros, vigas caídas, parches, muebles) lo dibuja casa-obra, y va en NO_FUNDIR
// (rendimiento.js): así reparar no obliga a hornear. Lo fijo (muros, suelo, techo y tabique) está en el HTML.
// Origen: el centro de la casa, en el suelo. Planta de 7 × 5 m, con la puerta en la cara +z, a x = -1,4. Sin girar.

const CASA = { A: 7, F: 5, H: 2.8, V: 0.35, P: 1.9 };   // ancho, fondo, alto de los muros, vuelo del tejado y altura del tejado
const CASA_OBRAS = 3;
const CASA_ESCOMBROS = [16, 7, 2, 0], CASA_MALEZA = [10, 4, 0, 0];   // dentro
const CASA_BANCO = { x: 1.9, z: 1.3 };
const CASA_FUNDIDO_MS = 2500;
const CASA_MESA = { x: -1.3, z: -1.2 };   // la mesa del salón, al fondo, a lo largo de la pared de atrás
const CASA_SENTADO_BAJA = 0.4;   // lo que se bajan Leonor y Garcés sentados a la mesa de la cena   // al pasar de una obra a otra, lo de antes se desvanece mientras aparece lo nuevo   // el banco de obra, en la habitación (hasta la última obra)
const CASA_TEXTOS = [
  'La casa lleva años abandonada: por fuera aguanta, pero por dentro hay vigas caídas, agujeros y escombros. Para empezar a repararla hace falta una carga de madera y otra de piedra.',
  'El techo y las paredes ya están arreglados. Para seguir hace falta otra carga de madera y otra de piedra.',
  'Falta lo último: los muebles y el hogar. Una carga de madera y otra de piedra.',
];
const CASA_RESULTADOS = [
  'Subes las vigas caídas y tapas los agujeros del techo y de las paredes. La casa empieza a tener cara de casa.',
  'Sacas los escombros y barres. Ya está limpia, pero vacía. Falta darle vida.',
  'Colocas los muebles y enciendes el fuego. Tu casa está terminada. Cae la noche: Leonor y Garcés vienen a cenar.',
];

// La cena del final (episodio2.md), de noche: sentado en tu salón, con Leonor y Garcés sentados al otro lado de la mesa.
// La charla va en una página de cómic (js/comic.js), como la de Leonor en la posada; en la tercera respuesta, la noticia.
const CENA_SILLA = { x: -1.3, z: -0.25 };   // en coordenadas de la casa: en el banco, de cara a la mesa (y al fondo)
// Las tomas, en el mundo: la casa está en 150, -146; tú, en 148,7, -146,25; Garcés y Leonor, sentados en el banco del
// fondo, en 148,35 y 149,05, -147,95, con la cabeza a 1,2 m; la chimenea, al oeste, en 147,1.
const CENA_GARCES = [148.35, 1.22, -147.95], CENA_LEONOR = [149.05, 1.24, -147.95];
const COMIC_CENA = {
  titulo: 'Episodio 2 · Una casa',
  tomas: {
    general: { desde: [149.75, 1.75, -144.9], mira: [148.7, 0.95, -147.6], fov: 62, cabeza: CENA_GARCES },
    garces: { desde: [148.05, 1.3, -146.8], mira: [148.35, 1.15, -147.95], fov: 40, cabeza: CENA_GARCES },
    leonor: { desde: [149.4, 1.3, -146.8], mira: [149.05, 1.15, -147.95], fov: 40, cabeza: CENA_LEONOR },
    losDos: { desde: [148.7, 1.32, -146.35], mira: [148.7, 1.1, -147.95], fov: 50, cabeza: CENA_LEONOR },
    fuego: { desde: [149.2, 1.35, -145.4], mira: [147.2, 0.7, -146], fov: 55 },
  },
  paginas: [
    [
      { x: 0, y: 0, w: 0.6, h: 0.5, toma: 'garces', desde: 0, cartela: 'Esa noche, en tu casa nueva.', globos: [{ quien: 'ella', texto: 'Por la casa nueva, y por quien la ha levantado con sus manos.' }] },
      { x: 0.6, y: 0, w: 0.4, h: 0.5, toma: 'fuego', desde: 1, globos: [{ quien: 'tu', texto: '¡Por la casa!' }] },
      { x: 0, y: 0.5, w: 1, h: 0.5, toma: 'leonor', desde: 1, globos: [{ quien: 'ella', texto: 'Te dije que te quedarías. Y nosotros tenemos algo que contarte.' }] },
    ],
    [
      { x: 0, y: 0, w: 0.45, h: 1, toma: 'losDos', desde: 2, globos: [{ quien: 'tu', texto: '¿Qué tenéis que contarme?' }, { quien: 'ella', texto: 'Estoy esperando un niño.' }] },
      { x: 0.45, y: 0, w: 0.55, h: 0.5, toma: 'garces', desde: 3, globos: [{ quien: 'tu', texto: '¡Un niño! Enhorabuena.' }, { quien: 'ella', texto: 'Queremos que lo veas crecer.' }] },
      { x: 0.45, y: 0.5, w: 0.55, h: 0.5, toma: 'general', desde: 4, cartela: 'Por primera vez en mucho tiempo, sientes que tienes un sitio.', globos: [{ quien: 'tu', texto: 'Aquí estaré.' }] },
    ],
  ],
  // (los "hacer", con la cena abierta: los pone casa-obra, que tiene a Garcés)
  pasos: [
    { respuesta: '¡Por la casa!', brindis: true },
    { respuesta: '¿Qué tenéis que contarme?' },
    { respuesta: '¡Un niño! Enhorabuena.', brindis: true, grito: true },
    { respuesta: 'Aquí estaré.' },
    { respuesta: 'Levantarte' },
  ],
};

const matCasa = {};
const colorCasa = c => matCasa[c] || (matCasa[c] = new THREE.MeshStandardMaterial({ color: c, roughness: 1, flatShading: true }));
function semillaCasa(s) { return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

// El tejado de la casa, entero y siempre igual: a dos aguas, con el caballete a lo largo de z, sus cabrios, y los
// hastiales de delante y de atrás. Lo fijo de fuera que no cabe en el HTML; no está en NO_FUNDIR: se funde y se hornea.
AFRAME.registerComponent('casa-fuera', {
  init() {
    const g = new THREE.Group(), caja = (w, h, d, x, y, z, color, rz = 0) => {
      const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), colorCasa(color));
      m.position.set(x, y, z); m.rotation.z = rz; g.add(m);
    };
    const { A, F, H, V, P } = CASA, pendiente = Math.atan2(P, A / 2 + V), L = Math.hypot(A / 2 + V, P), tramos = 6;
    const fondo = F + 2 * V, seg = fondo / tramos, y0 = H + 0.05;
    for (const s of [-1, 1]) {
      // la paja, en seis tramos de tono algo distinto (de años de remiendos)
      for (let k = 0; k < tramos; k++) caja(L, 0.14, seg * 0.98, s * (A / 2 + V) / 2, y0 + P / 2, F / 2 + V - seg * (k + 0.5), ['#7a6a3e', '#71623a', '#7f6e41'][(k + (s > 0 ? 1 : 0)) % 3], -s * pendiente);
      for (let k = 0; k <= tramos; k++) caja(L, 0.1, 0.1, s * (A / 2 + V) / 2, y0 + P / 2 - 0.1, F / 2 + V - seg * k, '#3a2a1b', -s * pendiente);
    }
    caja(0.14, 0.14, fondo, 0, y0 + P - 0.04, 0, '#3a2a1b');
    for (const z of [F / 2 - 0.15, -(F / 2 - 0.15)]) {
      const forma = new THREE.Shape();
      forma.moveTo(-A / 2, 0); forma.lineTo(A / 2, 0); forma.lineTo(A / 2, 0.17); forma.lineTo(0, P); forma.lineTo(-A / 2, 0.17);
      const geo = new THREE.ExtrudeGeometry(forma, { depth: 0.3, bevelEnabled: false });
      geo.translate(0, H, z - 0.15);
      geo.computeVertexNormals();
      g.add(new THREE.Mesh(geo, colorCasa('#a6937a')));
    }
    this.el.setObject3D('mesh', g);
  },
  remove() { this.el.removeObject3D('mesh'); }
});

// Los muebles de la casa terminada, fijos: la chimenea (de Blender), la alfombra, la mesa con sus bancos y lo que hay encima, y en la
// habitación la cama, el arcón y el estante (herramientas/modelar-muebles.py, modelos/mueble-*.glb). No está en
// NO_FUNDIR: se funden y se hornean, con la casa terminada en su propia versión (archivoHorneado, js/rendimiento.js). Si
// la obra se acaba con la sala ya cargada, salen sin hornear (.sin-hornear) hasta volver a cargarla.
AFRAME.registerComponent('casa-muebles', {
  init() {
    this.hecho = false;
    this.poner = () => {
      if (this.hecho || Math.min(CASA_OBRAS, partida.estado.obra || 0) < CASA_OBRAS) return;
      this.hecho = true;
      if (this.el.closest('[incluir]')?.hasLoaded && this.cargada) this.el.classList.add('sin-hornear');
      this.montar();
    };
    this.poner();
    this.cargada = true;
    document.addEventListener('partida-cambia', this.poner);
  },
  montar() {
    const g = new THREE.Group();
    const caja = (w, h, d, x, y, z, color) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), colorCasa(color)); m.position.set(x, y, z); g.add(m); };
    const cilindro = (r, h, x, y, z, color, seg) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), colorCasa(color)); m.position.set(x, y, z); g.add(m); };
    // la alfombra y, en la mesa, platos, jarra y una vela
    const { x: MX, z: MZ } = CASA_MESA;
    caja(2.4, 0.02, 2.0, MX, 0.035, MZ + 0.1, '#6e2f2a');
    for (const [dx, dz] of [[-0.5, 0.2], [0, 0.2], [0.5, 0.2], [-0.25, -0.22], [0.25, -0.22]]) cilindro(0.11, 0.015, MX + dx, 0.79, MZ + dz, '#a89e8b', 14);
    cilindro(0.07, 0.2, MX + 0.15, 0.88, MZ, '#5c3a22', 10);
    cilindro(0.025, 0.14, MX - 0.2, 0.85, MZ, '#d8cdb4', 8);
    this.el.setObject3D('mesh', g);
    // los muebles de Blender
    const mueble = (nombre, x, y, z, giro = 0) => {
      const e = document.createElement('a-entity');
      e.setAttribute('gltf-model', `url(modelos/mueble-${nombre}.glb)`);
      e.setAttribute('position', `${x} ${y} ${z}`);
      e.setAttribute('rotation', `0 ${giro} 0`);
      this.el.appendChild(e);
    };
    // la chimenea, contra la pared del oeste (a 1 cm), mirando al salón; el fuego, en casa-obra
    mueble('chimenea', -3.19, 0, 0, 90);
    mueble('mesa', MX, 0, MZ);
    mueble('banco', MX, 0, MZ - 0.75);
    mueble('banco', MX, 0, MZ + 0.75);
    mueble('cama', 2.675, 0, -1.15);
    mueble('arcon', 1.4, 0, -1.95);
    mueble('estante', 1.9, 1.25, -2.065);
  },
  remove() {
    document.removeEventListener('partida-cambia', this.poner);
    const g = this.el.getObject3D('mesh');
    if (g) { g.traverse(o => { if (o.isMesh) o.geometry.dispose(); }); this.el.removeObject3D('mesh'); }
  }
});

AFRAME.registerComponent('casa-obra', {
  init() {
    this.g = new THREE.Group();
    this.el.setObject3D('mesh', this.g);
    this.extras = [];
    this.suelos = [];
    this.quitar = null; this.ojo = new THREE.Vector3();
    const p = this.el.object3D.position;
    this.O = { x: p.x, z: p.z };
    // el banco de obra, en la habitación: al apuntarlo y apretar el gatillo, se habla de la obra
    cajaDeRayo(this.el, CASA_BANCO.x, 0.6, CASA_BANCO.z, 2.2, 1.2, 1.2, () => { if (this.quitar) this.cerrar(); else this.hablar(); });
    // (con la casa terminada ya no hay banco: el sitio no dice nada, que al pasar por la habitación repetía el aviso)
    this.el.querySelector('.clicable').addEventListener('mouseenter', () => { if (this.fase() < CASA_OBRAS) partida.avisar('Aprieta el gatillo para ver la obra.'); });
    this.puertas();
    this.montar();
  },
  fase() { return Math.min(CASA_OBRAS, partida.estado.obra || 0); },

  // --- dibujo: todo se rehace al cambiar de fase ---
  caja(w, h, d, x, y, z, color, rx = 0, ry = 0, rz = 0, padre = this.g) {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), colorCasa(color));
    m.position.set(x, y, z); m.rotation.set(rx, ry, rz);
    padre.add(m);
    return m;
  },
  cilindro(r, h, x, y, z, color, rz = 0, seg = 10) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), colorCasa(color));
    m.position.set(x, y, z); m.rotation.z = rz;
    this.g.add(m);
    return m;
  },
  // Algo que no se atraviesa, en coordenadas de la casa (se quita al rehacer)
  macizo(x0, x1, z0, z1, y) {
    const s = { x0: this.O.x + x0, x1: this.O.x + x1, z0: this.O.z + z0, z1: this.O.z + z1, y, macizo: true };
    SUPERFICIES.push(s); this.suelos.push(s);
  },
  entidad(html, x, y, z, ry = 0) {
    const e = document.createElement('a-entity');
    for (const [k, v] of Object.entries(html)) e.setAttribute(k, v);
    e.setAttribute('position', `${x} ${y} ${z}`); e.setAttribute('rotation', `0 ${ry} 0`);
    this.el.appendChild(e); this.extras.push(e);
    return e;
  },
  limpiar() {
    for (const m of [...this.g.children]) { this.g.remove(m); m.geometry?.dispose(); }
    for (const e of this.extras) e.remove();
    this.extras = [];
    for (const s of this.suelos) { const i = SUPERFICIES.indexOf(s); if (i >= 0) SUPERFICIES.splice(i, 1); }
    this.suelos = [];
  },
  montar() {
    const fase = this.fase();
    this.limpiar();
    this.ruina(fase);
    if (fase < 3) this.banco();
    if (fase === 2) this.vacia();
    if (fase === 3) this.amueblada();
    // (solo hasta la cena: después, Leonor y Garcés están en su casa)
    if (fase === 3 && partida.estado.mision === 'casa' && !partida.estado.hechas.includes('casa')) this.prepararCena();
  },

  // Lo roto de dentro, que va desapareciendo: escombros y maleza por el suelo, una viga caída y tablas colgando del
  // techo, y agujeros en las paredes (que en la primera obra se tapan con tablas nuevas)
  ruina(fase) {
    const { H } = CASA, azar = semillaCasa(77), techo = H - 0.04;
    // por el suelo, sin tapar la entrada, el vano del tabique ni el banco
    const libre = (x, z) => !(x > -2.1 && x < -0.6 && z > 0.9) && !(x > 0.1 && x < 1.1 && Math.abs(z) < 0.8) && !(x > 0.6 && x < 3.1 && z > 0.05 && z < 2.0) && Math.abs(x - 0.6) > 0.3;
    const dentro = () => { for (;;) { const x = (azar() - 0.5) * 6.0, z = (azar() - 0.5) * 4.0; if (libre(x, z)) return [x, z]; } };
    for (let i = 0; i < CASA_ESCOMBROS[fase]; i++) {
      const [x, z] = dentro(), tipo = i % 3;
      if (tipo === 0) this.caja(0.7 + azar() * 0.6, 0.06, 0.15, x, 0.06, z, '#4a3a22', 0, azar() * 3, (azar() - 0.5) * 0.2);
      else if (tipo === 1) this.caja(0.3, 0.2, 0.26, x, 0.1, z, '#8a857a', azar() * 0.5, azar() * 3, azar() * 0.5);
      else this.caja(0.7, 0.12, 0.5, x, 0.07, z, '#6b5a35', 0, azar() * 3, 0);   // paja caída del tejado viejo
    }
    for (let i = 0; i < CASA_MALEZA[fase]; i++) {
      const [x, z] = dentro(), alto = 0.25 + azar() * 0.5;
      this.caja(0.04, alto, 0.04, x, alto / 2, z, i % 2 ? '#4f6a34' : '#5c7a3b', (azar() - 0.5) * 0.4, 0, (azar() - 0.5) * 0.4);
    }
    if (fase === 0) {
      // la viga caída en el salón: un extremo en el suelo y el otro aún en la pared del oeste, y el hueco que dejó arriba
      const a = [-3.05, 2.45], b = [-0.9, 0.12], largo = Math.hypot(b[0] - a[0], b[1] - a[1]);
      this.caja(largo, 0.2, 0.2, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, -0.7, '#4a3424', 0, 0, Math.atan2(b[1] - a[1], b[0] - a[0]));
      this.caja(1.8, 0.03, 0.9, -2.1, techo, -0.7, '#1e1813');
      // en la habitación, dos tablas del techo descolgadas
      this.caja(1.3, 0.04, 0.24, 2.2, 2.25, -0.5, '#5a4a30', 0, 0.3, 0.55);
      this.caja(1.1, 0.04, 0.24, 2.5, 2.35, -1.1, '#5a4a30', 0, -0.2, -0.45);
      this.caja(1.0, 0.03, 0.7, 2.3, techo, -0.8, '#1e1813');
    } else if (fase === 1) {
      // los huecos del techo, tapados con tablas nuevas
      this.caja(1.8, 0.03, 0.9, -2.1, techo, -0.7, '#a08a66');
      this.caja(1.0, 0.03, 0.7, 2.3, techo, -0.8, '#a08a66');
    }
    // las paredes por dentro (a 2 cm de su cara): agujeros oscuros en la ruina, tablas nuevas después de la primera obra
    if (fase <= 1) {
      const c = fase === 0 ? '#1e1813' : '#a08a66', zf = CASA.F / 2 - 0.15 - 0.02, xo = CASA.A / 2 - 0.15 - 0.02;
      this.caja(0.5, 0.6, 0.02, -2.75, 1.3, zf, c);
      this.caja(0.02, 0.55, 0.7, xo, 1.4, -1.0, c);
      this.caja(0.02, 0.6, 0.6, -xo, 1.5, 1.5, c);
    }
  },

  // Las puertas, que se abren y se cierran con el gatillo (el componente puerta, js/objetos.js): la de la calle, hacia
  // dentro, y la de la habitación, en el vano del tabique, hacia el salón. Las hojas (modelos/puerta.glb, como la de tu
  // habitación de la posada) van a lo largo de su +x desde la bisagra. Empiezan cerradas.
  // Se hacen una vez (no con cada fase: si no, al reparar se cerrarían contigo dentro).
  puertas() {
    const zc = CASA.F / 2;
    this.puertasCasa = [
      // la de la calle: bisagra en la jamba de la izquierda (mirando desde fuera), en medio del muro, sin girar: así la
      // cara de la aldaba da a la calle
      this.puerta({ x: -1.9, z: zc - 0.15, giro: 0, abre: 100, ancho: 1.0,
        cerrada: [-1.9, -0.9, zc - 0.5, zc + 0.3], abierta: [-2.2, -1.8, zc - 1.2, zc - 0.15] }),
      // la de la habitación: bisagra al sur del vano, la hoja hacia el norte; abierta, contra el tabique del salón
      this.puerta({ x: 0.6, z: 0.45, giro: 90, abre: 100, ancho: 0.9,
        cerrada: [0.4, 0.8, -0.45, 0.45], abierta: [-0.35, 0.5, 0.4, 0.75] }),
    ];
  },
  puerta({ x, z, giro: g, abre, ancho, cerrada: c, abierta: a }) {
    const O = this.O;
    const giro = document.createElement('a-entity');
    giro.setAttribute('position', `${x} 0.02 ${z}`);
    giro.setAttribute('rotation', `0 ${g} 0`);
    const hoja = document.createElement('a-entity');
    hoja.setAttribute('puerta', `abierta: ${abre}`);
    const modelo = document.createElement('a-entity');
    // la misma hoja que la de tu habitación de la posada (modelos/puerta.glb, de 0,9 × 2,05), escalada igual que allí;
    // los huecos se hicieron a su medida (estirar la ancha deformaba la aldaba y la tapaba con las tablas)
    modelo.setAttribute('gltf-model', 'url(modelos/puerta.glb)');
    modelo.setAttribute('scale', `${(ancho / 0.9).toFixed(3)} 1.024 1`);
    hoja.appendChild(modelo);
    const caja = document.createElement('a-box');
    caja.classList.add('clicable');
    caja.setAttribute('position', `${ancho / 2} 1.04 0`); caja.setAttribute('width', ancho); caja.setAttribute('height', 2.08); caja.setAttribute('depth', 0.1);
    caja.setAttribute('material', 'visible: false');
    hoja.appendChild(caja);
    giro.appendChild(hoja); this.el.appendChild(giro);
    const sup = ([x0, x1, z0, z1], y) => ({ x0: O.x + x0, x1: O.x + x1, z0: O.z + z0, z1: O.z + z1, y, macizo: true });
    const cerrada = sup(c, 4), abierta = sup(a, 2);
    SUPERFICIES.push(cerrada);
    // (después del de puerta, que ya ha cambiado "abierta")
    hoja.addEventListener('mousedown', () => setTimeout(() => {
      for (const k of [cerrada, abierta]) { const n = SUPERFICIES.indexOf(k); if (n >= 0) SUPERFICIES.splice(n, 1); }
      SUPERFICIES.push(hoja.components.puerta?.abierta ? abierta : cerrada);
    }));
    return { giro, cerrada, abierta };
  },

  // El banco de obra, con sus herramientas y las cargas que quedan por poner, y el rombo del tutorial
  banco() {
    const { x, z } = CASA_BANCO;
    for (const dx of [-0.8, 0.8]) for (const dz of [-0.25, 0.25]) this.caja(0.08, 0.8, 0.08, x + dx, 0.4, z + dz, '#3a281a', 0, 0, dx * 0.08);
    this.caja(2.0, 0.07, 0.8, x, 0.83, z, '#6e5236');
    this.caja(0.08, 0.06, 0.4, x + 0.3, 0.9, z, '#6e5236');   // el martillo
    this.caja(0.2, 0.08, 0.1, x + 0.3, 0.97, z + 0.15, '#4a4640');
    this.caja(0.7, 0.05, 0.12, x - 0.5, 0.89, z + 0.1, '#8a8478');   // la sierra
    for (const [dx, dy] of [[-0.6, 0.18], [-0.6, 0.5], [-0.3, 0.18]]) this.cilindro(0.16, 1.1, x + dx, dy, z - 0.85, '#6e4a2c', Math.PI / 2);
    this.caja(0.6, 0.35, 0.45, x + 0.7, 0.175, z - 0.85, '#8a857a');
    this.macizo(x - 1.05, x + 1.05, z - 1.15, z + 0.45, 1);
    this.entidad({ 'marca-paso': 'quien: obra; y: 1.5' }, x, 0, z);
  },

  // Segunda fase: abierta, vacía y polvorienta
  vacia() {
    this.caja(0.6, 0.6, 0.6, -2.7, 0.3, -1.7, '#5e4630'); this.caja(0.5, 0.5, 0.5, -2.7, 0.85, -1.7, '#6e5236', 0, 0.4, 0);
    this.cilindro(0.3, 0.9, -2.4, 0.45, -0.6, '#4e3421', 0, 12);
    this.caja(0.45, 0.04, 0.35, 1.5, 0.05, 1.4, '#4a3a22', 0, 0.5, 0);   // una tabla suelta
    this.caja(1.0, 0.04, 0.6, 2.4, 0.04, -1.0, '#3a3228');   // jergón viejo
    this.macizo(-3.05, -2.35, -2.0, -1.4, 1.1);
    this.macizo(-2.7, -2.1, -0.9, -0.3, 0.9);
  },

  // Tercera fase: el salón comedor (chimenea, mesa con bancos, alfombra, lámpara) y la habitación (cama, cofre, estante)
  amueblada() {
    // lo que se mueve o alumbra (lo fijo, chimenea, mesa, bancos, cama, arcón y estante, está en casa-muebles)
    this.entidad({ hoguera: 'intensidad: 1.2' }, -2.85, 0.06, 0);
    this.entidad({ 'lampara-rueda': 'radio: 0.45; velas: 6; techo: 0.8' }, CASA_MESA.x, 2.0, CASA_MESA.z);
    this.entidad({ antorcha: 'intensidad: 1' }, -0.4, 1.9, 2.2, 180);
    // tu cama: desde la cena, se duerme aquí (cama-dormir, js/posada.js)
    this.entidad({ 'cama-dormir': 'casa: true', 'marca-paso': 'quien: cama-casa; y: 1.2' }, 2.675, 0, -1.15);
    // lo que no se atraviesa: la chimenea, la mesa con sus bancos, la cama y el arcón
    this.macizo(-3.2, -2.35, -1.2, 1.2, 3);
    this.macizo(CASA_MESA.x - 0.85, CASA_MESA.x + 0.85, -2.25, CASA_MESA.z + 0.92, 0.9);
    this.macizo(2.15, 3.2, -2.2, -0.1, 0.6);
    this.macizo(0.95, 1.85, -2.2, -1.7, 0.5);
  },

  // --- la cena del final: Leonor y Garcés esperan junto a la mesa; al apuntarla y apretar el gatillo, te sientas ---
  prepararCena() {
    // sentados en el banco del fondo, de cara a ti (que te sientas en el de delante). Los modelos sentados no bajan: se
    // ponen CASA_SENTADO_BAJA más abajo, con la cadera a la altura del banco (herramientas/modelar-leonor.py y -novio.py)
    this.garces = this.entidad({ 'persona-animada': 'modelo: novio; macizo: false; reposo: sentado' }, -1.65, -CASA_SENTADO_BAJA, -1.95);
    this.leonor = this.entidad({ 'persona-animada': 'modelo: leonor; macizo: false; reposo: sentado' }, -0.95, -CASA_SENTADO_BAJA, -1.95);
    this.entidad({ 'marca-paso': 'quien: cena; y: 1.3' }, CENA_SILLA.x, 0, CENA_SILLA.z - 0.4);
    cajaDeRayo(this.el, -1.3, 0.8, -1.2, 1.6, 0.3, 0.95, () => { if (!enLaMesa && !cambiandoDeZona) this.sentarse(); });
    const rayo = this.el.lastElementChild;
    this.extras.push(rayo);
    rayo.addEventListener('mouseenter', () => { if (!enLaMesa) partida.avisar('Aprieta el gatillo para sentarte a cenar.'); });
  },
  // la cabeza a (x, z) de la casa, mirando hacia rumbo (radianes; 0 es -z), y los ojos a la altura de sentado
  llevarCabeza(x, z, rumbo, sentado) {
    const rig = document.getElementById('rig').object3D, cam = this.el.sceneEl.camera, d = new THREE.Vector3(), p = new THREE.Vector3();
    if (rumbo !== undefined) {
      cam.getWorldDirection(d);
      rig.rotation.y += rumbo - Math.atan2(-d.x, -d.z);
      rig.updateMatrixWorld(true);
    }
    cam.getWorldPosition(p);
    rig.position.x += this.O.x + x - p.x;
    rig.position.z += this.O.z + z - p.z;
    if (sentado) rig.position.y += ALTURA_SENTADO - p.y;
  },
  sentarse() {
    enLaMesa = true;
    this.llevarCabeza(CENA_SILLA.x, CENA_SILLA.z, 0, true);
    // la charla, en cómic; al brindar, Garcés alza la jarra (y en la noticia, el grito de la boda)
    const brindar = paso => () => {
      if (paso.grito) gritoDeBrindis();
      this.garces.components['persona-animada']?.poner('brindis-sentado', true);
    };
    const guion = { ...COMIC_CENA, pasos: COMIC_CENA.pasos.map(p => p.brindis ? { ...p, hacer: brindar(p) } : p) };
    partida.charlaAbierta = true;
    this.cena = abrirComic(this.el.sceneEl, guion, () => this.levantarse());
  },
  levantarse() {
    if (this.cena) { this.cena(); this.cena = null; }
    partida.charlaAbierta = false;
    enLaMesa = false;   // (la altura la recupera andar-joystick)
    this.llevarCabeza(CENA_SILLA.x + 0.9, CENA_SILLA.z);
    partida.cenarCasa();
  },

  // --- la obra: hablar con el banco, y reparar con una carga de madera y otra de piedra ---
  hablar() {
    const fase = this.fase();
    if (fase >= CASA_OBRAS) return;
    // (en la partida de depuración no hacen falta las cargas: para ver cómo avanza la casa)
    const gratis = partida.depuracion(), tiene = gratis || partida.llevaCarta('madera'), tienePiedra = gratis || partida.llevaCarta('piedra');
    partida.charlaAbierta = true;
    const faltan = [!tiene && 'madera', !tienePiedra && 'piedra'].filter(Boolean);
    const charla = faltan.length ? {
      texto: `${CASA_TEXTOS[fase]} Te falta ${faltan.length === 2 ? 'una carga de madera y otra de piedra' : `una carga de ${faltan[0]}`}. Obra ${fase + 1} de ${CASA_OBRAS}.`,
      opciones: [{ texto: 'Volveré' }],
    } : {
      texto: `${CASA_TEXTOS[fase]} ${gratis ? 'En la partida de depuración no hacen falta.' : 'Llevas las dos.'} Obra ${fase + 1} de ${CASA_OBRAS}.`,
      opciones: [{ texto: 'Reparar la casa', hacer: () => this.reparar() }, { texto: 'Ahora no' }],
    };
    this.quitar = tablaDeOpciones(this.el.sceneEl, sitioDeLectura(this.el.sceneEl), charla, op => {
      this.cerrar();
      if (op.hacer) op.hacer();
    });
  },
  reparar() {
    const e = partida.estado, fase = this.fase();
    if (fase >= CASA_OBRAS || (!partida.depuracion() && (!partida.llevaCarta('madera') || !partida.llevaCarta('piedra')))) return;
    delete e.cartas.madera; delete e.cartas.piedra;
    e.cargas = {};   // (ya puestas en la obra: si luego te ataca el lobo, no vuelven a su sitio)
    e.obra = fase + 1;
    partida.guardar();
    this.cambiarDeFase();
    partida.avisar(CASA_RESULTADOS[fase]);
    // la casa terminada: la cena es de noche. Después del fundido anochece y se vuelve a cargar la zona (ya de noche,
    // y con la casa terminada horneada, casa-terminada)
    if (e.obra >= CASA_OBRAS && e.mision === 'casa') {
      clearTimeout(this.anochece);
      this.anochece = setTimeout(() => {
        const zonas = this.el.sceneEl.components.zonas;
        partida.anochecer();
        if (zonas && zonas.actual && !cambiandoDeZona) zonas.ir(zonas.actual);
      }, CASA_FUNDIDO_MS + 1500);
    }
  },
  // Rehace la casa con un fundido: las piezas de la fase de antes se apartan y se desvanecen mientras las nuevas
  // aparecen, cada una con una copia transparente de su material (los de colorCasa son compartidos)
  cambiarDeFase() {
    this.acabarFundido();
    const viejos = [...this.g.children];
    for (const m of viejos) this.g.remove(m);
    this.montar();
    const nuevos = [...this.g.children], salen = new THREE.Group();
    this.el.object3D.add(salen);
    const transparente = (m, opacidad) => { const c = m.material.clone(); c.transparent = true; c.opacity = opacidad; return c; };
    for (const m of viejos) { m.material = transparente(m, 1); salen.add(m); }
    for (const m of nuevos) { m.userData.material = m.material; m.material = transparente(m, 0); }
    this.fundido = { t: 0, viejos, nuevos, salen };
  },
  pasarFundido(dt) {
    const f = this.fundido;
    f.t += dt;
    const k = Math.min(1, f.t / CASA_FUNDIDO_MS);
    for (const m of f.viejos) m.material.opacity = 1 - k;
    for (const m of f.nuevos) m.material.opacity = k;
    if (k >= 1) this.acabarFundido();
  },
  acabarFundido() {
    const f = this.fundido;
    if (!f) return;
    this.fundido = null;
    for (const m of f.viejos) { m.geometry.dispose(); m.material.dispose(); }
    f.salen.parent?.remove(f.salen);
    for (const m of f.nuevos) { m.material.dispose(); m.material = m.userData.material; }
  },
  cerrar() {
    if (!this.quitar) return;
    this.quitar(); this.quitar = null;
    partida.charlaAbierta = false;
    setTimeout(() => partida.comprobarPaso());
  },
  tick(t, dt) {
    if (this.quitar && seHaAlejado(this.el, this.ojo)) this.cerrar();
    if (this.fundido && dt) this.pasarFundido(Math.min(dt, 100));
  },
  remove() {
    if (this.quitar) { this.quitar(); partida.charlaAbierta = false; this.quitar = null; }
    if (this.cena) { this.cena(); this.cena = null; enLaMesa = false; partida.charlaAbierta = false; }
    clearTimeout(this.anochece);
    this.acabarFundido();
    this.limpiar();
    for (const p of this.puertasCasa || []) {
      for (const sup of [p.cerrada, p.abierta]) { const i = SUPERFICIES.indexOf(sup); if (i >= 0) SUPERFICIES.splice(i, 1); }
      p.giro.remove();
    }
    this.el.removeObject3D('mesh');
  }
});

// La conversación de Leonor en página de cómic (js/comic.js): las tomas, en la entrada de la posada y, la de la casa,
// desde la plaza; Leonor está en 178,9, -102,3 y su cabeza, a 1,6 m.
const LEONOR_CABEZA = [178.9, 1.58, -102.3];
const COMIC_LEONOR = {
  titulo: 'Episodio 2 · Quedarte',
  tomas: {
    general: { desde: [181.4, 1.8, -97.4], mira: [178.9, 1.05, -102.3], fov: 58, cabeza: LEONOR_CABEZA },
    puerta: { desde: [179.6, 1.62, -99.9], mira: [178.3, 1.35, -103.85], fov: 50, cabeza: LEONOR_CABEZA },
    cara: { desde: [178.95, 1.6, -101.1], mira: [178.9, 1.5, -102.3], fov: 34, cabeza: LEONOR_CABEZA },
    medio: { desde: [177.5, 1.45, -100.8], mira: [178.9, 1.3, -102.3], fov: 42, cabeza: LEONOR_CABEZA },
    perfil: { desde: [180.7, 1.5, -101.5], mira: [178.6, 1.45, -102.9], fov: 46, cabeza: LEONOR_CABEZA },   // de perfil, con la puerta detrás
    sonrisa: { desde: [179.3, 1.5, -101.2], mira: [178.9, 1.68, -102.3], fov: 36, cabeza: LEONOR_CABEZA },
  },
  paginas: [
    [
      { x: 0, y: 0, w: 1, h: 0.46, toma: 'general', desde: 0, cartela: 'La mañana después de la boda.', globos: [{ quien: 'ella', texto: 'Me han dicho que te marchas.' }] },
      { x: 0, y: 0.46, w: 0.4, h: 0.54, toma: 'puerta', desde: 1, globos: [{ quien: 'tu', texto: 'Mi camino sigue. Siempre ha sido así.' }] },
      { x: 0.4, y: 0.46, w: 0.6, h: 0.54, toma: 'cara', desde: 1, globos: [{ quien: 'ella', texto: 'Anoche brindamos por ti. ¿Y te vas sin una palabra?' }] },
    ],
    [
      { x: 0, y: 0, w: 0.34, h: 1, toma: 'medio', desde: 2, globos: [{ quien: 'tu', texto: 'No soy hombre de quedarme.' }] },
      { x: 0.34, y: 0, w: 0.66, h: 0.5, toma: 'perfil', desde: 2, globos: [{ quien: 'ella', texto: 'Frente a la posada hay una casa vacía desde hace años. Repárala, y si luego quieres irte, nadie te lo impedirá.' }] },
      { x: 0.34, y: 0.5, w: 0.66, h: 0.5, toma: 'sonrisa', desde: 3, globos: [
        { quien: 'ella', texto: 'Solo te pido eso: madera para el techo y piedra para los muros.' },
        { quien: 'tu', texto: 'Está bien. Veré esa casa.', desde: 4 },
        { quien: 'ella', texto: 'Sígueme, te la enseño.', desde: 4 },
      ] },
    ],
  ],
  pasos: [
    { respuesta: 'Mi camino sigue. Siempre ha sido así.' },
    { respuesta: 'No soy hombre de quedarme.' },
    { respuesta: '(Callas, y lo piensas)' },
    { respuesta: 'Está bien. Veré esa casa.', hacer: () => partida.aceptarCasa() },
    { respuesta: 'Seguirla' },   // (al cerrar, te lleva a la casa: no hace falta volver a hablarle)
  ],
};

// Al cerrar el cómic, ya aceptada la misión, Leonor te lleva a la casa: sale por la puerta de la posada, baja por el
// borde de la plaza (por donde anda la moza, sin el pozo ni los puestos) y se para delante de la puerta de la casa.
// Puntos x z; si te quedas atrás, te espera.
const LEONOR_GUIA = [[178.1, -102.9], [178.1, -106], [171, -113], [171, -125], [156, -136.5], [150.9, -140.6]];
const LEONOR_VELOCIDAD = 1.0, LEONOR_ESPERA = 5, LEONOR_LLEGAS = 6;   // (LLEGAS: a cuánto de la puerta de la casa cuenta que ya has llegado tú solo)   // m/s, y a cuántos metros de ti se para a esperarte
const LEONOR_PASOS_POR_S = 2.2;

// Leonor, la novia de la boda, en la entrada de la posada: el día siguiente a la boda te sale al paso y te convence
// de quedarte, en una página de cómic (COMIC_LEONOR; ya convencido, con una tabla: partida.charlaLeonor). Al cerrar
// la página te lleva hasta la casa (LEONOR_GUIA) y se queda allí. Ese día está; los demás, no.
AFRAME.registerComponent('leonor', {
  init() {
    this.quitar = null; this.ojo = new THREE.Vector3();
    this.guia = -1; this.fase = 0;   // el punto de LEONOR_GUIA al que va (-1: quieta)
    const e = partida.estado;
    const hoy = !e.hechas.includes('casa') && e.bodaVista !== null && e.dia > e.bodaVista && (e.mision !== 'casa' || e.casaDia === e.dia);
    if (!hoy) return;
    this.el.setAttribute('persona-animada', 'modelo: leonor');
    cajaDeRayo(this.el, 0, 0.95, 0, 0.9, 1.9, 0.9, () => { if (this.quitar) this.cerrar(); else if (this.guia >= 0) partida.avisar('Sigue a Leonor: te lleva a la casa.'); else this.hablar(0); });
    this.el.querySelector('.clicable').addEventListener('mouseenter', () => { if (!this.quitar && this.guia < 0) partida.avisar('Aprieta el gatillo para hablar con Leonor.'); });
    this.sigueme = cartelDeTexto(this.el, 'Sígueme, te enseño la casa.', '0 2.05 0');
    this.espera = cartelDeTexto(this.el, '¿Vienes? Es por aquí.', '0 2.05 0');
    // (si se recarga a medio camino, vuelve a la posada y desde allí te lleva otra vez)
    if (e.mision === 'casa' && !e.casaVista) this.guiar();
    // y si ya te la ha enseñado, se queda en la casa, delante de la puerta
    else if (e.mision === 'casa') { const [x, z] = LEONOR_GUIA[LEONOR_GUIA.length - 1]; this.el.object3D.position.set(x, 0, z); this.el.object3D.rotation.y = 0.6; }
  },
  hablar(paso) {
    partida.charlaAbierta = true;
    if (partida.estado.mision !== 'casa') {
      this.el.components['persona-animada']?.poner('reposo');
      this.quitar = abrirComic(this.el.sceneEl, COMIC_LEONOR, () => { this.cerrar(); if (partida.estado.mision === 'casa') this.guiar(); });
      return;
    }
    this.quitar = tablaDeOpciones(this.el.sceneEl, sitioDeLectura(this.el.sceneEl), partida.charlaLeonor(paso), op => {
      this.quitar(); this.quitar = null;
      if (op.hacer) op.hacer();
      if (op.sigue !== undefined) this.hablar(op.sigue); else this.cerrar();
    });
  },
  cerrar() {
    if (this.quitar) { this.quitar(); this.quitar = null; }
    partida.charlaAbierta = false;
    setTimeout(() => partida.comprobarPaso());
  },
  guiar() {
    this.guia = 0;
    this.sigueme.object3D.visible = true;
  },
  tick(t, dt) {
    if (this.quitar && seHaAlejado(this.el, this.ojo)) this.cerrar();
    if (this.guia < 0 || !dt) return;
    dt = Math.min(dt, 50);
    const o = this.el.object3D, persona = this.el.components['persona-animada'];
    this.el.sceneEl.camera.getWorldPosition(this.ojo);
    const aMi = Math.hypot(this.ojo.x - o.position.x, this.ojo.z - o.position.z);
    // si llegas a la casa por tu cuenta, sin esperarla, ya la has visto: Leonor aparece delante de la puerta
    const [fx, fz] = LEONOR_GUIA[LEONOR_GUIA.length - 1];
    if (Math.hypot(this.ojo.x - fx, this.ojo.z - fz) < LEONOR_LLEGAS && aMi > LEONOR_ESPERA) {
      o.position.set(fx, 0, fz);
      this.guia = -1;
      this.sigueme.object3D.visible = this.espera.object3D.visible = false;
      if (persona) persona.poner('reposo');
      o.rotation.y = Math.atan2(this.ojo.x - fx, this.ojo.z - fz);
      partida.verCasa();
      return;
    }
    for (const c of [this.sigueme, this.espera]) if (c.object3D.visible) c.object3D.lookAt(this.ojo.x, c.object3D.getWorldPosition(new THREE.Vector3()).y, this.ojo.z);
    const [x, z] = LEONOR_GUIA[this.guia], dx = x - o.position.x, dz = z - o.position.z, falta = Math.hypot(dx, dz);
    // te espera si te quedas atrás (mirándote) o si estás justo delante
    const espera = !!this.quitar || aMi > LEONOR_ESPERA || aMi < 0.8;   // (y mientras habla contigo, quieta)
    this.espera.object3D.visible = aMi > LEONOR_ESPERA;
    if (this.espera.object3D.visible) this.sigueme.object3D.visible = false;
    const rumbo = espera ? Math.atan2(this.ojo.x - o.position.x, this.ojo.z - o.position.z) : Math.atan2(dx, dz);
    const giro = Math.atan2(Math.sin(rumbo - o.rotation.y), Math.cos(rumbo - o.rotation.y));
    o.rotation.y += giro * Math.min(1, dt / 250);
    if (espera || Math.abs(giro) > 0.7) { if (persona) persona.poner(espera ? 'reposo' : 'andar'); o.position.y = 0; return; }
    if (persona) persona.poner('andar');
    const paso = LEONOR_VELOCIDAD * dt / 1000;
    if (falta > paso) {
      o.position.x += dx / falta * paso; o.position.z += dz / falta * paso;
      this.fase += dt / 1000 * LEONOR_PASOS_POR_S * Math.PI;
      o.position.y = 0.012 * Math.abs(Math.sin(this.fase));
      return;
    }
    o.position.set(x, 0, z);
    if (++this.guia < LEONOR_GUIA.length) return;
    // ya en la casa: se vuelve hacia ti y te la enseña
    this.guia = -1;
    this.sigueme.object3D.visible = this.espera.object3D.visible = false;
    if (persona) persona.poner('reposo');
    o.rotation.y = Math.atan2(this.ojo.x - o.position.x, this.ojo.z - o.position.z);
    partida.verCasa();
  },
  remove() { if (this.quitar) { this.quitar(); partida.charlaAbierta = false; } this.quitar = null; this.sigueme = this.espera = null; }
});
