// Editor VR: antes de gastar puntos, una pregunta. Un cartel de pergamino con un dibujo de lo que se va a
// hacer (pasar andando a otra zona, viajar por el mapa o pescar), lo que cuesta y lo que te quedará, y dos
// botones: sí o no. Se responde con el rayo y el gatillo (en el ordenador, con la mira y el clic); alejarse
// o cambiar de zona cuenta como "no". Lo usan zonas.cruzar (js/zonas.js) y los peces (js/animales.js).

const PREGUNTA_ANCHO = 1.2;          // metros
const PREGUNTA_PX = [1024, 640];     // el lienzo
// Fotos de las zonas (fotos/<zona>.jpg, 640 × 400), sacadas en la escena desde donde se llega con el mapa
// (DESTINOS_MAPA, js/mapa.js). Se cargan la primera vez que hacen falta.
const FOTOS_ZONA = {};
function fotoZona(nombre) {
  if (!FOTOS_ZONA[nombre]) { FOTOS_ZONA[nombre] = new Image(); FOTOS_ZONA[nombre].src = `fotos/${nombre}.jpg`; }
  return FOTOS_ZONA[nombre];
}
const PREGUNTA_SE_CIERRA = 3;        // a esta distancia de donde se preguntó, cuenta como "no"
const PREGUNTA_TINTA = '#3a2616';

let preguntaAbierta = null;   // la que hay delante: solo una a la vez

// Los oficios (js/oficios.js): el título, el botón del sí, qué es lo que se paga ("hace ... cuesta"), qué se gana y,
// con misión, una nota. Sus dibujos, más abajo.
const PREGUNTA_OFICIOS = {
  pesca: { titulo: '¿Pescar aquí?', si: 'Sí, pescar', hace: 'Echar el anzuelo', gana: 'Echa el anzuelo y espera a que pique.', nota: 'Con misión, se pesca una vez al día.', dibujo: g => dibujoPesca(g) },
  caza: { titulo: '¿Cazar el ciervo?', si: 'Sí, cazar', hace: 'Cazarlo', gana: 'Te llevas su carne: se asa en una hoguera, se come o se vende.', dibujo: g => dibujoCaza(g) },
  tala: { titulo: '¿Talar un árbol?', si: 'Sí, talar', hace: 'Talar', gana: 'Te llevas una carga de madera, que el mercader del poblado compra.', dibujo: g => dibujoTala(g) },
  picar: { titulo: '¿Picar piedra?', si: 'Sí, picar', hace: 'Picar la roca', gana: 'Sacas una pieza de piedra, que el mercader del poblado compra.', dibujo: g => dibujoPicar(g) },
};

