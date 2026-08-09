import { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, Clock3, UserRound } from 'lucide-react';
import { addCaseComment, createActionPlan, createDecisionShare, createIncident, createWebhook, downloadAudit, downloadBrief, downloadDecisionPackage, downloadLocalSnapshot, getActionPlans, getAuditIntegrity, getCaseAudit, getCaseComments, getCases, getDataCatalogReadiness, getDataQualityReport, getDeadLetters, getDecisionShares, getImpactGraph, getIncidents, getJobs, getLatestBrief, getOperationalMetrics, getPilotFeedback, getPilotMetrics, getPilotReadiness, getPlaybooks, getProvenanceOverview, getRetentionOverview, getRuntimeReadiness, getSecurityPosture, getSlaOverview, getSourceHealthOverview, getSources, getTenancyContext, getWebhooks, previewActionPlan, processLocalWebhookDeliveries, recordActionPlanOutcome, recordPilotFeedback, resetLocalDemo, restoreLocalSnapshot, retryDeadLetter, revokeDecisionShare, rotateWebhookSecret, runDemoIngestionJob, runSlaSweep, runSourceHealthSweep, updateActionPlan, updateCase, updateIncident } from '../api/client';
import CableList from './CableList';
import ImpactPanel from './ImpactPanel';
import ReportExport from './ReportExport';
import ScenarioBuilder from './ScenarioBuilder';
import WorldMap from './WorldMap';
import ModelUncertaintyPanel from './ModelUncertaintyPanel';
import IngestionConsole from './IngestionConsole';
import BatchIngestionPanel from './BatchIngestionPanel';
import ScenarioComparison from './ScenarioComparison';
import ReadinessPanel from './ReadinessPanel';
import CompliancePanel from './CompliancePanel';
import ModelRegistryPanel from './ModelRegistryPanel';
import ModelValidationPanel from './ModelValidationPanel';
import RegulatoryEvidencePanel from './RegulatoryEvidencePanel';
import RecoveryProfilePanel from './RecoveryProfilePanel';
import ActionLibraryPanel from './ActionLibraryPanel';
import NotificationPolicyPanel from './NotificationPolicyPanel';
import DataQualityGatePanel from './DataQualityGatePanel';
import SourceIntakePanel from './SourceIntakePanel';
import AssistiveSuggestionPanel from './AssistiveSuggestionPanel';
import OperationalScorecardPanel from './OperationalScorecardPanel';
import PilotPackagePanel from './PilotPackagePanel';
import EnterpriseReadinessPanel from './EnterpriseReadinessPanel';
import CooperativeNetworkPanel from './CooperativeNetworkPanel';
import { useSessionStore } from '../store/useSessionStore';

export function NetworkExposureView({ onScenario }) {
  const [sources, setSources] = useState([]);
  useEffect(() => { getSources().then(setSources); }, []);

  return (
    <section className="flex flex-col gap-4">
      <SectionIntro
        eyebrow="Capa de correlación · cable → impacto económico"
        title="Una red física. Una red digital. Una sola decisión."
        description="La plataforma conecta un evento de infraestructura con exposición financiera, logística y una alternativa accionable."
        action="Crear escenario"
        onAction={onScenario}
      />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 min-h-[520px]">
        <div className="bg-panel border border-line rounded-lg overflow-hidden flex flex-col">
          <div className="p-4 border-b border-line">
            <div className="font-mono text-[10px] uppercase tracking-widest text-ink-dim">Digital twin · red crítica</div>
            <h2 className="font-display text-lg font-semibold text-ink mt-1">Corredores energéticos + infraestructura digital</h2>
          </div>
          <div className="flex-1 min-h-[420px]"><WorldMap /></div>
        </div>
        <div className="flex flex-col gap-4">
          <ExposureCard label="Suez / Mar Rojo" value="$3.6M" score="86/100" tone="alert" />
          <ExposureCard label="Estrecho de Ormuz" value="$2.8M" score="64/100" tone="alert" />
          <ExposureCard label="Malaca" value="$1.1M" score="42/100" tone="signal" />
          <div className="bg-panel border border-line rounded-lg p-4">
            <div className="font-mono text-[10px] uppercase tracking-widest text-ink-dim">Fuentes de decisión</div>
            {sources.map((source) => <SourceRow key={source.id} label={source.name} status={source.status} latency={source.latencySeconds} />)}
            {!sources.length && <div className="py-3 text-xs text-ink-muted">Cargando fuentes...</div>}
          </div>
        </div>
      </div>
      <IngestionConsole />
      <BatchIngestionPanel />
    </section>
  );
}

export function ScenarioLabView() {
  return (
    <section className="flex flex-col gap-4">
      <SectionIntro
        eyebrow="What-if · supuestos explícitos"
        title="De una alerta a una decisión económica en minutos."
        description="Modifica el evento y la severidad. El sistema recalcula pérdida esperada; los supuestos permanecen visibles para evitar una caja negra."
      />
      <div className="grid grid-cols-1 lg:grid-cols-[260px_330px_1fr] gap-4 min-h-[560px]">
        <CableList />
        <ScenarioBuilder />
        <div className="flex flex-col gap-4"><ImpactPanel /><ReportExport /></div>
      </div>
      <ScenarioComparison />
      <ModelRegistryPanel />
      <ModelValidationPanel />
    </section>
  );
}

