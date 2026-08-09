const CONNECTORS = [
  { id: 'ais', name: 'AIS / vessel tracking', sourceId: 'ais-demo', domain: 'maritime', status: 'adapter_placeholder', mode: 'dry_run_only', expectedEventTypes: ['ais_gap'], requiredFields: ['externalId', 'observedAt', 'location', 'confidence', 'provenance'] },
  { id: 'cables', name: 'Subsea cable status', sourceId: 'cables-demo', domain: 'subsea_infrastructure', status: 'adapter_placeholder', mode: 'dry_run_only', expectedEventTypes: ['cable_degradation'], requiredFields: ['externalId', 'observedAt', 'confidence', 'provenance'] },
  { id: 'ports', name: 'Port congestion', sourceId: 'ports-demo', domain: 'maritime', status: 'adapter_placeholder', mode: 'dry_run_only', expectedEventTypes: ['port_delay'], requiredFields: ['externalId', 'observedAt', 'location', 'confidence', 'provenance'] },
  { id: 'markets', name: 'Commodity and market signals', sourceId: 'prices-demo', domain: 'markets', status: 'adapter_placeholder', mode: 'dry_run_only', expectedEventTypes: ['market_move'], requiredFields: ['externalId', 'observedAt', 'confidence', 'provenance'] },
];
export function listConnectors() { return structuredClone(CONNECTORS); }
export function getConnector(id) { return structuredClone(CONNECTORS.find((item) => item.id === id) || null); }
export function getConnectorContractReadiness() {
  const ids = CONNECTORS.map((item) => item.id);
  const sourceIds = CONNECTORS.map((item) => item.sourceId);
  const checks = [
    { id: 'unique_connector_ids', label: 'IDs de conector únicos', pass: new Set(ids).size === ids.length, evidence: `${ids.length} conectores declarados` },
    { id: 'unique_source_ids', label: 'Source IDs únicos', pass: new Set(sourceIds).size === sourceIds.length, evidence: `${sourceIds.length} fuentes declaradas` },
    { id: 'required_contract_fields', label: 'Campos contractuales mínimos', pass: CONNECTORS.every((item) => item.requiredFields.includes('externalId') && item.requiredFields.includes('observedAt') && item.requiredFields.includes('provenance')), evidence: 'externalId, observedAt y provenance requeridos' },
    { id: 'event_type_contracts', label: 'Tipos de evento declarados', pass: CONNECTORS.every((item) => item.expectedEventTypes.length > 0), evidence: 'Cada conector declara al menos un evento esperado' },
    { id: 'safe_default_mode', label: 'Modo seguro por defecto', pass: CONNECTORS.every((item) => item.mode === 'dry_run_only'), evidence: 'Ningún adaptador ejecuta acciones externas' },
  ];
  return { schemaVersion: '1.0.0-local-connector-readiness', ready: checks.every((check) => check.pass), connectorCount: CONNECTORS.length, checks, connectors: listConnectors().map((item) => ({ id: item.id, sourceId: item.sourceId, mode: item.mode, status: item.status })), externalIntegrationReady: false, nextStep: 'Conectar un proveedor autorizado, mapear su payload y repetir la validación en staging.', disclaimer: 'Gate local de contratos. No confirma licencia, disponibilidad, frescura, exactitud ni conectividad de proveedores.' };
}
export function validateConnectorPayload(id, payload = {}) {
  const connector = CONNECTORS.find((item) => item.id === id);
  if (!connector) return null;
  const missing = connector.requiredFields.filter((field) => payload[field] === undefined || payload[field] === null || payload[field] === '');
  const sourcePass = !payload.sourceId || payload.sourceId === connector.sourceId;
  const eventTypePass = !payload.eventType || connector.expectedEventTypes.includes(payload.eventType);
  return { connector: structuredClone(connector), valid: missing.length === 0 && sourcePass && eventTypePass, checks: { requiredFields: missing.length === 0, sourceId: sourcePass, eventType: eventTypePass }, missing, decision: missing.length || !sourcePass || !eventTypePass ? 'reject_before_ingest' : 'ready_for_envelope_validation', disclaimer: 'Validacion local del adaptador; el conector permanece en dry_run_only y no envia datos externos.' };
}
