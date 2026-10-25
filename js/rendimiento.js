// Editor VR: rendimiento en el Quest.
// Cada caja, plano o pieza de A-Frame es una malla, y cada malla a la vista cuesta una llamada de
// dibujo: con más de mil, mirando el castillo desde fuera el Quest bajaba a 25 imágenes por
// segundo. Y cada luz puntual encarece todo lo que se dibuja. Aquí:
//  - fundirEstancia: al cargar una estancia (incluir.js), junta todo lo fijo en unas pocas mallas,
//    una por cada clase de material (el color de cada pieza va en sus vértices y la colocación de
//    la textura, en sus coordenadas). Se ve igual. Lo que se mueve o cambia (puertas, personajes,
//    llamas, la pantalla, carteles, modelos de Blender) y lo que recibe el rayo (.clicable) se queda
//    como está. Las piezas fundidas se ocultan, pero siguen en su sitio (y su HTML, igual).
//  - luces-cercanas: solo 6 luces puntuales, siempre las mismas, que copian a las más cercanas.

const NO_FUNDIR = '[puerta], [agarrable], [antorcha], [criado], [guardia], [hoguera], [lampara-rueda], [gltf-model], [text], .clicable, .cartel';

function fundirEstancia(el) {
  el.object3D.updateMatrixWorld(true);
  const inversa = new THREE.Matrix4().copy(el.object3D.matrixWorld).invert();
  const grupos = new Map();
  el.object3D.traverse(o => {
    if (!o.isMesh) return;
    for (let p = o; p && p !== el.object3D; p = p.parent) if (!p.visible) return;
    let e = o; while (e && !e.el) e = e.parent;
    const ent = e && e.el;
    if (!ent || ent.closest(NO_FUNDIR)) return;
    const m = o.material;
    if (Array.isArray(m) || !(m.isMeshStandardMaterial || m.isMeshBasicMaterial) || m.visible === false) return;
    if (!o.geometry.attributes.position) return;   // (los grupos de las cajas, uno por cara, dan igual con un solo material)
    const clave = [m.type, m.map ? m.map.source.uuid : '-', m.roughness, m.metalness, m.transparent, m.opacity,
      m.side, m.flatShading, m.emissive ? m.emissive.getHexString() + '/' + m.emissiveIntensity : '', m.depthTest, m.depthWrite].join('|');
    (grupos.get(clave) || grupos.set(clave, []).get(clave)).push(o);
  });
  let antes = 0, despues = 0;
  for (const piezas of grupos.values()) {
    antes += piezas.length;
    if (piezas.length < 2) { despues += piezas.length; continue; }
    despues++;
    const partes = piezas.map(o => {
      let g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry;
      if (!g.attributes.normal) { g = g.clone(); g.computeVertexNormals(); }
      const M = new THREE.Matrix4().multiplyMatrices(inversa, o.matrixWorld);
      if (o.material.map) o.material.map.updateMatrix();
      return { g, M, N: new THREE.Matrix3().getNormalMatrix(M), m: o.material };
    });
    const total = partes.reduce((s, p) => s + p.g.attributes.position.count, 0);
    const pos = new Float32Array(total * 3), nor = new Float32Array(total * 3), uv = new Float32Array(total * 2), col = new Float32Array(total * 3);
    const v = new THREE.Vector3(), n = new THREE.Vector3(), t = new THREE.Vector3();
    let k = 0;
    for (const { g, M, N, m } of partes) {
      const P = g.attributes.position, NN = g.attributes.normal, UV = g.attributes.uv, cnt = P.count;
      const espejo = M.determinant() < 0;   // escala negativa: hay que dar la vuelta a los triángulos
      for (let i = 0; i < cnt; i++) {
        const j = espejo ? (i % 3 === 1 ? i + 1 : i % 3 === 2 ? i - 1 : i) : i;
        v.fromBufferAttribute(P, j).applyMatrix4(M); pos.set([v.x, v.y, v.z], k * 3);
        n.fromBufferAttribute(NN, j).applyMatrix3(N).normalize(); nor.set([n.x, n.y, n.z], k * 3);
        if (UV) { t.set(UV.getX(j), UV.getY(j), 1); if (m.map) t.applyMatrix3(m.map.matrix); uv.set([t.x, t.y], k * 2); }
        col.set([m.color.r, m.color.g, m.color.b], k * 3);
        k++;
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.computeBoundingSphere();
    const base = partes[0].m, mat = base.clone();
    mat.vertexColors = true;
    mat.color.set('#ffffff');
    if (base.map) {   // misma imagen, sin repetición ni desplazamiento: ya van en las coordenadas
      mat.map = base.map.clone();
      mat.map.offset.set(0, 0); mat.map.repeat.set(1, 1); mat.map.rotation = 0; mat.map.center.set(0, 0);
      mat.map.needsUpdate = true;
    }
    const fundida = new THREE.Mesh(geo, mat);
    fundida.name = 'fundida';
    el.object3D.add(fundida);
    for (const o of piezas) o.visible = false;
  }
  return { antes, despues };
}

// Luces puntuales: un número fijo de luces (6) que nunca se encienden ni se apagan, y que copian
// cada fotograma a las luces de la escena más cercanas a tus ojos (posición, color, fuerza, alcance;
// así las que tiemblan siguen temblando). Las luces de la escena quedan ocultas: solo sirven de
// modelo. Antes se encendían y apagaban las cercanas, pero cada vez que cambiaba cuántas había el
// navegador recompilaba los materiales y daba un tirón al entrar en las salas.
AFRAME.registerComponent('luces-cercanas', {
  schema: { cuantas: { default: 6 } },
  init() {
    this.cuando = 0; this.p = new THREE.Vector3(); this.ojo = new THREE.Vector3();
    this.fuentes = [];
    this.vivas = [];
    for (let i = 0; i < this.data.cuantas; i++) {
      const l = new THREE.PointLight('#ffffff', 0, 1);
      l.userData.viva = true;
      this.el.object3D.add(l);
      this.vivas.push({ luz: l, de: null });
    }
  },
  tick(t) {
    // cada medio segundo: buscar luces nuevas (las salas cargan después) y elegir las más cercanas
    if (t - this.cuando > 500) {
      this.cuando = t;
      this.el.object3D.traverse(o => {
        if (o.isPointLight && !o.userData.viva && !o.userData.fuente) { o.userData.fuente = true; this.fuentes.push(o); }
      });
      this.el.camera.getWorldPosition(this.ojo);
      // la que más cerca tiene su zona iluminada (distancia menos su alcance) va primero
      const orden = this.fuentes.map(f => ({ f, d: f.getWorldPosition(this.p).distanceTo(this.ojo) - (f.distance || 10) }))
        .sort((a, b) => a.d - b.d).slice(0, this.vivas.length).map(x => x.f);
      this.vivas.forEach((v, i) => { v.de = orden[i] || null; });
    }
    for (const f of this.fuentes) f.visible = false;   // (A-Frame puede volver a mostrarlas)
    for (const v of this.vivas) {
      const f = v.de;
      if (!f) { v.luz.intensity = 0; continue; }
      f.getWorldPosition(v.luz.position);
      v.luz.color.copy(f.color); v.luz.intensity = f.intensity; v.luz.distance = f.distance; v.luz.decay = f.decay;
    }
  }
});

// Junta en una sola malla varias mallas hijas directas de "padre" que comparten material (las
// piezas de un objeto hecho a mano en un componente, como la lámpara de rueda). Quita las
// originales y devuelve la nueva.
function fundirMallas(padre, mallas) {
  if (mallas.length < 2) return mallas[0];
  const partes = mallas.map(o => { o.updateMatrix(); return { g: o.geometry.index ? o.geometry.toNonIndexed() : o.geometry, M: o.matrix.clone() }; });
  const total = partes.reduce((s, p) => s + p.g.attributes.position.count, 0);
  const pos = new Float32Array(total * 3), nor = new Float32Array(total * 3);
  const v = new THREE.Vector3(), n = new THREE.Vector3();
  let k = 0;
  for (const { g, M } of partes) {
    const N = new THREE.Matrix3().getNormalMatrix(M), P = g.attributes.position, NN = g.attributes.normal;
    for (let i = 0; i < P.count; i++, k++) {
      v.fromBufferAttribute(P, i).applyMatrix4(M); pos.set([v.x, v.y, v.z], k * 3);
      n.fromBufferAttribute(NN, i).applyMatrix3(N).normalize(); nor.set([n.x, n.y, n.z], k * 3);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  geo.computeBoundingSphere();
  const malla = new THREE.Mesh(geo, mallas[0].material);
  for (const o of mallas) padre.remove(o);
  padre.add(malla);
  return malla;
}

