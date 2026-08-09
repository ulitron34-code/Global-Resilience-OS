import { buildActionPlan, getPlaybook } from './playbooks.js';
import { attachDecisionEvidence } from './decisionEvidence.js';

const PLAYBOOK_BY_EVENT = { cable_degradation: 'cable-degradation', ais_gap: 'reroute-critical-flow', port_delay: 'port-congestion', source_health: 'source-quality-degradation', market_move: 'reroute-critical-flow' };

export function buildAssistiveSuggestion(input = {}, { dataQualityGate = { ready: false }, modelGovernance = null } = {}) {
  const eventType = String(input.eventType || 'source_health');
  const playbookId = PLAYBOOK_BY_EVENT[eventType] || 'reroute-critical-flow';
  const playbook = getPlaybook(playbookId);
  const confidence = Number.isFinite(Number(input.confidence)) ? Math.max(0, Math.min(1, Number(input.confidence))) : 0.45;
  const plan = attachDecisionEvidence(buildActionPlan({ playbookId, confidence, lossIfWaitUsd: input.impactUsd, mitigationCostUsd: input.mitigationCostUsd, protectedValueUsd: input.protectedValueUsd, trigger: eventType, caseId: input.caseId }), input);
  const abstainReasons = [];
  if (!dataQualityGate.ready) abstainReasons.push('material_data_gate_not_ready');
  if (confidence < 0.5) abstainReasons.push('insufficient_signal_confidence');
  if (modelGovernance?.decision === 'abstain_for_production') abstainReasons.push('model_not_ready_for_production');
  return { schemaVersion: '1.0.0-local', generatedAt: new Date().toISOString(), agent: { id: 'local-triage-assistant', version: '0.1.0', mode: 'suggestion_only' }, decision: abstainReasons.length ? 'abstain' : 'suggest', abstainReasons, suggestion: { playbookId, playbookName: playbook?.name, rationale: `Evento ${eventType} con severidad ${input.severity || 'medium'}; se propone revisar el playbook correspondiente.`, nextSteps: (playbook?.steps || []).slice(0, 5), actionPlanPreview: plan }, guardrails: { humanApprovalRequired: true, externalActionsAllowed: false, automaticExecution: false, maxScope: 'single_event_review' }, evidence: { inputFieldsUsed: ['eventType', 'severity', 'confidence', 'impactUsd'], dataQualityDecision: dataQualityGate.decision || 'unknown', modelDecision: modelGovernance?.decision || 'unknown' }, disclaimer: 'Sugerencia asistiva local. No ejecuta acciones ni sustituye al analista responsable.' };
}
