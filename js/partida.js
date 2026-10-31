// Editor VR: el juego. Estado de la partida (misión, puntos, día, lo aprendido, lo que llevas), guardado en
// el navegador, y sus reglas: entrar en una zona cuesta puntos, andar dentro es gratis y sin misión todo es
// gratis. Diseño: JUEGO.md. Aquí también el indicador de puntos y los avisos que se ven en VR.

// Lo que cuesta entrar en cada zona. Acordados: bosque y montaña; lago y poblado salen de la ruta de la
// boda en JUEGO.md. Los demás son provisionales.
const PRECIOS_ZONA = { castillo: 1, bosque: 1, lago: 1, poblado: 1, montana: 3, acantilado: 2, puerto: 2, abadia: 3, cueva: 2, mazmorras: 2 };
// Zonas a las que se llega por una puerta o una boca, no por los PASOS: para el camino del viaje rápido
const ENTRADAS_ZONA = [['bosque', 'cueva'], ['castillo', 'mazmorras']];
const MISIONES = {
  boda: { titulo: 'El pescado de la boda', presupuesto: 6, pago: 5 },   // (el pago es provisional)
};
const PUNTOS_COMIDA = { crudo: 1, asado: 3 };   // propuesta de JUEGO.md
// Cada día empieza dentro de la posada, mirando al mostrador (propuesta de JUEGO.md)
const INICIO_DIA = { zona: 'poblado', x: 163, z: -92.8, giro: Math.PI };
const CLAVE_PARTIDA = 'editorvr-partida';
const AVISO_MS = 4500;

