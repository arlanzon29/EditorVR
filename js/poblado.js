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

// Casa de planta rectangular: zócalo de piedra, paredes encaladas con vigas vistas, puerta, ventanas
// con postigos y tejado de paja a dos aguas. Mira hacia +z local; el origen, en el centro, en el suelo.
AFRAME.registerComponent('casa', {
  schema: { ancho: { default: 6 }, fondo: { default: 5 }, alto: { default: 2.8 }, cal: { default: '#c9b998' }, techo: { default: '#6e5c33' } },
  init() {
    const { ancho: A, fondo: F, alto: H, cal, techo } = this.data, MADERA = '#3a2a1b';
    const el = this.el, c = (x, y, z, w, h, d, attrs) => piezaCaja(el, x, y, z, w, h, d, attrs);
    // (el zócalo sigue 1,5 m bajo tierra: en una cuesta, la casa no queda en el aire)
    c(0, -0.45, 0, A + 0.1, 2.1, F + 0.1, { 'piedra-mundo': 'tono: #b5ab98' });
    c(0, 0.6 + (H - 0.6) / 2, 0, A, H - 0.6, F, { color: cal });
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
