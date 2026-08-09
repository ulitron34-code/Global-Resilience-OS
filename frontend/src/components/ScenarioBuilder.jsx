import { Zap, Loader2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

const DURATIONS = [6, 12, 24, 48, 72];

export default function ScenarioBuilder() {
  const cables = useAppStore((s) => s.cables);
  const selectedCableId = useAppStore((s) => s.selectedCableId);
  const severity = useAppStore((s) => s.severity);
  const durationHours = useAppStore((s) => s.durationHours);
  const isSimulating = useAppStore((s) => s.isSimulating);
  const setSeverity = useAppStore((s) => s.setSeverity);
  const setDurationHours = useAppStore((s) => s.setDurationHours);
  const runSimulation = useAppStore((s) => s.runSimulation);

  const cable = cables.find((c) => c.id === selectedCableId);

  if (!cable) {
    return (
      <div className="bg-panel border border-line rounded-lg p-6 flex flex-col items-center justify-center text-center h-full">
        <Zap size={20} className="text-ink-dim mb-2" />
        <p className="text-ink-muted text-sm">Selecciona un cable en el mapa o en la lista para construir un escenario de ruptura.</p>
      </div>
    );
  }

  return (
    <div className="bg-panel border border-line rounded-lg p-4 flex flex-col gap-4">
      <div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-ink-dim mb-1">Escenario</div>
        <div className="font-display font-semibold text-ink text-lg leading-tight">{cable.name}</div>
        <div className="text-xs text-ink-muted mt-0.5">{cable.route}</div>
      </div>

      <div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-ink-dim mb-1.5">Severidad</div>
        <div className="grid grid-cols-2 gap-1.5">
          {['parcial', 'total'].map((s) => (
            <button
              key={s}
              onClick={() => setSeverity(s)}
              className={`py-1.5 rounded text-xs font-medium border transition-colors capitalize ${
                severity === s
                  ? 'bg-alert/15 border-alert/40 text-alert'
                  : 'bg-void border-line text-ink-muted hover:border-ink-dim'
              }`}
            >
              {s === 'parcial' ? 'Corte parcial' : 'Corte total'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-ink-dim mb-1.5">
          Duración: <span className="text-ink">{durationHours}h</span>
        </div>
        <div className="grid grid-cols-5 gap-1.5">
          {DURATIONS.map((d) => (
            <button
              key={d}
              onClick={() => setDurationHours(d)}
              className={`py-1.5 rounded text-[11px] font-mono border transition-colors ${
                durationHours === d
                  ? 'bg-signal/15 border-signal/40 text-signal'
                  : 'bg-void border-line text-ink-muted hover:border-ink-dim'
              }`}
            >
              {d}h
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={runSimulation}
        disabled={isSimulating}
        className="mt-1 flex items-center justify-center gap-2 bg-alert text-void font-semibold text-sm py-2.5 rounded hover:bg-alert-glow transition-colors disabled:opacity-60"
      >
        {isSimulating ? (
          <>
            <Loader2 size={15} className="animate-spin" /> Calculando...
          </>
        ) : (
          <>
            <Zap size={15} /> Simular ruptura
          </>
        )}
      </button>
    </div>
  );
}