const partida = {
  estado: null,
  nuevo() { return { dia: 1, mision: null, puntos: 0, monedas: 0, pescado: null, pescadoHoy: false, aprendido: [], hechas: [], bodaDia: null, bodaVista: null }; },
  cargar() {
    this.estado = this.nuevo();
    let guardada = null;
    try { guardada = JSON.parse(localStorage.getItem(CLAVE_PARTIDA)); } catch (e) {}
    // una partida nueva empieza en la posada (lo mira zonas.js al cargar la primera zona)
    this.empezando = !guardada || location.search.includes('partidanueva');
    if (this.empezando) this.guardar();
    else Object.assign(this.estado, guardada);
    if (this.estado.hechas.includes('boda') && this.estado.bodaDia === null) this.estado.bodaDia = this.estado.dia;   // (partidas de antes de la boda)
  },
  // (lo mira quien enseña el estado: indicador y diario)
  guardar() {
    try { localStorage.setItem(CLAVE_PARTIDA, JSON.stringify(this.estado)); } catch (e) {}
    document.dispatchEvent(new CustomEvent('partida-cambia'));
  },
  avisar(texto) { document.dispatchEvent(new CustomEvent('partida-aviso', { detail: texto })); },
  aprender(texto) { if (!this.estado.aprendido.includes(texto)) this.estado.aprendido.push(texto); },
  misionActiva() { return MISIONES[this.estado.mision] || null; },
  precio(nombre) { return this.misionActiva() ? PRECIOS_ZONA[nombre] ?? 0 : 0; },
  puedeEntrar(nombre) { return nombre === zonaCargada.nombre || this.estado.puntos >= this.precio(nombre); },

  // Lo que cuesta el viaje rápido: las entradas de todas las zonas del camino más barato hasta "nombre"
  precioViaje(nombre) {
    const lados = [...PASOS.map(p => [p.a, p.b]), ...ENTRADAS_ZONA], coste = { [zonaCargada.nombre]: 0 };
    for (let otra = true; otra;) {
      otra = false;
      for (const [a, b] of lados) for (const [de, a2] of [[a, b], [b, a]]) {
        if (coste[de] === undefined) continue;
        const c = coste[de] + this.precio(a2);
        if (coste[a2] === undefined || c < coste[a2]) { coste[a2] = c; otra = true; }
      }
    }
    return coste[nombre] ?? this.precio(nombre);
  },
  // Paga la entrada (o, en el viaje rápido, lo que diga "precio"). Si no llega, no se entra: con algún punto
  // solo sale el aviso, y con cero acaba el día.
  entrar(nombre, precio = this.precio(nombre)) {
    const e = this.estado;
    if (nombre === zonaCargada.nombre || !precio) return true;
    const titulo = MUNDO[nombre].titulo;
    if (e.puntos >= precio) {
      e.puntos -= precio;
      this.guardar();
      this.avisar(`${titulo}: ${precio} ${precio === 1 ? 'punto' : 'puntos'}. Te ${e.puntos === 1 ? 'queda' : 'quedan'} ${e.puntos}.`);
      return true;
    }
    if (e.puntos === 0) this.terminarDia('Sin puntos: se acaba el día.');
    else this.avisar(`${titulo} cuesta ${precio} puntos y te ${e.puntos === 1 ? 'queda 1' : `quedan ${e.puntos}`}.`);
    return false;
  },
  // Otro día, otro intento: presupuesto entero, se puede volver a pescar y lo pescado se ha estropeado.
  // Lo aprendido y las monedas se quedan.
  empezarDia() {
    const e = this.estado, m = this.misionActiva();
    e.dia++;
    e.puntos = m ? m.presupuesto : 0;
    e.pescado = null;
    e.pescadoHoy = false;
  },
  terminarDia(motivo) {
    if (cambiandoDeZona || enBarco) return;
    this.empezarDia();
    this.guardar();
    const m = this.misionActiva();
    const boda = this.bodaHoy() ? ' Hoy es la boda, en la plaza.' : '';
    this.avisar(`${motivo ? motivo + ' ' : ''}Día ${this.estado.dia}.${m ? ` Tienes ${m.presupuesto} puntos.` : ''}${boda}`);
    const { zona, x, z, giro } = INICIO_DIA;
    document.querySelector('a-scene').components.zonas.ir(zona, { x, z, giro });
  },

  // --- Pescar, asar y comer ---
  // con misión, una vez al día; sin misión, todo lo que se quiera. Y solo una carta de cada tipo: con un
  // pescado encima, crudo o asado, no se coge otro
  puedePescar() { return !this.estado.pescado && (!this.misionActiva() || !this.estado.pescadoHoy); },
  pescar() {
    this.estado.pescado = 'crudo';
    this.estado.pescadoHoy = true;
    this.aprender('Los peces del lago se pescan junto al embarcadero del sur.');
    this.guardar();
    this.avisar(this.estado.mision === 'boda' ? 'Has pescado uno. Llévaselo al camarero.' : 'Has pescado uno. Se come desde el inventario.');
  },
  asar() {
    if (this.estado.pescado === 'crudo') {
      this.estado.pescado = 'asado';
      this.aprender('El pescado asado en una hoguera alimenta más que crudo.');
      this.guardar();
      this.avisar('Pescado asado.');
    } else this.avisar(this.estado.pescado ? 'Este pescado ya está asado.' : 'No llevas nada que asar.');
  },
  comer() {
    const e = this.estado, comida = e.pescado;
    if (!comida) return;
    e.pescado = null;
    // sin misión los puntos no cuentan
    if (this.misionActiva()) {
      e.puntos += PUNTOS_COMIDA[comida];
      this.guardar();
      const sinEncargo = e.mision === 'boda' ? ' Te quedas sin encargo: habrá que pescar otro día.' : '';
      this.avisar(`Te comes el pescado: ${PUNTOS_COMIDA[comida]} ${PUNTOS_COMIDA[comida] === 1 ? 'punto' : 'puntos'}. Tienes ${e.puntos}.${sinEncargo}`);
    } else { this.guardar(); this.avisar('Te comes el pescado. Buen provecho.'); }
  },

  // --- La misión del tutorial ---
  aceptarBoda() {
    this.estado.mision = 'boda';
    this.empezarDia();   // día nuevo: nada de llevar el pescado preparado (idea de JUEGO.md)
    this.aprender('El camarero de la posada se casa y quiere pescado para el banquete.');
    this.guardar();
    this.avisar(`Misión: ${MISIONES.boda.titulo}. Tienes ${MISIONES.boda.presupuesto} puntos.`);
  },
  entregarBoda() {
    const e = this.estado;
    // se paga solo la primera vez: repetirla no da monedas
    const repetida = e.hechas.includes('boda');
    e.pescado = null;
    if (!repetida) { e.monedas += MISIONES.boda.pago; e.hechas.push('boda'); e.bodaDia = e.dia; }
    e.mision = null;
    e.puntos = 0;
    this.guardar();
    this.avisar(repetida ? 'Misión cumplida otra vez. Esta vez no hay paga.' : `Misión cumplida: ${MISIONES.boda.pago} monedas de plata.`);
  },
  // La boda se celebra desde el día siguiente al de la entrega hasta el día en que se va a ella (y no se la pierde nadie)
  bodaHoy() {
    const e = this.estado;
    return !this.misionActiva() && e.bodaDia !== null && e.dia > e.bodaDia && (e.bodaVista === null || e.bodaVista === e.dia);
  },
  bodaPendiente() { const e = this.estado; return e.bodaDia !== null && e.bodaVista === null; },
  asistirBoda() {
    this.estado.bodaVista = this.estado.dia;
    this.aprender('El camarero se ha casado, y en su banquete se sirvió tu pescado.');
    this.guardar();
  },
  // Qué dice el camarero ahora: su frase y las respuestas (texto y qué hacen; sin "hacer", se acaba la charla)
  charlaCamarero() {
    const e = this.estado, b = MISIONES.boda;
    if (e.mision !== 'boda' && this.bodaPendiente()) return {
      texto: 'La boda es mañana, en la plaza, y hay una silla para ti en la mesa. Termina el día desde el diario y ven.',
      opciones: [{ texto: 'Allí estaré' }],
    };
    if (e.mision !== 'boda' && e.hechas.includes('boda')) return {
      texto: 'Gracias por el pescado. La boda va a ser sonada. Si quieres traerme otro, tendrás otra vez los puntos, pero ya te pagué.',
      opciones: [{ texto: 'Repetir el encargo', hacer: () => this.aceptarBoda() }, { texto: 'Enhorabuena' }],
    };
    if (e.mision !== 'boda') return {
      texto: `Me caso, y quiero dar un banquete con pescado del lago. ¿Me traes uno? Te doy ${b.presupuesto} puntos para el camino y te pago en monedas de plata.`,
      opciones: [{ texto: 'Acepto', hacer: () => this.aceptarBoda() }, { texto: 'Ahora no' }],
    };
    if (e.pescado) return {
      texto: '¡Ese pescado es justo lo que me hacía falta!',
      opciones: [{ texto: 'Aquí lo tienes', hacer: () => this.entregarBoda() }, { texto: 'Todavía no' }],
    };
    return {
      texto: e.pescadoHoy ? 'Hoy ya has pescado y no traes nada. Mañana será otro día: termínalo desde el diario.'
        : 'Por el bosque se llega al lago. Los peces están junto al embarcadero del sur. Cada zona en la que entras gasta puntos.',
      opciones: [{ texto: 'Voy' }],
    };
  },
};

