// Editor VR: texturas de madera, piedra y hierba dibujadas en canvas (sin imágenes externas)
// y los componentes que las ponen: suelo-madera, pared-piedra (planos), piedra-mundo (cajas) y
// suelo-hierba (el campo de fuera).

// Suelo de tablas de madera dibujado en un canvas (sin imágenes externas).
// La textura cubre 2 × 2 m y se repite según el tamaño del plano.
let texturaMadera = null;
function crearTexturaMadera() {
  const N = 1024, M = 2;                     // píxeles y metros que cubre la textura
  const px = N / M, ancho = 0.15 * px;      // tablas de 15 cm
  const c = document.createElement('canvas');
  c.width = c.height = N;
  const g = c.getContext('2d');
  let semilla = 7;
  const azar = () => (semilla = (semilla * 16807) % 2147483647) / 2147483647;
  for (let y = 0; y < N; y += ancho) {
    let x = -azar() * 1.2 * px;              // juntas escalonadas entre filas
    while (x < N) {
      const largo = (0.8 + azar() * 0.8) * px;
      const h = 26 + azar() * 8, s = 42 + azar() * 14, l = 36 + azar() * 14;
      g.fillStyle = `hsl(${h}, ${s}%, ${l}%)`;
      g.fillRect(x, y, largo, ancho);
      // vetas: líneas finas un poco onduladas
      g.strokeStyle = `hsla(${h - 4}, ${s}%, ${l - 12}%, 0.35)`;
      g.lineWidth = 1;
      for (let v = 0; v < 6; v++) {
        const vy = y + 4 + azar() * (ancho - 8), fase = azar() * 6, amp = 1 + azar() * 2;
        g.beginPath();
        for (let vx = x; vx <= x + largo; vx += 8) g.lineTo(vx, vy + Math.sin(vx / 40 + fase) * amp);
        g.stroke();
      }
      // junta entre tablas
      g.fillStyle = 'rgba(40, 25, 12, 0.55)';
      g.fillRect(x, y, 2, ancho);
      x += largo;
    }
    g.fillStyle = 'rgba(40, 25, 12, 0.6)';
    g.fillRect(0, y, N, 2);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return { tex, metros: M };
}

AFRAME.registerComponent('suelo-madera', {
  init() {
    this.aplicar = this.aplicar.bind(this);
    this.el.addEventListener('object3dset', this.aplicar);
    this.aplicar();
  },
  aplicar() {
    const malla = this.el.getObject3D('mesh');
    if (!malla) return;
    texturaMadera = texturaMadera || crearTexturaMadera();
    const tex = texturaMadera.tex.clone();   // cada suelo con su propia repetición
    tex.needsUpdate = true;
    const w = parseFloat(this.el.getAttribute('width')), h = parseFloat(this.el.getAttribute('height'));
    tex.repeat.set(w / texturaMadera.metros, h / texturaMadera.metros);
    malla.material.map = tex;
    malla.material.color.set('#ffffff');
    malla.material.roughness = 0.75;
    malla.material.needsUpdate = true;
  }
});

// Pared de piedra: sillares grises y beis en hileras, con juntas de mortero, dibujados
// en un canvas. La textura cubre 2 × 2 m y se repite sin cortes según el tamaño del plano.
let texturaPiedra = null;
function crearTexturaPiedra() {
  const N = 1024, M = 2, px = N / M;
  const c = document.createElement('canvas');
  c.width = c.height = N;
  const g = c.getContext('2d');
  let semilla = 23;
  const azar = () => (semilla = (semilla * 16807) % 2147483647) / 2147483647;
  g.fillStyle = '#8c8478';                       // mortero
  g.fillRect(0, 0, N, N);
  const alturas = [0.24, 0.3, 0.22, 0.28, 0.26, 0.2, 0.25, 0.25];   // suman 2 m: hileras que encajan al repetir
  const junta = 0.012 * px;
  let y = 0;
  for (const a of alturas) {
    const h = a * px;
    const inicio = azar() * N;
    let x = inicio;
    while (x < inicio + N - 1) {
      let w = (0.3 + azar() * 0.35) * px;
      if (inicio + N - (x + w) < 0.18 * px) w = inicio + N - x;   // el último cierra la hilera
      const l = 52 + azar() * 16, s = 6 + azar() * 10, tono = 30 + azar() * 15;
      for (const dx of [0, -N]) {                // dibujar también desplazado para que repita sin cortes
        const bx = x + dx;
        g.fillStyle = `hsl(${tono}, ${s}%, ${l}%)`;
        g.fillRect(bx + junta, y + junta, w - 2 * junta, h - 2 * junta);
        // moteado de la piedra
        for (let k = 0; k < 60; k++) {
          g.fillStyle = `hsla(${tono}, ${s}%, ${l + (azar() - 0.5) * 20}%, 0.5)`;
          g.fillRect(bx + junta + azar() * (w - 2 * junta - 6), y + junta + azar() * (h - 2 * junta - 6), 2 + azar() * 6, 2 + azar() * 6);
        }
        // borde de arriba más claro y de abajo más oscuro: algo de relieve
        g.fillStyle = 'rgba(255, 255, 255, 0.12)';
        g.fillRect(bx + junta, y + junta, w - 2 * junta, 4);
        g.fillStyle = 'rgba(0, 0, 0, 0.18)';
        g.fillRect(bx + junta, y + h - junta - 5, w - 2 * junta, 5);
      }
      x += w;
    }
    y += h;
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return { tex, metros: M };
}

AFRAME.registerComponent('pared-piedra', {
  init() {
    this.aplicar = this.aplicar.bind(this);
    this.el.addEventListener('object3dset', this.aplicar);
    this.aplicar();
  },
  aplicar() {
    const malla = this.el.getObject3D('mesh');
    if (!malla) return;
    texturaPiedra = texturaPiedra || crearTexturaPiedra();
    const tex = texturaPiedra.tex.clone();
    tex.needsUpdate = true;
    const w = parseFloat(this.el.getAttribute('width')), h = parseFloat(this.el.getAttribute('height'));
    tex.repeat.set(w / texturaPiedra.metros, h / texturaPiedra.metros);
    // que las piedras casen entre trozos de pared (alrededor de la ventana, encima de la puerta):
    // la textura empieza según dónde cae la esquina inferior izquierda del plano en el mundo
    const o = this.el.object3D;
    o.updateMatrixWorld(true);
    const ejeX = new THREE.Vector3(1, 0, 0).transformDirection(o.matrixWorld);
    const esquina = new THREE.Vector3(-w / 2, -h / 2, 0).applyMatrix4(o.matrixWorld);
    tex.offset.set(esquina.dot(ejeX) / texturaPiedra.metros, esquina.y / texturaPiedra.metros);
    malla.material.map = tex;
    malla.material.color.set('#ffffff');
    malla.material.roughness = 0.95;
    malla.material.needsUpdate = true;
  }
});

// Piedra para cualquier caja: pone la textura de piedra en todas sus caras a escala real,
// alineada con el mundo (las hileras casan entre cajas vecinas, como en un muro de sillares).
// Calcula las coordenadas de textura de cada cara según hacia dónde mira; la geometría se
// copia para no tocar la que A-Frame comparte entre cajas iguales. "tono" tiñe la piedra (para que
// algo de piedra se distinga del muro de detrás, como la chimenea del comedor).
AFRAME.registerComponent('piedra-mundo', {
  schema: { tono: { default: '#ffffff' } },
  init() {
    const aplicar = () => {
      const malla = this.el.getObject3D('mesh');
      if (!malla) return;
      texturaPiedra = texturaPiedra || crearTexturaPiedra();
      this.el.object3D.updateWorldMatrix(true, true);
      const geo = malla.geometry.clone(), pos = geo.attributes.position, nor = geo.attributes.normal, uv = geo.attributes.uv;
      const v = new THREE.Vector3(), n = new THREE.Vector3(), M = texturaPiedra.metros;
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i).applyMatrix4(malla.matrixWorld);
        n.fromBufferAttribute(nor, i).transformDirection(malla.matrixWorld);
        const ax = Math.abs(n.x), ay = Math.abs(n.y), az = Math.abs(n.z);
        if (ax >= ay && ax >= az) uv.setXY(i, -v.z * Math.sign(n.x) / M, v.y / M);
        else if (ay >= az) uv.setXY(i, v.x / M, v.z / M);
        else uv.setXY(i, v.x * Math.sign(n.z) / M, v.y / M);
      }
      uv.needsUpdate = true;
      malla.geometry = geo;
      const tex = texturaPiedra.tex.clone();
      tex.needsUpdate = true;
      malla.material.map = tex;
      malla.material.color.set(this.data.tono);
      malla.material.roughness = 0.95;
      malla.material.needsUpdate = true;
    };
    // cuando la caja ya tiene su posición y su malla
    if (this.el.hasLoaded) aplicar(); else this.el.addEventListener('loaded', aplicar, { once: true });
  }
});

