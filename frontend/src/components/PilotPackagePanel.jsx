import { useEffect, useState } from 'react';
import { ClipboardCheck, Download } from 'lucide-react';
import { downloadPilotPackage, getPilotPackage } from '../api/client';

export default function PilotPackagePanel() {
  const [packet, setPacket] = useState(null);
  useEffect(() => { getPilotPackage().then(setPacket).catch(() => setPacket(null)); }, []);
  const download = (format) => { if (packet) downloadPilotPackage(format).catch(() => undefined); };
  if (!packet) return <div className="bg-panel border border-line rounded-lg p-4 text-xs text-ink-dim">Cargando paquete de piloto...</div>;
  const passed = packet.readiness?.checks?.filter((item) => item.pass).length || 0;
  return <div className="bg-panel border border-line rounded-lg p-4">
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-start gap-3"><ClipboardCheck size={16} className="text-signal mt-1" /><div><div className="font-mono text-[10px] uppercase tracking-widest text-signal">Pilot package</div><h2 className="font-display text-lg font-semibold text-ink mt-1">Paquete de preparación de piloto</h2></div></div>
      <div className="flex gap-2"><button type="button" onClick={() => download('json')} className="flex items-center gap-2 border border-signal/40 text-signal rounded px-3 py-2 text-xs"><Download size={13} />JSON</button><button type="button" onClick={() => download('markdown')} className="border border-line text-ink-muted rounded px-3 py-2 text-xs">Markdown</button></div>
    </div>
    <p className="text-xs text-ink-muted mt-2">Consolida readiness, preguntas, métricas, feedback, scorecard y próximos gates en un único artefacto auditable.</p>
    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-3"><Metric label="Gates pass" value={`${passed}/${packet.readiness?.checks?.length || 0}`} /><Metric label="Feedback" value={packet.feedback?.length || 0} /><Metric label="Casos" value={packet.metrics?.metrics?.casesObserved || 0} /><Metric label="Acciones" value={packet.metrics?.metrics?.actionsDocumented || 0} /><Metric label="Cliente listo" value={packet.readiness?.customerReady ? 'SÍ' : 'NO'} /></div>
    <div className="mt-3 border border-line rounded p-3 text-xs text-ink-muted"><div className="font-mono text-[10px] uppercase tracking-widest text-ink-dim">Siguiente gate</div><div className="mt-1 text-ink">{packet.readiness?.nextGate}</div></div>
  </div>;
}

function Metric({ label, value }) { return <div className="bg-void border border-line rounded p-3"><div className="font-mono text-[9px] uppercase tracking-widest text-ink-dim">{label}</div><div className="font-display text-lg font-semibold text-ink mt-1">{value}</div></div>; }
