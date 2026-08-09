export function buildEnterpriseReadiness({ runtime, environmentContract, security, catalog, modelGovernance = [], actionLibrary, releaseGate = null, schemaAudit = null } = {}) {
  const localChecks = [
    { id: 'runtime', label: 'Runtime local', pass: Boolean(runtime?.ready), evidence: runtime?.ready ? 'readiness pass' : 'configuracion requiere revision' },
    { id: 'configuration_contract', label: 'Contrato de configuracion', pass: Boolean(environmentContract?.ready), evidence: environmentContract?.ready ? 'contract pass' : 'contract incompleto' },
    { id: 'security', label: 'Postura de seguridad local', pass: ['pass', 'review'].includes(security?.status), evidence: security?.status || 'no disponible' },
    { id: 'schema', label: 'Esquema enterprise preparado', pass: schemaAudit === true, evidence: schemaAudit === true ? 'auditoria SQL local confirmada' : 'auditoria SQL no confirmada en esta ejecucion' },
    { id: 'release', label: 'Release evidence local', pass: releaseGate === true, evidence: releaseGate === true ? 'release gate confirmado' : 'release gate no confirmado en esta ejecucion' },
  ];
  const externalChecks = [
    { id: 'licensed_data', label: 'Datos licenciados', pass: Boolean(catalog?.ready), evidence: catalog?.ready ? 'licencias activas' : 'licencias/cobertura pendientes' },
    { id: 'historical_validation', label: 'Backtesting historico', pass: modelGovernance.length > 0 && modelGovernance.every((item) => item.decision === 'candidate_for_human_review'), evidence: modelGovernance.length ? 'gobernanza local registrada' : 'sin gobernanza' },
    { id: 'action_catalog', label: 'Catalogo comercial de acciones', pass: Boolean(actionLibrary?.ready), evidence: actionLibrary?.ready ? 'readiness pass' : 'disponibilidad comercial pendiente' },
    { id: 'supabase', label: 'Supabase/RLS staging', pass: false, evidence: 'requiere proyecto externo y prueba con dos organizaciones' },
    { id: 'hosting', label: 'Hosting y observabilidad', pass: false, evidence: 'requiere GitHub/Vercel/backend productivo' },
    { id: 'pilot', label: 'Piloto con cliente', pass: false, evidence: 'requiere entrevistas, datos autorizados y outcomes reales' },
  ];
  const blocking = [...localChecks, ...externalChecks].filter((item) => !item.pass);
  const localReady = localChecks.every((item) => item.pass);
  return { schemaVersion: '1.0.0-local', generatedAt: new Date().toISOString(), scope: 'enterprise-handoff', status: localReady ? 'ready_for_external_handoff' : 'local_review_required', localReady, externalReady: externalChecks.every((item) => item.pass), decision: localReady ? 'proceed_to_external_gates' : 'continue_local_hardening', localChecks, externalChecks, blocking, nextStep: localReady ? 'Ejecutar GitHub -> Supabase staging -> Vercel/hosting -> piloto controlado.' : 'Resolver los checks locales fallidos antes del handoff.', disclaimer: 'Readiness de handoff; no certifica produccion, seguridad, licencias, cumplimiento ni valor comercial.' };
}