// "que": 'andar', 'viaje' o un oficio (PREGUNTA_OFICIOS); "de" y "a", las zonas (al andar y al viajar); "precio", los puntos.
// "alResponder" recibe true si se dice que sí. Con "dibujar" (g, W, H) y "textos" (los botones), otro cartel: con un
// solo botón, es un aviso (el cuadro del lobo, js/enemigos.js), y alejarse también cuenta como pulsarlo.
function preguntarGasto({ que, de, a, precio, enemigo, alResponder, dibujar, textos: otrosTextos }) {
  if (preguntaAbierta) preguntaAbierta.responder(false);
  const escena = document.querySelector('a-scene');
  const [W, H] = PREGUNTA_PX, lienzo = document.createElement('canvas');
  lienzo.width = W; lienzo.height = H;
  // con la foto del destino; si aún no ha llegado, se vuelve a pintar cuando llegue
  const foto = PREGUNTA_OFICIOS[que] || dibujar ? null : fotoZona(a);
  const pintar = () => dibujar ? dibujar(lienzo.getContext('2d'), W, H) : dibujarPregunta(lienzo.getContext('2d'), W, H, { que, de, a, precio, enemigo, foto: foto && foto.complete && foto.naturalWidth ? foto : null });
  pintar();
  const tex = new THREE.CanvasTexture(lienzo);
  tex.colorSpace = THREE.SRGBColorSpace;
  if (foto && !foto.complete) foto.addEventListener('load', () => { if (preguntaAbierta === pregunta) { pintar(); tex.needsUpdate = true; } }, { once: true });
  const alto = PREGUNTA_ANCHO * H / W;
  const cartel = letrero(new THREE.Mesh(new THREE.PlaneGeometry(PREGUNTA_ANCHO, alto), new THREE.MeshBasicMaterial({ map: tex, depthTest: false, transparent: true, fog: false })));
  cartel.renderOrder = 995;
  // en el monitor, recta y a una escala con la que cabe con sus botones (alto del cartel y botones: 1,05)
  const vista = tablaEnMonitor(escena, PREGUNTA_ANCHO, 1.05), k = vista ? vista.k : 1;
  cartel.scale.setScalar(k);
  // delante de quien mira, a la altura de los ojos
  const ojo = new THREE.Vector3(), sitio = sitioDeLectura(escena);
  escena.camera.getWorldPosition(ojo);
  sitio.y += 0.5;
  cartel.position.copy(sitio);
  cartel.lookAt(ojo.x, sitio.y, ojo.z);
  if (vista) { cartel.position.copy(vista.centro).addScaledVector(vista.arriba, 0.08 * k); cartel.quaternion.copy(vista.q); }
  escena.object3D.add(cartel);
  cartel.updateMatrixWorld(true);
  const desde = ojo.clone();

  // los botones, debajo: el "sí" a la izquierda
  const texturas = [tex], botones = [];
  const oficio = PREGUNTA_OFICIOS[que], textos = otrosTextos || (oficio ? [oficio.si, 'No'] : que === 'viaje' ? ['Sí, viajar', 'No'] : ['Sí, pasar', 'No, quedarme']);
  let ultimo = performance.now();   // (el mismo gatillo que ha hecho la pregunta no la contesta)
  textos.forEach((texto, i) => {
    const t = tablaDeTexto(texto, 480, 110);
    texturas.push(t);
    const e = document.createElement('a-entity');
    e.classList.add('clicable', 'cartel');
    const m = letrero(new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.115), new THREE.MeshBasicMaterial({ map: t, depthTest: false, transparent: true, fog: false })));
    m.renderOrder = 996;
    e.setObject3D('mesh', m);
    const p = cartel.localToWorld(new THREE.Vector3(textos.length === 1 ? 0 : i ? 0.28 : -0.28, -alto / 2 - 0.1, 0.01));
    e.object3D.scale.setScalar(k);
    e.classList.add('pregunta');
    e.setAttribute('position', `${p.x} ${p.y} ${p.z}`);
    e.object3D.quaternion.copy(cartel.quaternion);
    e.addEventListener('mouseenter', () => m.material.color.set('#ffcc33'));
    e.addEventListener('mouseleave', () => m.material.color.set('#ffffff'));
    e.addEventListener('mousedown', () => {
      if (performance.now() - ultimo < 400) return;
      ultimo = performance.now();
      pregunta.responder(i === 0);   // (con un solo botón, siempre sí)
    });
    escena.appendChild(e);
    botones.push(e);
  });

  ratonLibre('pregunta', true);
  // mientras está abierta, el tutorial espera (partida.comprobarPaso)
  partida.charlaAbierta = true;
  const vigilar = setInterval(() => {
    escena.camera.getWorldPosition(ojo);
    if (cambiandoDeZona || Math.hypot(ojo.x - desde.x, ojo.z - desde.z) > PREGUNTA_SE_CIERRA) pregunta.responder(false);
  }, 200);
  const pregunta = preguntaAbierta = {
    responder(si) {
      if (preguntaAbierta !== pregunta) return;
      preguntaAbierta = null;
      ratonLibre('pregunta', false);
      clearInterval(vigilar);
      cartel.parent.remove(cartel);
      cartel.geometry.dispose(); cartel.material.dispose();
      for (const e of botones) { const m = e.getObject3D('mesh'); m.geometry.dispose(); m.material.dispose(); e.parentNode.removeChild(e); }
      for (const t of texturas) t.dispose();
      partida.charlaAbierta = false;
      alResponder(textos.length === 1 || si);
      setTimeout(() => partida.comprobarPaso());
    },
  };
  return pregunta;
}

