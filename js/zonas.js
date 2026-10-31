// Editor VR: zonas del mundo. Solo hay una cargada a la vez: al cruzar un límite se descarga la que
// se deja y se carga la nueva, sin salir de VR. Todas usan las coordenadas del mundo, así que el
// jugador no se teletransporta: el camino sigue. Qué zonas hay y dónde: js/mundo.js. Una niebla densa tapa el cambio: se espesa al
// acercarse al límite, cierra del todo mientras se carga y se abre al terminar.

const RADIO_NIEBLA = 10;        // a esta distancia del límite empieza a notarse
const NIEBLA_LIMITE = 0.28;     // densidad justo en el límite (a 10 m ya no se ve nada)
const NIEBLA_CERRADA = 3;       // densidad mientras se carga: no se ve ni el suelo
const CERRAR_MS = 600, ABRIR_MS = 1500;
// Letrero con el nombre de la zona al entrar: aparece, se queda y se desvanece.
const LETRERO_APARECE_MS = 500, LETRERO_DURA_MS = 3500, LETRERO_SE_VA_MS = 1000;

AFRAME.registerComponent('zonas', {
  init() {
    // la niebla existe desde el principio, aunque sea con densidad 0: ponerla después obligaría a
    // recompilar todos los materiales y daría un tirón
    this.niebla = new THREE.FogExp2(MUNDO.castillo.niebla, 0);
    this.el.object3D.fog = this.niebla;
    this.cielo = new THREE.Color(MUNDO.castillo.fondo);
    this.colorNiebla = new THREE.Color(MUNDO.castillo.niebla);
    this.cabeza = new THREE.Vector3();
    this.cierre = 1;      // 0 abierta, 1 cerrada; se arranca cerrada mientras carga la primera zona
    this.actual = null;   // nombre de la zona cargada
    this.raiz = null;     // entidad con las estancias de la zona
    this.crearLetrero();
    // Para comparar: el botón A, o la tecla H, recarga la zona con la otra luz, sin salir de VR
    window.addEventListener('keydown', e => { if (e.code === 'KeyH') this.cambiarLuz(); });
    const enganchar = () => {
      const m = document.querySelector('[laser-controls="hand: right"]');
      if (!m) return setTimeout(enganchar, 500);
      m.addEventListener('abuttondown', () => this.cambiarLuz());
    };
    enganchar();
  },
  cambiarLuz() {
    if (cambiandoDeZona || !this.actual) return;
    luzHorneada = !luzHorneada;
    const medidor = this.el.components.medidor;
    this.ir(this.actual).then(() => { if (medidor) { medidor.peor = Infinity; medidor.calentando = 1500; } });
  },
  // Tabla de madera oscura con el nombre en un canvas. Va pegada a la cámara, a 2 m (más cerca
  // cansa la vista en VR), sin niebla y por delante de todo. Oculta hasta que se entra en una zona.
  crearLetrero() {
    this.lienzo = document.createElement('canvas');
    this.lienzo.width = 768; this.lienzo.height = 192;
    this.texLetrero = new THREE.CanvasTexture(this.lienzo);
    this.texLetrero.colorSpace = THREE.SRGBColorSpace;
    this.letrero = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.3),
      new THREE.MeshBasicMaterial({ map: this.texLetrero, transparent: true, opacity: 0, depthTest: false, depthWrite: false, fog: false }));
    this.letrero.position.set(0, 0.3, -2);
    this.letrero.renderOrder = 998;
    this.letrero.visible = false;
    this.letreroMs = 0;
  },
  mostrarLetrero(titulo) {
    const g = this.lienzo.getContext('2d'), W = this.lienzo.width, H = this.lienzo.height;
    g.clearRect(0, 0, W, H);
    g.fillStyle = '#2e2116'; g.fillRect(0, 0, W, H);
    g.strokeStyle = '#17100a'; g.lineWidth = 3;
    for (const y of [48, 96, 144]) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }   // juntas de los tablones
    g.strokeStyle = '#4a4640'; g.lineWidth = 10; g.strokeRect(5, 5, W - 10, H - 10);                // fleje de hierro
    let letra = 92;   // más pequeña si el nombre no cabe
    g.font = `600 ${letra}px Georgia, serif`;
    const cabe = g.measureText(titulo).width;
    if (cabe > W - 60) { letra = Math.floor(letra * (W - 60) / cabe); g.font = `600 ${letra}px Georgia, serif`; }
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillStyle = '#d8c7a0'; g.fillText(titulo, W / 2, H / 2 + 5);
    this.texLetrero.needsUpdate = true;
    if (this.letrero.parent !== this.el.camera.el.object3D) this.el.camera.el.object3D.add(this.letrero);
    this.letrero.visible = true;
    this.letreroMs = LETRERO_APARECE_MS + LETRERO_DURA_MS + LETRERO_SE_VA_MS;
  },
  pasarLetrero(dt) {
    if (!this.letrero.visible) return;
    this.letreroMs -= dt;
    if (this.letreroMs <= 0) { this.letrero.visible = false; return; }
    const pasado = LETRERO_APARECE_MS + LETRERO_DURA_MS + LETRERO_SE_VA_MS - this.letreroMs;
    this.letrero.material.opacity = Math.min(1, pasado / LETRERO_APARECE_MS, this.letreroMs / LETRERO_SE_VA_MS);
  },
  tick(t, dt) {
    const c = this.el.camera;
    if (!c) return;
    c.getWorldPosition(this.cabeza);
    // la primera vez, cuando ya se ha vuelto al sitio guardado: cargar la zona donde se está
    if (!this.actual && !cambiandoDeZona) this.ir((zonaEn(this.cabeza.x, this.cabeza.z) || MUNDO.castillo).nombre);
    if (!cambiandoDeZona) {
      // (con medio metro de margen: justo en el límite, el cambio no se dispara dos veces)
      const aqui = zonaEn(this.cabeza.x, this.cabeza.z, 0.5);
      if (this.actual && aqui && aqui.nombre !== this.actual) this.ir(aqui.nombre);
    }
    // cerrar mientras se cambia de zona; abrir cuando ya ha cargado
    const paso = Math.min(dt || 0, 100);
    this.cierre = this.abriendo
      ? Math.max(0, this.cierre - paso / ABRIR_MS)
      : cambiandoDeZona ? Math.min(1, this.cierre + paso / CERRAR_MS) : this.cierre;
    this.pintar();
    this.pasarLetrero(paso);
  },
  // densidad de la niebla y color del cielo, según lo cerca que se está del límite y del cierre
  pintar() {
    const d = Math.min(...PASOS.map(p => Math.hypot(this.cabeza.x - p.x, this.cabeza.z - p.z)));
    const cerca = Math.max(0, 1 - d / RADIO_NIEBLA);
    const base = NIEBLA_LIMITE * cerca * cerca;
    this.niebla.density = base + (NIEBLA_CERRADA - base) * this.cierre * this.cierre;
    const fondo = this.el.object3D.background;
    if (fondo && fondo.isColor) fondo.copy(this.cielo).lerp(this.colorNiebla, Math.max(Math.min(1, cerca * 1.6), this.cierre));
  },
  ponerAtmosfera(a) {
    this.el.components.cielo.poner(a.cielo);
    this.niebla.color.set(a.niebla); this.colorNiebla.set(a.niebla); this.cielo.set(a.fondo);
    document.getElementById('luz-ambiente').setAttribute('light', a.ambiente);
    const sol = document.getElementById('luz-sol');
    sol.setAttribute('light', a.sol);
    sol.object3D.position.set(...CIELOS[a.cielo].sol);
  },
  async ir(nombre) {
    cambiandoDeZona = true;
    this.abriendo = false;
    while (this.cierre < 1) await new Promise(r => setTimeout(r, 30));
    await new Promise(r => setTimeout(r, 50));   // que se dibuje ya con la niebla cerrada
    if (this.raiz) {
      liberarEstancia(this.raiz);
      this.raiz.parentNode.removeChild(this.raiz);
      SUPERFICIES.length = 0;
    }
    zonaCargada = MUNDO[nombre];
    this.ponerAtmosfera(MUNDO[nombre]);
    const raiz = this.raiz = document.createElement('a-entity');
    const cargadas = MUNDO[nombre].salas.map(sala => {
      const e = document.createElement('a-entity');
      e.setAttribute('incluir', `salas/${sala}.html`);
      raiz.appendChild(e);
      return new Promise(r => e.addEventListener('incluida', r, { once: true }));
    });
    this.el.appendChild(raiz);
    await Promise.all(cargadas);
    await this.el.systems.arbol.listo;   // que no aparezcan de golpe al abrirse la niebla
    this.actual = nombre;
    const r = this.el.renderer.info.memory;
    console.log(`Zona ${nombre}: ${r.geometries} geometrías, ${r.textures} texturas`);
    this.abriendo = true;
    this.mostrarLetrero(!luzHorneada ? 'Sin hornear' : MUNDO[nombre].titulo);
    while (this.cierre > 0.4) await new Promise(r => setTimeout(r, 30));
    cambiandoDeZona = false;   // ya se puede andar, aunque aún se esté abriendo
    while (this.abriendo && this.cierre > 0 && !cambiandoDeZona) await new Promise(r => setTimeout(r, 50));
    if (!cambiandoDeZona) this.abriendo = false;
  }
});
