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
const VELOCIDAD_MIRAR = 2.2;   // rad/s con el stick derecho del mando de Xbox, a tope
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
const PASO_COMEDOR = { x0: -0.75, x1: 0.35, z0: 6.35, z1: 8.05 };   // el hueco del arco, a través del muro
const ALTO_GALERIA = 4.4;   // altura del rellano de arriba de la sala 3 y de sus pasillos
const dentro = (p, z) => p.x >= z.x0 && p.x <= z.x1 && p.z >= z.z0 && p.z <= z.z1;

// Zonas por las que se puede ir desde donde está la cabeza: la suya y las que se alcanzan
// cruzando puertas abiertas. Con una puerta cerrada, el pasillo se queda a 25 cm de ella.
// Las zonas "arriba" (pasillos de la sala 3) solo valen si se pisa a la altura de la galería.
function zonasPermitidas(cabeza, altura) {
  const enAlto = altura > ALTO_GALERIA - 0.1;
  // (mientras no ha cargado la sala de una puerta, cuenta como cerrada)
  const abierta = id => document.getElementById(id)?.components.puerta?.abierta ?? false;
  const p1 = abierta('puerta1'), p2 = abierta('puerta2'), p3 = abierta('puerta3');
  const pasillo = { x0: p1 ? PASILLO.x0 : 3.25, x1: p2 ? PASILLO.x1 : 8.75, z0: PASILLO.z0, z1: PASILLO.z1 };
  const pasillo2 = { x0: PASILLO2.x0, x1: PASILLO2.x1, z0: p3 ? PASILLO2.z0 : 0.85, z1: PASILLO2.z1 };
  const zonas = [SALA, pasillo, SALA2, pasillo2, SALA3, ARCO_ARRIBA, ...PASILLOS_ARRIBA, PASO_COMEDOR, COMEDOR];
  const uniones = [[0, 1, p1], [1, 2, p2], [1, 3, p3], [3, 4, true],
    [4, 5, enAlto], [5, 6, enAlto], [6, 7, true], [6, 8, true], [7, 9, true], [8, 9, true],
    [4, 10, true], [10, 11, true]];
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
  let suelo = 0;
  for (const s of SUPERFICIES) {
    if (!dentro(p, s)) continue;
    if (s.y > actual + ESCALON_MAX) { if (s.macizo) return null; continue; }
    suelo = Math.max(suelo, s.y);
  }
  return suelo < actual - ESCALON_MAX ? null : suelo;
}

// Obstáculo macizo (pedestal, mesa, chimenea…) puesto desde el HTML de una sala: un rectángulo
// centrado en la entidad, "ancho" en x y "fondo" en z (sin girar), que no se puede atravesar.
AFRAME.registerComponent('macizo', {
  schema: { ancho: { default: 1 }, fondo: { default: 1 }, alto: { default: 1 } },
  init() {
    const p = this.el.object3D.position, { ancho, fondo, alto } = this.data;
    SUPERFICIES.push({ x0: p.x - ancho / 2, x1: p.x + ancho / 2, z0: p.z - fondo / 2, z1: p.z + fondo / 2, y: alto, macizo: true });
  }
});

// dónde estaba (localStorage); la clave lleva el punto de inicio del rig, para que al cambiarlo
// en el HTML se empiece allí y no en el sitio guardado de antes
const CLAVE_SITIO = 'editorvr-sitio';

