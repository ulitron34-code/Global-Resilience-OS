export function enrichAnonymousSectorBenchmark(benchmark = {}) {
  const sectors = Array.isArray(benchmark.sectors) ? benchmark.sectors : [];
  const published = sectors.filter((item) => item.vertical !== 'withheld');
  const completedOutcomes = Number(benchmark.totals?.completedOutcomes) || 0;
  const readiness = completedOutcomes === 0
    ? 'abstain_no_observed_outcomes'
    : published.length === 0
      ? 'abstain_insufficient_cohort'
      : 'local_descriptive_only';
  return {
    ...benchmark,
    sectors: sectors.map((item) => item.vertical === 'withheld'
      ? { ...item, evidenceClass: 'withheld', marketClaimAllowed: false }
      : { ...item, evidenceClass: 'observed_local_outcome', marketClaimAllowed: false, status: 'published_local_descriptive' }),
    readiness: { status: readiness, observedOutcomes: completedOutcomes, publishedSectors: published.length, externalValidationRequired: true },
    evidencePolicy: { requiresCompletedOutcomes: true, requiresMinimumCohort: true, requiresLicensedHistoricalDataForProduction: true, marketClaimAllowed: false, disclaimer: 'Benchmark local descriptivo; no representa una referencia estadística de mercado ni valida precisión productiva.' },
  };
}
