// Servidor HTTPS local para probar Editor VR en el Quest por wifi (WebXR exige HTTPS).
// Sirve la carpeta del proyecto en solo lectura y sin caché. Uso: node servidor/servidor.js [puerto]
// La primera vez crea un certificado casero (cert.pem / key.pem, fuera de git) con las IP del PC.
// Si cambia la IP, borra los .pem y vuelve a arrancar.
// Recarga automática: a cada página HTML le añade un script que espera en /__recarga y
// recarga en cuanto se guarda un archivo del proyecto (en VR hay que volver a pulsar VR).
// Pantalla del PC: emisor.html (abierto en el PC) comparte una pantalla o ventana y sube una
// imagen por segundo con POST a /__pantalla.jpg; la pantalla de la pared la pide con GET.
// Ojo: mientras se comparte, cualquiera de la wifi que abra la página puede verla.
// Posición: la escena manda cada segundo (POST /__posicion) dónde está la cabeza y a qué
// punto mira; GET /__posicion la devuelve (así Claude sabe dónde colocar cosas).
// Vista: con el botón A o X la escena manda una foto de lo que se ve (POST /__vista.jpg);
// GET /__vista.jpg devuelve la última, para que Claude la mire.
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const RAIZ = path.resolve(__dirname, '..');
const PUERTO = Number(process.argv[2] || 8443);
// Además, HTTP sin certificado solo para este PC (localhost es contexto seguro): sirve para la
// vista previa del navegador integrado de Claude, que no acepta el certificado casero.
const PUERTO_LOCAL = 8080;
const CERT = path.join(__dirname, 'cert.pem');
const CLAVE = path.join(__dirname, 'key.pem');

const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.gif': 'image/gif', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json', '.bin': 'application/octet-stream',
  '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.mp4': 'video/mp4',
  '.wasm': 'application/wasm', '.txt': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8',
};

function ipsLocales() {
  const ips = [];
  for (const lista of Object.values(os.networkInterfaces()))
    for (const i of lista) if (i.family === 'IPv4' && !i.internal) ips.push(i.address);
  return ips;
}

function crearCertificado() {
  const git = 'C:\\Program Files\\Git\\mingw64\\bin\\openssl.exe';
  const openssl = fs.existsSync(git) ? git : 'openssl';
  const nombres = ['DNS:localhost', 'IP:127.0.0.1', ...ipsLocales().map(ip => 'IP:' + ip)].join(',');
  console.log('Creando certificado para', nombres);
  execFileSync(openssl, ['req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-keyout', CLAVE, '-out', CERT,
    '-days', '825', '-subj', '/CN=macedonia-local', '-addext', 'subjectAltName=' + nombres], { stdio: 'ignore' });
}

if (!fs.existsSync(CERT) || !fs.existsSync(CLAVE)) crearCertificado();

