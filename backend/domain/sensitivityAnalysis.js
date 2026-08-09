import { computeImpact } from '../engine/impactEngine.js';

const SEVERITIES = ['parcial', 'total'];

export function buildSensitivityAnalysis(input = {}) {
  const cableId = String(input.cableId || 'seamewe3');
  const durations = Array.isArray(input.durations) && input.durations.length ? input.durations.map(Number) : [6, 24, 72, 168];
  if (durations.length > 12 || durations.some((value) => !Number.isFinite(value) || value <= 0 || value > 2160)) throw new Error('durations inválidas');
  const scenarios = [];
  for (const severity of SEVERITIES) for (const durationHours of durations) {
    const result = computeImpact(cableId, severity, durationHours);
    scenarios.push({ severity, durationHours, totalUsdLoss: result.totalUsdLoss, affectedVerticals: result.affected.length, confidence: result.confidence ?? null });
  }
  const bySeverity = Object.fromEntries(SEVERITIES.map((severity) => [severity, scenarios.filter((item) => item.severity === severity)]));
  const monotonicity = SEVERITIES.map((severity) => {
    const rows = bySeverity[severity];
    return { severity, durationMonotonic: rows.every((row, index) => index === 0 || row.totalUsdLoss >= rows[index - 1].totalUsdLoss), minLossUsd: Math.min(...rows.map((row) => row.totalUsdLoss)), maxLossUsd: Math.max(...rows.map((row) => row.totalUsdLoss)) };
  });
  const partialAtMax = bySeverity.parcial.at(-1)?.totalUsdLoss || 0;
  const totalAtMax = bySeverity.total.at(-1)?.totalUsdLoss || 0;
  return { schemaVersion: '1.0.0-local', cableId, scenarios, ranges: monotonicity, checks: { durationMonotonic: monotonicity.every((item) => item.durationMonotonic), severityDominanceAtMaxDuration: totalAtMax >= partialAtMax }, decision: monotonicity.every((item) => item.durationMonotonic) && totalAtMax >= partialAtMax ? 'exploratory_sensitivity_ready' : 'abstain_inconsistent', disclaimer: 'Análisis de sensibilidad local; no prueba causalidad ni sustituye backtesting histórico, datos licenciados o revisión experta.' };
}
