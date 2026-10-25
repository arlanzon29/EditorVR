// Editor VR: objetos de la escena.
// Arco ciego, puerta, antorcha, estatua, biblioteca, escalera de la sala 3, muros con arcos y
// pasillos de arriba.

// Arco ciego de medio punto sobre un muro: hueco oscuro con forma de arco y, alrededor, un
// arco de dovelas de piedra que sobresale un poco. Mira hacia +z local; la base está en y = 0.
AFRAME.registerComponent('arco-ciego', {
  schema: { ancho: { default: 1.6 }, alto: { default: 1.8 }, dovela: { default: 0.2 } },
  init() {
    const { ancho, alto, dovela } = this.data, r = ancho / 2, recto = alto - r;
    const arco = (rad, abierto) => {   // contorno de arco de radio rad (con la base abierta o cerrada)
      const s = new THREE.Shape();
      s.moveTo(-rad, 0); s.lineTo(-rad, recto); s.absarc(0, recto, rad, Math.PI, 0, true); s.lineTo(rad, 0);
      if (!abierto) s.lineTo(-rad, 0);
      return s;
    };
    texturaPiedra = texturaPiedra || crearTexturaPiedra();
    const hueco = new THREE.Mesh(new THREE.ShapeGeometry(arco(r), 16), new THREE.MeshStandardMaterial({ color: '#2b241c', roughness: 1 }));
    hueco.position.z = 0.005;
    // dovelas: la corona entre el arco de fuera y el de dentro, con algo de grosor
    const corona = arco(r + dovela, false);
    const dentro = new THREE.Path();
    dentro.moveTo(-r, 0); dentro.lineTo(-r, recto); dentro.absarc(0, recto, r, Math.PI, 0, true); dentro.lineTo(r, 0); dentro.lineTo(-r, 0);
    corona.holes.push(dentro);
    const tex = texturaPiedra.tex.clone();
    tex.needsUpdate = true;
    tex.repeat.set(1 / texturaPiedra.metros, 1 / texturaPiedra.metros);
    const dovelas = new THREE.Mesh(new THREE.ExtrudeGeometry(corona, { depth: 0.08, bevelEnabled: false, curveSegments: 16 }),
      new THREE.MeshStandardMaterial({ map: tex, color: '#e6dccb', roughness: 0.95 }));
    const g = new THREE.Group();
    g.add(hueco, dovelas);
    this.el.setObject3D('mesh', g);
  },
  remove() { this.el.removeObject3D('mesh'); }
});

// Puerta que se abre y se cierra al hacer clic en ella: gatillo apuntando con el mando,
// o clic del ratón con la mira en el centro de la pantalla. Gira sobre las bisagras hacia dentro.
// Al apuntarla, la aldaba brilla y crece, sale un cartel "Abrir"/"Cerrar" y el rayo se pone verde.
const RAYO = '#ffe066', RAYO_PUERTA = '#5cff8a';

