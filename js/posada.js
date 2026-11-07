// Editor VR: la posada del poblado (salas/posada.html). Lo que se usa con el rayo, cada uno con una tabla de
// texto y botones: el cofre de tu habitación (partida.opcionesCofre), la cama, que pasa al día siguiente, y el
// posadero, que te indica la taberna. Y la marca dorada de lo que pide el tutorial (partida.pasoTutorial).

const TABLA_SE_CIERRA = 4;        // a esta distancia, la tabla se cierra sola
const COFRE_TAPA_ABIERTA = 1.45;  // radianes: más, y la tapa daría en la pared
const TABLA_DISTANCIA = 1.5;      // a esta distancia de los ojos sale la tabla
const MARCA_CADA_MS = 400;

// Dónde poner una tabla para leerla bien: delante de quien mira, a su distancia, sea cual sea el sitio del objeto
function sitioDeLectura(escena) {
  const ojo = new THREE.Vector3(), d = new THREE.Vector3();
  escena.camera.getWorldPosition(ojo);
  escena.camera.getWorldDirection(d);
  d.y = 0; d.normalize();
  return ojo.addScaledVector(d, TABLA_DISTANCIA).add(new THREE.Vector3(0, -0.55, 0));
}

// En el monitor, una tabla de "ancho" × "alto" metros (con sus botones) sale recta, de frente a la cámara aunque
// mire arriba o abajo, y a una escala con la que cabe en la vista. Devuelve dónde ponerla, o null en VR.
function tablaEnMonitor(escena, ancho, alto, llenar = [0.72, 0.8]) {   // llenar: qué parte del alto y del ancho de la vista ocupa, como mucho
  if (escena.is('vr-mode')) return null;
  const c = escena.camera, ojo = new THREE.Vector3(), d = new THREE.Vector3(), q = new THREE.Quaternion();
  c.getWorldPosition(ojo); c.getWorldDirection(d); c.getWorldQuaternion(q);
  const visAlto = 2 * TABLA_DISTANCIA * Math.tan(c.fov * Math.PI / 360), visAncho = visAlto * c.aspect;
  return {
    centro: ojo.addScaledVector(d, TABLA_DISTANCIA), q, arriba: new THREE.Vector3(0, 1, 0).applyQuaternion(q),
    k: Math.min(llenar[0] * visAlto / alto, llenar[1] * visAncho / ancho),
  };
}

// Una tabla con lo que se dice y sus botones, flotando en "sitio" y de cara a quien mira. Las opciones llevan
// texto y, si hacen algo, "hacer". Devuelve con qué quitarla. "alElegir" recibe la opción elegida.
function tablaDeOpciones(escena, sitio, charla, alElegir) {
  const ojo = new THREE.Vector3(), tabla = new THREE.Group(), texturas = [], botones = [];
  let ultimo = performance.now();
  escena.camera.getWorldPosition(ojo);
  tabla.position.copy(sitio);
  tabla.lookAt(ojo.x, sitio.y, ojo.z);
  const vista = tablaEnMonitor(escena, 0.9, 1.3);   // (su origen está abajo: el contenido sube hasta 1,2 m)
  if (vista) { tabla.position.copy(vista.centro).addScaledVector(vista.arriba, -0.6 * vista.k); tabla.quaternion.copy(vista.q); tabla.scale.setScalar(vista.k); }
  escena.object3D.add(tabla);
  tabla.updateMatrixWorld(true);
  const { malla, tex } = fraseEnTabla(charla.texto, 0.8);
  texturas.push(tex);
  malla.position.y = 0.55 + malla.geometry.parameters.height / 2;
  tabla.add(malla);
  charla.opciones.forEach((op, i) => {
    const t = tablaDeTexto(op.texto, 512, 96);
    texturas.push(t);
    const e = document.createElement('a-entity');
    e.classList.add('clicable', 'cartel', 'pregunta');
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.15), new THREE.MeshBasicMaterial({ map: t, depthTest: false, transparent: true, fog: false }));
    m.renderOrder = 995;
    e.setObject3D('mesh', m);
    const p = tabla.localToWorld(new THREE.Vector3(0, 0.44 - i * 0.18, 0.01));
    e.setAttribute('position', `${p.x} ${p.y} ${p.z}`);
    e.object3D.quaternion.copy(tabla.quaternion);
    if (vista) e.object3D.scale.setScalar(vista.k);
    e.addEventListener('mouseenter', () => m.material.color.set('#ffcc33'));
    e.addEventListener('mouseleave', () => m.material.color.set('#ffffff'));
    e.addEventListener('mousedown', () => {
      if (performance.now() - ultimo < 400) return;
      ultimo = performance.now();
      alElegir(op);
    });
    escena.appendChild(e);
    botones.push(e);
  });
  // en el monitor, el ratón se suelta y solo toca los botones (si no, la cama o el cofre de detrás se llevan el clic)
  if (vista) ratonLibre('pregunta', true);
  return () => {
    if (vista) ratonLibre('pregunta', false);
    tabla.parent.remove(tabla);
    tabla.traverse(o => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } });
    for (const e of botones) e.parentNode.removeChild(e);
    for (const t of texturas) t.dispose();
  };
}