// Hierba para el campo de fuera: verde apagado con manchas y briznas más claras y más oscuras,
// y alguna calva de tierra, dibujada en un canvas. Cubre 4 × 4 m y se repite según el plano.
let texturaHierba = null;
function crearTexturaHierba() {
  const N = 512, M = 4;
  const c = document.createElement('canvas');
  c.width = c.height = N;
  const g = c.getContext('2d');
  let semilla = 41;
  const azar = () => (semilla = (semilla * 16807) % 2147483647) / 2147483647;
  g.fillStyle = '#5f6b3e';
  g.fillRect(0, 0, N, N);
  for (let k = 0; k < 40; k++) {   // manchas grandes y calvas de tierra
    const tierra = azar() < 0.15;
    g.fillStyle = tierra ? 'rgba(120, 100, 70, 0.35)' : `hsla(${70 + azar() * 25}, ${20 + azar() * 15}%, ${26 + azar() * 14}%, 0.35)`;
    const x = azar() * N, y = azar() * N, r = 20 + azar() * 60;
    for (const dx of [0, -N, N]) for (const dy of [0, -N, N]) { g.beginPath(); g.arc(x + dx, y + dy, r, 0, 2 * Math.PI); g.fill(); }
  }
  for (let k = 0; k < 6000; k++) {   // briznas
    g.strokeStyle = `hsla(${65 + azar() * 30}, ${25 + azar() * 20}%, ${20 + azar() * 30}%, 0.6)`;
    const x = azar() * N, y = azar() * N;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + (azar() - 0.5) * 4, y - 3 - azar() * 6); g.stroke();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return { tex, metros: M };
}

