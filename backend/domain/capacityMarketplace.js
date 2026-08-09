import { randomBytes } from 'node:crypto';

const OFFERS = [
  { id: 'CAP-REDUNDANT-ROUTE', name: 'Ruta alterna de conectividad', category: 'connectivity', providerType: 'illustrative_provider', coverage: ['international', 'subsea'], leadTimeHours: 12, capacityUnits: 2, estimatedCostUsd: 120000, evidenceClass: 'assumed', availabilityStatus: 'verification_required', prerequisites: ['asset_scope', 'contract_review'] },
  { id: 'CAP-CONTINGENCY-CLOUD', name: 'Capacidad cloud de contingencia', category: 'compute', providerType: 'illustrative_provider', coverage: ['digital_infrastructure'], leadTimeHours: 6, capacityUnits: 4, estimatedCostUsd: 410000, evidenceClass: 'assumed', availabilityStatus: 'verification_required', prerequisites: ['workload_profile', 'security_review'] },
  { id: 'CAP-ALTERNATE-FREIGHT', name: 'Capacidad logística alternativa', category: 'logistics', providerType: 'illustrative_provider', coverage: ['maritime', 'chokepoint'], leadTimeHours: 36, capacityUnits: 3, estimatedCostUsd: 260000, evidenceClass: 'assumed', availabilityStatus: 'verification_required', prerequisites: ['route_scope', 'commercial_quote'] },
];

export function listCapacityOffers(filters = {}) {
  const category = filters.category ? String(filters.category) : null;
  const maxBudget = filters.maxBudget === undefined || filters.maxBudget === '' ? null : Number(filters.maxBudget);
  const maxLeadTimeHours = filters.maxLeadTimeHours === undefined || filters.maxLeadTimeHours === '' ? null : Number(filters.maxLeadTimeHours);
  return structuredClone(OFFERS.filter((offer) => (!category || offer.category === category) && (maxBudget === null || offer.estimatedCostUsd <= maxBudget) && (maxLeadTimeHours === null || offer.leadTimeHours <= maxLeadTimeHours)));
}

export function getCapacityMarketplaceReadiness() {
  return { ready: true, scope: 'local-capacity-marketplace', offerCount: OFFERS.length, externalCommitmentEnabled: false, checks: [{ id: 'catalog', pass: true, evidence: `${OFFERS.length} ofertas locales comparables` }, { id: 'availability', pass: false, evidence: 'Disponibilidad real requiere proveedor y verificación externa' }, { id: 'contract', pass: false, evidence: 'Cotización y contrato requieren revisión externa' }], disclaimer: 'Catálogo local ilustrativo; no confirma disponibilidad, precio, SLA ni capacidad contractual.' };
}

export function normalizeCapacityInquiry(input = {}, organizationId = 'nashadi-demo', actor = 'operator') {
  const offerId = String(input.offerId || '').trim();
  if (!OFFERS.some((offer) => offer.id === offerId)) throw new Error('Oferta de capacidad no encontrada');
  const requestedUnits = Number(input.requestedUnits);
  if (!Number.isInteger(requestedUnits) || requestedUnits < 1 || requestedUnits > 100) throw new Error('requestedUnits debe ser un entero entre 1 y 100');
  const caseId = input.caseId ? String(input.caseId).trim().slice(0, 120) : null;
  const note = input.note ? String(input.note).trim().slice(0, 1000) : null;
  return { id: `INQ-${randomBytes(4).toString('hex').toUpperCase()}`, organizationId, offerId, caseId, requestedUnits, note, status: 'draft_for_external_review', externalAction: 'blocked', createdBy: actor, createdAt: new Date().toISOString(), disclaimer: 'Solicitud local; no contacta al proveedor ni reserva capacidad.' };
}

export function getCapacityOffer(id) { return OFFERS.find((offer) => offer.id === id) ? structuredClone(OFFERS.find((offer) => offer.id === id)) : null; }