// Lo que recibe el rayo: una caja invisible, hija de "el", y al apretar, con margen contra dobles
function cajaDeRayo(el, x, y, z, w, h, d, alApretar) {
  const rayo = document.createElement('a-box');
  rayo.classList.add('clicable');
  rayo.setAttribute('position', `${x} ${y} ${z}`); rayo.setAttribute('width', w); rayo.setAttribute('height', h); rayo.setAttribute('depth', d);
  rayo.setAttribute('material', 'visible: false');
  el.appendChild(rayo);
  let ultimo = 0;
  rayo.addEventListener('mousedown', () => {
    if (performance.now() - ultimo < 500) return;
    ultimo = performance.now();
    alApretar();
  });
}

// ¿Se ha alejado quien mira de este sitio?
const seHaAlejado = (el, ojo) => {
  el.sceneEl.camera.getWorldPosition(ojo);
  const o = el.object3D.position;
  return Math.hypot(ojo.x - o.x, ojo.z - o.z) > TABLA_SE_CIERRA;
};

// Cofre: la bisagra va a lo largo de la espalda (-z local), y la tapa se levanta por delante (+z local), que
// es por donde se abre. Origen: en el suelo, en el centro.
AFRAME.registerComponent('cofre', {
  schema: { ancho: { default: 0.9 }, fondo: { default: 0.5 }, alto: { default: 0.45 } },
  init() {
    const { ancho: A, fondo: F, alto: H } = this.data, g = new THREE.Group(), G = 0.04;
    this.materiales = [new THREE.MeshStandardMaterial({ color: '#4a3424', roughness: 1 }), new THREE.MeshStandardMaterial({ color: '#17110c', roughness: 1 }), new THREE.MeshStandardMaterial({ color: '#26221e', roughness: 0.7 })];
    const [MADERA, HUECO, HIERRO] = this.materiales;
    const pieza = (padre, x, y, z, w, h, d, m) => {
      const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
      o.position.set(x, y, z);
      padre.add(o);
    };
    // la caja, hueca, 1 cm sobre el suelo: las tablas de los lados entran entre las de delante y detrás, y el
    // fondo entre las cuatro, para que ninguna cara coincida con otra (parpadearían)
    pieza(g, 0, 0.05, 0, A - 2 * G, 0.06, F - 2 * G, HUECO);
    pieza(g, 0, H / 2 + 0.01, -(F - G) / 2, A, H, G, MADERA);
    pieza(g, 0, H / 2 + 0.01, (F - G) / 2, A, H, G, MADERA);
    pieza(g, -(A - G) / 2, H / 2 + 0.01, 0, G, H - 0.01, F - 2 * G, MADERA);
    pieza(g, (A - G) / 2, H / 2 + 0.01, 0, G, H - 0.01, F - 2 * G, MADERA);
    // la tapa cuelga de su bisagra, con un fleje de hierro; y el cierre, delante
    this.tapa = new THREE.Group();
    this.tapa.position.set(0, H + 0.01, -F / 2);
    pieza(this.tapa, 0, 0.03, F / 2 + 0.01, A + 0.04, 0.06, F + 0.04, MADERA);
    pieza(this.tapa, 0, 0.066, F / 2 + 0.01, 0.06, 0.012, F + 0.05, HIERRO);
    pieza(g, 0, H - 0.08, F / 2 + 0.006, 0.1, 0.14, 0.012, HIERRO);
    g.add(this.tapa);
    this.el.setObject3D('mesh', g);
    this.angulo = 0; this.abierto = false; this.quitar = null; this.ojo = new THREE.Vector3();
    cajaDeRayo(this.el, 0, H / 2 + 0.05, 0, A + 0.1, H + 0.2, F + 0.1, () => {
      if (this.abierto) this.cerrar(); else { this.abierto = true; this.enseñar(); }
    });
  },
  enseñar() {
    if (this.quitar) this.quitar();
    this.quitar = tablaDeOpciones(this.el.sceneEl, sitioDeLectura(this.el.sceneEl), partida.opcionesCofre(), op => {
      if (op.hacer) { op.hacer(); this.enseñar(); } else this.cerrar();
    });
  },
  cerrar() {
    this.abierto = false;
    if (this.quitar) this.quitar();
    this.quitar = null;
  },
  tick(t, dt) {
    const meta = this.abierto ? COFRE_TAPA_ABIERTA : 0;
    if (this.angulo !== meta) {
      const paso = Math.min(dt || 0, 100) / 400;
      this.angulo = meta > this.angulo ? Math.min(meta, this.angulo + paso) : Math.max(meta, this.angulo - paso);
      this.tapa.rotation.x = -this.angulo;
    }
    if (this.abierto && seHaAlejado(this.el, this.ojo)) this.cerrar();
  },
  remove() {
    if (this.quitar) this.quitar();
    this.el.removeObject3D('mesh');
    for (const m of this.materiales) m.dispose();
  }
});

