import { hasCompleteLicenseMetadata } from './dataCatalog.js';
import { isIllustrativeSource } from './sourceClassification.js';

const REQUIRED_FIELDS = ['sourceId', 'observedAt', 'confidence', 'provenance'];

export function evaluateDataQuality({ catalog = [], sources = [], now = new Date() } = {}) {
  const sourceMap = new Map(sources.map((source) => [source.id, source]));
  const checks = catalog.map((item) => {
    const source = sourceMap.get(item.id);
    const sourcePresent = Boolean(source);
    const ageMinutes = source?.lastEventAt ? Math.max(0, (now.getTime() - Date.parse(source.lastEventAt)) / 60000) : null;
    const licensePass = item.licenseStatus === 'active';
    const licenseMetadataPass = hasCompleteLicenseMetadata(item);
    const coveragePass = !isIllustrativeSource({ ...item, ...source });
    const sourceConnectionPass = sourcePresent && source.status === 'connected' && !isIllustrativeSource({ ...item, ...source });
    const freshnessPass = sourceConnectionPass && (item.refreshSlaHours === null || (ageMinutes !== null && ageMinutes <= item.refreshSlaHours * 60));
    const status = sourcePresent && sourceConnectionPass && licensePass && licenseMetadataPass && coveragePass && freshnessPass ? 'pass' : 'abstain';
    return { id: item.id, label: item.name, requiredFor: item.requiredFor, status, sourcePresent, sourceConnectionPass, licensePass, licenseMetadataPass, coveragePass, freshnessPass, ageMinutes: ageMinutes === null ? null : Math.round(ageMinutes), blocking: [!sourcePresent && 'source', !sourceConnectionPass && 'connection', !licensePass && 'license', !licenseMetadataPass && 'license_metadata', !coveragePass && 'coverage', !freshnessPass && 'freshness'].filter(Boolean) };
  });
  const materialReady = checks.length > 0 && checks.every((check) => check.status === 'pass');
  return { schemaVersion: '1.0.0-local', ready: materialReady, checkedAt: now.toISOString(), checks, counts: { total: checks.length, pass: checks.filter((item) => item.status === 'pass').length, abstain: checks.filter((item) => item.status === 'abstain').length }, decision: materialReady ? 'allow_material_recommendations' : 'abstain_material_recommendations', disclaimer: 'Gate local de calidad. Una fuente no licenciada, ilustrativa o stale bloquea recomendaciones materiales; no sustituye revisión contractual.' };
}

export function validateDataRecord(record = {}, source = {}) {
  const missing = REQUIRED_FIELDS.filter((field) => record[field] === undefined || record[field] === null || record[field] === '');
  const sourcePresent = Boolean(source?.id);
  const sourceClassificationPass = sourcePresent && !isIllustrativeSource(source);
  const licensePass = sourceClassificationPass && Boolean(record.provenance?.licenseRef) && source.licenseStatus === 'active';
  const observedAt = Date.parse(record.observedAt);
  const freshnessPass = sourcePresent && Number.isFinite(observedAt) && (!source.refreshSlaHours || (Date.now() - observedAt) / 3600000 <= source.refreshSlaHours);
  return { valid: missing.length === 0 && sourcePresent && sourceClassificationPass && licensePass && freshnessPass, missing, checks: { source: sourcePresent, sourceClassification: sourceClassificationPass, license: licensePass, freshness: freshnessPass }, decision: missing.length || !sourcePresent || !sourceClassificationPass || !licensePass || !freshnessPass ? 'abstain' : 'allow', disclaimer: 'Validacion local de contrato y calidad; no prueba exactitud ni derechos de uso.' };
}
