export function buildUncertaintyReport(input = {}) {
  const pointEstimateUsd = Number(input.pointEstimateUsd);
  const confidence = Number(input.confidence);
  const fixtureCount = Number(input.fixtureCount || 0);
  const valid = Number.isFinite(pointEstimateUsd) && pointEstimateUsd >= 0 && Number.isFinite(confidence) && confidence >= 0 && confidence <= 1;
  if (!valid) throw new Error('pointEstimateUsd y confidence inválidos');
  const enoughEvidence = fixtureCount >= 3 && confidence >= 0.5;
  const relativeWidth = enoughEvidence ? Math.max(0.1, (1 - confidence) * 1.5) : null;
  const interval = relativeWidth === null ? null : { lowerUsd: Math.max(0, pointEstimateUsd * (1 - relativeWidth)), upperUsd: pointEstimateUsd * (1 + relativeWidth), level: Math.round(confidence * 100) };
  return { schemaVersion: '1.0.0-local', pointEstimateUsd, confidence, fixtureCount, status: enoughEvidence ? 'interval_available_for_review' : 'insufficient_evidence', decision: enoughEvidence ? 'show_with_disclaimer' : 'abstain_material_interval', interval, assumptions: ['El intervalo es una envolvente heurística hasta contar con calibración histórica suficiente.', 'No representa un intervalo estadístico validado.', 'La decisión material requiere procedencia, calidad de datos y revisión humana.'], disclaimer: 'Incertidumbre local no calibrada estadísticamente; no debe presentarse como precisión predictiva.' };
}
