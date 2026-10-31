// Editor VR: la posada del poblado (salas/posada.html). El tejado, los clientes (el guardia sentado sin
// armas, con ropa de otro color) y el camarero, con quien se habla: al apuntarle y apretar el gatillo, sale
// lo que dice (partida.charlaCamarero, js/partida.js) en una tabla a su lado, con las respuestas debajo.

const CHARLA_SE_ACABA = 5;   // a esta distancia del camarero, la charla se cierra

// Lo que dice alguien, en tinta clara sobre madera; la tabla se hace del alto que pida el texto
function fraseEnTabla(texto, a) {
  const c = document.createElement('canvas'), W = 900, letra = 44, alto = letra + 14;
  let g = c.getContext('2d');
  g.font = `500 ${letra}px Georgia, serif`;
  const lineas = partirTexto(g, texto, W - 70), H = lineas.length * alto + 44;
  c.width = W; c.height = H;
  g = c.getContext('2d');
  g.fillStyle = '#2e2116'; g.fillRect(0, 0, W, H);
  g.strokeStyle = '#4a4640'; g.lineWidth = 8; g.strokeRect(4, 4, W - 8, H - 8);
  g.font = `500 ${letra}px Georgia, serif`; g.fillStyle = '#e4d3a8'; g.textAlign = 'center'; g.textBaseline = 'middle';
  lineas.forEach((l, i) => g.fillText(l, W / 2, 22 + alto * (i + 0.5) + 2));
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const malla = new THREE.Mesh(new THREE.PlaneGeometry(a, a * H / W), new THREE.MeshBasicMaterial({ map: tex, depthTest: false, transparent: true, fog: false }));
  malla.renderOrder = 995;
  return { malla, tex };
}

// Tejado de paja a dos aguas, con su cumbrera a lo largo de z. Origen: en el centro, al pie del tejado.
AFRAME.registerComponent('tejado', {
  schema: { ancho: { default: 12 }, fondo: { default: 9 }, pico: { default: 2.6 }, vuelo: { default: 0.35 }, color: { default: '#6e5c33' } },
  init() {
    const { ancho, fondo, pico, vuelo, color } = this.data, forma = new THREE.Shape(), medio = ancho / 2 + vuelo;
    forma.moveTo(-medio, 0); forma.lineTo(medio, 0); forma.lineTo(0, pico); forma.lineTo(-medio, 0);
    const geo = new THREE.ExtrudeGeometry(forma, { depth: fondo + 2 * vuelo, bevelEnabled: false }).toNonIndexed();
    geo.translate(0, 0, -(fondo / 2 + vuelo));
    geo.computeVertexNormals();
    this.el.setObject3D('mesh', new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color, roughness: 1, flatShading: true })));
  },
  remove() { this.el.removeObject3D('mesh'); }
});

// Cliente: va junto a guardia="sentado: true; modelo: cliente-sentado" y le pone su ropa. Los materiales
// del modelo salen del guardia: Sobreveste es la túnica y Malla, la camisa y las calzas.
AFRAME.registerComponent('cliente', {
  schema: { tunica: { default: '#4d4436' }, camisa: { default: '#6a6252' } },
  init() {
    this.el.addEventListener('model-loaded', e => {
      e.detail.model.traverse(o => {
        if (!o.isMesh) return;
        const color = /^(Sobreveste|Tunica)/.test(o.material.name) ? this.data.tunica : /^Malla/.test(o.material.name) ? this.data.camisa : null;
        if (color) { o.material = o.material.clone(); o.material.color.set(color); o.material.metalness = 0; o.material.roughness = 1; }
      });
    });
  }
});

// Camarero: va junto a "criado", que lo mueve por detrás del mostrador; aquí, hablar con él.
AFRAME.registerComponent('camarero', {
  init() {
    this.tabla = null;
    this.ojo = new THREE.Vector3();
    // el día de la boda no está aquí: está en la plaza, casándose
    if (partida.bodaHoy()) { this.el.object3D.visible = false; return; }
    const rayo = document.createElement('a-box');
    rayo.classList.add('clicable');
    rayo.setAttribute('position', '0 0.95 0'); rayo.setAttribute('width', 0.9); rayo.setAttribute('height', 1.9); rayo.setAttribute('depth', 0.9);
    rayo.setAttribute('material', 'visible: false');
    this.el.appendChild(rayo);
    this.ultimo = 0;
    rayo.addEventListener('mousedown', () => {
      if (this.tabla || performance.now() - this.ultimo < 500) return;
      this.ultimo = performance.now();
      this.hablar();
    });
  },
  hablar() {
    this.cerrar();
    this.el.components.criado.charlando = true;
    const charla = partida.charlaCamarero(), o = this.el.object3D.position;
    this.el.sceneEl.camera.getWorldPosition(this.ojo);
    // a un lado de él, para que se le siga viendo, y de cara a quien le habla
    const dx = this.ojo.x - o.x, dz = this.ojo.z - o.z, d = Math.hypot(dx, dz) || 1;
    const tabla = this.tabla = document.createElement('a-entity');
    tabla.classList.add('cartel');
    tabla.object3D.position.set(o.x + dz / d * 0.85 + dx / d * 0.1, 0, o.z - dx / d * 0.85 + dz / d * 0.1);
    tabla.object3D.lookAt(this.ojo.x, 0, this.ojo.z);
    this.el.parentEl.appendChild(tabla);
    this.texturas = [];
    tabla.setObject3D('mesh', this.frase(charla.texto));
    charla.opciones.forEach((op, i) => this.respuesta(tabla, op, 1.42 - i * 0.24));
  },
  frase(texto) {
    const { malla, tex } = fraseEnTabla(texto, 1.1);
    this.texturas.push(tex);
    malla.position.y = 1.6 + malla.geometry.parameters.height / 2;
    return malla;
  },
  respuesta(tabla, op, y) {
    const tex = tablaDeTexto(op.texto, 512, 96);
    this.texturas.push(tex);
    const e = document.createElement('a-entity');
    e.classList.add('clicable', 'cartel');
    e.setAttribute('position', `0 ${y} 0.01`);
    const malla = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.15), new THREE.MeshBasicMaterial({ map: tex, depthTest: false, transparent: true, fog: false }));
    malla.renderOrder = 995;
    e.setObject3D('mesh', malla);
    e.addEventListener('mouseenter', () => malla.material.color.set('#ffcc33'));
    e.addEventListener('mouseleave', () => malla.material.color.set('#ffffff'));
    e.addEventListener('mousedown', () => {
      if (performance.now() - this.ultimo < 400) return;
      this.ultimo = performance.now();
      this.cerrar();
      // lo que responde, si la respuesta cambia algo: "Acepto" y "Aquí lo tienes"
      if (op.hacer) { op.hacer(); this.hablar(); }
    });
    tabla.appendChild(e);
  },
  cerrar() {
    if (!this.tabla) return;
    this.tabla.parentNode.removeChild(this.tabla);
    this.tabla = null;
    for (const t of this.texturas) t.dispose();
    this.el.components.criado.charlando = false;
  },
  tick() {
    if (!this.tabla) return;
    this.el.sceneEl.camera.getWorldPosition(this.ojo);
    const o = this.el.object3D.position;
    if (Math.hypot(this.ojo.x - o.x, this.ojo.z - o.z) > CHARLA_SE_ACABA) this.cerrar();
  },
  remove() { this.tabla = null; }
});
