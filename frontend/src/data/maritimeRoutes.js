// Rutas marítimas comerciales reales — geometría simplificada para visualización.
// Igual tratamiento que data/cables.js: nombres, puertos y chokepoints reales;
// waypoints aproximados para el mapa, no coordenadas AIS certificadas.
// El movimiento de "buques" sobre estas rutas es una SIMULACIÓN visual
// (partículas animadas), no un feed de posición en vivo. Conectar un feed
// real (MarineTraffic / Spire Maritime / VesselFinder) es la Fase B descrita
// en docs/ROADMAP.md y en la ficha de proveedores del manual de datos reales.

export const MARITIME_ROUTES = [
  {
    id: 'asia-europe-suez',
    name: 'Asia – Europa (vía Suez)',
    origin: 'Shanghái',
    destination: 'Róterdam',
    cargoType: 'Contenedores · electrónica · textiles',
    chokepoints: ['malaca', 'bab', 'suez'],
    waypoints: [
      [121.5, 31.2], [103.8, 1.3], [100.5, 2.8], [79.8, 6.9],
      [43.3, 12.6], [32.5, 30.6], [32.3, 31.3], [4.5, 51.9],
    ],
    color: '#22D3EE',
    shipCount: 3,
  },
  {
    id: 'transpacific',
    name: 'Transpacífico (Asia – Norteamérica)',
    origin: 'Shanghái',
    destination: 'Los Ángeles / Long Beach',
    cargoType: 'Contenedores · electrónica de consumo',
    chokepoints: [],
    waypoints: [
      [121.5, 31.2], [139.6, 35.4], [-170.0, 40.0], [-140.0, 36.0], [-118.2, 33.7],
    ],
    color: '#38BDF8',
    shipCount: 3,
  },
  {
    id: 'transatlantic',
    name: 'Transatlántico (Europa – Norteamérica)',
    origin: 'Róterdam',
    destination: 'Nueva York / Nueva Jersey',
    cargoType: 'Manufactura · autopartes · farmacéutica',
    chokepoints: [],
    waypoints: [
      [4.5, 51.9], [0.0, 50.5], [-40.0, 45.0], [-74.0, 40.6],
    ],
    color: '#60A5FA',
    shipCount: 2,
  },
  {
    id: 'gulf-crude-asia',
    name: 'Golfo Pérsico – Asia (crudo)',
    origin: 'Ras Tanura',
    destination: 'Ningbo',
    cargoType: 'Petróleo crudo',
    chokepoints: ['ormuz', 'malaca'],
    waypoints: [
      [50.2, 26.6], [56.3, 26.6], [65.0, 15.0], [100.5, 2.8], [121.6, 29.9],
    ],
    color: '#FB923C',
    shipCount: 2,
  },
  {
    id: 'qatar-lng-asia',
    name: 'Qatar – Asia (LNG)',
    origin: 'Ras Laffan',
    destination: 'Yokohama',
    cargoType: 'Gas natural licuado',
    chokepoints: ['ormuz', 'malaca'],
    waypoints: [
      [51.6, 26.1], [56.3, 26.6], [75.0, 10.0], [100.5, 2.8], [139.6, 35.4],
    ],
    color: '#FBBF24',
    shipCount: 2,
  },
  {
    id: 'southamerica-grain-asia',
    name: 'Sudamérica – Asia (granos)',
    origin: 'Santos',
    destination: 'Shanghái',
    cargoType: 'Granos · soya',
    chokepoints: ['malaca'],
    waypoints: [
      [-46.3, -23.9], [-10.0, -25.0], [18.4, -33.9], [60.0, -20.0], [100.5, 2.8], [121.5, 31.2],
    ],
    color: '#A3E635',
    shipCount: 2,
  },
  {
    id: 'southamerica-metals-asia',
    name: 'Sudamérica – Asia (cobre, litio, níquel)',
    origin: 'Antofagasta',
    destination: 'Qingdao',
    cargoType: 'Concentrado de cobre · carbonato de litio · níquel',
    chokepoints: [],
    waypoints: [
      [-70.4, -23.6], [-77.0, -12.0], [-79.0, -8.1], [121.5, 31.2],
    ],
    color: '#F472B6',
    shipCount: 2,
  },
];
