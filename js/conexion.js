// Editor VR: conexión con el PC y con Claude.
// Pantalla del PC en la pared, objetos que se cogen con el gatillo lateral e informe de posición.

// Pantalla del PC en la pared: pide al servidor local una captura del escritorio
// (/__pantalla.jpg) en cuanto llega la anterior, como mucho una por segundo.
// Si no hay servidor (p. ej. abriendo el archivo directamente), muestra "Sin imagen del PC".
AFRAME.registerComponent('pantalla-pc', {
  schema: { cada: { default: 1000 } },   // ms entre capturas
  init() {
    this.tex = null;
    this.aviso = this.el.querySelector('a-text');
    this.marco = this.el.parentNode.querySelector('.marco');
    this.pedir = this.pedir.bind(this);
    this.pedir();
  },
  pedir() {
    const img = new Image(), t0 = performance.now();
    img.onload = () => {
      this.mostrar(img);
      setTimeout(this.pedir, Math.max(0, this.data.cada - (performance.now() - t0)));
    };
    img.onerror = () => { this.aviso.setAttribute('visible', true); setTimeout(this.pedir, 3000); };
    img.src = '/__pantalla.jpg?t=' + Date.now();
  },
  mostrar(img) {
    const malla = this.el.getObject3D('mesh');
    if (!malla) return;
    this.aviso.setAttribute('visible', false);
    const t = this.tex;
    if (t && t.image.width === img.width && t.image.height === img.height) {
      t.image = img;
      t.needsUpdate = true;
      return;
    }
    // primera imagen o cambio de resolución: textura nueva y alto según la proporción
    if (t) t.dispose();
    this.tex = new THREE.Texture(img);
    this.tex.colorSpace = THREE.SRGBColorSpace;
    this.tex.anisotropy = 8;
    this.tex.needsUpdate = true;
    malla.material.map = this.tex;
    malla.material.color.set('#ffffff');
    malla.material.needsUpdate = true;
    const ancho = parseFloat(this.el.getAttribute('width'));
    const alto = ancho * img.height / img.width;
    this.el.setAttribute('height', alto);
    this.marco.setAttribute('height', alto + 0.06);
  }
});

// Objetos que se cogen con el gatillo lateral (grip): apuntar con el rayo y apretarlo.
// Mientras está apretado, el objeto sigue al mando como si estuviera en la mano;
// al soltarlo se queda donde esté. Al apuntarlo, el marco se ilumina.
// Con 'clave', además: el botón B o Y lo trae delante de la cabeza, mirándote, y el sitio
// donde se deja se guarda en el navegador para que siga ahí al recargar.
AFRAME.registerComponent('agarrable', {
  schema: { clave: { default: '' } },
  init() {
    this.mano = null;                      // mando que lo tiene cogido
    this.offset = new THREE.Matrix4();     // posición del objeto respecto al mando
    this.marco = this.el.querySelector('.marco');
    this.iluminado = false;
    for (const m of this.el.sceneEl.querySelectorAll('[laser-controls]')) {
      m.addEventListener('gripdown', () => this.coger(m));
      m.addEventListener('gripup', () => { if (this.mano === m) { this.mano = null; this.guardar(); } });
      if (this.data.clave) for (const b of ['bbuttondown', 'ybuttondown']) m.addEventListener(b, () => this.traer());
    }
    if (this.data.clave) {
      const volver = () => {
        try {
          const p = JSON.parse(localStorage.getItem(this.data.clave));
          if (p) { this.el.object3D.position.fromArray(p.pos); this.el.object3D.quaternion.fromArray(p.giro); }
        } catch (e) {}
      };
      if (this.el.sceneEl.hasLoaded) volver(); else this.el.sceneEl.addEventListener('loaded', volver, { once: true });
    }
  },
  traer() {
    const cam = this.el.sceneEl.camera.el.object3D;
    const cabeza = cam.getWorldPosition(new THREE.Vector3());
    const delante = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.getWorldQuaternion(new THREE.Quaternion()));
    delante.y = 0; delante.normalize();
    const o = this.el.object3D;
    o.position.copy(cabeza).addScaledVector(delante, 1.3);
    o.lookAt(cabeza.x, o.position.y, cabeza.z);   // de frente, sin inclinar
    this.guardar();
  },
  guardar() {
    if (!this.data.clave) return;
    const o = this.el.object3D;
    try { localStorage.setItem(this.data.clave, JSON.stringify({ pos: o.position.toArray(), giro: o.quaternion.toArray() })); } catch (e) {}
  },
  apunta(m) {
    const r = m.components.raycaster;
    return !!r && r.intersectedEls.some(e => this.el.contains(e));
  },
  coger(m) {
    if (this.mano || !this.apunta(m)) return;
    this.mano = m;
    m.object3D.updateMatrixWorld();
    this.el.object3D.updateMatrixWorld();
    this.offset.copy(m.object3D.matrixWorld).invert().multiply(this.el.object3D.matrixWorld);
  },
  tick() {
    const o = this.el.object3D;
    if (this.mano) {
      // el objeto cuelga directamente de la escena, así que su matriz local es la del mundo
      const m = this.mano.object3D.matrixWorld.clone().multiply(this.offset);
      m.decompose(o.position, o.quaternion, o.scale);
    }
    const ilumina = !!this.mano || [...this.el.sceneEl.querySelectorAll('[laser-controls]')].some(m => this.apunta(m));
    if (ilumina !== this.iluminado) {
      this.iluminado = ilumina;
      this.marco.setAttribute('material', 'emissive', ilumina ? '#3a6fd8' : '#000');
    }
  }
});

