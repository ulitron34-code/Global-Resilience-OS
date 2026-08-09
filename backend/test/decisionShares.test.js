import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createDecisionShare,
  getDecisionPackageByShareToken,
  listDecisionShares,
  resetLocalDemo,
  revokeDecisionShare,
} from '../domain/store.js';

test('decision share is read-only, expiring metadata hides the token hash and records access', () => {
  resetLocalDemo('test');
  const created = createDecisionShare('RS-0827', { expiresInHours: 2, audience: 'cliente piloto' }, 'analyst@test');
  assert.ok(created.token);
  assert.match(created.path, /^\/share\/[A-Za-z0-9_-]{40,}$/);
  assert.match(created.apiPath, /^\/api\/shares\/[A-Za-z0-9_-]{40,}$/);
  assert.equal(created.share.audience, 'cliente piloto');
  assert.equal(created.share.tokenHash, undefined);

  const before = listDecisionShares('RS-0827');
  assert.equal(before.length, 1);
  assert.equal(before[0].accessCount, 0);

  const accessed = getDecisionPackageByShareToken(created.token);
  assert.equal(accessed.share.caseId, 'RS-0827');
  assert.equal(accessed.package.case.id, 'RS-0827');
  assert.equal(accessed.package.disclaimer.includes('demo'), true);
  assert.equal(listDecisionShares('RS-0827')[0].accessCount, 1);
});

test('revoked decision share cannot be accessed again', () => {
  resetLocalDemo('test');
  const created = createDecisionShare('RS-0825', { expiresInHours: 1 }, 'analyst@test');
  const revoked = revokeDecisionShare('RS-0825', created.share.id, 'admin@test');
  assert.equal(revoked.status, 'revoked');
  assert.equal(getDecisionPackageByShareToken(created.token), null);
  assert.equal(listDecisionShares('RS-0825')[0].revokedBy, 'admin@test');
});

test('invalid or unknown share tokens are rejected without leaking package data', () => {
  resetLocalDemo('test');
  assert.equal(getDecisionPackageByShareToken('not-a-real-token'), null);
  assert.equal(getDecisionPackageByShareToken('a'.repeat(64)), null);
});
