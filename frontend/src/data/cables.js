// Base de datos de cables submarinos de internet — rutas simplificadas
// (waypoints aproximados para visualización, no coordenadas de cable exactas).
// Fuente conceptual: TeleGeography Submarine Cable Map (rutas públicas conocidas).
// Los pesos de correlación de impacto son heurísticas ilustrativas del modelo,
// no mediciones certificadas.

export const CHOKEPOINTS = {
  ormuz: { label: 'Estrecho de Ormuz', lon: 56.3, lat: 26.6, globalShare: '21% petróleo marítimo' },
  suez: { label: 'Canal de Suez', lon: 32.5, lat: 30.6, globalShare: '12% comercio marítimo global' },
  malaca: { label: 'Estrecho de Malaca', lon: 100.5, lat: 2.8, globalShare: '25% comercio marítimo global' },
  bab: { label: 'Bab-el-Mandeb', lon: 43.3, lat: 12.6, globalShare: '9% petróleo marítimo' },
};

// Pesos de correlación directa (0–1) por vertical, cuando un cable pasa por
// una zona de alta exposición a esa industria. El resto de las verticales
// reciben un "impacto sistémico base" definido en impactEngine.js
const HEAVY_ENERGY = { petroleo: 0.85, lng: 0.8, gas: 0.7, petroquimica: 0.6 };
const HEAVY_TECH = { semiconductores: 0.75, electricidad: 0.3 };
const HEAVY_METALS = { cobre: 0.7, litio: 0.55, niquel: 0.5, cobalto: 0.4, acero: 0.4 };
const HEAVY_AGRO = { trigo: 0.6 };

export const CABLES = [
  {
    id: 'seamewe3',
    name: 'SEA-ME-WE 3',
    route: 'Sudeste Asiático → Medio Oriente → Europa Occidental',
    chokepoints: ['malaca', 'ormuz', 'suez'],
    waypoints: [
      [103.8, 1.3], [100.5, 2.8], [80.0, 6.0], [56.3, 26.6],
      [43.3, 12.6], [32.5, 30.6], [23.7, 37.9], [9.1, 45.4],
    ],
    criticality: 9.2,
    landings: 39,
    vertical_weights: { ...HEAVY_ENERGY, ...HEAVY_TECH, ...HEAVY_AGRO },
  },
  {
    id: '2africa',
    name: '2Africa',
    route: 'Circunvala África → Mar Rojo → Europa',
    chokepoints: ['bab', 'suez'],
    waypoints: [
      [18.4, -33.9], [39.2, -6.8], [43.3, 12.6], [32.5, 30.6], [23.7, 37.9], [-9.1, 38.7],
    ],
    criticality: 7.8,
    landings: 46,
    vertical_weights: { ...HEAVY_ENERGY, cobalto: 0.65, cobre: 0.4 },
  },
  {
    id: 'fea',
    name: 'FLAG Europe-Asia',
    route: 'Reino Unido → Medio Oriente → Asia',
    chokepoints: ['suez', 'ormuz'],
    waypoints: [
      [-3.5, 50.7], [9.1, 45.4], [23.7, 37.9], [32.5, 30.6], [43.3, 12.6], [56.3, 26.6], [72.8, 18.9], [103.8, 1.3],
    ],
    criticality: 8.5,
    landings: 15,
    vertical_weights: { ...HEAVY_ENERGY, ...HEAVY_TECH },
  },
  {
    id: 'aae1',
    name: 'AAE-1',
    route: 'Asia → África → Europa (vía Egipto)',
    chokepoints: ['suez', 'malaca'],
    waypoints: [
      [103.8, 1.3], [80.0, 6.0], [43.3, 12.6], [32.5, 30.6], [23.7, 37.9], [2.3, 41.4],
    ],
    criticality: 7.1,
    landings: 21,
    vertical_weights: { ...HEAVY_ENERGY, semiconductores: 0.55 },
  },
  {
    id: 'ajc',
    name: 'Australia-Japan Cable',
    route: 'Australia → Japón',
    chokepoints: [],
    waypoints: [
      [151.2, -33.9], [153.0, -10.0], [140.0, 15.0], [139.7, 35.7],
    ],
    criticality: 6.4,
    landings: 4,
    vertical_weights: { ...HEAVY_METALS, ...HEAVY_TECH },
  },
  {
    id: 'aag',
    name: 'Asia-America Gateway',
    route: 'Sudeste Asiático → Estados Unidos',
    chokepoints: ['malaca'],
    waypoints: [
      [100.5, 2.8], [113.9, 22.3], [121.5, 25.0], [145.0, 20.0], [-157.8, 21.3], [-122.4, 37.7],
    ],
    criticality: 8.0,
    landings: 9,
    vertical_weights: { ...HEAVY_TECH, ...HEAVY_METALS },
  },
  {
    id: 'marea',
    name: 'MAREA',
    route: 'Estados Unidos → España',
    chokepoints: [],
    waypoints: [
      [-73.9, 40.7], [-45.0, 45.0], [-9.1, 38.7],
    ],
    criticality: 7.5,
    landings: 2,
    vertical_weights: { semiconductores: 0.7, electricidad: 0.4, acero: 0.3 },
  },
  {
    id: 'tat14',
    name: 'TAT-14',
    route: 'Estados Unidos → Europa (Atlántico Norte)',
    chokepoints: [],
    waypoints: [
      [-70.0, 41.5], [-30.0, 48.0], [-1.5, 50.0], [8.5, 53.5],
    ],
    criticality: 6.0,
    landings: 5,
    vertical_weights: { semiconductores: 0.5, acero: 0.35, trigo: 0.2 },
  },
  {
    id: 'hawaiki',
    name: 'Hawaiki',
    route: 'Australia/Nueva Zelanda → Estados Unidos',
    chokepoints: [],
    waypoints: [
      [174.8, -36.9], [-150.0, -5.0], [-122.4, 37.7],
    ],
    criticality: 5.2,
    landings: 3,
    vertical_weights: { ...HEAVY_METALS, trigo: 0.3 },
  },
  {
    id: 'eig',
    name: 'Europe India Gateway',
    route: 'Reino Unido → Egipto → India',
    chokepoints: ['suez'],
    waypoints: [
      [-3.5, 50.7], [-9.1, 38.7], [23.7, 37.9], [32.5, 30.6], [43.3, 12.6], [72.8, 18.9],
    ],
    criticality: 7.9,
    landings: 13,
    vertical_weights: { ...HEAVY_ENERGY, semiconductores: 0.45 },
  },
  {
    id: 'curie',
    name: 'Curie',
    route: 'Chile → Estados Unidos (Pacífico)',
    chokepoints: [],
    waypoints: [
      [-70.6, -33.4], [-90.0, -10.0], [-122.4, 37.7],
    ],
    criticality: 5.8,
    landings: 3,
    vertical_weights: { cobre: 0.75, litio: 0.6, niquel: 0.3 },
  },
  {
    id: 'sjc2',
    name: 'SJC2',
    route: 'Japón → Sudeste Asiático',
    chokepoints: ['malaca'],
    waypoints: [
      [139.7, 35.7], [121.5, 25.0], [113.9, 22.3], [103.8, 1.3],
    ],
    criticality: 6.9,
    landings: 8,
    vertical_weights: { ...HEAVY_TECH, ...HEAVY_METALS },
  },
];

export const CABLE_MAP = Object.fromEntries(CABLES.map(c => [c.id, c]));
