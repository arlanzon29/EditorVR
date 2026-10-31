// Editor VR: el mapa. Un pergamino con todas las zonas y los caminos, y una flecha que dice dónde estás
// y hacia dónde miras. Se enseña y se oculta con el botón Y o, en el ordenador, con la tecla N. En VR va
// en el mando izquierdo; fuera, delante de la cámara. Empieza oculto.

const MAPA = { x0: -300, x1: 370, z0: -445, z1: 60 };   // lo que abarca, en metros del mundo
// los caminos, trazados a mano sobre los de cada zona
const CAMINOS_MAPA = [
  [[6, -7], [8, -15], [4, -25], [6, -35], [6, -45], [3, -54], [6, -66], [9, -76], [6, -84], [12, -92], [8, -110], [11, -150], [6, -200], [6, -231]],
  [[9, -74], [50, -100], [90, -120], [160, -120], [230, -120], [300, -120], [324, -120]],
  [[3, -58], [-40, -95], [-80, -120], [-125, -125], [-150, -160], [-180, -200], [-180, -230], [-180, -290], [-180, -315]],
];
AFRAME.registerComponent('mapa', {
  init() {
    const W = 1024, H = Math.round(W * (MAPA.z1 - MAPA.z0) / (MAPA.x1 - MAPA.x0));
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    this.dibujar(c.getContext('2d'), W, H);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    const ancho = 0.42, alto = ancho * H / W;
    this.ancho = ancho; this.alto = alto;
    this.panel = new THREE.Mesh(new THREE.PlaneGeometry(ancho, alto), new THREE.MeshBasicMaterial({ map: tex, fog: false, depthTest: false, transparent: true }));
    this.panel.renderOrder = 997;
    this.panel.visible = false;
    // la flecha: un triángulo rojo oscuro, con un borde claro para que se vea sobre cualquier zona
    const forma = new THREE.Shape();
    forma.moveTo(0, 0.016); forma.lineTo(0.0105, -0.012); forma.lineTo(0, -0.006); forma.lineTo(-0.0105, -0.012); forma.lineTo(0, 0.016);
    const flecha = new THREE.Mesh(new THREE.ShapeGeometry(forma), new THREE.MeshBasicMaterial({ color: '#a01f16', fog: false, depthTest: false, transparent: true }));
    flecha.renderOrder = 998;
    this.flecha = flecha;
    this.panel.add(flecha);
    this.mira = new THREE.Vector3(); this.yo = new THREE.Vector3();
    const alternar = () => { this.panel.visible = !this.panel.visible; };
    window.addEventListener('keydown', e => { if (e.code === 'KeyN') alternar(); });
    const mando = () => document.querySelector('[laser-controls="hand: left"]');
    const enganchar = () => {
      const m = mando();
      if (!m) return setTimeout(enganchar, 500);
      m.addEventListener('ybuttondown', alternar);
    };
    enganchar();
    this.colocar = () => {
      const m = mando();
      if (this.el.is('vr-mode') && m) {
        m.object3D.add(this.panel);
        this.panel.position.set(0.03, 0.2, -0.12); this.panel.rotation.set(-0.6, 0, 0);
      } else {
        this.el.camera.el.object3D.add(this.panel);
        this.panel.position.set(0, -0.02, -0.5); this.panel.rotation.set(0, 0, 0);
      }
    };
    this.el.addEventListener('enter-vr', () => { for (const ms of [300, 1000, 2500]) setTimeout(this.colocar, ms); });
    this.el.addEventListener('exit-vr', this.colocar);
    if (this.el.hasLoaded) this.colocar(); else this.el.addEventListener('loaded', this.colocar, { once: true });
  },
  dibujar(g, W, H) {
    const X = x => (x - MAPA.x0) / (MAPA.x1 - MAPA.x0) * W, Z = z => (MAPA.z1 - z) / (MAPA.z1 - MAPA.z0) * H;   // el norte (z negativas) arriba...
    const Y = z => H - Z(z);   // ...así el castillo queda abajo
    let s = 9;
    const azar = () => (s = (s * 16807) % 2147483647) / 2147483647;
    // pergamino, con manchas y el borde oscurecido
    g.fillStyle = '#d7c49a'; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 260; i++) {
      g.fillStyle = `rgba(${azar() > 0.5 ? '120, 92, 54' : '245, 232, 200'}, ${0.03 + azar() * 0.05})`;
      g.beginPath(); g.ellipse(azar() * W, azar() * H, 10 + azar() * 60, 8 + azar() * 40, azar() * 3, 0, Math.PI * 2); g.fill();
    }
    const v = g.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.62);
    v.addColorStop(0, 'rgba(70, 45, 20, 0)'); v.addColorStop(1, 'rgba(70, 45, 20, 0.55)');
    g.fillStyle = v; g.fillRect(0, 0, W, H);
    const TINTA = '#3a2616';
    // mar, a la derecha del acantilado
    g.fillStyle = 'rgba(70, 110, 130, 0.5)';
    g.beginPath(); g.moveTo(X(337), Y(-200)); for (let z = -200; z <= -40; z += 8) g.lineTo(X(337 + 5 * Math.sin(z * 0.06) + 2.5 * Math.sin(z * 0.17 + 1)), Y(z)); g.lineTo(X(370), Y(-40)); g.lineTo(X(370), Y(-200)); g.fill();
    g.strokeStyle = TINTA; g.lineWidth = 2.5; g.stroke();
    g.strokeStyle = 'rgba(58, 38, 22, 0.5)'; g.lineWidth = 1.2;
    for (let i = 0; i < 18; i++) { const x = X(345 + azar() * 20), y = Y(-195 + azar() * 150); g.beginPath(); g.moveTo(x - 7, y); g.quadraticCurveTo(x, y - 4, x + 7, y); g.stroke(); }
    // lago e isla
    g.fillStyle = 'rgba(70, 110, 130, 0.55)'; g.strokeStyle = TINTA; g.lineWidth = 2.5;
    g.beginPath(); g.ellipse(X(5), Y(-300), X(5 + 70) - X(5), Y(-300 + 65) - Y(-300), 0, 0, Math.PI * 2); g.fill(); g.stroke();
    g.fillStyle = '#c7b98b'; g.beginPath(); g.arc(X(43), Y(-300), X(43 + 17) - X(43), 0, Math.PI * 2); g.fill(); g.stroke();
    // árboles del bosque y de alrededor del lago
    const arbol = (x, z) => { g.strokeStyle = TINTA; g.lineWidth = 1.5; g.fillStyle = 'rgba(70, 90, 45, 0.75)'; g.beginPath(); g.arc(X(x), Y(z), 7, 0, Math.PI * 2); g.fill(); g.stroke(); g.beginPath(); g.moveTo(X(x), Y(z) + 7); g.lineTo(X(x), Y(z) + 12); g.stroke(); };
    for (let i = 0; i < 70; i++) { const x = -72 + azar() * 155, z = -192 + azar() * 140; if (Math.abs(x - 6) > 16 && Math.abs(z + 120) > 9) arbol(x, z); }
    // montes
    const monte = (x, z, r) => { g.strokeStyle = TINTA; g.lineWidth = 2; g.fillStyle = 'rgba(120, 105, 85, 0.6)'; g.beginPath(); g.moveTo(X(x) - r, Y(z) + r * 0.7); g.lineTo(X(x), Y(z) - r * 0.8); g.lineTo(X(x) + r, Y(z) + r * 0.7); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#f0ece0'; g.beginPath(); g.moveTo(X(x) - r * 0.28, Y(z) - r * 0.25); g.lineTo(X(x), Y(z) - r * 0.8); g.lineTo(X(x) + r * 0.28, Y(z) - r * 0.25); g.closePath(); g.fill(); };
    monte(-235, -70, 26); monte(-145, -55, 22); monte(-245, -170, 24); monte(-190, -120, 48); monte(-125, -190, 20);
    // caminos, en trazos
    g.strokeStyle = '#6b4526'; g.lineWidth = 4; g.setLineDash([12, 8]);
    for (const c of CAMINOS_MAPA) { g.beginPath(); c.forEach(([x, z], i) => i ? g.lineTo(X(x), Y(z)) : g.moveTo(X(x), Y(z))); g.stroke(); }
    // ruta de la barca
    g.strokeStyle = '#3a2616'; g.lineWidth = 2; g.setLineDash([3, 8]);
    g.beginPath(); g.moveTo(X(7), Y(-243)); g.lineTo(X(7), Y(-357)); g.moveTo(X(7), Y(-243)); g.lineTo(X(15), Y(-298)); g.lineTo(X(7), Y(-357)); g.stroke();
    g.setLineDash([]);
    // edificios: castillo, casas, faro, abadía
    g.strokeStyle = TINTA; g.lineWidth = 2; g.fillStyle = '#a89274';
    const torre = (x, z, a, b) => { g.fillRect(X(x) - a / 2, Y(z) - b, a, b); g.strokeRect(X(x) - a / 2, Y(z) - b, a, b); for (let i = 0; i < 3; i++) { g.fillRect(X(x) - a / 2 + i * a / 2.5, Y(z) - b - 5, a / 5, 5); g.strokeRect(X(x) - a / 2 + i * a / 2.5, Y(z) - b - 5, a / 5, 5); } };
    torre(-8, 8, 58, 20); torre(4, 14, 30, 42); torre(-30, 12, 18, 30); torre(26, 12, 18, 30);
    for (const [x, z] of [[135, -100], [150, -95], [175, -95], [190, -105], [135, -140], [150, -148], [172, -148], [190, -135]]) {
      g.fillStyle = '#a89274'; g.fillRect(X(x) - 8, Y(z) - 8, 16, 10); g.strokeRect(X(x) - 8, Y(z) - 8, 16, 10);
      g.fillStyle = '#7a5a33'; g.beginPath(); g.moveTo(X(x) - 11, Y(z) - 8); g.lineTo(X(x), Y(z) - 18); g.lineTo(X(x) + 11, Y(z) - 8); g.closePath(); g.fill(); g.stroke();
    }
    g.fillStyle = '#a89274'; torre(322, -120, 12, 42);
    g.fillStyle = '#8f8f92'; torre(-180, -335, 60, 24); torre(-206, -335, 16, 46);
    // nombres
    g.font = '600 26px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    const nombre = (texto, x, z, t) => { g.font = `600 ${t || 30}px Georgia, serif`; g.fillStyle = TINTA; g.fillText(texto, X(x), Y(z)); };
    nombre('El Castillo', 5, 25); nombre('El Bosque', 6, -135); nombre('El Lago', 5, -258); nombre('La Isla', 43, -327, 22);
    nombre('El Poblado', 160, -172); nombre('La Montaña', -200, -30); nombre('El Acantilado', 285, -175);
    nombre('La Abadía en Ruinas', -180, -405); nombre('Mar', 356, -70, 22);
    g.font = '600 44px Georgia, serif'; g.fillStyle = TINTA; g.fillText('Tierras del Reino', W * 0.73, 44);
    // rosa de los vientos, arriba a la izquierda (el norte del juego, hacia el lago)
    const rx = W * 0.72, ry = H * 0.8, R = 46;
    g.strokeStyle = TINTA; g.fillStyle = TINTA; g.lineWidth = 2;
    g.beginPath(); g.arc(rx, ry, R * 0.55, 0, Math.PI * 2); g.stroke();
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; g.beginPath(); g.moveTo(rx + Math.sin(a) * R, ry - Math.cos(a) * R); g.lineTo(rx + Math.cos(a) * 7, ry + Math.sin(a) * 7); g.lineTo(rx - Math.cos(a) * 7, ry - Math.sin(a) * 7); g.closePath(); g.fill(); }
    g.font = '600 22px Georgia, serif'; g.fillText('N', rx, ry - R - 14);
    g.strokeStyle = 'rgba(58, 38, 22, 0.8)'; g.lineWidth = 6; g.strokeRect(10, 10, W - 20, H - 20);
    g.lineWidth = 1.5; g.strokeRect(22, 22, W - 44, H - 44);
  },
  // la flecha en su sitio, según dónde estás y hacia dónde miras
  tick() {
    if (!this.panel.visible || !this.el.camera) return;
    this.el.camera.getWorldPosition(this.yo);
    this.el.camera.getWorldDirection(this.mira);
    const u = (this.yo.x - MAPA.x0) / (MAPA.x1 - MAPA.x0) - 0.5, v = (this.yo.z - MAPA.z0) / (MAPA.z1 - MAPA.z0) - 0.5;
    // en el mapa, el norte (z negativas) va hacia arriba
    this.flecha.position.set(u * this.ancho, -v * this.alto, 0.001);
    this.flecha.rotation.z = Math.atan2(-this.mira.x, -this.mira.z);
  }
});
