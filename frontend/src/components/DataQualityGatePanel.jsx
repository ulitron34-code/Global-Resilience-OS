import { useEffect, useState } from 'react';
import { getDataCatalogReadiness, getDataQualityGate } from '../api/client';

export default function DataQualityGatePanel() {
  const [gate, setGate] = useState({ ready: false, checks: [], counts: {} });
  const [catalog, setCatalog] = useState({ ready: false, checks: [] });

  useEffect(() => {
    Promise.all([getDataQualityGate(), getDataCatalogReadiness()])
      .then(([nextGate, nextCatalog]) => { setGate(nextGate); setCatalog(nextCatalog); });
  }, []);

  return (
    <div className="bg-panel border border-line rounded-lg p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-signal">Material data gate</div>
          <h2 className="font-display text-lg font-semibold text-ink mt-1">Calidad antes de recomendar</h2>
        </div>
        <span className={gate.ready ? 'font-mono text-[10px] text-signal' : 'font-mono text-[10px] text-alert'}>{gate.ready ? 'ALLOW' : 'ABSTAIN'}</span>
      </div>
      <p className="text-xs text-ink-muted mt-2">Unlicensed feeds, missing contract metadata, illustrative-only coverage, or out-of-SLA freshness block material recommendations.</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">
        <Metric label="Sources" value={gate.counts.total || 0} />
        <Metric label="Pass" value={gate.counts.pass || 0} />
        <Metric label="Abstain" value={gate.counts.abstain || 0} />
      </div>
      <div className="mt-3 space-y-2">
        {gate.checks.map((check) => (
          <div key={check.id} className="border border-line rounded p-2 flex items-center justify-between gap-3 text-xs">
            <span className="text-ink-muted truncate">{check.label}</span>
            <span className={check.status === 'pass' ? 'font-mono text-[10px] text-signal' : 'font-mono text-[10px] text-alert'}>{check.status === 'pass' ? 'PASS' : check.blocking.join(', ')}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 border-t border-line/60 pt-3">
        <div className="font-mono text-[10px] uppercase tracking-widest text-ink-dim">Ficha contractual</div>
        <div className="mt-2 space-y-2">
          {catalog.checks.map((check) => (
            <div key={check.id} className="border border-line/60 rounded p-2 text-[10px]">
              <div className="flex justify-between gap-2">
                <span className="text-ink-muted truncate">{check.label}</span>
                <span className={check.metadataComplete ? 'font-mono text-signal' : 'font-mono text-alert'}>{check.metadataComplete ? 'COMPLETA' : 'INCOMPLETA'}</span>
              </div>
              {check.missingLicenseFields?.length > 0 && <div className="text-ink-dim mt-1">Faltan: {check.missingLicenseFields.join(', ')}</div>}
            </div>
          ))}
        </div>
      </div>
      <div className="text-[10px] text-ink-dim mt-3">{gate.disclaimer}</div>
    </div>
  );
}

function Metric({ label, value }) {
  return <div className="bg-void border border-line rounded p-3"><div className="font-mono text-[9px] uppercase tracking-widest text-ink-dim">{label}</div><div className="font-display text-lg text-ink mt-1">{value}</div></div>;
}


