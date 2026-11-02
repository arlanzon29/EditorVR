// Editor VR: la boda del camarero, en la plaza del poblado. Al día siguiente de entregar el pescado sale una
// mesa con el banquete, los novios y los invitados, y una silla libre. Al apuntarla y apretar el gatillo te
// sientas: no se anda, la vista baja a la altura de la mesa y se oyen los brindis hasta que te levantas.
// No se hornea (NO_FUNDIR): solo existe ese día. Cuándo: partida.bodaHoy, en js/partida.js.

const SILLA_BODA = { x: 161, z: -136.05 };   // la silla libre, en el lado norte, frente a los novios
const ALTURA_SENTADO = 1.15;                 // a qué altura quedan los ojos
const BODA_FRASE_MS = 7000;
// Al sentarte: hasta que brindes (coger tu copa) no te puedes levantar. Lo dice el tutorial (partida.pasoTutorial) o,
// si ya se acabó, un aviso.
const BRINDAR_TEXTO = 'Brinda por los novios: acerca la mano a la copa que tienes delante, cógela con el gatillo lateral y álzala. Hasta que brindes no te puedes levantar.';
// El brindis: cuándo acaba de alargar el brazo y coge la copa, cuándo la tiene en alto, cuándo empieza a bajarla, cuándo
// la deja y cuándo acaba; y los ángulos del brazo, junto a la mesa y en alto
const BRINDIS_COGE_MS = 450, BRINDIS_ALZA_MS = 950, BRINDIS_BAJA_MS = 2900, BRINDIS_DEJA_MS = 3350, BRINDIS_MS = 4100;
const BRAZO_MESA = -0.8, BRAZO_ALTO = -1.35;
// dónde queda la mano respecto al hombro, en el modelo (herramientas/modelar-cliente-sentado.py)
const MANO_DEL_BRAZO = [-0.085, -0.37, 0.21];
// y dónde cae su copa en la mesa: a su derecha y por delante, justo donde llega con el brazo en BRAZO_MESA
// Los novios, en el brindis: de dónde a dónde van (x) y cuándo llegan, cuándo se vuelven y cuándo están de vuelta
// (medido en Blender, en la pose del beso: boca del novio, 0,164 por delante y 1,513 de alto; la de la novia, que ladea la
// cabeza, 0,115 por delante, 1,517 de alto y 0,057 a un lado. Por eso se paran a 0,284, y ella se corre ese poco)
const NOVIO_X = 160.4, NOVIA_X = 161.6, NOVIO_BESO = 160.858, NOVIA_BESO = 161.142, NOVIOS_Z = -138.2, NOVIA_LADEO = -0.057;
const NOVIOS_LLEGAN_MS = 1100, NOVIOS_VUELVEN_MS = 3000, NOVIOS_ACABAN_MS = 4100;
const COPA_AL_LADO = 0.305, COPA_DELANTE = 0.411, ALTO_MESA = 0.782;
const FRASES_BODA = [
  'El novio se pone en pie: «Gracias por venir. El pescado de esta mesa lo trajo quien está ahí sentado».',
  'Todos alzan las copas por los novios.',
  'La novia: «Comed y bebed, que hoy nadie se queda con hambre».',
];
// x, z, giro, túnica, camisa. Los del lado sur miran al norte; los novios, de pie, aparte.
const GENTE_BODA = [
  [158.6, -137.85, 0, '#4d4436', '#6a6252'],
  [163.4, -137.85, 0, '#5c4a58', '#6a6252'],
  [158, -136.15, 180, '#3f4a5c', '#736b5a'],
  [159.4, -136.15, 180, '#5a4436', '#6d6656'],
  [162.6, -136.15, 180, '#4d5a44', '#7a7262'],
  [164, -136.15, 180, '#6b4a3a', '#6a6252'],
];

