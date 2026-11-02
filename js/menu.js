// Editor VR: el menú principal, en su estancia (salas/menu.html, la zona "menu"). Una tabla con las partidas
// guardadas (RANURAS, en js/partida.js): de cada una, cómo va y sus botones (continuar y borrar, o empezarla si
// está vacía). Se usa como lo demás, con el rayo y el gatillo; en el ordenador, con la mira y el clic.

const MENU_ANCHO = 2, MENU_ALTO = 1.3;   // metros
const MENU_PX = 640;                     // píxeles de la tabla por metro
const MENU_FILA_Y = 190, MENU_FILA_ALTO = 200;   // en píxeles: dónde empieza la primera partida y lo que ocupa cada una
const MENU_BOTON_ANCHO = 0.46, MENU_BOTON_ALTO = 0.13;

// Un círculo difuminado en un canvas, para halos, motas y charcos de luz: "rgb" del centro, que se apaga hacia el borde
function texturaDeHalo(rgb, fuerza = 1) {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'), r = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  r.addColorStop(0, `rgba(${rgb}, ${fuerza})`); r.addColorStop(0.35, `rgba(${rgb}, ${fuerza * 0.35})`); r.addColorStop(1, `rgba(${rgb}, 0)`);
  g.fillStyle = r; g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
}
// Un haz de luz, como un cono abierto que se suma a lo de detrás, más fuerte en el extremo "de"
function texturaDeHaz(rgb) {
  const c = document.createElement('canvas'); c.width = 4; c.height = 128;
  const g = c.getContext('2d'), grad = g.createLinearGradient(0, 0, 0, 128);
  grad.addColorStop(0, `rgba(${rgb}, 1)`); grad.addColorStop(0.6, `rgba(${rgb}, 0.35)`); grad.addColorStop(1, `rgba(${rgb}, 0)`);
  g.fillStyle = grad; g.fillRect(0, 0, 4, 128);
  return new THREE.CanvasTexture(c);
}
const sumaLuz = (map, opacity) => ({ map, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, fog: false });

// Candelabro de pie (modelos/candelabro.glb, de herramientas/modelar-candelabro.py), contra la pared: las llamas
// tiemblan, cada una con un halo, y lleva una luz cálida de verdad, para que la pared de detrás se ilumine (y se hornee).
// Origen: en el suelo; los brazos, a lo largo de x local.
let modeloCandelabro = null;
AFRAME.registerComponent('candelabro', {
  schema: { intensidad: { default: 0.9 } },
  init() {
    modeloCandelabro = modeloCandelabro || new Promise(listo => new THREE.GLTFLoader().load('modelos/candelabro.glb', g => listo(g.scene)));
    this.llamas = []; this.halos = [];
    this.tex = texturaDeHalo('255, 190, 110', 0.9);
    modeloCandelabro.then(escena => {
      if (!this.el.parentNode) return;
      const g = escena.clone(true);
      for (let k = 0; k < 3; k++) {
        const llama = g.getObjectByName('Llama' + k);
        if (!llama) continue;
        llama.material = new THREE.MeshStandardMaterial({ color: '#e0a040', emissive: '#f0a030', emissiveIntensity: 2 });
        const halo = new THREE.Sprite(new THREE.SpriteMaterial(sumaLuz(this.tex, 0.8)));
        halo.position.copy(llama.position).add(new THREE.Vector3(0, 0.035, 0)); halo.scale.setScalar(0.4);
        g.add(halo);
        this.llamas.push(llama); this.halos.push(halo);
      }
      this.el.setObject3D('mesh', g);
    });
    const luz = document.createElement('a-entity');
    luz.setAttribute('light', { type: 'point', intensity: this.data.intensidad, distance: 6, color: '#ffb868' });
    luz.setAttribute('position', '0 1.95 0.15');
    this.el.appendChild(luz);
    this.fase = Math.random() * 100;
  },
  tick(t) {
    const s = t / 1000 + this.fase;
    this.halos.forEach((h, i) => {
      const v = 0.5 * Math.sin(s * 7.3 + i * 2) + 0.3 * Math.sin(s * 13.1 + i) + 0.2 * Math.sin(s * 23.7 + i * 3);   // -1…1
      h.scale.setScalar(0.4 * (1 + 0.12 * v));
      h.material.opacity = 0.7 + 0.2 * v;
      this.llamas[i].scale.set(1 - v * 0.1, 1 + v * 0.25, 1 - v * 0.1);
    });
  },
  remove() {
    for (const o of [...this.llamas, ...this.halos]) o.material.dispose();
    this.tex.dispose();
    this.el.removeObject3D('mesh');
  }
});

