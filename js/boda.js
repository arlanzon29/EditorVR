// Editor VR: la boda del camarero, en la plaza del poblado. Al día siguiente de entregar el pescado sale una
// mesa con el banquete, los novios y los invitados, y una silla libre. Al apuntarla y apretar el gatillo te
// sientas: no se anda, la vista baja a la altura de la mesa y se oyen los brindis hasta que te levantas.
// No se hornea (NO_FUNDIR): solo existe ese día. Cuándo: partida.bodaHoy, en js/partida.js.

const SILLA_BODA = { x: 161, z: -136.05 };   // la silla libre, en el lado norte, frente a los novios
const ALTURA_SENTADO = 1.15;                 // a qué altura quedan los ojos
const BODA_FRASE_MS = 7000;
const FRASES_BODA = [
  'El novio se pone en pie: «Gracias por venir. El pescado de esta mesa lo trajo quien está ahí sentado».',
  'Todos alzan las copas por los novios.',
  'La novia: «Comed y bebed, que hoy nadie se queda con hambre».',
];
// x, z, giro, túnica, camisa. Los del lado sur miran al norte; el novio, en medio, frente a tu silla.
const GENTE_BODA = [
  [160.4, -137.95, 0, '#56683f', '#8a8068'],   // el novio
  [158.6, -137.95, 0, '#4d4436', '#6a6252'],
  [163.4, -137.95, 0, '#5c4a58', '#6a6252'],
  [158, -136.05, 180, '#3f4a5c', '#736b5a'],
  [159.4, -136.05, 180, '#5a4436', '#6d6656'],
  [162.6, -136.05, 180, '#4d5a44', '#7a7262'],
  [164, -136.05, 180, '#6b4a3a', '#6a6252'],
];

