import { VERTICALS } from '../data/verticals';

export default function ContextBar({ context, onChange }) {
  return <div className="bg-panel border border-line rounded-lg px-3 py-2 flex flex-wrap items-center gap-2"><span className="font-mono text-[10px] uppercase tracking-widest text-ink-dim mr-1">Contexto</span><select value={context.vertical} onChange={(event) => onChange({ vertical: event.target.value })} className="control !w-auto"><option value="Todas">Ver todas (12)</option>{VERTICALS.map(v => <option key={v.id} value={v.label}>{v.label}</option>)}</select><select value={context.region} onChange={(event) => onChange({ region: event.target.value })} className="control !w-auto"><option value="global">Global</option><option value="Suez">Suez / Red Sea</option><option value="Ormuz">Strait of Hormuz</option><option value="Fujairah">Fujairah</option></select><select value={context.horizon} onChange={(event) => onChange({ horizon: event.target.value })} className="control !w-auto"><option value="24">24 horas</option><option value="72">72 horas</option><option value="168">7 days</option></select></div>;
}

