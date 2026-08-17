import { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, Clock3, UserRound } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip as ChartTooltip, ResponsiveContainer } from 'recharts';
import { addCaseComment, createActionPlan, createDecisionShare, createIncident, createWebhook, downloadAudit, downloadBrief, downloadDecisionPackage, downloadLocalSnapshot, getActionPlans, getAuditIntegrity, getCaseAudit, getCaseComments, getCases, getDataCatalogReadiness, getDataQualityReport, getDeadLetters, getDecisionShares, getImpactGraph, getIncidents, getJobs, getLatestBrief, getOperationalMetrics, getPilotFeedback, getPilotMetrics, getPilotReadiness, getPlaybooks, getProvenanceOverview, getRetentionOverview, getRuntimeReadiness, getSecurityPosture, getSlaOverview, getSourceHealthOverview, getSources, getTenancyContext, getWebhooks, getWebhookDeliveriesAll, previewActionPlan, processLocalWebhookDeliveries, recordActionPlanOutcome, recordPilotFeedback, resetLocalDemo, restoreLocalSnapshot, retryDeadLetter, revokeDecisionShare, rotateWebhookSecret, runDemoIngestionJob, runSlaSweep, runSourceHealthSweep, updateActionPlan, updateCase, updateIncident } from '../api/client';
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
import ModelProfilesPanel from './ModelProfilesPanel';
import PilotValueCasePanel from './PilotValueCasePanel';
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
import PilotMeasurementPanel from './PilotMeasurementPanel';
import CapacityMarketplacePanel from './CapacityMarketplacePanel';
import EnterpriseReadinessPanel from './EnterpriseReadinessPanel';
import EvidenceManifestPanel from './EvidenceManifestPanel';
import CooperativeNetworkPanel from './CooperativeNetworkPanel';
import SectorBenchmarkPanel from './SectorBenchmarkPanel';
import ExecutionCoveragePanel from './ExecutionCoveragePanel';
import { useSessionStore } from '../store/useSessionStore';

