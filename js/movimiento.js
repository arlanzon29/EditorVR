// Editor VR: moverse por la escena.
// Giro por pasos, andar con el joystick o el teclado, zonas por las que se puede ir (unidas por
// puertas), superficies que se pisan (escalones, galería) y la mira del monitor.

// Giro por pasos con el joystick derecho: a un lado gira 30°.
// Hay que volver el joystick al centro para girar otra vez.
const PASO_GIRO = 30;

AFRAME.registerComponent('giro-por-pasos', {
  init() {
    this.girado = false;
    this.rig = document.getElementById('rig');
    this.el.addEventListener('thumbstickmoved', e => {
      const x = e.detail.x;
      if (Math.abs(x) > 0.7 && !this.girado) { this.girar(x > 0 ? -PASO_GIRO : PASO_GIRO); this.girado = true; }
      if (Math.abs(x) < 0.3) this.girado = false;
    });
  },
  girar(grados) {
    // girar alrededor de la cabeza, no del centro del rig, para no desplazarse al girar
    const rig = this.rig.object3D;
    const cabeza = document.querySelector('[camera]').object3D.getWorldPosition(new THREE.Vector3());
    const a = THREE.MathUtils.degToRad(grados);
    const off = rig.position.clone().sub(cabeza).applyAxisAngle(new THREE.Vector3(0, 1, 0), a);
    rig.position.set(cabeza.x + off.x, rig.position.y, cabeza.z + off.z);
    rig.rotation.y += a;
  }
});

// Andar con el joystick izquierdo, hacia donde miras (sin subir ni bajar).
const VELOCIDAD = 1.5;   // m/s
const CORRER = 2.5;      // veces más rápido al correr: gatillo lateral izquierdo, Mayúsculas o gatillo LT del mando
const VELOCIDAD_MIRAR = 2.2;   // rad/s con el stick derecho del mando de Xbox, a tope
const MIRAR_VERTICAL = 0.6;    // en vertical, esta parte de esa velocidad
const MUELLE = 0.15;           // un eje que baja esto en SALTO_MS es el muelle del stick al soltarlo: si luego se queda quieto, no es una mano
const SALTO_MANO = 0.08, SALTO_MS = 150;   // una mano mueve el eje al menos esto en este tiempo; el mando solo, no
// En VR cuenta la altura real de las gafas; si estás sentado (las gafas, de media, por debajo de
// SENTADO_BAJO; se vuelve a "de pie" por encima de SENTADO_ALTO) se suma SUBIR_SENTADO.
const SENTADO_BAJO = 1.3, SENTADO_ALTO = 1.4, SUBIR_SENTADO = 0.35;
const ZONA_MUERTA = 0.25;      // de los sticks del mando: por debajo, como si no se tocaran
// Zonas por las que puede ir la cabeza (con un margen para no meterse en las paredes).
// Cada puerta une dos zonas; con la puerta cerrada no se puede pasar de una a otra.
const SALA = { x0: -2.75, x1: 2.75, z0: -2.75, z1: 2.75 };
const PASILLO = { x0: 2.5, x1: 9.5, z0: -0.3, z1: 0.3 };
const SALA2 = { x0: 9.25, x1: 13.75, z0: -2.25, z1: 2.25 };
const PASILLO2 = { x0: 5.65, x1: 6.35, z0: 0.25, z1: 4.3 };    // ramal del pasillo hacia la sala 3
const SALA3 = { x0: 0.25, x1: 11.75, z0: 4.25, z1: 13.75 };
// Pasillos de arriba, por fuera de los muros de la sala 3 (a 4,4 m), y el arco por el que se
// entra desde el rellano de arriba de la escalera. Solo cuentan si se va a esa altura.
const ARCO_ARRIBA = { x0: 5.65, x1: 6.35, z0: 13.5, z1: 14.9, arriba: true };
const PASILLOS_ARRIBA = [
  { x0: -1.75, x1: 13.75, z0: 14.65, z1: 15.75, arriba: true },   // fondo
  { x0: -1.75, x1: -0.65, z0: 2.25, z1: 15.75, arriba: true },    // lado derecho (entrando a la sala)
  { x0: 12.65, x1: 13.75, z0: 2.25, z1: 15.75, arriba: true },    // lado izquierdo
  { x0: -1.75, x1: 13.75, z0: 2.25, z1: 3.35, arriba: true },     // delante
];
// Comedor: ampliación a la derecha de la sala 3 (entrando), al otro lado de su muro (x = 0…-0,4),
// por un arco abierto de 2,4 m (z = 6…8,4). Planta baja, 4,2 m de alto (debajo de los pasillos de arriba).
const COMEDOR = { x0: -12.15, x1: -0.65, z0: 4.25, z1: 13.75 };
// La capilla, simétrica del comedor, al otro lado de la sala 3
const CAPILLA = { x0: 12.65, x1: 24.15, z0: 4.25, z1: 13.75 };
const PASO_CAPILLA = { x0: 11.65, x1: 12.75, z0: 6.35, z1: 8.05 };
const PASO_COMEDOR = { x0: -0.75, x1: 0.35, z0: 6.35, z1: 8.05 };   // el hueco del arco, a través del muro
// Patio de armas, fuera, entre la sala 1 y la sala 2 (x = 3…9, z = -6,6…-0,6), con la muralla
// alrededor. Se sale por la puerta 4, en la pared izquierda del pasillo; el paso es el hueco de la
// puerta y solo cuenta con ella abierta (cerrada, en el patio te quedas a 25 cm de ella).
const PATIO = { x0: 3.25, x1: 8.75, z0: -6.35, z1: -0.85 };
const PASO_PATIO = { x0: 5.65, x1: 6.35, z0: -1.0, z1: -0.25 };
// Fuera del castillo: se sale del patio por el portón de la muralla del fondo (x = 5,2…6,8,
// z = -7…-6,6). Campo alrededor de todo el castillo, hasta 25 cm de sus muros. Por debajo de los
// pasillos de arriba (a 4,4 m) que vuelan por fuera no se entra.
const PASO_PORTON = { x0: 5.55, x1: 6.45, z0: -7.4, z1: -6.2 };
const FUERA = [
  { x0: -30, x1: 40, z0: -45, z1: -7.25 },     // por delante del patio y del castillo
  { x0: -30, x1: 2.35, z0: -45, z1: -3.7 },    // delante de la sala 1 y al oeste del patio
  { x0: 9.65, x1: 40, z0: -45, z1: -2.75 },    // delante de la sala 2 y al este del patio
  { x0: -30, x1: -3.7, z0: -45, z1: 3.35 },    // al oeste de la sala 1, hasta el muro del comedor
  { x0: -30, x1: -13.05, z0: -45, z1: 45 },    // al oeste del comedor
  { x0: -30, x1: 40, z0: 14.65, z1: 45 },      // por detrás (norte)
  { x0: 14.6, x1: 40, z0: -45, z1: 3.35 },     // al este de la sala 2, hasta el muro de la capilla
  { x0: 25.05, x1: 40, z0: -45, z1: 45 },      // al este de la capilla
];
// Las demás zonas y sus pasos están en js/mundo.js.
let cambiandoDeZona = false;   // mientras se carga una zona no se anda
let enLaMesa = false;          // sentado a la mesa de la boda tampoco (js/boda.js)
const ALTO_GALERIA = 4.4;   // altura del rellano de arriba de la sala 3 y de sus pasillos
const dentro = (p, z) => p.x >= z.x0 && p.x <= z.x1 && p.z >= z.z0 && p.z <= z.z1;

