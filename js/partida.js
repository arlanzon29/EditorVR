// Editor VR: el juego. Estado de la partida (misión, puntos, día, lo aprendido, lo que llevas), guardado en
// el navegador, y sus reglas: entrar en una zona cuesta puntos, andar dentro es gratis y sin misión todo es
// gratis. Diseño: JUEGO.md. Aquí también el indicador de puntos y los avisos que se ven en VR.

// Lo que cuesta entrar en cada zona. Acordados: bosque y montaña; lago y poblado salen de la ruta de la
// boda en JUEGO.md. Los demás son provisionales.
const PRECIOS_ZONA = { castillo: 1, bosque: 1, lago: 1, poblado: 1, montana: 3, acantilado: 2, puerto: 2, abadia: 3, cueva: 2, mazmorras: 2 };
// Zonas a las que se llega por una puerta o una boca, no por los PASOS: para el camino del viaje rápido
const ENTRADAS_ZONA = [['bosque', 'cueva'], ['castillo', 'mazmorras']];
const MISIONES = {
  boda: { titulo: 'El pescado de la boda', presupuesto: 9, pago: 5 },   // (el pago es provisional)
};
const PUNTOS_PESCAR = 3;   // lo que cuesta pescar con misión
const PUNTOS_COMIDA = { crudo: 1, asado: 3 };   // propuesta de JUEGO.md
// Cada día empieza en tu habitación de la posada, arriba, mirando a la puerta
const INICIO_DIA = { zona: 'poblado', x: 174.8, y: 3.2, z: -101.8, giro: Math.PI };
const CLAVE_PARTIDA = 'editorvr-partida';
const AVISO_MS = 4500;
const BIENVENIDA_MS = 8000;

