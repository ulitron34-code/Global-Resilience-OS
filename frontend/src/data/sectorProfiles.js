// "Corpus" mínimo de referencia sectorial — no son datos de mercado en vivo.
// Traduce cada vertical monitoreada a: qué tipo de empresa la vive, por qué
// puertos suele moverse, y a qué ruta marítima ilustrativa se parece más.
// Sirve para que "Mi Impacto" hable en el idioma del sector del usuario en
// vez de mostrar solo un identificador técnico ("petroleo", "cobre", etc.).
// Fuente: conocimiento público de geografía comercial, no un dataset licenciado.

export const SECTOR_PROFILES = {
  petroleo: {
    archetype: 'refinerías, terminales de almacenamiento y distribuidoras de combustible',
    primaryPorts: ['Ras Tanura', 'Houston', 'Fujairah'],
    keyRouteIds: ['gulf-crude-asia'],
  },
  lng: {
    archetype: 'terminales de regasificación y generadoras eléctricas a gas',
    primaryPorts: ['Ras Laffan', 'Sabine Pass', 'Yokohama'],
    keyRouteIds: ['qatar-lng-asia'],
  },
  gas: {
    archetype: 'distribuidoras de gas natural y plantas petroquímicas conectadas a gasoductos',
    primaryPorts: ['Bakú', 'Ceyhan', 'Róterdam'],
    keyRouteIds: [],
  },
  petroquimica: {
    archetype: 'plantas de resinas, fertilizantes y derivados plásticos',
    primaryPorts: ['Houston', 'Róterdam', 'Jubail'],
    keyRouteIds: ['gulf-crude-asia'],
  },
  electricidad: {
    archetype: 'generadoras y distribuidoras eléctricas',
    primaryPorts: [],
    keyRouteIds: [],
  },
  cobre: {
    archetype: 'fundidoras y fabricantes de cableado o componentes eléctricos',
    primaryPorts: ['Valparaíso', 'Qingdao', 'Antofagasta'],
    keyRouteIds: ['southamerica-metals-asia'],
  },
  litio: {
    archetype: 'productores de baterías y ensambladoras de vehículos eléctricos',
    primaryPorts: ['Antofagasta', 'Shanghái'],
    keyRouteIds: ['southamerica-metals-asia', 'transpacific'],
  },
  niquel: {
    archetype: 'fabricantes de acero inoxidable y celdas de batería',
    primaryPorts: ['Yakarta', 'Shanghái'],
    keyRouteIds: ['southamerica-metals-asia', 'transpacific'],
  },
  cobalto: {
    archetype: 'fabricantes de baterías y electrónica de consumo',
    primaryPorts: ['Durban', 'Shanghái'],
    keyRouteIds: ['transpacific'],
  },
  trigo: {
    archetype: 'molineras, panificadoras y comercializadoras de granos',
    primaryPorts: ['Santos', 'Nueva Orleans', 'Róterdam'],
    keyRouteIds: ['southamerica-grain-asia'],
  },
  semiconductores: {
    archetype: 'fabricantes de electrónica, automotriz y equipo industrial que dependen de chips',
    primaryPorts: ['Kaohsiung', 'Yokohama', 'Róterdam'],
    keyRouteIds: ['transpacific', 'asia-europe-suez'],
  },
  acero: {
    archetype: 'constructoras, fabricantes de maquinaria y astilleros',
    primaryPorts: ['Qingdao', 'Róterdam', 'Houston'],
    keyRouteIds: ['asia-europe-suez'],
  },
};

export const REGIONS = [
  { id: 'na', label: 'Norteamérica' },
  { id: 'latam', label: 'América Latina' },
  { id: 'eu', label: 'Europa' },
  { id: 'apac', label: 'Asia-Pacífico' },
  { id: 'me', label: 'Medio Oriente' },
  { id: 'africa', label: 'África' },
];