// Zonas por las que se puede ir desde donde está la cabeza: la suya y las que se alcanzan
// cruzando puertas abiertas. Con una puerta cerrada, el pasillo se queda a 25 cm de ella.
// Las zonas "arriba" (pasillos de la sala 3) solo valen si se pisa a la altura de la galería.
const ZONAS_DE_ANDAR = Object.values(MUNDO).filter(z => z.andar);
function zonasPermitidas(cabeza, altura) {
  const enAlto = altura > ALTO_GALERIA - 0.1;
  // (mientras no ha cargado la sala de una puerta, cuenta como cerrada)
  const abierta = id => document.getElementById(id)?.components.puerta?.abierta ?? false;
  const p1 = abierta('puerta1'), p2 = abierta('puerta2'), p3 = abierta('puerta3'), p4 = abierta('puerta4');
  const pasillo = { x0: p1 ? PASILLO.x0 : 3.25, x1: p2 ? PASILLO.x1 : 8.75, z0: PASILLO.z0, z1: PASILLO.z1 };
  const pasillo2 = { x0: PASILLO2.x0, x1: PASILLO2.x1, z0: p3 ? PASILLO2.z0 : 0.85, z1: PASILLO2.z1 };
  // el hueco de la puerta del patio solo existe con ella abierta: se solapa con el patio, y si no,
  // desde ese borde del patio se cruzaba la puerta cerrada
  const pasoPatio = p4 ? PASO_PATIO : { x0: 1, x1: 0, z0: 1, z1: 0 };
  const zonas = [SALA, pasillo, SALA2, pasillo2, SALA3, ARCO_ARRIBA, ...PASILLOS_ARRIBA, PASO_COMEDOR, COMEDOR, pasoPatio, PATIO, PASO_PORTON, ...FUERA, ...PASOS.map(p => p.andar), ...ZONAS_DE_ANDAR.map(z => z.andar), PASO_CAPILLA, CAPILLA];
  const uniones = [[0, 1, p1], [1, 2, p2], [1, 3, p3], [3, 4, true],
    [4, 5, enAlto], [5, 6, enAlto], [6, 7, true], [6, 8, true], [7, 9, true], [8, 9, true],
    [4, 10, true], [10, 11, true], [1, 12, p4], [12, 13, p4],
    [13, 14, true], ...FUERA.map((_, i) => [14, 15 + i, true]),
    // cada paso une sus dos zonas (el castillo, por el campo de fuera)
    ...PASOS.flatMap((p, k) => {
      const i = 15 + FUERA.length + k, n = nombre => nombre === 'castillo' ? 15 : 15 + FUERA.length + PASOS.length + ZONAS_DE_ANDAR.indexOf(MUNDO[nombre]);
      return [[n(p.a), i, true], [i, n(p.b), true]];
    }),
    [4, zonas.length - 2, true], [zonas.length - 2, zonas.length - 1, true]];
  const i = zonas.findIndex(z => dentro(cabeza, z) && (enAlto || !z.arriba));
  if (i < 0) return zonas.filter(z => enAlto || !z.arriba);   // fuera de todo (no debería pasar): que pueda volver a cualquiera
  const alcanzables = new Set([i]);
  for (let otra = true; otra;) {
    otra = false;
    for (const [a, b, abierta] of uniones)
      if (abierta && alcanzables.has(a) !== alcanzables.has(b)) { alcanzables.add(a); alcanzables.add(b); otra = true; }
  }
  return [...alcanzables].map(k => zonas[k]);
}

