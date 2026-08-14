import { VERTICALS } from '../data/verticals';
import { CABLE_MAP, CHOKEPOINTS } from '../data/cables';

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

function computeImpactSingle(cableId, severity = 'total', durationHours = 24) {
  const cable = CABLE_MAP[cableId];
  if (!cable) throw new Error(`Cable desconocido: ${cableId}`);

  const severityMult = SEVERITY_MULTIPLIER[severity] ?? 1.0;
  const durationFraction = durationHours / 24;

  const affected = VERTICALS.map((v) => {
    const directWeight = cable.vertical_weights[v.id] ?? 0;
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
    narrative: buildNarrative(cable, affected, chokepointLabels, severity, durationHours, totalUsdLoss),
  };
}

export function computeImpact(cableId, severity = 'total', durationHours = 24) {
  const ids = String(cableId || '').split(',').map(id => id.trim()).filter(Boolean);
  if (ids.length > 1) {
    const results = ids.map(id => {
      try { return computeImpactSingle(id, severity, durationHours); } catch { return null; }
    }).filter(Boolean);

    if (results.length === 0) throw new Error(`Ningún punto de red válido: ${cableId}`);

    const durationFraction = durationHours / 24;
    const affected = VERTICALS.map((v) => {
      const combinedImpactPct = Math.min(1.0, results.reduce((sum, r) => {
        const item = r.affected.find(av => av.id === v.id);
        return sum + (item ? item.impactPct : 0);
      }, 0));
      const usdLoss = v.dailyFlowUsd * combinedImpactPct * durationFraction;
      const directWeight = Math.max(...results.map(r => {
        const cable = CABLE_MAP[r.cable.id];
        return cable ? (cable.vertical_weights[v.id] ?? 0) : 0;
      }));

      return {
        id: v.id,
        label: v.label,
        color: v.color,
        directWeight,
        impactPct: combinedImpactPct,
        usdLoss,
        tier: directWeight >= 0.5 ? 'directo' : directWeight > 0 ? 'moderado' : 'sistémico',
      };
    }).sort((a, b) => b.usdLoss - a.usdLoss);

    const totalUsdLoss = affected.reduce((sum, v) => sum + v.usdLoss, 0);
    const chokepointLabels = Array.from(new Set(results.flatMap(r => r.chokepoints)));

    return {
      cable: { 
        id: cableId, 
        name: `${results.length} Puntos de Red Simultáneos`, 
        route: `Eventos combinados: ${results.map(r => r.cable.name).join(' + ')}`, 
        criticality: Math.max(...results.map(r => r.cable.criticality)) 
      },
      severity,
      durationHours,
      chokepoints: chokepointLabels,
      affected,
      totalUsdLoss,
      verticalsAffectedCount: affected.filter((v) => v.impactPct > 0.05).length,
      narrative: `Una disrupción simultánea y concatenada en ${results.map(r => r.cable.name).join(' y ')} durante ${durationHours}h generaría pérdidas acumuladas de ${formatUsd(totalUsdLoss)} debido a la superposición de cuellos de botella físicos y digitales. Las verticales de ${affected.slice(0, 3).map(v => v.label).join(', ')} sufrirían el impacto más grave.`,
    };
  }

  return computeImpactSingle(cableId, severity, durationHours);
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
