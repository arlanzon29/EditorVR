// Editor VR: texturas de madera y piedra dibujadas en canvas (sin imágenes externas)
// y los componentes que las ponen: suelo-madera, pared-piedra (planos) y piedra-mundo (cajas).

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
