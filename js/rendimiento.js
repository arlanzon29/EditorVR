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

const NO_FUNDIR = '[barca], [agua], [camino], [claro], [ciervo], [peces], [portal], [puerta-portal], [salida], [pozo], [pinos], [cartel-madera], [puerta], [agarrable], [antorcha], [criado], [guardia], [hoguera], [lampara-rueda], [barrera], [gltf-model], [text], .clicable, .cartel';

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
    // ocultas ya no se dibujan: su copia en la gráfica sobra (si se comparte con otra malla visible, se vuelve a subir)
    for (const o of piezas) { o.visible = false; o.geometry.dispose(); }
  }
  return { antes, despues };
}

// Libera de la gráfica las geometrías, materiales y texturas de una estancia que se va a quitar
// (three.js no lo hace solo). Si algo liberado se vuelve a usar, como las texturas de piedra que se
// guardan para otras zonas, three.js lo sube de nuevo sin más.
function liberarEstancia(el) {
  luzTemblando = luzTemblando.filter(t => { let dentro = false; el.object3D.traverse(o => { if (o.material === t.m) dentro = true; }); return !dentro; });
  el.object3D.traverse(o => {
    if (!o.isMesh) return;
    o.geometry.dispose();
    for (const m of [].concat(o.material)) { if (m.map) m.map.dispose(); if (m.lightMap) m.lightMap.dispose(); m.dispose(); }
  });
}

// Luz horneada en Blender (ver "Horneado" en README.md). Las estancias se cargan igual, con sus
// componentes y sus obstáculos; solo cambia lo que se dibuja: las piezas fijas se ocultan y en su lugar
// va un modelo con todas ellas (modelos/horneado/<sala>.glb) y su imagen de luz (<sala>-luz.jpg).
// Lo que se mueve (NO_FUNDIR), lo transparente y lo enorme de fuera (hierba, colinas) sigue como estaba.
const SALAS_HORNEADAS = ['sala1', 'pasillo', 'sala2', 'pasillo2', 'sala3', 'comedor', 'patio', 'exterior', 'bosque', 'lago', 'poblado', 'montana', 'acantilado', 'abadia', 'puerto', 'capilla', 'cueva', 'mazmorras'];
// el suelo de cada zona de campo va aparte, en su propia imagen de luz: { estancia: su suelo }
const SUELOS_HORNEADOS = { exterior: 'campo', bosque: 'campo-bosque', lago: 'campo-lago', poblado: 'campo-poblado', montana: 'campo-montana', acantilado: 'campo-acantilado', abadia: 'campo-abadia', puerto: 'campo-puerto', cueva: 'campo-cueva' };
const ESCALA_LUZ = 2;   // la imagen guarda la luz dividida por esto: lo que pasa de 1 también cabe
// Donde hay fuego, la luz horneada tiembla un poco, como las llamas: basta cambiar un número del material,
// no cuesta nada. Va por estancia entera, así que tiene que ser muy suave.
const SALAS_CON_FUEGO = ['sala1', 'sala2', 'pasillo2', 'sala3', 'comedor', 'capilla', 'mazmorras', 'cueva', 'campo-cueva', 'abadia'];
const TEMBLOR_LUZ = 0.04;
let luzTemblando = [];
const texturasHorneadas = new Map();   // los modelos repiten piedra y madera: una sola copia de cada una

function esHorneable(o, raiz, sala) {
  if (!o.isMesh || o.isInstancedMesh || Array.isArray(o.material) || o.material.visible === false || o.material.transparent) return false;
  if (!o.geometry.attributes.position) return false;
  for (let p = o; p && p !== raiz; p = p.parent) if (!p.visible) return false;
  let e = o; while (e && !e.el) e = e.parent;
  const ent = e && e.el;
  if (!ent) return false;
  if (sala === 'campo') return ent.matches('[suelo-hierba]');
  if (sala.startsWith('campo-')) return ent.matches('[terreno]');
  if (MODELOS_HORNEADOS.test(ent.getAttribute('gltf-model'))) return true;
  return !ent.closest(NO_FUNDIR) && !ent.closest('[suelo-hierba], [terreno], [camino], [claro], [arbol], [montes]') && !(parseFloat(ent.getAttribute('radius')) > 5);
}

// Los modelos de Blender que no se mueven también van horneados: su original no se llega a ver.
const MODELOS_HORNEADOS = /marco-|caballero/;
document.addEventListener('model-loaded', e => {
  if (luzHorneada && MODELOS_HORNEADOS.test(e.target.getAttribute('gltf-model'))) e.detail.model.visible = false;
});

