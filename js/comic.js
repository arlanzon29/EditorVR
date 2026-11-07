// Editor VR: páginas de cómic para las conversaciones importantes (la de Leonor, js/casa.js). Una página flotante con
// viñetas de distintos tamaños que se van llenando según avanza la charla; al llenarse, se pasa a la página siguiente.
// Debajo, el botón de tu respuesta. Las imágenes de
// las viñetas salen de la propia escena: una cámara aparte la fotografía desde cada "toma" y se pasa a cómic (colores
// planos, contorno de tinta y trama de puntos en las sombras). Los globos, dibujados en canvas (con ñ y tildes): los de
// quien habla en la viñeta apuntan a su cabeza; los tuyos vienen de abajo, de fuera de la viñeta.
//
// guion = { titulo, tomas: { nombre: { desde: [x, y, z], mira: [x, y, z], fov, cabeza: [x, y, z] } },
//   paginas: [[{ x, y, w, h, toma, desde, cartela, globos: [{ quien: 'ella' | 'tu', texto, desde }] }]],
//   pasos: [{ respuesta, hacer }] }
// Cada viñeta, con su hueco en la página (x, y, w, h: de 0 a 1, dentro de los márgenes); "desde": el paso a partir
// del cual se ve (la viñeta o el globo).

const COMIC_PX = [1800, 1200];          // el lienzo de la página
const COMIC_ANCHO = 1.5;                // metros
const COMIC_MARGEN = 40, COMIC_ARRIBA = 84, COMIC_CALLE = 26;   // márgenes y la calle blanca entre viñetas
const COMIC_TINTA = '#16110c', COMIC_PAPEL = '#f3ead6';
const COMIC_LETRA = '"Trebuchet MS", "Segoe UI", Arial, sans-serif';

// El hueco de una viñeta, en píxeles de la página (con media calle a cada lado: entre dos viñetas, una entera)
function huecoDeVineta(v) {
  const [W, H] = COMIC_PX, aw = W - 2 * COMIC_MARGEN + COMIC_CALLE, ah = H - COMIC_ARRIBA - COMIC_MARGEN + COMIC_CALLE;
  const x = COMIC_MARGEN - COMIC_CALLE / 2 + v.x * aw, y = COMIC_ARRIBA - COMIC_CALLE / 2 + v.y * ah;
  return { x: Math.round(x + COMIC_CALLE / 2), y: Math.round(y + COMIC_CALLE / 2), w: Math.round(v.w * aw - COMIC_CALLE), h: Math.round(v.h * ah - COMIC_CALLE) };
}

// Fotografía la escena desde una toma y la pasa a cómic. Devuelve el lienzo y dónde cae la cabeza de quien habla.
function tomaDeComic(escena, toma, w, h) {
  const r = escena.renderer, cam = new THREE.PerspectiveCamera(toma.fov || 50, w / h, 0.05, 400);
  cam.position.set(...toma.desde); cam.lookAt(...toma.mira); cam.updateMatrixWorld(true);
  const rt = new THREE.WebGLRenderTarget(w, h, { samples: 4 });
  rt.texture.colorSpace = THREE.SRGBColorSpace;
  // sin ti (mandos, avisos pegados a la cámara) ni los rombos del tutorial en la foto (solo el rombo: a veces va en
  // la misma entidad que quien habla). Las tomas, cerca de donde estás: el cielo y el terreno lejano van contigo.
  const ocultos = [document.getElementById('rig').object3D, ...[...document.querySelectorAll('[marca-paso]')].map(e => e.components['marca-paso']?.marca)].filter(o => o && o.visible);
  for (const o of ocultos) o.visible = false;
  const xr = r.xr.enabled, antes = r.getRenderTarget();
  r.xr.enabled = false;
  r.setRenderTarget(rt);
  r.render(escena.object3D, cam);
  r.setRenderTarget(antes);
  r.xr.enabled = xr;
  for (const o of ocultos) o.visible = true;
  const px = new Uint8Array(w * h * 4);
  r.readRenderTargetPixels(rt, 0, 0, w, h, px);
  rt.dispose();
  const lienzo = document.createElement('canvas');
  lienzo.width = w; lienzo.height = h;
  lienzo.getContext('2d').putImageData(pixelesDeComic(px, w, h), 0, 0);
  let cabeza = null;
  if (toma.cabeza) {
    const v = new THREE.Vector3(...toma.cabeza).project(cam);
    if (v.z < 1 && Math.abs(v.x) < 1.2 && Math.abs(v.y) < 1.2) cabeza = [(v.x + 1) / 2 * w, (1 - v.y) / 2 * h];
  }
  return { lienzo, cabeza };
}

