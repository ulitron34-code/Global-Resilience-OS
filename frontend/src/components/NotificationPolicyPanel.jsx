import { useState } from 'react';
import { previewNotificationPolicy } from '../api/client';

const CHANNELS = ['in_app', 'email', 'webhook', 'slack'];

export default function NotificationPolicyPanel() {
  const [severity, setSeverity] = useState('high');
  const [channels, setChannels] = useState(['in_app']);
  const [policy, setPolicy] = useState(null);
  const [error, setError] = useState('');
  const toggle = (channel) => setChannels((current) => current.includes(channel) ? current.filter((item) => item !== channel) : [...current, channel]);
  const preview = async () => { setError(''); try { setPolicy(await previewNotificationPolicy({ severity, channels })); } catch (err) { setError(err.message); } };
  return <div className="bg-panel border border-line rounded-lg p-4"><div className="font-mono text-[10px] uppercase tracking-widest text-signal">Escalation policy</div><h2 className="font-display text-lg font-semibold text-ink mt-1">Notificacion multicanal controlada</h2><p className="text-xs text-ink-muted mt-2">Previsualiza destinatarios, tiempos y canales. La entrega externa permanece en dry-run.</p><div className="flex flex-wrap items-center gap-2 mt-4"><select className="control" value={severity} onChange={(event) => setSeverity(event.target.value)} aria-label="Severity"><option value="critical">critical</option><option value="high">high</option><option value="medium">medium</option><option value="low">low</option></select>{CHANNELS.map((channel) => <label key={channel} className="inline-flex items-center gap-1 text-[10px] text-ink-muted"><input type="checkbox" checked={channels.includes(channel)} onChange={() => toggle(channel)} />{channel}</label>)}<button type="button" onClick={preview} className="bg-signal text-void rounded px-3 py-2 text-xs font-semibold">Previsualizar</button></div>{error && <div role="alert" className="text-xs text-alert mt-3">{error}</div>}{policy && <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4">{policy.recipients.map((recipient) => <div key={recipient.role} className="border border-line rounded p-3"><div className="text-xs text-ink">{recipient.role}</div><div className="font-mono text-[10px] text-signal mt-1">{recipient.escalationMinutes} min · {recipient.channels.join(', ')}</div></div>)}<div className="text-[10px] text-ink-dim md:col-span-2">{policy.disclaimer}</div></div>}</div>;
}