AFRAME.registerComponent('puerta', {
  schema: { abierta: { default: -100 } },   // grados al abrirse
  init() {
    this.abierta = false;
    this.apuntada = false;
    // la aldaba del modelo de Blender (nodo "Aldaba"), con su propio material para que al
    // brillar no se encienda también el resto del hierro de la hoja
    this.aldaba = null;
    this.el.addEventListener('model-loaded', e => {
      const a = e.detail.model.getObjectByName('Aldaba');
      if (!a) return;
      a.material = a.material.clone();
      this.aldaba = a;
    });
    this.carteles = [...this.el.querySelectorAll('.cartel')];
    this.el.addEventListener('click', () => {
      this.abierta = !this.abierta;
      for (const c of this.carteles) c.querySelector('a-text').setAttribute('value', this.abierta ? 'Cerrar' : 'Abrir');
      this.el.setAttribute('animation', {
        property: 'rotation', to: `0 ${this.abierta ? this.data.abierta : 0} 0`,
        dur: 700, easing: 'easeInOutQuad'
      });
    });
  },
  tick() {
    // ¿algún rayo (mandos o mira) está tocando una parte de la puerta?
    let apuntada = false;
    for (const el of this.el.sceneEl.querySelectorAll('[raycaster]')) {
      const r = el.components.raycaster;
      if (!r || !r.data.enabled) continue;
      const toca = r.intersectedEls.some(e => this.el.contains(e));
      if (el.hasAttribute('laser-controls')) {
        const color = r.intersectedEls.some(e => e.closest('[puerta]')) ? RAYO_PUERTA : RAYO;
        if (r.data.lineColor !== color) el.setAttribute('raycaster', 'lineColor', color);
      }
      apuntada = apuntada || toca;
    }
    if (apuntada === this.apuntada) return;
    this.apuntada = apuntada;
    if (this.aldaba) {
      this.aldaba.material.emissive.set(apuntada ? '#ffcc33' : '#000');
      const s = apuntada ? 1.5 : 1;
      this.aldaba.scale.set(s, s, 1);   // crece en el plano de la puerta, sin despegarse de ella
    }
    for (const c of this.carteles) c.object3D.visible = apuntada;
  }
});

// Antorcha de pared (modelos/antorcha.glb, hecha en Blender). El modelo sale de la pared hacia
// +z; se pone pegado a ella y se gira hacia la sala. Lleva su luz cálida junto a la llama, y la
// llama (nodo "Llama" del modelo) tiembla: se estira, se encoge y se ladea, y la luz sube y baja
// a la vez. Cada antorcha con su propio ritmo, para que no parpadeen todas juntas.
AFRAME.registerComponent('antorcha', {
  schema: { intensidad: { default: 0.5 }, color: { default: '#ffb060' } },
  init() {
    this.el.setAttribute('gltf-model', 'url(modelos/antorcha.glb)');
    this.llama = null;
    this.el.addEventListener('model-loaded', e => { this.llama = e.detail.model.getObjectByName('Llama'); });
    this.luz = document.createElement('a-entity');
    this.luz.setAttribute('light', { type: 'point', intensity: this.data.intensidad, distance: 4, color: this.data.color });
    this.luz.setAttribute('position', '0 0.35 0.25');
    this.el.appendChild(this.luz);
    this.fase = Math.random() * 100;
  },
  tick(t) {
    const s = t / 1000 + this.fase;
    // tres ondas de velocidades que no casan entre sí: un temblor que no se ve repetirse
    const v = 0.5 * Math.sin(s * 7.3) + 0.3 * Math.sin(s * 13.1 + 1.7) + 0.2 * Math.sin(s * 23.7 + 4.1);   // -1…1
    if (this.llama) {
      this.llama.scale.set(1 - v * 0.08, 1 + v * 0.18, 1 - v * 0.08);
      this.llama.rotation.z = 0.06 * Math.sin(s * 3.1);
    }
    const luz = this.luz.getObject3D('light');
    if (luz) luz.intensity = this.data.intensidad * (1 + v * 0.3);
  }
});

// Estatua de un caballero sobre pedestal (modelos/caballero.glb, hecha en Blender): figura de
// 1,77 m sobre un pedestal de sillares de 0,95 × 0,95 × 0,85 m. Mira hacia +z local. El
// pedestal es macizo: no se puede atravesar ni subir (va en SUPERFICIES).
AFRAME.registerComponent('estatua', {
  init() {
    this.el.setAttribute('gltf-model', 'url(modelos/caballero.glb)');
    const p = this.el.object3D.position, r = 0.95 / 2;
    SUPERFICIES.push({ x0: p.x - r, x1: p.x + r, z0: p.z - r, z1: p.z + r, y: 0.85, macizo: true });
  }
});