// Informe de posición para Claude: cada segundo manda al servidor (POST /__posicion)
// dónde está la cabeza, en qué zona, hacia dónde mira y qué punto de la escena tiene
// delante (rayo desde el centro de la vista). Así se pueden colocar cosas "donde estoy" o
// "donde miro". Coordenadas en metros: x hacia la puerta/pasillo, y hacia arriba, z hacia
// la pared del fondo de la primera sala (la de la ventana está en z = -3).
AFRAME.registerComponent('informe-posicion', {
  init() {
    this.rayo = new THREE.Raycaster();
    this.rayo.far = 30;
    setInterval(() => this.enviar(), 1000);
  },
  enviar() {
    if (document.hidden) return;   // solo informa la página que se está usando
    const cam = this.el.querySelector('[camera]').object3D;
    const cabeza = cam.getWorldPosition(new THREE.Vector3());
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.getWorldQuaternion(new THREE.Quaternion()));
    const andar = document.querySelector('[andar-joystick]')?.components['andar-joystick'];
    const rigY = andar ? andar.altura : document.getElementById('rig').object3D.position.y;   // altura del suelo que pisa
    const zona = dentro(cabeza, SALA) ? 'sala 1' : dentro(cabeza, PASILLO) ? 'pasillo' : dentro(cabeza, SALA2) ? 'sala 2' : dentro(cabeza, PASILLO2) ? 'pasillo 2' : dentro(cabeza, SALA3) ? (rigY > 2 ? (rigY > 4.3 ? 'sala 3 (rellano de arriba)' : 'sala 3 (en la escalera)') : 'sala 3') : rigY > 4.3 && [ARCO_ARRIBA, ...PASILLOS_ARRIBA].some(z => dentro(cabeza, z)) ? 'pasillos de arriba (sala 3)' : [COMEDOR, PASO_COMEDOR].some(z => dentro(cabeza, z)) ? 'comedor' : [PATIO, PASO_PATIO].some(z => dentro(cabeza, z)) ? 'patio' : 'fuera';
    // ¿qué tiene delante? (solo mallas visibles, sin el rig ni los rayos de los mandos)
    const rig = document.getElementById('rig').object3D;
    const mallas = [];
    this.el.object3D.traverseVisible(o => {
      if (!o.isMesh || !o.material || o.material.visible === false) return;
      for (let p = o; p; p = p.parent) if (p === rig) return;
      mallas.push(o);
    });
    this.rayo.set(cabeza, dir);
    const toca = this.rayo.intersectObjects(mallas, false)[0];
    let mira = null;
    if (toca) {
      let el = toca.object.el;
      while (el && !el.tagName.startsWith('A-')) el = el.parentNode;
      const n = toca.face ? toca.face.normal.clone().transformDirection(toca.object.matrixWorld) : null;
      mira = {
        punto: r3(toca.point), distancia: +toca.distance.toFixed(2),
        normal: n && r3(n),
        objeto: el && { etiqueta: el.tagName.toLowerCase(), clase: el.className || undefined,
                        color: el.getAttribute('color') || undefined, posicion: r3(el.object3D.getWorldPosition(new THREE.Vector3())) }
      };
    }
    const informe = {
      hora: new Date().toLocaleTimeString(), vr: this.el.is('vr-mode'), zona,
      cabeza: r3(cabeza), suelo: r3({ x: cabeza.x, y: rigY, z: cabeza.z }),
      direccion: r3(dir), rumbo: Math.round(THREE.MathUtils.radToDeg(Math.atan2(dir.x, -dir.z))),   // 0 = hacia z negativa (ventana), 90 = hacia x positiva (puerta)
      mira,
      // mandos que ve el navegador (el de Xbox en el PC): ejes, botones pulsados y el reposo que
      // se le restó a cada eje, para ver qué marca si el movimiento no va bien
      mandos: navigator.getGamepads ? [...navigator.getGamepads()].filter(Boolean).map(g => ({
        id: g.id, mapping: g.mapping, ejes: g.axes.map(v => +v.toFixed(2)),
        botones: g.buttons.map((b, i) => b.pressed ? i : -1).filter(i => i >= 0)
      })) : [],
      reposoMando: (document.querySelector('[andar-joystick]')?.components['andar-joystick']?.reposo || []).map(v => +v.toFixed(2))
    };
    fetch('/__posicion', { method: 'POST', body: JSON.stringify(informe) }).catch(() => {});
  }
});
const r3 = v => ({ x: +v.x.toFixed(2), y: +v.y.toFixed(2), z: +v.z.toFixed(2) });
