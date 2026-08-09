import { useEffect, useState } from 'react';
import { ArrowUpRight, ShieldCheck } from 'lucide-react';
import { getEnterpriseReadiness } from '../api/client';

export default function EnterpriseReadinessPanel() {
  const [readiness, setReadiness] = useState(null);
  useEffect(() => { getEnterpriseReadiness().then(setReadiness).catch(() => setReadiness(null)); }, []);
  if (!readiness) return <div className="bg-panel border border-line rounded-lg p-4 text-xs text-ink-dim">Cargando enterprise readiness...</div>;
  const passed = [...(readiness.localChecks || []), ...(readiness.externalChecks || [])].filter((item) => item.pass).length;
  return <div className="bg-panel border border-line rounded-lg p-4"><div className="flex items-start justify-between gap-3"><div className="flex items-start gap-3"><ShieldCheck size={16} className="text-signal mt-1" /><div><div className="font-mono text-[10px] uppercase tracking-widest text-signal">Enterprise readiness</div><h2 className="font-display text-lg font-semibold text-ink mt-1">Estado del handoff</h2></div></div><span className={`font-mono text-[10px] ${readiness.localReady ? 'text-signal' : 'text-alert'}`}>{readiness.decision}</span></div><p className="text-xs text-ink-muted mt-2">Separa lo que ya está listo en la USB de lo que necesita infraestructura, datos o validación real.</p><div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3"><Metric label="Checks pass" value={`${passed}/${(readiness.localChecks?.length || 0) + (readiness.externalChecks?.length || 0)}`} /><Metric label="Local" value={readiness.localReady ? 'READY' : 'REVISAR'} /><Metric label="Externo" value={readiness.externalReady ? 'READY' : 'PENDIENTE'} /><Metric label="Bloqueos" value={readiness.blocking?.length || 0} /></div><div className="mt-3 space-y-2">{(readiness.blocking || []).slice(0, 5).map((item) => <div key={item.id} className="border border-line rounded p-2 flex items-center justify-between gap-3 text-xs"><span className="text-ink-muted">{item.label}</span><span className="font-mono text-[10px] text-alert">{item.evidence}</span></div>)}</div><div className="text-xs text-ink mt-3 flex items-center gap-1"><ArrowUpRight size={13} className="text-signal" />{readiness.nextStep}</div></div>;
}

function Metric({ label, value }) { return <div className="bg-void border border-line rounded p-3"><div className="font-mono text-[9px] uppercase tracking-widest text-ink-dim">{label}</div><div className="font-display text-lg font-semibold text-ink mt-1">{value}</div></div>; }
