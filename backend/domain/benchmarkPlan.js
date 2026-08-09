import { filterEligibleCalibrationFixtures } from './calibrationEligibility.js';

export const HISTORICAL_EVENT_TARGET = 10;
export const MINIMUM_BACKTEST_EVENTS = 3;

export function buildHistoricalBenchmarkPlan(fixtures = []) {
  const input = Array.isArray(fixtures) ? fixtures : [];
  const eligible = filterEligibleCalibrationFixtures(input);
  const filledEvents = eligible.slice(0, HISTORICAL_EVENT_TARGET).map((fixture) => ({
    id: fixture.id,
    eventDate: fixture.eventDate,
    sourceId: fixture.sourceId || null,
    assetId: fixture.assetId || null,
    evidenceStatus: fixture.evidenceStatus || 'complete',
  }));
  const eligibleCount = eligible.length;
  const targetReached = eligibleCount >= HISTORICAL_EVENT_TARGET;
  const backtestReady = eligibleCount >= MINIMUM_BACKTEST_EVENTS;
  return {
    schemaVersion: '1.0.0-local-benchmark-plan',
    status: targetReached ? 'target_reached' : backtestReady ? 'ready_for_initial_review' : 'insufficient_sample',
    targetEventCount: HISTORICAL_EVENT_TARGET,
    minimumBacktestEventCount: MINIMUM_BACKTEST_EVENTS,
    inputFixtureCount: input.length,
    eligibleEventCount: eligibleCount,
    remainingTargetSlots: Math.max(0, HISTORICAL_EVENT_TARGET - eligibleCount),
    filledEvents,
    gates: {
      initialBacktest: backtestReady ? 'ready_for_review' : 'abstain_insufficient_sample',
      targetBenchmark: targetReached ? 'ready_for_review' : 'pending_historical_evidence',
      productionClaim: 'abstain_until_licensed_review',
    },
    disclaimer: 'Plan de benchmark local. Los slots faltantes requieren eventos históricos autorizados; no se generan fixtures sintéticas para cerrar el gate.',
  };
}
