// Editor VR: agua (lago y mar), embarcaderos y la barca que lleva de uno a otro.

// Agua: un plano azul, con ondas dibujadas en un canvas que se van moviendo.
let texturaAgua = null;
function crearTexturaAgua() {
  const N = 512, c = document.createElement('canvas');
  c.width = c.height = N;
  const g = c.getContext('2d');
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, N, N);
  let s = 3;
  const azar = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 700; i++) {
    const x = azar() * N, y = azar() * N, an = 6 + azar() * 26;
    g.strokeStyle = azar() > 0.5 ? `rgba(255, 255, 255, ${0.3 + azar() * 0.5})` : `rgba(90, 100, 110, ${0.08 + azar() * 0.16})`;
    g.lineWidth = 1 + azar() * 2;
    for (const dx of [0, N, -N]) for (const dy of [0, N, -N]) { g.beginPath(); g.moveTo(x + dx - an, y + dy); g.quadraticCurveTo(x + dx, y + dy - 3, x + dx + an, y + dy); g.stroke(); }
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}
AFRAME.registerComponent('agua', {
  schema: { ancho: { default: 200 }, fondo: { default: 200 }, color: { default: '#3f6f8c' }, opacidad: { default: 0.85 }, metros: { default: 14 } },
  init() {
    const { ancho, fondo, color, opacidad, metros } = this.data;
    texturaAgua = texturaAgua || crearTexturaAgua();
    this.tex = texturaAgua.clone();
    this.tex.needsUpdate = true;
    this.tex.repeat.set(ancho / metros, fondo / metros);
    const malla = new THREE.Mesh(new THREE.PlaneGeometry(ancho, fondo),
      new THREE.MeshBasicMaterial({ map: this.tex, color, transparent: opacidad < 1, opacity: opacidad, depthWrite: opacidad >= 1 }));
    malla.rotation.x = -Math.PI / 2;
    this.el.setObject3D('mesh', malla);
  },
  tick(t) { this.tex.offset.set(t * 0.00002, t * 0.00004); },
  remove() { this.el.removeObject3D('mesh'); }
});

// Embarcadero de tablas sobre pilotes: va de (x0, z0), en la orilla, a (x1, z1), mar adentro, a lo
// largo de un eje. Se pisa (va en SUPERFICIES) y por él se anda sobre el agua.
AFRAME.registerComponent('embarcadero', {
  schema: { x0: { default: 0 }, z0: { default: 0 }, x1: { default: 0 }, z1: { default: 0 }, alto: { default: 0.25 }, ancho: { default: 2 } },
  init() {
    const { x0, z0, x1, z1, alto, ancho } = this.data, largo = Math.hypot(x1 - x0, z1 - z0), ux = (x1 - x0) / largo, uz = (z1 - z0) / largo;
    const caja = (x, y, z, w, h, d, color) => {
      const e = document.createElement('a-box');
      e.setAttribute('position', `${x} ${y} ${z}`); e.setAttribute('width', w); e.setAttribute('height', h); e.setAttribute('depth', d); e.setAttribute('color', color);
      this.el.appendChild(e);
    };
    const n = Math.round(largo / 0.3);
    for (let i = 0; i < n; i++) {
      const x = x0 + ux * (i + 0.5) * largo / n, z = z0 + uz * (i + 0.5) * largo / n, tono = i % 3 === 0 ? '#5e4630' : i % 3 === 1 ? '#54402c' : '#4c3a28';
      if (ux) caja(x, alto - 0.03, z, largo / n - 0.015, 0.06, ancho, tono);
      else caja(x, alto - 0.03, z, ancho, 0.06, largo / n - 0.015, tono);
    }
    // pilotes, a cada lado, y sus cabezas asomando
    for (let d = 1; d <= largo; d += 3) for (const lado of [-1, 1]) {
      const px = x0 + ux * d + (ux ? 0 : lado * (ancho / 2 + 0.05)), pz = z0 + uz * d + (uz ? 0 : lado * (ancho / 2 + 0.05));
      const e = document.createElement('a-cylinder');
      e.setAttribute('position', `${px} ${alto - 1.3} ${pz}`); e.setAttribute('radius', 0.1); e.setAttribute('height', 3.2); e.setAttribute('segments-radial', 7); e.setAttribute('color', '#3a2c20');
      this.el.appendChild(e);
    }
    SUPERFICIES.push({ x0: Math.min(x0, x1) + (ux ? 0 : -ancho / 2), x1: Math.max(x0, x1) + (ux ? 0 : ancho / 2), z0: Math.min(z0, z1) + (uz ? 0 : -ancho / 2), z1: Math.max(z0, z1) + (uz ? 0 : ancho / 2), y: alto, macizo: false });
  }
});

