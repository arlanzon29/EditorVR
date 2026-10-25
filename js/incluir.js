// Editor VR: carga de las estancias.
// Cada estancia está en su propio archivo (salas/*.html) y se mete en la escena con
// <a-entity incluir="salas/sala1.html">. El trozo se descarga al arrancar y se añade dentro de
// esa entidad (que va en el origen: las coordenadas de las salas son las del mundo).

AFRAME.registerComponent('incluir', {
  schema: { type: 'string' },
  init() {
    fetch(this.data)
      .then(r => { if (!r.ok) throw new Error(r.status + ' ' + r.statusText); return r.text(); })
      // el servidor añade a cada .html el script de recarga automática: aquí sobra
      .then(html => this.el.insertAdjacentHTML('beforeend', html.replace(/<script[\s\S]*?<\/script>/g, '')))
      .catch(e => console.error('No se pudo cargar ' + this.data + ':', e));
  }
});
