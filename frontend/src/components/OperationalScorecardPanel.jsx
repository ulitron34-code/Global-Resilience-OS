import { useEffect, useState } from 'react';
import { getOperationalScorecard } from '../api/client';

function formatUsd(value) { if (!Number.isFinite(value)) return '—'; if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`; if (value >= 1000) return `$${Math.round(value / 1000)}K`; return `$${Math.round(value)}`; }
function Metric({ label, value }) { return <div className="bg-void border border-line rounded p-3"><div className="font-mono text-[9px] uppercase tracking-widest text-ink-dim">{label}</div><div className="font-display text-lg font-semibold text-ink mt-1">{value}</div></div>; }

export default function OperationalScorecardPanel() {
  const [scorecard, setScorecard] = useState(null);
  useEffect(() => { getOperationalScorecard().then(setScorecard).catch(() => setScorecard(null)); }, []);
  if (!scorecard) return <div className="bg-panel border border-line rounded-lg p-4 text-xs text-ink-dim">Cargando scorecard operativo...</div>;
  const product = scorecard.product || {};
  const coverage = product.alerts?.provenanceCoverage;
  const closure = product.cases?.closureRate;
  const sourceReadiness = product.sources?.readinessRate;
  return <div className="bg-panel border border-line rounded-lg p-4"><div className="flex items-start justify-between gap-3"><div><div className="font-mono text-[10px] uppercase tracking-widest text-signal">Operational scorecard</div><h2 className="font-display text-lg font-semibold text-ink mt-1">Métricas del plan maestro</h2></div><span className="font-mono text-[10px] text-ink-dim">LOCAL</span></div><p className="text-xs text-ink-muted mt-2">Muestra qué métricas tienen evidencia local y cuáles permanecen pendientes del piloto.</p><div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-2 mt-3"><Metric label="Alertas" value={product.alerts?.total || 0} /><Metric label="Cobertura" value={coverage === null ? '—' : `${Math.round((coverage || 0) * 100)}%`} /><Metric label="Casos" value={product.cases?.total || 0} /><Metric label="Cierre" value={closure === null ? '—' : `${Math.round((closure || 0) * 100)}%`} /><Metric label="Acciones" value={product.actions?.completed || 0} /><Metric label="Fuentes OK" value={sourceReadiness === null ? '—' : `${Math.round((sourceReadiness || 0) * 100)}%`} /><Metric label="DLQ" value={product.deadLetters?.unresolved || 0} /><Metric label="Incidentes" value={product.incidents?.open || 0} /></div><div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3 text-xs"><div className="border border-line rounded p-3 text-ink-muted">Error modelo local: <span className="text-ink">{scorecard.models?.meanAbsoluteErrorUsd === null ? 'sin fixtures suficientes' : formatUsd(scorecard.models.meanAbsoluteErrorUsd)}</span></div><div className="border border-line rounded p-3 text-ink-muted">Pérdida evitada documentada: <span className="text-ink">{formatUsd(scorecard.business?.avoidedLossDocumentedUsd || 0)}</span></div></div></div>;
}