// Barca: espera atracada en una parada, con un cartel por cada otro destino. Al apuntar a uno y
// apretar el gatillo te subes y te lleva: no se puede andar durante el viaje, y al llegar te deja en
// el embarcadero. Cada parada: "clave x z xBajar zBajar" (dónde atraca y dónde te deja), separadas por
// comas. Empieza en la parada más cercana a ti, por si se recarga la página estando en la isla.
const ETIQUETAS_BARCA = { sur: 'A la orilla sur', isla: 'A la isla', norte: 'A la orilla norte' };
const BARCA_VELOCIDAD = 5;     // metros por segundo, en la parte rápida del viaje
const BARCA_ALTURA = -0.15;    // a qué altura van los pies en la barca
let enBarco = false;           // mientras se viaja no se anda (lo mira andar-joystick)
AFRAME.registerComponent('barca', {
  schema: { paradas: { type: 'string' }, y: { default: -0.6 } },
  init() {
    this.paradas = this.data.paradas.split(',').map(p => {
      const [clave, x, z, xB, zB] = p.trim().split(/\s+/);
      return { clave, x: +x, z: +z, xB: +xB, zB: +zB };
    });
    this.rig = document.getElementById('rig').object3D;
    this.modelo = document.createElement('a-entity');
    this.modelo.setAttribute('gltf-model', 'url(modelos/barca.glb)');
    this.el.appendChild(this.modelo);
    const yo = this.rig.position;
    this.actual = this.paradas.reduce((m, p, i) => Math.hypot(p.xB - yo.x, p.zB - yo.z) < Math.hypot(this.paradas[m].xB - yo.x, this.paradas[m].zB - yo.z) ? i : m, 0);
    this.el.object3D.position.set(this.paradas[this.actual].x, this.data.y, this.paradas[this.actual].z);
    this.viaje = null;
    this.carteles = [0, 1].map(k => this.crearCartel(k));
    this.ponerCarteles();
  },
  // Tabla de madera con el destino escrito en un canvas (con tildes), en un poste de la barca.
  crearCartel(k) {
    const lienzo = document.createElement('canvas');
    lienzo.width = 512; lienzo.height = 128;
    const tex = new THREE.CanvasTexture(lienzo);
    tex.colorSpace = THREE.SRGBColorSpace;
    const e = document.createElement('a-plane');
    e.classList.add('clicable', 'cartel');
    e.setAttribute('width', 1.1); e.setAttribute('height', 0.275);
    e.setAttribute('position', `0 ${1.9 - k * 0.34} 0`);
    e.setAttribute('material', 'shader: flat; side: double');
    e.addEventListener('loaded', () => { e.getObject3D('mesh').material.map = tex; e.getObject3D('mesh').material.needsUpdate = true; });
    e.addEventListener('click', () => this.viajar(e.destino));
    e.addEventListener('mouseenter', () => { if (e.getObject3D('mesh')) e.getObject3D('mesh').material.color.set('#ffd9a0'); });
    e.addEventListener('mouseleave', () => { if (e.getObject3D('mesh')) e.getObject3D('mesh').material.color.set('#ffffff'); });
    e.lienzo = lienzo; e.tex = tex;
    this.el.appendChild(e);
    return e;
  },
  ponerCarteles() {
    const destinos = this.paradas.map((p, i) => i).filter(i => i !== this.actual);
    this.carteles.forEach((e, k) => {
      e.destino = destinos[k];
      const g = e.lienzo.getContext('2d'), W = e.lienzo.width, H = e.lienzo.height;
      g.fillStyle = '#3a2a1b'; g.fillRect(0, 0, W, H);
      g.strokeStyle = '#17100a'; g.lineWidth = 8; g.strokeRect(4, 4, W - 8, H - 8);
      g.font = '600 56px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillStyle = '#e4d3a8'; g.fillText(ETIQUETAS_BARCA[this.paradas[destinos[k]].clave], W / 2, H / 2 + 3);
      e.tex.needsUpdate = true;
      e.object3D.visible = true;
    });
  },
  viajar(i) {
    if (this.viaje || i === undefined) return;
    const a = this.paradas[this.actual], b = this.paradas[i];
    this.viaje = { a, b, i, t: 0, dura: Math.hypot(b.x - a.x, b.z - a.z) / BARCA_VELOCIDAD + 3 };
    enBarco = true;
    for (const e of this.carteles) e.object3D.visible = false;
    this.rig.position.set(a.x, BARCA_ALTURA, a.z);
    this.giroMeta = Math.atan2(b.x - a.x, b.z - a.z);
  },
  tick(t, dt) {
    const o = this.el.object3D;
    o.position.y = this.data.y + 0.03 * Math.sin(t / 900);   // se mece
    o.rotation.z = 0.012 * Math.sin(t / 1300);
    if (!this.viaje || !dt || cambiandoDeZona) return;
    const v = this.viaje;
    v.t = Math.min(1, v.t + Math.min(dt, 100) / 1000 / v.dura);
    const f = rampa(0, 1, v.t);   // arranca y frena con suavidad
    o.position.x = v.a.x + (v.b.x - v.a.x) * f;
    o.position.z = v.a.z + (v.b.z - v.a.z) * f;
    // la proa se va girando hacia el destino (a ti no te gira: marea)
    let dg = this.giroMeta - o.rotation.y;
    dg = Math.atan2(Math.sin(dg), Math.cos(dg));
    o.rotation.y += dg * Math.min(1, dt / 1200);
    this.rig.position.set(o.position.x, BARCA_ALTURA + o.position.y - this.data.y, o.position.z);
    if (v.t < 1) return;
    this.actual = v.i;
    this.viaje = null;
    enBarco = false;
    this.rig.position.set(v.b.xB, v.b.y || 0.25, v.b.zB);
    const andar = document.querySelector('[andar-joystick]').components['andar-joystick'];
    if (andar) andar.altura = 0.25;
    this.ponerCarteles();
  },
  remove() { enBarco = false; }
});
