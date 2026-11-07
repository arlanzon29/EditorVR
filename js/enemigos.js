// Editor VR: los enemigos (episodio2.md). El primero, el lobo de la cueva: con la misión de la casa, entrar en la cueva
// cuesta PUNTOS_LOBO más (js/partida.js). En la pregunta de entrar sale su nivel en cabezas de lobo (js/pregunta.js);
// con puntos, lo matas y ya no vuelve en la misión; sin ellos, huyes a la posada y pierdes lo que llevas. No hay pelea
// de acción: solo puntos, un sonido y, después, el lobo muerto en el túnel.
// Lo que se ve: sus ojos brillando en la boca de la cueva mientras sigue vivo (lobo-ojos, salas/bosque.html) y, ya muerto,
// el lobo tumbado al principio del túnel (lobo, salas/cueva.html).

const ENEMIGOS = {
  lobo: { nombre: 'un lobo', cabezas: 1 },
};

// El sonido, hecho con el navegador (sin archivos, como el brindis de js/boda.js): un gruñido grave y, si lo matas, un
// gañido que cae; si huyes, un aullido largo.
let sonidoEnemigos = null;
function aullidoDeLobo(muerto) {
  try {
    sonidoEnemigos = sonidoEnemigos || new (window.AudioContext || window.webkitAudioContext)();
    const ctx = sonidoEnemigos, t0 = ctx.currentTime + 0.02;
    ctx.resume();
    const salida = ctx.createGain();
    salida.gain.value = 0.45;
    salida.connect(ctx.destination);
    // el gruñido: una sierra grave, con un filtro y temblando
    const o = ctx.createOscillator(), f = ctx.createBiquadFilter(), g = ctx.createGain(), lfo = ctx.createOscillator(), lg = ctx.createGain();
    o.type = 'sawtooth'; o.frequency.setValueAtTime(95, t0); o.frequency.linearRampToValueAtTime(120, t0 + 0.5); o.frequency.linearRampToValueAtTime(85, t0 + 0.9);
    f.type = 'lowpass'; f.frequency.value = 420; f.Q.value = 4;
    lfo.frequency.value = 23; lg.gain.value = 0.12; lfo.connect(lg); lg.connect(g.gain);
    g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(0.35, t0 + 0.1); g.gain.linearRampToValueAtTime(0, t0 + 0.95);
    o.connect(f); f.connect(g); g.connect(salida);
    o.start(t0); o.stop(t0 + 1); lfo.start(t0); lfo.stop(t0 + 1);
    // luego, el gañido (muerto) o el aullido (huyes)
    const t1 = t0 + 1.05, v = ctx.createOscillator(), gv = ctx.createGain(), dura = muerto ? 0.45 : 2.2;
    v.type = 'triangle';
    if (muerto) { v.frequency.setValueAtTime(1100, t1); v.frequency.exponentialRampToValueAtTime(380, t1 + dura); }
    else { v.frequency.setValueAtTime(380, t1); v.frequency.linearRampToValueAtTime(720, t1 + 0.5); v.frequency.linearRampToValueAtTime(680, t1 + 1.6); v.frequency.linearRampToValueAtTime(420, t1 + dura); }
    gv.gain.setValueAtTime(0, t1); gv.gain.linearRampToValueAtTime(0.22, t1 + 0.08); gv.gain.setValueAtTime(0.2, t1 + dura * 0.7); gv.gain.linearRampToValueAtTime(0, t1 + dura);
    v.connect(gv); gv.connect(salida);
    v.start(t1); v.stop(t1 + dura + 0.05);
  } catch (e) {}   // sin sonido, sigue igual
}

