// Editor VR: las estrellas escondidas. Al aceptar la misión (partida.aceptarBoda) aparecen ESTRELLAS_TOTAL estrellas
// azules, siempre en los mismos sitios de cada misión (están en salas/*.html, con su número), y cada una se coge
// apuntándola y apretando el gatillo, de cerca. Se cuentan en el indicador de la partida (js/partida.js).

const ESTRELLA_ALCANCE = 7;      // desde cuántos metros se puede coger
const ESTRELLA_ALTURA = 0.85;    // cuánto por encima del suelo flota
const DESTELLO_MS = 1300, DESTELLO_CHISPAS = 60, DESTELLO_ALCANCE = 1.8;   // el efecto azul al cogerla

// El sonido al cogerla, hecho con el navegador (sin archivos, como el brindis de js/boda.js): un tintineo de campanilla de
// tres notas que suben, y cada estrella suena un tono más alta que la anterior. A la última, un acorde por encima.
let sonidoEstrellas = null;
function sonidoDeEstrella(cuantas) {
  try {
    sonidoEstrellas = sonidoEstrellas || new (window.AudioContext || window.webkitAudioContext)();
    const ctx = sonidoEstrellas, t0 = ctx.currentTime + 0.02;
    ctx.resume();
    const salida = ctx.createGain();
    salida.gain.value = 0.35;
    salida.connect(ctx.destination);
    const base = 523.25 * Math.pow(2, (cuantas - 1) * 2 / 12);   // do, y un tono más por cada estrella
    const notas = [[0, 1], [0.09, 1.25], [0.18, 1.5]];          // tercera y quinta
    if (cuantas === ESTRELLAS_TOTAL) notas.push([0.3, 2], [0.3, 1.5], [0.3, 1.25]);
    for (const [retraso, razon] of notas) {
      const t = t0 + retraso;
      // una campanilla: la nota, y un parcial inarmónico que se apaga antes
      for (const [mult, fuerza, dura] of [[1, 0.5, 1.1], [2.76, 0.18, 0.4]]) {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine';
        o.frequency.value = base * razon * mult;
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(fuerza, t + 0.01);
        g.gain.exponentialRampToValueAtTime(0.001, t + dura);
        o.connect(g); g.connect(salida);
        o.start(t); o.stop(t + dura + 0.05);
      }
    }
  } catch (e) {}
}

AFRAME.registerComponent('estrella', {
  schema: { id: { type: 'int' }, x: { type: 'number' }, z: { type: 'number' } },
  init() {
    const { x, z } = this.data;
    this.el.object3D.position.set(x, alturaTerreno(x, z) + ESTRELLA_ALTURA, z);
    // (azul, como su destello) cinco puntas, de canto fino, con el centro en el origen
    const forma = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const a = Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 0.1 : 0.22;
      if (i) forma.lineTo(r * Math.cos(a), r * Math.sin(a)); else forma.moveTo(r * Math.cos(a), r * Math.sin(a));
    }
    const geo = new THREE.ExtrudeGeometry(forma, { depth: 0.05, bevelEnabled: false });
    geo.translate(0, 0, -0.025);
    this.malla = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: '#4aa8ff' }));
    this.el.object3D.add(this.malla);
    this.rayo = null; this.ojo = new THREE.Vector3();
    this.mirar = this.mirar.bind(this);
    document.addEventListener('partida-cambia', this.mirar);
    document.addEventListener('partida-abierta', this.mirar);
    this.mirar();
  },
  remove() {
    document.removeEventListener('partida-cambia', this.mirar);
    document.removeEventListener('partida-abierta', this.mirar);
    this.malla.geometry.dispose(); this.malla.material.dispose();
    this.quitarRayo();
  },
  // Si toca verse (misión empezada y sin coger), con su caja para el rayo; si no, ni se ve ni estorba al rayo
  mirar() {
    const activa = !!partida.ranura && partida.estrellaActiva(this.data.id);
    this.malla.visible = activa;
    if (activa && !this.rayo) {
      const r = this.rayo = document.createElement('a-box');
      r.classList.add('clicable');
      r.setAttribute('width', 0.7); r.setAttribute('height', 0.7); r.setAttribute('depth', 0.7);
      r.setAttribute('material', 'visible: false');
      let ultimo = 0;
      r.addEventListener('mousedown', () => {
        if (performance.now() - ultimo < 500) return;
        ultimo = performance.now();
        this.el.sceneEl.camera.getWorldPosition(this.ojo);
        const o = this.el.object3D.position;
        if (Math.hypot(this.ojo.x - o.x, this.ojo.y - o.y, this.ojo.z - o.z) > ESTRELLA_ALCANCE) return partida.avisar('Hay algo brillante, pero está lejos: acércate.');
        const destello = document.createElement('a-entity');
        destello.setAttribute('destello-azul', '');
        destello.object3D.position.copy(o);
        this.el.sceneEl.appendChild(destello);
        sonidoDeEstrella(partida.estado.estrellas.length + 1);
        partida.cogerEstrella(this.data.id);
      });
      this.el.appendChild(r);
    } else if (!activa) this.quitarRayo();
  },
  quitarRayo() { if (this.rayo && this.rayo.parentNode) this.rayo.parentNode.removeChild(this.rayo); this.rayo = null; },
  tick(t) {
    if (!this.malla.visible) return;
    this.malla.rotation.y = t / 900;
    this.malla.position.y = 0.05 * Math.sin(t / 600);
  }
});

