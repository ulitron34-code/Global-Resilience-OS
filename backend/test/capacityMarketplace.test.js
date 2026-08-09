import test from 'node:test';
import assert from 'node:assert/strict';
import { getCapacityMarketplaceReadiness, listCapacityOffers, normalizeCapacityInquiry } from '../domain/capacityMarketplace.js';

test('capacity marketplace filters local offers without claiming availability', () => {
  const offers = listCapacityOffers({ category: 'connectivity', maxBudget: 200000, maxLeadTimeHours: 24 });
  assert.equal(offers.length, 1);
  assert.equal(offers[0].availabilityStatus, 'verification_required');
  assert.equal(getCapacityMarketplaceReadiness().externalCommitmentEnabled, false);
});

test('capacity inquiry is normalized as blocked external dry-run', () => {
  const inquiry = normalizeCapacityInquiry({ offerId: 'CAP-REDUNDANT-ROUTE', requestedUnits: 2, caseId: 'RS-0827' }, 'org-a', 'analyst@example.com');
  assert.equal(inquiry.organizationId, 'org-a');
  assert.equal(inquiry.status, 'draft_for_external_review');
  assert.equal(inquiry.externalAction, 'blocked');
  assert.throws(() => normalizeCapacityInquiry({ offerId: 'UNKNOWN', requestedUnits: 1 }), /no encontrada/);
});
