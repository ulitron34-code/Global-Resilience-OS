import { CABLES, CHOKEPOINTS } from '../data/cables.js';
import { VERTICALS } from '../data/verticals.js';

const aliases = {
  cable: { 'smw3': 'seamewe3', 'sea-me-we 3': 'seamewe3', 'sea me we 3': 'seamewe3', '2 africa': '2africa' },
  vertical: { 'oil & gas': 'petroleo', oil: 'petroleo', petroleum: 'petroleo', lng: 'lng', 'natural gas': 'gas', steel: 'acero', copper: 'cobre', lithium: 'litio' },
  chokepoint: { hormuz: 'ormuz', 'estrecho de hormuz': 'ormuz', suez: 'suez', malacca: 'malaca', malaca: 'malaca', 'bab el mandeb': 'bab' },
};

function normalize(value) { return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[·–—-]/g, ' ').replace(/[^a-z0-9& ]/g, ' ').replace(/\s+/g, ' ').trim(); }
function catalog(type) {
  if (type === 'cable') return CABLES.map((item) => ({ id: item.id, label: item.name, type }));
  if (type === 'vertical') return VERTICALS.map((item) => ({ id: item.id, label: item.label, type }));
  if (type === 'chokepoint') return Object.entries(CHOKEPOINTS).map(([id, item]) => ({ id, label: item.label, type }));
  return [];
}

export function resolveEntity(type, query) {
  if (!['cable', 'vertical', 'chokepoint'].includes(type)) throw new Error('type debe ser cable, vertical o chokepoint');
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) throw new Error('query es requerida');
  const aliasId = aliases[type]?.[normalizedQuery];
  const candidates = catalog(type).map((item) => {
    const normalizedLabel = normalize(item.label);
    const exact = item.id === aliasId || item.id === normalizedQuery || normalizedLabel === normalizedQuery;
    const contains = normalizedLabel.includes(normalizedQuery) || normalizedQuery.includes(normalizedLabel);
    return { ...item, matchType: exact ? 'exact' : contains ? 'contains' : 'none', score: exact ? 1 : contains ? 0.7 : 0 };
  }).filter((item) => item.score > 0).sort((a, b) => b.score - a.score);
  return { schemaVersion: '1.0.0-local', type, query: String(query), normalizedQuery, resolved: candidates[0] || null, candidates, disclaimer: 'Resolución local por alias y similitud textual; requiere entity resolution productiva con fuentes y revisión humana.' };
}
