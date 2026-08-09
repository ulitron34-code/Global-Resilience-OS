import { useEffect, useState } from 'react';
import { CircleAlert, ShieldCheck } from 'lucide-react';
import { getComplianceReadiness } from '../api/client';

const labels = { implemented_local: 'IMPLEMENTADO', configured_local: 'CONFIGURADO', demo_optional: 'DEMO OPCIONAL', partial_local: 'PARCIAL', pending_external: 'PENDIENTE EXTERNO', illustrative_only: 'ILUSTRATIVO' };

export default function CompliancePanel() {
  const [readiness, setReadiness] = useState(null);
  useEffect(() => { getComplianceReadiness().then(setReadiness); }, []);
  return <div className="bg-panel border border-line rounded-lg p-4"><div className="flex items-center gap-3"><ShieldCheck size={16} className="text-signal" /><div><div className="font-mono text-[10px] uppercase tracking-widest text-signal">Control plane</div><h2 className="font-display text-lg font-semibold text-ink mt-1">Readiness de controles</h2></div></div><div className="mt-3 flex items-center gap-2 text-xs text-alert"><CircleAlert size={14} />{readiness?.disclaimer || 'Cargando controles...'}</div><div className="grid md:grid-cols-2 gap-2 mt-3">{(readiness?.controls || []).map((control) => <div key={control.id} className="border border-line rounded p-3"><div className="flex items-center justify-between gap-2"><span className="text-xs text-ink">{control.label}</span><span className={`font-mono text-[9px] ${control.status === 'implemented_local' || control.status === 'configured_local' ? 'text-signal' : 'text-alert'}`}>{labels[control.status] || control.status}</span></div><div className="text-[11px] text-ink-muted mt-1">{control.evidence}</div></div>)}</div></div>;
}
