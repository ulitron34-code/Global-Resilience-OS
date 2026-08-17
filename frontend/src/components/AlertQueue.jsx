import { useEffect, useState } from 'react';
import { ArrowUpRight, CheckCircle2, ShieldAlert } from 'lucide-react';
import { convertAlertToCase, getAlerts, updateAlert } from '../api/client';

const severityLabel = { critical: 'CRITICA', high: 'ALTA', medium: 'MEDIA', low: 'BAJA' };

export default function AlertQueue({ onOpenCases, region = 'global', vertical = 'Oil & Gas' }) {
  const [alerts, setAlerts] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { getAlerts({ status: 'open', region: region === 'global' ? '' : region, vertical }).then(setAlerts); }, [region, vertical]);

  const runAction = async (alertId, action) => {
    setBusyId(alertId);
    setError('');
    try {
      if (action === 'case') {
        await convertAlertToCase(alertId);
        setAlerts((current) => current.filter((item) => item.id !== alertId));
      } else {
        const status = action === 'acknowledge' ? 'acknowledged' : 'suppressed';
        const updated = await updateAlert(alertId, { status });
        if (status === 'suppressed') setAlerts((current) => current.filter((item) => item.id !== alertId));
        else setAlerts((current) => current.map((item) => item.id === alertId ? updated : item));
      }
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusyId(null);
    }
  };

  return <section className="bg-panel border border-line rounded-lg overflow-hidden">
    <div className="p-4 border-b border-line flex items-center justify-between gap-3"><div><h2 className="font-display font-semibold text-ink">Prioritized Risk Alerts</h2><p className="text-xs text-ink-muted mt-1">Triaged by expected economic impact</p></div><span className="font-mono text-[10px] text-alert">{alerts.length} OPEN</span></div>
    {error && <div role="alert" className="px-4 py-2 text-xs text-alert border-b border-alert/20">No se pudo actualizar la alerta: {error}</div>}
    <div className="divide-y divide-line/60">{alerts.map((alert) => <AlertRow key={alert.id} alert={alert} busy={busyId === alert.id} onAction={runAction} onOpenCases={onOpenCases} />)}</div>
    {!alerts.length && <div className="p-6 text-center text-sm text-ink-muted"><CheckCircle2 size={18} className="text-signal mx-auto mb-2" />No open alerts.</div>}
  </section>;
}

function AlertRow({ alert, busy, onAction, onOpenCases }) {
  return <div className="p-4 flex flex-col md:flex-row md:items-center gap-3"><div className="flex items-start gap-3 flex-1"><ShieldAlert size={17} className={alert.severity === 'critical' ? 'text-alert mt-0.5' : 'text-signal mt-0.5'} /><div><div className="flex items-center gap-2"><span className="font-mono text-[10px] text-alert">{severityLabel[alert.severity]}</span><span className="font-mono text-[10px] text-ink-dim">{alert.id}</span>{alert.status !== 'open' && <span className="font-mono text-[10px] text-signal">{alert.status}</span>}</div><div className="text-sm text-ink mt-1">{alert.title}</div><div className="text-xs text-ink-muted mt-0.5">{alert.location} · {formatUsd(alert.impactUsd)} exposure</div></div></div><div className="flex flex-wrap gap-2"><button onClick={() => onAction(alert.id, 'acknowledge')} disabled={busy} className="border border-signal/40 text-signal rounded px-2.5 py-1.5 text-[11px] disabled:opacity-50">{busy ? 'Updating...' : 'Acknowledge'}</button><button onClick={() => onAction(alert.id, 'case')} disabled={busy} className="flex items-center gap-1.5 border border-signal/40 text-signal rounded px-2.5 py-1.5 text-[11px] disabled:opacity-50">Open case<ArrowUpRight size={12} /></button><button onClick={() => onAction(alert.id, 'suppress')} disabled={busy} className="border border-line text-ink-muted rounded px-2.5 py-1.5 text-[11px] hover:text-ink disabled:opacity-50">Suppress</button><button onClick={onOpenCases} className="border border-line text-ink-muted rounded px-2.5 py-1.5 text-[11px] hover:text-ink">View cases</button></div></div>;
}

function formatUsd(value) { if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`; if (value >= 1000) return `$${Math.round(value / 1000)}K`; return `$${Math.round(value)}`; }



