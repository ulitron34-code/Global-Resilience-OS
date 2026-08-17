import { VERTICALS } from '../data/verticals';
import { CABLE_MAP, CHOKEPOINTS } from '../data/cables';

// Baseline systemic impact: every monitored vertical carries this disruption floor
// when critical infrastructure fails because each depends on the same digital layer
// for AIS tracking, payment settlement, logistics coordination, and futures markets.
const SYSTEMIC_BASE_IMPACT = 0.12;

const SEVERITY_MULTIPLIER = {
  parcial: 0.35, // bandwidth degradation, partial redundancy active
  total: 1.0, // total outage, no redundancy available
};

function computeImpactSingle(cableId, severity = 'total', durationHours = 24) {
  const cable = CABLE_MAP[cableId];
  if (!cable) throw new Error(`Unknown cable: ${cableId}`);

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
      tier: directWeight >= 0.5 ? 'direct' : directWeight > 0 ? 'moderate' : 'systemic',
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
  const ids = String(cableId || '').split(',').map((id) => id.trim()).filter(Boolean);
  if (ids.length > 1) {
    const results = ids.map((id) => {
      try { return computeImpactSingle(id, severity, durationHours); } catch { return null; }
    }).filter(Boolean);

    if (results.length === 0) throw new Error(`No valid network point: ${cableId}`);

    const durationFraction = durationHours / 24;
    const affected = VERTICALS.map((v) => {
      const combinedImpactPct = Math.min(1.0, results.reduce((sum, r) => {
        const item = r.affected.find((av) => av.id === v.id);
        return sum + (item ? item.impactPct : 0);
      }, 0));
      const usdLoss = v.dailyFlowUsd * combinedImpactPct * durationFraction;
      const directWeight = Math.max(...results.map((r) => {
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
        tier: directWeight >= 0.5 ? 'direct' : directWeight > 0 ? 'moderate' : 'systemic',
      };
    }).sort((a, b) => b.usdLoss - a.usdLoss);

    const totalUsdLoss = affected.reduce((sum, v) => sum + v.usdLoss, 0);
    const chokepointLabels = Array.from(new Set(results.flatMap((r) => r.chokepoints)));
    const top3 = affected.slice(0, 3).map((v) => v.label).join(', ');

    return {
      cable: {
        id: cableId,
        name: `${results.length} Simultaneous Network Points`,
        route: `Combined events: ${results.map((r) => r.cable.name).join(' + ')}`,
        criticality: Math.max(...results.map((r) => r.cable.criticality)),
      },
      severity,
      durationHours,
      chokepoints: chokepointLabels,
      affected,
      totalUsdLoss,
      verticalsAffectedCount: affected.filter((v) => v.impactPct > 0.05).length,
      narrative: `A simultaneous chained disruption across ${results.map((r) => r.cable.name).join(' and ')} over ${durationHours}h would put ${formatUsd(totalUsdLoss)} of value at risk through overlapping physical and digital bottlenecks. Exposure is concentrated in ${top3}, with secondary effects propagating through logistics coordination, settlement timing, and commodity-flow visibility.`,
    };
  }

  return computeImpactSingle(cableId, severity, durationHours);
}

function buildNarrative(cable, affected, chokepoints, severity, durationHours, totalUsdLoss) {
  const top3 = affected.slice(0, 3).map((v) => v.label).join(', ');
  const severityText = severity === 'total' ? 'total outage' : 'partial degradation';
  const chokepointText = chokepoints.length
    ? ` The route crosses ${chokepoints.join(' and ')}, amplifying correlation with physical commodity flows.`
    : '';

  return `A ${severityText} affecting ${cable.name} for ${durationHours}h would put ${formatUsd(totalUsdLoss)} of value at risk, concentrated primarily in ${top3}.${chokepointText} ` +
    `The ${affected.filter((v) => v.tier === 'systemic').length} remaining verticals absorb a smaller but simultaneous systemic impact through logistics coordination disruption and payment-settlement friction, a cross-market exposure pattern that single-vertical risk platforms (Kpler, Windward, Everstream) typically do not capture.`;
}

export function formatUsd(value) {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}