// Óculo: una ventana redonda en el techo, con su brocal de piedra; por ella se ve el cielo de noche, con estrellas, la
// luna y nubes que pasan despacio por delante, y entra un haz de luz de luna, en diagonal, hasta "suelo" (en
// coordenadas de la entidad), con motas que flotan en él. El techo tiene el hueco (salas/menu.html). Origen: el
// centro del hueco, a la altura del techo.
const OCULO_RADIO = 1.4, OCULO_MOTAS = 140;
AFRAME.registerComponent('oculo', {
  schema: { suelo: { type: 'vec3', default: { x: 0, y: -10, z: -3.9 } } },
  init() {
    const R = OCULO_RADIO, g = new THREE.Group(), piedra = new THREE.MeshStandardMaterial({ color: '#7d776c', roughness: 0.95, side: THREE.DoubleSide });
    this.texturas = [];
    // el marco, por debajo del techo (tapa las esquinas del hueco cuadrado), la moldura y el pozo hasta el cielo
    const marco = new THREE.Mesh(new THREE.RingGeometry(R, R + 1.6, 48), piedra);
    marco.rotation.x = Math.PI / 2; marco.position.y = -0.04;
    const moldura = new THREE.Mesh(new THREE.TorusGeometry(R + 0.05, 0.1, 10, 48), piedra);
    moldura.rotation.x = Math.PI / 2; moldura.position.y = -0.07;
    const pozo = new THREE.Mesh(new THREE.CylinderGeometry(R, R, 0.9, 40, 1, true), new THREE.MeshStandardMaterial({ color: '#4e4a44', roughness: 1, side: THREE.BackSide }));
    pozo.position.y = 0.45;
    g.add(marco, moldura, pozo);
    // el cielo: azul de noche, estrellas y la luna, con su halo
    const c = document.createElement('canvas'); c.width = c.height = 512;
    const x = c.getContext('2d'), fondo = x.createRadialGradient(300, 210, 20, 256, 256, 360);
    fondo.addColorStop(0, '#2a3a5e'); fondo.addColorStop(1, '#070b18');
    x.fillStyle = fondo; x.fillRect(0, 0, 512, 512);
    let semilla = 5;
    const azar = () => (semilla = (semilla * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 220; i++) { x.fillStyle = `rgba(235, 240, 255, ${0.3 + azar() * 0.7})`; x.beginPath(); x.arc(azar() * 512, azar() * 512, 0.6 + azar() * 1.4, 0, Math.PI * 2); x.fill(); }
    const halo = x.createRadialGradient(300, 210, 60, 300, 210, 170);
    halo.addColorStop(0, 'rgba(220, 230, 255, 0.45)'); halo.addColorStop(1, 'rgba(220, 230, 255, 0)');
    x.fillStyle = halo; x.fillRect(0, 0, 512, 512);
    const luna = x.createRadialGradient(285, 195, 10, 300, 210, 72);
    luna.addColorStop(0, '#f4f1e6'); luna.addColorStop(1, '#c9c6b8');
    x.fillStyle = luna; x.beginPath(); x.arc(300, 210, 70, 0, Math.PI * 2); x.fill();
    for (const [cx, cy, r] of [[280, 190, 14], [322, 228, 10], [305, 175, 7], [270, 232, 9], [330, 196, 6]]) { x.fillStyle = 'rgba(140, 138, 128, 0.35)'; x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill(); }
    const texCielo = new THREE.CanvasTexture(c); texCielo.colorSpace = THREE.SRGBColorSpace; this.texturas.push(texCielo);
    const cielo = new THREE.Mesh(new THREE.CircleGeometry(R, 48), new THREE.MeshBasicMaterial({ map: texCielo, fog: false }));
    cielo.rotation.x = Math.PI / 2; cielo.position.y = 0.9;
    g.add(cielo);
    // las nubes: jirones grises que giran despacio por delante de la luna
    const n = document.createElement('canvas'); n.width = n.height = 512;
    const y = n.getContext('2d');
    for (let i = 0; i < 26; i++) {
      const px = azar() * 512, py = 120 + azar() * 280, rx = 50 + azar() * 90, ry = 14 + azar() * 22;
      const r = y.createRadialGradient(px, py, 0, px, py, rx);
      r.addColorStop(0, 'rgba(120, 128, 150, 0.55)'); r.addColorStop(1, 'rgba(120, 128, 150, 0)');
      y.fillStyle = r; y.beginPath(); y.ellipse(px, py, rx, ry, 0, 0, Math.PI * 2); y.fill();
    }
    const texNubes = new THREE.CanvasTexture(n); this.texturas.push(texNubes);
    this.nubes = new THREE.Mesh(new THREE.CircleGeometry(R, 48), new THREE.MeshBasicMaterial({ map: texNubes, transparent: true, depthWrite: false, fog: false }));
    this.nubes.rotation.x = Math.PI / 2; this.nubes.position.y = 0.86;
    g.add(this.nubes);
    // el haz de luna, del óculo al suelo
    const arriba = new THREE.Vector3(0, 0, 0), abajo = new THREE.Vector3().copy(this.data.suelo);
    const texHaz = texturaDeHaz('190, 210, 245'); this.texturas.push(texHaz);
    this.haz = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.8, R * 0.7, arriba.distanceTo(abajo), 32, 1, true),
      new THREE.MeshBasicMaterial({ ...sumaLuz(texHaz, 0.22), side: THREE.DoubleSide }));
    this.haz.position.copy(arriba).add(abajo).multiplyScalar(0.5);
    this.haz.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), arriba.clone().sub(abajo).normalize());
    g.add(this.haz);
    // y el charco de luz donde cae
    const texCharco = texturaDeHalo('190, 210, 245', 0.8); this.texturas.push(texCharco);
    this.charco = new THREE.Mesh(new THREE.CircleGeometry(1.3, 32), new THREE.MeshBasicMaterial(sumaLuz(texCharco, 0.5)));
    this.charco.rotation.x = -Math.PI / 2; this.charco.position.copy(abajo).add(new THREE.Vector3(0, 0.03, 0));
    g.add(this.charco);
    // las motas, que bajan despacio por el haz
    this.motas = [];
    for (let i = 0; i < OCULO_MOTAS; i++) this.motas.push({ t: Math.random(), a: Math.random() * Math.PI * 2, r: Math.sqrt(Math.random()) * R * 0.65, v: 0.008 + Math.random() * 0.012 });
    this.geoMotas = new THREE.BufferGeometry();
    this.geoMotas.setAttribute('position', new THREE.BufferAttribute(new Float32Array(OCULO_MOTAS * 3), 3));
    const texMota = texturaDeHalo('235, 240, 255'); this.texturas.push(texMota);
    const motas = new THREE.Points(this.geoMotas, new THREE.PointsMaterial({ ...sumaLuz(texMota, 0.7), color: '#e8eeff', size: 0.025 }));
    motas.frustumCulled = false;
    g.add(motas);
    this.arriba = arriba; this.abajo = abajo;
    this.d = abajo.clone().sub(arriba);
    this.u = new THREE.Vector3(1, 0, 0); this.w = this.d.clone().cross(this.u).normalize();
    this.el.setObject3D('mesh', g);
  },
  tick(t, dt) {
    if (!dt) return;
    const s = t / 1000, p = this.geoMotas.attributes.position.array, centro = new THREE.Vector3();
    this.motas.forEach((m, i) => {
      m.t = (m.t + m.v * dt / 1000) % 1;
      const a = m.a + s * 0.1;
      centro.copy(this.arriba).addScaledVector(this.d, m.t);
      p[i * 3] = centro.x + Math.cos(a) * m.r;
      p[i * 3 + 1] = centro.y + Math.sin(a) * m.r * this.w.y;
      p[i * 3 + 2] = centro.z + Math.sin(a) * m.r * this.w.z;
    });
    this.geoMotas.attributes.position.needsUpdate = true;
    this.nubes.rotation.z = s * 0.02;
    // cuando una nube tapa la luna, la luz baja un poco
    const nube = 0.5 + 0.5 * Math.sin(s * 0.13);
    this.haz.material.opacity = 0.16 + 0.08 * nube;
    this.charco.material.opacity = 0.35 + 0.2 * nube;
  },
  remove() {
    this.el.getObject3D('mesh').traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
    for (const tex of this.texturas) tex.dispose();
    this.el.removeObject3D('mesh');
  }
});