// Los píxeles de la foto (de abajo arriba) a cómic: la luz en pocos escalones (conservando el color, algo más vivo),
// tinta en los bordes (Sobel sobre la luz) y trama de puntos en las sombras
function pixelesDeComic(px, w, h) {
  const salida = new ImageData(w, h), d = salida.data, luz = new Float32Array(w * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = ((h - 1 - y) * w + x) * 4;
    luz[y * w + x] = (0.3 * px[i] + 0.59 * px[i + 1] + 0.11 * px[i + 2]) / 255;
  }
  const L = (x, y) => luz[Math.min(h - 1, Math.max(0, y)) * w + Math.min(w - 1, Math.max(0, x))];
  const ESCALONES = 4, PASO = 6, SOMBRA = 0.32, BORDE = 0.2;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = ((h - 1 - y) * w + x) * 4, o = (y * w + x) * 4, l = luz[y * w + x];
    const lq = Math.max(0.1, Math.round(l * ESCALONES) / ESCALONES), k = lq / Math.max(l, 0.02);
    let rgb = [px[i], px[i + 1], px[i + 2]].map(c => c * k);
    rgb = rgb.map(c => Math.min(255, Math.max(0, lq * 255 + (c - lq * 255) * 1.3)));
    if (l < SOMBRA) {
      const cx = (x % PASO) - PASO / 2 + 0.5, cy = (y % PASO) - PASO / 2 + 0.5, radio = (SOMBRA - l) / SOMBRA * PASO * 0.6;
      if (cx * cx + cy * cy < radio * radio) rgb = rgb.map(c => c * 0.3);
    }
    const gx = L(x + 1, y - 1) + 2 * L(x + 1, y) + L(x + 1, y + 1) - L(x - 1, y - 1) - 2 * L(x - 1, y) - L(x - 1, y + 1);
    const gy = L(x - 1, y + 1) + 2 * L(x, y + 1) + L(x + 1, y + 1) - L(x - 1, y - 1) - 2 * L(x, y - 1) - L(x + 1, y - 1);
    if (Math.hypot(gx, gy) > BORDE) rgb = [22, 17, 12];
    d[o] = rgb[0]; d[o + 1] = rgb[1]; d[o + 2] = rgb[2]; d[o + 3] = 255;
  }
  return salida;
}

// Un globo dentro de la viñeta "v": texto en mayúsculas, con su cola hacia "a" (en píxeles de la viñeta) o, sin ella,
// hacia abajo, fuera de la viñeta (lo dices tú). "arriba": dónde va su borde de arriba.
function globoDeComic(g, v, texto, arriba, a, tuyo) {
  g.font = `700 30px ${COMIC_LETRA}`;
  const lineas = partirTexto(g, texto.toUpperCase(), v.w * 0.72), alto = lineas.length * 36;
  const ancho = Math.max(...lineas.map(l => g.measureText(l).width));
  const cx = tuyo ? v.x + v.w * 0.58 : v.x + v.w * 0.5, cy = v.y + arriba + alto / 2 + 22;
  // (el óvalo, holgado: en sus extremos la letra no cabe)
  const rx = ancho / 2 * 1.16 + 28, ry = alto / 2 + 26;
  // la cola, primero (el globo la tapa por arriba): hacia la cabeza de quien habla, sin llegar a ella; la tuya, corta,
  // hacia abajo a la derecha, como si vinieras de fuera de la viñeta
  const destino = a ? [v.x + a[0], v.y + Math.min(Math.max(a[1] - 50, arriba + alto + 70), arriba + alto + 220)] : [cx + rx * 0.7, cy + ry + 70];
  g.fillStyle = '#ffffff'; g.strokeStyle = COMIC_TINTA; g.lineWidth = 4;
  const bx = a ? cx : cx + rx * 0.45;
  g.beginPath(); g.moveTo(bx - 22, cy + ry * 0.6); g.lineTo(...destino); g.lineTo(bx + 22, cy + ry * 0.6); g.closePath(); g.fill(); g.stroke();
  g.beginPath(); g.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); g.fill(); g.stroke();
  // (tapa el arranque de la cola dentro del globo)
  g.beginPath(); g.ellipse(cx, cy, rx - 3, ry - 3, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = COMIC_TINTA; g.textAlign = 'center'; g.textBaseline = 'middle';
  lineas.forEach((l, k) => g.fillText(l, cx, cy - alto / 2 + 18 + k * 36));
  return arriba + alto + 2 * 26 + (a ? 16 : 70);
}

