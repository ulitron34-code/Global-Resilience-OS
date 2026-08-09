const DEFAULT_MODEL = { id: 'impact-cascade', version: '0.5.0-local' };

export function attachDecisionEvidence(plan, input = {}) {
  const sourceIds = Array.isArray(input.sourceIds)
    ? input.sourceIds.map(String).map((value) => value.trim()).filter(Boolean).slice(0, 20)
    : input.sourceId ? [String(input.sourceId).trim()] : [];
  const validFrom = input.validFrom ? new Date(input.validFrom).toISOString() : plan.generatedAt;
  const validTo = input.validTo ? new Date(input.validTo).toISOString() : null;
  const model = {
    id: String(input.modelId || DEFAULT_MODEL.id),
    version: String(input.modelVersion || DEFAULT_MODEL.version),
  };
  return {
    ...plan,
    evidence: {
      sourceIds,
      model,
      assumptions: Array.isArray(plan.assumptions) ? [...plan.assumptions] : [],
      validity: { validFrom, validTo },
      provenanceStatus: sourceIds.length ? 'linked' : 'pending_source_link',
      completeness: sourceIds.length ? 'complete_for_local_review' : 'incomplete_until_source_linked',
    },
  };
}