// Superficies pisables por encima del suelo (escalera y entreplanta de la sala 3), en el mundo.
// Se sube o se baja si el escalón es de 35 cm o menos; más alto, se pasa por debajo (entreplanta)
// o, si es macizo (peldaños hasta el suelo, pilares), no se puede pasar. Tampoco se puede caer.
const SUPERFICIES = [];
const ESCALON_MAX = 0.35;
function sueloEn(p, actual) {
  const terreno = alturaTerreno(p.x, p.z);
  let suelo = terreno, encima = false;
  for (const s of SUPERFICIES) {
    if (!dentro(p, s) || actual < (s.desde ?? -Infinity)) continue;   // (desde: solo cuenta en el piso de arriba)
    if (s.y > actual + ESCALON_MAX) { if (s.macizo) return null; continue; }
    suelo = Math.max(suelo, s.y);
    encima = true;
  }
  if (!encima && terreno < (zonaCargada.agua ?? -Infinity)) return null;   // al agua no se entra
  if (zonaCargada.pared && zonaCargada.pared(p.x, p.z)) return null;       // ni en la roca de la cueva
  return suelo < actual - ESCALON_MAX ? null : suelo;
}

// Obstáculo macizo (pedestal, mesa, chimenea…) puesto desde el HTML de una sala: un rectángulo
// centrado en la entidad, "ancho" en x y "fondo" en z (sin girar), que no se puede atravesar. Con "desde",
// solo para quien pisa a esa altura o más: un tabique de arriba no estorba en la planta de abajo.
AFRAME.registerComponent('macizo', {
  schema: { ancho: { default: 1 }, fondo: { default: 1 }, alto: { default: 1 }, desde: { type: 'number' } },
  init() {
    const p = this.el.object3D.position, { ancho, fondo, alto, desde } = this.data;
    SUPERFICIES.push({ x0: p.x - ancho / 2, x1: p.x + ancho / 2, z0: p.z - fondo / 2, z1: p.z + fondo / 2, y: alto, macizo: true, desde: desde || undefined });
  }
});

// Suelo de un piso alto: se pisa llegando por la escalera y se pasa por debajo.
AFRAME.registerComponent('piso', {
  schema: { ancho: { default: 1 }, fondo: { default: 1 }, y: { default: 3 } },
  init() {
    const p = this.el.object3D.position, { ancho, fondo, y } = this.data;
    SUPERFICIES.push({ x0: p.x - ancho / 2, x1: p.x + ancho / 2, z0: p.z - fondo / 2, z1: p.z + fondo / 2, y });
  }
});

