import { useEffect, useState } from 'react';
import { getSectorBenchmark } from '../api/client';

export default function SectorBenchmarkPanel() {
  const [benchmark, setBenchmark] = useState({ sectors: [], totals: {}, readiness: { status: 'loading' }, evidencePolicy: { marketClaimAllowed: false } });
  useEffect(() => { getSectorBenchmark(3).then(setBenchmark); }, []);
  const published = (benchmark.sectors || []).filter((item) => item.vertical !== 'withheld');
  return <section className="bg-panel border border-line rounded-lg p-4"><div className="flex items-start justify-between gap-3"><div><div className="font-mono text-[10px] uppercase tracking-widest text-signal">Sector benchmark</div><h2 className="font-display text-lg font-semibold text-ink mt-1">Descriptive comparison</h2></div><span className={`font-mono text-[10px] ${benchmark.readiness?.status === 'local_descriptive_only' ? 'text-signal' : 'text-alert'}`}>{benchmark.readiness?.status}</span></div><p className="text-xs text-ink-muted mt-2">Aggregate outcomes with k-anonymity. Small cohorts are hidden and results are never converted into a market claim.</p><div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3"><Metric label="Outcomes" value={benchmark.totals?.completedOutcomes || 0} /><Metric label="Cohorts" value={published.length} /><Metric label="Minimum k" value={benchmark.kAnonymity?.minimumCohort || 3} /><Metric label="Market claim" value="BLOQUEADO" /></div>{published.length ? <div className="mt-3 space-y-1">{published.map((item) => <div key={item.vertical} className="border border-line rounded p-2 flex justify-between gap-3 text-xs"><span className="text-ink-muted">{item.vertical}</span><span className="font-mono text-[10px] text-signal">MAE {item.meanAbsoluteForecastErrorPct}% · {item.cohortSize} casos</span></div>)}</div> : <div className="mt-3 text-xs text-alert">No publishable cohort: observed outcomes and a minimum size are required.</div>}</section>;
}

function Metric({ label, value }) { return <div className="bg-void border border-line rounded p-3"><div className="font-mono text-[9px] uppercase tracking-widest text-ink-dim">{label}</div><div className="font-display text-sm font-semibold text-ink mt-1 truncate">{value}</div></div>; }

