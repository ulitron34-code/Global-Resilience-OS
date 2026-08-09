import test from 'node:test';
import assert from 'node:assert/strict';
import { getConnectorContractReadiness, listConnectors, validateConnectorPayload } from '../domain/connectors.js';

test('todos los contratos de conectores locales pasan el gate estructural', () => {
  const readiness = getConnectorContractReadiness();
  assert.equal(readiness.ready, true);
  assert.equal(readiness.externalIntegrationReady, false);
  assert.equal(readiness.connectorCount, listConnectors().length);
  assert.ok(readiness.checks.every((check) => check.pass));
});

test('cada conector acepta su contrato mínimo y rechaza payload incompleto', () => {
  for (const connector of listConnectors()) {
    const validPayload = {
      sourceId: connector.sourceId,
      eventType: connector.expectedEventTypes[0],
      externalId: `contract-${connector.id}`,
      observedAt: '2026-01-01T00:00:00.000Z',
      location: 'local-fixture',
      confidence: 0.8,
      provenance: { licenseRef: 'authorized-fixture' },
    };
    assert.equal(validateConnectorPayload(connector.id, validPayload).valid, true);
    assert.equal(validateConnectorPayload(connector.id, {}).valid, false);
  }
});
