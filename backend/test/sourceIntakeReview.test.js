import test from 'node:test';
import assert from 'node:assert/strict';
import { createSourceIntakeReview, listSourceIntakeReviews, updateSourceIntakeReview } from '../domain/store.js';

const candidate = {
  id: `licensed-review-${Date.now()}`, name: 'Proveedor revisable', domain: 'maritime', coverage: 'licensed_global_events', sourceClass: 'licensed_feed', licenseStatus: 'active', requiredFor: ['maritime_alerts'],
  license: { contractRef: 'contract-review-001', territory: ['global'], allowedFields: ['externalId', 'observedAt'], retentionDays: 180, redistribution: 'internal_only', attribution: 'Provider', renewalContact: 'legal@example.com' },
};

test('source intake review persists locally, remains externally blocked and supports human decision', () => {
  const created = createSourceIntakeReview({ candidate }, 'reviewer@example.com');
  assert.equal(created.status, 'pending_review');
  assert.equal(created.activationStatus, 'blocked_external');
  assert.equal(listSourceIntakeReviews({ status: 'pending_review' }).some((item) => item.id === created.id), true);
  const approved = updateSourceIntakeReview(created.id, { status: 'approved_local', note: 'Cumple revisión local.' }, 'approver@example.com');
  assert.equal(approved.status, 'approved_local');
  assert.equal(approved.activationStatus, 'blocked_external');
  assert.equal(approved.reviewedBy, 'approver@example.com');
});

test('rejected source intake review requires a note', () => {
  const created = createSourceIntakeReview({ candidate: { ...candidate, id: `${candidate.id}-reject` } });
  assert.throws(() => updateSourceIntakeReview(created.id, { status: 'rejected' }), /requiere nota/);
});
