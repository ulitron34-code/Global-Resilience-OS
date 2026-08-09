import { computeImpact } from '../engine/impactEngine.js';

const DEFAULT_HORIZONS = [24, 168, 720];
const OPTIONS = [
  { id: 'no_action', label: 'Sin intervención', responseHours: 0, effectiveness: 0, costUsd: 0 },
  { id: 'reroute', label: 'Redirigir flujo o tráfico', responseHours: 12, effectiveness: 0.42, costUsd: 120000 },
  { id: 'alternate_provider', label: 'Activar proveedor alterno', responseHours: 36, effectiveness: 0.58, costUsd: 260000 },
  { id: 'contingency_capacity', label: 'Comprar capacidad de contingencia', responseHours: 6, effectiveness: 0.72, costUsd: 410000 },
];

function clone(value) { return structuredClone(value); }
function positive(value, fallback = 0) { const number = Number(value); return Number.isFinite(number) && number >= 0 ? number : fallback; }

export function buildRecoveryProfile(input = {}) {
  const profile = buildRecoveryProfileBase(input);
  const effectiveResilienceIndex = profile.bestByHorizon.map(({ horizonHours, optionId }) => {
    const option = profile.options.find((item) => item.id === optionId) || profile.options.find((item) => item.id === 'no_action');
    const result = option?.results.find((item) => item.horizonHours === horizonHours) || { baselineExposureUsd: 0, residualExposureUsd: 0, avoidedLossUsd: 0, recoveredFraction: 0 };
    return { horizonHours, optionId: option?.id || 'no_action', indexPct: Number((result.recoveredFraction * 100).toFixed(1)), baselineExposureUsd: result.baselineExposureUsd, residualExposureUsd: result.residualExposureUsd, avoidedLossUsd: result.avoidedLossUsd, evidenceClass: 'assumed', calculation: 'best_local_counterfactual_recovered_fraction' };
  });
  return { ...profile, effectiveResilienceIndex };
}

function buildRecoveryProfileBase(input = {}) {
  const cableId = String(input.cableId || 'seamewe3');
  const severity = input.severity === 'parcial' ? 'parcial' : 'total';
  const horizons = (Array.isArray(input.horizons) ? input.horizons : DEFAULT_HORIZONS).map((value) => Math.round(positive(value))).filter((value) => value > 0 && value <= 8760).slice(0, 6);
  if (!horizons.length) throw new Error('Se requiere al menos un horizonte positivo');
  const dailyImpact = computeImpact(cableId, severity, 24);
  const recoveryHours = severity === 'total' ? 240 : 96;
  const baseline = horizons.map((hours) => ({ horizonHours: hours, exposureUsd: Math.round(dailyImpact.totalUsdLoss * hours / 24) }));
  const requestedOptions = Array.isArray(input.options) && input.options.length ? input.options : OPTIONS.map((item) => item.id);
  const options = requestedOptions.map((id) => {
    const template = OPTIONS.find((item) => item.id === id);
    if (!template) return null;
    const costUsd = positive(input.costs?.[id], template.costUsd);
    const effectiveness = Math.min(0.95, Math.max(0, Number(input.effectiveness?.[id] ?? template.effectiveness)));
    const results = horizons.map((horizonHours) => {
      const baselineExposureUsd = Math.round(dailyImpact.totalUsdLoss * horizonHours / 24);
      const activeHours = Math.max(0, horizonHours - template.responseHours);
      const timeRecovery = template.id === 'no_action' ? 0 : Math.min(0.9, activeHours / (activeHours + recoveryHours));
      const recoveredFraction = Math.min(0.95, timeRecovery * effectiveness);
      const avoidedLossUsd = Math.round(baselineExposureUsd * recoveredFraction);
      return { horizonHours, baselineExposureUsd, recoveredFraction: Number(recoveredFraction.toFixed(4)), residualExposureUsd: baselineExposureUsd - avoidedLossUsd, avoidedLossUsd, netValueUsd: avoidedLossUsd - costUsd };
    });
    return { id: template.id, label: template.label, responseHours: template.responseHours, effectiveness, costUsd, results };
  }).filter(Boolean);
  const bestByHorizon = horizons.map((horizonHours) => {
    const candidates = options.filter((option) => option.id !== 'no_action').map((option) => ({ id: option.id, netValueUsd: option.results.find((result) => result.horizonHours === horizonHours)?.netValueUsd || 0 }));
    return { horizonHours, optionId: candidates.sort((a, b) => b.netValueUsd - a.netValueUsd)[0]?.id || 'no_action' };
  });
  return { schemaVersion: '1.0.0-local', generatedAt: new Date().toISOString(), cable: dailyImpact.cable, severity, baseline, options: clone(options), bestByHorizon, recoveryAssumptions: { naturalRecoveryHours: recoveryHours, systemicImpactModel: 'heuristic_local', inputDurationHours: positive(input.durationHours, 24) }, disclaimer: 'Perfil de recuperación contrafactual basado en supuestos locales. No es una predicción ni sustituye calibración histórica, datos licenciados o aprobación humana.' };
}
