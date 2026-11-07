// Editor VR: el juego. Estado de la partida (misión, puntos, día, lo aprendido, lo que llevas), guardado en
// el navegador, y sus reglas: entrar en una zona cuesta puntos y andar dentro es gratis; con misión, el día trae su
// presupuesto y, sin ella, PUNTOS_LIBRE. Diseño: JUEGO.md. Aquí también el indicador de puntos y los avisos que se ven en VR.

// Lo que cuesta entrar en cada zona. Acordados: bosque y montaña; lago y poblado salen de la ruta de la
// boda en JUEGO.md. Los demás son provisionales.
const PRECIOS_ZONA = { castillo: 1, bosque: 1, lago: 1, poblado: 1, montana: 3, acantilado: 2, puerto: 2, abadia: 3, cueva: 2, mazmorras: 2 };
// Zonas a las que se llega por una puerta o una boca, no por los PASOS: para el camino del viaje rápido
const ENTRADAS_ZONA = [['bosque', 'cueva'], ['castillo', 'mazmorras']];
// Las únicas zonas a las que se puede ir al empezar (decidido por el usuario); las demás se abrirán más adelante
const ZONAS_ABIERTAS = ['poblado', 'bosque', 'lago'];
const MISIONES = {
  boda: { titulo: 'El pescado de la boda', presupuesto: 9, pago: 5 },   // (el pago es provisional)
  casa: { titulo: 'Tu casa en el poblado', presupuesto: 20 },        // episodio 2 (episodio2.md); el presupuesto es provisional
};
// Episodio 2: con la misión de la casa se abren la cueva y la montaña (antes, cerradas)
const ZONAS_CASA = ['cueva', 'montana'];
// El lobo de la cueva (episodio2.md): una cabeza de lobo, y entrar cuesta estos puntos más. Muerto, no vuelve en la misión.
const PUNTOS_LOBO = 2;
// La partida de depuración salta a cualquier momento de las misiones, con los botones de la hoja de la misión
// (js/mapa.js): cada salto rehace el estado desde cero (conserva las zonas visitadas) y te lleva a su sitio (en el
// poblado: x, z, giro; sin sitio, a tu habitación de la posada).
const T_INICIO = { puerta: true, posadero: true }, T_BODA = { ...T_INICIO, alliEstare: true }, T_BRINDIS = { ...T_BODA, brindis: true };
const despuesDeLaBoda = e => { e.tutorial = { ...T_BRINDIS }; e.hechas = ['boda']; e.bodaDia = e.dia - 2; e.bodaVista = e.dia - 1; e.monedas = MISIONES.boda.pago; };
// (con la casa terminada es de noche: la cena, js/casa.js)
const enLaCasa = (obra, cartas) => e => { despuesDeLaBoda(e); e.mision = 'casa'; e.casaDia = e.dia; e.casaVista = true; e.obra = obra; e.noche = obra >= CASA_OBRAS; if (cartas) e.cartas = { madera: 'troncos', piedra: 'sillar' }; };
const SALTOS_DEPURACION = [
  { nombre: 'Episodio 1: el principio', poner: () => {} },
  { nombre: 'Episodio 1: encargo aceptado', sitio: [162.5, -101, Math.PI], poner: e => { e.tutorial = { ...T_INICIO }; e.mision = 'boda'; e.estrellas = []; } },
  { nombre: 'Episodio 1: con el pescado', sitio: [162.5, -101, Math.PI], poner: e => { e.tutorial = { ...T_INICIO }; e.mision = 'boda'; e.estrellas = []; e.pescado = 'crudo'; e.pescadoHoy = true; } },
  { nombre: 'Episodio 1: el día de la boda', sitio: [161, -132.5, 0], poner: e => { e.tutorial = { ...T_BODA }; e.hechas = ['boda']; e.bodaDia = e.dia - 1; e.monedas = MISIONES.boda.pago; } },
  { nombre: 'Episodio 2: Leonor en la posada', sitio: [181.3, -98.6, 0.6], poner: despuesDeLaBoda },
  { nombre: 'Episodio 2: la casa en ruinas', sitio: [149, -139, 0], poner: enLaCasa(0, false) },
  { nombre: 'Episodio 2: con madera y piedra', sitio: [149, -139, 0], poner: enLaCasa(0, true) },
  { nombre: 'Episodio 2: obra 1 hecha', sitio: [149, -139, 0], poner: enLaCasa(1, true) },
  { nombre: 'Episodio 2: obra 2 hecha', sitio: [149, -139, 0], poner: enLaCasa(2, true) },
  { nombre: 'Episodio 2: la cena', sitio: [148.6, -140.5, 0], poner: enLaCasa(3, false) },
  { nombre: 'Episodio 2: cumplido', sitio: [149, -139, 0], poner: e => { enLaCasa(3, false)(e); e.mision = null; e.hechas.push('casa'); e.cenaVista = e.dia; } },
];
const PISTA_MATERIALES = 'La madera se tala en el bosque y en la isla del lago, y la piedra se pica en la cueva y en la montaña. Cada sitio da una sola carga, y algunos están escondidos.';
const ESTRELLAS_TOTAL = 5;   // las estrellas escondidas que trae la misión (js/estrellas.js)
const PUNTOS_LIBRE = 30;   // los puntos de acción de cada día sin misión (decidido por el usuario)
const PUNTOS_PESCAR = 3;   // lo que cuesta pescar con misión
// y los demás oficios (pedidos por el usuario): cazar el ciervo, talar en el bosque y picar piedra en la cueva
const PUNTOS_CAZAR = 3, PUNTOS_TALAR = 5, PUNTOS_PICAR = 5;
const PRECIO_CARTA = 5;   // monedas de plata que paga el mercader del poblado por cada carta
// lo que da comer, según cómo esté: el pescado (crudo, asado) y la carne (cruda, asada). Propuesta de JUEGO.md
const PUNTOS_COMIDA = { crudo: 1, asado: 3, cruda: 1, asada: 3 };
// Cada día empieza en tu habitación de la posada, arriba, mirando a la puerta: al fondo, entre la cama y el
// taburete, para ver la puerta entera
const INICIO_DIA = { zona: 'poblado', x: 174.05, y: 3.2, z: -103, giro: Math.PI };
// después de la cena del episodio 2 duermes en tu casa (js/casa.js): te despiertas junto a tu cama, mirando al vano
const INICIO_DIA_CASA = { zona: 'poblado', x: 151.8, y: 0, z: -146.3, giro: Math.PI / 2 };
// dónde se empieza el día: en tu habitación de la posada o, con la casa terminada y la cena hecha, en tu casa
function inicioDelDia() { return partida.estado && partida.tieneCasa() ? INICIO_DIA_CASA : INICIO_DIA; }
const CLAVE_PARTIDA = 'editorvr-partida';   // (más el número de la partida)
const CLAVE_RANURA = 'editorvr-ranura';     // en sessionStorage: la que se está jugando, para seguir en ella al recargar
const RANURAS = 3;                          // las partidas que se pueden guardar
// la que tiene el mapa entero (js/mapa.js), el medidor y el cambio de luz horneada; publicada en GitHub Pages no hay
// ninguna (solo en el servidor de casa)
const PARTIDA_DEPURACION = /\.github\.io$/.test(location.hostname) ? null : 1;
// dónde te deja el menú (salas/menu.html): al fondo del salón, a 9,5 m de la tabla, para verlo entero (allí el rayo
// llega más lejos: menu-partidas, js/menu.js)
const MENU_SITIO = { x: 2050, y: 0, z: 8.5, giro: 0 };
const AVISO_MS = 4500;
const BIENVENIDA_MS = 8000;