// Tierra de los caminos: marrón apagado con manchas, piedrecillas y dos rodadas. "alfa" da la
// transparencia de cada píxel (u, v de 0 a 1), para que el borde se funda con la hierba.
function crearTexturaTierra(alfa) {
  const N = 256;
  const c = document.createElement('canvas');
  c.width = c.height = N;
  const g = c.getContext('2d');
  let semilla = 77;
  const azar = () => (semilla = (semilla * 16807) % 2147483647) / 2147483647;
  g.fillStyle = '#7f7052';
  g.fillRect(0, 0, N, N);
  for (let k = 0; k < 60; k++) {   // manchas
    g.fillStyle = `hsla(${32 + azar() * 12}, ${18 + azar() * 14}%, ${28 + azar() * 20}%, 0.25)`;
    const x = azar() * N, y = azar() * N, r = 8 + azar() * 30;
    for (const dx of [0, -N, N]) { g.beginPath(); g.arc(x + dx, y, r, 0, 2 * Math.PI); g.fill(); }
  }
  for (let k = 0; k < 900; k++) {   // piedrecillas
    g.fillStyle = `hsla(35, 12%, ${25 + azar() * 40}%, 0.7)`;
    g.fillRect(azar() * N, azar() * N, 1 + azar() * 2, 1 + azar() * 2);
  }
  const img = g.getImageData(0, 0, N, N);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++)
    img.data[(y * N + x) * 4 + 3] = 255 * alfa(x / N, y / N);
  g.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}
const suave = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
const METROS_TIERRA = 4;   // la textura cubre esto a lo largo del camino