export function CasesView({ vertical = 'Oil & Gas' }) {
  const [cases, setCases] = useState([]);
  const [selectedId, setSelectedId] = useState('RS-0827');
  const [audit, setAudit] = useState([]);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [search, setSearch] = useState('');
  const [caseStatus, setCaseStatus] = useState('');
  const [priority, setPriority] = useState('');
  const [owner, setOwner] = useState('');
  const [sort, setSort] = useState('sla_urgent');
  const [exportError, setExportError] = useState('');
  const [actionError, setActionError] = useState('');
  const [shares, setShares] = useState([]);
  const [shareResult, setShareResult] = useState(null);
  const user = useSessionStore((state) => state.user);
  const canOperate = !user || user.role !== 'viewer';

  useEffect(() => { getCases({ vertical, q: search, status: caseStatus, priority, owner, sort, limit: 100 }).then(setCases); }, [vertical, search, caseStatus, priority, owner, sort]);

  const selectedCase = cases.find((item) => item.id === selectedId) || cases[0];
  const selectedCaseId = selectedCase?.id;
  useEffect(() => { if (selectedCaseId) getCaseAudit(selectedCaseId).then(setAudit); }, [selectedCaseId]);
  useEffect(() => { if (selectedCaseId) getCaseComments(selectedCaseId).then(setComments); }, [selectedCaseId]);
  useEffect(() => { if (selectedCaseId) getDecisionShares(selectedCaseId).then(setShares); }, [selectedCaseId]);
  const handleUpdate = async (patch) => {
    if (!selectedCase) return;
    setActionError('');
    try {
      const updated = await updateCase(selectedCase.id, patch);
      setCases((current) => current.map((item) => item.id === updated.id ? updated : item));
    } catch (error) {
      setActionError(error.message);
    }
  };
  const handleComment = async (event) => { event.preventDefault(); if (!selectedCase || !commentText.trim()) return; setActionError(''); try { const item = await addCaseComment(selectedCase.id, commentText); setComments((current) => [item, ...current]); setCommentText(''); } catch (error) { setActionError(error.message); } };
  const handleDecisionPackage = async () => { if (!selectedCase) return; setExportError(''); try { await downloadDecisionPackage(selectedCase.id); } catch (error) { setExportError(error.message); } };
  const handleCreateShare = async () => { if (!selectedCase || !canOperate) return; setActionError(''); try { const result = await createDecisionShare(selectedCase.id, { expiresInHours: 72, audience: 'revisor de decisión' }); setShareResult(result); setShares((current) => [result.share, ...current]); if (navigator.clipboard) await navigator.clipboard.writeText(`${window.location.origin}${result.path}`); } catch (error) { setActionError(error.message); } };
  const handleRevokeShare = async (shareId) => { if (!selectedCase || !canOperate) return; try { const result = await revokeDecisionShare(selectedCase.id, shareId); setShares((current) => current.map((item) => item.id === result.id ? result : item)); } catch (error) { setActionError(error.message); } };

  return (
    <>
    <section className="flex flex-col gap-4">
      <SectionIntro
        eyebrow="Alerta → caso → resolución → auditoría"
        title="El riesgo necesita dueño, contexto y cierre."
        description="Las alertas críticas se convierten en casos asignables con validación humana, decisiones documentadas y trazabilidad enterprise."
      />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
        <div className="bg-panel border border-line rounded-lg overflow-hidden">
          <div className="p-4 border-b border-line flex flex-col md:flex-row md:items-center justify-between gap-3"><h2 className="font-display font-semibold text-ink">Cola de casos</h2><div className="flex flex-wrap gap-2"><input aria-label="Buscar casos" value={search} onChange={(event) => setSearch(event.target.value)} className="control !w-48" placeholder="Buscar caso..." /><button onClick={async () => { setExportError(''); try { await downloadAudit('csv'); } catch (error) { setExportError(error.message); } }} className="border border-line rounded px-3 text-xs text-ink-muted hover:text-ink">Exportar auditoria</button><button onClick={handleDecisionPackage} disabled={!selectedCase} className="border border-signal/40 text-signal rounded px-3 text-xs disabled:opacity-50">Paquete de decisión</button><button onClick={handleCreateShare} disabled={!selectedCase || !canOperate} className="border border-signal/40 text-signal rounded px-3 text-xs disabled:opacity-50">Compartir solo lectura</button></div></div>
          <div className="px-4 py-2 border-b border-line/60 flex flex-wrap gap-2"><select aria-label="Filtrar estado" value={caseStatus} onChange={(event) => setCaseStatus(event.target.value)} className="control !w-36"><option value="">Todos los estados</option><option value="open">Abierto</option><option value="in_progress">En progreso</option><option value="blocked">Bloqueado</option><option value="closed">Cerrado</option></select><select aria-label="Filtrar prioridad" value={priority} onChange={(event) => setPriority(event.target.value)} className="control !w-32"><option value="">Prioridad</option><option value="P1">P1</option><option value="P2">P2</option><option value="P3">P3</option></select><input aria-label="Filtrar responsable" value={owner} onChange={(event) => setOwner(event.target.value)} className="control !w-40" placeholder="Responsable..." /><select aria-label="Ordenar casos" value={sort} onChange={(event) => setSort(event.target.value)} className="control !w-44"><option value="sla_urgent">SLA más urgente</option><option value="impact_desc">Mayor impacto</option></select></div>
          {exportError && <div role="alert" className="px-4 py-2 text-xs text-alert border-b border-alert/20">No se pudo exportar: {exportError}</div>}
          {actionError && <div role="alert" className="px-4 py-2 text-xs text-alert border-b border-alert/20">No se pudo completar la acción: {actionError}</div>}
          {cases.map((item) => <CaseRow key={item.id} item={item} selected={item.id === selectedCase?.id} onClick={() => setSelectedId(item.id)} />)}
        </div>
        <div className="bg-panel border border-line rounded-lg p-4">
          <div className="font-mono text-[10px] uppercase tracking-widest text-ink-dim">{selectedCase?.id || 'Sin caso'} · bitácora auditable</div>
          <h2 className="font-display text-xl font-semibold text-ink mt-2">{selectedCase?.title || (cases.length ? 'Selecciona un caso' : `Sin casos para ${vertical}`)}</h2>
          <div className="grid grid-cols-2 gap-3 mt-4"><Metric label="Exposición" value={formatUsd(selectedCase?.impactUsd)} /><Metric label="Owner" value={selectedCase?.owner || '—'} /><Metric label="Validación" value={selectedCase?.humanValidation || '—'} /><Metric label="SLA" value={formatSla(selectedCase?.slaMinutes)} /></div>
          <div className="border-l border-signal/40 ml-1 mt-5 pl-4 space-y-4 text-xs text-ink-muted">{audit.length ? audit.slice(0, 5).map((item) => <Timeline key={item.id} time={new Date(item.createdAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })} text={item.message} />) : <div>Cargando bitácora...</div>}</div>
          <div className="mt-5 border-t border-line pt-4"><div className="font-mono text-[10px] uppercase tracking-widest text-ink-dim">Colaboración</div><div className="space-y-2 mt-3 max-h-28 overflow-y-auto">{comments.map((item) => <div key={item.id} className="text-xs text-ink-muted"><span className="font-mono text-[10px] text-signal">{item.author}</span> · {item.body}</div>)}{!comments.length && <div className="text-xs text-ink-dim">Sin comentarios todavía.</div>}</div><form onSubmit={handleComment} className="flex gap-2 mt-3"><input disabled={!canOperate} value={commentText} onChange={(event) => setCommentText(event.target.value)} className="control" placeholder={canOperate ? 'Añadir comentario...' : 'Solo lectura'} /><button disabled={!canOperate || !commentText.trim()} className="bg-signal text-void rounded px-3 text-xs font-semibold disabled:opacity-50">Enviar</button></form></div><div className="flex gap-2 mt-5"><button disabled={!canOperate} onClick={() => handleUpdate({ owner: 'Me' })} className="flex-1 border border-line rounded py-2 text-xs text-ink-muted hover:text-ink disabled:opacity-50">{canOperate ? 'Asignar a mí' : 'Solo lectura'}</button><button disabled={!canOperate} onClick={() => handleUpdate({ humanValidation: 'validated', status: 'closed' })} className="flex-1 bg-signal text-void rounded py-2 text-xs font-semibold disabled:opacity-50">Validar & cerrar</button></div>
        </div>
      </div>
     </section>
       <DecisionShareSummary shares={shares} result={shareResult} canOperate={canOperate} onRevoke={handleRevokeShare} />
    </>
  );
}

function DecisionShareSummary({ shares, result, canOperate, onRevoke }) {
  return <div className="bg-panel border border-line rounded-lg p-4"><div className="font-mono text-[10px] uppercase tracking-widest text-signal">Enlaces de decisión</div><p className="text-xs text-ink-muted mt-2">Enlaces temporales de solo lectura para revisión humana. El token claro sólo se muestra al crearlo.</p>{result && <div className="mt-2 border border-signal/30 rounded p-2 text-[10px] text-signal break-all">Token creado: {result.path}</div>}<div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">{shares.map((share) => <div key={share.id} className="border border-line rounded p-2 text-xs"><div className="flex justify-between gap-2"><span className="font-mono text-[10px] text-signal">{share.id}</span><span className={share.status === 'active' ? 'text-signal' : 'text-alert'}>{share.status}</span></div><div className="text-[10px] text-ink-dim mt-1">Expira {new Date(share.expiresAt).toLocaleString('es-MX')} · accesos {share.accessCount}</div>{share.status === 'active' && <button type="button" onClick={() => onRevoke(share.id)} disabled={!canOperate} className="border border-alert/40 text-alert rounded px-2 py-1 text-[10px] mt-2 disabled:opacity-50">Revocar</button>}</div>)}{!shares.length && <div className="text-[10px] text-ink-dim">Selecciona un caso y crea un enlace de revisión.</div>}</div></div>;
}

