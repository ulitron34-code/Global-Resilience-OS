const SCHEMAS = [
  { id: 'event-envelope', version: '1.0.0', status: 'local', required: ['externalId', 'sourceId', 'eventType', 'title', 'severity', 'impactUsd'], optional: ['observedAt', 'detectedAt'], enums: { severity: ['critical', 'high', 'medium', 'low'] }, provenanceRequiredInProduction: true, notes: 'Validated by validateEventEnvelope; detectedAt is optional evidence for observedAt-to-detection latency; unknown provider fields belong in payload.' },
  { id: 'action-plan', version: '1.0.0', status: 'local', required: ['playbookId', 'organizationId', 'status', 'economics', 'humanApproval', 'evidence'], statusTransitions: ['draft_for_human_approval', 'approved', 'in_execution', 'completed'], notes: 'Evidence contains sourceIds, model version, assumptions and temporal validity; completed requires operator outcome and evidence reference.' },
  { id: 'action-plan-outcome', version: '1.0.0', status: 'local', required: ['actualLossUsd', 'actualRecoveryHours', 'evidenceRef'], numericNonNegative: ['actualLossUsd', 'actualRecoveryHours'], notes: 'Only accepted while action plan is in_execution.' },
  { id: 'impact-edge', version: '1.0.0', status: 'local', required: ['id', 'from', 'to', 'relation', 'confidence', 'provenance', 'validFrom'], notes: 'Temporal edge with explicit confidence and provenance.' },
  { id: 'regulatory-evidence', version: '1.0.0', status: 'local', required: ['frameworkId', 'scope', 'evidence'], notes: 'Operator verification only; not a certification claim.' },
];

function clone(value) { return structuredClone(value); }
export function listSchemas() { return clone(SCHEMAS); }
export function getSchema(id) { return clone(SCHEMAS.find((schema) => schema.id === id) || null); }
export function getSchemaRegistryReadiness() { return { ready: true, schemaCount: SCHEMAS.length, versions: [...new Set(SCHEMAS.map((schema) => schema.version))], external: ['OpenAPI client generation', 'Supabase database constraints', 'provider contract tests'], disclaimer: 'Registro local de contratos; requiere sincronizacion con OpenAPI, base de datos y proveedores externos.' }; }
