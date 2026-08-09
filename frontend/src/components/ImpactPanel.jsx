import { BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import { AlertTriangle, Check, Save, TrendingDown } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { formatUsd } from '../engine/impactEngine';
import { createScenario } from '../api/client';
import { useState } from 'react';
import { useSessionStore } from '../store/useSessionStore';

export default function ImpactPanel() {
  const result = useAppStore((s) => s.result);
  const isSimulating = useAppStore((s) => s.isSimulating);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const user = useSessionStore((state) => state.user);
  const canOperate = !user || user.role !== 'viewer';

  if (isSimulating) {
    return (
      <div className="bg-panel border border-line rounded-lg p-6 flex-1 flex items-center justify-center">
        <span className="font-mono text-xs text-ink-dim animate-pulse">Esperando resultado...</span>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="bg-panel border border-line rounded-lg p-6 flex-1 flex flex-col items-center justify-center text-center">
        <TrendingDown size={20} className="text-ink-dim mb-2" />
        <p className="text-ink-muted text-sm">El análisis de impacto en cascada aparecerá aquí después de simular una ruptura.</p>
      </div>
    );
  }

  const handleSaveScenario = async () => {
    setSaving(true);
    setSaveError('');
    try {
      await createScenario({
        name: `${result.cable.name} · ${result.severity === 'total' ? 'corte total' : 'corte parcial'} · ${result.durationHours}h`,
        status: 'recommended',
        lossIfWaitUsd: result.totalUsdLoss,
        mitigationCostUsd: 0,
        protectedValueUsd: result.totalUsdLoss,
        confidence: 0.5,
        horizonHours: result.durationHours,
        assumptions: ['Modelo heurístico de demo.', 'Valores económicos ilustrativos.'],
      });
      setSaved(true);
    } catch (error) {
      setSaveError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const chartData = result.affected.map((v) => ({
    name: v.label,
    usdLoss: v.usdLoss,
    tier: v.tier,
    color: v.tier === 'directo' ? '#FB923C' : v.tier === 'moderado' ? '#2DD4BF' : '#4A5872',
  }));

  return (
    <div className="bg-panel border border-line rounded-lg p-4 flex-1 flex flex-col gap-4 overflow-y-auto">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-ink-dim mb-1">Pérdida total estimada</div>
          <div className="font-display font-bold text-3xl text-alert leading-none">{formatUsd(result.totalUsdLoss)}</div>
          <div className="text-[11px] text-ink-muted mt-1">
            {result.verticalsAffectedCount} de 12 verticales afectadas · {result.durationHours}h · {result.severity === 'total' ? 'corte total' : 'corte parcial'}
          </div>
        </div>
        <span className={`shrink-0 font-mono text-[9px] uppercase tracking-wider border rounded px-2 py-1 ${
          result.source === 'backend' ? 'text-signal border-signal/30 bg-signal/10' : 'text-ink-muted border-line bg-raised'
        }`}>
          {result.source === 'backend' ? 'calc: backend' : 'calc: local'}
        </span>
      </div>

      {result.chokepoints?.length > 0 && (
        <div className="flex items-center gap-1.5 text-[11px] text-alert/90 bg-alert/5 border border-alert/20 rounded px-2.5 py-1.5">
          <AlertTriangle size={12} />
          Cruza: {result.chokepoints.join(', ')}
        </div>
      )}

      <div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-ink-dim mb-2">Cascada de impacto por vertical</div>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} layout="vertical" margin={{ left: 4, right: 12, top: 0, bottom: 0 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              width={100}
              tick={{ fill: '#8B98B4', fontSize: 11, fontFamily: 'IBM Plex Mono' }}
              axisLine={{ stroke: '#22334E' }}
              tickLine={false}
            />
            <Tooltip
              cursor={{ fill: 'rgba(45, 212, 191, 0.06)' }}
              contentStyle={{ background: '#101B2E', border: '1px solid #22334E', borderRadius: 6, fontSize: 12 }}
              labelStyle={{ color: '#E7ECF5' }}
              formatter={(value) => [formatUsd(value), 'Pérdida estimada']}
            />
            <Bar dataKey="usdLoss" radius={[0, 3, 3, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 mt-2 font-mono text-[9px] text-ink-muted">
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-alert rounded-sm inline-block" /> Impacto directo</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-signal rounded-sm inline-block" /> Moderado</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-ink-dim rounded-sm inline-block" /> Sistémico</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="font-mono text-[10px] uppercase tracking-widest text-ink-dim mb-1.5">Lectura del escenario</div>
        <button onClick={handleSaveScenario} disabled={!canOperate || saving || saved} className="flex items-center gap-1.5 border border-signal/40 text-signal rounded px-2 py-1 text-[10px] disabled:opacity-60">{saved ? <Check size={12} /> : <Save size={12} />}{!canOperate ? 'Solo lectura' : saved ? 'Guardado' : saving ? 'Guardando...' : 'Guardar escenario'}</button>
      </div>
      {saveError && <div role="alert" className="text-xs text-alert">No se pudo guardar: {saveError}</div>}
      <div>
        <p className="text-[13px] text-ink-muted leading-relaxed">{result.narrative}</p>
      </div>
    </div>
  );
}
