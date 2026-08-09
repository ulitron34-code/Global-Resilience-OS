import { useEffect, useState } from 'react';
import { getOverviewMetrics } from '../api/client';
import { useAppStore } from '../store/useAppStore';

const STATIC_KPIS = [
  { label: 'TAM', value: '$600B', sub: 'volumen anual commodities' },
  { label: 'Verticales', value: '12', sub: 'monitoreadas simultáneamente' },
  { label: 'Chokepoints', value: '4', sub: 'Ormuz · Suez · Malaca · Bab-el-Mandeb' },
];

export default function KpiBar({ vertical = 'Oil & Gas' }) {
  const cables = useAppStore((s) => s.cables);
  const [metrics, setMetrics] = useState(null);
  useEffect(() => { getOverviewMetrics({ vertical }).then(setMetrics); }, [vertical]);
  const dynamic = [
    { label: 'Exposición abierta', value: formatUsd(metrics?.exposureUsd), sub: `${metrics?.openCases ?? '—'} casos activos` },
    { label: 'Alertas abiertas', value: metrics?.openAlerts ?? '—', sub: 'priorizadas por impacto' },
  ];
  return <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-line border border-line rounded-lg overflow-hidden">{[...STATIC_KPIS, ...dynamic].map((kpi) => <Kpi key={kpi.label} {...kpi} />)}<Kpi label="Cables monitoreados" value={cables.length} sub="rutas críticas activas" /></div>;
}

function Kpi({ label, value, sub }) { return <div className="bg-panel px-4 py-3"><div className="font-mono text-[10px] uppercase tracking-widest text-ink-dim">{label}</div><div className="font-display font-semibold text-xl text-ink mt-0.5">{value}</div><div className="text-[11px] text-ink-muted mt-0.5">{sub}</div></div>; }
function formatUsd(value) { if (!Number.isFinite(value)) return '—'; if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`; if (value >= 1000) return `$${Math.round(value / 1000)}K`; return `$${Math.round(value)}`; }
