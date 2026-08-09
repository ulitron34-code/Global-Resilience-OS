const CATALOG = [
  { id: 'cables-demo', name: 'Base de cables submarinos', domain: 'subsea_infrastructure', coverage: 'illustrative_routes', sourceClass: 'demo_seed', licenseStatus: 'not_for_production', refreshSlaHours: null, requiredFor: ['impact_graph', 'scenario_engine'], license: { contractRef: null, territory: [], allowedFields: [], retentionDays: null, redistribution: 'blocked', attribution: null, renewalContact: null } },
  { id: 'ais-demo', name: 'AIS / vessel tracking', domain: 'maritime', coverage: 'demo_events', sourceClass: 'licensed_feed_placeholder', licenseStatus: 'verification_required', refreshSlaHours: 1, requiredFor: ['maritime_alerts', 'chokepoint_exposure'], license: { contractRef: null, territory: [], allowedFields: [], retentionDays: null, redistribution: 'blocked', attribution: null, renewalContact: null } },
  { id: 'ports-demo', name: 'Port congestion', domain: 'maritime', coverage: 'demo_events', sourceClass: 'licensed_feed_placeholder', licenseStatus: 'verification_required', refreshSlaHours: 1, requiredFor: ['port_disruption'], license: { contractRef: null, territory: [], allowedFields: [], retentionDays: null, redistribution: 'blocked', attribution: null, renewalContact: null } },
  { id: 'prices-demo', name: 'Commodity prices', domain: 'markets', coverage: 'demo_events', sourceClass: 'market_data_placeholder', licenseStatus: 'verification_required', refreshSlaHours: 1, requiredFor: ['economic_exposure'], license: { contractRef: null, territory: [], allowedFields: [], retentionDays: null, redistribution: 'blocked', attribution: null, renewalContact: null } },
];

export function hasCompleteLicenseMetadata(item = {}) {
  return getMissingLicenseFields(item).length === 0;
}

export function getMissingLicenseFields(item = {}) {
  const license = item.license || {};
  return [
    !license.contractRef && 'contractRef',
    !(Array.isArray(license.territory) && license.territory.length) && 'territory',
    !(Array.isArray(license.allowedFields) && license.allowedFields.length) && 'allowedFields',
    !Number.isFinite(Number(license.retentionDays)) && 'retentionDays',
    !license.redistribution && 'redistribution',
    !license.attribution && 'attribution',
    !license.renewalContact && 'renewalContact'
  ].filter(Boolean);
}

function clone(value) { return structuredClone(value); }
export function listDataCatalog() { return clone(CATALOG); }
export function getDataCatalogReadiness(catalog = CATALOG) {
  const checks = catalog.map((item) => ({ id: item.id, label: item.name, status: item.licenseStatus === 'active' && hasCompleteLicenseMetadata(item) ? 'pass' : 'pending', licenseStatus: item.licenseStatus, metadataComplete: hasCompleteLicenseMetadata(item), missingLicenseFields: getMissingLicenseFields(item), requiredFor: item.requiredFor }));
  return { ready: checks.every((item) => item.status === 'pass'), scope: 'local-platform', generatedAt: new Date().toISOString(), checks, disclaimer: 'La catalogación documenta dependencias y estado de licencia; no concede derechos de uso ni valida exactitud de mercado.' };
}

export function validateSourceIntake(input = {}) {
  const candidate = clone(input);
  const license = candidate.license || {};
  const checks = [
    { id: 'identity', label: 'Identidad de fuente', pass: Boolean(candidate.id && candidate.name && candidate.domain), evidence: 'id, name y domain requeridos' },
    { id: 'unique_id', label: 'ID no colisiona con catálogo', pass: Boolean(candidate.id) && !CATALOG.some((item) => item.id === candidate.id), evidence: 'La fuente no debe reemplazar una entrada existente' },
    { id: 'non_demo_coverage', label: 'Cobertura no ilustrativa', pass: Boolean(candidate.coverage) && !/demo|illustrative/i.test(candidate.coverage), evidence: 'La cobertura debe describir datos autorizados' },
    { id: 'active_license', label: 'Licencia activa declarada', pass: candidate.licenseStatus === 'active', evidence: 'licenseStatus debe ser active' },
    { id: 'license_metadata', label: 'Ficha contractual completa', pass: hasCompleteLicenseMetadata(candidate), evidence: getMissingLicenseFields(candidate).length ? `Faltan: ${getMissingLicenseFields(candidate).join(', ')}` : 'Metadatos contractuales completos' },
    { id: 'retention', label: 'Retención válida', pass: Number.isFinite(Number(license.retentionDays)) && Number(license.retentionDays) >= 0, evidence: 'retentionDays debe ser un número no negativo' },
    { id: 'required_for', label: 'Dependencias declaradas', pass: Array.isArray(candidate.requiredFor) && candidate.requiredFor.length > 0, evidence: 'requiredFor debe contener al menos un caso de uso' },
  ];
  const ready = checks.every((check) => check.pass);
  return { schemaVersion: '1.0.0-local-source-intake', ready, persisted: false, decision: ready ? 'allow_staging_registration' : 'abstain_source_registration', candidate, checks, missingLicenseFields: getMissingLicenseFields(candidate), nextStep: ready ? 'Registrar en staging, asociar tenant y ejecutar validación de frescura antes de activarla.' : 'Completar los checks fallidos; ninguna fuente se persiste desde este preview.', disclaimer: 'Preview local no destructivo. No concede licencia, no registra la fuente en producción y no valida exactitud del proveedor.' };
}
