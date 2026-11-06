// Editor VR: zonas del mundo. Solo hay una cargada a la vez: al cruzar un límite se descarga la que
// se deja y se carga la nueva, sin salir de VR. Todas usan las coordenadas del mundo, así que el
// jugador no se teletransporta: el camino sigue. Qué zonas hay y dónde: js/mundo.js. Una niebla densa tapa el cambio: se espesa al
// acercarse al límite, cierra del todo mientras se carga y se abre al terminar.

const RADIO_NIEBLA = 10;        // a esta distancia del límite empieza a notarse
const NIEBLA_LIMITE = 0.28;     // densidad justo en el límite (a 10 m ya no se ve nada)
const NIEBLA_CERRADA = 3;       // densidad mientras se carga: no se ve ni el suelo
const CERRAR_MS = 600, ABRIR_MS = 1500;
const NO_PREGUNTAR_MS = 1500;   // tras decir que no a pagar una zona, tanto rato sin volver a preguntar
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
    this.bueno = new THREE.Vector3();   // el último sitio donde se estaba sin meterse en una zona sin pagar
    this.cierre = 1;      // 0 abierta, 1 cerrada; se arranca cerrada mientras carga la primera zona
    this.actual = null;   // nombre de la zona cargada
    this.pregunta = null; // la de si se pagan los puntos de la zona (cruzar)
    this.noHasta = 0;     // hasta cuándo no se vuelve a preguntar, tras decir que no
    this.raiz = null;     // entidad con las estancias de la zona
    this.crearLetrero();
    // Para comparar: apretar el joystick derecho, o la tecla H, recarga la zona con la otra luz, sin salir de VR
    window.addEventListener('keydown', e => { if (e.code === 'KeyH') this.cambiarLuz(); });
    const enganchar = () => {
      const m = document.querySelector('[laser-controls="hand: right"]');
      if (!m) return setTimeout(enganchar, 500);
      // pulsado, la luz horneada; mantenido, la resolución en las gafas (js/rendimiento.js)
      let desde = 0;
      m.addEventListener('thumbstickdown', () => { desde = performance.now(); });
      m.addEventListener('thumbstickup', () => { if (performance.now() - desde >= 1000) cambiarEscalaVR(); else this.cambiarLuz(); });
    };
    enganchar();
  },
  // (solo en la partida de depuración)
  cambiarLuz() {
    if (cambiandoDeZona || !this.actual || !partida.depuracion()) return;
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
    // la primera vez: el menú o, si se ha recargado la página jugando, la partida de antes
    if (!this.actual && !cambiandoDeZona) {
      partida.arrancar();
    }
    if (!cambiandoDeZona && this.actual) {
      const justo = zonaEn(this.cabeza.x, this.cabeza.z), ajena = justo && justo.nombre !== this.actual;
      const esperando = this.pregunta || performance.now() < this.noHasta;
      const rig = document.getElementById('rig').object3D;
      if (ajena && (esperando || !partida.puedeEntrar(justo.nombre))) {
        // sin puntos para esa zona, o mientras se pregunta si se paga, no se cruza: de vuelta al sitio de antes
        // (también si se ha ido andando de verdad)
        rig.position.x += this.bueno.x - this.cabeza.x;
        rig.position.z += this.bueno.z - this.cabeza.z;
        if (!esperando) partida.entrar(justo.nombre);
      } else {
        // (el sitio bueno, solo dentro de la zona: si se dice que no, se vuelve ahí)
        if (!ajena) this.bueno.copy(this.cabeza);
        // (con medio metro de margen: justo en el límite, el cambio no se dispara dos veces)
        const aqui = zonaEn(this.cabeza.x, this.cabeza.z, 0.5);
        if (aqui && aqui.nombre !== this.actual) this.cruzar(aqui.nombre, { x: rig.position.x, y: rig.position.y, z: rig.position.z, giro: rig.rotation.y });
      }
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
  // Ir a otra zona pagando la entrada, o "precio" si se indica (js/partida.js). Si los puntos llegan, antes se
  // pregunta (js/pregunta.js): "viaje" dice si es por el mapa, y "alIr" se llama cuando ya se va.
  // Devuelve si se va o se está preguntando.
  cruzar(nombre, destino, precio = partida.precio(nombre), { viaje = false, alIr } = {}) {
    if (cambiandoDeZona || this.pregunta) return false;
    const ir = () => {
      if (cambiandoDeZona || !partida.entrar(nombre, precio)) return false;
      if (alIr) alIr();
      this.ir(nombre, destino);
      return true;
    };
    if (!partida.ranura || nombre === zonaCargada.nombre || partida.estado.puntos < precio || !partida.abierta(nombre)) return ir();
    this.pregunta = preguntarGasto({ que: viaje ? 'viaje' : 'andar', de: this.actual, a: nombre, precio, alResponder: si => {
      this.pregunta = null;
      // si no, un momento sin volver a preguntar, aunque se siga empujando hacia el paso
      if (si) ir(); else this.noHasta = performance.now() + NO_PREGUNTAR_MS;
    } });
    return true;
  },
  // "destino" (x, z, giro): para los portales, que te llevan a otro sitio mientras la niebla está cerrada
  async ir(nombre, destino) {
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
    mallaTerreno = null;
    if (destino) {
      const rig = document.getElementById('rig').object3D, y = destino.y ?? alturaTerreno(destino.x, destino.z);
      rig.position.set(destino.x, y, destino.z);
      rig.rotation.y = destino.giro || 0;
      const andar = document.querySelector('[andar-joystick]').components['andar-joystick'];
      if (andar) andar.altura = y;
    }
    this.ponerAtmosfera(partida.deNoche(nombre) ? MUNDO[nombre].noche : MUNDO[nombre]);
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
    if (nombre !== 'menu') this.mostrarLetrero(!luzHorneada ? 'Sin hornear' : MUNDO[nombre].titulo);
    while (this.cierre > 0.4) await new Promise(r => setTimeout(r, 30));
    cambiandoDeZona = false;   // ya se puede andar, aunque aún se esté abriendo
    partida.zonaLista = !!partida.ranura;
    partida.comprobarPaso();
    while (this.abriendo && this.cierre > 0 && !cambiandoDeZona) await new Promise(r => setTimeout(r, 50));
    if (!cambiandoDeZona) this.abriendo = false;
  }
});
