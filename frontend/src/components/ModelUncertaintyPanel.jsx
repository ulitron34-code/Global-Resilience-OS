import { useEffect, useState } from 'react';
import { getModelSensitivity, getModelUncertainty } from '../api/client';

export default function ModelUncertaintyPanel() {
  const [sensitivity, setSensitivity] = useState(null);
  const [uncertainty, setUncertainty] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    Promise.all([
      getModelSensitivity({ cableId: 'seamewe3', durations: [6, 24, 72] }),
      getModelUncertainty({ pointEstimateUsd: 1000000, confidence: 0.45, fixtureCount: 0 }),
    ]).then(([nextSensitivity, nextUncertainty]) => { setSensitivity(nextSensitivity); setUncertainty(nextUncertainty); }).catch((err) => setError(err.message));
  }, []);
  return <div className="bg-panel border border-line rounded-lg p-4"><div className="flex items-start justify-between gap-3"><div><div className="font-mono text-[10px] uppercase tracking-widest text-signal">Model uncertainty</div><h2 className="font-display text-lg font-semibold text-ink mt-1">Assumptions, Ranges, and Abstention</h2></div><span className={`font-mono text-[10px] ${uncertainty?.decision === 'abstain_material_interval' ? 'text-alert' : 'text-signal'}`}>{uncertainty?.decision || 'LOADING'}</span></div><p className="text-xs text-ink-muted mt-2">The platform surfaces model consistency and avoids publishing material intervals when historical fixtures are insufficient.</p>{error && <div role="alert" className="text-xs text-alert mt-3">{error}</div>}<div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3"><div className="bg-void border border-line rounded p-3"><div className="font-mono text-[9px] text-ink-dim">SENSITIVITY</div><div className="font-display text-sm text-ink mt-1">{sensitivity?.decision || '—'}</div></div><div className="bg-void border border-line rounded p-3"><div className="font-mono text-[9px] text-ink-dim">MONOTONICITY</div><div className="font-display text-sm text-ink mt-1">{sensitivity ? (sensitivity.checks.durationMonotonic ? 'PASS' : 'REVIEW') : '—'}</div></div><div className="bg-void border border-line rounded p-3"><div className="font-mono text-[9px] text-ink-dim">INTERVAL</div><div className="font-display text-sm text-ink mt-1">{uncertainty?.interval ? 'AVAILABLE' : 'ABSTAIN'}</div></div><div className="bg-void border border-line rounded p-3"><div className="font-mono text-[9px] text-ink-dim">FIXTURES</div><div className="font-display text-sm text-ink mt-1">{uncertainty?.fixtureCount ?? '—'}</div></div></div>{uncertainty?.interval === null && <div className="text-[10px] text-alert mt-3">No material interval: at least 3 fixtures and minimum confidence of 0.5 are required.</div>}</div>;
}



