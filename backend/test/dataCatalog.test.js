import test from 'node:test';
import assert from 'node:assert/strict';
import { validateSourceIntake } from '../domain/dataCatalog.js';

const complete = {
  id: 'licensed-ais-provider', name: 'Licensed AIS Provider', domain: 'maritime', coverage: 'global_vessel_events', sourceClass: 'licensed_feed', licenseStatus: 'active', requiredFor: ['maritime_alerts'],
  license: { contractRef: 'contract-ais-001', territory: ['global'], allowedFields: ['externalId', 'location', 'observedAt'], retentionDays: 365, redistribution: 'internal_only', attribution: 'Provider', renewalContact: 'legal@example.com' },
};

test('source intake preview allows a complete non-demo license record without persisting it', () => {
  const result = validateSourceIntake(complete);
  assert.equal(result.ready, true);
  assert.equal(result.persisted, false);
  assert.equal(result.decision, 'allow_staging_registration');
});

test('source intake preview abstains for demo coverage, inactive license and missing metadata', () => {
  const result = validateSourceIntake({ ...complete, id: 'new-demo-source', coverage: 'illustrative_routes', licenseStatus: 'verification_required', license: {} });
  assert.equal(result.ready, false);
  assert.equal(result.decision, 'abstain_source_registration');
  assert.ok(result.missingLicenseFields.includes('contractRef'));
  assert.ok(result.checks.some((check) => check.id === 'non_demo_coverage' && !check.pass));
});
