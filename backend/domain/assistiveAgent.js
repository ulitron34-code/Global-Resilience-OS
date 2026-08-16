import { buildActionPlan, getPlaybook } from './playbooks.js';
import { attachDecisionEvidence } from './decisionEvidence.js';

const PLAYBOOK_BY_EVENT = { cable_degradation: 'cable-degradation', ais_gap: 'reroute-critical-flow', port_delay: 'port-congestion', source_health: 'source-quality-degradation', market_move: 'reroute-critical-flow' };

export async function buildAssistiveSuggestion(input = {}, { dataQualityGate = { ready: false }, modelGovernance = null } = {}) {
  const eventType = String(input.eventType || 'source_health');
  const playbookId = PLAYBOOK_BY_EVENT[eventType] || 'reroute-critical-flow';
  const playbook = getPlaybook(playbookId);
  const confidence = Number.isFinite(Number(input.confidence)) ? Math.max(0, Math.min(1, Number(input.confidence))) : 0.45;
  const plan = attachDecisionEvidence(buildActionPlan({ playbookId, confidence, lossIfWaitUsd: input.impactUsd, mitigationCostUsd: input.mitigationCostUsd, protectedValueUsd: input.protectedValueUsd, trigger: eventType, caseId: input.caseId }), input);
  const abstainReasons = [];
  if (!dataQualityGate.ready) abstainReasons.push('material_data_gate_not_ready');
  if (confidence < 0.5) abstainReasons.push('insufficient_signal_confidence');
  if (modelGovernance?.decision === 'abstain_for_production') abstainReasons.push('model_not_ready_for_production');

  const result = {
    schemaVersion: '1.0.0-local',
    generatedAt: new Date().toISOString(),
    agent: { id: 'local-triage-assistant', version: '0.1.0', mode: 'suggestion_only' },
    decision: abstainReasons.length ? 'abstain' : 'suggest',
    abstainReasons,
    suggestion: {
      playbookId,
      playbookName: playbook?.name,
      rationale: `Evento ${eventType} con severidad ${input.severity || 'medium'}; se propone revisar el playbook correspondiente.`,
      nextSteps: (playbook?.steps || []).slice(0, 5),
      actionPlanPreview: plan
    },
    guardrails: { humanApprovalRequired: true, externalActionsAllowed: false, automaticExecution: false, maxScope: 'single_event_review' },
    evidence: { inputFieldsUsed: ['eventType', 'severity', 'confidence', 'impactUsd'], dataQualityDecision: dataQualityGate.decision || 'unknown', modelDecision: modelGovernance?.decision || 'unknown' },
    disclaimer: 'Sugerencia asistiva local. No ejecuta acciones ni sustituye al analista responsable.'
  };

  // Conexión externa para IA (si se proporcionan llaves en el entorno)
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 500,
          messages: [{
            role: 'user',
            content: `Analiza este evento de resiliencia y escribe un rationale corto en español (máx 3 frases) y 3 próximos pasos específicos.
            Evento: ${JSON.stringify(input)}
            Responde en formato JSON únicamente, con este esquema: {"rationale": "...", "nextSteps": ["paso 1", "paso 2", "paso 3"]}`
          }]
        })
      });
      if (response.ok) {
        const data = await response.json();
        const text = data.content?.[0]?.text;
        const parsed = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] || '{}');
        if (parsed.rationale) {
          result.suggestion.rationale = parsed.rationale;
          result.agent.mode = 'llm_generation';
        }
        if (Array.isArray(parsed.nextSteps)) {
          result.suggestion.nextSteps = parsed.nextSteps;
        }
      }
    } catch (e) {
      console.warn('Fallo al llamar la API de Anthropic, usando fallback local:', e.message);
    }
  } else if (process.env.OPENAI_API_KEY) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'content-type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens: 500,
          response_format: { type: "json_object" },
          messages: [{
            role: 'user',
            content: `Analiza este evento de resiliencia y escribe un rationale corto en español (máx 3 frases) y 3 próximos pasos específicos.
            Evento: ${JSON.stringify(input)}
            Responde en formato JSON únicamente: {"rationale": "...", "nextSteps": ["paso 1", "paso 2", "paso 3"]}`
          }]
        })
      });
      if (response.ok) {
        const data = await response.json();
        const parsed = JSON.parse(data.choices?.[0]?.message?.content || '{}');
        if (parsed.rationale) {
          result.suggestion.rationale = parsed.rationale;
          result.agent.mode = 'llm_generation';
        }
        if (Array.isArray(parsed.nextSteps)) {
          result.suggestion.nextSteps = parsed.nextSteps;
        }
      }
    } catch (e) {
      console.warn('Fallo al llamar la API de OpenAI, usando fallback local:', e.message);
    }
  }

  return result;
}