// El cartel: título, el dibujo a la izquierda y, a la derecha, lo que cuesta y lo que quedará
// "enemigo" (ENEMIGOS, js/enemigos.js): el que hay dentro, con sus cabezas de lobo y lo que cuesta de más ("extra")
function dibujarPregunta(g, W, H, { que, de, a, precio, enemigo, foto }) {
  fondoDePergamino(g, W, H);
  dibujarLoDeLaPregunta(g, W, H, { que, de, a, precio, enemigo, foto });
}
// Marco de madera y pergamino, con manchas siempre iguales
function fondoDePergamino(g, W, H) {
  g.fillStyle = '#2e2116'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#d7c49a'; g.fillRect(16, 16, W - 32, H - 32);
  let s = 23;
  const azar = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 90; i++) {
    g.fillStyle = `rgba(${azar() > 0.5 ? '120, 92, 54' : '245, 232, 200'}, ${0.03 + azar() * 0.05})`;
    g.beginPath(); g.ellipse(16 + azar() * (W - 32), 16 + azar() * (H - 32), 10 + azar() * 50, 8 + azar() * 30, azar() * 3, 0, Math.PI * 2); g.fill();
  }
  g.strokeStyle = '#4a4640'; g.lineWidth = 10; g.strokeRect(5, 5, W - 10, H - 10);
  g.strokeStyle = 'rgba(58, 38, 22, 0.7)'; g.lineWidth = 2; g.strokeRect(30, 30, W - 60, H - 60);
}
function dibujarLoDeLaPregunta(g, W, H, { que, de, a, precio, enemigo, foto }) {
  const destino = a && MUNDO[a] ? MUNDO[a].titulo : '';
  g.fillStyle = PREGUNTA_TINTA; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.font = '600 50px Georgia, serif';
  const oficio = PREGUNTA_OFICIOS[que];
  g.fillText(oficio ? oficio.titulo : que === 'viaje' ? `¿Viajar a ${destino}?` : `¿Pasar a ${destino}?`, W / 2, 78);

  // con enemigo, solo se enseña lo que cuesta entrar: lo de combatirlo es un riesgo, no se dice cuánto
  const entrada = enemigo ? precio - enemigo.extra : precio;
  // el dibujo, en la mitad izquierda
  g.strokeStyle = PREGUNTA_TINTA; g.fillStyle = PREGUNTA_TINTA; g.lineCap = 'round'; g.lineJoin = 'round';
  // (sin precio, sin misión: sin monedas)
  if (oficio) { oficio.dibujo(g); if (precio) monedasDePuntos(g, 470, 470, precio); }
  else { dibujoCamino(g, de, a, que === 'viaje', foto); if (entrada) monedasDePuntos(g, 680, 550, entrada); }

  // lo que cuesta y lo que quedará
  const tienes = partida.estado.puntos, punto = n => `${n} ${n === 1 ? 'punto' : 'puntos'}`;
  const parrafos = enemigo ? [
    // (no dice cuál ni cuánto cuesta: la cabeza roja avisa de que puede haber un enemigo, y combatirlo gasta energía)
    `Entrar cuesta ${punto(entrada)}. Tienes ${punto(tienes)}.`,
    'Cuidado: puede haber un enemigo. Combatirlo gasta energía.',
  ] : !precio ? [
    oficio ? oficio.gana : que === 'viaje' ? `El mapa te lleva a ${destino}.` : `Vas a entrar en ${destino}.`,
    'Sin misión no cuesta nada: se pasea libre.',
  ] : [
    oficio ? `${oficio.hace} cuesta ${punto(precio)}. ${oficio.nota || oficio.gana}`
      : que === 'viaje' ? `El viaje cuesta ${punto(precio)}: se paga cada zona del camino.`
      : `Entrar en ${destino} cuesta ${punto(precio)}.`,
    `Tienes ${punto(tienes)}; te ${tienes - precio === 1 ? 'quedará' : 'quedarán'} ${tienes - precio}.`,
  ];
  // el nivel del enemigo: sus cabezas de lobo, encima de lo que cuesta
  if (enemigo) for (let i = 0; i < enemigo.cabezas; i++) dibujoCabezaLobo(g, 620 + i * 70, 150, 26, '#8a2318');   // en rojo: hay enemigo
  g.textAlign = 'left'; g.font = '34px Georgia, serif';
  let y = enemigo ? 215 : 190;
  for (const p of parrafos) {
    for (const l of partirTexto(g, p, 400)) { g.fillText(l, 590, y); y += 46; }
    y += 24;
  }
}