// El grito de la mesa, "¡hu-rra!" a varias voces, hecho con el navegador (sin archivos de sonido): cada voz es una
// onda que pasa por dos filtros que hacen de vocal, de la u a la a, y debajo, un murmullo de ruido.
let sonidoBoda = null;
function gritoDeBrindis() {
  try {
    sonidoBoda = sonidoBoda || new (window.AudioContext || window.webkitAudioContext)();
    const ctx = sonidoBoda, t0 = ctx.currentTime + 0.02;
    ctx.resume();
    const salida = ctx.createGain();
    salida.gain.value = 0.5;
    salida.connect(ctx.destination);
    for (let i = 0; i < 9; i++) {
      const t = t0 + Math.random() * 0.14, tono = 150 + Math.random() * 170;
      const voz = ctx.createOscillator(), f1 = ctx.createBiquadFilter(), f2 = ctx.createBiquadFilter(), g = ctx.createGain();
      voz.type = 'sawtooth';
      voz.frequency.setValueAtTime(tono * 0.9, t);
      voz.frequency.linearRampToValueAtTime(tono * 1.05, t + 0.3);
      voz.frequency.linearRampToValueAtTime(tono * 1.3, t + 0.65);
      voz.frequency.linearRampToValueAtTime(tono * 0.95, t + 1.5);
      for (const [f, q, u, a] of [[f1, 7, 350, 850], [f2, 9, 800, 1300]]) {
        f.type = 'bandpass'; f.Q.value = q;
        f.frequency.setValueAtTime(u, t + 0.25);
        f.frequency.linearRampToValueAtTime(a, t + 0.55);
        voz.connect(f); f.connect(g);
      }
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.16, t + 0.08);
      g.gain.setValueAtTime(0.11, t + 0.3);
      g.gain.linearRampToValueAtTime(0.2, t + 0.6);
      g.gain.linearRampToValueAtTime(0, t + 1.5);
      g.connect(salida);
      voz.start(t); voz.stop(t + 1.55);
    }
    const n = Math.floor(ctx.sampleRate * 1.8), datos = ctx.createBuffer(1, n, ctx.sampleRate), d = datos.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const ruido = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    ruido.buffer = datos; f.type = 'bandpass'; f.frequency.value = 1100; f.Q.value = 0.7;
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(0.07, t0 + 0.25);
    g.gain.linearRampToValueAtTime(0, t0 + 1.8);
    ruido.connect(f); f.connect(g); g.connect(salida);
    ruido.start(t0);
  } catch (e) {}   // sin sonido, el brindis sigue
}

// Persona con esqueleto y animaciones (herramientas/modelar-novio.py, modelar-novia.py). poner() cambia de animación con
// un fundido; con "unaVez", al acabar vuelve sola al reposo. En reposo, la cabeza se gira hacia quien se acerca.
AFRAME.registerComponent('persona-animada', {
  schema: { modelo: { default: '' }, macizo: { default: true } },
  init() {
    this.el.setAttribute('gltf-model', `url(modelos/${this.data.modelo}.glb)`);
    this.mezcla = null; this.nombre = null; this.accion = null; this.mira = 0; this.ojo = new THREE.Vector3();
    this.el.addEventListener('model-loaded', e => {
      const modelo = e.detail.model;
      // fuera de la vista no se dibuja: el tamaño de reposo no sirve al moverse, así que una esfera que le cabe con los brazos extendidos
      modelo.traverse(o => { if (o.isSkinnedMesh) o.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0.9, 0), 1.6); });
      this.cabeza = modelo.getObjectByName('cabeza');
      this.clips = modelo.animations;
      this.mezcla = new THREE.AnimationMixer(modelo);
      this.mezcla.addEventListener('finished', () => this.poner('reposo'));
      this.poner('reposo');
    });
    const p = this.el.object3D.position;
    if (this.data.macizo) SUPERFICIES.push({ x0: p.x - 0.4, x1: p.x + 0.4, z0: p.z - 0.4, z1: p.z + 0.4, y: 1.8, macizo: true });
  },
  poner(nombre, unaVez) {
    if (!this.mezcla || nombre === this.nombre) return;
    const clip = THREE.AnimationClip.findByName(this.clips, nombre);
    if (!clip) return;
    const nueva = this.mezcla.clipAction(clip);
    nueva.reset();
    nueva.setLoop(unaVez ? THREE.LoopOnce : THREE.LoopRepeat);
    nueva.clampWhenFinished = !!unaVez;
    if (this.accion) nueva.crossFadeFrom(this.accion, 0.25, false);
    nueva.play();
    this.accion = nueva; this.nombre = nombre;
  },
  tick(t, dt) {
    if (!this.mezcla || !dt) return;
    // el giro de la cabeza se deshace antes de la animación: no todas la mueven, y si no se iría sumando
    if (this.cabeza) this.cabeza.rotateY(-this.mira);
    this.mezcla.update(Math.min(dt, 100) / 1000);
    const o = this.el.object3D;
    this.el.sceneEl.camera.getWorldPosition(this.ojo);
    const dx = this.ojo.x - o.position.x, dz = this.ojo.z - o.position.z, rel = Math.atan2(dx, dz) - o.rotation.y, ang = Math.atan2(Math.sin(rel), Math.cos(rel));
    const quiere = this.nombre === 'reposo' && Math.hypot(dx, dz) < 5 && Math.abs(ang) < 1.6 ? THREE.MathUtils.clamp(ang, -0.9, 0.9) : 0;
    this.mira += (quiere - this.mira) * Math.min(1, dt / 300);
    if (this.cabeza) this.cabeza.rotateY(this.mira);
  },
  remove() { if (this.mezcla) this.mezcla.stopAllAction(); }
});

