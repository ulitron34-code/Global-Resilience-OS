import { useRef, useState } from 'react';
import { Database, Play, ShieldCheck } from 'lucide-react';
import { ingestBatch } from '../api/client';
import { useSessionStore } from '../store/useSessionStore';
import { batchTemplate, parseBatchText } from '../utils/batchParser';

const sample = JSON.stringify([
  { sourceId: 'ais-demo', externalId: 'batch-demo-001', eventType: 'ais_gap', title: 'Brecha AIS batch', severity: 'high', impactUsd: 180000, location: 'Estrecho de Ormuz' },
], null, 2);

export default function BatchIngestionPanel() {
  const [payload, setPayload] = useState(sample);
  const [mode, setMode] = useState('dry_run');
  const [result, setResult] = useState(null);
  const [status, setStatus] = useState('idle');
  const [fileName, setFileName] = useState('');
  const fileInput = useRef(null);
  const user = useSessionStore((state) => state.user);
  const canOperate = !user || user.role !== 'viewer';

  async function submit(event) {
    event.preventDefault();
    setStatus('sending');
    try {
      const events = JSON.parse(payload);
      if (!Array.isArray(events)) throw new Error('El payload debe ser un arreglo JSON de eventos');
      if (mode === 'commit' && !window.confirm(`Confirmar commit de ${events.length} evento(s)? Esta acción modifica el estado local.`)) {
        setStatus('idle');
        return;
      }
      const data = await ingestBatch({ mode, events });
      setResult(data);
      setStatus('done');
    } catch (error) {
      setResult({ error: error.message });
      setStatus('error');
    }
  }

  async function loadFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const events = parseBatchText(await file.text(), file.name);
      setPayload(JSON.stringify(events, null, 2));
      setFileName(`${file.name} · ${events.length} registro(s)`);
      setResult(null);
      setStatus('idle');
    } catch (error) {
      setFileName('');
      setResult({ error: error.message });
      setStatus('error');
    } finally {
      event.target.value = '';
    }
  }

  function downloadTemplate(format) {
    const blob = new Blob([batchTemplate(format)], { type: format === 'csv' ? 'text/csv' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `global-resilience-batch-template.${format}`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return <section className="bg-panel border border-line rounded-lg overflow-hidden">
    <div className="p-4 border-b border-line flex items-center gap-3"><Database size={16} className="text-signal" /><div><h2 className="font-display font-semibold text-ink">Ingesta batch controlada</h2><p className="text-xs text-ink-muted mt-1">Importa JSON/CSV, valida y confirma hasta 100 señales con idempotencia.</p></div></div>
    <form onSubmit={submit} className="p-4 grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-3">
      <label className="text-[10px] uppercase tracking-widest text-ink-dim">Eventos JSON<textarea disabled={!canOperate} value={payload} onChange={(event) => { setPayload(event.target.value); setFileName(''); }} className="control mt-1 min-h-40 font-mono text-xs" spellCheck="false" />{fileName && <span className="block normal-case tracking-normal text-signal mt-1">{fileName}</span>}<span className="flex flex-wrap gap-2 mt-2"><input ref={fileInput} type="file" accept=".json,.csv,application/json,text/csv" onChange={loadFile} disabled={!canOperate} className="hidden" /><button type="button" onClick={() => fileInput.current?.click()} disabled={!canOperate} className="border border-line text-ink-muted rounded px-2 py-1.5 normal-case tracking-normal disabled:opacity-60">Importar JSON/CSV</button><button type="button" onClick={() => downloadTemplate('json')} className="border border-line text-ink-muted rounded px-2 py-1.5 normal-case tracking-normal">Plantilla JSON</button><button type="button" onClick={() => downloadTemplate('csv')} className="border border-line text-ink-muted rounded px-2 py-1.5 normal-case tracking-normal">Plantilla CSV</button></span></label>
      <div className="flex flex-col gap-3"><label className="text-[10px] uppercase tracking-widest text-ink-dim">Modo<select disabled={!canOperate} value={mode} onChange={(event) => setMode(event.target.value)} className="control mt-1"><option value="dry_run">Dry run</option><option value="commit">Commit</option></select></label><button disabled={!canOperate || status === 'sending'} className="flex items-center justify-center gap-2 bg-signal text-void rounded px-4 py-2.5 text-xs font-semibold disabled:opacity-60"><Play size={14} />{status === 'sending' ? 'Procesando...' : 'Procesar batch'}</button>{result && <div className={`text-xs ${status === 'error' ? 'text-alert' : 'text-signal'}`}>{result.error || <><ShieldCheck size={13} className="inline mr-1" />{result.mode}: {result.counts?.valid ?? result.accepted ?? 0} válidas · {result.counts?.invalid ?? 0} inválidas · {result.counts?.duplicates ?? result.duplicates ?? 0} duplicadas</>}</div>}</div>
    </form>
    {result?.items && <div className="border-t border-line p-4"><div className="font-mono text-[10px] uppercase tracking-widest text-ink-dim mb-2">Resultado por registro</div><div className="max-h-40 overflow-auto space-y-1">{result.items.map((item) => <div key={`${item.index}-${item.externalId || 'unknown'}`} className="flex justify-between gap-3 text-[11px] border-b border-line/50 py-1"><span className="text-ink-muted truncate">#{item.index + 1} · {item.externalId || 'sin externalId'}</span><span className={item.status === 'valid' ? 'text-signal' : 'text-alert'}>{item.status === 'valid' ? 'VÁLIDO' : item.error}</span></div>)}</div></div>}
  </section>;
}