// De una zona a otra: arriba, la foto del sitio al que se va, en su marco; debajo, de dónde a dónde
// (andando, huellas por el camino; por el mapa, un arco de puntos hasta el sello)
function dibujoCamino(g, de, a, viaje, foto) {
  const fx = 50, fy = 112, fw = 480, fh = 300;
  g.fillStyle = '#2e2116'; g.fillRect(fx - 10, fy - 10, fw + 20, fh + 20);
  if (foto) g.drawImage(foto, fx, fy, fw, fh);
  else { g.fillStyle = '#cdb88a'; g.fillRect(fx, fy, fw, fh); g.fillStyle = PREGUNTA_TINTA; iconoZona(g, a, fx + fw / 2, fy + fh / 2 - 20); }
  g.strokeStyle = '#17100a'; g.lineWidth = 3; g.strokeRect(fx, fy, fw, fh);
  g.strokeStyle = PREGUNTA_TINTA; g.fillStyle = PREGUNTA_TINTA;
  const x0 = 110, x1 = 470, y = 490, r = 38;
  iconoZona(g, de, x0, y, r);
  iconoZona(g, a, x1, y, r);
  g.lineWidth = 4;
  if (viaje) {
    g.setLineDash([4, 14]);
    g.beginPath(); g.moveTo(x0 + 34, y - 20); g.quadraticCurveTo((x0 + x1) / 2, y - 90, x1 - 40, y - 22); g.stroke();
    g.setLineDash([]);
    flecha(g, x1 - 40, y - 22, 0.6);
    // el sello de lacre del destino
    g.fillStyle = '#7a1f18'; g.beginPath(); g.arc(x1 + 30, y - 30, 12, 0, Math.PI * 2); g.fill();
    g.fillStyle = PREGUNTA_TINTA;
  } else {
    // huellas, una de cada pie, y la flecha al final
    for (let i = 0; i < 8; i++) {
      const x = x0 + 66 + i * 30, arriba = i % 2 === 0;
      g.beginPath(); g.ellipse(x, y + (arriba ? -9 : 9), 9, 5, 0, 0, Math.PI * 2); g.fill();
    }
    flecha(g, x1 - 46, y, 0);
  }
}

// Una caña desde la orilla, el corcho en el agua y un pez debajo
function dibujoPesca(g) {
  g.lineWidth = 4;
  // la orilla y el agua
  g.beginPath(); g.moveTo(60, 330); g.lineTo(170, 330); g.lineTo(190, 360); g.stroke();
  for (const [y, x0] of [[345, 200], [380, 120], [415, 160]]) olas(g, x0, 530, y, 6);
  // la caña y el sedal
  g.lineWidth = 6; g.beginPath(); g.moveTo(100, 320); g.lineTo(330, 150); g.stroke();
  g.lineWidth = 2; g.beginPath(); g.moveTo(330, 150); g.quadraticCurveTo(390, 200, 400, 336); g.stroke();
  g.fillStyle = '#8c3a2a'; g.beginPath(); g.arc(400, 340, 9, 0, Math.PI * 2); g.fill();
  g.fillStyle = PREGUNTA_TINTA;
  // el pez, mirando al corcho
  g.lineWidth = 4;
  g.beginPath(); g.ellipse(330, 410, 48, 20, 0, 0, Math.PI * 2); g.stroke();
  g.beginPath(); g.moveTo(282, 410); g.lineTo(255, 392); g.lineTo(255, 428); g.closePath(); g.stroke();
  g.beginPath(); g.arc(360, 404, 4, 0, Math.PI * 2); g.fill();
}

