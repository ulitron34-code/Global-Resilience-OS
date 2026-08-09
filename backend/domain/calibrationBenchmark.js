import { filterEligibleCalibrationFixtures, getCalibrationEligibility } from './calibrationEligibility.js';

export function benchmarkCalibration(overview) {
  const inputFixtures = Array.isArray(overview?.fixtures) ? overview.fixtures : [];
  const fixtures = filterEligibleCalibrationFixtures(inputFixtures);
  const excludedIllustrativeFixtureCount = inputFixtures.filter((fixture) => getCalibrationEligibility(fixture).reason === 'illustrative_source').length;
  if (!fixtures.length) {
    return {
      scope: 'local-platform', status: 'insufficient_sample', fixtureCount: 0,
      inputFixtureCount: inputFixtures.length, excludedIllustrativeFixtureCount,
      baseline: 'mean_observed_impact', modelMaeUsd: null, baselineMaeUsd: null,
      improvementPct: null, gate: 'abstain_no_fixtures',
      disclaimer: 'No existe evidencia historica elegible suficiente para evaluar mejora.'
    };
  }
  const mean = fixtures.reduce((sum, item) => sum + Number(item.observedImpactUsd), 0) / fixtures.length;
  const mae = (values) => values.reduce((sum, value) => sum + Math.abs(value), 0) / values.length;
  const modelMaeUsd = mae(fixtures.map((item) => Number(item.predictedImpactUsd) - Number(item.observedImpactUsd)));
  const baselineMaeUsd = mae(fixtures.map((item) => mean - Number(item.observedImpactUsd)));
  const improvementPct = baselineMaeUsd === 0 ? 0 : Number(((1 - modelMaeUsd / baselineMaeUsd) * 100).toFixed(2));
  const enough = fixtures.length >= 3;
  return {
    scope: 'local-platform', status: enough ? 'ready_for_review' : 'insufficient_sample',
    fixtureCount: fixtures.length, inputFixtureCount: inputFixtures.length,
    excludedIllustrativeFixtureCount, baseline: 'mean_observed_impact', modelMaeUsd,
    baselineMaeUsd, improvementPct,
    gate: enough && modelMaeUsd < baselineMaeUsd ? 'candidate_improves_baseline' : enough ? 'abstain_no_improvement' : 'abstain_insufficient_sample',
    disclaimer: 'La comparacion solo demuestra desempeno sobre fixtures historicos elegibles; no sustituye backtesting independiente con eventos licenciados.'
  };
}