// Camino que serpentea: una cinta sobre el suelo que pasa por "puntos" (x z, x z, …: coordenadas del
// mundo, separados por comas) con curvas suaves y el borde irregular, fundido con la hierba.
let texturaCamino = null;
AFRAME.registerComponent('camino', {
  schema: { puntos: { type: 'string' }, ancho: { default: 2.4 }, y: { default: -0.03 } },   // y: sin terreno de malla, a esa altura
  init() {
    const { puntos, ancho, y } = this.data;
    // el borde ondula en senos de frecuencia entera, para que la textura empalme al repetirse
    const ondas = (u, a, b) => 0.05 * Math.sin(2 * Math.PI * (a * u + b)) + 0.035 * Math.sin(2 * Math.PI * (3 * a * u + 2 * b));
    texturaCamino = texturaCamino || crearTexturaTierra((u, v) =>
      suave(0.1 + ondas(u, 2, 0.1), 0.24 + ondas(u, 2, 0.1), v) * (1 - suave(0.76 + ondas(u, 3, 0.6), 0.9 + ondas(u, 3, 0.6), v)));
    const curva = new THREE.CatmullRomCurve3(puntos.split(',').map(p => {
      const [x, z] = p.trim().split(/\s+/).map(Number);
      return new THREE.Vector3(x, y, z);
    }), false, 'centripetal');
    const n = Math.ceil(curva.getLength() / 0.5);   // un tramo cada medio metro
    const pos = [], nor = [], uv = [], ind = [];
    for (let i = 0; i <= n; i++) {
      const p = curva.getPointAt(i / n), t = curva.getTangentAt(i / n), nx = -t.z, nz = t.x, l = Math.hypot(nx, nz) || 1;
      // cinco puntos de borde a borde, pegados a la malla del terreno: si no, en las cuestas la cinta queda en el aire
      for (let k = 0; k < 5; k++) {
        const lado = k / 2 - 1, bx = p.x + lado * nx / l * ancho / 2, bz = p.z + lado * nz / l * ancho / 2;
        pos.push(bx, mallaTerreno ? alturaMalla(bx, bz) + 0.015 : alturaTerreno(bx, bz) + y, bz);
        nor.push(0, 1, 0);
        uv.push(i / n * curva.getLength() / METROS_TIERRA, k / 4);
      }
      if (i < n) for (let k = 0; k < 4; k++) { const a = i * 5 + k; ind.push(a, a + 1, a + 5, a + 1, a + 6, a + 5); }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(ind);
    const malla = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: texturaCamino, transparent: true, depthWrite: false, roughness: 1, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    malla.renderOrder = 1;   // por encima de los claros
    this.el.setObject3D('mesh', malla);
  },
  remove() { this.el.removeObject3D('mesh'); }
});

// Claro de tierra: un círculo de "radio" en la entidad, con el borde fundido con la hierba.
let texturaClaro = null;
AFRAME.registerComponent('claro', {
  schema: { radio: { default: 7 } },
  init() {
    texturaClaro = texturaClaro || crearTexturaTierra((u, v) => {
      const a = Math.atan2(v - 0.5, u - 0.5);
      return 1 - suave(0.36 + 0.03 * Math.sin(5 * a) + 0.02 * Math.sin(11 * a), 0.5, Math.hypot(u - 0.5, v - 0.5));
    });
    const lado = this.data.radio * 2;
    const malla = new THREE.Mesh(new THREE.PlaneGeometry(lado, lado),
      new THREE.MeshStandardMaterial({ map: texturaClaro, transparent: true, depthWrite: false, roughness: 1 }));
    malla.rotation.x = -Math.PI / 2;
    this.el.setObject3D('mesh', malla);
  },
  remove() { this.el.removeObject3D('mesh'); }
});

// Cielo: una cúpula con degradado, nubes y el sol, dibujada en un canvas, siempre centrada en la
// cabeza. La niebla también la tapa, para el cambio de zona. Cada zona pone el suyo (js/mundo.js).
const CIELOS = {
  atardecer: {
    sol: [-1, 0.2, 0.25], tierra: '#b98a70', nubeAlta: '150, 110, 140', nubeBaja: '250, 170, 120', radioSol: 14, resplandor: 420,
    degradado: [[0, '#2c3a68'], [0.55, '#6d5f8c'], [0.82, '#c97f78'], [0.95, '#f0a766'], [1, '#f7c07a']],
    brillo: ['rgba(255, 225, 160, 0.95)', 'rgba(255, 190, 110, 0.7)', 'rgba(255, 150, 80, 0)'],
    horneado: { energia: 5, color: [1, 0.5, 0.22], abajo: [1, 0.42, 0.18], medio: [0.62, 0.3, 0.38], arriba: [0.1, 0.14, 0.38], fuerza: 0.8 },
  },
  mediodia: {
    sol: [0.4, 1, 0.3], tierra: '#b9cfd8', nubeAlta: '255, 255, 255', nubeBaja: '255, 255, 255', radioSol: 16, resplandor: 260,
    degradado: [[0, '#3f78c0'], [0.6, '#6ea5dc'], [0.92, '#b4d4ec'], [1, '#d8e8ef']],
    brillo: ['rgba(255, 255, 240, 0.95)', 'rgba(255, 255, 230, 0.5)', 'rgba(255, 255, 230, 0)'],
    horneado: { energia: 4, color: [1, 0.96, 0.88], abajo: [0.7, 0.85, 1], medio: [0.5, 0.7, 1], arriba: [0.25, 0.45, 0.9], fuerza: 1 },
  },
};
// el mismo atardecer, con el sol sobre el mar (al este)
CIELOS.atardecerMar = Object.assign({}, CIELOS.atardecer, { sol: [1, 0.18, -0.2] });
CIELOS.noche = {
  sol: [-0.45, 0.65, 0.5], tierra: '#10151f', nubeAlta: '110, 125, 165', nubeBaja: '80, 90, 125', radioSol: 26, resplandor: 200, estrellas: true,
  degradado: [[0, '#050814'], [0.6, '#0a1128'], [0.92, '#1a2542'], [1, '#2a3555']],
  brillo: ['rgba(235, 240, 255, 0.95)', 'rgba(190, 205, 240, 0.35)', 'rgba(170, 190, 240, 0)'],
  horneado: { energia: 0.5, color: [0.6, 0.72, 1], abajo: [0.1, 0.13, 0.25], medio: [0.05, 0.08, 0.2], arriba: [0.02, 0.03, 0.1], fuerza: 0.5 },
};
function dibujarCielo(d) {
  const c = document.createElement('canvas');
  c.width = 2048; c.height = 1024;
  const g = c.getContext('2d'), W = c.width, H = c.height;
  const grad = g.createLinearGradient(0, 0, 0, H / 2);
  for (const [p, col] of d.degradado) grad.addColorStop(p, col);
  g.fillStyle = grad; g.fillRect(0, 0, W, H / 2);
  g.fillStyle = d.tierra; g.fillRect(0, H / 2, W, H / 2);
  if (d.estrellas) {
    let e = 23;
    const az = () => (e = (e * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < 1400; i++) {
      g.fillStyle = `rgba(230, 235, 255, ${0.3 + az() * 0.7})`;
      const y = az(); g.fillRect(az() * W, y * y * H * 0.48, 1 + az() * 1.5, 1 + az() * 1.5);
    }
  }
  // bandas de nubes, alargadas
  let s = 11;
  const azar = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 60; i++) {
    const x = azar() * W, y = H * (0.2 + azar() * 0.26), an = 80 + azar() * 260, al = 3 + azar() * 9;
    g.fillStyle = `rgba(${y > H * 0.36 ? d.nubeBaja : d.nubeAlta}, ${0.12 + azar() * 0.2})`;
    for (const dx of [0, W, -W]) { g.beginPath(); g.ellipse(x + dx, y, an, al, 0, 0, Math.PI * 2); g.fill(); }
  }
  // resplandor y disco del sol (en la esfera, u = 0 mira hacia -x y crece hacia +z)
  const sol = new THREE.Vector3(...d.sol).normalize();
  const x = ((Math.atan2(sol.z, -sol.x) / (Math.PI * 2) + 1) % 1) * W, y = H * (0.5 - Math.asin(sol.y) / Math.PI);
  for (const dx of [0, W, -W]) {
    const r = g.createRadialGradient(x + dx, y, 0, x + dx, y, d.resplandor);
    r.addColorStop(0, d.brillo[0]); r.addColorStop(0.05, d.brillo[1]); r.addColorStop(1, d.brillo[2]);
    g.fillStyle = r; g.fillRect(0, 0, W, H);
    g.fillStyle = '#fff6dc'; g.beginPath(); g.arc(x + dx, y, d.radioSol, 0, Math.PI * 2); g.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
AFRAME.registerComponent('cielo', {
  init() {
    this.texturas = {};
    this.cupula = new THREE.Mesh(new THREE.SphereGeometry(400, 32, 16), new THREE.MeshBasicMaterial({ side: THREE.BackSide, depthWrite: false }));
    this.cupula.renderOrder = -1;
    this.cupula.frustumCulled = false;
    this.el.object3D.add(this.cupula);
    this.ojo = new THREE.Vector3();
    this.poner('atardecer');
  },
  poner(nombre) {
    this.cupula.material.map = this.texturas[nombre] = this.texturas[nombre] || dibujarCielo(CIELOS[nombre]);
    this.cupula.material.needsUpdate = true;
  },
  tick() {
    if (this.el.camera) this.cupula.position.copy(this.el.camera.getWorldPosition(this.ojo));
  }
});

// Terreno de una zona: una malla cada 3 m, con la altura de alturaTerreno (mundo.js). De hierba; o, si
// la zona tiene "color" (la montaña, el acantilado), pintada por vértices y sin textura.
AFRAME.registerComponent('terreno', {
  schema: { x0: { default: 0 }, x1: { default: 0 }, z0: { default: 0 }, z1: { default: 0 }, paso: { default: 3 } },
  init() {
    const { x0, x1, z0, z1, paso: PASO } = this.data;
    texturaHierba = texturaHierba || crearTexturaHierba();
    const nx = Math.round((x1 - x0) / PASO), nz = Math.round((z1 - z0) / PASO), pos = [], uv = [], ind = [];
    for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
      const x = x0 + i * PASO, z = z0 + j * PASO;
      pos.push(x, alturaTerreno(x, z) - 0.05, z);
      uv.push(x / texturaHierba.metros, -z / texturaHierba.metros);
      if (i < nx && j < nz) { const a = j * (nx + 1) + i, b = a + nx + 1; ind.push(a, b, a + 1, a + 1, b, b + 1); }
    }
    mallaTerreno = { x0, z0, paso: PASO };
    const pintar = zonaCargada.color && zonaCargada.color.bind(zonaCargada);
    const geo = new THREE.BufferGeometry();
    if (pintar) {
      const col = [], c = new THREE.Color();
      for (let k = 0; k < pos.length; k += 3) { c.set(pintar(pos[k], pos[k + 1], pos[k + 2])); col.push(c.r, c.g, c.b); }
      geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(ind);
    geo.computeVertexNormals();
    this.el.setObject3D('mesh', new THREE.Mesh(geo, new THREE.MeshStandardMaterial(pintar ? { vertexColors: true, roughness: 1, flatShading: true } : { map: texturaHierba.tex, roughness: 1 })));
  },
  remove() { this.el.removeObject3D('mesh'); }
});

// Montañas alrededor de una zona llana: una malla de vértices pintados, con su sol pero sin hornear, que
// empieza a subir a "desde" metros del rectángulo x0…z1 y llega hasta "hasta" metros.
AFRAME.registerComponent('montes', {
  schema: { x0: { default: 0 }, x1: { default: 0 }, z0: { default: 0 }, z1: { default: 0 }, desde: { default: 28 }, hasta: { default: 300 } },
  init() {
    const { x0, x1, z0, z1, desde, hasta } = this.data, PASO = 12;
    const nx = Math.ceil((x1 - x0 + 2 * hasta) / PASO), nz = Math.ceil((z1 - z0 + 2 * hasta) / PASO), pos = [], col = [], ind = [], c = new THREE.Color();
    for (let j = 0; j <= nz; j++) for (let i = 0; i <= nx; i++) {
      const x = x0 - hasta + i * PASO, z = z0 - hasta + j * PASO;
      const d = Math.hypot(Math.max(0, x0 - x, x - x1), Math.max(0, z0 - z, z - z1));
      const h = rampa(desde, desde + 95, d) * (44 + 17 * Math.sin(x * 0.041 + 1) * Math.cos(z * 0.037) + 11 * Math.sin(x * 0.095 + z * 0.08) + 5 * Math.sin(z * 0.19 - x * 0.13)) - 2;
      pos.push(x, h, z);
      const n = h + 3 * Math.sin(x * 0.27) * Math.cos(z * 0.31);
      c.set(n > 46 ? '#a9acb2' : n > 26 ? '#67645e' : n > 13 ? '#5f6545' : '#4f6330'); col.push(c.r, c.g, c.b);
      if (i < nx && j < nz) { const a = j * (nx + 1) + i, b = a + nx + 1; ind.push(a, b, a + 1, a + 1, b, b + 1); }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    geo.setIndex(ind);
    geo.computeVertexNormals();
    this.el.setObject3D('mesh', new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true })));
  },
  remove() { this.el.removeObject3D('mesh'); }
});

AFRAME.registerComponent('suelo-hierba', {
  init() {
    const aplicar = () => {
      const malla = this.el.getObject3D('mesh');
      if (!malla) return;
      texturaHierba = texturaHierba || crearTexturaHierba();
      const tex = texturaHierba.tex.clone();
      tex.needsUpdate = true;
      const w = parseFloat(this.el.getAttribute('width')), h = parseFloat(this.el.getAttribute('height'));
      tex.repeat.set(w / texturaHierba.metros, h / texturaHierba.metros);
      malla.material.map = tex;
      malla.material.color.set('#ffffff');
      malla.material.roughness = 1;
      malla.material.needsUpdate = true;
    };
    this.el.addEventListener('object3dset', aplicar);
    aplicar();
  }
});
