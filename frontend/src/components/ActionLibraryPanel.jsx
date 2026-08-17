import { useEffect, useState } from 'react';
import { getActionLibrary, recommendActions } from '../api/client';

function formatUsd(value) { return `$${Math.round(value || 0).toLocaleString()}`; }

export default function ActionLibraryPanel() {
  const [actions, setActions] = useState([]);
  const [recommendations, setRecommendations] = useState(null);
  const [budget, setBudget] = useState('500000');
  const [horizon, setHorizon] = useState('72');
  const [error, setError] = useState('');
  useEffect(() => { getActionLibrary().then(setActions); }, []);
  const recommend = async (event) => { event.preventDefault(); setError(''); try { setRecommendations(await recommendActions({ budgetUsd: Number(budget), horizonHours: Number(horizon) })); } catch (err) { setError(err.message); } };
  return <div className="bg-panel border border-line rounded-lg p-4"><div className="font-mono text-[10px] uppercase tracking-widest text-signal">Action marketplace seed</div><h2 className="font-display text-lg font-semibold text-ink mt-1">Mitigation library</h2><p className="text-xs text-ink-muted mt-2">Compare measures, alternate providers, and prerequisites before creating a plan. The local catalog does not confirm availability.</p><form onSubmit={recommend} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2 mt-4"><input className="control" type="number" min="0" value={budget} onChange={(event) => setBudget(event.target.value)} aria-label="Maximum budget" placeholder="Maximum budget USD" /><input className="control" type="number" min="0" value={horizon} onChange={(event) => setHorizon(event.target.value)} aria-label="Maximum horizon" placeholder="Maximum horizon (h)" /><button className="bg-signal text-void rounded px-3 py-2 text-xs font-semibold">Recommend</button></form>{error && <div className="text-xs text-alert mt-3" role="alert">{error}</div>}<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 mt-4">{(recommendations?.candidates || actions).map((action) => <div key={action.id} className="border border-line rounded p-3"><div className="text-xs text-ink">{action.name}</div><div className="font-mono text-[10px] text-signal mt-2">{action.providerType} · {action.leadTimeHours}h · {formatUsd(action.estimatedCostUsd)}</div><div className="text-[10px] text-ink-dim mt-2">Requires: {action.prerequisites.join(', ')}</div></div>)}</div><div className="text-[10px] text-ink-dim mt-3">{recommendations?.disclaimer || 'Actions require human validation, contract coverage, and execution evidence.'}</div></div>;
}

