const ACTIONS = [
  { id: 'reroute-traffic', type: 'reroute', name: 'Redirigir trafico por ruta alterna', providerType: 'network', leadTimeHours: 12, estimatedCostUsd: 120000, capacityUnits: 0.42, prerequisites: ['route_capacity_verified', 'owner_approval'], evidenceRequired: ['capacity_quote', 'routing_change_log'], status: 'local_catalog' },
  { id: 'alternate-carrier', type: 'alternate_provider', name: 'Activar proveedor alterno', providerType: 'telecom', leadTimeHours: 36, estimatedCostUsd: 260000, capacityUnits: 0.58, prerequisites: ['vendor_contract', 'security_review'], evidenceRequired: ['provider_sla', 'activation_ticket'], status: 'local_catalog' },
  { id: 'contingency-capacity', type: 'contingency_capacity', name: 'Comprar capacidad de contingencia', providerType: 'capacity', leadTimeHours: 6, estimatedCostUsd: 410000, capacityUnits: 0.72, prerequisites: ['commercial_approval', 'capacity_availability'], evidenceRequired: ['quote', 'purchase_order'], status: 'local_catalog' },
  { id: 'inventory-buffer', type: 'inventory_buffer', name: 'Elevar inventario o liquidez de contingencia', providerType: 'supply', leadTimeHours: 72, estimatedCostUsd: 185000, capacityUnits: 0.31, prerequisites: ['working_capital', 'demand_forecast'], evidenceRequired: ['inventory_plan', 'finance_approval'], status: 'local_catalog' },
  { id: 'repair-escalation', type: 'repair_escalation', name: 'Acelerar reparacion o mantenimiento', providerType: 'infrastructure', leadTimeHours: 48, estimatedCostUsd: 340000, capacityUnits: 0.66, prerequisites: ['asset_owner', 'repair_window'], evidenceRequired: ['maintenance_order', 'eta_confirmation'], status: 'local_catalog' },
];

function clone(value) { return structuredClone(value); }

export function listActions(filters = {}) {
  const type = filters.type ? String(filters.type) : null;
  const providerType = filters.providerType ? String(filters.providerType) : null;
  return clone(ACTIONS.filter((item) => (!type || item.type === type) && (!providerType || item.providerType === providerType)));
}

export function getAction(id) { return clone(ACTIONS.find((item) => item.id === id) || null); }

export function recommendActions(input = {}) {
  const budget = Number.isFinite(Number(input.budgetUsd)) ? Math.max(0, Number(input.budgetUsd)) : Infinity;
  const horizonHours = Number.isFinite(Number(input.horizonHours)) ? Math.max(0, Number(input.horizonHours)) : Infinity;
  const requestedType = input.type ? String(input.type) : null;
  const candidates = ACTIONS.filter((item) => (!requestedType || item.type === requestedType) && item.estimatedCostUsd <= budget && item.leadTimeHours <= horizonHours);
  return { generatedAt: new Date().toISOString(), candidates: clone(candidates.sort((a, b) => b.capacityUnits - a.capacityUnits)), assumptions: ['El catalogo es local y no confirma disponibilidad comercial.', 'Los costos y tiempos son supuestos de demostracion.', 'Toda accion requiere aprobacion humana y evidencia.'], disclaimer: 'Recomendacion local; no ejecuta compras, cambios de red ni contratos externos.' };
}

export function getActionLibraryReadiness() { return { ready: false, entries: ACTIONS.length, status: 'local_catalog', blocking: ['licensed_provider_catalog', 'live_capacity_availability', 'commercial_contracts'], disclaimer: 'Catalogo de acciones alternas para diseño local; no representa oferta disponible.' }; }
