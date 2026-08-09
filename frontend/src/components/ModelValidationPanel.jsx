import { useEffect, useRef, useState } from 'react';
import { getCalibrationOverview, getModelValidationReport, recordCalibrationFixtures } from '../api/client';
import { parseBatchText } from '../utils/batchParser';

const emptyDraft = { id: '', eventDate: '', observedImpactUsd: '', predictedImpactUsd: '', sourceId: '', provenance: '', assetId: '', durationHours: '', alternateRoutes: '', recoveryOutcome: '' };

function normalizeFixture(fixture) {
  return { ...fixture, observedImpactUsd: Number(fixture.observedImpactUsd), predictedImpactUsd: Number(fixture.predictedImpactUsd), durationHours: Number(fixture.durationHours), alternateRoutes: Array.isArray(fixture.alternateRoutes) ? fixture.alternateRoutes : String(fixture.alternateRoutes || '').split(',').map((item) => item.trim()).filter(Boolean) };
}

export default function ModelValidationPanel() {
  const [validation, setValidation] = useState({ ready: false, tests: [], calibrationStatus: 'unknown' });
  const [calibration, setCalibration] = useState({ fixtureCount: 0, status: 'unknown', metrics: {} });
  const [draft, setDraft] = useState(emptyDraft);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [fileName, setFileName] = useState('');
  const fileInput = useRef(null);

  const refresh = () => Promise.all([getModelValidationReport(), getCalibrationOverview('impact-cascade')]).then(([validationData, calibrationData]) => { setValidation(validationData); setCalibration(calibrationData); });
  useEffect(() => { refresh(); }, []);

  const submitFixtures = async (fixtures) => {
    setMessage('');
    setError('');
    try {
      await recordCalibrationFixtures({ modelId: 'impact-cascade', fixtures: fixtures.map(normalizeFixture) });
      setDraft(emptyDraft);
      setFileName('');
      setMessage(`${fixtures.length} fixture(s) registrado(s); la muestra aún requiere procedencia y tamaño suficientes.`);
      await refresh();
    } catch (requestError) { setError(requestError.message); }
  };

  const submit = async (event) => { event.preventDefault(); await submitFixtures([draft]); };

  const loadFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const fixtures = parseBatchText(await file.text(), file.name);
      if (fixtures.length > 50) throw new Error('La importación de calibración está limitada a 50 fixtures por confirmación');
      if (!window.confirm(`Registrar ${fixtures.length} fixture(s) históricos? Sólo se deben importar eventos autorizados.`)) return;
      setFileName(`${file.name} · ${fixtures.length} fixture(s)`);
      await submitFixtures(fixtures);
    } catch (requestError) { setError(requestError.message); } finally { event.target.value = ''; }
  };

  const downloadTemplate = (format) => {
    const fixture = { id: 'hist-example-001', eventDate: '2024-01-01', observedImpactUsd: 100000, predictedImpactUsd: 120000, sourceId: 'historical-authorized', provenance: 'authorized-reference-001', assetId: 'asset-historical-001', durationHours: 48, alternateRoutes: ['route-alt-1'], recoveryOutcome: 'Servicio recuperado' };
    const content = format === 'csv' ? `id,eventDate,observedImpactUsd,predictedImpactUsd,sourceId,provenance,assetId,durationHours,alternateRoutes,recoveryOutcome\n${fixture.id},${fixture.eventDate},${fixture.observedImpactUsd},${fixture.predictedImpactUsd},${fixture.sourceId},${fixture.provenance},${fixture.assetId},${fixture.durationHours},route-alt-1,${fixture.recoveryOutcome}` : JSON.stringify([fixture], null, 2);
    const blob = new Blob([content], { type: format === 'csv' ? 'text/csv' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `global-resilience-calibration-template.${format}`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const passed = validation.tests.filter((test) => test.status === 'pass').length;
  return <section className="bg-panel border border-line rounded-lg p-4">
    <div className="flex items-start justify-between gap-3"><div><div className="font-mono text-[10px] uppercase tracking-widest text-signal">Model assurance</div><h2 className="font-display text-lg font-semibold text-ink mt-1">Validación antes de calibrar</h2></div><span className={validation.ready ? 'font-mono text-[10px] text-signal' : 'font-mono text-[10px] text-alert'}>{validation.ready ? 'INVARIANTS PASS' : 'REVISAR'}</span></div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3"><Metric label="Tests locales" value={`${passed}/${validation.tests.length}`} /><Metric label="Fixtures" value={calibration.fixtureCount} /><Metric label="MAE USD" value={calibration.metrics?.maeUsd == null ? '—' : Math.round(calibration.metrics.maeUsd)} /><Metric label="Calibración" value={calibration.status} /></div>
    <p className="text-[11px] text-ink-dim mt-3">Carga sólo eventos históricos autorizados. Las fixtures incompletas se conservan, pero no entran en las métricas ni abren el gate productivo.</p>
    <div className="flex flex-wrap gap-2 mt-3"><input ref={fileInput} type="file" accept=".json,.csv,application/json,text/csv" onChange={loadFile} className="hidden" /><button type="button" onClick={() => fileInput.current?.click()} className="border border-signal/40 text-signal rounded px-3 py-2 text-xs">Importar JSON/CSV</button><button type="button" onClick={() => downloadTemplate('json')} className="border border-line text-ink-muted rounded px-3 py-2 text-xs">Plantilla JSON</button><button type="button" onClick={() => downloadTemplate('csv')} className="border border-line text-ink-muted rounded px-3 py-2 text-xs">Plantilla CSV</button>{fileName && <span className="text-[11px] text-signal self-center">{fileName}</span>}</div>
    <form onSubmit={submit} className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-2"><input className="control" required value={draft.id} onChange={(event) => setDraft({ ...draft, id: event.target.value })} placeholder="ID del evento" aria-label="ID del evento histórico" /><input className="control" required type="date" value={draft.eventDate} onChange={(event) => setDraft({ ...draft, eventDate: event.target.value })} aria-label="Fecha del evento histórico" /><input className="control" required type="number" min="0" value={draft.observedImpactUsd} onChange={(event) => setDraft({ ...draft, observedImpactUsd: event.target.value })} placeholder="Impacto observado USD" aria-label="Impacto observado USD" /><input className="control" required type="number" min="0" value={draft.predictedImpactUsd} onChange={(event) => setDraft({ ...draft, predictedImpactUsd: event.target.value })} placeholder="Impacto predicho USD" aria-label="Impacto predicho USD" /><input className="control" required value={draft.sourceId} onChange={(event) => setDraft({ ...draft, sourceId: event.target.value })} placeholder="Source ID autorizado" aria-label="Source ID autorizado" /><input className="control" required value={draft.provenance} onChange={(event) => setDraft({ ...draft, provenance: event.target.value })} placeholder="Referencia de evidencia" aria-label="Referencia de evidencia" /><input className="control" required value={draft.assetId} onChange={(event) => setDraft({ ...draft, assetId: event.target.value })} placeholder="Activo afectado" aria-label="Activo afectado" /><input className="control" required type="number" min="0" step="0.1" value={draft.durationHours} onChange={(event) => setDraft({ ...draft, durationHours: event.target.value })} placeholder="Duración (h)" aria-label="Duración del evento en horas" /><input className="control" required value={draft.alternateRoutes} onChange={(event) => setDraft({ ...draft, alternateRoutes: event.target.value })} placeholder="Rutas alternativas (coma)" aria-label="Rutas alternativas" /><input className="control md:col-span-2" required value={draft.recoveryOutcome} onChange={(event) => setDraft({ ...draft, recoveryOutcome: event.target.value })} placeholder="Resultado de recuperación" aria-label="Resultado de recuperación" /><button className="border border-signal/40 text-signal rounded px-3 py-2 text-xs md:col-span-3">Registrar fixture histórico</button></form>
    {message && <div role="status" className="text-xs text-signal mt-2">{message}</div>}{error && <div role="alert" className="text-xs text-alert mt-2">{error}</div>}
  </section>;
}

function Metric({ label, value }) { return <div className="bg-void border border-line rounded p-3"><div className="font-mono text-[9px] uppercase tracking-widest text-ink-dim">{label}</div><div className="text-lg text-ink mt-1">{value}</div></div>; }