// Biblioteca: mueble de madera con baldas, lleno de libros de colores y alturas variadas
// (siempre los mismos: el azar tiene semilla fija). El frente mira hacia +z local.
AFRAME.registerComponent('biblioteca', {
  schema: { ancho: { default: 1.6 }, alto: { default: 2 }, fondo: { default: 0.35 }, baldas: { default: 5 } },
  init() {
    const { ancho, alto, fondo, baldas } = this.data, g = 0.025, madera = '#7a5230';
    const caja = (x, y, z, w, h, d, color) => {
      const b = document.createElement('a-box');
      b.setAttribute('position', `${x} ${y} ${z}`);
      b.setAttribute('width', w); b.setAttribute('height', h); b.setAttribute('depth', d);
      b.setAttribute('color', color);
      this.el.appendChild(b);
    };
    caja(-ancho / 2 + g / 2, alto / 2, 0, g, alto, fondo, madera);              // laterales
    caja(ancho / 2 - g / 2, alto / 2, 0, g, alto, fondo, madera);
    caja(0, alto / 2, -fondo / 2 + g / 2, ancho - 2 * g, alto, g, '#5e3f24');   // fondo
    const hueco = (alto - g) / baldas;
    for (let i = 0; i <= baldas; i++) caja(0, i * hueco + g / 2, 0, ancho - 2 * g, g, fondo, madera);
    let semilla = 11;
    const azar = () => (semilla = (semilla * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < baldas; i++) {
      const y0 = i * hueco + g, fin = ancho / 2 - g - 0.01;
      let x = -ancho / 2 + g + 0.01;
      while (true) {
        if (azar() < 0.06) { x += 0.06 + azar() * 0.12; continue; }   // algún hueco
        const w = 0.02 + azar() * 0.035;
        if (x + w > fin) break;
        const h = (hueco - g) * (0.6 + azar() * 0.32), d = fondo * (0.6 + azar() * 0.25);
        // colores apagados de lomo de libro (granates, marrones, verdes, azules oscuros, crema)
        const tono = [0, 8, 18, 28, 35, 45, 95, 140, 200, 215, 225, 280, 340][Math.floor(azar() * 13)];
        const color = `hsl(${tono}, ${18 + azar() * 25}%, ${16 + azar() * 22}%)`;
        caja(x + w / 2, y0 + h / 2, -fondo / 2 + g + d / 2, w, h, d, color);
        x += w + 0.002;
      }
    }
  }
});

// Escalera de la sala 3 (al estilo de la Escalera Dorada de Burgos) y galería superior.
// La escalera ocupa toda la pared del fondo (z = 14), de pared lateral a pared lateral, en dos
// franjas: la de delante (z = 11,2…12,6) y la de atrás (z = 12,6…14), pegada al fondo.
//  1. tramo central ancho (x = 4,8…7,2) que sube hacia el fondo hasta un rellano a 1,2 m,
//     delante de un nicho;
//  2. desde ahí, por la franja de DELANTE, un tramo corto hacia cada lado hasta un rellano a 2 m
//     que llega hasta la pared lateral (en la esquina ocupa también la franja de atrás);
//  3. desde cada rellano, por la franja de ATRÁS, pegado al fondo, un tramo largo vuelve hacia el
//     centro y los dos se juntan en el rellano de arriba (x = 4,7…7,3), a 4,4 m, ante la puerta.
// Arriba, desde el rellano, un arco en la pared del fondo lleva a los pasillos que rodean la
// sala por fuera de sus muros (componentes muro-arcos y pasillos-arriba).
// Barandillas doradas. Peldaños de 20 × 30 cm. Todo en coordenadas del mundo (la entidad va en
// el origen). Rellena SUPERFICIES: la escalera es maciza; la galería se puede pasar por debajo.
AFRAME.registerComponent('escalera-sala3', {
  init() {
    const PIEDRA = '#cdbb98', HUELLA = '#ddd0b4', OSCURA = '#5e3d22', ORO = 'color: #d4a637; metalness: 0.7; roughness: 0.3';
    const H = ALTO_GALERIA;
    const caja = (x0, x1, y0, y1, z0, z1, color, extra) => {
      const b = document.createElement('a-box');
      b.setAttribute('position', `${(x0 + x1) / 2} ${(y0 + y1) / 2} ${(z0 + z1) / 2}`);
      b.setAttribute('width', x1 - x0); b.setAttribute('height', y1 - y0); b.setAttribute('depth', z1 - z0);
      b.setAttribute('color', color);
      if (extra) b.setAttribute(extra, '');
      this.el.appendChild(b);
    };
    const barra = (a, b, grosor) => {   // barrote o pasamanos dorado de a a b (puede ir inclinado)
      const p = new THREE.Vector3(...a), q = new THREE.Vector3(...b);
      const dir = q.clone().sub(p), largo = dir.length();
      // el giro se pone como cuaternión al cargar la caja: pasado a grados por el atributo
      // rotation salía torcido (A-Frame no aplica los ejes en el mismo orden que un Euler)
      const giro = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 0, 0), dir.normalize());
      const m = p.clone().add(q).multiplyScalar(0.5);
      const el = document.createElement('a-box');
      el.setAttribute('position', `${m.x} ${m.y} ${m.z}`);
      el.addEventListener('loaded', () => el.object3D.quaternion.copy(giro), { once: true });
      el.setAttribute('width', largo); el.setAttribute('height', grosor); el.setAttribute('depth', grosor);
      el.setAttribute('material', ORO);
      this.el.appendChild(el);
    };
    // barandilla entre dos puntos del borde; en los tramos, a y b son los cantos del primer y del
    // último peldaño, y el pasamanos va paralelo a la línea de cantos. Cada barrote arranca de la
    // pisada que tiene debajo (no de la línea inclinada) y llega hasta el pasamanos.
    const pisadaEn = (x, z, cerca) => {
      let mejor = cerca;
      for (const s of SUPERFICIES)
        if (dentro({ x, z }, s) && Math.abs(s.y - cerca) < 0.35 && (mejor === cerca || Math.abs(s.y - cerca) < Math.abs(mejor - cerca))) mejor = s.y;
      return mejor;
    };
    const barandilla = (a, b) => {
      const n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[2] - a[2]) / 0.15));
      for (let k = 0; k <= n; k++) {
        const f = k / n, x = a[0] + (b[0] - a[0]) * f, y = a[1] + (b[1] - a[1]) * f, z = a[2] + (b[2] - a[2]) * f;
        barra([x, pisadaEn(x, z, y), z], [x, y + 0.9, z], 0.025);
      }
      barra([a[0], a[1] + 0.9, a[2]], [b[0], b[1] + 0.9, b[2]], 0.06);
      if (a[1] === b[1]) barra([a[0], a[1] + 0.08, a[2]], [b[0], b[1] + 0.08, b[2]], 0.04);   // listón de abajo, solo en rellanos
    };
    const pisable = (x0, x1, z0, z1, y, macizo) => SUPERFICIES.push({ x0, x1, z0, z1, y, macizo });
    // peldaño o rellano macizo, de piedra, hasta el suelo; la pisada, de losas de roca
    const peldano = (x0, x1, z0, z1, y) => {
      caja(x0, x1, 0, y - 0.04, z0, z1, PIEDRA, 'piedra-mundo');
      caja(x0 - 0.01, x1 + 0.01, y - 0.04, y, z0 - 0.01, z1 + 0.01, HUELLA);
      const roca = document.createElement('a-plane');
      roca.setAttribute('rotation', '-90 0 0');
      roca.setAttribute('position', `${(x0 + x1) / 2} ${y + 0.002} ${(z0 + z1) / 2}`);
      roca.setAttribute('width', x1 - x0 + 0.02); roca.setAttribute('height', z1 - z0 + 0.02);
      roca.setAttribute('color', '#ffffff'); roca.setAttribute('pared-piedra', '');
      this.el.appendChild(roca);
      pisable(x0, x1, z0, z1, y, true);
    };
    // 1. tramo central (5 peldaños) y rellano, en la franja de delante
    for (let i = 1; i <= 5; i++) peldano(4.8, 7.2, 9.7 + (i - 1) * 0.3, 9.7 + i * 0.3, 0.2 * i);
    peldano(4.8, 7.2, 11.2, 12.6, 1.2);
    barandilla([4.83, 0.2, 9.72], [4.83, 1.2, 11.22]);
    barandilla([7.17, 0.2, 9.72], [7.17, 1.2, 11.22]);

    // 2 y 3, a cada lado (espejo: x → 12 - x para el lado izquierdo)
    const lado = espejo => {
      const pel = (xa, xb, z0, z1, y) => peldano(Math.min(espejo(xa), espejo(xb)), Math.max(espejo(xa), espejo(xb)), z0, z1, y);
      // 2. hacia la pared lateral por la franja de delante: 3 peldaños y rellano a 2 m hasta la pared
      for (let k = 1; k <= 3; k++) pel(4.8 - k * 0.3, 4.8 - (k - 1) * 0.3, 11.2, 12.6, 1.2 + 0.2 * k);
      pel(0, 3.9, 11.2, 12.6, 2.0);
      pel(0, 1.4, 12.6, 14, 2.0);
      barandilla([espejo(4.78), 1.4, 11.23], [espejo(3.88), 2.0, 11.23]);
      barandilla([espejo(3.9), 2.0, 11.23], [espejo(0), 2.0, 11.23]);
      // 3. de vuelta al centro por la franja de atrás, pegado al fondo: 11 peldaños de 2,2 a 4,2 m
      for (let m = 1; m <= 11; m++) pel(1.4 + (m - 1) * 0.3, 1.4 + m * 0.3, 12.6, 14, 2.0 + 0.2 * m);
      barandilla([espejo(1.42), 2.2, 12.63], [espejo(4.72), H, 12.63]);
    };
    lado(x => x);        // a la derecha entrando (junto a x = 0)
    lado(x => 12 - x);   // a la izquierda entrando (junto a x = 12)

    // un arco ciego en el frente de cada rellano lateral (debajo, como en Burgos)
    for (const x of [1.95, 10.05]) {
      const a = document.createElement('a-entity');
      a.setAttribute('arco-ciego', 'ancho: 1.6; alto: 1.75');
      a.setAttribute('position', `${x} 0 11.19`);
      a.setAttribute('rotation', '0 180 0');
      this.el.appendChild(a);
    }

    // rellano de arriba, macizo, en la franja de atrás; por delante, un nicho oscuro sobre el
    // rellano del tramo central (como en Burgos)
    peldano(4.7, 7.3, 12.6, 14, H);
    caja(5.3, 6.7, 1.2, 3.3, 12.56, 12.6, '#3a2c20');
    caja(5.2, 6.8, 3.3, 3.42, 12.52, 12.6, '#b8a27c');
    barandilla([4.7, H, 12.57], [7.3, H, 12.57]);   // borde del rellano de arriba
  }
});