export function ExecutiveBriefView({ onScenario, vertical = 'Oil & Gas', region = 'global', horizon = '72' }) {
  const [brief, setBrief] = useState(null);
  useEffect(() => { getLatestBrief().then(setBrief); }, []);
  const exportBrief = async (format) => { await downloadBrief(format); };

  return (
    <section className="flex flex-col gap-4 max-w-5xl">
      <SectionIntro eyebrow="C-suite · 1 página · decisión, no ruido" title="Executive Resilience Brief" description="Una síntesis para dirección: qué cambió, cuánto dinero está expuesto, qué recomienda el sistema y qué decisión necesita autorización." action="Revisar escenario" onAction={onScenario} />
      <div className="bg-panel border border-line rounded-lg p-6 md:p-8">
        <div className="flex items-start justify-between gap-4 border-b border-line pb-5"><div><div className="font-mono text-[10px] text-signal tracking-widest">GLOBAL RESILIENCE OS</div><h2 className="font-display text-2xl font-bold text-ink mt-2">Situation Brief · {vertical}</h2><p className="text-xs text-ink-muted mt-1">{region === 'global' ? 'Global' : region} · Ventana de análisis: próximas {horizon}h · Demo ilustrativa</p></div><div className="text-right"><div className="font-mono text-[10px] text-ink-dim">RESILIENCE</div><div className="font-display text-4xl font-bold text-signal">72<span className="text-sm text-ink-muted">/100</span></div></div></div>
        <div className="my-6 border border-alert/30 bg-alert/5 rounded-lg p-4"><div className="font-mono text-[10px] text-alert tracking-widest">DECISIÓN REQUERIDA</div><h3 className="font-display text-lg font-semibold text-ink mt-2">{brief?.decisionRequired || 'Cargando recomendación...'}</h3><p className="text-sm text-ink-muted mt-2">Valor protegido estimado: {formatUsd(brief?.protectedValueUsd)} bajo el escenario actual.</p></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6"><Metric label="Exposición total" value={formatUsd(brief?.exposureUsd)} /><Metric label="Eventos materiales" value={brief?.materialEvents || '—'} /><Metric label="Valor mitigable" value={formatUsd(brief?.protectedValueUsd)} /><Metric label="Confianza modelo" value={brief ? `${Math.round(brief.confidence * 100)}%` : '—'} /></div>
        <div className="grid md:grid-cols-3 gap-6 border-t border-line pt-5"><BriefPoint index="01" title="Qué cambió" text="Una degradación anómala en SMW-5 coincide con congestión creciente. La exposición combinada supera el umbral P1." /><BriefPoint index="02" title="Qué hacer" text="Activar ruta alternativa, elevar monitoreo de Ormuz y congelar nominaciones sensibles al corredor." /><BriefPoint index="03" title="Qué vigilar" text="Estado de cable, prima spot de flete y capacidad disponible en ruta alterna." /></div><div className="flex flex-wrap gap-2 mt-6"><button onClick={() => exportBrief('json')} className="border border-line text-ink-muted rounded px-3 py-2 text-xs hover:text-ink">Descargar JSON</button><button onClick={() => exportBrief('csv')} className="border border-signal/40 text-signal rounded px-3 py-2 text-xs hover:bg-signal/10">Descargar CSV</button></div>
      </div>
    </section>
  );
}

export function OperationsView() {
  const [jobs, setJobs] = useState([]);
  const [webhooks, setWebhooks] = useState([]);
  const [url, setUrl] = useState('https://example.local/resilience-events');
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState('');
  const [snapshotError, setSnapshotError] = useState('');
  const refresh = async () => { const [jobData, webhookData] = await Promise.all([getJobs(), getWebhooks()]); setJobs(jobData); setWebhooks(webhookData); };
  useEffect(() => { refresh(); }, []);
  const runJob = async () => { setRunning(true); setMessage('Ejecutando ingesta local...'); try { await runDemoIngestionJob(); await refresh(); setMessage('Job completado: seÃ±ales demo procesadas.'); } catch (error) { setMessage(error.message); } finally { setRunning(false); } };
  const addWebhook = async (event) => { event.preventDefault(); try { await createWebhook({ url, events: ['alert.created', 'case.updated'] }); setUrl('https://example.local/resilience-events'); await refresh(); setMessage('Webhook registrado en la cola local.'); } catch (error) { setMessage(error.message); } };
  const rotateSecret = async (id) => { try { const result = await rotateWebhookSecret(id); setMessage(`Nuevo secreto para ${id} (guárdalo ahora): ${result.secret}`); await refresh(); } catch (error) { setMessage(error.message); } };
  const processOutbox = async () => { try { const result = await processLocalWebhookDeliveries(); await refresh(); setMessage(`${result.processed} entregas procesadas en modo simulado.`); } catch (error) { setMessage(error.message); } };
  const downloadSnapshot = async () => { setSnapshotError(''); try { await downloadLocalSnapshot(); } catch (error) { setSnapshotError(error.message); } };
  const resetDemo = async () => { if (!window.confirm('¿Reiniciar la demo local y eliminar los registros operativos creados?')) return; setSnapshotError(''); try { const result = await resetLocalDemo(); await refresh(); setMessage(`Demo reiniciada: ${result.counts.alerts} alertas y ${result.counts.cases} casos semilla.`); } catch (error) { setSnapshotError(error.message); } };
  return <section className="flex flex-col gap-4">
    <SectionIntro eyebrow="OperaciÃ³n Â· jobs Â· conectores Â· trazabilidad" title="La plataforma tambiÃ©n se opera." description="Ejecuta una ingesta controlada, inspecciona su historial y registra destinos de eventos. La entrega externa queda preparada como cola local hasta conectar la infraestructura de producciÃ³n." />
    <ReadinessPanel />
    <RuntimeReadinessPanel />
    <CompliancePanel />
    <RegulatoryEvidencePanel />
    <DataQualityPanel />
    <GovernancePanel />
    <SourceHealthPanel />
    <SourceHealthSweepPanel />
    <PilotReadinessPanel />
    <PilotPackagePanel />
    <EnterpriseReadinessPanel />
    <IncidentResponsePanel />
    <SecurityPosturePanel />
    <ModelUncertaintyPanel />
    <OperationalScorecardPanel />
    <CooperativeNetworkPanel />
    <AuditIntegrityPanel />
    <SlaPanel />
    <DeadLetterPanel />
    <ImpactGraphPanel />
    <TemporalGraphQueryPanel />
    <RecoveryProfilePanel />
    <ActionLibraryPanel />
    <NotificationPolicyPanel />
    <DataQualityGatePanel />
    <SourceIntakePanel />
    <AssistiveSuggestionPanel />
    <ActionPlanPanel />
    <ActionOutcomePanel />
    <LocalRecoveryPanel />
    <WebhookSecretPanel webhooks={webhooks} onRotate={rotateSecret} />
    <div className="flex flex-wrap justify-end gap-2"><button onClick={processOutbox} className="border border-signal/40 text-signal rounded px-3 py-2 text-xs">Procesar outbox local</button><button onClick={downloadSnapshot} className="border border-line text-ink-muted rounded px-3 py-2 text-xs hover:text-ink">Descargar snapshot</button><button onClick={resetDemo} className="border border-alert/40 text-alert rounded px-3 py-2 text-xs hover:bg-alert/10">Reiniciar demo local</button></div>{snapshotError && <div role="alert" className="text-right text-xs text-alert">No se pudo completar la operación: {snapshotError}</div>}
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
      <div className="bg-panel border border-line rounded-lg overflow-hidden"><div className="p-4 border-b border-line flex items-center justify-between"><div><div className="font-mono text-[10px] uppercase tracking-widest text-signal">Job runner local</div><h2 className="font-display text-lg font-semibold text-ink mt-1">Historial de ingestas</h2></div><button onClick={runJob} disabled={running} className="bg-signal text-void rounded px-3 py-2 text-xs font-semibold disabled:opacity-50">{running ? 'Procesando...' : 'Ejecutar demo'}</button></div>{message && <div className="px-4 py-2 text-xs text-signal border-b border-line/60">{message}</div>}<div className="divide-y divide-line/60">{jobs.map((job) => <div key={job.id} className="p-4 flex items-center justify-between gap-3"><div><div className="font-mono text-[10px] text-ink-dim">{job.id} Â· {job.type}</div><div className="text-sm text-ink mt-1">{job.eventsReceived} eventos Â· {job.alertsCreated} alertas creadas</div></div><span className="font-mono text-[10px] text-signal uppercase">{job.status}</span></div>)}{!jobs.length && <div className="p-4 text-xs text-ink-muted">AÃºn no se ha ejecutado un job local.</div>}</div></div>
      <div className="bg-panel border border-line rounded-lg p-4"><div className="font-mono text-[10px] uppercase tracking-widest text-signal">Webhook registry</div><h2 className="font-display text-lg font-semibold text-ink mt-1">Destinos de eventos</h2><p className="text-xs text-ink-muted mt-2">SeÃ±ales encoladas localmente: alert.created y case.updated.</p><form onSubmit={addWebhook} className="flex gap-2 mt-4"><input className="control min-w-0" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://..." /><button className="border border-signal/40 text-signal rounded px-3 text-xs">AÃ±adir</button></form><div className="mt-4 space-y-2">{webhooks.map((hook) => <div key={hook.id} className="border border-line rounded p-3"><div className="flex justify-between gap-2"><span className="font-mono text-[10px] text-signal">{hook.id}</span><span className="font-mono text-[10px] text-signal">{hook.active ? 'ACTIVO' : 'PAUSADO'}</span></div><div className="text-xs text-ink-muted mt-2 break-all">{hook.url}</div></div>)}{!webhooks.length && <div className="text-xs text-ink-dim">Sin destinos configurados.</div>}</div></div>
    </div>
  </section>;
}

