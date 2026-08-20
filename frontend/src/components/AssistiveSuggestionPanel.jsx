import { useState } from 'react';
import { getAssistiveSuggestion } from '../api/client';
import { Sparkles, Brain } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export default function AssistiveSuggestionPanel() {
  const result = useAppStore((s) => s.result);
  const [suggestion, setSuggestion] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = async () => {
    setBusy(true);
    setError('');
    try {
      const payload = result 
        ? { eventType: 'cable_degradation', severity: result.severity, confidence: 0.9, impactUsd: result.totalUsdLoss }
        : { eventType: 'cable_degradation', severity: 'high', confidence: 0.8, impactUsd: 800000 };
      
      const data = await getAssistiveSuggestion(payload);
      setSuggestion(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-panel border border-line rounded-lg p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-signal/15 border border-signal/30 flex items-center justify-center text-signal">
            <Brain size={14} />
          </div>
          <div>
            <div className="font-mono text-[9px] uppercase tracking-widest text-signal">Copiloto IA</div>
            <h2 className="font-display text-sm font-semibold text-ink leading-none mt-0.5">Asistente de Resiliencia</h2>
          </div>
        </div>
        <span className="font-mono text-[8px] border border-signal/30 text-signal rounded px-1.5 py-0.5">
          HUMAN-IN-THE-LOOP
        </span>
      </div>

      <p className="text-[11px] text-ink-muted mt-2">
        Analyze the active scenario impact and propose optimized playbooks, reroutes, and logistics mitigation.
      </p>

      {!suggestion ? (
        <button
          type="button"
          onClick={run}
          disabled={busy}
          className="w-full bg-signal text-void rounded py-2 px-3 text-xs font-semibold mt-3 disabled:opacity-50 flex items-center justify-center gap-1.5 hover:bg-signal/80 transition-colors"
        >
          {busy ? (
            <>Analizando...</>
          ) : (
            <>
              <Sparkles size={13} /> Analizar con Copiloto IA
            </>
          )}
        </button>
      ) : (
        <div className="mt-3 border border-line rounded p-3 bg-void/40 flex flex-col gap-2.5">
          <div className="flex justify-between items-center text-[10px] font-mono border-b border-line/60 pb-1.5">
            <span className="text-ink-muted">AI RECOMMENDATION</span>
            <span className="text-signal uppercase font-bold">{suggestion.decision}</span>
          </div>

          <div>
            <h4 className="text-xs font-semibold text-ink">{suggestion.suggestion.playbookName}</h4>
            <p className="text-[11px] text-ink-muted mt-1 leading-normal">{suggestion.suggestion.rationale}</p>
          </div>

          {suggestion.abstainReasons?.length > 0 && (
            <div className="text-[10px] text-alert bg-alert/5 border border-alert/20 rounded p-1.5 font-mono">
              Abstenciones: {suggestion.abstainReasons.join(', ')}
            </div>
          )}

          <div className="bg-panel rounded p-2 border border-line">
            <div className="text-[9px] font-mono text-ink-dim uppercase mb-1">Siguientes Pasos Operativos:</div>
            <div className="space-y-1">
              {suggestion.suggestion.nextSteps.map((step, index) => (
                <div key={`${step}-${index}`} className="text-[10px] text-ink leading-relaxed flex gap-1.5 items-start">
                  <span className="text-signal shrink-0">{index + 1}.</span>
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center mt-1 pt-2 border-t border-line/60">
            <span className="text-[9px] font-mono text-ink-dim">API integration: Disabled</span>
            <button
              onClick={() => setSuggestion(null)}
              className="text-[9px] font-mono text-signal hover:underline"
            >
              New analysis
            </button>
          </div>
        </div>
      )}

      {error && (
        <div role="alert" className="text-xs text-alert mt-3 bg-alert/5 border border-alert/20 p-2 rounded">
          Error en triage: {error}
        </div>
      )}
    </div>
  );
}