// Muro de piedra con arcos (sala 3): un muro de "largo" × "alto" y "grosor" de espesor, con
// arcos de medio punto abiertos desde "base" (para ver y pasar a los pasillos de arriba) y,
// si se da, un hueco de entrada a ras de suelo ("entrada": desde, hasta, alto). Coordenadas
// locales: x a lo largo del muro, y hacia arriba; el espesor crece hacia +z local (hacia fuera
// de la sala), así que la cara de dentro queda en z = 0. Textura de piedra en metros reales.
AFRAME.registerComponent('muro-arcos', {
  schema: {
    largo: { default: 12 }, alto: { default: 7.5 }, grosor: { default: 0.4 },
    arcos: { type: 'array', default: [] }, ancho: { default: 1.2 },
    base: { default: ALTO_GALERIA }, recto: { default: 1.6 },   // tramo recto del hueco antes del arco
    entrada: { type: 'array', default: [] }
  },
  init() {
    const d = this.data, r = d.ancho / 2;
    const forma = new THREE.Shape();
    forma.moveTo(0, 0);
    if (d.entrada.length === 3) {
      const [e0, e1, eh] = d.entrada.map(Number);
      forma.lineTo(e0, 0); forma.lineTo(e0, eh); forma.lineTo(e1, eh); forma.lineTo(e1, 0);
    }
    forma.lineTo(d.largo, 0); forma.lineTo(d.largo, d.alto); forma.lineTo(0, d.alto); forma.lineTo(0, 0);
    for (const c of d.arcos.map(Number)) {
      const h = new THREE.Path();
      h.moveTo(c - r, d.base); h.lineTo(c + r, d.base); h.lineTo(c + r, d.base + d.recto);
      h.absarc(c, d.base + d.recto, r, 0, Math.PI, false);
      h.lineTo(c - r, d.base);
      forma.holes.push(h);
    }
    const geo = new THREE.ExtrudeGeometry(forma, { depth: d.grosor, bevelEnabled: false, curveSegments: 12 });
    texturaPiedra = texturaPiedra || crearTexturaPiedra();
    const tex = texturaPiedra.tex.clone();
    tex.needsUpdate = true;
    tex.repeat.set(1 / texturaPiedra.metros, 1 / texturaPiedra.metros);
    this.el.setObject3D('mesh', new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95 })));
  },
  remove() { this.el.removeObject3D('mesh'); }
});

