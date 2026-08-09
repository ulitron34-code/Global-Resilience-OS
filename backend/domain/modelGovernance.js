export function buildModelGovernance(model, validation, calibration, benchmark) {
  const validationReady = Boolean(validation?.ready);
  const benchmarkReady = benchmark?.gate === 'candidate_improves_baseline';
  const productionReady = validationReady && benchmarkReady && model?.status !== 'demo';
  return { model: structuredClone(model), validation: structuredClone(validation), calibration: structuredClone(calibration), benchmark: structuredClone(benchmark), decision: productionReady ? 'candidate_for_human_review' : 'abstain_for_production', gates: { invariants: validationReady, historicalBenchmark: benchmarkReady, nonDemoStatus: model?.status !== 'demo' }, requiredEvidence: ['licensed_historical_fixtures', 'independent_backtest', 'analyst_review', 'model_change_approval'], disclaimer: 'Gobernanza local de modelo; no certifica precision, causalidad ni aptitud productiva.' };
}