// Pone el modelo horneado de una estancia y oculta lo que sustituye. Si no se puede cargar, se queda
// como estaba (y luego se funde como siempre).
function hornearEstancia(el, sala) {
  return new Promise(listo => {
    const ent = document.createElement('a-entity');
    // (configurada ya: si un material se dibujara antes de que llegue la imagen, se quedaría con
    // las coordenadas equivocadas y saldría negro)
    const luz = new THREE.TextureLoader().load(`modelos/horneado/${sala}-luz.jpg`);
    luz.colorSpace = THREE.SRGBColorSpace; luz.flipY = false; luz.channel = 1;
    ent.addEventListener('model-error', () => { ent.remove(); luz.dispose(); console.error('Sin horneado: ' + sala); listo(); });
    ent.addEventListener('model-loaded', e => {
      el.object3D.traverse(o => {
        if (e.detail.model === o || !esHorneable(o, el.object3D, sala)) return;
        for (let p = o; p; p = p.parent) if (p === e.detail.model) return;
        o.visible = false; o.geometry.dispose();
      });
      e.detail.model.traverse(o => {
        if (!o.isMesh) return;
        const v = o.material, llama = /^Llama/.test(v.name);   // las llamas brillan por sí solas: sin luz
        let mapa = v.map;
        if (mapa) {
          if (texturasHorneadas.has(mapa.name)) { mapa.dispose(); mapa = texturasHorneadas.get(mapa.name); }
          else { mapa.anisotropy = 8; texturasHorneadas.set(mapa.name, mapa); }
        }
        // sin cálculo de luces, lo más barato que hay: las 6 luces solo afectan a lo que se mueve
        o.material = new THREE.MeshBasicMaterial({ map: mapa, vertexColors: true, lightMap: llama ? null : luz, lightMapIntensity: Math.PI * ESCALA_LUZ });
        if (!llama && SALAS_CON_FUEGO.includes(sala)) luzTemblando.push({ m: o.material, fase: luzTemblando.length * 1.9 });
        v.dispose();
      });
      if (Object.values(SUELOS_HORNEADOS).includes(sala)) luzEnCaminos(el, e.detail.model, luz);
      listo();
    });
    ent.setAttribute('gltf-model', `url(modelos/horneado/${sala}.glb)`);
    el.appendChild(ent);
  });
}

// Caminos y claros son transparentes y van sobre la hierba: usan la misma imagen de luz que ella, para
// que las sombras sigan por encima. La luz de la hierba se despliega desde arriba (hornear-castillo.py),
// así que de x, z a la imagen hay una regla fija, que sale de tres de sus vértices.
function luzEnCaminos(el, modelo, luz) {
  let hierba = null;
  modelo.traverse(o => { if (o.isMesh) hierba = o.geometry; });
  const P = hierba.attributes.position, U = hierba.attributes.uv1, I = hierba.index;
  const [a, b, c] = [0, 1, 2].map(k => I ? I.getX(k) : k);
  const dx1 = P.getX(b) - P.getX(a), dz1 = P.getZ(b) - P.getZ(a), dx2 = P.getX(c) - P.getX(a), dz2 = P.getZ(c) - P.getZ(a);
  const det = dx1 * dz2 - dx2 * dz1;
  const aImagen = (x, z, A, B, C) => {
    const s = ((x - P.getX(a)) * dz2 - dx2 * (z - P.getZ(a))) / det, t = (dx1 * (z - P.getZ(a)) - (x - P.getX(a)) * dz1) / det;
    return A + s * (B - A) + t * (C - A);
  };
  const w = new THREE.Vector3();
  el.object3D.updateMatrixWorld(true);
  for (const ent of el.querySelectorAll('[camino], [claro]')) {
    const malla = ent.getObject3D('mesh'), Q = malla.geometry.attributes.position, uv1 = new Float32Array(Q.count * 2);
    for (let i = 0; i < Q.count; i++) {
      w.fromBufferAttribute(Q, i).applyMatrix4(malla.matrixWorld);
      uv1[i * 2] = aImagen(w.x, w.z, U.getX(a), U.getX(b), U.getX(c));
      uv1[i * 2 + 1] = aImagen(w.x, w.z, U.getY(a), U.getY(b), U.getY(c));
    }
    malla.geometry.setAttribute('uv1', new THREE.BufferAttribute(uv1, 2));
    const v = malla.material;
    malla.material = new THREE.MeshBasicMaterial({ map: v.map, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2, lightMap: luz, lightMapIntensity: Math.PI * ESCALA_LUZ });
    v.dispose();
  }
}

