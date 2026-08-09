import { useMemo, useState } from 'react';
import { Search, Radio } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { CHOKEPOINTS } from '../data/cables';

export default function CableList() {
  const cables = useAppStore((s) => s.cables);
  const selectedCableId = useAppStore((s) => s.selectedCableId);
  const selectCable = useAppStore((s) => s.selectCable);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const sorted = [...cables].sort((a, b) => b.criticality - a.criticality);
    if (!query.trim()) return sorted;
    const q = query.toLowerCase();
    return sorted.filter((c) => c.name.toLowerCase().includes(q) || c.route.toLowerCase().includes(q));
  }, [cables, query]);

  return (
    <div className="flex flex-col h-full bg-panel border border-line rounded-lg overflow-hidden">
      <div className="p-3 border-b border-line">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">Cables monitoreados</h2>
          <span className="font-mono text-[10px] text-ink-dim">{cables.length}</span>
        </div>
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-dim" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar cable o ruta..."
            className="w-full bg-void border border-line rounded pl-8 pr-2 py-1.5 text-xs text-ink placeholder:text-ink-dim focus:border-signal/50 outline-none"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.map((cable) => {
          const selected = selectedCableId === cable.id;
          return (
            <button
              key={cable.id}
              onClick={() => selectCable(cable.id)}
              className={`w-full text-left px-3 py-2.5 border-b border-line/60 transition-colors ${
                selected ? 'bg-signal/10 border-l-2 border-l-signal' : 'hover:bg-raised border-l-2 border-l-transparent'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className={`font-medium text-[13px] truncate ${selected ? 'text-signal' : 'text-ink'}`}>
                    {cable.name}
                  </div>
                  <div className="text-[11px] text-ink-muted truncate mt-0.5">{cable.route}</div>
                  {cable.chokepoints.length > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <Radio size={9} className="text-alert" />
                      <span className="font-mono text-[9px] text-alert/80 truncate">
                        {cable.chokepoints.map((cp) => CHOKEPOINTS[cp]?.label).join(', ')}
                      </span>
                    </div>
                  )}
                </div>
                <CriticalityBadge value={cable.criticality} />
              </div>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div className="p-4 text-center text-ink-dim text-xs font-mono">Sin resultados</div>
        )}
      </div>
    </div>
  );
}

function CriticalityBadge({ value }) {
  const isHigh = value >= 8;
  const isMid = value >= 6.5 && value < 8;
  const color = isHigh ? 'text-alert bg-alert/10 border-alert/30' : isMid ? 'text-signal bg-signal/10 border-signal/30' : 'text-ink-muted bg-raised border-line';
  return (
    <span className={`shrink-0 font-mono text-[10px] border rounded px-1.5 py-0.5 ${color}`}>
      {value.toFixed(1)}
    </span>
  );
}
