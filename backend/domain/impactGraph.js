import { CABLES, CHOKEPOINTS } from '../data/cables.js';
import { VERTICALS } from '../data/verticals.js';

const GRAPH_VERSION = '1.0.0-local';
function node(id, type, label, attributes = {}) { return { id, type, label, attributes: { ...attributes, evidenceClass: attributes.demo ? 'assumed' : 'inferred' } }; }
function edge(id, from, to, relation, weight = null, provenance = 'demo-seed') {
  return { id, from, to, relation, weight, confidence: provenance === 'demo-seed' ? 0.45 : 0.8, evidenceClass: provenance === 'demo-seed' ? 'assumed' : 'inferred', provenance, validFrom: '2026-01-01T00:00:00.000Z', validTo: null };
}
function resolveAsOf(value) { if (value === undefined || value === null || value === '') return new Date(); const parsed = Date.parse(value); if (!Number.isFinite(parsed)) throw new Error('asOf debe ser una fecha ISO-8601 valida'); return new Date(parsed); }
function activeAt(item, asOf) { const from = Date.parse(item.validFrom); const to = item.validTo ? Date.parse(item.validTo) : Infinity; return from <= asOf.getTime() && asOf.getTime() < to; }

export function buildImpactGraph(filters = {}) {
  const nodes = [];
  const edges = [];
  const cableFilter = filters.cableId ? String(filters.cableId) : null;
  const verticalFilter = filters.verticalId ? String(filters.verticalId) : null;
  const asOf = resolveAsOf(filters.asOf);
  for (const cable of CABLES) {
    if (cableFilter && cable.id !== cableFilter) continue;
    nodes.push(node(`cable:${cable.id}`, 'cable', cable.name, { route: cable.route, criticality: cable.criticality, landings: cable.landings, demo: true }));
    for (const chokepointId of cable.chokepoints) {
      const chokepoint = CHOKEPOINTS[chokepointId];
      if (!chokepoint) continue;
      nodes.push(node(`chokepoint:${chokepointId}`, 'chokepoint', chokepoint.label, { globalShare: chokepoint.globalShare, lon: chokepoint.lon, lat: chokepoint.lat }));
      edges.push(edge(`contains:${cable.id}:${chokepointId}`, `cable:${cable.id}`, `chokepoint:${chokepointId}`, 'crosses'));
    }
    for (const vertical of VERTICALS) {
      if (verticalFilter && vertical.id !== verticalFilter) continue;
      const weight = Number(cable.vertical_weights[vertical.id] || 0);
      nodes.push(node(`vertical:${vertical.id}`, 'vertical', vertical.label, { dailyFlowUsd: vertical.dailyFlowUsd, unit: vertical.unit, demo: true }));
      edges.push(edge(`exposes:${cable.id}:${vertical.id}`, `cable:${cable.id}`, `vertical:${vertical.id}`, weight > 0 ? 'exposes_directly' : 'exposes_systemically', weight));
    }
  }
  edges.splice(0, edges.length, ...edges.filter((item) => activeAt(item, asOf)));
  const uniqueNodes = [...new Map(nodes.map((item) => [item.id, item])).values()];
  return { schemaVersion: GRAPH_VERSION, generatedAt: new Date().toISOString(), scope: 'local-platform', disclaimer: 'Grafo local basado en datos demo. Las relaciones y pesos requieren fuentes licenciadas, vigencia temporal y calibración histórica.', nodes: uniqueNodes, edges, counts: { nodes: uniqueNodes.length, edges: edges.length, cables: uniqueNodes.filter((item) => item.type === 'cable').length, chokepoints: uniqueNodes.filter((item) => item.type === 'chokepoint').length, verticals: uniqueNodes.filter((item) => item.type === 'vertical').length } };
}

export function getImpactPaths(cableId, verticalId, asOfValue) {
  const cable = CABLES.find((item) => item.id === cableId);
  const vertical = VERTICALS.find((item) => item.id === verticalId);
  if (!cable || !vertical) return null;
  const asOf = resolveAsOf(asOfValue);
  const active = asOf.getTime() >= Date.parse('2026-01-01T00:00:00.000Z');
  const directWeight = Number(cable.vertical_weights[vertical.id] || 0);
  const chokepoints = cable.chokepoints.map((id) => CHOKEPOINTS[id]).filter(Boolean).map((item) => ({ id: item.label, label: item.label, globalShare: item.globalShare }));
  return { schemaVersion: GRAPH_VERSION, generatedAt: new Date().toISOString(), temporalFilter: { asOf: asOf.toISOString(), active }, path: [{ id: `cable:${cable.id}`, type: 'cable', label: cable.name }, ...chokepoints.map((item) => ({ id: `chokepoint:${item.id}`, type: 'chokepoint', label: item.label })), { id: `vertical:${vertical.id}`, type: 'vertical', label: vertical.label }], relation: active ? (directWeight > 0 ? 'exposes_directly' : 'exposes_systemically') : 'not_active_at_as_of', directWeight: active ? directWeight : null, systemicFloor: active ? 0.12 : null, confidence: active ? 0.45 : 0, provenance: ['cables-demo', 'verticals-demo'], disclaimer: 'La trayectoria es explicable, pero no representa una causalidad validada con datos de mercado.' };
}
