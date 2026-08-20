import { useEffect, useState } from 'react';
import { getPilotMeasurementPlan, savePilotMeasurementPlan } from '../api/client';

const REQUIRED_IDS = new Set(['time_to_explain_minutes', 'time_to_decision_minutes', 'evidence_completeness_pct', 'action_documentation_pct']);

function valueOrEmpty(value) {
  return value === null || value === undefined ? '' : value;
}

export default function PilotMeasurementPanel() {
  const [plan, setPlan] = useState(null);
  const [draft, setDraft] = useState([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const refresh = async () => { const next = await getPilotMeasurementPlan(); setPlan(next); setDraft((next.metrics || []).filter((metric) => REQUIRED_IDS.has(metric.id)).map((metric) => ({ id: metric.id, baseline: valueOrEmpty(metric.baseline), target: valueOrEmpty(metric.target), actual: valueOrEmpty(metric.actual), evidenceRef: valueOrEmpty(metric.evidenceRef), evidenceClass: metric.evidenceClass || 'evidence_required' }))); };
  useEffect(() => { refresh().catch(() => setMessage('Could not load the measurement plan.')); }, []);
  const update = (id, field, value) => setDraft((items) => items.map((item) => item.id === id ? { ...item, [field]: value } : item));
  const save = async (event) => { event.preventDefault(); setBusy(true); setMessage(''); try { const saved = await savePilotMeasurementPlan({ metrics: draft.map((item) => ({ ...item, baseline: item.baseline === '' ? null : Number(item.baseline), target: item.target === '' ? null : Number(item.target), actual: item.actual === '' ? null : Number(item.actual), evidenceClass: item.evidenceRef ? 'observed' : 'evidence_required' })) }); setPlan(saved); setMessage(`Plan guardado: ${saved.status}.`); } catch (error) { setMessage(error.message); } finally { setBusy(false); } };
  return <section className="bg-panel border border-line rounded-lg p-4"><div className="flex items-start justify-between gap-3"><div><div className="font-mono text-[10px] uppercase tracking-widest text-signal">Pilot measurement ledger</div><h2 className="font-display text-lg font-semibold text-ink mt-1">Baseline, Target, and Outcome</h2></div><span className={`font-mono text-[10px] ${plan?.status === 'go' ? 'text-signal' : 'text-alert'}`}>{plan?.status || 'LOADING'}</span></div><p className="text-xs text-ink-muted mt-2">The gate requires observed values and evidence references; it does not convert demo metrics into commercial value.</p><form onSubmit={save} className="mt-3 space-y-2">{draft.map((metric) => <div key={metric.id} className="grid grid-cols-1 md:grid-cols-[1.5fr_1fr_1fr_1fr_1.2fr] gap-2 items-center"><span className="text-xs text-ink">{plan?.metrics?.find((item) => item.id === metric.id)?.label || metric.id}</span><input className="control" type="number" min="0" step="any" value={metric.baseline} onChange={(event) => update(metric.id, 'baseline', event.target.value)} placeholder="Baseline" aria-label={`${metric.id} baseline`} /><input className="control" type="number" min="0" step="any" value={metric.target} onChange={(event) => update(metric.id, 'target', event.target.value)} placeholder="Target" aria-label={`${metric.id} target`} /><input className="control" type="number" min="0" step="any" value={metric.actual} onChange={(event) => update(metric.id, 'actual', event.target.value)} placeholder="Outcome" aria-label={`${metric.id} outcome`} /><input className="control" value={metric.evidenceRef} onChange={(event) => update(metric.id, 'evidenceRef', event.target.value)} placeholder="Evidence" aria-label={`${metric.id} evidence`} /></div>)}<div className="flex items-center gap-2 mt-3"><button disabled={busy} className="border border-signal/40 text-signal rounded px-3 py-2 text-xs disabled:opacity-50">{busy ? 'Saving...' : 'Save measurement'}</button>{message && <span role="status" className="text-xs text-signal">{message}</span>}</div></form><div className="text-[10px] text-ink-dim mt-3">Required gate: {plan?.gate?.passed || 0}/{plan?.gate?.totalRequired || 4} metrics · missing: {(plan?.gate?.missingEvidence || []).length}</div></section>;
}



