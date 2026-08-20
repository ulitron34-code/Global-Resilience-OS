// Corredores de carga aérea y ferroviaria de mercancías esenciales.
// MISMO TRATO que data/cables.js y data/maritimeRoutes.js: nombres, hubs/corredores
// y qué mueve cada ruta son reales y de dominio público; los waypoints son geometría
// SIMPLIFICADA para visualización, no datos de tracking en vivo (ADS-B / GPS
// ferroviario). No hay una sola posición de avión o tren real en este archivo —
// ver docs/LIMITACIONES.md. Lo marítimo vive en data/maritimeRoutes.js.
//
// Vertical-weights siguen la misma heurística de impactEngine.js: son supuestos de
// modelo razonados por el negocio, no medidos empíricamente. Solo se usan las 12
// verticales que realmente existen en data/verticals.js (petroleo, lng, gas,
// petroquimica, electricidad, cobre, litio, niquel, cobalto, trigo, semiconductores,
// acero) — el catálogo de 12 industrias del business plan (automotriz, farmacéutica,
// etc.) es aspiracional y todavía no corresponde a lo que el código calcula.
const AUTO_INPUTS_PROXY = { acero: 0.5, semiconductores: 0.35, electricidad: 0.2 };

// -------------------------------------------------------------------------
// AÉREO — corredores de carga aérea para insumos de alto valor / alta urgencia
// -------------------------------------------------------------------------
export const AIR_CARGO_ROUTES = [
  {
    id: 'taiwan-semiconductor-corridor',
    name: 'Taiwán → EE.UU. / Europa (semiconductores)',
    mode: 'air',
    origin: 'Taipei',
    destination: 'Frankfurt',
    cargo: 'Obleas y chips de alto valor, equipo de litografía',
    hubs: ['Taipei (TPE)', 'Anchorage (ANC)', 'Frankfurt (FRA)'],
    waypoints: [
      [121.2, 25.1], [149.9, 61.2], [8.5, 50.0],
    ],
    color: '#C084FC',
    vertical_weights: { semiconductores: 0.9 },
  },
  {
    id: 'shanghai-frankfurt-cargo',
    name: 'Shanghái ↔ Frankfurt (carga general)',
    mode: 'air',
    origin: 'Shanghái',
    destination: 'Frankfurt',
    cargo: 'Electrónica, componentes automotrices, farmacéutica',
    hubs: ['Shanghai Pudong (PVG)', 'Frankfurt (FRA)'],
    waypoints: [
      [121.8, 31.1], [58.4, 44.6], [8.5, 50.0],
    ],
    color: '#D8B4FE',
    vertical_weights: { ...AUTO_INPUTS_PROXY },
  },
  {
    id: 'hongkong-anchorage-polar',
    name: 'Hong Kong → Norteamérica (ruta polar)',
    mode: 'air',
    origin: 'Hong Kong',
    destination: 'Chicago',
    cargo: 'Electrónica de consumo, e-commerce de alto valor',
    hubs: ['Hong Kong (HKG)', 'Anchorage (ANC)', 'Chicago (ORD)'],
    waypoints: [
      [114.0, 22.3], [149.9, 61.2], [-87.9, 41.9],
    ],
    color: '#A78BFA',
    vertical_weights: { semiconductores: 0.4, electricidad: 0.3 },
  },
];

// -------------------------------------------------------------------------
// FERROVIARIO — corredores de carga ferroviaria transcontinental
// -------------------------------------------------------------------------
export const RAIL_FREIGHT_ROUTES = [
  {
    id: 'china-europe-express',
    name: 'China → Europa (New Silk Road / China Railway Express)',
    mode: 'rail',
    origin: 'Zhengzhou',
    destination: 'Duisburgo',
    cargo: 'Electrónica, automotriz, bienes de consumo',
    corridor: 'China → Kazajistán → Rusia → Polonia → Alemania',
    waypoints: [
      [114.5, 34.6], [76.9, 43.2], [55.2, 51.2], [37.6, 55.7], [19.9, 50.0], [8.5, 50.0],
    ],
    color: '#F59E0B',
    vertical_weights: { ...AUTO_INPUTS_PROXY, semiconductores: 0.3 },
  },
  {
    id: 'north-america-intermodal',
    name: 'Norteamérica — corredor intermodal (LA ↔ Chicago ↔ Nueva York)',
    mode: 'rail',
    origin: 'Los Ángeles',
    destination: 'Nueva York',
    cargo: 'Contenedores de importación asiática, agroalimentos',
    corridor: 'Los Angeles/Long Beach → Chicago → Nueva York/Nueva Jersey',
    waypoints: [
      [-118.2, 33.7], [-87.9, 41.9], [-74.0, 40.7],
    ],
    color: '#FBBF24',
    vertical_weights: { trigo: 0.4, ...AUTO_INPUTS_PROXY },
  },
  {
    id: 'mexico-usa-industrial-corridor',
    name: 'México ↔ EE.UU. (corredor industrial Bajío-Texas)',
    mode: 'rail',
    origin: 'Querétaro',
    destination: 'Laredo',
    cargo: 'Automotriz, arneses, acero, electrónica',
    corridor: 'Bajío/Centro de México → Laredo/Nuevo Laredo → Texas',
    waypoints: [
      [-101.2, 20.6], [-99.5, 27.5], [-95.4, 29.8],
    ],
    color: '#FDE047',
    vertical_weights: { ...AUTO_INPUTS_PROXY, acero: 0.6 },
  },
];

export const CARGO_ROUTE_MODES = {
  air: { label: 'Carga aérea', icon: '✈️', color: '#C084FC' },
  rail: { label: 'Ferrocarril de carga', icon: '\u{1F686}', color: '#F59E0B' },
};

export const ALL_CARGO_ROUTES = [
  ...AIR_CARGO_ROUTES,
  ...RAIL_FREIGHT_ROUTES,
];