function ActionPlanPanel() {
  const [playbooks, setPlaybooks] = useState([]);
  const [plans, setPlans] = useState([]);
  const [selectedPlaybook, setSelectedPlaybook] = useState('cable-degradation');
  const [confidence, setConfidence] = useState('0.8');
  const [lossIfWaitUsd, setLossIfWaitUsd] = useState('900000');
  const [mitigationCostUsd, setMitigationCostUsd] = useState('100000');
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState('');
  const refresh = async () => { const [playbookData, planData] = await Promise.all([getPlaybooks(), getActionPlans({ limit: 8 })]); setPlaybooks(playbookData); setPlans(planData); };
  useEffect(() => { refresh(); }, []);
  const calculate = async (event) => { event.preventDefault(); setMessage(''); try { setPreview(await previewActionPlan({ playbookId: selectedPlaybook, confidence: Number(confidence), lossIfWaitUsd: Number(lossIfWaitUsd), mitigationCostUsd: Number(mitigationCostUsd), protectedValueUsd: Math.max(Number(lossIfWaitUsd) - Number(mitigationCostUsd), 0) })); } catch (error) { setMessage(error.message); } };
  const save = async () => { if (!preview) return; try { await createActionPlan({ playbookId: selectedPlaybook, confidence: Number(confidence), lossIfWaitUsd: Number(lossIfWaitUsd), mitigationCostUsd: Number(mitigationCostUsd), protectedValueUsd: Math.max(Number(lossIfWaitUsd) - Number(mitigationCostUsd), 0) }); setMessage('Plan guardado como borrador para aprobación humana.'); await refresh(); } catch (error) { setMessage(error.message); } };
  const approve = async (plan) => { try { await updateActionPlan(plan.id, { status: 'approved', humanApproval: 'approved' }); setMessage(`${plan.id} aprobado por el operador local.`); await refresh(); } catch (error) { setMessage(error.message); } };
  return <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4"><div className="bg-panel border border-line rounded-lg p-4"><div className="font-mono text-[10px] uppercase tracking-widest text-signal">Scenario-to-Action Engine</div><h2 className="font-display text-lg font-semibold text-ink mt-1">De señal a decisión auditable</h2><p className="text-xs text-ink-muted mt-2">Calcula economía y confianza, revisa supuestos y guarda el plan sólo como borrador hasta la aprobación humana.</p><form onSubmit={calculate} className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4"><select className="control col-span-2 md:col-span-4" value={selectedPlaybook} onChange={(event) => setSelectedPlaybook(event.target.value)}>{playbooks.map((playbook) => <option key={playbook.id} value={playbook.id}>{playbook.name}</option>)}</select><input className="control" type="number" min="0" value={lossIfWaitUsd} onChange={(event) => setLossIfWaitUsd(event.target.value)} aria-label="Pérdida por esperar" placeholder="Pérdida por esperar" /><input className="control" type="number" min="0" value={mitigationCostUsd} onChange={(event) => setMitigationCostUsd(event.target.value)} aria-label="Costo de mitigación" placeholder="Costo mitigación" /><input className="control" type="number" min="0" max="1" step="0.05" value={confidence} onChange={(event) => setConfidence(event.target.value)} aria-label="Confianza" placeholder="Confianza" /><button className="bg-signal text-void rounded px-3 py-2 text-xs font-semibold">Calcular preview</button></form>{message && <div className="text-xs text-signal mt-3" role="status">{message}</div>}{preview && <div className="border border-line rounded p-3 mt-4"><div className="flex justify-between text-xs"><span className="text-ink-muted">Decisión</span><span className={preview.decision.startsWith('abstain') ? 'text-alert' : 'text-signal'}>{preview.decision}</span></div><div className="grid grid-cols-3 gap-2 mt-3"><Metric label="Pérdida espera" value={`$${Math.round(preview.economics.lossIfWaitUsd).toLocaleString()}`} /><Metric label="Costo acción" value={`$${Math.round(preview.economics.mitigationCostUsd).toLocaleString()}`} /><Metric label="Confianza" value={`${Math.round(preview.confidence * 100)}%`} /></div><div className="text-[10px] text-ink-dim mt-3">{preview.disclaimer}</div><button type="button" onClick={save} className="border border-signal/40 text-signal rounded px-3 py-2 text-xs mt-3">Guardar borrador</button></div>}</div><div className="bg-panel border border-line rounded-lg p-4"><div className="font-mono text-[10px] uppercase tracking-widest text-signal">Decision ledger</div><h2 className="font-display text-lg font-semibold text-ink mt-1">Planes recientes</h2><div className="mt-3 space-y-2">{plans.map((plan) => <div key={plan.id} className="border border-line rounded p-3"><div className="flex justify-between gap-2"><span className="font-mono text-[10px] text-signal">{plan.id}</span><span className="font-mono text-[10px] text-ink-muted">{plan.status}</span></div><div className="text-xs text-ink mt-2">{plan.playbook?.name}</div>{plan.status === 'draft_for_human_approval' && <button type="button" onClick={() => approve(plan)} className="border border-line rounded px-2 py-1 text-[10px] text-ink-muted mt-2">Aprobar humanamente</button>}</div>)}{!plans.length && <div className="text-xs text-ink-dim">Aún no hay planes locales.</div>}</div></div></div>;
}

