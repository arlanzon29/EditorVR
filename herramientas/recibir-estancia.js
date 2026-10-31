// Editor VR: recibe lo que manda exportarEstancia (js/rendimiento.js) y lo guarda en un archivo.
// Uso: node herramientas/recibir-estancia.js <carpeta>   (POST a http://localhost:8099/<nombre>)
const http = require('http'), fs = require('fs'), path = require('path');
const carpeta = process.argv[2];

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method !== 'POST') return res.end();
  const partes = [];
  req.on('data', d => partes.push(d));
  req.on('end', () => {
    const archivo = path.join(carpeta, path.basename(req.url) + '.json');
    fs.writeFileSync(archivo, Buffer.concat(partes));
    console.log('Guardado', archivo);
    res.end('ok');
  });
}).listen(8099, '127.0.0.1', () => console.log('Esperando en el puerto 8099'));