// Una cabeza de lobo de frente, con la tinta del cartel: orejas, cara, hocico y los ojos en claro. (cx, cy) es su centro.
function dibujoCabezaLobo(g, cx, cy, r, tinta = '#3a2616', claro = '#d7c49a') {
  const p = (x, y) => [cx + x * r, cy + y * r];
  g.fillStyle = tinta;
  g.beginPath();
  for (const [x, y] of [[-0.85, -1], [-0.45, -0.45], [0.45, -0.45], [0.85, -1], [0.95, -0.1], [0.7, 0.35], [0.28, 0.6], [0.18, 1], [-0.18, 1], [-0.28, 0.6], [-0.7, 0.35], [-0.95, -0.1]]) g.lineTo(...p(x, y));
  g.closePath(); g.fill();
  g.fillStyle = claro;
  for (const s of [-1, 1]) {   // los ojos, rasgados
    g.beginPath(); g.moveTo(...p(s * 0.18, -0.05)); g.lineTo(...p(s * 0.55, -0.22)); g.lineTo(...p(s * 0.45, 0.02)); g.closePath(); g.fill();
    g.beginPath(); g.moveTo(...p(s * 0.62, -0.88)); g.lineTo(...p(s * 0.48, -0.55)); g.lineTo(...p(s * 0.72, -0.5)); g.closePath(); g.fill();   // dentro de la oreja
  }
  g.beginPath(); g.arc(...p(0, 0.78), r * 0.12, 0, Math.PI * 2); g.fill();   // la trufa
  g.fillStyle = tinta;
}

// El lobo: cajas grises, de pie (muerto: false) o tumbado de lado. Mira hacia +x. Origen en el suelo, bajo el lomo.
AFRAME.registerComponent('lobo', {
  schema: { muerto: { default: true }, soloMuerto: { default: true } },
  init() {
    // en la cueva, solo cuando ya lo has matado
    if (this.data.soloMuerto && !partida.estado.lobo) return;
    const g = new THREE.Group(), pelo = new THREE.MeshStandardMaterial({ color: '#5a554e', roughness: 1, flatShading: true });
    const claro = new THREE.MeshStandardMaterial({ color: '#8a8378', roughness: 1, flatShading: true });
    const caja = (w, h, d, x, y, z, m = pelo, rz = 0) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.rotation.z = rz; g.add(b); };
    caja(0.95, 0.34, 0.3, 0, 0.58, 0);              // el cuerpo
    caja(0.5, 0.2, 0.24, -0.05, 0.47, 0, claro);     // la panza
    caja(0.3, 0.28, 0.24, 0.6, 0.78, 0);             // la cabeza
    caja(0.22, 0.12, 0.13, 0.8, 0.72, 0, claro);     // el hocico
    for (const z of [-0.07, 0.07]) caja(0.06, 0.14, 0.06, 0.56, 0.98, z);   // las orejas
    for (const [x, z] of [[0.35, -0.1], [0.35, 0.1], [-0.35, -0.1], [-0.35, 0.1]]) caja(0.08, 0.42, 0.08, x, 0.21, z);
    caja(0.42, 0.09, 0.09, -0.62, 0.62, 0, pelo, -0.5);   // la cola
    if (this.data.muerto) { g.rotation.x = Math.PI / 2; g.position.y = 0.16; g.position.z = -0.55; }
    // en el suelo del sitio (la cueva tiene su propio terreno)
    const p = this.el.object3D.position;
    if (typeof alturaTerreno === 'function') p.y = alturaTerreno(p.x, p.z);
    this.el.setObject3D('mesh', g);
  },
  remove() {
    const g = this.el.getObject3D('mesh');
    if (!g) return;
    g.traverse(o => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } });
    this.el.removeObject3D('mesh');
  }
});

