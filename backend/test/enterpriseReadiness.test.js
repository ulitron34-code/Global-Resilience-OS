import test from 'node:test';
import assert from 'node:assert/strict';
import { buildEnterpriseReadiness } from '../domain/enterpriseReadiness.js';

test('enterprise readiness requires explicit schema and release evidence', () => {
  const blocked = buildEnterpriseReadiness({ runtime: { ready: true }, environmentContract: { ready: true }, security: { status: 'pass' }, catalog: { ready: true }, actionLibrary: { ready: true } });
  assert.equal(blocked.localChecks.find((item) => item.id === 'schema').pass, false);
  assert.equal(blocked.localChecks.find((item) => item.id === 'release').pass, false);
  assert.equal(blocked.localReady, false);

  const verified = buildEnterpriseReadiness({ runtime: { ready: true }, environmentContract: { ready: true }, security: { status: 'pass' }, catalog: { ready: true }, actionLibrary: { ready: true }, schemaAudit: true, releaseGate: true });
  assert.equal(verified.localChecks.find((item) => item.id === 'schema').pass, true);
  assert.equal(verified.localChecks.find((item) => item.id === 'release').pass, true);
});
