import { isIllustrativeSource } from './sourceClassification.js';

export function getCalibrationEligibility(fixture) {
  if (fixture?.evidenceStatus !== 'complete') return { eligible: false, reason: 'incomplete_evidence' };
  const sourceId = String(fixture?.sourceId || '').trim().toLowerCase();
  if (!sourceId) return { eligible: false, reason: 'missing_source' };
  if (isIllustrativeSource(fixture)) return { eligible: false, reason: 'illustrative_source' };
  if (!String(fixture?.provenance || '').trim()) return { eligible: false, reason: 'missing_provenance' };
  return { eligible: true, reason: null };
}

export function filterEligibleCalibrationFixtures(fixtures = []) {
  return fixtures.filter((fixture) => getCalibrationEligibility(fixture).eligible);
}