// Postigos de una ventana, por fuera: dos hojas que se abren contra la pared o se cierran tapando el hueco. Al
// apuntar a la ventana desde dentro y apretar el gatillo, se cierran o se abren, girando hacia fuera; la partida
// lo recuerda (partida.estado.postigos). Origen: en el centro del hueco, en la cara de fuera, con lo de fuera
// hacia -z local. "ancho": el del hueco.
const POSTIGOS_VEL = 3;   // radianes por segundo
AFRAME.registerComponent('postigos', {
  schema: { ancho: { default: 1 }, alto: { default: 1 } },
  init() {
    const { ancho, alto } = this.data, media = ancho / 2 + 0.02;
    const material = new THREE.MeshStandardMaterial({ color: '#4a3424', roughness: 0.9 });
    this.hojas = [-1, 1].map(lado => {
      // la bisagra, en el borde del hueco; la hoja, abierta, hacia fuera de él
      const bisagra = new THREE.Group();
      bisagra.position.x = lado * media;
      const hoja = new THREE.Mesh(new THREE.BoxGeometry(media, alto, 0.05), material);
      hoja.position.x = lado * media / 2;
      bisagra.add(hoja);
      this.el.object3D.add(bisagra);
      return { bisagra, cerrada: lado * Math.PI };   // (el signo hace que giren por fuera, no contra la pared)
    });
    this.material = material;
    this.cerrados = !!partida.estado.postigos;
    this.giro = this.cerrados ? 1 : 0;   // 0 abiertos, 1 cerrados
    this.poner();
    // lo que recibe el rayo: el hueco, por dentro
    const rayo = document.createElement('a-box');
    rayo.classList.add('clicable');
    rayo.setAttribute('position', '0 0 0.3'); rayo.setAttribute('width', ancho); rayo.setAttribute('height', alto); rayo.setAttribute('depth', 0.1);
    rayo.setAttribute('material', 'visible: false');
    rayo.addEventListener('mouseenter', () => partida.avisar(`Aprieta el gatillo para ${this.cerrados ? 'abrir' : 'cerrar'} los postigos.`));
    this.ultimo = 0;
    rayo.addEventListener('mousedown', () => {
      if (performance.now() - this.ultimo < 500) return;
      this.ultimo = performance.now();
      this.cerrados = !this.cerrados;
      partida.estado.postigos = this.cerrados;
      partida.escribir();
    });
    this.el.appendChild(rayo);
  },
  poner() { for (const h of this.hojas) h.bisagra.rotation.y = h.cerrada * this.giro; },
  tick(t, dt) {
    const meta = this.cerrados ? 1 : 0;
    if (this.giro === meta || !dt) return;
    const paso = Math.min(dt, 100) / 1000 * POSTIGOS_VEL / Math.PI;
    this.giro = meta > this.giro ? Math.min(meta, this.giro + paso) : Math.max(meta, this.giro - paso);
    this.poner();
  },
  remove() {
    for (const h of this.hojas) { h.bisagra.parent.remove(h.bisagra); h.bisagra.children[0].geometry.dispose(); }
    this.material.dispose();
  }
});