AFRAME.registerComponent('andar-joystick', {
  init() {
    this.x = 0; this.y = 0;
    // en el ordenador, WASD o flechas hacen lo mismo que el joystick (antes era wasd-controls,
    // que movía la cámara sin choques ni escalones)
    this.tx = 0; this.ty = 0;
    this.cx = 0; this.cy = 0;   // cruceta táctil del móvil (la pone crucetas(), abajo)
    const teclas = new Set();
    const pulsada = (...c) => c.some(k => teclas.has(k)) ? 1 : 0;
    const actualizar = () => {
      this.tx = pulsada('KeyD', 'ArrowRight') - pulsada('KeyA', 'ArrowLeft');
      this.ty = pulsada('KeyS', 'ArrowDown') - pulsada('KeyW', 'ArrowUp');
    };
    window.addEventListener('keydown', e => { teclas.add(e.code); actualizar(); });
    window.addEventListener('keyup', e => { teclas.delete(e.code); actualizar(); });
    window.addEventListener('blur', () => { teclas.clear(); actualizar(); });
    this.altura = 0;   // altura del suelo que se pisa
    this.rig = document.getElementById('rig');
    // el sitio donde se está va con la partida, cada medio segundo; al abrirla se vuelve a él (js/partida.js)
    this.guardado = 0;
    this.el.addEventListener('thumbstickmoved', e => { this.x = e.detail.x; this.y = e.detail.y; });
    this.corriendo = false; this.mayusculas = false;
    this.el.addEventListener('gripdown', () => { this.corriendo = true; });
    this.el.addEventListener('gripup', () => { this.corriendo = false; });
    window.addEventListener('keydown', e => { if (e.key === 'Shift') this.mayusculas = true; });
    window.addEventListener('keyup', e => { if (e.key === 'Shift') this.mayusculas = false; });
    window.addEventListener('blur', () => { this.mayusculas = false; });
    // botón derecho del ratón mantenido: también corre (más cómodo que Mayúsculas con una mano en el ratón)
    window.addEventListener('mousedown', e => { if (e.button === 2) this.mayusculas = true; });
    window.addEventListener('mouseup', e => { if (e.button === 2) this.mayusculas = false; });
    window.addEventListener('contextmenu', e => e.preventDefault());
  },
  guardarSitio() {
    const o = this.rig.object3D;
    partida.guardarSitio({ x: o.position.x, y: this.altura, z: o.position.z, giro: o.rotation.y });
  },
  tick(t, dt) {
    if (!dt || enBarco) return;   // (en la barca, te mueve ella: js/lago.js)
    if (enLaMesa) { this.mandoPC(dt); return; }   // (sentado a la mesa no se anda, pero con el mando se mira y se hace clic)
    const r = this.rig.object3D.position;
    if (t - this.guardado > 500 && partida.ranura && !cambiandoDeZona) {
      this.guardado = t;
      this.guardarSitio();
    }
    // en VR, si estás sentado, el rig sube SUBIR_SENTADO. "Sentado" sale de la altura media de las
    // gafas en unos 3 s (agacharse un momento no cuenta), con margen entre bajo y alto para que no
    // salte; el cambio se hace en un segundo, sin tirones.
    if (this.el.sceneEl.is('vr-mode')) {
      const gafas = document.querySelector('[camera]').object3D.position.y;   // altura real de las gafas
      this.mediaGafas = this.mediaGafas === undefined ? gafas : this.mediaGafas + (gafas - this.mediaGafas) * Math.min(1, dt / 3000);
      if (this.mediaGafas < SENTADO_BAJO) this.sentado = true;
      else if (this.mediaGafas > SENTADO_ALTO) this.sentado = false;
      const objetivo = this.sentado ? SUBIR_SENTADO : 0;
      this.ajusteVR = (this.ajusteVR ?? objetivo) + (objetivo - (this.ajusteVR ?? objetivo)) * Math.min(1, dt / 1000);
    } else { this.ajusteVR = undefined; this.mediaGafas = undefined; this.sentado = false; }
    r.y += (this.altura + (this.ajusteVR ?? 0) - r.y) * Math.min(1, dt / 80);   // subir y bajar escalones con suavidad
    this.mandoPC(dt);
    // (sin partida se está en el menú: se anda por su salón, pero por nada más)
    if (cambiandoDeZona || (!partida.ranura && zonaCargada.nombre !== 'menu')) return;
    const mx = THREE.MathUtils.clamp(this.x + this.tx + this.gx + this.cx, -1, 1), my = THREE.MathUtils.clamp(this.y + this.ty + this.gy + this.cy, -1, 1);
    if (Math.hypot(mx, my) < 0.15) return;   // zona muerta
    const mando = this.el.sceneEl.is('vr-mode') ? null : [...navigator.getGamepads()].find(g => g && g.mapping === 'standard');
    const corre = this.corriendo || this.mayusculas || (mando && mando.buttons[6] && mando.buttons[6].value > 0.5);
    const s = Math.min(dt / 1000, 0.05) * VELOCIDAD * (corre ? CORRER : 1);
    const cam = document.querySelector('[camera]').object3D;
    const delante = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.getWorldQuaternion(new THREE.Quaternion()));
    delante.y = 0; delante.normalize();
    const derecha = new THREE.Vector3(-delante.z, 0, delante.x);
    const donde = cam.getWorldPosition(new THREE.Vector3());
    const zonas = zonasPermitidas(donde, this.altura);   // antes de moverse
    // ¿ya está dentro de algo macizo? En VR se puede meter uno andando de verdad (en el pozo, por
    // ejemplo), y desde dentro cualquier paso chocaba: se quedaba atascado. Así puede salir.
    const atascado = sueloEn(donde, this.altura) === null;
    const antes = r.clone();
    r.addScaledVector(delante, -my * s).addScaledVector(derecha, mx * s);
    const cabeza = cam.getWorldPosition(new THREE.Vector3());
    // escalones: subir o bajar; si hay un obstáculo macizo o un desnivel, no se mueve
    const suelo = sueloEn(cabeza, this.altura);
    if (suelo === null) { if (!atascado) { r.x = antes.x; r.z = antes.z; return; } }
    else this.altura = suelo;
    // que la cabeza no atraviese paredes: si sale de las zonas permitidas, vuelve al punto más cercano
    if (zonas.some(z => dentro(cabeza, z))) return;
    let mejor = null, mejorD = Infinity;
    for (const z of zonas) {
      const x = THREE.MathUtils.clamp(cabeza.x, z.x0, z.x1), zz = THREE.MathUtils.clamp(cabeza.z, z.z0, z.z1);
      const d = Math.hypot(cabeza.x - x, cabeza.z - zz);
      if (d < mejorD) { mejorD = d; mejor = { x, z: zz }; }
    }
    r.x += mejor.x - cabeza.x;
    r.z += mejor.z - cabeza.z;
  },
  // El cursor del mando, con una ventana abierta: un aro dorado que mueve el stick derecho (de -1 a 1 en la vista).
  // Lo lee el pergamino (su "ndc", js/mapa.js) y, para las preguntas y las tablas de opciones, se apunta aquí.
  moverCursor(dt, dx, dy) {
    const c = this.cursor = this.cursor || { x: 0, y: 0, usado: false, hover: null, rayo: new THREE.Raycaster(), v: new THREE.Vector2() };
    if (dx || dy) {
      c.usado = true;
      c.x = THREE.MathUtils.clamp(c.x + dx * Math.abs(dx) * 2 * dt / 1000, -1, 1);
      c.y = THREE.MathUtils.clamp(c.y - dy * Math.abs(dy) * 2 * dt / 1000, -1, 1);
    }
    if (!c.usado) return;
    this.cursorMando(true);
    const mapa = this.el.sceneEl.components.mapa;
    if (mapa) mapa.ndc.set(c.x, c.y);
    if (!motivosRaton.has('pregunta')) return;
    // hover de los botones de la pregunta, como con el ratón
    const el = this.botonBajoCursor();
    if (el === c.hover) return;
    if (c.hover) c.hover.emit('mouseleave');
    c.hover = el;
    if (el) el.emit('mouseenter');
  },
  botonBajoCursor() {
    const c = this.cursor, cam = this.el.sceneEl.camera;
    if (!c || !cam) return null;
    const botones = [...document.querySelectorAll('.pregunta')], mallas = botones.map(e => e.getObject3D('mesh'));
    c.v.set(c.x, c.y);
    c.rayo.setFromCamera(c.v, cam);
    const golpe = c.rayo.intersectObjects(mallas.filter(Boolean), false)[0];
    return golpe ? botones[mallas.indexOf(golpe.object)] : null;
  },
  pulsarCursor() {
    if (!this.cursor || !this.cursor.usado) { if (this.cursor) this.cursor.usado = true; return; }   // (la primera vez solo sale el aro)
    if (motivosRaton.has('pregunta')) { const el = this.botonBajoCursor(); if (el) el.emit('mousedown'); }
    else if (motivosRaton.has('mapa')) this.el.sceneEl.components.mapa.viajar();
  },
  // El aro del cursor del mando: un círculo sobre la vista, que solo sale mientras se usa el mando con una ventana
  cursorMando(si) {
    if (!si && this.cursor) { this.cursor.usado = false; if (this.cursor.hover) { this.cursor.hover.emit('mouseleave'); this.cursor.hover = null; } this.cursor.x = this.cursor.y = 0; }
    let aro = this.aro;
    if (!aro) {
      if (!si) return;
      aro = this.aro = document.createElement('div');
      aro.style.cssText = 'position:fixed;width:22px;height:22px;border:3px solid #ffcc33;border-radius:50%;box-shadow:0 0 0 2px #2e2116;pointer-events:none;z-index:9999;transform:translate(-50%,-50%);display:none';
      document.body.appendChild(aro);
    }
    aro.style.display = si ? 'block' : 'none';
    if (!si) return;
    const r = this.el.sceneEl.canvas.getBoundingClientRect();
    aro.style.left = (r.left + (this.cursor.x + 1) / 2 * r.width) + 'px';
    aro.style.top = (r.top + (1 - this.cursor.y) / 2 * r.height) + 'px';
  },
  // Mando de Xbox (o cualquier mando "standard") en el PC, fuera de VR: stick izquierdo para
  // andar (deja this.gx, this.gy, como el joystick), stick derecho para mirar, A para abrir la
  // puerta que hay en la mira, B para traer la pantalla del PC, LB / RB para girar 30° y Vista
  // para recalibrar los sticks (soltándolos antes).
  // El navegador no ve el mando hasta que se pulsa un botón con la página delante.
  mandoPC(dt) {
    this.gx = this.gy = 0;
    if (this.el.sceneEl.is('vr-mode') || !navigator.getGamepads) return;
    const m = [...navigator.getGamepads()].find(g => g && g.connected && g.mapping === 'standard');
    if (!m) return;
    // reposo: lo que marca cada stick sin tocarlo, que no siempre es 0. Lo sigue mientras el eje no
    // está activo (ver zona, abajo); el botón Vista (8), con los sticks sueltos, lo pone donde estén.
    if (this.mandoId !== m.id + m.index) {
      this.mandoId = m.id + m.index;
      this.reposo = m.axes.map(() => 0);
      this.ancla = m.axes.slice();
      this.quietoMs = m.axes.map(() => 0);
      this.exacto = m.axes.slice();
      this.igualMs = m.axes.map(() => 0);
      this.ref = m.axes.slice();
      this.refMs = m.axes.map(() => 0);
      this.activo = m.axes.map(() => false);
      this.suelta = m.axes.map(() => false);
    }
    if (m.buttons[8] && m.buttons[8].pressed) this.reposo = m.axes.slice();
    // cada eje, de -1 a 1 contando desde el reposo hasta cada tope; zona muerta y reescalado para
    // que el movimiento empiece suave al salir de ella
    const zona = i => {
      // Este mando de Xbox, sin tocarlo, resbala solo: el eje vertical derecho va despacio de 0 a
      // -0,681 (medido: unos 0,1 por segundo) y se queda ahí, al milésimo. Se distingue de una mano
      // por la rapidez: un eje no cuenta ("activo") hasta que da un salto en poco tiempo; mientras
      // no, lo que marque es su reposo.
      if (Math.abs(m.axes[i] - this.ref[i]) > SALTO_MANO) {
        // (una bajada rápida es el muelle al soltar; una subida, una mano que empuja)
        const baja = Math.abs(this.ref[i]) - Math.abs(m.axes[i]);
        if (baja > MUELLE) this.suelta[i] = true; else if (baja < 0) this.suelta[i] = false;
        this.activo[i] = true; this.ref[i] = m.axes[i]; this.refMs[i] = 0;
      }
      else if ((this.refMs[i] += dt) > SALTO_MS) { this.ref[i] = m.axes[i]; this.refMs[i] = 0; }
      // "quieto": sin separarse de un mismo punto (estos sticks tiemblan unas centésimas sin tocarlos)
      if (Math.abs(m.axes[i] - this.ancla[i]) > 0.08) { this.ancla[i] = m.axes[i]; this.quietoMs[i] = 0; }
      else this.quietoMs[i] += dt;
      // idéntico al milésimo un rato (una mano siempre tiembla, salvo a tope): tampoco es una mano
      if (m.axes[i] !== this.exacto[i]) { this.exacto[i] = m.axes[i]; this.igualMs[i] = 0; }
      else this.igualMs[i] += dt;
      const valor = Math.abs(m.axes[i]);
      // al soltarlo, el stick puede quedarse a medias (medido: 19 s en -0,65, andando solo hasta chocar). Eso se
      // reconoce por cómo llega: una bajada rápida (el muelle, "suelta") y luego quieto. Un stick que se mantiene
      // (andar recto, girar), aunque aflojes poco a poco, sigue siendo una mano.
      const soltado = (this.quietoMs[i] > 300 && (valor < 0.15 || Math.abs(m.axes[i] - this.reposo[i]) < ZONA_MUERTA))
        || (this.suelta[i] && this.quietoMs[i] > 300)
        || (this.igualMs[i] > 3000 && valor < 0.98);   // (idéntico al milésimo tanto rato: no hay mano)
      if (soltado) { this.activo[i] = false; this.suelta[i] = false; }
      if (!this.activo[i]) { this.reposo[i] = m.axes[i]; return 0; }
      const r = this.reposo[i] || 0, bruto = m.axes[i] - r;
      if (Math.abs(bruto) < ZONA_MUERTA) return 0;
      const v = bruto / (bruto > 0 ? 1 - r : 1 + r), a = Math.abs(v);
      return a < ZONA_MUERTA ? 0 : Math.sign(v) * Math.min(1, (a - ZONA_MUERTA) / (1 - ZONA_MUERTA));
    };
    this.gx = zona(0); this.gy = zona(1);
    const mx = zona(2), my = zona(3);
    if (this.gx || this.gy || mx || my || m.buttons.some(b => b.pressed)) usarMando(true);
    // con una ventana abierta (el pergamino o una pregunta), el personaje no se mueve y el stick derecho mueve el cursor
    const ventana = motivosRaton.size > 0;
    if (ventana) this.gx = this.gy = 0;
    // mirar: girar y cabecear la cámara, igual que con el ratón
    const camara = document.querySelector('[camera]');
    const lc = camara.components['look-controls'], s = Math.min(dt, 50) / 1000 * VELOCIDAD_MIRAR;
    if (ventana) this.moverCursor(dt, mx, my);
    else this.cursorMando(false);
    if (lc && !ventana) {
      // al cuadrado, para poder apuntar despacio con poca inclinación; en vertical, más lento: el
      // recorrido es corto (de suelo a techo) y a toda velocidad se pasaba de largo
      const curva = v => v * Math.abs(v);
      lc.yawObject.rotation.y -= curva(mx) * s;
      lc.pitchObject.rotation.x = THREE.MathUtils.clamp(lc.pitchObject.rotation.x - curva(my) * s * MIRAR_VERTICAL, -Math.PI / 2, Math.PI / 2);
    }
    // botones: cuentan al pulsarlos, no mientras se siguen apretando
    const antes = this.botones || [];
    const pulsa = i => m.buttons[i] && m.buttons[i].pressed && !antes[i];
    if (pulsa(0) || pulsa(7)) {   // A o el gatillo derecho (RT): como apretar el ratón sobre lo que hay en la mira (abre o cierra la puerta)
      if (ventana) this.pulsarCursor();   // (con una ventana abierta, sobre lo que hay bajo el cursor)
      else {
        const el = camara.components.raycaster && camara.components.raycaster.intersectedEls[0];
        if (el) el.emit('mousedown');
      }
    }
    if (pulsa(3)) this.el.sceneEl.emit('mapa-alternar');   // Y: el pergamino, como la N (mapa → misión → diario → inventario → ayuda → cerrado)
    if (pulsa(1))     // B: traer la pantalla del PC
      for (const a of document.querySelectorAll('[agarrable]')) if (a.components.agarrable.data.clave) a.components.agarrable.traer();
    const giro = document.querySelector('[giro-por-pasos]');
    const g = giro && giro.components['giro-por-pasos'];
    if (g && pulsa(4)) g.girar(PASO_GIRO);    // LB: 30° a la izquierda
    if (g && pulsa(5)) g.girar(-PASO_GIRO);   // RB: 30° a la derecha
    this.botones = m.buttons.map(b => b.pressed);
  }
});

