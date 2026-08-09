import { filterEligibleCalibrationFixtures } from './calibrationEligibility.js';

export function benchmarkCalibration(overview) {
  const fixtures = filterEligibleCalibrationFixtures(Array.isArray(overview?.fixtures) ? overview.fixtures : []);
  if (!fixtures.length) return { scope: 'local-platform', status: 'insufficient_sample', fixtureCount: 0, baseline: 'mean_observed_impact', modelMaeUsd: null, baselineMaeUsd: null, improvementPct: null, gate: 'abstain_no_fixtures', disclaimer: 'No existe evidencia histórica suficiente para evaluar mejora.' };
  const mean = fixtures.reduce((sum, item) => sum + Number(item.observedImpactUsd), 0) / fixtures.length;
  const mae = (values) => values.reduce((sum, value) => sum + Math.abs(value), 0) / values.length;
  const modelMaeUsd = mae(fixtures.map((item) => Number(item.predictedImpactUsd) - Number(item.observedImpactUsd)));
  const baselineMaeUsd = mae(fixtures.map((item) => mean - Number(item.observedImpactUsd)));
  const improvementPct = baselineMaeUsd === 0 ? 0 : Number(((1 - modelMaeUsd / baselineMaeUsd) * 100).toFixed(2));
  const enough = fixtures.length >= 3;
  return { scope: 'local-platform', status: enough ? 'ready_for_review' : 'insufficient_sample', fixtureCount: fixtures.length, baseline: 'mean_observed_impact', modelMaeUsd, baselineMaeUsd, improvementPct, gate: enough && modelMaeUsd < baselineMaeUsd ? 'candidate_improves_baseline' : enough ? 'abstain_no_improvement' : 'abstain_insufficient_sample', disclaimer: 'La comparación sólo demuestra desempeño sobre fixtures cargados; no sustituye backtesting independiente con eventos históricos licenciados.' };
}
