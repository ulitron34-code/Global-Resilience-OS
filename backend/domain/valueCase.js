function number(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function buildValueCase(input = {}) {
  const annualEvents = Math.max(0, number(input.annualEvents));
  const lossPerEventUsd = Math.max(0, number(input.lossPerEventUsd));
  const mitigationRate = Math.min(1, Math.max(0, number(input.mitigationRate))); 
  const platformAnnualCostUsd = Math.max(0, number(input.platformAnnualCostUsd));
  const implementationCostUsd = Math.max(0, number(input.implementationCostUsd));
  const evidenceRefs = Array.isArray(input.evidenceRefs) ? input.evidenceRefs.map(String).filter(Boolean).slice(0, 20) : [];
  const grossAnnualExposureUsd = annualEvents * lossPerEventUsd;
  const protectedValueUsd = grossAnnualExposureUsd * mitigationRate;
  const annualNetValueUsd = protectedValueUsd - platformAnnualCostUsd;
  const firstYearNetValueUsd = annualNetValueUsd - implementationCostUsd;
  const annualBenefitCostRatio = platformAnnualCostUsd > 0 ? protectedValueUsd / platformAnnualCostUsd : null;
  const paybackMonths = protectedValueUsd > 0 ? (platformAnnualCostUsd + implementationCostUsd) / protectedValueUsd * 12 : null;
  const evidenceStatus = evidenceRefs.length >= 2 ? 'evidence_attached' : 'assumption_only';
  const gate = evidenceStatus === 'evidence_attached' && firstYearNetValueUsd > 0 ? 'ready_for_human_review' : 'not_ready';
  return {
    schemaVersion: '1.0.0-local',
    status: gate,
    evidenceClass: evidenceStatus === 'evidence_attached' ? 'inferred' : 'assumed',
    inputs: { annualEvents, lossPerEventUsd, mitigationRate, platformAnnualCostUsd, implementationCostUsd, evidenceRefs },
    outputs: {
      grossAnnualExposureUsd: Math.round(grossAnnualExposureUsd * 100) / 100,
      protectedValueUsd: Math.round(protectedValueUsd * 100) / 100,
      annualNetValueUsd: Math.round(annualNetValueUsd * 100) / 100,
      firstYearNetValueUsd: Math.round(firstYearNetValueUsd * 100) / 100,
      annualBenefitCostRatio: annualBenefitCostRatio === null ? null : Math.round(annualBenefitCostRatio * 100) / 100,
      paybackMonths: paybackMonths === null ? null : Math.round(paybackMonths * 100) / 100,
    },
    gates: { evidence: evidenceStatus === 'evidence_attached', positiveFirstYearValue: firstYearNetValueUsd > 0, humanApprovalRequired: true, willingnessToPayValidated: false },
    nextEvidence: evidenceStatus === 'assumption_only' ? ['dos fuentes verificables de pérdida o tiempo recuperado', 'validación del sponsor', 'precio o presupuesto real del piloto'] : ['validación del sponsor', 'precio o presupuesto real del piloto'],
    disclaimer: 'Estimación local de caso económico. No demuestra costo evitado, ROI de mercado ni willingness-to-pay; requiere evidencia del cliente y revisión humana.',
  };
}