AFRAME.registerComponent('boda', {
  init() {
    this.rayo = null; this.tabla = null; this.tex = [];
    if (!partida.bodaHoy()) return;
    this.montar();
  },
  // Una pieza fija: cilindro de la vajilla o caja de la mesa
  vajilla(x, y, z, radio, alto, color) {
    const e = document.createElement('a-cylinder');
    e.setAttribute('position', `${x} ${y} ${z}`); e.setAttribute('radius', radio); e.setAttribute('height', alto); e.setAttribute('segments-radial', 10); e.setAttribute('color', color);
    this.el.appendChild(e);
  },
  ponerCopa(x, z) {
    const copa = document.createElement('a-entity');
    copa.setAttribute('copa', ''); copa.setAttribute('agarrable', 'cercania: 0.22');
    copa.setAttribute('position', `${x} ${ALTO_MESA} ${z}`);
    copa.addEventListener('cogido', () => this.brindar());
    this.copas.push(copa);
    this.el.appendChild(copa);
    return copa;
  },
  montar() {
    const c = (x, y, z, w, h, d, color) => piezaCaja(this.el, x, y, z, w, h, d, { color });
    this.copas = []; this.invitados = [];
    // la mesa, de tablones con mantel de lino, y sus caballetes
    c(161, 0.74, -137, 8, 0.06, 1, '#5e4630');
    c(161, 0.775, -137, 7.8, 0.01, 0.8, '#b8ab8c');
    for (const x of [157.6, 161, 164.4]) c(x, 0.36, -137, 0.1, 0.72, 0.8, '#3a281a');
    SUPERFICIES.push({ x0: 156.8, x1: 165.2, z0: -137.6, z1: -136.4, y: 1, macizo: true });
    // en cada sitio, un plato y una copa, que se puede coger (js/posada.js)
    for (const [x, z] of [[158.6, -137.3], [160.4, -137.3], [161.6, -137.3], [163.4, -137.3], [158, -136.7], [159.4, -136.7], [161, -136.7], [162.6, -136.7], [164, -136.7]]) {
      this.vajilla(x, 0.79, z, 0.13, 0.015, '#8a7a62');
      // (solo donde no hay invitado: la de cada invitado la pone él, más abajo)
      if (!GENTE_BODA.some(g => g[0] === x && Math.abs(g[1] - z) < 1)) this.ponerCopa(x + 0.2, z);
    }
    // las fuentes, con el pescado asado en medio (el mismo de los bancos), y el pan
    this.mallas = [];
    for (const x of [159.6, 161, 162.4]) {
      this.vajilla(x, 0.795, -137, 0.3, 0.02, '#6a5a44');
      const pez = new THREE.Mesh(formaDePez(), new THREE.MeshBasicMaterial({ vertexColors: true, color: '#a8703a', side: THREE.DoubleSide }));
      pez.position.set(x, 0.86, -137); pez.rotation.y = Math.PI / 2; pez.scale.setScalar(0.6);
      this.el.object3D.add(pez);
      this.mallas.push(pez);
    }
    for (const x of [158.3, 163.7]) this.vajilla(x, 0.83, -137, 0.13, 0.09, '#a07c48');
    // la gente: callada, para que no salgan todos los carteles a la vez
    for (const [x, z, giro, tunica, camisa] of GENTE_BODA) {
      const e = document.createElement('a-entity');
      e.setAttribute('position', `${x} 0 ${z}`); e.setAttribute('rotation', `0 ${giro} 0`);
      e.setAttribute('guardia', 'sentado: true; modelo: cliente-sentado; callado: true');
      this.invitados.push(e);
      const lado = giro ? 1 : -1;   // sentado de cara al sur, o de cara al norte
      e.copaMesa = this.ponerCopa(x + lado * COPA_AL_LADO, z - lado * COPA_DELANTE);
      // su copa, en la mano: solo se ve mientras la tiene cogida
      e.addEventListener('model-loaded', ev => {
        const brazo = ev.detail.model.getObjectByName('BrazoD');
        if (!brazo) return;
        const copa = new THREE.Mesh(geometriaDeCopa(), new THREE.MeshStandardMaterial({ color: '#8a7a5c', roughness: 0.45, metalness: 0.6, side: THREE.DoubleSide }));
        copa.position.set(...MANO_DEL_BRAZO);
        copa.visible = false;
        brazo.add(copa);
        e.brazoBoda = brazo; e.copaBoda = copa;
        this.mallas.push(copa);
      });
      const n = GENTE_BODA.findIndex(g => g[0] === x && g[1] === z);
      e.setAttribute('cliente', { tunica, camisa, pelo: ['#3a2a1a', '#7a5a34', '#52402c', '#85807a', '#2c2118', '#6b4a2b'][n % 6], peinado: [1, 2, 4, 3, 2, 1][n % 6] });
      this.el.appendChild(e);
    }
    // los novios, de pie al otro lado de la mesa (herramientas/modelar-novia.py y modelar-novio.py)
    const novio = document.createElement('a-entity');
    novio.setAttribute('position', `${NOVIO_X} 0 ${NOVIOS_Z}`);
    novio.setAttribute('persona-animada', 'modelo: novio');
    this.el.appendChild(novio);
    this.novio = novio;
    const novia = document.createElement('a-entity');
    novia.setAttribute('position', `${NOVIA_X} 0 ${NOVIOS_Z}`);
    this.novia = novia;
    novia.setAttribute('persona-animada', 'modelo: novia');
    this.el.appendChild(novia);
    // un círculo en el suelo, alrededor de la mesa: aquí es la boda
    const circulo = document.createElement('a-ring');
    circulo.setAttribute('position', '161 0.1 -137'); circulo.setAttribute('rotation', '-90 0 0');
    circulo.setAttribute('radius-inner', 6.7); circulo.setAttribute('radius-outer', 7); circulo.setAttribute('segments-theta', 64);
    circulo.setAttribute('material', 'shader: flat; color: #d9b04a; opacity: 0.75; transparent: true; depthWrite: false');
    this.el.appendChild(circulo);
    this.circulo = circulo;
    // y su luz: una cortina dorada que sube del aro y se desvanece hacia arriba; late despacio (tick)
    const lienzo = document.createElement('canvas');
    lienzo.width = 4; lienzo.height = 128;
    const gl = lienzo.getContext('2d'), grad = gl.createLinearGradient(0, 128, 0, 0);
    grad.addColorStop(0, 'rgba(255, 214, 120, 1)'); grad.addColorStop(0.35, 'rgba(255, 200, 100, 0.35)'); grad.addColorStop(1, 'rgba(255, 190, 90, 0)');
    gl.fillStyle = grad; gl.fillRect(0, 0, 4, 128);
    const texLuz = new THREE.CanvasTexture(lienzo);
    const luz = this.luzCirculo = new THREE.Mesh(new THREE.CylinderGeometry(6.85, 6.85, 1.6, 64, 1, true),
      new THREE.MeshBasicMaterial({ map: texLuz, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, fog: false, opacity: 0.4 }));
    luz.position.set(161, 0.9, -137);
    this.el.object3D.add(luz);
    this.mallas.push(luz);
    this.texLuz = texLuz;
    // el cartel y la silla libre
    const cartel = document.createElement('a-entity');
    cartel.setAttribute('position', '155.4 0 -134.6'); cartel.setAttribute('rotation', '0 150 0');
    cartel.setAttribute('cartel-madera', 'texto: La boda');
    this.el.appendChild(cartel);
    const { x, z } = SILLA_BODA;
    c(x, 0.42, z, 0.46, 0.05, 0.42, '#4e3421');
    for (const [dx, dz] of [[-0.18, -0.15], [0.18, -0.15], [-0.18, 0.15], [0.18, 0.15]]) c(x + dx, 0.2, z + dz, 0.05, 0.4, 0.05, '#3a281a');
    c(x, 0.72, z + 0.19, 0.42, 0.56, 0.04, '#4e3421');
    const rayo = this.rayo = document.createElement('a-box');
    rayo.classList.add('clicable');
    rayo.setAttribute('position', `${x} 0.6 ${z}`); rayo.setAttribute('width', 0.7); rayo.setAttribute('height', 1.2); rayo.setAttribute('depth', 0.7);
    rayo.setAttribute('material', 'visible: false');
    rayo.addEventListener('mouseenter', () => { if (!enLaMesa) partida.avisar('Aprieta el gatillo para sentarte a la mesa.'); });
    this.ultimo = 0;
    rayo.addEventListener('mousedown', () => {
      if (enLaMesa || cambiandoDeZona || performance.now() - this.ultimo < 500) return;
      this.ultimo = performance.now();
      this.sentarse();
    });
    this.el.appendChild(rayo);
  },
  // Lleva la cabeza a un sitio (y, si se indica, a mirar hacia "rumbo"), moviendo el rig: en VR la cabeza no está en su centro
  llevarCabeza(x, z, rumbo) {
    const rig = document.getElementById('rig').object3D, cam = this.el.sceneEl.camera, d = new THREE.Vector3(), p = new THREE.Vector3();
    if (rumbo !== undefined) {
      cam.getWorldDirection(d);
      rig.rotation.y += rumbo - Math.atan2(-d.x, -d.z);
      rig.updateMatrixWorld(true);
    }
    cam.getWorldPosition(p);
    rig.position.x += x - p.x;
    rig.position.z += z - p.z;
  },
  sentarse() {
    enLaMesa = true;
    partida.asistirBoda();
    const rig = document.getElementById('rig').object3D, cam = this.el.sceneEl.camera, p = new THREE.Vector3();
    this.llevarCabeza(SILLA_BODA.x, SILLA_BODA.z, 0);
    // la altura: la de tus ojos respecto al rig cuenta, para que dé igual si estás de pie o sentado de verdad
    cam.getWorldPosition(p);
    rig.position.y += ALTURA_SENTADO - p.y;
    this.frase = 0; this.fraseMs = 0;
    this.brindado = false;
    this.ponerTabla();
    // (en el tutorial, el paso "brindar" lo dice él)
    if (partida.pasoTutorial()?.id !== 'brindar') partida.avisar(BRINDAR_TEXTO);
  },
  levantarse() {
    this.quitarTabla();
    enLaMesa = false;   // (la altura la recupera andar-joystick)
    this.llevarCabeza(SILLA_BODA.x, SILLA_BODA.z + 1.2);
  },
  // La frase que toca, encima de los novios, y debajo el botón de levantarse: en VR, solo después de brindar (en el
  // ordenador no hay manos para coger la copa)
  ponerTabla() {
    this.quitarTabla();
    const tabla = this.tabla = document.createElement('a-entity');
    tabla.classList.add('cartel');
    tabla.object3D.position.set(SILLA_BODA.x, 0, -137.4);
    const { malla, tex } = fraseEnTabla(FRASES_BODA[this.frase], 1.5);
    malla.position.y = 1.72 + malla.geometry.parameters.height / 2;
    this.tex = [tex];
    tabla.setObject3D('mesh', malla);
    const texBoton = tablaDeTexto('Levantarte', 512, 96);
    this.tex.push(texBoton);
    const boton = document.createElement('a-entity');
    boton.classList.add('clicable', 'cartel');
    boton.setAttribute('position', '0 1.56 0.01');
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.12), new THREE.MeshBasicMaterial({ map: texBoton, depthTest: false, transparent: true, fog: false }));
    m.renderOrder = 995;
    boton.setObject3D('mesh', m);
    boton.addEventListener('mouseenter', () => m.material.color.set('#ffcc33'));
    boton.addEventListener('mouseleave', () => m.material.color.set('#ffffff'));
    boton.addEventListener('mousedown', () => {
      if (performance.now() - this.ultimo < 500) return;
      this.ultimo = performance.now();
      this.levantarse();
    });
    if (this.brindado || !this.el.sceneEl.is('vr-mode')) tabla.appendChild(boton);
    this.el.appendChild(tabla);
  },
  quitarTabla() {
    if (!this.tabla) return;
    this.tabla.parentNode.removeChild(this.tabla);
    this.tabla = null;
    for (const t of this.tex) t.dispose();
    this.tex = [];
  },
  // Al coger tú una copa, todos cogen la suya de la mesa con la mano, la alzan y gritan, con un botecito en la silla.
  brindar() {
    if (this.brindis) return;
    this.brindis = { ms: 0, gente: this.invitados.filter(e => e.brazoBoda).map(e => ({ e, mesa: e.copaMesa })) };
    partida.avisar('¡Vivan los novios! ¡Que se besen!');
    gritoDeBrindis();
  },
  moverBrindis(dt) {
    const b = this.brindis;
    b.ms += dt;
    const suave = t => { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
    const t = b.ms;
    const angulo = t < BRINDIS_COGE_MS ? BRAZO_MESA * suave(t / BRINDIS_COGE_MS)
      : t < BRINDIS_ALZA_MS ? BRAZO_MESA + (BRAZO_ALTO - BRAZO_MESA) * suave((t - BRINDIS_COGE_MS) / (BRINDIS_ALZA_MS - BRINDIS_COGE_MS))
        : t < BRINDIS_BAJA_MS ? BRAZO_ALTO + 0.06 * Math.sin(t / 90)
          : t < BRINDIS_DEJA_MS ? BRAZO_ALTO + (BRAZO_MESA - BRAZO_ALTO) * suave((t - BRINDIS_BAJA_MS) / (BRINDIS_DEJA_MS - BRINDIS_BAJA_MS))
            : BRAZO_MESA * (1 - suave((t - BRINDIS_DEJA_MS) / (BRINDIS_MS - BRINDIS_DEJA_MS)));
    const enLaMano = t >= BRINDIS_COGE_MS && t < BRINDIS_DEJA_MS;
    const alto = suave(t / BRINDIS_ALZA_MS) * (1 - suave((t - BRINDIS_BAJA_MS) / (BRINDIS_MS - BRINDIS_BAJA_MS)));
    b.gente.forEach((g, i) => {
      g.e.brazoBoda.rotation.x = angulo;
      g.e.copaBoda.rotation.x = -angulo;   // la copa, siempre de pie
      g.e.copaBoda.visible = enLaMano;
      // la de la mesa desaparece mientras la lleva él (si no se la has cogido tú a medias)
      if (g.mesa && !g.mesa.components.agarrable.mano) g.mesa.object3D.visible = !enLaMano;
      g.e.object3D.position.y = 0.03 * alto * Math.abs(Math.sin(t / 170 + i));
    });
    // los novios andan el uno hacia el otro, se besan mientras todos brindan y vuelven a su sitio
    const novio = (el, de, a, giro, dz) => {
      const o = el.object3D, p = el.components['persona-animada'];
      o.position.z = NOVIOS_Z + dz * (t < NOVIOS_VUELVEN_MS ? suave(t / NOVIOS_LLEGAN_MS) : 1 - suave((t - NOVIOS_VUELVEN_MS) / (NOVIOS_ACABAN_MS - NOVIOS_VUELVEN_MS)));
      if (t < NOVIOS_LLEGAN_MS) { o.position.x = de + (a - de) * suave(t / NOVIOS_LLEGAN_MS); o.rotation.y = giro * suave(t / 250); p.poner('andar'); }
      else if (t < NOVIOS_VUELVEN_MS) { o.position.x = a; o.rotation.y = giro; p.poner('beso', true); }
      else {   // de vuelta se van girando hacia la mesa, sin darse la espalda
        const v = suave((t - NOVIOS_VUELVEN_MS) / (NOVIOS_ACABAN_MS - NOVIOS_VUELVEN_MS));
        o.position.x = a + (de - a) * v; o.rotation.y = giro * (1 - v); p.poner('andar');
      }
    };
    novio(this.novio, NOVIO_X, NOVIO_BESO, Math.PI / 2, 0);
    novio(this.novia, NOVIA_X, NOVIA_BESO, -Math.PI / 2, NOVIA_LADEO);
    if (t >= BRINDIS_MS) {
      for (const [el, x] of [[this.novio, NOVIO_X], [this.novia, NOVIA_X]]) { el.object3D.position.x = x; el.object3D.position.z = NOVIOS_Z; el.object3D.rotation.y = 0; el.components['persona-animada'].poner('reposo'); }
      this.novio.components['persona-animada'].poner('brindis', true);   // y él, al llegar, alza la copa
      for (const g of b.gente) { g.e.brazoBoda.rotation.x = 0; g.e.copaBoda.visible = false; g.e.object3D.position.y = 0; if (g.mesa) g.mesa.object3D.visible = true; }
      this.brindis = null;
      // sentado, ya has brindado: sale el botón de levantarte (el fin del tutorial ya lo dice; si no, un aviso)
      if (enLaMesa && !this.brindado) {
        this.brindado = true;
        this.ponerTabla();
        if (partida.pasoTutorial()?.id !== 'brindar') partida.avisar('Ya puedes levantarte cuando quieras.');
        partida.marcarTutorial('brindis');
      }
    }
  },
  tick(t, dt) {
    if (this.brindis && dt) this.moverBrindis(Math.min(dt, 100));
    // la luz del círculo late, y el aro con ella
    if (this.luzCirculo) {
      const latido = 0.5 + 0.5 * Math.sin(t / 700);
      this.luzCirculo.material.opacity = 0.25 + 0.25 * latido;
      const aro = this.circulo.getObject3D('mesh');
      if (aro) aro.material.opacity = 0.55 + 0.35 * latido;
    }
    if (!this.tabla || !dt || this.frase >= FRASES_BODA.length - 1) return;
    this.fraseMs += Math.min(dt, 100);
    if (this.fraseMs < BODA_FRASE_MS) return;
    this.frase++; this.fraseMs = 0;
    this.ponerTabla();
  },
  remove() {
    enLaMesa = false;
    for (const m of this.mallas || []) { m.parent.remove(m); m.geometry.dispose(); m.material.dispose(); }
    if (this.texLuz) this.texLuz.dispose();
  }
});
