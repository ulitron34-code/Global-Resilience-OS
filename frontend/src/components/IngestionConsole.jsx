import { useEffect, useState } from 'react';
import { Activity, Send, Terminal } from 'lucide-react';
import { getSources, ingestEvent } from '../api/client';
import { useSessionStore } from '../store/useSessionStore';

const initialForm = { sourceId: 'ais-demo', eventType: 'ais_gap', title: 'AIS gap detectado', severity: 'high', impactUsd: '310000', location: 'Estrecho de Ormuz' };

export default function IngestionConsole() {
  const [sources, setSources] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState(null);
  const user = useSessionStore((state) => state.user);
  const canOperate = !user || user.role !== 'viewer';

  useEffect(() => { getSources().then(setSources); }, []);

  const update = (field, value) => setForm((current) => ({ ...current, [field]: value }));
  const send = async (event) => {
    event.preventDefault();
    setStatus('sending');
    try {
      const data = await ingestEvent({ ...form, externalId: `console-${Date.now()}`, impactUsd: Number(form.impactUsd) });
      setResult(data);
      setStatus('sent');
    } catch (error) {
      setResult({ error: error.message });
      setStatus('error');
    }
  };

  return <section className="bg-panel border border-line rounded-lg overflow-hidden"><div className="p-4 border-b border-line flex items-center gap-3"><Terminal size={16} className="text-signal" /><div><h2 className="font-display font-semibold text-ink">Consola de señales</h2><p className="text-xs text-ink-muted mt-1">Simula una entrada de conector y observa el ciclo operativo.</p></div></div><form onSubmit={send} className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3"><Field label="Fuente"><select disabled={!canOperate} value={form.sourceId} onChange={(e) => update('sourceId', e.target.value)} className="control">{sources.map((source) => <option key={source.id} value={source.id}>{source.name}</option>)}</select></Field><Field label="Tipo"><input disabled={!canOperate} value={form.eventType} onChange={(e) => update('eventType', e.target.value)} className="control" /></Field><Field label="Título"><input disabled={!canOperate} value={form.title} onChange={(e) => update('title', e.target.value)} className="control" /></Field><Field label="Ubicación"><input disabled={!canOperate} value={form.location} onChange={(e) => update('location', e.target.value)} className="control" /></Field><Field label="Severidad"><select disabled={!canOperate} value={form.severity} onChange={(e) => update('severity', e.target.value)} className="control"><option value="critical">Crítica</option><option value="high">Alta</option><option value="medium">Media</option><option value="low">Baja</option></select></Field><Field label="Impacto USD"><input disabled={!canOperate} type="number" min="0" value={form.impactUsd} onChange={(e) => update('impactUsd', e.target.value)} className="control" /></Field><div className="md:col-span-2 flex items-end gap-3"><button disabled={!canOperate || status === 'sending'} className="flex items-center gap-2 bg-signal text-void rounded px-4 py-2.5 text-xs font-semibold disabled:opacity-60"><Send size={14} />{!canOperate ? 'Solo lectura' : status === 'sending' ? 'Enviando...' : 'Ingresar señal'}</button>{status === 'sent' && <span className="flex items-center gap-1.5 text-xs text-signal"><Activity size={13} />Alerta creada{result?.created ? '' : ' (duplicada)'}</span>}{status === 'error' && <span className="text-xs text-alert">{result?.error}</span>}</div></form></section>;
}

function Field({ label, children }) { return <label className="text-[10px] uppercase tracking-widest text-ink-dim">{label}<span className="block mt-1 normal-case tracking-normal">{children}</span></label>; }