const partida = {
  estado: null,
  nuevo() { return { dia: 1, mision: null, puntos: 0, monedas: 0, pescado: null, pescadoHoy: false, cofre: [], tutorial: {}, aprendido: [], hechas: [], bodaDia: null, bodaVista: null }; },
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
    setTimeout(() => this.comprobarPaso());   // (después del aviso de lo que acaba de pasar: el tutorial manda)
  },

  // --- El tutorial: qué toca ahora, según cómo va la partida; así aguanta perder el pescado o acabar el día.
  // Lo marca el rombo de lo que diga "quien" (marca-paso), el aro del mapa en "zona", el aviso y el diario.
  pasoTutorial() {
    const e = this.estado, t = e.tutorial;
    if (e.bodaVista !== null) return null;
    if (!t.puerta) return { id: 'puerta', quien: 'puerta', texto: 'Apunta a la puerta con el mando derecho y aprieta el gatillo para abrirla.' };
    if (!t.posadero) return { id: 'posadero', quien: 'posadero', texto: 'Anda con el joystick izquierdo. Baja por la escalera del pasillo y habla con el posadero: apúntale y aprieta el gatillo.' };
    if (e.hechas.includes('boda')) {
      if (e.dia === e.bodaDia && !t.alliEstare) return { id: 'responder', callado: true, quien: 'tabernero', texto: 'Contesta al tabernero.' };
      if (e.dia === e.bodaDia) return { id: 'dormir', quien: 'cama', zona: 'poblado', texto: 'Encargo cumplido. Vuelve a tu habitación de la posada y duerme: apunta a la cama y aprieta el gatillo.' };
      return { id: 'boda', quien: 'boda', zona: 'poblado', texto: 'Hoy es la boda, en la plaza, delante de la iglesia. Apunta a la silla libre y aprieta el gatillo para sentarte.' };
    }
    if (e.mision !== 'boda') return { id: 'tabernero', quien: 'tabernero', texto: 'La taberna está aquí al lado. Apunta al tabernero, aprieta el gatillo y acepta su encargo.' };
    if (e.pescado) return { id: 'volver', quien: 'tabernero', zona: 'poblado', texto: 'Abre el mapa con A o Y, apunta al sello del poblado y aprieta el gatillo: el viaje también cuesta puntos. Lleva el pescado al tabernero.' };
    if (zonaCargada.nombre === 'lago') return { id: 'pescar', zona: 'lago', texto: `Ve al embarcadero del sur, apunta a los peces y aprieta el gatillo para pescar. Pescar cuesta ${PUNTOS_PESCAR} puntos.` };
    return { id: 'lago', zona: 'lago', luego: ['Para ver el mapa, pulsa el botón A o Y: el aro dorado marca adónde ir. Apunta a las pestañas de arriba para ver el diario, el inventario o la ayuda, y vuelve a pulsar para cerrarlo.', 'Para ir más deprisa, corre: mantén apretado el gatillo lateral izquierdo mientras andas.'], texto: 'Tienes puntos para el encargo: entrar en cada zona cuesta puntos, y sin ellos se acaba el día. Ve por el camino al bosque y de allí, al norte, al lago.' };
  },
  // Si el paso ha cambiado, lo avisa. Lo llama quien cambia algo y zonas.js, al terminar de cargar una zona.
  comprobarPaso() {
    if (!this.zonaLista) return;
    const paso = this.pasoTutorial(), id = paso ? paso.id : null;
    if (id === this.ultimoPaso) return;
    if (paso && paso.callado) { this.ultimoPaso = id; return; }
    if (paso && paso.id === 'puerta') {
      // lo primero de todo, la bienvenida; y al rato, el primer paso, si no lo has dado ya
      this.avisar('Te damos la bienvenida. Has pasado la noche en la posada del poblado, y hoy empieza tu aventura.', true);
      setTimeout(() => { if (this.pasoTutorial()?.id === 'puerta') this.avisar(paso.texto, true); }, BIENVENIDA_MS);
    } else if (paso) {
      // "luego": consejos, uno tras otro, cuando ya ha dado tiempo a leer el aviso de antes
      const decir = (texto, siguen) => {
        this.avisar(texto, true);
        if (siguen.length) setTimeout(() => { if (this.pasoTutorial()?.id === paso.id) decir(siguen[0], siguen.slice(1)); }, texto.length * 90 + 500);
      };
      decir(paso.texto, paso.luego || []);
    }
    else if (this.ultimoPaso) this.avisar('Se acabó el tutorial. Ya sabes moverte por estas tierras.', true);
    this.ultimoPaso = id;
  },
  marcarTutorial(que) { if (!this.estado.tutorial[que]) { this.estado.tutorial[que] = true; this.guardar(); } },
  avisar(texto, tutorial = false) { document.dispatchEvent(new CustomEvent('partida-aviso', { detail: { texto, tutorial } })); },
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
    this.estado.dia++;
    this.prepararDia();
  },
  // Presupuesto entero y sin nada de lo pescado
  prepararDia() {
    const e = this.estado, m = this.misionActiva();
    e.puntos = m ? m.presupuesto : 0;
    e.pescado = null;
    e.cofre = [];   // lo pescado también se estropea en el cofre: si no, se guardaría para la misión
    e.pescadoHoy = false;
  },
  // Empezar de cero sin salir de VR: como una partida nueva, en tu habitación
  reiniciar() {
    if (cambiandoDeZona || enBarco) return;
    this.estado = this.nuevo();
    this.ultimoPaso = undefined;
    this.guardar();
    const { zona, x, y, z, giro } = INICIO_DIA;
    document.querySelector('a-scene').components.zonas.ir(zona, { x, y, z, giro });
  },
  // Qué dice el cofre de tu habitación y sus botones (sin "hacer", se cierra). Solo hay pescado que guardar, por ahora.
  opcionesCofre() {
    const e = this.estado, dentro = e.cofre.map(p => `un pescado ${p}`);
    const opciones = [];
    if (e.pescado) opciones.push({ texto: `Guardar el pescado ${e.pescado}`, hacer: () => { e.cofre.push(e.pescado); e.pescado = null; this.guardar(); } });
    if (e.cofre.length && !e.pescado) opciones.push({ texto: `Sacar el pescado ${e.cofre[0]}`, hacer: () => { e.pescado = e.cofre.shift(); this.guardar(); } });
    opciones.push({ texto: 'Cerrar' });
    return { texto: dentro.length ? `Dentro hay ${dentro.join(', ')}.` : 'El cofre está vacío.', opciones };
  },
  terminarDia(motivo) {
    if (cambiandoDeZona || enBarco) return;
    this.empezarDia();
    this.guardar();
    const m = this.misionActiva();
    const boda = this.bodaHoy() ? ' Hoy es la boda, en la plaza.' : '';
    this.avisar(`${motivo ? motivo + ' ' : ''}Día ${this.estado.dia}.${m ? ` Tienes ${m.presupuesto} puntos.` : ''}${boda}`);
    const { zona, x, y, z, giro } = INICIO_DIA;
    document.querySelector('a-scene').components.zonas.ir(zona, { x, y, z, giro });
  },

  // --- Pescar, asar y comer ---
  // con misión, una vez al día; sin misión, todo lo que se quiera. Y solo una carta de cada tipo: con un
  // pescado encima, crudo o asado, no se coge otro
  puedePescar() { return !this.estado.pescado && (!this.misionActiva() || !this.estado.pescadoHoy); },
  pescar() {
    if (this.misionActiva()) this.estado.puntos -= PUNTOS_PESCAR;
    this.estado.pescado = 'crudo';
    this.estado.pescadoHoy = true;
    this.aprender('Los peces del lago se pescan junto al embarcadero del sur.');
    this.guardar();
    this.avisar(this.estado.mision === 'boda' ? `Has pescado uno por ${PUNTOS_PESCAR} puntos. Te ${this.estado.puntos === 1 ? 'queda 1' : `quedan ${this.estado.puntos}`}. Llévaselo al tabernero.` : 'Has pescado uno. Se come desde el inventario.');
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
    this.prepararDia();   // sin cambiar de día, pero nada de llevar el pescado preparado (idea de JUEGO.md)
    this.aprender('El tabernero se casa y quiere pescado para el banquete.');
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
    this.aprender('El tabernero se ha casado, y en su banquete se sirvió tu pescado.');
    this.guardar();
  },
  // Qué dice el camarero ahora: su frase y las respuestas (texto y qué hacen; sin "hacer", se acaba la charla)
  charlaCamarero() {
    const e = this.estado, b = MISIONES.boda;
    if (e.mision !== 'boda' && this.bodaPendiente()) return {
      texto: 'La boda es mañana, en la plaza, y hay una silla para ti en la mesa. Duerme en tu cama de la posada y ven.',
      opciones: [{ texto: 'Allí estaré', cierra: true, hacer: () => this.marcarTutorial('alliEstare') }],
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

// Icono del tutorial: un libro abierto en un sello dorado
function iconoTutorial(g, x, y, r) {
  g.save();
  g.fillStyle = '#b8892f'; g.strokeStyle = '#17100a'; g.lineWidth = r * 0.08;
  g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); g.stroke();
  g.fillStyle = '#efe3c2'; g.lineWidth = r * 0.06;
  for (const s of [-1, 1]) {
    g.beginPath(); g.moveTo(x, y - r * 0.32); g.lineTo(x + s * r * 0.62, y - r * 0.46); g.lineTo(x + s * r * 0.62, y + r * 0.34); g.lineTo(x, y + r * 0.48); g.closePath(); g.fill(); g.stroke();
    for (const k of [-0.16, 0.04, 0.24]) { g.beginPath(); g.moveTo(x + s * r * 0.14, y + r * k - r * 0.03); g.lineTo(x + s * r * 0.5, y + r * k - r * 0.09); g.stroke(); }
  }
  g.restore();
}

// El indicador (abajo a la izquierda, solo con misión) y los avisos (delante, unos segundos)
AFRAME.registerComponent('partida', {
  init() {
    this.indicador = tablaEnCamara(0.42, 0.11, -0.5, -0.42, -1.3);
    this.aviso = tablaEnCamara(1.5, 0.34, 0, -0.1, -2);
    this.avisoMs = 0;
    this.pintarIndicador = this.pintarIndicador.bind(this);
    this.alAviso = e => this.mostrarAviso(e.detail.texto, e.detail.tutorial);
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
    malla.visible = !!partida.misionActiva();
    if (!malla.visible) return;
    const g = lienzo.getContext('2d'), W = lienzo.width, H = lienzo.height;
    fondoDeTabla(g, W, H);
    g.font = '600 26px Georgia, serif';
    g.fillText(`Día ${e.dia}  ·  ${e.puntos} ${e.puntos === 1 ? 'punto' : 'puntos'}`, W / 2, e.pescado ? H * 0.34 : H / 2);
    if (e.pescado) { g.font = '20px Georgia, serif'; g.fillText(`Llevas pescado ${e.pescado}`, W / 2, H * 0.7); }
    tex.needsUpdate = true;
  },
  mostrarAviso(texto, tutorial) {
    if (texto === this.ultimoAviso && this.avisoMs > AVISO_MS - 1500) return;   // (al empujar contra un paso cerrado)
    this.ultimoAviso = texto;
    const { lienzo, tex, malla } = this.aviso, g = lienzo.getContext('2d'), W = lienzo.width, H = lienzo.height;
    fondoDeTabla(g, W, H);
    // los del tutorial llevan su icono a la izquierda, y el texto se aparta
    const margen = tutorial ? H * 0.95 : 0, centro = (W + margen) / 2;
    if (tutorial) iconoTutorial(g, H * 0.52, H / 2, H * 0.3);
    let letra = 46, lineas;
    do {
      g.font = `600 ${letra}px Georgia, serif`;
      lineas = partirTexto(g, texto, W - 50 - margen);
      letra -= 4;
    } while (lineas.length * (letra + 12) > H - 16 && letra > 16);
    const alto = letra + 12;
    lineas.forEach((l, i) => g.fillText(l, centro, H / 2 + (i - (lineas.length - 1) / 2) * alto + 2));
    tex.needsUpdate = true;
    malla.visible = true;
    this.avisoMs = Math.max(AVISO_MS, texto.length * 90);   // (lo largo, el tutorial, da tiempo a leerlo)
  },
  tick(t, dt) {
    const camara = this.el.camera && this.el.camera.el.object3D;
    if (!camara) return;
    if (this.indicador.malla.parent !== camara) { camara.add(this.indicador.malla, this.aviso.malla); }
    if (!this.aviso.malla.visible) return;
    this.avisoMs -= Math.min(dt || 0, 100);
    if (this.avisoMs <= 0) this.aviso.malla.visible = false;
    else this.aviso.malla.material.opacity = Math.min(1, this.avisoMs / 800);
  }
});

partida.cargar();