// Ratón libre en el ordenador, por motivos: el pergamino ('mapa': el ratón solo apunta a él y la cámara no toca nada)
// y las preguntas de gasto ('pregunta': el ratón solo toca sus botones). Mientras haya alguno, no se gira ni se
// recaptura el ratón; al irse el último, vuelve la mira. En VR no hace nada.
const motivosRaton = new Set();
function ratonLibre(motivo, si) {
  const s = document.querySelector('a-scene'), camara = document.querySelector('[camera]');
  if (!s || !camara || s.is('vr-mode') || motivosRaton.has(motivo) === si) return;
  if (si) motivosRaton.add(motivo); else motivosRaton.delete(motivo);
  aplicarRaton();
}

// Hay navegadores (el integrado de la aplicación de Claude) que no dejan capturar el ratón: entonces el ratón
// queda siempre libre, se hace clic donde está la flecha y se gira arrastrando con el botón pulsado.
let sinCaptura = false, usandoMando = false;
function sinCapturaDeRaton() {
  if (sinCaptura) return;
  sinCaptura = true;
  aplicarRaton();
}
// Sin captura, con el mando la mira vuelve al centro (mirar con el stick); al mover el ratón, el cursor es la flecha
function usarMando(si) {
  if (usandoMando === si) return;
  usandoMando = si;
  if (sinCaptura) aplicarRaton();
}
window.addEventListener('mousemove', e => { if (e.isTrusted && (e.movementX || e.movementY)) usarMando(false); });
function aplicarRaton() {
  const s = document.querySelector('a-scene'), camara = document.querySelector('[camera]');
  if (!s || !camara || s.is('vr-mode')) return;
  const libre = motivosRaton.size > 0, pregunta = motivosRaton.has('pregunta'), mira = document.querySelector('.mira');
  camara.setAttribute('look-controls', { pointerLockEnabled: !libre && !sinCaptura, mouseEnabled: !libre });
  const flecha = sinCaptura && !usandoMando;   // (la flecha del ratón apunta, en vez de la mira del centro)
  camara.setAttribute('cursor', 'rayOrigin', pregunta || (flecha && !libre) ? 'mouse' : 'entity');
  camara.setAttribute('raycaster', { enabled: !libre || pregunta, objects: pregunta ? '.pregunta' : '.clicable' });
  if (mira) mira.setAttribute('visible', !libre && !flecha);
  if (libre) { if (document.pointerLockElement) document.exitPointerLock(); return; }
  if (s.canvas) s.canvas.style.cursor = '';
  if (!sinCaptura && s.canvas && s.canvas.requestPointerLock) Promise.resolve(s.canvas.requestPointerLock()).catch(() => {});
}