function ActionOutcomePanel() {
  const [plans, setPlans] = useState([]);
  const [draft, setDraft] = useState({});
  const [message, setMessage] = useState('');
  const refresh = async () => setPlans(await getActionPlans({ limit: 12 }));
  useEffect(() => { refresh(); }, []);
  const field = (id, name, value) => setDraft((current) => ({ ...current, [id]: { ...(current[id] || {}), [name]: value } }));
  const start = async (plan) => { try { await updateActionPlan(plan.id, { status: 'in_execution' }); setMessage(`${plan.id}: ejecucion iniciada.`); await refresh(); } catch (error) { setMessage(error.message); } };
  const close = async (plan) => { const item = draft[plan.id] || {}; try { await recordActionPlanOutcome(plan.id, { actualLossUsd: Number(item.actualLossUsd), actualRecoveryHours: Number(item.actualRecoveryHours), evidenceRef: item.evidenceRef, outcome: item.outcome }); setMessage(`${plan.id}: outcome registrado y plan cerrado.`); await refresh(); } catch (error) { setMessage(error.message); } };
  return <div className="bg-panel border border-line rounded-lg p-4"><div className="font-mono text-[10px] uppercase tracking-widest text-signal">Outcome feedback loop</div><div className="flex items-center justify-between gap-3"><h2 className="font-display text-lg font-semibold text-ink mt-1">Medir resultado real de la accion</h2><span className="font-mono text-[10px] text-ink-dim">LOCAL</span></div><p className="text-xs text-ink-muted mt-2">Activa la ejecucion aprobada y registra perdida, recuperacion y evidencia para medir el error del pronostico.</p>{message && <div role="status" className="text-xs text-signal mt-3">{message}</div>}<div className="mt-3 space-y-2">{plans.filter((plan) => ['approved', 'in_execution'].includes(plan.status)).map((plan) => <div key={plan.id} className="border border-line rounded p-3"><div className="flex justify-between gap-2"><span className="font-mono text-[10px] text-signal">{plan.id}</span><span className="font-mono text-[10px] text-ink-muted">{plan.status}</span></div>{plan.status === 'approved' && <button type="button" onClick={() => start(plan)} className="border border-signal/40 text-signal rounded px-2 py-1 text-[10px] mt-2">Iniciar ejecucion</button>}{plan.status === 'in_execution' && <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mt-2"><input className="control" type="number" min="0" placeholder="Perdida real USD" onChange={(event) => field(plan.id, 'actualLossUsd', event.target.value)} /><input className="control" type="number" min="0" placeholder="Recuperacion real h" onChange={(event) => field(plan.id, 'actualRecoveryHours', event.target.value)} /><input className="control" placeholder="Evidencia" onChange={(event) => field(plan.id, 'evidenceRef', event.target.value)} /><button type="button" onClick={() => close(plan)} className="border border-signal/40 text-signal rounded px-2 py-1 text-[10px]">Cerrar con outcome</button></div>}</div>)}{!plans.some((plan) => ['approved', 'in_execution'].includes(plan.status)) && <div className="text-xs text-ink-dim">No hay planes aprobados o en ejecucion para medir.</div>}</div></div>;
}

function RuntimeReadinessPanel() {
  const [runtime, setRuntime] = useState({ ready: false, checks: {}, config: {} });
  const [catalog, setCatalog] = useState({ ready: false, checks: [] });
  useEffect(() => { Promise.all([getRuntimeReadiness(), getDataCatalogReadiness(), getTenancyContext()]).then(([runtimeData, catalogData]) => { setRuntime(runtimeData); setCatalog(catalogData); }); }, []);
  return <div className="grid grid-cols-1 xl:grid-cols-2 gap-4"><div className="bg-panel border border-line rounded-lg p-4"><div className="flex justify-between gap-3"><div><div className="font-mono text-[10px] uppercase tracking-widest text-signal">Runtime readiness</div><h2 className="font-display text-lg font-semibold text-ink mt-1">Modo y controles de arranque</h2></div><span className={`font-mono text-[10px] ${runtime.ready ? 'text-signal' : 'text-alert'}`}>{runtime.ready ? 'READY' : 'REVISAR'}</span></div><div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">{Object.entries(runtime.checks || {}).map(([key, value]) => <Metric key={key} label={key} value={value ? 'PASS' : 'REVISAR'} />)}</div><div className="text-[10px] text-ink-dim mt-3">Modo: {runtime.config?.mode || 'desconocido'} · datos: {runtime.config?.dataMode || 'desconocidos'} · acciones externas: {runtime.config?.allowExternalActions ? 'habilitadas' : 'deshabilitadas'}</div></div><div className="bg-panel border border-line rounded-lg p-4"><div className="flex justify-between gap-3"><div><div className="font-mono text-[10px] uppercase tracking-widest text-signal">Data catalog</div><h2 className="font-display text-lg font-semibold text-ink mt-1">Licencias y cobertura</h2></div><span className={`font-mono text-[10px] ${catalog.ready ? 'text-signal' : 'text-alert'}`}>{catalog.ready ? 'READY' : 'PENDIENTE'}</span></div><div className="mt-3 space-y-2">{(catalog.checks || []).map((check) => <div key={check.id} className="border border-line rounded p-2 flex items-center justify-between gap-3 text-xs"><span className="text-ink-muted truncate">{check.label}</span><span className={`font-mono text-[10px] ${check.status === 'pass' ? 'text-signal' : 'text-alert'}`}>{check.licenseStatus}</span></div>)}</div></div></div>;
}

function ImpactGraphPanel() {
  const [graph, setGraph] = useState({ nodes: [], edges: [], counts: {} });
  const [playbooks, setPlaybooks] = useState([]);
  useEffect(() => { Promise.all([getImpactGraph({ cableId: 'seamewe3' }), getPlaybooks()]).then(([graphData, playbookData]) => { setGraph(graphData); setPlaybooks(playbookData); }); }, []);
  const cables = graph.nodes.filter((item) => item.type === 'cable');
  const chokepoints = graph.nodes.filter((item) => item.type === 'chokepoint');
  const directEdges = graph.edges.filter((item) => item.relation === 'exposes_directly').sort((a, b) => b.weight - a.weight).slice(0, 5);
  return <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4">
    <div className="bg-panel border border-line rounded-lg p-4"><div className="flex items-start justify-between gap-3"><div><div className="font-mono text-[10px] uppercase tracking-widest text-signal">Impact Graph v1</div><h2 className="font-display text-lg font-semibold text-ink mt-1">Dependencias explicables</h2></div><span className="font-mono text-[10px] text-signal">{graph.counts.nodes || 0} NODOS</span></div><p className="text-xs text-ink-muted mt-2">Relaciones locales entre infraestructura digital, chokepoints y verticales. Cada arista conserva confianza, procedencia y vigencia.</p><div className="grid grid-cols-3 gap-2 mt-4"><Metric label="Cables" value={cables.length} /><Metric label="Chokepoints" value={chokepoints.length} /><Metric label="Relaciones" value={graph.counts.edges || 0} /></div><div className="mt-4 space-y-2">{directEdges.map((edge) => <div key={edge.id} className="border border-line rounded p-3 flex items-center justify-between gap-3"><div className="min-w-0"><div className="text-xs text-ink truncate">{edge.from.replace('cable:', '')} → {edge.to.replace('vertical:', '')}</div><div className="font-mono text-[10px] text-ink-dim mt-1">{edge.provenance} · confianza {Math.round(edge.confidence * 100)}%</div></div><span className="font-mono text-xs text-alert">{Math.round(edge.weight * 100)}%</span></div>)}{!directEdges.length && <div className="text-xs text-ink-dim">Sin relaciones directas disponibles.</div>}</div><div className="text-[10px] text-ink-dim mt-4">{graph.disclaimer}</div></div>
    <div className="bg-panel border border-line rounded-lg p-4"><div className="font-mono text-[10px] uppercase tracking-widest text-signal">Scenario-to-Action</div><h2 className="font-display text-lg font-semibold text-ink mt-1">Playbooks listos</h2><div className="mt-3 space-y-2">{playbooks.map((playbook) => <div key={playbook.id} className="border border-line rounded p-3"><div className="text-xs text-ink">{playbook.name}</div><div className="font-mono text-[10px] text-ink-dim mt-1">{playbook.category} · SLA {playbook.defaultSlaMinutes}m · {playbook.steps.length} pasos</div></div>)}{!playbooks.length && <div className="text-xs text-ink-dim">Playbooks no disponibles.</div>}</div></div>
  </div>;
}

function TemporalGraphQueryPanel() {
  const [asOf, setAsOf] = useState('2026-02-01T00:00');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const query = async () => { setError(''); try { setResult(await getImpactGraph({ cableId: 'seamewe3', asOf: new Date(asOf).toISOString() })); } catch (err) { setError(err.message); } };
  return <div className="bg-panel border border-line rounded-lg p-4"><div className="font-mono text-[10px] uppercase tracking-widest text-signal">Temporal query lab</div><h2 className="font-display text-lg font-semibold text-ink mt-1">Consultar cascada por fecha</h2><p className="text-xs text-ink-muted mt-2">Reproduce qué relaciones del grafo estaban vigentes en un instante concreto.</p><div className="flex flex-wrap items-center gap-2 mt-3"><input className="control" type="datetime-local" value={asOf} onChange={(event) => setAsOf(event.target.value)} aria-label="Fecha del grafo" /><button type="button" onClick={query} className="border border-signal/40 text-signal rounded px-3 py-2 text-xs">Consultar fecha</button></div>{error && <div role="alert" className="text-xs text-alert mt-3">{error}</div>}{result && <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4"><Metric label="As of" value={new Date(result.temporalFilter?.asOf).toLocaleDateString()} /><Metric label="Relaciones activas" value={result.counts.edges} /><Metric label="Nodos" value={result.counts.nodes} /><Metric label="Vigencia" value={result.counts.edges ? 'ACTIVA' : 'SIN RELACIONES'} /></div>}</div>;
}

function WebhookSecretPanel({ webhooks, onRotate }) {
  if (!webhooks.length) return null;
  return <div className="bg-panel border border-line rounded-lg p-4"><div className="font-mono text-[10px] uppercase tracking-widest text-signal">Seguridad de webhooks</div><p className="text-xs text-ink-muted mt-2">Los secretos no se muestran. Rota uno solo si puedes guardar el nuevo valor de inmediato.</p><div className="flex flex-wrap gap-2 mt-3">{webhooks.map((hook) => <button key={hook.id} type="button" onClick={() => onRotate(hook.id)} className="border border-alert/40 text-alert rounded px-3 py-2 text-xs">Rotar {hook.id}</button>)}</div></div>;
}

function LocalRecoveryPanel() {
  const [metrics, setMetrics] = useState({ requests: 0, errors: 0, routes: [] });
  const [message, setMessage] = useState('');
  const refreshMetrics = async () => setMetrics(await getOperationalMetrics());
  useEffect(() => { refreshMetrics(); }, []);
  const restore = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      if (!window.confirm('Restaurar este snapshot reemplazará el estado local actual. ¿Continuar?')) return;
      const snapshot = JSON.parse(await file.text());
      const result = await restoreLocalSnapshot(snapshot);
      setMessage(`Snapshot restaurado: ${Object.values(result.counts).reduce((sum, value) => sum + value, 0)} registros.`);
      await refreshMetrics();
    } catch (error) {
      setMessage(`No se pudo restaurar: ${error.message}`);
    }
  };
  return <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
    <div className="bg-panel border border-line rounded-lg p-4">
      <div className="font-mono text-[10px] uppercase tracking-widest text-signal">Recuperación local</div>
      <h2 className="font-display text-lg font-semibold text-ink mt-1">Respaldo verificable</h2>
      <p className="text-xs text-ink-muted mt-2">Carga un snapshot exportado previamente para recuperar el estado portable. La acción requiere confirmación y deja una entrada de auditoría.</p>
      <label className="inline-flex mt-4 border border-signal/40 text-signal rounded px-3 py-2 text-xs cursor-pointer hover:bg-signal/10">Restaurar snapshot<input type="file" accept="application/json,.json" onChange={restore} className="hidden" /></label>
      {message && <div role="status" className="mt-3 text-xs text-signal">{message}</div>}
    </div>
    <div className="bg-panel border border-line rounded-lg p-4">
      <div className="font-mono text-[10px] uppercase tracking-widest text-signal">Observabilidad local</div>
      <h2 className="font-display text-lg font-semibold text-ink mt-1">Actividad de API</h2>
      <div className="grid grid-cols-2 gap-2 mt-3"><Metric label="Solicitudes" value={metrics.requests} /><Metric label="Errores" value={metrics.errors} /></div>
      <div className="mt-3 space-y-1">{metrics.routes.slice(0, 4).map((route) => <div key={route.route} className="flex justify-between gap-2 text-[10px] font-mono text-ink-muted"><span className="truncate">{route.route}</span><span>{route.count} · {route.averageMs}ms</span></div>)}{!metrics.routes.length && <div className="text-xs text-ink-dim">Sin tráfico registrado aún.</div>}</div>
    </div>
  </div>;
}

function DataQualityPanel() {
  const [report, setReport] = useState({ ready: false, checks: [], totals: {} });
  useEffect(() => { getDataQualityReport().then(setReport); }, []);
  return <div className="bg-panel border border-line rounded-lg p-4">
    <div className="flex items-start justify-between gap-3"><div><div className="font-mono text-[10px] uppercase tracking-widest text-signal">Data quality gate</div><h2 className="font-display text-lg font-semibold text-ink mt-1">Integridad del estado local</h2></div><span className={`font-mono text-[10px] ${report.ready ? 'text-signal' : 'text-alert'}`}>{report.ready ? 'PASS' : 'REVISAR'}</span></div>
    <div className="flex flex-wrap gap-3 mt-3 text-[10px] font-mono text-ink-muted">{Object.entries(report.totals || {}).map(([key, value]) => <span key={key}>{key}: {value}</span>)}</div>
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-2 mt-3">{report.checks.map((check) => <div key={check.id} className="border border-line rounded p-2"><div className="text-[10px] text-ink-muted">{check.label}</div><div className={`font-mono text-[10px] mt-1 ${check.status === 'pass' ? 'text-signal' : check.status === 'warn' ? 'text-alert' : 'text-alert'}`}>{check.status.toUpperCase()} · {check.count}</div></div>)}{!report.checks.length && <div className="text-xs text-ink-dim">Informe no disponible.</div>}</div>
  </div>;
}

function GovernancePanel() {
  const [provenance, setProvenance] = useState({ ready: false, sources: [], models: [] });
  const [retention, setRetention] = useState({ dryRun: true, retentionDays: 365, collections: [] });
  useEffect(() => { Promise.all([getProvenanceOverview(), getRetentionOverview()]).then(([sourceData, retentionData]) => { setProvenance(sourceData); setRetention(retentionData); }); }, []);
  return <div className="grid grid-cols-1 xl:grid-cols-2 gap-4"><div className="bg-panel border border-line rounded-lg p-4"><div className="flex items-start justify-between gap-3"><div><div className="font-mono text-[10px] uppercase tracking-widest text-signal">Data governance</div><h2 className="font-display text-lg font-semibold text-ink mt-1">Procedencia y supuestos</h2></div><span className="font-mono text-[10px] text-signal">{provenance.ready ? 'REGISTRADO' : 'REVISAR'}</span></div><p className="text-xs text-ink-muted mt-2">Cada fuente y modelo conserva linaje, clasificación, limitaciones y estado de validación.</p><div className="mt-3 space-y-2">{provenance.sources.slice(0, 4).map((source) => <div key={source.id} className="border border-line rounded p-2"><div className="flex justify-between gap-2 text-xs"><span className="text-ink truncate">{source.name}</span><span className="font-mono text-[10px] text-alert">{source.licenseStatus}</span></div><div className="text-[10px] text-ink-dim mt-1">{source.lineage.join(' → ')}</div></div>)}{!provenance.sources.length && <div className="text-xs text-ink-dim">Registro no disponible.</div>}</div></div><div className="bg-panel border border-line rounded-lg p-4"><div className="flex items-start justify-between gap-3"><div><div className="font-mono text-[10px] uppercase tracking-widest text-signal">Retention control</div><h2 className="font-display text-lg font-semibold text-ink mt-1">Revisión no destructiva</h2></div><span className="font-mono text-[10px] text-signal">DRY RUN</span></div><p className="text-xs text-ink-muted mt-2">Política local: {retention.retentionDays} días. No elimina datos; prepara la revisión legal futura.</p><div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">{retention.collections.slice(0, 8).map((item) => <Metric key={item.name} label={item.name} value={`${item.eligibleForReview}/${item.total}`} />)}</div></div></div>;
}

function SourceHealthPanel() {
  const [report, setReport] = useState({ ready: false, counts: {}, sources: [] });
  useEffect(() => { getSourceHealthOverview().then(setReport); }, []);
  const labels = { healthy: 'SANAS', degraded: 'DEGRADADAS', stale: 'STALE', demo: 'DEMO', unknown: 'SIN OBSERVAR', error: 'ERROR' };
  return <div className="bg-panel border border-line rounded-lg p-4"><div className="flex items-start justify-between gap-3"><div><div className="font-mono text-[10px] uppercase tracking-widest text-signal">Source health</div><h2 className="font-display text-lg font-semibold text-ink mt-1">Salud de fuentes</h2></div><span className={`font-mono text-[10px] ${report.ready ? 'text-signal' : 'text-alert'}`}>{report.ready ? 'READY' : 'REVISAR'}</span></div><div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2 mt-3">{Object.entries(labels).map(([key, label]) => <Metric key={key} label={label} value={report.counts[key] || 0} />)}</div><div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">{report.sources.map((source) => <div key={source.id} className="border border-line rounded p-2 flex items-center justify-between gap-3 text-xs"><span className="text-ink-muted truncate">{source.name}</span><span className={`font-mono text-[10px] ${['healthy', 'demo'].includes(source.health) ? 'text-signal' : 'text-alert'}`}>{source.health}{source.latencySeconds !== null ? ` · ${source.latencySeconds}s` : ''}</span></div>)}</div></div>;
}

function SourceHealthSweepPanel() {
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState('');
  const sweep = async () => {
    setRunning(true);
    setMessage('');
    try {
      const next = await runSourceHealthSweep();
      setResult(next);
      setMessage('Diagnóstico ejecutado y registrado en auditoría.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setRunning(false);
    }
  };
  return <div className="bg-panel border border-line rounded-lg p-4">
    <div className="flex items-start justify-between gap-3"><div><div className="font-mono text-[10px] uppercase tracking-widest text-signal">Source health sweep</div><h2 className="font-display text-lg font-semibold text-ink mt-1">Diagnóstico operativo de feeds</h2></div><button type="button" onClick={sweep} disabled={running} className="border border-signal/40 text-signal rounded px-3 py-2 text-xs disabled:opacity-50">{running ? 'Ejecutando...' : 'Ejecutar diagnóstico'}</button></div>
    <p className="text-xs text-ink-muted mt-2">Evalúa frescura y degradación de fuentes, genera notificaciones deduplicadas y conserva el resultado para revisión humana.</p>
    {message && <div role="status" className="text-xs text-signal mt-3">{message}</div>}
    {result && <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3"><Metric label="Fuentes evaluadas" value={result.evaluated} /><Metric label="Marcadas" value={result.flagged} /><Metric label="Notificaciones" value={result.notificationsCreated} /><Metric label="Estado" value={result.ready ? 'READY' : 'REVISAR'} /></div>}
  </div>;
}

function PilotReadinessPanel() {
  const [readiness, setReadiness] = useState({ status: 'loading', checks: [] });
  const [metrics, setMetrics] = useState({ metrics: {}, missingEvidence: [] });
  const [feedback, setFeedback] = useState([]);
  const [draft, setDraft] = useState({ stage: 'interview', role: '', summary: '', evidence: '', urgencyScore: '3' });
  const [message, setMessage] = useState('');
  const refresh = () => Promise.all([getPilotReadiness(), getPilotMetrics(), getPilotFeedback()]).then(([nextReadiness, nextMetrics, nextFeedback]) => { setReadiness(nextReadiness); setMetrics(nextMetrics); setFeedback(nextFeedback); });
  useEffect(() => { refresh(); }, []);
  const passed = readiness.checks?.filter((check) => check.pass).length || 0;
  const submit = async (event) => { event.preventDefault(); setMessage(''); try { await recordPilotFeedback({ ...draft, urgencyScore: Number(draft.urgencyScore) }); setDraft((current) => ({ ...current, summary: '', evidence: '' })); setMessage('Feedback registrado y auditado.'); await refresh(); } catch (error) { setMessage(error.message); } };
  return <div className="bg-panel border border-line rounded-lg p-4"><div className="flex items-start justify-between gap-3"><div><div className="font-mono text-[10px] uppercase tracking-widest text-signal">Pilot readiness</div><h2 className="font-display text-lg font-semibold text-ink mt-1">Preparación verificable del piloto</h2></div><span className={`font-mono text-[10px] ${readiness.customerReady ? 'text-signal' : 'text-alert'}`}>{readiness.customerReady ? 'CUSTOMER READY' : 'EVIDENCIA PENDIENTE'}</span></div><p className="text-xs text-ink-muted mt-2">Separa la capacidad técnica local de la evidencia que sólo puede obtenerse con entrevistas, datos autorizados y decisiones reales.</p><div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-3"><Metric label="Gates pass" value={`${passed}/${readiness.checks?.length || 0}`} /><Metric label="Casos" value={metrics.metrics?.casesObserved || 0} /><Metric label="Acciones" value={metrics.metrics?.actionsDocumented || 0} /><Metric label="Outcomes" value={metrics.metrics?.outcomesRecorded || 0} /><Metric label="Feedback" value={feedback.length} /></div><div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">{(readiness.checks || []).slice(0, 8).map((check) => <div key={check.id} className="border border-line rounded p-2 flex items-center justify-between gap-2 text-xs"><span className="text-ink-muted">{check.label}</span><span className={`font-mono text-[10px] ${check.pass ? 'text-signal' : 'text-alert'}`}>{check.pass ? 'PASS' : 'PENDIENTE'}</span></div>)}</div><form onSubmit={submit} className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-2"><select className="control" value={draft.stage} onChange={(event) => setDraft({ ...draft, stage: event.target.value })}><option value="interview">Entrevista</option><option value="pilot_review">Revisión piloto</option><option value="gate_review">Revisión de gate</option></select><input className="control" required value={draft.role} onChange={(event) => setDraft({ ...draft, role: event.target.value })} placeholder="Rol entrevistado" /><input className="control" required value={draft.summary} onChange={(event) => setDraft({ ...draft, summary: event.target.value })} placeholder="Hallazgo resumido" /><button className="border border-signal/40 text-signal rounded px-3 py-2 text-xs">Registrar feedback</button></form>{message && <div role="status" className="text-xs text-signal mt-2">{message}</div>}</div>;
}

function IncidentResponsePanel() {
  const [incidents, setIncidents] = useState([]);
  const [draft, setDraft] = useState({ title: '', severity: 'sev2', summary: '' });
  const [message, setMessage] = useState('');
  const refresh = async () => setIncidents(await getIncidents());
  useEffect(() => { refresh(); }, []);
  const open = async (event) => { event.preventDefault(); try { await createIncident(draft); setDraft({ title: '', severity: 'sev2', summary: '' }); setMessage('Incidente abierto y auditado.'); await refresh(); } catch (error) { setMessage(error.message); } };
  const triage = async (item) => { try { await updateIncident(item.id, { status: 'triaged', note: 'Triage confirmado por operador local.' }); await refresh(); } catch (error) { setMessage(error.message); } };
  return <div className="bg-panel border border-line rounded-lg p-4"><div className="flex items-start justify-between gap-3"><div><div className="font-mono text-[10px] uppercase tracking-widest text-alert">Incident response</div><h2 className="font-display text-lg font-semibold text-ink mt-1">Registro de incidentes</h2></div><span className="font-mono text-[10px] text-alert">{incidents.filter((item) => !['closed', 'resolved'].includes(item.status)).length} ABIERTOS</span></div><p className="text-xs text-ink-muted mt-2">Coordina reconocimiento, owner, contención y recuperación; no ejecuta cambios externos automáticamente.</p><form onSubmit={open} className="grid grid-cols-1 md:grid-cols-4 gap-2 mt-3"><input className="control" required value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Título del incidente" /><select className="control" value={draft.severity} onChange={(event) => setDraft({ ...draft, severity: event.target.value })}><option value="sev1">SEV1</option><option value="sev2">SEV2</option><option value="sev3">SEV3</option><option value="sev4">SEV4</option></select><input className="control md:col-span-2" required value={draft.summary} onChange={(event) => setDraft({ ...draft, summary: event.target.value })} placeholder="Resumen y alcance" /><button className="border border-alert/40 text-alert rounded px-3 py-2 text-xs md:col-span-4">Abrir incidente</button></form>{message && <div role="status" className="text-xs text-signal mt-2">{message}</div>}<div className="mt-3 space-y-2">{incidents.slice(0, 5).map((item) => <div key={item.id} className="border border-line rounded p-3 flex items-center justify-between gap-3"><div><div className="font-mono text-[10px] text-alert">{item.id} · {item.severity} · {item.status}</div><div className="text-xs text-ink mt-1">{item.title}</div></div>{item.status === 'open' && <button type="button" onClick={() => triage(item)} className="border border-signal/40 text-signal rounded px-2 py-1 text-[10px]">Pasar a triage</button>}</div>)}{!incidents.length && <div className="text-xs text-ink-dim">No hay incidentes locales registrados.</div>}</div></div>;
}

function SecurityPosturePanel() {
  const [posture, setPosture] = useState({ status: 'loading', checks: [], counts: {} });
  useEffect(() => { getSecurityPosture().then(setPosture); }, []);
  return <div className="bg-panel border border-line rounded-lg p-4"><div className="flex items-start justify-between gap-3"><div><div className="font-mono text-[10px] uppercase tracking-widest text-signal">Security posture</div><h2 className="font-display text-lg font-semibold text-ink mt-1">Gate técnico de seguridad</h2></div><span className={`font-mono text-[10px] ${posture.status === 'pass' ? 'text-signal' : 'text-alert'}`}>{posture.status?.toUpperCase()}</span></div><p className="text-xs text-ink-muted mt-2">Consolida configuración, auditoría, snapshot, tenant y guardas de acciones externas antes del handoff.</p><div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3"><Metric label="Pass" value={posture.counts?.pass || 0} /><Metric label="Warnings" value={posture.counts?.warnings || 0} /><Metric label="Failures" value={posture.counts?.failures || 0} /><Metric label="Production gate" value={posture.productionGate ? 'PASS' : 'REVISAR'} /></div><div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">{(posture.checks || []).map((check) => <div key={check.id} className="border border-line rounded p-2 flex items-center justify-between gap-2 text-xs"><span className="text-ink-muted">{check.label}</span><span className={`font-mono text-[10px] ${check.status === 'pass' ? 'text-signal' : 'text-alert'}`}>{check.status.toUpperCase()}</span></div>)}</div></div>;
}

function AuditIntegrityPanel() {
  const [integrity, setIntegrity] = useState({ valid: false, sealed: false, entries: 0, sealedEntries: 0, mismatches: [] });
  useEffect(() => { getAuditIntegrity().then(setIntegrity); }, []);
  const status = integrity.mismatches?.length ? 'TAMPER DETECTADO' : integrity.sealed ? 'SELLADA' : 'SIN SELLO PERSISTENTE';
  return <div className="bg-panel border border-line rounded-lg p-4"><div className="flex items-start justify-between gap-3"><div><div className="font-mono text-[10px] uppercase tracking-widest text-signal">Audit integrity</div><h2 className="font-display text-lg font-semibold text-ink mt-1">Cadena de trazabilidad</h2></div><span className={`font-mono text-[10px] ${integrity.mismatches?.length ? 'text-alert' : 'text-signal'}`}>{status}</span></div><div className="flex flex-wrap gap-4 mt-3 text-xs text-ink-muted"><span>{integrity.entries} entradas</span><span>{integrity.sealedEntries} selladas</span><span>{integrity.mismatches?.length || 0} inconsistencias</span></div><p className="text-[11px] text-ink-dim mt-3">La cadena se sella al persistir el estado local y permite detectar alteraciones en el archivo de auditoría.</p></div>;
}

function SlaPanel() {
  const [overview, setOverview] = useState({ ready: false, counts: {}, cases: [] });
  const [message, setMessage] = useState('');
  const refresh = async () => setOverview(await getSlaOverview());
  useEffect(() => { refresh(); }, []);
  const sweep = async () => { try { const result = await runSlaSweep(); setMessage(`${result.notificationsCreated} escalaciones generadas.`); await refresh(); } catch (error) { setMessage(error.message); } };
  return <div className="bg-panel border border-line rounded-lg p-4"><div className="flex items-start justify-between gap-3"><div><div className="font-mono text-[10px] uppercase tracking-widest text-signal">SLA control</div><h2 className="font-display text-lg font-semibold text-ink mt-1">Ventanas operativas</h2></div><button onClick={sweep} className="border border-signal/40 text-signal rounded px-3 py-2 text-xs">Ejecutar sweep</button></div><div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-3">{[['on_track', 'En tiempo'], ['at_risk', 'En riesgo'], ['overdue', 'Vencidos'], ['closed', 'Cerrados'], ['unknown', 'Sin dato']].map(([key, label]) => <Metric key={key} label={label} value={overview.counts[key] || 0} />)}</div>{message && <div role="status" className="text-xs text-signal mt-3">{message}</div>}<p className="text-[11px] text-ink-dim mt-3">El sweep local identifica casos en riesgo o vencidos y crea una notificación deduplicada.</p></div>;
}

function DeadLetterPanel() {
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState('');
  const refresh = async () => setItems(await getDeadLetters('queued'));
  useEffect(() => { refresh(); }, []);
  const retry = async (id) => { try { const result = await retryDeadLetter(id); setMessage(`${id}: ${result.status}`); await refresh(); } catch (error) { setMessage(error.message); } };
  return <div className="bg-panel border border-line rounded-lg p-4"><div className="flex items-start justify-between gap-3"><div><div className="font-mono text-[10px] uppercase tracking-widest text-alert">Dead-letter queue</div><h2 className="font-display text-lg font-semibold text-ink mt-1">Señales fallidas</h2></div><span className="font-mono text-[10px] text-alert">{items.length} EN COLA</span></div><p className="text-xs text-ink-muted mt-2">Las señales rechazadas por validación quedan conservadas para diagnóstico y reintento controlado.</p><div className="mt-3 space-y-2">{items.slice(0, 5).map((item) => <div key={item.id} className="border border-line rounded p-3 flex items-center justify-between gap-3"><div className="min-w-0"><div className="font-mono text-[10px] text-alert">{item.id} · {item.attempts} intentos</div><div className="text-xs text-ink truncate mt-1">{item.error}</div></div><button onClick={() => retry(item.id)} className="shrink-0 border border-signal/40 text-signal rounded px-2 py-1 text-[10px]">Reintentar</button></div>)}{!items.length && <div className="text-xs text-ink-dim">No hay señales fallidas.</div>}</div>{message && <div role="status" className="mt-3 text-xs text-signal">{message}</div>}</div>;
}

function SectionIntro({ eyebrow, title, description, action, onAction }) { return <div className="flex flex-col md:flex-row md:items-end justify-between gap-4"><div><div className="font-mono text-[10px] uppercase tracking-widest text-signal mb-2">{eyebrow}</div><h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-ink">{title}</h1><p className="text-sm text-ink-muted mt-2 max-w-2xl leading-relaxed">{description}</p></div>{action && <button onClick={onAction} className="shrink-0 flex items-center gap-2 bg-signal text-void rounded px-4 py-2.5 text-xs font-semibold hover:bg-signal/80">{action}<ArrowRight size={14} /></button>}</div>; }
function ExposureCard({ label, value, score, tone }) { return <div className="bg-panel border border-line rounded-lg p-4"><div className="flex justify-between gap-2"><span className="text-sm text-ink">{label}</span><span className={`font-mono text-[10px] ${tone === 'alert' ? 'text-alert' : 'text-signal'}`}>{score}</span></div><div className="font-display text-2xl font-bold text-alert mt-2">{value}</div><div className="text-[11px] text-ink-muted mt-1">pérdida potencial · próximas 72h</div></div>; }
function SourceRow({ label, status, latency }) { return <div className="flex items-center justify-between gap-2 border-t border-line/60 py-2 text-xs"><span className="text-ink-muted">{label}</span><span className="font-mono text-[10px] text-signal">{status}{latency ? ` · ${latency}s` : ''}</span></div>; }
function CaseRow({ item, selected, onClick }) { return <button onClick={onClick} className={`w-full grid grid-cols-[65px_1fr_90px_60px_70px] gap-2 items-center border-b border-line/60 px-4 py-3 text-xs text-left ${selected ? 'bg-signal/10' : 'hover:bg-raised'}`}><span className="font-mono text-ink-dim">{item.id}</span><span className="text-ink">{item.title}</span><span className="text-ink-muted flex items-center gap-1"><UserRound size={12} />{item.owner}</span><span className="font-mono text-alert flex items-center gap-1"><Clock3 size={11} />{formatSla(item.slaMinutes)}</span><span className="text-right font-semibold text-alert">{formatUsd(item.impactUsd)}<small className="block font-mono text-[9px] text-ink-dim">{item.priority}</small></span></button>; }
function Metric({ label, value }) { return <div className="bg-void border border-line rounded p-3"><div className="font-mono text-[9px] uppercase tracking-widest text-ink-dim">{label}</div><div className="font-display text-lg font-semibold text-ink mt-1">{value}</div></div>; }
function Timeline({ time, text }) { return <div><div className="font-mono text-[10px] text-signal">{time}</div><div className="flex items-center gap-1.5 mt-0.5"><CheckCircle2 size={12} className="text-signal" />{text}</div></div>; }
function BriefPoint({ index, title, text }) { return <div><div className="font-mono text-[10px] text-signal">{index} · {title}</div><p className="text-sm text-ink-muted leading-relaxed mt-2">{text}</p></div>; }
function formatUsd(value) { if (!Number.isFinite(value)) return '—'; if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`; if (value >= 1000) return `$${Math.round(value / 1000)}K`; return `$${Math.round(value)}`; }
function formatSla(minutes) { if (!Number.isFinite(minutes)) return '—'; return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`; }