// La cama de tu habitación: al apuntarle y apretar el gatillo, se puede dormir hasta el día siguiente
AFRAME.registerComponent('cama-dormir', {
  init() {
    this.quitar = null; this.ojo = new THREE.Vector3();
    cajaDeRayo(this.el, 0, 0.35, 0, 1.05, 0.7, 2.05, () => {
      if (this.quitar) return this.cerrar();
      const charla = { texto: '¿Dormir hasta mañana?', opciones: [{ texto: 'Dormir', hacer: () => partida.terminarDia('Buenos días.') }, { texto: 'Todavía no' }] };
      this.quitar = tablaDeOpciones(this.el.sceneEl, sitioDeLectura(this.el.sceneEl), charla, op => {
        this.cerrar();
        if (op.hacer) op.hacer();
      });
    });
  },
  cerrar() { if (this.quitar) this.quitar(); this.quitar = null; },
  tick() { if (this.quitar && seHaAlejado(this.el, this.ojo)) this.cerrar(); },
  remove() { this.cerrar(); }
});

// Posadero: va junto a "criado", que lo mueve por detrás del mostrador; aquí, hablar con él.
AFRAME.registerComponent('posadero', {
  init() {
    this.quitar = null; this.ojo = new THREE.Vector3();
    cajaDeRayo(this.el, 0, 0.95, 0, 0.9, 1.9, 0.9, () => {
      if (this.quitar) return this.cerrar();
      this.el.components.criado.charlando = true;
      // con el encargo ya aceptado (o cumplido), ya no hace falta que lo repita
      const e = partida.estado, conEncargo = e.mision || e.hechas.includes('boda');
      const charla = conEncargo
        ? { texto: 'Buen viaje. Y ten cuidado con los puntos del día.', opciones: [{ texto: 'Gracias' }] }
        : { texto: 'La taberna está aquí al lado: saliendo por la puerta, a la izquierda. Allí el tabernero anda buscando quien le haga un encargo.', opciones: [{ texto: 'Gracias' }] };
      this.quitar = tablaDeOpciones(this.el.sceneEl, sitioDeLectura(this.el.sceneEl), charla, () => this.cerrar());
    });
  },
  // El paso del tutorial se da al acabar la charla: si no, su aviso sale encima de la tabla
  cerrar() {
    if (!this.quitar) return;
    this.quitar();
    this.quitar = null;
    if (this.el.components.criado) this.el.components.criado.charlando = false;
    partida.marcarTutorial('posadero');
  },
  tick() { if (this.quitar && seHaAlejado(this.el, this.ojo)) this.cerrar(); },
  remove() { if (this.quitar) this.quitar(); this.quitar = null; }
});