// Pasillos de arriba de la sala 3: rodean la sala por fuera de sus muros (que tienen 40 cm de
// espesor), a la altura del rellano de arriba de la escalera (4,4 m), 1,6 m de ancho y 2,6 m de
// alto: suelo de madera, techo, muro exterior de piedra y alguna luz. Se entra por el arco del
// centro de la pared del fondo. Coordenadas del mundo (la entidad va en el origen).
AFRAME.registerComponent('pasillos-arriba', {
  init() {
    const H = ALTO_GALERIA, TECHO = H + 2.6;
    const plano = (pos, rot, w, h, extra) => {
      const p = document.createElement('a-plane');
      p.setAttribute('position', pos.join(' ')); p.setAttribute('rotation', rot);
      p.setAttribute('width', w); p.setAttribute('height', h); p.setAttribute('color', '#ffffff');
      if (extra) p.setAttribute(extra, '');
      this.el.appendChild(p);
    };
    // suelos (y lo que se pisa), techos: el anillo entre los muros de la sala y el exterior
    const tramos = [[-2, 14, 14.4, 16], [-2, 14, 2, 3.6], [-2, -0.4, 3.6, 14.4], [12.4, 14, 3.6, 14.4], [5.4, 6.6, 14, 14.4]];
    for (const [x0, x1, z0, z1] of tramos) {
      const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
      plano([cx, H, cz], '-90 0 0', x1 - x0, z1 - z0, 'suelo-madera');
      plano([cx, TECHO, cz], '90 0 0', x1 - x0, z1 - z0);
      SUPERFICIES.push({ x0, x1, z0, z1, y: H, macizo: false });
    }
    // muro exterior, mirando hacia dentro del pasillo
    const m = (TECHO + H) / 2, alto = TECHO - H;
    plano([6, m, 16], '0 180 0', 16, alto, 'pared-piedra');
    plano([6, m, 2], '0 0 0', 16, alto, 'pared-piedra');
    plano([-2, m, 9], '0 90 0', 14, alto, 'pared-piedra');
    plano([14, m, 9], '0 -90 0', 14, alto, 'pared-piedra');
    for (const [x, z] of [[6, 15.2], [-1.2, 9], [13.2, 9], [6, 2.8]]) {
      const l = document.createElement('a-entity');
      l.setAttribute('light', 'type: point; intensity: 0.9; distance: 9; color: #fff4dc');
      l.setAttribute('position', `${x} ${TECHO - 0.4} ${z}`);
      this.el.appendChild(l);
    }
  }
});
