import { useState } from 'react';
import { Share2 } from 'lucide-react';
import { previewCooperativeNetwork } from '../api/client';

export default function CooperativeNetworkPanel() {
  const [consent, setConsent] = useState(false);
  const [reidentificationReviewed, setReidentificationReviewed] = useState(false);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const runPreview = async () => {
    setBusy(true);
    setError('');
    try { setPreview(await previewCooperativeNetwork({ consent, reidentificationReviewed, minCohort: 3 })); } catch (requestError) { setError(requestError.message); } finally { setBusy(false); }
  };
  return <div className="bg-panel border border-line rounded-lg p-4"><div className="flex items-start gap-3"><Share2 size={16} className="text-signal mt-1" /><div><div className="font-mono text-[10px] uppercase tracking-widest text-signal">Cooperative network</div><h2 className="font-display text-lg font-semibold text-ink mt-1">Anonymized Network Preview</h2></div></div><p className="text-xs text-ink-muted mt-2">Prepare aggregated signals for a future cooperative network without sharing data or contacting other tenants.</p><div className="flex flex-wrap items-center gap-3 mt-3"><label className="flex items-center gap-2 text-xs text-ink-muted"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />Explicit consent</label><label className="flex items-center gap-2 text-xs text-ink-muted"><input type="checkbox" checked={reidentificationReviewed} onChange={(event) => setReidentificationReviewed(event.target.checked)} />Re-identification review completed</label><button type="button" onClick={runPreview} disabled={busy} className="border border-signal/40 text-signal rounded px-3 py-2 text-xs disabled:opacity-50">{busy ? 'Preparing...' : 'Prepare preview'}</button></div>{error && <div role="alert" className="text-xs text-alert mt-3">{error}</div>}{preview && <div className="mt-3 border border-line rounded p-3 text-xs"><div className="flex justify-between gap-2"><span className="text-ink-muted">Status</span><span className={preview.status === 'ready_for_human_review' ? 'text-signal' : 'text-alert'}>{preview.status}</span></div><div className="grid grid-cols-2 gap-2 mt-2 text-ink-muted"><span>Signals assessed: <b className="text-ink">{preview.signalCount}</b></span><span>Shareable signals: <b className="text-ink">{preview.sharedSignals?.length || 0}</b></span></div><div className="font-mono text-[10px] text-ink-dim mt-2">{preview.mode} · k≥{preview.anonymization?.kAnonymityMinimum} · consent: {preview.consentEvidence?.recordedAt ? 'recorded' : 'pending'} · re-identification: {preview.consentEvidence?.reidentificationReview?.completed ? 'reviewed' : 'pending'}</div></div>}</div>;
}