AFRAME.registerComponent('boda', {
  init() {
    this.rayo = null; this.tabla = null; this.tex = [];
    if (!partida.bodaHoy()) return;
    this.montar();
  },
  // Una pieza fija: cilindro de la vajilla o caja de la mesa
  vajilla(x, y, z, radio, alto, color) {
    const e = document.createElement('a-cylinder');
    e.setAttribute('position', `${x} ${y} ${z}`); e.setAttribute('radius', radio); e.setAttribute('height', alto); e.setAttribute('segments-radial', 10); e.setAttribute('color', color);
    this.el.appendChild(e);
  },
  montar() {
    const c = (x, y, z, w, h, d, color) => piezaCaja(this.el, x, y, z, w, h, d, { color });
    // la mesa, de tablones con mantel de lino, y sus caballetes
    c(161, 0.74, -137, 8, 0.06, 1, '#5e4630');
    c(161, 0.775, -137, 7.8, 0.01, 0.8, '#b8ab8c');
    for (const x of [157.6, 161, 164.4]) c(x, 0.36, -137, 0.1, 0.72, 0.8, '#3a281a');
    SUPERFICIES.push({ x0: 156.8, x1: 165.2, z0: -137.6, z1: -136.4, y: 1, macizo: true });
    // en cada sitio, un plato y una copa
    for (const [x, z] of [[158.6, -137.3], [160.4, -137.3], [161.6, -137.3], [163.4, -137.3], [158, -136.7], [159.4, -136.7], [161, -136.7], [162.6, -136.7], [164, -136.7]]) {
      this.vajilla(x, 0.79, z, 0.13, 0.015, '#8a7a62');
      this.vajilla(x + 0.2, 0.84, z, 0.04, 0.11, '#6e4a2e');
    }
    // las fuentes, con el pescado asado en medio (el mismo de los bancos), y el pan
    this.mallas = [];
    for (const x of [159.6, 161, 162.4]) {
      this.vajilla(x, 0.795, -137, 0.3, 0.02, '#6a5a44');
      const pez = new THREE.Mesh(formaDePez(), new THREE.MeshBasicMaterial({ vertexColors: true, color: '#a8703a', side: THREE.DoubleSide }));
      pez.position.set(x, 0.86, -137); pez.rotation.y = Math.PI / 2; pez.scale.setScalar(0.6);
      this.el.object3D.add(pez);
      this.mallas.push(pez);
    }
    for (const x of [158.3, 163.7]) this.vajilla(x, 0.83, -137, 0.13, 0.09, '#a07c48');
    // la gente: callada, para que no salgan todos los carteles a la vez
    for (const [x, z, giro, tunica, camisa] of GENTE_BODA) {
      const e = document.createElement('a-entity');
      e.setAttribute('position', `${x} 0 ${z}`); e.setAttribute('rotation', `0 ${giro} 0`);
      e.setAttribute('guardia', 'sentado: true; modelo: cliente-sentado; callado: true');
      e.setAttribute('cliente', { tunica, camisa });
      this.el.appendChild(e);
    }
    // la novia, de pie al otro lado de la mesa: el modelo de la moza (el de los clientes lleva barba), quieta
    const novia = document.createElement('a-entity');
    novia.setAttribute('position', '161.6 0 -138.2');
    novia.setAttribute('criado', 'puntos: 161.6 -138.2 100000; saludo: Gracias por venir.');
    novia.setAttribute('cliente', { tunica: '#a8a088', camisa: '#b8b09a' });
    this.el.appendChild(novia);
    // el cartel y la silla libre
    const cartel = document.createElement('a-entity');
    cartel.setAttribute('position', '155.4 0 -134.6'); cartel.setAttribute('rotation', '0 150 0');
    cartel.setAttribute('cartel-madera', 'texto: La boda');
    this.el.appendChild(cartel);
    const { x, z } = SILLA_BODA;
    c(x, 0.42, z, 0.46, 0.05, 0.42, '#4e3421');
    for (const [dx, dz] of [[-0.18, -0.15], [0.18, -0.15], [-0.18, 0.15], [0.18, 0.15]]) c(x + dx, 0.2, z + dz, 0.05, 0.4, 0.05, '#3a281a');
    c(x, 0.72, z + 0.19, 0.42, 0.56, 0.04, '#4e3421');
    const rayo = this.rayo = document.createElement('a-box');
    rayo.classList.add('clicable');
    rayo.setAttribute('position', `${x} 0.6 ${z}`); rayo.setAttribute('width', 0.7); rayo.setAttribute('height', 1.2); rayo.setAttribute('depth', 0.7);
    rayo.setAttribute('material', 'visible: false');
    rayo.addEventListener('mouseenter', () => { if (!enLaMesa) partida.avisar('Aprieta el gatillo para sentarte a la mesa.'); });
    this.ultimo = 0;
    rayo.addEventListener('mousedown', () => {
      if (enLaMesa || cambiandoDeZona || performance.now() - this.ultimo < 500) return;
      this.ultimo = performance.now();
      this.sentarse();
    });
    this.el.appendChild(rayo);
  },
  // Lleva la cabeza a un sitio (y, si se indica, a mirar hacia "rumbo"), moviendo el rig: en VR la cabeza no está en su centro
  llevarCabeza(x, z, rumbo) {
    const rig = document.getElementById('rig').object3D, cam = this.el.sceneEl.camera, d = new THREE.Vector3(), p = new THREE.Vector3();
    if (rumbo !== undefined) {
      cam.getWorldDirection(d);
      rig.rotation.y += rumbo - Math.atan2(-d.x, -d.z);
      rig.updateMatrixWorld(true);
    }
    cam.getWorldPosition(p);
    rig.position.x += x - p.x;
    rig.position.z += z - p.z;
  },
  sentarse() {
    enLaMesa = true;
    partida.asistirBoda();
    const rig = document.getElementById('rig').object3D, cam = this.el.sceneEl.camera, p = new THREE.Vector3();
    this.llevarCabeza(SILLA_BODA.x, SILLA_BODA.z, 0);
    // la altura: la de tus ojos respecto al rig cuenta, para que dé igual si estás de pie o sentado de verdad
    cam.getWorldPosition(p);
    rig.position.y += ALTURA_SENTADO - p.y;
    this.frase = 0; this.fraseMs = 0;
    this.ponerTabla();
  },
  levantarse() {
    this.quitarTabla();
    enLaMesa = false;   // (la altura la recupera andar-joystick)
    this.llevarCabeza(SILLA_BODA.x, SILLA_BODA.z + 1.2);
  },
  // La frase que toca, encima de los novios, y debajo el botón de levantarse
  ponerTabla() {
    this.quitarTabla();
    const tabla = this.tabla = document.createElement('a-entity');
    tabla.classList.add('cartel');
    tabla.object3D.position.set(SILLA_BODA.x, 0, -137.4);
    const { malla, tex } = fraseEnTabla(FRASES_BODA[this.frase], 1.5);
    malla.position.y = 1.72 + malla.geometry.parameters.height / 2;
    this.tex = [tex];
    tabla.setObject3D('mesh', malla);
    const texBoton = tablaDeTexto('Levantarte', 512, 96);
    this.tex.push(texBoton);
    const boton = document.createElement('a-entity');
    boton.classList.add('clicable', 'cartel');
    boton.setAttribute('position', '0 1.56 0.01');
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.12), new THREE.MeshBasicMaterial({ map: texBoton, depthTest: false, transparent: true, fog: false }));
    m.renderOrder = 995;
    boton.setObject3D('mesh', m);
    boton.addEventListener('mouseenter', () => m.material.color.set('#ffcc33'));
    boton.addEventListener('mouseleave', () => m.material.color.set('#ffffff'));
    boton.addEventListener('mousedown', () => {
      if (performance.now() - this.ultimo < 500) return;
      this.ultimo = performance.now();
      this.levantarse();
    });
    tabla.appendChild(boton);
    this.el.appendChild(tabla);
  },
  quitarTabla() {
    if (!this.tabla) return;
    this.tabla.parentNode.removeChild(this.tabla);
    this.tabla = null;
    for (const t of this.tex) t.dispose();
    this.tex = [];
  },
  tick(t, dt) {
    if (!this.tabla || !dt || this.frase >= FRASES_BODA.length - 1) return;
    this.fraseMs += Math.min(dt, 100);
    if (this.fraseMs < BODA_FRASE_MS) return;
    this.frase++; this.fraseMs = 0;
    this.ponerTabla();
  },
  remove() {
    enLaMesa = false;
    for (const m of this.mallas || []) { m.parent.remove(m); m.geometry.dispose(); m.material.dispose(); }
  }
});
