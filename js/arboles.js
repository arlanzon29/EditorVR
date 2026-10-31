// Editor VR: árboles. Tres modelos (modelos/arboles.glb), cada uno en dos versiones: de cerca, con
// ramas, raíces y mechones de hojas; de lejos, con el tronco simple y pocos bultos. Se dibujan en
// bloque (InstancedMesh): cientos de árboles cuestan una llamada de dibujo por pieza, no por árbol.
// Cada árbol usa la versión que le toca según lo lejos que esté de los ojos.

const URL_ARBOLES = 'modelos/arboles.glb';
const ARBOLES_MAX = 300;       // de cada modelo, en cada versión
const ALTO_MODELOS = [5.43, 7.24, 6.14];   // lo que mide cada modelo en el .glb (arbol: alto escala a esto)
// se pasa a la versión de cerca a menos de DIST_CERCA y a la de lejos a más de DIST_LEJOS: con la
// diferencia, un árbol justo en el límite no cambia una y otra vez
const DIST_CERCA = 18, DIST_LEJOS = 22;
const ARBOLES_CADA_MS = 300;

AFRAME.registerSystem('arbol', {
  init() {
    this.arboles = [];
    this.cambiado = false;
    this.cuando = 0;
    this.ojo = new THREE.Vector3();
    this.piezas = null;   // piezas[modelo].Cerca / .Lejos = lista de InstancedMesh (tronco y copa)
    this.listo = new Promise(hecho => {
      new THREE.GLTFLoader().load(URL_ARBOLES, gltf => { this.crearPiezas(gltf); hecho(); },
        undefined, e => { console.error('No se pudieron cargar los árboles:', e); hecho(); });
    });
  },
  crearPiezas(gltf) {
    this.piezas = ALTO_MODELOS.map(() => ({ Cerca: [], Lejos: [] }));
    gltf.scene.updateMatrixWorld(true);
    gltf.scene.traverse(o => {
      const m = o.isMesh && o.name.match(/^Arbol(\d)_(Cerca|Lejos)_/);
      if (!m) return;
      o.material.side = THREE.FrontSide;
      const malla = new THREE.InstancedMesh(o.geometry, o.material, ARBOLES_MAX);
      malla.count = 0;
      malla.visible = false;
      malla.frustumCulled = false;   // los árboles están repartidos: se dibujan todos los de la lista
      // color por árbol desde el principio: añadirlo después recompilaría el material
      malla.setColorAt(0, new THREE.Color('#ffffff'));
      this.sceneEl.object3D.add(malla);
      this.piezas[m[1] - 1][m[2]].push(malla);
    });
    this.cambiado = true;
  },
  agregar(a) { this.arboles.push(a); this.cambiado = true; },
  quitar(a) {
    const i = this.arboles.indexOf(a);
    if (i >= 0) this.arboles.splice(i, 1);
    this.cambiado = true;
  },
  tick(t) {
    if (!this.piezas || !this.el.camera || t - this.cuando < ARBOLES_CADA_MS) return;
    this.cuando = t;
    this.el.camera.getWorldPosition(this.ojo);
    for (const a of this.arboles) {
      const d = Math.hypot(a.x - this.ojo.x, a.z - this.ojo.z);
      const cerca = a.cerca ? d < DIST_LEJOS : d < DIST_CERCA;
      if (cerca !== a.cerca) { a.cerca = cerca; this.cambiado = true; }
    }
    if (this.cambiado) this.colocar();
  },
  // reparte los árboles entre las piezas según su modelo y su versión
  colocar() {
    this.cambiado = false;
    const m = new THREE.Matrix4(), p = new THREE.Vector3(), g = new THREE.Quaternion(), e = new THREE.Vector3();
    const arriba = new THREE.Vector3(0, 1, 0);
    const cuenta = this.piezas.map(() => ({ Cerca: 0, Lejos: 0 }));
    for (const a of this.arboles) {
      const version = a.cerca ? 'Cerca' : 'Lejos', i = cuenta[a.modelo][version]++;
      if (i >= ARBOLES_MAX) continue;
      m.compose(p.set(a.x, 0, a.z), g.setFromAxisAngle(arriba, a.giro), e.setScalar(a.escala));
      for (const malla of this.piezas[a.modelo][version]) { malla.setMatrixAt(i, m); malla.setColorAt(i, a.color); }
    }
    this.piezas.forEach((pieza, k) => {
      for (const version of ['Cerca', 'Lejos']) for (const malla of pieza[version]) {
        malla.count = Math.min(cuenta[k][version], ARBOLES_MAX);
        malla.visible = malla.count > 0;
        malla.instanceMatrix.needsUpdate = true;
        malla.instanceColor.needsUpdate = true;
      }
    });
  }
});

// Un árbol: "semilla" elige el modelo, el giro y un poco el tono (siempre los mismos para la misma
// semilla); "alto" en metros. El tronco es macizo.
AFRAME.registerComponent('arbol', {
  schema: { alto: { default: 6 }, semilla: { default: 1 } },
  init() {
    const { alto, semilla } = this.data;
    let s = semilla * 9301 + 49297;
    const azar = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    azar();
    const p = this.el.object3D.position, modelo = semilla % ALTO_MODELOS.length;
    const claro = 0.88 + azar() * 0.24;
    this.datos = {
      x: p.x, z: p.z, modelo, cerca: null,
      escala: alto / ALTO_MODELOS[modelo],
      giro: azar() * Math.PI * 2,
      color: new THREE.Color(claro, claro * (0.96 + azar() * 0.06), claro * 0.94),
    };
    this.system.agregar(this.datos);
    const rt = 0.35 * alto / 6;
    SUPERFICIES.push({ x0: p.x - rt, x1: p.x + rt, z0: p.z - rt, z1: p.z + rt, y: alto * 0.45, macizo: true });
  },
  remove() { this.system.quitar(this.datos); }
});
