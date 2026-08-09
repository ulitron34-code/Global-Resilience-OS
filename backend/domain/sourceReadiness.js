import { hasCompleteLicenseMetadata } from './dataCatalog.js';
import { isIllustrativeSource } from './sourceClassification.js';

export function evaluateProductiveSource(source = {}, catalog = {}) {
  const record = { ...catalog, ...source };
  const checks = {
    connected: source.status === 'connected',
    nonIllustrative: !isIllustrativeSource(record),
    activeLicense: record.licenseStatus === 'active',
    completeLicenseMetadata: hasCompleteLicenseMetadata(record),
  };
  const reasons = Object.entries(checks).filter(([, pass]) => !pass).map(([id]) => id);
  return { ready: reasons.length === 0, sourceId: source.id || record.id || null, checks, reasons };
}
