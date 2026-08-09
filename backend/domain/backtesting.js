function mean(values) { return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null; }
function median(values) { if (!values.length) return null; const sorted = [...values].sort((a, b) => a - b); const middle = Math.floor(sorted.length / 2); return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2; }

export function buildBacktestReport(fixtures = [], options = {}) {
  const eligible = fixtures.filter((item) => item.evidenceStatus === 'complete' && Number.isFinite(Number(item.observedImpactUsd)) && Number.isFinite(Number(item.predictedImpactUsd)) && Number(item.observedImpactUsd) >= 0 && Number(item.predictedImpactUsd) >= 0);
  const observed = eligible.map((item) => Number(item.observedImpactUsd));
  const baselineValue = options.baselineValue === undefined ? median(observed) : Number(options.baselineValue);
  const modelErrors = eligible.map((item) => Math.abs(Number(item.predictedImpactUsd) - Number(item.observedImpactUsd)));
  const baselineErrors = eligible.map((item) => Math.abs(baselineValue - Number(item.observedImpactUsd)));
  const modelMaeUsd = mean(modelErrors);
  const baselineMaeUsd = mean(baselineErrors);
  const improvementPct = modelMaeUsd === null || !baselineMaeUsd ? null : ((baselineMaeUsd - modelMaeUsd) / baselineMaeUsd) * 100;
  const minimum = 3;
  const enoughSample = eligible.length >= minimum;
  const improvesBaseline = enoughSample && improvementPct !== null && improvementPct > 0;
  return { schemaVersion: '1.0.0-local', scope: options.modelId || 'all', status: !enoughSample ? 'insufficient_sample' : improvesBaseline ? 'improves_baseline' : 'does_not_improve_baseline', decision: !enoughSample ? 'abstain_for_production' : improvesBaseline ? 'candidate_for_human_review' : 'exploratory_only', sample: { eligible: eligible.length, minimum, enough: enoughSample }, baseline: { method: 'median_observed_impact', valueUsd: baselineValue, maeUsd: baselineMaeUsd }, model: { maeUsd: modelMaeUsd, errorsUsd: modelErrors }, improvementPct, fixtures: eligible.map((item) => ({ id: item.id, eventDate: item.eventDate, observedImpactUsd: Number(item.observedImpactUsd), predictedImpactUsd: Number(item.predictedImpactUsd), errorUsd: Math.abs(Number(item.predictedImpactUsd) - Number(item.observedImpactUsd)), sourceId: item.sourceId || null })), disclaimer: 'Backtest local; requiere eventos históricos representativos, procedencia verificable y revisión experta. No demuestra precisión comercial.' };
}
