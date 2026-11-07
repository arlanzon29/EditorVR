// Editor VR: tu casa del poblado (salas/casa.html), frente a la posada. Empieza en ruinas y se repara en tres obras, cada
// una con una carga de madera y otra de piedra (las cartas de los oficios, js/oficios.js). Cuatro fases, guardadas en
// partida.estado.obra: 0 ruina, 1 y 2 avances de la obra, 3 la casa terminada (con sus muebles y el fuego).
//   0 y 1: la puerta está clavada y no se entra.   2: se entra, pero está vacía.   3: amueblada.
// Lo que cambia con la obra (tejado, puerta, escombros, muebles) lo dibuja este componente, y va en NO_FUNDIR
// (rendimiento.js): así reparar no obliga a hornear el poblado. Lo fijo (muros, suelo, techo y tabique) está en el HTML.
// Origen: el centro de la casa, en el suelo. Planta de 7 × 5 m, con la puerta en la cara +z, a x = -1,4. Sin girar.

const CASA = { A: 7, F: 5, H: 2.8, V: 0.35, P: 1.9 };   // ancho, fondo, alto de los muros, vuelo del tejado y altura del tejado
const CASA_OBRAS = 3;
// El tejado, en seis tramos por lado, de delante (+z) a atrás. f falta, v paja vieja, n paja nueva
const CASA_TEJADO = [
  { o: [['v', 'f', 'f', 'f', 'v', 'f'], ['f', 'v', 'f', 'f', 'f', 'f']] },
  { o: [['n', 'n', 'n', 'f', 'f', 'v'], ['n', 'n', 'n', 'v', 'f', 'f']] },
  { o: [['n', 'n', 'n', 'n', 'n', 'n'], ['n', 'n', 'n', 'n', 'n', 'n']] },
  { o: [['n', 'n', 'n', 'n', 'n', 'n'], ['n', 'n', 'n', 'n', 'n', 'n']] },
];
const CASA_ESCOMBROS = [14, 8, 3, 0], CASA_MALEZA = [18, 11, 4, 0];
const CASA_TEXTOS = [
  'La casa lleva años abandonada: el techo caído y la puerta clavada. Para empezar a repararla hace falta una carga de madera y otra de piedra.',
  'Ya hay medio tejado. Para seguir con la obra hace falta otra carga de madera y otra de piedra.',
  'Falta lo último: rematar el tejado y arreglar la puerta. Una carga de madera y otra de piedra.',
];
const CASA_RESULTADOS = [
  'Levantas el armazón del tejado y tapas lo peor. La casa empieza a tener cara de casa.',
  'Rematas el tejado y arreglas la puerta: ya se puede entrar. Falta darle vida.',
  'Colocas los últimos muebles y enciendes el fuego. Tu casa está terminada.',
];

// La cena del final (episodio2.md): sentado en tu salón, con Leonor y Garcés de pie al otro lado de la mesa. Las frases
// van saliendo solas, como en la boda (js/boda.js); en la tercera, la noticia.
const CENA_SILLA = { x: -1.2, z: 1.6 };   // en coordenadas de la casa: el extremo de la mesa que da a la puerta
const CENA_FRASE_MS = 7000, CENA_NOTICIA = 2;
const FRASES_CENA = [
  'Garcés alza la jarra: «Por la casa nueva, y por quien la ha levantado con sus manos».',
  'Leonor sonríe: «Te dije que te quedarías. Y nosotros tenemos algo que contarte».',
  'Leonor le coge la mano a Garcés: «Estoy esperando un niño». Garcés: «Queremos que lo veas crecer».',
  'Por primera vez en mucho tiempo, sientes que tienes un sitio. Es un momento de felicidad.',
];

const matCasa = {};
const colorCasa = c => matCasa[c] || (matCasa[c] = new THREE.MeshStandardMaterial({ color: c, roughness: 1, flatShading: true }));
function semillaCasa(s) { return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }

AFRAME.registerComponent('casa-obra', {
  init() {
    this.g = new THREE.Group();
    this.el.setObject3D('mesh', this.g);
    this.extras = [];
    this.suelos = [];
    this.quitar = null; this.ojo = new THREE.Vector3();
    const p = this.el.object3D.position;
    this.O = { x: p.x, z: p.z };
    // el hueco de la puerta, cerrado hasta la segunda obra (como el de la puerta de tu habitación)
    this.cierre = { x0: p.x - 2.15, x1: p.x - 0.65, z0: p.z + 2.0, z1: p.z + 2.7, y: 4, macizo: true };
    SUPERFICIES.push(this.cierre);
    // el banco de obra, a la derecha de la puerta: al apuntarlo y apretar el gatillo, se habla de la obra
    cajaDeRayo(this.el, 1.9, 0.6, 3.3, 2.2, 1.2, 1.2, () => { if (this.quitar) this.cerrar(); else this.hablar(); });
    this.el.querySelector('.clicable').addEventListener('mouseenter', () => partida.avisar(this.fase() < CASA_OBRAS ? 'Aprieta el gatillo para ver la obra.' : 'Tu casa está terminada.'));
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
    this.cierre.y = fase >= 2 ? 0 : 4;
    this.tejado(fase);
    this.entorno(fase);
    this.puerta(fase);
    if (fase < 3) this.banco();
    if (fase === 2) this.vacia();
    if (fase === 3) this.amueblada();
    if (fase === 3 && partida.estado.mision === 'casa') this.prepararCena();
  },

  // El tejado a dos aguas, con el caballete a lo largo de z, y los hastiales de delante y de atrás
  tejado(fase) {
    const { A, F, H, V, P } = CASA, pendiente = Math.atan2(P, A / 2 + V), L = Math.hypot(A / 2 + V, P), tramos = 6;
    const fondo = F + 2 * V, seg = fondo / tramos, y0 = H + 0.05;
    const paja = { v: '#5a4a2a', n: '#8d7a45' };
    for (let lado = 0; lado < 2; lado++) {
      const s = lado === 0 ? -1 : 1;
      for (let k = 0; k < tramos; k++) {
        const z = F / 2 + V - seg * (k + 0.5), estado = CASA_TEJADO[fase].o[lado][k];
        const cx = s * (A / 2 + V) / 2, cy = y0 + P / 2;
        if (estado === 'f') {
          // una tabla tirada en el suelo, de cuando se cayó el tramo; sin cabrios en la mitad
          if (fase === 0 && (k + lado) % 2 === 0) this.caja(L * 0.45, 0.08, seg * 0.8, s * (A / 2 + 0.9), 0.35, z, '#4a3a22', 0, 0.3, -s * 0.5);
          continue;
        }
        this.caja(L, 0.14, seg * 0.98, cx, cy, z, paja[estado], 0, 0, -s * pendiente);
      }
      // los cabrios: uno en cada junta, y en la ruina faltan algunos
      for (let k = 0; k <= tramos; k++) {
        if (fase === 0 && (k + lado) % 3 === 1) continue;
        this.caja(L, 0.1, 0.1, s * (A / 2 + V) / 2, y0 + P / 2 - 0.1, F / 2 + V - seg * k, '#3a2a1b', 0, 0, -s * pendiente);
      }
    }
    // el caballete, entero salvo en la ruina
    const largo = fase === 0 ? fondo * 0.55 : fondo;
    this.caja(0.14, 0.14, largo, 0, y0 + P - 0.04, F / 2 + V - largo / 2, '#3a2a1b');
    // los hastiales: madera hasta el tejado, con un hueco oscuro en la ruina
    for (const z of [F / 2 - 0.15, -(F / 2 - 0.15)]) {
      const forma = new THREE.Shape();
      forma.moveTo(-A / 2, 0); forma.lineTo(A / 2, 0); forma.lineTo(A / 2, 0.17); forma.lineTo(0, P); forma.lineTo(-A / 2, 0.17);
      const geo = new THREE.ExtrudeGeometry(forma, { depth: 0.3, bevelEnabled: false });
      geo.translate(0, H, z - 0.15);
      geo.computeVertexNormals();
      const m = new THREE.Mesh(geo, colorCasa('#a6937a'));
      this.g.add(m);
      if (fase < 2) this.caja(1.2, 0.8, 0.04, z > 0 ? 0.6 : -0.9, H + 0.6, z + (z > 0 ? 0.17 : -0.17), '#1e1813');
    }
  },

  // Escombros y maleza alrededor, que van desapareciendo, y los parches de los muros
  entorno(fase) {
    const { A, F } = CASA, azar = semillaCasa(77);
    const libre = (x, z) => !(x > -2.6 && x < -0.2 && z > 2.4 && z < 4.2) && !(x > 0.6 && x < 3.4 && z > 2.6 && z < 4.2);
    const cerca = () => {
      for (;;) {
        const lado = Math.floor(azar() * 4), d = 0.5 + azar() * 1.3, t = (azar() - 0.5) * 2;
        const x = lado < 2 ? t * (A / 2 + 0.6) : (lado === 2 ? -1 : 1) * (A / 2 + d), z = lado < 2 ? (lado === 0 ? 1 : -1) * (F / 2 + d) : t * (F / 2 + 0.6);
        if (libre(x, z)) return [x, z];
      }
    };
    for (let i = 0; i < CASA_ESCOMBROS[fase]; i++) {
      const [x, z] = cerca(), tipo = i % 3;
      if (tipo === 0) this.caja(0.9 + azar() * 0.8, 0.07, 0.16, x, 0.06, z, '#4a3a22', 0, azar() * 3, (azar() - 0.5) * 0.3);
      else if (tipo === 1) this.caja(0.35, 0.22, 0.3, x, 0.11, z, '#8a857a', azar(), azar() * 3, azar());
      else this.caja(0.8, 0.2, 0.6, x, 0.1, z, '#6b5a35', 0, azar() * 3, 0);
    }
    for (let i = 0; i < CASA_MALEZA[fase]; i++) {
      const [x, z] = cerca(), alto = 0.4 + azar() * 0.9;
      this.caja(0.05, alto, 0.05, x, alto / 2, z, i % 2 ? '#4f6a34' : '#5c7a3b', (azar() - 0.5) * 0.4, 0, (azar() - 0.5) * 0.4);
    }
    // parches en la pared de delante: agujeros en la ruina, tablas nuevas después
    if (fase === 0) {
      this.caja(0.7, 0.55, 0.04, 0.4, 1.2, F / 2 + 0.02, '#2a2018');
      this.caja(0.5, 0.7, 0.04, -2.85, 1.3, F / 2 + 0.02, '#2a2018');
      this.caja(0.04, 0.6, 0.8, A / 2 + 0.02, 1.4, 1.2, '#2a2018');
    } else if (fase === 1) {
      this.caja(0.8, 0.6, 0.04, 0.4, 1.2, F / 2 + 0.02, '#a08a66');
      this.caja(0.04, 0.6, 0.9, A / 2 + 0.02, 1.4, 1.2, '#a08a66');
    }
  },

  // Antes de la segunda obra la puerta está clavada con tablas; después, abierta hacia dentro
  puerta(fase) {
    const x = -1.4, zc = CASA.F / 2;
    if (fase < 2) {
      for (const [y, g] of [[0.45, 0.07], [1.05, -0.09], [1.65, 0.05]]) this.caja(1.7, 0.18, 0.06, x, y, zc + 0.07, '#5a4a30', 0, 0, g);
      this.caja(0.16, 2.0, 0.06, x - 0.4, 1.0, zc + 0.13, '#4a3a22', 0, 0, 0.05);
    } else {
      // como la de la taberna, girada media vuelta: la hoja, abierta hacia dentro, contra el lado de la bisagra
      this.entidad({ 'gltf-model': 'url(modelos/puerta-ancha.glb)' }, x + 0.78, 0.02, zc - 0.4, 80);
      this.macizo(x + 0.82, x + 1.12, zc - 1.45, zc - 0.35, 2);
    }
  },

  // El banco de obra, con sus herramientas y las cargas que quedan por poner
  banco() {
    const x = 1.9, z = 3.3;
    for (const dx of [-0.8, 0.8]) for (const dz of [-0.25, 0.25]) this.caja(0.08, 0.8, 0.08, x + dx, 0.4, z + dz, '#3a281a', 0, 0, dx * 0.08);
    this.caja(2.0, 0.07, 0.8, x, 0.83, z, '#6e5236');
    this.caja(0.08, 0.06, 0.4, x + 0.3, 0.9, z, '#6e5236');   // el martillo
    this.caja(0.2, 0.08, 0.1, x + 0.3, 0.97, z + 0.15, '#4a4640');
    this.caja(0.7, 0.05, 0.12, x - 0.5, 0.89, z + 0.1, '#8a8478');   // la sierra
    for (const [dx, dy] of [[-0.9, 0.18], [-0.9, 0.5], [-0.65, 0.18]]) this.cilindro(0.16, 1.1, x + dx, dy, z + 0.9, '#6e4a2c', Math.PI / 2);
    this.caja(0.8, 0.4, 0.5, x + 1.1, 0.2, z + 0.7, '#8a857a');
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
    const { A, F } = CASA, piedra = '#b8ab96', madera = '#5e4630', oscuro = '#3a281a';
    // chimenea en la pared del oeste, con su fuego
    for (const z of [-0.85, 0.85]) this.caja(0.6, 1.6, 0.5, -2.9, 0.8, z, piedra);
    this.caja(0.7, 0.35, 2.2, -2.85, 1.775, 0, piedra);
    this.caja(0.55, 0.85, 1.9, -2.92, 2.4, 0, '#a39c8e');
    this.caja(0.08, 1.6, 1.2, -3.15, 0.8, 0, '#1e1813');
    this.caja(1.0, 0.06, 2.2, -2.7, 0.03, 0, '#9a907f');
    this.entidad({ hoguera: 'intensidad: 1.2' }, -2.85, 0.06, 0);
    this.macizo(-3.2, -2.35, -1.2, 1.2, 3);
    // alfombra, mesa larga y dos bancos
    this.caja(2.4, 0.02, 3.0, -1.2, 0.035, 0, '#6e2f2a');
    this.caja(0.95, 0.07, 2.4, -1.2, 0.76, 0, madera);
    for (const dz of [-1, 1]) for (const dx of [-0.35, 0.35]) this.caja(0.1, 0.74, 0.1, -1.2 + dx, 0.37, dz * 1.0, oscuro);
    for (const dx of [-0.75, 0.75]) {
      this.caja(0.3, 0.06, 2.2, -1.2 + dx, 0.45, 0, '#4a3424');
      for (const dz of [-0.9, 0.9]) this.caja(0.08, 0.44, 0.08, -1.2 + dx, 0.22, dz, oscuro);
    }
    this.macizo(-2.2, -0.2, -1.25, 1.25, 0.9);
    // en la mesa: platos, jarra y una vela
    for (const [dx, dz] of [[-0.25, -0.6], [0.25, -0.6], [-0.25, 0.1], [0.25, 0.1], [-0.25, 0.8], [0.25, 0.8]]) this.cilindro(0.11, 0.015, -1.2 + dx, 0.8, dz, '#a89e8b', 0, 14);
    this.cilindro(0.07, 0.2, -1.2, 0.9, 0.35, '#5c3a22', 0, 10);
    this.cilindro(0.025, 0.14, -1.2, 0.84, -0.2, '#d8cdb4', 0, 8);
    this.entidad({ 'lampara-rueda': 'radio: 0.45; velas: 6; techo: 0.8' }, -1.2, 2.0, 0);
    this.entidad({ antorcha: 'intensidad: 1' }, -0.4, 1.9, 2.2, 180);
    // la habitación: cama contra la pared del este, cofre a los pies, estante al fondo
    this.caja(0.95, 0.35, 2.0, 2.675, 0.18, -1.15, '#4a3424');
    this.caja(0.85, 0.12, 1.9, 2.675, 0.41, -1.15, '#b7a98a');
    this.caja(0.85, 0.06, 1.2, 2.675, 0.5, -0.85, '#7a3f35');
    this.caja(0.5, 0.1, 0.3, 2.675, 0.52, -1.95, '#d8cdb4');
    this.caja(0.95, 0.5, 0.06, 2.675, 0.55, -2.17, '#3a281a');
    this.macizo(2.15, 3.2, -2.2, -0.1, 0.6);
    this.caja(0.9, 0.45, 0.5, 1.4, 0.225, -1.95, '#4a3424');
    this.caja(0.92, 0.05, 0.52, 1.4, 0.47, -1.95, '#3a281a');
    this.macizo(0.95, 1.85, -2.2, -1.7, 0.5);
    this.caja(1.2, 0.05, 0.25, 1.9, 1.3, -2.05, oscuro);
    for (const [dx, c] of [[-0.4, '#7a5a4a'], [-0.2, '#5a6a4a'], [0.1, '#6a5a3a']]) this.caja(0.14, 0.24, 0.18, 1.9 + dx, 1.45, -2.05, c);
    // fuera: macetero bajo la ventana y una pila de leña
    this.caja(1.1, 0.18, 0.25, 1.9, 1.2, F / 2 + 0.13, '#4a3424');
    for (const dx of [-0.4, -0.15, 0.1, 0.35]) this.caja(0.12, 0.14, 0.12, 1.9 + dx, 1.35, F / 2 + 0.13, ['#a8473f', '#d8b04a', '#8d5aa8', '#d8cdb4'][Math.round((dx + 0.4) / 0.25) % 4]);
    for (const [dz, dy] of [[-0.45, 0.16], [-0.1, 0.16], [0.25, 0.16], [-0.27, 0.46], [0.08, 0.46]]) this.cilindro(0.16, 1.1, A / 2 + 0.6, dy, dz - 0.5, '#6e4a2c', Math.PI / 2);
  },

  // --- la cena del final: Leonor y Garcés esperan junto a la mesa; al apuntarla y apretar el gatillo, te sientas ---
  prepararCena() {
    this.garces = this.entidad({ 'persona-animada': 'modelo: novio; macizo: false' }, -1.55, 0, -1.75);
    this.leonor = this.entidad({ 'persona-animada': 'modelo: novia; macizo: false' }, -0.85, 0, -1.75);
    this.entidad({ 'marca-paso': 'quien: cena; y: 1.3' }, CENA_SILLA.x, 0, CENA_SILLA.z - 0.4);
    cajaDeRayo(this.el, -1.2, 0.8, 0, 1.0, 0.3, 2.4, () => { if (!enLaMesa && !cambiandoDeZona) this.sentarse(); });
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
    this.cena = { frase: 0, ms: 0, acabada: false, tex: [] };
    this.garces.components['persona-animada']?.poner('brindis', true);
    this.ponerFrase();
  },
  levantarse() {
    this.quitarFrase();
    this.cena = null;
    enLaMesa = false;   // (la altura la recupera andar-joystick)
    this.llevarCabeza(CENA_SILLA.x + 0.9, CENA_SILLA.z);
    partida.cenarCasa();
  },
  // La frase que toca, encima de la mesa, y al final el botón de levantarse
  ponerFrase() {
    this.quitarFrase();
    const c = this.cena, tabla = this.tablaCena = document.createElement('a-entity');
    tabla.classList.add('cartel');
    tabla.object3D.position.set(this.O.x + CENA_SILLA.x, 0, this.O.z - 0.3);
    const { malla, tex } = fraseEnTabla(FRASES_CENA[c.frase], 1.3);
    malla.position.y = 1.62 + malla.geometry.parameters.height / 2;
    c.tex = [tex];
    tabla.setObject3D('mesh', malla);
    if (c.acabada) {
      const t = tablaDeTexto('Levantarte', 512, 96), boton = document.createElement('a-entity');
      c.tex.push(t);
      boton.classList.add('clicable', 'cartel');
      boton.setAttribute('position', '0 1.46 0.01');
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.12), new THREE.MeshBasicMaterial({ map: t, depthTest: false, transparent: true, fog: false }));
      m.renderOrder = 995;
      boton.setObject3D('mesh', m);
      boton.addEventListener('mouseenter', () => m.material.color.set('#ffcc33'));
      boton.addEventListener('mouseleave', () => m.material.color.set('#ffffff'));
      let ultimo = performance.now();
      boton.addEventListener('mousedown', () => { if (performance.now() - ultimo > 500) this.levantarse(); ultimo = performance.now(); });
      tabla.appendChild(boton);
    }
    this.el.sceneEl.appendChild(tabla);
  },
  quitarFrase() {
    if (!this.tablaCena) return;
    this.tablaCena.parentNode.removeChild(this.tablaCena);
    this.tablaCena = null;
    for (const t of this.cena?.tex || []) t.dispose();
  },
  pasarFrase(dt) {
    const c = this.cena;
    if (c.acabada) return;
    c.ms += Math.min(dt, 100);
    if (c.ms < CENA_FRASE_MS) return;
    c.ms = 0; c.frase++;
    if (c.frase === CENA_NOTICIA) {
      gritoDeBrindis();
      this.garces.components['persona-animada']?.poner('brindis', true);
      partida.avisar('¡Un niño! Leonor y Garcés van a tener un hijo.');
    }
    if (c.frase === FRASES_CENA.length - 1) c.acabada = true;
    this.ponerFrase();
  },

  // --- la obra: hablar con el banco, y reparar con una carga de madera y otra de piedra ---
  hablar() {
    const fase = this.fase();
    if (fase >= CASA_OBRAS) { partida.avisar('Tu casa está terminada.'); return; }
    const tiene = partida.llevaCarta('madera'), tienePiedra = partida.llevaCarta('piedra');
    partida.charlaAbierta = true;
    const faltan = [!tiene && 'madera', !tienePiedra && 'piedra'].filter(Boolean);
    const charla = faltan.length ? {
      texto: `${CASA_TEXTOS[fase]} Te falta ${faltan.length === 2 ? 'una carga de madera y otra de piedra' : `una carga de ${faltan[0]}`}. Obra ${fase + 1} de ${CASA_OBRAS}.`,
      opciones: [{ texto: 'Volveré' }],
    } : {
      texto: `${CASA_TEXTOS[fase]} Llevas las dos. Obra ${fase + 1} de ${CASA_OBRAS}.`,
      opciones: [{ texto: 'Reparar la casa', hacer: () => this.reparar() }, { texto: 'Ahora no' }],
    };
    this.quitar = tablaDeOpciones(this.el.sceneEl, sitioDeLectura(this.el.sceneEl), charla, op => {
      this.cerrar();
      if (op.hacer) op.hacer();
    });
  },
  reparar() {
    const e = partida.estado, fase = this.fase();
    if (fase >= CASA_OBRAS || !partida.llevaCarta('madera') || !partida.llevaCarta('piedra')) return;
    delete e.cartas.madera; delete e.cartas.piedra;
    e.cargas = {};   // (ya puestas en la obra: si luego te ataca el lobo, no vuelven a su sitio)
    e.obra = fase + 1;
    partida.guardar();
    this.montar();
    partida.avisar(CASA_RESULTADOS[fase]);
  },
  cerrar() {
    if (!this.quitar) return;
    this.quitar(); this.quitar = null;
    partida.charlaAbierta = false;
    setTimeout(() => partida.comprobarPaso());
  },
  tick(t, dt) {
    if (this.quitar && seHaAlejado(this.el, this.ojo)) this.cerrar();
    if (this.cena && dt) this.pasarFrase(dt);
  },
  remove() {
    if (this.quitar) { this.quitar(); partida.charlaAbierta = false; this.quitar = null; }
    if (this.cena) { this.quitarFrase(); this.cena = null; enLaMesa = false; }
    this.limpiar();
    const i = SUPERFICIES.indexOf(this.cierre); if (i >= 0) SUPERFICIES.splice(i, 1);
    this.el.removeObject3D('mesh');
  }
});

// Leonor, la novia de la boda, en la entrada de la posada: el día siguiente a la boda te sale al paso y te convence
// de quedarte (partida.charlaLeonor). Ese día se queda allí; los demás, no está.
AFRAME.registerComponent('leonor', {
  init() {
    this.quitar = null; this.ojo = new THREE.Vector3();
    const e = partida.estado;
    const hoy = !e.hechas.includes('casa') && e.bodaVista !== null && e.dia > e.bodaVista && (e.mision !== 'casa' || e.casaDia === e.dia);
    if (!hoy) return;
    this.el.setAttribute('persona-animada', 'modelo: novia');
    cajaDeRayo(this.el, 0, 0.95, 0, 0.9, 1.9, 0.9, () => { if (this.quitar) this.cerrar(); else this.hablar(0); });
    this.el.querySelector('.clicable').addEventListener('mouseenter', () => { if (!this.quitar) partida.avisar('Aprieta el gatillo para hablar con Leonor.'); });
  },
  hablar(paso) {
    partida.charlaAbierta = true;
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
  tick() { if (this.quitar && seHaAlejado(this.el, this.ojo)) this.cerrar(); },
  remove() { if (this.quitar) { this.quitar(); partida.charlaAbierta = false; } this.quitar = null; }
});
