// Editor VR: el mundo. Qué zonas hay, dónde están, cómo es su terreno, qué hora es en cada una y por
// dónde se pasa de una a otra. Solo hay una cargada a la vez (js/zonas.js); todas usan las coordenadas
// del mundo. Para añadir una: su entrada en MUNDO, sus pasos en PASOS y su archivo en salas/.

const rampa = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };

// sitio: dónde se considera que estás en esa zona (se reparte el plano entero, sin huecos).
// andar: por dónde se puede andar, 2 m más corto que el sitio en cada lado que da a otra zona: entre
// dos zonas solo se pasa por los PASOS. agua: por debajo de esa altura no se puede pisar.
const MUNDO = {
  castillo: {
    titulo: 'El Castillo', salas: ['sala1', 'pasillo', 'sala2', 'pasillo2', 'sala3', 'comedor', 'comedor-vivos', 'capilla', 'patio', 'exterior'],
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
      // dos picos menores y un collado, con el terreno más quebrado
      const pico = (px, pz, alto, r) => alto * Math.exp(-((x - px) ** 2 + (z - pz) ** 2) / (2 * r * r));
      return cumbre + pico(-250, -60, 30, 24) + pico(-245, -185, 26, 22) + pico(-130, -45, 16, 16)
        + 3 * Math.sin(x * 0.06) * Math.sin(z * 0.05) + 1.3 * Math.sin(x * 0.17 + z * 0.13) + 0.6 * Math.sin(x * 0.41 - z * 0.37) + 3;
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
  puerto: {
    titulo: 'El Puerto', salas: ['puerto'],
    sitio: { x0: 90, x1: 900, z0: -440, z1: -200 }, andar: { x0: 92, x1: 345, z0: -395, z1: -202 }, agua: -0.2, sinBordeX1: true,
    cielo: 'mediodia', niebla: '#d5dde0', fondo: '#a9cfe8', ambiente: { intensity: 2.2, color: '#ffffff' }, sol: { intensity: 1.6, color: '#fff2dc' },
    // la costa: recta en el puerto (al norte) y entrando en la bahía de la playa (al sur)
    costa: z => 305 - 15 * rampa(-315, -285, z) + 3 * Math.sin(z * 0.09) * rampa(-300, -280, z),
    enPuerto: z => rampa(-392, -378, z) * (1 - rampa(-318, -304, z)),
    altura(x, z) {
      const d = x - this.costa(z), lomas = (1.6 * Math.sin(x * 0.06) + 1.2 * Math.sin(z * 0.08 + 1) + 2.5) * rampa(-28, -75, d);
      const playa = d > 0 ? 0.15 - 4.15 * rampa(0, 30, d) : 0.15 + 0.6 * rampa(0, -25, d) + lomas;
      const muelle = d > 0 ? 0.9 - 3.9 * rampa(0, 4, d) : 0.9 + lomas;
      const k = this.enPuerto(z);
      // al sur de la playa asoma el acantilado, la zona de al lado
      return playa + (muelle - playa) * k + 20 * rampa(-214, -202, z);
    },
    color(x, y, z) {
      const d = x - this.costa(z), k = this.enPuerto(z);
      if (d > -1 && y < 0) return '#6f6a55';
      if (k > 0.5 && d > -26) return '#7d786c';
      if (z > -212) return '#6f6a60';
      return d > -24 && y < 2 ? '#b7a577' : d > -30 && y < 2.5 ? '#8f8f58' : '#5a7036';
    },
  },
  // Bajo tierra: fuera del mapa, y se entra por un portal (js/animales.js), no andando
  cueva: {
    titulo: 'La Cueva', salas: ['cueva'],
    sitio: { x0: 1000, x1: 1200, z0: -200, z1: 0 }, andar: { x0: 1004, x1: 1130, z0: -135, z1: -65 }, agua: -0.65, sinBorde: true,
    cielo: 'noche', niebla: '#0c0e14', fondo: '#07090f', ambiente: { intensity: 0.8, color: '#7f8fb0' }, sol: { intensity: 0.1, color: '#a9bce8' },
    // el túnel y la gran sala; fuera de ellos, roca
    anchoCueva(x, z) {
      let d = Infinity;
      const T = [[1006, -100], [1030, -90], [1050, -106], [1068, -100]];
      for (let i = 0; i < T.length - 1; i++) {
        const [ax, az] = T[i], bx = T[i + 1][0] - ax, bz = T[i + 1][1] - az;
        const t = Math.max(0, Math.min(1, ((x - ax) * bx + (z - az) * bz) / (bx * bx + bz * bz)));
        d = Math.min(d, Math.hypot(x - ax - t * bx, z - az - t * bz) - 2.6 - 0.5 * Math.sin(x * 0.5));
      }
      return Math.min(d, Math.hypot(x - 1097, (z + 100) * 1.2) - 26 - 2 * Math.sin(Math.atan2(z + 100, x - 1097) * 6));
    },
    altura(x, z) {
      const d = this.anchoCueva(x, z), lago = -1.6 * rampa(11, 4, Math.hypot(x - 1102, z + 100));
      return 0.25 * Math.sin(x * 0.5) * Math.cos(z * 0.43) + lago + 8 * rampa(0, 3, d);
    },
    pared(x, z) { return this.anchoCueva(x, z) > 0.2; },
    color(x, y, z) { return y < -0.5 ? '#3c3e3f' : y > 1 ? '#5a554d' : Math.sin(x * 0.9) * Math.cos(z * 0.8) > 0.4 ? '#5d5244' : '#675b4b'; },
  },
  mazmorras: {
    titulo: 'Las Mazmorras', salas: ['mazmorras'],
    sitio: { x0: 1300, x1: 1500, z0: -200, z1: 0 }, andar: { x0: 1345, x1: 1355, z0: -106, z1: -52 },
    cielo: 'noche', niebla: '#0e0d0c', fondo: '#07070a', ambiente: { intensity: 0.9, color: '#8a7d6a' }, sol: { intensity: 0.1, color: '#a9bce8' },
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
  { a: 'lago', b: 'puerto', x: 90, z: -345, andar: { x0: 87, x1: 93, z0: -345.95, z1: -344.05 } },
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
  let h = zona.altura(x, z) + (zona.sinBorde ? 0 : Math.max(0, a.x0 - x, zona.sinBordeX1 ? 0 : x - a.x1, a.z0 - z, z - a.z1) * 0.3);
  for (const p of PASOS) if (p.a === zona.nombre || p.b === zona.nombre) h *= rampa(4, 34, Math.hypot(x - p.x, z - p.z));
  return h;
}
// Techo de la cueva: bajo en el túnel, alto en la sala, con estalactitas
function alturaTechoCueva(x, z) {
  const sala = rampa(1068, 1078, x);
  const pinchos = Math.max(0, Math.sin(x * 1.3) * Math.sin(z * 1.1) - 0.55) * (1.2 + 3 * sala);
  return 3.3 + 6.5 * sala + 0.4 * Math.sin(x * 0.6) * Math.cos(z * 0.5) - pinchos;
}
// La de la zona que hay cargada (la usan el andar, los árboles, el camino, la valla…)
let zonaCargada = MUNDO.castillo;
function alturaTerreno(x, z) { return alturaDe(zonaCargada, x, z); }
// La altura de la malla que se ve (el componente terreno): sus triángulos cortan las curvas, así que
// no siempre coincide con alturaTerreno. Lo que va pegado al suelo, como el camino, sigue esta.
let mallaTerreno = null;
function alturaMalla(x, z) {
  const m = mallaTerreno;
  if (!m) return alturaTerreno(x, z);
  const i = Math.floor((x - m.x0) / m.paso), j = Math.floor((z - m.z0) / m.paso), X0 = m.x0 + i * m.paso, Z0 = m.z0 + j * m.paso;
  const fx = (x - X0) / m.paso, fz = (z - Z0) / m.paso, h = (a, b) => alturaTerreno(X0 + a * m.paso, Z0 + b * m.paso) - 0.05;
  if (fx + fz <= 1) { const c = h(0, 0); return c + (h(1, 0) - c) * fx + (h(0, 1) - c) * fz; }
  const c = h(1, 1);
  return c + (h(0, 1) - c) * (1 - fx) + (h(1, 0) - c) * (1 - fz);
}
