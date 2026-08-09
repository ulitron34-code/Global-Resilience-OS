import { useEffect, useState } from 'react';
import { BookOpenCheck } from 'lucide-react';
import { getModels } from '../api/client';

export default function ModelRegistryPanel() {
  const [models, setModels] = useState([]);
  useEffect(() => { getModels().then(setModels); }, []);
  return <section className="bg-panel border border-line rounded-lg overflow-hidden"><div className="p-4 border-b border-line flex items-center gap-3"><BookOpenCheck size={16} className="text-signal" /><div><div className="font-mono text-[10px] uppercase tracking-widest text-signal">Model registry</div><h2 className="font-display font-semibold text-ink mt-1">Versiones y supuestos</h2></div></div><div className="grid md:grid-cols-2 gap-3 p-4">{models.map((model) => <article key={model.id} className="border border-line rounded-lg p-4"><div className="flex items-start justify-between gap-3"><h3 className="text-sm font-semibold text-ink">{model.name}</h3><span className="font-mono text-[9px] text-signal">v{model.version}</span></div><p className="text-xs text-ink-muted mt-2">{model.methodology}</p><div className="mt-3"><div className="font-mono text-[9px] uppercase tracking-widest text-ink-dim">Supuestos</div><ul className="mt-1 space-y-1 text-[11px] text-ink-muted">{model.assumptions.map((item) => <li key={item}>• {item}</li>)}</ul></div><div className="mt-3"><div className="font-mono text-[9px] uppercase tracking-widest text-ink-dim">Limitaciones</div><ul className="mt-1 space-y-1 text-[11px] text-alert/80">{model.limitations.map((item) => <li key={item}>• {item}</li>)}</ul></div></article>)}{!models.length && <div className="text-xs text-ink-muted">No hay modelos registrados.</div>}</div></section>;
}