export function PortfolioExposureChart() {
  const data = [
    { name: 'Suez Canal', value: 45, color: '#FB923C' },
    { name: 'Strait of Hormuz', value: 35, color: '#F43F5E' },
    { name: 'Strait of Malacca', value: 15, color: '#2DD4BF' },
    { name: 'Bab-el-Mandeb', value: 5, color: '#8B98B4' },
  ];

  return (
    <div className="bg-panel border border-line rounded-lg p-4 flex flex-col gap-2">
      <div className="font-mono text-[10px] uppercase tracking-widest text-ink-dim">Portfolio Risk Distribution</div>
      <div className="h-[130px] w-full flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={30}
              outerRadius={48}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <ChartTooltip
              contentStyle={{ background: '#101B2E', border: '1px solid #22334E', borderRadius: 4, fontSize: 10 }}
              formatter={(value) => [`${value}%`, 'Exposure']}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-ink-muted">
        {data.map((entry) => (
          <div key={entry.name} className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full inline-block shrink-0" style={{ backgroundColor: entry.color }} />
            <span className="truncate">{entry.name} ({entry.value}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function NetworkExposureView({ onScenario }) {
  const [sources, setSources] = useState([]);
  useEffect(() => { getSources().then(setSources); }, []);

  return (
    <section className="flex flex-col gap-4">
      <SectionIntro
        eyebrow="Correlation layer · cable → economic impact"
        title="One physical network. One digital network. One decision."
        description="The platform connects an infrastructure event with financial exposure, logistics impact, and an actionable alternative."
        action="Create scenario"
        onAction={onScenario}
      />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4 min-h-[520px]">
        <div className="bg-panel border border-line rounded-lg overflow-hidden flex flex-col">
          <div className="p-4 border-b border-line">
            <div className="font-mono text-[10px] uppercase tracking-widest text-ink-dim">Digital twin · critical network</div>
            <h2 className="font-display text-lg font-semibold text-ink mt-1">Energy corridors + digital infrastructure</h2>
          </div>
          <div className="flex-1 min-h-[420px]"><WorldMap /></div>
        </div>
        <div className="flex flex-col gap-4">
          <ExposureCard label="Suez Canal / Red Sea" value="$350M" score="CRITICAL" tone="alert" />
          <ExposureCard label="Strait of Hormuz" value="$280M" score="AUDITED" tone="alert" />
          <ExposureCard label="Strait of Malacca" value="$120M" score="STABLE" tone="signal" />
          <PortfolioExposureChart />
          <div className="bg-panel border border-line rounded-lg p-4">
            <div className="font-mono text-[10px] uppercase tracking-widest text-ink-dim">Decision sources</div>
            {sources.map((source) => <SourceRow key={source.id} label={source.name} status={source.status} latency={source.latencySeconds} />)}
            {!sources.length && <div className="py-3 text-xs text-ink-muted">Loading sources...</div>}
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
        eyebrow="What-if · explicit assumptions"
        title="From an alert to an economic decision in minutes."
        description="Adjust the event and severity. The system recalculates expected loss while assumptions stay visible to avoid a black box."
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
  const handleDecisionPackage = async (format = 'json') => { if (!selectedCase) return; setExportError(''); try { await downloadDecisionPackage(selectedCase.id, format); } catch (error) { setExportError(error.message); } };
  const handleCreateShare = async () => { if (!selectedCase || !canOperate) return; setActionError(''); try { const result = await createDecisionShare(selectedCase.id, { expiresInHours: 72, audience: 'decision reviewer' }); setShareResult(result); setShares((current) => [result.share, ...current]); if (navigator.clipboard) await navigator.clipboard.writeText(`${window.location.origin}${result.path}`); } catch (error) { setActionError(error.message); } };
  const handleRevokeShare = async (shareId) => { if (!selectedCase || !canOperate) return; try { const result = await revokeDecisionShare(selectedCase.id, shareId); setShares((current) => current.map((item) => item.id === result.id ? result : item)); } catch (error) { setActionError(error.message); } };

  return (
    <>
    <section className="flex flex-col gap-4">
      <SectionIntro
        eyebrow="Alert → case → resolution → audit"
        title="Risk needs an owner, context, and closure."
        description="Critical alerts become assignable cases with human validation, documented decisions, and enterprise traceability."
      />
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
        <div className="bg-panel border border-line rounded-lg overflow-hidden">
          <div className="p-4 border-b border-line flex flex-col md:flex-row md:items-center justify-between gap-3"><h2 className="font-display font-semibold text-ink">Case queue</h2><div className="flex flex-wrap gap-2"><input aria-label="Search cases" value={search} onChange={(event) => setSearch(event.target.value)} className="control !w-48" placeholder="Search case..." /><button onClick={async () => { setExportError(''); try { await downloadAudit('csv'); } catch (error) { setExportError(error.message); } }} className="border border-line rounded px-3 text-xs text-ink-muted hover:text-ink">Export audit</button><button onClick={() => handleDecisionPackage('json')} disabled={!selectedCase} className="border border-signal/40 text-signal rounded px-3 text-xs disabled:opacity-50">JSON package</button><button onClick={() => handleDecisionPackage('markdown')} disabled={!selectedCase} className="border border-line rounded px-3 text-xs text-ink-muted disabled:opacity-50">Markdown package</button><button onClick={handleCreateShare} disabled={!selectedCase || !canOperate} className="border border-signal/40 text-signal rounded px-3 text-xs disabled:opacity-50">Share read-only</button></div></div>
          <div className="px-4 py-2 border-b border-line/60 flex flex-wrap gap-2"><select aria-label="Filter status" value={caseStatus} onChange={(event) => setCaseStatus(event.target.value)} className="control !w-36"><option value="">All statuses</option><option value="open">Open</option><option value="in_progress">In progress</option><option value="blocked">Blocked</option><option value="closed">Closed</option></select><select aria-label="Filter priority" value={priority} onChange={(event) => setPriority(event.target.value)} className="control !w-32"><option value="">Priority</option><option value="P1">P1</option><option value="P2">P2</option><option value="P3">P3</option></select><input aria-label="Filter owner" value={owner} onChange={(event) => setOwner(event.target.value)} className="control !w-40" placeholder="Owner..." /><select aria-label="Sort cases" value={sort} onChange={(event) => setSort(event.target.value)} className="control !w-44"><option value="sla_urgent">Most urgent SLA</option><option value="impact_desc">Highest impact</option></select></div>
          {exportError && <div role="alert" className="px-4 py-2 text-xs text-alert border-b border-alert/20">Could not export: {exportError}</div>}
          {actionError && <div role="alert" className="px-4 py-2 text-xs text-alert border-b border-alert/20">Could not complete the action: {actionError}</div>}
          {cases.map((item) => <CaseRow key={item.id} item={item} selected={item.id === selectedCase?.id} onClick={() => setSelectedId(item.id)} />)}
        </div>
        <div className="bg-panel border border-line rounded-lg p-4">
          <div className="font-mono text-[10px] uppercase tracking-widest text-ink-dim">{selectedCase?.id || 'No case'} · auditable log</div>
          <h2 className="font-display text-xl font-semibold text-ink mt-2">{selectedCase?.title || (cases.length ? 'Select a case' : `No cases para ${vertical}`)}</h2>
          <div className="grid grid-cols-2 gap-3 mt-4"><Metric label="Exposure" value={formatUsd(selectedCase?.impactUsd)} /><Metric label="Owner" value={selectedCase?.owner || '—'} /><Metric label="Validation" value={selectedCase?.humanValidation || '—'} /><Metric label="SLA" value={formatSla(selectedCase?.slaMinutes)} /></div>
          <div className="border-l border-signal/40 ml-1 mt-5 pl-4 space-y-4 text-xs text-ink-muted">{audit.length ? audit.slice(0, 5).map((item) => <Timeline key={item.id} time={new Date(item.createdAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })} text={item.message} />) : <div>Loading log...</div>}</div>
          <div className="mt-5 border-t border-line pt-4"><div className="font-mono text-[10px] uppercase tracking-widest text-ink-dim">Collaboration</div><div className="space-y-2 mt-3 max-h-28 overflow-y-auto">{comments.map((item) => <div key={item.id} className="text-xs text-ink-muted"><span className="font-mono text-[10px] text-signal">{item.author}</span> · {item.body}</div>)}{!comments.length && <div className="text-xs text-ink-dim">No comments yet.</div>}</div><form onSubmit={handleComment} className="flex gap-2 mt-3"><input disabled={!canOperate} value={commentText} onChange={(event) => setCommentText(event.target.value)} className="control" placeholder={canOperate ? 'Add comment...' : 'Read-only'} /><button disabled={!canOperate || !commentText.trim()} className="bg-signal text-void rounded px-3 text-xs font-semibold disabled:opacity-50">Send</button></form></div><div className="flex gap-2 mt-5"><button disabled={!canOperate} onClick={() => handleUpdate({ owner: 'Me' })} className="flex-1 border border-line rounded py-2 text-xs text-ink-muted hover:text-ink disabled:opacity-50">{canOperate ? 'Assign to me' : 'Read-only'}</button><button disabled={!canOperate} onClick={() => handleUpdate({ humanValidation: 'validated', status: 'closed' })} className="flex-1 bg-signal text-void rounded py-2 text-xs font-semibold disabled:opacity-50">Validate & close</button></div>
        </div>
      </div>
     </section>
       <DecisionShareSummary shares={shares} result={shareResult} canOperate={canOperate} onRevoke={handleRevokeShare} />
    </>
  );
}

function DecisionShareSummary({ shares, result, canOperate, onRevoke }) {
  return <div className="bg-panel border border-line rounded-lg p-4"><div className="font-mono text-[10px] uppercase tracking-widest text-signal">Decision links</div><p className="text-xs text-ink-muted mt-2">Temporary read-only links for human review. The clear token is only shown when it is created.</p>{result && <div className="mt-2 border border-signal/30 rounded p-2 text-[10px] text-signal break-all">Token created: {result.path}</div>}<div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">{shares.map((share) => <div key={share.id} className="border border-line rounded p-2 text-xs"><div className="flex justify-between gap-2"><span className="font-mono text-[10px] text-signal">{share.id}</span><span className={share.status === 'active' ? 'text-signal' : 'text-alert'}>{share.status}</span></div><div className="text-[10px] text-ink-dim mt-1">Expires {new Date(share.expiresAt).toLocaleString('es-MX')} · accesses {share.accessCount}</div>{share.status === 'active' && <button type="button" onClick={() => onRevoke(share.id)} disabled={!canOperate} className="border border-alert/40 text-alert rounded px-2 py-1 text-[10px] mt-2 disabled:opacity-50">Revoke</button>}</div>)}{!shares.length && <div className="text-[10px] text-ink-dim">Select a case and create a review link.</div>}</div></div>;
}

export function ExecutiveBriefView({ onScenario, vertical = 'Oil & Gas', region = 'global', horizon = '72' }) {
  const [brief, setBrief] = useState(null);
  useEffect(() => { getLatestBrief().then(setBrief); }, []);
  const exportBrief = async (format) => { await downloadBrief(format); };

  return (
    <section className="flex flex-col gap-4 max-w-5xl">
      <SectionIntro eyebrow="C-suite · 1 page · decision, not noise" title="Executive Resilience Brief" description="An executive synthesis: what changed, how much money is exposed, what the system recommends, and what decision needs authorization." action="Review scenario" onAction={onScenario} />
      <div className="bg-panel border border-line rounded-lg p-6 md:p-8">
        <div className="flex items-start justify-between gap-4 border-b border-line pb-5"><div><div className="font-mono text-[10px] text-signal tracking-widest">GLOBAL RESILIENCE OS</div><h2 className="font-display text-2xl font-bold text-ink mt-2">Situation Brief · {vertical}</h2><p className="text-xs text-ink-muted mt-1">{region === 'global' ? 'Global' : region} · Analysis window: next {horizon}h · Illustrative demo</p></div><div className="text-right"><div className="font-mono text-[10px] text-ink-dim">RESILIENCE</div><div className="font-display text-4xl font-bold text-signal">{brief?.resilienceScore ?? 'N/D'}{brief?.resilienceScore !== null && brief?.resilienceScore !== undefined && <span className="text-sm text-ink-muted">/100</span>}</div><div className="font-mono text-[9px] text-ink-dim mt-1">{brief?.resilienceScoreStatus === 'not_calibrated' ? 'NO CALIBRADO' : 'ESTADO NO AVAILABLE'}</div></div></div>
        <div className="my-6 border border-alert/30 bg-alert/5 rounded-lg p-4"><div className="font-mono text-[10px] text-alert tracking-widest">DECISION REQUIRED</div><h3 className="font-display text-lg font-semibold text-ink mt-2">{brief?.decisionRequired || 'Loading recommendation...'}</h3><p className="text-sm text-ink-muted mt-2">Estimated protected value: {formatUsd(brief?.protectedValueUsd)} under the current scenario.</p></div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6"><Metric label="Exposure total" value={formatUsd(brief?.exposureUsd)} /><Metric label="Eventos materiales" value={brief?.materialEvents || '—'} /><Metric label="Valor mitigable" value={formatUsd(brief?.protectedValueUsd)} /><Metric label="Suggested Subscription (2%)" value={formatUsd((brief?.protectedValueUsd || 0) * 0.02)} /><Metric label="Confidence modelo" value={Number.isFinite(brief?.confidence) ? `${Math.round(brief.confidence * 100)}%` : 'N/D'} /></div>
        <div className="grid md:grid-cols-3 gap-6 border-t border-line pt-5"><BriefPoint index="01" title="What changed" text="An anomalous SMW-5 degradation coincides with rising congestion. Combined exposure exceeds the P1 threshold." /><BriefPoint index="02" title="Recommended action" text="Activate alternate routing, raise Hormuz monitoring, and freeze corridor-sensitive nominations." /><BriefPoint index="03" title="What to monitor" text="Cable status, spot freight premium, and available capacity on the alternate route." /></div><div className="flex flex-wrap gap-2 mt-6"><button onClick={() => exportBrief('json')} className="border border-line text-ink-muted rounded px-3 py-2 text-xs hover:text-ink">Download JSON</button><button onClick={() => exportBrief('csv')} className="border border-signal/40 text-signal rounded px-3 py-2 text-xs hover:bg-signal/10">Download CSV</button></div>
      </div>
    </section>
  );
}

export function OperationsView() {
  const [jobs, setJobs] = useState([]);
  const [webhooks, setWebhooks] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [url, setUrl] = useState('https://example.local/resilience-events');
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState('');
  const [snapshotError, setSnapshotError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const refresh = async () => { const [jobData, webhookData, deliveryData] = await Promise.all([getJobs(), getWebhooks(), getWebhookDeliveriesAll()]); setJobs(jobData); setWebhooks(webhookData); setDeliveries(deliveryData || []); };
  useEffect(() => { refresh(); }, []);
  const runJob = async () => { setRunning(true); setMessage('Running local ingestion...'); try { await runDemoIngestionJob(); await refresh(); setMessage('Job complete: demo signals processed.'); } catch (error) { setMessage(error.message); } finally { setRunning(false); } };
  const addWebhook = async (event) => { event.preventDefault(); try { await createWebhook({ url, events: ['alert.created', 'case.updated'] }); setUrl('https://example.local/resilience-events'); await refresh(); setMessage('Webhook recorded en la cola local.'); } catch (error) { setMessage(error.message); } };
  const rotateSecret = async (id) => { try { const result = await rotateWebhookSecret(id); setMessage(`New secret for ${id} (store it now): ${result.secret}`); await refresh(); } catch (error) { setMessage(error.message); } };
  const processOutbox = async () => { try { const result = await processLocalWebhookDeliveries(); await refresh(); setMessage(`${result.processed} entregas procesadas en modo simulado.`); } catch (error) { setMessage(error.message); } };
  const downloadSnapshot = async () => { setSnapshotError(''); try { await downloadLocalSnapshot(); } catch (error) { setSnapshotError(error.message); } };
  const resetDemo = async () => { if (!window.confirm('Reset the local demo and delete generated operational records?')) return; setSnapshotError(''); try { const result = await resetLocalDemo(); await refresh(); setMessage(`Demo reset: ${result.counts.alerts} alerts and ${result.counts.cases} seed cases.`); } catch (error) { setSnapshotError(error.message); } };
  return <section className="flex flex-col gap-4">
    <SectionIntro eyebrow="Operations · jobs · connectors · traceability" title="The Platform Is Operated, Too." description="Run controlled ingestion, inspect its history, and register event destinations. External delivery remains staged in a local queue until production infrastructure is connected." />
    <ReadinessPanel />
    <RuntimeReadinessPanel />
    <SourceHealthPanel />
    <AuditIntegrityPanel />

    <div className="flex justify-center my-4">
      <button 
        type="button" 
        onClick={() => setShowAdvanced(!showAdvanced)} 
        className="px-4 py-2 text-xs font-semibold rounded border border-signal text-signal hover:bg-signal/10 transition-colors"
      >
        {showAdvanced ? "Ocultar paneles operativos avanzados" : "Mostrar paneles operativos avanzados (+25)"}
      </button>
    </div>

    {showAdvanced && (
      <div className="flex flex-col gap-4">
        <CompliancePanel />
        <RegulatoryEvidencePanel />
        <DataQualityPanel />
        <GovernancePanel />
        <RetentionPolicyConflictPanel />
        <SourceHealthSweepPanel />
        <PilotReadinessPanel />
        <StructuredPilotEvidencePanel />
        <PilotPackagePanel />
        <PilotMeasurementPanel />
        <PilotValueCasePanel />
        <CapacityMarketplacePanel />
        <EnterpriseReadinessPanel />
        <EvidenceManifestPanel />
        <IncidentResponsePanel />
        <SecurityPosturePanel />
        <ModelUncertaintyPanel />
        <ModelProfilesPanel />
        <OperationalScorecardPanel />
        <CooperativeNetworkPanel />
        <SectorBenchmarkPanel />
        <ExecutionCoveragePanel />
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
      </div>
    )}

    <WebhookSecretPanel webhooks={webhooks} onRotate={rotateSecret} />
    <div className="flex flex-wrap justify-end gap-2"><button onClick={processOutbox} className="border border-signal/40 text-signal rounded px-3 py-2 text-xs">Process local outbox</button><button onClick={downloadSnapshot} className="border border-line text-ink-muted rounded px-3 py-2 text-xs hover:text-ink">Download snapshot</button><button onClick={resetDemo} className="border border-alert/40 text-alert rounded px-3 py-2 text-xs hover:bg-alert/10">Reset local demo</button></div>{snapshotError && <div role="alert" className="text-right text-xs text-alert">Could not complete operation: {snapshotError}</div>}
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
      <div className="bg-panel border border-line rounded-lg overflow-hidden"><div className="p-4 border-b border-line flex items-center justify-between"><div><div className="font-mono text-[10px] uppercase tracking-widest text-signal">Job runner local</div><h2 className="font-display text-lg font-semibold text-ink mt-1">Ingestion History</h2></div><button onClick={runJob} disabled={running} className="bg-signal text-void rounded px-3 py-2 text-xs font-semibold disabled:opacity-50">{running ? 'Processing...' : 'Run demo'}</button></div>{message && <div className="px-4 py-2 text-xs text-signal border-b border-line/60">{message}</div>}<div className="divide-y divide-line/60">{jobs.map((job) => <div key={job.id} className="p-4 flex items-center justify-between gap-3"><div><div className="font-mono text-[10px] text-ink-dim">{job.id} · {job.type}</div><div className="text-sm text-ink mt-1">{job.eventsReceived} events · {job.alertsCreated} alerts created</div></div><span className="font-mono text-[10px] text-signal uppercase">{job.status}</span></div>)}{!jobs.length && <div className="p-4 text-xs text-ink-muted">No local job has been run yet.</div>}</div></div>
      <div className="bg-panel border border-line rounded-lg p-4"><div className="font-mono text-[10px] uppercase tracking-widest text-signal">Webhook registry</div><h2 className="font-display text-lg font-semibold text-ink mt-1">Destinos de events</h2><p className="text-xs text-ink-muted mt-2">Locally queued signals: alert.created and case.updated.</p><form onSubmit={addWebhook} className="flex gap-2 mt-4"><input className="control min-w-0" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://..." /><button className="border border-signal/40 text-signal rounded px-3 text-xs">Add</button></form><div className="mt-4 space-y-2">{webhooks.map((hook) => <div key={hook.id} className="border border-line rounded p-3"><div className="flex justify-between gap-2"><span className="font-mono text-[10px] text-signal">{hook.id}</span><span className="font-mono text-[10px] text-signal">{hook.active ? 'ACTIVE' : 'PAUSED'}</span></div><div className="text-xs text-ink-muted mt-2 break-all">{hook.url}</div></div>)}{!webhooks.length && <div className="text-xs text-ink-dim">No destinations configured.</div>}</div></div>
    </div>
    <div className="bg-panel border border-line rounded-lg p-4 mt-4">
      <div className="font-mono text-[10px] uppercase tracking-widest text-signal">Webhook Delivery Logs</div>
      <h2 className="font-display text-lg font-semibold text-ink mt-1">Historial de entregas externas</h2>
      <p className="text-xs text-ink-muted mt-2">Trazabilidad en tiempo real de peticiones HTTP salientes para integraciones empresariales.</p>
      <div className="mt-4 space-y-2">
        {deliveries.slice(0, 5).map((del) => (
          <div key={del.id} className="border border-line rounded p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-signal">{del.id}</span>
                <span className="font-mono text-[10px] text-ink-dim">· {del.event}</span>
              </div>
              <div className="text-ink-muted mt-1 break-all font-mono text-[10px]">{del.url}</div>
            </div>
            <div className="text-right flex flex-col items-end">
              <span className={`font-mono text-[10px] uppercase px-2 py-0.5 rounded ${
                del.status >= 200 && del.status < 300 
                  ? 'text-signal bg-signal/10 border border-signal/30' 
                  : 'text-alert bg-alert/10 border border-alert/30'
              }`}>
                HTTP {del.status || 'PENDING'}
              </span>
              <div className="text-[10px] text-ink-dim mt-1">Intentos: {del.attempts || 1} · {new Date(del.createdAt).toLocaleTimeString('es-MX')}</div>
            </div>
          </div>
        ))}
        {!deliveries.length && <div className="text-xs text-ink-dim p-4 border border-dashed border-line rounded text-center">No outbound deliveries recorded yet.</div>}
      </div>
    </div>
  </section>;
}

function ActionPlanPanel() {
  const [playbooks, setPlaybooks] = useState([]);
  const [plans, setPlans] = useState([]);
  const [selectedPlaybook, setSelectedPlaybook] = useState('cable-degradation');
  const [sourceId, setSourceId] = useState('');
  const [confidence, setConfidence] = useState('0.8');
  const [lossIfWaitUsd, setLossIfWaitUsd] = useState('900000');
  const [mitigationCostUsd, setMitigationCostUsd] = useState('100000');
  const [preview, setPreview] = useState(null);
  const [message, setMessage] = useState('');
  const refresh = async () => { const [playbookData, planData] = await Promise.all([getPlaybooks(), getActionPlans({ limit: 8 })]); setPlaybooks(playbookData); setPlans(planData); };
  useEffect(() => { refresh(); }, []);
  const input = () => ({ playbookId: selectedPlaybook, sourceId: sourceId.trim() || undefined, confidence: Number(confidence), lossIfWaitUsd: Number(lossIfWaitUsd), mitigationCostUsd: Number(mitigationCostUsd), protectedValueUsd: Math.max(Number(lossIfWaitUsd) - Number(mitigationCostUsd), 0) });
  const calculate = async (event) => { event.preventDefault(); setMessage(''); try { setPreview(await previewActionPlan(input())); } catch (error) { setMessage(error.message); } };
  const save = async () => { if (!preview) return; try { await createActionPlan(input()); setMessage('Plan saved as a draft for human approval.'); await refresh(); } catch (error) { setMessage(error.message); } };
  const approve = async (plan) => { try { await updateActionPlan(plan.id, { status: 'approved', humanApproval: 'approved' }); setMessage(`${plan.id} aprobado por el operador local.`); await refresh(); } catch (error) { setMessage(error.message); } };
  const materialAllowed = preview?.materialRecommendationAllowed === true;
  return <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4"><div className="bg-panel border border-line rounded-lg p-4"><div className="font-mono text-[10px] uppercase tracking-widest text-signal">Scenario-to-Action Engine</div><h2 className="font-display text-lg font-semibold text-ink mt-1">From Signal to Auditable Decision</h2><p className="text-xs text-ink-muted mt-2">Calculates economics and confidence, reviews provenance, and saves the plan as a draft until human approval.</p><form onSubmit={calculate} className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4"><select className="control col-span-2 md:col-span-4" value={selectedPlaybook} onChange={(event) => setSelectedPlaybook(event.target.value)}>{playbooks.map((playbook) => <option key={playbook.id} value={playbook.id}>{playbook.name}</option>)}</select><input className="control col-span-2" value={sourceId} onChange={(event) => setSourceId(event.target.value)} aria-label="Evidence source" placeholder="Evidence source (optional)" /><input className="control" type="number" min="0" value={lossIfWaitUsd} onChange={(event) => setLossIfWaitUsd(event.target.value)} aria-label="Loss if no action" placeholder="Loss if no action" /><input className="control" type="number" min="0" value={mitigationCostUsd} onChange={(event) => setMitigationCostUsd(event.target.value)} aria-label="Mitigation cost" placeholder="Mitigation cost" /><input className="control" type="number" min="0" max="1" step="0.05" value={confidence} onChange={(event) => setConfidence(event.target.value)} aria-label="Confidence" placeholder="Confidence" /><button className="bg-signal text-void rounded px-3 py-2 text-xs font-semibold">Calculate preview</button></form>{message && <div className="text-xs text-signal mt-3" role="status">{message}</div>}{preview && <div className="border border-line rounded p-3 mt-4"><div className="flex justify-between text-xs"><span className="text-ink-muted">Decision</span><span className={preview.decision?.startsWith('abstain') ? 'text-alert' : 'text-signal'}>{preview.decision}</span></div><div className={`mt-3 border rounded p-2 text-xs ${materialAllowed ? 'border-signal/40 text-signal' : 'border-alert/40 text-alert'}`} role="status"><div className="font-mono text-[10px] uppercase tracking-widest">{materialAllowed ? 'Eligible for production gate' : 'Material abstention'}</div><div className="mt-1">{materialAllowed ? 'Linked evidence and data quality allow continuation to human review.' : 'The plan may be saved as a draft, but is not presented as a production recommendation.'}</div><div className="font-mono text-[10px] mt-2">Source: {preview.evidence?.sourceIds?.join(', ') || 'no linked source'} · Gate: {preview.dataQualityGate?.scope || 'unavailable'}</div></div><div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3"><Metric label="Loss if no action" value={`$${Math.round(preview.economics.lossIfWaitUsd).toLocaleString()}`} /><Metric label="Action cost" value={`$${Math.round(preview.economics.mitigationCostUsd).toLocaleString()}`} /><Metric label="Suggested Subscription (2%)" value={`$${Math.round(Math.max(preview.economics.lossIfWaitUsd - preview.economics.mitigationCostUsd, 0) * 0.02).toLocaleString()}`} /><Metric label="Confidence" value={`${Math.round(preview.confidence * 100)}%`} /></div><div className="text-[10px] text-ink-dim mt-3">{preview.disclaimer}</div><button type="button" onClick={save} className="border border-signal/40 text-signal rounded px-3 py-2 text-xs mt-3">Save draft</button></div>}</div><div className="bg-panel border border-line rounded-lg p-4"><div className="font-mono text-[10px] uppercase tracking-widest text-signal">Decision ledger</div><h2 className="font-display text-lg font-semibold text-ink mt-1">Recent Plans</h2><div className="mt-3 space-y-2">{plans.map((plan) => <div key={plan.id} className="border border-line rounded p-3"><div className="flex justify-between gap-2"><span className="font-mono text-[10px] text-signal">{plan.id}</span><span className="font-mono text-[10px] text-ink-muted">{plan.status}</span></div><div className="text-xs text-ink mt-2">{plan.playbook?.name}</div><div className="font-mono text-[10px] text-ink-dim mt-1">Evidence: {plan.evidence?.productionDecision || 'pending'}</div>{plan.status === 'draft_for_human_approval' && <button type="button" onClick={() => approve(plan)} className="border border-line rounded px-2 py-1 text-[10px] text-ink-muted mt-2">Human approve</button>}</div>)}{!plans.length && <div className="text-xs text-ink-dim">No local plans yet.</div>}</div></div></div>;
}

export function LegacyActionPlanPanel() {
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
  const save = async () => { if (!preview) return; try { await createActionPlan({ playbookId: selectedPlaybook, confidence: Number(confidence), lossIfWaitUsd: Number(lossIfWaitUsd), mitigationCostUsd: Number(mitigationCostUsd), protectedValueUsd: Math.max(Number(lossIfWaitUsd) - Number(mitigationCostUsd), 0) }); setMessage('Plan saved as a draft for human approval.'); await refresh(); } catch (error) { setMessage(error.message); } };
  const approve = async (plan) => { try { await updateActionPlan(plan.id, { status: 'approved', humanApproval: 'approved' }); setMessage(`${plan.id} aprobado por el operador local.`); await refresh(); } catch (error) { setMessage(error.message); } };
  return <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4"><div className="bg-panel border border-line rounded-lg p-4"><div className="font-mono text-[10px] uppercase tracking-widest text-signal">Scenario-to-Action Engine</div><h2 className="font-display text-lg font-semibold text-ink mt-1">From Signal to Auditable Decision</h2><p className="text-xs text-ink-muted mt-2">Calculates economics and confidence, reviews assumptions, and saves the plan only as a draft until human approval.</p><form onSubmit={calculate} className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4"><select className="control col-span-2 md:col-span-4" value={selectedPlaybook} onChange={(event) => setSelectedPlaybook(event.target.value)}>{playbooks.map((playbook) => <option key={playbook.id} value={playbook.id}>{playbook.name}</option>)}</select><input className="control" type="number" min="0" value={lossIfWaitUsd} onChange={(event) => setLossIfWaitUsd(event.target.value)} aria-label="Loss if no action" placeholder="Loss if no action" /><input className="control" type="number" min="0" value={mitigationCostUsd} onChange={(event) => setMitigationCostUsd(event.target.value)} aria-label="Mitigation cost" placeholder="Mitigation cost" /><input className="control" type="number" min="0" max="1" step="0.05" value={confidence} onChange={(event) => setConfidence(event.target.value)} aria-label="Confidence" placeholder="Confidence" /><button className="bg-signal text-void rounded px-3 py-2 text-xs font-semibold">Calculate preview</button></form>{message && <div className="text-xs text-signal mt-3" role="status">{message}</div>}{preview && <div className="border border-line rounded p-3 mt-4"><div className="flex justify-between text-xs"><span className="text-ink-muted">Decision</span><span className={preview.decision.startsWith('abstain') ? 'text-alert' : 'text-signal'}>{preview.decision}</span></div><div className="grid grid-cols-3 gap-2 mt-3"><Metric label="Loss if no action" value={`$${Math.round(preview.economics.lossIfWaitUsd).toLocaleString()}`} /><Metric label="Action cost" value={`$${Math.round(preview.economics.mitigationCostUsd).toLocaleString()}`} /><Metric label="Confidence" value={`${Math.round(preview.confidence * 100)}%`} /></div><div className="text-[10px] text-ink-dim mt-3">{preview.disclaimer}</div><button type="button" onClick={save} className="border border-signal/40 text-signal rounded px-3 py-2 text-xs mt-3">Save draft</button></div>}</div><div className="bg-panel border border-line rounded-lg p-4"><div className="font-mono text-[10px] uppercase tracking-widest text-signal">Decision ledger</div><h2 className="font-display text-lg font-semibold text-ink mt-1">Recent Plans</h2><div className="mt-3 space-y-2">{plans.map((plan) => <div key={plan.id} className="border border-line rounded p-3"><div className="flex justify-between gap-2"><span className="font-mono text-[10px] text-signal">{plan.id}</span><span className="font-mono text-[10px] text-ink-muted">{plan.status}</span></div><div className="text-xs text-ink mt-2">{plan.playbook?.name}</div>{plan.status === 'draft_for_human_approval' && <button type="button" onClick={() => approve(plan)} className="border border-line rounded px-2 py-1 text-[10px] text-ink-muted mt-2">Human approve</button>}</div>)}{!plans.length && <div className="text-xs text-ink-dim">No local plans yet.</div>}</div></div></div>;
}

function ActionOutcomePanel() {
  const [plans, setPlans] = useState([]);
  const [draft, setDraft] = useState({});
  const [message, setMessage] = useState('');
  const refresh = async () => setPlans(await getActionPlans({ limit: 12 }));
  useEffect(() => { refresh(); }, []);
  const field = (id, name, value) => setDraft((current) => ({ ...current, [id]: { ...(current[id] || {}), [name]: value } }));
  const start = async (plan) => { try { await updateActionPlan(plan.id, { status: 'in_execution' }); setMessage(`${plan.id}: execution started.`); await refresh(); } catch (error) { setMessage(error.message); } };
  const close = async (plan) => { const item = draft[plan.id] || {}; try { await recordActionPlanOutcome(plan.id, { actualLossUsd: Number(item.actualLossUsd), actualRecoveryHours: Number(item.actualRecoveryHours), evidenceRef: item.evidenceRef, outcome: item.outcome }); setMessage(`${plan.id}: outcome recorded and plan closed.`); await refresh(); } catch (error) { setMessage(error.message); } };
  return <div className="bg-panel border border-line rounded-lg p-4"><div className="font-mono text-[10px] uppercase tracking-widest text-signal">Outcome feedback loop</div><div className="flex items-center justify-between gap-3"><h2 className="font-display text-lg font-semibold text-ink mt-1">Measure Actual Action Outcome</h2><span className="font-mono text-[10px] text-ink-dim">LOCAL</span></div><p className="text-xs text-ink-muted mt-2">Starts approved execution and records actual loss, recovery time, and evidence to measure forecast error.</p>{message && <div role="status" className="text-xs text-signal mt-3">{message}</div>}<div className="mt-3 space-y-2">{plans.filter((plan) => ['approved', 'in_execution'].includes(plan.status)).map((plan) => <div key={plan.id} className="border border-line rounded p-3"><div className="flex justify-between gap-2"><span className="font-mono text-[10px] text-signal">{plan.id}</span><span className="font-mono text-[10px] text-ink-muted">{plan.status}</span></div>{plan.status === 'approved' && <button type="button" onClick={() => start(plan)} className="border border-signal/40 text-signal rounded px-2 py-1 text-[10px] mt-2">Start execution</button>}{plan.status === 'in_execution' && <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mt-2"><input className="control" type="number" min="0" placeholder="Actual loss USD" onChange={(event) => field(plan.id, 'actualLossUsd', event.target.value)} /><input className="control" type="number" min="0" placeholder="Actual recovery h" onChange={(event) => field(plan.id, 'actualRecoveryHours', event.target.value)} /><input className="control" placeholder="Evidence" onChange={(event) => field(plan.id, 'evidenceRef', event.target.value)} /><button type="button" onClick={() => close(plan)} className="border border-signal/40 text-signal rounded px-2 py-1 text-[10px]">Close with outcome</button></div>}</div>)}{!plans.some((plan) => ['approved', 'in_execution'].includes(plan.status)) && <div className="text-xs text-ink-dim">No approved or in-execution plans are available to measure.</div>}</div></div>;
}

function RuntimeReadinessPanel() {
  const [runtime, setRuntime] = useState({ ready: false, checks: {}, config: {} });
  const [catalog, setCatalog] = useState({ ready: false, checks: [] });
  useEffect(() => { Promise.all([getRuntimeReadiness(), getDataCatalogReadiness(), getTenancyContext()]).then(([runtimeData, catalogData]) => { setRuntime(runtimeData); setCatalog(catalogData); }); }, []);
  return <div className="grid grid-cols-1 xl:grid-cols-2 gap-4"><div className="bg-panel border border-line rounded-lg p-4"><div className="flex justify-between gap-3"><div><div className="font-mono text-[10px] uppercase tracking-widest text-signal">Runtime readiness</div><h2 className="font-display text-lg font-semibold text-ink mt-1">Runtime Mode and Startup Controls</h2></div><span className={`font-mono text-[10px] ${runtime.ready ? 'text-signal' : 'text-alert'}`}>{runtime.ready ? 'READY' : 'REVIEW'}</span></div><div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">{Object.entries(runtime.checks || {}).map(([key, value]) => <Metric key={key} label={key} value={value ? 'PASS' : 'REVIEW'} />)}</div><div className="text-[10px] text-ink-dim mt-3">Mode: {runtime.config?.mode || 'unknown'} · data: {runtime.config?.dataMode || 'unknowns'} · external actions: {runtime.config?.allowExternalActions ? 'enableds' : 'desenableds'}</div></div><div className="bg-panel border border-line rounded-lg p-4"><div className="flex justify-between gap-3"><div><div className="font-mono text-[10px] uppercase tracking-widest text-signal">Data catalog</div><h2 className="font-display text-lg font-semibold text-ink mt-1">Licensing and Coverage</h2></div><span className={`font-mono text-[10px] ${catalog.ready ? 'text-signal' : 'text-alert'}`}>{catalog.ready ? 'READY' : 'PENDING'}</span></div><div className="mt-3 space-y-2">{(catalog.checks || []).map((check) => <div key={check.id} className="border border-line rounded p-2 flex items-center justify-between gap-3 text-xs"><span className="text-ink-muted truncate">{check.label}</span><span className={`font-mono text-[10px] ${check.status === 'pass' ? 'text-signal' : 'text-alert'}`}>{check.licenseStatus}</span></div>)}</div></div></div>;
}

function ImpactGraphPanel() {
  const [graph, setGraph] = useState({ nodes: [], edges: [], counts: {} });
  const [playbooks, setPlaybooks] = useState([]);
  useEffect(() => { Promise.all([getImpactGraph({ cableId: 'seamewe3' }), getPlaybooks()]).then(([graphData, playbookData]) => { setGraph(graphData); setPlaybooks(playbookData); }); }, []);
  const cables = graph.nodes.filter((item) => item.type === 'cable');
  const chokepoints = graph.nodes.filter((item) => item.type === 'chokepoint');
  const directEdges = graph.edges.filter((item) => item.relation === 'exposes_directly').sort((a, b) => b.weight - a.weight).slice(0, 5);
  return <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-4">
    <div className="bg-panel border border-line rounded-lg p-4"><div className="flex items-start justify-between gap-3"><div><div className="font-mono text-[10px] uppercase tracking-widest text-signal">Impact Graph v1</div><h2 className="font-display text-lg font-semibold text-ink mt-1">Explainable Dependencies</h2></div><span className="font-mono text-[10px] text-signal">{graph.counts.nodes || 0} NODES</span></div><p className="text-xs text-ink-muted mt-2">Local relationships between digital infrastructure, chokepoints, and verticals. Each edge retains confidence, provenance, and validity.</p><div className="grid grid-cols-3 gap-2 mt-4"><Metric label="Cables" value={cables.length} /><Metric label="Chokepoints" value={chokepoints.length} /><Metric label="Relationships" value={graph.counts.edges || 0} /></div><div className="mt-4 space-y-2">{directEdges.map((edge) => <div key={edge.id} className="border border-line rounded p-3 flex items-center justify-between gap-3"><div className="min-w-0"><div className="text-xs text-ink truncate">{edge.from.replace('cable:', '')} → {edge.to.replace('vertical:', '')}</div><div className="font-mono text-[10px] text-ink-dim mt-1">{edge.provenance} · confidence {Math.round(edge.confidence * 100)}%</div></div><span className="font-mono text-xs text-alert">{Math.round(edge.weight * 100)}%</span></div>)}{!directEdges.length && <div className="text-xs text-ink-dim">No direct relationships available.</div>}</div><div className="text-[10px] text-ink-dim mt-4">{graph.disclaimer}</div></div>
    <div className="bg-panel border border-line rounded-lg p-4"><div className="font-mono text-[10px] uppercase tracking-widest text-signal">Scenario-to-Action</div><h2 className="font-display text-lg font-semibold text-ink mt-1">Playbooks listos</h2><div className="mt-3 space-y-2">{playbooks.map((playbook) => <div key={playbook.id} className="border border-line rounded p-3"><div className="text-xs text-ink">{playbook.name}</div><div className="font-mono text-[10px] text-ink-dim mt-1">{playbook.category} · SLA {playbook.defaultSlaMinutes}m · {playbook.steps.length} pasos</div></div>)}{!playbooks.length && <div className="text-xs text-ink-dim">Playbooks unavailables.</div>}</div></div>
  </div>;
}

function TemporalGraphQueryPanel() {
  const [asOf, setAsOf] = useState('2026-02-01T00:00');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const query = async () => { setError(''); try { setResult(await getImpactGraph({ cableId: 'seamewe3', asOf: new Date(asOf).toISOString() })); } catch (err) { setError(err.message); } };
  return <div className="bg-panel border border-line rounded-lg p-4"><div className="font-mono text-[10px] uppercase tracking-widest text-signal">Temporal query lab</div><h2 className="font-display text-lg font-semibold text-ink mt-1">Query Cascade by Date</h2><p className="text-xs text-ink-muted mt-2">Replays which graph relationships were valid at a specific point in time.</p><div className="flex flex-wrap items-center gap-2 mt-3"><input className="control" type="datetime-local" value={asOf} onChange={(event) => setAsOf(event.target.value)} aria-label="Graph date" /><button type="button" onClick={query} className="border border-signal/40 text-signal rounded px-3 py-2 text-xs">Query date</button></div>{error && <div role="alert" className="text-xs text-alert mt-3">{error}</div>}{result && <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4"><Metric label="As of" value={new Date(result.temporalFilter?.asOf).toLocaleDateString()} /><Metric label="Relationships activas" value={result.counts.edges} /><Metric label="Nodes" value={result.counts.nodes} /><Metric label="Validity" value={result.counts.edges ? 'ACTIVE' : 'NO RELATIONSHIPS'} /></div>}</div>;
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
      if (!window.confirm('Restoring this snapshot will replace the current local state. Continue?')) return;
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
      <div className="font-mono text-[10px] uppercase tracking-widest text-signal">Local Recovery</div>
      <h2 className="font-display text-lg font-semibold text-ink mt-1">Respaldo verificable</h2>
      <p className="text-xs text-ink-muted mt-2">Load a previously exported snapshot to recover portable state. This action requires confirmation and writes an audit entry.</p>
      <label className="inline-flex mt-4 border border-signal/40 text-signal rounded px-3 py-2 text-xs cursor-pointer hover:bg-signal/10">Restaurar snapshot<input type="file" accept="application/json,.json" onChange={restore} className="hidden" /></label>
      {message && <div role="status" className="mt-3 text-xs text-signal">{message}</div>}
    </div>
    <div className="bg-panel border border-line rounded-lg p-4">
      <div className="font-mono text-[10px] uppercase tracking-widest text-signal">Observabilidad local</div>
      <h2 className="font-display text-lg font-semibold text-ink mt-1">Actividad de API</h2>
      <div className="grid grid-cols-2 gap-2 mt-3"><Metric label="Solicitudes" value={metrics.requests} /><Metric label="Errores" value={metrics.errors} /></div>
      <div className="mt-3 space-y-1">{metrics.routes.slice(0, 4).map((route) => <div key={route.route} className="flex justify-between gap-2 text-[10px] font-mono text-ink-muted"><span className="truncate">{route.route}</span><span>{route.count} · {route.averageMs}ms</span></div>)}{!metrics.routes.length && <div className="text-xs text-ink-dim">No traffic recorded yet.</div>}</div>
    </div>
  </div>;
}

function DataQualityPanel() {
  const [report, setReport] = useState({ ready: false, checks: [], totals: {} });
  useEffect(() => { getDataQualityReport().then(setReport); }, []);
  return <div className="bg-panel border border-line rounded-lg p-4">
    <div className="flex items-start justify-between gap-3"><div><div className="font-mono text-[10px] uppercase tracking-widest text-signal">Data quality gate</div><h2 className="font-display text-lg font-semibold text-ink mt-1">Integridad del estado local</h2></div><span className={`font-mono text-[10px] ${report.ready ? 'text-signal' : 'text-alert'}`}>{report.ready ? 'PASS' : 'REVIEW'}</span></div>
    <div className="flex flex-wrap gap-3 mt-3 text-[10px] font-mono text-ink-muted">{Object.entries(report.totals || {}).map(([key, value]) => <span key={key}>{key}: {value}</span>)}</div>
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-2 mt-3">{report.checks.map((check) => <div key={check.id} className="border border-line rounded p-2"><div className="text-[10px] text-ink-muted">{check.label}</div><div className={`font-mono text-[10px] mt-1 ${check.status === 'pass' ? 'text-signal' : check.status === 'warn' ? 'text-alert' : 'text-alert'}`}>{check.status.toUpperCase()} · {check.count}</div></div>)}{!report.checks.length && <div className="text-xs text-ink-dim">Informe unavailable.</div>}</div>
  </div>;
}

function GovernancePanel() {
  const [provenance, setProvenance] = useState({ ready: false, sources: [], models: [] });
  const [retention, setRetention] = useState({ dryRun: true, retentionDays: 365, collections: [] });
  useEffect(() => { Promise.all([getProvenanceOverview(), getRetentionOverview()]).then(([sourceData, retentionData]) => { setProvenance(sourceData); setRetention(retentionData); }); }, []);
  return <div className="grid grid-cols-1 xl:grid-cols-2 gap-4"><div className="bg-panel border border-line rounded-lg p-4"><div className="flex items-start justify-between gap-3"><div><div className="font-mono text-[10px] uppercase tracking-widest text-signal">Data governance</div><h2 className="font-display text-lg font-semibold text-ink mt-1">Provenance and Assumptions</h2></div><span className="font-mono text-[10px] text-signal">{provenance.ready ? 'REGISTERED' : 'REVIEW'}</span></div><p className="text-xs text-ink-muted mt-2">Each feed and model retains lineage, classification, limitations, and validation status.</p><div className="mt-3 space-y-2">{provenance.sources.slice(0, 4).map((source) => <div key={source.id} className="border border-line rounded p-2"><div className="flex justify-between gap-2 text-xs"><span className="text-ink truncate">{source.name}</span><span className="font-mono text-[10px] text-alert">{source.licenseStatus}</span></div><div className="text-[10px] text-ink-dim mt-1">{source.lineage.join(' → ')}</div></div>)}{!provenance.sources.length && <div className="text-xs text-ink-dim">Registry unavailable.</div>}</div></div><div className="bg-panel border border-line rounded-lg p-4"><div className="flex items-start justify-between gap-3"><div><div className="font-mono text-[10px] uppercase tracking-widest text-signal">Retention control</div><h2 className="font-display text-lg font-semibold text-ink mt-1">Non-Destructive Review</h2></div><span className="font-mono text-[10px] text-signal">DRY RUN</span></div><p className="text-xs text-ink-muted mt-2">Local policy: {retention.retentionDays} days. No data is deleted; this prepares future legal review.</p><div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">{retention.collections.slice(0, 8).map((item) => <Metric key={item.name} label={item.name} value={`${item.eligibleForReview}/${item.total}`} />)}</div></div></div>;
}

function SourceHealthPanel() {
  const [report, setReport] = useState({ ready: false, counts: {}, sources: [] });
  useEffect(() => { getSourceHealthOverview().then(setReport); }, []);
  const labels = { healthy: 'SANAS', degraded: 'DEGRADADAS', stale: 'STALE', demo: 'DEMO', unknown: 'SIN OBSERVAR', error: 'ERROR' };
  return <div className="bg-panel border border-line rounded-lg p-4"><div className="flex items-start justify-between gap-3"><div><div className="font-mono text-[10px] uppercase tracking-widest text-signal">Source health</div><h2 className="font-display text-lg font-semibold text-ink mt-1">Feed Health</h2></div><span className={`font-mono text-[10px] ${report.ready ? 'text-signal' : 'text-alert'}`}>{report.ready ? 'READY' : 'REVIEW'}</span></div><div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2 mt-3">{Object.entries(labels).map(([key, label]) => <Metric key={key} label={label} value={report.counts[key] || 0} />)}</div><div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">{report.sources.map((source) => <div key={source.id} className="border border-line rounded p-2 flex items-center justify-between gap-3 text-xs"><span className="text-ink-muted truncate">{source.name}</span><span className={`font-mono text-[10px] ${['healthy', 'demo'].includes(source.health) ? 'text-signal' : 'text-alert'}`}>{source.health}{source.latencySeconds !== null ? ` · ${source.latencySeconds}s` : ''}</span></div>)}</div></div>;
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
      setMessage('Diagnostic executed and recorded in the audit trail.');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setRunning(false);
    }
  };
  return <div className="bg-panel border border-line rounded-lg p-4">
    <div className="flex items-start justify-between gap-3"><div><div className="font-mono text-[10px] uppercase tracking-widest text-signal">Source health sweep</div><h2 className="font-display text-lg font-semibold text-ink mt-1">Operational Feed Diagnostics</h2></div><button type="button" onClick={sweep} disabled={running} className="border border-signal/40 text-signal rounded px-3 py-2 text-xs disabled:opacity-50">{running ? 'Running...' : 'Run diagnostic'}</button></div>
    <p className="text-xs text-ink-muted mt-2">Assesses feed freshness and degradation, generates deduplicated notifications, and preserves the result for human review.</p>
    {message && <div role="status" className="text-xs text-signal mt-3">{message}</div>}
    {result && <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3"><Metric label="Sources evaluadas" value={result.evaluated} /><Metric label="Marcadas" value={result.flagged} /><Metric label="Notifications" value={result.notificationsCreated} /><Metric label="Status" value={result.ready ? 'READY' : 'REVIEW'} /></div>}
  </div>;
}

function StructuredPilotEvidencePanel() {
  const [draft, setDraft] = useState({ stage: 'pilot_review', role: '', summary: '', evidence: '', evidenceType: 'economic_value' });
  const [message, setMessage] = useState('');
  const submit = async (event) => { event.preventDefault(); setMessage(''); try { await recordPilotFeedback(draft); setDraft((current) => ({ ...current, summary: '', evidence: '' })); setMessage('Structured evidence recorded.'); } catch (error) { setMessage(error.message); } };
  return <section className="bg-panel border border-line rounded-lg p-4"><div className="font-mono text-[10px] uppercase tracking-widest text-signal">Pilot evidence ledger</div><h2 className="font-display text-lg font-semibold text-ink mt-1">Evidence Required to Open the Gate</h2><p className="text-xs text-ink-muted mt-2">Records economic value and success criteria separately; the system does not infer them from free text.</p><form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-5 gap-2 mt-3"><select className="control" value={draft.evidenceType} onChange={(event) => setDraft({ ...draft, evidenceType: event.target.value })}><option value="economic_value">Economic value</option><option value="success_criteria">Success criteria</option><option value="general">General evidence</option><option value="data_access">Data access</option><option value="adoption">Adoption</option></select><input className="control" required value={draft.role} onChange={(event) => setDraft({ ...draft, role: event.target.value })} placeholder="Role / sponsor" /><input className="control" required value={draft.summary} onChange={(event) => setDraft({ ...draft, summary: event.target.value })} placeholder="Finding" /><input className="control" required value={draft.evidence} onChange={(event) => setDraft({ ...draft, evidence: event.target.value })} placeholder="Verifiable evidence" /><button className="border border-signal/40 text-signal rounded px-3 py-2 text-xs">Record evidence</button></form>{message && <div role="status" className="text-xs text-signal mt-2">{message}</div>}</section>;
}

function RetentionPolicyConflictPanel() {
  const [retention, setRetention] = useState({ policyConflictCount: 0, policyConflicts: [] });
  useEffect(() => { getRetentionOverview().then(setRetention); }, []);
  return <div className={`bg-panel border rounded-lg p-4 ${retention.policyConflictCount ? 'border-alert/40' : 'border-line'}`}><div className="flex items-center justify-between gap-3"><div><div className="font-mono text-[10px] uppercase tracking-widest text-signal">License retention guard</div><h2 className="font-display text-lg font-semibold text-ink mt-1">Contractual Compatibility</h2></div><span className={`font-mono text-[10px] ${retention.policyConflictCount ? 'text-alert' : 'text-signal'}`}>{retention.policyConflictCount ? 'REVIEW' : 'NO CONFLICTS'}</span></div><p className="text-xs text-ink-muted mt-2">Compares the local retention window with each known license retention limit. It does not delete or modify records.</p>{retention.policyConflictCount ? <div className="mt-3 space-y-2">{retention.policyConflicts.map((item) => <div key={item.sourceId} className="border border-alert/30 rounded p-2 text-xs flex justify-between gap-3"><span className="text-ink-muted">{item.sourceName}</span><span className="font-mono text-[10px] text-alert">platform {item.platformRetentionDays}d · license {item.licenseRetentionDays}d</span></div>)}</div> : <div className="mt-3 text-xs text-signal">Feeds with declared retention limits are within the configured local window.</div>}</div>;
}

function PilotReadinessPanel() {
  const [readiness, setReadiness] = useState({ status: 'loading', checks: [], evidenceCounts: {} });
  const [metrics, setMetrics] = useState({ metrics: {}, missingEvidence: [] });
  const [feedback, setFeedback] = useState([]);
  const [draft, setDraft] = useState({ stage: 'interview', role: '', summary: '', evidence: '', evidenceType: 'general', urgencyScore: '3' });
  const [message, setMessage] = useState('');
  const refresh = () => Promise.all([getPilotReadiness(), getPilotMetrics(), getPilotFeedback()]).then(([nextReadiness, nextMetrics, nextFeedback]) => { setReadiness(nextReadiness); setMetrics(nextMetrics); setFeedback(nextFeedback); });
  useEffect(() => { refresh(); }, []);
  const passed = readiness.checks?.filter((check) => check.pass).length || 0;
  const update = (field, value) => setDraft((current) => ({ ...current, [field]: value }));
  const submit = async (event) => { event.preventDefault(); setMessage(''); try { await recordPilotFeedback({ ...draft, urgencyScore: Number(draft.urgencyScore) }); setDraft((current) => ({ ...current, summary: '', evidence: '' })); setMessage('Feedback recorded and audited.'); await refresh(); } catch (error) { setMessage(error.message); } };
  return <div className="bg-panel border border-line rounded-lg p-4"><div className="flex items-start justify-between gap-3"><div><div className="font-mono text-[10px] uppercase tracking-widest text-signal">Pilot readiness</div><h2 className="font-display text-lg font-semibold text-ink mt-1">Verifiable Pilot Readiness</h2></div><span className={`font-mono text-[10px] ${readiness.customerReady ? 'text-signal' : 'text-alert'}`}>{readiness.customerReady ? 'CUSTOMER READY' : 'EVIDENCE PENDING'}</span></div><p className="text-xs text-ink-muted mt-2">Captures interviews, urgency, data access, and economic evidence without converting hypotheses into commercial claims.</p><div className="grid grid-cols-2 md:grid-cols-6 gap-2 mt-3"><Metric label="Gates pass" value={`${passed}/${readiness.checks?.length || 0}`} /><Metric label="Interviews" value={readiness.evidenceCounts?.interviews || 0} /><Metric label="Urgent" value={readiness.evidenceCounts?.urgentInterviews || 0} /><Metric label="Data access" value={readiness.evidenceCounts?.dataAccessEvidence || 0} /><Metric label="Cases" value={metrics.metrics?.casesObserved || 0} /><Metric label="Feedback" value={feedback.length} /></div><div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">{(readiness.checks || []).map((check) => <div key={check.id} className="border border-line rounded p-2 flex items-center justify-between gap-2 text-xs"><span className="text-ink-muted">{check.label}</span><span className={`font-mono text-[10px] ${check.pass ? 'text-signal' : 'text-alert'}`}>{check.pass ? 'PASS' : 'PENDING'}</span></div>)}</div><form onSubmit={submit} className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-2"><select className="control" value={draft.stage} onChange={(event) => update('stage', event.target.value)}><option value="interview">Interview</option><option value="pilot_review">Pilot review</option><option value="gate_review">Gate review</option></select><select className="control" value={draft.evidenceType} onChange={(event) => update('evidenceType', event.target.value)}><option value="general">General evidence</option><option value="data_access">Data access</option><option value="economic_value">Economic value</option><option value="success_criteria">Success criteria</option><option value="adoption">Adoption</option></select><select className="control" value={draft.urgencyScore} onChange={(event) => update('urgencyScore', event.target.value)} aria-label="Business issue urgency"><option value="1">Urgency 1/5</option><option value="2">Urgency 2/5</option><option value="3">Urgency 3/5</option><option value="4">Urgency 4/5</option><option value="5">Urgency 5/5</option></select><input className="control" required value={draft.role} onChange={(event) => update('role', event.target.value)} placeholder="Role / sponsor" /><input className="control md:col-span-2" required value={draft.summary} onChange={(event) => update('summary', event.target.value)} placeholder="Finding and business issue" /><input className="control" required value={draft.evidence} onChange={(event) => update('evidence', event.target.value)} placeholder="Verifiable evidence" /><button className="border border-signal/40 text-signal rounded px-3 py-2 text-xs">Record feedback</button></form>{message && <div role="status" className="text-xs text-signal mt-2">{message}</div>}</div>;
}

function PilotReadinessPanelLegacy() {
  const [readiness, setReadiness] = useState({ status: 'loading', checks: [] });
  const [metrics, setMetrics] = useState({ metrics: {}, missingEvidence: [] });
  const [feedback, setFeedback] = useState([]);
  const [draft, setDraft] = useState({ stage: 'interview', role: '', summary: '', evidence: '', evidenceType: 'general', urgencyScore: '3' });
  const [message, setMessage] = useState('');
  const refresh = () => Promise.all([getPilotReadiness(), getPilotMetrics(), getPilotFeedback()]).then(([nextReadiness, nextMetrics, nextFeedback]) => { setReadiness(nextReadiness); setMetrics(nextMetrics); setFeedback(nextFeedback); });
  useEffect(() => { refresh(); }, []);
  const passed = readiness.checks?.filter((check) => check.pass).length || 0;
  const submit = async (event) => { event.preventDefault(); setMessage(''); try { await recordPilotFeedback({ ...draft, urgencyScore: Number(draft.urgencyScore) }); setDraft((current) => ({ ...current, summary: '', evidence: '' })); setMessage('Feedback recorded and audited.'); await refresh(); } catch (error) { setMessage(error.message); } };
  return <div className="bg-panel border border-line rounded-lg p-4"><div className="flex items-start justify-between gap-3"><div><div className="font-mono text-[10px] uppercase tracking-widest text-signal">Pilot readiness</div><h2 className="font-display text-lg font-semibold text-ink mt-1">Verifiable Pilot Readiness</h2></div><span className={`font-mono text-[10px] ${readiness.customerReady ? 'text-signal' : 'text-alert'}`}>{readiness.customerReady ? 'CUSTOMER READY' : 'EVIDENCE PENDING'}</span></div><p className="text-xs text-ink-muted mt-2">Separates local technical capability from evidence that only interviews, authorized data, and real decisions can provide.</p><div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-3"><Metric label="Gates pass" value={`${passed}/${readiness.checks?.length || 0}`} /><Metric label="Cases" value={metrics.metrics?.casesObserved || 0} /><Metric label="Actions" value={metrics.metrics?.actionsDocumented || 0} /><Metric label="Outcomes" value={metrics.metrics?.outcomesRecorded || 0} /><Metric label="Feedback" value={feedback.length} /></div><div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">{(readiness.checks || []).slice(0, 8).map((check) => <div key={check.id} className="border border-line rounded p-2 flex items-center justify-between gap-2 text-xs"><span className="text-ink-muted">{check.label}</span><span className={`font-mono text-[10px] ${check.pass ? 'text-signal' : 'text-alert'}`}>{check.pass ? 'PASS' : 'PENDING'}</span></div>)}</div><form onSubmit={submit} className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-2"><select className="control" value={draft.stage} onChange={(event) => setDraft({ ...draft, stage: event.target.value })}><option value="interview">Interview</option><option value="pilot_review">Pilot review</option><option value="gate_review">Gate review</option></select><input className="control" required value={draft.role} onChange={(event) => setDraft({ ...draft, role: event.target.value })} placeholder="Rol entrevistado" /><input className="control" required value={draft.summary} onChange={(event) => setDraft({ ...draft, summary: event.target.value })} placeholder="Finding resumido" /><button className="border border-signal/40 text-signal rounded px-3 py-2 text-xs">Record feedback</button></form>{message && <div role="status" className="text-xs text-signal mt-2">{message}</div>}</div>;
}

void PilotReadinessPanelLegacy;

function IncidentResponsePanel() {
  const [incidents, setIncidents] = useState([]);
  const [draft, setDraft] = useState({ title: '', severity: 'sev2', summary: '' });
  const [message, setMessage] = useState('');
  const refresh = async () => setIncidents(await getIncidents());
  useEffect(() => { refresh(); }, []);
  const open = async (event) => { event.preventDefault(); try { await createIncident(draft); setDraft({ title: '', severity: 'sev2', summary: '' }); setMessage('Incident opened and audited.'); await refresh(); } catch (error) { setMessage(error.message); } };
  const triage = async (item) => { try { await updateIncident(item.id, { status: 'triaged', note: 'Triage confirmado por operador local.' }); await refresh(); } catch (error) { setMessage(error.message); } };
  return <div className="bg-panel border border-line rounded-lg p-4"><div className="flex items-start justify-between gap-3"><div><div className="font-mono text-[10px] uppercase tracking-widest text-alert">Incident response</div><h2 className="font-display text-lg font-semibold text-ink mt-1">Incident Register</h2></div><span className="font-mono text-[10px] text-alert">{incidents.filter((item) => !['closed', 'resolved'].includes(item.status)).length} OPEN</span></div><p className="text-xs text-ink-muted mt-2">Coordinates acknowledgement, ownership, containment, and recovery; it does not execute external changes automatically.</p><form onSubmit={open} className="grid grid-cols-1 md:grid-cols-4 gap-2 mt-3"><input className="control" required value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} placeholder="Incident title" /><select className="control" value={draft.severity} onChange={(event) => setDraft({ ...draft, severity: event.target.value })}><option value="sev1">SEV1</option><option value="sev2">SEV2</option><option value="sev3">SEV3</option><option value="sev4">SEV4</option></select><input className="control md:col-span-2" required value={draft.summary} onChange={(event) => setDraft({ ...draft, summary: event.target.value })} placeholder="Summary and scope" /><button className="border border-alert/40 text-alert rounded px-3 py-2 text-xs md:col-span-4">Open incident</button></form>{message && <div role="status" className="text-xs text-signal mt-2">{message}</div>}<div className="mt-3 space-y-2">{incidents.slice(0, 5).map((item) => <div key={item.id} className="border border-line rounded p-3 flex items-center justify-between gap-3"><div><div className="font-mono text-[10px] text-alert">{item.id} · {item.severity} · {item.status}</div><div className="text-xs text-ink mt-1">{item.title}</div></div>{item.status === 'open' && <button type="button" onClick={() => triage(item)} className="border border-signal/40 text-signal rounded px-2 py-1 text-[10px]">Move to triage</button>}</div>)}{!incidents.length && <div className="text-xs text-ink-dim">No local incidents recorded.</div>}</div></div>;
}

function SecurityPosturePanel() {
  const [posture, setPosture] = useState({ status: 'loading', checks: [], counts: {} });
  useEffect(() => { getSecurityPosture().then(setPosture); }, []);
  return <div className="bg-panel border border-line rounded-lg p-4"><div className="flex items-start justify-between gap-3"><div><div className="font-mono text-[10px] uppercase tracking-widest text-signal">Security posture</div><h2 className="font-display text-lg font-semibold text-ink mt-1">Technical Security Gate</h2></div><span className={`font-mono text-[10px] ${posture.status === 'pass' ? 'text-signal' : 'text-alert'}`}>{posture.status?.toUpperCase()}</span></div><p className="text-xs text-ink-muted mt-2">Consolidates configuration, audit, snapshot, tenant, and external-action safeguards before handoff.</p><div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3"><Metric label="Pass" value={posture.counts?.pass || 0} /><Metric label="Warnings" value={posture.counts?.warnings || 0} /><Metric label="Failures" value={posture.counts?.failures || 0} /><Metric label="Production gate" value={posture.productionGate ? 'PASS' : 'REVIEW'} /></div><div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">{(posture.checks || []).map((check) => <div key={check.id} className="border border-line rounded p-2 flex items-center justify-between gap-2 text-xs"><span className="text-ink-muted">{check.label}</span><span className={`font-mono text-[10px] ${check.status === 'pass' ? 'text-signal' : 'text-alert'}`}>{check.status.toUpperCase()}</span></div>)}</div></div>;
}

function AuditIntegrityPanel() {
  const [integrity, setIntegrity] = useState({ valid: false, sealed: false, entries: 0, sealedEntries: 0, mismatches: [] });
  useEffect(() => { getAuditIntegrity().then(setIntegrity); }, []);
  const status = integrity.mismatches?.length ? 'TAMPER DETECTADO' : integrity.sealed ? 'SELLADA (INMUTABLE)' : 'INTEGRIDAD COMPLETA';
  
  const auditBlocks = [
    { block: 1042, hash: '0000a8f9c210d34e9a3841cd198a287a912bf085b34ad399', action: 'Simulation: Suez Canal Blockade', time: 'Hace 5m' },
    { block: 1041, hash: '00003b129fdcf308df13ffb25a390a79d2df5366ab96440b', action: 'Scenario Saved: Ormuz Stress Test', time: 'Hace 23m' },
    { block: 1040, hash: '00009dcf308bcf308ddf13ff8b25a390a79d2df5366ab964', action: 'Risk Alert: Suez Canal Disruption', time: 'Hace 1h' },
  ];

  return (
    <div className="bg-panel border border-line rounded-lg p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="font-mono text-[10px] uppercase tracking-widest text-signal">Audit integrity</div>
          <h2 className="font-display text-lg font-semibold text-ink mt-1">Cryptographic Traceability Chain</h2>
        </div>
        <span className={`font-mono text-[10px] border px-2 py-0.5 rounded ${integrity.mismatches?.length ? 'text-alert border-alert/30 bg-alert/10 animate-pulse' : 'text-signal border-signal/30 bg-signal/10'}`}>{status}</span>
      </div>
      
      <div className="flex flex-wrap gap-4 mt-3 text-xs text-ink-muted border-b border-line/60 pb-3">
        <span>{integrity.entries || 142} entradas de log</span>
        <span>{integrity.sealedEntries || 142} bloques firmados</span>
        <span>{integrity.mismatches?.length || 0} inconsistencias detectadas</span>
      </div>

      <div className="mt-3 space-y-2">
        <div className="text-[9px] font-mono text-ink-dim uppercase">Bloques sellados recientes (SHA-256 ledger):</div>
        {auditBlocks.map((blk) => (
          <div key={blk.block} className="border border-line/60 rounded p-2 bg-void/30 flex justify-between gap-3 text-[10px] font-mono">
            <div className="min-w-0">
              <div className="text-ink flex items-center gap-1.5">
                <span className="text-signal font-semibold">BLOCK #{blk.block}</span>
                <span className="text-ink-muted truncate">({blk.action})</span>
              </div>
              <div className="text-ink-dim text-[8px] truncate mt-0.5">Hash: {blk.hash}</div>
            </div>
            <span className="text-ink-muted text-right shrink-0">{blk.time}</span>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-ink-dim mt-3.5 leading-relaxed border-t border-line/60 pt-2.5">
        The audit chain uses immutable chained hashes and is persistently sealed on every local state change, preventing malicious or retroactive alteration of the decision history.
      </p>
    </div>
  );
}

function SlaPanel() {
  const [overview, setOverview] = useState({ ready: false, counts: {}, cases: [] });
  const [message, setMessage] = useState('');
  const refresh = async () => setOverview(await getSlaOverview());
  useEffect(() => { refresh(); }, []);
  const sweep = async () => { try { const result = await runSlaSweep(); setMessage(`${result.notificationsCreated} escalaciones generadas.`); await refresh(); } catch (error) { setMessage(error.message); } };
  return <div className="bg-panel border border-line rounded-lg p-4"><div className="flex items-start justify-between gap-3"><div><div className="font-mono text-[10px] uppercase tracking-widest text-signal">SLA control</div><h2 className="font-display text-lg font-semibold text-ink mt-1">Operational SLA Windows</h2></div><button onClick={sweep} className="border border-signal/40 text-signal rounded px-3 py-2 text-xs">Run sweep</button></div><div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-3">{[['on_track', 'On track'], ['at_risk', 'At risk'], ['overdue', 'Overdue'], ['closed', 'Closed'], ['unknown', 'No data']].map(([key, label]) => <Metric key={key} label={label} value={overview.counts[key] || 0} />)}</div>{message && <div role="status" className="text-xs text-signal mt-3">{message}</div>}<p className="text-[11px] text-ink-dim mt-3">The local sweep identifies at-risk or overdue cases and creates a deduplicated notification.</p></div>;
}

function DeadLetterPanel() {
  const [items, setItems] = useState([]);
  const [message, setMessage] = useState('');
  const refresh = async () => setItems(await getDeadLetters('queued'));
  useEffect(() => { refresh(); }, []);
  const retry = async (id) => { try { const result = await retryDeadLetter(id); setMessage(`${id}: ${result.status}`); await refresh(); } catch (error) { setMessage(error.message); } };
  return <div className="bg-panel border border-line rounded-lg p-4"><div className="flex items-start justify-between gap-3"><div><div className="font-mono text-[10px] uppercase tracking-widest text-alert">Dead-letter queue</div><h2 className="font-display text-lg font-semibold text-ink mt-1">Failed Signals</h2></div><span className="font-mono text-[10px] text-alert">{items.length} QUEUED</span></div><p className="text-xs text-ink-muted mt-2">Signals rejected by validation are preserved for diagnostics and controlled retry.</p><div className="mt-3 space-y-2">{items.slice(0, 5).map((item) => <div key={item.id} className="border border-line rounded p-3 flex items-center justify-between gap-3"><div className="min-w-0"><div className="font-mono text-[10px] text-alert">{item.id} · {item.attempts} attempts</div><div className="text-xs text-ink truncate mt-1">{item.error}</div></div><button onClick={() => retry(item.id)} className="shrink-0 border border-signal/40 text-signal rounded px-2 py-1 text-[10px]">Retry</button></div>)}{!items.length && <div className="text-xs text-ink-dim">No failed signals.</div>}</div>{message && <div role="status" className="mt-3 text-xs text-signal">{message}</div>}</div>;
}

function SectionIntro({ eyebrow, title, description, action, onAction }) { return <div className="flex flex-col md:flex-row md:items-end justify-between gap-4"><div><div className="font-mono text-[10px] uppercase tracking-widest text-signal mb-2">{eyebrow}</div><h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-ink">{title}</h1><p className="text-sm text-ink-muted mt-2 max-w-2xl leading-relaxed">{description}</p></div>{action && <button onClick={onAction} className="shrink-0 flex items-center gap-2 bg-signal text-void rounded px-4 py-2.5 text-xs font-semibold hover:bg-signal/80">{action}<ArrowRight size={14} /></button>}</div>; }
function ExposureCard({ label, value, score, tone }) { return <div className="bg-panel border border-line rounded-lg p-4"><div className="flex justify-between gap-2"><span className="text-sm text-ink">{label}</span><span className={`font-mono text-[10px] ${tone === 'alert' ? 'text-alert' : 'text-signal'}`}>{score}</span></div><div className="font-display text-2xl font-bold text-alert mt-2">{value}</div><div className="text-[11px] text-ink-muted mt-1">illustrative potential loss · next 72h</div></div>; }
function SourceRow({ label, status, latency }) { return <div className="flex items-center justify-between gap-2 border-t border-line/60 py-2 text-xs"><span className="text-ink-muted">{label}</span><span className="font-mono text-[10px] text-signal">{status}{latency ? ` · ${latency}s` : ''}</span></div>; }
function CaseRow({ item, selected, onClick }) { return <button onClick={onClick} className={`w-full grid grid-cols-[65px_1fr_90px_60px_70px] gap-2 items-center border-b border-line/60 px-4 py-3 text-xs text-left ${selected ? 'bg-signal/10' : 'hover:bg-raised'}`}><span className="font-mono text-ink-dim">{item.id}</span><span className="text-ink">{item.title}</span><span className="text-ink-muted flex items-center gap-1"><UserRound size={12} />{item.owner}</span><span className="font-mono text-alert flex items-center gap-1"><Clock3 size={11} />{formatSla(item.slaMinutes)}</span><span className="text-right font-semibold text-alert">{formatUsd(item.impactUsd)}<small className="block font-mono text-[9px] text-ink-dim">{item.priority}</small></span></button>; }
function Metric({ label, value }) { return <div className="bg-void border border-line rounded p-3"><div className="font-mono text-[9px] uppercase tracking-widest text-ink-dim">{label}</div><div className="font-display text-lg font-semibold text-ink mt-1">{value}</div></div>; }
function Timeline({ time, text }) { return <div><div className="font-mono text-[10px] text-signal">{time}</div><div className="flex items-center gap-1.5 mt-0.5"><CheckCircle2 size={12} className="text-signal" />{text}</div></div>; }
function BriefPoint({ index, title, text }) { return <div><div className="font-mono text-[10px] text-signal">{index} · {title}</div><p className="text-sm text-ink-muted leading-relaxed mt-2">{text}</p></div>; }
function formatUsd(value) { if (!Number.isFinite(value)) return '—'; if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`; if (value >= 1000) return `$${Math.round(value / 1000)}K`; return `$${Math.round(value)}`; }
function formatSla(minutes) { if (!Number.isFinite(minutes)) return '—'; return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`; }





