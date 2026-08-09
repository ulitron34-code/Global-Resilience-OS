import { isIllustrativeSource } from './sourceClassification.js';

const DEFAULT_MODEL = { id: 'impact-cascade', version: '0.5.0-local' };

export function attachDecisionEvidence(plan, input = {}) {
  const sourceIds = Array.isArray(input.sourceIds)
    ? input.sourceIds.map(String).map((value) => value.trim()).filter(Boolean).slice(0, 20)
    : input.sourceId ? [String(input.sourceId).trim()] : [];
  const illustrativeSourceIds = sourceIds.filter((sourceId) => isIllustrativeSource({ id: sourceId }));
  const productionEligible = sourceIds.length > 0 && illustrativeSourceIds.length === 0;
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
      provenanceStatus: !sourceIds.length ? 'pending_source_link' : illustrativeSourceIds.length ? 'linked_illustrative' : 'linked',
      completeness: sourceIds.length ? 'complete_for_local_review' : 'incomplete_until_source_linked',
      illustrativeSourceIds,
      productionEligible,
      productionDecision: !sourceIds.length ? 'abstain_missing_source' : illustrativeSourceIds.length ? 'abstain_illustrative_source' : 'eligible_for_quality_gate',
    },
  };
}