// El efecto azul al coger una estrella: una nube de chispas que salen disparadas y un aro que se abre, con luz aditiva,
// y se quita solo al acabar. Se pone en una entidad nueva, en el sitio de la estrella.
AFRAME.registerComponent('destello-azul', {
  init() {
    const dirs = [], pos = new Float32Array(DESTELLO_CHISPAS * 3);
    for (let i = 0; i < DESTELLO_CHISPAS; i++) {
      const a = Math.random() * Math.PI * 2, b = Math.acos(2 * Math.random() - 1), v = 0.5 + Math.random() * 0.5;
      dirs.push(new THREE.Vector3(Math.sin(b) * Math.cos(a), Math.sin(b) * Math.sin(a) + 0.3, Math.cos(b)).multiplyScalar(v));
    }
    this.dirs = dirs;
    this.geo = new THREE.BufferGeometry();
    this.geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.chispas = new THREE.Points(this.geo, new THREE.PointsMaterial({ color: '#4aa8ff', size: 0.09, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false }));
    this.chispas.frustumCulled = false;
    this.aro = new THREE.Mesh(new THREE.RingGeometry(0.85, 1, 40), new THREE.MeshBasicMaterial({ color: '#7cc4ff', transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, fog: false }));
    this.aro.renderOrder = 5;
    this.el.object3D.add(this.chispas, this.aro);
    this.ojo = new THREE.Vector3();
    this.t = 0;
  },
  tick(t, dt) {
    this.t += Math.min(dt || 0, 100);
    const k = this.t / DESTELLO_MS;
    if (k >= 1) return this.el.parentNode && this.el.parentNode.removeChild(this.el);
    const sale = 1 - (1 - k) * (1 - k), p = this.geo.attributes.position;
    this.dirs.forEach((d, i) => p.setXYZ(i, d.x * sale * DESTELLO_ALCANCE, d.y * sale * DESTELLO_ALCANCE - 0.6 * k * k, d.z * sale * DESTELLO_ALCANCE));
    p.needsUpdate = true;
    this.chispas.material.opacity = 1 - k * k;
    // el aro se abre mirando a quien lo ve
    this.el.sceneEl.camera.getWorldPosition(this.ojo);
    this.aro.lookAt(this.ojo);
    this.aro.scale.setScalar(0.2 + 1.6 * sale);
    this.aro.material.opacity = 0.9 * (1 - k);
  },
  remove() {
    this.geo.dispose(); this.chispas.material.dispose();
    this.aro.geometry.dispose(); this.aro.material.dispose();
  }
});
