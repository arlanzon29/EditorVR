// Editor VR: medidor de rendimiento.
// Un cartelito con las imágenes por segundo (y la peor desde que se encendió), las llamadas de
// dibujo, los triángulos y las luces puntuales encendidas. En VR va sobre el mando izquierdo; en el
// ordenador, arriba a la izquierda de la vista. Se enciende y se apaga apretando el joystick
// izquierdo (hacia dentro) o con la tecla M. Sirve para ver cuánto margen queda en el Quest.

AFRAME.registerComponent('medidor', {
  init() {
    this.lienzo = document.createElement('canvas');
    this.lienzo.width = 512; this.lienzo.height = 224;
    this.tex = new THREE.CanvasTexture(this.lienzo);
    this.tex.colorSpace = THREE.SRGBColorSpace;
    // siempre por delante de todo (sin prueba de profundidad), para que no lo tape nada
    this.panel = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.0875),
      new THREE.MeshBasicMaterial({ map: this.tex, transparent: true, depthTest: false }));
    this.panel.renderOrder = 999;
    this.panel.visible = false;
    this.cuadros = 0; this.ms = 0; this.peor = Infinity; this.calentando = 0;
    const alternar = () => { this.panel.visible = !this.panel.visible; this.peor = Infinity; this.calentando = 1500; };
    window.addEventListener('keydown', e => { if (e.code === 'KeyM') alternar(); });
    const mando = () => document.querySelector('[laser-controls="hand: left"]');
    const enganchar = () => { const m = mando(); if (m) m.addEventListener('thumbstickdown', alternar); else setTimeout(enganchar, 500); };
    enganchar();
    // en VR, sobre el mando izquierdo, inclinado hacia ti; fuera, pegado a la cámara
    this.colocar = () => {
      const enVR = this.el.is('vr-mode'), m = mando();
      if (enVR && m) {
        m.object3D.add(this.panel);
        this.panel.position.set(0, 0.07, -0.06); this.panel.rotation.set(-0.8, 0, 0); this.panel.scale.setScalar(1);
      } else {
        this.el.camera.el.object3D.add(this.panel);
        this.panel.position.set(-0.19, 0.12, -0.5); this.panel.rotation.set(0, 0, 0); this.panel.scale.setScalar(0.9);
      }
    };
    this.el.addEventListener('enter-vr', () => setTimeout(this.colocar, 300));
    this.el.addEventListener('exit-vr', this.colocar);
    if (this.el.hasLoaded) this.colocar(); else this.el.addEventListener('loaded', this.colocar, { once: true });
  },
  tick(t, dt) {
    if (!this.panel.visible || !dt) return;
    this.cuadros++; this.ms += dt;
    if (this.calentando > 0) this.calentando -= dt;   // el primer segundo y medio no cuenta para "peor"
    if (this.ms < 500) return;
    const fps = this.cuadros * 1000 / this.ms;
    this.cuadros = 0; this.ms = 0;
    if (this.calentando <= 0) this.peor = Math.min(this.peor, fps);
    // lo que dibujó el último fotograma (en VR, los dos ojos juntos)
    const info = this.el.renderer.info.render;
    let luces = 0;
    this.el.object3D.traverseVisible(o => { if (o.isPointLight && o.intensity > 0) luces++; });
    const g = this.lienzo.getContext('2d'), W = this.lienzo.width, H = this.lienzo.height;
    g.clearRect(0, 0, W, H);
    g.fillStyle = 'rgba(20, 24, 32, 0.85)'; g.fillRect(0, 0, W, H);
    g.font = '600 46px monospace'; g.textBaseline = 'top';
    g.fillStyle = fps >= 70 ? '#7be07b' : fps >= 55 ? '#f0d060' : '#f07060';
    g.fillText(`${fps.toFixed(0)} img/s`, 20, 14);
    g.font = '32px monospace'; g.fillStyle = '#c8c8c8';
    g.fillText(`peor ${isFinite(this.peor) ? this.peor.toFixed(0) : '–'}`, 290, 24);
    g.fillStyle = '#ffffff';
    g.fillText(`${info.calls} llamadas${this.el.is('vr-mode') ? ' (2 ojos)' : ''}`, 20, 80);
    g.fillText(`${(info.triangles / 1000).toFixed(1)} mil triángulos`, 20, 124);
    g.fillText(`${luces} luces`, 20, 168);
    this.tex.needsUpdate = true;
  }
});
