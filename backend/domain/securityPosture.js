export function buildSecurityPosture({ runtime, audit, tenancy, snapshot }) {
  const externalActionsDisabled = runtime?.checks?.externalActionsDisabledByDefault ?? !runtime?.config?.allowExternalActions;
  const checks = [
    { id: 'auth_required', label: 'Autenticación obligatoria', status: runtime?.config?.authRequired ? 'pass' : 'warn', evidence: runtime?.config?.authRequired ? 'AUTH_REQUIRED=true' : 'modo demo/local' },
    { id: 'secret', label: 'Secreto de sesión configurado', status: runtime?.config?.authSecretConfigured ? 'pass' : 'warn', evidence: runtime?.config?.authSecretConfigured ? `${runtime.config.authSecretLength} caracteres` : 'AUTH_SECRET ausente' },
    { id: 'cors', label: 'CORS explícito', status: runtime?.config?.corsConfigured ? 'pass' : 'warn', evidence: runtime?.config?.corsConfigured ? 'orígenes configurados' : 'CORS abierto para desarrollo' },
    { id: 'data_mode', label: 'Modo de datos controlado', status: runtime?.config?.dataMode !== 'illustrative' ? 'pass' : 'warn', evidence: runtime?.config?.dataMode || 'illustrative' },
    { id: 'external_actions', label: 'Acciones externas deshabilitadas', status: externalActionsDisabled ? 'pass' : 'fail', evidence: externalActionsDisabled ? 'ALLOW_EXTERNAL_ACTIONS=false' : 'guard no confirmado' },
    { id: 'audit', label: 'Cadena de auditoría íntegra', status: audit?.valid ? 'pass' : 'fail', evidence: `${audit?.entries || 0} entradas, ${audit?.mismatches?.length || 0} inconsistencias` },
    { id: 'snapshot', label: 'Snapshot local disponible', status: snapshot?.state ? 'pass' : 'fail', evidence: snapshot?.state ? 'snapshot exportable' : 'snapshot no disponible' },
    { id: 'tenant', label: 'Organización activa', status: tenancy?.organizationId ? 'pass' : 'fail', evidence: tenancy?.organizationId || 'sin tenant' },
  ];
  const blocking = checks.filter((check) => check.status === 'fail');
  const warnings = checks.filter((check) => check.status === 'warn');
  return { scope: 'local-security-posture', status: blocking.length ? 'fail' : warnings.length ? 'review' : 'pass', checks, counts: { total: checks.length, pass: checks.filter((check) => check.status === 'pass').length, warnings: warnings.length, failures: blocking.length }, productionGate: blocking.length === 0 && warnings.length === 0, disclaimer: 'Postura local de seguridad; no sustituye revisión independiente, pentest, vault, RLS, SSO/MFA ni certificación.' };
}