// Mosaico del suelo: una rosa de los vientos de piedras de dos tonos dentro de dos anillos, donde cae la luz del óculo.
// Origen: su centro, en el suelo.
AFRAME.registerComponent('mosaico', {
  schema: { radio: { default: 1.15 } },
  init() {
    const c = document.createElement('canvas'); c.width = c.height = 512;
    const x = c.getContext('2d'), m = 256;
    x.fillStyle = '#9a9386'; x.beginPath(); x.arc(m, m, 254, 0, Math.PI * 2); x.fill();
    x.strokeStyle = '#4a4640'; x.lineWidth = 10; x.stroke();
    x.beginPath(); x.arc(m, m, 228, 0, Math.PI * 2); x.lineWidth = 6; x.stroke();
    // la rosa: ocho puntas, las de los cuatro vientos más largas; cada una, mitad clara y mitad oscura
    for (let i = 0; i < 8; i++) {
      const a = i / 8 * Math.PI * 2, largo = i % 2 ? 140 : 215, ancho = i % 2 ? 26 : 38;
      for (const lado of [-1, 1]) {
        x.fillStyle = lado < 0 ? '#5e574d' : '#c4bcaa';
        x.beginPath(); x.moveTo(m, m);
        x.lineTo(m + Math.sin(a) * largo, m - Math.cos(a) * largo);
        x.lineTo(m + Math.sin(a + lado * Math.PI / 2) * ancho, m - Math.cos(a + lado * Math.PI / 2) * ancho);
        x.closePath(); x.fill();
      }
    }
    x.fillStyle = '#8c7a45'; x.beginPath(); x.arc(m, m, 22, 0, Math.PI * 2); x.fill();
    x.strokeStyle = '#3a3630'; x.lineWidth = 4; x.stroke();
    this.tex = new THREE.CanvasTexture(c); this.tex.colorSpace = THREE.SRGBColorSpace;
    const disco = new THREE.Mesh(new THREE.CircleGeometry(this.data.radio, 48), new THREE.MeshStandardMaterial({ map: this.tex, roughness: 0.85 }));
    disco.rotation.x = -Math.PI / 2;
    this.el.setObject3D('mesh', disco);
  },
  remove() { const d = this.el.getObject3D('mesh'); d.geometry.dispose(); d.material.dispose(); this.tex.dispose(); this.el.removeObject3D('mesh'); }
});

