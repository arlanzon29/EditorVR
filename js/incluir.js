// Editor VR: carga de las estancias.
// Cada estancia está en su propio archivo (salas/*.html) y se mete en la escena con
// <a-entity incluir="salas/sala1.html"> (las crea zonas.js). El trozo se descarga y se añade dentro de
// esa entidad (que va en el origen: las coordenadas de las salas son las del mundo). Cuando todo
// lo de la estancia ha cargado, se funde lo fijo en pocas mallas (fundirEstancia, en rendimiento.js).

AFRAME.registerComponent('incluir', {
  schema: { type: 'string' },
  init() {
    fetch(this.data)
      .then(r => { if (!r.ok) throw new Error(r.status + ' ' + r.statusText); return r.text(); })
      // el servidor añade a cada .html el script de recarga automática: aquí sobra
      .then(html => { this.el.insertAdjacentHTML('beforeend', html.replace(/<script[\s\S]*?<\/script>/g, '')); return this.esperarCarga(); })
      .then(() => {
        // con ?sinfundir en la dirección no se funde (para buscar solapes y depurar)
        if (location.search.includes('sinfundir')) return;
        const r = fundirEstancia(this.el);
        console.log(`${this.data}: ${r.antes} mallas fijas → ${r.despues}`);
      })
      .catch(e => console.error('No se pudo cargar ' + this.data + ':', e))
      // (también si ha fallado: el cambio de zona no debe quedarse esperando para siempre)
      .then(() => this.el.emit('incluida', null, false));
  },
  // espera a que hayan cargado todas sus entidades, también las que crean otros componentes al
  // iniciarse (la escalera, la biblioteca…): hasta que no quede ninguna por cargar ni aparezcan nuevas
  esperarCarga() {
    return new Promise(listo => {
      let antes = -1;
      const mirar = () => {
        const todas = [...this.el.querySelectorAll('*')].filter(e => e.isEntity);
        if (todas.length === antes && todas.every(e => e.hasLoaded)) return listo();
        antes = todas.length;
        setTimeout(mirar, 300);
      };
      setTimeout(mirar, 300);
    });
  }
});
