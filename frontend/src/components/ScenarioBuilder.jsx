import { Zap, Loader2 } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

const DURATIONS = [6, 12, 24, 48, 72];

const GEOPOLITICAL_SCENARIOS = [
  { id: 'suez', name: 'Bloqueo del Canal de Suez', desc: 'Disrupción total de comercio y logística intercontinental.', duration: 72, severity: 'total' },
  { id: 'ormuz', name: 'Bloqueo del Estrecho de Ormuz', desc: 'Crisis de suministro energético físico global.', duration: 48, severity: 'total' },
  { id: 'malaca', name: 'Cierre del Estrecho de Malaca', desc: 'Cuello de botella digital y físico para tecnología.', duration: 24, severity: 'total' },
  { id: 'bab', name: 'Disrupción en Bab-el-Mandeb', desc: 'Inestabilidad que impacta rutas de metales y crudo.', duration: 72, severity: 'parcial' },
];

export default function ScenarioBuilder() {
  const cables = useAppStore((s) => s.cables);
  const selectedCableId = useAppStore((s) => s.selectedCableId);
  const severity = useAppStore((s) => s.severity);
  const durationHours = useAppStore((s) => s.durationHours);
  const isSimulating = useAppStore((s) => s.isSimulating);
  const setSeverity = useAppStore((s) => s.setSeverity);
  const setDurationHours = useAppStore((s) => s.setDurationHours);
  const runSimulation = useAppStore((s) => s.runSimulation);
  const user = useAppStore((s) => s.user);

  const canOperate = !user || user.role !== 'viewer';
  const cable = cables.find((c) => c.id === selectedCableId);

  const selectCable = useAppStore((s) => s.selectCable);

  if (!cable) {
    return (
      <div className="bg-panel border border-line rounded-lg p-4 flex flex-col gap-3 h-full justify-between">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-ink-dim mb-1">Escenarios Rápidos</div>
          <h3 className="font-display font-semibold text-ink text-sm">Biblioteca de Estrés Geopolítico</h3>
          <p className="text-[11px] text-ink-muted mt-1">Selecciona una plantilla o haz clic en el mapa para simular:</p>
        </div>
        <div className="flex flex-col gap-2 overflow-y-auto max-h-[220px]">
          {GEOPOLITICAL_SCENARIOS.map((sc) => (
            <button
              key={sc.id}
              onClick={() => {
                selectCable(sc.id);
                setSeverity(sc.severity);
                setDurationHours(sc.duration);
                setTimeout(runSimulation, 50);
              }}
              className="border border-line hover:border-signal/50 bg-panel-elevated p-2 rounded text-left transition-colors flex flex-col gap-0.5 group"
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-ink group-hover:text-signal transition-colors">{sc.name}</span>
                <span className="font-mono text-[9px] text-signal uppercase">{sc.severity} · {sc.duration}h</span>
              </div>
              <p className="text-[10px] text-ink-muted leading-snug">{sc.desc}</p>
            </button>
          ))}
        </div>
        <div className="border-t border-line/60 pt-2 text-center">
          <p className="text-[9px] text-ink-dim font-mono">Monitoreo activo de 4 chokepoints marítimos.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-panel border border-line rounded-lg p-4 flex flex-col gap-4">
      <div className="flex justify-between items-start gap-2">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-ink-dim mb-1">Escenario</div>
          <div className="font-display font-semibold text-ink text-lg leading-tight">{cable.name}</div>
          <div className="text-xs text-ink-muted mt-0.5">{cable.route}</div>
        </div>
        <button
          onClick={() => selectCable(null)}
          className="font-mono text-[9px] uppercase border border-line hover:border-ink-muted text-ink-muted rounded px-1.5 py-0.5 shrink-0"
        >
          Reset
        </button>
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
        disabled={isSimulating || !canOperate}
        title={!canOperate ? 'No tienes permisos para simular rupturas' : ''}
        className="mt-1 flex items-center justify-center gap-2 bg-alert text-void font-semibold text-sm py-2.5 rounded hover:bg-alert-glow transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
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
      {!canOperate && (
        <div className="text-center text-[10px] text-alert mt-1">
          Solo analistas o administradores pueden simular escenarios.
        </div>
      )}
    </div>
  );
}
