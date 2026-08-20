// Critical verticals monitored by Global Resilience OS
// NOTE: Daily flow values are illustrative order-of-magnitude estimates
// for concept-demonstration purposes. They must not be used for trading
// or real investment decisions; they require validation against primary sources (Kpler, Refinitiv, etc.).

export const VERTICALS = [
  {
    id: 'petroleo',
    label: 'Oil',
    icon: 'droplet',
    dailyFlowUsd: 2500_000_000,
    unit: 'barrels/day',
    baseline: 102_000_000,
    color: '#1F2937',
  },
  {
    id: 'lng',
    label: 'LNG',
    icon: 'flame',
    dailyFlowUsd: 600_000_000,
    unit: 'm³/day',
    baseline: 1_150_000,
    color: '#0891B2',
  },
  {
    id: 'gas',
    label: 'Natural Gas',
    icon: 'wind',
    dailyFlowUsd: 500_000_000,
    unit: 'MMBtu/day',
    baseline: 380_000_000,
    color: '#0EA5E9',
  },
  {
    id: 'petroquimica',
    label: 'Petrochemicals',
    icon: 'flask',
    dailyFlowUsd: 800_000_000,
    unit: 'ton/day',
    baseline: 1_400_000,
    color: '#7C3AED',
  },
  {
    id: 'electricidad',
    label: 'Power',
    icon: 'zap',
    dailyFlowUsd: 150_000_000,
    unit: 'GWh/day',
    baseline: 62_000,
    color: '#EAB308',
  },
  {
    id: 'cobre',
    label: 'Copper',
    icon: 'circle',
    dailyFlowUsd: 300_000_000,
    unit: 'ton/day',
    baseline: 58_000,
    color: '#EA580C',
  },
  {
    id: 'litio',
    label: 'Lithium',
    icon: 'battery',
    dailyFlowUsd: 80_000_000,
    unit: 'ton/day',
    baseline: 2_800,
    color: '#22C55E',
  },
  {
    id: 'niquel',
    label: 'Nickel',
    icon: 'hexagon',
    dailyFlowUsd: 120_000_000,
    unit: 'ton/day',
    baseline: 8_200,
    color: '#84CC16',
  },
  {
    id: 'cobalto',
    label: 'Cobalt',
    icon: 'gem',
    dailyFlowUsd: 40_000_000,
    unit: 'ton/day',
    baseline: 480,
    color: '#6366F1',
  },
  {
    id: 'trigo',
    label: 'Wheat',
    icon: 'wheat',
    dailyFlowUsd: 200_000_000,
    unit: 'ton/day',
    baseline: 520_000,
    color: '#F59E0B',
  },
  {
    id: 'semiconductores',
    label: 'Semiconductors',
    icon: 'cpu',
    dailyFlowUsd: 1_200_000_000,
    unit: 'USD/day',
    baseline: 1_200_000_000,
    color: '#EC4899',
  },
  {
    id: 'acero',
    label: 'Acero',
    icon: 'square',
    dailyFlowUsd: 400_000_000,
    unit: 'ton/day',
    baseline: 5_100_000,
    color: '#64748B',
  },
];

export const VERTICAL_MAP = Object.fromEntries(VERTICALS.map(v => [v.id, v]));




