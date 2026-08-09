export const EVIDENCE_CLASSES = Object.freeze(['observed', 'inferred', 'assumed']);

export function buildEvidence({ evidenceClass = 'assumed', sourceIds = [], modelId = null, modelVersion = null, observed = [], inferred = [], assumptions = [] } = {}) {
  const normalizedClass = EVIDENCE_CLASSES.includes(evidenceClass) ? evidenceClass : 'assumed';
  return { evidenceClass: normalizedClass, sourceIds: sourceIds.map(String), model: modelId ? { id: String(modelId), version: modelVersion ? String(modelVersion) : null } : null, observed: observed.map(String), inferred: inferred.map(String), assumptions: assumptions.map(String) };
}