const partida = {
  estado: null,   // sin partida abierta (en el menú), uno vacío que no se guarda
  ranura: null,   // el número de la partida abierta
  charlaAbierta: false,   // hablando con el tabernero: el tutorial espera a que acabe (comprobarPaso)
  nuevo() { return { dia: 1, mision: null, puntos: PUNTOS_LIBRE, puntosLibres: true, monedas: 0, pescado: null, pescadoHoy: false, cartas: {}, cofre: [], postigos: false, tutorial: {}, aprendido: [], hechas: [], bodaDia: null, bodaVista: null, estrellas: null, obra: 0, farmeados: [], cargas: {}, usados: [], lobo: false, casaDia: null, casaVista: false, cenaVista: null, depura: 0, noche: false, visitadas: [], sitio: null, fecha: null }; },
  cargar() {
    this.estado = this.nuevo();
    this.traerPartidaVieja();
  },
  // La partida de cuando solo había una, con su mapa y su sitio, pasa a ser la primera
  traerPartidaVieja() {
    try {
      const vieja = JSON.parse(localStorage.getItem(CLAVE_PARTIDA));
      if (!vieja) return;
      if (!this.leer(1)) {
        vieja.visitadas = JSON.parse(localStorage.getItem('editorvr-visitadas')) || [];
        const sitio = Object.keys(localStorage).find(k => k.startsWith('editorvr-sitio-2 '));
        if (sitio) vieja.sitio = JSON.parse(localStorage.getItem(sitio));
        localStorage.setItem(`${CLAVE_PARTIDA}-1`, JSON.stringify(vieja));
      }
      for (const k of Object.keys(localStorage)) if (k === CLAVE_PARTIDA || k === 'editorvr-visitadas' || k.startsWith('editorvr-sitio-2 ')) localStorage.removeItem(k);
    } catch (e) {}
  },
  leer(r) {
    try { return JSON.parse(localStorage.getItem(`${CLAVE_PARTIDA}-${r}`)); } catch (e) { return null; }
  },
  // Lo que enseña el menú de una partida (sin nada, si está vacía)
  resumen(r) {
    const e = this.leer(r);
    if (!e) return null;
    const zona = e.sitio ? zonaEn(e.sitio.x, e.sitio.z) : MUNDO[INICIO_DIA.zona];
    return { dia: e.dia, monedas: e.monedas, fecha: e.fecha, zona: zona ? zona.titulo : '', mision: MISIONES[e.mision]?.titulo };
  },
  // La partida de depuración: mapa entero, medidor y cambiar la luz horneada
  depuracion() { return !!PARTIDA_DEPURACION && this.ranura === PARTIDA_DEPURACION; },
  borrar(r) { try { localStorage.removeItem(`${CLAVE_PARTIDA}-${r}`); } catch (e) {} },
  // Al cargar la página: si se ha recargado jugando (o con ?partida=1 en la dirección), a esa partida; si no, al menú
  arrancar() {
    let r = parseInt(new URLSearchParams(location.search).get('partida'), 10);
    try { r = r || parseInt(sessionStorage.getItem(CLAVE_RANURA), 10); } catch (e) {}
    if (r >= 1 && r <= RANURAS) this.abrir(r); else this.irAlMenu();
  },
  // Abre la partida "r" (si está vacía, empieza una en la posada) y va a donde se dejó, sin salir de VR
  abrir(r) {
    if (cambiandoDeZona) return;
    const guardada = this.leer(r);
    this.estado = Object.assign(this.nuevo(), guardada);
    // (las partidas de cuando sin misión no había puntos empiezan con los de hoy)
    if (guardada && !guardada.puntosLibres && !this.estado.mision) this.estado.puntos = PUNTOS_LIBRE;
    if (this.estado.hechas.includes('boda') && this.estado.bodaDia === null) this.estado.bodaDia = this.estado.dia;   // (partidas de antes de la boda)
    this.ranura = r;
    // fuera de la de depuración, la luz que diga la dirección (por si se cambió en aquella)
    if (!this.depuracion()) luzHorneada = !/sinhornear|sinfundir/.test(location.search);
    this.ultimoPaso = undefined;
    try { sessionStorage.setItem(CLAVE_RANURA, r); } catch (e) {}
    document.dispatchEvent(new CustomEvent('partida-abierta'));
    this.guardar();
    const s = this.estado.sitio, zona = s ? (zonaEn(s.x, s.z) || MUNDO.castillo).nombre : INICIO_DIA.zona;
    document.querySelector('a-scene').components.zonas.ir(zona, s || INICIO_DIA);
  },
  // Salir al menú desde el juego: lo hecho ya está guardado, solo falta el sitio exacto. Devuelve si se ha podido.
  salirAlMenu() {
    if (!this.ranura || cambiandoDeZona || enBarco || enLaMesa) return false;
    document.querySelector('[andar-joystick]').components['andar-joystick'].guardarSitio();
    this.irAlMenu();
    return true;
  },
  irAlMenu() {
    this.ranura = null;
    this.zonaLista = false;
    this.estado = this.nuevo();
    try { sessionStorage.removeItem(CLAVE_RANURA); } catch (e) {}
    this.guardar();
    document.querySelector('a-scene').components.zonas.ir('menu', MENU_SITIO);
  },
  escribir() {
    if (!this.ranura) return;
    this.estado.fecha = Date.now();
    try { localStorage.setItem(`${CLAVE_PARTIDA}-${this.ranura}`, JSON.stringify(this.estado)); } catch (e) {}
  },
  // (lo llama andar-joystick cada medio segundo: sin avisar a nadie)
  guardarSitio(sitio) {
    this.estado.sitio = sitio;
    this.escribir();
  },
  // (lo mira quien enseña el estado: indicador y diario)
  guardar() {
    this.escribir();
    document.dispatchEvent(new CustomEvent('partida-cambia'));
    setTimeout(() => this.comprobarPaso());   // (después del aviso de lo que acaba de pasar: el tutorial manda)
  },

  // --- El tutorial: qué toca ahora, según cómo va la partida; así aguanta perder el pescado o acabar el día.
  // Lo marca el rombo de lo que diga "quien" (marca-paso), el aro del mapa en "zona", el aviso y el diario.
  pasoTutorial() {
    const e = this.estado, t = e.tutorial;
    // lo último: sentado a la mesa de la boda, brindar (hasta entonces no se levanta uno; js/boda.js). Luego, el episodio 2
    if (e.bodaVista !== null) return enLaMesa && !t.brindis && e.dia === e.bodaVista ? { id: 'brindar', texto: textoBrindar() } : this.pasoCasa();
    if (!t.puerta) return { id: 'puerta', quien: 'puerta', texto: 'Apunta a la puerta con el mando derecho y aprieta el gatillo para abrirla.' };
    if (!t.posadero) return { id: 'posadero', quien: 'posadero', texto: 'Anda con el joystick izquierdo. Baja por la escalera del pasillo y habla con el posadero: apúntale y aprieta el gatillo.' };
    if (e.hechas.includes('boda')) {
      if (e.dia === e.bodaDia && !t.alliEstare) return { id: 'responder', callado: true, quien: 'tabernero', texto: 'Contesta al tabernero.' };
      if (e.dia === e.bodaDia) return { id: 'dormir', quien: 'cama', zona: 'poblado', texto: 'Encargo cumplido. Vuelve a tu habitación de la posada y duerme: apunta a la cama y aprieta el gatillo.' };
      return { id: 'boda', quien: 'boda', zona: 'poblado', texto: 'Hoy es la boda, en la plaza, delante de la iglesia. Apunta a la silla libre y aprieta el gatillo para sentarte.' };
    }
    if (e.mision !== 'boda') return { id: 'tabernero', quien: 'tabernero', texto: 'El rombo dorado marca al tabernero. Cuando llegues, apúntale, aprieta el gatillo y acepta su encargo.' };
    if (e.pescado) return { id: 'volver', quien: 'tabernero', zona: 'poblado', texto: 'Abre el mapa con A o Y, apunta al sello del poblado y aprieta el gatillo. El viaje cuesta los puntos de las zonas del camino. Lleva el pescado al tabernero.' };
    if (zonaCargada.nombre === 'lago') return { id: 'pescar', zona: 'lago', texto: `Ve al embarcadero del sur, apunta a los peces y aprieta el gatillo para pescar. Pescar cuesta ${PUNTOS_PESCAR} puntos.` };
    return { id: 'lago', zona: 'lago', luego: ['Para ver el mapa, pulsa el botón A o Y: el aro dorado marca adónde ir. Apunta a las pestañas de arriba para ver el diario, el inventario o la ayuda, y vuelve a pulsar para cerrarlo.', 'Para ir más deprisa, corre: mantén apretado el gatillo lateral izquierdo mientras andas.'], texto: 'Tienes puntos para el encargo: entrar en cada zona cuesta puntos, y sin ellos se acaba el día. Ve por el camino al bosque y de allí, al norte, al lago.' };
  },
  // Si el paso ha cambiado, lo avisa. Lo llama quien cambia algo y zonas.js, al terminar de cargar una zona.
  // Mientras se habla con alguien (charlaAbierta), espera: el aviso saldría encima de la charla.
  comprobarPaso() {
    if (!this.zonaLista || this.charlaAbierta) return;
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
    else if (this.ultimoPaso) this.avisar(`Se acabó el tutorial. Ya sabes moverte por estas tierras.${enLaMesa ? ' Puedes levantarte cuando quieras.' : ''}`, true);
    this.ultimoPaso = id;
  },
  // --- Episodio 2, la casa (episodio2.md): al día siguiente de la boda, Leonor te pide que te quedes y repares la casa
  // abandonada de enfrente de la posada (js/casa.js), con tres cargas de madera y tres de piedra; al terminarla, la cena.
  pasoCasa() {
    const e = this.estado;
    // la noche de la cena, a dormir en tu cama nueva (con el rombo); después, nada más
    if (e.hechas.includes('casa')) return e.cenaVista === e.dia ? { id: 'dormir-casa', quien: 'cama-casa', zona: 'poblado', texto: 'Ya tienes casa. Ve a la habitación, apunta a tu cama y aprieta el gatillo para dormir.' } : null;
    if (e.mision !== 'casa') {
      if (e.dia === e.bodaVista) return { id: 'descansar', quien: 'cama', zona: 'poblado', texto: `Se acabó el tutorial.${enLaMesa ? ' Puedes levantarte cuando quieras.' : ''} Ha sido un gran día: vuelve a tu habitación de la posada y duerme. Mañana sigues tu camino.` };
      return { id: 'leonor', quien: 'leonor', zona: 'poblado', texto: 'Hoy te marchas del poblado. Baja a la entrada de la posada: Leonor, la novia, te espera junto a la puerta.' };
    }
    // (sentado ya a la mesa, sin el rombo: quedaría delante de los ojos)
    if (e.obra >= CASA_OBRAS) return { id: 'cena', quien: enLaMesa ? '' : 'cena', zona: 'poblado', texto: 'Tu casa está terminada. Leonor y Garcés te esperan para cenar en tu salón: apunta a la mesa y aprieta el gatillo para sentarte.' };
    // el día que aceptas, Leonor te lleva a la casa (js/casa.js); los demás días ya no está
    if (!e.casaVista && e.obra === 0 && e.casaDia === e.dia) return { id: 'seguir-leonor', quien: 'leonor', zona: 'poblado', texto: 'Sigue a Leonor: te lleva a la casa abandonada, al otro lado de la plaza.' };
    // (en la de depuración la obra no pide cargas, js/casa.js: el rombo va al banco de obra sin llevarlas)
    const gratis = this.depuracion(), madera = gratis || this.llevaCarta('madera'), piedra = gratis || this.llevaCarta('piedra');
    if (madera && piedra) return { id: `reparar-${e.obra}`, quien: 'obra', zona: 'poblado', texto: 'Llevas madera y piedra. Ve a tu casa, frente a la posada al otro lado de la plaza, apunta al banco de obra y aprieta el gatillo.' };
    const falta = !madera && !piedra ? 'una carga de madera y otra de piedra' : !madera ? 'una carga de madera' : 'una carga de piedra';
    // (el rombo sigue en el banco de obra aunque falte material: allí dice lo que falta)
    return { id: `buscar-${e.obra}-${madera}-${piedra}`, quien: 'obra', texto: `Para la obra ${e.obra + 1} de ${CASA_OBRAS} te falta ${falta}. ${PISTA_MATERIALES}` };
  },
  aceptarCasa() {
    const e = this.estado;
    e.mision = 'casa';
    e.casaDia = e.dia; e.casaVista = false;   // (Leonor te lleva a la casa; js/casa.js)
    e.farmeados = []; e.cargas = {};
    this.prepararDia();
    this.aprender('Leonor te ha pedido que te quedes en el poblado y repares la casa abandonada de enfrente de la posada.');
    this.guardar();
    this.avisar(`Misión: ${MISIONES.casa.titulo}. Tienes ${MISIONES.casa.presupuesto} puntos al día. Se abren la cueva y la montaña.`);
  },
  // Leonor te ha llevado hasta la casa (js/casa.js)
  verCasa() {
    this.estado.casaVista = true;
    this.guardar();
    this.avisar('Leonor: «Aquí la tienes. Madera para el techo y piedra para los muros. Sé que podrás».');
  },
  // La cena en tu casa terminada (js/casa.js): fin del episodio
  cenarCasa() {
    const e = this.estado;
    if (e.hechas.includes('casa')) return;
    e.hechas.push('casa');
    e.mision = null;
    e.cenaVista = e.dia;
    e.puntos = PUNTOS_LIBRE;
    this.aprender('Leonor espera un hijo. Tienes casa en el poblado, y un sitio entre los suyos.');
    this.guardar();
    this.avisar(`Misión cumplida: ${MISIONES.casa.titulo}. Tienes casa, y un sitio en el poblado.`);
  },
  // Lo que dice Leonor en la entrada de la posada, paso a paso (la conversación de episodio2.md)
  charlaLeonor(paso) {
    const e = this.estado;
    if (e.mision === 'casa') return {
      texto: 'Gracias. Sabía que te quedarías. La casa está frente a la posada, al otro lado de la plaza.',
      opciones: [{ texto: 'Hasta luego' }],
    };
    return [
      { texto: 'Me han dicho que te marchas.', opciones: [{ texto: 'Mi camino sigue. Siempre ha sido así.', sigue: 1 }] },
      { texto: 'Anoche brindamos por ti. Garcés no ha dejado de hablar de la boda. ¿Y te vas sin una palabra?', opciones: [{ texto: 'No soy hombre de quedarme.', sigue: 2 }] },
      { texto: 'Hay una casa frente a la posada, al otro lado de la plaza, vacía desde hace años: las paredes en pie y el techo caído. Nadie la quiere, y a ti te vendría bien un sitio. Repárala, y si luego quieres irte, nadie te lo impedirá.', opciones: [{ texto: '(Callas, y lo piensas)', sigue: 3 }] },
      { texto: 'Solo te pido eso. Madera para el techo y piedra para los muros: tres cargas de cada. El pueblo te ayudará con lo que sepa.', opciones: [{ texto: 'Está bien. Veré esa casa.', hacer: () => this.aceptarCasa(), sigue: 4 }] },
      { texto: 'Gracias. Sabía que te quedarías.', opciones: [{ texto: 'Hasta luego' }] },
    ][paso];
  },
  // Depuración: ir al salto "i" de SALTOS_DEPURACION (y el que se está viendo, en estado.depura)
  saltar(i) {
    if (!this.depuracion() || cambiandoDeZona || enLaMesa || enBarco) return;
    i = (i + SALTOS_DEPURACION.length) % SALTOS_DEPURACION.length;
    const salto = SALTOS_DEPURACION[i], e = Object.assign(this.nuevo(), { visitadas: this.estado.visitadas, dia: 5, depura: i });
    salto.poner(e);
    this.estado = e;
    this.prepararDia();
    this.ultimoPaso = undefined;
    this.guardar();
    this.avisar(`Depuración: ${salto.nombre}.`);
    const [x, z, giro] = salto.sitio || [], destino = salto.sitio ? { x, z, giro } : { x: INICIO_DIA.x, y: INICIO_DIA.y, z: INICIO_DIA.z, giro: INICIO_DIA.giro };
    document.querySelector('a-scene').components.zonas.ir('poblado', destino);
  },
  marcarTutorial(que) { if (!this.estado.tutorial[que]) { this.estado.tutorial[que] = true; this.guardar(); } },
  avisar(texto, tutorial = false) { if (this.ranura) document.dispatchEvent(new CustomEvent('partida-aviso', { detail: { texto, tutorial } })); },
  aprender(texto) { if (!this.estado.aprendido.includes(texto)) this.estado.aprendido.push(texto); },
  misionActiva() { return MISIONES[this.estado.mision] || null; },
  // (con el lobo en la cueva, entrar cuesta PUNTOS_LOBO más)
  precio(nombre) { return (PRECIOS_ZONA[nombre] ?? 0) + (nombre === 'cueva' && this.loboEnCueva() ? PUNTOS_LOBO : 0); },
  // El lobo de la cueva: solo con la misión de la casa (sin misión, los puntos no cuentan) y hasta que lo matas
  loboEnCueva() { const e = this.estado; return e.mision === 'casa' && !e.lobo; },
  // ¿Ya tienes casa? Desde la cena del episodio 2: se duerme allí, no en la posada
  tieneCasa() { return this.estado.hechas.includes('casa'); },
  // ¿Es de noche en la zona? Solo el poblado, y desde que se pisa el lago (anochecer) hasta que se duerme (empezarDia).
  // Para mirarlo sin jugar: en la consola, partida.estado.noche = true y volver a entrar al poblado.
  deNoche(nombre = zonaCargada.nombre) { return nombre === 'poblado' && !!this.estado.noche; },
  anochecer() {
    if (!this.ranura || this.estado.noche) return;
    this.estado.noche = true;
    this.guardar();
  },
  // Al principio solo se puede ir al poblado, el bosque y el lago (ZONAS_ABIERTAS); la de depuración las tiene todas.
  // Las partidas de antes conservan las zonas que ya habían visitado.
  abierta(nombre) {
    const e = this.estado, casa = e.mision === 'casa' || e.hechas.includes('casa');
    return nombre === zonaCargada.nombre || this.depuracion() || ZONAS_ABIERTAS.includes(nombre) || e.visitadas.includes(nombre) || (casa && ZONAS_CASA.includes(nombre));
  },
  puedeEntrar(nombre) { return nombre === zonaCargada.nombre || (this.abierta(nombre) && this.estado.puntos >= this.precio(nombre)); },

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
    if (!this.abierta(nombre)) { this.avisar(`${titulo} está cerrado por ahora.`); return false; }
    // con el lobo dentro: con puntos lo matas y entras; sin ellos, te hace huir a la posada y pierdes lo que llevas
    if (nombre === 'cueva' && this.loboEnCueva()) {
      if (e.puntos < precio) { this.huirDelLobo(); return false; }
      e.puntos -= precio;
      e.lobo = true;
      this.guardar();   // (el sonido y lo que ha pasado, antes, en el encuentro: encuentroConLobo, js/enemigos.js)
      return true;
    }
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
  // Sin puntos para el lobo: vuelves a la posada, pierdes lo que llevas (cartas, pescado y los puntos del día) y el lobo
  // sigue ahí. La madera y la piedra que pierdes vuelven a su sitio de farmeo, para no quedarte sin cargas para la casa.
  huirDelLobo() {
    const e = this.estado;
    for (const tipo of Object.keys(e.cartas)) this.devolverCarga(tipo);
    e.cartas = {}; e.pescado = null;
    aullidoDeLobo(false);
    this.terminarDia('El lobo de la cueva te ataca y no tienes fuerzas: huyes a la posada y pierdes lo que llevabas.');
  },
  // Otro día, otro intento: presupuesto entero, se puede volver a pescar y lo pescado se ha estropeado.
  // Lo aprendido y las monedas se quedan.
  empezarDia() {
    this.estado.dia++;
    this.estado.noche = false;   // al despertar, de día
    this.prepararDia();
  },
  // Presupuesto entero y sin nada de lo pescado
  prepararDia() {
    const e = this.estado, m = this.misionActiva();
    e.puntos = m ? m.presupuesto : PUNTOS_LIBRE;
    e.pescado = null;
    e.cofre = [];   // lo pescado también se estropea en el cofre: si no, se guardaría para la misión
    e.pescadoHoy = false;
    delete e.cartas.carne;   // la carne también; la madera y la piedra no
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
    this.avisar(`${motivo ? motivo + ' ' : ''}Día ${this.estado.dia}. Tienes ${this.estado.puntos} puntos.${boda}`);
    const { zona, x, y, z, giro } = inicioDelDia();
    document.querySelector('a-scene').components.zonas.ir(zona, { x, y, z, giro });
  },

  // --- Pescar, asar y comer ---
  // con misión, una vez al día; sin misión, todo lo que se quiera. Y solo una carta de cada tipo: con un
  // pescado encima, crudo o asado, no se coge otro
  puedePescar() { return !this.estado.pescado && (!this.misionActiva() || !this.estado.pescadoHoy); },
  pescar() {
    this.estado.puntos -= PUNTOS_PESCAR;
    this.estado.pescado = 'crudo';
    this.estado.pescadoHoy = true;
    this.aprender('Los peces del lago se pescan junto al embarcadero del sur.');
    this.marcarSitio('pesca-lago');
    this.guardar();
    // (cómo se usa el mapa lo dice luego el tutorial: aquí, que se puede)
    const rapido = 'No hace falta volver andando: con el mapa viajas deprisa a cualquier sitio donde ya hayas estado.';
    this.avisar(this.estado.mision === 'boda' ? `Has pescado uno por ${PUNTOS_PESCAR} puntos. Te ${this.estado.puntos === 1 ? 'queda 1' : `quedan ${this.estado.puntos}`}. Llévaselo al tabernero. ${rapido}` : `Has pescado uno. Se come desde el inventario. ${rapido}`);
  },
  // En la hoguera se asa lo que haya crudo: el pescado y la carne
  asar() {
    const e = this.estado, asado = [];
    if (e.pescado === 'crudo') { e.pescado = 'asado'; asado.push('el pescado'); }
    if (e.cartas.carne === 'cruda') { e.cartas.carne = 'asada'; asado.push('la carne'); }
    if (asado.length) {
      this.aprender('Lo asado en una hoguera alimenta más que crudo.');
      this.guardar();
      this.avisar(`Asas ${asado.join(' y ')}.`);
    } else this.avisar(e.pescado || e.cartas.carne ? 'Ya está asado.' : 'No llevas nada que asar.');
  },
  // Comer el pescado o la carne (sin decir cuál, lo que haya, el pescado antes)
  comer(tipo = this.estado.pescado ? 'pescado' : 'carne') {
    const e = this.estado, comida = tipo === 'pescado' ? e.pescado : e.cartas[tipo];
    if (!comida || !PUNTOS_COMIDA[comida]) return;
    if (tipo === 'pescado') e.pescado = null; else delete e.cartas[tipo];
    const que = tipo === 'pescado' ? 'el pescado' : 'la carne';
    e.puntos += PUNTOS_COMIDA[comida];
    this.guardar();
    const sinEncargo = tipo === 'pescado' && e.mision === 'boda' ? ' Te quedas sin encargo: habrá que pescar otro día.' : '';
    this.avisar(`Te comes ${que}: ${PUNTOS_COMIDA[comida]} ${PUNTOS_COMIDA[comida] === 1 ? 'punto' : 'puntos'}. Tienes ${e.puntos}.${sinEncargo}`);
  },

  // --- Las cartas de los oficios (js/oficios.js): cartas = { tipo: cómo está }. El pescado va aparte (pescado),
  // por la misión, pero se enseña y se vende igual. Solo una de cada tipo.
  cartasQueLlevas() { const e = this.estado; return [...(e.pescado ? [['pescado', e.pescado]] : []), ...Object.entries(e.cartas)]; },
  llevaCarta(tipo) { return tipo === 'pescado' ? !!this.estado.pescado : !!this.estado.cartas[tipo]; },
  // Si se puede hacer un oficio que da una carta de "tipo" y cuesta "precio"; si no, el aviso
  puedeOficio(tipo, precio) {
    if (this.llevaCarta(tipo)) { this.avisar(`Ya llevas ${CARTAS[tipo].una}: solo una carta de cada tipo. Véndela en el mercado del poblado.`); return false; }
    if (this.estado.puntos < precio) { this.avisar(`Cuesta ${precio} puntos y no te llegan.`); return false; }
    return true;
  },
  conseguir(tipo, como, precio, texto) {
    const e = this.estado;
    e.puntos -= precio;
    e.cartas[tipo] = como;
    this.guardar();
    this.avisar(`${texto} Te ${e.puntos === 1 ? 'queda 1 punto' : `quedan ${e.puntos} puntos`}. El mercader del poblado te la compra.`);
  },
  // Los sitios de oficio ya usados (pesca, tala, cantera) se marcan en el mapa con su icono (SITIOS_MAPA, js/mapa.js).
  // Solo es una marca: no se viaja a ellos.
  marcarSitio(id) { const u = this.estado.usados; if (id && !u.includes(id)) u.push(id); },
  // --- Los sitios de farmeo de la misión de la casa (js/oficios.js): cada uno da una sola carga en la misión ---
  agotado(id) { const e = this.estado; return !!id && e.mision === 'casa' && e.farmeados.includes(id); },
  farmear(id, tipo) {
    const e = this.estado;
    if (!id || e.mision !== 'casa' || e.farmeados.includes(id)) return;
    e.farmeados.push(id);
    e.cargas[tipo] = id;
  },
  // la madera y la piedra, en la misión de la casa, son para la obra
  cargaDeLaCasa(tipo) { return this.estado.mision === 'casa' && (tipo === 'madera' || tipo === 'piedra'); },
  // si se pierde una carga de la misión (el lobo), su sitio vuelve a dar
  devolverCarga(tipo) {
    const e = this.estado, id = e.cargas[tipo];
    if (id) e.farmeados = e.farmeados.filter(f => f !== id);
    delete e.cargas[tipo];
  },
  vender(tipo) {
    const e = this.estado;
    if (!this.llevaCarta(tipo)) return;
    if (tipo === 'pescado') e.pescado = null; else delete e.cartas[tipo];
    e.monedas += PRECIO_CARTA;
    this.guardar();
    this.avisar(`Vendes ${CARTAS[tipo].una} por ${PRECIO_CARTA} monedas de plata. Tienes ${e.monedas}.`);
  },

  // --- Las estrellas escondidas: estado.estrellas son las ya cogidas (null, sin misión empezada) ---
  estrellaActiva(id) { const l = this.estado.estrellas; return l !== null && !l.includes(id); },
  cogerEstrella(id) {
    const l = this.estado.estrellas;
    if (!this.estrellaActiva(id)) return;
    l.push(id);
    this.guardar();
    this.avisar(l.length === ESTRELLAS_TOTAL ? `¡Has encontrado las ${ESTRELLAS_TOTAL} estrellas!` : `Estrella encontrada: ${l.length} de ${ESTRELLAS_TOTAL}.`);
  },

  // --- La misión del tutorial ---
  aceptarBoda() {
    this.estado.mision = 'boda';
    this.prepararDia();   // sin cambiar de día, pero nada de llevar el pescado preparado (idea de JUEGO.md)
    this.estado.estrellas = [];   // las estrellas, otra vez todas, en los mismos sitios
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
  // Para la hoja de la misión del pergamino (js/mapa.js): título, cómo va, los pasos (texto y si está hecho) y lo siguiente.
  // Lo siguiente es lo que pide el tutorial, si lo hay; si no, el primer paso sin hacer.
  resumenMision() {
    if (this.enEpisodio2()) return this.resumenCasa();
    const e = this.estado, m = this.misionActiva(), paso = this.pasoTutorial(), cumplida = e.hechas.includes('boda');
    if (!m && !cumplida) return {
      titulo: 'Sin misión', estado: `Día ${e.dia}. Te ${e.puntos === 1 ? 'queda 1 punto' : `quedan ${e.puntos} puntos`} de los ${PUNTOS_LIBRE} del día.`, pasos: [],
      siguiente: paso ? paso.texto : 'Las misiones se reciben en la taberna del poblado: habla con el tabernero.',
    };
    // (con la misión en marcha, también si se repite, solo cuenta hasta la entrega; la boda es una vez)
    const entregada = !m && cumplida, vista = e.bodaVista !== null, pasos = [
      { texto: 'Aceptar el encargo del tabernero: pescado del lago para su banquete.', hecho: true, falta: 'Habla con el tabernero y acepta su encargo.' },
      { texto: 'Pescar un pez en el lago.', hecho: !!e.pescado || entregada, falta: 'Ve al lago, al embarcadero del sur, apunta a los peces y aprieta el gatillo.' },
      { texto: 'Llevárselo al tabernero.', hecho: entregada, falta: 'Lleva el pescado al tabernero, en la taberna del poblado. Con el mapa viajas deprisa a donde ya has estado.' },
    ];
    if (!m) pasos.push(
      { texto: 'Dormir: la boda es al día siguiente.', hecho: vista || (e.bodaDia !== null && e.dia > e.bodaDia), falta: 'Vuelve a tu habitación de la posada y duerme en la cama.' },
      { texto: 'Ir a la boda y brindar por los novios.', hecho: vista && !!e.tutorial.brindis, falta: 'Ve a la plaza, siéntate en la silla libre y brinda: coge tu copa y álzala.' },
    );
    const falta = pasos.find(p => !p.hecho);
    return {
      titulo: m ? m.titulo : 'El pescado de la boda',
      estado: m ? `Día ${e.dia}. Te ${e.puntos === 1 ? 'queda 1 punto' : `quedan ${e.puntos} puntos`}: entrar en cada zona cuesta puntos.`
        : falta ? 'Encargo entregado: te pagó en monedas de plata.' : 'Misión cumplida.',
      pasos,
      siguiente: paso ? paso.texto : falta ? falta.falta : 'Nada por ahora. Si quieres, el tabernero te pide otro pescado.',
    };
  },
  enEpisodio2() { const e = this.estado; return e.mision === 'casa' || e.hechas.includes('casa') || (e.bodaVista !== null && e.dia > e.bodaVista); },
  resumenCasa() {
    const e = this.estado, paso = this.pasoTutorial(), aceptada = e.mision === 'casa' || e.hechas.includes('casa'), cenada = e.hechas.includes('casa');
    const madera = this.llevaCarta('madera') ? ' (llevas una)' : '', piedra = this.llevaCarta('piedra') ? ' (llevas una)' : '';
    const pasos = [
      { texto: 'Hablar con Leonor en la entrada de la posada.', hecho: aceptada },
      ...[1, 2, 3].map(n => ({ texto: `Obra ${n}: una carga de madera y otra de piedra en el banco de obra.`, hecho: e.obra >= n })),
      { texto: 'Cenar con Leonor y Garcés en tu casa.', hecho: cenada },
    ];
    return {
      titulo: MISIONES.casa.titulo,
      estado: cenada ? 'Misión cumplida.' : !aceptada ? `Día ${e.dia}. Hoy te marchas del poblado.`
        : `Día ${e.dia}. Te ${e.puntos === 1 ? 'queda 1 punto' : `quedan ${e.puntos} puntos`}. Puestas en la obra: madera ${e.obra} de ${CASA_OBRAS}${madera}, piedra ${e.obra} de ${CASA_OBRAS}${piedra}.`,
      pasos,
      siguiente: paso ? paso.texto : 'Nada por ahora: la casa es tuya.',
    };
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
    this.indicador = tablaEnCamara(0.42, 0.15, -0.5, -0.42, -1.3);
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
    malla.visible = !!partida.ranura;
    if (!malla.visible) return;
    const g = lienzo.getContext('2d'), W = lienzo.width, H = lienzo.height;
    fondoDeTabla(g, W, H);
    g.font = '600 26px Georgia, serif';
    // filas repartidas a partes iguales: día y puntos, el pescado si lo llevas y las estrellas si hay misión
    const filas = [[`Día ${e.dia}  ·  ${e.puntos} ${e.puntos === 1 ? 'punto' : 'puntos'}`, '600 26px']];
    if (e.pescado) filas.push([`Llevas pescado ${e.pescado}`, '20px']);
    if (e.estrellas) filas.push([`★ ${e.estrellas.length} de ${ESTRELLAS_TOTAL}`, '600 22px']);
    filas.forEach(([texto, letra], i) => { g.font = `${letra} Georgia, serif`; g.fillText(texto, W / 2, H * (i + 0.5) / filas.length); });
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
    // con una página de cómic abierta (js/comic.js) el indicador no se ve: estorba a las viñetas
    this.indicador.malla.visible = !!partida.ranura && !comicAbierto;
    // el indicador: abajo a la izquierda en VR, y arriba en el centro en el monitor
    if (this.el.is('vr-mode')) this.indicador.malla.position.set(-0.5, -0.42, -1.3);
    else this.indicador.malla.position.set(0, 1.3 * Math.tan(this.el.camera.fov * Math.PI / 360) - 0.1, -1.3);
    // los avisos (y el tutorial): en VR delante; en el monitor, más grandes y en la parte de arriba
    if (this.el.is('vr-mode')) { this.aviso.malla.position.set(0, -0.1, -2); this.aviso.malla.scale.setScalar(1); }
    else { this.aviso.malla.position.set(0, 2 * Math.tan(this.el.camera.fov * Math.PI / 360) * 0.6, -2); this.aviso.malla.scale.setScalar(1.6); }
    if (!this.aviso.malla.visible) return;
    // (con una pregunta de si se gastan puntos delante, el aviso se quita: la taparía. js/pregunta.js)
    if (preguntaAbierta || comicAbierto) this.avisoMs = 0;   // (y con una página de cómic, js/comic.js: solo el cómic)
    this.avisoMs -= Math.min(dt || 0, 100);
    if (this.avisoMs <= 0) this.aviso.malla.visible = false;
    else this.aviso.malla.material.opacity = Math.min(1, this.avisoMs / 800);
  }
});

partida.cargar();