// Un ciervo de perfil, mirando a la derecha, y una flecha que va hacia él
function dibujoCaza(g) {
  g.lineWidth = 4;
  g.beginPath(); g.ellipse(330, 300, 95, 45, 0, 0, Math.PI * 2); g.stroke();                       // el cuerpo
  for (const x of [260, 290, 375, 400]) { g.beginPath(); g.moveTo(x, 335); g.lineTo(x + 4, 420); g.stroke(); }   // las patas
  g.beginPath(); g.moveTo(405, 280); g.lineTo(440, 205); g.lineTo(475, 200); g.lineTo(470, 220); g.lineTo(445, 228); g.lineTo(425, 300); g.stroke();   // cuello y cabeza
  g.beginPath(); g.moveTo(445, 205); g.lineTo(430, 150); g.moveTo(437, 175); g.lineTo(410, 160); g.moveTo(455, 202); g.lineTo(480, 150); g.moveTo(468, 175); g.lineTo(495, 168); g.stroke();   // las astas
  g.beginPath(); g.moveTo(80, 230); g.lineTo(215, 280); g.stroke();                               // la flecha
  flecha(g, 225, 284, Math.atan2(50, 135));
  g.beginPath(); g.moveTo(80, 230); g.lineTo(66, 214); g.moveTo(80, 230); g.lineTo(60, 232); g.stroke();
  olas(g, 120, 530, 430, 2);   // el suelo
}

// Un árbol con un tajo en el tronco y el hacha delante
function dibujoTala(g) {
  g.lineWidth = 4;
  g.beginPath(); g.moveTo(270, 430); g.lineTo(280, 250); g.moveTo(330, 430); g.lineTo(320, 250); g.stroke();   // el tronco
  g.beginPath(); g.ellipse(300, 190, 120, 85, 0, 0, Math.PI * 2); g.stroke();                       // la copa
  g.beginPath(); g.moveTo(272, 360); g.lineTo(305, 375); g.lineTo(274, 390); g.fill();             // el tajo
  g.lineWidth = 7; g.beginPath(); g.moveTo(460, 440); g.lineTo(380, 320); g.stroke();              // el hacha
  g.beginPath(); g.moveTo(372, 330); g.lineTo(350, 300); g.lineTo(400, 290); g.lineTo(392, 318); g.closePath(); g.fill();
  g.lineWidth = 4; olas(g, 100, 520, 440, 2);
}

// Una roca con vetas y un pico levantado
function dibujoPicar(g) {
  g.lineWidth = 4;
  g.beginPath(); g.moveTo(90, 440); g.lineTo(130, 260); g.lineTo(230, 190); g.lineTo(340, 230); g.lineTo(380, 440); g.closePath(); g.stroke();   // la roca
  g.lineWidth = 2; for (const [x, y] of [[170, 300], [250, 260], [220, 360], [300, 330]]) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + 40, y + 14); g.stroke(); }
  g.lineWidth = 7; g.beginPath(); g.moveTo(520, 430); g.lineTo(440, 250); g.stroke();              // el mango del pico
  g.lineWidth = 6; g.beginPath(); g.moveTo(380, 260); g.quadraticCurveTo(440, 225, 500, 250); g.stroke();   // la cabeza de hierro
  // las esquirlas que saltan
  for (const [x, y] of [[360, 300], [372, 280], [350, 270]]) { g.beginPath(); g.arc(x, y, 4, 0, Math.PI * 2); g.fill(); }
}

// Lo que cuesta: unas monedas apiladas y "−N"
function monedasDePuntos(g, x, y, precio) {
  g.lineWidth = 3;
  for (let i = Math.min(precio, 3) - 1; i >= 0; i--) {
    g.fillStyle = '#b08a3a';
    g.beginPath(); g.ellipse(x - 40, y - i * 12, 26, 11, 0, 0, Math.PI * 2); g.fill(); g.stroke();
  }
  g.fillStyle = PREGUNTA_TINTA; g.textAlign = 'left'; g.font = '600 40px Georgia, serif';
  g.fillText(`−${precio}`, x - 6, y - 4);
  g.textAlign = 'center';
}

function flecha(g, x, y, giro) {
  g.save(); g.translate(x, y); g.rotate(giro);
  g.beginPath(); g.moveTo(0, 0); g.lineTo(-20, -11); g.lineTo(-20, 11); g.closePath(); g.fill();
  g.restore();
}

