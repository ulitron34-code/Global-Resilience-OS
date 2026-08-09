import { useState } from 'react';
import { Share2 } from 'lucide-react';
import { previewCooperativeNetwork } from '../api/client';

export default function CooperativeNetworkPanel() {
  const [consent, setConsent] = useState(false);
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const runPreview = async () => {
    setBusy(true);
    setError('');
    try { setPreview(await previewCooperativeNetwork({ consent, minCohort: 3 })); } catch (requestError) { setError(requestError.message); } finally { setBusy(false); }
  };
  return <div className="bg-panel border border-line rounded-lg p-4"><div className="flex items-start gap-3"><Share2 size={16} className="text-signal mt-1" /><div><div className="font-mono text-[10px] uppercase tracking-widest text-signal">Cooperative network</div><h2 className="font-display text-lg font-semibold text-ink mt-1">Previsualización anonimizada</h2></div></div><p className="text-xs text-ink-muted mt-2">Prepara señales agregadas para una futura red cooperativa sin compartirlas ni contactar otros tenants.</p><div className="flex flex-wrap items-center gap-3 mt-3"><label className="flex items-center gap-2 text-xs text-ink-muted"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} />Consentimiento explícito para previsualizar</label><button type="button" onClick={runPreview} disabled={busy} className="border border-signal/40 text-signal rounded px-3 py-2 text-xs disabled:opacity-50">{busy ? 'Preparando...' : 'Preparar preview'}</button></div>{error && <div role="alert" className="text-xs text-alert mt-3">{error}</div>}{preview && <div className="mt-3 border border-line rounded p-3 text-xs"><div className="flex justify-between gap-2"><span className="text-ink-muted">Estado</span><span className={preview.status === 'ready_for_human_review' ? 'text-signal' : 'text-alert'}>{preview.status}</span></div><div className="grid grid-cols-2 gap-2 mt-2 text-ink-muted"><span>Señales evaluadas: <b className="text-ink">{preview.signalCount}</b></span><span>Señales compartibles: <b className="text-ink">{preview.sharedSignals?.length || 0}</b></span></div><div className="font-mono text-[10px] text-ink-dim mt-2">{preview.mode} · k≥{preview.anonymization?.kAnonymityMinimum}</div></div>}</div>;
}