// Parte un texto en las líneas que caben en "ancho" con la letra que tenga el contexto
function partirTexto(g, texto, ancho) {
  const lineas = [];
  let linea = '';
  for (const palabra of texto.split(' ')) {
    const prueba = linea ? linea + ' ' + palabra : palabra;
    if (linea && g.measureText(prueba).width > ancho) { lineas.push(linea); linea = palabra; }
    else linea = prueba;
  }
  lineas.push(linea);
  return lineas;
}

// Plano de madera oscura pegado a la cámara, por delante de todo y sin niebla (como el letrero de las zonas)
function tablaEnCamara(ancho, alto, x, y, z) {
  const lienzo = document.createElement('canvas');
  lienzo.width = Math.round(ancho * 640); lienzo.height = Math.round(alto * 640);
  const tex = new THREE.CanvasTexture(lienzo);
  tex.colorSpace = THREE.SRGBColorSpace;
  const malla = new THREE.Mesh(new THREE.PlaneGeometry(ancho, alto),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false, fog: false }));
  malla.position.set(x, y, z);
  malla.renderOrder = 996;
  malla.visible = false;
  return { lienzo, tex, malla };
}
function fondoDeTabla(g, W, H) {
  g.clearRect(0, 0, W, H);
  g.fillStyle = '#2e2116'; g.fillRect(0, 0, W, H);
  g.strokeStyle = '#4a4640'; g.lineWidth = 6; g.strokeRect(3, 3, W - 6, H - 6);
  g.fillStyle = '#d8c7a0'; g.textAlign = 'center'; g.textBaseline = 'middle';
}