// Saca la zona cargada para hornearla en Blender: por estancia, las piezas horneables juntas por
// material (geometría en coordenadas del mundo), y las texturas y las luces. La escena tiene que estar
// cargada con ?sinhornear&sinfundir. En la consola, con herramientas/recibir-estancia.js en marcha:
// fetch('http://localhost:8099/castillo', { method: 'POST', body: JSON.stringify(exportarZona()) })   (o /bosque)
function exportarZona() {
  const escena = document.querySelector('a-scene').object3D;
  escena.updateMatrixWorld(true);
  const imagenes = {}, salas = {}, luces = [];
  const v = new THREE.Vector3(), t = new THREE.Vector3();
  const estancia = {};
  for (const [e, s] of Object.entries(SUELOS_HORNEADOS)) estancia[s] = e;
  for (const sala of [...SALAS_HORNEADAS, ...Object.values(SUELOS_HORNEADOS)]) {
    const el = [...document.querySelectorAll('[incluir]')].find(e => e.getAttribute('incluir') === `salas/${estancia[sala] || sala}.html`);
    if (!el) continue;
    const grupos = new Map();
    el.object3D.traverse(o => {
      if (!esHorneable(o, el.object3D, sala)) return;
      const m = o.material, clave = [m.map ? m.map.source.uuid : '-', m.emissive ? m.emissive.getHex() : 0].join('|');
      if (!grupos.has(clave)) grupos.set(clave, { pos: [], nor: [], uv: [], col: [], imagen: m.map ? m.map.source.uuid : null, emisivo: !!(m.emissive && m.emissive.getHex()) });
      const d = grupos.get(clave), g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry;
      const P = g.attributes.position, NN = g.attributes.normal, UV = g.attributes.uv, n = P.count;
      const N = new THREE.Matrix3().getNormalMatrix(o.matrixWorld), espejo = o.matrixWorld.determinant() < 0;
      if (m.map) { m.map.updateMatrix(); imagenes[m.map.source.uuid] = imagenes[m.map.source.uuid] || m.map.image.toDataURL('image/png'); }
      // de doble cara: dos veces, una por cada lado (cada cara recibe su propia luz), separadas 1 mm
      for (const lado of m.side === THREE.DoubleSide ? [1, -1] : [1]) for (let i = 0; i < n; i++) {
        const j = (espejo !== (lado < 0)) ? (i % 3 === 1 ? i + 1 : i % 3 === 2 ? i - 1 : i) : i;
        t.fromBufferAttribute(NN, j).applyMatrix3(N).normalize().multiplyScalar(lado);
        v.fromBufferAttribute(P, j).applyMatrix4(o.matrixWorld);
        if (m.side === THREE.DoubleSide) v.addScaledVector(t, 0.001);
        d.pos.push(v.x, v.y, v.z); d.nor.push(t.x, t.y, t.z);
        t.set(UV ? UV.getX(j) : 0, UV ? UV.getY(j) : 0, 1); if (m.map) t.applyMatrix3(m.map.matrix); d.uv.push(t.x, t.y);
        const C = g.attributes.color;   // (el terreno pintado)
        d.col.push(m.color.r * (C ? C.getX(j) : 1), m.color.g * (C ? C.getY(j) : 1), m.color.b * (C ? C.getZ(j) : 1));
      }
    });
    salas[sala] = [...grupos.values()];
  }
  escena.traverse(o => {
    if (!o.isPointLight || o.userData.viva) return;
    o.getWorldPosition(v);
    luces.push({ pos: v.toArray(), fuerza: o.intensity, alcance: o.distance, color: o.color.toArray() });
  });
  // los árboles no se hornean, pero dan sombra
  const arboles = [], M = new THREE.Matrix4(), sistema = document.querySelector('a-scene').systems.arbol;
  if (sistema.piezas) sistema.colocar();   // (los coloca su tick, que puede no haber pasado todavía)
  escena.traverse(o => {
    if (!o.isInstancedMesh || !o.visible) return;
    const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry, P = g.attributes.position;
    for (let k = 0; k < o.count; k++) {
      o.getMatrixAt(k, M);
      for (let i = 0; i < P.count; i++) { v.fromBufferAttribute(P, i).applyMatrix4(M); arboles.push(v.x, v.y, v.z); }
    }
  });
  return { zona: zonaCargada.nombre, horneado: { ...CIELOS[zonaCargada.cielo].horneado, sol: CIELOS[zonaCargada.cielo].sol }, imagenes, salas, luces, arboles };
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
    const s = t / 1000;
    for (const l of luzTemblando) {
      const v = 0.5 * Math.sin(s * 7.3 + l.fase) + 0.3 * Math.sin(s * 13.1 + 1.7 + l.fase) + 0.2 * Math.sin(s * 23.7 + 4.1);
      l.m.lightMapIntensity = Math.PI * ESCALA_LUZ * (1 + TEMBLOR_LUZ * v);
    }
    // cada medio segundo: buscar las luces que hay (las salas cargan después y se descargan al
    // cambiar de zona) y elegir las más cercanas
    if (t - this.cuando > 500) {
      this.cuando = t;
      this.fuentes = [];
      this.el.object3D.traverse(o => {
        if (o.isPointLight && !o.userData.viva) this.fuentes.push(o);
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

// Buscar caras que parpadean (z-fighting): triángulos de objetos distintos en el mismo plano,
// mirando hacia el mismo lado y solapados. Para lanzarlo a mano en la consola del navegador, con la
// escena cargada con ?sinfundir (fundidas, las piezas de una estancia son un solo objeto y no se
// comparan entre sí). Devuelve las parejas, con un punto de cada una.
function buscarSolapes() {
  const escena = document.querySelector('a-scene').object3D;
  escena.updateMatrixWorld(true);
  const tris = [], a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  const nombre = o => { let e = o; while (e && !e.el) e = e.parent; const el = e && e.el; return el ? el.tagName.toLowerCase() + ' ' + (el.closest('[incluir]')?.getAttribute('incluir') || '') : '?'; };
  escena.traverse(o => {
    if (!o.isMesh) return;
    for (let p = o; p; p = p.parent) if (p.visible === false) return;
    const mats = [].concat(o.material);
    if (mats.every(m => m.visible === false || (m.transparent && m.opacity < 0.3))) return;
    const pos = o.geometry.attributes.position, idx = o.geometry.index; if (!pos) return;
    const dobles = mats.some(m => m.side === THREE.DoubleSide), quien = nombre(o), n = idx ? idx.count : pos.count;
    for (let i = 0; i < n; i += 3) {
      a.fromBufferAttribute(pos, idx ? idx.getX(i) : i).applyMatrix4(o.matrixWorld);
      b.fromBufferAttribute(pos, idx ? idx.getX(i + 1) : i + 1).applyMatrix4(o.matrixWorld);
      c.fromBufferAttribute(pos, idx ? idx.getX(i + 2) : i + 2).applyMatrix4(o.matrixWorld);
      const nr = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a));
      if (nr.length() < 2e-4) continue;
      nr.normalize();
      for (const nn of dobles ? [nr, nr.clone().negate()] : [nr]) tris.push({ o, quien, n: nn, d: nn.dot(a), pts: [a.clone(), b.clone(), c.clone()] });
    }
  });
  const cubos = new Map();
  for (const t of tris) { const k = [Math.round(t.n.x * 50), Math.round(t.n.y * 50), Math.round(t.n.z * 50), Math.round(t.d * 200)].join(','); (cubos.get(k) || cubos.set(k, []).get(k)).push(t); }
  const dentro = (p, t) => { const [A, B, C] = t.pts, v0 = C.clone().sub(A), v1 = B.clone().sub(A), v2 = p.clone().sub(A); const d00 = v0.dot(v0), d01 = v0.dot(v1), d02 = v0.dot(v2), d11 = v1.dot(v1), d12 = v1.dot(v2), inv = 1 / (d00 * d11 - d01 * d01), u = (d11 * d02 - d01 * d12) * inv, w = (d00 * d12 - d01 * d02) * inv; return u > 0.02 && w > 0.02 && u + w < 0.98; };
  const centro = t => t.pts[0].clone().add(t.pts[1]).add(t.pts[2]).divideScalar(3);
  const hallados = new Map();
  for (const lista of cubos.values()) for (let i = 0; i < lista.length; i++) for (let j = i + 1; j < lista.length; j++) {
    const t1 = lista[i], t2 = lista[j];
    if (t1.o === t2.o) continue;
    if (!(dentro(centro(t1), t2) || dentro(centro(t2), t1) || t1.pts.some(p => dentro(p, t2)) || t2.pts.some(p => dentro(p, t1)))) continue;
    const clave = [t1.quien, t2.quien].sort().join('  <->  ');
    if (!hallados.has(clave)) hallados.set(clave, centro(t1).toArray().map(v => +v.toFixed(2)));
  }
  return [...hallados];
}