// Rombo dorado que flota sobre lo que el tutorial pide ahora (el "quien" de partida.pasoTutorial).
AFRAME.registerComponent('marca-paso', {
  schema: { quien: { default: '' }, y: { default: 2.25 } },
  init() {
    this.marca = new THREE.Mesh(new THREE.OctahedronGeometry(0.11), new THREE.MeshBasicMaterial({ color: '#e0b040', fog: false }));
    this.marca.scale.y = 1.7;
    this.marca.visible = false;
    this.el.object3D.add(this.marca);
    this.mirado = 0;
  },
  tick(t) {
    if (t - this.mirado > MARCA_CADA_MS) {
      this.mirado = t;
      const paso = partida.pasoTutorial();
      this.marca.visible = !!paso && paso.quien === this.data.quien;
    }
    if (this.marca.visible) { this.marca.position.y = this.data.y + 0.06 * Math.sin(t / 400); this.marca.rotation.y = t / 700; }
  },
  remove() {
    this.el.object3D.remove(this.marca);
    this.marca.geometry.dispose(); this.marca.material.dispose();
  }
});

function geometriaDeCopa() {
  const perfil = [[0, 0], [0.043, 0], [0.04, 0.01], [0.014, 0.018], [0.009, 0.03], [0.009, 0.07], [0.016, 0.082], [0.034, 0.1], [0.043, 0.13], [0.044, 0.155], [0, 0.092]].map(([x, y]) => new THREE.Vector2(x, y));
  return new THREE.LatheGeometry(perfil, 14);
}

// Copa que se coge acercando la mano y con el gatillo lateral (va junto a "agarrable", con "cercania"). Brilla un
// poco cuando la mano llega. Al soltarla, de pie, cae sobre lo que tenga debajo.
AFRAME.registerComponent('copa', {
  init() {
    // de una sola pieza, un perfil que da la vuelta: en la boda hay muchas
    this.material = new THREE.MeshStandardMaterial({ color: '#8a7a5c', roughness: 0.45, metalness: 0.6, side: THREE.DoubleSide });
    this.el.setObject3D('mesh', new THREE.Mesh(geometriaDeCopa(), this.material));
    this.el.addEventListener('al-alcance', e => this.material.emissive.set(e.detail ? '#5a4310' : '#000000'));
    this.cayendo = false; this.v = 0;
    this.el.addEventListener('soltado', () => {
      const o = this.el.object3D;
      o.rotation.set(0, o.rotation.y, 0);   // de pie
      this.base = this.alturaDebajo();
      this.cayendo = true; this.v = 0;
    });
  },
  // Lo que tiene debajo de verdad, mirando las mallas: los obstáculos no sirven, que no miden lo mismo que los
  // muebles. Se mira una sola vez, al soltarla. Las caras solo se ven por delante, así que el techo no cuenta.
  alturaDebajo() {
    const o = this.el.object3D.position;
    const rayo = new THREE.Raycaster(new THREE.Vector3(o.x, o.y + 0.1, o.z), new THREE.Vector3(0, -1, 0), 0, 30);
    const golpes = rayo.intersectObject(this.el.sceneEl.components.zonas.raiz.object3D, true);
    for (const g of golpes) {
      let propio = false;
      for (let p = g.object; p; p = p.parent) if (p === this.el.object3D) propio = true;
      if (!propio && g.object.material.visible !== false && !g.object.material.transparent) return g.point.y + 0.002;
    }
    return alturaTerreno(o.x, o.z);
  },
  tick(t, dt) {
    if (!this.cayendo || !dt) return;
    const o = this.el.object3D.position;
    this.v += 9.8 * Math.min(dt, 50) / 1000;
    o.y -= this.v * Math.min(dt, 50) / 1000;
    if (o.y <= this.base) { o.y = this.base; this.cayendo = false; }
  },
  remove() {
    this.el.getObject3D('mesh').geometry.dispose();
    this.el.removeObject3D('mesh');
    this.material.dispose();
  }
});