// Carta del pescado, como un naipe de pergamino: el pez, cómo está y lo que da al comerlo. En la mano,
// sin dibujar el pez ("conPez" a false): va delante el de verdad, en 3D.
function dibujarCartaPescado(g, W, H, estado, conPez = true) {
  const asado = estado === 'asado', TINTA = '#3a2616';
  g.fillStyle = '#d7c49a'; g.fillRect(0, 0, W, H);
  g.strokeStyle = TINTA; g.lineWidth = 10; g.strokeRect(8, 8, W - 16, H - 16);
  g.lineWidth = 2; g.strokeRect(22, 22, W - 44, H - 44);
  g.fillStyle = TINTA; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '600 46px Georgia, serif'; g.fillText('Pescado', W / 2, 70);
  if (!conPez) return pieDeCartaPescado(g, W, H, estado);
  // el pez, con la cola a la izquierda
  const cx = W / 2 + 18, cy = H * 0.46, cuerpo = asado ? '#8a5a2c' : '#6f8a86';
  g.fillStyle = asado ? '#5c3a1c' : '#34464a';
  g.beginPath(); g.moveTo(cx - 80, cy); g.lineTo(cx - 145, cy - 42); g.lineTo(cx - 128, cy); g.lineTo(cx - 145, cy + 42); g.closePath(); g.fill();
  g.fillStyle = cuerpo;
  g.beginPath(); g.ellipse(cx, cy, 98, 42, 0, 0, Math.PI * 2); g.fill();
  g.strokeStyle = TINTA; g.lineWidth = 3; g.stroke();
  g.fillStyle = '#17100a'; g.beginPath(); g.arc(cx + 66, cy - 10, 6, 0, Math.PI * 2); g.fill();
  // asado, las marcas de la parrilla
  if (asado) {
    g.strokeStyle = '#2b1a0c'; g.lineWidth = 6;
    for (const x of [-50, -18, 14, 46]) { g.beginPath(); g.moveTo(cx + x - 8, cy - 28); g.lineTo(cx + x + 8, cy + 28); g.stroke(); }
  }
  pieDeCartaPescado(g, W, H, estado);
}
function pieDeCartaPescado(g, W, H, estado) {
  g.fillStyle = '#3a2616';
  g.font = 'italic 38px Georgia, serif'; g.fillText(estado === 'asado' ? 'Asado' : 'Crudo', W / 2, H * 0.7);
  const puntos = PUNTOS_COMIDA[estado];
  g.font = '28px Georgia, serif'; g.fillText(`Comerlo: ${puntos} ${puntos === 1 ? 'punto' : 'puntos'}`, W / 2, H * 0.84);
}