// Espera larga: la petición queda abierta hasta que cambia algo (o 25 s, y el script repite).
// No se usa EventSource porque el service worker del proyecto intentaría guardarlo en caché.
const esperando = new Set();
let aviso = null;
fs.watch(RAIZ, { recursive: true }, (tipo, nombre) => {
  const primera = String(nombre || '').split(/[\\/]/)[0].toLowerCase();
  if (primera === '.git' || primera === 'servidor') return;
  clearTimeout(aviso);   // un guardado dispara varios eventos: se agrupan
  aviso = setTimeout(() => {
    console.log(new Date().toLocaleTimeString(), 'cambio en', nombre, '→ recargando', esperando.size, 'página(s)');
    for (const res of esperando) { res.writeHead(200, { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' }); res.end('cambio'); }
    esperando.clear();
  }, 250);
});

// Última imagen que ha subido emisor.html (deja de valer a los 5 s sin imágenes nuevas).
let foto = null, fotoHora = 0;
const MAX_FOTO = 8 * 1024 * 1024;
let posicion = null;   // último informe de la escena (JSON en texto)
let vista = null;      // última foto de lo que se ve en las gafas

const SCRIPT_RECARGA = `<script>(function espera() {
  fetch('/__recarga', { cache: 'no-store' })
    .then(r => r.status === 200 ? location.reload() : espera())
    .catch(() => setTimeout(espera, 2000));
})();</script>`;

function atender(req, res) {
  let ruta;
  try { ruta = decodeURIComponent(new URL(req.url, 'https://x').pathname); }
  catch { res.writeHead(400); return res.end(); }
  if (ruta === '/__recarga') {
    esperando.add(res);
    const fin = setTimeout(() => { esperando.delete(res); res.writeHead(204); res.end(); }, 25000);
    res.on('close', () => { clearTimeout(fin); esperando.delete(res); });
    return;
  }
  if (ruta === '/__vista.jpg') {
    if (req.method === 'POST') {
      const trozos = [];
      let total = 0;
      req.on('data', d => { total += d.length; if (total > MAX_FOTO) req.destroy(); else trozos.push(d); });
      req.on('end', () => {
        vista = Buffer.concat(trozos);
        console.log(new Date().toLocaleTimeString(), 'foto de las gafas recibida (' + Math.round(vista.length / 1024) + ' KB)');
        res.writeHead(204); res.end();
      });
      return;
    }
    if (!vista) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Cache-Control': 'no-store' });
    return res.end(vista);
  }
  if (ruta === '/__posicion') {   // (tampoco se apunta: llega una por segundo)
    if (req.method === 'POST') {
      let texto = '';
      req.setEncoding('utf8');
      req.on('data', d => { texto += d; if (texto.length > 20000) req.destroy(); });
      req.on('end', () => { posicion = texto; res.writeHead(204); res.end(); });
      return;
    }
    if (!posicion) { res.writeHead(503); return res.end(); }
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    return res.end(posicion);
  }
  if (ruta === '/__pantalla.jpg') {   // (no se apunta en la consola: llega una por segundo)
    if (req.method === 'POST') {
      const trozos = [];
      let total = 0;
      req.on('data', d => { total += d.length; if (total > MAX_FOTO) req.destroy(); else trozos.push(d); });
      req.on('end', () => { foto = Buffer.concat(trozos); fotoHora = Date.now(); res.writeHead(204); res.end(); });
      return;
    }
    if (!foto || Date.now() - fotoHora > 5000) { res.writeHead(503); return res.end(); }
    res.writeHead(200, { 'Content-Type': 'image/jpeg', 'Cache-Control': 'no-store' });
    return res.end(foto);
  }
  let archivo = path.join(RAIZ, ruta);
  // Nada fuera del proyecto, ni .git, ni esta carpeta (tiene la clave privada).
  const primera = path.relative(RAIZ, archivo).split(path.sep)[0].toLowerCase();
  if (archivo !== RAIZ && (!archivo.startsWith(RAIZ + path.sep) || primera === '.git' || primera === 'servidor')) {
    res.writeHead(403); return res.end('Prohibido');
  }
  fs.stat(archivo, (err, st) => {
    if (!err && st.isDirectory()) archivo = path.join(archivo, 'index.html');
    fs.readFile(archivo, (err2, datos) => {
      if (err2) { res.writeHead(404); return res.end('No encontrado'); }
      const ext = path.extname(archivo).toLowerCase();
      if (ext === '.html' && path.basename(archivo) !== 'emisor.html') {   // el emisor no se recarga: cortaría la compartición
        const html = datos.toString('utf8');
        const i = html.lastIndexOf('</body>');
        datos = Buffer.from(i < 0 ? html + SCRIPT_RECARGA : html.slice(0, i) + SCRIPT_RECARGA + html.slice(i));
      }
      res.writeHead(200, {
        'Content-Type': TIPOS[ext] || 'application/octet-stream',
        'Cache-Control': 'no-store',
      });
      res.end(datos);
    });
  });
  console.log(new Date().toLocaleTimeString(), req.method, ruta);
}

http.createServer(atender).listen(PUERTO_LOCAL, '127.0.0.1', () => {
  console.log(`Solo en este PC, sin certificado: http://localhost:${PUERTO_LOCAL}/`);
});
https.createServer({ key: fs.readFileSync(CLAVE), cert: fs.readFileSync(CERT) }, atender).listen(PUERTO, '0.0.0.0', () => {
  console.log('Sirviendo', RAIZ);
  for (const ip of ipsLocales()) console.log(`  https://${ip}:${PUERTO}/`);
});