AFRAME.registerComponent('menu-partidas', {
  init() {
    this.lienzo = document.createElement('canvas');
    this.lienzo.width = MENU_ANCHO * MENU_PX; this.lienzo.height = MENU_ALTO * MENU_PX;
    this.tex = new THREE.CanvasTexture(this.lienzo);
    this.tex.colorSpace = THREE.SRGBColorSpace;
    this.tabla = new THREE.Mesh(new THREE.PlaneGeometry(MENU_ANCHO, MENU_ALTO), new THREE.MeshBasicMaterial({ map: this.tex, fog: false }));
    this.el.setObject3D('mesh', this.tabla);
    this.botones = [];
    this.borrando = null;   // la partida que pregunta si se borra
    this.ultimo = 0;
    this.pintar();
  },
  remove() {
    this.quitarBotones();
    this.tabla.geometry.dispose(); this.tabla.material.dispose(); this.tex.dispose();
  },
  quitarBotones() {
    for (const b of this.botones) {
      const m = b.getObject3D('mesh');
      m.geometry.dispose(); m.material.map.dispose(); m.material.dispose();
      b.parentNode.removeChild(b);
    }
    this.botones = [];
  },
  // "columna": 0, el de la izquierda; 1, el de la derecha. El segundo botón de una pregunta cae donde estaba
  // "Borrar", y el "sí" en el otro lado: una doble pulsación no borra nada.
  boton(fila, columna, texto, hacer) {
    const e = document.createElement('a-entity');
    e.classList.add('clicable');
    const m = new THREE.Mesh(new THREE.PlaneGeometry(MENU_BOTON_ANCHO, MENU_BOTON_ALTO), new THREE.MeshBasicMaterial({ map: tablaDeTexto(texto, 368, 104), fog: false }));
    e.setObject3D('mesh', m);
    const x = MENU_ANCHO / 2 - 0.3 - (1 - columna) * (MENU_BOTON_ANCHO + 0.04);
    const y = MENU_ALTO / 2 - (MENU_FILA_Y + (fila + 0.5) * MENU_FILA_ALTO) / MENU_PX;
    e.setAttribute('position', `${x} ${y} 0.01`);
    e.addEventListener('mouseenter', () => m.material.color.set('#ffcc33'));
    e.addEventListener('mouseleave', () => m.material.color.set('#ffffff'));
    e.addEventListener('mousedown', () => {
      if (performance.now() - this.ultimo < 400) return;
      this.ultimo = performance.now();
      hacer();
    });
    this.el.appendChild(e);
    this.botones.push(e);
  },
  pintar() {
    this.quitarBotones();
    const g = this.lienzo.getContext('2d'), W = this.lienzo.width, H = this.lienzo.height;
    fondoDeTabla(g, W, H);
    g.font = '600 72px Georgia, serif'; g.fillText('Tierras del Reino', W / 2, 75);
    g.font = 'italic 34px Georgia, serif'; g.fillText('Elige partida', W / 2, 140);
    for (let i = 0; i < RANURAS; i++) this.pintarPartida(g, i, W);
    g.textAlign = 'center';
    g.font = 'italic 28px Georgia, serif';
    g.fillText('Apunta y aprieta el gatillo (en el ordenador, con la mira y el clic)', W / 2, H - 28);
    this.tex.needsUpdate = true;
  },
  pintarPartida(g, fila, W) {
    const r = fila + 1, s = partida.resumen(r), y = MENU_FILA_Y + fila * MENU_FILA_ALTO;
    g.strokeStyle = '#4a4640'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(40, y); g.lineTo(W - 40, y); g.stroke();
    g.textAlign = 'left'; g.fillStyle = '#d8c7a0';
    g.font = '600 44px Georgia, serif'; g.fillText(`Partida ${r}${r === PARTIDA_DEPURACION ? ' (depuración)' : ''}`, 60, y + 48);
    g.font = '30px Georgia, serif';
    if (!s) {
      g.font = 'italic 30px Georgia, serif'; g.fillText('Vacía', 60, y + 100);
      this.boton(fila, 1, 'Nueva partida', () => partida.abrir(r));
    } else if (this.borrando === r) {
      g.fillText('¿La borras? No se puede recuperar.', 60, y + 100);
      this.boton(fila, 0, 'Sí, borrar', () => { partida.borrar(r); this.borrando = null; this.pintar(); });
      this.boton(fila, 1, 'No', () => { this.borrando = null; this.pintar(); });
    } else {
      g.fillText(`Día ${s.dia}  ·  ${s.zona}  ·  ${s.monedas} ${s.monedas === 1 ? 'moneda' : 'monedas'}`, 60, y + 100);
      g.font = 'italic 27px Georgia, serif';
      g.fillText(`${s.mision ? 'Misión: ' + s.mision : 'Sin misión'}${s.fecha ? '  ·  ' + new Date(s.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : ''}`, 60, y + 148, W - 720);
      this.boton(fila, 0, 'Continuar', () => partida.abrir(r));
      this.boton(fila, 1, 'Borrar', () => { this.borrando = r; this.pintar(); });
    }
  },
});
