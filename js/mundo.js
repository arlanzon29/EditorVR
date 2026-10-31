// Editor VR: el mundo. Qué zonas hay, dónde están, cómo es su terreno, qué hora es en cada una y por
// dónde se pasa de una a otra. Solo hay una cargada a la vez (js/zonas.js); todas usan las coordenadas
// del mundo. Para añadir una: su entrada en MUNDO, sus pasos en PASOS y su archivo en salas/.

const rampa = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };

// sitio: dónde se considera que estás en esa zona (se reparte el plano entero, sin huecos).
// andar: por dónde se puede andar, 2 m más corto que el sitio en cada lado que da a otra zona: entre
// dos zonas solo se pasa por los PASOS. agua: por debajo de esa altura no se puede pisar.
const MUNDO = {
  castillo: {
    titulo: 'El Castillo', salas: ['sala1', 'pasillo', 'sala2', 'pasillo2', 'sala3', 'comedor', 'comedor-vivos', 'patio', 'exterior'],
    sitio: { x0: -80, x1: 90, z0: -45, z1: 100 },   // (por dónde se anda: FUERA y las salas, en movimiento.js)
    cielo: 'atardecer', niebla: '#c9a08c', fondo: '#d98f6a', ambiente: { intensity: 1.3, color: '#c9a8b0' }, sol: { intensity: 2, color: '#ffab66' },
  },
  bosque: {
    titulo: 'El Bosque', salas: ['bosque'],
    sitio: { x0: -80, x1: 90, z0: -200, z1: -45 }, andar: { x0: -78, x1: 88, z0: -198, z1: -46 },
    cielo: 'mediodia', niebla: '#c9cdc8', fondo: '#a9cfe8', ambiente: { intensity: 2.2, color: '#ffffff' }, sol: { intensity: 1.6, color: '#fff2dc' },
    altura(x, z) {
      if (z >= -46) return 0;
      const h = 3.2 * Math.sin(x * 0.045 + 1) + 2.4 * Math.sin(z * 0.06 + 0.5) + Math.sin((x + z) * 0.11) + 0.35 * Math.sin((x - z) * 0.23) + 4;
      return h * (1 - rampa(-100, -46, z)) * rampa(9, 40, Math.hypot(x - 6, z + 84));
    },
  },
  lago: {
    titulo: 'El Lago', salas: ['lago'],
    sitio: { x0: -80, x1: 90, z0: -400, z1: -200 }, andar: { x0: -78, x1: 88, z0: -392, z1: -202 }, agua: -0.5,
    cielo: 'mediodia', niebla: '#c9d5dc', fondo: '#a9cfe8', ambiente: { intensity: 2.2, color: '#ffffff' }, sol: { intensity: 1.6, color: '#fff2dc' },
    altura(x, z) {
      // el lago es una elipse: playa suave y un fondo a 3 m; la isla sube en medio
      const d = Math.hypot((x - 5) / 75, (z + 300) / 70);
      let h = d < 1 ? -3 + 3.2 * rampa(0.8, 1, d)
        : 0.2 + (2.6 * Math.sin(x * 0.05 + 2) + 2 * Math.sin(z * 0.07) + 3) * rampa(1.05, 1.5, d);
      h = Math.max(h, -3 + 4.5 * rampa(27, 11, Math.hypot(x - 43, z + 300)));
      return h;
    },
  },
  poblado: {
    titulo: 'El Poblado', salas: ['poblado'],
    sitio: { x0: 90, x1: 230, z0: -200, z1: -40 }, andar: { x0: 92, x1: 228, z0: -190, z1: -50 },
    cielo: 'mediodia', niebla: '#d3cfc4', fondo: '#a9cfe8', ambiente: { intensity: 2.2, color: '#ffffff' }, sol: { intensity: 1.6, color: '#fff2dc' },
    altura(x, z) {
      // llano en el pueblo, y lomas alrededor
      return (1.8 * Math.sin(x * 0.07) + 1.4 * Math.sin(z * 0.09 + 1) + 2) * rampa(48, 72, Math.hypot(x - 160, z + 120));
    },
  },
  montana: {
    titulo: 'La Montaña', salas: ['montana'],
    sitio: { x0: -300, x1: -80, z0: -230, z1: 0 }, andar: { x0: -282, x1: -82, z0: -228, z1: -10 },
    cielo: 'mediodia', niebla: '#dfe6ea', fondo: '#b4d4ec', ambiente: { intensity: 2.2, color: '#f2f6ff' }, sol: { intensity: 1.7, color: '#fff6e8' },
    altura(x, z) {
      // una cumbre de 45 m con crestas; el camino sube por su cara este
      const d = Math.hypot(x + 190, z + 120), a = Math.atan2(z + 120, x + 190);
      const cumbre = 45 * Math.exp(-(d * d) / (2 * 42 * 42)) * (1 + 0.14 * Math.sin(a * 5 + 1) + 0.08 * Math.sin(a * 9));
      return cumbre + 3 * Math.sin(x * 0.06) * Math.sin(z * 0.05) + 3;
    },
    color(x, y, z) {
      const ruido = 2.5 * Math.sin(x * 0.31) * Math.cos(z * 0.27);
      return y + ruido > 39 ? '#a9acb2' : y + ruido > 22 ? '#6f6c66' : y + ruido > 14 ? '#6c6f4c' : '#566b34';
    },
  },
  acantilado: {
    titulo: 'El Acantilado', salas: ['acantilado'],
    sitio: { x0: 230, x1: 900, z0: -200, z1: -40 }, andar: { x0: 232, x1: 327, z0: -190, z1: -50 }, sinBordeX1: true,
    cielo: 'atardecerMar', niebla: '#d4a48c', fondo: '#d98f6a', ambiente: { intensity: 1.3, color: '#c9a8b0' }, sol: { intensity: 2, color: '#ffab66' },
    altura(x, z) {
      // sube hasta un llano a 20 m y se corta en vertical sobre el mar
      const borde = 337 + 5 * Math.sin(z * 0.06) + 2.5 * Math.sin(z * 0.17 + 1);
      const llano = 20 * rampa(240, 305, x) + 0.8 * Math.sin(z * 0.11) * rampa(240, 280, x);
      return llano - (llano + 6) * rampa(borde, borde + 7, x);
    },
    color(x, y, z) {
      const borde = 337 + 5 * Math.sin(z * 0.06) + 2.5 * Math.sin(z * 0.17 + 1);
      return x > borde - 1 ? (y < 0.6 ? '#4f4a44' : '#7a7267') : y > 17 && Math.sin(x * 0.4) * Math.sin(z * 0.5) > 0.6 ? '#7b7d4a' : '#5b6d38';
    },
  },
  abadia: {
    titulo: 'La Abadía en Ruinas', salas: ['abadia'],
    sitio: { x0: -300, x1: -80, z0: -440, z1: -230 }, andar: { x0: -282, x1: -82, z0: -430, z1: -232 },
    cielo: 'noche', niebla: '#1c2436', fondo: '#111a30', ambiente: { intensity: 0.7, color: '#7f94c8' }, sol: { intensity: 0.8, color: '#a9bce8' },
    altura(x, z) {
      return (1.6 * Math.sin(x * 0.08) + 1.3 * Math.sin(z * 0.06 + 2) + 1.6) * rampa(42, 66, Math.hypot(x + 180, z + 330));
    },
  },
};
// El nombre de cada zona, dentro de ella
for (const [nombre, zona] of Object.entries(MUNDO)) zona.nombre = nombre;