// Los ojos del lobo, dos brasas amarillas en la oscuridad de la boca de la cueva, que parpadean de vez en cuando. Solo
// mientras el lobo sigue vivo (partida.loboEnCueva). Mira hacia +z.
AFRAME.registerComponent('lobo-ojos', {
  init() {
    const g = new THREE.Group(), m = new THREE.MeshBasicMaterial({ color: '#ffd23a', fog: false });
    for (const x of [-0.09, 0.09]) { const o = new THREE.Mesh(new THREE.SphereGeometry(0.032, 8, 6), m); o.position.x = x; o.scale.y = 0.6; g.add(o); }
    this.el.setObject3D('mesh', g);
    this.g = g; this.siguiente = 0;
    this.poner = () => { g.visible = partida.loboEnCueva(); };
    this.poner();
    document.addEventListener('partida-cambia', this.poner);
  },
  tick(t) {
    if (!this.g.visible && !partida.loboEnCueva()) return;
    // parpadea cada pocos segundos, y se mueve un poco, como si mirara
    if (t > this.siguiente) this.siguiente = t + 2500 + Math.random() * 4000;
    const cerrado = this.siguiente - t < 160;
    for (const o of this.g.children) o.visible = !cerrado;
    this.g.position.x = 0.06 * Math.sin(t / 1300);
  },
  remove() {
    document.removeEventListener('partida-cambia', this.poner);
    this.g.traverse(o => { if (o.isMesh) o.geometry.dispose(); });
    this.g.children[0].material.dispose();
    this.el.removeObject3D('mesh');
  }
});

// El encuentro con el lobo, al decir que sí a entrar en la cueva: primero la espera (un aviso, un rato de silencio, el
// gruñido y el gañido o el aullido) y luego, en un cuadro con su cabeza, lo que ha pasado. "alSeguir(gana)" al pulsar
// Seguir: si ganas, se entra (y se cobra: partida.entrar); si no, se huye (partida.huirDelLobo).
const LOBO_SILENCIO_MS = 1800, LOBO_CUADRO_MS = 2000;   // del aviso al gruñido, y del gruñido al cuadro
function encuentroConLobo(precio, alSeguir) {
  const tienes = partida.estado.puntos, gana = tienes >= precio, quedan = tienes - precio;
  partida.charlaAbierta = true;   // (el tutorial espera)
  partida.avisar('Algo se mueve en la oscuridad de la cueva...');
  setTimeout(() => aullidoDeLobo(gana), LOBO_SILENCIO_MS);
  setTimeout(() => {
    preguntarGasto({
      textos: ['Seguir'],
      dibujar: (g, W, H) => dibujarCuadroDelLobo(g, W, H, gana, precio, quedan),
      alResponder: () => { partida.charlaAbierta = false; alSeguir(gana); },
    });
  }, LOBO_SILENCIO_MS + LOBO_CUADRO_MS);
}

function dibujarCuadroDelLobo(g, W, H, gana, precio, quedan) {
  fondoDePergamino(g, W, H);
  g.fillStyle = '#5a1810'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '600 56px Georgia, serif';
  g.fillText('¡Un lobo!', W / 2, 82);
  // la cabeza, grande y en rojo, a la izquierda; tachada si lo has matado
  dibujoCabezaLobo(g, 270, 350, 165, '#8a2318');
  if (gana) {
    g.strokeStyle = '#2e2116'; g.lineWidth = 16; g.lineCap = 'round';
    g.beginPath(); g.moveTo(130, 190); g.lineTo(410, 510); g.stroke();
  }
  const punto = n => `${n} ${n === 1 ? 'punto' : 'puntos'}`;
  const parrafos = gana ? [
    'Sale de la oscuridad y se te echa encima.',
    'Luchas con él y lo matas.',
    `Has gastado ${punto(precio)} de energía; te ${quedan === 1 ? 'queda' : 'quedan'} ${quedan}.`,
  ] : [
    'Sale de la oscuridad y se te echa encima.',
    'No te quedan fuerzas para hacerle frente: huyes a la posada y pierdes lo que llevabas.',
  ];
  g.fillStyle = '#3a2616'; g.textAlign = 'left'; g.font = '36px Georgia, serif';
  let y = 200;
  for (const p of parrafos) {
    for (const l of partirTexto(g, p, 430)) { g.fillText(l, 520, y); y += 48; }
    y += 22;
  }
}
