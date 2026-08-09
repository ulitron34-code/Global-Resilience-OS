import { useEffect, useState } from 'react';
import { buildRegulatoryEvidenceMap, getRegulatoryFrameworks } from '../api/client';

function Metric({ label, value }) { return <div className="bg-void border border-line rounded p-3"><div className="font-mono text-[9px] uppercase tracking-widest text-ink-dim">{label}</div><div className="font-display text-lg font-semibold text-ink mt-1">{value}</div></div>; }

export default function RegulatoryEvidencePanel() {
  const [frameworks, setFrameworks] = useState([]);
  const [selected, setSelected] = useState('nist-csf-2-gv-sc');
  const [map, setMap] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => { getRegulatoryFrameworks().then(setFrameworks); }, []);
  const generate = async () => { setError(''); try { setMap(await buildRegulatoryEvidenceMap({ frameworkId: selected, scope: 'local-platform' })); } catch (err) { setError(err.message); } };
  return <div className="bg-panel border border-line rounded-lg p-4"><div className="flex flex-col md:flex-row md:items-end justify-between gap-3"><div><div className="font-mono text-[10px] uppercase tracking-widest text-signal">Evidence plane</div><h2 className="font-display text-lg font-semibold text-ink mt-1">Matriz regulatoria reutilizable</h2><p className="text-xs text-ink-muted mt-2">Relaciona controles con evidencia disponible sin afirmar cumplimiento legal.</p></div><div className="flex gap-2"><select className="control text-xs" value={selected} onChange={(event) => setSelected(event.target.value)}>{frameworks.map((framework) => <option key={framework.id} value={framework.id}>{framework.name}</option>)}</select><button type="button" onClick={generate} className="border border-signal/40 text-signal rounded px-3 py-2 text-xs">Generar mapa</button></div></div>{error && <div className="text-xs text-alert mt-3" role="alert">{error}</div>}{map && <><div className="grid grid-cols-3 gap-2 mt-4"><Metric label="Controles" value={map.counts.total} /><Metric label="Verificados" value={map.counts.verified} /><Metric label="Faltantes" value={map.counts.missing} /></div><div className="mt-3 space-y-2">{map.controls.map((control) => <div key={control.id} className="border border-line rounded p-2 flex items-center justify-between gap-3"><div><div className="text-xs text-ink">{control.id} · {control.title}</div><div className="text-[10px] text-ink-dim mt-1">Evidencia: {control.evidence.join(', ')}</div></div><span className={`font-mono text-[9px] ${control.status === 'operator_verified_local' ? 'text-signal' : 'text-alert'}`}>{control.status}</span></div>)}</div><div className="text-[10px] text-ink-dim mt-3">{map.disclaimer}</div></>}</div>;
}