// Por dónde se pasa de una zona a otra: un hueco de 2,8 m en la valla, con niebla (RADIO_NIEBLA, zonas.js)
const PASOS = [
  { a: 'castillo', b: 'bosque', x: 6, z: -45, andar: { x0: 5.05, x1: 6.95, z0: -47, z1: -44 } },
  { a: 'bosque', b: 'lago', x: 6, z: -200, andar: { x0: 5.05, x1: 6.95, z0: -203, z1: -197 } },
  { a: 'bosque', b: 'poblado', x: 90, z: -120, andar: { x0: 87, x1: 93, z0: -120.95, z1: -119.05 } },
  { a: 'bosque', b: 'montana', x: -80, z: -120, andar: { x0: -83, x1: -77, z0: -120.95, z1: -119.05 } },
  { a: 'poblado', b: 'acantilado', x: 230, z: -120, andar: { x0: 227, x1: 233, z0: -120.95, z1: -119.05 } },
  { a: 'montana', b: 'abadia', x: -180, z: -230, andar: { x0: -180.95, x1: -179.05, z0: -233, z1: -227 } },
];

// Zona en la que está un punto. Con margen, solo cuenta si se ha entrado ya un poco: así, justo en
// el límite, el cambio no se dispara una y otra vez.
function zonaEn(x, z, margen = 0) {
  for (const zona of Object.values(MUNDO)) {
    const s = zona.sitio;
    if (x >= s.x0 + margen && x <= s.x1 - margen && z >= s.z0 + margen && z <= s.z1 - margen) return zona;
  }
  return null;
}

// Altura del terreno en una zona: la suya, que más allá de sus límites sube, para que el horizonte
// no sea una raya; y plana alrededor de sus pasos, para que empalme con la zona de al lado.
function alturaDe(zona, x, z) {
  if (!zona.altura) return 0;
  const a = zona.andar;
  let h = zona.altura(x, z) + Math.max(0, a.x0 - x, zona.sinBordeX1 ? 0 : x - a.x1, a.z0 - z, z - a.z1) * 0.3;
  for (const p of PASOS) if (p.a === zona.nombre || p.b === zona.nombre) h *= rampa(4, 34, Math.hypot(x - p.x, z - p.z));
  return h;
}
// La de la zona que hay cargada (la usan el andar, los árboles, el camino, la valla…)
let zonaCargada = MUNDO.castillo;
function alturaTerreno(x, z) { return alturaDe(zonaCargada, x, z); }
