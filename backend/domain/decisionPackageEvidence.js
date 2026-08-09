export function summarizeActionPlanEvidence(actionPlans = []) {
  const plans = Array.isArray(actionPlans) ? actionPlans : [];
  const productionEligible = plans.filter((plan) => plan?.evidence?.productionEligible === true).length;
  const illustrativeLinked = plans.filter((plan) => plan?.evidence?.productionDecision === 'abstain_illustrative_source').length;
  const missingSource = plans.filter((plan) => plan?.evidence?.productionDecision === 'abstain_missing_source').length;
  return {
    total: plans.length,
    productionEligible,
    illustrativeLinked,
    missingSource,
    productionEligibilityRate: plans.length ? Number((productionEligible / plans.length).toFixed(4)) : null,
    disclaimer: 'Elegibilidad local basada en procedencia declarada; requiere validacion externa antes de una recomendacion material.',
  };
}