// ¿deja este navegador capturar el ratón? Se prueba al empezar y, si la página no lo permite, se avisa en el primer clic
document.addEventListener('DOMContentLoaded', () => {
  const s = document.querySelector('a-scene');
  const probar = () => {
    const c = s.canvas;
    if (!c || !c.requestPointerLock) return;
    try {
      Promise.resolve(c.requestPointerLock()).catch(e => { if (e && (e.name === 'WrongDocumentError' || /not valid for pointer lock/i.test(e.message))) sinCapturaDeRaton(); });
    } catch (e) {}
  };
  if (s.hasLoaded) probar(); else s.addEventListener('loaded', probar, { once: true });
  window.addEventListener('mousedown', probar, { once: true });
});

// Mira del monitor: solo fuera de VR (en VR apuntan los mandos).
document.addEventListener('DOMContentLoaded', () => {
  const s = document.querySelector('a-scene');
  const mira = v => document.querySelector('.mira').setAttribute('visible', v);
  const camara = document.querySelector('[camera]');
  s.addEventListener('enter-vr', () => { mira(false); camara.setAttribute('raycaster', 'enabled', false); });
  s.addEventListener('exit-vr', () => { mira(!sinCaptura || usandoMando); camara.setAttribute('raycaster', 'enabled', true); });

  // Alt mantenida: cursor libre. Se suelta el ratón capturado, se apunta con la flecha (cursor con rayOrigin
  // mouse) y no se gira ni se vuelve a capturar con el clic; al soltar Alt vuelve la mira del centro.
  let libre = false;
  const cursorLibre = si => {
    if (libre === si || s.is('vr-mode') || motivosRaton.size || sinCaptura) return;   // (con el pergamino o una pregunta abiertos, el ratón ya es libre)
    libre = si;
    camara.setAttribute('look-controls', { pointerLockEnabled: !si, mouseEnabled: !si });
    camara.setAttribute('cursor', 'rayOrigin', si ? 'mouse' : 'entity');
    mira(!si);
    if (si) { if (document.pointerLockElement) document.exitPointerLock(); }
    else if (s.canvas && s.canvas.requestPointerLock) Promise.resolve(s.canvas.requestPointerLock()).catch(() => {});
  };
  window.addEventListener('keydown', e => { if (e.key === 'Alt') { e.preventDefault(); cursorLibre(true); } });
  window.addEventListener('keyup', e => { if (e.key === 'Alt') { e.preventDefault(); cursorLibre(false); } });
  window.addEventListener('blur', () => cursorLibre(false));
});