AFRAME.registerComponent('andar-joystick', {
  init() {
    this.x = 0; this.y = 0;
    // en el ordenador, WASD o flechas hacen lo mismo que el joystick (antes era wasd-controls,
    // que movía la cámara sin choques ni escalones)
    this.tx = 0; this.ty = 0;
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
    // al recargar, volver al sitio donde se estaba (se guarda en el navegador cada medio segundo)
    this.guardado = 0;
    const inicio = n => Element.prototype.getAttribute.call(this.rig, n) || '';
    this.clave = CLAVE_SITIO + ' ' + inicio('position') + ' / ' + inicio('rotation');
    // (cuando la escena ha cargado: si no, la posición inicial del rig lo pisaría)
    const volver = () => {
      try {
        const p = JSON.parse(localStorage.getItem(this.clave));
        if (!p) return;
        this.rig.object3D.position.set(p.x, p.y, p.z);
        this.rig.object3D.rotation.y = p.giro;
        this.altura = p.y;
      } catch (e) {}
    };
    if (this.el.sceneEl.hasLoaded) volver(); else this.el.sceneEl.addEventListener('loaded', volver, { once: true });
    this.el.addEventListener('thumbstickmoved', e => { this.x = e.detail.x; this.y = e.detail.y; });
  },
  tick(t, dt) {
    if (!dt) return;
    const r = this.rig.object3D.position;
    if (t - this.guardado > 500) {
      this.guardado = t;
      try { localStorage.setItem(this.clave, JSON.stringify({ x: r.x, y: this.altura, z: r.z, giro: this.rig.object3D.rotation.y })); } catch (e) {}
    }
    r.y += (this.altura - r.y) * Math.min(1, dt / 80);   // subir y bajar escalones con suavidad
    this.mandoPC(dt);
    const mx = THREE.MathUtils.clamp(this.x + this.tx + this.gx, -1, 1), my = THREE.MathUtils.clamp(this.y + this.ty + this.gy, -1, 1);
    if (Math.hypot(mx, my) < 0.15) return;   // zona muerta
    const s = Math.min(dt / 1000, 0.05) * VELOCIDAD;
    const cam = document.querySelector('[camera]').object3D;
    const delante = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.getWorldQuaternion(new THREE.Quaternion()));
    delante.y = 0; delante.normalize();
    const derecha = new THREE.Vector3(-delante.z, 0, delante.x);
    const zonas = zonasPermitidas(cam.getWorldPosition(new THREE.Vector3()), this.altura);   // antes de moverse
    const antes = r.clone();
    r.addScaledVector(delante, -my * s).addScaledVector(derecha, mx * s);
    const cabeza = cam.getWorldPosition(new THREE.Vector3());
    // escalones: subir o bajar; si hay un obstáculo macizo o un desnivel, no se mueve
    const suelo = sueloEn(cabeza, this.altura);
    if (suelo === null) { r.x = antes.x; r.z = antes.z; return; }
    this.altura = suelo;
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
  // Mando de Xbox (o cualquier mando "standard") en el PC, fuera de VR: stick izquierdo para
  // andar (deja this.gx, this.gy, como el joystick), stick derecho para mirar, A para abrir la
  // puerta que hay en la mira, B para traer la pantalla del PC y LB / RB para girar 30°.
  // El navegador no ve el mando hasta que se pulsa un botón con la página delante.
  mandoPC(dt) {
    this.gx = this.gy = 0;
    if (this.el.sceneEl.is('vr-mode') || !navigator.getGamepads) return;
    const m = [...navigator.getGamepads()].find(g => g && g.connected && g.mapping === 'standard');
    if (!m) return;
    // reposo: lo que marca cada stick sin tocarlo, apuntado al ver el mando por primera vez (los
    // mandos con uso no vuelven del todo a 0, y la vista se movía sola). Se resta siempre; luego,
    // zona muerta y reescalado para que el movimiento empiece suave al salir de ella.
    if (this.mandoId !== m.id + m.index) {
      this.mandoId = m.id + m.index;
      this.reposo = m.axes.map(v => Math.abs(v) < 0.35 ? v : 0);
    }
    const zona = i => {
      const v = m.axes[i] - (this.reposo[i] || 0), a = Math.abs(v);
      return a < ZONA_MUERTA ? 0 : Math.sign(v) * Math.min(1, (a - ZONA_MUERTA) / (1 - ZONA_MUERTA));
    };
    this.gx = zona(0); this.gy = zona(1);
    // mirar: girar y cabecear la cámara, igual que con el ratón
    const camara = document.querySelector('[camera]');
    const lc = camara.components['look-controls'], s = Math.min(dt, 50) / 1000 * VELOCIDAD_MIRAR;
    if (lc) {
      lc.yawObject.rotation.y -= zona(2) * s;
      lc.pitchObject.rotation.x = THREE.MathUtils.clamp(lc.pitchObject.rotation.x - zona(3) * s, -Math.PI / 2, Math.PI / 2);
    }
    // botones: cuentan al pulsarlos, no mientras se siguen apretando
    const antes = this.botones || [];
    const pulsa = i => m.buttons[i] && m.buttons[i].pressed && !antes[i];
    if (pulsa(0)) {   // A: clic en lo que hay en la mira (abre o cierra la puerta)
      const el = camara.components.raycaster && camara.components.raycaster.intersectedEls[0];
      if (el) el.emit('click');
    }
    if (pulsa(1))     // B: traer la pantalla del PC
      for (const a of document.querySelectorAll('[agarrable]')) if (a.components.agarrable.data.clave) a.components.agarrable.traer();
    const giro = document.querySelector('[giro-por-pasos]');
    const g = giro && giro.components['giro-por-pasos'];
    if (g && pulsa(4)) g.girar(PASO_GIRO);    // LB: 30° a la izquierda
    if (g && pulsa(5)) g.girar(-PASO_GIRO);   // RB: 30° a la derecha
    this.botones = m.buttons.map(b => b.pressed);
  }
});

// Mira del monitor: solo fuera de VR (en VR apuntan los mandos).
document.addEventListener('DOMContentLoaded', () => {
  const s = document.querySelector('a-scene');
  const mira = v => document.querySelector('.mira').setAttribute('visible', v);
  const camara = document.querySelector('[camera]');
  s.addEventListener('enter-vr', () => { mira(false); camara.setAttribute('raycaster', 'enabled', false); });
  s.addEventListener('exit-vr', () => { mira(true); camara.setAttribute('raycaster', 'enabled', true); });
});