// El indicador (abajo a la izquierda, solo con misión), los avisos (delante, unos segundos) y la carta de lo
// que llevas (en VR, en el mando izquierdo; fuera, abajo a la derecha)
AFRAME.registerComponent('partida', {
  init() {
    this.indicador = tablaEnCamara(0.42, 0.11, -0.5, -0.42, -1.3);
    this.aviso = tablaEnCamara(1.5, 0.34, 0, -0.1, -2);
    this.avisoMs = 0;
    this.carta = tablaEnCamara(0.09, 0.13, 0, 0, 0);
    this.carta.lienzo.width = 360; this.carta.lienzo.height = 520;
    // el pez en 3D, delante de la carta: el mismo de los bancos (js/animales.js). Transparente solo para
    // dibujarse después de ella, que no mira la profundidad y lo taparía
    this.pez = new THREE.Mesh(formaDePez(), new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, fog: false, transparent: true }));
    this.pez.scale.setScalar(0.1);
    this.pez.position.set(0, 0.012, 0.025);
    this.pez.renderOrder = 996.5;
    this.carta.malla.add(this.pez);
    this.colocarCarta = () => {
      const c = this.carta.malla, mando = document.querySelector('[laser-controls="hand: left"]');
      if (this.el.is('vr-mode') && mando) {
        mando.object3D.add(c);
        c.position.set(0, 0.07, -0.08); c.rotation.set(-0.7, 0, 0); c.scale.setScalar(1);
      } else if (this.el.camera) {
        this.el.camera.el.object3D.add(c);
        c.position.set(0.52, -0.36, -1.3); c.rotation.set(0, 0, 0); c.scale.setScalar(2.4);
      }
    };
    this.el.addEventListener('enter-vr', () => { for (const ms of [300, 1000, 2500]) setTimeout(this.colocarCarta, ms); });
    this.el.addEventListener('exit-vr', this.colocarCarta);
    this.pintarIndicador = this.pintarIndicador.bind(this);
    this.alAviso = e => this.mostrarAviso(e.detail);
    document.addEventListener('partida-cambia', this.pintarIndicador);
    document.addEventListener('partida-aviso', this.alAviso);
    this.pintarIndicador();
  },
  remove() {
    document.removeEventListener('partida-cambia', this.pintarIndicador);
    document.removeEventListener('partida-aviso', this.alAviso);
  },
  pintarIndicador() {
    const e = partida.estado, { lienzo, tex, malla } = this.indicador;
    this.pintarCarta();
    malla.visible = !!partida.misionActiva();
    if (!malla.visible) return;
    const g = lienzo.getContext('2d'), W = lienzo.width, H = lienzo.height;
    fondoDeTabla(g, W, H);
    g.font = '600 26px Georgia, serif';
    g.fillText(`Día ${e.dia}  ·  ${e.puntos} ${e.puntos === 1 ? 'punto' : 'puntos'}`, W / 2, e.pescado ? H * 0.34 : H / 2);
    if (e.pescado) { g.font = '20px Georgia, serif'; g.fillText(`Llevas pescado ${e.pescado}`, W / 2, H * 0.7); }
    tex.needsUpdate = true;
  },
  pintarCarta() {
    const { lienzo, tex, malla } = this.carta, e = partida.estado.pescado;
    malla.visible = !!e;
    if (!e || e === this.cartaPintada) return;
    this.cartaPintada = e;
    dibujarCartaPescado(lienzo.getContext('2d'), lienzo.width, lienzo.height, e, false);
    tex.needsUpdate = true;
    this.pez.material.color.set(e === 'asado' ? '#a8703a' : '#ffffff');   // asado, tostado
  },
  mostrarAviso(texto) {
    if (texto === this.ultimoAviso && this.avisoMs > AVISO_MS - 1500) return;   // (al empujar contra un paso cerrado)
    this.ultimoAviso = texto;
    const { lienzo, tex, malla } = this.aviso, g = lienzo.getContext('2d'), W = lienzo.width, H = lienzo.height;
    fondoDeTabla(g, W, H);
    let letra = 46, lineas;
    do {
      g.font = `600 ${letra}px Georgia, serif`;
      lineas = partirTexto(g, texto, W - 50);
      letra -= 4;
    } while (lineas.length * (letra + 12) > H - 16 && letra > 16);
    const alto = letra + 12;
    lineas.forEach((l, i) => g.fillText(l, W / 2, H / 2 + (i - (lineas.length - 1) / 2) * alto + 2));
    tex.needsUpdate = true;
    malla.visible = true;
    this.avisoMs = AVISO_MS;
  },
  tick(t, dt) {
    const camara = this.el.camera && this.el.camera.el.object3D;
    if (!camara) return;
    if (this.indicador.malla.parent !== camara) { camara.add(this.indicador.malla, this.aviso.malla); this.colocarCarta(); }
    if (this.carta.malla.visible) this.pez.rotation.y = Math.PI / 2 + 0.4 * Math.sin(t / 900);   // de costado, y se mece
    if (!this.aviso.malla.visible) return;
    this.avisoMs -= Math.min(dt || 0, 100);
    if (this.avisoMs <= 0) this.aviso.malla.visible = false;
    else this.aviso.malla.material.opacity = Math.min(1, this.avisoMs / 800);
  }
});

partida.cargar();
