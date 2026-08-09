import { VERTICALS, VERTICAL_MAP } from '../data/verticals.js';
import { CABLE_MAP, CHOKEPOINTS } from '../data/cables.js';
import { buildEvidence } from '../domain/evidenceClassification.js';

// Impacto sistémico base: TODAS las verticales sufren este piso de disrupción
// cuando un cable crítico se rompe, porque dependen de la misma capa de
// infraestructura digital (AIS tracking, liquidación de pagos, coordinación
// logística, mercados de futuros). Este es el argumento central del producto:
// el riesgo de cables NO es aislado a una industria — es sistémico.
const SYSTEMIC_BASE_IMPACT = 0.12;

const SEVERITY_MULTIPLIER = {
  parcial: 0.35, // degradación de ancho de banda, redundancia parcial activa
  total: 1.0,     // corte total, sin redundancia disponible
};

/**
 * Calcula el impacto en cascada de la ruptura de un cable sobre las 12 verticales.
 * @param {string} cableId
 * @param {'parcial'|'total'} severity
 * @param {number} durationHours
 */
export function computeImpact(cableId, severity = 'total', durationHours = 24) {
  const cable = CABLE_MAP[cableId];
  if (!cable) throw new Error(`Cable desconocido: ${cableId}`);

  const severityMult = SEVERITY_MULTIPLIER[severity] ?? 1.0;
  const durationFraction = durationHours / 24;

  const affected = VERTICALS.map((v) => {
    const directWeight = cable.vertical_weights[v.id] ?? 0;
    // El impacto efectivo combina la exposición directa (si el cable pasa por
    // una zona de alta correlación con esa vertical) con el piso sistémico.
    const effectiveWeight = Math.min(1, directWeight + SYSTEMIC_BASE_IMPACT * (1 - directWeight));
    const impactPct = effectiveWeight * severityMult;
    const usdLoss = v.dailyFlowUsd * impactPct * durationFraction;

    return {
      id: v.id,
      label: v.label,
      color: v.color,
      directWeight,
      impactPct,
      usdLoss,
      evidenceClass: 'assumed',
      tier: directWeight >= 0.5 ? 'directo' : directWeight > 0 ? 'moderado' : 'sistémico',
    };
  }).sort((a, b) => b.usdLoss - a.usdLoss);

  const totalUsdLoss = affected.reduce((sum, v) => sum + v.usdLoss, 0);
  const chokepointLabels = cable.chokepoints.map((cp) => CHOKEPOINTS[cp]?.label).filter(Boolean);

  return {
    cable: { id: cable.id, name: cable.name, route: cable.route, criticality: cable.criticality },
    severity,
    durationHours,
    chokepoints: chokepointLabels,
    affected,
    totalUsdLoss,
    verticalsAffectedCount: affected.filter((v) => v.impactPct > 0.05).length,
    evidence: buildEvidence({ evidenceClass: 'assumed', sourceIds: ['cables-demo', 'verticals-demo'], modelId: 'impact-cascade', modelVersion: '0.5.0', inferred: ['exposure_weight', 'systemic_impact_floor', 'economic_loss'], assumptions: ['Illustrative daily flows', 'Heuristic cable-vertical weights', '12% systemic impact floor'] }),
    narrative: buildNarrative(cable, affected, chokepointLabels, severity, durationHours, totalUsdLoss),
  };
}

function buildNarrative(cable, affected, chokepoints, severity, durationHours, totalUsdLoss) {
  const top3 = affected.slice(0, 3).map((v) => v.label).join(', ');
  const severityText = severity === 'total' ? 'corte total' : 'degradación parcial';
  const chokepointText = chokepoints.length
    ? ` La ruta cruza ${chokepoints.join(' y ')}, amplificando la correlación con flujos físicos de commodities.`
    : '';

  return `Un ${severityText} en ${cable.name} durante ${durationHours}h generaría pérdidas estimadas de ` +
    `${formatUsd(totalUsdLoss)}, concentradas principalmente en ${top3}.${chokepointText} ` +
    `Las ${affected.filter(v => v.tier === 'sistémico').length} verticales restantes absorben un impacto sistémico ` +
    `menor pero simultáneo, vía disrupción de coordinación logística y liquidación de pagos — el patrón que ` +
    `las plataformas de riesgo actuales (Kpler, Windward, Everstream) no capturan porque monitorean cada ` +
    `vertical de forma aislada.`;
}

export function formatUsd(value) {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}
