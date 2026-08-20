import { useEffect, useState } from 'react';
import { CheckCircle2, CircleAlert, RefreshCw } from 'lucide-react';
import { getConnectorContractReadiness, getReadiness } from '../api/client';

export default function ReadinessPanel() {
  const [readiness, setReadiness] = useState(null);
  const [connectors, setConnectors] = useState(null);
  const [loading, setLoading] = useState(false);
  const refresh = async () => { setLoading(true); const [system, connectorContracts] = await Promise.all([getReadiness(), getConnectorContractReadiness()]); setReadiness(system); setConnectors(connectorContracts); setLoading(false); };
  useEffect(() => { refresh(); }, []);
  const healthy = readiness?.ready;
  const connectorReady = connectors?.ready;
  return <div className="bg-panel border border-line rounded-lg p-4"><div className="flex items-center justify-between gap-3"><div><div className="font-mono text-[10px] uppercase tracking-widest text-signal">Readiness and feeds</div><h2 className="font-display text-lg font-semibold text-ink mt-1">Operational Status</h2></div><button onClick={refresh} disabled={loading} aria-label="Refresh readiness" className="border border-line rounded p-2 text-ink-muted hover:text-ink disabled:opacity-50"><RefreshCw size={14} className={loading ? 'animate-spin' : ''} /></button></div><div className={`mt-3 flex items-center gap-2 text-xs ${healthy ? 'text-signal' : 'text-alert'}`}>{healthy ? <CheckCircle2 size={15} /> : <CircleAlert size={15} />}{healthy ? 'System ready to receive signals' : readiness?.error || 'System not ready'}</div><div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3">{(readiness?.sources || []).map((source) => <div key={source.id} className="border border-line rounded p-2"><div className="text-[11px] text-ink truncate">{source.name}</div><div className={`font-mono text-[9px] uppercase mt-1 ${source.status === 'error' ? 'text-alert' : 'text-signal'}`}>{source.status}</div></div>)}</div><div className="mt-3 border border-line rounded p-3"><div className="flex justify-between gap-3 text-xs"><span className="text-ink-muted">Connector contracts</span><span className={connectorReady ? 'font-mono text-[10px] text-signal' : 'font-mono text-[10px] text-alert'}>{connectorReady ? 'PASS' : 'REVIEW'}</span></div><div className="text-[10px] text-ink-dim mt-1">{connectors?.connectorCount || 0} declared adapters · external integration: {connectors?.externalIntegrationReady ? 'enabled' : 'pending'}</div></div></div>;
}



