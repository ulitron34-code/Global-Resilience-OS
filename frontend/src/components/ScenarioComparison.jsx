import { useEffect, useState } from 'react';
import { GitCompareArrows } from 'lucide-react';
import { compareScenarios, getScenarios } from '../api/client';

export default function ScenarioComparison() {
  const [scenarios, setScenarios] = useState([]);
  const [selected, setSelected] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => { getScenarios().then((items) => { setScenarios(items); setSelected(items.slice(0, 2).map((item) => item.id)); }); }, []);
  const toggle = (id) => setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : current.length < 3 ? [...current, id] : current);
  const compare = async () => {
    if (selected.length < 2) return;
    setBusy(true);
    setError('');
    try { setComparison(await compareScenarios(selected)); } catch (requestError) { setError(requestError.message); } finally { setBusy(false); }
  };
  return <section className="bg-panel border border-line rounded-lg overflow-hidden"><div className="p-4 border-b border-line flex items-center gap-3"><GitCompareArrows size={16} className="text-signal" /><div><h2 className="font-display font-semibold text-ink">Compare scenarios</h2><p className="text-xs text-ink-muted mt-1">Evaluate loss, mitigation, and protected value side by side.</p></div></div><div className="p-4"><div className="flex flex-wrap gap-2">{scenarios.map((scenario) => <button key={scenario.id} onClick={() => toggle(scenario.id)} className={`border rounded px-3 py-2 text-xs ${selected.includes(scenario.id) ? 'border-signal text-signal bg-signal/10' : 'border-line text-ink-muted'}`}>{scenario.name}</button>)}{!scenarios.length && <span className="text-xs text-ink-muted">Save a scenario to compare it.</span>}</div><button onClick={compare} disabled={selected.length < 2 || busy} className="mt-4 bg-signal text-void rounded px-3 py-2 text-xs font-semibold disabled:opacity-50">{busy ? 'Comparing...' : 'Compare selected'}</button>{error && <div role="alert" className="text-xs text-alert mt-3">Could not compare: {error}</div>}{comparison && <div className="overflow-x-auto mt-4"><table className="w-full text-xs"><thead><tr className="border-b border-line text-left text-ink-dim"><th className="py-2">Scenario</th><th className="py-2">Loss vs baseline</th><th className="py-2">Cost vs baseline</th><th className="py-2">Protection vs baseline</th></tr></thead><tbody>{comparison.deltas.map((delta) => <tr key={delta.id} className="border-b border-line/60"><td className="py-2 text-ink">{comparison.scenarios.find((item) => item.id === delta.id)?.name}</td><td className="py-2 text-alert">{formatUsd(delta.lossVsBaselineUsd)}</td><td className="py-2 text-ink-muted">{formatUsd(delta.mitigationCostVsBaselineUsd)}</td><td className="py-2 text-signal">{formatUsd(delta.protectedValueVsBaselineUsd)}</td></tr>)}</tbody></table></div>}</div></section>;
}

function formatUsd(value) { const sign = value < 0 ? '-' : ''; const absolute = Math.abs(value); if (absolute >= 1000000) return `${sign}$${(absolute / 1000000).toFixed(1)}M`; if (absolute >= 1000) return `${sign}$${Math.round(absolute / 1000)}K`; return `${sign}$${Math.round(absolute)}`; }