// Móvil o tableta (pantalla táctil, fuera de VR y sin las gafas): dos crucetas en pantalla, a la izquierda
// para andar (como el joystick) y a la derecha para mirar (como el stick derecho del mando). Arrastrar
// por la escena también gira, que es lo que ya hace look-controls.
const esTactil = () => matchMedia('(pointer: coarse)').matches && !/OculusBrowser/.test(navigator.userAgent);
function crucetas() {
  const s = document.querySelector('a-scene'), camara = document.querySelector('[camera]');
  const andar = document.querySelector('[andar-joystick]');
  if (!s || !camara || !andar || !esTactil()) return;
  const estilo = document.createElement('style');
  // como un escudo redondo: disco de madera oscura con aro de hierro, una cruz grabada, un remache en el
  // centro y una cuña de latón viejo en cada brazo, que se enciende al pulsarla
  estilo.textContent = '.cruceta{position:fixed;bottom:28px;width:140px;height:140px;z-index:20;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent;opacity:.7;border-radius:50%;'
    + 'background:radial-gradient(circle at 50% 38%,#4a3826 0%,#2e2216 55%,#1c140c 100%);'
    + 'box-shadow:0 0 0 3px #3a3a3a,0 0 0 5px #1a1a1a,0 0 0 6px #5a5a5a,0 6px 14px rgba(0,0,0,.55),inset 0 2px 6px rgba(255,220,160,.12),inset 0 -6px 12px rgba(0,0,0,.5)}'
    + '.cruceta.izq{left:28px}.cruceta.der{right:28px}'
    // la cruz grabada en la madera
    + '.cruceta::before{content:"";position:absolute;inset:14px;border-radius:50%;background:'
    + 'linear-gradient(#0000 calc(50% - 15px),rgba(0,0,0,.35) calc(50% - 15px),rgba(0,0,0,.35) calc(50% + 15px),#0000 calc(50% + 15px)),'
    + 'linear-gradient(90deg,#0000 calc(50% - 15px),rgba(0,0,0,.35) calc(50% - 15px),rgba(0,0,0,.35) calc(50% + 15px),#0000 calc(50% + 15px))}'
    // el remache del centro
    + '.cruceta::after{content:"";position:absolute;left:58px;top:58px;width:24px;height:24px;border-radius:50%;'
    + 'background:radial-gradient(circle at 35% 30%,#9a9a9a,#4a4a4a 55%,#222 100%);box-shadow:0 1px 3px rgba(0,0,0,.7)}'
    + '.cruceta b{position:absolute;width:46px;height:46px;display:block}'
    + '.cruceta b::after{content:"";position:absolute;left:11px;top:11px;width:24px;height:24px;background:#a8875a;'
    + 'clip-path:polygon(50% 8%,96% 82%,50% 64%,4% 82%);filter:drop-shadow(0 1px 1px #000);transition:background .08s,transform .08s}'
    + '.cruceta b.on::after{background:#f0c878;transform:scale(1.18)}'
    + '.cruceta .n{left:47px;top:6px}.cruceta .s{left:47px;top:88px;transform:rotate(180deg)}'
    + '.cruceta .o{left:6px;top:47px;transform:rotate(-90deg)}.cruceta .e{left:88px;top:47px;transform:rotate(90deg)}';
  document.head.appendChild(estilo);
  const flechas = { n: 'arriba', s: 'abajo', o: 'izquierda', e: 'derecha' };   // (la flecha es una cuña de CSS)
  const valor = { izq: { x: 0, y: 0 }, der: { x: 0, y: 0 } };
  const hacer = lado => {
    const c = document.createElement('div');
    c.className = 'cruceta ' + lado;
    for (const k in flechas) { const b = document.createElement('b'); b.className = k; c.appendChild(b); }
    // el dedo puede deslizarse de una flecha a otra sin levantarlo: se mira qué flecha hay bajo cada toque
    const leer = e => {
      const v = valor[lado]; v.x = v.y = 0;
      for (const b of c.children) b.classList.remove('on');
      for (const p of e.touches) {
        const r = c.getBoundingClientRect();
        if (p.clientX < r.left - 20 || p.clientX > r.right + 20 || p.clientY < r.top - 20 || p.clientY > r.bottom + 20) continue;
        const dx = p.clientX - (r.left + r.width / 2), dy = p.clientY - (r.top + r.height / 2);
        if (Math.hypot(dx, dy) < 14) continue;   // (el centro no hace nada)
        const k = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'e' : 'o') : (dy > 0 ? 's' : 'n');
        c.querySelector('.' + k).classList.add('on');
        if (k === 'e') v.x = 1; else if (k === 'o') v.x = -1; else if (k === 's') v.y = 1; else v.y = -1;
      }
      e.preventDefault();
    };
    for (const ev of ['touchstart', 'touchmove', 'touchend', 'touchcancel']) c.addEventListener(ev, leer, { passive: false });
    document.body.appendChild(c);
    return c;
  };
  const cruces = [hacer('izq'), hacer('der')];
  // Apaisado: el navegador solo deja fijar la orientación en pantalla completa (Chrome de Android; el
  // iPhone no deja), así que al primer toque se pide pantalla completa y se fija; si aun así está en
  // vertical, un aviso tapa la escena hasta que se gire el móvil.
  const fijar = () => {
    const d = document.documentElement, pedir = d.requestFullscreen || d.webkitRequestFullscreen;
    if (!document.fullscreenElement && pedir) Promise.resolve(pedir.call(d)).then(() => {
      if (screen.orientation && screen.orientation.lock) return screen.orientation.lock('landscape');
    }).catch(() => {});
  };
  window.addEventListener('touchend', fijar, { once: true });
  // Tocar con el dedo: un toque corto (sin arrastrar, que es girar) lanza un rayo desde ese punto de la
  // pantalla y hace lo mismo que el clic de la mira sobre lo primero .clicable que encuentra a menos de
  // 4 m (la puerta por su aldaba, el posadero, una copa, los botones de una pregunta...).
  // (el cursor de la mira también hace clic al tocar la pantalla, sobre lo que hay en el centro: se le quita
  // el toque, o una puerta centrada se abriría y cerraría a la vez)
  const cursor = camara.components.cursor;
  if (cursor) {
    s.canvas.removeEventListener('touchstart', cursor.onCursorDown);
    s.canvas.removeEventListener('touchend', cursor.onCursorUp);
  }
  const rayo = new THREE.Raycaster(), punto = new THREE.Vector2();
  let toque = null;
  s.canvas.addEventListener('touchstart', e => {
    toque = e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY, t: performance.now() } : null;
  }, { passive: true });
  s.canvas.addEventListener('touchend', e => {
    const p = e.changedTouches[0];
    if (!toque || !p || s.is('vr-mode') || performance.now() - toque.t > 400 || Math.hypot(p.clientX - toque.x, p.clientY - toque.y) > 12) return;
    toque = null;
    const r = s.canvas.getBoundingClientRect();
    punto.set((p.clientX - r.left) / r.width * 2 - 1, -(p.clientY - r.top) / r.height * 2 + 1);
    rayo.setFromCamera(punto, s.camera);
    rayo.far = 4;
    const objetos = [...document.querySelectorAll('.clicable')].filter(el => el.object3D && el.object3D.visible).map(el => el.object3D);
    const golpe = rayo.intersectObjects(objetos, true)[0];
    let el = golpe && golpe.object;
    while (el && !(el.el && el.el.classList.contains('clicable'))) el = el.parent;
    if (!el) return;
    el = el.el;
    el.emit('mousedown'); el.emit('mouseup'); el.emit('click');
  });
  estilo.textContent += '.girar-movil{position:fixed;inset:0;z-index:30;display:none;flex-direction:column;align-items:center;justify-content:center;gap:18px;'
    + 'background:#1c140c;color:#d9c9a0;font:22px Georgia,serif;text-align:center;padding:24px}'
    + '.girar-movil i{width:56px;height:96px;border:5px solid #a8875a;border-radius:10px;animation:girar-movil 1.8s ease-in-out infinite}'
    + '@keyframes girar-movil{0%,25%{transform:rotate(0)}60%,100%{transform:rotate(-90deg)}}'
    + '@media (orientation:portrait){.girar-movil{display:flex}}';
  const aviso = document.createElement('div');
  aviso.className = 'girar-movil';
  aviso.innerHTML = '<i></i><div>Gira el móvil para jugar</div>';
  aviso.addEventListener('touchend', fijar);   // (tocando el aviso se vuelve a pedir, por si se salió de pantalla completa)
  document.body.appendChild(aviso);
  const mostrar = si => cruces.forEach(c => { c.style.display = si ? '' : 'none'; });
  s.addEventListener('enter-vr', () => mostrar(false));
  s.addEventListener('exit-vr', () => mostrar(true));
  // cada fotograma: andar con la izquierda (se suma al joystick, ver andar-joystick) y mirar con la derecha
  let antes = performance.now();
  const paso = ahora => {
    const dt = Math.min(ahora - antes, 50) / 1000; antes = ahora;
    andar.components['andar-joystick'].cx = valor.izq.x;
    andar.components['andar-joystick'].cy = valor.izq.y;
    const lc = camara.components['look-controls'];
    if (lc && !motivosRaton.size && !s.is('vr-mode')) {
      lc.yawObject.rotation.y -= valor.der.x * dt * VELOCIDAD_MIRAR;
      lc.pitchObject.rotation.x = THREE.MathUtils.clamp(lc.pitchObject.rotation.x - valor.der.y * dt * VELOCIDAD_MIRAR * MIRAR_VERTICAL, -Math.PI / 2, Math.PI / 2);
    }
    requestAnimationFrame(paso);
  };
  requestAnimationFrame(paso);
}
document.addEventListener('DOMContentLoaded', () => {
  const s = document.querySelector('a-scene');
  if (s.hasLoaded) crucetas(); else s.addEventListener('loaded', crucetas);
});
