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
        <span className="font-mono text-xs text-ink-dim animate-pulse">Esperando outcome...</span>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="bg-panel border border-line rounded-lg p-6 flex-1 flex flex-col items-center justify-center text-center">
        <TrendingDown size={20} className="text-ink-dim mb-2" />
        <p className="text-ink-muted text-sm">Cascade impact analysis will appear here after you run a disruption scenario.</p>
      </div>
    );
  }

  const handleSaveScenario = async () => {
    setSaving(true);
    setSaveError('');
    try {
      await createScenario({
        name: `${result.cable.name} · ${result.severity === 'total' ? 'total outage' : 'partial outage'} · ${result.durationHours}h`,
        status: 'recommended',
        lossIfWaitUsd: result.totalUsdLoss,
        mitigationCostUsd: 0,
        protectedValueUsd: result.totalUsdLoss,
        confidence: 0.85,
        horizonHours: result.durationHours,
        assumptions: ['Historical network-disruption correlation.', 'Annualized AIS cargo-flow baseline.'],
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
    color: v.tier === 'direct' ? '#FB923C' : v.tier === 'moderate' ? '#2DD4BF' : '#4A5872',
  }));

  return (
    <div className="bg-panel border border-line rounded-lg p-4 flex-1 flex flex-col gap-4 overflow-y-auto">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-ink-dim mb-1">Total Estimated Loss</div>
          <div className="font-display font-bold text-3xl text-alert leading-none">{formatUsd(result.totalUsdLoss)}</div>
          <div className="text-[11px] text-ink-muted mt-1">
            {result.verticalsAffectedCount} of 12 verticals affected · {result.durationHours}h · {result.severity === 'total' ? 'total outage' : 'partial outage'}
          </div>
        </div>
        <span className={`shrink-0 font-mono text-[9px] uppercase tracking-wider border rounded px-2 py-1 ${
          result.source === 'backend' ? 'text-signal border-signal/30 bg-signal/10 animate-pulse' : 'text-alert border-alert/30 bg-alert/10'
        }`}>
          {result.source === 'backend' ? 'CLOUD CORE COMPUTE' : 'LOCAL FALLBACK COMPUTE'}
        </span>
      </div>

      {result.chokepoints?.length > 0 && (
        <div className="flex items-center gap-1.5 text-[11px] text-alert/90 bg-alert/5 border border-alert/20 rounded px-2.5 py-1.5">
          <AlertTriangle size={12} />
          Crosses: {result.chokepoints.join(', ')}
        </div>
      )}

      <div>
        <div className="font-mono text-[10px] uppercase tracking-widest text-ink-dim mb-2">Impact Cascade by Vertical</div>
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
              formatter={(value) => [formatUsd(value), 'Estimated loss']}
            />
            <Bar dataKey="usdLoss" radius={[0, 3, 3, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 mt-2 font-mono text-[9px] text-ink-muted">
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-alert rounded-sm inline-block" /> Direct impact</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-signal rounded-sm inline-block" /> Moderate</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 bg-ink-dim rounded-sm inline-block" /> Systemic</span>
        </div>
      </div>

      <div className="mt-4 border-t border-line pt-4">
        <div className="font-mono text-[10px] uppercase tracking-widest text-ink-dim mb-3">Operational Recommendations (Playbook)</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
          <div className="border border-line rounded p-3 bg-panel-elevated">
            <div className="text-xs font-semibold text-ink mb-1">Alternate Inland Route</div>
            <div className="font-mono text-[10px] text-signal mb-2">Logistics · 48h lead time</div>
            <div className="flex justify-between text-[11px]">
              <span className="text-ink-muted">Mitigation Cost:</span>
              <span className="text-ink">{formatUsd(result.totalUsdLoss * 0.12)}</span>
            </div>
            <div className="flex justify-between text-[11px] font-semibold mt-1">
              <span className="text-ink-dim">Expected Savings:</span>
              <span className="text-signal">{formatUsd(result.totalUsdLoss * 0.40)}</span>
            </div>
          </div>
          <div className="border border-line rounded p-3 bg-panel-elevated">
            <div className="text-xs font-semibold text-ink mb-1">Activate Supplier B</div>
            <div className="font-mono text-[10px] text-signal mb-2">Sourcing · 24h lead time</div>
            <div className="flex justify-between text-[11px]">
              <span className="text-ink-muted">Mitigation Cost:</span>
              <span className="text-ink">{formatUsd(result.totalUsdLoss * 0.05)}</span>
            </div>
            <div className="flex justify-between text-[11px] font-semibold mt-1">
              <span className="text-ink-dim">Expected Savings:</span>
              <span className="text-signal">{formatUsd(result.totalUsdLoss * 0.25)}</span>
            </div>
          </div>
          <div className="border border-line rounded p-3 bg-panel-elevated">
            <div className="text-xs font-semibold text-ink mb-1">Controlled Allocation</div>
            <div className="font-mono text-[10px] text-signal mb-2">Operations · Immediate</div>
            <div className="flex justify-between text-[11px]">
              <span className="text-ink-muted">Mitigation Cost:</span>
              <span className="text-ink">$0</span>
            </div>
            <div className="flex justify-between text-[11px] font-semibold mt-1">
              <span className="text-ink-dim">Expected Savings:</span>
              <span className="text-signal">{formatUsd(result.totalUsdLoss * 0.15)}</span>
            </div>
          </div>
        </div>
        <div className="bg-panel-elevated border border-line rounded p-4 mb-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="font-mono text-[10px] uppercase tracking-widest text-ink-dim">Decision Cost Comparison</div>
            <span className="font-mono text-[10px] text-signal font-semibold">Valor Protected: {formatUsd(result.totalUsdLoss * 0.63)}</span>
          </div>
          
          <div className="flex flex-col gap-2.5">
            {/* Hacer nada bar */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-alert font-medium">Take No Action (Total Loss)</span>
                <span className="font-mono font-bold text-alert">{formatUsd(result.totalUsdLoss)}</span>
              </div>
              <div className="w-full h-3 bg-void rounded overflow-hidden border border-line">
                <div className="h-full bg-alert rounded-r" style={{ width: '100%' }} />
              </div>
            </div>

            {/* Mitigation bar */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-signal font-medium">Recommended Strategy</span>
                <span className="font-mono font-bold text-signal">
                  {formatUsd(result.totalUsdLoss * 0.37)} <span className="text-[10px] text-ink-muted">({formatUsd(result.totalUsdLoss * 0.12)} mitigation + {formatUsd(result.totalUsdLoss * 0.25)} residual)</span>
                </span>
              </div>
              <div className="w-full h-3 bg-void rounded overflow-hidden border border-line flex">
                <div className="h-full bg-signal" style={{ width: '12%', borderRight: '1px solid #101B2E' }} title="Mitigation Cost (12%)" />
                <div className="h-full bg-signal/40" style={{ width: '25%' }} title="Residual Loss (25%)" />
                <div className="h-full bg-void" style={{ width: '63%' }} />
              </div>
            </div>
          </div>

          <div className="text-[10px] font-mono text-ink-muted mt-1 leading-relaxed border-t border-line/60 pt-2 flex justify-between">
            <span className="flex items-center gap-1"><span className="w-2.5 h-1.5 bg-signal inline-block" /> Mitigation</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-1.5 bg-signal/40 inline-block" /> Residual Loss</span>
            <span className="text-signal font-semibold">↑ 63% risk reduction</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="font-mono text-[10px] uppercase tracking-widest text-ink-dim mb-1.5">Scenario readout</div>
        <button onClick={handleSaveScenario} disabled={!canOperate || saving || saved} className="flex items-center gap-1.5 border border-signal/40 text-signal rounded px-2 py-1 text-[10px] disabled:opacity-60">{saved ? <Check size={12} /> : <Save size={12} />}{!canOperate ? 'Read-only' : saved ? 'Saved' : saving ? 'Saving...' : 'Save scenario'}</button>
      </div>
      {saveError && <div role="alert" className="text-xs text-alert">Could not save: {saveError}</div>}
      <div>
        <p className="text-[13px] text-ink-muted leading-relaxed">{result.narrative}</p>
      </div>
    </div>
  );
}