function olas(g, x0, x1, y, alto) {
  g.beginPath(); g.moveTo(x0, y);
  for (let x = x0; x < x1; x += 30) g.quadraticCurveTo(x + 7.5, y - alto, x + 15, y), g.quadraticCurveTo(x + 22.5, y + alto, x + 30, y);
  g.stroke();
}

// El emblema de una zona, en un círculo de radio "r", con su nombre debajo
function iconoZona(g, nombre, x, y, r = 62) {
  const z = MUNDO[nombre];
  g.fillStyle = '#cdb88a'; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  g.lineWidth = 3; g.stroke();
  // (los emblemas están dibujados para el radio 62)
  g.save(); g.translate(x, y); g.scale(r / 62, r / 62); g.translate(-x, -y);
  g.fillStyle = PREGUNTA_TINTA; g.lineWidth = 4;
  const tri = (cx, base, ancho, alto) => { g.beginPath(); g.moveTo(cx - ancho / 2, base); g.lineTo(cx, base - alto); g.lineTo(cx + ancho / 2, base); g.closePath(); };
  switch (nombre) {
    case 'castillo':
      g.strokeRect(x - 20, y - 22, 40, 48);
      for (const dx of [-20, -4, 12]) g.fillRect(x + dx, y - 34, 8, 12);
      g.beginPath(); g.arc(x, y + 14, 8, Math.PI, 0); g.lineTo(x + 8, y + 26); g.lineTo(x - 8, y + 26); g.closePath(); g.fill();
      break;
    case 'bosque':
      for (const [dx, h] of [[-24, 46], [0, 60], [24, 46]]) { tri(x + dx, y + 30, 30, h); g.stroke(); }
      break;
    case 'lago':
      for (const dy of [-16, 4, 24]) olas(g, x - 42, x + 42, y + dy, 7);
      break;
    case 'poblado':
      for (const dx of [-20, 20]) { g.strokeRect(x + dx - 15, y - 2, 30, 28); tri(x + dx, y - 2, 38, 22); g.stroke(); }
      break;
    case 'montana':
      tri(x - 14, y + 30, 66, 60); g.stroke(); tri(x + 22, y + 30, 50, 42); g.stroke();
      break;
    case 'acantilado':
      g.beginPath(); g.moveTo(x - 44, y + 30); g.lineTo(x - 44, y - 26); g.lineTo(x - 2, y - 26); g.lineTo(x + 6, y + 30); g.stroke();
      olas(g, x + 10, x + 46, y + 20, 5);
      break;
    case 'puerto':
      g.beginPath(); g.moveTo(x - 38, y + 10); g.lineTo(x + 38, y + 10); g.lineTo(x + 26, y + 28); g.lineTo(x - 26, y + 28); g.closePath(); g.stroke();
      g.beginPath(); g.moveTo(x, y + 10); g.lineTo(x, y - 36); g.lineTo(x + 26, y + 2); g.lineTo(x, y + 2); g.stroke();
      break;
    case 'abadia':
      g.strokeRect(x - 34, y - 20, 14, 50); g.strokeRect(x + 20, y - 4, 14, 34);
      g.beginPath(); g.arc(x, y - 20, 27, Math.PI, Math.PI * 1.6); g.stroke();
      break;
    case 'cueva':
      g.beginPath(); g.moveTo(x - 46, y + 30); g.quadraticCurveTo(x, y - 60, x + 46, y + 30); g.stroke();
      g.beginPath(); g.arc(x, y + 30, 18, Math.PI, 0); g.fill();
      break;
    case 'mazmorras':
      g.strokeRect(x - 26, y - 26, 52, 52);
      for (const dx of [-13, 0, 13]) { g.beginPath(); g.moveTo(x + dx, y - 26); g.lineTo(x + dx, y + 26); g.stroke(); }
      break;
    default:
      g.font = '600 52px Georgia, serif'; g.fillText((z ? z.titulo.replace(/^(El|La|Los|Las) /, '') : '?')[0], x, y + 2);
  }
  g.restore();
  g.fillStyle = PREGUNTA_TINTA;
  g.font = `600 ${r < 50 ? 24 : 28}px Georgia, serif`; g.textAlign = 'center';
  g.fillText(z ? z.titulo : '', x, y + r + 22);
}