// La cartela del narrador, arriba a la izquierda de la viñeta
function cartelaDeComic(g, v, texto) {
  g.font = `italic 700 26px ${COMIC_LETRA}`;
  const lineas = partirTexto(g, texto.toUpperCase(), v.w * 0.8), ancho = Math.max(...lineas.map(l => g.measureText(l).width)) + 28;
  g.fillStyle = '#f1d98a'; g.strokeStyle = COMIC_TINTA; g.lineWidth = 4;
  g.fillRect(v.x + 2, v.y + 2, ancho, lineas.length * 32 + 18); g.strokeRect(v.x + 2, v.y + 2, ancho, lineas.length * 32 + 18);
  g.fillStyle = COMIC_TINTA; g.textAlign = 'left'; g.textBaseline = 'middle';
  lineas.forEach((l, k) => g.fillText(l, v.x + 16, v.y + 27 + k * 32));
  return lineas.length * 32 + 30;
}

// La página en la que va la charla en el paso "paso": la de la última viñeta que ya se ve
function paginaDelPaso(guion, paso) {
  let n = 0;
  guion.paginas.forEach((p, k) => { if (p.some(v => v.desde <= paso)) n = k; });
  return n;
}

// Pinta la página que toca en el paso "paso"
function pintarPaginaComic(g, guion, fotos, paso) {
  const [W, H] = COMIC_PX, n = paginaDelPaso(guion, paso);
  g.fillStyle = COMIC_PAPEL; g.fillRect(0, 0, W, H);
  g.fillStyle = COMIC_TINTA; g.textAlign = 'left'; g.textBaseline = 'middle';
  g.font = `italic 700 40px ${COMIC_LETRA}`;
  g.fillText(guion.titulo.toUpperCase(), COMIC_MARGEN, COMIC_ARRIBA / 2 + 2);
  if (guion.paginas.length > 1) {
    g.textAlign = 'right'; g.font = `700 28px ${COMIC_LETRA}`;
    g.fillText(`${n + 1} / ${guion.paginas.length}`, W - COMIC_MARGEN, COMIC_ARRIBA / 2 + 2);
  }
  guion.paginas[n].forEach(vineta => {
    const v = huecoDeVineta(vineta);
    if (paso < vineta.desde) {
      // la que aún no ha llegado: solo su marco, en tenue
      g.strokeStyle = 'rgba(22, 17, 12, 0.18)'; g.lineWidth = 4; g.strokeRect(v.x, v.y, v.w, v.h);
      return;
    }
    const foto = fotos.get(vineta);
    g.save();
    g.beginPath(); g.rect(v.x, v.y, v.w, v.h); g.clip();
    g.drawImage(foto.lienzo, v.x, v.y, v.w, v.h);
    let arriba = 14;
    if (vineta.cartela) arriba += cartelaDeComic(g, v, vineta.cartela);
    for (const globo of vineta.globos) {
      if (paso < (globo.desde ?? vineta.desde)) continue;
      const tuyo = globo.quien === 'tu';
      arriba = globoDeComic(g, v, globo.texto, arriba, tuyo ? null : foto.cabeza, tuyo);
    }
    g.restore();
    g.strokeStyle = COMIC_TINTA; g.lineWidth = 7; g.strokeRect(v.x, v.y, v.w, v.h);
  });
}

let comicAbierto = null;   // el lienzo de la página abierta (para mirarla desde la consola: comicAbierto.toDataURL())

// Abre la página delante de quien mira, en el paso 0. Con cada respuesta pasa al siguiente (y hace su "hacer");
// después de la última, "alAcabar". Devuelve con qué quitarla.
function abrirComic(escena, guion, alAcabar) {
  // cada viñeta, fotografiada a su tamaño
  const [W, H] = COMIC_PX, fotos = new Map();
  for (const vineta of guion.paginas.flat()) { const v = huecoDeVineta(vineta); fotos.set(vineta, tomaDeComic(escena, guion.tomas[vineta.toma], v.w, v.h)); }
  const lienzo = document.createElement('canvas');
  lienzo.width = W; lienzo.height = H;
  comicAbierto = lienzo;
  const g = lienzo.getContext('2d'), tex = new THREE.CanvasTexture(lienzo);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const alto = COMIC_ANCHO * H / W, pagina = new THREE.Group();
  const malla = new THREE.Mesh(new THREE.PlaneGeometry(COMIC_ANCHO, alto), new THREE.MeshBasicMaterial({ map: tex, depthTest: false, fog: false }));
  malla.renderOrder = 994;
  malla.position.y = alto / 2 + 0.1;
  pagina.add(malla);
  // delante, algo más lejos que las tablas y a la altura de los ojos
  const ojo = new THREE.Vector3(), sitio = sitioDeLectura(escena);
  escena.camera.getWorldPosition(ojo);
  sitio.y = ojo.y - alto / 2 - 0.12;
  pagina.position.copy(sitio);
  pagina.lookAt(ojo.x, sitio.y, ojo.z);
  const vista = tablaEnMonitor(escena, COMIC_ANCHO, alto + 0.35);
  if (vista) { pagina.position.copy(vista.centro).addScaledVector(vista.arriba, -(alto / 2 + 0.05) * vista.k); pagina.quaternion.copy(vista.q); pagina.scale.setScalar(vista.k); }
  escena.object3D.add(pagina);
  pagina.updateMatrixWorld(true);
  if (vista) ratonLibre('pregunta', true);

  let paso = 0, boton = null, texBoton = null, ultimo = performance.now();
  const ponerBoton = () => {
    if (boton) { boton.parentNode.removeChild(boton); texBoton.dispose(); }
    const p = guion.pasos[paso];
    texBoton = tablaDeTexto(p.respuesta, 512, 96);
    boton = document.createElement('a-entity');
    boton.classList.add('clicable', 'cartel', 'pregunta');
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.15), new THREE.MeshBasicMaterial({ map: texBoton, depthTest: false, transparent: true, fog: false }));
    m.renderOrder = 995;
    boton.setObject3D('mesh', m);
    const pos = pagina.localToWorld(new THREE.Vector3(0, 0, 0.01));
    boton.setAttribute('position', `${pos.x} ${pos.y} ${pos.z}`);
    boton.object3D.quaternion.copy(pagina.quaternion);
    if (vista) boton.object3D.scale.setScalar(vista.k);
    boton.addEventListener('mouseenter', () => m.material.color.set('#ffcc33'));
    boton.addEventListener('mouseleave', () => m.material.color.set('#ffffff'));
    boton.addEventListener('mousedown', () => {
      if (performance.now() - ultimo < 400) return;
      ultimo = performance.now();
      const hecho = guion.pasos[paso];
      if (hecho.hacer) hecho.hacer();
      if (paso + 1 >= guion.pasos.length) { alAcabar(); return; }
      paso++;
      pintarPaginaComic(g, guion, fotos, paso); tex.needsUpdate = true;
      ponerBoton();
    });
    escena.appendChild(boton);
  };
  pintarPaginaComic(g, guion, fotos, paso); tex.needsUpdate = true;
  ponerBoton();
  return () => {
    if (vista) ratonLibre('pregunta', false);
    comicAbierto = null;
    pagina.parent.remove(pagina);
    malla.geometry.dispose(); malla.material.dispose(); tex.dispose();
    if (boton) { boton.parentNode.removeChild(boton); texBoton.dispose(); }
  };
}
